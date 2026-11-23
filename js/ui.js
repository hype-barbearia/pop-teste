/* =========================================================
   Componentes compartilhados
   ========================================================= */
const roleL = p => p.label || ROLE[p.role];
const chip = (txt, kind = '') => `<span class="chip ${kind}">${txt}</span>`;
const bar = (v, kind = '', mark) => `<div class="bar ${kind}"><i style="width:${clamp(v || 0, 0, 1) * 100}%"></i>${mark != null ? `<span class="mark" style="left:${clamp(mark, 0, 1) * 100}%"></span>` : ''}</div>`;
const kpi = (l, v, s = '', kind = '', extra = '') => `<div class="kpi ${kind}"><span class="l">${l}</span><span class="v">${v}</span>${extra}${s ? `<span class="s">${s}</span>` : ''}</div>`;
const av = (p, lg) => p ? `<span class="av${lg ? ' lg' : ''}" style="--h:${p.hue}" aria-hidden="true">${initials(p.name)}</span>` : `<span class="av${lg ? ' lg' : ''}" style="--h:30" aria-hidden="true">EQ</span>`;
const rateKind = r => r == null ? '' : r >= S.rules.meta ? 'good' : r >= S.rules.meta - .1 ? 'warn' : 'bad';
const rateTxt = r => r == null ? '—' : pct(r);
const stChip = i => { const s = ST[status(i)]; return chip(s.l, s.k); };
const ph = (eyebrow, title, lead = '', actions = '') => `<header class="ph"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>${actions ? `<div class="ph-actions">${actions}</div>` : ''}</header>`;
const segUi = (key, items, cur) => `<div class="seg" role="group">${items.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" aria-pressed="${cur === k}" data-act="f" data-k="${key}" data-v="${k}">${l}</button>`).join('')}</div>`;
/* Aviso enquanto a operação não começou */
const preInicio = () => !S.rules.inicio || TODAY_ISO < S.rules.inicio;
const avisoInicio = () => avisoOffline() + avisoAprendizado() + (!preInicio() ? '' : `<div class="callout"><b>${S.rules.inicio ? `A operação começa em ${dLabelISO(S.rules.inicio)}.` : 'A data de início da operação ainda não foi definida.'}</b> Até lá o app não cria checklists. Use este tempo para ler e assinar os POPs.${S.rules.inicio ? '' : ' Os sócios definem a data em Gerência e regras.'}</div>`);
const areaChip = a => `<span class="chip area">${AREAS[a]}</span>`;

function ring(v, size = 92, label, neutral){
  const r = size / 2 - 7, c = 2 * Math.PI * r, k = clamp(v || 0, 0, 1), col = neutral ? (v >= 1 ? 'var(--good)' : 'var(--accent)') : v == null ? 'var(--line)' : v >= S.rules.meta ? 'var(--good)' : v >= S.rules.meta - .1 ? 'var(--accent)' : 'var(--bad)';
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="9"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c * k} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size * .22}">${label ?? rateTxt(v)}</text></svg>`;
}

/* Ícones (traço simples) */
const NI = {
  tv:'M3 5h18v11H3zM8 20h8M12 16v4',
  painel:'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5', hoje:'M12 7v5l3.5 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  alerta:'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  equipe:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  sino:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  livro:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5',
  rotina:'M8 2v4M16 2v4M3.5 9.5h17M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01',
  check:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  hist:'M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2',
  camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mais:'M5 12h.01M12 12h.01M19 12h.01',
  perfil:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  nota:'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5', voltar:'M15 18l-6-6 6-6',
};
const icon = (k, cls = 'ni') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${NI[k]}"/></svg>`;

/* Foto registrada (link temporário do Storage) */
const photo = (label, at, path) => PHOTO_URL[path] ? `<a class="photo img" href="${esc(PHOTO_URL[path])}" target="_blank" rel="noopener"><img src="${esc(PHOTO_URL[path])}" alt="Foto: ${esc(label)}, ${hm(at)}" loading="lazy"><span>${hm(at)}</span></a>` : `<div class="photo" role="img" aria-label="Foto: ${esc(label)}, ${hm(at)}">${icon('camera')}<span>${hm(at)}</span></div>`;



