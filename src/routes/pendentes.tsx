import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Wrench, Clock, AlertCircle } from "lucide-react";
import { FiltersBar, Pager } from "./verificados";

export const Route = createFileRoute("/pendentes")({
  head: () => ({
    meta: [
      { title: "Pendentes — EvoluinF" },
      { name: "description", content: "Técnicos e empresas sem verificação ou sem assinatura activa." },
    ],
  }),
  component: PendingDashboard,
});

interface Tech {
  id: string; full_name: string; profile_photo_url: string | null;
  years_experience: number | null; is_verified: boolean; is_premium: boolean; bio: string | null;
  zoneIds: Set<string>; serviceIds: Set<string>;
}
interface Comp {
  id: string; company_name: string; logo_url: string | null;
  is_verified: boolean; bio: string | null;
  zoneIds: Set<string>; serviceIds: Set<string>;
}
interface Opt { id: string; name: string }

const PAGE_SIZE = 9;
const ALL = "__all__";

function PendingDashboard() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [zones, setZones] = useState<Opt[]>([]);
  const [services, setServices] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [zone, setZone] = useState<string>(ALL);
  const [service, setService] = useState<string>(ALL);
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
          .select("id, full_name, profile_photo_url, years_experience, is_verified, is_premium, bio, created_at")
          .eq("is_banned", false).order("created_at", { ascending: false }),
        supabase.from("companies")
          .select("id, company_name, logo_url, is_verified, bio, created_at")
          .eq("is_banned", false).order("created_at", { ascending: false }),
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
        tzMap.get(r.technician_id)!.add(String(r.zone_id));
      });
      const tsMap = new Map<string, Set<string>>();
      (tsR.data ?? []).forEach((r: any) => {
        if (!tsMap.has(r.technician_id)) tsMap.set(r.technician_id, new Set());
        tsMap.get(r.technician_id)!.add(String(r.service_id));
      });
      const czMap = new Map<string, Set<string>>();
      (czR.data ?? []).forEach((r: any) => {
        if (!czMap.has(r.company_id)) czMap.set(r.company_id, new Set());
        czMap.get(r.company_id)!.add(String(r.zone_id));
      });
      const csMap = new Map<string, Set<string>>();
      (csR.data ?? []).forEach((r: any) => {
        if (!csMap.has(r.company_id)) csMap.set(r.company_id, new Set());
        csMap.get(r.company_id)!.add(String(r.service_id));
      });

      setZones((zR.data ?? []).map((z: any) => ({ id: String(z.id), name: z.name })));
      setServices((sR.data ?? []).map((s: any) => ({ id: String(s.id), name: s.name })));
      setTechs(
        ((tR.data ?? []) as any[])
          .filter((t) => !t.is_verified || !activeIds.has(t.id))
          .map((t) => ({ ...t, zoneIds: tzMap.get(t.id) ?? new Set(), serviceIds: tsMap.get(t.id) ?? new Set() }))
      );
      setComps(
        ((cR.data ?? []) as any[])
          .filter((c) => !c.is_verified || !activeIds.has(c.id))
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
      return true;
    });
  }, [techs, q, zone, service]);

  const filteredComps = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return comps.filter((c) => {
      if (qn && !c.company_name?.toLowerCase().includes(qn)) return false;
      if (zone !== ALL && !c.zoneIds.has(zone)) return false;
      if (service !== ALL && !c.serviceIds.has(service)) return false;
      return true;
    });
  }, [comps, q, zone, service]);

  useEffect(() => { setTPage(1); setCPage(1); }, [q, zone, service]);

  const tPages = Math.max(1, Math.ceil(filteredTechs.length / PAGE_SIZE));
  const cPages = Math.max(1, Math.ceil(filteredComps.length / PAGE_SIZE));
  const tSlice = filteredTechs.slice((tPage - 1) * PAGE_SIZE, tPage * PAGE_SIZE);
  const cSlice = filteredComps.slice((cPage - 1) * PAGE_SIZE, cPage * PAGE_SIZE);

  const hasFilters = !!(q || zone !== ALL || service !== ALL);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-warning" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Pendentes</h1>
        </div>
        <p className="text-muted-foreground">Perfis ainda sem verificação ou sem assinatura activa.</p>
      </header>

      <FiltersBar
        q={q} setQ={setQ}
        zone={zone} setZone={setZone}
        service={service} setService={setService}
        zones={zones} services={services}
        onClear={() => { setQ(""); setZone(ALL); setService(ALL); }}
        hasFilters={hasFilters}
      />

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Técnicos ({filteredTechs.length})</h2>
        </div>
        {loading ? <Skel /> : tSlice.length === 0 ? <Empty text="Nenhum técnico encontrado." /> : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tSlice.map((t) => (
                <Card key={t.id} className="flex flex-col p-5 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
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
                      <p className="text-xs text-muted-foreground">{t.years_experience ?? 0} anos</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!t.is_verified && <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="mr-1 h-3 w-3" />Não verificado</Badge>}
                        <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Sem assinatura</Badge>
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
        {loading ? <Skel /> : cSlice.length === 0 ? <Empty text="Nenhuma empresa encontrada." /> : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {cSlice.map((c) => (
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!c.is_verified && <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="mr-1 h-3 w-3" />Não verificada</Badge>}
                        <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Sem assinatura</Badge>
                      </div>
                    </div>
                  </div>
                  {c.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>}
                </Card>
              ))}
            </div>
            <Pager page={cPage} pages={cPages} onPage={setCPage} />
          </>
        )}
      </section>
    </div>
  );
}

function Skel() {
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted/40" />)}</div>;
}
function Empty({ text }: { text: string }) {
  return <Card className="p-8 text-center text-sm text-muted-foreground">{text}</Card>;
}
