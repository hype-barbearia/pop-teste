/* =========================================================
   Hype POP · simulador do acesso DEV
   Um dia fictício, montado com a rotina, as pessoas e os POPs reais, em que
   todas as ações funcionam de verdade (marcar, concluir, conferir, cobrar,
   ocorrências, reposição...) sem tocar no banco: tudo fica na memória do
   aparelho e some ao sair do simulador ou recarregar a página.
   ========================================================= */
let SIM = null;
const SIM_CONFIG = ['pessoas', 'pops', 'pop_versoes', 'rotinas', 'rotina_janelas', 'rotina_itens', 'rodizio_escala', 'lembretes', 'regras', 'config_textos', 'definicoes', 'recursos', 'cultura_padroes'];
const SIM_VAZIAS = ['execucoes', 'execucao_itens', 'cobrancas', 'ocorrencias', 'ocorrencia_acoes', 'lembretes_feitos', 'pop_leituras', 'ausencias', 'dias_fechados',
  'resumos', 'documentos_fiscais', 'nf_valores', 'rotina_agendamentos', 'reposicao', 'privacidade_aceite', 'dev_acessos', 'cultura_registros'];
const SIM_PK = {rodizio_escala:['rotina_id', 'dow'], config_textos:['chave'], recursos:['chave'], privacidade_aceite:['pessoa_id', 'versao'], nf_valores:['pessoa_id', 'periodo'],
  execucao_itens:['execucao_id', 'item_id'], pop_leituras:['pop_id', 'pessoa_id', 'versao'], lembretes_feitos:['lembrete_id', 'data']};

/* Minutos do dia (Recife, UTC-3) → instante ISO de hoje */
const simTs = m => new Date(Date.UTC(+TODAY_ISO.slice(0, 4), +TODAY_ISO.slice(5, 7) - 1, +TODAY_ISO.slice(8, 10), 3, 0) + m * 60000).toISOString();
let SIM_SEQ = 1000;
const simId = () => ++SIM_SEQ;

/* ---------- O dia fictício ---------- */
function simGerarDia(db, hora){
  const wd = new Date(TODAY_ISO + 'T12:00:00Z').getUTCDay(), dow = wd === 0 ? 2 : wd;
  const pessoas = db.pessoas.filter(p => p.ativo && p.papel !== 'dev'), P = Object.fromEntries(pessoas.map(p => [p.id, p]));
  const livre = (pid, r) => P[pid] && (r.ignora_folga || P[pid].folga !== dow);
  let n = 0;
  db.rotinas.filter(r => r.ativo && (r.dias || []).includes(dow)).forEach(r => {
    const itens = db.rotina_itens.filter(i => i.rotina_id === r.id && i.ativo).sort((a, b) => a.ordem - b.ordem);
    db.rotina_janelas.filter(j => j.rotina_id === r.id && j.ativo !== false && (!j.dias || j.dias.includes(dow))).forEach(j => {
      const esc_ = db.rodizio_escala.find(e => e.rotina_id === r.id && e.dow === dow)?.pessoa_id;
      const quem = r.cada ? r.cada : r.cada_papel ? pessoas.filter(p => p.papel === r.cada_papel).map(p => p.id) : [esc_ || j.responsavel];
      quem.filter(pid => livre(pid, r)).forEach(pid => {
        const id = `sim-${++n}`, ini = toMin(j.inicio), fim = toMin(j.prazo), k = n % 10;
        const x = {id, data:TODAY_ISO, rotina_id:r.id, janela_id:j.id, pessoa_id:pid, inicio:simTs(ini), prazo:simTs(fim), concluida_em:null, refazer_em:null, refazer_obs:null,
          conferido_em:null, conferido_resultado:null, conferido_obs:null, conferido_por:null, agendamento_id:null, sorteada:null};
        db.execucoes.push(x);
        const marca = (qtd, falha) => itens.slice(0, qtd).forEach((it, m) => db.execucao_itens.push({execucao_id:id, item_id:it.id, ok:!(falha && m === 1), marcado_em:simTs(Math.min(ini + 2 + m, hora - 1)),
          foto_path:null, obs:falha && m === 1 ? 'Acabou o produto' : null, por:pid, execucoes:{data:TODAY_ISO}}));
        if (fim <= hora) {
          if (k === 8) { marca(Math.ceil(itens.length / 2)); return; }                       // atrasado, pela metade
          const falha = k === 7 && itens.length > 1, quando = k === 6 ? fim + 12 : fim - 4;    // 6: com atraso · 7: com item não feito
          marca(itens.length, falha); x.concluida_em = simTs(Math.min(quando, hora - 1));
          if (falha) db.ocorrencias.push({id:simId(), data:TODAY_ISO, em:simTs(fim - 5), pessoa_id:r.tipo === 'ronda' ? null : pid, origem:r.tipo === 'ronda' ? 'Ronda da gerente' : 'Checklist',
            execucao_id:id, pop_id:r.pop_id, titulo:`${itens[1].texto}: não feito`, descricao:'Acabou o produto', status:'aberta', criado_por:pid, responsavel_id:null, prazo:null, foto_path:null});
          if (k === 9 && r.conferir) Object.assign(x, {conferido_em:simTs(Math.min(fim + 10, hora - 1)), conferido_resultado:'ok', conferido_por:pessoas.find(p => p.papel === 'gerente')?.id || null});
        } else if (ini <= hora) marca(Math.floor(itens.length / 2));
      });
    });
  });
  db.reposicao.push({id:simId(), item:'Álcool 70%', obs:'acaba amanhã', execucao_id:null, pedido_por:pessoas.find(p => p.papel === 'atendente')?.id || null, em:simTs(hora - 50), resolvido_em:null, resolvido_por:null});
  db.ocorrencias.push({id:simId(), data:TODAY_ISO, em:simTs(hora - 70), pessoa_id:pessoas.find(p => p.papel === 'barbeiro' && p.parceiro)?.id || null, origem:'Cliente · elogio', execucao_id:null, pop_id:null,
    titulo:'Elogio de cliente', descricao:'Saí renovado, atendimento excelente', status:'resolvida', criado_por:pessoas.find(p => p.papel === 'atendente')?.id || null, responsavel_id:null, prazo:null, foto_path:null});
  return n;
}

