import { TapecariaTab } from "@/components/dashboard/TapecariaTab";
import { useShell } from "@/components/layout/AppShell";

export default function ServicosTapecaria() {
  const { filters } = useShell();
  return <TapecariaTab filters={filters} />;
}
