/* eslint-disable @typescript-eslint/no-explicit-any */
// Módulo Gestão de Serviços (distribuição/precificação) — helpers, tipos e log padrão Bononi
import { supabase } from "@/integrations/supabase/client";

// Tabelas/views dist_*/vw_dist_* não estão no types.ts gerado — cliente sem tipagem para este módulo
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

// Piloto do módulo é só MLB PR — Lista de Distribuição e Precificação mostram
// só OS dessa empresa (pedido do Leo, 26/08). id_empresa=2 em vw_dist_servicos/
// vw_dist_precificacao (confirmado — não é o mesmo mapeamento de chdados de
// outros sistemas Bononi, ex. Cobrança/Financeiro usam outra numeração).
export const EMPRESA_MLB_PR = 2;

export interface DistArea {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number | null;
}

export type StatusManual = "parado" | "distribuido";

// Overlay gravável (tabela própria) — 1 linha por atribuição de um serviço a uma área/colaborador.
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

// ─── vw_dist_servicos — LISTA DE DISTRIBUIÇÃO (grão = linha de serviço da OS) ─
export type StatusDistServico = "aberto" | "distribuido" | "em_servico" | "parado" | "cancelado";

export interface DistServicoRow {
  id_servico: number;
  id_dist: number | null; // null = nunca distribuído (sem linha em dist_servico ainda)
  id_os: number;
  id_empresa: number;
  empresa: string;
  data_os: string; // date
  hora_os: string; // 'HH:MM'
  prisma: string | null;
  os_status: string;
  id_cliente: number;
  cliente: string;
  placa: string | null;
  modelo: string | null;
  fabricante: string | null;
  id_servicop: number;
  servico: string;
  observacao: string | null; // obs do vendedor na abertura da OS
  data_inicio: string | null;
  hora_inicio: string | null;
  fl_apontado: number;
  horas_apontadas: number | null;
  duplicado_de: number | null;
  is_duplicado: boolean;
  id_area: number | null;
  area: string | null;
  area_automatica: boolean; // true = área veio do mapa dist_area_servicop, não de override manual
  obs_distribuicao: string | null;
  distribuido_por: string | null;
  distribuido_em: string | null;
  colaboradores: string | null; // texto agregado
  status: StatusDistServico;
}

export const STATUS_INFO: Record<StatusDistServico, { label: string; badgeClass: string }> = {
  aberto: { label: "Aberto", badgeClass: "b-badge-info" },
  distribuido: { label: "Distribuído", badgeClass: "b-badge-muted" },
  em_servico: { label: "Em serviço", badgeClass: "b-badge-critico" },
  parado: { label: "Parado", badgeClass: "b-badge-ruptura" },
  cancelado: { label: "Cancelado", badgeClass: "b-badge-muted" },
};

export const STATUS_ATIVOS: StatusDistServico[] = ["aberto", "distribuido", "em_servico", "parado"];

// ─── vw_dist_precificacao — finalizados forward-only, ainda não validados ────
export interface DistPrecificacaoRow {
  id_servico: number;
  id_dist: number | null;
  id_os: number;
  id_empresa: number;
  empresa: string;
  data_os: string;
  data_fim: string | null;
  data_conclusao: string;
  prisma: string | null;
  id_cliente: number;
  cliente: string;
  placa: string | null;
  modelo: string | null;
  id_servicop: number;
  servico: string;
  observacao: string | null;
  horas_apontadas: number | null;
  is_duplicado: boolean;
  id_area: number | null;
  area: string | null;
  colaboradores: string | null;
}

// ─── vw_fb_os_apontamento — apontamentos de um serviço específico (detalhe do expand) ─
export interface ApontamentoOS {
  id_apontamento: number;
  id_servico: number;
  id_empresa: number;
  id_colaborador: number;
  colaborador: string;
  data_apont: string;
  hora_inicio: string;
  hora_termino: string | null;
  horas: number;
}