/* ---------- Banco na memória ---------- */
function simFrom(t){
  const q = {t, f:[], op:'select', vals:null, single:false};
  const o = {};
  ['select', 'gte', 'lte', 'order', 'limit', 'or', 'is', 'in', 'neq', 'range'].forEach(k => o[k] = () => o);
  o.eq = (c, v) => { if (!String(c).includes('.')) q.f.push([c, v]); return o; };
  o.maybeSingle = o.single = () => { q.single = true; return o; };
  o.insert = v => { q.op = 'insert'; q.vals = v; return o; };
  o.update = v => { q.op = 'update'; q.vals = v; return o; };
  o.upsert = v => { q.op = 'upsert'; q.vals = v; return o; };
  o.delete = () => { q.op = 'delete'; return o; };
  o.then = (res, rej) => Promise.resolve().then(() => simExec(q)).then(res, rej);
  return o;
}
function simExec(q){
  const db = SIM.db, tab = db[q.t] ??= [], bate = r => q.f.every(([c, v]) => String(r[c]) === String(v));
  if (q.op === 'select') { const rows = tab.filter(bate).map(r => ({...r})); return {data:q.single ? (rows[0] || null) : rows, error:null}; }
  if (q.op === 'insert') { const vs = [].concat(q.vals).map(v => ({id:simId(), ...v})); tab.push(...vs); return {data:vs, error:null}; }
  if (q.op === 'update') { tab.filter(bate).forEach(r => Object.assign(r, q.vals)); return {data:null, error:null}; }
  if (q.op === 'upsert') { const pk = SIM_PK[q.t] || ['id']; [].concat(q.vals).forEach(v => { const r = tab.find(x => pk.every(k => String(x[k]) === String(v[k]))); r ? Object.assign(r, v) : tab.push({...v}); }); return {data:null, error:null}; }
  if (q.op === 'delete') { db[q.t] = tab.filter(r => !bate(r)); return {data:null, error:null}; }
}

