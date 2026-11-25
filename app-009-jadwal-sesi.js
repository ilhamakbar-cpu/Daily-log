/* ===== MODUL: PENGINGAT LATIHAN (batch 20, langkah 20b) =====
   (1) Jadwal latihan -> berkas .ics untuk Kalender HP (tanpa pustaka). Sumber sesi = schedFor(tanggal).
   (2) Banner pengingat di Beranda (hanya bila dinyalakan; hanya tampil saat aplikasi terbuka).
   Data baru `dailylog:rem:v1`: khusus perangkat, TIDAK ikut ekspor JSON (pola sama dengan `dailylog:prefs:v1`).
   Bawaan (banner mati) = Beranda dan semua tampilan selain Data identik dengan 20a. */
const KEY_RM = 'dailylog:rem:v1';
const RM_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const RM_LEADS = [0, 15, 30, 60];    // menit pengingat sebelum mulai (0 = tanpa VALARM)
const RM_WEEKS = [2, 4, 8, 12];      // jangka waktu berkas
const RM_KAL_MIN = 45;               // durasi sesi kalistenik (menit)
const rmBlank = () => ({ on: false, kt: '06:30', bt: '16:00', lead: 30, wk: 4, hide: '', updated: 0 });
let rdb = rmBlank();
let rmOpen = false;     // panel Pengingat terbuka
let rmLast = null;      // isi banner terakhir yang digambar (untuk pembaruan berkala)
function rmClean(raw) {
  const b = rmBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  b.on = raw.on === true;
  if (typeof raw.kt === 'string' && RM_TIME_RE.test(raw.kt)) b.kt = raw.kt;
  if (typeof raw.bt === 'string' && RM_TIME_RE.test(raw.bt)) b.bt = raw.bt;
  if (RM_LEADS.includes(raw.lead)) b.lead = raw.lead;
  if (RM_WEEKS.includes(raw.wk)) b.wk = raw.wk;
  if (typeof raw.hide === 'string' && DATE_RE.test(raw.hide)) b.hide = raw.hide;
  const u = Number(raw.updated);
  b.updated = Number.isFinite(u) && u > 0 ? u : 0;
  return b;
}
STORES.r = { key: KEY_RM, get: () => rdb }; dirty.r = false;   // khusus perangkat: tidak ikut ekspor JSON
const rmIsDefault = () => !rdb.on && rdb.kt === '06:30' && rdb.bt === '16:00' && rdb.lead === 30 && rdb.wk === 4;
function rmSave() { rdb.updated = Date.now(); queueSave('r'); }

/* ---------- jadwal -> sesi ---------- */
const rmMin = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));        // 'HH:MM' -> menit sejak 00:00
const rmFmt = m => pad(Math.floor(m / 60) % 24) + '.' + pad(m % 60);          // menit -> '06.30'
const rmBikeMin = (type, phId) => type === 'long' ? (phId >= 3 ? 150 : 120) : type === 'z2' ? 60 : 75;   // thr dan vo2 = 75
const rmDate = d => pd(d).getDate() + ' ' + BULAN[pd(d).getMonth()].slice(0, 3) + ' ' + pd(d).getFullYear();
/* sesi satu tanggal; tanggal sebelum tanggal mulai perjalanan tidak dijadwalkan */
function rmDay(d, cfg) {
  const p = pos(d);
  if (p && p.before) return [];
  const sc = schedFor(d), s = sc.s, out = [];
  if (s.kal) out.push({ date: d, kind: 'kal', bike: null, ph: sc.ph.id, start: rmMin(cfg.kt), dur: RM_KAL_MIN, title: 'Kalistenik (Fase ' + sc.ph.id + ')' });
  if (s.bike) out.push({ date: d, kind: 'bike', bike: s.bike, ph: sc.ph.id, start: rmMin(cfg.bt), dur: rmBikeMin(s.bike, sc.ph.id), title: 'Sepeda: ' + BIKE_LABEL[s.bike] + ' (Fase ' + sc.ph.id + ')' });
  return out;
}
function rmEvents(from, weeks, cfg) {
  const out = [];
  for (let i = 0; i < weeks * 7; i++) rmDay(addDays(from, i), cfg).forEach(e => out.push(e));
  return out;
}

/* ---------- berkas .ics (RFC 5545) ---------- */
const rmUtc = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
const rmWall = (date, min) => { const d = pd(date); d.setHours(Math.floor(min / 60), min % 60, 0, 0); return d; };   // jam dinding perangkat
const rmEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function rmFold(line) {   // lipat baris > 75 oktet UTF-8 tanpa memotong karakter; baris lanjutan diawali satu spasi
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = []; let cur = '', bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > 75) { out.push(cur); cur = ' '; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
}
function rmICS(evs, cfg, now) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daily Log//Jadwal latihan//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Jadwal latihan Ominia'];
  const stamp = rmUtc(now);
  evs.forEach(ev => {
    const a = rmWall(ev.date, ev.start), b = new Date(a.getTime() + ev.dur * 60000);
    L.push('BEGIN:VEVENT', 'UID:dl-' + ev.date.replace(/-/g, '') + '-' + ev.kind + '@dailylog', 'DTSTAMP:' + stamp, 'DTSTART:' + rmUtc(a), 'DTEND:' + rmUtc(b),
      'SUMMARY:' + rmEsc(ev.title), 'DESCRIPTION:' + rmEsc('Ominia. Fase ' + ev.ph + ': ' + PHASES[ev.ph - 1].nama + '.'));
    if (cfg.lead > 0) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + rmEsc(ev.title), 'TRIGGER:-PT' + cfg.lead + 'M', 'END:VALARM');
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(rmFold).join('\r\n') + '\r\n';
}
async function rmSaveFile(name, text) {
  let r = 'unsupported';
  try {
    if (typeof File === 'function' && navigator.share && navigator.canShare) {
      const file = new File([text], name, { type: 'text/calendar' });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Jadwal latihan' }); r = 'shared'; }
    }
  } catch (e) { r = e && e.name === 'AbortError' ? 'cancelled' : 'unsupported'; }
  if (r === 'shared') { toast('Jadwal dibagikan'); return; }
  if (r === 'cancelled') return;
  download(name, text, 'text/calendar;charset=utf-8');   // bukan cadangan: tidak memanggil markBackup
}
function rmExport() {
  const evs = rmEvents(today(), rdb.wk, rdb);
  if (!evs.length) { toast('Tidak ada sesi latihan dalam ' + rdb.wk + ' pekan ke depan'); return; }
  const text = rmICS(evs, rdb, new Date());
  const nk = evs.filter(e => e.kind === 'kal').length, nb = evs.length - nk;
  const name = 'jadwal-latihan-' + today() + '.ics';
  openSheet({
    title: 'Jadwal latihan ke Kalender', pre: true,
    note: evs.length + ' sesi (' + nk + ' kalistenik, ' + nb + ' sepeda), ' + rmDate(evs[0].date) + ' sampai ' + rmDate(evs[evs.length - 1].date) + '.\n' +
      'Kalistenik pukul ' + rmFmt(rmMin(rdb.kt)) + ', sepeda pukul ' + rmFmt(rmMin(rdb.bt)) + '. ' + (rdb.lead > 0 ? 'Pengingat ' + rdb.lead + ' menit sebelum mulai.' : 'Tanpa pengingat bunyi.') + '\n' +
      (pdb.start ? '' : 'Tanggal mulai belum diatur, jadi jadwal memakai contoh Fase 1.\n') +
      'Simpan file ini lalu buka dari aplikasi Kalender, atau pilih Kalender di menu bagikan. Mengimpor ulang ke kalender yang sama bisa menimpa atau menggandakan acara, tergantung aplikasinya.',
    text,
    actions: [{ label: 'Simpan file', primary: true, fn: () => rmSaveFile(name, text) }, { label: 'Salin', fn: copyFromSheet }, closeBtn]
  });
}

/* ---------- banner Beranda ---------- */
/* menit = menit sejak 00:00; keadaan: done | upcoming (> 60 menit sebelum mulai) | soon (0-60 menit sebelum) | now (mulai sampai mulai + durasi) | late (sesudahnya, belum tercatat) */
function rmState(menit, mulai, durasi, selesai) {
  if (selesai) return 'done';
  if (menit < mulai - 60) return 'upcoming';
  if (menit < mulai) return 'soon';
  if (menit < mulai + durasi) return 'now';
  return 'late';
}
const rmIn = d => d >= 60 ? Math.floor(d / 60) + ' jam' + (d % 60 ? ' ' + (d % 60) + ' menit' : '') + ' lagi' : d + ' menit lagi';
function rmBannerRows() {
  if (!rdb.on) return [];
  const t = today();
  if (rdb.hide === t) return [];
  const n = new Date(), nm = n.getHours() * 60 + n.getMinutes(), rows = [];
  rmDay(t, rdb).sort((a, b) => a.start - b.start).forEach(ev => {
    const st = rmState(nm, ev.start, ev.dur, ev.kind === 'kal' ? kalDone(t) : bikeDone(t));
    if (st === 'done') return;
    const lbl = ev.kind === 'kal' ? 'Kalistenik' : 'Sepeda: ' + BIKE_LABEL[ev.bike], at = rmFmt(ev.start);
    const r = { st, kind: ev.kind };
    if (st === 'upcoming') { r.head = 'Nanti: ' + lbl + ' pukul ' + at; r.sub = 'Sekitar ' + rmIn(ev.start - nm) + '.'; }
    else if (st === 'soon') { r.head = 'Sebentar lagi: ' + lbl; r.sub = 'Mulai pukul ' + at + ', ' + rmIn(ev.start - nm) + '.'; }
    else if (st === 'now') { r.head = 'Saatnya: ' + lbl; r.sub = 'Dijadwalkan pukul ' + at + ' sampai ' + rmFmt(ev.start + ev.dur) + '.'; }
    else { r.head = 'Belum tercatat: ' + lbl; r.sub = 'Dijadwalkan pukul ' + at + ' dan belum tercatat selesai.'; }
    rows.push(r);
  });
  return rows;
}
function rmBannerInner() {
  const rows = rmBannerRows();
  if (!rows.length) return '';
  return '<section class="sec"><h2>Pengingat latihan</h2>' +
    rows.map(r => '<div class="plan alert" data-st="' + r.st + '"><div><b>' + esc(r.head) + '</b><small>' + esc(r.sub) + '</small></div><button class="btn sm primary" data-goto="train">Buka Latihan</button></div>').join('') +
    '<p class="note" style="margin-top:0"><button class="link tap" data-q="rmHide">Tutup untuk hari ini</button></p></section>';
}
function rmBannerHTML() {
  if (!rdb.on) { rmLast = null; return ''; }
  rmLast = rmBannerInner();
  return '<div id="rmBanner">' + rmLast + '</div>';
}
function rmTick() {   // pembaruan berkala: hanya mengganti isi banner bila berubah, tidak menggambar ulang Beranda
  if (!rdb.on || curView !== 'home' || document.hidden) return;
  const box = $('#rmBanner'); if (!box) return;
  const h = rmBannerInner();
  if (h !== rmLast) { rmLast = h; box.innerHTML = h; }
}
setInterval(rmTick, 30000);
QACT.rmHide = () => { rdb.hide = today(); rmSave(); renderHome(); toast('Pengingat disembunyikan sampai besok'); };

/* ---------- panel di halaman Data ---------- */
function rmInfoText() {
  const evs = rmEvents(today(), rdb.wk, rdb), nk = evs.filter(e => e.kind === 'kal').length;
  let s = 'Dalam ' + rdb.wk + ' pekan ke depan: ' + nk + ' sesi kalistenik dan ' + (evs.length - nk) + ' sesi sepeda.';
  if (!pdb.start) s += ' Tanggal mulai belum diatur, jadi jadwal memakai contoh Fase 1 (atur di tab Peta).';
  else if (pos(today()) && pos(today()).before) s += ' Perjalanan mulai ' + rmDate(pdb.start) + '; hari sebelum itu tidak dijadwalkan.';
  const byDay = {};
  evs.forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
  const clash = Object.keys(byDay).filter(d => {
    const v = byDay[d];
    if (v.length < 2) return false;
    const a = rmWall(d, v[0].start).getTime(), b = rmWall(d, v[1].start).getTime();
    return a < b + v[1].dur * 60000 && b < a + v[0].dur * 60000;
  }).length;
  if (clash) s += ' Pada ' + clash + ' hari jam kalistenik dan jam sepeda bertumpuk; ubah salah satu jam.';
  return s;
}
const rmStatus = () => (rdb.on ? 'Banner nyala' : 'Banner mati') + ' · ' + rmFmt(rmMin(rdb.kt)) + ' / ' + rmFmt(rmMin(rdb.bt));
function renderRmBox() {
  const box = $('#rmBox'); if (!box) return;
  const pill = (f, v, on, t) => '<button class="pill" data-q="rmSet" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + on + '">' + t + '</button>';
  box.innerHTML = '<details class="ph" id="rmDet"' + (rmOpen ? ' open' : '') + '><summary><span>Pengingat latihan</span><small id="rmStat">' + esc(rmStatus()) + '</small><i class="chev"></i></summary><div class="body">' +
    '<div class="f"><label class="lbl" for="rmKt">Jam kalistenik</label><input type="time" class="txt" id="rmKt" value="' + rdb.kt + '"></div>' +
    '<div class="f"><label class="lbl" for="rmBt">Jam sepeda</label><input type="time" class="txt" id="rmBt" value="' + rdb.bt + '"></div>' +
    '<div class="f"><div class="lbl" id="rmLblL">Pengingat sebelum mulai (menit)</div><div class="seg tri" role="group" aria-labelledby="rmLblL">' + RM_LEADS.map(v => pill('lead', v, rdb.lead === v, v ? v : 'Mati')).join('') + '</div></div>' +
    '<div class="f"><div class="lbl" id="rmLblW">Jangka waktu file (pekan)</div><div class="seg tri" role="group" aria-labelledby="rmLblW">' + RM_WEEKS.map(v => pill('wk', v, rdb.wk === v, v)).join('') + '</div>' +
    '<div class="quick"><button class="btn primary wide" data-q="rmIcs">Buat file kalender (.ics)</button></div>' +
    '<p class="note" id="rmInfo">' + esc(rmInfoText()) + '</p>' +
    '<p class="note">File .ics adalah cara paling andal: pengingatnya berbunyi dari aplikasi Kalender walau aplikasi ini tertutup.</p></div>' +
    '<div class="f"><div class="lbl" id="rmLblB">Banner di Beranda</div><div class="seg" role="group" aria-labelledby="rmLblB">' + pill('on', '0', !rdb.on, 'Mati') + pill('on', '1', rdb.on, 'Nyala') + '</div>' +
    '<p class="note">Banner hanya tampil saat aplikasi ini terbuka; tidak bisa berbunyi saat aplikasi ditutup.</p></div>' +
    '<div class="quick"><button class="btn sm ghost" data-q="rmReset"' + (rmIsDefault() ? ' disabled' : '') + '>Kembalikan ke bawaan</button></div>' +
    '<p class="note">Pengaturan pengingat hanya tersimpan di perangkat ini dan tidak ikut cadangan JSON.</p></div></details>';
}
function rmSync() {   // perbarui ringkasan tanpa menggambar ulang kolom jam yang sedang dipakai
  const a = $('#rmStat'), b = $('#rmInfo');
  if (a) a.textContent = rmStatus();
  if (b) b.textContent = rmInfoText();
}
function rmRerender(keep) {   // gambar ulang panel tanpa menghilangkan fokus papan ketik
  const had = keep && $('#rmBox') && $('#rmBox').contains(document.activeElement);
  renderRmBox();
  if (had) { const b = $('#rmBox [data-q="' + keep.q + '"]' + (keep.f ? '[data-f="' + keep.f + '"][data-v="' + keep.v + '"]' : '')); if (b && !b.disabled) b.focus(); }
}
QACT.rmSet = el => {
  const f = el.dataset.f, v = el.dataset.v, n = /^\d+$/.test(v) ? Number(v) : -1;
  if (f === 'on') rdb.on = v === '1';
  else if (f === 'lead' && RM_LEADS.includes(n)) rdb.lead = n;
  else if (f === 'wk' && RM_WEEKS.includes(n)) rdb.wk = n;
  else return;
  rmSave(); rmRerender({ q: 'rmSet', f, v });
};
QACT.rmIcs = () => rmExport();
QACT.rmReset = () => {
  const wasFocus = $('#rmBox') && $('#rmBox').contains(document.activeElement);
  rdb.on = false; rdb.kt = '06:30'; rdb.bt = '16:00'; rdb.lead = 30; rdb.wk = 4; rdb.hide = '';
  rmSave(); renderRmBox();
  if (wasFocus) { const b = $('#rmBox [data-f="on"][data-v="0"]'); if (b) b.focus(); }
  toast('Pengingat dikembalikan ke bawaan');
};
document.addEventListener('change', ev => {   // kolom jam: simpan hanya nilai yang sah
  const t = ev.target;
  if (!t || (t.id !== 'rmKt' && t.id !== 'rmBt')) return;
  const k = t.id === 'rmKt' ? 'kt' : 'bt';
  if (!RM_TIME_RE.test(t.value)) { t.value = rdb[k]; toast('Jam tidak valid'); return; }
  rdb[k] = t.value; rmSave(); rmSync();
});
document.addEventListener('toggle', ev => { if (ev.target.id === 'rmDet') rmOpen = ev.target.open; }, true);
window.DL = Object.freeze(Object.assign({}, window.DL, { b20b: Object.freeze({ state: () => Object.assign({}, rdb), clean: rmClean, key: KEY_RM, isDefault: rmIsDefault, day: rmDay, events: rmEvents, ics: rmICS, fold: rmFold, esc: rmEsc, utc: rmUtc, bannerState: rmState, bannerRows: rmBannerRows, info: rmInfoText, tick: rmTick }) }));
/* ---------- v23b: hitungan jadwal shalat (lokal, tanpa internet) ---------- */
/* Metode Kemenag RI: Subuh -20 derajat, Isya -18 derajat, Asar bayangan 1x (Syafi'i), terbit/terbenam -0,833 derajat,
   ihtiyat 2 menit (Subuh, Dzuhur, Ashar, Maghrib, Isya dibulatkan ke menit berikutnya; Terbit dikurangi 2 menit dan dibulatkan ke bawah).
   Posisi matahari: rumus NOAA (deklinasi + persamaan waktu), dihitung ulang pada saat tiap kejadian. */
const HX_IHT = 2;
const HX_NAMES = ['Subuh', 'Terbit', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
const HX_FIVE = [0, 2, 3, 4, 5];   // indeks yang berupa waktu shalat (Terbit hanya penanda)
const hxRad = x => x * Math.PI / 180, hxDeg = x => x * 180 / Math.PI;
const hxMod = (x, n) => ((x % n) + n) % n;
function hxJD(y, m, d) {   // hari Julian pada pukul 0 UT; m = 1..12
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function hxSun(jd) {   // deklinasi (derajat) dan persamaan waktu (jam)
  const T = (jd - 2451545) / 36525;
  const L0 = hxMod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
  const M = hxMod(357.52911 + T * (35999.05029 - 0.0001537 * T), 360), Mr = hxRad(M);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
  const om = hxRad(125.04 - 1934.136 * T);
  const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om);
  const er = hxRad(eps), dec = hxDeg(Math.asin(Math.sin(er) * Math.sin(hxRad(lam))));
  const y = Math.tan(er / 2) ** 2, L0r = hxRad(L0);
  const eq = 4 * hxDeg(y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
  return { dec, eq: eq / 60 };
}
/* jam lokal (desimal, zona waktu tz) pada tanggal kalender y-m-d di lokasi (lat, lon); null bila matahari tidak mencapai sudut itu */
function hxTimes(y, m, d, lat, lon, tz) {
  const jd0 = hxJD(y, m, d), phi = hxRad(lat);
  const at = h => hxSun(jd0 + (h - tz) / 24);
  const base = 12 + tz - lon / 15;
  let nn = base; for (let i = 0; i < 3; i++) nn = base - at(nn).eq;
  const ev = (a, sgn, asr) => {
    let t = nn;
    for (let i = 0; i < 3; i++) {
      const s = at(t), dr = hxRad(s.dec);
      const alt = asr ? hxDeg(Math.atan(1 / (1 + Math.tan(Math.abs(phi - dr))))) : a;
      const c = (Math.sin(hxRad(alt)) - Math.sin(phi) * Math.sin(dr)) / (Math.cos(phi) * Math.cos(dr));
      if (!(c >= -1 && c <= 1)) return null;
      t = base - s.eq + sgn * hxDeg(Math.acos(c)) / 15;
    }
    return t;
  };
  return { fajr: ev(-20, -1), sunrise: ev(-0.833, -1), dhuhr: nn, asr: ev(0, 1, true), maghrib: ev(-0.833, 1), isha: ev(-18, 1) };
}
const hxTzAt = (loc, y, m, d) => loc.tz != null ? loc.tz : -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60;
/* satu hari: enam butir (Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya) dengan 'at' = milidetik epoch atau null */
function hxDay(y, m, d, loc) {
  const tz = hxTzAt(loc, y, m, d), T = hxTimes(y, m, d, loc.lat, loc.lon, tz), base = Date.UTC(y, m - 1, d);
  const up = h => h == null || !isFinite(h) ? null : base + Math.ceil(h * 60 + HX_IHT) * 60000 - tz * 3600000;
  const dn = h => h == null || !isFinite(h) ? null : base + Math.floor(h * 60 - HX_IHT) * 60000 - tz * 3600000;
  const v = [up(T.fajr), dn(T.sunrise), up(T.dhuhr), up(T.asr), up(T.maghrib), up(T.isha)];
  return { y, m, d, tz, items: HX_NAMES.map((name, i) => ({ id: i, name, five: HX_FIVE.includes(i), at: v[i] })) };
}
/* tanggal kalender di lokasi pada saat ms */
function hxParts(ms, loc) {
  const tz = loc.tz != null ? loc.tz : -new Date(ms).getTimezoneOffset() / 60, x = new Date(ms + tz * 3600000);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(), tz };
}
const hxHM = (ms, tz) => { const x = new Date(ms + tz * 3600000); return pad(x.getUTCHours()) + '.' + pad(x.getUTCMinutes()); };
/* shalat berikutnya + shalat yang sedang berlangsung; null bila lokasi tidak punya jadwal lengkap */
function hxNext(now, loc) {
  const p = hxParts(now, loc), day = hxDay(p.y, p.m, p.d, loc);
  const five = day.items.filter(i => i.five);
  if (five.some(i => i.at == null)) return null;
  const nx = five.find(i => i.at > now);
  if (nx) {
    let cur = five.filter(i => i.at <= now).pop() || null;
    if (cur && cur.id === 0 && day.items[1].at != null && now >= day.items[1].at) cur = null;   // waktu Subuh berakhir saat Terbit
    return { day, next: nx, cur, tomorrow: false };
  }
  const q = new Date(Date.UTC(p.y, p.m - 1, p.d + 1)), tm = hxDay(q.getUTCFullYear(), q.getUTCMonth() + 1, q.getUTCDate(), loc);
  const f2 = tm.items.filter(i => i.five);
  if (f2.some(i => i.at == null)) return null;
  return { day: tm, next: f2[0], cur: five[five.length - 1], tomorrow: true };
}
function hxLeft(ms) {   // sisa waktu -> teks
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h + ' j ' + m + ' m'; }
  if (s >= 60) return Math.floor(s / 60) + ' m';
  return s + ' d';
}
/* ---------- v23b: kartu header Beranda (jam, shalat berikutnya, lokasi) ---------- */
const KEY_LC = 'dailylog:loc:v1';
/* [nama, lintang, bujur, zona waktu]; koordinat pusat kota dibulatkan 2 desimal */
const HX_CITIES = [
  ['Jakarta', -6.21, 106.85, 7], ['Bogor', -6.60, 106.80, 7], ['Depok', -6.40, 106.82, 7], ['Tangerang', -6.18, 106.63, 7], ['Bekasi', -6.24, 106.99, 7],
  ['Serang', -6.12, 106.15, 7], ['Bandung', -6.92, 107.61, 7], ['Cirebon', -6.71, 108.56, 7], ['Semarang', -6.97, 110.42, 7], ['Yogyakarta', -7.80, 110.36, 7],
  ['Surakarta', -7.57, 110.82, 7], ['Surabaya', -7.26, 112.75, 7], ['Malang', -7.98, 112.63, 7], ['Banda Aceh', 5.55, 95.32, 7], ['Medan', 3.60, 98.67, 7],
  ['Pekanbaru', 0.51, 101.45, 7], ['Padang', -0.95, 100.35, 7], ['Batam', 1.05, 104.03, 7], ['Jambi', -1.61, 103.61, 7], ['Palembang', -2.98, 104.77, 7],
  ['Bengkulu', -3.80, 102.26, 7], ['Bandar Lampung', -5.43, 105.26, 7], ['Pangkal Pinang', -2.13, 106.12, 7], ['Pontianak', -0.03, 109.34, 7], ['Palangka Raya', -2.21, 113.92, 7],
  ['Denpasar', -8.67, 115.21, 8], ['Mataram', -8.58, 116.12, 8], ['Kupang', -10.18, 123.61, 8], ['Makassar', -5.15, 119.43, 8], ['Palu', -0.90, 119.87, 8],
  ['Kendari', -3.99, 122.51, 8], ['Manado', 1.47, 124.84, 8], ['Gorontalo', 0.54, 123.06, 8], ['Mamuju', -2.68, 118.89, 8], ['Banjarmasin', -3.32, 114.59, 8],
  ['Balikpapan', -1.24, 116.83, 8], ['Samarinda', -0.50, 117.15, 8], ['Tarakan', 3.30, 117.63, 8],
  ['Ambon', -3.70, 128.18, 9], ['Ternate', 0.79, 127.38, 9], ['Jayapura', -2.53, 140.72, 9], ['Manokwari', -0.86, 134.06, 9], ['Sorong', -0.88, 131.26, 9], ['Merauke', -8.49, 140.40, 9]
];
const HX_SRC = ['city', 'gps', 'manual'];
const hxBlank = () => ({ name: '', lat: null, lon: null, tz: null, src: '', updated: 0 });
let ldb = hxBlank();
const hxR2 = x => Math.round(x * 100) / 100;
function hxClean(raw) {
  const b = hxBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const u = Number(raw.updated);
  b.updated = Number.isFinite(u) && u > 0 ? u : 0;
  if (typeof raw.lat !== 'number' || typeof raw.lon !== 'number' || !Number.isFinite(raw.lat) || !Number.isFinite(raw.lon) || Math.abs(raw.lat) > 90 || Math.abs(raw.lon) > 180) return b;
  b.lat = hxR2(raw.lat); b.lon = hxR2(raw.lon);
  b.name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 40) : 'Lokasi saya';
  b.tz = typeof raw.tz === 'number' && Number.isFinite(raw.tz) && raw.tz >= -12 && raw.tz <= 14 ? raw.tz : null;
  b.src = HX_SRC.includes(raw.src) ? raw.src : 'manual';
  return b;
}
STORES.l = { key: KEY_LC, get: () => ldb }; dirty.l = false;   // khusus perangkat: tidak ikut ekspor JSON
const hxHas = () => ldb.lat != null && ldb.lon != null;
function hxSetLoc(o) { ldb = hxClean(Object.assign({}, o, { updated: Date.now() })); queueSave('l'); }
const HX_PIN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const HX_CHEV = '<svg class="hx-chev" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const hxTzName = tz => tz === 7 ? 'WIB' : tz === 8 ? 'WITA' : tz === 9 ? 'WIT' : 'UTC' + (tz >= 0 ? '+' : '') + tz;
const hxClockHTML = d => pad(d.getHours()) + '.' + pad(d.getMinutes()) + '<small>.' + pad(d.getSeconds()) + '</small>';
let hxOpen = false, hxNextAt = 0, hxCdAt = 0;

