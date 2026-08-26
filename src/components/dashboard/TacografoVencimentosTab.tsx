import { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, ChevronDown, ChevronRight, PackageOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, tacoLog, fmtData, fmtTelefoneVenc, diasVencInfo, normalizarTelefoneBR,
  type TacoVencPendenteRow, type TacoVencBacklogRow, type TacoVencSemTelefoneRow,
  type TacoVencEnviadoRow, type ClienteVencRow,
} from "@/lib/taco";

type Aba = "pendentes" | "backlog" | "sem_telefone" | "enviados";

const ABAS: { value: Aba; label: string }[] = [
  { value: "pendentes", label: "A avisar" },
  { value: "backlog", label: "Recuperação/Vencidos" },
  { value: "sem_telefone", label: "Atualizar telefone" },
  { value: "enviados", label: "Enviados" },
];

export function TacografoVencimentosTab() {
  const [aba, setAba] = useState<Aba>("pendentes");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Vencimentos de Tacógrafo</h2>
          <p className="text-xs text-muted-foreground">Avisos de renovação por WhatsApp — a aferição vale 2 anos, avisamos ~15 dias antes</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {ABAS.map((a) => (
          <button
            key={a.value}
            onClick={() => setAba(a.value)}
            className={`h-7 px-3 rounded-md text-xs font-medium border transition-colors ${
              aba === a.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:bg-card"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "pendentes" && <AbaPendentes />}
      {aba === "backlog" && <AbaBacklog />}
      {aba === "sem_telefone" && <AbaSemTelefone />}
      {aba === "enviados" && <AbaEnviados />}
    </div>
  );
}

// Dispara 1 cliente na hora, ignorando o pacing do cron (edge taco-venc-disparar).
function BotaoEnviarAgora({ telefoneNorm, onEnviado }: { telefoneNorm: string; onEnviado: () => void }) {
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    const { error } = await db.functions.invoke("taco-venc-disparar", { body: { telefone_norm: telefoneNorm } });
    setEnviando(false);
    if (error) {
      toast.error("Erro ao disparar: " + error.message);
      tacoLog("ERRO", "ERRO_ENVIAR_VENC_AGORA", { erro: error, telefone_norm: telefoneNorm });
      return;
    }
    toast.success("Envio disparado.");
    tacoLog("INFO", "ENVIAR_VENC_AGORA", { telefone_norm: telefoneNorm });
    onEnviado();
  }

  return (
    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={enviar} disabled={enviando}>
      <Send className="h-3 w-3 mr-1" /> {enviando ? "Enviando..." : "Enviar agora"}
    </Button>
  );
}

// Tabela compartilhada por "A avisar" e "Recuperação/Vencidos" — mesmo grão
// (1 linha por cliente/telefone, expand com os veículos).
function ListaClientesVenc({
  rows, vazioLabel, onEnviado,
}: {
  rows: ClienteVencRow[];
  vazioLabel: string;
  onEnviado: () => void;
}) {
  const [expandido, setExpandido] = useState<string | null>(null);

  return (
    <div className="chart-container overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Próx. Vencimento</th>
            <th>Dias</th>
            <th>Veículos</th>
            <th>Último envio</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const aberta = expandido === row.telefone_norm;
            const veiculos = Array.isArray(row.veiculos) ? row.veiculos : [];
            const info = diasVencInfo(row.dias_proximo);
            return (
              <Fragment key={row.telefone_norm}>
                <tr>
                  <td className="w-6">
                    <button onClick={() => setExpandido(aberta ? null : row.telefone_norm)} className="text-muted-foreground hover:text-foreground">
                      {aberta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                  <td className="text-xs min-w-0 max-w-[220px] truncate" title={row.cliente_nome}>{row.cliente_nome}</td>
                  <td className="text-xs font-mono whitespace-nowrap">{fmtTelefoneVenc(row.telefone_norm)}</td>
                  <td className="text-xs font-mono whitespace-nowrap">{fmtData(row.proximo_venc)}</td>
                  <td><span className={`b-badge ${info.badgeClass}`}>{info.label}</span></td>
                  <td className="text-xs">{row.qtd}</td>
                  <td className="text-xs text-muted-foreground whitespace-nowrap">
                    {row.ultimo_envio_status
                      ? <span className={`b-badge ${row.ultimo_envio_status === "erro" ? "b-badge-ruptura" : "b-badge-muted"}`}>{row.ultimo_envio_status}</span>
                      : "—"}
                  </td>
                  <td><BotaoEnviarAgora telefoneNorm={row.telefone_norm} onEnviado={onEnviado} /></td>
                </tr>
                {aberta && (
                  <tr>
                    <td colSpan={8} className="bg-muted/20 text-xs px-4 py-2">
                      <table className="w-full">
                        <thead>
                          <tr className="text-[10px] uppercase text-muted-foreground">
                            <th className="text-left font-semibold py-1">Placa</th>
                            <th className="text-left font-semibold py-1">Veículo</th>
                            <th className="text-left font-semibold py-1">Vencimento</th>
                            <th className="text-left font-semibold py-1">Dias</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculos.map((v, i) => {
                            const infoV = diasVencInfo(v.dias);
                            return (
                              <tr key={`${v.placa}-${i}`}>
                                <td className="py-0.5 font-mono">{v.placa}</td>
                                <td className="py-0.5">{v.veiculo}</td>
                                <td className="py-0.5 font-mono">{fmtData(v.data_vencimento)}</td>
                                <td className="py-0.5"><span className={`b-badge ${infoV.badgeClass}`}>{infoV.label}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-10 text-center">
                <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{vazioLabel}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AbaPendentes() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vw_taco_venc_pendentes"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_taco_venc_pendentes").select("*").order("dias_proximo", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as TacoVencPendenteRow[];
    },
  });

  const lista: ClienteVencRow[] = (Array.isArray(data) ? data : []).map((r) => ({ ...r, qtd: r.qtd_ate_30d }));

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar quem falta avisar" details={(error as Error).message} />;

  return (
    <ListaClientesVenc
      rows={lista}
      vazioLabel="Ninguém pendente de aviso agora."
      onEnviado={() => {
        qc.invalidateQueries({ queryKey: ["vw_taco_venc_pendentes"] });
        qc.invalidateQueries({ queryKey: ["vw_taco_venc_enviados"] });
      }}
    />
  );
}

function AbaBacklog() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vw_taco_venc_backlog"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_taco_venc_backlog").select("*").order("dias_proximo", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as TacoVencBacklogRow[];
    },
  });

  const lista: ClienteVencRow[] = (Array.isArray(data) ? data : []).map((r) => ({ ...r, qtd: r.qtd_veic }));

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar o backlog de vencidos" details={(error as Error).message} />;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Tacógrafo já vencido — não entra em "A avisar", mas está sendo disparado (recuperação).</p>
      <ListaClientesVenc
        rows={lista}
        vazioLabel="Nenhum backlog de vencido agora."
        onEnviado={() => {
          qc.invalidateQueries({ queryKey: ["vw_taco_venc_backlog"] });
          qc.invalidateQueries({ queryKey: ["vw_taco_venc_enviados"] });
        }}
      />
    </div>
  );
}

function LinhaSemTelefone({ row, onSalvo }: { row: TacoVencSemTelefoneRow; onSalvo: () => void }) {
  const [expandida, setExpandida] = useState(false);
  const [telefone, setTelefone] = useState(row.veiculos[0]?.telefone_raw ?? "");
  const [salvando, setSalvando] = useState(false);
  const veiculos = Array.isArray(row.veiculos) ? row.veiculos : [];

  async function salvar() {
    const bruto = telefone.trim();
    if (!bruto) {
      toast.error("Informe um telefone.");
      return;
    }
    const { telefone_norm, is_celular } = normalizarTelefoneBR(bruto);
    const ids = veiculos.map((v) => v.id);
    setSalvando(true);
    const { error } = await db.from("taco_venc_item").update({
      telefone_raw: bruto, telefone_norm, is_celular,
    }).in("id", ids);
    setSalvando(false);
    if (error) {
      toast.error("Erro ao salvar telefone: " + error.message);
      tacoLog("ERRO", "ERRO_CORRIGIR_TELEFONE_VENC", { erro: error, ids });
      return;
    }
    toast.success(is_celular ? "Telefone salvo — cliente entra na fila." : "Telefone salvo (não reconhecido como celular).");
    tacoLog("INFO", "CORRIGIR_TELEFONE_VENC", { ids, telefone_norm, is_celular });
    onSalvo();
  }

  return (
    <Fragment>
      <tr>
        <td className="w-6">
          <button onClick={() => setExpandida(!expandida)} className="text-muted-foreground hover:text-foreground">
            {expandida ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </td>
        <td className="text-xs min-w-0 max-w-[220px] truncate" title={row.cliente_nome}>{row.cliente_nome}</td>
        <td className="text-xs font-mono whitespace-nowrap">{fmtData(row.proximo_venc)}</td>
        <td className="text-xs">{row.qtd_ate_30d}</td>
        <td>
          <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="DDD + número" className="h-7 text-xs w-[160px]" />
        </td>
        <td>
          <Button size="sm" className="h-7 px-2 text-[11px]" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </td>
      </tr>
      {expandida && (
        <tr>
          <td colSpan={6} className="bg-muted/20 text-xs px-4 py-2">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase text-muted-foreground">
                  <th className="text-left font-semibold py-1">Placa</th>
                  <th className="text-left font-semibold py-1">Veículo</th>
                  <th className="text-left font-semibold py-1">Vencimento</th>
                  <th className="text-left font-semibold py-1">Telefone cadastrado</th>
                </tr>
              </thead>
              <tbody>
                {veiculos.map((v) => (
                  <tr key={v.id}>
                    <td className="py-0.5 font-mono">{v.placa ?? "—"}</td>
                    <td className="py-0.5">{v.veiculo}</td>
                    <td className="py-0.5 font-mono">{fmtData(v.data_vencimento)}</td>
                    <td className="py-0.5 font-mono">{v.telefone_raw ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function AbaSemTelefone() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vw_taco_venc_sem_telefone"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_taco_venc_sem_telefone").select("*").order("dias_proximo", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as TacoVencSemTelefoneRow[];
    },
  });

  const lista = Array.isArray(data) ? data : [];

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar quem está sem telefone válido" details={(error as Error).message} />;

  function onSalvo() {
    qc.invalidateQueries({ queryKey: ["vw_taco_venc_sem_telefone"] });
    qc.invalidateQueries({ queryKey: ["vw_taco_venc_pendentes"] });
    qc.invalidateQueries({ queryKey: ["vw_taco_venc_backlog"] });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Entrariam no aviso, mas não têm celular válido cadastrado — corrija e o cliente entra na fila sozinho.</p>
      <div className="chart-container overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Cliente</th>
              <th>Próx. Vencimento</th>
              <th>Veículos</th>
              <th>Telefone</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((row) => <LinhaSemTelefone key={row.chave_cliente} row={row} onSalvo={onSalvo} />)}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Todo mundo tem telefone válido — nada pra corrigir.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaEnviados() {
  const [expandido, setExpandido] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vw_taco_venc_enviados"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_taco_venc_enviados").select("*").order("criado_em", { ascending: false }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as TacoVencEnviadoRow[];
    },
  });

  const lista = Array.isArray(data) ? data : [];

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar o histórico de envios" details={(error as Error).message} />;

  return (
    <div className="chart-container overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Enviado em</th>
            <th>Veículos</th>
            <th>Status</th>
            <th>Por</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((row) => {
            const aberta = expandido === row.id;
            const itens = Array.isArray(row.itens) ? row.itens : [];
            const erro = row.status === "erro";
            return (
              <Fragment key={row.id}>
                <tr>
                  <td className="w-6">
                    <button onClick={() => setExpandido(aberta ? null : row.id)} className="text-muted-foreground hover:text-foreground">
                      {aberta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                  <td className="text-xs min-w-0 max-w-[220px] truncate" title={row.cliente_nome}>{row.cliente_nome}</td>
                  <td className="text-xs font-mono whitespace-nowrap">{fmtTelefoneVenc(row.telefone_norm)}</td>
                  <td className="text-xs font-mono whitespace-nowrap">{row.enviado_em ? new Date(row.enviado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="text-xs">{row.qtd_veiculos}</td>
                  <td><span className={`b-badge ${erro ? "b-badge-ruptura" : "b-badge-ok"}`}>{row.status}</span></td>
                  <td className="text-xs text-muted-foreground whitespace-nowrap">{row.criado_por ?? "—"}</td>
                </tr>
                {aberta && (
                  <tr>
                    <td colSpan={7} className="bg-muted/20 text-xs px-4 py-2 space-y-2">
                      {itens.length > 0 && (
                        <p><span className="font-semibold text-muted-foreground">Placas: </span>{itens.map((it) => it.placa).join(", ")}</p>
                      )}
                      {row.mensagem && (
                        <p className="whitespace-pre-wrap"><span className="font-semibold text-muted-foreground">Mensagem: </span>{row.mensagem}</p>
                      )}
                      {erro && row.erro && (
                        <p className="text-destructive"><span className="font-semibold">Erro: </span>{row.erro}</p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {lista.length === 0 && (
            <tr>
              <td colSpan={7} className="py-10 text-center">
                <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum aviso enviado ainda.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
