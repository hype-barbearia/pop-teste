/* =========================================================
   Hype POP · telas do celular (equipe e gerente) e topo do painel dos sócios
   Uma resposta por tela, polegar primeiro, status por cor e forma.
   ========================================================= */
const MARK = 'M293.88,169.95h-72.89l17.2,14.38-91.49,186.22,108.36-79.16,69.75,71.7.65-109.01,14.28-12.98h21.74l14.6,14.6-.61-31.69c-.04-2.15-1.17-4.13-2.99-5.26l-78.59-48.81ZM190.49,327.73l47.69-67.15-54.18,52.88,61.32-121.02,60.02,50.94-114.85,84.35ZM314.75,336.98l-50.61-51.1,48.39-35.66c.54-.4,1.28-.36,1.77.09h0c.29.26.45.64.45,1.03v85.63ZM365.36,233h-28.88l-17.2,14.28-73.97-68.78h45.1l35.36,21.08h-40.23l26.28,9.41h1.46c0,3.94,3.2,7.14,7.14,7.14s7.14-3.2,7.14-7.14h12.81l25.79,15.74,2.11,11.35-2.92-3.08Z';
const markSvg = (cls = 'hb-mark') => `<svg class="${cls}" viewBox="140 165 232 210" aria-hidden="true"><path d="${MARK}"/></svg>`;
const SK = {feito:'good', tarde:'warn', atrasado:'bad', aberto:'acc', agendado:'mute'};
const vibra = () => { try { navigator.vibrate?.(12); } catch (e) {} };

/* ---------- Faixa escura do topo ---------- */
function heroBand(p, inner, extra = ''){
  return `<header class="hb ${extra}"><div class="hb-top">${markSvg()}<span class="hb-date">${DIA_CURTO} · <b class="num">${hm(NOW())}</b></span>
    ${p.socio ? `<button class="hb-btn" data-act="asSocio">Painel dos sócios</button>` : ''}
    <button class="hb-av" data-act="tab" data-v="perfil" aria-label="Meu perfil">${av(p)}</button></div>${inner}</header>`;
}
const segs = list => `<div class="segs" role="img" aria-label="Progresso do dia">${list.map(i => `<i class="s-${SK[status(i)]}" title="${hm(i.start)} ${esc(tpl(i.tpl).title)}"></i>`).join('')}</div>`;

/* ---------- Item da linha do dia ---------- */
function tlItem(i, {who = false} = {}){
  const t = tpl(i.tpl), s = status(i), g = prog(i);
  const meta = isDone(i) ? `feito às ${hm(i.doneAt)}${i.doneAt > i.due ? ` · ${mins(i.doneAt - i.due)} de atraso` : ''}` : s === 'agendado' ? `até ${hm(i.due)}` : `${g.d}/${g.n} itens · prazo ${hm(i.due)}`;
  const flag = g.nc ? `<em>${g.nc} não ${t.kind === 'ronda' ? 'conforme' : 'feito'}</em>` : needsVer(i) ? '<em class="wait">aguardando conferência</em>' : '';
  return `<button class="tli s-${SK[s]}" data-act="open" data-id="${i.id}"><span class="tli-t num">${hm(i.start)}</span><span class="tli-dot"></span>
    <span class="tli-c"><b>${esc(t.title)}</b><small>${who ? esc(whoTxt(i)) + ' · ' : ''}${meta}${flag ? ` · ${flag}` : ''}</small></span><span class="tli-s">${ST[s].l}</span></button>`;
}
function instCard(i, o = {}){ return tlItem(i, {who:o.who !== false}); }

