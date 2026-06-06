import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadPrivate, fileFromInput } from "@/lib/upload";
import { PLANS, formatKz, CONTACT, whatsappUrl, buildActivationMessage, type PlanId } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/comprovativo")({
  head: () => ({ meta: [{ title: "Comprovativo — EvoluinF" }] }),
  component: ComprovativoPage,
});

type Proof = { id: number; created_at: string; plan: string; reviewed: boolean; note: string | null };

function ComprovativoPage() {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  const isCompany = roles.includes("company");

  const [plan, setPlan] = useState<PlanId>(isCompany ? "empresa_mensal" : "simples");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Proof[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard/comprovativo" } as never });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("payment_proofs").select("id,created_at,plan,reviewed,note").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setHistory(data ?? []); setLoadingHist(false); });
  }, [user]);

  useEffect(() => {
    setPlan(isCompany ? "empresa_mensal" : "simples");
  }, [isCompany]);

  if (isLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const availablePlans = (Object.values(PLANS) as Array<typeof PLANS[PlanId]>).filter((p) =>
    isCompany ? p.owner === "company" : p.owner === "technician"
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const f = fileFromInput(e);
      setFile(f);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ficheiro inválido");
      e.target.value = "";
    }
  }

  async function submit() {
    if (!file) return toast.error("Anexa o comprovativo (imagem ou PDF).");
    if (!user) return;
    setSubmitting(true);
    try {
      const path = await uploadPrivate(user.id, file, "proofs");

      const { error: pErr } = await supabase.from("payment_proofs").insert({
        owner_id: user.id,
        plan,
        file_path: path,
        note: note.trim() || null,
        reviewed: false,
      });
      if (pErr) throw pErr;

      toast.success("Comprovativo enviado! A abrir WhatsApp...");
      setFile(null);
      setNote("");
      const { data } = await supabase.from("payment_proofs").select("id,created_at,plan,reviewed,note").eq("owner_id", user.id).order("created_at", { ascending: false });
      setHistory(data ?? []);

      // Automatically notify via WhatsApp after successful upload
      setTimeout(() => {
        const whatsappLink = whatsappUrl(CONTACT.ownerWhatsapp, buildActivationMessage(user.email ?? "", plan));
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
      }, 800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Voltar ao painel</Link>
      </Button>
      <h1 className="font-display text-3xl font-bold">Enviar comprovativo</h1>
      <p className="mt-1 text-muted-foreground">Faz o pagamento e envia o comprovativo. O admin ativa a tua assinatura em até 24h úteis.</p>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">1. Dados de pagamento</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">IBAN</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold">{CONTACT.iban}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Xpress</p>
            <p className="mt-1 font-mono text-sm font-semibold">{CONTACT.xpress}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="font-semibold">2. Escolhe o plano</h2>
        <RadioGroup value={plan} onValueChange={(v) => setPlan(v as PlanId)} className="mt-3 grid gap-3">
          {availablePlans.map((p) => (
            <label key={p.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 transition-colors ${plan === p.id ? "border-primary bg-primary/5" : "border-input hover:bg-accent"}`}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value={p.id} id={p.id} />
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.perks.join(" • ")}</p>
                </div>
              </div>
              <span className="font-semibold">{formatKz(p.price)}</span>
            </label>
          ))}
        </RadioGroup>
      </Card>

      <Card className="mt-5 space-y-4 p-6">
        <h2 className="font-semibold">3. Anexa o comprovativo</h2>
        <div>
          <Label htmlFor="proof" className="inline-flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed border-input bg-secondary/30 px-4 py-6 text-sm font-medium hover:bg-accent">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Clique para anexar imagem ou PDF (máx 5MB)"}
          </Label>
          <input id="proof" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <Label htmlFor="note">Nota (opcional)</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} placeholder="Referência da transferência, telefone usado no Xpress..." />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={submit} disabled={submitting || !file} className="bg-gradient-primary text-primary-foreground">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Enviar e notificar via WhatsApp
          </Button>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Histórico de envios</h2>
        {loadingHist ? (
          <div className="mt-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Ainda não enviaste nenhum comprovativo.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{PLANS[h.plan as PlanId]?.label ?? h.plan}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-AO")}</p>
                </div>
                {h.reviewed ? (
                  <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-success" />Revisto</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-start gap-2 rounded-md bg-secondary/40 p-3 text-xs text-muted-foreground">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          O comprovativo é privado. Apenas tu e a equipa EvoluinF têm acesso ao ficheiro.
        </p>
      </Card>
    </div>
  );
}
