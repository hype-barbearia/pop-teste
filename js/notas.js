/* =========================================================
   Hype POP · notas fiscais do Salão-Parceiro (visão da gestão)
   A quinzena como um caminho de três passos por barbeiro:
   1. Valor informado pela gestão  →  2. Nota enviada pelo barbeiro  →  3. Conferida pela gestão
   Cada cartão mostra em que passo a pessoa está e só o botão daquele passo.
   ========================================================= */
const diasAte = iso => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(TODAY_ISO + 'T12:00:00Z')) / 864e5);
const brlTxt = v => `R$ ${nf2(+v)}`;
const prazoTxt = iso => { const n = diasAte(iso); return n > 1 ? `vence em ${n} dias (${dLabelISO(iso)})` : n === 1 ? `vence amanhã (${dLabelISO(iso)})` : n === 0 ? 'vence hoje' : `venceu há ${-n} ${n === -1 ? 'dia' : 'dias'} (${dLabelISO(iso)})`; };

/* Em que passo cada barbeiro está nesta quinzena */
function nfEtapa(pid, per){
  const v = valorNF(pid, per), d = docDe(pid, per, 'nfse');
  if (d?.status === 'aceita') return 'ok';
  if (d?.status === 'enviada') return 'conferir';
  if (d?.status === 'recusada') return 'recusada';
  if (v == null) return 'valor';
  return TODAY_ISO > perPrazo(per) ? 'atrasada' : 'emitir';
}
const NF_ROT = {valor:['Falta o valor', 'warn'], emitir:['Aguardando a nota', 'acc'], atrasada:['Nota atrasada', 'bad'], conferir:['Para conferir', 'acc'], recusada:['Recusada, aguardando reenvio', 'bad'], ok:['Conferida', 'good']};
const NF_PASSO = {valor:0, emitir:1, atrasada:1, recusada:1, conferir:2, ok:3};

function nfResumo(per){
  const ps = team().filter(p => p.parceiro), et = ps.map(p => nfEtapa(p.id, per));
  const c = k => et.filter(e => k.includes(e)).length;
  return {ps, total:ps.length, valores:ps.length - c(['valor']), recebidas:c(['conferir', 'ok']), conferidas:c(['ok']), atrasadas:c(['atrasada']), aconferir:c(['conferir']), semValor:c(['valor']),
    soma:sum(ps, p => +(valorNF(p.id, per) || 0))};
}
function nfProximo(r, per){
  if (!r.total) return 'Nenhum barbeiro marcado como parceiro.';
  if (r.semValor) return `Informe o valor de ${r.semValor} ${r.semValor === 1 ? 'barbeiro' : 'barbeiros'} para eles poderem emitir.`;
  if (r.aconferir) return `Confira ${r.aconferir} ${r.aconferir === 1 ? 'nota enviada' : 'notas enviadas'}.`;
  if (r.atrasadas) return `${r.atrasadas} ${r.atrasadas === 1 ? 'nota está atrasada' : 'notas estão atrasadas'}. Mande um lembrete pelo app.`;
  if (r.conferidas === r.total) return 'Tudo conferido nesta quinzena.';
  return `Aguardando ${r.total - r.recebidas} ${r.total - r.recebidas === 1 ? 'nota' : 'notas'} · ${prazoTxt(perPrazo(per))}.`;
}

/* ---------- Ações de um documento (nota ou DAS) ---------- */
function nfDocAcoes(d, gestor){
  if (!d) return '';
  const rec = S.ui.nfRec === d.id;
  return `<div class="nf-doc">${d.numero ? `<span>nº <b>${esc(d.numero)}</b></span>` : ''}${d.valor != null ? `<span>valor na nota <b>${brlTxt(d.valor)}</b></span>` : ''}<span>enviada ${dLabelISO(String(d.enviado_em).slice(0, 10))}</span></div>
    <div class="nf-btns"><button class="btn sm" data-act="verDoc" data-v="${esc(d.arquivo_path)}">Ver arquivo</button>
      ${gestor && d.status === 'enviada' && !rec ? `<button class="btn sm primary" data-act="revDoc" data-id="${d.id}" data-v="aceita">Aceitar</button><button class="btn sm no" data-act="nfRecusar" data-id="${d.id}">Recusar…</button>` : ''}</div>
    ${rec ? `<div class="nf-rec"><label class="small" for="rev-${d.id}">Por que recusar? O barbeiro recebe este motivo.</label><input class="inp" id="rev-${d.id}" placeholder="Ex.: número da nota ilegível, valor diferente">
      <div class="nf-btns"><button class="btn sm no" data-act="revDoc" data-id="${d.id}" data-v="recusada">Recusar com este motivo</button><button class="btn sm" data-act="nfRecusar" data-id="">Cancelar</button></div></div>` : ''}`;
}

