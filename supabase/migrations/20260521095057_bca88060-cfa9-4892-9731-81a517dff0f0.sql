
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('technician', 'company', 'admin');
CREATE TYPE public.subscription_plan AS ENUM ('simples', 'premium', 'empresa_mensal');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE public.owner_type AS ENUM ('technician', 'company');

-- ============================================================
-- TABLES
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

-- Perfis (1:1 com auth.users) — roles ficam em tabela separada por segurança
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles (separado para evitar privilege escalation)
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
-- INDEXES
-- ============================================================
CREATE INDEX idx_technicians_verified ON public.technicians(is_verified) WHERE is_banned = false;
CREATE INDEX idx_technicians_premium ON public.technicians(is_premium) WHERE is_banned = false;
CREATE INDEX idx_technicians_created ON public.technicians(created_at DESC);
CREATE INDEX idx_subscriptions_owner ON public.subscriptions(owner_id, status);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status, end_at);
CREATE INDEX idx_payment_proofs_owner ON public.payment_proofs(owner_id);
CREATE INDEX idx_tech_services_service ON public.technician_services(service_id);
CREATE INDEX idx_tech_zones_zone ON public.technician_zones(zone_id);

-- ============================================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Has role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tem assinatura ativa (não expirada)
CREATE OR REPLACE FUNCTION public.has_active_subscription(_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE owner_id = _owner_id
      AND status = 'active'
      AND (end_at IS NULL OR end_at > now())
  )
$$;

-- Trigger: cria profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_technicians_updated BEFORE UPDATE ON public.technicians
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES — leitura pública (catálogos)
-- ============================================================
CREATE POLICY "zones public read" ON public.zones FOR SELECT USING (true);
CREATE POLICY "services public read" ON public.services FOR SELECT USING (true);
CREATE POLICY "zones admin all" ON public.zones FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "services admin all" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLICIES — profiles
-- ============================================================
CREATE POLICY "profiles own select" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- POLICIES — user_roles (apenas admin gere; user vê só os seus)
-- ============================================================
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin manage" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLICIES — technicians
-- Leitura pública de TODOS técnicos não banidos. WhatsApp filtrado em server-fn.
-- ============================================================
CREATE POLICY "technicians public read" ON public.technicians FOR SELECT USING (is_banned = false OR auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "technicians self insert" ON public.technicians FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "technicians self update" ON public.technicians FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND is_verified = (SELECT is_verified FROM public.technicians WHERE id = auth.uid()) AND is_banned = (SELECT is_banned FROM public.technicians WHERE id = auth.uid()) AND is_premium = (SELECT is_premium FROM public.technicians WHERE id = auth.uid()));
CREATE POLICY "technicians admin all" ON public.technicians FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLICIES — companies
-- ============================================================
CREATE POLICY "companies public read" ON public.companies FOR SELECT USING (is_banned = false OR auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "companies self insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "companies self update" ON public.companies FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND is_verified = (SELECT is_verified FROM public.companies WHERE id = auth.uid()) AND is_banned = (SELECT is_banned FROM public.companies WHERE id = auth.uid()));
CREATE POLICY "companies admin all" ON public.companies FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLICIES — junções (leitura pública, gestão própria)
-- ============================================================
CREATE POLICY "tech_services public read" ON public.technician_services FOR SELECT USING (true);
CREATE POLICY "tech_services self manage" ON public.technician_services FOR ALL USING (auth.uid() = technician_id) WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "tech_zones public read" ON public.technician_zones FOR SELECT USING (true);
CREATE POLICY "tech_zones self manage" ON public.technician_zones FOR ALL USING (auth.uid() = technician_id) WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "company_services public read" ON public.company_services FOR SELECT USING (true);
CREATE POLICY "company_services self manage" ON public.company_services FOR ALL USING (auth.uid() = company_id) WITH CHECK (auth.uid() = company_id);

CREATE POLICY "company_zones public read" ON public.company_zones FOR SELECT USING (true);
CREATE POLICY "company_zones self manage" ON public.company_zones FOR ALL USING (auth.uid() = company_id) WITH CHECK (auth.uid() = company_id);

-- ============================================================
-- POLICIES — portfolio
-- ============================================================
CREATE POLICY "portfolio public read" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio self manage" ON public.portfolio_items FOR ALL USING (auth.uid() = technician_id) WITH CHECK (auth.uid() = technician_id);
CREATE POLICY "portfolio admin all" ON public.portfolio_items FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLICIES — subscriptions (próprias + admin)
-- ============================================================
CREATE POLICY "subscriptions self read" ON public.subscriptions FOR SELECT USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "subscriptions self insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = owner_id AND status = 'pending');
CREATE POLICY "subscriptions admin manage" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- POLICIES — payment_proofs (privado)
-- ============================================================
CREATE POLICY "proofs self read" ON public.payment_proofs FOR SELECT USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proofs self insert" ON public.payment_proofs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "proofs admin manage" ON public.payment_proofs FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('public-assets', 'public-assets', true),
  ('private-uploads', 'private-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies — public-assets: leitura pública, upload do dono em pasta {uid}/
CREATE POLICY "public-assets read" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
CREATE POLICY "public-assets owner upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'public-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "public-assets owner update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'public-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "public-assets owner delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'public-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies — private-uploads: apenas dono + admin
CREATE POLICY "private-uploads owner read" ON storage.objects FOR SELECT USING (
  bucket_id = 'private-uploads' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "private-uploads owner write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'private-uploads' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "private-uploads owner delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'private-uploads' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')
  )
);

-- ============================================================
-- SEED — zonas e serviços de Luanda
-- ============================================================
INSERT INTO public.zones (name, slug) VALUES
  ('Ingombota', 'ingombota'),
  ('Maianga', 'maianga'),
  ('Rangel', 'rangel'),
  ('Sambizanga', 'sambizanga'),
  ('Kilamba Kiaxi', 'kilamba-kiaxi'),
  ('Talatona', 'talatona'),
  ('Viana', 'viana'),
  ('Cazenga', 'cazenga'),
  ('Cacuaco', 'cacuaco'),
  ('Belas', 'belas'),
  ('Kilamba', 'kilamba'),
  ('Benfica', 'benfica'),
  ('Morro Bento', 'morro-bento'),
  ('Camama', 'camama'),
  ('Zango', 'zango')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (name, slug, icon) VALUES
  ('Eletricista', 'eletricista', 'Zap'),
  ('Canalizador', 'canalizador', 'Wrench'),
  ('Pedreiro', 'pedreiro', 'Hammer'),
  ('Pintor', 'pintor', 'PaintBucket'),
  ('Carpinteiro', 'carpinteiro', 'Axe'),
  ('Serralheiro', 'serralheiro', 'Square'),
  ('Mecânico Auto', 'mecanico-auto', 'Car'),
  ('Técnico AC', 'tecnico-ac', 'Wind'),
  ('Técnico Informático', 'tecnico-informatico', 'Laptop'),
  ('Jardineiro', 'jardineiro', 'Trees'),
  ('Limpeza', 'limpeza', 'Sparkles'),
  ('Mudanças', 'mudancas', 'Truck'),
  ('Eletrodomésticos', 'eletrodomesticos', 'Refrigerator'),
  ('Vidraceiro', 'vidraceiro', 'Square'),
  ('Soldador', 'soldador', 'Flame')
ON CONFLICT (slug) DO NOTHING;
