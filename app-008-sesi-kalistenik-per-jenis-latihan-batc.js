/* ===== MODUL: SESI KALISTENIK PER JENIS LATIHAN (batch 17-S) ===== */
// Permintaan pemilik (14 Okt 2026): memilih PPL di "jenis latihan" juga mengganti set/gerakan kalistenik hari itu di tab Sesi.
// Pilihan jenis latihan = pdb.split ('' = Bawaan = program Fase seperti sebelumnya; ppl | ul | fb), satu pilihan bersama untuk tab Sesi dan tab Pustaka.
// Hari dalam jenis latihan (mis. Push / Pull / Legs + Core): giliran otomatis dari riwayat (hari berikutnya sesudah sesi terakhir yang mencatat set pada jenis yang sama), bisa diganti manual (memori saja).
// Isi hari disusun LOKAL dari Pustaka (B18_MV) dan LEVEL di Tangga progresi: gerakan utama = gerakan pada levelmu, lalu variasi satu level lebih ringan, lalu gerakan pendukung.
// Hanya "Di rumah" (beban badan): Pustaka tidak punya varian gym. Isi preskripsi (set, reps, detik, istirahat) = pengetahuan umum kebugaran, BELUM ditinjau pelatih.
// Data sesi: kolom opsional kal.sp (jenis), kal.sd (indeks hari), kal.sl (salinan level tangga saat susunan hari dibuat; menjaga susunan tetap sama sepanjang hari) ditulis HANYA di setState.
// Membuka layar, memilih jenis latihan (kecuali menyimpan pdb.split lewat setP) dan memilih hari TIDAK menulis data sesi. Level tangga TIDAK pernah diubah di sini.
const B19_RX = {   // id pustaka -> preskripsi dasar (r = rentang reps, sec = rentang detik, per = "per kaki/sisi", rest = detik istirahat; bawaan 90)
  knee_pushup: { r: [8, 12] }, pushup: { r: [8, 12] }, decline_pushup: { r: [8, 12] }, dips: { r: [8, 12] }, diamond_pushup: { r: [6, 10] }, pike_pushup: { r: [8, 10] }, archer_pushup: { r: [5, 8], per: 'sisi' },
  doorway_pull: { r: [8, 12] }, scapular_pull: { r: [8, 12] }, inverted_row: { r: [8, 12] }, assisted_pullup: { r: [6, 10] }, pullup: { r: [5, 8] }, chinup: { r: [5, 8] }, lsit_pullup: { r: [3, 6] },
  bw_squat: { r: [15, 20], rest: 60 }, glute_bridge: { r: [12, 15], rest: 60 }, reverse_lunge: { r: [10, 12], per: 'kaki', rest: 60 }, bulgarian: { r: [10, 12], per: 'kaki' }, calf_raise: { r: [15, 20], rest: 60 },
  sl_rdl: { r: [10, 12], per: 'kaki' }, sl_hipthrust: { r: [10, 12], per: 'kaki' }, pistol: { r: [3, 6], per: 'kaki' }, shrimp: { r: [3, 6], per: 'kaki' },
  plank: { sec: [45, 60], rest: 60 }, dead_bug: { r: [10, 12], per: 'sisi', rest: 60 }, leg_raise: { r: [10, 15], rest: 60 }, side_plank: { sec: [30, 45], per: 'sisi', rest: 60 }, bird_dog: { r: [8, 10], per: 'sisi', rest: 60 },
  copenhagen: { sec: [30, 30], per: 'sisi', rest: 60 }, hollow: { sec: [20, 30], rest: 60 }, dragon_flag: { r: [3, 5] }
};
const B19_ACC = {   // gerakan pendukung per pola: [id pustaka, level minimum pada tangga pola itu]
  push: [['diamond_pushup', 2], ['pike_pushup', 2]],
  pull: [['scapular_pull', 2], ['chinup', 4]],
  legs: [['glute_bridge', 1], ['reverse_lunge', 1], ['calf_raise', 1], ['sl_hipthrust', 3]],
  core: [['side_plank', 1], ['bird_dog', 1]]
};
let b19Sd = null;   // hari manual { d: tanggal, sp: jenis, v: indeks }; hanya memori; null = giliran otomatis
const b19Days = id => { const sp = B18_SPLITS.find(s => s.id === id); return sp ? sp.days : null; };
const b19Short = d => d.t.replace(/^(Hari|Sesi) /, '');
function b19Active() { return pdb.split && b19Days(pdb.split) && pdb.opt !== 'gym' ? pdb.split : ''; }
function b19Today() { const t = tdb[today()]; return t && t.kal ? t.kal : null; }
function b19AutoDay(id) {
  const n = b19Days(id).length, t = today(), cur = b19Today();
  if (cur && cur.sp === id && Number.isInteger(cur.sd) && cur.sd >= 0 && cur.sd < n) return cur.sd;
  let best = null;
  Object.keys(tdb).forEach(d => {
    if (!DATE_RE.test(d) || d >= t) return;
    const k = tdb[d] && tdb[d].kal;
    if (!k || k.sp !== id || !Number.isInteger(k.sd)) return;
    if (!Object.keys(k.ex || {}).some(x => (k.ex[x].s || []).some(y => y && y.d))) return;
    if (!best || d > best.d) best = { d, sd: k.sd };
  });
  return best && best.sd >= 0 && best.sd < n ? (best.sd + 1) % n : 0;
}
function b19Day(id) {
  const n = b19Days(id).length, o = b19Sd;
  if (o && o.d === today() && o.sp === id && Number.isInteger(o.v) && o.v >= 0 && o.v < n) return o.v;
  return b19AutoDay(id);
}
const b19Lv = (p, id) => { const k = b19Today(); return k && k.sp === id && k.sl && k.sl[p] ? k.sl[p] : (pdb.ladder[p] || 1); };
function b19Pick(p, n, id) {   // gerakan untuk satu pola: utama (level sekarang) -> variasi satu level lebih ringan -> pendukung
  const lv = b19Lv(p, id), same = B18_MV.filter(m => m.L && m.L[0] === p && m.L[1] === lv);
  if (!same.length) return [];
  const out = [{ m: same[0], role: 'main', alt: same.slice(1), lv }], used = {};
  used[same[0].id] = 1;
  const add = (m, role) => { if (m && !used[m.id] && out.length < n) { used[m.id] = 1; out.push({ m, role }); } };
  if (lv >= 2) add(B18_MV.find(m => m.L && m.L[0] === p && m.L[1] === lv - 1), 'below');
  (B19_ACC[p] || []).forEach(a => { if (lv >= a[1]) add(b18Mv(a[0]), 'acc'); });
  return out;
}
function b19Ex(x, p, prog, fill) {
  const m = x.m, rx = B19_RX[m.id] || { r: [8, 12] };
  const e = { id: 's_' + m.id, n: m.n, sets: x.role === 'main' ? ([3, 4, 3][prog - 1] || 3) : 3, rest: rx.rest || 90 };
  if (rx.sec) e.sec = rx.sec.slice(); else e.r = rx.r.slice();
  if (rx.per) e.per = rx.per;
  e.v = x.role === 'main' ? (fill ? 'Penutup core: gerakan levelmu sekarang' : 'Gerakan levelmu sekarang') + (x.alt && x.alt.length ? '. Alternatif di level ini: ' + x.alt.map(a => a.n).join(', ') : '')
    : x.role === 'below' ? 'Variasi satu level lebih ringan' : fill ? 'Penutup core: gerakan pendukung' : 'Gerakan pendukung';
  if (x.role === 'main' && x.lv === (pdb.ladder[p] || 1)) e.pat = p;   // saran "siap naik level" hanya bila level sesi = level sekarang
  return e;
}
function b19Build(id, di) {
  const days = b19Days(id), day = days && days[di]; if (!day) return [];
  const prog = curProg(), n = day.pats.length === 2 ? 2 : day.pats.length === 1 ? 4 : 1, out = [];
  day.pats.forEach(p => b19Pick(p, n, id).forEach(x => out.push(b19Ex(x, p, prog))));
  // hari tanpa core yang berisi kurang dari 4 gerakan (variasi di levelmu masih sedikit): core ditaruh di akhir hari (maks. 2), sesuai keterangan Pustaka
  if (out.length < 4 && day.pats.indexOf('core') < 0) b19Pick('core', Math.min(2, 4 - out.length), id).forEach(x => out.push(b19Ex(x, 'core', prog, true)));
  return out;
}
function b19Plan() { const id = b19Active(); return id ? b19Build(id, b19Day(id)) : null; }
function b19Stamp(k) {   // dipanggil setState: catat jenis, hari, dan level susunan
  const id = b19Active();
  if (!id) { delete k.sp; delete k.sd; delete k.sl; return; }
  if (k.sp !== id || !k.sl) k.sl = Object.assign({}, pdb.ladder);
  k.sp = id; k.sd = b19Day(id);
}
function b19Tag(k) {
  const sp = B18_SPLITS.find(s => s.id === k.sp);
  if (!sp) return 'Fase ' + (k.ph >= 3 ? '3–4' : k.ph);
  const d = Number.isInteger(k.sd) && sp.days[k.sd] ? b19Short(sp.days[k.sd]) : '';
  return sp.n + (d && sp.days.length > 1 ? ' · ' + d : '');
}
B18_MV.forEach(m => {   // daftarkan gerakan sesi ke CSV/audit (EXN, EXU) dan PR per level (B16_PAT)
  const id = 's_' + m.id; EXN[id] = m.n; EXU[id] = B19_RX[m.id] && B19_RX[m.id].sec ? 'detik' : 'reps';
  if (m.L) B16_PAT[id] = m.L[0];
});

/* --- tampilan --- */
function b19Ctl() {
  const sp = pdb.split || '', act = b19Active();
  const pill = (v, l, on) => '<button class="pill" data-q="b19Split" data-v="' + v + '" aria-pressed="' + on + '">' + l + '</button>';
  let h = '<div class="f b19ctl"><div class="lbl">Jenis latihan <small>mengganti set dan gerakan hari ini</small></div>' +
    '<div class="b19seg" role="group" aria-label="Jenis latihan">' + pill('', 'Bawaan', !act && !sp) + B18_SPLITS.map(s => pill(s.id, esc(s.n), sp === s.id)).join('') + '</div>';
  if (sp && !act) h += '<p class="note">Jenis latihan memakai gerakan kalistenik (beban badan). Pilih "Di rumah" pada Tempat latihan untuk memakainya; sekarang program gym yang tampil.</p>';
  if (act) {
    const days = b19Days(act), di = b19Day(act), plan = b19Build(act, di);
    if (days.length > 1) h += '<div class="sublbl">Hari <small>(giliran otomatis, bisa diganti)</small></div><div class="b19seg b19day" role="group" aria-label="Hari latihan">' +
      days.map((d, i) => '<button class="pill" data-q="b19Day" data-v="' + i + '" aria-pressed="' + (i === di) + '">' + esc(b19Short(d)) + '</button>').join('') + '</div>';
    h += '<p class="note">' + esc(days[di].t + ': ' + days[di].s) + ' Gerakan mengikuti levelmu di Tangga progresi.' +
      (plan.some(x => /^Penutup core/.test(x.v)) ? ' Core ditaruh di akhir karena variasi gerakan di levelmu masih sedikit.' : '') + (plan.length < 4 ? ' Variasi tambahan muncul saat levelmu naik.' : '') + '</p>';
  } else if (!sp) h += '<p class="note">Bawaan = program Fase di atas. Pilih PPL, Atas/Bawah, atau Full body untuk mengganti set dan gerakan hari ini.</p>';
  return h + '</div>';
}
QACT.b19Split = el => {
  const v = el.dataset.v;
  if (v !== '' && !B18_SPLITS.some(s => s.id === v)) return;
  if (v) b18Split = v;
  b19Sd = null; setP({ split: v }); renderTrain();
};
QACT.b19Day = el => {
  const id = b19Active(), i = +el.dataset.v;
  if (!id || !Number.isInteger(i) || i < 0 || i >= b19Days(id).length) return;
  b19Sd = { d: today(), sp: id, v: i }; renderTrain();
};
/* tab Pustaka: pilihan jenis latihan yang sama; ketukan memasangnya ke tab Sesi */
QACT.b18Split = el => {
  const v = el.dataset.v; if (!B18_SPLITS.some(s => s.id === v)) return;
  b18Split = v; b19Sd = null; setP({ split: v }); renderTrain();
};
function b19PusNote() {
  const sp = pdb.split && b19Days(pdb.split) ? B18_SPLITS.find(s => s.id === pdb.split) : null;
  return '<p class="note b19stat">' + (sp
    ? 'Terpasang di tab Sesi: <b>' + esc(sp.n) + '</b>. Memilih jenis latihan di sini juga mengganti set dan gerakan di tab Sesi.' + (pdb.opt === 'gym' ? ' Tempat latihan sekarang Di gym, jadi tab Sesi masih memakai program gym.' : '')
    : 'Belum dipasang: tab Sesi memakai program Fase. Ketuk jenis latihan di atas untuk memasangnya; set dan gerakan di tab Sesi akan berganti.') +
    '</p><div class="aibtn"><button class="btn sm ghost b19go" data-q="b16Tab" data-v="ses">Buka tab Sesi</button></div>';
}
function b19Pus() {
  if (pdb.split && b19Days(pdb.split)) b18Split = pdb.split;
  const h = b18PusHTML(), k = '<p class="note"><i class="b18dot" aria-hidden="true"></i> Titik =', i = h.indexOf(k);
  return i < 0 ? h + b19PusNote() : h.slice(0, i) + b19PusNote() + h.slice(i);
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b19: Object.freeze({
  plan: b19Plan, active: b19Active, day: b19Day, auto: b19AutoDay, days: () => B18_SPLITS.map(s => ({ id: s.id, days: s.days.map(d => Object.assign({}, d)) })),
  build: b19Build, rx: () => JSON.parse(JSON.stringify(B19_RX)), acc: () => JSON.parse(JSON.stringify(B19_ACC)), tag: b19Tag, ctl: b19Ctl, pus: b19Pus
}) }));

/* ===== MODUL: AI SEPEDA: RINGKASAN RIDE & CEK ZONE 2 (batch 17, langkah 17c) ===== */
// ✦ Ride = obrolan bubble jenis 'bike' di panel #fchat (mesin Batch 12-1/14/15b/16b: Ulangi, Salin, Baru, Lihat data, Berhenti, Coba lagi).
// Dua pintu di baris #b17cAiRow (bagian "Ride terakhir" di Latihan > Sepeda; tampil hanya bila AI nyala): "✦ Ringkas ride" (ketukan = izin panggilan,
// langsung menyusun jawaban pertama) dan "✦ Cek Zone 2" (membuka panel lalu mengirim pertanyaan tetap; panggilan hanya dari ketukan itu).
// SEMUA angka dihitung LOKAL. Cek Zone 2 = mesin murni b17cZ2() (tanpa AI) yang juga dipakai untuk satu blok di bawah Uji bicara; AI hanya menjelaskan
// dan WAJIB mengikuti vonisnya. Modul ini tidak menulis ke tdb/pdb/db/wdb/edb/cdb/fdb dan tidak menyimpan apa pun (obrolan hanya di memori).
// Bukti Zone 2 hanya dari ride bertipe z2/long: (a) uji bicara hari ini (talkRes, tidak tersimpan), (b) HR rata-rata ride Zone 2 terbaru vs batas atas
// Zone 2 (70% HRmax; hanya bila usia di profil sah), (c) speed ride Zone 2 terbaru vs median ride Zone 2 sebelumnya (butuh >= 3). Speed = PETUNJUK, bukan bukti.
// Tidak dikirim ke AI: usia, HRmax, profil, BMR/TDEE, berat, skor harian, teks `why`, catatan bebas ride. Zone 2 dikirim sebagai kisaran bpm saja. FTP, metode tes, dan zona daya (q6b3) ikut bila ada tes FTP; W/kg hanya bila grup badan dicentang; angka berat tidak dikirim.
const B17C_DAYS = 28, B17C_BASE_DAYS = 56, B17C_BASE_MIN = 3, B17C_FAST_PCT = 10, B17C_NEAR_BPM = 10, B17C_LAST = 5;
const BIKE_SYS = 'Kamu pelatih sepeda singkat di aplikasi catatan kebugaran milik satu orang. Semua angka sudah dihitung aplikasi di DATA; tugasmu hanya menjelaskan dan menyarankan. ' +
  'Format: satu paragraf 2 sampai 3 kalimat (satu hal yang berjalan baik dari RIDE TERAKHIR atau PEKAN INI VS PEKAN LALU, dan satu hal yang perlu diperhatikan), lalu satu baris "Saran ride berikutnya:" disusul satu atau dua poin konkret (satu kalimat tiap poin, diawali "- "). ' +
  'Penilaian Zone 2 HARUS mengikuti CEK ZONE 2: jangan menyimpulkan sebaliknya dan jangan membuat ambang sendiri; bila vonisnya belum cukup data, katakan itu apa adanya. ' +
  'Speed yang lebih tinggi saja BUKAN bukti Zone 2 terlalu cepat (bisa karena makin bugar, turunan, atau angin); uji bicara dan detak jantung lebih menentukan. ' +
  'Bila ada bagian TREN ZONE 2: itu petunjuk yang sudah dihitung aplikasi, jangan dihitung ulang; tren naik atau turun BUKAN bukti Zone 2 terlalu cepat atau terlalu lambat, dan penilaian Zone 2 tetap hanya dari CEK ZONE 2. ' +
  'Bila ada bagian FTP DAN ZONA DAYA: FTP, W/kg, dan zona daya sudah dihitung aplikasi, jangan dihitung ulang; tes beda metode tidak sebanding; kamu tidak mendiagnosis dan tidak mewajibkan tes FTP. ' +
  'Kamu hanya menyarankan: jangan menyuruh mengubah catatan atau rencana, dan jangan menyebut angka atau fakta yang tidak ada di DATA. ' +
  'Bahasa Indonesia, teks biasa tanpa judul markdown, tabel, atau tanda tebal. Bukan diagnosis: nyeri dada, pusing berat, atau pingsan saat bersepeda = berhenti dan temui dokter. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
Object.assign(BR_TITLE, { bike: '✦ Ride' });
Object.assign(FC_NOUN, { bike: 'ringkasan' });
Object.assign(FC_AUTO, { bike: 'Susun ringkasan ride dan saran' });
Object.assign(FC_FOLLOW, {
  bike: 'Ini obrolan Ride: pengguna bertanya tentang ride sepedanya sendiri, dan DATA berisi hitungan yang sudah dihitung aplikasi (ringkasan 28 hari, ride terakhir, pekan ini vs pekan lalu, CEK ZONE 2, TREN ZONE 2 8 pekan bila ada, dan FTP dengan zona daya bila ada). ' +
    'Jawab hanya dari DATA dan obrolan sebelumnya; jangan menghitung ulang atau menambah angka baru. Penilaian Zone 2 mengikuti CEK ZONE 2; speed yang lebih tinggi saja bukan bukti Zone 2 terlalu cepat. Tren Zone 2 hanya petunjuk: naik atau turun bukan bukti Zone 2 terlalu cepat atau terlalu lambat. ' +
    'Kamu hanya menyarankan: jangan menyuruh mengubah catatan atau rencana. Bukan diagnosis: nyeri dada, pusing berat, atau pingsan = berhenti dan temui dokter.'
});
Object.assign(FC_CHIPS, { bike: ['Apakah Zone 2-ku terlalu cepat?', 'Bagaimana pekan ini dibanding pekan lalu?', 'Apa fokus ride berikutnya?', 'Bagaimana tren Zone 2-ku?'] });
Object.assign(FC_CTX, { bike: 'Ride, pekan, Zone 2, tren 8 pekan' });

