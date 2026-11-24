/* ===== MODUL: BERANDA (batch 2) ===== */
const MORNING = [
  { id: 'm1', t: 'Bangun 05.30, wudhu, Shalat Subuh', s: '' },
  { id: 'm2', t: 'Minum 2 gelas air putih dingin dengan sejumput garam', s: 'Sekaligus asupan natrium untuk mencegah kram' },
  { id: 'm3', t: 'Latihan pagi sesuai jadwal hari ini', s: 'Mulai sekitar 06.30' }
];
const DAYLONG = [
  { id: 'e2', t: 'Kalium: 1–2 pisang atau sayuran hijau', s: 'Bayam atau sawi di makan siang dan malam' },
  { id: 'e3', t: 'Kaki ke dinding 10 menit', s: 'Setelah pulang kerja (±21.30): berbaring, kedua kaki lurus menempel ke dinding' },
  { id: 'e4', t: 'Magnesium 200–400 mg', s: '30 menit sebelum tidur' }
];
const hasView = v => !!$('#v-' + v);
const kalDone = d => !!((tdb[d] && tdb[d].kal && tdb[d].kal.done) || (db[d] && db[d].sesi.includes('kalistenik')));
const bikeDone = d => !!((tdb[d] && tdb[d].rides.length) || (db[d] && db[d].sesi.includes('sepeda')));

/* ===== 62a (sesi 273): tombol "Skip workout" = hari ini OFF (tidak bisa latihan, kalistenik maupun sepeda) =====
   Data: tdb[tanggal].sk = { n: keterangan (maks 120, boleh kosong), t: waktu, a: true bila Rest di Jurnal DITAMBAHKAN oleh OFF ini }.
   OFF hanya berlaku selama hari itu belum ada latihan selesai (kalDone/bikeDone): latihan yang tercatat mengalahkan OFF tanpa menghapus catatan.
   Efek: ceklis pagi "Latihan pagi" = X (dikeluarkan dari centang), kartu "Pekan ini" merah bertuliskan OFF, Jurnal: Sesi latihan = Rest.
   Skor harian dan streak TIDAK diubah (X = tidak tercentang). Membalik: patch62.py --reverse */
