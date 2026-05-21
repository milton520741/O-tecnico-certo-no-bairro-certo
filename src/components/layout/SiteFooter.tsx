import { Link } from "@tanstack/react-router";
import { BRAND, CONTACT } from "@/lib/constants";
import { Mail, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-display text-lg font-bold text-foreground">{BRAND.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{BRAND.slogan}</p>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Diretório profissional de técnicos e empresas por bairros e zonas de Luanda.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Explorar</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/technicians" className="hover:text-foreground">Técnicos</Link></li>
            <li><Link to="/planos" className="hover:text-foreground">Planos</Link></li>
            <li><Link to="/contacto" className="hover:text-foreground">Contacto</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Entrar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-accent" />{CONTACT.ownerWhatsappDisplay}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /><a href={`mailto:${CONTACT.email}`} className="hover:text-foreground break-all">{CONTACT.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.</p>
          <p>Feito em Luanda · Angola</p>
        </div>
      </div>
    </footer>
  );
}
