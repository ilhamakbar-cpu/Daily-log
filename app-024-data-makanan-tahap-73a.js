/* ===== /v23r ===== */

/* ===== v23p (Jurnal > Harian, p1): kartu shalat 5 baris. Sumber data = e.sh; e.shalat/e.missed/e.shalatNote diturunkan dari e.sh (shSync). Membalik: patch23p.py --reverse ===== */
const SH_REASONS = ['Sibuk kerja', 'Tertidur', 'Lupa', 'Di perjalanan', 'Malas'];
const shHas = e => !!e.sh && Object.keys(e.sh).length > 0;
function shClean(raw) {
  const o = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  PRAYERS.forEach(p => {
    const s = raw[p];
    if (!s || typeof s !== 'object') return;
    const d = (s.d === 'ya' || s.d === 'tidak') ? s.d : null;
    if (!d) return;
    const t = (d === 'ya' && (s.t === 'tepat' || s.t === 'telat')) ? s.t : null;
    o[p] = { d, t, r: typeof s.r === 'string' ? s.r.slice(0, 120) : '' };
  });
  return o;
}
function shStat(sh) {
  const r = { tepat: 0, telat: 0, tidak: 0, filled: 0, any: false };
  PRAYERS.forEach(p => {
    const s = sh && sh[p];
    if (!s || !s.d) return;
    r.any = true;
    if (s.d === 'tidak') { r.tidak++; r.filled++; }
    else if (s.t === 'tepat') { r.tepat++; r.filled++; }
    else if (s.t === 'telat') { r.telat++; r.filled++; }
  });
  return r;
}
function shDerive(sh) {
  const st = shStat(sh);
  const missed = PRAYERS.filter(p => { const s = sh[p]; return !!s && (s.d === 'tidak' || (s.d === 'ya' && s.t === 'telat')); });
  const note = missed.map(p => (sh[p].r || '').trim() ? p + ': ' + sh[p].r.trim() : '').filter(Boolean).join('; ');
  return { shalat: st.filled < PRAYERS.length ? null : (missed.length ? 'bolong' : 'ya'), missed, shalatNote: note };
}
function shSync(e) { const d = shDerive(e.sh); e.shalat = d.shalat; e.missed = d.missed; e.shalatNote = d.shalatNote; }
// tampilan: data baru (e.sh) bila ada; data lama (hanya e.shalat/e.missed) dibaca sebagai: Ya = 5 tepat waktu; Bolong = waktu di missed dibaca Telat, sisanya Tepat
function shView(e) {
  if (shHas(e)) return e.sh;
  const v = {};
  if (e.shalat === 'ya') PRAYERS.forEach(p => { v[p] = { d: 'ya', t: 'tepat', r: '' }; });
  else if (e.shalat === 'bolong' && e.missed.length) {
    let first = true;
    PRAYERS.forEach(p => {
      if (e.missed.includes(p)) { v[p] = { d: 'ya', t: 'telat', r: first ? (e.shalatNote || '').slice(0, 120) : '' }; first = false; }
      else v[p] = { d: 'ya', t: 'tepat', r: '' };
    });
  }
  return v;
}
function setSh(p, patch) {
  const m = Object.assign({}, shView(E()));
  if (!shHas(E())) PRAYERS.forEach(q => { const dw = shDue(q); if (q !== p && dw && dw.at > Date.now()) delete m[q]; });   // v23v: saat data lama dikonversi, waktu yang belum masuk tidak ikut dianggap tepat waktu
  const s = Object.assign({ d: null, t: null, r: '' }, m[p] || {}, patch);
  if (s.d !== 'ya') s.t = null;
  if (s.d == null) delete m[p]; else m[p] = s;
  const dv = shDerive(m);
  setE({ sh: m, shalat: dv.shalat, missed: dv.missed, shalatNote: dv.shalatNote });
}
let shKey = null, shPrev = {};   // v23s: tanggal terakhir dilukis + status 'selesai' tiap waktu (untuk menutup otomatis)
const shCol = new Set(), shEd = new Set();   // v23q: baris yang diminimalkan / baris alasan yang sedang diubah (hanya tampilan, tidak disimpan)
function shBuild() {
  const root = $('#shList');
  if (!root) return;
  const pill = (q, a, v, t, lab, txt) => '<button type="button" class="pill" data-q="' + q + '" data-p="' + a + '" data-v="' + esc(v) + '"' + (t ? ' data-t="' + t + '"' : '') + ' aria-label="' + esc(lab) + '" aria-pressed="false">' + esc(txt) + '</button>';
  root.innerHTML = PRAYERS.map(p => {
    const a = esc(p);
    return '<div class="sh-row" data-p="' + a + '" data-open="1" data-st="" role="group" aria-label="Shalat ' + a + '">' +
      '<button type="button" class="sh-head" data-q="shTog" data-p="' + a + '" aria-expanded="true"><span class="sh-name">' + a + '</span><span class="sh-badge">Belum diisi</span><span class="sh-chev" aria-hidden="true"></span></button>' +
      '<div class="sh-body"><div class="sh-ctl"><div class="seg sh-yn">' +
        pill('shD', a, 'ya', '', a + ': ya, shalat', 'Ya') + pill('shD', a, 'tidak', 'bad', a + ': tidak shalat', 'Tidak') +
      '</div><div class="seg sh-tt" hidden>' +
        pill('shT', a, 'tepat', 'ok', a + ': tepat waktu', 'Tepat waktu') + pill('shT', a, 'telat', 'late', a + ': telat', 'Telat') +
      '</div></div>' +
      '<p class="sh-auto" hidden></p>' +
      '<div class="more sh-why" hidden><div class="sublbl">Alasan telat</div><div class="chips">' +
        SH_REASONS.map(r => pill('shR', a, r, '', 'Alasan ' + p + ': ' + r, r)).join('') +
      '</div><input class="txt" data-shr="' + a + '" maxlength="120" placeholder="Alasan lain (opsional)" autocomplete="off" aria-label="Alasan ' + a + '"></div>' +
      '<div class="sh-rs" hidden><span class="sh-rtxt"></span><button type="button" class="sh-edit" data-q="shEd" data-p="' + a + '" aria-label="Ubah alasan ' + a + '">Ubah</button></div>' +
      '</div></div>';
  }).join('');
}
// v23u: waktu masuk shalat p pada tanggal yang sedang dibuka (jadwal lokal Beranda); null bila lokasi belum diatur
function shDue(p) {
  try {
    if (!hxHas()) return null;
    const q = cur.split('-').map(Number), day = hxDay(q[0], q[1], q[2], ldb), it = day.items.find(i => i.five && i.name === p);
    return it && it.at != null ? { at: it.at, tz: day.tz } : null;
  } catch (x) { return null; }
}
// v23x: apakah SEKARANG masuk jendela shalat p (mulai 30 menit sebelum waktunya sampai waktu butir berikutnya); null bila tidak diketahui (tanpa lokasi / bukan hari ini)
function shWin(p) {
  try {
    if (!hxHas() || cur !== today()) return null;
    const q = cur.split('-').map(Number), day = hxDay(q[0], q[1], q[2], ldb), i = day.items.findIndex(x => x.five && x.name === p), it = day.items[i];
    if (!it || it.at == null) return null;
    const nx = day.items[i + 1], n = Date.now();
    return n >= it.at - 30 * 60000 && (!nx || nx.at == null || n < nx.at);
  } catch (x) { return null; }
}
// ===== v100a: "Terlewat" otomatis. HANYA tampilan: e.sh tidak ditulis; ketukan pemilik (Ya/Tidak/alasan) yang menyimpan. Membalik: patch100a.py --reverse =====
// batas akhir waktu shalat p pada tanggal yang dibuka (ms epoch): Subuh = Terbit, Dzuhur = masuk Ashar, Ashar = masuk Maghrib, Maghrib = masuk Isya, Isya = tengah malam (tengah antara Maghrib dan Subuh esok); null bila lokasi belum diatur
function shLimit(p) {
  try {
    if (!hxHas()) return null;
    const q = cur.split('-').map(Number), day = hxDay(q[0], q[1], q[2], ldb), i = day.items.findIndex(x => x.five && x.name === p);
    if (i < 0) return null;
    let at = null;
    if (p === 'Isya') {
      const nd = new Date(Date.UTC(q[0], q[1] - 1, q[2] + 1)), nf = hxDay(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate(), ldb).items[0].at, mg = day.items[4].at;
      if (nf != null && mg != null) at = Math.round((mg + nf) / 2);
    } else { const nx = day.items[i + 1]; at = nx ? nx.at : null; }
    return at == null ? null : { at, tz: day.tz };
  } catch (x) { return null; }
}
// waktu yang batasnya sudah lewat dan belum dicatat -> { nama: {at, tz} }. Hari depan, catatan lama (Ya/Bolong) dan hari lampau tanpa satu pun catatan shalat TIDAK dihitung.
function shAutoMap(e, v) {
  const m = {}, t = today();
  if (cur > t || (!shHas(e) && e.shalat) || (cur < t && !shHas(e))) return m;
  const n = Date.now();
  PRAYERS.forEach(p => { if (v[p] && v[p].d) return; const L = shLimit(p); if (L && n >= L.at) m[p] = L; });
  return m;
}
const shIsAuto = p => { const e = E(); return !!shAutoMap(e, shView(e))[p]; };
// ubin Shalat di hero: ikut merah bila ada waktu terlewat otomatis
function shStampA(e) {
  const b = shStamp(e), n = Object.keys(shAutoMap(e, shView(e))).length;
  shAutoN = n;   // hero dilukis dengan jumlah ini; pewaktu melukis ulang bila jumlahnya berubah
  return n && b[1] !== 'miss' ? [b[0] === '–' ? '0/' + PRAYERS.length : b[0], 'miss'] : b;
}
let shAutoN = -1;   // jumlah waktu terlewat otomatis pada lukisan hero terakhir
function shAutoTick() {
  if (document.hidden || !$('#shList')) return;
  const e = E();
  if (Object.keys(shAutoMap(e, shView(e))).length !== shAutoN) { try { derived(); } catch (x) { shPaint(e); } }   // derived() melukis ulang kartu dan hero
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b100a: Object.freeze({ limit: shLimit, auto: () => { const e = E(); return shAutoMap(e, shView(e)); }, stamp: shStampA }) }));
// ===== /v100a =====
function shPaint(e) {
  const root = $('#shList');
  if (!root) return;
  const v = shView(e);
  if (!shHas(e)) PRAYERS.forEach(q => { const dw = shDue(q); if (dw && dw.at > Date.now()) delete v[q]; });   // v23v: data lama (Ya/Bolong) tidak boleh menghijaukan waktu yang belum masuk
  const st = shStat(v), ac = shAutoMap(e, v);   // v100a: waktu yang batasnya sudah lewat dan belum dicatat
  if (shKey !== cur) { shKey = cur; shPrev = {}; }
  PRAYERS.forEach(p => {
    const row = $('.sh-row[data-p="' + p + '"]', root);
    if (!row) return;
    const auto = !!ac[p], s = auto ? { d: 'tidak', t: null, r: '' } : (v[p] || {}), late = s.d === 'ya' && s.t === 'telat', no = s.d === 'tidak', ok = s.d === 'ya' && s.t === 'tepat';
    const need = late || no, r = (s.r || '').trim();
    // v23s: baris menutup otomatis begitu SELESAI (Tepat waktu, atau Telat/Tidak dengan alasan terpilih dan tidak sedang diubah/diketik); bisa dibuka lagi manual
    const done = ok || (need && !!r && !shEd.has(p) && document.activeElement !== $('.sh-why .txt', row));
    // v23x: hanya baris yang waktunya sedang/hampir tiba (jendela) yang terbuka; baris di luar jendela menutup otomatis; selesai tetap menutup
    const win = auto ? false : shWin(p), typing = document.activeElement === $('.sh-why .txt', row), was = shPrev[p];
    if (!was) { if (done || (win === false && !typing)) shCol.add(p); else shCol.delete(p); }
    else {
      if (was.d !== done) { if (done) shCol.add(p); else shCol.delete(p); }
      if (was.w !== win) { if (win === false) { if (!typing && !shEd.has(p)) shCol.add(p); } else if (!done) shCol.delete(p); }
    }
    shPrev[p] = { d: done, w: win };
    const col = shCol.has(p);
    const wt = shDue(p), soon = !!wt && wt.at > Date.now();   // v23w: sebelum waktunya masuk, baris SELALU abu-abu pucat apa pun isinya
    row.dataset.st = soon ? '' : no ? 'no' : late ? 'late' : ok ? 'ok' : '';
    row.dataset.auto = auto ? '1' : '';   // v100a
    row.dataset.open = col ? '0' : '1';
    $('.sh-body', row).hidden = col;
    row.dataset.w = soon ? 'soon' : (!no && !late && !ok) ? 'due' : '';
    const lab = auto ? 'Terlewat' : no ? 'Tidak shalat' : late ? 'Telat' : ok ? 'Tepat waktu' : s.d === 'ya' ? 'Pilih tepat waktu / telat' : soon ? 'Belum masuk \u00b7 ' + hxHM(wt.at, wt.tz) : 'Belum dikerjakan';
    $('.sh-badge', row).textContent = lab + (need && r ? ' · ' + r : '');
    const head = $('.sh-head', row);
    head.setAttribute('aria-expanded', String(!col));
    head.setAttribute('aria-label', 'Shalat ' + p + ': ' + lab + (need && r ? ', ' + r : '') + (col ? '. Ketuk untuk membuka' : '. Ketuk untuk meminimalkan'));
    $$('.sh-yn .pill', row).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === s.d)));
    $$('.sh-tt .pill', row).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === s.t)));
    $('.sh-tt', row).hidden = s.d !== 'ya';
    const an = $('.sh-auto', row);   // v100a
    if (an) { an.hidden = !auto; if (auto) an.textContent = (p === 'Isya' ? 'Batas waktu (tengah malam) ' : 'Batas waktu ') + hxHM(ac[p].at, ac[p].tz) + ' sudah lewat dan belum dicatat. Sudah shalat? Pilih Ya, lalu Tepat waktu atau Telat.'; }
    if (!need) shEd.delete(p);
    const why = $('.sh-why', row), inp = $('.txt', why);
    const pick = need && (!r || shEd.has(p) || document.activeElement === inp);
    why.hidden = !pick;
    $('.sublbl', why).textContent = no ? 'Alasan tidak shalat' : 'Alasan telat';
    $$('.chips .pill', why).forEach(b => b.setAttribute('aria-pressed', String(!!s.r && b.dataset.v === s.r)));
    const val = s.r || '';
    if (document.activeElement !== inp && inp.value !== val) inp.value = val;
    const rs = $('.sh-rs', row);
    rs.hidden = !(need && r && !pick);
    $('.sh-rtxt', rs).textContent = (no ? 'Alasan tidak shalat: ' : 'Alasan telat: ') + r;
  });
  const sum = $('#shSum');
  const nA = Object.keys(ac).length;   // v100a
  if (sum) sum.textContent = !st.any && !nA ? 'Belum diisi' : st.tepat + '/' + PRAYERS.length + ' tepat waktu' + (st.telat ? ' · ' + st.telat + ' telat' : '') + (st.tidak ? ' · ' + st.tidak + ' tidak' : '') + (nA ? ' · ' + nA + ' terlewat' : '');
  const all = $('#shAll');
  if (all) all.textContent = shCol.size === PRAYERS.length ? 'Buka semua' : 'Ciutkan semua';
  const lg = $('#shLegacy');
  if (lg) {
    const old = !shHas(e) && e.shalat === 'bolong';
    lg.hidden = !old;
    if (old) lg.textContent = e.missed.length
      ? 'Catatan lama: bolong/terlambat. Waktu yang dicatat dibaca sebagai Telat; ubah ke Tidak bila sebenarnya terlewat.'
      : 'Catatan lama: bolong/terlambat tanpa rincian waktu. Pilih ulang per waktu shalat.';
  }
}
function shStamp(e) {
  if (!shHas(e)) return [e.shalat === 'ya' ? 'Ya' : e.shalat === 'bolong' ? 'Bolong' : '–', e.shalat === 'ya' ? 'hit' : e.shalat === 'bolong' ? 'miss' : ''];
  const s = shStat(e.sh);
  return [s.tepat + '/' + PRAYERS.length, s.tepat === PRAYERS.length ? 'hit' : (s.telat + s.tidak) ? 'miss' : ''];
}
function shText(e) {
  const s = shStat(e.sh), W = { tepat: 'tepat waktu', telat: 'telat', tidak: 'tidak shalat' };
  const rows = PRAYERS.map(p => {
    const x = e.sh[p], k = x && x.d ? (x.d === 'tidak' ? 'tidak' : x.t) : null;
    return p + ' ' + (k ? W[k] : '-') + (k && k !== 'tepat' && (x.r || '').trim() ? ' (' + x.r.trim() + ')' : '');
  });
  return s.tepat + '/' + PRAYERS.length + ' tepat waktu: ' + rows.join(', ');
}
function shCsv(e) {
  if (!shHas(e)) return '';
  return PRAYERS.map(p => {
    const x = e.sh[p], k = x && x.d ? (x.d === 'tidak' ? 'tidak' : (x.t || 'ya')) : '';
    return p + ':' + k + (k && k !== 'tepat' && (x.r || '').trim() ? ':' + x.r.trim().replace(/[|:]/g, ' ') : '');
  }).join('|');
}
QACT.shD = b => { const p = b.dataset.p, s = shView(E())[p] || {}; setSh(p, { d: s.d === b.dataset.v ? null : b.dataset.v }); };
QACT.shT = b => { const p = b.dataset.p, s = shView(E())[p] || {}; setSh(p, { t: s.t === b.dataset.v ? null : b.dataset.v }); };
QACT.shR = b => { const p = b.dataset.p, s = shView(E())[p] || {}; shEd.delete(p); setSh(p, Object.assign({ r: s.r === b.dataset.v ? '' : b.dataset.v }, shIsAuto(p) ? { d: 'tidak' } : {})); };
QACT.shTog = b => { const p = b.dataset.p; if (shCol.has(p)) shCol.delete(p); else shCol.add(p); shPaint(E()); };
QACT.shAll = () => { if (shCol.size === PRAYERS.length) shCol.clear(); else PRAYERS.forEach(p => shCol.add(p)); shPaint(E()); };
QACT.shEd = b => { shEd.add(b.dataset.p); shPaint(E()); };
document.addEventListener('input', ev => {
  const el = ev.target;
  if (el.dataset && el.dataset.shr) setSh(el.dataset.shr, Object.assign({ r: el.value }, shIsAuto(el.dataset.shr) ? { d: 'tidak' } : {}));
});
document.addEventListener('focusout', ev => {
  const el = ev.target;
  if (el.dataset && el.dataset.shr) setTimeout(() => { if ((el.value || '').trim()) shEd.delete(el.dataset.shr); shPaint(E()); }, 0);
});
document.addEventListener('keydown', ev => {
  const el = ev.target;
  if (ev.key === 'Enter' && el.dataset && el.dataset.shr) { ev.preventDefault(); el.blur(); }
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b23p: Object.freeze({ view: shView, stat: shStat, derive: shDerive, clean: shClean, text: shText, csv: shCsv, stamp: shStamp, reasons: SH_REASONS, entry: d => db[d] ? JSON.parse(JSON.stringify(db[d])) : null, text: d => toText(d, db[d] || blank()), has: dayHasData, flush: flush, cleanEntry: clean, csv: toCSV }) }));
setInterval(() => { if (!document.hidden && $('#shList')) shPaint(E()); }, 20000);   // v23u: abu-abu berganti saat waktu shalat masuk
setInterval(shAutoTick, 5000);   // v100a: kartu berubah merah tepat setelah batas lewat (tanpa muat ulang)
document.addEventListener('visibilitychange', shAutoTick);   // v100a
/* ===== /v23p ===== */
/* ===== v23y: isi screen time TikTok / sosmed dari tangkapan layar Digital Wellbeing (Android) atau Screen Time (iPhone). Membalik: patch23y.py --reverse ===== */
// Foto diperkecil di perangkat lalu dikirim ke Gemini HANYA untuk disalin (nama aplikasi + teks waktu persis seperti tertulis).
// Semua penafsiran (durasi, tanggal, aplikasi sosmed mana yang dihitung, penjumlahan) dilakukan LOKAL. Foto tidak disimpan.
// Tidak ada yang tersimpan sebelum tombol "Pakai angka ini" ditekan; hasil bisa diurungkan lewat toast.
const WB_SYS = 'Kamu membaca tangkapan layar statistik waktu layar ponsel: Digital Wellbeing (Android, bahasa Inggris atau Indonesia) atau Screen Time (iPhone). Tugasmu HANYA menyalin teks yang terlihat di gambar ke JSON. ' +
  'Jangan menebak, menghitung, membulatkan, atau memperkirakan menit dari panjang busur lingkaran atau tinggi batang grafik. Bila waktu sebuah aplikasi tidak tertulis sebagai teks, jangan masukkan aplikasi itu. ' +
  'Balas HANYA satu objek JSON dengan kunci: ' +
  'is_screentime (true bila gambar menampilkan statistik waktu layar atau daftar waktu pemakaian aplikasi, selain itu false), ' +
  'platform ("android", "ios", atau null), ' +
  'period ("day" bila angka yang tampil untuk satu hari, "week" bila tampilan mingguan atau rata-rata harian, null bila tidak jelas), ' +
  'date_text (teks label hari persis seperti tertulis, mis. "Today", "Hari ini", "Fri, Oct 23", "Kamis, 23 Okt"; null bila tidak ada), ' +
  'total_text (total waktu layar yang besar di pusat lingkaran atau judul, persis seperti tertulis, mis. "7 hr, 11 min"; null bila tidak ada), ' +
  'apps (daftar baris aplikasi dari atas ke bawah; tiap baris {"name": nama aplikasi, "time_text": waktu pemakaian persis seperti tertulis di baris itu, mis. "4 hr, 15 min" atau "45 min"}; ' +
  'hanya aplikasi satu per satu, bukan kategori seperti Social atau Entertainment, dan bukan baris Unlocks, Notifications, Pembuka kunci, atau Notifikasi; ' +
  'nama aplikasi yang hanya menjadi label di sekitar lingkaran tanpa teks waktu BUKAN baris aplikasi; array kosong bila tidak ada baris aplikasi dengan waktu tertulis), ' +
  'note (satu kalimat bila ada bagian yang terpotong, buram, atau meragukan, selain itu null).';