const SK_REASONS = ['Sakit', 'Cedera / nyeri', 'Capek / kurang tidur', 'Sibuk / kerja', 'Cuaca buruk'];
const SK_X = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
let skForm = { open: false, n: '' };
function skipOf(d) { const t = tdb[d], s = t && t.sk; return s && !kalDone(d) && !bikeDone(d) ? s : null; }
function skSet(note) {   // tandai hari ini OFF; false bila sudah ada latihan tercatat
  const d = today();
  if (kalDone(d) || bikeDone(d)) { toast('Hari ini sudah ada latihan tercatat, jadi tidak bisa ditandai OFF.'); return false; }
  const e = db[d] || (db[d] = blank()), t = tdb[d] || (tdb[d] = tblank()), c = cdb[d];
  const had = e.sesi.length === 1 && e.sesi[0] === 'rest';   // Rest sudah dipilih sendiri: jangan dihapus saat OFF dibatalkan
  t.sk = { n: String(note == null ? '' : note).replace(/\s+/g, ' ').trim().slice(0, 120), t: Date.now(), a: !had };
  t.updated = Date.now(); queueSave('t');
  if (c && c.m.includes('m3')) { c.m = c.m.filter(x => x !== 'm3'); c.updated = Date.now(); queueSave('c'); }   // latihan pagi tidak dilakukan
  if (!had) { e.sesi = ['rest']; e.rpe = null; e.updated = Date.now(); queueSave('d'); if (d === cur) populate(); }
  return true;
}
function skCancel() {   // batalkan OFF hari ini; Rest di Jurnal dihapus hanya bila OFF yang menambahkannya
  const d = today(), t = tdb[d], s = t && t.sk;
  if (!s) return false;
  delete t.sk; t.updated = Date.now(); queueSave('t');
  const e = db[d];
  if (s.a === true && e && e.sesi.length === 1 && e.sesi[0] === 'rest') { e.sesi = []; e.updated = Date.now(); queueSave('d'); if (d === cur) populate(); }
  return true;
}
function skChk(g, i) {   // baris ceklis pagi "Latihan pagi" saat OFF: tanda X merah
  if (g !== 'm' || i.id !== 'm3') return '';
  const s = skipOf(today()); if (!s) return '';
  return '<button class="chk skip" data-q="skInfo" aria-label="' + esc(i.t + ': tidak dilakukan, hari ini ditandai OFF' + (s.n ? ', ' + s.n : '') + '. Ketuk untuk membatalkan OFF') + '"><i>' + SK_X + '</i><span><b>' + esc(i.t) + '</b><small>OFF hari ini' + (s.n ? ': ' + esc(s.n) : '') + '</small></span></button>';
}
function skPlanRow(title, s) {
  return '<div class="plan"><div><b>' + esc(title) + '</b><small>OFF hari ini' + (s.n ? ': ' + esc(s.n) : '') + '</small></div><span class="tag off">OFF</span></div>';
}
function skHTML() {   // kartu di halaman Latihan (kedua tab): tombol skip, formulir keterangan, atau penanda OFF
  const d = today(), s = skipOf(d);
  if (s) return '<section class="sec sk62" aria-label="Hari ini OFF"><div class="skbox off"><span class="skx" aria-hidden="true">' + SK_X + '</span><div class="skm"><b>Hari ini OFF</b><small>' + (s.n ? 'Alasan: ' + esc(s.n) : 'Tanpa keterangan') + '</small></div><button class="btn sm" data-q="skCancel">Batalkan OFF</button></div>' +
    '<p class="note">Ceklis latihan pagi di Beranda jadi X, kartu Pekan ini merah (OFF), dan Jurnal otomatis Rest. Kalau jadi latihan, batalkan OFF dulu.</p></section>';
  if (kalDone(d) || bikeDone(d) || (typeof BK !== 'undefined' && BK.run)) return '';
  if (!skForm.open) return '<section class="sec sk62"><button class="btn ghost wide" data-q="skOpen" aria-expanded="false">Skip workout hari ini</button></section>';
  return '<section class="sec sk62"><div class="skbox"><b class="skt">Skip workout hari ini</b>' +
    '<p class="note" style="margin-top:6px">Kenapa tidak bisa latihan? Pilih atau ketik sendiri. Boleh dikosongkan.</p>' +
    '<div class="chips skchs">' + SK_REASONS.map(r => '<button type="button" class="skch" data-q="skChip" data-v="' + esc(r) + '" aria-pressed="' + (skForm.n === r) + '">' + esc(r) + '</button>').join('') + '</div>' +
    '<input class="txt" data-sk="n" maxlength="120" autocomplete="off" placeholder="Keterangan (opsional)" aria-label="Keterangan skip workout" value="' + esc(skForm.n) + '">' +
    '<p class="note">Hari ini dianggap OFF untuk kalistenik dan sepeda: ceklis latihan pagi jadi X, kartu Pekan ini merah, Jurnal otomatis Rest.</p>' +
    '<div class="skbt"><button class="btn danger" data-q="skSave">Tandai OFF hari ini</button><button class="btn ghost" data-q="skClose">Batal</button></div></div></section>';
}
function skChips() { $$('.skch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === skForm.n))); }
document.addEventListener('input', ev => {
  const el = ev.target;
  if (!el.dataset || el.dataset.sk !== 'n') return;
  skForm.n = el.value.slice(0, 120); skChips();
});
QACT.skOpen = () => { skForm.open = true; renderTrain(); const i = $('[data-sk="n"]'); if (i) i.focus(); };
QACT.skClose = () => { skForm = { open: false, n: '' }; renderTrain(); };
QACT.skChip = el => { skForm.n = el.dataset.v; const i = $('[data-sk="n"]'); if (i) { i.value = skForm.n; i.focus(); } skChips(); };
QACT.skSave = () => {
  if (!skSet(skForm.n)) return;
  skForm = { open: false, n: '' };
  renderTrain();
  toast('Hari ini ditandai OFF. Jurnal otomatis Rest.', { label: 'Urungkan', fn: () => { skCancel(); if (curView === 'train') renderTrain(); } });
};
QACT.skCancel = () => { skCancel(); toast('OFF hari ini dibatalkan.'); renderTrain(); };
QACT.skInfo = () => {   // ketuk baris X di ceklis pagi: tampilkan keterangan, batalkan hanya lewat tombol di toast
  const s = skipOf(today());
  if (!s) { renderHome(); return; }
  toast('Latihan hari ini OFF' + (s.n ? ': ' + s.n : '') + '.', { label: 'Batalkan OFF', fn: () => { skCancel(); if (curView === 'home') renderHome(); } });
};
function setC(d, g, id) {
  const c = cdb[d] || (cdb[d] = cblank());
  c[g] = c[g].includes(id) ? c[g].filter(x => x !== id) : c[g].concat(id);
  c.updated = Date.now();
  queueSave('c');
}
function chkHTML(g, items) {
  const on = (cdb[today()] || cblank())[g];
  return items.map(i => skChk(g, i) || '<button class="chk' + (i.id === chkPop && on.includes(i.id) ? ' pop' : '') + '" aria-pressed="' + on.includes(i.id) + '" data-q="chk" data-g="' + g + '" data-id="' + i.id + '"><i><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i><span><b>' + esc(i.t) + '</b>' + (i.s ? '<small>' + esc(i.s) + '</small>' : '') + '</span></button>').join('');
}
function planRow(title, sub, done, goto, bt) {
  const act = done ? '<span class="tag on">Selesai</span>' : (goto && hasView('train') ? '<button class="btn sm primary" data-q="openTrain" data-t="' + goto + '"' + (bt ? ' data-b="' + bt + '"' : '') + '>Mulai</button>' : '<span class="tag">Belum</span>');
  return '<div class="plan' + (done ? ' done' : '') + '"><div><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div>' + act + '</div>';
}
function homePlanHTML() {
  const t = today(), sc = schedFor(t), s = sc.s, p = pos(t), rows = [];
  const where = pdb.opt === 'gym' ? 'di gym' : 'di rumah';
  const SKo = skipOf(t);
  if (s.kal) rows.push(SKo ? skPlanRow('Kalistenik', SKo) : planRow('Kalistenik', 'Fase ' + sc.ph.id + ', ' + where, kalDone(t), 'kal'));
  if (s.bike) rows.push(SKo ? skPlanRow('Sepeda: ' + BIKE_LABEL[s.bike], SKo) : planRow('Sepeda: ' + BIKE_LABEL[s.bike], 'Fase ' + sc.ph.id, bikeDone(t), 'bike', s.bike));
  if (!s.kal && !s.bike) rows.push('<div class="plan"><div><b>Hari istirahat</b><small>Pulihkan tubuh. Jalan santai atau peregangan boleh.</small></div></div>');
  if (pd(t).getDay() === 0) {
    const [n, tt] = wcompletion(wdb[thisWeek()] || wblank());
    rows.push('<div class="plan"><div><b>Audit mingguan</b><small>Isi Minggu pagi: ' + n + ' dari ' + tt + ' terisi</small></div><button class="btn sm' + (n < tt ? ' primary' : '') + '" data-q="openWeek">Buka</button></div>');
  }
  if ((cdb[t] && cdb[t].refeed)) { const RT = tgFor(t); rows.push('<div class="plan"><div><b>Hari refeed</b><small>' + (RT.mode === 'range' ? 'Rentang' : 'Batas') + ' kalori hari ini ' + kcalTgt(RT) + ' kcal, karbohidrat bersih</small></div><span class="tag on">Aktif</span></div>'); }
  const note = !pdb.start ? '<p class="note">Ini jadwal contoh Fase 1. <button class="link" data-goto="roadmap">Atur tanggal mulai</button> agar fase dan jadwal mengikuti perjalananmu.</p>'
    : p.before ? '<p class="note">Perjalanan dimulai ' + p.before + ' hari lagi. Jadwal di bawah memakai Fase 1 sebagai acuan.</p>' : '';
  return '<div class="tl">' + rows.join('') + '</div>' + note;
}
/* v24c3 (sesi 199): kartu hari "Pekan ini" = nama hari + ikon jenis latihan + kalori terbakar. Hanya MEMBACA tdb/wdb/pdb; tidak menulis apa pun.
   Kalori: ride dari foto Strava memakai angka Strava (kc). Selain itu PERKIRAAN = MET x berat (kg) x jam (Compendium of Physical Activities 2011), ditandai "~". */
const WK_MET_KAL = [3.8, 6.0];       // kalistenik: sedang (RPE sampai 7 atau kosong) / berat (RPE 8 ke atas)
const WK_KAL_MIN = [5, 150];         // lama sesi dari t0/t1 yang dianggap wajar (menit)
const WK_MIN_SET = 2.5;              // bila t0/t1 tidak wajar: menit per set selesai (termasuk istirahat)
const WK_BIKE = [[16.1, 4.0], [19.3, 6.8], [22.5, 8.0], [25.7, 10.0], [32.2, 12.0]];   // [batas atas km/jam (tidak termasuk), MET]
const WK_BIKE_TOP = 15.8, WK_BIKE_NOSPD = 6.8;   // 32,2 km/jam ke atas = 15,8; tanpa kecepatan = 6,8
function wkMetBike(spd) { if (spd == null || !(spd > 0)) return WK_BIKE_NOSPD; for (const [lim, met] of WK_BIKE) if (spd < lim) return met; return WK_BIKE_TOP; }
function wkKg() { const b = latestBw(); if (b && kgOk(b.v)) return b.v; const w = bwStart(); return kgOk(w) ? w : 87; }
function wkKalMin(k) {   // lama sesi kalistenik (menit): dari t0/t1 bila wajar, selain itu dari jumlah set selesai; null bila tak ada keduanya
  if (k.t0 > 0 && k.t1 > k.t0) { const m = (k.t1 - k.t0) / 60000; if (m >= WK_KAL_MIN[0] && m <= WK_KAL_MIN[1]) return m; }
  const n = kalSets(k).n;
  return n > 0 ? n * WK_MIN_SET : null;
}
function wkRide(r, kg) {   // {kcal, est} untuk satu ride; null bila tak bisa dihitung
  if (r.kc != null) return { kcal: r.kc, est: false };
  const spd = r.spd != null && r.spd > 0 ? r.spd : (r.km != null && r.min != null && r.min > 0 ? r.km / (r.min / 60) : null);
  let min = r.min;
  if (min == null && r.km != null && spd != null) min = r.km / spd * 60;
  if (min == null || !(min > 0) || min > 1440) return null;   // lebih dari 24 jam = salah ketik, tidak dihitung
  return { kcal: wkMetBike(spd) * kg * min / 60, est: true };
}
function wkBurn(d) {   // {kal, bike: selesai?, kcal: total bulat atau null, est: ada bagian perkiraan/sebagian}
  const kg = wkKg(), kalOn = kalDone(d), bikeOn = bikeDone(d), k = tdb[d] && tdb[d].kal;
  let kK = null, kB = null, est = false, part = false;
  if (kalOn && k) { const m = wkKalMin(k); if (m != null) { kK = WK_MET_KAL[k.rpe >= 8 ? 1 : 0] * kg * m / 60; est = true; } }
  if (bikeOn) {
    const rs = jrRides(d); let sum = 0, n = 0;
    rs.forEach(r => { const x = wkRide(r, kg); if (x) { sum += x.kcal; n++; if (x.est) est = true; } });
    if (n) kB = sum;
    if (n < rs.length) part = true;
  }
  if (kalOn && kK == null) part = true;
  if (bikeOn && kB == null) part = true;
  const any = kK != null || kB != null;
  return { kal: kalOn, bike: bikeOn, kcal: any ? Math.round((kK || 0) + (kB || 0)) : null, est: any && (est || part), part: any && part };
}
const WK_IC = {
  k: 'M3.5 3.5H20.5M8 3.5L10 9M16 3.5L14 9M10 9H14M12 9V15.5M12 15.5L10 21M12 15.5L14 21',
  b: 'M5.5 16L9 8H15L18.5 16M9 8L11.5 16H5.5M15 8L11.5 16M13.5 6H16.5M7.5 6.5H10.5'
};
function wkIcon(kind, done) {
  const extra = kind === 'k' ? '<circle cx="12" cy="6.3" r="1.6"/>' : '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/>';
  return '<svg class="wki ' + kind + (done ? ' dn' : ' pl') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + WK_IC[kind] + '"/>' + extra + '</svg>';
}
/* v24c4 (sesi 201): tujuan ketukan kartu hari. Latihan selalu terikat ke hari ini, jadi yang dicocokkan adalah JENIS latihan hari itu.
   Dua latihan dalam sehari: yang belum selesai dibuka dulu (kalistenik dulu bila keduanya sama). Hari istirahat tanpa catatan = tidak ada tujuan. */
function wkTarget(d, s, B) {
  s = s || schedFor(d).s; B = B || wkBurn(d);
  const hasK = !!s.kal || B.kal, hasB = !!s.bike || B.bike;
  if (!hasK && !hasB) return { kind: null, bt: null, hint: 'Ketuk untuk keterangan' };
  const kalPend = !!s.kal && !B.kal, bikePend = !!s.bike && !B.bike;
  const kind = !hasK ? 'bike' : !hasB ? 'kal' : (!kalPend && bikePend) ? 'bike' : 'kal';
  let bt = null;
  if (kind === 'bike') {
    bt = s.bike || null;
    if (!bt) { const r = jrRides(d).find(x => BT[x.type]); if (r) bt = r.type; }
  }
  return { kind, bt, hint: 'Ketuk untuk membuka Latihan ' + (kind === 'bike' ? 'Sepeda' : 'Kalistenik') };
}
function wkCellHTML(d, t) {
  const dow = pd(d).getDay(), s = SCHED[(phaseOf(d) || PHASES[0]).id][dow], B = wkBurn(d);
  const showK = !!s.kal || B.kal, showB = !!s.bike || B.bike, planned = !!(s.kal || s.bike);
  const all = (!s.kal || B.kal) && (!s.bike || B.bike);
  const off = skipOf(d), cls = off ? 'off' : !planned ? '' : all ? 'hit' : d < t ? 'miss' : '';
  const st = done => done ? 'selesai' : d < t ? 'terlewat' : d === t ? 'terjadwal hari ini' : 'terjadwal';
  const lab = [];
  if (showK) lab.push('Kalistenik ' + st(B.kal));
  if (showB) lab.push('Sepeda ' + st(B.bike));
  if (off) { lab.length = 0; lab.push('OFF, ditandai tidak bisa latihan' + (off.n ? ' (' + off.n + ')' : '')); } else if (!lab.length) lab.push('Istirahat');
  let kc = '';
  if (B.kcal != null) kc = ', ' + (B.est ? 'perkiraan ' : '') + fmt(B.kcal, 0) + ' kkal terbakar' + (B.part ? ' (sebagian latihan belum ada angkanya)' : '');
  else if (B.kal || B.bike) kc = ', kalori belum bisa dihitung';
  const icons = (showK ? wkIcon('k', B.kal) : '') + (showB ? wkIcon('b', B.bike) : '');
  const num = off ? '<span class="wkn wko">OFF</span>' : B.kcal != null ? '<span class="wkn' + (B.kcal > 9999 ? ' wkx' : '') + '">' + (B.kcal > 9999 ? '9.999+' : fmt(B.kcal, 0)) + '</span><span class="wku">' + (B.est ? '~' : '') + 'kkal</span>'
    : (planned || B.kal || B.bike) ? '<span class="wkn wkd">–</span>' : '';
  const tg = wkTarget(d, s, B);
  return '<button type="button" class="stamp ' + cls + (d === t ? ' now' : '') + '" data-q="wkOpen" data-d="' + d + '" aria-label="' + esc(dayLong(d) + ': ' + lab.join(', ') + kc + '. ' + tg.hint) + '">' +
    '<b>' + HARI[dow].slice(0, 3) + '</b><span class="wkic' + (icons ? '' : ' wkd') + '" aria-hidden="true">' + (icons || '–') + '</span>' + num + '</button>';
}
function homeWeekHTML() {
  const ws = thisWeek(), t = today();
  const cells = [0, 1, 2, 3, 4, 5, 6].map(i => wkCellHTML(addDays(ws, i), t)).join('');
  return '<div class="stamps w7 wk">' + cells + '</div>' +
    '<div class="wkleg" aria-hidden="true"><span class="wkl">' + wkIcon('k', true) + 'Kalistenik</span><span class="wkl">' + wkIcon('b', true) + 'Sepeda</span></div>' +
    hmNote('nfoW', 'Hijau selesai, merah terlewat, merah penuh bertuliskan OFF = hari yang kamu tandai tidak bisa latihan. Angka = kalori terbakar. ~ = perkiraan dari berat badan terbaru dan lama latihan (ride Strava memakai angka Strava). Ketuk kartu hari untuk membuka latihannya; bila ada dua latihan, yang belum selesai dibuka lebih dulu.');
}
/* v24c4: ketuk kartu hari -> halaman Latihan, tab dan jenis sepeda sesuai hari itu. Tidak menulis data. */
QACT.wkOpen = el => {
  const d = el.dataset.d;
  if (!DATE_RE.test(d || '')) return;
  if (!hasView('train')) { toast('Halaman Latihan tidak tersedia.'); return; }
  const tg = wkTarget(d);
  { const so = skipOf(d); if (so && !tg.kind) { toast('Hari itu ditandai OFF' + (so.n ? ': ' + so.n : '') + '.'); return; } }
  if (!tg.kind) { toast('Hari istirahat. Tidak ada latihan terjadwal.', { label: 'Buka Latihan', fn: () => showView('train') }); return; }
  trainTab = tg.kind;
  if (tg.kind === 'kal') b16Tab = 'ses';
  else if (tg.bt && BT[tg.bt] && !BK.run) bkType = tg.bt;   // sesi sepeda yang sedang berjalan tidak diganti jenisnya
  showView('train');
  if (d !== today()) toast('Latihan ' + HARI[pd(d).getDay()] + ' dibuka. Pencatatan tetap untuk hari ini.');
};
function homeJurnalHTML() {
  const e = db[today()], [n, tt] = completion(e || blank());
  return '<div class="fill"><div class="meter"><i style="width:' + (n / tt * 100).toFixed(0) + '%"></i></div><span>' + n + ' dari ' + tt + ' terisi</span></div>' +
    '<div class="hint"><button class="btn primary" data-q="openToday">' + (n ? 'Lanjut isi jurnal' : 'Isi jurnal hari ini') + '</button></div>';
}
/* v23a: Beranda tampilan baru. Data, logika, dan tombol (data-q / data-goto) sama seperti sebelumnya; hanya susunan dan gaya yang berubah. */
const GREET = h => h < 4 ? 'Selamat dini hari' : h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
let ringPrev = 0, ringNext = 0, chkPop = '';
function homeHeroHTML() {
  const t = today(), p = pos(t), st = chkStreak(), pct = CK_N ? Math.min(st.n / CK_N, 1) : 0;
  const C = 2 * Math.PI * 41, off = v => (C * (1 - v)).toFixed(2);
  ringNext = pct;
  const chips = (p && p.ph ? '<span class="tag on">Fase ' + p.ph.id + '</span>' : '') + (st.cur > 0 ? '<span class="tag">Streak ' + st.cur + ' hari</span>' : '');
  const meta = p && p.ph ? '<p class="hh-p">' + chips + '<span>' + esc(p.ph.nama) + '. Hari ke-' + p.day + ', bulan ' + p.month + '.</span></p>' : (chips ? '<p class="hh-p">' + chips + '</p>' : '');
  return '<section class="hh" id="hh" aria-label="Fase dan progres ceklis hari ini"><div class="hh-t">' + (meta || '<p class="hh-p"><span>Ceklis hari ini</span></p>') + '</div>' +
    '<button class="ring' + (pct >= 1 ? ' full' : '') + '" data-q="scoreInfo" data-d="' + t + '" aria-label="Ceklis hari ini ' + st.n + ' dari ' + CK_N + ' selesai. Ketuk untuk rincian skor hari ini">' +
    hxSegHTML(st.n) + '</button></section>';
}
/* v98a (Tahap 98, B1+B3): bantu Beranda. Catatan penjelasan panjang terlipat di balik tombol "i" (isi sama); garis kemajuan per kelompok ceklis; angka naik sekali. */
const HM_INFO = {}, HM_GP = {};
function hmInfoBtn(id, label) {
  return '<button type="button" class="ibtn" data-q="hmInfo" data-t="' + id + '" aria-expanded="' + (HM_INFO[id] ? 'true' : 'false') + '" aria-controls="' + id + '" aria-label="' + esc(label) + '"><span aria-hidden="true">i</span></button>';
}
function hmNote(id, html) { return '<p class="note nfo' + (HM_INFO[id] ? ' open' : '') + '" id="' + id + '">' + html + '</p>'; }
QACT.hmInfo = el => {
  const id = el.dataset.t; if (!/^nfo[A-Z]$/.test(id || '')) return;
  const n = document.getElementById(id); if (!n) return;
  HM_INFO[id] = !HM_INFO[id];
  n.classList.toggle('open', HM_INFO[id]);
  el.setAttribute('aria-expanded', HM_INFO[id] ? 'true' : 'false');
};
function hmAfter(box, first) {
  if (!first || document.hidden || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  box.querySelectorAll('#homeScore .recap .tile b').forEach(b => {
    const txt = b.textContent.trim(), v = parseInt(txt, 10);
    if (!(v > 0) || String(v) !== txt) return;
    const t0 = performance.now(), D = 450;
    const step = now => { const k = Math.min(1, Math.max(0, (now - t0) / D)), e = 1 - Math.pow(1 - k, 3); b.textContent = String(k >= 1 ? v : Math.round(v * e)); if (k < 1) requestAnimationFrame(step); };
    b.textContent = '0'; requestAnimationFrame(step);
  });
}
function grpHTML(title, g, items, extra) {
  const on = (cdb[today()] || cblank())[g], n = items.filter(i => on.includes(i.id)).length;
  const pct = Math.round(n / items.length * 100), p0 = HM_GP[g] == null ? pct : HM_GP[g];
  HM_GP[g] = pct;
  return '<section class="sec"><div class="gh"><h2>' + title + '</h2><span class="gc' + (n === items.length ? ' ok' : '') + '">' + n + ' dari ' + items.length + '</span></div>' +
    '<div class="grp"><i class="gbar" aria-hidden="true" style="--p:' + pct + '%;--p0:' + p0 + '%"></i>' + chkHTML(g, items) + '</div>' + (extra || '') + '</section>';
}
/* BR-3: "Pagi" dan "Sepanjang hari" digabung jadi satu kartu "Ceklis hari ini" (dua kelompok). Data dan tombol sama: memakai grpHTML apa adanya, hanya pembungkus section dan tingkat judul diganti. */
function ckTot() {   // BR-4: total butir Pagi + Sepanjang hari yang tercentang
  const on = cdb[today()] || cblank(), n = MORNING.filter(i => on.m.includes(i.id)).length + DAYLONG.filter(i => on.e.includes(i.id)).length, tot = MORNING.length + DAYLONG.length;
  return '<span class="gc' + (n === tot ? ' ok' : '') + '">' + n + ' dari ' + tot + '</span>';
}
function ckHTML(extraDay) {
  const sub = h => h.replace(/^<section class="sec">/, '').replace(/<\/section>$/, '').replace('<h2>', '<h3>').replace('</h2>', '</h3>');
  return '<section class="sec" id="homeCheck"><div class="ckh"><h2>Ceklis hari ini</h2>' + ckTot() + '</div><div class="ckc">' + sub(grpHTML('Pagi', 'm', MORNING)) + sub(grpHTML('Sepanjang hari', 'e', DAYLONG, extraDay)) + '</div></section>';
}
/* v98b (Tahap 98, B2): kartu "Hari ini" di Beranda. Hanya membaca data; aksi memakai QACT yang sudah ada (scoreInfo, openTrain, openToday, clGo). */
let HMT_PREV = null, HMT_PP = {};
function hmtData() {
  const t = today(), ck = chkCount(t), e = db[t] || blank(), jc = completion(e), sc = schedFor(t).s, so = skipOf(t);
  const plan = so ? [] : [sc.kal ? 'kal' : null, sc.bike ? 'bike' : null].filter(Boolean);
  const done = plan.filter(k => k === 'kal' ? kalDone(t) : bikeDone(t));
  const parts = [{ k: 'ck', l: 'Ceklis', n: ck, m: CK_N, v: ck + ' dari ' + CK_N }, { k: 'jr', l: 'Jurnal', n: jc[0], m: jc[1], v: jc[0] + ' dari ' + jc[1] }];
  if (plan.length) parts.push({ k: 'lt', l: 'Latihan', n: done.length, m: plan.length, v: done.length + ' dari ' + plan.length + ' sesi' });
  else parts.push({ k: 'lt', l: 'Latihan', n: 0, m: 0, na: true, v: so ? 'OFF' : 'Istirahat' });
  const act = parts.filter(x => !x.na), pct = Math.round(act.reduce((a, x) => a + (x.m ? x.n / x.m : 0), 0) / act.length * 100);
  const full = act.filter(x => x.n >= x.m).length;
  return { t, parts, act, pct, full, plan, done, next: plan.find(k => !done.includes(k)) || null, bike: sc.bike, jr: jc };
}
function hmtHTML() {
  const D = hmtData(), C = 2 * Math.PI * 34, off = p => (C * (1 - p / 100)).toFixed(2);
  const p0 = HMT_PREV == null ? 0 : HMT_PREV; HMT_PREV = D.pct;
  const rows = D.parts.map(x => {
    const p = x.na ? 0 : Math.round(x.n / x.m * 100), q0 = HMT_PP[x.k] == null ? 0 : HMT_PP[x.k]; HMT_PP[x.k] = p;
    return '<div class="hmt-r' + (x.na ? ' na' : (x.n >= x.m ? ' ok' : '')) + '" data-k="' + x.k + '"><span class="hl">' + x.l + '</span><span class="hv">' + x.v + '</span><i class="hmt-b" aria-hidden="true" style="--p:' + p + '%;--p0:' + q0 + '%"></i></div>';
  }).join('');
  const ic = {
    go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4L16 5l3 3L8 19z"/></svg>',
    cam: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3"/></svg>'
  };
  const acts = [];
  const jrOpen = D.jr[0] < D.jr[1];
  if (D.next && hasView('train')) acts.push('<button type="button" class="btn hmt-a primary" data-q="openTrain" data-t="' + D.next + '"' + (D.next === 'bike' && D.bike ? ' data-b="' + D.bike + '"' : '') + '>' + ic.go + '<span>Mulai ' + (D.next === 'kal' ? 'kalistenik' : 'sepeda') + '</span></button>');
  acts.push('<button type="button" class="btn hmt-a' + (!(D.next && hasView('train')) && jrOpen ? ' primary' : '') + '" data-q="openToday">' + ic.pen + '<span>' + (D.jr[0] ? (jrOpen ? 'Lanjut jurnal' : 'Buka jurnal') : 'Isi jurnal') + '</span></button>');
  if (hasView('content')) acts.push('<button type="button" class="btn hmt-a" data-q="clGo">' + ic.cam + '<span>Klip cepat</span></button>');
  const all = D.full === D.act.length;
  return '<section class="sec hmt" id="homeToday"><h2>Hari ini</h2><div class="hmt-card"><div class="hmt-top">' +
    '<button type="button" class="hmt-ring' + (all ? ' full' : '') + '" data-q="scoreInfo" data-d="' + D.t + '" aria-label="Hari ini ' + D.full + ' dari ' + D.act.length + ' bagian lengkap, ' + D.pct + ' persen. Ketuk untuk rincian skor hari ini">' +
    '<svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rt" cx="40" cy="40" r="34"/><circle class="rp" cx="40" cy="40" r="34" style="--o:' + off(D.pct) + ';--o0:' + off(p0) + '"/></svg>' +
    '<span class="hmt-c" aria-hidden="true"><b class="hmt-n' + (D.pct >= 100 ? ' w3' : '') + '">' + D.pct + '</b><small>%</small></span></button>' +
    '<div class="hmt-tx"><p class="hmt-sum"><b>' + (all ? 'Semua bagian lengkap' : D.full + ' dari ' + D.act.length + ' bagian lengkap') + '</b></p>' + rows + '</div></div>' +
    '<div class="hmt-acts">' + acts.join('') + '</div></div></section>';
}
function hmtAfter(box, first) {
  if (!first || document.hidden || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const b = box.querySelector('#homeToday .hmt-n'); if (!b) return;
  const v = parseInt(b.textContent, 10); if (!(v > 0)) return;
  const t0 = performance.now(), D = 450;
  const step = now => { const k = Math.min(1, Math.max(0, (now - t0) / D)), e = 1 - Math.pow(1 - k, 3); b.textContent = String(k >= 1 ? v : Math.round(v * e)); if (k < 1) requestAnimationFrame(step); };
  b.textContent = '0'; requestAnimationFrame(step);
}
/* v98c (Tahap 98, B5): bilah navigasi Beranda. Hanya memindahkan simpul yang sudah ada (tidak ada kartu dihapus) dan menambah chip lompat serta bilah mini (jam + cincin) yang menempel saat menggulir. Tidak menulis data. */
const HMN_LBL = { homeToday: 'Hari ini', prio: 'Prioritas', plan: 'Rencana', check: 'Ceklis', jurnal: 'Jurnal', score: 'Skor', week: 'Pekan', content: 'Konten' };
const HMN_ORD = {
  pagi: ['homeToday', 'check', 'prio', 'plan', 'jurnal', 'score', 'week', 'content'],
  siang: ['homeToday', 'prio', 'plan', 'check', 'jurnal', 'score', 'week', 'content'],
  sore: ['homeToday', 'prio', 'plan', 'check', 'jurnal', 'score', 'week', 'content'],
  malam: ['homeToday', 'jurnal', 'check', 'prio', 'plan', 'score', 'week', 'content']
};
function hmnPhase(d) { const m = d.getHours() * 60 + d.getMinutes(); return m >= 300 && m < 600 ? 'pagi' : m < 930 && m >= 600 ? 'siang' : m >= 930 && m < 1140 ? 'sore' : 'malam'; }
function hmnFind(box) {
  const out = {}, T = { 'Rencana hari ini': 'plan', 'Ceklis hari ini': 'check', 'Jurnal hari ini': 'jurnal', 'Pekan ini': 'week', 'Konten': 'content' };
  box.querySelectorAll(':scope > section.sec').forEach(s => {
    const h = s.querySelector('h2'), t = h ? h.textContent.trim() : '';
    const k = s.id === 'homeToday' ? 'homeToday' : s.id === 'homePrio' ? 'prio' : s.id === 'homeScore' ? 'score' : T[t];
    if (k && !out[k]) out[k] = s;
  });
  return out;
}
const hmnRM = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function hmnSync() {
  const nav = document.getElementById('hmn'), sen = document.getElementById('hmnS'), box = document.getElementById('homeBody');
  if (!nav || !sen || !box || typeof curView === 'undefined' || curView !== 'home') return;
  const stuck = sen.getBoundingClientRect().bottom <= 0, tp = nav.querySelector('.hmn-t');
  nav.classList.toggle('stuck', stuck); if (tp) tp.hidden = !stuck;
  const edge = nav.getBoundingClientRect().bottom + 24; let cur = null;
  nav.querySelectorAll('.hmn-c').forEach(b => { const el = box.querySelector(':scope > [data-hmn="' + b.dataset.s + '"]'); if (el && (cur === null || el.getBoundingClientRect().top <= edge)) cur = b; });
  const ch = nav.querySelector('.hmn-ch');
  nav.querySelectorAll('.hmn-c').forEach(b => { if (b === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  if (cur && ch && ch.dataset.cur !== cur.dataset.s) { ch.dataset.cur = cur.dataset.s; ch.scrollLeft = Math.max(0, cur.offsetLeft - (ch.clientWidth - cur.offsetWidth) / 2); }
  const tm = nav.querySelector('.hmn-tm'); if (tm) { const d = new Date(hxEff()), t = pad(d.getHours()) + '.' + pad(d.getMinutes()); if (tm.textContent !== t) tm.textContent = t; }
}
let HMN_ON = false, HMN_RAF = 0;
/* v98d (Tahap 98, U2): menandai barisan yang bisa digeser dengan data-ef = l / r / lr (sisi yang masih punya isi); hanya menambah atribut tampilan, tidak menyentuh isi atau data. */
const EF_SEL = '#v-content .cnseg,#v-ibadah .ibx-tabs,#v-ibadah .ibx-chips,#v-selfcare .sc-tabs,.nwv .nw-tabs,#v-today .jv-row';
function efSync(el) {
  const m = el.scrollWidth - el.clientWidth; let v = '';
  if (m > 2) { const x = Math.abs(el.scrollLeft); if (x > 2) v += 'l'; if (x < m - 2) v += 'r'; }
  if (v) { if (el.dataset.ef !== v) el.dataset.ef = v; } else if (el.dataset.ef) delete el.dataset.ef;
}
function efAll() { document.querySelectorAll(EF_SEL).forEach(efSync); }
(function () {
  let raf = 0; const go = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; efAll(); }); };
  document.addEventListener('scroll', e => { const t = e.target; if (t && t.matches && t.matches(EF_SEL)) efSync(t); }, true);
  addEventListener('resize', go); document.addEventListener('click', () => { setTimeout(go, 120); setTimeout(go, 600); }, true);
  setInterval(go, 1500); setTimeout(go, 300);
})();
function hmnAfter(box, first) {
  const S = hmnFind(box), ph = hmnPhase(new Date(hxEff())), ord = HMN_ORD[ph].filter(k => S[k]);
  if (!ord.length) return;
  const els = Object.keys(S).map(k => S[k]); let last = els[0];
  els.forEach(e => { if (last.compareDocumentPosition(e) & 4) last = e; });
  const ref = last.nextSibling;
  ord.forEach(k => { box.insertBefore(S[k], ref); S[k].setAttribute('data-hmn', k); S[k].tabIndex = -1; });
  const D = hmtData(), C = 2 * Math.PI * 11, d = new Date(hxEff());
  const sen = document.createElement('i'); sen.className = 'hmn-s'; sen.id = 'hmnS'; sen.setAttribute('aria-hidden', 'true');
  const nav = document.createElement('nav'); nav.className = 'hmn'; nav.id = 'hmn'; nav.setAttribute('aria-label', 'Lompat ke bagian Beranda');
  nav.innerHTML = '<button type="button" class="hmn-t' + (D.full === D.act.length ? ' full' : '') + '" hidden aria-label="Ke atas Beranda. Hari ini ' + D.pct + ' persen"><svg viewBox="0 0 26 26" aria-hidden="true"><circle class="rt" cx="13" cy="13" r="11"/><circle class="rp" cx="13" cy="13" r="11" style="--o:' + (C * (1 - D.pct / 100)).toFixed(2) + '"/></svg><span class="hmn-tm">' + pad(d.getHours()) + '.' + pad(d.getMinutes()) + '</span><span class="hmn-tp">' + D.pct + '%</span></button>' +
    '<div class="hmn-ch" role="group" aria-label="Bagian Beranda">' + ord.map(k => '<button type="button" class="hmn-c" data-s="' + k + '">' + HMN_LBL[k] + '</button>').join('') + '</div>';
  box.insertBefore(sen, S[ord[0]]); box.insertBefore(nav, S[ord[0]]);
  if (!box._hmn) {
    box._hmn = 1;
    box.addEventListener('click', e => {
      const c = e.target.closest && e.target.closest('.hmn-c'), t = e.target.closest && e.target.closest('.hmn-t');
      if (c) { const el = box.querySelector(':scope > [data-hmn="' + c.dataset.s + '"]'); if (el) { el.scrollIntoView({ block: 'start', behavior: hmnRM() ? 'auto' : 'smooth' }); try { el.focus({ preventScroll: true }); } catch (x) { } } }
      else if (t) { window.scrollTo({ top: 0, behavior: hmnRM() ? 'auto' : 'smooth' }); }
    });
  }
  if (!HMN_ON) {
    HMN_ON = true;
    const go = () => { if (HMN_RAF) return; HMN_RAF = requestAnimationFrame(() => { HMN_RAF = 0; hmnSync(); }); };
    window.addEventListener('scroll', go, { passive: true }); window.addEventListener('resize', go); setInterval(go, 10000);
  }
  hmnSync();
}
/* BR-6: Prioritas masuk ke kartu fokus Hari ini (hanya memindahkan simpul; aksi data-q tetap) */
function br6After(box) {
  const pr = box.querySelector(':scope > #homePrio'), card = box.querySelector('#homeToday .hmt-card'), acts = card && card.querySelector('.hmt-acts');
  if (!card || !acts) return;
  if (pr) {
  const nx = document.createElement('div'); nx.className = 'br6-nx';
  const pm = acts.querySelector('.hmt-a.primary[data-q]');
  [...pr.children].forEach(c => { if (c.tagName !== 'H2') nx.appendChild(c); });
  nx.querySelectorAll('.plan.prio .btn[data-q]').forEach(b => { if (pm && b.dataset.q === pm.dataset.q && b.dataset.t === pm.dataset.t) b.remove(); });
  card.insertBefore(nx, acts); pr.remove();
  }
  /* BR-7: baris ringkasan di kartu fokus bisa diketuk (memakai aksi yang sudah ada) */
  box.querySelectorAll('#homeToday .hmt-r[data-k]').forEach(r => {
    const k = r.dataset.k, ok = k === 'ck' ? !!box.querySelector('#homeCheck') : !!box.querySelector('.hmt-a[data-q="' + (k === 'jr' ? 'openToday' : 'openTrain') + '"]');
    if (ok) { r.setAttribute('role', 'button'); r.tabIndex = 0; r.setAttribute('aria-label', r.textContent.replace(/\s+/g, ' ').trim() + '. Buka bagiannya'); }
  });
  if (!box._b7) {
    box._b7 = 1;
    const go = r => { const k = r.dataset.k; if (k === 'ck') { const el = box.querySelector('#homeCheck'); if (el) el.scrollIntoView({ block: 'start', behavior: hmnRM() ? 'auto' : 'smooth' }); } else { const b = box.querySelector('.hmt-a[data-q="' + (k === 'jr' ? 'openToday' : 'openTrain') + '"]'); if (b) b.click(); } };
    box.addEventListener('click', e => { const r = e.target.closest && e.target.closest('.hmt-r[role=button]'); if (r) go(r); });
    box.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const r = e.target.closest && e.target.closest('.hmt-r[role=button]'); if (r) { e.preventDefault(); go(r); } });
  }
}
/* BR-8: kartu Ceklis bisa dilipat (keadaan hanya di memori sesi, tidak menulis data) */
let br8Fold = true;
function br8After(box) {
  const ck = box.querySelector('#homeCheck'), h = ck && ck.querySelector('.ckh'), body = ck && ck.querySelector('.ckc');
  if (!h || !body) return;
  if (!body.id) body.id = 'ckcBody';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'br8-fold'; b.setAttribute('aria-controls', body.id);
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const sync = () => { if (br8Fold) ck.setAttribute('data-fold', ''); else ck.removeAttribute('data-fold'); b.setAttribute('aria-expanded', br8Fold ? 'false' : 'true'); b.setAttribute('aria-label', (br8Fold ? 'Buka' : 'Lipat') + ' ceklis hari ini'); };
  b.addEventListener('click', () => { br8Fold = !br8Fold; sync(); if (!br8Fold) { body.classList.remove('br8-in'); void body.offsetWidth; body.classList.add('br8-in'); } });
  h.appendChild(b); sync();
}
/* BR-9: Rencana digabung ke kartu fokus, Ceklis terlipat bawaan, keadaan kosong */
function br9After(box) {
  const card = box.querySelector('#homeToday .hmt-card'), nx = card && card.querySelector('.br6-nx'), pl = box.querySelector(':scope > [data-hk=plan]');
  if (pl && nx) {   // gabung hanya bila tiap aksi Rencana sudah ada di kartu fokus (data tidak berubah)
    const keys = new Set([...card.querySelectorAll('.hmt-a[data-q]')].map(a => a.dataset.q + '|' + (a.dataset.t || ''))), rows = [...pl.querySelectorAll('.tl .plan')];
    if (rows.length && rows.every(r => { const b = r.querySelector('button[data-q]'); return b && keys.has(b.dataset.q + '|' + (b.dataset.t || '')); })) {
      const n = pl.querySelector('.note'); if (n) { n.classList.add('br9-note'); nx.insertBefore(n, nx.querySelector('.aibtn')); }
      pl.remove();
    }
  }
  const n0 = card && card.querySelector('.hmt-n'), sb = card && card.querySelector('.hmt-sum b');
  if (n0 && sb && n0.textContent.trim() === '0') sb.textContent = 'Mulai dari satu hal';
  const ck = box.querySelector('#homeCheck'), body = ck && ck.querySelector('.ckc');
  if (ck && body) {   // pratinjau butir berikutnya, tampil saat Ceklis terlipat
    const first = body.querySelector('.chk[aria-pressed=false]'), pv = document.createElement('div'); pv.className = 'br9-next';
    if (first) pv.appendChild(first.cloneNode(true)); else { pv.classList.add('done'); pv.textContent = 'Semua butir ceklis hari ini selesai.'; }
    ck.insertBefore(pv, body);
  }
  const sc = box.querySelector('#homeScore');
  if (sc) sc.classList.toggle('br9-empty', [...sc.querySelectorAll('.recap .tile b')].every(b => /^[0–-]$/.test(b.textContent.trim())));
  if (!box._b9) {
    box._b9 = 1;
    const un = e => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (e.target.closest && e.target.closest('.hmt-r[data-k=ck],.hmn-c[data-s=check]')) { const c = box.querySelector('#homeCheck'), f = c && c.hasAttribute('data-fold') && c.querySelector('.br8-fold'); if (f) f.click(); } };
    box.addEventListener('click', un); box.addEventListener('keydown', un);
  }
}
/* BR-10: Ceklis satu daftar (data-g dan data-id tiap butir tidak berubah) + gerak centang */
function br10After(box) {
  const ck = box.querySelector('#homeCheck'), body = ck && ck.querySelector('.ckc');
  if (!body) return;
  const gs = [...body.querySelectorAll(':scope > .grp')], first = gs[0];
  if (first) {
    gs.slice(1).forEach(g => { [...g.children].forEach(c => { if (!c.classList.contains('gbar')) first.appendChild(c); }); g.remove(); });
    body.querySelectorAll(':scope > .gh').forEach(h => h.remove());
    const bar = first.querySelector(':scope > .gbar'), all = first.querySelectorAll('.chk'), n = [...all].filter(b => b.getAttribute('aria-pressed') === 'true').length;
    if (bar && all.length) { bar.style.setProperty('--p0', (box._b10p == null ? 0 : box._b10p) + '%'); box._b10p = Math.round(n / all.length * 100); bar.style.setProperty('--p', box._b10p + '%'); }
  }
  const id = box._b10; box._b10 = null;
  if (id) { const b = body.querySelector('.chk[data-id="' + id + '"]'); if (b && b.getAttribute('aria-pressed') === 'true') b.classList.add('br10-pop'); }
  if (!box._b10c) { box._b10c = 1; box.addEventListener('click', e => { const c = e.target.closest && e.target.closest('.chk[data-id]'); if (c) { box._b10 = c.dataset.id; box._b12k = 1; setTimeout(() => { box._b12k = 0; }, 400); } }, true); }
}
/* BR-11: fase hari pada kartu fokus (sama dengan pemilah chip nav) */
function br11After(box) {
  const c = box.querySelector('#homeToday .hmt-card');
  if (c) c.setAttribute('data-ph', hmnPhase(new Date(hxEff())));
}
/* BR-12: header adegan dipertahankan saat render ulang akibat ketuk centang; bilah memakai angka --s */
function br12Keep(box) {
  if (!box._b12k) return null;
  box._b12k = 0;
  const k = box.querySelector(':scope > #hxSky');
  return k && k.querySelector('canvas') ? k : null;
}
function br12Restore(box, old) {
  if (!old) return;
  const n = box.querySelector(':scope > #hxSky'); if (n) n.replaceWith(old);
}
function br12After(box) {
  box.querySelectorAll('#homeToday .hmt-b, #homeCheck .gbar').forEach(e => {
    const st = e.getAttribute('style') || '', p = /--p:\s*([\d.]+)%/.exec(st), q = /--p0:\s*([\d.]+)%/.exec(st);
    e.style.setProperty('--s', p ? +p[1] / 100 : 0); e.style.setProperty('--s0', q ? +q[1] / 100 : 0);
  });
}
/* BR-13: bilah 6 ruas Ceklis, angka besar Jurnal, nomor tanggal kartu Pekan; kelas br13 menyalakan semua gaya BR-13 */
function br13After(box) {
  box.classList.add('br13');
  const ck = box.querySelector('#homeCheck');
  if (ck && !ck.querySelector(':scope > .br13-seg')) {
    const bs = [...ck.querySelectorAll('#ckcBody .chk')], h = ck.querySelector(':scope > .ckh');
    if (h && bs.length) {
      const now = bs.map(b => b.getAttribute('aria-pressed') === 'true'), prev = box._b13 && box._b13.length === now.length ? box._b13 : now;
      const seg = document.createElement('div');
      seg.className = 'br13-seg'; seg.setAttribute('aria-hidden', 'true');
      seg.innerHTML = prev.map(v => '<i' + (v ? ' class="on"' : '') + '></i>').join('');
      h.after(seg);
      box._b13 = now;
      if (prev.some((v, i) => v !== now[i])) requestAnimationFrame(() => requestAnimationFrame(() => seg.querySelectorAll('i').forEach((e, i) => e.classList.toggle('on', now[i]))));
    }
  }
  const sp = box.querySelector('.jc .fill span'), m = sp && /^(\d+) dari (\d+) terisi$/.exec(sp.textContent.trim());
  if (m) sp.innerHTML = '<b>' + m[1] + '</b> dari ' + m[2] + ' terisi';
  box.querySelectorAll('.stamps.wk .stamp[data-d]').forEach(e => { e.dataset.n = String(+e.dataset.d.slice(8, 10)); });
}
function renderHome() {
  const first = !renderHome.did, box = $('#homeBody');
  renderHome.did = true;
  const sk = scKeep();   // c1: posisi geser barisan skor dijaga
  const br12Sky = br12Keep(box);
  box.innerHTML = '<div class="sky" id="hxSky">' + hxHTML() + homeHeroHTML() + hxScrubHTML() + '</div>' + rmBannerHTML() + clhHTML() + nyBrHTML() + homeSafetyHTML() + hmtHTML() + homePrioHTML() +
    '<section class="sec" data-hk="plan"><h2>Rencana hari ini</h2>' + homePlanHTML() + '</section>' +
    ckHTML('<p class="note">Takaran dari rencanamu. Jika punya penyakit ginjal atau rutin minum obat, tanyakan dulu ke dokter atau apoteker sebelum memakai suplemen.</p>') +
    '<section class="sec" data-hk="jurnal"><h2>Jurnal hari ini</h2><div class="jc">' + homeJurnalHTML() + '</div></section>' +
    homeScoreHTML() +
    '<section class="sec" data-hk="week"><div class="gh ib"><h2>Pekan ini</h2>' + hmInfoBtn('nfoW', 'Cara membaca Pekan ini') + '</div>' + homeWeekHTML() + '</section>';
  br12Restore(box, br12Sky);
  hxSkyApply(); wxBgApply();
  try { hmAfter(box, first); } catch (e) { /* tampilan tambahan */ }
  try { hmtAfter(box, first); } catch (e) { /* tampilan tambahan */ }
  try { br6After(box); } catch (e) { /* tampilan tambahan */ }
  try { br8After(box); } catch (e) { /* tampilan tambahan */ }
  try { br9After(box); } catch (e) { /* tampilan tambahan */ }
  try { br10After(box); } catch (e) { /* tampilan tambahan */ }
  try { br11After(box); } catch (e) { /* tampilan tambahan */ }
  try { br12After(box); } catch (e) { /* tampilan tambahan */ }
  try { br13After(box); } catch (e) { /* tampilan tambahan */ }
  try { hmnAfter(box, first); } catch (e) { /* tampilan tambahan */ }
  if (first) { box.dataset.enter = '1'; setTimeout(() => { delete box.dataset.enter; }, 1200); }
  {   // garis ala story: terisi dari kondisi sebelumnya ke sekarang (hanya yang berubah)
    const sg = box.querySelectorAll('#hSeg i'), go = () => sg.forEach(e => e.classList.toggle('on', e.dataset.t === '1'));
    if (document.hidden) go(); else requestAnimationFrame(() => requestAnimationFrame(go));
  }
  scFit(sk);
  ringPrev = ringNext;
}
RENDER.home = renderHome;
QACT.chk = el => {
  const g = el.dataset.g, id = el.dataset.id;
  setC(today(), g, id);
  chkPop = id; renderHome(); chkPop = '';
  if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
  const b = $('.chk[data-g="' + g + '"][data-id="' + id + '"]');   // fokus kembali ke tombol yang sama (pengguna keyboard)
  if (b) b.focus({ preventScroll: true });
};
QACT.openToday = () => { cur = today(); showView('today'); populate(); };
QACT.openWeek = () => { curW = thisWeek(); bwOpen = false; showView('weekly'); };
document.addEventListener('visibilitychange', () => { if (!document.hidden && curView === 'home') renderHome(); });

/* ===== MODUL: UTIL TIMER, SUARA, LAYAR (batch 3) ===== */
const mmss = sec => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + pad(sec % 60); };
let AC = null;
function beep(n) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime;
    for (let i = 0; i < (n || 3); i++) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(AC.destination);
      g.gain.setValueAtTime(.25, t0 + i * .25); g.gain.exponentialRampToValueAtTime(.001, t0 + i * .25 + .18);
      o.start(t0 + i * .25); o.stop(t0 + i * .25 + .2);
    }
  } catch (e) { /* tanpa suara */ }
}
function buzz() { try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* abaikan */ } }
const WL = {   // jaga layar tetap menyala saat timer berjalan
  s: null, want: false,
  async on() { this.want = true; try { if (navigator.wakeLock && !this.s) this.s = await navigator.wakeLock.request('screen'); } catch (e) { this.s = null; } },
  off() { this.want = false; try { if (this.s) this.s.release(); } catch (e) { /* abaikan */ } this.s = null; }
};
document.addEventListener('visibilitychange', () => { if (!document.hidden && WL.want && !WL.s) WL.on(); });

