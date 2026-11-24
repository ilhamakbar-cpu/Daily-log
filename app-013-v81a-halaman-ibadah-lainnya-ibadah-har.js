/* ===== v81a: halaman Ibadah (Lainnya > Ibadah): Hari ini (jadwal shalat, hitung mundur, kiblat, hijriah, progres) + Pelacak ibadah. Membalik: patch81a.py --reverse ===== */
// Jadwal shalat memakai mesin Kemenag yang sudah ada (hxDay/hxNext + lokasi di ldb). Shalat 5 waktu dibaca/ditulis di data Jurnal (db[..].sh) supaya satu sumber.
// Amalan sunnah + pengaturan disimpan di kunci baru dailylog:ibadah:v1 (STORES.ibx) dan ikut cadangan JSON (kunci `ibadah`).
const IBX_KEY = 'dailylog:ibadah:v1';
const IBX_ITEMS = [
  { id: 'tahajud', t: 'Tahajud', s: 'Sepertiga malam terakhir' },
  { id: 'dhuha', t: 'Dhuha', s: 'Sesudah matahari naik' },
  { id: 'rawatib', t: 'Shalat rawatib', s: 'Sunnah sebelum dan sesudah shalat wajib' },
  { id: 'witir', t: 'Witir', s: 'Penutup shalat malam' },
  { id: 'puasa', t: 'Puasa sunnah', s: 'Senin-Kamis, Ayyamul Bidh, dan lain-lain' },
  { id: 'sedekah', t: 'Sedekah', s: 'Sekecil apa pun' },
  { id: 'tilawah', t: 'Tilawah Al-Qur\'an', s: 'Membaca walau sedikit' },
  { id: 'dzpagi', t: 'Dzikir pagi', s: 'Sesudah Subuh' },
  { id: 'dzpetang', t: 'Dzikir petang', s: 'Sesudah Ashar' },
  { id: 'kahfi', t: 'Surah Al-Kahfi', s: 'Khusus hari Jumat', wd: 5 }
];
const IBX_HM = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban', 'Ramadhan', 'Syawal', 'Dzulkaidah', 'Dzulhijjah'];
const IBX_KAABA = [21.4225, 39.8262];
const ibxBlank = () => ({ v: 1, days: {}, pref: { hide: [], hadj: 0, hmg: true, ar: 2, lat: true, vib: true, fav: [], tsb: { k: 'bebas', n: 0, t: 33, ph: 0, tot: {} }, qr: { lat: true, tr: true, q: '05', mode: 'ayat', spd: 1, rep: false, last: null, bm: [] }, kj: { it: [], qs: [], rd: [] }, rm: { on: ['sepertiga', 'kahfi', 'sk', 'bidh', 'besar', 'kajian'], lead: 10, kahfiAt: '07:00', skAt: '19:30', last: 0 } }, u: 0 });
let ibdb = ibxBlank();
function ibxClean(raw) {
  const b = ibxBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const ids = IBX_ITEMS.map(i => i.id);
  const dr = raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  Object.keys(dr).forEach(d => {
    if (!DATE_RE.test(d)) return;
    const x = dr[d];
    if (!x || typeof x !== 'object' || Array.isArray(x)) return;
    const c = Array.isArray(x.c) ? Array.from(new Set(x.c.filter(v => typeof v === 'string' && ids.includes(v)))) : [];
    const u = Number(x.u);
    b.days[d] = { c, u: Number.isFinite(u) && u > 0 ? u : 0 };
    if (typeof ibxCleanSn === 'function') ibxCleanSn(x, b.days[d]);   // IB2-B2b1: sunnah yang diamalkan
  });
  const ks = Object.keys(b.days).sort();
  if (ks.length > 2000) ks.slice(0, ks.length - 2000).forEach(k => { delete b.days[k]; });
  const p = raw.pref && typeof raw.pref === 'object' && !Array.isArray(raw.pref) ? raw.pref : {};
  b.pref.hide = Array.isArray(p.hide) ? Array.from(new Set(p.hide.filter(v => typeof v === 'string' && ids.includes(v)))) : [];
  b.pref.hadj = Number.isInteger(p.hadj) && Math.abs(p.hadj) <= 2 ? p.hadj : 0;
  b.pref.hmg = p.hmg !== false;
  ibxCleanPref2(p, b);   // v81b
  ibxCleanPref3(p, b);   // v81c
  if (typeof ibxCleanPref4 === 'function') ibxCleanPref4(p, b);   // v81d
  if (typeof ibxCleanPref5 === 'function') ibxCleanPref5(p, b);   // v81d3
  if (typeof ibxCleanPref6 === 'function') ibxCleanPref6(p, b);   // v81e
  const u = Number(raw.u);
  b.u = Number.isFinite(u) && u > 0 ? u : 0;
  return b;
}
STORES.ibx = { key: IBX_KEY, get: () => ibdb }; dirty.ibx = false;   // ikut ekspor JSON versi 4 (kunci `ibadah`)
const ibxSave = () => { ibdb.u = Date.now(); queueSave('ibx'); };
const ibxHasData = () => Object.keys(ibdb.days).some(d => ibdb.days[d].c.length > 0);

/* ---------- tanggal hijriah (Umm al-Qura lewat Intl; hitungan sipil bila Intl tidak punya kalendernya) ---------- */
let ibxFmt;
function ibxHijriCivil(y, m, d) {   // kalender hijriah sipil/tabular (algoritma Kuwait) dari tanggal Masehi
  const jd = Math.floor(hxJD(y, m, d) + 0.5);
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m2 = Math.floor((24 * l) / 709);
  return { y: 30 * n + j - 30, m: m2, d: l - Math.floor((709 * m2) / 24) };
}
function ibxHijriRaw(y, m, d) {
  if (ibxFmt === undefined) { try { ibxFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch (e) { ibxFmt = null; } }
  const c = ibxHijriCivil(y, m, d);
  if (ibxFmt) {
    try {
      const o = {};
      ibxFmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 12))).forEach(p => { if (p.type === 'day' || p.type === 'month' || p.type === 'year') o[p.type] = parseInt(p.value, 10); });
      const ord = h => h.y * 354.367 + (h.m - 1) * 29.53 + h.d, u = { y: o.year, m: o.month, d: o.day };
      if (u.d >= 1 && u.d <= 30 && u.m >= 1 && u.m <= 12 && u.y >= 1300 && Math.abs(ord(u) - ord(c)) < 3.5) return { y: u.y, m: u.m, d: u.d, src: 'uq' };
    } catch (e) { /* pakai hitungan sipil */ }
  }
  return { y: c.y, m: c.m, d: c.d, src: 'sipil' };
}
// tanggal kalender 'YYYY-MM-DD' (+ koreksi hari dari pengaturan, + 1 hari bila 'malam' = sudah lewat Maghrib) -> {y,m,d,name,txt}
function ibxHij(s, plus) {
  const q = pd(s);
  q.setDate(q.getDate() + (ibdb.pref.hadj || 0) + (plus || 0));
  const h = ibxHijriRaw(q.getFullYear(), q.getMonth() + 1, q.getDate());
  return Object.assign(h, { name: IBX_HM[h.m - 1], txt: h.d + ' ' + IBX_HM[h.m - 1] + ' ' + h.y + ' H' });
}
function ibxAfterMaghrib(now) {
  if (!ibdb.pref.hmg || !hxHas()) return false;
  try {
    const p = hxParts(now, ldb), day = hxDay(p.y, p.m, p.d, ldb), mg = day.items[4];
    return !!mg && mg.at != null && now >= mg.at;
  } catch (e) { return false; }
}
const ibxHijNow = now => ibxHij(ymd(new Date(now)), ibxAfterMaghrib(now) ? 1 : 0);

/* ---------- kiblat ---------- */
function ibxQibla(lat, lon) {   // arah awal lingkaran besar ke Ka'bah, derajat dari utara sejati searah jarum jam
  const f1 = hxRad(lat), f2 = hxRad(IBX_KAABA[0]), dl = hxRad(IBX_KAABA[1] - lon);
  const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return hxMod(hxDeg(Math.atan2(y, x)), 360);
}
function ibxDist(lat, lon) {   // jarak lingkaran besar ke Ka'bah (km), haversine
  const f1 = hxRad(lat), f2 = hxRad(IBX_KAABA[0]), dp = f2 - f1, dl = hxRad(IBX_KAABA[1] - lon);
  const a = Math.sin(dp / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}
const ibxDir = deg => ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'][Math.round(hxMod(deg, 360) / 45) % 8];
function ibxHeading(ev) {   // arah atas HP dari utara (derajat) atau null bila peristiwa tidak mutlak
  if (!ev) return null;
  if (typeof ev.webkitCompassHeading === 'number' && Number.isFinite(ev.webkitCompassHeading)) return hxMod(ev.webkitCompassHeading, 360);
  if (!(ev.absolute === true || ev.type === 'deviceorientationabsolute') || typeof ev.alpha !== 'number' || !Number.isFinite(ev.alpha)) return null;
  const be = typeof ev.beta === 'number' && Number.isFinite(ev.beta) ? ev.beta : 0, ga = typeof ev.gamma === 'number' && Number.isFinite(ev.gamma) ? ev.gamma : 0;
  if (Math.abs(be) < 35 && Math.abs(ga) < 35) return hxMod(360 - ev.alpha, 360);   // HP mendatar: arah atas HP
  const a = hxRad(ev.alpha), b = hxRad(be), g = hxRad(ga);   // HP tegak: arah punggung HP (contoh W3C)
  const rA = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g), rB = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g);
  let h = Math.atan(rA / rB);
  if (rB < 0) h += Math.PI; else if (rA < 0) h += 2 * Math.PI;
  return Number.isFinite(h) ? hxMod(hxDeg(h), 360) : null;
}
let ibxCmp = { on: false, h: null, fn: null, hit: false, t: 0 };
const ibxAngDiff = (a, b) => ((a - b + 540) % 360) - 180;   // a - b dinormalkan ke -180..180: positif = a searah jarum jam dari b
function ibxCompassStop() {
  if (ibxCmp.fn) { removeEventListener('deviceorientationabsolute', ibxCmp.fn, true); removeEventListener('deviceorientation', ibxCmp.fn, true); }
  ibxCmp = { on: false, h: null, fn: null, hit: false, t: 0 };
}
async function ibxCompassStart() {
  const D = window.DeviceOrientationEvent;
  if (!D) { toast('Peramban ini tidak punya sensor arah'); return; }
  try {
    if (typeof D.requestPermission === 'function') { const r = await D.requestPermission(); if (r !== 'granted') { toast('Izin sensor arah ditolak'); return; } }
  } catch (e) { toast('Izin sensor arah tidak bisa diminta'); return; }
  ibxCompassStop();
  const fn = ev => {
    const h = ibxHeading(ev);
    if (h == null) return;
    ibxCmp.h = h; ibxCmp.t = Date.now();
    ibxCompassPaint();
  };
  ibxCmp = { on: true, h: null, fn, hit: false, t: 0 };
  addEventListener('deviceorientationabsolute', fn, true);
  addEventListener('deviceorientation', fn, true);
  ibxRender();
  setTimeout(() => { if (ibxCmp.on && ibxCmp.h == null) { const s = $('#ibxQs'); if (s) s.textContent = 'Sensor belum mengirim arah. Gerakkan HP membentuk angka 8, lalu coba lagi.'; } }, 2500);
}
function ibxCompassPaint() {
  const rose = $('#ibxRose'), s = $('#ibxQs'), dial = $('#ibxDial');
  if (!rose || !s || !hxHas()) return;
  const q = ibxQibla(ldb.lat, ldb.lon), h = ibxCmp.h;
  if (h == null) { rose.style.transform = 'rotate(0deg)'; return; }
  rose.style.transform = 'rotate(' + (-h).toFixed(1) + 'deg)';
  const df = ibxAngDiff(q, h), hit = Math.abs(df) <= 4;
  if (hit && !ibxCmp.hit && navigator.vibrate) { try { navigator.vibrate(30); } catch (e) { /* abaikan */ } }
  ibxCmp.hit = hit;
  if (dial) dial.classList.toggle('hit', hit);
  s.className = 'ibx-qs' + (hit ? ' hit' : '');
  s.textContent = hit ? 'Menghadap kiblat' : 'Arah HP ' + Math.round(h) + '°. Putar ' + Math.abs(Math.round(df)) + '° ke ' + (df > 0 ? 'kanan' : 'kiri') + '.';
}

/* ---------- data harian + skor ---------- */
const ibxHidden = id => ibdb.pref.hide.includes(id);
const ibxApplic = d => IBX_ITEMS.filter(i => !ibxHidden(i.id) && (i.wd == null || pd(d).getDay() === i.wd));
const ibxHas = (d, id) => { const x = ibdb.days[d]; return !!x && x.c.includes(id); };
function ibxToggle(d, id) {
  if (!DATE_RE.test(d) || !IBX_ITEMS.some(i => i.id === id)) return;
  const x = ibdb.days[d] || (ibdb.days[d] = { c: [], u: 0 });
  const i = x.c.indexOf(id);
  if (i >= 0) x.c.splice(i, 1); else x.c.push(id);
  x.u = Date.now();
  ibxSave();
}
function ibxScore(d) {
  const k = ibDay(d), cnt = n => k.filter(x => x === n).length;
  const ap = ibxApplic(d), done = ap.filter(i => ibxHas(d, i.id)).length, tepat = cnt('tepat');
  const any = k.some(x => x !== 'none') || done > 0;
  return { tepat, telat: cnt('telat'), tidak: cnt('tidak'), none: cnt('none'), ap: ap.length, done, total: 5 + ap.length, got: tepat + done, any, pct: (tepat + done) / (5 + ap.length) };
}
function ibxStreakSunnah() {
  const has = d => { const x = ibdb.days[d]; return !!x && x.c.some(id => !ibxHidden(id)); };
  let d = today(), n = 0;
  if (!has(d)) d = addDays(d, -1);
  while (n < 800 && has(d)) { n++; d = addDays(d, -1); }
  return n;
}
function ibxSetSh(d, p, v) {   // tulis ke data Jurnal (sh) untuk tanggal d; pilihan yang sama diketuk lagi = hapus
  if (!DATE_RE.test(d) || !PRAYERS.includes(p) || !['tepat', 'telat', 'tidak'].includes(v)) return;
  const e = db[d] || (db[d] = blank());
  const m = Object.assign({}, shView(e));
  if (!shHas(e) && d === today() && hxHas()) {   // data lama dikonversi: waktu yang belum masuk tidak ikut dianggap tepat waktu
    const q = d.split('-').map(Number), day = hxDay(q[0], q[1], q[2], ldb);
    PRAYERS.forEach(x => { const it = day.items.find(i => i.five && i.name === x); if (x !== p && it && it.at != null && it.at > Date.now()) delete m[x]; });
  }
  const cur0 = m[p] || {}, same = (v === 'tidak' && cur0.d === 'tidak') || (v !== 'tidak' && cur0.d === 'ya' && cur0.t === v);
  const s = Object.assign({ d: null, t: null, r: '' }, cur0);
  if (same) { s.d = null; s.t = null; s.r = ''; }
  else if (v === 'tidak') { s.d = 'tidak'; s.t = null; }
  else { s.d = 'ya'; s.t = v; if (v === 'tepat') s.r = ''; }
  if (s.d == null) delete m[p]; else m[p] = s;
  const dv = shDerive(m);
  Object.assign(e, { sh: m, shalat: dv.shalat, missed: dv.missed, shalatNote: dv.shalatNote });
  e.updated = Date.now();
  queueSave();
  if (d === cur) { try { paintControls(); derived(); } catch (x) { /* Jurnal belum siap */ } }
}

/* ---------- status tampilan ---------- */
const IBX_TABS = [['hari', 'Hari ini'], ['lacak', 'Pelacak'], ['doa', 'Doa & dzikir'], ['shalat', 'Shalat'], ['sunnah', 'Sunnah'], ['tasbih', 'Tasbih'], ['quran', 'Al-Qur\'an'], ['kal', 'Kalender'], ['kajian', 'Kajian'], ['ingat', 'Pengingat']];
const IBX_PANEL = {};    // id -> fungsi(now) penghasil HTML; tahap berikutnya mengisi
const IBX_READY = { hari: true, lacak: true };
let ibxTab = 'hari', ibxDate = today(), ibxRange = 7, ibxSetOpen = false, ibxNextAt = 0, ibxCdAt = 0;
const IBX_CHK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ibxFmtKm = n => fmt(Math.round(n / 10) * 10, 0);
function ibxFresh() { ibxTab = 'hari'; ibxDate = today(); ibxSetOpen = false; ibxCompassStop(); if (IBX_FRESH) IBX_FRESH.forEach(f => { try { f(); } catch (e) { /* abaikan */ } }); }
const IBX_FRESH = [];