const WB_USER = 'Salin data dari tangkapan layar waktu layar terlampir ke JSON.';
const WB_SOS = ['tiktok', 'instagram', 'facebook', 'twitter', 'threads', 'snapchat', 'pinterest', 'reddit', 'linkedin', 'lemon8', 'tumblr', 'bereal', 'likee', 'kwai', 'bigo'];
const wbSt = { info: null, err: null, busy: false, name: '' };   // hanya di memori
let wbTok = 0;
const wbIsSos = n => { const s = String(n == null ? '' : n).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); return s === 'x' || s === 'x twitter' || WB_SOS.some(k => s.includes(k)); };
// Durasi dari teks seperti "4 hr, 15 min", "4 j 15 mnt", "4h 15m", "45 min", "<1 min". "4:15" ambigu (jam:menit atau menit:detik) jadi ditolak. Angka murni ditolak.
function wbDur(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(/\u00a0/g, ' ');
  if (!s || /^\d{1,3}:\d{2}/.test(s)) return null;
  if (/(<|kurang dari|less than)/.test(s) && /\b1\s*(m|mnt|menit|min|mins|minute|minutes)\b/.test(s)) return 30;
  const sec = svDur(s);
  return sec != null && sec >= 0 ? sec : null;
}
function wbTxt(sec) {
  if (sec > 0 && sec < 60) return '<1 mnt';
  const mn = Math.round(sec / 60);
  const h = Math.floor(mn / 60), m = mn % 60;
  return h ? h + ' j ' + m + ' mnt' : m + ' mnt';
}
const wbFailR = (code, msg) => ({ ok: false, code, msg });
function wbFail(code, msg, name) { wbSt.busy = false; wbSt.err = { code, msg, name: String(name || '').slice(0, 60) }; wbPaint(); toast('Foto tidak bisa dipakai. Alasannya ada di bawah tombol.'); }
// Mengubah JSON dari AI menjadi info yang sudah divalidasi. ctx = {ref: 'YYYY-MM-DD', refFrom: 'today'|'file', def: tanggal bawaan bila foto tanpa tanggal}. Tidak melempar error.
function wbParse(data, ctx) {
  ctx = ctx || {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return wbFailR('badjson', 'Balasan AI tidak berbentuk data yang bisa dipakai. Coba lagi, atau isi screen time secara manual.');
  const d = data, warns = [];
  const str = (v, n) => (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const totalSec = wbDur(typeof d.total_text === 'string' ? d.total_text : null);
  const per = String(d.period == null ? '' : d.period).toLowerCase();
  if (d.is_screentime === false) return wbFailR('notwb', 'Foto ini tidak terbaca sebagai statistik waktu layar. Pakai tangkapan layar Digital Wellbeing (Dashboard) atau Screen Time yang menampilkan daftar aplikasi dengan waktunya.');
  if (per === 'week' || per === 'average') return wbFailR('week', 'Foto ini tampaknya tampilan mingguan atau rata-rata harian. Pilih tampilan SATU HARI (ketuk harinya) lalu ambil tangkapan layar lagi.');
  const rows = Array.isArray(d.apps) ? d.apps.slice(0, 60) : [], apps = [], seen = new Set();
  let dropped = 0;
  rows.forEach(r => {
    if (!r || typeof r !== 'object') { dropped++; return; }
    const name = str(r.name, 40), sec = wbDur(typeof r.time_text === 'string' ? r.time_text : null);
    if (!name || sec == null || sec > 86400) { dropped++; return; }
    const key = name.toLowerCase() + '|' + sec;
    if (seen.has(key)) return;
    seen.add(key); apps.push({ name, sec, on: wbIsSos(name) });
  });
  if (!apps.length) {
    if (totalSec != null) return wbFailR('nolist', 'Foto ini hanya menampilkan total HP (' + wbTxt(totalSec) + ') tanpa waktu per aplikasi, jadi TikTok/sosmed belum bisa diisi. Di Digital Wellbeing ketuk Dashboard lalu ambil tangkapan layar daftar aplikasi; di iPhone pakai daftar aplikasi yang paling sering dipakai.');
    return wbFailR('notwb', 'Tidak ada baris aplikasi dengan waktu yang terbaca di foto. Pakai tangkapan layar Digital Wellbeing (Dashboard) atau Screen Time yang menampilkan daftar aplikasi dengan waktunya.');
  }
  const all = apps.reduce((s, a) => s + a.sec, 0);
  if (totalSec != null && all > totalSec * 1.02 + 60) warns.push('Jumlah semua aplikasi (' + wbTxt(all) + ') lebih besar dari total HP di foto (' + wbTxt(totalSec) + '). Ada angka yang mungkin salah baca; periksa daftarnya.');
  if (dropped > 0) warns.push(dropped + ' baris tanpa nama atau waktu yang terbaca dilewati.');
  if (!apps.some(a => a.on)) warns.push('Tidak ada aplikasi sosmed yang dikenali di daftar. Centang sendiri aplikasi yang mau dihitung.');
  const ref = svValidYmd(ctx.ref) ? ctx.ref : today();
  const w = svWhen(typeof d.date_text === 'string' ? d.date_text : '', ref);
  let date = w.date;
  if (date && date > today()) { warns.push('Tanggal di foto (' + date + ') ada di masa depan, jadi diganti hari ini. Ubah bila perlu.'); date = today(); }
  if (date && date < '2000-01-01') date = null;
  const note = str(d.note, 140);
  if (note) warns.push('Catatan pembaca foto: ' + note);
  const def = svValidYmd(ctx.def) ? ctx.def : today();
  return { ok: true, info: {
    apps, totalSec, date, kind: w.kind, whenText: str(d.date_text, 40), ref, refFrom: ctx.refFrom || 'today', def, warns,
    platform: ['android', 'ios'].includes(String(d.platform).toLowerCase()) ? String(d.platform).toLowerCase() : null,
    ed: { date: date || def }
  } };
}
const wbSumSec = () => { const i = wbSt.info; return i ? i.apps.reduce((s, a) => s + (a.on ? a.sec : 0), 0) : 0; };
const wbDateOk = x => DATE_RE.test(x) && x <= today() && x >= '2000-01-01';
const wbCanUse = () => !!wbSt.info && wbSumSec() > 0 && wbDateOk(wbSt.info.ed.date);
function wbExistTxt(d) {
  if (!wbDateOk(d)) return 'Isi tanggal yang valid (tidak boleh di masa depan).';
  const e = db[d], has = e && (e.stH !== '' || e.stM !== '');
  let t = has ? dayShort(d) + ' sudah berisi ' + wbTxt(((num(e.stH) || 0) * 60 + (num(e.stM) || 0)) * 60) + '. Menekan Pakai akan menggantinya (bisa diurungkan).' : dayShort(d) + ' belum ada isian screen time.';
  if (d === today()) t += ' Hari ini belum selesai, angkanya masih bertambah; ambil ulang malam hari bila mau angka akhir.';
  return t;
}
function wbWhenNote(i) {
  const q = i.whenText ? '“' + esc(i.whenText) + '”' : '';
  if (!i.date && !i.whenText) return 'Tanggal tidak terbaca dari foto, jadi diisi tanggal yang sedang dibuka (' + esc(dayShort(i.def)) + '). Ubah bila perlu.';
  if (!i.date) return 'Teks tanggal di foto ' + q + ' tidak bisa dipastikan, jadi diisi tanggal yang sedang dibuka (' + esc(dayShort(i.def)) + '). Ubah bila perlu.';
  if (i.kind === 'today' || i.kind === 'yesterday' || i.kind === 'weekday')
    return 'Foto menulis ' + q + '. Dihitung dari ' + (i.refFrom === 'file' ? 'tanggal berkas foto' : 'hari ini') + ' (' + esc(dayShort(i.ref)) + ')' + (i.kind === 'weekday' ? ' dengan menebak hari terakhir yang cocok' : '') + '. Ubah bila salah.';
  if (i.kind === 'abs-noyear') return 'Foto menulis ' + q + ' tanpa tahun; dipakai tahun terdekat yang masuk akal. Ubah bila salah.';
  return 'Tanggal dibaca langsung dari foto (' + q + ').';
}
function wbHTML() {
  const i = wbSt.info, e = wbSt.err;
  let h = '<div class="b17s wbw"><button type="button" class="btn sm ghost b17sb" data-q="wbPick"' + (wbSt.busy ? ' disabled' : '') + '>Isi dari screenshot Wellbeing</button>' +
    '<input type="file" id="wbFile" accept="image/*" hidden aria-label="Pilih tangkapan layar Digital Wellbeing atau Screen Time">' +
    '<p class="note b17sn">Pilih tangkapan layar Digital Wellbeing (Android, layar Dashboard) atau Screen Time (iPhone) yang menampilkan daftar aplikasi beserta waktunya. AI hanya menyalin angkanya; kamu yang mencentang aplikasi yang dihitung. Foto dikirim ke Gemini hanya untuk dibaca, tidak disimpan di aplikasi ini.</p>';
  if (wbSt.busy) h += '<div class="b17sbusy" id="wbBusy" role="status"><b>✦ Membaca foto…</b>' + (wbSt.name ? ' <small>' + esc(wbSt.name) + '</small>' : '') + '<p class="note">Biasanya 5 sampai 20 detik. Tidak ada yang berubah di datamu.</p><button type="button" class="btn sm ghost b17sb" data-q="wbCancel">Batal</button></div>';
  if (e) h += '<div class="b17serr" id="wbErr" role="alert"><b>Foto tidak bisa dipakai</b>' + (e.name ? ' <small>' + esc(e.name) + '</small>' : '') + '<p>' + esc(e.msg) + '</p><div class="b17sr">' +
    (['off', 'nokey', 'noproxy', 'auth', 'model'].includes(e.code) ? '<button type="button" class="btn sm primary b17sb" data-q="wbSettings">Buka pengaturan AI</button>' : '') +
    '<button type="button" class="btn sm ghost b17sb" data-q="wbErrX">Tutup</button></div></div>';
  if (i) {
    const rows = i.apps.map((a, k) => '<label class="wbrow"><input type="checkbox" data-wb="app" data-i="' + k + '"' + (a.on ? ' checked' : '') + '><span class="wbn">' + esc(a.name) + '</span><span class="wbt">' + esc(wbTxt(a.sec)) + '</span></label>').join('');
    const sum = wbSumSec();
    h += '<div class="b17sp wbp" id="wbInfo"><b>Foto terbaca</b>' + (wbSt.name ? ' <small>' + esc(wbSt.name) + '</small>' : '') +
      (i.totalSec != null ? '<div class="wbtot"><small>Total HP di foto</small><b>' + esc(wbTxt(i.totalSec)) + '</b></div>' : '') +
      '<div class="sublbl t0">Hitung sebagai TikTok / sosmed</div><div class="wblist" role="group" aria-label="Aplikasi yang dihitung">' + rows + '</div>' +
      '<div class="wbtot wbsum"><small>Dihitung</small><b id="wbSum" aria-live="polite">' + (sum > 0 ? esc(wbTxt(sum)) : '–') + '</b></div>' +
      '<div class="wbdt"><div class="sublbl t0">Tanggal</div><label class="inp"><input type="date" data-wb="date" min="2000-01-01" max="' + today() + '" value="' + esc(i.ed.date) + '" aria-label="Tanggal screen time"></label></div>' +
      '<p class="note" id="wbNote">' + esc(wbExistTxt(i.ed.date)) + '</p>' +
      '<p class="note b17sd">' + wbWhenNote(i) + '</p>' +
      i.warns.map(w => '<p class="note b17sw">' + esc(w) + '</p>').join('') +
      '<div class="b17sr"><button type="button" class="btn sm primary b17sb" id="wbUse" data-q="wbUse"' + (wbCanUse() ? '' : ' disabled') + '>Pakai angka ini</button><button type="button" class="btn sm ghost b17sb" data-q="wbClear">Batal</button></div></div>';
  }
  return h + '</div>';
}
function wbPaint() { const el = $('#wbF'); if (el) el.innerHTML = wbHTML(); }
function wbRecalc() {
  const s = $('#wbSum'), sec = wbSumSec(); if (s) s.textContent = sec > 0 ? wbTxt(sec) : '–';
  const b = $('#wbUse'); if (b) b.disabled = !wbCanUse();
}
function wbReset() { wbTok++; if (wbSt.busy) AI.cancel(); wbSt.busy = false; wbSt.info = null; wbSt.err = null; wbSt.name = ''; }
function wbWrite(d, h, m) {   // menulis stH/stM pada tanggal d; tanggal yang sedang dibuka lewat setField supaya kotak isian ikut berubah
  if (d === cur) { setField('stH', h); setField('stM', m); return; }
  const e = db[d] || (db[d] = blank());
  e.stH = h; e.stM = m; e.updated = Date.now();
  queueSave(); refreshView();
}
function wbUndo(d, prev, had, h, m) {
  const e = db[d];
  if (e && (e.stH !== h || e.stM !== m)) { toast('Sudah diubah lagi, jadi tidak diurungkan.'); return; }
  wbWrite(d, prev.h, prev.m);
  if (!had && d !== cur && db[d] && JSON.stringify(Object.assign({}, db[d], { updated: 0 })) === JSON.stringify(Object.assign(blank(), { updated: 0 }))) { delete db[d]; queueSave(); refreshView(); }
}
async function wbRead(file) {
  if (!file || wbSt.busy) return;
  const name = String(file.name || '').slice(0, 60);
  if (file.type && !/^image\//.test(file.type)) { wbFail('notimg', 'File itu bukan gambar. Pilih tangkapan layar (JPG atau PNG) dari Digital Wellbeing atau Screen Time.', name); return; }
  if (file.size > SV_FILE_MAX) { wbFail('big', 'Foto terlalu besar (maksimal 30 MB). Pakai tangkapan layar biasa.', name); return; }
  const tok = ++wbTok;
  wbSt.busy = true; wbSt.err = null; wbSt.name = name; wbPaint();
  let img;
  try { img = await svResize(file); } catch (e) { if (tok === wbTok) wbFail('img', 'Foto tidak bisa dibaca. Coba tangkapan layar lain (JPG atau PNG).', name); return; }
  if (tok !== wbTok) return;
  const rf = svRef(file.lastModified);
  const r = await AI.ask({ task: 'wellbeing', model: aiFastModel(), system: WB_SYS, user: WB_USER, image: { type: img.type, data: img.data }, json: true, max: 1600, think: 1024, timeout: 60000 });
  if (tok !== wbTok) return;   // dibatalkan atau direset selagi menunggu
  if (r.code === 'cancelled') { wbSt.busy = false; wbPaint(); return; }
  if (!r.ok) { wbFail(r.code, r.msg, name); return; }
  const p = wbParse(r.data, { ref: rf.d, refFrom: rf.from, def: cur });
  if (!p.ok) { wbFail(p.code, p.msg, name); return; }
  wbSt.info = p.info; wbSt.err = null; wbSt.busy = false; wbPaint();
  toast('Foto terbaca. Periksa daftar lalu tekan Pakai angka ini.');
}
QACT.wbPick = () => {
  if (wbSt.busy) return;
  const rd = AI.ready();
  if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  const f = $('#wbFile'); if (f) f.click();
};
QACT.wbCancel = () => { if (!wbSt.busy) return; wbTok++; AI.cancel(); wbSt.busy = false; toast('Dibatalkan. Tidak ada yang berubah.'); wbPaint(); };
QACT.wbErrX = () => { wbSt.err = null; wbPaint(); };
QACT.wbSettings = () => aiOpenSettings();
QACT.wbClear = () => { wbReset(); wbPaint(); };
QACT.wbUse = () => {
  const i = wbSt.info; if (!i || !wbCanUse()) return;
  const d = i.ed.date, mins = Math.min(1439, Math.max(1, Math.round(wbSumSec() / 60))), h = String(Math.floor(mins / 60)), m = String(mins % 60);
  const had = !!db[d], prev = had ? { h: db[d].stH, m: db[d].stM } : { h: '', m: '' };
  wbWrite(d, h, m);
  wbReset(); wbPaint();
  toast('Screen time ' + dayShort(d) + ' diisi ' + wbTxt(mins * 60) + '.', { label: 'Urungkan', fn: () => wbUndo(d, prev, had, h, m) });
};
document.addEventListener('change', ev => {
  const el = ev.target; if (!el) return;
  if (el.id === 'wbFile') { const f = el.files && el.files[0]; el.value = ''; if (f) wbRead(f); return; }
  if (el.dataset && el.dataset.wb === 'app' && wbSt.info) { const a = wbSt.info.apps[+el.dataset.i]; if (a) { a.on = !!el.checked; wbRecalc(); } }
});
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.wb !== 'date' || !wbSt.info) return;
  wbSt.info.ed.date = el.value;
  const n = $('#wbNote'); if (n) n.textContent = wbExistTxt(el.value);
  wbRecalc();
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b23y: Object.freeze({ parse: wbParse, dur: wbDur, isSos: wbIsSos, txt: wbTxt, state: () => wbSt, sum: wbSumSec, write: wbWrite, sys: () => WB_SYS }) }));
wbPaint();
/* ===== /v23y ===== */
/* ===== MODUL: DATA MAKANAN (tahap 73a) ===== */
// Skema seragam per makanan: {id, n (ID), ne (EN), src (tkpi|off|usda|ai|manual), v (per 100 g; null = "tidak ada data", BUKAN 0), por [{n, g}], bc (barcode), at (tanggal ambil, ms)}.
// Sumber pencarian lokal: TKPI (ditanam, kosong sampai 73b), "Makanan saya" (gdb.mine, tidak pernah dihapus otomatis), riwayat (gdb.cache, maks 300 terbaru).
// Hasil memakai kolom form makan yang sudah ada (#mName, #mK, #mP); data harian (edb) TIDAK berubah bentuk. Tidak ada jaringan.
const GDB_KEY = 'dailylog:foods:v1';
const GD_SRC = ['tkpi', 'off', 'usda', 'ai', 'manual'];
const GD_SRC_LBL = { tkpi: 'TKPI 2020', off: 'Open Food Facts', usda: 'USDA', ai: 'Estimasi AI', manual: 'Makanan saya' };
const GD_SRC_RANK = { tkpi: 0, manual: 1, off: 2, usda: 3, ai: 4 };
const GD_NUT = [['kcal', 'Kalori', 'kkal', 950], ['p', 'Protein', 'g', 100], ['f', 'Lemak', 'g', 100], ['c', 'Karbohidrat', 'g', 100], ['fiber', 'Serat', 'g', 100], ['sugar', 'Gula', 'g', 100], ['na', 'Natrium', 'mg', 40000], ['k', 'Kalium', 'mg', 10000], ['mg', 'Magnesium', 'mg', 2000]];
const GD_MAX_MINE = 500, GD_MAX_CACHE = 300, GD_STALE = 30 * 864e5;
// 73b: TKPI 2020 (Kemenkes RI), dibaca dari PDF pindai. Baris: [kode, nama, kkal, protein, lemak, KH, serat, natrium, kalium] per 100 g.
// null = "tidak ada data" (sel kosong atau sel biru gelap yang tidak terbaca), BUKAN 0. TKPI tidak punya gula dan magnesium.
/* data-tkpi.js potongan 0 (Tahap 3b): dipindah ke berkas sendiri, dimuat sebelum app.js */
const GD_TKPI = [];
/* ===== 3d-1a: TKPI dimuat saat dibutuhkan (satu kode, dua cara muat) ===== */
// Satu berkas: GD_TKPI_RAW sudah tertanam di atas, jadi GD_TKPI terisi saat boot (sama seperti sebelumnya, tanpa jaringan).
// dist/: index.html TIDAK memuat data-tkpi.js; berkas itu dimuat lewat <script> saat pencarian makanan dipakai pertama kali.
// Gagal muat (offline pertama): st 'fail', pesan jujur di saran, hasil lokal lain tetap tampil, dicoba lagi paling cepat 5 dtk kemudian.
const gdTk = { st: 'idle', n: 0, t: 0 };   // st: idle | busy | ok | fail; n = jumlah percobaan muat; t = waktu percobaan terakhir
function gdTkpiFill() {
  if (gdTk.st === 'ok' || typeof GD_TKPI_RAW === 'undefined') return gdTk.st === 'ok';
  GD_TKPI.length = 0;
  GD_TKPI_RAW.forEach(r => { const x = gdItem({ id: 'tkpi:' + r[0], n: r[1], src: 'tkpi', v: { kcal: r[2], p: r[3], f: r[4], c: r[5], fiber: r[6], sugar: null, na: r[7], k: r[8], mg: null }, por: [], at: 0 }); if (x) GD_TKPI.push(x); });
  gdTk.st = 'ok'; return true;
}
function gdTkpiPaint() { const i = $('#mName'); if (i && gdNorm(i.value).length >= 2) gdSugPaint(); }
function gdTkpiEnsure() {
  if (gdTk.st === 'ok' || gdTk.st === 'busy') return;
  if (gdTkpiFill()) return;
  if (gdTk.st === 'fail' && Date.now() - gdTk.t < 5000) return;
  if (!document.head) return;
  gdTk.st = 'busy'; gdTk.n++; gdTk.t = Date.now();
  const sc = document.createElement('script'); sc.src = 'data-tkpi.js';
  sc.onload = () => { if (!gdTkpiFill()) gdTk.st = 'fail'; gdTkpiPaint(); };
  sc.onerror = () => { sc.remove(); gdTk.st = 'fail'; gdTk.t = Date.now(); gdTkpiPaint(); };
  document.head.appendChild(sc);
}
function gdTkNote(has) {   // catatan di bawah saran: hanya muncul bila TKPI belum siap (satu berkas: selalu siap, tidak ada perubahan tampilan)
  if (gdTk.st === 'fail') return '<p class="gdnone" role="status">Data TKPI belum termuat (mungkin offline). Hasil lain tetap tampil; ketik lagi untuk mencoba.</p>';
  if (!has) return gdTk.st === 'busy' ? '<p class="gdnone" role="status">Memuat data TKPI…</p>' : '<p class="gdnone">Tidak ada di data lokal.</p>';
  return '';
}
gdTkpiFill();
/* ===== /3d-1a ===== */
const gdBlank = () => ({ updated: 0, mine: [], cache: [] });
let gdb = gdBlank();
let gdS = null;       // lembar porsi yang sedang terbuka: { it }
function gdItem(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const n = String(raw.n == null ? '' : raw.n).replace(/\s+/g, ' ').trim().slice(0, 80);
  const id = String(raw.id == null ? '' : raw.id).replace(/[^A-Za-z0-9:_.-]/g, '').slice(0, 48);
  if (!n || !id || !GD_SRC.includes(raw.src)) return null;
  const rv = raw.v && typeof raw.v === 'object' && !Array.isArray(raw.v) ? raw.v : {}, v = {};
  GD_NUT.forEach(a => { const x = rv[a[0]]; v[a[0]] = typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= a[3] ? Math.round(x * 100) / 100 : null; });
  if (v.kcal == null && v.p == null) return null;
  const por = (Array.isArray(raw.por) ? raw.por : []).slice(0, 8).map(p => {
    const pn = p && typeof p === 'object' ? String(p.n == null ? '' : p.n).replace(/\s+/g, ' ').trim().slice(0, 30) : '', pg = p && typeof p.g === 'number' ? p.g : NaN;
    return pn && Number.isFinite(pg) && pg >= 1 && pg <= 5000 ? { n: pn, g: Math.round(pg * 10) / 10 } : null;
  }).filter(Boolean);
  const ne = String(raw.ne == null ? '' : raw.ne).replace(/\s+/g, ' ').trim().slice(0, 80), bc = /^\d{8,14}$/.test(String(raw.bc)) ? String(raw.bc) : '';
  const at = typeof raw.at === 'number' && Number.isFinite(raw.at) && raw.at > 0 ? raw.at : 0;
  return { id, n, ne, src: raw.src, v, por, bc, at };
}
function gdClean(raw) {
  const b = gdBlank(); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const u = Number(raw.updated); b.updated = Number.isFinite(u) && u > 0 ? u : 0;
  const ids = new Set(), take = (list, cap, ok) => { const out = []; (Array.isArray(list) ? list : []).forEach(r => { if (out.length >= cap) return; const x = gdItem(r); if (x && ok(x) && !ids.has(x.id)) { ids.add(x.id); out.push(x); } }); return out; };
  b.mine = take(raw.mine, GD_MAX_MINE, () => true);
  b.cache = take(raw.cache, GD_MAX_CACHE, x => x.src !== 'manual' && x.src !== 'tkpi');
  return b;
}
STORES.gd = { key: GDB_KEY, get: () => gdb }; dirty.gd = false;   // 73x-2: isinya (bukan kunci USDA) ikut ekspor JSON lewat backupText
const gdSave = () => { gdb.updated = Date.now(); queueSave('gd'); };
const gdNorm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const gdStale = it => !it || !it.at || Date.now() - it.at > GD_STALE;
function gdFind(id) { return GD_TKPI.concat(gdb.mine, gdb.cache, gdNetS.res, gdUsS.res).find(x => x.id === id) || null; }
function gdSearch(q, lim) {   // relevansi dulu (sama persis, awalan, kata, mengandung), lalu urutan sumber TKPI > Makanan saya > kemasan > USDA > AI
  const nq = gdNorm(q); if (nq.length < 2) return [];
  gdTkpiEnsure();
  const tk = nq.split(' '), seen = new Set(), out = [];
  GD_TKPI.concat(gdb.mine, gdb.cache).forEach(it => {
    if (seen.has(it.id)) return; seen.add(it.id);
    const a = gdNorm(it.n), b = gdNorm(it.ne), hay = ' ' + a + ' ' + b;
    if (!tk.every(t => hay.includes(t))) return;
    out.push({ it, sc: a === nq || b === nq ? 0 : (a.startsWith(nq) || b.startsWith(nq)) ? 1 : tk.every(t => hay.includes(' ' + t)) ? 2 : 3 });
  });
  out.sort((x, y) => x.sc - y.sc || GD_SRC_RANK[x.it.src] - GD_SRC_RANK[y.it.src] || x.it.n.length - y.it.n.length || (x.it.n < y.it.n ? -1 : 1));
  return out.slice(0, lim || 6).map(o => o.it);
}
function gdCalc(it, g) { const o = {}; GD_NUT.forEach(a => { const x = it.v[a[0]]; o[a[0]] = x == null ? null : Math.round(x * g / 100 * 10) / 10; }); return o; }
function gdRemember(it) {   // riwayat: hanya hasil yang dipilih; TKPI dan Makanan saya tidak perlu disalin
  if (!it || it.src === 'manual' || it.src === 'tkpi' || gdb.mine.some(x => x.id === it.id)) return;
  gdb.cache = [Object.assign({}, it, { at: it.at || Date.now() })].concat(gdb.cache.filter(x => x.id !== it.id)).slice(0, GD_MAX_CACHE); gdSave();
}
const gdPer = it => 'per 100 g: ' + (it.v.kcal == null ? 'kkal tidak ada data' : fmt(it.v.kcal, 0) + ' kkal') + ' · ' + (it.v.p == null ? 'protein tidak ada data' : fmt(it.v.p, 1) + ' g protein');

