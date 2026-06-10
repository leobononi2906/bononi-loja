import { AlertTriangle } from "lucide-react";

interface Alert {
  label: string;
  count: number;
  tone?: "critico" | "baixo" | "ruptura" | "info";
}

interface Props {
  alerts: Alert[];
  title?: string;
}

export function AlertStrip({ alerts, title = "Alertas operacionais" }: Props) {
  const visible = alerts.filter((a) => a.count > 0);
  if (visible.length === 0) return null;

  return (
    <div className="chart-container py-3 px-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          {title}
        </div>
        <div className="flex flex-wrap gap-2">
          {visible.map((a) => (
            <span key={a.label} className={`b-badge b-badge-${a.tone ?? "critico"}`}>
              <span className="mr-1.5 font-mono">{a.count}</span>
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
