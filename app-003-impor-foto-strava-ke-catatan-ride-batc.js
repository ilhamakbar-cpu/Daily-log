/* ===== MODUL: IMPOR FOTO STRAVA KE CATATAN RIDE (batch 17, langkah 17b-S; menggantikan impor GPX) ===== */
// Tangkapan layar Strava diperkecil di perangkat lalu dikirim ke Gemini HANYA untuk dibaca (menyalin teks dan angka yang terlihat ke JSON).
// Semua penafsiran (tanggal, satuan, durasi, pemeriksaan wajar) dilakukan LOKAL. Foto tidak disimpan. Hasil tidak pernah tersimpan otomatis:
// ia mengisi form ride + pratinjau yang bisa diedit, dan ride baru tersimpan saat tombol Simpan ride ditekan.
const SV_IMG_MAX = 1800, SV_FILE_MAX = 30 * 1024 * 1024, SV_MIN_KM = 0.1, SV_MAX_KM = 1500, SV_SPD_WARN = 60;
const svSt = { info: null, err: null, busy: false, name: '' };   // hanya di memori
let svTok = 0;
const SV_SYS = 'Kamu membaca tangkapan layar halaman aktivitas Strava (tampilan bahasa Inggris atau Indonesia). Tugasmu HANYA menyalin teks dan angka yang terlihat di gambar ke JSON. ' +
  'Jangan menebak, menghitung, membulatkan, atau melengkapi. Bila sebuah isian tidak terlihat jelas, isi null. Abaikan nama pengguna dan hal lain yang tidak diminta. ' +
  'Balas HANYA satu objek JSON dengan kunci: ' +
  'is_strava (true bila gambar jelas menampilkan ringkasan satu aktivitas olahraga, selain itu false), ' +
  'sport ("ride" untuk sepeda/bike/cycling/ride/gravel/mountain bike/e-bike, atau "run", "walk", "hike", "swim", "other", atau null; lihat ikon dan judul), ' +
  'title (judul aktivitas, teks tebal besar di atas kotak statistik), ' +
  'when_text (teks tanggal dan jam persis seperti tertulis di bawah nama pengguna, mis. "Yesterday at 6:16 AM" atau "October 12, 2026 at 6:16 AM"; salin apa adanya, jangan diubah menjadi tanggal lain), ' +
  'location (teks lokasi di baris yang sama setelah tanda titik tengah, bila ada), ' +
  'distance (angka jarak, mis. 14.54) dan distance_unit ("km" atau "mi"), ' +
  'moving_time (teks persis seperti tertulis, mis. "53:13" atau "1:02:45"), elapsed_time (sama, bila ada), ' +
  'avg_speed (angka) dan speed_unit ("km/h" atau "mph"), max_speed (angka, bila ada), ' +
  'elevation (angka Elevation Gain atau Elevasi) dan elevation_unit ("m" atau "ft"), ' +
  'avg_power (watt, angka), calories (angka), avg_hr (detak jantung rata-rata, angka), max_hr (detak jantung maksimum, angka), ' +
  'note (satu kalimat bila ada bagian yang terpotong, buram, atau meragukan, selain itu null). Angka ditulis sebagai angka JSON dengan titik desimal.';
const SV_USER = 'Salin data dari tangkapan layar Strava terlampir ke JSON.';
const SV_MON = { jan: 1, january: 1, januari: 1, feb: 2, february: 2, februari: 2, mar: 3, march: 3, maret: 3, apr: 4, april: 4, may: 5, mei: 5, jun: 6, june: 6, juni: 6, jul: 7, july: 7, juli: 7,
  aug: 8, august: 8, agu: 8, agt: 8, agustus: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, okt: 10, oktober: 10, nov: 11, november: 11, dec: 12, december: 12, des: 12, desember: 12 };
