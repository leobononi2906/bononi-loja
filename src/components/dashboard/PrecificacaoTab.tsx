import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calculator, ChevronDown, ChevronRight, CheckCircle2, PackageOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, distLog, getUsuarioNome, setUsuarioNome, fmtDataAbrev, fmtHoras, limparObservacao, EMPRESA_MLB_PR,
  type DistPrecificacaoRow, type ApontamentoOS,
} from "@/lib/dist";

export function PrecificacaoTab() {
  const qc = useQueryClient();
  const [expandido, setExpandido] = useState<number | null>(null);
  const [usuario, setUsuario] = useState(getUsuarioNome());
  const [validando, setValidando] = useState<number | null>(null);

  const { data: servicos, isLoading, error } = useQuery({
    queryKey: ["vw_dist_precificacao"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_dist_precificacao").select("*").eq("id_empresa", EMPRESA_MLB_PR).order("data_conclusao", { ascending: false }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistPrecificacaoRow[];
    },
  });

  const lista = Array.isArray(servicos) ? servicos : [];

  async function validar(row: DistPrecificacaoRow) {
    const nome = usuario.trim();
    if (!nome) {
      toast.error("Informe seu nome antes de validar.");
      return;
    }
    setUsuarioNome(nome);
    setValidando(row.id_servico);
    const agora = new Date().toISOString();
    let error;
    if (row.id_dist != null) {
      ({ error } = await db.from("dist_servico").update({
        validado: true, validado_por: nome, validado_em: agora, atualizado_em: agora,
      }).eq("id", row.id_dist));
    } else {
      ({ error } = await db.from("dist_servico").insert({
        id_servico_legado: row.id_servico, id_os: row.id_os, validado: true, validado_por: nome, validado_em: agora,
      }));
    }
    setValidando(null);
    if (error) {
      toast.error("Erro ao validar: " + error.message);
      distLog("error", "ERRO_VALIDAR_SERVICO", error.message);
      return;
    }
    distLog("info", "VALIDAR_SERVICO", `id_servico=${row.id_servico} id_dist=${row.id_dist ?? "novo"}`);
    toast.success("Serviço validado.");
    qc.invalidateQueries({ queryKey: ["vw_dist_precificacao"] });
  }

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar a precificação" details={(error as Error).message} />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold font-display">Precificação</h2>
            <p className="text-xs text-muted-foreground">Serviços finalizados ainda não validados — preço é lançado direto no ERP (MLB PR)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Seu nome</span>
          <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Quem está validando" className="h-8 text-xs w-[180px]" />
        </div>
      </div>

      <div className="chart-container overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Conclusão</th>
              <th>Prisma</th>
              <th>Nº OS</th>
              <th>Cliente</th>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Serviço</th>
              <th>Área</th>
              <th>Colaborador(es)</th>
              <th>Horas apont.</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((row) => {
              const chave = row.id_dist ?? -row.id_servico;
              const aberta = expandido === chave;
              return (
                <ExpansibleRow
                  key={chave}
                  row={row}
                  aberta={aberta}
                  onToggle={() => setExpandido(aberta ? null : chave)}
                  onValidar={() => validar(row)}
                  validando={validando === row.id_servico}
                />
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={12} className="py-10 text-center">
                  <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhum serviço pendente de validação.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpansibleRow({
  row, aberta, onToggle, onValidar, validando,
}: {
  row: DistPrecificacaoRow;
  aberta: boolean;
  onToggle: () => void;
  onValidar: () => void;
  validando: boolean;
}) {
  const { data: apontamentos, isLoading } = useQuery({
    queryKey: ["vw_fb_os_apontamento", row.id_servico],
    queryFn: async () => {
      const { data, error } = await db.from("vw_fb_os_apontamento").select("*").eq("id_servico", row.id_servico).order("data_apont", { ascending: true });
      if (error) throw error;
      // A view às vezes traz apontamento duplicado (mesmo id_colaborador/data/hora,
      // id_apontamento diferente) — raro (~2% dos casos), mas sem isso a lista mostra
      // a mesma linha 2x. Dedupe pela combinação que identifica o apontamento real.
      const vistos = new Set<string>();
      return ((data ?? []) as ApontamentoOS[]).filter((a) => {
        const chave = `${a.id_colaborador}|${a.data_apont}|${a.hora_inicio}|${a.hora_termino}`;
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });
    },
    enabled: aberta,
  });

  return (
    <>
      <tr className={row.is_duplicado ? "bg-muted/20" : undefined}>
        <td className="w-6">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {aberta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </td>
        <td className="text-xs font-mono whitespace-nowrap">{fmtDataAbrev(row.data_conclusao)}</td>
        <td className="text-xs font-mono">{row.prisma ?? "—"}</td>
        <td className="text-xs font-mono">
          {row.id_os}
          {row.is_duplicado && <span className="text-[10px] text-muted-foreground ml-1">(dup.)</span>}
        </td>
        <td className="text-xs min-w-0 max-w-[180px] truncate" title={row.cliente}>{row.cliente}</td>
        <td className="text-xs font-mono whitespace-nowrap">{row.placa ?? "—"}</td>
        <td className="text-xs min-w-0 max-w-[140px] truncate" title={row.modelo ?? ""}>{row.modelo ?? "—"}</td>
        <td className="text-xs min-w-0 max-w-[180px] truncate" title={row.servico}>{row.servico}</td>
        <td className="text-xs whitespace-nowrap">{row.area ?? "—"}</td>
        <td className="text-xs min-w-0 max-w-[160px] truncate" title={row.colaboradores ?? ""}>{row.colaboradores || "—"}</td>
        <td className="text-xs font-mono">{fmtHoras(row.horas_apontadas)}</td>
        <td>
          <Button size="sm" className="h-7 px-2 text-[11px]" onClick={onValidar} disabled={validando}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> {validando ? "Validando..." : "Validar"}
          </Button>
        </td>
      </tr>
      {aberta && (
        <tr>
          <td colSpan={12} className="bg-muted/20 text-xs px-4 py-2">
            {limparObservacao(row.observacao) && <p className="mb-2"><span className="font-semibold text-muted-foreground">Observação: </span>{limparObservacao(row.observacao)}</p>}
            {isLoading ? (
              <p className="text-muted-foreground">Carregando apontamentos...</p>
            ) : !apontamentos || apontamentos.length === 0 ? (
              <p className="text-muted-foreground">Sem apontamentos registrados para este serviço.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase text-muted-foreground">
                    <th className="text-left font-semibold py-1">Colaborador</th>
                    <th className="text-left font-semibold py-1">Data</th>
                    <th className="text-left font-semibold py-1">Início</th>
                    <th className="text-left font-semibold py-1">Término</th>
                    <th className="text-left font-semibold py-1">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {apontamentos.map((a) => (
                    <tr key={a.id_apontamento}>
                      <td className="py-0.5">{a.colaborador}</td>
                      <td className="py-0.5 font-mono">{fmtDataAbrev(a.data_apont)}</td>
                      <td className="py-0.5 font-mono">{a.hora_inicio}</td>
                      <td className="py-0.5 font-mono">{a.hora_termino ?? "—"}</td>
                      <td className="py-0.5 font-mono">{fmtHoras(a.horas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