/* ---------- Hari ini ---------- */
function ibxHint(s0) {   // butir "hari ini / besok" dari tanggal kalender s0: sunnah mingguan + Ayyamul Bidh
  const out = [];
  for (let i = 0; i <= 1; i++) {
    const d = addDays(s0, i), wd = pd(d).getDay(), when = i === 0 ? 'Hari ini' : 'Besok', h = ibxHij(d);
    if (wd === 1 || wd === 4) out.push([when, 'Puasa sunnah ' + HARI[wd]]);
    if (wd === 5) out.push([when, 'Jumat: Al-Kahfi, perbanyak shalawat']);
    if (h.d >= 13 && h.d <= 15 && h.m !== 12 && h.m !== 9) out.push([when, 'Ayyamul Bidh (' + h.d + ' ' + h.name + '): puasa sunnah']);
  }
  return out;
}
function ibxHero(now) {
  const t = today(), hj = ibxHijNow(now);
  let h = '<section class="ibx-hero" aria-label="Jadwal shalat"><div class="ibx-dt"><b>' + esc(hj.txt) + '</b><span>' + esc(dayLong(t)) + '</span></div>';
  ibxNextAt = 0; ibxCdAt = 0;
  if (!hxHas()) return h + '<div class="ibx-noloc"><p>Atur lokasi untuk melihat jadwal shalat dan arah kiblat.</p><button class="ibx-btn" data-q="hxLoc" data-fk="loc">Atur lokasi</button></div></section>';
  const r = hxNext(now, ldb);
  if (!r) return h + '<div class="ibx-noloc"><p>Jadwal shalat tidak bisa dihitung di lokasi ini (matahari tidak mencapai sudut Subuh atau Isya). Coba pilih kota lain.</p><button class="ibx-btn" data-q="hxLoc" data-fk="loc">Ganti lokasi</button></div></section>';
  const nx = r.next, tz = r.day.tz, dev = -new Date(now).getTimezoneOffset() / 60;
  const p = hxParts(now, ldb), td = hxDay(p.y, p.m, p.d, ldb), st = ibDay(t);
  ibxCdAt = nx.at;
  const cand = td.items.map(i => i.at).concat(r.day.items.map(i => i.at)).filter(x => x != null && x > now);
  cand.push(Date.UTC(p.y, p.m - 1, p.d + 1) - td.tz * 3600000);
  ibxNextAt = Math.min.apply(null, cand);
  const zone = tz !== dev ? '<small>' + hxTzName(tz) + '</small>' : '';
  h += '<div class="ibx-nx"><div><small>Shalat berikutnya' + (r.tomorrow ? ' (besok)' : '') + '</small><b>' + nx.name + '</b></div><div class="ibx-tm">' + hxHM(nx.at, tz) + zone + '</div></div><p class="ibx-cd" id="ibxCd">dalam ' + hxLeft(nx.at - now) + '</p>';
  h += '<ul class="ibx-ti" aria-label="Waktu shalat hari ini">' + td.items.filter(i => i.five).map(i => {
    const k = st[PRAYERS.indexOf(i.name)], isNx = !r.tomorrow && i.id === nx.id;
    const lab = { tepat: 'tepat waktu', telat: 'telat', tidak: 'tidak shalat', none: 'belum dicatat' }[k];
    return '<li class="' + (i.at != null && i.at <= now ? 'past' : '') + (isNx ? ' next' : '') + '" data-k="' + k + '" aria-label="' + i.name + ' ' + (i.at == null ? '' : hxHM(i.at, td.tz)) + ', ' + lab + '"><span>' + i.name + '</span><b>' + (i.at == null ? '–' : hxHM(i.at, td.tz)) + '</b><i></i></li>';
  }).join('') + '</ul>';
  const sr = td.items[1];
  h += '<div class="ibx-hf"><span>' + (sr && sr.at != null ? 'Terbit ' + hxHM(sr.at, td.tz) + ' · ' : '') + 'Kemenag RI</span><button data-q="hxLoc" data-fk="loc" aria-label="Lokasi: ' + esc(ldb.name) + '. Ketuk untuk mengubah">' + HX_PIN + esc(ldb.name) + '</button></div></section>';
  return h;
}
function ibxRing(pct, label) {
  const R = 34, C = 2 * Math.PI * R, off = C * (1 - Math.max(0, Math.min(1, pct)));
  return '<svg class="ibx-ring" viewBox="0 0 84 84" role="img" aria-label="' + esc(label) + '"><circle class="bg" cx="42" cy="42" r="' + R + '"/><circle class="fg" cx="42" cy="42" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 42 42)"/><text x="42" y="42">' + Math.round(pct * 100) + '%</text></svg>';
}
function ibxProgress() {
  const sc = ibxScore(today());
  const lab = sc.got + ' dari ' + sc.total + ' amalan hari ini';
  return '<section class="ibx-card"><h3>Progres ibadah hari ini</h3><div class="ibx-pg">' + ibxRing(sc.pct, lab) + '<div class="ibx-pgt"><b>' + sc.got + ' dari ' + sc.total + ' amalan</b><span>Shalat tepat waktu ' + sc.tepat + '/5 · Sunnah ' + sc.done + '/' + sc.ap + '</span><button class="ibx-lnk" data-q="ibxTab" data-v="lacak" data-fk="tolacak">Isi pelacak &rsaquo;</button></div></div></section>';
}
function ibxQiblaCard() {
  if (!hxHas()) return '<section class="ibx-card"><h3>Arah kiblat</h3><p class="ibx-sub">Atur lokasi dulu supaya arah kiblat bisa dihitung.</p><button class="ibx-btn fill" data-q="hxLoc" data-fk="loc2">Atur lokasi</button></section>';
  const q = ibxQibla(ldb.lat, ldb.lon), km = ibxDist(ldb.lat, ldb.lon);
  const R = 82, tk = [];
  for (let a = 0; a < 360; a += 15) { const r1 = a % 90 === 0 ? 70 : a % 45 === 0 ? 74 : 77, x1 = Math.sin(hxRad(a)), y1 = -Math.cos(hxRad(a)); tk.push('<line class="tk" x1="' + (x1 * r1).toFixed(1) + '" y1="' + (y1 * r1).toFixed(1) + '" x2="' + (x1 * R).toFixed(1) + '" y2="' + (y1 * R).toFixed(1) + '"/>'); }
  const lb = [['U', 0, 'nn'], ['T', 90, ''], ['S', 180, ''], ['B', 270, '']].map(([c, a, k]) => '<text class="' + k + '" x="' + (Math.sin(hxRad(a)) * 58).toFixed(1) + '" y="' + (-Math.cos(hxRad(a)) * 58).toFixed(1) + '">' + c + '</text>').join('');
  const kx = Math.sin(hxRad(q)), ky = -Math.cos(hxRad(q));
  const kaaba = '<g transform="translate(' + (kx * 44).toFixed(1) + ' ' + (ky * 44).toFixed(1) + ')"><g transform="rotate(' + (-q).toFixed(1) + ')"><rect class="ka" x="-9" y="-9" width="18" height="18" rx="3"/><path d="M-9 -3h18" stroke="#f7f2e5" stroke-width="2"/></g></g><line x1="0" y1="0" x2="' + (kx * 33).toFixed(1) + '" y2="' + (ky * 33).toFixed(1) + '" stroke="var(--iamb)" stroke-width="2" stroke-dasharray="3 3"/>';
  const dial = '<div class="ibx-dial" id="ibxDial"><svg viewBox="-100 -100 200 200" role="img" aria-label="Kompas kiblat: ' + Math.round(q) + ' derajat dari utara, ke arah ' + ibxDir(q) + '"><circle class="rim" r="94"/><g id="ibxRose" style="transform:rotate(0deg)">' + tk.join('') + lb + kaaba + '</g><path class="ptr" d="M0 -98l9 16h-18z"/></svg></div>';
  return '<section class="ibx-card"><h3>Arah kiblat</h3>' + dial +
    '<p class="ibx-ql">' + Math.round(q) + '° dari utara, ke ' + ibxDir(q) + '<small>Jarak lurus ke Ka\'bah sekitar ' + ibxFmtKm(km) + ' km · dari ' + esc(ldb.name) + '</small></p>' +
    '<p class="ibx-qs" id="ibxQs" aria-live="polite">' + (ibxCmp.on ? 'Mencari arah HP…' : 'Ikon Ka\'bah menunjukkan arah kiblat. Aktifkan kompas untuk memutar penunjuk mengikuti HP.') + '</p>' +
    '<div class="ibx-ctr"><button class="ibx-btn' + (ibxCmp.on ? '' : ' fill') + '" data-q="ibxCmp" data-fk="cmp">' + (ibxCmp.on ? 'Matikan kompas' : 'Aktifkan kompas') + '</button></div>' +
    '<p class="ibx-fine">Letakkan HP mendatar atau pegang tegak, jauhi logam dan magnet. Sensor HP bisa meleset beberapa derajat; cocokkan dengan penunjuk kiblat di masjid atau matahari saat tengah hari bila ragu.</p></section>';
}
function ibxToday(now) {
  const hs = ibxHint(today());
  return ibxHero(now) + ibxProgress() + ibxSnTodayCard() + ibxSnWeekCard() + ibxQiblaCard() +
    '<section class="ibx-card"><h3>Pengingat amalan</h3>' + (hs.length ? '<ul class="ibx-ul">' + hs.map(x => '<li><em>' + x[0] + '</em><span>' + esc(x[1]) + '</span></li>').join('') + '</ul>' : '<p class="ibx-sub">Tidak ada amalan khusus hari ini dan besok. Tahajud, dhuha, dan tilawah bisa dicatat di Pelacak.</p>') +
    '<p class="ibx-fine">Tanggal hijriah memakai kalender Umm al-Qura' + (ibdb.pref.hadj ? ' dengan koreksi ' + (ibdb.pref.hadj > 0 ? '+' : '') + ibdb.pref.hadj + ' hari' : '') + '; penetapan resmi Kemenag RI (sidang isbat) bisa berbeda satu hari. Koreksi bisa diatur di Pelacak &rsaquo; Pengaturan.</p></section>';
}
IBX_PANEL.hari = ibxToday;

