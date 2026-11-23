/* OMINIA service worker (Tahap 2a, nama baru T-OMINIA, Tahap 3b: +4 berkas data, cache v2).
   Jaringan dulu supaya versi baru langsung terpakai; cache hanya cadangan offline.
   Semua jalur relatif terhadap sw.js, jadi aman di username.github.io/repo/.
   Naikkan CACHE (v1 -> v2) hanya bila daftar SHELL berubah; isi berkas diperbarui sendiri tiap kali online. */
const CACHE = 'ominia-v2';
const SHELL = ['./', 'index.html', 'style.css', 'engine.js', 'data-yoga.js', 'data-cerita.js', 'data-busana.js', 'data-tkpi.js', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => { /* berkas yang belum ada dilewati */ }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  let u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (u.origin !== self.location.origin) return;   // gambar, video, dan API luar tidak disentuh
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res && res.ok && res.type === 'basic') {
        const cp = res.clone(), et = res.headers.get('etag');
        // tulis ke cache hanya bila isinya berubah (ETag beda), supaya berkas 5 MB tidak ditulis ulang tiap dibuka
        caches.open(CACHE).then(c => c.match(r).then(m => {
          if (m && et && m.headers.get('etag') === et) return;
          return c.put(r, cp);
        })).catch(() => { /* abaikan */ });
      }
      return res;
    }).catch(() =>
      caches.match(r, { ignoreSearch: true })
        .then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined))
        .then(m => m || Response.error())
    )
  );
});