/* timer istirahat / stopwatch tahan (bar melayang di semua tab) */
const TM = { mode: null, t0: 0, dur: 0, label: '', ref: null, id: null, ph: '', rdy: 0, g0: 0, hit: 0, cd: 0, tgt: null };   // batch 16 (16a-2b): ph = ready|go untuk timer set berdetik
const HOLD_READY = 5000;   // masa bersiap sebelum stopwatch set berdetik (ms)
function tmStart(mode, dur, label, ref) {
  if (TM.mode === 'run') return;
  unlockAudio();
  TM.mode = mode; TM.t0 = Date.now(); TM.dur = dur * 1000; TM.label = label; TM.ref = ref || null;
  if (mode === 'hold') { TM.ph = 'ready'; TM.rdy = HOLD_READY; TM.g0 = 0; TM.hit = 0; TM.cd = 0; TM.tgt = ref && ref.tgt ? ref.tgt : null; } else TM.ph = '';
  clearInterval(TM.id); TM.id = setInterval(tmTick, 250);
  $('#tmbar').hidden = false; $('#tmRest').hidden = mode !== 'rest'; $('#tmReady').hidden = !(mode === 'hold' && TM.ph === 'ready'); $('#tmHold').hidden = !(mode === 'hold' && TM.ph === 'go'); document.body.classList.add('tm');
  WL.on(); tmTick();
}
function tmStop(force) { if (TM.mode === 'run' && !force) return; clearInterval(TM.id); TM.id = null; TM.mode = null; $('#tmbar').hidden = true; document.body.classList.remove('tm'); WL.off(); }
function tmTick() {
  if (!TM.mode) return;
  const el = Date.now() - TM.t0;
  $('#tmLabel').textContent = TM.mode === 'hold' && TM.ph === 'ready' ? 'Bersiap · ' + TM.label : TM.label;
  if (TM.mode === 'rest') {
    const left = Math.max(0, TM.dur - el);
    $('#tmTime').textContent = mmss(left / 1000);
    if (left <= 0) { buzz(); beep(3); toast('Istirahat selesai, lanjut set berikutnya'); tmStop(); }
  } else if (TM.mode === 'hold') { if (TM.ph === 'ready') holdReadyTick(el); else holdGoTick(); }
}
QACT.tmAdd = () => { if (TM.mode === 'rest') { TM.dur += 15000; tmTick(); } };
QACT.tmEnd = () => tmStop();
QACT.tmCancel = () => tmStop();
/* --- timer set berdetik (batch 16, 16a-2b): bersiap -> stopwatch dengan target --- */
function holdReadyTick(el) {
  const left = Math.max(0, TM.rdy - el), sec = Math.ceil(left / 1000);
  $('#tmTime').textContent = mmss(sec);
  if (sec >= 1 && sec <= 3 && TM.cd !== sec) { TM.cd = sec; beep(1); }
  if (left <= 0) holdGo();
}
function holdGo() {
  TM.ph = 'go'; TM.g0 = Date.now(); TM.hit = 0;
  $('#tmReady').hidden = true; $('#tmHold').hidden = false; $('#tmLabel').textContent = TM.label;
  buzz(); beep(2); holdGoTick();
}
function holdGoTick() {
  const s = Math.floor((Date.now() - TM.g0) / 1000), t = TM.tgt;
  if (t) {
    if (!(TM.hit & 1) && s >= t[0]) { TM.hit |= 1; buzz(); beep(3); }
    if (t[1] > t[0] && !(TM.hit & 2) && s >= t[1]) { TM.hit |= 2; buzz(); beep(3); }
  }
  const b = $('#tmTime'); b.textContent = mmss(s);
  if (t) { const i = document.createElement('i'); i.textContent = ' / ' + mmss((TM.hit & 1) && t[1] > t[0] ? t[1] : t[0]); b.appendChild(i); }
}
QACT.tmGo = () => { if (TM.mode === 'hold' && TM.ph === 'ready') holdGo(); };

