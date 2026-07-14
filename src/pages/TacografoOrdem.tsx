// Módulo Tacógrafo — abertura e detalhe da OS (upload de docs, declaração, dossiê)
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, AlertCircle, Camera, CheckCircle2, FileText, FileDown,
  Loader2, Pencil, Printer, RotateCcw, Search, Trash2, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  db, tacoLog, comprimirImagem, anexoUrl, fmtData, proximoNumeroOS,
  derivarStatusVisual, contarDocsUnicos,
  ANEXO_TIPOS, DOSSIE_ORDEM, TIPOS_COMPROVANTE_LEGADO,
  TacoOrdem, TacoAnexo, TacoAnexoTipo,
} from "@/lib/taco";
import { gerarDeclaracaoPdf, gerarDossiePdf, abrirPdf, DeclaracaoDados } from "@/lib/taco-pdf";

type OrdemFull = TacoOrdem & { taco_anexos: TacoAnexo[] };

const FORM_VAZIO = {
  cliente_nome: "", cliente_codigo_erp: "" as string | number,
  cliente_cpf: "", cliente_rg: "", cliente_cnpj: "",
  cliente_endereco: "", cliente_numero: "", cliente_bairro: "", cliente_cep: "",
  cliente_cidade: "", cliente_uf: "", cliente_telefone: "", cliente_email: "",
  veiculo_marca_modelo: "", veiculo_placa: "", veiculo_renavam: "",
};
type FormOS = typeof FORM_VAZIO;

