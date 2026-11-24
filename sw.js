/* OMINIA service worker (Tahap 2a, nama baru T-OMINIA, Tahap 3b: +4 berkas data, cache v2).
   Jaringan dulu supaya versi baru langsung terpakai; cache hanya cadangan offline.
   Semua jalur relatif terhadap sw.js, jadi aman di username.github.io/repo/.
   Naikkan CACHE (v1 -> v2) hanya bila daftar SHELL berubah; isi berkas diperbarui sendiri tiap kali online. */
const CACHE = 'ominia-v3-split';
const SHELL = ['./', 'index.html', 'style.css', 'engine.js', 'data-yoga.js', 'data-cerita.js', 'data-busana.js', 'data-tkpi.js', 'app-001-model-baru-batch-1.js', 'app-002-beranda-batch-2.js', 'app-003-impor-foto-strava-ke-catatan-ride-batc.js', 'app-004-84-tampilan-baru-halaman-nutrisi-moder.js', 'app-005-level-otomatis-skor-rubrik-tahap-76b-1.js', 'app-006-jurnal-input-cepat-daftar-makanan-batc.js', 'app-007-ai-audit-mingguan-on-track-batch-14.js', 'app-008-sesi-kalistenik-per-jenis-latihan-batc.js', 'app-009-jadwal-sesi.js', 'app-010-latihan-kalistenik-sesi-tampilan-baru.js', 'app-011-55-latihan-sepeda-beban-hrtss-if-struk.js', 'app-012-formulir-tes.js', 'app-013-v81a-halaman-ibadah-lainnya-ibadah-har.js', 'app-014-ib2-b3b3-data-sunnah-tahap-3b-3-tambah.js', 'app-015-v81d-halaman-ibadah-tab-kalender-hijri.js', 'app-016-hr-3b-begin-17-nov-2026-dapper-hari-in.js', 'app-017-stk-3a-begin-17-nov-2026-dapper-kamera.js', 'app-018-stb-2a1-begin-19-nov-2026-dapper-badan.js', 'app-019-otl-2b2a-begin-20-nov-2026-sinaps-lati.js', 'app-020-otl-5c-begin-21-nov-2026-sinaps-latiha.js', 'app-021-oth-3b2-begin-22-nov-2026-sinaps-hafal.js', 'app-022-oth-5c2d2b-begin-23-nov-2026-sinaps-ha.js', 'app-023-v82e-self-care-tab-pintar-blueprint-ba.js', 'app-024-data-makanan-tahap-73a.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

// T3d-2-2-5-2: manifest dan ikon OPSIONAL (boleh belum ada di repo); SEMUA berkas lain WAJIB. Bila satu berkas wajib gagal diambil,
// pemasangan DITOLAK (service worker lama, bila ada, tetap melayani; peramban mengulang pemasangan di kunjungan berikutnya),
// supaya tidak pernah ada service worker aktif dengan cache setengah jadi yang membuat aplikasi rusak saat luring.
const OPSIONAL = /^(manifest\.json|icon-[a-z0-9-]+\.png|apple-touch-icon\.png|favicon-[0-9]+\.png)$/;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(err => { if (!OPSIONAL.test(u)) throw err; }))))
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
      // T3d-2-3-2: jawaban galat (404/500, mis. satu berkas tidak terunggah) memakai salinan cache bila ada (berkas SHELL), supaya aplikasi lama yang utuh
      // tetap jalan; tanpa salinan, jawaban galat diteruskan apa adanya. (Cache dicari urut dari yang TERTUA, jadi cache lama yang utuh didahulukan.)
      if (res && res.status >= 400) return caches.match(r, { ignoreSearch: true }).then(m => m || res);
      return res;
    }).catch(() =>
      caches.match(r, { ignoreSearch: true })
        .then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined))
        .then(m => m || Response.error())
    )
  );
});
