import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldCheck, Sparkles, MapPin, Users, Star, ArrowRight, Zap, Wrench, Hammer } from "lucide-react";
import heroImg from "@/assets/hero-technician.jpg";
import { BRAND } from "@/lib/constants";

interface Option { id: number; name: string; slug: string }

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EvoluinF — Encontre Técnicos Verificados em Luanda" },
      { name: "description", content: "Eletricistas, canalizadores, pintores e mais. Técnicos verificados por bairro em Luanda. Resposta rápida via WhatsApp." },
      { property: "og:title", content: "EvoluinF — Diretório de Técnicos em Luanda" },
      { property: "og:description", content: "Encontre o profissional certo, no bairro certo. Verificados e prontos a responder." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [zone, setZone] = useState<string>("");
  const [service, setService] = useState<string>("");

  useEffect(() => {
    supabase.from("zones").select("id,name,slug").order("name").then(({ data }) => setZones(data ?? []));
    supabase.from("services").select("id,name,slug").order("name").then(({ data }) => setServices(data ?? []));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (zone) params.set("zone", zone);
    if (service) params.set("service", service);
    navigate({ to: "/technicians", search: Object.fromEntries(params) as never });
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 opacity-25 mix-blend-overlay">
          <img src={heroImg} alt="" className="h-full w-full object-cover" width={1920} height={1080} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="container relative mx-auto grid gap-12 px-4 pb-20 pt-16 md:grid-cols-2 md:pt-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {BRAND.slogan}
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl">
              O técnico certo,<br />
              <span className="bg-gradient-to-r from-[oklch(0.9_0.05_200)] to-[oklch(0.78_0.13_80)] bg-clip-text text-transparent">
                no bairro certo.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
              Diretório premium de técnicos e empresas verificadas em Luanda.
              Eletricistas, canalizadores, pintores e muito mais — a um clique de WhatsApp.
            </p>

            {/* Search card */}
            <Card className="mt-8 border-white/10 bg-white/95 p-4 shadow-elegant backdrop-blur md:p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className="h-12 border-border bg-background">
                    <MapPin className="mr-2 h-4 w-4 text-accent" />
                    <SelectValue placeholder="Bairro / zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.slug}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger className="h-12 border-border bg-background">
                    <Wrench className="mr-2 h-4 w-4 text-accent" />
                    <SelectValue placeholder="Serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="lg" onClick={handleSearch} className="h-12 bg-gradient-primary text-primary-foreground shadow-elegant">
                  <Search className="mr-2 h-4 w-4" /> Ver Técnicos
                </Button>
              </div>
            </Card>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[oklch(0.78_0.13_80)]" /> Técnicos verificados</div>
              <div className="flex items-center gap-2"><Users className="h-5 w-5 text-[oklch(0.78_0.13_80)]" /> 15+ zonas de Luanda</div>
              <div className="flex items-center gap-2"><Star className="h-5 w-5 text-[oklch(0.78_0.13_80)]" /> Resposta rápida</div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent/30 to-premium/30 blur-3xl" />
            <img
              src={heroImg}
              alt="Técnico profissional pronto a ajudar"
              className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-elegant"
              width={1080}
              height={1350}
            />
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card p-4 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-success/15 p-2 text-success"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Selo</p>
                  <p className="text-sm font-semibold">Verificado EvoluinF</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Rápido", desc: "Filtre por bairro e serviço e contacte por WhatsApp em segundos." },
            { icon: ShieldCheck, title: "Confiável", desc: "Técnicos verificados manualmente pela nossa equipa." },
            { icon: Hammer, title: "Para todo o tipo de obra", desc: "Eletricista, pintor, canalizador, mecânico e muito mais." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/60 bg-gradient-card p-6 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="overflow-hidden border-border/60 bg-gradient-hero p-8 text-white md:p-12">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold">És técnico ou empresa?</h2>
              <p className="mt-2 max-w-xl text-white/85">
                Junta-te ao EvoluinF, recebe contactos qualificados e destaca o teu trabalho com o selo PREMIUM.
              </p>
            </div>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/planos">Ver Planos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
}
