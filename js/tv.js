/* =========================================================
   Hype POP · Modo TV (só o Victor)
   Apresentação da semana em tela cheia para a reunião.
   O Victor escolhe o período, quais slides entram e se aparecem nomes;
   as escolhas ficam salvas (config_textos, chave 'tv') e valem em qualquer aparelho.
   ========================================================= */
const TV_SLIDES = [
  ['capa', 'Capa', 'Título e período da semana.', true],
  ['resumo', 'Resumo da semana', 'Checklists no prazo, feitos, não feitos e rondas.', true],
  ['dias', 'Dia a dia', 'Barras com o % no prazo de cada dia.', true],
  ['checklists', 'Por checklist', 'Quais rotinas foram bem e quais precisam de atenção.', true],
  ['falhas', 'O que mais falhou', 'Os itens marcados como "não feito" mais vezes.', true],
  ['clientes', 'Clientes', 'Elogios e reclamações registrados no período.', true],
  ['ocorrencias', 'Ocorrências em aberto', 'O que ainda precisa ser resolvido.', true],
  ['reposicao', 'Reposição', 'Material pedido que ainda não chegou.', false],
  ['pops', 'POPs para assinar', 'Quantos termos de ciência faltam.', false],
  ['pessoas', 'Por pessoa', 'O % no prazo de cada um, em ordem alfabética. Expõe a equipe na frente de todos: use com cuidado, principalmente com os parceiros.', false],
  ['recado', 'Recado do Victor', 'Uma mensagem sua para fechar a reunião.', true],
];
const TV_AUTO = [[0, 'Só quando eu passar'], [15, 'A cada 15 segundos'], [30, 'A cada 30 segundos'], [60, 'A cada 1 minuto']];

function tvCfg(){
  const v = S.cfgTextos?.find(c => c.chave === 'tv')?.valor || {};
  return {periodo:v.periodo || 'passada', nomes:v.nomes ?? false, falas:v.falas ?? true, auto:+(v.auto || 0), recado:v.recado || '',
    on:{...Object.fromEntries(TV_SLIDES.map(s => [s[0], s[3]])), ...(v.on || {})}};
}

