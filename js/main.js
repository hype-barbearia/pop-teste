/* =========================================================
   Entrada, renderização, eventos e ações
   ========================================================= */
const me = () => person(S.ui.user);
const socioView = () => { const p = me(); return p && (p.role === 'socio' || (p.socio && S.ui.mode === 'socio')); };
const typing = () => document.activeElement?.matches?.('input:not([type=checkbox]),textarea,select');
let PENDING = false, TICK, TELA = '';

function topRight(){
  const p = me(); if (!p) return '';
  return `${p.socio ? `<button class="btn sm" data-act="modo">${S.ui.mode === 'socio' ? 'Meu app de barbeiro' : 'Painel dos sócios'}</button>` : ''}
    ${seletorTema()}<span class="who">${av(p)}<b>${esc(p.name)}</b></span><button class="linkbtn" data-act="sair">Sair</button>`;
}

function render(){
  PENDING = false;
  // Guarda o que a pessoa tinha aberto para a tela não "pular" quando atualiza sozinha
  const abertos = [...document.querySelectorAll('details[open][id]')].map(d => d.id);
  const rolagem = ['.modal-in', '#tl-wrap'].map(q => [q, $(q)?.scrollTop || 0, $(q)?.scrollLeft || 0]);
  $('#top-right').innerHTML = topRight();
  const app = $('#app'), p = me();
  barraDev();
  if (S.ui.dev && S.ui.user === S.ui.dev) { app.className = 'admin devhome'; app.innerHTML = renderDev(); $('#modal').innerHTML = ''; document.body.classList.remove('phone-ui'); return; }
  if (socioView()) { app.className = 'admin'; app.innerHTML = renderSocio(); }
  else { app.className = 'phoneview'; app.innerHTML = renderPhone(p); }
  app.classList.toggle('ro', socioView() && !canEdit());
  const i = S.ui.open && inst(S.ui.open), sp = socioView();
  $('#modal').innerHTML = sp && i ? modal(`${tpl(i.tpl).title}`, `${tipoNome(tpl(i.tpl))} · ${tpl(i.tpl).pop}`, instBody(i, 'view'))
    : sp && S.ui.pop && S.ui.view !== 'pops' && pop(S.ui.pop) ? modal(`${pop(S.ui.pop).id} · ${esc(pop(S.ui.pop).title)}`, 'Procedimento', popBody(pop(S.ui.pop), p)) : '';
  abertos.forEach(id => { const d = document.getElementById(id); if (d) d.open = true; });
  rolagem.forEach(([q, t, l]) => { const el = $(q); if (el) { el.scrollTop = t; el.scrollLeft = l; } });
  document.body.classList.toggle('phone-ui', !!S?.ui?.user && !socioView());
  // Rótulos das colunas para as tabelas empilhadas no celular
  document.querySelectorAll('table.t').forEach(t => { const hs = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
    if (hs.length) t.querySelectorAll('tbody tr, tfoot tr').forEach(tr => [...tr.children].forEach((td, k) => { if (hs[k] && !td.dataset.label) td.dataset.label = hs[k]; })); });
  // Animação de entrada só quando muda de tela (não a cada atualização automática)
  const k = S?.ui ? [S.ui.user, S.ui.view, S.ui.tab, S.ui.open, S.ui.pop, S.ui.rotEdit, S.ui.lote].join('|') : '';
  if (k !== TELA) { TELA = k; const a = document.getElementById('app'); if (a) { a.classList.remove('entra'); void a.offsetWidth; a.classList.add('entra'); setTimeout(() => a.classList.remove('entra'), 600); } }
}
const algoAberto = () => typing() || !!document.querySelector('details[open] form, .modal');
const modal = (title, eb, body) => `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-t" data-act="close"><div class="modal-in" data-stop="1">
  <div class="row between nowrap"><div><p class="eyebrow">${eb}</p><h2 id="m-t">${title}</h2></div><button class="btn sm" data-act="close">Fechar</button></div>${body}</div></div>`;

