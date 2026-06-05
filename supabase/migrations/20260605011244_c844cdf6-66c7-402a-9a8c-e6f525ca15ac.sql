-- Trigger function: on subscription activation, fill dates + premium flag
CREATE OR REPLACE FUNCTION public.handle_subscription_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When becoming active
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF NEW.start_at IS NULL THEN
      NEW.start_at := now();
    END IF;
    IF NEW.end_at IS NULL THEN
      NEW.end_at := COALESCE(NEW.start_at, now()) + INTERVAL '30 days';
    END IF;
    IF NEW.approved_at IS NULL THEN
      NEW.approved_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_status_change ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_status_change
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_subscription_status_change();

-- After update: sync is_premium on technicians/companies
CREATE OR REPLACE FUNCTION public.sync_premium_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_type = 'technician' THEN
    IF NEW.status = 'active' AND NEW.plan = 'premium' THEN
      UPDATE public.technicians SET is_premium = true WHERE id = NEW.owner_id;
    ELSIF NEW.status IN ('expired', 'rejected') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
      -- Only clear if no other active premium sub
      IF NOT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE owner_id = NEW.owner_id
          AND status = 'active'
          AND plan = 'premium'
          AND id <> NEW.id
          AND (end_at IS NULL OR end_at > now())
      ) THEN
        UPDATE public.technicians SET is_premium = false WHERE id = NEW.owner_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_sync_premium ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_sync_premium
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_premium_flag();

-- Function to expire due subscriptions (callable by admin or cron)
CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_at IS NOT NULL
    AND end_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO authenticated;
