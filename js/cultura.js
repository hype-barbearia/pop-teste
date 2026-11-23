/* =========================================================
   Hype POP · tipos de atividade e cultura por exceção
   - Tarefa, ronda e reunião vivem na Rotina; lembrete é aviso sem itens;
     instrução é o "como fazer" de cada item, que se consulta e não se marca.
   - Cultura não vira checklist: são padrões de comportamento da casa
     (Informações da casa), e a gerência registra só a exceção, um desvio
     ou um destaque, ligado à pessoa. A pessoa vê os próprios registros.
   ========================================================= */
const TIPO_NOME = {check:'Checklist', ronda:'Ronda', reuniao:'Reunião'};
const tipoNome = t => TIPO_NOME[t?.kind] || 'Checklist';
const ehReuniao = t => t?.kind === 'reuniao';
const CUL = {destaque:['Destaque', 'good'], desvio:['Desvio', 'bad']};

const padroes = () => (S.culturaPadroes || []).filter(x => x.ativo);
const padraoTxt = id => (S.culturaPadroes || []).find(x => x.id === id)?.texto || 'Outro';
const culturaDe = (pid, dias = 30) => { const de = isoMinus(dias - 1); return (S.culturaReg || []).filter(r => r.pessoa_id === pid && r.data >= de); };
const contaCultura = regs => ({dest:regs.filter(r => r.tipo === 'destaque').length, desv:regs.filter(r => r.tipo === 'desvio').length});
const resumoCultura = (pid, dias) => { const c = contaCultura(culturaDe(pid, dias));
  return !c.dest && !c.desv ? 'nenhum registro' : [c.dest && `${c.dest} ${c.dest === 1 ? 'destaque' : 'destaques'}`, c.desv && `${c.desv} ${c.desv === 1 ? 'desvio' : 'desvios'}`].filter(Boolean).join(' · '); };
const souGestorApp = () => { const p = me(); return !!p && (p.role === 'gerente' || p.role === 'socio'); };

/* Lista de registros (gestão) */
function listaCultura(regs, vazio = 'Nenhum registro nos últimos 30 dias.'){
  if (!regs.length) return `<p class="small muted">${vazio}</p>`;
  return `<div class="feed cul-l">${regs.map(r => `<div class="feed-i"><div><b>${chip(CUL[r.tipo][0], CUL[r.tipo][1])} ${esc(padraoTxt(r.padrao_id))}</b>
      <span>${r.nota ? esc(r.nota) + ' · ' : ''}${esc(first(person(r.pessoa_id)))} · ${dLabelISO(r.data)} · por ${esc(first(person(r.por)))}</span></div>
      <div class="r">${r.por === S.ui.user || canEdit() ? `<button class="linkbtn small" data-act="culApagar" data-id="${r.id}">Apagar</button>` : ''}</div></div>`).join('')}</div>`;
}

/* Formulário de registro (gerente e sócios); com pessoa fixa na ficha da Equipe */
function formCultura(pid = null){
  const k = pid || 'x';
  return `<form class="stack gap8" data-form="cul" data-p="${pid || ''}">
      <div class="seg2" role="radiogroup" aria-label="Tipo"><label><input type="radio" name="cu-t-${k}" value="destaque" checked><span>Destaque</span></label><label><input type="radio" name="cu-t-${k}" value="desvio"><span>Desvio</span></label></div>
      ${pid ? '' : `<div class="field"><label for="cu-p-${k}">Quem</label><select class="inp" id="cu-p-${k}" required>${pessoaOpts('', 'Escolha a pessoa')}</select></div>`}
      <div class="field"><label for="cu-pd-${k}">Padrão</label><select class="inp" id="cu-pd-${k}">${padroes().map(x => `<option value="${x.id}">${esc(x.texto)}</option>`).join('')}<option value="">Outro</option></select></div>
      <div class="field"><label for="cu-n-${k}">O que aconteceu</label><textarea class="inp" id="cu-n-${k}" rows="2" placeholder="Ex.: recebeu o cliente pelo nome e ofereceu o café (obrigatório no desvio)"></textarea></div>
      <p class="small muted">Registre só o que sai do comum, bom ou ruim. Não é checklist: ninguém marca isso todo dia. A pessoa vê os próprios registros no Perfil.</p>
      <div><button class="btn primary">Registrar</button></div></form>`;
}
const blocoCulturaReg = () => !recurso('cultura') ? '' : `<details class="reg-d" id="det-cul"><summary class="sum">Comportamento: destaque ou desvio</summary>${formCultura()}
    ${(() => { const hoje = (S.culturaReg || []).filter(r => r.data === TODAY_ISO); return hoje.length ? `<p class="day-h">Registrados hoje</p>${listaCultura(hoje)}` : ''; })()}</details>`;

