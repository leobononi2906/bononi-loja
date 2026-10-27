-- Volta da 20261027120000: o cron deixa de mandar x-cron-chave (comando volta ao de antes) e a
-- função de conferência sai. O segredo do Vault fica sem uso. ATENÇÃO: com a Edge nova publicada,
-- voltar isto PARA o disparo automático (ela recusa o cron sem a chave) — volte a Edge junto.
do $cron$
declare v_id bigint; v_cmd text; v_novo text;
begin
  select jobid, command into v_id, v_cmd from cron.job where jobname = 'taco-venc-disparar';
  if v_id is null or v_cmd not like '%x-cron-chave%' then return; end if;
  v_novo := replace(v_cmd,
    '''x-cron-chave'', (select decrypted_secret from vault.decrypted_secrets where name = ''taco_cron_chave''),'
    || chr(10) || '         ''Authorization'',', '''Authorization'',');
  perform cron.alter_job(v_id, command := v_novo);
end
$cron$;
drop function if exists public.taco_cron_chave_confere(text);
