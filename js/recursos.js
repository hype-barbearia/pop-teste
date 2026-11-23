/* =========================================================
   Hype POP · recursos de negócio, UX e LGPD (17/11/2026)
   Semana de aprendizado, pauta da reunião, POP para revisar, reposição,
   cliente, status de acesso, foto de referência, treino, conferência
   em lote, aviso de privacidade e cópia dos dados.
   ========================================================= */

/* ---------- Semana de aprendizado ---------- */
const aprendendo = () => !!S?.rules?.aprendizadoAte && TODAY_ISO <= S.rules.aprendizadoAte;
const avisoAprendizado = () => !aprendendo() ? '' : `<div class="callout learn"><b>Semana de aprendizado até ${dLabelISO(S.rules.aprendizadoAte)}.</b> ${me()?.role === 'socio' || me()?.socio
  ? 'Atrasos não chegam aos sócios e não entram na média de 4 semanas.' : 'Errou ou esqueceu? Faz parte. Os atrasos desta semana não contam na sua média.'}</div>`;
const avisoOffline = () => OFFLINE == null ? '' : `<div class="callout warn"><b>Sem internet.</b> Mostrando os dados das ${hm(OFFLINE)}. Pode marcar normalmente: as marcações saem sozinhas quando a conexão voltar.</div>`;

/* ---------- Status de acesso, avisos e privacidade ---------- */
const PRIV_VERSAO = 1;
const st = pid => S.statusEq?.[pid] || null;
function statusChips(pid){
  const s = st(pid); if (!s) return '';
  const acesso = s.ultimo_acesso ? chip(`entrou ${dLabelISO(String(s.ultimo_acesso).slice(0, 10))}`, 'good') : chip('nunca entrou', 'bad');
  const av_ = s.avisos ? chip('avisos ativos', 'good') : chip('sem avisos', 'warn');
  const pv = person(pid)?.role === 'socio' ? '' : s.privacidade ? '' : chip('privacidade pendente');
  return `<span class="st-chips">${acesso}${av_}${pv}</span>`;
}
function avisoAdesao(){
  if (!S.statusEq || !Object.keys(S.statusEq).length) return '';
  const pessoas = team().filter(p => p.role !== 'socio'), nunca = pessoas.filter(p => !st(p.id)?.ultimo_acesso), semAv = pessoas.filter(p => st(p.id) && !st(p.id).avisos);
  if (!nunca.length && !semAv.length) return '';
  return `<div class="callout def-banner"><span>${nunca.length ? `<b>${nunca.length} ${nunca.length === 1 ? 'pessoa ainda não entrou' : 'pessoas ainda não entraram'} no app:</b> ${nunca.map(x => esc(first(x))).join(', ')}. ` : ''}${semAv.length ? `<b>Sem notificações:</b> ${semAv.map(x => esc(first(x))).join(', ')}.` : ''}</span>${socioView() ? `<button class="btn sm" data-act="nav" data-v="equipe">Ver a equipe</button>` : ''}</div>`;
}