/* --- saran di bawah kolom nama makanan --- */
/* ===== v73x3: satu daftar saran ===== */
function gdMerged(q) {   // lokal + hasil online (OFF, USDA) dalam satu daftar: relevansi dulu, lalu urutan sumber; maks 16
  const nq = gdNorm(q), tk = nq.split(' '), key = gdNetKey(q), bc = gdIsBc(key), seen = new Set(), out = [];
  const rel = (it, n) => { const a = gdNorm(it.n), b = gdNorm(it.ne), hay = ' ' + a + ' ' + b, w = n.split(' ');
    return a === n || b === n ? 0 : (a.startsWith(n) || b.startsWith(n)) ? 1 : w.every(t => hay.includes(' ' + t)) ? 2 : w.every(t => hay.includes(t)) ? 3 : 4; };
  const add = it => { if (!it || seen.has(it.id)) return; seen.add(it.id);
    let sc = bc && it.bc === key ? 0 : rel(it, nq); if (it.src === 'usda' && gdUsS.en) sc = Math.min(sc, rel(it, gdNorm(gdUsS.en)));
    out.push({ it, sc }); };
  gdSearch(q, 6).forEach(add);
  if (gdNetS.q === key) gdNetS.res.forEach(add);
  if (gdUsS.q === gdUsCur(q)) gdUsS.res.forEach(add);
  out.sort((x, y) => x.sc - y.sc || GD_SRC_RANK[x.it.src] - GD_SRC_RANK[y.it.src] || x.it.n.length - y.it.n.length || (x.it.n < y.it.n ? -1 : 1));
  return out.slice(0, 16).map(o => o.it);
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b73x3: Object.freeze({ merged: q => gdMerged(q).map(x => x.id) }) }));
/* ===== /v73x3 ===== */
function gdHide() { const b = $('#gdSug'); if (b) { b.hidden = true; b.innerHTML = ''; } }
function gdSugPaint() {
  const inp = $('#mName'), b = $('#gdSug'); if (!inp || !b) return;
  const q = inp.value.trim(); if (gdNorm(q).length < 2) { gdHide(); return; }
  const r = gdMerged(q);
  b.innerHTML = r.map(it => '<button type="button" class="gdr" role="option" data-q="gdPick" data-id="' + esc(it.id) + '"><b>' + esc(it.n) + '</b><small>' + esc(GD_SRC_LBL[it.src]) + ' · ' + esc(gdPer(it)) + '</small></button>').join('') +
    gdTkNote(r.length) + gdNetHTML(q, 1) + gdUsHTML(q, 1) + '<button type="button" class="gdr" data-q="gdNew" data-name="' + esc(q.slice(0, 80)) + '"><b>+ Buat “' + esc(q.slice(0, 40)) + '” di Makanan saya</b></button>';
  b.hidden = false;
}
document.addEventListener('input', ev => { const t = ev.target; if (t && t.id === 'mName') gdSugPaint(); else if (t && t.id === 'gdG') gdPrevPaint(); });
document.addEventListener('click', ev => { const t = ev.target, sg = $('#gdSug'); if (t && t.closest && !t.closest('#gdSug') && !(sg && ev.composedPath().includes(sg)) && t.id !== 'mName') gdHide(); });
{ const _ma = QACT.mAdd; QACT.mAdd = el => { _ma(el); gdHide(); }; }