// ─── vw_dist_colab_area — colaboradores por área (Painel do Gestor) ─────────
export interface DistColabAreaRow {
  id_area: number;
  area: string;
  id_colaborador: number;
  colaborador: string;
  situacao: string; // 'A' = ativo (mesmo código do vw_dim_colaborador)
  departamento: string | null;
}

export interface ColaboradorDim {
  id_colaborador: number;
  nome_colaborador: string;
  situacao: string;
  departamento: string | null;
}

export interface ServicopOption {
  id_servicop: number;
  servico: string;
}

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

// "2026-08-25" → "25/08" (evita bug de timezone do new Date() em cima de campo date puro)
export function fmtDataAbrev(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}`;
}

// Horas decimais (2.5) não são legíveis pra quem não é de tecnologia — pedido do
// Leo 26/08: mostrar "2h30" em vez de "2.5h".
export function fmtHoras(horasDecimais: number | null | undefined): string {
  if (horasDecimais == null) return "—";
  const totalMin = Math.round(horasDecimais * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

// ─── PRESENÇA DO COLABORADOR (trabalhando agora vs pausado) ─────────────────
// "em_servico" é status do SERVIÇO (não muda). Pausado é um estado da PESSOA
// dentro desse serviço: já apontou hora ali, mas o apontamento mais recente
// está fechado (hora_termino preenchida) — ela não está lá agora, mas o
// serviço continua em andamento (não foi parado nem concluído). Combinado
// com o Leo 26/08: colaborador volta a "trabalhando" sozinho no próximo
// apontamento aberto; o caso de serviço abandonado (ex: OS de novembro presa
// na funilaria) é resolvido manualmente pelo gestor com o botão Parar — não
// é este helper que decide isso.
export type PresencaColaborador = "trabalhando" | "pausado";

export interface ApontamentoPresenca {
  id_servico: number;
  id_colaborador: number;
  hora_termino: string | null;
}

// "trabalhando" sempre vence (sessão aberta), mesmo se aparecer depois de um
// apontamento fechado do mesmo colaborador/serviço na lista.
export function calcularPresenca(apontamentos: ApontamentoPresenca[]): Map<string, PresencaColaborador> {
  const mapa = new Map<string, PresencaColaborador>();
  apontamentos.forEach((a) => {
    const chave = `${a.id_servico}|${a.id_colaborador}`;
    if (!a.hora_termino) mapa.set(chave, "trabalhando");
    else if (mapa.get(chave) !== "trabalhando") mapa.set(chave, "pausado");
  });
  return mapa;
}

export function presencaDe(
  mapa: Map<string, PresencaColaborador>, idServico: number, idColaborador: number
): PresencaColaborador | null {
  return mapa.get(`${idServico}|${idColaborador}`) ?? null;
}

// TBL_SERVICO.DESCRICAO é o campo certo (confirmado 26/08 lendo direto da produção,
// só leitura, via node-firebird em bononi-replicador) — é RTF puro salvo pelo
// sistema antigo, tipo:
//   {\rtf1\ansi\ansicpg1252...{\fonttbl{...}}\viewkind4\uc1\pard\f0\fs16 TEXTO\par}
// A extração do cérebro ainda não decodifica esse blob direito (erro do driver
// "*** blr version ... is not supported ***" em ~20% dos casos) — reportado.
// Enquanto isso, `limparObservacao` já sabe: (1) descartar a string de erro,
// (2) despir o RTF pro texto puro, pra já funcionar assim que a extração for
// corrigida (a coluna vai chegar como esse RTF cru, não como texto limpo).
function rtfParaTexto(rtf: string): string {
  return rtf
    .replace(/\{\\fonttbl\{[^}]*\}\}/g, "")
    .replace(/\\par\b/g, "\n")
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))) // windows-1252 ~= latin-1 nessa faixa
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
    .replace(/[{}]/g, "")
    .trim();
}

export function limparObservacao(obs: string | null | undefined): string | null {
  if (!obs) return null;
  if (obs.includes("blr version") || obs.trimStart().startsWith("***")) return null;
  const texto = obs.trimStart().startsWith("{\\rtf") ? rtfParaTexto(obs) : obs;
  return texto || null;
}