/* --- mesin lokal --- */
const b17cSpd = r => (r.spd != null && r.spd > 0) ? r.spd : (r.km != null && r.min ? r.km / (r.min / 60) : null);
const b17cMed = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
function b17cRides(t, days) {   // [{d, r}] urut tanggal naik, hanya hari ber-ride dalam `days` hari terakhir sampai hari ini
  const from = addDays(t, -(days - 1)), out = [];
  Object.keys(tdb).filter(d => DATE_RE.test(d) && d >= from && d <= t && tdb[d] && Array.isArray(tdb[d].rides)).sort().forEach(d => tdb[d].rides.forEach(r => out.push({ d, r })));
  return out;
}
const B17C_VERDICT = {
  fast: 'Zone 2 kemungkinan terlalu cepat.',
  maybe: 'Ada tanda Zone 2 agak cepat, tetapi belum pasti.',
  ok: 'Tidak ada tanda Zone 2 terlalu cepat.',
  few: 'Belum cukup data untuk menilai Zone 2.'
};
function b17cZ2(opt) {   // fungsi murni (membaca tdb, profil usia, dan talkRes); opt.talk menggantikan talkRes (untuk uji)
  opt = opt || {};
  const t = today(), talk = Object.prototype.hasOwnProperty.call(opt, 'talk') ? opt.talk : talkRes;
  const all = b17cRides(t, B17C_BASE_DAYS).filter(x => x.r.type === 'z2' || x.r.type === 'long');
  const from = addDays(t, -(B17C_DAYS - 1)), recent = all.filter(x => x.d >= from), last = recent.length ? recent[recent.length - 1] : null;
  const h = hrInfo(), ev = [];
  if (talk === 1) ev.push({ k: 'talk', v: 'ok', t: 'Uji bicara hari ini: satu kalimat penuh tanpa terputus, cocok dengan Zone 2.' });
  else if (talk === 2) ev.push({ k: 'talk', v: 'bad', t: 'Uji bicara hari ini: terputus-putus, tanda tenagamu di atas Zone 2.' });
  else if (talk === 3) ev.push({ k: 'talk', v: 'bad', t: 'Uji bicara hari ini: terengah-engah, jauh di atas Zone 2.' });
  if (last) {
    const lb = 'ride ' + dayShort(last.d) + ' (' + RIDE_NAME(last.r.type) + ')';
    if (last.r.hr != null && h.st === 'ok') {
      const up = hrAt(h.max, 70), df = last.r.hr - up;
      if (df <= 0) ev.push({ k: 'hr', v: 'ok', t: 'HR rata-rata ' + lb + ' ' + fmt(last.r.hr, 0) + ' bpm, di bawah atau tepat di batas atas Zone 2 (' + up + ' bpm).' });
      else if (df <= B17C_NEAR_BPM) ev.push({ k: 'hr', v: 'warn', t: 'HR rata-rata ' + lb + ' ' + fmt(last.r.hr, 0) + ' bpm, ' + df + ' bpm di atas batas atas Zone 2 (' + up + ' bpm); masih dalam ' + (h.src === 'terukur' ? 'toleransi' : 'galat rumus') + ' ±' + B17C_NEAR_BPM + ' bpm.' });
      else ev.push({ k: 'hr', v: 'bad', t: 'HR rata-rata ' + lb + ' ' + fmt(last.r.hr, 0) + ' bpm, ' + df + ' bpm di atas batas atas Zone 2 (' + up + ' bpm), melebihi ' + (h.src === 'terukur' ? 'toleransi' : 'galat rumus') + ' ±' + B17C_NEAR_BPM + ' bpm.' });
    }
    const sp = b17cSpd(last.r), prev = all.filter(x => x !== last).map(x => b17cSpd(x.r)).filter(v => v != null);
    if (sp != null && prev.length >= B17C_BASE_MIN) {
      const med = b17cMed(prev), pct = (sp / med - 1) * 100;
      if (pct >= B17C_FAST_PCT) ev.push({ k: 'spd', v: 'warn', t: 'Speed ' + lb + ' ' + fmt(sp, 1) + ' km/jam, ' + fmt(pct, 0) + '% di atas median ' + prev.length + ' ride Zone 2 sebelumnya (' + fmt(med, 1) + ' km/jam). Ini petunjuk, bukan bukti: bisa karena makin bugar, turunan, atau angin.' });
      else ev.push({ k: 'spd', v: 'ok', t: 'Speed ' + lb + ' ' + fmt(sp, 1) + ' km/jam, tidak melewati median ' + prev.length + ' ride Zone 2 sebelumnya (' + fmt(med, 1) + ' km/jam) lebih dari ' + B17C_FAST_PCT + '%.' });
    }
  }
  const state = !ev.length ? 'few' : ev.some(e => e.v === 'bad') ? 'fast' : ev.some(e => e.v === 'warn') ? 'maybe' : 'ok';
  return { state, verdict: B17C_VERDICT[state], ev: ev.map(e => e.t), evs: ev, last, zone: h.st === 'ok' ? [hrAt(h.max, 60), hrAt(h.max, 70)] : null };
}
function b17cZ2HTML() {   // blok kecil di bawah Uji bicara; kosong bila tidak ada bukti dari ride (uji bicara saja sudah punya teksnya sendiri)
  const z = b17cZ2();
  if (z.state === 'few' || !z.evs.some(e => e.k !== 'talk')) return '';
  return '<div class="b17z2" data-st="' + z.state + '"><p class="note" style="color:var(--ink);margin:12px 0 4px"><b>Cek Zone 2: ' + esc(z.verdict) + '</b></p>' +
    z.ev.map(l => '<p class="note" style="margin:2px 0">' + esc(l) + '</p>').join('') + '</div>';
}

/* --- konteks AI (semua dihitung lokal) --- */
function b17cWeekCount(s, t) {
  let n = 0, km = 0, kmN = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(s, i); if (d > t) break; (tdb[d] && Array.isArray(tdb[d].rides) ? tdb[d].rides : []).forEach(r => { n++; if (r.km != null) { km += r.km; kmN++; } }); }
  return { n, km, kmN };
}
// q3c (tahap 52): tren Zone 2 untuk konteks AI. Memakai bzTrend() (modul q3b) APA ADANYA: angka tidak dihitung ulang di sini, jadi sama dengan kartu Kemajuan.
// Petunjuk, bukan vonis: vonis Zone 2 tetap dari b17cZ2(). Tanpa ride Zone 2/Long ride sama sekali = bagian tidak ditulis. Galat ditelan (bagian dilewati; pesan di DL.b52q3c.err()).
// Yang dikirim hanya angka per pekan (nilai tengah speed, nilai tengah HR rata-rata, jumlah ride, km/jam per 100 bpm); usia dan HRmax tidak ikut.
let B17C_TERR = '';
function b17cTrendLines() {
  try {
    B17C_TERR = '';
    if (typeof bzTrend !== 'function') return null;
    const T = bzTrend();
    if (!T || !T.nAll) return null;
    if (!T.nUsed) return [T.nAll + ' ride Zone 2 atau Long ride dalam ' + BZ_TR_WEEKS + ' pekan terakhir, tetapi belum ada yang punya HR rata-rata dan kecepatan, jadi tren belum bisa dihitung.'];
    const cur = thisWeek(), L = T.weeks.slice().reverse().map(w => (w.ws === cur ? 'pekan ini (' + rangeLabel(w.ws) + ')' : 'pekan ' + rangeLabel(w.ws)) + ': ' + w.n + ' ride, ' +
      'speed (nilai tengah) ' + aiN(w.sp, 1) + ' km/jam, HR rata-rata (nilai tengah) ' + aiN(w.hr) + ' bpm, ' + aiN(w.e, 1) + ' km/jam per 100 bpm');
    if (T.change) {
      const p = Math.round(T.change.pct), ps = p > 0 ? '+' + fmt(p, 0) + '%' : p < 0 ? '−' + fmt(Math.abs(p), 0) + '%' : '0%';
      L.push('perubahan dari pekan ' + rangeLabel(T.change.from) + ' ke pekan ' + rangeLabel(T.change.to) + ': ' + aiN(T.change.a, 1) + ' → ' + aiN(T.change.b, 1) + ' km/jam per 100 bpm (' + ps + ')');
    } else L.push('belum cukup data untuk membandingkan: perlu minimal ' + BZ_TR_MINR + ' ride ber-HR dalam ' + BZ_TR_MINW + ' pekan berbeda (patokan aplikasi, bukan standar)');
    L.push('hanya ride Zone 2 dan Long ride ' + BZ_TR_WEEKS + ' pekan terakhir yang punya HR rata-rata dan kecepatan' + (T.nAll > T.nUsed ? '; ' + (T.nAll - T.nUsed) + ' ride lain tidak dihitung karena belum ada HR atau kecepatan' : '') +
      '. Tren naik atau turun BUKAN bukti Zone 2 terlalu cepat atau terlalu lambat (angin, tanjakan, panas, kurang tidur, dan sensor bisa mengubah angkanya); penilaian Zone 2 hanya dari CEK ZONE 2');
    return L;
  } catch (x) { B17C_TERR = String((x && x.message) || x); return null; }
}
function b17cCtx() {
  const t = today();
  if (!aiOn('latihan')) return b14Fail('Grup data Latihan belum dicentang di Pengaturan AI, jadi AI tidak boleh memakai catatan ridemu. AI tidak dipanggil. Centang grup Latihan dulu.', true);
  const R = b17cRides(t, B17C_DAYS);
  if (!R.length) return b14Fail('Data belum cukup: belum ada ride dalam ' + B17C_DAYS + ' hari terakhir. AI tidak dipanggil supaya tidak mengarang. Catat ride dulu.', false);
  const P = [], sec = (h, L) => { if (L && L.length) P.push(h + ':\n' + L.map(x => '- ' + x).join('\n')); };
  P.push('HARI INI: ' + dayLong(t) + '.' + aiHead(t) + ' Ride tercatat dalam ' + B17C_DAYS + ' hari terakhir: ' + R.length + '.');
  const kmR = R.filter(x => x.r.km != null), mnR = R.filter(x => x.r.min != null), both = R.filter(x => x.r.km != null && x.r.min);
  const sum = [R.length + ' ride, total ' + aiN(kmR.reduce((a, x) => a + x.r.km, 0), 1) + ' km (dari ' + kmR.length + ' ride yang punya jarak), ' + aiN(mnR.reduce((a, x) => a + x.r.min, 0)) + ' menit (dari ' + mnR.length + ' ride yang punya durasi)'];
  if (both.length) sum.push('speed rata-rata (jarak total per jam total, ' + both.length + ' ride yang punya keduanya): ' + aiN(both.reduce((a, x) => a + x.r.km, 0) / (both.reduce((a, x) => a + x.r.min, 0) / 60), 1) + ' km/jam');
  ['z2', 'long', 'thr', 'vo2', 'free'].forEach(k => {
    const g = R.filter(x => x.r.type === k); if (!g.length) return;
    const gk = g.filter(x => x.r.km != null), gm = g.filter(x => x.r.min != null);
    sum.push((AI_RIDE[k] || 'bebas') + ': ' + g.length + ' ride' + (gk.length ? ', ' + aiN(gk.reduce((a, x) => a + x.r.km, 0), 1) + ' km' : '') + (gm.length ? ', ' + aiN(gm.reduce((a, x) => a + x.r.min, 0)) + ' menit' : ''));
  });
  sec('RINGKASAN ' + B17C_DAYS + ' HARI', sum);
  sec('RIDE TERAKHIR (maksimal ' + B17C_LAST + ')', R.slice(-B17C_LAST).reverse().map(x => {
    const r = x.r, df = diffDays(x.d, t), sp = b17cSpd(r);
    const bits = [r.min != null && aiN(r.min) + ' menit', r.km != null && aiN(r.km, 1) + ' km', sp != null && 'speed ' + aiN(sp, 1) + ' km/jam' + (r.spd == null ? ' (dihitung dari jarak dan waktu)' : ''), r.rpe != null && 'RPE ' + r.rpe].concat(jrAiBits(r)).concat(bzKdAiBits(r)).filter(Boolean);
    return dayShort(x.d) + (df === 0 ? ' (hari ini)' : ' (' + df + ' hari lalu)') + ', ' + (AI_RIDE[r.type] || 'bebas') + ': ' + (bits.join(', ') || 'tanpa angka');
  }));
  sec('CATATAN KRAM DAN MINUM (dari ridemu; hanya catatan)', bzKdAiNote(R.slice(-B17C_LAST)));
  sec('FTP DAN ZONA DAYA (hasil aturan aplikasi; angka sudah dihitung, ikuti angkanya)', b48FtpLines());
  const ws = thisWeek(), a = b17cWeekCount(ws, t), b = b17cWeekCount(addDays(ws, -7), t);
  const wl = (lbl, w) => lbl + ': ' + w.n + ' ride, ' + aiN(w.km, 1) + ' km' + (w.n && w.kmN < w.n ? ' (' + (w.n - w.kmN) + ' ride tanpa jarak)' : '');
  sec('PEKAN INI VS PEKAN LALU', [wl('pekan ini (' + rangeLabel(ws) + ', sampai hari ini)', a), wl('pekan lalu (' + rangeLabel(addDays(ws, -7)) + ')', b)]);
  const z = b17cZ2(), zl = [z.verdict].concat(z.ev);
  if (z.zone) zl.push('Zone 2 ≈ ' + z.zone[0] + '–' + z.zone[1] + ' bpm (60–70% HRmax, perkiraan rumus; galat ±10 bpm)');
  zl.push('Uji bicara tidak tersimpan: hanya dihitung bila dilakukan di layar Sepeda sebelum pertanyaan ini.');
  sec('CEK ZONE 2 (hasil aturan aplikasi; ikuti, jangan menilai sendiri)', zl);
  sec('TREN ZONE 2 (hasil hitungan aplikasi; petunjuk, bukan vonis)', b17cTrendLines());   // q3c
  const body = P.join('\n\n'), user = body + '\n\nSusun ringkasan ride dan saran ride berikutnya.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}

/* --- tampilan --- */
function b17cEmptyHTML() {
  const c = b17cCtx();
  let h = '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>Ride</h4><p class="note">' +
    esc('Ringkasan ridemu dan cek apakah Zone 2-mu terlalu cepat, dari catatan di perangkat ini. Angka dihitung di perangkat ini; AI hanya menjelaskan dan menyarankan, tidak mengubah catatan. Bukan diagnosis.') + '</p>';
  if (c.empty) h += '<p class="note"><b>' + esc(c.emptyMsg) + '</b></p>' + (c.emptyBtn ? '<div class="quick"><button class="btn primary" data-q="fcSettings">Buka pengaturan AI</button></div>' : '');
  else h += '<div class="quick"><button class="btn primary" data-q="fcGen">Susun ringkasan ride</button></div>' +
    '<div class="csug">' + FC_CHIPS.bike.map(x => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div><p class="note">Atau tulis pertanyaanmu di bawah.</p>';
  return h + '</div>';
}
function b17cAiRowHTML() {
  return '<div class="aibtn" id="b17cAiRow"' + (adb.on ? '' : ' hidden') + '><button class="btn sm" data-q="bikeSum">✦ Ringkas ride</button><button class="btn sm" data-q="bikeZ2">✦ Cek Zone 2</button></div>';
}
function b17cSync() { const r = $('#b17cAiRow'); if (r) r.hidden = !adb.on; }

/* --- aksi --- */
QACT.bikeSum = () => { fcOpen('bike'); if (fcKind === 'bike' && !fcHasChat(FC.bike)) fcFirst('bike'); };
QACT.bikeZ2 = () => { fcOpen('bike'); if (fcKind === 'bike' && !fcBusy) fcSend(FC_CHIPS.bike[0], true); };
function b17cNew() {
  openSheet({ title: 'Mulai obrolan baru?', note: 'Obrolan di layar ini dihapus. Tidak tersimpan di mana pun.',
    actions: [closeBtn, { label: 'Mulai baru', primary: true, fn: () => { closeSheet(); fcTok++; if (fcBusy) AI.cancel(); fcBusy = false; fcWaitStop(); FC.bike = fcBlank(); fcDraft.bike = ''; $('#fcIn').value = ''; fcGrow(); fcPaint('end'); } }] });
}
function b17cPeek() {
  const c = b17cCtx();
  openSheet({ title: 'Data yang akan dikirim', note: c.empty ? c.emptyMsg : 'Hanya teks ini, pertanyaanmu, dan obrolan di layar ini yang dikirim. Angka dihitung di perangkat ini; grup data yang tidak dicentang di Pengaturan AI tidak ikut. Usia, profil, berat badan, skor harian, dan catatan bebas ride tidak dikirim. FTP, metode tes, dan zona daya ikut bila kamu mencatat tes FTP (grup Latihan); W/kg hanya bila grup Berat dan ukuran badan dicentang. Kram, elektrolit, dan air saat ride hanya ikut bila grup Kram (kram, elektrolit) atau Gizi (air) dicentang. Tren Zone 2 (nilai tengah speed dan HR rata-rata per pekan dari ride Zone 2 dan Long ride, 8 pekan terakhir) ikut bila ada ride Zone 2; usia dan HRmax tetap tidak dikirim.',
    text: c.empty ? '' : c.body, prose: true, actions: [closeBtn] });
}
{
  const _n = QACT.fcNew, _p = QACT.fcPeek;
  QACT.fcNew = () => fcKind === 'bike' ? b17cNew() : _n();
  QACT.fcPeek = () => fcKind === 'bike' ? b17cPeek() : _p();
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b17c: Object.freeze({ z2: b17cZ2, z2html: b17cZ2HTML, ctx: b17cCtx, sys: BIKE_SYS, fcl: () => FC_FOLLOW.bike, rides: b17cRides, spd: b17cSpd, med: b17cMed, empty: b17cEmptyHTML, row: b17cAiRowHTML, verdicts: B17C_VERDICT,
  lim: Object.freeze({ DAYS: B17C_DAYS, BASE_DAYS: B17C_BASE_DAYS, BASE_MIN: B17C_BASE_MIN, FAST_PCT: B17C_FAST_PCT, NEAR_BPM: B17C_NEAR_BPM, LAST: B17C_LAST }) }) }));

window.DL = Object.freeze(Object.assign({}, window.DL, { b52q3c: Object.freeze({ lines: b17cTrendLines, err: () => B17C_TERR }) }));   // q3c

/* ===== MODUL: KRAM DETAIL (batch 18, langkah 18a) ===== */
// Log kejadian kram per hari: jam, bagian, durasi (rentang), intensitas, catatan. Data baru `dailylog:krm:v1`, ikut cadangan JSON (kunci `krm`).
// Kolom kram lama (db[tgl].kram = tidak/ya, kramPart) TIDAK diubah dan tetap sumber bagi CSV, teks harian, Riwayat, AI, Beranda, dan tabel elektrolit.
// Mencatat kejadian menyetel kram = 'ya' (dan mengisi kramPart hanya bila kosong). Menghapus kejadian tidak mengubah kram.
const KEY_K = 'dailylog:krm:v1';
const KJ_M = [['betis', 'Betis'], ['paha', 'Paha'], ['telapak', 'Telapak kaki'], ['jari', 'Jari kaki'], ['lain', 'Lainnya']];
const KJ_D = [['k1', 'Kurang dari 1 menit', '< 1 menit'], ['k5', '1–5 menit', '1–5 menit'], ['k15', '5–15 menit', '5–15 menit'], ['k99', 'Lebih dari 15 menit', '> 15 menit']];
const KJ_I = [[1, 'Ringan', 'masih bisa berjalan'], [2, 'Sedang', 'harus berhenti dan meregangkan'], [3, 'Berat', 'nyeri tajam atau sulit digerakkan']];
const KJ_MAX = 12;
const KJ_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
let kdb = {};   // {tgl: {ev: [{id, h, m, d, i, n}], updated}}
let kjForm = null;
STORES.k = { key: KEY_K, get: () => kdb }; dirty.k = false;   // ikut ekspor JSON versi 4 (kunci `krm`)