/* --- lembar porsi --- */
function gdPrevHTML(it, g) {
  if (g == null || g < 1 || g > 5000) return '<p class="note">Isi berat 1–5000 gram.</p>';
  const c = gdCalc(it, g);
  return '<div class="gdprev">' + GD_NUT.map(a => '<div><span>' + a[1] + '</span>' + (c[a[0]] == null ? '<span class="nd">tidak ada data</span>' : '<b>' + fmt(c[a[0]], 1) + ' ' + a[2] + '</b>') + '</div>').join('') + '</div>';
}
function gdPrevPaint() { const s = gdS, e = $('#gdPrev'), i = $('#gdG'); if (s && e && i) e.innerHTML = gdPrevHTML(s.it, num(i.value)); }
function gdOpen(it) {
  const g0 = it.por.length ? it.por[0].g : 100; gdS = { it };
  openSheet({ title: it.n, note: it.ne || '', onClose: () => { gdS = null; },
    extra: '<span class="gdbd">' + esc(GD_SRC_LBL[it.src]) + '</span><label class="inp"><input id="gdG" inputmode="decimal" autocomplete="off" value="' + g0 + '" aria-label="Berat dalam gram"><span class="u">gram</span></label>' +
      (it.por.length ? '<div class="quick">' + it.por.map(p => '<button type="button" class="btn sm" data-q="gdGram" data-g="' + p.g + '">' + esc(p.n) + ' · ' + fmt(p.g, 0) + ' g</button>').join('') + '</div>' : '') +
      '<div id="gdPrev">' + gdPrevHTML(it, g0) + '</div>' + gdCredit(it),
    actions: [{ label: 'Isi ke form makan', primary: true, fn: gdUse }, closeBtn] });
}
function gdUse() {
  const s = gdS; if (!s) return; const g = num($('#gdG').value);
  if (g == null || g < 1 || g > 5000) { toast('Isi berat 1–5000 gram'); return; }
  const c = gdCalc(s.it, g), nm = $('#mName'), k = $('#mK'), p = $('#mP'); if (!nm || !k || !p) return;
  nm.value = (s.it.n.slice(0, 44) + ' · ' + fmt(g, 0) + ' g').slice(0, 60);
  k.value = c.kcal == null ? '' : String(Math.round(c.kcal)); p.value = c.p == null ? '' : String(c.p);
  gdRemember(s.it); closeSheet(); gdHide(); toast('Terisi. Pilih waktu makan lalu ketuk Tambah makanan');
}
QACT.gdPick = el => { const it = gdFind(el.dataset.id); if (it) gdOpen(it); };
QACT.gdGram = el => { const i = $('#gdG'); if (i) { i.value = el.dataset.g; gdPrevPaint(); } };