/* ===== MODUL: LATIHAN KALISTENIK (batch 3) ===== */
const LADDER = {
  push: { nama: 'Push', otot: 'dada, bahu, trisep', lv: ['Knee push-up', 'Standard push-up', 'Decline push-up / Dips', 'Pike push-up / Archer push-up'] },
  pull: { nama: 'Pull', otot: 'punggung, bisep', lv: ['Doorway pull', 'Inverted row (di bawah meja)', 'Assisted pull-up', 'Strict pull-up / L-sit pull-up'] },
  legs: { nama: 'Legs', otot: 'kuadrisep, glute', lv: ['Bodyweight squat', 'Bulgarian split squat', 'Single-leg RDL', 'Pistol squat / Shrimp squat'] },
  core: { nama: 'Core', otot: 'otot perut', lv: ['Plank', 'Dead bug / Leg raise', 'Copenhagen plank', 'Hollow body hold / Dragon flag'] }
};
const LK = ['push', 'pull', 'legs', 'core'];
/* Program per fase & tempat. r = rentang reps, sec = rentang detik. Fase 3-4: teks tak memberi set/reps (default 3 set). Gym: teks tak memberi istirahat (default 90 dtk). */
const ADV = [
  { id: 'a_pull', n: 'Strict pull-up', v: 'Tambah beban 5–10 kg jika mampu', sets: 3, rest: 90, pat: 'pull' },
  { id: 'a_push', n: 'Archer push-up / ring dips', sets: 3, rest: 90, pat: 'push' },
  { id: 'a_pistol', n: 'Pistol squat', sets: 3, rest: 90, pat: 'legs', per: 'kaki' },
  { id: 'a_hip', n: 'Single-leg hip thrust', sets: 3, rest: 90, per: 'kaki' },
  { id: 'a_dragon', n: 'Dragon flag', sets: 3, rest: 90, pat: 'core' }
];
const EX = {
  1: {
    home: [
      { id: 'h1_push', n: 'Push-up', v: 'Knee push-up atau standard push-up', sets: 3, r: [8, 12], rest: 90, pat: 'push' },
      { id: 'h1_row', n: 'Inverted row', v: 'Meja kokoh, TRX, atau broomstick. Memperbaiki postur bungkuk', sets: 3, r: [8, 12], rest: 90, pat: 'pull' },
      { id: 'h1_squat', n: 'Bodyweight squat', sets: 3, r: [15, 20], rest: 60, pat: 'legs' },
      { id: 'h1_bridge', n: 'Glute bridge', v: 'Melatih bokong dan hamstring', sets: 3, r: [12, 15], rest: 60 },
      { id: 'h1_plank', n: 'Plank', sets: 3, sec: [45, 60], rest: 60, pat: 'core' }
    ],
    gym: [
      { id: 'g1_press', n: 'Dumbbell chest press / Smith machine press', sets: 3, r: [10, 12], rir: 2, rest: 90, pat: 'push' },
      { id: 'g1_pull', n: 'Lat pulldown / seated cable row', sets: 3, r: [10, 12], rir: 2, rest: 90, pat: 'pull' },
      { id: 'g1_goblet', n: 'Goblet squat (dumbbell)', sets: 3, r: [10, 12], rir: 2, rest: 90, pat: 'legs' },
      { id: 'g1_rdl', n: 'Romanian deadlift (dumbbell / barbell)', sets: 3, r: [10, 12], rir: 2, rest: 90 },
      { id: 'g1_leg', n: 'Hanging leg raise / cable woodchopper', sets: 3, r: [12, 15], rest: 90, pat: 'core' }
    ]
  },
  2: {
    home: [
      { id: 'h2_dec', n: 'Decline push-up / parallel bar dips', sets: 4, r: [8, 12], rest: 90, pat: 'push' },
      { id: 'h2_row', n: 'Inverted row (kaki elevasi)', sets: 4, r: [10, 12], rest: 90, pat: 'pull' },
      { id: 'h2_bss', n: 'Bulgarian split squat', v: 'Fokus keseimbangan dan kekuatan paha', sets: 3, r: [10, 12], rest: 90, pat: 'legs', per: 'kaki' },
      { id: 'h2_pike', n: 'Pike push-up', v: 'Fokus otot bahu', sets: 3, r: [8, 10], rest: 90, pat: 'push' },
      { id: 'h2_cop', n: 'Copenhagen plank', v: 'Krusial untuk stabilitas lutut saat mengayuh', sets: 3, sec: [30, 30], rest: 60, pat: 'core', per: 'sisi' }
    ],
    gym: [
      { id: 'g2_inc', n: 'Incline dumbbell press', sets: 3, r: [8, 10], rest: 90, pat: 'push' },
      { id: 'g2_pull', n: 'Weighted pull-up / heavy lat pulldown', sets: 3, r: [6, 8], rest: 90, pat: 'pull' },
      { id: 'g2_sq', n: 'Barbell back squat / hack squat', sets: 3, r: [8, 10], rest: 90, pat: 'legs' },
      { id: 'g2_sl', n: 'Single-leg Romanian deadlift', sets: 3, r: [10, 12], rest: 90, per: 'kaki' },
      { id: 'g2_pal', n: 'Pallof press / cable core anti-rotation', sets: 3, r: [12, 12], rest: 90, pat: 'core' }
    ]
  },
  3: { home: ADV, gym: ADV }
};
const progKey = ph => Math.min(ph, 3);
const progOf = date => progKey((phaseOf(date) || PHASES[0]).id);
let trProg = null;   // program terpilih manual (1-3); null = ikuti fase aktif
const curProg = () => trProg || progOf(today());
const exList = () => b19Plan() || EX[curProg()][pdb.opt === 'gym' ? 'gym' : 'home'];   // batch 17-S: jenis latihan aktif = susunan hari dari Pustaka

function kalGet(create) {
  const d = today();
  let t = tdb[d];
  if (t && t.kal) return t.kal;
  if (!create) return null;
  t = tdb[d] = t || tblank();
  t.kal = { ph: curProg(), opt: pdb.opt, ex: {}, done: false, rpe: null, t0: Date.now(), t1: 0 };
  if (skCancel()) toast('OFF hari ini dibatalkan karena latihan dimulai.');
  return t.kal;
}
function kalTouch() { const t = tdb[today()]; t.updated = Date.now(); queueSave('t'); }
function exState(id, e) {
  const k = kalGet(false), s = k && k.ex[id] ? k.ex[id].s : [];
  return Array.from({ length: Math.max(e.sets, s.length) }, (_, i) => s[i] || { r: null, d: false });
}
function setState(id, i, patch) {
  const k = kalGet(true), e = exList().find(x => x.id === id);
  const arr = exState(id, e).slice();
  while (arr.length <= i) arr.push({ r: null, d: false });
  arr[i] = Object.assign({}, arr[i], patch);
  k.ex[id] = { s: arr };
  k.ph = curProg(); k.opt = pdb.opt;
  k.lv = Object.assign({}, pdb.ladder); b19Stamp(k);   // batch 16: level tangga saat sesi (salinan; untuk PR per level)
  kalTouch();
}
function kalProgress() {
  let tot = 0, done = 0;
  exList().forEach(e => { const s = exState(e.id, e); tot += s.length; done += s.filter(x => x.d).length; });
  return { tot, done };
}
function syncSesi(d, type, rpe) {   // tandai sesi di Jurnal tanggal d
  const e = db[d] || (db[d] = blank());
  if (!e.sesi.includes(type)) e.sesi = e.sesi.filter(x => x !== 'rest').concat(type);
  if (rpe != null && e.rpe == null) e.rpe = rpe;
  e.updated = Date.now(); queueSave('d');
  if (d === cur) { populate(); }
}
const rng = a => a[0] === a[1] ? String(a[0]) : a[0] + '–' + a[1];
function exHTML(e) {
  const st = exState(e.id, e), unit = e.sec ? 'dtk' : 'reps';
  const ph = e.sec ? rng(e.sec) + ' dtk' : e.r ? rng(e.r) + ' reps' : '';
  const plan = e.sets + ' set' + (ph ? ' × ' + ph : '') + (e.per ? ' per ' + e.per : '') + (e.rir != null ? ', sisakan ' + e.rir + ' reps (RIR ' + e.rir + ')' : '') + ', istirahat ' + e.rest + ' dtk';
  const ph0 = e.sec ? String(e.sec[0]) : e.r ? rng(e.r) : 'reps';
  const rows = st.map((x, i) => '<div class="setrow"><span class="sn">' + (i + 1) + '</span>' +
    '<label class="inp sm"><input data-sx="' + e.id + '" data-si="' + i + '" inputmode="numeric" autocomplete="off" aria-label="' + esc(e.n) + ' set ' + (i + 1) + '" placeholder="' + ph0 + '" value="' + (x.r == null ? '' : x.r) + '"><span class="u">' + unit + '</span></label>' +
    (e.sec ? '<button class="btn sm ghost b16tb" data-q="hold" data-id="' + e.id + '" data-i="' + i + '" aria-label="Timer ' + esc(e.n) + ' set ' + (i + 1) + '">Timer</button>' : '') +
    '<button class="setok" aria-pressed="' + x.d + '" aria-label="Set ' + (i + 1) + ' selesai" data-q="setok" data-id="' + e.id + '" data-i="' + i + '"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div>').join('');
  let sug = '';
  if (e.pat && !e.sec) {
    const lv = pdb.ladder[e.pat], ds = st.filter(x => x.d && x.r != null);
    if (lv < 4 && ds.length >= e.sets && ds.every(x => x.r >= 15)) sug = '<div class="hint"><span>Semua set 15 reps atau lebih. Jika bentuk sempurna, siap naik ke ' + esc(LADDER[e.pat].lv[lv]) + '.</span><button class="btn sm" data-q="lvlUp" data-pat="' + e.pat + '">Naik level</button></div>';
  }
  const ctl = '<div class="hint"><button class="link" data-q="addSet" data-id="' + e.id + '">+ Set</button>' + (st.length > e.sets ? '<button class="link" data-q="delSet" data-id="' + e.id + '">− Set</button>' : '') + '</div>';
  return '<div class="ex"><div class="exh">' + esc(e.n) + '</div><div class="exv">' + esc(plan) + '</div>' + (e.v ? '<div class="exv">' + esc(e.v) + '</div>' : '') + b16ExNote(e) + rows + sug + ctl + b16PainHTML(e) + '</div>';
}
function finishHTML(k, pr) {
  if (k && k.done) {
    const mins = k.t0 && k.t1 ? ', ' + Math.max(1, Math.round((k.t1 - k.t0) / 60000)) + ' menit' : '';
    return '<div class="plan"><div><b>Sesi selesai</b><small>' + pr.done + ' dari ' + pr.tot + ' set' + (k.rpe ? ', RPE ' + k.rpe : '') + mins + '. Sudah masuk ke Jurnal.</small></div><button class="btn sm" data-q="reopen">Buka lagi</button></div>';
  }
  return '<div class="f"><div class="lbl">RPE sesi <small>1 ringan, 10 maksimal</small></div><div class="rpe">' +
    Array.from({ length: 10 }, (_, i) => '<button class="pill" data-q="trRpe" data-v="' + (i + 1) + '" aria-pressed="' + !!(k && k.rpe === i + 1) + '">' + (i + 1) + '</button>').join('') +
    '</div></div><button class="btn primary wide" data-q="finish">Selesai latihan</button>';
}
function ladderHTML() {
  return LK.map(k => {
    const L = LADDER[k], lv = pdb.ladder[k];
    return '<div class="f"><div class="lbl">' + L.nama + ' <small>' + esc(L.otot) + '</small></div>' +
      '<div class="seg">' + [1, 2, 3, 4].map(n => '<button class="pill" data-q="lvl" data-pat="' + k + '" data-v="' + n + '" aria-pressed="' + (n === lv) + '">' + n + '</button>').join('') + '</div>' +
      '<div class="mtxt" style="font-size:calc(14px * var(--fs));color:var(--ink)">Sekarang: ' + esc(L.lv[lv - 1]) + '</div>' +
      '<div class="mtxt">' + (lv < 4 ? 'Berikutnya: ' + esc(L.lv[lv]) : 'Level tertinggi di tangga ini') + '</div></div>';
  }).join('') + '<p class="note">Naik level saat kamu bisa lebih dari 15–20 reps dengan bentuk sempurna.</p>';
}
function kalHistHTML() {
  const ds = Object.keys(tdb).filter(d => tdb[d].kal && tdb[d].kal.done).sort().reverse().slice(0, 8);
  if (!ds.length) return '<p class="empty">Belum ada sesi selesai. Sesi yang kamu selesaikan muncul di sini.</p>';
  return ds.map(d => {
    const k = tdb[d].kal;
    let n = 0, t = 0;
    Object.keys(k.ex).forEach(id => { t += k.ex[id].s.length; n += k.ex[id].s.filter(x => x.d).length; });
    return kv(esc(dayShort(d)), n + ' set' + (k.rpe ? ', RPE ' + k.rpe : '') + ', ' + b19Tag(k));
  }).join('');
}
function kalHTML() {
  const t = today(), sc = schedFor(t), k = kalGet(false), pr = kalProgress(), prog = curProg();
  const planned = sc.s.kal ? 'Kalistenik terjadwal hari ini.' : 'Hari ini bukan jadwal kalistenik di Fase ' + sc.ph.id + '. Kamu tetap bisa latihan.';
  const chip = (act, v, label, on) => '<button class="pill" data-q="' + act + '" data-v="' + v + '" aria-pressed="' + on + '">' + label + '</button>';
  return '<p class="lead">' + planned + '</p>' +
    '<div class="f"><div class="lbl">Program</div><div class="seg">' + chip('prog', 1, 'Fase 1', prog === 1) + chip('prog', 2, 'Fase 2', prog === 2) + chip('prog', 3, 'Fase 3–4', prog === 3) + '</div>' +
    '<div class="sublbl">Tempat latihan</div><div class="seg">' + chip('opt', 'home', 'Di rumah', pdb.opt !== 'gym') + chip('opt', 'gym', 'Di gym', pdb.opt === 'gym') + '</div>' +
    '<div class="hint"><button class="link" data-q="tmAuto">Timer istirahat otomatis: ' + (pdb.auto === false ? 'mati' : 'nyala') + '</button>' + b16DlLink() + '</div></div>' +
    b19Ctl() + '<div class="fill"><div class="meter' + (pr.done === pr.tot ? ' ok' : '') + '"><i style="width:' + (pr.tot ? pr.done / pr.tot * 100 : 0).toFixed(0) + '%"></i></div><span>' + pr.done + ' dari ' + pr.tot + ' set</span></div>' +
    b16GdCard('wu') +
    '<section class="sec"><h2>Sesi hari ini</h2>' + b16DlNote() + exList().map(exHTML).join('') + '</section>' +
    b16GdCard('cd') +
    '<section class="sec"><h2>Selesaikan</h2>' + finishHTML(k, pr) + '</section>' +
    '<section class="sec"><h2>Tangga progresi</h2>' + ladderHTML() + '</section>' +
    '<section class="sec"><h2>Sesi terakhir</h2>' + kalHistHTML() + '</section>';
}
document.addEventListener('input', ev => {
  const el = ev.target, id = el.dataset && el.dataset.sx;
  if (!id) return;
  const c = el.value.replace(/[^0-9]/g, '');
  if (c !== el.value) el.value = c;
  setState(id, +el.dataset.si, { r: c === '' ? null : +c });
});
const isLastSet = (id, i) => { const L = exList(), last = L[L.length - 1]; return last.id === id && i === exState(id, last).length - 1; };
QACT.setok = el => {
  const id = el.dataset.id, i = +el.dataset.i, e = exList().find(x => x.id === id), nd = !exState(id, e)[i].d;
  setState(id, i, { d: nd });
  renderTrain();
  if (nd && pdb.auto !== false && !isLastSet(id, i)) tmStart('rest', e.rest, 'Istirahat setelah ' + e.n, null);
};
QACT.hold = el => {
  if (TM.mode === 'run') { toast('Timer sepeda sedang berjalan. Hentikan dulu untuk memakai timer set.'); return; }
  if (TM.mode === 'hold' && TM.ph === 'go') { toast('Simpan atau batalkan timer yang sedang berjalan dulu'); return; }
  const e = exList().find(x => x.id === el.dataset.id), i = +el.dataset.i;
  if (!e || !e.sec) return;
  tmStart('hold', 0, e.n + ', set ' + (i + 1), { id: e.id, i, tgt: e.sec });
};
QACT.tmSave = () => {
  if (TM.mode !== 'hold' || TM.ph !== 'go' || !TM.ref) return;
  const secs = Math.max(1, Math.floor((Date.now() - TM.g0) / 1000)), ref = TM.ref, e = exList().find(x => x.id === ref.id);
  tmStop();
  if (!e) return;
  setState(ref.id, ref.i, { r: secs, d: true }); renderTrain();
  if (pdb.auto !== false && !isLastSet(ref.id, ref.i)) tmStart('rest', e.rest, 'Istirahat setelah ' + e.n, null);
};
QACT.addSet = el => {
  const e = exList().find(x => x.id === el.dataset.id), n = exState(e.id, e).length;
  if (n >= 12) { toast('Maksimal 12 set'); return; }
  setState(e.id, n, { d: false }); renderTrain();
};
QACT.delSet = el => {
  const e = exList().find(x => x.id === el.dataset.id), st = exState(e.id, e);
  if (st.length <= e.sets) return;
  const k = kalGet(true); k.ex[e.id] = { s: st.slice(0, -1) }; kalTouch(); renderTrain();
};
QACT.prog = el => { trProg = +el.dataset.v; renderTrain(); };
QACT.opt = el => { setP({ opt: el.dataset.v }); renderTrain(); };
QACT.tmAuto = () => { setP({ auto: pdb.auto === false }); renderTrain(); };
QACT.lvl = el => { setP({ ladder: Object.assign({}, pdb.ladder, { [el.dataset.pat]: +el.dataset.v }) }); renderTrain(); };
QACT.lvlUp = el => {
  const pat = el.dataset.pat, nx = Math.min(4, pdb.ladder[pat] + 1);
  setP({ ladder: Object.assign({}, pdb.ladder, { [pat]: nx }) }); renderTrain();
  toast('Level ' + LADDER[pat].nama + ' naik ke ' + LADDER[pat].lv[nx - 1]);
};
QACT.trRpe = el => { const k = kalGet(true), v = +el.dataset.v; k.rpe = k.rpe === v ? null : v; kalTouch(); renderTrain(); };
QACT.finish = () => {
  const k = kalGet(false), pr = kalProgress();
  if (!k || !pr.done) { toast('Tandai minimal satu set dulu'); return; }
  k.done = true; k.t1 = Date.now(); kalTouch();
  syncSesi(today(), 'kalistenik', k.rpe);
  tmStop(); toast('Sesi tersimpan dan masuk ke Jurnal'); renderTrain();
};
QACT.reopen = () => { const k = kalGet(false); if (k) { k.done = false; kalTouch(); renderTrain(); } };

