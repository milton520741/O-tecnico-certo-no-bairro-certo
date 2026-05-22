import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wrench, Building2, CreditCard, FileImage, ImageIcon, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
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

  const statusBadge = () => {
    if (!sub) return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />Sem assinatura</Badge>;
    if (sub.status === "active") return <Badge className="gap-1 bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3" />Ativa</Badge>;
    if (sub.status === "pending") return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />A aguardar aprovação</Badge>;
    return <Badge variant="secondary" className="capitalize">{sub.status}</Badge>;
  };

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
          <p className="mt-2 text-sm text-muted-foreground">Edita os teus dados, foto, serviços e zonas.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/dashboard/perfil">Editar perfil <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </Card>

        {isTech && (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/15 p-2.5 text-accent"><ImageIcon className="h-5 w-5" /></div>
              <h2 className="font-semibold">Portfólio</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Adiciona até 12 imagens dos teus trabalhos.</p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/dashboard/portfolio">Gerir portfólio <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-premium/15 p-2.5 text-premium"><FileImage className="h-5 w-5" /></div>
            <h2 className="font-semibold">Comprovativos</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Envia comprovativo após o pagamento.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/dashboard/comprovativo">Enviar comprovativo <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><CreditCard className="h-5 w-5" /></div>
            <h2 className="font-semibold">Estado da assinatura</h2>
          </div>
          {statusBadge()}
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">Plano: </span><span className="font-semibold">{sub?.plan ?? "—"}</span></div>
          <div><span className="text-muted-foreground">Estado: </span><span className="font-semibold capitalize">{sub?.status ?? "—"}</span></div>
          <div><span className="text-muted-foreground">Válida até: </span><span className="font-semibold">{sub?.end_at ? new Date(sub.end_at).toLocaleDateString("pt-AO") : "—"}</span></div>
        </div>
        {(!sub || sub.status !== "active") && (
          <Button asChild className="mt-4 bg-gradient-primary text-primary-foreground">
            <Link to="/planos">Ver planos</Link>
          </Button>
        )}
        {isTech && <p className="mt-3 text-xs text-success">Conta de Técnico ativa.</p>}
        {isCompany && <p className="mt-3 text-xs text-success">Conta de Empresa ativa.</p>}
      </Card>
    </div>
  );
}