/* --- Makanan saya --- */
function gdMineOpen() {
  const l = gdb.mine;
  openSheet({ title: 'Makanan saya (' + l.length + ')', note: 'Nilai per 100 g. Tidak pernah dihapus otomatis. Tersimpan di perangkat ini dan ikut Cadangkan JSON.',
    extra: l.length ? l.map(x => '<div class="mrow"><div class="mt"><b>' + esc(x.n) + '</b><small>' + esc(gdPer(x)) + '</small></div><button type="button" class="btn sm ghost" data-q="gdEdit" data-id="' + esc(x.id) + '">Ubah</button><button type="button" class="btn sm ghost" data-q="gdDel" data-id="' + esc(x.id) + '">Hapus</button></div>').join('') : '<p class="note">Belum ada. Ketuk “Buat baru”, atau ketik nama di form makan lalu pilih “Buat di Makanan saya”.</p>',
    actions: [{ label: '+ Buat baru', primary: true, fn: () => gdFormOpen(null, '') }, closeBtn] });
}
function gdFormOpen(it, name) {
  const v = it ? it.v : {}, val = k => v[k] == null ? '' : v[k], pr = it ? it.por : [];
  const inp = (id, lbl, u, x) => '<label class="inp sm"><input id="gdf_' + id + '" inputmode="decimal" autocomplete="off" placeholder="' + lbl + '" value="' + esc(x) + '" aria-label="' + lbl + (u ? ' per 100 g, ' + u : '') + '">' + (u ? '<span class="u">' + u + '</span>' : '') + '</label>';
  const porRow = i => '<div class="addrow">' + inp('pn' + i, 'Nama porsi', '', pr[i] ? pr[i].n : '') + inp('pg' + i, 'Gram', 'g', pr[i] ? pr[i].g : '') + '</div>';
  openSheet({ title: it ? 'Ubah makanan' : 'Makanan baru', note: 'Nilai per 100 g. Kosongkan bila tidak tahu: tercatat “tidak ada data”, bukan 0. Isi minimal kalori atau protein.',
    extra: '<div class="gdfm"><label class="inp sm"><input id="gdf_n" maxlength="80" autocomplete="off" placeholder="Nama makanan" value="' + esc(it ? it.n : name) + '" aria-label="Nama makanan"></label>' +
      '<label class="inp sm"><input id="gdf_ne" maxlength="80" autocomplete="off" placeholder="Nama Inggris (opsional)" value="' + esc(it ? it.ne : '') + '" aria-label="Nama Inggris"></label>' +
      '<div class="gdg">' + GD_NUT.map(a => inp(a[0], a[1], a[2], val(a[0]))).join('') + '</div><div class="sublbl">Porsi (opsional, dalam gram)</div>' + porRow(0) + porRow(1) + '</div>',
    actions: [{ label: 'Simpan', primary: true, fn: () => gdFormSave(it ? it.id : '') }, { label: 'Batal', fn: gdMineOpen }] });
}
function gdFormSave(id) {
  const g = k => { const e = $('#gdf_' + k); return e ? String(e.value).trim() : ''; };
  const n = g('n').replace(/\s+/g, ' ').slice(0, 80); if (!n) { toast('Isi nama makanan dulu'); return; }
  const v = {};
  for (const a of GD_NUT) { const raw = g(a[0]); if (raw === '') { v[a[0]] = null; continue; } const x = num(raw); if (x == null || x < 0 || x > a[3]) { toast(a[1] + ' harus 0–' + a[3] + ' per 100 g, atau kosongkan'); return; } v[a[0]] = x; }
  if (v.kcal == null && v.p == null) { toast('Isi kalori atau protein per 100 g'); return; }
  const por = [];
  for (let i = 0; i < 2; i++) { const pn = g('pn' + i).slice(0, 30), pg = g('pg' + i); if (!pn && !pg) continue; const x = num(pg); if (!pn || x == null || x < 1 || x > 5000) { toast('Porsi ' + (i + 1) + ': isi nama dan gram (1–5000)'); return; } por.push({ n: pn, g: x }); }
  const old = id ? gdb.mine.find(x => x.id === id) : null;
  if (!old && gdb.mine.length >= GD_MAX_MINE) { toast('Makanan saya penuh (' + GD_MAX_MINE + ')'); return; }
  if (gdb.mine.some(x => x.id !== id && gdNorm(x.n) === gdNorm(n))) { toast('Nama itu sudah ada di Makanan saya'); return; }
  const it = gdItem({ id: old ? old.id : 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), n, ne: g('ne'), src: old ? old.src : 'manual', v, por, bc: old ? old.bc : '', at: Date.now() });
  if (!it) { toast('Data tidak valid'); return; }
  if (old) gdb.mine[gdb.mine.indexOf(old)] = it; else gdb.mine.unshift(it);
  gdSave(); toast('Tersimpan di Makanan saya'); gdMineOpen(); gdSugPaint();
}
QACT.gdMine = () => gdMineOpen();
QACT.gdNew = el => gdFormOpen(null, el.dataset.name || '');
QACT.gdEdit = el => { const it = gdb.mine.find(x => x.id === el.dataset.id); if (it) gdFormOpen(it, ''); };
QACT.gdDel = el => {   // dua ketukan: pertama minta konfirmasi, kedua menghapus
  if (el.dataset.arm !== '1') { el.dataset.arm = '1'; el.textContent = 'Yakin hapus?'; setTimeout(() => { if (el.isConnected) { el.dataset.arm = ''; el.textContent = 'Hapus'; } }, 3000); return; }
  const i = gdb.mine.findIndex(x => x.id === el.dataset.id);
  if (i >= 0) { gdb.mine.splice(i, 1); gdSave(); toast('Dihapus dari Makanan saya'); }
  gdMineOpen(); gdSugPaint();
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b73a: Object.freeze({
  item: gdItem, clean: gdClean, search: (q, n) => JSON.parse(JSON.stringify(gdSearch(q, n))), calc: gdCalc, stale: gdStale, norm: gdNorm,
  st: () => ({ mine: gdb.mine.length, cache: gdb.cache.length, tkpi: GD_TKPI.length, updated: gdb.updated }), cache: () => gdb.cache.map(x => x.id), mine: () => JSON.parse(JSON.stringify(gdb.mine)),
  test: Object.freeze({ tkpiSt: () => Object.assign({}, gdTk), remember: it => gdRemember(gdItem(it)), tkpi: list => { (list || []).forEach(r => { const x = gdItem(r); if (x) GD_TKPI.push(x); }); }, caps: () => ({ mine: GD_MAX_MINE, cache: GD_MAX_CACHE, stale: GD_STALE }) })
}) }));