function kjEv(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const h = typeof r.h === 'string' && KJ_TIME.test(r.h) ? r.h : '';
  const m = KJ_M.some(x => x[0] === r.m) ? r.m : '';
  const d = KJ_D.some(x => x[0] === r.d) ? r.d : '';
  const i = (Number.isInteger(r.i) && r.i >= 1 && r.i <= 3) ? r.i : null;
  const n = (typeof r.n === 'string' ? r.n : (typeof r.n === 'number' ? String(r.n) : '')).replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!h && !m && !d && i == null && !n) return null;
  const id = typeof r.id === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(r.id) ? r.id : '';
  return { id, h, m, d, i, n };
}
function kclean(raw) {
  const b = { ev: [], updated: 0 };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const seen = new Set();
  (Array.isArray(raw.ev) ? raw.ev : []).forEach(x => {
    if (b.ev.length >= KJ_MAX) return;
    const e = kjEv(x); if (!e) return;
    let id = e.id, n = 0;
    while (!id || seen.has(id)) id = ('k' + b.ev.length.toString(36) + (n++).toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 24);   // id kosong atau ganda diganti
    e.id = id; seen.add(id); b.ev.push(e);
  });
  const u = Number(raw.updated);
  b.updated = Number.isFinite(u) && u > 0 ? u : 0;
  return b;
}
const kjDays = () => Object.keys(kdb).filter(d => DATE_RE.test(d) && kdb[d] && kdb[d].ev.length).sort();
const kjCount = d => (kdb[d] && kdb[d].ev ? kdb[d].ev.length : 0);
function kjList(d) {   // urut jam naik; kejadian tanpa jam di akhir menurut urutan catat
  const l = ((kdb[d] && kdb[d].ev) || []).map((x, k) => ({ x, k }));
  l.sort((a, b) => (a.x.h && b.x.h) ? (a.x.h < b.x.h ? -1 : a.x.h > b.x.h ? 1 : a.k - b.k) : a.x.h ? -1 : b.x.h ? 1 : a.k - b.k);
  return l.map(o => Object.assign({}, o.x));
}
function kLoad(raw) {   // gabungkan data tersimpan dengan yang sempat diketik saat muat (pola cdb)
  const m = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) Object.keys(raw).forEach(d => { if (DATE_RE.test(d)) { const c = kclean(raw[d]); if (c.ev.length || c.updated > 0) m[d] = c; } });
  kdb = Object.assign(m, kdb);
}
function kjCommit(d, list) {
  const c = kdb[d] || (kdb[d] = { ev: [], updated: 0 });
  c.ev = list; c.updated = Date.now();
  queueSave('k');
}
function kjBlockOff(e, v) {   // dipakai pengendali klik pil kram: hari berisi kejadian tidak boleh berstatus Tidak / kosong
  const n = kjCount(cur);
  if (!n) return false;
  const next = e.kram === v ? null : v;
  if (next === 'ya') return false;
  toast('Ada ' + n + ' kejadian kram tercatat di tanggal ini. Hapus kejadiannya dulu bila salah.');
  return true;
}
const kjHm = h => h.replace(':', '.');
function kjRowHTML(e) {
  const mL = (KJ_M.find(x => x[0] === e.m) || [])[1], dL = (KJ_D.find(x => x[0] === e.d) || [])[2], iL = (KJ_I.find(x => x[0] === e.i) || [])[1];
  const head = [e.h ? kjHm(e.h) : '', mL].filter(Boolean).join(' · ') || 'Kejadian kram';
  const sub = [dL, iL ? 'intensitas ' + iL.toLowerCase() : ''].filter(Boolean).join(' · ');
  const label = 'Ubah kejadian kram: ' + [e.h ? 'jam ' + kjHm(e.h) : '', mL, dL, iL ? 'intensitas ' + iL.toLowerCase() : '', e.n].filter(Boolean).join(', ');
  return '<button type="button" class="kjrow" data-q="kjEdit" data-id="' + esc(e.id) + '" aria-label="' + esc(label) + '"><b>' + esc(head) + '</b>' +
    (sub ? '<span>' + esc(sub) + '</span>' : '') + (e.n ? '<small>' + esc(e.n) + '</small>' : '') + '</button>';
}
function kjPaint() {
  const box = $('#kramLog'); if (!box) return;
  const list = kjList(cur);
  const h = (list.length ? '<div class="sublbl">Kejadian kram (' + list.length + ')</div>' + list.map(kjRowHTML).join('') : '') +
    '<button type="button" class="btn wide" data-q="kjAdd">+ Catat kejadian kram</button>';
  if (box._h !== h) { box.innerHTML = h; box._h = h; }
}
function kjPills(g, items, cur0) {
  return '<div class="chips" role="group" aria-label="' + g[1] + '">' + items.map(it => '<button type="button" class="pill" data-q="kjPick" data-g="' + g[0] + '" data-v="' + it[0] + '" aria-pressed="' + String(it[0] === cur0) + '">' + esc(it[1]) + '</button>').join('') + '</div>';
}
function kjFormHTML(ev, canNow) {
  return '<div class="kjf">' +
    '<div class="kjl">Jam mulai</div><div class="kjt"><input type="time" class="txt" id="kjH" aria-label="Jam mulai kram" value="' + esc(ev ? ev.h : '') + '">' + (canNow ? '<button type="button" class="btn" data-q="kjNow">Sekarang</button>' : '') + '</div>' +
    '<div class="kjl">Bagian</div>' + kjPills(['m', 'Bagian'], KJ_M, ev ? ev.m : '') +
    '<div class="kjl">Durasi</div>' + kjPills(['d', 'Durasi'], KJ_D, ev ? ev.d : '') +
    '<div class="kjl">Intensitas</div>' + kjPills(['i', 'Intensitas'], KJ_I, ev ? ev.i : null) +
    '<p class="note kjn">' + KJ_I.map(x => x[1] + ': ' + x[2]).join('. ') + '.</p>' +
    '<div class="kjl">Catatan</div><input type="text" class="txt" id="kjN" maxlength="120" autocomplete="off" aria-label="Catatan kram" placeholder="Opsional: sedang apa, apa yang membantu" value="' + esc(ev ? ev.n : '') + '">' +
    '</div>';
}
function kjSyncPills() {
  if (!kjForm) return;
  $$('#shExtra [data-q="kjPick"]').forEach(b => {
    const g = b.dataset.g, v = b.dataset.v;
    b.setAttribute('aria-pressed', String(g === 'i' ? kjForm.i === +v : kjForm[g] === v));
  });
}
function kjOpen(id) {
  const d = cur, list = (kdb[d] && kdb[d].ev) || [], ev = id ? list.find(x => x.id === id) : null;
  if (id && !ev) return;
  if (!id && list.length >= KJ_MAX) { toast('Maksimal ' + KJ_MAX + ' kejadian per hari'); return; }
  kjForm = { id: ev ? ev.id : '', date: d, m: ev ? ev.m : '', d: ev ? ev.d : '', i: ev ? ev.i : null };
  openSheet({
    title: ev ? 'Ubah kejadian kram' : 'Catat kejadian kram', note: dayShort(d), extra: kjFormHTML(ev, d === today()),
    actions: [{ label: 'Simpan', primary: true, fn: () => QACT.kjSave() }].concat(ev ? [{ label: 'Hapus', danger: true, fn: () => QACT.kjDel() }] : [], [closeBtn]),
    onClose: () => { kjForm = null; }
  });
}
function kjMarkDay(label) {   // kejadian membantah "Tidak": kram -> ya; kramPart diisi hanya bila kosong
  const e = db[cur] || blank();
  let marked = false;
  if (!String(e.kramPart || '').trim() && label) setField('kramPart', label);
  if (E().kram !== 'ya') { setE({ kram: 'ya' }); marked = true; }
  return marked;
}
QACT.kjAdd = () => kjOpen('');
QACT.kjEdit = el => kjOpen(el.dataset.id || '');
QACT.kjPick = el => {
  if (!kjForm) return;
  const g = el.dataset.g, v = el.dataset.v;
  if (g === 'm' && KJ_M.some(x => x[0] === v)) kjForm.m = kjForm.m === v ? '' : v;
  else if (g === 'd' && KJ_D.some(x => x[0] === v)) kjForm.d = kjForm.d === v ? '' : v;
  else if (g === 'i' && KJ_I.some(x => String(x[0]) === v)) kjForm.i = kjForm.i === +v ? null : +v;
  kjSyncPills();
};
QACT.kjNow = () => {
  const t = new Date(), p = n => String(n).padStart(2, '0'), el = $('#kjH');
  if (el) el.value = p(t.getHours()) + ':' + p(t.getMinutes());
};
QACT.kjSave = () => {
  if (!kjForm) return;
  const f = kjForm, hEl = $('#kjH'), nEl = $('#kjN');
  const ev = kjEv({ id: f.id, h: hEl ? hEl.value : '', m: f.m, d: f.d, i: f.i, n: nEl ? nEl.value : '' });
  if (!ev) { toast('Isi minimal satu: jam, bagian, durasi, intensitas, atau catatan'); return; }
  const list = ((kdb[f.date] && kdb[f.date].ev) || []).map(x => Object.assign({}, x));
  const at = f.id ? list.findIndex(x => x.id === f.id) : -1;
  if (at >= 0) list[at] = ev;
  else {
    if (list.length >= KJ_MAX) { toast('Maksimal ' + KJ_MAX + ' kejadian per hari'); return; }
    let id; do { id = ('k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 24); } while (list.some(x => x.id === id));
    ev.id = id; list.push(ev);
  }
  kjCommit(f.date, list);
  const lbl = (KJ_M.find(x => x[0] === ev.m) || [])[1] || '';
  const marked = kjMarkDay(lbl);
  closeSheet(); kjPaint();
  toast((at >= 0 ? 'Kejadian kram diperbarui' : 'Kejadian kram dicatat') + (marked ? '. ' + (f.date === today() ? 'Hari ini' : 'Tanggal ini') + ' ditandai kram' : ''));
};
QACT.kjDel = () => {
  if (!kjForm || !kjForm.id) return;
  const d = kjForm.date, id = kjForm.id, c = kdb[d];
  const at = c ? c.ev.findIndex(x => x.id === id) : -1;
  if (at < 0) return;
  const old = Object.assign({}, c.ev[at]);
  kjCommit(d, c.ev.filter(x => x.id !== id));
  closeSheet(); kjPaint();
  toast('Kejadian kram dihapus', {
    label: 'Urungkan', fn: () => {
      const list = ((kdb[d] && kdb[d].ev) || []).map(x => Object.assign({}, x));
      if (list.length >= KJ_MAX || list.some(x => x.id === old.id)) return;
      list.splice(Math.min(at, list.length), 0, old);
      kjCommit(d, list); kjPaint();
    }
  });
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b18a: Object.freeze({ clean: kclean, ev: kjEv, list: kjList, days: kjDays, count: kjCount, labels: Object.freeze({ m: KJ_M, d: KJ_D, i: KJ_I }), max: KJ_MAX }) }));

/* ===== MODUL: POLA KRAM (batch 18, langkah 18b) ===== */
// Pola dari kejadian kram (kdb, modul 18a) di tab Nutrisi, bagian "Pola kram". Semua dihitung di perangkat ini:
// tanpa AI, tanpa jaringan, tanpa data atau kunci penyimpanan baru. Kolom kram lama, tabel elektrolit, CSV, Riwayat, AI, dan Beranda tidak diubah.
// Hari kram = db[tgl].kram === 'ya', hari tanpa kram = 'tidak', hari tanpa pilihan tidak dihitung. Hanya rata-rata kelompok, tanpa korelasi.
const KP_RNG = [[30, '30 hari'], [90, '90 hari'], [0, 'Semua']];
const KP_HOURS = [['dini', 'Dini hari (00.00–05.59)'], ['pagi', 'Pagi (06.00–11.59)'], ['siang', 'Siang–sore (12.00–17.59)'], ['malam', 'Malam (18.00–23.59)']];
const KP_HEAVY_MIN = 3;   // jumlah kejadian berat dalam rentang yang memicu kalimat "periksakan ke dokter"
let kpRng = 30;

function kpBand(h) {   // jam 'HH:MM' -> kelompok; jam kosong atau tak sah -> ''
  if (typeof h !== 'string' || !KJ_TIME.test(h)) return '';
  const n = +h.slice(0, 2);
  return n < 6 ? 'dini' : n < 12 ? 'pagi' : n < 18 ? 'siang' : 'malam';
}
function kpDist(evs, defs, keyOf, noneKey, noneLabel) {   // baris berjumlah 0 tidak ditampilkan; "Tanpa ..." tidak pernah jadi yang teratas
  const total = evs.length, rows = [];
  defs.concat([[noneKey, noneLabel]]).forEach(def => {
    const n = evs.filter(e => keyOf(e) === def[0]).length;
    if (n) rows.push({ k: def[0], label: def[1], n, pct: Math.round(n * 100 / total) });
  });
  let top = null, best = 0;
  rows.forEach(r => { if (r.k !== noneKey && r.n > best) { best = r.n; top = r.k; } });   // seri: yang lebih awal menurut urutan daftar
  return { rows, top };
}
function kpCmp(dd, valOf) {
  const k = [], n = [];
  dd.forEach(d => {
    const e = db[d];
    if (!e || (e.kram !== 'ya' && e.kram !== 'tidak')) return;
    const v = valOf(d, e); if (v == null) return;
    (e.kram === 'ya' ? k : n).push(v);
  });
  const c = { n: k.length + n.length, nK: k.length, nN: n.length, avgK: null, avgN: null, diff: null, st: 'ok', warn: false };
  if (c.n < HX_MIN_N) c.st = 'few';
  else if (c.nK < HX_GRP_MIN || c.nN < HX_GRP_MIN) c.st = 'groups';
  else { c.avgK = hxAvg(k); c.avgN = hxAvg(n); c.diff = c.avgK - c.avgN; c.warn = c.n < HX_OK_N; }
  return c;
}
function kpPat(rng) {
  rng = KP_RNG.some(x => x[0] === rng) ? rng : kpRng;
  const t = today(), from = rng ? addDays(t, -(rng - 1)) : '';
  const inR = d => DATE_RE.test(d) && d <= t && (!from || d >= from);
  const dayKeys = kjDays().filter(inR), evs = [];
  dayKeys.forEach(d => kjList(d).forEach(e => evs.push(e)));
  const events = evs.length, withI = evs.filter(e => e.i != null);
  const dd = Object.keys(db).filter(inR).sort();
  const P = {
    rng, from, to: t, events, days: dayKeys.length,
    perDay: dayKeys.length ? events / dayKeys.length : null,
    nI: withI.length, avgI: withI.length ? withI.reduce((s, e) => s + e.i, 0) / withI.length : null,
    legacy: dd.filter(d => db[d] && db[d].kram === 'ya' && !kjCount(d)).length,
    few: events > 0 && events < HX_MIN_N,
    heavy: evs.filter(e => e.i === 3).length,
    parts: [], hours: [], durs: [], ints: [], top: { parts: null, hours: null, durs: null, ints: null }, cmp: {}
  };
  if (events) {
    const a = kpDist(evs, KJ_M, e => e.m, '', 'Tanpa bagian');
    const b = kpDist(evs, KP_HOURS, e => kpBand(e.h), '', 'Tanpa jam');
    const c = kpDist(evs, KJ_D.map(x => [x[0], x[1]]), e => e.d, '', 'Tanpa durasi');
    const i = kpDist(evs, KJ_I.map(x => [x[0], x[1]]), e => e.i, null, 'Tanpa intensitas');
    P.parts = a.rows; P.hours = b.rows; P.durs = c.rows; P.ints = i.rows;
    P.top = { parts: a.top, hours: b.top, durs: c.top, ints: i.top };
  }
  P.cmp = {
    water: kpCmp(dd, (d, e) => { const w = num(e.water); return w != null && w >= 0 && w <= 20 ? w : null; }),
    elec: kpCmp(dd, d => cdb[d] ? ELEC.filter(it => elecDone(d, it)).length : null),
    sleep: kpCmp(dd, (d, e) => { const s = num(e.sleep); return s != null && s >= 0 && s <= 24 ? s : null; })
  };
  P.ride = bzKpRide(dd);
  return P;
}
function kpRowsHTML(rows, top) {
  return rows.map(r => '<div class="kpr"><div class="kpt"><span class="kpl">' + esc(r.label) + (top != null && r.k === top ? ' <small class="kptop">paling sering</small>' : '') + '</span>' +
    '<span class="kpn">' + r.n + ' · ' + r.pct + '%</span></div><div class="kpb" aria-hidden="true"><i style="width:' + r.pct + '%"></i></div></div>').join('');
}
function kpCmpCard(title, sub, c, dec, unit) {
  let h = '<section class="hxcard"><h3>' + esc(title) + '</h3><p class="cmp">' + esc(sub) + '</p>';
  if (c.st === 'few') h += '<p>Belum dihitung: butuh minimal ' + HX_MIN_N + ' hari berpasangan, sekarang baru ' + c.n + '.</p>';
  else if (c.st === 'groups') h += '<p>Belum dihitung: butuh minimal ' + HX_GRP_MIN + ' hari kram dan ' + HX_GRP_MIN + ' hari tanpa kram. Sekarang ' + c.nK + ' hari kram dan ' + c.nN + ' hari tanpa kram.</p>';
  else {
    h += '<p>Hari kram: rata-rata ' + hxF(c.avgK, dec) + ' ' + unit + ' (' + c.nK + ' hari). Hari tanpa kram: ' + hxF(c.avgN, dec) + ' ' + unit + ' (' + c.nN + ' hari). Selisih ' + hxS(c.diff, dec) + ' ' + unit + '.</p>';
    if (c.warn) h += '<p class="warn">⚠ Data masih sedikit (' + c.n + ' hari). Anggap ini petunjuk awal, bukan kesimpulan; satu dua hari yang ganjil bisa mengubah angkanya.</p>';
  }
  return h + '</section>';
}
function kpHTML() {
  const P = kpPat();
  const rb = KP_RNG.map(x => '<button type="button" class="pill" data-q="kpRng" data-v="' + x[0] + '" aria-pressed="' + (x[0] === P.rng) + '">' + x[1] + '</button>').join('');
  let h = '<p class="note kpintro">Dari kejadian kram yang kamu catat di Jurnal. Dihitung di perangkat ini dan tidak dikirim ke mana pun.</p>' +
    '<div class="seg hxmet" role="group" aria-label="Rentang waktu pola kram">' + rb + '</div>';
  if (!P.events) {
    h += '<p class="note kpempty">Belum ada kejadian kram tercatat dalam rentang ini. Catat di Jurnal, bagian Kaki kram hari ini.</p>' +
      (P.legacy ? '<p class="note">' + P.legacy + ' hari kram tercatat tanpa detail.</p>' : '') +
      '<button type="button" class="btn wide" data-q="openToday">Isi di Jurnal</button>';
    return h;
  }
  h += '<p class="hxsum">' + (P.rng ? P.rng + ' hari terakhir' : 'Semua hari') + ': ' + P.events + ' kejadian dalam ' + P.days + ' hari.</p>' +
    (P.few ? '<p class="kpwarn">⚠ Data masih sedikit (' + P.events + ' kejadian). Anggap ini petunjuk awal, bukan kesimpulan.</p>' : '') +
    kv('Rata-rata per hari berkejadian', hxF(P.perDay, 1)) +
    kv('Intensitas rata-rata', P.avgI == null ? 'belum ada intensitas' : hxF(P.avgI, 1) + ' dari 3' + (P.nI < P.events ? ' (' + P.nI + ' kejadian)' : '')) +
    (P.legacy ? kv('Kram tanpa detail', P.legacy + ' hari') : '') +
    '<div class="sublbl">Bagian tubuh</div>' + kpRowsHTML(P.parts, P.top.parts) +
    '<div class="sublbl">Jam kejadian</div>' + kpRowsHTML(P.hours, P.top.hours) +
    '<div class="sublbl">Durasi</div>' + kpRowsHTML(P.durs, P.top.durs) +
    '<div class="sublbl">Intensitas</div>' + kpRowsHTML(P.ints, P.top.ints) +
    '<div class="sublbl">Hari kram dibanding hari tanpa kram</div>' +
    kpCmpCard('Air putih', 'Air putih yang dicatat di hari itu.', P.cmp.water, 2, 'L') +
    kpCmpCard('Ceklis elektrolit', 'Butir ceklis selesai dari ' + ELEC.length + ' (' + ELEC.map(x => x[0].toLowerCase()).join(', ') + '); hanya hari yang punya catatan ceklis.', P.cmp.elec, 1, 'butir') +
    kpCmpCard('Tidur', 'Lama tidur yang dicatat di hari itu.', P.cmp.sleep, 1, 'jam') + bzKpRideHTML(P);
  if (P.heavy >= KP_HEAVY_MIN) h += '<p class="kpwarn">⚠ ' + P.heavy + ' kejadian berat dalam rentang ini; bila berulang, periksakan ke dokter.</p>';
  return h + '<p class="note">Perbandingan menunjukkan dua hal bergerak bersama, bukan bahwa yang satu menyebabkan yang lain. Jika kram makin sering, makin lama, atau makin berat, periksakan ke dokter.</p>';
}
const kpSectionHTML = () => '<section class="sec"><h2>Pola kram</h2><div id="kpBox">' + kpHTML() + '</div>' + naiRowKram() + '</section>';
function kpPaint() { const b = $('#kpBox'); if (b) b.innerHTML = kpHTML(); }
QACT.kpRng = el => {
  const v = +el.dataset.v;
  if (!KP_RNG.some(t => t[0] === v)) return;
  kpRng = v; kpPaint();
  const b = $('#kpBox [data-q="kpRng"][data-v="' + v + '"]'); if (b) b.focus();   // fokus tetap di pil yang baru dipilih
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b18b: Object.freeze({ pat: kpPat, html: kpHTML, band: kpBand, paint: kpPaint, rng: () => kpRng, lim: Object.freeze({ MIN_N: HX_MIN_N, OK_N: HX_OK_N, GRP_MIN: HX_GRP_MIN, HEAVY_MIN: KP_HEAVY_MIN }) }) }));