/* ---------- Cartão de um barbeiro ---------- */
function nfCartao(p, per, gestor){
  const e = nfEtapa(p.id, per), v = valorNF(p.id, per), d = docDe(p.id, per, 'nfse'), [rot, tom] = NF_ROT[e], passo = NF_PASSO[e];
  const editando = S.ui.nfEdit === p.id;
  const formValor = (txt) => `<form class="nf-val" data-form="nfvalor" data-p="${p.id}" data-per="${per}"><label class="sr" for="nv-${p.id}">Valor de ${esc(p.name)}</label>
      <div class="affix w-val"><span>R$</span><input id="nv-${p.id}" inputmode="decimal" value="${v != null ? nf2(v) : ''}" placeholder="0,00" autocomplete="off"></div><button class="btn sm primary">${txt}</button></form>`;
  let acao = '';
  if (e === 'valor') acao = gestor ? `${formValor('Informar valor')}<p class="small muted">${esc(first(p))} recebe o aviso para emitir a nota.</p>` : '<p class="small muted">A gestão ainda não informou o valor.</p>';
  else if (e === 'emitir' || e === 'atrasada' || e === 'recusada') acao = `${e === 'recusada' && d?.obs ? `<p class="nf-motivo">Motivo da recusa: ${esc(d.obs)}</p>` : ''}
      <p class="small ${e === 'atrasada' ? 'bad-t' : 'muted'}">Aguardando ${esc(first(p))} ${e === 'recusada' ? 'reenviar' : 'emitir e enviar'} a NFS-e · ${prazoTxt(perPrazo(per))}</p>
      ${gestor ? `<div class="nf-btns"><button class="btn sm ${e === 'atrasada' ? 'primary' : ''}" data-act="nfLembrar" data-id="${p.id}" data-v="${per}">Lembrar pelo app</button>${!d || e === 'recusada' ? `<button class="linkbtn small" data-act="nfEditar" data-id="${editando ? '' : p.id}">${editando ? 'cancelar' : 'alterar valor'}</button>` : ''}</div>
      ${editando ? formValor('Salvar valor') : ''}` : ''}`;
  else acao = nfDocAcoes(d, gestor) + (e === 'ok' && d.revisado_por ? `<p class="small muted">Conferida por ${esc(first(person(d.revisado_por)))}${d.revisado_em ? ` em ${dLabelISO(String(d.revisado_em).slice(0, 10))}` : ''}.</p>` : '');
  const difer = d && d.valor != null && v != null && Math.abs(+d.valor - +v) > .005;
  const das = S.rules.nfDas ? (() => { const comp = compAtual(), dd = docDe(p.id, comp, 'das'), atras = !docOk(dd) && TODAY_ISO > prazoDAS(comp);
    return `<div class="nf-das"><span>DAS de ${compLabel(comp)}</span>${dd ? docChip(dd) : chip(atras ? 'atrasado' : `pendente · vence ${dLabelISO(prazoDAS(comp))}`, atras ? 'bad' : 'warn')}
      ${dd ? `<details class="nf-das-d" id="det-das-${p.id}"><summary class="small">ver</summary>${nfDocAcoes(dd, gestor)}</details>` : ''}</div>`; })() : '';
  return `<article class="nf-c st-${e}">
    <header class="nf-h">${av(p)}<div class="grow"><b>${esc(p.fullName || p.name)}</b>${chip(rot, tom)}</div><div class="nf-v"><span>valor</span><b class="num">${v != null ? brlTxt(v) : '—'}</b></div></header>
    <ol class="nf-steps" aria-label="Passos da nota de ${esc(p.name)}">${['Valor informado', 'Nota enviada', 'Conferida'].map((t, k) => `<li class="${k < passo ? 'feito' : k === passo ? (e === 'atrasada' || e === 'recusada' ? 'agora bad' : 'agora') : ''}"><i>${k < passo ? '✓' : k + 1}</i><span>${t}</span></li>`).join('')}</ol>
    ${difer ? `<p class="nf-alerta">O valor da nota (${brlTxt(d.valor)}) é diferente do valor informado (${brlTxt(v)}).</p>` : ''}
    <div class="nf-acao">${acao}</div>${das}</article>`;
}

