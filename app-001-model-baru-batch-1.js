'use strict';

/* ========= KONFIGURASI ========= */
// Target gizi dihitung per hari lewat tgFor(tanggal) (lihat MODUL: PETA). Fase 1 = 1.600 kcal / 140 g / 3 L.
const PRAYERS = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
const KEY = 'dailylog:v1';
const KEY_P = 'dailylog:plan:v1', KEY_T = 'dailylog:train:v1', KEY_C = 'dailylog:checks:v1', KEY_M = 'dailylog:meta:v1';

/* ========= MODUL: PENCATAT PELANGGARAN CSP (T4e-1, 25 Nov 2026) =========
   Tujuan: CSP di index.html (dist) memblokir fitur tanpa pesan; di HP tanpa konsol tidak ada yang terlihat. Pencatat ini menangkap event
   `securitypolicyviolation` dan menyimpan ringkasannya: direktif + alamat TANPA kueri/fragmen/kredensial + sumber berkas:baris + hitungan.
   Tidak ada jaringan, tidak ada data log harian, isi skrip (`sample`) TIDAK disimpan. Gagal simpan = tetap jalan di memori.
   Berdiri sendiri (tanpa fungsi aplikasi lain) agar bisa diuji di Node: penanda CSPLOG:begin/end dipakai alat/t4e1_csplog.js. */
/* CSPLOG:begin */
const CSPLOG = (() => {
  const KEY = 'dailylog:csp:v1', MAX = 40, CUT = 140, SAVE_MS = 350, NMAX = 99999;
  let rows = null, seen = 0, timer = 0;
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  function urlBersih(raw) {   // alamat -> skema://host/jalur (kueri, fragmen, nama pengguna, sandi dibuang); 'inline', 'eval', 'data' dst. tetap
    raw = str(raw, 600).trim();
    if (!raw) return '';
    try {
      const u = new URL(raw), sk = u.protocol.replace(':', '');
      return (u.host ? sk + '://' + u.host + u.pathname : sk).slice(0, CUT);
    } catch (e) {
      return raw.replace(/[?#].*$/, '').replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*@/i, '').slice(0, CUT);
    }
  }
  const direktif = ev => str(ev.effectiveDirective || ev.violatedDirective, 80).trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'tak-dikenal';
  function sumber(ev) {   // berkas penyebab (bila ada) + nomor baris; berkas se-asal ditulis sebagai jalur saja
    let s = urlBersih(ev.sourceFile);
    try { const o = location.origin + '/'; if (s.indexOf(o) === 0) s = s.slice(o.length - 1); } catch (e) { /* abaikan */ }
    const l = Math.floor(Number(ev.lineNumber));
    return s ? (s + (l > 0 && l < 1e8 ? ':' + l : '')).slice(0, CUT) : '';
  }
  function muat() {
    if (rows) return rows;
    rows = [];
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && typeof o === 'object' && Array.isArray(o.rows)) {
        seen = Number(o.seen) > 0 ? Number(o.seen) : 0;
        o.rows.forEach(r => {
          if (!r || typeof r !== 'object' || rows.length >= MAX) return;
          const d = str(r.d, 40); if (!d) return;
          rows.push({ d, u: str(r.u, CUT), s: str(r.s, CUT), n: Math.min(NMAX, Math.max(1, Math.floor(Number(r.n)) || 1)), a: Number(r.a) || 0, z: Number(r.z) || 0 });
        });
      }
    } catch (e) { /* rusak atau penyimpanan tak tersedia: mulai kosong */ }
    return rows;
  }
  function simpan() {   // ditunda 350 ms supaya serentetan pelanggaran = satu tulisan
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      try { localStorage.setItem(KEY, JSON.stringify({ v: 1, seen, rows: muat() })); } catch (e) { /* penuh atau diblokir: tetap di memori */ }
    }, SAVE_MS);
  }
  function tambah(d, u, s, now) {   // kejadian yang sama (direktif + alamat + sumber) digabung: hitungan naik, naik ke urutan teratas
    const r = muat(); now = now || Date.now();
    const i = r.findIndex(x => x.d === d && x.u === u && x.s === s);
    if (i >= 0) { const x = r.splice(i, 1)[0]; x.n = Math.min(NMAX, x.n + 1); x.z = now; r.unshift(x); }
    else { r.unshift({ d, u, s, n: 1, a: now, z: now }); if (r.length > MAX) r.length = MAX; }
    simpan();
  }
  function catat(ev) { if (ev) tambah(direktif(ev), urlBersih(ev.blockedURI) || '(kosong)', sumber(ev)); }
  const daftar = () => muat().map(r => Object.assign({}, r));
  const jumlah = () => muat().reduce((a, r) => a + r.n, 0);
  const baru = () => muat().filter(r => r.z > seen).length;   // jenis pelanggaran yang terakhir terjadi SESUDAH halaman Data terakhir dibuka
  function tandaiDilihat() { muat(); seen = Date.now(); simpan(); }
  function hapus() { rows = []; seen = 0; if (timer) { clearTimeout(timer); timer = 0; } try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ } }
  function waktu(t) { const d = new Date(t); if (!t || isNaN(d)) return '-'; const p = n => (n < 10 ? '0' : '') + n; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + '.' + p(d.getMinutes()); }
  function teks() {   // untuk disalin pemilik; tidak memuat alamat situs sendiri maupun kueri
    const r = muat(); let ua = ''; try { ua = str(navigator.userAgent, 110); } catch (e) { /* abaikan */ }
    return ['Catatan pelanggaran CSP Ominia', 'Perangkat: ' + ua, 'Jenis: ' + r.length + ', total kejadian: ' + jumlah(), '']
      .concat(r.map((x, i) => (i + 1) + '. [' + x.d + '] ' + x.u + (x.s ? ' | sumber ' + x.s : '') + ' | ' + x.n + 'x | pertama ' + waktu(x.a) + ' | terakhir ' + waktu(x.z))).join('\n');
  }
  try { document.addEventListener('securitypolicyviolation', ev => { try { catat(ev); } catch (e) { /* pencatat tidak boleh mengganggu aplikasi */ } }); } catch (e) { /* peramban lama */ }
  return { catat, tambah, daftar, jumlah, baru, tandaiDilihat, hapus, teks, waktu, KEY, MAX };
})();
/* CSPLOG:end */

/* ========= UTIL ========= */
const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const num = v => {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmt = (n, d = 2) => {
  if (n == null) return '–';
  const p = Math.pow(10, d), r = Math.round(n * p) / p;
  const [i, f] = String(r).split('.');
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return f ? ii + ',' + f : ii;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayLong = s => { const d = pd(s); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); };
const dayShort = s => {
  const d = pd(s), y = d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '';
  return HARI[d.getDay()].slice(0, 3) + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + y;
};

const weekStart = s => addDays(s, -((pd(s).getDay() + 6) % 7));   // Senin
const shortDate = s => { const d = pd(s); return d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3); };
const rangeLabel = ws => {
  const a = pd(ws), b = pd(addDays(ws, 6)), ma = BULAN[a.getMonth()], mb = BULAN[b.getMonth()];
  if (a.getFullYear() !== b.getFullYear()) return a.getDate() + ' ' + ma.slice(0, 3) + ' ' + a.getFullYear() + ' – ' + b.getDate() + ' ' + mb.slice(0, 3) + ' ' + b.getFullYear();
  if (a.getMonth() !== b.getMonth()) return a.getDate() + ' ' + ma.slice(0, 3) + ' – ' + b.getDate() + ' ' + mb.slice(0, 3) + ' ' + b.getFullYear();
  return a.getDate() + ' – ' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
};
const sgn = (n, d, ascii) => {
  const p = Math.pow(10, d), r = Math.round(n * p) / p;
  return (r > 0 ? '+' : r < 0 ? (ascii ? '-' : '−') : '') + fmt(Math.abs(r), d);
};

/* ========= MODEL ========= */
const ENUMS = { shalat: ['ya', 'bolong'], junk: ['bersih', 'melanggar'], kram: ['tidak', 'ya'], snore: ['tidak', 'ya'] };
const SL_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;   // v23z4: jam tidur/bangun "HH:MM"
const blank = () => ({
  shalat: null, missed: [], shalatNote: '', sh: {}, pmo: '', stH: '', stM: '',
  kcal: '', protein: '', water: '', junk: null, junkNote: '', kram: null, kramPart: '',
  sesi: [], rpe: null, sleep: '', sleepStart: '', sleepEnd: '', snore: null, eval: '', updated: 0
});
function clean(raw) {
  const b = blank();
  if (!raw || typeof raw !== 'object') return b;
  for (const k of Object.keys(b)) {
    if (!(k in raw)) continue;
    const v = raw[k];
    if (Array.isArray(b[k])) b[k] = Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    else if (ENUMS[k]) b[k] = ENUMS[k].includes(v) ? v : null;
    else if (k === 'rpe') b[k] = (Number.isInteger(v) && v >= 1 && v <= 10) ? v : null;
    else if (k === 'sh') b[k] = shClean(v);   // v23p
    else if (k === 'sleepStart' || k === 'sleepEnd') b[k] = (typeof v === 'string' && SL_TIME_RE.test(v)) ? v : '';   // v23z4 (z5: hanya teks; larik ["06:00"] lolos regex karena dipaksa jadi teks)
    else if (k === 'updated') b[k] = Number(v) || 0;
    else b[k] = v == null ? '' : String(v);
  }
  { const m = sleepMin(b); if (m != null) b.sleep = slHrs(m); }   // v23z5: jam lengkap dan berbeda = durasi SELALU mengikuti jam (kotak durasi terkunci)
  if (b.sh && Object.keys(b.sh).length) shSync(b);   // v23p: shalat/missed/shalatNote selalu sejalan dengan sh
  return b;
}

let db = {};
let pdb = pblank();   // rencana & pengaturan perjalanan
let tdb = {};         // latihan & ride per tanggal
let cdb = {};         // ceklis harian per tanggal
let curView = 'home';
let cur = today();
const E = () => db[cur] || blank();
function setE(patch) {
  const e = db[cur] || (db[cur] = blank());
  Object.assign(e, patch);
  e.updated = Date.now();
  queueSave();
  paintControls();
  derived();
}
function setField(k, v) {
  const el = $('[data-k="' + k + '"]');
  if (el) el.value = v;
  setE({ [k]: v });
}

/* ===== v23z4 (Jurnal > Harian): jam mulai tidur + jam bangun -> durasi tidur otomatis. Durasi tetap disimpan di e.sleep (jam, desimal) supaya halaman lain tidak berubah. Membalik: patch23z4.py --reverse ===== */
const slMin = s => SL_TIME_RE.test(s) ? (+s.slice(0, 2)) * 60 + (+s.slice(3)) : null;
function sleepMin(e) {   // menit tidur dari sleepStart ke sleepEnd (boleh melewati tengah malam); null bila belum lengkap atau jamnya sama
  const a = slMin(e.sleepStart), b = slMin(e.sleepEnd);
  return (a == null || b == null || a === b) ? null : (b - a + 1440) % 1440;
}
const slHrs = m => String(Math.round(m / 60 * 100) / 100).replace('.', ',');
function sleepAuto() {   // sesudah jam tidur/bangun diubah: isi durasi bila kedua jam lengkap
  const m = sleepMin(E());
  if (m != null) setField('sleep', slHrs(m));
}
function sleepPaint() {   // kunci kotak durasi bila dihitung dari jam; tampilkan petunjuk + tombol Hapus jam
  const e = E(), m = sleepMin(e), box = $('#sleepDur'), inp = $('[data-k="sleep"]'), h = $('#sleepHint');
  if (!box || !inp || !h) return;
  inp.readOnly = m != null; box.classList.toggle('lock', m != null);
  const any = e.sleepStart !== '' || e.sleepEnd !== '';
  let t = '';
  if (m != null) t = 'Durasi dihitung dari jam tidur dan bangun: ' + Math.floor(m / 60) + ' jam ' + (m % 60) + ' menit.';
  else if (e.sleepStart !== '' && e.sleepStart === e.sleepEnd) t = 'Jam tidur dan bangun sama, jadi durasi belum bisa dihitung.';
  else if (any) t = 'Isi kedua jam supaya durasi dihitung otomatis.';
  h.innerHTML = any ? t + ' <button class="btn sm ghost" data-q="sleepClr">Hapus jam</button>' : '';
}

/* ========= PENYIMPANAN ========= */
const KEY_W = 'dailylog:weekly:v1';
const store = {
  mode: 'memory', err: '',
  detect() {
    if (window.storage && typeof window.storage.get === 'function') { this.mode = 'artifact'; return; }
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); this.mode = 'local'; }
    catch (e) { this.mode = 'memory'; }
  },
  async load(key) {
    try {
      if (this.mode === 'artifact') { const r = await window.storage.get(key); return r && r.value ? JSON.parse(r.value) : {}; }
      if (this.mode === 'local') { const v = localStorage.getItem(key); return v ? JSON.parse(v) : {}; }
    } catch (e) { /* kunci belum ada / data rusak */ }
    return {};
  },
  async save(key, obj) {
    const s = JSON.stringify(obj);
    try {
      if (this.mode === 'artifact') { const ok = !!(await window.storage.set(key, s)); if (ok) this.err = ''; return ok; }
      if (this.mode === 'local') { localStorage.setItem(key, s); this.err = ''; return true; }
    } catch (e) { this.err = (e && e.name) || 'error'; }
    return false;
  }
};
const STORES = {
  d: { key: KEY, get: () => db }, w: { key: KEY_W, get: () => wdb },
  p: { key: KEY_P, get: () => pdb }, t: { key: KEY_T, get: () => tdb }, c: { key: KEY_C, get: () => cdb },
  m: { key: KEY_M, get: () => mdb }
};
const dirty = { d: false, w: false, p: false, t: false, c: false, m: false };
let saveTimer = null;
function setStatus(s) {
  const cls = 'dot ' + (s === 'idle' ? '' : s);
  const txt = ({
    idle: 'Siap',
    saving: 'Menyimpan…',
    saved: store.mode === 'local' ? 'Tersimpan di perangkat ini' : 'Tersimpan',
    unsaved: /quota/i.test(store.err) ? 'Penyimpanan penuh. Cadangkan di tab Data' : 'Belum tersimpan permanen. Cadangkan di tab Data'
  })[s];
  $$('.dot').forEach(x => { x.className = cls; });
  $$('.stxt').forEach(x => { x.textContent = txt; });
  try { nxStat(s); } catch (e) { /* v23w7: modul belum siap */ }
}
function queueSave(kind) { dirty[kind === true ? 'w' : (kind || 'd')] = true; setStatus('saving'); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500); }
let booted = false, bootRes = null;
const bootP = new Promise(r => { bootRes = r; });   // T3: terpenuhi saat init() selesai menggabungkan data tersimpan ke memori
async function flush() {
  clearTimeout(saveTimer);
  if (!booted) await bootP;   // T3: jangan menulis sebelum data tersimpan digabung ke memori (menulis lebih awal menimpa data yang belum terbaca)
  const jobs = [], ks = [];
  Object.keys(STORES).forEach(k => { if (dirty[k]) { dirty[k] = false; ks.push(k); jobs.push(store.save(STORES[k].key, STORES[k].get())); } });
  if (!jobs.length) return;
  const r = await Promise.all(jobs);
  r.forEach((ok, i) => { if (!ok) dirty[ks[i]] = true; });   // T5: toko yang gagal tetap kotor: dicoba lagi pada flush berikutnya, status tidak mengaku tersimpan
  setStatus(r.every(Boolean) ? 'saved' : 'unsaved');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
addEventListener('pagehide', flush);

const METRIC = {
  kcal: e => num(e.kcal), protein: e => num(e.protein), water: e => num(e.water), sleep: e => num(e.sleep),
  screen: e => (e.stH === '' && e.stM === '') ? null : ((num(e.stH) || 0) * 60 + (num(e.stM) || 0)) / 60
};

/* ========= HITUNGAN TURUNAN ========= */
const isRestOnly = e => e.sesi.length === 1 && e.sesi[0] === 'rest';
function completion(e) {
  const items = [
    e.shalat != null, e.pmo !== '', (e.stH !== '' || e.stM !== ''),
    e.kcal !== '', e.protein !== '', e.water !== '', e.junk != null, e.kram != null,
    e.sesi.length > 0, e.sleep !== '', e.snore != null, e.eval.trim() !== ''
  ];
  if (!isRestOnly(e)) items.push(e.rpe != null);
  return [items.filter(Boolean).length, items.length];
}
function meter(id, v, target, kind, unit) {
  const box = $('#m-' + id), bar = $('i', box), txt = $('#t-' + id);
  box.className = 'meter'; txt.className = 'mtxt';
  if (v == null) { bar.style.width = '0%'; txt.textContent = ''; return; }
  bar.style.width = Math.min(v / target, 1) * 100 + '%';
  if (kind === 'max') {
    if (v > target) { box.classList.add('bad'); txt.classList.add('bad'); txt.textContent = 'Lebih ' + fmt(v - target, 0) + ' ' + unit + ' dari batas'; }
    else { box.classList.add('ok'); txt.textContent = 'Sisa ' + fmt(target - v, 0) + ' ' + unit; }
  } else {
    if (v >= target) { box.classList.add('ok'); txt.textContent = 'Target tercapai'; }
    else txt.textContent = 'Kurang ' + fmt(target - v, unit === 'L' ? 2 : 0) + ' ' + unit;
  }
}
function stampsHTML(e) {
  const past = cur < today();
  const k = num(e.kcal), p = num(e.protein), w = num(e.water), T = tgFor(cur);
  const kst = k == null ? '' : (T.mode === 'range' ? (k > T.kcalHi ? 'miss' : (k >= T.kcal ? 'hit' : (past ? 'miss' : ''))) : (k > T.kcal ? 'miss' : (k > 0 ? 'hit' : '')));
  const S = [
    ['Shalat', shStampA(e)[0], shStampA(e)[1]],
    ['Kalori', k == null ? '–' : fmt(k, 0), kst],
    ['Protein', p == null ? '–' : fmt(p, 0) + ' g', p == null ? '' : (p >= T.protein ? 'hit' : (past ? 'miss' : ''))],
    ['Air', w == null ? '–' : fmt(w, 2) + ' L', w == null ? '' : (w >= T.water ? 'hit' : (past ? 'miss' : ''))],
    ['Pantang', e.junk === 'bersih' ? 'Bersih' : e.junk === 'melanggar' ? 'Langgar' : '–', e.junk === 'bersih' ? 'hit' : e.junk === 'melanggar' ? 'miss' : '']
  ];
  /* v99b: kemajuan 0..1 terhadap target + petunjuk target per ubin; hanya tampilan */
  const kt = T.mode === 'range' ? fmt(T.kcal, 0) + '–' + fmt(T.kcalHi, 0) : 'maks ' + fmt(T.kcal, 0);
  const PG = {
    Shalat: shHas(e) ? [shStat(e.sh).tepat / PRAYERS.length, 'dari ' + PRAYERS.length] : (e.shalat == null ? [0, 'dari ' + PRAYERS.length] : null),
    Kalori: [k == null ? 0 : k / (T.mode === 'range' ? T.kcalHi : T.kcal), kt],
    Protein: [p == null ? 0 : p / T.protein, 'dari ' + fmt(T.protein, 0) + ' g'],
    Air: [w == null ? 0 : w / T.water, 'dari ' + fmt(T.water, 2) + ' L']
  };
  const SPV = window.__spPrev || (window.__spPrev = {});
  return S.map(s => {
    const g = PG[s[0]];
    let x = '';
    if (g) {
      const pc = Math.round(Math.max(0, Math.min(g[0], 1)) * 100);
      x = '<em class="st">' + g[1] + '</em><i class="sp" style="--pg:' + pc + '%;--from:' + (SPV[s[0]] == null ? 0 : SPV[s[0]]) + '%"></i>';
      SPV[s[0]] = pc;
    }
    return '<div class="stamp ' + s[2] + '"><b>' + s[0] + '</b><span>' + s[1] + '</span>' + x + '</div>';
  }).join('');
}
function pmoHint() {
  const box = $('#pmoHint'), e = E();
  const prev = Object.keys(db).filter(d => d < cur && num(db[d].pmo) != null).sort().pop();
  if (e.pmo !== '' || !prev) { box.innerHTML = ''; return; }
  const n = num(db[prev].pmo) + diffDays(prev, cur);
  box.innerHTML = '<span>Terakhir: hari ke-' + esc(db[prev].pmo) + ' (' + esc(dayShort(prev)) + ')</span>' +
    '<button class="btn sm" data-pmo="' + n + '">Lanjut: hari ke-' + n + '</button>' +
    '<button class="btn sm ghost" data-pmo="0">Reset ke 0</button>';
}
function derived() {
  const e = E();
  shPaint(e);   // v23p
  $('#junkMore').hidden = e.junk !== 'melanggar';
  $('#kramMore').hidden = e.kram !== 'ya';
  const rest = isRestOnly(e);
  $('#rpe').classList.toggle('off', rest);
  $('#rpeNote').textContent = rest ? 'tidak dipakai saat Rest' : '1 ringan – 10 maksimal';
  const T = tgFor(cur);
  if (T.mode === 'range') meterRange('kcal', num(e.kcal), T.kcal, T.kcalHi, 'kcal'); else meter('kcal', num(e.kcal), T.kcal, 'max', 'kcal');
  meter('protein', num(e.protein), T.protein, 'min', 'g');
  meter('water', num(e.water), T.water, 'min', 'L');
  paintTargets(T);
  $('#stamps').innerHTML = stampsHTML(e);
  const [n, t] = completion(e);
  $('#m-fill i').style.width = (n / t * 100) + '%';
  $('#fillTxt').textContent = n + ' dari ' + t + ' terisi';
  pmoHint();
  jrPaint();
  kjPaint();
  jv23();
}
function paintControls() {
  const e = E();
  $$('[data-seg]').forEach(g => $$('.pill', g).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === e[g.dataset.seg]))));
  $$('[data-multi]').forEach(g => $$('.pill', g).forEach(b => b.setAttribute('aria-pressed', String(e[g.dataset.multi].includes(b.dataset.v)))));
  $$('#rpe .pill').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === e.rpe)));
  sleepPaint();   // v23z4
}
function paintHeader() {
  const t = today();
  $('#dow').textContent = HARI[pd(cur).getDay()] + (cur === t ? ' (hari ini)' : '');
  const d = pd(cur);
  $('#dlabel').textContent = d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  $('#next').disabled = cur >= t;
  $('#goToday').hidden = cur === t;
  const dp = $('#datepick'); dp.max = t; dp.value = cur;
}
function populate() {
  const e = E();
  $$('[data-k]').forEach(el => { el.value = e[el.dataset.k] == null ? '' : e[el.dataset.k]; });
  paintHeader(); paintControls(); derived(); mealPopulate();
}

