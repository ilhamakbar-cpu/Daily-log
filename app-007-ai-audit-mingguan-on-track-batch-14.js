/* ===== MODUL: AI AUDIT MINGGUAN & ON-TRACK (batch 14) ===== */
// Dua jenis baru di panel #fchat (mesin obrolan Batch 12-1): 'week' (✦ Ringkas pekan, di Mingguan) dan 'track' (✦ Apakah on-track?, di Peta).
// Semua angka dihitung LOKAL (ctx.week, trendOf, trVerdict, trProject, phaseNeed, adjEval); AI hanya menjelaskan dan TIDAK menerapkan apa pun
// (modul ini tidak menulis ke pdb/wdb/db; perubahan rencana tetap lewat mesin lokal Batch 13 + Urungkan).
// Tidak dikirim ke AI: profil (tinggi, usia, jenis kelamin), BMR/TDEE/defisit, dan teks `why` mesin saran (memuat BMR). Filter privasi (aiOn) berlaku.
// Data belum cukup = pesan sistem TANPA panggilan AI (c.emptyMsg dibaca fcFirst).
const B14_MODE = { auto: 'Otomatis', ask: 'Tanya dulu', off: 'Mati' };
const B14_MIN_DAYS = 2;   // hari tercatat minimal untuk ringkasan pekan (bila tanpa isian audit mingguan)
const B14_PLAT = 'Catatan aplikasi: 2 pekan terlalu pendek untuk menyebut berat yang datar sebagai plateau; naik-turun air dan isi usus bisa menutupi tren.';
const B14_COMMON = ' Bahasa Indonesia, teks biasa tanpa judul markdown, tabel, atau tanda tebal; poin hanya diawali "- ". Pakai hanya fakta dari DATA; jangan menambah angka atau fakta yang tidak ada di DATA. Bila membahas berat yang datar atau plateau, tambahkan bahwa 2 pekan terlalu pendek untuk menyebutnya plateau. Jangan memberi diagnosis atau saran medis; bila ada kram berulang, bengkak, nyeri dada, pusing berat, atau pingsan, sarankan menemui dokter. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
const B14_SYS = {
  week: 'Kamu menyusun ringkasan audit satu pekan di aplikasi catatan kebugaran. Format: satu paragraf temuan (2 sampai 4 kalimat: yang berjalan baik, yang perlu diperbaiki, dan perubahan dibanding PEKAN SEBELUMNYA bila ada di DATA), lalu satu baris "Fokus pekan depan:" disusul satu atau dua poin konkret (satu kalimat tiap poin, diawali "- "). Bila pekan masih berjalan atau hari tercatatnya sedikit, katakan bahwa ringkasan ini sementara. Jangan menyuruh mengubah target kalori atau target berat; rencana hanya diubah lewat bagian Penyesuaian rencana di Peta.' + B14_COMMON,
  track: 'Kamu menilai apakah progres pengguna sudah on-track terhadap target fasenya di aplikasi catatan kebugaran. Semua angka sudah dihitung aplikasi di DATA; tugasmu hanya menjelaskan. Format: satu baris "Kesimpulan:" berisi satu kalimat yang mengikuti PENILAIAN MESIN LOKAL dan PROYEKSI (jangan menyimpulkan sebaliknya; bila PROYEKSI tidak ada, katakan penilaian terbatas pada laju), lalu satu paragraf alasan (2 sampai 3 kalimat) yang membandingkan LAJU dengan kebutuhan target fase dan, bila ada, PROYEKSI dengan akhir fase, lalu satu baris "Saran:" disusul satu atau dua poin diawali "- ". Saran HANYA boleh berupa: mempertahankan rencana yang berlaku di DATA, memeriksa isian berat dan catatan makan, menjaga konsistensi protein dan latihan sesuai TARGET, atau membuka bagian Penyesuaian rencana di Peta bila PENYESUAIAN RENCANA menyebut saran mesin. Jangan membuat angka kalori, protein, defisit, atau target berat yang baru dan jangan menyuruh mengubah rencana sendiri; aplikasi tidak menerapkan apa pun dari jawabanmu. Semua angka berat adalah perkiraan kasar.' + B14_COMMON
};
const FC_NOUN = { brief: 'briefing', review: 'review', week: 'ringkasan', track: 'penilaian' };
Object.assign(BR_TITLE, { week: '✦ Ringkas pekan', track: '✦ Apakah on-track?' });
Object.assign(FC_AUTO, { week: () => 'Ringkas pekan ' + rangeLabel(FC.week.ws || curW), track: 'Nilai apakah progresku sudah on-track' });
Object.assign(FC_FOLLOW, {
  week: 'Ini obrolan lanjutan tentang ringkasan pekan yang baru kamu tulis. Bila membahas berat yang datar atau plateau, ingat bahwa 2 pekan terlalu pendek untuk menyebutnya plateau. Jangan menyuruh mengubah target; rencana hanya diubah lewat bagian Penyesuaian rencana di Peta.',
  track: 'Ini obrolan lanjutan tentang penilaian on-track yang baru kamu tulis. Aturan saran tetap berlaku: jangan membuat angka kalori, protein, defisit, atau target berat baru dan jangan menyuruh mengubah rencana sendiri; bila ditanya soal mengubah rencana, arahkan ke bagian Penyesuaian rencana di Peta. Bila membahas berat yang datar atau plateau, ingat bahwa 2 pekan terlalu pendek untuk menyebutnya plateau.'
});
Object.assign(FC_CHIPS, {
  week: ['Apa fokus terpenting pekan depan?', 'Bandingkan dengan pekan lalu', 'Jelaskan lebih singkat'],
  track: ['Kenapa kesimpulannya begitu?', 'Apa yang perlu dijaga?', 'Jelaskan lebih singkat']
});
Object.assign(FC_CTX, { week: () => 'Pekan ' + rangeLabel(FC.week.ws || curW) + ' + pekan lalu', track: 'Tren berat + target fase + proyeksi' });

const fcAutoText = k => typeof FC_AUTO[k] === 'function' ? FC_AUTO[k]() : FC_AUTO[k];
const fcSys = k => k === 'tk' ? TK_SYS : k === 'menu' ? NAI_MENU_SYS : k === 'cramp' ? NAI_KRAM_SYS : k === 'bike' ? BIKE_SYS : k === 'coach' ? COACH_SYS : k === 'brief' ? BR_SYS : k === 'review' ? RV_SYS : B14_SYS[k];
const fcMax = k => k === 'coach' || k === 'bike' || naiK(k) || B14_SYS[k] ? 800 : 420;
const fcClean = (k, t) => k === 'tk' ? tkClean(t) : k === 'coach' || k === 'bike' || naiK(k) || B14_SYS[k] ? b14Clean(t) : briefClean(t);