/* ---------- Casca do app no celular ---------- */
function renderPhone(p){
  const isG = p.role === 'gerente', tabs = TABS[isG ? 'gerente' : 'equipe'];
  let body;
  if (S.ui.open && inst(S.ui.open)) body = scInst(p);
  else if (S.ui.lote && isG) body = scLote(p);
  else if (S.ui.pop && pop(S.ui.pop)) body = scPop(p);
  else {
    const fn = ({agora:gAgora, equipe:gEquipe, ocorrencias:gOcc, pops:mPops, hoje:eHoje, hist:eHist, perfil:mPerfil}[S.ui.tab] || (isG ? gAgora : eHoje));
    body = fn === gAgora || fn === eHoje ? fn(p) : paginaSimples(p, fn(p));
  }
  const feedN = isG ? gerenteFeed().filter(f => f.k === 'bad' || f.k === 'warn').length : 0, myReads = pendingReads(p.id).length;
  const foco = !!(S.ui.open && inst(S.ui.open));
  return `<div class="app ${foco ? 'focus' : ''}">${body}
    ${foco ? '' : `<nav class="tabbar2" aria-label="Abas">${tabs.map(([k, l, ic]) => { const n = k === 'agora' ? feedN : k === 'pops' ? myReads : k === 'perfil' && p.parceiro ? pendNF(p.id) : 0;
      return `<button class="${S.ui.tab === k && !S.ui.open && !S.ui.pop ? 'on' : ''}" data-act="tab" data-v="${k}" aria-label="${l}"><span class="tab-ic">${icon(ic)}${n ? `<span class="count bad">${n}</span>` : ''}</span><span class="tab-l">${l}</span></button>`; }).join('')}</nav>`}</div>`;
}
/* Páginas secundárias: o título sobe para a faixa escura */
function paginaSimples(p, html){
  const m = html.match(/^\s*<div><p class="eyebrow">([\s\S]*?)<\/p><h1 class="p-title">([\s\S]*?)<\/h1><\/div>/);
  const resto = m ? html.slice(m[0].length) : html;
  return `${heroBand(p, `<p class="hb-eb">${m ? m[1] : ''}</p><h1 class="hb-h">${m ? m[2] : ''}</h1>`, 'slim')}<main class="sheet-c">${resto}</main>`;
}

/* ---------- Equipe: Hoje ---------- */
function eHoje(p){
  const list = S.inst.filter(i => mine(i, p.id)).sort((a, b) => a.start - b.start);
  const done = list.filter(isDone), pend = list.filter(i => !isDone(i));
  const atual = pend.find(i => ['atrasado','aberto'].includes(status(i))) || pend[0];
  const pr = pendingReads(p.id), redo = list.filter(i => i.redo && vis(i.redo.at) && !isDone(i)), nds = pend.filter(i => nudgesOf(i.id).length);
  const st = atual ? status(atual) : null, g = atual ? prog(atual) : null;
  const lbl = !atual ? '' : st === 'atrasado' ? `Atrasado · prazo era ${hm(atual.due)}` : st === 'aberto' ? `Agora · até ${hm(atual.due)}` : atual.start - NOW() <= 60 ? `Em ${mins(atual.start - NOW())} · ${hm(atual.start)}` : `Próximo · ${hm(atual.start)}`;
  const agora = atual ? `<button class="now s-${SK[st]}" data-act="open" data-id="${atual.id}">
      <span class="now-l">${lbl}</span><b class="now-t">${esc(tpl(atual.tpl).title)}</b>
      <span class="now-m">${g.n} ${g.n === 1 ? 'item' : 'itens'}${g.d ? ` · ${g.d} feito${g.d > 1 ? 's' : ''}` : ''}${tpl(atual.tpl).items.some(x => x.photo) ? ' · com foto' : ''}</span>
      ${bar(g.d / g.n, st === 'atrasado' ? 'bad' : '')}<span class="now-cta">${g.d ? 'Continuar' : st === 'agendado' ? 'Ver o checklist' : 'Começar agora'} →</span></button>`
    : list.length ? `<div class="now done"><span class="now-l">Dia completo</span><b class="now-t">Tudo feito, ${esc(first(p))}.</b><span class="now-m">${done.filter(i => status(i) === 'feito').length} de ${list.length} no prazo hoje.</span></div>`
    : `<div class="now done"><span class="now-l">Hoje</span><b class="now-t">Nenhum checklist para você.</b><span class="now-m">Aproveite para ler e assinar os POPs.</span></div>`;
  const avisos = [
    ...redo.map(i => `<button class="alert bad" data-act="open" data-id="${i.id}"><b>Refazer: ${esc(tpl(i.tpl).title)}</b><span>${esc(i.redo.note)}</span></button>`),
    ...nds.map(i => { const n = nudgesOf(i.id).slice(-1)[0]; return `<button class="alert bad" data-act="open" data-id="${i.id}"><b>${esc(first(person(n.by)))} te lembrou às ${hm(n.at)}</b><span>${esc(tpl(i.tpl).title)} das ${hm(i.start)}</span></button>`; }),
    pr.length ? `<button class="alert warn" data-act="tab" data-v="pops"><b>${pr.length} ${pr.length === 1 ? 'POP para assinar' : 'POPs para assinar'}</b><span>Leia e assine o termo de ciência.</span></button>` : '',
    fila().length ? `<div class="alert warn"><b>${fila().length} ${fila().length === 1 ? 'marcação esperando internet' : 'marcações esperando internet'}</b><span>Saem sozinhas quando a conexão voltar.</span></div>` : '',
  ].filter(Boolean).join('');
  const prox = pend.filter(i => i !== atual), tambem = prox.filter(i => ['atrasado','aberto'].includes(status(i))), depois = prox.filter(i => !tambem.includes(i));
  return `${heroBand(p, `<p class="hb-eb">${greet()}</p><h1 class="hb-h">${esc(first(p))}</h1>
      <p class="hb-sub">${list.length ? `<b>${done.length}</b> de ${list.length} checklists feitos hoje` : 'Sem checklists hoje'}</p>${list.length ? segs(list) : ''}`)}
    <main class="sheet-c">${cardPrivacidade(p)}${agora}${avisoPush()}${avisoInicio()}${avisoFechado()}${cardTreino(p)}${avisos}
      ${tambem.length ? `<section class="tl"><h2 class="sec-h">Também para agora</h2>${tambem.map(i => tlItem(i)).join('')}</section>` : ''}
      ${depois.length ? `<section class="tl"><h2 class="sec-h">Depois</h2>${depois.map(i => tlItem(i)).join('')}</section>` : ''}
      ${done.length ? `<details class="tl" id="det-feitos"><summary class="sec-h">Feitos hoje (${done.length})</summary>${done.map(i => tlItem(i)).join('')}</details>` : ''}
      ${blocoRegistrar(false)}
    </main>`;
}