/* ========= MINGGUAN ========= */
const WNUM = ['no', 'bw', 'waist', 'chest', 'thigh', 'arm', 'pushup', 'row', 'km', 'speed', 'kramN'];
const WKEYS = ['bw', 'waist', 'chest', 'thigh', 'arm', 'pushup', 'row', 'km', 'speed'];
const WUNIT = { bw: 'kg', waist: 'cm', chest: 'cm', thigh: 'cm', arm: 'cm', pushup: 'reps', row: 'reps', km: 'km', speed: 'km/jam' };
const WDEC = { bw: 2, waist: 1, chest: 1, thigh: 1, arm: 1, pushup: 0, row: 0, km: 1, speed: 1 };
const WENUMS = { snore: ['banyak', 'sama', 'buruk'], kram: ['nol', 'ada'] };
const wblank = () => ({
  no: '', date: '', bw: '', bwDelta: '', waist: '', chest: '', thigh: '', arm: '',
  pushup: '', row: '', km: '', speed: '', snore: null, kram: null, kramN: '', energy: null, note: '', updated: 0
});
function wclean(raw) {
  const b = wblank();
  if (!raw || typeof raw !== 'object') return b;
  for (const k of Object.keys(b)) {
    if (!(k in raw)) continue;
    const v = raw[k];
    if (WENUMS[k]) b[k] = WENUMS[k].includes(v) ? v : null;
    else if (k === 'energy') b[k] = (Number.isInteger(v) && v >= 1 && v <= 10) ? v : null;
    else if (k === 'updated') b[k] = Number(v) || 0;
    else b[k] = v == null ? '' : String(v);
  }
  return b;
}
let wdb = {};
let curW = weekStart(today());
let bwOpen = false;
let trWeeks = 8;   // pilihan rentang tren Mingguan: 4 / 8 / 12 (hanya di memori)
const TR_OPTS = [4, 8, 12];
const thisWeek = () => weekStart(today());
const defaultWDate = ws => { const t = today(); return (t >= ws && t <= addDays(ws, 6)) ? t : addDays(ws, 6); };
const WE = () => wdb[curW] || wblank();
function setW(patch) {
  const e = wdb[curW] || (wdb[curW] = Object.assign(wblank(), { date: defaultWDate(curW) }));
  Object.assign(e, patch);
  e.updated = Date.now();
  queueSave(true);
  wpaint(); wderived();
}
function setWField(k, v) {
  const el = $('[data-wk="' + k + '"]');
  if (el) el.value = v;
  setW({ [k]: v });
}
function prevW(k, ws) {
  const w = Object.keys(wdb).filter(x => x < ws && num(wdb[x][k]) != null).sort().pop();
  return w ? { w, v: num(wdb[w][k]) } : null;
}
function wdelta(k, ws, e) {
  const v = num(e[k]), p = prevW(k, ws);
  return (v == null || !p) ? null : { d: v - p.v, w: p.w };
}
function bwDeltaEff(ws, e) {
  const m = num(e.bwDelta);
  if (m != null) return { d: m, manual: true };
  return wdelta('bw', ws, e);
}
function wcompletion(e) {
  const items = [
    e.no !== '', e.bw !== '', e.waist !== '', e.chest !== '', e.thigh !== '', e.arm !== '',
    e.pushup !== '', e.row !== '', (e.km !== '' || e.speed !== ''),
    e.snore != null, (e.kram === 'nol' || (e.kram === 'ada' && e.kramN !== '')),
    e.energy != null, e.note.trim() !== ''
  ];
  return [items.filter(Boolean).length, items.length];
}
function weekRecap(ws) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter(d => db[d]);
  const avg = f => { const v = days.map(d => f(db[d])).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const c = f => days.filter(d => f(db[d])).length;
  return {
    n: days.length, kcal: avg(METRIC.kcal), protein: avg(METRIC.protein), water: avg(METRIC.water),
    sleep: avg(METRIC.sleep), screen: avg(METRIC.screen),
    shalatLogged: c(e => e.shalat != null), shalatYa: c(e => e.shalat === 'ya'),
    kal: c(e => e.sesi.includes('kalistenik')), bike: c(e => e.sesi.includes('sepeda')), rest: c(e => e.sesi.includes('rest')),
    kramDays: c(e => e.kram === 'ya'), snoreDays: c(e => e.snore === 'ya')
  };
}
function wheader() {
  const t = thisWeek(), e = WE();
  $('#wdow').textContent = (e.no !== '' ? 'Minggu ke-' + e.no : 'Audit mingguan') + (curW === t ? ' (pekan ini)' : curW === addDays(t, -7) ? ' (pekan lalu)' : '');
  const lb = $('#wlabel'); lb.textContent = rangeLabel(curW); lb.classList.toggle('sm', lb.textContent.length > 20);
  $('#wnext').disabled = curW >= t; $('#wgoNow').hidden = curW === t;
}
function wpaint() {
  const e = WE();
  $$('[data-wseg]').forEach(g => $$('.pill', g).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === e[g.dataset.wseg]))));
  $$('#energy .pill').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === e.energy)));
}
function wderived() {
  const e = WE(), R = weekRecap(curW), P = weekRecap(addDays(curW, -7));
  wheader();
  $('#kramMoreW').hidden = e.kram !== 'ada';
  $('#bwManual').hidden = !(bwOpen || e.bwDelta !== '');
  WKEYS.forEach(k => {
    let t = '';
    if (k === 'bw') {
      const r = bwDeltaEff(curW, e);
      if (r) t = sgn(r.d, 2) + ' kg ' + (r.manual ? '(manual)' : 'vs pekan ' + shortDate(r.w));
      else if (e.bw !== '') t = 'Belum ada pembanding dari pekan sebelumnya';
    } else {
      const r = wdelta(k, curW, e);
      if (r) t = sgn(r.d, WDEC[k]) + ' ' + WUNIT[k] + ' vs ' + shortDate(r.w);
    }
    $('#d-' + k).textContent = t;
  });
  const pn = Object.keys(wdb).filter(w => w < curW && num(wdb[w].no) != null).sort().pop();
  $('#wnoHint').innerHTML = (e.no === '' && pn)
    ? '<span>Audit terakhir: minggu ke-' + esc(wdb[pn].no) + '</span><button class="btn sm" data-wno="' + Math.round(num(wdb[pn].no) + diffDays(pn, curW) / 7) + '">Lanjut: minggu ke-' + Math.round(num(wdb[pn].no) + diffDays(pn, curW) / 7) + '</button>'
    : '';
  $('#recapNote').textContent = R.n ? R.n + ' dari 7 hari tercatat (Senin sampai Minggu).' : 'Belum ada log harian di pekan ini.';
  const T = (l, v, sub) => '<button type="button" class="tile" data-rk="' + (RK_KEY[l] || '') + '" aria-expanded="false"><small>' + l + '</small><b>' + v + '</b><em>' + sub + '</em></button>';   // v23w5: kartu = tombol
  $('#recap').innerHTML = (R.n ? [
    T('Kalori', fmt(R.kcal, 0), 'rata-rata'),
    T('Protein', R.protein == null ? '–' : fmt(R.protein, 0) + ' g', 'rata-rata'),
    T('Air putih', R.water == null ? '–' : fmt(R.water, 2) + ' L', 'rata-rata'),
    T('Tidur', R.sleep == null ? '–' : fmt(R.sleep, 1) + ' j', 'rata-rata'),
    T('Screen time', R.screen == null ? '–' : fmt(R.screen, 1) + ' j', 'rata-rata'),
    T('Shalat', R.shalatYa + '/' + R.shalatLogged, 'tepat waktu'),
    ...(weekPlan(curW).days ? [] : [T('Latihan', (R.kal + R.bike) + ' hari', 'kal. ' + R.kal + ', sepeda ' + R.bike)]),
    T('Kram', R.kramDays + ' hari', 'dari ' + R.n + ' tercatat'),
    T('Ngorok/lemas', R.snoreDays + ' hari', 'dari ' + R.n + ' tercatat')
  ] : []).concat(wPlanTiles(T)).join('');
  $('#snoreHint').innerHTML = R.n
    ? '<span>Log harian: ' + R.snoreDays + ' dari ' + R.n + ' hari mengorok / bangun lemas' + (P.n ? ' (pekan lalu ' + P.snoreDays + ' dari ' + P.n + ')' : '') + '</span>'
    : '';
  $('#kramHint').innerHTML = R.n
    ? '<span>Log harian: ' + R.kramDays + ' hari kram' + (P.n ? ' (pekan lalu ' + P.kramDays + ')' : '') + '</span>' +
      (e.kram == null ? '<button class="btn sm" data-wkram="' + R.kramDays + '">Pakai ' + R.kramDays + '</button>' : '')
    : '';
  renderWTrend();
  b14Sync();
  wLatihanHints();
  wk23();   // v23w: chip status kartu + progres bersegmen + "Belum diisi"
}
function wpopulate() {
  const e = WE();
  $$('[data-wk]').forEach(el => {
    const k = el.dataset.wk;
    el.value = k === 'date' ? (e.date || defaultWDate(curW)) : (e[k] == null ? '' : e[k]);
  });
  wpaint(); wderived();
}
function goW(ws) {
  if (!DATE_RE.test(ws) || ws > thisWeek()) { wderived(); return; }
  curW = ws; bwOpen = false; wpopulate(); window.scrollTo(0, 0);
}
function lineSVG(title, vals, labels, dec) {
  const W = 300, H = 110, B = 14, T = 18, n = labels.length, step = W / n, x = i => step * i + step / 2;
  const nums = vals.filter(v => v != null);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + ', ' + n + ' pekan terakhir">';
  if (nums.length) {
    let lo = Math.min(...nums), hi = Math.max(...nums);
    const pad = Math.max((hi - lo) * .3, Math.abs(hi) * .01, .2);
    lo -= pad; hi += pad;
    const y = v => T + (H - B - T) * (1 - (v - lo) / (hi - lo));
    const pts = [];
    vals.forEach((v, i) => { if (v != null) pts.push([x(i), y(v), v]); });
    if (pts.length > 1) s += '<polyline class="ln" points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
    pts.forEach(p => { s += '<circle class="dt" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3"/><text class="vl" x="' + p[0].toFixed(1) + '" y="' + (p[1] - 7).toFixed(1) + '" text-anchor="middle">' + fmt(p[2], dec) + '</text>'; });
  }
  labels.forEach((lb, i) => { s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + esc(lb) + '</text>'; });
  return s + '</svg>';
}
function renderWTrend() {
  const box = $('#wTrend');
  trSegPaint();
  const keys = Object.keys(wdb).sort().reverse().slice(0, 52);
  if (!keys.length) { box.innerHTML = '<div class="empty">Belum ada audit. Tren muncul setelah audit pertama diisi; perbandingan bermakna mulai dari dua pekan.</div>'; return; }
  const t = thisWeek(), weeks = [];
  for (let i = trWeeks - 1; i >= 0; i--) weeks.push(addDays(t, -7 * i));
  const labels = weeks.map(w => { const d = pd(w); return d.getDate() + '/' + (d.getMonth() + 1); });
  const ser = k => weeks.map(w => wdb[w] ? num(wdb[w][k]) : null);
  const en = weeks.map(w => (wdb[w] && wdb[w].energy != null) ? wdb[w].energy : null);
  const blk = (title, svg) => '<div class="chart"><div class="ch">' + title + '</div>' + svg + '</div>';
  const list = keys.map(w => {
    const e = wdb[w], [n, tt] = wcompletion(e), parts = [];
    if (num(e.bw) != null) parts.push('BB ' + fmt(num(e.bw), 1) + ' kg');
    if (num(e.waist) != null) parts.push('Perut ' + fmt(num(e.waist), 1) + ' cm');
    if (num(e.pushup) != null) parts.push('Push-up ' + fmt(num(e.pushup), 0));
    if (num(e.row) != null) parts.push('Row ' + fmt(num(e.row), 0));
    if (e.energy != null) parts.push('Energi ' + e.energy);
    return '<button class="hrow" data-wdate="' + w + '"><div class="hd">' + esc((e.no !== '' ? 'Minggu ' + e.no + ': ' : '') + rangeLabel(w)) + '<span>' + n + '/' + tt + ' terisi</span></div><div class="hm">' + (parts.join('  ·  ') || 'Belum ada isian') + '</div></button>';
  }).join('');
  box.innerHTML = trCardHTML() +
    blk('Berat badan rata-rata (kg)', lineSVG('Berat badan rata-rata', ser('bw'), labels, 1)) +
    blk('Lingkar perut (cm)', lineSVG('Lingkar perut', ser('waist'), labels, 1)) +
    blk('Push-up maksimal (reps)', chartSVG('Push-up maksimal', ser('pushup'), labels, null, null)) +
    blk('Inverted row maksimal (reps)', chartSVG('Inverted row maksimal', ser('row'), labels, null, null)) +
    blk('Energi harian (1-10)', chartSVG('Energi harian', en, labels, null, null)) +
    '<h2 class="sub">Semua pekan</h2>' + list;
}
function toWeeklyText(ws, e) {
  const [y, m, dd] = (e.date || defaultWDate(ws)).split('-');
  const A = (l, v) => '- ' + l.padEnd(23) + ': ' + v;
  const B = (l, v) => '- ' + l.padEnd(31) + ': ' + v;
  const C = (l, v) => '- ' + l.padEnd(27) + ': ' + v;
  const U = (k, d, unit) => { const n = num(e[k]); return n == null ? '-' : fmt(n, d) + ' ' + unit; };
  const r = bwDeltaEff(ws, e);
  let dl = 'n/a';
  if (r) dl = sgn(r.d, 2, true) + ' kg' + (r.manual || r.w === addDays(ws, -7) ? '' : ', dibanding pekan ' + shortDate(r.w));
  const bw = num(e.bw), km = num(e.km), sp = num(e.speed), kn = num(e.kramN);
  const bike = (km == null && sp == null) ? '-' : (km == null ? '-' : fmt(km, 1)) + ' km | ' + (sp == null ? '-' : fmt(sp, 1)) + ' km/jam';
  const snore = { banyak: 'Berkurang Banyak', sama: 'Masih Sama', buruk: 'Memburuk' }[e.snore] || '-';
  const kram = e.kram === 'nol' ? '0 Kali' : e.kram === 'ada' ? (kn != null ? fmt(kn, 0) + ' Kali' : 'Ada (jumlah belum diisi)') : '-';
  return [
    '=== WEEKLY AUDIT: MINGGU KE-' + (e.no !== '' ? e.no : '-') + ' ===',
    'Tanggal: ' + dd + '/' + m + '/' + y, '',
    '1. METRIK FISIK & KOMPOSISI',
    A('Berat Badan Rata-rata', bw == null ? '-' : fmt(bw, 2) + ' kg (Perubahan dari minggu lalu: ' + dl + ')'),
    A('Lingkar Perut (Navel)', U('waist', 1, 'cm')),
    A('Lingkar Dada', U('chest', 1, 'cm')),
    A('Lingkar Paha', U('thigh', 1, 'cm')),
    A('Lingkar Lengan (Bicep)', U('arm', 1, 'cm')), '',
    '2. EVALUASI KINERJA OLAHRAGA',
    B('Push-up Maksimal (1 Set)', U('pushup', 0, 'reps')),
    B('Inverted Row Maksimal', U('row', 0, 'reps')),
    B('Jarak & Rata-rata Speed Sepeda', bike),
    ...jrWeekLines(ws, B), '',
    '3. EVALUASI KELUHAN FISIK',
    C('Frekuensi Ngorok/Mengantuk', snore),
    C('Frekuensi Kaki Kram', kram),
    C('Tingkat Energi Harian', e.energy != null ? 'Skala 1 - 10 = ' + e.energy : '-'), '',
    '4. CATATAN & PENYESUAIAN MINGGU DEPAN:',
    '"' + (e.note.trim() || '-') + '"'
  ].join('\n');
}
function toWeeklyCSV() {
  const head = ['minggu_mulai', 'minggu_ke', 'tanggal', 'bb_rata_kg', 'bb_perubahan_kg', 'perut_cm', 'dada_cm', 'paha_cm', 'lengan_cm', 'pushup_reps', 'inverted_row_reps', 'sepeda_km', 'sepeda_kmh', 'ngorok_mengantuk', 'kram_kali', 'energi', 'catatan'];
  const q = v => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const n = v => { const x = num(v); return x == null ? '' : x; };
  const rows = Object.keys(wdb).sort().map(w => {
    const e = wdb[w], r = bwDeltaEff(w, e);
    const kr = e.kram === 'nol' ? 0 : (e.kram === 'ada' ? n(e.kramN) : '');
    return [w, e.no, e.date || defaultWDate(w), n(e.bw), r ? Math.round(r.d * 100) / 100 : '', n(e.waist), n(e.chest), n(e.thigh), n(e.arm), n(e.pushup), n(e.row), n(e.km), n(e.speed), e.snore || '', kr, e.energy == null ? '' : e.energy, e.note].map(q).join(',');
  });
  return [head.join(',')].concat(rows).join('\n');
}

