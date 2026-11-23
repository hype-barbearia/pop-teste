/* =========================================================
   App de celular: gerente, barbeiros e atendentes
   ========================================================= */
const TABS = {
  gerente:[['agora','Agora','sino'], ['equipe','Equipe','equipe'], ['ocorrencias','Ocorrências','alerta'], ['pops','POPs','livro'], ['perfil','Perfil','perfil']],
  equipe:[['hoje','Hoje','check'], ['pops','POPs','livro'], ['hist','Histórico','hist'], ['perfil','Perfil','perfil']],
};
const greet = () => NOW() < 12 * 60 ? 'Bom dia' : NOW() < 18 * 60 ? 'Boa tarde' : 'Boa noite';


const backBtn = () => `<button class="back" data-act="close">${icon('voltar', 'ni xs')}Voltar</button>`;

function scInst(p){
  const i = inst(S.ui.open), t = tpl(i.tpl), mode = mine(i, p.id) ? 'exec' : p.role === 'gerente' ? 'verify' : 'view';
  return `${backBtn()}<div><p class="eyebrow">${tipoNome(t)} · ${t.pop}</p><h1 class="p-title">${esc(t.title)}</h1></div>${instBody(i, mode)}`;
}
function scPop(p){
  const x = pop(S.ui.pop);
  return `${backBtn()}<div><p class="eyebrow">${x.id}</p><h1 class="p-title">${esc(x.title)}</h1></div>${popBody(x, p)}`;
}



/* ---------- Gerente: Ocorrências ---------- */
function gOcc(p){
  const list = S.occ.filter(occVis).sort((a, b) => (a.status === 'resolvida') - (b.status === 'resolvida'));
  return `<div><p class="eyebrow">Ocorrências</p><h1 class="p-title">O que saiu do padrão</h1></div>
    ${formOcorrencia(true)}
    ${list.map(o => occCard(o, {edit:canManage()})).join('') || '<p class="muted small">Nenhuma ocorrência nos últimos 30 dias.</p>'}`;
}

/* ---------- POPs (todos) ---------- */
function mPops(p){
  const mineF = x => x.roles.includes('todos') || x.roles.includes(p.role);
  const mine = S.pops.filter(mineF), other = S.pops.filter(x => !mineF(x));
  const card = x => { const pend = popPeople(x).some(y => y.id === p.id) && (x.reads[p.id] || 0) < x.version;
    return `<button class="pop-row" data-act="pop" data-id="${x.id}"><span class="cid">${x.id}</span><span class="grow"><b>${esc(x.title)}</b><span class="sub">${esc(x.freq)}</span></span>${pend ? chip('ler v' + x.version, 'warn') : chip('v' + x.version)}</button>`; };
  return `<div><p class="eyebrow">Procedimentos</p><h1 class="p-title">POPs da Hype</h1></div>
    <section class="stack gap6"><h2 class="sec-h">Do seu cargo</h2>${mine.map(card).join('')}</section>
    ${other.length ? `<section class="stack gap6"><h2 class="sec-h">Outros cargos</h2>${other.map(card).join('')}</section>` : ''}`;
}


