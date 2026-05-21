import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTACT, whatsappUrl, buildActivationMessage } from "@/lib/constants";
import { Mail, MessageCircle, CreditCard, Smartphone } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — EvoluinF" },
      { name: "description", content: "Fala com a equipa EvoluinF. WhatsApp, email e métodos de pagamento." },
    ],
  }),
  component: ContactoPage,
});

function ContactoPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Contacto</h1>
        <p className="mt-3 text-muted-foreground">A nossa equipa responde em horário comercial, 7 dias por semana.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success/15 p-2.5 text-success"><MessageCircle className="h-5 w-5" /></div>
            <h2 className="font-semibold">WhatsApp</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Resposta mais rápida.</p>
          <p className="mt-3 font-mono text-lg font-semibold">{CONTACT.ownerWhatsappDisplay}</p>
          <Button asChild className="mt-4 w-full bg-success text-success-foreground hover:bg-success/90">
            <a href={whatsappUrl(CONTACT.ownerWhatsapp, buildActivationMessage("", ""))} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/15 p-2.5 text-accent"><Mail className="h-5 w-5" /></div>
            <h2 className="font-semibold">Email</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Para questões formais.</p>
          <p className="mt-3 break-all text-sm font-semibold">{CONTACT.email}</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <a href={`mailto:${CONTACT.email}`}>Enviar email</a>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><CreditCard className="h-5 w-5" /></div>
            <h2 className="font-semibold">Transferência (IBAN)</h2>
          </div>
          <p className="mt-3 font-mono text-sm font-semibold">{CONTACT.iban}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-premium/15 p-2.5 text-premium"><Smartphone className="h-5 w-5" /></div>
            <h2 className="font-semibold">Xpress</h2>
          </div>
          <p className="mt-3 font-mono text-sm font-semibold">{CONTACT.xpress}</p>
        </Card>
      </div>
    </div>
  );
}