/* ---------- Funções do servidor, simuladas ---------- */
function simRpc(f, a = {}){
  const db = SIM.db, U = S.ui.user, agora = simTs(horaAgora()), ok = data => Promise.resolve({data, error:null}), erro = m => Promise.resolve({data:null, error:{message:m}});
  const x = a.e && db.execucoes.find(e => e.id === a.e), eu = db.pessoas.find(p => p.id === U);
  const gestor = eu && (['socio', 'gerente'].includes(eu.papel));
  const ocorrencia = o => db.ocorrencias.push({id:simId(), data:TODAY_ISO, em:agora, execucao_id:null, pop_id:null, descricao:null, status:'aberta', criado_por:U, responsavel_id:null, prazo:null, foto_path:null, pessoa_id:null, ...o});
  switch (f) {
    case 'garantir_dia': case 'registrar_erro': case 'inscrever_push': case 'remover_push': case 'dev_registrar_acesso': return ok(null);
    case 'historico': case 'relatorio': case 'falhas_itens': case 'falhas_periodo': return ok([]);
    case 'status_equipe': return ok(db.pessoas.filter(p => p.ativo && p.papel !== 'dev').map(p => ({pessoa_id:p.id, avisos:1, ultimo_acesso:agora, privacidade:agora})));
    case 'marcar_item': {
      if (!x || x.pessoa_id !== U) return erro('Este checklist não é seu.');
      if (x.concluida_em) return erro('Checklist já concluído.');
      if (!a.feito && !String(a.nota || '').trim()) return erro('Explique o motivo.');
      const r = db.execucao_itens.find(i => i.execucao_id === a.e && i.item_id === a.item), v = {execucao_id:a.e, item_id:a.item, ok:!!a.feito, marcado_em:agora, foto_path:a.foto || null, obs:a.nota || null, por:U, execucoes:{data:TODAY_ISO}};
      r ? Object.assign(r, v) : db.execucao_itens.push(v);
      if (!a.feito) { const ro = db.rotinas.find(r_ => r_.id === x.rotina_id), it = db.rotina_itens.find(i => i.id === a.item);
        ocorrencia({pessoa_id:ro.tipo === 'ronda' ? null : x.pessoa_id, origem:ro.tipo === 'ronda' ? 'Ronda da gerente' : 'Checklist', execucao_id:a.e, pop_id:ro.pop_id, titulo:`${it.texto}: ${ro.tipo === 'ronda' ? 'não conforme' : 'não feito'}`, descricao:a.nota}); }
      return ok(null);
    }
    case 'desmarcar_item': db.execucao_itens = db.execucao_itens.filter(i => !(i.execucao_id === a.e && i.item_id === a.item)); return ok(null);
    case 'concluir': {
      if (!x || x.pessoa_id !== U) return erro('Este checklist não é seu.');
      const faltam = db.rotina_itens.filter(i => i.rotina_id === x.rotina_id && i.ativo && !db.execucao_itens.some(c => c.execucao_id === a.e && c.item_id === i.id)).length;
      if (faltam) return erro(`Faltam ${faltam} itens.`);
      const nc = db.execucao_itens.some(c => c.execucao_id === a.e && !c.ok), amostra = +(db.regras[0]?.conferir_amostra ?? 1);
      Object.assign(x, {concluida_em:agora, sorteada:x.refazer_em || nc ? true : (x.sorteada ?? Math.random() < amostra), refazer_em:null, refazer_obs:null});
      return ok(null);
    }
    case 'conferir': {
      if (!gestor) return erro('Só a gerente ou os sócios conferem.');
      if (a.resultado !== 'ok' && !String(a.nota || '').trim()) return erro('Escreva a observação.');
      if (a.resultado === 'refazer') { Object.assign(x, {concluida_em:null, refazer_em:agora, refazer_obs:a.nota, conferido_em:null, conferido_resultado:null}); db.execucao_itens = db.execucao_itens.filter(c => !(c.execucao_id === a.e && c.foto_path)); }
      else Object.assign(x, {conferido_em:agora, conferido_resultado:a.resultado, conferido_obs:a.nota, conferido_por:U});
      return ok(null);
    }
    case 'cobrar': db.cobrancas.push({id:simId(), execucao_id:a.e, por:U, em:agora, execucoes:{data:TODAY_ISO}}); return ok(null);
    case 'lembrete_feito': db.lembretes_feitos.push({lembrete_id:a.l, data:TODAY_ISO, em:agora, por:U}); return ok(null);
    case 'abrir_ocorrencia': ocorrencia({titulo:a.titulo, pessoa_id:a.pessoa || null, origem:gestor ? a.origem : 'Equipe', descricao:a.descricao, responsavel_id:gestor ? a.responsavel || null : null, prazo:gestor ? a.prazo : null, foto_path:a.foto || null}); return ok(simId());
    case 'registrar_acao': { const o = db.ocorrencias.find(o_ => o_.id === a.oc); if (!o) return erro('Ocorrência não encontrada.');
      if (a.texto) db.ocorrencia_acoes.push({id:simId(), ocorrencia_id:a.oc, por:U, texto:a.texto, em:agora}); o.status = a.resolver ? 'resolvida' : 'tratamento'; return ok(null); }
    case 'ajustar_ocorrencia': { const o = db.ocorrencias.find(o_ => o_.id === a.oc); if (o) Object.assign(o, {responsavel_id:a.responsavel || null, prazo:a.prazo || null}); return ok(null); }
    case 'assinar_pop': { const p = db.pops.find(p_ => p_.id === a.pop); db.pop_leituras.push({pop_id:a.pop, pessoa_id:U, versao:p?.versao || 1, em:agora}); return ok(null); }
    case 'pedir_reposicao': db.reposicao.unshift({id:simId(), item:a.item, obs:a.obs || null, execucao_id:a.execucao || null, pedido_por:U, em:agora, resolvido_em:null, resolvido_por:null}); return ok(null);
    case 'resolver_reposicao': { if (!gestor) return erro('Só a gerente ou os sócios marcam a reposição.'); const r = db.reposicao.find(r_ => r_.id === a.r); if (r) Object.assign(r, {resolvido_em:a.desfazer ? null : agora, resolvido_por:a.desfazer ? null : U}); return ok(null); }
    case 'registrar_cliente': ocorrencia({titulo:a.tipo === 'elogio' ? 'Elogio de cliente' : 'Reclamação de cliente', origem:a.tipo === 'elogio' ? 'Cliente · elogio' : 'Cliente · reclamação', descricao:a.texto, pessoa_id:a.pessoa || null, status:a.tipo === 'elogio' ? 'resolvida' : 'aberta'}); return ok(simId());
    case 'registrar_cultura': if (!gestor) return erro('Só a gerente ou os sócios registram.'); if (a.tipo === 'desvio' && !String(a.nota || '').trim()) return erro('Escreva o que aconteceu.');
      db.cultura_registros.unshift({id:simId(), data:TODAY_ISO, em:agora, pessoa_id:a.pessoa, padrao_id:a.padrao, tipo:a.tipo, nota:a.nota || null, por:U}); return ok(null);
    case 'apagar_cultura': db.cultura_registros = db.cultura_registros.filter(r => r.id !== a.r); return ok(null);
    case 'anotar_reuniao': { const e_ = db.execucoes.find(x_ => x_.id === a.e); if (e_) e_.notas = String(a.texto || '').trim() || null; return ok(null); }
    case 'aceitar_privacidade': db.privacidade_aceite.push({pessoa_id:U, versao:a.versao, em:agora}); return ok(null);
    case 'registrar_ausencia': if (!gestor) return erro('Só a gerente ou os sócios registram ausência.'); db.ausencias.push({id:simId(), pessoa_id:a.pessoa, inicio:a.de, fim:a.ate, motivo:a.motivo || null, substituto:a.substituto || null, por:U, em:agora}); return ok(null);
    case 'remover_ausencia': db.ausencias = db.ausencias.filter(x_ => x_.id !== a.a); return ok(null);
    default: return erro('Esta ação não existe no simulador. No simulador funcionam checklists, conferência, cobrança, ocorrências, reposição, clientes, POPs e ausências.');
  }
}
const simStorage = {from:() => ({
  upload:async (p, blob) => { SIM.blobs[p] = URL.createObjectURL(blob); return {data:{path:p}, error:null}; },
  createSignedUrls:async paths => ({data:paths.map(p => ({path:p, signedUrl:SIM.blobs[p] || ''})), error:null}),
  createSignedUrl:async p => ({data:{signedUrl:SIM.blobs[p] || ''}, error:null}),
  remove:async () => ({data:[], error:null})})};