function hxInner() {
  const now = hxEff(), rn = Date.now(), has = hxHas();
  hxNextAt = 0; hxCdAt = 0; wxAt = 0;
  const dn0 = new Date(now);
  let h = '<div class="hx-r hx-hi"><p class="hx-g" id="hxGreet">' + GREET(dn0.getHours()) + '</p><p class="hx-dt" id="hxDate">' + esc(dayLong(ymd(dn0))) + '</p></div>' +
    '<div class="hx-r hx-top"><span class="hx-clock" id="hxClock">' + hxClockHTML(new Date(now)) + '</span>' +
    (has ? '<button class="btn sm hx-loc" data-q="hxLoc" aria-label="Lokasi: ' + esc(ldb.name) + '. Ketuk untuk mengubah">' + HX_PIN + '<span>' + esc(ldb.name) + '</span></button>' : '') + '</div>';
  if (!has) return h + '<div class="hx-r hx-none"><p>Atur lokasi untuk melihat jadwal shalat.</p><button class="btn primary" data-q="hxLoc">Atur lokasi</button></div>';
  const r = hxNext(now, ldb);
  if (!r) return h + '<div class="hx-r"><p class="note">Jadwal shalat tidak bisa dihitung di lokasi ini: matahari tidak mencapai sudut Subuh atau Isya pada tanggal ini. Coba pilih kota lain.</p></div>' + wxRowHTML(rn);
  const tz = r.day.tz, dev = -new Date(now).getTimezoneOffset() / 60, nx = r.next;
  hxCdAt = nx.at;
  const cand = r.day.items.map(i => i.at).filter(x => x != null && x > now).concat([nx.at]);
  if (r.tomorrow) cand.push(Date.UTC(r.day.y, r.day.m - 1, r.day.d) - tz * 3600000);   // lewat tengah malam: judul daftar berganti
  hxNextAt = Math.min.apply(null, cand);
  const zone = tz !== dev ? '<small>' + hxTzName(tz) + '</small>' : '';
  h += '<div class="hx-r hx-arcw" id="hxArcW">' + hxArcSvg() + '</div>';
  h += '<div class="hx-r hx-p"><button class="hx-pray" data-q="hxPray" aria-expanded="' + hxOpen + '" aria-controls="hxList" aria-label="Shalat berikutnya ' + nx.name + ' pukul ' + hxHM(nx.at, tz) + '. Ketuk untuk ' + (hxOpen ? 'menutup' : 'melihat') + ' semua waktu shalat">' +
    '<span class="hx-pn"><b>' + nx.name + '</b><small id="hxCd">dalam ' + hxLeft(nx.at - now) + '</small></span>' +
    '<span class="hx-pt">' + hxHM(nx.at, tz) + zone + '</span>' + HX_CHEV + '</button>';
  if (hxOpen) {
    const dt = new Date(Date.UTC(r.day.y, r.day.m - 1, r.day.d));
    const rows = r.day.items.map(i => {
      const cls = (i.five ? '' : ' info') + (i.at != null && i.at <= now ? ' past' : '') + (i.id === nx.id && i.at === nx.at ? ' next' : '') + (r.cur && i.id === r.cur.id ? ' cur' : '');
      return '<li class="' + cls.trim() + '"><i></i><span>' + i.name + (r.cur && i.id === r.cur.id ? '<em>Sekarang</em>' : '') + '</span><b>' + (i.at == null ? '–' : hxHM(i.at, tz)) + '</b></li>';
    }).join('');
    h += '<div class="hx-list" id="hxList"><p class="hx-d">' + (r.tomorrow ? 'Besok' : 'Hari ini') + ', ' + HARI[dt.getUTCDay()] + ' ' + dt.getUTCDate() + ' ' + BULAN[dt.getUTCMonth()] + '</p><ul>' + rows + '</ul>' +
      '<p class="note">Hitungan lokal dengan metode Kemenag RI (Subuh 20°, Isya 18°, ihtiyat 2 menit), tanpa internet. Bisa selisih 1 sampai 3 menit dari jadwal masjid atau aplikasi lain.</p></div>';
  }
  return h + '</div>' + wxRowHTML(rn);
}
const hxHTML = () => '<section class="hx" id="hx" aria-label="Sapaan, jam, jadwal shalat, dan cuaca">' + hxInner() + '</section>';
function hxRender() {
  const b = $('#hx'); if (!b) return;
  const f = document.activeElement && b.contains(document.activeElement) ? document.activeElement.dataset.q : null;
  b.innerHTML = hxInner();
  if (f) { const n = b.querySelector('[data-q="' + f + '"]'); if (n) n.focus({ preventScroll: true }); }
}
function hxTick() {
  if (curView !== 'home' || document.hidden) return;
  const el = $('#hxClock'); if (!el) return;
  const now = hxEff(), t = hxClockHTML(new Date(now));
  if (el.innerHTML !== t) el.innerHTML = t;
  const dn = new Date(now), gr = $('#hxGreet'), dd = $('#hxDate');
  if (gr) { const g = GREET(dn.getHours()); if (gr.textContent !== g) gr.textContent = g; }
  if (dd) { const d2 = dayLong(ymd(dn)); if (dd.textContent !== d2) dd.textContent = d2; }
  const cd = $('#hxCd');
  if (cd && hxCdAt) { const s = 'dalam ' + hxLeft(hxCdAt - now); if (cd.textContent !== s) cd.textContent = s; }
  const ag = $('#wxAgo');   // b5: "x menit lalu" pada catatan prakiraan ikut berjalan
  if (ag && xdb.c) { const s2 = wxAgo(now - xdb.c.at); if (ag.textContent !== s2) ag.textContent = s2; }
  if (hxNextAt && now >= hxNextAt) hxRender();
  else if (wxAt && now >= wxAt) hxRender();
  wxTick(Date.now());
  wxBgApply(); hxSkyApply(); hxArcUpd();
}
setInterval(hxTick, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) hxTick(); });

/* ---------- v85: header bentuk "Langit": lintasan matahari, warna langit menurut jam, pratinjau waktu ---------- */
let hxPrev = null, hxArcKey = '';   // hxPrev = waktu pratinjau (ms) atau null = waktu sebenarnya
const hxEff = () => hxPrev != null ? hxPrev : Date.now();
const HX_SKY = [[0, '#1b2150', '#4a3f9a'], [270, '#3b4a9c', '#f0a58a'], [420, '#2b7fd0', '#7cc4f2'], [840, '#c9741a', '#f0b552'], [1030, '#c43a8c', '#ff9a58'], [1120, '#1b2150', '#4a3f9a']];
function hxSkyApply() {
  const s = $('#hxSky'); if (!s) return;
  const d = new Date(hxEff()), t = d.getHours() * 60 + d.getMinutes();
  let c = HX_SKY[0]; HX_SKY.forEach(x => { if (t >= x[0]) c = x; });
  const g = 'linear-gradient(165deg,' + c[1] + ',' + c[2] + ')';
  if (s.dataset.g !== g) { s.dataset.g = g; s.style.background = g; }
}
const hxMinAt = ms => { const x = new Date(ms + hxParts(ms, ldb).tz * 3600000); return x.getUTCHours() * 60 + x.getUTCMinutes(); };
function hxArcSvg() {
  if (!hxHas()) return '';
  const now = hxEff(), p = hxParts(now, ldb), D = hxDay(p.y, p.m, p.d, ldb), z = D.tz;
  const F = D.items.filter(i => i.five);
  if (F.length < 5 || F.some(i => i.at == null)) return '';
  const mn = ms => (((Math.floor(ms / 60000) + z * 60) % 1440) + 1440) % 1440;
  const T0 = mn(F[0].at) - 70, T1 = mn(F[4].at) + 70;
  if (!(T1 > T0 + 120)) return '';
  const pt = m => { const a = Math.PI * Math.max(0, Math.min(1, (m - T0) / (T1 - T0))); return [160 - 140 * Math.cos(a), 100 - 92 * Math.sin(a)]; };
  const f = x => x.toFixed(1), t = mn(now), s = pt(t), a0 = pt(T0);
  let dots = '';
  F.forEach(i => {
    const q = pt(mn(i.at)), dn = i.at <= now, u = (mn(i.at) - T0) / (T1 - T0), sd = u > .8 ? 1 : u < .2 ? -1 : 0;   // titik di ujung kiri/kanan: label di sebelah dalamnya agar tidak tertimpa garis atau bertumpuk
    dots += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (dn ? 5 : 4) + '" fill="' + (dn ? '#fff' : 'rgba(255,255,255,.25)') + '" stroke="#fff" stroke-width="1.5"/>' +
      '<text x="' + f(q[0] - 9 * sd) + '" y="' + f(q[1] + (sd ? 3.5 : 20)) + '" text-anchor="' + (sd > 0 ? 'end' : sd < 0 ? 'start' : 'middle') + '">' + i.name + '</text>';
  });
  return '<svg class="hx-arc" viewBox="0 0 320 112" role="img" aria-label="Lintasan matahari dan waktu shalat hari ini">' +
    '<path d="M20 100 A140 92 0 0 1 300 100" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round"/>' +
    (t > T0 ? '<path d="M' + f(a0[0]) + ' ' + f(a0[1]) + ' A140 92 0 0 1 ' + f(s[0]) + ' ' + f(s[1]) + '" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' : '') +
    dots + '<circle cx="' + f(s[0]) + '" cy="' + f(s[1]) + '" r="10" fill="#fff" style="filter:drop-shadow(0 0 8px rgba(255,255,255,.9))"/></svg>';
}
function hxArcUpd(force) {
  const w = $('#hxArcW'); if (!w) return;
  const k = Math.floor(hxEff() / 60000) + (hxPrev != null ? 'p' : '');
  if (!force && k === hxArcKey) return;
  hxArcKey = k; w.innerHTML = hxArcSvg();
}
function hxSegHTML(n) {   // garis ala story: satu garis per butir ceklis; garis baru terisi dengan animasi dari kondisi sebelumnya
  const N = CK_N, pv = Math.round(ringPrev * N);
  let h = '<span class="sg" id="hSeg" aria-hidden="true">';
  for (let i = 0; i < N; i++) h += '<i' + (i < pv ? ' class="on"' : '') + ' data-t="' + (i < n ? 1 : 0) + '"></i>';
  return h + '</span>';
}
const hxPvTxt = () => hxPrev != null ? 'Pratinjau ' + hxHM(hxPrev, hxParts(hxPrev, ldb).tz) : 'Pratinjau waktu';
function hxScrubHTML() {
  if (!hxHas()) return '';
  const m = Math.max(240, Math.min(1380, hxMinAt(hxEff())));
  return '<div class="hx-scrub" id="hxScrub"><label for="hxRng" id="hxPv">' + hxPvTxt() + '</label><input id="hxRng" type="range" min="240" max="1380" step="1" value="' + m + '">' +
    '<button type="button" class="hx-now" data-q="hxLive"' + (hxPrev != null ? '' : ' hidden') + '>Sekarang</button></div>';
}
function hxPvSync() {
  const pv = $('#hxPv'), nb = $('#hxScrub .hx-now');
  if (pv) pv.textContent = hxPvTxt();
  if (nb) nb.hidden = hxPrev == null;
}
document.addEventListener('input', ev => {
  const t = ev.target; if (!t || t.id !== 'hxRng') return;
  const p = hxParts(Date.now(), ldb);
  hxPrev = Date.UTC(p.y, p.m - 1, p.d) - p.tz * 3600000 + (+t.value) * 60000;
  hxPvSync(); hxRender(); hxSkyApply();
});
QACT.hxLive = () => {
  hxPrev = null;
  const r = $('#hxRng'); if (r) r.value = Math.max(240, Math.min(1380, hxMinAt(Date.now())));
  hxPvSync(); hxRender(); hxSkyApply();
};

