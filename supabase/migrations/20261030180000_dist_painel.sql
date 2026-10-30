-- 2026-10-30 — Gestão de Serviços: distribuição automática (TV + gestor). Estado final.
-- Aplicada em produção como dist_aovivo_tabelas + dist_painel_tv + dist_painel_antigos.
-- Plano, regras e porquês: docs/PLANO_DISTRIBUICAO_AUTOMATICA.md.
--
-- 1) dist_aovivo_* — cópia RÁPIDA (≈3 min) das O.S. abertas, gravada SÓ pelo lander
--    bononi-replicador/land-dist-aovivo.js via dist_aovivo_carregar (troca atômica).
--    Inclui TBL_FUNCSERV_OS sem apontamento (o "me marquei no SV2") e apontamento.aberto
--    (ERP grava término '00:00' quando não fechou — nunca vazio).
-- 2) dist_config (expediente: Leo 30/10 = 08:00–12:00 e 13:12–18:00) e dist_tempo_servicop
--    (tempo padrão por tipo, override do gestor; senão mediana do histórico).
-- 3) dist_painel(p_empresa) — por área: fila em ORDEM DE CHEGADA da O.S. (decisão do Leo 30/10),
--    quem está disponível, horas na fila × horas de gente até o fim do expediente.
--    "Antigo parado" (O.S. com mais de dias_antigo dias e nenhum apontamento nesse prazo) sai da
--    fila e vai para a lista 'antigos' — em 30/10 eram ~45 serviços de O.S. de fev–set que
--    nunca foram concluídas no ERP; na TV entupiam a fila (Tapeçaria mostrava 112 h).

-- ── 1. Cópia rápida ────────────────────────────────────────────────────────────
create table if not exists public.dist_aovivo_servico (
  id_servico integer primary key,
  id_os integer not null,
  id_empresa integer not null,
  data_os date, hora_os text, prisma text, os_status text, os_atualizada date,
  id_vendedor integer, id_cliente integer, cliente text,
  placa text, modelo text, fabricante text,
  id_servicop integer, servico text, observacao text,
  ok_raw text, fl_ok boolean not null default false,
  data_inicio date, hora_inicio text, data_fim date, hora_fim text
);
create index if not exists dist_aovivo_servico_os on public.dist_aovivo_servico (id_empresa, id_os);
create index if not exists dist_aovivo_servico_placa on public.dist_aovivo_servico (placa);

create table if not exists public.dist_aovivo_marcacao (
  id_funcserv integer primary key,
  id_servico integer not null,
  id_colaborador integer not null,
  colaborador text,
  hora_prev text,
  horas_real numeric
);
create index if not exists dist_aovivo_marcacao_serv on public.dist_aovivo_marcacao (id_servico);
create index if not exists dist_aovivo_marcacao_colab on public.dist_aovivo_marcacao (id_colaborador);

create table if not exists public.dist_aovivo_apontamento (
  id_apontamento integer primary key,
  id_funcserv integer not null,
  id_servico integer not null,
  id_colaborador integer,
  data_apont date, hora_inicio text, hora_termino text,
  aberto boolean not null default false
);
create index if not exists dist_aovivo_apont_serv on public.dist_aovivo_apontamento (id_servico);
create index if not exists dist_aovivo_apont_colab on public.dist_aovivo_apontamento (id_colaborador, data_apont);

create table if not exists public.dist_aovivo_estado (
  id smallint primary key default 1 check (id = 1),
  atualizado_em timestamptz not null,
  servicos integer, marcacoes integer, apontamentos integer,
  segundos numeric
);