/* ===== MODUL: MENU MINGGUAN & BELANJA (batch 18, langkah 18c) ===== */
// Perencana menu per hari (Senin-Minggu) + daftar belanja. Data baru `dailylog:menu:v1`, ikut cadangan JSON (kunci `menu`).
// Menu adalah RENCANA, bukan catatan makan: modul ini TIDAK menulis db/edb (kalori dan protein log tidak berubah) dan tidak memakai AI atau jaringan.
const KEY_MP = 'dailylog:menu:v1';
const MP_SLOT = [['pagi', 'Pagi'], ['siang', 'Siang'], ['malam', 'Malam'], ['snack', 'Snack']];
const MP_MAX = 12, MP_SH_MAX = 60;
let mpDb = { days: {}, shop: { it: [], updated: 0 } };   // days: {tgl: {it: [{id, t, n, k, p, b}], updated}}; shop: {it: [{id, n, q, done}], updated}
let mpWeek = '';      // '' = pekan ini; selain itu tanggal Senin pekan yang tampil (tidak disimpan)
let mpForm = null;
STORES.mp = { key: KEY_MP, get: () => mpDb }; dirty.mp = false;   // ikut ekspor JSON versi 4 (kunci `menu`)

const mpTxt = (v, n) => (typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : '')).replace(/\s+/g, ' ').trim().slice(0, n).trim();
const mpId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(v) ? v : '';
function mpUid(id, seen, tag) {   // id kosong atau ganda diganti
  let n = 0;
  while (!id || seen.has(id)) id = ((tag || 'x') + (n++).toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 24);
  return id;
}
const mpUpd = v => { const u = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : 0); return Number.isFinite(u) && u > 0 ? u : 0; };
function mpItem(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const n = mpTxt(r.n, 60); if (!n) return null;
  return { id: mpId(r.id), t: MP_SLOT.some(x => x[0] === r.t) ? r.t : 'siang', n, k: mnum(r.k, M_IN_K), p: mnum(r.p, M_IN_P), b: mpTxt(r.b, 120) };
}
function mpDay(raw) {
  const b = { it: [], updated: 0 };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const seen = new Set();
  (Array.isArray(raw.it) ? raw.it : []).forEach(x => {
    if (b.it.length >= MP_MAX) return;
    const e = mpItem(x); if (!e) return;
    e.id = mpUid(e.id, seen, 'm' + b.it.length); seen.add(e.id); b.it.push(e);
  });
  b.updated = mpUpd(raw.updated);
  return b;
}
function mpShItem(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const n = mpTxt(r.n, 60); if (!n) return null;
  return { id: mpId(r.id), n, q: Number.isInteger(r.q) && r.q >= 1 && r.q <= 99 ? r.q : null, done: r.done === true };
}
function mpShop(raw) {
  const b = { it: [], updated: 0 };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const seen = new Set();
  (Array.isArray(raw.it) ? raw.it : []).forEach(x => {
    if (b.it.length >= MP_SH_MAX) return;
    const e = mpShItem(x); if (!e) return;
    e.id = mpUid(e.id, seen, 's' + b.it.length); seen.add(e.id); b.it.push(e);
  });
  b.updated = mpUpd(raw.updated);
  return b;
}
function mpClean(raw) {
  const o = { days: {}, shop: { it: [], updated: 0 } };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  const dd = raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  Object.keys(dd).forEach(d => { if (!DATE_RE.test(d)) return; const c = mpDay(dd[d]); if (c.it.length || c.updated > 0) o.days[d] = c; });
  o.shop = mpShop(raw.shop);
  return o;
}
function mpLoad(raw) {   // gabungkan data tersimpan dengan yang sempat diketik saat muat (pola cdb/kdb)
  const l = mpClean(raw);
  mpDb.days = Object.assign(l.days, mpDb.days);
  if (l.shop.updated > mpDb.shop.updated || (!mpDb.shop.it.length && !(mpDb.shop.updated > 0))) mpDb.shop = l.shop;
}
const mpDays = () => Object.keys(mpDb.days).filter(d => DATE_RE.test(d) && mpDb.days[d] && mpDb.days[d].it.length).sort();
const mpItems = d => (mpDb.days[d] && mpDb.days[d].it) || [];
const mpCount = d => mpItems(d).length;
const mpOrdered = d => { const it = mpItems(d); return MP_SLOT.flatMap(s => it.filter(x => x.t === s[0])).map(x => Object.assign({}, x)); };
function mpSplit(text, max) {   // dipisah koma; dipadatkan; <= max huruf; tanpa duplikat (tanpa huruf besar/kecil)
  const out = [], seen = new Set();
  String(text == null ? '' : text).split(',').forEach(x => {
    const n = mpTxt(x, max || 60); if (!n) return;
    const k = n.toLowerCase(); if (seen.has(k)) return;
    seen.add(k); out.push(n);
  });
  return out;
}
function mpNewId(tag, list) {
  let id; do { id = (tag + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 24); } while (list.some(x => x.id === id));
  return id;
}
function mpCommit(d, list) {
  const c = mpDb.days[d] || (mpDb.days[d] = { it: [], updated: 0 });
  c.it = list; c.updated = Date.now();
  queueSave('mp');
}
function mpShCommit(list) { mpDb.shop = { it: list, updated: Date.now() }; queueSave('mp'); }

/* --- model pekan (murni) --- */
const mpR1 = x => Math.round(x * 10) / 10;
function mpWeekModel(start) {
  const st = weekStart(start || thisWeek()), en = addDays(st, 6), t0 = today();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(st, i), all = mpOrdered(d);
    let k = 0, p = 0, nk = 0, np = 0, noNum = 0;
    all.forEach(x => {
      if (x.k != null) { k += x.k; nk++; }
      if (x.p != null) { p += x.p; np++; }
      if (x.k == null && x.p == null) noNum++;
    });
    const T = tgFor(d), kk = nk ? mpR1(k) : null, pp = np ? mpR1(p) : null;
    let status = null;
    if (kk != null) {
      if (T.mode === 'range') status = kk < T.kcal ? 'below' : kk > T.kcalHi ? 'above' : 'in';
      else status = kk <= T.kcal ? 'in' : 'above';
    }
    return {
      date: d, label: HARI[pd(d).getDay()].slice(0, 3) + ' ' + pd(d).getDate(), isToday: d === t0,
      groups: MP_SLOT.map(s => ({ t: s[0], label: s[1], items: all.filter(x => x.t === s[0]) })).filter(g => g.items.length),
      n: all.length, k: kk, p: pp, noNum, status,
      target: { mode: T.mode === 'range' ? 'range' : 'max', kcal: T.kcal, kcalHi: T.kcalHi, protein: T.protein, refeed: !!T.refeed }
    };
  });
  return { start: st, end: en, isThis: st === thisWeek(), days, total: days.reduce((s, x) => s + x.n, 0) };
}
function mpGen(start) {   // bahan terkumpul dari menu pekan itu: [{n, q}] (q = jumlah menu yang memuatnya bila >= 2)
  const st = weekStart(start || thisWeek()), cnt = new Map(), label = new Map(), order = [];
  for (let i = 0; i < 7; i++) {
    mpOrdered(addDays(st, i)).forEach(x => {
      mpSplit(x.b, 60).forEach(n => {
        const k = n.toLowerCase();
        if (!cnt.has(k)) { cnt.set(k, 0); label.set(k, n); order.push(k); }
        cnt.set(k, cnt.get(k) + 1);
      });
    });
  }
  return order.map(k => ({ n: label.get(k), q: cnt.get(k) >= 2 ? Math.min(cnt.get(k), 99) : null }));
}
function mpShText() {
  return mpDb.shop.it.filter(x => !x.done).map(x => '- ' + x.n + (x.q ? ' ×' + x.q : '')).join('\n');
}

/* --- tampilan --- */
const mpWkShown = () => weekStart(mpWeek || thisWeek());
function mpRangeLabel(st, en) {
  const a = pd(st), b = pd(en), ma = BULAN[a.getMonth()].slice(0, 3), mb = BULAN[b.getMonth()].slice(0, 3);
  if (a.getFullYear() !== b.getFullYear()) return a.getDate() + ' ' + ma + ' ' + a.getFullYear() + ' – ' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
  if (a.getMonth() !== b.getMonth()) return a.getDate() + ' ' + ma + ' – ' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
  return a.getDate() + '–' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
}
function mpItemHTML(x, d) {
  const sub = [x.k != null ? fmt(x.k, 1) + ' kcal' : '', x.p != null ? fmt(x.p, 1) + ' g protein' : ''].filter(Boolean).join(' · ');
  const label = 'Ubah menu: ' + [x.n, (MP_SLOT.find(s => s[0] === x.t) || [])[1], x.k != null ? fmt(x.k, 1) + ' kcal' : '', x.p != null ? fmt(x.p, 1) + ' g protein' : '', x.b ? 'bahan ' + x.b : ''].filter(Boolean).join(', ');
  return '<button type="button" class="kjrow" data-q="mpEdit" data-d="' + d + '" data-id="' + esc(x.id) + '" aria-label="' + esc(label) + '"><b>' + esc(x.n) + '</b>' +
    (sub ? '<span>' + esc(sub) + '</span>' : '') + (x.b ? '<small>Bahan: ' + esc(x.b) + '</small>' : '') + '</button>';
}
function mpDayHTML(D) {
  let h = '<div class="mpday"><div class="mpdh"><b>' + esc(D.label) + '</b>' + (D.isToday ? '<span class="mpnow">hari ini</span>' : '') + '</div>';
  D.groups.forEach(g => { h += '<div class="sublbl">' + g.label + '</div>' + g.items.map(x => mpItemHTML(x, D.date)).join(''); });
  if (D.k != null || D.p != null) {
    const T = D.target, kt = (T.mode === 'range' ? 'rentang ' : 'batas ') + (T.mode === 'range' ? fmt(T.kcal, 0) + '–' + fmt(T.kcalHi, 0) : fmt(T.kcal, 0)) + ' kcal' + (T.refeed ? ' (hari refeed)' : '');
    const st = { in: T.mode === 'range' ? 'dalam rentang' : 'dalam batas', above: T.mode === 'range' ? 'di atas rentang' : 'di atas batas', below: 'di bawah rentang' };
    h += '<p class="note mpsum">Total rencana: ' + [D.k != null ? fmt(D.k, 1) + ' kcal' : '', D.p != null ? fmt(D.p, 1) + ' g protein' : ''].filter(Boolean).join(', ') + '.' +
      (D.k != null ? ' Target ' + kt + ', protein ' + fmt(T.protein, 0) + ' g. Kalori ' + st[D.status] + '.' : '') +
      (D.noNum ? ' ' + D.noNum + ' menu tanpa angka tidak dihitung.' : '') + '</p>';
  }
  return h + '<button type="button" class="btn wide" data-q="mpAdd" data-d="' + D.date + '">+ Tambah menu</button></div>';
}
function mpHTML() {
  const W = mpWeekModel(mpWkShown());
  return '<p class="note mpintro">Menu adalah rencana. Mengisinya tidak mengubah kalori dan protein di Jurnal.</p>' +
    '<div class="chips mpnav" role="group" aria-label="Pilih pekan">' +
    '<button type="button" class="pill" data-q="mpWk" data-v="-1">‹ Pekan lalu</button>' +
    '<button type="button" class="pill" data-q="mpWk" data-v="0" aria-pressed="' + String(W.isThis) + '">Pekan ini</button>' +
    '<button type="button" class="pill" data-q="mpWk" data-v="1">Pekan depan ›</button></div>' +
    '<p class="mpttl">' + esc(mpRangeLabel(W.start, W.end)) + '</p>' +
    (W.total ? '' : '<p class="note mpempty">Belum ada menu di pekan ini. Isi bahan di tiap menu, lalu ambil jadi daftar belanja di bawah.</p>') +
    W.days.map(mpDayHTML).join('');
}
function mpPaint() { const b = $('#mpBox'); if (b) b.innerHTML = mpHTML(); }
function mpShRowHTML(x) {
  return '<div class="mpshr"><button type="button" class="mpshc" role="checkbox" aria-checked="' + String(x.done) + '" data-q="mpShTog" data-id="' + esc(x.id) + '">' +
    '<span class="mpbox" aria-hidden="true">' + (x.done ? '✓' : '') + '</span><span class="mpshn">' + esc(x.n) + (x.q ? ' <small>×' + x.q + '</small>' : '') + '</span></button>' +
    '<button type="button" class="mpshx" data-q="mpShDel" data-id="' + esc(x.id) + '" aria-label="Hapus ' + esc(x.n) + '">✕</button></div>';
}
function mpShHTML() {
  const it = mpDb.shop.it, nDone = it.filter(x => x.done).length, W = mpWkShown();
  return '<div class="mpadd"><input type="text" class="txt" id="mpShIn" maxlength="200" autocomplete="off" aria-label="Tambah barang belanja" placeholder="Telur, bayam, tempe">' +
    '<button type="button" class="btn" data-q="mpShAdd">Tambah</button></div>' +
    (it.length ? it.map(mpShRowHTML).join('') + '<p class="note mpshsum">' + (it.length - nDone) + ' belum dibeli, ' + nDone + ' sudah dibeli.</p>'
      : '<p class="note mpempty">Daftar belanja masih kosong. Ketik barang di atas (pisahkan dengan koma), atau ambil bahan dari menu.</p>') +
    '<button type="button" class="btn wide" data-q="mpShGen">Ambil bahan dari menu ' + esc(shortDate(W) + '–' + shortDate(addDays(W, 6))) + '</button>' +
    (it.length ? '<button type="button" class="btn wide" data-q="mpShCopy">Salin daftar</button>' : '') +
    (nDone ? '<button type="button" class="btn wide" data-q="mpShClr">Hapus yang sudah dibeli (' + nDone + ')</button>' : '');
}
function mpShPaint(focusSel) {
  const box = $('#mpShBox'); if (!box) return;
  const old = $('#mpShIn'), val = old ? old.value : '', had = !!old && document.activeElement === old;
  box.innerHTML = mpShHTML();
  const nu = $('#mpShIn'); if (nu) { nu.value = val; if (had) nu.focus(); }
  if (focusSel) { const f = $(focusSel, box); if (f) f.focus(); }
}
const mpSectionHTML = () => '<section class="sec"><h2>Menu mingguan</h2><div id="mpBox">' + mpHTML() + '</div>' + naiRowMenu() + '</section>' +
  '<section class="sec"><h2>Daftar belanja</h2><div id="mpShBox">' + mpShHTML() + '</div></section>';