/* ===== v73c: Open Food Facts (nama + barcode) ===== */
// Pencarian ONLINE hanya atas ketukan pemilik (tombol), BUKAN setiap ketikan: dokumentasi Open Food Facts membatasi pencarian ±10/menit per IP dan melarang search-as-you-type.
// Satu batas waktu ±6 detik untuk seluruh operasi. Gagal/offline -> hanya hasil lokal. Hasil yang DIPILIH masuk riwayat (gdRemember). Tidak ada kunci/akun.
const GD_NET_MS = 6000, GD_NET_LIM = { s: 8, b: 12 }, GD_NET_WIN = 60000, GD_OFF_PAGE = 10;
const GD_OFF_HOST = 'https://world.openfoodfacts.org';
const GD_OFF_FIELDS = 'code,product_name,product_name_id,product_name_en,generic_name,brands,quantity,serving_size,serving_quantity,nutriments';
const gdOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
const GD_NET_ERR = { off: 'Sedang offline. Menampilkan hasil lokal saja.', net: 'Tidak tersambung atau lebih dari 6 detik. Menampilkan hasil lokal saja.', http: 'Open Food Facts sedang bermasalah. Coba lagi nanti.', bad: 'Jawaban Open Food Facts tidak terbaca.', limit: 'Open Food Facts menolak (terlalu sering). Tunggu sebentar.', rate: 'Pencarian online sudah banyak barusan. Coba lagi sebentar lagi.', bc: 'Nomor barcode tampaknya salah ketik (angka cek tidak cocok). Periksa lagi.' };
const gdNetLog = { s: [], b: [] };
const gdNetS = { q: '', st: 'idle', err: '', res: [], hid: 0, nf: false, note: '', seq: 0, ctl: null };
const gdErr = c => { const e = new Error('gd:' + c); e.gd = c; return e; };
function gdNetOk(kind, now) {   // pembatas sisi klien (bukan pengganti batas server)
  const t = now == null ? Date.now() : now, l = gdNetLog[kind].filter(x => t - x < GD_NET_WIN && x <= t + 1000);
  gdNetLog[kind] = l; if (l.length >= GD_NET_LIM[kind]) return false; l.push(t); return true;
}
function gdBcValid(code) {   // angka cek GTIN (EAN-8, UPC-A 12, EAN-13, GTIN-14)
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  let s = 0; for (let i = code.length - 2, w = 3; i >= 0; i--, w = 4 - w) s += (code.charCodeAt(i) - 48) * w;
  return (10 - s % 10) % 10 === code.charCodeAt(code.length - 1) - 48;
}
const gdOffNum = x => { const n = typeof x === 'string' && x.trim() !== '' ? Number(x) : x; return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null; };
function gdOffMap(p, now) {   // produk Open Food Facts -> skema seragam; null bila tidak layak (tanpa kalori/protein, satuan jelas salah, tanpa nama/barcode)
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const code = String(p.code == null ? '' : p.code).trim(); if (!/^\d{8,14}$/.test(code)) return null;
  const nu = p.nutriments && typeof p.nutriments === 'object' && !Array.isArray(p.nutriments) ? p.nutriments : {};
  const g = k => gdOffNum(nu[k + '_100g']), mul = (x, f) => x == null ? null : x * f;
  let kcal = g('energy-kcal'); if (kcal == null) kcal = mul(g('energy-kj') != null ? g('energy-kj') : g('energy'), 1 / 4.184);   // energy_100g = kJ
  const v = { kcal, p: g('proteins'), f: g('fat'), c: g('carbohydrates'), fiber: g('fiber'), sugar: g('sugars'), na: g('sodium') != null ? mul(g('sodium'), 1000) : mul(g('salt'), 400), k: mul(g('potassium'), 1000), mg: mul(g('magnesium'), 1000) };   // OFF: natrium/kalium/magnesium dalam GRAM per 100 g -> mg
  if ((v.p || 0) + (v.f || 0) + (v.c || 0) > 105) return null;   // protein+lemak+karbo > 105 g per 100 g = satuan salah di data kontributor
  const nm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const name = nm(p.product_name_id) || nm(p.product_name) || nm(p.product_name_en) || nm(p.generic_name); if (!name) return null;
  const brand = nm(String(p.brands == null ? '' : p.brands).split(',')[0]);
  const full = brand && brand.length <= 30 && !gdNorm(name).includes(gdNorm(brand)) ? name.slice(0, 80 - brand.length - 3).trim() + ' (' + brand + ')' : name;
  const en = nm(p.product_name_en), por = [], sq = gdOffNum(p.serving_quantity);
  if (sq != null && sq >= 1 && sq <= 5000) por.push({ n: ('Sajian ' + nm(p.serving_size)).trim().slice(0, 30), g: sq });
  const qm = /^(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram)$/i.exec(nm(p.quantity));
  if (qm) { const q = Number(qm[1].replace(',', '.')); if (q >= 1 && q <= 5000 && !por.some(x => x.g === q)) por.push({ n: ('Kemasan ' + nm(p.quantity)).slice(0, 30), g: q }); }
  return gdItem({ id: 'off:' + code, n: full, ne: en && gdNorm(en) !== gdNorm(full) ? en : '', src: 'off', v, por, bc: code, at: now == null ? Date.now() : now });
}
const gdOffSearchUrl = (q, idn) => GD_OFF_HOST + '/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=' + GD_OFF_PAGE + '&fields=' + GD_OFF_FIELDS + (idn ? '&tagtype_0=countries&tag_contains_0=contains&tag_0=indonesia' : '');
const gdOffBarcodeUrl = code => GD_OFF_HOST + '/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + GD_OFF_FIELDS;
async function gdNetJson(url, signal) {
  let res;
  try { res = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' }); } catch (e) { throw gdErr(gdOffline() ? 'off' : 'net'); }
  if (res.status === 429) throw gdErr('limit');
  if (!res.ok) throw gdErr('http');
  try { return await res.json(); } catch (e) { throw gdErr(signal && signal.aborted ? 'net' : 'bad'); }
}
async function gdOffSearch(q, signal) {   // Indonesia dulu; bila kurang dari 3 hasil layak, tambah pencarian dunia
  const seen = new Set(), items = []; let hid = 0;
  const take = js => {
    const list = js && typeof js === 'object' && Array.isArray(js.products) ? js.products : null; if (!list) throw gdErr('bad');
    list.forEach(p => { const code = p && p.code != null ? String(p.code) : ''; if (!code || seen.has(code)) { if (!code) hid++; return; } seen.add(code); const it = gdOffMap(p); if (it) items.push(it); else hid++; });
  };
  if (!gdNetOk('s')) throw gdErr('rate');
  take(await gdNetJson(gdOffSearchUrl(q, true), signal));
  if (items.length < 3 && gdNetOk('s')) { try { take(await gdNetJson(gdOffSearchUrl(q, false), signal)); } catch (e) { if (!items.length) throw e; } }
  return { items: items.slice(0, 8), hid };
}
async function gdOffBarcode(code, signal) {
  if (!gdNetOk('b')) throw gdErr('rate');
  const js = await gdNetJson(gdOffBarcodeUrl(code), signal);
  if (!js || typeof js !== 'object' || Array.isArray(js)) throw gdErr('bad');
  if (js.status === 0 || !js.product || typeof js.product !== 'object') return { items: [], hid: 0, nf: true };
  const it = gdOffMap(Object.assign({}, js.product, { code: js.product.code || code }));
  return it ? { items: [it], hid: 0, nf: false } : { items: [], hid: 1, nf: false };
}
const gdNetKey = raw => { const d = String(raw).replace(/\s+/g, ''); return /^\d{8,14}$/.test(d) ? d : gdNorm(raw); };
const gdIsBc = k => /^\d{8,14}$/.test(k);
async function gdNetGo(raw) {
  const key = gdNetKey(raw); if (key.length < 3) return;
  if (gdNetS.ctl) { try { gdNetS.ctl.abort(); } catch (e) { /* abaikan */ } }
  const seq = ++gdNetS.seq, ctl = typeof AbortController === 'function' ? new AbortController() : null; gdNetS.ctl = ctl;
  const loc = gdIsBc(key) ? gdb.mine.concat(gdb.cache).find(x => x.bc === key) : null;   // barcode yang sudah pernah dipilih: tanpa jaringan bila masih segar
  if (loc && !gdStale(loc)) { Object.assign(gdNetS, { q: key, st: 'ok', err: '', res: [loc], hid: 0, nf: false, note: 'Dari riwayat di perangkat ini (tanpa internet).' }); gdSugPaint(); return; }
  if (gdIsBc(key) && !gdBcValid(key)) { Object.assign(gdNetS, { q: key, st: 'err', err: 'bc', res: [], hid: 0, nf: false, note: '' }); gdSugPaint(); return; }
  if (gdOffline()) { gdSugPaint(); return; }
  Object.assign(gdNetS, { q: key, st: 'busy', err: '', res: [], hid: 0, nf: false, note: '' }); gdSugPaint();
  const tm = setTimeout(() => { if (ctl) ctl.abort(); }, GD_NET_MS);
  try {
    const out = gdIsBc(key) ? await gdOffBarcode(key, ctl ? ctl.signal : undefined) : await gdOffSearch(raw.trim(), ctl ? ctl.signal : undefined);
    if (seq !== gdNetS.seq) return;
    Object.assign(gdNetS, { st: 'ok', res: out.items, hid: out.hid, nf: !!out.nf });
  } catch (e) {
    if (seq !== gdNetS.seq) return;
    const c = e && e.gd ? e.gd : 'net';
    if (loc) Object.assign(gdNetS, { st: 'ok', err: '', res: [loc], note: 'Offline: memakai data tersimpan (lebih dari 30 hari).' });
    else Object.assign(gdNetS, { st: 'err', err: c, res: [] });
  } finally { clearTimeout(tm); }
  gdSugPaint();
}
function gdNetHTML(q, nr) {   // bagian saran: hasil online, status, dan tombol cari
  const s = gdNetS, key = gdNetKey(q), mine = s.q === key, bc = gdIsBc(key); let h = '';
  if (mine && s.res.length && !nr) h += '<div class="gdlbl">Open Food Facts · kemasan</div>' + s.res.map(it => '<button type="button" class="gdr" role="option" data-q="gdPick" data-id="' + esc(it.id) + '"><b>' + esc(it.n) + '</b><small>' + esc(GD_SRC_LBL[it.src]) + ' · ' + esc(gdPer(it)) + '</small></button>').join('');
  if (mine && s.note) h += '<p class="gdnone">' + esc(s.note) + '</p>';
  if (mine && s.st === 'busy') h += '<p class="gdnone" role="status">Mencari di Open Food Facts…</p>';
  if (mine && s.st === 'ok') {
    const bits = []; if (!s.res.length) bits.push(s.nf ? 'Barcode ini tidak ada di Open Food Facts.' : 'Tidak ada hasil dengan data gizi di Open Food Facts.');
    if (s.hid) bits.push(s.hid + ' hasil tanpa data gizi yang layak disembunyikan.');
    if (bits.length) h += '<p class="gdnone" role="status">' + esc(bits.join(' ')) + '</p>';
  }
  if (mine && s.st === 'err') h += '<p class="gdnone" role="alert">' + esc(GD_NET_ERR[s.err] || GD_NET_ERR.net) + '</p>';
  if (key.length >= 3 && gdOffline() && !(mine && (s.st === 'busy' || s.st === 'ok'))) h += '<p class="gdnone" role="status">Sedang offline: hanya data lokal (TKPI, Makanan saya, riwayat). Pencarian online aktif lagi saat internet kembali.</p>';
  else if (key.length >= 3 && !(mine && (s.st === 'busy' || s.st === 'ok'))) h += '<button type="button" class="gdr gdnb" data-q="gdOff"><b>' + (bc ? 'Cari barcode ' + esc(key) : 'Cari “' + esc(q.trim().slice(0, 30)) + '”') + ' di Open Food Facts</b><small>Perlu internet. Teks/nomor ini dikirim ke openfoodfacts.org.</small></button>';
  return h;
}
const gdCredit = it => it && it.src === 'off' ? '<p class="note">Data dari Open Food Facts (lisensi ODbL), diisi kontributor. Cocokkan dengan label kemasan.</p>' : it && it.src === 'usda' ? '<p class="note">Data dari USDA FoodData Central (domain publik). Nilai per 100 g, bahan dan produk Amerika; cocokkan dengan makananmu.</p>' : '';
QACT.gdOff = () => { const i = $('#mName'); if (i) gdNetGo(i.value); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b73c: Object.freeze({
  map: (p, now) => { const x = gdOffMap(p, now); return x ? JSON.parse(JSON.stringify(x)) : null; }, searchUrl: gdOffSearchUrl, barcodeUrl: gdOffBarcodeUrl, bcValid: gdBcValid, key: gdNetKey,
  state: () => ({ q: gdNetS.q, st: gdNetS.st, err: gdNetS.err, n: gdNetS.res.length, hid: gdNetS.hid, nf: gdNetS.nf, note: gdNetS.note, ids: gdNetS.res.map(x => x.id) }),
  test: Object.freeze({ reset: () => { gdNetLog.s = []; gdNetLog.b = []; gdNetS.seq++; Object.assign(gdNetS, { q: '', st: 'idle', err: '', res: [], hid: 0, nf: false, note: '' }); }, ok: gdNetOk, go: gdNetGo, log: () => ({ s: gdNetLog.s.length, b: gdNetLog.b.length }), lim: () => Object.assign({ ms: GD_NET_MS, win: GD_NET_WIN }, GD_NET_LIM) })
}) }));
/* ===== v73c3: scan barcode lewat kamera (BarcodeDetector) ===== */
// Kamera dibuka HANYA atas ketukan tombol "Scan barcode". Gambar TIDAK disimpan dan TIDAK dikirim; yang dikirim hanya nomor barcode (lewat gdNetGo, jalur 73v-1 yang sama).
// Aliran kamera dihentikan saat dialog ditutup, kode terbaca, halaman disembunyikan, waktu habis (60 dtk), atau galat. Tombol hanya tampil bila peramban punya BarcodeDetector + getUserMedia
// (Chrome Android/Mac; iOS Safari dan Firefox umumnya tidak): selain itu cadangan ketik nomor di kolom nama makanan tetap berlaku.
let GD_SCAN_MAX = 60000;
const GD_SCAN_FMT = ['ean_13', 'ean_8', 'upc_a'], GD_SCAN_POLL = 250, GD_SCAN_NEED = 2;
const GD_SCAN_MSG = {
  perm: 'Izin kamera ditolak. Aktifkan izin kamera untuk situs ini, atau ketik nomor barcode di kolom nama makanan.',
  nocam: 'Kamera tidak ditemukan di perangkat ini. Ketik nomor barcode di kolom nama makanan.',
  cam: 'Kamera tidak bisa dibuka. Ketik nomor barcode di kolom nama makanan.',
  fmt: 'Peramban ini tidak bisa membaca barcode kemasan. Ketik nomor barcode di kolom nama makanan.',
  time: 'Barcode belum terbaca. Dekatkan kemasan, cukup cahaya, atau ketik nomor barcode di kolom nama makanan.',
  live: 'Arahkan barcode ke garis merah. Tahan sebentar.'
};
const gdScan = { tok: 0, stream: null, timer: 0, tmax: 0, last: '', same: 0, st: 'idle', err: '', code: '', gum: null };
const gdScanSupported = () => typeof window.BarcodeDetector === 'function' && !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
function gdScanSt(msg, live) {
  const e = $('#gdScanSt'); if (e) e.textContent = msg;
  const w = $('#gdScanBox'); if (w) w.classList.toggle('live', !!live);
}
function gdScanStop(why) {   // menghentikan kamera + pemindaian; aman dipanggil berulang
  gdScan.tok++; clearTimeout(gdScan.timer); clearTimeout(gdScan.tmax); gdScan.timer = 0; gdScan.tmax = 0;
  const s = gdScan.stream; gdScan.stream = null;
  if (s) { try { s.getTracks().forEach(t => t.stop()); } catch (e) { /* abaikan */ } }
  const v = $('#gdVid'); if (v) { try { v.pause(); v.srcObject = null; } catch (e) { /* abaikan */ } }
  gdScan.last = ''; gdScan.same = 0; if (why) gdScan.st = why === 'ok' ? 'done' : 'idle';
}
function gdScanFail(code) {
  gdScanStop(); gdScan.st = 'err'; gdScan.err = code;
  const b = $('#gdScanBox'); if (b) b.hidden = true;
  gdScanSt(GD_SCAN_MSG[code] || GD_SCAN_MSG.cam, false);
}
function gdScanDone(code) {
  gdScanStop('ok'); gdScan.code = code; closeSheet();
  const nm = $('#mName'); if (nm) { nm.value = code; }
  gdNetGo(code); toast('Barcode ' + code + ' terbaca');
}
async function gdScanOpen() {
  if (!gdScanSupported()) { toast('Scan barcode belum didukung di peramban ini. Ketik nomor di kolom nama.'); return; }
  gdScanStop(); gdScan.st = 'starting'; gdScan.err = ''; gdScan.code = '';
  const tok = gdScan.tok;
  openSheet({ title: 'Scan barcode', note: 'Kamera hanya dipakai di layar ini. Gambar tidak disimpan dan tidak dikirim; hanya nomor barcode yang dicari.',
    onClose: () => { gdScanStop(); if (gdScan.st !== 'done' && gdScan.st !== 'err') gdScan.st = 'idle'; },
    extra: '<div class="gdscan" id="gdScanBox"><video class="gdvid" id="gdVid" playsinline muted autoplay></video></div><p class="gdscst" id="gdScanSt" role="status">Membuka kamera…</p>',
    actions: [{ label: 'Batal', fn: closeSheet }] });
  let fmts = GD_SCAN_FMT;
  try { if (typeof window.BarcodeDetector.getSupportedFormats === 'function') { const sup = await window.BarcodeDetector.getSupportedFormats(); fmts = GD_SCAN_FMT.filter(f => sup.includes(f)); } } catch (e) { /* pakai daftar bawaan */ }
  if (tok !== gdScan.tok) return;
  if (!fmts.length) { gdScanFail('fmt'); return; }
  let det; try { det = new window.BarcodeDetector({ formats: fmts }); } catch (e) { gdScanFail('fmt'); return; }
  let stream;
  try {
    gdScan.gum = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    stream = await navigator.mediaDevices.getUserMedia(gdScan.gum);
  } catch (e) {
    if (tok !== gdScan.tok) return;
    const n = e && e.name; gdScanFail(n === 'NotAllowedError' || n === 'SecurityError' ? 'perm' : (n === 'NotFoundError' || n === 'OverconstrainedError' ? 'nocam' : 'cam')); return;
  }
  if (tok !== gdScan.tok) { try { stream.getTracks().forEach(t => t.stop()); } catch (e) { /* abaikan */ } return; }   // dibatalkan saat menunggu izin: matikan kamera segera
  gdScan.stream = stream; gdScan.st = 'live';
  const v = $('#gdVid'); if (!v) { gdScanStop(); return; }
  v.srcObject = stream; gdScanSt(GD_SCAN_MSG.live, true);   // petunjuk tampil SEGERA saat aliran terpasang (sebelumnya menunggu play(): status 'live' sudah benar tetapi teks masih 'Membuka kamera')
  try { await v.play(); } catch (e) { /* autoplay sudah ada; abaikan */ }
  if (tok !== gdScan.tok) return;
  gdScan.tmax = setTimeout(() => { if (tok === gdScan.tok) gdScanFail('time'); }, GD_SCAN_MAX);
  const tick = async () => {
    if (tok !== gdScan.tok) return;
    try {
      if (v.readyState >= 2) {
        const r = await det.detect(v); if (tok !== gdScan.tok) return;
        const hit = (r || []).map(x => String(x && x.rawValue || '').replace(/\s+/g, '')).find(c => /^\d{8,14}$/.test(c) && gdBcValid(c));
        if (hit) { if (hit === gdScan.last) gdScan.same++; else { gdScan.last = hit; gdScan.same = 1; } if (gdScan.same >= GD_SCAN_NEED) { gdScanDone(hit); return; } }
        else { gdScan.last = ''; gdScan.same = 0; }
      }
    } catch (e) { /* satu bingkai gagal: lanjut */ }
    if (tok === gdScan.tok) gdScan.timer = setTimeout(tick, GD_SCAN_POLL);
  };
  gdScan.timer = setTimeout(tick, GD_SCAN_POLL);
}
QACT.gdScan = () => { gdScanOpen(); };
function gdScanMount() {
  if (!gdScanSupported() || $('#gdScanBtn')) return;
  const row = document.querySelector('#mealForm ~ .gdrow') || document.querySelector('.gdrow'); if (!row) return;
  row.insertAdjacentHTML('beforeend', ' <button type="button" class="btn sm ghost" id="gdScanBtn" data-q="gdScan">Scan barcode</button>');
}
gdScanMount(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gdScanMount);
document.addEventListener('visibilitychange', () => { if (document.hidden && (gdScan.st === 'starting' || gdScan.st === 'live')) { closeSheet(); } });
window.DL = Object.freeze(Object.assign({}, window.DL, { b73c3: Object.freeze({
  supported: gdScanSupported, state: () => ({ st: gdScan.st, err: gdScan.err, code: gdScan.code, live: !!gdScan.stream, gum: gdScan.gum }),
  test: Object.freeze({ max: ms => { GD_SCAN_MAX = ms; }, need: () => GD_SCAN_NEED, fmt: () => GD_SCAN_FMT.slice() })
}) }));
/* ===== /v73c3 ===== */