/* ---------- Equipe: Histórico ---------- */
function eHist(p){
  const a = histAgg(x => x.byP[p.id]), s = streak(p.id), occ = S.occ.filter(o => (o.who === p.id || o.by === p.id) && occVis(o));
  const sem = history().slice(-6).map(d => d.byP[p.id]).filter(Boolean), semana = sem.length >= 3 && sem.every(x => x.ok === x.exp);
  const h = history().slice(-10).reverse();
  return `<div><p class="eyebrow">Seu histórico</p><h1 class="p-title">Últimas 4 semanas</h1></div>
    <div class="split"><div><span class="l">No prazo</span><span class="v ${rateKind(a.rate)}-t">${rateTxt(a.rate)}</span></div><div><span class="l">Com atraso</span><span class="v">${a.late}</span></div><div><span class="l">Não feitos</span><span class="v">${a.miss}</span></div></div>
    ${semana ? `<div class="callout good"><b>Semana perfeita!</b> Todos os seus checklists dos últimos dias de trabalho foram feitos no prazo.</div>` : ''}
    <section class="card"><h3>Sequência de dias perfeitos</h3><p class="pos-big">${s} ${s === 1 ? 'dia' : 'dias'}</p><p class="small muted">Dias seguidos com todos os checklists no prazo. Meta da casa: ${pct(S.rules.meta)} no mês.</p>${dots(p.id)}</section>
    <section class="card"><h3>Dia a dia</h3><div class="feed">${h.map(d => { const x = d.byP[p.id]; if (!x) return '';
      return `<div class="feed-i"><div><b>${WEEK[d.wd]}, ${d.label}</b><span>${x.exp} checklists</span></div><div class="r">${x.ok === x.exp ? chip('tudo no prazo', 'good') : chip(`${x.ok} de ${x.exp} no prazo`, x.miss ? 'bad' : 'warn')}</div></div>`; }).join('')}</div></section>
    <section class="card"><h3>Ocorrências com você ou registradas por você</h3>${occ.length ? occ.map(o => occCard(o)).join('') : '<p class="small muted">Nenhuma. Continue assim.</p>'}</section>`;
}

/* ---------- Perfil (todos) ---------- */
const pendNF = pid => { const p = perAtual(); return valorNF(pid, p) != null && !docOk(docDe(pid, p, 'nfse')) ? 1 : 0; };
const docOk = d => d && d.status !== 'recusada';
const docChip = d => !d ? chip('pendente', 'warn') : d.status === 'aceita' ? chip('aceita', 'good') : d.status === 'recusada' ? chip('recusada', 'bad') : chip('enviada, aguardando conferência', 'acc');
function mPerfil(p){
  const assin = S.pops.filter(x => popPeople(x).some(y => y.id === p.id)), ok = assin.filter(x => (x.reads[p.id] || 0) >= x.version).length;
  const aus = S.ausencias.filter(a => a.pessoa_id === p.id && a.fim >= TODAY_ISO);
  return `<div><p class="eyebrow">Perfil</p><h1 class="p-title">${esc(p.fullName)}</h1></div>
    <section class="card perfil"><div class="row nowrap gap8">${av(p, true)}<div><b>${esc(p.fullName)}</b><p class="small muted">${roleL(p)}</p></div></div>
      <dl class="meta-grid"><div><dt>E-mail de acesso</dt><dd>${esc(p.email || 'não cadastrado')}</dd></div><div><dt>Cargo</dt><dd>${ROLE[p.role]}</dd></div>
        <div><dt>Turno</dt><dd>${esc(p.turno || 'a definir')}</dd></div><div><dt>Folga</dt><dd>${p.folga != null ? WEEK_FULL[p.folga] : 'a definir'}</dd></div>
        <div><dt>Termo de ciência</dt><dd>${ok} de ${assin.length} POPs assinados</dd></div>
        <div><dt>Notificações</dt><dd>${S.ui.push ? 'ativas neste aparelho' : `<button class="btn sm primary" data-act="push">Ativar neste aparelho</button>`}</dd></div></dl>
      ${aus.length ? `<p class="small">Ausência registrada: ${aus.map(a => `${dLabelISO(a.inicio)}${a.fim !== a.inicio ? ` a ${dLabelISO(a.fim)}` : ''}${a.motivo ? ` (${esc(a.motivo)})` : ''}`).join(', ')}</p>` : ''}
      <p class="small muted">Para corrigir algum dado, fale com a Jessica.</p></section>
    ${p.parceiro ? perfilNotas(p) : ''}
    ${perfilCultura(p)}
    <section class="card soft stack gap8"><h2 class="sec-h">Aparência</h2>${seletorTema()}<p class="small muted">Automático segue o modo claro ou escuro do celular.</p></section>
    ${blocoPrivacidadePerfil(p)}
    <button class="btn" data-act="sair">Sair do app</button>`;
}