/* ===== MODUL: LATIHAN SEPEDA (batch 4) ===== */
const ZONES = [
  { z: 1, nama: 'Active recovery', rpe: '1–2', efek: 'Melancarkan aliran darah' },
  { z: 2, nama: 'Aerobic / fat oxidation', rpe: '3–4', efek: 'Membakar lemak dan membangun mitokondria. Masih bisa bicara lancar' },
  { z: 3, nama: 'Tempo', rpe: '5–6', efek: 'Ketahanan otot sedang' },
  { z: 4, nama: 'Laktat threshold (FTP)', rpe: '7–8', efek: 'Meningkatkan ambang batas kecepatan' },
  { z: 5, nama: 'VO2 max', rpe: '9–10', efek: 'Kapasitas jantung dan paru maksimum. Napas terengah-engah' }
];
const BT = {
  z2: { rencana: 'Rencana: 45–60 menit (Fase 1), 60 menit (Fase 2).', plan: ['Zone 2 stabil sepanjang sesi', 'Bernapas lewat hidung atau bicara satu kalimat penuh tanpa terputus', 'Cadence santai tapi stabil, 80–90 RPM'], min: 15, max: 180 },
  thr: { rencana: 'Rencana Fase 2, hari Selasa.', plan: ['Pemanasan 10 menit, Zone 2', '3 set × 8 menit, Zone 3–4', 'Istirahat 4 menit Zone 1 di antara set', 'Pendinginan 10 menit'] },
  long: { rencana: 'Rencana: 90–120 menit (Fase 2), 2,5–4 jam (Fase 3–4).', plan: ['Zone 2 stabil sepanjang ride', 'Membangun ketahanan jarak jauh'], min: 60, max: 300 },
  vo2: { rencana: 'Rencana Fase 3–4, 1x seminggu.', plan: ['Pemanasan 15 menit', '4 set × 4 menit keras di Zone 5 (±90–95% detak jantung maksimal, bukan all-out)', 'Istirahat 3 menit pelan di Zone 1 di antara set', 'Pendinginan 15 menit'] }
};
const BKTYPES = ['z2', 'thr', 'long', 'vo2'];
const RIDE_NAME = t => BIKE_LABEL[t] || 'Bebas';
let trainTab = 'kal', bkType = null, delArm = null;
const bkM = {};
const rideForm = { type: null, min: '', km: '', spd: '', rpe: null, note: '', hr: '', hx: '', el: '', kr: null, ml: '', lt: null, cd: '', cb: '', lhv: '' };   // q1: hr, hx, el = isian manual (kolom ride yang sudah ada)
let talkRes = null;
const todayBike = () => schedFor(today()).s.bike || null;
const curBk = () => bkType || todayBike() || 'z2';
const defMins = type => type === 'long' ? (progOf(today()) >= 3 ? 150 : 90) : (progOf(today()) >= 2 ? 60 : 45);
const curMins = type => bkM[type] || defMins(type);
function bikeSteps(type, mins) {
  const S = [], add = (n, z, sec) => S.push({ n, z, s: sec });
  if (type === 'thr') {
    add('Pemanasan', 'Zone 2', 600);
    for (let k = 1; k <= 3; k++) { add('Set ' + k + ' dari 3', 'Zone 3–4', 480); if (k < 3) add('Istirahat', 'Zone 1', 240); }
    add('Pendinginan', 'Zone 1', 600);
  } else if (type === 'vo2') {
    add('Pemanasan', 'Zone 2', 900);
    for (let k = 1; k <= 4; k++) { add('Set ' + k + ' dari 4: keras terkendali', 'Zone 5', 240); if (k < 4) add('Istirahat pelan', 'Zone 1', 180); }
    add('Pendinginan', 'Zone 1', 900);
  } else add(type === 'long' ? 'Long ride' : 'Zone 2 murni', 'Zone 2', mins * 60);
  return S;
}
function weekRides(ws) {
  const o = { n: 0, km: 0, min: 0, kmT: 0, minT: 0 };
  for (let i = 0; i < 7; i++) {
    const t = tdb[addDays(ws, i)];
    if (!t) continue;
    t.rides.forEach(r => { o.n++; if (r.km != null) o.km += r.km; if (r.min != null) o.min += r.min; if (r.km != null && r.min) { o.kmT += r.km; o.minT += r.min; } });
  }
  o.spd = o.minT ? o.kmT / (o.minT / 60) : null;
  return o;
}

/* --- mesin timer interval --- */
const BK = { run: null, id: null };
const bkElapsed = () => { const r = BK.run; return r.eb + (r.ra ? Date.now() - r.ra : 0); };
function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { /* abaikan */ } }
function bkStart() {
  const type = curBk(), steps = bikeSteps(type, curMins(type)), cum = [];
  let a = 0; steps.forEach(s => { cum.push(a); a += s.s; });
  if (skCancel()) toast('OFF hari ini dibatalkan karena latihan dimulai.');
  BK.run = { type, steps, cum, total: a, i: 0, eb: 0, ra: Date.now(), cd: '' };
  unlockAudio(); WL.on();
  clearInterval(TM.id); TM.id = null; TM.ph = '';   // batch 16: hentikan interval timer set/istirahat yang tertinggal
  TM.mode = 'run'; $('#tmbar').hidden = true; $('#tmRest').hidden = true; $('#tmReady').hidden = true; $('#tmHold').hidden = true; $('#tmRun').hidden = false; document.body.classList.add('tm');
  clearInterval(BK.id); BK.id = setInterval(bkTick, 250);
  buzz(); beep(1); renderTrain(); bkTick();
}
function bkStop() {
  clearInterval(BK.id); BK.id = null; b56Stop(); b58Stop(); BK.run = null;
  $('#tmRun').hidden = true; tmStop(true);
}
function bkTick() {
  const r = BK.run;
  if (!r) return;
  const e = bkElapsed() / 1000;
  if (e >= r.total) { bkFinish(r.total, true); return; }
  let i = r.cum.length - 1;
  while (r.cum[i] > e) i--;
  if (i !== r.i) { r.i = i; buzz(); beep(2); if (curView === 'train' && trainTab === 'bike') renderTrain(); }
  const st = r.steps[i], left = r.cum[i] + st.s - e, sec = Math.ceil(left);
  if (sec >= 1 && sec <= 3 && r.cd !== i + ':' + sec) { r.cd = i + ':' + sec; beep(1); }
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set('#bkTime', mmss(left)); set('#bkStep', st.n); set('#bkZone', st.z);
  const nx = r.steps[i + 1];
  set('#bkNext', nx ? 'Berikutnya: ' + nx.n + ', ' + nx.z + ', ' + mmss(nx.s) : 'Langkah terakhir');
  set('#bkTotal', 'Total ' + mmss(e) + ' dari ' + mmss(r.total));
  const bar = $('#bkBar'); if (bar) bar.style.width = (e / r.total * 100).toFixed(1) + '%';
  $('#tmLabel').textContent = 'Sepeda: ' + st.n; $('#tmTime').textContent = mmss(left);
  b56Paint();
}
function bkFinish(secs, natural) {
  const r = BK.run;
  if (svSt.info || svSt.busy) { svReset(); rideForm.km = ''; rideForm.spd = ''; }   // impor foto Strava lama tidak boleh ikut ke ride hasil timer
  rideForm.type = r.type; rideForm.min = String(Math.max(1, Math.round(secs / 60)));
  if (r.gps && r.gps.km >= 0.1) rideForm.km = String(Math.round(r.gps.km * 100) / 100);
  RT61 = r.gps && r.gps.pts && r.gps.pts.length >= 2 && r.gps.km >= 0.1 ? { s: b61Enc(r.gps.pts), km: rideForm.km, keep: true } : null;   // tahap 61a
  const sf = b58Fill(r);
  if (natural) { buzz(); beep(3); }
  bkStop(); trainTab = 'bike';
  const got = (sf.length ? [sf.join(' dan ') + ' dari sensor'] : []).concat(r.gps && r.gps.km >= 0.1 ? ['jarak dari GPS'] : []);
  toast((natural ? 'Sesi selesai. ' : 'Sesi dihentikan. ') + (got.length ? got.join(', ').replace(/^./, c => c.toUpperCase()) + ' sudah terisi, periksa lalu simpan ride.' : 'Isi jarak untuk mencatat ride.'));
  if (curView === 'train') renderTrain(); else showView('train');
}
function tmSync() { if (TM.mode === 'run') $('#tmbar').hidden = curView === 'train'; }