/* --- menu: sheet isian --- */
function mpFormHTML(it, slot) {
  const favs = fdb.slice(0, 8);
  return '<div class="kjf mpf">' +
    '<div class="kjl">Waktu makan</div><div class="chips" role="group" aria-label="Waktu makan">' + MP_SLOT.map(s => '<button type="button" class="pill" data-q="mpPick" data-v="' + s[0] + '" aria-pressed="' + String(s[0] === slot) + '">' + s[1] + '</button>').join('') + '</div>' +
    '<div class="kjl">Nama menu</div><input type="text" class="txt" id="mpN" maxlength="60" autocomplete="off" aria-label="Nama menu" placeholder="Contoh: Telur rebus + tempe" value="' + esc(it ? it.n : '') + '">' +
    (favs.length ? '<div class="kjl">Dari favorit</div><div class="chips" role="group" aria-label="Pilih dari favorit">' + favs.map((f, i) => '<button type="button" class="pill mpfavb" data-q="mpFav" data-i="' + i + '">' + esc(f.n) + '</button>').join('') + '</div>' : '') +
    '<div class="mpnum"><div><div class="kjl">Kalori (kcal)</div><input type="text" inputmode="decimal" class="txt" id="mpK" autocomplete="off" aria-label="Kalori menu, kcal" placeholder="Opsional" value="' + esc(it && it.k != null ? mstr(it.k) : '') + '"></div>' +
    '<div><div class="kjl">Protein (g)</div><input type="text" inputmode="decimal" class="txt" id="mpP" autocomplete="off" aria-label="Protein menu, gram" placeholder="Opsional" value="' + esc(it && it.p != null ? mstr(it.p) : '') + '"></div></div>' +
    '<div class="kjl">Bahan</div><input type="text" class="txt" id="mpB" maxlength="120" autocomplete="off" aria-label="Bahan menu" placeholder="Opsional, pisahkan dengan koma: telur, tempe, bayam" value="' + esc(it ? it.b : '') + '">' +
    '</div>';
}
function mpSyncPills() {
  if (!mpForm) return;
  $$('#shExtra [data-q="mpPick"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === mpForm.t)));
}
function mpOpen(d, id) {
  if (!DATE_RE.test(d || '')) return;
  const list = mpItems(d), it = id ? list.find(x => x.id === id) : null;
  if (id && !it) return;
  if (!id && list.length >= MP_MAX) { toast('Maksimal ' + MP_MAX + ' menu per hari'); return; }
  mpForm = { id: it ? it.id : '', date: d, t: it ? it.t : (d === today() ? autoSlot() : 'siang') };
  openSheet({
    title: it ? 'Ubah menu' : 'Tambah menu', note: dayShort(d), extra: mpFormHTML(it, mpForm.t),
    actions: [{ label: 'Simpan', primary: true, fn: () => QACT.mpSave() }].concat(it ? [{ label: 'Hapus', danger: true, fn: () => QACT.mpDel() }] : [], [closeBtn]),
    onClose: () => { mpForm = null; }
  });
}
QACT.mpWk = el => {
  const v = el.dataset.v, base = mpWkShown();
  if (v === '0') mpWeek = ''; else if (v === '-1') mpWeek = addDays(base, -7); else if (v === '1') mpWeek = addDays(base, 7); else return;
  if (mpWeek === thisWeek()) mpWeek = '';
  mpPaint(); mpShPaint();
  const b = $('#mpBox [data-q="mpWk"][data-v="' + v + '"]'); if (b) b.focus();   // fokus tetap di pil yang baru dipilih
};
QACT.mpAdd = el => mpOpen(el.dataset.d || '', '');
QACT.mpEdit = el => mpOpen(el.dataset.d || '', el.dataset.id || '');
QACT.mpPick = el => {
  if (!mpForm) return;
  const v = el.dataset.v;
  if (!MP_SLOT.some(s => s[0] === v)) return;
  mpForm.t = v; mpSyncPills();
};
QACT.mpFav = el => {
  if (!mpForm) return;
  const f = fdb[+el.dataset.i]; if (!f) return;
  const n = $('#mpN'), k = $('#mpK'), p = $('#mpP');
  if (n) n.value = f.n; if (k) k.value = f.kcal == null ? '' : mstr(f.kcal); if (p) p.value = f.p == null ? '' : mstr(f.p);
};
function mpNumField(el) {   // {ok, v}: kosong = null; bukan angka atau negatif = galat
  const s = el ? String(el.value).trim() : '';
  if (s === '') return { ok: true, v: null };
  const v = num(s);
  return v == null || v < 0 ? { ok: false, v: null } : { ok: true, v };
}
QACT.mpSave = () => {
  if (!mpForm) return;
  const f = mpForm, n = mpTxt($('#mpN') ? $('#mpN').value : '', 60);
  if (!n) { toast('Isi nama menu'); return; }
  const kf = mpNumField($('#mpK')), pf = mpNumField($('#mpP'));
  if (!kf.ok || !pf.ok) { toast('Kalori dan protein harus berupa angka'); return; }
  if ((kf.v != null && kf.v > M_IN_K) || (pf.v != null && pf.v > M_IN_P)) { toast('Angka terlalu besar. Maksimal ' + fmt(M_IN_K, 0) + ' kcal dan ' + M_IN_P + ' g per item'); return; }
  const ev = mpItem({ id: f.id, t: f.t, n, k: kf.v, p: pf.v, b: $('#mpB') ? $('#mpB').value : '' });
  const list = mpItems(f.date).map(x => Object.assign({}, x));
  const at = f.id ? list.findIndex(x => x.id === f.id) : -1;
  if (at >= 0) list[at] = ev;
  else {
    if (list.length >= MP_MAX) { toast('Maksimal ' + MP_MAX + ' menu per hari'); return; }
    ev.id = mpNewId('m', list); list.push(ev);
  }
  mpCommit(f.date, list);
  closeSheet(); mpPaint();
  toast(at >= 0 ? 'Menu diperbarui' : 'Menu ditambahkan');
};
QACT.mpDel = () => {
  if (!mpForm || !mpForm.id) return;
  const d = mpForm.date, id = mpForm.id, list = mpItems(d), at = list.findIndex(x => x.id === id);
  if (at < 0) return;
  const old = Object.assign({}, list[at]);
  mpCommit(d, list.filter(x => x.id !== id).map(x => Object.assign({}, x)));
  closeSheet(); mpPaint();
  toast('Menu dihapus', {
    label: 'Urungkan', fn: () => {
      const l2 = mpItems(d).map(x => Object.assign({}, x));
      if (l2.length >= MP_MAX || l2.some(x => x.id === old.id)) return;
      l2.splice(Math.min(at, l2.length), 0, old);
      mpCommit(d, l2); mpPaint();
    }
  });
};

/* --- daftar belanja --- */
function mpShAddNames(arr) {   // arr: [{n, q}] -> {added, dup, full}
  const list = mpDb.shop.it.map(x => Object.assign({}, x)), have = new Set(list.map(x => x.n.toLowerCase()));
  let added = 0, dup = 0, full = 0;
  arr.forEach(a => {
    const k = a.n.toLowerCase();
    if (have.has(k)) { dup++; return; }
    if (list.length >= MP_SH_MAX) { full++; return; }
    have.add(k); added++;
    list.push({ id: mpNewId('s', list), n: a.n, q: a.q == null ? null : a.q, done: false });
  });
  if (added) mpShCommit(list);
  return { added, dup, full };
}
function mpShMsg(r) {
  return [r.added ? r.added + ' ditambahkan' : '', r.dup ? r.dup + ' sudah ada' : '', r.full ? r.full + ' tidak muat (maksimal ' + MP_SH_MAX + ')' : ''].filter(Boolean).join(', ');
}
QACT.mpShAdd = () => {
  const el = $('#mpShIn'), names = mpSplit(el ? el.value : '', 60);
  if (!names.length) { toast('Ketik nama barang dulu'); return; }
  const r = mpShAddNames(names.map(n => ({ n, q: null })));
  if (el && (r.added || r.dup)) el.value = '';
  mpShPaint('#mpShIn');
  toast(mpShMsg(r));
};
QACT.mpShTog = el => {
  const id = el.dataset.id, list = mpDb.shop.it.map(x => Object.assign({}, x)), x = list.find(y => y.id === id);
  if (!x) return;
  x.done = !x.done;
  mpShCommit(list);
  mpShPaint('[data-q="mpShTog"][data-id="' + id + '"]');
};
QACT.mpShDel = el => {
  const id = el.dataset.id, list = mpDb.shop.it, at = list.findIndex(x => x.id === id);
  if (at < 0) return;
  const old = Object.assign({}, list[at]);
  mpShCommit(list.filter(x => x.id !== id).map(x => Object.assign({}, x)));
  const nx = mpDb.shop.it[at] || mpDb.shop.it[at - 1];   // fokus ke baris terdekat (bukan kolom ketik, supaya papan ketik tidak muncul)
  mpShPaint(nx ? '[data-q="mpShTog"][data-id="' + nx.id + '"]' : '[data-q="mpShAdd"]');
  toast('Barang dihapus', {
    label: 'Urungkan', fn: () => {
      const l2 = mpDb.shop.it.map(x => Object.assign({}, x));
      if (l2.length >= MP_SH_MAX || l2.some(x => x.id === old.id)) return;
      l2.splice(Math.min(at, l2.length), 0, old);
      mpShCommit(l2); mpShPaint();
    }
  });
};
QACT.mpShClr = () => {
  const gone = mpDb.shop.it.map((x, i) => ({ x: Object.assign({}, x), i })).filter(o => o.x.done);
  if (!gone.length) return;
  mpShCommit(mpDb.shop.it.filter(x => !x.done).map(x => Object.assign({}, x)));
  mpShPaint('[data-q="mpShAdd"]');
  toast(gone.length + ' barang dihapus', {
    label: 'Urungkan', fn: () => {
      const l2 = mpDb.shop.it.map(x => Object.assign({}, x));
      gone.forEach(o => { if (l2.length >= MP_SH_MAX || l2.some(y => y.id === o.x.id)) return; l2.splice(Math.min(o.i, l2.length), 0, o.x); });
      mpShCommit(l2); mpShPaint();
    }
  });
};
QACT.mpShGen = () => {
  const g = mpGen(mpWkShown());
  if (!g.length) { toast('Belum ada bahan di menu pekan ini'); return; }
  const r = mpShAddNames(g);
  mpShPaint('[data-q="mpShGen"]');
  toast(mpShMsg(r));
};
QACT.mpShCopy = () => {
  const t = mpShText();
  if (!t) { toast('Tidak ada barang yang belum dibeli'); return; }
  openSheet({ title: 'Daftar belanja', text: t, actions: [copyBtn, closeBtn] });
};
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'mpShIn') { e.preventDefault(); QACT.mpShAdd(); } });
window.DL = Object.freeze(Object.assign({}, window.DL, { b18c: Object.freeze({
  clean: mpClean, item: mpItem, shopItem: mpShItem, split: mpSplit, days: mpDays, list: mpOrdered, count: mpCount,
  week: mpWeekModel, gen: mpGen, shop: () => mpDb.shop.it.map(x => Object.assign({}, x)), text: mpShText,
  html: mpHTML, shopHtml: mpShHTML, shown: () => mpWkShown(), max: MP_MAX, shopMax: MP_SH_MAX
}) }));


/* ===== MODUL: AI NUTRISI & KRAM (batch 18, langkah 18d) ===== */
// ✦ Ide menu dan ✦ Pola kram = dua jenis obrolan bubble baru ('menu', 'cramp') di panel #fchat (mesin Batch 12-1/14/15b/16b/17c:
// Ulangi, Salin, Baru, Lihat data, Berhenti, Coba lagi). Pintu masuk = satu baris tombol di tab Nutrisi, di bagian "Menu mingguan" dan di bagian "Pola kram".
// Baris itu DIGAMBAR hanya bila AI nyala (adb.on); bila AI mati, bagian Nutrisi sama persis dengan build 18c. Ketukan tombol = izin panggilan dan langsung menyusun jawaban pertama.
// SEMUA angka dihitung LOKAL (sisa kalori/protein, profil sisa, slot makan, tren, tanda bahaya). AI hanya menjelaskan/menyarankan dan WAJIB mengikuti hasil itu.
// Modul ini tidak menulis ke db/edb/fdb/kdb/mpDb/cdb dan tidak menyimpan apa pun (obrolan hanya di memori; dibuang saat hari berganti atau AI dimatikan). Kunci penyimpanan baru: tidak ada.
// Privasi: ide menu butuh grup Gizi; pola kram butuh grup Kram (air putih hanya bila grup Gizi, tidur hanya bila grup Tidur, ceklis elektrolit ikut grup Kram).
// Catatan kejadian kram (n) dan teks bebas kramPart TIDAK PERNAH dikirim. Tidak dikirim: profil, berat, usia, TDEE, skor, favorit, menu pekan lain, jam kejadian mentah.
const NAI_MIN_DAYS = 3, NAI_TREND_MIN = 3, NAI_TREND_GAP = 2, NAI_LONG_MIN = 2, NAI_SHOP_MAX = 20, NAI_SHOP_LEN = 30, NAI_PLAN_LEN = 40;
const NAI_HIGH = 50, NAI_LOW = 30;   // porsi sisa kalori yang harus berasal dari protein, persen (>= 50 tinggi; >= 30 seimbang; selain itu longgar)
const naiK = k => k === 'menu' || k === 'cramp' || k === 'tk';
const NAI_MENU_SYS = 'Kamu memberi ide menu singkat di aplikasi catatan kebugaran milik satu orang. Semua angka sudah dihitung aplikasi di DATA; tugasmu hanya menyarankan hidangan. ' +
  'Format: tepat tiga ide, satu baris tiap ide diawali "- ", berisi nama hidangan dan alasan singkat menurut PROFIL SISA, lalu satu kalimat penutup. ' +
  'Ikuti PROFIL SISA dan WAKTU MAKAN BERIKUTNYA; jangan membuat ambang sendiri. Bila PROFIL SISA menyebut kalori sudah di batas atau lewat, JANGAN menyarankan makanan: tulis satu atau dua baris yang hanya menyarankan minuman tanpa kalori (air putih, teh tawar) atau berhenti makan, bukan tiga hidangan. ' +
  'Bahan harus umum di Indonesia; utamakan BAHAN YANG SUDAH DIBELI bila cocok. RENCANA MENU HARI INI hanya rencana, bukan catatan makan. ' +
  'DILARANG menulis angka kalori atau protein per hidangan; tulis porsi dengan kata (satu, dua, setengah) dan satuan rumah tangga (piring, butir, potong, mangkuk), bukan angka. ' +
  'Kamu hanya menyarankan: jangan menyuruh mengubah catatan atau rencana. Jangan menyarankan diet ekstrem atau suplemen. Jangan menyebut angka atau fakta yang tidak ada di DATA. ' +
  'Bahasa Indonesia, teks biasa tanpa judul markdown, tabel, atau tanda tebal. Bukan diagnosis. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
const NAI_KRAM_SYS = 'Kamu menjelaskan pola kram kaki di aplikasi catatan kebugaran milik satu orang. Semua angka sudah dihitung aplikasi di DATA; tugasmu hanya menjelaskan dan menyarankan. ' +
  'Format: satu paragraf 2 sampai 3 kalimat yang menyebut pola paling jelas dari DATA (bagian tubuh, jam, atau durasi yang paling sering, dan tren bila bukan "belum cukup"), lalu satu baris "Yang bisa dicoba:" disusul satu atau dua poin (satu kalimat tiap poin, diawali "- "). ' +
  'Perbandingan hari kram dan hari tanpa kram menunjukkan dua hal bergerak bersama, BUKAN sebab: jangan menyebut sebab. Bagian yang berstatus belum dihitung: katakan belum cukup data. ' +
  'TANDA BAHAYA mengikuti hasil aplikasi: bila MENYALA, jawaban WAJIB menyarankan periksa ke dokter dengan menyebut alasannya dari DATA; bila TIDAK menyala, jangan membuat ambang sendiri dan jangan menakut-nakuti. ' +
  'Bila DATA menyebut kejadian masih sedikit, sebut itu "petunjuk awal, bukan kesimpulan". ' +
  'Saran umum yang boleh: cukup minum, makanan sumber garam, kalium, atau magnesium, peregangan ringan, tidur cukup. DILARANG menyebut obat, suplemen, atau dosis. Jangan menyebut angka atau fakta yang tidak ada di DATA. ' +
  'Bahasa Indonesia, teks biasa tanpa judul markdown, tabel, atau tanda tebal. Bukan diagnosis: kram disertai bengkak sepihak, nyeri dada, pusing berat, atau pingsan = temui dokter. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
Object.assign(BR_TITLE, { menu: '✦ Ide menu', cramp: '✦ Pola kram' });
Object.assign(FC_NOUN, { menu: 'ide menu', cramp: 'pola kram' });
Object.assign(FC_AUTO, { menu: 'Susun tiga ide menu untuk waktu makan berikutnya', cramp: 'Jelaskan pola kramku' });
Object.assign(FC_FOLLOW, {
  menu: 'Ini obrolan Ide menu: pengguna bertanya tentang ide makan hari ini, dan DATA berisi hitungan yang sudah dihitung aplikasi (target, sisa, PROFIL SISA, rencana menu hari ini, bahan yang sudah dibeli). ' +
    'Jawab hanya dari DATA dan obrolan sebelumnya; jangan menghitung ulang atau menambah angka. Ikuti PROFIL SISA: bila kalori sudah di batas atau lewat, jangan menyarankan makanan. ' +
    'Jangan menulis kalori atau protein per hidangan; tulis porsi dengan kata dan satuan rumah tangga. Jangan menyarankan diet ekstrem atau suplemen. Kamu hanya menyarankan: jangan menyuruh mengubah catatan atau rencana.',
  cramp: 'Ini obrolan Pola kram: pengguna bertanya tentang kram kakinya sendiri, dan DATA berisi hitungan yang sudah dihitung aplikasi (ringkasan, sebaran, perbandingan, tren, TANDA BAHAYA). ' +
    'Jawab hanya dari DATA dan obrolan sebelumnya; jangan menghitung ulang atau menambah angka. Perbandingan = dua hal bergerak bersama, bukan sebab. ' +
    'TANDA BAHAYA mengikuti aplikasi: bila menyala, sarankan periksa ke dokter dengan menyebut alasannya; bila tidak, jangan membuat ambang sendiri atau menakut-nakuti. Tidak ada obat, suplemen, atau dosis. ' +
    'Bukan diagnosis: kram disertai bengkak sepihak, nyeri dada, pusing berat, atau pingsan = temui dokter.'
});
Object.assign(FC_CHIPS, {
  menu: ['Ide yang lebih tinggi protein?', 'Ide camilan saja', 'Yang cepat dimasak?'],
  cramp: ['Apa yang bisa kucoba?', 'Kapan harus ke dokter?', 'Apakah air putihku berpengaruh?']
});
Object.assign(FC_CTX, { menu: 'Sisa kalori dan protein hari ini + menu', cramp: 'Kram 30 dan 90 hari' });

/* --- mesin lokal (murni; membaca db, kdb, mpDb, profil target) --- */
function naiSisa(t) {   // sisa kalori/protein hari t dan profilnya; kalori/protein yang belum tercatat dihitung nol
  t = t || today();
  const e = db[t], T = tgFor(t), c100 = v => Math.round(v * 100);
  const k = e ? num(e.kcal) : null, p = e ? num(e.protein) : null;
  const range = T.mode === 'range', hi = range ? T.kcalHi : T.kcal, lo = range ? T.kcal : null;
  const kl = Math.max(0, c100(hi) - c100(k == null ? 0 : k)), pl = Math.max(0, c100(T.protein) - c100(p == null ? 0 : p));
  const ll = lo == null ? null : Math.max(0, c100(lo) - c100(k == null ? 0 : k));
  let profile;
  if (kl <= 0) profile = 'stop';
  else if (pl * 4 * 100 >= kl * NAI_HIGH) profile = 'tinggi';
  else if (pl * 4 * 100 >= kl * NAI_LOW) profile = 'seimbang';
  else profile = 'longgar';
  return { date: t, range, hi, lo, protein: T.protein, refeed: !!T.refeed, eatenK: k, eatenP: p, leftHi: kl / 100, leftLo: ll == null ? null : ll / 100, leftP: pl / 100, profile, protDone: pl <= 0, slot: autoSlot() };
}
function naiTren() {   // kejadian 14 hari terakhir (A) vs 14 hari sebelumnya (B); hanya kejadian detail
  const t = today(), a0 = addDays(t, -13), b0 = addDays(t, -27), b1 = addDays(t, -14);
  let A = 0, B = 0;
  kjDays().forEach(d => { if (d > t) return; const n = kjCount(d); if (d >= a0) A += n; else if (d >= b0 && d <= b1) B += n; });
  const st = A + B < NAI_TREND_MIN ? 'belum' : (A >= B + NAI_TREND_GAP && A * 2 > B * 3) ? 'naik' : (B >= A + NAI_TREND_GAP && B * 2 > A * 3) ? 'turun' : 'sama';
  return { a: A, b: B, st };
}
function naiBahaya(P30, tr) {   // P30 = kpPat(30), tr = naiTren(); menyala bila satu syarat terpenuhi
  P30 = P30 || kpPat(30); tr = tr || naiTren();
  const lr = P30.durs.find(r => r.k === 'k99'), long = lr ? lr.n : 0, reasons = [];
  if (P30.heavy >= KP_HEAVY_MIN) reasons.push('kejadian berat ' + P30.heavy + ' dalam 30 hari (batas ' + KP_HEAVY_MIN + ')');
  if (tr.st === 'naik') reasons.push('tren naik: ' + tr.a + ' kejadian dalam 14 hari terakhir dibanding ' + tr.b + ' pada 14 hari sebelumnya');
  if (long >= NAI_LONG_MIN) reasons.push('kejadian lebih dari 15 menit ' + long + ' dalam 30 hari (batas ' + NAI_LONG_MIN + ')');
  return { on: reasons.length > 0, reasons, heavy: P30.heavy, long, trend: tr.st };
}
const naiSlotLabel = s => (MP_SLOT.find(x => x[0] === s) || [s, s])[1];