/* ---------- Telas de acesso ---------- */
function tela(html){ $('#top-right').innerHTML = ''; $('#modal').innerHTML = ''; const a = $('#app'); a.className = 'gate'; a.innerHTML = `<div class="gate-in">${html}</div>`; }
/* O e-mail do login fica guardado no aparelho: no iPhone o app pode fechar enquanto a pessoa copia o código */
const guardarEmail = e => { try { localStorage.setItem('hype-email', e); } catch (x) {} };
const lerEmail = () => { try { return localStorage.getItem('hype-email') || sessionStorage.getItem('hype-email') || ''; } catch (x) { return ''; } };
function telaLogin(enviado){
  // Pediu o código há menos de 1 hora: volta direto para a tela do código (o app pode ter fechado no meio)
  try { if (enviado === undefined && lerEmail() && Date.now() - +(localStorage.getItem('hype-otp-em') || 0) < 3600e3) enviado = lerEmail(); } catch (x) {}
  tela(enviado ? `<h1>Confira seu e-mail</h1><p class="muted">Enviamos um código de acesso para <b>${esc(enviado)}</b>. Volte aqui e digite o código.</p>
      <form class="stack gap8" data-form="otp"><label for="otp">Código do e-mail</label><input class="inp code-in" id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="12" placeholder="código do e-mail">
      ${lerEmail() ? '' : `<label for="otp-email">Seu e-mail</label><input class="inp" id="otp-email" type="email" autocomplete="email" placeholder="nome@hypebarbearia.com">`}
      <button class="btn primary big">Entrar</button></form><p class="small muted">Também dá para tocar no link do e-mail, se abrir neste aparelho.</p><button class="linkbtn" data-act="voltarLogin">Usar outro e-mail ou pedir outro código</button>`
    : `<p class="eyebrow">Hype POP</p><h1>Entrar</h1><p class="muted">Use o seu e-mail @hypebarbearia.com. Vamos mandar um código de acesso, sem senha.</p>
      <form class="stack gap8" data-form="login"><label for="email">Seu e-mail</label><input class="inp" id="email" type="email" inputmode="email" autocapitalize="off" autocorrect="off" autocomplete="email" required placeholder="nome@hypebarbearia.com" value="${esc(lerEmail())}">
      <button class="btn primary big">Receber o código de acesso</button></form>`);
}
function telaSemCadastro(email){
  tela(`<h1>E-mail sem cadastro</h1><p class="muted"><b>${esc(email)}</b> ainda não está na equipe da Hype POP. Peça a um sócio para cadastrar este e-mail na tela Equipe.</p><button class="btn" data-act="sair">Sair e usar outro e-mail</button>`);
}
function telaErro(e){ tela(`<h1>Não foi possível carregar</h1><p class="muted">${esc(e.message)}</p><button class="btn primary" data-act="tentar">Tentar de novo</button>`); }

let STARTING = false;
async function iniciar(){
  if (STARTING) return; STARTING = true;
  try { await iniciar_(); } finally { STARTING = false; }
}
async function iniciar_(){
  const {data:{session}} = await sb.auth.getSession();
  if (!session) { telaLogin(); return; }
  try { localStorage.removeItem('hype-otp-em'); } catch (x) {}
  tela('<p class="muted">Carregando a operação de hoje…</p>');
  try { await carregar(); } catch (e) { telaErro(e); return; }
  const email = (session.user.email || '').toLowerCase(), p = S.people.find(x => x.email.toLowerCase() === email);
  if (!p) { telaSemCadastro(session.user.email); return; }
  S.ui.user = p.id;
  if (p.role === 'dev') { S.ui.dev = p.id; const alvo = S.ui.verComo && person(S.ui.verComo); if (alvo && alvo.id !== p.id) S.ui.user = alvo.id; }
  if (p.role === 'dev' && S.ui.user === p.id) { S.ui.push = await pushAtivo().catch(() => false); render(); tempoReal(); clearInterval(TICK); TICK = setInterval(tick, 30000); return; }
  if (me().role === 'gerente' && !['agora','equipe','ocorrencias','pops','perfil'].includes(S.ui.tab)) S.ui.tab = 'agora';
  if (me().role !== 'gerente' && !['hoje','pops','hist','perfil'].includes(S.ui.tab)) S.ui.tab = 'hoje';
  S.ui.push = await pushAtivo().catch(() => false);
  esvaziarFila().then(n => { if (n) recarregar(true); });
  render(); tempoReal();
  clearInterval(TICK); TICK = setInterval(tick, 30000);
  if ('serviceWorker' in navigator) swRegistro().catch(() => {});
}
async function recarregar(force){
  if (!S?.ui?.user) return;
  try { await carregar(); } catch (e) { toast(esc(e.message)); return; }
  if (!force && algoAberto()) { PENDING = true; return; }
  render();
}
function tick(){
  const d = recife().toISOString().slice(0, 10);
  if (d !== TODAY_ISO) { recarregar(); return; }
  S.ui.now = horaAgora();
  if (algoAberto()) { PENDING = true; return; }
  render();
}
document.addEventListener('focusout', () => setTimeout(() => { if (PENDING && !algoAberto()) render(); }, 50));
document.addEventListener('toggle', () => setTimeout(() => { if (PENDING && !algoAberto()) render(); }, 50), true);
window.addEventListener('online', async () => { const n = await esvaziarFila(); if (n) { toast(`${n} ${n === 1 ? 'marcação enviada' : 'marcações enviadas'}.`); recarregar(true); } });
sb.auth.onAuthStateChange(ev => setTimeout(() => {
  if (ev === 'SIGNED_IN' && !S?.ui?.user && !STARTING) iniciar();
  if (ev === 'SIGNED_OUT') { S = null; clearInterval(TICK); telaLogin(); }
}, 0));

