/* =========================================================
   Dados: Supabase (login, leitura, ações e tempo real)
   ========================================================= */
const sb = supabase.createClient(HYPE_CONFIG.url, HYPE_CONFIG.key, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
const UI_KEY = 'hype-pop-ui';
const uiLoad = () => { try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (e) { return {}; } };
const uiSave = () => { try { const {view, tab, f, mode, verComo} = S.ui; localStorage.setItem(UI_KEY, JSON.stringify({view, tab, f, mode, verComo})); } catch (e) {} };
const save = uiSave;
/* Liga/desliga de recursos: 'todos', 'dev' (só o acesso DEV vê) ou 'desligado' */
const recurso = k => { const r = (typeof S !== 'undefined' && S?.recursos || []).find(x => x.chave === k); const e = r ? r.estado : 'todos'; return e === 'todos' || (e === 'dev' && !!S?.ui?.dev); };
/* Hora usada pelas telas: a real, ou a hora simulada do acesso DEV */
const horaAgora = () => (typeof S !== 'undefined' && S?.ui?.devHora != null) ? S.ui.devHora : nowMin();

const PHOTO_URL = {};
const hmT = t => t ? t.slice(0, 5) : '';

/* Erro do Supabase vira mensagem legível */
function check(res){ if (res.error) throw new Error(res.error.message || 'Erro ao falar com o servidor.'); return res.data; }

async function carregar(){
  setToday();
  const d30 = isoMinus(30);
  let rows;
  try { rows = await buscar(d30); salvarCache(rows); OFFLINE = null; }
  catch (e) {
    // Sem internet: abre com a última cópia do dia guardada no aparelho (as marcações vão para a fila)
    const c = lerCache();
    if (semRede(e) && c && c.dia === TODAY_ISO) { rows = c.rows; OFFLINE = c.em; } else throw e;
  }
  const [pe, po, le, ro, ja, it, ex, ei, co, oc, oa, lb, lf, rg, hi, au, df, re, pv, rs, dfis, nfv, cfg, ags, defs, repo, steq, f7, f14, priv, rec, dacc, cpad, creg] = rows;
  montar(pe, po, le, ro, ja, it, ex, ei, co, oc, oa, lb, lf, rg, hi, au, df, re, pv, rs, dfis, nfv, cfg, ags, defs, repo, steq, f7, f14, priv, rec, dacc, cpad, creg);
  await assinarFotos().catch(() => {});
}

/* Cópia local do último carregamento do dia (para abrir sem internet) */
let OFFLINE = null;
const CACHE_KEY = 'hype-pop-cache';
function salvarCache(rows){ if (typeof SIM !== 'undefined' && SIM) return; try { const j = JSON.stringify({dia:TODAY_ISO, em:nowMin(), rows}); if (j.length < 2.5e6) localStorage.setItem(CACHE_KEY, j); } catch (e) {} }
function lerCache(){ try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; } }
const limparCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} };

/* Carregamento em duas partes, com o mesmo resultado:
   - operação (checklists, ocorrências, notas...): relida sempre;
   - configuração (pessoas, POPs, rotinas, regras, textos...): muda pouco, é relida no máximo a cada 60 s,
     ou na hora depois de uma ação do próprio usuário (run → forcarFixos);
   - histórico de 4 semanas: só muda de um dia para o outro, é relido uma vez por dia;
   - geração do dia (garantir_dia): uma vez por dia por sessão.
   Nas atualizações em tempo real isso corta mais da metade das consultas. */
