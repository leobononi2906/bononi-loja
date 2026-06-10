import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  details?: string;
}

export function ErrorAlert({ message, details }: ErrorAlertProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-destructive">{message}</p>
        {details && <p className="text-xs text-muted-foreground mt-1">{details}</p>}
      </div>
    </div>
  );
}
