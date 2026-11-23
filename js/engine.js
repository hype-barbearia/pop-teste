/* =========================================================
   Regras: status, conformidade, histórico e lembretes
   ========================================================= */
let S;
const person = id => S.people.find(p => p.id === id);
const pop = id => S.pops.find(p => p.id === id);
const tpl = id => id === 'TREINO' ? TREINO_TPL : S.tpls.find(t => t.id === id);
const inst = id => id === 'TREINO' ? TREINO : S.inst.find(i => i.id === id);
/* Checklist de treino: existe só no aparelho e não entra em nenhum número */
let TREINO = null;
const first = p => p ? firstName(p.name) : 'Equipe';
const NOW = () => S.ui.now;
const vis = at => at != null && at <= NOW();
const GER = () => S.people.find(p => p.role === 'gerente')?.id;
const team = () => S.people.filter(p => p.role !== 'socio' && p.role !== 'dev' && p.active !== false);
const mine = (i, pid) => i.who === pid || (tpl(i.tpl).also || []).includes(pid);
const whoTxt = i => [i.who, ...(tpl(i.tpl).also || [])].map(id => first(person(id))).join(' e ');

/* Itens marcados até a hora simulada */
const checks = i => Object.fromEntries(Object.entries(i.checks).filter(([, c]) => vis(c.at)));
function prog(i){
  const t = tpl(i.tpl), c = checks(i);
  return {n:t.items.length, d:t.items.filter(it => c[it.id]).length, nc:t.items.filter(it => c[it.id] && !c[it.id].ok).length};
}
function status(i){
  if (vis(i.doneAt)) return i.doneAt > i.due ? 'tarde' : 'feito';
  const n = NOW();
  if (n < i.start) return 'agendado';
  return n <= i.due ? 'aberto' : 'atrasado';
}
const ST = {
  feito:{l:'Feito no prazo', k:'good'}, tarde:{l:'Feito com atraso', k:'warn'}, agendado:{l:'Agendado', k:''},
  aberto:{l:'Aberto agora', k:'acc'}, atrasado:{l:'Atrasado', k:'bad'},
};
const isDone = i => vis(i.doneAt);
const verVis = i => i.ver && vis(i.ver.at) ? i.ver : null;
const nudgesOf = id => S.nudges.filter(x => x.inst === id && vis(x.at));
/* Conferência por amostra: sorteada = false quer dizer que não caiu no sorteio */
const pedeConf = i => tpl(i.tpl).verify && i.sorteada !== false;
const needsVer = i => pedeConf(i) && isDone(i) && !verVis(i);
const occVis = o => o.day || vis(o.at);
const occOpen = () => S.occ.filter(o => occVis(o) && o.status !== 'resolvida');
const lateMin = i => NOW() - i.due;

/* Conformidade de um conjunto de execuções até agora */
function dayStats(filter = () => true){
  const list = S.inst.filter(filter), due = list.filter(i => i.due <= NOW() || isDone(i));
  const c = {feito:0, tarde:0, atrasado:0, aberto:0, agendado:0};
  list.forEach(i => c[status(i)]++);
  const dueN = due.length, ok = due.filter(i => status(i) === 'feito').length;
  return {...c, total:list.length, due:dueN, ok, done:c.feito + c.tarde, rate:dueN ? ok / dueN : null};
}

/* Histórico das últimas 4 semanas (24 dias de funcionamento), gerado a partir da rotina de hoje */
/* Histórico dos últimos 28 dias, vindo do banco (função historico) */
function history(){
  if (S.histDays) return S.histDays;
  const blank = () => ({exp:0, ok:0, late:0, miss:0}), by = {};
  (S.hist || []).forEach(r => {
    const rec = by[r.data] ??= {iso:r.data, wd:new Date(r.data + 'T12:00:00Z').getUTCDay(), label:dLabelISO(r.data), byP:{}, byT:{}, bySlot:{}, tot:blank()};
    const res = r.no_prazo ? 'ok' : r.atraso ? 'late' : 'miss';
    [rec.byP[r.pessoa_id] ??= blank(), rec.byT[r.rotina_id] ??= blank(), rec.bySlot[r.chave] ??= blank(), rec.tot].forEach(o => { o.exp++; o[res]++; });
  });
  return S.histDays = Object.values(by).sort((a, b) => a.iso < b.iso ? -1 : 1).slice(-24);
}
function histAgg(fn){
  const o = {exp:0, ok:0, late:0, miss:0};
  history().forEach(d => { const x = fn(d); if (x) ['exp','ok','late','miss'].forEach(k => o[k] += x[k]); });
  return {...o, rate:o.exp ? o.ok / o.exp : null, doneRate:o.exp ? (o.ok + o.late) / o.exp : null};
}
function streak(pid){
  let n = 0; const h = history();
  for (let k = h.length - 1; k >= 0; k--) { const x = h[k].byP[pid]; if (!x) continue; if (x.ok === x.exp) n++; else break; }
  return n;
}

