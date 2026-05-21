import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Building2, Wrench } from "lucide-react";
import { PLANS, formatKz, CONTACT, whatsappUrl, buildActivationMessage } from "@/lib/constants";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — EvoluinF" },
      { name: "description", content: "Planos mensais para técnicos e empresas. A partir de 1.000 Kz/mês." },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const plans = [
    { ...PLANS.simples, icon: Wrench, highlight: false },
    { ...PLANS.premium, icon: Crown, highlight: true },
    { ...PLANS.empresa_mensal, icon: Building2, highlight: false },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Planos mensais</h1>
        <p className="mt-3 text-muted-foreground">
          Cadastro simples, pagamento por transferência ou Xpress e ativação manual após envio do comprovativo.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={`relative flex flex-col p-7 transition-smooth hover:-translate-y-1 ${p.highlight ? "premium-border shadow-premium bg-gradient-card" : "bg-card shadow-elegant"}`}>
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-premium px-3 py-1 text-xs font-bold uppercase tracking-wider text-premium-foreground">
                Mais escolhido
              </span>
            )}
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${p.highlight ? "bg-gradient-premium text-premium-foreground" : "bg-gradient-primary text-primary-foreground"}`}>
              <p.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">{p.label}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">{formatKz(p.price)}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <Button asChild className={`mt-7 ${p.highlight ? "bg-gradient-premium text-premium-foreground" : "bg-gradient-primary text-primary-foreground"}`}>
              <Link to="/auth" search={{ mode: "signup" } as never}>Começar agora</Link>
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment info */}
      <Card className="mt-12 mx-auto max-w-3xl border-border/60 p-6 md:p-8">
        <h2 className="font-display text-xl font-bold">Como pagar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O pagamento é feito por transferência bancária ou Xpress. Após o pagamento, envia o comprovativo no teu painel ou via WhatsApp.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Transferência (IBAN)</p>
            <p className="mt-1 font-mono text-sm font-semibold">{CONTACT.iban}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Xpress</p>
            <p className="mt-1 font-mono text-sm font-semibold">{CONTACT.xpress}</p>
          </div>
        </div>
        <Button asChild className="mt-6 w-full sm:w-auto" variant="outline">
          <a href={whatsappUrl(CONTACT.ownerWhatsapp, buildActivationMessage("", ""))} target="_blank" rel="noreferrer">
            Falar com EvoluinF no WhatsApp
          </a>
        </Button>
      </Card>
    </div>
  );
}