/* ---------- Checklist aberto ---------- */
function scInst(p){
  const i = inst(S.ui.open), t = tpl(i.tpl), mode = mine(i, p.id) ? 'exec' : p.role === 'gerente' ? 'verify' : 'view', g = prog(i), s = status(i);
  return `<header class="hb slim ck"><div class="hb-top"><button class="hb-back" data-act="close" aria-label="Voltar">${icon('voltar')}</button><span class="hb-date">${tipoNome(t)} · ${hm(i.start)} às ${hm(i.due)}</span><span class="tag-st s-${SK[s]}">${ST[s].l}</span></div>
      <div class="ck-head"><div><h1 class="hb-h">${esc(t.title)}</h1><p class="hb-sub">${esc(whoTxt(i))}${isDone(i) ? ` · concluído às ${hm(i.doneAt)}` : ''}</p></div>${ring(g.d / g.n, 76, `${g.d}/${g.n}`, true)}</div></header>
    <main class="sheet-c">${instBody(i, mode)}</main>`;
}
function scPop(p){
  const x = pop(S.ui.pop);
  return `<header class="hb slim"><div class="hb-top"><button class="hb-back" data-act="close" aria-label="Voltar">${icon('voltar')}</button><span class="hb-date">${x.id} · versão ${x.version}</span></div><h1 class="hb-h">${esc(x.title)}</h1></header>
    <main class="sheet-c">${popBody(x, p)}</main>`;
}