/* ---------- Bloco da quinzena (sócios e gerente) ---------- */
function blocoNotas(per, phone){
  const r = nfResumo(per), gestor = canManage(), opts = periodos(6);
  const corPer = c => { const x = nfResumo(c); return !x.total || !x.valores ? '' : x.conferidas === x.total ? 'good' : x.atrasadas || (TODAY_ISO > perPrazo(c) && x.recebidas < x.total) ? 'bad' : 'warn'; };
  const pc = (a, b) => b ? Math.round(100 * a / b) : 0;
  return `<section class="${phone ? 'card' : 'panel'} nf" id="notas">
    <div class="nf-pers" role="tablist" aria-label="Quinzena">${opts.map(c => `<button role="tab" aria-selected="${c === per}" class="${c === per ? 'on' : ''}" data-act="f" data-k="per" data-v="${c}"><i class="dot ${corPer(c)}"></i>${dLabelISO(c)}<small>a ${dLabelISO(perFim(c))}</small></button>`).join('')}</div>
    <div class="nf-top"><div><p class="eyebrow">Quinzena de ${perLabel(per)}</p><h3 class="h-sm">${esc(nfProximo(r, per))}</h3><p class="small muted">Prazo da nota: ${prazoTxt(perPrazo(per))} · total da quinzena <b>${brlTxt(r.soma)}</b></p></div></div>
    <div class="nf-funil">${[['Valores informados', r.valores, ''], ['Notas recebidas', r.recebidas, r.atrasadas ? 'bad' : ''], ['Conferidas', r.conferidas, r.conferidas === r.total && r.total ? 'good' : '']].map(([t, n, k]) =>
      `<div class="nf-f ${k}"><span>${t}</span><b class="num">${n}<small>/${r.total}</small></b><div class="bar"><i style="width:${pc(n, r.total)}%"></i></div></div>`).join('')}</div>
    ${r.total ? `<div class="nf-grid">${r.ps.map(p => nfCartao(p, per, gestor)).join('')}</div>` : '<p class="muted small">Nenhum profissional-parceiro marcado. Marque em Equipe, na ficha de cada barbeiro.</p>'}
  </section>`;
}