/* ---------- Aviso de privacidade (LGPD) ---------- */
function textoPrivacidade(p){
  return `<div class="priv-tx stack gap8">
    <p><b>O que o app registra:</b> seu nome, e-mail de acesso, o horário de cada item marcado, as fotos tiradas nos checklists, as ocorrências que você abre ou em que aparece, os destaques e desvios de comportamento que a gerência registrar sobre você, o termo de ciência dos POPs${p?.parceiro ? ', as notas fiscais e comprovantes que você envia' : ''} e o aparelho em que você ativou as notificações.</p>
    <p><b>Para quê:</b> manter o padrão de qualidade e de higiene da casa, dar a estrutura certa para cada um trabalhar bem, organizar a rotina${p?.parceiro ? ' e cumprir as obrigações fiscais da parceria' : ''}.</p>
    ${p?.parceiro ? `<p><b>Para o profissional-parceiro:</b> os checklists não são funções do serviço que você presta. São orientações de convivência no espaço. A Hype acompanha esses dados para garantir que você tenha a melhor estrutura e experiência para desempenhar seu trabalho.</p>` : ''}
    <p><b>Quem vê:</b> você vê os seus registros. A gerente e os sócios veem os de toda a equipe. Ninguém de fora da Hype tem acesso.</p>
    <p><b>Fotos:</b> fotografe só o ambiente, nunca clientes. As fotos são apagadas sozinhas depois de 90 dias.</p>
    <p><b>Por quanto tempo:</b> os demais registros ficam enquanto você trabalhar na Hype e pelo prazo que a lei exigir${p?.parceiro ? ' (notas fiscais: 5 anos)' : ''}.</p>
    <p><b>Seus direitos:</b> você pode pedir para ver, corrigir ou saber o que foi registrado sobre você. Fale com os sócios.</p></div>`;
}
const privOk = p => !p || p.role === 'socio' || S.priv.some(x => x.pessoa_id === p.id && x.versao >= PRIV_VERSAO);
const cardPrivacidade = p => privOk(p) ? '' : `<section class="card priv"><p class="now-l">Antes de começar</p><h2 class="h-sm">Aviso de privacidade</h2>
  <ul class="priv-l"><li>O app registra o horário do que você marca, as fotos do ambiente e as ocorrências.</li><li>Você vê os seus registros; a gerente e os sócios veem os de todos. Ninguém de fora da Hype.</li>
    <li>Fotografe só o ambiente, nunca clientes. As fotos somem depois de 90 dias.</li>${p.parceiro ? '<li>Para o parceiro: os checklists são orientações de convivência no espaço, não funções do seu serviço.</li>' : ''}</ul>
  <details class="reg-d"><summary class="sum">Ler o aviso completo</summary>${textoPrivacidade(p)}</details>
  <button class="btn primary big" data-act="priv">Li e entendi</button></section>`;
const blocoPrivacidadePerfil = p => `<details class="card soft" id="det-priv"><summary class="sum">Privacidade: o que o app registra sobre você</summary>${textoPrivacidade(p)}
  <p class="small muted">${privOk(p) ? 'Você já confirmou a leitura deste aviso.' : ''}</p></details>`;

/* ---------- Checklist de treino ---------- */
const TREINO_TPL = {id:'TREINO', title:'Checklist de treino', kind:'check', verify:false, also:null, items:[
  {id:'T1', t:'Toque nesta linha para marcar como feito'},
  {id:'T2', t:'Este pede foto: toque e fotografe qualquer coisa do ambiente', photo:true},
  {id:'T3', t:'Neste, toque em "Não deu" e escreva um motivo de teste'}]};
const treinoFeito = () => { try { return localStorage.getItem('hype-treino-' + S.ui.user) === '1'; } catch (e) { return true; } };
const cardTreino = p => !recurso('treino') || treinoFeito() || p.role === 'socio' ? '' : `<button class="alert" data-act="treino"><b>Primeira vez no app? Faça um checklist de treino</b><span>Dois minutos para aprender a marcar, fotografar e usar o "Não deu". Não conta em nenhum número.</span></button>`;
function treinoMarcar(it, extra = {}){ TREINO.checks[it] = {at:NOW(), ok:true, ...extra}; render(); }

