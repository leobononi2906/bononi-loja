import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

