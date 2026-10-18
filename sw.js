// EVO — cache para funcionar offline depois da primeira visita
const CACHE='evo-v5';
const FILES=['./','index.html','app.js','data.js','exart.js','cloud.js','firebase-config.js','manifest.webmanifest','garrafa-m.webp','garrafa-f.webp','macros.webp','mascote-m.webp','mascote-f.webp','mascot/garrafa-m-body.webp','mascot/garrafa-m-mouth.webp','mascot/garrafa-m-armL.webp','mascot/garrafa-m-armR.webp','mascot/garrafa-f-body.webp','mascot/garrafa-f-mouth.webp','mascot/garrafa-f-armL.webp','mascot/garrafa-f-armR.webp','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=e.request.url, same=u.startsWith(self.location.origin), cdn=/cdnjs|fonts\.(googleapis|gstatic)|gstatic\.com\/firebasejs/.test(u);
  if(!same && !cdn) return; // Firebase (login e banco) sempre direto pela rede
  if(same && /firebase-config\.js|cloud\.js/.test(u)){ // configuração: rede primeiro
    e.respondWith(fetch(e.request).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return res; }).catch(()=>caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    if(res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); }
    return res;
  }).catch(()=>caches.match('index.html'))));
});
