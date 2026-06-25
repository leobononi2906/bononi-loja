import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/data/mockData";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  hidden?: boolean;
}

export function MetricCard({ label, value, change, changeLabel, icon, hidden }: MetricCardProps) {
  if (hidden) return null;

  // Ajusta tamanho do texto baseado no comprimento do valor
  const len = value.length;
  const valueSize =
    len <= 8  ? "text-[26px]" :
    len <= 12 ? "text-[20px]" :
    len <= 16 ? "text-[16px]" :
                "text-[13px]";

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <span className="metric-label leading-tight">{label}</span>
        {icon && <span className="text-muted-foreground shrink-0 ml-1">{icon}</span>}
      </div>
      <div
        className={`font-bold tracking-tight text-foreground leading-none truncate font-mono ${valueSize}`}
        style={{ letterSpacing: "-0.5px" }}
        title={value}
      >
        {value}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${change >= 0 ? "metric-change-up" : "metric-change-down"}`}>
          {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{formatPercent(Math.abs(change))}</span>
          {changeLabel && <span className="text-muted-foreground font-normal text-xs ml-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