// buang markdown tetapi pertahankan baris baru dan poin (briefClean memaksa satu paragraf 4 kalimat; tidak cocok untuk jenis baru)
function b14Clean(t) {
  t = String(t == null ? '' : t).replace(/\r/g, '').replace(/\*\*|__|`/g, '')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '').replace(/^[ \t]*[*•][ \t]+/gm, '- ')
    .replace(/(^|\s)\*+(?=\S)/g, '$1').replace(/(?<=\S)\*+(?=\s|$)/g, '')
    .replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  t = t.replace(/^["“”'`]+|["“”'`]+$/g, '').trim();
  if (t.length > 1100) t = t.slice(0, 1100).replace(/\s+\S*$/, '') + '…';
  return t;
}
// pengaman lokal: jawaban yang membahas plateau selalu memuat catatan bahwa 2 pekan terlalu pendek (diberi label sebagai catatan aplikasi)
function b14Post(kind, text) {
  if (!B14_SYS[kind] && kind !== 'ask') return text;
  if (/plateau|mandek|stagnan/i.test(text) && !/terlalu (pendek|singkat)/i.test(text)) return text + '\n\n' + B14_PLAT;
  return text;
}

/* --- konteks --- */
const b14Fail = (msg, btn) => ({ user: '', body: '', basis: '', empty: true, emptyMsg: msg, emptyBtn: !!btn });

function b14WeekCtx(ws0) {   // v23w6: ws0 opsional (pekan lain); tanpa argumen = perilaku lama
  const ws = ws0 || FC.week.ws || curW, t = today(), cw = ctx.week(ws), lab = rangeLabel(ws);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter(d => d <= t);
  const logged = days.filter(d => db[d]).length, wl = aiWeekLines(ws).length;
  if (cw.empty && logged >= B14_MIN_DAYS) {
    return b14Fail('Pekan ' + lab + ' punya ' + logged + ' hari tercatat, tetapi tidak ada isinya yang boleh dikirim ke AI (grup data yang dicentang di Pengaturan AI menentukan). Ringkasan tidak dibuat. Centang grup data yang kamu izinkan, atau pilih pekan lain.', true);
  }
  if (cw.empty || (logged < B14_MIN_DAYS && !wl)) {
    return b14Fail('Data belum cukup untuk meringkas pekan ' + lab + ': ' + (logged ? 'baru ' + logged + ' hari tercatat' : 'belum ada hari yang tercatat') + ' (minimal ' + B14_MIN_DAYS + ' hari) dan belum ada isian audit mingguan yang boleh dikirim ke AI. Ringkasan tidak dibuat supaya AI tidak mengarang. Isi log harian atau audit mingguan dulu, atau pilih pekan lain.', false);
  }
  const running = ws === thisWeek(), parts = [];
  parts.push('PEKAN DIRINGKAS' + (running ? ' (sedang berjalan: ' + days.length + ' dari 7 hari sudah lewat)' : ' (sudah selesai)') + ':\n' + cw.text);
  const plan = [];
  if (days.length && aiOn('gizi')) { const T = tgFor(days[days.length - 1]); plan.push('target harian: kalori ' + (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ' kcal, protein ' + fmt(T.protein, 0) + ' g, air minimal ' + T.water + ' L'); }
  if (aiOn('latihan')) {
    const p = weekPlan(ws);
    if (p.days && (p.kP || p.bP || p.kX || p.bX)) plan.push('latihan sampai hari ini: kalistenik selesai ' + p.kD + ' dari ' + p.kP + ' terjadwal' + (p.kX ? ' (+' + p.kX + ' di luar jadwal)' : '') + ', sepeda selesai ' + p.bD + ' dari ' + p.bP + ' terjadwal' + (p.bX ? ' (+' + p.bX + ' di luar jadwal)' : ''));
  }
  if (plan.length) parts.push('RENCANA:\n' + plan.map(x => '- ' + x).join('\n'));
  const cp = ctx.week(addDays(ws, -7));
  if (!cp.empty) parts.push('PEKAN SEBELUMNYA:\n' + cp.text);
  if (aiOn('badan') && ws >= addDays(thisWeek(), -7)) {   // trendOf berpatokan pada hari ini, jadi hanya untuk pekan ini dan pekan lalu
    const b = trendOf('bw', 8);
    if (b.ok) parts.push('TREN BERAT 8 PEKAN TERAKHIR:\n- garis tren ' + sgn(b.slope, 2) + ' kg/pekan (' + sgn(b.slope / b.fitLast * 100, 2) + '% berat badan per pekan) dari ' + b.cnt + ' pekan berisi data; perkiraan kasar');
    else if (b.cnt) parts.push('TREN BERAT 8 PEKAN TERAKHIR:\n- belum bisa dihitung: baru ' + b.cnt + ' pekan berisi berat (minimal ' + TR_MIN + ')');
  }
  const body = parts.join('\n\n'), user = body + '\n\nTulis ringkasan pekan ini.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}

// satu baris status mesin penyesuaian rencana (tanpa teks `why`, tanpa BMR); AI hanya boleh mengarahkan ke bagian Penyesuaian rencana
function b14AdjLines(ph) {
  ph = ph || PHASES[0];
  const A = adjd(), ev = adjEval(), out = ['mode ' + (B14_MODE[A.mode] || A.mode) + '; entri penyesuaian aktif: ' + adjActive().length];
  // entri aktif fase ini (maks. 2 terakhir): penyesuaian "mulai besok" belum masuk ke angka TARGET, jadi harus disebut agar AI tidak menilai terhadap angka lama
  const t0 = today();
  adjActive().filter(e => e.ph === ph.id)
    .sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : (a.t || 0) - (b.t || 0)).slice(-2)
    .forEach(e => {
      const src = e.auto ? 'diterapkan otomatis oleh aplikasi' : 'disetujui pengguna';
      out.push(e.from > t0
        ? 'penyesuaian terjadwal, berlaku mulai ' + dY(e.from) + ': ' + adjFmtE(e) + ' (' + src + '); angka TARGET di atas masih nilai sebelum penyesuaian ini berlaku'
        : 'penyesuaian berlaku sejak ' + dY(e.from) + ': ' + adjFmtE(e) + ' (' + src + ')');
    });
  if (ev.st === 'prop' && ev.prop && !adjDismissed(ev.prop)) {
    const pr = ev.prop, c = pr.change || {};
    if (pr.kind === 'faster') out.push('saran mesin saat ini (belum diterapkan): naikkan batas kalori dari ' + fmt(ev.eff.kcal, 0) + ' ke ' + fmt(c.kcal, 0) + ' kcal karena laju turun di atas 1% per pekan');
    else if (pr.kind === 'goal') out.push('saran mesin saat ini (belum diterapkan): geser target berat ke ' + fmt(c.goal, 1) + ' kg karena target semula kemungkinan tak terkejar di akhir fase');
    else if (pr.kind === 'cut') out.push('saran mesin saat ini (belum diterapkan, selalu perlu persetujuan): kurangi batas kalori dari ' + fmt(ev.eff.kcal, 0) + ' ke ' + fmt(c.kcal, 0) + ' kcal karena berat belum turun');
    out.push('penerapan hanya lewat bagian Penyesuaian rencana di Peta (ada Urungkan)');
  } else if (ev.st === 'prop') out.push('ada saran mesin yang sedang disembunyikan pengguna');
  else {
    const m = {
      cool: 'penilaian mesin berikutnya setelah ' + (ev.until ? dY(ev.until) : 'jeda 21 hari') + ' (jeda setelah penyesuaian terakhir)',
      few: 'mesin saran butuh minimal ' + TR_MIN + ' pekan berat sejak awal fase atau sejak penyesuaian terakhir; belum ada saran',
      ok: 'mesin saran: belum ada yang perlu diubah',
      noisy: 'mesin saran: laju di atas 1% per pekan tetapi kisarannya lebar; belum cukup yakin untuk mengubah rencana',
      early: 'mesin saran: belum dinilai (kurang dari 6 pekan di fase ini)',
      capped: 'mesin saran: batas penyesuaian sudah tercapai; tidak ada perubahan lagi',
      'cut-blocked': 'mesin saran tidak menyarankan memotong kalori; cek dulu isian berat dan catatan makan'
    }[ev.st];
    out.push(m || 'penyesuaian otomatis tidak berlaku saat ini (fase atau tanggal mulai)');
  }
  return out;
}

function b14TrackCtx() {
  const t = today(), p = pos(t), ph = (p && p.ph) || PHASES[0];
  if (!aiOn('badan')) return b14Fail('Penilaian on-track butuh data berat badan, tetapi grup data "Badan" tidak dicentang di Pengaturan AI, jadi penilaian tidak dibuat. Centang grup itu bila kamu mengizinkan berat badan dikirim.', true);
  const tr = trendOf('bw', TR_PROJ_WEEKS);
  if (!tr.ok) return b14Fail('Data belum cukup untuk menilai on-track: butuh minimal ' + TR_MIN + ' pekan berisi berat badan dalam ' + TR_PROJ_WEEKS + ' pekan terakhir (sekarang ' + tr.cnt + '). Isi berat rata-rata di Mingguan; penilaian bisa dibuat setelah itu. Penilaian tidak dibuat supaya AI tidak mengarang.', false);
  const goal = effGoal(ph), eff = adjEff(ph, t), b0 = bwStart(), end = phEnd(ph), L = [];
  const need = kgOk(b0) ? phaseNeed(ph, b0) : null, lb = latestBw(), T = effTg(ph, t);
  L.push('POSISI:\n- ' + (p && p.ph ? 'Fase ' + ph.id + ' (' + ph.nama + '), hari ke-' + p.day + ', bulan ' + p.month + '.' : 'Tanggal mulai belum diatur atau belum tiba; Fase 1 dipakai sebagai acuan.'));
  const tg = [];
  if (goal != null) tg.push('target berat Fase ' + ph.id + ': ' + fmt(goal, 1) + ' kg' + (ph.bwGoal != null && goal !== ph.bwGoal ? ' (rencana dasar ' + fmt(ph.bwGoal, 1) + ' kg; digeser aplikasi)' : ''));
  else tg.push('Fase ' + ph.id + ' bertujuan mempertahankan berat badan (tanpa target turun)');
  if (kgOk(b0)) tg.push('berat awal perjalanan ' + fmt(b0, 1) + ' kg');
  if (end) tg.push('akhir fase ' + dY(end) + ' (sisa ' + Math.max(0, diffDays(t, end)) + ' hari)');
  tg.push('target kalori ' + (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ' kcal' + (eff.kcal !== ph.tg.kcal || eff.kcalHi !== ph.tg.kcalHi ? ' (disesuaikan aplikasi; rencana dasar ' + kcalTgt(ph.tg) + ' kcal)' : '') + ', protein ' + fmt(T.protein, 0) + ' g');
  L.push('TARGET:\n' + tg.map(x => '- ' + x).join('\n'));
  const be = ['garis tren sekarang ±' + fmt(tr.fitLast, 1) + ' kg'];
  if (lb) be.push('nilai mingguan terakhir ' + fmt(lb.v, 1) + ' kg (pekan ' + shortDate(lb.w) + ')');
  L.push('BERAT:\n' + be.map(x => '- ' + x).join('\n'));
  const lj = ['laju ' + TR_PROJ_WEEKS + ' pekan terakhir (' + tr.cnt + ' pekan berisi data): ' + sgn(tr.slope, 2) + ' kg/pekan (' + sgn(tr.slope / tr.fitLast * 100, 2) + '% berat badan per pekan); perkiraan kasar'];
  if (need && !need.none) lj.push('target fase butuh ±' + fmt(need.kgWk, 2) + ' kg/pekan');
  L.push('LAJU:\n' + lj.map(x => '- ' + x).join('\n'));
  const v = trVerdict(tr, ph, need);
  L.push('PENILAIAN MESIN LOKAL (jadikan ini dasar kesimpulan):\n- ' + v.title + '. ' + v.text);
  const pr = trProject(ph);
  let pj = null;
  if (pr.st === 'hold') pj = 'Fase ' + ph.id + ' mempertahankan berat badan; tidak ada target untuk diproyeksikan';
  else if (pr.st === 'done') pj = 'garis tren (±' + fmt(pr.now, 1) + ' kg) sudah sama dengan atau di bawah target ' + fmt(pr.goal, 1) + ' kg';
  else if (pr.st === 'flat') pj = 'berat tidak turun menurut garis tren, jadi tanggal tercapainya target tidak bisa diproyeksikan';
  else if (pr.st === 'ok') {
    pj = 'perkiraan target ' + fmt(pr.goal, 1) + ' kg tercapai sekitar ' + dY(pr.date) + ' (kisaran ' + dY(pr.early) + (pr.late ? ' sampai ' + dY(pr.late) : ', batas lambat tak tentu') + ')';
    if (pr.end) pj += pr.vsEnd > 0 ? '; ' + pr.vsEnd + ' hari lebih cepat dari akhir fase' : pr.vsEnd < 0 ? '; ' + (-pr.vsEnd) + ' hari lebih lambat dari akhir fase, berat perkiraan di akhir fase ±' + fmt(pr.atEnd, 1) + ' kg' : '; tepat di akhir fase';
    else pj += '; akhir fase tidak diketahui (tanggal mulai belum diatur)';
  }
  if (pj) L.push('PROYEKSI:\n- ' + pj);
  const w = trendOf('waist', TR_PROJ_WEEKS);
  if (w.ok) L.push('LINGKAR PERUT:\n- ' + sgn(w.slope, 2) + ' cm/pekan (' + w.cnt + ' pekan berisi data)');
  const c14 = ctx.range(14);
  if (!c14.empty) L.push('14 HARI TERAKHIR:\n' + c14.text);
  L.push('PENYESUAIAN RENCANA OTOMATIS:\n' + b14AdjLines(ph).map(x => '- ' + x).join('\n'));
  const body = L.join('\n\n'), user = body + '\n\nNilai apakah progresku sudah on-track.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}
const b14Ctx = kind => kind === 'week' ? b14WeekCtx() : b14TrackCtx();

/* --- tampilan --- */
function b14EmptyHTML(kind) {
  const w = kind === 'week';
  return '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>' + (w ? 'Ringkasan pekan' : 'Apakah on-track?') + '</h4><p class="note">' +
    esc(w ? 'Temuan pekan yang dipilih dan satu atau dua fokus untuk pekan depan, dari log harian dan audit mingguanmu. Setelah tampil, kamu bisa bertanya lanjutan.'
      : 'Penilaian progres terhadap target fase aktif, dari tren berat, kebutuhan fase, dan proyeksi yang dihitung di perangkat ini. AI hanya menjelaskan dan tidak mengubah rencanamu.') +
    '</p><div class="quick"><button class="btn primary" data-q="fcGen">' + (w ? 'Susun ringkasan' : 'Nilai progres') + '</button></div></div>';
}
function b14Sync() {
  const on = !!adb.on, r = $('#aiWeekRow'), s = $('#aiTrackSec');
  if (r) {
    r.hidden = !on;
    const b = r.querySelector('button'), lab = '✦ Ringkas ' + (curW === thisWeek() ? 'pekan ini' : 'pekan ' + shortDate(curW));
    if (b && b.textContent !== lab) b.textContent = lab;
  }
  if (s) s.hidden = !on;
}
QACT.weekAi = () => {
  const ws = curW;
  if (FC.week.ws !== ws || FC.week.date !== today()) { FC.week = fcBlankW(); FC.week.ws = ws; fcDraft.week = ''; }
  fcOpen('week');
};
QACT.trackAi = () => fcOpen('track');
window.DL = Object.freeze(Object.assign({}, window.DL, { b14: Object.freeze({ ctx: b14Ctx, clean: b14Clean, post: b14Post, adjLines: b14AdjLines, sys: B14_SYS, plat: B14_PLAT }) }));

/* ===== MODUL: RIWAYAT KALENDER, CARI, FILTER & POLA (batch 15) ===== */
// Riwayat punya empat tab kecil (hanya di memori): Ringkas (isi lama, tidak diubah), Kalender, Cari, Pola.
// Semuanya dihitung LOKAL di perangkat ini; tidak ada panggilan AI dan tidak ada jaringan. Tidak ada kunci penyimpanan baru.
// Kalender: heatmap bulanan (Terisi / Skor / Kalori / Latihan). Cari: kata (tanpa membedakan huruf dan aksen, semua kata harus ada) di evaluasi,
// catatan pantangan, bagian kram, catatan shalat, nama makanan, dan catatan audit mingguan, ditambah filter Kram / Melanggar pantangan / Hari rest
// (semua filter yang dipilih berlaku sekaligus). Pola: korelasi sederhana tidur <-> RPE dan air <-> kram, dengan ambang data dan peringatan data sedikit.
const HX_TABS = [['sum', 'Ringkas'], ['cal', 'Kalender'], ['find', 'Cari'], ['pat', 'Pola']];
const HX_MET = [['fill', 'Terisi'], ['score', 'Skor'], ['kcal', 'Kalori'], ['train', 'Latihan']];
const HX_FLT = [['kram', 'Kram'], ['junk', 'Melanggar pantangan'], ['rest', 'Hari rest']];
const HX_PAGE = 30, HX_WEEK_MAX = 10, HX_Q_MAX = 80, HX_WORDS_MAX = 6;
const HX_MIN_N = 8, HX_OK_N = 30, HX_GRP_MIN = 3, HX_SLEEP_CUT = 7;
const HX_RNG = [[30, '30 hari'], [90, '90 hari'], [0, 'Semua']];
let hxTab = 'sum', hxMonth = '', hxMet = 'fill', hxQ = '', hxLimit = HX_PAGE, hxRng = 90, hxT = null;
const hxFlt = { kram: false, junk: false, rest: false };

/* --- umum --- */
const hxNormCh = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function hxMap(s) {   // teks asli -> teks ternormalisasi + posisi asal tiap huruf (untuk menandai kata di teks asli)
  s = String(s == null ? '' : s);
  let n = '', i = 0; const st = [], en = [];
  for (const ch of s) {
    const nn = hxNormCh(ch);
    for (let k = 0; k < nn.length; k++) { st.push(i); en.push(i + ch.length); }
    n += nn; i += ch.length;
  }
  return { n, st, en };
}
const hxWords = q => hxNormCh(q).split(/\s+/).filter(Boolean).slice(0, HX_WORDS_MAX);
function hxAllDays() {   // semua tanggal (sampai hari ini) yang punya catatan harian atau daftar makanan, terbaru dulu
  const t = today(), s = new Set();
  Object.keys(db).forEach(d => { if (DATE_RE.test(d) && d <= t) s.add(d); });
  Object.keys(edb).forEach(d => { if (DATE_RE.test(d) && d <= t && edb[d] && edb[d].length) s.add(d); });
  Object.keys(tdb).forEach(d => { if (DATE_RE.test(d) && d <= t && jrRides(d).some(r => String(r.note || '').trim())) s.add(d); });   // ride bercatatan (batch 17-J2)
  return Array.from(s).sort().reverse();
}
const hxTest = (k, e) => k === 'kram' ? e.kram === 'ya' : k === 'junk' ? e.junk === 'melanggar' : e.sesi.includes('rest');
function hxFlags(d) {
  const e = db[d], f = [];
  if (!e) return f;
  if (e.kram === 'ya') f.push('Kram');
  if (e.junk === 'melanggar') f.push('Melanggar');
  if (e.sesi.includes('rest')) f.push('Rest');
  return f;
}
function hxBrief(d) {   // ringkasan satu baris hari (dipakai bila pencarian hanya memakai filter)
  const e = db[d], p = [];
  if (e) {
    if (e.kram === 'ya') p.push('Kram' + (e.kramPart.trim() ? ': ' + aiTxt(e.kramPart, 30) : ''));
    if (e.junk === 'melanggar') p.push('Melanggar pantangan' + (e.junkNote.trim() ? ': ' + aiTxt(e.junkNote, 40) : ''));
    if (e.sesi.includes('rest')) p.push('Hari rest');
    else if (e.sesi.length) p.push(e.sesi.map(x => AI_SES[x] || x).join(' + ') + (e.rpe != null ? ', RPE ' + e.rpe : ''));
    const k = num(e.kcal); if (k != null) p.push(fmt(k, 0) + ' kcal');
    const s = num(e.sleep); if (s != null) p.push('tidur ' + fmt(s, 1) + ' j');
  }
  return p.join('  ·  ') || 'Belum ada isian';
}

/* --- pencarian --- */
function hxFields(d) {
  const e = db[d], L = [];
  if (e) [['eval', 'Evaluasi'], ['junkNote', 'Catatan pantangan'], ['kramPart', 'Bagian kram'], ['shalatNote', 'Catatan shalat']].forEach(([k, l]) => {
    const t = String(e[k] == null ? '' : e[k]).trim(); if (t) L.push({ l, t });
  });
  const m = edb[d];
  if (m && m.length) { const t = m.map(x => x.n).filter(Boolean).join(', '); if (t) L.push({ l: 'Makanan', t }); }
  { const t = jrRides(d).map(r => String(r.note || '').trim()).filter(Boolean).join(', '); if (t) L.push({ l: 'Catatan ride', t }); }
  return L;
}
function hxMark(t, m, words) {   // potongan teks asli di sekitar kata pertama; teks di-escape DULU, baru diberi <mark>
  const R = [];
  words.forEach(w => { let i = m.n.indexOf(w), c = 0; while (i >= 0 && c++ < 30) { R.push([m.st[i], m.en[i + w.length - 1]]); i = m.n.indexOf(w, i + w.length); } });
  R.sort((a, b) => a[0] - b[0]);
  const M = []; R.forEach(r => { const l = M[M.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else M.push([r[0], r[1]]); });
  const a = M.length ? Math.max(0, M[0][0] - 36) : 0, b = Math.min(t.length, a + 140);
  let out = a > 0 ? '…' : '', pos = a;
  M.forEach(r => {
    if (r[1] <= a || r[0] >= b) return;
    const s = Math.max(r[0], pos), e = Math.min(r[1], b);
    out += esc(t.slice(pos, s)) + '<mark class="hx">' + esc(t.slice(s, e)) + '</mark>'; pos = e;
  });
  return out + esc(t.slice(pos, b)) + (b < t.length ? '…' : '');
}
function hxHit(fields, words) {   // semua kata harus ada (di gabungan teks); hasil = potongan HTML bertanda, atau null bila tidak cocok
  const ns = fields.map(f => hxNormCh(f.t)), all = ns.join('\n');
  if (!words.every(w => all.includes(w))) return null;
  const i = ns.findIndex(n => words.some(w => n.includes(w)));
  return '<b>' + esc(fields[i].l) + '</b>: ' + hxMark(fields[i].t, hxMap(fields[i].t), words);
}
function hxSearch() {   // null = tanpa kata dan tanpa filter
  const words = hxWords(hxQ), fl = Object.keys(hxFlt).filter(k => hxFlt[k]);
  if (!words.length && !fl.length) return null;
  const pool = hxAllDays(), days = [], weeks = [];
  pool.forEach(d => {
    const e = db[d];
    if (fl.length && !(e && fl.every(k => hxTest(k, e)))) return;
    let snip = '';
    if (words.length) { snip = hxHit(hxFields(d), words); if (snip == null) return; }
    days.push({ d, snip });
  });
  if (words.length && !fl.length) {
    Object.keys(wdb).filter(w => DATE_RE.test(w)).sort().reverse().forEach(w => {
      const n = wdb[w] && String(wdb[w].note || '').trim(); if (!n) return;
      const h = hxHit([{ l: 'Catatan audit', t: n }], words); if (h != null) weeks.push({ w, snip: h });
    });
  }
  return { words, fl, pool: pool.length, days, weeks };
}
function hxFindBuild() {   // kerangka dibuat sekali supaya kolom cari tidak kehilangan fokus saat hasil digambar ulang
  const box = $('#histFind'); if (!box || $('#hxQ', box)) return;
  box.innerHTML = '<label class="hxsr" for="hxQ">Cari di catatan</label>' +
    '<input id="hxQ" class="txt" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="' + HX_Q_MAX + '" placeholder="Cari evaluasi, catatan, makanan…">' +
    '<div class="chips" id="hxFlt" role="group" aria-label="Filter hari">' + HX_FLT.map(f => '<button class="pill" data-q="hxFlt" data-v="' + f[0] + '" aria-pressed="false">' + f[1] + '</button>').join('') + '</div>' +
    '<p class="note" id="hxSum" aria-live="polite"></p><div id="hxList"></div>';
}
function hxRowHTML(x) {
  const fl = hxFlags(x.d);
  return '<button class="hrow" data-date="' + x.d + '"><div class="hd">' + esc(dayShort(x.d)) + '<span>' + esc(fl.join(' · ')) + '</span></div><div class="hm">' + (x.snip || esc(hxBrief(x.d))) + '</div></button>';
}
function hxResPaint() {
  hxFindBuild();
  const q = $('#hxQ'); if (!q) return;
  $$('#hxFlt .pill').forEach(b => b.setAttribute('aria-pressed', String(!!hxFlt[b.dataset.v])));
  const r = hxSearch(), sum = $('#hxSum'), list = $('#hxList');
  if (!r) {
    sum.textContent = 'Ketik kata (evaluasi, catatan pantangan, bagian kram, nama makanan) atau pilih filter. Pencarian berjalan di perangkat ini, di semua hari yang tersimpan.';
    list.innerHTML = ''; return;
  }
  const fn = r.fl.map(k => HX_FLT.find(f => f[0] === k)[1]);
  sum.textContent = r.days.length + ' hari cocok dari ' + r.pool + ' hari tercatat' + (r.weeks.length ? ', ditambah ' + r.weeks.length + ' catatan audit pekan' : '') +
    (fn.length ? '. Filter: ' + fn.join(' + ') + (fn.length > 1 ? ' (semuanya berlaku sekaligus)' : '') : '') + '.';
  let h = '';
  if (!r.days.length && !r.weeks.length) h = '<div class="empty">Tidak ada yang cocok. Coba kata yang lebih pendek atau lepas satu filter.</div>';
  r.days.slice(0, hxLimit).forEach(x => { h += hxRowHTML(x); });
  if (r.days.length > hxLimit) h += '<button class="btn sm ghost hxmore" data-q="hxMore">Tampilkan lebih banyak (sisa ' + (r.days.length - hxLimit) + ')</button>';
  if (r.weeks.length) {
    h += '<h2 class="sub">Catatan audit mingguan</h2>';
    r.weeks.slice(0, HX_WEEK_MAX).forEach(x => {
      const e = wdb[x.w];
      h += '<button class="hrow" data-wdate="' + x.w + '"><div class="hd">' + esc((e && e.no !== '' ? 'Minggu ' + e.no + ': ' : '') + rangeLabel(x.w)) + '</div><div class="hm">' + x.snip + '</div></button>';
    });
    if (r.weeks.length > HX_WEEK_MAX) h += '<p class="note">Menampilkan ' + HX_WEEK_MAX + ' dari ' + r.weeks.length + ' catatan pekan. Persempit kata cari.</p>';
  }
  list.innerHTML = h;
}

/* --- kalender --- */
const hxMs = d => d.slice(0, 8) + '01';
const hxShift = (ms, n) => { const [y, m] = ms.split('-').map(Number); return ymd(new Date(y, m - 1 + n, 1)); };
function hxFirstMonth() {   // bulan data tertua, tetapi minimal 3 bulan terakhir bisa dilihat
  const t = today(), lim = hxShift(hxMs(t), -2);
  const ks = Object.keys(db).concat(Object.keys(tdb), Object.keys(cdb), Object.keys(edb)).filter(d => DATE_RE.test(d) && d <= t).sort();
  return ks.length && hxMs(ks[0]) < lim ? hxMs(ks[0]) : lim;
}
function hxCalMonth() {
  let m = hxMonth || hxMs(today()); const f = hxFirstMonth(), c = hxMs(today());
  if (m < f) m = f; if (m > c) m = c;
  return m;
}
function hxLevel(d, met) {   // 0 = tidak ada data, 1-4 = makin penuh/baik, -1 = di luar target (hanya Kalori)
  const e = db[d], t = tdb[d];
  if (met === 'fill') {
    if (!e) return 0;
    const c = completion(e); if (!c[0]) return 0;
    const r = c[0] / c[1]; return r >= 1 ? 4 : r >= 0.67 ? 3 : r >= 0.34 ? 2 : 1;
  }
  if (met === 'score') {
    const s = dayScore(d).score; if (s == null) return 0;
    return s >= 80 ? 4 : s >= 60 ? 3 : s >= 35 ? 2 : 1;
  }
  if (met === 'kcal') {
    const k = e ? num(e.kcal) : null; if (k == null) return 0;
    return kcalOk(k, tgFor(d)) ? 4 : -1;
  }
  const did = (t && ((t.kal && t.kal.done) || (t.rides && t.rides.length))) || (e && (e.sesi.includes('kalistenik') || e.sesi.includes('sepeda')));
  if (did) return 4;
  if (e && e.sesi.includes('rest')) return 2;
  if (t && t.kal) return 1;
  return 0;
}
const HX_LEG = {
  fill: [['l0', 'kosong'], ['l1', 'sedikit'], ['l2', 'setengah'], ['l3', 'hampir'], ['l4', 'lengkap']],
  score: [['l0', 'tanpa data'], ['l1', '< 35'], ['l2', '35-59'], ['l3', '60-79'], ['l4', '≥ 80']],
  kcal: [['l0', 'tidak dicatat'], ['l4', 'sesuai target'], ['lb', 'di luar target']],
  train: [['l0', 'tidak ada'], ['l1', 'belum selesai'], ['l2', 'istirahat'], ['l4', 'latihan']]
};
function hxCellLabel(d, met) {
  const e = db[d], p = [dayLong(d)];
  if (!e && !dayHasData(d)) return p[0] + ': belum ada catatan';
  if (e) { const c = completion(e); p.push(c[0] + ' dari ' + c[1] + ' terisi'); }
  if (met === 'score') { const s = dayScore(d).score; if (s != null) p.push('skor ' + s); }
  if (met === 'kcal' && e && num(e.kcal) != null) p.push(fmt(num(e.kcal), 0) + ' kcal, ' + (kcalOk(num(e.kcal), tgFor(d)) ? 'sesuai target' : 'di luar target'));
  if (met === 'train') { const l = hxLevel(d, 'train'); p.push(l === 4 ? 'ada latihan' : l === 2 ? 'hari istirahat' : l === 1 ? 'sesi belum selesai' : 'tanpa latihan'); }
  const fl = hxFlags(d).filter(x => x !== 'Rest'); if (fl.length) p.push(fl.join(', ').toLowerCase());
  return p.join(', ');
}
function hxMonthStats(ms, met) {
  const [y, m] = ms.split('-').map(Number), nd = new Date(y, m, 0).getDate(), t = today();
  const S = { total: 0, rec: 0, kram: 0, junk: 0, fillSum: 0, fillN: 0, scSum: 0, scN: 0, kOk: 0, kN: 0, tr: 0, rest: 0 };
  for (let i = 1; i <= nd; i++) {
    const d = ms.slice(0, 8) + pad(i); if (d > t) continue;
    S.total++;
    if (dayHasData(d)) S.rec++;
    const e = db[d];
    if (e) {
      const c = completion(e); if (c[0]) { S.fillSum += c[0] / c[1]; S.fillN++; }
      if (e.kram === 'ya') S.kram++; if (e.junk === 'melanggar') S.junk++;
      const k = num(e.kcal); if (k != null) { S.kN++; if (kcalOk(k, tgFor(d))) S.kOk++; }
    }
    const sc = dayScore(d).score; if (sc != null) { S.scSum += sc; S.scN++; }
    const l = hxLevel(d, 'train'); if (l === 4) S.tr++; else if (l === 2) S.rest++;
  }
  return S;
}
function hxCalHTML() {
  const ms = hxCalMonth(), [y, m] = ms.split('-').map(Number), t = today(), met = hxMet;
  const nd = new Date(y, m, 0).getDate(), lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  let g = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => '<div class="hxdow" aria-hidden="true">' + x + '</div>').join('');
  for (let i = 0; i < lead; i++) g += '<div class="hxc pad" aria-hidden="true"></div>';
  for (let i = 1; i <= nd; i++) {
    const d = ms.slice(0, 8) + pad(i);
    if (d > t) { g += '<div class="hxc off" aria-hidden="true">' + i + '</div>'; continue; }
    const l = hxLevel(d, met), e = db[d];
    g += '<button class="hxc ' + (l < 0 ? 'lb' : 'l' + l) + (d === t ? ' tdy' : '') + '" data-date="' + d + '" aria-label="' + esc(hxCellLabel(d, met)) + '"><span>' + i + '</span>' +
      (e && e.kram === 'ya' ? '<i class="k"></i>' : '') + (e && e.junk === 'melanggar' ? '<i class="j"></i>' : '') + '</button>';
  }
  const S = hxMonthStats(ms, met), pc = x => fmt(x, 0);
  const line = ({
    fill: S.fillN ? 'Rata-rata terisi ' + pc(S.fillSum / S.fillN * 100) + '% dari ' + S.fillN + ' hari yang ada isiannya.' : 'Belum ada isian di bulan ini.',
    score: S.scN ? 'Skor rata-rata ' + pc(S.scSum / S.scN) + ' dari ' + S.scN + ' hari.' : 'Belum ada skor di bulan ini.',
    kcal: S.kN ? 'Kalori sesuai target di ' + S.kOk + ' dari ' + S.kN + ' hari yang dicatat.' : 'Belum ada kalori yang dicatat di bulan ini.',
    train: S.tr || S.rest ? S.tr + ' hari latihan, ' + S.rest + ' hari istirahat.' : 'Belum ada latihan atau hari istirahat di bulan ini.'
  })[met];
  const leg = HX_LEG[met].map(x => '<span><b class="' + x[0] + '"></b>' + x[1] + '</span>').join('') + '<span><i class="k"></i>kram</span><span><i class="j"></i>melanggar pantangan</span>';
  const first = hxFirstMonth(), cm = hxMs(t);
  return '<div class="hxmon"><button class="arrow" data-q="hxMon" data-v="-1" aria-label="Bulan sebelumnya"' + (ms <= first ? ' disabled' : '') + '>‹</button>' +
    '<h2 aria-live="polite">' + BULAN[m - 1] + ' ' + y + '</h2>' +
    '<button class="arrow" data-q="hxMon" data-v="1" aria-label="Bulan berikutnya"' + (ms >= cm ? ' disabled' : '') + '>›</button></div>' +
    '<div class="seg hxmet" role="group" aria-label="Warna kalender">' + HX_MET.map(x => '<button class="pill" data-q="hxMet" data-v="' + x[0] + '" aria-pressed="' + (x[0] === met) + '">' + x[1] + '</button>').join('') + '</div>' +
    '<div class="hxgrid">' + g + '</div><div class="hxleg">' + leg + '</div>' +
    '<p class="hxsum">' + S.rec + ' dari ' + S.total + ' hari tercatat. ' + esc(line) + '<small>Kram ' + S.kram + ' hari · melanggar pantangan ' + S.junk + ' hari. Ketuk tanggal untuk membuka hari itu di Jurnal.</small></p>';
}
const hxCalPaint = () => { const b = $('#histCal'); if (b) b.innerHTML = hxCalHTML(); };

/* --- pola (korelasi sederhana) --- */
function hxPearson(xs, ys) {
  const n = xs.length; if (n < 2 || ys.length !== n) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx <= 1e-12 || syy <= 1e-12) return null;
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}
const hxStrength = r => { const a = Math.abs(r); return a < 0.2 ? 'sangat lemah' : a < 0.4 ? 'lemah' : a < 0.6 ? 'sedang' : 'kuat'; };
const hxF = (x, d) => x.toFixed(d).replace('.', ',');
const hxS = (x, d) => { const t = hxF(Math.abs(x), d); return /^[0,]+$/.test(t) ? t : (x < 0 ? '−' : '+') + t; };
const hxAvg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
function hxRangeDays(rng) {
  rng = rng == null ? hxRng : rng;
  const t = today(), all = Object.keys(db).filter(d => DATE_RE.test(d) && d <= t).sort();
  if (!rng) return all;
  const from = addDays(t, -(rng - 1)); return all.filter(d => d >= from);
}
function hxPat(rng) {
  const days = hxRangeDays(rng), P = { days: days.length, sleep: null, water: null };
  const sx = [], sy = [], lo = [], hi = [];
  days.forEach(d => {
    const e = db[d], s = num(e.sleep);
    if (s == null || s < 0 || s > 24 || e.rpe == null || isRestOnly(e)) return;
    sx.push(s); sy.push(e.rpe); (s < HX_SLEEP_CUT ? lo : hi).push(e.rpe);
  });
  P.sleep = { n: sx.length, nLo: lo.length, nHi: hi.length, avgLo: hxAvg(lo), avgHi: hxAvg(hi), r: null, st: 'ok' };
  if (sx.length < HX_MIN_N) P.sleep.st = 'few';
  else { P.sleep.r = hxPearson(sx, sy); if (P.sleep.r == null) P.sleep.st = 'flat'; }
  const wx = [], wy = [], wk = [], wn = [];
  days.forEach(d => {
    const e = db[d], w = num(e.water);
    if ((e.kram !== 'ya' && e.kram !== 'tidak') || w == null || w < 0 || w > 20) return;
    wx.push(w); wy.push(e.kram === 'ya' ? 1 : 0); (e.kram === 'ya' ? wk : wn).push(w);
  });
  P.water = { n: wx.length, nK: wk.length, nN: wn.length, avgK: hxAvg(wk), avgN: hxAvg(wn), r: null, st: 'ok' };
  if (wx.length < HX_MIN_N) P.water.st = 'few';
  else if (wk.length < HX_GRP_MIN || wn.length < HX_GRP_MIN) P.water.st = 'groups';
  else { P.water.r = hxPearson(wx, wy); if (P.water.r == null) P.water.st = 'flat'; }
  return P;
}
function hxCardHTML(title, sub, c, body) {
  let h = '<section class="hxcard"><h3>' + esc(title) + '</h3><p class="cmp">' + esc(sub) + '</p>';
  if (c.st === 'few') h += '<p>Belum dihitung: butuh minimal ' + HX_MIN_N + ' hari berpasangan, sekarang baru ' + c.n + '.</p>';
  else if (c.st === 'groups') h += '<p>Belum dihitung: butuh minimal ' + HX_GRP_MIN + ' hari kram dan ' + HX_GRP_MIN + ' hari tanpa kram. Sekarang ' + c.nK + ' hari kram dan ' + c.nN + ' hari tanpa kram.</p>';
  else if (c.st === 'flat') h += '<p>Belum bisa dihitung: nilainya hampir sama di semua hari (' + c.n + ' hari), jadi tidak ada variasi yang bisa dibandingkan.</p>';
  else {
    h += '<div class="big">r = ' + hxS(c.r, 2) + ' <small>' + hxStrength(c.r) + ', ' + c.n + ' hari berpasangan</small></div>' + body;
    if (c.n < HX_OK_N) h += '<p class="warn">⚠ Data masih sedikit (' + c.n + ' hari). Anggap ini petunjuk awal, bukan kesimpulan; satu dua hari yang ganjil bisa mengubah angkanya.</p>';
  }
  return h + '</section>';
}
function hxPatHTML() {
  const P = hxPat(), s = P.sleep, w = P.water;
  let sb = '';
  if (s.st === 'ok') {
    sb += '<p>' + (Math.abs(s.r) < 0.2 ? 'Hampir tidak ada hubungan yang terlihat antara lama tidur dan RPE.' : s.r < 0 ? 'Pada hari tidurmu lebih lama, RPE cenderung lebih rendah.' : 'Pada hari tidurmu lebih lama, RPE cenderung lebih tinggi.') + '</p>';
    if (s.nLo >= HX_GRP_MIN && s.nHi >= HX_GRP_MIN) sb += '<p class="cmp">Tidur kurang dari ' + HX_SLEEP_CUT + ' jam: RPE rata-rata ' + hxF(s.avgLo, 1) + ' (' + s.nLo + ' hari). Tidur ' + HX_SLEEP_CUT + ' jam atau lebih: RPE rata-rata ' + hxF(s.avgHi, 1) + ' (' + s.nHi + ' hari).</p>';
  }
  let wb = '';
  if (w.st === 'ok') {
    wb += '<p>' + (Math.abs(w.r) < 0.2 ? 'Hampir tidak ada hubungan yang terlihat antara air putih dan kram.' : w.r < 0 ? 'Hari kram cenderung punya air putih lebih sedikit.' : 'Hari kram cenderung punya air putih lebih banyak (bisa jadi kamu minum lebih banyak setelah kram).') + '</p>' +
      '<p class="cmp">Hari kram: air rata-rata ' + hxF(w.avgK, 2) + ' L (' + w.nK + ' hari). Hari tanpa kram: ' + hxF(w.avgN, 2) + ' L (' + w.nN + ' hari). Selisih ' + hxS(w.avgK - w.avgN, 2) + ' L.</p>';
  }
  const rb = HX_RNG.map(x => '<button class="pill" data-q="hxRng" data-v="' + x[0] + '" aria-pressed="' + (x[0] === hxRng) + '">' + x[1] + '</button>').join('');
  return '<div class="seg hxmet" role="group" aria-label="Rentang waktu">' + rb + '</div>' +
    '<p class="hxsum">' + (hxRng ? hxRng + ' hari terakhir' : 'Semua hari') + ': ' + P.days + ' hari tercatat.</p>' +
    hxCardHTML('Tidur dan RPE', 'Lama tidur semalam dibandingkan RPE sesi di hari yang sama (hari rest tidak dihitung).', s, sb) +
    hxCardHTML('Air putih dan kram', 'Air putih hari itu dibandingkan ada atau tidaknya kram.', w, wb) +
    '<p class="note hxfoot">Korelasi menunjukkan dua hal bergerak bersama, bukan bahwa yang satu menyebabkan yang lain. Dihitung di perangkat ini dari log hariannya dan tidak dikirim ke mana pun. r mendekati 0 = hampir tanpa hubungan; mendekati ±1 = hubungan kuat.</p>';
}
const hxPatPaint = () => { const b = $('#histPat'); if (b) b.innerHTML = hxPatHTML(); };

/* --- tab + aksi --- */
function b15Paint() {
  const seg = $('#histSeg'); if (!seg) return;
  $$('#histSeg .pill').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === hxTab)));
  $('#histBody').hidden = hxTab !== 'sum'; $('#histCal').hidden = hxTab !== 'cal'; $('#histFind').hidden = hxTab !== 'find'; $('#histPat').hidden = hxTab !== 'pat';
  if (hxTab === 'cal') hxCalPaint(); else if (hxTab === 'find') hxResPaint(); else if (hxTab === 'pat') hxPatPaint();
}
QACT.hxTab = el => { const v = el.dataset.v; if (!HX_TABS.some(t => t[0] === v)) return; hxTab = v; b15Paint(); };
QACT.hxMon = el => { hxMonth = hxShift(hxCalMonth(), +el.dataset.v > 0 ? 1 : -1); hxCalPaint(); const b = $('#histCal [data-q="hxMon"]:not(:disabled)'); if (b && el.disabled) b.focus(); };
QACT.hxMet = el => { const v = el.dataset.v; if (!HX_MET.some(t => t[0] === v)) return; hxMet = v; hxCalPaint(); };
QACT.hxRng = el => { const v = +el.dataset.v; if (!HX_RNG.some(t => t[0] === v)) return; hxRng = v; hxPatPaint(); };
QACT.hxFlt = el => { const k = el.dataset.v; if (!(k in hxFlt)) return; hxFlt[k] = !hxFlt[k]; hxLimit = HX_PAGE; hxResPaint(); };
QACT.hxMore = () => { hxLimit += HX_PAGE; hxResPaint(); };
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || el.id !== 'hxQ') return;
  hxQ = el.value.slice(0, HX_Q_MAX); clearTimeout(hxT);
  hxT = setTimeout(() => { hxLimit = HX_PAGE; hxResPaint(); }, 150);
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b15: Object.freeze({
  search: hxSearch, words: hxWords, norm: hxNormCh, pearson: hxPearson, pat: hxPat, fmtR: hxS, level: hxLevel, strength: hxStrength,
  calMonth: hxCalMonth, firstMonth: hxFirstMonth, monthStats: hxMonthStats, allDays: hxAllDays, brief: hxBrief,
  state: () => ({ tab: hxTab, met: hxMet, q: hxQ, rng: hxRng, limit: hxLimit, flt: Object.assign({}, hxFlt) }),
  lim: { MIN_N: HX_MIN_N, OK_N: HX_OK_N, GRP_MIN: HX_GRP_MIN, SLEEP_CUT: HX_SLEEP_CUT, PAGE: HX_PAGE }
}) }));