/* Leituras de POP pendentes */
const popPeople = p => team().filter(x => p.roles.includes('todos') || p.roles.includes(x.role));
function pendingReads(pid){
  const out = [];
  S.pops.forEach(p => popPeople(p).forEach(x => { if ((p.reads[x.id] || 0) < p.version && (!pid || pid === x.id)) out.push({pop:p, who:x}); }));
  return out;
}

/* Lembretes da gerente, em ordem de urgência */
function gerenteFeed(){
  const n = NOW(), out = [];
  S.inst.forEach(i => {
    const st = status(i), t = tpl(i.tpl), p = person(i.who), g = prog(i);
    if (i.who === S.ui.user) {
      if (st === 'atrasado') out.push({k:'bad', ord:0, at:i.due, title:`Seu checklist está atrasado: ${t.title}`, sub:`Prazo era ${hm(i.due)}. ${g.d} de ${g.n} itens marcados.`, open:i.id});
      else if (st === 'aberto') out.push({k:'acc', ord:2, at:i.start, title:`Agora: ${t.title}`, sub:`Prazo até ${hm(i.due)}. ${g.d} de ${g.n} itens marcados.`, open:i.id});
      else if (st === 'agendado' && i.start - n <= S.rules.antes) out.push({k:'acc', ord:3, at:i.start, title:`Começa às ${hm(i.start)}: ${t.title}`, sub:`Faltam ${i.start - n} min.`, open:i.id});
      return;
    }
    if (st === 'atrasado') {
      const nd = nudgesOf(i.id)[0];
      out.push({k:'bad', ord:0, at:i.due, title:`Atraso: ${t.title} · ${first(p)}`,
        sub:`Prazo era ${hm(i.due)}, há ${mins(lateMin(i))}. ${g.d} de ${g.n} itens.${nd ? ` Você cobrou às ${hm(nd.at)}.` : ' Ainda não foi cobrado.'}${lateMin(i) >= S.rules.escalar && !aprendendo() ? ' Já foi avisado aos sócios.' : ''}`,
        nudge:nd ? null : i.id, open:i.id});
    }
    if (needsVer(i) && n - i.doneAt <= 240) {
      const late = n - i.doneAt > S.rules.conferir;
      out.push({k:late ? 'warn' : '', ord:1, at:i.doneAt, title:`Conferir: ${t.title} de ${first(p)}`, sub:`Concluído às ${hm(i.doneAt)}${g.nc ? `, com ${g.nc} item não feito` : ''}.${late ? ` Passou dos ${S.rules.conferir} min para conferir.` : ''}`, open:i.id});
    }
  });
  S.reminders.filter(r => !preInicio() && r.on && toMin(r.at) <= n && !vis(S.remDone[r.id])).forEach(r =>
    out.push({k:n - toMin(r.at) > 30 ? 'warn' : '', ord:2, at:toMin(r.at), title:`${r.at} · ${r.text}`, sub:'Lembrete fixo definido pelos sócios.', rem:r.id}));
  occOpen().filter(o => !o.actions.length).forEach(o => out.push({k:'warn', ord:1, at:o.at, title:`Ocorrência sem ação: ${o.title}`, sub:`${o.id} · ${first(person(o.who))} · ${o.src}`, occ:o.id}));
  const pr = pendingReads();
  if (pr.length) out.push({k:'', ord:4, at:0, title:`${pr.length} ${pr.length === 1 ? 'termo de ciência pendente' : 'termos de ciência pendentes'}`, sub:(() => { const by = {}; pr.forEach(x => by[first(x.who)] = (by[first(x.who)] || 0) + 1); return Object.entries(by).map(([n, c]) => `${n} (${c})`).join(', '); })(), tab:'equipe'});
  return out.sort((a, b) => a.ord - b.ord || b.at - a.at);
}

