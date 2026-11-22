// Service worker: guarda a app no telemóvel para abrir sem rede.
// Ao publicar uma versão nova, muda o número abaixo.
const VERSAO = 'contas-v1.3.0';
const BASE = ['./', './index.html', './app.js', './firebase.js', './historico.js', './config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const proprio = url.origin === location.origin;
  const fontes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!proprio && !fontes) return; // Firebase (Firestore/Auth) vai sempre direto à rede
  // Rede primeiro para ficheiros da app (apanha versões novas); cache quando não há rede.
  e.respondWith(
    (proprio ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req)).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
