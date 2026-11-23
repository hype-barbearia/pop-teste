/* Hype POP · service worker
   - Notificações (push)
   - App abre sem internet: guarda uma cópia dos arquivos do app. Sempre tenta a rede primeiro,
     então com internet a pessoa recebe a versão nova na hora; a cópia só é usada quando a rede falha.
   Os dados (Supabase) não passam por aqui: o app guarda a última leitura do dia por conta própria. */
// Na publicação, o GitHub troca 'dev' pelo código do commit (ver .github/workflows/publicar.yml).
const CACHE = 'hype-pop-teste-5a3b60c';
const ARQUIVOS = ['./', './index.html', './css/app.css', './manifest.webmanifest', './icon.svg', './icon-180.png',
  ...['config','core','consts','engine','data','ui','socio','app','main','admin','ux','recursos','tv','dev','simulador','gestao','notas','cultura'].map(f => `./js/${f}.js`),
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ARQUIVOS.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

const doApp = u => u.origin === self.location.origin || u.hostname === 'cdn.jsdelivr.net' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (!doApp(u)) return;
  e.respondWith((async () => {
    try {
      // Arquivos do próprio app: sempre confere com o servidor (o GitHub deixa o navegador guardar por 10 min,
      // o que atrasava as atualizações). A conferência é rápida: se nada mudou, o servidor responde só "igual".
      const res = await fetch(r, u.origin === self.location.origin ? {cache:'no-cache'} : undefined);
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)).catch(() => {}); }
      return res;
    } catch (err) {
      const m = await caches.match(r, {ignoreSearch:true});
      if (m) return m;
      if (r.mode === 'navigate') return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      return Response.error();
    }
  })());
});

self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = {title:'Hype POP', body:e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Hype POP', {body:d.body || '', tag:d.tag, icon:'icon-180.png', badge:'icon-180.png', data:{url:d.url || './'}}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const c of all) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(e.notification.data.url || './');
  })());
});