/* ===== MODUL: AI TANYA DATA KAMU (batch 15, langkah 15b) ===== */
// ✦ Tanya data kamu (Riwayat) = obrolan bubble jenis 'ask' di panel #fchat (mesin Batch 12-1/14: Ulangi, Salin, Baru, Lihat data, Berhenti, Coba lagi).
// TIDAK ada jawaban otomatis: panel terbuka kosong; panggilan AI hanya dari tombol kirim atau saran (ketukan kirim = izin panggilan).
// Semua angka dihitung LOKAL (aiStatLines, hitungan per bulan/hari dalam pekan, kejadian terakhir, korelasi hxPat); AI hanya menyusun jawaban dan
// TIDAK menulis ke data apa pun (modul ini tidak menyentuh db/tdb/wdb/edb). Filter privasi (aiOn) berlaku di tiap baris.
// Tidak dikirim: profil (tinggi, usia, jenis kelamin), BMR/TDEE, skor harian, teks `why` mesin saran.
// Data belum cukup (< B15_MIN_DAYS hari tercatat dalam rentang, atau semua grup data tertutup) = tanpa panggilan AI; alasannya tampil di layar kosong panel.
const B15_MIN_DAYS = 3, B15_MONTHS = 6, B15_MATCH_MAX = 10;
const B15_RNG = [[30, '30 hari'], [90, '90 hari'], [0, 'Semua hari']];
let b15Rng = 90;
const b15RngText = () => b15Rng ? b15Rng + ' hari terakhir' : 'semua hari tersimpan';

Object.assign(BR_TITLE, { ask: '✦ Tanya data kamu' });
Object.assign(FC_NOUN, { ask: 'jawaban' });
Object.assign(FC_FOLLOW, {
  ask: 'Ini obrolan Tanya data kamu: pengguna bertanya tentang catatan hariannya sendiri, dan DATA berisi hitungan yang sudah dihitung aplikasi untuk rentang waktu yang tertulis di DATA. ' +
    'Jawab hanya dari DATA dan obrolan sebelumnya; jangan menghitung ulang, menjumlahkan, atau menambah angka baru. ' +
    'Jika DATA tidak memuat jawabannya (misalnya hari di luar rentang, grup data yang tidak dikirim, atau pola yang belum dihitung), katakan terus terang apa yang kurang, dan sebut bahwa rentang bisa diganti lewat tombol Ganti di atas. ' +
    'Untuk korelasi: sebut bahwa itu hanya dua hal yang bergerak bersama, bukan sebab-akibat, dan bila DATA menyebut data masih sedikit atau belum dihitung, katakan itu. ' +
    'Bila membahas berat yang datar atau plateau, ingat bahwa 2 pekan terlalu pendek untuk menyebutnya plateau. ' +
    'Jangan memberi diagnosis atau saran medis. Kamu hanya menjawab: tidak mengubah catatan, target, atau rencana apa pun.'
});
Object.assign(FC_CHIPS, { ask: ['Apa yang paling perlu diperbaiki?', 'Bandingkan bulan ini dengan bulan lalu', 'Jelaskan lebih singkat'] });
Object.assign(FC_CTX, { ask: () => 'Rentang: ' + b15RngText() });