const SV_DOW = { sunday: 0, sun: 0, minggu: 0, ahad: 0, monday: 1, mon: 1, senin: 1, tuesday: 2, tue: 2, tues: 2, selasa: 2, wednesday: 3, wed: 3, rabu: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4, kamis: 4, friday: 5, fri: 5, jumat: 5, saturday: 6, sat: 6, sabtu: 6 };
const SV_RIDE_SPORTS = ['ride', 'cycling', 'bike', 'biking'];
function svYmdDate(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function svValidYmd(s) { const d = svYmdDate(s); return !!d && ymd(d) === s; }
function svAddDays(s, n) { const d = svYmdDate(s); d.setDate(d.getDate() + n); return ymd(d); }
function svMk(y, m, d) { const dt = new Date(y, m - 1, d); return (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) ? ymd(dt) : null; }
// Angka dari AI: biasanya angka JSON; bila teks, satuan dibuang dan koma desimal/ribuan ditangani. int = bulatkan ke bilangan bulat.
function svNum(v, int) {
  if (v == null || typeof v === 'boolean') return null;
  let x;
  if (typeof v === 'number') x = v;
  else {
    let s = String(v).trim().replace(/\s/g, '').replace(/[^0-9.,\-]/g, '');
    if (!/\d/.test(s)) return null;
    if (/^-?\d{1,3}([.,]\d{3})+$/.test(s) && int) s = s.replace(/[.,]/g, '');
    else if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (s.includes(',')) s = s.replace(',', '.');
    x = Number(s);
  }
  if (!Number.isFinite(x)) return null;
  return int ? Math.round(x) : x;
}
// Durasi dari teks seperti "53:13" (menit:detik), "1:02:45", "1h 2m 45s", "53m 13s", "1 j 02 mnt". Angka murni dianggap tidak jelas satuannya.
function svDur(v) {
  if (v == null || typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (!s) return null;
  let m = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(s); if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];
  m = /^(\d{1,3}):([0-5]\d)$/.exec(s); if (m) return +m[1] * 60 + +m[2];
  const h = /(\d+)\s*(?:h|j|jam|hrs?|hours?)(?![a-z])/.exec(s), mi = /(\d+)\s*(?:m|mnt|menit|min|mins|minutes?)(?![a-z])/.exec(s), se = /(\d+)\s*(?:s|dtk|detik|secs?|seconds?)(?![a-z])/.exec(s);
  if (h || mi || se) return (h ? +h[1] : 0) * 3600 + (mi ? +mi[1] : 0) * 60 + (se ? +se[1] : 0);
  return null;
}
// Teks tanggal/jam Strava -> {date, time, kind}. ref = tanggal acuan 'YYYY-MM-DD' (hari tangkapan layar diambil). kind: today, yesterday, weekday, abs, abs-noyear, null.
function svWhen(text, ref) {
  const out = { date: null, time: null, kind: null };
  const s0 = String(text == null ? '' : text).toLowerCase().replace(/\u00a0/g, ' ').trim();
  if (!s0) return out;
  const s = s0.replace(/[,]/g, ' ').replace(/\s+/g, ' ');
  let tm = /(?:^|[^\d])(\d{1,2}):(\d{2})\s*([ap])\.?m?\.?(?![a-z])/.exec(s), ap = null;
  if (tm) ap = tm[3];
  else { tm = /(?:^|[^\d])(\d{1,2}):(\d{2})(?!\d)/.exec(s) || /(?:pukul|jam|at|@)\s*(\d{1,2})\.(\d{2})(?!\d)/.exec(s); }
  if (tm) {
    let h = +tm[1]; const mi = +tm[2];
    if (ap) { if (h < 1 || h > 12) h = -1; else h = (h % 12) + (ap === 'p' ? 12 : 0); }
    if (h >= 0 && h < 24 && mi < 60) out.time = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  }
  const R = svValidYmd(ref) ? ref : today();
  const ry = +R.slice(0, 4);
  if (/\b(today|hari ini)\b/.test(s)) { out.date = R; out.kind = 'today'; return out; }
  if (/\b(yesterday|kemarin)\b/.test(s)) { out.date = svAddDays(R, -1); out.kind = 'yesterday'; return out; }
  let m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(s);
  if (m) { out.date = svMk(+m[1], +m[2], +m[3]); out.kind = out.date ? 'abs' : null; return out; }
  const fin = (y, mo, d) => {
    const noYear = y == null;
    let dt = svMk(noYear ? ry : y, mo, d);
    if (dt && noYear && dt > R) dt = svMk(ry - 1, mo, d);
    out.date = dt; out.kind = dt ? (noYear ? 'abs-noyear' : 'abs') : null;
  };
  m = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})\.?(?:\s+(\d{4}))?(?![\d:])/.exec(s);
  if (m && SV_MON[m[2]]) { fin(m[3] ? +m[3] : null, SV_MON[m[2]], +m[1]); return out; }
  m = /\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?![\d:])(?:\s+(\d{4}))?/.exec(s);
  if (m && SV_MON[m[1]]) { fin(m[3] ? +m[3] : null, SV_MON[m[1]], +m[2]); return out; }
  m = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/.exec(s);
  if (m) {
    const a = +m[1], b = +m[2], y = +m[3];
    if (a > 12 && b <= 12) { out.date = svMk(y, b, a); out.kind = out.date ? 'abs' : null; }
    else if (b > 12 && a <= 12) { out.date = svMk(y, a, b); out.kind = out.date ? 'abs' : null; }
    return out;   // keduanya <= 12: tidak jelas dd/mm atau mm/dd, dibiarkan kosong
  }
  const w = /\b([a-z]{3,9})\b/g; let wm;
  while ((wm = w.exec(s))) {
    if (Object.prototype.hasOwnProperty.call(SV_DOW, wm[1])) {
      const rd = svYmdDate(R).getDay(), diff = ((rd - SV_DOW[wm[1]] + 7) % 7) || 7;
      out.date = svAddDays(R, -diff); out.kind = 'weekday'; return out;
    }
  }
  return out;
}
function svRef(lm) {   // tanggal acuan untuk teks relatif ("Yesterday"): hari berkas foto dibuat/diubah bila masuk akal, jika tidak hari ini
  const t = today(), n = Number(lm);
  if (!Number.isFinite(n) || n <= 0) return { d: t, from: 'today' };
  const d = ymd(new Date(n));
  if (d > t) return { d: t, from: 'today' };
  return { d, from: d === t ? 'today' : 'file' };
}
function svCols(r) {   // kolom opsional ride dari foto Strava (dipakai tclean); data lama tanpa kolom ini tidak ditambah apa pun
  const o = {}, rg = (k, lo, hi) => { const x = r[k], v = (x == null || x === '') ? NaN : Number(x); if (Number.isFinite(v) && v >= lo && v <= hi) o[k] = Math.round(v); };
  rg('cd', 30, 200); rg('cb', 0, 500); rg('el', 0, 20000); rg('pw', 0, 2500); rg('kc', 0, 20000); rg('hr', 30, 250); rg('hx', 30, 250);
  // q5a: kram (0-3), elektrolit (0/1), air minum ml (0-10000); angka atau teks angka polos saja; kolom opsional, data lama tanpa kolom ini tidak ditambah apa pun
  const q5 = k => { const x = r[k]; return typeof x === 'number' ? x : (typeof x === 'string' && /^\s*\d+(\.\d+)?\s*$/.test(x)) ? Number(x) : NaN; };
  // q5c: air ml dalam teks dengan pemisah ribuan SAH (kelompok tepat 3 digit, kelompok pertama 1-3 digit tanpa nol di depan, satu jenis pemisah) = bilangan bulat ("1.500" = 1500, bukan 1,5); selain itu sama dengan q5a
  const q5ml = x => { if (typeof x === 'string') { const t = x.trim(); if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(t) || /^[1-9]\d{0,2}(,\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, '')); } return q5('ml'); };
  { const a = q5('kr'); if (Number.isInteger(a) && a >= 0 && a <= 3) o.kr = a; const b = q5('lt'); if (Number.isInteger(b) && b >= 0 && b <= 1) o.lt = b; const c = q5ml(r.ml); if (Number.isFinite(c) && c >= 0 && c <= 10000) o.ml = Math.round(c); }
  if (typeof r.st === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.st)) o.st = r.st;
  if (typeof r.sv === 'string' && /^\d{4}-\d{2}-\d{2}[ |][0-9:.]{1,8}$/.test(r.sv)) o.sv = r.sv;
  if (typeof r.rt === 'string' && b61Ok(r.rt)) o.rt = r.rt;   // tahap 61a: rute ride
  return o;
}
function svFail(code, msg, name) { svSt.busy = false; svSt.err = { code, msg, name: String(name || '').slice(0, 60) }; svPaint(); toast('Foto tidak bisa dipakai. Alasannya ada di bawah tombol impor.'); return { ok: false, code, msg }; }
function svFailR(code, msg) { return { ok: false, code, msg }; }
// Mengubah JSON dari AI menjadi info ride yang sudah divalidasi. ctx = {ref: 'YYYY-MM-DD', refFrom: 'today'|'file'}. Tidak melempar error.
function svParse(data, ctx) {
  ctx = ctx || {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return svFailR('badjson', 'Balasan AI tidak berbentuk data yang bisa dipakai. Coba lagi, atau isi form secara manual.');
  const d = data, warns = [], str = (v, n) => (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const lc = v => String(v == null ? '' : v).trim().toLowerCase();
  let km = svNum(d.distance), du = lc(d.distance_unit);
  const secDur = svDur(typeof d.moving_time === 'string' ? d.moving_time : null);
  if (d.is_strava === false || (km == null && secDur == null)) {
    return svFailR('notstrava', 'Foto ini tidak terbaca sebagai ringkasan aktivitas Strava (jarak dan waktu bergerak tidak ditemukan). Pakai tangkapan layar halaman aktivitas yang menampilkan Distance dan Moving Time.');
  }
  if (km == null) return svFailR('nodist', 'Jarak (Distance) tidak terbaca dari foto. Pakai tangkapan layar yang menampilkan jarak dengan jelas.');
  if (du === 'mi' || du === 'mile' || du === 'miles') km *= 1.609344;
  else if (du && du !== 'km' && du !== 'kilometer' && du !== 'kilometers') warns.push('Satuan jarak di foto (' + str(d.distance_unit, 12) + ') tidak dikenali; dianggap km. Periksa jaraknya.');
  if (!(km >= SV_MIN_KM)) return svFailR('short', 'Jarak di foto hanya ' + fmt(km, 2) + ' km (di bawah ' + fmt(SV_MIN_KM, 1) + ' km). Periksa fotonya.');
  if (km > SV_MAX_KM) return svFailR('far', 'Jarak di foto ' + fmt(km, 0) + ' km tidak masuk akal untuk satu ride. Periksa fotonya.');
  km = Math.round(km * 100) / 100;
  let sec = (secDur != null && secDur > 0) ? secDur : null;
  if (sec == null) warns.push('Waktu bergerak (Moving Time) tidak terbaca dari foto, jadi durasi dikosongkan. Isi durasi sendiri.');
  const calc = sec ? (km / (sec / 3600)) : null;
  let spdP = svNum(d.avg_speed), su = lc(d.speed_unit);
  if (spdP != null && (su === 'mph' || su === 'mi/h')) spdP *= 1.609344;
  let spd = null;
  if (spdP != null && spdP > 0) {
    if (calc != null && Math.abs(spdP - calc) > Math.max(0.4, calc * 0.03)) {
      warns.push('Speed di foto (' + fmt(spdP, 1) + ' km/jam) tidak cocok dengan jarak ÷ waktu bergerak (' + fmt(calc, 1) + ' km/jam). Dipakai hasil hitungan; periksa jarak dan waktu.');
    } else spd = Math.round(spdP * 10) / 10;
  }
  if (spd == null && calc != null) spd = Math.round(calc * 10) / 10;
  if (spd != null && spd > SV_SPD_WARN) warns.push('Speed rata-rata ' + fmt(spd, 1) + ' km/jam terlalu tinggi untuk sepeda. Mungkin ini bukan ride sepeda atau ada angka yang salah baca.');
  let el = svNum(d.elevation, true), eu = lc(d.elevation_unit);
  if (el != null && (eu === 'ft' || eu === 'feet' || eu === 'foot')) el = Math.round(el * 0.3048);
  const chk = (v, lo, hi, label) => { if (v == null) return null; if (v < lo || v > hi) { warns.push(label + ' di foto (' + v + ') di luar batas wajar, jadi dikosongkan.'); return null; } return v; };
  el = chk(el, 0, 20000, 'Elevasi');
  const pw = chk(svNum(d.avg_power, true), 0, 2500, 'Daya rata-rata');
  const kc = chk(svNum(d.calories, true), 0, 20000, 'Kalori');
  let hr = chk(svNum(d.avg_hr, true), 30, 250, 'Detak jantung rata-rata'), hx = chk(svNum(d.max_hr, true), 30, 250, 'Detak jantung maksimum');
  if (hr != null && hx != null && hx < hr) { warns.push('Detak jantung maksimum (' + hx + ') lebih kecil dari rata-rata (' + hr + '), jadi keduanya dikosongkan. Periksa fotonya.'); hr = null; hx = null; }
  const sport = lc(d.sport);
  if (sport && !SV_RIDE_SPORTS.includes(sport) && sport !== 'null') warns.push('Aktivitas di foto tampaknya bukan bersepeda (' + str(d.sport, 20) + '). Ini hanya dicatat sebagai ride bila kamu menyimpannya.');
  const ref = svValidYmd(ctx.ref) ? ctx.ref : today();
  const w = svWhen(typeof d.when_text === 'string' ? d.when_text : '', ref);
  let date = w.date;
  if (date && date > today()) { warns.push('Tanggal di foto (' + date + ') ada di masa depan, jadi diganti hari ini. Ubah bila perlu.'); date = today(); }
  if (date && date < '2000-01-01') date = null;
  const title = str(d.title, 80), loc = str(d.location, 70), note = str(d.note, 140);
  if (note) warns.push('Catatan pembaca foto: ' + note);
  const noteTxt = [title, loc].filter(Boolean).join(' · ').slice(0, 200);
  return { ok: true, info: {
    km, sec, min: sec ? Math.max(1, Math.round(sec / 60)) : null, spd, spdPhoto: spdP != null ? Math.round(spdP * 10) / 10 : null, el, pw, kc, hr, hx, title, loc, sport: sport || null,
    whenText: str(d.when_text, 60), kind: w.kind, date, time: w.time, ref, refFrom: ctx.refFrom || 'today', name: String(ctx.name || '').slice(0, 60), noteTxt, warns,
    ed: { date: date || today(), st: w.time || '', el: el == null ? '' : String(el), pw: pw == null ? '' : String(pw), kc: kc == null ? '' : String(kc), hr: hr == null ? '' : String(hr), hx: hx == null ? '' : String(hx) }
  } };
}
function svReset() { svTok++; if (svSt.busy) AI.cancel(); svSt.busy = false; svSt.info = null; svSt.err = null; svSt.name = ''; }
function svApply(info) {   // mengisi form ride (tidak menyimpan apa pun)
  rideForm.km = String(info.km);
  rideForm.min = info.min != null ? String(info.min) : '';
  rideForm.spd = (info.spd != null && info.sec) ? String(info.spd) : '';
  if (info.noteTxt && !String(rideForm.note || '').trim()) rideForm.note = info.noteTxt;
  svSt.info = info; svSt.err = null; svSt.busy = false;
}
function svPaint() { if (curView === 'train' && trainTab === 'bike') renderTrain(); }
function svDup(key) {   // tanggal ride yang sudah punya penanda impor sama, atau null
  const ds = Object.keys(tdb);
  for (let i = 0; i < ds.length; i++) if (tdb[ds[i]].rides.some(r => r.sv === key)) return ds[i];
  return null;
}
// Memeriksa isian pratinjau saat Simpan ride. Hasil: {err} atau {date, key, cols}.
function svExtras(info) {
  const e = info.ed || {}, t = today();
  if (!svValidYmd(e.date)) return { err: 'Tanggal ride tidak valid. Pilih tanggalnya di bagian impor foto.' };
  if (e.date > t) return { err: 'Tanggal ride tidak boleh di masa depan.' };
  if (e.date < '2000-01-01') return { err: 'Tanggal ride terlalu lama. Periksa tanggalnya.' };
  const st = String(e.st || '').trim();
  if (st && !/^([01]\d|2[0-3]):[0-5]\d$/.test(st)) return { err: 'Jam mulai tidak valid. Pakai format 24 jam, mis. 06:16.' };
  const cols = {}, spec = [['el', 0, 20000, 'Naik'], ['pw', 0, 2500, 'Daya'], ['kc', 0, 20000, 'Kalori'], ['hr', 30, 250, 'HR rata-rata'], ['hx', 30, 250, 'HR maksimum']];
  for (const [k, lo, hi, lbl] of spec) {
    const raw = String(e[k] == null ? '' : e[k]).trim();
    if (!raw) continue;
    const v = Number(raw);
    if (!Number.isFinite(v) || v < lo || v > hi) return { err: lbl + ' harus antara ' + lo + ' dan ' + hi + ', atau kosongkan.' };
    cols[k] = Math.round(v);
  }
  if (cols.hr != null && cols.hx != null && cols.hx < cols.hr) return { err: 'HR maksimum tidak boleh lebih kecil dari HR rata-rata.' };
  if (st) cols.st = st;
  const kmv = num(rideForm.km);
  const key = e.date + (st ? ' ' + st : '|' + (kmv == null ? '0' : fmt(kmv, 2).replace(',', '.')));
  cols.sv = key.slice(0, 24);
  return { date: e.date, key: cols.sv, cols };
}
function svParts(r) {   // keterangan tambahan di daftar ride terakhir
  const p = [];
  if (r.st) p.push('mulai ' + r.st.replace(':', '.'));
  if (r.el != null) p.push('naik ' + r.el + ' m');
  if (r.pw != null) p.push(r.pw + ' W');
  if (r.kc != null) p.push(r.kc + ' kkal');
  if (r.hr != null) p.push('HR ' + r.hr + (r.hx != null ? '/' + r.hx : ''));
  if (r.sv) p.push('dari foto Strava');
  return p;
}
function svDurTxt(sec) {
  const tm = Math.floor(sec / 60), s = Math.round(sec % 60), h = Math.floor(tm / 60), m = tm % 60;
  return h ? h + ' j ' + m + ' mnt' : tm + ' mnt' + (s ? ' ' + s + ' dtk' : '');
}
function svWhenNote(i) {
  const q = i.whenText ? '“' + esc(i.whenText) + '”' : '';
  if (!i.date && !i.whenText) return 'Tanggal tidak terbaca dari foto, jadi diisi hari ini. Ubah bila perlu.';
  if (!i.date) return 'Teks tanggal di foto ' + q + ' tidak bisa dipastikan, jadi diisi hari ini. Ubah bila perlu.';
  if (i.kind === 'today' || i.kind === 'yesterday' || i.kind === 'weekday')
    return 'Foto menulis ' + q + '. Dihitung dari ' + (i.refFrom === 'file' ? 'tanggal berkas foto' : 'hari ini') + ' (' + esc(dayShort(i.ref)) + ')' + (i.kind === 'weekday' ? ' dengan menebak hari terakhir yang cocok' : '') + '. Ubah bila salah.';
  if (i.kind === 'abs-noyear') return 'Foto menulis ' + q + ' tanpa tahun; dipakai tahun terdekat yang masuk akal. Ubah bila salah.';
  return 'Tanggal dibaca langsung dari foto (' + q + ').';
}
function svHTML() {
  const i = svSt.info, e = svSt.err;
  let h = '<div class="b17s"><button class="btn sm ghost b17sb" data-q="svPick"' + (svSt.busy ? ' disabled' : '') + '>Impor dari foto Strava</button>' +
    '<input type="file" id="svFile" accept="image/*" hidden aria-label="Pilih tangkapan layar Strava">' +
    '<p class="note b17sn">Pilih tangkapan layar ride dari Strava. AI membaca angkanya dan mengisi form di bawah; kamu bisa memeriksa dan mengedit sebelum menyimpan. Foto dikirim ke Gemini hanya untuk dibaca, tidak disimpan di aplikasi ini.</p>';
  if (svSt.busy) h += '<div class="b17sbusy" id="svBusy" role="status"><b>✦ Membaca foto…</b>' + (svSt.name ? ' <small>' + esc(svSt.name) + '</small>' : '') + '<p class="note">Biasanya 5 sampai 20 detik. Tidak ada yang berubah di datamu.</p><button class="btn sm ghost b17sb" data-q="svCancel">Batal</button></div>';
  if (e) h += '<div class="b17serr" id="svErr" role="alert"><b>Foto tidak bisa dipakai</b>' + (e.name ? ' <small>' + esc(e.name) + '</small>' : '') + '<p>' + esc(e.msg) + '</p><div class="b17sr">' +
    (['off', 'nokey', 'noproxy', 'auth', 'model'].includes(e.code) ? '<button class="btn sm primary b17sb" data-q="svSettings">Buka pengaturan AI</button>' : '') +
    '<button class="btn sm ghost b17sb" data-q="svErrX">Tutup</button></div></div>';
  if (i) {
    const ed = i.ed || {}, cell = (l, v) => '<div><small>' + l + '</small><b>' + esc(v) + '</b></div>';
    const fld = (k, lbl, u, extra) => '<div><div class="sublbl t0">' + lbl + '</div><label class="inp"><input ' + (extra || 'inputmode="numeric" autocomplete="off"') + ' data-sv="' + k + '" value="' + esc(ed[k] == null ? '' : ed[k]) + '" aria-label="' + esc(lbl) + '">' + (u ? '<span class="u">' + u + '</span>' : '') + '</label></div>';
    h += '<div class="b17sp" id="svInfo"><b>Foto Strava terbaca</b>' + (i.title ? ' <small>' + esc(i.title) + '</small>' : '') +
      '<div class="b17sg">' + cell('Jarak', fmt(i.km, 2) + ' km') + cell('Waktu bergerak', i.sec == null ? '–' : svDurTxt(i.sec)) + cell('Speed', i.spd == null ? '–' : fmt(i.spd, 1) + ' km/jam') +
      '</div>' +
      '<p class="note b17sd">' + svWhenNote(i) + ' Durasi, jarak, speed, dan catatan ada di form di bawah.</p>' +
      '<div class="b17si">' + fld('date', 'Tanggal ride', '', 'type="date" min="2000-01-01" max="' + today() + '"') + fld('st', 'Jam mulai', '', 'inputmode="numeric" autocomplete="off" placeholder="06:16" maxlength="5"') +
      fld('el', 'Naik (elevasi)', 'm') + fld('pw', 'Daya rata-rata', 'W') + fld('kc', 'Kalori', 'kkal') + fld('hr', 'HR rata-rata', 'bpm') + fld('hx', 'HR maksimum', 'bpm') + '</div>' +
      i.warns.map(w => '<p class="note b17sw">' + esc(w) + '</p>').join('') +
      '<div class="b17sr"><button class="btn sm ghost b17sb" data-q="svClear">Batal impor</button></div></div>';
  }
  return h + '</div>';
}
async function svResize(file) {
  let bmp = null, tmp = '', src, w, h;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bmp = null; }
  try {
    if (bmp) { src = bmp; w = bmp.width; h = bmp.height; }
    else {
      tmp = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('bukan gambar')); img.src = tmp; });
      src = img; w = img.naturalWidth; h = img.naturalHeight;
    }
    if (!w || !h) throw new Error('kosong');
    const sc = Math.min(1, SV_IMG_MAX / Math.max(w, h)), cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); cx.drawImage(src, 0, 0, cw, ch);
    const data = cv.toDataURL('image/jpeg', 0.85).split(',')[1];
    if (!data) throw new Error('gagal');
    return { type: 'image/jpeg', data, w: cw, h: ch, kb: Math.max(1, Math.round(data.length * 3 / 4 / 1024)) };
  } finally { if (bmp && bmp.close) bmp.close(); if (tmp) URL.revokeObjectURL(tmp); }
}
async function svRead(file) {
  if (!file || svSt.busy) return;
  const name = String(file.name || '').slice(0, 60);
  if (file.type && !/^image\//.test(file.type)) { svFail('notimg', 'File itu bukan gambar. Pilih tangkapan layar (JPG atau PNG) dari Strava.', name); return; }
  if (file.size > SV_FILE_MAX) { svFail('big', 'Foto terlalu besar (maksimal 30 MB). Pakai tangkapan layar biasa.', name); return; }
  const tok = ++svTok;
  svSt.busy = true; svSt.err = null; svSt.name = name; svPaint();
  let img;
  try { img = await svResize(file); } catch (e) { if (tok === svTok) svFail('img', 'Foto tidak bisa dibaca. Coba tangkapan layar lain (JPG atau PNG).', name); return; }
  if (tok !== svTok) return;
  const rf = svRef(file.lastModified);
  const r = await AI.ask({ task: 'strava', model: aiFastModel(), system: SV_SYS, user: SV_USER, image: { type: img.type, data: img.data }, json: true, max: 900, think: 1024, timeout: 60000 });
  if (tok !== svTok) return;   // dibatalkan atau direset selagi menunggu
  if (r.code === 'cancelled') { svSt.busy = false; svPaint(); return; }
  if (!r.ok) { svFail(r.code, r.msg, name); return; }
  const p = svParse(r.data, { ref: rf.d, refFrom: rf.from, name });
  if (!p.ok) { svFail(p.code, p.msg, name); return; }
  svApply(p.info); toast('Foto terbaca. Periksa isian lalu simpan ride.'); svPaint();
}
QACT.svPick = () => {
  if (svSt.busy) return;
  const rd = AI.ready();
  if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  const f = $('#svFile'); if (f) f.click();
};
QACT.svCancel = () => { if (!svSt.busy) return; svTok++; AI.cancel(); svSt.busy = false; toast('Dibatalkan. Tidak ada yang berubah.'); svPaint(); };
QACT.svErrX = () => { svSt.err = null; svPaint(); };
QACT.svSettings = () => aiOpenSettings();
QACT.svClear = () => { svReset(); rideForm.min = ''; rideForm.km = ''; rideForm.spd = ''; svPaint(); };
document.addEventListener('change', ev => {
  const el = ev.target;
  if (!el || el.id !== 'svFile') return;
  const f = el.files && el.files[0];
  el.value = '';
  if (f) svRead(f);
});
document.addEventListener('input', ev => {
  const el = ev.target, k = el && el.dataset && el.dataset.sv;
  if (!k || !svSt.info) return;
  let v = el.value;
  if (k === 'st') { const dg = v.replace(/[^0-9]/g, '').slice(0, 4), c = dg.length > 2 ? dg.slice(0, 2) + ':' + dg.slice(2) : dg; if (c !== v) { el.value = c; v = c; } }
  if (['el', 'pw', 'kc', 'hr', 'hx'].includes(k)) { const c = v.replace(/[^0-9]/g, ''); if (c !== v) { el.value = c; v = c; } }
  svSt.info.ed[k] = v;
});
/* ===== MODUL: LOG HARIAN DATA STRAVA (batch 17, tahap J) ===== */
// Menampilkan data ride (termasuk yang dibaca dari foto Strava: kalori, naik, daya, HR, jam mulai) di Jurnal > Hari ini, Riwayat, dan konteks AI.
// Modul ini hanya MEMBACA tdb/db. Ia tidak menulis ke data apa pun dan tidak mengubah target kalori.
let jrLast = null;   // HTML kartu terakhir (supaya kotak isian tidak digambar ulang tiap ketikan)
const jrRides = d => { const t = tdb[d]; return t && Array.isArray(t.rides) ? t.rides : []; };
const jrSum = (rides, k) => rides.reduce((a, r) => a + (r[k] != null ? r[k] : 0), 0);
function jrKcalOf(d) {   // total kalori terbakar dari semua ride tanggal d; null bila tidak ada satu pun ride berkalori
  const w = jrRides(d).filter(r => r.kc != null);
  return w.length ? jrSum(w, 'kc') : null;
}
function jrPart(d) {   // {n, m} bila hari d punya >1 ride dan hanya sebagian (n dari m) yang berkalori; selain itu null
  const rd = jrRides(d), n = rd.filter(r => r.kc != null).length;
  return rd.length > 1 && n > 0 && n < rd.length ? { n, m: rd.length } : null;
}
function jrPartNote(d) {
  const p = jrPart(d);
  return p ? '<p class="note jrx jrp">Hanya ' + p.n + ' dari ' + p.m + ' ride yang punya kalori; ride lain tidak terhitung, jadi total di atas bisa kurang dari sebenarnya.</p>' : '';
}
function jrCells(r) {   // pasangan [label, nilai] yang HANYA memuat isian yang ada
  const c = [];
  if (r.km != null) c.push(['Jarak', fmt(r.km, 2) + ' km']);
  if (r.min != null) c.push(['Durasi', fmt(r.min, 0) + ' mnt']);
  if (r.spd != null) c.push(['Speed rata-rata', fmt(r.spd, 1) + ' km/jam']);
  if (r.el != null) c.push(['Naik', fmt(r.el, 0) + ' m']);
  if (r.pw != null) c.push(['Daya rata-rata', fmt(r.pw, 0) + ' W']);
  if (r.kc != null) c.push(['Kalori', fmt(r.kc, 0) + ' kkal']);
  if (r.hr != null) c.push(['HR rata-rata', fmt(r.hr, 0) + ' bpm']);
  if (r.hx != null) c.push(['HR maksimum', fmt(r.hx, 0) + ' bpm']);
  if (r.rpe != null) c.push(['RPE', String(r.rpe)]);
  // {J2-CELLS}
  return c;
}
function jrHTML(d) {
  const rd = jrRides(d);
  if (!rd.length) return '';
  const list = rd.map(r => {
    const meta = [];
    if (r.st) meta.push('mulai ' + r.st.replace(':', '.'));
    if (r.sv) meta.push('dari foto Strava');
    const cells = jrCells(r);
    return '<div class="jr"><div class="jrh"><b>' + esc(RIDE_NAME(r.type)) + '</b>' + (meta.length ? '<small>' + esc(meta.join(' · ')) + '</small>' : '') + '</div>' +
      (r.note ? '<p class="jrn">' + esc(r.note) + '</p>' : '') +
      (cells.length ? '<div class="jrg">' + cells.map(x => '<div><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b></div>').join('') + '</div>' : '<p class="note">Tanpa angka.</p>') + '</div>';
  }).join('');
  const kc = jrKcalOf(d), e = db[d], eat = e ? num(e.kcal) : null;
  let sum = '';
  if (kc != null) {
    sum = '<div class="jrs"><div><small>Kalori terbakar dari ride (Strava)</small><b>' + fmt(kc, 0) + ' kkal</b></div>' +
      (eat != null ? '<div><small>Masuk − ride</small><b>' + fmt(eat, 0) + ' − ' + fmt(kc, 0) + ' = ' + fmt(eat - kc, 0) + ' kkal</b></div>' : '') + '</div>' +
      jrPartNote(d) + '<p class="note jrx">Perkiraan kasar: Strava menghitung kalori dari data ride, bukan mengukurnya. Target kalori di atas tidak berubah karena ride.</p>';
  }
  return list + sum;
}
function jrPaint() {
  const sec = $('#jrSec'), box = $('#jrBox');
  if (!sec || !box) return;
  const h = jrHTML(cur);
  sec.hidden = !h;
  if (h !== jrLast) { box.innerHTML = h; jrLast = h; }
}
function jrAiBits(r) {   // potongan teks tambahan untuk ringkasan AI (hanya yang ada isinya; ikut grup privasi latihan)
  return [r.el != null && 'naik ' + aiN(r.el) + ' m', r.pw != null && 'daya rata-rata ' + aiN(r.pw) + ' W',
    r.kc != null && 'kalori terbakar ' + aiN(r.kc) + ' kkal (perkiraan Strava)', r.hr != null ? 'HR rata-rata ' + aiN(r.hr) + ' bpm' + (r.hx != null ? ', maksimum ' + aiN(r.hx) : '') : r.hx != null && 'HR maksimum ' + aiN(r.hx) + ' bpm'];
}
// --- teks DAILY LOG / WEEKLY AUDIT: baris ride + data Strava. Hari/pekan tanpa ride menghasilkan [] sehingga teks lama tidak berubah sama sekali. ---
function jrExtraBits(r) {   // data Strava selain kalori (kalori punya baris sendiri agar mudah dibaca)
  const b = [];
  if (r.el != null) b.push('naik ' + fmt(r.el, 0) + ' m');
  if (r.pw != null) b.push('daya rata-rata ' + fmt(r.pw, 0) + ' W');
  if (r.hr != null) b.push('HR rata-rata ' + fmt(r.hr, 0) + ' bpm' + (r.hx != null ? ' (maks ' + fmt(r.hx, 0) + ')' : ''));
  else if (r.hx != null) b.push('HR maksimum ' + fmt(r.hx, 0) + ' bpm');
  // {J2-BITS}
  return b;
}
function jrTextLines(d, L, e) {
  const rd = jrRides(d);
  if (!rd.length) return [];
  const out = [], many = rd.length > 1;
  rd.forEach((r, i) => {
    const n = many ? ' ' + (i + 1) : '', bits = [RIDE_NAME(r.type)];
    if (r.st) bits.push('mulai ' + r.st.replace(':', '.'));
    if (r.km != null) bits.push(fmt(r.km, 2) + ' km');
    if (r.min != null) bits.push(fmt(r.min, 0) + ' menit');
    if (r.spd != null) bits.push(fmt(r.spd, 1) + ' km/jam');
    if (r.rpe != null) bits.push('RPE ' + r.rpe);
    out.push(L('Ride Sepeda' + n, bits.join(', ')));
    const note = String(r.note || '').replace(/\s+/g, ' ').trim();
    if (note) out.push(L('Catatan Ride' + n, note));
    const ex = jrExtraBits(r);
    if (ex.length) out.push(L('Data Strava' + n, ex.join(', ')));
  });
  const kc = jrKcalOf(d), eat = e ? num(e.kcal) : null;
  if (kc != null) {
    const pt = jrPart(d), nk = rd.filter(r => r.kc != null).length;
    out.push(L('Kalori Terbakar (Strava)', fmt(kc, 0) + ' kkal' + (pt ? ' (hanya ' + pt.n + ' dari ' + pt.m + ' ride yang punya kalori)' : nk > 1 ? ' (total ' + nk + ' ride)' : '')));
    if (eat != null) out.push(L('Kalori Masuk - Terbakar', fmt(eat - kc, 0) + ' kkal (perkiraan kasar)'));
  }
  return out;
}
function jrWeekLines(ws, B) {
  let kc = 0, nk = 0, el = 0, ne = 0;
  for (let k = 0; k < 7; k++) jrRides(addDays(ws, k)).forEach(r => { if (r.kc != null) { kc += r.kc; nk++; } if (r.el != null) { el += r.el; ne++; } });
  const out = [];
  if (nk) out.push(B('Kalori Terbakar Ride (Strava)', fmt(kc, 0) + ' kkal dari ' + nk + ' ride'));
  if (ne) out.push(B('Total Naik Ride (Strava)', fmt(el, 0) + ' m dari ' + ne + ' ride'));
  return out;
}
/* ===== MODUL: SEPEDA ZONA HR & GRAFIK KM/PEKAN (batch 17, langkah 17a) ===== */
// HRmax = 208 − 0,7 × usia (Tanaka, Monahan, Seals 2001; galat baku ±10 bpm). Persen zona = konvensi umum, bukan standar tunggal.
const HR_PCT = { 1: [50, 60], 2: [60, 70], 3: [70, 80], 4: [80, 90], 5: [90, 100] };
const hrAt = (max, pct) => Math.round(max * pct / 100);
function hrInfo() {   // st: none (usia kosong) | range (di luar 19-78) | ok
  const a = num(pfd().usia), m = hmMeasured();   // q4b: m = HRmax terukur (isian sendiri) atau null
  let base;
  if (a == null) base = { st: 'none' };
  else if (a < PF_LIM.a[0] || a > PF_LIM.a[1] || a !== Math.floor(a)) base = { st: 'range', age: a };
  else base = { st: 'ok', age: a, max: Math.round(208 - 0.7 * a) };
  if (m == null) return base;
  return { st: 'ok', src: 'terukur', max: m, age: base.st === 'ok' ? base.age : null, fmax: base.st === 'ok' ? base.max : null };
}
function zonesHTML() {
  const h = hrInfo();
  const head = h.src === 'terukur' ? hmHead(h) : h.st === 'ok'
    ? '<p class="note">Perkiraan detak jantung maksimal (HRmax) ' + h.max + ' bpm = 208 − 0,7 × ' + h.age + ' tahun (Tanaka 2001). Galat rumus ±10 bpm, jadi anggap angka bpm sebagai kisaran kasar; uji bicara dan RPE tetap penentu. Nyeri dada, pusing berat, atau pingsan: berhenti dan temui dokter.</p>'
    : '<p class="note">' + (h.st === 'range' ? 'Usia di profil (' + esc(String(h.age)) + ') di luar rentang rumus (19–78 tahun), jadi angka bpm tidak dihitung.' : 'Isi usia di Peta › Profil & energi untuk melihat perkiraan zona detak jantung (bpm) di sini.') + '</p><button class="btn sm ghost b17go" data-q="bkProfile">Buka profil di Peta</button>';
  return head + ZONES.map(z => {
    const r = HR_PCT[z.z];
    return '<div class="zn"><div class="zh"><span>Zone ' + z.z + ': ' + esc(z.nama) + '</span><span>RPE ' + z.rpe + '</span></div><small>' + esc(z.efek) + '</small>' +
      (h.st === 'ok' ? '<small class="b17bpm">≈ ' + hrAt(h.max, r[0]) + '–' + hrAt(h.max, r[1]) + ' bpm (' + r[0] + '–' + r[1] + '% HRmax)</small>' : '') + '</div>';
  }).join('');
}
function bkHrNote(type) {
  const h = hrInfo(), A = p => hrAt(h.max, p);
  if (h.st !== 'ok') return '<p class="note b17hr">' + (type === 'vo2' ? 'Target tiap set: ±90–95% detak jantung maksimal, keras tetapi terkendali (bukan sekuat-kuatnya). ' : '') + 'Isi usia di Peta untuk melihat perkiraan angka bpm.</p>';
  if (type === 'vo2') return '<p class="note b17hr">Target tiap set: ' + A(90) + '–' + A(95) + ' bpm (90–95% HRmax ≈ ' + h.max + ' bpm). Atur tenaga agar detak jantung naik ke rentang itu dan bertahan 4 menit, bukan sekuat-kuatnya; turunkan tenaga bila melewati ' + A(95) + ' bpm. Istirahat aktif: mengayuh ringan (protokol acuan ±70% HRmax ≈ ' + A(70) + ' bpm; aplikasi memakai Zone 1, lebih ringan).</p>';
  if (type === 'thr') return '<p class="note b17hr">Zone 3–4 ≈ ' + A(70) + '–' + A(90) + ' bpm (70–90% HRmax ≈ ' + h.max + ' bpm).</p>';
  return '<p class="note b17hr">Zone 2 ≈ ' + A(60) + '–' + A(70) + ' bpm (60–70% HRmax ≈ ' + h.max + ' bpm). Uji bicara tetap penentu.</p>';
}

/* --- grafik km per pekan --- */
let bkWeeks = 8;
const BK_WK_OPTS = [4, 8, 12];
function bkKmData(n) {
  const out = [], cw = thisWeek();
  for (let i = n - 1; i >= 0; i--) {
    const ws = addDays(cw, -7 * i), w = weekRides(ws);
    let nokm = 0;
    for (let k = 0; k < 7; k++) { const t = tdb[addDays(ws, k)]; if (t) t.rides.forEach(r => { if (r.km == null) nokm++; }); }
    out.push({ ws, km: w.km, min: w.min, n: w.n, nokm, cur: i === 0 });
  }
  return out;
}
function bkKmStats(d) {
  const done = d.filter(x => !x.cur);
  let best = null;
  d.forEach(x => { if (x.km > 0 && (!best || x.km > best.km)) best = { ws: x.ws, km: x.km }; });
  return {
    total: d.reduce((a, x) => a + x.km, 0), rides: d.reduce((a, x) => a + x.n, 0), nokm: d.reduce((a, x) => a + x.nokm, 0),
    avg: done.length ? done.reduce((a, x) => a + x.km, 0) / done.length : null, doneN: done.length, best
  };
}
function bkKmSVG(d) {
  const W = 300, H = 120, B = 14, T = 16, n = d.length, step = W / n, bw = Math.min(step * .62, 26);
  const hi = Math.max.apply(null, d.map(x => x.km)) * 1.15, y = v => T + (H - B - T) * (1 - v / hi);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Km per pekan, ' + n + ' pekan terakhir">';
  d.forEach((x, i) => {
    const cx = step * i + step / 2, p = pd(x.ws), lb = p.getDate() + '/' + (p.getMonth() + 1);
    if (x.km > 0) s += '<rect class="' + (x.cur ? 'cur' : 'n') + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + y(x.km).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - B - y(x.km)).toFixed(1) + '" rx="2"/><text x="' + cx.toFixed(1) + '" y="' + (y(x.km) - 3).toFixed(1) + '" text-anchor="middle" class="vl">' + fmt(x.km, x.km >= 100 ? 0 : 1) + '</text>';
    else s += '<rect class="e" x="' + (cx - bw / 2).toFixed(1) + '" y="' + (H - B - 1.5) + '" width="' + bw.toFixed(1) + '" height="1.5"/>';
    s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + lb + '</text>';
  });
  return s + '</svg>';
}
function bkKmHTML() {
  const d = bkKmData(bkWeeks), st = bkKmStats(d);
  const seg = '<div class="seg" id="bkWkSeg" role="group" aria-label="Rentang grafik">' + BK_WK_OPTS.map(n => '<button class="pill" data-q="bkWk" data-v="' + n + '" aria-pressed="' + (n === bkWeeks) + '">' + n + ' pekan</button>').join('') + '</div>';
  if (!(st.total > 0)) return seg + '<p class="empty">Belum ada jarak ride dalam ' + bkWeeks + ' pekan terakhir.' + (st.nokm ? ' ' + st.nokm + ' ride tercatat tanpa jarak.' : '') + '</p>';
  const lines = ['Total ' + fmt(st.total, 1) + ' km dalam ' + bkWeeks + ' pekan (' + st.rides + ' ride).'];
  if (st.avg != null) lines.push('Rata-rata ' + fmt(st.avg, 1) + ' km per pekan (' + st.doneN + ' pekan penuh; pekan berjalan tidak ikut dan digambar lebih pudar).');
  if (st.best) lines.push('Pekan terjauh ' + fmt(st.best.km, 1) + ' km (pekan ' + dayShort(st.best.ws).replace(/^[^,]+, /, '') + ').');
  if (st.nokm) lines.push(st.nokm + ' ride tanpa jarak tidak masuk grafik.');
  return seg + '<div class="chart"><div class="ch"><span>Jarak per pekan</span><small>km, pekan mulai Senin</small></div>' + bkKmSVG(d) + '</div><p class="note">' + lines.map(esc).join(' ') + '</p>';
}
QACT.bkWk = el => { const v = +el.dataset.v; if (BK_WK_OPTS.includes(v)) { bkWeeks = v; renderTrain(); } };
QACT.bkProfile = () => { showView('roadmap'); ptOpen('prof'); setTimeout(() => { const el = $('[data-pf="usia"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }, 80); };

/* ===== MODUL: NUTRISI & KRAM (batch 5) ===== */
const GIZI_HEAD = ['Fase 1', 'Fase 2', 'Fase 3–4'];
const GIZI_TBL = [
  ['Kalori', '1.600–1.700', '1.800–1.900', '2.000–2.200'],
  ['Protein', '140 g', '150 g', '160 g'],
  ['Karbohidrat', '130–150 g', '180–200 g', '220–250 g'],
  ['Lemak', '50 g', '55 g', '60 g'],
  ['Status', 'Defisit agresif', 'Defisit moderat', 'Maintenance / recomp']
];
const ELEC = [['Garam', 'm', 'm2'], ['Kalium', 'e', 'e2'], ['Kaki', 'e', 'e3'], ['Magnesium', 'e', 'e4']];
const elecDone = (d, it) => !!(cdb[d] && cdb[d][it[1]].includes(it[2]));

/* plateau: dua selisih pekan berturut-turut tidak turun (butuh 3 pekan berurutan yang terisi berat badan) */
function plateau() {
  const ks = Object.keys(wdb).filter(w => num(wdb[w].bw) != null).sort();
  if (ks.length < 3) return { st: 'need', n: ks.length };
  const w = ks.slice(-3);
  if (diffDays(w[2], thisWeek()) > 7) return { st: 'old', w: w[2] };   // data terakhir lebih lama dari pekan lalu
  if (diffDays(w[0], w[1]) !== 7 || diffDays(w[1], w[2]) !== 7) return { st: 'gap' };
  const v = w.map(x => num(wdb[x].bw));
  return { st: (v[1] >= v[0] && v[2] >= v[1]) ? 'yes' : 'no', v, w };
}
function nutMacroHTML(d) {   // 83m: lemak dan karbohidrat dari item makanan yang punya datanya (estimasi AI foto/teks)
  const l = edb[d] || [], s = msum(l);
  if (s.f == null && s.c == null) return '';
  const nm = l.filter(x => x.f != null || x.c != null).length;
  return kv('Lemak', s.f == null ? '–' : fmt(s.f, 0) + ' g') + kv('Karbohidrat', s.c == null ? '–' : fmt(s.c, 0) + ' g') +
    '<p class="note" id="nutMacroNote">Dari ' + nm + ' dari ' + l.length + ' item makanan yang punya data lemak atau karbohidrat; item lain tidak ikut dihitung, jadi angkanya bisa lebih rendah dari sebenarnya.</p>';
}
function nutTodayHTML() {
  const t = today(), T = tgFor(t), e = db[t] || blank(), k = num(e.kcal), p = num(e.protein), w = num(e.water);
  const kt = (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ' kcal';
  return kv('Kalori', (k == null ? '–' : fmt(k, 0)) + ', ' + kt + (T.refeed ? ' (hari refeed)' : '')) +
    kv('Protein', (p == null ? '–' : fmt(p, 0)) + ' dari ' + fmt(T.protein, 0) + ' g') +
    nutMacroHTML(t) +
    kv('Air putih', (w == null ? '–' : fmt(w, 2)) + ' dari ' + T.water + ' L') +
    swTodayLine() +
    '<div class="hint"><button class="link" data-q="openToday">Isi di Jurnal</button></div>';
}
function nutTableHTML() {
  const p = pos(today()), col = p && p.ph ? Math.min(p.ph.id, 3) : 0;
  return '<div class="gtw"><table class="gt"><thead><tr><th></th>' + GIZI_HEAD.map((h, i) => '<th' + (col === i + 1 ? ' class="on"' : '') + '>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    GIZI_TBL.map(r => '<tr><th scope="row">' + r[0] + '</th>' + r.slice(1).map((c, i) => '<td' + (col === i + 1 ? ' class="on"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
    '<p class="note">Bulan: Fase 1 = 1–3, Fase 2 = 4–12, Fase 3–4 = 13–36. Target kalori di Jurnal memakai batas bawah rentang untuk Fase 1–2.</p>';
}
function elecTableHTML() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));
  let full = 0, kram = 0;
  const rows = days.map(d => {
    const cells = ELEC.map(it => elecDone(d, it));
    if (cells.every(Boolean)) full++;
    const kr = db[d] ? db[d].kram : null;
    if (kr === 'ya') kram++;
    return '<tr><th scope="row">' + HARI[pd(d).getDay()].slice(0, 3) + ' ' + pd(d).getDate() + '</th>' +
      cells.map(c => '<td class="' + (c ? 'yes' : '') + '">' + (c ? '✓' : '–') + '</td>').join('') +
      '<td class="' + (kr === 'ya' ? 'bad' : '') + '">' + (kr === 'ya' ? 'Ya' : kr === 'tidak' ? 'Tidak' : '–') + '</td></tr>';
  }).join('');
  return '<div class="gtw"><table class="gt ticks"><thead><tr><th></th>' + ELEC.map(i => '<th>' + i[0] + '</th>').join('') + '<th>Kram</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="note">7 hari terakhir: ceklis lengkap ' + full + ' hari, kram ' + kram + ' hari. Ceklis diisi di Beranda, kram di Jurnal.</p>';
}
function plateauHTML() {
  const pl = plateau(), t = today(), on = !!(cdb[t] && cdb[t].refeed), ph = phaseOf(t) || PHASES[0];
  const fv = v => v.map(x => fmt(x, 1)).join(' → ') + ' kg';
  let st;
  if (pl.st === 'need') st = 'Butuh berat badan dari 3 pekan berturut-turut (audit mingguan). Sekarang baru ' + pl.n + ' pekan terisi.';
  else if (pl.st === 'old') st = 'Berat badan terakhir tercatat untuk pekan ' + shortDate(pl.w) + '. Isi audit mingguan pekan ini atau pekan lalu agar plateau bisa dinilai.';
  else if (pl.st === 'gap') st = 'Tiga pekan terakhir yang terisi tidak berurutan. Isi berat badan tiap pekan agar plateau bisa dinilai.';
  else if (pl.st === 'yes') st = 'Plateau: berat badan tidak turun dua pekan berturut-turut (' + fv(pl.v) + ').' + (ph.id === 1 ? ' Rencanamu menyarankan satu hari refeed sebelum memotong kalori lebih banyak.' : ' Aturan refeed di rencanamu ditulis untuk Fase 1.');
  else st = (pl.v[2] < pl.v[1] ? 'Belum plateau: berat badan pekan terakhir masih turun (' : 'Belum plateau: baru satu pekan tanpa penurunan (') + fv(pl.v) + ').';
  const hist = Object.keys(cdb).filter(d => cdb[d].refeed).sort().reverse().slice(0, 5);
  return '<p class="note" style="color:var(--ink);margin-top:12px">' + esc(st) + '</p>' +
    '<p class="note">Refeed day: satu hari makan di tingkat maintenance (±2.000 kcal) dengan karbohidrat bersih seperti kentang atau nasi, lalu kembali ke protokol. ' + (ph.id >= 3 ? 'Di Fase 3–4 rentang kalori sudah setingkat maintenance, jadi batas di Jurnal tidak berubah.' : 'Batas kalori hari itu di Jurnal menjadi 2.000 kcal.') + '</p>' +
    '<button class="btn wide' + (on ? '' : ' primary') + '" data-q="refeed">' + (on ? 'Batalkan refeed hari ini' : 'Jadikan hari ini refeed day') + '</button>' +
    (hist.length ? '<div class="sublbl">Hari refeed terakhir</div>' + hist.map(d => kv(esc(dayShort(d)), db[d] && num(db[d].kcal) != null ? fmt(num(db[d].kcal), 0) + ' kcal' : 'tanpa catatan kalori')).join('') : '');
}
function renderNutrition() {
  $('#nutBody').innerHTML = ntWrap(
    '<section class="sec"><h2>Target hari ini</h2>' + nutTodayHTML() + '</section>' +
    '<section class="sec"><h2>Makro per fase</h2>' + nutTableHTML() + '</section>' +
    '<section class="sec"><h2>Elektrolit dan kaki</h2>' +
    '<p class="note" style="margin-top:12px">Di rencanamu, kram berasal dari cairan yang menumpuk di kaki (berdiri lama) dan elektrolit yang tidak seimbang. Protokol harian: garam di air pagi, kalium dari pisang atau sayuran hijau, magnesium 30 menit sebelum tidur, kaki dinaikkan ke dinding 10 menit.</p>' +
    elecTableHTML() +
    '<p class="note">Jika kram makin sering atau ngorok dan rasa kantuk di siang hari tidak membaik, periksakan ke dokter.</p></section>' +
    fsSectionHTML() +
    krSectionHTML() +
    lcSectionHTML() +
    kpSectionHTML() +
    swSectionHTML() +
    pdSectionHTML() +
    rwSectionHTML() +
    '<section class="sec"><h2>Plateau dan refeed day</h2>' + plateauHTML() + '</section>' +
    mpSectionHTML() +
    ftSectionHTML() +
    mnSectionHTML() +
    ndSectionHTML());
  ntPost();
}
RENDER.nutrition = renderNutrition;
QACT.refeed = () => {
  const t = today(), c = cdb[t] || (cdb[t] = cblank());
  c.refeed = !c.refeed; c.updated = Date.now(); queueSave('c');
  derived();
  { const RT = tgFor(t); toast(c.refeed ? 'Hari ini refeed day. Kalori: ' + (RT.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(RT) + ' kcal' : 'Refeed dibatalkan: target kembali ke fase'); }
  renderNutrition();
};
QACT.openNutrition = () => showView('nutrition');

/* ===== MODUL: 83b PERINGATAN RISIKO KRAM + JAM RAWAN + PENGINGAT MAGNESIUM (Nutrisi) ===== */
// Murni dihitung di perangkat dari ceklis elektrolit (cdb), kejadian kram (kdb/db), ride (tdb). Pengaturan pengingat: localStorage `dailylog:krem:v1` (per perangkat, tidak ikut cadangan JSON).
// Pengingat hanya berbunyi saat aplikasi terbuka (tab/PWA hidup); web tidak bisa menjadwalkan notifikasi saat aplikasi tertutup.
const KEY_KR = 'dailylog:krem:v1', KR_WIN = 2, KR_GRACE = 90;   // KR_WIN = lebar jendela jam rawan (jam); KR_GRACE = menit batas telat pengingat
const krTm = s => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const krMin = s => +s.slice(0, 2) * 60 + +s.slice(3);
const krHm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
let krPref = { on: false, at: '21:00', last: '' };
try { const o = JSON.parse(localStorage.getItem(KEY_KR) || 'null'); if (o && typeof o === 'object') krPref = { on: o.on === true, at: krTm(o.at) ? o.at : '21:00', last: typeof o.last === 'string' ? o.last : '' }; } catch (e) { /* abaikan */ }
function krSave() { try { localStorage.setItem(KEY_KR, JSON.stringify(krPref)); } catch (e) { /* abaikan */ } }
let krFeed = null;   // pengingat yang baru berbunyi (sesi ini)

function krYest(t) {   // kondisi elektrolit kemarin
  const y = addDays(t || today(), -1), rec = !!cdb[y], miss = ELEC.filter(it => !elecDone(y, it)).map(it => it[0]);
  return { y, rec, miss, n: ELEC.length - miss.length, st: !rec ? 'none' : miss.length ? 'gap' : 'full' };
}
function krHours(t) {   // jendela jam rawan dari kejadian kram 90 hari terakhir yang punya jam
  t = t || today();
  const from = addDays(t, -89), hs = [];
  kjDays().forEach(d => { if (DATE_RE.test(d) && d >= from && d <= t) kjList(d).forEach(e => { if (krTm(e.h)) hs.push(krMin(e.h)); }); });
  const R = { n: hs.length, ok: hs.length >= HX_MIN_N, start: null, cnt: 0 };
  if (!R.ok) return R;
  let best = -1, bs = 0;
  for (let s = 0; s < 24; s++) {   // jendela berputar lewat tengah malam; seri: jam lebih awal
    const c = hs.filter(m => ((Math.floor(m / 60) - s + 24) % 24) < KR_WIN).length;
    if (c > best) { best = c; bs = s; }
  }
  R.start = bs * 60; R.cnt = best; return R;
}
function krCountdown(R, now) {   // menit sampai jendela berikut; 0 bila sedang di dalamnya
  const cur = now.getHours() * 60 + now.getMinutes(), off = (cur - R.start + 1440) % 1440;
  if (off < KR_WIN * 60) return { inside: true, left: KR_WIN * 60 - off, mins: 0 };
  return { inside: false, mins: (R.start - cur + 1440) % 1440 };
}
function krMatrix(t) {   // ride x ceklis elektrolit lengkap -> kram di hari itu (90 hari)
  t = t || today();
  const from = addDays(t, -89), c = { RF: [0, 0], RP: [0, 0], NF: [0, 0], NP: [0, 0] };   // [hari, hari kram]
  Object.keys(db).forEach(d => {
    if (!DATE_RE.test(d) || d < from || d > t || !cdb[d]) return;
    const e = db[d]; if (!e || (e.kram !== 'ya' && e.kram !== 'tidak')) return;
    const k = (bzRides(d).length ? 'R' : 'N') + (ELEC.every(it => elecDone(d, it)) ? 'F' : 'P');
    c[k][0]++; if (e.kram === 'ya') c[k][1]++;
  });
  return c;
}
function krAfterGap(t) {   // kram hari ini setelah kemarin lengkap vs bolong (90 hari)
  t = t || today();
  const from = addDays(t, -89), g = [0, 0], f = [0, 0];
  Object.keys(db).forEach(d => {
    if (!DATE_RE.test(d) || d < from || d > t) return;
    const e = db[d], y = addDays(d, -1); if (!e || (e.kram !== 'ya' && e.kram !== 'tidak') || !cdb[y]) return;
    const a = ELEC.every(it => elecDone(y, it)) ? f : g; a[0]++; if (e.kram === 'ya') a[1]++;
  });
  return { gap: g, full: f };
}
function krDueNow(now) {   // pengingat magnesium: sudah lewat jamnya hari ini, belum terkirim, dan magnesium belum diceklis
  now = now || new Date();
  const t = ymd(now), cur = now.getHours() * 60 + now.getMinutes(), at = krMin(krPref.at);
  return krPref.on && krPref.last !== t && cur >= at && cur - at <= KR_GRACE && !elecDone(t, ELEC[3]);
}
function krSectionHTML() {
  const t = today(), now = new Date(), Y = krYest(t), H = krHours(t), A = krAfterGap(t), pct = a => Math.round(a[1] * 100 / a[0]);
  let h = '<section class="sec" id="krSec"><h2>Risiko kram</h2>';
  if (Y.st === 'gap') h += '<p class="kpwarn" id="krWarn">⚠ Elektrolit kemarin (' + esc(dayShort(Y.y)) + ') bolong: ' + Y.n + ' dari ' + ELEC.length + ' butir. Belum: ' + esc(Y.miss.join(', ').toLowerCase()) + '. Risiko kram hari ini lebih tinggi; selesaikan ceklis hari ini lebih awal dan minum cukup air.</p>';
  else if (Y.st === 'none') h += '<p class="note" id="krWarn" style="color:var(--ink)">Kemarin (' + esc(dayShort(Y.y)) + ') tidak ada catatan ceklis elektrolit, jadi risikonya belum bisa dinilai. Isi ceklis di Beranda.</p>';
  else h += '<p class="note" id="krWarn" style="color:var(--ink)">Elektrolit kemarin (' + esc(dayShort(Y.y)) + ') lengkap ' + ELEC.length + ' dari ' + ELEC.length + ' butir. Pertahankan hari ini.</p>';
  if (A.gap[0] >= HX_GRP_MIN && A.full[0] >= HX_GRP_MIN) h += kv('Kram setelah kemarin bolong', pct(A.gap) + '% (' + A.gap[1] + ' dari ' + A.gap[0] + ' hari)') + kv('Kram setelah kemarin lengkap', pct(A.full) + '% (' + A.full[1] + ' dari ' + A.full[0] + ' hari)');
  else h += '<p class="note">Perbandingan kram setelah hari bolong atau lengkap butuh minimal ' + HX_GRP_MIN + ' hari di tiap kelompok (90 hari, hari yang ditandai kram atau tidak). Sekarang ' + A.gap[0] + ' hari bolong dan ' + A.full[0] + ' hari lengkap.</p>';
  h += '<div class="sublbl">Jam rawan kram</div>';
  if (!H.ok) h += '<p class="note">Butuh minimal ' + HX_MIN_N + ' kejadian kram yang punya jam (90 hari terakhir). Sekarang ' + H.n + '. Isi jam kejadian di Jurnal.</p>';
  else {
    const C = krCountdown(H, now), w = krHm(H.start) + '–' + krHm(H.start + KR_WIN * 60);
    h += kv('Jendela paling sering', w.replace(/:/g, '.') + ' (' + H.cnt + ' dari ' + H.n + ' kejadian)') +
      kv(C.inside ? 'Sekarang' : 'Jam rawan berikutnya', C.inside ? 'sedang di jam rawan, sisa ' + Math.floor(C.left / 60) + ' jam ' + (C.left % 60) + ' menit' : 'dalam ' + Math.floor(C.mins / 60) + ' jam ' + (C.mins % 60) + ' menit') +
      (H.n < HX_OK_N ? '<p class="warn">⚠ Data masih sedikit (' + H.n + ' kejadian). Anggap ini petunjuk awal.</p>' : '');
  }
  h += '<div class="sublbl">Pengingat magnesium malam</div>' +
    '<p class="note">Protokol: magnesium 30 menit sebelum tidur. Pengingat berbunyi hanya saat aplikasi sedang terbuka, tidak muncul bila aplikasi tertutup. Tidak berbunyi bila butir magnesium hari ini sudah diceklis.</p>' +
    '<div class="seg" role="group" aria-label="Pengingat magnesium"><button type="button" class="pill" data-q="krOn" aria-pressed="' + krPref.on + '">' + (krPref.on ? 'Pengingat aktif' : 'Aktifkan pengingat') + '</button></div>' +
    '<label class="note" style="display:block;margin-top:10px">Jam pengingat <input type="time" id="krAt" value="' + krPref.at + '"></label>';
  if (H.ok) { const sg = krHm(H.start - 60); if (sg !== krPref.at) h += '<button type="button" class="btn wide" data-q="krSug" data-v="' + sg + '">Pakai saran: ' + sg.replace(':', '.') + ' (1 jam sebelum jam rawan)</button>'; }
  if (krPref.on && typeof Notification !== 'undefined' && Notification.permission === 'default') h += '<button type="button" class="btn wide" data-q="krPerm">Izinkan notifikasi</button>';
  if (krPref.on && typeof Notification !== 'undefined' && Notification.permission === 'denied') h += '<p class="note">Notifikasi diblokir peramban; pengingat tetap tampil sebagai pesan di dalam aplikasi.</p>';
  if (krFeed) h += '<div class="rm-bn" id="krFeed"><span><b>' + esc(krFeed.t) + '</b><small>' + esc(krFeed.b) + '</small></span><button type="button" class="btn" data-q="krDis">Tutup</button></div>';
  h += '</section>';   /* 83h: matriks ride x elektrolit pindah ke kartu Beban ride dan elektrolit */
  return h;
}
function krPaint() { const s = $('#krSec'); if (s) s.outerHTML = krSectionHTML(); }
QACT.krOn = () => {
  krPref.on = !krPref.on; krSave();
  if (krPref.on && typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission().then(krPaint, krPaint); } catch (e) { /* abaikan */ } }
  krPaint();
};
QACT.krSug = el => { if (krTm(el.dataset.v)) { krPref.at = el.dataset.v; krPref.last = ''; krSave(); krPaint(); } };
QACT.krPerm = () => { try { Notification.requestPermission().then(krPaint, krPaint); } catch (e) { /* abaikan */ } };
QACT.krDis = () => { krFeed = null; krPaint(); };
document.addEventListener('change', ev => {
  const el = ev.target; if (!el || el.id !== 'krAt') return;
  if (krTm(el.value)) { krPref.at = el.value; krPref.last = ''; krSave(); } else el.value = krPref.at;
});
function krNotify(title, body, tag) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  const fb = () => { try { new Notification(title, { body, tag }); } catch (e) { /* peramban HP sering menolak */ } };
  try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) { navigator.serviceWorker.getRegistration().then(r => { if (r && r.showNotification) return r.showNotification(title, { body, tag }); fb(); }).catch(fb); return true; } } catch (e) { /* lanjut */ }
  fb(); return true;
}
function krTick() {
  try {
    const now = new Date();
    if (!krDueNow(now)) return;
    const t = ymd(now), n = ELEC.filter(it => elecDone(t, it)).length;
    krPref.last = t; krSave();
    krFeed = { t: 'Waktunya magnesium', b: 'Minum magnesium 30 menit sebelum tidur dan cukupi air. Ceklis elektrolit hari ini ' + n + ' dari ' + ELEC.length + '.' };
    if (!krNotify(krFeed.t, krFeed.b, 'dl-kr-' + t)) { try { toast(krFeed.t); } catch (e) { /* abaikan */ } }
    if (typeof curView !== 'undefined' && curView === 'nutrition') krPaint();
  } catch (e) { /* jangan ganggu aplikasi */ }
}
setInterval(krTick, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) krTick(); });
setTimeout(krTick, 5000);
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83b: Object.freeze({ yest: krYest, hours: krHours, matrix: krMatrix, after: krAfterGap, due: krDueNow, html: krSectionHTML, pref: () => krPref, tick: krTick, test: Object.freeze({ db: () => db, cdb: () => cdb, kdb: () => kdb, tdb: () => tdb, cblank, blank, addDays, today, show: v => showView(v), q: n => QACT[n] }) }) })); }, 0);   // didaftarkan setelah seluruh skrip selesai (DL dasar dibuat lebih belakang)
/* ===== AKHIR 83b ===== */

