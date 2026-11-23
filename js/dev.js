/* =========================================================
   Hype POP · acesso DEV (sistemas@hypebarbearia.com)
   Ver o app como qualquer pessoa da equipe, só leitura; hora simulada;
   diagnóstico do sistema; aviso de teste; limpeza do app no aparelho.
   No servidor o DEV lê tudo e não altera nada de gestão (migração 020).
   ========================================================= */
const devVendo = () => !!S?.ui?.dev && S.ui.user !== S.ui.dev;
const devPessoas = () => S.people.filter(p => p.active !== false && p.role !== 'dev');
const devGrupos = () => [
  ['Sócio administrador', 'Edita tudo: rotinas, POPs, regras, pessoas. Vê o Modo TV.', devPessoas().filter(p => p.role === 'socio')],
  ['Sócio técnico', 'Dois modos no mesmo login: app de barbeiro e painel dos sócios (só leitura).', devPessoas().filter(p => p.socio && p.role !== 'socio')],
  ['Gerência', 'Tela Agora, conferência, ronda, equipe, ausências e ocorrências.', devPessoas().filter(p => p.role === 'gerente')],
  ['Barbeiros parceiros', 'Tela Hoje, checklists, POPs, histórico e notas fiscais no Perfil.', devPessoas().filter(p => p.role === 'barbeiro' && !p.socio)],
  ['Atendentes', 'Tela Hoje, checklists, POPs e histórico.', devPessoas().filter(p => p.role === 'atendente')],
];
const hmDev = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/* ---------- Barra fixa no topo, em todas as telas do DEV ---------- */
function barraDev(){
  let bar = document.getElementById('devbar');
  if (!S?.ui?.dev) { bar?.remove(); document.body.classList.remove('devon'); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'devbar'; document.body.prepend(bar); }
  document.body.classList.add('devon');
  const alvo = person(S.ui.user), vendo = devVendo();
  const modo = vendo && alvo?.socio && alvo.role !== 'socio' ? (S.ui.mode === 'socio' ? ' · painel dos sócios' : ' · app de barbeiro') : '';
  bar.classList.toggle('sim', !!SIM);
  bar.innerHTML = `<span class="dv-tag">${SIM ? 'SIMULADOR' : 'DEV'}</span>
    <label class="sr" for="dev-ver">Ver como</label>
    <select id="dev-ver" data-devver="1"><option value="">Painel DEV</option>${devGrupos().map(([g, , ps]) => ps.length ? `<optgroup label="${esc(g)}">${ps.map(p => `<option value="${p.id}" ${S.ui.user === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>` : '').join('')}</select>
    <span class="dv-info">${SIM ? `dia fictício${vendo ? ` · como <b>${esc(alvo?.name || '')}</b>${modo}` : ''} · <b>nada vai para o banco</b>` : vendo ? `vendo como <b>${esc(alvo?.name || '')}</b>${modo} · <b>só leitura</b>` : 'painel de desenvolvimento'}</span>
    <label class="dv-hora ${S.ui.devHora != null ? 'on' : ''}"><span>Hora</span><input type="time" id="dev-hora" data-devhora="1" value="${hmDev(S.ui.devHora ?? nowMin())}"></label>
    ${S.ui.devHora != null ? '<button data-act="devHoraReal">hora real</button>' : ''}
    ${SIM ? '<button data-act="simReiniciar">Reiniciar dia</button><button data-act="simSair">Sair do simulador</button>' : ''}
    ${vendo ? '<button data-act="devVer" data-id="">Painel DEV</button>' : ''}`;
}

/* ---------- Painel DEV ---------- */
let DEV_VERSAO = null;
function renderDev(){
  const d = S.devDiag;
  if (DEV_VERSAO === null) { DEV_VERSAO = '…'; fetch('js/main.js', {method:'HEAD', cache:'no-store'}).then(r => { DEV_VERSAO = r.headers.get('last-modified') || 'desconhecida'; if (!devVendo()) render(); }).catch(() => { DEV_VERSAO = 'sem internet'; }); }
  const cartao = p => { const list = S.inst.filter(i => i.who === p.id), st = dayStats(i => i.who === p.id);
    const botoes = p.socio && p.role !== 'socio'
      ? `<button class="btn sm primary" data-act="devVer" data-id="${p.id}" data-mode="app">App de barbeiro</button><button class="btn sm" data-act="devVer" data-id="${p.id}" data-mode="socio">Painel dos sócios</button>`
      : `<button class="btn sm primary" data-act="devVer" data-id="${p.id}">Ver como ${esc(p.name)}</button>`;
    return `<div class="dv-p">${av(p)}<div class="grow"><b>${esc(p.fullName || p.name)}</b><span class="small muted block">${roleL(p)}${p.folga != null ? ` · folga ${WEEK[p.folga]}` : ''} · hoje: ${list.length ? `${st.done} de ${list.length} feitos${st.atrasado ? `, ${st.atrasado} atrasado` : ''}` : 'sem checklists'}</span>${statusChips(p.id)}</div><div class="btn-row">${botoes}</div></div>`; };
  const tabela = (head, rows) => rows.length ? `<div class="tw"><table class="t"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Nada para mostrar.</p>';
  const quando = t => t ? new Date(t).toLocaleString('pt-BR', {timeZone:'America/Recife', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—';
  const diag = !d ? '<p class="small muted">Toque em Atualizar para ler o estado do sistema agora.</p>' : `
    <div class="grid kpis">${kpi('Checklists hoje', `${d.concluidos_hoje} de ${d.checklists_hoje}`, 'concluídos', d.checklists_hoje ? '' : 'bad')}
      ${kpi('Avisos enviados', d.avisos.enviados_24h, 'nas últimas 24 h')}${kpi('Avisos presos', d.avisos.presos, 'há mais de 15 min', d.avisos.presos ? 'bad' : 'good')}
      ${kpi('Erros no app', (d.erros || []).length, 'últimos registrados', (d.erros || []).length ? 'warn' : 'good')}</div>
    <p class="day-h">Tarefas automáticas</p>
    ${tabela(['Tarefa', 'Agenda (UTC)', 'Última vez', 'Resultado', 'Falhas 24 h'], (d.tarefas || []).map(t => [esc(t.job.replace('hype_pop_', '')), `<code>${esc(t.quando)}</code>`, quando(t.ultima), t.ultimo_status === 'succeeded' ? chip('ok', 'good') : chip(esc(t.ultimo_status || '—'), 'bad'), t.falhas_24h ? chip(t.falhas_24h, 'bad') : '0']))}
    <p class="day-h">Últimos avisos</p>
    ${tabela(['Para', 'Aviso', 'Criado', 'Enviado'], (d.avisos.ultimos || []).map(n => [esc(person(n.pessoa_id)?.name || n.pessoa_id), esc(n.titulo), quando(n.criado_em), n.enviado_em ? quando(n.enviado_em) : chip('pendente', 'warn')]))}
    <p class="small muted">Respostas do servidor de envio nas últimas 24 h: ${(d.envio_http_24h || []).map(h => `${h.status_code ?? 'sem resposta'} (${h.c})`).join(', ') || 'nenhuma'}.</p>
    <p class="day-h">Acessos e aparelhos</p>
    ${tabela(['Pessoa', 'Último acesso', 'Aparelhos com aviso'], (d.acessos || []).map(a => [esc(a.nome), a.ultimo_acesso ? quando(a.ultimo_acesso) : chip('nunca entrou', 'warn'), (d.aparelhos || []).find(x => x.pessoa_id === a.pessoa_id)?.n || '0']))}
    <p class="day-h">Erros registrados pelo app</p>
    ${tabela(['Quando', 'Quem', 'Mensagem', 'Onde'], (d.erros || []).map(e => [quando(e.em), esc(person(e.pessoa_id)?.name || '—'), esc(e.msg), esc(e.ctx || '')]))}`;
  return `${ph('Acesso DEV · sistemas@hypebarbearia.com', 'Painel de desenvolvimento', 'Veja e teste o app exatamente como cada pessoa vê, com os dados reais de hoje. Tudo aqui é só leitura: nenhuma marcação, conferência ou edição é gravada. Para testar os gestos de um checklist sem gravar nada, use o checklist de treino dentro da visão de qualquer pessoa da equipe.')}
    <a class="card soft def-banner" href="versoes.html"><span><b>Versões: produção e teste</b><span class="small muted block">Qual versão está no app da equipe, qual está no teste e o que mudou em cada uma.</span></span><span class="btn sm">Abrir →</span></a>
    <section class="panel"><div class="panel-h"><h2>Ver o app como</h2><p>${devPessoas().length} pessoas</p></div>
      ${devGrupos().filter(([, , ps]) => ps.length).map(([g, dsc, ps]) => `<div class="dv-g"><p class="day-h">${g}</p><p class="small muted">${dsc}</p><div class="stack gap8">${ps.map(cartao).join('')}</div></div>`).join('')}</section>
    <div class="grid cols-2">
      <section class="panel stack gap14"><div class="panel-h"><h2>Hora simulada</h2><p>${S.ui.devHora != null ? `simulando ${hmDev(S.ui.devHora)}` : 'hora real'}</p></div>
        <p class="small">Mude a hora para ver como as telas ficam ao longo do dia: o que abre, o que atrasa, o que entra na fila da gerente. Vale só neste aparelho e só para o desenho das telas; avisos e registros continuam na hora real.</p>
        <div class="row gap6">${['08:30', '09:15', '12:10', '15:40', '19:45', '21:00'].map(h => `<button class="btn sm" data-act="devHora" data-v="${h}">${h}</button>`).join('')}<button class="btn sm" data-act="devHoraReal">Hora real</button></div></section>
      <section class="panel stack gap14"><div class="panel-h"><h2>Testes do aparelho</h2><p>versão do app: ${esc(DEV_VERSAO || '')}</p></div>
        ${S.ui.push ? `<button class="btn primary" data-act="devPush">Enviar um aviso de teste para este aparelho</button>` : `<p class="small">Para testar as notificações, ative-as neste aparelho primeiro.</p><div><button class="btn primary" data-act="push">Ativar notificações</button></div>`}
        <p class="small muted">O aviso sai na hora pelo mesmo caminho dos avisos da equipe.</p>
        <button class="btn" data-act="devLimpar">Limpar o app neste aparelho e recarregar</button>
        <p class="small muted">Apaga a cópia offline e o cache e baixa a versão mais nova do servidor. Útil para conferir uma atualização.</p></section>
    </div>
    ${blocoSimulador()}
    ${blocoRecursos()}
    ${blocoAcessosDev(true)}
    <section class="panel"><div class="panel-h"><h2>Diagnóstico do sistema</h2><p>${d ? `lido às ${quando(d.agora)}` : ''}</p></div>
      <div><button class="btn sm" data-act="devDiag">Atualizar</button></div>${diag}</section>
    <div><button class="btn" data-act="sair">Sair</button></div>`;
}

/* ---------- Ações ---------- */
Object.assign(A, {
  devVer(d){
    const p = d.id && person(d.id);
    S.ui.open = null; S.ui.pop = null; S.ui.lote = false; S.ui.nao = null; S.ui.more = false; S.ui.popEdit = null; S.ui.rotEdit = null; TREINO = null;
    if (!p || p.id === S.ui.dev) { S.ui.user = S.ui.dev; S.ui.verComo = null; }
    else {
      S.ui.user = p.id; S.ui.verComo = p.id;
      if (p.socio && p.role !== 'socio') S.ui.mode = d.mode || 'app';
      S.ui.tab = p.role === 'gerente' ? 'agora' : 'hoje'; S.ui.view = 'painel';
      if (!SIM) sb.rpc('dev_registrar_acesso', {alvo:p.id, modo:'ver', detalhe:d.mode || null}).then(() => {}, () => {});
    }
    uiSave(); render(); window.scrollTo(0, 0);
  },
  devHora(d){ S.ui.devHora = toMin(d.v); S.ui.now = horaAgora(); render(); },
  devHoraReal(){ S.ui.devHora = null; S.ui.now = horaAgora(); render(); },
  async devDiag(){
    if (SIM) { toast('O diagnóstico lê o sistema real: saia do simulador para atualizar.'); return; }
    const {data, error} = await sb.rpc('dev_diagnostico');
    if (error) { toast(esc(error.message)); return; }
    S.devDiag = data; render();
  },
  devPush(){ run(() => rpc('dev_notificar_teste'), 'Aviso de teste enviado. Deve chegar em alguns segundos.'); },
  async devLimpar(){
    try { limparCache(); localStorage.removeItem(UI_KEY); } catch (e) {}
    try { for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
    try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {}
    location.reload();
  },
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.devver) A.devVer({id:el.value});
  if (el.dataset.devhora && el.value) A.devHora({v:el.value});
});

/* ---------- Simulador ---------- */
function blocoSimulador(){
  return `<section class="panel stack gap14 sim-p"><div class="panel-h"><h2>Simulador</h2><p>${SIM ? 'ligado' : 'desligado'}</p></div>
    <p class="small">Um dia fictício montado com as pessoas, a rotina e os POPs reais de hoje. Nele, todas as ações funcionam: marcar e concluir checklists, tirar foto, "Não deu", conferir, refazer, cobrar, ronda, ocorrências, reposição, clientes, ausências e assinatura de POPs. <b>Nada vai para o banco</b>: tudo fica neste aparelho e some ao sair do simulador.</p>
    ${SIM ? `<div class="row gap6"><button class="btn primary" data-act="simReiniciar">Reiniciar o dia</button><button class="btn" data-act="simSair">Sair do simulador</button></div>
      <p class="small muted">Use "Ver o app como" acima para agir como cada pessoa: marque como barbeiro, depois confira como gerente.</p>`
    : `<p class="small muted">Começar o dia às:</p><div class="row gap6">${['09:10', '12:15', '15:40', '19:50'].map(h => `<button class="btn sm ${h === '15:40' ? 'primary' : ''}" data-act="simIniciar" data-v="${h}">${h}</button>`).join('')}</div>`}</section>`;
}

/* ---------- Liga/desliga de recursos ---------- */
function blocoRecursos(){
  const lista = S.recursos || [];
  const op = (r, v, l) => `<option value="${v}" ${r.estado === v ? 'selected' : ''}>${l}</option>`;
  return `<section class="panel stack gap14"><div class="panel-h"><h2>Recursos</h2><p>liga e desliga sem publicar o app</p></div>
    <p class="small">"Liberado" vale para todos. "Só DEV" esconde da equipe e deixa só você ver, inclusive na visão de cada pessoa: é o jeito de testar uma função nova antes de liberar. "Desligado" esconde de todos. ${SIM ? '<b>No simulador a mudança vale só para o teste.</b>' : 'A mudança vale na próxima atualização de cada aparelho.'}</p>
    ${lista.length ? `<div class="stack gap8">${lista.map(r => `<div class="dv-p"><div class="grow"><b>${esc(r.nome)}</b><span class="small muted block">${esc(r.descricao || '')}</span></div>
      <label class="sr" for="rec-${r.chave}">Estado de ${esc(r.nome)}</label><select class="inp w-auto" id="rec-${r.chave}" data-recurso="${r.chave}">${op(r, 'todos', 'Liberado')}${op(r, 'dev', 'Só DEV')}${op(r, 'desligado', 'Desligado')}</select></div>`).join('')}</div>` : '<p class="small muted">Nenhum recurso cadastrado.</p>'}</section>`;
}

/* ---------- Registro de acessos (painel DEV e tela Equipe dos sócios) ---------- */
function blocoAcessosDev(noDev = false){
  const lista = S.devAcessos || [];
  if (!noDev && (!canEdit() || !lista.length)) return '';
  const quando = t => new Date(t).toLocaleString('pt-BR', {timeZone:'America/Recife', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  return `<section class="panel"><div class="panel-h"><h2>${noDev ? 'Registro de acessos' : 'Acessos do DEV'}</h2><p>${noDev ? 'o que fica visível para os sócios' : 'sistemas@hypebarbearia.com, só leitura'}</p></div>
    ${!noDev ? '<p class="small muted">Cada vez que o acesso de desenvolvimento abre a visão de alguém ou o simulador, fica registrado aqui. A visão é só de leitura: nada é alterado.</p>' : ''}
    ${lista.length ? `<div class="stack gap6">${lista.slice(0, noDev ? 15 : 20).map(a => `<div class="rem"><span class="num"><b>${quando(a.em)}</b></span><span class="grow">${a.modo === 'simulador' ? 'Abriu o simulador (dia fictício)' : `Viu o app como <b>${esc(person(a.alvo_id)?.name || a.alvo_id || '—')}</b>${a.detalhe ? ` (${a.detalhe === 'socio' ? 'painel dos sócios' : 'app de barbeiro'})` : ''}`}</span></div>`).join('')}</div>` : '<p class="small muted">Nenhum acesso registrado ainda.</p>'}</section>`;
}

Object.assign(A, {
  async simIniciar(d){
    toast('Montando o dia fictício…');
    try {
      sb.rpc('dev_registrar_acesso', {alvo:'', modo:'simulador', detalhe:d.v}).then(() => {}, () => {});
      const n = await simIniciar(toMin(d.v));
      S.ui.devHora = toMin(d.v); await recarregar(true); toast(`Simulador ligado: ${n} checklists no dia fictício.`);
    } catch (e) { simSair(); toast(esc(e.message)); }
  },
  async simReiniciar(){ const h = S.ui.devHora ?? 940; simSair(); await A.simIniciar({v:hmDev(h)}); },
  async simSair(){ simSair(); S.ui.devHora = null; S.ui.now = horaAgora(); await recarregar(true); toast('Simulador desligado. De volta aos dados reais.'); },
});
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset.recurso) return;
  const k = el.dataset.recurso, v = el.value;
  run(async () => check(await sb.from('recursos').update({estado:v, atualizado_em:new Date().toISOString(), por:S.ui.dev}).eq('chave', k)), 'Recurso atualizado.');
});