/* ---------- Registrar: problema, falta de material, cliente ---------- */
function blocoRegistrar(gestor){
  const pessoas = pessoaOpts('', 'Ninguém em especial');
  return `<section class="card soft reg"><h2 class="sec-h">Registrar</h2>
    ${formOcorrencia(gestor).replace('class="panel" id="det-occ"', 'class="reg-d" id="det-occ"').replace('Registrar ocorrência', 'Um problema na casa')}
    ${recurso('reposicao') ? `<details class="reg-d" id="det-rep"><summary class="sum">Falta material ou produto</summary>
      <form class="stack gap8" data-form="rep"><div class="field"><label for="rp-i">O que está faltando</label><input class="inp" id="rp-i" required placeholder="Ex.: Álcool 70%"></div>
        <div class="field"><label for="rp-o">Detalhe (opcional)</label><input class="inp" id="rp-o" placeholder="Ex.: acaba amanhã"></div>
        <div><button class="btn primary">Pedir reposição</button></div></form></details>` : ''}
    ${recurso('cliente') ? `<details class="reg-d" id="det-cli"><summary class="sum">Cliente elogiou ou reclamou</summary>
      <form class="stack gap8" data-form="cli"><div class="seg2" role="radiogroup" aria-label="Tipo">
          <label><input type="radio" name="cl-t" value="elogio" checked><span>Elogio</span></label><label><input type="radio" name="cl-t" value="reclamacao"><span>Reclamação</span></label></div>
        <div class="field"><label for="cl-x">O que o cliente disse</label><textarea class="inp" id="cl-x" rows="2" required></textarea></div>
        <div class="field"><label for="cl-p">Sobre quem</label><select class="inp" id="cl-p">${pessoas}</select></div>
        <p class="small muted">Não escreva nome, telefone ou dados do cliente.</p>
        <div><button class="btn primary">Registrar</button></div></form></details>` : ''}${gestor ? blocoCulturaReg() : ''}</section>`;
}

/* ---------- Lista de reposição ---------- */
function blocoReposicao(gestor, titulo = 'Reposição de material'){
  const abertos = S.repo.filter(r => !r.resolvido_em), feitos = S.repo.filter(r => r.resolvido_em);
  if (!recurso('reposicao') || (!abertos.length && !feitos.length)) return '';
  return `<section class="${socioView() ? 'panel' : 'card'} stack gap8"><h2 class="sec-h">${titulo} ${abertos.length ? `<span class="cnt">${abertos.length}</span>` : ''}</h2>
    ${abertos.map(r => `<div class="rem"><span class="grow"><b>${esc(r.item)}</b><span class="small muted block">${r.obs ? esc(r.obs) + ' · ' : ''}${esc(first(person(r.pedido_por)))} · ${dLabelISO(String(r.em).slice(0, 10))} ${hm(minOf(r.em))}</span></span>
      ${gestor ? `<button class="btn sm primary" data-act="repOk" data-id="${r.id}">Comprado</button>` : chip('pedido')}</div>`).join('') || '<p class="small muted">Nada faltando agora.</p>'}
    ${feitos.length ? `<p class="small muted">Resolvidos há pouco: ${feitos.map(r => esc(r.item)).join(', ')}.</p>` : ''}</section>`;
}