let FIXOS = null, HIST_DIA = null, DIA_GARANTIDO = null;
const FIXOS_TTL = 60e3;
const forcarFixos = () => { FIXOS = null; HIST_DIA = null; DIA_GARANTIDO = null; };
async function buscar(d30){
  const real = typeof SIM === 'undefined' || !SIM;
  if (!real || DIA_GARANTIDO !== TODAY_ISO) { await sb.rpc('garantir_dia'); if (real) DIA_GARANTIDO = TODAY_ISO; }
  // [é configuração?, consulta] — a ordem é a mesma que montar() espera
  const L = [
    [1, () => sb.from('pessoas').select('*').order('ordem')],
    [1, () => sb.from('pops').select('*').eq('ativo', true).order('ordem')],
    [0, () => sb.from('pop_leituras').select('pop_id,pessoa_id,versao')],
    [1, () => sb.from('rotinas').select('*').order('ordem')],
    [1, () => sb.from('rotina_janelas').select('*').order('inicio')],
    [1, () => sb.from('rotina_itens').select('*').order('ordem')],
    [0, () => sb.from('execucoes').select('*').eq('data', TODAY_ISO)],
    [0, () => sb.from('execucao_itens').select('*, execucoes!inner(data)').eq('execucoes.data', TODAY_ISO)],
    [0, () => sb.from('cobrancas').select('*, execucoes!inner(data)').eq('execucoes.data', TODAY_ISO).order('em')],
    [0, () => sb.from('ocorrencias').select('*').gte('data', d30).order('em', {ascending:false})],
    [0, () => sb.from('ocorrencia_acoes').select('*').gte('em', d30).order('em')],
    [1, () => sb.from('lembretes').select('*').order('hora')],
    [0, () => sb.from('lembretes_feitos').select('*').eq('data', TODAY_ISO)],
    [1, () => sb.from('regras').select('*').maybeSingle()],
    ['dia', () => sb.rpc('historico', {dias:28})],
    [0, () => sb.from('ausencias').select('*').gte('fim', isoMinus(1)).order('inicio')],
    [0, () => sb.from('dias_fechados').select('*').gte('data', isoMinus(7)).order('data')],
    [1, () => sb.from('rodizio_escala').select('*')],
    [1, () => sb.from('pop_versoes').select('pop_id,versao,publicado_em,por,conteudo').order('versao', {ascending:false})],
    [0, () => sb.from('resumos').select('*').order('data', {ascending:false}).limit(7)],
    [0, () => sb.from('documentos_fiscais').select('*').gte('competencia', compMenos(7)).order('enviado_em', {ascending:false})],
    [0, () => sb.from('nf_valores').select('*').gte('periodo', compMenos(4))],
    [1, () => sb.from('config_textos').select('*')],
    [0, () => sb.from('rotina_agendamentos').select('*').gte('data', isoMinus(1)).order('data').order('inicio')],
    [1, () => sb.from('definicoes').select('*').order('ordem')],
    [0, () => sb.from('reposicao').select('*').or(`resolvido_em.is.null,resolvido_em.gte.${isoMinus(2)}`).order('em', {ascending:false})],
    [1, () => sb.rpc('status_equipe')],
    [0, () => sb.rpc('falhas_itens', {dias:7})],
    [0, () => sb.rpc('falhas_itens', {dias:14})],
    [0, () => sb.from('privacidade_aceite').select('*')],
    [1, () => sb.from('recursos').select('*').order('chave')],
    [0, () => sb.from('dev_acessos').select('*').order('em', {ascending:false}).limit(40)],
    [1, () => sb.from('cultura_padroes').select('*').order('ordem')],
    [0, () => sb.from('cultura_registros').select('*').gte('data', d30).order('em', {ascending:false})],
  ];
  const fixosOk = real && FIXOS && FIXOS.dia === TODAY_ISO && Date.now() - FIXOS.em < FIXOS_TTL;
  const histOk = real && HIST_DIA && HIST_DIA.dia === TODAY_ISO;
  const res = await Promise.all(L.map(([tipo, consulta], k) =>
    tipo === 1 && fixosOk ? {data:FIXOS.rows[k], error:null} : tipo === 'dia' && histOk ? {data:HIST_DIA.data, error:null} : consulta()));
  const q = res.map(check);
  if (real) {
    if (!fixosOk) FIXOS = {em:Date.now(), dia:TODAY_ISO, rows:Object.fromEntries(L.map(([tipo], k) => [k, tipo === 1 ? q[k] : undefined]))};
    const kh = L.findIndex(([tipo]) => tipo === 'dia'); if (!histOk) HIST_DIA = {dia:TODAY_ISO, data:q[kh]};
  }
  return q;
}