/* ---------- Pelacak ---------- */
function ibxChart(n) {
  const t = today(), days = [];
  for (let i = n - 1; i >= 0; i--) days.push(addDays(t, -i));
  const W = 300, H = 92, top = 6, bw = W / n, bwi = Math.max(3, bw - (n > 10 ? 2 : 8));
  const bars = days.map((d, i) => {
    const s = ibxScore(d), x = i * bw + (bw - bwi) / 2, hh = s.any ? Math.max(3, s.pct * (H - top)) : 3;
    const cls = !s.any ? 'e' : s.pct >= 0.8 ? 'hi' : s.pct < 0.4 ? 'lo' : '';
    return '<rect class="b ' + cls + (d === t ? ' td' : '') + '" x="' + x.toFixed(1) + '" y="' + (H - hh).toFixed(1) + '" width="' + bwi.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="2"><title>' + esc(dayShort(d)) + ': ' + (s.any ? Math.round(s.pct * 100) + '% (' + s.got + ' dari ' + s.total + ')' : 'belum dicatat') + '</title></rect>';
  }).join('');
  const lab = days.map((d, i) => (n <= 7 || i % 5 === 4 || i === 0) ? '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H + 12) + '">' + (n <= 7 ? HARI[pd(d).getDay()].slice(0, 3) : pd(d).getDate()) + '</text>' : '').join('');
  const g = [0.5, 1].map(f => '<line x1="0" x2="' + W + '" y1="' + (H - f * (H - top)).toFixed(1) + '" y2="' + (H - f * (H - top)).toFixed(1) + '" stroke-dasharray="' + (f === 1 ? '0' : '3 3') + '"/>').join('');
  return '<svg class="ibx-chart" viewBox="0 0 ' + W + ' ' + (H + 16) + '" role="img" aria-label="Grafik skor ibadah ' + n + ' hari terakhir">' + g + bars + lab + '</svg>';
}
function ibxStats(n) {
  const t = today(), days = [];
  for (let i = 0; i < n; i++) days.push(addDays(t, -i));
  const sc = days.map(ibxScore), rec = sc.filter(s => s.any);
  const avg = rec.length ? rec.reduce((a, s) => a + s.pct, 0) / rec.length : null;
  const tepat = sc.reduce((a, s) => a + s.tepat, 0);
  const items = ibxApplicFor().map(it => {
    const ds = days.filter(d => it.wd == null || pd(d).getDay() === it.wd), dn = ds.filter(d => ibxHas(d, it.id)).length;
    return { it, dn, of: ds.length };
  });
  return { avg, rec: rec.length, tepat, items };
}
const ibxApplicFor = () => IBX_ITEMS.filter(i => !ibxHidden(i.id));
function ibxTracker(now) {
  const d = ibxDate, isT = d === today(), hj = ibxHij(d, isT && ibxAfterMaghrib(now) ? 1 : 0), st = ibDay(d);
  let times = null;
  if (hxHas()) { try { const q = d.split('-').map(Number); times = hxDay(q[0], q[1], q[2], ldb); } catch (e) { times = null; } }
  let h = '<div class="ibx-dn"><button data-q="ibxDay" data-v="-1" data-fk="prev" aria-label="Hari sebelumnya">&lsaquo;</button><div><b>' + esc(dayLong(d)) + '</b><small>' + esc(hj.txt) + (isT ? ' · hari ini' : '') + '</small></div><button data-q="ibxDay" data-v="1" data-fk="next" aria-label="Hari berikutnya"' + (isT ? ' disabled' : '') + '>&rsaquo;</button></div>';
  if (!isT) h += '<div class="ibx-ctr"><button class="ibx-lnk" data-q="ibxToday" data-fk="tdy">Kembali ke hari ini</button></div>';
  h += '<section class="ibx-card"><h3>Shalat wajib</h3><p class="ibx-sub">Ikut tersimpan di Jurnal &rsaquo; Harian. Ketuk lagi untuk membatalkan.</p>';
  h += PRAYERS.map((p, i) => {
    const it = times && times.items.find(x => x.five && x.name === p), soon = isT && it && it.at != null && it.at > now;
    const pill = (v, tx, lab) => '<button class="ibx-p" data-q="ibxSh" data-p="' + p + '" data-v="' + v + '" data-fk="sh-' + p + '-' + v + '" aria-pressed="' + (st[i] === v) + '" aria-label="' + p + ': ' + lab + '">' + tx + '</button>';
    return '<div class="ibx-row' + (soon ? ' soon' : '') + '" role="group" aria-label="Shalat ' + p + '"><div class="ibx-rn"><b>' + p + '</b><small>' + (it && it.at != null ? hxHM(it.at, times.tz) + (soon ? ' · belum masuk' : '') : '') + '</small></div><div class="ibx-ps">' + pill('tepat', 'Tepat', 'tepat waktu') + pill('telat', 'Telat', 'telat') + pill('tidak', 'Tidak', 'tidak shalat') + '</div></div>';
  }).join('') + '</section>';
  const ap = ibxApplic(d);
  h += '<section class="ibx-card"><h3>Amalan sunnah</h3><p class="ibx-sub">' + ap.filter(i => ibxHas(d, i.id)).length + ' dari ' + ap.length + ' dikerjakan</p>';
  h += ap.length ? ap.map(i => { const on = ibxHas(d, i.id); return '<button class="ibx-ck" role="checkbox" aria-checked="' + on + '" data-q="ibxTg" data-id="' + i.id + '" data-fk="tg-' + i.id + '"><span class="ibx-box">' + IBX_CHK + '</span><span class="t"><b>' + esc(i.t) + '</b><small>' + esc(i.s) + '</small></span></button>'; }).join('') : '<p class="ibx-empty">Tidak ada amalan sunnah yang dipantau untuk hari ini. Atur di bagian Pengaturan.</p>';
  h += '</section>';
  const n = ibxRange, S = ibxStats(n);
  h += '<section class="ibx-card"><h3>Grafik konsistensi</h3><div class="ibx-seg" role="group" aria-label="Rentang grafik"><button data-q="ibxRange" data-v="7" data-fk="r7" aria-pressed="' + (n === 7) + '">7 hari</button><button data-q="ibxRange" data-v="30" data-fk="r30" aria-pressed="' + (n === 30) + '">30 hari</button></div>' + ibxChart(n) +
    '<p class="ibx-fine">Tinggi batang = amalan yang dikerjakan dibanding yang berlaku hari itu (shalat tepat waktu + sunnah). Hijau 80% ke atas, kuning di bawah 40%, abu-abu belum dicatat.</p>' +
    '<div class="ibx-kp"><div><small>Rata-rata skor</small><b>' + (S.avg == null ? '–' : Math.round(S.avg * 100) + '%') + '</b><em>dari ' + S.rec + ' hari tercatat</em></div><div><small>Shalat tepat waktu</small><b>' + S.tepat + '/' + (n * 5) + '</b><em>' + n + ' hari terakhir</em></div><div><small>Beruntun 5 tepat waktu</small><b>' + ibStreak() + '</b><em>hari</em></div><div><small>Beruntun sunnah</small><b>' + ibxStreakSunnah() + '</b><em>hari, minimal satu amalan</em></div></div></section>';
  h += '<section class="ibx-card"><h3>Per amalan, ' + n + ' hari terakhir</h3>' + (S.items.length ? S.items.map(x => '<div class="ibx-it"><span>' + esc(x.it.t) + '</span><span class="ibx-bar" aria-hidden="true"><i style="width:' + (x.of ? Math.round(x.dn / x.of * 100) : 0) + '%"></i></span><b>' + x.dn + '/' + x.of + '</b></div>').join('') : '<p class="ibx-empty">Belum ada amalan yang dipantau.</p>') + '</section>';
  h += '<section class="ibx-card"><button class="ibx-lnk" data-q="ibxSet" data-fk="set" aria-expanded="' + ibxSetOpen + '">Pengaturan ' + (ibxSetOpen ? '&#9652;' : '&#9662;') + '</button>';
  if (ibxSetOpen) {
    h += '<p class="ibx-sub">Amalan yang dipantau</p>' + IBX_ITEMS.map(i => '<div class="ibx-set"><span>' + esc(i.t) + '</span><button class="ibx-sw" role="switch" aria-checked="' + !ibxHidden(i.id) + '" aria-label="Pantau ' + esc(i.t) + '" data-q="ibxHide" data-id="' + i.id + '" data-fk="hd-' + i.id + '"></button></div>').join('') +
      '<p class="ibx-sub" style="margin-top:14px">Tanggal hijriah</p><div class="ibx-set"><span>Koreksi hari<small class="ibx-fine" style="display:block;margin:0">Samakan dengan penetapan Kemenag RI</small></span><div class="ibx-step"><button data-q="ibxHadj" data-v="-1" data-fk="ha-" aria-label="Kurangi satu hari">&minus;</button><b>' + (ibdb.pref.hadj > 0 ? '+' : '') + ibdb.pref.hadj + '</b><button data-q="ibxHadj" data-v="1" data-fk="ha+" aria-label="Tambah satu hari">+</button></div></div>' +
      '<div class="ibx-set"><span>Hari baru mulai saat Maghrib<small class="ibx-fine" style="display:block;margin:0">Butuh lokasi diatur</small></span><button class="ibx-sw" role="switch" aria-checked="' + ibdb.pref.hmg + '" aria-label="Hari hijriah berganti saat Maghrib" data-q="ibxHmg" data-fk="hmg"></button></div>';
  }
  return h + '</section>';
}
IBX_PANEL.lacak = ibxTracker;

/* ---------- kerangka halaman ---------- */
function ibxRender() {
  const root = $('#ibBody');
  if (!root) return;
  const ae = document.activeElement, fk = ae && root.contains(ae) && ae.dataset ? ae.dataset.fk : null;
  if (!IBX_READY[ibxTab] || !IBX_PANEL[ibxTab]) ibxTab = 'hari';
  const now = Date.now();
  root.innerHTML = '<div class="ibx-tabs" role="group" aria-label="Bagian Ibadah">' + IBX_TABS.filter(t => IBX_READY[t[0]]).map(t => '<button class="ibx-tab" data-q="ibxTab" data-v="' + t[0] + '" data-fk="tab-' + t[0] + '" aria-pressed="' + (ibxTab === t[0]) + '">' + esc(t[1]) + '</button>').join('') + '</div><div id="ibxPanel">' + IBX_PANEL[ibxTab](now) + '</div>';
  if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el && !el.disabled) el.focus({ preventScroll: true }); }
  if (ibxTab === 'hari' && ibxCmp.on) ibxCompassPaint();
}
QACT.ibxTab = b => { const v = b.dataset.v; if (!IBX_READY[v]) return; if (v !== 'hari') ibxCompassStop(); ibxTab = v; ibxRender(); };
QACT.ibxDay = b => { const n = addDays(ibxDate, parseInt(b.dataset.v, 10) || 0); if (n > today()) return; ibxDate = n; ibxRender(); };
QACT.ibxToday = () => { ibxDate = today(); ibxRender(); };
QACT.ibxSh = b => { ibxSetSh(ibxDate, b.dataset.p, b.dataset.v); ibxRender(); };
QACT.ibxTg = b => { ibxToggle(ibxDate, b.dataset.id); ibxRender(); };
QACT.ibxRange = b => { ibxRange = b.dataset.v === '30' ? 30 : 7; ibxRender(); };
QACT.ibxSet = () => { ibxSetOpen = !ibxSetOpen; ibxRender(); };
QACT.ibxHide = b => {
  const id = b.dataset.id;
  if (!IBX_ITEMS.some(i => i.id === id)) return;
  const i = ibdb.pref.hide.indexOf(id);
  if (i >= 0) ibdb.pref.hide.splice(i, 1); else ibdb.pref.hide.push(id);
  ibxSave(); ibxRender();
};
QACT.ibxHadj = b => { const n = ibdb.pref.hadj + (parseInt(b.dataset.v, 10) || 0); if (Math.abs(n) > 2) return; ibdb.pref.hadj = n; ibxSave(); ibxRender(); };
QACT.ibxHmg = () => { ibdb.pref.hmg = !ibdb.pref.hmg; ibxSave(); ibxRender(); };
QACT.ibxCmp = () => { if (ibxCmp.on) { ibxCompassStop(); ibxRender(); } else ibxCompassStart(); };
function ibxTick() {   // tiap detik: hanya teks hitung mundur; gambar ulang saat waktu shalat/tengah malam tiba
  if (curView !== 'ibadah' || document.hidden || ibxTab !== 'hari') return;
  const now = Date.now();
  if (ibxNextAt && now >= ibxNextAt) { ibxRender(); return; }
  const cd = $('#ibxCd');
  if (cd && ibxCdAt) cd.textContent = 'dalam ' + hxLeft(ibxCdAt - now);
}
setInterval(ibxTick, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) ibxTick(); });
{
  const baseShowIbx = showView;
  showView = function (v) { if (v === 'ibadah' && curView !== 'ibadah') ibxFresh(); return baseShowIbx(v); };
}
RENDER.ibadah = ibxRender;
window.DL = Object.freeze(Object.assign({}, window.DL, { b81a: Object.freeze({ state: () => ibdb, clean: ibxClean, key: IBX_KEY, items: IBX_ITEMS, hij: ibxHij, hijriRaw: ibxHijriRaw, civil: ibxHijriCivil, qibla: ibxQibla, dist: ibxDist, dir: ibxDir, heading: ibxHeading, diff: ibxAngDiff, score: ibxScore, toggle: ibxToggle, setSh: ibxSetSh, stats: ibxStats, hint: ibxHint, render: ibxRender, tab: () => ibxTab, hero: ibxHero, ring: ibxRing, chart: ibxChart, panels: IBX_PANEL, ready: IBX_READY, fresh: IBX_FRESH, set: o => { if (o && typeof o === 'object') { if ('tab' in o) ibxTab = o.tab; if ('date' in o) ibxDate = o.date; } } }) }));
/* ===== /v81a ===== */
/* ===== v81b: halaman Ibadah: tab Doa & dzikir, Tasbih digital, dan Cari (doa + panduan fiqih; tahap berikutnya menambah ayat lewat IBX_SEARCH). Membalik: patch81b.py --reverse ===== */
const IBX_CAT = [['pagi', 'Pagi & petang'], ['tidur', 'Tidur & bangun'], ['makan', 'Makan & minum'], ['suci', 'Bersuci'], ['jalan', 'Rumah & perjalanan'], ['masjid', 'Masjid & adzan'], ['dalam', 'Bacaan shalat'], ['shalat', 'Dzikir setelah shalat'], ['harian', 'Sehari-hari'], ['lindung', 'Perlindungan & ampunan'], ['jenguk', 'Sakit & menjenguk']];
// Catatan: teks ditulis dari pengetahuan penulis (tanpa unduhan dataset); cocokkan dengan rujukan terpercaya (mis. Hisnul Muslim) sebelum dijadikan dalil.
// Bidang: id, c (kategori), t (judul), ar (Arab), lat (Latin), tr (arti), f (keutamaan/catatan), s (sumber), n (jumlah ulang), k (kata kunci pencarian)
const IBX_DOA = [
  { id: 'sayyidul', c: 'pagi', t: 'Sayyidul istighfar', n: 1, k: 'istighfar ampunan pagi petang taubat',
    ar: `اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ`,
    lat: `Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastatha'tu, a'udzu bika min syarri ma shana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidzanbi faghfirli fa innahu la yaghfirudz dzunuba illa anta.`,
    tr: `Ya Allah, Engkau adalah Rabbku, tiada Tuhan selain Engkau. Engkau menciptakanku dan aku hamba-Mu. Aku berada di atas perjanjian dan janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan perbuatanku. Aku mengakui nikmat-Mu atasku dan mengakui dosaku, maka ampunilah aku, karena tidak ada yang mengampuni dosa selain Engkau.`,
    f: `Disebutkan dalam hadits: siapa membacanya di pagi hari dengan penuh keyakinan lalu meninggal pada hari itu sebelum sore, ia termasuk penghuni surga; demikian pula bila dibaca di petang hari.`, s: `HR. Bukhari` },
  { id: 'kursi', c: 'pagi', t: 'Ayat Kursi (QS. Al-Baqarah: 255)', n: 1, k: 'ayat kursi alquran perlindungan tidur setelah shalat',
    ar: `اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ`,
    lat: `Allahu la ilaha illa huwal hayyul qayyum, la ta'khudzuhu sinatuw wa la naum, lahu ma fis samawati wa ma fil ardh, man dzalladzi yasyfa'u 'indahu illa bi idznih, ya'lamu ma baina aidihim wa ma khalfahum, wa la yuhithuna bisyai'im min 'ilmihi illa bima sya'a, wasi'a kursiyyuhus samawati wal ardh, wa la ya'uduhu hifzhuhuma, wa huwal 'aliyyul 'azhim.`,
    tr: `Allah, tidak ada Tuhan selain Dia, Yang Maha Hidup, Yang terus menerus mengurus makhluk-Nya. Dia tidak mengantuk dan tidak tidur. Milik-Nya apa yang di langit dan di bumi. Tiada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan dan di belakang mereka, dan mereka tidak mengetahui sesuatu pun dari ilmu-Nya kecuali yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi, dan memelihara keduanya tidaklah berat bagi-Nya. Dia Mahatinggi, Mahabesar.`,
    f: `Dibaca pada dzikir pagi dan petang, sesudah shalat wajib, dan sebelum tidur. Dalam hadits disebutkan, pembacanya sebelum tidur senantiasa dijaga oleh penjaga dari Allah hingga pagi.`, s: `HR. Bukhari` },
  { id: 'qul3', c: 'pagi', t: 'Al-Ikhlas, Al-Falaq, An-Nas (3 kali)', n: 3, k: 'qul tiga ikhlas falaq nas muawwidzat pagi petang tidur',
    ar: `قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ`,
    lat: `Qul huwallahu ahad. Allahush shamad. Lam yalid wa lam yulad. Wa lam yakul lahu kufuwan ahad. Qul a'udzu birabbil falaq. Min syarri ma khalaq. Wa min syarri ghasiqin idza waqab. Wa min syarrin naffatsati fil 'uqad. Wa min syarri hasidin idza hasad. Qul a'udzu birabbin nas. Malikin nas. Ilahin nas. Min syarril waswasil khannas. Alladzi yuwaswisu fi shudurin nas. Minal jinnati wan nas.`,
    tr: `Katakanlah: Dialah Allah, Yang Maha Esa. Allah tempat bergantung segala sesuatu. Dia tidak beranak dan tidak diperanakkan. Tidak ada sesuatu pun yang setara dengan Dia. (Al-Ikhlas) Aku berlindung kepada Tuhan yang menguasai subuh, dari kejahatan makhluk-Nya, dari kejahatan malam apabila gelap gulita, dari kejahatan perempuan penyihir yang meniup buhul-buhul, dan dari kejahatan pendengki apabila ia dengki. (Al-Falaq) Aku berlindung kepada Tuhan manusia, Raja manusia, Sembahan manusia, dari kejahatan bisikan setan yang bersembunyi, yang membisikkan ke dalam dada manusia, dari golongan jin dan manusia. (An-Nas)`,
    f: `Dibaca tiga kali pada pagi dan petang; disebutkan dalam hadits bahwa itu mencukupkan pembacanya dari segala sesuatu.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'bikapagi', c: 'pagi', t: 'Doa pagi: dengan-Mu kami memasuki pagi', n: 1, k: 'pagi subuh bika ashbahna',
    ar: `اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ`,
    lat: `Allahumma bika ashbahna, wa bika amsaina, wa bika nahya, wa bika namutu, wa ilaikan nusyur.`,
    tr: `Ya Allah, dengan-Mu kami memasuki waktu pagi, dengan-Mu kami memasuki waktu petang, dengan-Mu kami hidup, dengan-Mu kami mati, dan kepada-Mu kami dibangkitkan.`,
    f: `Doa pembuka hari yang diajarkan Nabi untuk dibaca ketika pagi.`, s: `HR. At-Tirmidzi` },
  { id: 'bikapetang', c: 'pagi', t: 'Doa petang: dengan-Mu kami memasuki petang', n: 1, k: 'petang sore magrib bika amsaina',
    ar: `اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ`,
    lat: `Allahumma bika amsaina, wa bika ashbahna, wa bika nahya, wa bika namutu, wa ilaikal mashir.`,
    tr: `Ya Allah, dengan-Mu kami memasuki waktu petang, dengan-Mu kami memasuki waktu pagi, dengan-Mu kami hidup, dengan-Mu kami mati, dan kepada-Mu tempat kembali.`,
    f: `Pasangan doa pagi; dibaca ketika petang.`, s: `HR. At-Tirmidzi` },
  { id: 'yadhurru', c: 'pagi', t: 'Perlindungan dengan nama Allah (3 kali)', n: 3, k: 'bismillahilladzi la yadhurru perlindungan pagi petang',
    ar: `بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ`,
    lat: `Bismillahilladzi la yadhurru ma'asmihi syai'un fil ardhi wa la fis sama'i wa huwas sami'ul 'alim.`,
    tr: `Dengan nama Allah yang bersama nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dia Maha Mendengar lagi Maha Mengetahui.`,
    f: `Dibaca tiga kali pagi dan petang; disebutkan dalam hadits bahwa pembacanya tidak ditimpa bahaya mendadak.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'radhitu', c: 'pagi', t: 'Ridha Allah sebagai Rabb (3 kali)', n: 3, k: 'radhitu ridha rabb islam nabi pagi petang',
    ar: `رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا`,
    lat: `Radhitu billahi rabba, wa bil islami dina, wa bi Muhammadin nabiyya.`,
    tr: `Aku ridha Allah sebagai Rabb, Islam sebagai agama, dan Muhammad sebagai nabi.`,
    f: `Dibaca tiga kali pagi dan petang; disebutkan bahwa Allah berjanji meridhainya pada hari kiamat.`, s: `HR. Abu Dawud, At-Tirmidzi, Ahmad` },
  { id: 'tasbih100', c: 'pagi', t: 'Subhanallahi wa bihamdihi (100 kali)', n: 100, k: 'tasbih subhanallah bihamdihi seratus pagi petang',
    ar: `سُبْحَانَ اللَّهِ وَبِحَمْدِهِ`,
    lat: `Subhanallahi wa bihamdihi.`,
    tr: `Mahasuci Allah, dan dengan memuji-Nya aku bertasbih.`,
    f: `Dalam hadits disebutkan: siapa membacanya seratus kali dalam sehari, dosa-dosanya dihapus walau sebanyak buih di lautan.`, s: `HR. Bukhari, Muslim` },
  { id: 'tidur', c: 'tidur', t: 'Doa sebelum tidur', n: 1, k: 'tidur malam bismika allahumma ahya',
    ar: `بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ`,
    lat: `Bismikallahumma ahya wa amut.`,
    tr: `Dengan nama-Mu ya Allah, aku hidup dan aku mati.`,
    f: `Dibaca ketika hendak berbaring. Disunnahkan pula membaca Ayat Kursi dan tiga surah Qul sebelum tidur.`, s: `HR. Bukhari` },
  { id: 'bangun', c: 'tidur', t: 'Doa bangun tidur', n: 1, k: 'bangun tidur pagi alhamdulillahilladzi ahyana',
    ar: `الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ`,
    lat: `Alhamdulillahilladzi ahyana ba'da ma amatana wa ilaihin nusyur.`,
    tr: `Segala puji bagi Allah yang menghidupkan kami setelah mematikan kami, dan kepada-Nya kami dibangkitkan.`,
    f: `Tidur disebut sebagai "kematian kecil", sehingga bangun adalah dihidupkan kembali.`, s: `HR. Bukhari` },
  { id: 'makan', c: 'makan', t: 'Doa sebelum makan', n: 1, k: 'makan minum bismillah sebelum makan',
    ar: `بِسْمِ اللَّهِ`,
    lat: `Bismillah.`,
    tr: `Dengan nama Allah.`,
    f: `Bila lupa di awal, ucapkan: "Bismillahi awwalahu wa akhirahu" (dengan nama Allah pada awal dan akhirnya).`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'makanlupa', c: 'makan', t: 'Jika lupa membaca doa saat mulai makan', n: 1, k: 'lupa makan bismillahi awwalahu wa akhirahu',
    ar: `بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ`,
    lat: `Bismillahi awwalahu wa akhirahu.`,
    tr: `Dengan nama Allah pada awal dan akhirnya.`,
    f: `Diucapkan begitu teringat di tengah makan.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'sudahmakan', c: 'makan', t: 'Doa sesudah makan', n: 1, k: 'selesai makan sesudah makan alhamdulillah ath\'amana',
    ar: `الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ`,
    lat: `Alhamdulillahilladzi ath'amana wa saqana wa ja'alana muslimin.`,
    tr: `Segala puji bagi Allah yang telah memberi kami makan dan minum, dan menjadikan kami orang-orang muslim.`,
    f: `Ungkapan syukur setelah selesai makan dan minum.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'tuanrumah', c: 'makan', t: 'Doa untuk tuan rumah yang menjamu', n: 1, k: 'tamu tuan rumah jamuan makan di rumah orang',
    ar: `اللَّهُمَّ بَارِكْ لَهُمْ فِيمَا رَزَقْتَهُمْ وَاغْفِرْ لَهُمْ وَارْحَمْهُمْ`,
    lat: `Allahumma barik lahum fima razaqtahum, waghfir lahum, warhamhum.`,
    tr: `Ya Allah, berkahilah rezeki yang Engkau berikan kepada mereka, ampunilah mereka, dan rahmatilah mereka.`,
    f: `Didoakan oleh tamu kepada orang yang menjamunya.`, s: `HR. Muslim` },
  { id: 'berbuka', c: 'makan', t: 'Doa berbuka puasa', n: 1, k: 'buka puasa iftar ramadhan senin kamis dzahaba azh zhama',
    ar: `ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ`,
    lat: `Dzahabaz zhama'u wabtallatil 'uruqu wa tsabatal ajru insya Allah.`,
    tr: `Telah hilang dahaga, urat-urat telah basah, dan pahala telah ditetapkan, insya Allah.`,
    f: `Dibaca ketika berbuka.`, s: `HR. Abu Dawud` },
  { id: 'wudhu', c: 'suci', t: 'Doa setelah wudhu', n: 1, k: 'wudu wudhu setelah berwudhu bersuci syahadat',
    ar: `أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ`,
    lat: `Asyhadu an la ilaha illallah wahdahu la syarika lah, wa asyhadu anna Muhammadan 'abduhu wa rasuluh. Allahummaj'alni minat tawwabin, waj'alni minal mutathahhirin.`,
    tr: `Aku bersaksi bahwa tidak ada Tuhan selain Allah semata, tiada sekutu bagi-Nya, dan aku bersaksi bahwa Muhammad adalah hamba dan utusan-Nya. Ya Allah, jadikanlah aku termasuk orang yang bertaubat dan orang yang bersuci.`,
    f: `Disebutkan dalam hadits bahwa pembacanya dibukakan delapan pintu surga, ia boleh masuk dari pintu mana saja. Sebelum wudhu, ucapkan "Bismillah".`, s: `HR. Muslim, At-Tirmidzi` },
  { id: 'masukkm', c: 'suci', t: 'Doa masuk kamar mandi', n: 1, k: 'kamar mandi toilet wc masuk khubuts',
    ar: `اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ`,
    lat: `Allahumma inni a'udzu bika minal khubutsi wal khaba'its.`,
    tr: `Ya Allah, aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan.`,
    f: `Dibaca sebelum masuk, dengan mendahulukan kaki kiri.`, s: `HR. Bukhari, Muslim` },
  { id: 'keluarkm', c: 'suci', t: 'Doa keluar kamar mandi', n: 1, k: 'kamar mandi toilet wc keluar ghufranaka',
    ar: `غُفْرَانَكَ`,
    lat: `Ghufranaka.`,
    tr: `Aku memohon ampunan-Mu.`,
    f: `Dibaca ketika keluar, dengan mendahulukan kaki kanan.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'keluarrumah', c: 'jalan', t: 'Doa keluar rumah', n: 1, k: 'keluar rumah berangkat tawakkaltu pergi',
    ar: `بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ`,
    lat: `Bismillah, tawakkaltu 'alallah, la hawla wa la quwwata illa billah.`,
    tr: `Dengan nama Allah, aku bertawakal kepada Allah, tiada daya dan kekuatan kecuali dengan pertolongan Allah.`,
    f: `Disebutkan dalam hadits bahwa orang yang membacanya akan dikatakan: kamu telah diberi petunjuk, dicukupi, dan dijaga.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'masukrumah', c: 'jalan', t: 'Doa masuk rumah', n: 1, k: 'masuk rumah pulang salam walajna',
    ar: `بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا`,
    lat: `Bismillahi walajna, wa bismillahi kharajna, wa 'ala rabbina tawakkalna.`,
    tr: `Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Tuhan kami, kami bertawakal.`,
    f: `Setelah itu ucapkan salam kepada penghuni rumah.`, s: `HR. Abu Dawud` },
  { id: 'kendaraan', c: 'jalan', t: 'Doa naik kendaraan / bepergian', n: 1, k: 'kendaraan safar perjalanan naik mobil motor pesawat sakhkhara',
    ar: `سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ`,
    lat: `Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun.`,
    tr: `Mahasuci Allah yang telah menundukkan kendaraan ini bagi kami, padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kepada Tuhan kami, kami akan kembali.`,
    f: `Menurut hadits, dibaca setelah takbir tiga kali ("Allahu akbar" 3x). Lafaz doa ini juga merupakan petikan QS. Az-Zukhruf: 13-14.`, s: `HR. Muslim; QS. Az-Zukhruf: 13-14` },
  { id: 'masukmasjid', c: 'masjid', t: 'Doa masuk masjid', n: 1, k: 'masuk masjid abwaba rahmatik',
    ar: `اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ`,
    lat: `Allahummaftah li abwaba rahmatik.`,
    tr: `Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.`,
    f: `Masuk dengan kaki kanan, lalu bershalawat kepada Nabi.`, s: `HR. Muslim` },
  { id: 'keluarmasjid', c: 'masjid', t: 'Doa keluar masjid', n: 1, k: 'keluar masjid fadhlik',
    ar: `اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ`,
    lat: `Allahumma inni as'aluka min fadhlik.`,
    tr: `Ya Allah, sesungguhnya aku memohon kepada-Mu sebagian dari karunia-Mu.`,
    f: `Keluar dengan kaki kiri.`, s: `HR. Muslim` },
  { id: 'adzan', c: 'masjid', t: 'Doa setelah adzan', n: 1, k: 'adzan azan setelah adzan wasilah syafaat',
    ar: `اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ`,
    lat: `Allahumma rabba hadzihid da'watit tammah, wash shalatil qa'imah, ati Muhammadanil wasilata wal fadhilah, wab'atshu maqamam mahmudanilladzi wa'adtah.`,
    tr: `Ya Allah, Tuhan pemilik seruan yang sempurna ini dan shalat yang akan didirikan, berilah Muhammad wasilah dan keutamaan, dan bangkitkanlah ia pada kedudukan terpuji yang telah Engkau janjikan.`,
    f: `Disebutkan dalam hadits: siapa membacanya setelah mendengar adzan, ia berhak mendapat syafaat Nabi pada hari kiamat. Sebelumnya, jawab lafaz muadzin lalu bershalawat.`, s: `HR. Bukhari` },
  { id: 'istighfar3', c: 'shalat', t: 'Istighfar dan Allahumma antas salam', n: 1, k: 'setelah shalat salam istighfar astaghfirullah antas salam dzikir',
    ar: `أَسْتَغْفِرُ اللَّهَ (٣×) اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ`,
    lat: `Astaghfirullah (3x). Allahumma antas salam wa minkas salam, tabarakta ya dzal jalali wal ikram.`,
    tr: `Aku memohon ampun kepada Allah (3 kali). Ya Allah, Engkau adalah As-Salam (Maha Sejahtera), dari-Mu kesejahteraan, Mahasuci Engkau wahai Pemilik keagungan dan kemuliaan.`,
    f: `Dibaca segera setelah salam dari shalat wajib.`, s: `HR. Muslim` },
  { id: 'tasbihshalat', c: 'shalat', t: 'Tasbih, tahmid, takbir setelah shalat', n: 100, k: 'tasbih tahmid takbir tiga puluh tiga subhanallah alhamdulillah allahu akbar setelah shalat',
    ar: `سُبْحَانَ اللَّهِ (٣٣×) الْحَمْدُ لِلَّهِ (٣٣×) اللَّهُ أَكْبَرُ (٣٤×)`,
    lat: `Subhanallah (33x), Alhamdulillah (33x), Allahu Akbar (34x).`,
    tr: `Mahasuci Allah, segala puji bagi Allah, Allah Mahabesar.`,
    f: `Menurut hadits riwayat Muslim, tasbih 33, tahmid 33, dan takbir 34 kali. Ada juga riwayat yang menyebut masing-masing 33 kali lalu ditutup dengan tahlil. Gunakan tab Tasbih untuk menghitung.`, s: `HR. Muslim` },
  { id: 'tahlilshalat', c: 'shalat', t: 'Tahlil penutup dzikir setelah shalat', n: 1, k: 'tahlil laa ilaha illallah wahdahu setelah shalat',
    ar: `لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
    lat: `La ilaha illallah wahdahu la syarika lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai'in qadir.`,
    tr: `Tiada Tuhan selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan milik-Nya segala puji, dan Dia Mahakuasa atas segala sesuatu.`,
    f: `Menggenapkan hitungan dzikir setelah shalat.`, s: `HR. Muslim` },
  { id: 'berpakaian', c: 'harian', t: 'Doa memakai pakaian', n: 1, k: 'pakaian baju berpakaian kasani',
    ar: `الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ`,
    lat: `Alhamdulillahilladzi kasani hadza wa razaqanihi min ghairi hawlin minni wa la quwwah.`,
    tr: `Segala puji bagi Allah yang memberiku pakaian ini dan merezekikannya kepadaku tanpa daya dan kekuatan dariku.`,
    f: `Disebutkan dalam hadits bahwa dosa-dosa yang telah lalu diampuni bagi pembacanya.`, s: `HR. Abu Dawud, At-Tirmidzi` },
  { id: 'cermin', c: 'harian', t: 'Doa bercermin', n: 1, k: 'cermin berhias akhlak khuluq',
    ar: `اللَّهُمَّ أَنْتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي`,
    lat: `Allahumma anta hassanta khalqi fahassin khuluqi.`,
    tr: `Ya Allah, Engkau telah memperbagus rupaku, maka perbaguslah akhlakku.`,
    f: `Doa agar rupa yang baik diiringi akhlak yang baik.`, s: `HR. Ahmad` },
  { id: 'hujan', c: 'harian', t: 'Doa ketika turun hujan', n: 1, k: 'hujan shayyiban nafi\'a cuaca',
    ar: `اللَّهُمَّ صَيِّبًا نَافِعًا`,
    lat: `Allahumma shayyiban nafi'a.`,
    tr: `Ya Allah, jadikanlah hujan ini hujan yang bermanfaat.`,
    f: `Dibaca ketika melihat hujan turun.`, s: `HR. Bukhari` },
  { id: 'bersin', c: 'harian', t: 'Adab bersin', n: 1, k: 'bersin alhamdulillah yarhamukallah yahdikumullah',
    ar: `الْحَمْدُ لِلَّهِ ← يَرْحَمُكَ اللَّهُ ← يَهْدِيكُمُ اللَّهُ وَيُصْلِحُ بَالَكُمْ`,
    lat: `Alhamdulillah (yang bersin) → Yarhamukallah (yang mendengar) → Yahdikumullah wa yushlihu balakum (yang bersin menjawab).`,
    tr: `Segala puji bagi Allah → Semoga Allah merahmatimu → Semoga Allah memberi kalian petunjuk dan memperbaiki keadaan kalian.`,
    f: `Mendoakan orang yang bersin dan mengucap hamdalah hukumnya dianjurkan.`, s: `HR. Bukhari, At-Tirmidzi` },
  { id: 'kafarat', c: 'harian', t: 'Kafaratul majlis (penutup majelis)', n: 1, k: 'majelis pertemuan rapat kafaratul majlis penutup',
    ar: `سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ`,
    lat: `Subhanakallahumma wa bihamdika, asyhadu an la ilaha illa anta, astaghfiruka wa atubu ilaik.`,
    tr: `Mahasuci Engkau ya Allah dan dengan memuji-Mu, aku bersaksi tidak ada Tuhan selain Engkau, aku memohon ampun dan bertaubat kepada-Mu.`,
    f: `Dibaca di akhir majelis sebagai penebus kekeliruan yang terjadi selama berkumpul.`, s: `HR. At-Tirmidzi, Abu Dawud` },
  { id: 'sapujagat', c: 'lindung', t: 'Doa kebaikan dunia dan akhirat (sapu jagat)', n: 1, k: 'sapu jagat rabbana atina fid dunya hasanah akhirat neraka',
    ar: `رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ`,
    lat: `Rabbana atina fid dunya hasanah, wa fil akhirati hasanah, wa qina 'adzaban nar.`,
    tr: `Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka.`,
    f: `Doa yang paling sering dibaca Nabi.`, s: `QS. Al-Baqarah: 201; HR. Bukhari, Muslim` },
  { id: 'ortu', c: 'lindung', t: 'Doa untuk kedua orang tua', n: 1, k: 'orang tua ibu bapak ayah walidain wali dayya',
    ar: `رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا`,
    lat: `Rabbighfir li wa liwalidayya warhamhuma kama rabbayani shaghira.`,
    tr: `Ya Tuhanku, ampunilah aku dan kedua orang tuaku, dan sayangilah keduanya sebagaimana mereka menyayangiku di waktu kecil.`,
    f: `Lafaz yang populer; bagian akhirnya bersumber dari QS. Al-Isra: 24, bagian awalnya dari QS. Nuh: 28.`, s: `QS. Al-Isra: 24, QS. Nuh: 28` },
  { id: 'sedih', c: 'lindung', t: 'Doa dari kesedihan, kemalasan, dan utang', n: 1, k: 'sedih gundah cemas hutang utang malas kikir hammi hazan',
    ar: `اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ`,
    lat: `Allahumma inni a'udzu bika minal hammi wal hazan, wal 'ajzi wal kasal, wal bukhli wal jubn, wa dhala'id dayni wa ghalabatir rijal.`,
    tr: `Ya Allah, aku berlindung kepada-Mu dari kesusahan dan kesedihan, dari kelemahan dan kemalasan, dari kekikiran dan sifat pengecut, serta dari lilitan utang dan tekanan orang lain.`,
    f: `Sering dibaca Nabi pada pagi dan petang.`, s: `HR. Bukhari` },
  { id: 'hati', c: 'lindung', t: 'Doa keteguhan hati', n: 1, k: 'hati teguh iman muqallibal qulub istiqamah',
    ar: `يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ`,
    lat: `Ya muqallibal qulub, tsabbit qalbi 'ala dinik.`,
    tr: `Wahai Dzat yang membolak-balikkan hati, teguhkanlah hatiku di atas agama-Mu.`,
    f: `Doa yang sering dibaca Nabi.`, s: `HR. At-Tirmidzi` },
  { id: 'sakit', c: 'lindung', t: 'Doa ketika merasa sakit', n: 1, k: 'sakit nyeri ruqyah sembuh bismillah 7 kali',
    ar: `بِسْمِ اللَّهِ (٣×) أَعُوذُ بِعِزَّةِ اللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (٧×)`,
    lat: `Bismillah (3x). A'udzu bi'izzatillahi wa qudratihi min syarri ma ajidu wa uhadziru (7x).`,
    tr: `Dengan nama Allah (3 kali). Aku berlindung dengan keperkasaan Allah dan kekuasaan-Nya dari keburukan apa yang aku rasakan dan aku khawatirkan (7 kali).`,
    f: `Diletakkan tangan di bagian tubuh yang sakit. Doa tidak menggantikan pemeriksaan dan pengobatan medis.`, s: `HR. Muslim` },
  { id: 'ilmu', c: 'lindung', t: 'Doa menambah ilmu', n: 1, k: 'ilmu belajar sekolah kuliah ujian zidni ilma',
    ar: `رَبِّ زِدْنِي عِلْمًا`,
    lat: `Rabbi zidni 'ilma.`,
    tr: `Ya Tuhanku, tambahkanlah ilmu kepadaku.`,
    f: `Petikan ayat yang dibaca sebelum belajar.`, s: `QS. Thaha: 114` },
  { id: 'hasbi', c: 'lindung', t: 'Hasbiyallah (tawakal)', n: 1, k: 'hasbiyallah tawakal takut cemas hasbunallah',
    ar: `حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ`,
    lat: `Hasbiyallahu la ilaha illa huwa, 'alaihi tawakkaltu wa huwa rabbul 'arsyil 'azhim.`,
    tr: `Cukuplah Allah bagiku, tiada Tuhan selain Dia. Hanya kepada-Nya aku bertawakal, dan Dia Tuhan pemilik Arsy yang agung.`,
    f: `Ayat tawakal. Anjuran membacanya tujuh kali pagi dan petang berasal dari riwayat yang derajatnya diperselisihkan ulama; boleh dibaca sebagai doa tawakal.`, s: `QS. At-Taubah: 129` },
  { id: 'iftitah1', c: 'dalam', t: 'Doa iftitah: jauhkanlah aku dari kesalahan', n: 1, v: 0, k: 'iftitah pembuka shalat takbiratul ihram baid baini khathaya timur barat salju',
    ar: `اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ نَقِّنِي مِنْ خَطَايَايَ كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ، اللَّهُمَّ اغْسِلْنِي مِنْ خَطَايَايَ بِالثَّلْجِ وَالْمَاءِ وَالْبَرَدِ`,
    lat: `Allahumma ba'id baini wa baina khathayaya kama ba'adta bainal masyriqi wal maghrib. Allahumma naqqini min khathayaya kama yunaqqats tsaubul abyadhu minad danas. Allahummaghsilni min khathayaya bits tsalji wal ma'i wal barad.`,
    tr: `Ya Allah, jauhkanlah antara aku dan kesalahan-kesalahanku sebagaimana Engkau jauhkan antara timur dan barat. Ya Allah, bersihkanlah aku dari kesalahan-kesalahanku sebagaimana pakaian putih dibersihkan dari kotoran. Ya Allah, cucilah aku dari kesalahan-kesalahanku dengan salju, air, dan es.`,
    f: `Dibaca pelan sesudah takbiratul ihram dan sebelum Al-Fatihah pada rakaat pertama. Ada beberapa bacaan iftitah yang diajarkan Nabi; cukup pilih salah satu.`, s: `HR. Bukhari dan Muslim`, g: `Disepakati Bukhari dan Muslim` },
  { id: 'iftitah2', c: 'dalam', t: 'Doa iftitah: wajjahtu wajhiya', n: 1, v: 0, k: 'iftitah pembuka shalat wajjahtu wajhiya fatharas samawati hanifan',
    ar: `وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ، إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ، لَا شَرِيكَ لَهُ وَبِذَلِكَ أُمِرْتُ وَأَنَا أَوَّلُ الْمُسْلِمِينَ`,
    lat: `Wajjahtu wajhiya lilladzi fatharas samawati wal ardha hanifan wa ma ana minal musyrikin. Inna shalati wa nusuki wa mahyaya wa mamati lillahi rabbil 'alamin. La syarika lahu wa bidzalika umirtu wa ana awwalul muslimin.`,
    tr: `Aku hadapkan wajahku kepada Tuhan yang menciptakan langit dan bumi dengan lurus, dan aku bukan termasuk orang-orang musyrik. Sesungguhnya shalatku, ibadahku, hidupku, dan matiku hanyalah untuk Allah, Tuhan semesta alam. Tidak ada sekutu bagi-Nya; demikianlah aku diperintahkan, dan aku termasuk orang yang pertama berserah diri.`,
    f: `Pilihan iftitah yang lain. Dalam riwayat Muslim bacaan ini berlanjut dengan doa yang lebih panjang (tidak dimuat di sini). Sebagian ulama dan kebiasaan di Indonesia membaca penutupnya "wa ana minal muslimin".`, s: `HR. Muslim; ayat: QS. Al-An'am: 79, 162-163`, g: `Shahih (Muslim)` },
  { id: 'fatihah', c: 'dalam', t: 'Al-Fatihah (rukun setiap rakaat)', n: 1, v: 0, k: 'fatihah alfatihah ummul kitab rukun shalat basmalah amin',
    ar: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ`,
    lat: `Bismillahir rahmanir rahim. Alhamdulillahi rabbil 'alamin. Ar-rahmanir rahim. Maliki yaumid din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinash shirathal mustaqim. Shirathal ladzina an'amta 'alaihim, ghairil maghdhubi 'alaihim wa ladh dhallin.`,
    tr: `Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Segala puji bagi Allah, Tuhan semesta alam. Yang Maha Pengasih, Maha Penyayang. Pemilik hari pembalasan. Hanya kepada-Mu kami menyembah dan hanya kepada-Mu kami memohon pertolongan. Tunjukilah kami jalan yang lurus, yaitu jalan orang-orang yang telah Engkau beri nikmat, bukan jalan mereka yang dimurkai dan bukan pula jalan mereka yang sesat.`,
    f: `Dibaca pada setiap rakaat; menurut jumhur ulama shalat tidak sah tanpanya. Sesudah selesai diucapkan "Amin". Mazhab Syafi'i membaca basmalah sebagai ayat pertama Al-Fatihah; sebagian mazhab lain membacanya pelan atau tidak menjaharkannya.`, s: `HR. Bukhari dan Muslim (Ubadah bin Ash-Shamit)`, g: `Disepakati Bukhari dan Muslim` },
  { id: 'ruku', c: 'dalam', t: 'Bacaan ruku\'', n: 3, v: 0, k: 'ruku rukuk subhana rabbiyal azhim takbir',
    ar: `سُبْحَانَ رَبِّيَ الْعَظِيمِ`,
    lat: `Subhana rabbiyal 'azhim.`,
    tr: `Maha Suci Tuhanku Yang Maha Agung.`,
    f: `Dibaca tiga kali atau lebih ketika ruku'. Banyak orang menambah "wa bihamdih"; riwayat tambahan itu dinilai lemah oleh sebagian ulama hadits. Bacaan ruku' lain yang shahih: "Subbuhun quddusun rabbul malaikati war ruh".`, s: `HR. Muslim (Hudzaifah)`, g: `Shahih (Muslim)` },
  { id: 'itidal', c: 'dalam', t: 'Bacaan i\'tidal (bangkit dari ruku\')', n: 1, v: 0, k: 'itidal sami allahu liman hamidah rabbana lakal hamd bangun ruku',
    ar: `سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ، رَبَّنَا لَكَ الْحَمْدُ مِلْءَ السَّمَاوَاتِ وَمِلْءَ الْأَرْضِ وَمِلْءَ مَا شِئْتَ مِنْ شَيْءٍ بَعْدُ`,
    lat: `Sami'allahu liman hamidah. Rabbana lakal hamdu mil'as samawati wa mil'al ardhi wa mil'a ma syi'ta min syai'in ba'du.`,
    tr: `Allah mendengar (menerima) orang yang memuji-Nya. Wahai Tuhan kami, bagi-Mu segala puji sepenuh langit, sepenuh bumi, dan sepenuh apa yang Engkau kehendaki sesudahnya.`,
    f: `"Sami'allahu liman hamidah" diucapkan imam dan orang yang shalat sendiri ketika bangkit dari ruku'. Makmum mengucapkan "Rabbana lakal hamd" (boleh dengan "wa"). Kalimat sesudahnya adalah tambahan yang diajarkan Nabi.`, s: `HR. Bukhari dan Muslim; tambahan "mil'as samawat": HR. Muslim`, g: `Shahih` },
  { id: 'sujud', c: 'dalam', t: 'Bacaan sujud', n: 3, v: 0, k: 'sujud subhana rabbiyal a la sajdah',
    ar: `سُبْحَانَ رَبِّيَ الْأَعْلَى`,
    lat: `Subhana rabbiyal a'la.`,
    tr: `Maha Suci Tuhanku Yang Maha Tinggi.`,
    f: `Dibaca tiga kali atau lebih pada setiap sujud. Nabi bersabda bahwa keadaan paling dekat seorang hamba dengan Tuhannya adalah ketika sujud, maka perbanyaklah doa di dalamnya.`, s: `HR. Muslim`, g: `Shahih (Muslim)` },
  { id: 'duasujud', c: 'dalam', t: 'Duduk di antara dua sujud', n: 1, v: 0, k: 'duduk antara dua sujud rabbighfirli ampunan iftirasy',
    ar: `رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي`,
    lat: `Rabbighfir li, rabbighfir li.`,
    tr: `Ya Tuhanku, ampunilah aku. Ya Tuhanku, ampunilah aku.`,
    f: `Dibaca ketika duduk di antara dua sujud. Ada bacaan lain yang lebih panjang ("Allahummaghfirli warhamni wajburni warfa'ni warzuqni wahdini wa 'afini"); derajat riwayatnya dinilai berbeda-beda oleh ulama hadits.`, s: `HR. Abu Dawud, An-Nasa'i, Ibnu Majah (Hudzaifah)`, g: `Dinilai shahih oleh para ulama hadits` },
  { id: 'tasyahud', c: 'dalam', t: 'Tasyahud (tahiyyat)', n: 1, v: 0, k: 'tasyahud tahiyat tahiyyat attahiyyat tasyahud awal akhir duduk',
    ar: `التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ`,
    lat: `At-tahiyyatu lillahi wash-shalawatu wath-thayyibat. As-salamu 'alaika ayyuhan nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alaina wa 'ala 'ibadillahish shalihin. Asyhadu an la ilaha illallah, wa asyhadu anna Muhammadan 'abduhu wa rasuluh.`,
    tr: `Segala penghormatan, shalawat, dan kebaikan adalah milik Allah. Salam sejahtera atasmu wahai Nabi, juga rahmat Allah dan berkah-Nya. Salam sejahtera atas kami dan atas hamba-hamba Allah yang saleh. Aku bersaksi bahwa tiada Tuhan selain Allah, dan aku bersaksi bahwa Muhammad adalah hamba dan utusan-Nya.`,
    f: `Dibaca ketika duduk tasyahud awal dan tasyahud akhir. Pada tasyahud akhir dilanjutkan dengan shalawat, doa perlindungan, lalu salam.`, s: `HR. Bukhari dan Muslim (Ibnu Mas'ud)`, g: `Disepakati Bukhari dan Muslim` },
  { id: 'shalawatibrahim', c: 'dalam', t: 'Shalawat Ibrahimiyah (tasyahud akhir)', n: 1, v: 0, k: 'shalawat ibrahimiyah ibrahim tasyahud akhir salawat nabi',
    ar: `اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، وَبَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ فِي الْعَالَمِينَ إِنَّكَ حَمِيدٌ مَجِيدٌ`,
    lat: `Allahumma shalli 'ala Muhammad wa 'ala ali Muhammad, kama shallaita 'ala Ibrahim wa 'ala ali Ibrahim. Wa barik 'ala Muhammad wa 'ala ali Muhammad, kama barakta 'ala Ibrahim wa 'ala ali Ibrahim, fil 'alamin, innaka hamidum majid.`,
    tr: `Ya Allah, limpahkanlah shalawat kepada Muhammad dan keluarga Muhammad sebagaimana Engkau limpahkan shalawat kepada Ibrahim dan keluarga Ibrahim. Berkahilah Muhammad dan keluarga Muhammad sebagaimana Engkau berkahi Ibrahim dan keluarga Ibrahim, di seluruh alam. Sesungguhnya Engkau Maha Terpuji lagi Maha Mulia.`,
    f: `Dibaca setelah tasyahud pada duduk tasyahud akhir. Lafal "fil 'alamin" terdapat dalam riwayat Muslim.`, s: `HR. Bukhari dan Muslim`, g: `Shahih` },
  { id: 'sebelumsalam1', c: 'dalam', t: 'Sebelum salam: berlindung dari empat hal', n: 1, v: 0, k: 'sebelum salam doa tasyahud akhir azab kubur jahannam dajjal fitnah',
    ar: `اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ`,
    lat: `Allahumma inni a'udzu bika min 'adzabi jahannam, wa min 'adzabil qabr, wa min fitnatil mahya wal mamat, wa min syarri fitnatil masihid dajjal.`,
    tr: `Ya Allah, aku berlindung kepada-Mu dari azab Jahannam, dari azab kubur, dari fitnah kehidupan dan kematian, dan dari keburukan fitnah Al-Masih Ad-Dajjal.`,
    f: `Nabi memerintahkan untuk berlindung dari empat hal ini setelah selesai tasyahud akhir, sebelum salam.`, s: `HR. Muslim (Abu Hurairah)`, g: `Shahih (Muslim)` },
  { id: 'sebelumsalam2', c: 'dalam', t: 'Sebelum salam: doa Abu Bakar (ampunan)', n: 1, v: 0, k: 'sebelum salam doa abu bakar zhalamtu nafsi ampunan maghfirah',
    ar: `اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ`,
    lat: `Allahumma inni zhalamtu nafsi zhulman katsira, wa la yaghfirudz dzunuba illa anta, faghfirli maghfiratan min 'indika warhamni, innaka antal ghafurur rahim.`,
    tr: `Ya Allah, sungguh aku banyak menzalimi diriku sendiri, dan tidak ada yang mengampuni dosa selain Engkau. Maka ampunilah aku dengan ampunan dari sisi-Mu dan rahmatilah aku. Sesungguhnya Engkau Maha Pengampun lagi Maha Penyayang.`,
    f: `Doa yang diajarkan Nabi kepada Abu Bakar untuk dibaca di dalam shalat; waktu yang dianjurkan adalah di akhir shalat sebelum salam.`, s: `HR. Bukhari dan Muslim`, g: `Disepakati Bukhari dan Muslim` },
  { id: 'salamshalat', c: 'dalam', t: 'Salam penutup shalat', n: 1, v: 0, k: 'salam penutup shalat assalamualaikum menoleh kanan kiri',
    ar: `السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ`,
    lat: `Assalamu'alaikum wa rahmatullah.`,
    tr: `Semoga keselamatan dan rahmat Allah tercurah atas kalian.`,
    f: `Diucapkan sambil menoleh ke kanan, lalu ke kiri. Sebagian ulama menambahkan "wa barakatuh" pada salam yang pertama.`, s: `HR. Abu Dawud dan At-Tirmidzi (Ibnu Mas'ud)`, g: `At-Tirmidzi menilainya hasan shahih` },
  { id: 'qunut', c: 'dalam', t: 'Doa qunut (Subuh dan witir)', n: 1, v: 0, k: 'qunut subuh witir nazilah allahummahdini fiman hadait',
    ar: `اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ`,
    lat: `Allahummah-dini fiman hadait, wa 'afini fiman 'afait, wa tawallani fiman tawallait, wa barik li fima a'thait, wa qini syarra ma qadhait, fa innaka taqdhi wa la yuqdha 'alaik, wa innahu la yadzillu man walait, wa la ya'izzu man 'adait, tabarakta rabbana wa ta'alait.`,
    tr: `Ya Allah, berilah aku petunjuk bersama orang-orang yang telah Engkau beri petunjuk; berilah aku afiat bersama orang-orang yang telah Engkau beri afiat; pimpinlah aku bersama orang-orang yang telah Engkau pimpin; berkahilah apa yang Engkau berikan kepadaku; dan lindungilah aku dari keburukan yang Engkau tetapkan. Sesungguhnya Engkaulah yang menetapkan dan tidak ada yang menetapkan atas-Mu. Tidak akan hina orang yang Engkau bela, dan tidak akan mulia orang yang Engkau musuhi. Maha Suci Engkau, wahai Tuhan kami, lagi Maha Tinggi.`,
    f: `Dibaca sesudah i'tidal rakaat terakhir (Subuh) dan pada witir. Ulama berbeda pendapat tentang qunut pada shalat Subuh: mazhab Syafi'i dan Maliki menganggapnya sunnah, sedangkan mazhab Hanafi dan Hanbali tidak; keduanya pendapat ulama yang diakui.`, s: `HR. Abu Dawud, At-Tirmidzi, An-Nasa'i, Ibnu Majah (Al-Hasan bin Ali)`, g: `At-Tirmidzi menilainya hasan` },
  { id: 'jenguk1', c: 'jenguk', t: 'Ucapan saat menjenguk: la ba\'sa thahurun insya Allah', n: 1, v: 0, k: 'jenguk menjenguk orang sakit la ba\'sa la basa thahurun suci penghapus dosa insya allah bukhari',
    ar: `لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ`,
    lat: `La ba'sa thahurun insya Allah.`,
    tr: `Tidak mengapa, semoga (sakit ini) menjadi pembersih (dosa), jika Allah menghendaki.`,
    f: `Diucapkan Nabi ﷺ setiap menjenguk orang sakit. Maksudnya menenangkan hati orang yang sakit; arti "pembersih dosa" adalah terjemahan penyusun dari kata thahur.`, s: `HR. Bukhari no. 3616 (Ibnu Abbas)`, g: `Shahih (riwayat Bukhari)` },
  { id: 'jenguk2', c: 'jenguk', t: 'Doa menjenguk: as\'alullahal \'azhim (7 kali)', n: 7, v: 0, k: 'jenguk menjenguk orang sakit tujuh kali asalullahal azhim rabbal arsy yasyfiyak sembuh',
    ar: `أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ`,
    lat: `As'alullahal 'azhima rabbal 'arsyil 'azhimi an yasyfiyak.`,
    tr: `Aku memohon kepada Allah Yang Mahaagung, Tuhan pemilik Arasy yang agung, agar menyembuhkanmu.`,
    f: `Dibaca tujuh kali di dekat orang sakit yang ajalnya belum tiba. Dalam hadits disebut Allah akan menyembuhkannya kecuali bila ajalnya memang telah datang.`, s: `HR. Abu Dawud no. 3106; At-Tirmidzi no. 2083 (Ibnu Abbas)`, g: `Shahih menurut Al-Albani` },
  { id: 'jenguk3', c: 'jenguk', t: 'Doa kesembuhan: adzhibil ba\'sa rabban nas', n: 1, v: 0, k: 'sembuh kesembuhan menjenguk orang sakit adzhibil basa rabban nas isyfi antasy syafi la syifa illa syifauka aisyah',
    ar: `أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا`,
    lat: `Adzhibil ba'sa rabban nas, isyfi wa antasy syafi, la syifa'a illa syifa'uka, syifa'an la yughadiru saqama.`,
    tr: `Hilangkanlah penyakit ini, wahai Tuhan manusia. Sembuhkanlah, Engkaulah Maha Penyembuh. Tidak ada kesembuhan selain kesembuhan dari-Mu, kesembuhan yang tidak menyisakan penyakit.`,
    f: `Nabi ﷺ membacanya bila mendatangi orang sakit atau orang sakit dibawa kepada beliau. Lafaznya sedikit berbeda antarriwayat (riwayat Anas, Bukhari no. 5742, memakai susunan lain). Doa tidak menggantikan pemeriksaan dan pengobatan medis.`, s: `HR. Bukhari no. 5675; Muslim no. 2191 (Aisyah)`, g: `Disepakati Bukhari dan Muslim` },
  { id: 'jenguk4', c: 'jenguk', t: 'Doa melihat orang yang tertimpa cobaan', n: 1, v: 0, k: 'cobaan ujian musibah penyakit cacat melihat orang diuji alhamdulillah afani mimmabtalaka bihi',
    ar: `الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي مِمَّا ابْتَلَاكَ بِهِ، وَفَضَّلَنِي عَلَى كَثِيرٍ مِمَّنْ خَلَقَ تَفْضِيلًا`,
    lat: `Alhamdulillahilladzi 'afani mimma btalaka bihi, wa faddhalani 'ala katsirin mimman khalaqa tafdhila.`,
    tr: `Segala puji bagi Allah yang menyelamatkanku dari apa yang Dia timpakan kepadamu, dan melebihkanku di atas banyak makhluk yang Dia ciptakan dengan kelebihan yang nyata.`,
    f: `At-Tirmidzi mencatat riwayat ini dan menukil keterangan Abu Ja'far Muhammad bin Ali agar dibaca pelan, tidak terdengar oleh orang yang sedang diuji. Penilaian sanad jalur Umar (no. 3431) berbeda-beda antarulama; jalur Abu Hurairah (no. 3432) dinilai hasan gharib oleh At-Tirmidzi.`, s: `HR. At-Tirmidzi no. 3432 (Abu Hurairah); no. 3431 (Umar)`, g: `Hasan menurut At-Tirmidzi dan Al-Albani` },
];
// Panduan fiqih ringkas (pendapat yang umum di Indonesia, mazhab Syafi'i; ada perbedaan antarmazhab).
const IBX_GUIDE = [
  { id: 'g-wudhu', t: 'Tata cara wudhu', k: 'wudu wudhu bersuci rukun pembatal',
    intro: `Wudhu menghilangkan hadats kecil. Urutannya tertib:`,
    steps: [`Niat dalam hati untuk berwudhu, lalu ucapkan "Bismillah".`, `Basuh kedua telapak tangan, berkumur, dan membersihkan hidung (sunnah, tiga kali).`, `Basuh wajah, dari tempat tumbuh rambut hingga dagu, dan dari telinga ke telinga.`, `Basuh kedua tangan sampai siku, kanan dahulu.`, `Usap sebagian kepala, lalu telinga.`, `Basuh kedua kaki sampai mata kaki, kanan dahulu.`, `Baca doa setelah wudhu.`],
    note: `Pembatal wudhu: keluar sesuatu dari kemaluan atau dubur, tidur lelap yang tidak duduk mantap, hilang akal (pingsan, mabuk), dan menyentuh kemaluan dengan telapak tangan. Bersentuhan kulit dengan lawan jenis yang bukan mahram membatalkan menurut mazhab Syafi'i, tetapi tidak menurut sebagian mazhab lain.` },
  { id: 'g-tayamum', t: 'Tata cara tayamum', k: 'tayamum debu tidak ada air sakit bersuci pengganti wudhu',
    intro: `Tayamum adalah pengganti wudhu atau mandi wajib ketika air tidak ada atau tidak boleh dipakai (misalnya karena sakit).`,
    steps: [`Pastikan sudah masuk waktu shalat dan sudah berusaha mencari air.`, `Siapkan debu yang suci (tanah, dinding, atau permukaan berdebu).`, `Niat dalam hati agar boleh melakukan shalat, lalu ucapkan "Bismillah".`, `Tepukkan kedua telapak tangan ke debu, lalu usapkan ke wajah.`, `Tepukkan lagi ke debu, lalu usapkan ke kedua tangan sampai siku (menurut Syafi'i). Sebagian ulama cukup sampai pergelangan tangan.`],
    note: `Tayamum batal oleh hal-hal yang membatalkan wudhu, dan juga bila air ditemukan sebelum shalat. Menurut mazhab Syafi'i, satu tayamum untuk satu shalat fardhu.` },
  { id: 'g-mandi', t: 'Mandi wajib (junub / haid / nifas)', k: 'mandi wajib junub haid nifas ghusl janabah besar hadats',
    intro: `Mandi wajib menghilangkan hadats besar.`,
    steps: [`Sebab: keluar mani, berhubungan suami istri, berhenti dari haid atau nifas, dan wafat (kecuali syahid).`, `Niat dalam hati menghilangkan hadats besar.`, `Bersihkan kotoran dan najis pada badan lebih dulu, lalu berwudhu (sunnah).`, `Alirkan air ke seluruh tubuh sampai ke pangkal rambut dan sela-sela kulit; mulai dari kepala, lalu sisi kanan, lalu kiri.`],
    note: `Rukun mandi wajib hanya niat dan meratakan air ke seluruh tubuh; langkah lainnya adalah kesempurnaan.` },
  { id: 'g-jamak', t: 'Shalat jamak dan qashar (musafir)', k: 'jamak qashar qasar musafir safar perjalanan shalat jarak',
    intro: `Orang yang bepergian jauh (kira-kira 80 km atau lebih menurut pendapat yang umum) boleh memperingan shalat.`,
    steps: [`Qashar: meringkas shalat empat rakaat (Dzuhur, Ashar, Isya) menjadi dua rakaat. Subuh dan Maghrib tidak diringkas.`, `Jamak: menggabungkan Dzuhur dengan Ashar, atau Maghrib dengan Isya, pada waktu salah satunya (jamak taqdim di waktu yang pertama, jamak ta'khir di waktu yang kedua).`, `Niat jamak dan qashar diucapkan dalam hati saat takbiratul ihram.`, `Boleh dilakukan salah satunya saja, tidak harus keduanya.`],
    note: `Jarak, lama tinggal, dan syarat perjalanan berbeda antarmazhab. Untuk perjalanan yang tidak jelas, tanyakan kepada ustadz.` },
  { id: 'g-sahwi', t: 'Sujud sahwi (sujud karena lupa)', k: 'sujud sahwi lupa rakaat tasyahud awal ragu shalat',
    intro: `Sujud sahwi dilakukan untuk menutup kekurangan dalam shalat karena lupa.`,
    steps: [`Sebab umum: lupa tasyahud awal, lupa jumlah rakaat, atau menambah gerakan karena lupa.`, `Setelah tasyahud akhir dan shalawat, sebelum salam, sujud dua kali dengan duduk di antaranya.`, `Lalu salam.`],
    note: `Menurut mazhab Syafi'i dilakukan sebelum salam; sebagian ulama membedakan sebelum atau sesudah salam menurut sebabnya.` },
  { id: 'g-puasa', t: 'Pembatal puasa', k: 'puasa pembatal batal ramadhan makan minum lupa',
    intro: `Hal-hal yang membatalkan puasa:`,
    steps: [`Makan atau minum dengan sengaja.`, `Muntah dengan sengaja.`, `Berhubungan suami istri pada siang hari.`, `Keluar mani dengan sengaja.`, `Haid atau nifas.`, `Murtad.`],
    note: `Makan atau minum karena lupa tidak membatalkan puasa (HR. Bukhari, Muslim). Untuk kasus medis seperti suntik atau obat, tanyakan kepada ustadz dan dokter.` },
  { id: 'g-zakatfitrah', t: 'Zakat fitrah', k: 'zakat fitrah idul fitri ramadhan beras',
    intro: `Zakat fitrah wajib bagi setiap muslim yang mampu pada bulan Ramadhan, untuk dirinya dan orang yang ia tanggung.`,
    steps: [`Ukurannya satu sha' makanan pokok (sekitar 2,5 hingga 3 kg beras); lembaga zakat setempat menetapkan setara uangnya.`, `Waktu wajib mulai terbenam matahari akhir Ramadhan; paling utama ditunaikan sebelum shalat Idul Fitri.`, `Disalurkan kepada fakir miskin dan golongan penerima zakat lainnya.`],
    note: `Nominal uang berbeda tiap tahun dan daerah; periksa penetapan BAZNAS atau lembaga zakat setempat.` }
];
const IBX_AR = [24, 28, 32, 38, 46];   // ukuran huruf Arab (px) per tingkat
const IBX_TS_SH = [['Subhanallah', 'سُبْحَانَ اللَّهِ', 33], ['Alhamdulillah', 'الْحَمْدُ لِلَّهِ', 33], ['Allahu Akbar', 'اللَّهُ أَكْبَرُ', 34]];
const IBX_TS_PRE = [33, 99, 100, 1000, 0];
const IBX_SEARCH = [];   // fungsi(qNorm, tokens) -> [{ s: skor, h: html }]; diisi tahap berikutnya (ayat)
let ibxDoaCat = 'all', ibxQ = '', ibxSrOpen = false, ibxTsMsg = '';
const ibxDefTsb = () => ({ k: 'bebas', n: 0, t: 33, ph: 0, tot: {} });
function ibxCleanPref2(p, b) {   // dipanggil ibxClean: ukuran Arab, Latin, getar, favorit, tasbih
  const ar = Number(p.ar); b.pref.ar = Number.isInteger(ar) && ar >= 0 && ar < IBX_AR.length ? ar : 2;
  b.pref.lat = p.lat !== false;
  b.pref.vib = p.vib !== false;
  const ids = IBX_DOA.map(d => d.id);
  b.pref.fav = Array.isArray(p.fav) ? Array.from(new Set(p.fav.filter(v => typeof v === 'string' && ids.includes(v)))).slice(0, 100) : [];
  const t = p.tsb && typeof p.tsb === 'object' && !Array.isArray(p.tsb) ? p.tsb : {}, d = ibxDefTsb();
  d.k = t.k === 'sholat' ? 'sholat' : 'bebas';
  const lim = (v, lo, hi, dv) => { const x = Number(v); return Number.isInteger(x) && x >= lo && x <= hi ? x : dv; };
  d.n = lim(t.n, 0, 999999, 0);
  d.t = lim(t.t, 0, 99999, 33);
  d.ph = lim(t.ph, 0, 3, 0);
  if (t.tot && typeof t.tot === 'object' && !Array.isArray(t.tot)) {
    Object.keys(t.tot).filter(k => DATE_RE.test(k)).sort().slice(-90).forEach(k => { const v = lim(t.tot[k], 1, 1000000, 0); if (v) d.tot[k] = v; });
  }
  b.pref.tsb = d;
}
function ibxNorm(s) {   // normalisasi pencarian: huruf kecil, tanpa harakat Arab, ejaan Latin disamakan (dzikir = zikir, shalat = salat)
  let x = String(s == null ? '' : s).toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627').replace(/\u0649/g, '\u064A').replace(/\u0629/g, '\u0647')
    .replace(/[\u2019'`\u02BB\u02BF\u02BC\u2018]/g, '')
    .replace(/dz/g, 'z').replace(/dh/g, 'd').replace(/th/g, 't').replace(/kh/g, 'h').replace(/sh/g, 's').replace(/gh/g, 'g').replace(/ts/g, 's').replace(/q/g, 'k')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  x = x.split(' ').map(w => w === 'solat' || w === 'sholat' ? 'salat' : w === 'dua' ? 'doa' : w).join(' ');
  return x;
}
let ibxIdx = null;
function ibxIndex() {
  if (ibxIdx) return ibxIdx;
  const cl = id => (IBX_CAT.find(c => c[0] === id) || [0, ''])[1];
  ibxIdx = {
    doa: IBX_DOA.map(d => ({ d, t: ibxNorm(d.t), k: ibxNorm(d.k + ' ' + cl(d.c)), a: ibxNorm(d.tr), l: ibxNorm(d.lat), r: ibxNorm(d.ar) })),
    gd: IBX_GUIDE.map(g => ({ g, t: ibxNorm(g.t), k: ibxNorm(g.k), a: ibxNorm(g.intro + ' ' + g.steps.join(' ') + ' ' + (g.note || '')), l: '', r: '' }))
  };
  return ibxIdx;
}
function ibxScoreOf(row, toks) {
  let sum = 0;
  for (const w of toks) {
    let s = 0;
    if (row.t.includes(w)) s += (' ' + row.t).includes(' ' + w) ? 12 : 8;
    if (row.k.includes(w)) s += 6;
    if (row.a.includes(w)) s += 3;
    if (row.l.includes(w)) s += 2;
    if (row.r.includes(w)) s += 2;
    if (!s) return 0;   // setiap kata harus ketemu di salah satu bidang
    sum += s;
  }
  return sum;
}
function ibxSearch(q) {   // hasil urut skor: [{ s, h }]
  const n = ibxNorm(q), toks = n.split(' ').filter(Boolean);
  if (!toks.length) return [];
  const ix = ibxIndex(), out = [];
  ix.doa.forEach(r => { const s = ibxScoreOf(r, toks); if (s) out.push({ s, h: ibxDoaCard(r.d, true), id: r.d.id, kind: 'doa' }); });
  ix.gd.forEach(r => { const s = ibxScoreOf(r, toks); if (s) out.push({ s: s + 1, h: ibxGuideCard(r.g), id: r.g.id, kind: 'panduan' }); });
  IBX_SEARCH.forEach(f => { try { (f(n, toks) || []).forEach(x => out.push(x)); } catch (e) { /* abaikan */ } });
  return out.sort((a, b) => b.s - a.s).slice(0, 80);
}
const ibxStar = on => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"' + (on ? ' class="on"' : '') + '/></svg>';
function ibxDoaCard(d, showCat) {
  const fav = ibdb.pref.fav.includes(d.id), cat = (IBX_CAT.find(c => c[0] === d.c) || [0, ''])[1];
  return '<details class="ibx-doa" data-id="' + d.id + '"><summary><span class="t">' + esc(d.t) + '</span><span class="c">' + (showCat ? 'Doa · ' : '') + esc(cat) + '</span></summary><div class="ibx-db">' +
    '<p class="ibx-ar" lang="ar" dir="rtl">' + esc(d.ar) + '</p>' +
    (ibdb.pref.lat ? '<p class="ibx-lat">' + esc(d.lat) + '</p>' : '') +
    '<p class="ibx-tr">' + esc(d.tr) + '</p>' +
    (d.n > 1 ? '<p class="ibx-rp">Dibaca ' + d.n + ' kali</p>' : '') +
    '<p class="ibx-f"><b>Keutamaan / catatan.</b> ' + esc(d.f) + '</p><p class="ibx-src">' + esc(d.s) + (d.g ? ' · ' + esc(d.g) : '') + '</p>' +
    '<div class="ibx-da"><button class="ibx-mini" data-q="ibxFav" data-id="' + d.id + '" aria-pressed="' + fav + '">' + ibxStar(fav) + '<span>' + (fav ? 'Tersimpan' : 'Favorit') + '</span></button>' +
    '<button class="ibx-mini" data-q="ibxCopy" data-id="' + d.id + '"><span>Salin</span></button>' +
    (d.n > 1 && d.c !== 'dalam' ? '<button class="ibx-mini" data-q="ibxTsGo" data-id="' + d.id + '"><span>Hitung dengan tasbih</span></button>' : '') + '</div></div></details>';
}
function ibxGuideCard(g) {
  return '<details class="ibx-doa guide" data-id="' + g.id + '"><summary><span class="t">' + esc(g.t) + '</span><span class="c">Panduan fiqih</span></summary><div class="ibx-db"><p class="ibx-tr">' + esc(g.intro) + '</p><ol class="ibx-gs">' +
    g.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' + (g.note ? '<p class="ibx-f"><b>Catatan.</b> ' + esc(g.note) + '</p>' : '') +
    '<p class="ibx-src">Ringkasan umum (mazhab Syafi\'i); untuk kasus khusus tanyakan kepada ustadz.</p></div></details>';
}
/* ---------- tab Doa & dzikir ---------- */
function ibxMarkBtns() {
  const c = (ibdb.days[today()] || { c: [] }).c, one = (id, t) => '<button class="ibx-mini" data-q="ibxMark" data-id="' + id + '" aria-pressed="' + c.includes(id) + '">' + IBX_CHK + '<span>' + t + '</span></button>';
  return '<div class="ibx-da ibx-mk">' + one('dzpagi', 'Dzikir pagi selesai') + one('dzpetang', 'Dzikir petang selesai') + '</div>';
}
function ibxDoaPanel() {
  if (ibxDoaCat === 'paket' && ibxPkCurLive()) return ibxPkPlayerHtml();
  const p = ibdb.pref, chips = [['all', 'Semua'], ['fav', 'Favorit'], ['paket', 'Paket dzikir']].concat(IBX_CAT).concat([['panduan', 'Panduan fiqih']]);
  let list;
  if (ibxDoaCat === 'paket') list = ibxPkListHtml();
  else if (ibxDoaCat === 'panduan') list = IBX_GUIDE.map(ibxGuideCard).join('');
  else {
    const rows = ibxDoaCat === 'all' ? IBX_DOA : ibxDoaCat === 'fav' ? IBX_DOA.filter(d => p.fav.includes(d.id)) : IBX_DOA.filter(d => d.c === ibxDoaCat);
    list = rows.length ? rows.map(d => ibxDoaCard(d, false)).join('') : '<p class="ibx-empty">Belum ada doa favorit. Buka sebuah doa lalu ketuk Favorit.</p>';
  }
  return '<section class="ibx-card ibx-view"><h3>Tampilan teks</h3>' + ibxLookHtml() + '<div class="ibx-set"><div><b>Ukuran huruf Arab</b></div><div class="ibx-step"><button data-q="ibxAr" data-v="-1" aria-label="Perkecil huruf Arab"' + (p.ar <= 0 ? ' disabled' : '') + '>−</button><b lang="ar" class="ibx-arS" style="font-size:' + IBX_AR[p.ar] * 0.7 + 'px">أ</b><button data-q="ibxAr" data-v="1" aria-label="Perbesar huruf Arab"' + (p.ar >= IBX_AR.length - 1 ? ' disabled' : '') + '>+</button></div></div>' +
    '<div class="ibx-set"><div><b>Tampilkan tulisan Latin</b></div><button class="ibx-sw" role="switch" aria-checked="' + p.lat + '" aria-label="Tampilkan tulisan Latin" data-q="ibxLat"></button></div></section>' +
    '<div class="ibx-chips" role="group" aria-label="Kategori doa">' + chips.map(c => '<button class="ibx-chip" data-q="ibxCat" data-v="' + c[0] + '" aria-pressed="' + (ibxDoaCat === c[0]) + '">' + esc(c[1]) + '</button>').join('') + '</div>' +
    (ibxDoaCat === 'pagi' ? ibxMarkBtns() : '') +
    '<div class="ibx-dl" style="--ibar:' + IBX_AR[p.ar] + 'px">' + list + '</div>' +
    '<p class="ibx-fine">Teks doa ditulis ulang dari pengetahuan penyusun; mohon cocokkan dengan rujukan terpercaya (mis. Hisnul Muslim) sebelum dijadikan dalil.</p>';
}
IBX_PANEL.doa = ibxDoaPanel; IBX_READY.doa = true;
/* ===== IB2-A2: paket dzikir (pagi, petang, sebelum tidur, setelah shalat). Memakai doa yang SUDAH ada di IBX_DOA (id + jumlah n); tidak menyalin teks Arab. Membalik: patch_ib2a2a.py --reverse ===== */
// Tiap paket: m = id amalan Pelacak yang dicentang saat paket selesai (null = tidak ada amalan Pelacak untuk paket ini).
// Tiap langkah: d = id doa di IBX_DOA, n = jumlah bacaan, x = catatan khusus paket (opsional). Catatan x belum dicocokkan dengan rujukan cetak (v: 0), sama seperti doa A1.
const IBX_PK = [
  { id: 'pagi', t: 'Dzikir pagi', s: 'Sesudah Subuh sampai matahari naik', m: 'dzpagi', v: 0, steps: [
    { d: 'kursi', n: 1 }, { d: 'qul3', n: 3 }, { d: 'bikapagi', n: 1 }, { d: 'sayyidul', n: 1 },
    { d: 'radhitu', n: 3 }, { d: 'yadhurru', n: 3 }, { d: 'tasbih100', n: 100 }] },
  { id: 'petang', t: 'Dzikir petang', s: 'Sesudah Ashar sampai matahari terbenam', m: 'dzpetang', v: 0, steps: [
    { d: 'kursi', n: 1 }, { d: 'qul3', n: 3 }, { d: 'bikapetang', n: 1 }, { d: 'sayyidul', n: 1 },
    { d: 'radhitu', n: 3 }, { d: 'yadhurru', n: 3 }, { d: 'tasbih100', n: 100 }] },
  { id: 'tidur', t: 'Sebelum tidur', s: 'Ketika sudah berbaring di tempat tidur', m: null, v: 0, steps: [
    { d: 'kursi', n: 1 },
    { d: 'qul3', n: 3, x: 'Kumpulkan kedua telapak tangan, tiup ke dalamnya sambil membaca tiga surah ini, lalu usapkan ke seluruh tubuh yang terjangkau, dimulai dari kepala dan wajah. Lakukan tiga kali (HR. Bukhari).' },
    { d: 'tidur', n: 1 }] },
  { id: 'shalat', t: 'Setelah shalat wajib', s: 'Segera sesudah salam', m: null, v: 0, steps: [
    { d: 'istighfar3', n: 1 }, { d: 'tasbihshalat', n: 100 }, { d: 'tahlilshalat', n: 1 }] }
];
const ibxPkTotal = p => p.steps.reduce((a, s) => a + s.n, 0);
function ibxPkListHtml() {
  const c = (ibdb.days[today()] || { c: [] }).c;
  return IBX_PK.map(p => {
    const done = p.m && c.includes(p.m);
    return '<section class="ibx-card ibx-pk" data-pk="' + p.id + '"><h3>' + esc(p.t) + '</h3><p class="ibx-sub">' + esc(p.s) + '</p>' +
      '<p class="ibx-pkm">' + p.steps.length + ' langkah · ' + ibxPkTotal(p) + ' bacaan' + (done ? ' · <b class="ibx-pkok">Tercentang hari ini</b>' : '') + '</p>' +
      '<ol class="ibx-pkl">' + p.steps.map(s => { const d = IBX_DOA.find(x => x.id === s.d); return '<li>' + esc(d ? d.t : s.d) + (s.n > 1 && !(d && /kali\)/.test(d.t)) ? ' <em>' + s.n + 'x</em>' : '') + '</li>'; }).join('') + '</ol>' +
      '<div class="ibx-da"><button class="ibx-btn fill" data-q="ibxPkGo" data-id="' + p.id + '" data-fk="pk-' + p.id + '">' + esc(ibxPkLabel(p)) + '</button></div></section>';
  }).join('') + '<p class="ibx-fine">Paket memakai doa yang sama dengan daftar doa; urutan mengikuti kebiasaan umum dan boleh diubah sesuai rujukan yang Anda pakai.</p>';
}
/* ===== IB2-A2b: mode langkah demi langkah paket dzikir. Keadaan HANYA di memori (kedaluwarsa menurut tanggal), belum disimpan ke penyimpanan. Membalik: patch_ib2a2b.py --reverse ===== */
let ibxPkS = {}, ibxPkCur = null;   // ibxPkS[id] = { d: tanggal, i: langkah aktif, c: [hitungan tiap langkah], fin: bool }
const ibxPkDef = id => IBX_PK.find(p => p.id === id) || null;
function ibxPkGet(id) { const s = ibxPkS[id]; if (s && s.d !== today()) { delete ibxPkS[id]; return null; } return s || null; }
function ibxPkCurLive() { if (ibxPkCur && (!ibxPkDef(ibxPkCur) || !ibxPkGet(ibxPkCur))) ibxPkCur = null; return ibxPkCur; }
const ibxPkDoneN = (p, s) => s.c.filter((n, i) => n >= p.steps[i].n).length;
function ibxPkLabel(p) {
  const s = ibxPkGet(p.id); if (!s) return 'Mulai';
  if (s.fin) return 'Mulai lagi';
  const n = ibxPkDoneN(p, s);
  return n > 0 || s.i > 0 ? 'Lanjutkan · ' + n + '/' + p.steps.length + ' selesai' : 'Mulai';
}
function ibxPkFinish(p, s) {   // dipanggil saat SEMUA langkah beres: mencentang amalan Pelacak paket ini (bila ada). Idempoten; tidak pernah membatalkan centang.
  s.fin = true; s.mk = null;
  if (!p.m) return;
  if (ibxHidden(p.m)) { s.mk = 'hid'; return; }
  if (ibxHas(today(), p.m)) { s.mk = 'had'; return; }
  ibxToggle(today(), p.m); s.mk = 'new';
}
function ibxPkNote(p, s) {   // satu baris hasil di layar selesai
  if (!p.m || !s.mk) return '';
  const it = (IBX_ITEMS.find(i => i.id === p.m) || { t: p.m }).t;
  const m = { 'new': ['ok', 'Pelacak: "' + it + '" dicentang untuk hari ini.'], 'had': ['', 'Pelacak: "' + it + '" sudah tercentang sebelumnya.'], 'hid': ['', 'Amalan "' + it + '" disembunyikan di Pelacak, jadi tidak dicentang.'] }[s.mk];
  return m ? '<p class="ibx-pkr ' + m[0] + '" role="status">' + esc(m[1]) + '</p>' : '';
}
function ibxPkInner(p, s) {
  const N = p.steps.length, done = ibxPkDoneN(p, s);
  const head = '<div class="ibx-pkh"><h3>' + esc(p.t) + '</h3><button class="ibx-mini" data-q="ibxPkExit" data-fk="pk-x">Keluar</button></div>';
  if (s.fin) return head + '<div class="ibx-pkd"><p class="ibx-pkdt" role="status">Alhamdulillah, ' + esc(p.t.toLowerCase()) + ' selesai.</p><p class="ibx-sub">' + N + ' langkah, ' + ibxPkTotal(p) + ' bacaan.</p>' + ibxPkNote(p, s) + '<div class="ibx-da"><button class="ibx-btn fill" data-q="ibxPkExit" data-fk="pk-back">Kembali ke paket</button><button class="ibx-btn" data-q="ibxPkAgain" data-fk="pk-again">Ulangi</button></div></div>';
  const st = p.steps[s.i], d = IBX_DOA.find(x => x.id === st.d) || { t: st.d, ar: '', lat: '', tr: '', f: '', s: '' }, cnt = s.c[s.i], full = cnt >= st.n, last = s.i === N - 1;
  return head +
    '<div class="ibx-pkpr" role="status"><span>Langkah ' + (s.i + 1) + ' dari ' + N + '</span> <span class="ibx-bar"><i style="width:' + Math.round(done / N * 100) + '%"></i></span> <b>' + done + '/' + N + '</b></div>' +
    '<h4 class="ibx-pkt2">' + esc(d.t) + '</h4>' +
    '<div class="ibx-dl" style="--ibar:' + IBX_AR[ibdb.pref.ar] + 'px"><p class="ibx-ar" lang="ar" dir="rtl">' + esc(d.ar) + '</p>' +
    (ibdb.pref.lat ? '<p class="ibx-lat">' + esc(d.lat) + '</p>' : '') + '<p class="ibx-tr">' + esc(d.tr) + '</p></div>' +
    (st.n > 1 ? '<p class="ibx-rp">Dibaca ' + st.n + ' kali</p>' : '') +
    (st.x ? '<p class="ibx-f"><b>Catatan paket.</b> ' + esc(st.x) + '</p>' : '') +
    '<details class="ibx-pkf"><summary>Keutamaan dan sumber</summary><p class="ibx-f">' + esc(d.f) + '</p><p class="ibx-src">' + esc(d.s) + '</p></details>' +
    ((st.n > 1 && !full) || cnt > 0 ? '<div class="ibx-da">' + (st.n > 1 && !full ? '<button class="ibx-mini" data-q="ibxPkAll" data-fk="pk-all">Tandai selesai</button>' : '') + (cnt > 0 ? '<button class="ibx-mini" data-q="ibxPkZero" data-fk="pk-zero">Ulangi langkah ini</button>' : '') + '</div>' : '') +
    '<div class="ibx-pkbar">' +   // menempel di bawah layar supaya tombol ketuk selalu terjangkau walau teks Arab panjang
    (full ? '<p class="ibx-pkc" role="status">' + IBX_CHK + '<span>Langkah selesai</span></p>'
      : st.n === 1 ? '<button class="ibx-btn fill ibx-pkt" data-q="ibxPkTap" data-fk="pk-tap"><span>Sudah dibaca</span></button>'
      : '<button class="ibx-btn fill ibx-pkt" data-q="ibxPkTap" data-fk="pk-tap"><span>Ketuk tiap bacaan</span> <b>' + cnt + '/' + st.n + '</b></button>') +
    '<div class="ibx-pkn"><button class="ibx-mini" data-q="ibxPkPrev" data-fk="pk-prev"' + (s.i === 0 ? ' disabled' : '') + '>‹ Sebelumnya</button><button class="ibx-mini' + (full ? ' go' : '') + '" data-q="ibxPkNext" data-fk="pk-next">' + (last ? 'Selesai' : 'Lanjut ›') + '</button></div></div>';
}
function ibxPkPlayerHtml() { const p = ibxPkDef(ibxPkCur), s = ibxPkGet(ibxPkCur); return '<section class="ibx-card ibx-pkp" id="ibxPkBox">' + ibxPkInner(p, s) + '</section>'; }
function ibxPkPaint(top) {
  const b = $('#ibxPkBox'), p = ibxPkDef(ibxPkCur), s = ibxPkGet(ibxPkCur); if (!b || !p || !s) return;
  const ae = document.activeElement, fk = ae && b.contains(ae) && ae.dataset ? ae.dataset.fk : null;
  b.innerHTML = ibxPkInner(p, s);
  if (fk) { const el = b.querySelector('[data-fk="' + fk + '"]'); if (el && !el.disabled) el.focus({ preventScroll: true }); }
  if (top && b.getBoundingClientRect().top < 0) b.scrollIntoView({ block: 'start' });
}
function ibxPkCtx() { const p = ibxPkDef(ibxPkCur), s = ibxPkGet(ibxPkCur); return p && s ? [p, s] : null; }
function ibxPkAdvance(p, s) {   // langkah berikutnya; di langkah terakhir: selesai bila semua langkah beres, bila tidak lompat ke langkah pertama yang belum selesai
  if (s.i < p.steps.length - 1) { s.i++; return; }
  const k = s.c.findIndex((n, j) => n < p.steps[j].n);
  if (k < 0) ibxPkFinish(p, s); else { s.i = k; toast('Masih ada langkah yang belum selesai.'); }
}
QACT.ibxPkGo = b => {
  const p = ibxPkDef(b.dataset.id); if (!p) return;
  let s = ibxPkGet(p.id);
  if (!s || s.fin) s = ibxPkS[p.id] = { d: today(), i: 0, c: p.steps.map(() => 0), fin: false };
  ibxPkCur = p.id; ibxRender();
};
QACT.ibxPkExit = () => { ibxPkCur = null; ibxRender(); };
QACT.ibxPkTap = () => {
  const x = ibxPkCtx(); if (!x) return; const p = x[0], s = x[1], st = p.steps[s.i];
  if (s.fin || s.c[s.i] >= st.n) return;
  s.c[s.i]++;
  if (s.c[s.i] >= st.n) { ibxTsBuzz([70, 50, 70]); if (st.n === 1) { ibxPkAdvance(p, s); ibxPkPaint(true); return; } } else ibxTsBuzz(10);
  ibxPkPaint();
};
QACT.ibxPkAll = () => { const x = ibxPkCtx(); if (!x || x[1].fin) return; x[1].c[x[1].i] = x[0].steps[x[1].i].n; ibxTsBuzz([70, 50, 70]); ibxPkPaint(); };
QACT.ibxPkZero = () => { const x = ibxPkCtx(); if (!x || x[1].fin) return; x[1].c[x[1].i] = 0; ibxPkPaint(); };
QACT.ibxPkPrev = () => { const x = ibxPkCtx(); if (!x || x[1].fin) return; if (x[1].i > 0) x[1].i--; ibxPkPaint(true); };
QACT.ibxPkNext = () => { const x = ibxPkCtx(); if (!x || x[1].fin) return; ibxPkAdvance(x[0], x[1]); ibxPkPaint(true); };
QACT.ibxPkAgain = () => { const x = ibxPkCtx(); if (!x) return; x[1].c = x[0].steps.map(() => 0); x[1].i = 0; x[1].fin = false; ibxPkPaint(true); };
IBX_FRESH.push(() => { ibxPkCur = null; });
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2a2: Object.freeze({ pk: IBX_PK, total: ibxPkTotal, st: () => ibxPkS, cur: () => ibxPkCur }) }));
/* ===== IB2-B1: tab Sunnah (kerangka tab + 13 sunnah awal). Data ditulis dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b1.py --reverse ===== */
// Bidang: id (awalan sn-), c (kategori IBX_SNC), t (judul), p (cara mengamalkan), h (makna hadits, ringkas, BUKAN lafaz), s (sumber), g (derajat), n (catatan, opsional), k (kata kunci pencarian), v (0 = belum dicocokkan dengan kitab cetak)
const IBX_SNC = [["shalat", "Shalat sunnah"], ["bersih", "Bersuci & rapi"], ["makan", "Makan & minum"], ["akhlak", "Akhlak & pergaulan"], ["tidur", "Tidur"]];
const IBX_SUN = [
  { id: "sn-fajar", c: "shalat", t: "Dua rakaat sebelum Subuh", v: 0, g: "Shahih", k: "qabliyah subuh fajar rawatib dua rakaat kafirun ikhlas",
    p: "Setelah terbit fajar dan sebelum shalat Subuh, kerjakan dua rakaat yang ringan. Rasulullah ﷺ biasa membaca surah Al-Kafirun pada rakaat pertama dan Al-Ikhlas pada rakaat kedua.",
    h: "Aisyah ra. meriwayatkan bahwa Nabi ﷺ bersabda: dua rakaat fajar lebih baik daripada dunia dan seisinya.",
    s: "HR. Muslim no. 725; bacaan surahnya: HR. Muslim no. 726" },
  { id: "sn-dhuha", c: "shalat", t: "Shalat Dhuha", v: 0, g: "Shahih", k: "dhuha duha sedekah pagi ruas tulang",
    p: "Kerjakan dua rakaat atau lebih setelah matahari naik (kira-kira 15 menit setelah terbit) sampai menjelang waktu Zhuhur.",
    h: "Abu Dzar ra. meriwayatkan sabda Nabi ﷺ: setiap pagi, setiap ruas tulang kalian memiliki kewajiban sedekah; semuanya itu telah tercukupi oleh dua rakaat yang dikerjakan seseorang pada waktu Dhuha.",
    s: "HR. Muslim no. 720" },
  { id: "sn-rawatib", c: "shalat", t: "Shalat sunnah rawatib", v: 0, g: "Shahih", k: "rawatib qabliyah badiyah sebelum sesudah zhuhur maghrib isya dua belas rumah surga",
    p: "Biasakan shalat sunnah yang mengiringi shalat wajib: dua rakaat sebelum Subuh, empat sebelum Zhuhur, dua sesudah Zhuhur, dua sesudah Maghrib, dan dua sesudah Isya: total 12 rakaat.",
    h: "Ummu Habibah ra. meriwayatkan sabda Nabi ﷺ: tidaklah seorang hamba muslim shalat sunnah karena Allah dua belas rakaat setiap hari, selain shalat wajib, kecuali Allah membangunkan baginya sebuah rumah di surga.",
    n: "Ada riwayat lain yang menyebut 10 rakaat (dua sebelum Zhuhur, bukan empat); keduanya diamalkan para ulama.",
    s: "HR. Muslim no. 728; perincian 12 rakaat: HR. Tirmidzi (Aisyah); riwayat 10 rakaat: HR. Bukhari dan Muslim (Ibnu Umar)" },
  { id: "sn-witir", c: "shalat", t: "Shalat witir", v: 0, g: "Shahih", k: "witir ganjil sebelum tidur akhir malam wasiat",
    p: "Kerjakan witir dalam jumlah rakaat ganjil setelah shalat Isya. Bila khawatir tidak bangun di akhir malam, kerjakan sebelum tidur; bila yakin bisa bangun, lebih utama diakhirkan ke akhir malam.",
    h: "Abu Hurairah ra. berkata: kekasihku (Nabi ﷺ) berwasiat kepadaku tiga hal: puasa tiga hari setiap bulan, dua rakaat Dhuha, dan shalat witir sebelum aku tidur.",
    s: "HR. Bukhari no. 1981 dan Muslim no. 721; waktu witir di akhir malam: HR. Muslim no. 755 (Jabir)" },
  { id: "sn-siwak", c: "bersih", t: "Bersiwak", v: 0, g: "Shahih", k: "siwak sikat gigi gigi mulut bangun tidur wudhu",
    p: "Bersiwak atau menyikat gigi ketika bangun tidur, saat berwudhu, dan sebelum shalat.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: seandainya tidak memberatkan umatku, niscaya kuperintahkan mereka bersiwak setiap kali hendak shalat. Hudzaifah ra. berkata bahwa bila Nabi ﷺ bangun di malam hari, beliau menggosok mulutnya dengan siwak.",
    s: "HR. Bukhari no. 887 dan Muslim no. 252; bangun malam: HR. Bukhari no. 245 dan Muslim no. 255" },
  { id: "sn-fitrah", c: "bersih", t: "Lima kebiasaan fitrah", v: 0, g: "Shahih", k: "fitrah kuku kumis ketiak bulu kemaluan khitan potong kuku cukur",
    p: "Rawat diri secara rutin: mencukur bulu kemaluan, memotong kumis, memotong kuku, dan mencabut atau mencukur bulu ketiak. Jangan dibiarkan lebih dari 40 hari.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: fitrah itu ada lima: khitan, mencukur bulu kemaluan, memotong kumis, memotong kuku, dan mencabut bulu ketiak. Anas ra. berkata bahwa kami diberi batas waktu untuk tidak membiarkannya lebih dari empat puluh malam.",
    n: "Khitan dilakukan sekali seumur hidup; empat lainnya diulang berkala.",
    s: "HR. Bukhari no. 5889 dan Muslim no. 257; batas 40 hari: HR. Muslim no. 258" },
  { id: "sn-kanan", c: "bersih", t: "Mendahulukan yang kanan", v: 0, g: "Shahih", k: "kanan tangan kanan sandal sepatu sisir wudhu tayammun",
    p: "Mulailah dengan sisi kanan ketika memakai sandal atau sepatu, bersisir, berwudhu, dan dalam urusan baik lainnya.",
    h: "Aisyah ra. berkata: Nabi ﷺ senang mendahulukan yang kanan dalam memakai sandal, bersisir, bersuci, dan dalam seluruh urusannya.",
    s: "HR. Bukhari no. 168 dan Muslim no. 268" },
  { id: "sn-makan", c: "makan", t: "Adab dasar makan", v: 0, g: "Shahih", k: "makan bismillah tangan kanan terdekat adab makan",
    p: "Ucapkan Bismillah, makan dengan tangan kanan, dan ambil makanan yang ada di dekatmu.",
    h: "Umar bin Abi Salamah ra. berkata: Nabi ﷺ bersabda kepadaku yang kala itu masih kecil: wahai anak, sebutlah nama Allah, makanlah dengan tangan kananmu, dan makanlah dari yang ada di dekatmu.",
    n: "Doa sebelum dan sesudah makan ada di tab Doa & dzikir, kategori Makan & minum.",
    s: "HR. Bukhari no. 5376 dan Muslim no. 2022" },
  { id: "sn-cela", c: "makan", t: "Tidak mencela makanan", v: 0, g: "Shahih", k: "cela makanan masakan tidak suka syukur",
    p: "Bila suka, makanlah; bila tidak suka, tinggalkan tanpa mencela atau menjelek-jelekkan masakan.",
    h: "Abu Hurairah ra. berkata: Nabi ﷺ tidak pernah mencela makanan sedikit pun; bila beliau suka, beliau memakannya, dan bila tidak suka, beliau meninggalkannya.",
    s: "HR. Bukhari no. 5409 dan Muslim no. 2064" },
  { id: "sn-minum", c: "makan", t: "Minum dengan tiga kali napas", v: 0, g: "Shahih", k: "minum napas tiga tegukan gelas bejana",
    p: "Minumlah perlahan dalam tiga tegukan dan bernapaslah di luar gelas, tidak di dalamnya.",
    h: "Anas ra. berkata: Nabi ﷺ biasa bernapas tiga kali ketika minum. Abu Qatadah ra. meriwayatkan sabda beliau: bila salah seorang kalian minum, janganlah bernapas di dalam bejana.",
    n: "Para ulama menjelaskan maksud tiga napas itu sebagai tiga tegukan, dengan menjauhkan gelas dari mulut saat bernapas.",
    s: "HR. Bukhari no. 5631 dan Muslim no. 2028; larangan bernapas di bejana: HR. Bukhari no. 153 dan Muslim no. 267" },
  { id: "sn-salam", c: "akhlak", t: "Menyebarkan salam", v: 0, g: "Shahih", k: "salam assalamualaikum sapa saling mencintai",
    p: "Ucapkan salam kepada sesama muslim ketika bertemu, dan jawablah salam dengan yang lebih baik atau yang semisal.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: kalian tidak akan masuk surga sampai kalian beriman, dan kalian tidak beriman sampai saling mencintai. Maukah kutunjukkan sesuatu yang bila kalian kerjakan kalian saling mencintai? Sebarkanlah salam di antara kalian.",
    s: "HR. Muslim no. 54; menjawab salam: QS. An-Nisa: 86" },
  { id: "sn-senyum", c: "akhlak", t: "Menyambut dengan wajah ceria", v: 0, g: "Shahih", k: "senyum wajah ceria ramah sedekah kebaikan",
    p: "Sambutlah orang lain dengan wajah ramah dan senyum. Ini kebaikan yang ringan tetapi bernilai di sisi Allah.",
    h: "Abu Dzar ra. meriwayatkan sabda Nabi ﷺ: janganlah engkau meremehkan kebaikan sedikit pun, walaupun hanya dengan menjumpai saudaramu dengan wajah yang ceria.",
    s: "HR. Muslim no. 2626" },
  { id: "sn-tidur", c: "tidur", t: "Berwudhu dan miring ke kanan sebelum tidur", v: 0, g: "Shahih", k: "tidur wudhu miring kanan sebelum tidur fitrah berbaring",
    p: "Sebelum tidur, berwudhulah seperti wudhu untuk shalat, berbaringlah miring ke sisi kanan, lalu bacalah doa sebelum tidur.",
    h: "Al-Bara bin Azib ra. meriwayatkan sabda Nabi ﷺ: bila engkau hendak mendatangi tempat tidurmu, berwudhulah seperti wudhu untuk shalat, lalu berbaringlah di sisi kananmu, kemudian bacalah doa tidur. Beliau menambahkan: bila engkau meninggal pada malam itu, engkau meninggal di atas fitrah.",
    n: "Doa sebelum tidur dan paket dzikir sebelum tidur ada di tab Doa & dzikir.",
    s: "HR. Bukhari no. 247 dan Muslim no. 2710" }
];
let ibxSnCat = "all", ibxSnIdx = null;
const ibxSnLabel = c => (IBX_SNC.find(x => x[0] === c) || [0, ""])[1];
function ibxSnCard(s, showKind) {
  return '<details class="ibx-doa ibx-sn" data-id="' + esc(s.id) + '"' + (ibxSnHas(today(), s.id) ? ' data-done="1"' : "") + '><summary><span class="t">' + esc(s.t) + '</span><span class="c">' + (showKind ? "Sunnah · " : "") + esc(ibxSnLabel(s.c)) + " · " + esc(s.g) + '</span></summary><div class="ibx-db">' +
    '<p class="ibx-tr"><b>Cara mengamalkan.</b> ' + esc(s.p) + "</p>" +
    '<p class="ibx-snh"><b>Dalil (makna hadits).</b> ' + esc(s.h) + "</p>" +
    (s.n ? '<p class="ibx-f"><b>Catatan.</b> ' + esc(s.n) + "</p>" : "") +
    '<p class="ibx-src">' + esc(s.s) + " · " + esc(s.g) + '</p><div class="ibx-da">' + ibxSnMarkBtn(s.id, "Sudah saya amalkan hari ini") + "</div></div></details>";
}
function ibxSnPanel() {
  const chips = [["all", "Semua"]].concat(IBX_SNC), rows = ibxSnCat === "all" ? IBX_SUN : IBX_SUN.filter(s => s.c === ibxSnCat);
  return '<section class="ibx-card ibx-snhd"><h3>Sunnah sehari-hari</h3><p class="ibx-tr">' + IBX_SUN.length + " sunnah Rasulullah ﷺ untuk keseharian. Ketuk kartu untuk melihat cara mengamalkan dan dalilnya.</p></section>" +
    '<div class="ibx-chips" role="group" aria-label="Kategori sunnah">' + chips.map(c => '<button class="ibx-chip" data-q="ibxSnCat" data-v="' + c[0] + '" aria-pressed="' + (ibxSnCat === c[0]) + '">' + esc(c[1]) + "</button>").join("") + "</div>" +
    '<p class="ibx-cnt">' + rows.length + " sunnah</p>" +
    '<div class="ibx-dl">' + rows.map(s => ibxSnCard(s, false)).join("") + "</div>" +
    '<p class="ibx-fine">Sunnah dan dalil ditulis ulang dari pengetahuan penyusun; terjemah hadits berupa makna ringkas, bukan lafaz. Nomor hadits mengikuti penomoran yang lazim (Fathul Bari untuk Bukhari, Muhammad Fuad Abdul Baqi untuk Muslim) dan belum dicocokkan dengan kitab cetak. Mohon periksa di Riyadhus Shalihin atau Bulughul Maram sebelum dijadikan dalil.</p>';
}
QACT.ibxSnCat = b => { const v = b && b.dataset ? b.dataset.v : ""; ibxSnCat = v === "all" || IBX_SNC.some(c => c[0] === v) ? v : "all"; ibxRender(); };
IBX_PANEL.sunnah = ibxSnPanel; IBX_READY.sunnah = true;
IBX_FRESH.push(() => { ibxSnCat = "all"; });
IBX_SEARCH.push(function (n, toks) {   // cari: judul, kata kunci, cara mengamalkan, dalil
  if (!ibxSnIdx) ibxSnIdx = IBX_SUN.map(s => ({ s, r: { t: ibxNorm(s.t), k: ibxNorm(s.k + " sunnah " + ibxSnLabel(s.c)), a: ibxNorm(s.p + " " + s.h), l: "", r: "" } }));
  const out = [];
  ibxSnIdx.forEach(x => { const sc = ibxScoreOf(x.r, toks); if (sc) out.push({ s: sc, h: ibxSnCard(x.s, true), id: x.s.id, kind: "sunnah" }); });
  return out;
});
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2b: Object.freeze({ sun: IBX_SUN, cat: IBX_SNC, cur: () => ibxSnCat, card: ibxSnCard }) }));
/* ===== IB2-B2a: kartu "Sunnah hari ini" di tab Hari ini. Pilihan deterministik menurut tanggal (tanpa penyimpanan baru, tanpa acak). Membalik: patch_ib2b2a.py --reverse ===== */
function ibxSnDayNo(ds) {   // nomor hari sejak 1 Jan 1970 dari teks tanggal YYYY-MM-DD (0 bila tidak valid)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ds || "");
  return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : 0;
}
function ibxSnGcd(a, b) { return b ? ibxSnGcd(b, a % b) : a; }
function ibxSnPick(ds) {   // indeks sunnah untuk tanggal: nomor hari x langkah k mod jumlah; k = yang pertama dari 7, 5, 3, 2, 1 yang saling prima dengan jumlah, jadi tiap sunnah tampil tepat sekali dalam n hari berurutan dan kategori bergantian
  const n = IBX_SUN.length;
  if (!n) return -1;
  const k = [7, 5, 3, 2, 1].find(x => ibxSnGcd(x, n) === 1);
  return ((ibxSnDayNo(ds) * k) % n + n) % n;
}
function ibxSnTodayCard() {
  const s = IBX_SUN[ibxSnPick(today())];
  if (!s) return "";
  return '<section class="ibx-card ibx-snt" aria-label="Sunnah hari ini"><h3>Sunnah hari ini</h3><p class="ibx-snk">' + esc(ibxSnLabel(s.c)) + " · " + esc(s.g) + '</p><p class="ibx-snn">' + esc(s.t) + '</p><p class="ibx-tr">' + esc(s.p) + '</p>' +
    '<div class="ibx-da ibx-snr">' + ibxSnMarkBtn(s.id, "Sudah saya amalkan") + '<button class="ibx-lnk" data-q="ibxSnGo" data-id="' + esc(s.id) + '" data-fk="sngo">Lihat dalil dan sumbernya &rsaquo;</button></div></section>';
}
QACT.ibxSnGo = b => {   // buka tab Sunnah dengan kategori Semua, kartu sunnah itu terbuka dan digulir ke pandangan
  const id = b && b.dataset ? b.dataset.id : "";
  if (!IBX_SUN.some(s => s.id === id)) return;
  ibxSnCat = "all";
  QACT.ibxTab({ dataset: { v: "sunnah" } });
  const el = document.querySelector('#ibBody .ibx-sn[data-id="' + id + '"]');
  if (el) { el.open = true; if (el.scrollIntoView) { el.scrollIntoView({ block: "center" }); const sm = el.querySelector("summary"); if (sm && sm.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" }); } }   // IB2-B3c1: kartu yang terbuka lebih tinggi dari layar: judul tidak boleh terpotong di atas
};
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2b2: Object.freeze({ pick: ibxSnPick, dayNo: ibxSnDayNo, card: ibxSnTodayCard }) }));
/* ===== IB2-B2b1: lapisan data "sunnah sudah diamalkan" (bidang `s` di ibdb.days[d]; hanya data, tombolnya di B2b2). Membalik: patch_ib2b2b1.py --reverse ===== */
function ibxCleanSn(x, out) {   // dipanggil ibxClean: x = hari mentah, out = hari bersih; `s` hanya ada bila tidak kosong (hari lama tetap {c, u})
  const ids = IBX_SUN.map(z => z.id);
  const s = Array.isArray(x.s) ? Array.from(new Set(x.s.filter(v => typeof v === "string" && ids.includes(v)))) : [];
  if (s.length) out.s = s;
}
const ibxSnAny = x => !!(x && Array.isArray(x.s) && x.s.length);
const ibxSnHas = (d, id) => { const x = ibdb.days[d]; return !!x && Array.isArray(x.s) && x.s.includes(id); };
function ibxSnToggle(d, id) {   // true = kini tercatat diamalkan; false = dihapus atau masukan tidak valid (tidak ada yang diubah)
  if (!DATE_RE.test(d) || !IBX_SUN.some(z => z.id === id)) return false;
  const x = ibdb.days[d] || (ibdb.days[d] = { c: [], u: 0 });
  const s = Array.isArray(x.s) ? x.s : (x.s = []);
  const i = s.indexOf(id);
  if (i >= 0) s.splice(i, 1); else s.push(id);
  if (!s.length) delete x.s;
  x.u = Date.now();
  ibxSave();
  return ibxSnHas(d, id);
}
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2bm: Object.freeze({ has: ibxSnHas, toggle: ibxSnToggle, any: ibxSnAny, clean: ibxClean }) }));
/* ===== IB2-B2b2: tombol "Sudah saya amalkan" di kartu Sunnah hari ini dan di kartu daftar Sunnah (memakai ibxSnToggle dari B2b1). Membalik: patch_ib2b2b2.py --reverse ===== */
function ibxSnMarkBtn(id, label) {   // data-d = tanggal saat digambar; bila sudah lewat tengah malam, ketukan hanya menggambar ulang (tidak mencatat ke hari yang salah)
  const d = today();
  return '<button class="ibx-mini" data-q="ibxSnMark" data-id="' + esc(id) + '" data-d="' + d + '" aria-pressed="' + ibxSnHas(d, id) + '">' + IBX_CHK + "<span>" + esc(label) + "</span></button>";
}
QACT.ibxSnMark = b => {
  const id = b && b.dataset ? b.dataset.id : "";
  if (!IBX_SUN.some(z => z.id === id)) return;
  if (b.dataset.d !== today()) { ibxRender(); return; }
  const on = ibxSnToggle(b.dataset.d, id);
  document.querySelectorAll('#ibBody [data-q="ibxSnMark"]').forEach(x => { if (x.dataset.id === id) x.setAttribute("aria-pressed", String(on)); });
  document.querySelectorAll("#ibBody .ibx-sn").forEach(x => { if (x.dataset.id === id) { if (on) x.setAttribute("data-done", "1"); else x.removeAttribute("data-done"); } });
  ibxSnWeekUpd();
};
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2bn: Object.freeze({ btn: ibxSnMarkBtn }) }));
/* ===== IB2-B3a1: data sunnah tahap 1: kategori baru "Pakaian & penampilan" + 4 sunnah (sisipan, data tetap dikelompokkan per kategori). Data ditulis dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3a1.py --reverse ===== */
function ibxSnAddCat(afterKey, cat) {   // sisipkan kategori sesudah kategori afterKey (urutan chip = urutan kategori)
  const i = IBX_SNC.findIndex(c => c[0] === afterKey);
  if (i >= 0 && !IBX_SNC.some(c => c[0] === cat[0])) IBX_SNC.splice(i + 1, 0, cat);
}
function ibxSnAddAfter(afterId, items) {   // sisipkan sunnah sesudah sunnah afterId; id yang sudah ada dilewati
  const i = IBX_SUN.findIndex(s => s.id === afterId);
  if (i < 0) return;
  IBX_SUN.splice(i + 1, 0, ...items.filter(x => !IBX_SUN.some(s => s.id === x.id)));
}
ibxSnAddCat("bersih", ["pakaian", "Pakaian & penampilan"]);
ibxSnAddAfter("sn-kanan", [
  { id: "sn-putih", c: "pakaian", t: "Memakai pakaian putih", v: 0, g: "Shahih", k: "pakaian putih baju putih warna terbaik kafan",
    p: "Bila memungkinkan, pilih pakaian putih untuk dikenakan. Ini anjuran, bukan kewajiban; pakaian berwarna lain yang sopan tetap boleh.",
    h: "Ibnu Abbas ra. meriwayatkan sabda Nabi ﷺ: kenakanlah pakaian yang putih, karena ia termasuk pakaian kalian yang terbaik, dan kafanilah orang-orang yang meninggal di antara kalian dengannya.",
    s: "HR. Abu Dawud, Tirmidzi, dan Ibnu Majah (Ibnu Abbas); dinilai shahih oleh Al-Albani" },
  { id: "sn-wangi", c: "pakaian", t: "Tidak menolak wewangian", v: 0, g: "Shahih", k: "wangi wewangian parfum minyak wangi harum misk",
    p: "Gunakan wewangian untuk menjaga penampilan dan bau badan, dan jangan menolak wewangian yang ditawarkan kepadamu.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: barangsiapa ditawari wewangian, janganlah ia menolaknya, karena ia ringan dibawa dan harum baunya.",
    n: "Para ulama memberi ketentuan tambahan bagi perempuan yang keluar rumah: wewangiannya tidak boleh menyebar kepada laki-laki yang bukan mahram.",
    s: "HR. Muslim no. 2253" },
  { id: "sn-sandal", c: "pakaian", t: "Tidak berjalan dengan satu sandal", v: 0, g: "Shahih", k: "sandal sepatu satu sandal dua sandal alas kaki berjalan",
    p: "Pakailah kedua sandal atau sepatu sekaligus, atau lepaskan keduanya; jangan berjalan dengan satu saja.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: janganlah salah seorang kalian berjalan dengan satu sandal; pakailah keduanya atau lepaskan keduanya.",
    n: "Mendahulukan kaki kanan saat memakai sandal dibahas di sunnah \"Mendahulukan yang kanan\".",
    s: "HR. Bukhari no. 5855 dan Muslim no. 2097" },
  { id: "sn-rapi", c: "pakaian", t: "Berpenampilan rapi tanpa sombong", v: 0, g: "Shahih", k: "rapi bersih penampilan pakaian bagus indah sombong keindahan",
    p: "Rapikan pakaian dan penampilan serta jaga kebersihannya, dengan niat merawat diri, bukan untuk membanggakan diri atau meremehkan orang lain.",
    h: "Ibnu Mas'ud ra. meriwayatkan bahwa seorang laki-laki berkata ia ingin pakaian dan sandalnya bagus. Nabi ﷺ bersabda: sesungguhnya Allah itu indah dan menyukai keindahan; sombong itu menolak kebenaran dan meremehkan manusia.",
    s: "HR. Muslim no. 91" }
]);
/* ===== IB2-B3a2: data sunnah tahap 2: kategori baru "Keluar rumah & bepergian" + 5 sunnah (memakai pembantu dari B3a1). Data ditulis dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3a2.py --reverse ===== */
ibxSnAddCat("akhlak", ["keluar", "Keluar rumah & bepergian"]);
ibxSnAddAfter("sn-senyum", [
  { id: "sn-langkah", c: "keluar", t: "Berangkat ke masjid dalam keadaan suci", v: 0, g: "Shahih", k: "masjid berjalan kaki langkah wudhu rumah suci berangkat shalat berjamaah derajat dosa",
    p: "Berwudhulah di rumah, lalu berjalan ke masjid untuk menunaikan shalat wajib berjamaah.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: barangsiapa bersuci di rumahnya, lalu berjalan ke salah satu rumah Allah untuk menunaikan salah satu kewajiban dari Allah, maka langkah-langkahnya: satu langkah menghapus kesalahan dan langkah berikutnya mengangkat derajat.",
    s: "HR. Muslim no. 666" },
  { id: "sn-tenang", c: "keluar", t: "Berjalan tenang menuju shalat", v: 0, g: "Shahih", k: "iqamah tenang tergesa gesa berlari masbuk berjalan menuju shalat sakinah wibawa",
    p: "Bila iqamah sudah dikumandangkan, berjalanlah menuju shalat dengan tenang dan tidak tergesa-gesa. Ikutilah bagian shalat yang sempat didapat, lalu sempurnakan yang terlewat.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bila kalian mendengar iqamah, berjalanlah menuju shalat dengan tenang dan berwibawa, janganlah tergesa-gesa; apa yang kalian dapati, shalatlah, dan apa yang terlewat, sempurnakanlah.",
    s: "HR. Bukhari no. 636 dan Muslim no. 602" },
  { id: "sn-teman", c: "keluar", t: "Tidak bepergian sendirian", v: 0, g: "Shahih", k: "bepergian safar sendirian teman rombongan perjalanan malam pengendara",
    p: "Bila bepergian jauh, terutama pada malam hari, usahakan bersama teman atau rombongan.",
    h: "Abdullah bin Umar ra. meriwayatkan sabda Nabi ﷺ: seandainya manusia mengetahui apa yang ada pada kesendirian seperti yang aku ketahui, niscaya tidak ada seorang pengendara pun yang bepergian sendirian pada malam hari.",
    n: "Para ulama memahaminya sebagai anjuran dan adab, terutama untuk perjalanan yang berisiko.",
    s: "HR. Bukhari no. 2998" },
  { id: "sn-pulang", c: "keluar", t: "Segera pulang setelah urusan selesai", v: 0, g: "Shahih", k: "pulang safar bepergian segera kembali keluarga urusan selesai perjalanan",
    p: "Setelah urusan di perjalanan selesai, segeralah kembali kepada keluarga dan jangan menunda tanpa keperluan.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bepergian itu bagian dari azab; ia menghalangi seseorang dari makan, minum, dan tidurnya. Bila salah seorang kalian telah menyelesaikan urusannya, hendaklah ia segera kembali kepada keluarganya.",
    n: "Para ulama menjelaskan bahwa \"azab\" di sini berarti kepayahan dan kesulitan dalam perjalanan.",
    s: "HR. Bukhari no. 1804 dan Muslim no. 1927" },
  { id: "sn-masukrumah", c: "keluar", t: "Menyebut nama Allah saat masuk rumah", v: 0, g: "Shahih", k: "masuk rumah bismillah nama allah setan menginap makan malam pulang",
    p: "Ucapkan Bismillah ketika masuk rumah dan ketika hendak makan.",
    h: "Jabir ra. berkata: aku mendengar Nabi ﷺ bersabda: bila seseorang masuk rumahnya lalu menyebut nama Allah ketika masuk dan ketika makan, setan berkata kepada pengikutnya: tidak ada tempat menginap dan tidak ada makan malam bagi kalian. Bila ia masuk tanpa menyebut nama Allah, setan berkata: kalian mendapat tempat menginap.",
    n: "Doa masuk rumah dan doa keluar rumah ada di tab Doa & dzikir.",
    s: "HR. Muslim no. 2018" }
]);
/* ===== IB2-B3b1: data sunnah tahap 3b-1: kategori baru "Hari Jumat" + 4 sunnah (memakai pembantu dari B3a1). Nomor hadits dicek ke sunnah.com lewat pencarian web (14 Nov 2026); isi cara mengamalkan dan makna hadits tetap ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3b1.py --reverse ===== */
ibxSnAddCat("shalat", ["jumat", "Hari Jumat"]);
ibxSnAddAfter("sn-witir", [
  { id: "sn-jmandi", c: "jumat", t: "Mandi, bersiwak, dan memakai wewangian untuk Jumat", v: 0, g: "Shahih", k: "jumat mandi siwak sikat gigi wewangian parfum bersih shalat jumat berangkat",
    p: "Sebelum berangkat shalat Jumat, mandilah, bersiwak atau menyikat gigi, dan pakailah wewangian yang kamu punya.",
    h: "Abu Said al-Khudri ra. meriwayatkan sabda Nabi ﷺ: mandi pada hari Jumat itu wajib atas setiap orang yang sudah baligh, dan hendaklah ia bersiwak serta memakai wewangian bila ia punya.",
    n: "Mayoritas ulama memahami kata \"wajib\" di sini sebagai sunnah yang sangat ditekankan; sebagian ulama berpendapat wajib.",
    s: "HR. Bukhari no. 880 dan Muslim no. 846" },
  { id: "sn-jawal", c: "jumat", t: "Bersegera ke masjid pada hari Jumat", v: 0, g: "Shahih", k: "jumat bersegera awal waktu masjid berangkat pagi unta sapi domba ayam telur pahala khutbah malaikat",
    p: "Setelah mandi, berangkatlah ke masjid lebih awal pada hari Jumat, sebelum khatib naik mimbar. Makin awal, makin besar keutamaannya.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: barangsiapa mandi pada hari Jumat seperti mandi janabah lalu berangkat pada waktu pertama, seakan ia berkurban seekor unta; pada waktu kedua seekor sapi; ketiga seekor domba bertanduk; keempat seekor ayam; kelima sebutir telur. Bila imam telah keluar, para malaikat hadir mendengarkan dzikir.",
    n: "Para ulama berbeda pendapat tentang kapan \"waktu pertama\" itu dimulai; hadits ini menunjukkan bahwa makin awal berangkat, makin besar keutamaannya.",
    s: "HR. Bukhari no. 881 dan Muslim no. 850" },
  { id: "sn-jkhutbah", c: "jumat", t: "Menyimak khutbah Jumat dengan tenang", v: 0, g: "Shahih", k: "jumat khutbah khatib imam diam menyimak bicara sia sia tenang mendengarkan",
    p: "Saat khatib berkhutbah, simaklah dengan tenang. Jangan berbicara, bahkan untuk menyuruh orang di sebelahmu diam, dan jauhi hal yang melalaikan.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bila engkau berkata kepada temanmu pada hari Jumat \"diamlah\" sementara imam sedang berkhutbah, maka engkau telah berbuat sia-sia.",
    n: "Sebagian ulama mewajibkan diam saat khutbah, sebagian lain menganggapnya sangat dianjurkan; semuanya menekankan agar khutbah disimak dengan sungguh-sungguh.",
    s: "HR. Bukhari no. 934 dan Muslim no. 851" },
  { id: "sn-jdoa", c: "jumat", t: "Memperbanyak doa pada hari Jumat", v: 0, g: "Shahih", k: "jumat doa mustajab saat ijabah terkabul berdoa memohon waktu singkat",
    p: "Sediakan waktu untuk berdoa dan memohon kebaikan pada hari Jumat, sambil berharap bertepatan dengan saat yang mustajab itu.",
    h: "Abu Hurairah ra. meriwayatkan bahwa Nabi ﷺ menyebut hari Jumat lalu bersabda: pada hari itu ada satu saat yang tidak bertepatan dengannya seorang hamba muslim yang berdiri shalat sambil memohon sesuatu kepada Allah, kecuali Allah mengabulkannya. Beliau mengisyaratkan dengan tangan bahwa saat itu singkat.",
    n: "Para ulama berbeda pendapat tentang kapan tepatnya saat itu, sehingga dianjurkan memperbanyak doa sepanjang hari Jumat.",
    s: "HR. Bukhari no. 935 dan Muslim no. 852" }
]);
/* ===== IB2-B3b2: data sunnah tahap 3b-2: kategori baru "Keluarga & rumah" + 4 sunnah (memakai pembantu dari B3a1). Nomor hadits dicek ke sunnah.com dan situs rujukan hadits lewat pencarian web (14 Nov 2026); isi cara mengamalkan dan catatan tetap ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3b2.py --reverse ===== */
ibxSnAddCat("akhlak", ["keluarga", "Keluarga & rumah"]);
ibxSnAddAfter("sn-senyum", [
  { id: "sn-kbantu", c: "keluarga", t: "Membantu pekerjaan rumah", v: 0, g: "Shahih", k: "keluarga rumah membantu pekerjaan rumah melayani keluarga khidmah rendah hati aisyah iqamat shalat",
    p: "Ikut membantu pekerjaan di rumah, misalnya membereskan, membersihkan, atau menyiapkan sesuatu untuk keluarga, lalu segera berangkat shalat ketika waktunya tiba.",
    h: "Al-Aswad bertanya kepada Aisyah ra. tentang apa yang dilakukan Nabi ﷺ di rumah. Aisyah menjawab bahwa beliau biasa melayani keluarganya, dan ketika waktu shalat tiba beliau keluar untuk shalat.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab orang yang sedang mengurus keperluan keluarganya lalu iqamat dikumandangkan dan ia pun keluar untuk shalat; para pensyarah memahaminya sebagai teladan agar tidak merasa malu membantu pekerjaan rumah.",
    s: "HR. Bukhari no. 676" },
  { id: "sn-kanak", c: "keluarga", t: "Menyayangi dan mencium anak", v: 0, g: "Shahih", k: "keluarga anak cucu menyayangi mencium memeluk kasih sayang rahmah hasan aqra bin habis",
    p: "Tunjukkan kasih sayang kepada anak atau cucu dengan pelukan, ciuman, dan perhatian; jangan menahannya.",
    h: "Abu Hurairah ra. meriwayatkan bahwa Nabi ﷺ mencium Al-Hasan bin Ali, sementara Al-Aqra bin Habis duduk di dekat beliau. Al-Aqra berkata: aku punya sepuluh anak dan tidak pernah mencium seorang pun dari mereka. Rasulullah ﷺ memandangnya lalu bersabda: barangsiapa tidak menyayangi, ia tidak akan disayangi.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab menyayangi anak, menciumnya, dan memeluknya; kalimat penutupnya bersifat umum dan tidak terbatas pada anak sendiri.",
    s: "HR. Bukhari no. 5997" },
  { id: "sn-knafkah", c: "keluarga", t: "Menafkahi keluarga dengan niat mencari pahala", v: 0, g: "Shahih", k: "keluarga nafkah menafkahi sedekah niat mengharap pahala istri anak orang tua abu masud",
    p: "Saat menafkahi keluarga, sengaja niatkan itu sebagai ibadah karena Allah, bukan sekadar kewajiban rutin.",
    h: "Abu Mas'ud al-Badri ra. meriwayatkan sabda Nabi ﷺ: apabila seorang muslim menafkahkan hartanya untuk keluarganya dengan mengharap pahala dari Allah, maka nafkah itu bernilai sedekah baginya.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab bahwa amal bergantung pada niat; para pensyarah menjelaskan bahwa nilai sedekah itu didapat bila nafkah disertai niat mengharap pahala dari Allah.",
    s: "HR. Bukhari no. 55 dan Muslim no. 1002" },
  { id: "sn-kistri", c: "keluarga", t: "Berbuat baik dan bersabar kepada istri", v: 0, g: "Shahih", k: "keluarga istri wanita perempuan suami berbuat baik lembut sabar kekurangan tulang rusuk berwasiat",
    p: "Perlakukan istri dan para wanita di sekitarmu dengan baik, bersabarlah atas kekurangannya, dan jangan memaksa mengubah wataknya sekaligus.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: berwasiatlah kepada para wanita dengan kebaikan, karena wanita diciptakan dari tulang rusuk, dan bagian rusuk yang paling bengkok ialah bagian atasnya; bila engkau berusaha meluruskannya engkau mematahkannya, dan bila engkau membiarkannya ia tetap bengkok. Maka berwasiatlah kepada para wanita dengan kebaikan.",
    n: "Para pensyarah memahami perumpamaan tulang rusuk ini sebagai ajakan untuk bersikap lembut dan bersabar atas kekurangan kecil, bukan memaksa mengubah watak.",
    s: "HR. Bukhari no. 5186 dan Muslim no. 1468" }
]);