/* ===== MODUL: 83c KERINGAT, NATRIUM, TARGET AIR DINAMIS HARI RIDE (Nutrisi) ===== */
// Murni perkiraan di perangkat dari ride (tdb), berat terbaru, dan pilihan pengguna. Tidak dikirim ke AI, tidak ikut cadangan JSON.
// Pilihan disimpan di localStorage `dailylog:swt:v1` (per perangkat). Target air Beranda/Jurnal TIDAK diubah; target dinamis hanya tampil di Nutrisi.
const KEY_SW = 'dailylog:swt:v1';
const SW_HEAT = { s: ['Sejuk', 0.85], n: ['Normal', 1], p: ['Panas', 1.2] };
const SW_SAL = { l: ['Asin sedikit', 500], a: ['Rata-rata', 900], h: ['Asin banyak', 1300] };
const SW_ML_KG_H = 11, SW_MIN_L = 0.3, SW_MAX_L = 2, SW_REPL = 0.7, SW_NA_LO = 300, SW_NA_HI = 600, SW_DAYS = 14, SW_RATE_LO = 0.3, SW_RATE_HI = 2.5;
let swPref = { heat: 'n', sal: 'a', rate: null };
try {
  const o = JSON.parse(localStorage.getItem(KEY_SW) || 'null');
  if (o && typeof o === 'object') swPref = { heat: SW_HEAT[o.heat] ? o.heat : 'n', sal: SW_SAL[o.sal] ? o.sal : 'a', rate: (typeof o.rate === 'number' && o.rate >= SW_RATE_LO && o.rate <= SW_RATE_HI) ? o.rate : null };
} catch (e) { /* abaikan */ }
function swSave() { try { localStorage.setItem(KEY_SW, JSON.stringify(swPref)); } catch (e) { /* abaikan */ } }
const swR1 = v => Math.round(v * 10) / 10;
const swL = v => fmt(v, Number.isInteger(v) ? 0 : 1);
function swWeight() { const b = latestBw(); return (b && b.v >= 30 && b.v <= 300) ? b.v : bwStart(); }
function swIntF(r) {   // faktor intensitas dari IF (HR rata-rata / LTHR); tanpa HR = 1
  let i = null; try { i = b55If(r, b55Lthr()); } catch (e) { i = null; }
  return i == null ? { f: 1, i: null } : { f: i < 0.75 ? 0.85 : i < 0.9 ? 1 : 1.2, i };
}
function swRate(r, P, kg) {   // tingkat keringat L/jam: angka ukur sendiri bila ada, kalau tidak 11 mL/kg/jam x panas x intensitas, dibatasi 0,3-2,0
  P = P || swPref; kg = kg || swWeight();
  if (P.rate != null) return { lph: P.rate, src: 'ukur', i: null };
  const I = swIntF(r), raw = SW_ML_KG_H * kg / 1000 * SW_HEAT[P.heat][1] * I.f;
  return { lph: Math.min(SW_MAX_L, Math.max(SW_MIN_L, raw)), src: 'perkiraan', i: I.i };
}
function swRide(r, P, kg) {
  if (!r || !(r.min > 0)) return null;
  P = P || swPref;
  const R = swRate(r, P, kg), h = r.min / 60, L = R.lph * h;
  return { min: r.min, lph: R.lph, src: R.src, i: R.i, L, na: L * SW_SAL[P.sal][1], rep: L * SW_REPL, drunk: r.ml != null ? r.ml / 1000 : null, naLo: SW_NA_LO * h, naHi: SW_NA_HI * h };
}
function swDay(d, P, kg) {
  const rs = bzRides(d).map(r => swRide(r, P, kg)).filter(Boolean), o = { n: rs.length, rides: rs, min: 0, L: 0, na: 0, rep: 0 };
  rs.forEach(x => { o.min += x.min; o.L += x.L; o.na += x.na; o.rep += x.rep; });
  return o;
}
function swTarget(d, P, kg) {   // target air hari itu = target fase + 70% perkiraan keringat dari ride
  const base = tgFor(d).water, x = swDay(d, P, kg), add = swR1(x.rep);
  return { base, add, total: swR1(base + add), day: x };
}
function swTodayLine() {
  const T = swTarget(today());
  return T.day.n ? kv('Air hari ride (dinamis)', swL(T.total) + ' L (' + swL(T.base) + ' fase + ' + swL(T.add) + ' dari ride)') : '';
}
function swSectionHTML() {
  const t = today(), kg = swWeight(), T = swTarget(t, null, kg), D = T.day, P = swPref, ten = v => fmt(Math.round(v / 10) * 10, 0);
  let h = '<section class="sec" id="swSec"><h2>Keringat dan natrium</h2>' +
    '<p class="note" style="margin-top:12px">Perkiraan cairan dan natrium yang hilang lewat keringat saat ride sepeda, lalu target air untuk hari ride. Ini angka kasar: tingkat keringat bisa berbeda sampai 10 kali antar orang, kadar natrium keringat sampai 5 kali.</p>';
  if (D.n) {
    h += kv('Ride hari ini', D.n + ' ride, ' + fmt(D.min, 0) + ' menit') +
      kv('Perkiraan keringat', swL(swR1(D.L)) + ' L') +
      kv('Perkiraan natrium hilang', ten(D.na) + ' mg') +
      kv('Target air hari ini', swL(T.total) + ' L (' + swL(T.base) + ' fase + ' + swL(T.add) + ' dari ride)');
    const ml = D.rides.filter(x => x.drunk != null).reduce((a, x) => a + x.drunk, 0), rp = D.rides.filter(x => x.drunk != null).reduce((a, x) => a + x.rep, 0);
    if (D.rides.some(x => x.drunk != null)) h += kv('Minum saat ride', swL(swR1(ml)) + ' L dari saran ' + swL(swR1(rp)) + ' L');
    const lo = D.rides.reduce((a, x) => a + x.naLo, 0), hi = D.rides.reduce((a, x) => a + x.naHi, 0);
    h += kv('Natrium lazim per ride', ten(lo) + '–' + ten(hi) + ' mg');
  } else h += '<p class="note" style="color:var(--ink)">Belum ada ride hari ini, jadi target air tetap target fase: ' + swL(T.base) + ' L.</p>';
  h += '<div class="sublbl">Kondisi ride</div><div class="seg" role="group" aria-label="Kondisi ride">' +
    Object.keys(SW_HEAT).map(k => '<button type="button" class="pill" data-q="swHeat" data-v="' + k + '" aria-pressed="' + (P.heat === k) + '">' + SW_HEAT[k][0] + '</button>').join('') + '</div>' +
    '<div class="sublbl">Keringatmu</div><div class="seg" role="group" aria-label="Kadar natrium keringat">' +
    Object.keys(SW_SAL).map(k => '<button type="button" class="pill" data-q="swSal" data-v="' + k + '" aria-pressed="' + (P.sal === k) + '">' + SW_SAL[k][0] + '</button>').join('') + '</div>' +
    '<p class="note">Asin banyak bila keringat meninggalkan bercak putih di pakaian atau topi, atau terasa perih di mata. Dasar angka: rata-rata keringat sekitar 900 mg natrium per liter (rentang 200–2.300).</p>' +
    '<div class="sublbl">Tingkat keringat sendiri (liter per jam, opsional)</div><label class="inp"><input id="swRate" inputmode="decimal" autocomplete="off" placeholder="mis. 0,9" value="' + (P.rate != null ? esc(String(P.rate).replace('.', ',')) : '') + '" aria-label="Tingkat keringat sendiri, liter per jam"></label>' +
    '<div class="seg"><button type="button" class="btn" data-q="swRateSave">Simpan angka</button>' + (P.rate != null ? '<button type="button" class="btn" data-q="swRateClear">Pakai perkiraan</button>' : '') + '</div>' +
    '<p class="note">' + (P.rate != null ? 'Memakai angkamu: ' + swL(P.rate) + ' L/jam untuk semua ride.' : 'Perkiraan: 11 mL per kg berat badan per jam (berat ' + fmt(kg, 1) + ' kg) x kondisi x intensitas ride (dari detak jantung bila ada), dibatasi 0,3–2,0 L/jam.') + ' Cara mengukur sendiri: timbang badan sebelum dan sesudah ride (kering, tanpa baju basah); tiap 1 kg turun kira-kira 1 liter, tambahkan air yang kamu minum.</p>';
  h += '<div class="sublbl">Ride ' + SW_DAYS + ' hari terakhir</div>';
  const from = addDays(t, -(SW_DAYS - 1)), ds = []; for (let i = 0; i < SW_DAYS; i++) ds.push(addDays(t, -i));
  let any = false;
  ds.forEach(d => {
    const X = swDay(d, null, kg); if (!X.n || d < from) return; any = true;
    const dr = X.rides.filter(x => x.drunk != null), gap = dr.length ? ' · minum ' + swL(swR1(dr.reduce((a, x) => a + x.drunk, 0))) + ' L dari saran ' + swL(swR1(dr.reduce((a, x) => a + x.rep, 0))) + ' L' : '';
    h += kv(esc(dayShort(d)), fmt(X.min, 0) + ' mnt · keringat ' + swL(swR1(X.L)) + ' L · natrium ' + ten(X.na) + ' mg' + gap);
  });
  if (!any) h += '<p class="note">Belum ada ride dengan durasi dalam ' + SW_DAYS + ' hari terakhir. Catat ride di Latihan > Sepeda.</p>';
  h += '<p class="note">Dasar: saran mengganti sekitar 70% perkiraan keringat; asupan natrium saat ride yang lazim disebut 300–600 mg per jam (dikutip dari ACSM oleh sumber sekunder: Rouvy, Competitive Cyclist, Velora). Jangan minum lebih banyak dari perkiraan kehilangan cairan: minum berlebihan tanpa natrium bisa menurunkan kadar natrium darah (hiponatremia). Target air Beranda dan Jurnal tetap target fase. Bukan saran medis; bila pusing berat, mual, atau kram terus, hentikan ride dan periksakan ke dokter.</p></section>';
  return h;
}
function swRender() { const y = window.scrollY; renderNutrition(); try { window.scrollTo(0, y); } catch (e) { /* abaikan */ } }
QACT.swHeat = el => { const v = el && el.dataset && el.dataset.v; if (SW_HEAT[v]) { swPref.heat = v; swSave(); swRender(); } };
QACT.swSal = el => { const v = el && el.dataset && el.dataset.v; if (SW_SAL[v]) { swPref.sal = v; swSave(); swRender(); } };
QACT.swRateSave = () => {
  const el = $('#swRate'), raw = el ? String(el.value).trim() : '';
  if (!raw) { swPref.rate = null; swSave(); swRender(); return; }
  const v = /^\d{1,2}([.,]\d{1,2})?$/.test(raw) ? parseFloat(raw.replace(',', '.')) : NaN;
  if (!(v >= SW_RATE_LO && v <= SW_RATE_HI)) { toast('Tingkat keringat harus ' + String(SW_RATE_LO).replace('.', ',') + '–' + String(SW_RATE_HI).replace('.', ',') + ' liter per jam, atau kosongkan.'); return; }
  swPref.rate = v; swSave(); swRender();
};
QACT.swRateClear = () => { swPref.rate = null; swSave(); swRender(); };
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83c: Object.freeze({ rate: swRate, ride: swRide, day: swDay, target: swTarget, html: swSectionHTML, today: swTodayLine, pref: () => swPref }) })); }, 0);
/* ===== AKHIR 83c ===== */