/* ---------- Ações ---------- */
async function run(fn, msg){
  if (devVendo() && !SIM) { toast('Modo DEV: só visualização. Nada foi gravado.'); return; }
  try { await fn(); forcarFixos(); await recarregar(true); if (msg) toast(msg); }
  catch (e) { if (e.silencioso) return; toast(esc(e.message)); if (!semRede(e)) registrarErro(e.message, 'acao'); }
}
const rpc = (f, a) => sb.rpc(f, a).then(check);
/* Marcar item e concluir funcionam sem internet: vão para a fila e saem quando a conexão voltar */
async function rpcOffline(f, a, aplicarLocal){
  try { return await rpc(f, a); }
  catch (e) {
    if (!semRede(e)) throw e;
    enfileirar(f, a); aplicarLocal(); render();
    toast('Sem internet. A marcação fica guardada e é enviada sozinha quando a conexão voltar.');
    throw Object.assign(new Error('Guardado para enviar depois.'), {silencioso:true});
  }
}
let FOTO = null;

const A = {
  sair(){ limparCache(); sb.auth.signOut(); },
  tentar(){ iniciar(); },
  voltarLogin(){ try { localStorage.removeItem('hype-otp-em'); } catch (x) {} telaLogin(null); },
  modo(){ S.ui.mode = S.ui.mode === 'socio' ? 'app' : 'socio'; S.ui.open = null; S.ui.pop = null; uiSave(); render(); window.scrollTo(0, 0); },
  nav(d){ S.ui.view = d.v; S.ui.more = false; S.ui.pop = null; S.ui.open = null; uiSave(); render(); window.scrollTo(0, 0); },
  more(){ S.ui.more = !S.ui.more; render(); },
  tab(d){ S.ui.tab = d.v; S.ui.open = null; S.ui.pop = null; S.ui.nao = null; uiSave(); render(); window.scrollTo(0, 0); },
  f(d){ S.ui.f[d.k] = d.v; uiSave(); render(); },
  selP(d){ S.ui.selP = d.v || null; render(); },
  open(d){ S.ui.open = d.id; S.ui.nao = null; render(); if (!socioView()) window.scrollTo(0, 0); },
  close(){ S.ui.open = null; S.ui.nao = null; if (!socioView() || S.ui.view !== 'pops') S.ui.pop = null; render(); },
  pop(d){ S.ui.open = null; S.ui.pop = d.id; render(); if (!socioView()) window.scrollTo(0, 0); },
  popClose(){ S.ui.pop = null; render(); },
  check(d){
    vibra();
    const it = tpl(inst(d.id).tpl).items.find(x => x.id === d.it);
    if (it.photo) { FOTO = {id:d.id, it:d.it}; const c = $('#cam'); c.value = ''; c.click(); return; }
    if (d.id === 'TREINO') { treinoMarcar(d.it); return; }
    run(() => rpcOffline('marcar_item', {e:d.id, item:d.it, feito:true}, () => { inst(d.id).checks[d.it] = {at:NOW(), ok:true}; }));
  },
  uncheck(d){ if (d.id === 'TREINO') { delete TREINO.checks[d.it]; render(); return; } run(() => rpc('desmarcar_item', {e:d.id, item:d.it})); },
  nao(d){ S.ui.nao = d.id + '|' + d.it; render(); setTimeout(() => $('#nao-note')?.focus(), 0); },
  naoCancel(){ S.ui.nao = null; render(); },
  naoSave(d){
    const note = $('#nao-note').value.trim();
    if (!note) { toast('Escreva o motivo. A gerente precisa dele para tratar a ocorrência.'); $('#nao-note').focus(); return; }
    const repor = $('#nao-rep')?.checked; S.ui.nao = null;
    if (d.id === 'TREINO') { treinoMarcar(d.it, {ok:false, note}); return; }
    run(async () => { await rpc('marcar_item', {e:d.id, item:d.it, feito:false, nota:note});
      if (repor) await rpc('pedir_reposicao', {item:note, obs:tpl(inst(d.id).tpl).title, execucao:d.id}); },
      repor ? 'Registrado e pedido de reposição enviado à gerência.' : 'Registrado. A ocorrência foi aberta para a gerente.');
  },
  finish(d){
    vibra();
    if (d.id === 'TREINO') { TREINO = null; S.ui.open = null; try { localStorage.setItem('hype-treino-' + S.ui.user, '1'); } catch (e) {} render(); window.scrollTo(0, 0);
      toast('Treino concluído! Nos checklists de verdade é igual.'); return; }
    const i = inst(d.id), late = NOW() > i.due; S.ui.open = null;
    run(() => rpcOffline('concluir', {e:d.id}, () => { inst(d.id).doneAt = NOW(); }), late ? `Checklist concluído com ${mins(NOW() - i.due)} de atraso.` : `Checklist concluído no prazo.${tpl(i.tpl).verify ? ' A gerente vai conferir.' : ''}`);
  },
  verify(d){
    const note = ($('#ver-note')?.value || '').trim();
    if (d.v !== 'ok' && !note) { toast('Escreva a observação para a pessoa saber o que ajustar.'); $('#ver-note')?.focus(); return; }
    const who = first(person(inst(d.id).who)); S.ui.open = null;
    run(() => rpc('conferir', {e:d.id, resultado:d.v, nota:note || null}), d.v === 'refazer' ? `Pedido de refazer enviado para ${who}.` : d.v === 'ok' ? 'Conferido.' : 'Conferido com ressalva.');
  },
  nudge(d){ const who = first(person(inst(d.id).who)); run(() => rpc('cobrar', {e:d.id}), `Lembrete registrado. ${who} vê o aviso no app.`); },
  remDone(d){ run(() => rpc('lembrete_feito', {l:+d.id}), 'Lembrete marcado como feito.'); },
  read(d){ const p = pop(d.id); run(() => rpc('assinar_pop', {pop:d.id}), `Termo de ciência do ${p.id} assinado.`); },
  bump(d){ const p = pop(d.id); run(async () => check(await sb.from('pops').update({versao:p.version + 1, atualizado:dLabelISO(TODAY_ISO) + '/' + TODAY_ISO.slice(0, 4)}).eq('id', p.id)),
    `${p.id} agora está na versão ${p.version + 1}. A equipe precisa assinar de novo.`); },
  occAct(d, solve){
    const o = S.occ.find(x => x.id === d.id), el = $('#oa-' + d.id), t = (el?.value || '').trim();
    if (!t && !solve) { toast('Escreva a ação tomada.'); el?.focus(); return; }
    run(() => rpc('registrar_acao', {oc:o.num, texto:t, resolver:!!solve}), solve ? `${o.id} resolvida.` : 'Ação registrada.');
  },
  occSolve(d){ A.occAct(d, true); },
  async push(){ try { await ativarPush(); S.ui.push = true; render(); toast('Notificações ativadas neste aparelho.'); } catch (e) { toast(esc(e.message)); } },
  popEditar(d){ S.ui.popEdit = d.v || null; render(); window.scrollTo(0, 0); },
  ausDel(d){ run(() => rpc('remover_ausencia', {a:+d.id}), 'Ausência removida.'); },
  defOk(d){ const r = ($('#def-r-' + d.id)?.value || '').trim();
    run(async () => check(await sb.from('definicoes').update({resolvido_em:new Date().toISOString(), resolvido_por:S.ui.user, resposta:r || null}).eq('id', +d.id)), 'Ponto marcado como definido.'); },
  defReabrir(d){ run(async () => check(await sb.from('definicoes').update({resolvido_em:null, resolvido_por:null}).eq('id', +d.id)), 'Ponto voltou para a lista.'); },
  defIr(d){ S.ui.view = d.v; S.ui.more = false; uiSave(); render(); window.scrollTo(0, 0); },
  reabrir(d){ run(() => rpc('reabrir_dia', {d:d.v}), 'Dia reaberto.'); },
  desligar(d){ const p = person(d.id); if (!confirmar(el => el, `desligar-${d.id}`, `Desligar ${p.name}? A pessoa perde o acesso e sai das próximas rotinas. Toque de novo para confirmar.`)) return;
    S.ui.selP = null; upd('pessoas', {ativo:false}, 'id', d.id, `${p.name} foi desligado(a) da equipe.`); },
  reativar(d){ upd('pessoas', {ativo:true}, 'id', d.id, `${person(d.id).name} voltou para a equipe.`); },
  rotAtivo(d){ upd('rotinas', {ativo:d.v === '1'}, 'id', d.id, d.v === '1' ? 'Checklist reativado. Vale a partir de amanhã.' : 'Checklist pausado. Vale a partir de amanhã.'); },
  itemDel(d){ if (!confirmar(null, `item-${d.id}`, 'Toque de novo em Retirar para confirmar.')) return; upd('rotina_itens', {ativo:false}, 'id', d.id, 'Item retirado. Vale para os próximos checklists.'); },
  async csv(d){
    const mes = d.v, [y, m] = mes.split('-').map(Number), fim = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    toast('Preparando a planilha…');
    const {data, error} = await sb.from('execucoes').select('data,rotina_id,pessoa_id,inicio,prazo,concluida_em,conferido_resultado').gte('data', mes + '-01').lte('data', fim).order('data');
    if (error) { toast(esc(error.message)); return; }
    const tit = id => S.allTpls.find(t => t.id === id)?.title || id, hr = iso => iso ? hm(minOf(iso)) : '';
    const linhasCsv = [['Data','Checklist','Pessoa','Início','Prazo','Concluído','Situação','Conferência'], ...data.map(x => [x.data, tit(x.rotina_id), person(x.pessoa_id)?.name || x.pessoa_id, hr(x.inicio), hr(x.prazo), hr(x.concluida_em),
      !x.concluida_em ? 'Não feito' : x.concluida_em <= x.prazo ? 'No prazo' : 'Com atraso', x.conferido_resultado || ''])];
    const txt = '\ufeff' + linhasCsv.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type:'text/csv;charset=utf-8'})); a.download = `hype-pop-${mes}.csv`; a.click();
  },
  verDoc(d){ abrirDocumento(d.v).catch(e => toast(esc(e.message))); },
  revDoc(d){ const campo = $('#rev-' + d.id) || $('#rev-nota'), nota = (campo?.value || '').trim();
    if (d.v === 'recusada' && !nota) { toast('Escreva o motivo da recusa: o barbeiro recebe esse texto.'); campo?.focus(); return; }
    S.ui.nfRec = null;
    run(() => rpc('revisar_documento', {doc:+d.id, resultado:d.v, nota:nota || null}), d.v === 'aceita' ? 'Documento aceito.' : 'Documento recusado. O barbeiro foi avisado.'); },
  copiarDesc(){ const t = $('#nf-desc')?.innerText || ''; navigator.clipboard?.writeText(t).then(() => toast('Descrição copiada.'), () => toast('Selecione o texto e copie.')); },
  copiar(){ const t = $('#wa-text')?.innerText || ''; navigator.clipboard?.writeText(t).then(() => toast('Resumo copiado. Cole no WhatsApp dos sócios.'), () => toast('Não deu para copiar. Selecione o texto e copie.')); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if ((el.classList.contains('modal') || el.classList.contains('sheet')) && e.target.closest('[data-stop]')) return;
  const f = A[el.dataset.act]; if (f) { e.preventDefault(); f(el.dataset, el); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S?.ui && (S.ui.open || S.ui.more || (S.ui.pop && S.ui.view !== 'pops'))) { S.ui.more = false; A.close(); } });

