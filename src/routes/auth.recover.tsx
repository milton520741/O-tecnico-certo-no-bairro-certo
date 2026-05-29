import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/recover")({
  head: () => ({
    meta: [
      { title: "Recuperar Palavra-passe — EvoluinF" },
      { name: "description", content: "Redefine a tua palavra-passe EvoluinF." },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email é obrigatório");

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) throw error;

      setSent(true);
      toast.success("Email de recuperação enviado! Verifica a tua caixa de correio.");
      setTimeout(() => {
        navigate({ to: "/auth" });
      }, 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 shadow-elegant md:p-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/auth"><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Link>
        </Button>

        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Recuperar Palavra-passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Envia-te um email com instruções para redefinir a tua palavra-passe.
          </p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-center">
            <p className="text-sm text-success font-medium">
              ✓ Email enviado com sucesso!
            </p>
            <p className="mt-2 text-xs text-success/80">
              Verifica a tua caixa de correio e segue as instruções para redefinir a palavra-passe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar email de recuperação
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
