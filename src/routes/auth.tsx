import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type SearchParams = { mode?: "login" | "signup"; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    mode: s.mode === "signup" ? "signup" : "login",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [{ title: "Entrar — EvoluinF" }, { name: "description", content: "Acede à tua conta EvoluinF." }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: search.redirect || "/dashboard" });
    }
  }, [user, isLoading, navigate, search.redirect]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 shadow-elegant md:p-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Bem-vindo ao EvoluinF</h1>
          <p className="mt-1 text-sm text-muted-foreground">Evolução Infinita</p>
        </div>
        <Tabs defaultValue={search.mode ?? "login"} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-5">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-5">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sessão iniciada");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Palavra-passe</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ainda não tens conta? <Link to="/planos" className="text-accent hover:underline">Vê os planos</Link>
      </p>
    </form>
  );
}

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"technician" | "company">("technician");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Palavra-passe mínima de 8 caracteres");
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: name, role } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    const uid = data.user?.id;
    if (uid) {
      // create role
      await supabase.from("user_roles").insert({ user_id: uid, role });
      // create matching profile row
      if (role === "technician") {
        await supabase.from("technicians").insert({ id: uid, full_name: name });
      } else {
        await supabase.from("companies").insert({ id: uid, company_name: name });
      }
    }
    setLoading(false);
    toast.success("Conta criada! Verifica o teu email se necessário.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Tipo de conta</Label>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as "technician" | "company")} className="mt-2 grid grid-cols-2 gap-3">
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-smooth ${role === "technician" ? "border-accent bg-accent/10" : "border-border"}`}>
            <RadioGroupItem value="technician" />
            <span className="text-sm font-medium">Técnico</span>
          </label>
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-smooth ${role === "company" ? "border-accent bg-accent/10" : "border-border"}`}>
            <RadioGroupItem value="company" />
            <span className="text-sm font-medium">Empresa</span>
          </label>
        </RadioGroup>
      </div>
      <div>
        <Label htmlFor="name">{role === "technician" ? "Nome completo" : "Nome da empresa"}</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="email-s">Email</Label>
        <Input id="email-s" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password-s">Palavra-passe (mín. 8 caracteres)</Label>
        <Input id="password-s" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta
      </Button>
    </form>
  );
}
