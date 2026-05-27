-- ============================================================
-- COMPLETE SETUP: Base + Admin System
-- ============================================================
-- Run this in Supabase SQL Editor to set up everything

-- ============================================================
-- 1. CREATE ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('technician', 'company', 'admin');
CREATE TYPE public.subscription_plan AS ENUM ('simples', 'premium', 'empresa_mensal');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE public.owner_type AS ENUM ('technician', 'company');

-- ============================================================
-- 2. CREATE BASE TABLES
-- ============================================================

-- Zonas (bairros de Luanda)
CREATE TABLE public.zones (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Serviços oferecidos
CREATE TABLE public.services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perfis (1:1 com auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE public.user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Técnicos
CREATE TABLE public.technicians (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_whatsapp TEXT,
  profile_photo_url TEXT,
  years_experience INT DEFAULT 0,
  bio TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Empresas
CREATE TABLE public.companies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  phone_whatsapp TEXT,
  logo_url TEXT,
  bio TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junções técnico ↔ serviços / zonas
CREATE TABLE public.technician_services (
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (technician_id, service_id)
);

CREATE TABLE public.technician_zones (
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  zone_id BIGINT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  PRIMARY KEY (technician_id, zone_id)
);

-- Junções empresa ↔ serviços / zonas
CREATE TABLE public.company_services (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, service_id)
);

CREATE TABLE public.company_zones (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  zone_id BIGINT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, zone_id)
);

-- Portfólio
CREATE TABLE public.portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assinaturas
CREATE TABLE public.subscriptions (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_type public.owner_type NOT NULL,
  plan public.subscription_plan NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comprovativos de pagamento
CREATE TABLE public.payment_proofs (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  plan public.subscription_plan NOT NULL,
  note TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CREATE ADMIN SYSTEM TABLES
-- ============================================================

CREATE TABLE public.super_admins (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.admin_logs (
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

CREATE TABLE public.admin_settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_categories (
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

CREATE TABLE public.admin_notifications (
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

CREATE TABLE public.user_reports (
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

CREATE TABLE public.admin_dashboard_config (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    position INT,
    settings JSONB DEFAULT '{}'::jsonb,
    UNIQUE(admin_id, widget_type)
);

-- ============================================================
-- 4. EXTEND TABLES WITH ADMIN FIELDS
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
-- 5. CREATE FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY definer SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_user_id UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY definer SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') OR public.is_super_admin(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(_admin_id UUID, _action TEXT, _entity_type TEXT, _entity_id UUID DEFAULT NULL, _entity_data JSONB DEFAULT NULL, _changes JSONB DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY definer SET search_path = public AS $$
DECLARE _log_id BIGINT;
BEGIN
  INSERT INTO public.admin_logs (admin_id, action, entity_type, entity_id, entity_data, changes)
  VALUES (_admin_id, _action, _entity_type, _entity_id, _entity_data, _changes)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ban_user(_user_id UUID, _banned_by UUID, _reason TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY definer SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_higher(_banned_by) THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  UPDATE public.technicians SET is_banned = true, banned_by = _banned_by, banned_at = now(), ban_reason = _reason WHERE id = _user_id;
  UPDATE public.companies SET is_banned = true, banned_by = _banned_by, banned_at = now(), ban_reason = _reason WHERE id = _user_id;
  PERFORM public.log_admin_action(_banned_by, 'user_banned', 'user', _user_id, NULL, jsonb_build_object('reason', _reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user(_user_id UUID, _verified_by UUID, _is_technician BOOLEAN DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY definer SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_higher(_verified_by) THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF _is_technician THEN
    UPDATE public.technicians SET is_verified = true, verified_by = _verified_by, verified_at = now() WHERE id = _user_id;
  ELSE
    UPDATE public.companies SET is_verified = true, verified_by = _verified_by, verified_at = now() WHERE id = _user_id;
  END IF;
  PERFORM public.log_admin_action(_verified_by, 'user_verified', 'user', _user_id);
END;
$$;

-- ============================================================
-- 6. CREATE INDEXES
-- ============================================================

CREATE INDEX idx_technicians_verified ON public.technicians(is_verified) WHERE is_banned = false;
CREATE INDEX idx_technicians_premium ON public.technicians(is_premium) WHERE is_banned = false;
CREATE INDEX idx_subscriptions_owner ON public.subscriptions(owner_id, status);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status, end_at);
CREATE INDEX idx_super_admins_user ON public.super_admins(user_id);
CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_action ON public.admin_logs(action, created_at DESC);
CREATE INDEX idx_service_categories_active ON public.service_categories(is_active) WHERE is_active = true;
CREATE INDEX idx_admin_notifications_admin ON public.admin_notifications(admin_id, is_read DESC, created_at DESC);
CREATE INDEX idx_user_reports_status ON public.user_reports(status, created_at DESC);

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_dashboard_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. CREATE RLS POLICIES
-- ============================================================

CREATE POLICY "super_admins admin read" ON public.super_admins FOR SELECT USING (public.is_admin_or_higher(auth.uid()));
CREATE POLICY "admin_logs admin read" ON public.admin_logs FOR SELECT USING (public.is_admin_or_higher(auth.uid()));
CREATE POLICY "admin_settings public read" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings super_admin manage" ON public.admin_settings FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "service_categories public read" ON public.service_categories FOR SELECT USING (is_active = true OR public.is_admin_or_higher(auth.uid()));
CREATE POLICY "service_categories admin manage" ON public.service_categories FOR ALL USING (public.is_admin_or_higher(auth.uid())) WITH CHECK (public.is_admin_or_higher(auth.uid()));
CREATE POLICY "admin_notifications read own" ON public.admin_notifications FOR SELECT USING (auth.uid() = admin_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "user_reports admin read" ON public.user_reports FOR SELECT USING (public.is_admin_or_higher(auth.uid()));
CREATE POLICY "admin_dashboard_config own" ON public.admin_dashboard_config FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

-- ============================================================
-- 9. INSERT INITIAL DATA
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
  ('whatsapp_visibility_requirement', '"premium"'::jsonb, 'Requisito para mostrar WhatsApp'),
  ('max_failed_login_attempts', '5'::jsonb, 'Máximo de tentativas de login'),
  ('admin_email_notifications', 'true'::jsonb, 'Ativar notificações de email'),
  ('site_maintenance_mode', 'false'::jsonb, 'Ativar modo de manutenção')
ON CONFLICT (key) DO NOTHING;