/* ========= TEKS & CSV ========= */
function toText(d, e) {
  const L = (l, v) => '- ' + l.padEnd(27) + ': ' + v;
  const [y, m, dd] = d.split('-');
  const trim = s => s.trim();
  const T = tgFor(d);
  const shalat = shHas(e) ? shText(e) : e.shalat === 'ya' ? 'Ya'
    : e.shalat === 'bolong' ? 'Bolong/Terlambat' + ((e.missed.length || trim(e.shalatNote)) ? ' (' + [e.missed.join(', '), trim(e.shalatNote)].filter(Boolean).join(' – ') + ')' : '')
    : '-';
  const st = (e.stH === '' && e.stM === '') ? '-' : (num(e.stH) || 0) + ' jam ' + (num(e.stM) || 0) + ' menit';
  const k = num(e.kcal), p = num(e.protein), w = num(e.water), sl = num(e.sleep);
  const junk = e.junk === 'bersih' ? 'Bersih' : e.junk === 'melanggar' ? 'Melanggar' + (trim(e.junkNote) ? ' (' + trim(e.junkNote) + ')' : '') : '-';
  const kram = e.kram === 'tidak' ? 'Tidak' : e.kram === 'ya' ? 'Ya' + (trim(e.kramPart) ? ' (' + trim(e.kramPart) + ')' : '') : '-';
  const SES = { kalistenik: 'Kalistenik', sepeda: 'Sepeda', rest: 'Rest' };
  const sesi = e.sesi.length ? e.sesi.map(x => SES[x] || x).join(' + ') : '-';
  const snore = e.snore === 'tidak' ? 'Tidak' : e.snore === 'ya' ? 'Ya' : '-';
  return [
    '=== DAILY LOG: ' + dd + '/' + m + '/' + y + ' ===', '',
    '1. IBADAH',
    L('Shalat 5 Waktu Tepat Waktu', shalat), '',
    '2. DISIPLIN',
    L('PMO-Free Streak', e.pmo !== '' ? 'Hari ke-' + e.pmo : '-'),
    L('Screen Time TikTok/Sosmed', st), '',
    '3. ASUPAN',
    L('Total Estimasi Kalori', k == null ? '-' : fmt(k, 0) + ' kcal / Target ' + kcalTgt(T) + ' kcal'),
    L('Protein Intake', p == null ? '-' : fmt(p, 1) + ' gram / Target ' + fmt(T.protein, 0) + ' gram'),
    L('Konsumsi Air Putih', w == null ? '-' : fmt(w, 2) + ' Liter (Target min ' + T.water + ' Liter)'),
    L('Konsumsi Junkfood/Manis', junk), '',
    '4. PERFORMA & PEMULIHAN',
    L('Sesi Latihan Hari Ini', sesi),
    L('RPE Sesi (Skala 1-10)', e.rpe != null ? e.rpe : '-'),
    ...jrTextLines(d, L, e),
    L('Durasi Tidur Semalam', sl == null ? '-' : fmt(sl, 2) + ' jam' + (sleepMin(e) != null ? ' (tidur ' + e.sleepStart + ', bangun ' + e.sleepEnd + ')' : '')),
    L('Mengorok / Bangun Lemas?', snore),
    L('Kaki Kram Hari Ini?', kram), '',
    '5. EVALUASI DIRI (1 Kalimat Jujur):',
    '"' + (trim(e.eval) || '-') + '"'
  ].join('\n');
}
function toCSV() {
  const head = ['tanggal', 'shalat', 'shalat_terlewat', 'shalat_catatan', 'pmo_streak', 'screen_menit', 'kalori', 'protein_g', 'air_l', 'junkfood', 'junk_catatan', 'kram', 'kram_bagian', 'sesi', 'rpe', 'tidur_jam', 'ngorok_lemas', 'evaluasi', 'shalat_rinci', 'tidur_mulai', 'tidur_bangun'];
  const q = v => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const n = v => { const x = num(v); return x == null ? '' : x; };
  const rows = Object.keys(db).sort().map(d => {
    const e = db[d];
    const scr = (e.stH === '' && e.stM === '') ? '' : (num(e.stH) || 0) * 60 + (num(e.stM) || 0);
    return [d, e.shalat || '', e.missed.join('|'), e.shalatNote, n(e.pmo), scr, n(e.kcal), n(e.protein), n(e.water), e.junk || '', e.junkNote, e.kram || '', e.kramPart, e.sesi.join('|'), e.rpe == null ? '' : e.rpe, n(e.sleep), e.snore || '', e.eval, shCsv(e), e.sleepStart, e.sleepEnd].map(q).join(',');
  });
  return [head.join(',')].concat(rows).join('\n');
}
function parseBackup(text) {
  if (!String(text || '').trim()) return 'Pilih file atau tempel isi cadangan dulu.';
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return 'Format JSON tidak valid.'; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'Isi file tidak dikenali.';
  return obj;
}
// apply=false: hanya menghitung (pratinjau), tidak mengubah data
function mergeImport(obj, apply) {
  const dsrc = obj.data && typeof obj.data === 'object' ? obj.data : (obj.weekly ? {} : obj);
  const wsrc = obj.weekly && typeof obj.weekly === 'object' ? obj.weekly : {};
  const tsrc = obj.train && typeof obj.train === 'object' ? obj.train : {};
  const csrc = obj.checks && typeof obj.checks === 'object' ? obj.checks : {};
  const msrc = obj.meals && typeof obj.meals === 'object' && !Array.isArray(obj.meals) ? obj.meals : {};
  const r = { added: 0, updated: 0, same: 0, wAdded: 0, wUpdated: 0, wSame: 0, pSet: 0, pHas: 0, tAdded: 0, tSame: 0, cAdded: 0, cSame: 0, nD: 0, nW: 0, nT: 0, nC: 0, nM: 0, nF: 0, fAdded: 0, mDrop: 0, nK: 0, kAdded: 0, kSame: 0, nMp: 0, mpAdded: 0, mpSame: 0, mpApplied: 0, shHas: 0, shSet: 0, shSame: 0, nCn: 0, cnAdded: 0, cnSame: 0, cnApplied: 0 };
  for (const d of Object.keys(dsrc)) {
    if (!DATE_RE.test(d)) continue;
    r.nD++;
    const inc = clean(dsrc[d]), incM = mlist(msrc[d]);
    if (incM.length) r.nM++;
    if (db[d] && inc.updated > db[d].updated && edb[d] && edb[d].length && JSON.stringify(edb[d]) !== JSON.stringify(incM)) r.mDrop++;   // daftar lokal akan diganti
    if (!db[d]) { if (apply) { db[d] = inc; mTake(d, incM); } r.added++; }
    else if (inc.updated > db[d].updated) { if (apply) { db[d] = inc; mTake(d, incM); } r.updated++; }
    else r.same++;
  }
  for (const w0 of Object.keys(wsrc)) {
    if (!DATE_RE.test(w0)) continue;
    r.nW++;
    const w = weekStart(w0), inc = wclean(wsrc[w0]);
    if (!wdb[w]) { if (apply) wdb[w] = inc; r.wAdded++; }
    else if (inc.updated > wdb[w].updated) { if (apply) wdb[w] = inc; r.wUpdated++; }
    else r.wSame++;
  }
  if (obj.plan && typeof obj.plan === 'object') {
    r.pHas = 1;
    const inc = pclean(obj.plan);
    if (inc.updated > pdb.updated) {
      if (apply) {
        // file dari versi lama tidak punya profile/adj: yang ada di perangkat ini dipertahankan, bukan dikosongkan
        const has = k => Object.prototype.hasOwnProperty.call(obj.plan, k);
        if (!has('profile')) inc.profile = JSON.parse(JSON.stringify(pdb.profile));
        if (!has('adj')) inc.adj = JSON.parse(JSON.stringify(pdb.adj));
        pdb = inc;
      }
      r.pSet = 1;
    }
  }
  for (const d of Object.keys(tsrc)) {
    if (!DATE_RE.test(d)) continue;
    r.nT++;
    const inc = tclean(tsrc[d]);
    if (!tdb[d] || inc.updated > tdb[d].updated) { if (apply) tdb[d] = inc; r.tAdded++; } else r.tSame++;
  }
  for (const d of Object.keys(csrc)) {
    if (!DATE_RE.test(d)) continue;
    r.nC++;
    const inc = cclean(csrc[d]);
    if (!cdb[d] || inc.updated > cdb[d].updated) { if (apply) cdb[d] = inc; r.cAdded++; } else r.cSame++;
  }
  const ksrc = obj.krm && typeof obj.krm === 'object' && !Array.isArray(obj.krm) ? obj.krm : {};
  for (const d of Object.keys(ksrc)) {
    if (!DATE_RE.test(d)) continue;
    const inc = kclean(ksrc[d]);
    if (inc.ev.length) r.nK++;
    const eff = inc.ev.length > 0 || kjCount(d) > 0;   // hari kosong di kedua sisi tidak dihitung
    if (!kdb[d] || inc.updated > kdb[d].updated) { if (apply) { if (inc.ev.length || inc.updated > 0) kdb[d] = inc; else delete kdb[d]; } if (eff) r.kAdded++; } else if (eff) r.kSame++;
  }
  {
    const mi = mpClean(obj.menu);   // {days, shop}; hari tanpa isi dan tanpa penanda hapus sudah dibuang
    Object.keys(mi.days).forEach(d => {
      const inc = mi.days[d], loc = mpDb.days[d];
      if (inc.it.length) r.nMp++;
      const eff = inc.it.length > 0 || mpCount(d) > 0;   // hari kosong di kedua sisi tidak dihitung
      if (!loc || inc.updated > loc.updated) { if (apply) { mpDb.days[d] = inc; r.mpApplied++; } if (eff) r.mpAdded++; } else if (eff) r.mpSame++;
    });
    if (mi.shop.it.length) r.shHas = mi.shop.it.length;
    const seff = mi.shop.it.length > 0 || mpDb.shop.it.length > 0;
    if (mi.shop.updated > mpDb.shop.updated) { if (apply) { mpDb.shop = mi.shop; r.mpApplied++; } if (seff) r.shSet = 1; } else if (seff && (mi.shop.updated > 0 || mi.shop.it.length > 0)) r.shSame = 1;
  }
  {
    const ci = cnClean(obj.content);   // {it}: versi dengan u lebih besar menang per id; penanda hapus ikut
    Object.keys(ci.it).forEach(id => {
      const inc = ci.it[id], loc = cnDb.it[id];
      if (!inc.x) r.nCn++;
      const eff = inc.x ? !!(loc && !loc.x) : true;   // penanda hapus tanpa yang dihapus tidak dihitung
      if (!loc || inc.u > loc.u) { if (apply) { cnDb.it[id] = inc; r.cnApplied++; } if (eff) r.cnAdded++; } else if (eff) r.cnSame++;
    });
    if (apply && r.cnApplied) cnTrim();
  }
  const fsrc = flist(obj.favs), have = new Set(fdb.map(f => f.n.toLowerCase()));
  let room = M_MAX_FAV - fdb.length;
  r.nF = fsrc.length;
  fsrc.forEach(f => {
    const k = f.n.toLowerCase();
    if (have.has(k) || room <= 0) return;
    have.add(k); room--; r.fAdded++;
    if (apply) fdb.push(f);
  });
  { const g = gdMergeIn(obj.foods, apply); r.gAdd = g.add; r.gUpd = g.upd; r.gcAdd = g.cAdd + g.cUpd; r.gSame = g.same; r.gDrop = g.drop; }
  { const ii = ibxClean(obj.ibadah);   // v81a: hari ibadah (amalan sunnah): versi dengan u lebih besar menang per tanggal
    r.nIb = 0; r.ibAdded = 0; r.ibSame = 0; r.ibApplied = 0;
    Object.keys(ii.days).forEach(d => {
      const inc = ii.days[d], loc = ibdb.days[d];
      if (!loc && !inc.c.length && !ibxSnAny(inc) && !inc.u) return;
      if (inc.c.length || ibxSnAny(inc)) r.nIb++;   // IB2-B2b1
      const eff = inc.c.length > 0 || ibxSnAny(inc) || !!(loc && loc.c.length) || ibxSnAny(loc);
      if (!loc || inc.u > loc.u) { if (apply) { ibdb.days[d] = inc; r.ibApplied++; } if (eff) r.ibAdded++; } else if (eff) r.ibSame++;
    });
    if (obj.ibadah && obj.ibadah.pref && ii.u > ibdb.u) { if (apply) { ibdb.pref = ii.pref; ibdb.u = ii.u; r.ibApplied++; } }
  }
  exMerge(obj.extra, r, apply);   // v106a: ide, seri, statistik, tes A/B
  scMergeIn(obj.selfcare, r, apply);   // v82a; v104: `eff` tidak ada di lingkup ini (ReferenceError pada SETIAP mergeImport); parameter ke-4 bersifat opsional
  return r;
}
const hasMerge = r => !!(r.exAdded || r.scAdded || r.ibAdded || r.gAdd || r.gUpd || r.gcAdd || r.added || r.updated || r.wAdded || r.wUpdated || r.pSet || r.tAdded || r.cAdded || r.fAdded || r.kAdded || r.mpAdded || r.shSet || r.cnAdded);
function importData(text) {
  const obj = parseBackup(text);
  if (typeof obj === 'string') return obj;
  const r = mergeImport(obj, true);
  if (r.mpApplied) queueSave('mp');   // termasuk penanda hapus (hari yang itemnya sudah dihapus)
  if (r.cnApplied) queueSave('cn');   // termasuk penanda hapus konten
  if (r.ibApplied) queueSave('ibx');   // v81a
  if (r.scApplied) queueSave('sc');   // v82a
  if (!hasMerge(r)) return 'Tidak ada data baru yang bisa digabungkan.';
  if (r.added || r.updated) { queueSave('d'); queueSave('e'); }
  if (r.fAdded) queueSave('f');
  if (r.gAdd || r.gUpd || r.gcAdd) gdSave();
  if (r.wAdded || r.wUpdated) queueSave('w');
  if (r.pSet) queueSave('p');
  if (r.tAdded) queueSave('t');
  if (r.cAdded) queueSave('c');
  if (r.kAdded) queueSave('k');
  populate(); wpopulate(); refreshView();
  return r;
}

/* ========= SHEET, TOAST, SALIN, UNDUH ========= */
let toastTimer;
function toast(msg, act) {   // act = {label, fn}: tombol di dalam toast (mis. Urungkan); toast dengan aksi bertahan lebih lama
  const t = $('#toast'); t.textContent = msg; t.hidden = false; t.className = 'toast' + (act && act.fn ? ' act' : '');
  if (act && act.fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tact'; b.textContent = act.label; b.onclick = () => { clearTimeout(toastTimer); t.hidden = true; act.fn(); }; t.appendChild(b); }
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, act && act.fn ? 7000 : 2600);
}
let onSheetClose = null;   // dipanggil saat sheet ditutup (mis. membatalkan permintaan AI)
function openSheet(o) {
  $('#shTitle').textContent = o.title;
  const n = $('#shNote'); n.textContent = o.note || ''; n.hidden = !o.note;
  n.style.whiteSpace = o.pre ? 'pre-line' : ''; n.style.color = o.pre ? 'var(--ink)' : '';
  const ta = $('#shText'); ta.hidden = o.text === undefined; ta.oninput = o.onInput || null; ta.classList.toggle('prose', !!o.prose);
  if (o.text !== undefined) { ta.value = o.text; ta.readOnly = o.readonly !== false; ta.placeholder = o.placeholder != null ? o.placeholder : (o.readonly === false ? 'Tempel isi file JSON di sini' : ''); }
  const ex = $('#shExtra'); ex.hidden = !o.extra; ex.innerHTML = o.extra || '';
  onSheetClose = o.onClose || null;
  $('#shFile').hidden = !o.file; $('#fileIn').value = '';
  const box = $('#shActs'); box.innerHTML = '';
  o.actions.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '');
    b.textContent = a.label; b.onclick = a.fn; box.appendChild(b);
  });
  $('#sheet').hidden = false; document.body.classList.add('lock');
}
function closeSheet() { $('#sheet').hidden = true; document.body.classList.remove('lock'); const f = onSheetClose; onSheetClose = null; if (f) f(); }
async function copyFromSheet() {
  const ta = $('#shText');
  try { await navigator.clipboard.writeText(ta.value); toast('Tersalin'); return true; } catch (e) { /* fallback */ }
  try {
    ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    if (document.execCommand('copy')) { toast('Tersalin'); return true; }
  } catch (e) { /* fallback */ }
  toast('Gagal menyalin. Tekan lama pada teks lalu pilih Salin.');
  return false;
}
function download(name, text, type) {
  try {
    const u = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a'); a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 3000);
    toast('Mengunduh ' + name);
    return true;
  } catch (e) { toast('Unduhan tidak didukung di sini. Salin teksnya.'); return false; }
}
const closeBtn = { label: 'Tutup', fn: closeSheet };
const copyBtn = { label: 'Salin', primary: true, fn: copyFromSheet };