/* --- konteks (semua dihitung lokal) --- */
function b15Days() {   // semua tanggal kalender dalam rentang sampai hari ini (termasuk yang kosong)
  const t = today(); let from;
  if (b15Rng) from = addDays(t, -(b15Rng - 1));
  else { const ks = Object.keys(db).filter(d => DATE_RE.test(d) && d <= t).sort(); from = ks.length ? ks[0] : t; }
  const n = diffDays(from, t) + 1;
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}
function b15WeightLines(days) {
  if (!aiOn('badan')) return [];
  const t = today(), L = [];
  const ws = Object.keys(wdb).filter(w => DATE_RE.test(w) && w >= weekStart(days[0]) && w <= t && num(wdb[w].bw) != null).sort().slice(-6);
  if (ws.length) L.push('berat rata-rata per pekan: ' + ws.map(w => shortDate(w) + ' ' + aiN(num(wdb[w].bw), 2) + ' kg').join('; '));
  if (ws.length > 1) L.push('perubahan berat dari ' + shortDate(ws[0]) + ' ke ' + shortDate(ws[ws.length - 1]) + ': ' + sgn(num(wdb[ws[ws.length - 1]].bw) - num(wdb[ws[0]].bw), 2, true) + ' kg');
  return L;
}
function b15MonthLines(days) {
  const by = {}; days.forEach(d => { if (db[d]) (by[hxMs(d)] = by[hxMs(d)] || []).push(d); });
  return Object.keys(by).sort().slice(-B15_MONTHS).map(m => {
    const ds = by[m], es = ds.map(d => db[d]), [y, mo] = m.split('-').map(Number), g = [ds.length + ' hari tercatat'];
    const avg = f => { const a = es.map(f).filter(x => x != null); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
    const cnt = f => es.filter(f).length;
    if (aiOn('gizi')) { const k = avg(e => num(e.kcal)), p = avg(e => num(e.protein)); if (k != null) g.push('kalori rata-rata ' + aiN(k)); if (p != null) g.push('protein rata-rata ' + aiN(p) + ' g'); }
    if (aiOn('latihan')) { const r = avg(e => e.rpe), n = cnt(e => e.sesi.includes('kalistenik') || e.sesi.includes('sepeda')); if (n) g.push('hari latihan ' + n); if (r != null) g.push('RPE rata-rata ' + aiN(r, 1)); }
    if (aiOn('tidur')) { const s = avg(e => num(e.sleep)); if (s != null) g.push('tidur rata-rata ' + aiN(s, 1) + ' jam'); }
    if (aiOn('kram')) { const a = cnt(e => e.kram != null); if (a) g.push('hari kram ' + cnt(e => e.kram === 'ya') + ' dari ' + a); }
    if (aiOn('junk')) { const a = cnt(e => e.junk != null); if (a) g.push('melanggar pantangan ' + cnt(e => e.junk === 'melanggar') + ' dari ' + a); }
    return BULAN[mo - 1] + ' ' + y + ': ' + g.join('; ');
  });
}
function b15LastLines(days) {
  const ev = days.filter(d => db[d]), t = today(), L = [];
  const last = f => { for (let i = ev.length - 1; i >= 0; i--) if (f(db[ev[i]], ev[i])) return ev[i]; return null; };
  const when = d => dayLong(d) + ', ' + (diffDays(d, t) === 0 ? 'hari ini' : diffDays(d, t) + ' hari lalu');
  if (aiOn('kram') && ev.some(d => db[d].kram != null)) {
    const d = last(e => e.kram === 'ya');
    L.push(d ? 'kram terakhir: ' + when(d) + (db[d].kramPart.trim() ? ' (' + aiTxt(db[d].kramPart, 40) + ')' : '') : 'kram: tidak ada hari kram dalam rentang ini');
  }
  if (aiOn('junk') && ev.some(d => db[d].junk != null)) {
    const d = last(e => e.junk === 'melanggar');
    L.push(d ? 'melanggar pantangan terakhir: ' + when(d) + (db[d].junkNote.trim() ? ' (' + aiTxt(db[d].junkNote, 60) + ')' : '') : 'melanggar pantangan: tidak ada dalam rentang ini');
  }
  if (aiOn('latihan') && ev.some(d => db[d].sesi.length)) {
    [['kalistenik', 'sesi kalistenik'], ['sepeda', 'sesi sepeda'], ['rest', 'hari istirahat']].forEach(([k, n]) => {
      const d = last(e => e.sesi.includes(k));
      L.push(d ? n + ' terakhir: ' + when(d) : n + ': tidak ada yang tercatat dalam rentang ini');
    });
  }
  return L;
}
function b15WeekdayLines(days) {
  const ev = days.filter(d => db[d]), L = [], ord = [1, 2, 3, 4, 5, 6, 0], per = {};
  ord.forEach(i => { per[i] = []; }); ev.forEach(d => per[pd(d).getDay()].push(d));
  const line = (label, f, ofF) => label + ': ' + ord.map(i => { const ds = ofF ? per[i].filter(d => ofF(db[d])) : per[i]; return HARI[i] + ' ' + ds.filter(d => f(db[d])).length + ' dari ' + ds.length; }).join('; ');
  if (aiOn('kram') && ev.some(d => db[d].kram != null)) L.push(line('hari kram menurut hari dalam pekan (dari hari yang kramnya dicatat)', e => e.kram === 'ya', e => e.kram != null));
  if (aiOn('junk') && ev.some(d => db[d].junk != null)) L.push(line('melanggar pantangan menurut hari dalam pekan (dari hari yang dicatat)', e => e.junk === 'melanggar', e => e.junk != null));
  if (aiOn('latihan') && ev.some(d => db[d].sesi.length)) {
    L.push(line('hari latihan kalistenik atau sepeda menurut hari dalam pekan (dari hari tercatat)', e => e.sesi.includes('kalistenik') || e.sesi.includes('sepeda')));
    L.push(line('hari istirahat menurut hari dalam pekan (dari hari tercatat)', e => e.sesi.includes('rest')));
  }
  return L;
}
function b15PatLines() {   // angka yang sama dengan tab Pola (hxPat), untuk rentang obrolan ini
  const P = hxPat(b15Rng), L = [], s = P.sleep, w = P.water;
  if (aiOn('tidur') && aiOn('latihan')) {
    if (s.st === 'ok') {
      L.push('tidur dan RPE (hari rest tidak dihitung): r = ' + hxS(s.r, 2) + ' (' + hxStrength(s.r) + ') dari ' + s.n + ' hari berpasangan' + (s.n < HX_OK_N ? '; PERINGATAN: data masih sedikit, hanya petunjuk awal' : ''));
      if (s.nLo >= HX_GRP_MIN && s.nHi >= HX_GRP_MIN) L.push('tidur kurang dari ' + HX_SLEEP_CUT + ' jam: RPE rata-rata ' + hxF(s.avgLo, 1) + ' (' + s.nLo + ' hari); tidur ' + HX_SLEEP_CUT + ' jam atau lebih: RPE rata-rata ' + hxF(s.avgHi, 1) + ' (' + s.nHi + ' hari)');
    } else if (s.st === 'few') L.push('tidur dan RPE: belum dihitung, baru ' + s.n + ' hari berpasangan (minimal ' + HX_MIN_N + ')');
    else L.push('tidur dan RPE: belum bisa dihitung, nilainya hampir sama di semua hari');
  }
  if (aiOn('gizi') && aiOn('kram')) {
    if (w.st === 'ok') {
      L.push('air putih dan kram: r = ' + hxS(w.r, 2) + ' (' + hxStrength(w.r) + ') dari ' + w.n + ' hari berpasangan' + (w.n < HX_OK_N ? '; PERINGATAN: data masih sedikit, hanya petunjuk awal' : ''));
      L.push('hari kram: air rata-rata ' + hxF(w.avgK, 2) + ' L (' + w.nK + ' hari); hari tanpa kram: ' + hxF(w.avgN, 2) + ' L (' + w.nN + ' hari)');
    } else if (w.st === 'few') L.push('air putih dan kram: belum dihitung, baru ' + w.n + ' hari berpasangan (minimal ' + HX_MIN_N + ')');
    else if (w.st === 'groups') L.push('air putih dan kram: belum dihitung, butuh minimal ' + HX_GRP_MIN + ' hari kram dan ' + HX_GRP_MIN + ' hari tanpa kram (sekarang ' + w.nK + ' dan ' + w.nN + ')');
    else L.push('air putih dan kram: belum bisa dihitung, nilainya hampir sama di semua hari');
  }
  return L;
}
// kata/filter yang sedang aktif di tab Cari ikut sebagai petunjuk, tetapi HANYA lewat kolom dan filter yang grup datanya diizinkan
// (supaya daftar tanggal yang cocok tidak membocorkan isi grup yang ditutup)
const B15_FGRP = { 'Evaluasi': 'teks', 'Catatan pantangan': 'junk', 'Bagian kram': 'kram', 'Catatan shalat': 'ibadah', 'Makanan': 'gizi' };
const B15_FLTGRP = { kram: 'kram', junk: 'junk', rest: 'latihan' };
function b15Matches(days) {
  const words = hxWords(hxQ), fl = Object.keys(hxFlt).filter(k => hxFlt[k]);
  const okFl = fl.filter(k => aiOn(B15_FLTGRP[k]));
  if (!words.length && !okFl.length) return null;
  const set = new Set(days), hits = [];
  hxAllDays().forEach(d => {
    if (!set.has(d)) return;
    const e = db[d];
    if (okFl.length && !(e && okFl.every(k => hxTest(k, e)))) return;
    if (words.length && hxHit(hxFields(d).filter(x => aiOn(B15_FGRP[x.l])), words) == null) return;
    hits.push(d);
  });
  return { words, fl: okFl, n: hits.length, days: hits.slice(0, B15_MATCH_MAX) };
}
function b15Ctx() {
  const t = today(), days = b15Days(), logged = days.filter(d => db[d]).length;
  if (logged < B15_MIN_DAYS) {
    return b14Fail('Data belum cukup untuk dijawab AI: dalam rentang ' + b15RngText() + ' baru ' + logged + ' hari tercatat (minimal ' + B15_MIN_DAYS + '). AI tidak dipanggil supaya tidak mengarang. Isi log harian dulu' + (b15Rng ? ', atau ganti rentang ke yang lebih panjang lewat tombol Ganti di atas.' : '.'), false);
  }
  const stat = aiStatLines(days).concat(b15WeightLines(days));
  if (!stat.length) {
    return b14Fail('Rentang ' + b15RngText() + ' punya ' + logged + ' hari tercatat, tetapi tidak ada isinya yang boleh dikirim ke AI (grup data yang dicentang di Pengaturan AI menentukan). AI tidak dipanggil. Centang grup data yang kamu izinkan.', true);
  }
  const P = [], sec = (h, L) => { if (L && L.length) P.push(h + ':\n' + L.map(x => '- ' + x).join('\n')); };
  P.push('RENTANG DATA: ' + b15RngText() + ' (' + dY(days[0]) + ' sampai ' + dY(t) + '). Hari tercatat ' + logged + ' dari ' + days.length + ' hari. Hari ini ' + dayLong(t) + '.');
  sec('STATISTIK RENTANG', stat);
  sec('PER BULAN (maksimal ' + B15_MONTHS + ' bulan terakhir)', b15MonthLines(days));
  sec('KEJADIAN TERAKHIR (dalam rentang)', b15LastLines(days));
  sec('HARI DALAM PEKAN (hanya dari hari yang tercatat)', b15WeekdayLines(days));
  sec('KORELASI (dihitung aplikasi; dua hal yang bergerak bersama, BUKAN sebab-akibat)', b15PatLines());
  const m = b15Matches(days);
  if (m) {
    const lab = [m.words.length ? 'kata "' + m.words.join(' ') + '"' : '', m.fl.length ? 'filter ' + m.fl.map(k => HX_FLT.find(f => f[0] === k)[1]).join(' + ') : ''].filter(Boolean).join(', ');
    sec('HARI YANG COCOK DENGAN PENCARIAN DI TAB CARI (' + lab + '; ' + m.n + ' hari cocok dalam rentang' + (m.n > m.days.length ? ', paling baru ' + m.days.length + ' ditampilkan' : '') + ')',
      m.days.map(d => dayShort(d) + ': ' + (aiDayLines(d).join('; ') || '(tidak ada isian yang boleh dikirim)').slice(0, 420)));
  }
  const body = P.join('\n\n');
  return { user: body, body, basis: body + ' ' + dayLong(t), empty: false };
}

/* --- tampilan --- */
function b15Starters() {
  const L = [];
  if (aiOn('kram')) L.push('Kapan terakhir kali aku kram?');
  if (aiOn('junk')) L.push('Berapa hari aku melanggar pantangan?');
  if (aiOn('tidur') && aiOn('latihan')) L.push('Apakah tidur memengaruhi RPE-ku?');
  if (aiOn('latihan')) L.push('Pada hari apa aku paling sering latihan?');
  L.push('Apa yang paling perlu diperbaiki dari catatanku?');
  return L.slice(0, 4);
}
function b15EmptyHTML() {
  const c = b15Ctx();
  let h = '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>Tanya data kamu</h4><p class="note">' +
    esc('Tanya tentang catatan harianmu sendiri: kapan terakhir kram, berapa hari melanggar pantangan, apakah tidur memengaruhi RPE. Angka dihitung di perangkat ini; AI hanya menyusun jawabannya dan tidak mengubah datamu.') + '</p>';
  if (c.empty) {
    h += '<p class="note"><b>' + esc(c.emptyMsg) + '</b></p>' + (c.emptyBtn ? '<div class="quick"><button class="btn primary" data-q="fcSettings">Buka pengaturan AI</button></div>' : '');
  } else {
    h += '<div class="csug">' + b15Starters().map(t => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<p class="note">Atau tulis pertanyaanmu di bawah. Rentang data: ' + esc(b15RngText()) + '.</p>';
  }
  return h + '</div>';
}
function b15Sync() { const r = $('#aiHistRow'); if (r) r.hidden = !adb.on; }

/* --- aksi --- */
QACT.histAi = () => fcOpen('ask');
QACT.fcRng = () => {
  if (fcKind !== 'ask') return;
  if (fcBusy) { toast('Tunggu jawaban selesai dulu, baru ganti rentang'); return; }
  const i = B15_RNG.findIndex(x => x[0] === b15Rng); b15Rng = B15_RNG[(i + 1) % B15_RNG.length][0];
  const st = fcSt(), note = 'Rentang diganti ke ' + b15RngText() + '. Pertanyaan berikutnya memakai data rentang ini.';
  if (fcHasChat(st)) {
    const l = st.msgs[st.msgs.length - 1];
    if (l && l.rngNote) l.text = note; else st.msgs.push({ id: ++fcId, r: 'sys', text: note, rngNote: true });
  }
  fcPaint('end'); fcLive('Rentang diganti ke ' + b15RngText());
};
function b15New() {
  openSheet({ title: 'Mulai obrolan baru?', note: 'Obrolan di layar ini dihapus. Tidak tersimpan di mana pun.',
    actions: [closeBtn, { label: 'Mulai baru', primary: true, fn: () => { closeSheet(); fcTok++; if (fcBusy) AI.cancel(); fcBusy = false; fcWaitStop(); FC.ask = fcBlank(); fcDraft.ask = ''; $('#fcIn').value = ''; fcGrow(); fcPaint('end'); } }] });
}
function b15Peek() {
  const c = b15Ctx();
  openSheet({ title: 'Data yang akan dikirim', note: c.empty ? c.emptyMsg : 'Hanya teks ini, pertanyaanmu, dan obrolan di layar ini yang dikirim. Angka dihitung di perangkat ini; grup data yang tidak dicentang di Pengaturan AI tidak ikut. Profil, skor harian, dan hitungan kalori tubuh tidak dikirim.',
    text: c.empty ? '' : c.body, prose: true, actions: [closeBtn] });
}
{
  const _n = QACT.fcNew, _p = QACT.fcPeek;
  QACT.fcNew = () => fcKind === 'ask' ? b15New() : _n();
  QACT.fcPeek = () => fcKind === 'ask' ? b15Peek() : _p();
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b15: Object.freeze(Object.assign({}, window.DL.b15, {
  ctx: b15Ctx, days: b15Days, matches: b15Matches, starters: b15Starters, rng: () => b15Rng, fcl: FC_FOLLOW.ask,
  lim: Object.assign({}, window.DL.b15.lim, { MIN_DAYS: B15_MIN_DAYS, MONTHS: B15_MONTHS, MATCH_MAX: B15_MATCH_MAX })
})) }));

/* ===== MODUL: KALISTENIK PR, GRAFIK, NYERI, DELOAD, PEMANASAN (batch 16, langkah 16a) ===== */
// Sub-tab Kalistenik: Sesi (tampilan lama + petunjuk Rekor) dan Rekor (PR + grafik reps antar sesi). Semua LOKAL (tanpa AI, tanpa jaringan).
// Modul ini membaca tdb saja; satu-satunya penulisan ke data sesi ada di setState (kal.lv, lihat patch) dan aksi pengguna di bagian nyeri/deload/pemanasan.
// Tangga progresi (pdb.ladder) TIDAK PERNAH diubah di sini: jalurnya tetap hanya QACT.lvl dan QACT.lvlUp (ketukan pengguna).
const B16_MAX_PTS = 12, B16_MAX_GRP = 30;
const B16_PAT = {};   // id gerakan -> pola tangga (push/pull/legs/core); gerakan tanpa pola tidak punya level
Object.keys(EX).forEach(p => ['home', 'gym'].forEach(o => EX[p][o].forEach(e => { if (e.pat) B16_PAT[e.id] = e.pat; })));
const B16_TABS = [['ses', 'Sesi'], ['rek', 'Rekor'], ['pul', 'Pulih'], ['pus', 'Pustaka']];
let b16Tab = 'ses';
let b16Open;      // undefined = belum dipilih (gerakan terbaru dibuka saat pertama digambar); '' = semua tertutup; selain itu = kunci kelompok
let b16Cache = null;   // dipakai selama satu penggambaran supaya tdb tidak dipindai berulang
const b16Unit = id => EXU[id] === 'detik' ? 'dtk' : 'reps';
const b16Name = id => EXN[id] || id;
const b16LvName = (id, lv) => { const p = B16_PAT[id]; return p && lv && LADDER[p] ? LADDER[p].lv[lv - 1] : ''; };

/* kelompok = id gerakan + level tangga yang tercatat pada sesi itu (0 = tidak ada level atau sesi lama tanpa catatan level) */
function b16Compute() {
  const out = {};
  Object.keys(tdb).filter(d => DATE_RE.test(d) && tdb[d] && tdb[d].kal).sort().forEach(d => {
    const k = tdb[d].kal, ex = k.ex || {};
    Object.keys(ex).forEach(id => {
      const ds = (ex[id] && Array.isArray(ex[id].s) ? ex[id].s : []).filter(x => x && x.d && x.r != null && x.r > 0);
      if (!ds.length) return;
      const pat = B16_PAT[id], lv = pat && k.lv && k.lv[pat] ? k.lv[pat] : 0, key = id + '|' + lv;
      const g = out[key] || (out[key] = { key, id, lv, pts: [] });
      g.pts.push({ d, best: Math.max.apply(null, ds.map(x => x.r)), tot: ds.reduce((s, x) => s + x.r, 0), n: ds.length, dl: !!k.dl });
    });
  });
  return out;
}
const b16Series = () => b16Cache || b16Compute();
function b16Prs(g) {   // indeks titik yang memecahkan rekor: LEBIH BESAR dari semua titik sebelumnya (sama = bukan PR; titik pertama bukan PR)
  const r = []; let mx = 0;
  g.pts.forEach((p, i) => { if (i > 0 && p.best > mx) r.push(i); if (p.best > mx) mx = p.best; });
  return r;
}
function b16Sum(g) {
  let bi = 0, ti = 0;
  g.pts.forEach((p, i) => { if (p.best > g.pts[bi].best) bi = i; if (p.tot > g.pts[ti].tot) ti = i; });
  return { best: g.pts[bi].best, bestD: g.pts[bi].d, tot: g.pts[ti].tot, totD: g.pts[ti].d, last: g.pts[g.pts.length - 1], n: g.pts.length, sets: g.pts.reduce((s, p) => s + p.n, 0) };
}
function b16Label(g) {
  const l = b16LvName(g.id, g.lv);
  return b16Name(g.id) + (l ? ' · ' + l : (!g.lv && B16_PAT[g.id] ? ' · level tidak tercatat' : ''));
}

/* petunjuk di bawah nama gerakan pada tab Sesi: hanya bila gerakan itu punya riwayat sebelum hari ini */
function b16ExNote(e) {
  const t = today(), S = b16Series(), lv = e.pat ? (pdb.ladder[e.pat] || 0) : 0;
  const g = S[e.id + '|' + lv];
  let prev = g ? g.pts.filter(p => p.d < t) : [], fb = false;
  if (!prev.length && lv) { const g0 = S[e.id + '|0']; if (g0) { prev = g0.pts.filter(p => p.d < t); fb = prev.length > 0; } }   // sesi lama tanpa catatan level
  if (!prev.length) return '';
  const u = b16Unit(e.id), top = prev.reduce((a, p) => p.best > a.best ? p : a, prev[0]), last = prev[prev.length - 1];
  const cur = exState(e.id, e).filter(x => x.d && x.r != null && x.r > 0).map(x => x.r), pr = cur.length > 0 && Math.max.apply(null, cur) > top.best;
  return '<div class="exv b16n">Rekor ' + top.best + ' ' + u + ' (' + esc(shortDate(top.d)) + ') · sesi lalu ' + last.best + (fb ? ' · level saat itu tidak tercatat' : '') + (pr ? ' <span class="prb">PR baru</span>' : '') + '</div>';
}

/* grafik garis: set terbaik per sesi (maks 12 sesi terakhir); lingkaran = rekor baru; belah ketupat = sesi deload */
function b16LineSVG(g, pts, prs, off) {
  const W = 300, H = 124, B = 16, T = 20, n = pts.length, step = W / n, x = i => step * i + step / 2;
  const vals = pts.map(p => p.best), lo0 = Math.min.apply(null, vals), hi0 = Math.max.apply(null, vals);
  const pad = Math.max((hi0 - lo0) * .3, hi0 * .05, 1), lo = Math.max(0, lo0 - pad), hi = hi0 + pad;
  const y = v => T + (H - B - T) * (1 - (v - lo) / (hi - lo));
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Set terbaik per sesi, ' + b16Name(g.id)) + ', ' + n + ' sesi terakhir">';
  s += '<polyline class="ln" points="' + pts.map((p, i) => x(i).toFixed(1) + ',' + y(p.best).toFixed(1)).join(' ') + '"/>';
  pts.forEach((p, i) => {
    const cx = x(i).toFixed(1), cy = y(p.best).toFixed(1);
    s += p.dl ? '<rect class="dl" x="' + (x(i) - 3.2).toFixed(1) + '" y="' + (y(p.best) - 3.2).toFixed(1) + '" width="6.4" height="6.4" transform="rotate(45 ' + cx + ' ' + cy + ')"/>' : '<circle class="dt" cx="' + cx + '" cy="' + cy + '" r="3"/>';
    if (prs.has(i + off)) s += '<circle class="pr" cx="' + cx + '" cy="' + cy + '" r="6"/>';
    s += '<text class="vl" x="' + cx + '" y="' + (y(p.best) - 9).toFixed(1) + '" text-anchor="middle">' + p.best + '</text>';
  });
  const every = n > 8 ? 2 : 1;
  pts.forEach((p, i) => { if ((n - 1 - i) % every === 0) { const d = pd(p.d); s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + d.getDate() + '/' + (d.getMonth() + 1) + '</text>'; } });
  return s + '</svg>';
}
function b16PanelHTML(g, s) {
  const u = b16Unit(g.id), pts = g.pts.slice(-B16_MAX_PTS), off = g.pts.length - pts.length, prs = new Set(b16Prs(g)), hasDl = pts.some(p => p.dl);
  const lvTxt = g.lv ? 'Level saat itu: ' + esc(b16LvName(g.id, g.lv)) : (B16_PAT[g.id] ? 'Level saat itu tidak tercatat (sesi sebelum Batch 16).' : '');
  return '<div class="b16pan">' +
    '<p>Set terbaik: <b>' + s.best + ' ' + u + '</b> (' + esc(dayShort(s.bestD)) + ')</p>' +
    '<p>Total terbaik satu sesi: <b>' + s.tot + ' ' + u + '</b> (' + esc(dayShort(s.totD)) + ')</p>' +
    '<p>Sesi terakhir: ' + s.last.best + ' ' + u + ' (' + esc(dayShort(s.last.d)) + ', ' + s.last.n + ' set selesai)</p>' +
    '<p>' + s.n + ' sesi tercatat, ' + s.sets + ' set selesai.' + (lvTxt ? ' ' + lvTxt : '') + '</p>' +
    (pts.length >= 2
      ? '<div class="chart"><div class="ch">Set terbaik per sesi <small>' + pts.length + ' sesi terakhir</small></div>' + b16LineSVG(g, pts, prs, off) +
        '<p class="b16leg">Lingkaran besar = rekor baru' + (hasDl ? ' · belah ketupat = sesi deload' : '') + '</p></div>'
      : '<p class="note">Baru 1 sesi tercatat. Grafik muncul mulai sesi kedua.</p>') +
    '</div>';
}
function b16RekHTML() {
  const S = b16Series(), gs = Object.keys(S).map(k => S[k]);
  if (!gs.length) return '<p class="empty">Belum ada set selesai yang tercatat. Rekor dan grafik muncul setelah kamu menandai set selesai di tab Sesi.</p>';
  gs.sort((a, b) => b.pts[b.pts.length - 1].d.localeCompare(a.pts[a.pts.length - 1].d) || a.key.localeCompare(b.key));
  const shown = gs.slice(0, B16_MAX_GRP);
  if (b16Open === undefined) b16Open = shown[0].key;
  return '<p class="note b16lead">Rekor dihitung dari set yang kamu tandai selesai. Gerakan yang sama di level berbeda dihitung terpisah.</p>' +
    shown.map(g => {
      const s = b16Sum(g), on = g.key === b16Open;
      return '<div class="b16g"><button class="b16row" data-q="b16Open" data-k="' + esc(g.key) + '" aria-expanded="' + on + '"><span class="n">' + esc(b16Label(g)) + '</span><span class="v">' + s.best + ' ' + b16Unit(g.id) +
        '</span><small>' + s.n + ' sesi · terakhir ' + esc(shortDate(s.last.d)) + '</small></button>' + (on ? b16PanelHTML(g, s) : '') + '</div>';
    }).join('') +
    (gs.length > shown.length ? '<p class="note">Menampilkan ' + shown.length + ' gerakan terbaru dari ' + gs.length + '.</p>' : '');
}

function b16KalHTML() {
  b16Cache = b16Compute();
  try {
    const bar = '<div class="seg tri b16seg quad" role="group" aria-label="Bagian kalistenik">' +
      B16_TABS.map(t => '<button class="pill" data-q="b16Tab" data-v="' + t[0] + '" aria-pressed="' + (b16Tab === t[0]) + '">' + t[1] + '</button>').join('') + '</div>';
    return bar + b16AiRowHTML() + (b16Tab === 'rek' ? rzHTML() : b16Tab === 'pul' ? plHTML() : b16Tab === 'pus' ? pmHTML() : kzHTML());
  } finally { b16Cache = null; }
}
QACT.b16Tab = el => { const v = el.dataset.v; if (B16_TABS.some(t => t[0] === v)) { if (v === 'pul' && b16Tab !== 'pul') { try { plFresh(); } catch (x) { /* modul belum berjalan */ } } if (v === 'pus' && b16Tab !== 'pus') { try { pmFresh(); } catch (x) { /* modul belum berjalan */ } } if (v === 'rek' && b16Tab !== 'rek') { try { rzFresh(); } catch (x) { /* modul belum berjalan */ } } b16Tab = v; renderTrain(); } };   // k3: masuk tab Rekor = kartu gerakan terlipat
QACT.b16Open = el => { const k = el.dataset.k; b16Open = b16Open === k ? '' : k; renderTrain(); };