/* ===== MODUL: 83f RATA-RATA BERAT 7 HARI + PERINGATAN PENURUNAN PERFORMA (Nutrisi) ===== */
// Murni hitungan di perangkat dari data yang sudah ada: berat harian Self Care (`scdb.days[d].wt`), kalori Jurnal (`db[d].kcal`), ride (`tdb`).
// Tidak ada penyimpanan baru, tidak dikirim ke AI, tidak mengubah data apa pun. Dua kartu baru di halaman Nutrisi.
const RW_WIN = 7, RW_SHOW = 30, RW_MIN = 3, RW_FLAT = 0.2;                       // jendela rata-rata, hari di grafik, minimal timbangan per jendela, batas "stabil" (kg)
const PD_INT_DAYS = 5, PD_LOW_MIN_LOGGED = 3, PD_LOW_MIN_DAYS = 3, PD_LOW_SHARE = 0.6;   // jendela asupan (5 hari sampai kemarin), minimal hari tercatat, minimal hari rendah, porsi hari rendah
const PD_LOW_RANGE = 0.85, PD_LOW_MAX = 0.75;                                     // rendah = di bawah 85% batas bawah rentang, atau 75% batas atas bila target berupa batas
const PD_RECENT = 7, PD_BASE_FROM = 27, PD_MIN_R = 2, PD_MIN_B = 3, PD_DROP = 0.07, PD_MIN_MIN = 20;   // ride terbaru 7 hari vs 21 hari sebelumnya; turun >= 7%; ride < 20 menit diabaikan
function rwVal(d) {
  const x = scdb.days[d], v = x ? x.wt : null, n = (v == null || v === '') ? NaN : Number(v);
  return (isFinite(n) && n >= 30 && n <= 300) ? n : null;
}
function rwMean(from, to) {   // rata-rata berat harian pada [from, to] (tanggal teks), null bila tak ada
  let s = 0, n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) { const v = rwVal(d); if (v != null) { s += v; n++; } }
  return { n, a: n ? s / n : null };
}
function rwSeries(end, days) {   // tiap hari bertimbangan dalam `days` hari terakhir: berat, rata-rata 7 hari yang berakhir di hari itu, jumlah timbangan di jendela
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i), v = rwVal(d);
    if (v == null) continue;
    const m = rwMean(addDays(d, -(RW_WIN - 1)), d);
    out.push({ d, v, a: m.a, n: m.n });
  }
  return out;
}
function rwSummary(end) {   // 7 hari terakhir vs 7 hari sebelumnya
  const now = rwMean(addDays(end, -(RW_WIN - 1)), end), prev = rwMean(addDays(end, -(2 * RW_WIN - 1)), addDays(end, -RW_WIN));
  const ok = now.n >= RW_MIN && prev.n >= RW_MIN, delta = ok ? now.a - prev.a : null;
  return { now, prev, ok, delta, dir: !ok ? null : Math.abs(delta) < RW_FLAT ? 'stabil' : delta < 0 ? 'turun' : 'naik' };
}
function rwSVG(pts, lab) {
  const W = 300, H = 124, pl = 38, pr = 10, pt = 10, pb = 22;
  const all = []; pts.forEach(p => { all.push(p.v); all.push(p.a); });
  const lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pad = Math.max(0.4, (hi - lo) * 0.2), a = lo - pad, b = hi + pad;
  const t0 = pd(addDays(pts[pts.length - 1].d, -(RW_SHOW - 1))).getTime(), t1 = pd(pts[pts.length - 1].d).getTime(), span = Math.max(1, t1 - t0);
  const X = p => pl + (pd(p.d).getTime() - t0) / span * (W - pl - pr), Y = v => pt + (1 - (v - a) / (b - a)) * (H - pt - pb);
  const line = pts.map(p => X(p).toFixed(1) + ',' + Y(p.a).toFixed(1)).join(' ');
  const dots = pts.map(p => '<circle cx="' + X(p).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="2.6" style="fill:var(--mute);opacity:.7"/>').join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(lab) + '" style="display:block;width:100%;height:auto;margin:6px 0">' +
    '<line x1="' + pl + '" y1="' + Y(hi).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(hi).toFixed(1) + '" style="stroke:var(--rule);stroke-dasharray:3 3"/>' +
    '<line x1="' + pl + '" y1="' + Y(lo).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(lo).toFixed(1) + '" style="stroke:var(--rule);stroke-dasharray:3 3"/>' +
    '<text x="' + (pl - 4) + '" y="' + (Y(hi) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--mute);font:500 10px var(--sans)">' + fmt(hi, 1) + '</text>' +
    '<text x="' + (pl - 4) + '" y="' + (Y(lo) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--mute);font:500 10px var(--sans)">' + fmt(lo, 1) + '</text>' +
    (pts.length > 1 ? '<polyline points="' + line + '" style="fill:none;stroke:var(--ok);stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round"/>' : '<circle cx="' + X(pts[0]).toFixed(1) + '" cy="' + Y(pts[0].a).toFixed(1) + '" r="4" style="fill:var(--ok)"/>') + dots +
    '<text x="' + pl + '" y="' + (H - 6) + '" text-anchor="start" style="fill:var(--mute);font:500 10px var(--sans)">' + shortDate(addDays(pts[pts.length - 1].d, -(RW_SHOW - 1))) + '</text>' +
    '<text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end" style="fill:var(--mute);font:500 10px var(--sans)">' + shortDate(pts[pts.length - 1].d) + '</text></svg>';
}
const rwSign = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), 1);
function rwSectionHTML() {
  const t = today(), pts = rwSeries(t, RW_SHOW), S = rwSummary(t);
  let h = '<section class="sec" id="rwSec"><h2>Berat, rata-rata 7 hari</h2>' +
    '<p class="note" style="margin-top:12px">Berat harian naik turun karena air, garam, dan isi perut. Rata-rata 7 hari menghaluskannya supaya arah yang sebenarnya terlihat. Hanya berat harian dari Self Care (Timbang hari ini) yang dihitung.</p>';
  if (!pts.length) return h + '<p class="note" style="color:var(--ink)">Belum ada berat harian dalam ' + RW_SHOW + ' hari terakhir. Isi lewat Lainnya > Self Care > Progres > Timbang hari ini.</p></section>';
  const last = pts[pts.length - 1];
  h += rwSVG(pts, 'Grafik berat ' + RW_SHOW + ' hari dan rata-rata 7 hari: ' + pts.map(p => shortDate(p.d) + ' ' + fmt(p.v, 1) + ' kg, rata-rata ' + fmt(p.a, 1)).join('; ')) +
    '<p class="note" style="margin-top:0">Titik abu-abu = berat harian, garis hijau = rata-rata 7 hari.</p>' +
    kv('Rata-rata 7 hari terakhir', S.now.n ? fmt(S.now.a, 1) + ' kg (' + S.now.n + ' timbangan)' : '–') +
    kv('7 hari sebelumnya', S.prev.n ? fmt(S.prev.a, 1) + ' kg (' + S.prev.n + ' timbangan)' : '–');
  if (S.ok) h += kv('Perubahan rata-rata', rwSign(S.delta) + ' kg · ' + S.dir);
  else h += '<p class="note" style="color:var(--ink)">Untuk membandingkan, butuh minimal ' + RW_MIN + ' timbangan di tiap 7 hari.</p>';
  h += '<div class="sublbl">Timbangan terakhir</div>';
  pts.slice(-7).reverse().forEach(p => { h += kv(esc(dayShort(p.d)), fmt(p.v, 1) + ' kg · rata-rata ' + fmt(p.a, 1) + ' kg (' + p.n + ' timbangan)'); });
  return h + '<p class="note">Rata-rata di satu hari memakai timbangan 7 hari yang berakhir di hari itu. Naik atau turun kurang dari ' + String(RW_FLAT).replace('.', ',') + ' kg dianggap stabil. Ini bukan saran medis.</p></section>';
}
/* ---- peringatan penurunan performa: asupan kalori rendah + kecepatan ride turun ---- */
function pdFloor(T) { return T.mode === 'range' ? T.kcal * PD_LOW_RANGE : T.kcal * PD_LOW_MAX; }
function pdIntake(end) {   // 5 hari sampai `end` (hari lengkap, biasanya kemarin): hari tercatat, hari rendah, rata-rata
  let logged = 0, low = 0, sum = 0;
  for (let i = PD_INT_DAYS - 1; i >= 0; i--) {
    const d = addDays(end, -i), e = db[d], k = e ? num(e.kcal) : null;
    if (k == null || !(k > 0)) continue;
    logged++; sum += k;
    if (k < pdFloor(tgFor(d))) low++;
  }
  const enough = logged >= PD_LOW_MIN_LOGGED, flag = enough && low >= PD_LOW_MIN_DAYS && low / logged >= PD_LOW_SHARE;
  return { days: PD_INT_DAYS, logged, low, avg: logged ? sum / logged : null, enough, flag };
}
function pdSpd(r) {
  if (!r) return null;
  if (r.min != null && r.min < PD_MIN_MIN) return null;
  let s = null;
  if (r.spd != null && r.spd > 0) s = r.spd; else if (r.km != null && r.km > 0 && r.min != null && r.min > 0) s = r.km / (r.min / 60);
  return (s != null && s > 0 && s < 80) ? s : null;
}
function pdSpeeds(from, to) {
  const o = [];
  for (let d = from; d <= to; d = addDays(d, 1)) bzRides(d).forEach(r => { const s = pdSpd(r); if (s != null) o.push(s); });
  return o;
}
const pdAvg = a => ({ n: a.length, a: a.length ? a.reduce((x, y) => x + y, 0) / a.length : null });
function pdPerf(t) {   // kecepatan rata-rata 7 hari terakhir (sampai `t`) vs 21 hari sebelumnya
  const r = pdAvg(pdSpeeds(addDays(t, -(PD_RECENT - 1)), t)), b = pdAvg(pdSpeeds(addDays(t, -PD_BASE_FROM), addDays(t, -PD_RECENT)));
  const enough = r.n >= PD_MIN_R && b.n >= PD_MIN_B, drop = enough ? (b.a - r.a) / b.a : null;
  return { r, b, enough, drop, flag: enough && drop >= PD_DROP };
}
function pdAlert(t) {
  const I = pdIntake(addDays(t, -1)), P = pdPerf(t);
  let kind, title, body;
  if (!I.enough && !P.enough) { kind = 'none'; title = 'Belum cukup data'; body = 'Butuh asupan kalori tercatat minimal ' + PD_LOW_MIN_LOGGED + ' dari ' + PD_INT_DAYS + ' hari terakhir dan ride bercatatan kecepatan atau jarak + durasi (minimal ' + PD_MIN_R + ' dalam 7 hari terakhir dan ' + PD_MIN_B + ' dalam 21 hari sebelumnya).'; }
  else if (I.flag && P.flag) { kind = 'warn'; title = 'Waspada: kalori rendah dan performa turun'; body = 'Asupan rendah beberapa hari terakhir dan kecepatan ride ikut turun. Ini pola yang sering muncul saat defisit terlalu dalam. Pertimbangkan naik ke rentang target atau hari refeed, kurangi intensitas ride beberapa hari, dan periksakan ke dokter bila pusing, sangat lemas, atau berlangsung lama.'; }
  else if (I.flag) { kind = 'info'; title = 'Kalori rendah, performa belum turun'; body = 'Asupan rendah beberapa hari terakhir, tetapi kecepatan ride ' + (P.enough ? 'belum turun' : 'belum bisa dinilai (ride kurang)') + '. Perhatikan bila performa mulai turun.'; }
  else if (P.flag) { kind = 'info'; title = 'Performa turun, kalori tidak rendah'; body = 'Kecepatan ride turun, tetapi asupan ' + (I.enough ? 'tidak rendah' : 'belum cukup tercatat') + '. Penyebab lain mungkin: kurang tidur, beban latihan, rute, cuaca, atau angin.'; }
  else { kind = 'ok'; title = 'Tidak ada tanda penurunan'; body = (I.enough ? 'Asupan kalori tidak rendah' : 'Asupan belum cukup tercatat') + ' dan ' + (P.enough ? 'kecepatan ride tidak turun bermakna.' : 'ride belum cukup untuk dibandingkan.'); }
  return { kind, title, body, intake: I, perf: P };
}
function pdSectionHTML() {
  const t = today(), A = pdAlert(t), I = A.intake, P = A.perf;
  const col = A.kind === 'warn' ? 'var(--bad)' : A.kind === 'ok' ? 'var(--ok)' : 'var(--mute)';
  let h = '<section class="sec" id="pdSec"><h2>Peringatan performa</h2>' +
    '<p class="note" style="margin-top:12px">Membandingkan asupan kalori dengan kecepatan ride untuk mendeteksi penurunan performa akibat defisit yang terlalu dalam. Hanya indikasi dari data yang kamu catat. Asupan dihitung dari ' + PD_INT_DAYS + ' hari lengkap sampai kemarin.</p>' +
    '<div class="note" role="status" data-pd="' + A.kind + '" style="border-left:4px solid ' + col + ';padding:8px 12px;color:var(--ink)"><b>' + esc(A.title) + '</b><br>' + esc(A.body) + '</div>';
  h += kv('Kalori ' + PD_INT_DAYS + ' hari', I.logged ? fmt(I.avg, 0) + ' kcal rata-rata' : 'belum ada catatan');
  h += kv('Hari tercatat', I.logged + ' dari ' + PD_INT_DAYS) + kv('Hari kalori rendah', String(I.low));
  h += kv('Kecepatan ride 7 hari', P.r.n ? fmt(P.r.a, 1) + ' km/jam (' + P.r.n + ' ride)' : '–');
  h += kv('21 hari sebelumnya', P.b.n ? fmt(P.b.a, 1) + ' km/jam (' + P.b.n + ' ride)' : '–');
  if (P.enough) h += kv('Perubahan kecepatan', (P.drop > 0 ? '−' : P.drop < 0 ? '+' : '') + fmt(Math.abs(P.drop) * 100, 0) + ' persen');
  return h + '<p class="note">Kalori dianggap rendah bila di bawah ' + Math.round(PD_LOW_RANGE * 100) + ' persen batas bawah rentang target fase (atau ' + Math.round(PD_LOW_MAX * 100) + ' persen bila targetnya batas). Performa dianggap turun bila kecepatan rata-rata turun ' + Math.round(PD_DROP * 100) + ' persen atau lebih; ride di bawah ' + PD_MIN_MIN + ' menit diabaikan. Jenis ride, tanjakan, dan angin bisa memengaruhi kecepatan. Bukan diagnosis.</p></section>';
}
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83f: Object.freeze({ series: rwSeries, summary: rwSummary, intake: pdIntake, speed: pdSpd, perf: pdPerf, alert: pdAlert, floor: pdFloor, tg: tgFor, weightHtml: rwSectionHTML, perfHtml: pdSectionHTML }) })); }, 0);
/* ===== AKHIR 83f ===== */

