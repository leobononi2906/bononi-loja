import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// taco-venc-disparar — envio PAUSADO de aviso de vencimento de tacógrafo.
// Fila ÚNICA: prioridade 1 = a vencer (~15d), prioridade 2 = backlog vencido.
// UM teto diário pras duas. 1 envio por tick. Mensagem editável em config.
// Marcadores no template: {{cliente}} {{placas}} {{veiculos}}
// Modos: {} cron | {dry_run:true} | {forcar:true} | {telefone_norm} | {test_to,test_message} | {preview:true}
// ==========================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UMBLER_TOKEN = Deno.env.get("UMBLER_TOKEN");
const UMBLER_ORG   = Deno.env.get("UMBLER_ORG_ID") || "";
const UMBLER_BASE  = "https://app-utalk.umbler.com/api";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-cron-chave" };

// ── Quem pode chamar (27/10/2026) ──────────────────────────────────────────────────────────
// Antes: qualquer um com a chave anon (bundle) disparava — inclusive {test_to,test_message}, que
// manda TEXTO LIVRE para QUALQUER número a partir do WhatsApp da empresa, e {telefone_norm}/{forcar},
// que pulam o teto diário e a janela de horário. A função não estava em repo nenhum (versionada aqui
// a partir do download de 27/10). Agora:
//   - cron: header x-cron-chave conferido por taco_cron_chave_confere (chave no Vault);
//   - chave de serviço: tudo;
//   - usuário com módulo `loja` (app_metadata): preview, dry_run e {telefone_norm} (botão "Enviar agora");
//   - test_to e forcar: só admin global ou admin do módulo `loja`.
type Acesso = { ok: boolean; status: number; erro?: string; admin?: boolean; cron?: boolean };
async function quemChama(req: Request): Promise<Acesso> {
  const chaveCron = req.headers.get("x-cron-chave") ?? "";
  if (chaveCron) {
    const { data } = await sb.rpc("taco_cron_chave_confere", { p_chave: chaveCron });
    return data === true ? { ok: true, status: 200, cron: true, admin: true } : { ok: false, status: 401, erro: "chave do cron inválida" };
  }
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 401, erro: "faça login" };
  if (token === SERVICE_KEY) return { ok: true, status: 200, admin: true };
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "", Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!r || !r.ok) return { ok: false, status: 401, erro: "faça login" };
  const m = ((await r.json().catch(() => null)) as { app_metadata?: Record<string, unknown> } | null)?.app_metadata ?? {};
  const lista = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  const adminLoja = m.admin === true || lista(m.admin_modulos).includes("loja");
  if (adminLoja || lista(m.modulos).includes("loja")) return { ok: true, status: 200, admin: adminLoja };
  return { ok: false, status: 403, erro: "sem acesso ao módulo loja" };
}
const json = (o:any,s=200)=> new Response(JSON.stringify(o),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const e164 = (v:string)=>{ let d=String(v||"").replace(/\D/g,""); if(!d) return ""; if(!d.startsWith("55")) d="55"+d; return "+"+d; };

function agoraSP(){ const n=new Date(); return new Date(n.getTime() - 3*3600*1000); }
function hojeSP(){ return agoraSP().toISOString().slice(0,10); }
function fmtData(d:string){ try{ const [y,m,dd]=String(d).slice(0,10).split("-"); return `${dd}/${m}/${y}`; }catch(_){ return String(d); } }
function primeiroNome(n:string){ return String(n||"").trim().split(/\s+/)[0] || "tudo bem"; }

async function cfg(){
  const { data } = await sb.from("taco_venc_config").select("chave,valor");
  const c:Record<string,string> = {}; (data||[]).forEach((r:any)=> c[r.chave]=r.valor); return c;
}

let ORG="";
async function orgId(){
  if(UMBLER_ORG) return UMBLER_ORG; if(ORG) return ORG;
  const r = await fetch(`${UMBLER_BASE}/v1/members/me/`,{headers:{Authorization:`Bearer ${UMBLER_TOKEN}`}});
  const d = await r.json().catch(()=>({})); const o = (d?.Organizations||d?.organizations||[])[0];
  ORG = o?.Id||o?.id||""; return ORG;
}

async function enviarUmbler(to:string, from:string, message:string){
  const org = await orgId(); if(!org) throw new Error("nao localizei a organizacao na Umbler");
  const fd = new FormData();
  fd.append("OrganizationId", org); fd.append("ToPhone", to); fd.append("FromPhone", from); fd.append("Message", message);
  const resp = await fetch(`${UMBLER_BASE}/v1/messages/simplified/`,{ method:"POST", headers:{ Authorization:`Bearer ${UMBLER_TOKEN}` }, body: fd });
  const out = await resp.text();
  if(!resp.ok) throw new Error(out.slice(0,200) || ("erro "+resp.status));
  let id=""; try{ const j=JSON.parse(out); id=j?.Id||j?.id||""; }catch(_){}
  return id;
}

// {{placas}} -> "do veículo de placa ABC1D23" | "dos veículos de placas ABC1D23, DEF4G56"
function descrevePlacas(veiculos:any[]): string {
  const v = Array.isArray(veiculos)? veiculos : [];
  const rots = v.map((it:any)=> it.placa ? String(it.placa) : (it.veiculo? String(it.veiculo) : "")).filter(Boolean);
  if(rots.length===0) return "do seu veículo";
  if(rots.length===1) return `do veículo de placa ${rots[0]}`;
  return `dos veículos de placas ${rots.join(", ")}`;
}
// {{veiculos}} -> versão detalhada com data (fluxo a vencer, se quiser usar)
function descreveVeiculos(veiculos:any[]): string {
  const v = Array.isArray(veiculos)? veiculos : [];
  if(v.length===1){ const it=v[0]; const nome=it.veiculo?` (${it.veiculo})`:""; const placa=it.placa?`de placa ${it.placa} `:""; return `do veículo ${placa}${nome} — vencimento ${fmtData(it.data_vencimento)}`.replace(/\s+/g," ").trim(); }
  const linhas = v.map((it:any)=>{ const nome=it.veiculo?` (${it.veiculo})`:""; const placa=it.placa||"(sem placa)"; return `• ${placa}${nome} — ${fmtData(it.data_vencimento)}`; });
  return `dos seus veículos:\n${linhas.join("\n")}`;
}
function montarMensagem(template:string, cliente:string, veiculos:any[]): string {
  return String(template||"")
    .replace(/\{\{\s*cliente\s*\}\}/g, primeiroNome(cliente))
    .replace(/\{\{\s*placas\s*\}\}/g, descrevePlacas(veiculos))
    .replace(/\{\{\s*veiculos\s*\}\}/g, descreveVeiculos(veiculos));
}

Deno.serve(async (req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  const acesso = await quemChama(req);
  if(!acesso.ok) return json({error: acesso.erro}, acesso.status);
  try{
    const body = await req.json().catch(()=>({}));
    if((body.test_to || body.forcar) && !acesso.admin) return json({error:"teste e envio forçado são só do admin da loja"},403);
    const c = await cfg();
    const from = e164(c.from_phone||"");

    // preview do texto (sem enviar) com dados de exemplo ou de 1 alvo real
    if(body.preview){
      const exBk = { cliente_nome: body.cliente||"CARLOS EDUARDO SILVA", veiculos: body.veiculos || [{placa:"ABC1D23",veiculo:"SCANIA R450",data_vencimento:"2024-08-10"},{placa:"DEF4G56",veiculo:"VOLVO FH",data_vencimento:"2024-08-22"}] };
      return json({ok:true, preview:true,
        backlog: montarMensagem(c.template_backlog||"", exBk.cliente_nome, exBk.veiculos),
        a_vencer: montarMensagem(c.template||"", exBk.cliente_nome, exBk.veiculos) });
    }

    if(body.test_to){
      if(!UMBLER_TOKEN) return json({error:"UMBLER_TOKEN nao configurado"},500);
      if(!from) return json({error:"from_phone (numero novo) nao configurado em taco_venc_config"},400);
      const id = await enviarUmbler(e164(body.test_to), from, body.test_message || "Teste de disparo — Bononi tacógrafo.");
      return json({ok:true, enviado:true, umbler_msg_id:id});
    }

    const incluirBacklog = String(c.incluir_backlog||"false")==="true";
    const { data: filaAll, error } = await sb.from("vw_taco_venc_fila").select("*");
    if(error) return json({error:error.message},500);
    const fila = (filaAll||[]).filter((r:any)=> incluirBacklog || r.origem_fila==="a_vencer");

    if(body.dry_run){
      const aV = fila.filter((r:any)=>r.origem_fila==="a_vencer").length;
      const bk = fila.filter((r:any)=>r.origem_fila==="backlog").length;
      return json({ok:true, dry_run:true, incluir_backlog:incluirBacklog, na_fila:fila.length, a_vencer:aV, backlog:bk, exemplo: fila.slice(0,3)});
    }

    const ativo = String(c.ativo||"false")==="true";
    if(!ativo && !body.forcar && !body.telefone_norm)
      return json({ok:true, pulado:"desligado (taco_venc_config.ativo=false)", na_fila: fila.length});

    if(!UMBLER_TOKEN) return json({error:"UMBLER_TOKEN nao configurado"},500);
    if(!from) return json({error:"from_phone (numero novo) nao configurado em taco_venc_config"},400);

    const tetoDia = parseInt(c.envios_por_dia||"10",10);
    const { count: enviadosHoje } = await sb.from("taco_venc_envio").select("id",{count:"exact",head:true})
      .eq("status","enviado").gte("enviado_em", hojeSP()+"T00:00:00-03:00");
    if(!body.telefone_norm && (enviadosHoje||0) >= tetoDia)
      return json({ok:true, pulado:"teto diario atingido", enviados_hoje:enviadosHoje, teto:tetoDia});

    if(!body.forcar && !body.telefone_norm){
      const h = agoraSP().getHours();
      const hi = parseInt(c.janela_hora_ini||"9",10), hf = parseInt(c.janela_hora_fim||"18",10);
      if(h < hi || h >= hf) return json({ok:true, pulado:`fora da janela (${hi}h-${hf}h)`, hora_sp:h});
      const intMin = parseInt(c.intervalo_min_minutos||"30",10);
      const { data: ult } = await sb.from("taco_venc_envio").select("enviado_em").eq("status","enviado").order("enviado_em",{ascending:false}).limit(1);
      const ultEm = ult?.[0]?.enviado_em ? new Date(ult[0].enviado_em).getTime() : 0;
      if(ultEm && (Date.now()-ultEm) < intMin*60*1000) return json({ok:true, pulado:`intervalo minimo (${intMin}min)`});
    }

    let alvo = fila[0];
    if(body.telefone_norm) alvo = fila.find((x:any)=> x.telefone_norm===body.telefone_norm) || null;
    if(!alvo) return json({ok:true, pulado:"nada elegivel na fila", na_fila: fila.length});

    const tpl = alvo.origem_fila==="backlog" ? (c.template_backlog || c.template) : (c.template || "");
    const msg = montarMensagem(tpl, alvo.cliente_nome, alvo.veiculos);
    const to  = e164(alvo.telefone_norm);

    let umblerId="", status="enviado", erro:string|null=null;
    try{ umblerId = await enviarUmbler(to, from, msg); }
    catch(e){ status="erro"; erro = String(e).slice(0,300); }

    const { data: ins } = await sb.from("taco_venc_envio").insert({
      telefone_norm: alvo.telefone_norm, cliente_nome: alvo.cliente_nome,
      itens: alvo.veiculos, qtd_veiculos: Array.isArray(alvo.veiculos)? alvo.veiculos.length : 1,
      status, mensagem: msg, origem_fila: alvo.origem_fila,
      enviado_em: status==="enviado" ? new Date().toISOString() : null,
      umbler_msg_id: umblerId||null, erro, criado_por: body.telefone_norm? "manual" : "cron"
    }).select("id").single();

    // Erro de envio (número inválido/inexistente na Umbler): tira esse telefone da fila
    // de disparo (marca is_celular=false) em vez de travar tentando o mesmo alvo pra
    // sempre — próximo tick já segue pro próximo elegível. O mesmo flag joga o cliente
    // pra aba "Atualizar telefone" (vw_taco_venc_sem_telefone já filtra por isso), onde
    // alguém corrige o número; ao salvar um novo telefone válido ele volta pra fila normal.
    if(status==="erro"){
      await sb.from("taco_venc_item").update({ is_celular:false })
        .eq("telefone_norm", alvo.telefone_norm).eq("ativo", true);
    }

    return json({ ok: status==="enviado", status, origem_fila: alvo.origem_fila, cliente: alvo.cliente_nome, to,
                  qtd_veiculos: Array.isArray(alvo.veiculos)? alvo.veiculos.length:1, envio_id: ins?.id, erro });
  }catch(e){ return json({error:String(e)},500); }
});