/* Confirmação em dois toques, sem janela do navegador */
const CONF = {};
function confirmar(_, chave, msg){ if (CONF[chave] && Date.now() - CONF[chave] < 5000) { delete CONF[chave]; return true; } CONF[chave] = Date.now(); toast(msg); return false; }
const upd = (table, values, col, val, msg) => run(async () => check(await sb.from(table).update(values).eq(col, val)), msg);
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'cam') {
    const file = el.files?.[0], f = FOTO; FOTO = null; if (!file || !f) return;
    if (f.id === 'TREINO') { PHOTO_URL.treino = URL.createObjectURL(file); treinoMarcar(f.it, {photo:'treino'}); return; }
    toast('Enviando a foto…');
    run(async () => { const path = await enviarFoto(f.id, f.it, file); await rpc('marcar_item', {e:f.id, item:f.it, feito:true, foto:path}); }, 'Foto registrada com a hora.');
    return;
  }
  if (el.dataset.f) { S.ui.f[el.dataset.f] = el.value; uiSave(); render(); return; }
  if (el.dataset.nfvalor) { const [pid, per] = el.dataset.nfvalor.split('|'), raw = el.value.replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.');
    if (raw === '') return; if (isNaN(+raw) || +raw < 0) { toast('Valor inválido. Use o formato 1.250,00.'); return; }
    run(() => rpc('definir_valor_nf', {pessoa:pid, periodo:per, valor:+raw}), `Valor informado. ${first(person(pid))} recebe o aviso para emitir.`); return; }
  if (el.dataset.rodizio) { const [tid, dow] = el.dataset.rodizio.split('|');
    run(async () => { if (el.value) check(await sb.from('rodizio_escala').upsert({rotina_id:tid, dow:+dow, pessoa_id:el.value})); else check(await sb.from('rodizio_escala').delete().eq('rotina_id', tid).eq('dow', +dow)); }, 'Escala atualizada. Vale a partir de amanhã.'); return; }
  if (el.dataset.item) { const v = el.value.trim(); if (v) upd('rotina_itens', {texto:v}, 'id', el.dataset.item, 'Item atualizado.'); return; }
  if (el.dataset.ocresp || el.dataset.ocprazo) { const n = +(el.dataset.ocresp || el.dataset.ocprazo), o = S.occ.find(x => x.num === n);
    const resp = el.dataset.ocresp ? el.value : (o.resp || ''), prazo = el.dataset.ocprazo ? (el.value || null) : (o.prazo || null);
    run(() => rpc('ajustar_ocorrencia', {oc:n, responsavel:resp, prazo}), 'Ocorrência atualizada.'); return; }
  if (el.dataset.rule) {
    const k = el.dataset.rule, kind = el.dataset.kind; let v = kind === 'bool' ? el.checked : kind === 'str' ? el.value : +el.value;
    if (kind === 'pct') v = clamp(v, 50, 100) / 100; if (kind === 'amostra') v = clamp(v, 10, 100) / 100; if (kind !== 'bool' && kind !== 'str' && isNaN(v)) return;
    const col = {antes:'antes', escalar:'escalar', conferir:'conferir', meta:'meta', rondas:'rondas_surpresa', resumo:'resumo', inicio:'inicio_operacao',
      inicioHora:'inicio_hora', aprendizadoAte:'aprendizado_ate', amostra:'conferir_amostra', escalarSocios:'escalar_socios', nfDia:'nf_dia_limite', nfDas:'nf_exigir_das', nfCnpj:'nf_cnpj', nfRazao:'nf_razao', nfDesc:'nf_descricao'}[k];
    if (kind === 'str' && !v) v = k === 'nfDesc' ? '' : null;
    upd('regras', {[col]:v}, 'id', 1, 'Regra atualizada.'); return;
  }
  if (el.dataset.rem) { upd('lembretes', {ativo:el.checked}, 'id', +el.dataset.rem, el.checked ? 'Lembrete ativado.' : 'Lembrete pausado.'); return; }
  if (el.dataset.slot) {
    const [tid, k, f] = el.dataset.slot.split('|'), jid = tpl(tid).slots[+k][3];
    upd('rotina_janelas', {[['inicio','prazo','responsavel'][+f]]:el.value}, 'id', jid, 'Rotina atualizada. Vale a partir de amanhã.'); return;
  }
  if (el.dataset.photo) { const [, iid] = el.dataset.photo.split('|'); upd('rotina_itens', {foto:el.checked}, 'id', iid, el.checked ? 'Foto obrigatória neste item.' : 'Este item não exige mais foto.'); return; }
  if (el.dataset.email) { const v = el.value.trim().toLowerCase() || null; upd('pessoas', {email:v}, 'id', el.dataset.email, v ? `Acesso liberado para ${v}.` : 'Acesso removido.'); return; }
});