/* Como a gerente está respondendo aos lembretes hoje */
function gerenteStats(){
  const n = NOW();
  const verList = S.inst.filter(i => pedeConf(i) && isDone(i));
  const ver = verList.filter(verVis);
  const verAvg = ver.length ? sum(ver, i => i.ver.at - i.doneAt) / ver.length : 0;
  const late = S.inst.filter(i => i.who !== GER() && i.due < n && (!isDone(i) || i.doneAt > i.due));
  const nudged = late.filter(i => nudgesOf(i.id).length);
  const nudgeAvg = nudged.length ? sum(nudged, i => nudgesOf(i.id)[0].at - i.due) / nudged.length : 0;
  const ron = S.inst.filter(i => i.tpl === 'RON'), ronDue = ron.filter(i => i.due <= n), ronDone = ron.filter(isDone);
  const ronItems = ronDone.flatMap(i => Object.values(checks(i))), ronOk = ronItems.filter(c => c.ok).length;
  const fixed = S.reminders.filter(r => r.on && toMin(r.at) <= n), fixedDone = fixed.filter(r => vis(S.remDone[r.id]));
  const own = S.inst.filter(i => i.who === GER() && (i.due <= n || isDone(i))), ownOk = own.filter(i => status(i) === 'feito');
  const exp = verList.length + late.length + fixed.length + ronDue.length, got = ver.length + nudged.length + fixedDone.length + ronDue.filter(isDone).length;
  return {verList, ver, verAvg, late, nudged, nudgeAvg, ron, ronDue, ronDone, ronItems, ronOk, fixed, fixedDone, own, ownOk, rate:exp ? got / exp : null, exp, got};
}

/* O que a gerente fez hoje, em ordem */
function gerenteLog(){
  const ev = [];
  S.inst.forEach(i => {
    const t = tpl(i.tpl), p = person(i.who), v = verVis(i);
    if (v) ev.push({at:v.at, k:v.res === 'ok' ? 'good' : v.res === 'refazer' ? 'bad' : 'warn', t:`Conferiu ${t.title.toLowerCase()} de ${first(p)}`, s:v.res === 'ok' ? 'Conferido' : v.res === 'refazer' ? `Pediu para refazer${v.note ? ': ' + v.note : ''}` : `Com ressalva: ${v.note}`});
    if (i.who === GER() && isDone(i)) ev.push({at:i.doneAt, k:i.doneAt > i.due ? 'warn' : 'good', t:`Concluiu ${t.title.toLowerCase()}`, s:i.doneAt > i.due ? `${mins(i.doneAt - i.due)} de atraso` : 'No prazo'});
  });
  S.nudges.filter(x => vis(x.at)).forEach(x => { const i = inst(x.inst); ev.push({at:x.at, k:'', t:`Cobrou ${first(person(i.who))}`, s:`${tpl(i.tpl).title}, prazo ${hm(i.due)}`}); });
  S.reminders.forEach(r => { if (vis(S.remDone[r.id])) ev.push({at:S.remDone[r.id], k:'', t:`Lembrete feito: ${r.text}`, s:`Programado para ${r.at}`}); });
  S.occ.forEach(o => o.actions.forEach(a => { if (!a.day && vis(a.at) && a.by === GER()) ev.push({at:a.at, k:'', t:`Registrou ação em ${o.id}`, s:a.t}); }));
  return ev.sort((a, b) => b.at - a.at);
}

/* Fotos registradas hoje até agora */
function photos(){
  const out = [];
  S.inst.forEach(i => { const t = tpl(i.tpl), c = checks(i); t.items.forEach(it => { const k = c[it.id]; if (k?.photo) out.push({i, it, at:k.at, path:k.photo}); }); });
  return out.sort((a, b) => b.at - a.at);
}

