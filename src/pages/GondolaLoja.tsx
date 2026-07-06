import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Trash2, Printer, RefreshCw, AlertTriangle, CheckCircle2, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GondolaItem {
  id: number;
  referencia: string;
  nome: string;
  preco_etiqueta: number | null;
  data_ultima_impressao: string | null;
  criado_em: string;
  preco_atual?: number | null;
}

interface ProdutoBusca {
  id_produto: number;
  referencia: string;
  nome: string;
  preco_venda: number;
}

function fmtPreco(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function divergencia(item: GondolaItem) {
  if (item.preco_etiqueta == null || item.preco_atual == null) return false;
  return Math.abs(item.preco_etiqueta - item.preco_atual) > 0.009;
}

// ─── Impressão via iframe oculto com style inline ──────────────────────
function imprimirEtiquetas(itens: GondolaItem[]) {
  const etiquetasHtml = itens.map(item => {
    const preco = item.preco_atual ?? item.preco_etiqueta ?? 0;
    const [intPart, decPart] = preco.toFixed(2).split(".");
    const intFmt = Number(intPart).toLocaleString("pt-BR");
    const nome = item.nome.length > 52 ? item.nome.slice(0, 52) + "…" : item.nome;
    return `<div style="width:91mm;height:30mm;padding:4mm 3mm 2mm 3mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;page-break-inside:avoid;font-family:Arial,sans-serif;color:#000;overflow:hidden;box-sizing:border-box;">
      <div style="font-size:9pt;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Referência ${item.referencia}</div>
      <div style="font-size:11pt;font-weight:bold;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word;flex:1;margin:1mm 0;">${nome}</div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;">
        <div style="display:flex;align-items:baseline;gap:1mm;">
          <span style="font-size:11pt;font-weight:bold;">R$</span>
          <span style="font-size:22pt;font-weight:bold;letter-spacing:-0.5px;line-height:1;">${intFmt},${decPart}</span>
        </div>
        <span style="font-size:7pt;color:#555;">(Com Trib.)</span>
      </div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}@page{size:91mm 30mm;margin:0;}body{width:91mm;background:#fff;}</style></head><body>${etiquetasHtml}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:91mm;height:30mm;border:none;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

// ─── Painel de busca — componente separado para isolar estado ──────────
function PainelBusca({
  refsNaGondola,
  onAdicionado,
}: {
  refsNaGondola: Set<string>;
  onAdicionado: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ProdutoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [ultimoAdicionado, setUltimoAdicionado] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mutation fica aqui dentro — não afeta o pai ao resolver
  const addMutation = useMutation({
    mutationFn: async (prod: ProdutoBusca) => {
      const { error } = await supabase.from("loja_gondola").upsert({
        referencia: prod.referencia,
        nome: prod.nome,
        preco_etiqueta: prod.preco_venda,
      }, { onConflict: "referencia" });
      if (error) throw error;
    },
    onSuccess: () => onAdicionado(),
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  const buscar = useCallback(async (termo: string) => {
    if (termo.length < 2) { setResultados([]); setIdx(-1); return; }
    setBuscando(true);
    try {
      const q = supabase
        .from("vw_fb_produtos_compras")
        .select("id_produto,referencia,nome,preco_venda,ipi_saida")
        .eq("id_empresa", 2)
        .eq("fora_linha", "0")
        .range(0, 19);
      if (/^\d+$/.test(termo)) q.ilike("referencia", `%${termo}%`);
      else q.ilike("nome", `%${termo}%`);
      const { data } = await q;
      setResultados((data ?? []).map(d => {
        const base = Number(d.preco_venda) || 0;
        const ipi  = Number(d.ipi_saida)  || 0;
        const preco_venda = ipi > 0 ? Math.round(base * (1 + ipi / 100) * 100) / 100 : base;
        return { ...d, id_produto: d.id_produto, referencia: d.referencia, nome: d.nome, preco_venda };
      }));
      setIdx(-1);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => buscar(busca), 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [busca, buscar]);

  function adicionar(prod: ProdutoBusca) {
    addMutation.mutate(prod);
    // Não limpa o campo nem os resultados — lista fica visível
    // O item adicionado aparece com badge "✓ Na gôndola"
    setIdx(-1);
    setUltimoAdicionado(prod.referencia);
    setTimeout(() => setUltimoAdicionado(null), 2000);
    inputRef.current?.focus();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && resultados.length > 0) {
      adicionar(idx >= 0 ? resultados[idx] : resultados[0]);
    }
  }

  return (
    <div className="space-y-2">
      {/* Último adicionado */}
      {ultimoAdicionado && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Adicionado à gôndola — pronto para o próximo</span>
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={onKey}
          placeholder="Referência ou nome do produto..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Instrução */}
      <p className="text-[11px] text-muted-foreground px-1">↑↓ navega na lista · Enter adiciona · Esc fecha</p>

      {/* Resultados */}
      {buscando && <p className="text-xs text-muted-foreground px-1">Buscando...</p>}
      {resultados.length > 0 && (
        <div className="border rounded-lg divide-y overflow-hidden">
          {resultados.map((prod, i) => {
            const jaAdicionado = refsNaGondola.has(prod.referencia);
            const selecionado = i === idx;
            return (
              <div
                key={prod.id_produto}
                onClick={() => !jaAdicionado && adicionar(prod)}
                className={`flex items-center justify-between px-3 py-2.5 transition-colors
                  ${jaAdicionado ? "opacity-50 cursor-default bg-muted/30" : "cursor-pointer"}
                  ${selecionado && !jaAdicionado ? "bg-primary/10 border-l-2 border-l-primary" : ""}
                  ${!selecionado && !jaAdicionado ? "hover:bg-muted/50" : ""}
                `}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{prod.referencia}</span>
                  <span className="text-sm font-medium truncate">{prod.nome}</span>
                  {jaAdicionado && (
                    <span className="text-[10px] text-green-600 font-semibold shrink-0 bg-green-100 px-1.5 py-0.5 rounded">
                      ✓ Na gôndola
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold ml-3 shrink-0">{fmtPreco(prod.preco_venda)}</span>
              </div>
            );
          })}
        </div>
      )}
      {busca.length >= 2 && !buscando && resultados.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">Nenhum produto encontrado.</p>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────
export default function GondolaLoja() {
  const qc = useQueryClient();
  const [painelAberto, setPainelAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  function toggleItem(id: number) {
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(todosIds));
    }
  }

  async function handleImprimirSelecionados() {
    const itens = gondola.filter(i => selecionados.has(i.id));
    if (itens.length === 0) return;
    await handleImprimir(itens);
    setSelecionados(new Set());
  }

  const { data: gondola = [], isLoading } = useQuery({
    queryKey: ["gondola"],
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from("loja_gondola").select("*").order("criado_em", { ascending: true }).range(0, 9999);
      if (error) throw error;
      if (!items || items.length === 0) return [];
      const refs = items.map(i => i.referencia);
      const { data: precos } = await supabase
        .from("vw_fb_produtos_compras")
        .select("referencia,preco_venda,ipi_saida")
        .eq("id_empresa", 2)
        .in("referencia", refs)
        .range(0, 9999);
      const mapa: Record<string, number> = {};
      (precos ?? []).forEach(p => {
        const base = Number(p.preco_venda) || 0;
        const ipi  = Number(p.ipi_saida)  || 0;
        mapa[p.referencia] = ipi > 0 ? Math.round(base * (1 + ipi / 100) * 100) / 100 : base;
      });
      return items.map(i => ({ ...i, preco_atual: mapa[i.referencia] ?? null })) as GondolaItem[];
    },
    refetchInterval: 60_000,
  });

  // Set de referências já na gôndola — para mostrar badge na busca
  const todosIds = gondola.map(i => i.id);
  const todosSelecionados = todosIds.length > 0 && todosIds.every(id => selecionados.has(id));
  const algunsSelecionados = selecionados.size > 0 && !todosSelecionados;

  const refsNaGondola = new Set(gondola.map(i => i.referencia));

  const divergentes = gondola.filter(divergencia);
  const okCount = gondola.filter(i => !divergencia(i) && i.preco_etiqueta != null).length;

  // addMutation vive dentro do PainelBusca — aqui só invalidamos o cache

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("loja_gondola").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gondola"] }),
  });

  const atualizarMutation = useMutation({
    mutationFn: async (item: GondolaItem) => {
      const { error } = await supabase.from("loja_gondola").update({
        preco_etiqueta: item.preco_atual, data_ultima_impressao: null,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gondola"] }),
  });

  async function handleImprimir(itens: GondolaItem[]) {
    imprimirEtiquetas(itens);
    for (const item of itens) {
      if (item.preco_atual == null) continue;
      await supabase.from("loja_gondola").update({
        preco_etiqueta: item.preco_atual,
        data_ultima_impressao: new Date().toISOString(),
      }).eq("id", item.id);
    }
    qc.invalidateQueries({ queryKey: ["gondola"] });
  }

  // Fecha painel com Esc globalmente
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setPainelAberto(false); }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div className="dashboard-section space-y-4 p-4 sm:p-6">
      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card border-l-4" style={{ borderLeftColor: "hsl(var(--primary))" }}>
          <div className="metric-label">Na gôndola</div>
          <div className="metric-value text-[22px]">{gondola.length}</div>
        </div>
        <div className="metric-card border-l-4" style={{ borderLeftColor: "hsl(var(--destructive))" }}>
          <div className="metric-label flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Divergentes</div>
          <div className="metric-value text-[22px] text-destructive">{divergentes.length}</div>
        </div>
        <div className="metric-card border-l-4" style={{ borderLeftColor: "hsl(var(--success))" }}>
          <div className="metric-label flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> OK</div>
          <div className="metric-value text-[22px] text-green-600">{okCount}</div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setPainelAberto(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar produto
        </button>
        {divergentes.length > 0 && (
          <button onClick={() => handleImprimir(divergentes)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors">
            <Printer className="h-4 w-4" /> Imprimir divergentes ({divergentes.length})
          </button>
        )}
        {selecionados.size > 0 && (
          <button onClick={handleImprimirSelecionados}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Printer className="h-4 w-4" /> Imprimir selecionados ({selecionados.size})
          </button>
        )}
      </div>

      {/* Painel de busca — sempre montado quando aberto, nunca desmonta sozinho */}
      {painelAberto && (
        <div className="chart-container space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Adicionar produto à gôndola</h3>
            <button onClick={() => setPainelAberto(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border hover:bg-muted transition-colors">
              <X className="h-3 w-3" /> Fechar
            </button>
          </div>
          <PainelBusca
            refsNaGondola={refsNaGondola}
            onAdicionado={() => qc.invalidateQueries({ queryKey: ["gondola"] })}
          />
        </div>
      )}

      {/* Lista da gôndola */}
      {isLoading ? (
        <div className="chart-container text-center py-10 text-sm text-muted-foreground">Carregando...</div>
      ) : gondola.length === 0 ? (
        <div className="chart-container text-center py-12">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Nenhum produto na gôndola ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Adicionar produto" para começar.</p>
        </div>
      ) : (
        <div className="chart-container p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      ref={el => { if (el) el.indeterminate = algunsSelecionados; }}
                      onChange={toggleTodos}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Referência</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Produto</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold text-muted-foreground">Etiqueta</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold text-muted-foreground">Atual</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {gondola.map(item => {
                  const div = divergencia(item);
                  return (
                    <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer ${div ? "bg-red-50/40 dark:bg-red-950/10" : ""} ${selecionados.has(item.id) ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
                      onClick={() => toggleItem(item.id)}>
                      <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selecionados.has(item.id)} onChange={() => toggleItem(item.id)} className="cursor-pointer" />
                      </td>
                      <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{item.referencia}</td>
                      <td className="py-2.5 px-3 text-xs font-medium max-w-[200px]"><span className="line-clamp-2">{item.nome}</span></td>
                      <td className="py-2.5 px-3 text-xs text-right font-mono">
                        {fmtPreco(item.preco_etiqueta)}
                        {item.data_ultima_impressao && (
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(item.data_ultima_impressao).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </td>
                      <td className={`py-2.5 px-3 text-xs text-right font-mono font-semibold ${div ? "text-destructive" : ""}`}>
                        {fmtPreco(item.preco_atual)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.preco_etiqueta == null ? (
                          <span className="text-[10px] text-muted-foreground">Sem etiqueta</span>
                        ) : div ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-red-100 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-2.5 w-2.5" /> DIVERGENTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-2.5 w-2.5" /> OK
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button title="Imprimir etiqueta" onClick={() => handleImprimir([item])}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          {div && (
                            <button title="Confirmar atualização de preço" onClick={() => atualizarMutation.mutate(item)}
                              className="p-1.5 rounded hover:bg-muted text-amber-600 hover:text-amber-700 transition-colors">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button title="Remover da gôndola" onClick={() => removeMutation.mutate(item.id)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}