/* ===== MODUL: 83e VARIASI MENU / MENU FATIGUE TRACKER (Nutrisi) ===== */
// Membaca nama makanan (catatan makan `edb`) atau nama + bahan menu mingguan (`mpDb`), menebak sumber protein dan karbo dari kata kunci,
// lalu menandai menu yang monoton dan menyarankan pengganti. Murni hitungan di perangkat: tidak ada penyimpanan, tidak ke AI, tidak mengubah data.
// Pilihan sumber/pekan hanya disimpan di memori halaman (kembali ke bawaan saat dimuat ulang).
const FT_WIN = 14, FT_MIN_CAT = 5, FT_MIN_MENU = 3, FT_SHARE_MINDAYS = 7;   // jendela catatan (hari), minimal hari terklasifikasi (catatan / menu), minimal hari agar porsi dinilai
const FT_RUN = { p: 3, c: 5 }, FT_SHARE_PCT = { p: 70, c: 85 }, FT_SUB_FREQ_PCT = 40;            // monoton: sumber sama berturut-turut >= ini, atau muncul di >= persen ini hari terklasifikasi
// tabel: [id, label, kata kunci (token utuh atau frasa), kata pengecualian]
const FT_TBL = {
  p: [
    ['ayam', 'Ayam/unggas', ['ayam', 'bebek', 'kalkun', 'chicken']],
    ['telur', 'Telur', ['telur', 'telor', 'egg', 'eggs', 'omelet', 'omelette', 'dadar', 'ceplok', 'scrambled'], ['dadar gulung']],
    ['ikan', 'Ikan', ['ikan', 'tuna', 'tongkol', 'salmon', 'lele', 'nila', 'gurame', 'gurami', 'kembung', 'bandeng', 'patin', 'tenggiri', 'mujair', 'teri', 'cakalang', 'sarden', 'makarel', 'dori', 'gabus', 'haruan', 'papuyu', 'baung', 'saluang', 'pindang']],
    ['seafood', 'Udang/cumi/kerang', ['udang', 'cumi', 'kerang', 'kepiting', 'rajungan', 'sotong', 'lobster', 'shrimp', 'squid']],
    ['daging', 'Daging sapi/kambing', ['sapi', 'kambing', 'rendang', 'rawon', 'steak', 'beef', 'lamb', 'iga', 'dendeng']],
    ['kedelai', 'Tempe/tahu/kedelai', ['tempe', 'tempeh', 'tahu', 'tofu', 'oncom', 'kedelai', 'edamame']],
    ['kacang', 'Kacang-kacangan', ['kacang merah', 'kacang hijau', 'kacang tolo', 'lentil', 'chickpea']],
    ['susu', 'Susu/yogurt/keju', ['susu', 'yogurt', 'yoghurt', 'keju', 'whey', 'kefir', 'cottage']]
  ],
  c: [
    ['nasi', 'Nasi putih/lontong', ['nasi', 'beras', 'lontong', 'ketupat'], ['nasi merah', 'beras merah', 'nasi hitam', 'beras hitam', 'nasi coklat', 'brown rice']],
    ['nasi_merah', 'Nasi merah/beras utuh', ['nasi merah', 'beras merah', 'nasi hitam', 'beras hitam', 'nasi coklat', 'brown rice']],
    ['umbi', 'Ubi/singkong/kentang', ['ubi', 'singkong', 'kentang', 'talas', 'gembili', 'kimpul', 'sweet potato', 'potato']],
    ['oat', 'Oat/gandum utuh', ['oat', 'oats', 'oatmeal', 'havermut', 'gandum', 'granola']],
    ['roti', 'Roti/sandwich', ['roti', 'sandwich', 'tortilla', 'wrap', 'bagel', 'pita', 'toast']],
    ['mie', 'Mie/pasta', ['mie', 'mi', 'bihun', 'kwetiau', 'pasta', 'spaghetti', 'makaroni', 'soun', 'ramen', 'udon', 'soba', 'indomie']],
    ['jagung', 'Jagung', ['jagung', 'corn']]
  ]
};
const FT_PREF = { p: ['ikan', 'telur', 'kedelai', 'ayam', 'kacang', 'seafood', 'susu', 'daging'], c: ['nasi_merah', 'umbi', 'oat', 'jagung', 'mie', 'roti', 'nasi'] };   // urutan saran bila jumlah sama
const FT_EX = {
  ayam: 'dada ayam panggang atau rebus', telur: 'telur rebus, dadar, ceplok', ikan: 'ikan bakar, pepes, pindang, ikan haruan', seafood: 'udang atau cumi tumis',
  daging: 'daging sapi tanpa lemak, porsi kecil', kedelai: 'tempe orek, tahu bacem', kacang: 'sup kacang merah', susu: 'yogurt tanpa gula',
  nasi: 'nasi putih', nasi_merah: 'nasi merah', umbi: 'ubi, singkong, atau kentang rebus', oat: 'oatmeal', roti: 'roti gandum', mie: 'mi atau bihun, porsi kecil', jagung: 'jagung rebus'
};
let ftSrc = 'cat', ftWk = 0;   // 'cat' = catatan makan 14 hari; 'menu' = menu mingguan (ftWk 0 = pekan ini, 1 = pekan depan)
const ftNorm = s => ' ' + String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const ftHit = (pad, kw) => pad.indexOf(' ' + kw + ' ') >= 0 || pad.indexOf(' ' + kw + 'nya ') >= 0;
function ftCats(text, type) {   // id sumber yang dikenali dari satu teks (urutan tabel)
  const pad = ftNorm(text), out = [];
  FT_TBL[type].forEach(c => {
    if (c[3] && c[3].some(k => ftHit(pad, k))) return;
    if (c[2].some(k => ftHit(pad, k))) out.push(c[0]);
  });
  return out;
}
const ftLbl = (t, id) => { const c = FT_TBL[t].find(x => x[0] === id); return c ? c[1] : id; };
function ftItems(d, mode) {
  if (mode === 'menu') return mpItems(d).map(x => ({ name: x.n, txt: x.n + ' ' + (x.b || '') }));
  return (edb[d] || []).map(x => ({ name: x.n, txt: x.n }));
}
function ftDates(mode, wk, end) {
  const out = [];
  if (mode === 'menu') { const st = addDays(weekStart(end), wk ? 7 : 0); for (let i = 0; i < 7; i++) out.push(addDays(st, i)); }
  else for (let i = FT_WIN - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}
function ftSub(t, cnt, over, classified) {   // pengganti: bukan yang berlebih; yang belum sering (< FT_SUB_FREQ_PCT persen hari) didahulukan menurut urutan preferensi, sisanya menurut paling jarang; maks 3
  const rank = id => FT_PREF[t].indexOf(id), rare = id => cnt[id] * 100 < classified * FT_SUB_FREQ_PCT;
  const ids = FT_TBL[t].map(c => c[0]).filter(id => over.indexOf(id) < 0);
  const a = ids.filter(rare).sort((x, y) => rank(x) - rank(y)), b = ids.filter(id => !rare(id)).sort((x, y) => (cnt[x] - cnt[y]) || (rank(x) - rank(y)));
  return a.concat(b).slice(0, 3);
}
function ftType(days, t, mode) {
  const key = t === 'p' ? 'P' : 'C', tbl = FT_TBL[t], cnt = {}, cur = {};
  tbl.forEach(c => { cnt[c[0]] = 0; cur[c[0]] = null; });
  let classified = 0, best = null;
  days.forEach(x => {
    const S = x[key]; if (S.size) classified++;
    tbl.forEach(c => {
      const id = c[0];
      if (S.has(id)) {
        cnt[id]++;
        cur[id] = cur[id] ? { len: cur[id].len + 1, from: cur[id].from } : { len: 1, from: x.d };
        const r = { id, len: cur[id].len, from: cur[id].from, to: x.d };
        if (!best || r.len > best.len || (r.len === best.len && r.to > best.to)) best = r;
      } else cur[id] = null;
    });
  });
  let top = null; tbl.forEach(c => { if (cnt[c[0]] > 0 && (!top || cnt[c[0]] > cnt[top])) top = c[0]; });
  const enough = classified >= (mode === 'menu' ? FT_MIN_MENU : FT_MIN_CAT);
  const flagRun = enough && !!best && best.len >= FT_RUN[t];
  const flagShare = enough && classified >= FT_SHARE_MINDAYS && !!top && cnt[top] * 100 >= classified * FT_SHARE_PCT[t];
  const over = []; if (flagRun) over.push(best.id); if (flagShare && over.indexOf(top) < 0) over.push(top);
  return { cnt, classified, distinct: tbl.filter(c => cnt[c[0]] > 0).length, top, run: best, enough, flagRun, flagShare, flag: flagRun || flagShare, over, sub: (flagRun || flagShare) ? ftSub(t, cnt, over, classified) : [] };
}
function ftAnalyze(mode, wk, end) {
  const dates = ftDates(mode, wk, end), days = [], unk = [], seenU = new Set();
  let nUnk = 0, nItems = 0;
  dates.forEach(d => {
    const it = ftItems(d, mode), P = new Set(), C = new Set();
    it.forEach(x => {
      const p = ftCats(x.txt, 'p'), c = ftCats(x.txt, 'c');
      p.forEach(i => P.add(i)); c.forEach(i => C.add(i));
      nItems++;
      if (!p.length && !c.length) {
        nUnk++;
        const k = String(x.name).toLowerCase();
        if (!seenU.has(k) && unk.length < 3) { seenU.add(k); unk.push(String(x.name).slice(0, 24)); }
      }
    });
    days.push({ d, n: it.length, P, C });
  });
  const A = { mode, wk, dates, days, items: nItems, nUnk, unk, dataDays: days.filter(x => x.n).length, p: ftType(days, 'p', mode), c: ftType(days, 'c', mode) };
  A.kind = (!A.p.enough && !A.c.enough) ? 'data' : (A.p.flag || A.c.flag) ? 'monoton' : 'ok';
  return A;
}
function ftReason(t, X) {   // kalimat alasan monoton untuk satu jenis
  const out = [];
  if (X.flagRun) out.push(ftLbl(t, X.run.id) + ' ' + X.run.len + ' hari berturut-turut (' + shortDate(X.run.from) + '–' + shortDate(X.run.to) + ')');
  if (X.flagShare) out.push(ftLbl(t, X.top) + ' muncul di ' + X.cnt[X.top] + ' dari ' + X.classified + ' hari (' + Math.round(X.cnt[X.top] * 100 / X.classified) + '%)');
  return out.join('; ');
}
function ftTypeHTML(t, A) {
  const X = A[t], tbl = FT_TBL[t], min = A.mode === 'menu' ? FT_MIN_MENU : FT_MIN_CAT;
  let h = '<div class="sublbl">' + (t === 'p' ? 'Sumber protein' : 'Sumber karbo') + '</div>';
  if (!X.enough) return h + '<p class="note">Belum cukup data: ' + X.classified + ' hari yang menyebut sumber ' + (t === 'p' ? 'protein' : 'karbo') + ', butuh minimal ' + min + '.</p>';
  tbl.map(c => c[0]).filter(id => X.cnt[id] > 0).sort((a, b) => X.cnt[b] - X.cnt[a] || tbl.findIndex(c => c[0] === a) - tbl.findIndex(c => c[0] === b))
    .forEach(id => { h += kv(esc(ftLbl(t, id)), X.cnt[id] + ' dari ' + X.classified + ' hari'); });
  h += kv('Jenis berbeda', X.distinct + ' dari ' + tbl.length);
  if (X.run) h += '<p class="note">Berturut-turut terpanjang: ' + esc(ftLbl(t, X.run.id)) + ', ' + X.run.len + ' hari (' + esc(shortDate(X.run.from) + '–' + shortDate(X.run.to)) + ').</p>';
  if (X.flag) {
    h += '<p class="note" style="color:var(--ink)"><b>Monoton:</b> ' + esc(ftReason(t, X)) + '.</p>';
    h += '<div class="sublbl">Saran pengganti</div>' + X.sub.map(id => kv(esc(ftLbl(t, id)), esc(FT_EX[id]) + (X.cnt[id] ? ' · ' + X.cnt[id] + ' hari' : ' · belum muncul'))).join('');
  } else h += '<p class="note" style="color:var(--ink)">Variasi cukup.</p>';
  return h;
}
function ftSectionHTML() {
  const t = today(), A = ftAnalyze(ftSrc, ftWk, t), menu = ftSrc === 'menu';
  const col = A.kind === 'monoton' ? 'var(--bad)' : A.kind === 'ok' ? 'var(--ok)' : 'var(--mute)';
  let title, body;
  if (A.kind === 'data') {
    title = 'Belum cukup data';
    body = menu ? 'Isi menu minimal ' + FT_MIN_MENU + ' hari di pekan ini, dengan nama atau bahan yang menyebut protein atau karbo (protein ' + A.p.classified + ' hari, karbo ' + A.c.classified + ' hari).'
      : 'Catat makanan di Jurnal minimal ' + FT_MIN_CAT + ' hari dalam ' + FT_WIN + ' hari terakhir dengan nama yang menyebut protein atau karbo (protein ' + A.p.classified + ' hari, karbo ' + A.c.classified + ' hari).';
  } else if (A.kind === 'monoton') {
    title = 'Menu mulai monoton';
    body = ['p', 'c'].filter(k => A[k].flag).map(k => (k === 'p' ? 'Protein: ' : 'Karbo: ') + ftReason(k, A[k])).join('. ') + '.';
  } else {
    title = 'Variasi cukup';
    body = 'Tidak ada sumber protein atau karbo yang berulang melewati batas.' + ((!A.p.enough || !A.c.enough) ? ' Salah satu jenis masih kurang data.' : '');
  }
  let h = '<section class="sec" id="ftSec"><h2>Variasi menu</h2>' +
    '<p class="note" style="margin-top:12px">Memantau variasi sumber protein dan karbo agar tidak jenuh. Sumber ditebak dari kata kunci pada nama makanan, bukan dari kandungan gizi, jadi bisa keliru (mis. susu di dalam kopi).</p>' +
    '<div class="sublbl">Sumber data</div><div class="seg" role="group" aria-label="Sumber data variasi">' +
    '<button type="button" class="pill" data-q="ftSrc" data-v="cat" aria-pressed="' + String(!menu) + '">Catatan makan</button>' +
    '<button type="button" class="pill" data-q="ftSrc" data-v="menu" aria-pressed="' + String(menu) + '">Menu mingguan</button></div>';
  if (menu) h += '<div class="seg" role="group" aria-label="Pekan menu">' +
    '<button type="button" class="pill" data-q="ftWk" data-v="0" aria-pressed="' + String(!ftWk) + '">Pekan ini</button>' +
    '<button type="button" class="pill" data-q="ftWk" data-v="1" aria-pressed="' + String(!!ftWk) + '">Pekan depan</button></div>';
  h += '<p class="note">' + (menu ? 'Menu ' + (ftWk ? 'pekan depan' : 'pekan ini') + ': ' + esc(shortDate(A.dates[0]) + '–' + shortDate(A.dates[6])) + '.'
    : FT_WIN + ' hari terakhir: ' + esc(shortDate(A.dates[0]) + '–' + shortDate(A.dates[FT_WIN - 1])) + ' (hari ini ikut bila sudah ada catatan).') + ' Hari berisi: ' + A.dataDays + '.</p>' +
    '<div class="note" role="status" data-ft="' + A.kind + '" style="border-left:4px solid ' + col + ';padding:8px 12px;color:var(--ink)"><b>' + esc(title) + '</b><br>' + esc(body) + '</div>';
  if (A.dataDays) h += ftTypeHTML('p', A) + ftTypeHTML('c', A);
  if (A.nUnk) h += '<p class="note">' + A.nUnk + ' item tidak terbaca sebagai protein atau karbo (mis. sayur, buah, minuman): ' + esc(A.unk.join(', ')) + (A.nUnk > A.unk.length ? ', dan lainnya' : '') + '.</p>';
  return h + '<p class="note">Monoton bila satu sumber protein berturut-turut ' + FT_RUN.p + ' hari atau lebih, atau muncul di ' + FT_SHARE_PCT.p + ' persen hari atau lebih; untuk karbo ' + FT_RUN.c + ' hari berturut-turut atau ' + FT_SHARE_PCT.c + ' persen (porsi dinilai bila minimal ' + FT_SHARE_MINDAYS + ' hari). Angka dan urutan saran ini pilihan saya, bukan dari sumber ilmiah. Nasi putih tiap hari lazim di Indonesia; saran karbo hanya untuk variasi. Sumber pengganti punya protein dan kalori berbeda: cek porsinya di Jurnal. Ini bukan saran medis.</p></section>';
}
function ftRender() { const y = window.scrollY; renderNutrition(); try { window.scrollTo(0, y); } catch (e) { /* abaikan */ } }
QACT.ftSrc = el => { const v = el && el.dataset && el.dataset.v; if (v === 'cat' || v === 'menu') { ftSrc = v; ftRender(); } };
QACT.ftWk = el => { const v = el && el.dataset && el.dataset.v; if (v === '0' || v === '1') { ftWk = +v; ftRender(); } };
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83e: Object.freeze({ cats: ftCats, analyze: ftAnalyze, html: ftSectionHTML, sub: ftSub, tbl: FT_TBL, state: () => ({ src: ftSrc, wk: ftWk }),
  lim: Object.freeze({ WIN: FT_WIN, MIN_CAT: FT_MIN_CAT, MIN_MENU: FT_MIN_MENU, SHARE_MINDAYS: FT_SHARE_MINDAYS, RUN: FT_RUN, SHARE_PCT: FT_SHARE_PCT, SUB_FREQ_PCT: FT_SUB_FREQ_PCT }) }) })); }, 0);
