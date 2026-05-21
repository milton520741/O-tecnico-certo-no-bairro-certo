import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, Shield } from "lucide-react";

export function SiteHeader() {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/technicians" className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
            Técnicos
          </Link>
          <Link to="/planos" className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
            Planos
          </Link>
          <Link to="/contacto" className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
            Contacto
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/admin"><Shield className="mr-1.5 h-4 w-4" />Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><UserIcon className="mr-1.5 h-4 w-4" />Painel</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant">
                <Link to="/auth?mode=signup">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