function montar(pe, po, le, ro, ja, it, ex, ei, co, oc, oa, lb, lf, rg, hi, au, df, re, pv, rs, dfis, nfv, cfg, ags, defs, repo, steq, f7, f14, priv, rec, dacc, cpad, creg){
  aplicarTextos(cfg);

  const people = pe.map(p => ({id:p.id, name:p.nome, role:p.papel, label:p.rotulo, turno:p.turno || '', folga:p.folga, socio:p.socio, hue:p.cor, email:p.email || '', active:p.ativo, ordem:p.ordem, fullName:p.nome_completo || p.nome, parceiro:p.parceiro}));
  const pops = po.map(p => {
    const reads = {}; le.filter(r => r.pop_id === p.id).forEach(r => reads[r.pessoa_id] = Math.max(reads[r.pessoa_id] || 0, r.versao));
    return {id:p.id, title:p.titulo, area:p.area, roles:p.cargos, who:p.quem, owner:p.dono, freq:p.frequencia, objective:p.objetivo, materials:p.materiais || [], steps:p.passos || [],
      quality:p.qualidade || [], errors:p.erros || [], tables:p.tabelas, guide:p.guia, version:p.versao, updated:p.atualizado, approved:p.aprovado_por || 'Sócios', reads, versions:pv.filter(v => v.pop_id === p.id)};
  });
  const janelas = Object.fromEntries(ja.map(j => [j.id, j]));
  const allTpls = ro.map(r => ({id:r.id, title:r.titulo, pop:r.pop_id, kind:r.tipo, verify:r.conferir, days:r.dias, each:r.cada || r.cada_papel || null, also:r.junto, every2:r.quinzenal,
    active:r.ativo, rodizio:r.rodizio, ignoraFolga:r.ignora_folga,
    items:it.filter(i => i.rotina_id === r.id && i.ativo).map(i => ({id:i.id, t:i.texto, photo:i.foto, crit:i.critico, ordem:i.ordem, ref:i.foto_ref || null, how:i.instrucao || null})),
    allItems:it.filter(i => i.rotina_id === r.id),
    escala:Object.fromEntries(re.filter(e => e.rotina_id === r.id).map(e => [e.dow, e.pessoa_id])),
    slots:ja.filter(j => j.rotina_id === r.id && j.ativo !== false).map(j => [hmT(j.inicio), hmT(j.prazo), j.responsavel, j.id, j.dias])}));
  const tpls = allTpls.filter(t => t.active || ex.some(x => x.rotina_id === t.id));
  const inst = ex.filter(x => tpls.some(t => t.id === x.rotina_id)).map(x => {
    const checks = {};
    ei.filter(c => c.execucao_id === x.id).forEach(c => checks[c.item_id] = {at:minOf(c.marcado_em), ok:c.ok, photo:c.foto_path || undefined, note:c.obs || ''});
    return {id:x.id, avulso:!!x.agendamento_id, key:`${x.rotina_id}.${x.pessoa_id}.${x.janela_id ? hmT(janelas[x.janela_id]?.inicio).replace(':', '') : 'AVULSO'}`, tpl:x.rotina_id, who:x.pessoa_id,
      start:minOf(x.inicio), due:minOf(x.prazo), checks, doneAt:minOf(x.concluida_em),
      ver:x.conferido_em ? {at:minOf(x.conferido_em), res:x.conferido_resultado, note:x.conferido_obs || '', by:x.conferido_por} : null,
      sorteada:x.sorteada, notas:x.notas || '',
      redo:x.refazer_em ? {at:minOf(x.refazer_em), note:x.refazer_obs || ''} : null};
  });
  const occ = oc.map(o => ({id:'OC-' + o.id, num:o.id, data:o.data, at:minOf(o.em), day:o.data !== TODAY_ISO ? dLabelISO(o.data) : null, who:o.pessoa_id, src:o.origem, inst:o.execucao_id,
    title:o.titulo, desc:o.descricao || '', status:o.status, pop:o.pop_id, resp:o.responsavel_id, prazo:o.prazo, foto:o.foto_path, by:o.criado_por,
    actions:oa.filter(a => a.ocorrencia_id === o.id).map(a => { const iso = recife(Date.parse(a.em)).toISOString().slice(0, 10); return {at:minOf(a.em), day:iso !== TODAY_ISO ? dLabelISO(iso) : null, by:a.por, t:a.texto}; })}));
  const reminders = lb.filter(l => l.dias.includes(TODAY_WD) || !l.ativo).map(l => ({id:l.id, at:hmT(l.hora), text:l.texto, on:l.ativo, days:l.dias}));
  const allReminders = lb.map(l => ({id:l.id, at:hmT(l.hora), text:l.texto, on:l.ativo, days:l.dias}));
  const remDone = Object.fromEntries(lf.map(l => [l.lembrete_id, minOf(l.em)]));
  const nudges = co.map(c => ({inst:c.execucao_id, at:minOf(c.em), by:c.por}));
  const r = rg || {};
  const rules = {antes:r.antes ?? 10, escalar:r.escalar ?? 30, conferir:r.conferir ?? 30, meta:Number(r.meta ?? .9), rondas:r.rondas_surpresa ?? true, resumo:hmT(r.resumo) || '21:00', inicio:r.inicio_operacao || null, inicioHora:hmT(r.inicio_hora) || '',
    nfDia:r.nf_dia_limite ?? 5, nfDas:r.nf_exigir_das ?? true, nfCnpj:r.nf_cnpj || '', nfRazao:r.nf_razao || '', nfDesc:r.nf_descricao || '', amostra:Number(r.conferir_amostra ?? 1), escalarSocios:!!r.escalar_socios, aprendizadoAte:r.aprendizado_ate || null};

  const ui = S?.ui || {...{view:'painel', tab:'hoje', f:{}, mode:'app'}, ...uiLoad(), open:null, pop:null, nao:null, more:false, selP:null};
  S = {people, pops, tpls, allTpls, inst, occ, occ30:{}, reminders, remDone, nudges, rules, hist:hi || [], histDays:null, ui,
    allReminders, docs:dfis, nfValores:nfv, agenda:ags, defs:defs || [], repo:repo || [], statusEq:Object.fromEntries((steq || []).map(x => [x.pessoa_id, x])), falhas7:f7 || [], falhas14:f14 || [], priv:priv || [], recursos:rec || [], devAcessos:dacc || [], culturaPadroes:cpad || [], culturaReg:creg || [], cfgTextos:cfg, ausencias:au, fechados:df, resumos:rs, fechadoHoje:df.find(x => x.data === TODAY_ISO) || null};
  S.ui.now = horaAgora();
}