/* Período: semana passada (seg a sáb), esta semana até ontem ou últimos 7 dias */
const isoMais = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function tvPeriodo(tipo){
  const wd = new Date(TODAY_ISO + 'T12:00:00Z').getUTCDay(), seg = isoMais(TODAY_ISO, -((wd + 6) % 7));
  if (tipo === 'atual' && wd !== 1) return {de:seg, ate:isoMais(TODAY_ISO, -1), nome:'Esta semana até ontem'};
  if (tipo === '7') return {de:isoMais(TODAY_ISO, -7), ate:isoMais(TODAY_ISO, -1), nome:'Últimos 7 dias'};
  return {de:isoMais(seg, -7), ate:isoMais(seg, -2), nome:'Semana passada'};
}
const tvDataTxt = iso => `${WEEK[new Date(iso + 'T12:00:00Z').getUTCDay()]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

async function tvDados(cfg){
  const p = tvPeriodo(cfg.periodo), dias = [];
  for (let x = p.de; x <= p.ate; x = isoMais(x, 1)) if (new Date(x + 'T12:00:00Z').getUTCDay() !== 0) dias.push(x);
  const [tot, falhas, ...porDia] = await Promise.all([sb.rpc('relatorio', {de:p.de, ate:p.ate}), sb.rpc('falhas_periodo', {de:p.de, ate:p.ate}),
    ...dias.map(x => sb.rpc('relatorio', {de:x, ate:x}))].map(r => r.then(check)));
  return {p, dias, tot:tot || [], falhas:falhas || [], porDia:porDia.map(r => r || [])};
}

/* ---------- Slides ---------- */
const somar = rows => rows.reduce((o, r) => (o.prev += r.previstos, o.ok += r.no_prazo, o.late += r.atraso, o.miss += r.nao_feito, o.nao += r.itens_nao, o), {prev:0, ok:0, late:0, miss:0, nao:0});
const pctTxt = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
const tom = (a, b) => !b ? '' : a / b >= S.rules.meta ? 'good' : a / b >= S.rules.meta - .15 ? 'warn' : 'bad';
const slide = (eyebrow, titulo, corpo, extra = '') => `<section class="tvs ${extra}"><p class="tvs-eb">${eyebrow}</p><h1 class="tvs-h">${titulo}</h1><div class="tvs-c">${corpo}</div></section>`;
const vazio = txt => `<p class="tvs-vazio">${txt}</p>`;

function tvSlides(cfg, d){
  const on = k => cfg.on[k], out = [], per = `${tvDataTxt(d.p.de)} a ${tvDataTxt(d.p.ate)}`;
  const nome = pid => cfg.nomes ? esc(first(person(pid))) : '';
  const t = somar(d.tot), dentro = iso => iso >= d.p.de && iso <= d.p.ate;
  const ron = somar(d.tot.filter(r => r.rotina_id === 'RON'));
  const occP = S.occ.filter(o => o.data && dentro(o.data));

  if (on('capa')) out.push(`<section class="tvs capa">${markSvg('tvs-mark')}<p class="tvs-eb">Hype Barbearia · alinhamento semanal</p><h1 class="tvs-h xl">${esc(d.p.nome)}</h1><p class="tvs-sub">${per}</p></section>`);

  if (on('resumo')) out.push(slide(per, 'A semana em números', !t.prev ? vazio('Ainda não há dias completos neste período.') : `<div class="tvs-nums">
      <div class="${tom(t.ok, t.prev)}"><b>${pctTxt(t.ok, t.prev)}</b><span>dos checklists no prazo</span></div>
      <div><b>${t.ok + t.late}<small>/${t.prev}</small></b><span>checklists feitos</span></div>
      <div class="${t.miss ? 'bad' : 'good'}"><b>${t.miss}</b><span>${t.miss === 1 ? 'não foi feito' : 'não foram feitos'}</span></div>
      <div><b>${ron.ok + ron.late}<small>/${ron.prev}</small></b><span>rondas feitas</span></div></div>
    <p class="tvs-sub">${t.late} ${t.late === 1 ? 'feito com atraso' : 'feitos com atraso'} · ${t.nao} ${t.nao === 1 ? 'item marcado' : 'itens marcados'} como não feito · ${occP.length} ${occP.length === 1 ? 'ocorrência registrada' : 'ocorrências registradas'}</p>`));

  if (on('dias')) out.push(slide(per, 'Dia a dia', `<div class="tvs-bars">${d.dias.map((x, k) => { const s = somar(d.porDia[k]), v = s.prev ? s.ok / s.prev : 0;
    return `<div class="tvs-bar ${tom(s.ok, s.prev)}"><span class="v">${pctTxt(s.ok, s.prev)}</span><i style="height:${Math.max(v * 100, s.prev ? 3 : 0)}%"></i><span class="l">${tvDataTxt(x)}</span></div>`; }).join('')}</div>
    <p class="tvs-sub">% dos checklists feitos no prazo · meta ${Math.round(S.rules.meta * 100)}%</p>`));

  if (on('checklists')) {
    const por = {}; d.tot.forEach(r => (por[r.rotina_id] ??= []).push(r));
    const linhas = Object.entries(por).map(([id, rows]) => ({id, t:S.allTpls.find(x => x.id === id)?.title || id, ...somar(rows)})).filter(x => x.prev).sort((a, b) => b.ok / b.prev - a.ok / a.prev);
    out.push(slide(per, 'Por checklist', !linhas.length ? vazio('Sem checklists completos no período.') : `<div class="tvs-rows">${linhas.slice(0, 9).map(x =>
      `<div class="tvs-row ${tom(x.ok, x.prev)}"><span class="n">${esc(x.t)}</span><span class="b"><i style="width:${100 * x.ok / x.prev}%"></i></span><b>${pctTxt(x.ok, x.prev)}</b><small>${x.ok} de ${x.prev}</small></div>`).join('')}</div>`));
  }

  if (on('falhas')) out.push(slide(per, 'O que mais falhou', !d.falhas.length ? vazio('Nenhum item marcado como não feito. Excelente.') : `<ol class="tvs-list">${d.falhas.slice(0, 5).map(f =>
    `<li><b class="c">${f.falhas}x</b><span><b>${esc(f.texto)}</b><small>${esc(f.rotina)}${f.pop_id ? ' · ' + esc(f.pop_id) : ''}</small></span></li>`).join('')}</ol>
    <p class="tvs-sub">Quando o mesmo item falha muito, olhe primeiro o processo: material, horário e quem faz.</p>`));

  if (on('clientes')) {
    const el = occP.filter(o => /elogio/.test(o.src || '')), rc = occP.filter(o => /reclama/.test(o.src || ''));
    const fala = o => `<blockquote class="${/elogio/.test(o.src) ? 'good' : 'bad'}">“${esc(o.desc || o.title)}”${o.who && nome(o.who) ? `<cite>sobre ${nome(o.who)}</cite>` : ''}</blockquote>`;
    out.push(slide(per, 'O que os clientes disseram', `<div class="tvs-nums two"><div class="good"><b>${el.length}</b><span>${el.length === 1 ? 'elogio' : 'elogios'}</span></div><div class="${rc.length ? 'bad' : ''}"><b>${rc.length}</b><span>${rc.length === 1 ? 'reclamação' : 'reclamações'}</span></div></div>
      ${cfg.falas ? `<div class="tvs-quotes">${[...el.slice(0, 3), ...rc.slice(0, 2)].map(fala).join('')}</div>` : ''}${!el.length && !rc.length ? vazio('Nenhum registro de cliente no período. Lembre a equipe de registrar.') : ''}`));
  }

  if (on('ocorrencias')) {
    const ab = occOpen().filter(o => !/elogio/.test(o.src || '')), res = occP.filter(o => o.status === 'resolvida' && !/elogio/.test(o.src || '')).length;
    out.push(slide(per, 'Ocorrências em aberto', !ab.length ? vazio(`Nenhuma ocorrência em aberto.${res ? ` ${res} resolvidas no período.` : ''}`) : `<ul class="tvs-list dots">${ab.slice(0, 6).map(o =>
      `<li><span><b>${esc(o.title)}</b><small>${esc(o.src || '')}${o.resp && nome(o.resp) ? ` · com ${nome(o.resp)}` : ''}${o.prazo ? ` · prazo ${dLabelISO(o.prazo)}` : ''}</small></span></li>`).join('')}</ul>
      <p class="tvs-sub">${ab.length} em aberto${res ? ` · ${res} resolvidas no período` : ''}</p>`));
  }

  if (on('reposicao')) { const r = S.repo.filter(x => !x.resolvido_em);
    out.push(slide('Agora', 'Reposição de material', !r.length ? vazio('Nada faltando.') : `<ul class="tvs-list dots">${r.slice(0, 8).map(x => `<li><span><b>${esc(x.item)}</b>${x.obs ? `<small>${esc(x.obs)}</small>` : ''}</span></li>`).join('')}</ul>`)); }

  if (on('pops')) { const pr = pendingReads(), by = {}; pr.forEach(x => by[x.who.id] = (by[x.who.id] || 0) + 1);
    out.push(slide('Agora', 'POPs para assinar', !pr.length ? vazio('Todos os termos de ciência estão assinados.') : `<div class="tvs-nums one"><div class="warn"><b>${pr.length}</b><span>termos de ciência pendentes</span></div></div>
      ${cfg.nomes ? `<p class="tvs-sub">${Object.entries(by).map(([pid, n]) => `${nome(pid)} (${n})`).join(' · ')}</p>` : '<p class="tvs-sub">Cada um assina no app, na aba POPs.</p>'}`)); }

  if (on('pessoas')) {
    const por = {}; d.tot.forEach(r => (por[r.pessoa_id] ??= []).push(r));
    const linhas = team().filter(p => por[p.id]).sort((a, b) => a.name.localeCompare(b.name)).map(p => ({p, ...somar(por[p.id])})).filter(x => x.prev);
    out.push(slide(per, 'Por pessoa', !linhas.length ? vazio('Sem dados no período.') : `<div class="tvs-rows">${linhas.map(x =>
      `<div class="tvs-row ${tom(x.ok, x.prev)}"><span class="n">${esc(first(x.p))}</span><span class="b"><i style="width:${100 * x.ok / x.prev}%"></i></span><b>${pctTxt(x.ok, x.prev)}</b><small>${x.ok} de ${x.prev}</small></div>`).join('')}</div>`));
  }

  if (on('recado') && cfg.recado.trim()) out.push(`<section class="tvs capa recado">${markSvg('tvs-mark')}<p class="tvs-eb">Recado do Victor</p><p class="tvs-recado">${esc(cfg.recado).replace(/\n/g, '<br>')}</p></section>`);
  return out;
}

/* ---------- Apresentação em tela cheia ---------- */
let TV = null;
function tvMostrar(){
  const t = TV; if (!t) return;
  t.el.innerHTML = `<div class="tvp-stage">${t.slides[t.i]}</div>
    <nav class="tvp-nav"><button data-act="tvAnt" aria-label="Slide anterior">‹</button><span>${t.i + 1} / ${t.slides.length}</span><button data-act="tvProx" aria-label="Próximo slide">›</button><button data-act="tvSair">Sair</button></nav>
    <div class="tvp-prog"><i style="width:${(t.i + 1) / t.slides.length * 100}%"></i></div>`;
  clearTimeout(t.timer);
  if (t.cfg.auto) t.timer = setTimeout(() => { if (TV) { TV.i = (TV.i + 1) % TV.slides.length; tvMostrar(); } }, t.cfg.auto * 1000);
}
const tvIr = n => { if (!TV) return; TV.i = Math.max(0, Math.min(TV.slides.length - 1, TV.i + n)); tvMostrar(); };
function tvSair(){
  if (!TV) return; clearTimeout(TV.timer); TV.el.remove(); TV = null; document.body.classList.remove('tv-on');
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
async function tvIniciar(){
  const cfg = tvCfg(); toast('Montando a apresentação…');
  let d; try { d = await tvDados(cfg); } catch (e) { toast(esc(e.message)); return; }
  const slides = tvSlides(cfg, d); if (!slides.length) { toast('Ligue pelo menos um slide.'); return; }
  const el = document.createElement('div'); el.id = 'tvp'; el.className = 'tvp';
  el.addEventListener('click', e => { if (e.target.closest('button')) return; tvIr(e.clientX < innerWidth / 3 ? -1 : 1); });
  document.body.appendChild(el); document.body.classList.add('tv-on');
  TV = {i:0, slides, el, cfg, timer:null}; tvMostrar();
  try { await el.requestFullscreen?.(); } catch (e) {}
}
document.addEventListener('keydown', e => {
  if (!TV) return;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); tvIr(1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); tvIr(-1); }
  else if (e.key === 'Escape') tvSair();
});
// Saiu da tela cheia pelo navegador (Esc): encerra a apresentação também
document.addEventListener('fullscreenchange', () => { if (TV && !document.fullscreenElement) tvSair(); });

/* ---------- Tela de preparação (Sócios → Modo TV) ---------- */
function pgTv(){
  if (!canEdit() || !recurso('modo_tv')) return `${ph(eyebrow(), 'Modo TV', !recurso('modo_tv') ? 'O Modo TV está desligado no momento.' : 'A apresentação da semana é montada pelo Victor.')}`;
  const c = tvCfg(), p = tvPeriodo(c.periodo), n = TV_SLIDES.filter(s => c.on[s[0]] && (s[0] !== 'recado' || c.recado.trim())).length;
  const opt = (v, l, cur) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`;
  return `${ph(eyebrow(), 'Modo TV', 'Os números e os destaques da semana em tela cheia, para a reunião. Só entra o que estiver ligado aqui. Ligue o computador na TV e toque em Iniciar.',
      `<button class="btn primary" data-act="tvIniciar">${icon('tv')}Iniciar apresentação</button>`)}
    <div class="grid cols-2">
      <section class="panel stack gap14"><div class="panel-h"><h2>Período e privacidade</h2><p>${p.nome}: ${tvDataTxt(p.de)} a ${tvDataTxt(p.ate)}</p></div>
        <div class="field"><label for="tv-per">Período</label><select class="inp" id="tv-per" data-tv="periodo">${opt('passada', 'Semana passada (seg a sáb)', c.periodo)}${opt('atual', 'Esta semana até ontem', c.periodo)}${opt('7', 'Últimos 7 dias', c.periodo)}</select></div>
        <label class="toggle"><input type="checkbox" data-tv="nomes" ${c.nomes ? 'checked' : ''}><span><b>Mostrar nomes</b><span>Desligado, os slides de clientes, ocorrências e POPs aparecem sem o nome de ninguém.</span></span></label>
        <label class="toggle"><input type="checkbox" data-tv="falas" ${c.falas ? 'checked' : ''}><span><b>Mostrar o que os clientes disseram</b><span>As frases registradas de elogio e reclamação.</span></span></label>
        <div class="field"><label for="tv-auto">Passar os slides</label><select class="inp" id="tv-auto" data-tv="auto">${TV_AUTO.map(([v, l]) => opt(v, l, c.auto)).join('')}</select></div>
        <p class="small muted">Na apresentação: setas do teclado ou toque nas laterais para passar; Esc para sair.</p></section>
      <section class="panel"><div class="panel-h"><h2>O que mostrar</h2><p>${n} ${n === 1 ? 'slide' : 'slides'}</p></div>
        <div class="stack gap8">${TV_SLIDES.map(([k, l, dsc]) => `<label class="toggle tv-sl ${k === 'pessoas' ? 'sens' : ''}"><input type="checkbox" data-tvslide="${k}" ${c.on[k] ? 'checked' : ''}><span><b>${l}</b><span>${dsc}</span></span></label>
          ${k === 'recado' ? `<div class="field tv-rec"><label for="tv-rec" class="sr">Recado</label><textarea class="inp" id="tv-rec" data-tv="recado" rows="3" placeholder="Ex.: Semana de estreia! Obrigado a todos pela dedicação. Foco desta semana: registrar os elogios dos clientes.">${esc(c.recado)}</textarea></div>` : ''}`).join('')}</div></section>
    </div>
    <div><button class="btn primary big" data-act="tvIniciar">${icon('tv')}Iniciar apresentação</button></div>`;
}

Object.assign(A, {tvIniciar, tvSair, tvProx(){ tvIr(1); }, tvAnt(){ tvIr(-1); }});
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset.tv && !el.dataset.tvslide) return;
  const c = tvCfg();
  if (el.dataset.tvslide) c.on[el.dataset.tvslide] = el.checked;
  else { const k = el.dataset.tv; c[k] = el.type === 'checkbox' ? el.checked : k === 'auto' ? +el.value : el.value; }
  salvarTexto('tv', c, 'Modo TV atualizado.');
});
