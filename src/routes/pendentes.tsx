import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Wrench, Clock, AlertCircle } from "lucide-react";

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
  years_experience: number | null; is_verified: boolean; bio: string | null;
}
interface Comp {
  id: string; company_name: string; logo_url: string | null;
  is_verified: boolean; bio: string | null;
}

function PendingDashboard() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: subs } = await supabase
        .from("subscriptions").select("owner_id, end_at").eq("status", "active");
      const now = new Date();
      const activeIds = new Set(
        (subs ?? []).filter((s: any) => !s.end_at || new Date(s.end_at) > now).map((s: any) => s.owner_id)
      );

      const [tRes, cRes] = await Promise.all([
        supabase.from("technicians")
          .select("id, full_name, profile_photo_url, years_experience, is_verified, bio")
          .eq("is_banned", false).order("created_at", { ascending: false }),
        supabase.from("companies")
          .select("id, company_name, logo_url, is_verified, bio")
          .eq("is_banned", false).order("created_at", { ascending: false }),
      ]);
      setTechs(((tRes.data ?? []) as Tech[]).filter((t) => !t.is_verified || !activeIds.has(t.id)));
      setComps(((cRes.data ?? []) as Comp[]).filter((c) => !c.is_verified || !activeIds.has(c.id)));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-warning" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Pendentes</h1>
        </div>
        <p className="text-muted-foreground">Perfis ainda sem verificação ou sem assinatura activa.</p>
      </header>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Técnicos ({techs.length})</h2>
        </div>
        {loading ? <Skel /> : techs.length === 0 ? <Empty text="Sem técnicos pendentes." /> : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {techs.map((t) => (
              <Card key={t.id} className="flex flex-col p-5 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {t.profile_photo_url ? (
                      <img src={t.profile_photo_url} alt={t.full_name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">
                        {t.full_name?.charAt(0)?.toUpperCase()}
                      </div>
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
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Empresas ({comps.length})</h2>
        </div>
        {loading ? <Skel /> : comps.length === 0 ? <Empty text="Sem empresas pendentes." /> : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {comps.map((c) => (
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
        )}
      </section>
    </div>
  );
}

function Skel() {
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted/40" />)}</div>;
}
function Empty({ text }: { text: string }) {
  return <Card className="p-8 text-center text-sm text-muted-foreground">{text}</Card>;
}