function actCopyDay() {
  openSheet({ title: 'Log ' + dayShort(cur), text: toText(cur, E()), actions: [copyBtn, closeBtn] });
}
function actExportText() {
  const keys = Object.keys(db).sort();
  if (!keys.length) { toast('Belum ada data'); return; }
  openSheet({ title: 'Semua log (teks)', text: keys.map(d => toText(d, db[d])).join('\n\n'), actions: [copyBtn, closeBtn] });
}
function backupText() {
  return JSON.stringify({ app: 'dailylog', version: 4, exported: new Date().toISOString(), data: db, weekly: wdb, plan: pdb, train: tdb, checks: cdb, meals: edb, favs: fdb, krm: kdb, menu: mpDb, content: cnDb, ibadah: ibdb, selfcare: scdb, foods: { mine: gdb.mine, cache: gdb.cache }, extra: exSnap() }, null, 1);
}
function hasAnyData() { return !!(Object.keys(db).length || Object.keys(wdb).length || Object.keys(tdb).length || Object.keys(cdb).length || Object.keys(edb).length || fdb.length || kjDays().length || mpDays().length || mpDb.shop.it.length || cnActive().length || ibxHasData() || gdb.mine.length || gdb.cache.length || pdb.start || exHas()); }
// Bagikan sebagai file lewat share sheet HP; jika tidak didukung, unduh biasa
async function saveBackupFile(text) {
  const name = 'daily-log-' + today() + '.json';
  let r = 'unsupported';
  try {
    if (typeof File === 'function' && navigator.share && navigator.canShare) {
      const file = new File([text], name, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Cadangan Ominia ' + today() }); r = 'shared'; }
    }
  } catch (e) { r = e && e.name === 'AbortError' ? 'cancelled' : 'unsupported'; }
  if (r === 'shared') { markBackup(); toast('Cadangan dibagikan'); return; }
  if (r === 'cancelled') return;
  // di sandbox artifact unduhan tidak bisa diverifikasi, jadi tidak dihitung sebagai cadangan
  if (download(name, text, 'application/json') && store.mode !== 'artifact') markBackup();
}
/* 106a-begin: cakupan cadangan JSON dan SINKRON untuk Bank ide, Seri, Statistik, Tes A/B (keputusan pemilik 31 Okt 2026). Disimpan di `extra` pada cadangan (versi tetap 4; berkas lama tanpa `extra` tetap terbaca; `extra` HILANG bila keempat toko kosong, jadi cadangan pengguna tanpa data itu tidak berubah). Gabung = tambah/perbarui per id (u terbesar menang), TIDAK menghapus. Rekaman suara ide (`au`) TIDAK ikut (hanya di perangkat). */
let exQ = [];
const exReady = () => { try { return !!(BNK.ready && TSX.ready && AB.ready && SR.ready && GY.ready && LY.ready && SK.ready && EV.ready && SHT.ready && spRdy && OD.ready && SBS.ready && SNS.ready && HFS.ready && HFB.ready && HFN.ready); } catch (e) { return false; } };   // STB-2a-3b, SNH-1c, OTH-1c, OTH-3b2, OTH-5c2c; T4d-1: try/catch (toko di app-012 dst belum didefinisikan bila skrip lambat dimuat = ReferenceError tak tertangkap)
function exEnsure() {   // toko dimuat malas (saat tab dibuka): tunggu sampai keempatnya siap (maks 6 detik)
  return new Promise(res => { const t0 = Date.now(); (function w() { try { bnkLoad(); tsxLoad(); abLoad(); srLoad(); gyLoad(); lyLoad(); skLoad(); evLoad(); shtLoad(); odLoad(); sbsLoad(); snsLoad(); hfsLoad(); hfbLoad(); hfnLoad(); } catch (e) { /* abaikan */ } if (exReady() || Date.now() - t0 > 6000) res(exReady()); else setTimeout(w, 60); })(); });
}
const exById = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const exSortO = o => { const r = {}; Object.keys(o).sort().forEach(k => { r[k] = o[k]; }); return r; };
function exSnap() {   // urut per id supaya dua perangkat yang sudah sama menghasilkan teks yang sama
  if (!exReady()) return undefined;
  const ide = BNK.items.filter(x => x.t).map(x => Object.assign({}, x, { au: '', aut: '' })).sort(exById);
  const gy = GY.u > 0 ? { pr: GY.pr, rg: GY.rg, mix: GY.mix, words: GY.words.slice(), ban: GY.ban.slice(), u: GY.u } : null;   // v107a
  const ly = LY.u > 0 ? { on: LY.on, lim: LY.lim, used: exSortO(LY.used), ext: exSortO(LY.ext), ref: exSortO(LY.ref), off: LY.off.slice().sort(), u: LY.u } : null;
  const sk = SK.u > 0 ? { wu: exSortO(SK.wu), br: exSortO(SK.br), mi: exSortO(SK.mi), mono: SK.mono.slice().sort(skMC), pat: SK.pat, cyc: SK.cyc, u: SK.u } : null;   // v107b
  const od = odSnap();   // HR-3c
  const sb = sbsSnapOut();   // STB-2a-3b
  const sn = snsSnapOut();   // SNH-1c
  const hf = hfsSnapOut();   // OTH-1c
  const hb = hfbSnapOut();   // OTH-3b2
  const ht = hfnSnapOut();   // OTH-5c2c
  const ev = EV.u > 0 ? { det: { d: EV.det.d, t: EV.det.t }, used: EV.used.slice().sort(evUC), u: EV.u } : null;
  const sh = SHT.u > 0 && SHT.d === today() ? { d: SHT.d, u: SHT.u, ck: exSortO(SHT.ck), ai: exSortO(SHT.ai) } : null;
  const lbT = spDb.lib && spDb.lib.d === today();   // v107c
  const spo = (spDb.tk.length || spDb.bl.length || spDb.lv > 1 || lbT || spDb.del.length) ? { tk: spDb.tk.map(spTakeClean).filter(Boolean).sort(spMC), bl: spDb.bl.map(spTakeClean).filter(Boolean).sort(spMC), lv: spDb.lv } : null;
  if (spo && lbT) spo.lib = { d: spDb.lib.d, h: spDb.lib.h, c: spDb.lib.c, f: spDb.lib.f };
  if (spo && spDb.del.length) spo.del = spDb.del.slice().sort(spDC);   // v107d
  if (!gy && !ly && !sk && !ev && !od && !sb && !sn && !hf && !hb && !ht && !sh && !spo && !ide.length && !TSX.items.length && !AB.tests.length && !AB.best.length && !SR.s.length && !Object.keys(SR.l).length && !Object.keys(SR.th).length && !BNK.del.length && !SR.del.length && !TSX.del.length && !AB.del.length) return undefined;
  const ex = { ideas: Object.assign({ items: ide, u: BNK.u }, BNK.del.length ? { del: BNK.del.slice().sort(spDC) } : {}), perf: Object.assign({ items: TSX.items.slice().sort(exById), u: TSX.u }, TSX.del.length ? { del: TSX.del.slice().sort(spDC) } : {}), ab: Object.assign({ tests: AB.tests.slice().sort(exById), best: AB.best.slice().sort(exById), u: AB.u }, AB.del.length ? { del: AB.del.slice().sort(spDC) } : {}), series: Object.assign({ s: SR.s.slice().sort(exById), l: exSortO(SR.l), th: exSortO(SR.th), u: SR.u }, SR.del.length ? { del: SR.del.slice().sort(spDC) } : {}) };
  if (gy) ex.gaya = gy; if (ly) ex.lanjut = ly;
  if (sk) ex.skill = sk; if (ev) ex.prod = ev; if (sh) ex.shots = sh; if (od) ex.ootd = od; if (sb) ex.badan = sb; if (sn) ex.sinaps = sn; if (hf) ex.hafalan = hf; if (hb) ex.hafalanBuatan = hb; if (ht) ex.hafalanTanda = ht;   // SNH-1c, OTH-1c, OTH-3b2, OTH-5c2c
  if (spo) ex.speak = spo;
  return ex;
}
const exHas = () => !!exSnap();
function exItems(loc, inc, cap, apply, r, okNew, onRep) {   // id sama: u lebih besar menang; id baru: ditambah bila muat
  const idx = new Map(loc.map((x, i) => [x.id, i])); let add = 0, ch = 0;
  inc.forEach(x => {
    const i = idx.get(x.id);
    if (i === undefined) { if (loc.length + (apply ? 0 : add) < cap && (!okNew || okNew(x, loc))) { add++; ch++; r.exAdded++; if (apply) { loc.push(x); idx.set(x.id, loc.length - 1); } } }
    else if (x.u > loc[i].u) { ch++; r.exAdded++; if (apply) { if (onRep) onRep(loc[i], x); loc[i] = x; } }
    else r.exSame++;
  });
  return ch;
}
function exMerge(src, r, apply) {
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || Array.isArray(src)) return;
  if (!exReady()) {   // toko belum termuat: tunda sampai siap (penggabungan ke toko yang belum termuat bisa menimpa isinya)
    if (apply) { exQ.push(src); exEnsure().then(ok => { const q = exQ; exQ = []; if (ok) q.forEach(s => exMerge(s, {}, true)); }); }
    return;
  }
  const ch = { bnk: 0, tsx: 0, ab: 0, sr: 0 };
  if (src.ideas) {   // v107e: nisan penghapusan
    const c = bnkClean(src.ideas), tm = exTMap(exLift(BNK.del, c.items), c.del), dd = x => tm.has(x.id) && tm.get(x.id) > x.u, dl = exTList(tm), lk = BNK.items.filter(x => !dd(x));
    ch.bnk = exItems(lk, c.items.filter(x => !dd(x)), BNK_MAX, apply, r, null, (o, n) => { if (!n.au && o.au) { n.au = o.au; n.aut = o.aut; } });
    if (lk.length !== BNK.items.length) { ch.bnk++; r.exAdded++; }
    if (!exTSame(dl, BNK.del)) { ch.bnk++; if (apply) BNK.del = dl; }
    if (apply) { BNK.items = lk; BNK.u = Math.max(BNK.u, c.u); }   // v108a: u toko selalu ikut, supaya dua perangkat konvergen walau isi sama
  }
  if (src.perf) {   // v108a: nisan penghapusan
    const c = tsxClean(src.perf), tm = exTMap(exLift(TSX.del, c.items), c.del), dd = x => tm.has(x.id) && tm.get(x.id) > x.u, dl = exTList(tm), lk = TSX.items.filter(x => !dd(x));
    ch.tsx = exItems(lk, c.items.filter(x => !dd(x)), TSX_MAX, apply, r);
    if (lk.length !== TSX.items.length) { ch.tsx++; r.exAdded++; }
    if (!exTSame(dl, TSX.del)) { ch.tsx++; if (apply) TSX.del = dl; }
    if (apply) { TSX.items = lk; TSX.u = Math.max(TSX.u, c.u); }   /* v107f: u toko ikut walau isi kosong (setelah hapus semua), supaya dua perangkat konvergen */
  }
  if (src.ab) {
    const c = abClean(src.ab), tm = exTMap(exLift(AB.del, c.tests.concat(c.best)), c.del), dd = x => tm.has(x.id) && tm.get(x.id) > x.u, dl = exTList(tm);   // v108a: nisan penghapusan
    const lt = AB.tests.filter(x => !dd(x)), lb = AB.best.filter(x => !dd(x));
    ch.ab = exItems(lt, c.tests.filter(x => !dd(x)), AB_MAX_T, apply, r) + exItems(lb, c.best.filter(x => !dd(x)), AB_MAX_B, apply, r, (x, loc) => !loc.some(y => abHN(y.h) === abHN(x.h)));
    if (lt.length !== AB.tests.length) { ch.ab++; r.exAdded++; }
    if (lb.length !== AB.best.length) { ch.ab++; r.exAdded++; }
    if (!exTSame(dl, AB.del)) { ch.ab++; if (apply) AB.del = dl; }
    if (apply) { AB.tests = lt; AB.best = lb; AB.u = Math.max(AB.u, c.u); } /* v107f */
  }
  if (src.series) {
    const c = srClean(src.series), tm = exTMap(exLift(SR.del, c.s), c.del), dd = x => tm.has(x.id) && tm.get(x.id) > x.u, dl = exTList(tm);   // v107e: nisan penghapusan
    const sl = SR.s.filter(x => !dd(x)), rmIds = new Set(SR.s.filter(dd).map(x => x.id)), inLive = c.s.filter(x => !dd(x));
    if (rmIds.size) { ch.sr++; r.exAdded++; }
    ch.sr += exItems(sl, inLive, SR_MAX, apply, r, (x, loc) => !loc.some(y => srNorm(y.n) === srNorm(x.n)));
    if (apply) SR.s = sl;
    Object.keys(SR.l).forEach(k => { if (rmIds.has(SR.l[k].sid)) { if (apply) delete SR.l[k]; ch.sr++; r.exAdded++; } });
    if (!exTSame(dl, SR.del)) { ch.sr++; if (apply) SR.del = dl; }
    const ids = new Set(sl.map(x => x.id).concat(apply ? [] : inLive.map(x => x.id))), newer = c.u > SR.u;
    Object.keys(c.l).forEach(k => {
      const v = c.l[k], cur = SR.l[k];
      if (!ids.has(v.sid) || (srHas(SR.l, k) && !(newer && (cur.sid !== v.sid || cur.ep !== v.ep)))) return;
      if (apply) SR.l[k] = v; ch.sr++; r.exAdded++;
    });
    Object.keys(c.th).forEach(k => { if (!srHas(SR.th, k) || (newer && SR.th[k] !== c.th[k])) { if (apply) SR.th[k] = c.th[k]; ch.sr++; r.exAdded++; } });
    if (apply) SR.u = Math.max(SR.u, c.u);   // v108a: idem
  }
  exMergeGL(src, r, apply);   // v107a
  exMergeSEP(src, r, apply);   // v107b
  exMergeSP(src, r, apply);   // v107c
  exMergeOD(src, r, apply);   // HR-3c
  exMergeBadan(src, r, apply);   // STB-2a-3b
  exMergeSinaps(src, r, apply);   // SNH-1c
  exMergeHafalan(src, r, apply);   // OTH-1c
  exMergeBuatan(src, r, apply);   // OTH-3b2
  exMergeTanda(src, r, apply);   // OTH-5c2c
  if (apply) {
    if (ch.bnk) { queueSave('bnk'); bnkRefresh(); try { bnkTabPaint(); } catch (e) { /* abaikan */ } }
    if (ch.tsx) { queueSave('tsx'); tsxRefresh(); }
    if (ch.ab) { queueSave('ab'); abRefresh(); }
    if (ch.sr) { queueSave('sr'); srRefresh(); }
  }
}
setTimeout(() => { exEnsure(); }, 2500);   // muat keempat toko di latar supaya impor JSON (sinkron sudah menunggu sendiri) tidak menunda
/* 106a-end */
/* 107a-begin: gaya bicara (`gaya`) dan keberlanjutan (`lanjut`) ikut cadangan JSON dan SINKRON (keputusan pemilik 3 Nov 2026 "ikutkan juga"). Di `extra.gaya` dan `extra.lanjut`; keduanya TIDAK ditulis bila belum pernah disentuh (u = 0). Gaya: toko dengan u lebih besar menang seutuhnya. Lanjut: penghitung per tanggal (used, ext) = terbesar; off = gabungan; ref per pekan = u terbesar; on/lim = ikut toko yang u-nya lebih besar. TIDAK menghapus. */
function exMergeGL(src, r, apply) {
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (src.gaya) {
    const c = gyClean(src.gaya);
    if (c.u > GY.u) { r.exAdded++; if (apply) { GY.pr = c.pr; GY.rg = c.rg; GY.mix = c.mix; GY.words = c.words; GY.ban = c.ban; GY.u = c.u; dirty.gy = true; queueSave('gy'); gyPaint(); } } else r.exSame++;
  }
  if (src.lanjut) {
    const c = lyClean(src.lanjut); let l = 0;
    ['used', 'ext'].forEach(m => Object.keys(c[m]).forEach(d => { if (!(LY[m][d] >= c[m][d])) { l++; if (apply) LY[m][d] = c[m][d]; } }));
    Object.keys(c.ref).forEach(w => { const o = LY.ref[w]; if (!o || c.ref[w].u > o.u) { l++; if (apply) LY.ref[w] = c.ref[w]; } });
    c.off.forEach(d => { if (!LY.off.includes(d)) { l++; if (apply) LY.off.push(d); } });
    if (c.u > LY.u && (c.on !== LY.on || c.lim !== LY.lim)) { l++; if (apply) { LY.on = c.on; LY.lim = c.lim; } }
    if (l) r.exAdded += l; else r.exSame++;
    if (apply && (l || c.u > LY.u)) {
      const keep = (m, n) => { Object.keys(m).sort().slice(0, -n).forEach(k => { delete m[k]; }); };
      keep(LY.used, 60); keep(LY.ext, 60); keep(LY.ref, 60); LY.off = LY.off.slice().sort().slice(-120);
      LY.u = Math.max(LY.u, c.u); dirty.ly = true; queueSave('ly'); lyPaint();
    }
  }
}
/* 107a-end */
/* 107b-begin: latihan skill (`skill`), produksi (`prod`: det + used) dan daftar shot HARI INI (`shots`) ikut cadangan JSON dan SINKRON (keputusan pemilik 3 Nov 2026 "ikutkan juga"). Di `extra.skill`, `extra.prod`, `extra.shots`; tiap bagian TIDAK ditulis bila belum pernah disentuh (u = 0; shots juga bila bukan hari ini). Skill: penghitung per tanggal = terbesar; pelajaran mikro selesai menang; riwayat mono = gabungan (maks 20, terbaru); pat/cyc ikut toko yang u-nya lebih besar. Prod: det = hari terbaru; used = gabungan (maks 14); `cd` dan `vib` (preferensi perangkat) TIDAK ikut. Shots: ceklis gabungan, saran AI diisi bila kosong, hanya tanggal hari ini. TIDAK menghapus. */
const skMK = m => m.d + '|' + m.t + '|' + m.sec + '|' + m.pk;
const skMC = (a, b) => (b.t - a.t) || (a.d < b.d ? 1 : a.d > b.d ? -1 : 0) || (a.sec - b.sec) || (a.pk - b.pk);
const evUK = x => x.id + '|' + x.d;
const evUC = (a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function exMergeSEP(src, r, apply) {
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (src.skill) {
    const c = skClean(src.skill); let l = 0;
    ['wu', 'br'].forEach(m => Object.keys(c[m]).forEach(d => { if (!(SK[m][d] >= c[m][d])) { l++; if (apply) SK[m][d] = c[m][d]; } }));
    Object.keys(c.mi).forEach(d => { const o = SK.mi[d]; if (!o || (c.mi[d].done && !o.done)) { l++; if (apply) SK.mi[d] = c.mi[d]; } });
    const have = new Set(SK.mono.map(skMK)), mg = SK.mono.concat(c.mono.filter(m => !have.has(skMK(m)))).sort(skMC).slice(0, SK_KEEP), keep = new Set(mg.map(skMK));
    if (mg.length !== SK.mono.length || SK.mono.some(m => !keep.has(skMK(m)))) { l++; if (apply) SK.mono = mg; }
    if (c.u > SK.u && (c.pat !== SK.pat || c.cyc !== SK.cyc)) { l++; if (apply) { SK.pat = c.pat; SK.cyc = c.cyc; } }
    if (l) r.exAdded += l; else r.exSame++;
    if (apply && (l || c.u > SK.u)) {
      ['wu', 'br', 'mi'].forEach(m => Object.keys(SK[m]).sort().slice(0, -90).forEach(k => { delete SK[m][k]; }));
      SK.u = Math.max(SK.u, c.u); dirty.sk = true; queueSave('sk'); skPaint();
    }
  }
  if (src.prod) {
    const c = evStoreClean(src.prod); let l = 0;
    if (c.det.d && c.det.t && (c.det.d > EV.det.d || (c.det.d === EV.det.d && c.u > EV.u && c.det.t !== EV.det.t))) { l++; if (apply) EV.det = { d: c.det.d, t: c.det.t }; }
    const have = new Set(EV.used.map(evUK)), mg = EV.used.concat(c.used.filter(x => !have.has(evUK(x)))).sort(evUC).slice(-EV_USED), keep = new Set(mg.map(evUK));
    if (mg.length !== EV.used.length || EV.used.some(x => !keep.has(evUK(x)))) { l++; if (apply) EV.used = mg; }
    if (l) r.exAdded += l; else r.exSame++;
    if (apply && (l || c.u > EV.u)) { EV.u = Math.max(EV.u, c.u); dirty.ev = true; queueSave('ev'); evRepaint(); }
  }
  if (src.shots) {
    const c = shtClean(src.shots);
    if (c.u > 0) {   // shtClean membuang tanggal selain hari ini
      if (apply) shtCur();
      const cur = SHT.d === today(), ck = cur ? SHT.ck : {}, ai = cur ? SHT.ai : {}; let l = 0;
      for (let i = 0; i < SHT_N; i++) {
        const a = c.ck[i]; if (a) { const o = ck[i] || {}, ks = Object.keys(a).filter(k => !o[k]); if (ks.length) { l++; if (apply) { ks.forEach(k => { o[k] = 1; }); SHT.ck[i] = o; } } }
        if (c.ai[i] && !ai[i]) { l++; if (apply) SHT.ai[i] = c.ai[i]; }
      }
      if (l) r.exAdded += l; else r.exSame++;
      if (apply && (l || c.u > SHT.u)) { SHT.u = Math.max(SHT.u, c.u); dirty.sht = true; queueSave('sht'); clPaint(); }
    }
  }
}
/* 107b-end */
/* 107c-begin: latihan bicara (`speak`): take (`tk`), baseline (`bl`), level resmi (`lv`) dan pilihan pustaka HARI INI (`lib`) ikut cadangan JSON dan SINKRON (keputusan pemilik 3 Nov 2026, ikutkan juga). Di `extra.speak`. TIDAK ikut: draf Konten (`dr`), setelan tampilan (`set`) dan `u` toko (u naik tiap ketikan draf; kalau ikut, snapshot berubah terus). Take dan baseline per id: id baru ditambah, id sama = yang punya stempel sunting `e` lebih besar menang (e dipasang saat transkrip atau skor rubrik diubah; sama atau tanpa e = lokal tetap), batas modul 120 dan 12 (yang terbaru). Level = terbesar (level resmi hanya naik). Pustaka hanya bila tanggalnya hari ini, tiap pilihan = terbesar. Penghapusan merambat lewat nisan (`del`, v107d). */
let spRdy = false;   // true sesudah boot memuat toko speak (menggabung ke toko yang belum termuat bisa menimpa isinya)
const spMC = (a, b) => (b.t - a.t) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function spMergeList(loc, inc, cap) {
  const loci = new Map(loc.map(x => [x.id, x])), m = new Map(loci);
  inc.forEach(x => { const o = m.get(x.id); if (!o || (x.e || 0) > (o.e || 0)) m.set(x.id, x); });
  const list = Array.from(m.values()).sort(spMC).slice(0, cap);
  return { list, ch: list.filter(x => loci.get(x.id) !== x).length };
}
function exMergeSP(src, r, apply) {
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  const raw = src.speak; if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const c = spClean({ tk: raw.tk, bl: raw.bl, lv: raw.lv, lib: raw.lib, del: raw.del }); let l = 0;   // v107d: nisan penghapusan
  const lt = new Map(spDb.del.filter(d => exSyncMode || !c.tk.concat(c.bl).some(y => y.id === d.id)).map(d => [d.id, d.x])), tm = new Map(lt);
  c.del.forEach(d => { if (!(tm.get(d.id) >= d.x)) tm.set(d.id, d.x); });
  const dead = x => tm.has(x.id) && tm.get(x.id) > (x.e || 0);
  const lk = spDb.tk.filter(x => !dead(x)), lb = spDb.bl.filter(x => !dead(x));
  const a = spMergeList(lk, c.tk.filter(x => !dead(x)), SP_MAX), b = spMergeList(lb, c.bl.filter(x => !dead(x)), 12);
  if (a.ch || lk.length !== spDb.tk.length) { l++; if (apply) spDb.tk = a.list; }
  if (b.ch || lb.length !== spDb.bl.length) { l++; if (apply) spDb.bl = b.list; }
  const dl = Array.from(tm, ([id, x]) => ({ id, x })).sort(spDC).slice(0, SP_DEL);
  if (dl.length !== spDb.del.length || dl.some((d, i) => d.id !== spDb.del[i].id || d.x !== spDb.del[i].x)) { l++; if (apply) spDb.del = dl; }
  if (c.lv > spDb.lv) { l++; if (apply) spDb.lv = c.lv; }
  if (c.lib && c.lib.d === today()) {
    const o = spLibToday(), n = { d: o.d, h: Math.max(o.h, c.lib.h), c: Math.max(o.c, c.lib.c), f: Math.max(o.f, c.lib.f) };
    if (n.h !== o.h || n.c !== o.c || n.f !== o.f) { l++; if (apply) spDb.lib = n; }
  }
  if (l) r.exAdded += l; else r.exSame++;
  if (apply && l) { spDb.u = Date.now(); queueSave('sp'); spApplyCal(); spPaint(); }
}
/* 107c-end */
/* 107d-begin: nisan penghapusan (`del`) untuk take dan baseline latihan bicara: hapus di satu perangkat ikut merambat lewat sinkron dan cadangan JSON (utang 107c butir 1). Nisan = {id, x} (x = waktu hapus). Gabung: nisan digabung per id (x terbesar), maks 200 (yang terbaru). Take/baseline mati bila ada nisan dengan x lebih besar dari stempel suntingnya (`e`, 0 bila tak pernah disunting); jadi sunting atau Urungkan SESUDAH hapus (e baru) menghidupkannya lagi. Urungkan memasang e baru dan melepas nisan lokal. "Hapus semua data" (spWipe) TIDAK menulis nisan. */
const SP_DEL = 200;
const spDC = (a, b) => (b.x - a.x) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function spTombAdd(id) { spDb.del = (spDb.del || []).filter(d => d.id !== id).concat([{ id, x: Date.now() }]).sort(spDC).slice(0, SP_DEL); }
function spTombDrop(id) { spDb.del = (spDb.del || []).filter(d => d.id !== id); }
/* 107d-end */
/* 107e-begin: nisan penghapusan (`del`) untuk Bank ide dan Seri Konten (`extra.ideas.del`, `extra.series.del`): hapus di satu perangkat ikut merambat lewat sinkron dan cadangan JSON (utang 107d butir 1). Nisan = {id, x} (x = waktu hapus). Ide/seri MATI bila ada nisan dengan x lebih besar dari `u`-nya; sunting atau Urungkan SESUDAH hapus (u baru) menghidupkannya lagi. Seri yang mati ikut menghapus tautan episodenya. "Hapus semua data" (bnkWipe/srWipe) TIDAK menulis nisan. */
function exTClean(a) { const m = new Map(); (Array.isArray(a) ? a : []).forEach(d => { if (d && typeof d === 'object' && cnId(d.id)) { const x = cnUpd(d.x); if (x && !(m.get(d.id) >= x)) m.set(d.id, x); } }); return Array.from(m, ([id, x]) => ({ id, x })).sort(spDC).slice(0, SP_DEL); }
function exTAdd(o, id) { o.del = (o.del || []).filter(d => d.id !== id).concat([{ id, x: Date.now() }]).sort(spDC).slice(0, SP_DEL); }
function exTDrop(o, id) { o.del = (o.del || []).filter(d => d.id !== id); }
function exTMap(a, b) { const m = new Map(a.map(d => [d.id, d.x])); b.forEach(d => { if (!(m.get(d.id) >= d.x)) m.set(d.id, d.x); }); return m; }
const exTList = m => Array.from(m, ([id, x]) => ({ id, x })).sort(spDC).slice(0, SP_DEL);
const exTSame = (a, b) => a.length === b.length && a.every((d, i) => d.id === b[i].id && d.x === b[i].x);
/* 107e-end */
/* 107f-begin: "Hapus semua data" ikut merambat untuk toko bernisan (Bank ide, Seri, take dan baseline bicara): sebelum menghapus, id semua isi dicatat; sesudah menghapus, tiap id diberi nisan (x = waktu hapus). Toko lain (catatan harian, berat, menu, konten, dst.) TIDAK merambat. Impor BERKAS cadangan (bukan sinkron) mengangkat nisan LOKAL untuk id yang ada di berkas, supaya "hapus semua lalu pulihkan dari cadangan" tetap memulihkan; sinkron (`exSyncMode`) tidak mengangkat. */
let exSyncMode = false;
const exLift = (del, items) => exSyncMode ? del : del.filter(d => !items.some(y => y.id === d.id));
function exWipeIds() { return { b: BNK.items.map(x => x.id), s: SR.s.map(x => x.id), p: spDb.tk.concat(spDb.bl).map(x => x.id), t: TSX.items.map(x => x.id), a: AB.tests.concat(AB.best).map(x => x.id) }; }
function exWipeApply(w) { w.b.forEach(id => exTAdd(BNK, id)); w.s.forEach(id => exTAdd(SR, id)); w.p.forEach(id => spTombAdd(id)); w.t.forEach(id => exTAdd(TSX, id)); w.a.forEach(id => exTAdd(AB, id)); }
/* 107f-end */
/* 108a-begin: nisan penghapusan (`del`) untuk Statistik TikTok (`extra.perf.del`) dan Tes A/B (`extra.ab.del`, berlaku untuk tes DAN hook terbaik; id acak jadi tidak bertabrakan): hapus di satu perangkat ikut merambat lewat sinkron dan cadangan JSON, termasuk lewat "Hapus semua data" (utang 107g butir 1). Aturan sama dengan 107e: item MATI bila ada nisan dengan x lebih besar dari `u`-nya; sunting atau Urungkan SESUDAH hapus (u baru) menghidupkannya lagi. Memakai pembantu exT* dari 107e dan exLift dari 107f. */
/* 108a-end */
function actExportJson(w) {
  if (w !== 'ex' && !exReady()) { exEnsure().then(() => actExportJson('ex')); return; }   // v106a: toko ide/seri/statistik/A-B harus termuat dulu
  if (!hasAnyData()) { toast('Belum ada data'); return; }
  const text = backupText();
  openSheet({
    title: 'Cadangan JSON',
    note: 'Simpan file ini di luar HP (Drive, WhatsApp ke diri sendiri, Catatan, Files). Teksnya juga bisa disalin.', text,
    actions: [
      { label: 'Simpan file', primary: true, fn: () => saveBackupFile(text) },
      { label: 'Salin', fn: async () => { if (await copyFromSheet()) markBackup(); } },
      closeBtn
    ]
  });
}
function actCopyWeek() {
  openSheet({ title: 'Audit ' + rangeLabel(curW), text: toWeeklyText(curW, WE()), actions: [copyBtn, closeBtn] });
}
function actExportWText() {
  const keys = Object.keys(wdb).sort();
  if (!keys.length) { toast('Belum ada audit mingguan'); return; }
  openSheet({ title: 'Semua audit mingguan (teks)', text: keys.map(w => toWeeklyText(w, wdb[w])).join('\n\n'), actions: [copyBtn, closeBtn] });
}
function actExportWCsv() {
  if (!Object.keys(wdb).length) { toast('Belum ada audit mingguan'); return; }
  const text = toWeeklyCSV();
  openSheet({ title: 'Ekspor CSV mingguan', text, actions: [copyBtn, { label: 'Unduh', fn: () => download('weekly-audit-' + today() + '.csv', text, 'text/csv') }, closeBtn] });
}
function actExportCsv() {
  if (!Object.keys(db).length) { toast('Belum ada data'); return; }
  const text = toCSV();
  openSheet({ title: 'Ekspor CSV', text, actions: [copyBtn, { label: 'Unduh', fn: () => download('daily-log-' + today() + '.csv', text, 'text/csv') }, closeBtn] });
}
function actImport(prefill) {
  openSheet({
    title: 'Pulihkan dari cadangan', note: 'Pilih file JSON atau tempel isinya. Ringkasannya ditampilkan dulu sebelum digabungkan.',
    text: typeof prefill === 'string' ? prefill : '', readonly: false, file: true,
    actions: [{ label: 'Periksa', primary: true, fn: () => importReview($('#shText').value) }, closeBtn]
  });
}
const listIf = a => a.filter(Boolean).join(', ');
function importReview(text) {
  const obj = parseBackup(text);
  if (typeof obj === 'string') { toast(obj); return; }
  const r = mergeImport(obj, false), L = [];
  const exp = obj.exported && !isNaN(Date.parse(obj.exported)) ? new Date(obj.exported) : null;
  const ver = Number.isFinite(Number(obj.version)) && Number(obj.version) > 0 ? Number(obj.version) : 0;
  L.push('Cadangan' + (exp ? ' dibuat ' + exp.getDate() + ' ' + BULAN[exp.getMonth()].slice(0, 3) + ' ' + exp.getFullYear() : '') + (ver ? ' (versi ' + ver + ')' : '') + '.');
  L.push('Isi file: ' + (listIf([r.nD && r.nD + ' hari log', r.nW && r.nW + ' pekan audit', r.pHas && 'rencana', r.nT && r.nT + ' hari latihan', r.nC && r.nC + ' hari ceklis', r.nM && r.nM + ' hari dengan daftar makanan', r.nF && r.nF + ' favorit', r.nK && r.nK + ' hari kram detail', r.nMp && r.nMp + ' hari menu', r.shHas && 'daftar belanja (' + r.shHas + ' barang)', r.nCn && r.nCn + ' item konten', r.nIb && r.nIb + ' hari ibadah']) || 'kosong') + '.');
  const add = listIf([r.added && r.added + ' hari log', r.wAdded && r.wAdded + ' pekan audit', r.tAdded && r.tAdded + ' hari latihan', r.cAdded && r.cAdded + ' hari ceklis', r.fAdded && r.fAdded + ' favorit', r.kAdded && r.kAdded + ' hari kram detail', r.mpAdded && r.mpAdded + ' hari menu', r.shSet && 'daftar belanja', r.cnAdded && r.cnAdded + ' item konten', r.ibAdded && r.ibAdded + ' hari ibadah']);
  const upd = listIf([r.updated && r.updated + ' hari log', r.wUpdated && r.wUpdated + ' pekan audit', r.pSet && 'rencana']);
  const skip = listIf([r.same && r.same + ' hari log', r.wSame && r.wSame + ' pekan audit', r.tSame && r.tSame + ' hari latihan', r.cSame && r.cSame + ' hari ceklis', r.kSame && r.kSame + ' hari kram detail', r.mpSame && r.mpSame + ' hari menu', r.shSame && 'daftar belanja', r.cnSame && r.cnSame + ' item konten', r.ibSame && r.ibSame + ' hari ibadah']);
  if (add) L.push('\nBaru: ' + add + '.');
  if (upd) L.push('Diperbarui (versi di file lebih baru): ' + upd + '.');
  if (skip) L.push('Dilewati (di perangkat ini sudah sama atau lebih baru): ' + skip + '.');
  if (r.gAdd || r.gUpd || r.gcAdd) L.push('Makanan: ' + listIf([r.gAdd && r.gAdd + ' Makanan saya baru', r.gUpd && r.gUpd + ' Makanan saya diperbarui', r.gcAdd && r.gcAdd + ' riwayat makanan baru']) + '.');
  if (r.odAdd || r.odUpd || r.odRem) L.push('Catatan pakaian: ' + listIf([r.odAdd && r.odAdd + ' hari baru', r.odUpd && r.odUpd + ' diperbarui', r.odRem && r.odRem + ' dihapus (mengikuti penghapusan di file atau batas 120 tanggal)']) + '.');
  if (r.sbAdd || r.sbUpd) L.push('Badan dan warna: ' + listIf([r.sbAdd && r.sbAdd + ' bagian baru', r.sbUpd && r.sbUpd + ' bagian diperbarui']) + '.');   // STB-2a-3b
  if (r.sbBlok) L.push('Perhatian: Badan dan warna di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi isi cadangan untuk bagian itu tidak digabung.');
  if (r.snAdd) L.push('Sinaps: ' + r.snAdd + ' sesi latihan baru.');   // SNH-1c
  if (r.snBlok) L.push('Perhatian: catatan Sinaps di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi isi cadangan untuk bagian itu tidak digabung.');   // SNH-1c
  if (r.hfAdd || r.hfUpd) L.push('Hafalan: ' + listIf([r.hfAdd && r.hfAdd + ' kartu baru', r.hfUpd && r.hfUpd + ' kartu diperbarui (versi di file lebih baru)']) + '.');   // OTH-1c
  if (r.hfPenuh) L.push('Dilewati: ' + r.hfPenuh + ' kartu Hafalan baru karena penyimpanan kartu penuh (maksimum 2000).');   // OTH-1c
  if (r.hfBlok) L.push('Perhatian: kartu Hafalan di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi isi cadangan untuk bagian itu tidak digabung.');   // OTH-1c
  if (r.hbAdd || r.hbUpd) L.push('Kartu buatan sendiri: ' + listIf([r.hbAdd && r.hbAdd + ' kartu baru', r.hbUpd && r.hbUpd + ' kartu diperbarui (versi di file lebih baru)']) + '.');   // OTH-3b2
  if (r.hbKembar) L.push('Catatan: ' + r.hbKembar + ' kartu buatan sendiri dari file punya sisi depan yang sama dengan kartu lain di sini (tetap ditambahkan).');   // OTH-3b2
  if (r.hbPenuh) L.push('Dilewati: ' + r.hbPenuh + ' kartu buatan sendiri baru karena penyimpanan kartu buatan penuh (maksimum 500).');   // OTH-3b2
  if (r.hbBlok) L.push('Perhatian: kartu buatan sendiri di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi isi cadangan untuk bagian itu tidak digabung.');   // OTH-3b2
  if (r.htAdd) L.push('Tanda hafal: ' + r.htAdd + ' ayat baru ditandai hafal di ' + r.htSurah + ' surah.');   // OTH-5c2c
  if (r.htTak) L.push('Dilewati: ' + r.htTak + ' isian tanda hafal di file karena tidak sah.');   // OTH-5c2c
  if (r.htBlok) L.push('Perhatian: tanda hafal di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi isi cadangan untuk bagian itu tidak digabung.');   // OTH-5c2c
  if (r.gDrop) L.push('Dilewati: ' + r.gDrop + ' makanan (nama kembar atau penyimpanan penuh).');
  if (r.mDrop) L.push('Perhatian: daftar makanan di perangkat ini untuk ' + r.mDrop + ' hari akan diganti mengikuti file (hari di file lebih baru).');
  if (!hasMerge(r)) L.push('\nTidak ada data baru yang bisa digabungkan.');
  L.push('\nImpor hanya menggabungkan. Tidak ada data di perangkat ini yang dihapus.');
  openSheet({
    title: 'Periksa cadangan', note: L.join('\n'), pre: true,
    actions: [hasMerge(r) ? { label: 'Gabungkan', primary: true, fn: () => doImport(text) } : null, { label: 'Ubah isi', fn: () => actImport(text) }, closeBtn].filter(Boolean)
  });
}
function doImport(text) {
  const r = importData(text);
  if (typeof r === 'string') { toast(r); return; }
  mdb.lastImport = Date.now(); queueSave('m');
  closeSheet();
  toast(r.added + ' hari baru, ' + r.updated + ' diperbarui; ' + r.wAdded + ' pekan baru, ' + r.wUpdated + ' diperbarui' + (r.pSet || r.tAdded || r.cAdded ? '; ' + (r.pSet ? 'rencana, ' : '') + r.tAdded + ' latihan, ' + r.cAdded + ' ceklis' : '') + ((r.odAdd || 0) + (r.odUpd || 0) ? '; ' + ((r.odAdd || 0) + (r.odUpd || 0)) + ' catatan pakaian' : '') + ((r.sbAdd || 0) + (r.sbUpd || 0) ? '; ' + ((r.sbAdd || 0) + (r.sbUpd || 0)) + ' bagian badan dan warna' : '') + ((r.snAdd || 0) ? '; ' + r.snAdd + ' sesi Sinaps' : '') + (((r.hfAdd || 0) + (r.hfUpd || 0)) ? '; ' + ((r.hfAdd || 0) + (r.hfUpd || 0)) + ' kartu Hafalan' : '') + (((r.hbAdd || 0) + (r.hbUpd || 0)) ? '; ' + ((r.hbAdd || 0) + (r.hbUpd || 0)) + ' kartu buatan sendiri' : '') + ((r.htAdd || 0) ? '; ' + r.htAdd + ' ayat hafal' : ''));   // SNH-1c, OTH-1c, OTH-3b2, OTH-5c2c
  renderData();
}
function actWipe() {
  openSheet({
    title: 'Hapus semua data?', note: 'Semua log di perangkat ini dihapus permanen. Cadangkan dulu jika masih perlu.',
    actions: [closeBtn, {
      label: 'Hapus semua', danger: true, fn: async () => {
        if (!booted) await bootP;   // T3: tunggu data tersimpan selesai digabung supaya tidak hidup lagi sesudah dihapus
        await exEnsure(); const wz = exWipeIds();   // v107f
        db = {}; wdb = {}; pdb = pblank(); tdb = {}; cdb = {}; edb = {}; fdb = []; kdb = {}; mpDb = { days: {}, shop: { it: [], updated: 0 } }; cnDb = { it: {} }; ibdb = ibxBlank(); scdb = scBlank(); spWipe(); tsxWipe(); abWipe(); bnkWipe(); srWipe(); gyWipe(); lyWipe(); nyWipe(); skWipe(); evWipe(); odWipe(); exWipeApply(wz); Object.keys(dirty).forEach(k => { dirty[k] = true; }); await flush(); closeSheet(); populate(); wpopulate(); renderData(); refreshView(); toast('Semua data dihapus');
      }
    }]
  });
}
$('#fileIn').addEventListener('change', ev => {
  const f = ev.target.files && ev.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => { $('#shText').value = String(r.result || ''); }; r.readAsText(f);
});
$('#scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

/* ========= RIWAYAT ========= */
function chartSVG(title, vals, labels, target, good) {
  const W = 300, H = 96, B = 14, T = 6, n = labels.length, bw = W / n;
  const nums = vals.filter(v => v != null);
  const max = Math.max(target || 0, ...nums, 1) * 1.12;
  const y = v => (T + (H - B - T) * (1 - v / max)).toFixed(1);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + ', 14 hari terakhir">';
  if (target != null) s += '<line class="t" x1="0" x2="' + W + '" y1="' + y(target) + '" y2="' + y(target) + '"/>';
  labels.forEach((lb, i) => {
    const x = (i * bw + bw * .17).toFixed(1), w = (bw * .66).toFixed(1), v = vals[i];
    if (v == null) s += '<rect class="e" x="' + x + '" y="' + (H - B - 2) + '" width="' + w + '" height="2" rx="1"/>';
    else {
      const cls = good ? (good(v) ? 'ok' : 'bad') : 'n', yy = y(v);
      s += '<rect class="' + cls + '" x="' + x + '" y="' + yy + '" width="' + w + '" height="' + Math.max(1, H - B - yy).toFixed(1) + '" rx="2"/>';
    }
    s += '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + esc(lb) + '</text>';
  });
  return s + '</svg>';
}
function renderHistory() {
  const t = today(), days = [];
  for (let i = 13; i >= 0; i--) days.push(addDays(t, -i));
  const last7 = days.slice(7);
  const M = METRIC;
  const TT = tgBase(t);
  const series = k => days.map(d => db[d] ? M[k](db[d]) : null);
  const avg = k => { const v = series(k).slice(7).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const logged = last7.filter(d => db[d]).length;
  const shalatDays = last7.filter(d => db[d] && db[d].shalat === 'ya').length;
  const tiles = [
    ['Kalori', fmt(avg('kcal'), 0), (TT.mode === 'range' ? 'rentang ' + kcalTgt(TT) : 'batas ' + fmt(TT.kcal, 0)) + ' kcal'],
    ['Protein', avg('protein') == null ? '–' : fmt(avg('protein'), 0) + ' g', 'target ' + fmt(TT.protein, 0) + ' g'],
    ['Air putih', avg('water') == null ? '–' : fmt(avg('water'), 2) + ' L', 'target ' + TT.water + ' L'],
    ['Tidur', avg('sleep') == null ? '–' : fmt(avg('sleep'), 1) + ' jam', 'rata-rata'],
    ['Screen time', avg('screen') == null ? '–' : fmt(avg('screen'), 1) + ' jam', 'per hari'],
    ['Shalat tepat waktu', shalatDays + ' / 7', 'hari']
  ].concat(histTrainTiles(last7)).map(x => '<div class="tile"><small>' + x[0] + '</small><b>' + x[1] + '</b><em>' + x[2] + '</em></div>').join('');

  const cb = (title, k, target, good, unit, d) => {
    const a = avg(k);
    return '<div class="chart"><div class="ch">' + title + '<small>rata-rata 7 hari: ' + (a == null ? '–' : fmt(a, d) + ' ' + unit) + '</small></div>' +
      chartSVG(title, series(k), days.map(d => pd(d).getDate()), target, good) + '</div>';
  };
  const keys = histKeys();
  const list = keys.length ? keys.map(d => {
    const e = db[d] || blank(), [n, tt] = completion(e), parts = [];
    if (e.shalat) parts.push('Shalat ' + (e.shalat === 'ya' ? '✓' : '✗'));
    if (num(e.kcal) != null) parts.push(fmt(num(e.kcal), 0) + ' kcal');
    if (num(e.protein) != null) parts.push('P ' + fmt(num(e.protein), 0) + ' g');
    if (num(e.water) != null) parts.push(fmt(num(e.water), 2) + ' L');
    if (num(e.sleep) != null) parts.push('Tidur ' + fmt(num(e.sleep), 1) + ' j');
    if (num(e.pmo) != null) parts.push('Streak ' + fmt(num(e.pmo), 0));
    histTrainParts(d, parts);
    return '<button class="hrow" data-date="' + d + '"><div class="hd">' + esc(dayShort(d)) + '<span>' + n + '/' + tt + ' terisi</span></div><div class="hm">' + (parts.join('  ·  ') || 'Belum ada isian') + '</div></button>';
  }).join('') : '<div class="empty">Belum ada log. Isi tab Hari ini, lalu hasilnya muncul di sini.</div>';

  $('#histBody').innerHTML =
    '<p class="note" style="margin-top:10px">7 hari terakhir: ' + logged + ' dari 7 hari tercatat</p>' +
    '<div class="tiles">' + tiles + '</div>' +
    cb('Kalori', 'kcal', TT.kcal, v => kcalOk(v, TT), 'kcal', 0) +
    cb('Protein', 'protein', TT.protein, v => v >= TT.protein, 'g', 0) +
    cb('Air putih', 'water', TT.water, v => v >= TT.water, 'L', 2) +
    cb('Tidur', 'sleep', null, null, 'jam', 1) +
    cb('Screen time', 'screen', null, null, 'jam', 1) +
    '<h2 class="sub">Semua hari</h2>' + list;
  b15Paint();
  rs23();   // v23r: strip 7 hari, pilih grafik, riwayat per bulan
}
function renderData() {
  const n = Object.keys(db).length, wn = Object.keys(wdb).length;
  $('#dataInfo').textContent = n + ' hari log harian dan ' + wn + ' pekan audit' + extraInfo() + ' tercatat. Menghapus data browser atau ganti perangkat akan menghilangkan log, jadi cadangkan secara berkala.';
  $('#safeBox').innerHTML = safeBoxHTML();
  renderAiBox();
  renderSyBox();
  gdUsBox();
  renderUpBox();
  renderRmBox();
  renderCspBox();
  stPaint();
}
let stTab = 'bk';   // v74s: bagian Pengaturan yang tampil (selalu mulai di Cadangan saat halaman BARU dibuka)
function stPaint() {
  [['bk'], ['ex'], ['pf']].forEach(([k]) => { const el = $('#stP-' + k); if (el) el.hidden = k !== stTab; });
  $$('#stSeg .pill').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === stTab)));
}

