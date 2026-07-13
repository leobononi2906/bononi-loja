// Módulo Tacógrafo — listagem de ordens de serviço
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, AlertCircle, Gauge, FileCheck2, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  db, fmtData, ANEXO_TIPOS, derivarStatusVisual, contarDocsUnicos,
  TacoOrdem,
} from "@/lib/taco";

type OrdemComAnexos = TacoOrdem & { taco_anexos: { tipo: string }[] };

const TOTAL_DOCS = ANEXO_TIPOS.length;

type FiltroAba = "andamento" | "concluidas";

export default function TacografoLista() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<FiltroAba>("andamento");
  const [busca, setBusca] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["taco-ordens"],
    queryFn: async () => {
      const { data, error } = await db
        .from("taco_ordens")
        .select("*, taco_anexos(tipo)")
        .order("criado_em", { ascending: false })
        .range(0, 9999);
      if (error) throw error;
      return (data ?? []) as OrdemComAnexos[];
    },
  });

  const todas = Array.isArray(data) ? data : [];

  const lista = todas.filter((o) => {
    if (aba === "concluidas" && o.status !== "CONCLUIDA") return false;
    if (aba === "andamento" && o.status === "CONCLUIDA") return false;
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      (o.numero_os || "").toLowerCase().includes(q) ||
      (o.cliente_nome || "").toLowerCase().includes(q) ||
      (o.veiculo_placa || "").toLowerCase().includes(q)
    );
  });

  const qtdAndamento = todas.filter((o) => o.status !== "CONCLUIDA").length;
  const qtdConcluidas = todas.filter((o) => o.status === "CONCLUIDA").length;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[hsl(var(--primary))]" />
            Tacógrafo — Protocolo
          </h1>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
            Ordens de serviço de aferição e documentos
          </p>
        </div>
        <Button onClick={() => navigate("/tacografo/nova")} className="gap-2">
          <Plus className="h-4 w-4" /> Nova OS
        </Button>
      </div>

      {/* Abas + busca */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--border))]">
          <button
            onClick={() => setAba("andamento")}
            className={`px-4 py-2 text-[12.5px] font-semibold transition-colors ${
              aba === "andamento"
                ? "bg-[hsl(var(--primary))] text-white"
                : "bg-[hsl(var(--surface2))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Em andamento {qtdAndamento > 0 && `(${qtdAndamento})`}
          </button>
          <button
            onClick={() => setAba("concluidas")}
            className={`px-4 py-2 text-[12.5px] font-semibold transition-colors border-l border-[hsl(var(--border))] ${
              aba === "concluidas"
                ? "bg-[hsl(var(--primary))] text-white"
                : "bg-[hsl(var(--surface2))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Concluídas {qtdConcluidas > 0 && `(${qtdConcluidas})`}
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[340px] ml-auto">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar OS, placa ou cliente..."
            className="pl-9 h-9 text-[13px]"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="chart-container">
          <Skeleton className="h-4 w-48 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Erro ao carregar as ordens de serviço.</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {(error as Error).message}
            </p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && lista.length === 0 && (
        <div className="text-center py-12">
          <FileCheck2 className="h-10 w-10 text-[hsl(var(--muted-foreground))]/40 mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {aba === "concluidas"
              ? "Nenhuma OS concluída."
              : "Nenhuma OS em andamento."}
          </p>
        </div>
      )}

      {/* DESKTOP — Tabela */}
      {!isLoading && !error && lista.length > 0 && (
        <>
          <div className="hidden md:block chart-container overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">OS</th>
                  <th className="text-left">Cliente</th>
                  <th className="text-left">Placa</th>
                  <th className="text-left">Veículo</th>
                  <th className="text-center">Docs</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((o) => {
                  const tiposRaw = (o.taco_anexos ?? []).map((a) => a.tipo);
                  const docs = contarDocsUnicos(tiposRaw);
                  const sv = derivarStatusVisual(o.status, docs);
                  const completo = docs >= TOTAL_DOCS;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/tacografo/${o.id}`)}
                      className="cursor-pointer"
                    >
                      <td>
                        <span
                          className="font-bold text-[14px]"
                          style={{ fontFamily: "'DM Mono', monospace", color: "hsl(var(--primary))" }}
                        >
                          {o.numero_os}
                        </span>
                      </td>
                      <td className="font-medium max-w-[250px] truncate">{o.cliente_nome}</td>
                      <td>
                        <span style={{ fontFamily: "'DM Mono', monospace" }}>
                          {o.veiculo_placa || "—"}
                        </span>
                      </td>
                      <td className="text-[hsl(var(--muted-foreground))] max-w-[180px] truncate">
                        {o.veiculo_marca_modelo || "—"}
                      </td>
                      <td className="text-center">
                        {completo ? (
                          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] mx-auto" />
                        ) : (
                          <span className={`b-badge ${docs > 0 ? "b-badge-critico" : "b-badge-muted"}`}>
                            {docs}/{TOTAL_DOCS}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`b-badge ${sv.badgeClass}`}>{sv.label}</span>
                      </td>
                      <td className="text-right text-[hsl(var(--text-muted))]">{fmtData(o.criado_em)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE — Cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {lista.map((o) => {
              const tiposRaw = (o.taco_anexos ?? []).map((a) => a.tipo);
              const docs = contarDocsUnicos(tiposRaw);
              const sv = derivarStatusVisual(o.status, docs);
              const completo = docs >= TOTAL_DOCS;
              return (
                <button
                  key={o.id}
                  onClick={() => navigate(`/tacografo/${o.id}`)}
                  className="metric-card text-left w-full min-w-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className="font-bold text-[16px]"
                      style={{ fontFamily: "'DM Mono', monospace", color: "hsl(var(--primary))" }}
                    >
                      OS {o.numero_os}
                    </span>
                    <span className={`b-badge ${sv.badgeClass}`}>{sv.label}</span>
                  </div>
                  <p className="text-[14px] font-semibold text-[hsl(var(--foreground))] truncate">
                    {o.cliente_nome}
                  </p>
                  <p className="text-[12.5px] text-[hsl(var(--muted-foreground))] truncate">
                    {[o.veiculo_placa, o.veiculo_marca_modelo].filter(Boolean).join(" · ") || "Veículo não informado"}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    {completo ? (
                      <span className="b-badge b-badge-ok flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Completo
                      </span>
                    ) : (
                      <span className={`b-badge ${docs > 0 ? "b-badge-critico" : "b-badge-muted"}`}>
                        {docs}/{TOTAL_DOCS} docs
                      </span>
                    )}
                    <span className="text-[11px] text-[hsl(var(--text-muted))]">{fmtData(o.criado_em)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
