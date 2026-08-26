import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, PackageOpen, Users } from "lucide-react";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, STATUS_INFO, STATUS_ATIVOS,
  type DistArea, type DistServicoRow, type DistColabAreaRow,
} from "@/lib/dist";

export function PainelGestorTab() {
  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["dist_areas"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_areas").select("*").eq("ativo", true).order("ordem", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistArea[];
    },
  });

  const { data: servicos, isLoading: loadingServicos, error: erroServicos } = useQuery({
    queryKey: ["vw_dist_servicos"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_dist_servicos").select("*").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistServicoRow[];
    },
  });

  const { data: colabArea, isLoading: loadingColabArea, error: erroColabArea } = useQuery({
    queryKey: ["vw_dist_colab_area"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_dist_colab_area").select("*").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistColabAreaRow[];
    },
  });

  const isLoading = loadingAreas || loadingServicos || loadingColabArea;
  const areasList = Array.isArray(areas) ? areas : [];
  const servicosList = Array.isArray(servicos) ? servicos : [];
  const colabAreaList = Array.isArray(colabArea) ? colabArea : [];

  const filaPorArea = useMemo(() => {
    const grupos = new Map<string, DistServicoRow[]>();
    servicosList.forEach((s) => {
      if (!STATUS_ATIVOS.includes(s.status)) return;
      const chave = s.area ?? "Sem área";
      const arr = grupos.get(chave) ?? [];
      arr.push(s);
      grupos.set(chave, arr);
    });
    return grupos;
  }, [servicosList]);

  const colabsPorArea = useMemo(() => {
    const grupos = new Map<string, DistColabAreaRow[]>();
    colabAreaList.forEach((c) => {
      const arr = grupos.get(c.area) ?? [];
      arr.push(c);
      grupos.set(c.area, arr);
    });
    return grupos;
  }, [colabAreaList]);

  if (isLoading) return <TableSkeleton />;
  if (erroServicos) return <ErrorAlert message="Erro ao carregar a fila por área" details={(erroServicos as Error).message} />;
  if (erroColabArea) return <ErrorAlert message="Erro ao carregar colaboradores por área" details={(erroColabArea as Error).message} />;

  const nomesArea = [...areasList.map((a) => a.nome), "Sem área"];

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Painel do Gestor</h2>
          <p className="text-xs text-muted-foreground">Fila de serviços e colaboradores por área</p>
        </div>
      </div>

      {/* Fila por área */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Fila por área</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nomesArea.map((nomeArea) => {
            const itens = filaPorArea.get(nomeArea) ?? [];
            return (
              <div key={nomeArea} className="chart-container">
                <h4 className="text-sm font-semibold font-display mb-2 flex items-center gap-2">
                  {nomeArea}
                  <span className="b-badge b-badge-info">{itens.length}</span>
                </h4>
                {itens.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">Fila vazia.</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {itens.map((s) => {
                      const info = STATUS_INFO[s.status];
                      return (
                        <div key={s.id_dist ?? -s.id_servico} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/40 text-xs gap-2">
                          <div className="min-w-0">
                            <span className="font-mono">OS {s.id_os}</span>
                            <span className="text-muted-foreground ml-2 truncate">{s.servico}</span>
                            {s.colaboradores && <span className="text-muted-foreground/70 ml-1">— {s.colaboradores}</span>}
                          </div>
                          <span className={`b-badge ${info.badgeClass} shrink-0`}>{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Colaboradores por área */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Colaboradores por área
        </h3>
        {colabAreaList.length === 0 ? (
          <div className="chart-container py-10 text-center">
            <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum colaborador vinculado a área ainda — configure em Config. Áreas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...colabsPorArea.entries()].map(([nomeArea, colabs]) => (
              <div key={nomeArea} className="chart-container">
                <h4 className="text-sm font-semibold font-display mb-2 flex items-center gap-2">
                  {nomeArea}
                  <span className="b-badge b-badge-info">{colabs.length}</span>
                </h4>
                <div className="space-y-0.5">
                  {colabs.map((c) => (
                    <div key={c.id_colaborador} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/40">
                      <span className="text-xs font-medium">{c.colaborador}</span>
                      <span className={`b-badge ${c.situacao === "A" ? "b-badge-ok" : "b-badge-muted"}`}>{c.situacao === "A" ? "Ativo" : c.situacao}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