/* ===== AKHIR 83e ===== */

/* ===== MODUL: 83d MIKRONUTRIEN (PERKIRAAN) + KEPADATAN GIZI (Nutrisi) ===== */
// Dua kartu di halaman Nutrisi. Keduanya MENEBAK dari kata kunci pada nama makanan di Catatan makan (`edb`), bukan dari kandungan gizi:
// (1) Mikronutrien: peta panas zat besi, kalsium, vitamin D, B-kompleks per hari (ada sumber atau tidak) + penanda suplemen yang diminum (Self Care);
// (2) Kepadatan gizi: skor 0-100 dari porsi KALORI yang berasal dari makanan padat gizi vs kalori kosong.
// Murni hitungan di perangkat: tidak ada penyimpanan, tidak ke AI, tidak mengubah data. Pilihan jendela hanya di memori halaman.
const MN_MIN_DAYS = 4, MN_LOW_PCT = 50, MN_PTS_STRONG = 2, MN_PTS_MID = 1;   // minimal hari tercatat agar dinilai; rendah bila hari ber-sumber < persen ini dari hari tercatat
const ND_AVG = 7, ND_CHART = 14, ND_MIN_DAYS = 3, ND_W_P = 1, ND_W_N = 0.5, ND_W_K = 0, ND_BAND = { good: 70, mid: 50 };   // jendela rata-rata, jendela grafik, minimal hari ber-kalori, bobot padat/netral/kosong, batas pita
// nutrisi: [id, label, kata kunci KUAT (2 poin), kata kunci SEDANG (1 poin), contoh makanan untuk saran]
const MN_TBL = [
  ['fe', 'Zat besi',
    ['hati', 'ati', 'jeroan', 'sapi', 'kambing', 'rendang', 'rawon', 'iga', 'dendeng', 'beef', 'lamb', 'steak', 'kerang', 'tiram', 'remis', 'bayam', 'spinach', 'daun singkong', 'kacang merah', 'lentil', 'kacang tolo'],
    ['tempe', 'tempeh', 'tahu', 'tofu', 'telur', 'telor', 'egg', 'eggs', 'kangkung', 'kacang hijau', 'edamame', 'kedelai', 'sarden', 'brokoli', 'sawi'],
    'hati ayam, daging sapi tanpa lemak, bayam atau daun singkong, kacang merah, tempe'],
  ['ca', 'Kalsium',
    ['susu', 'yogurt', 'yoghurt', 'keju', 'kefir', 'teri', 'ebi', 'sarden'],
    ['tahu', 'tofu', 'tempe', 'brokoli', 'sawi', 'kale', 'almond', 'wijen', 'bandeng', 'edamame', 'daun singkong'],
    'susu atau yogurt, ikan teri, tahu, sawi atau brokoli'],
  ['d', 'Vitamin D',
    ['salmon', 'sarden', 'makarel', 'hering', 'minyak ikan', 'fish oil'],
    ['tuna', 'tongkol', 'cakalang', 'kembung', 'bandeng', 'lemuru', 'tenggiri', 'telur', 'telor', 'egg', 'eggs', 'jamur', 'mushroom', 'susu', 'yogurt', 'yoghurt', 'keju'],
    'ikan berlemak (salmon, sarden, makarel, kembung), telur utuh; sumber utama tetap sinar matahari pagi'],
  ['b', 'B-kompleks',
    ['hati', 'ati', 'jeroan', 'sapi', 'kambing', 'rendang', 'rawon', 'iga', 'dendeng', 'beef', 'steak', 'kerang', 'tiram', 'remis', 'salmon', 'tuna', 'tongkol', 'sarden', 'makarel'],
    ['ikan', 'kembung', 'bandeng', 'lele', 'nila', 'tenggiri', 'patin', 'ayam', 'bebek', 'telur', 'telor', 'egg', 'eggs', 'susu', 'yogurt', 'yoghurt', 'keju', 'tempe', 'kacang merah', 'kacang hijau', 'kacang tanah', 'kacang tolo', 'lentil', 'edamame', 'kedelai', 'nasi merah', 'beras merah', 'oat', 'oatmeal', 'havermut', 'gandum', 'bayam', 'brokoli', 'alpukat', 'pisang'],
    'telur, ikan, daging tanpa lemak, kacang-kacangan, nasi merah atau oat, sayur hijau']
];
const MN_SUP = { fe: 'fe', ca: 'ca', d: 'd3k2' };   // suplemen Self Care yang menutup zat itu (B-kompleks tidak punya)
const MN_PHR = [[' susu sapi ', ' susu '], [' susu kambing ', ' susu '], [' susu kedelai ', ' kedelai '], [' susu almond ', ' almond '], [' telur ayam ', ' telur '], [' telur bebek ', ' telur '], [' ayam kampung ', ' ayam ']];   // frasa yang tidak boleh terbaca sebagai sumber lain
let mnW = 14;   // jendela peta panas: 7 atau 14 hari
const mnNorm = s => {
  let p = ' ' + String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  MN_PHR.forEach(r => { p = p.split(r[0]).join(r[1]); });
  return p;
};
const mnHit = (pad, kw) => pad.indexOf(' ' + kw + ' ') >= 0 || pad.indexOf(' ' + kw + 'nya ') >= 0;
function mnPts(text, id) {   // poin sumber satu teks untuk satu zat: 2 kuat, 1 sedang, 0 tidak ada
  const t = MN_TBL.find(x => x[0] === id); if (!t) return 0;
  const pad = mnNorm(text);
  if (t[2].some(k => mnHit(pad, k))) return MN_PTS_STRONG;
  if (t[3].some(k => mnHit(pad, k))) return MN_PTS_MID;
  return 0;
}
function mnSupDay(d, supId) {   // suplemen diminum hari itu (Self Care `days[d].sp`)
  try { if (typeof scDay !== 'function') return false; const sp = scDay(d).sp; return Array.isArray(sp) && sp.includes(supId); } catch (e) { return false; }
}
function mnDates(w, end) { const out = []; for (let i = w - 1; i >= 0; i--) out.push(addDays(end, -i)); return out; }
function mnAnalyze(w, end) {
  const dates = mnDates(w, end), nut = {};
  MN_TBL.forEach(t => {
    const id = t[0], cells = dates.map(d => {
      const items = edb[d] || [], logged = items.length > 0;
      let pts = 0; const src = [];
      items.forEach(x => { const q = mnPts(x.n, id); if (q > 0) { pts += q; if (src.length < 3 && !src.includes(x.n)) src.push(x.n); } });
      return { d, logged, lvl: !logged ? null : pts >= 2 ? 2 : pts === 1 ? 1 : 0, src, sup: MN_SUP[id] ? mnSupDay(d, MN_SUP[id]) : false };
    });
    const L = cells.filter(c => c.logged).length, S = cells.filter(c => c.lvl > 0).length;
    let tail = 0;   // hari tercatat berturut-turut tanpa sumber, dihitung mundur dari hari tercatat terakhir
    for (let i = cells.length - 1; i >= 0; i--) { if (!cells[i].logged) continue; if (cells[i].lvl > 0) break; tail++; }
    const status = L < MN_MIN_DAYS ? 'data' : (S * 100 < L * MN_LOW_PCT ? 'rendah' : 'cukup');
    nut[id] = { id, label: t[1], cells, L, S, tail, status, sup: cells.filter(c => c.sup).length, ex: t[4] };
  });
  const st = MN_TBL.map(t => nut[t[0]].status);
  return { w, dates, nut, kind: st.every(s => s === 'data') ? 'data' : st.includes('rendah') ? 'rendah' : 'ok', dataDays: dates.filter(d => (edb[d] || []).length).length };
}
// ---- kepadatan gizi ----
const ND_K = ['gorengan', 'bakwan', 'cireng', 'risol', 'kerupuk', 'krupuk', 'keripik', 'chips', 'donat', 'donut', 'kue', 'cake', 'brownies', 'biskuit', 'cookies', 'permen', 'cokelat', 'coklat', 'es krim', 'ice cream', 'boba', 'soda', 'sirup', 'es teh', 'es jeruk', 'es campur', 'cendol', 'teh manis', 'kopi manis', 'minuman manis', 'martabak manis', 'susu kental manis', 'mie instan', 'indomie', 'burger', 'pizza', 'kentang goreng', 'french fries', 'nugget', 'sosis', 'kornet', 'goreng tepung', 'pisang goreng', 'jus kemasan', 'gula'];
const ND_P = ['sayur', 'bayam', 'kangkung', 'brokoli', 'wortel', 'tomat', 'timun', 'buncis', 'kol', 'sawi', 'labu', 'terong', 'tauge', 'capcay', 'pecel', 'gado', 'urap', 'salad', 'lalapan', 'sup', 'sop', 'buah', 'apel', 'pisang', 'jeruk', 'mangga', 'pepaya', 'semangka', 'melon', 'alpukat', 'jambu', 'anggur', 'nanas', 'nenas', 'salak', 'telur', 'telor', 'egg', 'eggs', 'ikan', 'tuna', 'tongkol', 'salmon', 'lele', 'nila', 'kembung', 'bandeng', 'teri', 'sarden', 'ayam', 'bebek', 'udang', 'cumi', 'kerang', 'tempe', 'tahu', 'tofu', 'kacang', 'edamame', 'lentil', 'nasi merah', 'beras merah', 'oat', 'oatmeal', 'havermut', 'gandum', 'ubi', 'singkong', 'jagung', 'yogurt', 'yoghurt', 'sapi', 'kambing', 'steak'];
function ndClass(name) {   // 'k' kalori kosong (menang bila keduanya cocok), 'p' padat gizi, 'n' netral/tak terbaca
  const pad = mnNorm(name);
  if (ND_K.some(k => mnHit(pad, k))) return 'k';
  if (ND_P.some(k => mnHit(pad, k))) return 'p';
  return 'n';
}
function ndScore(P, N, K) { const T = P + N + K; return T > 0 ? Math.round(100 * (ND_W_P * P + ND_W_N * N + ND_W_K * K) / T) : null; }
function ndDay(d) {
  const s = { d, P: 0, N: 0, K: 0, n: 0, items: [] };
  (edb[d] || []).forEach(x => { if (x.kcal != null && x.kcal > 0) { const c = ndClass(x.n); s[c.toUpperCase()] += x.kcal; s.n++; s.items.push({ n: x.n, kcal: x.kcal, c }); } });
  s.score = s.n ? ndScore(s.P, s.N, s.K) : null;
  return s;
}
const ndBand = sc => sc == null ? 'data' : sc >= ND_BAND.good ? 'good' : sc >= ND_BAND.mid ? 'mid' : 'low';
function ndTop(days, c, lim) {   // nama teratas menurut jumlah kalori (nama digabung tanpa memandang huruf besar)
  const m = {};
  days.forEach(s => s.items.forEach(x => { if (x.c !== c) return; const k = String(x.n).toLowerCase().replace(/\s+/g, ' ').trim(); (m[k] = m[k] || { n: x.n, kcal: 0, times: 0 }); m[k].kcal += x.kcal; m[k].times++; }));
  return Object.keys(m).map(k => m[k]).sort((a, b) => b.kcal - a.kcal || (a.n < b.n ? -1 : 1)).slice(0, lim).map(x => ({ n: x.n, kcal: Math.round(x.kcal), times: x.times }));
}
function ndAnalyze(end) {
  const chart = []; for (let i = ND_CHART - 1; i >= 0; i--) chart.push(ndDay(addDays(end, -i)));
  const wk = chart.slice(ND_CHART - ND_AVG), act = wk.filter(s => s.n > 0);
  const P = act.reduce((a, s) => a + s.P, 0), N = act.reduce((a, s) => a + s.N, 0), K = act.reduce((a, s) => a + s.K, 0);
  const enough = act.length >= ND_MIN_DAYS, avg = enough ? ndScore(P, N, K) : null, tod = chart[ND_CHART - 1];
  const tot = P + N + K, unkN = act.reduce((a, s) => a + s.items.filter(x => x.c === 'n').length, 0);
  return { chart, today: tod, avg, enough, days: act.length, band: ndBand(avg), P, N, K, shareK: tot ? Math.round(100 * K / tot) : null, shareP: tot ? Math.round(100 * P / tot) : null, shareN: tot ? Math.round(100 * N / tot) : null,
    topK: ndTop(act, 'k', 3), topP: ndTop(act, 'p', 3), topN: ndTop(act, 'n', 3), unkN };
}
// ---- tampilan ----
const MN_LVL = ['Tidak ada sumber', 'Ada sumber', 'Banyak sumber'];
function mnCellHTML(nutLabel, c) {
  const lab = nutLabel + ', ' + shortDate(c.d) + ': ' + (c.logged ? MN_LVL[c.lvl] + (c.src.length ? ' (' + c.src.join(', ') + ')' : '') : 'tidak ada catatan makan') + (c.sup ? ', suplemen diminum' : '');
  const bg = !c.logged ? 'transparent' : c.lvl === 2 ? 'var(--hx4)' : c.lvl === 1 ? 'var(--hx2)' : 'transparent';
  const bd = !c.logged ? '1px dashed var(--rule)' : c.lvl === 0 ? '1px solid var(--bad)' : '1px solid transparent';
  return '<div role="img" aria-label="' + esc(lab) + '" data-lvl="' + (c.logged ? c.lvl : 'x') + '"' + (c.sup ? ' data-sup="1"' : '') + ' style="height:22px;border-radius:5px;background:' + bg + ';border:' + bd + ';position:relative;box-sizing:border-box">' +
    (c.sup ? '<i style="position:absolute;right:2px;bottom:2px;width:6px;height:6px;border-radius:50%;background:var(--ink)"></i>' : '') + '</div>';
}
function mnSectionHTML() {
  const t = today(), A = mnAnalyze(mnW, t), cols = 'grid-template-columns:78px repeat(' + A.w + ',minmax(0,1fr));gap:3px;align-items:center';
  let title, body, col;
  if (A.kind === 'data') { title = 'Belum cukup data'; body = 'Catat makanan di Jurnal minimal ' + MN_MIN_DAYS + ' hari dalam ' + A.w + ' hari terakhir (sekarang ' + A.dataDays + ' hari).'; col = 'var(--mute)'; }
  else if (A.kind === 'rendah') { title = 'Ada zat yang jarang muncul'; body = MN_TBL.filter(x => A.nut[x[0]].status === 'rendah').map(x => x[1]).join(', ') + ': sumbernya terbaca di kurang dari ' + MN_LOW_PCT + ' persen hari yang tercatat.'; col = 'var(--bad)'; }
  else { title = 'Sumber cukup beragam'; body = 'Tiap zat yang cukup datanya terbaca punya sumber di setidaknya ' + MN_LOW_PCT + ' persen hari tercatat.'; col = 'var(--ok)'; }
  let h = '<section class="sec" id="mnSec"><h2>Mikronutrien (perkiraan)</h2>' +
    '<p class="note" style="margin-top:12px">Peta panas zat besi, kalsium, vitamin D, dan B-kompleks. Hanya MENEBAK dari kata pada nama makanan (mis. hati, bayam, susu, ikan), bukan hitungan miligram, jadi bisa keliru. Bukan pengganti tes darah atau saran dokter.</p>' +
    '<div class="seg" role="group" aria-label="Jendela peta panas"><button type="button" class="pill" data-q="mnWin" data-v="7" aria-pressed="' + String(mnW === 7) + '">7 hari</button><button type="button" class="pill" data-q="mnWin" data-v="14" aria-pressed="' + String(mnW === 14) + '">14 hari</button></div>' +
    '<div class="note" role="status" data-mn="' + A.kind + '" style="border-left:4px solid ' + col + ';padding:8px 12px;color:var(--ink)"><b>' + esc(title) + '</b><br>' + esc(body) + '</div>' +
    '<div id="mnGrid" style="display:grid;' + cols + ';margin:10px 0 4px" role="group" aria-label="Peta panas mikronutrien ' + A.w + ' hari">';
  MN_TBL.forEach(x => { const n = A.nut[x[0]]; h += '<div style="font-size:.78rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.label) + '</div>' + n.cells.map(c => mnCellHTML(n.label, c)).join(''); });
  h += '</div><p class="note" style="margin-top:2px">' + esc(shortDate(A.dates[0]) + ' sampai ' + shortDate(A.dates[A.w - 1])) + '. Hijau tua = banyak sumber, hijau muda = ada sumber, bingkai merah = dicatat tapi tidak ada sumber, garis putus = tidak ada catatan makan, titik = suplemen diminum (Self Care).</p>';
  MN_TBL.forEach(x => {
    const n = A.nut[x[0]];
    h += '<div class="sublbl">' + esc(n.label) + '</div>';
    if (n.status === 'data') h += '<p class="note">Belum cukup data: ' + n.L + ' hari tercatat, butuh minimal ' + MN_MIN_DAYS + '.</p>';
    else {
      h += kv('Hari ber-sumber', n.S + ' dari ' + n.L + ' hari tercatat');
      if (n.tail >= 2) h += '<p class="note">Tanpa sumber ' + n.tail + ' hari tercatat berturut-turut terakhir.</p>';
      if (n.status === 'rendah') h += '<p class="note" style="color:var(--ink)"><b>Jarang muncul.</b> Contoh sumber: ' + esc(n.ex) + '.</p>';
    }
    if (MN_SUP[n.id] && n.sup) h += '<p class="note">Suplemen diminum ' + n.sup + ' dari ' + A.w + ' hari (dari Self Care); tidak dihitung sebagai sumber makanan.</p>';
  });
  return h + '<p class="note">Satu item dinilai sumber kuat (2 poin) atau sedang (1 poin) menurut tabel kata kunci saya; 2 poin atau lebih dalam sehari = banyak sumber. Porsi tidak dibaca: hati ayam 20 gram dan 200 gram sama saja. Vitamin D terutama dari sinar matahari, bukan makanan; B12 hampir hanya dari pangan hewani.</p></section>';
}
function ndSectionHTML() {
  const t = today(), A = ndAnalyze(t), bl = { good: 'Padat gizi', mid: 'Cukup', low: 'Banyak kalori kosong', data: 'Belum cukup data' }[A.band], col = { good: 'var(--ok)', mid: 'var(--mute)', low: 'var(--bad)', data: 'var(--mute)' }[A.band];
  let h = '<section class="sec" id="ndSec"><h2>Kepadatan gizi</h2>' +
    '<p class="note" style="margin-top:12px">Skor 0-100: porsi KALORI dari makanan padat gizi (sayur, buah, telur, ikan, ayam, tempe, tahu, kacang, biji-bijian utuh, umbi) dibanding kalori kosong (gorengan, minuman manis, kue, mie instan, makanan cepat saji). Makanan lain (nasi putih, roti, dll) dihitung netral. Ditebak dari nama makanan, bukan dari kandungan gizi.</p>' +
    '<div class="note" role="status" data-nd="' + A.band + '" style="border-left:4px solid ' + col + ';padding:8px 12px;color:var(--ink)"><b>' + esc(bl) + '</b><br>' +
    (A.enough ? 'Rata-rata ' + ND_AVG + ' hari: skor ' + A.avg + ' (dari ' + A.days + ' hari ber-kalori).' : 'Butuh minimal ' + ND_MIN_DAYS + ' hari ber-kalori dalam ' + ND_AVG + ' hari terakhir (sekarang ' + A.days + ').') + '</div>';
  h += kv('Hari ini', A.today.score == null ? 'belum ada makanan ber-kalori' : 'skor ' + A.today.score + ' (' + fmt(A.today.n, 0) + ' item)');
  if (A.enough) h += kv('Kalori padat gizi', A.shareP + '%') + kv('Kalori netral', A.shareN + '%') + kv('Kalori kosong', A.shareK + '%');
  h += '<div class="sublbl">Skor harian ' + ND_CHART + ' hari</div><div id="ndChart" style="display:flex;align-items:flex-end;gap:3px;height:64px;margin:6px 0 4px" role="img" aria-label="Skor kepadatan gizi harian: ' + esc(A.chart.map(s => shortDate(s.d) + ' ' + (s.score == null ? 'tidak ada data' : s.score)).join(', ')) + '">' +
    A.chart.map(s => '<div data-sc="' + (s.score == null ? '' : s.score) + '" style="flex:1 1 0;min-width:0;height:' + (s.score == null ? 3 : Math.max(4, Math.round(s.score * 0.64))) + 'px;border-radius:3px;background:' + (s.score == null ? 'var(--rule)' : s.score >= ND_BAND.good ? 'var(--ok)' : s.score >= ND_BAND.mid ? 'var(--hx3)' : 'var(--bad)') + '"></div>').join('') + '</div>' +
    '<p class="note" style="margin-top:2px">' + esc(shortDate(A.chart[0].d) + ' sampai ' + shortDate(A.chart[ND_CHART - 1].d)) + '. Batang abu-abu pendek = tidak ada data.</p>';
  if (A.enough) {
    if (A.topK.length) h += '<div class="sublbl">Kalori kosong terbesar (' + ND_AVG + ' hari)</div>' + A.topK.map(x => kv(esc(x.n), x.times + 'x · ' + fmt(x.kcal, 0) + ' kkal')).join('');
    if (A.topP.length) h += '<div class="sublbl">Padat gizi terbanyak (' + ND_AVG + ' hari)</div>' + A.topP.map(x => kv(esc(x.n), x.times + 'x · ' + fmt(x.kcal, 0) + ' kkal')).join('');
    if (A.unkN) h += '<p class="note">' + A.unkN + ' item tidak terbaca (dihitung netral)' + (A.topN.length ? ', mis. ' + esc(A.topN.map(x => x.n).join(', ')) : '') + '.</p>';
  }
  return h + '<p class="note">Pita: ' + ND_BAND.good + ' ke atas = padat gizi, ' + ND_BAND.mid + '-' + (ND_BAND.good - 1) + ' = cukup, di bawah ' + ND_BAND.mid + ' = banyak kalori kosong. Bobot padat 1, netral 0,5, kosong 0 adalah pilihan saya, bukan standar ilmiah. Item tanpa kalori tidak dihitung. Bila nama makanan mengandung kata padat dan kosong sekaligus (mis. "ayam goreng tepung"), kosong menang.</p></section>';
}
function mnRender() { const y = window.scrollY; renderNutrition(); try { window.scrollTo(0, y); } catch (e) { /* abaikan */ } }
QACT.mnWin = el => { const v = el && el.dataset && el.dataset.v; if (v === '7' || v === '14') { mnW = +v; mnRender(); } };
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83d: Object.freeze({ pts: mnPts, analyze: mnAnalyze, nd: ndAnalyze, ndClass, ndScore, ndDay, html: mnSectionHTML, htmlNd: ndSectionHTML, tbl: MN_TBL, ndK: ND_K, ndP: ND_P, state: () => ({ w: mnW }),
  lim: Object.freeze({ MN_MIN_DAYS, MN_LOW_PCT, MN_PTS_STRONG, MN_PTS_MID, ND_AVG, ND_CHART, ND_MIN_DAYS, ND_W_P, ND_W_N, ND_W_K, ND_BAND }) }) })); }, 0);