/* Fotos: links temporários para exibir */
async function assinarFotos(){
  const refs = S.tpls.flatMap(t => t.items.map(x => x.ref));
  const paths = [...S.inst.flatMap(i => Object.values(i.checks).map(c => c.photo)), ...S.occ.map(o => o.foto), ...refs].filter(Boolean).filter(p => !PHOTO_URL[p] && p !== 'treino');
  if (!paths.length) return;
  const {data} = await sb.storage.from('fotos').createSignedUrls(paths, 6 * 3600);
  (data || []).forEach(d => { if (d.signedUrl) PHOTO_URL[d.path] = d.signedUrl; });
}

/* Reduz a foto da câmera antes de enviar (lado maior 1280 px, JPEG) */
async function comprimir(file){
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', .8));
  } catch (e) { return file; }
}
async function enviarFoto(instId, itemId, file){
  const blob = await comprimir(file), path = `${TODAY_ISO}/${instId}/${itemId}-${Date.now()}.jpg`;
  check(await sb.storage.from('fotos').upload(path, blob, {contentType:'image/jpeg'}));
  return path;
}

/* Tempo real: qualquer mudança da equipe recarrega a tela */
let RT_TIMER, RT_CH;
function tempoReal(){
  if (RT_CH) return;
  RT_CH = sb.channel('hype-pop');
  ['execucoes','execucao_itens','cobrancas','ocorrencias','ocorrencia_acoes','lembretes_feitos','pop_leituras','ausencias','dias_fechados','documentos_fiscais','nf_valores'].forEach(t =>
    RT_CH.on('postgres_changes', {event:'*', schema:'public', table:t}, () => { clearTimeout(RT_TIMER); RT_TIMER = setTimeout(recarregar, 700); }));
  RT_CH.subscribe();
}

/* ---------- Fila para quando a internet cair ---------- */
const FILA_KEY = 'hype-pop-fila';
const fila = () => { try { return JSON.parse(localStorage.getItem(FILA_KEY)) || []; } catch (e) { return []; } };
const filaSalvar = f => { try { localStorage.setItem(FILA_KEY, JSON.stringify(f)); } catch (e) {} };
const semRede = e => !navigator.onLine || /fetch|network|Failed to fetch|Load failed/i.test(String(e?.message || e));
function enfileirar(fn, args){ const f = fila(); f.push({fn, args, em:Date.now()}); filaSalvar(f); }
let ENVIANDO = false;
async function esvaziarFila(){
  if (ENVIANDO || !navigator.onLine) return 0;
  const f = fila(); if (!f.length) return 0;
  ENVIANDO = true; let ok = 0;
  try {
    while (f.length) {
      const x = f[0];
      const {error} = await sb.rpc(x.fn, x.args);
      if (error && semRede(error)) break;
      f.shift(); filaSalvar(f); ok++;
      if (error) registrarErro('Fila: ' + error.message, x.fn);
    }
  } finally { ENVIANDO = false; }
  return ok;
}