function Campo({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 min-w-0 ${className}`}>
      <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
        {label}
      </label>
      {children}
    </div>
  );
}

// Encontra o anexo para um slot, considerando tipos legados para COMPROVANTE_ENDERECO
function encontrarAnexo(anexos: TacoAnexo[], tipo: TacoAnexoTipo): TacoAnexo | undefined {
  const direto = anexos.find((a) => a.tipo === tipo);
  if (direto) return direto;
  // Se é slot de comprovante, aceita tipos legados
  if (tipo === "COMPROVANTE_ENDERECO") {
    return anexos.find((a) => TIPOS_COMPROVANTE_LEGADO.includes(a.tipo));
  }
  return undefined;
}

export default function TacografoOrdem() {
  const { id } = useParams();
  const isNova = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormOS>(FORM_VAZIO);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState<TacoAnexoTipo | null>(null);
  const [gerandoDossie, setGerandoDossie] = useState(false);
  const [declOpen, setDeclOpen] = useState(false);
  const [decl, setDecl] = useState<DeclaracaoDados | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const formCarregado = useRef(false);

  const set = (k: keyof FormOS) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // ─── Detalhe da OS ───
  const { data: ordem, isLoading, error } = useQuery({
    queryKey: ["taco-ordem", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db
        .from("taco_ordens")
        .select("*, taco_anexos(*)")
        .eq("id", Number(id))
        .single();
      if (error) throw error;
      return data as OrdemFull;
    },
  });

  if (ordem && !formCarregado.current) {
    formCarregado.current = true;
    setForm({
      cliente_nome: ordem.cliente_nome ?? "",
      cliente_codigo_erp: ordem.cliente_codigo_erp ?? "",
      cliente_cpf: ordem.cliente_cpf ?? "",
      cliente_rg: ordem.cliente_rg ?? "",
      cliente_cnpj: ordem.cliente_cnpj ?? "",
      cliente_endereco: ordem.cliente_endereco ?? "",
      cliente_numero: ordem.cliente_numero ?? "",
      cliente_bairro: ordem.cliente_bairro ?? "",
      cliente_cidade: ordem.cliente_cidade ?? "",
      cliente_uf: ordem.cliente_uf ?? "",
      cliente_cep: ordem.cliente_cep ?? "",
      cliente_telefone: ordem.cliente_telefone ?? "",
      cliente_email: ordem.cliente_email ?? "",
      veiculo_marca_modelo: ordem.veiculo_marca_modelo ?? "",
      veiculo_placa: ordem.veiculo_placa ?? "",
      veiculo_renavam: ordem.veiculo_renavam ?? "",
    });
  }

  const anexos: TacoAnexo[] = Array.isArray(ordem?.taco_anexos) ? ordem!.taco_anexos : [];
  const docsEnviados = contarDocsUnicos(anexos.map((a) => a.tipo));

  const statusVisual = ordem ? derivarStatusVisual(ordem.status, docsEnviados) : null;

  // ─── Busca cliente no ERP ───
  const { data: clientesERP, isFetching: buscandoCliente } = useQuery({
    queryKey: ["taco-busca-cliente", buscaCliente],
    enabled: buscaAberta && buscaCliente.trim().length >= 3,
    queryFn: async () => {
      const { data, error } = await db
        .from("vw_dim_cliente")
        .select("id_cliente,nome_cliente,cpf,cnpj,endereco,bairro,cidade,uf,cep,telefone1,email")
        .ilike("nome_cliente", `%${buscaCliente.trim()}%`)
        .limit(30);
      if (error) throw error;
      const map = new Map<number, Record<string, unknown>>();
      (data ?? []).forEach((c: Record<string, unknown>) => {
        const cid = Number(c.id_cliente);
        if (cid && !map.has(cid)) map.set(cid, c);
      });
      return Array.from(map.values()).slice(0, 15);
    },
  });

  const selecionarCliente = (c: Record<string, unknown>) => {
    setForm((f) => ({
      ...f,
      cliente_nome: String(c.nome_cliente ?? ""),
      cliente_codigo_erp: Number(c.id_cliente) || "",
      cliente_cpf: String(c.cpf ?? "") === "null" ? "" : String(c.cpf ?? ""),
      cliente_cnpj: String(c.cnpj ?? "") === "null" ? "" : String(c.cnpj ?? ""),
      cliente_endereco: String(c.endereco ?? ""),
      cliente_bairro: String(c.bairro ?? ""),
      cliente_cidade: String(c.cidade ?? ""),
      cliente_uf: String(c.uf ?? ""),
      cliente_cep: String(c.cep ?? ""),
      cliente_telefone: String(c.telefone1 ?? ""),
      cliente_email: String(c.email ?? "") === "null" ? "" : String(c.email ?? ""),
    }));
    setBuscaAberta(false);
    setBuscaCliente("");
  };

  // ─── Puxa cartão CNPJ salvo automaticamente ───
  const puxarCnpjCard = async (ordemId: number, cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length < 14) return;
    try {
      const { data: card } = await db
        .from("taco_cnpj_cards")
        .select("*")
        .eq("cnpj", cnpjLimpo)
        .single();
      if (!card) return;

      // Verifica se já tem comprovante nessa OS
      const { data: existentes } = await db
        .from("taco_anexos")
        .select("id")
        .eq("id_ordem", ordemId)
        .eq("tipo", "COMPROVANTE_ENDERECO");
      if (existentes && existentes.length > 0) return;

      // Copia o arquivo no storage pra pasta da OS
      const ext = (card.nome_arquivo || "pdf").split(".").pop() || "pdf";
      const novoPath = `os_${ordemId}/COMPROVANTE_ENDERECO_${Date.now()}.${ext}`;
      const { error: copyErr } = await supabase.storage
        .from("taco-docs")
        .copy(card.storage_path, novoPath);
      if (copyErr) return;

      await db.from("taco_anexos").insert({
        id_ordem: ordemId,
        tipo: "COMPROVANTE_ENDERECO",
        storage_path: novoPath,
        nome_arquivo: card.nome_arquivo,
        mime_type: card.mime_type,
        enviado_por: "AUTO_CNPJ",
      });
      tacoLog("ACAO", "CNPJ_CARD_AUTO", {
        entidade: "taco_anexo", id_entidade: ordemId,
        contexto: { cnpj: cnpjLimpo, origem: card.storage_path },
      });
    } catch { /* silencioso — não bloqueia criação da OS */ }
  };

  // ─── Salvar (criar ou editar) ───
  const salvar = async () => {
    if (!form.cliente_nome.trim()) return toast.error("Informe o nome do cliente.");
    setSalvando(true);
    const payload = {
      ...form,
      cliente_codigo_erp: form.cliente_codigo_erp ? Number(form.cliente_codigo_erp) : null,
      veiculo_placa: form.veiculo_placa.toUpperCase().trim() || null,
    };
    try {
      if (isNova) {
        const numero_os = await proximoNumeroOS();
        const { data, error } = await db
          .from("taco_ordens")
          .insert({ ...payload, numero_os })
          .select("id")
          .single();
        if (error) throw error;
        tacoLog("ACAO", "CRIAR_OS", {
          entidade: "taco_ordem", id_entidade: data.id,
          nome_entidade: `OS ${numero_os} — ${form.cliente_nome}`,
          depois: { ...payload, numero_os },
        });
        // Puxa cartão CNPJ automaticamente se cliente tem CNPJ
        if (form.cliente_cnpj) {
          await puxarCnpjCard(data.id, form.cliente_cnpj);
        }

        toast.success(`Ordem de serviço nº ${numero_os} criada.`);
        qc.invalidateQueries({ queryKey: ["taco-ordens"] });
        navigate(`/tacografo/${data.id}`, { replace: true });
      } else {
        const { error } = await db.from("taco_ordens").update(payload).eq("id", Number(id));
        if (error) throw error;
        tacoLog("ACAO", "EDITAR_OS", {
          entidade: "taco_ordem", id_entidade: id,
          nome_entidade: `OS ${ordem?.numero_os}`, depois: payload,
        });
        toast.success("Dados atualizados.");
        setEditando(false);
        qc.invalidateQueries({ queryKey: ["taco-ordem", id] });
        qc.invalidateQueries({ queryKey: ["taco-ordens"] });
      }
    } catch (err) {
      tacoLog("ERRO", isNova ? "ERRO_CRIAR_OS" : "ERRO_EDITAR_OS", { erro: err as Error });
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  // ─── Status ───
  const alterarStatus = async (novo: "ABERTA" | "CONCLUIDA") => {
    try {
      const { error } = await db
        .from("taco_ordens")
        .update({ status: novo, concluido_em: novo === "CONCLUIDA" ? new Date().toISOString() : null })
        .eq("id", Number(id));
      if (error) throw error;
      tacoLog("ACAO", "ALTERAR_STATUS", {
        entidade: "taco_ordem", id_entidade: id, nome_entidade: `OS ${ordem?.numero_os}`,
        antes: { status: ordem?.status }, depois: { status: novo },
      });
      qc.invalidateQueries({ queryKey: ["taco-ordem", id] });
      qc.invalidateQueries({ queryKey: ["taco-ordens"] });
      toast.success(novo === "CONCLUIDA" ? "OS concluída." : "OS reaberta.");
    } catch (err) {
      tacoLog("ERRO", "ERRO_ALTERAR_STATUS", { erro: err as Error, id_entidade: id });
      toast.error("Erro ao alterar o status.");
    }
  };

  // ─── Upload de anexo ───
  const enviarArquivo = async (tipo: TacoAnexoTipo, file: File) => {
    if (!ordem) return;
    setUploading(tipo);
    try {
      const isImg = file.type.startsWith("image/");
      const blob = isImg ? await comprimirImagem(file) : file;
      const ext = isImg ? "jpg" : (file.name.split(".").pop() || "pdf").toLowerCase();
      const path = `os_${ordem.id}/${tipo}_${Date.now()}.${ext}`;
      const mime = isImg ? "image/jpeg" : file.type || "application/pdf";

      const { error: upErr } = await supabase.storage
        .from("taco-docs")
        .upload(path, blob, { contentType: mime, upsert: true });
      if (upErr) throw upErr;

      // Para o slot de comprovante, remove qualquer tipo legado existente também
      const existente = encontrarAnexo(anexos, tipo);
      if (existente) {
        await supabase.storage.from("taco-docs").remove([existente.storage_path]);
        const { error } = await db
          .from("taco_anexos")
          .update({ tipo, storage_path: path, nome_arquivo: file.name, mime_type: mime, criado_em: new Date().toISOString() })
          .eq("id", existente.id);
        if (error) throw error;
      } else {
        const { error } = await db.from("taco_anexos").insert({
          id_ordem: ordem.id, tipo, storage_path: path, nome_arquivo: file.name, mime_type: mime,
          enviado_por: ANEXO_TIPOS.find((t) => t.tipo === tipo)?.origem ?? null,
        });
        if (error) throw error;
      }

      // Se é comprovante/CNPJ e a OS tem CNPJ, salva referência para reuso
      if (tipo === "COMPROVANTE_ENDERECO" && ordem.cliente_cnpj) {
        const cnpjLimpo = ordem.cliente_cnpj.replace(/\D/g, "");
        if (cnpjLimpo.length >= 14) {
          try {
            await db.from("taco_cnpj_cards").upsert(
              { cnpj: cnpjLimpo, storage_path: path, nome_arquivo: file.name, mime_type: mime, atualizado_em: new Date().toISOString() },
              { onConflict: "cnpj" }
            );
          } catch { /* não bloqueia o fluxo */ }
        }
      }

      tacoLog("ACAO", "ENVIAR_ANEXO", {
        entidade: "taco_anexo", id_entidade: ordem.id,
        nome_entidade: `OS ${ordem.numero_os} — ${tipo}`,
        contexto: { tipo, arquivo: file.name, substituicao: !!existente },
      });
      qc.invalidateQueries({ queryKey: ["taco-ordem", id] });
      qc.invalidateQueries({ queryKey: ["taco-ordens"] });
      toast.success("Documento enviado.");
    } catch (err) {
      tacoLog("ERRO", "ERRO_ENVIAR_ANEXO", { erro: err as Error, contexto: { tipo }, id_entidade: id });
      toast.error("Erro ao enviar o documento.");
    } finally {
      setUploading(null);
    }
  };

  const [confirmCnpj, setConfirmCnpj] = useState<TacoAnexo | null>(null);

  const excluirAnexo = async (anexo: TacoAnexo, tambemRemoverCnpjCard = false) => {
    try {
      await supabase.storage.from("taco-docs").remove([anexo.storage_path]);
      const { error } = await db.from("taco_anexos").delete().eq("id", anexo.id);
      if (error) throw error;

      // Se pediu pra remover o cartão CNPJ salvo também
      if (tambemRemoverCnpjCard && ordem?.cliente_cnpj) {
        const cnpjLimpo = ordem.cliente_cnpj.replace(/\D/g, "");
        if (cnpjLimpo.length >= 14) {
          await db.from("taco_cnpj_cards").delete().eq("cnpj", cnpjLimpo);
          tacoLog("ACAO", "REMOVER_CNPJ_CARD", {
            entidade: "taco_cnpj_cards", contexto: { cnpj: cnpjLimpo },
          });
        }
      }

      tacoLog("ACAO", "EXCLUIR_ANEXO", {
        entidade: "taco_anexo", id_entidade: anexo.id,
        nome_entidade: `OS ${ordem?.numero_os} — ${anexo.tipo}`,
      });
      qc.invalidateQueries({ queryKey: ["taco-ordem", id] });
      qc.invalidateQueries({ queryKey: ["taco-ordens"] });
    } catch (err) {
      tacoLog("ERRO", "ERRO_EXCLUIR_ANEXO", { erro: err as Error, id_entidade: anexo.id });
      toast.error("Erro ao excluir o documento.");
    }
  };

  const handleExcluirAnexo = (anexo: TacoAnexo) => {
    // Se é comprovante que veio do auto-CNPJ, pergunta se quer desvincular
    const isAutoComprovante =
      (anexo.tipo === "COMPROVANTE_ENDERECO" || TIPOS_COMPROVANTE_LEGADO.includes(anexo.tipo)) &&
      anexo.enviado_por === "AUTO_CNPJ";
    if (isAutoComprovante) {
      setConfirmCnpj(anexo);
    } else {
      excluirAnexo(anexo);
    }
  };

  // ─── Declaração de residência ───
  const abrirDeclaracao = () => {
    if (!ordem) return;
    setDecl({
      nome: ordem.cliente_nome ?? "",
      cpf: ordem.cliente_cpf ?? "",
      rg: ordem.cliente_rg ?? "",
      placa: ordem.veiculo_placa ?? "",
      renavam: ordem.veiculo_renavam ?? "",
      endereco: ordem.cliente_endereco ?? "",
      numero: ordem.cliente_numero ?? "",
      bairro: ordem.cliente_bairro ?? "",
      cep: ordem.cliente_cep ?? "",
      cidade: ordem.cliente_cidade ?? "",
      uf: ordem.cliente_uf ?? "",
      telefone: ordem.cliente_telefone ?? "",
      email: ordem.cliente_email ?? "",
      cidadeAssinatura: `${ordem.cliente_cidade || "UMUARAMA"} - ${ordem.cliente_uf || "PR"}`,
      data: new Date().toLocaleDateString("pt-BR"),
    });
    setDeclOpen(true);
  };

  const gerarDeclaracao = async () => {
    if (!decl || !ordem) return;
    try {
      const bytes = await gerarDeclaracaoPdf(decl);
      abrirPdf(bytes, `Declaracao_Residencia_OS_${ordem.numero_os}.pdf`);
      tacoLog("ACAO", "GERAR_DECLARACAO", {
        entidade: "taco_ordem", id_entidade: ordem.id, nome_entidade: `OS ${ordem.numero_os}`,
      });
      setDeclOpen(false);
    } catch (err) {
      tacoLog("ERRO", "ERRO_GERAR_DECLARACAO", { erro: err as Error, id_entidade: id });
      toast.error("Erro ao gerar a declaração.");
    }
  };

  // ─── Dossiê compilado ───
  const gerarDossie = async () => {
    if (!ordem || anexos.length === 0) return;
    setGerandoDossie(true);
    try {
      // Monta itens na ordem correta, considerando tipos legados
      const itens = DOSSIE_ORDEM
        .map((t) => encontrarAnexo(anexos, t))
        .filter(Boolean)
        .map((a) => ({
          tipo: a!.tipo, url: anexoUrl(a!.storage_path),
          mime: a!.mime_type, nome: a!.nome_arquivo,
        }));
      const bytes = await gerarDossiePdf(itens);
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      const placa = (ordem.veiculo_placa || "").replace(/[^A-Za-z0-9]/g, "");
      const nomeDossie = `${dd}${mm}${yy}_OS${ordem.numero_os}_${placa}.pdf`;
      abrirPdf(bytes, nomeDossie);
      tacoLog("ACAO", "GERAR_DOSSIE", {
        entidade: "taco_ordem", id_entidade: ordem.id,
        nome_entidade: `OS ${ordem.numero_os}`, contexto: { docs: itens.length },
      });
    } catch (err) {
      tacoLog("ERRO", "ERRO_GERAR_DOSSIE", { erro: err as Error, id_entidade: id });
      toast.error("Erro ao gerar o dossiê. Verifique os anexos.");
    } finally {
      setGerandoDossie(false);
    }
  };

  // ─── RENDER ───

  if (!isNova && isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="chart-container space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (!isNova && error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive">
            OS não encontrada ou erro ao carregar. {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  const mostrarForm = isNova || editando;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/tacografo")}
          className="h-9 w-9 rounded-lg flex items-center justify-center bg-[hsl(var(--surface2))] text-[hsl(var(--muted-foreground))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">
            {isNova ? "Nova ordem de serviço" : `OS ${ordem?.numero_os}`}
          </h1>
          {!isNova && (
            <p className="text-[13px] text-[hsl(var(--muted-foreground))] truncate">
              {ordem?.cliente_nome} · aberta em {fmtData(ordem?.criado_em)}
            </p>
          )}
        </div>
        {!isNova && statusVisual && (
          <span className={`b-badge ${statusVisual.badgeClass}`}>
            {statusVisual.label}
          </span>
        )}
      </div>

      {/* Ações principais (detalhe) */}
      {!isNova && !mostrarForm && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditando(true)}>
            <Pencil className="h-3.5 w-3.5" /> Editar dados
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={abrirDeclaracao}>
            <Printer className="h-3.5 w-3.5" /> Declaração de residência
          </Button>
          <Button
            size="sm" className="gap-1.5" onClick={gerarDossie}
            disabled={anexos.length === 0 || gerandoDossie}
          >
            {gerandoDossie ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            Gerar dossiê ({docsEnviados}/{ANEXO_TIPOS.length})
          </Button>
          {ordem?.status === "ABERTA" ? (
            <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => alterarStatus("CONCLUIDA")}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Concluir OS
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => alterarStatus("ABERTA")}>
              <RotateCcw className="h-3.5 w-3.5" /> Reabrir
            </Button>
          )}
        </div>
      )}

      {/* Formulário (nova / edição) */}
      {mostrarForm && (
        <div className="chart-container space-y-5">
          {/* Busca ERP */}
          <div className="relative">
            <Campo label="Buscar cliente no ERP (opcional)">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
                <Input
                  value={buscaCliente}
                  onChange={(e) => { setBuscaCliente(e.target.value); setBuscaAberta(true); }}
                  placeholder="Digite ao menos 3 letras do nome..."
                  className="pl-9"
                />
              </div>
            </Campo>
            {buscaAberta && buscaCliente.trim().length >= 3 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-[hsl(var(--border))] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
                  <span className="text-[11px] font-semibold uppercase text-[hsl(var(--text-muted))]">
                    {buscandoCliente ? "Buscando..." : `${(clientesERP ?? []).length} resultado(s)`}
                  </span>
                  <button onClick={() => setBuscaAberta(false)}><X className="h-3.5 w-3.5 text-[hsl(var(--text-muted))]" /></button>
                </div>
                {(clientesERP ?? []).length === 0 && !buscandoCliente && (
                  <p className="px-3 py-3 text-[13px] text-[hsl(var(--muted-foreground))]">
                    Nenhum cliente encontrado — preencha manualmente abaixo.
                  </p>
                )}
                {(clientesERP ?? []).map((c: Record<string, unknown>) => (
                  <button
                    key={String(c.id_cliente)}
                    onClick={() => selecionarCliente(c)}
                    className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--surface2))] border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{String(c.nome_cliente)}</p>
                    <p className="text-[11.5px] text-[hsl(var(--muted-foreground))]">
                      #{String(c.id_cliente)} · {[c.cidade, c.uf].filter(Boolean).join("/")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Campo label="Nome do cliente *" className="lg:col-span-2"><Input value={form.cliente_nome} onChange={set("cliente_nome")} /></Campo>
            <Campo label="Código ERP"><Input value={String(form.cliente_codigo_erp)} onChange={set("cliente_codigo_erp")} inputMode="numeric" /></Campo>
            <Campo label="CPF"><Input value={form.cliente_cpf} onChange={set("cliente_cpf")} /></Campo>
            <Campo label="RG"><Input value={form.cliente_rg} onChange={set("cliente_rg")} /></Campo>
            <Campo label="CNPJ"><Input value={form.cliente_cnpj} onChange={set("cliente_cnpj")} /></Campo>
            <Campo label="Telefone"><Input value={form.cliente_telefone} onChange={set("cliente_telefone")} /></Campo>
            <Campo label="E-mail"><Input value={form.cliente_email} onChange={set("cliente_email")} /></Campo>
            <Campo label="Endereço (rua/av.)" className="lg:col-span-2"><Input value={form.cliente_endereco} onChange={set("cliente_endereco")} /></Campo>
            <Campo label="Número"><Input value={form.cliente_numero} onChange={set("cliente_numero")} /></Campo>
            <Campo label="Bairro"><Input value={form.cliente_bairro} onChange={set("cliente_bairro")} /></Campo>
            <Campo label="CEP"><Input value={form.cliente_cep} onChange={set("cliente_cep")} /></Campo>
            <Campo label="Cidade"><Input value={form.cliente_cidade} onChange={set("cliente_cidade")} /></Campo>
            <Campo label="UF"><Input value={form.cliente_uf} onChange={set("cliente_uf")} maxLength={2} /></Campo>
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-3">Veículo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Campo label="Marca / Modelo"><Input value={form.veiculo_marca_modelo} onChange={set("veiculo_marca_modelo")} /></Campo>
              <Campo label="Placa"><Input value={form.veiculo_placa} onChange={set("veiculo_placa")} className="uppercase" /></Campo>
              <Campo label="Renavam"><Input value={form.veiculo_renavam} onChange={set("veiculo_renavam")} inputMode="numeric" /></Campo>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {!isNova && (
              <Button variant="outline" onClick={() => setEditando(false)} disabled={salvando}>Cancelar</Button>
            )}
            <Button onClick={salvar} disabled={salvando} className="gap-1.5">
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {isNova ? "Abrir OS" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      )}

      {/* Dados resumo + veículo (detalhe) */}
      {!isNova && !mostrarForm && (
        <div className="chart-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-[13px]">
            <div><p className="text-[10.5px] font-semibold uppercase text-[hsl(var(--text-muted))]">Placa</p><p className="font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>{ordem?.veiculo_placa || "—"}</p></div>
            <div><p className="text-[10.5px] font-semibold uppercase text-[hsl(var(--text-muted))]">Veículo</p><p>{ordem?.veiculo_marca_modelo || "—"}</p></div>
            <div><p className="text-[10.5px] font-semibold uppercase text-[hsl(var(--text-muted))]">Telefone</p><p>{ordem?.cliente_telefone || "—"}</p></div>
            <div><p className="text-[10.5px] font-semibold uppercase text-[hsl(var(--text-muted))]">Cidade</p><p>{[ordem?.cliente_cidade, ordem?.cliente_uf].filter(Boolean).join("/") || "—"}</p></div>
          </div>
        </div>
      )}

      {/* Documentos */}
      {!isNova && ordem && (
        <div className="space-y-2">
          <h2 className="text-[14px] font-bold text-[hsl(var(--foreground))]">Documentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANEXO_TIPOS.map((slotDef) => {
              const anexo = encontrarAnexo(anexos, slotDef.tipo);
              const isPdf = anexo && ((anexo.mime_type || "").includes("pdf") || (anexo.nome_arquivo || "").toLowerCase().endsWith(".pdf"));
              const emUpload = uploading === slotDef.tipo;
              const inputId = `taco-file-${slotDef.tipo}`;
              return (
                <div key={slotDef.tipo} className="metric-card min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] truncate">
                      {slotDef.label}
                    </p>
                    <span className={`b-badge ${slotDef.origem === "SERVICO" ? "b-badge-info" : "b-badge-muted"}`}>
                      {slotDef.origem === "SERVICO" ? "Serviço" : "Recepção"}
                    </span>
                  </div>

                  <input
                    id={inputId}
                    type="file"
                    className="hidden"
                    accept={slotDef.aceitaPdf ? "image/*,application/pdf" : "image/*"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) enviarArquivo(slotDef.tipo, f);
                      e.target.value = "";
                    }}
                  />

                  {!anexo ? (
                    <label
                      htmlFor={inputId}
                      className="flex flex-col items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--surface2))] transition-colors"
                    >
                      {emUpload ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-[hsl(var(--text-muted))]" />
                          <span className="text-[12.5px] font-medium text-[hsl(var(--muted-foreground))]">
                            Adicionar {slotDef.aceitaPdf ? "foto ou PDF" : "foto"}
                          </span>
                        </>
                      )}
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <a href={anexoUrl(anexo.storage_path)} target="_blank" rel="noreferrer" className="block">
                        {isPdf ? (
                          <div className="flex items-center justify-center h-32 rounded-lg bg-[hsl(var(--surface2))]">
                            <FileText className="h-9 w-9 text-[hsl(var(--primary))]" />
                          </div>
                        ) : (
                          <img
                            src={anexoUrl(anexo.storage_path)}
                            alt={slotDef.label}
                            className="h-32 w-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        )}
                      </a>
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={inputId}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-[12px] font-medium cursor-pointer bg-[hsl(var(--surface2))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        >
                          {emUpload ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Substituir
                        </label>
                        <button
                          onClick={() => handleExcluirAnexo(anexo)}
                          className="h-8 w-8 rounded-md flex items-center justify-center bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10.5px] text-[hsl(var(--text-muted))]">{fmtData(anexo.criado_em)}</p>
                        {anexo.enviado_por === "AUTO_CNPJ" && (
                          <span className="text-[10px] font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-1.5 py-0.5 rounded">
                            Upload automático
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal — Declaração de residência */}
      <Dialog open={declOpen} onOpenChange={setDeclOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Declaração de residência</DialogTitle>
          </DialogHeader>
          {decl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Nome completo" className="sm:col-span-2">
                <Input value={decl.nome} onChange={(e) => setDecl({ ...decl, nome: e.target.value })} />
              </Campo>
              <Campo label="CPF"><Input value={decl.cpf} onChange={(e) => setDecl({ ...decl, cpf: e.target.value })} /></Campo>
              <Campo label="RG"><Input value={decl.rg} onChange={(e) => setDecl({ ...decl, rg: e.target.value })} /></Campo>
              <Campo label="Placa"><Input value={decl.placa} onChange={(e) => setDecl({ ...decl, placa: e.target.value })} className="uppercase" /></Campo>
              <Campo label="Renavam"><Input value={decl.renavam} onChange={(e) => setDecl({ ...decl, renavam: e.target.value })} /></Campo>
              <Campo label="Endereço" className="sm:col-span-2">
                <Input value={decl.endereco} onChange={(e) => setDecl({ ...decl, endereco: e.target.value })} />
              </Campo>
              <Campo label="Número"><Input value={decl.numero} onChange={(e) => setDecl({ ...decl, numero: e.target.value })} /></Campo>
              <Campo label="Bairro"><Input value={decl.bairro} onChange={(e) => setDecl({ ...decl, bairro: e.target.value })} /></Campo>
              <Campo label="CEP"><Input value={decl.cep} onChange={(e) => setDecl({ ...decl, cep: e.target.value })} /></Campo>
              <Campo label="Cidade"><Input value={decl.cidade} onChange={(e) => setDecl({ ...decl, cidade: e.target.value })} /></Campo>
              <Campo label="UF"><Input value={decl.uf} onChange={(e) => setDecl({ ...decl, uf: e.target.value })} maxLength={2} /></Campo>
              <Campo label="Telefone"><Input value={decl.telefone} onChange={(e) => setDecl({ ...decl, telefone: e.target.value })} /></Campo>
              <Campo label="E-mail"><Input value={decl.email} onChange={(e) => setDecl({ ...decl, email: e.target.value })} /></Campo>
              <Campo label="Local da assinatura"><Input value={decl.cidadeAssinatura} onChange={(e) => setDecl({ ...decl, cidadeAssinatura: e.target.value })} /></Campo>
              <Campo label="Data"><Input value={decl.data} onChange={(e) => setDecl({ ...decl, data: e.target.value })} /></Campo>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclOpen(false)}>Cancelar</Button>
            <Button onClick={gerarDeclaracao} className="gap-1.5">
              <Printer className="h-4 w-4" /> Gerar PDF para impressão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Confirmar remoção de cartão CNPJ */}
      <Dialog open={!!confirmCnpj} onOpenChange={(open) => !open && setConfirmCnpj(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remover cartão CNPJ</DialogTitle>
          </DialogHeader>
          <p className="text-[13.5px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            Esse documento foi puxado automaticamente pelo CNPJ do cliente.
            Deseja remover também o cartão salvo para que ele <strong>não seja puxado nas próximas OS</strong>?
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (confirmCnpj) excluirAnexo(confirmCnpj, false);
                setConfirmCnpj(null);
              }}
            >
              Só desta OS
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (confirmCnpj) excluirAnexo(confirmCnpj, true);
                setConfirmCnpj(null);
              }}
            >
              Remover de todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
