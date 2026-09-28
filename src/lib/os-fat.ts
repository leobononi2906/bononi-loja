// Faturamento líquido de uma linha de vw_os_res_fat.
// fat_pecas / fat_servicos vêm antes do desconto dado no fechamento da OS; fat_total é o valor
// efetivamente faturado. O desconto é rateado entre peças e serviços na proporção de cada um,
// para que pecas + servicos feche sempre com total.
export function osFatLiquido(r: Record<string, unknown>): { pecas: number; servicos: number; total: number } {
  const pecasBruto = Number(r.fat_pecas) || 0;
  const servBruto = Number(r.fat_servicos) || 0;
  const bruto = pecasBruto + servBruto;
  const total = r.fat_total == null ? bruto : Number(r.fat_total) || 0;
  const fator = bruto > 0 ? total / bruto : 0;
  return { pecas: pecasBruto * fator, servicos: servBruto * fator, total };
}
