import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { uploadPrivate } from "@/lib/upload";

export const Route = createFileRoute("/payment")({
  component: PaymentPage,
  validateSearch: (search: Record<string, any>) => ({
    plan: search.plan || "simples",
    tech_id: search.tech_id,
  }),
});

function PaymentPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"payment" | "proof">("payment");

  const planInfo: Record<
    string,
    { name: string; price: number; features: string[] }
  > = {
    simples: {
      name: "Técnico Simples",
      price: 1000,
      features: ["Perfil público", "Listagem padrão"],
    },
    premium: {
      name: "Técnico Premium",
      price: 2000,
      features: ["Selo PREMIUM", "Destaque visual", "Prioridade na listagem"],
    },
  };

  const plan = planInfo[search.plan] || planInfo.simples;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ficheiro maior que 5MB");
      return;
    }

    setUploading(true);
    try {
      const path = await uploadPrivate(user!.id, file, "payment_proofs");

      const { data: sub, error } = await supabase
        .from("subscriptions")
        .insert({
          owner_id: user!.id,
          owner_type: "technician",
          plan: search.plan as "simples" | "premium" | "empresa_mensal",
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      if (sub) {
        await supabase.from("payment_proofs").insert({
          subscription_id: sub.id,
          owner_id: user!.id,
          file_path: path,
          plan: search.plan as "simples" | "premium" | "empresa_mensal",
        });
      }

      toast.success(
        "Comprovativo enviado! O admin ativará em até 24h úteis."
      );
      setStep("payment");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Ativar {plan.name}
        </h1>

        {step === "payment" && (
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-2">
                {plan.name}
              </h2>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                {plan.price} Kz /mês
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-blue-800 flex items-center gap-2">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Payment Methods */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">1. Efectua o pagamento</h3>

              {/* IBAN */}
              <Card className="p-4 bg-slate-50">
                <p className="text-sm text-slate-600 mb-2">Transferência Bancária (IBAN)</p>
                <div className="bg-white p-3 rounded font-mono text-sm break-all border border-slate-200">
                  0058 0000 0749 1366 1012 0
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText("0058000007491366101200");
                    toast.success("IBAN copiado!");
                  }}
                >
                  Copiar IBAN
                </Button>
              </Card>

              {/* Xpress */}
              <Card className="p-4 bg-slate-50">
                <p className="text-sm text-slate-600 mb-2">Via Xpress</p>
                <div className="bg-white p-3 rounded font-mono text-sm border border-slate-200">
                  947470500
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText("947470500");
                    toast.success("Número Xpress copiado!");
                  }}
                >
                  Copiar Número
                </Button>
              </Card>

              {/* Important Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-900 font-semibold mb-2">
                  ⚠️ Importante:
                </p>
                <p className="text-amber-800 text-sm">
                  Após efectuar o pagamento, suba o comprovativo na próxima etapa. O admin ativará a sua assinatura em até 24h úteis.
                </p>
              </div>
            </div>

            {/* Next Button */}
            <Button
              onClick={() => setStep("proof")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 font-bold"
            >
              Continuar → Enviar Comprovativo
            </Button>
          </div>
        )}

        {step === "proof" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">2. Envia o comprovativo</h3>

            <Card className="p-6 border-2 border-dashed border-blue-300 bg-blue-50">
              <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                <div className="text-4xl mb-2">📄</div>
                <p className="font-semibold text-slate-900">
                  Clica para selecionar o ficheiro
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  PNG, JPG ou PDF (máx. 5MB)
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-center text-blue-600 font-semibold mt-2">A enviar...</p>}
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900 font-semibold mb-2">✓ Próximas etapas:</p>
              <ol className="text-green-800 text-sm space-y-1">
                <li>1. Envia o comprovativo</li>
                <li>2. O admin confirma o pagamento</li>
                <li>3. Tua assinatura fica ativa (até 24h úteis)</li>
                <li>4. Teu WhatsApp fica visível aos clientes</li>
              </ol>
            </div>

            <Button
              variant="outline"
              onClick={() => setStep("payment")}
              className="w-full"
            >
              ← Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