/* ===== AKHIR 83d ===== */

/* ===== MODUL: 83g HIERARKI 4 ZONA HALAMAN NUTRISI (Nutrisi) ===== */
// Menyusun kartu halaman Nutrisi ke 4 zona menurut Bagian 1 blueprint Word: Zona 1 Pelacak harian, Zona 2 Performa dan pemulihan, Zona 3 Gizi dan fase, Zona 4 Menu dan belanja.
// Tiap zona = satu pita yang bisa dilipat (ketuk) berisi ringkasan satu baris dari data yang sudah ada. Isi kartu TIDAK diubah, hanya urutan dan pembungkusnya.
// Murni tampilan: tidak ada penyimpanan, tidak ke AI, tidak mengubah data. Keadaan lipat hanya di memori halaman (kembali terbuka semua saat dimuat ulang).
const NZ = [
  { id: 1, name: 'Pelacak harian', cards: ['Target hari ini', 'Elektrolit dan kaki'] },
  { id: 2, name: 'Performa dan pemulihan', cards: ['Kelelahan harian', 'Risiko kram', 'Beban ride dan elektrolit', 'Pola kram', 'Keringat dan natrium', 'Peringatan performa', 'Berat, rata-rata 7 hari'] },
  { id: 3, name: 'Gizi dan fase', cards: ['Makro per fase', 'Plateau dan refeed day', 'Mikronutrien (perkiraan)', 'Kepadatan gizi'] },
  { id: 4, name: 'Menu dan belanja', cards: ['Menu mingguan', 'Daftar belanja', 'Variasi menu'] }
];
const nzClosed = {};   // id zona -> true bila dilipat
function nzTitle(s) { const m = /<h2>([^<]*)<\/h2>/.exec(s); return m ? m[1] : ''; }
function nzZoneOf(title) { const z = NZ.find(x => x.cards.indexOf(title) >= 0); return z ? z.id : 0; }   // 0 = kartu tak dikenal, tampil di akhir tanpa pita
function nzSummary(id) {   // { text, flag } satu baris dari data yang sudah ada; galat apa pun -> teks kosong
  try {
    const t = today(), T = tgFor(t);
    if (id === 1) {
      const e = db[t] || blank(), k = num(e.kcal), p = num(e.protein), w = num(e.water), n = ELEC.filter(it => elecDone(t, it)).length;
      return { text: 'Kalori ' + (k == null ? '–' : fmt(k, 0)) + ' dari ' + kcalTgt(T) + ' · protein ' + (p == null ? '–' : fmt(p, 0)) + ' dari ' + fmt(T.protein, 0) + ' g · air ' + (w == null ? '–' : fmt(w, 2)) + ' dari ' + T.water + ' L · ceklis elektrolit ' + n + ' dari ' + ELEC.length, flag: false };
    }
    if (id === 2) {
      const Y = krYest(t), A = pdAlert(t), F = fsBrief(t);
      const c = Y.st === 'gap' ? 'elektrolit kemarin bolong (' + Y.n + ' dari ' + ELEC.length + ' butir)' : Y.st === 'full' ? 'elektrolit kemarin lengkap' : 'ceklis elektrolit kemarin belum ada';
      const p = A.kind === 'warn' ? 'kalori rendah dan performa turun' : A.kind === 'info' ? A.title.toLowerCase() : A.kind === 'ok' ? 'performa tidak turun' : 'performa belum cukup data';
      return { text: c.charAt(0).toUpperCase() + c.slice(1) + ' · ' + p + (F.text ? ' · ' + F.text : ''), flag: Y.st === 'gap' || A.kind === 'warn' || F.flag };
    }
    if (id === 3) {
      const ph = phaseOf(t) || PHASES[0];
      return { text: 'Fase ' + ph.id + ' (' + ph.nama + ') · target ' + kcalTgt(T) + ' kcal, protein ' + fmt(T.protein, 0) + ' g' + (T.refeed ? ' · hari refeed' : ''), flag: false };
    }
    if (id === 4) {
      const tm = addDays(t, 1), D = mpWeekModel(tm).days.find(x => x.date === tm), left = mpDb.shop.it.filter(x => !x.done).length;
      const st = D.target.mode === 'range' ? { in: 'dalam rentang', above: 'di atas rentang', below: 'di bawah rentang' } : { in: 'dalam batas', above: 'di atas batas' };
      return { text: 'Besok ' + (D.n ? D.n + ' menu' + (D.k != null ? ', ' + fmt(D.k, 0) + ' kcal ' + st[D.status] : '') : 'belum ada menu') + ' · belanja ' + left + ' belum dibeli', flag: false };
    }
  } catch (e) { /* abaikan: pita tetap tampil tanpa ringkasan */ }
  return { text: '', flag: false };
}
function nzBandHTML(z, n) {
  const S = nzSummary(z.id), open = !nzClosed[z.id];
  return '<div class="nzb"><button type="button" class="nzh" data-q="nzTog" data-v="' + z.id + '" aria-expanded="' + String(open) + '"' + (S.flag ? ' data-flag="1"' : '') + '>' +
    '<span class="nzn">Zona ' + z.id + ' · ' + n + ' kartu' + (S.flag ? ' · perlu perhatian' : '') + '</span>' +
    '<span class="nzt">' + esc(z.name) + '</span>' +
    (S.text ? '<span class="nzs">' + esc(S.text) + '</span>' : '') +
    '<span class="nzc" aria-hidden="true">▾</span></button></div>';
}
function nzWrap(html) {   // susun ulang kartu per zona (urutan relatif di dalam zona tetap), beri data-z, sisipkan pita
  const by = { 0: [] }; NZ.forEach(z => { by[z.id] = []; });
  html.split(/(?=<section class="sec")/).filter(s => s !== '').forEach(s => by[nzZoneOf(nzTitle(s))].push(s));
  let h = '<div class="seg nzall" role="group" aria-label="Zona halaman Nutrisi" style="margin-top:12px">' +
    '<button type="button" class="pill" data-q="nzAll" data-v="open">Buka semua zona</button><button type="button" class="pill" data-q="nzAll" data-v="close">Lipat semua zona</button></div>';
  NZ.forEach(z => {
    if (!by[z.id].length) return;
    h += nzBandHTML(z, by[z.id].length);
    by[z.id].forEach(s => { h += s.replace('<section class="sec"', '<section class="sec" data-z="' + z.id + '"' + (nzClosed[z.id] ? ' hidden' : '')); });
  });
  return h + by[0].join('');
}
function nzApply() {   // ubah tampilan langsung tanpa menggambar ulang halaman (isian di kartu lain tidak hilang)
  NZ.forEach(z => {
    $$('#nutBody section[data-z="' + z.id + '"]').forEach(s => { s.hidden = !!nzClosed[z.id]; });
    const b = $('#nutBody .nzh[data-v="' + z.id + '"]'); if (b) b.setAttribute('aria-expanded', String(!nzClosed[z.id]));
  });
}
QACT.nzTog = el => { const v = el && el.dataset ? +el.dataset.v : 0; if (!NZ.some(z => z.id === v)) return; nzClosed[v] = !nzClosed[v]; nzApply(); };
QACT.nzAll = el => { const v = el && el.dataset && el.dataset.v; if (v !== 'open' && v !== 'close') return; NZ.forEach(z => { nzClosed[z.id] = v === 'close'; }); nzApply(); };
(function () {
  const s = document.createElement('style'); s.id = 'nzCss';
  s.textContent = '#nutBody .nzb{margin-top:28px}#nutBody .nzb+section.sec{padding-top:14px}' +
    '#nutBody .nzh{display:block;position:relative;width:100%;min-height:56px;padding:10px 44px 10px 14px;text-align:left;border:1.5px solid var(--rule);border-radius:12px;background:var(--raise);color:var(--ink);font:inherit}' +
    '#nutBody .nzh[data-flag="1"]{border-color:var(--bad)}' +
    '#nutBody .nzn{display:block;font:600 calc(12px * var(--fs))/1.3 var(--sans);letter-spacing:.04em;text-transform:uppercase;color:var(--mute)}' +
    '#nutBody .nzh[data-flag="1"] .nzn{color:var(--bad)}' +
    '#nutBody .nzt{display:block;font:650 calc(17px * var(--fs))/1.25 var(--sans)}' +
    '#nutBody .nzs{display:block;margin-top:2px;font:500 calc(13px * var(--fs))/1.4 var(--sans);color:var(--mute)}' +
    '#nutBody .nzc{position:absolute;right:16px;top:50%;margin-top:-10px;font-size:18px;line-height:20px;transition:transform .2s}' +
    '#nutBody .nzh[aria-expanded="false"] .nzc{transform:rotate(-90deg)}' +
    '#nutBody section[hidden]{display:none}';
  document.head.appendChild(s);
})();
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83g: Object.freeze({ zones: NZ, zoneOf: nzZoneOf, wrap: nzWrap, summary: nzSummary, closed: () => Object.assign({}, nzClosed) }) })); }, 0);
/* ===== AKHIR 83g ===== */
/* ===== MODUL: 83h MATRIKS BEBAN RIDE x ELEKTROLIT PER TINGKAT (Nutrisi) ===== */
// Murni hitungan di perangkat dari data yang sudah ada: ride (tdb), ceklis elektrolit (cdb), kram di Jurnal (db). Tidak ada penyimpanan baru, tidak ke AI.
// Menggantikan matriks 4 sel "Ride x elektrolit" di kartu Risiko kram (83b) dengan versi yang sama + rincian per tingkat durasi dan intensitas ride (satu fungsi, satu tempat).
const LC_DAYS = 90, LC_MIN = 3;   // jendela hari; jumlah hari minimal sebuah sel agar persennya ditampilkan
const LC_DUR = [['p', 'Pendek, di bawah 60 menit', 0, 60], ['s', 'Sedang, 60–120 menit', 60, 120], ['l', 'Panjang, di atas 120 menit', 120, Infinity]];
const LC_INT = [['r', 'Ringan, IF di bawah 0,75', 0, 0.75], ['s', 'Sedang, IF 0,75–0,89', 0.75, 0.9], ['b', 'Berat, IF 0,90 ke atas', 0.9, Infinity]];
function lcMinutes(d) { return bzRides(d).reduce((a, r) => a + (r && r.min > 0 ? r.min : 0), 0); }
function lcIf(d, L) {   // IF rata-rata berbobot durasi dari ride yang punya HR dan durasi; null bila tidak ada
  let w = 0, s = 0;
  bzRides(d).forEach(r => { const i = (r && r.min > 0) ? b55If(r, L) : null; if (i != null) { w += r.min; s += i * r.min; } });
  return w ? s / w : null;
}
function lcTier(list, v) { for (const x of list) if (v >= x[2] && v < x[3]) return x[0]; return null; }
function lcModel(t) {   // sel = { F: [hari, hari kram] bila elektrolit lengkap, P: bila bolong }; hanya hari ber-ceklis dan bertanda kram ya/tidak
  t = t || today();
  const from = addDays(t, -(LC_DAYS - 1)), L = b55Lthr(), cell = () => ({ F: [0, 0], P: [0, 0] });
  const M = { days: 0, none: cell(), ride: cell(), dur: {}, int: {}, noMin: 0, noHr: 0 };
  LC_DUR.forEach(x => { M.dur[x[0]] = cell(); }); LC_INT.forEach(x => { M.int[x[0]] = cell(); });
  Object.keys(db).forEach(d => {
    if (!DATE_RE.test(d) || d < from || d > t || !cdb[d]) return;
    const e = db[d]; if (!e || (e.kram !== 'ya' && e.kram !== 'tidak')) return;
    const s = ELEC.every(it => elecDone(d, it)) ? 'F' : 'P', k = e.kram === 'ya' ? 1 : 0, add = c => { c[s][0]++; c[s][1] += k; };
    M.days++;
    if (!bzRides(d).length) { add(M.none); return; }
    add(M.ride);
    const mn = lcMinutes(d); if (mn > 0) add(M.dur[lcTier(LC_DUR, mn)]); else M.noMin++;
    const i = lcIf(d, L); if (i != null) add(M.int[lcTier(LC_INT, i)]); else M.noHr++;
  });
  return M;
}
const lcNw = t => '<span style="white-space:nowrap">' + t + '</span>';   // hitungan tidak terputus di sel sempit (320 px)
function lcCellTxt(a) { return !a[0] ? '–' : a[0] < LC_MIN ? lcNw(a[1] + ' dari ' + a[0]) + ' (sedikit)' : Math.round(a[1] * 100 / a[0]) + '% ' + lcNw('(' + a[1] + ' dari ' + a[0] + ')'); }
function lcRow(lab, c) { return '<tr><th scope="row">' + esc(lab) + '</th><td>' + lcCellTxt(c.F) + '</td><td>' + lcCellTxt(c.P) + '</td></tr>'; }
function lcTodayLine(M) {   // untuk ride hari ini: kram historis di tingkat durasi yang sama, lengkap vs bolong
  const t = today(), mn = lcMinutes(t); if (!(mn > 0)) return '';
  const tier = LC_DUR.find(x => x[0] === lcTier(LC_DUR, mn)), c = M.dur[tier[0]], n = ELEC.filter(it => elecDone(t, it)).length;
  const base = 'Ride hari ini ' + fmt(mn, 0) + ' menit (' + tier[1].split(',')[0].toLowerCase() + '), elektrolit ' + n + ' dari ' + ELEC.length + ' butir. ';
  if (c.F[0] < LC_MIN || c.P[0] < LC_MIN) return base + 'Riwayat tingkat ini belum cukup untuk membandingkan lengkap dan bolong (butuh minimal ' + LC_MIN + ' hari di tiap kelompok).';
  return base + 'Di tingkat ini kram terjadi ' + Math.round(c.F[1] * 100 / c.F[0]) + '% pada hari lengkap dan ' + Math.round(c.P[1] * 100 / c.P[0]) + '% pada hari bolong.';
}
function lcSectionHTML() {
  const M = lcModel(), tl = lcTodayLine(M), hd = '<div class="gtw"><table class="gt"><thead><tr><th></th><th>Elektrolit lengkap</th><th>Elektrolit bolong</th></tr></thead><tbody>';
  let h = '<section class="sec" id="lcSec"><h2>Beban ride dan elektrolit</h2>' +
    '<p class="note" style="margin-top:12px">Berapa persen hari berakhir kram, dipisah menurut beban ride (lama dan intensitas) dan kepatuhan ceklis elektrolit. Satu hari = satu catatan; 90 hari terakhir, hanya hari yang punya ceklis dan ditandai kram atau tidak kram.</p>';
  if (tl) h += '<p class="note" id="lcToday" style="color:var(--ink)">' + esc(tl) + '</p>';
  h += hd + lcRow('Tanpa ride', M.none) + lcRow('Ada ride (semua)', M.ride) + '</tbody></table></div>' +
    '<div class="sublbl">Menurut lama ride (total hari itu)</div>' + hd + LC_DUR.map(x => lcRow(x[1], M.dur[x[0]])).join('') + '</tbody></table></div>' +
    '<div class="sublbl">Menurut intensitas ride (IF dari HR rata-rata)</div>' + hd + LC_INT.map(x => lcRow(x[1], M.int[x[0]])).join('') + '</tbody></table></div>';
  if (M.noMin || M.noHr) h += '<p class="note">' + (M.noMin ? M.noMin + ' hari ride tanpa durasi tidak masuk tabel lama. ' : '') + (M.noHr ? M.noHr + ' hari ride tanpa HR rata-rata atau tanpa LTHR tidak masuk tabel intensitas.' : '') + '</p>';
  return h + '<p class="note">Sel dengan kurang dari ' + LC_MIN + ' hari hanya menampilkan hitungan, tanpa persen. Dua hal yang bergerak bersama bukan bukti sebab-akibat; hari lain (tidur, cuaca, berdiri lama) ikut berpengaruh.</p></section>';
}
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83h: Object.freeze({ model: lcModel, html: lcSectionHTML, today: lcTodayLine, minutes: lcMinutes, ifOf: lcIf, tier: lcTier }) })); }, 0);
/* ===== AKHIR 83h ===== */

