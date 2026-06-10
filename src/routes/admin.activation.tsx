import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Clock, XCircle, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { PLANS, formatKz, type PlanId } from "@/lib/constants";

export const Route = createFileRoute("/admin/activation")({
  head: () => ({ meta: [{ title: "Ativação de Contatos — Admin" }] }),
  component: ActivationPage,
});

type ActivationRequest = {
  id: number;
  owner_id: string;
  plan: string;
  note: string | null;
  created_at: string;
  reviewed: boolean;
  user_email?: string;
  user_name?: string;
};

function ActivationPage() {
  const { user, roles } = useAuth();
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!roles.includes("admin")) {
      toast.error("Acesso negado");
      return;
    }

    fetchRequests();
  }, [roles]);

  async function fetchRequests() {
    try {
      // Get all payment proofs
      const { data: proofs, error: proofsError } = await supabase
        .from("payment_proofs")
        .select("id, owner_id, plan, note, created_at, reviewed")
        .order("created_at", { ascending: false });

      if (proofsError) throw proofsError;

      // Get user info for each proof
      const enrichedRequests = await Promise.all(
        (proofs ?? []).map(async (proof) => {
          const { data: userData } = await supabase
            .from("users")
            .select("email, name")
            .eq("id", proof.owner_id)
            .single();

          return {
            ...proof,
            user_email: userData?.email,
            user_name: userData?.name,
          };
        })
      );

      setRequests(enrichedRequests);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(id: string, userId: string, plan: string) {
    setActivating(id);
    try {
      // Mark as reviewed
      const { error: updateError } = await supabase
        .from("payment_proofs")
        .update({ reviewed: true })
        .eq("id", id);

      if (updateError) throw updateError;

      // Activate subscription for user
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({
          plan: plan,
          status: "active",
          activated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (subError && !subError.message.includes("no rows")) throw subError;

      toast.success(`Contato ativado com sucesso! Plano: ${PLANS[plan as PlanId]?.label}`);
      fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar");
    } finally {
      setActivating(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectionNote.trim()) {
      return toast.error("Adiciona um motivo para rejeição");
    }

    setRejecting(id);
    try {
      const { error } = await supabase
        .from("payment_proofs")
        .update({
          reviewed: false,
          note: `[REJEITADO] ${rejectionNote}`,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Pedido rejeitado");
      setRejectionNote("");
      setSelectedId(null);
      fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao rejeitar");
    } finally {
      setRejecting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => !r.reviewed);
  const approvedRequests = requests.filter((r) => r.reviewed);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Ativação de Contatos</h1>
      <p className="mt-1 text-muted-foreground">Verificar e ativar contatos após pagamento confirmado</p>

      {pendingRequests.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">
            <Clock className="mr-2 inline h-5 w-5 text-yellow-600" />
            Pendentes ({pendingRequests.length})
          </h2>

          <div className="mt-4 grid gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* User Info */}
                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Utilizador</p>
                        <div className="mt-1 flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{req.user_name || "N/A"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-mono text-sm">{req.user_email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano</p>
                        <p className="mt-1 font-semibold">{PLANS[req.plan as PlanId]?.label || req.plan}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor</p>
                        <p className="mt-1 font-semibold">{formatKz(PLANS[req.plan as PlanId]?.price || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {req.note && (
                  <div className="mt-4 rounded-lg bg-secondary/40 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Referência do pagamento</p>
                    <p className="mt-1 text-sm">{req.note}</p>
                  </div>
                )}

                {/* Data */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Pedido em: {new Date(req.created_at).toLocaleString("pt-AO")}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleActivate(req.id.toString(), req.owner_id, req.plan)}
                    disabled={activating === req.id.toString()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {activating === req.id.toString() ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Ativar
                  </Button>

                  {selectedId === req.id.toString() ? (
                    <div className="w-full space-y-2">
                      <Textarea
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        placeholder="Motivo da rejeição..."
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReject(req.id.toString())}
                          disabled={rejecting === req.id.toString()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {rejecting === req.id.toString() ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Rejeitar
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedId(null);
                            setRejectionNote("");
                          }}
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedId(req.id.toString())}
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {approvedRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            <CheckCircle2 className="mr-2 inline h-5 w-5 text-green-600" />
            Ativados ({approvedRequests.length})
          </h2>

          <div className="mt-4 grid gap-3">
            {approvedRequests.map((req) => (
              <Card key={req.id} className="flex items-center justify-between p-4 opacity-75">
                <div>
                  <p className="font-medium">{req.user_name || req.user_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLANS[req.plan as PlanId]?.label || req.plan}
                  </p>
                </div>
                <Badge className="bg-green-600">Ativado</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
          <p className="text-muted-foreground">Nenhum pedido de ativação</p>
        </div>
      )}
    </div>
  );
}