/* ---------- Pauta da reunião de segunda ---------- */
function dadosPauta(){
  const h = history().slice(-6), por = {};
  h.forEach(d => Object.entries(d.byP).forEach(([pid, x]) => { const o = por[pid] ??= {exp:0, ok:0, late:0, miss:0}; ['exp','ok','late','miss'].forEach(k => o[k] += x[k]); }));
  const tot = h.reduce((a, d) => (a.exp += d.tot.exp, a.ok += d.tot.ok, a), {exp:0, ok:0});
  const cliSemana = S.occ.filter(o => /^Cliente ·/.test(o.src || ''));
  return {
    conf:tot.exp ? tot.ok / tot.exp : null, exp:tot.exp,
    pessoas:Object.entries(por).filter(([, x]) => x.late || x.miss).sort((a, b) => (b[1].late + b[1].miss) - (a[1].late + a[1].miss)).slice(0, 5),
    falhas:S.falhas7.slice(0, 3), revisar:S.falhas14.filter(f => f.falhas >= 3),
    occ:occOpen().filter(o => !/^Cliente · elogio/.test(o.src || '')), repo:S.repo.filter(r => !r.resolvido_em),
    elogios:cliSemana.filter(o => /elogio/.test(o.src)).length, reclam:cliSemana.filter(o => /reclama/.test(o.src)).length,
    pops:Object.entries(pendingReads().reduce((o, x) => (o[first(x.who)] = (o[first(x.who)] || 0) + 1, o), {})),
  };
}
function pautaTexto(){
  const d = dadosPauta(), L = [];
  L.push(`Pauta do alinhamento · ${DIA_CURTO}`);
  L.push(`1. Semana: ${d.conf == null ? 'sem dias completos ainda' : `${Math.round(d.conf * 100)}% no prazo (${d.exp} checklists)`}${aprendendo() ? ' · semana de aprendizado' : ''}`);
  L.push(`2. O que mais falhou: ${d.falhas.length ? d.falhas.map(f => `${f.texto} (${f.rotina}, ${f.falhas}x)`).join('; ') : 'nada registrado'}`);
  if (d.revisar.length) L.push(`3. POP para revisar: ${d.revisar.map(f => `${f.pop_id || f.rotina} · ${f.texto} (${f.falhas}x em 14 dias)`).join('; ')}`);
  L.push(`${d.revisar.length ? 4 : 3}. Atrasos por pessoa: ${d.pessoas.length ? d.pessoas.map(([pid, x]) => `${first(person(pid))} ${x.late} com atraso, ${x.miss} não feitos`).join('; ') : 'nenhum'}`);
  L.push(`Clientes: ${d.elogios} elogios, ${d.reclam} reclamações (30 dias)`);
  L.push(`Ocorrências abertas: ${d.occ.length}${d.occ.length ? ' · ' + d.occ.slice(0, 3).map(o => o.title).join('; ') : ''}`);
  if (d.repo.length) L.push(`Reposição pendente: ${d.repo.map(r => r.item).join(', ')}`);
  if (d.pops.length) L.push(`POPs sem assinatura: ${d.pops.map(([n, c]) => `${n} (${c})`).join(', ')}`);
  return L.join('\n');
}
function blocoPauta(aberta = false){
  if (!recurso('pauta')) return '';
  const d = dadosPauta();
  const li = (t, s) => `<li><b>${t}</b><span>${s}</span></li>`;
  return `<details class="${socioView() ? 'panel' : 'card'} pauta" id="det-pauta" ${aberta ? 'open' : ''}><summary class="sum">Pauta do alinhamento de segunda</summary>
    <ol class="pauta-l">
      ${li('A semana', d.conf == null ? 'Sem dias completos para medir ainda.' : `${Math.round(d.conf * 100)}% dos checklists no prazo (${d.exp} no total).${aprendendo() ? ' Semana de aprendizado.' : ''}`)}
      ${li('O que mais falhou', d.falhas.length ? d.falhas.map(f => `${esc(f.texto)} <small>(${esc(f.rotina)}, ${f.falhas}x)</small>`).join('<br>') : 'Nenhum item marcado como não feito.')}
      ${d.revisar.length ? li('POP para revisar', d.revisar.map(f => `${esc(f.pop_id || '')} · ${esc(f.texto)} <small>(${f.falhas}x em 14 dias: o problema pode ser o processo, não a pessoa)</small>`).join('<br>')) : ''}
      ${li('Atrasos por pessoa', d.pessoas.length ? d.pessoas.map(([pid, x]) => `${esc(first(person(pid)))}: ${x.late} com atraso, ${x.miss} não feitos`).join('<br>') : 'Nenhum atraso registrado.')}
      ${li('Clientes', `${d.elogios} ${d.elogios === 1 ? 'elogio' : 'elogios'} e ${d.reclam} ${d.reclam === 1 ? 'reclamação' : 'reclamações'} nos últimos 30 dias.`)}
      ${li('Ocorrências abertas', d.occ.length ? d.occ.slice(0, 4).map(o => esc(o.title)).join('<br>') : 'Nenhuma.')}
      ${d.repo.length ? li('Reposição pendente', d.repo.map(r => esc(r.item)).join(', ')) : ''}
      ${d.pops.length ? li('POPs sem assinatura', d.pops.map(([n, c]) => `${esc(n)} (${c})`).join(', ')) : ''}
    </ol><button class="btn sm" data-act="copiarPauta">Copiar a pauta</button></details>`;
}

