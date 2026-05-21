import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, ShieldCheck, Sparkles, Search } from "lucide-react";

type SearchParams = { zone?: string; service?: string; verified?: string; premium?: string };

export const Route = createFileRoute("/technicians")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    zone: typeof s.zone === "string" ? s.zone : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
    verified: s.verified === "1" ? "1" : undefined,
    premium: s.premium === "1" ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Técnicos em Luanda — EvoluinF" },
      { name: "description", content: "Veja todos os técnicos verificados em Luanda. Filtre por bairro e serviço." },
    ],
  }),
  component: TechniciansPage,
});

interface Tech {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  years_experience: number | null;
  is_verified: boolean;
  is_premium: boolean;
  bio: string | null;
}
interface Option { id: number; name: string; slug: string }

function TechniciansPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [zones, setZones] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("zones").select("id,name,slug").order("name").then(({ data }) => setZones(data ?? []));
    supabase.from("services").select("id,name,slug").order("name").then(({ data }) => setServices(data ?? []));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("technicians")
        .select("id, full_name, profile_photo_url, years_experience, is_verified, is_premium, bio")
        .eq("is_banned", false);
      if (search.verified === "1") q = q.eq("is_verified", true);
      if (search.premium === "1") q = q.eq("is_premium", true);
      const { data } = await q
        .order("is_premium", { ascending: false })
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (!cancelled) {
        setTechs((data ?? []) as Tech[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search.verified, search.premium, search.zone, search.service]);

  const setParam = (key: keyof SearchParams, value: string | undefined) => {
    navigate({ to: "/technicians", search: { ...search, [key]: value } as never });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Técnicos em Luanda</h1>
        <p className="text-muted-foreground">Encontre o profissional certo, no bairro certo.</p>
      </header>

      {/* Filters */}
      <Card className="mt-6 p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <Select value={search.zone ?? ""} onValueChange={(v) => setParam("zone", v || undefined)}>
            <SelectTrigger><MapPin className="mr-2 h-4 w-4 text-accent" /><SelectValue placeholder="Todas as zonas" /></SelectTrigger>
            <SelectContent>
              {zones.map((z) => <SelectItem key={z.id} value={z.slug}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.service ?? ""} onValueChange={(v) => setParam("service", v || undefined)}>
            <SelectTrigger><Search className="mr-2 h-4 w-4 text-accent" /><SelectValue placeholder="Todos os serviços" /></SelectTrigger>
            <SelectContent>
              {services.map((s) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-md border border-input px-3">
            <Switch id="vf" checked={search.verified === "1"} onCheckedChange={(c) => setParam("verified", c ? "1" : undefined)} />
            <Label htmlFor="vf" className="text-sm">Verificado</Label>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-input px-3">
            <Switch id="pf" checked={search.premium === "1"} onCheckedChange={(c) => setParam("premium", c ? "1" : undefined)} />
            <Label htmlFor="pf" className="text-sm">Premium</Label>
          </div>
        </div>
      </Card>

      {/* Grid */}
      <section className="mt-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-56 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : techs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-semibold">Ainda não há técnicos cadastrados</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Em breve a comunidade EvoluinF estará cheia de profissionais. Sê o primeiro a cadastrar-te!
            </p>
            <Button asChild className="mt-5 bg-gradient-primary text-primary-foreground">
              <Link to="/planos">Cadastrar-me</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {techs.map((t) => (
              <Card key={t.id} className={`group flex flex-col p-5 transition-smooth hover:-translate-y-1 hover:shadow-elegant ${t.is_premium ? "premium-border bg-gradient-card shadow-premium" : ""}`}>
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
                    <p className="text-xs text-muted-foreground">{t.years_experience ?? 0} anos de experiência</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.is_premium && (
                        <Badge className="bg-gradient-premium text-premium-foreground"><Crown className="mr-1 h-3 w-3" />Premium</Badge>
                      )}
                      {t.is_verified && (
                        <Badge variant="secondary" className="bg-success/15 text-success"><ShieldCheck className="mr-1 h-3 w-3" />Verificado</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {t.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{t.bio}</p>}
                <Button asChild variant="outline" className="mt-4 w-full" disabled>
                  <span>Ver perfil (Etapa 3)</span>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
