import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Trash2, ArrowLeft, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadPublic, fileFromInput } from "@/lib/upload";

export const Route = createFileRoute("/dashboard/portfolio")({
  head: () => ({ meta: [{ title: "Portfólio — EvoluinF" }] }),
  component: PortfolioPage,
});

type Item = { id: number; image_url: string; caption: string | null };

function PortfolioPage() {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard/portfolio" } as never });
  }, [isLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("portfolio_items").select("id,image_url,caption").eq("technician_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  if (isLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!roles.includes("technician")) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Portfólio</h1>
        <p className="mt-2 text-muted-foreground">O portfólio está disponível apenas para contas de Técnico.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Voltar</Link></Button>
      </div>
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = fileFromInput(e);
      if (!file || !user) return;
      if (items.length >= 12) return toast.error("Limite de 12 imagens no portfólio.");
      setUploading(true);
      const url = await uploadPublic(user.id, file, "portfolio");
      const { error } = await supabase.from("portfolio_items").insert({ technician_id: user.id, image_url: url, caption: caption.trim() || null });
      if (error) throw error;
      setCaption("");
      toast.success("Imagem adicionada!");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function remove(id: number) {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Imagem removida");
    setItems((s) => s.filter((i) => i.id !== id));
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Voltar ao painel</Link>
      </Button>
      <h1 className="font-display text-3xl font-bold">Portfólio</h1>
      <p className="mt-1 text-muted-foreground">Mostra trabalhos concluídos. Até 12 imagens.</p>

      <Card className="mt-6 p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="cap">Legenda (opcional)</Label>
            <Input id="cap" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ex: Instalação elétrica em moradia — Talatona" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="upl" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "A enviar..." : "Adicionar imagem"}
            </Label>
            <input id="upl" type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </div>
        </div>
      </Card>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-12 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Ainda não tens imagens. Adiciona o teu primeiro trabalho acima.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <Card key={i.id} className="group overflow-hidden">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={i.image_url} alt={i.caption ?? "Portfólio"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{i.caption || "Sem legenda"}</p>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)} title="Remover">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