/* --- tampilan --- */
function runHTML() {
  const r = BK.run, st = r.steps[r.i];
  return '<div class="run"><div class="runz" id="bkZone">' + esc(st.z) + '</div><div class="runstep" id="bkStep">' + esc(st.n) + '</div>' +
    '<div class="runtime" id="bkTime">' + mmss(st.s) + '</div><div class="mtxt" id="bkNext"></div>' +
    '<div class="meter"><i id="bkBar" style="width:0%"></i></div><div class="mtxt" id="bkTotal"></div>' +
    '<div class="runacts"><button class="btn" data-q="bkPause">' + (r.ra ? 'Jeda' : 'Lanjut') + '</button><button class="btn" data-q="bkSkip">Lewati langkah</button><button class="btn danger" data-q="bkEnd">Akhiri</button></div></div>' +
    '<p class="note">Tanda suara dan getar muncul tiap pergantian langkah, jadi layar tidak perlu dipantau terus. Layar dijaga tetap menyala.</p>';
}
function bkSessionHTML() {
  if (BK.run) return runHTML();
  const type = curBk(), bt = BT[type], fixed = !bt.min, mins = fixed ? null : curMins(type);
  const tot = Math.round(bikeSteps(type, mins).reduce((a, s) => a + s.s, 0) / 60);
  const chips = BKTYPES.map(t => '<button class="pill" data-q="bkType" data-v="' + t + '" aria-pressed="' + (t === type) + '">' + esc(BIKE_LABEL[t]) + '</button>').join('');
  return '<div class="chips">' + chips + '</div>' +
    '<ul class="plist">' + bt.plan.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<p class="note" style="margin-top:6px">' + esc(bt.rencana) + '</p>' + bkHrNote(type) +
    (fixed ? '<p class="note">Total sekitar ' + tot + ' menit.</p>' :
      '<div class="sublbl">Durasi</div><div class="stepper"><button class="btn" data-q="bkMin" data-v="-5" aria-label="Kurangi 5 menit">− 5</button><b>' + mins + ' menit</b><button class="btn" data-q="bkMin" data-v="5" aria-label="Tambah 5 menit">+ 5</button></div>') +
    '<button class="btn primary wide" style="margin-top:14px" data-q="bkStart">Mulai sesi' + (fixed ? '' : ' ' + mins + ' menit') + '</button>';
}
function rideFormHTML() {
  const f = rideForm, type = f.type || curBk();
  const chips = BKTYPES.concat('free').map(t => '<button class="pill" data-q="rfType" data-v="' + t + '" aria-pressed="' + (t === type) + '">' + esc(RIDE_NAME(t)) + '</button>').join('');
  const inp = (k, lbl, u, ph) => '<div><div class="sublbl t0">' + lbl + '</div><label class="inp"><input data-rf="' + k + '" inputmode="decimal" autocomplete="off" placeholder="' + ph + '" value="' + esc(f[k]) + '"><span class="u">' + u + '</span></label></div>';
  return svHTML() + '<div class="chips">' + chips + '</div>' +
    '<div class="pair rg" style="margin-top:14px">' + inp('min', 'Durasi', 'menit', '0') + inp('km', 'Jarak', 'km', '0') + '</div>' +
    '<div style="margin-top:12px">' + inp('spd', 'Speed rata-rata (opsional)', 'km/jam', '0') + '<div class="mtxt" id="rfHint"></div></div>' +
    (svSt.info ? '' : '<div class="sublbl" style="margin-top:12px">Detak jantung dan tanjakan (opsional)</div><div class="pair rg">' + inp('hr', 'HR rata-rata', 'bpm', '0') + inp('hx', 'HR maksimum', 'bpm', '0') + '</div><div style="margin-top:12px">' + inp('el', 'Naik (elevasi)', 'm', '0') + '</div><p class="note">HR rata-rata dipakai Cek Zone 2 untuk menilai ride ini.</p>') +
    bk55FormHTML() + bzKdFormHTML() +
    '<div class="sublbl">RPE ride</div><div class="rpe">' + Array.from({ length: 10 }, (_, i) => '<button class="pill" data-q="rfRpe" data-v="' + (i + 1) + '" aria-pressed="' + (f.rpe === i + 1) + '">' + (i + 1) + '</button>').join('') + '</div>' +
    '<input class="txt" data-rf="note" placeholder="Catatan (opsional)" autocomplete="off" value="' + esc(f.note) + '">' +
    b61Form() + '<button class="btn primary wide" style="margin-top:14px" data-q="rfSave">Simpan ride</button>';
}
function bkWeekHTML() {
  const w = weekRides(thisWeek()), T = (l, v, s) => '<div class="tile"><small>' + l + '</small><b>' + v + '</b><em>' + s + '</em></div>';
  return '<div class="tiles">' + T('Ride', w.n, 'pekan ini') + T('Jarak', fmt(w.km, 1) + ' km', 'total') + T('Waktu', fmt(w.min / 60, 1) + ' jam', 'total') + T('Rata-rata', w.spd == null ? '–' : fmt(w.spd, 1) + ' km/jam', 'jarak per jam') + '</div>';
}
const TALK = {
  1: 'Satu kalimat penuh tanpa terputus: kamu di Zone 2 atau lebih ringan. Ini yang dicari untuk sesi Zone 2.',
  2: 'Terputus-putus, hanya beberapa kata: kamu di atas Zone 2 (perkiraan Zone 3–4). Kurangi tenaga bila sesi hari ini Zone 2.',
  3: 'Napas terengah-engah: ini level Zone 5, hanya untuk set interval VO2 max. Untuk sesi lain, turunkan tenaga jauh.'
};
function talkHTML() {
  const o = [[1, 'Satu kalimat penuh, tanpa terputus'], [2, 'Terputus-putus, beberapa kata saja'], [3, 'Terengah-engah, sulit bicara']];
  return '<p class="note" style="margin-top:12px">Sambil mengayuh, coba ucapkan satu kalimat. Apa yang terjadi?</p><div class="talk">' +
    o.map(x => '<button class="pill" data-q="talk" data-v="' + x[0] + '" aria-pressed="' + (talkRes === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
    (talkRes ? '<p class="note" style="color:var(--ink)">' + esc(TALK[talkRes]) + '</p>' : '') + b17cZ2HTML();
}
function recentRidesHTML() {
  const out = [];
  Object.keys(tdb).sort().reverse().forEach(d => tdb[d].rides.slice().reverse().forEach(r => out.push({ d, r })));
  if (!out.length) return '<p class="empty">Belum ada ride tercatat.</p>';
  return out.slice(0, 8).map(x => {
    const r = x.r, parts = [];
    if (r.min != null) parts.push(fmt(r.min, 0) + ' menit');
    if (r.km != null) parts.push(fmt(r.km, 1) + ' km');
    if (r.spd != null) parts.push(fmt(r.spd, 1) + ' km/jam');
    if (r.rpe != null) parts.push('RPE ' + r.rpe);
    svParts(r).forEach(p => parts.push(p));
    bzKdParts(r).forEach(p => parts.push(p));   // q5a
    bk55Parts(r).forEach(p => parts.push(p));
    const armed = delArm === r.id;
    return '<div class="plan rr"><div><b>' + esc(dayShort(x.d)) + ': ' + esc(RIDE_NAME(r.type)) + '</b><small>' + esc(parts.join(', ') || 'Tanpa angka') + (r.note ? '. ' + esc(r.note) : '') + '</small></div>' +
      b61Btn(r) + '<button class="btn sm ' + (armed ? 'danger' : 'ghost') + '" data-q="rideDel" data-d="' + x.d + '" data-id="' + esc(r.id) + '">' + (armed ? 'Yakin hapus?' : 'Hapus') + '</button></div>' + b61Map(x.d, r);
  }).join('');
}
function bikeHTML() {
  const tb = todayBike();
  const lead = tb ? 'Hari ini terjadwal: ' + BIKE_LABEL[tb] + '.' : 'Hari ini bukan jadwal sepeda. Kamu tetap bisa bersepeda.';
  return '<p class="lead">' + esc(lead) + '</p>' +
    '<section class="sec"><h2>Sesi</h2><div class="f">' + bkSessionHTML() + '</div></section>' +
    '<section class="sec"><h2>Catat ride</h2><div class="f">' + rideFormHTML() + '</div></section>' +
    '<section class="sec"><h2>Pekan ini</h2>' + bkWeekHTML() + '</section>' +
    '<section class="sec"><h2>Km per pekan</h2>' + bkKmHTML() + '</section>' +
    '<section class="sec"><h2>Zona latihan</h2>' + zonesHTML() + '<h3 class="sub">Uji bicara</h3>' + talkHTML() + '</section>' +
    '<section class="sec"><h2>Ride terakhir</h2>' + recentRidesHTML() + b17cAiRowHTML() + '</section>';
}
/* --- Yoga (Tahap 63): gelombang 1 = 24 pose inti; foto/video lewat tautan pencarian, kolom img untuk URL terverifikasi --- */
const YG_IMG = "https://res.cloudinary.com/dko1be2jy/image/upload/fl_sanitize/";
/* data-yoga.js potongan 0 (Tahap 3b): dipindah ke berkas sendiri, dimuat sebelum app.js */
(function(){var s=document.createElement('style');s.textContent='.yg-ph{background:#fff;border-radius:12px;padding:8px;margin:8px 0;text-align:center}.yg-ph img{max-width:100%;height:auto;max-height:320px}.yg-n{color:var(--mute);font-size:.85em}.yg-en{white-space:normal}.yg-v{position:relative;padding-top:56.25%;margin:8px 0;border-radius:12px;overflow:hidden;background:#000}.yg-v iframe,.yg-v button{position:absolute;top:0;left:0;width:100%;height:100%;border:0}.yg-v button{color:#fff;background:#000;font-size:1.1em;cursor:pointer}';document.head.appendChild(s);})();
document.addEventListener('error',function(ev){var im=ev.target;if(!im||im.tagName!=='IMG'||!im.dataset||!im.dataset.yg)return;if(im.dataset.s&&!im.dataset.t){im.dataset.t='1';im.src=im.dataset.s;}else{var d=im.parentNode;if(d)d.textContent='Foto tidak termuat (perlu internet). Pakai tautan Cari foto di bawah.';}},true);
function ygImgs(p){var j=(p.fi||[]).map(function(s){return '<div class="yg-ph"><img class="yg-j" data-yg="1" src="'+YG_FI+s+'" alt="'+esc(p.idn)+'" loading="lazy" referrerpolicy="no-referrer"></div>';}).join('');return j+p.im.map(function(s){return '<div class="yg-ph"><img data-yg="1" src="'+YG_IMG+s+'.png" data-s="'+YG_IMG+s+'.svg" alt="'+esc(p.idn)+'" loading="lazy" referrerpolicy="no-referrer"></div>';}).join('');}
/* data-yoga.js potongan 1 (Tahap 3b): dipindah ke berkas sendiri, dimuat sebelum app.js */
const YOGA_VD = {};
/*Y67F*/const YG_FI = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
/* data-yoga.js potongan 2 (Tahap 3b): dipindah ke berkas sendiri, dimuat sebelum app.js */
function ygSteps(p){var L=function(a){return '<ol>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>';};if(p.st.length)return L(p.st);if(p.pr.length)return L(p.pr)+'<p class="yg-n">Langkah dari sumber terbuka, bahasa Inggris; terjemahan menyusul.</p>';if(p.ds)return '<p class="yg-en">'+esc(p.ds)+'</p><p class="yg-n">Teks asli bahasa Inggris; terjemahan menyusul.</p>';return '<p class="yg-n">Langkah belum tersedia.</p>';}
function ygCx(p){return p.cx.length?'<h3 class="sub">Hindari atau tanya dokter dulu bila</h3><p>'+esc(p.cx.join(', '))+'.</p><p class="yg-n">Sumber: LunaticPrakash/yoga-api (diterjemahkan). Bukan saran medis.</p>':'';}
function ygBn(p){if(p.bn)return '<h3 class="sub">Manfaat</h3><p class="yg-en">'+esc(p.bn)+'</p><p class="yg-n">Teks asli bahasa Inggris.</p>';if(p.bl.length)return '<h3 class="sub">Manfaat</h3><ul>'+p.bl.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul><p class="yg-n">Teks asli bahasa Inggris.</p>';return '';}
/* ===== Tahap 68b: video YouTube di detail Yoga (memakai mesin 68a) ===== */
function ygKey(p) { return 'y:' + String(p.en).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 44); }   // kunci simpan stabil: nama Inggris, bukan indeks array
function ygYt() { return '<div class="b18act"><button type="button" class="btn sm b18go" data-q="ytOpen">Cari video di sini</button></div><div class="ytp" id="ytHostY">' + ytHostHTML() + '</div>'; }
function ygVid(p){if(!p.vd)return '';return '<div class="yg-v"><button type="button" data-q="ygPlay" data-v="'+esc(p.vd)+'" aria-label="Putar video '+esc(p.idn)+'">&#9654; Putar video</button></div><p class="yg-n">Bila video tidak tampil, <a href="https://www.youtube.com/watch?v='+esc(p.vd)+'" target="_blank" rel="noopener">buka di YouTube</a>.</p>';}
const YOGA = [
["Tadasana","Mountain Pose","Pose Gunung","Berdiri","pemula","kaki,inti,keseimbangan","Berdiri tegak, kaki selebar pinggul, berat merata di kedua telapak.|Angkat tempurung lutut, rapatkan perut, turunkan bahu menjauh dari telinga.|Panjangkan puncak kepala ke atas, bernapas dalam 5-8 kali.",""],
["Adho Mukha Svanasana","Downward-Facing Dog","Anjing Menghadap Bawah","Berdiri","pemula","punggung,kaki,bahu,lengan","Mulai dari merangkak, jari tangan terbuka, jari kaki ditekuk ke bawah.|Angkat pinggul ke atas dan belakang hingga tubuh membentuk huruf V terbalik.|Tekan lantai dengan telapak tangan, lutut boleh ditekuk, tahan 5-8 napas.","Kurangi tekanan bila pergelangan tangan nyeri atau tekanan darah tinggi."],
["Balasana","Child's Pose","Pose Anak","Duduk","pemula","punggung,pinggul,relaksasi","Duduk di atas tumit dengan lutut selebar matras.|Lipat badan ke depan hingga dahi menyentuh lantai, lengan di depan atau di sisi badan.|Bernapas ke punggung, tahan 1-3 menit.","Ganjal bantal di bawah paha atau dahi bila lutut atau pinggul kaku."],
["Bhujangasana","Cobra Pose","Pose Kobra","Pelengkung belakang","pemula","punggung,dada,inti","Telungkup, telapak tangan di bawah bahu, siku rapat ke badan.|Saat menarik napas, angkat dada sedikit demi sedikit; pinggul dan kaki tetap menempel.|Bahu jauh dari telinga, tahan 3-5 napas, turun perlahan.","Jangan memaksa melengkung bila punggung bawah nyeri tajam; tidak dianjurkan saat hamil."],
["Virabhadrasana I","Warrior I","Pejuang I","Berdiri","pemula","kaki,pinggul,dada,keseimbangan","Langkahkan satu kaki ke belakang, telapak belakang menyerong sekitar 45 derajat.|Tekuk lutut depan di atas pergelangan kaki, panggul menghadap depan.|Angkat kedua lengan ke atas, dada terbuka, tahan 5 napas lalu ganti sisi.","Perpendek langkah bila lutut atau pinggul terasa tegang."],
["Virabhadrasana II","Warrior II","Pejuang II","Berdiri","pemula","kaki,pinggul,bahu,lengan","Buka kaki lebar, putar kaki depan keluar 90 derajat, kaki belakang sedikit menyerong.|Tekuk lutut depan searah jari kaki, rentangkan lengan sejajar bahu.|Tatap jari tangan depan, tahan 5 napas lalu ganti sisi.",""],
["Utthita Trikonasana","Triangle Pose","Pose Segitiga","Berdiri","pemula","kaki,pinggul,inti","Buka kaki lebar, kaki depan menghadap keluar, rentangkan lengan.|Condongkan badan ke depan lalu turunkan satu tangan ke tulang kering atau balok.|Buka dada, tangan atas ke langit, tahan 5 napas lalu ganti sisi.","Tidak perlu menengadah bila leher terasa tegang."],
["Vrksasana","Tree Pose","Pose Pohon","Keseimbangan","pemula","kaki,keseimbangan,pinggul","Berdiri di satu kaki, tatap satu titik tetap di depan.|Letakkan telapak kaki lain di betis atau paha dalam, jangan menekan tepat di lutut.|Satukan tangan di dada atau angkat ke atas, tahan 5-8 napas lalu ganti sisi.","Dekatkan diri ke dinding untuk berpegangan bila belum stabil."],
["Uttanasana","Standing Forward Fold","Lipat Depan Berdiri","Berdiri","pemula","kaki,punggung","Berdiri tegak, tarik napas, panjangkan tulang belakang.|Hembuskan napas, lipat dari pangkal paha, lutut boleh ditekuk.|Biarkan kepala dan lengan menggantung rileks, tahan 5-8 napas.","Naik perlahan agar tidak pusing."],
["Utkatasana","Chair Pose","Pose Kursi","Berdiri","pemula","kaki,inti,pinggul","Berdiri dengan kaki rapat atau selebar pinggul.|Tekuk lutut dan dorong pinggul ke belakang seperti duduk di kursi, berat di tumit.|Angkat lengan ke atas, dada terbuka, tahan 5 napas.",""],
["Phalakasana","Plank Pose","Pose Papan","Inti","pemula","inti,bahu,lengan","Mulai dari merangkak, luruskan kaki ke belakang, telapak tangan di bawah bahu.|Bentuk garis lurus dari kepala ke tumit, kencangkan perut.|Tahan 20-60 detik.","Turunkan lutut bila pinggang melorot."],
["Chaturanga Dandasana","Four-Limbed Staff Pose","Pose Tongkat Empat Anggota","Inti","menengah","lengan,bahu,inti","Mulai dari Plank, majukan bahu sedikit melewati pergelangan.|Tekuk siku ke belakang dekat rusuk hingga lengan atas sejajar lantai.|Tahan sejenak lalu dorong kembali ke Plank atau turunkan ke lantai.","Latih dengan lutut menempel dulu; pergelangan dan bahu rentan cedera."],
["Paschimottanasana","Seated Forward Bend","Lipat Depan Duduk","Duduk","pemula","kaki,punggung","Duduk, kedua kaki lurus, jari kaki menarik ke arah badan.|Tarik napas panjangkan tulang belakang, hembuskan napas lipat dari pangkal paha.|Pegang tulang kering, kaki, atau tali yoga, tahan 5-8 napas.","Tekuk lutut sedikit bila paha belakang sangat tegang."],
["Baddha Konasana","Butterfly Pose","Pose Kupu-Kupu","Duduk","pemula","pinggul,punggung","Duduk, tekuk lutut, telapak kaki saling menempel dekat pangkal paha.|Pegang kaki, panjangkan tulang belakang, biarkan lutut turun ke samping.|Tahan 1-2 menit, boleh condong ke depan perlahan.","Ganjal bantal di bawah lutut bila pinggul kaku."],
["Janu Sirsasana","Head-to-Knee Forward Bend","Kepala ke Lutut","Duduk","pemula","kaki,punggung,pinggul","Duduk, satu kaki lurus, telapak kaki lain menempel paha dalam.|Putar badan menghadap kaki lurus, panjangkan tulang belakang.|Lipat ke depan, tahan 5-8 napas lalu ganti sisi.",""],
["Ardha Matsyendrasana","Half Lord of the Fishes","Putaran Duduk","Duduk","menengah","punggung,pinggul,inti","Duduk, silangkan satu kaki di atas lutut kaki lain, telapak menapak lantai.|Tarik napas panjangkan tulang belakang, hembuskan napas putar badan ke arah lutut yang ditekuk.|Tahan 5 napas lalu ganti sisi.","Putar dari tulang belakang, jangan memaksa dari leher; hindari bila punggung bawah cedera."],
["Setu Bandhasana","Bridge Pose","Pose Jembatan","Pelengkung belakang","pemula","punggung,pinggul,kaki,dada","Telentang, tekuk lutut, telapak kaki selebar pinggul dekat bokong.|Tekan kaki, angkat pinggul hingga tubuh miring dari bahu ke lutut.|Tahan 5-8 napas, turun perlahan ruas demi ruas.","Jangan menoleh ke samping saat bahu menumpu lantai."],
["Marjaryasana-Bitilasana","Cat-Cow","Kucing-Sapi","Pemanasan","pemula","punggung,inti","Merangkak, telapak di bawah bahu, lutut di bawah pinggul.|Tarik napas: turunkan perut, angkat dada dan tulang ekor (Sapi).|Hembuskan napas: bulatkan punggung, dagu ke dada (Kucing). Ulangi 8-10 kali.","Bergerak pelan mengikuti napas."],
["Navasana","Boat Pose","Pose Perahu","Inti","menengah","inti,pinggul,keseimbangan","Duduk, lutut ditekuk, telapak kaki di lantai.|Condong sedikit ke belakang, angkat kaki hingga tulang kering sejajar lantai.|Luruskan lengan sejajar kaki, punggung tetap panjang, tahan 5 napas.","Pegang belakang paha bila punggung membulat."],
["Salabhasana","Locust Pose","Pose Belalang","Pelengkung belakang","pemula","punggung,kaki,inti","Telungkup, lengan di samping badan, dahi di lantai.|Angkat dada, lengan, dan kaki sekaligus dari lantai.|Pandangan ke lantai, tahan 3-5 napas lalu turun.","Jangan menekan leher dengan menengadah."],
["Ustrasana","Camel Pose","Pose Unta","Pelengkung belakang","menengah","dada,punggung,pinggul","Berlutut, lutut selebar pinggul, tangan di pinggang.|Dorong pinggul ke depan, buka dada, lengkungkan punggung.|Raih tumit atau tetap tangan di pinggang, tahan 3-5 napas.","Pakai balok bila belum sampai tumit; hindari bila punggung atau leher bermasalah."],
["Eka Pada Rajakapotasana","Pigeon Pose","Pose Merpati","Duduk","menengah","pinggul,kaki","Dari anjing menghadap bawah, bawa satu lutut ke depan di antara kedua tangan.|Luruskan kaki belakang, turunkan pinggul ke arah lantai.|Lipat ke depan, tahan 1-2 menit lalu ganti sisi.","Ganjal bantal di bawah pinggul bila lutut tegang."],
["Viparita Karani","Legs-Up-the-Wall","Kaki ke Dinding","Pemulihan","pemula","kaki,relaksasi","Duduk menyamping dekat dinding, lalu telentang dan sandarkan kaki ke dinding.|Rapatkan pinggul ke dinding (boleh ganjal bantal).|Rilekskan lengan, tahan 3-10 menit.","Turun bila kaki kesemutan."],
["Savasana","Corpse Pose","Pose Jenazah","Pemulihan","pemula","relaksasi","Telentang, kaki sedikit terbuka, telapak tangan menghadap atas.|Pejamkan mata, lepaskan seluruh otot, napas alami.|Tahan 3-5 menit di akhir latihan.",""],
["Dhanurasana","Bow Pose","Pose Busur","Pelengkung belakang","menengah","punggung,dada,inti,kaki","","Hindari bila punggung atau leher cedera, hamil, hernia, atau tekanan darah tidak terkontrol."],
["Alanasana","Crescent Lunge","Lunge Bulan Sabit","Berdiri","pemula","kaki,pinggul,inti,keseimbangan","",""],
["Bakasana","Crow Pose","Pose Gagak","Keseimbangan","mahir","lengan,bahu,inti,keseimbangan","","Latih di atas matras tebal; hindari bila pergelangan tangan atau bahu cedera."],
["Ardha Pincha Mayurasana","Dolphin Pose","Pose Lumba-lumba","Inti","menengah","bahu,lengan,punggung,kaki","","Hindari bila leher atau bahu cedera."],
["Garudasana","Eagle Pose","Pose Elang","Keseimbangan","menengah","kaki,pinggul,bahu,keseimbangan","","Hindari bila lutut atau pergelangan kaki cedera."],
["Utthita Hasta Padangusthasana","Extended Hand-to-Toe Pose","Pose Tangan ke Jempol Kaki","Keseimbangan","mahir","kaki,pinggul,keseimbangan","","Pakai tali yoga di kaki bila hamstring kaku."],
["Utthita Parsvakonasana","Extended Side Angle","Pose Sudut Samping","Berdiri","menengah","kaki,pinggul,dada,bahu","","Hindari bila lutut cedera atau sedang migrain."],
["Pincha Mayurasana","Forearm Stand","Berdiri di Lengan Bawah","Balik badan","mahir","bahu,lengan,inti,keseimbangan","","Pose terbalik: latih dekat dinding; hindari bila hamil, tekanan darah tinggi, atau leher/bahu cedera."],
["Malasana","Garland Pose","Pose Jongkok","Duduk","pemula","pinggul,kaki,punggung","","Ganjal tumit dengan handuk bila tidak sampai lantai; hati-hati bila lutut cedera."],
["Ardha Navasana","Half Boat Pose","Pose Setengah Perahu","Inti","pemula","inti,kaki,punggung","",""],
["Ardha Chandrasana","Half Moon Pose","Pose Setengah Bulan","Keseimbangan","menengah","kaki,pinggul,inti,keseimbangan","",""],
["Adho Mukha Vrksasana","Handstand","Berdiri dengan Tangan","Balik badan","mahir","bahu,lengan,inti,keseimbangan","","Pose terbalik: latih di dinding; hindari bila hamil, tekanan darah tinggi, atau bahu/pergelangan tangan cedera."],
["Padmasana","Lotus Pose","Pose Teratai","Duduk","mahir","pinggul,kaki","","Jangan dipaksa; hindari bila lutut atau pergelangan kaki cedera."],
["Anjaneyasana","Low Lunge","Lunge Rendah","Berdiri","pemula","pinggul,kaki,dada,keseimbangan","","Alasi lutut belakang; hindari bila lutut cedera."],
["Supta Kapotasana","Reclining Pigeon","Merpati Telentang","Pemulihan","pemula","pinggul,kaki,punggung","","Hindari bila lutut atau pinggul cedera."],
["Halasana","Plow Pose","Pose Bajak","Balik badan","menengah","punggung,bahu,inti","","Hindari bila leher cedera, hamil, atau tekanan darah tinggi; jangan menoleh saat di pose."],
["Parsvottanasana","Pyramid Pose","Pose Piramida","Berdiri","menengah","kaki,punggung,pinggul,bahu","",""],
["Parsva Virabhadrasana","Reverse Warrior","Pejuang Terbalik","Berdiri","pemula","kaki,pinggul,dada,lengan","","Hindari bila lutut cedera."],
["Salamba Sarvangasana","Shoulder Stand","Berdiri dengan Bahu","Balik badan","mahir","bahu,punggung,inti","","Hindari bila leher cedera, hamil, haid, atau tekanan darah tinggi; ganjal bahu dengan selimut."],
["Vasisthasana","Side Plank","Plank Samping","Inti","menengah","inti,lengan,bahu,keseimbangan","","Hindari bila bahu atau pergelangan tangan cedera."],
["Upavistha Konasana","Side Splits","Split Samping","Duduk","menengah","pinggul,kaki,punggung","",""],
["Salamba Bhujangasana","Sphinx Pose","Pose Sphinx","Pelengkung belakang","pemula","punggung,dada,bahu","",""],
["Hanumanasana","Splits","Pose Split","Duduk","mahir","kaki,pinggul","","Panaskan tubuh dulu; jangan dipaksa, ganjal dengan balok yoga."],
["Urdhva Mukha Svanasana","Upward-Facing Dog","Anjing Menghadap Atas","Pelengkung belakang","menengah","punggung,dada,lengan,bahu","","Hindari bila pergelangan tangan nyeri atau punggung bawah cedera."],
["Virabhadrasana III","Warrior III","Pejuang III","Keseimbangan","menengah","kaki,punggung,inti,keseimbangan","",""],
["Urdhva Dhanurasana","Wheel Pose","Pose Roda","Pelengkung belakang","mahir","punggung,dada,bahu,lengan","","Hindari bila pergelangan tangan, bahu, atau punggung cedera, hamil, atau tekanan darah tinggi."],
["Camatkarasana","Wild Thing","Pose Liar","Pelengkung belakang","menengah","dada,bahu,pinggul,lengan","","Hindari bila bahu atau pergelangan tangan cedera."],
["","Standing Quad Stretch","Peregangan Paha Depan Berdiri","Fleksibilitas","pemula","kaki,pinggul,keseimbangan","Berdiri tegak (pegang dinding bila perlu), tekuk satu lutut dan tarik tumit ke arah bokong.|Lutut menunjuk ke lantai, panggul dimiringkan sedikit ke depan, perut rapat.|Tahan 20-30 detik, 2 kali tiap sisi.","Jangan menarik bila lutut nyeri."],
["","Seated Hamstring Stretch","Peregangan Paha Belakang Duduk","Fleksibilitas","pemula","kaki,punggung","Duduk, satu kaki lurus, kaki lain ditekuk dengan telapak menyentuh paha dalam.|Tegakkan punggung, condongkan dada ke kaki yang lurus sampai paha belakang terasa tertarik.|Tahan 20-30 detik, 2 kali tiap sisi.","Jaga punggung tetap lurus; tidak perlu sampai menyentuh jari kaki."],
["","Kneeling Hip Flexor Stretch","Peregangan Fleksor Pinggul Berlutut","Fleksibilitas","pemula","pinggul,kaki","Berlutut dengan satu kaki di depan (lutut 90 derajat); alasi lutut belakang dengan handuk.|Rapatkan perut, miringkan panggul ke bawah, lalu geser pinggul sedikit ke depan.|Tahan 30 detik, 2 kali tiap sisi.","Jangan melengkungkan punggung bawah berlebihan."],
["","Figure-Four Stretch","Peregangan Angka Empat (Bokong)","Fleksibilitas","pemula","pinggul","Telentang, lutut tertekuk; letakkan pergelangan kaki kanan di atas paha kiri.|Tarik paha kiri ke arah dada sampai bokong kanan terasa tertarik.|Tahan 30 detik, 2 kali tiap sisi.","Hentikan bila lutut terasa nyeri."],
["","Standing Calf Stretch","Peregangan Betis di Dinding","Fleksibilitas","pemula","kaki,pergelangan","Berdiri menghadap dinding, satu kaki di belakang dengan tumit tetap menempel lantai.|Dorong badan ke depan dengan lutut belakang lurus sampai betis terasa tertarik.|Tahan 30 detik, 2 kali tiap sisi.",""],
["","Cross-Body Shoulder Stretch","Peregangan Bahu Silang","Fleksibilitas","pemula","bahu","Bawa satu lengan lurus melintasi dada.|Tahan lengan itu dengan lengan lain di dekat siku; bahu tetap turun.|Tahan 20-30 detik, 2 kali tiap sisi.",""],
["","Doorway Chest Stretch","Peregangan Dada di Pintu","Fleksibilitas","pemula","dada,bahu","Berdiri di bingkai pintu, letakkan lengan bawah di sisi pintu dengan siku setinggi bahu.|Melangkah pelan ke depan sampai dada terbuka.|Tahan 30 detik, 2 kali.","Hentikan bila bahu terasa nyeri tajam."],
["","Neck Side Stretch","Peregangan Leher Samping","Fleksibilitas","pemula","leher","Duduk tegak, turunkan bahu.|Miringkan telinga ke bahu; boleh dibantu tangan dengan tekanan sangat ringan.|Tahan 20 detik, 2 kali tiap sisi.","Jangan menarik kepala keras-keras; hentikan bila kesemutan atau pusing."],
["","Supine Spinal Twist","Putaran Tulang Belakang Telentang","Fleksibilitas","pemula","punggung,pinggul,relaksasi","Telentang, tarik kedua lutut ke dada.|Jatuhkan kedua lutut ke satu sisi, lengan terbuka ke samping, bahu tetap menempel lantai.|Tahan 30 detik sambil bernapas, lalu ganti sisi.","Jangan memaksa lutut sampai menyentuh lantai."],
["","Wrist Flexor Stretch","Peregangan Pergelangan Tangan","Fleksibilitas","pemula","pergelangan,lengan","Luruskan satu lengan ke depan, telapak menghadap atas.|Tarik jari ke bawah dengan tangan lain sampai lengan bawah terasa tertarik.|Tahan 20 detik, 2 kali tiap sisi; ulangi dengan telapak menghadap bawah.",""],
["","Neck Half Circles","Putaran Leher Setengah Lingkaran","Mobilitas","pemula","leher","Duduk tegak, bahu turun, dagu mendekat ke dada.|Geser kepala pelan dari bahu kiri ke bahu kanan membentuk setengah lingkaran.|5 putaran pelan; jangan memutar kepala ke belakang.","Hentikan bila pusing, kesemutan, atau leher cedera."],
["","Arm Circles","Putaran Lengan","Mobilitas","pemula","bahu,lengan","Berdiri, lengan terbuka setinggi bahu.|Buat lingkaran kecil yang membesar pelan.|10 putaran ke depan, lalu 10 ke belakang.",""],
["","Quadruped Thoracic Rotation","Putaran Punggung Atas Merangkak","Mobilitas","pemula","punggung,bahu,dada","Merangkak; letakkan satu tangan di belakang kepala.|Putar siku itu ke bawah ke arah lengan penopang, lalu putar ke atas dan buka dada ke samping.|8-10 ulangan pelan tiap sisi.","Gerakkan dari punggung atas, bukan dari pinggang."],
["","Quadruped Hip Circles","Putaran Pinggul Merangkak","Mobilitas","pemula","pinggul","Merangkak, tangan di bawah bahu dan lutut di bawah pinggul.|Angkat satu lutut ke samping, lalu putar pinggul membentuk lingkaran besar.|8 putaran tiap arah, tiap sisi.",""],
["","90/90 Hip Switch","Ganti Posisi Pinggul 90/90","Mobilitas","menengah","pinggul","Duduk, kedua lutut ditekuk 90 derajat dan jatuh ke satu sisi.|Putar kedua lutut ke sisi lain, pakai tangan seperlunya.|8-10 pergantian.","Duduk di atas bantal bila pinggul atau lutut kaku."],
["","World's Greatest Stretch","Peregangan Dinamis Lengkap","Mobilitas","menengah","pinggul,punggung,kaki,bahu","Dari posisi plank, langkahkan satu kaki ke luar di samping tangan yang sama (lunge rendah).|Putar dada ke arah kaki depan dan angkat lengan ke atas.|Kembali ke plank; 5 ulangan tiap sisi.","Boleh menurunkan lutut belakang ke lantai."],
["","Ankle Rocks","Goyang Pergelangan Kaki ke Dinding","Mobilitas","pemula","pergelangan,kaki","Berdiri menghadap dinding, satu kaki di depan berjarak kira-kira sejengkal.|Dorong lutut maju ke arah dinding tanpa mengangkat tumit.|10 ulangan tiap sisi.",""],
["","Wrist Circles","Putaran Pergelangan Tangan","Mobilitas","pemula","pergelangan,lengan","Kepalkan tangan, lengan di depan badan.|Putar pergelangan membentuk lingkaran besar dan pelan.|10 putaran tiap arah.",""],
["","Wall Angels","Malaikat di Dinding","Mobilitas","menengah","bahu,punggung,dada","Berdiri dengan punggung, kepala, dan bokong menempel dinding; kaki sedikit maju.|Tempelkan lengan seperti huruf W di dinding, lalu geser ke atas menjadi huruf Y tanpa melepas kontak.|8-10 ulangan pelan.","Jangan melengkungkan punggung bawah menjauhi dinding."],
["","Leg Swings","Ayunan Kaki","Mobilitas","pemula","kaki,pinggul,keseimbangan","Berdiri berpegangan dinding.|Ayun satu kaki ke depan dan belakang dengan terkendali, lalu ke samping menyilang badan.|10-12 ayunan tiap arah, tiap kaki.","Mulai dengan ayunan kecil; jaga badan tetap tegak."]
/*Y67R*/,
["","90/90 Hamstring","Paha Belakang 90/90","Fleksibilitas","pemula","kaki","",""],
["","Adductor","Peregangan Paha Dalam","Fleksibilitas","menengah","pinggul","",""],
["","Adductor/Groin","Peregangan Paha Dalam dan Selangkangan","Fleksibilitas","menengah","pinggul","",""],
["","All Fours Quad Stretch","Peregangan Paha Depan Merangkak","Fleksibilitas","menengah","kaki","",""],
["","Ankle Circles","Putaran Pergelangan Kaki","Mobilitas","pemula","kaki","",""],
["","Ankle On The Knee","Pergelangan Kaki di Atas Lutut","Fleksibilitas","pemula","pinggul","",""],
["","Anterior Tibialis-SMR","Foam Roll Tulang Kering Depan","Mobilitas","menengah","kaki","",""],
["","Behind Head Chest Stretch","Peregangan Dada Tangan di Belakang Kepala","Fleksibilitas","mahir","dada,bahu","",""],
["","Brachialis-SMR","Foam Roll Lengan Atas (Brakialis)","Mobilitas","menengah","lengan","",""],
["","Calf Stretch Elbows Against Wall","Peregangan Betis Siku di Dinding","Fleksibilitas","pemula","kaki","",""],
["","Calves-SMR","Foam Roll Betis","Mobilitas","menengah","kaki","",""],
["","Cat Stretch","Peregangan Kucing","Mobilitas","pemula","punggung","",""],
["","Chair Leg Extended Stretch","Peregangan Kaki Lurus di Kursi","Fleksibilitas","pemula","kaki,pinggul","",""],
["","Chair Lower Back Stretch","Peregangan Punggung Bawah di Kursi","Fleksibilitas","pemula","punggung","",""],
["","Chair Upper Body Stretch","Peregangan Tubuh Atas di Kursi","Fleksibilitas","pemula","bahu,lengan,dada","",""],
["","Chest And Front Of Shoulder Stretch","Peregangan Dada dan Bahu Depan","Fleksibilitas","pemula","dada,bahu","",""],
["","Chest Stretch on Stability Ball","Peregangan Dada di Bola Latihan","Fleksibilitas","pemula","dada","",""],
["","Chin To Chest Stretch","Peregangan Dagu ke Dada","Fleksibilitas","pemula","leher,punggung","",""],
["","Crossover Reverse Lunge","Langkah Mundur Menyilang","Mobilitas","menengah","punggung,inti,pinggul,kaki","",""],
["","Dancer's Stretch","Peregangan Penari","Fleksibilitas","pemula","punggung,pinggul","",""],
["","Dynamic Back Stretch","Peregangan Punggung Dinamis","Mobilitas","pemula","punggung","",""],
["","Dynamic Chest Stretch","Peregangan Dada Dinamis","Mobilitas","pemula","dada,punggung","",""],
["","Elbow Circles","Putaran Siku","Mobilitas","pemula","bahu,punggung","",""],
["","Elbows Back","Siku ke Belakang","Fleksibilitas","pemula","dada,bahu","",""],
["","Foot-SMR","Foam Roll Telapak Kaki","Mobilitas","menengah","kaki","",""],
["","Frog Hops","Lompatan Katak","Mobilitas","menengah","kaki,pinggul","",""],
["","Front Leg Raises","Ayunan Kaki ke Depan","Mobilitas","pemula","kaki","",""],
["","Groin and Back Stretch","Peregangan Punggung dan Selangkangan","Fleksibilitas","menengah","pinggul","",""],
["","Groiners","Groiners (Lunge Pinggul Dinamis)","Mobilitas","menengah","pinggul","",""],
["","Hamstring-SMR","Foam Roll Paha Belakang","Mobilitas","pemula","kaki","",""],
["","Hamstring Stretch","Peregangan Paha Belakang Telentang dengan Tali","Fleksibilitas","pemula","kaki","",""],
["","Hip Circles (prone)","Putaran Pinggul Telungkup","Mobilitas","pemula","pinggul","",""],
["","Hug A Ball","Peluk Bola","Fleksibilitas","pemula","punggung,kaki,pinggul","",""],
["","Hug Knees To Chest","Peluk Lutut ke Dada","Fleksibilitas","pemula","punggung,pinggul","",""],
["","IT Band and Glute Stretch","Peregangan Pita IT dan Bokong","Fleksibilitas","menengah","pinggul","",""],
["","Iliotibial Tract-SMR","Foam Roll Pita IT (Paha Luar)","Mobilitas","menengah","pinggul","",""],
["","Inchworm","Inchworm (Jalan Ulat)","Mobilitas","pemula","kaki","",""],
["","Intermediate Groin Stretch","Peregangan Selangkangan Menengah","Fleksibilitas","menengah","kaki","",""],
["","Intermediate Hip Flexor and Quad Stretch","Peregangan Fleksor Pinggul dan Paha Depan Menengah","Fleksibilitas","menengah","kaki","",""],
["","Iron Crosses (stretch)","Iron Cross (Putaran Kaki Telentang)","Mobilitas","menengah","kaki","",""],
["","Knee Across The Body","Lutut Menyilang Badan","Fleksibilitas","pemula","pinggul,punggung","",""],
["","Knee Circles","Putaran Lutut","Mobilitas","pemula","kaki","",""],
["","Kneeling Forearm Stretch","Peregangan Lengan Bawah Berlutut","Fleksibilitas","pemula","lengan,pergelangan","",""],
["","Latissimus Dorsi-SMR","Foam Roll Lat (Punggung Samping)","Mobilitas","pemula","punggung","",""],
["","Leg-Up Hamstring Stretch","Peregangan Paha Belakang Kaki Terangkat","Fleksibilitas","pemula","kaki","",""],
["","Looking At Ceiling","Menatap Langit-langit","Fleksibilitas","pemula","kaki","",""],
["","Lower Back-SMR","Foam Roll Punggung Bawah","Mobilitas","pemula","punggung","",""],
["","Lower Back Curl","Lengkung Punggung Bawah","Mobilitas","pemula","inti","",""],
["","Lying Bent Leg Groin","Peregangan Selangkangan Berbaring Kaki Menekuk","Fleksibilitas","mahir","pinggul","",""],
["","Lying Crossover","Berbaring Kaki Menyilang","Fleksibilitas","mahir","pinggul","",""],
["","Lying Glute","Peregangan Bokong Berbaring","Fleksibilitas","mahir","pinggul","",""],
["","Lying Hamstring","Peregangan Paha Belakang Berbaring","Fleksibilitas","mahir","kaki","",""],
["","Lying Prone Quadriceps","Peregangan Paha Depan Telungkup","Fleksibilitas","mahir","kaki","",""],
["","Middle Back Stretch","Peregangan Punggung Tengah","Fleksibilitas","pemula","punggung,inti","",""],
["","Neck-SMR","Foam Roll Leher","Mobilitas","menengah","leher","",""],
["","On-Your-Back Quad Stretch","Peregangan Paha Depan Telentang","Fleksibilitas","pemula","kaki","",""],
["","On Your Side Quad Stretch","Peregangan Paha Depan Berbaring Miring","Fleksibilitas","pemula","kaki","",""],
["","One Arm Against Wall","Satu Lengan di Dinding","Fleksibilitas","pemula","punggung","",""],
["","One Half Locust","Belalang Separuh","Fleksibilitas","pemula","kaki,inti,lengan,dada","",""],
["","One Handed Hang","Menggantung Satu Tangan","Fleksibilitas","pemula","punggung,lengan","",""],
["","One Knee To Chest","Satu Lutut ke Dada","Fleksibilitas","pemula","pinggul,kaki,punggung","",""],
["","Overhead Lat","Peregangan Lat di Atas Kepala","Fleksibilitas","mahir","punggung,lengan","",""],
["","Overhead Stretch","Peregangan di Atas Kepala","Fleksibilitas","pemula","inti,dada,lengan,pergelangan,punggung","",""],
["","Overhead Triceps","Peregangan Triseps di Atas Kepala","Fleksibilitas","mahir","lengan,punggung","",""],
["","Pelvic Tilt Into Bridge","Kemiringan Panggul ke Jembatan","Mobilitas","menengah","punggung","",""],
["","Peroneals-SMR","Foam Roll Betis Luar (Peroneus)","Mobilitas","menengah","kaki","",""],
["","Peroneals Stretch","Peregangan Otot Peroneus","Fleksibilitas","menengah","kaki","",""],
["","Piriformis-SMR","Foam Roll Piriformis (Bokong Dalam)","Mobilitas","menengah","pinggul","",""],
["","Posterior Tibialis Stretch","Peregangan Tibialis Posterior","Fleksibilitas","menengah","kaki","",""],
["","Quad Stretch","Peregangan Paha Depan dengan Tali","Fleksibilitas","menengah","kaki","",""],
["","Quadriceps-SMR","Foam Roll Paha Depan","Mobilitas","menengah","kaki","",""],
["","Rear Leg Raises","Ayunan Kaki ke Belakang","Mobilitas","pemula","kaki","",""],
["","Rhomboids-SMR","Foam Roll Antara Tulang Belikat (Rhomboid)","Mobilitas","menengah","punggung","",""],
["","Round The World Shoulder Stretch","Peregangan Bahu Keliling Dunia","Mobilitas","pemula","bahu,lengan,dada","",""],
["","Runner's Stretch","Peregangan Pelari","Fleksibilitas","pemula","kaki","",""],
["","Scissor Kick","Tendangan Gunting","Mobilitas","pemula","inti","",""],
["","Seated Biceps","Peregangan Biseps Duduk","Fleksibilitas","mahir","lengan,dada,bahu","",""],
["","Seated Calf Stretch","Peregangan Betis Duduk","Fleksibilitas","pemula","kaki,punggung","",""],
["","Seated Front Deltoid","Peregangan Bahu Depan Duduk","Fleksibilitas","mahir","bahu,dada","",""],
["","Seated Glute","Peregangan Bokong Duduk","Fleksibilitas","mahir","pinggul","",""],
["","Seated Hamstring","Peregangan Paha Belakang Duduk (versi lain)","Fleksibilitas","mahir","kaki","",""],
["","Seated Hamstring and Calf Stretch","Peregangan Paha Belakang dan Betis Duduk","Fleksibilitas","menengah","kaki","",""],
["","Seated Overhead Stretch","Peregangan di Atas Kepala Duduk","Fleksibilitas","pemula","inti","",""],
["","Shoulder Circles","Putaran Bahu","Mobilitas","pemula","bahu,punggung","",""],
["","Shoulder Raise","Angkat Bahu","Mobilitas","pemula","bahu,punggung","",""],
["","Side-Lying Floor Stretch","Peregangan Berbaring Miring di Lantai","Fleksibilitas","pemula","punggung","",""],
["","Side Leg Raises","Angkat Kaki ke Samping","Mobilitas","pemula","pinggul","",""],
["","Side Lying Groin Stretch","Peregangan Selangkangan Berbaring Miring","Fleksibilitas","pemula","pinggul,kaki","",""],
["","Side Wrist Pull","Tarik Pergelangan ke Samping","Fleksibilitas","pemula","bahu,lengan,pergelangan,punggung","",""],
["","Sit Squats","Jongkok Duduk","Mobilitas","pemula","kaki,pinggul","",""],
["","Spinal Stretch","Peregangan Tulang Belakang","Fleksibilitas","pemula","punggung,leher","",""],
["","Split Squats","Split Squat","Mobilitas","menengah","kaki,pinggul","",""],
["","Standing Biceps Stretch","Peregangan Biseps Berdiri","Fleksibilitas","pemula","lengan,dada,bahu","",""],
["","Standing Elevated Quad Stretch","Peregangan Paha Depan Berdiri dengan Pijakan","Fleksibilitas","pemula","kaki","",""],
["","Standing Gastrocnemius Calf Stretch","Peregangan Betis (Gastrocnemius) Berdiri","Fleksibilitas","pemula","kaki","",""],
["","Standing Hamstring and Calf Stretch","Peregangan Paha Belakang dan Betis Berdiri","Fleksibilitas","pemula","kaki","",""],
["","Standing Hip Circles","Putaran Pinggul Berdiri","Mobilitas","pemula","pinggul","",""],
["","Standing Hip Flexors","Peregangan Fleksor Pinggul Berdiri","Fleksibilitas","pemula","kaki","",""],
["","Standing Lateral Stretch","Peregangan Samping Berdiri","Fleksibilitas","pemula","inti","",""],
["","Standing Pelvic Tilt","Kemiringan Panggul Berdiri","Mobilitas","pemula","punggung,pinggul","",""],
["","Standing Soleus And Achilles Stretch","Peregangan Soleus dan Achilles Berdiri","Fleksibilitas","pemula","kaki","",""],
["","Standing Toe Touches","Sentuh Jari Kaki Berdiri","Fleksibilitas","pemula","kaki","",""],
["","Stomach Vacuum","Stomach Vacuum (Tarik Perut)","Fleksibilitas","pemula","inti","",""],
["","Superman","Superman (Telungkup)","Mobilitas","pemula","punggung,pinggul,kaki","",""],
["","The Straddle","Straddle (Kaki Terbuka Lebar)","Fleksibilitas","pemula","kaki,pinggul","",""],
["","Toe Touchers","Sentuh Jari Kaki","Mobilitas","pemula","inti","",""],
["","Torso Rotation","Putaran Badan","Mobilitas","pemula","inti","",""],
["","Tricep Side Stretch","Peregangan Triseps Samping","Fleksibilitas","pemula","lengan,bahu","",""],
["","Triceps Stretch","Peregangan Triseps","Fleksibilitas","pemula","lengan,punggung","",""],
["","Upper Back-Leg Grab","Peregangan Punggung Atas Pegang Kaki","Fleksibilitas","pemula","kaki,punggung","",""],
["","Upper Back Stretch","Peregangan Punggung Atas","Fleksibilitas","pemula","punggung","",""],
["","Upward Stretch","Peregangan ke Atas","Fleksibilitas","pemula","bahu,dada,punggung","",""],
["","Windmills","Windmill (Putaran Badan)","Mobilitas","menengah","pinggul,kaki,punggung","",""]/*Y67E*/
].map((a, i) => { const x = YOGA_EXT[a[0]] || {}, l = YOGA_LP[a[0]] || YOGA_FX[a[1]] || {}, f = YOGA_FX[a[1]] || {}; return { id: i, sa: a[0], en: a[1], idn: a[2], cat: a[3], lv: a[4], tg: a[5].split(','), st: a[6].split('|').filter(Boolean), ct: a[7], img: '', im: x.im || [], bn: x.bn || '', ds: x.ds || '', pr: l.pr || [], tgd: l.tg || [], cx: l.cx || [], bl: l.bn || [], vd: YOGA_VD[a[0]] || '', fi: f.fi || [], ty: a[3] === 'Fleksibilitas' ? 'flex' : a[3] === 'Mobilitas' ? 'mob' : 'yoga' }; });
const YG_T = { kaki: 'Kaki', pinggul: 'Pinggul', punggung: 'Punggung', inti: 'Inti', bahu: 'Bahu', dada: 'Dada', lengan: 'Lengan', keseimbangan: 'Keseimbangan', relaksasi: 'Relaksasi', leher: 'Leher', pergelangan: 'Pergelangan' };
const YG_C = { yoga: 'Pose yoga', flex: 'Fleksibilitas', mob: 'Mobilitas' };
const YG_L = { pemula: 'Pemula', menengah: 'Menengah', mahir: 'Mahir' };
const YG_PAGE = 12, YG_SEG = { '': 'Semua', yoga: 'Yoga', flex: 'Fleksibel', mob: 'Mobilitas' };
let yogaF = { q: '', t: '', l: '', c: '', o: null, p: 1, fo: false, d: {} };
function ygChips(map, key, act) { return '<div class="yg-c">' + Object.keys(map).map(k => '<button type="button" data-q="' + act + '" data-v="' + k + '" aria-pressed="' + (yogaF[key] === k) + '">' + map[k] + '</button>').join('') + '</div>'; }
function yogaFiltered() { const q = yogaF.q.trim().toLowerCase(); return YOGA.filter(p => (!yogaF.t || p.tg.indexOf(yogaF.t) >= 0) && (!yogaF.l || p.lv === yogaF.l) && (!yogaF.c || p.ty === yogaF.c) && (!q || (p.sa + ' ' + p.en + ' ' + p.idn).toLowerCase().indexOf(q) >= 0)); }
function yogaListHTML() {
  const L = yogaFiltered(); if (!L.length) return '<p style="color:var(--mute)">Tidak ada pose yang cocok.</p>';
  const pc = Math.ceil(L.length / YG_PAGE); yogaF.p = Math.min(pc, Math.max(1, yogaF.p)); const s0 = (yogaF.p - 1) * YG_PAGE;   // v71a: per halaman
  return L.slice(s0, s0 + YG_PAGE).map(p => '<button type="button" class="yg-i" data-q="yogaO" data-v="' + p.id + '"><span class="yg-t"><b>' + esc(p.idn) + '</b><small>' + (p.sa ? esc(p.sa) + ' · ' : '') + esc(YG_L[p.lv]) + ' · ' + esc(p.tg.map(t => YG_T[t]).join(', ')) + '</small></span></button>').join('') +
    (pc > 1 ? '<nav class="yg-pg" aria-label="Halaman pose"><span class="yg-pgl" aria-live="polite">Halaman ' + yogaF.p + ' dari ' + pc + '</span><div class="yg-pgr"><button type="button" data-q="yogaPg" data-v="prev"' + (yogaF.p <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button><input class="yg-pgi" id="yogaPgI" type="number" inputmode="numeric" enterkeyhint="go" min="1" max="' + pc + '" value="' + yogaF.p + '" aria-label="Lompat ke halaman, 1 sampai ' + pc + '"><button type="button" data-q="yogaPg" data-v="next"' + (yogaF.p >= pc ? ' disabled' : '') + '>Berikutnya ›</button></div></nav>' : '');
}
const ygCt = () => yogaFiltered().length + ' latihan';
function yogaHTML() {
  const p = yogaF.o != null ? YOGA[yogaF.o] : null;
  if (!p) {
    const act = (yogaF.t ? 1 : 0) + (yogaF.l ? 1 : 0);
    return '<section class="sec yg"><div class="yg-h"><h2>Yoga</h2><span class="yg-ct" id="yogaCt">' + ygCt() + '</span></div><input class="yg-q" id="yogaQ" type="search" placeholder="Cari pose" aria-label="Cari pose yoga" value="' + esc(yogaF.q) + '">' +
      '<div class="yg-seg" role="group" aria-label="Jenis">' + Object.keys(YG_SEG).map(k => '<button type="button" data-q="yogaC" data-v="' + k + '" aria-pressed="' + (yogaF.c === k) + '">' + YG_SEG[k] + '</button>').join('') + '</div>' +
      '<button type="button" class="yg-fb" data-q="yogaFo" aria-expanded="' + yogaF.fo + '">Filter' + (act ? '<span class="yg-bd">' + act + '</span>' : '') + '<span aria-hidden="true">' + (yogaF.fo ? '▴' : '▾') + '</span></button>' +
      (yogaF.fo ? '<div class="yg-fp"><small>Bagian tubuh</small>' + ygChips(YG_T, 't', 'yogaT') + '<small>Tingkat</small>' + ygChips(YG_L, 'l', 'yogaL') + '</div>' : '') + '<div id="yogaList">' + yogaListHTML() + '</div></section>';
  }
  const yk = ygKey(p); if (!ytS || ytS.id !== yk) ytBegin(yk, p.en + (p.ty === 'yoga' ? ' yoga' : ''), 'ytHostY');
  const nm = encodeURIComponent(p.en + (p.ty === 'yoga' ? ' yoga' : ''));
  const sec = (k, t, body, def) => body ? '<details data-yd="' + k + '"' + ((yogaF.d[k] === undefined ? def : yogaF.d[k]) ? ' open' : '') + '><summary>' + t + '</summary><div class="yg-db">' + body + '</div></details>' : '';
  const tags = [p.cat, YG_L[p.lv]].concat(p.tg.map(t => YG_T[t])).filter(Boolean);
  return '<section class="sec yg"><button type="button" class="yg-a" data-q="yogaX">‹ Semua pose</button><h2>' + esc(p.idn) + '</h2><p style="color:var(--mute)">' + (p.sa ? esc(p.sa) + ' · ' : '') + esc(p.en) + '</p>' +
    '<div class="yg-tags">' + tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' + (p.tgd.length ? '<p class="yg-n">Area: ' + esc(p.tgd.join(', ')) + '</p>' : '') +
    sec('cara', 'Cara melakukan', ygSteps(p) + (p.ct ? '<p><b>Perhatikan.</b> ' + esc(p.ct) + '</p>' : ''), true) +
    sec('foto', 'Foto', ygImgs(p), true) + sec('video', 'Video', ygVid(p) + ygYt(), false) + sec('manfaat', 'Manfaat', ygBn(p), false) + sec('hati', 'Hati-hati', ygCx(p), false) +
    '<p class="yg-lk"><a class="yg-a" href="https://www.google.com/search?tbm=isch&q=' + nm + '" target="_blank" rel="noopener">Cari foto</a><a class="yg-a" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(p.en + (p.ty === 'yoga' ? ' yoga' : '') + ' tutorial') + '" target="_blank" rel="noopener">Buka di YouTube</a></p>' +
    (p.im.length ? '<p class="yg-n">Data dan gambar: rebeccaestes/yoga_api, untuk pemakaian pribadi.</p>' : '') + (p.fi.length ? '<p class="yg-n">Foto dan langkah: yuhonas/free-exercise-db (domain publik). Dua foto = posisi awal dan akhir.</p>' : '') + '</section>';
}
document.addEventListener('input', ev => { if (ev.target && ev.target.id === 'yogaQ') { yogaF.q = ev.target.value; yogaF.p = 1; const l = $('#yogaList'), c = $('#yogaCt'); if (l) l.innerHTML = yogaListHTML(); if (c) c.textContent = ygCt(); } });
document.addEventListener('toggle', ev => { const d = ev.target; if (d && d.dataset && d.dataset.yd) yogaF.d[d.dataset.yd] = d.open; }, true);   // status buka-tutup bagian detail bertahan saat halaman digambar ulang
QACT.yogaT = el => { yogaF.t = yogaF.t === el.dataset.v ? '' : el.dataset.v; yogaF.p = 1; renderTrain(); };
QACT.yogaC = el => { yogaF.c = yogaF.c === el.dataset.v ? '' : el.dataset.v; yogaF.p = 1; renderTrain(); };
QACT.yogaL = el => { yogaF.l = yogaF.l === el.dataset.v ? '' : el.dataset.v; yogaF.p = 1; renderTrain(); };
QACT.yogaFo = () => { yogaF.fo = !yogaF.fo; renderTrain(); };
function ygGo(n) { const pc = Math.max(1, Math.ceil(yogaFiltered().length / YG_PAGE)); if (isFinite(n)) yogaF.p = Math.min(pc, Math.max(1, Math.round(n)));
  const l = $('#yogaList'); if (!l) return; l.innerHTML = yogaListHTML(); window.scrollTo(0, Math.max(0, l.getBoundingClientRect().top + window.scrollY - 76)); }   // v71b
QACT.yogaPg = el => ygGo(yogaF.p + (el.dataset.v === 'next' ? 1 : -1));
document.addEventListener('change', ev => { if (ev.target && ev.target.id === 'yogaPgI') ygGo(parseInt(ev.target.value, 10)); });   // v71b: kolom angka = lompat ke halaman
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.id === 'yogaPgI') { ev.preventDefault(); ev.target.blur(); } });
QACT.yogaO = el => { yogaF.o = +el.dataset.v; renderTrain(); window.scrollTo(0, 0); };
QACT.yogaX = () => { yogaF.o = null; renderTrain(); };
QACT.ygPlay = el => { const id = el.dataset.v; if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !el.parentNode) return; el.parentNode.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="Video yoga" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'; };
function renderTrain() {
  if (ytS && ytS.hid === 'ytHostY' && !(trainTab === 'yoga' && yogaF.o != null)) ytEnd();   // v68b: keluar dari detail Yoga = bongkar pemutar
  const tab = (v, l) => '<button data-q="trTab" data-v="' + v + '" aria-current="' + (trainTab === v ? 'page' : 'false') + '">' + l + '</button>';
  $('#trainBody').innerHTML = '<div class="subnav">' + tab('kal', 'Kalistenik') + tab('bike', 'Sepeda') + tab('yoga', 'Yoga') + '</div>' + skHTML() + (trainTab === 'yoga' ? yogaHTML() : trainTab === 'bike' ? bikeHTML() : '<div class="kz' + (b16Tab === 'ses' ? ' kz-ses' : '') + '">' + b16KalHTML() + '</div>');
  if (trainTab === 'bike') { rfHint(); b61After(); } else if (trainTab !== 'yoga') kzAfter();
}
RENDER.train = renderTrain;

/* --- aksi --- */
document.addEventListener('input', ev => {
  const el = ev.target, f = el.dataset && el.dataset.rf;
  if (!f) return;
  if (f !== 'note') { const c = el.value.replace(/[^0-9.,]/g, ''); if (c !== el.value) el.value = c; }
  rideForm[f] = el.value;
  if (f === 'min' || f === 'km' || f === 'spd') rfHint();
});
function rfCalc() { const km = num(rideForm.km), mn = num(rideForm.min); return km != null && mn ? km / (mn / 60) : null; }
function rfHint() { const el = $('#rfHint'), c = rfCalc(); if (el) el.textContent = (num(rideForm.spd) == null && c != null) ? 'Rata-rata dihitung: ' + fmt(c, 1) + ' km/jam' : ''; }
QACT.trTab = el => { if (el.dataset.v === 'kal' && trainTab !== 'kal') kzFresh(); trainTab = el.dataset.v; renderTrain(); window.scrollTo(0, 0); };   // v24k1c
QACT.openTrain = el => { trainTab = el.dataset.t === 'bike' ? 'bike' : 'kal'; if (el.dataset.b && BT[el.dataset.b]) bkType = el.dataset.b; showView('train'); };
QACT.bkType = el => { bkType = el.dataset.v; renderTrain(); };
QACT.bkMin = el => { const t = curBk(), bt = BT[t]; bkM[t] = Math.max(bt.min, Math.min(bt.max, curMins(t) + (+el.dataset.v))); renderTrain(); };
QACT.bkStart = () => bkStart();
QACT.bkPause = () => {
  const r = BK.run; if (!r) return;
  if (r.ra) { r.eb += Date.now() - r.ra; r.ra = 0; } else r.ra = Date.now();
  renderTrain(); bkTick();
};
QACT.bkSkip = () => {
  const r = BK.run; if (!r) return;
  const nx = r.i + 1;
  if (nx >= r.steps.length) { bkFinish(r.total, true); return; }
  r.eb = r.cum[nx] * 1000; if (r.ra) r.ra = Date.now();
  bkTick();
};
QACT.bkEnd = () => { if (BK.run) bkFinish(Math.round(bkElapsed() / 1000), false); };
QACT.rfType = el => { rideForm.type = el.dataset.v; renderTrain(); };
QACT.rfRpe = el => { const v = +el.dataset.v; rideForm.rpe = rideForm.rpe === v ? null : v; renderTrain(); };
QACT.rfKr = el => { const v = +el.dataset.v; rideForm.kr = rideForm.kr === v ? null : v; renderTrain(); };   // q5a
QACT.rfLt = el => { const v = +el.dataset.v; rideForm.lt = rideForm.lt === v ? null : v; renderTrain(); };   // q5a
QACT.talk = el => { talkRes = +el.dataset.v; renderTrain(); };
QACT.rfSave = () => {
  const f = rideForm, mn = num(f.min), km = num(f.km);
  if (mn == null && km == null) { toast('Isi durasi atau jarak dulu'); return; }
  let spd = num(f.spd);
  if (spd == null && km != null && mn) spd = Math.round(km / (mn / 60) * 10) / 10;
  let d = today(), ex = null;
  if (svSt.info) {
    ex = svExtras(svSt.info);
    if (ex.err) { toast(ex.err); return; }
    d = ex.date;
    const dup = svDup(ex.key);
    if (dup) { toast('Ride dari foto ini sudah tercatat pada ' + dayShort(dup) + '. Hapus yang lama dulu bila ingin menggantinya.'); return; }
  }
  const mx = {};   // q1: isian manual HR rata-rata, HR maksimum, naik (m); ride dari foto Strava memakai isian pratinjaunya sendiri
  if (!ex) {
    for (const [k, lo, hi, lbl] of [['hr', 30, 250, 'HR rata-rata'], ['hx', 30, 250, 'HR maksimum'], ['el', 0, 20000, 'Naik']]) {
      const raw = String(f[k] == null ? '' : f[k]).trim();
      if (!raw) continue;
      const v = num(raw);
      if (v == null || v < lo || v > hi) { toast(lbl + ' harus berupa angka antara ' + lo + ' dan ' + hi + ', atau kosongkan.'); return; }
      mx[k] = Math.round(v);
    }
    if (mx.hr != null && mx.hx != null && mx.hx < mx.hr) { toast('HR maksimum tidak boleh lebih kecil dari HR rata-rata.'); return; }
  }
  const kd = {};   // q5a: kram, air, elektrolit (opsional; berlaku untuk isian manual dan ride dari foto Strava)
  if (f.kr === 0 || f.kr === 1 || f.kr === 2 || f.kr === 3) kd.kr = f.kr;
  if (f.lt === 0 || f.lt === 1) kd.lt = f.lt;
  const mlRaw = String(f.ml == null ? '' : f.ml).trim();
  if (mlRaw) {
    if (!/^\d{1,5}$/.test(mlRaw) || +mlRaw > 10000) { toast('Air yang diminum harus bilangan bulat antara 0 dan 10000 ml (tanpa titik atau koma), atau kosongkan.'); return; }
    kd.ml = +mlRaw;
  }
  const k55 = bk55Cols(); if (k55.err) { toast(k55.err); return; }
  const t = tdb[d] || (tdb[d] = tblank());
  const rd = { id: 'r' + Date.now().toString(36), type: f.type || curBk(), min: mn, km, spd, rpe: f.rpe, note: f.note.trim().slice(0, 200), t: Date.now() };
  Object.assign(rd, mx);
  Object.assign(rd, kd);
  Object.assign(rd, k55.o);
  if (ex) Object.assign(rd, ex.cols);
  if (!ex && RT61 && RT61.keep && RT61.km === f.km) rd.rt = RT61.s;   // tahap 61a
  RT61 = null;
  t.rides.push(rd);
  t.updated = Date.now(); queueSave('t');
  syncSesi(d, 'sepeda', f.rpe);
  rideForm.min = ''; rideForm.km = ''; rideForm.spd = ''; rideForm.rpe = null; rideForm.note = ''; rideForm.hr = ''; rideForm.hx = ''; rideForm.el = ''; rideForm.kr = null; rideForm.ml = ''; rideForm.lt = null; rideForm.cd = ''; rideForm.cb = ''; svReset();
  toast((d === today() ? 'Ride tersimpan dan masuk ke Jurnal' : 'Ride tersimpan pada ' + dayShort(d) + ' dan masuk ke Jurnal') + (rd.rt ? ', dengan rute' : '')); renderTrain();
};
QACT.rideDel = el => {
  const id = el.dataset.id, d = el.dataset.d;
  if (delArm !== id) {
    delArm = id; renderTrain();
    setTimeout(() => { if (delArm === id) { delArm = null; if (curView === 'train') renderTrain(); } }, 3500);
    return;
  }
  delArm = null;
  if (tdb[d]) { tdb[d].rides = tdb[d].rides.filter(r => r.id !== id); tdb[d].updated = Date.now(); queueSave('t'); }
  toast('Ride dihapus. Tanda Sepeda di Jurnal tidak diubah.'); renderTrain();
};