alter table public.dist_aovivo_servico enable row level security;
alter table public.dist_aovivo_marcacao enable row level security;
alter table public.dist_aovivo_apontamento enable row level security;
alter table public.dist_aovivo_estado enable row level security;
do $$ declare t text; begin
  foreach t in array array['dist_aovivo_servico','dist_aovivo_marcacao','dist_aovivo_apontamento','dist_aovivo_estado'] loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('drop policy if exists ler on public.%I', t);
    execute format('create policy ler on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;

create or replace function public.dist_aovivo_carregar(p_servicos jsonb, p_marcacoes jsonb, p_apontamentos jsonb, p_segundos numeric default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n1 int; n2 int; n3 int;
begin
  delete from dist_aovivo_apontamento where true;
  delete from dist_aovivo_marcacao where true;
  delete from dist_aovivo_servico where true;
  insert into dist_aovivo_servico select * from jsonb_populate_recordset(null::dist_aovivo_servico, p_servicos);
  get diagnostics n1 = row_count;
  insert into dist_aovivo_marcacao select * from jsonb_populate_recordset(null::dist_aovivo_marcacao, p_marcacoes);
  get diagnostics n2 = row_count;
  insert into dist_aovivo_apontamento select * from jsonb_populate_recordset(null::dist_aovivo_apontamento, p_apontamentos);
  get diagnostics n3 = row_count;
  insert into dist_aovivo_estado (id, atualizado_em, servicos, marcacoes, apontamentos, segundos)
  values (1, now(), n1, n2, n3, p_segundos)
  on conflict (id) do update set atualizado_em = excluded.atualizado_em, servicos = excluded.servicos,
    marcacoes = excluded.marcacoes, apontamentos = excluded.apontamentos, segundos = excluded.segundos;
  return jsonb_build_object('servicos', n1, 'marcacoes', n2, 'apontamentos', n3);
end $$;
revoke all on function public.dist_aovivo_carregar(jsonb, jsonb, jsonb, numeric) from public, anon, authenticated;
grant execute on function public.dist_aovivo_carregar(jsonb, jsonb, jsonb, numeric) to service_role;

-- ── 2. Configuração ────────────────────────────────────────────────────────────
create table if not exists public.dist_config (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.dist_config enable row level security;
revoke all on public.dist_config from anon, authenticated;
grant select, insert, update on public.dist_config to authenticated;
drop policy if exists ler on public.dist_config;
create policy ler on public.dist_config for select to authenticated using (true);
drop policy if exists gravar on public.dist_config;
create policy gravar on public.dist_config for all to authenticated using (true) with check (true);
insert into public.dist_config (chave, valor) values
  ('expediente', '[["08:00","12:00"],["13:12","18:00"]]'::jsonb),
  ('dias_antigo', '7'::jsonb)
on conflict (chave) do nothing;

create table if not exists public.dist_tempo_servicop (
  id_servicop integer primary key,
  horas numeric not null check (horas > 0),
  atualizado_em timestamptz not null default now()
);
alter table public.dist_tempo_servicop enable row level security;
revoke all on public.dist_tempo_servicop from anon, authenticated;
grant select, insert, update, delete on public.dist_tempo_servicop to authenticated;
drop policy if exists tudo on public.dist_tempo_servicop;
create policy tudo on public.dist_tempo_servicop for all to authenticated using (true) with check (true);

create or replace function public.dist_horas_restantes_hoje(p_agora time default (now() at time zone 'America/Sao_Paulo')::time)
returns numeric language sql stable set search_path = public as $$
  select coalesce(sum(greatest(0, extract(epoch from (fim - greatest(ini, p_agora))) / 3600.0)), 0)::numeric
    from (select (p->>0)::time ini, (p->>1)::time fim
            from dist_config c, jsonb_array_elements(c.valor) p where c.chave = 'expediente') x
   where fim > p_agora;
$$;
revoke all on function public.dist_horas_restantes_hoje(time) from public, anon;
grant execute on function public.dist_horas_restantes_hoje(time) to authenticated;

-- ── 3. Painel ──────────────────────────────────────────────────────────────────
create or replace function public.dist_painel(p_empresa integer default 2)
returns jsonb language sql stable set search_path = public as $$
with agora as (
  select (now() at time zone 'America/Sao_Paulo')::date hoje,
         dist_horas_restantes_hoje() h_rest,
         coalesce((select (valor #>> '{}')::int from dist_config where chave = 'dias_antigo'), 7) dias_antigo,
         coalesce((select valor->0->>0 from dist_config where chave = 'expediente'), '08:00') inicio_exp
),
tempo_hist as (   -- mediana de horas apontadas por tipo, últimos 180 dias, mínimo 5 casos
  select id_servicop, percentile_cont(0.5) within group (order by horas_apontadas)::numeric h
    from vw_fb_os_servico
   where horas_apontadas > 0 and horas_apontadas < 40 and data_os >= current_date - 180
   group by id_servicop having count(*) >= 5
),
ov as (           -- decisão do gestor (linha original, não a duplicada)
  select distinct on (id_servico_legado) id_servico_legado, id_area, status_manual
    from dist_servico where duplicado_de is null order by id_servico_legado, id desc
),
ap as (
  select a.*, (a.aberto and a.data_apont = (select hoje from agora)) aberto_hoje from dist_aovivo_apontamento a
),
serv as (
  select s.*, coalesce(ov.id_area, m.id_area) id_area, ov.status_manual,
         coalesce(t.horas, th.h, 1)::numeric h_est,
         coalesce((select sum(extract(epoch from (nullif(x.hora_termino,'00:00')::time - x.hora_inicio::time))/3600.0)
                     from ap x where x.id_servico = s.id_servico and not x.aberto), 0) h_feitas,
         exists (select 1 from ap x where x.id_servico = s.id_servico and x.aberto_hoje) em_andamento,
         exists (select 1 from ap x where x.id_servico = s.id_servico) iniciado,
         (select max(x.data_apont) from ap x where x.id_servico = s.id_servico) ult_apont,
         (select string_agg(distinct split_part(mc.colaborador,' ',1), ', ') from dist_aovivo_marcacao mc where mc.id_servico = s.id_servico) marcado_para
    from dist_aovivo_servico s
    left join ov on ov.id_servico_legado = s.id_servico
    left join dist_area_servicop m on m.id_servicop = s.id_servicop
    left join dist_tempo_servicop t on t.id_servicop = s.id_servicop
    left join tempo_hist th on th.id_servicop = s.id_servicop
   where s.id_empresa = p_empresa and s.os_status = 'A' and not s.fl_ok
),
classif as (
  select s.*,
         (not s.em_andamento
          and s.data_os < (select hoje - dias_antigo from agora)
          and coalesce(s.ult_apont, '1900-01-01') < (select hoje - dias_antigo from agora)) antigo
    from serv s
),
fila as (
  select s.*, greatest(s.h_est - s.h_feitas, 0.25) h_resta,
         row_number() over (partition by s.id_area order by s.data_os, s.hora_os, s.id_os, s.id_servico) pos
    from classif s
   where not s.em_andamento and not s.antigo and coalesce(s.status_manual,'') <> 'parado'
),
colab as (
  select ca.id_area, ca.id_colaborador,
         (select max(d.nome_colaborador) from vw_dim_colaborador d where d.id_colaborador = ca.id_colaborador) nome
    from dist_colaborador_area ca
),
colab_estado as (
  select c.*,
         exists (select 1 from ap where ap.id_colaborador = c.id_colaborador and ap.aberto_hoje) ocupado,
         (select max(nullif(ap.hora_termino,'00:00')) from ap where ap.id_colaborador = c.id_colaborador and ap.data_apont = (select hoje from agora)) ult_fim,
         (select coalesce(sum(greatest(s.h_est - s.h_feitas, 0)), 0) from serv s
           where s.em_andamento and exists (select 1 from ap where ap.id_servico = s.id_servico and ap.id_colaborador = c.id_colaborador and ap.aberto_hoje)) h_ocupado
    from colab c
)
select jsonb_build_object(
  'atualizado_em', (select atualizado_em from dist_aovivo_estado where id = 1),
  'horas_restantes_hoje', round((select h_rest from agora), 2),
  'areas', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'nome', a.nome,
      'colaboradores', (select count(*) from colab_estado ce where ce.id_area = a.id),
      'em_andamento', (select count(*) from classif s where s.id_area = a.id and s.em_andamento),
      'parados', (select count(*) from classif s where s.id_area = a.id and s.status_manual = 'parado'),
      'antigos', (select count(*) from classif s where s.id_area = a.id and s.antigo and coalesce(s.status_manual,'') <> 'parado'),
      'fila_qtd', (select count(*) from fila f where f.id_area = a.id),
      'fila_horas', round((select coalesce(sum(h_resta),0) from fila f where f.id_area = a.id), 1),
      'capacidade_horas', round(greatest(0,
          (select count(*) from colab_estado ce where ce.id_area = a.id) * (select h_rest from agora)
          - (select coalesce(sum(least(h_ocupado, (select h_rest from agora))),0) from colab_estado ce where ce.id_area = a.id)), 1),
      'fila', coalesce((select jsonb_agg(jsonb_build_object(
          'pos', f.pos, 'id_servico', f.id_servico, 'id_os', f.id_os, 'prisma', f.prisma, 'placa', f.placa,
          'modelo', f.modelo, 'cliente', f.cliente, 'servico', f.servico, 'obs', f.observacao,
          'chegada', to_char(f.data_os, 'DD/MM') || ' ' || coalesce(f.hora_os,''),
          'horas', round(f.h_resta, 1), 'iniciado', f.iniciado, 'marcado_para', f.marcado_para) order by f.pos)
        from fila f where f.id_area = a.id), '[]'::jsonb),
      'disponiveis', coalesce((select jsonb_agg(jsonb_build_object(
          'id', ce.id_colaborador, 'nome', ce.nome,
          'livre_desde', coalesce(ce.ult_fim, (select inicio_exp from agora))) order by ce.ult_fim nulls first, ce.nome)
        from colab_estado ce where ce.id_area = a.id and not ce.ocupado), '[]'::jsonb)
    ) order by a.ordem, a.nome)
    from dist_areas a where a.ativo), '[]'::jsonb),
  'sem_area', coalesce((select jsonb_agg(jsonb_build_object('id_servico', f.id_servico, 'prisma', f.prisma, 'servico', f.servico, 'obs', f.observacao,
          'chegada', to_char(f.data_os, 'DD/MM') || ' ' || coalesce(f.hora_os,'')) order by f.data_os, f.hora_os)
        from fila f where f.id_area is null), '[]'::jsonb),
  'antigos', coalesce((select jsonb_agg(jsonb_build_object('id_servico', s.id_servico, 'id_os', s.id_os, 'prisma', s.prisma, 'placa', s.placa,
          'servico', s.servico, 'obs', s.observacao, 'id_area', s.id_area, 'ult_apont', s.ult_apont,
          'chegada', to_char(s.data_os, 'DD/MM/YY')) order by s.data_os)
        from classif s where s.antigo and coalesce(s.status_manual,'') <> 'parado'), '[]'::jsonb)
);
$$;
revoke all on function public.dist_painel(integer) from public, anon;
grant execute on function public.dist_painel(integer) to authenticated;

-- Volta: drop function dist_painel(integer), dist_horas_restantes_hoje(time), dist_aovivo_carregar(jsonb,jsonb,jsonb,numeric);
--        drop table dist_tempo_servicop, dist_config, dist_aovivo_apontamento, dist_aovivo_marcacao, dist_aovivo_servico, dist_aovivo_estado;