/* ---------- POPs para revisar (entra em Para definir) ---------- */
const popsRevisar = () => (S.falhas14 || []).filter(f => f.falhas >= 3);

/* ---------- Foto de referência ---------- */
const refThumb = it => it.ref && PHOTO_URL[it.ref] ? `<a class="ref" href="${esc(PHOTO_URL[it.ref])}" target="_blank" rel="noopener"><img src="${esc(PHOTO_URL[it.ref])}" alt="Como deve ficar: ${esc(it.t)}" loading="lazy"><span>Como deve ficar</span></a>` : '';
const refEditor = it => `<span class="ref-ed">${it.ref && PHOTO_URL[it.ref] ? `<img src="${esc(PHOTO_URL[it.ref])}" alt="">` : ''}<label class="ph-toggle ${it.ref ? 'on' : ''}"><input type="file" accept="image/*" data-ref="${it.id}" hidden>${it.ref ? 'trocar referência' : '+ foto de referência'}</label>${it.ref ? `<button class="linkbtn small" data-act="refDel" data-id="${it.id}">tirar</button>` : ''}</span>`;

/* ---------- Conferência em lote (gerente) ---------- */
function scLote(p){
  const list = S.inst.filter(needsVer).sort((a, b) => a.doneAt - b.doneAt), limpos = list.filter(i => !prog(i).nc);
  const card = i => { const t = tpl(i.tpl), g = prog(i), fotos = Object.entries(checks(i)).filter(([, c]) => c.photo);
    return `<article class="lote-c ${g.nc ? 'nc' : ''}"><div class="lote-h"><b>${esc(t.title)}</b><small>${esc(first(person(i.who)))} · concluído às ${hm(i.doneAt)}${g.nc ? ` · <em>${g.nc} não feito</em>` : ''}</small></div>
      ${fotos.length ? `<div class="lote-f">${fotos.map(([iid, c]) => photo(t.items.find(x => x.id === iid)?.t || '', c.at, c.photo)).join('')}</div>` : '<p class="small muted">Sem fotos neste checklist.</p>'}
      <div class="btn-row">${g.nc ? '' : `<button class="btn primary" data-act="loteOk" data-id="${i.id}">Conferido</button>`}<button class="btn" data-act="open" data-id="${i.id}">${g.nc ? 'Abrir para conferir' : 'Abrir'}</button></div></article>`; };
  return `<header class="hb slim"><div class="hb-top"><button class="hb-back" data-act="loteSair" aria-label="Voltar">${icon('voltar')}</button><span class="hb-date">Conferência rápida</span></div>
      <h1 class="hb-h">${list.length} para conferir</h1><p class="hb-sub">Olhe as fotos. Se estiver no padrão, toque em Conferido.</p></header>
    <main class="sheet-c">${limpos.length > 1 ? `<button class="btn primary big" data-act="loteTodos">Conferir os ${limpos.length} sem item não feito</button>` : ''}
      ${list.map(card).join('') || '<div class="now done"><b class="now-t">Nada para conferir.</b></div>'}</main>`;
}

/* ---------- Cópia dos dados (sócios) ---------- */
const TABELAS_BACKUP = ['pessoas','pops','pop_versoes','pop_leituras','rotinas','rotina_janelas','rotina_itens','rodizio_escala','rotina_agendamentos','execucoes','execucao_itens',
  'cobrancas','ocorrencias','ocorrencia_acoes','lembretes','lembretes_feitos','regras','ausencias','dias_fechados','resumos','documentos_fiscais','nf_valores','config_textos',
  'definicoes','reposicao','privacidade_aceite'];