/* Itens com toque grande: a linha inteira marca; "Não deu" fica ao lado */
function instBody(i, mode){
  const t = tpl(i.tpl), p = person(i.who), c = checks(i), s = status(i), done = isDone(i), ronda = t.kind === 'ronda', reu = ehReuniao(t);
  const canAct = mode === 'exec' && !done && NOW() >= i.start - 30, g = prog(i), left = g.n - g.d;
  const extra = it => `${it.how ? `<small class="it-how">Como fazer: ${esc(it.how)}</small>` : ''}${reu ? umAUm(it) : ''}`;
  const tags = it => `${it.photo ? `<span class="tag">${icon('camera', 'ni xs')}foto</span>` : ''}${it.crit ? '<span class="tag crit">crítico</span>' : ''}`;
  const rows = t.items.map(it => {
    const k = c[it.id];
    if (k) return `<div class="it ${k.ok ? 'ok' : 'nc'}"><span class="it-ck" aria-hidden="true">${k.ok ? '✓' : '✕'}</span><span class="it-tx"><b>${esc(it.t)}</b>${tags(it)}
        <small>${k.ok ? (ronda ? 'Conforme' : reu ? 'Aconteceu' : 'Feito') : (ronda ? 'Não conforme' : reu ? 'Não aconteceu' : 'Não feito')} às ${hm(k.at)}${k.note ? `: ${esc(k.note)}` : ''}</small>${extra(it)}${k.photo || it.ref ? `<span class="ph-pair">${k.photo ? photo(it.t, k.at, k.photo) : ''}${mode === 'verify' ? refThumb(it) : ''}</span>` : ''}</span>
        ${canAct ? `<button class="it-undo" data-act="uncheck" data-id="${i.id}" data-it="${it.id}">Desfazer</button>` : ''}</div>`;
    if (canAct && S.ui.nao === i.id + '|' + it.id) return `<div class="it open"><span class="it-ck" aria-hidden="true"></span><span class="it-tx stack gap8"><b>${esc(it.t)}</b>
        <label class="small muted" for="nao-note">${ronda ? 'O que está fora do padrão?' : reu ? 'O que houve?' : 'Por que não deu?'} A gerência recebe como ocorrência.</label>
        <textarea class="inp" id="nao-note" rows="2" placeholder="${ronda ? 'Ex.: Bancada 3 com ferramenta fora da embalagem' : reu ? 'Ex.: Breno de folga, remarcado para quinta' : 'Ex.: Acabou o álcool 70%'}"></textarea>
        ${ronda || reu || !recurso('reposicao') ? '' : `<label class="toggle sm"><input type="checkbox" id="nao-rep"><span>É falta de material: pedir reposição</span></label>`}
        <span class="row gap6"><button class="btn primary" data-act="naoSave" data-id="${i.id}" data-it="${it.id}">Registrar</button><button class="btn" data-act="naoCancel">Cancelar</button></span></span></div>`;
    if (canAct) return `<div class="it todo"><button class="it-main" data-act="check" data-id="${i.id}" data-it="${it.id}"><span class="it-ck" aria-hidden="true">${it.photo ? icon('camera', 'ni xs') : ''}</span>
        <span class="it-tx"><b>${esc(it.t)}</b>${tags(it)}<small>${ronda ? 'Toque se está conforme' : reu ? 'Toque quando acontecer' : it.photo ? 'Toque para tirar a foto (só do ambiente, sem clientes)' : 'Toque quando terminar'}</small>${extra(it)}</span></button>
        ${refThumb(it) ? `<span class="it-ref">${refThumb(it)}</span>` : ''}
        <button class="it-no" data-act="nao" data-id="${i.id}" data-it="${it.id}">${ronda ? 'Não conforme' : reu ? 'Não aconteceu' : 'Não deu'}</button></div>`;
    return `<div class="it idle"><span class="it-ck" aria-hidden="true"></span><span class="it-tx"><b>${esc(it.t)}</b>${tags(it)}${extra(it)}</span></div>`;
  }).join('');
  const early = mode === 'exec' && !done && NOW() < i.start - 30 ? `<div class="alert"><b>Libera às ${hm(i.start - 30)}</b><span>Meia hora antes da janela.</span></div>` : '';
  const v = verVis(i), nd = nudgesOf(i.id);
  const verBox = v ? `<div class="callout ${v.res === 'ok' ? 'good' : 'bad'}"><b>${v.res === 'ok' ? 'Conferido' : 'Conferido com ressalva'}</b> por ${esc(first(person(v.by)))} às ${hm(v.at)}${v.note ? `. ${esc(v.note)}` : '.'}</div>`
    : mode === 'verify' && done && t.verify ? `<div class="card soft stack gap8"><b>Conferência</b><p class="small muted">Olhe as fotos e os horários antes de conferir.</p>
      <label class="sr" for="ver-note">Observação</label><textarea class="inp" id="ver-note" rows="2" placeholder="Observação (obrigatória para ressalva ou refazer)"></textarea>
      <div class="btn-row"><button class="btn primary" data-act="verify" data-id="${i.id}" data-v="ok">Conferido</button><button class="btn" data-act="verify" data-id="${i.id}" data-v="ressalva">Com ressalva</button><button class="btn no" data-act="verify" data-id="${i.id}" data-v="refazer">Refazer</button></div></div>`
    : t.verify && done ? `<p class="small muted center">Aguardando a conferência da gerência.</p>` : '';
  const redo = i.redo && vis(i.redo.at) && !done ? `<div class="alert bad"><b>Refazer pedido às ${hm(i.redo.at)}</b><span>${esc(i.redo.note)}</span></div>` : '';
  const nudge = nd.length && (!done || i.doneAt > nd[0].at) ? `<p class="small muted">Cobrado por ${nd.map(x => `${esc(first(person(x.by)))} às ${hm(x.at)}`).join(', ')}.</p>` : '';
  const quem = mode !== 'exec' ? `<div class="row between nowrap who-row"><span class="row nowrap gap8">${av(p)}<b>${esc(whoTxt(i))}</b></span>${mode === 'verify' && s === 'atrasado' ? `<button class="btn no" data-act="nudge" data-id="${i.id}">Cobrar ${esc(first(p))}</button>` : stChip(i)}</div>` : '';
  const foot = canAct ? `<div class="ck-foot"><span class="num"><b>${g.d}</b>/${g.n}</span>${left ? `<button class="btn primary big" disabled>Faltam ${left}</button>` : `<button class="btn primary big" data-act="finish" data-id="${i.id}">${reu ? 'Concluir reunião' : 'Concluir checklist'}</button>`}</div>` : '';
  return `<div class="stack gap12">${quem}${redo}${nudge}${early}<div class="its">${rows}</div>${blocoReuniao(i, mode)}${verBox}
    ${t.pop ? `<button class="linkbtn small center" data-act="pop" data-id="${t.pop}">Ver o procedimento ${t.pop}</button>` : '<p class="small muted center">Este é só um treino: nada aqui é registrado.</p>'}</div>${foot}`;
}