/* ========= NAVIGASI ========= */
const TABOF = { home: 'home', content: 'more', nutrition: 'more', train: 'train', today: 'jurnal', weekly: 'jurnal', history: 'jurnal', roadmap: 'roadmap', more: 'more', data: 'more', ibadah: 'more', selfcare: 'more', sinaps: 'more', dapper: 'more', english: 'more' };   // NW0
let lastJ = 'today';
const RENDER = {};   // modul mendaftar di sini: RENDER.namaView = fungsi
function showView(v) {
  if (!TABOF[v] || !$('#v-' + v)) v = 'today';
  const jvPrev = curView;   // v23h2: tampilan sebelumnya (untuk tahu Harian BARU dibuka)
  curView = v;
  if (v !== 'train' && ytS && ytS.hid === 'ytHostY') ytEnd();   // v68b: pindah halaman = hentikan video Yoga (halaman lama hanya disembunyikan)
  if (TABOF[v] === 'jurnal') lastJ = v;
  Object.keys(TABOF).forEach(x => { const el = $('#v-' + x); if (el) el.hidden = x !== v; });
  $('#top').hidden = v !== 'today';
  $('#topW').hidden = v !== 'weekly';
  $('#topH').hidden = v !== 'history';
  $$('.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === TABOF[v] ? 'page' : 'false'));
  $$('.jsub button').forEach(b => b.setAttribute('aria-current', b.dataset.goto === v ? 'page' : 'false'));
  if (v === 'today') { jrPaint(); if (jvPrev !== 'today') jvOpen(); }
  if (v === 'weekly') { wpopulate(); if (jvPrev !== 'weekly') wkOpen(); }   // v23w: kartu terlipat tiap Mingguan BARU dibuka
  if (v === 'history') { if (jvPrev !== 'history') rsOpen(); renderHistory(); }   // v23r2: kartu bulan terlipat tiap Riwayat BARU dibuka
  if (v === 'train' && jvPrev !== 'train') kzFresh();   // v24k1c: Tangga progresi + Sesi terakhir terlipat tiap Kalistenik BARU dibuka
  if (v === 'data') { if (jvPrev !== 'data') stTab = 'bk'; renderData(); }
  if (RENDER[v]) RENDER[v]();
  if (v === 'home' && jvPrev !== 'home') { const hb = $('#homeBody'); if (hb && !hb.dataset.enter) { hb.dataset.enter = '1'; setTimeout(() => { delete hb.dataset.enter; }, 1200); } }   // BR-5: bagian Beranda masuk bertahap tiap Beranda dibuka lagi
  tmSync();
  aiFabSync();
  window.scrollTo(0, 0);
}
/* ========= IBADAH & SELF CARE (v70): ringkasan dari isian Jurnal, tidak ada data baru yang disimpan ========= */
const IB_TXT = { tepat: 'Tepat waktu', telat: 'Telat', tidak: 'Tidak', none: 'Belum dicatat' };
const ibKind = s => !s || !s.d ? 'none' : s.d === 'tidak' ? 'tidak' : s.t === 'telat' ? 'telat' : 'tepat';
const ibDay = d => { const v = shView(db[d] || blank()); return PRAYERS.map(p => ibKind(v[p])); };
function ibStreak() {
  const full = d => ibDay(d).every(x => x === 'tepat');
  let d = today(), n = 0;
  if (!full(d)) d = addDays(d, -1);
  while (n < 400 && full(d)) { n++; d = addDays(d, -1); }
  return n;
}
const tile = (l, v, em) => '<div class="tile"><small>' + l + '</small><b>' + v + '</b>' + (em ? '<em>' + em + '</em>' : '') + '</div>';
function renderIbadah() {
  const t = today(), k = ibDay(t), n = PRAYERS.length;
  const rows = PRAYERS.map((p, i) => '<div class="ib-row"><span>' + p + '</span><span class="ib-s ib-' + k[i] + '">' + IB_TXT[k[i]] + '</span></div>').join('');
  const wk = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = addDays(t, -i), x = ibDay(d), any = x.some(y => y !== 'none');
    return '<div class="ib-row"><span>' + esc(dayShort(d)) + '</span><span class="ib-s">' + (any ? x.filter(y => y === 'tepat').length + ' dari ' + n + ' tepat waktu' : 'Belum dicatat') + '</span></div>';
  }).join('');
  $('#ibBody').innerHTML = '<div class="tiles">' + tile('Hari ini', k.filter(x => x === 'tepat').length + '/' + n, 'tepat waktu') + tile('Beruntun', ibStreak(), 'hari 5 tepat waktu') + '</div>' +
    '<h2 class="sub">Hari ini</h2>' + rows + '<h2 class="sub">7 hari terakhir</h2>' + wk +
    '<button class="act" data-goto="today"><b>Catat di Jurnal</b><span>Isi shalat 5 waktu di Jurnal &rsaquo; Harian</span></button>';
}
const scAvg = a => { a = a.filter(v => v != null); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
function renderSelfCare() {
  const t = today(), e = db[t] || blank(), days = [0, 1, 2, 3, 4, 5, 6].map(i => db[addDays(t, -i)] || blank());
  const sl = num(e.sleep), wa = num(e.water), h = num(e.stH), m = num(e.stM), pm = num(e.pmo);
  let wt = 3; try { wt = tgBase(t).water; } catch (x) {}
  const aS = scAvg(days.map(x => num(x.sleep))), aW = scAvg(days.map(x => num(x.water)));
  const cl = days.filter(x => x.junk === 'bersih').length, lg = days.filter(x => x.junk).length;
  $('#scBody').innerHTML = '<h2 class="sub">Hari ini</h2><div class="tiles">' +
    tile('Tidur', sl == null ? '–' : fmt(sl, 1) + ' jam') + tile('Air putih', wa == null ? '–' : fmt(wa, 2) + ' L', 'target ' + fmt(wt, 1) + ' L') +
    tile('Screen time', h == null && m == null ? '–' : (h || 0) + ' j ' + (m || 0) + ' m') +
    tile('Junkfood &amp; manis', e.junk === 'bersih' ? 'Bersih' : e.junk === 'melanggar' ? 'Melanggar' : '–') +
    tile('Kram', e.kram === 'ya' ? 'Ada' : e.kram === 'tidak' ? 'Tidak' : '–') + tile('Streak PMO', pm == null ? '–' : fmt(pm, 0) + ' hari') + '</div>' +
    '<h2 class="sub">7 hari terakhir</h2><div class="tiles">' +
    tile('Rata-rata tidur', aS == null ? '–' : fmt(aS, 1) + ' jam') + tile('Rata-rata air', aW == null ? '–' : fmt(aW, 2) + ' L') +
    tile('Hari bersih', lg ? cl + ' dari ' + lg : '–', 'tanpa junkfood &amp; manis') + '</div>' +
    '<p class="note">Ringkasan dari isian Jurnal; tidak ada data baru yang disimpan di halaman ini.</p>' +
    '<button class="act" data-goto="today"><b>Isi di Jurnal</b><span>Lengkapi catatan hari ini</span></button>';
}
RENDER.ibadah = renderIbadah;
RENDER.selfcare = renderSelfCare;

function refreshView() { derived(); if (RENDER[curView]) RENDER[curView](); }
function go(date) { if (!DATE_RE.test(date) || date > today()) { paintHeader(); return; } cur = date; populate(); }

/* ========= EVENT ========= */
const NUMERIC = ['pmo', 'stH', 'stM', 'kcal', 'protein', 'water', 'sleep'];
document.addEventListener('input', ev => {
  const el = ev.target, ds = el.dataset || {};
  if (ds.wk) {
    const wk = ds.wk;
    if (WNUM.includes(wk)) { const c = el.value.replace(/[^0-9.,]/g, ''); if (c !== el.value) el.value = c; }
    else if (wk === 'bwDelta') { const c = el.value.replace(/[^0-9.,+-]/g, ''); if (c !== el.value) el.value = c; }
    setW({ [wk]: el.value });
    return;
  }
  const k = ds.k;
  if (!k) return;
  if (NUMERIC.includes(k)) { const c = el.value.replace(/[^0-9.,]/g, ''); if (c !== el.value) el.value = c; }
  setE({ [k]: el.value });
  if (k === 'sleepStart' || k === 'sleepEnd') sleepAuto();   // v23z4
});
document.addEventListener('change', ev => {
  const el = ev.target;
  if (el.dataset && el.dataset.k === 'stM') {
    const m = num(el.value);
    if (m != null && m >= 60) {
      setField('stH', String((num(E().stH) || 0) + Math.floor(m / 60)));
      setField('stM', String(Math.floor(m % 60)));
    }
  }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && ev.target.type !== 'file') ev.target.blur();
});
document.addEventListener('click', ev => {
  const t = ev.target;
  const pill = t.closest('.pill');
  if (pill && pill.closest('#v-weekly')) {
    const we = WE(), wv = pill.dataset.v, wg = pill.closest('[data-wseg]');
    if (wg) { const wk = wg.dataset.wseg; setW({ [wk]: we[wk] === wv ? null : wv }); }
    else if (pill.closest('#energy')) setW({ energy: we.energy === +wv ? null : +wv });
    return;
  }
  if (pill) {
    const e = E(), v = pill.dataset.v;
    const seg = pill.closest('[data-seg]'), multi = pill.closest('[data-multi]');
    if (seg) { const k = seg.dataset.seg; if (k === 'kram' && kjBlockOff(e, v)) return; setE({ [k]: e[k] === v ? null : v }); return; }
    if (multi) {
      const k = multi.dataset.multi; let arr = e[k].slice();
      if (k === 'sesi') {
        if (v === 'rest') { arr = arr.includes('rest') ? [] : ['rest']; }
        else { arr = arr.filter(x => x !== 'rest'); arr = arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v); }
        setE(arr.length === 1 && arr[0] === 'rest' ? { sesi: arr, rpe: null } : { sesi: arr });
      } else setE({ [k]: arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v) });
      return;
    }
    if (pill.closest('#rpe')) { setE({ rpe: e.rpe === +v ? null : +v }); return; }
  }
  const w = t.closest('[data-water]');
  if (w) {
    if (w.dataset.water === 'reset') { setField('water', ''); return; }
    const dv = parseFloat(w.dataset.water), cw = num(E().water);
    if (dv < 0 && cw == null) return;   // tidak ada yang dikurangi; jangan membuat catatan kosong
    const n = Math.round(((cw || 0) + dv) * 100) / 100;
    setField('water', n <= 0 ? '' : String(n).replace('.', ',')); return;
  }
  const pm = t.closest('[data-pmo]');
  if (pm) { setField('pmo', pm.dataset.pmo); return; }
  const wno = t.closest('[data-wno]');
  if (wno) { setWField('no', wno.dataset.wno); return; }
  const wkr = t.closest('[data-wkram]');
  if (wkr) {
    const n = +wkr.dataset.wkram;
    if (n === 0) { setWField('kramN', ''); setW({ kram: 'nol' }); }
    else { setW({ kram: 'ada' }); setWField('kramN', String(n)); }
    return;
  }
  if (t.closest('#bwManualBtn')) { bwOpen = !bwOpen; wderived(); return; }
  const wdt = t.closest('[data-wdate]');
  if (wdt) { curW = weekStart(wdt.dataset.wdate); bwOpen = false; showView('weekly'); return; }
  const hr = t.closest('[data-date]');
  if (hr) { cur = hr.dataset.date; showView('today'); populate(); return; }
  const act = t.closest('[data-act]');
  if (act) { ({ copyDay: actCopyDay, copyWeek: actCopyWeek, exportText: actExportText, exportWText: actExportWText, exportJson: actExportJson, exportCsv: actExportCsv, exportWCsv: actExportWCsv, import: actImport, wipe: actWipe, exportKalCsv: actExportKalCsv, exportBikeCsv: actExportBikeCsv, exportChkCsv: actExportChkCsv, exportMealCsv: actExportMealCsv })[act.dataset.act](); return; }
  const gt = t.closest('[data-goto]');
  if (gt) { showView(gt.dataset.goto); return; }
  const tab = t.closest('.tabs [data-view]');
  if (tab) showView(tab.dataset.tab === 'jurnal' ? lastJ : tab.dataset.view);
});
$('#prev').addEventListener('click', () => go(addDays(cur, -1)));
$('#next').addEventListener('click', () => go(addDays(cur, 1)));
$('#goToday').addEventListener('click', () => go(today()));
$('#copyDay').addEventListener('click', actCopyDay);
$('#wprev').addEventListener('click', () => goW(addDays(curW, -7)));
$('#wnext').addEventListener('click', () => goW(addDays(curW, 7)));
$('#wgoNow').addEventListener('click', () => goW(thisWeek()));
$('#copyWeek').addEventListener('click', actCopyWeek);
$('#datepick').addEventListener('change', ev => go(ev.target.value));
$('#datepick').addEventListener('click', ev => { try { ev.target.showPicker && ev.target.showPicker(); } catch (e) { /* abaikan */ } });