/* Ficha da pessoa (Equipe, sócios) */
const fichaCultura = p => `<section class="panel stack gap8"><div class="panel-h"><h2>${p.parceiro ? 'Convivência' : 'Cultura'} · 30 dias</h2><p>${resumoCultura(p.id, 30)}</p></div>
    ${listaCultura(culturaDe(p.id, 30))}
    ${souGestorApp() ? `<details class="reg-d"><summary class="sum">Registrar destaque ou desvio de ${esc(first(p))}</summary>${formCultura(p.id)}</details>` : ''}</section>`;

/* Perfil da própria pessoa: o que foi registrado sobre ela */
function perfilCultura(p){
  const regs = culturaDe(p.id, 30);
  if (!regs.length) return '';
  return `<section class="card soft stack gap8"><h2 class="sec-h">${p.parceiro ? 'Convivência' : 'Cultura'}: destaques e pontos de atenção</h2>
    <div class="feed">${regs.map(r => `<div class="feed-i"><div><b>${r.tipo === 'destaque' ? chip('Destaque', 'good') : chip('Ponto de atenção', 'warn')} ${esc(padraoTxt(r.padrao_id))}</b><span>${r.nota ? esc(r.nota) + ' · ' : ''}${dLabelISO(r.data)}</span></div></div>`).join('')}</div>
    <p class="small muted">Últimos 30 dias. Dúvidas, converse com a Jessica no one-on-one.</p></section>`;
}

/* One-on-one: ao lado do nome da pessoa, o resumo da semana */
function umAUm(it){
  if (!souGestorApp()) return '';
  const tx = String(it.t || '').toLowerCase(), p = S.people.find(x => x.role !== 'dev' && tx.startsWith(firstName(x.name).toLowerCase()));
  return p ? `<small class="it-how">Últimos 7 dias: ${resumoCultura(p.id, 7)}</small>` : '';
}

/* Reunião: combinados e presença */
function blocoReuniao(i, mode){
  if (!ehReuniao(tpl(i.tpl)) || String(i.id).startsWith('TREINO')) return '';
  const pode = mode === 'exec' || (mode === 'verify' && souGestorApp());
  if (!pode) return i.notas ? `<div class="callout"><b>Combinados</b><p class="small pre">${esc(i.notas)}</p></div>` : '';
  return `<div class="card soft stack gap8"><label class="small muted" for="rn-${i.id}"><b>Combinados e presença</b> · o que foi decidido, quem estava</label>
    <textarea class="inp" id="rn-${i.id}" rows="3" placeholder="Ex.: todos presentes; a partir de amanhã o café é passado às 08:45">${esc(i.notas || '')}</textarea>
    <div><button class="btn sm" data-act="reuNotas" data-id="${i.id}">Salvar combinados</button></div></div>`;
}

/* Rotina: o que é cada tipo */
function blocoTipos(){
  const n = k => S.allTpls.filter(t => t.active && (t.kind || 'check') === k).length;
  const c = (t, s, extra = '') => `<div class="tipo-c"><b>${t}</b><span class="small muted">${s}</span>${extra}</div>`;
  return `<section class="panel"><div class="panel-h"><h2>Tipos de atividade</h2><p>cada coisa no lugar certo</p></div>
    <div class="tipos">
      ${c(`Checklist <span class="cnt">${n('check')}</span>`, 'Tarefa recorrente com horário e responsável. Feito ou Não deu, com foto quando precisa; a gerente confere.')}
      ${c(`Ronda <span class="cnt">${n('ronda')}</span>`, 'A gerente percorre a casa e vê se está no padrão: Conforme ou Não conforme.')}
      ${c(`Reunião <span class="cnt">${n('reuniao')}</span>`, 'Alinhamento, one-on-one, técnicas: aconteceu ou não, presença e combinados.')}
      ${c(`Lembrete <span class="cnt">${S.reminders.filter(r => r.on).length}</span>`, 'Só um aviso no celular da gerente na hora, sem itens.', `<button class="linkbtn small" data-act="nav" data-v="gerente">Editar lembretes →</button>`)}
      ${c('Instrução', 'O "como fazer" de cada item. A pessoa lê no checklist e não marca. Edite em cada checklist, abaixo do item.')}
      ${c(`Cultura <span class="cnt">${padroes().length}</span>`, 'Comportamento não é checklist. São padrões da casa; a gerência registra só o desvio ou o destaque, por pessoa.', `<button class="linkbtn small" data-act="nav" data-v="info">Editar padrões →</button>`)}
    </div></section>`;
}

