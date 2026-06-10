import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SortState } from "@/hooks/useSortable";

interface Props {
  label: string;
  field: string;
  sort: SortState;
  onToggle: (field: string) => void;
  className?: string;
}

export function SortableHeader({ label, field, sort, onToggle, className = "" }: Props) {
  const isActive = sort.field === field;
  return (
    <th
      className={`pb-2 font-medium text-muted-foreground text-xs cursor-pointer hover:text-foreground select-none ${className}`}
      onClick={() => onToggle(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );
}