/* ===== MODUL: MODEL BARU (batch 1) ===== */
function nn(v) { if (v == null || v === '') return null; const x = +v; return Number.isFinite(x) ? x : null; }
function strArr(a, max) { return Array.isArray(a) ? a.filter(x => typeof x === 'string' && x.length <= 40).slice(0, max || 40) : []; }

/* rencana & pengaturan perjalanan (satu objek) */
function pblank() { return { start: '', bw0: '', opt: 'home', auto: true, split: '', ladder: { push: 1, pull: 1, legs: 1, core: 1 }, tkJob: '', tkLesson: 'data', profile: { tinggi: '', usia: '', jk: '' }, adj: { mode: 'auto', dis: null, log: [] }, updated: 0 }; }
function pclean(raw) {
  const b = pblank();
  if (!raw || typeof raw !== 'object') return b;
  if (typeof raw.start === 'string' && DATE_RE.test(raw.start)) b.start = raw.start;
  if (raw.bw0 != null) b.bw0 = String(raw.bw0).slice(0, 8);
  if (raw.opt === 'home' || raw.opt === 'gym') b.opt = raw.opt;
  if (raw.auto === false) b.auto = false;
  if (['ppl', 'ul', 'fb'].includes(raw.split)) b.split = raw.split;   // batch 17-S: jenis latihan terpilih ('' = Bawaan)
  if (raw.ladder && typeof raw.ladder === 'object') {
    ['push', 'pull', 'legs', 'core'].forEach(k => { const v = raw.ladder[k]; if (Number.isInteger(v) && v >= 1 && v <= 4) b.ladder[k] = v; });
  }
  if (typeof raw.tkJob === 'string') b.tkJob = raw.tkJob.slice(0, 80);
  if (['data', 'catat', 'ganti', 'custom', 'voice', 'detail'].includes(raw.tkLesson)) b.tkLesson = raw.tkLesson;
  if (raw.profile && typeof raw.profile === 'object') {
    const q = raw.profile;
    if (q.tinggi != null) b.profile.tinggi = String(q.tinggi).replace(/[^0-9.,]/g, '').slice(0, 6);
    if (q.usia != null) b.profile.usia = String(q.usia).replace(/\D/g, '').slice(0, 3);
    if (q.jk === 'L' || q.jk === 'P') b.profile.jk = q.jk;
    if (q.hrmax != null) { const hv = String(q.hrmax).replace(/\D/g, ''), hn = +hv; if (/^\d{3}$/.test(hv) && hn >= 100 && hn <= 230) b.profile.hrmax = String(hn); }   // q4b: HRmax terukur (opsional)
  }
  if (raw.adj && typeof raw.adj === 'object') {
    const a = raw.adj;
    if (['auto', 'ask', 'off'].includes(a.mode)) b.adj.mode = a.mode;
    if (a.dis && typeof a.dis === 'object' && typeof a.dis.sig === 'string' && typeof a.dis.until === 'string' && DATE_RE.test(a.dis.until)) b.adj.dis = { sig: a.dis.sig.slice(0, 80), until: a.dis.until };
    if (Array.isArray(a.log)) {
      b.adj.log = a.log.slice(0, 40).map(adjCleanEntry).filter(Boolean);
      // id dipakai Urungkan/Pulihkan: harus tak kosong dan unik; yang kosong atau ganda diganti (maks 24 huruf)
      const seen = new Set();
      b.adj.log.forEach((e, i) => { let id = e.id, n = 0; while (!id || seen.has(id)) id = ('a' + i.toString(36) + '_' + (n++).toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 24); e.id = id; seen.add(id); });
    }
  }
  b.updated = Number(raw.updated) || 0;
  return b;
}

