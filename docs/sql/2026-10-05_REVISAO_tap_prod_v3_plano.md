# Revisão — vw_tap_prod_v3 lenta (rascunho de 05/10/2026, NÃO aplicado)

Arquivos: `2026-10-05_tap_prod_v3_plano.sql` (migration) e `2026-10-05_tap_prod_v3_plano_VOLTA.sql` (volta).

## 1. Por que agora
As abas **Tapeçaria**, **Pátio** e **Gerencial** da Loja não recebem a produção da Tapeçaria. A
`fetch-comercial` cai em `canceling statement due to statement timeout` aos 60 s (teto do
`service_role`) já no primeiro pedaço de 1 dia, tanto para outubro (1 a 5) quanto para setembro
(testado em 05/10). O RH deixou a Tapeçaria desligada na Análise pelo mesmo motivo.

## 2. Causa e pré-voo (produção, só leitura)
- A view é nativa do Supabase, **não** espelho do Firebird: nenhuma migration nem o replicador a
  recriam. As 5 fontes são tabelas pequenas (17 mil a 53 mil linhas).
- O EXPLAIN mostra as deduplicações `id IN (SELECT min(id) … GROUP BY …)` estimadas em 1 ou 200
  linhas. Com isso o planejador escolhe nested loop, que repete seq scan e varredura de índice por
  linha de fora. Reescrever com `DISTINCT ON` não basta (testado: continua acima de 30 s).
- Com `enable_nestloop = off`, a view **inteira** sai em ~0,36 s no servidor. O filtro de data não
  desce na view de qualquer jeito (`data_faturamento` é CASE, `data_apontamento` é `min()`).
- Segurança atual: a view roda como o dono (`postgres`) e passa pela RLS de `os_data_fat_lock`.
  Não há view dependente da `vw_tap_prod_v3`.

## 3. ⚠ O que muda no app que já está no ar
Nada na forma: as mesmas 20 colunas, nomes, ordem e tipos. Muda o tempo de resposta.
Ensaio em produção (`--ensaio`, desfeito):

| Prova | Antes | Com a migration |
|---|---|---|
| Setembro por `data_faturamento` | 77 s · 1.935 linhas | 1.935 linhas · 109.141,19 produto · 242.615,15 serviço (idênticos) |
| 1 dia (15/09), tempo no servidor | — | 444 ms com as configurações padrão |
| Linhas totais | 19.924 | 19.924 |
| Leitura como `anon` (teto 3 s) | — | 1.812 linhas (setembro por apontamento) |

Ressalva: a `fetch-comercial` ainda faz 30 chamadas de 1 dia em sequência, e cada uma recalcula a
view inteira (~0,4 s), o que dá ~15 s por mês. Funciona; para ficar rápido de verdade, aumentar o
`HEAVY_VIEW_CHUNK_DAYS` da v3 depois (publicação da Edge Function, à parte).

## 4. O que é escrito nos dados
Nada. Cria uma função e troca o texto de uma view.

## 5. O que não volta sozinho
Nada. A volta (`…_VOLTA.sql`) restaura o texto original da view e remove a função. Foi ensaiada
na mesma transação: view original de volta, função removida.

## 6. Não apaga dado (auditado termo por termo)
`grep -inE 'drop|delete|truncate|cascade'` na migration: só a linha 28, um **comentário** que
aponta o arquivo de volta. Nenhum comando destrutivo. O `drop function` existe só no arquivo de
volta.

## 7. Ordem
1. Migration (não depende de front nem de Edge Function).
2. Opcional: corrigir os dois bugs abaixo, cada um no seu app.
3. RH: trocar `comTapecaria: false` por `true` **junto** com a correção do item b.

Bugs encontrados no caminho, que esta migration **não** resolve:
- a. **Gerencial** (`GerencialTab.tsx:64`) chama a v3 sem `columns`, então a função usa a lista
  padrão dela, que pede `id_servico_os`, coluna que a v3 não tem. Resultado: erro 500 imediato, e
  a MO da Tapeçaria entra como 0 no total sem aviso na tela. Conserto: passar `columns` na chamada
  ou tirar `id_servico_os` do `VIEW_SELECT_COLUMNS` da função.
- b. **RH** `src/lib/sgaAnalise.js` `tapecaria()`: faz `(await res.json()).filter(...)`, mas a
  função devolve `{ data, count }`. Ao religar, quebra com "filter is not a function".
  Conserto: `(await res.json()).data`.
- c. **Pátio** (`PatioTab.tsx:87`) só grava o erro da v3 em log, sem alerta na tela.

## 8. Comando (depois do "pode aplicar")
```
python "C:/Users/ecommerce06/Desktop/Aplicações Bononi/.claude/skills/consultar-banco/scripts/sql.py" prod "C:/Aplicações da bononi/bononi-loja/docs/sql/2026-10-05_tap_prod_v3_plano.sql" --escrever --producao
```

## 9. Recomendação
Aplicar. A regra de negócio não muda (o mesmo texto, copiado), o resultado bate em linhas e
valores, e a volta está ensaiada. A única condição é a sua confirmação, porque a migration altera
uma `vw_*`.
