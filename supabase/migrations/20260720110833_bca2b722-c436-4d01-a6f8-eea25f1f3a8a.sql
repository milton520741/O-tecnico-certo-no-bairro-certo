
-- ============ PROFESSIONS ============
CREATE TABLE public.professions (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.professions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professions TO authenticated;
GRANT ALL ON public.professions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.professions_id_seq TO authenticated;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professions_read_all" ON public.professions FOR SELECT USING (true);
CREATE POLICY "professions_admin_write" ON public.professions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_professions_updated BEFORE UPDATE ON public.professions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.categories_id_seq TO authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Link services -> category (optional)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id bigint REFERENCES public.categories(id) ON DELETE SET NULL;

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id bigserial PRIMARY KEY,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_owner_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('technician','company')),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','pending')),
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.reviews_id_seq TO authenticated;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_visible" ON public.reviews FOR SELECT USING (status = 'visible');
CREATE POLICY "reviews_owner_read" ON public.reviews FOR SELECT TO authenticated
  USING (auth.uid() = reviewer_id OR auth.uid() = target_owner_id);
CREATE POLICY "reviews_insert_self" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_owner_update" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PROMOTIONS ============
CREATE TABLE public.promotions (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  description text,
  code text UNIQUE,
  discount_percent int CHECK (discount_percent BETWEEN 0 AND 100),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.promotions_id_seq TO authenticated;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions_public_active" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "promotions_admin_all" ON public.promotions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_promotions_updated BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ NOTIFICATIONS (broadcast) ============
CREATE TABLE public.notifications (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','technician','company','admin')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.notifications_id_seq TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read_all_auth" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_admin_write" ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notification_reads (
  notification_id bigint NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_reads_own" ON public.notification_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id bigserial PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('technician','company')),
  service_id bigint REFERENCES public.services(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.appointments_id_seq TO authenticated;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_participants_read" ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "appointments_client_insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY "appointments_participants_update" ON public.appointments FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "appointments_admin_delete" ON public.appointments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