/* latihan per tanggal: sesi kalistenik + catatan ride */
function tblank() { return { kal: null, rides: [], updated: 0 }; }
function tclean(raw) {
  const b = tblank();
  if (!raw || typeof raw !== 'object') return b;
  const k = raw.kal;
  if (k && typeof k === 'object') {
    const ex = {};
    if (k.ex && typeof k.ex === 'object') {
      Object.keys(k.ex).slice(0, 20).forEach(id => {
        const sets = k.ex[id] && Array.isArray(k.ex[id].s) ? k.ex[id].s : [];
        ex[id] = { s: sets.slice(0, 12).map(x => ({ r: x ? nn(x.r) : null, d: !!(x && x.d) })) };
      });
    }
    b.kal = {
      ph: Number.isInteger(k.ph) && k.ph >= 1 && k.ph <= 4 ? k.ph : 1, opt: k.opt === 'gym' ? 'gym' : 'home', ex,
      done: !!k.done, rpe: (Number.isInteger(k.rpe) && k.rpe >= 1 && k.rpe <= 10) ? k.rpe : null,
      t0: Number(k.t0) || 0, t1: Number(k.t1) || 0
    };
    // batch 16: kolom opsional (level tangga saat sesi, nyeri per gerakan, tanda deload, kemajuan pemanasan/pendinginan); tanpa kolom di data lama = tidak ditambah
    if (k.lv && typeof k.lv === 'object') {
      const lv = {};
      ['push', 'pull', 'legs', 'core'].forEach(p => { const v = k.lv[p]; if (Number.isInteger(v) && v >= 1 && v <= 4) lv[p] = v; });
      if (Object.keys(lv).length) b.kal.lv = lv;
    }
    if (k.pain && typeof k.pain === 'object' && !Array.isArray(k.pain)) {
      const pn = {};
      Object.keys(k.pain).slice(0, 20).forEach(id => {
        const x = k.pain[id]; if (!x || typeof x !== 'object') return;
        const l = (Number.isInteger(x.l) && x.l >= 0 && x.l <= 10) ? x.l : null, n = String(x.n == null ? '' : x.n).slice(0, 120);
        if (l != null || n) pn[String(id).slice(0, 24)] = { l, n };
      });
      if (Object.keys(pn).length) b.kal.pain = pn;
    }
    if (k.dl === true) b.kal.dl = true;
    // batch 17-S: jenis latihan sesi (sp), indeks hari (sd), salinan level saat susunan hari dibuat (sl); tanpa kolom = sesi program Fase
    if (['ppl', 'ul', 'fb'].includes(k.sp)) {
      b.kal.sp = k.sp;
      if (Number.isInteger(k.sd) && k.sd >= 0 && k.sd <= 5) b.kal.sd = k.sd;
      if (k.sl && typeof k.sl === 'object') { const sl = {}; ['push', 'pull', 'legs', 'core'].forEach(p => { const v = k.sl[p]; if (Number.isInteger(v) && v >= 1 && v <= 4) sl[p] = v; }); if (Object.keys(sl).length) b.kal.sl = sl; }
    }
    ['wu', 'cd'].forEach(f => { const x = k[f]; if (x && typeof x === 'object') b.kal[f] = { n: (Number.isInteger(x.n) && x.n >= 0 && x.n <= 12) ? x.n : 0, done: x.done === true }; });
  }
  if (Array.isArray(raw.rides)) {
    b.rides = raw.rides.slice(0, 20).filter(r => r && typeof r === 'object' && r.id).map(r => ({
      id: String(r.id).slice(0, 24), type: ['z2', 'thr', 'long', 'vo2', 'free'].includes(r.type) ? r.type : 'free',
      min: nn(r.min), km: nn(r.km), spd: nn(r.spd),
      rpe: (Number.isInteger(r.rpe) && r.rpe >= 1 && r.rpe <= 10) ? r.rpe : null,
      note: String(r.note || '').slice(0, 200), t: Number(r.t) || 0, x: svCols(r)
    })).map(r => { const x = r.x; delete r.x; return Object.assign(r, x); });
  }
  // q6a: tes FTP (kolom opsional ft: [{id, m, p, t}], paling banyak 5 per hari; m = c20 | rmp | dir; p = daya yang diketik, bilangan bulat 30-1200 W atau teks 1-4 digit); FTP hitung = floor((p x 95 | 75 | 100 + 50) / 100) harus 30-700 W; entri tidak sah atau id kembar dibuang; tanpa entri sah = kolom tidak ditambah (data lama IDENTIK)
  if (Array.isArray(raw.ft)) {
    const fk = { c20: 95, rmp: 75, dir: 100 }, ft = [];
    raw.ft.slice(0, 20).forEach(x => {
      if (ft.length >= 5 || !x || typeof x !== 'object' || !x.id) return;
      const p = typeof x.p === 'string' ? (/^\d{1,4}$/.test(x.p) ? Number(x.p) : NaN) : x.p, k = typeof x.m === 'string' && Object.prototype.hasOwnProperty.call(fk, x.m) ? fk[x.m] : 0, id = String(x.id).slice(0, 24);
      if (!k || !Number.isInteger(p) || p < 30 || p > 1200 || ft.some(y => y.id === id)) return;
      const v = Math.floor((p * k + 50) / 100);
      if (v < 30 || v > 700) return;
      ft.push({ id, m: x.m, p, t: Number(x.t) || 0 });
    });
    if (ft.length) b.ft = ft;
  }
  // 55: pemulihan harian rc {s tidur, t stres, n nyeri otot; bilangan bulat 1-5} dan tes LTHR lh [{id, b 80-220, t}] (maks 5/hari); tidak sah dibuang
  if (raw.rc && typeof raw.rc === 'object') { const rc = {}; ['s', 't', 'n'].forEach(k => { const v = raw.rc[k]; if (Number.isInteger(v) && v >= 1 && v <= 5) rc[k] = v; }); if (Object.keys(rc).length) b.rc = rc; }
  if (Array.isArray(raw.lh)) { const lh = []; raw.lh.slice(0, 20).forEach(x => { if (lh.length >= 5 || !x || typeof x !== 'object' || !x.id) return; const id = String(x.id).slice(0, 24); if (Number.isInteger(x.b) && x.b >= 80 && x.b <= 220 && !lh.some(y => y.id === id)) lh.push({ id, b: x.b, t: Number(x.t) || 0 }); }); if (lh.length) b.lh = lh; }
  // q7a: perawatan sepeda (kolom opsional mt: [{id, c, d, i, t}], paling banyak 8 per hari; c = lu | ch | ti | br | sv; d = tanggal perawatan YYYY-MM-DD yang nyata, tahun >= 2000; i = interval km 50-20000 (tidak sah = i dibuang, catatan tetap); entri tidak sah atau id kembar dibuang; tanpa entri sah = kolom tidak ditambah (data lama IDENTIK)
  if (Array.isArray(raw.mt)) {
    const mk = ['lu', 'ch', 'ti', 'br', 'sv'], mt = [];
    raw.mt.slice(0, 20).forEach(x => {
      if (mt.length >= 8 || !x || typeof x !== 'object' || !x.id) return;
      const id = String(x.id).slice(0, 24), c = x.c, m = typeof x.d === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(x.d) : null;
      if (typeof c !== 'string' || !mk.includes(c) || !m || +m[1] < 2000 || mt.some(y => y.id === id)) return;
      const dt = new Date(+m[1], +m[2] - 1, +m[3]);
      if (dt.getFullYear() !== +m[1] || dt.getMonth() !== +m[2] - 1 || dt.getDate() !== +m[3]) return;
      const iv = typeof x.i === 'string' ? (/^\d{1,5}$/.test(x.i) ? Number(x.i) : NaN) : x.i, e = { id, c, d: x.d };
      if (Number.isInteger(iv) && iv >= 50 && iv <= 20000) e.i = iv;
      const mo = typeof x.m === 'string' ? (/^\d{1,2}$/.test(x.m) ? Number(x.m) : NaN) : x.m;   // q8a: batas bulan 0-60 (0 = tanpa batas bulan); tidak sah = m dibuang, catatan tetap
      if (Number.isInteger(mo) && mo >= 0 && mo <= 60) e.m = mo;
      e.t = Number(x.t) || 0; mt.push(e);
    });
    if (mt.length) b.mt = mt;
  }
  // 62a: tanda OFF (skip workout) sk {n keterangan maks 120 huruf, t waktu, a = Rest di Jurnal DITAMBAHKAN oleh OFF ini}; tidak sah = kolom tidak ditambah (data lama IDENTIK)
  if (raw.sk && typeof raw.sk === 'object' && !Array.isArray(raw.sk)) b.sk = { n: typeof raw.sk.n === 'string' ? raw.sk.n.slice(0, 120) : '', t: Number(raw.sk.t) || 0, a: raw.sk.a === true };
  b.updated = Number(raw.updated) || 0;
  return b;
}

/* ceklis harian: rutinitas pagi (m), protokol elektrolit (e), hari refeed */
function cblank() { return { m: [], e: [], refeed: false, updated: 0 }; }
function cclean(raw) {
  const b = cblank();
  if (!raw || typeof raw !== 'object') return b;
  b.m = strArr(raw.m); b.e = strArr(raw.e);
  b.refeed = raw.refeed === true;
  b.updated = Number(raw.updated) || 0;
  return b;
}
function extraInfo() {
  const parts = [];
  const nt = Object.keys(tdb).filter(d => tdb[d].kal || tdb[d].rides.length).length;
  const nc = Object.keys(cdb).length, nm = Object.keys(edb).length;
  if (nt) parts.push(nt + ' hari latihan');
  if (nc) parts.push(nc + ' hari ceklis');
  if (nm) parts.push(nm + ' hari daftar makanan');
  { const nk = kjDays().length; if (nk) parts.push(nk + ' hari kram detail'); }
  { const nm2 = mpDays().length, ns = mpDb.shop.it.length; if (nm2) parts.push(nm2 + ' hari menu'); if (ns) parts.push(ns + ' barang belanja'); }
  { const ncn = cnActive().length; if (ncn) parts.push(ncn + ' item konten'); }
  return parts.length ? ', ' + parts.join(', ') : '';
}

/* ===== MODUL: INFRA AKSI (batch 1) ===== */
const QACT = {};   // aksi tombol: data-q="nama" memanggil QACT.nama(elemen, event)
/* CSPUI:begin (T4e-3): kartu "Catatan keamanan" di Pengaturan > Preferensi; memakai CSPLOG (T4e-1); tidak menyimpan apa pun sendiri */
let cspOpen = false;   // kartu terbuka (selama aplikasi terbuka)
let cspAll = false;    // daftar penuh (bawaan: 8 baris pertama)
const CSP_SHOW = 8;
const CSP_ARTI = { 'connect-src': 'Sambungan data', 'script-src': 'Skrip', 'script-src-elem': 'Skrip', 'script-src-attr': 'Skrip sebaris', 'style-src': 'Gaya', 'style-src-elem': 'Gaya', 'style-src-attr': 'Gaya sebaris', 'img-src': 'Gambar', 'media-src': 'Audio atau video', 'frame-src': 'Bingkai tertanam', 'font-src': 'Font', 'worker-src': 'Worker', 'form-action': 'Kirim formulir', 'object-src': 'Objek', 'base-uri': 'Alamat dasar', 'default-src': 'Bawaan' };
const cspStatus = (n, b) => (n ? n + ' jenis' + (b ? ' · ' + b + ' baru' : '') : 'Bersih');
function renderCspBox() {
  const box = $('#cspBox'); if (!box) return;
  const rows = CSPLOG.daftar(), nb = CSPLOG.baru(), cut = !cspAll && rows.length > CSP_SHOW;
  const li = (cut ? rows.slice(0, CSP_SHOW) : rows).map((r, i) => '<li><div class="csp-h"><span class="csp-d">' + esc(CSP_ARTI[r.d] || 'Lainnya') + ' <small>' + esc(r.d) + '</small></span><span class="csp-n">' + (i < nb ? '<i class="csp-new">baru</i> ' : '') + r.n + '×</span></div>' +
    '<div class="csp-u">' + esc(r.u) + '</div>' +
    '<div class="csp-m">' + (r.s ? 'Sumber ' + esc(r.s) + ' · ' : '') + 'pertama ' + esc(CSPLOG.waktu(r.a)) + ' · terakhir ' + esc(CSPLOG.waktu(r.z)) + '</div></li>').join('');
  box.innerHTML = '<details class="ph" id="cspDet"' + (cspOpen ? ' open' : '') + '><summary><span>Catatan keamanan</span><small id="cspStat">' + esc(cspStatus(rows.length, nb)) + '</small><i class="chev"></i></summary><div class="body">' +
    '<p class="note">Aplikasi ini memblokir skrip dan sambungan yang tidak dikenal. Bila sebuah fitur diam tanpa pesan, penyebabnya mungkin tercatat di sini. Salin catatannya lalu kirim ke Claude.</p>' +
    (rows.length ? '<ul class="csp-l">' + li + '</ul>' + (cut ? '<button class="link tap csp-more" data-q="cspMore">Tampilkan semua (' + rows.length + ')</button>' : '') : '<div class="empty">Belum ada yang diblokir.</div>') +
    '<div class="quick"><button class="btn sm" data-q="cspCopy"' + (rows.length ? '' : ' disabled') + '>Salin catatan</button><button class="btn sm ghost" data-q="cspDel"' + (rows.length ? '' : ' disabled') + '>Hapus catatan</button></div>' +
    '<p class="note">Alamat disimpan tanpa kueri dan tanpa kunci. Catatan hanya ada di perangkat ini dan tidak ikut cadangan JSON.</p></div></details>';
}
QACT.cspCopy = async () => {
  const txt = CSPLOG.teks();
  try { if (!navigator.clipboard || !navigator.clipboard.writeText) throw 0; await navigator.clipboard.writeText(txt); toast('Catatan tersalin'); return; } catch (e) { /* cadangan di bawah */ }
  openSheet({ title: 'Catatan keamanan', note: 'Tekan lama pada teks lalu pilih Salin.', text: txt, actions: [{ label: 'Salin', primary: true, fn: copyFromSheet }, { label: 'Tutup', fn: closeSheet }] });
};
QACT.cspMore = () => { cspAll = true; renderCspBox(); const l = $('#cspBox .csp-l li:nth-child(' + (CSP_SHOW + 1) + ')'); if (l) l.scrollIntoView({ block: 'nearest' }); };
QACT.cspDel = () => {
  const had = $('#cspBox') && $('#cspBox').contains(document.activeElement);
  CSPLOG.hapus(); cspAll = false; renderCspBox();
  if (had) { const d = $('#cspDet > summary'); if (d) d.focus(); }
  toast('Catatan keamanan dihapus');
};
document.addEventListener('toggle', ev => {
  if (!ev.target || ev.target.id !== 'cspDet') return;
  cspOpen = ev.target.open;
  if (cspOpen) { CSPLOG.tandaiDilihat(); const s = $('#cspStat'); if (s) s.textContent = cspStatus(CSPLOG.daftar().length, 0); }   // dibuka = sudah dilihat
}, true);
/* CSPUI:end */
QACT.sleepClr = () => { setField('sleepStart', ''); setField('sleepEnd', ''); };   // v23z4: hapus kedua jam; durasi tetap, kotaknya terbuka lagi
document.addEventListener('click', ev => {
  const seg = ev.target.closest('[data-pseg]');
  if (seg) {
    const b = ev.target.closest('.pill');
    if (b && b.dataset.v) { setP({ [seg.dataset.pseg]: b.dataset.v }); paintP(); }
    return;
  }
  const q = ev.target.closest('[data-q]');
  if (q && QACT[q.dataset.q]) QACT[q.dataset.q](q, ev);
});
document.addEventListener('input', ev => {
  const el = ev.target, pk = el.dataset && el.dataset.pk;
  if (!pk) return;
  let v = el.value;
  if (pk === 'bw0') { const c = v.replace(/[^0-9.,]/g, ''); if (c !== v) { el.value = c; v = c; } }
  if (pk === 'start' && v !== '' && !DATE_RE.test(v)) return;
  setP({ [pk]: v });
});
function setP(patch) {
  Object.assign(pdb, patch);
  pdb.updated = Date.now();
  queueSave('p');
  derived();
  if (curView === 'roadmap') rmDynamic();
}
function paintP() {
  $$('[data-pseg]').forEach(g => $$('.pill', g).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === pdb[g.dataset.pseg]))));
}
const kv = (a, b) => '<div class="kv"><span>' + a + '</span><span>' + b + '</span></div>';

/* ===== MODUL: PETA (batch 1) ===== */
// Rentang bulan mengikuti rincian fase di teks: 1-3, 4-12, 13-24, 25-36.
const MONTHS_TOTAL = 36;
const GIZI3 = [['Kalori', '2.000–2.200 kcal'], ['Protein', '150–160 g'], ['Karbohidrat', '220–250 g'], ['Lemak', '60 g'], ['Status', 'Maintenance / recomp (surplus tipis)']];
const KAL3 = 'Kalistenik lanjutan / weighted: strict pull-up (beban tambahan 5–10 kg jika mampu), archer push-up / ring dips, pistol squat, single-leg hip thrust, dragon flag.';
const BIKE3 = '1x sesi VO2 max (4 set × 4 menit keras di Zone 5, ±90–95% detak jantung maksimal, bukan all-out) dan 1x long ride Zone 2 selama 2,5–4 jam.';
const PHASES = [
  {
    id: 1, nama: 'Adaptasi & fat loss', m: [1, 3], bw: '87 → ~78 kg', bwGoal: 78,
    tg: { kcal: 1600, kcalHi: 1700, mode: 'max', protein: 140 },
    gizi: [['Kalori', '1.600–1.700 kcal'], ['Protein', '140 g'], ['Karbohidrat', '130–150 g'], ['Lemak', '50 g'], ['Status', 'Defisit ±500 kcal']],
    fokus: ['Turunkan berat badan dari 87 ke ~78 kg', 'Putus kebiasaan PMO', 'Perbaiki saluran napas (hilangkan ngorok)', 'Hentikan kaki kram', 'Kunci disiplin shalat 5 waktu'],
    kal: 'Kalistenik dasar 3x/pekan (Sen, Rab, Jum, pagi sebelum kerja): push-up, inverted row, squat, glute bridge, plank.',
    bike: 'Zone 2 murni 45–60 menit, 3x/pekan (Sel, Kam, Sab).'
  },
  {
    id: 2, nama: 'Recomposition & aerobic base', m: [4, 12], bw: '~78 → ~71 kg', bwGoal: 71,
    tg: { kcal: 1800, kcalHi: 1900, mode: 'max', protein: 150 },
    gizi: [['Kalori', '1.800–1.900 kcal'], ['Protein', '150 g'], ['Karbohidrat', '180–200 g'], ['Lemak', '55 g'], ['Status', 'Defisit moderat / maintenance']],
    fokus: ['Turunkan berat badan dari ~78 ke ~71 kg', 'Bakar sisa lemak perut', 'Bangun otot rangka', 'Naikkan ketahanan paru-paru dan jantung (VO2 max)'],
    kal: 'Kalistenik menengah 3–4x/pekan (Sen, Sel, Kam, Jum): decline push-up / dips, inverted row kaki elevasi, bulgarian split squat, pike push-up, Copenhagen plank.',
    bike: 'Selasa interval threshold (3 × 8 menit Zone 3/4), Kamis Zone 2 selama 60 menit, Sabtu/Minggu long ride 90–120 menit Zone 2.'
  },
  {
    id: 3, nama: 'Calisthenics mastery & cycling power', m: [13, 24], bw: '~71 → 65–68 kg, lemak tubuh ~12–14%', bwGoal: 68,
    tg: { kcal: 2000, kcalHi: 2200, mode: 'range', protein: 160 }, gizi: GIZI3,
    fokus: ['Bentuk postur lean dan berotot (65–68 kg, lemak tubuh ~12–14%)', 'Kuasai pull-up murni, dips, dan pistol squat', 'Naikkan rasio watt per kilogram (W/kg) di sepeda'],
    kal: KAL3, bike: BIKE3
  },
  {
    id: 4, nama: 'Athletic mastery & peak maintenance', m: [25, 36], bw: 'Pertahankan', bwGoal: null,
    tg: { kcal: 2000, kcalHi: 2200, mode: 'range', protein: 160 }, gizi: GIZI3,
    fokus: ['Pertahankan fisik puncak', 'Stamina sekelas atlet endurance amatur papan atas', 'Kesehatan mental dan spiritual yang stabil'],
    kal: KAL3, bike: BIKE3
  }
];
/* Jadwal per hari (0 = Minggu). Fase 3-4: teks tidak merinci hari, diasumsikan sama dengan Fase 2. */
const SCHED = {
  1: { 1: { kal: 1 }, 2: { bike: 'z2' }, 3: { kal: 1 }, 4: { bike: 'z2' }, 5: { kal: 1 }, 6: { bike: 'z2' }, 0: {} },
  2: { 1: { kal: 1 }, 2: { kal: 1, bike: 'thr' }, 3: {}, 4: { kal: 1, bike: 'z2' }, 5: { kal: 1 }, 6: { bike: 'long' }, 0: {} },
  3: { 1: { kal: 1 }, 2: { kal: 1, bike: 'vo2' }, 3: {}, 4: { kal: 1 }, 5: { kal: 1 }, 6: { bike: 'long' }, 0: {} }
};
SCHED[4] = SCHED[3];
const BIKE_LABEL = { z2: 'Zone 2 murni', thr: 'Interval threshold', long: 'Long ride Zone 2', vo2: 'VO2 max 4 × 4' };

function monthsBetween(a, b) {
  const x = pd(a), y = pd(b);
  let m = (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth());
  if (y.getDate() < x.getDate()) m--;
  return m;
}
const phaseByMonth = m => m <= 3 ? PHASES[0] : m <= 12 ? PHASES[1] : m <= 24 ? PHASES[2] : PHASES[3];
/* posisi dalam perjalanan: null (belum diatur), {before} (belum mulai), atau {days, day, week, month, ph} */
function pos(date) {
  if (!pdb.start) return null;
  const days = diffDays(pdb.start, date);
  if (days < 0) return { before: -days };
  const month = monthsBetween(pdb.start, date) + 1;
  return { days, day: days + 1, week: Math.floor(days / 7) + 1, month, ph: phaseByMonth(month) };
}
function phaseOf(date) { const p = pos(date); return p && p.ph ? p.ph : null; }
/* jadwal hari itu menurut fase aktif; tanpa tanggal mulai dipakai Fase 1 sebagai acuan */
function schedFor(date) { const ph = phaseOf(date) || PHASES[0]; return { ph, s: SCHED[ph.id][pd(date).getDay()] }; }

