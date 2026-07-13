/* eslint-disable @typescript-eslint/no-explicit-any */
// Módulo Tacógrafo — helpers, tipos e log padrão Bononi
import { supabase } from "@/integrations/supabase/client";

// Tabelas taco_* não estão no types.ts gerado — cliente sem tipagem para este módulo
export const db = supabase as any;

export type TacoStatus = "ABERTA" | "CONCLUIDA";

export type TacoAnexoTipo =
  | "FOTO_TACOGRAFO"
  | "DISCO_1"
  | "DISCO_2"
  | "CRLV"
  | "COMPROVANTE_ENDERECO"
  | "FOTO_TACOGRAFO_2";

export interface TacoOrdem {
  id: number;
  numero_os: string;
  status: TacoStatus;
  cliente_nome: string;
  cliente_codigo_erp: number | null;
  cliente_cpf: string | null;
  cliente_rg: string | null;
  cliente_cnpj: string | null;
  cliente_endereco: string | null;
  cliente_numero: string | null;
  cliente_bairro: string | null;
  cliente_cep: string | null;
  cliente_cidade: string | null;
  cliente_uf: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  veiculo_marca_modelo: string | null;
  veiculo_placa: string | null;
  veiculo_renavam: string | null;
  criado_em: string;
  concluido_em: string | null;
}

export interface TacoAnexo {
  id: number;
  id_ordem: number;
  tipo: TacoAnexoTipo;
  storage_path: string;
  nome_arquivo: string | null;
  mime_type: string | null;
  enviado_por: string | null;
  criado_em: string;
}

export interface SlotDef {
  tipo: TacoAnexoTipo;
  label: string;
  origem: "SERVICO" | "RECEPCAO";
  aceitaPdf?: boolean;
  opcional?: boolean;
}

export const ANEXO_TIPOS: SlotDef[] = [
  { tipo: "FOTO_TACOGRAFO", label: "Foto do tacógrafo", origem: "SERVICO" },
  { tipo: "FOTO_TACOGRAFO_2", label: "Foto do tacógrafo — foto 2", origem: "SERVICO", opcional: true },
  { tipo: "CRLV", label: "CRLV do veículo", origem: "RECEPCAO", aceitaPdf: true },
  { tipo: "DISCO_1", label: "Disco do tacógrafo — foto 1", origem: "SERVICO" },
  { tipo: "DISCO_2", label: "Disco do tacógrafo — foto 2", origem: "SERVICO" },
  { tipo: "COMPROVANTE_ENDERECO", label: "Comp. Residência / Cartão CNPJ", origem: "RECEPCAO", aceitaPdf: true },
];

// Ordem das páginas no dossiê final
export const DOSSIE_ORDEM: TacoAnexoTipo[] = [
  "FOTO_TACOGRAFO",
  "FOTO_TACOGRAFO_2",
  "CRLV",
  "DISCO_1",
  "DISCO_2",
  "COMPROVANTE_ENDERECO",
];

// Tipos antigos que podem existir no banco (backward compat)
// Se encontrar COMPROVANTE_RESIDENCIA ou CARTAO_CNPJ, conta como COMPROVANTE_ENDERECO
export const TIPOS_COMPROVANTE_LEGADO = ["COMPROVANTE_RESIDENCIA", "CARTAO_CNPJ"];

// Conta documentos únicos considerando tipos legados
// Tipos opcionais não contam para completude
const TIPOS_OPCIONAIS = new Set(
  ANEXO_TIPOS.filter((s) => s.opcional).map((s) => s.tipo)
);

export function contarDocsUnicos(anexoTipos: string[]): number {
  const tipos = new Set<string>();
  for (const t of anexoTipos) {
    if (TIPOS_OPCIONAIS.has(t as TacoAnexoTipo)) continue;
    if (TIPOS_COMPROVANTE_LEGADO.includes(t)) {
      tipos.add("COMPROVANTE_ENDERECO");
    } else {
      tipos.add(t);
    }
  }
  return tipos.size;
}

// ─── STATUS VISUAL DERIVADO ──────────────────────────────────────────────
export type StatusVisual = "ABERTA" | "PEND_DOC" | "DOCS_OK" | "CONCLUIDA";

export interface StatusVisualInfo {
  status: StatusVisual;
  label: string;
  badgeClass: string;
}

const TOTAL_DOCS = ANEXO_TIPOS.filter((s) => !s.opcional).length; // 5 obrigatórios

export function derivarStatusVisual(statusBanco: TacoStatus, qtdDocs: number): StatusVisualInfo {
  if (statusBanco === "CONCLUIDA") {
    return { status: "CONCLUIDA", label: "Concluída", badgeClass: "b-badge-ok" };
  }
  if (qtdDocs >= TOTAL_DOCS) {
    return { status: "DOCS_OK", label: "Docs completos", badgeClass: "b-badge-ok" };
  }
  if (qtdDocs > 0) {
    return { status: "PEND_DOC", label: "Pend. doc", badgeClass: "b-badge-critico" };
  }
  return { status: "ABERTA", label: "Aberta", badgeClass: "b-badge-info" };
}

// ─── PRÓXIMO NÚMERO DE OS (sequencial) ───────────────────────────────────
export async function proximoNumeroOS(): Promise<string> {
  const { data } = await db
    .from("taco_ordens")
    .select("numero_os")
    .order("id", { ascending: false })
    .limit(100);
  let max = 0;
  (data ?? []).forEach((r: { numero_os: string }) => {
    const n = parseInt(r.numero_os, 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return String(max + 1);
}

// ─── LOG PADRÃO BONONI (taco_logs) ───────────────────────────────────────
export async function tacoLog(tipo: string, acao: string, dados: any = {}) {
  try {
    await db.from("taco_logs").insert({
      tipo,
      nivel: dados.nivel || (tipo === "ERRO" ? "ERROR" : "INFO"),
      modulo: dados.modulo || "tacografo",
      acao,
      entidade: dados.entidade || null,
      id_entidade: dados.id_entidade != null ? String(dados.id_entidade) : null,
      nome_entidade: dados.nome_entidade || null,
      valor_anterior: dados.antes || null,
      valor_novo: dados.depois || null,
      erro_msg: dados.erro?.message || dados.erro_msg || null,
      erro_stack: dados.erro?.stack || null,
      contexto: dados.contexto || null,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });
  } catch {
    // log nunca quebra o fluxo da aplicação
  }
}

// ─── COMPRESSÃO DE IMAGEM (client-side, antes do upload) ─────────────────
export async function comprimirImagem(
  file: File,
  maxDim = 1600,
  qualidade = 0.82
): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", qualidade)
    );
  } catch {
    return file; // fallback: envia original
  }
}

// URL pública de um anexo no bucket taco-docs
export function anexoUrl(path: string): string {
  return supabase.storage.from("taco-docs").getPublicUrl(path).data.publicUrl;
}

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}
