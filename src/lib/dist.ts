/* eslint-disable @typescript-eslint/no-explicit-any */
// Módulo Gestão de Serviços (distribuição/precificação) — helpers, tipos e log padrão Bononi
import { supabase } from "@/integrations/supabase/client";

// Tabelas dist_* não estão no types.ts gerado — cliente sem tipagem para este módulo
export const db = supabase as any;

// Nome do usuário atual (mesmo padrão já usado em Vendas sem Faturamento) —
// reaproveitado aqui para distribuido_por/validado_por, sem precisar de login.
export const USUARIO_KEY = "loja_usuario_nome";
export function getUsuarioNome(): string {
  return localStorage.getItem(USUARIO_KEY) || "";
}
export function setUsuarioNome(nome: string) {
  localStorage.setItem(USUARIO_KEY, nome);
}

export interface DistArea {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number | null;
}

export type StatusManual = "parado" | "distribuido";

export interface DistServico {
  id: number;
  id_servico_legado: number;
  id_os: number | null;
  id_area: number | null;
  status_manual: StatusManual | null;
  duplicado_de: number | null;
  validado: boolean;
  validado_por: string | null;
  validado_em: string | null;
  observacao: string | null;
  distribuido_por: string | null;
  distribuido_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface DistServicoColaborador {
  id: number;
  id_dist_servico: number;
  id_colaborador: number;
}

// ─── STATUS EFETIVO (manual > derivado do legado) ────────────────────────
// Hoje só existe o lado manual (tabelas dist_*). Os campos do legado (ok,
// apontamento iniciado) chegam junto com a vw_dist_servicos — a assinatura já
// aceita esses campos opcionais pra não precisar mexer aqui de novo depois.
export type StatusEfetivo = "aberto" | "distribuido" | "em_servico" | "finalizado" | "parado";

export interface StatusEfetivoInput {
  status_manual?: StatusManual | null;
  id_area?: number | null;
  temColaborador?: boolean;
  legadoOk?: boolean; // ok='S' no legado — só disponível via vw_dist_servicos
  legadoIniciado?: boolean; // tem apontamento/data_inicio — só disponível via vw_dist_servicos
}

export function deriveStatusEfetivo(s: StatusEfetivoInput): StatusEfetivo {
  if (s.status_manual === "parado") return "parado";
  if (s.legadoOk) return "finalizado";
  if (s.legadoIniciado) return "em_servico";
  if (s.status_manual === "distribuido" || s.id_area != null || s.temColaborador) return "distribuido";
  return "aberto";
}

export const STATUS_INFO: Record<StatusEfetivo, { label: string; badgeClass: string }> = {
  aberto: { label: "Aberto", badgeClass: "b-badge-info" },
  distribuido: { label: "Distribuído", badgeClass: "b-badge-muted" },
  em_servico: { label: "Em serviço", badgeClass: "b-badge-critico" },
  finalizado: { label: "Finalizado", badgeClass: "b-badge-ok" },
  parado: { label: "Parado", badgeClass: "b-badge-ruptura" },
};

export const STATUS_FILTRO: { value: StatusEfetivo | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "aberto", label: "Aberto" },
  { value: "distribuido", label: "Distribuído" },
  { value: "em_servico", label: "Em serviço" },
  { value: "finalizado", label: "Finalizado" },
  { value: "parado", label: "Parado" },
];

// ─── LOG PADRÃO BONONI (reaproveita loja_frontend_logs — mesma tabela do app) ─
export async function distLog(nivel: "info" | "error", mensagem: string, detalhe?: string) {
  try {
    await supabase.from("loja_frontend_logs").insert({
      nivel,
      view_nome: "gestao-servicos",
      mensagem,
      detalhe: detalhe ?? null,
      user_agent: navigator?.userAgent?.slice(0, 200) ?? null,
    });
  } catch {
    // log nunca quebra o fluxo da aplicação
  }
}

export function fmtDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