document.addEventListener('submit', async e => {
  const f = e.target.dataset.form; if (!f) return; e.preventDefault();
  if (f === 'login') {
    const email = $('#email').value.trim().toLowerCase(); if (!email) return;
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Enviando…';
    const {error} = await sb.auth.signInWithOtp({email, options:{emailRedirectTo:location.origin + location.pathname}});
    if (error) { btn.disabled = false; btn.textContent = 'Receber o código de acesso'; toast(esc(error.message.includes('rate') ? 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.' : error.message)); return; }
    guardarEmail(email); try { localStorage.setItem('hype-otp-em', Date.now()); } catch (x) {} telaLogin(email); return;
  }
  if (f === 'otp') {
    const token = $('#otp').value.replace(/\D/g, ''), email = ($('#otp-email')?.value.trim().toLowerCase()) || lerEmail(); if (!token || !email) { toast('Digite o código e o seu e-mail.'); return; }
    guardarEmail(email);
    const {error} = await sb.auth.verifyOtp({email, token, type:'email'});
    if (error) toast('Código inválido ou vencido. Peça um novo código.'); return;
  }
  if (f === 'def') { const t = $('#nd-t').value.trim(); if (!t) return;
    run(async () => check(await sb.from('definicoes').insert({titulo:t, detalhe:$('#nd-d').value.trim() || null, ordem:100})), 'Ponto incluído na lista.'); return; }
  if (f === 'rem') { const at = $('#nr-at').value, t = $('#nr-t').value.trim(); if (!at || !t) return;
    run(async () => check(await sb.from('lembretes').insert({hora:at, texto:t})), 'Lembrete adicionado para a gerente.'); }
  if (f === 'occ') { const t = $('#no-t').value.trim(); if (!t) return; const file = $('#no-f')?.files?.[0];
    run(async () => { const foto = file ? await enviarFoto('ocorrencias', 'oc', file) : null;
      await rpc('abrir_ocorrencia', {titulo:t, pessoa:$('#no-w').value, origem:$('#no-s')?.value || 'Equipe', descricao:$('#no-d').value.trim() || null, pop:null,
        responsavel:$('#no-r')?.value || null, prazo:$('#no-p')?.value || null, foto}); $('#det-occ') && ($('#det-occ').open = false); }, 'Ocorrência registrada. A gerência foi avisada.'); }
  if (f === 'doc') { const tipo = e.target.dataset.tipo, comp = e.target.dataset.comp, file = $('#df-' + tipo).files[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('O arquivo passa de 10 MB. Envie o PDF da nota ou uma foto menor.'); return; }
    const vtxt = ($('#dv-' + tipo)?.value || '').replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.'), valor = vtxt === '' || isNaN(+vtxt) ? null : +vtxt;
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Enviando…';
    run(() => enviarDocumento(comp, tipo, tipo === 'nfse' ? $('#dn-' + tipo).value.trim() : null, valor, file), tipo === 'nfse' ? 'Nota fiscal enviada. A gestão foi avisada.' : 'Comprovante do DAS enviado.'); }
  if (f === 'aus') { const de = $('#au-i').value, ate = $('#au-f').value; if (ate < de) { toast('A data final precisa ser igual ou depois da inicial.'); return; }
    run(() => rpc('registrar_ausencia', {pessoa:$('#au-p').value, de, ate, motivo:$('#au-m').value.trim() || null, substituto:$('#au-s').value || null}), 'Ausência registrada.'); }
  if (f === 'fechar') { run(() => rpc('fechar_dia', {d:$('#fd-d').value, motivo:$('#fd-m').value.trim() || null}), 'Dia marcado como sem expediente.'); }
  if (f === 'pessoa') { const nome = $('#np-nome').value.trim(); if (!nome) return;
    const base = nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 20) || 'pessoa'; let id = base, k = 2; while (person(id)) id = base + k++;
    run(async () => check(await sb.from('pessoas').insert({id, nome, papel:$('#np-papel').value, rotulo:$('#np-rot').value.trim() || null, turno:$('#np-turno').value.trim() || null,
      folga:$('#np-folga').value === '' ? null : +$('#np-folga').value, email:$('#np-email').value.trim().toLowerCase() || null, cor:Math.floor(Math.random() * 360), ordem:S.people.length})), `${nome} entrou na equipe.`); }
  if (f === 'ficha') { const id = e.target.dataset.id;
    upd('pessoas', {...($('#fp-papel') ? {papel:$('#fp-papel').value} : {}), nome_completo:$('#fp-full').value.trim() || null, parceiro:$('#fp-parc').checked, nome:$('#fp-nome').value.trim(), rotulo:$('#fp-rot').value.trim() || null, turno:$('#fp-turno').value.trim() || null, folga:$('#fp-folga').value === '' ? null : +$('#fp-folga').value}, 'id', id, 'Dados atualizados.'); }
  if (f === 'editpop') { const id = e.target.dataset.id, nova = (e.submitter?.value || 'versao') === 'versao';
    const ls = sel => $(sel).value.split('\n').map(x => x.trim()).filter(Boolean);
    const dados = {titulo:$('#ep-t').value.trim(), quem:$('#ep-q').value.trim(), frequencia:$('#ep-f').value.trim(), dono:$('#ep-d').value.trim(), objetivo:$('#ep-o').value.trim(),
      materiais:ls('#ep-m'), passos:ls('#ep-s').map(x => x.startsWith('!') ? {t:x.slice(1).trim(), crit:true} : {t:x}), qualidade:ls('#ep-qa'), erros:ls('#ep-e')};
    S.ui.popEdit = null;
    const extra = popExtras();
    run(async () => { await rpc('salvar_pop', {pop:id, dados, nova_versao:nova}); if (extra) check(await sb.from('pops').update(extra).eq('id', id)); }, nova ? 'Nova versão publicada. A equipe vai assinar o termo de ciência de novo.' : 'Correção salva.'); }
  if (f === 'item') { const tid = e.target.dataset.id, t = e.target.querySelector('input').value.trim(); if (!t) return;
    const all = S.allTpls.find(x => x.id === tid).allItems, n = Math.max(0, ...all.map(i => +i.id.split('.i')[1] || 0)) + 1;
    run(async () => check(await sb.from('rotina_itens').insert({id:`${tid}.i${n}`, rotina_id:tid, ordem:Math.max(0, ...all.map(i => i.ordem)) + 1, texto:t})), 'Item incluído. Vale para os próximos checklists.'); }
  if (f === 'rotina') { const t = $('#nr-tit').value.trim(); if (!t) return;
    const dias = [...document.querySelectorAll('input[name=nr-dia]:checked')].map(x => +x.value); if (!dias.length) { toast('Escolha pelo menos um dia.'); return; }
    const itens = $('#nr-itens').value.split('\n').map(x => x.trim()).filter(Boolean); if (!itens.length) { toast('Inclua pelo menos um item.'); return; }
    let id = t.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'ROT'; let k = 2; while (S.allTpls.some(x => x.id === id)) id = id.slice(0, 2) + k++;
    run(async () => {
      check(await sb.from('rotinas').insert({id, titulo:t, pop_id:$('#nr-pop').value, conferir:$('#nr-conf').checked, dias, ordem:S.allTpls.length}));
      check(await sb.from('rotina_janelas').insert({rotina_id:id, inicio:$('#nr-ini').value, prazo:$('#nr-fim').value, responsavel:$('#nr-resp').value}));
      check(await sb.from('rotina_itens').insert(itens.map((x, n) => { const foto = x.includes('#'), crit = x.startsWith('!'); return {id:`${id}.i${n + 1}`, rotina_id:id, ordem:n + 1, texto:x.replace(/^[!#]+/, '').replace(/#/g, '').trim(), foto, critico:crit}; })));
    }, 'Checklist criado. Começa a aparecer a partir de amanhã.'); }
  if (f === 'pop') { const t = $('#np-t').value.trim(); if (!t) return;
    const n = Math.max(...S.pops.map(p => +p.id.slice(4) || 0)) + 1, id = 'POP-' + String(n).padStart(2, '0'), role = $('#np-r').value;
    const steps = $('#np-s').value.split('\n').map(x => x.trim()).filter(Boolean).map(x => x.startsWith('!') ? {t:x.slice(1).trim(), crit:true} : {t:x});
    S.ui.pop = id;
    run(async () => check(await sb.from('pops').insert({id, titulo:t, area:$('#np-a').value, cargos:[role], quem:{barbeiro:'Barbeiros', atendente:'Atendentes', gerente:'Gerente', todos:'Toda a equipe'}[role],
      frequencia:$('#np-f').value.trim() || 'Quando acontecer', objetivo:$('#np-o').value.trim() || 'A definir.', passos:steps.length ? steps : [{t:'A definir.'}],
      atualizado:dLabelISO(TODAY_ISO) + '/' + TODAY_ISO.slice(0, 4), aprovado_por:me().name, ordem:n})), `${id} publicado. A equipe vê o aviso para assinar.`); }
});

// Começa só depois que todos os scripts (inclusive admin.js e ux.js) carregaram
window.addEventListener('DOMContentLoaded', iniciar);