/* target gizi per hari */
function tgBase(date) { const ph = phaseOf(date) || PHASES[0]; return Object.assign({ water: 3 }, effTg(ph, date)); }
function tgFor(date) {
  const t = tgBase(date);
  if (!(cdb[date] && cdb[date].refeed)) return t;
  // Refeed = makan di tingkat maintenance (±2.000 kcal). Rentang Fase 3-4 (2.000-2.200) sudah setingkat itu, jadi tidak diperketat.
  if (t.kcalHi >= 2000) return Object.assign({}, t, { refeed: true });
  return Object.assign({}, t, { kcal: 2000, kcalHi: 2000, mode: 'max', refeed: true });
}
const kcalOk = (v, t) => t.mode === 'range' ? (v >= t.kcal && v <= t.kcalHi) : v <= t.kcal;
const kcalTgt = t => t.mode === 'range' ? fmt(t.kcal, 0) + '–' + fmt(t.kcalHi, 0) : fmt(t.kcal, 0);
function paintTargets(T) {
  $('#tgKcal').textContent = (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ' kcal' + (T.refeed ? ' (hari refeed)' : '') + (T.adj && !T.refeed ? ' · disesuaikan' : '');
  $('#tgProt').textContent = 'target ' + fmt(T.protein, 0) + ' g';
  $('#tgWater').textContent = 'target min. ' + T.water + ' liter';
}
function meterRange(id, v, lo, hi, unit) {
  const box = $('#m-' + id), bar = $('i', box), txt = $('#t-' + id);
  box.className = 'meter'; txt.className = 'mtxt';
  if (v == null) { bar.style.width = '0%'; txt.textContent = ''; return; }
  bar.style.width = Math.min(v / hi, 1) * 100 + '%';
  if (v > hi) { box.classList.add('bad'); txt.classList.add('bad'); txt.textContent = 'Lebih ' + fmt(v - hi, 0) + ' ' + unit + ' dari rentang'; }
  else if (v >= lo) { box.classList.add('ok'); txt.textContent = 'Dalam rentang'; }
  else txt.textContent = 'Kurang ' + fmt(lo - v, 0) + ' ' + unit + ' ke rentang';
}

/* halaman Peta */
const bwStart = () => num(pdb.bw0) != null ? num(pdb.bw0) : 87;
function latestBw() {
  const ks = Object.keys(wdb).filter(w => num(wdb[w].bw) != null).sort();
  return ks.length ? { w: ks[ks.length - 1], v: num(wdb[ks[ks.length - 1]].bw) } : null;
}
function tlSVG(p) {
  const W = 300, H = 44, y = 14, h = 12, x = m => m / MONTHS_TOTAL * W;
  const cm = Math.min(p.days / 30.4375, MONTHS_TOTAL);
  let s = '<svg class="tlsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Posisi di garis waktu 36 bulan, sekarang Fase ' + p.ph.id + '">';
  PHASES.forEach(ph => {
    const a = ph.m[0] - 1, b = ph.m[1], cls = p.ph.id > ph.id ? 'past' : p.ph.id === ph.id ? 'cur' : 'fut';
    s += '<rect class="' + cls + '" x="' + (x(a) + 1).toFixed(1) + '" y="' + y + '" width="' + (x(b) - x(a) - 2).toFixed(1) + '" height="' + h + '" rx="3"/>';
    s += '<text x="' + ((x(a) + x(b)) / 2).toFixed(1) + '" y="' + (y + h + 12) + '" text-anchor="middle">' + (b - a < 6 ? 'F' + ph.id : 'Fase ' + ph.id) + '</text>';
  });
  return s + '<path class="mk" d="M' + x(cm).toFixed(1) + ' ' + (y - 2) + 'l-4 -8h8z"/></svg>';
}
/* ===== Tahap 53 (Peta, 53a): Peta modern, minimalis, interaktif. Hitungan (pos, energi, proyeksi, penyesuaian) TIDAK diubah; hanya tampilan. Membalik: patch53a.py --reverse ===== */
const PT = { ph: 0, day: -1, sec: {} };   // ph: fase yang dibuka di kartu Fase (0 = ikut fase berjalan); day: hari terpilih di jadwal (-1 = hari ini); sec: status buka kartu lipat
const ptCur = () => { const p = pos(today()); return p && p.ph ? p.ph.id : 0; };   // 0 = belum diatur atau belum mulai
const ptSel = () => PT.ph || ptCur() || 1;
const ptDaySel = () => PT.day >= 0 ? PT.day : pd(today()).getDay();
/* Tahap 54b: kartu fase berjalan = panjang + tanggal mulai/selesai; kartu lain = kecil seragam, hanya "Fase N". Membalik: pakai cadangan 54a (md5 6b96587be0b29102100582da1b9e3412) */
const ptSpan = ph => { if (!pdb.start) return null; const a = pd(pdb.start); a.setMonth(a.getMonth() + ph.m[0] - 1); const b = pd(pdb.start); b.setMonth(b.getMonth() + ph.m[1]); b.setDate(b.getDate() - 1); return [ymd(a), ymd(b)]; };
const ptDt = s => shortDate(s) + ' ' + pd(s).getFullYear();
function ptTrackHTML(p, sel) {   // jalur 4 fase: fase berjalan (atau Fase 1 bila belum mulai) = kartu panjang berisi tanggal + garis progres hijau; fase lain = kartu kecil berukuran sama
  const cur = p && p.ph ? p.ph.id : 0, mo = p && p.ph ? Math.min(p.days / 30.4375, MONTHS_TOTAL) : 0, big = cur || 1;
  return '<div class="pt-track" role="group" aria-label="Empat fase dalam 36 bulan">' + PHASES.map(ph => {
    const a = ph.m[0] - 1, b = ph.m[1], st = !cur ? 'fut' : ph.id < cur ? 'past' : ph.id === cur ? 'cur' : 'fut', on = ph.id === big, sp = on ? ptSpan(ph) : null;
    const frac = st === 'cur' ? Math.max(0, Math.min(1, (mo - a) / (b - a))) : 0;
    const lab = 'Fase ' + ph.id + ', bulan ' + ph.m[0] + ' sampai ' + ph.m[1] + (st === 'cur' ? ', fase sekarang' : st === 'past' ? ', selesai' : '') + (sp ? ', mulai ' + ptDt(sp[0]) + ', selesai ' + ptDt(sp[1]) : '');
    return '<button class="pt-seg ' + st + (on ? ' on' : '') + '" style="--f:' + (frac * 100).toFixed(1) + '%" data-q="ptPh" data-id="' + ph.id + '" aria-pressed="' + (ph.id === sel) + '" aria-label="' + lab + '"><b>Fase ' + ph.id + '</b>' +
      (on ? (sp ? '<small>Mulai ' + esc(ptDt(sp[0])) + '</small><small>Selesai ' + esc(ptDt(sp[1])) + '</small>' : '<small>Bulan ' + ph.m[0] + '–' + ph.m[1] + '</small>') + (st === 'cur' ? '<i class="pt-bar"></i>' : '') : '') + '</button>';
  }).join('') + '</div>';
}
function ptPosHTML() {
  const p = pos(today()), sel = ptSel();
  let h;
  if (!pdb.start) h = '<div class="pt-h1">Belum dimulai</div><p class="pt-sub">Atur tanggal mulai supaya fase, target kalori, dan jadwal latihan mengikuti perjalananmu. Sebelum itu aplikasi memakai Fase 1.</p><div class="pt-acts"><button class="btn primary" data-q="startToday">Mulai hari ini</button><button class="btn" data-q="ptGo" data-sid="start">Pilih tanggal</button></div>';
  else if (p.before) h = '<div class="pt-h1">Mulai ' + esc(shortDate(pdb.start)) + '</div><p class="pt-sub">Perjalanan dimulai ' + esc(dayLong(pdb.start)) + ', ' + p.before + ' hari lagi. Sampai hari itu, target memakai Fase 1.</p>';
  else {
    h = '<div class="pt-h1">' + (p.month > MONTHS_TOTAL ? 'Bulan ' + p.month : 'Bulan ' + p.month + ' dari ' + MONTHS_TOTAL) + '</div><p class="pt-sub">Fase ' + p.ph.id + ' · pekan ' + p.week + ' · hari ke-' + p.day + ' perjalanan</p>';
  }
  return h + ptTrackHTML(p && p.ph ? p : null, sel);
}
function ptBwHTML() {
  const p = pos(today()), ph = (p && p.ph) || PHASES[0], b0 = bwStart(), lb = latestBw();
  if (!lb) return '<div class="pt-bw"><p class="pt-note">Belum ada berat badan di audit mingguan. Isi di Jurnal, tab Mingguan, lalu progres berat muncul di sini. Berat awal ' + fmt(b0, 1) + ' kg.</p></div>';
  const now = lb.v, d = b0 - now;
  let h = '<div class="pt-bwn"><b>' + fmt(now, 1) + '</b><span>kg</span></div><p class="pt-bwt">' + (d >= 0 ? 'Turun ' : 'Naik ') + fmt(Math.abs(d), 1) + ' kg dari ' + fmt(b0, 1) + ' kg · pekan ' + esc(shortDate(lb.w)) + '</p>';
  if (ph.bwGoal == null) return '<div class="pt-bw">' + h + '<p class="pt-note">Fase 4: pertahankan berat badan.</p></div>';
  const G = effGoal(ph), s0 = ph.id === 1 ? b0 : effGoal(PHASES[ph.id - 2]);
  const fr = s0 <= G ? 1 : Math.max(0, Math.min(1, (s0 - now) / (s0 - G)));
  return '<div class="pt-bw">' + h + '<div class="meter' + (fr >= 1 ? ' ok' : '') + '"><i style="width:' + (fr * 100).toFixed(0) + '%"></i></div><div class="mtxt">' + (now <= G ? 'Target Fase ' + ph.id + ' (' + fmt(G, 1) + ' kg) tercapai' : fmt(fr * 100, 0) + '% menuju ' + fmt(G, 1) + ' kg, sisa ' + fmt(now - G, 1) + ' kg') + '</div></div>';
}
function ptPhaseHTML() {
  const cur = ptCur(), id = ptSel(), ph = PHASES[id - 1];
  const st = !cur ? '' : id < cur ? 'done' : id === cur ? 'cur' : '', stT = !cur ? '' : id < cur ? 'selesai' : id === cur ? 'sedang berjalan' : 'belum mulai';
  const li = a => '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  return '<div class="pt-pc"><div class="pt-phh"><div><b>Fase ' + ph.id + ': ' + esc(ph.nama) + '</b><small>Bulan ' + ph.m[0] + '–' + ph.m[1] + ' · berat ' + esc(ph.bw) + '</small></div>' + (stT ? '<span class="pt-st ' + st + '">' + stT + '</span>' : '') + '</div>' +
    '<div class="pt-gz">' + ph.gizi.map(g => '<div><small>' + esc(g[0]) + '</small><b>' + esc(g[1]) + '</b></div>').join('') + '</div>' + adjPhNote(ph) +
    '<h4>Fokus</h4>' + li(ph.fokus) + '<h4>Latihan kalistenik</h4><p>' + esc(ph.kal) + '</p><h4>Sepeda</h4><p>' + esc(ph.bike) + '</p>' + ptDetHTML(ph, cur) + '</div>';
}
function ptDayText(s, d) {
  const parts = [];
  if (s.kal) parts.push('Kalistenik');
  if (s.bike) parts.push('Sepeda: ' + BIKE_LABEL[s.bike]);
  if (!parts.length) parts.push('Istirahat');
  if (d === 0) parts.push('Audit mingguan');
  return parts.join(' + ');
}
function ptDayDetail() {
  const cur = ptCur(), id = ptSel(), d = ptDaySel(), isNow = cur ? id === cur : id === 1;
  return '<b>' + HARI[d] + (isNow && d === pd(today()).getDay() ? ' · hari ini' : '') + '</b><span>' + esc(ptDayText(SCHED[id][d], d)) + '</span>';
}
function ptSchedHTML() {
  const cur = ptCur(), id = ptSel(), ph = PHASES[id - 1], sc = SCHED[id], dnow = pd(today()).getDay(), dsel = ptDaySel(), isNow = cur ? id === cur : id === 1;
  const strip = [1, 2, 3, 4, 5, 6, 0].map(d => {
    const s = sc[d];
    return '<button class="pt-d' + (isNow && d === dnow ? ' today' : '') + '" data-q="ptDay" data-d="' + d + '" aria-pressed="' + (d === dsel) + '" aria-label="' + HARI[d] + ': ' + esc(ptDayText(s, d)) + (isNow && d === dnow ? ' (hari ini)' : '') + '"><span>' + HARI[d].slice(0, 3) + '</span><em class="pt-mk">' + (s.kal ? '<i class="k"></i>' : '') + (s.bike ? '<i class="b"></i>' : '') + '</em></button>';
  }).join('');
  const note = !cur ? 'Jadwal ini contoh. Jadwal fase aktif muncul setelah tanggal mulai tiba.' : id !== cur ? 'Ini jadwal Fase ' + id + ', bukan fase yang sedang berjalan (Fase ' + cur + ').' : '';
  return '<div class="pt-wkc"><div class="pt-wkh"><b>Jadwal pekan Fase ' + id + '</b><small>' + esc(ph.nama) + '</small></div><div class="pt-wk" role="group" aria-label="Pilih hari">' + strip + '</div>' +
    '<div class="pt-wkd" id="ptWkd" aria-live="polite">' + ptDayDetail() + '</div><div class="pt-leg"><span><i class="k"></i>Kalistenik</span><span><i class="b"></i>Sepeda</span></div>' + (note ? '<p class="pt-note">' + esc(note) + '</p>' : '') + '</div>';
}
function ptSums() {   // satu baris ringkasan di tiap kartu lipat; galat apa pun jatuh ke teks bawaan, tidak mengganggu halaman
  const put = (id, fn, fb) => { let t; try { t = fn(); } catch (e) { t = ''; } t = t || fb; const el = $('#ptS_' + id); if (el && el.textContent !== t) el.textContent = t; };
  put('start', () => pdb.start ? 'Mulai ' + shortDate(pdb.start) + ' · ' + (pdb.opt === 'gym' ? 'di gym' : 'di rumah') + ' · berat awal ' + fmt(bwStart(), 1) + ' kg' : 'Belum diatur, Fase 1 jadi acuan', 'Tanggal mulai, berat awal, tempat latihan');
  put('prof', () => {
    const st = pfState();
    if (st.st === 'empty') return 'Isi tinggi, usia, dan jenis kelamin';
    if (st.st === 'partial') return 'Lengkapi ' + st.miss.join(', ');
    if (st.st === 'range') return 'Di luar rentang rumus BMR';
    const p = pos(today()), ph = (p && p.ph) || PHASES[0], lb = latestBw(), kg = lb && kgOk(lb.v) ? lb.v : bwStart();
    if (!kgOk(kg)) return 'Berat badan awal tidak masuk akal';
    const c = calcEnergy(st, kg, ph);
    return 'TDEE ' + fmt(r10(c.tdee[0]), 0) + '–' + fmt(r10(c.tdee[1]), 0) + ' kcal · ' + defTxt(c.def[0], c.def[1]);
  }, 'Tinggi, usia, jenis kelamin, BMR dan TDEE');
  put('proj', () => {
    const p = pos(today()), ph = (p && p.ph) || PHASES[0], pr = trProject(ph);
    if (pr.st === 'hold') return 'Fase ' + ph.id + ': pertahankan berat';
    if (pr.st === 'few') return 'Butuh ' + TR_MIN + ' pekan berisi berat (sekarang ' + pr.cnt + ')';
    if (pr.st === 'done') return 'Target Fase ' + ph.id + ' tercapai menurut tren';
    if (pr.st === 'flat') return 'Berat belum turun pada garis tren';
    return 'Target Fase ' + ph.id + ' sekitar ' + dY(pr.date);
  }, 'Proyeksi target dan milestone fase');
  put('adj', () => {
    const ev = adjEval(), A = adjd(), m = { auto: 'Otomatis', ask: 'Tanya dulu', off: 'Mati' }[A.mode] || 'Otomatis';
    return ev.st === 'prop' ? 'Ada saran: ' + ev.prop.title : 'Mode ' + m + ' · belum ada saran baru';
  }, 'Saran penyesuaian batas kalori dan target berat');
}
function ptFold() {   // dipanggil saat Peta dibuka: terapkan status buka kartu; Mulai perjalanan terbuka sendiri bila tanggal mulai belum diatur
  $$('#v-roadmap [data-pt]').forEach(c => {
    const id = c.dataset.pt, open = id in PT.sec ? !!PT.sec[id] : (id === 'start' && !pdb.start), b = $('.pt-xh', c);
    c.classList.toggle('open', open);
    if (b) b.setAttribute('aria-expanded', String(open));
  });
}
function ptOpen(id, scroll) {   // buka satu kartu tanpa animasi (supaya gulir ke isinya tepat), lalu gulir bila diminta
  const c = $('#v-roadmap [data-pt="' + id + '"]'), v = $('#v-roadmap'); if (!c || !v) return;
  PT.sec[id] = true; v.classList.add('pt-noa'); c.classList.add('open');
  const b = $('.pt-xh', c); if (b) b.setAttribute('aria-expanded', 'true');
  void c.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove('pt-noa')));
  if (scroll && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
QACT.ptSec = el => {
  const c = el.closest('[data-pt]'); if (!c) return;
  const open = !c.classList.contains('open');
  PT.sec[c.dataset.pt] = open; c.classList.toggle('open', open); el.setAttribute('aria-expanded', String(open));
};
QACT.ptGo = el => ptOpen(el.dataset.sid, true);
QACT.ptPh = el => {
  const id = +el.dataset.id; if (!(id >= 1 && id <= 4)) return;
  PT.det = ptSel() === id ? !PT.det : true; PT.ph = id;
  $$('#rmPos .pt-seg').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.id === id)));
  $('#rmPhases').innerHTML = ptPhaseHTML(); $('#rmSched').innerHTML = ptSchedHTML();
  if (PT.det) { const c = $('#rmPhases'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); }
};
/* ===== Tahap 54 (Peta, 54a): detail lengkap fase (ketuk segmen fase / tombol). Hanya MEMBACA PHASES, SCHED, pdb, wdb; tidak menulis. Membalik: pakai cadangan 53c (md5 de9996359f17dfb56977d25a77113544) ===== */
function ptDetHTML(ph, cur) {
  const id = ph.id, open = !!PT.det, mo = ph.m[1] - ph.m[0] + 1, isCur = cur === id;
  const row = (k, v) => '<div class="pt-dr"><small>' + esc(k) + '</small><b>' + v + '</b></div>';
  let r = row('Durasi', 'Bulan ' + ph.m[0] + '–' + ph.m[1] + ' · ' + mo + ' bulan (±' + Math.round(mo * 4.345) + ' pekan)'), pr = '';
  if (pdb.start) {
    const a = pd(pdb.start); a.setMonth(a.getMonth() + ph.m[0] - 1);
    const b = pd(pdb.start); b.setMonth(b.getMonth() + ph.m[1]); b.setDate(b.getDate() - 1);
    const sa = ymd(a), sb = ymd(b);
    r += row('Tanggal', esc(shortDate(sa) + ' ' + a.getFullYear() + ' – ' + shortDate(sb) + ' ' + b.getFullYear()));
    if (isCur) {
      const tot = diffDays(sa, sb) + 1, n = Math.max(1, Math.min(tot, diffDays(sa, today()) + 1)), f = n / tot;
      pr = '<div class="pt-dp"><div class="pt-dl" role="img" aria-label="Progres Fase ' + id + ' ' + Math.round(f * 100) + ' persen"><i style="width:' + (f * 100).toFixed(1) + '%"></i></div><small>Hari ke-' + n + ' dari ' + tot + ' (' + Math.round(f * 100) + '%) · sisa ' + (tot - n) + ' hari</small></div>';
    }
  }
  const lb = latestBw(), goal = ph.bwGoal == null ? null : effGoal(ph);
  r += row('Berat', esc(ph.bw) + (goal != null ? ' (target ' + fmt(goal, 1) + ' kg)' : ''));
  if (isCur && lb && goal != null) r += row('Berat sekarang', fmt(lb.v, 1) + ' kg · ' + (lb.v <= goal ? 'target tercapai' : 'sisa ' + fmt(lb.v - goal, 1) + ' kg'));
  r += row('Kalori', (ph.tg.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(ph.tg) + ' kcal') + row('Protein', 'target ' + fmt(ph.tg.protein, 0) + ' g') + row('Air', 'min. 3 liter');
  const sc = SCHED[id], days = [1, 2, 3, 4, 5, 6, 0];
  const nK = days.filter(d => sc[d].kal).length, nB = days.filter(d => sc[d].bike).length;
  const wk = days.map(d => '<li><b>' + HARI[d].slice(0, 3) + '</b><span>' + esc(ptDayText(sc[d], d)) + '</span></li>').join('');
  const k = ph.kal.indexOf(': '), mv = k > 0 ? ph.kal.slice(k + 2).replace(/\.$/, '').split(', ') : [];
  const nx = id < 4 ? PHASES[id] : null;
  return '<button type="button" class="btn ghost sm pt-detb" id="ptDetBtn" data-q="ptDet" aria-expanded="' + open + '" aria-controls="ptDet">' + (open ? 'Sembunyikan detail' : 'Detail lengkap Fase ' + id) + '</button>' +
    '<div id="ptDet" class="pt-det"' + (open ? '' : ' hidden') + '>' + pr + '<div class="pt-drs">' + r + '</div>' +
    '<h4>Jadwal per hari (' + nK + ' kalistenik, ' + nB + ' sepeda per pekan)</h4><ul class="pt-dw">' + wk + '</ul>' +
    (mv.length ? '<h4>Gerakan kalistenik</h4><p>' + esc(ph.kal.slice(0, k)) + '</p><ul>' + mv.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
    (nx ? '<h4>Sesudahnya</h4><p>Fase ' + nx.id + ': ' + esc(nx.nama) + ' (bulan ' + nx.m[0] + '–' + nx.m[1] + ', berat ' + esc(nx.bw) + ').</p>' : '') + '</div>';
}
QACT.ptDet = () => {
  PT.det = !PT.det; $('#rmPhases').innerHTML = ptPhaseHTML();
  const b = $('#ptDetBtn'); if (b) b.focus();
};
QACT.ptDay = el => {
  const d = +el.dataset.d; if (!(d >= 0 && d <= 6)) return;
  PT.day = d;
  $$('#rmSched .pt-d').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.d === d)));
  const w = $('#ptWkd'); if (w) w.innerHTML = ptDayDetail();
};
function rmDynamic() {
  $('#rmPos').innerHTML = ptPosHTML();
  $('#rmBw').innerHTML = ptBwHTML();
  $('#rmEnergy').innerHTML = rmEnergyHTML();
  $('#rmProj').innerHTML = rmProjHTML();
  $('#rmAdj').innerHTML = rmAdjHTML();
  $('#rmSched').innerHTML = ptSchedHTML();
  $('#rmPhases').innerHTML = ptPhaseHTML();
  ptSums();
}
function rmPopulate() {
  $$('[data-pk]').forEach(el => { el.value = pdb[el.dataset.pk] == null ? '' : pdb[el.dataset.pk]; });
  paintP();
  pfPopulate();
}
RENDER.roadmap = () => { rmPopulate(); rmDynamic(); ptFold(); };
QACT.startToday = () => { setP({ start: today() }); rmPopulate(); toast('Perjalanan dimulai hari ini'); };
QACT.startClear = () => { setP({ start: '' }); rmPopulate(); toast('Tanggal mulai dihapus'); };