/* ---------- Gerente: fila de ações ---------- */
function gAgora(p){
  const d = dayStats(), feed = gerenteFeed(), mine_ = S.inst.filter(i => i.who === p.id).sort((a, b) => a.start - b.start);
  const urg = feed.filter(f => f.nudge || /^Atraso|atrasado/i.test(f.title));
  const conf = S.inst.filter(needsVer).sort((a, b) => a.doneAt - b.doneAt).map(i => ({k:NOW() - i.doneAt > S.rules.conferir ? 'warn' : '', title:`Conferir: ${tpl(i.tpl).title} · ${first(person(i.who))}`,
    sub:`Concluído às ${hm(i.doneAt)}${prog(i).nc ? `, com ${prog(i).nc} item não feito` : ''}.`, open:i.id}));
  const resto = feed.filter(f => !urg.includes(f) && !/^Conferir/.test(f.title));
  const nConf = S.inst.filter(needsVer).length;
  const grupo = (titulo, arr, vazio) => arr.length ? `<section class="fila"><h2 class="sec-h">${titulo} <span class="cnt">${arr.length}</span></h2>${arr.map(feedCard).join('')}</section>` : vazio || '';
  const fixos = S.reminders.filter(r => r.on).sort((a, b) => toMin(a.at) - toMin(b.at));
  return `${heroBand(p, `<p class="hb-eb">${greet()}</p><h1 class="hb-h">${esc(first(p))}</h1>
      <div class="stats"><div class="${rateKind(d.rate)}"><b class="num">${rateTxt(d.rate)}</b><span>no prazo hoje</span></div>
        <div class="${urg.length ? 'bad' : ''}"><b class="num">${urg.length}</b><span>${urg.length === 1 ? 'atraso' : 'atrasos'}</span></div>
        <div class="${nConf ? 'warn' : ''}"><b class="num">${nConf}</b><span>para conferir</span></div></div>`)}
    <main class="sheet-c">${cardPrivacidade(p)}${avisoPush()}${avisoInicio()}${avisoFechado()}${cardTreino(p)}
      ${TODAY_WD === 1 ? blocoPauta(false) : ''}
      ${!urg.length && !conf.length ? `<div class="now done"><span class="now-l">Fila vazia</span><b class="now-t">Casa no padrão agora.</b><span class="now-m">Nenhum atraso e nada para conferir.</span></div>` : ''}
      ${grupo('Resolver agora', urg)}${conf.length > 1 && recurso('lote') ? `<button class="btn big lote-b" data-act="lote">Conferir em lote (${conf.length}) · fotos lado a lado</button>` : ''}${grupo('Conferir', conf)}${grupo('Lembretes e avisos', resto)}
      ${blocoReposicao(true)}
      ${mine_.length ? `<section class="tl"><h2 class="sec-h">Seus checklists</h2>${mine_.map(i => tlItem(i)).join('')}</section>` : ''}
      ${fixos.length ? `<section class="card soft"><h2 class="sec-h">Lembretes do dia</h2>${fixos.map(r => { const ok = vis(S.remDone[r.id]), due = toMin(r.at) <= NOW();
        return `<div class="rem"><span class="num"><b>${r.at}</b></span><span class="grow">${esc(r.text)}</span>${ok ? chip('feito ' + hm(S.remDone[r.id]), 'good') : due ? `<button class="btn sm primary" data-act="remDone" data-id="${r.id}">Feito</button>` : chip('mais tarde')}</div>`; }).join('')}</section>` : ''}
      ${blocoRegistrar(true)}
      <section class="card soft def-banner"><span><b>Alguém faltou ou vai sair mais cedo?</b><span class="small muted block">Registre a ausência e escolha quem cobre. Os checklists passam para essa pessoa.</span></span><button class="btn sm" data-act="tab" data-v="equipe">Registrar ausência</button></section>
    </main>`;
}
function feedCard(f){
  const acts = [f.nudge ? `<button class="btn no" data-act="nudge" data-id="${f.nudge}">Cobrar</button>` : '', f.open ? `<button class="btn ${f.nudge ? '' : 'primary'}" data-act="open" data-id="${f.open}">${/^Conferir/.test(f.title) ? 'Conferir' : 'Abrir'}</button>` : '',
    f.rem ? `<button class="btn primary" data-act="remDone" data-id="${f.rem}">Feito</button>` : '', f.occ ? `<button class="btn" data-act="tab" data-v="ocorrencias">Tratar</button>` : '',
    f.tab ? `<button class="btn" data-act="tab" data-v="${f.tab}">Ver</button>` : ''].join('');
  return `<article class="fc ${f.k}"><div class="fc-tx"><b>${esc(f.title)}</b><span>${esc(f.sub)}</span></div>${acts ? `<div class="btn-row">${acts}</div>` : ''}</article>`;
}