/* ===== MODUL: KALISTENIK NYERI, PULIH & DELOAD (batch 16, langkah 16a-2a) ===== */
// Catatan nyeri per gerakan (kal.pain), tab Pulih (nyeri 28 hari, alternatif LOKAL dari tangga progresi, saran deload) dan Mode deload (kal.dl).
// Semua LOKAL (tanpa AI, tanpa jaringan). Tangga progresi (pdb.ladder) dan tabel EX TIDAK PERNAH diubah di sini:
// tidak ada tombol yang menurunkan level atau mengubah jumlah set; jalur tulis tangga tetap hanya QACT.lvl dan QACT.lvlUp.
const B16_PAIN_MIN = 4, B16_PAIN_STOP = 7, B16_PUL_DAYS = 28, B16_DL_MIN = 6, B16_DL_DAYS = 28, B16_DL_LONG = 42, B16_PAIN_MAXID = 20;
let b16PainOpen = {};   // id gerakan -> panel nyeri terbuka (hanya memori)
function b16PainGet(id, d) { const t = tdb[d || today()], k = t && t.kal, p = k && k.pain && k.pain[id]; return p ? { l: p.l, n: p.n } : null; }
const b16PainTxt = p => !p ? 'Catat nyeri' : (p.l == null ? 'Catatan nyeri · ubah' : 'Nyeri ' + p.l + '/10 · ubah');
function b16PainBtn(e, p) {
  return '<button class="link b16pb" data-q="b16PainTog" data-id="' + e.id + '" aria-expanded="' + !!b16PainOpen[e.id] + '" aria-controls="pn_' + e.id + '">' + b16PainTxt(p) + '</button>';
}
function b16PainPanel(e, p) {
  const l = p ? p.l : null, nm = esc(e.n);
  return '<div class="b16pn" id="pn_' + e.id + '">' +
    '<div class="b16pr"><button class="btn sm ghost b16st" data-q="b16PainStep" data-id="' + e.id + '" data-v="-1" aria-label="Kurangi nyeri ' + nm + '">−</button>' +
    '<b class="b16pv" aria-live="polite">' + (l == null ? '–' : l) + '<small>/10</small></b>' +
    '<button class="btn sm ghost b16st" data-q="b16PainStep" data-id="' + e.id + '" data-v="1" aria-label="Tambah nyeri ' + nm + '">+</button>' +
    '<button class="link b16pc" data-q="b16PainClear" data-id="' + e.id + '">Hapus catatan</button></div>' +
    '<label class="inp txt"><input data-pn="' + e.id + '" maxlength="120" autocomplete="off" placeholder="Catatan: bagian mana, saat apa" aria-label="Catatan nyeri ' + nm + '" value="' + esc(p ? p.n : '') + '"></label>' +
    '<p class="b16wn" role="alert"' + (l != null && l >= B16_PAIN_STOP ? '' : ' hidden') + '>Nyeri 7 atau lebih: hentikan gerakan ini hari ini.</p>' +
    '<p class="note">Nyeri tajam, bengkak, mati rasa, atau tidak membaik: temui tenaga kesehatan. Ini catatan pribadi, bukan diagnosis.</p></div>';
}
function b16PainHTML(e) {
  const p = b16PainGet(e.id);
  return '<div class="b16pw" data-pw="' + e.id + '">' + b16PainBtn(e, p) + (b16PainOpen[e.id] ? b16PainPanel(e, p) : '') + '</div>';
}
function b16PainSet(id, patch) {
  const k0 = kalGet(false);
  if (patch.l != null || patch.n) {   // entri baru: batas jumlah gerakan per hari (sama dengan tclean)
    const have = k0 && k0.pain ? Object.keys(k0.pain) : [];
    if (!have.includes(id) && have.length >= B16_PAIN_MAXID) { toast('Maksimal ' + B16_PAIN_MAXID + ' gerakan bernyeri per hari'); return false; }
  }
  const k = kalGet(true), old = (k.pain && k.pain[id]) || { l: null, n: '' }, nx = Object.assign({}, old, patch);
  if (nx.l == null && !nx.n) { if (k.pain) { delete k.pain[id]; if (!Object.keys(k.pain).length) delete k.pain; } }
  else { k.pain = k.pain || {}; k.pain[id] = { l: nx.l, n: String(nx.n || '').slice(0, 120) }; }
  kalTouch();
  return true;
}
function b16PainSync(id) {   // perbarui di tempat (fokus dan isi kolom catatan tidak hilang)
  const w = document.querySelector('[data-pw="' + id + '"]'); if (!w) return;
  const p = b16PainGet(id), b = w.querySelector('.b16pb'), v = w.querySelector('.b16pv'), wn = w.querySelector('.b16wn'), inp = w.querySelector('input[data-pn]');
  if (b) b.textContent = b16PainTxt(p);
  if (v) v.innerHTML = (p && p.l != null ? p.l : '–') + '<small>/10</small>';
  if (wn) wn.hidden = !(p && p.l != null && p.l >= B16_PAIN_STOP);
  if (inp && document.activeElement !== inp && inp.value !== (p ? p.n : '')) inp.value = p ? p.n : '';
}
QACT.b16PainTog = el => {
  const id = el.dataset.id, e = exList().find(x => x.id === id), w = el.closest('.b16pw'); if (!e || !w) return;
  b16PainOpen[id] = !b16PainOpen[id];
  const p = b16PainGet(id);
  w.innerHTML = b16PainBtn(e, p) + (b16PainOpen[id] ? b16PainPanel(e, p) : '');
  const nb = w.querySelector('.b16pb'); if (nb) nb.focus();
};
QACT.b16PainStep = el => {
  const id = el.dataset.id, d = +el.dataset.v, p = b16PainGet(id), cur = p && p.l != null ? p.l : null;
  const nl = cur == null ? (d > 0 ? 1 : 0) : Math.max(0, Math.min(10, cur + d));
  if (nl !== cur) b16PainSet(id, { l: nl });
  b16PainSync(id);
};
QACT.b16PainClear = el => { const id = el.dataset.id; b16PainSet(id, { l: null, n: '' }); b16PainSync(id); };
document.addEventListener('input', ev => {
  const el = ev.target, id = el.dataset && el.dataset.pn;
  if (!id) return;
  b16PainSet(id, { n: el.value.slice(0, 120) });
  const w = el.closest('.b16pw'), b = w && w.querySelector('.b16pb'); if (b) b.textContent = b16PainTxt(b16PainGet(id));
});

/* nyeri 28 hari terakhir per gerakan (t = hari ini): hi = jumlah hari dengan nyeri >= 4; berulang bila hi >= 2 */
function b16PainRows(t) {
  t = t || today();
  const from = addDays(t, -(B16_PUL_DAYS - 1)), by = {};
  Object.keys(tdb).filter(d => DATE_RE.test(d) && d >= from && d <= t && tdb[d] && tdb[d].kal && tdb[d].kal.pain && typeof tdb[d].kal.pain === 'object').sort().forEach(d => {
    const P = tdb[d].kal.pain;
    Object.keys(P).forEach(id => {
      const p = P[id]; if (!p || typeof p !== 'object') return;
      const l = Number.isInteger(p.l) && p.l >= 0 && p.l <= 10 ? p.l : null, n = typeof p.n === 'string' ? p.n : '';
      if (l == null && !n) return;
      const r = by[id] || (by[id] = { id, days: 0, hi: 0, max: null, lastD: '', lastL: null, lastLD: '', lastN: '' });
      r.days++;
      if (l != null) { if (l >= B16_PAIN_MIN) r.hi++; if (r.max == null || l > r.max) r.max = l; r.lastL = l; r.lastLD = d; }
      if (n) r.lastN = n;
      r.lastD = d;
    });
  });
  return Object.keys(by).map(k => Object.assign(by[k], { rep: by[k].hi >= 2 }))
    .sort((a, b) => b.lastD.localeCompare(a.lastD) || (b.lastL == null ? -1 : b.lastL) - (a.lastL == null ? -1 : a.lastL) || a.id.localeCompare(b.id));
}
/* alternatif LOKAL: hanya membaca tangga (LADDER) dan level sekarang; tidak mengubah apa pun */
function b16Alt(rows) {
  const pats = {}, none = [];
  rows.filter(r => r.hi >= 1).forEach(r => { const p = B16_PAT[r.id]; if (!p) none.push(r.id); else (pats[p] = pats[p] || []).push(r.id); });
  return {
    pats: LK.filter(p => pats[p]).map(p => {
      const L = pdb.ladder[p] || 1;
      return { pat: p, nama: LADDER[p].nama, lv: L, cur: LADDER[p].lv[L - 1], ids: pats[p], lighter: LADDER[p].lv.slice(0, L - 1).map((n, i) => ({ lv: i + 1, n })).reverse() };
    }), none
  };
}

/* saran deload (aturan tertulis; t = hari ini). Sesi berisi = hari dengan >= 1 set selesai. */
function b16Deload(t) {
  t = t || today();
  const f28 = addDays(t, -(B16_DL_DAYS - 1)), r14 = addDays(t, -13), p14 = addDays(t, -14);
  const full = d => { const ex = tdb[d].kal.ex || {}; return Object.keys(ex).some(id => (ex[id] && Array.isArray(ex[id].s) ? ex[id].s : []).some(x => x && x.d)); };
  const sess = Object.keys(tdb).filter(d => DATE_RE.test(d) && d <= t && tdb[d] && tdb[d].kal && full(d)).sort();
  const dls = sess.filter(d => tdb[d].kal.dl === true), ref = dls.length ? dls[dls.length - 1] : (sess[0] || ''), refKind = dls.length ? 'deload' : (sess.length ? 'first' : '');
  const n28 = sess.filter(d => d >= f28).length, since = ref ? diffDays(ref, t) : 0;
  // stagnan: gerakan (id + level) dengan >= 2 sesi di tiap paruh 14 hari; terbaik 14 hari terakhir <= 14 hari sebelumnya; sesi deload tidak dihitung
  const el = [], stag = [];
  Object.values(b16Compute()).forEach(g => {
    const rc = g.pts.filter(p => !p.dl && p.d >= r14 && p.d <= t), pr = g.pts.filter(p => !p.dl && p.d >= f28 && p.d <= p14);
    if (rc.length < 2 || pr.length < 2) return;
    el.push(g.id);
    if (Math.max.apply(null, rc.map(p => p.best)) <= Math.max.apply(null, pr.map(p => p.best))) stag.push(g.id);
  });
  const stagIds = stag.filter((id, i) => stag.indexOf(id) === i);
  const stagnant = stag.length >= 2 && stag.length * 2 >= el.length;
  const rp = sess.filter(d => d >= r14 && !tdb[d].kal.dl && tdb[d].kal.rpe != null).map(d => tdb[d].kal.rpe), avg = rp.length ? rp.reduce((a, b) => a + b, 0) / rp.length : null;
  const high = rp.length >= 3 && avg >= 8;
  let state;
  if (n28 < B16_DL_MIN) state = 'few';
  else if (since >= B16_DL_DAYS && (stagnant || high)) state = 'advice';
  else if (since >= B16_DL_LONG) state = 'info';
  else state = 'ok';
  return { state, t, ref, refKind, since, n28, elig: el.length, stag: stag.length, stagIds, stagnant, rpe: { n: rp.length, avg, high } };
}
function b16DeloadHTML(r) {
  const refTxt = r.ref ? (r.refKind === 'deload' ? 'sesi deload terakhir (' : 'sesi pertama yang tercatat (') + dayShort(r.ref) + ')' : '';
  const how = 'Deload = kurangi jumlah set menjadi separuh dan sisakan 3–4 reps selama sekitar 1 pekan. Nyalakan Mode deload di tab Sesi saat menjalankannya.';
  if (r.state === 'few') return '<div class="plan"><div><b>Data belum cukup</b><small>Baru ' + r.n28 + ' sesi dalam 28 hari terakhir. Saran deload butuh minimal ' + B16_DL_MIN + ' sesi, jadi belum dihitung.</small></div></div>';
  const chk = (r.elig ? 'Stagnan: ' + r.stag + ' dari ' + r.elig + ' gerakan yang bisa dinilai. ' : 'Belum ada gerakan dengan cukup sesi untuk dinilai stagnan. ') +
    (r.rpe.n >= 3 ? 'RPE rata-rata ' + fmt(r.rpe.avg, 1) + ' dari ' + r.rpe.n + ' sesi (14 hari terakhir).' : 'RPE: data kurang dari 3 sesi dalam 14 hari terakhir.');
  const base = r.since + ' hari sejak ' + refTxt + '. ' + r.n28 + ' sesi dalam 28 hari terakhir. ';
  if (r.state === 'ok') return '<div class="plan"><div><b>Belum perlu deload</b><small>' + esc(base + chk) + '</small></div></div>';
  if (r.state === 'info') return '<div class="plan alert"><div><b>Sudah lama tanpa deload</b><small>' + esc(base + 'Tidak ada tanda stagnan atau RPE tinggi, jadi ini hanya pengingat. ' + how) + '</small></div></div>';
  const why = [];
  if (r.stagnant) why.push('stagnan pada ' + r.stagIds.map(b16Name).join(', '));
  if (r.rpe.high) why.push('RPE rata-rata ' + fmt(r.rpe.avg, 1) + ' dari ' + r.rpe.n + ' sesi');
  return '<div class="plan alert"><div><b>Pertimbangkan pekan deload</b><small>' + esc(base + 'Alasan: ' + why.join(' dan ') + '. ' + how + ' Ini aturan sederhana, bukan diagnosis.') + '</small></div></div>';
}
function b16PainListHTML(rows) {
  if (!rows.length) return '<p class="empty">Belum ada catatan nyeri dalam 28 hari terakhir. Catat lewat tombol “Catat nyeri” di bawah tiap gerakan pada tab Sesi.</p>';
  return rows.map(r => {
    const bits = [r.lastL == null ? 'Hanya catatan teks' : 'Terakhir ' + r.lastL + '/10 (' + dayShort(r.lastLD) + ')', r.hi + ' sesi dengan nyeri ≥ ' + B16_PAIN_MIN];
    if (r.lastN) bits.push('“' + r.lastN + '”');
    return '<div class="b16pl"><div class="r1"><b>' + esc(b16Name(r.id)) + '</b>' + (r.rep ? '<span class="b16tag">berulang</span>' : '') + '</div><small>' + esc(bits.join(' · ')) + '</small></div>';
  }).join('') + '<p class="note">“Berulang” = nyeri ' + B16_PAIN_MIN + ' atau lebih pada minimal 2 sesi. Nyeri tajam, bengkak, mati rasa, atau tidak membaik: temui tenaga kesehatan. Bukan diagnosis.</p>';
}
function b16AltHTML(alt, rows) {
  if (!rows.some(r => r.hi >= 1)) return '<p class="empty">Tidak ada gerakan dengan nyeri ' + B16_PAIN_MIN + ' atau lebih dalam 28 hari terakhir, jadi belum ada alternatif yang perlu ditampilkan.</p>';
  const items = alt.pats.map(a => {
    const lines = ['Gerakan bernyeri: ' + a.ids.map(b16Name).join(', ') + '. Level sekarang: ' + a.cur + ' (level ' + a.lv + ').'];
    lines.push(a.lighter.length ? 'Lebih ringan: ' + a.lighter.map(x => x.n + ' (level ' + x.lv + ')').join(', ') + '.' : 'Sudah di level terendah. Kurangi jumlah set atau rentang gerak, atau lewati gerakan ini sampai nyeri reda.');
    return '<div class="b16pl"><div class="r1"><b>' + esc(a.nama) + '</b></div>' + lines.map(s => '<small>' + esc(s) + '</small>').join('') + '</div>';
  });
  if (alt.none.length) items.push('<div class="b16pl"><div class="r1"><b>Tanpa tangga progresi</b></div><small>' + esc(alt.none.map(b16Name).join(', ')) + ': kurangi beban atau rentang gerak, atau lewati dulu sampai nyeri reda.</small></div>');
  return items.join('') + '<p class="note">Level tidak diubah otomatis. Mau turun level? Ubah sendiri di Tangga progresi pada tab Sesi.</p>';
}
function b16PulHTML() {
  const t = today(), rows = b16PainRows(t);
  return '<p class="note b16lead">Bagian ini hanya membaca catatanmu di perangkat ini. Tidak ada yang diubah otomatis: tangga progresi dan jumlah set tetap sampai kamu sendiri mengubahnya.</p>' +
    '<section class="sec"><h2>Saran deload</h2>' + b16DeloadHTML(b16Deload(t)) + '</section>' +
    '<section class="sec"><h2>Nyeri 28 hari terakhir</h2>' + b16PainListHTML(rows) + '</section>' +
    '<section class="sec"><h2>Alternatif dari tangga progresi</h2>' + b16AltHTML(b16Alt(rows), rows) + '</section>';
}
/* Mode deload: hanya penanda kal.dl + petunjuk; tidak mengubah jumlah set, tabel EX, atau tangga */
function b16DlLink() { const k = kalGet(false), on = !!(k && k.dl); return '<button class="link b16dlb" data-q="b16Dl" aria-pressed="' + on + '">Mode deload: ' + (on ? 'nyala' : 'mati') + '</button>'; }
function b16DlNote() {
  const k = kalGet(false);
  return k && k.dl ? '<div class="plan alert b16dlh"><div><b>Mode deload hari ini</b><small>Kerjakan sekitar separuh set dan sisakan 3–4 reps. Jumlah set di bawah, program, dan tangga progresi tidak berubah.</small></div></div>' : '';
}
QACT.b16Dl = () => { const k = kalGet(true); if (k.dl) delete k.dl; else k.dl = true; kalTouch(); renderTrain(); };

