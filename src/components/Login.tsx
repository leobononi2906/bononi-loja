import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, HUB_URL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import logoBononiReverse from "@/assets/logo-bononi-reverse.png";

function Caixa({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[380px] overflow-hidden">
        {/* O logo é a versão para fundo escuro: vai sobre a faixa de tinta, como na sidebar. */}
        <div className="px-6 py-5" style={{ background: "hsl(var(--sidebar-background))" }}>
          <img src={logoBononiReverse} alt="Bononi Acessórios" className="h-[26px] w-auto" />
          <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Dashboard Loja
          </div>
        </div>
        <div className="p-6">{children}</div>
      </Card>
    </div>
  );
}

/** Login inline — mesmo e-mail e senha do Hub Bononi. */
export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEntrando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) {
        // 5xx / timeout não é senha errada (apagão do banco de 05/10/2026 respondeu texto puro).
        setErro(
          error.status && error.status >= 500
            ? "Sistema instável, tente em instantes."
            : "E-mail ou senha incorretos.",
        );
      }
    } catch {
      setErro("Sistema instável, tente em instantes.");
    } finally {
      setEntrando(false);
    }
  };

  return (
    <Caixa>
      <form onSubmit={entrar} className="flex flex-col gap-3">
        <div>
          <label htmlFor="login-email" className="block mb-1 text-xs font-semibold text-muted-foreground">E-mail</label>
          <Input
            id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="username" required className="h-11"
          />
        </div>
        <div>
          <label htmlFor="login-senha" className="block mb-1 text-xs font-semibold text-muted-foreground">Senha</label>
          <Input
            id="login-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password" required className="h-11"
          />
        </div>
        {erro && (
          <p role="alert" className="m-0 rounded-md border border-destructive px-2.5 py-2 text-xs text-destructive" style={{ background: "hsl(var(--destructive-bg))" }}>
            {erro}
          </p>
        )}
        <Button type="submit" disabled={entrando} className="h-11 w-full">
          {entrando && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Mesmo login do{" "}
        <a href={HUB_URL} target="_blank" rel="noopener noreferrer" className="underline">Hub Bononi</a>
      </p>
    </Caixa>
  );
}

/** Logado, mas sem o módulo 'loja' liberado. */
export function SemAcesso() {
  const { usuario, sair } = useAuth();
  return (
    <Caixa>
      <div className="text-center">
        <p className="m-0 font-bold text-foreground">Sem acesso à Loja Física</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {usuario}, seu usuário não tem o módulo <strong>loja</strong> liberado. Peça a um admin para liberar no Hub → Usuários.
        </p>
        <div className="mt-5 flex gap-2">
          <Button asChild variant="outline" className="h-11 flex-1">
            <a href={HUB_URL} target="_blank" rel="noopener noreferrer">Ir para o Hub</a>
          </Button>
          <Button onClick={sair} className="h-11 flex-1">Sair</Button>
        </div>
      </div>
    </Caixa>
  );
}
