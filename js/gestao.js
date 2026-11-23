/* =========================================================
   Hype POP · painel de gestão (sócios)
   Três perguntas, nesta ordem:
   1. A casa está no padrão agora?   (faixa de status)
   2. O que precisa de mim?          (caixa de decisões, cada item com o botão que resolve)
   3. A operação está melhorando?    (saúde da operação: tendência, gerência, clientes, adesão)
   ========================================================= */

/* ---------- 1. Faixa de status ---------- */
function painelTopo(){
  const d = dayStats(), late = d.atrasado, oo = occOpen().length, pv = S.inst.filter(needsVer).length, h = histAgg(x => x.tot);
  const tom = late ? 'bad' : oo || pv ? 'warn' : 'good';
  const frase = !S.inst.length ? (preInicio() ? 'A operação ainda não começou' : 'Nenhum checklist hoje')
    : late ? `${late} ${late === 1 ? 'checklist atrasado' : 'checklists atrasados'} agora` : oo ? `Casa rodando, ${oo} ${oo === 1 ? 'ocorrência aberta' : 'ocorrências abertas'}` : 'Casa no padrão';
  const delta = d.rate != null && h.rate != null ? Math.round((d.rate - h.rate) * 100) : null;
  return `<section class="pulse ${tom}"><div class="pulse-l"><p class="hb-eb"><span class="d-l">${DIA_LABEL[0].toUpperCase() + DIA_LABEL.slice(1)}</span><span class="d-s">${DIA_CURTO}</span> · ${hm(NOW())}${aprendendo() ? ' · <span class="pl-learn">semana de aprendizado</span>' : ''}</p><h1>${frase}</h1>
      ${S.inst.length ? segs([...S.inst].sort((a, b) => a.start - b.start)) : ''}</div>
    <div class="pulse-score"><b class="num">${rateTxt(d.rate)}</b><span>no prazo hoje · meta ${Math.round(S.rules.meta * 100)}%</span>
      ${delta != null ? `<em class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} p.p. vs média de 4 semanas</em>` : '<em>a média de 4 semanas aparece com os primeiros dias completos</em>'}
      <div class="pulse-mini"><span><b>${d.done}</b>/${d.total} feitos</span><span><b>${oo}</b> ocorrências</span><span><b>${pv}</b> a conferir</span></div></div></section>`;
}

/* ---------- 2. Caixa de decisões ---------- */
function decisoes(){
  const out = [], add = (k, t, s, btn) => out.push({k, t, s, btn});
  const escalados = S.inst.filter(i => status(i) === 'atrasado' && lateMin(i) >= S.rules.escalar && !aprendendo());
  if (escalados.length) add('bad', `${escalados.length} ${escalados.length === 1 ? 'atraso escalado' : 'atrasos escalados'} a você`,
    escalados.slice(0, 3).map(i => `${tpl(i.tpl).title} · ${first(person(i.who))}, ${mins(lateMin(i))}${nudgesOf(i.id).length ? ' (já cobrado)' : ' (sem cobrança da gerente)'}`).join('; '), ['Ver o dia', 'nav', 'hoje']);
  const nDef = S.defs.filter(x => !x.resolvido_em).length, nCf = conflitos().length, nRev = popsRevisar().length;
  if (nDef + nCf + nRev) add(nCf ? 'warn' : '', `${nDef + nCf + nRev} ${nDef + nCf + nRev === 1 ? 'ponto esperando decisão' : 'pontos esperando decisão'}`,
    [nCf ? `${nCf} ${nCf === 1 ? 'conflito' : 'conflitos'} de horário` : '', nDef ? `${nDef} em aberto` : '', nRev ? `${nRev} POP para revisar` : ''].filter(Boolean).join(' · '), ['Decidir', 'nav', 'definir']);
  const notas = (S.docs || []).filter(x => x.status === 'enviada');
  if (notas.length) add('', `${notas.length} ${notas.length === 1 ? 'nota fiscal para aceitar' : 'notas fiscais para aceitar'}`, notas.slice(0, 4).map(x => first(person(x.pessoa_id))).join(', '), ['Revisar', 'nav', 'notas']);
  const atrasoOcc = occOpen().filter(o => (o.prazo && o.prazo < TODAY_ISO) || (o.day && !o.actions.length));
  if (atrasoOcc.length) add('warn', `${atrasoOcc.length} ${atrasoOcc.length === 1 ? 'ocorrência parada' : 'ocorrências paradas'}`, 'Com o prazo vencido ou sem nenhuma ação desde ontem.', ['Ver', 'nav', 'ocorrencias']);
  const pessoas = team(), nunca = pessoas.filter(p => S.statusEq?.[p.id] && !S.statusEq[p.id].ultimo_acesso), semAv = pessoas.filter(p => S.statusEq?.[p.id] && !S.statusEq[p.id].avisos);
  if (nunca.length || semAv.length) add('', nunca.length ? `${nunca.length} ${nunca.length === 1 ? 'pessoa ainda não entrou' : 'pessoas ainda não entraram'} no app` : `${semAv.length} sem notificações ativas`,
    [nunca.length ? nunca.map(first).join(', ') : '', semAv.length && nunca.length ? `sem avisos: ${semAv.map(first).join(', ')}` : ''].filter(Boolean).join(' · ') || semAv.map(first).join(', '), ['Ver a equipe', 'nav', 'equipe']);
  if (S.ui.push !== true && (typeof pushSuportado !== 'function' || pushSuportado() || ehIOS())) add('', 'Receba os atrasos e o resumo no celular', 'As notificações deste aparelho estão desligadas.', ['Ativar', 'push', '']);
  return out;
}
function blocoDecisoes(){
  const l = decisoes();
  return `<section class="panel inbox"><div class="panel-h"><h2>Precisa de você</h2><p>${l.length ? `${l.length} ${l.length === 1 ? 'item' : 'itens'}` : 'nada pendente'}</p></div>
    ${l.length ? `<div class="stack gap8">${l.map(x => `<div class="dec ${x.k}"><div class="grow"><b>${esc(x.t)}</b>${x.s ? `<span>${esc(x.s)}</span>` : ''}</div>
      <button class="btn sm ${x.k === 'bad' ? 'primary' : ''}" data-act="${x.btn[1]}" data-v="${x.btn[2]}">${x.btn[0]}</button></div>`).join('')}</div>`
      : `<div class="dec-ok"><b>Nada esperando por você.</b><span>A gerência está tocando a operação: atrasos cobrados, conferências em dia e nenhuma decisão parada.</span></div>`}</section>`;
}

