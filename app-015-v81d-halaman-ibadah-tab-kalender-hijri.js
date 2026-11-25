/* ===== /v81c ===== */
/* ===== v81d: halaman Ibadah: tab Kalender (hijriah + Masehi berdampingan, hari besar, Ayyamul Bidh, Senin-Kamis), Kajian, Pengingat. Membalik: patch81d.py --reverse ===== */
/* ---------- Kalender: data hari penting (bulan hijriah, tanggal) ---------- */
const IBX_EV = [
  { m: 1, d: 1, t: 'Tahun Baru Hijriah', k: 'besar', n: '1 Muharram: awal tahun hijriah. Waktu yang baik untuk muhasabah dan memperbanyak amal.' },
  { m: 1, d: 9, t: 'Puasa Tasu\'a', k: 'sunnah', n: 'Disunnahkan berpuasa 9 dan 10 Muharram.' },
  { m: 1, d: 10, t: 'Hari Asyura', k: 'sunnah', n: 'Puasa Asyura menghapus dosa setahun yang lalu (HR. Muslim).' },
  { m: 3, d: 12, t: 'Maulid Nabi', k: 'besar', n: '12 Rabiul Awal, tanggal yang dipakai di Indonesia. Sebagian ulama berbeda soal tanggal kelahiran yang pasti.' },
  { m: 7, d: 27, t: 'Isra Mi\'raj', k: 'besar', n: '27 Rajab menurut tradisi yang dipakai di Indonesia; peristiwa turunnya perintah shalat lima waktu. Ulama berbeda soal tanggal pastinya.' },
  { m: 8, d: 15, t: 'Nisfu Syaban', k: 'info', n: 'Pertengahan Syaban. Ulama berbeda pendapat soal amalan khusus pada malam ini; puasa Ayyamul Bidh 13-15 tetap disunnahkan.' },
  { m: 9, d: 1, t: 'Awal Ramadhan', k: 'besar', n: 'Puasa Ramadhan wajib. Penetapan 1 Ramadhan di Indonesia lewat sidang isbat Kemenag; bisa beda sehari dari hitungan Umm al-Qura.' },
  { m: 9, d: 17, t: 'Nuzulul Qur\'an', k: 'besar', n: '17 Ramadhan: peringatan turunnya wahyu pertama menurut tradisi yang dipakai di Indonesia.' },
  { m: 9, d: 21, t: 'Awal 10 malam terakhir Ramadhan', k: 'sunnah', n: 'Cari Lailatul Qadar, terutama pada malam ganjil (21, 23, 25, 27, 29). I\'tikaf disunnahkan.' },
  { m: 10, d: 1, t: 'Idul Fitri', k: 'besar', n: '1 Syawal. Berpuasa pada hari ini haram. Zakat fitrah sebaiknya ditunaikan sebelum shalat Id.' },
  { m: 10, d: 2, t: 'Mulai puasa 6 hari Syawal', k: 'sunnah', n: 'Puasa enam hari di bulan Syawal setelah Ramadhan seperti puasa setahun (HR. Muslim).' },
  { m: 12, d: 1, t: 'Awal 10 hari Dzulhijjah', k: 'sunnah', n: 'Sepuluh hari pertama Dzulhijjah: perbanyak amal saleh, takbir, dan puasa (terutama 9 Dzulhijjah).' },
  { m: 12, d: 9, t: 'Hari Arafah', k: 'sunnah', n: 'Bagi yang tidak berhaji, puasa Arafah menghapus dosa setahun sebelum dan sesudahnya (HR. Muslim).' },
  { m: 12, d: 10, t: 'Idul Adha', k: 'besar', n: '10 Dzulhijjah. Berpuasa pada hari ini haram. Penyembelihan kurban 10 sampai 13 Dzulhijjah.' },
  { m: 12, d: 11, t: 'Hari Tasyriq', k: 'larang', n: '11, 12, dan 13 Dzulhijjah: hari makan dan minum, tidak boleh berpuasa (HR. Muslim).' },
  { m: 12, d: 12, t: 'Hari Tasyriq', k: 'larang', hide: true, n: '11, 12, dan 13 Dzulhijjah: hari makan dan minum, tidak boleh berpuasa (HR. Muslim).' },
  { m: 12, d: 13, t: 'Hari Tasyriq', k: 'larang', hide: true, n: '11, 12, dan 13 Dzulhijjah: hari makan dan minum, tidak boleh berpuasa (HR. Muslim).' }
];
for (let i = 3; i <= 7; i++) IBX_EV.push({ m: 10, d: i, t: 'Puasa 6 hari Syawal', k: 'sunnah', hide: true, n: 'Puasa enam hari di bulan Syawal (boleh dipilih harinya) seperti puasa setahun (HR. Muslim).' });
const IBX_EVMAP = {};
IBX_EV.forEach(e => { (IBX_EVMAP[e.m + '-' + e.d] = IBX_EVMAP[e.m + '-' + e.d] || []).push(e); });
const IBX_KP = { besar: 0, larang: 1, sunnah: 2, bidh: 2, rutin: 3, info: 4, wajib: 9 };
const IBX_KL = { besar: 'Hari besar', larang: 'Dilarang berpuasa', sunnah: 'Sunnah', bidh: 'Sunnah', rutin: 'Rutin', info: 'Catatan', wajib: 'Wajib' };
function ibxDayInfo(s) {   // s = 'YYYY-MM-DD' -> { h: hijriah, wd, ev: [acara] urut penting }
  const h = ibxHij(s), wd = pd(s).getDay(), ev = [];
  (IBX_EVMAP[h.m + '-' + h.d] || []).forEach(e => ev.push(e));
  if (h.d >= 13 && h.d <= 15 && h.m !== 9 && h.m !== 12) ev.push({ t: 'Ayyamul Bidh (' + h.d + ' ' + h.name + ')', k: 'bidh', n: 'Puasa sunnah tiga hari tiap bulan hijriah: tanggal 13, 14, dan 15 (HR. Tirmidzi dan An-Nasa\'i). Tidak dihitung di Ramadhan (puasa wajib) dan Dzulhijjah (ada hari Tasyriq).' });
  if (wd === 1 || wd === 4) ev.push({ t: 'Puasa sunnah ' + HARI[wd], k: 'rutin', n: 'Amal diperlihatkan pada hari Senin dan Kamis; Nabi senang bila amalnya diangkat saat beliau berpuasa (HR. Tirmidzi).' });
  if (wd === 5) ev.push({ t: 'Hari Jumat', k: 'rutin', n: 'Shalat Jumat bagi laki-laki, membaca Surah Al-Kahfi, memperbanyak shalawat, dan berdoa pada saat-saat mustajab.' });
  if (h.m === 9) ev.push({ t: 'Bulan Ramadhan', k: 'wajib', n: 'Puasa Ramadhan hukumnya wajib bagi yang mampu.' });
  ev.sort((a, b) => IBX_KP[a.k] - IBX_KP[b.k]);
  return { h, wd, ev };
}
let ibxKal = { y: 0, m: 0, sel: '', f: 'all' };
function ibxKalInit() { const t = today(), p = t.split('-').map(Number); ibxKal = { y: p[0], m: p[1], sel: t, f: 'all' }; }
ibxKalInit();
IBX_FRESH.push(ibxKalInit);
const ibxDiffDays = (a, b) => Math.round((pd(b) - pd(a)) / 86400000);
const ibxInTxt = n => n === 0 ? 'Hari ini' : n === 1 ? 'Besok' : n + ' hari lagi';
let ibxEvCache = null;
function ibxEvList() {   // acara bernama 400 hari ke depan: [{ s, e, h }]
  const t = today(), key = t + '|' + ibdb.pref.hadj;
  if (ibxEvCache && ibxEvCache.key === key) return ibxEvCache.list;
  const list = [];
  for (let i = 0; i < 400; i++) {
    const s = addDays(t, i), h = ibxHij(s), es = IBX_EVMAP[h.m + '-' + h.d];
    if (es) es.forEach(e => { if (!e.hide) list.push({ s, e, h }); });
  }
  ibxEvCache = { key, list };
  return list;
}
function ibxBidhNext() {   // { s, h, now } hari Ayyamul Bidh berikutnya (atau yang sedang berlangsung)
  const t = today();
  for (let i = 0; i < 45; i++) {
    const s = addDays(t, i), h = ibxHij(s);
    if (h.d >= 13 && h.d <= 15 && h.m !== 9 && h.m !== 12) return { s, h, i };
  }
  return null;
}
const ibxShortD = s => { const d = pd(s); return d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); };
function ibxKalHdr() {
  const f = ibxHij(ibxKal.y + '-' + pad(ibxKal.m) + '-01'), n = new Date(ibxKal.y, ibxKal.m, 0).getDate(), l = ibxHij(ibxKal.y + '-' + pad(ibxKal.m) + '-' + pad(n));
  if (f.y === l.y && f.m === l.m) return f.name + ' ' + f.y + ' H';
  if (f.y === l.y) return f.name + ' – ' + l.name + ' ' + f.y + ' H';
  return f.name + ' ' + f.y + ' – ' + l.name + ' ' + l.y + ' H';
}
function ibxKalDots(ev) {
  const seen = [];
  ev.forEach(e => { const c = e.k === 'bidh' ? 'sunnah' : e.k; if (c !== 'wajib' && !seen.includes(c)) seen.push(c); });
  return seen.slice(0, 3).map(c => '<i class="kd ' + c + '"></i>').join('');
}
function ibxKalGrid() {
  const y = ibxKal.y, m = ibxKal.m, n = new Date(y, m, 0).getDate(), lead = new Date(y, m - 1, 1).getDay(), t = today();
  let h = '<div class="kal-wd" aria-hidden="true">' + ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(x => '<span>' + x + '</span>').join('') + '</div><div class="kal-g">';
  for (let i = 0; i < lead; i++) h += '<span class="kal-e" aria-hidden="true"></span>';
  for (let d = 1; d <= n; d++) {
    const s = y + '-' + pad(m) + '-' + pad(d), inf = ibxDayInfo(s), big = inf.ev.some(e => e.k === 'besar');
    const lbl = d + ' ' + BULAN[m - 1] + ' ' + y + ', ' + inf.h.txt + (inf.ev.length ? ', ' + inf.ev.filter(e => e.k !== 'wajib').map(e => e.t).join(', ') : '');
    h += '<button class="kal-c' + (s === t ? ' today' : '') + (big ? ' big' : '') + '" data-q="ibxKalSel" data-v="' + s + '" data-fk="kc-' + s + '" aria-pressed="' + (s === ibxKal.sel) + '"' + (s === t ? ' aria-current="date"' : '') + ' aria-label="' + esc(lbl) + '"><b>' + d + '</b><i class="h">' + inf.h.d + '</i><span class="dots">' + ibxKalDots(inf.ev) + '</span></button>';
  }
  return h + '</div>';
}
function ibxKalDetail() {
  const s = ibxKal.sel, inf = ibxDayInfo(s), t = today();
  let h = '<section class="ibx-card kal-det" aria-live="polite"><h3>' + esc(dayLong(s)) + '</h3><p class="ibx-sub kal-hj">' + esc(inf.h.txt) + (s === t ? ' · hari ini' : '') + '</p>';
  if (inf.ev.length) h += '<ul class="kal-ev">' + inf.ev.map(e => '<li><i class="kd ' + (e.k === 'bidh' ? 'sunnah' : e.k) + '"></i><div><b>' + esc(e.t) + '</b><span>' + esc(IBX_KL[e.k]) + '</span>' + (e.n ? '<p>' + esc(e.n) + '</p>' : '') + '</div></li>').join('') + '</ul>';
  else h += '<p class="ibx-sub">Tidak ada hari khusus pada tanggal ini.</p>';
  if (s <= t) {
    const sc = ibxScore(s);
    h += '<div class="kal-sc"><span>' + (sc.any ? 'Skor ibadah ' + Math.round(sc.pct * 100) + '% (' + sc.got + ' dari ' + sc.total + ' amalan)' : 'Belum ada catatan ibadah') + '</span><button class="ibx-lnk" data-q="ibxKalLacak" data-fk="kl">Buka di Pelacak</button></div>';
  }
  return h + '</section>';
}
function ibxUpRow(x) {
  const n = ibxDiffDays(today(), x.s);
  return '<button class="kal-up" data-q="ibxKalJump" data-v="' + x.s + '" data-fk="ku-' + x.s + '-' + x.e.m + x.e.d + '"><span class="ku-i"><i class="kd ' + x.e.k + '"></i></span><span class="ku-t"><b>' + esc(x.e.t) + '</b><small>' + esc(dayLong(x.s)) + ' · ' + x.h.d + ' ' + esc(x.h.name) + ' ' + x.h.y + ' H</small></span><span class="ku-n">' + esc(ibxInTxt(n)) + '</span></button>';
}
function ibxKalPanel() {
  const t = today(), all = ibxEvList(), nxt = all.filter(x => x.e.k === 'besar' || x.e.k === 'sunnah').slice(0, 3), bd = ibxBidhNext();
  let up = '';
  if (bd) {
    const n = bd.i, h = bd.h;
    up += '<button class="kal-up" data-q="ibxKalJump" data-v="' + bd.s + '" data-fk="ku-bd"><span class="ku-i"><i class="kd sunnah"></i></span><span class="ku-t"><b>Ayyamul Bidh</b><small>' + (n === 0 ? 'Sedang berlangsung: ' : '') + h.d + ' ' + esc(h.name) + ' ' + h.y + ' H</small></span><span class="ku-n">' + esc(ibxInTxt(n)) + '</span></button>';
  }
  up += nxt.map(ibxUpRow).join('');
  const rows = all.filter(x => ibxKal.f === 'all' || x.e.k === 'besar');
  return '<section class="ibx-card kal-card" id="ibxKalCard"><div class="kal-hd"><div><h3>' + esc(BULAN[ibxKal.m - 1] + ' ' + ibxKal.y) + '</h3><p class="kal-hij">' + esc(ibxKalHdr()) + '</p></div><div class="kal-nav"><button data-q="ibxKalNav" data-v="-1" data-fk="kn-" aria-label="Bulan sebelumnya">‹</button><button data-q="ibxKalNav" data-v="1" data-fk="kn+" aria-label="Bulan berikutnya">›</button></div></div>' +
    ibxKalGrid() +
    '<div class="kal-lg"><span><i class="kd besar"></i>Hari besar</span><span><i class="kd sunnah"></i>Sunnah / Ayyamul Bidh</span><span><i class="kd larang"></i>Dilarang puasa</span><span><i class="kd rutin"></i>Senin, Kamis, Jumat</span></div>' +
    ((ibxKal.y + '-' + pad(ibxKal.m)) === t.slice(0, 7) ? '' : '<button class="ibx-lnk kal-now" data-q="ibxKalNow" data-fk="kno">Kembali ke bulan ini</button>') + '</section>' +
    ibxKalDetail() +
    '<section class="ibx-card kal-up-c"><h3>Berikutnya</h3><div class="kal-ups">' + up + '</div></section>' +
    '<section class="ibx-card"><h3>Hari penting 12 bulan ke depan</h3><div class="ibx-chips" role="group" aria-label="Saring hari penting">' + [['all', 'Semua'], ['besar', 'Hari besar']].map(c => '<button class="ibx-chip" data-q="ibxKalF" data-v="' + c[0] + '" aria-pressed="' + (ibxKal.f === c[0]) + '">' + c[1] + '</button>').join('') + '</div><div class="kal-ups">' + (rows.map(ibxUpRow).join('') || '<p class="ibx-empty">Tidak ada.</p>') + '</div></section>' +
    '<p class="ibx-fine">Tanggal hijriah mengikuti kalender Umm al-Qura. Penetapan 1 Ramadhan, 1 Syawal, dan 1 Dzulhijjah di Indonesia lewat sidang isbat Kemenag bisa berbeda satu hari: sesuaikan di Pelacak, Pengaturan, Koreksi tanggal hijriah. Keterangan keutamaan diringkas dari hadits yang umum dikenal; cocokkan dengan rujukan terpercaya.</p>';
}
IBX_PANEL.kal = ibxKalPanel; IBX_READY.kal = true;
QACT.ibxKalNav = b => {
  let y = ibxKal.y, m = ibxKal.m + (parseInt(b.dataset.v, 10) || 0);
  if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
  if (y < 1900 || y > 2100) return;
  ibxKal.y = y; ibxKal.m = m;
  ibxKal.sel = (y + '-' + pad(m)) === today().slice(0, 7) ? today() : y + '-' + pad(m) + '-01';
  ibxRender();
};
QACT.ibxKalNow = () => { ibxKalInit(); ibxRender(); };
QACT.ibxKalSel = b => { const s = String(b.dataset.v || ''); if (!DATE_RE.test(s)) return; ibxKal.sel = s; ibxRender(); };
QACT.ibxKalJump = b => {
  const s = String(b.dataset.v || ''); if (!DATE_RE.test(s)) return;
  const p = s.split('-').map(Number); ibxKal.y = p[0]; ibxKal.m = p[1]; ibxKal.sel = s;
  ibxTab = 'kal'; ibxSrOpen = false; ibxQ = '';
  ibxRender();
  const el = $('#ibxKalCard'); if (el) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* abaikan */ } }
};
QACT.ibxKalF = b => { ibxKal.f = b.dataset.v === 'besar' ? 'besar' : 'all'; ibxRender(); };
QACT.ibxKalLacak = () => { if (ibxKal.sel > today()) return; ibxDate = ibxKal.sel; ibxTab = 'lacak'; ibxRender(); };
/* cari: nama hari penting (mis. "idul adha", "ayyamul bidh") */
IBX_SEARCH.push(function (n, toks) {
  const out = [], seen = new Set();
  const named = IBX_EV.filter(e => !e.hide).map(e => ({ e, r: { t: ibxNorm(e.t), k: ibxNorm('hari besar kalender hijriah ' + HARI.join(' ')), a: ibxNorm(e.n), l: '', r: '' } }));
  named.push({ e: { t: 'Ayyamul Bidh', k: 'bidh', n: 'Puasa sunnah tanggal 13, 14, 15 tiap bulan hijriah.', m: 0, d: 0 }, r: { t: ibxNorm('Ayyamul Bidh'), k: ibxNorm('puasa sunnah kalender hijriah'), a: ibxNorm('tanggal 13 14 15'), l: '', r: '' } });
  named.forEach(x => {
    const s = ibxScoreOf(x.r, toks); if (!s || seen.has(x.e.t)) return; seen.add(x.e.t);
    const nx = x.e.m ? ibxEvList().find(z => z.e.t === x.e.t) : (() => { const b = ibxBidhNext(); return b ? { s: b.s, h: b.h } : null; })();
    out.push({ s: s + 1, kind: 'hari', h: '<details class="ibx-doa guide"><summary><span class="t">' + esc(x.e.t) + '</span><span class="c">Kalender' + (nx ? ' · ' + esc(ibxShortD(nx.s)) : '') + '</span></summary><div class="ibx-db"><p class="ibx-tr">' + esc(x.e.n) + '</p>' + (nx ? '<p class="ibx-f"><b>Berikutnya.</b> ' + esc(dayLong(nx.s)) + ' (' + nx.h.d + ' ' + esc(nx.h.name) + ' ' + nx.h.y + ' H), ' + esc(ibxInTxt(ibxDiffDays(today(), nx.s)).toLowerCase()) + '.</p><div class="ibx-da"><button class="ibx-mini" data-q="ibxKalJump" data-v="' + nx.s + '"><span>Lihat di kalender</span></button></div>' : '') + '</div></details>' });
  });
  return out;
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b81d: Object.freeze({ ev: IBX_EV, dayInfo: ibxDayInfo, evList: ibxEvList, bidhNext: ibxBidhNext, kal: () => ibxKal, kalHdr: ibxKalHdr }) }));
/* ===== v81d2: halaman Ibadah: tab Kajian (artikel tematik, Kajian saya, Tanya jawab, Pertanyaan saya). Membalik: patch81d.py --reverse --parts 1,2 ===== */
// Catatan: artikel dan jawaban ditulis dari pengetahuan penyusun (tanpa dataset, lingkungan kerja tanpa internet). Cocokkan dengan rujukan terpercaya; untuk kasus pribadi tanyakan kepada ustadz atau lembaga fatwa.
const IBX_ACAT = [["akidah", "Akidah"], ["fiqih", "Fiqih"], ["akhlak", "Akhlak"], ["sirah", "Sirah nabawiyah"]];
const IBX_ART = [
  { id: "a-iman", c: "akidah", t: "Rukun iman yang enam", r: "Dasar keyakinan seorang muslim menurut hadits Jibril.",
    b: ["Para ulama Ahlussunnah menjelaskan iman sebagai keyakinan dalam hati yang diikrarkan dengan lisan dan dibuktikan dengan amal. Dalam hadits Jibril, Nabi ﷺ menyebut iman itu: beriman kepada Allah, malaikat-Nya, kitab-kitab-Nya, rasul-rasul-Nya, hari akhir, dan takdir yang baik maupun yang buruk."],
    p: ["Allah: Esa, Pencipta, dan satu-satunya yang berhak disembah.", "Malaikat: makhluk yang taat; Jibril menyampaikan wahyu kepada para rasul.", "Kitab: Taurat, Zabur, Injil yang asli, dan Al-Qur'an sebagai penutup.", "Rasul: dari Nabi Adam hingga Nabi Muhammad ﷺ, penutup para nabi.", "Hari akhir: kebangkitan, perhitungan amal, surga, dan neraka.", "Takdir: segala sesuatu berada dalam ilmu dan kehendak Allah."],
    s: "HR. Muslim (hadits Jibril); QS. Al-Baqarah: 285.", k: "iman akidah rukun malaikat kitab rasul hari akhir takdir qadar jibril" },
  { id: "a-syahadat", c: "akidah", t: "Makna dua kalimat syahadat", r: "Pintu masuk Islam dan rukun Islam yang pertama.",
    b: ["Laa ilaaha illallah berarti tidak ada sesembahan yang berhak disembah dengan benar selain Allah. Kalimat ini menolak penyembahan kepada selain-Nya dan menetapkan ibadah hanya untuk-Nya.", "Muhammadur rasulullah berarti meyakini bahwa Nabi Muhammad ﷺ adalah utusan Allah: dibenarkan kabarnya, ditaati perintahnya, dijauhi larangannya, dan Allah disembah dengan cara yang beliau ajarkan."],
    p: ["Syahadat adalah rukun Islam yang pertama.", "Syahadat menuntut ilmu, keyakinan, dan keikhlasan.", "Buktinya tampak pada ibadah yang ikhlas dan mengikuti sunnah."],
    s: "QS. Muhammad: 19; QS. Al-Ahzab: 21; HR. Bukhari dan Muslim (hadits Ibnu Umar tentang rukun Islam).", k: "syahadat laa ilaaha illallah muhammad rasul islam rukun tauhid" },
  { id: "a-takdir", c: "akidah", t: "Beriman kepada takdir", r: "Berusaha sungguh-sungguh, lalu menerima ketetapan Allah dengan sabar dan syukur.",
    b: ["Beriman kepada takdir (qadha dan qadar) berarti yakin bahwa semua yang terjadi berada dalam ilmu, pencatatan, kehendak, dan penciptaan Allah. Takdir tidak membuat manusia berhenti berusaha: kita diperintah berikhtiar, lalu bertawakal.", "Saat musibah datang, seorang mukmin bersabar; saat nikmat datang, ia bersyukur. Nabi ﷺ menyebut urusan seorang mukmin semuanya baik."],
    p: ["Usaha adalah bagian dari takdir, bukan lawannya.", "Sabar saat musibah, syukur saat nikmat.", "Hindari berkata “andai saja” dengan penyesalan; ucapkan: Qaddarallahu wa maa syaa-a fa'ala."],
    s: "HR. Muslim no. 2664 dan no. 2999.", k: "takdir qadar qadha tawakal ikhtiar sabar syukur musibah" },
  { id: "f-syarat-shalat", c: "fiqih", t: "Syarat sah shalat", r: "Hal-hal yang harus terpenuhi sebelum shalat dimulai.",
    b: ["Sebelum takbiratul ihram, ada syarat yang harus terpenuhi agar shalat sah: (1) Islam, berakal, dan tamyiz atau baligh; (2) suci dari hadats kecil dan besar (wudhu, mandi, atau tayamum); (3) suci badan, pakaian, dan tempat dari najis; (4) menutup aurat; (5) masuk waktu shalat; dan (6) menghadap kiblat."],
    p: ["Aurat laki-laki dalam shalat: antara pusar dan lutut; perempuan: seluruh tubuh kecuali wajah dan telapak tangan.", "Bila ragu arah kiblat, berijtihad dengan kompas atau aplikasi, lalu shalat.", "Shalat sebelum masuk waktu tidak sah dan harus diulang."],
    s: "QS. An-Nisa: 103; QS. Al-A'raf: 31; HR. Bukhari dan Muslim (Allah tidak menerima shalat orang yang berhadats sampai ia berwudhu).", k: "shalat salat syarat sah wudhu najis aurat kiblat waktu suci" },
  { id: "f-puasa", c: "fiqih", t: "Puasa: yang wajib, sunnah, dan terlarang", r: "Gambaran umum hukum puasa sepanjang tahun.",
    b: ["Puasa Ramadhan wajib bagi muslim yang baligh, berakal, dan mampu. Puasa sunnah antara lain Senin-Kamis, Ayyamul Bidh (13-15 hijriah), Arafah, Asyura, dan enam hari Syawal. Puasa diharamkan pada Idul Fitri, Idul Adha, dan hari Tasyriq (11-13 Dzulhijjah); mengkhususkan hari Jumat saja dimakruhkan.", "Orang sakit dan musafir boleh tidak berpuasa lalu mengqadha di hari lain."],
    p: ["Menurut mazhab Syafi'i, niat puasa wajib dilakukan pada malam hari sebelum fajar.", "Membatalkan: makan atau minum dengan sengaja, muntah dengan sengaja, haid dan nifas, hubungan suami istri, serta keluar mani karena perbuatan sendiri.", "Makan atau minum karena lupa tidak membatalkan puasa."],
    s: "QS. Al-Baqarah: 183-187; HR. Bukhari dan Muslim.", k: "puasa shaum ramadhan sunnah senin kamis ayyamul bidh arafah asyura syawal tasyriq niat batal" },
  { id: "f-zakat", c: "fiqih", t: "Zakat fitrah dan zakat mal", r: "Siapa yang wajib, berapa besarnya, dan kapan ditunaikan.",
    b: ["Zakat fitrah wajib atas setiap muslim menjelang Idul Fitri, sebesar satu sha' makanan pokok, yang di Indonesia umumnya ditetapkan sekitar 2,5 kg atau 3,5 liter beras. Zakat mal dikeluarkan dari harta yang mencapai nisab dan telah dimiliki satu tahun hijriah (haul): untuk emas, nisabnya 85 gram dengan kadar 2,5 persen."],
    p: ["Zakat fitrah paling utama ditunaikan sebelum shalat Id; setelah shalat Id bernilai sedekah biasa. Menurut mazhab Syafi'i boleh dimajukan sejak awal Ramadhan.", "Penerima zakat ada delapan golongan (asnaf), di antaranya fakir dan miskin.", "Ukuran sha' berbeda antar mazhab dan lembaga; ikuti ketetapan lembaga zakat setempat."],
    s: "QS. At-Taubah: 60; HR. Bukhari dan Muslim (zakat fitrah satu sha').", k: "zakat fitrah mal nisab haul emas beras fakir miskin asnaf" },
  { id: "k-jujur", c: "akhlak", t: "Jujur dan amanah", r: "Kejujuran menuntun kepada kebaikan, kebaikan menuntun ke surga.",
    b: ["Nabi ﷺ bersabda bahwa kejujuran membawa kepada kebaikan dan kebaikan membawa ke surga, sedangkan dusta membawa kepada kejahatan dan kejahatan ke neraka. Jujur mencakup ucapan, janji, jual beli, dan sikap. Amanah berarti menunaikan hak orang lain dan menjaga titipan, termasuk amanah pekerjaan dan waktu."],
    p: ["Katakan yang benar, walau pahit, dengan cara yang baik.", "Tepati janji. Tanda munafik: berdusta saat berbicara, mengingkari janji, dan berkhianat saat dipercaya.", "Kejujuran dalam jual beli mendatangkan keberkahan."],
    s: "HR. Bukhari no. 6094 dan Muslim no. 2607; HR. Bukhari no. 33.", k: "jujur shidq amanah dusta janji munafik khianat" },
  { id: "k-ortu", c: "akhlak", t: "Berbakti kepada orang tua", r: "Ibadah kepada Allah disandingkan dengan berbuat baik kepada kedua orang tua.",
    b: ["Berbakti berarti berkata lembut, menaati dalam hal yang baik, membantu kebutuhan mereka, dan mendoakan. Setelah orang tua wafat, bakti dilanjutkan dengan doa, menunaikan janji dan wasiat mereka, serta menyambung silaturahmi dengan kerabat dan sahabat mereka."],
    p: ["Jangan mengucapkan “ah” dan jangan membentak mereka.", "Ketika ditanya siapa yang paling berhak diperlakukan baik, Nabi ﷺ menyebut ibu tiga kali, lalu ayah.", "Taat dalam yang ma'ruf; tidak ada ketaatan dalam maksiat."],
    s: "QS. Al-Isra: 23-24; HR. Bukhari no. 5971 dan Muslim no. 2548.", k: "orang tua ibu ayah birrul walidain bakti akhlak doa" },
  { id: "k-lisan", c: "akhlak", t: "Menjaga lisan", r: "Berkata baik atau diam.",
    b: ["Nabi ﷺ bersabda: barang siapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam. Lisan dapat mendatangkan pahala besar atau dosa besar: ghibah, namimah (adu domba), dusta, dan kata-kata kasar. Sebelum bicara, tanyakan pada diri sendiri: benarkah, bermanfaatkah, pantaskah."],
    p: ["Ghibah ialah menyebut keburukan saudara yang tidak hadir, meskipun benar.", "Tahan diri saat marah; diam lebih selamat daripada kata yang menyakiti.", "Ganti dengan dzikir, istighfar, dan kata yang menenangkan."],
    s: "HR. Bukhari no. 6018 dan Muslim no. 47; QS. Al-Hujurat: 12.", k: "lisan ghibah namimah adu domba bicara diam marah akhlak" },
  { id: "k-sabar", c: "akhlak", t: "Sabar dan syukur", r: "Dua sayap seorang mukmin dalam menghadapi hidup.",
    b: ["Sabar ada tiga macam: sabar dalam ketaatan, sabar menjauhi maksiat, dan sabar menghadapi musibah. Syukur dilakukan dengan hati (mengakui bahwa nikmat dari Allah), lisan (mengucap hamdalah), dan perbuatan (memakai nikmat untuk taat). Allah menjanjikan tambahan nikmat bagi orang yang bersyukur."],
    p: ["Sabar bukan pasrah tanpa usaha, tetapi menahan diri sambil terus berikhtiar.", "Saat musibah ucapkan: Innaa lillaahi wa innaa ilaihi raaji'uun.", "Dalam urusan dunia, lihatlah yang berada di bawah kita agar mudah bersyukur."],
    s: "QS. Ibrahim: 7; QS. Al-Baqarah: 155-156; HR. Muslim no. 2999 dan no. 2963.", k: "sabar syukur musibah nikmat hamdalah istirja akhlak" },
  { id: "s-lahir", c: "sirah", t: "Kelahiran dan masa kecil Nabi ﷺ", r: "Dari Makkah, tahun Gajah, hingga gelar Al-Amin.",
    b: ["Nabi Muhammad ﷺ lahir di Makkah pada tahun Gajah (sekitar 570 M), hari Senin, dari Bani Hasyim suku Quraisy. Ayahnya, Abdullah, wafat sebelum beliau lahir; ibunya, Aminah, wafat saat beliau masih kecil. Beliau diasuh kakeknya, Abdul Muththalib, lalu pamannya, Abu Thalib.", "Sejak muda beliau dikenal jujur dan dijuluki Al-Amin (yang tepercaya). Tanggal lahir yang masyhur di Indonesia ialah 12 Rabiul Awal; para ahli sejarah berbeda pendapat tentang tanggal pastinya."],
    p: ["Beliau berpuasa hari Senin karena itu hari kelahiran dan turunnya wahyu.", "Disusui oleh Halimah As-Sa'diyah di perkampungan Bani Sa'ad.", "Dikenal sebagai Al-Amin sebelum diangkat menjadi rasul."],
    s: "HR. Muslim no. 1162; Sirah Ibnu Hisyam; Ar-Rahiq Al-Makhtum.", k: "sirah nabi lahir maulid makkah tahun gajah abdullah aminah halimah al amin" },
  { id: "s-wahyu", c: "sirah", t: "Wahyu pertama di Gua Hira", r: "Awal kenabian: perintah untuk membaca.",
    b: ["Menjelang usia 40 tahun, Nabi ﷺ sering menyendiri (tahannuts) di Gua Hira. Di sana Jibril datang membawa wahyu pertama: Iqra' bismi rabbikalladzi khalaq (QS. Al-'Alaq: 1-5). Beliau pulang dalam keadaan gemetar dan ditenangkan oleh istrinya, Khadijah, yang kemudian menjadi orang pertama yang beriman. Dakwah dimulai secara sembunyi-sembunyi, lalu terang-terangan."],
    p: ["Wahyu pertama: lima ayat pertama Surah Al-'Alaq.", "Yang pertama beriman antara lain Khadijah, Abu Bakar, Ali bin Abi Thalib, dan Zaid bin Haritsah.", "Dakwah secara rahasia berlangsung sekitar tiga tahun."],
    s: "HR. Bukhari no. 3 dan Muslim no. 160 (hadits Aisyah tentang permulaan wahyu); QS. Al-'Alaq: 1-5.", k: "wahyu pertama gua hira iqra alaq jibril khadijah nuzulul quran kenabian" },
  { id: "s-hijrah", c: "sirah", t: "Hijrah ke Madinah", r: "Titik balik dakwah dan awal penanggalan hijriah.",
    b: ["Setelah bertahun-tahun menghadapi tekanan kaum Quraisy, Nabi ﷺ berhijrah ke Madinah (Yatsrib) pada tahun 622 M bersama Abu Bakar, dan sempat bersembunyi di Gua Tsur. Di Madinah beliau membangun Masjid Nabawi, mempersaudarakan kaum Muhajirin dan Anshar, serta menyusun Piagam Madinah.", "Pada masa Khalifah Umar bin Khattab, peristiwa hijrah dijadikan awal penanggalan hijriah; bulan pertamanya adalah Muharram."],
    p: ["Hijrah yang sebenarnya juga berarti meninggalkan apa yang dilarang Allah.", "Persaudaraan Muhajirin dan Anshar menjadi dasar masyarakat Madinah.", "Tahun baru hijriah jatuh pada 1 Muharram."],
    s: "QS. At-Taubah: 40; HR. Bukhari no. 10; Sirah Ibnu Hisyam.", k: "hijrah madinah yatsrib gua tsur muhajirin anshar piagam madinah muharram tahun baru hijriah" },
  { id: "s-fathu", c: "sirah", t: "Fathu Makkah", r: "Kemenangan besar yang diiringi pemaafan.",
    b: ["Pada Ramadhan tahun 8 H (630 M), setelah Quraisy melanggar Perjanjian Hudaibiyah, Nabi ﷺ memasuki Makkah bersama sekitar sepuluh ribu pasukan. Menurut riwayat sirah, beliau menundukkan kepala di atas untanya sebagai tanda tawadhu, membersihkan Ka'bah dari berhala, dan memaafkan penduduk Makkah. Peristiwa ini menjadi teladan kemenangan tanpa dendam."],
    p: ["Terjadi pada bulan Ramadhan tahun 8 H.", "Ka'bah dibersihkan dari berhala: telah datang kebenaran dan lenyaplah kebatilan (QS. Al-Isra: 81).", "Pemaafan massal menarik banyak orang memeluk Islam."],
    s: "HR. Bukhari dan Muslim (bab Fathu Makkah); QS. Al-Fath: 1; Sirah Ibnu Hisyam.", k: "fathu makkah penaklukan hudaibiyah ka'bah berhala pemaafan sirah ramadhan" }
];
const IBX_FCAT = [["shalat", "Shalat"], ["puasa", "Puasa"], ["suci", "Bersuci"], ["zakat", "Zakat"]];
const IBX_FAQ = [
  { id: "q-mushaf", c: "suci", t: "Apakah menyentuh mushaf Al-Qur'an harus berwudhu?",
    a: "Menurut jumhur ulama (termasuk mazhab Syafi'i), menyentuh atau membawa mushaf harus dalam keadaan suci dari hadats. Membaca dari hafalan tidak mensyaratkan wudhu. Banyak ulama masa kini menilai layar ponsel yang menampilkan ayat tidak sama dengan mushaf cetak, tetapi berwudhu tetap lebih utama.",
    n: "Sebagian ulama (misalnya Azh-Zhahiriyah) membolehkan menyentuh tanpa wudhu; ada pula keringanan bagi pelajar dan pengajar.", s: "QS. Al-Waqi'ah: 79; surat Nabi ﷺ kepada Amr bin Hazm (HR. Malik).", k: "mushaf quran wudhu sentuh suci hadats layar hp" },
  { id: "q-wudhu-lawan", c: "suci", t: "Apakah bersentuhan dengan lawan jenis membatalkan wudhu?",
    a: "Menurut mazhab Syafi'i, bersentuhan kulit antara laki-laki dan perempuan yang bukan mahram membatalkan wudhu.",
    n: "Mazhab Hanafi: tidak membatalkan. Maliki dan Hanbali: membatalkan bila disertai syahwat. Mengikuti salah satu pendapat ini sah; bila ragu, berwudhu ulang lebih berhati-hati.", s: "QS. An-Nisa: 43; QS. Al-Ma'idah: 6.", k: "wudhu batal sentuh lawan jenis mahram kulit bersuci" },
  { id: "q-qashar", c: "shalat", t: "Berapa jarak minimal untuk mengqashar shalat?",
    a: "Menurut jumhur ulama sekitar 81 sampai 89 km sekali jalan; ukuran 81 km banyak dipakai di Indonesia. Qashar meringkas shalat empat rakaat (Dzuhur, Ashar, Isya) menjadi dua rakaat, dan boleh dijamak.",
    n: "Mazhab Hanafi mensyaratkan jarak yang lebih jauh; sebagian ulama berpendapat tidak ada batas jarak tertentu selama disebut bepergian (safar).", s: "QS. An-Nisa: 101; HR. Muslim (Nabi ﷺ mengqashar dalam safar).", k: "qashar qasar jamak safar musafir jarak perjalanan shalat" },
  { id: "q-sakit", c: "shalat", t: "Bagaimana shalat orang sakit yang tidak mampu berdiri?",
    a: "Shalat tetap wajib. Kerjakan sambil berdiri; bila tidak mampu, sambil duduk; bila tidak mampu, berbaring miring menghadap kiblat; bila tidak mampu juga, dengan isyarat. Ruku dan sujud dilakukan dengan menundukkan kepala, sujud lebih rendah dari ruku.",
    n: "", s: "HR. Bukhari no. 1117 (hadits Imran bin Hushain).", k: "shalat sakit duduk berbaring isyarat berdiri uzur" },
  { id: "q-lupa-rakaat", c: "shalat", t: "Lupa jumlah rakaat saat shalat, apa yang dilakukan?",
    a: "Ambil jumlah yang paling diyakini (yang lebih sedikit), selesaikan shalat, lalu sujud sahwi. Menurut mazhab Syafi'i, sujud sahwi dilakukan sebelum salam. Panduan langkahnya ada di tab Doa & dzikir, Panduan fiqih, sujud sahwi.",
    n: "Sebagian mazhab menempatkan sujud sahwi setelah salam pada kasus tertentu.", s: "HR. Muslim no. 571 (hadits Abu Said Al-Khudri).", k: "lupa rakaat sujud sahwi ragu shalat" },
  { id: "q-qadha-shalat", c: "shalat", t: "Shalat yang terlewat karena tertidur atau lupa, apakah harus diganti?",
    a: "Ya. Kerjakan segera ketika terbangun atau teringat; itulah penebusnya. Bila ada beberapa shalat yang terlewat, kerjakan secara berurutan.",
    n: "Meninggalkan shalat dengan sengaja adalah dosa besar; para ulama berbeda soal tata cara menggantinya, maka segeralah bertaubat dan konsultasikan kepada ustadz.", s: "HR. Bukhari no. 597 dan Muslim no. 684.", k: "qadha shalat tertidur lupa terlewat ganti" },
  { id: "q-terlarang", c: "shalat", t: "Bolehkah shalat sunnah pada waktu yang dilarang?",
    a: "Menurut mazhab Syafi'i, waktu yang dilarang untuk shalat sunnah tanpa sebab ialah setelah shalat Subuh sampai matahari naik setinggi tombak, saat matahari tepat di tengah langit (kecuali hari Jumat), dan setelah shalat Ashar sampai matahari terbenam. Shalat yang punya sebab, seperti tahiyyatul masjid, shalat jenazah, dan qadha, boleh dikerjakan.",
    n: "Mazhab Hanafi lebih ketat dalam hal ini.", s: "HR. Bukhari dan Muslim.", k: "waktu terlarang shalat sunnah subuh ashar istiwa tahiyyatul masjid" },
  { id: "q-witir", c: "shalat", t: "Berapa rakaat shalat witir?",
    a: "Minimal satu rakaat dan paling banyak sebelas rakaat; boleh 1, 3, 5, 7, 9, atau 11 rakaat. Waktunya setelah shalat Isya hingga sebelum Subuh, dan disunnahkan menjadikannya penutup shalat malam.",
    n: "Mazhab Hanafi memandang witir tiga rakaat dan wajib.", s: "HR. Bukhari dan Muslim (shalat malam dua rakaat dua rakaat, lalu witir satu rakaat).", k: "witir rakaat shalat malam tahajud isya" },
  { id: "q-lupa-makan", c: "puasa", t: "Makan atau minum karena lupa saat berpuasa, apakah batal?",
    a: "Tidak batal. Teruskan puasanya; Allah yang memberinya makan dan minum.",
    n: "", s: "HR. Bukhari no. 1933 dan Muslim no. 1155.", k: "puasa lupa makan minum batal" },
  { id: "q-haid", c: "puasa", t: "Wanita yang haid: apakah mengganti shalat dan puasa?",
    a: "Selama haid dan nifas tidak shalat dan tidak berpuasa. Puasa yang ditinggalkan wajib diqadha di luar Ramadhan; shalat yang ditinggalkan tidak perlu diqadha.",
    n: "", s: "HR. Bukhari dan Muslim (hadits Aisyah).", k: "haid nifas puasa shalat qadha wanita" },
  { id: "q-sakit-puasa", c: "puasa", t: "Bolehkah tidak berpuasa karena sakit atau bepergian?",
    a: "Boleh bagi orang sakit yang puasanya memberatkan atau memperparah penyakit, dan bagi musafir; wajib mengqadha di hari lain. Orang tua renta atau penderita sakit menahun yang tidak mampu berpuasa membayar fidyah.",
    n: "Ibu hamil atau menyusui boleh berbuka; rincian qadha dan fidyahnya diperselisihkan ulama (mazhab Syafi'i: qadha, ditambah fidyah bila khawatir terhadap bayi).", s: "QS. Al-Baqarah: 184-185.", k: "puasa sakit musafir fidyah qadha hamil menyusui" },
  { id: "q-zakat-fitrah", c: "zakat", t: "Kapan zakat fitrah dibayar dan berupa apa?",
    a: "Menjadi wajib sejak terbenam matahari pada akhir Ramadhan; menurut mazhab Syafi'i boleh dimajukan sejak awal Ramadhan. Paling utama dibayar sebelum shalat Id; setelahnya bernilai sedekah biasa. Berupa makanan pokok (di Indonesia beras sekitar 2,5 kg atau 3,5 liter per jiwa).",
    n: "Mazhab Hanafi membolehkan membayar dengan uang senilai; di Indonesia banyak lembaga zakat menerima uang sesuai ketetapan setempat.", s: "HR. Bukhari dan Muslim; HR. Abu Dawud (zakat fitrah sebelum shalat Id).", k: "zakat fitrah waktu beras uang idul fitri" }
];
const IBX_ASEC = [["art", "Artikel"], ["kaj", "Kajian saya"], ["tj", "Tanya jawab"]];
const ibxArtCat = id => (IBX_ACAT.find(c => c[0] === id) || [0, ""])[1];
const ibxFaqCat = id => (IBX_FCAT.find(c => c[0] === id) || [0, ""])[1];
const ibxArtWords = a => (a.b.join(" ") + " " + a.p.join(" ")).split(/\s+/).filter(Boolean).length;
const ibxArtMin = a => Math.max(1, Math.round(ibxArtWords(a) / 170));
const IBX_URL_MAX = 300;
function ibxSafeUrl(u) {   // hanya http/https; tanpa skema ditambah https://; selain itu kosong
  let s = String(u == null ? "" : u).trim().slice(0, IBX_URL_MAX);
  if (!s) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
  try { const x = new URL(s); if (x.protocol !== "http:" && x.protocol !== "https:") return ""; if (!x.hostname || x.hostname.indexOf(".") < 1) return ""; return x.href.length <= 600 ? x.href : ""; } catch (e) { return ""; }
}
const IBX_TM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
function ibxCleanPref4(p, b) {   // dipanggil ibxClean: Kajian saya, Pertanyaan saya, artikel dibaca
  const k = p.kj && typeof p.kj === "object" && !Array.isArray(p.kj) ? p.kj : {};
  const str = (v, n) => typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "";
  const used = new Set();
  const uid = (v) => { let s = typeof v === "string" && /^[a-z0-9]{3,24}$/.test(v) ? v : ""; while (!s || used.has(s)) s = "k" + Math.random().toString(36).slice(2, 10); used.add(s); return s; };
  const it = [];
  (Array.isArray(k.it) ? k.it : []).forEach(x => {
    if (it.length >= 50 || !x || typeof x !== "object" || Array.isArray(x)) return;
    const t = str(x.t, 80); if (t.length < 2) return;
    const w = x.w === "pekan" ? "pekan" : "sekali", d = typeof x.d === "string" && DATE_RE.test(x.d) ? x.d : "";
    if (w === "sekali" && !d) return;
    const wd = Number.isInteger(x.wd) && x.wd >= 0 && x.wd <= 6 ? x.wd : 0;
    const dn = Array.isArray(x.dn) ? Array.from(new Set(x.dn.filter(v => typeof v === "string" && DATE_RE.test(v)))).sort().slice(-60) : [];
    it.push({ id: uid(x.id), t, s: str(x.s, 60), w, d: w === "sekali" ? d : "", wd: w === "pekan" ? wd : 0, tm: typeof x.tm === "string" && IBX_TM_RE.test(x.tm) ? x.tm : "", u: ibxSafeUrl(x.u), n: str(x.n, 200), dn });
  });
  const qs = [];
  (Array.isArray(k.qs) ? k.qs : []).forEach(x => {
    if (qs.length >= 50 || !x || typeof x !== "object" || Array.isArray(x)) return;
    const q = str(x.q, 200); if (q.length < 3) return;
    const c = Number(x.c);
    qs.push({ id: uid(x.id), q, a: str(x.a, 300), ok: x.ok === true, c: Number.isFinite(c) && c > 0 ? c : 0 });
  });
  const ids = IBX_ART.map(a => a.id);
  b.pref.kj = { it, qs, rd: Array.isArray(k.rd) ? Array.from(new Set(k.rd.filter(v => typeof v === "string" && ids.includes(v)))) : [] };
}
let ibxKjSec = "art", ibxKjCat = "all", ibxKjFq = "all", ibxKjFormOpen = false, ibxKjArm = "", ibxKjArmT = 0, ibxKjQDraft = "";
const ibxKjOpen = new Set();   // kartu artikel/tanya jawab yang sedang terbuka (supaya tetap terbuka saat digambar ulang)
const ibxKjBlankDraft = () => ({ t: "", s: "", w: "sekali", d: "", wd: new Date().getDay(), tm: "", u: "", n: "" });
let ibxKjDraft = ibxKjBlankDraft();
IBX_FRESH.push(() => { ibxKjSec = "art"; ibxKjCat = "all"; ibxKjFq = "all"; ibxKjFormOpen = false; ibxKjArm = ""; ibxKjQDraft = ""; ibxKjDraft = ibxKjBlankDraft(); ibxKjOpen.clear(); });
const ibxKjUid = () => "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ibxOpenAttr = id => ibxKjOpen.has(id) ? " open" : "";
function ibxArtCard(a, showTag) {
  const read = ibdb.pref.kj.rd.includes(a.id);
  return '<details class="ibx-doa guide kj-oc" data-id="' + a.id + '"' + ibxOpenAttr(a.id) + '><summary><span class="t">' + esc(a.t) + '</span><span class="c">' + (showTag ? "Artikel · " : "") + esc(ibxArtCat(a.c)) + " · ± " + ibxArtMin(a) + " menit" + (read ? " · sudah dibaca" : "") + '</span></summary><div class="ibx-db">' +
    '<p class="ibx-tr kj-lead">' + esc(a.r) + "</p>" + a.b.map(p => '<p class="kj-p">' + esc(p) + "</p>").join("") +
    '<p class="kj-h">Poin penting</p><ul class="kj-pts">' + a.p.map(p => "<li>" + esc(p) + "</li>").join("") + "</ul>" +
    '<p class="ibx-src">Rujukan: ' + esc(a.s) + "</p>" +
    '<div class="ibx-da"><button class="ibx-mini" data-q="ibxKjRead" data-id="' + a.id + '" data-fk="kjr-' + a.id + '" aria-pressed="' + read + '">' + IBX_CHK + "<span>" + (read ? "Sudah dibaca" : "Tandai sudah dibaca") + '</span></button><button class="ibx-mini" data-q="ibxKjCopy" data-id="' + a.id + '" data-fk="kjc-' + a.id + '"><span>Salin</span></button></div></div></details>';
}
function ibxFaqCard(f, showTag) {
  return '<details class="ibx-doa guide kj-oc" data-id="' + f.id + '"' + ibxOpenAttr(f.id) + '><summary><span class="t">' + esc(f.t) + '</span><span class="c">' + (showTag ? "Tanya jawab · " : "") + esc(ibxFaqCat(f.c)) + '</span></summary><div class="ibx-db">' +
    '<p class="kj-p">' + esc(f.a) + "</p>" + (f.n ? '<p class="ibx-f"><b>Catatan perbedaan pendapat.</b> ' + esc(f.n) + "</p>" : "") +
    '<p class="ibx-src">Rujukan: ' + esc(f.s) + ' Jawaban ringkas mengikuti mazhab Syafi\'i, bukan fatwa.</p>' +
    '<div class="ibx-da"><button class="ibx-mini" data-q="ibxKjCopy" data-id="' + f.id + '" data-fk="kjc-' + f.id + '"><span>Salin</span></button></div></div></details>';
}
function ibxKjArtHtml() {
  const rd = ibdb.pref.kj.rd, n = IBX_ART.length, got = IBX_ART.filter(a => rd.includes(a.id)).length;
  const chips = [["all", "Semua"]].concat(IBX_ACAT).concat([["new", "Belum dibaca"]]);
  const rows = IBX_ART.filter(a => ibxKjCat === "all" || (ibxKjCat === "new" ? !rd.includes(a.id) : a.c === ibxKjCat));
  return '<section class="ibx-card"><h3>Belajar pelan-pelan</h3><p class="ibx-sub">Sudah dibaca ' + got + " dari " + n + ' artikel. Ketuk judul untuk membuka.</p><div class="kj-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + got + '" aria-label="Artikel yang sudah dibaca"><i style="width:' + Math.round(got / n * 100) + '%"></i></div></section>' +
    '<div class="ibx-chips" role="group" aria-label="Kategori artikel">' + chips.map(c => '<button class="ibx-chip" data-q="ibxKjCat" data-v="' + c[0] + '" aria-pressed="' + (ibxKjCat === c[0]) + '">' + esc(c[1]) + "</button>").join("") + "</div>" +
    '<div class="ibx-dl">' + (rows.length ? rows.map(a => ibxArtCard(a, false)).join("") : '<p class="ibx-empty">Semua artikel sudah dibaca. Alhamdulillah.</p>') + "</div>" +
    '<p class="ibx-fine">Artikel diringkas dari pengetahuan umum penyusun, bukan salinan kitab. Cocokkan dengan rujukan yang tertera dan tanyakan kepada ustadz bila ada yang kurang jelas.</p>';
}
/* ---------- Kajian saya ---------- */
function ibxKjNextDate(it, t0) {   // kemunculan berikutnya (>= t0) atau "" bila sudah lewat
  t0 = t0 || today();
  if (it.w === "sekali") return it.d && it.d >= t0 ? it.d : "";
  return addDays(t0, (it.wd - pd(t0).getDay() + 7) % 7);
}
function ibxKjLastDate(it, t0) {   // kemunculan terakhir (<= t0) atau ""
  t0 = t0 || today();
  if (it.w === "sekali") return it.d && it.d <= t0 ? it.d : "";
  return addDays(t0, -((pd(t0).getDay() - it.wd + 7) % 7));
}
const ibxTmTxt = tm => tm ? tm.replace(":", ".") : "";
function ibxKjSorted() {
  const t = today();
  return ibdb.pref.kj.it.map(it => ({ it, nx: ibxKjNextDate(it, t) })).sort((a, b) => {
    const ka = a.nx ? 0 : 1, kb = b.nx ? 0 : 1; if (ka !== kb) return ka - kb;
    return (a.nx + (a.it.tm || "99:99")).localeCompare(b.nx + (b.it.tm || "99:99")) || a.it.t.localeCompare(b.it.t);
  });
}
function ibxKjItem(x) {
  const it = x.it, nx = x.nx, t = today(), arm = ibxKjArm === "it:" + it.id;
  const when = it.w === "pekan" ? "Setiap " + HARI[it.wd] : (it.d ? ibxShortD(it.d) : "");
  const lead = nx ? ibxInTxt(ibxDiffDays(t, nx)) : "Sudah lewat";
  const ref = ibxKjLastDate(it, t), att = it.dn.length;
  let h = '<div class="kj-it' + (nx === t ? " now" : "") + (nx ? "" : " past") + '" data-id="' + it.id + '"><div class="kj-hd"><b>' + esc(it.t) + '</b><span class="kj-when">' + esc(lead) + (it.tm ? " · " + ibxTmTxt(it.tm) : "") + "</span></div>" +
    '<p class="kj-sub">' + (it.s ? esc(it.s) + " · " : "") + esc(when) + (nx && it.w === "pekan" && nx !== t ? " (berikutnya " + esc(ibxShortD(nx)) + ")" : "") + (att ? " · dihadiri " + att + " kali" : "") + "</p>" + (it.n ? '<p class="kj-note">' + esc(it.n) + "</p>" : "") + '<div class="ibx-da">';
  if (it.u) h += '<a class="ibx-mini kj-a" href="' + esc(it.u) + '" target="_blank" rel="noopener noreferrer"><span>Buka tautan</span></a>';
  if (ref && (it.w === "sekali" || ref >= addDays(t, -6))) h += '<button class="ibx-mini" data-q="ibxKjHadir" data-id="' + it.id + '" data-fk="kjh-' + it.id + '" aria-pressed="' + it.dn.includes(ref) + '">' + IBX_CHK + "<span>" + (it.dn.includes(ref) ? "Hadir " : "Tandai hadir ") + (ref === t ? "hari ini" : esc(ibxShortD(ref))) + "</span></button>";
  h += '<button class="ibx-mini kj-del" data-q="ibxKjDel" data-id="' + it.id + '" data-fk="kjd-' + it.id + '"><span>' + (arm ? "Yakin hapus?" : "Hapus") + "</span></button></div></div>";
  return h;
}
function ibxKjForm() {
  const d = ibxKjDraft, pek = d.w === "pekan";
  return '<section class="ibx-card kj-f" id="kjForm"><h3>Tambah kajian</h3>' +
    '<label for="kjT">Judul kajian</label><input id="kjT" data-fk="kjT" type="text" maxlength="80" autocomplete="off" placeholder="Mis. Kajian Tafsir Ba\'da Maghrib" value="' + esc(d.t) + '">' +
    '<label for="kjS">Penceramah (opsional)</label><input id="kjS" data-fk="kjS" type="text" maxlength="60" autocomplete="off" placeholder="Nama ustadz" value="' + esc(d.s) + '">' +
    '<label id="kjWl">Jadwal</label><div class="ibx-chips" role="group" aria-labelledby="kjWl"><button class="ibx-chip" data-q="ibxKjW" data-v="sekali" aria-pressed="' + !pek + '">Sekali</button><button class="ibx-chip" data-q="ibxKjW" data-v="pekan" aria-pressed="' + pek + '">Tiap pekan</button></div>' +
    (pek ? '<label id="kjWdl">Hari</label><div class="ibx-chips kj-days" role="group" aria-labelledby="kjWdl">' + HARI.map((n, i) => '<button class="ibx-chip" data-q="ibxKjWd" data-v="' + i + '" aria-pressed="' + (d.wd === i) + '">' + n.slice(0, 3) + "</button>").join("") + "</div>"
      : '<label for="kjD">Tanggal</label><input id="kjD" data-fk="kjD" type="date" min="' + today() + '" value="' + esc(d.d) + '">') +
    '<label for="kjTm">Jam (opsional)</label><input id="kjTm" data-fk="kjTm" type="time" value="' + esc(d.tm) + '">' +
    '<label for="kjU">Tautan siaran atau rekaman (opsional)</label><input id="kjU" data-fk="kjU" type="url" inputmode="url" autocomplete="off" placeholder="youtube.com/..." value="' + esc(d.u) + '">' +
    '<label for="kjN">Catatan (opsional)</label><input id="kjN" data-fk="kjN" type="text" maxlength="200" autocomplete="off" placeholder="Mis. kitab yang dibahas" value="' + esc(d.n) + '">' +
    '<div class="kj-act"><button class="ibx-btn fill" data-q="ibxKjAdd" data-fk="kja">Simpan kajian</button><button class="ibx-lnk" data-q="ibxKjForm" data-fk="kjx">Batal</button></div></section>';
}
function ibxKjKajHtml() {
  const rows = ibxKjSorted(), t = today(), hari = rows.filter(x => x.nx === t).length;
  let h = '<section class="ibx-card"><h3>Kajian saya</h3><p class="ibx-sub">' + (rows.length ? (hari ? "Ada " + hari + " kajian hari ini. " : "") + rows.length + " kajian tersimpan." : "Catat jadwal kajian langsung atau rekaman yang ingin diikuti, lengkap dengan tautannya.") + '</p>' +
    (ibxKjFormOpen ? "" : '<button class="ibx-btn fill kj-addb" data-q="ibxKjForm" data-fk="kjo">Tambah kajian</button>') + "</section>";
  if (ibxKjFormOpen) h += ibxKjForm();
  if (rows.length) h += '<section class="ibx-card kj-list">' + rows.map(ibxKjItem).join("") + "</section>";
  return h + '<p class="ibx-fine">Tautan dibuka di tab baru. Aplikasi ini tidak memutar siaran kajian dan tidak menyimpan rekaman; yang disimpan hanya catatan jadwal di perangkat ini (ikut cadangan JSON).</p>';
}
/* ---------- Tanya jawab + Pertanyaan saya ---------- */
function ibxKjQItem(q) {
  const arm = ibxKjArm === "q:" + q.id;
  return '<div class="kj-q' + (q.ok ? " ok" : "") + '" data-id="' + q.id + '"><p class="kj-qt">' + esc(q.q) + "</p>" + (q.a && q.ok ? '<p class="kj-note">Jawaban: ' + esc(q.a) + "</p>" : "") +
    (q.ok ? '<div class="kj-qa"><input id="kjA-' + q.id + '" data-fk="kja-' + q.id + '" type="text" maxlength="300" autocomplete="off" aria-label="Catatan jawaban" placeholder="Catat jawaban singkat" value="' + esc(q.a) + '"><button class="ibx-mini" data-q="ibxKjQSave" data-id="' + q.id + '" data-fk="kjs-' + q.id + '"><span>Simpan</span></button></div>' : "") +
    '<div class="ibx-da"><button class="ibx-mini" data-q="ibxKjQOk" data-id="' + q.id + '" data-fk="kjo-' + q.id + '" aria-pressed="' + q.ok + '">' + IBX_CHK + "<span>" + (q.ok ? "Sudah terjawab" : "Tandai terjawab") + '</span></button><button class="ibx-mini kj-del" data-q="ibxKjQDel" data-id="' + q.id + '" data-fk="kjq-' + q.id + '"><span>' + (arm ? "Yakin hapus?" : "Hapus") + "</span></button></div></div>";
}
function ibxKjTjHtml() {
  const chips = [["all", "Semua"]].concat(IBX_FCAT), rows = IBX_FAQ.filter(f => ibxKjFq === "all" || f.c === ibxKjFq), qs = ibdb.pref.kj.qs, open = qs.filter(q => !q.ok).length;
  return '<section class="ibx-card"><h3>Tanya jawab fiqih harian</h3><p class="ibx-sub">' + IBX_FAQ.length + " pertanyaan yang sering muncul, dijawab ringkas dengan catatan perbedaan pendapat.</p></section>" +
    '<div class="ibx-chips" role="group" aria-label="Kategori tanya jawab">' + chips.map(c => '<button class="ibx-chip" data-q="ibxKjFq" data-v="' + c[0] + '" aria-pressed="' + (ibxKjFq === c[0]) + '">' + esc(c[1]) + "</button>").join("") + "</div>" +
    '<div class="ibx-dl">' + rows.map(f => ibxFaqCard(f, false)).join("") + "</div>" +
    '<section class="ibx-card kj-f"><h3>Pertanyaan saya untuk ustadz</h3><p class="ibx-sub">' + (qs.length ? open + " belum terjawab dari " + qs.length + "." : "Catat pertanyaan di sini, lalu tanyakan saat bertemu ustadz atau ikut kajian.") + '</p>' +
    '<label for="kjQ">Pertanyaan</label><div class="kj-qa"><input id="kjQ" data-fk="kjQ" type="text" maxlength="200" autocomplete="off" placeholder="Tulis pertanyaan" value="' + esc(ibxKjQDraft) + '"><button class="ibx-mini" data-q="ibxKjQAdd" data-fk="kjqa"><span>Tambah</span></button></div>' +
    (qs.length ? '<div class="kj-ql">' + qs.map(ibxKjQItem).join("") + "</div>" : "") + "</section>" +
    '<p class="ibx-fine">Jawaban di atas ringkasan umum dengan mengacu pada mazhab Syafi\'i, bukan fatwa. Untuk kasus pribadi, tanyakan kepada ustadz atau lembaga fatwa yang Anda percaya (misalnya MUI, NU, atau Muhammadiyah).</p>';
}
function ibxKjPanel() {
  return '<div class="ibx-chips" role="group" aria-label="Bagian Kajian">' + IBX_ASEC.map(c => '<button class="ibx-chip" data-q="ibxKjSec" data-v="' + c[0] + '" aria-pressed="' + (ibxKjSec === c[0]) + '">' + c[1] + "</button>").join("") + "</div>" +
    (ibxKjSec === "kaj" ? ibxKjKajHtml() : ibxKjSec === "tj" ? ibxKjTjHtml() : ibxKjArtHtml());
}
IBX_PANEL.kajian = ibxKjPanel; IBX_READY.kajian = true;
document.addEventListener("toggle", ev => {
  const t = ev.target;
  if (!t || !t.classList || !t.classList.contains("kj-oc") || !t.dataset.id) return;
  if (t.open) ibxKjOpen.add(t.dataset.id); else ibxKjOpen.delete(t.dataset.id);
}, true);
const IBX_KJ_FLD = { kjT: "t", kjS: "s", kjD: "d", kjTm: "tm", kjU: "u", kjN: "n" };
function ibxKjIn(ev) {
  const t = ev.target; if (!t || !t.id) return;
  if (IBX_KJ_FLD[t.id]) ibxKjDraft[IBX_KJ_FLD[t.id]] = t.value;
  else if (t.id === "kjQ") ibxKjQDraft = t.value;
}
document.addEventListener("input", ibxKjIn); document.addEventListener("change", ibxKjIn);
document.addEventListener("keydown", ev => { const t = ev.target; if (t && t.id === "kjQ" && ev.key === "Enter") { ev.preventDefault(); QACT.ibxKjQAdd(); } });
const ibxKjDisarm = () => { ibxKjArm = ""; clearTimeout(ibxKjArmT); };
const ibxKjSet = (k, v) => { ibxKjOpen.clear(); ibxKjDisarm(); if (k === "sec") ibxKjSec = v; else if (k === "cat") ibxKjCat = v; else ibxKjFq = v; ibxRender(); };
QACT.ibxKjSec = b => { const v = b.dataset.v; if (IBX_ASEC.some(c => c[0] === v)) ibxKjSet("sec", v); };
QACT.ibxKjCat = b => { const v = b.dataset.v; if (v === "all" || v === "new" || IBX_ACAT.some(c => c[0] === v)) ibxKjSet("cat", v); };
QACT.ibxKjFq = b => { const v = b.dataset.v; if (v === "all" || IBX_FCAT.some(c => c[0] === v)) ibxKjSet("fq", v); };
QACT.ibxKjRead = b => {
  const id = b.dataset.id; if (!IBX_ART.some(a => a.id === id)) return;
  const rd = ibdb.pref.kj.rd, i = rd.indexOf(id); if (i >= 0) rd.splice(i, 1); else rd.push(id);
  ibxSave(); ibxRender();
};
QACT.ibxKjCopy = b => {
  const id = b.dataset.id, a = IBX_ART.find(x => x.id === id), f = IBX_FAQ.find(x => x.id === id); let txt = "";
  if (a) txt = a.t + "\n\n" + a.b.join("\n\n") + "\n\nPoin penting:\n" + a.p.map(p => "- " + p).join("\n") + "\n\nRujukan: " + a.s;
  else if (f) txt = f.t + "\n\n" + f.a + (f.n ? "\n\nCatatan perbedaan pendapat: " + f.n : "") + "\n\nRujukan: " + f.s;
  else return;
  const ok = () => toast("Tulisan disalin."), no = () => toast("Tidak bisa menyalin di perangkat ini.");
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, no); else no(); } catch (e) { no(); }
};
QACT.ibxKjForm = () => { ibxKjFormOpen = !ibxKjFormOpen; if (ibxKjFormOpen) ibxKjDraft = ibxKjBlankDraft(); ibxKjDisarm(); ibxRender(); if (ibxKjFormOpen) { const el = $("#kjT"); if (el) { try { el.focus(); } catch (e) { /* abaikan */ } } } };
QACT.ibxKjW = b => { ibxKjDraft.w = b.dataset.v === "pekan" ? "pekan" : "sekali"; ibxRender(); };
QACT.ibxKjWd = b => { const n = parseInt(b.dataset.v, 10); if (n >= 0 && n <= 6) { ibxKjDraft.wd = n; ibxRender(); } };
QACT.ibxKjAdd = () => {
  const d = ibxKjDraft, kj = ibdb.pref.kj, t = String(d.t || "").replace(/\s+/g, " ").trim();
  if (kj.it.length >= 50) { toast("Daftar kajian penuh (maksimal 50). Hapus yang lama dulu."); return; }
  if (t.length < 2) { toast("Isi judul kajian dulu."); return; }
  if (d.w === "sekali") {
    if (!DATE_RE.test(d.d || "")) { toast("Pilih tanggal kajian."); return; }
    if (d.d < today()) { toast("Tanggal sudah lewat. Pilih hari ini atau sesudahnya."); return; }
  }
  if (d.tm && !IBX_TM_RE.test(d.tm)) { toast("Jam tidak sah."); return; }
  let u = "";
  if (String(d.u || "").trim()) { u = ibxSafeUrl(d.u); if (!u) { toast("Tautan tidak sah. Gunakan alamat http atau https."); return; } }
  kj.it.push({ id: ibxKjUid(), t: t.slice(0, 80), s: String(d.s || "").replace(/\s+/g, " ").trim().slice(0, 60), w: d.w === "pekan" ? "pekan" : "sekali", d: d.w === "sekali" ? d.d : "", wd: d.w === "pekan" ? d.wd : 0, tm: d.tm || "", u, n: String(d.n || "").replace(/\s+/g, " ").trim().slice(0, 200), dn: [] });
  ibxSave(); ibxKjFormOpen = false; ibxKjDraft = ibxKjBlankDraft(); ibxRender(); toast("Kajian ditambahkan.");
};
function ibxKjConfirm(key, fn) {   // dua ketukan: pertama menyiapkan, kedua menghapus
  if (ibxKjArm !== key) { ibxKjArm = key; clearTimeout(ibxKjArmT); ibxKjArmT = setTimeout(() => { ibxKjArm = ""; if (curView === "ibadah") ibxRender(); }, 4000); ibxRender(); return; }
  ibxKjDisarm(); fn(); ibxSave(); ibxRender();
}
QACT.ibxKjDel = b => { const id = b.dataset.id, kj = ibdb.pref.kj; if (!kj.it.some(x => x.id === id)) return; ibxKjConfirm("it:" + id, () => { kj.it = kj.it.filter(x => x.id !== id); toast("Kajian dihapus."); }); };
QACT.ibxKjHadir = b => {
  const it = ibdb.pref.kj.it.find(x => x.id === b.dataset.id); if (!it) return;
  const ref = ibxKjLastDate(it, today()); if (!ref) return;
  const i = it.dn.indexOf(ref); if (i >= 0) it.dn.splice(i, 1); else { it.dn.push(ref); it.dn.sort(); if (it.dn.length > 60) it.dn.shift(); }
  ibxSave(); ibxRender();
};
QACT.ibxKjQAdd = () => {
  const kj = ibdb.pref.kj, q = String(ibxKjQDraft || "").replace(/\s+/g, " ").trim();
  if (kj.qs.length >= 50) { toast("Daftar pertanyaan penuh (maksimal 50)."); return; }
  if (q.length < 3) { toast("Tulis pertanyaannya dulu."); return; }
  kj.qs.unshift({ id: ibxKjUid(), q: q.slice(0, 200), a: "", ok: false, c: Date.now() });
  ibxKjQDraft = ""; ibxSave(); ibxRender(); toast("Pertanyaan dicatat.");
};
QACT.ibxKjQOk = b => { const q = ibdb.pref.kj.qs.find(x => x.id === b.dataset.id); if (!q) return; q.ok = !q.ok; ibxSave(); ibxRender(); };
QACT.ibxKjQSave = b => {
  const q = ibdb.pref.kj.qs.find(x => x.id === b.dataset.id), el = q && $("#kjA-" + q.id); if (!q || !el) return;
  q.a = String(el.value || "").replace(/\s+/g, " ").trim().slice(0, 300); ibxSave(); ibxRender(); toast("Catatan jawaban disimpan.");
};
QACT.ibxKjQDel = b => { const id = b.dataset.id, kj = ibdb.pref.kj; if (!kj.qs.some(x => x.id === id)) return; ibxKjConfirm("q:" + id, () => { kj.qs = kj.qs.filter(x => x.id !== id); toast("Pertanyaan dihapus."); }); };
/* cari: artikel, tanya jawab, dan kajian saya */
let ibxKjIdx = null;
function ibxKjIndex() {
  if (ibxKjIdx) return ibxKjIdx;
  ibxKjIdx = {
    art: IBX_ART.map(a => ({ it: a, t: ibxNorm(a.t), k: ibxNorm(a.k + " artikel kajian " + ibxArtCat(a.c)), a: ibxNorm(a.r + " " + a.b.join(" ") + " " + a.p.join(" ")), l: "", r: "" })),
    faq: IBX_FAQ.map(f => ({ it: f, t: ibxNorm(f.t), k: ibxNorm(f.k + " tanya jawab fiqih " + ibxFaqCat(f.c)), a: ibxNorm(f.a + " " + f.n), l: "", r: "" }))
  };
  return ibxKjIdx;
}
IBX_SEARCH.push(function (n, toks) {
  const ix = ibxKjIndex(), out = [];
  ix.art.forEach(r => { const s = ibxScoreOf(r, toks); if (s) out.push({ s: s + 1, kind: "artikel", id: r.it.id, h: ibxArtCard(r.it, true) }); });
  ix.faq.forEach(r => { const s = ibxScoreOf(r, toks); if (s) out.push({ s: s + 1, kind: "tanya", id: r.it.id, h: ibxFaqCard(r.it, true) }); });
  ibdb.pref.kj.it.forEach(it => {
    const row = { t: ibxNorm(it.t), k: ibxNorm("kajian saya jadwal " + it.s), a: ibxNorm(it.n), l: "", r: "" }, s = ibxScoreOf(row, toks);
    if (!s) return;
    const nx = ibxKjNextDate(it, today());
    out.push({ s: s + 1, kind: "kajian", id: it.id, h: '<div class="ibx-doa guide kj-sr"><div class="kj-srb"><span class="t">' + esc(it.t) + '</span><span class="c">Kajian saya · ' + (nx ? esc(ibxInTxt(ibxDiffDays(today(), nx))) : "sudah lewat") + (it.tm ? " · " + ibxTmTxt(it.tm) : "") + '</span></div><button class="ibx-mini" data-q="ibxKjGo" data-v="kaj"><span>Buka di Kajian</span></button></div>' });
  });
  return out;
});
QACT.ibxKjGo = b => { const v = b.dataset.v; ibxSrOpen = false; ibxQ = ""; ibxTab = "kajian"; ibxKjSec = IBX_ASEC.some(c => c[0] === v) ? v : "art"; ibxKjOpen.clear(); ibxRender(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b81d2: Object.freeze({ art: IBX_ART, faq: IBX_FAQ, acat: IBX_ACAT, fcat: IBX_FCAT, safeUrl: ibxSafeUrl, clean4: ibxCleanPref4, nextDate: ibxKjNextDate, lastDate: ibxKjLastDate, sorted: ibxKjSorted, sec: () => ibxKjSec, panel: ibxKjPanel }) }));
/* ===== v81d3: halaman Ibadah: tab Pengingat (adzan, sepertiga malam, Al-Kahfi, puasa sunnah, Ayyamul Bidh, hari besar, kajian). Membalik: patch81d.py --reverse --parts 1,2,3 ===== */
// Batas jujur: halaman web tidak bisa membunyikan notifikasi saat peramban/aplikasi benar-benar tertutup (itu butuh server push). Pengingat dalam aplikasi + notifikasi bekerja selama Daily Log terbuka; untuk alarm yang berbunyi sendiri disediakan unduhan kalender (.ics).
const IBX_RM = [
  ["adzan", "Adzan dan waktu shalat"],
  ["sepertiga", "Sepertiga malam terakhir"],
  ["kahfi", "Surah Al-Kahfi hari Jumat"],
  ["sk", "Puasa sunnah Senin dan Kamis"],
  ["bidh", "Puasa Ayyamul Bidh"],
  ["besar", "Hari besar dan hari sunnah bernama"],
  ["kajian", "Kajian saya"]
];
const IBX_RM_IDS = IBX_RM.map(x => x[0]);
const IBX_RM_LEADS = [0, 5, 10, 15, 30, 60];
const IBX_RM_TM = /^([01]\d|2[0-3]):[0-5]\d$/;
const IBX_RM_GRACE = 10 * 60000;
function ibxCleanPref5(p, b) {   // dipanggil ibxClean: pengaturan pengingat
  const r = p.rm && typeof p.rm === "object" && !Array.isArray(p.rm) ? p.rm : {}, d = b.pref.rm, last = Number(r.last);
  b.pref.rm = {
    on: Array.isArray(r.on) ? Array.from(new Set(r.on.filter(v => IBX_RM_IDS.includes(v)))) : d.on.filter(v => IBX_RM_IDS.includes(v)),
    lead: IBX_RM_LEADS.includes(r.lead) ? r.lead : 10,
    kahfiAt: typeof r.kahfiAt === "string" && IBX_RM_TM.test(r.kahfiAt) ? r.kahfiAt : "07:00",
    skAt: typeof r.skAt === "string" && IBX_RM_TM.test(r.skAt) ? r.skAt : "19:30",
    last: Number.isFinite(last) && last > 0 ? Math.floor(last) : 0,
    nt: r.nt === true
  };
}
const ibxRmAtLocal = (s, tm) => { const p = s.split("-").map(Number), q = tm.split(":").map(Number); return new Date(p[0], p[1] - 1, p[2], q[0], q[1], 0, 0).getTime(); };
const ibxRmHM = ms => { const d = new Date(ms); return pad(d.getHours()) + "." + pad(d.getMinutes()); };
const ibxRmFirst = s => { const m = String(s || "").match(/^.*?[.!?](?:\s|$)/); return (m ? m[0] : String(s || "")).trim().slice(0, 170); };
/* semua pengingat yang "berpangkal" pada tanggal s (bisa jatuh pada malam sebelumnya/dini hari sesudahnya); only = daftar jenis (opsional) */
function ibxRmOcc(s, rm, only) {
  const out = [], use = t => rm.on.includes(t) && (!only || only.includes(t)), wd = pd(s).getDay(), lead = rm.lead, p = s.split("-").map(Number), has = hxHas();
  let d1 = null;
  if (has && (use("adzan") || use("sepertiga"))) d1 = hxDay(p[0], p[1], p[2], ldb);
  if (use("adzan") && d1) {
    d1.items.forEach(i => {
      if (!i.five || i.at == null) return;
      const jum = wd === 5 && i.name === "Dzuhur", hm = hxHM(i.at, d1.tz) + " " + hxTzName(d1.tz);
      out.push({ k: "adzan:" + s + ":" + i.id, ty: "adzan", at: i.at - lead * 60000, due: i.at, lead,
        sm: (jum ? "Dzuhur (Jumat)" : i.name) + " " + hm,
        t: lead ? (jum ? "Dzuhur (Jumat)" : i.name) + " " + hm + ", " + lead + " menit lagi" : "Waktu " + (jum ? "Dzuhur (Jumat)" : i.name) + " tiba (" + hm + ")",
        b: jum ? "Hari Jumat: bersegera ke masjid untuk shalat Jumat." : "Shalat tepat waktu adalah amal yang paling dicintai Allah (HR. Bukhari dan Muslim)." });
    });
  }
  if (use("sepertiga") && d1) {
    const q = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1)), d2 = hxDay(q.getUTCFullYear(), q.getUTCMonth() + 1, q.getUTCDate(), ldb), mg = d1.items[4].at, fj = d2.items[0].at;
    if (mg != null && fj != null && fj > mg) {
      const at = Math.floor((mg + (fj - mg) * 2 / 3) / 60000) * 60000, hm = hxHM(at, d1.tz) + " " + hxTzName(d1.tz);
      out.push({ k: "sepertiga:" + s, ty: "sepertiga", at, due: at, lead: 0, sm: "Sepertiga malam terakhir (" + hm + ")", t: "Sepertiga malam terakhir dimulai (" + hm + ")", b: "Waktu tahajud, doa, dan istighfar. Allah turun ke langit dunia pada sepertiga malam terakhir (HR. Bukhari dan Muslim)." });
    }
  }
  if (use("kahfi") && wd === 5) {
    out.push({ k: "kahfi:" + s, ty: "kahfi", at: ibxRmAtLocal(s, rm.kahfiAt), due: ibxRmAtLocal(s, rm.kahfiAt), lead: 0, ds: s, tm: rm.kahfiAt, sm: "Baca Surah Al-Kahfi", t: "Jumat: baca Surah Al-Kahfi", b: "Perbanyak shalawat juga hari ini. Ada riwayat tentang keutamaan membaca Al-Kahfi pada hari Jumat (HR. Al-Hakim dan Al-Baihaqi)." });
  }
  const nx = addDays(s, 1), nwd = pd(nx).getDay();
  if (use("sk") && (nwd === 1 || nwd === 4)) {
    out.push({ k: "sk:" + s, ty: "sk", at: ibxRmAtLocal(s, rm.skAt), due: ibxRmAtLocal(s, rm.skAt), lead: 0, ds: s, tm: rm.skAt, sm: "Besok puasa sunnah " + HARI[nwd], t: "Besok puasa sunnah " + HARI[nwd], b: "Siapkan niat dan sahur. Amal diperlihatkan pada hari Senin dan Kamis (HR. Tirmidzi)." });
  }
  if (use("bidh") || use("besar")) {
    const h = ibxHij(nx);
    if (use("bidh") && h.d >= 13 && h.d <= 15 && h.m !== 9 && h.m !== 12) {
      out.push({ k: "bidh:" + s, ty: "bidh", at: ibxRmAtLocal(s, rm.skAt), due: ibxRmAtLocal(s, rm.skAt), lead: 0, ds: s, tm: rm.skAt, sm: "Besok Ayyamul Bidh (" + h.d + " " + h.name + ")", t: "Besok Ayyamul Bidh (" + h.d + " " + h.name + ")", b: "Puasa sunnah tiga hari tiap bulan hijriah: tanggal 13, 14, dan 15." });
    }
    if (use("besar")) {
      (IBX_EVMAP[h.m + "-" + h.d] || []).forEach((e, j) => {
        if (e.hide || (e.k !== "besar" && e.k !== "sunnah")) return;
        out.push({ k: "besar:" + s + ":" + j, ty: "besar", at: ibxRmAtLocal(s, rm.skAt), due: ibxRmAtLocal(s, rm.skAt), lead: 0, ds: s, tm: rm.skAt, sm: "Besok: " + e.t, t: "Besok: " + e.t, b: ibxRmFirst(e.n) });
      });
    }
  }
  if (use("kajian")) {
    ibdb.pref.kj.it.forEach(it => {
      if (!(it.w === "sekali" ? it.d === s : wd === it.wd)) return;
      const tm = it.tm || "07:00", due = ibxRmAtLocal(s, tm), ld = it.tm ? lead : 0;
      out.push({ k: "kajian:" + s + ":" + it.id, ty: "kajian", at: due - ld * 60000, due, lead: ld, ds: s, tm, sm: "Kajian: " + it.t, t: it.tm ? (ld ? "Kajian " + it.t + ", " + ld + " menit lagi" : "Kajian " + it.t + " dimulai (" + ibxTmTxt(it.tm) + ")") : "Hari ini kajian: " + it.t, b: [it.s ? it.s : "", it.tm ? "Pukul " + ibxTmTxt(it.tm) : "", it.n ? it.n : ""].filter(Boolean).join(" · ") || "Jadwal dari Kajian saya." });
    });
  }
  return out;
}
function ibxRmBetween(from, to, rm) {   // pengingat aktif dengan waktu di (from, to]
  rm = rm || ibdb.pref.rm;
  if (!rm.on.length) return [];
  const out = [], n = Math.ceil((to - from) / 86400000) + 3;
  for (let i = 0, s = addDays(ymd(new Date(from)), -1); i < n; i++, s = addDays(s, 1)) {
    ibxRmOcc(s, rm).forEach(o => { if (o.at > from && o.at <= to) out.push(o); });
  }
  return out.sort((a, b) => a.at - b.at);
}
let ibxRmFeed = [];   // pengingat yang baru berbunyi (hanya selama sesi ini)
function ibxRmNotify(title, body, tag) {
  const rm = ibdb.pref.rm;
  if (!rm.nt || typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const fb = () => { try { new Notification(title, { body, tag }); } catch (e) { /* peramban HP sering menolak */ } };
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(r => { if (r && r.showNotification) return r.showNotification(title, { body, tag }); fb(); }).catch(fb);
      return true;
    }
  } catch (e) { /* lanjut */ }
  fb(); return true;
}
function ibxRmFeedHtml() {
  return '<div id="ibxRmFeed" aria-live="polite">' + ibxRmFeed.map((f, i) => '<div class="rm-bn"><span><b>' + esc(f.t) + '</b><small>' + esc(f.b) + '</small></span><button class="ibx-mini" data-q="ibxRmDis" data-v="' + i + '" aria-label="Tutup pengingat ' + esc(f.t) + '"><span>Tutup</span></button></div>').join("") + "</div>";
}
function ibxRmFeedPaint() { const el = $("#ibxRmFeed"); if (el) el.outerHTML = ibxRmFeedHtml(); }
function ibxRmPush(o, now) {
  ibxRmFeed.unshift({ k: o.k, t: o.t, b: o.b, at: now });
  ibxRmFeed = ibxRmFeed.slice(0, 4);
  return ibxRmNotify(o.t, o.b, o.k);
}
function ibxRmRun(now) {   // jalankan pengingat yang jatuh sejak terakhir; mengembalikan jumlah yang berbunyi
  const rm = ibdb.pref.rm;
  if (!rm.on.length) return 0;
  if (!rm.last || rm.last > now) { rm.last = now; return 0; }
  const hits = ibxRmBetween(Math.max(rm.last, now - IBX_RM_GRACE), now);
  if (!hits.length) return 0;
  let toasted = false;
  hits.forEach(o => { const ok = ibxRmPush(o, now); if (!ok && !toasted) { toasted = true; try { toast(o.t); } catch (e) { /* abaikan */ } } });
  rm.last = now; ibxSave();
  ibxRmFeedPaint();
  return hits.length;
}
function ibxRmTick() { try { ibxRmRun(Date.now()); } catch (e) { /* jangan ganggu aplikasi */ } }
setInterval(ibxRmTick, 20000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) ibxRmTick(); });
setTimeout(ibxRmTick, 4000);
/* ---------- tampilan ---------- */
const ibxRmPerm = () => typeof Notification === "undefined" ? "none" : Notification.permission;
function ibxRmStatus() {
  const rm = ibdb.pref.rm, pm = ibxRmPerm();
  let txt, btn = "";
  if (pm === "none") txt = "Peramban ini tidak mendukung notifikasi sistem. Pengingat tetap tampil di dalam aplikasi.";
  else if (pm === "denied") txt = "Notifikasi diblokir di pengaturan peramban. Izinkan dulu lewat pengaturan situs, lalu ketuk Aktifkan.";
  else if (pm === "granted" && rm.nt) { txt = "Notifikasi aktif. Muncul selama Ominia terbuka di peramban."; btn = '<button class="ibx-btn" data-q="ibxRmNt" data-v="0" data-fk="rm-nt0">Matikan notifikasi</button>'; }
  else txt = "Notifikasi belum aktif. Sekarang pengingat hanya tampil di dalam aplikasi.";
  if (!(pm === "granted" && rm.nt) && pm !== "none") btn = '<button class="ibx-btn fill" data-q="ibxRmNt" data-v="1" data-fk="rm-nt1">Aktifkan notifikasi</button>';
  return '<section class="ibx-card"><h3>Pengingat ibadah</h3><p class="rm-st" id="rmSt">' + esc(txt) + '</p><div class="rm-act">' + btn + '<button class="ibx-btn" data-q="ibxRmTest" data-fk="rm-test">Uji pengingat</button></div><p class="ibx-fine">Peramban hanya bisa membunyikan notifikasi saat Daily Log masih terbuka (termasuk di latar belakang). Bila ditutup penuh, atau di HP yang membatasi notifikasi web, pakai alarm kalender di bagian bawah.</p></section>';
}
function ibxRmDesc(id, rm) {
  const lead = rm.lead ? rm.lead + " menit sebelum" : "Tepat saat", tm = x => x.replace(":", ".");
  if (id === "adzan") return hxHas() ? lead + " masuk waktu Subuh, Dzuhur, Ashar, Maghrib, Isya" : "Butuh lokasi untuk jadwal shalat";
  if (id === "sepertiga") {
    if (!hxHas()) return "Butuh lokasi untuk jadwal shalat";
    const o = ibxRmOcc(today(), Object.assign({}, rm, { on: ["sepertiga"] }))[0];
    return o ? "Malam ini mulai pukul " + hxHM(o.at, hxParts(o.at, ldb).tz) + " (sepertiga akhir dari Maghrib sampai Subuh)" : "Jadwal tidak bisa dihitung di lokasi ini";
  }
  if (id === "kahfi") return "Tiap Jumat pukul " + tm(rm.kahfiAt);
  if (id === "sk") return "Malam sebelumnya pukul " + tm(rm.skAt);
  if (id === "bidh") return "Malam sebelum tanggal 13, 14, 15 hijriah, pukul " + tm(rm.skAt);
  if (id === "besar") return "Malam sebelumnya pukul " + tm(rm.skAt) + ": Idul Fitri, Idul Adha, Arafah, Asyura, dan lainnya";
  return ibdb.pref.kj.it.length ? (rm.lead ? rm.lead + " menit sebelum jam kajian" : "Tepat saat jam kajian") + " (" + ibdb.pref.kj.it.length + " kajian tercatat; tanpa jam: pukul 07.00)" : "Belum ada kajian tercatat. Tambah di tab Kajian";
}
function ibxRmTypes() {
  const rm = ibdb.pref.rm;
  const rows = IBX_RM.map(x => {
    const on = rm.on.includes(x[0]);
    const extra = x[0] === "adzan" && !hxHas() ? '<button class="ibx-lnk" data-q="hxLoc" data-fk="loc">Atur lokasi</button>' : x[0] === "kahfi" ? '<button class="ibx-lnk" data-q="ibxRmKahfi" data-fk="rm-kh">Buka Al-Kahfi</button>' : x[0] === "kajian" && !ibdb.pref.kj.it.length ? '<button class="ibx-lnk" data-q="ibxKjGo" data-v="kaj" data-fk="rm-kj">Buka Kajian saya</button>' : "";
    return '<div class="ibx-set rm-set"><span>' + esc(x[1]) + '<small class="ibx-fine" style="display:block;margin:2px 0 0">' + esc(ibxRmDesc(x[0], rm)) + "</small>" + extra + '</span><button class="ibx-sw" role="switch" aria-checked="' + on + '" aria-label="' + esc(x[1]) + '" data-q="ibxRmTg" data-id="' + x[0] + '" data-fk="rm-' + x[0] + '"></button></div>';
  }).join("");
  const chips = IBX_RM_LEADS.map(n => '<button class="ibx-chip" data-q="ibxRmLead" data-v="' + n + '" aria-pressed="' + (rm.lead === n) + '" data-fk="rml-' + n + '">' + (n ? n + " mnt" : "Tepat waktu") + "</button>").join("");
  return '<section class="ibx-card"><h3>Jenis pengingat</h3><p class="ibx-sub">Nyalakan yang dibutuhkan.</p>' + rows +
    '<p class="ibx-sub" style="margin-top:16px">Berapa menit sebelum adzan dan kajian</p><div class="ibx-chips" role="group" aria-label="Menit sebelum adzan dan kajian">' + chips + "</div>" +
    '<div class="kj-f"><label for="rmKahfi">Jam pengingat Al-Kahfi (Jumat)</label><input type="time" id="rmKahfi" data-fk="rm-kahfi" value="' + rm.kahfiAt + '"><label for="rmSk">Jam pengingat malam sebelumnya (puasa sunnah, Ayyamul Bidh, hari besar)</label><input type="time" id="rmSk" data-fk="rm-sk" value="' + rm.skAt + '"></div></section>';
}
function ibxRmNextHtml(now) {
  const rm = ibdb.pref.rm, t = today();
  if (!rm.on.length) return '<section class="ibx-card"><h3>Berikutnya</h3><p class="ibx-sub">Belum ada jenis pengingat yang menyala.</p></section>';
  const list = ibxRmBetween(now, now + 15 * 86400000).slice(0, 8);
  if (!list.length) return '<section class="ibx-card"><h3>Berikutnya</h3><p class="ibx-sub">Tidak ada pengingat dalam 15 hari ke depan' + (rm.on.includes("adzan") && !hxHas() ? ". Atur lokasi supaya adzan dan sepertiga malam bisa dihitung" : "") + ".</p></section>";
  return '<section class="ibx-card"><h3>Berikutnya</h3><ul class="rm-up">' + list.map(o => {
    const s = ymd(new Date(o.at)), n = ibxDiffDays(t, s), w = n === 0 ? "Hari ini" : n === 1 ? "Besok" : HARI[pd(s).getDay()] + " " + pd(s).getDate() + " " + BULAN[pd(s).getMonth()].slice(0, 3);
    return '<li><span class="rm-w">' + esc(w) + "<b>" + ibxRmHM(o.at) + '</b></span><span class="rm-t">' + esc(o.t) + "</span></li>";
  }).join("") + "</ul></section>";
}
function ibxRmIcsBox() {
  const r = ibxRmIcs(), rm = ibdb.pref.rm;
  return '<section class="ibx-card"><h3>Alarm di kalender HP</h3><p class="ibx-sub">Alarm dari aplikasi Kalender berbunyi sendiri walau Ominia tertutup.</p><p class="rm-st">' + (r.n ? r.n + " acara siap diunduh" : "Belum ada acara: nyalakan minimal satu jenis pengingat" + (rm.on.includes("adzan") && !hxHas() ? " (adzan butuh lokasi)" : "")) + '</p><div class="rm-act"><button class="ibx-btn fill" data-q="ibxRmIcs" data-fk="rm-ics"' + (r.n ? "" : " disabled") + '>Unduh alarm (.ics)</button></div><p class="ibx-fine">Berkas memuat adzan dan sepertiga malam untuk 30 hari ke depan (jam dihitung dari lokasi Anda), Al-Kahfi dan puasa Senin-Kamis berulang tiap pekan, serta Ayyamul Bidh, hari besar, dan kajian. Buka berkas di Kalender HP lalu izinkan impor. Unduh ulang tiap bulan agar jadwal shalat tetap baru; acara dengan penanda yang sama diperbarui, bukan digandakan, oleh sebagian aplikasi kalender.</p></section>';
}
function ibxRmPanel(now) {
  return ibxRmFeedHtml() + ibxRmStatus() + ibxRmTypes() + ibxRmNextHtml(now) + ibxRmIcsBox() +
    '<p class="ibx-fine">Waktu shalat dihitung dari lokasi (metode Kemenag: Subuh 20°, Isya 18°, ihtiyath 2 menit) dan bisa selisih beberapa menit dari jadwal masjid setempat. Hari besar mengikuti kalender Umm al-Qura; penetapan resmi di Indonesia lewat sidang isbat.</p>';
}
IBX_PANEL.ingat = ibxRmPanel; IBX_READY.ingat = true;
{ const baseHari = IBX_PANEL.hari; IBX_PANEL.hari = now => ibxRmFeedHtml() + baseHari(now); }