/* Um POP completo */
function popBody(p, viewer){
  const ppl = popPeople(p), read = ppl.filter(x => (p.reads[x.id] || 0) >= p.version), me = viewer && ppl.find(x => x.id === viewer.id);
  const meRead = me && (p.reads[me.id] || 0) >= p.version;
  const lists = (title, arr, cls = '') => arr.length ? `<section class="stack gap6"><h3 class="h-sm">${title}</h3><ul class="plain ${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const linked = S.tpls.filter(t => t.pop === p.id);
  return `<article class="stack gap16 popdoc">
    <div class="row gap6">${chip(p.id, 'acc')}${areaChip(p.area)}${chip('versão ' + p.version)}<span class="small muted">Atualizado em ${p.updated} · aprovado por ${esc(p.approved)}</span></div>
    ${me && !meRead ? `<div class="notice warn"><span><b>Nova versão para você ler.</b> Leia com atenção e confirme no fim da página.</span></div>` : ''}
    <dl class="meta-grid"><div><dt>Objetivo</dt><dd>${esc(p.objective)}</dd></div><div><dt>Quem faz</dt><dd>${esc(p.who)}</dd></div><div><dt>Quando</dt><dd>${esc(p.freq)}</dd></div>${p.owner ? `<div><dt>A quem recorrer</dt><dd>${esc(p.owner)}</dd></div>` : ''}</dl>
    ${lists('Materiais', p.materials)}
    <section class="stack gap6"><h3 class="h-sm">Passo a passo</h3><ol class="steps">${p.steps.map(s => `<li${s.crit ? ' class="crit-step"' : ''}><span>${esc(s.t)}</span>${s.crit ? '<span class="tag crit">crítico</span>' : ''}</li>`).join('')}</ol></section>
    ${lists('Padrão de qualidade', p.quality, 'good-list')}${lists('O que não pode acontecer', p.errors, 'bad-list')}
    ${p.guide ? `<section class="stack gap6"><h3 class="h-sm">Guia de indicações</h3><p class="small muted">O serviço resolve na cadeira; o produto mantém o resultado em casa.</p><div class="tw"><table class="t"><thead><tr><th>Sinal percebido</th><th>Serviço</th><th>Produto HYPE Premium</th></tr></thead><tbody>${p.guide.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2] || '')}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
    ${p.tables ? `<section class="stack gap6"><h3 class="h-sm">Tabela de preços</h3><div class="price-grid">${p.tables.map(([g, rows]) => `<div class="price-box"><b>${esc(g)}</b>${rows.map(r => `<div class="row between nowrap small"><span>${esc(r[0])}</span><span class="num">${esc(r[1])}</span></div>`).join('')}</div>`).join('')}</div><p class="small muted">Serviços "a partir de": o valor final é definido na avaliação do profissional.</p></section>` : ''}
    ${linked.length ? `<section class="stack gap6"><h3 class="h-sm">Checklists ligados a este POP</h3><div class="row gap6">${linked.map(t => chip(`${t.title} · ${t.slots.map(s => s[0]).join(', ')}`)).join('')}</div></section>` : `<p class="small muted">Este POP não tem checklist próprio. É avaliado na ronda da gerente.</p>`}
    ${!viewer || viewer.role === 'socio' || viewer.role === 'gerente' || socioView() ? `<section class="stack gap6"><h3 class="h-sm">Termo de ciência: ${read.length} de ${ppl.length} assinaram</h3><div class="row gap6">${ppl.map(x => {
      const ok = (p.reads[x.id] || 0) >= p.version; return `<span class="chip ${ok ? 'good' : 'warn'}">${esc(first(x))} ${ok ? 'assinou' : 'pendente'}</span>`; }).join('')}</div></section>` : ''}
    ${me ? meRead ? `<p class="callout good"><b>Termo de ciência assinado</b> para a versão ${p.version}.</p>` : `<div class="card"><b>Termo de ciência</b><p class="small">Declaro que recebi, li e compreendi este procedimento, versão ${p.version}, e me comprometo a cumpri-lo no exercício da minha função.</p><button class="btn primary big" data-act="read" data-id="${p.id}">Assinar o termo de ciência</button></div>` : ''}
  </article>`;
}

/* Linha de ocorrência */
function occCard(o, {edit = false} = {}){
  const p = person(o.who), stK = {aberta:'bad', tratamento:'warn', resolvida:'good'}[o.status], stL = {aberta:'Aberta', tratamento:'Em tratamento', resolvida:'Resolvida'}[o.status];
  const when = o.day ? `${o.day}` : `hoje, ${hm(o.at)}`;
  const acts = o.actions.filter(a => a.day || vis(a.at));
  const vencida = o.status !== 'resolvida' && o.prazo && o.prazo < TODAY_ISO;
  const quem = `${o.resp ? `Resolve: <b>${esc(first(person(o.resp)))}</b>` : 'Resolve: gerência'}${o.prazo ? ` · prazo ${dLabelISO(o.prazo)}` : ''}${o.by && o.src === 'Equipe' ? ` · registrada por ${esc(first(person(o.by)))}` : ''}`;
  return `<article class="occ ${stK}">
    <div class="row between"><div class="row gap6"><span class="cid">${o.id}</span>${chip(stL, stK)}${vencida ? chip('prazo vencido', 'bad') : ''}${chip(o.src)}${o.pop ? `<button class="chip linkchip" data-act="pop" data-id="${o.pop}">${o.pop}</button>` : ''}</div><span class="small muted">${when}</span></div>
    <div class="row nowrap gap8">${av(p)}<div class="grow"><b>${esc(o.title)}</b><p class="small muted">${esc(first(p))} · ${esc(o.desc)}</p><p class="small">${quem}</p></div></div>
    ${o.foto ? photo(o.title, o.at, o.foto) : ''}
    ${acts.length ? `<ul class="actions">${acts.map(a => `<li><span class="small muted">${a.day || hm(a.at)} · ${esc(first(person(a.by)))}</span><p>${esc(a.t)}</p></li>`).join('')}</ul>` : '<p class="small warn-t">Nenhuma ação registrada ainda.</p>'}
    ${edit && o.status !== 'resolvida' ? `<div class="stack gap6">
      <div class="row gap6"><label class="small muted" for="or-${o.id}">Quem resolve</label><select class="inp w-auto" id="or-${o.id}" data-ocresp="${o.num}">${pessoaOpts(o.resp || '', 'A gerência')}</select>
        <label class="small muted" for="op-${o.id}">Prazo</label><input class="inp w-auto" type="date" id="op-${o.id}" data-ocprazo="${o.num}" value="${o.prazo || ''}"></div>
      <label class="sr" for="oa-${o.id}">Ação tomada</label><textarea class="inp" id="oa-${o.id}" rows="2" placeholder="O que foi feito? Ex.: Conversei com o barbeiro e repus o material."></textarea>
      <div class="row gap6"><button class="btn sm" data-act="occAct" data-id="${o.id}">Registrar ação</button><button class="btn sm ok" data-act="occSolve" data-id="${o.id}">Registrar e resolver</button></div></div>` : ''}
  </article>`;
}

/* Barras diárias de conformidade com a meta */
function dailyChart(){
  const h = history(), today = dayStats(), items = [...h.map(d => ({l:d.label, wd:WEEK[d.wd], v:d.tot.exp ? d.tot.ok / d.tot.exp : 0})), {l:'hoje', wd:WEEK[TODAY_WD], v:today.rate ?? 0, now:true}];
  const W = 760, H = 220, pl = 34, pr = 8, pt = 12, pb = 34, iw = W - pl - pr, ih = H - pt - pb, lo = .5;
  const y = v => pt + ih - (clamp(v, lo, 1) - lo) / (1 - lo) * ih, bw = iw / items.length;
  let o = '';
  [.5, .6, .7, .8, .9, 1].forEach(v => o += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${v * 100}%</text>`);
  items.forEach((it, k) => {
    const cx = pl + k * bw + bw / 2, w = bw * .62, col = it.v >= S.rules.meta ? 'var(--good)' : it.v >= S.rules.meta - .1 ? 'var(--accent)' : 'var(--bad)';
    o += `<rect x="${cx - w / 2}" y="${y(it.v)}" width="${w}" height="${pt + ih - y(it.v)}" rx="2" fill="${col}"${it.now ? ' opacity=".55"' : ''}><title>${it.l}: ${pct(it.v)} no prazo</title></rect>`;
    if (k % 2 === 0 || it.now) o += `<text x="${cx}" y="${H - pb + 14}" text-anchor="middle"${it.now ? ' style="fill:var(--fg);font-weight:700"' : ''}>${it.l}</text>`;
    if (it.wd === 'seg' && !it.now) o += `<text x="${cx}" y="${H - pb + 26}" text-anchor="middle" style="font-size:8px">seg</text>`;
  });
  o += `<line x1="${pl}" x2="${W - pr}" y1="${y(S.rules.meta)}" y2="${y(S.rules.meta)}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W - pr}" y="${y(S.rules.meta) - 5}" text-anchor="end" style="fill:var(--fg);font-weight:700">meta ${pct(S.rules.meta)}</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Conformidade diária das últimas 4 semanas">${o}</svg></div>`;
}

/* Tirinha de 24 dias de uma pessoa */
function dots(pid){
  return `<span class="dots" aria-label="Últimos 24 dias">${history().map(d => { const x = d.byP[pid]; if (!x) return '<i class="off"></i>';
    const r = x.ok / x.exp; return `<i class="${r === 1 ? 'good' : x.miss ? 'bad' : 'warn'}" title="${d.label}: ${x.ok} de ${x.exp} no prazo"></i>`; }).join('')}</span>`;
}

/* Aviso */
let tTimer;
function toast(html){
  const t = $('#toast'); t.innerHTML = `<span>${html}</span>`; t.hidden = false;
  clearTimeout(tTimer); tTimer = setTimeout(() => { t.hidden = true; }, 3800);
}
