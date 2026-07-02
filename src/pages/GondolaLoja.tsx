import { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, Printer, RefreshCw, AlertTriangle, CheckCircle2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Tipos ───────────────────────────────────────────────────────────
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

// ─── Formatação ───────────────────────────────────────────────────────
function fmtPreco(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function divergencia(item: GondolaItem) {
  if (item.preco_etiqueta == null || item.preco_atual == null) return false;
  return Math.abs(item.preco_etiqueta - item.preco_atual) > 0.009;
}

// ─── Componente de impressão ──────────────────────────────────────────
function imprimirEtiquetas(itens: GondolaItem[]) {
  // Argox retrato — 30mm largura × 91mm altura
  // @page size = largura × altura do papel (retrato = 30 x 91)
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: Arial, sans-serif;
    background: #fff;
    width: 30mm;
  }
  @page {
    size: 91mm 30mm;
    margin: 0;
  }
  .etiqueta {
    width: 91mm;
    height: 30mm;
    padding: 5mm 3mm 2mm 3mm; /* topo maior por causa do cortezinho */
    page-break-after: always;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .ref {
    font-size: 6pt;
    font-weight: bold;
    color: #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 1.5mm;
  }
  .nome {
    font-size: 9pt;
    font-weight: bold;
    color: #000;
    line-height: 1.2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
    flex: 1;
  }
  .preco-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5mm;
    margin-top: 2mm;
  }
  .preco-esq {
    display: flex;
    align-items: baseline;
    gap: 1mm;
  }
  .rs { font-size: 10pt; font-weight: bold; color: #000; }
  .valor { font-size: 20pt; font-weight: bold; color: #000; letter-spacing: -0.5px; }
  .trib { font-size: 6pt; color: #444; }
</style>
</head>
<body>
\${itens.map(item => {
  const preco = item.preco_atual ?? item.preco_etiqueta ?? 0;
  const [intPart, decPart] = preco.toFixed(2).split(".");
  const intFmt = Number(intPart).toLocaleString("pt-BR");
  return \`<div class="etiqueta">
    <div class="ref">Referência \${item.referencia}</div>
    <div class="nome">\${item.nome}</div>
    <div class="preco-row">
      <div class="preco-esq">
        <span class="rs">R$</span>
        <span class="valor">\${intFmt},\${decPart}</span>
      </div>
      <div class="trib">(Com Trib.)</div>
    </div>
  </div>\`;
}).join("")}
</body>
</html>\`;

  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Componente principal ─────────────────────────────────────────────
export default function GondolaLoja() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ProdutoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const buscaRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Carrega gôndola com preço atual
  const { data: gondola = [], isLoading } = useQuery({
    queryKey: ["gondola"],
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from("loja_gondola")
        .select("*")
        .order("criado_em", { ascending: true })
        .range(0, 9999);
      if (error) throw error;

      if (!items || items.length === 0) return [];

      // Busca preços atuais em lote
      const refs = items.map(i => i.referencia);
      const { data: precos } = await supabase
        .from("bling_produtos_sync")
        .select("referencia, preco")
        .in("referencia", refs)
        .range(0, 9999);

      const mapaPrecos: Record<string, number> = {};
      (precos ?? []).forEach(p => { mapaPrecos[p.referencia] = Number(p.preco); });

      return items.map(i => ({
        ...i,
        preco_atual: mapaPrecos[i.referencia] ?? null,
      })) as GondolaItem[];
    },
    refetchInterval: 60_000,
  });

  const divergentes = gondola.filter(divergencia);
  const okCount     = gondola.filter(i => !divergencia(i) && i.preco_etiqueta != null).length;

  // ── Busca produto no ERP
  async function buscarProduto(termo: string) {
    if (termo.length < 2) { setResultados([]); return; }
    setBuscando(true);
    try {
      const q = supabase
        .from("bling_produtos_sync")
        .select("id_produto, referencia, nome, preco")
        .range(0, 19);

      // Tenta referência exata primeiro, depois nome
      const isNum = /^\d+$/.test(termo);
      if (isNum) {
        q.ilike("referencia", `%${termo}%`);
      } else {
        q.ilike("nome", `%${termo}%`);
      }

      const { data } = await q;
      setResultados((data ?? []).map(d => ({ ...d, preco_venda: Number(d.preco) })));
    } finally {
      setBuscando(false);
    }
  }

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => buscarProduto(busca), 350);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [busca]);

  // ── Adiciona produto
  const addMutation = useMutation({
    mutationFn: async (prod: ProdutoBusca) => {
      const { error } = await supabase.from("loja_gondola").upsert({
        referencia: prod.referencia,
        nome: prod.nome,
        preco_etiqueta: prod.preco_venda,
      }, { onConflict: "referencia" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gondola"] });
      setBusca("");
      setResultados([]);
      setMostrarBusca(false);
    },
  });

  // ── Remove produto
  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("loja_gondola").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gondola"] }),
  });

  // ── Atualiza preço (confirmar sem imprimir)
  const atualizarMutation = useMutation({
    mutationFn: async (item: GondolaItem) => {
      const { error } = await supabase.from("loja_gondola").update({
        preco_etiqueta: item.preco_atual,
        data_ultima_impressao: null,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gondola"] }),
  });

  // ── Imprime e salva preço
  async function handleImprimir(itens: GondolaItem[]) {
    imprimirEtiquetas(itens);
    // Atualiza preco_etiqueta e data_ultima_impressao para cada item
    for (const item of itens) {
      if (item.preco_atual == null) continue;
      await supabase.from("loja_gondola").update({
        preco_etiqueta: item.preco_atual,
        data_ultima_impressao: new Date().toISOString(),
      }).eq("id", item.id);
    }
    qc.invalidateQueries({ queryKey: ["gondola"] });
  }

  return (
    <div className="dashboard-section space-y-4 p-4 sm:p-6">
      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card border-l-4" style={{ borderLeftColor: "hsl(var(--primary))" }}>
          <div className="metric-label">Na gôndola</div>
          <div className="metric-value text-[22px]">{gondola.length}</div>
        </div>
        <div className="metric-card border-l-4" style={{ borderLeftColor: "hsl(var(--destructive))" }}>
          <div className="metric-label flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" /> Divergentes
          </div>
          <div className="metric-value text-[22px] text-destructive">{divergentes.length}</div>
        </div>
        <div className="metric-card border-l-4" style={{ borderLeftColor: "hsl(var(--success))" }}>
          <div className="metric-label flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" /> OK
          </div>
          <div className="metric-value text-[22px] text-green-600">{okCount}</div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setMostrarBusca(v => !v); setTimeout(() => buscaRef.current?.focus(), 100); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar produto
        </button>

        {divergentes.length > 0 && (
          <button
            onClick={() => handleImprimir(divergentes)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors"
          >
            <Printer className="h-4 w-4" /> Imprimir divergentes ({divergentes.length})
          </button>
        )}
      </div>

      {/* Busca de produto */}
      {mostrarBusca && (
        <div className="chart-container space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Adicionar produto à gôndola</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={buscaRef}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && resultados.length > 0) {
                  addMutation.mutate(resultados[0]);
                }
              }}
              placeholder="Referência ou nome do produto..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {buscando && <p className="text-xs text-muted-foreground">Buscando...</p>}
          {resultados.length > 0 && (
            <div className="border rounded-lg divide-y overflow-hidden">
              {resultados.map(prod => (
                <div
                  key={prod.id_produto}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                  onClick={() => addMutation.mutate(prod)}
                >
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-mono mr-2">{prod.referencia}</span>
                    <span className="text-sm font-medium">{prod.nome}</span>
                  </div>
                  <span className="text-sm font-semibold ml-3 shrink-0">{fmtPreco(prod.preco_venda)}</span>
                </div>
              ))}
            </div>
          )}
          {busca.length >= 2 && !buscando && resultados.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum produto encontrado.</p>
          )}
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
                    <tr
                      key={item.id}
                      className={`border-b border-border/50 hover:bg-muted/30 ${div ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}
                    >
                      <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{item.referencia}</td>
                      <td className="py-2.5 px-3 text-xs font-medium max-w-[200px]">
                        <span className="line-clamp-2">{item.nome}</span>
                      </td>
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
                          {/* Imprimir avulso */}
                          <button
                            title="Imprimir etiqueta"
                            onClick={() => handleImprimir([item])}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          {/* Confirmar atualização sem imprimir */}
                          {div && (
                            <button
                              title="Confirmar atualização de preço"
                              onClick={() => atualizarMutation.mutate(item)}
                              className="p-1.5 rounded hover:bg-muted text-amber-600 hover:text-amber-700 transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {/* Excluir */}
                          <button
                            title="Remover da gôndola"
                            onClick={() => removeMutation.mutate(item.id)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                          >
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





