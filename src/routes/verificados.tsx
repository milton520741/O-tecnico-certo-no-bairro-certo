import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, ShieldCheck, Building2, Wrench, MessageCircle, Search, X } from "lucide-react";

export const Route = createFileRoute("/verificados")({
  head: () => ({
    meta: [
      { title: "Técnicos e Empresas Verificadas — EvoluinF" },
      { name: "description", content: "Profissionais e empresas verificadas e com assinatura activa no EvoluinF." },
    ],
  }),
  component: VerifiedDashboard,
});

interface Tech {
  id: string; full_name: string; profile_photo_url: string | null;
  years_experience: number | null; is_verified: boolean; is_premium: boolean;
  bio: string | null; phone_whatsapp: string | null;
  zoneIds: Set<string>; serviceIds: Set<string>;
}
interface Comp {
  id: string; company_name: string; logo_url: string | null;
  is_verified: boolean; bio: string | null; phone_whatsapp: string | null;
  zoneIds: Set<string>; serviceIds: Set<string>;
}
interface Opt { id: string; name: string }

const PAGE_SIZE = 9;
const ALL = "__all__";

function VerifiedDashboard() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [zones, setZones] = useState<Opt[]>([]);
  const [services, setServices] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [zone, setZone] = useState<string>(ALL);
  const [service, setService] = useState<string>(ALL);
  const [tier, setTier] = useState<string>(ALL); // all|premium|normal
  const [tPage, setTPage] = useState(1);
  const [cPage, setCPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [subsR, zR, sR, tR, cR, tzR, tsR, czR, csR] = await Promise.all([
        supabase.from("subscriptions").select("owner_id, end_at").eq("status", "active"),
        supabase.from("zones").select("id, name").order("name"),
        supabase.from("services").select("id, name").order("name"),
        supabase.from("technicians")
          .select("id, full_name, profile_photo_url, years_experience, is_verified, is_premium, bio, phone_whatsapp, created_at")
          .eq("is_banned", false).eq("is_verified", true)
          .order("is_premium", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("companies")
          .select("id, company_name, logo_url, is_verified, bio, phone_whatsapp, created_at")
          .eq("is_banned", false).eq("is_verified", true)
          .order("created_at", { ascending: false }),
        supabase.from("technician_zones").select("technician_id, zone_id"),
        supabase.from("technician_services").select("technician_id, service_id"),
        supabase.from("company_zones").select("company_id, zone_id"),
        supabase.from("company_services").select("company_id, service_id"),
      ]);

      const now = new Date();
      const activeIds = new Set(
        (subsR.data ?? []).filter((s: any) => !s.end_at || new Date(s.end_at) > now).map((s: any) => s.owner_id)
      );

      const tzMap = new Map<string, Set<string>>();
      (tzR.data ?? []).forEach((r: any) => {
        if (!tzMap.has(r.technician_id)) tzMap.set(r.technician_id, new Set());
        tzMap.get(r.technician_id)!.add(r.zone_id);
      });
      const tsMap = new Map<string, Set<string>>();
      (tsR.data ?? []).forEach((r: any) => {
        if (!tsMap.has(r.technician_id)) tsMap.set(r.technician_id, new Set());
        tsMap.get(r.technician_id)!.add(r.service_id);
      });
      const czMap = new Map<string, Set<string>>();
      (czR.data ?? []).forEach((r: any) => {
        if (!czMap.has(r.company_id)) czMap.set(r.company_id, new Set());
        czMap.get(r.company_id)!.add(r.zone_id);
      });
      const csMap = new Map<string, Set<string>>();
      (csR.data ?? []).forEach((r: any) => {
        if (!csMap.has(r.company_id)) csMap.set(r.company_id, new Set());
        csMap.get(r.company_id)!.add(r.service_id);
      });

      setZones((zR.data ?? []) as Opt[]);
      setServices((sR.data ?? []) as Opt[]);
      setTechs(
        ((tR.data ?? []) as any[])
          .filter((t) => activeIds.has(t.id))
          .map((t) => ({ ...t, zoneIds: tzMap.get(t.id) ?? new Set(), serviceIds: tsMap.get(t.id) ?? new Set() }))
      );
      setComps(
        ((cR.data ?? []) as any[])
          .filter((c) => activeIds.has(c.id))
          .map((c) => ({ ...c, zoneIds: czMap.get(c.id) ?? new Set(), serviceIds: csMap.get(c.id) ?? new Set() }))
      );
      setLoading(false);
    })();
  }, []);

  const filteredTechs = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return techs.filter((t) => {
      if (qn && !t.full_name?.toLowerCase().includes(qn)) return false;
      if (zone !== ALL && !t.zoneIds.has(zone)) return false;
      if (service !== ALL && !t.serviceIds.has(service)) return false;
      if (tier === "premium" && !t.is_premium) return false;
      if (tier === "normal" && t.is_premium) return false;
      return true;
    });
  }, [techs, q, zone, service, tier]);

  const filteredComps = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return comps.filter((c) => {
      if (qn && !c.company_name?.toLowerCase().includes(qn)) return false;
      if (zone !== ALL && !c.zoneIds.has(zone)) return false;
      if (service !== ALL && !c.serviceIds.has(service)) return false;
      return true;
    });
  }, [comps, q, zone, service]);

  useEffect(() => { setTPage(1); setCPage(1); }, [q, zone, service, tier]);

  const tPages = Math.max(1, Math.ceil(filteredTechs.length / PAGE_SIZE));
  const cPages = Math.max(1, Math.ceil(filteredComps.length / PAGE_SIZE));
  const tSlice = filteredTechs.slice((tPage - 1) * PAGE_SIZE, tPage * PAGE_SIZE);
  const cSlice = filteredComps.slice((cPage - 1) * PAGE_SIZE, cPage * PAGE_SIZE);

  const hasFilters = q || zone !== ALL || service !== ALL || tier !== ALL;

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-success" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Verificados & Activos</h1>
        </div>
        <p className="text-muted-foreground">Profissionais e empresas verificadas e com assinatura activa.</p>
      </header>

      <FiltersBar
        q={q} setQ={setQ}
        zone={zone} setZone={setZone}
        service={service} setService={setService}
        tier={tier} setTier={setTier}
        zones={zones} services={services}
        showTier
        onClear={() => { setQ(""); setZone(ALL); setService(ALL); setTier(ALL); }}
        hasFilters={!!hasFilters}
      />

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Técnicos ({filteredTechs.length})</h2>
        </div>
        {loading ? <SkeletonGrid /> : tSlice.length === 0 ? <EmptyState text="Nenhum técnico encontrado." /> : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tSlice.map((t) => (
                <Card key={t.id} className={`flex flex-col p-5 transition-smooth hover:-translate-y-1 hover:shadow-elegant ${t.is_premium ? "premium-border bg-gradient-card shadow-premium" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {t.profile_photo_url ? (
                        <img src={t.profile_photo_url} alt={t.full_name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">{t.full_name?.charAt(0)?.toUpperCase()}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{t.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{t.years_experience ?? 0} anos de experiência</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.is_premium && <Badge className="bg-gradient-premium text-premium-foreground"><Crown className="mr-1 h-3 w-3" />Premium</Badge>}
                        <Badge variant="secondary" className="bg-success/15 text-success"><ShieldCheck className="mr-1 h-3 w-3" />Verificado</Badge>
                      </div>
                    </div>
                  </div>
                  {t.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{t.bio}</p>}
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link to="/technician/$id" params={{ id: t.id }}>Ver perfil</Link>
                  </Button>
                </Card>
              ))}
            </div>
            <Pager page={tPage} pages={tPages} onPage={setTPage} />
          </>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Empresas ({filteredComps.length})</h2>
        </div>
        {loading ? <SkeletonGrid /> : cSlice.length === 0 ? <EmptyState text="Nenhuma empresa encontrada." /> : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {cSlice.map((c) => {
                const wa = c.phone_whatsapp?.replace(/\D/g, "");
                return (
                  <Card key={c.id} className="flex flex-col p-5 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.company_name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="grid h-full w-full place-items-center"><Building2 className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{c.company_name}</h3>
                        <Badge variant="secondary" className="mt-1 bg-success/15 text-success"><ShieldCheck className="mr-1 h-3 w-3" />Verificada</Badge>
                      </div>
                    </div>
                    {c.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>}
                    {wa && (
                      <Button asChild className="mt-4 w-full bg-success text-success-foreground hover:bg-success/90">
                        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                        </a>
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
            <Pager page={cPage} pages={cPages} onPage={setCPage} />
          </>
        )}
      </section>
    </div>
  );
}

export function FiltersBar(props: {
  q: string; setQ: (v: string) => void;
  zone: string; setZone: (v: string) => void;
  service: string; setService: (v: string) => void;
  tier?: string; setTier?: (v: string) => void;
  zones: Opt[]; services: Opt[];
  showTier?: boolean;
  onClear: () => void; hasFilters: boolean;
}) {
  return (
    <div className="mt-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={props.q} onChange={(e) => props.setQ(e.target.value)} placeholder="Pesquisar por nome…" className="pl-9" />
      </div>
      <Select value={props.zone} onValueChange={props.setZone}>
        <SelectTrigger><SelectValue placeholder="Bairro" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os bairros</SelectItem>
          {props.zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={props.service} onValueChange={props.setService}>
        <SelectTrigger><SelectValue placeholder="Serviço" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os serviços</SelectItem>
          {props.services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {props.showTier && props.setTier && (
        <Select value={props.tier ?? ALL} onValueChange={props.setTier}>
          <SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Premium e Normal</SelectItem>
            <SelectItem value="premium">Apenas Premium</SelectItem>
            <SelectItem value="normal">Apenas Normal</SelectItem>
          </SelectContent>
        </Select>
      )}
      {props.hasFilters && (
        <Button variant="ghost" onClick={props.onClear} className="sm:col-span-2 lg:col-span-5 lg:justify-self-end">
          <X className="mr-1 h-4 w-4" />Limpar filtros
        </Button>
      )}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
      <span className="text-sm text-muted-foreground">Página {page} / {pages}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima</Button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted/40" />)}
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return <Card className="p-8 text-center text-sm text-muted-foreground">{text}</Card>;
}
