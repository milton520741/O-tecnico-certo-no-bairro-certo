-- ============================================================
-- ADMIN SYSTEM - Fixed Version (No Service Dependencies)
-- Version: Idempotent (Safe to run multiple times)
-- ============================================================

-- ============================================================
-- SUPER ADMIN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.super_admins (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- NEW TABLES FOR ADMIN SYSTEM
-- ============================================================

-- Admin Logs (auditoria)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_data JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Settings/Configurations
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Categories
CREATE TABLE IF NOT EXISTS public.service_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color_hex TEXT,
    sort_order INT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- User Reports/Issues
CREATE TABLE IF NOT EXISTS public.user_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Admin Dashboard Widgets Configuration
CREATE TABLE IF NOT EXISTS public.admin_dashboard_config (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    position INT,
    settings JSONB DEFAULT '{}'::jsonb,
    UNIQUE(admin_id, widget_type)
);

-- ============================================================
-- EXTEND EXISTING TABLES WITH ADMIN FIELDS
-- ============================================================

ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMPTZ;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS completed_jobs INT DEFAULT 0;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMPTZ;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ============================================================
-- FUNCTIONS FOR ADMIN
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY definer
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY definer
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) OR public.is_super_admin(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_higher(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY definer
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'technician', 'company')
  ) OR public.is_admin_or_higher(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(
    _admin_id UUID,
    _action TEXT,
    _entity_type TEXT,
    _entity_id UUID DEFAULT NULL,
    _entity_data JSONB DEFAULT NULL,
    _changes JSONB DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  _log_id BIGINT;
BEGIN
  INSERT INTO public.admin_logs (admin_id, action, entity_type, entity_id, entity_data, changes)
  VALUES (_admin_id, _action, _entity_type, _entity_id, _entity_data, _changes)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ban_user(
    _user_id UUID,
    _banned_by UUID,
    _reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_higher(_banned_by) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE public.technicians
  SET is_banned = true, banned_by = _banned_by, banned_at = now(), ban_reason = _reason
  WHERE id = _user_id;

  UPDATE public.companies
  SET is_banned = true, banned_by = _banned_by, banned_at = now(), ban_reason = _reason
  WHERE id = _user_id;

  PERFORM public.log_admin_action(_banned_by, 'user_banned', 'user', _user_id, NULL, 
    jsonb_build_object('reason', _reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.unban_user(
    _user_id UUID,
    _unbanned_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_higher(_unbanned_by) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE public.technicians
  SET is_banned = false, banned_by = NULL, banned_at = NULL, ban_reason = NULL
  WHERE id = _user_id;

  UPDATE public.companies
  SET is_banned = false, banned_by = NULL, banned_at = NULL, ban_reason = NULL
  WHERE id = _user_id;

  PERFORM public.log_admin_action(_unbanned_by, 'user_unbanned', 'user', _user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user(
    _user_id UUID,
    _verified_by UUID,
    _is_technician BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_higher(_verified_by) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF _is_technician THEN
    UPDATE public.technicians
    SET is_verified = true, verified_by = _verified_by, verified_at = now()
    WHERE id = _user_id;
  ELSE
    UPDATE public.companies
    SET is_verified = true, verified_by = _verified_by, verified_at = now()
    WHERE id = _user_id;
  END IF;

  PERFORM public.log_admin_action(_verified_by, 'user_verified', 'user', _user_id);
END;
$$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_super_admins_user ON public.super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON public.admin_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON public.service_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin ON public.admin_notifications(admin_id, is_read DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(admin_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON public.user_reports(reported_user_id);

-- ============================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_dashboard_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES FOR ADMIN TABLES
-- ============================================================

DROP POLICY IF EXISTS "super_admins admin read" ON public.super_admins;
CREATE POLICY "super_admins admin read" ON public.super_admins FOR SELECT
USING (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "admin_logs admin read" ON public.admin_logs;
CREATE POLICY "admin_logs admin read" ON public.admin_logs FOR SELECT
USING (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "admin_settings public read" ON public.admin_settings;
CREATE POLICY "admin_settings public read" ON public.admin_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "admin_settings super_admin manage" ON public.admin_settings;
CREATE POLICY "admin_settings super_admin manage" ON public.admin_settings FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "service_categories public read" ON public.service_categories;
CREATE POLICY "service_categories public read" ON public.service_categories FOR SELECT
USING (is_active = true OR public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "service_categories admin manage" ON public.service_categories;
CREATE POLICY "service_categories admin manage" ON public.service_categories FOR ALL
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "admin_notifications read own" ON public.admin_notifications;
CREATE POLICY "admin_notifications read own" ON public.admin_notifications FOR SELECT
USING (auth.uid() = admin_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_notifications update own" ON public.admin_notifications;
CREATE POLICY "admin_notifications update own" ON public.admin_notifications FOR UPDATE
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "admin_notifications delete own" ON public.admin_notifications;
CREATE POLICY "admin_notifications delete own" ON public.admin_notifications FOR DELETE
USING (auth.uid() = admin_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "user_reports admin read" ON public.user_reports;
CREATE POLICY "user_reports admin read" ON public.user_reports FOR SELECT
USING (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "user_reports user insert" ON public.user_reports;
CREATE POLICY "user_reports user insert" ON public.user_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);

DROP POLICY IF EXISTS "user_reports admin manage" ON public.user_reports;
CREATE POLICY "user_reports admin manage" ON public.user_reports FOR UPDATE
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "admin_dashboard_config own" ON public.admin_dashboard_config;
CREATE POLICY "admin_dashboard_config own" ON public.admin_dashboard_config FOR ALL
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "payment_proofs owner read" ON public.payment_proofs;
DROP POLICY IF EXISTS "payment_proofs admin all" ON public.payment_proofs;
DROP POLICY IF EXISTS "payment_proofs owner insert" ON public.payment_proofs;
DROP POLICY IF EXISTS "payment_proofs admin manage" ON public.payment_proofs;
DROP POLICY IF EXISTS "payment_proofs admin delete" ON public.payment_proofs;

CREATE POLICY "payment_proofs owner read" ON public.payment_proofs FOR SELECT
USING (auth.uid() = owner_id OR public.is_admin_or_higher(auth.uid()));

CREATE POLICY "payment_proofs owner insert" ON public.payment_proofs FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "payment_proofs admin manage" ON public.payment_proofs FOR UPDATE
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "payment_proofs admin delete" ON public.payment_proofs FOR DELETE
USING (public.is_admin_or_higher(auth.uid()));

-- ============================================================
-- INITIAL DATA
-- ============================================================

INSERT INTO public.service_categories (name, slug, description, icon, sort_order) VALUES
  ('Construção', 'construcao', 'Serviços relacionados com construção e reparação', 'Hammer', 1),
  ('Limpeza', 'limpeza', 'Serviços de limpeza e manutenção', 'Sparkles', 2),
  ('Reparação', 'reparacao', 'Serviços de reparação e manutenção', 'Wrench', 3),
  ('Automóvel', 'automovel', 'Serviços automotivos', 'Car', 4),
  ('Informática', 'informatica', 'Serviços tecnológicos', 'Laptop', 5),
  ('Outros', 'outros', 'Outros serviços', 'MoreHorizontal', 999)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.admin_settings (key, value, description) VALUES
  ('subscription_trial_days', '7'::jsonb, 'Número de dias de trial para assinaturas'),
  ('whatsapp_visibility_requirement', '"premium"'::jsonb, 'Requisito para mostrar WhatsApp: "trial" ou "premium"'),
  ('max_failed_login_attempts', '5'::jsonb, 'Máximo de tentativas de login antes de bloquear'),
  ('admin_email_notifications', 'true'::jsonb, 'Ativar notificações de email para admins'),
  ('site_maintenance_mode', 'false'::jsonb, 'Ativar modo de manutenção')
ON CONFLICT (key) DO NOTHING;