/* ===== MODUL: 83i KELELAHAN HARIAN (Fatigue and Daily Strain Index) (Nutrisi) ===== */
// Indeks 0–100 dari tiga komponen yang SUDAH dicatat di aplikasi: tidur semalam (jam, Jurnal > Harian), stres kerja 1–5 (kartu Pemulihan Latihan > Sepeda, `tdb[d].rc.t`), beban ride hari itu (hrTSS, atau perkiraan dari menit).
// Hanya komponen yang tercatat dihitung; skala tetap 0–100. Heuristik buatan sendiri, BUKAN skor medis. Tidak ada penyimpanan baru: kotak stres menulis ke `rc.t` yang sama dengan kartu Pemulihan.
const FS_SLEEP_OK = 7.5, FS_SLEEP_LO = 4, FS_W = { s: 40, t: 30, r: 30 }, FS_TSS_MAX = 150, FS_TSS_PER_MIN = 64 / 60, FS_HI = 60, FS_MID = 35, FS_RUN = 3, FS_AVG = 50;
const fsClamp = (v, a, b) => Math.min(b, Math.max(a, v));
function fsParts(d) {   // komponen mentah satu hari; null bila tidak tercatat
  const e = db[d], sl = e ? num(e.sleep) : null, rc = tdb[d] && tdb[d].rc, st = rc && rc.t >= 1 && rc.t <= 5 ? rc.t : null, L = b55Lthr();
  let min = 0, tss = 0;
  bzRides(d).forEach(r => { if (!r || !(r.min > 0)) return; min += r.min; const x = b55Tss(r, L); tss += x != null ? x : r.min * FS_TSS_PER_MIN; });
  return { sleep: (sl != null && sl > 0 && sl <= 16) ? sl : null, stress: st, min, tss: min > 0 ? tss : null };
}
function fsIndex(d) {   // { idx, level, n, pts } ; idx null bila kurang dari 2 komponen tercatat
  const P = fsParts(d), c = [];
  if (P.sleep != null) c.push(['s', FS_W.s * fsClamp((FS_SLEEP_OK - P.sleep) / (FS_SLEEP_OK - FS_SLEEP_LO), 0, 1)]);
  if (P.stress != null) c.push(['t', FS_W.t * (P.stress - 1) / 4]);
  if (P.tss != null) c.push(['r', FS_W.r * fsClamp(P.tss / FS_TSS_MAX, 0, 1)]);
  const out = { d, parts: P, n: c.length, idx: null, level: null, pts: {} };
  if (c.length < 2) return out;
  const got = c.reduce((a, x) => a + x[1], 0), max = c.reduce((a, x) => a + FS_W[x[0]], 0);
  c.forEach(x => { out.pts[x[0]] = Math.round(x[1]); });
  out.idx = Math.round(got * 100 / max); out.level = out.idx >= FS_HI ? 'tinggi' : out.idx >= FS_MID ? 'sedang' : 'segar';
  return out;
}
function fsWeek(t) { t = t || today(); return Array.from({ length: 7 }, (_, i) => fsIndex(addDays(t, i - 6))); }
function fsAlert(t) {   // peringatan overtraining: >= 3 hari berurutan di atas batas (hari kosong memutus), atau rata-rata 7 hari tinggi
  const W = fsWeek(t); let run = 0;
  for (let i = W.length - 1; i >= 0; i--) { if (W[i].idx != null && W[i].idx >= FS_HI) run++; else if (i === W.length - 1 && W[i].idx == null) continue; else break; }
  const v = W.filter(x => x.idx != null), avg = v.length >= 4 ? v.reduce((a, x) => a + x.idx, 0) / v.length : null;
  if (run >= FS_RUN) return { kind: 'warn', run, avg, text: 'Kelelahan tinggi ' + run + ' hari berturut-turut. Kurangi intensitas atau ambil hari istirahat sebelum melanjutkan ride keras.' };
  if (avg != null && avg >= FS_AVG) return { kind: 'info', run, avg, text: 'Rata-rata kelelahan 7 hari ' + Math.round(avg) + ' (cukup tinggi). Pantau tidur dan beban ride beberapa hari ke depan.' };
  return { kind: 'ok', run, avg, text: '' };
}
function fsBrief(t) {   // ringkasan untuk pita Zona 2
  try {
    const X = fsIndex(t || today());
    if (X.idx == null) return { text: '', flag: false };
    return { text: 'kelelahan ' + X.idx + ' (' + X.level + ')', flag: X.level === 'tinggi' || fsAlert(t).kind === 'warn' };
  } catch (e) { return { text: '', flag: false }; }
}
function fsRows(W) {
  return W.map(x => {
    const p = x.parts;
    return '<tr><th scope="row">' + esc(dayShort(x.d)) + '</th><td><b>' + (x.idx == null ? '–' : x.idx) + '</b>' + (x.level ? ' ' + x.level : '') + '</td><td>' + (p.sleep == null ? '–' : fmt(p.sleep, 1) + ' j') + '</td><td>' + (p.stress == null ? '–' : p.stress + '/5') + '</td><td>' + (p.min ? fmt(p.min, 0) + ' mnt' : '–') + '</td></tr>';
  }).join('');
}
function fsSectionHTML() {
  const t = today(), X = fsIndex(t), A = fsAlert(t), W = fsWeek(t), st = X.parts.stress;
  let h = '<section class="sec" id="fsSec"><h2>Kelelahan harian</h2>' +
    '<p class="note" style="margin-top:12px">Indeks 0–100 (makin tinggi makin lelah) dari tidur semalam, stres kerja, dan beban ride hari itu. Hanya komponen yang sudah dicatat yang dihitung.</p>';
  if (X.idx == null) h += '<p class="note" id="fsNow" style="color:var(--ink)">Belum cukup data hari ini: butuh minimal dua dari tiga (tidur semalam di Jurnal, stres kerja di bawah, ride hari ini). Terisi sekarang: ' + X.n + '.</p>';
  else h += '<span class="b55st ' + (X.level === 'tinggi' ? 'bad' : X.level === 'segar' ? 'ok' : '') + '" id="fsNow">Indeks ' + X.idx + ' · ' + X.level + '</span>' +
    kv('Tidur semalam', X.parts.sleep == null ? 'belum dicatat' : fmt(X.parts.sleep, 1) + ' jam' + (X.pts.s != null ? ' (+' + X.pts.s + ')' : '')) +
    kv('Stres kerja', st == null ? 'belum diisi' : st + ' dari 5' + (X.pts.t != null ? ' (+' + X.pts.t + ')' : '')) +
    kv('Beban ride hari ini', X.parts.min ? fmt(X.parts.min, 0) + ' menit, setara TSS ' + fmt(X.parts.tss, 0) + (X.pts.r != null ? ' (+' + X.pts.r + ')' : '') : 'belum ada ride');
  if (A.kind === 'warn') h += '<p class="kpwarn" id="fsAlert">⚠ ' + esc(A.text) + '</p>';
  else if (A.kind === 'info') h += '<p class="note" id="fsAlert" style="color:var(--ink)">' + esc(A.text) + '</p>';
  h += '<div class="sublbl">Stres kerja hari ini (1 = rendah, 5 = tinggi)</div><div class="rpe" role="group" aria-label="Stres kerja hari ini">' +
    [1, 2, 3, 4, 5].map(v => '<button type="button" class="pill" data-q="fsStress" data-v="' + v + '" aria-pressed="' + (st === v) + '">' + v + '</button>').join('') + '</div>' +
    '<p class="note">Isian ini sama dengan skala Stres di kartu Pemulihan (Latihan > Sepeda); mengisi di sini mengisi di sana. Durasi tidur diisi di Jurnal > Harian.</p>' +
    '<div class="sublbl">7 hari terakhir</div><div class="gtw"><table class="gt"><thead><tr><th></th><th>Indeks</th><th>Tidur</th><th>Stres</th><th>Ride</th></tr></thead><tbody>' + fsRows(W) + '</tbody></table></div>' +
    '<p class="note">Rumus (buatan sendiri, bukan skor medis): tidur 7,5 jam ke atas = 0 poin sampai 4 jam ke bawah = ' + FS_W.s + '; stres 1–5 = 0–' + FS_W.t + '; ride = TSS dibagi ' + FS_TSS_MAX + ' dikali ' + FS_W.r + ' (TSS diperkirakan dari menit bila tanpa HR). Batas: ' + FS_MID + ' ke atas sedang, ' + FS_HI + ' ke atas tinggi. Peringatan muncul bila ' + FS_RUN + ' hari berturut-turut tinggi. Nyeri tajam, pusing, atau denyut istirahat naik terus: periksakan ke dokter.</p></section>';
  return h;
}
QACT.fsStress = el => {
  const v = el && el.dataset ? +el.dataset.v : 0; if (!(v >= 1 && v <= 5)) return;
  const d = today(), t = tdb[d] || (tdb[d] = tblank()), rc = Object.assign({}, t.rc || {});
  if (rc.t === v) delete rc.t; else rc.t = v;
  if (Object.keys(rc).length) t.rc = rc; else delete t.rc;
  t.updated = Date.now(); queueSave('t');
  const y = window.scrollY; renderNutrition(); try { window.scrollTo(0, y); } catch (e) { /* abaikan */ }
};
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83i: Object.freeze({ parts: fsParts, index: fsIndex, week: fsWeek, alert: fsAlert, brief: fsBrief, html: fsSectionHTML }) })); }, 0);