/* ---------- Gerente: Equipe em cartões que abrem (atrasados já abertos) ---------- */
function gEquipe(p){
  const ppl = team().filter(x => x.id !== p.id), pr = pendingReads();
  const com = ppl.filter(x => S.inst.some(i => i.who === x.id)), sem = ppl.filter(x => !com.includes(x));
  const card = x => {
    const d = dayStats(i => i.who === x.id), list = S.inst.filter(i => i.who === x.id).sort((a, b) => a.start - b.start);
    const tag = d.atrasado ? chip(`${d.atrasado} ${d.atrasado === 1 ? 'atrasado' : 'atrasados'}`, 'bad') : chip(`${d.done}/${d.total} feitos`, d.done === d.total ? 'good' : '');
    return `<details class="card pcard" ${d.atrasado ? 'open' : ''}><summary class="pc-h">${av(x)}<span class="pc-n"><b>${esc(x.name)}</b><small>${esc(roleL(x))}</small>${statusChips(x.id)}${segs(list)}</span>${tag}</summary>
      <div class="stack gap6">${list.map(i => tlItem(i)).join('')}</div></details>`;
  };
  const porNome = Object.entries(pr.reduce((o, x) => (o[first(x.who)] = (o[first(x.who)] || 0) + 1, o), {}));
  return `<div><p class="eyebrow">Equipe hoje</p><h1 class="p-title">Quem fez o quê</h1></div>
    ${avisoAdesao()}${blocoPauta(TODAY_WD === 1)}
    ${com.map(card).join('')}
    ${sem.length ? `<p class="small muted pc-sem">Sem checklists hoje: ${sem.map(x => esc(first(x))).join(', ')}.</p>` : ''}
    ${pr.length ? `<div class="notice warn"><span><b>${pr.length} termos de ciência pendentes:</b> ${porNome.map(([n, c]) => `${esc(n)} (${c})`).join(', ')}. Cobre na reunião ou no WhatsApp.</span></div>` : ''}
    ${blocoNotas(periodos(6).includes(S.ui.f.per) ? S.ui.f.per : perAtual(), true)}
    ${blocoAusencias()}`;
}

/* ---------- Sócios: faixa de status no painel ---------- */