/* ===== v73w: USDA FoodData Central (kunci di Data, pencarian hanya atas ketukan) ===== */
// Kunci USDA disimpan di perangkat ini (localStorage 'dailylog:usda:v1'), TIDAK lewat STORES, jadi tidak ikut ekspor JSON. Hanya dikirim ke api.nal.usda.gov.
// Nama bahan umum: Foundation + SR Legacy. Barcode: Branded, hasil dicocokkan ke gtinUpc. Hasil berbahasa Inggris. Gagal/offline -> hasil lokal tetap tampil.
const GD_US_HOST = 'https://api.nal.usda.gov/fdc/v1/foods/search', GD_US_KEY = 'dailylog:usda:v1', GD_US_LIM = 8, GD_US_WIN = 60000;
const GD_US_ERR = { off: 'Sedang offline. Menampilkan hasil lokal saja.', net: 'USDA tidak tersambung atau lebih dari 6 detik. Menampilkan hasil lokal saja.', http: 'USDA sedang bermasalah. Coba lagi nanti.', bad: 'Jawaban USDA tidak terbaca.', key: 'Kunci USDA ditolak. Periksa kunci di Data > Kunci USDA.', limit: 'USDA menolak (terlalu sering). Tunggu sebentar.', rate: 'Pencarian USDA terlalu sering dari aplikasi ini. Tunggu sebentar.', bc: 'Nomor barcode tidak sah (angka cek salah). Periksa nomornya.' };
const GD_US_DICT2 = { 'dada ayam': 'chicken breast', 'paha ayam': 'chicken thigh', 'sayap ayam': 'chicken wing', 'daging sapi': 'beef', 'daging ayam': 'chicken', 'telur ayam': 'egg', 'putih telur': 'egg white', 'kuning telur': 'egg yolk', 'nasi putih': 'white rice cooked', 'nasi merah': 'brown rice cooked', 'minyak zaitun': 'olive oil', 'minyak kelapa': 'coconut oil', 'kacang tanah': 'peanuts', 'kacang hijau': 'mung beans', 'kacang merah': 'kidney beans', 'kacang kedelai': 'soybeans', 'ubi jalar': 'sweet potato', 'susu sapi': 'milk', 'roti tawar': 'white bread', 'roti gandum': 'whole wheat bread', 'tepung terigu': 'wheat flour', 'gula pasir': 'sugar', 'gula merah': 'brown sugar', 'bawang merah': 'onion', 'bawang putih': 'garlic', 'bawang bombay': 'onion', 'ikan salmon': 'salmon', 'ikan tuna': 'tuna', 'ikan lele': 'catfish', 'ikan nila': 'tilapia', 'mie instan': 'instant noodles', 'kentang goreng': 'french fries' };
const GD_US_DICT1 = { ayam: 'chicken', bebek: 'duck', sapi: 'beef', daging: 'meat', kambing: 'lamb', babi: 'pork', ikan: 'fish', udang: 'shrimp', cumi: 'squid', kepiting: 'crab', telur: 'egg', nasi: 'rice cooked', beras: 'rice', tahu: 'tofu', tempe: 'tempeh', susu: 'milk', keju: 'cheese', mentega: 'butter', roti: 'bread', mie: 'noodles', bihun: 'rice noodles', kentang: 'potato', ubi: 'sweet potato', singkong: 'cassava', jagung: 'corn', bayam: 'spinach', wortel: 'carrot', brokoli: 'broccoli', kol: 'cabbage', sawi: 'mustard greens', kangkung: 'water spinach', tomat: 'tomato', bawang: 'onion', cabai: 'chili pepper', timun: 'cucumber', mentimun: 'cucumber', terong: 'eggplant', labu: 'pumpkin', buncis: 'green beans', kacang: 'peanuts', kedelai: 'soybeans', pisang: 'banana', apel: 'apple', jeruk: 'orange', mangga: 'mango', alpukat: 'avocado', nanas: 'pineapple', semangka: 'watermelon', pepaya: 'papaya', anggur: 'grape', stroberi: 'strawberry', kelapa: 'coconut', kurma: 'dates', pir: 'pear', minyak: 'oil', gula: 'sugar', garam: 'salt', madu: 'honey', tepung: 'flour', oat: 'oats', gandum: 'wheat', cokelat: 'chocolate', coklat: 'chocolate', kopi: 'coffee', teh: 'tea', air: 'water', santan: 'coconut milk', kecap: 'soy sauce', dada: 'breast', paha: 'thigh', sayap: 'wing', mentah: 'raw', matang: 'cooked', rebus: 'boiled', goreng: 'fried', panggang: 'roasted', putih: 'white', merah: 'red', hijau: 'green', hitam: 'black', segar: 'fresh' };
let gdUsKey = '', gdUsMem = false, gdUsOpenP = false;   // gdUsMem: true bila kunci hanya di memori (penyimpanan perangkat tidak ada)
const gdUsKeyOk = k => typeof k === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(k);
try { const raw = localStorage.getItem(GD_US_KEY), o = raw ? JSON.parse(raw) : null; if (o && typeof o === 'object' && gdUsKeyOk(o.key)) gdUsKey = o.key; } catch (e) { /* abaikan */ }
function gdUsSave(k) {   // true bila tersimpan di perangkat; false bila hanya di memori
  gdUsKey = k; gdUsMem = false;
  try { if (k) localStorage.setItem(GD_US_KEY, JSON.stringify({ key: k, updated: Date.now() })); else localStorage.removeItem(GD_US_KEY); return true; } catch (e) { gdUsMem = !!k; return !k; }
}
const gdUsLog = [];
const gdUsS = { q: '', st: 'idle', err: '', res: [], hid: 0, en: '', bc: false, seq: 0, ctl: null };
function gdUsOk(now) {
  const t = now == null ? Date.now() : now, l = gdUsLog.filter(x => t - x < GD_US_WIN && x <= t + 1000);
  gdUsLog.length = 0; l.forEach(x => gdUsLog.push(x)); if (l.length >= GD_US_LIM) return false; gdUsLog.push(t); return true;
}
function gdUsTr(raw) {   // kamus Indonesia -> Inggris: frasa dua kata dulu, lalu kata tunggal; kata lain diteruskan apa adanya
  const w = gdNorm(raw).split(' ').filter(Boolean), out = [];
  for (let i = 0; i < w.length; i++) {
    const two = i + 1 < w.length ? w[i] + ' ' + w[i + 1] : '';
    if (two && Object.prototype.hasOwnProperty.call(GD_US_DICT2, two)) { out.push(GD_US_DICT2[two]); i++; continue; }
    out.push(Object.prototype.hasOwnProperty.call(GD_US_DICT1, w[i]) ? GD_US_DICT1[w[i]] : w[i]);
  }
  return out.join(' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
const gdUsTitle = s => { const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return t && t === t.toUpperCase() && /[A-Z]/.test(t) ? t.toLowerCase().replace(/(^|[\s(\-\/])([a-z])/g, (m, a, b) => a + b.toUpperCase()) : t; };
function gdUsMap(f, now) {   // makanan USDA -> skema seragam; null bila tidak layak. Nilai bukan angka/negatif/satuan salah = null (BUKAN 0)
  if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
  const fid = typeof f.fdcId === 'number' ? f.fdcId : Number(f.fdcId); if (!Number.isInteger(fid) || fid < 1 || fid > 1e10) return null;
  const by = {}; (Array.isArray(f.foodNutrients) ? f.foodNutrients : []).forEach(x => { if (x && typeof x === 'object' && !Array.isArray(x)) { const id = Number(x.nutrientId != null ? x.nutrientId : (x.nutrient && x.nutrient.id)); if (Number.isInteger(id) && !(id in by)) by[id] = x; } });
  const get = (id, unit) => { const x = by[id]; if (!x) return null; const u = String(x.unitName == null ? '' : x.unitName).toUpperCase(); if (u && u !== unit) return null; const n = gdOffNum(x.value); return n; };
  let kcal = get(1008, 'KCAL'); if (kcal == null) kcal = get(2047, 'KCAL'); if (kcal == null) kcal = get(2048, 'KCAL'); if (kcal == null) { const kj = get(1062, 'KJ'); kcal = kj == null ? null : kj / 4.184; }
  const v = { kcal, p: get(1003, 'G'), f: get(1004, 'G'), c: get(1005, 'G'), fiber: get(1079, 'G'), sugar: get(2000, 'G'), na: get(1093, 'MG'), k: get(1092, 'MG'), mg: get(1090, 'MG') };
  if ((v.p || 0) + (v.f || 0) + (v.c || 0) > 105) return null;
  const dt = String(f.dataType == null ? '' : f.dataType), branded = /branded/i.test(dt);
  let name = gdUsTitle(f.description); if (!name) return null;
  if (branded) { const br = gdUsTitle(String(f.brandOwner == null ? '' : f.brandOwner).split(',')[0]); if (br && br.length <= 30 && !gdNorm(name).includes(gdNorm(br))) name = name.slice(0, 80 - br.length - 3).trim() + ' (' + br + ')'; }
  const por = [], ss = gdOffNum(f.servingSize), su = String(f.servingSizeUnit == null ? '' : f.servingSizeUnit).trim().toLowerCase();
  if (ss != null && ss >= 1 && ss <= 5000 && /^(g|grm|gram|grams)$/.test(su)) { const hh = String(f.householdServingFullText == null ? '' : f.householdServingFullText).replace(/\s+/g, ' ').trim(); por.push({ n: ('Sajian ' + (hh || fmt(ss, 0) + ' g')).slice(0, 30), g: ss }); }
  const gt = String(f.gtinUpc == null ? '' : f.gtinUpc).trim();
  return gdItem({ id: 'usda:' + fid, n: name, ne: '', src: 'usda', v, por, bc: /^\d{8,14}$/.test(gt) ? gt : '', at: now == null ? Date.now() : now });
}
const gdUsUrl = (q, bc, key) => GD_US_HOST + '?api_key=' + encodeURIComponent(key) + '&query=' + encodeURIComponent(q) + '&dataType=' + encodeURIComponent(bc ? 'Branded' : 'Foundation,SR Legacy') + '&pageSize=' + (bc ? 10 : 8);
async function gdUsFetch(url, signal) {
  let res;
  try { res = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' }); } catch (e) { throw gdErr(gdOffline() ? 'off' : 'net'); }
  if (res.status === 400 || res.status === 401 || res.status === 403) throw gdErr('key');
  if (res.status === 429) throw gdErr('limit');
  if (!res.ok) throw gdErr('http');
  try { return await res.json(); } catch (e) { throw gdErr(signal && signal.aborted ? 'net' : 'bad'); }
}
const gdUsZ = s => String(s).replace(/^0+/, '');
const gdUsCur = q => { const k = gdNetKey(q); return gdIsBc(k) ? 'b:' + k : 'n:' + gdNorm(q); };
async function gdUsGo(raw) {
  if (!gdUsKey) return;
  const k = gdNetKey(raw), bc = gdIsBc(k), cur = bc ? 'b:' + k : 'n:' + gdNorm(raw);
  if (gdUsS.ctl) { try { gdUsS.ctl.abort(); } catch (e) { /* abaikan */ } }
  const seq = ++gdUsS.seq, ctl = typeof AbortController === 'function' ? new AbortController() : null; gdUsS.ctl = ctl;
  if (bc && !gdBcValid(k)) { Object.assign(gdUsS, { q: cur, st: 'err', err: 'bc', res: [], hid: 0, en: '', bc: true }); gdSugPaint(); return; }
  const en = bc ? k : gdUsTr(raw); if (gdNorm(en).length < 2) return;
  if (gdOffline()) { gdSugPaint(); return; }
  Object.assign(gdUsS, { q: cur, st: 'busy', err: '', res: [], hid: 0, en, bc }); gdSugPaint();
  if (!gdUsOk()) { Object.assign(gdUsS, { st: 'err', err: 'rate' }); gdSugPaint(); return; }
  const tm = setTimeout(() => { if (ctl) ctl.abort(); }, GD_NET_MS);
  try {
    const js = await gdUsFetch(gdUsUrl(en, bc, gdUsKey), ctl ? ctl.signal : undefined);
    if (seq !== gdUsS.seq) return;
    const list = js && typeof js === 'object' && Array.isArray(js.foods) ? js.foods : null; if (!list) throw gdErr('bad');
    const seen = new Set(), items = []; let hid = 0;
    list.forEach(f => { const it = gdUsMap(f); if (!it || seen.has(it.id) || (bc && gdUsZ(it.bc) !== gdUsZ(k))) { hid++; return; } seen.add(it.id); items.push(it); });
    Object.assign(gdUsS, { st: 'ok', res: items.slice(0, 8), hid: bc ? 0 : hid });
  } catch (e) {
    if (seq !== gdUsS.seq) return;
    Object.assign(gdUsS, { st: 'err', err: e && e.gd ? e.gd : 'net', res: [] });
  } finally { clearTimeout(tm); }
  gdSugPaint();
}
function gdUsHTML(q, nr) {   // bagian saran: hasil USDA, status, dan tombol cari (atau petunjuk kunci)
  const key = gdNetKey(q); if (key.length < 3) return '';
  if (!gdUsKey) return '<p class="gdnone">Bahan umum (bahasa Inggris): tambahkan kunci USDA gratis di Pengaturan &gt; Preferensi &gt; Kunci USDA.</p>';
  const s = gdUsS, cur = gdUsCur(q), mine = s.q === cur, bc = gdIsBc(key); let h = '';
  if (gdOffline() && !(mine && s.st !== 'idle')) return '';   // keterangan offline sudah ditampilkan oleh bagian Open Food Facts
  if (mine && s.st !== 'idle') h += (nr ? '' : '<div class="gdlbl">USDA FoodData Central · ' + (s.bc ? 'produk (barcode)' : 'bahan umum') + '</div>') + (s.bc ? '' : '<p class="gdnone">Dicari sebagai: ' + esc(s.en) + '</p>');
  if (mine && s.res.length && !nr) h += s.res.map(it => '<button type="button" class="gdr" role="option" data-q="gdPick" data-id="' + esc(it.id) + '"><b>' + esc(it.n) + '</b><small>' + esc(GD_SRC_LBL[it.src]) + ' · ' + esc(gdPer(it)) + '</small></button>').join('');
  if (mine && s.st === 'busy') h += '<p class="gdnone" role="status">Mencari di USDA…</p>';
  if (mine && s.st === 'ok') {
    const bits = []; if (!s.res.length) bits.push(s.bc ? 'Barcode ini tidak ada di USDA (hanya produk Amerika).' : 'Tidak ada hasil dengan data gizi di USDA (Foundation, SR Legacy).');
    if (s.hid) bits.push(s.hid + ' hasil tanpa data gizi yang layak disembunyikan.');
    if (bits.length) h += '<p class="gdnone" role="status">' + esc(bits.join(' ')) + '</p>';
  }
  if (mine && s.st === 'err') h += '<p class="gdnone" role="alert">' + esc(GD_US_ERR[s.err] || GD_US_ERR.net) + '</p>';
  if (!(mine && (s.st === 'busy' || s.st === 'ok'))) h += '<button type="button" class="gdr gdnb" data-q="gdUs"><b>' + (bc ? 'Cari barcode ' + esc(key) + ' di USDA' : 'Cari “' + esc(q.trim().slice(0, 30)) + '” di USDA') + '</b><small>Perlu internet. ' + (bc ? 'Nomor ini' : 'Teks ini (diterjemahkan ke Inggris)') + ' dikirim ke api.nal.usda.gov bersama kunci USDA kamu.</small></button>';
  return h;
}
QACT.gdUs = () => { const i = $('#mName'); if (i) gdUsGo(i.value); };
function gdUsBox() {   // panel kunci di halaman Data
  const box = $('#usdaBox'); if (!box) return;
  const ae = document.activeElement; if (ae && ae.tagName === 'INPUT' && box.contains(ae)) return;
  const has = !!gdUsKey;
  box.innerHTML = '<details class="ph" id="usDet"' + (gdUsOpenP ? ' open' : '') + '><summary><span>Kunci USDA (opsional)</span><small>' + (has ? (gdUsMem ? 'Terpasang (hanya sementara)' : 'Terpasang') : 'Belum ada') + '</small><i class="chev"></i></summary><div class="body">' +
    '<p class="note" style="margin-top:0">Untuk mencari bahan umum di USDA FoodData Central (bahasa Inggris). Dipakai hanya saat kamu menekan tombol Cari di USDA di kotak saran makanan.</p>' +
    '<label class="inp sm"><input id="usKey" type="password" autocomplete="new-password" autocapitalize="off" spellcheck="false" maxlength="64" placeholder="' + (has ? 'Kunci sudah tersimpan (ketik untuk mengganti)' : 'Kunci API USDA') + '" aria-label="Kunci API USDA"></label>' +
    '<div class="quick"><button type="button" class="btn sm" data-q="usSave">Simpan</button>' + (has ? '<button type="button" class="btn sm ghost" data-q="usDel">Hapus</button>' : '') + '</div>' +
    '<p class="note">Ambil kunci gratis di <a href="https://api.data.gov/signup/" target="_blank" rel="noopener">api.data.gov/signup</a>. Kunci hanya dikirim ke api.nal.usda.gov, tersimpan di perangkat ini, dan tidak ikut ekspor JSON. Kunci DEMO_KEY boleh dipakai tetapi batasnya sangat ketat.</p></div></details>';
}
document.addEventListener('toggle', ev => { if (ev.target && ev.target.id === 'usDet') gdUsOpenP = ev.target.open; }, true);
QACT.usSave = () => {
  const i = $('#usKey'), k = i ? String(i.value).trim() : '';
  if (!gdUsKeyOk(k)) { toast('Kunci harus 8–64 huruf/angka (boleh _ dan -)'); return; }
  const ok = gdUsSave(k); if (i) i.value = ''; gdUsBox(); gdSugPaint();
  toast(ok ? 'Kunci USDA tersimpan di perangkat ini' : 'Penyimpanan perangkat tidak tersedia: kunci hanya berlaku sampai halaman ditutup');
};
QACT.usDel = () => { gdUsSave(''); Object.assign(gdUsS, { q: '', st: 'idle', err: '', res: [], hid: 0, en: '', bc: false }); gdUsS.seq++; gdUsBox(); gdSugPaint(); toast('Kunci USDA dihapus dari perangkat ini'); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b73w: Object.freeze({
  map: (f, now) => { const x = gdUsMap(f, now); return x ? JSON.parse(JSON.stringify(x)) : null; }, url: gdUsUrl, tr: gdUsTr, keyOk: gdUsKeyOk,
  state: () => ({ q: gdUsS.q, st: gdUsS.st, err: gdUsS.err, n: gdUsS.res.length, hid: gdUsS.hid, en: gdUsS.en, bc: gdUsS.bc, ids: gdUsS.res.map(x => x.id), has: !!gdUsKey, mem: gdUsMem }),
  test: Object.freeze({ reset: () => { gdUsLog.length = 0; gdUsS.seq++; Object.assign(gdUsS, { q: '', st: 'idle', err: '', res: [], hid: 0, en: '', bc: false }); }, ok: gdUsOk, go: gdUsGo, log: () => gdUsLog.length, lim: () => ({ n: GD_US_LIM, win: GD_US_WIN }), setKey: k => { gdUsKey = k; }, dictSize: () => Object.keys(GD_US_DICT1).length + Object.keys(GD_US_DICT2).length })
}) }));
/* ===== /v73w ===== */

/* ===== v73x: penanganan offline untuk pencarian online (OFF + USDA) ===== */
// navigator.onLine === false bisa dipercaya (benar-benar tanpa jaringan); true tidak menjamin ada internet, jadi jalur galat jaringan yang lama tetap dipakai.
// Saat offline: tombol "Cari di Open Food Facts/USDA" diganti satu baris keterangan, tidak ada permintaan jaringan, hasil lokal tetap tampil.
window.addEventListener('online', () => { const b = $('#gdSug'); if (b && !b.hidden) gdSugPaint(); });
window.addEventListener('offline', () => { const b = $('#gdSug'); if (b && !b.hidden) gdSugPaint(); });
window.DL = Object.freeze(Object.assign({}, window.DL, { b73x: Object.freeze({ offline: gdOffline }) }));
/* ===== /v73x ===== */

/* ===== v73x2: Makanan saya + riwayat ikut Cadangkan JSON ===== */
// Kunci cadangan baru `foods: {mine, cache}`. Versi file tetap 4 (aplikasi lama mengabaikan kunci yang tidak dikenal). Kunci USDA TIDAK ikut (tetap khusus perangkat).
// Penggabungan hanya menambah/memperbarui, tidak menghapus: Makanan saya per id (yang `at` lebih baru menang; nama kembar dengan id lain dilewati; maks 500),
// riwayat: item baru ditambahkan di ujung (lebih lama dari riwayat lokal), maks 300; src tkpi/manual tidak boleh masuk riwayat. apply=false hanya menghitung.
function gdMergeIn(src, apply) {
  const r = { add: 0, upd: 0, same: 0, cAdd: 0, cUpd: 0, drop: 0 };
  if (!src || typeof src !== 'object' || Array.isArray(src)) return r;
  const inc = gdClean({ mine: src.mine, cache: src.cache });
  const mine = gdb.mine.slice(), cache = gdb.cache.slice();
  const names = new Set(mine.map(x => gdNorm(x.n)));
  inc.mine.forEach(it => {
    const i = mine.findIndex(x => x.id === it.id);
    if (i >= 0) { if (it.at > mine[i].at) { mine[i] = it; r.upd++; } else r.same++; return; }
    if (names.has(gdNorm(it.n)) || mine.length >= GD_MAX_MINE) { r.drop++; return; }
    names.add(gdNorm(it.n)); mine.push(it); r.add++;
  });
  inc.cache.forEach(it => {
    if (mine.some(x => x.id === it.id)) { r.same++; return; }
    const i = cache.findIndex(x => x.id === it.id);
    if (i >= 0) { if (it.at > cache[i].at) { cache[i] = it; r.cUpd++; } else r.same++; return; }
    if (cache.length >= GD_MAX_CACHE) { r.drop++; return; }
    cache.push(it); r.cAdd++;
  });
  if (apply && (r.add || r.upd || r.cAdd || r.cUpd)) { gdb.mine = mine; gdb.cache = cache; }
  return r;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b73x2: Object.freeze({ merge: (s, a) => gdMergeIn(JSON.parse(JSON.stringify(s)), !!a), backup: () => backupText() }) }));