/* ---------- 3. Saúde da operação ---------- */
function sparkDias(){
  const h = history().slice(-14); if (h.length < 2) return '';
  const w = 160, hh = 36, bw = w / h.length;
  return `<svg class="spark" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" aria-label="Conformidade dos últimos ${h.length} dias">${h.map((d, k) => { const r = d.tot.exp ? d.tot.ok / d.tot.exp : 0, y = hh - Math.max(2, r * hh);
    return `<rect x="${(k * bw + 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(hh - y).toFixed(1)}" rx="1.5" fill="${r >= S.rules.meta ? 'var(--good)' : r >= S.rules.meta - .1 ? 'var(--accent)' : 'var(--bad)'}"/>`; }).join('')}
    <line x1="0" x2="${w}" y1="${(hh - S.rules.meta * hh).toFixed(1)}" y2="${(hh - S.rules.meta * hh).toFixed(1)}" stroke="currentColor" stroke-dasharray="3 3" opacity=".45"/></svg>`;
}
function blocoSaude(){
  const h = histAgg(x => x.tot), g = gerenteStats();
  const occ30 = S.occ.filter(o => !/^Cliente · elogio/.test(o.src || '')), resolv = occ30.filter(o => o.status === 'resolvida').length;
  const elog = S.occ.filter(o => /elogio/.test(o.src || '')).length, recl = S.occ.filter(o => /reclama/.test(o.src || '')).length;
  const pessoas = team(), noApp = pessoas.filter(p => S.statusEq?.[p.id]?.ultimo_acesso).length;
  const totalReads = S.pops.reduce((n, p) => n + popPeople(p).length, 0), pend = pendingReads().length, assin = totalReads ? (totalReads - pend) / totalReads : null;
  const linha = (t, v, s, k = '', extra = '') => `<div class="sd ${k}"><div class="sd-t"><span>${t}</span><b class="num">${v}</b></div>${extra}${s ? `<p>${s}</p>` : ''}</div>`;
  return `<section class="panel saude"><div class="panel-h"><h2>Saúde da operação</h2><p>últimos 30 dias</p></div>
    ${linha('Checklists no prazo · 4 semanas', rateTxt(h.rate), h.exp ? `${h.ok} de ${h.exp} no prazo, ${pct(h.doneRate)} feitos contando os atrasados` : aprendendo() ? 'Começa a contar depois da semana de aprendizado.' : 'Aparece com os primeiros dias completos.', rateKind(h.rate), sparkDias())}
    ${linha('Gerência respondeu hoje', rateTxt(g.rate), `${g.got} de ${g.exp}: conferências, cobranças, rondas e lembretes`, rateKind(g.rate), bar(g.rate, rateKind(g.rate), S.rules.meta))}
    ${linha('Ocorrências resolvidas', occ30.length ? `${resolv}/${occ30.length}` : '0', occ30.length ? `${occOpen().filter(o => !/elogio/.test(o.src || '')).length} ainda em aberto` : 'Nenhum problema registrado.', occ30.length && resolv < occ30.length / 2 ? 'warn' : '')}
    ${linha('Clientes', `${elog} <small>elogios</small> · ${recl} <small>${recl === 1 ? 'reclamação' : 'reclamações'}</small>`, elog + recl ? 'Registrados pela equipe no app.' : 'A equipe ainda não registrou nenhum comentário de cliente.', recl > elog ? 'warn' : '')}
    ${linha('Adesão da equipe', `${noApp}/${pessoas.length} <small>no app</small>`, assin != null ? `${pct(assin)} dos termos de ciência dos POPs assinados` : '', noApp < pessoas.length ? 'warn' : 'good', bar(pessoas.length ? noApp / pessoas.length : 0, noApp < pessoas.length ? 'warn' : 'good'))}
  </section>`;
}