/* ===== MODUL: KALISTENIK PEMANASAN & PENDINGINAN (batch 16, langkah 16a-3) ===== */
// Pemandu pemanasan dan pendinginan statis (tanpa AI, tanpa jaringan). Hitung mundur sendiri (Date.now), BUKAN TM:
// tidak ada bar melayang, tidak ada toast "Istirahat selesai", timer istirahat/set berdetik/sepeda tidak terganggu.
// Data: kal.wu / kal.cd = {n: langkah yang DISELESAIKAN, done}. Tidak menyentuh ex, lv, pain, dl, tabel EX, atau pdb.ladder.
// Membuka pemandu tidak menulis apa pun; hanya menyelesaikan langkah (dan menutup daftar) yang menulis.
const B16_GD_KINDS = ['wu', 'cd'], B16_GD_MAXN = 12;
const B16_GD = {
  wu: {
    nama: 'Pemanasan', fin: 'Selesai pemanasan',
    head: [
      { id: 'jog', n: 'Jalan di tempat atau jumping jack ringan', tip: 'Mulai pelan sampai badan terasa hangat. Napas masih bisa untuk bicara.', sec: 60 },
      { id: 'circ', n: 'Putar bahu, pinggul, dan pergelangan tangan', tip: 'Lingkaran besar dan pelan, searah lalu berlawanan arah.', sec: 40 }
    ],
    pat: {
      push: { id: 'w_push', n: 'Arm circle dan scapular push-up', tip: 'Lengan lurus, hanya tulang belikat yang mendekat dan menjauh.', reps: 10 },
      pull: { id: 'w_pull', n: 'Scapular pull', tip: 'Tarik tulang belikat ke belakang dan ke bawah, tahan 1 detik.', reps: 10 },
      legs: { id: 'w_legs', n: 'Bodyweight squat pelan', tip: 'Turun 3 hitungan, lutut searah jari kaki. Tidak perlu dalam.', reps: 10 },
      core: { id: 'w_core', n: 'Cat-cow', tip: 'Lengkungkan dan turunkan punggung pelan mengikuti napas.', reps: 8 }
    },
    tail: [{ id: 'ramp', n: 'Satu set ringan gerakan pertama', tip: 'Sekitar 5 reps dengan tenaga ringan. Tidak perlu dicatat di daftar set.', reps: 5 }]
  },
  cd: {
    nama: 'Pendinginan', fin: 'Selesai pendinginan',
    head: [{ id: 'walk', n: 'Jalan pelan', tip: 'Turunkan napas dan denyut jantung sedikit demi sedikit.', sec: 60 }],
    pat: {
      push: { id: 'c_push', n: 'Peregangan dada', tip: 'Tangan di kusen pintu, majukan dada sampai terasa regang, bukan nyeri.', sec: 30 },
      pull: { id: 'c_pull', n: 'Peregangan punggung atas', tip: 'Posisi child pose, tangan jauh ke depan, napas pelan.', sec: 30 },
      legs: { id: 'c_legs', n: 'Peregangan paha depan dan belakang', tip: 'Sekitar 30 detik tiap kaki. Ganti kaki di tengah waktu.', sec: 60 },
      core: { id: 'c_core', n: 'Peregangan perut', tip: 'Posisi cobra pelan, bahu jauh dari telinga.', sec: 30 }
    },
    tail: [{ id: 'breath', n: 'Napas dalam', tip: 'Tarik napas 4 hitungan, buang 6 hitungan.', sec: 30 }]
  }
};
let b16Gd = null, b16GdTm = null;   // keadaan pemandu hanya di memori: {k, d, i, n, run, t0, acc, fin}
function b16GdPats() { try { const L = exList(); return LK.filter(p => L.some(e => e.pat === p)); } catch (e) { return LK.slice(); } }
function b16GdSteps(kind, pats) {
  const D = B16_GD[kind]; if (!D) return [];
  const ps = Array.isArray(pats) ? pats : b16GdPats();
  return D.head.concat(LK.filter(p => ps.includes(p) && D.pat[p]).map(p => D.pat[p]), D.tail).slice(0, B16_GD_MAXN).map(s => Object.assign({}, s));
}
function b16GdMin(steps) { const s = (steps || []).reduce((a, x) => a + (x.sec || 0) + (x.reps || 0) * 4, 0); return Math.max(1, Math.round(s / 60)); }
function b16GdRec(kind) { const k = kalGet(false), x = k && k[kind]; return x && typeof x === 'object' ? { n: Math.max(0, Math.min(B16_GD_MAXN, x.n | 0)), done: x.done === true } : { n: 0, done: false }; }
function b16GdCommit(kind, n, done) { const k = kalGet(true); k[kind] = { n: Math.max(0, Math.min(B16_GD_MAXN, n)), done: !!done }; kalTouch(); }
function b16GdLeft(g, s) { return Math.max(0, s.sec * 1000 - (g.acc + (g.run ? Date.now() - g.t0 : 0))); }
function b16GdWl(on) { try { if (on) WL.on(); else if (!TM.mode) WL.off(); } catch (e) { /* abaikan */ } }
function b16GdStopTm() { clearInterval(b16GdTm); b16GdTm = null; }
function b16GdReset() { if (b16Gd && b16Gd.run) b16GdWl(false); b16GdStopTm(); b16Gd = null; }
function b16GdCard(kind) { return '<section class="sec"><h2>' + B16_GD[kind].nama + '</h2><div class="b16gd" data-gd="' + kind + '">' + b16GdInner(kind) + '</div></section>'; }
function b16GdInner(kind) {
  if (b16Gd && b16Gd.d !== today()) b16GdReset();
  const steps = b16GdSteps(kind), len = steps.length, D = B16_GD[kind];
  if (b16Gd && b16Gd.k === kind) return b16GdOpenHTML(kind, steps);
  const r = b16GdRec(kind), n = Math.min(r.n, len);
  const st = r.done ? 'Selesai' : n > 0 ? 'Belum selesai' : 'Belum dimulai';
  const sm = r.done ? n + ' dari ' + len + ' langkah dikerjakan' : n > 0 ? n + ' dari ' + len + ' langkah dikerjakan' : len + ' langkah, ±' + b16GdMin(steps) + ' menit';
  const lab = r.done ? 'Ulangi' : n > 0 ? 'Lanjutkan' : 'Mulai';
  return '<div class="plan"><div><b>' + st + '</b><small>' + sm + '</small></div><button class="btn sm b16gb1" data-q="b16GdOpen" data-k="' + kind + '" aria-label="' + lab + ' ' + D.nama.toLowerCase() + '">' + lab + '</button></div>';
}
function b16GdOpenHTML(kind, steps) {
  const g = b16Gd, D = B16_GD[kind], len = steps.length, i = Math.min(g.i, len - 1), s = steps[i], last = i === len - 1, timed = !!s.sec;
  let tm;
  if (timed) tm = '<div class="b16gtime" id="gdTime" aria-label="Sisa waktu">' + mmss(Math.ceil(b16GdLeft(g, s) / 1000)) + '</div>' + (g.fin ? '<div class="b16gfin" role="status">Waktu habis</div>' : '');
  else tm = '<div class="b16gtime">' + s.reps + ' <small>reps</small></div>';
  const go = timed && !g.fin ? '<button class="btn b16gm" data-q="b16GdGo" data-gdmain="1" aria-pressed="' + g.run + '">' + (g.run ? 'Jeda' : g.acc > 0 ? 'Lanjut' : 'Mulai') + '</button>' : '';
  const dn = '<button class="btn' + (!timed || g.fin ? ' primary' : '') + ' b16gm" data-q="b16GdStep" data-v="done"' + (go ? '' : ' data-gdmain="1"') + '>' + (last ? D.fin : 'Selesai langkah') + '</button>';
  return '<div class="b16gh"><b>Langkah ' + (i + 1) + ' dari ' + len + '</b><small>' + g.n + ' dikerjakan</small></div>' +
    '<div class="meter"><i style="width:' + Math.round(i / len * 100) + '%"></i></div>' +
    '<div class="b16gs"><div class="b16gn">' + esc(s.n) + '</div><p class="b16gp">' + esc(s.tip) + '</p>' + tm + '</div>' +
    '<div class="b16gbt">' + go + dn + '</div>' +
    '<div class="b16gl2"><button class="link b16gl" data-q="b16GdStep" data-v="skip">Lewati</button><button class="link b16gl" data-q="b16GdClose">Tutup</button></div>' +
    '<p class="note">Berhenti kalau terasa nyeri tajam.</p>';
}
// perbarui kartu di tempat; fokus hanya dipindah bila fokus sedang di dalam kartu atau tidak ke mana-mana (tidak mencuri fokus dari kolom isian)
function b16GdPaint(sel) {
  const ae = document.activeElement, can = !ae || ae === document.body || !!(ae.closest && ae.closest('[data-gd]'));
  B16_GD_KINDS.forEach(kind => { const w = document.querySelector('[data-gd="' + kind + '"]'); if (w) w.innerHTML = b16GdInner(kind); });
  if (sel && can) { const m = document.querySelector(sel); if (m) m.focus(); }
}
function b16GdTick() {
  const g = b16Gd;
  if (!g || !g.run) { b16GdStopTm(); return; }
  if (g.d !== today()) { b16GdReset(); b16GdPaint(); return; }
  const s = b16GdSteps(g.k)[g.i];
  if (!s || !s.sec) { b16GdStopTm(); return; }
  const left = b16GdLeft(g, s), el = document.getElementById('gdTime');
  if (el) el.textContent = mmss(Math.ceil(left / 1000));
  if (left <= 0) { g.acc = s.sec * 1000; g.run = false; g.fin = true; b16GdStopTm(); b16GdWl(false); buzz(); beep(3); b16GdPaint('[data-gdmain]'); }
}
// pemandu yang terbuka sejak hari lain: dibuang dan TIDAK menulis kemajuan lama ke hari baru (ketukan bisa datang tanpa render ulang)
function b16GdStale() {
  if (b16Gd && b16Gd.d !== today()) { b16GdReset(); b16GdPaint(); toast('Hari sudah berganti. Mulai lagi dari kartu.'); return true; }
  return false;
}
QACT.b16GdOpen = el => {
  const kind = el.dataset.k; if (!B16_GD[kind]) return;
  const steps = b16GdSteps(kind), r = b16GdRec(kind), fresh = r.done || r.n >= steps.length, n = fresh ? 0 : r.n;
  b16GdReset();
  b16Gd = { k: kind, d: today(), i: Math.min(n, steps.length - 1), n, run: false, t0: 0, acc: 0, fin: false };
  b16GdPaint('[data-gdmain]');
};
QACT.b16GdGo = () => {
  const g = b16Gd; if (!g) return;
  if (b16GdStale()) return;
  const s = b16GdSteps(g.k)[g.i]; if (!s || !s.sec || g.fin) return;
  b16GdStopTm();
  if (g.run) { g.acc += Date.now() - g.t0; g.run = false; b16GdWl(false); }
  else { unlockAudio(); g.t0 = Date.now(); g.run = true; b16GdTm = setInterval(b16GdTick, 250); b16GdWl(true); }
  b16GdPaint('[data-gdmain]');
};
QACT.b16GdStep = el => {
  const g = b16Gd; if (!g) return;
  if (b16GdStale()) return;
  const kind = g.k, D = B16_GD[kind], len = b16GdSteps(kind).length, ok = el.dataset.v === 'done', last = g.i + 1 >= len;
  if (g.run) { g.run = false; b16GdWl(false); }
  b16GdStopTm();
  if (ok) { g.n++; b16GdCommit(kind, g.n, last); }
  else if (last && g.n >= 1) b16GdCommit(kind, g.n, true);
  if (last) {
    const n = g.n; b16GdReset();
    toast(n >= 1 ? D.nama + ' selesai' : 'Semua langkah dilewati');
    b16GdPaint('[data-gd="' + kind + '"] [data-q="b16GdOpen"]');
    return;
  }
  g.i++; g.acc = 0; g.t0 = 0; g.fin = false;
  b16GdPaint('[data-gdmain]');
};
QACT.b16GdClose = () => {
  const g = b16Gd; if (!g) return;
  const kind = g.k; b16GdReset();
  b16GdPaint('[data-gd="' + kind + '"] [data-q="b16GdOpen"]');
};

/* ===== MODUL: AI PELATIH (batch 16, langkah 16b) ===== */
// ✦ Pelatih = obrolan bubble jenis 'coach' di panel #fchat (mesin Batch 12-1/14/15b: Ulangi, Salin, Baru, Lihat data, Berhenti, Coba lagi).
// Dua pintu di baris #b16AiRow (di bawah tab Sesi/Rekor/Pulih; tampil hanya bila AI nyala): "✦ Ringkas sesi & saran" (ketukan = izin panggilan,
// langsung menyusun jawaban pertama) dan "✦ Alternatif gerakan" (panel kosong TANPA panggilan; panggilan hanya dari tombol Susun, kirim, atau saran).
// Semua angka dihitung LOKAL (b16Compute/b16Series, b16Deload, b16PainRows, LADDER); AI hanya menjelaskan dan menyarankan, dan TIDAK menulis ke data
// apa pun (modul ini tidak menyentuh tdb/pdb/db/wdb/edb dan tidak pernah mengubah pdb.ladder; level hanya berubah lewat ketukan pengguna).
// Tidak dikirim: profil, BMR/TDEE, skor harian, teks `why`, data sepeda, berat badan. Filter privasi: grup Latihan wajib dicentang; teks catatan
// nyeri hanya ikut bila grup Evaluasi dan catatan bebas (teks) dicentang. Jenis 'coach' TIDAK masuk B14_SYS/ask: catatan plateau berat (b14Post) tidak berlaku.
// Data belum cukup (grup Latihan tertutup, atau tidak ada hari berisi >= 1 set selesai dalam 28 hari terakhir) = tanpa panggilan AI; alasannya tampil di layar kosong panel.
const B16C_SESS = 3, B16C_REC = 8, B16C_PAIN = 8;
const COACH_SYS = 'Kamu pelatih kalistenik singkat di aplikasi catatan kebugaran milik satu orang. Semua angka sudah dihitung aplikasi di DATA; tugasmu hanya menjelaskan dan menyarankan. ' +
  'Format: satu paragraf 2 sampai 3 kalimat (satu hal yang berjalan baik dari SESI TERAKHIR atau REKOR, dan satu hal yang perlu diperhatikan), lalu satu baris "Saran sesi berikutnya:" disusul satu atau dua poin konkret (satu kalimat tiap poin, diawali "- "). ' +
  'Penilaian deload HARUS mengikuti PENILAIAN DELOAD: jangan menyimpulkan sebaliknya dan jangan membuat aturan deload sendiri. ' +
  'Bila ada gerakan bernyeri atau pengguna meminta alternatif, sebut alternatif HANYA persis dari DAFTAR GERAKAN; bila tidak ada yang cocok, katakan tidak ada di daftar. ' +
  'Kamu hanya menyarankan: jangan menyuruh pengguna memakai angka baru, jangan menaikkan atau menurunkan level sendiri (pengguna yang mengubahnya di Tangga progresi), dan jangan menyebut gerakan yang tidak ada di DATA. ' +
  'Pakai hanya fakta dari DATA; jangan menambah angka atau fakta yang tidak ada di DATA. Bahasa Indonesia, teks biasa tanpa judul markdown, tabel, atau tanda tebal. ' +
  'Bukan diagnosis: bila ada nyeri tajam, bengkak, mati rasa, atau nyeri yang tidak membaik, sarankan berhenti dan menemui tenaga kesehatan. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
Object.assign(BR_TITLE, { coach: '✦ Pelatih' });
Object.assign(FC_NOUN, { coach: 'ringkasan' });
Object.assign(FC_AUTO, { coach: 'Susun ringkasan sesi dan saran' });
Object.assign(FC_FOLLOW, {
  coach: 'Ini obrolan Pelatih: pengguna bertanya tentang latihan kalistenik di catatannya sendiri, dan DATA berisi hitungan yang sudah dihitung aplikasi (sesi terakhir, rekor, penilaian deload, nyeri, daftar gerakan). ' +
    'Jawab hanya dari DATA dan obrolan sebelumnya; jangan menghitung ulang atau menambah angka baru. Penilaian deload mengikuti PENILAIAN DELOAD. ' +
    'Alternatif gerakan HANYA dari DAFTAR GERAKAN; bila tidak ada yang cocok, katakan tidak ada di daftar. ' +
    'Kamu hanya menyarankan: jangan menyuruh menaikkan atau menurunkan level sendiri (pengguna yang mengubahnya) dan jangan mengubah catatan apa pun. ' +
    'Bukan diagnosis: nyeri tajam, bengkak, mati rasa, atau nyeri yang tidak membaik = hentikan dan temui tenaga kesehatan.'
});
Object.assign(FC_CHIPS, { coach: ['Apakah sudah waktunya deload?', 'Alternatif untuk gerakan yang nyeri?', 'Apa fokus sesi berikutnya?'] });
Object.assign(FC_CTX, { coach: 'Sesi, rekor, deload, nyeri' });

/* --- konteks (semua dihitung lokal) --- */
const b16Full = k => { const ex = (k && k.ex) || {}; return Object.keys(ex).some(id => (ex[id] && Array.isArray(ex[id].s) ? ex[id].s : []).some(x => x && x.d)); };
function b16SessLine(d, t) {
  const k = tdb[d].kal, ex = k.ex || {}, mv = [];
  Object.keys(ex).forEach(id => {
    const ds = (ex[id] && Array.isArray(ex[id].s) ? ex[id].s : []).filter(x => x && x.d && x.r != null && x.r > 0);
    if (!ds.length) return;
    const pat = B16_PAT[id], lv = pat && k.lv && k.lv[pat] ? k.lv[pat] : 0, ln = b16LvName(id, lv);
    mv.push(b16Name(id) + (ln ? ' (' + ln + ')' : '') + ' ' + ds.map(x => x.r).join(', ') + ' ' + b16Unit(id));
  });
  const df = diffDays(d, t), h = dayLong(d) + (df === 0 ? ' (hari ini)' : ' (' + df + ' hari lalu)');
  const g = [k.done ? 'ditandai selesai' : 'belum ditandai selesai', 'RPE ' + (k.rpe != null ? k.rpe : 'tidak dicatat')];
  if (k.dl) g.push('mode deload nyala');
  g.push(k.wu && k.wu.n ? 'pemanasan ' + k.wu.n + ' langkah' + (k.wu.done ? ' (selesai)' : '') : 'pemanasan tidak tercatat');
  g.push(k.cd && k.cd.n ? 'pendinginan ' + k.cd.n + ' langkah' + (k.cd.done ? ' (selesai)' : '') : 'pendinginan tidak tercatat');
  return h + ': ' + g.join('; ') + '; set selesai per gerakan: ' + (mv.length ? mv.join('; ') : 'ada set selesai tanpa jumlah reps tercatat');
}
function b16RecLines() {
  const S = b16Series(), gs = Object.keys(S).map(k => S[k]).filter(g => g.pts.length);
  gs.sort((a, b) => b.pts[b.pts.length - 1].d.localeCompare(a.pts[a.pts.length - 1].d) || a.key.localeCompare(b.key));
  return gs.slice(0, B16C_REC).map(g => {
    const s = b16Sum(g), u = b16Unit(g.id), pr = b16Prs(g).includes(g.pts.length - 1);
    return b16Label(g) + ': set terbaik ' + s.best + ' ' + u + ' (' + dayShort(s.bestD) + '); total terbaik satu sesi ' + s.tot + ' ' + u + ' (' + dayShort(s.totD) + '); ' + s.n + ' sesi tercatat; sesi terakhir ' + s.last.best + ' ' + u + ' (' + dayShort(s.last.d) + ')' + (pr ? '; REKOR BARU di sesi terakhir' : '') + (s.last.dl ? '; sesi terakhir itu sesi deload' : '');
  });
}
function b16DlLines(t) {
  const r = b16Deload(t), L = [];
  const st = { few: 'data belum cukup untuk dinilai (baru ' + r.n28 + ' sesi dalam 28 hari terakhir; minimal ' + B16_DL_MIN + ')', ok: 'belum perlu deload', info: 'sudah lama tanpa deload, hanya pengingat (tidak ada tanda stagnan atau RPE tinggi)', advice: 'pertimbangkan pekan deload' }[r.state];
  L.push('status: ' + st);
  if (r.state !== 'few') {
    L.push(r.since + ' hari sejak ' + (r.refKind === 'deload' ? 'sesi deload terakhir' : 'sesi pertama yang tercatat') + ' (' + dayShort(r.ref) + '); ' + r.n28 + ' sesi dalam 28 hari terakhir');
    L.push(r.elig ? 'stagnan: ' + r.stag + ' dari ' + r.elig + ' gerakan yang bisa dinilai' + (r.stagIds.length ? ' (' + r.stagIds.map(b16Name).join(', ') + ')' : '') : 'belum ada gerakan dengan cukup sesi untuk dinilai stagnan');
    L.push(r.rpe.n >= 3 ? 'RPE rata-rata 14 hari terakhir: ' + aiN(r.rpe.avg, 1) + ' dari ' + r.rpe.n + ' sesi' : 'RPE: data kurang dari 3 sesi dalam 14 hari terakhir');
  }
  L.push('cara deload (aturan aplikasi): kurangi jumlah set menjadi separuh dan sisakan 3 sampai 4 reps selama sekitar 1 pekan');
  return L;
}
function b16PainLines(t) {
  const rows = b16PainRows(t), tx = aiOn('teks');
  if (!rows.length) return ['tidak ada catatan nyeri dalam ' + B16_PUL_DAYS + ' hari terakhir'];
  const L = rows.slice(0, B16C_PAIN).map(r => b16Name(r.id) + ': ' + (r.lastL == null ? 'hanya catatan teks' : 'terakhir ' + r.lastL + ' dari 10 (' + dayShort(r.lastLD) + ')') +
    (r.max != null ? '; tertinggi ' + r.max + ' dari 10' : '') + '; nyeri ' + B16_PAIN_MIN + ' atau lebih pada ' + r.hi + ' sesi' + (r.rep ? '; BERULANG' : '') + (tx && r.lastN ? '; catatan: "' + aiTxt(r.lastN, 60) + '"' : ''));
  if (rows.length > B16C_PAIN) L.push((rows.length - B16C_PAIN) + ' gerakan lain tidak ditampilkan');
  return L;
}
function b16LadderLines() {
  return LK.map(p => { const L = pdb.ladder[p] || 1; return LADDER[p].nama + ': ' + LADDER[p].lv.map((n, i) => 'level ' + (i + 1) + ' ' + n).join('; ') + '; level sekarang ' + L + ' (' + LADDER[p].lv[L - 1] + ')'; });
}
function b16ProgLines() {
  return exList().map(e => e.n + ': ' + e.sets + ' set' + (e.r ? ', ' + e.r[0] + ' sampai ' + e.r[1] + ' reps' : e.sec ? ', ' + e.sec[0] + ' sampai ' + e.sec[1] + ' detik' : '') + (e.per ? ' per ' + e.per : '') + (e.pat ? ' (pola ' + LADDER[e.pat].nama + ')' : ''));
}
function b16Ctx() {
  const t = today();
  if (!aiOn('latihan')) return b14Fail('Grup data Latihan belum dicentang di Pengaturan AI, jadi pelatih tidak boleh memakai catatan latihanmu. AI tidak dipanggil. Centang grup Latihan dulu.', true);
  const from = addDays(t, -(B16_PUL_DAYS - 1));
  const days = Object.keys(tdb).filter(d => DATE_RE.test(d) && d >= from && d <= t && tdb[d] && tdb[d].kal && b16Full(tdb[d].kal)).sort();
  if (!days.length) return b14Fail('Data belum cukup untuk pelatih: belum ada sesi dengan set selesai dalam ' + B16_PUL_DAYS + ' hari terakhir. AI tidak dipanggil supaya tidak mengarang. Tandai set selesai di tab Sesi dulu.', false);
  const P = [], sec = (h, L) => { if (L && L.length) P.push(h + ':\n' + L.map(x => '- ' + x).join('\n')); };
  P.push('HARI INI: ' + dayLong(t) + '.' + aiHead(t) + ' Tempat latihan: ' + (pdb.opt === 'gym' ? 'gym' : 'rumah') + '. Hari berisi (minimal 1 set selesai) dalam ' + B16_PUL_DAYS + ' hari terakhir: ' + days.length + '.');
  sec('SESI TERAKHIR (maksimal ' + B16C_SESS + ' hari berisi)', days.slice(-B16C_SESS).reverse().map(d => b16SessLine(d, t)));
  sec('REKOR PER GERAKAN (maksimal ' + B16C_REC + ' gerakan terbaru; set terbaik dan total dihitung aplikasi)', b16RecLines());
  sec('PENILAIAN DELOAD (hasil aturan aplikasi; ikuti, jangan menilai sendiri)', b16DlLines(t));
  sec('NYERI ' + B16_PUL_DAYS + ' HARI TERAKHIR', b16PainLines(t));
  sec('DAFTAR GERAKAN (tangga progresi; satu-satunya sumber alternatif)', b16LadderLines());
  sec('PROGRAM HARI INI', b16ProgLines());
  const body = P.join('\n\n'), user = body + '\n\nSusun ringkasan sesi dan saran sesi berikutnya.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: false };
}

