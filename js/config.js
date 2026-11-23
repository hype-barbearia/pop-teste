/* Hype POP · AMBIENTE DE TESTE (teste.pop.hypebarbearia.com)
   Projeto Supabase "Hype POP Teste": banco separado, nada aqui chega à equipe nem mexe na produção.
   Na publicação da branch teste, este arquivo substitui js/config.js. A chave publicável é pública por natureza. */
const HYPE_CONFIG = {
  url: 'https://fdqyrywibppciaqgxhsg.supabase.co',
  key: 'sb_publishable_zGCTxVZVLeG53cK_qkMrZw_JmpR2Mne',
  vapid: 'BLPtYqnXXPpejj_k4CVPJqwpbuCuyKBRDF_svkwrqMx2joDqfRcDuEZI3-tgl6fGxwE088oN09PoGRsTQY9JVLk',  // chave pública das notificações (só do teste)
  ambiente: 'teste',
};

/* Ambiente de teste: faixa fixa na tela e "TESTE" no título, para ninguém confundir com o app real */
if (HYPE_CONFIG.ambiente === 'teste' && typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.classList.add('amb-teste');
  document.title = 'TESTE · ' + document.title;
}
