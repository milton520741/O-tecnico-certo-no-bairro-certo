import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Crown,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/technician/$id")({
  head: () => ({
    meta: [
      { title: "Perfil de Técnico — EvoluinF" },
      {
        name: "description",
        content:
          "Veja o perfil completo do técnico, portfólio, serviços e zonas de atuação em Luanda.",
      },
    ],
  }),
  component: TechnicianProfilePage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Técnico não encontrado</h1>
      <Button asChild variant="link" className="mt-4">
        <Link to="/technicians">Voltar à listagem</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-20 text-center text-sm text-muted-foreground">
      Ocorreu um erro a carregar o perfil. {error.message}
    </div>
  ),
});

interface Technician {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  bio: string | null;
  phone_whatsapp: string | null;
  years_experience: number | null;
  is_verified: boolean;
  is_premium: boolean;
}

interface PortfolioItem {
  id: number;
  image_url: string;
  caption: string | null;
}

function TechnicianProfilePage() {
  const { id } = Route.useParams();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: tech } = await supabase
        .from("technicians")
        .select(
          "id, full_name, profile_photo_url, bio, phone_whatsapp, years_experience, is_verified, is_premium"
        )
        .eq("id", id)
        .eq("is_banned", false)
        .maybeSingle();

      if (cancelled) return;
      if (!tech) {
        setTechnician(null);
        setLoading(false);
        return;
      }
      setTechnician(tech as Technician);

      const [svcRes, znRes, pfRes, subRes] = await Promise.all([
        supabase
          .from("technician_services")
          .select("services(name)")
          .eq("technician_id", id),
        supabase
          .from("technician_zones")
          .select("zones(name)")
          .eq("technician_id", id),
        supabase
          .from("portfolio_items")
          .select("id, image_url, caption")
          .eq("technician_id", id)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("subscriptions")
          .select("status, end_at")
          .eq("owner_id", id)
          .eq("status", "active")
          .order("end_at", { ascending: false })
          .limit(1),
      ]);

      if (cancelled) return;
      setServices(
        (svcRes.data ?? [])
          .map((row: any) => row.services?.name)
          .filter(Boolean)
      );
      setZones(
        (znRes.data ?? []).map((row: any) => row.zones?.name).filter(Boolean)
      );
      setPortfolio((pfRes.data ?? []) as PortfolioItem[]);
      const sub = subRes.data?.[0];
      setHasActive(
        !!sub && (!sub.end_at || new Date(sub.end_at) > new Date())
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="h-64 animate-pulse bg-muted/40" />
      </div>
    );
  }

  if (!technician) throw notFound();

  const whatsappDigits = technician.phone_whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappLink = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Olá ${technician.full_name}, vi o seu perfil no EvoluinF e gostaria de um orçamento.`
      )}`
    : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/technicians"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-smooth hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à listagem
      </Link>

      {/* Header card */}
      <Card
        className={`p-6 md:p-8 ${
          technician.is_premium
            ? "premium-border bg-gradient-card shadow-premium"
            : ""
        }`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-secondary md:h-32 md:w-32">
            {technician.profile_photo_url ? (
              <img
                src={technician.profile_photo_url}
                alt={technician.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-bold text-muted-foreground">
                {technician.full_name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold md:text-3xl">
                  {technician.full_name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {technician.years_experience ?? 0} anos de experiência
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {technician.is_premium && (
                  <Badge className="bg-gradient-premium text-premium-foreground">
                    <Crown className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                )}
                {technician.is_verified && (
                  <Badge
                    variant="secondary"
                    className="bg-success/15 text-success"
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verificado
                  </Badge>
                )}
              </div>
            </div>

            {technician.bio && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {technician.bio}
              </p>
            )}

            {/* Contacto visível quando credenciado (verificado + premium) ou com assinatura activa */}
            <div className="mt-6">
              {(hasActive || (technician.is_verified && technician.is_premium)) && whatsappDigits ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  {whatsappLink && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-success text-success-foreground hover:bg-success/90 sm:w-auto"
                    >
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Contactar via WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <a href={`tel:${whatsappDigits}`}>
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Ligar agora
                    </a>
                  </Button>
                </div>
              ) : (
                <Card className="border-dashed bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Contacto bloqueado</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Este técnico ainda não foi credenciado. Após o pagamento e credenciamento, o WhatsApp e o número de chamada ficarão visíveis aqui.
                      </p>
                      <Button
                        asChild
                        className="mt-3 bg-gradient-primary text-primary-foreground"
                      >
                        <Link to="/planos">Ver planos</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Services & zones */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> Serviços
          </h2>
          {services.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Sem serviços indicados.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {services.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-accent" /> Zonas de atuação
          </h2>
          {zones.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Sem zonas indicadas.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {zones.map((z) => (
                <Badge key={z} variant="outline">
                  {z}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Portfolio */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Portfólio</h2>
        {portfolio.length === 0 ? (
          <Card className="mt-3 p-8 text-center text-sm text-muted-foreground">
            Este técnico ainda não publicou trabalhos.
          </Card>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {portfolio.map((p) => (
              <figure
                key={p.id}
                className="group overflow-hidden rounded-xl border bg-card"
              >
                <img
                  src={p.image_url}
                  alt={p.caption ?? "Trabalho do técnico"}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-smooth group-hover:scale-105"
                />
                {p.caption && (
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                    {p.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