/* --- tampilan --- */
const b16Starters = () => b18Starters();
function b16EmptyHTML() {
  const c = b16Ctx();
  let h = '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>Pelatih</h4><p class="note">' +
    esc('Ringkasan sesi kalistenikmu dan saran sesi berikutnya, dari catatan di perangkat ini. Angka dihitung di perangkat ini; AI hanya menjelaskan dan menyarankan, tidak mengubah catatan, level, atau jumlah set. Bukan diagnosis.') + '</p>';
  if (c.empty) {
    h += '<p class="note"><b>' + esc(c.emptyMsg) + '</b></p>' + (c.emptyBtn ? '<div class="quick"><button class="btn primary" data-q="fcSettings">Buka pengaturan AI</button></div>' : '');
  } else {
    h += '<div class="quick"><button class="btn primary" data-q="fcGen">Susun ringkasan sesi</button></div>' +
      '<div class="csug">' + b16Starters().map(x => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
      '<p class="note">Atau tulis pertanyaanmu di bawah.</p>';
  }
  return h + (c.empty ? b18EmptyOpen() : b18EmptyNote()) + '</div>';
}
function b16AiRowHTML() {
  return '<div class="aibtn" id="b16AiRow"' + (adb.on ? '' : ' hidden') + '><button class="btn sm" data-q="coachSum">✦ Ringkas sesi &amp; saran</button><button class="btn sm" data-q="coachAlt">✦ Tanya pelatih</button></div>';
}
function b16Sync() { const r = $('#b16AiRow'); if (r) r.hidden = !adb.on; const q = $('#b18AiRow'); if (q) q.hidden = !b18CanAsk(); }

/* --- aksi --- */
QACT.coachSum = () => { fcOpen('coach'); if (fcKind === 'coach' && !fcHasChat(FC.coach)) fcFirst('coach'); };
QACT.coachAlt = () => fcOpen('coach');
function b16CoachNew() {
  openSheet({ title: 'Mulai obrolan baru?', note: 'Obrolan di layar ini dihapus. Tidak tersimpan di mana pun.',
    actions: [closeBtn, { label: 'Mulai baru', primary: true, fn: () => { closeSheet(); fcTok++; if (fcBusy) AI.cancel(); fcBusy = false; fcWaitStop(); FC.coach = fcBlank(); fcDraft.coach = ''; $('#fcIn').value = ''; fcGrow(); fcPaint('end'); } }] });
}
function b16CoachPeek() {
  const c = b16Ctx();
  openSheet({ title: 'Data yang akan dikirim', note: c.empty ? c.emptyMsg : 'Hanya teks ini, pertanyaanmu, dan obrolan di layar ini yang dikirim. Angka dihitung di perangkat ini; grup data yang tidak dicentang di Pengaturan AI tidak ikut. Profil, skor harian, data sepeda, dan berat badan tidak dikirim.',
    text: c.empty ? '' : c.body, prose: true, actions: [closeBtn] });
}
{
  const _n = QACT.fcNew, _p = QACT.fcPeek;
  QACT.fcNew = () => fcKind === 'coach' ? b16CoachNew() : _n();
  QACT.fcPeek = () => fcKind === 'coach' ? b16CoachPeek() : _p();
}

window.DL = Object.freeze(Object.assign({}, window.DL, { b16: Object.freeze({
  series: b16Compute, prs: b16Prs, sum: b16Sum, note: b16ExNote, label: b16Label, clean: tclean, tab: () => b16Tab, pain: b16PainGet, painRows: b16PainRows, alt: b16Alt, deload: b16Deload,
  guide: Object.freeze({ steps: b16GdSteps, est: b16GdMin, rec: b16GdRec, state: () => b16Gd ? Object.assign({}, b16Gd) : null }),
  coach: Object.freeze({ ctx: b16Ctx, sys: COACH_SYS, fcl: () => FC_FOLLOW.coach, starters: b16Starters, empty: b16EmptyHTML, row: b16AiRowHTML, lim: Object.freeze({ SESS: B16C_SESS, REC: B16C_REC, PAIN: B16C_PAIN }) }),
  lim: Object.freeze({ MAX_PTS: B16_MAX_PTS, MAX_GRP: B16_MAX_GRP })
}) }));

window.DL = Object.freeze(Object.assign({}, window.DL, { b17: Object.freeze({ hr: hrInfo, hrAt, pct: HR_PCT, km: bkKmData, stats: bkKmStats, kmHtml: bkKmHTML, zonesHtml: zonesHTML, note: bkHrNote, weeks: () => bkWeeks }) }));
window.DL = Object.freeze(Object.assign({}, window.DL, { b17s: Object.freeze({ parse: svParse, when: svWhen, dur: svDur, num: svNum, ref: svRef, cols: svCols, extras: svExtras, parts: svParts, state: () => JSON.parse(JSON.stringify(svSt)), reset: svReset, dup: svDup, html: svHTML, clean: tclean, apply: p => { if (p && p.ok) { svApply(p.info); svPaint(); } return p; }, lim: Object.freeze({ imgMax: SV_IMG_MAX, fileMax: SV_FILE_MAX, minKm: SV_MIN_KM, maxKm: SV_MAX_KM, spdWarn: SV_SPD_WARN }) }) }));
window.DL = Object.freeze(Object.assign({}, window.DL, { b17j: Object.freeze({ html: jrHTML, kcal: jrKcalOf, cells: jrCells, bits: jrAiBits, paint: jrPaint, rides: jrRides, text: jrTextLines, week: jrWeekLines, extra: jrExtraBits, part: jrPart }) }));
/* ===== MODUL: PUSTAKA GERAKAN & PELATIH PINTAR (batch 17-P) ===== */
// Permintaan pemilik (14 Okt 2026): AI kalistenik lebih pintar (menjawab pertanyaan umum + memakai internet), menampilkan gambar/video gerakan,
// pilihan jenis latihan (PPL dst.) beserta gerakan per kategori, dan otot yang bekerja/berkembang.
// (1) PUSTAKA = isi STATIS di aplikasi (tanpa AI, tanpa jaringan): tab "Pustaka" di Kalistenik. Gambar dimuat dan video dibuka HANYA saat diketuk.
//     Isi (gerakan, otot, petunjuk) ditulis dari pengetahuan umum kebugaran dan BELUM ditinjau pelatih; otot = perkiraan umum, bukan pengukuran.
// (2) PELATIH PINTAR = tanya lanjutan di obrolan 'coach' memakai model obrolan (Pintar/Pro bawaan) + pencarian Google bila diizinkan,
//     mengikuti Gaya jawaban yang sudah ada: bukan "Hanya data" -> jalur pintar; "Hanya data" -> perilaku 16b persis. Jawaban pertama otomatis tidak berubah.
// Modul ini TIDAK menulis ke tdb/pdb/db/wdb/edb. pdb.ladder hanya DIBACA (penanda "levelmu"); level hanya berubah lewat QACT.lvl / QACT.lvlUp.
// Video = tautan pencarian YouTube yang disusun aplikasi (bukan tautan dari AI). Gambar = free-exercise-db (Unlicense) lewat raw.githubusercontent.com.

const B18_MUS = { dada: 'Dada', bahu: 'Bahu depan', bahub: 'Bahu belakang', trisep: 'Trisep', bisep: 'Bisep', lats: 'Punggung lebar', punggung: 'Punggung atas', perut: 'Perut', oblik: 'Samping perut', pbawah: 'Punggung bawah', glute: 'Bokong', kuad: 'Paha depan', ham: 'Paha belakang', betis: 'Betis', add: 'Paha dalam', hip: 'Pinggul depan', lengan: 'Lengan bawah' };
const B18_POLA = { push: 'Push (dorong)', pull: 'Pull (tarik)', legs: 'Legs (kaki)', core: 'Core (perut dan batang tubuh)' };
const B18_IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const B18_YT = 'https://www.youtube.com/results?search_query=';
// id, n = nama, p = pola, L = [pola tangga, level] (null = di luar tangga), a = otot utama, b = otot pendukung, t = petunjuk bentuk,
// al = nama lain untuk pencocokan di jawaban AI, im = id kandidat free-exercise-db (BELUM diverifikasi satu per satu; dicoba berurutan)
const B18_MV = [
  { id: 'knee_pushup', n: 'Knee push-up', p: 'push', L: ['push', 1], a: ['dada', 'trisep'], b: ['bahu', 'perut'], t: 'Badan lurus dari lutut sampai kepala, siku tidak terlalu melebar. Turun sampai dada hampir menyentuh lantai.', al: ['knee push up', 'knee pushup', 'kneeling push up', 'push up lutut'], im: [] },
  { id: 'pushup', n: 'Push-up', p: 'push', L: ['push', 2], a: ['dada', 'trisep'], b: ['bahu', 'perut'], t: 'Badan lurus seperti papan, perut dan bokong kencang. Turun terkendali, lalu dorong lantai menjauh.', al: ['push up', 'push ups', 'pushup', 'pushups', 'standard push up', 'standar push up'], im: ['Pushups'] },
  { id: 'decline_pushup', n: 'Decline push-up', p: 'push', L: ['push', 3], a: ['dada', 'bahu'], b: ['trisep', 'perut'], t: 'Kaki di tempat yang lebih tinggi: makin tinggi, makin berat bagi dada atas dan bahu. Jaga pinggang tidak turun.', al: ['decline push up', 'decline pushup', 'feet elevated push up'], im: ['Decline_Push-Up'] },
  { id: 'dips', n: 'Dips (bar paralel)', p: 'push', L: ['push', 3], a: ['dada', 'trisep'], b: ['bahu'], t: 'Bahu jauh dari telinga. Badan sedikit condong ke depan untuk dada, lebih tegak untuk trisep. Turun hanya sejauh bahu nyaman.', al: ['parallel bar dips', 'parallel bar dip', 'ring dips', 'ring dip', 'dips'], im: ['Dips_-_Triceps_Version'] },
  { id: 'diamond_pushup', n: 'Diamond push-up', p: 'push', L: null, a: ['trisep', 'dada'], b: ['bahu'], t: 'Kedua tangan membentuk berlian di bawah dada, siku dekat badan. Lebih berat bagi trisep daripada push-up biasa.', al: ['diamond push up', 'diamond pushup', 'close grip push up'], im: ['Push-Ups_-_Close_Triceps_Position'] },
  { id: 'pike_pushup', n: 'Pike push-up', p: 'push', L: ['push', 4], a: ['bahu', 'trisep'], b: ['dada', 'perut'], t: 'Pinggul tinggi membentuk huruf V, kepala turun ke depan tangan, lalu dorong ke atas lewat bahu.', al: ['pike push up', 'pike pushup'], im: ['Pike_Push-Up'] },
  { id: 'archer_pushup', n: 'Archer push-up', p: 'push', L: ['push', 4], a: ['dada', 'trisep'], b: ['bahu', 'perut', 'oblik'], t: 'Tangan lebar. Turun ke satu sisi dengan lengan sisi lain tetap lurus, lalu bergantian.', al: ['archer push up', 'archer pushup'], im: [] },

  { id: 'doorway_pull', n: 'Doorway pull', p: 'pull', L: ['pull', 1], a: ['lats', 'punggung'], b: ['bisep', 'bahub', 'lengan'], t: 'Pegang kusen pintu yang kokoh, condongkan badan ke belakang, lalu tarik dada ke kusen. Pastikan kusen kuat menahan berat badanmu.', al: ['doorway pull', 'doorway row', 'door frame row'], im: [] },
  { id: 'scapular_pull', n: 'Scapular pull-up', p: 'pull', L: null, a: ['punggung', 'lats'], b: ['lengan'], t: 'Tergantung di bar dengan lengan lurus, tarik bahu turun menjauh dari telinga tanpa menekuk siku.', al: ['scapular pull up', 'scapular pullup', 'scap pull up'], im: [] },
  { id: 'inverted_row', n: 'Inverted row', p: 'pull', L: ['pull', 2], a: ['lats', 'punggung'], b: ['bisep', 'bahub', 'lengan'], t: 'Badan lurus di bawah meja atau bar yang kokoh, tarik dada ke bar, jepit tulang belikat di atas, turun pelan.', al: ['inverted row', 'inverted rows', 'australian pull up', 'bodyweight row'], im: ['Inverted_Row'] },
  { id: 'assisted_pullup', n: 'Assisted pull-up', p: 'pull', L: ['pull', 3], a: ['lats', 'bisep'], b: ['punggung', 'bahub', 'lengan'], t: 'Kurangi beban dengan karet atau kaki di kursi. Fokus pada fase turun yang pelan dan terkendali.', al: ['assisted pull up', 'assisted pullup', 'band assisted pull up'], im: [] },
  { id: 'pullup', n: 'Pull-up', p: 'pull', L: ['pull', 4], a: ['lats', 'bisep'], b: ['punggung', 'bahub', 'lengan', 'perut'], t: 'Mulai dari gantung penuh, tarik siku ke bawah dan belakang sampai dagu melewati bar, lalu turun terkendali.', al: ['pull up', 'pull ups', 'pullup', 'pullups', 'strict pull up'], im: ['Pullups'] },
  { id: 'chinup', n: 'Chin-up', p: 'pull', L: null, a: ['bisep', 'lats'], b: ['punggung', 'lengan'], t: 'Telapak menghadap kamu. Bisep bekerja lebih besar dibanding pull-up biasa.', al: ['chin up', 'chin ups', 'chinup'], im: ['Chin-Up'] },
  { id: 'lsit_pullup', n: 'L-sit pull-up', p: 'pull', L: ['pull', 4], a: ['lats', 'bisep'], b: ['perut', 'hip', 'lengan'], t: 'Kaki tetap lurus ke depan sepanjang gerakan, perut kencang.', al: ['l sit pull up', 'lsit pull up', 'l sit pullup'], im: [] },

  { id: 'bw_squat', n: 'Bodyweight squat', p: 'legs', L: ['legs', 1], a: ['kuad', 'glute'], b: ['ham', 'betis', 'perut'], t: 'Kaki selebar bahu, lutut searah ujung kaki, turun sampai paha sejajar lantai atau sejauh nyaman, tumit tetap menempel.', al: ['bodyweight squat', 'bodyweight squats', 'air squat', 'air squats'], im: ['Bodyweight_Squat'] },
  { id: 'glute_bridge', n: 'Glute bridge', p: 'legs', L: null, a: ['glute', 'ham'], b: ['pbawah', 'perut'], t: 'Tumit dekat bokong, dorong pinggul ke atas sampai badan lurus dari bahu ke lutut, jepit bokong di atas.', al: ['glute bridge', 'hip bridge'], im: [] },
  { id: 'reverse_lunge', n: 'Reverse lunge', p: 'legs', L: null, a: ['kuad', 'glute'], b: ['ham', 'add'], t: 'Melangkah ke belakang, lutut belakang turun mendekati lantai, lalu dorong lewat tumit kaki depan.', al: ['reverse lunge', 'reverse lunges', 'lunge', 'lunges'], im: [] },
  { id: 'bulgarian', n: 'Bulgarian split squat', p: 'legs', L: ['legs', 2], a: ['kuad', 'glute'], b: ['ham', 'add', 'betis'], t: 'Kaki belakang di bangku, badan sedikit condong ke depan, lutut depan searah kaki. Turun terkendali.', al: ['bulgarian split squat', 'bulgarian split squats', 'split squat bulgaria'], im: [] },
  { id: 'calf_raise', n: 'Calf raise', p: 'legs', L: null, a: ['betis'], b: [], t: 'Naik ke ujung jari kaki, tahan sebentar, turun pelan. Boleh satu kaki bila sudah mudah.', al: ['calf raise', 'calf raises', 'heel raise'], im: [] },
  { id: 'sl_rdl', n: 'Single-leg RDL', p: 'legs', L: ['legs', 3], a: ['ham', 'glute'], b: ['pbawah', 'perut'], t: 'Berdiri satu kaki, punggung lurus, pinggul mundur seperti membungkuk. Rasakan tarikan di paha belakang.', al: ['single leg rdl', 'single leg romanian deadlift', 'one leg rdl'], im: [] },
  { id: 'sl_hipthrust', n: 'Single-leg hip thrust', p: 'legs', L: null, a: ['glute', 'ham'], b: ['pbawah', 'perut'], t: 'Punggung atas di bangku, satu kaki, dorong pinggul sampai badan lurus, jepit bokong di atas.', al: ['single leg hip thrust', 'one leg hip thrust'], im: [] },
  { id: 'pistol', n: 'Pistol squat', p: 'legs', L: ['legs', 4], a: ['kuad', 'glute'], b: ['add', 'ham', 'betis', 'perut'], t: 'Squat satu kaki dengan kaki lain lurus ke depan. Boleh dibantu pegangan, atau mulai dengan duduk di bangku.', al: ['pistol squat', 'pistol squats'], im: ['Pistol_Squat'] },
  { id: 'shrimp', n: 'Shrimp squat', p: 'legs', L: ['legs', 4], a: ['kuad', 'glute'], b: ['ham', 'add', 'betis'], t: 'Squat satu kaki dengan kaki belakang ditekuk dan dipegang; lutut belakang menyentuh lantai dengan lembut.', al: ['shrimp squat', 'shrimp squats'], im: [] },

  { id: 'plank', n: 'Plank', p: 'core', L: ['core', 1], a: ['perut'], b: ['oblik', 'pbawah', 'bahu', 'glute'], t: 'Siku di bawah bahu, badan lurus, perut dan bokong kencang, napas teratur. Jangan biarkan pinggang turun.', al: ['plank', 'forearm plank'], im: ['Plank'] },
  { id: 'dead_bug', n: 'Dead bug', p: 'core', L: ['core', 2], a: ['perut'], b: ['oblik', 'hip'], t: 'Telentang, punggung bawah menempel lantai. Turunkan lengan dan kaki yang berlawanan secara pelan.', al: ['dead bug', 'dead bugs'], im: [] },
  { id: 'leg_raise', n: 'Leg raise', p: 'core', L: ['core', 2], a: ['perut', 'hip'], b: ['oblik'], t: 'Telentang atau tergantung; angkat kaki lurus tanpa melengkungkan punggung bawah.', al: ['leg raise', 'leg raises', 'hanging leg raise', 'lying leg raise'], im: ['Hanging_Leg_Raise'] },
  { id: 'side_plank', n: 'Side plank', p: 'core', L: null, a: ['oblik'], b: ['perut', 'bahu', 'glute'], t: 'Satu siku di bawah bahu, angkat pinggul sampai badan lurus; ganti sisi.', al: ['side plank', 'side plank hold'], im: ['Side_Bridge'] },
  { id: 'bird_dog', n: 'Bird dog', p: 'core', L: null, a: ['pbawah', 'glute'], b: ['perut', 'bahub'], t: 'Merangkak, luruskan lengan dan kaki yang berlawanan tanpa memutar pinggul.', al: ['bird dog', 'bird dogs'], im: [] },
  { id: 'copenhagen', n: 'Copenhagen plank', p: 'core', L: ['core', 3], a: ['add', 'oblik'], b: ['perut'], t: 'Plank samping dengan kaki atas di bangku, angkat pinggul. Menguatkan paha dalam dan samping perut.', al: ['copenhagen plank', 'copenhagen side plank'], im: [] },
  { id: 'hollow', n: 'Hollow body hold', p: 'core', L: ['core', 4], a: ['perut'], b: ['hip', 'oblik'], t: 'Telentang, punggung bawah menempel lantai, angkat bahu dan kaki sedikit dari lantai, lalu tahan.', al: ['hollow body hold', 'hollow body', 'hollow hold'], im: [] },
  { id: 'dragon_flag', n: 'Dragon flag', p: 'core', L: ['core', 4], a: ['perut', 'hip'], b: ['lats', 'oblik'], t: 'Gerakan lanjut: badan lurus kaku dari bahu, turun pelan. Kuasai hollow body hold dulu.', al: ['dragon flag', 'dragon flags'], im: [] }
];
const B18_SPLITS = [
  { id: 'ppl', n: 'PPL', ket: 'Push / Pull / Legs: hari dorong, hari tarik, hari kaki. Umumnya dipakai 3 sampai 6 hari per pekan (diulang bila 6 hari). Core boleh ditaruh di akhir hari mana saja.',
    days: [{ t: 'Hari Push', s: 'Dada, bahu, trisep.', pats: ['push'] }, { t: 'Hari Pull', s: 'Punggung dan bisep.', pats: ['pull'] }, { t: 'Hari Legs + Core', s: 'Kaki, bokong, perut.', pats: ['legs', 'core'] }] },
  { id: 'ul', n: 'Atas/Bawah', ket: 'Upper / Lower: satu hari tubuh atas (dorong dan tarik), satu hari tubuh bawah (kaki dan core). Umumnya 4 hari per pekan.',
    days: [{ t: 'Hari Atas', s: 'Dada, bahu, trisep, punggung, bisep.', pats: ['push', 'pull'] }, { t: 'Hari Bawah', s: 'Kaki, bokong, perut.', pats: ['legs', 'core'] }] },
  { id: 'fb', n: 'Full body', ket: 'Seluruh tubuh di tiap sesi: pilih satu atau dua gerakan dari tiap kategori sesuai levelmu. Umumnya 2 sampai 3 hari per pekan; cocok untuk pemula atau jadwal padat.',
    days: [{ t: 'Sesi Full body', s: 'Satu atau dua gerakan per kategori.', pats: ['push', 'pull', 'legs', 'core'] }] }
];
let b18Split = 'ppl';   // jenis latihan terpilih (hanya memori)
const b18Mv = id => B18_MV.find(m => m.id === id) || null;

/* --- pencocokan nama gerakan di teks (lokal, tanpa AI): alias terpanjang dulu; bagian yang sudah cocok ditutup supaya alias lebih pendek tidak ikut cocok --- */
const b18Norm = s => ' ' + String(s).toLowerCase().replace(/[\u2010-\u2015\-_\/]+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
const B18_AL = [];
B18_MV.forEach(m => m.al.forEach(a => { const n = b18Norm(a); B18_AL.push({ a: n, id: m.id });
  if (!/s $/.test(n)) B18_AL.push({ a: n.slice(0, -1) + 's ', id: m.id });   // bentuk jamak ("archer push-ups", "side planks")
}));
['bench dips', 'bench dip', 'bench press'].forEach(a => B18_AL.push({ a: b18Norm(a), id: null }));   // hanya menutup teks, bukan gerakan pustaka
B18_AL.sort((x, y) => y.a.length - x.a.length);
function b18Find(text, max) {
  let t = b18Norm(text); const hit = {};
  B18_AL.forEach(x => {
    let i;
    while ((i = t.indexOf(x.a)) >= 0) {
      if (x.id && (!(x.id in hit) || i < hit[x.id])) hit[x.id] = i;
      t = t.slice(0, i + 1) + '|'.repeat(x.a.length - 2) + t.slice(i + x.a.length - 1);
    }
  });
  return Object.keys(hit).sort((p, q) => hit[p] - hit[q]).slice(0, max || 5);
}
/* --- otot: skor utama 2, pendukung 1; "main" = utama di sedikitnya satu gerakan --- */
function b18Agg(ids) {
  const sc = {}, mn = {};
  ids.forEach(id => { const m = b18Mv(id); if (!m) return; m.a.forEach(k => { sc[k] = (sc[k] || 0) + 2; mn[k] = 1; }); m.b.forEach(k => { sc[k] = (sc[k] || 0) + 1; }); });
  return Object.keys(sc).map(k => ({ k, s: sc[k], main: !!mn[k] })).sort((x, y) => y.s - x.s || (B18_MUS[x.k] < B18_MUS[y.k] ? -1 : 1));
}
const b18Ytq = m => B18_YT + encodeURIComponent(m.n.replace(/\s*\(.*\)\s*/, ' ').trim() + ' tutorial');

/* --- tab Pustaka --- */
function b18MvBtn(m) {
  const cur = m.L && pdb.ladder[m.L[0]] === m.L[1];
  return '<button class="btn sm ghost b18mvb' + (cur ? ' cur' : '') + '" data-q="b18Mv" data-id="' + m.id + '"' + (cur ? ' aria-label="' + esc(m.n) + ', levelmu sekarang"' : '') + '>' + (cur ? '<i class="b18dot" aria-hidden="true"></i>' : '') + esc(m.n) + '</button>';
}
function b18DayHTML(d) {
  const mv = B18_MV.filter(m => d.pats.indexOf(m.p) >= 0), agg = b18Agg(mv.map(m => m.id)).slice(0, 8), mx = agg.length ? agg[0].s : 1;
  const lvOf = m => (m.L ? m.L[1] : 9);
  const groups = d.pats.map(p => '<div class="b18grp"><div class="b18cap">' + esc(B18_POLA[p]) + '</div><div class="b18chips">' + mv.filter(m => m.p === p).sort((x, y) => lvOf(x) - lvOf(y)).map(b18MvBtn).join('') + '</div></div>').join('');
  return '<section class="sec b18day"><h2>' + esc(d.t) + '</h2><p class="note">' + esc(d.s) + '</p>' +
    '<div class="b18cap">Otot yang dilatih</div><div class="b18mus">' + agg.map(a => '<div class="b18mr"><span>' + esc(B18_MUS[a.k]) + '</span><div class="b18bar" aria-hidden="true"><i style="width:' + Math.round(a.s / mx * 100) + '%"></i></div><small>' + (a.main ? 'utama' : 'pendukung') + '</small></div>').join('') + '</div>' + groups + '</section>';
}
const b18CanAsk = () => adb.on && adb.scope !== 'data';
function b18PusHTML() {
  const sp = B18_SPLITS.find(x => x.id === b18Split) || B18_SPLITS[0];
  let h = '<section class="sec"><h2>Jenis latihan</h2><div class="seg tri b18seg" role="group" aria-label="Jenis latihan">' +
    B18_SPLITS.map(s => '<button class="pill" data-q="b18Split" data-v="' + s.id + '" aria-pressed="' + (s.id === sp.id) + '">' + esc(s.n) + '</button>').join('') + '</div>' +
    '<p class="note">' + esc(sp.ket) + '</p><p class="note"><i class="b18dot" aria-hidden="true"></i> Titik = gerakan di levelmu sekarang pada Tangga progresi. Ketuk gerakan untuk melihat otot, petunjuk, gambar, dan video.</p></section>';
  h += sp.days.map(b18DayHTML).join('');
  h += '<div id="b18AiRow" class="aibtn"' + (b18CanAsk() ? '' : ' hidden') + '><button class="btn sm b18go" data-q="b18AskSplit">✦ Tanya pelatih tentang ' + esc(sp.n) + '</button></div>' +
    '<p class="note">Isi pustaka ditulis dari pengetahuan umum kebugaran dan belum ditinjau pelatih; otot yang ditampilkan adalah perkiraan umum, bukan pengukuran. Gambar dan video hanya dibuka bila kamu mengetuknya. Bukan diagnosis.</p>';
  return h;
}
QACT.b18Split = el => { const v = el.dataset.v; if (B18_SPLITS.some(s => s.id === v)) { b18Split = v; renderTrain(); } };

/* --- sheet gerakan --- */
function b18MvSheet(id) {
  const m = b18Mv(id); if (!m) return;
  const lv = m.L ? (pdb.ladder[m.L[0]] || 0) : 0;
  const note = m.L ? LADDER[m.L[0]].nama + ' level ' + m.L[1] + (lv === m.L[1] ? ' (levelmu sekarang)' : lv ? ' (kamu di level ' + lv + ')' : '') : B18_POLA[m.p] + ', di luar tangga progresi';
  const tags = (arr, on) => arr.length ? arr.map(k => '<span class="tag' + (on ? ' on' : '') + '">' + esc(B18_MUS[k]) + '</span>').join(' ') : '<small>–</small>';
  const extra = '<div class="b18sh"><div class="b18cap">Otot utama</div><div class="b18tags">' + tags(m.a, true) + '</div>' +
    '<div class="b18cap">Otot pendukung</div><div class="b18tags">' + tags(m.b, false) + '</div>' +
    '<div class="b18cap">Petunjuk bentuk</div><p class="note" style="margin-top:0">' + esc(m.t) + '</p>' +
    '<div class="b18act"><button class="btn sm b18go" data-q="b18Img" data-id="' + m.id + '">Tampilkan gambar</button>' +
    ytAtBtn('p:' + m.id, b18Base(m), 's|p:' + m.id, 'btn sm b18go') + '<a class="btn sm b18go" href="' + esc(b18Ytq(m)) + '" target="_blank" rel="noopener noreferrer">Buka di YouTube</a></div>' + ytMountBlock('p:' + m.id, b18Base(m), 's|p:' + m.id) +
    '<div class="b18imgs" id="b18Imgs" aria-live="polite"></div>' +
    '<p class="note">Perkiraan umum, bukan diagnosis. Nyeri tajam, bengkak, atau mati rasa: hentikan dan temui tenaga kesehatan. Video dibuka di YouTube (situs lain) hanya bila kamu mengetuk.</p></div>';
  const acts = [];
  if (b18CanAsk()) acts.push({ label: '✦ Tanya pelatih', primary: true, fn: () => { closeSheet(); b18Ask('Jelaskan teknik ' + m.n + ' yang benar, kesalahan umum, dan cara membuatnya lebih mudah atau lebih sulit.'); } });
  acts.push(closeBtn);
  openSheet({ title: m.n, note, extra, actions: acts, onClose: ytEndHk('s|p:' + m.id) });
}
function b18LoadImg(id) {
  const m = b18Mv(id), box = document.getElementById('b18Imgs'); if (!m || !box) return;
  const say = t => { if (document.getElementById('b18Imgs') === box) { box.textContent = ''; const p = document.createElement('p'); p.className = 'note'; p.textContent = t; box.appendChild(p); } };
  if (!m.im.length) { say('Gambar belum tersedia untuk gerakan ini. Coba tombol Cari video.'); return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { say('Sedang offline, gambar tidak bisa dimuat.'); return; }
  say('Memuat gambar…');
  let i = 0;
  const next = () => {
    if (document.getElementById('b18Imgs') !== box) return;   // sheet sudah ditutup atau diganti
    if (i >= m.im.length) { say('Gambar tidak bisa dimuat (tidak tersedia untuk gerakan ini, atau koneksi bermasalah). Coba tombol Cari video.'); return; }
    const gid = m.im[i++], a = new Image();
    a.referrerPolicy = 'no-referrer'; a.className = 'b18img'; a.alt = 'Peragaan ' + m.n + ' (gambar 1)';
    a.onload = () => {
      if (document.getElementById('b18Imgs') !== box) return;
      box.textContent = ''; box.appendChild(a);
      const c = document.createElement('p'); c.className = 'note'; c.textContent = 'Gambar: free-exercise-db (domain publik), "' + gid.replace(/_/g, ' ') + '". Periksa apakah sesuai dengan gerakanmu.'; box.appendChild(c);
      const b = new Image(); b.referrerPolicy = 'no-referrer'; b.className = 'b18img'; b.alt = 'Peragaan ' + m.n + ' (gambar 2)';
      b.onload = () => { if (document.getElementById('b18Imgs') === box) box.insertBefore(b, c); };
      b.onerror = () => { /* gambar kedua opsional */ };
      b.src = B18_IMG + gid + '/1.jpg';
    };
    a.onerror = next;
    a.src = B18_IMG + gid + '/0.jpg';
  };
  next();
}
QACT.b18Mv = el => b18MvSheet(el.dataset.id);
QACT.b18Img = el => b18LoadImg(el.dataset.id);
function b18Ask(q) { fcOpen('coach'); if (fcKind === 'coach' && !fcBusy) fcSend(q); }
QACT.b18AskSplit = () => { const sp = B18_SPLITS.find(x => x.id === b18Split) || B18_SPLITS[0]; b18Ask('Susun contoh jadwal mingguan ' + sp.n + ' dengan gerakan kalistenik, dari pemula sampai lanjut, dan jelaskan otot yang dilatih tiap hari.'); };

/* --- pelatih pintar: tanya lanjutan memakai model obrolan + web (bukan gaya "Hanya data") --- */
const B18_SYS = 'Kamu pelatih kalistenik serbaguna di dalam aplikasi catatan kebugaran milik satu orang. Jawab pertanyaan tentang kalistenik dan latihan beban badan dengan pengetahuanmu sendiri: teknik dan kesalahan umum, progresi dan regresi, jenis program (PPL, atas/bawah, full body) beserta contoh gerakan per kategori, otot yang bekerja, pemulihan, dan topik kebugaran umum yang berkaitan. ' +
  'Jika ada DATA, itu ringkasan catatan latihan pengguna yang dihitung aplikasi: pakai hanya bila pertanyaan menyangkut latihannya sendiri, dan jangan mengarang angka tentang catatan pengguna yang tidak ada di DATA. Untuk pertanyaan umum, DATA boleh diabaikan. ' +
  'Kamu hanya menyarankan: jangan menyuruh pengguna mengubah level atau catatannya (pengguna yang mengubahnya di Tangga progresi). ' +
  'Pakai nama gerakan baku (mis. Push-up, Pull-up, Inverted row, Bulgarian split squat, Plank) supaya aplikasi bisa menampilkan gambar dan videonya, dan jangan menulis tautan video: aplikasi menampilkannya sendiri. ' +
  'Bahasa Indonesia, ringkas dan enak dibaca di layar HP (sekitar 120 sampai 180 kata kecuali diminta rinci): paragraf pendek, boleh **tebal** untuk istilah penting, poin diawali "- ". ' +
  'Kamu bukan dokter dan tidak mendiagnosis: untuk nyeri tajam, bengkak, mati rasa, atau nyeri yang tidak membaik, sarankan berhenti dan menemui tenaga kesehatan. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
const b18Open = kind => kind === 'coach' && adb.scope !== 'data';
function b18Hist(st, upto, plain) {   // seperti fcHistory; pada gaya "Bebas saja" pasangan otomatis (turunan data log) tidak ikut
  const out = [];
  for (let i = 0; i < upto - 1; i++) {
    const a = st.msgs[i], b = st.msgs[i + 1];
    if (a.r === 'user' && b.r === 'model') { if (!(plain && a.auto)) out.push({ role: 'user', text: a.text.slice(0, 600) }, { role: 'model', text: b.text.slice(0, 1200) }); i++; }
  }
  return out.slice(-FC_HIST_MAX);
}
function b18Req(c, qm, st, qi) {
  const web = aiWebOn(), pro = adb.chatModel !== 'fast', useData = adb.scope !== 'plain' && !c.empty;
  return { task: 'coach-open', model: aiChatModel(), web, system: B18_SYS + (web ? AI_OPEN_WEB : AI_OPEN_NOWEB) + ' Hari ini ' + dayLong(today()) + '.',
    user: useData ? 'DATA:\n' + c.body + '\n\nPERTANYAAN:\n' + qm.text : qm.text, history: b18Hist(st, qi, adb.scope === 'plain'),
    max: pro ? 2000 : 1200, think: pro ? 8000 : 2048, timeout: pro ? 90000 : 60000 };
}
function b18Cap(m) {
  if (!m.smart) return '<div class="cap">✦ AI (Cepat) · bisa keliru, cek hal penting</div>';
  return '<div class="cap">✦ AI (' + esc(m.tier) + ')' + (m.web ? ' · web' : '') + ' · bisa keliru, cek hal penting</div>' + (m.noWeb ? '<div class="cap warn">Pencarian web tidak tersedia untuk akunmu, jadi dijawab tanpa web.</div>' : '');
}
function b18Extra(kind, m) {
  if (kind === 'tk') return tkExtra(m);
  if (kind !== 'coach') return '';
  const f = b18Find(m.text, 5);
  return (m.smart ? chatSourcesHTML(m) : '') + (f.length ? '<div class="b18see"><div class="cap">Lihat gerakan (otot, gambar, video)</div><div class="b18chips">' + f.map(id => '<button class="btn sm ghost b18mvb" data-q="b18Mv" data-id="' + id + '">' + esc(b18Mv(id).n) + '</button>').join('') + '</div></div>' : '');
}
function b18Frames() {   // HTML Search Suggestions dari Google (sandbox tanpa skrip), sama dengan obrolan utama
  const box = $('#fcMsgs'); if (!box || fcKind !== 'coach') return;
  box.querySelectorAll('iframe.gse').forEach(f => {
    const m = FC.coach.msgs.find(x => String(x.id) === f.dataset.id); if (!m || !m.entry) return;
    f.addEventListener('load', () => { try { const d = f.contentDocument; if (d && d.documentElement) { m.eh = Math.min(Math.max(d.documentElement.scrollHeight, 36), 160); f.style.height = m.eh + 'px'; } } catch (e) { /* pakai tinggi bawaan */ } });
    f.srcdoc = CH_GSE_HEAD + m.entry;
  });
}
const B18_GEN = ['Apa beda PPL dan full body?', 'Gerakan kalistenik untuk melatih punggung?', 'Urutan progresi menuju pull-up pertama?'];
const B18_DATA = ['Apakah sudah waktunya deload?', 'Alternatif untuk gerakan yang nyeri?', 'Gerakan mana yang paling berkembang?', 'Apa fokus sesi berikutnya?'];
const b18Starters = () => adb.scope === 'plain' ? B18_GEN.slice() : adb.scope === 'data' ? B18_DATA.slice() : B18_DATA.concat(B18_GEN.slice(0, 2));
const b18Chips = kind => kind !== 'coach' ? FC_CHIPS[kind] : adb.scope === 'plain' ? B18_GEN : FC_CHIPS.coach;
function b18EmptyNote() {
  if (adb.scope === 'data') return '<p class="note">Gaya jawaban sekarang "Hanya data": pelatih hanya menjawab dari catatanmu. Untuk pertanyaan umum (gerakan, program, otot) dan pencarian web, ganti gaya jawaban di Pengaturan › Preferensi › AI.</p>';
  return '<p class="note">Pelatih juga menjawab pertanyaan umum tentang kalistenik (gerakan, program PPL, otot yang bekerja)' + (aiWebOn() ? ' dan boleh mencari di web' : '') + '. Nama gerakan di jawaban bisa diketuk untuk melihat otot, gambar, dan videonya.</p>';
}
function b18EmptyOpen() {   // data belum cukup untuk ringkasan, tetapi pertanyaan umum tetap boleh
  if (adb.scope === 'data') return b18EmptyNote();
  return '<p class="note">Ringkasan sesi butuh data latihan. Pertanyaan umum tetap bisa kamu tulis di bawah; pelatih menjawabnya tanpa datamu.</p>' +
    '<div class="csug">' + B18_GEN.map(x => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' + b18EmptyNote();
}
{
  const _pk = QACT.fcPeek;   // gaya "Bebas saja": pertanyaan lanjutan tidak membawa data log; jelaskan itu apa adanya
  QACT.fcPeek = () => {
    if (fcKind !== 'coach' || adb.scope !== 'plain') { _pk(); return; }
    const c = b16Ctx();
    openSheet({ title: 'Data yang akan dikirim', note: 'Gaya jawaban "Bebas saja": pertanyaan lanjutanmu dikirim TANPA data log, hanya pertanyaanmu dan obrolan di layar ini. Hanya ringkasan otomatis (✦ Ringkas sesi & saran) yang memakai teks di bawah.', text: c.empty ? '' : c.body, prose: true, actions: [closeBtn] });
  };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b18: Object.freeze({
  mv: () => B18_MV.map(m => Object.assign({}, m)), splits: () => B18_SPLITS.map(s => Object.assign({}, s)), mus: Object.freeze(Object.assign({}, B18_MUS)),
  find: b18Find, agg: b18Agg, html: b18PusHTML, day: b18DayHTML, sys: B18_SYS, req: b18Req, open: b18Open, starters: b18Starters, ytq: b18Ytq, split: () => b18Split
}) }));
