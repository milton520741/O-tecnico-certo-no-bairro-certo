import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Upload, ArrowLeft, Crown } from "lucide-react";
import { toast } from "sonner";
import { uploadPublic, fileFromInput } from "@/lib/upload";

export const Route = createFileRoute("/dashboard/perfil")({
  head: () => ({ meta: [{ title: "Editar Perfil — EvoluinF" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard/perfil" } as never });
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const isCompany = roles.includes("company");
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Voltar ao painel</Link>
      </Button>
      <h1 className="font-display text-3xl font-bold">Editar perfil</h1>
      <p className="mt-1 text-muted-foreground">
        {isCompany ? "Apresenta a tua empresa aos clientes." : "Mostra ao público quem és e o que sabes fazer."}
      </p>
      <div className="mt-6">
        {isCompany ? <CompanyForm userId={user.id} /> : <TechnicianForm userId={user.id} />}
      </div>
    </div>
  );
}

/* ---------- Technician ---------- */
function TechnicianForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [years, setYears] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [serviceIds, setServiceIds] = useState<Set<number>>(new Set());
  const [zoneIds, setZoneIds] = useState<Set<number>>(new Set());

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("id,name").order("name")).data ?? [],
  });
  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => (await supabase.from("zones").select("id,name").order("name")).data ?? [],
  });

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("technicians").select("*").eq("id", userId).maybeSingle();
      if (t) {
        setFullName(t.full_name ?? "");
        setBio(t.bio ?? "");
        setWhatsapp(t.phone_whatsapp ?? "");
        setYears(t.years_experience ?? 0);
        setPhotoUrl(t.profile_photo_url);
        setIsPremium(t.is_premium);
      }
      const [{ data: ts }, { data: tz }] = await Promise.all([
        supabase.from("technician_services").select("service_id").eq("technician_id", userId),
        supabase.from("technician_zones").select("zone_id").eq("technician_id", userId),
      ]);
      setServiceIds(new Set((ts ?? []).map((r) => r.service_id)));
      setZoneIds(new Set((tz ?? []).map((r) => r.zone_id)));
      setLoading(false);
    })();
  }, [userId]);

  const toggle = (set: Set<number>, id: number, fn: (s: Set<number>) => void) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    fn(n);
  };

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = fileFromInput(e);
      if (!file) return;
      setUploadingPhoto(true);
      const url = await uploadPublic(userId, file, "profile");
      setPhotoUrl(url);
      toast.success("Foto carregada. Não esqueças de guardar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar foto");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!fullName.trim()) return toast.error("Nome completo é obrigatório");
    setSaving(true);
    try {
      const { error: e1 } = await supabase.from("technicians").upsert({
        id: userId,
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        phone_whatsapp: whatsapp.trim() || null,
        years_experience: Number.isFinite(years) ? years : 0,
        profile_photo_url: photoUrl,
      });
      if (e1) throw e1;

      // Replace services
      await supabase.from("technician_services").delete().eq("technician_id", userId);
      if (serviceIds.size) {
        const { error } = await supabase.from("technician_services").insert([...serviceIds].map((service_id) => ({ technician_id: userId, service_id })));
        if (error) throw error;
      }
      // Replace zones
      await supabase.from("technician_zones").delete().eq("technician_id", userId);
      if (zoneIds.size) {
        const { error } = await supabase.from("technician_zones").insert([...zoneIds].map((zone_id) => ({ technician_id: userId, zone_id })));
        if (error) throw error;
      }
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 ring-2 ring-border">
            <AvatarImage src={photoUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-2xl">{fullName.charAt(0).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Foto de perfil</p>
              {isPremium && <Badge className="bg-gradient-premium text-premium-foreground"><Crown className="mr-1 h-3 w-3" />Premium</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">JPG/PNG, máx. 5MB. Aparece na tua listagem pública.</p>
            <div className="mt-3">
              <Label htmlFor="photo" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
                {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingPhoto ? "A carregar..." : "Carregar foto"}
              </Label>
              <input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <Label htmlFor="name">Nome completo *</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="wpp">WhatsApp (com indicativo)</Label>
            <Input id="wpp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+244 9XX XXX XXX" maxLength={20} />
            <p className="mt-1 text-xs text-muted-foreground">Visível apenas se tiveres plano ativo.</p>
          </div>
          <div>
            <Label htmlFor="years">Anos de experiência</Label>
            <Input id="years" type="number" min={0} max={70} value={years} onChange={(e) => setYears(parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">Sobre ti</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="Especialidades, certificações, equipamentos, idiomas..." />
          <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold">Serviços que prestas</h3>
        <p className="text-xs text-muted-foreground">Seleciona pelo menos um.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-input p-2.5 text-sm hover:bg-accent">
              <Checkbox checked={serviceIds.has(s.id)} onCheckedChange={() => toggle(serviceIds, s.id, setServiceIds)} />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold">Zonas de atuação</h3>
        <p className="text-xs text-muted-foreground">Bairros / municípios de Luanda onde trabalhas.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {zones.map((z) => (
            <label key={z.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-input p-2.5 text-sm hover:bg-accent">
              <Checkbox checked={zoneIds.has(z.id)} onCheckedChange={() => toggle(zoneIds, z.id, setZoneIds)} />
              <span>{z.name}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar alterações
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/portfolio">Gerir portfólio</Link>
        </Button>
      </div>
    </div>
  );
}

/* ---------- Company ---------- */
function CompanyForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [serviceIds, setServiceIds] = useState<Set<number>>(new Set());
  const [zoneIds, setZoneIds] = useState<Set<number>>(new Set());

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("id,name").order("name")).data ?? [],
  });
  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => (await supabase.from("zones").select("id,name").order("name")).data ?? [],
  });

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("companies").select("*").eq("id", userId).maybeSingle();
      if (c) {
        setCompanyName(c.company_name ?? "");
        setBio(c.bio ?? "");
        setWhatsapp(c.phone_whatsapp ?? "");
        setLogoUrl(c.logo_url);
      }
      const [{ data: cs }, { data: cz }] = await Promise.all([
        supabase.from("company_services").select("service_id").eq("company_id", userId),
        supabase.from("company_zones").select("zone_id").eq("company_id", userId),
      ]);
      setServiceIds(new Set((cs ?? []).map((r) => r.service_id)));
      setZoneIds(new Set((cz ?? []).map((r) => r.zone_id)));
      setLoading(false);
    })();
  }, [userId]);

  const toggle = (set: Set<number>, id: number, fn: (s: Set<number>) => void) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    fn(n);
  };

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = fileFromInput(e);
      if (!file) return;
      setUploadingLogo(true);
      const url = await uploadPublic(userId, file, "logo");
      setLogoUrl(url);
      toast.success("Logo carregado. Não esqueças de guardar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!companyName.trim()) return toast.error("Nome da empresa é obrigatório");
    setSaving(true);
    try {
      const { error: e1 } = await supabase.from("companies").upsert({
        id: userId,
        company_name: companyName.trim(),
        bio: bio.trim() || null,
        phone_whatsapp: whatsapp.trim() || null,
        logo_url: logoUrl,
      });
      if (e1) throw e1;

      await supabase.from("company_services").delete().eq("company_id", userId);
      if (serviceIds.size) {
        const { error } = await supabase.from("company_services").insert([...serviceIds].map((service_id) => ({ company_id: userId, service_id })));
        if (error) throw error;
      }
      await supabase.from("company_zones").delete().eq("company_id", userId);
      if (zoneIds.size) {
        const { error } = await supabase.from("company_zones").insert([...zoneIds].map((zone_id) => ({ company_id: userId, zone_id })));
        if (error) throw error;
      }
      toast.success("Empresa atualizada com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 rounded-xl ring-2 ring-border">
            <AvatarImage src={logoUrl ?? undefined} alt={companyName} className="object-contain" />
            <AvatarFallback className="rounded-xl text-2xl">{companyName.charAt(0).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">Logotipo</p>
            <p className="text-xs text-muted-foreground">PNG transparente recomendado. Máx 5MB.</p>
            <div className="mt-3">
              <Label htmlFor="logo" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? "A carregar..." : "Carregar logo"}
              </Label>
              <input id="logo" type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploadingLogo} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <Label htmlFor="cname">Nome da empresa *</Label>
          <Input id="cname" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={120} />
        </div>
        <div>
          <Label htmlFor="cwpp">WhatsApp comercial</Label>
          <Input id="cwpp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+244 9XX XXX XXX" maxLength={20} />
        </div>
        <div>
          <Label htmlFor="cbio">Sobre a empresa</Label>
          <Textarea id="cbio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} />
          <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold">Serviços oferecidos</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-input p-2.5 text-sm hover:bg-accent">
              <Checkbox checked={serviceIds.has(s.id)} onCheckedChange={() => toggle(serviceIds, s.id, setServiceIds)} />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold">Zonas de cobertura</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {zones.map((z) => (
            <label key={z.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-input p-2.5 text-sm hover:bg-accent">
              <Checkbox checked={zoneIds.has(z.id)} onCheckedChange={() => toggle(zoneIds, z.id, setZoneIds)} />
              <span>{z.name}</span>
            </label>
          ))}
        </div>
      </Card>

      <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar alterações
      </Button>
    </div>
  );
}