/* ---------- Página dos sócios ---------- */
function pgNotas(){
  const per = periodos(6).includes(S.ui.f.per) ? S.ui.f.per : perAtual(), ps = team().filter(p => p.parceiro), hist = periodos(6).slice().reverse();
  const sim = e => ({ok:['✓', 'good', 'conferida'], conferir:['●', 'acc', 'enviada, para conferir'], emitir:['○', '', 'aguardando a nota'], valor:['–', 'mute', 'sem valor'], atrasada:['!', 'bad', 'atrasada'], recusada:['✕', 'bad', 'recusada']}[e]);
  return `${ph(eyebrow(), 'Notas fiscais', 'Salão-Parceiro (Lei 13.352/2016): a cada quinzena a gestão informa o valor da cota-parte de cada barbeiro parceiro, ele emite a NFS-e para a HYPE e envia pelo app. Aqui você acompanha cada um em três passos.')}
    ${!S.rules.nfCnpj || !S.rules.nfRazao ? `<p class="callout"><b>Faltam dados da Hype para a nota${!S.rules.nfCnpj ? ' (CNPJ)' : ''}${!S.rules.nfRazao ? ' (razão social)' : ''}.</b> ${canEdit() ? 'Preencha em Gerência e regras.' : 'O Victor preenche em Gerência e regras.'}</p>` : ''}
    ${blocoNotas(per, false)}
    ${ps.length ? `<section class="panel"><div class="panel-h"><h2>Histórico das quinzenas</h2><p>toque numa quinzena para abrir</p></div>
      <div class="tw"><table class="t nf-hist"><thead><tr><th>Parceiro</th>${hist.map(c => `<th class="num"><button class="linkbtn small" data-act="f" data-k="per" data-v="${c}">${dLabelISO(c)}</button></th>`).join('')}</tr></thead>
      <tbody>${ps.map(p => `<tr><td><span class="who-cell">${av(p)}${esc(p.name)}</span></td>${hist.map(c => { const [s, k, t] = sim(nfEtapa(p.id, c)); const v = valorNF(p.id, c);
        return `<td class="num"><span class="nf-s ${k}" title="${perLabel(c)}: ${t}">${s}</span>${v != null ? `<small class="block muted">${nf2(v)}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="legend"><span><span class="nf-s good">✓</span> conferida</span><span><span class="nf-s acc">●</span> para conferir</span><span><span class="nf-s">○</span> aguardando</span><span><span class="nf-s bad">!</span> atrasada ou recusada</span><span><span class="nf-s mute">–</span> sem valor</span></div></section>` : ''}
    <p class="small muted">Os arquivos ficam numa pasta privada de cada barbeiro. Quem envia vê só os seus; a gerente e os sócios veem todos. Confirme as regras de emissão com a contabilidade da HYPE.</p>`;
}

/* ---------- Ações ---------- */
Object.assign(A, {
  nfRecusar(d){ S.ui.nfRec = d.id ? +d.id : null; render(); setTimeout(() => $('#rev-' + d.id)?.focus(), 0); },
  nfEditar(d){ S.ui.nfEdit = d.id || null; render(); setTimeout(() => $('#nv-' + d.id)?.focus(), 0); },
  nfLembrar(d){ run(() => rpc('lembrar_nf', {pessoa:d.id, periodo:d.v}), `Lembrete enviado para ${first(person(d.id))}.`); },
});
document.addEventListener('submit', e => {
  const f = e.target; if (f.dataset.form !== 'nfvalor') return; e.preventDefault();
  const pid = f.dataset.p, per = f.dataset.per, raw = ($('#nv-' + pid)?.value || '').replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.');
  if (raw === '' || isNaN(+raw) || +raw < 0) { toast('Valor inválido. Use o formato 1.250,00.'); return; }
  S.ui.nfEdit = null;
  run(() => rpc('definir_valor_nf', {pessoa:pid, periodo:per, valor:+raw}), `Valor salvo. ${first(person(pid))} recebe o aviso para emitir.`);
});

/* =========================================================
   Visão do barbeiro parceiro (Perfil): a nota da quinzena em três passos
   ========================================================= */
function perfilNotas(p){
  const opts = periodos(4), per = opts.includes(S.ui.f.perP) ? S.ui.f.perP : opts[0], comp = compAtual();
  const e = nfEtapa(p.id, per), nf = docDe(p.id, per, 'nfse'), das = docDe(p.id, comp, 'das'), valor = valorNF(p.id, per), passo = NF_PASSO[e];
  const desc = (S.rules.nfDesc || '').replace('{periodo}', perLabel(per)).replace('{mes}', perLabel(per));
  const enviadoEm = d => dLabelISO(recife(Date.parse(d.enviado_em)).toISOString().slice(0, 10));
  const copiar = (rot, txt) => `<div class="nf-dado"><div class="grow"><span>${rot}</span><b>${esc(txt || 'a definir pelos sócios')}</b></div>${txt ? `<button class="btn sm" data-act="copiarTexto" data-v="${esc(txt)}">Copiar</button>` : ''}</div>`;
  const arquivo = tipo => `<label class="nf-file" for="df-${tipo}"><input type="file" id="df-${tipo}" accept="application/pdf,.pdf,.xml,text/xml,image/*" required data-arq="${tipo}"><span class="nf-file-t" id="dft-${tipo}">Escolher o arquivo (PDF, XML ou foto)</span></label>`;
  const forma = `<form class="stack gap8" data-form="doc" data-tipo="nfse" data-comp="${per}">
      <div class="form-grid"><div class="field"><label for="dn-nfse">Número da nota</label><input class="inp" id="dn-nfse" inputmode="numeric" required placeholder="Ex.: 118"></div>
        <div class="field"><label for="dv-nfse">Valor da nota</label><div class="affix"><span>R$</span><input id="dv-nfse" inputmode="decimal" value="${valor != null ? nf2(valor) : ''}"></div></div></div>
      ${arquivo('nfse')}<button class="btn primary big">Enviar a nota para a gestão</button></form>`;
  const titulo = {valor:'A gestão ainda vai informar o valor', emitir:'Hora de emitir a sua nota', atrasada:'Sua nota está atrasada', conferir:'Nota enviada, aguardando a conferência', recusada:'A nota voltou: corrija e envie de novo', ok:'Nota conferida. Tudo certo nesta quinzena.'}[e];
  const corpo = e === 'valor' ? '<p class="small muted">Você recebe um aviso no celular assim que o valor estiver aqui.</p>'
    : e === 'conferir' ? `<p class="small muted">Enviada em ${enviadoEm(nf)}${nf.numero ? ` · nº ${esc(nf.numero)}` : ''}. Você é avisado se precisar corrigir.</p><div><button class="btn sm" data-act="verDoc" data-v="${esc(nf.arquivo_path)}">Ver o arquivo enviado</button></div>`
    : e === 'ok' ? `<p class="small muted">Enviada em ${enviadoEm(nf)}${nf.numero ? ` · nº ${esc(nf.numero)}` : ''}.</p><div><button class="btn sm" data-act="verDoc" data-v="${esc(nf.arquivo_path)}">Ver o arquivo enviado</button></div>`
    : `${e === 'recusada' && nf?.obs ? `<p class="nf-motivo"><b>Motivo:</b> ${esc(nf.obs)}</p>` : ''}
      <ol class="nf-como"><li><strong class="t">Copie os dados da HYPE</strong>${copiar('Tomador (razão social)', S.rules.nfRazao)}${copiar('CNPJ', fmtCnpj(S.rules.nfCnpj))}${copiar('Descrição do serviço', desc)}</li>
        <li><strong class="t">Emita a NFS-e</strong><span class="small">No emissor que você já usa como MEI, com o valor de <b>${brlTxt(valor)}</b>.</span></li>
        <li><strong class="t">Envie aqui o número, o valor e o arquivo</strong>${forma}</li></ol>`;
  return `<section class="card nf-me st-${e}"><div class="row between"><h3>Nota fiscal · Salão-Parceiro</h3></div>
    <div class="nf-pers" role="tablist" aria-label="Quinzena">${opts.map(c => `<button role="tab" aria-selected="${c === per}" class="${c === per ? 'on' : ''}" data-act="f" data-k="perP" data-v="${c}"><i class="dot ${({ok:'good', conferir:'warn', emitir:'warn', atrasada:'bad', recusada:'bad', valor:''})[nfEtapa(p.id, c)]}"></i>${dLabelISO(c)}<small>a ${dLabelISO(perFim(c))}</small></button>`).join('')}</div>
    <div class="nf-me-top"><div><p class="eyebrow">Quinzena de ${perLabel(per)}</p><h3 class="h-sm">${titulo}</h3>${e !== 'ok' && e !== 'conferir' ? `<p class="small ${e === 'atrasada' ? 'bad-t' : 'muted'}">Prazo: ${prazoTxt(perPrazo(per))}</p>` : ''}</div>
      <div class="nf-v"><span>valor a emitir</span><b class="num">${valor != null ? brlTxt(valor) : '—'}</b></div></div>
    <ol class="nf-steps">${['Valor informado', 'Nota enviada', 'Conferida'].map((t, k) => `<li class="${k < passo ? 'feito' : k === passo ? (e === 'atrasada' || e === 'recusada' ? 'agora bad' : 'agora') : ''}"><i>${k < passo ? '✓' : k + 1}</i><span>${t}</span></li>`).join('')}</ol>
    <div class="nf-acao">${corpo}</div>
    ${S.rules.nfDas ? `<div class="nf-das-me ${docOk(das) ? 'ok' : ''}"><div class="grow"><b>DAS do MEI de ${compLabel(comp)}</b><span class="small muted">${das ? `${das.status === 'recusada' ? 'Recusado' : 'Enviado'} em ${enviadoEm(das)}` : `Vence dia ${dLabelISO(prazoDAS(comp))}. Pague e envie o comprovante.`}</span>
        ${das?.status === 'recusada' && das.obs ? `<span class="nf-motivo">${esc(das.obs)}</span>` : ''}</div>${docChip(das)}
      ${!docOk(das) ? `<form class="stack gap8 nf-das-f" data-form="doc" data-tipo="das" data-comp="${comp}">${arquivo('das')}<button class="btn primary">Enviar comprovante</button></form>` : ''}</div>` : ''}
    <details class="prev"><summary class="small"><b>Suas últimas quinzenas</b></summary><div class="feed">${periodos(6).map(c => `<div class="feed-i"><div><b>${perLabel(c)}</b><span>${valorNF(p.id, c) != null ? brlTxt(valorNF(p.id, c)) : 'valor não informado'}</span></div><div class="r">${chip(...NF_ROT[nfEtapa(p.id, c)])}</div></div>`).join('')}</div></details></section>`;
}
Object.assign(A, {copiarTexto(d){ navigator.clipboard?.writeText(d.v).then(() => toast('Copiado.'), () => toast('Selecione o texto e copie.')); }});
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset.arq) return;
  const t = document.getElementById('dft-' + el.dataset.arq); if (t) t.textContent = el.files?.[0] ? `✓ ${el.files[0].name}` : 'Escolher o arquivo (PDF, XML ou foto)';
  el.closest('.nf-file')?.classList.toggle('on', !!el.files?.[0]);
});
