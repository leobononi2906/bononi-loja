import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Login, SemAcesso } from "@/components/Login";
import VendasVisaoGeral from "./pages/VendasVisaoGeral";
import VendasVendedores from "./pages/VendasVendedores";
import VendasSemFaturamento from "./pages/VendasSemFaturamento";
import ServicosResumo from "./pages/ServicosResumo";
import ServicosPatio from "./pages/ServicosPatio";
import ServicosTapecaria from "./pages/ServicosTapecaria";
import ConfigColaboradores from "./pages/ConfigColaboradores";
import GondolaLoja from "./pages/GondolaLoja";
import TacografoLista from "./pages/TacografoLista";
import TacografoOrdem from "./pages/TacografoOrdem";
import TacografoVencimentos from "./pages/TacografoVencimentos";
import GestaoDistribuicao from "./pages/GestaoDistribuicao";
import GestaoPainel from "./pages/GestaoPainel";
import GestaoPrecificacao from "./pages/GestaoPrecificacao";
import GestaoAreas from "./pages/GestaoAreas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// O gate fica ANTES do BrowserRouter/AppShell: a AppSidebar consulta o banco ao montar,
// então nada dela pode renderizar sem sessão e sem o módulo "loja".
function Gate() {
  const { session, carregando, temAcesso } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return <Login />;
  if (!temAcesso) return <SemAcesso />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/vendas" replace />} />
          <Route path="/vendas" element={<VendasVisaoGeral />} />
          <Route path="/vendas/vendedores" element={<VendasVendedores />} />
          <Route path="/vendas/sem-faturamento" element={<VendasSemFaturamento />} />
          <Route path="/servicos" element={<ServicosResumo />} />
          <Route path="/servicos/patio" element={<ServicosPatio />} />
          <Route path="/servicos/tapecaria" element={<ServicosTapecaria />} />
          <Route path="/servicos/config-colaboradores" element={<ConfigColaboradores />} />
          <Route path="/gondola" element={<GondolaLoja />} />
          <Route path="/tacografo" element={<TacografoLista />} />
          <Route path="/tacografo/nova" element={<TacografoOrdem />} />
          <Route path="/tacografo/:id" element={<TacografoOrdem />} />
          <Route path="/tacografo-vencimentos" element={<TacografoVencimentos />} />
          <Route path="/gestao-servicos/distribuicao" element={<GestaoDistribuicao />} />
          <Route path="/gestao-servicos/painel" element={<GestaoPainel />} />
          <Route path="/gestao-servicos/precificacao" element={<GestaoPrecificacao />} />
          <Route path="/gestao-servicos/areas" element={<GestaoAreas />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider onSair={() => queryClient.clear()}>
        <Gate />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
