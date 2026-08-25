import { Calculator, Construction } from "lucide-react";

export default function GestaoPrecificacao() {
  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Precificação</h2>
          <p className="text-xs text-muted-foreground">Conferência e validação dos serviços finalizados</p>
        </div>
      </div>
      <div className="chart-container py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Em construção — depende da vw_dist_servicos pra identificar serviços finalizados (ok='S') ainda não validados.</p>
      </div>
    </div>
  );
}
