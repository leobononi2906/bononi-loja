import { LayoutGrid, Construction } from "lucide-react";

export default function GestaoPainel() {
  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Painel do Gestor</h2>
          <p className="text-xs text-muted-foreground">Colaboradores disponíveis por área e fila de próximos serviços</p>
        </div>
      </div>
      <div className="chart-container py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Em construção — chega na próxima etapa, junto com a lista completa de serviços (vw_dist_servicos).</p>
      </div>
    </div>
  );
}