/* ===== NW0 (15 Nov 2026): KERANGKA tiga halaman baru di Lainnya (Sinaps = asah otak, Dapper = style dan fashion, English Mastery) dan tab Tahsin di Ibadah (penilaian bacaan Al-Qur’an). ===== */
/* HANYA kerangka: tidak ada data baru, tidak ada penyimpanan, tidak ikut cadangan JSON. Isi tiap tab dikerjakan bertahap (rencana: PROGRESS-2, entri STYOTK-R0, IB3-R0, EM-R0). Pola tab sama dengan Self Care. */
const NW_PAGES = {
  sinaps: { body: '#nwSinapsBody', aria: 'Bagian Sinaps', eb: 'Asah otak', name: 'Sinaps', tag: 'Latih otak, jaga ingatan',
    lead: 'Latihan otak singkat tiap hari, hafalan dengan ulangan berjarak, fokus tanpa gangguan, dan tidur yang menjaga ingatan.',
    tabs: [
      ['hari', 'Hari ini', 'Rencana tahap OTL-7', 'Ringkasan Sinaps hari ini', ['Latihan yang sudah dan belum dikerjakan hari ini', 'Streak dan rekor pribadi', 'Skor Sinaps sendiri, terpisah dari skor Beranda']],
      ['latihan', 'Latihan', 'Rencana tahap OTL-1 sampai OTL-6', 'Latihan otak 5 sampai 10 menit', ['Waktu reaksi, rentang digit, Stroop, Corsi (balok), dan hitung cepat', 'N-Back, dengan catatan jujur soal bukti ilmiahnya', 'Tingkat kesulitan menyesuaikan, grafik, dan rekor']],
      ['hafalan', 'Hafalan', 'Rencana tahap OTH-1 sampai OTH-4', 'Hafalan dengan ulangan berjarak', ['Kartu muncul lagi tepat sebelum lupa', 'Deck dari doa, dzikir, dan surat pendek di Ibadah', 'Deck buatan sendiri dan istana memori (rute rumah)']],
      ['fokus', 'Fokus', 'Rencana tahap OTF-1 sampai OTF-4', 'Mode fokus layar penuh', ['Timer pomodoro atau flow, layar tetap menyala', 'Jeda otomatis sebelum adzan, lanjut sesudahnya', 'Suara latar dan catatan menit fokus per hari']],
      ['tidur', 'Otak & tidur', 'Rencana tahap OTS-1 sampai OTS-4', 'Otak dan tidur', ['Batas kafein dihitung dari jam tidur Anda', 'Skor keteraturan tidur dari data Jurnal', 'Kuesioner singkat untuk kabut otak, dan info suplemen yang umum']]
    ] },
  dapper: { body: '#nwDapperBody', aria: 'Bagian Outfit', eb: 'Style & fashion', name: 'Outfit', tag: 'Tampil rapi tanpa ribet',
    lead: 'Asisten gaya pribadi: kamera gaya, warna dan potongan yang cocok, serta outfit dan gaya dari berbagai era untuk tiap acara.',
    tabs: [
      ['hari', 'Hari ini', 'Tahap belum dijadwalkan', 'Ringkasan gaya hari ini', ['Saran outfit menurut acara dan cuaca hari ini', 'Catatan pakaian yang dipakai hari ini (OOTD)', 'Pengingat Jumat: pakaian dan penampilan sesuai sunnah']],
      ['kamera', 'Kamera', 'Rencana tahap STK-1 sampai STK-6', 'Kamera gaya', ['Scan badan: foto depan dan samping untuk bentuk badan dan potongan yang cocok, dipadukan dengan angka tinggi dan lingkar Anda', 'Scan warna: undertone dan palet, dengan konfirmasi dari Anda', 'Cek outfit: penilaian jujur atas pakaian dan potongan, bukan atas tubuh', 'Wajah dikaburkan otomatis di perangkat sebelum foto dikirim ke AI']],
      ['badan', 'Badan & warna', 'Rencana tahap STB-1 dan STB-2', 'Bentuk badan dan warna', ['Bentuk badan dan rasio dari lingkar yang sudah ada di aplikasi', 'Panduan potongan: bahu, panjang celana, aturan sepertiga', 'Undertone, palet musiman, dan aturan 60-30-10', 'Virtual draping untuk mencoba warna']],
      ['era', 'Era & gaya', 'Rencana tahap STL-1 sampai STL-7', 'Perpustakaan era dan gaya', ['Gaya dari 1920-an sampai sekarang, tanpa AI', 'Pencarian dan filter, termasuk gaya Nusantara dan muslim', 'Tiap fakta era dicek rujukannya sebelum dimuat']]
    ] },
  english: { body: '#nwEnglishBody', aria: 'Bagian English Mastery', eb: 'Bahasa Inggris', name: 'English Mastery', tag: 'Percaya diri berbahasa Inggris',
    lead: 'Berbicara, menulis, dan berinteraksi dalam bahasa Inggris, dengan tes untuk mengasah kemampuan dan latihan pronunciation yang benar.',
    tabs: [
      ['hari', 'Hari ini', 'Rencana tahap EM-G', 'Latihan hari ini', ['Rencana harian dan streak', 'Tujuan belajar: IELTS atau TOEFL, kerja, atau traveling', 'Pengingat dan laporan mingguan']],
      ['tes', 'Tes', 'Rencana tahap EM-B', 'Tes penempatan dan latihan tes', ['Tes penempatan level, lalu tes tata bahasa, kosakata, listening, speaking, dan writing', 'Dinilai AI dengan skor dan level; bagian yang lemah bisa diulang', 'Perkiraan level dari AI, bukan skor ujian resmi']],
      ['writing', 'Writing', 'Rencana tahap EM-C', 'Writing dengan koreksi', ['Tulis, lalu AI mengoreksi dan menjelaskan alasannya', 'Diberi versi yang lebih baik sebagai contoh', 'Kesalahan masuk buku kesalahan untuk latihan ulang']],
      ['speaking', 'Speaking', 'Rencana tahap EM-D', 'Ngobrol lewat suara', ['Roleplay dengan AI: wawancara, restoran, kantor', 'Koreksi langsung atau di akhir obrolan, Anda yang memilih', 'Perlu internet dan izin mikrofon']],
      ['pron', 'Pronunciation', 'Rencana tahap EM-E', 'Pronunciation', ['Dengar contoh, ucapkan, lalu tiap kata ditandai benar atau kurang jelas', 'Tips bunyi untuk kata yang kurang tepat', 'Bukan skor fonem presisi; itu butuh layanan khusus berbayar']],
      ['kosa', 'Kosakata', 'Rencana tahap EM-F', 'Kosakata dengan ulangan berjarak', ['Kata baru dari obrolan, bacaan, dan kesalahan otomatis jadi kartu', 'Kartu yang sulit muncul lebih sering']]
    ] }
};
/* menggulir baris tab agar tab aktif terlihat penuh (baris dibangun ulang tiap render, jadi gulirnya kembali ke kiri); tidak bergerak bila tab aktif sudah terlihat */
function nwReveal(strip, sel) {
  const a = strip && strip.querySelector(sel + '[aria-pressed="true"]'); if (!a || strip.scrollWidth <= strip.clientWidth) return;
  const s = strip.getBoundingClientRect(), r = a.getBoundingClientRect();
  if (r.left >= s.left + 4 && r.right <= s.right - 4) return;
  strip.scrollLeft = Math.max(0, r.left - s.left + strip.scrollLeft - (s.width - r.width) / 2);
}
const nwTab = {};   // tab terpilih per halaman; hanya di memori, selalu mulai dari tab pertama saat halaman BARU dibuka
function nwRender(key) {
  const P = NW_PAGES[key], root = $(P.body); if (!root) return;
  if (!P.tabs.some(t => t[0] === nwTab[key])) nwTab[key] = P.tabs[0][0];
  const t = P.tabs.find(x => x[0] === nwTab[key]);
  const ae = document.activeElement, fk = ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;
  root.innerHTML = '<section class="nw-hero"><p class="nw-eb">' + esc(P.eb) + '</p><h2>' + esc(P.tag) + '</h2><p class="nw-lead">' + esc(P.lead) + '</p><p class="nw-fine">Halaman ini masih kerangka. Isi tiap tab dikerjakan bertahap.</p></section>' +
    '<div class="nw-tabs" role="group" aria-label="' + esc(P.aria) + '">' + P.tabs.map(x => '<button class="nw-tab" data-q="nwTab" data-p="' + key + '" data-v="' + x[0] + '" data-fk="tab-' + x[0] + '" aria-pressed="' + (nwTab[key] === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    '<section class="nw-card"><div class="nw-hd"><h3>' + esc(t[3]) + '</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + t[4].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><p class="nw-fine">' + esc(t[2]) + '</p></section>';
  nwReveal(root.querySelector('.nw-tabs'), '.nw-tab');
  if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
Object.keys(NW_PAGES).forEach(k => { RENDER[k] = () => nwRender(k); });
QACT.nwTab = b => { const k = b.dataset.p, v = b.dataset.v; if (!NW_PAGES[k] || !NW_PAGES[k].tabs.some(t => t[0] === v)) return; nwTab[k] = v; nwRender(k); };
{
  const baseShowNw = showView;
  showView = function (v) { if (NW_PAGES[v] && curView !== v) nwTab[v] = null; return baseShowNw(v); };
}
/* Tab Tahsin di Ibadah: kerangka penilaian bacaan Al-Qur’an (rencana IB3-A sampai IB3-F). Tidak ada rekaman, tidak ada AI, tidak ada data tersimpan. */
IBX_TABS.splice(IBX_TABS.findIndex(t => t[0] === 'quran') + 1, 0, ['tahsin', 'Tahsin']);
IBX_PANEL.tahsin = () => '<section class="ibx-card"><div class="nw-hd"><h3>Tahsin: penilaian bacaan</h3><span class="nw-soon">Segera</span></div>' +
  '<p class="nw-p">Baca satu ayat atau surah, lalu bacaan Anda dicocokkan dengan teksnya kata demi kata: mana yang sudah tepat, salah, terlewat, atau tertukar.</p>' +
  '<ul class="nw-list"><li>Hasil per kata berwarna dan bisa diketuk: hukum tajwid, jumlah harakat, dan contoh patokan detik yang mudah ditiru</li>' +
  '<li>Dibandingkan dengan bacaan qori: tempo, jeda, dan panjang bacaan</li>' +
  '<li>Skor keyakinan yang jujur (yakin benar, mungkin salah, tidak pasti) dan tombol koreksi dari Anda</li>' +
  '<li>Mode hafalan (muraja’ah): teks ditutup, baca dari ingatan</li>' +
  '<li>Ekspor rekaman dan hasil untuk dikoreksi guru mengaji</li></ul>' +
  '<p class="nw-fine">Rencana tahap IB3-A sampai IB3-F</p></section>' +
  '<section class="ibx-card"><div class="nw-hd"><h3>Batas yang jujur</h3></div>' +
  '<p class="nw-p">Pengenal suara cenderung membetulkan bacaan ke kata yang paling mungkin, jadi tajwid halus (panjang mad, ghunnah, huruf yang mirip) tidak bisa dipastikan. Tahsin membantu latihan dan bukan pengganti guru mengaji.</p></section>';
IBX_READY.tahsin = true;
{ const baseIbxR = ibxRender; ibxRender = function () { baseIbxR.apply(this, arguments); nwReveal($('#ibBody .ibx-tabs'), '.ibx-tab'); }; }   // tab Ibadah yang jauh di kanan (mis. Tahsin) tetap terlihat saat aktif

/* ===== STL-1a-begin (16 Nov 2026): PERPUSTAKAAN STYLE di Dapper > Era & gaya (rencana STYOTK-R0, tahap STL). Tanpa AI, tanpa penyimpanan, tidak ikut cadangan JSON. Membalik: hapus blok STL-1a. ===== */
/* ATURAN ISI: tiap fakta dicek ke sumber web (dicek 16 Nov 2026); yang tidak ketemu rujukannya TIDAK dimuat. Bagian "saran" = pendapat praktis penyusun, BUKAN fakta sejarah, dan diberi label. */
const DPL_ERAS = [['1920-50', '1920–50an'], ['1960-70', '1960–70an'], ['1980-89', '1980-an'], ['1990-99', '1990-an'], ['2000-09', '2000-an'], ['2010-19', '2010-an'], ['2020-29', '2020-an']];
const DPL_DICEK = '16 Nov 2026';
/* STL-1f-1: daftar "Sedang tren". HANYA DATA; ubah lewat settren.py. Syarat masuk: sumber terbaru kartu bertanggal dalam 12 bulan terakhir dan menyebutnya tren yang sedang berjalan. */
const DPL_TREN = { dicek: '17 Nov 2026', iso: '2026-11-17', batas: 30, ids: ['qzip20', 'wide20', 'loafer20', 'santai20'], ket: 'gaya yang sumber terbarunya (2026) membahasnya sebagai tren yang sedang berjalan' };
function dplTrenAge(now) { return Math.floor(((now == null ? Date.now() : now) - Date.parse(DPL_TREN.iso + 'T00:00:00+08:00')) / 864e5); }
/* data-busana.js potongan 0 (Tahap 3b): dipindah ke berkas sendiri, dimuat sebelum app.js */
const DPL_BUS = { pria: 'Pria', wanita: 'Wanita', semua: 'Semua' };
/* ===== 3d-1b-1: data busana dimuat saat tab Era dibuka (satu kode, dua cara muat) ===== */
// Satu berkas: DPL_LIB sudah tertanam di atas, jadi siap saat boot (tanpa jaringan, perilaku sama seperti sebelumnya).
// dist/: index.html TIDAK memuat data-busana.js; berkas itu dimuat lewat <script> saat tab Era dibuka pertama kali.
// Gagal muat (offline pertama): st 'fail', pesan jujur + tombol Coba lagi; otomatis dicoba lagi paling cepat 5 dtk kemudian.
const dplLd = { st: 'idle', n: 0, t: 0 };   // st: idle | busy | ok | fail; n = jumlah percobaan muat; t = waktu percobaan terakhir
function dplReady() { if (typeof DPL_LIB !== 'undefined') { dplLd.st = 'ok'; return true; } return false; }
function dplLib() { return dplReady() ? DPL_LIB : []; }
function dplEnsure(paksa) {
  if (dplReady() || dplLd.st === 'busy') return;
  if (!paksa && dplLd.st === 'fail' && Date.now() - dplLd.t < 5000) return;
  if (!document.head) return;
  dplLd.st = 'busy'; dplLd.n++; dplLd.t = Date.now();
  const sc = document.createElement('script'); sc.src = 'data-busana.js';
  sc.onload = () => { if (!dplReady()) { dplLd.st = 'fail'; dplLd.t = Date.now(); } dplRefreshAll(); };
  sc.onerror = () => { sc.remove(); dplLd.st = 'fail'; dplLd.t = Date.now(); dplRefreshAll(); };
  document.head.appendChild(sc);
}
function dplNote() {   // isi daftar bila data belum siap (satu berkas: tidak pernah tampil)
  if (dplLd.st === 'fail') return '<div class="dpl-emp" role="status"><p>Perpustakaan gaya belum termuat (mungkin offline).</p><button class="nw-tab" data-q="dplRetry" data-fk="dpl-retry">Coba lagi</button></div>';
  return '<div class="dpl-emp" role="status"><p>Memuat perpustakaan gaya…</p></div>';
}
/* ===== /3d-1b-1 ===== */
const dpl = { q: '', era: '', bus: '', tren: false, open: null };   // hanya di memori; selalu mulai bersih saat halaman Dapper BARU dibuka
const dplNorm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function dplHay(g) { return dplNorm([g.nama, (g.alias || []).join(' '), g.tahun, g.ringkas, g.siluet, (g.item || []).join(' '), (g.aksesori || []).join(' '), (g.sepatu || []).join(' '), g.rambut, g.palet, g.bahan, (g.catatan || []).join(' ')].join(' ')); }
/* STL-1e-3a (16 Nov 2026): pencarian PER AWAL KATA. Satu kata kueri cocok bila ia membuka sebuah kata di teks kartu (didahului bukan huruf/angka: awal teks, spasi, tanda hubung, tanda baca). Semua kata kueri harus cocok. */
function dplStart(hay, w) { let i = hay.indexOf(w); while (i >= 0) { if (i === 0 || !/[a-z0-9]/.test(hay.charAt(i - 1))) return true; i = hay.indexOf(w, i + 1); } return false; }
function dplMatch(g, q) { const t = dplNorm(q).split(/\s+/).filter(Boolean); if (!t.length) return true; const hay = dplHay(g); return t.every(w => dplStart(hay, w)); }
function dplFilter(lib, f) { return lib.filter(g => (!f.tren || DPL_TREN.ids.includes(g.id)) && (!f.era || g.era === f.era) && (!f.bus || g.busana === f.bus || g.busana === 'semua') && dplMatch(g, f.q)); }
const dplLi = a => a && a.length ? '<ul class="dpl-ul">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
const dplSec = (lab, body) => body ? '<div class="dpl-sec"><h4>' + esc(lab) + '</h4>' + body + '</div>' : '';
const dplP = t => t ? '<p>' + esc(t) + '</p>' : '';
function dplCardHtml(g) {
  const op = dpl.open === g.id, sa = g.saran;
  const saran = '<div class="dpl-sec dpl-tip"><h4>Saran penyusun (bukan fakta sejarah)</h4><ul class="dpl-ul"><li>Tingkat kesulitan dipakai sehari-hari: ' + esc(sa.sulit) + '</li><li>Cocok untuk: ' + esc(sa.acara) + '</li><li>Kurang cocok: ' + esc(sa.hindari) + '</li><li>Versi hemat: ' + esc(sa.hemat) + '</li></ul></div>';
  const src = '<div class="dpl-sec"><h4>Sumber (dicek ' + DPL_DICEK + ')</h4><div class="dpl-lk">' + g.sumber.map(s => '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(s[0]) + '</a>').join('') + '</div></div>' +
    '<div class="dpl-sec"><div class="dpl-lk"><a href="https://www.google.com/search?tbm=isch&amp;q=' + encodeURIComponent(g.cari) + '" target="_blank" rel="noopener noreferrer">Cari foto referensi (buka di browser)</a></div><p class="nw-fine">Foto tidak ditanam di aplikasi; tautan membuka pencarian di luar aplikasi.</p></div>';
  const dt = '<div class="dpl-dt" id="dplD-' + g.id + '"' + (op ? '' : ' hidden') + '>' + dplSec('Siluet', dplP(g.siluet)) + dplSec('Item kunci', dplLi(g.item)) + dplSec('Aksesori', dplLi(g.aksesori)) + dplSec('Sepatu', dplLi(g.sepatu)) + dplSec('Rambut', dplP(g.rambut)) + dplSec('Palet', dplP(g.palet)) + dplSec('Bahan', dplP(g.bahan)) + dplSec('Catatan fakta', dplLi(g.catatan)) + saran + (op ? dplImgHtml(g) : '') + src + '</div>';
  return '<article class="dpl-card"><button class="dpl-hd" data-q="dplOpen" data-id="' + g.id + '" data-fk="dpl-' + g.id + '" aria-expanded="' + op + '" aria-controls="dplD-' + g.id + '"><span class="dpl-t"><b>' + esc(g.nama) + '</b><i>' + esc(g.tahun) + '</i></span><span class="dpl-b">' + esc(DPL_BUS[g.busana]) + '</span><span class="dpl-ch" aria-hidden="true">›</span></button><p class="dpl-sum">' + esc(g.ringkas) + '</p>' + dt + '</article>';
}
function dplCt() { if (!dplReady()) return dplLd.st === 'fail' ? 'Belum termuat' : 'Memuat…'; const n = dplFilter(DPL_LIB, dpl).length; return n === DPL_LIB.length ? n + ' gaya' : n + ' dari ' + DPL_LIB.length + ' gaya'; }
function dplListHtml() {
  if (!dplReady()) return dplNote();
  const L = dplFilter(DPL_LIB, dpl);
  if (!L.length) return '<div class="dpl-emp"><p>Tidak ada gaya yang cocok dengan pencarian dan filter ini.</p><button class="nw-tab" data-q="dplClr" data-fk="dpl-clr">Hapus pencarian dan filter</button></div>';
  return L.map(dplCardHtml).join('');
}
function dplHtml() {
  const chip = (q, v, lab, on) => '<button class="nw-tab" data-q="' + q + '" data-v="' + v + '" data-fk="' + q + '-' + (v || 'semua') + '" aria-pressed="' + on + '">' + esc(lab) + '</button>';
  const eras = DPL_ERAS.length > 1 ? '<div class="dpl-chips" role="group" aria-label="Filter era">' + chip('dplEra', '', 'Semua era', !dpl.era) + DPL_ERAS.map(e => chip('dplEra', e[0], e[1], dpl.era === e[0])).join('') + '</div>' : '';
  return '<section class="nw-card"><div class="nw-hd"><h3>Perpustakaan era dan gaya</h3><span class="nw-soon">Mulai terisi</span></div><p class="nw-p">Gaya berpakaian dari masa ke masa, tanpa AI dan tanpa kuota; contoh gambar AI hanya muncul bila Anda menekan tombolnya di dalam kartu (opsional, uji coba). Baru era ' + esc(DPL_ERAS.map(e => e[1]).join(', ')) + ' yang terisi; era dan gaya lain menyusul bertahap.</p>' +
    '<div class="dpl-top"><input class="dpl-q" id="dplQ" type="search" placeholder="Cari gaya, item, atau kata kunci" aria-label="Cari gaya" value="' + esc(dpl.q) + '"><span class="dpl-ct" id="dplCt" aria-live="polite">' + dplCt() + '</span></div>' +
    dplTrenHtml(chip) + eras + '<div class="dpl-chips" role="group" aria-label="Filter busana">' + chip('dplBus', '', 'Semua busana', !dpl.bus) + chip('dplBus', 'pria', 'Pria', dpl.bus === 'pria') + chip('dplBus', 'wanita', 'Wanita', dpl.bus === 'wanita') + '</div></section>' +
    '<div id="dplList">' + dplListHtml() + '</div>' +
    '<p class="nw-fine">Fakta dicek dari sumber web pada ' + DPL_DICEK + ' dan sumbernya ada di tiap kartu. Bagian “Saran penyusun” adalah pendapat praktis, bukan fakta sejarah. Kecocokan dengan badan dan warna Anda menyusul di tahap berikutnya.</p>';
}
function dplTrenNote() { const a = dplTrenAge(), s = 'Daftar tren dicek ' + DPL_TREN.dicek + (a === 0 ? ' (hari ini)' : a > 0 ? ' (' + a + ' hari lalu)' : '') + ': ' + DPL_TREN.ids.length + ' ' + DPL_TREN.ket + '.'; return a > DPL_TREN.batas ? s + ' Sudah lebih dari ' + DPL_TREN.batas + ' hari, jadi tren bisa sudah berubah; minta Claude: “perbarui tren gaya”.' : s; }
function dplTrenHtml(chip) { return '<div class="dpl-chips" role="group" aria-label="Filter tren">' + chip('dplTren', '1', 'Sedang tren (' + DPL_TREN.ids.length + ')', dpl.tren) + '</div><p class="nw-fine" id="dplTrenNote">' + esc(dplTrenNote()) + '</p>'; }
function dplFocus(fk) { if (!fk) return; const el = document.querySelector('#dplWrap [data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
function dplRefreshList() { const l = $('#dplList'), c = $('#dplCt'); if (l) l.innerHTML = dplListHtml(); if (c) c.textContent = dplCt(); }
function dplRefreshAll() { const w = $('#dplWrap'); if (!w) return; const ae = document.activeElement, fk = ae && ae.dataset && w.contains(ae) ? ae.dataset.fk : null; w.innerHTML = dplHtml(); dplFocus(fk); }
function dplMount() { const root = $('#nwDapperBody'), card = root && root.querySelector('.nw-card'); if (!card) return; dplEnsure(); const w = document.createElement('div'); w.id = 'dplWrap'; w.innerHTML = dplHtml(); card.replaceWith(w); }
function dplReset() { dpl.q = ''; dpl.era = ''; dpl.tren = false; dpl.bus = ''; dpl.open = null; dplImgReset(); }
{ const baseNwR = nwRender; nwRender = function (key) { baseNwR.apply(this, arguments); if (key === 'dapper' && nwTab.dapper === 'era') dplMount(); }; }
{ const baseShowStl = showView; showView = function (v) { if (v === 'dapper' && curView !== 'dapper') dplReset(); return baseShowStl(v); }; }
QACT.dplOpen = b => { const id = b.dataset.id; if (!dplLib().some(g => g.id === id)) return; dpl.open = dpl.open === id ? null : id; const fk = b.dataset.fk; dplRefreshList(); dplFocus(fk); };
QACT.dplRetry = () => { dplEnsure(true); dplRefreshAll(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b3d1b: Object.freeze({ st: () => Object.assign({}, dplLd), n: () => dplLib().length }) }));
QACT.dplTren = () => { dpl.tren = !dpl.tren; dpl.open = null; dplRefreshAll(); };
QACT.dplBus = b => { const v = b.dataset.v; if (v && !DPL_BUS[v]) return; dpl.bus = v || ''; dpl.open = null; dplRefreshAll(); };
QACT.dplEra = b => { const v = b.dataset.v; if (v && !DPL_ERAS.some(e => e[0] === v)) return; dpl.era = v || ''; dpl.open = null; dplRefreshAll(); };
QACT.dplClr = () => { dpl.q = ''; dpl.era = ''; dpl.tren = false; dpl.bus = ''; dpl.open = null; dplRefreshAll(); const q = $('#dplQ'); if (q) { try { q.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } };
document.addEventListener('input', ev => { const t = ev.target; if (t && t.id === 'dplQ') { dpl.q = t.value; dpl.open = null; dplRefreshList(); } });
/* ===== STL-1g-1 (16 Nov 2026): contoh gambar AI per kartu era. UJI COBA: hanya dari tombol, hanya di memori, hanya teks prompt yang dikirim ===== */
const DPL_IMG_LABEL = 'Ilustrasi AI, bukan foto asli; detail pakaian bisa keliru';
const DPL_IMG_MODELS = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-nano-banana-2.1'];   // nama dari halaman harga resmi Google (dibaca 16 Nov 2026); kolom Model di kartu bisa diganti
const DPL_IMG = {   // ringkasan visual penyusun dari isi kartu (item kunci); tanpa nama orang nyata, tanpa nama sumber
  flapper: '1920s flapper look: straight loose drop-waist dress in beaded or fringed fabric, hem at the knee, cloche hat over a short bob haircut, long strand of beads, low-heeled Mary Jane shoes.',
  gatsby: '1920s Jazz Age menswear: fitted wool tweed suit with high-waisted narrow trousers, waistcoat, flat cap or straw boater, two-tone spectator shoes, clean-shaven.',
  glamor30: '1930s Hollywood glamour eveningwear: bias-cut satin gown with an open back and halter neckline, soft finger-waved hair, satin evening shoes.',
  pria30: '1930s menswear: three-piece suit with matching waistcoat, strong V-shaped shoulders, high-waisted full trousers with cuffs, side-parted pomaded hair, cap-toe oxford shoes.',
  zoot: 'Late 1930s to 1940s zoot suit menswear: long drape jacket with wide lapels and padded shoulders, high-waisted wide-leg trousers pegged tight at the ankle, pointed shoes.',
  perang40: '1940s wartime womenswear: wool skirt suit with padded shoulders, knee-length shirtwaist dress with contrast collar, sturdy wedge shoes with cork soles.',
  pria40: '1940s menswear: single or double-breasted suit with flat-front trousers and a pressed centre crease, wingtip or spectator shoes, side-parted pomaded hair.',
  ivy: '1950s Ivy Style menswear: oxford button-down shirt, natural-shoulder sack blazer, chinos or grey flannel trousers, V-neck sweater, penny loafers.',
  rockabilly: '1950s rockabilly, one man and one woman: he wears a black leather jacket, fitted white tee and rolled-cuff jeans; she wears a full circle skirt with a fitted bodice and black-and-white saddle shoes.',
  mod60: '1960s Mod, one man and one woman: he wears a slim suit with narrow lapels and a button-down shirt under an army-green fishtail parka, chelsea boots; she wears an A-line mini shift dress with a geometric pattern.',
  hippie60: 'Late 1960s hippie look, one man and one woman: embroidered bell-bottom jeans with patches, tie-dye shirt, paisley print, suede fringe vest, leather sandals.',
  space60: '1960s Space Age menswear: collarless jacket without lapels buttoned high, slim straight trousers, turtleneck instead of shirt and tie, heeled boots, clean geometric look.',
  pria70: '1970s disco-era menswear: polyester double-knit suit, jacket with very wide notched lapels and large flap pockets, flared trousers, collarless waistcoat.',
  kasual70: '1970s casual menswear: cutbray wide-leg jeans, denim jacket with patches, double denim, corduroy sport jacket, clogs, long hair.',
  punk70: '1970s punk menswear: black biker leather jacket, tight ripped jeans, tartan bondage trousers with straps, worn black tee with safety pins, heavy work boots.',
  power80: '1980s power dressing menswear: double-breasted wide-shouldered suit with padded shoulders, bold tie and braces, slicked-back hair, tassel loafers.',
  preppy80: '1980s preppy menswear: polo shirt with popped collar, oxford shirt, sweater tied over the shoulders, chinos, boat shoes or penny loafers without socks.',
  hiphop80: '1980s hip hop menswear: matching striped tracksuit in bright colours, flat-brim hat, thick gold chain, shell-toe sneakers with fat laces.',
  vice80: '1980s Miami Vice menswear: unstructured pastel or white linen suit jacket over a plain tee, sleeves pushed up, no belt, white espadrilles or loafers without socks.',
  rock80: '1980s rocker menswear, heavy metal and glam: studded black leather jacket, tight spandex pants, band tee, denim vest with patches, studded wristbands, big voluminous hair, combat boots.',
  newwave80: '1980s New Romantic menswear: ruffled frilly shirt, military-style jacket or brocade frock coat with wide shoulders, dramatic makeup, jack boots.',
  grunge90: '1990s grunge menswear: oversized flannel shirt over a band tee, faded ripped baggy jeans, knit cardigan, black combat boots or canvas sneakers, beanie.',
  hiphop90: '1990s hip-hop menswear, urban sportswear: very baggy jeans worn low, oversized jersey, big-logo tops without real brand names, work boots, loose boxy silhouette.',
  minimal90: '1990s minimalist menswear: plain tee, straight trousers, slim black suit or black blazer, simple knitwear, clean cuts in a monochrome neutral palette.',
  britpop90: '1990s Britpop menswear: fishtail parka with funnel collar, track top jacket, polo shirt, straight jeans, desert boots or classic trainers, layered and relaxed.',
  casual90: '1990s dressy casual menswear: khaki trousers with a button-up shirt, blazer worn with jeans, V-neck cashmere sweater without a jacket, loafers.',
  sport00: '2000s sportswear and streetwear menswear: polo with popped collar, cargo pants, rugby shirt or athletic jersey, trucker cap, checkerboard slip-on sneakers or skate shoes.',
  metro00: '2000s metrosexual menswear: slim fitted pink shirt, neatly tailored suit, V-neck tee with rings, hard-soled shoes, carefully groomed styled hair.',
  indie00: '2000s indie and emo menswear: very skinny jeans, slim blazer over a tee, skinny tie, short leather jacket, canvas sneakers, side-swept fringe hair.',
  hiphop00: '2000s hip-hop menswear: baggy jeans, oversized white tall tee, retro sports jersey, white leather low-top sneakers, tan work boots.',
  prep00: '2000s preppy and neo-prep menswear: layered popped-collar polos, pastel polo and pink shirt, school-style blazer with tie, plaid, argyle sweater vest, cardigan.',
  madmen10: 'Early 2010s slim-suit dandy menswear: slim grey suit, skinny tie, pocket square, monk-strap or polished black oxford shoes, tailored dandy details.',
  hipster10: 'Early 2010s hipster heritage menswear: flannel shirt, slim jeans, cable-knit cardigan with shawl collar, thick-rimmed glasses, neat beard, brogues or camp moccasins.',
  streetwear10: '2010s streetwear and athleisure menswear: slim joggers, hoodie, sweatshirt, premium chunky sneakers, collaboration capsule look.',
  gucci10: '2010s maximalist menswear: floral-print suit jacket with wide-leg trousers, brocade, velvet and jacquard fabrics, pussy-bow blouse and silk shirt, lace and embroidery, fur-lined loafers.',
  normcore10: 'Mid-2010s normcore menswear: ordinary straight jeans, plain tee, fleece, flannel shirt, denim jacket, chunky white dad sneakers, sandals with socks.',
  gender10: '2010s gender-fluid menswear: a man wearing a skirt or dress, lace and floral blouse, tuxedo gown, unisex staples like sweaters and hoodies, heeled boots.',
  kpop10: '2010s Korean menswear and K-pop style: layered jackets and coats such as a leather jacket under a flight jacket, sharp tailoring mixed with sportswear, custom suit, chunky sneakers, mostly black with accents.',
  gorp20: '2020s gorpcore menswear: waterproof shell jacket, puffer vest, fleece, cargo or hiking pants, trail running shoes worn as daily wear.',
  wide20: '2020s relaxed-silhouette menswear: pleated wide-leg tailored trousers, roomy casual chinos or work pants, loose-cut blazer, oversized coat.',
  qzip20: '2020s quarter-zip menswear: knit or cotton-jersey quarter-zip sweater with the zip from neck to chest, layered over a collared shirt, tailored trousers, loafers, navy, camel or khaki tones.',
  loafer20: '2020s smart-shoes menswear: polished leather loafer, loafer with a softly ruched toe, suede apron derby, patent brogue and leather ankle boots, worn with washed jeans, wide-leg trousers or suit trousers and a loose jacket; no sneakers.',
  santai20: '2020s relaxed playful menswear: soft knit cardigan with small embroidered flowers, loose drapey jacket and trousers, pastel and bright colors, knee-length shorts, ballet flats or leather slippers; gentle and fun, no logos.'
};
const dplImg = { model: DPL_IMG_MODELS[0], busy: '', res: {}, err: {}, prompt: {}, gen: 0 };   // hanya di memori; ikut dikosongkan saat halaman Dapper baru dibuka
const dplImgNama = g => String(g.nama).replace(/\s*\([^)]*\)/g, '').trim();
function dplImgPrompt(g) {
  const b = DPL_IMG[g.id]; if (!b) return '';
  return 'Fashion editorial illustration, full-length, plain neutral studio background. Anonymous fictional model(s) with faces turned away or softly blurred; do not depict any real or famous person. ' + b + ' No text, no captions, no watermark.';
}
function dplImgReset() { dplImg.gen++; if (dplImg.busy) AI.cancel(); dplImg.busy = ''; dplImg.res = {}; dplImg.err = {}; dplImg.prompt = {}; }
// AI.image({prompt, model}) -> {ok, mime, data(base64)} | {ok:false, code, msg}. Tidak pernah melempar error. Hanya mode Kunci (proxy belum).
AI.image = async function (o) {
  const rd = this.ready(); if (!rd.ok) return { ok: false, code: rd.why, msg: rd.msg };
  if (aiMode() !== 'key') return { ok: false, code: 'mode', msg: 'Contoh gambar baru bisa memakai kunci API sendiri, bukan proxy. Ganti mode ke Kunci di Pengaturan › Preferensi › AI.' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, code: 'offline', msg: 'Sedang offline. Membuat gambar butuh internet, fitur lain tetap normal.' };
  if (this.run) return { ok: false, code: 'busy', msg: 'Permintaan AI sebelumnya masih berjalan.' };
  const model = String(o.model || '').trim(), prompt = String(o.prompt || '').trim();
  if (!/^[\w.\-]{1,60}$/.test(model) || /^claude/i.test(model)) return { ok: false, code: 'bad', msg: 'Nama model tidak valid. Pakai huruf, angka, titik, atau tanda hubung.' };
  if (prompt.length < 20) return { ok: false, code: 'bad', msg: 'Prompt terlalu pendek atau kosong. Tulis deskripsi gambarnya.' };
  const run = { ctl: new AbortController(), cancelled: false }; this.run = run;
  let timedOut = false; const tm = setTimeout(() => { timedOut = true; run.ctl.abort(); }, 90000);
  try {
    const res = await fetch(AI_ENDPOINT + encodeURIComponent(model) + ':generateContent', { method: 'POST', signal: run.ctl.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': adb.key }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt.slice(0, 2000) }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:4' } } }) });
    const raw = await res.text(); let data = null; try { data = JSON.parse(raw); } catch (e) { /* bukan JSON */ }
    if (!res.ok) {
      if (res.status === 429 && /limit:\s*0\b/.test(raw)) return { ok: false, code: 'nofree', msg: 'Kuota model “' + model + '” untuk kunci ini 0 (kunci gratis tidak diberi jatah gambar untuk model ini). Pakai Salin prompt lalu Buka Gemini (gratis), atau aktifkan penagihan di Google AI Studio.' };
      if (res.status === 404) return { ok: false, code: 'model', msg: 'Model “' + model + '” tidak ditemukan untuk kunci ini. Pakai Salin prompt lalu Buka Gemini (gratis).' };
      return aiHttpErr(res.status, data, 'key');
    }
    const blk = { ok: false, code: 'blocked', msg: 'Gemini menolak membuat gambar ini (filter keamanan). Ubah prompt, misalnya hapus nama orang atau merek.' };
    if (data && data.promptFeedback && data.promptFeedback.blockReason) return blk;
    const cand = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
    const parts = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : [];
    const im = parts.map(p => p && (p.inlineData || p.inline_data)).find(d => d && typeof d.data === 'string' && d.data);
    if (!im) {
      if (cand && ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY'].includes(cand.finishReason)) return blk;
      const tx = parts.filter(p => p && typeof p.text === 'string' && !p.thought).map(p => p.text).join(' ').trim();
      if (tx) return { ok: false, code: 'notimg', msg: 'Model membalas teks, bukan gambar: ' + tx.slice(0, 140) };
      return { ok: false, code: 'empty', msg: 'Gemini tidak mengembalikan gambar. Coba lagi atau ganti model.' };
    }
    const mime = String(im.mimeType || im.mime_type || '').toLowerCase();
    if (!/^image\/(png|jpeg|webp)$/.test(mime)) return { ok: false, code: 'badimg', msg: 'Jenis gambar dari Gemini tidak dikenal.' };
    if (im.data.length > 12000000 || !/^[A-Za-z0-9+\/=\s]+$/.test(im.data)) return { ok: false, code: 'badimg', msg: 'Data gambar dari Gemini tidak bisa dibaca.' };
    return { ok: true, mime, data: im.data.replace(/\s+/g, '') };
  } catch (e) {
    if (run.cancelled) return { ok: false, code: 'cancelled', msg: '' };
    if (timedOut) return { ok: false, code: 'timeout', msg: 'Gemini terlalu lama membuat gambar. Coba lagi.' };
    return { ok: false, code: 'net', msg: 'Tidak bisa terhubung ke Gemini. Periksa internet.' };
  } finally { clearTimeout(tm); if (this.run === run) this.run = null; }
};
function dplImgHtml(g) {
  const id = g.id, pv = dplImg.prompt[id] != null ? dplImg.prompt[id] : dplImgPrompt(g);
  const btn = (q, fk, lab) => '<button class="nw-tab" data-q="' + q + '" data-id="' + id + '" data-fk="' + fk + '-' + id + '">' + lab + '</button>';
  const gem = '<a class="nw-tab" data-q="dplImgGem" data-id="' + id + '" data-fk="dplimggem-' + id + '" href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">Buka Gemini</a>';
  return '<div class="dpl-sec dpl-img"><h4>Contoh gambar (lewat Gemini)</h4>' +
    '<label class="dpl-il" for="dplImgP-' + id + '">Prompt untuk Gemini (bisa diedit)</label><textarea class="dpl-imgp" id="dplImgP-' + id + '" rows="6" maxlength="2000">' + esc(pv) + '</textarea>' +
    '<div class="dpl-imgb">' + btn('dplImgCopy', 'dplimgcopy', 'Salin prompt') + gem + btn('dplImgRst', 'dplimgrst', 'Prompt awal') + '</div>' +
    '<p class="nw-fine">Buka Gemini menyalin prompt lebih dulu, lalu membuka Gemini; tempel prompt di sana. Bila tidak terbuka, buka aplikasi Gemini sendiri lalu tempel. Bila salin otomatis gagal (mis. halaman dibuka dari file di HP), prompt sudah terpilih: ketuk Salin di menu yang muncul. Aplikasi ini tidak mengirim data apa pun; gambar dibuat di Gemini dan tidak disimpan di sini. Ilustrasi AI bukan foto asli, dan detail pakaian bisa keliru.</p></div>';
}
function dplImgCopyNow(id, p) {   // lewat kotak prompt yang tampil; bila papan klip diblokir (halaman content:// atau tanpa HTTPS), kotak dipilih supaya bisa disalin dari menu HP
  const ta = $('#dplImgP-' + id);
  const ok = () => toast('Prompt tersalin');
  const fb = () => {
    if (!ta) { aiCopy(p); return; }
    const ro = ta.readOnly; ta.readOnly = true;   // tanpa papan ketik saat dipilih
    let done = false;
    try { ta.focus({ preventScroll: true }); ta.select(); ta.setSelectionRange(0, ta.value.length); done = document.execCommand('copy'); } catch (e) { /* abaikan */ }
    if (done) { ta.readOnly = ro; ok(); return; }
    ta.addEventListener('blur', () => { ta.readOnly = ro; }, { once: true });
    toast('Tidak bisa menyalin otomatis. Prompt sudah terpilih: ketuk Salin di menu yang muncul');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) { try { navigator.clipboard.writeText(p).then(ok, fb); } catch (e) { fb(); } } else fb();
}
QACT.dplImgCopy = b => { const id = b.dataset.id, g = dplLib().find(x => x.id === id); if (!g) return false; const ta = $('#dplImgP-' + id); const p = (ta ? ta.value : dplImgPrompt(g)).trim().slice(0, 2000); if (!p) { toast('Prompt kosong'); return false; } dplImg.prompt[id] = p; dplImgCopyNow(id, p); return true; };
QACT.dplImgGem = (b, ev) => { QACT.dplImgCopy(b); };   // salin dulu; tautan tetap terbuka sendiri (tanpa preventDefault)

QACT.dplImgRst = b => { const id = b.dataset.id; if (!dplLib().some(g => g.id === id)) return; delete dplImg.prompt[id]; delete dplImg.err[id]; dplRefreshList(); dplFocus('dplimg-' + id); };
document.addEventListener('input', ev => { const t = ev.target, i = t && typeof t.id === 'string' ? t.id : ''; if (i.indexOf('dplImgP-') === 0) dplImg.prompt[i.slice(8)] = t.value; else if (i.indexOf('dplImgM-') === 0) dplImg.model = t.value; });
/* ===== STL-1a-end ===== */
/* ===== HR-1-begin (17 Nov 2026): Dapper > Hari ini, kartu 1: PENGINGAT JUMAT (pakaian dan penampilan). HANYA MEMBACA data Sunnah di Ibadah (satu sumber, tidak digandakan); tidak ada data baru, tanpa penyimpanan, tanpa AI, tidak ikut cadangan JSON. Membalik: hapus blok HR-1 (dan CSS .hr-*). ===== */
const HR_JUMAT_IDS = ['sn-jmandi', 'sn-putih', 'sn-rapi'];   // id sunnah di Ibadah (IBX_SUN); id yang tidak ada dilewati
const HR_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], HR_BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HR_SOON = [['Tombol "Pakai saran ini" yang mengisi catatan pakaian', 'HR-4c']];   // butir yang belum dikerjakan; tiap tahap selesai mengurangi daftar ini
function hrJumatInfo(iso) {   // iso = 'YYYY-MM-DD' (tanggal setempat) -> { dow, ke (0 = hari ini Jumat, sampai 6), iso Jumat itu, label } atau null bila tanggal tidak sah
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso)); if (!m) return null;
  const y = +m[1], mo = +m[2], da = +m[3], d = new Date(y, mo - 1, da, 12);
  if (isNaN(d.getTime()) || d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  const ke = (5 - d.getDay() + 7) % 7, f = new Date(y, mo - 1, da + ke, 12), p2 = n => (n < 10 ? '0' : '') + n;
  return { dow: d.getDay(), ke: ke, iso: f.getFullYear() + '-' + p2(f.getMonth() + 1) + '-' + p2(f.getDate()), label: 'Jumat, ' + f.getDate() + ' ' + HR_BLN[f.getMonth()] + ' ' + f.getFullYear() };
}
function hrJumatHtml(iso, sun, has) {   // sun = daftar sunnah (IBX_SUN), has(id) = sudah dicatat di Ibadah hari ini
  const info = hrJumatInfo(iso); if (!info) return '';
  const rows = HR_JUMAT_IDS.map(id => (sun || []).find(s => s && s.id === id)).filter(Boolean);
  const badge = info.ke === 0 ? 'Hari ini' : info.ke === 1 ? 'Besok' : info.ke + ' hari lagi';
  const lead = info.ke === 0 ? 'Hari ini Jumat. Sebelum berangkat, ingat pakaian dan penampilan berikut.' : 'Jumat berikutnya: ' + (info.ke === 1 ? 'besok, ' : '') + info.label + (info.ke === 1 ? '' : ' (' + info.ke + ' hari lagi') + (info.ke === 1 ? '' : ')') + '. Bisa disiapkan dari sekarang.';
  const list = rows.length ? '<ul class="hr-ul">' + rows.map(s => '<li class="hr-it"><div class="hr-t"><b>' + esc(s.t) + '</b>' + (info.ke === 0 && has && has(s.id) ? '<span class="hr-ok">Sudah dicatat di Ibadah hari ini</span>' : '') + '</div><p>' + esc(s.p) + '</p><button class="hr-lnk" data-q="hrSn" data-id="' + esc(s.id) + '" data-fk="hrsn-' + esc(s.id) + '">Lihat dalil dan sumbernya &rsaquo;</button></li>').join('') + '</ul>' : '<p class="nw-p">Data Sunnah belum tersedia.</p>';
  return '<section class="nw-card hr-card" id="hrJumat" aria-label="Pengingat Jumat"><div class="nw-hd"><h3>Pengingat Jumat</h3><span class="nw-soon">' + esc(badge) + '</span></div><p class="nw-p">' + esc(lead) + '</p>' + list +
    '<p class="nw-fine">Isi diambil dari Ibadah &gt; Sunnah (satu sumber); dalil, derajat hadits, dan catatannya ada di sana. Butir sunnah itu ditulis dari pengetahuan penyusun dan belum dicocokkan dengan kitab cetak. Ini pengingat, bukan fatwa.</p></section>';
}
function hrSoonHtml() {
  if (!HR_SOON.length) return '';
  return '<section class="nw-card" id="hrSoon"><div class="nw-hd"><h3>Menyusul di tab ini</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + HR_SOON.map(x => '<li>' + esc(x[0]) + ' <span class="hr-tg">(' + esc(x[1]) + ')</span></li>').join('') + '</ul><p class="nw-fine">Tab Hari ini dikerjakan bertahap, satu kartu per tahap (HR-1 sampai HR-4).</p></section>';
}
function hrHtml() { return hrWxHtml(hrWxCtx(), HR_WXD()) + hrJumatHtml(today(), IBX_SUN, id => ibxSnHas(today(), id)) + odCardHtml(odCtx()) + hrSoonHtml(); }
function hrMount() { const root = $('#nwDapperBody'), card = root && root.querySelector('.nw-card'); if (!card) return; const w = document.createElement('div'); w.id = 'hrWrap'; w.innerHTML = hrHtml(); card.replaceWith(w); }
{ const baseNwHr = nwRender; nwRender = function (key) { baseNwHr.apply(this, arguments); if (key === 'dapper' && nwTab.dapper === 'hari') hrMount(); }; }
document.addEventListener('visibilitychange', () => { if (!document.hidden && curView === 'dapper' && nwTab.dapper === 'hari') nwRender('dapper'); });   // lewat tengah malam: hitungan hari Jumat ikut baru
QACT.hrSn = b => { const id = b && b.dataset ? b.dataset.id : ''; if (!HR_JUMAT_IDS.includes(id) || !IBX_SUN.some(s => s.id === id)) return; showView('ibadah'); QACT.ibxSnGo({ dataset: { id: id } }); };
/* ===== HR-1-end ===== */
/* ===== HR-2-begin (17 Nov 2026): Dapper > Hari ini, kartu 2: CUACA HARI INI + SARAN LAPISAN PAKAIAN. Membaca cuaca Beranda (wxView, satu sumber, tidak digandakan); aturan lokal tanpa AI; tidak ada data baru dan tidak ikut cadangan JSON. Jaringan hanya lewat wxFetch milik Beranda (Open-Meteo) dan hanya bila cuaca dinyalakan dan sudah waktunya. Membalik: hapus blok HR-2 dan CSS .hr-now/.hr-sub/.hr-ex/.hr-btn, lalu pulihkan HR_SOON dan hrHtml seperti HR-1. ===== */
const HR_BAND = [[33, 'panas2', 'Sangat panas'], [29, 'panas', 'Panas'], [25, 'hangat', 'Hangat'], [20, 'sejuk', 'Sejuk'], [14, 'dingin', 'Dingin'], [-Infinity, 'dingin2', 'Sangat dingin']];   // [batas bawah suhu terasa (derajat C), id, label]; ambang ditetapkan penyusun
const HR_LK = ['Lapisan dasar', 'Lapisan tengah', 'Lapisan luar'];
const HR_LAPIS = {
  panas2: ['Kaos atau kemeja tipis dari katun atau linen, warna terang, potongan longgar.', 'Tidak perlu.', 'Tidak perlu. Bawa lapisan tipis hanya bila akan lama di ruangan ber-AC.'],
  panas: ['Kaos atau kemeja katun atau linen yang menyerap keringat.', 'Tidak perlu.', 'Tidak perlu. Lapisan tipis opsional untuk ruangan ber-AC.'],
  hangat: ['Kaos atau kemeja tipis, lengan pendek atau panjang.', 'Tidak perlu.', 'Opsional: kemeja atau kardigan tipis untuk ruangan ber-AC atau malam hari.'],
  sejuk: ['Kaos atau kemeja.', 'Kardigan, hoodie tipis, atau kemeja flanel.', 'Opsional: jaket tipis bila lama di luar ruangan.'],
  dingin: ['Kaos lengan panjang.', 'Sweater atau hoodie.', 'Jaket.'],
  dingin2: ['Lapisan dasar lengan panjang yang hangat.', 'Sweater tebal atau fleece.', 'Jaket tebal atau anti angin; tambah penutup kepala, syal, dan sarung tangan.']
};
const hrFin = x => typeof x === 'number' && isFinite(x);
function hrWxSaran(w) {   // w = { t, ap, rh, ws, kind, day, tmin, tmax, popHari, popJam } -> { rasa, band, label, lapis: [{k, v} x3], tambah: [{id, t}] } atau null bila suhu tidak sah
  if (!w || !hrFin(w.t)) return null;
  const rasa = hrFin(w.ap) ? w.ap : w.t, b = HR_BAND.find(x => rasa >= x[0]);
  const pops = [w.popHari, w.popJam].filter(hrFin), pop = pops.length ? Math.max.apply(null, pops) : null, ex = [];
  if (w.kind === 'storm') ex.push({ id: 'badai', t: 'Ada badai petir. Bila bisa, tunda keluar rumah sampai reda, dan siapkan jas hujan.' });
  else if (w.kind === 'rain' || (pop != null && pop >= 60)) ex.push({ id: 'hujan', t: (w.kind === 'rain' ? 'Sedang hujan atau gerimis.' : 'Peluang hujan tinggi (' + Math.round(pop) + '%).') + ' Bawa jas hujan atau payung; pilih alas kaki yang tahan basah dan bahan yang cepat kering.' });
  else if (pop != null && pop >= 30) ex.push({ id: 'payung', t: 'Ada peluang hujan (' + Math.round(pop) + '%). Taruh payung lipat atau jas hujan tipis di tas.' });
  if (hrFin(w.ws) && w.ws >= 30) ex.push({ id: 'angin', t: 'Angin cukup kencang (' + Math.round(w.ws) + ' km/jam). Pilih jaket anti angin dan hindari topi yang mudah terbang.' });
  if (hrFin(w.rh) && w.rh >= 80 && rasa >= 26) ex.push({ id: 'lembap', t: 'Udara lembap (' + Math.round(w.rh) + '%). Pilih bahan yang menyerap keringat dan cepat kering; bawa baju cadangan bila perjalanan jauh.' });
  if ((w.kind === 'clear' || w.kind === 'few') && w.day === 1 && w.t >= 30) ex.push({ id: 'matahari', t: 'Cerah dan panas. Pakai topi atau pelindung matahari bila lama di luar (indeks UV tidak tersedia di data ini).' });
  if (hrFin(w.tmin) && hrFin(w.tmax) && w.tmax - w.tmin >= 8) ex.push({ id: 'selisih', t: 'Selisih suhu hari ini besar. Pilih lapisan yang mudah dilepas dan dipakai lagi.' });
  if (w.kind === 'fog') ex.push({ id: 'kabut', t: 'Berkabut. Bila berjalan atau bersepeda di jalan, pilih warna yang terlihat jelas.' });
  if (w.kind === 'snow') ex.push({ id: 'salju', t: 'Ada salju. Tambah satu lapisan dan pilih alas kaki yang tidak licin.' });
  return { rasa: rasa, band: b[1], label: b[2], lapis: HR_LK.map((k, i) => ({ k: k, v: HR_LAPIS[b[1]][i] })), tambah: ex };
}
function hrWxFrom(v, info) {   // hasil wxView -> masukan hrWxSaran; null bila bentuknya tidak lengkap
  if (!v || !v.c || !v.c.n || !v.d) return null;
  const n = v.c.n, d = v.d, pj = (v.hrs || []).map(r => r[2]).filter(hrFin);
  return { t: n.t, ap: n.ap, rh: n.rh, ws: n.ws, kind: info(n.code).k, day: n.day, tmin: d[2], tmax: d[1], popHari: d[3], popJam: pj.length ? Math.max.apply(null, pj) : null };
}
function hrWxHtml(c, D) {   // c = { on, has, name, v, busy, err, stamp, ago }; D = { info, T } (milik modul cuaca Beranda)
  const open = '<section class="nw-card hr-card" id="hrCuaca" aria-label="Cuaca hari ini dan saran lapisan pakaian">', head = b => '<div class="nw-hd"><h3>Cuaca hari ini dan lapisan pakaian</h3>' + (b ? '<span class="nw-soon">' + esc(b) + '</span>' : '') + '</div>';
  const btn = lb => '<button class="btn sm hr-btn" data-q="hrWxRef" data-fk="hrwx-ref" aria-disabled="' + !!c.busy + '">' + (c.busy ? 'Memperbarui…' : lb) + '</button>';
  if (!c.on) return open + head('') + '<p class="nw-p">Prakiraan cuaca sedang dimatikan, jadi saran lapisan tidak bisa dibuat. Nyalakan lewat pengaturan lokasi dan cuaca (tombol "Tampilkan cuaca").</p><button class="btn sm hr-btn" data-q="hxLoc" data-fk="hrwx-loc">Buka pengaturan cuaca</button></section>';
  if (!c.has) return open + head('') + '<p class="nw-p">Lokasi belum diatur, jadi cuaca belum bisa dimuat. Atur lokasi sekali, lalu saran lapisan muncul di sini.</p><button class="btn sm hr-btn" data-q="hxLoc" data-fk="hrwx-loc">Atur lokasi</button></section>';
  if (!c.v) return open + head('') + '<p class="nw-p">' + (c.busy || !c.err ? 'Memuat cuaca…' : esc(c.err)) + '</p><p class="nw-fine">Saran lapisan baru muncul setelah data cuaca terbaca; tidak ada tebakan tanpa data.</p>' + btn('Muat cuaca') + '</section>';
  const a = hrWxFrom(c.v, D.info), s = hrWxSaran(a);
  if (!a || !s) return open + head('') + '<p class="nw-p">Data cuaca tidak bisa dibaca, jadi saran lapisan tidak dibuat.</p>' + btn('Muat ulang cuaca') + '</section>';
  const inf = D.info(c.v.c.n.code), feel = hrFin(a.ap) && Math.abs(a.ap - a.t) >= 2 ? ' · terasa ' + D.T(a.ap) : '';
  const sub = 'Hari ini ' + D.T(a.tmin) + ' sampai ' + D.T(a.tmax) + (hrFin(a.popHari) ? ' · peluang hujan ' + Math.round(a.popHari) + '%' : '');
  return open + head(s.label) +
    '<p class="hr-now"><b>' + esc(D.T(a.t)) + '</b><span>' + esc(inf.l + feel + (c.name ? ' · ' + c.name : '')) + '</span></p><p class="hr-sub">' + esc(sub) + '</p>' +
    (c.v.stale ? '<p class="hr-sub">Data pukul ' + esc(c.stamp) + ' (' + esc(c.ago) + '). Belum diperbarui.</p>' : '') +
    (c.err ? '<p class="hr-sub">Pembaruan terakhir gagal. ' + esc(c.err) + '</p>' : '') +
    '<ul class="hr-ul" aria-label="Saran lapisan pakaian">' + s.lapis.map(l => '<li class="hr-it"><div class="hr-t"><b>' + esc(l.k) + '</b></div><p>' + esc(l.v) + '</p></li>').join('') + '</ul>' +
    (s.tambah.length ? '<ul class="hr-ex" aria-label="Tambahan menurut cuaca">' + s.tambah.map(x => '<li data-id="' + x.id + '">' + esc(x.t) + '</li>').join('') + '</ul>' : '') +
    '<p class="nw-fine">Sumber: Open-Meteo.com (data pukul ' + esc(c.stamp) + ', ' + esc(c.ago) + '). Saran memakai suhu terasa, peluang hujan, angin, dan kelembapan; ambang ditetapkan penyusun untuk iklim hangat, bukan hasil penelitian, jadi sesuaikan dengan tubuh Anda. Indeks UV tidak tersedia.</p>' + btn('Perbarui cuaca') + '</section>';
}
const HR_WXD = () => ({ info: wxInfo, T: wxT });
function hrWxCtx() {
  const now = Date.now(), on = !!xdb.on, has = hxHas(), v = on && has ? wxView(now) : null;
  let stamp = '', ago = '';
  if (v) { const tz = v.tz; stamp = hxHM(v.c.at, tz) + (tz !== -new Date(now).getTimezoneOffset() / 60 ? ' ' + hxTzName(tz) : ''); ago = wxAgo(now - v.c.at); }
  return { on: on, has: has, name: has ? ldb.name : '', v: v, busy: wxBusy, err: wxErr ? wxMsg(wxErr) : '', stamp: stamp, ago: ago };
}
function hrWxRefresh() {   // ganti HANYA kartu cuaca (tanpa menyusun ulang seluruh halaman)
  if (curView !== 'dapper' || nwTab.dapper !== 'hari') return;
  const el = $('#hrCuaca'); if (!el) return;
  const ae = document.activeElement, fk = ae && ae.dataset && el.contains(ae) ? ae.dataset.fk : null, t = document.createElement('div');
  t.innerHTML = hrWxHtml(hrWxCtx(), HR_WXD()); const n = t.firstElementChild; if (!n) return;
  el.replaceWith(n);
  if (fk) { const b = n.querySelector('[data-fk="' + fk + '"]'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
function hrWxKick() { if (!wxDue(Date.now())) return; const p = wxFetch(); hrWxRefresh(); p.then(hrWxRefresh, hrWxRefresh); }   // data kosong atau sudah waktunya: ambil lewat modul Beranda
{ const baseNwHr2 = nwRender; nwRender = function (key) { baseNwHr2.apply(this, arguments); if (key === 'dapper' && nwTab.dapper === 'hari') hrWxKick(); }; }
{ const baseRh = renderHome; renderHome = function () { const r = baseRh.apply(this, arguments); if (curView === 'dapper' && nwTab.dapper === 'hari') { hrWxRefresh(); hrWxKick(); } return r; }; }   // lokasi atau saklar cuaca diubah dari sheet Lokasi
QACT.hrWxRef = () => { if (wxBusy || !xdb.on || !hxHas()) return; wxRetryAt = 0; wxFails = 0; const p = wxFetch(); hrWxRefresh(); p.then(hrWxRefresh, hrWxRefresh); };
/* ===== HR-2-end ===== */
/* ===== HR-3a-begin (17 Nov 2026): Dapper > Hari ini, kartu 3 (catatan pakaian hari ini / OOTD), BAGIAN a: TOKO DATA saja, belum ada tampilan. Kunci simpan baru `dailylog:ootd:v1` (satu catatan per tanggal: pilihan cepat + catatan teks, tanpa foto). Belum ikut cadangan JSON dan sinkron (itu HR-3c). Membalik: hapus blok HR-3a dan panggilan `odWipe();` di actWipe. ===== */
const OD_KEY = 'dailylog:ootd:v1', OD_MAX_DAYS = 120, OD_NOTE = 200, OD_MAX_PICK = 12;
const OD_GRP = [
  ['atas', 'Atasan', [['kaos', 'Kaos'], ['kemeja', 'Kemeja'], ['polo', 'Polo'], ['batik', 'Batik'], ['koko', 'Baju koko'], ['hoodie', 'Hoodie'], ['jaket', 'Jaket']]],
  ['bawah', 'Bawahan', [['panjang', 'Celana panjang'], ['jeans', 'Jeans'], ['pendek', 'Celana pendek'], ['sarung', 'Sarung'], ['olahraga', 'Celana olahraga']]],
  ['kaki', 'Alas kaki', [['sepatu', 'Sepatu'], ['sandal', 'Sandal'], ['sandalg', 'Sandal gunung']]],
  ['lain', 'Tambahan', [['topi', 'Topi'], ['peci', 'Peci'], ['jam', 'Jam tangan'], ['kacamata', 'Kacamata'], ['tas', 'Tas']]]
];
const OD_ITEMS = []; OD_GRP.forEach(g => g[2].forEach(x => OD_ITEMS.push([g[0] + '-' + x[0], x[1], g[0]])));   // [id, label, grup]
const OD_IDX = new Map(OD_ITEMS.map((x, i) => [x[0], i]));
function odIso(s) {   // tanggal kalender sah 'YYYY-MM-DD' (2000..2100)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : ''); if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3]; if (y < 2000 || y > 2100) return false;
  const t = new Date(Date.UTC(y, mo - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}
const odU = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(Math.min(v, 8.64e15)) : 0);
function odPicks(a) { const s = new Set(); (Array.isArray(a) ? a : []).slice(0, 60).forEach(x => { if (typeof x === 'string' && OD_IDX.has(x)) s.add(x); }); return Array.from(s).sort((p, q) => OD_IDX.get(p) - OD_IDX.get(q)).slice(0, OD_MAX_PICK); }
function odNote(v) { return (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, OD_NOTE).trim(); }
const odBlank = () => ({ days: {}, del: [], u: 0 });
function odTrim(db) {   // simpan OD_MAX_DAYS tanggal terbaru; nisan hapus juga dibatasi
  const ks = Object.keys(db.days).sort().reverse();
  ks.slice(OD_MAX_DAYS).forEach(k => { delete db.days[k]; });
  db.del = db.del.slice().sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0)).slice(0, OD_MAX_DAYS);
  return db;
}
function odClean(raw) {
  const o = odBlank(); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  const dd = raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  Object.keys(dd).slice(0, 2000).forEach(k => {
    if (!odIso(k)) return; const r = dd[k]; if (!r || typeof r !== 'object' || Array.isArray(r)) return;
    const p = odPicks(r.p), n = odNote(r.n); if (!p.length && !n) return;
    o.days[k] = { p: p, n: n, u: odU(r.u) };
  });
  const seen = new Set();
  (Array.isArray(raw.del) ? raw.del : []).slice(0, 500).forEach(x => {
    if (!Array.isArray(x) || !odIso(x[0]) || seen.has(x[0])) return; const u = odU(x[1]); if (!u) return;
    if (o.days[x[0]] && o.days[x[0]].u >= u) return;   // catatan yang lebih baru menang atas nisan
    if (o.days[x[0]]) delete o.days[x[0]];             // nisan lebih baru menang atas catatan
    seen.add(x[0]); o.del.push([x[0], u]);
  });
  o.u = odU(raw.u); return odTrim(o);
}
function odPut(db, iso, picks, note, todayIso, now) {   // -> 'ok' | 'tanggal' | 'depan' | 'kosong' | 'lama'; mengubah db hanya bila 'ok'
  if (!odIso(iso)) return 'tanggal'; if (odIso(todayIso) && iso > todayIso) return 'depan';
  const p = odPicks(picks), n = odNote(note); if (!p.length && !n) return 'kosong';
  const ks = Object.keys(db.days).sort(); if (!db.days[iso] && ks.length >= OD_MAX_DAYS && iso < ks[0]) return 'lama';
  const u = Math.max(odU(now) || 1, db.u + 1);
  db.days[iso] = { p: p, n: n, u: u }; db.del = db.del.filter(x => x[0] !== iso); db.u = u; odTrim(db); return 'ok';
}
function odRemove(db, iso, now) {   // -> true bila ada yang dihapus; nisan dicatat untuk HR-3c
  if (!odIso(iso) || !db.days[iso]) return false;
  const u = Math.max(odU(now) || 1, db.u + 1);
  delete db.days[iso]; db.del = db.del.filter(x => x[0] !== iso).concat([[iso, u]]); db.u = u; odTrim(db); return true;
}
const odGet = (db, iso) => (odIso(iso) && db.days[iso] ? { p: db.days[iso].p.slice(), n: db.days[iso].n, u: db.days[iso].u } : null);
const odLabel = id => { const i = OD_IDX.get(id); return i == null ? '' : OD_ITEMS[i][1]; };
function odMergeLoaded(mem, l) {   // data tersimpan (l) digabung ke memori (mem) yang sempat diubah sebelum pemuatan selesai; memori menang
  Object.keys(l.days).forEach(k => { const tb = mem.del.find(x => x[0] === k); if (!mem.days[k] && !(tb && tb[1] >= l.days[k].u)) mem.days[k] = l.days[k]; });
  l.del.forEach(x => { if (!mem.del.some(y => y[0] === x[0]) && !mem.days[x[0]]) mem.del.push(x); });
  mem.u = Math.max(mem.u, l.u); return odTrim(mem);
}
const OD = { ready: false, loading: false, p: null, db: odBlank() };
STORES.od = { key: OD_KEY, get: () => ({ v: 1, days: OD.db.days, del: OD.db.del, u: OD.db.u }) }; dirty.od = false;   // ikut cadangan JSON dan sinkron lewat extra.ootd (HR-3c)
function odLoad0() {
  OD.loading = true;
  return Promise.race([store.load(OD_KEY), new Promise(r => setTimeout(() => r(null), 4000))]).then(raw => {
    const l = odClean(raw); if (OD.db.u > 0) odMergeLoaded(OD.db, l); else OD.db = l;
  }).catch(() => { /* data rusak: mulai kosong */ }).then(() => { OD.loading = false; OD.ready = true; });
}
function odLoad() { if (!OD.p) OD.p = odLoad0(); return OD.p; }
function odSave() { dirty.od = true; queueSave('od'); }
function odWipe() { OD.db = odBlank(); OD.ready = true; OD.loading = false; if (!OD.p) OD.p = Promise.resolve(); }   // dipanggil "Hapus semua data"
window.DL = Object.freeze(Object.assign({}, window.DL, { hr3a: Object.freeze({ load: odLoad, save: odSave, put: (iso, p, n) => odPut(OD.db, iso, p, n, today(), Date.now()), remove: iso => odRemove(OD.db, iso, Date.now()), get: iso => odGet(OD.db, iso), state: () => ({ ready: OD.ready, days: Object.keys(OD.db.days).length, del: OD.db.del.length, u: OD.db.u, dirty: dirty.od }), clean: odClean, items: OD_ITEMS.map(x => x.slice()) }) }));   // pegangan uji (pola DL.b..a)
