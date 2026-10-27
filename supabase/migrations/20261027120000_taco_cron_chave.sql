-- aplicada em produção em 2026-10-27 (pós: cron manda x-cron-chave, ativo; confere aceita a certa; anon não executa)
-- ============================================================
-- 20261027120000 — chave própria para o cron do aviso de vencimento de tacógrafo
--
-- Por quê (27/10/2026): a Edge `taco-venc-disparar` aceitava qualquer chamada com a chave anon
-- (que está no bundle de todo app) — inclusive o modo de teste, que manda texto livre para
-- qualquer número pelo WhatsApp da empresa. A função nova (versionada em
-- supabase/functions/taco-venc-disparar) só aceita usuário com o módulo `loja`, a chave de
-- serviço, ou o cron com o header `x-cron-chave`. Mesmo padrão do RH (dp_rec_cron_chave, 0032)
-- e da Vitrine (vitrine_cron_chave).
--
-- Faz:
--   1. cria o segredo `taco_cron_chave` no Vault (gerado aqui, nunca no repo);
--   2. `taco_cron_chave_confere(text)` — só service_role executa (a Edge chama com ela);
--   3. o cron `taco-venc-disparar` passa a mandar também `x-cron-chave` (o resto do comando,
--      inclusive o Authorization que já existia, fica igual).
-- ORDEM: aplicar ANTES de publicar a função nova. A função antiga ignora o header novo.
-- Não apaga nada. Volta: 20261027120000_taco_cron_chave_volta.sql.
-- ============================================================

do $cron_chave$
begin
  if not exists (select 1 from vault.secrets where name = 'taco_cron_chave') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'taco_cron_chave',
                                'bononi-loja: cron taco-venc-disparar (27/10/2026)');
  end if;
end
$cron_chave$;

create or replace function public.taco_cron_chave_confere(p_chave text)
returns boolean
language sql security definer set search_path to 'public', 'vault', 'pg_temp'
as $$
  select coalesce(length(p_chave) >= 32 and exists (
    select 1 from vault.decrypted_secrets where name = 'taco_cron_chave' and decrypted_secret = p_chave
  ), false)
$$;
revoke all on function public.taco_cron_chave_confere(text) from public, anon, authenticated;
grant execute on function public.taco_cron_chave_confere(text) to service_role;

do $cron$
declare
  v_id bigint; v_cmd text; v_novo text;
begin
  select jobid, command into v_id, v_cmd from cron.job where jobname = 'taco-venc-disparar';
  if v_id is null then raise exception 'cron taco-venc-disparar não encontrado'; end if;
  if v_cmd like '%x-cron-chave%' then return; end if;  -- já aplicado
  v_novo := replace(v_cmd, '''Authorization'',',
    '''x-cron-chave'', (select decrypted_secret from vault.decrypted_secrets where name = ''taco_cron_chave''),'
    || chr(10) || '         ''Authorization'',');
  if v_novo = v_cmd then raise exception 'formato do comando do cron mudou; conferir à mão'; end if;
  perform cron.alter_job(v_id, command := v_novo);
end
$cron$;