/* ---------- Notificações no celular ---------- */
const b64u = s => { const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const pushSuportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const ehIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
async function swRegistro(){ return navigator.serviceWorker.register('sw.js'); }
async function pushAtivo(){
  if (!pushSuportado() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration(); return !!(reg && await reg.pushManager.getSubscription());
}
async function ativarPush(){
  if (!pushSuportado()) throw new Error(ehIOS() && !instalado() ? 'No iPhone, primeiro adicione o app à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.' : 'Este navegador não recebe notificações.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('As notificações foram bloqueadas. Libere nas configurações do navegador.');
  const reg = await swRegistro(); await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64u(HYPE_CONFIG.vapid)});
  const j = sub.toJSON();
  check(await sb.rpc('inscrever_push', {endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, ua:navigator.userAgent.slice(0, 200)}));
}

/* ---------- Registro de erros ---------- */
function registrarErro(msg, ctx){ try { sb.rpc('registrar_erro', {msg:String(msg).slice(0, 2000), ctx:String(ctx || location.hash || '').slice(0, 2000)}); } catch (e) {} }
window.addEventListener('error', e => registrarErro(e.message, `${e.filename}:${e.lineno}`));
window.addEventListener('unhandledrejection', e => registrarErro(e.reason?.message || e.reason, 'promise'));

/* ---------- Notas fiscais do Salão-Parceiro ---------- */
function compMenos(n){ const d = recife(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1)).toISOString().slice(0, 10); }
const compLabel = c => `${MESES[+c.slice(5, 7) - 1]} de ${c.slice(0, 4)}`;
const compCurta = c => `${c.slice(5, 7)}/${c.slice(0, 4)}`;
const compAtual = () => compMenos(1);                      // a nota de um mês é emitida no mês seguinte
function prazoNF(comp){ const [y, m] = comp.split('-').map(Number), last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return new Date(Date.UTC(y, m, Math.min(S.rules.nfDia, last))).toISOString().slice(0, 10); }
function prazoDAS(comp){ const [y, m] = comp.split('-').map(Number); return new Date(Date.UTC(y, m, 20)).toISOString().slice(0, 10); }
/* Notas quinzenais: período começa no dia 1 (vence dia 16) ou no dia 16 (vence dia 1º do mês seguinte) */
const isoUTC = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
const perAtual = () => { const d = recife(), y = d.getUTCFullYear(), m = d.getUTCMonth(); return d.getUTCDate() >= 16 ? isoUTC(y, m, 1) : isoUTC(y, m - 1, 16); };
const perAnterior = p => { const [y, m, d] = p.split('-').map(Number); return d === 16 ? isoUTC(y, m - 1, 1) : isoUTC(y, m - 2, 16); };
const perFim = p => { const [y, m, d] = p.split('-').map(Number); return d === 1 ? isoUTC(y, m - 1, 15) : isoUTC(y, m, 0); };
const perPrazo = p => { const [y, m, d] = p.split('-').map(Number); return d === 1 ? isoUTC(y, m - 1, 16) : isoUTC(y, m, 1); };
const perLabel = p => `${dLabelISO(p)} a ${dLabelISO(perFim(p))}`;
const periodos = n => { const out = [perAtual()]; while (out.length < n) out.push(perAnterior(out[out.length - 1])); return out; };
const valorNF = (pid, p) => S.nfValores.find(v => v.pessoa_id === pid && v.periodo === p)?.valor;
const docDe = (pid, comp, tipo) => S.docs.find(d => d.pessoa_id === pid && d.competencia === comp && d.tipo === tipo);   // o mais recente
async function enviarDocumento(comp, tipo, numero, valor, file){
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'pdf';
  const path = `${S.ui.user}/${comp.slice(0, 7)}-${tipo}-${Date.now()}.${ext}`;
  check(await sb.storage.from('documentos').upload(path, file, {contentType:file.type || undefined}));
  check(await sb.rpc('enviar_documento', {competencia:comp, tipo, numero:numero || null, valor:valor === '' || valor == null ? null : +valor, arquivo:path}));
}
async function abrirDocumento(path){
  const w = window.open('', '_blank');
  const {data, error} = await sb.storage.from('documentos').createSignedUrl(path, 600);
  if (error) { w?.close(); throw new Error(error.message); }
  if (w) w.location = data.signedUrl; else location.href = data.signedUrl;
}

/* ---------- Textos da casa vindos do banco (cultura, escala, áreas) ---------- */
function aplicarTextos(cfg){
  const v = k => cfg.find(c => c.chave === k)?.valor;
  const c = v('cultura'), e = v('escala'), a = v('areas');
  if (c) Object.assign(CULTURA, c);
  if (e) Object.assign(ESCALA, e);
  if (a) { Object.keys(AREAS).forEach(k => delete AREAS[k]); Object.assign(AREAS, a); }
}
