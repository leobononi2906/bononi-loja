// Módulo Tacógrafo — listagem de ordens de serviço
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, AlertCircle, Gauge, FileCheck2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  db, fmtData, ANEXO_TIPOS, derivarStatusVisual,
  TacoOrdem,
} from "@/lib/taco";

type OrdemComAnexos = TacoOrdem & { taco_anexos: { tipo: string }[] };

const TOTAL_DOCS = ANEXO_TIPOS.length;

export default function TacografoLista() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<"andamento" | "concluidas">("andamento");
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="metric-card space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
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

      {/* Cards */}
      {!isLoading && !error && lista.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((o) => {
            const tipos = new Set((o.taco_anexos ?? []).map((a) => a.tipo));
            const docs = tipos.size;
            const sv = derivarStatusVisual(o.status, docs);
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
                  <span className={`b-badge ${sv.badgeClass}`}>
                    {sv.label}
                  </span>
                </div>
                <p className="text-[14px] font-semibold text-[hsl(var(--foreground))] truncate">
                  {o.cliente_nome}
                </p>
                <p className="text-[12.5px] text-[hsl(var(--muted-foreground))] truncate">
                  {[o.veiculo_placa, o.veiculo_marca_modelo].filter(Boolean).join(" · ") || "Veículo não informado"}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`b-badge ${docs >= TOTAL_DOCS ? "b-badge-ok" : docs > 0 ? "b-badge-critico" : "b-badge-muted"}`}>
                    {docs}/{TOTAL_DOCS} docs
                  </span>
                  <span className="text-[11px] text-[hsl(var(--text-muted))]">{fmtData(o.criado_em)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
