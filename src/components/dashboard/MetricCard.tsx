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

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <span className="metric-label">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="metric-value">{value}</div>
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