/* ---------- Agora na barbearia (compacto) ---------- */
function blocoAgora(){
  const n = NOW(), late = S.inst.filter(i => status(i) === 'atrasado').sort((a, b) => a.due - b.due), open = S.inst.filter(i => status(i) === 'aberto').sort((a, b) => a.due - b.due);
  const next = S.inst.filter(i => status(i) === 'agendado' && i.start - n <= 90).sort((a, b) => a.start - b.start), pv = S.inst.filter(needsVer);
  const lista = [...late, ...open, ...next], mais = lista.length - 6;
  return `<section class="panel"><div class="panel-h"><h2>Agora na barbearia</h2><button class="linkbtn small" data-act="nav" data-v="hoje">Ver o dia inteiro</button></div>
    ${lista.length ? `<div class="tl">${lista.slice(0, 6).map(i => tlItem(i, {who:true})).join('')}</div>${mais > 0 ? `<p class="small muted">E mais ${mais} na linha do dia.</p>` : ''}`
      : `<p class="muted">${n >= DAY_END - 15 ? 'O dia acabou.' : 'Nada aberto ou previsto para os próximos 90 minutos.'}</p>`}
    ${pv.length ? `<p class="small muted">${pv.length} ${pv.length === 1 ? 'checklist concluído espera' : 'checklists concluídos esperam'} a conferência da gerente.</p>` : ''}</section>`;
}

/* ---------- O painel ---------- */
function pgPainel(){
  const ph_ = photos().slice(0, 6), salvo = S.resumos.find(r => r.data === TODAY_ISO);
  return `${painelTopo()}
    ${avisoInicio().replace(avisoAprendizado(), '')}${avisoFechado()}
    <div class="gestao">
      <div class="g-main">${blocoDecisoes()}${blocoAgora()}
        <section class="panel"><div class="panel-h"><h2>Conformidade por dia</h2><p>checklists feitos no prazo ÷ previstos</p></div>${dailyChart()}
          <div class="legend"><span><i class="dot" style="background:var(--good)"></i>na meta</span><span><i class="dot" style="background:var(--accent)"></i>até 10 p.p. abaixo</span><span><i class="dot" style="background:var(--bad)"></i>mais de 10 p.p. abaixo</span><span><i class="dash"></i>meta</span></div></section></div>
      <div class="g-side">${blocoSaude()}
        <section class="panel"><div class="panel-h"><h2>Fotos de hoje</h2><p>${photos().length}</p></div>
          ${ph_.length ? `<div class="photos sm">${ph_.map(x => `<button class="ph-fig" data-act="open" data-id="${x.i.id}">${photo(x.it.t, x.at, x.path)}<span class="small muted">${esc(first(person(x.i.who)))} · ${hm(x.at)}</span></button>`).join('')}</div>` : '<p class="small muted">Nenhuma foto ainda.</p>'}</section>
        <details class="panel" id="det-resumo"><summary class="sum">Resumo do dia para o WhatsApp</summary>
          <p class="small muted">${salvo ? `Enviado aos sócios às ${S.rules.resumo}.` : `Sai às ${S.rules.resumo} como notificação.`}</p><div class="wa" id="wa-text">${resumo()}</div>
          <div class="row" style="margin-top:10px"><button class="btn sm" data-act="copiar">Copiar</button></div></details>
      </div>
    </div>`;
}

/* ---------- Tema claro, escuro ou automático ---------- */
const TEMA_KEY = 'hype-tema';
const temaAtual = () => { try { return localStorage.getItem(TEMA_KEY) || 'auto'; } catch (e) { return 'auto'; } };
function aplicarTema(t = temaAtual()){
  const r = document.documentElement; if (!r) return;
  if (t === 'auto') delete r.dataset.theme; else r.dataset.theme = t;
  const escuro = t === 'dark' || (t === 'auto' && matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#0F0C09' : '#F4F0EA');
}
const TEMA_NOME = {auto:'Automático', light:'Claro', dark:'Escuro'};
const seletorTema = () => `<div class="tema" role="radiogroup" aria-label="Aparência">${['auto', 'light', 'dark'].map(t => `<button role="radio" aria-checked="${temaAtual() === t}" class="${temaAtual() === t ? 'on' : ''}" data-act="tema" data-v="${t}">${TEMA_NOME[t]}</button>`).join('')}</div>`;
Object.assign(A, {tema(d){ try { localStorage.setItem(TEMA_KEY, d.v); } catch (e) {} aplicarTema(d.v); render(); }});
aplicarTema();
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => aplicarTema()); } catch (e) {}