/* --- konteks AI (semua dihitung lokal) --- */
function naiMenuCtx() {
  const t = today();
  if (!aiOn('gizi')) return b14Fail('Grup data Gizi belum dicentang di Pengaturan AI, jadi AI tidak boleh memakai catatan makan dan targetmu. AI tidak dipanggil. Centang grup Gizi dulu.', true);
  const S = naiSisa(t), T = tgFor(t), P = [], sec = (h, L) => { if (L && L.length) P.push(h + ':\n' + L.map(x => '- ' + x).join('\n')); };
  P.push('HARI INI: ' + dayLong(t) + '.' + aiHead(t));
  sec('TARGET HARI INI', ['kalori ' + (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ' kcal' + (T.refeed ? ' (hari refeed)' : ''), 'protein ' + aiN(T.protein) + ' g']);
  const eat = [(S.eatenK != null ? 'kalori ' + aiN(S.eatenK) + ' kcal' : 'kalori belum tercatat (dihitung nol)') + '; ' + (S.eatenP != null ? 'protein ' + aiN(S.eatenP, 1) + ' g' : 'protein belum tercatat (dihitung nol)')];
  const ml = aiMealLine(t); if (ml) eat.push(ml);
  sec('SUDAH DIMAKAN (log hari ini)', eat);
  const left = [S.leftHi > 0 ? 'sisa kalori sampai ' + (S.range ? 'batas atas rentang' : 'batas') + ': ' + aiN(S.leftHi) + ' kcal' : 'kalori sudah di ' + (S.range ? 'batas atas rentang' : 'batas') + ' atau lewat (sisa 0 kcal)'];
  if (S.range) left.push(S.leftLo > 0 ? 'sisa kalori sampai batas bawah rentang: ' + aiN(S.leftLo) + ' kcal' : 'batas bawah rentang sudah tercapai');
  left.push(S.leftP > 0 ? 'sisa protein sampai target: ' + aiN(S.leftP, 1) + ' g' : 'protein sudah tercapai (sisa 0 g)');
  sec('SISA (dihitung aplikasi; ikuti)', left);
  const prof = { stop: 'kalori hari ini sudah di batas atau lewat: hanya boleh menyarankan minuman tanpa kalori atau berhenti makan, JANGAN menyarankan makanan',
    tinggi: 'lauk tinggi protein dan rendah lemak (sebagian besar sisa kalori harus berasal dari protein)',
    seimbang: 'porsi seimbang: lauk berprotein ditambah karbohidrat dan sayur',
    longgar: 'protein longgar: sisa protein kecil dibanding sisa kalori, bebas memilih' }[S.profile];
  const pl = [prof]; if (S.protDone && S.profile !== 'stop') pl.push('protein hari ini sudah tercapai; tidak perlu menambah protein');
  sec('PROFIL SISA (hasil aturan aplikasi; ikuti, jangan menilai sendiri)', pl);
  sec('WAKTU MAKAN BERIKUTNYA (menurut jam sekarang)', [naiSlotLabel(S.slot)]);
  sec('RENCANA MENU HARI INI (hanya rencana, bukan catatan makan)', mpOrdered(t).map(x => naiSlotLabel(x.t) + ': ' + aiTxt(x.n, NAI_PLAN_LEN) + ([x.k != null && aiN(x.k) + ' kcal', x.p != null && aiN(x.p, 1) + ' g protein'].filter(Boolean).length ? ' (' + [x.k != null && aiN(x.k) + ' kcal', x.p != null && aiN(x.p, 1) + ' g protein'].filter(Boolean).join(', ') + ')' : '')));
  sec('BAHAN YANG SUDAH DIBELI (utamakan bila cocok)', mpDb.shop.it.filter(x => x.done).slice(0, NAI_SHOP_MAX).map(x => aiTxt(x.n, NAI_SHOP_LEN)));
  const body = P.join('\n\n'), user = body + '\n\nTulis tiga ide menu untuk waktu makan berikutnya.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}
function naiDistLine(label, rows) { return rows.length ? label + ': ' + rows.map(r => r.label + ' ' + r.n + ' (' + r.pct + '%)').join(', ') : ''; }
function naiCmpLine(name, c, dec, unit) {
  if (c.st === 'few') return name + ': belum dihitung, baru ' + c.n + ' hari berpasangan (minimal ' + HX_MIN_N + ')';
  if (c.st === 'groups') return name + ': belum dihitung, baru ' + c.nK + ' hari kram dan ' + c.nN + ' hari tanpa kram (minimal ' + HX_GRP_MIN + ' masing-masing)';
  const dz = Math.round(Math.abs(c.diff) * Math.pow(10, dec)) === 0;
  return name + ': rata-rata hari kram ' + aiN(c.avgK, dec) + ' ' + unit + ' (' + c.nK + ' hari), hari tanpa kram ' + aiN(c.avgN, dec) + ' ' + unit + ' (' + c.nN + ' hari), selisih ' + aiN(Math.abs(c.diff), dec) + ' ' + unit +
    (dz ? ' (sama)' : c.diff > 0 ? ' (hari kram lebih tinggi)' : ' (hari kram lebih rendah)') + '; dua hal bergerak bersama, bukan sebab' + (c.warn ? '; data masih sedikit (' + c.n + ' hari), anggap petunjuk awal' : '');
}
function naiKramCtx() {
  const t = today();
  if (!aiOn('kram')) return b14Fail('Grup data Kram belum dicentang di Pengaturan AI, jadi AI tidak boleh memakai catatan kramnya. AI tidak dipanggil. Centang grup Kram dulu.', true);
  const P30 = kpPat(30), P90 = kpPat(90), days90 = P90.days + P90.legacy;
  if (days90 < NAI_MIN_DAYS) return b14Fail('Data belum cukup: baru ' + days90 + ' hari kram tercatat dalam 90 hari terakhir (minimal ' + NAI_MIN_DAYS + '). AI tidak dipanggil supaya tidak mengarang. Catat kejadian kram di Jurnal dulu.', false);
  const tr = naiTren(), bh = naiBahaya(P30, tr), P = [], sec = (h, L) => { L = (L || []).filter(Boolean); if (L.length) P.push(h + ':\n' + L.map(x => '- ' + x).join('\n')); };
  P.push('HARI INI: ' + dayLong(t) + '.');
  const sumLine = (lbl, X) => lbl + ': ' + X.events + ' kejadian dalam ' + X.days + ' hari berkejadian' + (X.legacy ? '; ' + X.legacy + ' hari kram lama tanpa detail' : '');
  sec('RINGKASAN KRAM', [sumLine('30 hari terakhir', P30), sumLine('90 hari terakhir', P90)]);
  if (P90.events) {
    sec('SEBARAN KEJADIAN (90 hari terakhir)', [naiDistLine('bagian tubuh', P90.parts), naiDistLine('jam kejadian', P90.hours), naiDistLine('durasi', P90.durs), naiDistLine('intensitas', P90.ints),
      P90.avgI == null ? '' : 'intensitas rata-rata ' + aiN(P90.avgI, 1) + ' dari 3 (dari ' + P90.nI + ' kejadian yang punya intensitas)']);
  }
  const cmp = [];
  if (aiOn('gizi')) cmp.push(naiCmpLine('air putih', P90.cmp.water, 2, 'L'));
  if (aiOn('tidur')) cmp.push(naiCmpLine('tidur', P90.cmp.sleep, 1, 'jam'));
  cmp.push(naiCmpLine('ceklis elektrolit (butir selesai dari ' + ELEC.length + ')', P90.cmp.elec, 1, 'butir'));
  bzKpRideAi(P90).forEach(x => cmp.push(x));
  sec('PERBANDINGAN HARI KRAM DAN HARI TANPA KRAM, 90 hari terakhir (dua hal bergerak bersama, bukan sebab)', cmp);
  sec('TREN KEJADIAN (hasil aturan aplikasi)', [tr.st === 'belum' ? 'belum cukup untuk menilai tren (total ' + (tr.a + tr.b) + ' kejadian dalam 28 hari; minimal ' + NAI_TREND_MIN + ')' :
    '14 hari terakhir ' + tr.a + ' kejadian, 14 hari sebelumnya ' + tr.b + ' kejadian: ' + tr.st]);
  sec('TANDA BAHAYA (hasil aturan aplikasi; ikuti, jangan membuat ambang sendiri)', [bh.on ?
    'MENYALA. Alasan: ' + bh.reasons.join('; ') + '. Jawaban WAJIB menyarankan periksa ke dokter dengan menyebut alasan ini.' :
    'TIDAK menyala (kejadian berat ' + bh.heavy + ' dari batas ' + KP_HEAVY_MIN + ' dalam 30 hari; kejadian lebih dari 15 menit ' + bh.long + ' dari batas ' + NAI_LONG_MIN + '; tren ' + tr.st + '). Jangan menakut-nakuti.']);
  if (P90.events < HX_MIN_N) sec('CATATAN', ['kejadian dalam 90 hari baru ' + P90.events + ' (kurang dari ' + HX_MIN_N + '): sebut ini "petunjuk awal, bukan kesimpulan"']);
  const body = P.join('\n\n'), user = body + '\n\nJelaskan pola kramku dan saran yang aman.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}

/* --- tampilan --- */
function naiEmptyHTML(kind) {
  if (kind === 'tk') return tkEmptyHTML();
  const m = kind === 'menu', c = m ? naiMenuCtx() : naiKramCtx();
  let h = '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>' + (m ? 'Ide menu' : 'Pola kram') + '</h4><p class="note">' +
    esc(m ? 'Tiga ide makan untuk waktu makan berikutnya, dari sisa kalori dan protein hari ini. Angka dihitung di perangkat ini; AI hanya menyarankan hidangan, tidak mengubah catatan atau menu. Bukan diagnosis.' :
      'Penjelasan singkat pola kramku dari kejadian yang kamu catat. Angka dihitung di perangkat ini; AI hanya menjelaskan dan menyarankan, tidak mengubah catatan. Bukan diagnosis.') + '</p>';
  if (c.empty) h += '<p class="note"><b>' + esc(c.emptyMsg) + '</b></p>' + (c.emptyBtn ? '<div class="quick"><button class="btn primary" data-q="fcSettings">Buka pengaturan AI</button></div>' : '');
  else h += '<div class="quick"><button class="btn primary" data-q="fcGen">' + (m ? 'Susun ide menu' : 'Jelaskan pola kram') + '</button></div>' +
    '<div class="csug">' + FC_CHIPS[kind].map(x => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div><p class="note">Atau tulis pertanyaanmu di bawah.</p>';
  return h + '</div>';
}
const naiRowMenu = () => adb.on ? '<div class="aibtn" id="naiMenuRow"><button class="btn sm" data-q="naiMenu">✦ Ide menu hari ini</button></div>' : '';
const naiRowKram = () => adb.on ? '<div class="aibtn" id="naiKramRow"><button class="btn sm" data-q="naiKram">✦ Tanya pola kram</button></div>' : '';
let naiOn = false;
function naiSync() {   // menyalakan/mematikan AI menggambar ulang Nutrisi bila sedang terbuka (baris AI hanya ada saat AI nyala)
  const on = !!adb.on; if (on === naiOn) return; naiOn = on;
  if (curView === 'nutrition') renderNutrition();
}

/* --- aksi --- */
QACT.naiMenu = () => { fcOpen('menu'); if (fcKind === 'menu' && !fcHasChat(FC.menu)) fcFirst('menu'); };
QACT.naiKram = () => { fcOpen('cramp'); if (fcKind === 'cramp' && !fcHasChat(FC.cramp)) fcFirst('cramp'); };
function naiPeek() {
  if (fcKind === 'tk') { tkPeek(); return; }
  const k = fcKind, c = homeAiCtx(k);
  openSheet({ title: 'Data yang akan dikirim', note: c.empty ? c.emptyMsg : 'Hanya teks ini, pertanyaanmu, dan obrolan di layar ini yang dikirim. Angka dihitung di perangkat ini; grup data yang tidak dicentang di Pengaturan AI tidak ikut. ' +
    (k === 'menu' ? 'Profil, berat badan, usia, skor harian, favorit, dan menu pekan lain tidak dikirim.' : 'Catatan kejadian kram dan teks bebas tidak pernah dikirim; hanya isian terstruktur (bagian, jam, durasi, intensitas).'),
    text: c.empty ? '' : c.body, prose: true, actions: [closeBtn] });
}
{
  const _p = QACT.fcPeek;
  QACT.fcPeek = () => naiK(fcKind) ? naiPeek() : _p();
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b18d: Object.freeze({ menuCtx: naiMenuCtx, kramCtx: naiKramCtx, sisa: naiSisa, tren: naiTren, bahaya: naiBahaya, slot: () => autoSlot(), slotLabel: naiSlotLabel,
  rowMenu: naiRowMenu, rowKram: naiRowKram, empty: naiEmptyHTML, sysMenu: NAI_MENU_SYS, sysKram: NAI_KRAM_SYS, fcl: k => FC_FOLLOW[k], chips: k => FC_CHIPS[k].slice(), isKind: naiK,
  lim: Object.freeze({ MIN_DAYS: NAI_MIN_DAYS, TREND_MIN: NAI_TREND_MIN, TREND_GAP: NAI_TREND_GAP, LONG_MIN: NAI_LONG_MIN, SHOP_MAX: NAI_SHOP_MAX, SHOP_LEN: NAI_SHOP_LEN, PLAN_LEN: NAI_PLAN_LEN, HIGH: NAI_HIGH, LOW: NAI_LOW }) }) }));

/* ===== MODUL: KALENDER KONTEN (batch 19, langkah 19a) ===== */
// Kalender konten TikTok: ide -> rekam -> posting. Data baru `dailylog:content:v1`, ikut cadangan JSON (kunci `content`).
// Lokal murni: tanpa AI dan tanpa jaringan. Modul ini TIDAK menulis ke db/wdb/pdb/tdb/cdb/edb/fdb/kdb/mpDb dan tidak mengubah skrip 30 detik lama (Batch 6).
// Bentuk data: { it: { '<id>': {id, t, s, d, h, sc, cp, ht, nt, u} | {id, u, x: true} } }. `u` = waktu ubah; `x` = penanda hapus.
// Impor memakai aturan "versi lebih baru (u lebih besar) menang per id", jadi item yang dihapus di perangkat ini tidak hidup lagi dari cadangan lama.
const KEY_CN = 'dailylog:content:v1';
const CN_ST = [['ide', 'Ide'], ['rekam', 'Rekam'], ['posting', 'Posting']];
const CN_MAX = 150, CN_DEL_MAX = 100, CN_LIM = { t: 80, h: 160, sc: 1200, cp: 300, ht: 150, nt: 200 };
let cnDb = { it: {} };
let cnTab = 'skrip', cnMonth = '', cnSel = '', cnFlt = 'all', cnForm = null;   // hanya di memori
STORES.cn = { key: KEY_CN, get: () => cnDb }; dirty.cn = false;   // ikut ekspor JSON versi 4 (kunci `content`)

const cnTxt = (v, n, nl) => {
  let s = typeof v === 'string' ? v : (typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
  s = nl ? s.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, n).trim();
};
const cnId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(v) && !(v in Object.prototype) ? v : '';
const cnUpd = v => { const u = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : 0); return Number.isFinite(u) && u > 0 && u < 8.64e15 ? Math.floor(u) : 0; };
const cnDateOk = d => typeof d === 'string' && DATE_RE.test(d) && ymd(pd(d)) === d;
function cnUid(id, seen) {
  let n = 0;
  while (!id || seen.has(id) || id in Object.prototype) id = ('c' + Math.random().toString(36).slice(2, 9) + (n++).toString(36)).slice(0, 24);
  return id;
}
function cnTags(v) {   // hashtag: huruf/angka/garis bawah, diawali #, tanpa duplikat (huruf besar/kecil dianggap sama), <= 150 huruf, tidak memotong tagar di tengah
  const s = typeof v === 'string' ? v : '', seen = new Set(), out = [];
  (s.match(/[^\s,;]+/g) || []).forEach(x => {
    const w = x.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
    if (!w) return; const k = w.toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push('#' + w);
  });
  let r = '';
  for (const t of out) { if ((r ? r.length + 1 : 0) + t.length > CN_LIM.ht) break; r += (r ? ' ' : '') + t; }
  return r;
}
function cnItem(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const id = cnId(r.id), u = cnUpd(r.u);
  if (r.x === true) return { id, u, x: true };
  const t = cnTxt(r.t, CN_LIM.t); if (!t) return null;
  return { id, t, s: CN_ST.some(x => x[0] === r.s) ? r.s : 'ide', d: cnDateOk(r.d) ? r.d : '', h: cnTxt(r.h, CN_LIM.h), sc: cnTxt(r.sc, CN_LIM.sc, true), cp: cnTxt(r.cp, CN_LIM.cp, true), ht: cnTags(r.ht), nt: cnTxt(r.nt, CN_LIM.nt), u };
}
function cnClean(raw) {
  const o = { it: {} };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  const src = raw.it && typeof raw.it === 'object' && !Array.isArray(raw.it) ? raw.it : {};
  const act = [], del = [], seen = new Set();
  Object.keys(src).forEach(k => {
    const e = cnItem(src[k]); if (!e) return;
    if (!e.id) e.id = cnId(k);
    if (e.x) { if (!e.id || seen.has(e.id)) return; seen.add(e.id); del.push(e); return; }
    e.id = cnUid(e.id, seen); seen.add(e.id); act.push(e);
  });
  act.sort((a, b) => b.u - a.u).slice(0, CN_MAX).concat(del.sort((a, b) => b.u - a.u).slice(0, CN_DEL_MAX)).forEach(e => { o.it[e.id] = e; });
  return o;
}
function cnLoad(raw) {   // gabungkan data tersimpan dengan yang sempat diketik saat muat (pola cdb/kdb/mpDb): yang di memori menang
  const l = cnClean(raw); cnDb.it = Object.assign(l.it, cnDb.it);
}
function cnTrim() {   // batas jumlah setelah impor: yang paling lama diubah dibuang
  const all = Object.keys(cnDb.it).map(k => cnDb.it[k]), o = {};
  all.filter(e => !e.x).sort((a, b) => b.u - a.u).slice(0, CN_MAX).concat(all.filter(e => e.x).sort((a, b) => b.u - a.u).slice(0, CN_DEL_MAX)).forEach(e => { o[e.id] = e; });
  cnDb.it = o;
}
const cnActive = () => Object.keys(cnDb.it).map(k => cnDb.it[k]).filter(e => e && !e.x);
const cnStLabel = s => (CN_ST.find(x => x[0] === s) || [s, s])[1];
const cnRank = e => (e.s === 'posting' && e.d && e.d < today()) ? 2 : (e.d ? 0 : 1);   // 0 bertanggal (akan datang/terlewat), 1 belum dijadwalkan, 2 sudah diposting dan lewat
function cnSorted(flt, sel) {
  let L = cnActive();
  if (flt && flt !== 'all') L = L.filter(e => e.s === flt);
  if (sel) L = L.filter(e => e.d === sel);
  const so = { ide: 0, rekam: 1, posting: 2 };
  return L.sort((a, b) => cnRank(a) - cnRank(b) || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || so[a.s] - so[b.s] || b.u - a.u);
}
const cnByDate = () => { const by = {}; cnActive().forEach(e => { if (e.d) (by[e.d] = by[e.d] || []).push(e); }); return by; };
const cnNewId = () => cnUid('', new Set(Object.keys(cnDb.it)));

/* --- tampilan --- */
const cnMonthNow = () => hxMs(today());
function cnCalMonth() {
  let m = cnMonth || cnMonthNow(); const lo = hxShift(cnMonthNow(), -12), hi = hxShift(cnMonthNow(), 24);
  if (m < lo) m = lo; if (m > hi) m = hi; return m;
}
function cnCellLabel(d, L) {
  return dayLong(d) + ': ' + (L.length ? L.length + ' konten (' + CN_ST.filter(s => L.some(e => e.s === s[0])).map(s => L.filter(e => e.s === s[0]).length + ' ' + s[1].toLowerCase()).join(', ') + ')' : 'belum ada konten');
}
function cnRowHTML(e) {
  const late = e.d && e.d < today() && e.s !== 'posting';
  const meta = [e.d ? dayShort(e.d) : 'Belum dijadwalkan', late ? 'tanggal sudah lewat' : '', srRowMeta(e), e.sc ? tkWords(e.sc) + ' kata' : ''].filter(Boolean).join(' · ');
  return '<button class="cnrow" data-q="cnEdit" data-id="' + esc(e.id) + '"><span class="cnst s-' + e.s + '">' + esc(cnStLabel(e.s)) + '</span><span class="cnti">' + esc(e.t) + '</span><small>' + esc(meta) + '</small></button>';
}
function cnListHTML() {
  const L = cnSorted(cnFlt, cnSel); let h = '';
  if (cnSel) h += '<p class="note">Menampilkan konten ' + esc(dayShort(cnSel)) + '. <button class="btn sm ghost" data-q="cnSelClr">Semua tanggal</button></p>';
  if (!L.length) return h + '<p class="note">' + (cnActive().length ? 'Tidak ada konten untuk pilihan ini.' : 'Belum ada konten. Ketuk + Ide konten, atau simpan skrip dari tab Skrip.') + '</p>';
  return h + L.map(cnRowHTML).join('');
}
function cnCalHTML() {
  const ms = cnCalMonth(), [y, m] = ms.split('-').map(Number), t = today(), act = cnActive(), by = cnByDate();
  const nd = new Date(y, m, 0).getDate(), lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  let g = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => '<div class="hxdow" aria-hidden="true">' + x + '</div>').join('');
  for (let i = 0; i < lead; i++) g += '<div class="cnc pad" aria-hidden="true"></div>';
  for (let i = 1; i <= nd; i++) {
    const d = ms.slice(0, 8) + pad(i), L = by[d] || [];
    const dots = CN_ST.filter(s => L.some(e => e.s === s[0])).map(s => '<i class="s-' + s[0] + '"></i>').join('');
    g += '<button class="cnc' + (d === t ? ' tdy' : '') + (d === cnSel ? ' sel' : '') + (srTheme(d) ? ' thm' : '') + '" data-q="cnDay" data-cd="' + d + '" aria-pressed="' + (d === cnSel) + '" aria-label="' + esc(cnCellLabel(d, L) + srCellNote(d)) + '"><span>' + i + '</span><span class="cnd">' + dots + '</span></button>';
  }
  const cnt = { all: act.length }; CN_ST.forEach(s => { cnt[s[0]] = act.filter(e => e.s === s[0]).length; });
  const flt = '<div class="cnflt" role="group" aria-label="Tahap konten">' + [['all', 'Semua']].concat(CN_ST).map(x => '<button class="pill" data-q="cnFlt" data-v="' + x[0] + '" aria-pressed="' + (cnFlt === x[0]) + '"><span>' + x[1] + '</span><small>' + cnt[x[0]] + '</small></button>').join('') + '</div>';
  const lo = hxShift(cnMonthNow(), -12), hi = hxShift(cnMonthNow(), 24);
  const leg = CN_ST.map(s => '<span><i class="s-' + s[0] + '"></i>' + s[1] + '</span>').join('');
  return '<section class="sec"><h2>Kalender konten</h2>' + flt +
    '<div class="hxmon"><button class="arrow" data-q="cnMon" data-v="-1" aria-label="Bulan sebelumnya"' + (ms <= lo ? ' disabled' : '') + '>‹</button><h2 aria-live="polite">' + BULAN[m - 1] + ' ' + y + '</h2>' +
    '<button class="arrow" data-q="cnMon" data-v="1" aria-label="Bulan berikutnya"' + (ms >= hi ? ' disabled' : '') + '>›</button></div>' +
    '<div class="cngrid">' + g + '</div><div class="cnleg">' + leg + '</div>' +
    '<div class="aibtn" style="margin-top:12px"><button class="btn primary" data-q="cnNew">+ Ide konten</button></div></section>' + srSecHTML() + rkpSecHTML() +
    '<section class="sec"><h2>Daftar</h2><div id="cnList">' + cnListHTML() + '</div></section>';
}
function cnRender() {
  const n = cnActive().length;
  const seg = '<div class="seg cnseg" role="group" aria-label="Bagian Konten">' + [['skrip', 'Skrip'], ['latih', 'Latihan'], ['cam', 'Rekam'], ['ide', 'Ide' + (bnkTabN() ? ' (' + bnkTabN() + ')' : '')], ['kal', 'Kalender' + (n ? ' (' + n + ')' : '')], ['stat', 'Statistik']].map(x => '<button class="pill" data-q="cnTab" data-v="' + x[0] + '" aria-pressed="' + (cnTab === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
  if (cnTab === 'latih') { $('#tkBody').innerHTML = seg + spHTML(); spAfterPaint(); return; }
  if (cnTab === 'cam') { $('#tkBody').innerHTML = seg + cmHTML(); cmAfter(); return; }
  if (cnTab === 'ide') { $('#tkBody').innerHTML = seg + bnkHTML(); bnkAfter(); return; }
  if (cnTab === 'stat') { $('#tkBody').innerHTML = seg + abStatHTML(); tsxAfter(); return; }
  if (cnTab === 'kal') { $('#tkBody').innerHTML = seg + cnCalHTML(); tsxSegSoon(); return; }
  $('#tkBody').innerHTML = seg + tkCtrlHTML(); tkVnPaint(); tkOutPaint(); tkBarFix();
}
const cnPaint = () => { if (curView === 'content') cnRender(); };
const cnFocus = sel => { const b = $(sel); if (b) b.focus(); };

/* --- sheet isian --- */
function cnFormHTML(f) {
  const st = CN_ST.map(s => '<button class="pill" data-q="cnSt" data-v="' + s[0] + '" aria-pressed="' + (f.s === s[0]) + '">' + s[1] + '</button>').join('');
  return '<div class="cnf"><div class="lbl">Judul / ide</div><label class="inp"><input id="cnfT" maxlength="' + CN_LIM.t + '" autocomplete="off" style="font-size:calc(16px * var(--fs))" placeholder="Mis. Hari ke-12, jujur soal kram" value="' + esc(f.t) + '"></label></div>' +
    '<div class="cnf"><div class="lbl">Tahap</div><div class="seg" role="group" aria-label="Tahap">' + st + '</div></div>' +
    '<div class="cnf"><div class="lbl">Tanggal rencana <small>boleh kosong</small></div><div class="cnd2"><label class="inp"><input type="date" id="cnfD" style="font-size:calc(16px * var(--fs))" value="' + esc(f.d) + '"></label><button class="btn sm ghost" data-q="cnDClr">Kosongkan</button></div></div>' +
    '<div class="cnf"><div class="lbl">Hook <small>kalimat pembuka</small></div><textarea class="ta" id="cnfH" rows="2" maxlength="' + CN_LIM.h + '">' + esc(f.h) + '</textarea></div>' +
    '<div class="cnf"><div class="lbl">Skrip</div><textarea class="ta" id="cnfS" rows="6" maxlength="' + CN_LIM.sc + '">' + esc(f.sc) + '</textarea><div class="mtxt" id="cnfW"></div></div>' +
    '<div class="cnf"><div class="lbl">Caption</div><textarea class="ta" id="cnfC" rows="2" maxlength="' + CN_LIM.cp + '">' + esc(f.cp) + '</textarea></div>' +
    '<div class="cnf"><div class="lbl">Hashtag</div><label class="inp"><input id="cnfG" maxlength="' + CN_LIM.ht + '" autocomplete="off" autocapitalize="none" style="font-size:calc(16px * var(--fs))" placeholder="#kalistenik #cutting" value="' + esc(f.ht) + '"></label></div>' +
    srFormHTML() + '<div class="cnf"><div class="lbl">Catatan</div><label class="inp"><input id="cnfN" maxlength="' + CN_LIM.nt + '" autocomplete="off" style="font-size:calc(16px * var(--fs))" value="' + esc(f.nt) + '"></label></div>';
}
function cnWordPaint() {
  const el = $('#cnfS'), o = $('#cnfW'); if (!el || !o) return;
  const w = tkWords(el.value);
  o.textContent = w ? w + ' kata, sekitar ' + Math.round(w / TK_WPS) + ' detik jika dibaca (' + spWpsNote() + ').' : 'Belum ada skrip.';
}
function cnRead() {
  const g = id => { const el = $('#' + id); return el ? el.value : ''; };
  return { t: cnTxt(g('cnfT'), CN_LIM.t), d: cnDateOk(g('cnfD')) ? g('cnfD') : '', h: cnTxt(g('cnfH'), CN_LIM.h), sc: cnTxt(g('cnfS'), CN_LIM.sc, true), cp: cnTxt(g('cnfC'), CN_LIM.cp, true), ht: cnTags(g('cnfG')), nt: cnTxt(g('cnfN'), CN_LIM.nt) };
}
function cnOpen(id, init, note) {
  const cur = id ? cnDb.it[id] : null;
  if (id && (!cur || cur.x)) { toast('Konten tidak ditemukan'); return; }
  if (!id && cnActive().length >= CN_MAX) { toast('Maksimal ' + CN_MAX + ' konten. Hapus yang lama dulu.'); return; }
  cnForm = cur ? Object.assign({}, cur) : Object.assign({ id: '', t: '', s: 'ide', d: cnSel || '', h: '', sc: '', cp: '', ht: '', nt: '' }, init || {});
  const acts = [closeBtn, { label: 'Simpan', primary: true, fn: () => cnSaveForm(false) }];
  if (cur) { acts.push({ label: 'Maju satu tahap', fn: () => cnSaveForm(true) }); acts.push({ label: 'Hapus', danger: true, fn: () => cnDelete(cur.id) }); }
  openSheet({ title: cur ? 'Ubah konten' : 'Ide konten baru', note: note || 'Alur: Ide, Rekam, lalu Posting. Hanya judul yang wajib.', extra: cnFormHTML(cnForm), actions: acts });
  cnWordPaint();
}
function cnSaveForm(advance) {
  const f = cnForm; if (!f) return;
  const v = cnRead();
  if (!v.t) { toast('Isi judulnya dulu'); cnFocus('#cnfT'); return; }
  const srE = srCheck(); if (srE) { toast(srE); return; }
  let s = f.s;
  if (advance) { const i = CN_ST.findIndex(x => x[0] === s); if (i >= CN_ST.length - 1) { toast('Sudah di tahap Posting'); return; } s = CN_ST[i + 1][0]; }
  const cur = f.id ? cnDb.it[f.id] : null;
  if (!f.id && cnActive().length >= CN_MAX) { toast('Maksimal ' + CN_MAX + ' konten. Hapus yang lama dulu.'); return; }
  const id = f.id || cnNewId();
  cnDb.it[id] = { id, t: v.t, s, d: v.d, h: v.h, sc: v.sc, cp: v.cp, ht: v.ht, nt: v.nt, u: Math.max(Date.now(), (cur ? cur.u : 0) + 1) };
  srOnSave(id); queueSave('cn'); cnForm = null; closeSheet(); cnPaint();
  toast(advance ? 'Dipindah ke ' + cnStLabel(s) : 'Tersimpan');
}
function cnDelete(id) {
  const prev = cnDb.it[id]; if (!prev || prev.x) return;
  cnDb.it[id] = { id, u: Math.max(Date.now(), prev.u + 1), x: true };
  queueSave('cn'); cnForm = null; closeSheet(); cnPaint();
  toast('Konten dihapus', { label: 'Urungkan', fn: () => { const t = cnDb.it[id]; cnDb.it[id] = Object.assign({}, prev, { u: Math.max(Date.now(), (t ? t.u : 0) + 1) }); queueSave('cn'); cnPaint(); } });
}

/* --- aksi --- */
QACT.cnTab = el => { spLeave(); cnTab = el.dataset.v === 'kal' ? 'kal' : el.dataset.v === 'latih' ? 'latih' : el.dataset.v === 'cam' ? 'cam' : el.dataset.v === 'stat' ? 'stat' : el.dataset.v === 'ide' ? 'ide' : 'skrip'; cnRender(); cnFocus('[data-q="cnTab"][data-v="' + cnTab + '"]'); };
QACT.cnMon = el => { const n = Number(el.dataset.v) === 1 ? 1 : -1; cnMonth = hxShift(cnCalMonth(), n); cnRender(); const b = $('[data-q="cnMon"][data-v="' + n + '"]'); if (b && !b.disabled) b.focus(); };
QACT.cnFlt = el => { cnFlt = ['all'].concat(CN_ST.map(x => x[0])).includes(el.dataset.v) ? el.dataset.v : 'all'; cnRender(); cnFocus('[data-q="cnFlt"][data-v="' + cnFlt + '"]'); };
QACT.cnDay = el => { const d = el.dataset.cd; if (!cnDateOk(d)) return; cnSel = cnSel === d ? '' : d; cnRender(); cnFocus('[data-cd="' + d + '"]'); };
QACT.cnSelClr = () => { cnSel = ''; cnRender(); };
QACT.cnNew = () => cnOpen('');
QACT.cnEdit = el => cnOpen(el.dataset.id);
QACT.cnSt = el => { if (!cnForm) return; cnForm.s = el.dataset.v; $$('#shExtra [data-q="cnSt"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === cnForm.s))); };
QACT.cnDClr = () => { const el = $('#cnfD'); if (el) el.value = ''; };
QACT.cnSaveScript = () => {
  if (cnActive().length >= CN_MAX) { toast('Maksimal ' + CN_MAX + ' konten. Hapus yang lama dulu.'); return; }
  const segs = tkSegs(), D = tkDay(), id = cnNewId();
  if (tkV.min) {
    const tx = tkMinText(); cnDb.it[id] = { id, t: cnTxt(D.n != null ? 'Minimum hari ke-' + D.n : 'Minimum ' + shortDate(today()), CN_LIM.t), s: 'ide', d: '', h: cnTxt(tx, CN_LIM.h), sc: cnTxt(tx, CN_LIM.sc, true), cp: '', ht: '', nt: cnTxt('Versi minimum: satu kalimat dan satu klip.', CN_LIM.nt), u: Date.now() };
    queueSave('cn'); renderContent(); toast('Versi minimum disimpan sebagai Ide di Kalender konten', { label: 'Buka', fn: () => { cnTab = 'kal'; cnRender(); } }); return;
  }
  cnDb.it[id] = { id, t: cnTxt(D.n != null ? 'Skrip hari ke-' + D.n : 'Skrip ' + shortDate(today()), CN_LIM.t), s: 'ide', d: '', h: cnTxt(segs[0].pub, CN_LIM.h), sc: cnTxt(segs.map(x => x.pub).filter(Boolean).join('\n\n'), CN_LIM.sc, true), cp: '', ht: '', nt: '', u: Date.now() };
  queueSave('cn'); renderContent();
  toast('Skrip disimpan sebagai Ide di Kalender konten', { label: 'Buka', fn: () => { cnTab = 'kal'; cnRender(); } });
};
document.addEventListener('input', ev => { if (ev.target && ev.target.id === 'cnfS') cnWordPaint(); });
window.DL = Object.freeze(Object.assign({}, window.DL, { b19a: Object.freeze({ clean: cnClean, tags: cnTags, dateOk: cnDateOk, list: () => cnActive().map(e => Object.assign({}, e)), all: () => JSON.parse(JSON.stringify(cnDb)),
  sorted: cnSorted, byDate: cnByDate, state: () => ({ tab: cnTab, month: cnCalMonth(), sel: cnSel, flt: cnFlt }), key: KEY_CN, st: CN_ST.map(x => x.slice()),
  lim: Object.freeze({ MAX: CN_MAX, DEL_MAX: CN_DEL_MAX, T: CN_LIM.t, H: CN_LIM.h, SC: CN_LIM.sc, CP: CN_LIM.cp, HT: CN_LIM.ht, NT: CN_LIM.nt }) }) }));

/* ===== MODUL: SKRIP NATURAL DENGAN AI (batch 19, langkah 19b) ===== */
// Jenis obrolan bubble baru 'tk' (✦ Skrip natural) di panel #fchat (mesin Batch 12-1/14/15b/16b/17c/18d: Ulangi, Salin, Baru, Lihat data, Berhenti, Coba lagi).
// Pintu masuk = satu baris tombol di tab Skrip pada tampilan Konten. Baris itu DIGAMBAR hanya bila AI nyala (adb.on); bila AI mati, tab Skrip sama persis dengan 19a.
// Ketukan tombol = izin panggilan dan langsung menyusun jawaban pertama (aturan AI 5).
// SEMUA fakta dihitung LOKAL (tkAiSegs): skrip 30 detik lokal Batch 6 yang disaring per grup data (Pengaturan AI). Grup tertutup = bagian itu diganti [isi: ...], bukan dihilangkan,
// supaya AI tidak mengarang pengganti. AI hanya menulis ulang menjadi bahasa lisan + tiga hook + caption + hashtag.
// Keluaran berlabel (HOOK A/B/C, SKRIP, CAPTION, HASHTAG) diurai lokal (tkParse). Simpan ke kalender = ketukan pengguna (AI tidak pernah menulis data sendiri).
// Skema data TIDAK berubah: item tersimpan memakai kolom 19a yang sama; peringatan angka masuk ke kolom catatan (nt). Kunci penyimpanan baru: tidak ada.
const TK_OUT_MAX = 2400;
const tkIsPh = s => /^\[[^\]]*\]$/.test(String(s).trim());   // segmen yang seluruhnya placeholder
Object.assign(BR_TITLE, { tk: '✦ Skrip natural' });
Object.assign(FC_NOUN, { tk: 'skrip' });
Object.assign(FC_AUTO, { tk: 'Susun skrip natural dari data hari ini' });
Object.assign(FC_FOLLOW, {
  tk: 'Ini obrolan Skrip natural: pengguna bertanya tentang skrip TikTok 30 detiknya sendiri, dan DATA berisi skrip lokal yang disusun aplikasi (satu-satunya sumber fakta). ' +
    'Jawab hanya dari DATA dan obrolan sebelumnya; jangan menambah angka atau fakta baru. Bagian yang masih [isi: ...] biarkan apa adanya. ' +
    'Bila diminta menulis ulang hook, skrip, atau caption, pakai label yang sama (HOOK A:, SKRIP:, CAPTION:, HASHTAG:) tanpa tanda tebal; hashtag tanpa angka. ' +
    'Jangan menjanjikan hasil atau mengarang klaim (mis. turun sekian kilo); tanpa saran medis.'
});
Object.assign(FC_CHIPS, { tk: ['Hook yang lebih singkat', 'Skripnya lebih santai', 'Caption lebih pendek'] });
Object.assign(FC_CTX, { tk: 'Skrip lokal hari ini + fakta yang diizinkan' });
const TK_SYS = 'Kamu membantu menulis konten TikTok pribadi dari catatan harian kebugaran milik satu orang. DATA berisi skrip lokal 30 detik yang sudah disusun aplikasi; itu SATU-SATUNYA sumber fakta. ' +
  'Tugasmu: menulis ulang skrip itu menjadi bahasa lisan yang natural, lalu menyiapkan tiga pilihan hook, satu caption, dan hashtag. ' +
  'Format WAJIB, persis enam label ini, tiap label di awal barisnya sendiri, tanpa judul lain, tanpa tanda tebal atau markdown, tanpa pembuka atau penutup: ' +
  '\"HOOK A:\" satu kalimat pembuka (maksimal 14 kata); \"HOOK B:\" varian lain; \"HOOK C:\" varian lain lagi; ' +
  '\"SKRIP:\" skrip lisan dalam empat bagian berurutan sesuai DATA (hook, progres, pelajaran, closing), panjang total mendekati jumlah kata di DATA, kalimat pendek seperti orang bicara; ' +
  '\"CAPTION:\" satu atau dua kalimat; \"HASHTAG:\" paling banyak 8 tagar huruf kecil dipisah spasi, tanpa angka. ' +
  'ATURAN KERAS: pakai hanya fakta dan angka yang tertulis di DATA. DILARANG menulis angka, berat, jumlah hari, atau durasi yang tidak ada di DATA; jangan menghitung atau membulatkan. ' +
  'Bagian DATA yang masih berupa [isi: ...] atau [tulis ...] salin APA ADANYA di tempat yang sama; jangan diisi dan jangan dikarang. ' +
  'Jangan mengarang hasil (mis. \"turun sekian kilo\") dan jangan menjanjikan hasil; tanpa klaim kesehatan atau saran medis. ' +
  'Nada jujur, tenang, tidak lebay, tanpa hard sell. Bahasa Indonesia santai. Jawab hanya isinya.';

/* --- fakta lokal, disaring per grup data --- */
function tkAiJob() {
  const typed = (pdb.tkJob || '').trim();
  if (!typed) return TK_JOB;
  return aiOn('teks') ? typed : '[isi: konteks hook]';
}
function tkAiFacts() {   // sama dengan tkFacts().f bila semua grup nyala; urutan sama
  const t = today(), c = cdb[t] || cblank(), e = db[t] || blank(), k = tdb[t] && tdb[t].kal, rd = tdb[t] ? tdb[t].rides : [], f = [];
  if (c.m.includes('m1')) f.push('bangun jam 5.30');
  if (aiOn('latihan')) {
    if (k && k.done) f.push('latihan kalistenik ' + kalSets(k).n + ' set');
    if (rd.length) {
      const mn = rd.reduce((a, r) => a + (r.min || 0), 0), km = rd.reduce((a, r) => a + (r.km || 0), 0);
      f.push('gowes' + (mn ? ' ' + fmt(mn, 0) + ' menit' : '') + (km ? ', ' + fmt(km, 1) + ' km' : ''));
    }
  }
  if (aiOn('kram') && e.kram === 'ya') f.push('kaki sempat kram');
  return f;
}
function tkAiLesson() {
  const id = pdb.tkLesson, ph = '[isi: pelajaran hari ini]';
  if (id === 'catat') return tkLesson();
  if (id === 'ganti') return aiOn('pmo') ? tkLesson() : ph;
  if (id === 'custom') return aiOn('teks') ? tkLesson() : ph;
  if (id === 'voice' || id === 'detail') return aiOn('teks') ? tkLesson() : ph;
  return aiOn('gizi') ? tkLesson() : ph;
}
function tkAiSegs() {   // sama dengan tkSegs() (teks tiap segmen) bila semua grup nyala
  const t = today(), D = tkDay(), X = D.n == null ? '[X]' : String(D.n), X1 = D.n == null ? '[X+1]' : String(D.n + 1);
  const job = tkAiJob(), f = tkAiFacts(), bw = aiOn('badan');
  const lw = latestBw(), cw = bw && lw && diffDays(lw.w, t) <= 13 ? lw.v : null, b0 = bw ? fmt(bwStart(), 1) : '[isi: berat awal]';
  return [
    { t: '0–5 dtk', n: 'Hook jujur', budget: 14, text: 'Hari ke-' + X + ' memotong berat badan dari ' + b0 + ' kg, ' + job + '.' },
    { t: '5–15 dtk', n: 'Progres / realita', budget: 28, text: f.length ? 'Hari ini ' + f.join(', ') + '.' : '[isi: satu hal nyata dari hari ini]' },
    { t: '15–25 dtk', n: 'Pelajaran / trik hari ini', budget: 28, text: tkAiLesson() },
    { t: '25–30 dtk', n: 'Closing & akuntabilitas', budget: 14, text: 'Berat awal ' + b0 + ' kg' + (cw != null ? ', sekarang ' + fmt(cw, 1) + ' kg' : '') + ', target turun berotot. Sampai ketemu di hari ke-' + X1 + '.' }
  ];
}
function tkClosedGroups() {   // grup tertutup yang benar-benar menahan data yang ada (untuk pesan "data belum cukup")
  const t = today(), e = db[t], k = tdb[t] && tdb[t].kal, rd = tdb[t] ? tdb[t].rides : [], out = [];
  const add = g => { const x = AI_GROUPS.find(y => y.id === g); if (x && !out.includes(x.t)) out.push(x.t); };
  if (!aiOn('latihan') && ((k && k.done) || rd.length)) add('latihan');
  if (!aiOn('kram') && e && e.kram === 'ya') add('kram');
  const id = pdb.tkLesson;
  if (id === 'ganti') { if (!aiOn('pmo')) add('pmo'); }
  else if (id === 'custom') { if (!aiOn('teks') && tkS.custom.trim()) add('teks'); }
  else if (id === 'voice' || id === 'detail') { if (!aiOn('teks') && evLessonText()) add('teks'); }
  else if (id !== 'catat' && !aiOn('gizi') && e && (num(e.kcal) != null || num(e.protein) != null || num(e.water) != null)) add('gizi');
  return out;
}
function tkAiCtx() {
  const segs = tkAiSegs(), t = today();
  if (tkIsPh(segs[1].text) && tkIsPh(segs[2].text)) {
    const cl = tkClosedGroups();
    return cl.length ? b14Fail('Ada catatan hari ini, tetapi grup data ' + cl.join(', ') + ' belum dicentang di Pengaturan AI, jadi AI tidak boleh memakainya. AI tidak dipanggil. Centang grup itu dulu.', true)
      : b14Fail('Data belum cukup: belum ada catatan hari ini yang bisa jadi bahan skrip (bangun, latihan, gowes, kram) dan pelajarannya masih kosong. AI tidak dipanggil supaya tidak mengarang. Isi log hari ini atau pilih pelajaran dulu.', false);
  }
  const total = segs.reduce((a, s) => a + s.budget, 0), P = [];
  P.push('HARI INI: ' + dayLong(t) + '.' + aiHead(t));
  P.push('SKRIP LOKAL 30 DETIK (disusun aplikasi dari catatanmu; ini SATU-SATUNYA sumber fakta):\n' + segs.map(s => '- ' + s.t + ', ' + s.n + ' (sekitar ' + s.budget + ' kata): ' + s.text).join('\n'));
  P.push('PANJANG: video 30 detik, total sekitar ' + total + ' kata.');
  const body = P.join('\n\n'), user = body + '\n\nTulis tiga hook, skrip 30 detik, caption, dan hashtag.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}

/* --- penguraian keluaran berlabel --- */
const TK_LAB = /^[ \t]*(?:HOOK[ \t]*([ABC])|(SKRIP|CAPTION|HASHTAGS?))[ \t]*[:：][ \t]*/i;
function tkClean(t) {   // seperti b14Clean (buang markdown, pertahankan baris baru) tetapi batas panjangnya cukup untuk enam bagian
  t = String(t == null ? '' : t).replace(/\r/g, '').replace(/\*\*|__|`/g, '')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '').replace(/^[ \t]*[*•][ \t]+/gm, '- ')
    .replace(/(^|\s)\*+(?=\S)/g, '$1').replace(/(?<=\S)\*+(?=\s|$)/g, '')
    .replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  t = t.replace(/^[\"“”'`]+|[\"“”'`]+$/g, '').trim();
  if (t.length > TK_OUT_MAX) t = t.slice(0, TK_OUT_MAX).replace(/\s+\S*$/, '') + '…';
  return t;
}
function tkTags(s) {   // lewat cnTags (huruf kecil/besar dianggap sama, batas 150), lalu buang tagar yang memuat angka
  return cnTags(s).split(' ').filter(x => x && !/\d/.test(x)).join(' ');
}
function tkParse(text) {
  const buf = {}, lines = String(text == null ? '' : text).replace(/\r/g, '').split('\n');
  let cur = null;
  lines.forEach(ln => {
    const m = ln.match(TK_LAB);
    if (m) {
      const k = m[1] ? 'h' + m[1].toUpperCase() : m[2].toUpperCase() === 'SKRIP' ? 'sc' : m[2].toUpperCase() === 'CAPTION' ? 'cp' : 'ht';
      if (buf[k]) { cur = null; return; }   // label ganda: yang pertama menang
      buf[k] = [ln.slice(m[0].length)]; cur = k; return;
    }
    if (cur) buf[cur].push(ln);
  });
  const one = k => (buf[k] || []).join(' ').replace(/\s+/g, ' ').trim();
  const sc = (buf.sc || []).join('\n').replace(/[^\S\n]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const htTok = one('ht').replace(/(^|[\s,;])#+ +(?=[^\s,;#])/g, '$1#').split(/[\s,;]+/).filter(Boolean), htHash = htTok.filter(x => x.charAt(0) === '#');   // T6: ada '#' -> hanya token '#' (kata lain = kalimat penutup)
  return { A: one('hA'), B: one('hB'), C: one('hC'), sc, cp: one('cp'), ht: tkTags((htHash.length ? htHash : htTok).join(' ')) };
}
const tkSaved = m => { const e = m && m.cn ? cnDb.it[m.cn] : null; return e && !e.x ? e : null; };

/* --- tampilan --- */
function tkEmptyHTML() {
  const c = tkAiCtx();
  let h = '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>Skrip natural</h4><p class="note">' +
    esc('Skrip 30 detikmu ditulis ulang jadi bahasa lisan yang natural, lengkap dengan tiga pilihan hook, caption, dan hashtag. Fakta dan angka hanya dari datamu di perangkat ini; bagian yang kosong dibiarkan [isi: ...]. Tidak ada yang tersimpan sebelum kamu mengetuk Simpan ke kalender.') + '</p>';
  if (c.empty) h += '<p class="note"><b>' + esc(c.emptyMsg) + '</b></p>' + (c.emptyBtn ? '<div class="quick"><button class="btn primary" data-q="fcSettings">Buka pengaturan AI</button></div>' : '');
  else h += '<div class="quick"><button class="btn primary" data-q="fcGen">Susun skrip natural</button></div>' +
    '<div class="csug">' + FC_CHIPS.tk.map(x => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div><p class="note">Atau tulis permintaanmu di bawah.</p>';
  return h + '</div>';
}
function tkExtra(m) {   // baris aksi di bawah jawaban: hitung kata lokal + Simpan ke kalender / Pakai hook
  const p = tkParse(tkClean(m.text));
  if (!p.A && !p.sc) return '';
  const w = tkWords(p.sc), sv = tkSaved(m);
  let h = '<div class="tkx">';
  if (p.sc) h += '<div class="cap">Skrip ' + w + ' kata, sekitar ' + Math.round(w / TK_WPS) + ' detik jika dibaca (' + spWpsNote() + ').</div>';
  if (!sv) h += '<div class="cact"><button class="btn sm primary" data-q="tkSave" data-id="' + m.id + '">Simpan ke kalender</button></div>';
  else {
    h += '<div class="cact"><button class="btn sm ghost" data-q="tkOpenCal">Tersimpan di Kalender · Buka</button>' +
      ['A', 'B', 'C'].filter(k => p[k] && cnTxt(p[k], CN_LIM.h) !== sv.h).map(k => '<button class="btn sm ghost" data-q="tkHook" data-id="' + m.id + '" data-v="' + k + '">Pakai hook ' + k + '</button>').join('') + '</div>';
  }
  return h + '</div>';
}
const tkAiRow = () => adb.on ? '<div class="aibtn" id="tkAiRow"><button class="btn sm" data-q="tkAi">✦ Skrip natural</button></div>' : '';
let tkOn = false;
function tkAiSync() {   // menyalakan/mematikan AI menggambar ulang tab Skrip bila sedang terbuka (baris AI hanya ada saat AI nyala)
  const on = !!adb.on; if (on === tkOn) return; tkOn = on;
  if (curView === 'content' && cnTab === 'skrip') cnRender();
}
function tkPeek() {
  const c = tkAiCtx();
  openSheet({ title: 'Data yang akan dikirim', note: c.empty ? c.emptyMsg : 'Hanya teks ini, permintaanmu, dan obrolan di layar ini yang dikirim. Fakta dihitung di perangkat ini; bagian yang grup datanya tidak dicentang di Pengaturan AI diganti [isi: ...]. Profil, usia, skor harian, dan log hari lain tidak dikirim.',
    text: c.empty ? '' : c.body, prose: true, actions: [closeBtn] });
}

/* --- aksi --- */
QACT.tkAi = () => { fcOpen('tk'); if (fcKind === 'tk' && !fcHasChat(FC.tk)) fcFirst('tk'); };
function tkMsg(el) { return FC.tk.msgs.find(x => String(x.id) === el.dataset.id && x.r === 'model') || null; }
QACT.tkSave = el => {
  const m = tkMsg(el); if (!m) return;
  const p = tkParse(tkClean(m.text)); if (!p.A && !p.sc) return;
  if (cnActive().length >= CN_MAX) { toast('Maksimal ' + CN_MAX + ' konten. Hapus yang lama dulu.'); return; }
  const D = tkDay(), id = cnNewId(), bad = (m.bad || []).slice(0, 8);
  cnDb.it[id] = { id, t: cnTxt(D.n != null ? 'Skrip hari ke-' + D.n + ' (AI)' : 'Skrip ' + shortDate(today()) + ' (AI)', CN_LIM.t), s: 'ide', d: '', h: cnTxt(p.A, CN_LIM.h), sc: cnTxt(p.sc, CN_LIM.sc, true), cp: cnTxt(p.cp, CN_LIM.cp, true), ht: p.ht,
    nt: cnTxt('Dari ✦ Skrip natural (AI).' + (bad.length ? ' ⚠ Angka tidak ada di datamu: ' + bad.join(', ') + '. Cek dulu.' : ''), CN_LIM.nt), u: Date.now() };
  m.cn = id; queueSave('cn'); cnPaint(); fcPaint();
  toast('Disimpan sebagai Ide di Kalender konten', { label: 'Buka', fn: () => QACT.tkOpenCal() });
};
QACT.tkHook = el => {
  const m = tkMsg(el); if (!m) return;
  const p = tkParse(tkClean(m.text)), k = el.dataset.v, cur = tkSaved(m);
  if (!['A', 'B', 'C'].includes(k) || !p[k]) return;
  if (!cur) { toast('Simpan ke kalender dulu'); return; }
  cnDb.it[cur.id] = Object.assign({}, cur, { h: cnTxt(p[k], CN_LIM.h), u: Math.max(Date.now(), cur.u + 1) });
  queueSave('cn'); cnPaint(); fcPaint(); toast('Hook ' + k + ' dipakai');
};
QACT.tkOpenCal = () => { if (fcKind) fcClose(); cnTab = 'kal'; if (curView === 'content') cnRender(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b19b: Object.freeze({ ctx: tkAiCtx, segs: tkAiSegs, facts: tkAiFacts, parse: tkParse, clean: tkClean, tags: tkTags, sys: TK_SYS, row: tkAiRow, closed: tkClosedGroups, out: TK_OUT_MAX }) }));

/* ===== MODUL: TAMPILAN (batch 20, langkah 20a) =====
   Tema Otomatis / Terang / Gelap, ukuran huruf (Normal / Besar / Sangat besar), dan kontras tinggi.
   Data baru `dailylog:prefs:v1`: khusus perangkat, TIDAK ikut ekspor JSON (pola sama dengan `dailylog:ai:v1`).
   Bawaan (Otomatis, Normal, kontras biasa) = tampilan Batch 19: atribut data-* tidak dipasang, nilai --fs = 1. */
window.DL = Object.freeze(Object.assign({}, window.DL, { b76a: Object.freeze({ audio: spAudio, fill: spFill, feed: spFeed, cal: spWpsCal, apply: spApplyCal, clean: spClean, snap: spSnap, restore: spRestore, state: () => JSON.parse(JSON.stringify(spDb)), ui: () => Object.assign({}, spV, { rec: !!spV.rec }), wps: () => TK_WPS, key: KEY_SP, markers: SP_MARK.slice(), wipe: spWipe, show: v => showView(v), tk: { V: tkV, S: tkS, segs: tkSegs, words: tkWords } }) }));
window.DL = Object.freeze(Object.assign({}, window.DL, { b76b: Object.freeze({ rb: spRbEff, rbAuto: spRbAuto, mean: spRbMean, streak: spStreak, check: spCheckLevel, lv: () => spDb.lv, ui: () => ({ lv: spV.lv, up: spV.up }), paint: () => spPaint(), cur: id => { spV.cur = id; spPaint(); }, weeks: n => spWkData(n || 8), blNext: spBlNext, feedBl: spFeedBl, inject: raw => { spDb = spClean(raw); spDb.u = Date.now(); queueSave('sp'); spApplyCal(); spV.lv = spDb.lv; spV.cur = ''; spPaint(); }, bl: () => JSON.parse(JSON.stringify(spDb.bl)), lib: () => ({ h: spLibHookIdx(), c: spLibCloseIdx(), f: spLibToday().f, sg: spLibSuggest() }), tidyUser: (t, n) => tkTidyUser(t, n, []), tidyNote: spLibTidyNote, auto0: tkSegsAuto0 }) }));
const KEY_UP = 'dailylog:prefs:v1';
const UP_THEME = { auto: 'Otomatis', light: 'Terang', dark: 'Gelap' };
const UP_FS = { n: 'Normal', l: 'Besar', x: 'Sangat besar' };
const upBlank = () => ({ theme: 'auto', fs: 'n', hc: false, updated: 0 });
let udb = upBlank();
let upOpen = false;   // panel Tampilan terbuka
function upClean(raw) {
  const b = upBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  b.theme = raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'auto';
  b.fs = raw.fs === 'l' || raw.fs === 'x' ? raw.fs : 'n';
  b.hc = raw.hc === true;
  b.updated = Number(raw.updated) || 0;
  return b;
}
STORES.u = { key: KEY_UP, get: () => udb }; dirty.u = false;   // khusus perangkat: tidak ikut ekspor JSON
const upIsDefault = () => udb.theme === 'auto' && udb.fs === 'n' && !udb.hc;
function upApply() {
  const r = document.documentElement;
  const setA = (n, v) => { if (v) r.setAttribute(n, v); else r.removeAttribute(n); };
  setA('data-theme', udb.theme === 'light' || udb.theme === 'dark' ? udb.theme : '');
  setA('data-fs', udb.fs === 'l' || udb.fs === 'x' ? udb.fs : '');
  setA('data-hc', udb.hc ? 'on' : '');
  // warna bilah browser: mode manual memilih satu <meta theme-color>, Otomatis mengembalikan media asli
  $$('meta[name="theme-color"]').forEach(m => {
    if (m.dataset.m0 == null) m.dataset.m0 = m.getAttribute('media') || '';
    const isDark = /dark/.test(m.dataset.m0);
    m.setAttribute('media', udb.theme === 'auto' ? m.dataset.m0 : (isDark === (udb.theme === 'dark') ? 'all' : 'not all'));
  });
}
const upStatus = () => UP_THEME[udb.theme] + ' · ' + UP_FS[udb.fs] + (udb.hc ? ' · kontras tinggi' : '');
function upSave() { udb.updated = Date.now(); queueSave('u'); }
function renderUpBox() {
  const box = $('#upBox'); if (!box) return;
  const pill = (f, v, on, t) => '<button class="pill" data-q="upSet" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + on + '">' + t + '</button>';
  box.innerHTML = '<details class="ph" id="upDet"' + (upOpen ? ' open' : '') + '><summary><span>Tampilan dan aksesibilitas</span><small>' + esc(upStatus()) + '</small><i class="chev"></i></summary><div class="body">' +
    '<div class="f"><div class="lbl" id="upLblT">Tema</div><div class="seg tri" role="group" aria-labelledby="upLblT">' + Object.keys(UP_THEME).map(k => pill('theme', k, udb.theme === k, UP_THEME[k])).join('') + '</div><p class="note">Otomatis mengikuti pengaturan terang atau gelap di HP-mu.</p></div>' +
    '<div class="f"><div class="lbl" id="upLblF">Ukuran huruf</div><div class="seg tri" role="group" aria-labelledby="upLblF">' + Object.keys(UP_FS).map(k => pill('fs', k, udb.fs === k, UP_FS[k])).join('') + '</div><p class="note upsample">Contoh: sarapan 2 telur, oatmeal, pisang. Protein 38 g.</p></div>' +
    '<div class="f"><div class="lbl" id="upLblC">Kontras tinggi</div><div class="seg" role="group" aria-labelledby="upLblC">' + pill('hc', '0', !udb.hc, 'Mati') + pill('hc', '1', udb.hc, 'Nyala') + '</div><p class="note">Teks pendukung dan garis pembatas lebih tegas, dan sorotan fokus untuk keyboard lebih tebal.</p></div>' +
    '<div class="quick"><button class="btn sm ghost" data-q="upReset"' + (upIsDefault() ? ' disabled' : '') + '>Kembalikan ke bawaan</button></div>' +
    '<p class="note">Pengaturan tampilan hanya tersimpan di perangkat ini dan tidak ikut cadangan JSON.</p></div></details>';
}
function upRerender(keep) {   // gambar ulang panel tanpa menghilangkan fokus papan ketik
  const had = keep && $('#upBox') && $('#upBox').contains(document.activeElement);
  renderUpBox();
  if (had) { const b = $('#upBox [data-q="' + keep.q + '"]' + (keep.f ? '[data-f="' + keep.f + '"][data-v="' + keep.v + '"]' : '')); if (b && !b.disabled) b.focus(); }
}
QACT.upSet = el => {
  const f = el.dataset.f, v = el.dataset.v;
  if (f === 'theme' && UP_THEME[v]) udb.theme = v;
  else if (f === 'fs' && UP_FS[v]) udb.fs = v;
  else if (f === 'hc') udb.hc = v === '1';
  else return;
  upSave(); upApply(); upRerender({ q: 'upSet', f, v });
};
QACT.upReset = () => { const wasFocus = $('#upBox') && $('#upBox').contains(document.activeElement); udb.theme = 'auto'; udb.fs = 'n'; udb.hc = false; upSave(); upApply(); renderUpBox(); if (wasFocus) { const b = $('#upBox [data-f="theme"][data-v="auto"]'); if (b) b.focus(); } toast('Tampilan dikembalikan ke bawaan'); };
document.addEventListener('toggle', ev => { if (ev.target.id === 'upDet') upOpen = ev.target.open; }, true);
window.DL = Object.freeze(Object.assign({}, window.DL, { b20a: Object.freeze({ state: () => Object.assign({}, udb), clean: upClean, apply: upApply, status: upStatus, key: KEY_UP, isDefault: upIsDefault, themes: Object.keys(UP_THEME), sizes: Object.keys(UP_FS) }) }));

