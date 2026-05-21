import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wrench, Building2, CreditCard, FileImage } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Painel — EvoluinF" }] }),
  component: DashboardLanding,
});

function DashboardLanding() {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState<{ plan: string; status: string; end_at: string | null } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard" } as never });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("plan,status,end_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSub(data));
  }, [user]);

  if (isLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const isTech = roles.includes("technician");
  const isCompany = roles.includes("company");

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Olá, {user.email}</h1>
      <p className="mt-1 text-muted-foreground">Bem-vindo ao teu painel EvoluinF.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              {isCompany ? <Building2 className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
            </div>
            <h2 className="font-semibold">Perfil</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Edita os teus dados, foto e zonas de atuação.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to={isCompany ? "/company-dashboard" : "/dashboard"}>Em breve (Etapa 2)</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/15 p-2.5 text-accent"><CreditCard className="h-5 w-5" /></div>
            <h2 className="font-semibold">Assinatura</h2>
          </div>
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Estado: </span>
            <span className="font-semibold capitalize">{sub?.status ?? "—"}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Plano: </span>
            <span className="font-semibold">{sub?.plan ?? "—"}</span>
          </p>
          {sub?.end_at && (
            <p className="text-sm">
              <span className="text-muted-foreground">Válida até: </span>
              <span className="font-semibold">{new Date(sub.end_at).toLocaleDateString("pt-AO")}</span>
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-premium/15 p-2.5 text-premium"><FileImage className="h-5 w-5" /></div>
            <h2 className="font-semibold">Comprovativos</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Envia o comprovativo após pagamento.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </Card>
      </div>

      <Card className="mt-8 border-dashed bg-secondary/30 p-6">
        <p className="text-sm text-muted-foreground">
          ✨ <strong>ETAPA 1 concluída:</strong> backend, autenticação, design system e estrutura pública estão prontos.
          As próximas etapas trazem edição de perfil, upload de fotos/portfólio, listagem completa de técnicos com filtros, e painel admin para aprovação de assinaturas.
        </p>
        {isTech && <p className="mt-2 text-xs text-success">Conta de Técnico ativa.</p>}
        {isCompany && <p className="mt-2 text-xs text-success">Conta de Empresa ativa.</p>}
      </Card>
    </div>
  );
}
