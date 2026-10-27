import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Mesmo desenho dos apps com login do grupo: a sessão é do Supabase Auth e o acesso
// vem dos metadados que o Hub grava. Isto organiza a tela; o que protege o dado é a RLS.
// Desde 27/10/2026 a autoridade é app_metadata (o usuário não consegue editar);
// user_metadata só vale como reserva enquanto app_metadata não tiver nenhuma das chaves.
export const MODULO = "loja";
export const HUB_URL = "https://bononi-hub.vercel.app/";

const CHAVES_ACESSO = ["admin", "admin_modulos", "modulos"] as const;

interface AuthState {
  session: Session | null;
  /** Token do usuário logado, para chamadas que não passam pelo supabase-js. */
  token: string | null;
  /** Nome para exibir e gravar como autor: user_metadata.nome ou o e-mail. */
  usuario: string;
  temAcesso: boolean;
  carregando: boolean;
  sair: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function lerAcesso(session: Session | null): boolean {
  const app = (session?.user?.app_metadata || {}) as Record<string, unknown>;
  const user = (session?.user?.user_metadata || {}) as Record<string, unknown>;
  const temChave = CHAVES_ACESSO.some((k) => k in app);
  const meta = temChave ? app : user;
  const modulos = Array.isArray(meta.modulos) ? (meta.modulos as string[]) : [];
  const adminModulos = Array.isArray(meta.admin_modulos) ? (meta.admin_modulos as string[]) : [];
  const adminGeral = meta.admin === true || meta.admin === "true";
  return adminGeral || adminModulos.includes(MODULO) || modulos.includes(MODULO);
}

export function AuthProvider({ children, onSair }: { children: ReactNode; onSair?: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const tentouRenovar = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const temAcesso = lerAcesso(session);

  // Os metadados só renovam com o token (de hora em hora): quem acabou de ganhar
  // o módulo no Hub ainda não o vê. Uma renovação antes de barrar, uma vez por
  // login, evita mandar a pessoa para "sem acesso" por causa de token velho.
  useEffect(() => {
    if (!session) { tentouRenovar.current = false; return; }
    if (temAcesso || tentouRenovar.current) return;
    tentouRenovar.current = true;
    supabase.auth.refreshSession().then(({ data }) => {
      if (data.session) setSession(data.session);
    });
  }, [session, temAcesso]);

  const sair = async () => {
    await supabase.auth.signOut();
    setSession(null);
    onSair?.();
  };

  const email = session?.user?.email || "";
  const nomeMeta = (session?.user?.user_metadata?.nome as string | undefined)?.trim();
  const usuario = nomeMeta || email;

  return (
    <Ctx.Provider
      value={{ session, token: session?.access_token ?? null, usuario, temAcesso, carregando, sair }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