/* ===== /v73x2 ===== */


(async function init() {
  store.detect();
  // v22e: sisa kunci PIN lama (Batch 20c dicabut; tidak dibaca build ini). Tidak memblokir muat; galat diabaikan; kunci lain tidak disentuh.
  try {
    if (store.mode === 'local') localStorage.removeItem('dailylog:lock:v1');
    else if (store.mode === 'artifact' && typeof window.storage.delete === 'function') Promise.resolve(window.storage.delete('dailylog:lock:v1')).catch(() => {});
  } catch (e) { /* abaikan */ }
  build(); populate(); wpopulate();
  const tmo = () => new Promise(r => setTimeout(() => r({}), 3000));
  const ld5 = k => Promise.race([store.load(k), tmo()]);
  const [ld, lw, lp, lt, lc, lm, la, le, lf, lk, lmp, lcn, lup, lrm, lloc, lwx, lyt, lsp] = await Promise.all([ld5(KEY), ld5(KEY_W), ld5(KEY_P), ld5(KEY_T), ld5(KEY_C), ld5(KEY_M), ld5(KEY_AI), ld5(KEY_E), ld5(KEY_F), ld5(KEY_K), ld5(KEY_MP), ld5(KEY_CN), ld5(KEY_UP), ld5(KEY_RM), ld5(KEY_LC), ld5(KEY_WX), ld5(KEY_YT), ld5(KEY_SP)]);
  const md = {};
  for (const d of Object.keys(ld || {})) if (DATE_RE.test(d)) md[d] = clean(ld[d]);
  db = Object.assign(md, db);
  const mw = {};
  for (const w of Object.keys(lw || {})) if (DATE_RE.test(w)) mw[w] = wclean(lw[w]);
  wdb = Object.assign(mw, wdb);
  if (!(pdb.updated > 0)) pdb = pclean(lp);
  const mt = {};
  for (const d of Object.keys(lt || {})) if (DATE_RE.test(d)) mt[d] = tclean(lt[d]);
  tdb = Object.assign(mt, tdb);
  const mc = {};
  for (const d of Object.keys(lc || {})) if (DATE_RE.test(d)) mc[d] = cclean(lc[d]);
  cdb = Object.assign(mc, cdb);
  const lmc = mclean(lm);
  mdb = { lastBackup: Math.max(mdb.lastBackup, lmc.lastBackup), lastImport: Math.max(mdb.lastImport, lmc.lastImport), snooze: mdb.snooze > lmc.snooze ? mdb.snooze : lmc.snooze, fold: mdb.fold.length ? mdb.fold : lmc.fold };
  if (!(adb.updated > 0)) adb = aiClean(la);
  if (!(udb.updated > 0)) udb = upClean(lup);
  upApply();
  if (!(rdb.updated > 0)) rdb = rmClean(lrm);
  if (!(ldb.updated > 0)) ldb = hxClean(lloc);
  if (!(ibdb.u > 0)) ibdb = ibxClean(await ld5(IBX_KEY));   // v81a
  if (!(scdb.u > 0)) scdb = scClean(await ld5(SC_KEY));   // v82a
  if (!(xdb.updated > 0)) xdb = wxClean(lwx);
  if (!(ydb.updated > 0)) ydb = ytClean(lyt);
  if (!(gdb.updated > 0)) gdb = gdClean(await ld5(GDB_KEY));
  mLoad(le, lf); kLoad(lk); mpLoad(lmp); cnLoad(lcn); spLoad(lsp); spRdy = true; spRestore(); spApplyCal();
  populate(); wpopulate(); refreshView(); aiFabSync();
  adjAutoRun();
  setStatus(store.mode === 'memory' ? 'unsaved' : 'idle');
  probeStorage().then(() => { if (curView === 'data') renderData(); else if (curView === 'home') renderHome(); });
})().finally(() => { booted = true; bootRes(); });   // T3: sesudah penggabungan (atau bila init gagal) penulisan boleh jalan
/* ===== v70a: tombol Kembali ke halaman sebelumnya + geser kiri/kanan antar tab ===== */
(function () {
  const TOP = ['home', 'jurnal', 'train', 'roadmap', 'more'];
  const SWIPE_OK = { home: 1, today: 1, weekly: 1, history: 1, train: 1, roadmap: 1, more: 1 };
  const baseShow = showView;
  let popping = false;
  history.replaceState({ dl: 1, v: curView }, '');
  showView = function (v) {
    const before = curView;
    baseShow(v);
    if (popping || curView === before) { if (!booted) history.replaceState({ dl: 1, v: curView }, ''); return; }
    if (!booted) { history.replaceState({ dl: 1, v: curView }, ''); return; }
    history.pushState({ dl: 1, v: curView }, '');
  };
  addEventListener('popstate', e => {
    const keep = () => history.pushState({ dl: 1, v: curView }, '');   // Kembali hanya menutup lapisan di atas: tetap di halaman ini
    if (!$('#sheet').hidden) { keep(); closeSheet(); return; }
    if (!$('#fchat').hidden) { keep(); fcClose(); return; }
    if (!$('#chat').hidden) { keep(); chatClose(); return; }
    const v = e.state && e.state.dl && e.state.v;
    if (v && v !== curView) { popping = true; try { baseShow(v); } finally { popping = false; } }
  });
  function blocked(el) {
    if (el.closest && el.closest('input,textarea,select,canvas,[contenteditable],[data-noswipe]')) return true;
    for (let n = el; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
      if (n.scrollWidth > n.clientWidth + 2) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return true; }
    }
    return false;
  }
  let t0 = null;
  document.addEventListener('touchstart', e => {
    t0 = null;
    if (e.touches.length !== 1 || !SWIPE_OK[curView]) return;
    if (!$('#sheet').hidden || document.body.classList.contains('lock') || document.body.classList.contains('chatlock')) return;
    const t = e.touches[0];
    if (t.clientX < 24 || t.clientX > innerWidth - 24) return;   // tepi layar dibiarkan untuk gestur Kembali sistem
    if (blocked(e.target)) return;
    t0 = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, { passive: true });
  document.addEventListener('touchcancel', () => { t0 = null; }, { passive: true });
  function swipeBy(dir) {   // dir: +1 = tab berikutnya (geser ke kiri), -1 = sebelumnya
    const i = TOP.indexOf(TABOF[curView]), j = i + dir;
    if (i < 0 || j < 0 || j >= TOP.length || !SWIPE_OK[curView]) return false;
    const tab = TOP[j];
    showView(tab === 'jurnal' ? (TABOF[lastJ] === 'jurnal' ? lastJ : 'today') : tab);
    const el = $('#v-' + curView);
    if (el && el.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) el.animate([{ transform: 'translateX(' + (dir > 0 ? 28 : -28) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 180, easing: 'ease-out' });
    return true;
  }
  document.addEventListener('touchend', e => {
    if (!t0) return;
    const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, dt = Date.now() - t0.t;
    t0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6 || dt > 700) return;
    const sel = getSelection(); if (sel && String(sel).length) return;
    swipeBy(dx < 0 ? 1 : -1);
  }, { passive: true });
  window.DL = Object.freeze(Object.assign({}, window.DL, { b70a: Object.freeze({ swipeBy, state: () => ({ v: curView, h: history.state }) }) }));
})();