async function baixarCopia(){
  const out = {gerado_em:new Date().toISOString(), tabelas:{}};
  for (const t of TABELAS_BACKUP) {
    const linhas = [];
    for (let de = 0; ; de += 1000) { const {data, error} = await sb.from(t).select('*').range(de, de + 999); if (error) throw new Error(`${t}: ${error.message}`); linhas.push(...data); if (data.length < 1000) break; }
    out.tabelas[t] = linhas;
  }
  const blob = new Blob([JSON.stringify(out, null, 1)], {type:'application/json'}), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `hype-pop-copia-${TODAY_ISO}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return Object.values(out.tabelas).reduce((n, l) => n + l.length, 0);
}
const blocoCopia = () => canEdit() ? `<section class="panel"><div class="panel-h"><h2>Cópia de segurança</h2><p>dados do app em um arquivo</p></div>
  <p class="small">Baixa todos os registros (equipe, rotinas, checklists, ocorrências, notas e regras) num arquivo que fica com você. Guarde num lugar seguro: ele tem dados pessoais da equipe. As fotos e os arquivos das notas continuam no Supabase.</p>
  <div><button class="btn primary" data-act="copia">Baixar cópia dos dados</button></div></section>` : '';

/* ---------- Ações ---------- */
Object.assign(A, {
  priv(){ run(() => rpc('aceitar_privacidade', {versao:PRIV_VERSAO}), 'Obrigado. Bom trabalho!'); },
  treino(){
    TREINO = {id:'TREINO', tpl:'TREINO', who:S.ui.user, start:NOW() - 1, due:NOW() + 30, checks:{}, doneAt:null, ver:null, redo:null};
    S.ui.open = 'TREINO'; render(); window.scrollTo(0, 0);
  },
  repOk(d){ run(() => rpc('resolver_reposicao', {r:+d.id}), 'Marcado como comprado.'); },
  async copiarPauta(){ try { await navigator.clipboard.writeText(pautaTexto()); toast('Pauta copiada.'); } catch (e) { toast('Não deu para copiar neste aparelho.'); } },
  lote(){ S.ui.lote = true; render(); window.scrollTo(0, 0); },
  loteSair(){ S.ui.lote = false; render(); },
  loteOk(d){ run(() => rpc('conferir', {e:d.id, resultado:'ok', nota:null}), 'Conferido.'); },
  loteTodos(){
    const ids = S.inst.filter(i => needsVer(i) && !prog(i).nc).map(i => i.id);
    run(async () => { for (const id of ids) await rpc('conferir', {e:id, resultado:'ok', nota:null}); }, `${ids.length} checklists conferidos.`);
  },
  refDel(d){ if (!confirmar(null, 'ref-' + d.id, 'Toque de novo para tirar a foto de referência.')) return;
    upd('rotina_itens', {foto_ref:null}, 'id', d.id, 'Foto de referência retirada.'); },
  async copia(){ toast('Preparando a cópia…'); try { const n = await baixarCopia(); toast(`Cópia baixada: ${n} registros.`); } catch (e) { toast(esc(e.message)); } },
});

document.addEventListener('submit', e => {
  const f = e.target.dataset.form;
  if (f === 'rep') { e.preventDefault(); const item = $('#rp-i').value.trim(); if (!item) return;
    run(() => rpc('pedir_reposicao', {item, obs:$('#rp-o').value.trim() || null, execucao:null}), 'Pedido enviado para a gerência.'); }
  if (f === 'cli') { e.preventDefault(); const texto = $('#cl-x').value.trim(); if (!texto) return; const tipo = document.querySelector('input[name="cl-t"]:checked')?.value || 'elogio';
    run(() => rpc('registrar_cliente', {tipo, texto, pessoa:$('#cl-p').value || null}), tipo === 'elogio' ? 'Elogio registrado. Boa!' : 'Reclamação registrada. A gerência vai tratar.'); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.ref) { const file = el.files?.[0]; if (!file) return; const iid = el.dataset.ref;
    toast('Enviando a foto de referência…');
    run(async () => { const blob = await comprimir(file), path = `ref/${iid}-${Date.now()}.jpg`;
      check(await sb.storage.from('fotos').upload(path, blob, {contentType:'image/jpeg'}));
      check(await sb.from('rotina_itens').update({foto_ref:path}).eq('id', iid)); }, 'Foto de referência salva. A equipe vê no checklist.'); }
});