/* Informações da casa: editor dos padrões */
function editorPadroes(){
  const ed = canEdit(), d = ed ? '' : 'disabled', lista = (S.culturaPadroes || []).filter(x => x.ativo);
  return `<section class="panel stack gap8" id="padroes"><div class="panel-h"><h2>Padrões de comportamento</h2><p>cultura que não vira checklist</p></div>
    <p class="small muted">A gerência registra quando alguém sai do padrão (desvio) ou se destaca. Para os parceiros, são combinados de convivência no espaço.</p>
    <div class="stack gap6">${lista.map(x => `<div class="rem"><span class="grow stack gap6"><label class="sr" for="cp-t-${x.id}">Padrão</label><input class="inp" id="cp-t-${x.id}" data-cpad="${x.id}|texto" value="${esc(x.texto)}" ${d}>
        <label class="sr" for="cp-d-${x.id}">O que significa</label><input class="inp" id="cp-d-${x.id}" data-cpad="${x.id}|detalhe" value="${esc(x.detalhe || '')}" placeholder="O que significa na prática" ${d}></span>
        ${ed ? `<button class="linkbtn small" data-act="cpadDel" data-id="${x.id}">Retirar</button>` : ''}</div>`).join('') || '<p class="small muted">Nenhum padrão ainda.</p>'}</div>
    ${ed ? `<form class="row gap6" data-form="cpad"><label class="sr" for="cp-novo">Novo padrão</label><input class="inp grow" id="cp-novo" placeholder="Novo padrão, ex.: Pontualidade" required><button class="btn sm">Incluir</button></form>` : ''}</section>`;
}

Object.assign(A, {
  culApagar(d){ if (!confirmar(null, 'cul-' + d.id, 'Toque de novo em Apagar para confirmar.')) return; run(() => rpc('apagar_cultura', {r:+d.id}), 'Registro apagado.'); },
  reuNotas(d){ const v = $('#rn-' + d.id)?.value ?? ''; run(() => rpc('anotar_reuniao', {e:d.id, texto:v}), 'Combinados salvos.'); },
  cpadDel(d){ if (!confirmar(null, 'cpad-' + d.id, 'Toque de novo para retirar o padrão. Os registros antigos continuam.')) return; upd('cultura_padroes', {ativo:false}, 'id', +d.id, 'Padrão retirado.'); },
});
document.addEventListener('submit', e => {
  const f = e.target.dataset.form;
  if (f === 'cul') { e.preventDefault();
    const pf = e.target.dataset.p, k = pf || 'x', pessoa = pf || $('#cu-p-' + k)?.value, tipo = e.target.querySelector(`input[name="cu-t-${k}"]:checked`)?.value || 'destaque';
    const nota = $('#cu-n-' + k).value.trim(), padrao = $('#cu-pd-' + k).value;
    if (!pessoa) { toast('Escolha a pessoa.'); return; }
    if (tipo === 'desvio' && !nota) { toast('No desvio, escreva o que aconteceu.'); return; }
    run(() => rpc('registrar_cultura', {pessoa, padrao:padrao ? +padrao : null, tipo, nota:nota || null}), tipo === 'destaque' ? 'Destaque registrado.' : 'Desvio registrado.'); }
  if (f === 'cpad') { e.preventDefault(); const texto = $('#cp-novo').value.trim(); if (!texto) return;
    const ordem = Math.max(0, ...(S.culturaPadroes || []).map(x => x.ordem || 0)) + 1;
    run(async () => check(await sb.from('cultura_padroes').insert({texto, ordem})), 'Padrão incluído.'); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.cpad) { const [id, campo] = el.dataset.cpad.split('|'), v = el.value.trim(); if (campo === 'texto' && !v) return; upd('cultura_padroes', {[campo]:v || null}, 'id', +id, 'Padrão atualizado.'); }
  if (el.dataset.itemhow) { upd('rotina_itens', {instrucao:el.value.trim() || null}, 'id', el.dataset.itemhow, 'Instrução do item salva.'); }
});
