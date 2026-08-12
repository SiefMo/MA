const CACHE='maghraby-v2';
const A=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./public/logo.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(A))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{let z=r.clone();caches.open(CACHE).then(c=>c.put(e.request,z));return r}).catch(()=>caches.match('./index.html'))))});