/* ---------- lokasi ---------- */
function hxSheet() {
  const grp = (tz, lb) => '<optgroup label="' + lb + '">' + HX_CITIES.filter(c => c[3] === tz).map(c => '<option value="' + esc(c[0]) + '"' + (ldb.src === 'city' && ldb.name === c[0] ? ' selected' : '') + '>' + esc(c[0]) + '</option>').join('') + '</optgroup>';
  const cur = hxHas() ? '<p class="hx-cur">Sekarang: ' + esc(ldb.name) + ' (' + ldb.lat.toFixed(2) + ', ' + ldb.lon.toFixed(2) + ')</p>' : '';
  openSheet({
    title: 'Lokasi', note: 'Dipakai untuk jadwal shalat dan cuaca. Disimpan hanya di perangkat ini dan tidak ikut cadangan JSON.',
    extra: '<div class="hxs">' + cur + '<button class="btn primary" data-q="hxGps">Pakai lokasi perangkat</button>' +
      '<label class="inp"><span class="u">Kota</span><select id="hxCity" aria-label="Pilih kota"><option value="">Pilih kota…</option>' + grp(7, 'WIB') + grp(8, 'WITA') + grp(9, 'WIT') + '</select></label>' +
      '<details class="hxm"' + (ldb.src === 'manual' ? ' open' : '') + '><summary>Isi koordinat sendiri</summary><div class="hxm-b">' +
      '<label class="inp"><span class="u">Lintang</span><input id="hxLat" inputmode="decimal" autocomplete="off" placeholder="-6.21"></label>' +
      '<label class="inp"><span class="u">Bujur</span><input id="hxLon" inputmode="decimal" autocomplete="off" placeholder="106.85"></label>' +
      '<button class="btn" data-q="hxManual">Simpan koordinat</button></div></details>' +
      wxSwHTML() + (hxHas() ? '<button class="btn danger" data-q="hxClear">Hapus lokasi</button>' : '') + '</div>',
    actions: [closeBtn]
  });
}
function hxAfterSet(msg) { closeSheet(); renderHome(); toast(msg); }
QACT.hxLoc = () => hxSheet();
QACT.hxPray = () => { hxOpen = !hxOpen; hxRender(); };
QACT.hxGps = el => {
  if (!navigator.geolocation) { toast('Perangkat ini tidak mendukung lokasi. Pilih kota.'); return; }
  const t0 = el.textContent; el.disabled = true; el.textContent = 'Mencari lokasi…';
  const back = () => { if (el.isConnected) { el.disabled = false; el.textContent = t0; } };
  navigator.geolocation.getCurrentPosition(p => {
    back();
    hxSetLoc({ name: 'Lokasi perangkat', lat: p.coords.latitude, lon: p.coords.longitude, tz: null, src: 'gps' });
    hxAfterSet('Lokasi perangkat dipakai');
  }, e => {
    back();
    toast(e && e.code === 1 ? 'Izin lokasi ditolak. Pilih kota atau isi koordinat.' : 'Lokasi belum ditemukan. Coba lagi atau pilih kota.');
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
};
document.addEventListener('change', ev => {
  const t = ev.target;
  if (!t || t.id !== 'hxCity') return;
  const c = HX_CITIES.find(x => x[0] === t.value); if (!c) return;
  hxSetLoc({ name: c[0], lat: c[1], lon: c[2], tz: c[3], src: 'city' });
  hxAfterSet('Lokasi: ' + c[0]);
});
QACT.hxManual = () => {
  const num = id => { const v = String(($('#' + id) || {}).value || '').trim().replace(',', '.'); return v === '' ? NaN : Number(v); };
  const la = num('hxLat'), lo = num('hxLon');
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) { toast('Lintang -90 sampai 90, bujur -180 sampai 180. Contoh: -6.21 dan 106.85'); return; }
  hxSetLoc({ name: 'Koordinat sendiri', lat: la, lon: lo, tz: null, src: 'manual' });
  hxAfterSet('Koordinat disimpan');
};
QACT.hxClear = () => { ldb = hxBlank(); ldb.updated = Date.now(); queueSave('l'); xdb.c = null; wxErr = ''; wxFails = 0; wxRetryAt = 0; queueSave('wx'); hxAfterSet('Lokasi dihapus'); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b23b: Object.freeze({ times: hxTimes, day: hxDay, next: hxNext, left: hxLeft, parts: hxParts, hm: hxHM, clean: hxClean, key: KEY_LC, state: () => Object.assign({}, ldb), cities: HX_CITIES, inner: hxInner, tick: hxTick, nextAt: () => hxNextAt, open: () => hxOpen }) }));
/* ---------- v23e: prediksi cuaca di kartu header Beranda (tahap 1b/b4). Data dari Open-Meteo lewat internet; koordinat (2 desimal) ikut dikirim. Bisa dimatikan di sheet Lokasi. Disimpan di kunci khusus perangkat dailylog:wx:v1 (tidak ikut ekspor JSON). ---------- */
const KEY_WX = 'dailylog:wx:v1';
const WX_API = 'https://api.open-meteo.com/v1/forecast';
const WX_TTL = 15 * 60000, WX_STALE = 30 * 60000, WX_MAXAGE = 6 * 3600000, WX_TIMEOUT = 10000, WX_STEP = 2, WX_N = 6;   // b5: TTL = jarak pembaruan otomatis; STALE = batas label "data HH.MM"
const wxFin = x => typeof x === 'number' && Number.isFinite(x);
const wxIn = (x, a, b) => wxFin(x) && x >= a && x <= b;
const wxOpt = (x, a, b) => wxIn(x, a, b) ? x : null;   // nilai opsional: di luar rentang atau bukan angka -> null
const wxCode = x => wxIn(x, 0, 99) && x === Math.floor(x);
/* rapikan data cuaca (dari layanan maupun dari penyimpanan); null bila tidak layak. Baris rusak dibuang satu per satu. */
function wxCleanC(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  if (typeof c.k !== 'string' || !/^-?\d{1,3}\.\d\d\|-?\d{1,3}\.\d\d$/.test(c.k)) return null;
  if (!wxIn(c.at, 1, 4e12) || !wxIn(c.off, -50400, 50400)) return null;
  const n = c.n;
  if (!n || typeof n !== 'object' || !wxIn(n.ts, 1, 4e9) || !wxIn(n.t, -90, 70) || !wxCode(n.code)) return null;
  const o = { k: c.k, at: c.at, off: c.off, n: { ts: n.ts, t: n.t, ap: wxOpt(n.ap, -99, 90), rh: wxOpt(n.rh, 0, 100), ws: wxOpt(n.ws, 0, 400), code: n.code, day: n.day === 0 ? 0 : 1 }, d: [], h: [] };
  (Array.isArray(c.d) ? c.d : []).forEach(r => { if (Array.isArray(r) && wxIn(r[0], 1, 4e9) && wxIn(r[1], -90, 70) && wxIn(r[2], -90, 70)) o.d.push([r[0], r[1], r[2], wxOpt(r[3], 0, 100)]); });
  (Array.isArray(c.h) ? c.h : []).forEach(r => { if (Array.isArray(r) && wxIn(r[0], 1, 4e9) && wxIn(r[1], -90, 70) && wxCode(r[3])) o.h.push([r[0], r[1], wxOpt(r[2], 0, 100), r[3], r[4] === 0 ? 0 : 1]); });
  o.d = o.d.slice(0, 4); o.h = o.h.slice(0, 72);
  return o.d.length ? o : null;
}
/* respons Open-Meteo (timeformat=unixtime) -> data ringkas; null bila bentuknya tidak dikenali */
function wxParse(js, k, at) {
  if (!js || typeof js !== 'object') return null;
  const cu = js.current, hr = js.hourly, dy = js.daily;
  if (!cu || typeof cu !== 'object') return null;
  const c = { k: k, at: at, off: js.utc_offset_seconds, n: { ts: cu.time, t: cu.temperature_2m, ap: cu.apparent_temperature, rh: cu.relative_humidity_2m, ws: cu.wind_speed_10m, code: cu.weather_code, day: cu.is_day }, d: [], h: [] };
  const at2 = (a, i) => Array.isArray(a) ? a[i] : undefined;
  if (dy && Array.isArray(dy.time)) dy.time.forEach((ts, i) => c.d.push([ts, at2(dy.temperature_2m_max, i), at2(dy.temperature_2m_min, i), at2(dy.precipitation_probability_max, i)]));
  if (hr && Array.isArray(hr.time)) hr.time.forEach((ts, i) => c.h.push([ts, at2(hr.temperature_2m, i), at2(hr.precipitation_probability, i), at2(hr.weather_code, i), at2(hr.is_day, i)]));
  return wxCleanC(c);
}
const wxBlank = () => ({ on: true, updated: 0, c: null });
let xdb = wxBlank();
function wxClean(raw) {
  const b = wxBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const u = Number(raw.updated);
  b.updated = Number.isFinite(u) && u > 0 ? u : 0;
  b.on = raw.on !== false;
  b.c = b.on ? wxCleanC(raw.c) : null;
  return b;
}
STORES.wx = { key: KEY_WX, get: () => xdb }; dirty.wx = false;   // khusus perangkat: tidak ikut ekspor JSON
const wxKey = () => hxHas() ? ldb.lat.toFixed(2) + '|' + ldb.lon.toFixed(2) : '';
function wxUrl(lat, lon) {
  return WX_API + '?latitude=' + lat.toFixed(2) + '&longitude=' + lon.toFixed(2) +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m' +
    '&hourly=temperature_2m,precipitation_probability,weather_code,is_day' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=auto&timeformat=unixtime&forecast_days=2';
}
const WX_CODES = {
  0: ['Cerah', 'clear'], 1: ['Cerah berawan', 'few'], 2: ['Berawan sebagian', 'few'], 3: ['Mendung', 'cloud'],
  45: ['Berkabut', 'fog'], 48: ['Berkabut', 'fog'],
  51: ['Gerimis ringan', 'rain'], 53: ['Gerimis', 'rain'], 55: ['Gerimis lebat', 'rain'], 56: ['Gerimis dingin', 'rain'], 57: ['Gerimis dingin lebat', 'rain'],
  61: ['Hujan ringan', 'rain'], 63: ['Hujan', 'rain'], 65: ['Hujan lebat', 'rain'], 66: ['Hujan dingin', 'rain'], 67: ['Hujan dingin lebat', 'rain'],
  71: ['Salju ringan', 'snow'], 73: ['Salju', 'snow'], 75: ['Salju lebat', 'snow'], 77: ['Butiran salju', 'snow'],
  80: ['Hujan lokal ringan', 'rain'], 81: ['Hujan lokal', 'rain'], 82: ['Hujan lokal lebat', 'rain'],
  85: ['Hujan salju', 'snow'], 86: ['Hujan salju lebat', 'snow'],
  95: ['Badai petir', 'storm'], 96: ['Badai petir, hujan es', 'storm'], 99: ['Badai petir, hujan es lebat', 'storm']
};
const wxInfo = code => { const r = WX_CODES[code]; return r ? { l: r[0], k: r[1] } : { l: 'Cuaca tidak diketahui', k: 'cloud' }; };
const WX_P = {
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z"/>'
};
function wxIcon(kind, day) {
  const s = i => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + i + '</svg>';
  const cl = '<path d="' + WX_P.cloud + '"/>';
  if (kind === 'clear') return s(day ? WX_P.sun : WX_P.moon);
  if (kind === 'few') return s((day ? '<circle cx="8" cy="8" r="3"/><path d="M8 2v1.2M2 8h1.2M3.8 3.8l.9.9M12.2 3.8l-.9.9"/>' : '<path d="M10 3.6A4.4 4.4 0 1 0 14.6 9 3.4 3.4 0 0 1 10 3.6z"/>') + '<g transform="translate(6.5 8.5) scale(.72)"><path fill="var(--sf)" d="' + WX_P.cloud + '"/></g>');
  if (kind === 'fog') return s('<path d="M3 8h18M5 12h14M3 16h18M7 20h10"/>');
  if (kind === 'rain') return s('<path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>');
  if (kind === 'storm') return s('<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6"/>');
  if (kind === 'snow') return s('<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"/>');
  return s(cl);
}
let wxOpen = false, wxBusy = false, wxErr = '', wxFails = 0, wxRetryAt = 0, wxAt = 0;
function wxView(now) {
  const c = xdb.c;
  if (!c || !hxHas() || c.k !== wxKey()) return null;
  const age = now - c.at;
  if (age < -300000 || age > WX_MAXAGE) return null;
  const ns = now / 1000, off = c.off, dk = Math.floor((ns + off) / 86400);
  const d = c.d.find(r => Math.floor((r[0] + off) / 86400) === dk);
  if (!d) return null;
  const h0 = Math.floor((ns + off) / 3600) * 3600 - off, hrs = [];
  for (let i = 0; i < WX_N; i++) { const ts = h0 + i * WX_STEP * 3600, r = c.h.find(x => x[0] === ts); if (r) hrs.push(r); }
  return { c: c, age: age, d: d, hrs: hrs, h0: h0, tz: off / 3600, stale: age > WX_STALE };
}
function wxDue(now) {
  if (!booted || wxBusy || !xdb.on || !hxHas() || now < wxRetryAt) return false;
  const c = xdb.c;
  return !c || c.k !== wxKey() || now - c.at >= WX_TTL || now - c.at < -300000;
}
async function wxFetch() {
  if (wxBusy) return;
  const k = wxKey();
  if (!k || !xdb.on) return;
  wxBusy = true;
  if (curView === 'home' && !document.hidden) hxRender();   // b5: tampilkan penanda "sedang memperbarui"
  let err = '', c = null;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const tm = setTimeout(() => { if (ctl) ctl.abort(); }, WX_TIMEOUT);
  try {
    const res = await fetch(wxUrl(ldb.lat, ldb.lon), { signal: ctl ? ctl.signal : undefined, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
    if (!res.ok) err = 'http';
    else {
      let js = null;
      try { js = await res.json(); } catch (e) { js = null; err = ctl && ctl.signal.aborted ? 'net' : 'bad'; }
      if (!err) { c = wxParse(js, k, Date.now()); if (!c) err = 'bad'; }
    }
  } catch (e) { err = 'net'; }
  clearTimeout(tm); wxBusy = false;
  if (!xdb.on || wxKey() !== k) { if (curView === 'home') hxRender(); return; }   // lokasi atau pengaturan berubah selama permintaan: hasil dibuang
  const now = Date.now();
  if (c) { xdb.c = c; xdb.updated = now; wxErr = ''; wxFails = 0; wxRetryAt = 0; queueSave('wx'); }
  else { wxErr = err; wxFails++; wxRetryAt = now + Math.min(15, Math.pow(2, wxFails - 1)) * 60000; }   // b5: coba lagi sesudah 1, 2, 4, 8, lalu 15 menit
  if (curView === 'home') hxRender();
}
function wxTick(now) { if (wxDue(now)) wxFetch(); }
const wxT = x => { const r = Math.round(x); return (r < 0 ? '−' + (-r) : String(r)) + '°'; };
const wxP = x => x == null ? '–' : Math.round(x) + '%';
const wxMsg = e => (e === 'bad' ? 'Data cuaca dari layanan tidak bisa dibaca.' : e === 'http' ? 'Layanan cuaca sedang bermasalah.' : (typeof navigator !== 'undefined' && navigator.onLine === false ? 'Tidak ada internet. Cuaca belum bisa dimuat.' : 'Cuaca belum bisa dimuat. Periksa internet.')) + ' Dicoba lagi otomatis.';
const wxAgo = ms => { const m = Math.max(0, Math.floor(ms / 60000)); return m < 1 ? 'baru saja' : m < 60 ? m + ' menit lalu' : Math.floor(m / 60) + ' jam' + (m % 60 ? ' ' + (m % 60) + ' menit' : '') + ' lalu'; };
function wxRowHTML(now) {
  if (!xdb.on || !hxHas()) return '';
  const v = wxView(now);
  if (!v) {
    const retry = wxErr ? '<button class="btn sm" data-q="wxRetry" aria-disabled="' + wxBusy + '">Coba lagi</button>' : '';
    return '<div class="hx-r hx-wm" id="hxW"><p>' + (wxBusy || !wxErr ? 'Memuat cuaca…' : wxMsg(wxErr)) + '</p>' + retry + '</div>';
  }
  const n = v.c.n, inf = wxInfo(n.code), d = v.d, tz = v.tz;
  const ns = now / 1000, cand = [(Math.floor((ns + v.c.off) / 86400) + 1) * 86400 - v.c.off, (v.c.at + WX_MAXAGE) / 1000];
  if (!v.stale) cand.push((v.c.at + WX_STALE) / 1000);
  if (wxOpen) cand.push(v.h0 + 3600);
  wxAt = Math.min.apply(null, cand.filter(x => x * 1000 > now)) * 1000 + 500;
  const feel = n.ap != null && Math.abs(n.ap - n.t) >= 2 ? ' · terasa ' + wxT(n.ap) : '';
  const stamp = hxHM(v.c.at, tz) + (tz !== -new Date(now).getTimezoneOffset() / 60 ? ' ' + hxTzName(tz) : '');
  const lbl = 'Cuaca: ' + Math.round(n.t) + ' derajat, ' + inf.l + (feel ? ', terasa ' + Math.round(n.ap) + ' derajat' : '') + '. Hari ini ' + Math.round(d[2]) + ' sampai ' + Math.round(d[1]) + ' derajat' + (d[3] != null ? ', peluang hujan ' + Math.round(d[3]) + ' persen' : '') + (v.stale ? '. Data pukul ' + stamp : '') + '. Ketuk untuk ' + (wxOpen ? 'menutup' : 'melihat') + ' prakiraan per jam';
  let h = '<div class="hx-r hx-w' + (wxBusy ? ' upd' : '') + '" id="hxW"' + (wxBusy ? ' aria-busy="true"' : '') + '><button class="hx-wb" data-q="wxToggle" aria-expanded="' + wxOpen + '" aria-controls="wxList" aria-label="' + esc(lbl) + '">' +
    '<span class="hx-wi">' + wxIcon(inf.k, n.day) + '</span>' +
    '<span class="hx-wn"><b>' + wxT(n.t) + '</b><small>' + esc(inf.l) + feel + (v.stale ? ' · data ' + stamp : '') + '</small></span>' +
    '<span class="hx-wr"><span>' + wxT(d[2]) + ' – ' + wxT(d[1]) + '</span><span>Hujan ' + wxP(d[3]) + '</span></span>' + HX_CHEV + '</button>';
  if (wxOpen) {
    const cells = v.hrs.map(r => {
      const i2 = wxInfo(r[3]), hm = hxHM(r[0] * 1000, tz);
      return '<li' + (r[0] === v.h0 ? ' class="now"' : '') + ' aria-label="' + esc(hm + ': ' + i2.l + ', ' + Math.round(r[1]) + ' derajat' + (r[2] != null ? ', peluang hujan ' + Math.round(r[2]) + ' persen' : '')) + '">' +
        '<span class="t">' + hm + '</span><span class="i">' + wxIcon(i2.k, r[4]) + '</span><b>' + wxT(r[1]) + '</b><small>' + wxP(r[2]) + '</small></li>';
    }).join('');
    const det = [n.rh != null ? 'Kelembapan ' + Math.round(n.rh) + '%' : '', n.ws != null ? 'Angin ' + Math.round(n.ws) + ' km/jam' : ''].filter(Boolean).join(' · ');
    h += '<div class="hx-wl" id="wxList">' + (v.hrs.length > 1 ? '<ol class="hx-wh" aria-label="Prakiraan per jam">' + cells + '</ol>' : '<p class="note">Prakiraan per jam tidak tersedia.</p>') +
      (det ? '<p class="hx-wd">' + det + '</p>' : '') +
      (wxErr ? '<p class="note">Pembaruan terakhir gagal. ' + wxMsg(wxErr) + ' Data di atas pukul ' + stamp + '.</p>' : '') +
      '<div class="hx-wf"><p class="note">Sumber: Open-Meteo.com. Koordinat lokasi (2 desimal) dikirim ke layanan itu. Diperbarui otomatis tiap ' + (WX_TTL / 60000) + ' menit selama Beranda terbuka. Data pukul ' + stamp + ' (<span id="wxAgo">' + wxAgo(now - v.c.at) + '</span>).</p><button class="btn sm" data-q="wxRetry" aria-disabled="' + wxBusy + '">' + (wxBusy ? 'Memperbarui…' : 'Perbarui sekarang') + '</button></div></div>';
  }
  return h + '</div>';
}
/* ========= v71: latar cuaca beranimasi di kartu Beranda ========= */
const wxSS = (x, a, b) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
const wxLv = c => [65, 67, 82, 75, 86, 95, 96, 99].includes(c) ? 3 : [53, 55, 57, 61, 63, 66, 80, 81, 73, 85].includes(c) ? 2 : 1;
const wxSunY = p => p < .5 ? 112 - 48 * p : 88 - 144 * (p - .5);   // di bawah garis cakrawala sebelum terbit, naik sesudahnya
function wxScene() {
  if (!xdb.on || !hxHas()) return null;
  const now = hxEff(), v = wxView(Date.now()); if (!v) return null;
  const n = v.c.n, k = wxInfo(n.code).k;
  let ph = '', pr = 0, dp = null;
  try {
    const p = hxParts(now, ldb), it = hxDay(p.y, p.m, p.d, ldb).items, W = 45 * 6e4, r = it[1].at, st = it[4].at;
    if (r != null && Math.abs(now - r) < W) { ph = 'd'; pr = (now - r + W) / (2 * W); }
    else if (st != null && Math.abs(now - st) < W) { ph = 's'; pr = (now - st + W) / (2 * W); }
    if (hxPrev != null && r != null && st != null) dp = now >= r && now < st ? 1 : 0;
  } catch (e) {}
  const clr = k === 'clear' || k === 'few', day = dp != null ? dp : (n.day ? 1 : 0), lv = k === 'storm' ? 3 : wxLv(n.code);
  let nt = day ? 0 : 1, hz = 0, sy = 16;
  if (ph === 'd') { nt = 1 - wxSS(pr, .1, .75); hz = Math.sin(Math.PI * pr); sy = wxSunY(pr); }
  if (ph === 's') { nt = wxSS(pr, .3, .95); hz = Math.sin(Math.PI * pr); sy = wxSunY(1 - pr); }
  const f = x => x.toFixed(3);
  return { k, lv, key: k + '|' + lv, v: { '--nt': f(nt), '--hz': f(hz * (clr ? 1 : .5)), '--sy': f(sy), '--su': clr && (day || ph) ? '1' : '0', '--mo': f(clr ? nt : 0), '--cb': f(1 - .55 * nt) } };
}
function wxBgBuild(k, lv) {
  const R = (a, b) => a + Math.random() * (b - a), f = (x, d = 1) => x.toFixed(d), A = (n, g) => Array.from({ length: n }, g).join('');
  let h = '<div class="dk"></div><div class="hor"></div>';
  if (k === 'clear' || k === 'few') h += '<div class="sunw"><div class="rays"></div><div class="sun"></div></div><div class="moon"></div><div class="stars">' + A(26, () => '<div style="left:' + f(R(2, 98)) + '%;top:' + f(R(3, 60)) + '%;--d:' + f(R(1.6, 4.2)) + 's;animation-delay:-' + f(R(0, 4)) + 's"></div>') + '</div>';
  const nc = { clear: 1, few: 3, cloud: 6, rain: 6, storm: 7, snow: 5 }[k] || 0;
  h += '<div class="cls">' + A(nc, () => '<div class="cl" style="--w:' + f(R(110, 190), 0) + 'px;top:' + f(R(-4, 46), 0) + '%;--du:' + f(R(38, 80), 0) + 's;animation-delay:-' + f(R(0, 60), 0) + 's;--o:' + f(k === 'clear' ? .55 : R(.8, 1), 2) + '"></div>') + '</div>';
  if (k === 'fog') h += '<div class="fgs">' + [8, 30, 52].map(t => '<div class="fg" style="--t:' + t + '%;--du:' + f(R(9, 15)) + 's"></div>').join('') + '</div>';
  if (k === 'rain' || k === 'storm') {
    const du = [0, 1.5, 1.05, .75][lv];
    h += '<div class="pr">' + A([0, 18, 38, 62][lv], () => '<div class="drop" style="--x:' + f(R(0, 105)) + '%;--h:' + f(R(14, 28), 0) + 'px;--du:' + f(du * R(.85, 1.2), 2) + 's;animation-delay:-' + f(R(0, 1.5), 2) + 's"></div>') + '</div>';
    if (lv > 1) h += '<div class="pr">' + A(7, () => '<div class="rip" style="left:' + f(R(2, 92)) + '%;--y:' + f(R(2, 14), 0) + 'px;animation-delay:-' + f(R(0, 1.1), 2) + 's"></div>') + '</div>';
  }
  if (k === 'storm') h += [[7, 2, 28], [11, 6, 66]].map(a => '<div class="flash" style="--du:' + a[0] + 's;--x:' + a[2] + '%;animation-delay:-' + a[1] + 's"></div><div class="bolt" style="--du:' + a[0] + 's;left:' + a[2] + '%;animation-delay:-' + a[1] + 's"><div></div></div>').join('');
  if (k === 'snow') h += '<div class="pr">' + A([0, 22, 36, 54][lv], () => '<div class="flake" style="left:' + f(R(0, 100)) + '%;--z:' + f(R(2, 5.5)) + 'px;--du:' + f(R(5, 10)) + 's;animation-delay:-' + f(R(0, 10)) + 's"></div>') + '</div>';
  return h;
}
let wxBgKey = '', wxBgH = '';
function wxBgApply() {
  const hx = $('#hx'); if (!hx) return;
  try {
    const sc = wxScene();
    let L = hx.querySelector(':scope > .wxbg');
    if (!sc) { if (L) L.remove(); hx.classList.remove('wxon'); wxBgKey = ''; return; }
    const ch = wxBgKey !== sc.key;
    if (ch) wxBgH = wxBgBuild(sc.k, sc.lv);
    if (!L || ch) {
      if (!L) { L = document.createElement('div'); L.className = 'wxbg'; L.setAttribute('aria-hidden', 'true'); hx.prepend(L); }
      L.dataset.s = sc.k; L.innerHTML = wxBgH; wxBgKey = sc.key;
    }
    hx.classList.add('wxon');
    for (const [n, v] of Object.entries(sc.v)) if (L.style.getPropertyValue(n) !== v) L.style.setProperty(n, v);
  } catch (e) {}
}
{ const hxRender0 = hxRender; hxRender = function () { hxRender0(); wxBgApply(); }; }
document.addEventListener('visibilitychange', () => { const l = $('#hx .wxbg'); if (l) l.classList.toggle('pause', document.hidden); });
QACT.wxToggle = () => { wxOpen = !wxOpen; hxRender(); };
QACT.wxRetry = () => { if (wxBusy) return; wxRetryAt = 0; wxFails = 0; wxFetch(); hxRender(); };
/* b5: pembaruan otomatis. Saat internet kembali atau halaman dipulihkan dari cache peramban, jeda coba-lagi dibatalkan dan data yang sudah waktunya langsung diambil. Permintaan tetap hanya bila Beranda terbuka dan tab terlihat. */
function wxWake() {
  if (!xdb.on || !hxHas()) return;
  wxRetryAt = 0; if (wxErr) wxFails = 0;
  if (curView === 'home' && !document.hidden) wxTick(Date.now());
}
window.addEventListener('online', wxWake);
window.addEventListener('pageshow', ev => { if (ev.persisted) { wxWake(); hxTick(); } });
const wxSwHTML = () => '<div class="hx-swb"><button class="hx-sw" role="switch" aria-checked="' + xdb.on + '" data-q="wxSw"><span>Tampilkan cuaca</span><i aria-hidden="true"></i></button>' +
  '<p class="hx-cur">Perkiraan cuaca diambil dari Open-Meteo.com lewat internet dan diperbarui otomatis tiap 15 menit selama Beranda terbuka, dan koordinat lokasi (2 desimal) ikut dikirim ke layanan itu. Tanpa akun dan tanpa kunci. Jadwal shalat tetap dihitung di perangkat tanpa internet.</p></div>';
QACT.wxSw = el => {
  xdb.on = !xdb.on; xdb.updated = Date.now();
  wxErr = ''; wxFails = 0; wxRetryAt = 0;
  if (!xdb.on) { xdb.c = null; wxOpen = false; }
  queueSave('wx');
  el.setAttribute('aria-checked', String(xdb.on));
  renderHome();
  toast(xdb.on ? 'Cuaca ditampilkan' : 'Cuaca dimatikan. Tidak ada data dikirim');
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b24a: Object.freeze({ info: wxInfo, icon: wxIcon, parse: wxParse, cleanC: wxCleanC, clean: wxClean, url: wxUrl, view: wxView, due: wxDue, fetch: wxFetch, row: wxRowHTML, key: KEY_WX, state: () => Object.assign({}, xdb), err: () => wxErr, busy: () => wxBusy, retryAt: () => wxRetryAt, fails: () => wxFails, at: () => wxAt, open: () => wxOpen, ttl: WX_TTL, stale: WX_STALE, wake: wxWake, ago: wxAgo, maxAge: WX_MAXAGE, timeout: WX_TIMEOUT }) }));
/* ===== v112: easter egg langit DIHAPUS (permintaan pemilik 4 Nov 2026). Membersihkan sisa data lama di peramban. ===== */
try { for (const k of ['dailylog:egg:off', 'dailylog:egg:next', 'dailylog:egg:dex']) localStorage.removeItem(k); } catch (e) { /* abaikan */ }
/* ===== v110+v111: latar pixel art header Beranda (tahap 110; detail resolusi tinggi tahap 111). Kanvas prosedural di dalam #hxSky, di bawah teks, tanpa klik. Membalik: patch110.py --reverse ===== */
/* ===== /v110 mesin ===== */
/* ===== v121: mode nikmati animasi header Beranda. Tiga ketukan cepat di header (bukan tombol/tautan) = sembunyikan/tampilkan isi header; kartu Beranda tidak disentuh. Hanya di memori (muat ulang = normal). ===== */
(function () {
  const SKIP = 'a,button,input,select,textarea,label,summary,[data-q],[data-act],[role="button"],[tabindex]';
  let taps = [], lx = 0, ly = 0;
  function flip() {
    const v = document.getElementById('v-home'); if (!v) return;
    const on = v.classList.toggle('skyfocus'); try { document.dispatchEvent(new CustomEvent('dl:skyfocus', { detail: on })); } catch (e) { /* tanpa suara */ }
    if (on) { try { toast('Mode animasi: ketuk 3× cepat lagi untuk kembali.'); } catch (e) { /* tanpa toast */ } }
  }
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.closest || !t.closest('#hxSky') || t.closest(SKIP)) { taps = []; return; }
    const n = performance.now();
    if (taps.length && (n - taps[taps.length - 1] > 650 || Math.hypot(e.clientX - lx, e.clientY - ly) > 56)) taps = [];
    taps.push(n); lx = e.clientX; ly = e.clientY;
    if (taps.length >= 3) { taps = []; flip(); }
  }, true);
})();
/* ===== v110: sambungan latar pixel art ke header Beranda. Kanvas 0,5 px CSS per piksel (2x, tetap), 10 bingkai/detik, hanya saat Beranda terbuka dan tab terlihat. Mati: localStorage['dailylog:pxbg:off']='1'. Adegan tetap: localStorage['dailylog:pxbg:scene']=airterjun|padang|dusun|kastil|danau|reruntuhan. ===== */
(() => {
  const OFFK = 'dailylog:pxbg:off', SCK = 'dailylog:pxbg:scene', T0 = performance.now();
  /* ===== vB1 (20 Nov 2026): HEMAT BATERAI latar header. (1) bingkai berhenti saat header keluar layar / tab tersembunyi / bukan Beranda; (2) jarak bingkai menyesuaikan biaya gambar; (3) lambat sesudah diam 30 dtk (1 bingkai/dtk sesudah 3 menit), mode nikmati dan Tonton adegan tetap penuh; (4) baterai <= 20% = 10 bingkai/dtk, <= 10% = 4 bingkai/dtk (Battery API, bila ada); (5) mesin dihitung di Web Worker (thread utama bebas). Mati: localStorage['dailylog:pxbg:wk']='0' (tanpa Worker, jalur lama). Atur: DL.pxbg.tune; cek: DL.pxbg.info(). Membalik: patch_hemat_hdr.py --reverse ===== */
  const SRCEL = document.currentScript;
  let io = null, vis = true, lastAct = performance.now(), chkT = 0;
  let cv = null, cx = null, id = null, u32 = null, eng = null, key = '', lastScene = '', ro = null, rt = 0, tm = 0, roEl = null, dims = [0, 0];
  let watch = null, wTm = 0;   // v162-T4b-2a: 'Tonton adegan' = adegan paksa SEMENTARA (hanya di memori, tidak disimpan)
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const off = () => lsGet(OFFK) === '1';
  /* vR2 (8 Nov 2026): resolusi 2x TETAP; sakelar resolusi (SS(), kunci 'dailylog:pxbg:s', mode 1x dan hemat baterai) DIHAPUS atas permintaan pemilik. 1 piksel seni = 0,5 px CSS. */
  /* vA (Tahap 164 langkah 1-2): kanvas = bentuk header SEBENARNYA (lebar DAN tinggi sama-sama dibagi satu faktor f), jadi piksel seni tetap persegi; batas tinggi 300 yang meregangkan piksel DILEPAS. f = PXS (0,5), dinaikkan hanya bila jumlah piksel melewati PXMAX (layar lebar), pada kedua sumbu sekaligus. */
  const PXS = .5, PXMAX = 800000, pxScale = r => Math.max(PXS, Math.sqrt(Math.max(1, r.width * r.height) / PXMAX));   /* 2x di HP 360 x 508 = 731.520 piksel harus muat */
  const still = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  const nowMs = () => { try { return typeof hxEff === 'function' ? hxEff() : Date.now(); } catch (e) { return Date.now(); } };
  const minOf = ms => { const d = new Date(ms); return d.getHours() * 60 + d.getMinutes(); };
  const phaseOf = m => m >= 300 && m < 600 ? 0 : m >= 600 && m < 930 ? 1 : m >= 930 && m < 1140 ? 2 : 3;   // pagi, siang, sore, malam
  const wx = () => { try { const v = wxView(Date.now()); return v && xdb.on ? (wxInfo(v.c.n.code).k || 'clear') : 'clear'; } catch (e) { return 'clear'; } };   // cuaca kini (v112: langsung dari modul cuaca)
  const hourIdx = ms => Math.floor((ms - new Date(ms).getTimezoneOffset() * 60000) / 3600000);   // v123: nomor jam lokal
  function pick(ms, k) {
    if (watch && Date.now() < watch.until) return watch.sc;   // v162-T4b-2a: kedaluwarsa dengan sendirinya walau pencacah tertunda (tab tersembunyi)
    const sv = lsGet(SCK); if (sv && PXB.SCENES.includes(sv)) return sv;
    return PXB.sceneAt(hourIdx(ms));   // v123: ganti tiap jam, 5 jam berturut-turut tidak pernah sama
  }

  const CK = 'dailylog:pxbg:cast', AIK = 'dailylog:pxbg:ai';   // AIK = '0' mematikan sutradara AI
  const VOCG = { padang: 'rab,but,deer,bird,bat,npc,hen,dog,fox,horse,cow', dusun: 'npc,hen,dog,bird,bat,rab,cow,horse', kastil: 'knight,bird,bat,npc,dog', danau: 'duck,deer,bird,bat,npc,dog,rab,ang,tali,nel', reruntuhan: 'crow,fox,bat,gem,kam,pej,owl,bird', airterjun: 'deer,bird,but,bat,rab,fox,horse,elephant,dog', pantai: 'gull,crab,npc,bat,dog', pegunungan: 'goat,eagle,npc,fox,deer,dog', kereta: 'deer,fox,rab,bird', akuarium: 'tetra,clown,angel,jelly,crab,snail', atap: 'cat,bird,bat', lorong: 'cat,npc', perpus: 'cat,owl', embun: 'lady,fly', mercu: 'bird,boat', kapal: 'bird' };
  let castBusy = false, castFail = 0;
  const castKey = (scene, ms, k) => [Math.floor(ms / 86400000), scene, phaseOf(minOf(ms)), k].join('|');
  const getCast = ck => { try { const c = JSON.parse(lsGet(CK) || 'null'); return c && c.key === ck && Array.isArray(c.cast) ? c : null; } catch (e) { return null; } };
  async function askCast(scene, ms, k, ck) {
    if (castBusy || lsGet(AIK) === '0' || Date.now() < castFail || typeof AI === 'undefined' || AI.run || !AI.ready().ok) return;
    castBusy = true;
    try {
      const ph = ['pagi', 'siang', 'sore', 'malam'][phaseOf(minOf(ms))];
      const r = await AI.ask({ task: 'sutradara-latar', json: true, max: 300, timeout: 20000,
        system: 'Kamu sutradara animasi latar pixel art di header aplikasi. Pilih tokoh (orang dan hewan) yang masuk akal untuk adegan, waktu, dan cuaca yang diberikan. Hanya pakai kode dari daftar "spesies". Balas HANYA JSON: {"cast":[{"k":"kode","n":1}],"catatan":"satu kalimat alasan"}. Total maksimal 8 tokoh. Cuaca badai: kosongkan cast. Hujan atau salju: sedikit tokoh, tanpa burung dan kupu-kupu.',
        user: JSON.stringify({ adegan: scene, waktu: ph, cuaca: k, spesies: VOCG[scene].split(',') }) });
      if (r.ok && r.data && Array.isArray(r.data.cast)) {
        const ok = VOCG[scene].split(','), cast = r.data.cast.map(c => [String(c && c.k), (c && c.n) | 0]).filter(c => ok.includes(c[0]) && c[1] > 0).slice(0, 8);
        try { localStorage.setItem(CK, JSON.stringify({ key: ck, cast, note: String(r.data.catatan || '').slice(0, 160) })); } catch (e) { /* penyimpanan penuh: abaikan */ }
        key = ''; step(true);
      } else castFail = Date.now() + 30 * 60000;
    } catch (e) { castFail = Date.now() + 30 * 60000; } finally { castBusy = false; }
  }
  const WATCH_MS = 60000, canWatch = () => { try { return !off() && typeof curView !== 'undefined' && curView === 'home' && !!document.getElementById('hxSky'); } catch (e) { return false; } };
  function watchOff() { if (!watch) return false; clearTimeout(wTm); watch = null; key = ''; step(true); return true; }
  function watchOn(sc, ms) {
    if (typeof sc !== 'string' || !PXB.SCENES.includes(sc) || !canWatch()) return false;
    const d = Math.min(120000, Math.max(1000, +ms > 0 ? +ms : WATCH_MS)); clearTimeout(wTm); watch = { sc, until: Date.now() + d + 15000 }; key = ''; step(true);   // jendela cadangan 15 dtk selama adegan dibangun (adegan berat butuh > 1 dtk); hitungan sebenarnya mulai SESUDAH adegan tampil
    if (watch) { watch.until = Date.now() + d; wTm = setTimeout(() => watchOff(), d + 30); }
    return true;
  }
  const watching = () => watch && Date.now() < watch.until ? { scene: watch.sc, left: watch.until - Date.now() } : null;
  function detach() { if (cv) { cv.remove(); cv = null; } const s = document.getElementById('hxSky'); if (s) s.classList.remove('px'); if (ro) { ro.disconnect(); ro = null; roEl = null; } if (io) { io.disconnect(); io = null; } wkStop(); key = ''; eng = null; }
  function attach(sky) {
    if (cv && cv.parentNode === sky) return;
    if (cv) cv.remove();
    cv = document.createElement('canvas'); cv.className = 'pxbg'; cv.setAttribute('aria-hidden', 'true'); sky.insertBefore(cv, sky.firstChild); cx = cv.getContext('2d'); key = ''; eng = null;
    sky.classList.add('px');
    if (typeof ResizeObserver === 'function') { if (ro) ro.disconnect(); ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { step(true); }, 140); });   /* vA: kunci tidak dikosongkan; ukuran sudah ada di kunci dan selisih kecil tidak membangun ulang */ ro.observe(sky); roEl = sky; }
    if (typeof IntersectionObserver === 'function') { if (io) io.disconnect(); vis = true; io = new IntersectionObserver(es => { const v = es[es.length - 1].isIntersecting; if (v === vis) return; vis = v; if (v) kick(); }); io.observe(sky); }
  }
  function build(sky) {
    const r = sky.getBoundingClientRect(), f = pxScale(r), W0 = Math.max(40, Math.ceil(r.width / f)), H0 = Math.max(40, Math.ceil(r.height / f));
    const near = !!eng && dims[0] > 0 && Math.abs(W0 - dims[0]) <= Math.max(2, dims[0] * .015) && Math.abs(H0 - dims[1]) <= Math.max(3, dims[1] * .015);   // vA: selisih kecil (pembulatan, bilah gulir) tidak membangun ulang adegan
    const W = near ? dims[0] : W0, H = near ? dims[1] : H0;
    const ms = nowMs(), m = minOf(ms), k = wx(), scene = pick(ms, k), day = Math.floor(ms / 86400000), seed = PXB.seedAt(hourIdx(ms));
    const ck = castKey(scene, ms, k), cc = getCast(ck), kk = [scene, m, k, W, H, seed, cc ? 1 : 0].join('|'); if (kk === key && eng) return;
    key = kk;
    if (lastScene && lastScene !== scene && cv && dims[0] === W && dims[1] === H) fadeOld();
    /* v162-T2: bintang tersembunyi. Posisi DIPAKU per (adegan, jam, ukuran) supaya tidak melompat tiap menit; area hindar dihitung sekali per kunci itu. */
    const hi = hourIdx(ms), pk0 = [scene, hi, W, H].join('|'); if (!starPin || starPin.key !== pk0) starPin = { key: pk0, avoid: null, x: null, y: null };
    if (!starPin.avoid) { try { starPin.avoid = starAvoid(sky, W, H); } catch (e) { starPin.avoid = []; } }
    hitR = Math.max(8, Math.round(18 * W / Math.max(1, r.width)));
    const bo = { W, H, scene, min: m, wx: k, seed, hi, found: !!STG[scene], pin: starPin.x == null ? null : { x: starPin.x, y: starPin.y }, avoid: starPin.avoid, hitR, cast: cc ? cc.cast : null }, same = !!eng && eng.scene === scene && eng.W === W && eng.H === H;
    eng = (wkOn() && wkBuild(bo, same)) || PXB.create(Object.assign(bo, { keep: same ? (eng.fauna || null) : null })); lastScene = scene; dims = [W, H];
    if (!cc) askCast(scene, ms, k, ck);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (!eng.isWk) { id = cx.createImageData(W, H); u32 = new Uint32Array(id.data.buffer); }
  }
  function fadeOld() {   // pergantian adegan: kanvas lama memudar 1 detik di atas yang baru
    try { const o = document.createElement('canvas'); o.className = 'pxbg pxold'; o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); cv.parentNode.insertBefore(o, cv.nextSibling); requestAnimationFrame(() => { o.style.opacity = '0'; }); setTimeout(() => o.remove(), 1200); } catch (e) { /* abaikan */ }
  }
  function pinStar() { if (eng && eng.star && eng.star.ready && starPin && starPin.x == null) { starPin.x = eng.star.x; starPin.y = eng.star.y; } }
  function draw() { if (!eng) return; if (eng.isWk) { wkFrame(); return; } const t0 = performance.now(); eng.frame(still() ? 4 : (t0 - T0) / 1000, u32); pinStar(); cx.putImageData(id, 0, 0); const d = performance.now() - t0; cost = cost ? cost * .7 + d * .3 : d; }
  /* ===== v162-T2: bintang tersembunyi, sambungan glue. STG = adegan yang sudah ditemukan (sementara di memori; penyimpanan koleksi menyusul di T3). Hanya BINTANG yang boleh diketuk (kecuali ketuk 3x mode animasi); ketukan lain tidak melakukan apa pun. ===== */
  /* v162-T3: koleksi bintang tersimpan di localStorage['dailylog:star:got'] = { adegan: waktuTemu(ms) }. Khusus perangkat, tidak ikut ekspor JSON. Dibaca dengan try/catch dan disaring (hanya adegan dikenal, angka positif); disimpan dengan penggabungan (waktu paling awal menang, entri tab lain tidak terhapus); kunci = adegan, jadi tidak ada entri dobel. Penyimpanan diblokir = koleksi tetap hidup di memori sesi ini. */
  const SKG = 'dailylog:star:got';
  function stgRead() { const o = {}; try { const j = JSON.parse(localStorage.getItem(SKG) || 'null'); if (j && typeof j === 'object' && !Array.isArray(j)) for (const sc of PXB.SCENES) { const t = j[sc]; if (typeof t === 'number' && isFinite(t) && t > 0) o[sc] = Math.floor(t); } } catch (e) { /* kosong */ } return o; }
  const STG = stgRead(), SKIPS = 'a,button,input,select,textarea,label,summary,[data-q],[data-act],[role="button"],[tabindex]';
  function stgSave() { const cur = stgRead(); for (const sc in STG) cur[sc] = cur[sc] ? Math.min(cur[sc], STG[sc]) : STG[sc]; for (const sc in cur) STG[sc] = cur[sc]; try { localStorage.setItem(SKG, JSON.stringify(cur)); return true; } catch (e) { return false; } }
  window.addEventListener('storage', e => { if (e.key !== SKG) return; const o = stgRead(); for (const sc in o) STG[sc] = STG[sc] ? Math.min(STG[sc], o[sc]) : o[sc]; });
  let starPin = null, hitR = 20;
  function starAvoid(sky, W, H) {
    const r = sky.getBoundingClientRect(), sx = W / Math.max(1, r.width), sy = H / Math.max(1, r.height), A = [];
    sky.querySelectorAll('*').forEach(el => { if (el.tagName === 'CANVAS' || el.classList.contains('wxbg') || el.closest('.wxbg')) return; const leaf = !el.children.length && (el.textContent || '').trim(); if (!leaf && !el.matches(SKIPS)) return; const b = el.getBoundingClientRect(); if (b.width < 2 || b.height < 2) return; A.push([(b.left - r.left) * sx, (b.top - r.top) * sy, (b.right - r.left) * sx, (b.bottom - r.top) * sy]); });
    return A;
  }
  document.addEventListener('click', e => {
    const t = e.target, st = eng && eng.star; if (!st || st.off || st.found || !cv || !t || !t.closest || !t.closest('#hxSky') || t.closest(SKIPS)) return;
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (!st.hit((e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height, hitR)) return;
    e.stopPropagation(); const sc = eng.scene, fresh = !STG[sc]; if (fresh) STG[sc] = Date.now(); const saved = stgSave(); st.pop();
    try { document.dispatchEvent(new CustomEvent('dl:starfound', { detail: { scene: sc, saved, fresh } })); } catch (er) { /* tanpa peristiwa */ }
  }, true);
  function step(force) {
    try {
      if (off()) { if (cv) detach(); return; }
      const sky = document.getElementById('hxSky');
      if (!sky || typeof curView === 'undefined' || curView !== 'home') return;
      const nw = performance.now();
      if (force || !eng || !cv || !cv.isConnected || nw - chkT > 1000) {   // ukur ulang tata letak paling sering 1x/dtk (ResizeObserver tetap memaksa saat ukuran berubah)
        chkT = nw;
        if (cv && !cv.isConnected) { cv = null; key = ''; eng = null; }
        attach(sky); build(sky);
      }
      if (!document.hidden || force) draw();
    } catch (e) { /* latar gagal: header tetap tampil dengan gradasi lama */ }
  }
  /* ----- vB1: penjadwal hemat baterai ----- */
  const TUNE = { base: 50, idle1: 30000, idle2: 180000, kM: 2.5, kW: 1.6, cap: 1500 };   // base = jeda dasar (ms); kM/kW = jeda minimal = biaya gambar x faktor (jalur utama / Worker)
  let cost = 0, bat = null;
  try { if (navigator.getBattery) navigator.getBattery().then(b => { bat = b; }, () => { /* tanpa API baterai */ }); } catch (e) { /* abaikan */ }
  const fullRate = () => { const v = document.getElementById('v-home'); return !!(v && v.classList.contains('skyfocus')) || !!watching(); };
  const batLvl = () => bat && !bat.charging && isFinite(bat.level) ? bat.level : 1;
  function ivl() {
    if (still()) return 20000;
    let v = TUNE.base; const idle = performance.now() - lastAct, L = batLvl();
    if (!fullRate()) { if (idle > TUNE.idle2) v = 1000; else if (idle > TUNE.idle1) v = 200; }
    if (L <= .1) v = Math.max(v, 250); else if (L <= .2) v = Math.max(v, 100);
    return Math.max(v, Math.min(TUNE.cap, cost * (eng && eng.isWk ? TUNE.kW : TUNE.kM)));
  }
  const wantRun = () => !document.hidden && vis && !off() && typeof curView !== 'undefined' && curView === 'home';
  function loop() { clearTimeout(tm); tm = 0; if (!wantRun()) return; tm = setTimeout(() => { tm = 0; step(); loop(); }, ivl()); }
  function kick() { if (!tm && wantRun()) { step(true); loop(); } }
  const act = () => { const was = performance.now() - lastAct > TUNE.idle1; lastAct = performance.now(); if (tm) { if (was) loop(); } else kick(); };
  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach(n => addEventListener(n, act, { passive: true, capture: true }));
  /* ----- vB1: Web Worker (mesin PXB dijalankan di luar thread utama; sumbernya diambil dari skrip ini sendiri) ----- */
  let wkr = null, wkFail = false, wkGen = 0, wkBuf = null, wkBusy = false, wkWd = 0, wkUrl = '';
  function WKJOB() {
    let e = null, G = 0;
    const star = x => { const s = x && x.star; return s ? { x: s.x, y: s.y, kind: s.kind, rad: s.rad, ready: s.ready, off: s.off, found: s.found } : null; };
    self.onmessage = ev => {
      const d = ev.data;
      try {
        if (d.t === 'build') { const o = d.o; o.keep = d.keepOld && e && e.scene === o.scene && e.W === o.W && e.H === o.H ? e.fauna : null; e = PXB.create(o); G = d.g; self.postMessage({ t: 'built', g: G, star: star(e) }); }
        else if (d.t === 'frame') {
          if (!e || d.g !== G) { self.postMessage({ t: 'frame', g: d.g, buf: d.buf, skip: 1 }, [d.buf]); return; }
          const t0 = performance.now(); e.frame(d.time, new Uint32Array(d.buf));
          self.postMessage({ t: 'frame', g: G, buf: d.buf, ms: performance.now() - t0, star: star(e) }, [d.buf]);
        } else if (d.t === 'pop') { if (e && e.star) e.star.pop(); }
      } catch (err) { self.postMessage({ t: 'err', msg: String((err && err.message) || err) }); }
    };
  }
  const wkOn = () => !wkFail && lsGet('dailylog:pxbg:wk') !== '0' && typeof Worker === 'function' && typeof Blob === 'function' && !!SRCEL;
  function wkStop() { clearTimeout(wkWd); if (wkr) { try { wkr.terminate(); } catch (e) { /* abaikan */ } wkr = null; } if (wkUrl) { try { URL.revokeObjectURL(wkUrl); } catch (e) { /* abaikan */ } wkUrl = ''; } wkBuf = null; wkBusy = false; wkGen++; }
  function wkFailNow(why) { wkFail = true; wkStop(); try { console.warn('pxbg: Worker gagal, memakai jalur utama:', why); } catch (e) { /* abaikan */ } key = ''; eng = null; step(true); }
  function wkStart() {
    if (wkr) return wkr;
    const a = SRCEL.textContent, i = a.indexOf('\nconst PXB = (() => {'), j = a.indexOf('/* ===== /v110 ' + 'mesin ===== */');
    let body;
    if (i >= 0 && j >= i) body = a.slice(i + 1, j);   // satu file: sumber mesin ada di skrip yang sama
    else { const E = document.getElementById('dlEngine'); if (!E || !E.src) throw new Error('sumber mesin tidak ditemukan'); body = 'importScripts(' + JSON.stringify(E.src) + ');'; }   // dipecah: Worker memuat engine.js
    wkUrl = URL.createObjectURL(new Blob([body + '\n;(' + WKJOB.toString() + ')();'], { type: 'text/javascript' }));
    const w = new Worker(wkUrl);
    w.onmessage = ev => wkMsg(ev.data); w.onerror = ev => { wkFailNow((ev && ev.message) || 'galat Worker'); };
    return (wkr = w);
  }
  function wkBuild(o, same) {
    let w; try { w = wkStart(); } catch (e) { wkFail = true; wkStop(); return null; }
    o.starForce = !!PXB.storyOk(o.scene);   // DL_STORY hanya ada di thread utama; Worker tidak bisa menilai sendiri apakah adegan punya bintang
    const g = ++wkGen; wkBuf = new ArrayBuffer(o.W * o.H * 4); wkBusy = false;
    const p = { isWk: true, W: o.W, H: o.H, scene: o.scene, star: null, built: false, fauna: null };
    try { w.postMessage({ t: 'build', g, o, keepOld: same }); } catch (e) { wkFail = true; wkStop(); return null; }
    clearTimeout(wkWd); wkWd = setTimeout(() => { if (eng === p && !p.built) wkFailNow('Worker tidak menjawab'); }, 25000);
    return p;
  }
  function wkFrame() {
    if (!wkr || !eng || !eng.isWk || !eng.built || wkBusy || !wkBuf) return;
    const b = wkBuf; wkBuf = null; wkBusy = true;
    try { wkr.postMessage({ t: 'frame', g: wkGen, time: still() ? 4 : (performance.now() - T0) / 1000, buf: b }, [b]); } catch (e) { wkBusy = false; wkBuf = b; }
  }
  function wkStar(s) {
    if (!eng || !eng.isWk) return;
    if (!s) { eng.star = null; return; }
    let t = eng.star;
    if (!t) { t = eng.star = { x: 0, y: 0, kind: '', rad: 3, ready: false, off: false, found: false, hit: (x, y, r) => !t.off && !t.found && Math.hypot(x - t.x, y - t.y) <= r, pop: () => { t.found = true; try { if (wkr) wkr.postMessage({ t: 'pop' }); } catch (e) { /* abaikan */ } } }; }
    t.x = s.x; t.y = s.y; t.kind = s.kind; t.rad = s.rad; t.ready = s.ready; t.off = s.off; if (s.found) t.found = true;
  }
  function wkMsg(d) {
    if (!d) return;
    if (d.t === 'err') { wkFailNow(d.msg); return; }
    if (d.t === 'built') { if (wkUrl) { try { URL.revokeObjectURL(wkUrl); } catch (e) { /* abaikan */ } wkUrl = ''; } if (d.g !== wkGen || !eng || !eng.isWk) return; clearTimeout(wkWd); eng.built = true; wkStar(d.star); wkFrame(); return; }
    if (d.t === 'frame') {
      if (d.g !== wkGen || !eng || !eng.isWk) return;   // bingkai usang (adegan sudah diganti): bufer dibuang
      wkBuf = d.buf; wkBusy = false;
      if (d.skip) return;
      cost = cost ? cost * .7 + d.ms * .3 : d.ms; wkStar(d.star); pinStar();
      try { cx.putImageData(new ImageData(new Uint8ClampedArray(d.buf), eng.W, eng.H), 0, 0); } catch (e) { /* kanvas sudah diganti */ }
    }
  }
  loop(); setInterval(kick, 250);   // 4x/dtk hanya memeriksa syarat (murah); gambar baru dijadwalkan bila Beranda terbuka, header terlihat, tab tampil
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  window.DL = Object.freeze(Object.assign({}, window.DL, { pxbg: Object.freeze({ tune: TUNE, info: () => ({ worker: !!(eng && eng.isWk), built: !!(eng && eng.built), cost: Math.round(cost * 10) / 10, ivl: ivl(), vis, running: !!tm, fail: wkFail }), watch: watchOn, unwatch: watchOff, watching, canWatch, step: () => step(true), star: () => eng && eng.star, starGot: () => Object.assign({}, STG), storyOk: n => PXB.storyOk(n), starPin: () => starPin, hitR: () => hitR, cand: (a, b, c, w, h) => PXB.stCand(a, b, c, w, h), scenes: () => PXB.SCENES.slice(), key: () => key, scene: () => lastScene, canvas: () => cv, engine: () => eng, create: o => PXB.create(o), sceneAt: h => PXB.sceneAt(h), seedAt: h => PXB.seedAt(h), light: PXB.light, chars: () => PXB.chars, off: () => off(), walk: () => eng && eng.wk, cast: () => getCast(castKey(lastScene, nowMs(), wx())) }) }));
})();
/* ===== /v110 sambungan ===== */
/* ===== v162-T3 (10 Nov 2026): KARTU CERITA bintang. Tabel window.DL_STORY = { adegan: { judul, jenis, inspirasi, latar: [8 sampai 10 kalimat], fakta: [..], baca, catatan } } diisi bertahap (T5). Kartu muncul LANGSUNG setelah bintang diketuk (+0,45 dtk supaya kilau pecah sempat terlihat) lewat peristiwa dl:starfound; dialog modal (aria-modal, fokus ke ✕ atas tanpa menggulir, bilah atas menempel dengan ✕, tombol Tutup di bawah, Esc, ketuk latar, jebakan Tab, fokus dikembalikan). Entri belum ada = kartu cadangan tanpa menyebut nama adegan. Membalik: patch_s162t3.py --reverse ===== */
/* data-cerita.js potongan 0 (Tahap 3b): dipindah ke berkas sendiri, dimuat sebelum app.js */
(() => {
  let box = null, prev = null, shown = null, mode = null;
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
  const known = sc => typeof sc === 'string' && window.DL.pxbg.scenes().includes(sc);
  const get = sc => { const S = window.DL_STORY; return S && typeof S === 'object' && Object.prototype.hasOwnProperty.call(S, sc) ? S[sc] : null; };
  function build(sc, o) {
    const d = get(sc), p = el('div', 'stc-panel'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'stcT'); p.tabIndex = -1;
    const hd = el('div', 'stc-hd'); hd.appendChild(el('div', 'stc-grip'));
    const k = el('div', 'stc-kick'); k.appendChild(el('span', 'stc-star', '✦')); k.appendChild(el('span', '', o.fresh ? 'Bintang ditemukan' : 'Dari koleksi'));
    const x0 = el('button', 'stc-x', '✕'); x0.type = 'button'; x0.id = 'stcX0'; x0.setAttribute('aria-label', 'Tutup'); x0.addEventListener('click', () => close()); k.appendChild(x0); hd.appendChild(k); p.appendChild(hd);
    const h = el('h3', '', d && d.judul ? d.judul : 'Bintang ditemukan'); h.id = 'stcT'; p.appendChild(h);
    const cs = el('div', 'stc-chips'); if (d && d.jenis) cs.appendChild(el('span', 'stc-chip', d.jenis)); cs.appendChild(el('span', 'stc-sv', o.fresh ? (o.saved === false ? 'Tersimpan sementara' : 'Tersimpan di koleksi') : 'Di koleksi')); p.appendChild(cs);
    if (d && d.inspirasi) { const i = el('p', 'stc-insp'); i.appendChild(el('b', '', 'Inspirasi. ')); i.appendChild(document.createTextNode(d.inspirasi)); p.appendChild(i); }
    if (d && Array.isArray(d.latar) && d.latar.length) { p.appendChild(el('h4', '', 'Latar belakang')); p.appendChild(el('p', 'stc-body', d.latar.join(' '))); }
    else p.appendChild(el('p', 'stc-body', 'Cerita adegan ini belum ditulis. Bintang dan adegannya sudah ada di koleksimu.'));
    if (o.full && d) {   // v162-T4b-1: bagian lengkap hanya di kartu dari koleksi
      if (Array.isArray(d.fakta) && d.fakta.length) { p.appendChild(el('h4', '', 'Fakta menarik')); const ul = el('ul', 'stc-fx'); d.fakta.forEach(t => { if (typeof t === 'string' && t.trim()) ul.appendChild(el('li', '', t)); }); p.appendChild(ul); }
      if (typeof d.baca === 'string' && d.baca.trim()) { p.appendChild(el('h4', '', 'Cara membaca adegan')); p.appendChild(el('p', 'stc-body', d.baca)); }
      if (typeof d.catatan === 'string' && d.catatan.trim()) p.appendChild(el('p', 'stc-note', d.catatan));
    }
    const a = el('div', 'stc-acts');
    if (o.back || o.fresh) { const k2 = el('button', 'btn', o.back ? '‹ Koleksi' : 'Lihat koleksi'); k2.type = 'button'; k2.id = 'stcK'; k2.addEventListener('click', () => openList()); a.appendChild(k2); }
    if (o.full && window.DL.pxbg.canWatch()) {   // v162-T4b-2a: Tonton adegan (hanya kartu dari koleksi, hanya bila Beranda dan latar menyala)
      const w = el('button', 'btn', 'Tonton adegan'); w.type = 'button'; w.id = 'stcW';
      w.addEventListener('click', () => { close(); if (window.DL.pxbg.watch(sc) && typeof toast === 'function') toast('Menonton adegan ini selama 1 menit.', { label: 'Kembali', fn: () => window.DL.pxbg.unwatch() }); });
      a.appendChild(w);
    }
    const b = el('button', 'btn primary', 'Tutup'); b.type = 'button'; b.id = 'stcX'; b.addEventListener('click', () => close()); a.appendChild(b); p.appendChild(a);
    return p;
  }
  function open(sc, o) {
    if (!known(sc)) return false; o = o || {}; const p0 = box ? prev : document.activeElement; close(true);
    prev = p0; mode = 'card'; box = el('div', 'stc'); box.id = 'stcard';
    const sc2 = el('div', 'stc-scrim'); sc2.addEventListener('click', () => close()); box.appendChild(sc2); box.appendChild(build(sc, o)); document.body.appendChild(box);
    document.body.classList.add('lock'); shown = sc;
    const x = box.querySelector('#stcX0'); if (x) x.focus({ preventScroll: true });
    return true;
  }
  const fdate = ms => { try { return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  const eligible = () => window.DL.pxbg.scenes().filter(sc => window.DL.pxbg.storyOk(sc));   // hanya adegan yang punya entri sah (yang lain belum punya bintang)
  function buildList() {
    const p = el('div', 'stc-panel'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'stcT'); p.tabIndex = -1;
    const hd = el('div', 'stc-hd'); hd.appendChild(el('div', 'stc-grip'));
    const k = el('div', 'stc-kick'); k.appendChild(el('span', 'stc-star', '✦')); k.appendChild(el('span', '', 'Koleksi'));
    const x0 = el('button', 'stc-x', '✕'); x0.type = 'button'; x0.id = 'stcX0'; x0.setAttribute('aria-label', 'Tutup'); x0.addEventListener('click', () => close()); k.appendChild(x0); hd.appendChild(k); p.appendChild(hd);
    const got = window.DL.pxbg.starGot(), all = eligible(), found = all.filter(sc => got[sc]).sort((a, b) => got[a] - got[b]), lock = all.filter(sc => !got[sc]), rest = window.DL.pxbg.scenes().length - all.length;
    const h = el('h3', '', 'Koleksi bintang'); h.id = 'stcT'; p.appendChild(h);
    const pr = el('div', 'stc-prog'); pr.appendChild(el('span', '', all.length ? 'Ditemukan ' + found.length + ' dari ' + all.length : 'Belum ada bintang yang bisa ditemukan.'));
    const bar = el('div', 'stc-bar'), fill = el('i'); fill.style.width = (all.length ? Math.round(100 * found.length / all.length) : 0) + '%'; bar.appendChild(fill); pr.appendChild(bar); p.appendChild(pr);
    const ul = el('ul', 'stl');
    found.forEach(sc => { const d = get(sc) || {}, li = el('li'), b = el('button', 'stl-row'); b.type = 'button'; b.setAttribute('data-sc', sc);
      b.appendChild(el('span', 'stl-star', '✦')); const tx = el('span', 'stl-tx'); tx.appendChild(el('span', 'stl-t', d.judul || 'Adegan')); tx.appendChild(el('span', 'stl-s', [fdate(got[sc]) && 'Ditemukan ' + fdate(got[sc]), d.jenis].filter(Boolean).join(' · '))); b.appendChild(tx); b.appendChild(el('span', 'stl-go', '›'));
      b.addEventListener('click', () => open(sc, { full: true, back: true, fresh: false })); li.appendChild(b); ul.appendChild(li); });
    lock.forEach(() => { const li = el('li'), r = el('div', 'stl-row lock'); r.setAttribute('aria-disabled', 'true'); r.appendChild(el('span', 'stl-star', '✦')); const tx = el('span', 'stl-tx'); tx.appendChild(el('span', 'stl-t', 'Belum ditemukan')); tx.appendChild(el('span', 'stl-s', 'Bintangnya masih bersembunyi di salah satu adegan.')); r.appendChild(tx); li.appendChild(r); ul.appendChild(li); });
    p.appendChild(ul);
    if (rest > 0) p.appendChild(el('p', 'stc-more', rest + ' adegan lain belum punya bintang. Bintangnya ditambahkan saat adegan itu dirombak atau dibuat.'));
    const a = el('div', 'stc-acts'), b = el('button', 'btn primary', 'Tutup'); b.type = 'button'; b.id = 'stcX'; b.addEventListener('click', () => close()); a.appendChild(b); p.appendChild(a);
    return p;
  }
  function openList() {
    const p0 = box ? prev : document.activeElement; close(true);
    prev = p0; mode = 'list'; box = el('div', 'stc'); box.id = 'stcard';
    const sc2 = el('div', 'stc-scrim'); sc2.addEventListener('click', () => close()); box.appendChild(sc2); box.appendChild(buildList()); document.body.appendChild(box);
    document.body.classList.add('lock'); shown = null;
    const x = box.querySelector('#stcX0'); if (x) x.focus({ preventScroll: true });
    return true;
  }
  function close(quiet) {
    if (!box) return false; box.remove(); box = null; shown = null; mode = null;
    const sh = document.getElementById('sheet'); if (!quiet && (!sh || sh.hidden)) document.body.classList.remove('lock');
    if (!quiet && prev && prev.isConnected && prev.focus) { try { prev.focus(); } catch (e) { /* abaikan */ } } prev = null;
    return true;
  }
  document.addEventListener('keydown', e => {
    if (!box) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { const f = Array.from(box.querySelectorAll('button')); if (!f.length) return; const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i < 0 || i === f.length - 1 ? 0 : i + 1); e.preventDefault(); f[n].focus(); }
  }, true);
  /* v162-T4b-2b: titik masuk koleksi di header Beranda. Tombol bintang kecil di #hxSky (tampak hanya di mode animasi, seperti tombol suara); tersembunyi bila belum ada adegan yang punya bintang; ketuk = daftar koleksi. */
  let sbtn = null, bbtn = null;
  const ICON_STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.6 6.7 19.4l1.1-5.9L3.5 9.4l5.9-.8z"/></svg>';
  function paintStarBtn() {
    if (!sbtn) return;
    const all = eligible(), got = window.DL.pxbg.starGot(), n = all.filter(sc => got[sc]).length, t = 'Koleksi bintang: ditemukan ' + n + ' dari ' + all.length, hid = all.length === 0;
    if (sbtn.getAttribute('aria-label') !== t) { sbtn.setAttribute('aria-label', t); sbtn.title = t; }
    if (sbtn.hidden !== hid) sbtn.hidden = hid;
  }
  const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
  function paintBackBtn() {   // v162-T4b-2c: tampak hanya selama menonton adegan
    if (!bbtn) return;
    const hid = !window.DL.pxbg.watching();
    if (bbtn.hidden !== hid) bbtn.hidden = hid;
  }
  function ensureStarBtn() {
    try {
      const sky = document.getElementById('hxSky'); if (!sky || typeof curView === 'undefined' || curView !== 'home') return;
      if (!(sbtn && sbtn.isConnected && sbtn.parentNode === sky)) {
        sbtn = el('button', 'stbtn'); sbtn.type = 'button'; sbtn.innerHTML = ICON_STAR;
        sbtn.addEventListener('click', e => { e.stopPropagation(); openList(); });
        sky.appendChild(sbtn);
      }
      paintStarBtn();
      if (!(bbtn && bbtn.isConnected && bbtn.parentNode === sky)) {
        bbtn = el('button', 'stback'); bbtn.type = 'button'; bbtn.innerHTML = ICON_BACK; bbtn.hidden = true;
        const lb = 'Kembali ke adegan jam ini'; bbtn.setAttribute('aria-label', lb); bbtn.title = lb;
        bbtn.addEventListener('click', e => { e.stopPropagation(); window.DL.pxbg.unwatch(); paintBackBtn(); if (sbtn && sbtn.isConnected && !sbtn.hidden) { try { sbtn.focus({ preventScroll: true }); } catch (e2) { /* abaikan */ } } });
        sky.appendChild(bbtn);
      }
      paintBackBtn();
    } catch (e) { /* abaikan: tombol hanya tambahan */ }
  }
  setInterval(ensureStarBtn, 500);
  document.addEventListener('dl:skyfocus', ensureStarBtn);
  document.addEventListener('dl:starfound', e => { const d = e.detail || {}; setTimeout(() => open(d.scene, { fresh: d.fresh !== false, saved: d.saved }), 450); });
  window.DL = Object.freeze(Object.assign({}, window.DL, { story: Object.freeze({ open, openList, mode: () => mode, close: () => close(), isOpen: () => !!box, shown: () => shown, get, got: () => window.DL.pxbg.starGot(), count: () => Object.keys(window.DL.pxbg.starGot()).length }) }));
})();
/* ===== /v162-T3 ===== */
/* ===== v148a: suara adegan header (butir 18, Tahap 148a). Web Audio murni: tanpa berkas audio, tanpa unduhan. Bawaan MATI; tombol speaker kecil di header; pilihan tersimpan di localStorage['dailylog:snd:on']; diam bila tab tersembunyi, Beranda tidak terbuka, atau latar pixel dimatikan. Tabel SND = resep suara per adegan (lapisan derau + kejadian acak, menurut jam dan cuaca). Membalik: patch148a.py --reverse ===== */
(() => {
  const SK = 'dailylog:snd:on', SKM = 'dailylog:snd:mus', SKVS = 'dailylog:snd:vs', SKVM = 'dailylog:snd:vm', VOL = .34, imul = Math.imul;
  /* v160: campuran bawaan suara adegan 70 : musik 30 (perbandingan amplitudo). Penggeser 0-100. Suara adegan 70 = kekerasan lama (pengali 1,0); musik 30 = 70 : 30 tepat, karena lagu dikalibrasi 9 dB di bawah suara adegan (0,3548): pengali musik = vm/100 x 4,026, suara = vs/100 x 100/70. */
  const MXLIVE = .60;   /* v161: KALIBRASI LIVE (t160b, lorong, 4 putaran: bagian musik terukur 43,8/39,4/38,5/36,9 persen; sasaran 30): musik x 0,60 (0,65 memberi 31,6 dan 34,8 persen; 0,57 memberi 26,2 26,6 31,3; diambil 0,60) supaya musik : suara adegan di keluaran nyata = 30 : 70 */
  const MX0 = { s: 70, m: 30 }, MXCS = 100 / 70, MXCM = MXCS / Math.pow(10, -9 / 20) * MXLIVE, lsInt = (k, d) => { const v = parseInt(lsGet(k), 10); return v >= 0 && v <= 100 ? v : d; };
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* penyimpanan penuh: abaikan */ } };
  const mk = seed => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = imul(t ^ (t >>> 15), t | 1); t ^= t + imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const expo = (r, rate) => -Math.log(1 - r()) / Math.max(1e-6, rate);

  /* ---- derau (putih, merah muda, cokelat) tanpa sambungan terdengar ---- */
  const NB = new WeakMap();
  function noiseBuf(ctx, kind) {
    let m = NB.get(ctx); if (!m) { m = {}; NB.set(ctx, m); }
    if (m[kind]) return m[kind];
    const sr = ctx.sampleRate, n = Math.floor(sr * 4), k = Math.floor(sr * .15), tot = n + k, base = new Float32Array(tot), r = mk(kind === 'white' ? 11 : kind === 'pink' ? 23 : 37);
    if (kind === 'white') for (let i = 0; i < tot; i++) base[i] = r() * 2 - 1;
    else if (kind === 'pink') { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < tot; i++) { const w = r() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; base[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } }
    else { let l = 0; for (let i = 0; i < tot; i++) { const w = r() * 2 - 1; l = (l + .02 * w) / 1.02; base[i] = l * 3.5; } }
    const b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = base[i];
    for (let i = 0; i < k; i++) { const t = i / k, a = Math.cos(t * Math.PI / 2), c = Math.sin(t * Math.PI / 2); d[i] = base[n + i] * a + base[i] * c; }   // ekor menyambung ke kepala (daya sama)
    m[kind] = b; return b;
  }

  /* ---- bunyi pendek: nada dan letupan derau ---- */
  function tone(ctx, d, t, f1, f2, dur, g, o) {
    o = o || {};
    const os = ctx.createOscillator(), gn = ctx.createGain(); os.type = o.type || 'sine';
    os.frequency.setValueAtTime(f1, t); if (f2 !== f1) os.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    const a = Math.min(o.a || .008, dur * .4);
    gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(g, t + a); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let last = os;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); last = f; }
    if (o.vib) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = o.vib[0]; vg.gain.value = o.vib[1]; v.connect(vg); vg.connect(os.frequency); v.start(t); v.stop(t + dur + .05); }
    last.connect(gn); gn.connect(d); os.start(t); os.stop(t + dur + .05);
  }
  function burst(ctx, d, t, o) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), a = o.a || .002;
    s.buffer = noiseBuf(ctx, o.n || 'white'); s.loop = !!o.loop; f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.hz, t); if (o.hz2) f.frequency.exponentialRampToValueAtTime(o.hz2, t + o.dur); f.Q.value = o.q || 1;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(o.g, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + o.dur);
    s.connect(f); f.connect(g); g.connect(d); s.start(t, o.off || 0); s.stop(t + o.dur + .05);
  }

  /* ---- kejadian acak ---- */
  const EV = {
    bird(c, d, t, E, r) { const n = 2 + Math.floor(r() * 4), f0 = (E.f || 3400) * (.8 + r() * .5); let tt = t; for (let i = 0; i < n; i++) { tone(c, d, tt, f0 * (1 + (r() - .5) * .25), f0 * (r() < .5 ? 1.2 + r() * .4 : .7 + r() * .15), .05 + r() * .05, E.g); tt += .08 + r() * .07; } },
    cricket(c, d, t, E, r) { const f = (E.f || 4400) * (.97 + r() * .06), n = 3 + Math.floor(r() * 3); for (let i = 0; i < n; i++) tone(c, d, t + i * .024, f, f * 1.015, .014, E.g, { a: .003 }); },
    frog(c, d, t, E, r) { const n = 2 + Math.floor(r() * 3), f = 150 + r() * 90; for (let i = 0; i < n; i++) tone(c, d, t + i * .11, f * 1.2, f, .07, E.g * 1.6, { type: 'sawtooth', lp: 520, a: .012 }); },
    owl(c, d, t, E, r) { const f = 360 + r() * 60; tone(c, d, t, f * 1.08, f, .42, E.g * 2, { a: .08, vib: [5, 6] }); tone(c, d, t + .6, f, f * .82, .7, E.g * 2, { a: .09, vib: [5, 6] }); },
    drip(c, d, t, E, r) { const f = 1700 * (E.f || 1) * (.55 + r() * .7); tone(c, d, t, f, f * .45, .045 + r() * .03, E.g * (.6 + r() * .8), { a: .002 }); },
    bubble(c, d, t, E, r) { const f = (E.f || 1) * (260 + r() * 520); tone(c, d, t, f, f * (1.7 + r() * .6), .05 + r() * .06, E.g, { a: .004 }); },
    crackle(c, d, t, E, r) { burst(c, d, t, { n: 'white', ft: 'bandpass', hz: 1500 + r() * 3200, q: 1.2, dur: .006 + r() * .02, g: E.g * (.5 + r()), off: r() * 3 }); },
    thunder(c, d, t, E, r) { burst(c, d, t, { n: 'brown', ft: 'lowpass', hz: 420, hz2: 70, q: .8, a: .18 + r() * .2, dur: 3 + r() * 3, g: E.g, off: r() * 3 }); },
    surge(c, d, t, E, r) { const g = E.g * (.7 + r() * .6), L = 6 + r() * 3;   // v158: satu gelombang: naik 2 dtk, pecah, surut; tiga lapis (badan, buih, desis tipis)
      burst(c, d, t, { n: 'brown', ft: 'lowpass', hz: 320, hz2: 140, q: .6, a: 1.9 + r() * .8, dur: L, g, off: r() * 3, loop: true });
      burst(c, d, t + .5, { n: 'pink', ft: 'bandpass', hz: 1500, hz2: 650, q: .5, a: 2 + r() * .6, dur: L - .8, g: g * .5, off: r() * 3, loop: true });
      burst(c, d, t + 2.2, { n: 'pink', ft: 'bandpass', hz: 3000, hz2: 1800, q: .5, a: 1.2, dur: L - 2.5, g: g * .1, off: r() * 3, loop: true }); },
    patter(c, d, t, E, r) { const n = 3 + Math.floor(r() * 3); for (let i = 0; i < n; i++) burst(c, d, t + r() * .07, { n: 'white', ft: 'bandpass', hz: 2200 + r() * 4800, q: 2.2, dur: .012 + r() * .018, g: E.g * (.35 + r() * .9), off: r() * 3 }); },   // v158: butir hujan
    gull(c, d, t, E, r) { const f = 1500 + r() * 300; tone(c, d, t, f, f * 1.5, .22, E.g, { a: .03, vib: [18, 40] }); tone(c, d, t + .26, f * 1.5, f * .9, .34, E.g, { a: .02, vib: [14, 50] }); if (r() < .5) tone(c, d, t + .7, f * 1.3, f * .85, .28, E.g * .8, { a: .02, vib: [16, 45] }); },
    crow(c, d, t, E, r) { const n = 2 + Math.floor(r() * 2); for (let i = 0; i < n; i++) tone(c, d, t + i * .3, 500 - i * 20, 340, .18, E.g * 1.5, { type: 'sawtooth', lp: 1300, a: .015 }); },
    eagle(c, d, t, E, r) { tone(c, d, t, 2700, 1900, .95, E.g * .7, { a: .06, vib: [7, 60] }); },
    bell(c, d, t, E, r) { const f = (E.f || 520), P = [[1, 2.6, 1], [2, 1.7, .5], [2.76, 1.1, .35], [4.07, .7, .2]]; for (const p of P) tone(c, d, t, f * p[0], f * p[0], p[1], E.g * p[2], { a: .004 }); },
    horn(c, d, t, E, r) { tone(c, d, t, 97, 96, 2.6, E.g, { type: 'sawtooth', lp: 380, a: .5 }); tone(c, d, t, 146, 145, 2.6, E.g * .5, { type: 'sawtooth', lp: 380, a: .55 }); },
    horn1(c, d, t, E, r) { tone(c, d, t, 410, 405, .3, E.g, { type: 'square', lp: 1500, a: .02 }); tone(c, d, t, 510, 505, .3, E.g * .8, { type: 'square', lp: 1500, a: .02 }); },
    clack(c, d, t, E, r) { for (const dt of [0, .105]) { burst(c, d, t + dt, { n: 'brown', ft: 'lowpass', hz: 170, q: .7, dur: .06, g: E.g, off: r() * 3 }); burst(c, d, t + dt, { n: 'white', ft: 'bandpass', hz: 1900, q: 1.5, dur: .012, g: E.g * .3, off: r() * 3 }); } },
    tick(c, d, t, E, r) { E._n = (E._n || 0) + 1; const f = E._n % 2 ? 1900 : 1500; tone(c, d, t, f, f * .75, .014, E.g, { a: .001 }); tone(c, d, t, 520, 400, .03, E.g * .5, { a: .001 }); },
    plop(c, d, t, E, r) { const f = 170 + r() * 170; tone(c, d, t, f * 2, f * .8, .1, E.g * 2, { a: .003 }); burst(c, d, t, { n: 'brown', ft: 'lowpass', hz: 700, q: .7, dur: .2, g: E.g * .7, off: r() * 3 }); },
    lark(c, d, t, E, r) { const f = 3300 + r() * 500, n = 16 + (r() * 10 | 0); for (let i = 0; i < n; i++) tone(c, d, t + i * .05, f * (1 + .22 * Math.sin(i * .8) + (r() - .5) * .08), f * (1.05 + (r() - .5) * .1), .045, E.g, { a: .004 }); },
    rooster(c, d, t, E, r) { const o = { type: 'sawtooth', lp: 2200, a: .02, vib: [26, 18] }; tone(c, d, t, 430, 640, .2, E.g, o); tone(c, d, t + .26, 520, 980, .26, E.g, o); tone(c, d, t + .58, 900, 1050, .34, E.g * 1.1, o); tone(c, d, t + .98, 980, 330, .6, E.g, o); },
    anvil(c, d, t, E, r) { const f = 1050 + r() * 350, n = 2 + (r() * 3 | 0); for (let i = 0; i < n; i++) { const tt = t + i * (.17 + r() * .05); burst(c, d, tt, { n: 'white', ft: 'bandpass', hz: 3800, q: 1, dur: .018, g: E.g * .7, off: r() * 3 }); for (const p of [1, 2.76, 5.4]) tone(c, d, tt, f * p, f * p, .5 / Math.pow(p, .4), E.g / Math.pow(p, .5), { a: .001 }); } },
    loon(c, d, t, E, r) { tone(c, d, t, 480, 820, .5, E.g, { a: .12, vib: [6, 20] }); tone(c, d, t + .55, 820, 520, .9, E.g, { a: .05, vib: [8, 35] }); if (r() < .5) tone(c, d, t + 1.6, 500, 900, .6, E.g * .9, { a: .1, vib: [7, 25] }); },
    pebble(c, d, t, E, r) { const n = 4 + (r() * 5 | 0); let tt = t; for (let i = 0; i < n; i++) { burst(c, d, tt, { n: 'white', ft: 'bandpass', hz: 1700 + r() * 2600, q: 3, dur: .02, g: E.g * (.6 + r() * .6), off: r() * 3 }); tt += .04 + r() * .06 + i * .012; } },
    peep(c, d, t, E, r) { const f = 4000 + r() * 500, n = 2 + (r() * 3 | 0); for (let i = 0; i < n; i++) { tone(c, d, t + i * .16, f, f * .88, .07, E.g, { a: .004 }); tone(c, d, t + i * .16 + .08, f * .9, f * 1.05, .06, E.g * .8, { a: .004 }); } },
    whistle(c, d, t, E, r) { const o = { a: .18, lp: 2400, vib: [5, 3] }; tone(c, d, t, 415, 412, 1.5, E.g, o); tone(c, d, t, 523, 520, 1.5, E.g * .9, o); tone(c, d, t, 622, 618, 1.5, E.g * .5, o); },
    coo(c, d, t, E, r) { const f = 230 + r() * 30, o = { a: .05, lp: 900 }; tone(c, d, t, f * 1.05, f * .9, .2, E.g * 1.4, o); tone(c, d, t + .26, f * 1.1, f * .85, .16, E.g * 1.2, o); tone(c, d, t + .5, f * 1.1, f * .8, .28, E.g * 1.2, o); },
    wok(c, d, t, E, r) { burst(c, d, t, { n: 'white', ft: 'highpass', hz: 4800, q: .5, a: .12, dur: 1 + r() * .6, g: E.g * 1.2, off: r() * 3 }); burst(c, d, t + .4, { n: 'white', ft: 'bandpass', hz: 1400, q: 7, dur: .14, g: E.g * 1.5, off: r() * 3 }); tone(c, d, t + .4, 880, 780, .12, E.g * .8, { a: .001 }); },
    shipbell(c, d, t, E, r) { EV.bell(c, d, t, { f: 830, g: E.g }, r); EV.bell(c, d, t + .5, { f: 830, g: E.g * .9 }, r); },
    taiko(c, d, t, E, r) { const n = 2 + (r() * 3 | 0); for (let i = 0; i < n; i++) { const tt = t + i * .42; tone(c, d, tt, 110, 46, .5, E.g * 2, { a: .003 }); burst(c, d, tt, { n: 'brown', ft: 'lowpass', hz: 260, q: .7, dur: .3, g: E.g * 1.2, off: r() * 3 }); } },
    glass(c, d, t, E, r) { const f = 1480 * (1 + r() * .5); for (const p of [1, 1.5, 2.01, 3.02]) tone(c, d, t, f * p, f * p, 2.4 / p, E.g / p, { a: .06 }); },
    boom(c, d, t, E, r) { burst(c, d, t, { n: 'white', ft: 'highpass', hz: 900, q: .6, dur: .05, g: E.g * .4, off: r() * 3 }); burst(c, d, t, { n: 'brown', ft: 'lowpass', hz: 300, hz2: 50, q: .7, a: .01, dur: 2.2, g: E.g * 2, off: r() * 3 }); tone(c, d, t, 80, 32, 1.2, E.g * 2, { a: .01 }); },
    plink(c, d, t, E, r) { const f = 1250 + r() * 500; [[0, 1], [.29, .5], [.58, .25]].forEach(a => tone(c, d, t + a[0], f, f * .82, .07, E.g * a[1] * 2, { a: .002 })); },
    chirp(c, d, t, E, r) { const n = 2 + (r() * 3 | 0); for (let i = 0; i < n; i++) tone(c, d, t + i * .07, 6800, 3600, .03, E.g, { a: .002 }); },
    bark(c, d, t, E, r) { const n = 2 + (r() * 3 | 0), f = 300 + r() * 120; for (let i = 0; i < n; i++) { const tt = t + i * (.28 + r() * .08); tone(c, d, tt, f * 1.3, f * .7, .13, E.g * 1.6, { type: 'sawtooth', lp: 900, a: .01 }); burst(c, d, tt, { n: 'white', ft: 'bandpass', hz: 700, q: 1.2, dur: .1, g: E.g * .5, off: r() * 3 }); } },
    jump(c, d, t, E, r) { burst(c, d, t, { n: 'white', ft: 'bandpass', hz: 1100, hz2: 350, q: .8, a: .01, dur: .35, g: E.g * 1.2, off: r() * 3 }); tone(c, d, t + .05, 420, 180, .18, E.g, { a: .01 }); },
    shingle(c, d, t, E, r) { const n = 14 + (r() * 10 | 0); let tt = t; for (let i = 0; i < n; i++) { burst(c, d, tt, { n: 'white', ft: 'bandpass', hz: 2200 + r() * 2500, q: 2, dur: .012, g: E.g * (1 - i / (n * 1.1)), off: r() * 3 }); tt += .012 + r() * .03 + i * .003; } },
    howl(c, d, t, E, r) { const f = 360 + r() * 60; tone(c, d, t, f, f * 1.7, .9, E.g, { a: .35, lp: 1400, vib: [5, 10] }); tone(c, d, t + .9, f * 1.7, f * 1.35, .7, E.g, { a: .05, lp: 1400, vib: [5, 12] }); tone(c, d, t + 1.55, f * 1.35, f * .8, 1.1, E.g * .8, { a: .05, lp: 1400, vib: [4, 12] }); },
    page(c, d, t, E, r) { burst(c, d, t, { n: 'white', ft: 'bandpass', hz: 2400 + r() * 1200, q: .6, a: .05, dur: .28, g: E.g, off: r() * 3 }); },
    creak(c, d, t, E, r) { const f = 95 + r() * 40, du = .7 + r() * .6; tone(c, d, t, f, f * 1.45, du, E.g, { type: 'sawtooth', lp: 520, a: .15, vib: [9, 8] }); },
  };

  /* ---- grafik simpul: lapisan dasar (derau/osilator) + jalur kejadian ---- */
  function mkBed(ctx, d, L, i, stops) {
    let src;
    if (L.o) { src = ctx.createOscillator(); src.type = L.o; src.frequency.value = L.f; }
    else { src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, L.n); src.loop = true; }
    const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = L.ft || 'lowpass'; f.frequency.value = L.hz; f.Q.value = L.q || .7; g.gain.value = L.g;
    src.connect(f); f.connect(g); g.connect(d); stops.push(src);
    if (L.lfo) { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = L.lfo[0]; og.gain.value = L.g * L.lfo[1]; o.connect(og); og.connect(g.gain); o.start(); stops.push(o); }
    if (L.fm) { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = L.fm[0]; og.gain.value = L.fm[1]; o.connect(og); og.connect(f.frequency); o.start(); stops.push(o); }
    if (L.o) src.start(); else src.start(0, (i * 1.37) % 3);
  }
  function build(ctx, dest, rec) {
    const gr = ctx.createGain(), lp = ctx.createBiquadFilter(), stops = [];
    gr.gain.value = rec.vol; lp.type = 'lowpass'; lp.frequency.value = rec.lp; lp.Q.value = .5; gr.connect(lp); lp.connect(dest);
    rec.beds.forEach((L, i) => mkBed(ctx, gr, L, i, stops));
    const buses = rec.ev.map(E => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = E.lp || 20000; f.connect(gr); return f; });
    return { gr, lp, stops, buses, rec };
  }
  function sched(ctx, grp, t0, t1, st, r, dk) {
    grp.rec.ev.forEach((E, i) => {
      if (st.nx[i] == null) st.nx[i] = t0 + (E.reg ? 0 : expo(r, E.r));
      let guard = 0;
      while (st.nx[i] < t1 && guard++ < 40) { const t = Math.max(st.nx[i], t0); try { EV[E.k](ctx, grp.buses[i], t, E, r); evN++; if (dk && E.k !== 'drip' && E.k !== 'patter' && E.k !== 'surge') { dk.gain.setTargetAtTime(.42, t, .04); dk.gain.setTargetAtTime(1, t + .8, .45); } } catch (e) { /* satu bunyi gagal: lewati */ } st.nx[i] += E.reg ? 1 / E.r : expo(r, E.r); }
    });
  }
  function kill(grp) { if (grp.mus) kill(grp.mus); grp.stops.forEach(s => { try { s.stop(); } catch (e) { /* sudah berhenti */ } }); try { grp.gr.disconnect(); grp.lp.disconnect(); grp.buses.forEach(b => b.disconnect()); } catch (e) { /* abaikan */ } }

  /* ---- TABEL SND: resep per adegan ---- */
  const phaseOf = m => m >= 300 && m < 450 ? 'dawn' : m >= 450 && m < 1020 ? 'day' : m >= 1020 && m < 1140 ? 'dusk' : 'night';
  const wxk = w => ['cloud', 'fog', 'rain', 'storm', 'snow'].includes(w) ? w : 'clear';
  function ctxRec(scene, m, wx) {
    const ph = phaseOf(m), w = wxk(wx), rain = w === 'rain' || w === 'storm', snow = w === 'snow';
    const bf = ({ dawn: 1.7, day: 1, dusk: .55, night: 0 })[ph] * (rain || snow ? 0 : w === 'fog' ? .5 : 1);
    const inf = ({ dawn: .35, day: 0, dusk: .8, night: 1 })[ph] * (rain || snow ? 0 : w === 'fog' ? .6 : 1);
    const c = { scene, ph, w, rain, bf, inf, beds: [], ev: [], lp: 20000, vol: ph === 'night' ? .85 : 1 };
    c.b = L => { c.beds.push(L); return c; }; c.e = E => { c.ev.push(E); return c; };
    c.birds = (rate, f, lp) => { if (c.bf > 0) c.e({ k: 'bird', r: rate * c.bf, g: .05, f, lp }); };
    c.bugs = (rate, f) => { if (c.inf > 0) c.e({ k: 'cricket', r: rate * c.inf, g: .032, f }); };
    c.frogs = rate => { const k = (ph === 'night' ? 1 : ph === 'dusk' ? .6 : 0) * (w === 'rain' ? 1.6 : w === 'storm' ? 1.1 : snow ? 0 : 1); if (k > 0) c.e({ k: 'frog', r: rate * k, g: .03 }); };
    c.owl = rate => { const k = (ph === 'night' ? 1 : ph === 'dawn' ? .5 : 0) * (rain || snow ? 0 : 1); if (k > 0) c.e({ k: 'owl', r: rate * k, g: .035, lp: 1200 }); };
    c.gulls = rate => { if (c.bf > 0) c.e({ k: 'gull', r: rate * Math.min(1.2, c.bf), g: .04 }); };
    c.wind = (g, hz) => c.b({ n: 'pink', ft: 'bandpass', hz: hz || 600, q: .55, g: g * (w === 'storm' ? 2.4 : w === 'cloud' ? 1.35 : w === 'fog' ? .55 : snow ? .8 : 1), lfo: [.06 + g * .2, .65], fm: [.05, (hz || 600) * .3] });
    c.weather = mode => {   // tanpa mode = di luar; 'in' = dalam ruangan; 'under' = di bawah air
      const k = mode === 'in' ? .45 : mode === 'under' ? .22 : 1;
      if (rain) { c.b({ n: 'pink', ft: 'bandpass', hz: mode ? 900 : 1300, q: .4, g: (w === 'storm' ? .26 : .15) * k, lfo: [.23, .2] }).b({ n: 'brown', ft: 'lowpass', hz: 420, g: (w === 'storm' ? .1 : .06) * k, lfo: [.11, .3] }); c.e({ k: 'patter', r: (w === 'storm' ? 10 : 7) * (mode ? .6 : 1), g: .03 * k + .005, lp: mode ? 2600 : 9000 }); c.e({ k: 'drip', r: (w === 'storm' ? 1.8 : 1.2) * (mode ? .4 : 1), g: .035, f: 1, lp: mode ? 1800 : 9000 }); }
      if (w === 'storm') c.e({ k: 'thunder', r: .04, g: mode ? .3 : .6, lp: mode ? 700 : 9000 });
      if (snow) { c.lp = Math.min(c.lp, 2200); c.vol *= .8; }
      if (w === 'fog') c.lp = Math.min(c.lp, 3000);
    };
    return c;
  }
  const SND = {
    airterjun(c) { c.b({ n: 'pink', ft: 'bandpass', hz: 850, q: .3, g: .42, lfo: [.13, .15] }).b({ n: 'white', ft: 'highpass', hz: 3000, q: .5, g: .06, lfo: [.27, .25] }).b({ n: 'brown', ft: 'lowpass', hz: 180, g: .35 }); c.wind(.04); c.birds(.22, 3800); c.bugs(.7, 4400); c.frogs(.35); },
    padang(c) { c.wind(.2, 520); c.b({ n: 'white', ft: 'highpass', hz: 4200, q: .5, g: .018, lfo: [.35, .6] }); c.birds(.28, 3300); c.bugs(1.1, 4600); c.owl(.025); },
    dusun(c) { c.wind(.07, 500); c.birds(.2, 3000); if (c.bf > 0) c.e({ k: 'bell', r: .012, g: .05, f: 440, lp: 5000 }); c.bugs(.8, 4300); c.owl(.02); },
    kastil(c) { c.b({ n: 'pink', ft: 'bandpass', hz: 380, q: 2.2, g: .12, lfo: [.05, .8], fm: [.08, 120] }); c.wind(.09, 700); if (!c.rain) c.e({ k: 'crow', r: c.ph === 'night' ? .006 : .03, g: .03, lp: 5000 }); c.e({ k: 'bell', r: .008, g: .06, f: 262, lp: 3500 }); if (c.ph === 'night' || c.ph === 'dusk') { c.e({ k: 'crackle', r: 5, g: .04, lp: 5000 }); c.b({ n: 'brown', ft: 'lowpass', hz: 250, g: .03 }); } c.owl(.03); },
    danau(c) { c.b({ n: 'pink', ft: 'lowpass', hz: 650, g: .1, lfo: [.22, .5] }).b({ n: 'pink', ft: 'bandpass', hz: 1500, q: .8, g: .02, lfo: [.4, .6] }); c.wind(.05); c.birds(.2, 3200); c.frogs(.9); c.bugs(.7, 4500); if (c.bf > 0) c.e({ k: 'drip', r: .12, g: .03, f: .8, lp: 5000 }); },
    reruntuhan(c) { c.b({ n: 'pink', ft: 'bandpass', hz: 320, q: 3.5, g: .13, lfo: [.06, .7], fm: [.05, 90] }); c.wind(.1, 400); if (!c.rain) c.e({ k: 'crow', r: c.ph === 'night' ? .005 : .05, g: .03, lp: 5000 }); c.e({ k: 'drip', r: .3, g: .05, f: .55, lp: 3000 }); c.owl(.04); c.bugs(.3, 4000); },
    pantai(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 420, g: .3, lfo: [.07, .5] }).b({ n: 'pink', ft: 'lowpass', hz: 1000, g: .06, lfo: [.09, .6] }); c.e({ k: 'surge', r: .14, g: .78 }); c.wind(.04, 900); c.gulls(.12); },
    pegunungan(c) { c.wind(.38, 480); c.b({ n: 'pink', ft: 'bandpass', hz: 1050, q: .9, g: .17, lfo: [.09, .6] }).b({ n: 'white', ft: 'highpass', hz: 5000, q: .5, g: .015, lfo: [.05, .9] }); if (c.bf > 0) c.e({ k: 'eagle', r: .02 * c.bf, g: .04, lp: 6000 }); },
    kereta(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 240, g: .55, lfo: [.4, .12] }).b({ n: 'pink', ft: 'bandpass', hz: 800, q: .5, g: .06 }).b({ n: 'pink', ft: 'bandpass', hz: 2400, q: .7, g: .018 }); c.e({ k: 'clack', r: 1.55, g: .22, reg: true }); },
    akuarium(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 260, g: .4, lfo: [.09, .35] }).b({ n: 'pink', ft: 'lowpass', hz: 900, g: .05, lfo: [.2, .5] }).b({ o: 'sine', f: 58, ft: 'lowpass', hz: 200, g: .05, lfo: [.3, .2] }).b({ o: 'sine', f: 117, ft: 'lowpass', hz: 300, g: .012 }); c.e({ k: 'bubble', r: 1.9, g: .06 }).e({ k: 'bubble', r: .25, g: .09, f: .55 }); },
    atap(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 380, g: .3, lfo: [.05, .35] }).b({ n: 'pink', ft: 'bandpass', hz: 1400, q: .5, g: .03, lfo: [.12, .5] }); c.wind(.08, 650); c.e({ k: 'horn1', r: c.ph === 'night' ? .02 : .04, g: .04, lp: 2500 }); c.birds(.12, 3000); },
    lorong(c) { c.b({ o: 'sawtooth', f: 120, ft: 'lowpass', hz: 420, g: .02, lfo: [.8, .15] }).b({ o: 'sine', f: 240, ft: 'lowpass', hz: 500, g: .008 }).b({ n: 'brown', ft: 'lowpass', hz: 280, g: .14, lfo: [.06, .3] }); c.e({ k: 'drip', r: .45, g: .07, f: .85, lp: 4000 }).e({ k: 'crackle', r: .15, g: .05, lp: 3000 }); },
    perpus(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 160, g: .1 }).b({ n: 'pink', ft: 'lowpass', hz: 520, g: .02, lfo: [.1, .4] }); c.e({ k: 'tick', r: 1, g: .07, reg: true }).e({ k: 'page', r: .05, g: .05 }); if (c.ph === 'night') c.e({ k: 'creak', r: .02, g: .05 }); },
    embun(c) { c.b({ n: 'pink', ft: 'lowpass', hz: 500, g: .035, lfo: [.08, .4] }); c.e({ k: 'drip', r: .38, g: .06, f: 1.2, lp: 6000 }); c.birds(.16, 3900, 4500); c.bugs(.9, 4700); },
    mercu(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 420, g: .62, lfo: [.1, .85] }).b({ n: 'brown', ft: 'lowpass', hz: 130, g: .3, lfo: [.07, .6] }).b({ n: 'pink', ft: 'bandpass', hz: 1400, q: .5, g: .05, lfo: [.1, .9] }); c.wind(.34, 680); c.gulls(.09); c.e({ k: 'horn', r: (c.ph === 'night' || c.w === 'fog') ? .035 : .012, g: .12 }); },
    kapal(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 520, g: .3, lfo: [.14, .6] }).b({ n: 'pink', ft: 'bandpass', hz: 1700, q: .5, g: .05, lfo: [.14, .7] }).b({ n: 'pink', ft: 'bandpass', hz: 380, q: 1.2, g: .07, lfo: [.1, .5] }).b({ n: 'pink', ft: 'bandpass', hz: 2000, q: 4, g: .012, lfo: [.2, .8] }); c.e({ k: 'creak', r: .14, g: .07 }); c.gulls(.08); c.e({ k: 'bell', r: .008, g: .05, f: 560, lp: 4000 }); },
    gerbang(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 170, g: .5, lfo: [.05, .3] }).b({ o: 'sine', f: 55, ft: 'lowpass', hz: 120, g: .09, lfo: [.11, .5] }).b({ o: 'sine', f: 82.4, ft: 'lowpass', hz: 160, g: .03 }).b({ n: 'pink', ft: 'lowpass', hz: 420, g: .03 }); c.e({ k: 'bubble', r: 1, g: .05, lp: 1800 }).e({ k: 'bell', r: .01, g: .07, f: 330, lp: 900 }); },
    cermin(c) { c.b({ n: 'pink', ft: 'bandpass', hz: 520, q: .9, g: .1, lfo: [.09, .45] }).b({ n: 'brown', ft: 'lowpass', hz: 200, g: .12 }).b({ o: 'sine', f: 110, ft: 'lowpass', hz: 300, g: .012, lfo: [.07, .4] }); c.wind(.07, 480); c.birds(.12, 3000); c.bugs(.9, 4300); c.frogs(.5); c.owl(.03); c.e({ k: 'bubble', r: .5, g: .04, lp: 1500 }).e({ k: 'bell', r: .006, g: .05, f: 420, lp: 1800 }); },
    siluet(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 300, g: .16, lfo: [.1, .7] }).b({ n: 'pink', ft: 'bandpass', hz: 760, q: .7, g: .13, lfo: [.13, .8] }).b({ n: 'pink', ft: 'bandpass', hz: 2400, q: .8, g: .07, lfo: [.17, .9] }).b({ n: 'brown', ft: 'lowpass', hz: 140, g: .05, lfo: [.06, .5] }); c.wind(.12, 520); c.gulls(.08); c.birds(.1, 3400); c.bugs(.7, 4400); c.e({ k: 'bell', r: .01, g: .035, f: 1040, lp: 3200 }); },
    ramp(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 75, g: .34, lfo: [.07, .5] }).b({ n: 'pink', ft: 'bandpass', hz: 2600, q: 1.1, g: .09, lfo: [.19, .9] }).b({ n: 'brown', ft: 'lowpass', hz: 240, g: .08, lfo: [.1, .7] }); c.wind(.06, 900); c.e({ k: 'thunder', r: .3, g: .1 }); c.e({ k: 'crackle', r: 2.6, g: .05 }); c.e({ k: 'horn', r: .008, g: .05 }); },
    tangga(c) { c.b({ n: 'brown', ft: 'lowpass', hz: 220, g: .14, lfo: [.06, .5] }).b({ n: 'pink', ft: 'bandpass', hz: 950, q: 1.6, g: .09, lfo: [.1, .7] }).b({ n: 'pink', ft: 'highpass', hz: 2600, g: .018, lfo: [.07, .5] }).b({ o: 'sine', f: 62, ft: 'lowpass', hz: 160, g: .02, lfo: [.08, .4] }); c.wind(.09, 900); c.e({ k: 'drip', r: .6, g: .09, f: .8, lp: 5200 }); c.e({ k: 'crackle', r: .9, g: .045, lp: 3200 }); c.birds(.12, 3500); c.owl(.02); },
  };
  const CAL = { airterjun: .88, padang: 1.6, dusun: 3.2, kastil: 2.2, danau: 1.9, reruntuhan: 2.2, pantai: .6, pegunungan: 1.17, kereta: .65, akuarium: .54, atap: .63, lorong: 1, perpus: 1.33, embun: 3, mercu: .38, kapal: .78, gerbang: .38, cermin: 1.7, siluet: 1, ramp: .75, tangga: 1 };   // kekerasan per adegan (kalibrasi RMS luring, siang cerah; cuaca TIDAK ikut dikalikan)
  const WM = { kereta: 'in', perpus: 'in', gerbang: 'under', akuarium: 'none', tangga: 'in' };   // cara cuaca terdengar: dalam ruangan / di bawah air / tidak sama sekali
  /* v155: SETIAP jenis bunyi kejadian dimiliki SATU adegan (OWN = bunyi lama yang dipertahankan, SIGN = bunyi khas baru); bunyi bersama (burung, jangkrik, tetes, lonceng, dst) di adegan lain dibuang supaya tidak ada suara yang diulang. Cuaca (hujan, petir) ditambah sesudahnya. */
  const OWN = { eagle: 'pegunungan', clack: 'kereta', bubble: 'akuarium', horn1: 'atap', tick: 'perpus', page: 'perpus', creak: 'perpus', horn: 'mercu', gull: 'mercu', drip: 'embun', frog: 'danau', owl: 'siluet', crow: 'siluet', bell: 'dusun', cricket: 'padang', bird: 'embun' };
  const SIGN = {
    airterjun(c) { c.e({ k: 'plop', r: c.ph === 'night' ? .22 : (c.ph === 'dawn' || c.ph === 'dusk') ? .33 : .45, g: .03 }); },
    padang(c) { if (c.bf > 0) c.e({ k: 'lark', r: .06 * c.bf, g: .032, lp: 7000 }); },
    dusun(c) { if (c.bf > 0) c.e({ k: 'rooster', r: (c.ph === 'dawn' ? .05 : .012) * Math.min(1.5, c.bf), g: .035, lp: 3500 }); if (c.inf > .5) c.e({ k: 'bark', r: .03, g: .03, lp: 1500 }); },
    kastil(c) { if (!c.rain) c.e({ k: 'anvil', r: .06, g: .03, lp: 9000 }); },
    danau(c) { if (!c.rain && c.ph !== 'day') c.e({ k: 'loon', r: .03, g: .03, lp: 3000 }); if (c.bf > 0) c.e({ k: 'jump', r: .05 * c.bf, g: .03, lp: 3000 }); },
    pegunungan(c) { if (c.inf > 0) c.e({ k: 'howl', r: .02 * c.inf, g: .03, lp: 1800 }); },
    reruntuhan(c) { c.e({ k: 'pebble', r: c.ph === 'night' ? .07 : (c.ph === 'dawn' || c.ph === 'dusk') ? .1 : .13, g: .03 }); },   /* v179-RU-T4b: laju krikil menurut fase hari */
    pantai(c) { if (c.bf > 0) c.e({ k: 'peep', r: .3 * c.bf, g: .028, lp: 8000 }); c.e({ k: 'shingle', r: c.ph === 'night' ? .2 : .05, g: .03 }); },
    kereta(c) { c.e({ k: 'whistle', r: .014, g: .03, lp: 2600 }); },
    atap(c) { if (c.bf > 0) c.e({ k: 'coo', r: .1 * c.bf, g: .03, lp: 1200 }); },
    lorong(c) { c.e({ k: 'wok', r: c.ph === 'night' ? .07 : .03, g: .035 }); },
    kapal(c) { c.e({ k: 'shipbell', r: .03, g: .05, lp: 6000 }); },
    gerbang(c) { c.e({ k: 'taiko', r: .04, g: .05, lp: 1500 }); },
    cermin(c) { c.e({ k: 'glass', r: .07, g: .028 }); },
    ramp(c) { c.e({ k: 'boom', r: .035, g: .2, lp: 900 }); },
    tangga(c) { c.e({ k: 'plink', r: .35, g: .035 }); c.e({ k: 'chirp', r: .04 * (.3 + c.inf + c.bf * .3), g: .02, lp: 9000 }); },
    siluet(c) { c.owl(.03); if (!c.rain) c.e({ k: 'crow', r: .02, g: .03, lp: 5000 }); }
  };
  /* v156: backsound musik per adegan (CONTOH: 4 adegan). Disintesis dari kode (tanpa berkas audio); jarang dan lembut, selalu DI BAWAH suara adegan (MUSV), mengecil sebentar tiap bunyi kejadian (ducking) dan di hujan/badai/salju/kabut; ikut gerbang mode animasi dan tombol speaker. */
  const MUSV = 1;
  const MUS = {
    pantai: { lv: 1.25, root: 196, sc: [0, 2, 4, 7, 9], pad: [1, 1.5], pg: .012, gap: [3.5, 6.5], dur: 3.4, ng: .05, lp: 2800, v: (c, d, t, f, M) => { tone(c, d, t, f, f, M.dur, M.ng, { a: .015, lp: M.lp }); tone(c, d, t, f * 2, f * 2, M.dur * .6, M.ng * .22, { a: .01, lp: M.lp }); } },
    kastil: { lv: .49, root: 146.8, sc: [0, 2, 3, 5, 7, 9, 10], pad: [1, 1.5, 2], pg: .014, gap: [4, 8], dur: 4.6, ng: .04, lp: 900, at: .5, v: (c, d, t, f, M) => { tone(c, d, t, f, f, M.dur, M.ng, { a: M.at, lp: M.lp, type: 'triangle' }); tone(c, d, t, f * 1.5, f * 1.5, M.dur * .8, M.ng * .35, { a: M.at, lp: M.lp }); } },
    danau: { lv: .78, root: 220, sc: [0, 3, 5, 7, 10], pad: [1, 1.5], pg: .011, gap: [3, 6], dur: 2.8, ng: .045, lp: 3200, at: .28, v: (c, d, t, f, M) => { tone(c, d, t, f * .99, f, M.dur, M.ng, { a: M.at, lp: M.lp, vib: [5, f * .006] }); } },
    tangga: { lv: 1.4, root: 130.8, sc: [0, 1, 3, 7, 8], pad: [1], pg: .008, gap: [5, 10], dur: 1.5, ng: .05, lp: 3000, v: (c, d, t, f, M) => { for (let k = 0; k < 4; k++) tone(c, d, t + k * .55, f, f, M.dur, M.ng / (1 + k * 1.4), { a: .006, lp: M.lp }); } }
  };
  function musBuild(ctx, dest, scene, ph, w) {
    const M = MUS[scene]; if (!M) return null;
    const lvl = ctx.createGain(), dk = ctx.createGain(), stops = [], rain = w === 'rain' || w === 'storm', rt = M.root * (ph === 'night' ? .749 : 1);
    lvl.gain.value = MUSV * M.lv * (rain ? .5 : (w === 'snow' || w === 'fog') ? .8 : 1) * (ph === 'night' ? .85 : 1); dk.gain.value = 1; lvl.connect(dk); dk.connect(dest);
    M.pad.forEach((m, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(), l = ctx.createOscillator(), lg = ctx.createGain(); o.type = 'sine'; o.frequency.value = rt * m * (i ? 1.002 : 1); f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = M.pg; l.frequency.value = .04 + .03 * i; lg.gain.value = M.pg * .6; l.connect(lg); lg.connect(g.gain); o.connect(f); f.connect(g); g.connect(lvl); o.start(); l.start(); stops.push(o, l); });
    return { gr: lvl, lp: dk, stops, buses: [], M, rt, ph };
  }
  function musSched(ctx, mg, t0, t1, st, r) {
    const M = mg.M; if (st.mn == null) { st.mn = t0 + 1.2; st.i = 2; }
    let guard = 0;
    while (st.mn < t1 && guard++ < 8) {
      const t = Math.max(st.mn, t0), n = M.sc.length; st.i = Math.max(0, Math.min(n * 2 - 1, st.i + Math.round((r() - .5) * 4)));
      const f = mg.rt * 2 * Math.pow(2, (M.sc[st.i % n] + 12 * Math.floor(st.i / n)) / 12);
      M.v(ctx, mg.gr, t, f, M); st.mn += (M.gap[0] + r() * (M.gap[1] - M.gap[0])) * (mg.ph === 'dusk' || mg.ph === 'night' ? 1.2 : mg.ph === 'day' ? .9 : 1);
    }
  }
  function recipe(scene, m, wx) {
    const fn = SND[scene]; if (!fn) return null;
    const c = ctxRec(scene, m, wx); fn(c); c.ev = c.ev.filter(E => OWN[E.k] === scene || E.k === 'surge'); if (SIGN[scene]) SIGN[scene](c); const k = CAL[scene] || 1; c.beds.forEach(L => { L.g *= k; }); c.ev.forEach(E => { E.g *= k; });
    if (WM[scene] !== 'none') c.weather(WM[scene]);
    return { key: scene + '|' + c.ph + '|' + c.w, scene, ph: c.ph, w: c.w, vol: c.vol, lp: c.lp, beds: c.beds, ev: c.ev };
  }

  /* ---- render luring (uji) dan mesin langsung ---- */
  function chain(ctx, vol) { const m = ctx.createGain(), cp = ctx.createDynamicsCompressor(); m.gain.value = vol; cp.threshold.value = -20; cp.knee.value = 18; cp.ratio.value = 3; cp.attack.value = .03; cp.release.value = .3; m.connect(cp); cp.connect(ctx.destination); m.cp = cp; return m; }
  async function render(scene, m, wx, sec, seed) {
    const oc = new OfflineAudioContext(1, Math.floor(44100 * (sec || 8)), 44100), rec = recipe(scene, m, wx), out = chain(oc, VOL), grp = build(oc, out, rec);
    sched(oc, grp, 0, sec || 8, { nx: [] }, mk(seed || 7)); const b = await oc.startRendering(); return b.getChannelData(0);
  }
  async function renderMix(scene, m, wx, sec, seed, mode) {   // mode: 'scene' | 'both' | 'music' (uji dan contoh luring)
    const T = sec || 8, oc = new OfflineAudioContext(1, Math.floor(44100 * T), 44100), rec = recipe(scene, m, wx), out = chain(oc, VOL), mg = mode === 'scene' ? null : musBuild(oc, out, scene, rec.ph, rec.w);
    if (mode !== 'music') { const grp = build(oc, out, rec); sched(oc, grp, 0, T, { nx: [] }, mk(seed || 7), mg && mg.lp); }
    if (mg) { const st = { mn: null }, r = mk((seed || 7) + 101); for (let t = 0; t < T; t += 1.5) musSched(oc, mg, t, t + 1.5, st, r); }
    const b = await oc.startRendering(); return b.getChannelData(0);
  }
  let evN = 0, ctx = null, master = null, sbus = null, mbus = null, cur = null, curKey = '', st = { nx: [] }, wantOn = lsGet(SK) !== '0', wantMus = lsGet(SKM) !== '0', vS = lsInt(SKVS, MX0.s), vM = lsInt(SKVM, MX0.m), btn = null, quietAt = 0, tmr = 0, live = mk((Date.now() ^ 0x5bd1e995) >>> 0), made = 0;
  const homeOpen = () => { try { return typeof curView !== 'undefined' && curView === 'home' && !!document.getElementById('hxSky'); } catch (e) { return false; } };
  const pxOff = () => { try { return !!(window.DL && window.DL.pxbg && window.DL.pxbg.off()); } catch (e) { return false; } };
  const skyOn = () => { try { const v = document.getElementById('v-home'); return !!(v && v.classList.contains('skyfocus')); } catch (e) { return false; } };   // v155: suara HANYA di mode animasi (ketuk 3x)
  const scState = () => { try { const a = String(window.DL.pxbg.key() || '').split('|'); return a.length > 2 && a[0] ? { scene: a[0], m: +a[1] || 0, wx: a[2] } : null; } catch (e) { return null; } };
  /* ===== v159: MUSIK adegan = LAGU UTUH dirender dari kode (OfflineAudioContext, tanpa berkas audio) dan dipasang ke aplikasi.
     (a) gaya diacak tiap lagu: Stardew saja (sv), Minecraft saja (mc), Minecraft lalu Stardew (mc2sv), Stardew lalu Minecraft (sv2mc);
     (b) profil musik TIAP adegan (skala, tempo, pemimpin, pola gitar, perkusi) menurut tema adegan; nada karangan baru, bukan salinan lagu;
     (c) transisi: lagu lama MEMUDAR (fadeout) sampai senyap dan BERHENTI sebelum lagu baru mulai: tak pernah dua lagu terdengar bersamaan;
     (d) musik di bawah suara adegan (sekitar 9 dB), mengecil sebentar tiap bunyi kejadian (ducking), ikut gerbang mode animasi dan tombol speaker. ===== */
  const MSR = 22050, MFO = 3.2;   // laju contoh render lagu; lama fadeout saat lagu diganti (detik)
  const MSC = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], lyd: [0, 2, 4, 6, 7, 9, 11], mix: [0, 2, 4, 5, 7, 9, 10], phr: [0, 1, 3, 5, 7, 8, 10] };
  const MMIN = { min: 1, dor: 1, phr: 1 };
  const MPT = { F: [[0, 0], [.5, 1], [1, 2], [1.5, 3], [2, 0], [2.5, 2], [3, 1], [3.5, 2]], S: [[0, 0], [1, 2], [2, 3], [3, 2]], M: [[0, 0], [1, 1], [1.5, 2], [2, 3], [3, 2], [3.5, 1]], A: [[0, 0], [.75, 1], [1.5, 2], [2.25, 3], [3, 2]] };
  const MTG = { gtr: .028, bas: .030, ld1: .040, ld2: .022, pno: .030, str: .018, bel: .012, prc: .014, pad: .008 };
  const MSTY = ['sv', 'mc', 'mc2sv', 'sv2mc'];
  const MCH = { G: [{ b: 43, t: [59, 62, 67] }, { b: 50, t: [57, 62, 66] }, { b: 40, t: [59, 64, 67] }, { b: 48, t: [55, 60, 64] }], Am: [{ b: 45, t: [57, 60, 64] }, { b: 41, t: [57, 60, 65] }, { b: 48, t: [55, 60, 64] }, { b: 43, t: [59, 62, 67] }], Dm: [{ b: 50, t: [57, 62, 65] }, { b: 46, t: [58, 62, 65] }, { b: 53, t: [57, 60, 65] }, { b: 48, t: [55, 60, 64] }], C: [{ b: 48, t: [55, 60, 64] }, { b: 45, t: [57, 60, 64] }, { b: 41, t: [57, 60, 65] }, { b: 43, t: [59, 62, 67] }] };
  /* profil per adegan. Empat adegan pertama: akord, melodi, dan kolam piano PERSIS contoh yang disetujui (Tahap 158). Sisanya: akord dari (root, mode, prog), melodi dibangkitkan per lagu. */
  const MP = {
    pantai: { root: 55, mode: 'maj', bpm: 96, lead: 'm', pat: 'F', lp: 3200, wet: .4, gv: .11, lv: .2, perc: 2, N: 5, ch: MCH.G, pool: [55, 59, 62, 64, 67, 71, 74], drone: 43, mel: [[0, 71, 1], [1, 74, .5], [1.5, 76, .5], [2, 74, 1.5], [3.5, 71, .5], [4, 69, 1], [5, 74, 1], [6, 76, 1], [7, 74, 1], [8, 71, 1], [9, 67, .5], [9.5, 71, .5], [10, 76, 2], [12, 72, 1], [13, 71, .5], [13.5, 69, .5], [14, 67, 2]] },
    tangga: { root: 48, mode: 'maj', bpm: 104, lead: 'm', pat: 'F', lp: 3400, wet: .4, gv: .11, lv: .2, perc: 2, N: 5, ch: MCH.C, pool: [53, 57, 60, 64, 67, 69, 72], drone: 41, mel: [[0, 76, .5], [.5, 79, .5], [1, 76, 1], [2, 72, 2], [4, 72, .5], [4.5, 76, .5], [5, 81, 1.5], [7, 79, 1], [8, 77, 1], [9, 76, .5], [9.5, 74, .5], [10, 72, 2], [12, 74, 1], [13, 79, 1], [14, 74, 1], [15, 71, 1]] },
    danau: { root: 57, mode: 'min', bpm: 66, lead: 'f', pat: 'S', lp: 3000, wet: .4, gv: .1, lv: .15, perc: 1, N: 4, ch: MCH.Am, pool: [57, 60, 64, 67, 69, 72, 76], drone: 45, mel: [[0, 76, 2.5], [2.5, 72, 1.5], [4, 77, 1], [5, 76, 1], [6, 72, 2], [8, 72, 1.5], [9.5, 74, .5], [10, 76, 2], [12, 74, 2], [14, 71, 2]] },
    kastil: { root: 50, mode: 'min', bpm: 62, lead: 'f', pat: 'S', lp: 2600, wet: .4, gv: .1, lv: .14, perc: 1, N: 4, ch: MCH.Dm, pool: [50, 57, 60, 64, 65, 69, 74], drone: 38, mel: [[0, 69, 2], [2, 74, 1], [3, 72, 1], [4, 70, 2], [6, 74, 1], [7, 72, 1], [8, 72, 1.5], [9.5, 69, .5], [10, 77, 2], [12, 76, 2], [14, 72, 2]] },
    /* v176-T5b: airterjun = A Mixolydian, I-bVII-IV-v (A, G, D, Em); sebelumnya kembar dengan siluet (A mayor I-V-vi-IV) */
    airterjun: { root: 57, mode: 'mix', prog: [0, 6, 3, 4], ml: 'pent', bpm: 72, lead: 'f', pat: 'S', lp: 3000, wet: .45, gv: .1, lv: .2, perc: 1 },
    padang: { root: 58, mode: 'maj', prog: [0, 5, 3, 4], ml: 'pent', bpm: 84, lead: 'm', pat: 'M', lp: 3000, wet: .35, gv: .11, lv: .2, perc: 1 },
    dusun: { root: 50, mode: 'maj', prog: [0, 3, 4, 0], bpm: 100, lead: 'm', pat: 'M', lp: 3300, wet: .3, gv: .12, lv: .2, perc: 2 },
    reruntuhan: { root: 52, mode: 'dor', prog: [0, 6, 0, 3], bpm: 58, lead: 'f', pat: 'S', lp: 2200, wet: .6, gv: .09, lv: .16, perc: 0 },
    pegunungan: { root: 53, mode: 'lyd', prog: [0, 1, 0, 4], bpm: 56, lead: 'f', pat: 'S', lp: 3600, wet: .65, gv: .09, lv: .16, perc: 0 },
    kereta: { root: 59, mode: 'min', prog: [0, 5, 2, 6], bpm: 92, lead: 'm', pat: 'F', lp: 2800, wet: .3, gv: .11, lv: .2, perc: 1 },
    akuarium: { root: 55, mode: 'lyd', prog: [0, 1, 4, 0], bpm: 64, lead: 'f', pat: 'A', lp: 2400, wet: .7, gv: .09, lv: .17, perc: 0 },
    atap: { root: 52, mode: 'min', prog: [0, 3, 6, 2], bpm: 78, lead: 'm', pat: 'M', lp: 2800, wet: .4, gv: .1, lv: .18, perc: 1 },
    lorong: { root: 48, mode: 'dor', prog: [0, 3, 0, 6], bpm: 88, lead: 'm', pat: 'F', lp: 3000, wet: .3, gv: .12, lv: .2, perc: 2 },
    perpus: { root: 55, mode: 'min', prog: [0, 5, 3, 4], bpm: 60, lead: 'f', pat: 'S', lp: 2400, wet: .5, gv: .09, lv: .15, perc: 0 },
    embun: { root: 52, mode: 'maj', prog: [0, 2, 3, 4], ml: 'pent', bpm: 68, lead: 'm', pat: 'A', lp: 3400, wet: .5, gv: .09, lv: .17, perc: 0 },
    mercu: { root: 54, mode: 'phr', prog: [0, 1, 0, 6], bpm: 70, lead: 'f', pat: 'S', lp: 2000, wet: .5, gv: .1, lv: .18, perc: 2 },
    kapal: { root: 50, mode: 'dor', prog: [0, 3, 0, 4], bpm: 72, lead: 'f', pat: 'M', lp: 2800, wet: .4, gv: .1, lv: .18, perc: 1 },
    gerbang: { root: 56, mode: 'min', prog: [0, 5, 2, 6], bpm: 72, lead: 'm', pat: 'S', lp: 2600, wet: .5, gv: .1, lv: .19, perc: 2 },
    cermin: { root: 51, mode: 'lyd', prog: [0, 1, 0, 5], bpm: 60, lead: 'f', pat: 'A', lp: 3000, wet: .75, gv: .09, lv: .16, perc: 0 },
    siluet: { root: 57, mode: 'maj', prog: [0, 4, 5, 3], bpm: 108, lead: 'm', pat: 'F', lp: 3400, wet: .3, gv: .12, lv: .2, perc: 2 },
    ramp: { root: 51, mode: 'min', prog: [0, 5, 6, 4], bpm: 76, lead: 'm', pat: 'A', lp: 3200, wet: .55, gv: .1, lv: .18, perc: 1 }
  };
  /* kalibrasi (diukur luring dengan cal159.py): ga = pengali tiap lapis agar dayanya sama dengan MTG; tg = RMS sasaran lagu (domain keluaran, 9 dB di bawah suara adegan) */
  const MCAL = /*MCAL*/{"airterjun":{"ga":{"bas":0.076,"bel":0.069,"gtr":1.023,"ld1":0.339,"ld2":0.563,"pad":0.57,"pno":0.307,"prc":0.604,"str":0.035},"tg":0.014},"akuarium":{"ga":{"bas":0.08,"bel":0.068,"gtr":1.167,"ld1":0.347,"ld2":0.832,"pad":0.652,"pno":0.291,"prc":1,"str":0.032},"tg":0.009},"atap":{"ga":{"bas":0.078,"bel":0.061,"gtr":0.995,"ld1":0.748,"ld2":0.289,"pad":0.629,"pno":0.319,"prc":0.923,"str":0.036},"tg":0.00748},"cermin":{"ga":{"bas":0.088,"bel":0.079,"gtr":1.24,"ld1":0.293,"ld2":0.746,"pad":0.741,"pno":0.338,"prc":1,"str":0.033},"tg":0.00834},"danau":{"ga":{"bas":0.079,"bel":0.066,"gtr":1.059,"ld1":0.352,"ld2":0.785,"pad":0.578,"pno":0.359,"prc":0.928,"str":0.035},"tg":0.00667},"dusun":{"ga":{"bas":0.071,"bel":0.07,"gtr":0.767,"ld1":0.611,"ld2":0.275,"pad":0.494,"pno":0.347,"prc":0.174,"str":0.042},"tg":0.0052},"embun":{"ga":{"bas":0.077,"bel":0.068,"gtr":1.161,"ld1":0.863,"ld2":0.269,"pad":0.631,"pno":0.328,"prc":1,"str":0.035},"tg":0.00378},"gerbang":{"ga":{"bas":0.079,"bel":0.07,"gtr":1.034,"ld1":0.799,"ld2":0.257,"pad":0.801,"pno":0.322,"prc":0.168,"str":0.035},"tg":0.00885},"kapal":{"ga":{"bas":0.079,"bel":0.067,"gtr":1.012,"ld1":0.324,"ld2":0.544,"pad":0.448,"pno":0.315,"prc":0.604,"str":0.036},"tg":0.01004},"kastil":{"ga":{"bas":0.079,"bel":0.075,"gtr":1.062,"ld1":0.4,"ld2":0.837,"pad":0.447,"pno":0.371,"prc":0.928,"str":0.035},"tg":0.00465},"kereta":{"ga":{"bas":0.077,"bel":0.073,"gtr":0.814,"ld1":0.675,"ld2":0.27,"pad":0.698,"pno":0.343,"prc":0.909,"str":0.039},"tg":0.0127},"lorong":{"ga":{"bas":0.082,"bel":0.071,"gtr":0.788,"ld1":0.687,"ld2":0.244,"pad":0.611,"pno":0.335,"prc":0.153,"str":0.04},"tg":0.00572},"mercu":{"ga":{"bas":0.081,"bel":0.065,"gtr":1.05,"ld1":0.37,"ld2":0.625,"pad":0.491,"pno":0.302,"prc":0.189,"str":0.034},"tg":0.01202},"padang":{"ga":{"bas":0.076,"bel":0.069,"gtr":0.909,"ld1":0.723,"ld2":0.247,"pad":0.613,"pno":0.348,"prc":0.65,"str":0.038},"tg":0.00714},"pantai":{"ga":{"bas":0.075,"bel":0.074,"gtr":0.793,"ld1":0.758,"ld2":0.269,"pad":0.655,"pno":0.331,"prc":0.158,"str":0.04},"tg":0.01157},"pegunungan":{"ga":{"bas":0.092,"bel":0.083,"gtr":1.283,"ld1":0.321,"ld2":0.763,"pad":0.743,"pno":0.343,"prc":1,"str":0.033},"tg":0.00921},"perpus":{"ga":{"bas":0.077,"bel":0.076,"gtr":1.1,"ld1":0.358,"ld2":0.778,"pad":0.648,"pno":0.35,"prc":1,"str":0.034},"tg":0.00447},"ramp":{"ga":{"bas":0.084,"bel":0.069,"gtr":1.062,"ld1":0.886,"ld2":0.255,"pad":0.73,"pno":0.335,"prc":0.948,"str":0.036},"tg":0.00829},"reruntuhan":{"ga":{"bas":0.074,"bel":0.077,"gtr":1.201,"ld1":0.332,"ld2":0.726,"pad":0.629,"pno":0.301,"prc":1,"str":0.031},"tg":0.00493},"siluet":{"ga":{"bas":0.075,"bel":0.067,"gtr":0.699,"ld1":0.703,"ld2":0.264,"pad":0.6,"pno":0.345,"prc":0.187,"str":0.044},"tg":0.00787},"tangga":{"ga":{"bas":0.077,"bel":0.077,"gtr":0.777,"ld1":0.724,"ld2":0.265,"pad":0.758,"pno":0.357,"prc":0.162,"str":0.043},"tg":0.0068}}/*/MCAL*/;
  const mClamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function mChords(root, mode, prog) {
    const sc = MSC[mode], deg = d => root + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
    return prog.map(d => {
      let b = deg(d); while (b >= 50) b -= 12; while (b < 38) b += 12;
      const t = [deg(d), deg(d + 2), deg(d + 4)].map(x => { let y = ((x % 12) + 12) % 12; while (y < 55) y += 12; return y; }).sort((p, q) => p - q);
      return { b, t };
    });
  }
  function mPool(root, mode) {
    const ps = MMIN[mode] ? [0, 3, 5, 7, 10] : mode === 'lyd' ? [0, 2, 4, 6, 7, 9, 11].filter((x, i) => i !== 5 && i !== 6) : [0, 2, 4, 7, 9], tn = ((root % 12) + 12) % 12, o = [];
    for (let m = 55; m <= 76; m++) if (ps.includes(((m - tn) % 12 + 12) % 12)) o.push(m);
    return o.filter((x, i) => i % 2 === 0 || x % 12 === tn);
  }
  function mMel(r, P, ch) {   // melodi baru 4 bar (16 ketuk): motif bar 0 diulang di bar 2, bar 3 menutup ke tonika
    const tn = ((P.root % 12) + 12) % 12, ms = P.ml === 'pent' ? (MMIN[P.mode] ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]) : MSC[P.mode], lad = [];
    for (let m = 64; m <= 86; m++) if (ms.includes(((m - tn) % 12 + 12) % 12)) lad.push(m);
    const lo = 1, hi = lad.length - 2, slow = P.bpm < 70, lively = P.bpm >= 90;
    const RY = lively ? [[[0, .5], [.5, .5], [1, 1], [2, 1], [3, 1]], [[0, 1], [1, .5], [1.5, .5], [2, 1], [3, 1]], [[0, .5], [.5, .5], [1, .5], [1.5, .5], [2, 2]]]
      : slow ? [[[0, 2], [2, 1], [3, 1]], [[0, 1.5], [1.5, .5], [2, 2]], [[0, 3], [3, 1]], [[0, 1], [1, 3]]]
        : [[[0, 1], [1, 1], [2, 1], [3, 1]], [[0, 1.5], [1.5, .5], [2, 2]], [[0, 1], [1, 1], [2, 2]]];
    const pk = a => a[Math.floor(r() * a.length)], RA = pk(RY), RB = pk(RY), RC = pk(RY), rest = slow ? .18 : .1, ST = [-2, -1, -1, 0, 1, 1, 2], stA = [], mel = [];
    let ci = 0, bd = 99; lad.forEach((m, j) => { if (m % 12 === tn && Math.abs(m - 72) < bd) { bd = Math.abs(m - 72); ci = j; } });
    const near = (c0, pcs) => { for (let d = 0; d < 7; d++) for (const s of [d, -d]) { const j = c0 + s; if (j >= lo && j <= hi && pcs.includes(lad[j] % 12)) return j; } return mClamp(c0, lo, hi); };
    for (let bi = 0; bi < 4; bi++) {
      const rh = bi === 0 || bi === 2 ? RA : bi === 1 ? RB : RC, pcs = ch[bi].t.map(x => x % 12).concat(ch[bi].b % 12);
      rh.forEach(([o, d], k) => {
        if (k === 0) ci = near(ci + (bi === 2 ? 1 : 0), pcs);
        else {
          let s = bi === 2 && stA[k] != null && r() < .75 ? stA[k] : pk(ST); if (r() < .08) s = s >= 0 ? 3 : -3; if (bi === 0) stA[k] = s;
          if (k === rh.length - 1 && bi === 1) s = 0; ci = mClamp(ci + s, lo, hi); if (r() < rest && bi !== 0) return;
        }
        mel.push([bi * 4 + o, lad[ci] + (P.ls || 0), d]);
      });
    }
    let tj = ci, td = 99; lad.forEach((m, j) => { if (m % 12 === tn && Math.abs(j - ci) < td) { td = Math.abs(j - ci); tj = j; } });
    if (mel.length) { const l = mel[mel.length - 1]; l[1] = lad[tj] + (P.ls || 0); l[2] = Math.max(l[2], 2); }
    return mel;
  }
  function mCfg(scene, r, ph, hand) {
    const P = MP[scene]; if (!P) return null;
    const sh = ph === 'night' ? -5 : 0, ch = (P.ch || mChords(P.root, P.mode, P.prog)).map(c => ({ b: c.b + sh, t: c.t.map(x => x + sh) }));
    const mel = ((hand || (P.mel && r() < .6)) && P.mel ? P.mel : mMel(r, P, P.ch || mChords(P.root, P.mode, P.prog))).map(([b, m, d]) => [b, m + sh, d]);
    const pool = (P.pool || mPool(P.root, P.mode)).map(x => x + sh), tn = ((P.root % 12) + 12) % 12;
    let drone = P.drone != null ? P.drone : tn + 36; while (P.drone == null && drone > 47) drone -= 12;
    const LP = 16 * 60 / P.bpm;
    return { bpm: P.bpm, lead: P.lead, pat: MPT[P.pat], lp: P.lp, wet: P.wet, gv: P.gv, lv: P.lv, pv: .2, perc: P.perc, N: P.N || mClamp(Math.round(52 / LP), 4, 6), chords: ch, mel, pool, drone: drone + sh };
  }
  function mPlan(st, N) {   // rencana per putaran (4 bar): lapis apa yang aktif; auto = kurva filter/gema bus
    const pl = [], wind = N >= 5;
    if (st === 'mc2sv') {
      for (let i = 0; i < N; i++) { const w = wind && i === N - 1, mid = i >= 2; pl.push({ pno: i === 0 ? [1, 2.2] : i === 1 ? [3, 6] : w ? [2, 4] : 0, gtr: i === 0 ? 0 : i === 1 ? 'ramp' : 1, bas: i === 0 ? 0 : i === 1 ? 'late' : 1, str: mid ? .5 : 0, strB: i === 0 ? .35 : 0, prc: mid && !w, m1: mid, m2: i >= 3 && !w, bel: i >= 3 && !w }); }
      return { pl, auto: 'open' };
    }
    if (st === 'sv') {
      for (let i = 0; i < N; i++) { const last = i === N - 1; pl.push(i === 0 ? { gtr: 'ramp', bas: 'late', str: .35 } : i === 1 ? { gtr: 1, bas: 1, str: .5, m1: 1, prc: 1 } : last ? { gtr: 1, bas: 1, str: .4, m1: 1, pno: [2, 4] } : { gtr: 1, bas: 1, str: .5, m1: 1, m2: 1, bel: 1, prc: 1 }); }
      return { pl, auto: 'none' };
    }
    if (st === 'sv2mc') {
      const nS = Math.max(2, Math.round(N * .55));
      for (let i = 0; i < N; i++) pl.push(i >= nS ? { pno: [2, 4.5], strL: .3, bel: i < N - 1 ? 1 : 0 } : i === 0 ? { gtr: 1, bas: 1, str: .4, m1: 1 } : i === nS - 1 ? { gtr: 'fade', bas: 'fade', str: .5, m1: 1, pno: [2, 4] } : { gtr: 1, bas: 1, str: .5, m1: 1, m2: 1, bel: 1, prc: 1 });
      return { pl, auto: 'close', nS };
    }
    for (let i = 0; i < N; i++) { const last = i === N - 1; pl.push(i === 0 ? { pno: [1, 2.2], strL: .3 } : last ? { pno: [2, 4] } : { pno: [2, 4.5], strL: .3, mp: 1, bel: i % 2 }); }
    return { pl, auto: 'dim' };
  }
  async function mRender(cfg, st, seed, layers, gains) {
    const SR = MSR, sp = 60 / cfg.bpm, LP = 16 * sp, N = cfg.N, T = Math.round((N * LP + 3) * 100) / 100, oc = new OfflineAudioContext(1, Math.floor(SR * T), SR); let s = seed >>> 0; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const hz = m => 440 * Math.pow(2, (m - 69) / 12), plan = mPlan(st, N), PL = plan.pl; gains = gains || {};
    const bus = oc.createBiquadFilter(); bus.type = 'lowpass'; bus.frequency.value = cfg.lp;
    const dry = oc.createGain(), wet = oc.createGain(), out = oc.createGain(), cv = oc.createConvolver(), wl = oc.createBiquadFilter();
    const L = Math.floor(SR * 3.4), ir = oc.createBuffer(1, L, SR), d = ir.getChannelData(0); for (let i = 0; i < L; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / L, 3);
    cv.buffer = ir; wl.type = 'lowpass'; wl.frequency.value = 3500; wet.gain.value = cfg.wet; bus.connect(dry); bus.connect(cv); cv.connect(wl); wl.connect(wet); dry.connect(out); wet.connect(out); out.connect(oc.destination);
    const osc = (ty, f, t, du, dest) => { const o = oc.createOscillator(); o.type = ty; o.frequency.value = f; o.connect(dest); o.start(t); o.stop(t + du); return o; };
    const G = (t, a, dec, pk) => { const g = oc.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dec); g.connect(bus); return g; };
    const piano = (t, m, v) => { const f = hz(m); [[1, 1, 3], [2, .3, 2], [3, .1, 1.2], [4, .04, .8]].forEach(([k, a, dc]) => osc('sine', f * k, t, dc + .2, G(t, .01, dc, v * a))); };
    const pluck = (t, m, v) => { const f = hz(m), fl = oc.createBiquadFilter(), g = G(t, .004, 1.2, v); fl.type = 'lowpass'; fl.Q.value = 1; fl.frequency.setValueAtTime(3000, t); fl.frequency.exponentialRampToValueAtTime(500, t + .4); fl.connect(g); osc('sawtooth', f, t, 1.4, fl); osc('triangle', f * 2.003, t, 1.4, fl); };
    const mar = (t, m, v) => { const f = hz(m); osc('sine', f, t, .9, G(t, .003, .6, v)); osc('sine', f * 4, t, .3, G(t, .002, .12, v * .25)); osc('sine', f * 10, t, .1, G(t, .001, .05, v * .06)); };
    const flute = (t, m, du, v) => { const f = hz(m), g = oc.createGain(), g2 = oc.createGain(), l = oc.createOscillator(), lg = oc.createGain(), o = oc.createOscillator(), o2 = oc.createOscillator(); o.frequency.value = f; o2.frequency.value = f * 2; g2.gain.value = .12; l.frequency.value = 5; lg.gain.value = f * .005; l.connect(lg); lg.connect(o.frequency); o.connect(g); o2.connect(g2); g2.connect(g); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .15); g.gain.setValueAtTime(v, t + Math.max(.2, du - .3)); g.gain.linearRampToValueAtTime(.0001, t + du); g.connect(bus); [o, o2, l].forEach(x => { x.start(t); x.stop(t + du + .05); }); };
    const P = (l, fn, ...a) => { if (layers && !layers.includes(l)) return; a[a.length - 1] *= (gains[l] || 1); fn(...a); };
    const bass = (t, m, v) => { osc('sine', hz(m), t, 2, G(t, .02, 1.4, v)); osc('triangle', hz(m), t, 2, G(t, .02, 1, v * .4)); };
    const strn = (t, m, du, v) => { const g = oc.createGain(), fl = oc.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1300; fl.connect(g); g.gain.setValueAtTime(.0001, t); const at = du >= 2.2 ? 1.1 : du * .45, rl = du >= 2.2 ? 1 : du * .4; g.gain.linearRampToValueAtTime(v, t + at); g.gain.setValueAtTime(v, t + du - rl); g.gain.linearRampToValueAtTime(.0001, t + du); g.connect(bus); [.997, 1.003].forEach(k => osc('sawtooth', hz(m) * k, t, du + .05, fl)); };
    const bell = (t, m, v) => { const f = hz(m); osc('sine', f, t, 1.8, G(t, .003, 1.5, v)); osc('sine', f * 2.76, t, .8, G(t, .003, .6, v * .3)); };
    const kick = (t, v) => { const o = oc.createOscillator(), g = G(t, .003, .28, v); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + .14); o.connect(g); o.start(t); o.stop(t + .4); };
    const nb = oc.createBuffer(1, Math.floor(SR * .2), SR), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
    const shk = (t, v) => { const q = oc.createBufferSource(), h = oc.createBiquadFilter(), g = oc.createGain(); q.buffer = nb; h.type = 'highpass'; h.frequency.value = 6500; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .07); q.connect(h); h.connect(g); g.connect(dry); q.start(t); q.stop(t + .12); };
    const ld = (k, t, m, du, v) => k === 'f' ? flute(t, m, du * sp, v) : mar(t, m, v), oth = cfg.lead === 'f' ? 'm' : 'f';
    const genP = (a, b, gap) => { let t = a; while (t < b) { const n = 2 + Math.floor(r() * 3); let i = Math.floor(r() * cfg.pool.length), dir = r() < .6 ? 1 : -1; for (let k = 0; k < n && t < b; k++) { P('pno', piano, t, cfg.pool[i], cfg.pv * (.7 + .5 * r())); i = Math.max(0, Math.min(cfg.pool.length - 1, i + dir * (1 + Math.floor(r() * 2)))); if (r() < .2) dir = -dir; t += .6 + r() * .5; } t += gap[0] + r() * (gap[1] - gap[0]); } };
    // kurva bus (filter dan gema): open = membuka dari Minecraft ke Stardew; close = menutup dari Stardew ke Minecraft; dim = tetap redup dan basah (Minecraft)
    if (plan.auto === 'open') { bus.frequency.setValueAtTime(cfg.lp * .55, 0); bus.frequency.setValueAtTime(cfg.lp * .55, LP * .7); bus.frequency.linearRampToValueAtTime(cfg.lp, LP * 1.9); wet.gain.setValueAtTime(cfg.wet * 1.6, 0); wet.gain.setValueAtTime(cfg.wet * 1.6, LP * .7); wet.gain.linearRampToValueAtTime(cfg.wet, LP * 1.9); }
    else if (plan.auto === 'close') { const a = (plan.nS - 1) * LP + .3 * LP, b = plan.nS * LP + .4 * LP; bus.frequency.setValueAtTime(cfg.lp, a); bus.frequency.linearRampToValueAtTime(cfg.lp * .55, b); wet.gain.setValueAtTime(cfg.wet, a); wet.gain.linearRampToValueAtTime(cfg.wet * 1.6, b); }
    else if (plan.auto === 'dim') { bus.frequency.value = cfg.lp * .75; wet.gain.value = cfg.wet * 1.4; }
    if (st !== 'sv' && (!layers || layers.includes('pad'))) { const g = oc.createGain(); g.gain.setValueAtTime(.0001, 0); g.gain.linearRampToValueAtTime(.012 * (gains.pad || 1) * (st === 'mc' ? 1.5 : 1), 4); g.connect(bus); [1, 1.004].forEach(k => osc('sine', hz(cfg.drone) * k, 0, T, g)); }
    if (st === 'mc2sv') { const c0 = cfg.chords[0], nn = c0.t.concat([c0.t[0] + 12]); nn.forEach((m, k) => P('pno', piano, LP - 2 * sp + k * .5 * sp, m, cfg.pv * (.6 + .25 * k))); }
    if (st === 'sv2mc') { const c0 = cfg.chords[0], nn = c0.t.concat([c0.t[0] + 12]).reverse(); nn.forEach((m, k) => P('pno', piano, plan.nS * LP - 2 * sp + k * .5 * sp, m, cfg.pv * (.9 - .2 * k))); }
    for (let i = 0; i < N; i++) {
      const t0 = i * LP, c = PL[i];
      if (c.pno) genP(t0 + (i === 0 ? .8 : 1), t0 + LP, c.pno);
      cfg.chords.forEach((ch, bi) => {
        const bt = t0 + bi * 4 * sp, bm = ch.b >= 48 ? ch.b - 12 : ch.b;
        if (c.gtr) { const fade = c.gtr === 'fade', ramp = c.gtr === 'ramp' ? .35 + .65 * bi / 3 : fade ? 1 - .7 * bi / 3 : 1; cfg.pat.forEach(([b, x], k) => P('gtr', pluck, bt + b * sp, x ? ch.t[x - 1] : ch.b, ramp * cfg.gv * (b === 0 ? 1.3 : (k % 2 ? .8 : 1)))); }
        if (c.bas && (c.bas !== 'late' || bi >= 1)) { const bv = c.bas === 'fade' ? 1 - .6 * bi / 3 : 1; P('bas', bass, bt, bm, bv); P('bas', bass, bt + 2 * sp, bm, .8 * bv); }
        if (c.strB && bi === 3) ch.t.forEach(m => P('str', strn, bt, m, 4 * sp, c.strB));
        if (c.str) ch.t.forEach(m => P('str', strn, bt, m, 4 * sp, c.str));
        if (c.strL && bi % 2 === 0) ch.t.forEach(m => P('str', strn, bt, m, 8 * sp, c.strL));
        if (c.prc && cfg.perc) for (let b = 0; b < 4; b++) { if (cfg.perc > 1) { if (b % 2 === 0) P('prc', kick, bt + b * sp, .5); P('prc', shk, bt + (b + .5) * sp, .4); } P('prc', shk, bt + b * sp, .25); }
        if (c.bel) for (let k = 0; k < 2; k++) { const tt = bt + r() * 3.6 * sp, mm = ch.t[Math.floor(r() * 3)] + 12 * (1 + Math.floor(r() * 2)); P('bel', bell, tt, mm, .5); }
      });
      if (c.m1) cfg.mel.forEach(([b, m, du]) => { const t = t0 + b * sp; P('ld1', ld, cfg.lead, t, m, du, cfg.lv); if (c.m2) P('ld2', ld, oth, t, m, du, cfg.lv * .7); });
      if (c.mp) cfg.mel.forEach(([b, m, du], k) => { if (k % 2 === 0 && r() < .85) P('pno', piano, t0 + b * sp, m - 12, cfg.pv * .85); });
    }
    return (await oc.startRendering()).getChannelData(0);
  }
  const mRms = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / (a.length || 1)); };
  async function mSong(scene, st, ph, seed, opt) {   // lagu jadi: dirender, dinormalkan ke RMS sasaran adegan, ujungnya memudar 4 detik
    const rr = mk((seed >>> 0) ^ 0x51ED27), cfg = mCfg(scene, rr, ph, opt && opt.hand); if (!cfg) return null;
    const K = MCAL[scene] || {}, raw = await mRender(cfg, st, seed, opt && opt.layers, (opt && opt.gains) || K.ga);
    if (opt && opt.raw) return { data: raw, cfg };
    const data = new Float32Array(raw), n = data.length, rm = mRms(data); let pk = 0; for (let i = 0; i < n; i++) { const a = Math.abs(data[i]); if (a > pk) pk = a; }
    let k = rm > 1e-6 ? ((K.tg || .02) / VOL) / rm : 0; if (pk * k > .9) k = .9 / pk;
    const fo = Math.floor(MSR * 4); for (let i = 0; i < n; i++) { let f = 1; if (i >= n - fo) { const u = (n - i) / fo; f = .5 - .5 * Math.cos(Math.PI * u); } data[i] *= k * f; }
    return { data, cfg, st, scene };
  }
  /* ---- pemutar langsung: satu saluran musik, SATU lagu aktif; ganti adegan = fadeout dulu, lagu baru menunggu sampai senyap ---- */
  const MS = { sc: '', since: 0, rid: 0, song: null, nxt: null, rend: false, free: 0, last: '', lvl: null, dk: null, r: mk((Date.now() ^ 0x2545F491) >>> 0), n: 0, err: 0, retry: 0, fading: null };
  function musChain() {
    if (!ctx || (MS.lvl && MS.lvl.context === ctx)) return;
    MS.lvl = ctx.createGain(); MS.dk = ctx.createGain(); MS.lvl.gain.value = .0001; MS.dk.gain.value = 1; MS.dk.connect(MS.lvl); MS.lvl.connect(mbus);
  }
  function musFade(now, dur) {
    const sg = MS.song; if (!sg) return;
    sg.g.gain.cancelScheduledValues(now); sg.g.gain.setValueAtTime(Math.max(.0001, sg.g.gain.value), now); sg.g.gain.setTargetAtTime(.0001, now, dur / 4.5);
    try { sg.src.stop(now + dur + .35); } catch (e) { /* sudah berhenti */ }
    MS.free = Math.max(MS.free, now + dur + .5); MS.song = null; MS.fading = sg;
    setTimeout(() => { try { sg.src.disconnect(); sg.g.disconnect(); } catch (e) { /* abaikan */ } if (MS.fading === sg) MS.fading = null; }, (dur + 1.5) * 1000);
  }
  function musRender(scene, ph) {
    const my = ++MS.rid; MS.rend = true; const pool = MSTY.filter(x => x !== MS.last), st = pool[Math.floor(MS.r() * pool.length)], seed = Math.floor(MS.r() * 4294967295);
    setTimeout(() => {
      mSong(scene, st, ph, seed).then(sg => { if (my !== MS.rid) return; MS.rend = false; MS.err = 0; if (sg && sg.scene === MS.sc) { MS.nxt = sg; MS.n++; } }).catch(() => { if (my !== MS.rid) return; MS.rend = false; MS.err++; MS.retry = performance.now() + 15000 * MS.err; });
    }, 60);
  }
  function musPlay(now) {
    const nx = MS.nxt; MS.nxt = null; if (!nx) return;
    const b = ctx.createBuffer(1, nx.data.length, MSR); b.copyToChannel(nx.data, 0);
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; g.gain.setValueAtTime(.0001, now); g.gain.linearRampToValueAtTime(1, now + 2.2); src.connect(g); g.connect(MS.dk); src.start(now);
    MS.song = { src, g, end: now + b.duration, st: nx.st, scene: nx.scene, t0: now }; MS.last = nx.st;
  }
  function musTick(now, s, rec) {
    musChain(); if (!MS.lvl) return;
    if (!wantMus) { if (MS.song) musFade(now, 1.6); MS.rid++; MS.rend = false; MS.nxt = null; MS.sc = ''; return; }   // v159b: tombol musik saja mati
    const w = rec.w, rain = w === 'rain' || w === 'storm';
    MS.lvl.gain.setTargetAtTime((rain ? .5 : (w === 'snow' || w === 'fog') ? .8 : 1) * (rec.ph === 'night' ? .85 : 1), now, 1.2);
    if (MS.sc !== s.scene) {   // adegan berganti: lagu lama memudar dulu; lagu baru baru mulai SESUDAH lagu lama senyap
      MS.sc = s.scene; MS.since = now; MS.rid++; MS.rend = false; MS.nxt = null; if (MS.song) musFade(now, MFO);
    }
    if (!MP[s.scene]) return;
    if (MS.song && now >= MS.song.end) { const sg = MS.song; MS.song = null; try { sg.src.disconnect(); sg.g.disconnect(); } catch (e) { /* abaikan */ } MS.free = Math.max(MS.free, now + 2 + MS.r() * 3); }   // lagu habis (sudah memudar di dalam rekamannya)
    const idle = now - MS.since > 2.5 && performance.now() >= MS.retry;
    if (!MS.rend && !MS.nxt && idle && (!MS.song || now > MS.song.end - 22)) musRender(s.scene, rec.ph);
    if (!MS.song && MS.nxt && now >= MS.free) musPlay(now);
  }
  const MUSAPI = Object.freeze({
    styles: MSTY, scenes: () => Object.keys(MP), fade: MFO, plan: mPlan, cfg: (sc, ph, seed, hand) => mCfg(sc, mk(seed >>> 0), ph, hand), song: mSong, render: mRender, layers: () => Object.keys(MTG), target: MTG, cal: () => MCAL,
    drive: (scene, ph, w) => { if (!ensure()) return null; if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) { /* abaikan */ } } musChain(); musTick(ctx.currentTime, { scene }, { ph: ph || 'day', w: w || 'clear' }); return MUSAPI.state(); },   // pengait uji: menggerakkan pemutar tanpa adegan nyata
    dbg: () => ({ now: ctx ? ctx.currentTime : 0, song: MS.song && { gain: MS.song.g.gain.value, scene: MS.song.scene, st: MS.song.st, t0: MS.song.t0, end: MS.song.end }, fade: MS.fading && { gain: MS.fading.g.gain.value } }),
    state: () => ({ sc: MS.sc, st: MS.song ? MS.song.st : null, playing: !!MS.song, fading: !!MS.fading, rendering: MS.rend, ready: !!MS.nxt, last: MS.last, made: MS.n, err: MS.err, lvl: MS.lvl ? +MS.lvl.gain.value.toFixed(3) : 0, left: MS.song && ctx ? +(MS.song.end - ctx.currentTime).toFixed(1) : 0 })
  });
  function ensure() {
    if (ctx) return true;
    try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC(); made++; master = chain(ctx, 0); sbus = ctx.createGain(); sbus.gain.value = wantOn ? sMul() : 0; sbus.connect(master); mbus = ctx.createGain(); mbus.gain.value = wantMus ? mMul() : 0; mbus.connect(master); return true; } catch (e) { ctx = null; return false; }
  }
  function swap(rec) {
    const now = ctx.currentTime, g = build(ctx, sbus, rec);
    g.gr.gain.setValueAtTime(.0001, now); g.gr.gain.linearRampToValueAtTime(rec.vol, now + 2.5);
    if (cur) { const o = cur; o.gr.gain.cancelScheduledValues(now); o.gr.gain.setValueAtTime(Math.max(.0001, o.gr.gain.value), now); o.gr.gain.linearRampToValueAtTime(.0001, now + 2.5); setTimeout(() => kill(o), 3000); }
    cur = g; curKey = rec.key; st = { nx: [] };
  }
  function tick() {
    try {
      ensureBtn();
      if (!ctx) return;
      const ok = (wantOn || wantMus) && !document.hidden && homeOpen() && !pxOff() && skyOn(), now = ctx.currentTime;
      master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(ok ? VOL : 0, now, .3);
      sbus.gain.setTargetAtTime(wantOn ? sMul() : 0, now, .25); mbus.gain.setTargetAtTime(wantMus ? mMul() : 0, now, .25);   // v160: tiap saluran punya tombol dan volume sendiri
      if (!ok) { if (!quietAt) quietAt = performance.now(); if (ctx.state === 'running' && performance.now() - quietAt > 2500) ctx.suspend(); return; }
      quietAt = 0;
      if (ctx.state !== 'running') { ctx.resume(); return; }
      const s = scState(); if (!s) return;
      const rec = recipe(s.scene, s.m, s.wx); if (!rec) return;
      if (wantOn) { if (rec.key !== curKey) swap(rec); } else if (cur) { const o = cur; cur = null; curKey = ''; st = { nx: [] }; setTimeout(() => kill(o), 1400); }   // v160: suara adegan mati = tidak dibangun sama sekali (hemat CPU), musik jalan terus
      musChain(); if (cur) sched(ctx, cur, now, now + 1.6, st, live, MS.dk); musTick(now, s, rec);   // v159: ducking lewat saluran musik; pemutar lagu
    } catch (e) { /* suara gagal: header tetap jalan tanpa suara */ }
  }
  const ICON_ON = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 9h10.5a2.75 2.75 0 1 0-2.75-2.75\"/><path d=\"M3 13.5h14.5a2.75 2.75 0 1 1-2.75 2.75\"/><path d=\"M3 18h6\"/></svg>';   // v160: suara adegan = angin (lingkungan)
  const ICON_OFF = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><g stroke-opacity=\".5\" fill-opacity=\".5\"><path d=\"M3 9h10.5a2.75 2.75 0 1 0-2.75-2.75\"/><path d=\"M3 13.5h14.5a2.75 2.75 0 1 1-2.75 2.75\"/><path d=\"M3 18h6\"/></g><path d=\"M3 3l18 18\" stroke-width=\"2.6\"/></svg>';
  const ICON_MUS_ON = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 17.5V5.5l11-2.2v12\"/><path d=\"M9 9.6l11-2.2\"/><circle cx=\"6.2\" cy=\"17.5\" r=\"2.8\" fill=\"currentColor\"/><circle cx=\"17.2\" cy=\"15.3\" r=\"2.8\" fill=\"currentColor\"/></svg>';   // v160: musik = not balok
  const ICON_MUS_OFF = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><g stroke-opacity=\".5\" fill-opacity=\".5\"><path d=\"M9 17.5V5.5l11-2.2v12\"/><path d=\"M9 9.6l11-2.2\"/><circle cx=\"6.2\" cy=\"17.5\" r=\"2.8\" fill=\"currentColor\"/><circle cx=\"17.2\" cy=\"15.3\" r=\"2.8\" fill=\"currentColor\"/></g><path d=\"M3 3l18 18\" stroke-width=\"2.6\"/></svg>';
  const ICON_MIX = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 7h9M18 7h2M4 17h3M12 17h8\"/><circle cx=\"15.5\" cy=\"7\" r=\"2.3\"/><circle cx=\"9.5\" cy=\"17\" r=\"2.3\"/></svg>';
  let btnM = null;
  function paintM() { if (!btnM) return; btnM.hidden = false; btnM.setAttribute('aria-pressed', wantMus ? 'true' : 'false'); const t = wantMus ? 'Musik: menyala. Ketuk untuk mematikan musik saja' : 'Musik: mati. Ketuk untuk menyalakan musik'; btnM.setAttribute('aria-label', t); btnM.title = t; btnM.innerHTML = wantMus ? ICON_MUS_ON : ICON_MUS_OFF; }
  function setMus(v) {
    wantMus = !!v; lsSet(SKM, wantMus ? '1' : '0');
    if (wantMus) { if (!ensure()) { wantMus = false; lsSet(SKM, '0'); try { toast('Peramban ini tidak mendukung suara.'); } catch (e) { /* tanpa toast */ } } else if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) { /* abaikan */ } } }
    paintM(); tick();
  }
  function paint() { paintM(); paintX(); if (!btn) return; btn.setAttribute('aria-pressed', wantOn ? 'true' : 'false'); const t = wantOn ? 'Suara adegan: menyala. Ketuk untuk mematikan suara adegan saja (musik tidak ikut)' : 'Suara adegan: mati. Ketuk untuk menyalakan suara adegan'; btn.setAttribute('aria-label', t); btn.title = t; btn.innerHTML = wantOn ? ICON_ON : ICON_OFF; }
  /* ---- v160: pengatur volume (dua penggeser). Suara adegan 70 / musik 30 = bawaan; tersimpan. ---- */
  const sMul = () => vS / 100 * MXCS, mMul = () => vM / 100 * MXCM;
  let btnX = null, pan = null, panT = 0;
  function paintX() {
    if (btnX) { const o = !!(pan && !pan.hidden), t = 'Atur volume: suara adegan ' + vS + '%, musik ' + vM + '%'; btnX.setAttribute('aria-expanded', o ? 'true' : 'false'); btnX.setAttribute('aria-label', t); btnX.title = t; btnX.innerHTML = ICON_MIX; }
    if (pan) { const a = pan.querySelector('[data-k=\"s\"]'), b = pan.querySelector('[data-k=\"m\"]'); if (a) { a.value = vS; a.setAttribute('aria-valuetext', vS + ' persen'); } if (b) { b.value = vM; b.setAttribute('aria-valuetext', vM + ' persen'); } const sv = pan.querySelector('[data-v=\"s\"]'), mv = pan.querySelector('[data-v=\"m\"]'); if (sv) sv.textContent = vS + '%'; if (mv) mv.textContent = vM + '%'; }
  }
  function applyMix() { if (!ctx || !sbus) return; const now = ctx.currentTime; sbus.gain.setTargetAtTime(wantOn ? sMul() : 0, now, .06); mbus.gain.setTargetAtTime(wantMus ? mMul() : 0, now, .06); }
  function setVol(k, v, quiet) {
    v = Math.max(0, Math.min(100, Math.round(+v) || 0));
    if (k === 's') { vS = v; lsSet(SKVS, String(v)); if (v > 0 && !wantOn && !quiet) setOn(true); } else { vM = v; lsSet(SKVM, String(v)); if (v > 0 && !wantMus && !quiet) setMus(true); }
    paintX(); applyMix(); tick();
  }
  function closeMix() { if (!pan || pan.hidden) return; pan.hidden = true; clearTimeout(panT); paintX(); }
  function holdMix() { clearTimeout(panT); panT = setTimeout(closeMix, 9000); }
  function toggleMix() { if (!pan) return; if (pan.hidden) { pan.hidden = false; paintX(); holdMix(); } else closeMix(); }
  function buildMix(sky) {
    btnX = document.createElement('button'); btnX.type = 'button'; btnX.className = 'mixbtn'; btnX.addEventListener('click', e => { e.stopPropagation(); toggleMix(); }); sky.appendChild(btnX);
    pan = document.createElement('div'); pan.className = 'mixpan'; pan.hidden = true; pan.setAttribute('role', 'group'); pan.setAttribute('aria-label', 'Volume suara'); pan.tabIndex = -1;   // tabindex: ketukan di panel tidak dihitung sebagai ketukan header
    pan.innerHTML = '<div class=\"mxt\">Campuran suara</div>'
      + '<label class=\"mxr\"><span class=\"mxi\">' + ICON_ON + '</span><span class=\"mxn\">Suara adegan</span><span class=\"mxv\" data-v=\"s\"></span><input type=\"range\" min=\"0\" max=\"100\" step=\"1\" data-k=\"s\" aria-label=\"Volume suara adegan\"></label>'
      + '<label class=\"mxr\"><span class=\"mxi\">' + ICON_MUS_ON + '</span><span class=\"mxn\">Musik</span><span class=\"mxv\" data-v=\"m\"></span><input type=\"range\" min=\"0\" max=\"100\" step=\"1\" data-k=\"m\" aria-label=\"Volume musik\"></label>'
      + '<button type=\"button\" class=\"mxz\">Atur ulang 70 / 30</button>';
    pan.addEventListener('input', e => { const t = e.target; if (t && t.dataset && t.dataset.k) { setVol(t.dataset.k, t.value); holdMix(); } });
    pan.querySelector('.mxz').addEventListener('click', e => { e.stopPropagation(); setVol('s', MX0.s, true); setVol('m', MX0.m, true); holdMix(); try { toast('Campuran diatur ulang: suara adegan 70, musik 30.'); } catch (e2) { /* tanpa toast */ } });
    ['click', 'pointerdown'].forEach(ev => pan.addEventListener(ev, e => e.stopPropagation()));
    sky.appendChild(pan); paintX();
  }
  document.addEventListener('pointerdown', e => { if (pan && !pan.hidden && !pan.contains(e.target) && !(btnX && btnX.contains(e.target))) closeMix(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMix(); });
  function setOn(v) {
    wantOn = !!v; lsSet(SK, wantOn ? '1' : '0');
    if (wantOn) { if (!ensure()) { wantOn = false; lsSet(SK, '0'); try { toast('Peramban ini tidak mendukung suara.'); } catch (e) { /* tanpa toast */ } } else if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) { /* abaikan */ } } }
    paint(); tick();
  }
  function ensureBtn() {
    const sky = document.getElementById('hxSky'); if (!sky || typeof curView === 'undefined' || curView !== 'home') return;
    if (btn && btn.isConnected && btn.parentNode === sky && btnM && btnM.isConnected && btnX && btnX.isConnected && pan && pan.isConnected) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sndbtn'; btn.addEventListener('click', e => { e.stopPropagation(); setOn(!wantOn); try { toast(wantOn ? 'Suara adegan menyala.' : 'Suara adegan mati. Musik tidak terpengaruh.'); } catch (e2) { /* tanpa toast */ } });
    sky.appendChild(btn);
    btnM = document.createElement('button'); btnM.type = 'button'; btnM.className = 'musbtn'; btnM.addEventListener('click', e => { e.stopPropagation(); setMus(!wantMus); try { toast(wantMus ? 'Musik menyala.' : 'Musik mati. Suara adegan tetap.'); } catch (e2) { /* tanpa toast */ } }); sky.appendChild(btnM); buildMix(sky); paint();
  }
  function kick() { if ((wantOn || wantMus) && skyOn() && !ctx && ensure()) { try { ctx.resume(); } catch (e) { /* abaikan */ } } }   // pilihan tersimpan MENYALA: mulai di ketukan pertama (aturan peramban)
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, kick, true));
  document.addEventListener('visibilitychange', tick);
  document.addEventListener('dl:skyfocus', () => { kick(); if (ctx && (wantOn || wantMus) && skyOn()) { try { ctx.resume(); } catch (e) { /* abaikan */ } } if (!skyOn()) closeMix(); tick(); });
  tmr = setInterval(tick, 400);
  window.DL = Object.freeze(Object.assign({}, window.DL, { snd: Object.freeze({ on: () => wantOn, set: setOn, musOn: () => wantMus, setMus, vol: () => ({ s: vS, m: vM, sg: +sMul().toFixed(4), mg: +mMul().toFixed(4), defS: MX0.s, defM: MX0.m, cs: MXCS, cm: MXCM }), setVol, mixOpen: () => !!(pan && !pan.hidden), tap: () => { if (!ctx || !master || !master.cp) return null; const a = ctx.createAnalyser(); a.fftSize = 2048; master.cp.connect(a); return a; }, toggle: () => setOn(!wantOn), tick, recipe, render, renderMix, musKeys: () => Object.keys(MUS), mus: MUSAPI, SND, EV: Object.keys(EV), scenes: () => Object.keys(SND), ctxMade: () => made, state: () => ({ mus: MUSAPI.state(), ev: evN, on: wantOn, ctx: ctx ? ctx.state : 'none', gain: master ? +master.gain.value.toFixed(3) : 0, key: curKey, btn: !!(btn && btn.isConnected), made }), VOL, CAL }) }));
})();
