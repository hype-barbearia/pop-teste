/* =========================================================
   Visão dos sócios: painel de acompanhamento a distância
   Victor edita tudo. Robson vê tudo, sem alterar.
   ========================================================= */
const SNAV = [
  ['Hoje', [['painel','Painel','painel'], ['hoje','Linha do dia','hoje'], ['ocorrencias','Ocorrências','alerta']]],
  ['Decisões', [['definir','Para definir','check'], ['notas','Notas fiscais','nota']]],
  ['Dashboards', [['relatorios','Relatórios','hist'], ['tv','Modo TV','tv']]],
  ['Equipe', [['equipe','Equipe e ausências','equipe'], ['gerente','Gerência e regras','sino']]],
  ['Configuração', [['rotina','Rotina e checklists','rotina'], ['pops','Biblioteca de POPs','livro'], ['info','Informações da casa','nota']]],
];
const eyebrow = () => `Sócios · ${DIA_CURTO} · agora ${hm(NOW())}`;
const canEdit = () => me()?.role === 'socio';
const canManage = () => { const p = me(); return !!p && (['socio','gerente'].includes(p.role) || substitutoHoje(p.id)); };
const substitutoHoje = pid => S.ausencias.some(a => a.substituto === pid && person(a.pessoa_id)?.role === 'gerente' && a.inicio <= TODAY_ISO && TODAY_ISO <= a.fim);
const dis = () => canEdit() ? '' : 'disabled';
const roNote = () => canEdit() ? '' : '<p class="callout small">Você vê tudo nesta tela, mas só o Victor faz alterações.</p>';
const pessoaOpts = (cur, vazio = '') => `${vazio ? `<option value="">${vazio}</option>` : ''}${team().map(p => `<option value="${p.id}" ${cur === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`;
const DOW = [1,2,3,4,5,6];

function navBadge(k){
  if (k === 'hoje') { const n = dayStats().atrasado; return n ? `<span class="count bad">${n}</span>` : ''; }
  if (k === 'ocorrencias') { const n = occOpen().length; return n ? `<span class="count">${n}</span>` : ''; }
  if (k === 'pops') { const n = pendingReads().length; return n ? `<span class="count">${n}</span>` : ''; }
  if (k === 'definir') { const n = S.defs.filter(x => !x.resolvido_em).length + conflitos().length + popsRevisar().length; return n ? `<span class="count bad">${n}</span>` : ''; }
  if (k === 'notas') { const n = S.docs.filter(d => d.status === 'enviada').length; return n ? `<span class="count">${n}</span>` : ''; }
  return '';
}

function renderSocio(){
  const v = S.ui.view;
  const side = `<nav class="side" aria-label="Menu">${SNAV.map(([g, items]) => `<div class="side-group">${g}</div>${items.filter(([k]) => k !== 'tv' || (canEdit() && recurso('modo_tv'))).map(([k, l, ic]) =>
    `<button class="nav-item ${v === k ? 'on' : ''}" data-act="nav" data-v="${k}"><span class="row nowrap gap8">${icon(ic)}${l}</span>${navBadge(k)}</button>`).join('')}`).join('')}
    <div class="side-foot">Tudo o que a equipe marca no app aparece aqui na hora, com horário e foto.<a class="side-ver" href="versoes.html">Versões do app →</a></div></nav>`;
  const bn = [['painel','Painel','painel'], ['hoje','Dia','hoje'], ['definir','Decidir','check'], ['equipe','Equipe','equipe']];
  const bnav = `<nav class="bnav" aria-label="Menu">${bn.map(([k, l, ic]) => `<button class="${v === k ? 'on' : ''}" data-act="nav" data-v="${k}"><span class="tab-ic">${icon(ic)}${navBadge(k)}</span>${l}</button>`).join('')}<button class="${!bn.some(x => x[0] === v) ? 'on' : ''}" data-act="more">${icon('mais')}Mais</button></nav>`;
  const sheet = S.ui.more ? `<div class="sheet" data-act="more"><div class="sheet-in" data-stop="1">${SNAV.map(([g, items]) => `<div class="side-group">${g}</div>${items.filter(([k]) => k !== 'tv' || (canEdit() && recurso('modo_tv'))).map(([k, l, ic]) =>
    `<button class="nav-item ${v === k ? 'on' : ''}" data-act="nav" data-v="${k}"><span class="row nowrap gap8">${icon(ic)}${l}</span>${navBadge(k)}</button>`).join('')}`).join('')}<div class="side-group">Aparência</div><div class="sheet-tema">${seletorTema()}</div></div></div>` : '';
  const page = ({painel:pgPainel, hoje:pgHoje, ocorrencias:pgOcc, relatorios:pgRelatorios, tv:pgTv, definir:pgDefinir, equipe:pgEquipe, notas:pgNotas, gerente:pgGerente, pops:pgPops, rotina:pgRotina, info:pgInfo}[v] || pgPainel)();
  return side + `<main class="work">${page}</main>` + bnav + sheet;
}

/* Botão de notificações (sócios, gerente e equipe) */
function avisoPush(){
  if (S.ui.push === true) return '';
  if (!pushSuportado() && !ehIOS()) return '';
  return `<div class="notice push-card"><span><b>Receba os avisos no celular.</b> ${ehIOS() && !instalado() ? 'No iPhone: Compartilhar → Adicionar à Tela de Início, abra por lá e toque em Ativar.' : 'Atrasos, cobranças e o resumo do dia chegam como notificação.'}</span><button class="btn sm primary" data-act="push">Ativar</button></div>`;
}
const avisoFechado = () => S.fechadoHoje ? `<div class="callout"><b>Hoje é dia sem expediente${S.fechadoHoje.motivo ? `: ${esc(S.fechadoHoje.motivo)}` : ''}.</b> Nenhum checklist conta para os números.</div>` : '';

/* ---------- Painel ---------- */

function resumo(){
  const d = dayStats(), g = gerenteStats(), oo = S.occ.filter(o => !o.day && vis(o.at));
  const ppl = team().map(p => ({p, s:dayStats(i => i.who === p.id)})).filter(x => x.s.due);
  const top = ppl.filter(x => x.s.ok === x.s.due), att = S.inst.filter(i => status(i) === 'atrasado').map(i => `${tpl(i.tpl).title} das ${hm(i.start)}`);
  return esc(`*Hype · ${DIA_CURTO}${NOW() < toMin(S.rules.resumo) ? ` (até ${hm(NOW())})` : ''}*
Conformidade: ${rateTxt(d.rate)} no prazo (${d.ok} de ${d.due} checklists)
Com atraso: ${d.tarde} · Atrasados agora: ${d.atrasado}
Ocorrências: ${oo.length} novas, ${oo.filter(o => o.status === 'resolvida').length} resolvidas
Rondas da gerente: ${g.ronDone.length} de ${g.ron.length}${g.ronItems.length ? ` (${g.ronOk} de ${g.ronItems.length} itens conformes)` : ''}
Conferências: ${g.ver.length} de ${g.verList.length} · tempo médio ${mins(g.verAvg)}
${top.length ? `Tudo no prazo hoje: ${top.length} de ${ppl.length} pessoas\n` : ''}${att.length ? `Atrasado agora: ${att.join(', ')}\n` : ''}Abrir o painel: ${location.origin + location.pathname}`);
}

/* ---------- Linha do dia ---------- */
function pgHoje(){
  const f = S.ui.f.st || 'todos', fp = S.ui.f.p || 'todos', n = NOW();
  const span = DAY_END - DAY_START, x = m => (clamp(m, DAY_START, DAY_END) - DAY_START) / span * 100;
  const rows = team().map(p => {
    const list = S.inst.filter(i => i.who === p.id);
    return `<div class="tl-row"><button class="tl-who" data-act="f" data-k="p" data-v="${fp === p.id ? 'todos' : p.id}">${av(p)}<span>${esc(first(p))}</span></button><div class="tl-track">${list.map(i => {
      const s = status(i), end = isDone(i) ? Math.max(i.doneAt, i.due) : s === 'atrasado' ? n : i.due;
      return `<button class="tl-b ${ST[s].k || 'sched'}" style="left:${x(i.start)}%;width:${Math.max(x(end) - x(i.start), .9)}%" data-act="open" data-id="${i.id}" title="${hm(i.start)} ${tpl(i.tpl).title}: ${ST[s].l}"><span class="sr">${tpl(i.tpl).title}</span></button>`;
    }).join('')}<span class="tl-now" style="left:${x(n)}%"></span></div></div>`;
  }).join('');
  const axis = `<div class="tl-row axis"><span></span><div class="tl-track bare">${Array.from({length:14}, (_, k) => `<span style="left:${x(DAY_START + k * 60)}%">${8 + k}h</span>`).join('')}</div></div>`;
  let list = S.inst.filter(i => fp === 'todos' || i.who === fp);
  const fs = {atrasados:i => status(i) === 'atrasado', abertos:i => status(i) === 'aberto', feitos:i => isDone(i), proximos:i => status(i) === 'agendado'}[f];
  if (fs) list = list.filter(fs);
  list.sort((a, b) => a.start - b.start || a.who.localeCompare(b.who));
  const groups = {}; list.forEach(i => (groups[Math.floor(i.start / 60)] ??= []).push(i));
  const d = dayStats();
  return `${ph(eyebrow(), 'Linha do dia', 'Cada barra é um checklist na sua janela de horário. Toque para ver os itens, os horários e as fotos.')}
    ${avisoFechado()}
    <section class="panel"><div class="panel-h"><h2>Por pessoa</h2><div class="legend"><span><i class="dot" style="background:var(--good)"></i>no prazo</span><span><i class="dot" style="background:var(--warn)"></i>com atraso</span><span><i class="dot" style="background:var(--bad)"></i>atrasado</span><span><i class="dot" style="background:var(--accent)"></i>aberto</span><span><i class="dot" style="background:var(--line)"></i>agendado</span><span><i class="dash"></i>agora</span></div></div>
      <div class="tl-wrap" id="tl-wrap"><div class="tl">${axis}${rows}</div></div></section>
    <section class="panel"><div class="panel-h"><div class="row gap8">${segUi('st', [['todos', `Todos ${d.total}`], ['atrasados', `Atrasados ${d.atrasado}`], ['abertos', `Abertos ${d.aberto}`], ['feitos', `Feitos ${d.done}`], ['proximos', `Próximos ${d.agendado}`]], f)}
      <label class="sr" for="f-p">Pessoa</label><select class="inp w-auto" id="f-p" data-f="p"><option value="todos">Toda a equipe</option>${team().map(p => `<option value="${p.id}" ${fp === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div></div>
      ${list.length ? Object.entries(groups).map(([h, arr]) => `<p class="day-h">${h}h</p><div class="stack gap6">${arr.map(i => instCard(i)).join('')}</div>`).join('') : '<p class="muted">Nada com esse filtro.</p>'}</section>`;
}

/* ---------- Ocorrências ---------- */
function formOcorrencia(gestor){
  return `<details class="panel" id="det-occ"><summary class="sum">Registrar ocorrência</summary>
    <form class="stack gap8" data-form="occ"><div class="form-grid">
      <div class="field span2"><label for="no-t">O que aconteceu</label><input class="inp" id="no-t" required placeholder="Ex.: Cliente reclamou do tempo de espera"></div>
      <div class="field"><label for="no-w">Quem está envolvido</label><select class="inp" id="no-w">${pessoaOpts('', 'Ninguém em especial')}</select></div>
      ${gestor ? `<div class="field"><label for="no-s">Origem</label><select class="inp" id="no-s"><option>Cliente</option><option>Ronda da gerente</option><option>Observação</option></select></div>
      <div class="field"><label for="no-r">Quem resolve</label><select class="inp" id="no-r">${pessoaOpts('', 'A gerente')}</select></div>
      <div class="field"><label for="no-p">Prazo</label><input class="inp" type="date" id="no-p"></div>` : ''}</div>
      <div class="field"><label for="no-d">Detalhes</label><textarea class="inp" id="no-d" rows="2"></textarea></div>
      <div class="field"><label for="no-f">Foto (opcional)</label><input class="inp" type="file" id="no-f" accept="image/*" capture="environment"></div>
      <div><button class="btn primary">Registrar</button></div></form></details>`;
}
function pgOcc(){
  const f = S.ui.f.oc || 'abertas';
  const all = S.occ.filter(occVis), list = all.filter(o => f === 'todas' || (f === 'abertas' ? o.status !== 'resolvida' : o.status === 'resolvida'));
  const atras = all.filter(o => o.status !== 'resolvida' && o.prazo && o.prazo < TODAY_ISO).length;
  return `${ph(eyebrow(), 'Ocorrências', 'Tudo o que saiu do padrão: item não feito, item reprovado na ronda, reclamação de cliente e o que a equipe registrar. Cada uma tem quem resolve e prazo.')}
    <div class="grid kpis">${kpi('Em aberto', occOpen().length, 'aberta ou em tratamento', occOpen().length ? 'warn' : 'good')}${kpi('Fora do prazo', atras, 'abertas com prazo vencido', atras ? 'bad' : '')}${kpi('Hoje', all.filter(o => !o.day).length, 'registradas hoje')}${kpi('Resolvidas', all.filter(o => o.status === 'resolvida').length, 'nos últimos 30 dias')}</div>
    ${blocoReposicao(canManage())}
    ${canManage() ? formOcorrencia(true) : ''}
    <div class="row between">${segUi('oc', [['abertas','Em aberto'], ['resolvidas','Resolvidas'], ['todas','Todas']], f)}</div>
    <div class="stack gap8">${list.length ? list.map(o => occCard(o, {edit:canManage()})).join('') : '<p class="muted">Nenhuma ocorrência aqui.</p>'}</div>`;
}

/* ---------- Relatórios ---------- */
function mesesOpts(cur){
  const out = []; const d = recife();
  for (let k = 0; k < 6; k++) { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - k, 1)); const v = m.toISOString().slice(0, 7);
    out.push(`<option value="${v}" ${cur === v ? 'selected' : ''}>${MESES[m.getUTCMonth()]} de ${m.getUTCFullYear()}</option>`); }
  return out.join('');
}
function pgRelatorios(){
  const mes = S.ui.f.mes || TODAY_ISO.slice(0, 7), dados = REL[mes];
  if (!dados) carregarRelatorio(mes);
  const agg = (rows, key) => { const o = {}; (rows || []).forEach(r => { const k = r[key], x = o[k] ??= {prev:0, ok:0, late:0, miss:0, nao:0}; x.prev += r.previstos; x.ok += r.no_prazo; x.late += r.atraso; x.miss += r.nao_feito; x.nao += r.itens_nao; }); return o; };
  const porP = agg(dados, 'pessoa_id'), porR = agg(dados, 'rotina_id'), tot = Object.values(porP).reduce((a, x) => ({prev:a.prev + x.prev, ok:a.ok + x.ok, late:a.late + x.late, miss:a.miss + x.miss}), {prev:0, ok:0, late:0, miss:0});
  const linha = (nome, x) => `<tr><td>${nome}</td><td class="num">${x.prev}</td><td class="num"><b class="${rateKind(x.prev ? x.ok / x.prev : null)}-t">${rateTxt(x.prev ? x.ok / x.prev : null)}</b></td><td class="num">${x.late}</td><td class="num">${x.miss}</td><td class="num">${x.nao}</td></tr>`;
  const head = '<thead><tr><th></th><th class="num">Previstos</th><th class="num">No prazo</th><th class="num">Com atraso</th><th class="num">Não feitos</th><th class="num">Itens não feitos</th></tr></thead>';
  return `${ph(eyebrow(), 'Relatórios', 'Os números do mês por pessoa e por checklist. Bom para os one-on-ones de terça e quarta e para a reunião de gestão.', `<label class="sr" for="f-mes">Mês</label><select class="inp w-auto" id="f-mes" data-f="mes">${mesesOpts(mes)}</select><button class="btn" data-act="csv" data-v="${mes}">Baixar planilha (CSV)</button>`)}
    ${blocoPauta(TODAY_WD === 1)}
    ${!dados ? '<p class="muted">Carregando o relatório…</p>' : !dados.length ? '<p class="callout">Ainda não há dias completos neste mês. O relatório conta até ontem.</p>' : `
    <div class="grid kpis">${kpi('No prazo no mês', rateTxt(tot.prev ? tot.ok / tot.prev : null), `${tot.ok} de ${tot.prev} checklists`, rateKind(tot.prev ? tot.ok / tot.prev : null))}${kpi('Com atraso', tot.late)}${kpi('Não feitos', tot.miss, '', tot.miss ? 'bad' : '')}</div>
    <section class="panel"><div class="panel-h"><h2>Por pessoa</h2></div><div class="tw"><table class="t">${head}<tbody>${Object.entries(porP).sort((a, b) => (person(a[0])?.ordem ?? 0) - (person(b[0])?.ordem ?? 0)).map(([id, x]) => linha(`<span class="who-cell">${av(person(id))}${esc(person(id)?.name || id)}</span>`, x)).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-h"><h2>Por checklist</h2></div><div class="tw"><table class="t">${head}<tbody>${Object.entries(porR).sort((a, b) => (a[1].ok / a[1].prev) - (b[1].ok / b[1].prev)).map(([id, x]) => linha(esc(S.allTpls.find(t => t.id === id)?.title || id), x)).join('')}</tbody></table></div>
      <p class="small muted pager-info">Ordenado do checklist com menos entregas no prazo para o com mais.</p></section>`}`;
}
const REL = {};
async function carregarRelatorio(mes){
  if (REL[mes] === null) return; REL[mes] = null;
  const [y, m] = mes.split('-').map(Number), fim = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const {data, error} = await sb.rpc('relatorio', {de:mes + '-01', ate:fim});
  if (error) { delete REL[mes]; toast(esc(error.message)); return; }
  REL[mes] = data || []; if (S.ui.view === 'relatorios') render();
}

/* ---------- Equipe e ausências ---------- */
const mailIn = p => canEdit() ? `<label class="sr" for="em-${p.id}">E-mail de ${esc(p.name)}</label><input class="inp mail" type="email" id="em-${p.id}" data-email="${p.id}" value="${esc(p.email)}" placeholder="sem acesso">` : esc(p.email || 'sem acesso');

function blocoAusencias(){
  const fut = S.ausencias.filter(a => a.fim >= TODAY_ISO), fech = S.fechados.filter(f => f.data >= TODAY_ISO);
  return `<section class="panel" id="ausencias"><div class="panel-h"><h2>Ausências e dias sem expediente</h2><p>atestado, falta, férias, feriado</p></div>
    <div class="grid cols-eq">
      <div class="stack gap8"><p class="day-h">Ausências</p>
        ${fut.length ? fut.map(a => `<div class="rem"><span class="grow"><b>${esc(person(a.pessoa_id)?.name)}</b> · ${dLabelISO(a.inicio)}${a.fim !== a.inicio ? ` a ${dLabelISO(a.fim)}` : ''}${a.motivo ? ` · ${esc(a.motivo)}` : ''}<span class="small muted block">${a.substituto ? `Cobre: ${esc(person(a.substituto)?.name)}` : 'Sem substituto: as tarefas saem do dia'}</span></span>${canManage() ? `<button class="linkbtn small" data-act="ausDel" data-id="${a.id}">Remover</button>` : ''}</div>`).join('') : '<p class="small muted">Ninguém ausente nos próximos dias.</p>'}
        ${canManage() ? `<form class="stack gap8 mini-form" data-form="aus"><div class="form-grid">
          <div class="field"><label for="au-p">Quem</label><select class="inp" id="au-p" required>${pessoaOpts('')}</select></div>
          <div class="field"><label for="au-i">De</label><input class="inp" type="date" id="au-i" value="${TODAY_ISO}" required></div>
          <div class="field"><label for="au-f">Até</label><input class="inp" type="date" id="au-f" value="${TODAY_ISO}" required></div>
          <div class="field"><label for="au-s">Quem cobre</label><select class="inp" id="au-s">${pessoaOpts('', 'Ninguém')}</select></div>
          <div class="field span2"><label for="au-m">Motivo</label><input class="inp" id="au-m" placeholder="Ex.: atestado médico"></div></div>
          <p class="small muted">Os checklists ainda não começados passam para quem cobre. Se a gerente faltar, quem cobre ganha as funções dela no dia.</p>
          <div><button class="btn sm primary">Registrar ausência</button></div></form>` : ''}</div>
      <div class="stack gap8"><p class="day-h">Dias sem expediente</p>
        ${fech.length ? fech.map(f => `<div class="rem"><span class="grow"><b>${dLabelISO(f.data)}</b>${f.motivo ? ` · ${esc(f.motivo)}` : ''}</span>${canManage() ? `<button class="linkbtn small" data-act="reabrir" data-v="${f.data}">Reabrir</button>` : ''}</div>`).join('') : '<p class="small muted">Nenhum dia fechado à frente.</p>'}
        ${canManage() ? `<form class="stack gap8 mini-form" data-form="fechar"><div class="form-grid">
          <div class="field"><label for="fd-d">Data</label><input class="inp" type="date" id="fd-d" value="${TODAY_ISO}" required></div>
          <div class="field span2"><label for="fd-m">Motivo</label><input class="inp" id="fd-m" placeholder="Ex.: feriado de Natal"></div></div>
          <p class="small muted">Num dia fechado o app não cria checklists, e os que não começaram saem do dia.</p>
          <div><button class="btn sm">Fechar o dia</button></div></form>` : ''}</div>
    </div></section>`;
}

function pgEquipe(){
  const sel = S.ui.selP;
  const rows = team().map(p => {
    const d = dayStats(i => i.who === p.id), a = histAgg(x => x.byP[p.id]), pr = pendingReads(p.id).length;
    return `<tr class="${sel === p.id ? 'sel' : ''}"><td><button class="who-cell linkrow" data-act="selP" data-v="${p.id}">${av(p)}<span><b>${esc(p.name)}</b><span class="small muted block">${roleL(p)} · ${esc(p.turno)}${p.folga != null ? ` · folga ${WEEK[p.folga]}` : ''}</span>${statusChips(p.id)}</span></button></td>
      <td class="num">${d.done} de ${d.total}${d.atrasado ? ` ${chip(d.atrasado + ' atrasado', 'bad')}` : ''}</td>
      <td class="num"><span class="${rateKind(a.rate)}-t"><b>${rateTxt(a.rate)}</b></span></td><td class="num">${a.late}</td><td class="num">${a.miss}</td>
      <td>${dots(p.id)}</td><td class="num">${streak(p.id)} ${streak(p.id) === 1 ? 'dia' : 'dias'}</td>
      <td>${pr ? chip(pr + ' pendente', 'warn') : chip('em dia', 'good')}</td><td>${mailIn(p)}</td></tr>`;
  }).join('');
  const p = sel && person(sel), inativos = S.people.filter(x => x.active === false);
  return `${ph(eyebrow(), 'Equipe e ausências', 'Quem cumpre a rotina no prazo, quem está ausente e quem ainda não assinou os POPs. O e-mail é o que a pessoa usa para entrar no app.')}
    <section class="panel"><div class="tw"><table class="t"><thead><tr><th>Pessoa</th><th class="num">Hoje</th><th class="num">No prazo, 4 sem.</th><th class="num">Com atraso</th><th class="num">Não feitos</th><th>Últimos 24 dias</th><th class="num">Sequência</th><th>Termo de ciência</th><th>E-mail de acesso</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="small muted pager-info">Cada tracinho é um dia: verde, tudo no prazo; âmbar, algo com atraso; vermelho, algo não feito. Toque no nome para ver e editar a pessoa.</p></section>
    ${p ? fichaPessoa(p) + fichaCultura(p) : ''}
    ${blocoAusencias()}
    ${blocoAcessosDev()}
    ${canEdit() ? `<details class="panel" id="det-nova-pessoa"><summary class="sum">Incluir pessoa na equipe</summary>
      <form class="stack gap8" data-form="pessoa"><div class="form-grid">
        <div class="field"><label for="np-nome">Nome</label><input class="inp" id="np-nome" required></div>
        <div class="field"><label for="np-papel">Cargo</label><select class="inp" id="np-papel"><option value="barbeiro">Barbeiro</option><option value="atendente">Atendente</option><option value="gerente">Gerente</option></select></div>
        <div class="field"><label for="np-rot">Função</label><input class="inp" id="np-rot" placeholder="Ex.: Barbeiro de fechamento"></div>
        <div class="field"><label for="np-turno">Turno</label><input class="inp" id="np-turno" placeholder="Ex.: fechamento, 10:50"></div>
        <div class="field"><label for="np-folga">Folga</label><select class="inp" id="np-folga"><option value="">Não definida</option>${DOW.map(d => `<option value="${d}">${WEEK_FULL[d]}</option>`).join('')}</select></div>
        <div class="field"><label for="np-email">E-mail de acesso</label><input class="inp" type="email" id="np-email"></div></div>
        <div><button class="btn primary">Incluir</button></div></form></details>` : ''}
    ${inativos.length ? `<details class="panel"><summary class="sum">Pessoas desligadas (${inativos.length})</summary><div class="stack gap6">${inativos.map(x => `<div class="rem"><span class="grow">${esc(x.name)} · ${roleL(x)}</span>${canEdit() ? `<button class="linkbtn small" data-act="reativar" data-id="${x.id}">Reativar</button>` : ''}</div>`).join('')}</div></details>` : ''}`;
}
function fichaPessoa(p){
  const ed = canEdit();
  return `<section class="panel"><div class="panel-h"><div class="row nowrap gap8">${av(p, true)}<div><h2>${esc(p.name)}</h2><p>${roleL(p)} · ${esc(p.turno)}</p></div></div><button class="btn sm" data-act="selP" data-v="">Fechar</button></div>
    ${ed ? `<form class="form-grid ficha" data-form="ficha" data-id="${p.id}">
      <div class="field"><label for="fp-nome">Nome</label><input class="inp" id="fp-nome" value="${esc(p.name)}"></div>
      <div class="field"><label for="fp-papel">Cargo</label><select class="inp" id="fp-papel">${['barbeiro','atendente','gerente'].map(x => `<option value="${x}" ${p.role === x ? 'selected' : ''}>${ROLE[x]}</option>`).join('')}</select></div>
      <div class="field"><label for="fp-full">Nome completo</label><input class="inp" id="fp-full" value="${esc(p.fullName || '')}"></div>
      <div class="field"><label for="fp-rot">Função</label><input class="inp" id="fp-rot" value="${esc(p.label || '')}"></div>
      <label class="toggle"><input type="checkbox" id="fp-parc" ${p.parceiro ? 'checked' : ''}><span><b>Profissional-parceiro</b><span>Envia nota fiscal todo mês (Salão-Parceiro).</span></span></label>
      <div class="field"><label for="fp-turno">Turno</label><input class="inp" id="fp-turno" value="${esc(p.turno)}"></div>
      <div class="field"><label for="fp-folga">Folga</label><select class="inp" id="fp-folga"><option value="">Não definida</option>${DOW.map(d => `<option value="${d}" ${p.folga === d ? 'selected' : ''}>${WEEK_FULL[d]}</option>`).join('')}</select></div>
      <div class="field row gap6 ficha-acts"><button class="btn sm primary">Salvar</button><button type="button" class="btn sm no" data-act="desligar" data-id="${p.id}">Desligar</button></div></form>` : ''}
    <div class="grid cols-eq"><div class="stack gap6"><p class="day-h">Checklists de hoje</p>${S.inst.filter(i => i.who === p.id).sort((a, b) => a.start - b.start).map(i => instCard(i, {who:false})).join('') || '<p class="small muted">Nenhum hoje.</p>'}</div>
    <div class="stack gap6"><p class="day-h">Ocorrências</p>${S.occ.filter(o => o.who === p.id && occVis(o)).map(o => occCard(o)).join('') || '<p class="muted small">Nenhuma ocorrência recente.</p>'}
    <p class="day-h">Termo de ciência dos POPs</p><div class="row gap6">${S.pops.filter(x => popPeople(x).some(y => y.id === p.id)).map(x => { const ok = (x.reads[p.id] || 0) >= x.version; return `<button class="chip ${ok ? 'good' : 'warn'} linkchip" data-act="pop" data-id="${x.id}">${x.id} ${ok ? 'assinado' : 'pendente'}</button>`; }).join('')}</div></div></div></section>`;
}

/* ---------- Gerência e regras ---------- */
function pgGerente(){
  const g = gerenteStats(), j = S.people.find(p => p.role === 'gerente'), log = gerenteLog(), r = S.rules, d = dis();
  const ownRate = g.own.length ? g.ownOk.length / g.own.length : null;
  return `${ph(eyebrow(), 'Gerência e regras', `${j ? esc(j.name) : 'A gerente'} garante a rotina na loja. O sistema avisa ela no celular do que conferir e de quem cobrar, e mede se os avisos foram atendidos.`)}
    <div class="grid kpis">
      ${kpi('Lembretes atendidos', rateTxt(g.rate), `${g.got} de ${g.exp} até agora`, rateKind(g.rate), bar(g.rate, rateKind(g.rate), r.meta))}
      ${kpi('Conferências', `${g.ver.length} de ${g.verList.length}`, g.ver.length ? `${mins(g.verAvg)} em média para conferir (limite ${r.conferir} min)` : 'Nenhuma ainda', g.verAvg > r.conferir ? 'warn' : '')}
      ${kpi('Atrasos cobrados', `${g.nudged.length} de ${g.late.length}`, g.nudged.length ? `${mins(g.nudgeAvg)} em média depois do prazo` : 'Nenhum atraso até agora', g.nudged.length < g.late.length ? 'warn' : '')}
      ${kpi('Rondas', `${g.ronDone.length} de ${g.ron.length}`, g.ronItems.length ? `${g.ronOk} de ${g.ronItems.length} itens conformes` : 'Nenhuma feita ainda')}
      ${kpi('Checklists dela', `${g.ownOk.length} de ${g.own.length}`, 'no prazo, dos que já venceram', rateKind(ownRate))}
    </div>
    ${roNote()}
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>O que a gerência fez hoje</h2><p>${log.length} registros</p></div>
        ${log.length ? `<ol class="log">${log.map(e => `<li class="${e.k}"><span class="num">${hm(e.at)}</span><div><b>${esc(e.t)}</b><p class="small muted">${esc(e.s)}</p></div></li>`).join('')}</ol>` : '<p class="muted">Nada ainda.</p>'}</section>
      <div class="stack gap14">
        <section class="panel"><div class="panel-h"><h2>Regras</h2><p>valem para todos os dias</p></div>
          <div class="stack gap14">
            <div class="rule"><div><b>Início da operação</b><p class="small muted">A partir desta data e hora o app cria os checklists</p></div><span class="row nowrap gap6"><input class="inp w-auto" type="date" id="r-inicio" data-rule="inicio" data-kind="str" value="${r.inicio || ''}" ${d}><input class="inp w-auto" type="time" id="r-inicioh" data-rule="inicioHora" data-kind="str" value="${r.inicioHora || ''}" ${d}></span></div>
            <div class="rule"><div><b>Aviso antes da ronda</b><p class="small muted">Minutos antes do horário sorteado</p></div><div class="affix w-num"><input type="number" id="r-antes" data-rule="antes" value="${r.antes}" min="0" ${d}><span>min</span></div></div>
            <div class="rule"><div><b>Escalar atraso aos sócios</b><p class="small muted">Se o checklist continuar atrasado depois de</p></div><div class="affix w-num"><input type="number" id="r-escalar" data-rule="escalar" value="${r.escalar}" min="5" ${d}><span>min</span></div></div>
            <div class="rule"><div><b>Prazo para conferir</b><p class="small muted">Depois que a pessoa conclui, a gerente confere em até</p></div><div class="affix w-num"><input type="number" id="r-conferir" data-rule="conferir" value="${r.conferir}" min="5" ${d}><span>min</span></div></div>
            <div class="rule"><div><b>Semana de aprendizado até</b><p class="small muted">Até esta data, atraso não chega aos sócios e não entra na média</p></div><input class="inp w-auto" type="date" id="r-aprend" data-rule="aprendizadoAte" data-kind="str" value="${r.aprendizadoAte || ''}" ${d}></div>
            <div class="rule"><div><b>Conferência por amostra</b><p class="small muted">Parte dos checklists que a gerente confere, por sorteio. Com item não feito, sempre confere.</p></div><div class="affix w-num"><input type="number" id="r-amostra" data-rule="amostra" data-kind="amostra" value="${Math.round(r.amostra * 100)}" min="10" max="100" step="5" ${d}><span>%</span></div></div>
            <label class="toggle"><input type="checkbox" id="r-escsoc" data-rule="escalarSocios" data-kind="bool" ${r.escalarSocios ? 'checked' : ''} ${d}><span><b>Avisar também o sócio técnico</b><span>Atraso escalado chega também ao Robson, além do Victor.</span></span></label>
            <div class="rule"><div><b>Meta de conformidade</b><p class="small muted">Abaixo disso o número fica âmbar ou vermelho</p></div><div class="affix w-num"><input type="number" id="r-meta" data-rule="meta" data-kind="pct" value="${Math.round(r.meta * 100)}" min="50" max="100" ${d}><span>%</span></div></div>
            <label class="toggle"><input type="checkbox" id="r-rondas" data-rule="rondas" data-kind="bool" ${r.rondas ? 'checked' : ''} ${d}><span><b>Rondas surpresa</b><span>O horário da ronda é sorteado até 30 min antes ou depois do previsto, sem cair em reunião da gerente. A equipe não vê.</span></span></label>
            <div class="rule"><div><b>Resumo do dia aos sócios</b><p class="small muted">Horário da notificação</p></div><input class="inp w-auto" type="time" id="r-resumo" data-rule="resumo" data-kind="str" value="${r.resumo}" ${d}></div>
          </div></section>
        <section class="panel"><div class="panel-h"><h2>Notas fiscais</h2><p>Salão-Parceiro</p></div>
          <div class="stack gap14">
            <p class="small"><b>Notas quinzenais:</b> do dia 1 ao 15, nota até o dia 16; do dia 16 ao fim do mês, nota até o dia 1º. A gestão informa o valor de cada barbeiro em Notas fiscais.</p>
            <label class="toggle"><input type="checkbox" id="r-nfdas" data-rule="nfDas" data-kind="bool" ${r.nfDas ? 'checked' : ''} ${d}><span><b>Pedir o comprovante do DAS do MEI</b><span>Vence dia 20. Mostra que o MEI do parceiro está em dia.</span></span></label>
            <div class="field"><label for="r-nfrazao">Razão social da Hype (tomador)</label><input class="inp" id="r-nfrazao" data-rule="nfRazao" data-kind="str" value="${esc(r.nfRazao)}" ${d}></div>
            <div class="field"><label for="r-nfcnpj">CNPJ da Hype</label><input class="inp" id="r-nfcnpj" data-rule="nfCnpj" data-kind="str" value="${esc(r.nfCnpj)}" inputmode="numeric" ${d}></div>
            <div class="field"><label for="r-nfdesc">Descrição sugerida do serviço ({periodo} vira o período da nota)</label><textarea class="inp" id="r-nfdesc" data-rule="nfDesc" data-kind="str" rows="3" ${d}>${esc(r.nfDesc)}</textarea></div>
          </div></section>
        <section class="panel"><div class="panel-h"><h2>Lembretes fixos</h2><p>chegam no celular da gerente</p></div>
          ${canEdit() ? editorLembretes() : `<div class="stack gap6">${S.reminders.map(x => `<div class="rem ${x.on ? '' : 'off'}"><span class="num"><b>${x.at}</b></span><span class="grow">${esc(x.text)}</span>${vis(S.remDone[x.id]) ? chip('feito ' + hm(S.remDone[x.id]), 'good') : toMin(x.at) <= NOW() && x.on ? chip('pendente', 'warn') : ''}
            <label class="toggle sm" title="Ativo"><input type="checkbox" id="rem-${x.id}" data-rem="${x.id}" ${x.on ? 'checked' : ''} ${d}><span class="sr">Ativo</span></label></div>`).join('')}</div>`}
          ${canEdit() ? `<form class="row gap6 add-rem" data-form="rem"><label class="sr" for="nr-at">Hora</label><input class="inp w-auto" type="time" id="nr-at" value="16:00" required><label class="sr" for="nr-t">Lembrete</label><input class="inp grow" id="nr-t" placeholder="Ex.: Conferir o estoque de lâminas" required><button class="btn sm primary">Adicionar</button></form>` : ''}</section>
      </div>
    </div>`;
}

/* ---------- Biblioteca de POPs ---------- */
const linhas = arr => (arr || []).map(s => typeof s === 'string' ? s : (s.crit ? '!' : '') + s.t).join('\n');
function editorPop(p){
  return `<form class="stack gap8" data-form="editpop" data-id="${p.id}">
    <div class="form-grid"><div class="field span2"><label for="ep-t">Título</label><input class="inp" id="ep-t" value="${esc(p.title)}"></div>
      <div class="field"><label for="ep-q">Quem faz</label><input class="inp" id="ep-q" value="${esc(p.who || '')}"></div>
      <div class="field"><label for="ep-f">Quando</label><input class="inp" id="ep-f" value="${esc(p.freq || '')}"></div>
      <div class="field"><label for="ep-d">A quem recorrer</label><input class="inp" id="ep-d" value="${esc(p.owner || '')}"></div></div>
    ${editorPopExtras(p)}
    <div class="field"><label for="ep-o">Objetivo</label><textarea class="inp" id="ep-o" rows="2">${esc(p.objective || '')}</textarea></div>
    <div class="field"><label for="ep-m">Materiais, um por linha</label><textarea class="inp" id="ep-m" rows="3">${esc(linhas(p.materials))}</textarea></div>
    <div class="field"><label for="ep-s">Passo a passo, um por linha. Comece com ! os passos críticos.</label><textarea class="inp" id="ep-s" rows="9">${esc(linhas(p.steps))}</textarea></div>
    <div class="field"><label for="ep-qa">Padrão de qualidade, um por linha</label><textarea class="inp" id="ep-qa" rows="3">${esc(linhas(p.quality))}</textarea></div>
    <div class="field"><label for="ep-e">O que não pode acontecer, um por linha</label><textarea class="inp" id="ep-e" rows="3">${esc(linhas(p.errors))}</textarea></div>
    <div class="row gap6"><button class="btn primary" name="modo" value="versao">Publicar versão ${p.version + 1}</button><button class="btn" name="modo" value="correcao">Salvar só uma correção</button><button type="button" class="btn" data-act="popEditar" data-v="">Cancelar</button></div>
    <p class="small muted">Nova versão pede que todos do cargo assinem o termo de ciência de novo. Correção (erro de digitação, por exemplo) mantém a versão e as assinaturas.</p></form>`;
}
function pgPops(){
  if (S.ui.pop && pop(S.ui.pop)) {
    const p = pop(S.ui.pop), editando = S.ui.popEdit === p.id && canEdit();
    return `<div class="row"><button class="btn sm" data-act="popClose">${icon('voltar', 'ni xs')}Biblioteca</button></div>
      ${ph(eyebrow(), `${p.id} · ${esc(p.title)}`, '', canEdit() && !editando ? `<button class="btn primary" data-act="popEditar" data-v="${p.id}">Editar POP</button>` : '')}
      <section class="panel">${editando ? editorPop(p) : popBody(p, me())}</section>
      ${p.versions.length ? `<section class="panel"><div class="panel-h"><h2>Versões anteriores</h2><p>guardadas a cada nova publicação</p></div><div class="stack gap6">${p.versions.map(v => `<details class="ver"><summary><b>Versão ${v.versao}</b> <span class="small muted">substituída em ${dLabelISO(recife(Date.parse(v.publicado_em)).toISOString().slice(0, 10))}${v.por ? ` por ${esc(first(person(v.por)))}` : ''}</span></summary><ol class="steps sm">${(v.conteudo.passos || []).map(s => `<li><span>${esc(s.t)}</span>${s.crit ? '<span class="tag crit">crítico</span>' : ''}</li>`).join('')}</ol></details>`).join('')}</div></section>` : ''}`;
  }
  return `${ph(eyebrow(), 'Biblioteca de POPs', `POP HYPE e as versões publicadas aqui. ${S.pops.length} seções, do abrir ao fechar. A equipe assina o termo de ciência de cada versão no app.`)}
    <section class="panel cultura"><div class="panel-h"><h2>Cultura HYPE</h2><p>por que fazemos as coisas do jeito HYPE</p></div>
      <div class="grid cols-eq"><div class="stack gap4"><p class="eyebrow">Missão</p><p>${esc(CULTURA.missao)}</p></div><div class="stack gap4"><p class="eyebrow">Visão</p><p>${esc(CULTURA.visao)}</p></div></div>
      <div class="valores">${CULTURA.valores.map(([n, d, f], k) => `<div class="valor"><span class="cid">0${k + 1}</span><b>${n}</b><span class="small">${esc(d)}</span><span class="small muted">"${esc(f)}"</span></div>`).join('')}</div></section>
    ${canEdit() ? `<details class="panel newpop" id="det-novo-pop"><summary>Novo POP</summary>
      <form class="stack gap8" data-form="pop"><div class="form-grid">
        <div class="field span2"><label for="np-t">Título</label><input class="inp" id="np-t" required placeholder="Ex.: Higienização das ferramentas"></div>
        <div class="field"><label for="np-a">Área</label><select class="inp" id="np-a">${Object.entries(AREAS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
        <div class="field"><label for="np-r">Quem faz</label><select class="inp" id="np-r"><option value="barbeiro">Barbeiros</option><option value="atendente">Atendentes</option><option value="gerente">Gerente</option><option value="todos">Todos</option></select></div>
        <div class="field"><label for="np-f">Quando</label><input class="inp" id="np-f" placeholder="Ex.: A cada cliente"></div></div>
        <div class="field"><label for="np-o">Objetivo</label><input class="inp" id="np-o" placeholder="O que esse procedimento garante?"></div>
        <div class="field"><label for="np-s">Passo a passo, um por linha. Comece com ! os passos críticos.</label><textarea class="inp" id="np-s" rows="5"></textarea></div>
        <div><button class="btn primary">Publicar POP</button></div></form></details>` : ''}
    <div class="grid pop-grid">${S.pops.map(p => {
      const ppl = popPeople(p), read = ppl.filter(x => (p.reads[x.id] || 0) >= p.version).length;
      return `<button class="pop-card" data-act="pop" data-id="${p.id}"><span class="row between nowrap"><span class="cid">${p.id} · ${AREAS[p.area] || p.area}</span>${chip('v' + p.version)}</span><b>${esc(p.title)}</b><span class="small muted">${esc(p.who)}</span><span class="small muted">${esc(p.freq)}</span>
        <span class="row between nowrap small"><span>${p.steps.length} passos${p.steps.some(s => s.crit) ? ` · ${p.steps.filter(s => s.crit).length} críticos` : ''}</span><span class="${read < ppl.length ? 'warn-t' : 'good-t'}">${read} de ${ppl.length} assinaram</span></span></button>`;
    }).join('')}</div>`;
}

/* ---------- Rotina ---------- */
function pgRotina(){
  const d = dis(), ed = canEdit();
  const rows = S.allTpls.filter(t => t.active).flatMap(t => t.slots.map((s, k) => ({t, s, k}))).sort((a, b) => toMin(a.s[0]) - toMin(b.s[0]));
  const diasTxt = (t, s) => { const ds = s[4] || t.days; return (ds.length === 6 ? 'seg a sáb' : ds.length === 5 && !ds.includes(6) ? 'seg a sex' : ds.map(x => WEEK[x]).join(', ')) + (t.every2 ? ', quinzenal' : ''); };
  const whoOpt = (cur, t) => t.each ? `<span class="muted">${Array.isArray(t.each) ? t.each.map(id => first(person(id))).join(' e ') : 'Cada barbeiro presente'}</span>`
    : t.rodizio ? `<span class="muted">Revezamento (escala abaixo)</span>`
    : t.also ? `<span>${[cur.s[2], ...t.also].map(id => first(person(id))).join(' e ')}</span>`
    : `<label class="sr" for="sw-${t.id}-${cur.k}">Responsável</label><select class="inp w-auto" id="sw-${t.id}-${cur.k}" data-slot="${t.id}|${cur.k}|2" ${d}>${pessoaOpts(cur.s[2])}</select>`;
  const rod = S.allTpls.filter(t => t.active && t.rodizio);
  return `${ph(eyebrow(), 'Rotina e checklists', 'A agenda fixa da semana. Toda madrugada o sistema cria os checklists do dia a partir daqui, respeitando folgas, ausências e dias fechados. Mudanças valem a partir de amanhã.')}
    ${roNote()}
    ${blocoTipos()}
    <section class="panel"><div class="tw"><table class="t rot"><thead><tr><th>Janela</th><th>Checklist</th><th>POP</th><th>Responsável</th><th>Dias</th><th class="num">Itens</th><th>Conferência</th>${ed ? '<th><span class="sr">Editar</span></th>' : ''}</tr></thead><tbody>
      ${rows.map(r => `<tr class="${S.ui.rotEdit === r.t.id ? 'sel' : ''}"><td class="nowrap"><label class="sr" for="ss-${r.t.id}-${r.k}">Início</label><input class="inp time" type="time" id="ss-${r.t.id}-${r.k}" data-slot="${r.t.id}|${r.k}|0" value="${r.s[0]}" ${d}> às <label class="sr" for="sd-${r.t.id}-${r.k}">Prazo</label><input class="inp time" type="time" id="sd-${r.t.id}-${r.k}" data-slot="${r.t.id}|${r.k}|1" value="${r.s[1]}" ${d}></td>
        <td>${ed ? `<button class="linkrow" data-act="rotEditar" data-v="${r.t.id}"><b>${esc(r.t.title)}</b></button>` : `<b>${esc(r.t.title)}</b>`}${r.t.kind === 'ronda' ? ` ${chip('ronda', 'acc')}` : r.t.kind === 'reuniao' ? ` ${chip('reunião', 'acc')}` : ''}</td><td><button class="chip linkchip" data-act="pop" data-id="${r.t.pop}">${r.t.pop}</button></td><td>${whoOpt(r, r.t)}</td>
        <td class="small">${diasTxt(r.t, r.s)}</td>
        <td class="num">${r.t.items.length}${r.t.items.some(i => i.photo) ? ` <span class="small muted">· ${r.t.items.filter(i => i.photo).length} com foto</span>` : ''}</td>
        <td>${r.t.verify ? chip('gerente confere', 'good') : chip(r.t.kind === 'ronda' ? 'é a própria conferência' : 'sem conferência')}</td>
        ${ed ? `<td><button class="btn sm" data-act="rotEditar" data-v="${S.ui.rotEdit === r.t.id ? '' : r.t.id}">${S.ui.rotEdit === r.t.id ? 'Fechar' : 'Editar'}</button></td>` : ''}</tr>
        ${ed && S.ui.rotEdit === r.t.id && rows.find(x => x.t.id === r.t.id) === r ? `<tr class="rot-ed"><td colspan="8">${editorRotina(r.t)}</td></tr>` : ''}`).join('')}
    </tbody></table></div>
    ${ed ? '<p class="small muted pager-info">Horário e responsável fixo mudam direto na tabela. Para o resto (nome, tipo, POP, dias, quem faz, conferência, itens e instruções), toque em Editar.</p>' : ''}</section>
    ${S.ui.rotEdit && canEdit() && !rows.some(x => x.t.id === S.ui.rotEdit) ? editorRotina(S.allTpls.find(t => t.id === S.ui.rotEdit)) : ''}
    ${blocoAgenda()}
    <section class="panel"><div class="panel-h"><h2>Escala dos revezamentos</h2><p>quem faz em cada dia da semana</p></div>
      <div class="tw"><table class="t"><thead><tr><th>Tarefa</th>${DOW.map(x => `<th>${WEEK[x]}</th>`).join('')}</tr></thead><tbody>
        ${rod.map(t => `<tr><td><b>${esc(t.title)}</b><span class="small muted block">${t.days.length === 6 ? 'todo dia' : t.days.map(x => WEEK[x]).join(', ')}</span></td>${DOW.map(x => t.days.includes(x)
          ? `<td><label class="sr" for="rz-${t.id}-${x}">${esc(t.title)} ${WEEK_FULL[x]}</label><select class="inp w-auto sm-sel" id="rz-${t.id}-${x}" data-rodizio="${t.id}|${x}" ${d}>${pessoaOpts(t.escala[x] || '', `Padrão: ${first(person(t.slots[0]?.[2]))}`)}</select></td>` : '<td class="muted small">não tem</td>').join('')}</tr>`).join('')}
      </tbody></table></div>
      <p class="small muted pager-info">Sem nome escolhido, vale o responsável padrão. Se a pessoa estiver de folga ou ausente no dia, a tarefa não é criada para ela.</p></section>
    <div class="grid cols-eq">
      <section class="panel"><div class="panel-h"><h2>Turnos e folgas</h2><p>edite em Equipe</p></div><div class="tw"><table class="t"><thead><tr><th>Profissional</th><th>Turno</th><th>Folga</th></tr></thead><tbody>${team().map(p => `<tr><td><span class="who-cell">${av(p)}${esc(p.name)}</span></td><td class="small">${esc(p.turno)}</td><td class="small">${p.folga != null ? WEEK_FULL[p.folga] : 'a definir'}</td></tr>`).join('')}</tbody></table></div>
        <p class="small muted pager-info">${esc(ESCALA.horario)} ${esc(ESCALA.posicoes)}</p></section>
      <section class="panel"><div class="panel-h"><h2>Reuniões</h2><p>POP-10 · acontecem mesmo em dia de folga</p></div><div class="tw"><table class="t"><thead><tr><th>Dia</th><th>Horário</th><th>Reunião</th></tr></thead><tbody>${ESCALA.reunioes.map(r => `<tr><td>${r[0]}</td><td class="nowrap num">${r[1]}</td><td>${esc(r[2])}<span class="small muted block">${esc(r[3])}</span></td></tr>`).join('')}</tbody></table></div></section>
    </div>
    <section class="panel" id="itens"><div class="panel-h"><h2>Itens de cada checklist</h2><p>${ed ? 'Edite o texto, marque foto obrigatória, inclua ou retire itens.' : 'Itens com foto obrigatória e itens críticos.'}</p></div><div class="grid cols-eq">${S.allTpls.map(t => `<div class="tpl-box ${t.active ? '' : 'off'}"><div class="row between nowrap"><b>${esc(t.title)}</b><span class="row nowrap gap6"><span class="cid">${t.pop}</span>${ed ? `<button class="linkbtn small" data-act="rotEditar" data-v="${t.id}">Editar</button><button class="linkbtn small" data-act="rotAtivo" data-id="${t.id}" data-v="${t.active ? '0' : '1'}">${t.active ? 'Pausar' : 'Reativar'}</button>` : ''}</span></div>
      <ol class="steps sm">${t.items.map(it => `<li><span>${ed ? `<label class="sr" for="it-${it.id}">Texto do item</label><input class="inp it-in" id="it-${it.id}" data-item="${it.id}" value="${esc(it.t)}">` : esc(it.t)}${it.crit ? ' <span class="tag crit">crítico</span>' : ''}</span>
        <span class="row nowrap gap6"><label class="ph-toggle ${it.photo ? 'on' : ''}" for="ph-${t.id}-${it.id}"><input type="checkbox" id="ph-${t.id}-${it.id}" data-photo="${t.id}|${it.id}" ${it.photo ? 'checked' : ''} ${d}>${icon('camera', 'ni xs')}foto</label>${ed ? `<button class="linkbtn small" data-act="itemDel" data-id="${it.id}" aria-label="Retirar item">Retirar</button>` : ''}</span></li>`).join('')}</ol>
      ${ed ? `<form class="row gap6" data-form="item" data-id="${t.id}"><label class="sr" for="ni-${t.id}">Novo item</label><input class="inp grow" id="ni-${t.id}" placeholder="Novo item" required><button class="btn sm">Incluir</button></form>` : ''}</div>`).join('')}</div></section>
    ${ed ? `<details class="panel" id="det-nova-rotina"><summary class="sum">Criar checklist novo</summary>
      <form class="stack gap8" data-form="rotina"><div class="form-grid">
        <div class="field span2"><label for="nr-tit">Nome</label><input class="inp" id="nr-tit" required placeholder="Ex.: Conferência do estoque de lâminas"></div>
        <div class="field"><label for="nr-pop">POP</label><select class="inp" id="nr-pop">${S.pops.map(p => `<option value="${p.id}">${p.id} · ${esc(p.title)}</option>`).join('')}</select></div>
        <div class="field"><label for="nr-ini">Início</label><input class="inp" type="time" id="nr-ini" value="10:00" required></div>
        <div class="field"><label for="nr-fim">Prazo</label><input class="inp" type="time" id="nr-fim" value="10:30" required></div>
        <div class="field"><label for="nr-resp">Responsável</label><select class="inp" id="nr-resp">${pessoaOpts('')}</select></div></div>
        <fieldset class="dias"><legend class="small muted">Dias</legend>${DOW.map(x => `<label class="toggle sm"><input type="checkbox" name="nr-dia" value="${x}" checked><span>${WEEK[x]}</span></label>`).join('')}</fieldset>
        <label class="toggle"><input type="checkbox" id="nr-conf" checked><span><b>A gerente confere</b></span></label>
        <div class="field"><label for="nr-itens">Itens, um por linha. Comece com ! os críticos e com # os que exigem foto.</label><textarea class="inp" id="nr-itens" rows="4" required></textarea></div>
        <div><button class="btn primary">Criar checklist</button></div></form></details>` : ''}`;
}

/* ---------- Notas fiscais do Salão-Parceiro ---------- */
