REVOKE EXECUTE ON FUNCTION public.handle_subscription_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_premium_flag() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_due_subscriptions() FROM PUBLIC, anon;
-- Keep expire_due_subscriptions callable by authenticated admin via RPC, but the function still runs as definer
GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO authenticated;
