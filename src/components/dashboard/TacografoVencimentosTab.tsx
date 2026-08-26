import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, ChevronRight, PackageOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, fmtData, fmtTelefoneVenc, diasBadgeClass,
  type TacoVencPendenteRow, type TacoVencEnviadoRow,
} from "@/lib/taco";

type Aba = "pendentes" | "enviados";

const ABAS: { value: Aba; label: string }[] = [
  { value: "pendentes", label: "A avisar" },
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

      <div className="flex items-center gap-1.5">
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

      {aba === "pendentes" ? <AbaPendentes /> : <AbaEnviados />}
    </div>
  );
}

function AbaPendentes() {
  const [expandido, setExpandido] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vw_taco_venc_pendentes"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_taco_venc_pendentes").select("*").order("dias_proximo", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as TacoVencPendenteRow[];
    },
  });

  const lista = Array.isArray(data) ? data : [];

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar quem falta avisar" details={(error as Error).message} />;

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
            {lista.map((row) => {
              const aberta = expandido === row.telefone_norm;
              const veiculos = Array.isArray(row.veiculos) ? row.veiculos : [];
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
                    <td><span className={`b-badge ${diasBadgeClass(row.dias_proximo)}`}>{row.dias_proximo}d</span></td>
                    <td className="text-xs">{row.qtd_ate_30d}</td>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">
                      {row.ultimo_envio_status
                        ? <span className={`b-badge ${row.ultimo_envio_status === "erro" ? "b-badge-ruptura" : "b-badge-muted"}`}>{row.ultimo_envio_status}</span>
                        : "—"}
                    </td>
                    <td>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" disabled>
                              <Send className="h-3 w-3 mr-1" /> Enviar agora
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Aguardando número novo configurado na Umbler</TooltipContent>
                      </Tooltip>
                    </td>
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
                            {veiculos.map((v, i) => (
                              <tr key={`${v.placa}-${i}`}>
                                <td className="py-0.5 font-mono">{v.placa}</td>
                                <td className="py-0.5">{v.veiculo}</td>
                                <td className="py-0.5 font-mono">{fmtData(v.data_vencimento)}</td>
                                <td className="py-0.5"><span className={`b-badge ${diasBadgeClass(v.dias)}`}>{v.dias}d</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Ninguém pendente de aviso agora.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