/* ---------- Entrar e sair ---------- */
async function simIniciar(hora){
  const db = {};
  for (const t of SIM_CONFIG) { const {data, error} = await sb.from(t).select('*'); if (error) throw new Error(`${t}: ${error.message}`); db[t] = Array.isArray(data) ? data : data ? [data] : []; }
  SIM_VAZIAS.forEach(t => db[t] = []);
  const n = simGerarDia(db, hora);
  SIM = {db, blobs:{}, orig:{from:Object.getOwnPropertyDescriptor(sb, 'from'), rpc:Object.getOwnPropertyDescriptor(sb, 'rpc'), storage:Object.getOwnPropertyDescriptor(sb, 'storage')}};
  forcarFixos();
  Object.defineProperty(sb, 'from', {value:simFrom, configurable:true, writable:true});
  Object.defineProperty(sb, 'rpc', {value:simRpc, configurable:true, writable:true});
  Object.defineProperty(sb, 'storage', {value:simStorage, configurable:true, writable:true});
  return n;
}
function simSair(){
  if (!SIM) return;
  for (const k of ['from', 'rpc', 'storage']) { delete sb[k]; if (SIM.orig[k]) Object.defineProperty(sb, k, SIM.orig[k]); }
  Object.values(SIM.blobs).forEach(u => URL.revokeObjectURL(u));
  SIM = null; forcarFixos();
}
