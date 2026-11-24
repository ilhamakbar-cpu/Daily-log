/* ===== MODUL: LEVEL OTOMATIS + SKOR RUBRIK (tahap 76b-1) ===== */
// Fase 2 (rancangan Word): syarat naik level dari take, skor rubrik 1-5 (kejelasan, energi, tempo, ekspresi, keaslian).
// Level resmi `spDb.lv`; level yang dipilih di layar (`spV.lv`) boleh lebih rendah (latihan ringan, tidak mengurangi progres) atau lebih tinggi (mencoba).
// Energi, tempo, dan ekspresi dihitung otomatis dari analisis; kejelasan dan keaslian dinilai sendiri. Nilai sendiri menimpa nilai otomatis.
const SP_RB = [['k', 'Kejelasan', 'Seberapa jelas pesanmu dipahami?'], ['e', 'Energi', 'Variasi volume suaramu'], ['t', 'Tempo', 'Kecepatan bicara'], ['x', 'Ekspresi', 'Variasi nada suaramu'], ['a', 'Keaslian', 'Terdengar seperti suaramu sendiri?']];
const SP_UP = {
  1: { n: 5, txt: '5 take berturut-turut dengan durasi dalam ±3 detik dari target', ok: t => Math.abs(t.sec - t.tgt) <= 3 },
  2: { n: 5, txt: '5 take berturut-turut dengan kata isian di bawah 3 per menit (butuh transkrip)', ok: t => { const f = spPerMin(t); return f == null ? null : f < 3; } },
  3: { n: 5, txt: '5 take berturut-turut dengan skor kejelasan dan keaslian minimal 4 dari 5 (nilai sendiri)', ok: t => { const r = spRbEff(t); return r.k && r.a ? (r.k.v >= 4 && r.a.v >= 4) : null; } }
};
function spRbAuto(t) {   // patokan kasar dari angka analisis; ambang adalah tebakan awal
  const o = {};
  if (t.wpm != null && t.src !== 'skrip') { const w = t.wpm; o.t = (w >= 130 && w <= 175) ? 5 : (w >= 115 && w <= 190) ? 4 : (w >= 100 && w <= 210) ? 3 : (w >= 85 && w <= 230) ? 2 : 1; }
  if (t.pt != null) o.x = t.pt < 1.2 ? 1 : t.pt < 1.8 ? 2 : t.pt < 2.5 ? 3 : t.pt < 3.2 ? 4 : 5;
  if (t.vs != null) o.e = t.vs < 4 ? 1 : t.vs < 6 ? 2 : t.vs < 8 ? 3 : t.vs < 10 ? 4 : 5;
  return o;
}
function spRbEff(t) {
  const a = spRbAuto(t), r = {};
  SP_RB.forEach(x => { const k = x[0], u = t.rb && t.rb[k]; if (u) r[k] = { v: u, au: false }; else if (a[k]) r[k] = { v: a[k], au: true }; });
  return r;
}
function spRbMean(t) { const r = spRbEff(t), v = Object.keys(r).map(k => r[k].v); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
function spStreak(L) {   // take terbaru dulu; yang tidak bisa dinilai dilewati (tidak menghitung, tidak memutus); satu yang gagal memutus
  const rule = SP_UP[L]; if (!rule) return { n: 0, need: 0 };
  let n = 0;
  for (const t of spDb.tk) { if (t.lv !== L) continue; const ok = rule.ok(t); if (ok === null) continue; if (!ok) break; n++; if (n >= rule.n) break; }
  return { n, need: rule.n };
}
function spCheckLevel() {
  const L = spDb.lv; if (L >= 4) return false;
  const s = spStreak(L); if (s.n < s.need) return false;
  spDb.lv = L + 1; spDb.u = Date.now(); queueSave('sp');
  if (spV.lv === L) spV.lv = L + 1;
  spV.up = 'Naik ke level ' + (L + 1) + ' ' + SP_LV[L][1] + '. Syarat level ' + L + ' tercapai.';
  toast('Naik ke level ' + (L + 1) + ': ' + SP_LV[L][1]);
  return true;
}
function spLvHTML() {
  const L = spDb.lv, rule = SP_UP[L], s = spStreak(L), sel = spV.lv, off = spV.rec || spV.busy ? ' disabled' : '';
  const dots = rule ? '<div class="spdots" role="img" aria-label="Progres naik level: ' + s.n + ' dari ' + rule.n + '">' + Array.from({ length: rule.n }, (_, i) => '<i class="' + (i < s.n ? 'on' : '') + '"></i>').join('') + '</div>' : '';
  let extra = '';
  if (sel > L) extra = '<p>Kamu sedang mencoba level ' + sel + '. Level resminya tetap ' + L + ' sampai syarat tercapai.</p><div class="tkact"><button class="btn sm" data-q="spLvUp" data-v="' + sel + '"' + off + '>Jadikan level ' + sel + ' resmi</button></div>';
  else if (sel < L) extra = '<p>Latihan ringan di level ' + sel + ' tidak mengurangi progres level ' + L + '.</p>';
  return '<div class="splv" id="spLvCard"><h3>Level resmi: ' + L + ' ' + esc(SP_LV[L - 1][1]) + '</h3>' + (spV.up ? '<p class="ok">' + esc(spV.up) + '</p>' : '') +
    (rule ? '<p>Syarat naik: ' + esc(rule.txt) + '. Progres ' + s.n + ' dari ' + rule.n + '.</p>' + dots : '<p>Level tertinggi. Tidak ada batas atas: lanjutkan tantangan impromptu harian.</p>') + extra + '</div>';
}
function spRbHTML(t) {
  const eff = spRbEff(t), m = spRbMean(t);
  const rows = SP_RB.map(x => {
    const k = x[0], e = eff[k], b = [1, 2, 3, 4, 5].map(v => '<button class="' + (e && e.au && e.v === v ? 'au' : '') + '" data-q="spRb" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + !!(e && e.v === v) + '" aria-label="' + x[1] + ' ' + v + ' dari 5">' + v + '</button>').join('');
    return '<div class="rr"><span><b>' + x[1] + '</b><small>' + (e ? (e.au ? 'otomatis ' + e.v : 'nilaimu ' + e.v) : 'belum dinilai') + '</small></span><div role="group" aria-label="' + x[1] + '">' + b + '</div></div>';
  }).join('');
  return '<div class="sprb"><div class="lbl">Skor rubrik <small>' + (m != null ? 'rata-rata ' + fmt(m, 1) + ' dari 5' : 'ketuk untuk menilai') + '</small></div>' + rows + '<p class="note">Energi, tempo, dan ekspresi dihitung kasar dari audio (garis putus = otomatis). Kejelasan dan keaslian kamu yang menilai. Ketuk lagi untuk menghapus nilaimu.</p></div>';
}
QACT.spRb = el => {
  const t = spDb.tk.find(x => x.id === spV.cur); if (!t) return;
  const k = el.dataset.k, v = Number(el.dataset.v); if (!SP_RB.some(x => x[0] === k) || !(v >= 1 && v <= 5)) return;
  t.rb = t.rb || {}; if (t.rb[k] === v) delete t.rb[k]; else t.rb[k] = v; t.e = Date.now();
  spDb.u = Date.now(); queueSave('sp'); spCheckLevel(); spPaint(); spFocus('[data-q="spRb"][data-k="' + k + '"][data-v="' + v + '"]');
};
QACT.spLvUp = el => { const v = Number(el.dataset.v); if (![2, 3, 4].includes(v) || v <= spDb.lv || spV.rec || spV.busy) return; spDb.lv = v; spDb.u = Date.now(); queueSave('sp'); spV.up = 'Level resmi sekarang ' + v + ' ' + SP_LV[v - 1][1] + ' (dinaikkan manual).'; spPaint(); };

/* ===== MODUL: BASELINE + GRAFIK MINGGUAN (tahap 76b-2) ===== */
// Fase 2 (rancangan Word): "Rekaman baseline: perkenalan 30 detik di hari pertama, dibandingkan berdampingan pada hari ke-30, 60, dan seterusnya"
// dan "Grafik progres mingguan menampilkan filler, tempo, dan kepercayaan diri". Baseline disimpan terpisah (`spDb.bl`, maks 12) agar tidak
// ikut hitungan level, riwayat take, atau kalibrasi kecepatan. Grafik mingguan: 8 pekan (Senin-Minggu) dari take latihan, tidak dari baseline.
const spMon = s => addDays(s, -((pd(s).getDay() + 6) % 7));
const spMean = a => a.reduce((x, y) => x + y, 0) / a.length;
function spWeeks(n) { const cur = spMon(today()), out = []; for (let i = n - 1; i >= 0; i--) out.push(addDays(cur, -7 * i)); return out; }
function spWkData(n) {
  const wk = spWeeks(n), idx = {}; wk.forEach((k, i) => { idx[k] = i; });
  const A = wk.map(() => ({ fl: 0, min: 0, w: [], r: [], n: 0 }));
  spDb.tk.forEach(t => {
    const i = idx[spMon(t.d)]; if (i == null) return; const a = A[i]; a.n++;
    if (t.fl != null && t.sec && (t.src === 'stt' || t.src === 'tulis')) { a.fl += t.fl; a.min += t.sec / 60; }
    if (t.wpm != null && t.src !== 'skrip') a.w.push(t.wpm);
    const m = spRbMean(t); if (m != null) a.r.push(m);
  });
  return wk.map((k, i) => ({ k, n: A[i].n, fl: A[i].min ? A[i].fl / A[i].min : null, wpm: A[i].w.length ? spMean(A[i].w) : null, rb: A[i].r.length ? spMean(A[i].r) : null }));
}
const SP_WK = [['fl', 'Kata isian per menit', 'makin rendah makin baik', 6, v => fmt(v, 1)], ['wpm', 'Tempo (kata per menit)', 'sasaran sekitar 130 sampai 175', 220, v => fmt(v, 0)], ['rb', 'Kepercayaan diri (rata-rata skor rubrik)', 'dari 1 sampai 5', 5, v => fmt(v, 1)]];
function spWkHTML() {
  const d = spWkData(8);
  if (!d.some(x => x.fl != null || x.wpm != null || x.rb != null)) return '<section class="sec spwk"><div class="lbl">Progres mingguan</div><p class="note">Grafik muncul sesudah take pertama yang punya transkrip atau skor rubrik.</p></section>';
  const one = c => {
    const k = c[0], mx = Math.max(c[3], ...d.map(x => x[k] || 0)), last = d[d.length - 1][k], prev = d[d.length - 2][k];
    const bars = d.map((x, i) => '<i class="' + (x[k] == null ? 'nil' : i === d.length - 1 ? 'cur' : '') + '" style="height:' + (x[k] == null ? 2 : Math.max(4, Math.round(x[k] / mx * 100))) + '%"></i>').join('');
    const alt = d.map(x => shortDate(x.k) + ': ' + (x[k] == null ? 'belum ada' : c[4](x[k]))).join('; ');
    return '<div class="wk"><div class="wkh"><b>' + c[1] + '</b><span>' + (last != null ? c[4](last) : '–') + '</span></div><small>' + c[2] + (last != null && prev != null ? ' · pekan lalu ' + c[4](prev) : '') + '</small>' +
      '<div class="bars" role="img" aria-label="' + esc(c[1] + ' per pekan, 8 pekan terakhir. ' + alt) + '">' + bars + '</div><div class="axis"><span>' + shortDate(d[0].k) + '</span><span>pekan ini</span></div></div>';
  };
  return '<section class="sec spwk"><div class="lbl">Progres mingguan <small>8 pekan, dari take latihan</small></div>' + SP_WK.map(one).join('') +
    '<p class="note">Pekan dimulai Senin. Kata isian dan tempo butuh transkrip (Gemini atau tulisanmu). Belum terhubung ke Jurnal dan Peta.</p></section>';
}

/* --- rekaman baseline --- */
function spBlNext() {
  const bl = spDb.bl; if (!bl.length) return null;
  const first = bl[bl.length - 1], last = bl[0], dF = diffDays(first.d, today()), dL = diffDays(first.d, last.d), due = Math.floor(dF / 30) * 30;
  if (due >= 30 && dL < due) return { due: true, m: due, days: dF };
  const nx = (Math.floor(dF / 30) + 1) * 30; return { due: false, m: nx, left: nx - dF, days: dF };
}
function spBlRow(lbl, a, b, f, dir, dec) {
  let dl = '';
  if (b !== undefined && a != null && b != null) { const x = b - a; if (Math.abs(x) >= Math.pow(10, -dec) / 2) dl = '<small class="' + (dir === 0 ? '' : (dir * x > 0 ? 'ok' : 'bad')) + '">' + (x > 0 ? '+' : '−') + fmt(Math.abs(x), dec) + '</small>'; }
  return '<div class="r"><span>' + lbl + '</span><b>' + (a != null ? f(a) : '–') + '</b>' + (b === undefined ? '' : '<b>' + (b != null ? f(b) : '–') + dl + '</b>') + '</div>';
}
function spBlHTML() {
  const bl = spDb.bl, rec = !!spV.rec, busy = !!spV.busy, mine = spV.bl && (rec || busy);
  const btn = '<button class="btn' + (bl.length ? '' : ' primary') + '" data-q="spBl"' + (busy || (rec && !mine) ? ' disabled' : '') + '>' + (mine && rec ? 'Berhenti' : mine && busy ? 'Menganalisis…' : bl.length ? 'Rekam ulang baseline' : 'Rekam baseline 30 detik') + '</button>';
  if (!bl.length) return '<section class="sec spbl"><div class="lbl">Rekaman baseline</div><p class="note">Rekam perkenalan 30 detik sekarang: siapa kamu dan kenapa mulai vlog. Di hari ke-30, 60, dan seterusnya kamu rekam lagi dan hasilnya dibandingkan berdampingan. Rekamannya juga bahan konten transformasi. Hanya angka yang disimpan, bukan audionya.</p><div class="tkact">' + btn + '</div></section>';
  const first = bl[bl.length - 1], last = bl[0], two = bl.length > 1, nx = spBlNext();
  const pm = t => spPerMin(t);
  const rows = spBlRow('Kata per menit', first.wpm, two ? last.wpm : undefined, v => String(v), 0, 0) + spBlRow('Kata isian per menit', pm(first), two ? pm(last) : undefined, v => fmt(v, 1), -1, 1) +
    spBlRow('Jeda 0,6 dtk+', first.ps ? first.ps.n : null, two ? (last.ps ? last.ps.n : null) : undefined, v => String(v), -1, 0) + spBlRow('Variasi nada (semiton)', first.pt, two ? last.pt : undefined, v => fmt(v, 1), 1, 1) + spBlRow('Durasi (dtk)', first.sec, two ? last.sec : undefined, v => fmt(v, 0), 0, 0);
  const head = '<div class="r h"><span></span><b>' + (two ? 'Pertama<small>' + shortDate(first.d) + '</small>' : 'Baseline<small>' + shortDate(first.d) + '</small>') + '</b>' + (two ? '<b>Terbaru<small>' + shortDate(last.d) + '</small></b>' : '') + '</div>';
  const hint = nx.due ? '<p class="note bad">Sudah ' + nx.days + ' hari sejak baseline pertama: waktunya rekam ulang (patokan hari ke-' + nx.m + ').</p>' : '<p class="note">Rekam ulang berikutnya di hari ke-' + nx.m + ' (' + nx.left + ' hari lagi). Boleh kapan saja.</p>';
  const list = bl.map(t => '<div class="sprw"><span class="sptm">' + shortDate(t.d) + '</span><span>' + fmt(t.sec, 0) + ' dtk</span><span>' + (t.wpm != null ? t.wpm + ' kpm' : '–') + '</span><button class="btn sm ghost" data-q="spBlDel" data-id="' + t.id + '" aria-label="Hapus baseline ' + shortDate(t.d) + '">Hapus</button></div>').join('');
  return '<section class="sec spbl"><div class="lbl">Rekaman baseline <small>' + (two ? 'dibandingkan berdampingan' : 'satu rekaman') + '</small></div><div class="spcmp" role="table" aria-label="Perbandingan baseline">' + head + rows + '</div>' + hint + '<div class="tkact">' + btn + '</div>' + list + '</section>';
}
QACT.spBl = async () => {
  if (spV.rec && spV.bl) { spRecStop(); return; }
  if (spV.rec || spV.busy) return;
  spV.bl = true; spV.up = '';
  await spRecStart();
  if (!spV.rec) { spV.bl = false; spPaint(); }
};
QACT.spBlDel = el => {
  const id = el.dataset.id, i = spDb.bl.findIndex(x => x.id === id); if (i < 0) return;
  const t = spDb.bl.splice(i, 1)[0]; if (spV.bcur === id) spV.bcur = ''; spTombAdd(id); spDb.u = Date.now(); queueSave('sp'); spPaint();
  toast('Baseline dihapus', { label: 'Urungkan', fn: () => { if (!spDb.bl.some(x => x.id === t.id)) { t.e = Date.now(); spTombDrop(t.id); spDb.bl.push(t); spDb.bl.sort((a, b) => b.t - a.t); spDb.u = Date.now(); queueSave('sp'); spPaint(); } } });
};
async function spFeedBl(pcm, sr, text) { const au = spAudio(pcm, sr); return spSave({ lv: 4, sg: -1, tgt: 30, text: '', bl: true }, au, text || '', text ? 'stt' : '', pcm.length / sr); }

/* ===== MODUL: PUSTAKA HOOK, PENUTUP, DAN KERANGKA CERITA (tahap 76b-3) ===== */
// Fase 2 (rancangan Word): "Pustaka hook: angka, pertanyaan, pengakuan, tengah aksi, kontra-intuitif; hook dirotasi", "Pustaka kerangka cerita"
// (5 pola), "Variasi struktur: penutup tidak selalu Sampai ketemu di hari ke-X". Hook dan penutup berputar otomatis tiap hari (bisa dimatikan atau dipilih sendiri);
// kerangka cerita bersifat pilihan (disarankan menurut hari, tidak dipasang sendiri). Pilihan hanya berlaku untuk HARI INI (`spDb.lib`, khusus perangkat).
const SP_HK = [   // [id, nama, pembuat teks]; klasik = teks bawaan lama
  ['klasik', 'Klasik', null],
  ['angka', 'Angka', c => 'Hari ke-' + c.X + ', berat awal ' + c.w0 + ' kg' + (c.cw != null ? ', sekarang ' + c.cw + ' kg' : '') + '. Ini angkanya, apa adanya.'],
  ['tanya', 'Pertanyaan', c => 'Bisa turunin berat badan kalau ' + c.job + '? Hari ke-' + c.X + ', aku coba.'],
  ['akui', 'Pengakuan', c => 'Jujur, hari ke-' + c.X + ' ini aku [hampir nyerah karena apa?].'],
  ['aksi', 'Tengah aksi', c => 'Barusan aku [lagi ngapain?]. Hari ke-' + c.X + ', lanjut turunin berat badan dari ' + c.w0 + ' kg.'],
  ['kontra', 'Kontra-intuitif', c => 'Yang paling ngaruh di hari ke-' + c.X + ' bukan olahraganya, tapi [kebiasaan kecil apa?].']
];
const SP_CL = [
  ['klasik', 'Klasik', null],
  ['tanya', 'Pertanyaan', c => 'Menurutmu apa yang paling susah dijaga? Tulis di komentar ya.'],
  ['janji', 'Janji', c => 'Besok aku [janji kecil apa?]. Lihat aja hari ke-' + c.X1 + '.'],
  ['makasih', 'Terima kasih', c => 'Makasih udah nonton sampai sini' + (c.cw != null ? '. Berat sekarang ' + c.cw + ' kg' : '') + '. Besok lanjut lagi.'],
  ['angka', 'Angka', c => 'Berat awal ' + c.w0 + ' kg' + (c.cw != null ? ', sekarang ' + c.cw + ' kg' : '') + ', target turun berotot. Besok lanjut.']
];
const SP_FR = [   // [id, nama, nama 4 segmen, pancingan 4 segmen]
  ['hppc', 'Hook, progres, pelajaran, closing', null, null],
  ['kpp', 'Kejadian, perasaan, pelajaran', ['Kejadian', 'Perasaan', 'Pelajaran', 'Penutup'], ['Satu kejadian kecil hari ini, mulai dari tengah momen.', 'Apa yang kamu rasakan waktu itu, jujur saja.', 'Apa yang kamu pelajari dari kejadian itu.', 'Satu kalimat penutup yang ringan.']],
  ['sebsud', 'Sebelum dan sesudah', ['Sebelum', 'Sesudah', 'Yang berubah', 'Ajakan kecil'], ['Keadaanmu dulu, satu hal yang spesifik.', 'Keadaanmu sekarang, pakai angka atau detail nyata.', 'Apa yang paling berubah dan kenapa.', 'Ajakan kecil untuk penonton, tanpa memaksa.']],
  ['salah', 'Kesalahan hari ini', ['Kesalahan', 'Akibatnya', 'Perbaikan', 'Pegangan besok'], ['Kesalahan apa yang terjadi hari ini.', 'Apa akibatnya buat latihan, makan, atau mood.', 'Apa yang kamu lakukan untuk memperbaikinya.', 'Satu pegangan untuk besok.']],
  ['mood', 'Satu momen yang mengubah mood', ['Mood awal', 'Momen', 'Mood sesudah', 'Penutup'], ['Mood kamu sebelum momen itu.', 'Momen yang mengubahnya, dalam satu adegan.', 'Mood kamu sesudahnya.', 'Satu kalimat penutup.']]
];
const spLibToday = () => (spDb.lib && spDb.lib.d === today()) ? spDb.lib : { d: today(), h: -1, c: -1, f: 0 };
const spDoy = () => Math.round((pd(today()) - pd(today().slice(0, 4) + '-01-01')) / 864e5) + 1;
const spRotN = () => { const D = tkDay(); return D.n != null ? D.n : spDoy(); };
const spLibHookIdx = () => { const L = spLibToday(); if (L.h >= 0) return L.h; return spDb.set.rot ? (((spRotN() - 1) % SP_HK.length) + SP_HK.length) % SP_HK.length : 0; };
const spLibCloseIdx = () => { const L = spLibToday(); if (L.c >= 0) return L.c; return spDb.set.rot ? (spRotN() + 2) % SP_CL.length : 0; };
const spLibSuggest = () => spRotN() % SP_FR.length;
function spLibCtx() {
  const D = tkDay(), lw = latestBw(), t = today(), cw = lw && diffDays(lw.w, t) <= 13 ? lw.v : null;
  return { X: D.n == null ? '[X]' : String(D.n), X1: D.n == null ? '[X+1]' : String(D.n + 1), w0: fmt(bwStart(), 1), cw: cw != null ? fmt(cw, 1) : null, job: (pdb.tkJob || '').trim() || TK_JOB };
}
function spLibApply(a) {
  const L = spLibToday(), fr = SP_FR[L.f] || SP_FR[0], c = spLibCtx();
  if (!fr[2]) {   // kerangka bawaan: hanya hook dan penutup yang berputar
    const h = SP_HK[spLibHookIdx()], cl = SP_CL[spLibCloseIdx()];
    if (h[2]) a[0].text = h[2](c);
    if (cl[2]) a[3].text = cl[2](c);
    return a;
  }
  const F = tkFacts();   // kerangka lain: isi otomatis diganti pancingan; isi sebenarnya dari suaramu (Ngomong dulu) atau ketikan
  a.forEach((s, i) => { s.n = fr[2][i]; s.text = '[isi: ' + fr[3][i] + ']'; s.vis = 'Pancingan: ' + fr[3][i] + (i === 1 && F.f.length ? ' Bahan hari ini: ' + F.f.join(', ') + '.' : ''); });
  return a;
}
function tkSegsAuto() { return spLibApply(tkSegsAuto0()); }
function spLibTidyNote() {
  const fr = SP_FR[spLibToday().f] || SP_FR[0]; if (!fr[2]) return '';
  return 'KERANGKA CERITA HARI INI (menggantikan nama segmen pada aturan 4; batas kata dan urutan tetap): ' + fr[2].map((n, i) => (i + 1) + ' ' + n).join(', ') + '\n';
}
function spLibCard() {
  const L = spLibToday(), hi = spLibHookIdx(), ci = spLibCloseIdx(), fi = L.f, open = !!spV.lib, fr = SP_FR[fi], sg = spLibSuggest();
  const chip = (k, v, name, on) => '<button class="pill" data-q="spLibPick" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + on + '">' + esc(name) + '</button>';
  const row = (k, arr, cur, auto) => (auto ? chip(k, -1, 'Otomatis', L[k] < 0) : '') + arr.map((x, i) => chip(k, i, x[1], k === 'f' ? fi === i : (L[k] === i))).join('');
  const orig = tkSegsAuto0(), c = spLibCtx(), pv = (arr, i, o) => arr[i][2] ? arr[i][2](c) : o;
  let body = '';
  if (open) {
    body = '<div class="splib">' +
      '<div class="f"><div class="lbl">Hook <small>' + (L.h < 0 ? (spDb.set.rot ? 'berputar otomatis tiap hari' : 'putar otomatis mati: klasik') : 'pilihanmu hari ini') + '</small></div><div class="chp" role="group" aria-label="Pilih hook">' + row('h', SP_HK, hi, true) + '</div>' +
      '<p class="sppv"><b>' + esc(SP_HK[hi][1]) + ':</b> ' + esc(pv(SP_HK, hi, orig[0].text)) + '</p></div>' +
      '<div class="f"><div class="lbl">Penutup <small>' + (L.c < 0 ? (spDb.set.rot ? 'berputar otomatis tiap hari' : 'putar otomatis mati: klasik') : 'pilihanmu hari ini') + '</small></div><div class="chp" role="group" aria-label="Pilih penutup">' + row('c', SP_CL, ci, true) + '</div>' +
      '<p class="sppv"><b>' + esc(SP_CL[ci][1]) + ':</b> ' + esc(pv(SP_CL, ci, orig[3].text)) + '</p></div>' +
      '<label class="tkck"><input type="checkbox" data-sp="rot"' + (spDb.set.rot ? ' checked' : '') + '> Putar hook dan penutup otomatis tiap hari</label>' +
      '<div class="f"><div class="lbl">Kerangka cerita <small>' + (fi ? 'dipakai hari ini' : 'bawaan') + '</small></div><div class="chp" role="group" aria-label="Pilih kerangka cerita">' + row('f', SP_FR, fi, false) + '</div>' +
      '<ol class="spstep">' + (fr[2] || orig.map(s => s.n)).map((n, i) => '<li><b>' + esc(n) + '</b>' + (fr[3] ? ' ' + esc(fr[3][i]) : '') + '</li>').join('') + '</ol>' +
      (sg !== fi ? '<p class="note">Saran hari ini: <b>' + esc(SP_FR[sg][1]) + '</b>. <button class="btn sm" data-q="spLibPick" data-k="f" data-v="' + sg + '">Pakai kerangka ini</button></p>' : '') +
      (fi ? '<p class="note">Kerangka ini mengosongkan isi otomatis; isi dari suaramu lewat Ngomong dulu atau ketik. Hook dan penutup pustaka hanya berlaku di kerangka bawaan.</p>' : '') +
      '<p class="note">Teks yang sudah kamu edit atau kunci tidak berubah oleh pustaka.' + (tkS.ed[0] != null ? ' Hook kamu sudah diedit.' : '') + '</p></div></div>';
  }
  return '<section class="sec"><button class="tkbh" data-q="spLibOpen" aria-expanded="' + open + '"><span>Pustaka hook dan kerangka</span><small>' + esc(SP_HK[hi][1] + ' · ' + SP_CL[ci][1] + (fi ? ' · ' + SP_FR[fi][1] : '')) + '</small></button>' + body + '</section>';
}
QACT.spLibOpen = () => { spV.lib = !spV.lib; cnRender(); spFocus('[data-q="spLibOpen"]'); };
QACT.spLibPick = el => {
  const k = el.dataset.k, v = Number(el.dataset.v), mx = { h: SP_HK.length - 1, c: SP_CL.length - 1, f: SP_FR.length - 1 }[k];
  if (mx == null || !Number.isInteger(v) || v < (k === 'f' ? 0 : -1) || v > mx) return;
  spDb.lib = Object.assign({}, spLibToday(), { [k]: v }); spDb.u = Date.now(); queueSave('sp'); cnRender();
  spFocus('[data-q="spLibPick"][data-k="' + k + '"][data-v="' + v + '"]');
};
document.addEventListener('change', ev => { const el = ev.target; if (!el.dataset || el.dataset.sp !== 'rot') return; spDb.set.rot = !!el.checked; spDb.u = Date.now(); queueSave('sp'); cnRender(); spFocus('[data-sp="rot"]'); });

/* ===== MODUL: PENGAMAN DATA (batch 8) ===== */
const BACKUP_DAYS = 7;        // ingatkan bila sudah selama ini tidak dicadangkan
const FIRST_GRACE_DAYS = 3;   // pemakai baru tidak langsung diingatkan
const LS_SAFE_CHARS = 2.5e6;  // batas aman localStorage (Safari paling kecil)
let mdb = mblank();
function mblank() { return { lastBackup: 0, lastImport: 0, snooze: '', fold: [] }; }
function mclean(raw) {
  const b = mblank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const ts = v => { const n = Number(v); return Number.isFinite(n) && n > 0 && n < Date.now() + 864e5 ? n : 0; };
  b.lastBackup = ts(raw.lastBackup); b.lastImport = ts(raw.lastImport);
  b.snooze = typeof raw.snooze === 'string' && DATE_RE.test(raw.snooze) ? raw.snooze : '';
  b.fold = Array.isArray(raw.fold) ? raw.fold.filter((x, i, a) => MSLOT_ID.indexOf(x) >= 0 && a.indexOf(x) === i) : [];
  return b;
}
function markBackup() {
  mdb.lastBackup = Date.now(); mdb.snooze = ''; queueSave('m');
  if (curView === 'home') renderHome();
  if (curView === 'data') renderData();
  tryPersist();
}
function stamps() {
  const a = [];
  [db, wdb, tdb, cdb].forEach(o => Object.keys(o).forEach(k => { const u = o[k] && o[k].updated; if (u > 0) a.push(u); }));
  if (pdb.updated > 0) a.push(pdb.updated);
  return a;
}
function backupDue() {
  const st = stamps();
  if (!st.length) return null;                                  // belum ada data
  const last = Math.max(...st);
  if (last <= mdb.lastBackup) return null;                      // tidak ada perubahan sejak cadangan terakhir
  if (mdb.snooze && mdb.snooze > today()) return null;          // ditunda
  if (!mdb.lastBackup) {
    if (Date.now() - Math.min(...st) < FIRST_GRACE_DAYS * 864e5) return null;
    return { days: null, changes: st.length };
  }
  const days = Math.floor((Date.now() - mdb.lastBackup) / 864e5);
  if (days < BACKUP_DAYS) return null;
  return { days, changes: st.filter(u => u > mdb.lastBackup).length };
}
function lsUsage() {
  let chars = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('dailylog:') === 0) chars += k.length + (localStorage.getItem(k) || '').length;
    }
  } catch (e) { return null; }
  return { chars, pct: chars / LS_SAFE_CHARS };
}
function quotaState() {
  if (store.mode !== 'local') return null;
  const u = lsUsage(); if (!u) return null;
  return { kb: Math.round(u.chars / 1000), pct: Math.round(u.pct * 100), level: u.pct >= .85 ? 'bad' : u.pct >= .6 ? 'warn' : 'ok' };
}
const isStandalone = () => { try { return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches; } catch (e) { return false; } };
const safety = { persisted: null, persistable: false, standalone: false };
async function probeStorage() {
  safety.standalone = isStandalone();
  try {
    const sg = navigator.storage;
    if (sg && typeof sg.persisted === 'function') { safety.persisted = await sg.persisted(); safety.persistable = typeof sg.persist === 'function'; }
  } catch (e) { /* tidak didukung */ }
}
async function tryPersist() {
  if (store.mode !== 'local' || safety.persisted === true || !safety.persistable) return;
  try { safety.persisted = await navigator.storage.persist(); } catch (e) { /* abaikan */ }
  if (curView === 'data') renderData();
}
function agoText(ts) {
  if (!ts) return 'Belum pernah';
  const d = Math.floor((Date.now() - ts) / 864e5), dt = new Date(ts);
  return (d <= 0 ? 'Hari ini' : d + ' hari lalu') + ' (' + dt.getDate() + ' ' + BULAN[dt.getMonth()].slice(0, 3) + ' ' + dt.getFullYear() + ', ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ')';
}
function homeSafetyHTML() {
  const rows = [], q = quotaState(), due = backupDue();
  if (q && q.level !== 'ok') rows.push('<div class="plan alert bad"><div><b>Penyimpanan browser ' + (q.level === 'bad' ? 'hampir penuh' : 'mulai terisi') + ' (' + q.pct + '%)</b><small>Cadangkan sekarang. Jika penuh, log baru tidak bisa disimpan.</small></div><button class="btn sm primary" data-q="backupNow">Cadangkan</button></div>');
  if (due) {
    const where = store.mode === 'local' ? 'browser ini' : 'sesi ini';
    rows.push('<div class="plan alert"><div><b>' + (due.days == null ? 'Datamu belum pernah dicadangkan' : 'Terakhir dicadangkan ' + due.days + ' hari lalu') + '</b><small>' + due.changes + (due.days == null ? ' entri tersimpan' : ' entri baru atau diubah sejak itu') + '. Data hanya ada di ' + where + '.</small></div><button class="btn sm primary" data-q="backupNow">Cadangkan</button></div>' +
      '<p class="note" style="margin-top:0"><button class="link tap" data-q="backupLater">Ingatkan besok</button></p>');
  }
  return rows.length ? '<section class="sec"><h2>Keamanan data</h2>' + rows.join('') + '</section>' : '';
}
function installGuideHTML() {
  return '<details class="ph"><summary><span>Pasang di Layar Utama</span><i class="chev"></i></summary><div class="body">' +
    '<h4>Syarat</h4><ul><li>Aplikasi harus dibuka dari alamat web (https://…), bukan dari file .html di penyimpanan HP. File lokal tidak bisa dipasang.</li>' +
    '<li>Cara termudah: unggah file ini ke hosting statis gratis (Netlify Drop, GitHub Pages, atau Cloudflare Pages). Data tetap di HP-mu, bukan di server.</li></ul>' +
    '<h4>iPhone (Safari)</h4><ul><li>Buka alamatnya di Safari.</li><li>Ketuk tombol Bagikan, lalu Tambah ke Layar Utama.</li><li>Ketuk Tambah. Aplikasi terbuka layar penuh.</li></ul>' +
    '<h4>Android (Chrome)</h4><ul><li>Buka alamatnya di Chrome.</li><li>Ketuk menu ⋮, lalu Instal aplikasi atau Tambahkan ke layar utama.</li></ul>' +
    '<h4>Penting sebelum memasang</h4><ul><li>Di iPhone, data di Safari dan data di ikon Layar Utama terpisah. Cadangkan dulu di Safari, lalu Pulihkan di aplikasi yang baru dipasang.</li>' +
    '<li>Ganti alamat (domain) juga berarti data tidak ikut. Pindahkan dengan cadangan JSON.</li></ul></div></details>';
}
function safeBoxHTML() {   // v74s: kartu status + rincian lama (kv) dilipat
  const m = store.mode, q = quotaState(), due = backupDue(), has = stamps().length > 0;
  let lv = 'ok', t = 'Data aman';
  if (!has) { lv = 'mute'; t = 'Belum ada data'; } else if (!mdb.lastBackup) { lv = 'warn'; t = 'Belum pernah dicadangkan'; } else if (due) { lv = 'warn'; t = 'Perlu dicadangkan'; }
  if (q && q.level === 'bad') { lv = 'bad'; t = 'Penyimpanan hampir penuh'; }
  let h = '<div class="sthero ' + lv + '"><span class="stdot" aria-hidden="true"></span><div><b>' + t + '</b><small>Terakhir dicadangkan: ' + esc(agoText(mdb.lastBackup)) + '</small></div></div>';
  if (q) h += '<div class="stmeter ' + q.level + '" role="img" aria-label="Ruang terpakai ' + q.pct + ' persen"><i style="width:' + Math.min(100, q.pct) + '%"></i></div><small class="stmsub">' + fmt(q.kb, 0) + ' KB terpakai · ' + q.pct + '% batas aman</small>';
  h += '<div class="stchips"><span class="stchip">' + ({ artifact: 'Penyimpanan aplikasi', local: 'Browser ini', memory: 'Hanya sesi ini' }[m]) + '</span>' +
    (m === 'local' ? '<span class="stchip ' + (safety.persisted === true ? 'on' : '') + '">' + (safety.persisted === true ? 'Terlindungi' : (safety.persisted === false && safety.persistable ? '<button class="link tap" data-q="persist">Aktifkan perlindungan</button>' : 'Belum terlindungi')) + '</span><span class="stchip ' + (safety.standalone ? 'on' : '') + '">' + (safety.standalone ? 'Terpasang di Layar Utama' : 'Belum di Layar Utama') + '</span>' : '') + '</div>';
  if (m === 'memory') h += '<p class="note">Browser memblokir penyimpanan (mis. mode privat), jadi data hilang saat tab ditutup. Cadangkan sebelum keluar.</p>';
  h += '<button class="btn primary wide stgo" data-q="backupNow">Cadangkan sekarang</button>';
  let r = kv('Penyimpanan', { artifact: 'Penyimpanan aplikasi ini', local: 'Browser perangkat ini', memory: 'Hanya sesi ini' }[m]) + kv('Terakhir dicadangkan', esc(agoText(mdb.lastBackup)));
  if (mdb.lastImport) r += kv('Terakhir dipulihkan', esc(agoText(mdb.lastImport)));
  if (m === 'local') { r += kv('Perlindungan data', safety.persisted === true ? 'Aktif' : safety.persisted === false ? 'Belum' : 'Tidak didukung') + kv('Layar Utama', safety.standalone ? 'Terpasang' : 'Belum dipasang'); if (q) r += kv('Ruang terpakai', fmt(q.kb, 0) + ' KB (' + q.pct + '% batas aman)'); }
  return h + '<details class="ph stdet"><summary><span>Rincian penyimpanan</span><i class="chev"></i></summary><div class="body">' + r + '</div></details>' + installGuideHTML();
}
QACT.backupNow = () => actExportJson();
QACT.stTab = el => { const v = el.dataset.v; if (!['bk', 'ex', 'pf'].includes(v) || v === stTab) return; stTab = v; stPaint(); const p = $('#stP-' + v); if (p) { p.classList.remove('stin'); void p.offsetWidth; p.classList.add('stin'); } };
QACT.backupLater = () => { mdb.snooze = addDays(today(), 1); queueSave('m'); renderHome(); };
QACT.persist = async () => { await tryPersist(); toast(safety.persisted ? 'Perlindungan aktif' : 'Browser belum memberi perlindungan. Cadangan rutin tetap penting.'); };

/* ===== MODUL: AI (batch 9) ===== */
// Fondasi: pemanggil AI, pengaturan, filter privasi, ringkasan konteks (ctx.*), sheet hasil, pemeriksa angka.
// Aturan: AI hanya dipanggil dari tombol, hasilnya tidak pernah tersimpan otomatis, dan semua fitur lain tetap jalan bila AI mati.
const KEY_AI = 'dailylog:ai:v1';
const AI_MODEL_KEY = 'gemini-3.5-flash-lite';   // model bawaan Google Gemini (stabil, murah, cocok untuk ringkasan pendek dan foto makanan)
const AI_MODEL_PRO = 'gemini-pro-latest';   // alias Google yang selalu menunjuk ke model Pro terbaru (model "Pintar" di obrolan)
const AI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
const AI_VIEWS = ['home', 'today', 'weekly', 'history', 'train', 'roadmap', 'nutrition', 'content'];
const AI_GROUPS = [
  { id: 'gizi', t: 'Gizi', s: 'kalori, protein, air putih', on: true },
  { id: 'latihan', t: 'Latihan', s: 'sesi, RPE, set kalistenik, ride, FTP, reps mingguan', on: true },
  { id: 'badan', t: 'Berat dan ukuran badan', s: 'dari audit mingguan', on: true },
  { id: 'tidur', t: 'Tidur', s: 'durasi, mengorok atau bangun lemas', on: false },
  { id: 'kram', t: 'Kram', s: 'ada atau tidak, bagian tubuh', on: false },
  { id: 'junk', t: 'Junkfood dan manis', s: 'bersih atau melanggar, beserta catatannya', on: false },
  { id: 'ibadah', t: 'Shalat', s: 'tepat waktu atau bolong', on: false },
  { id: 'pmo', t: 'Streak PMO', s: 'hitungan hari', on: false },
  { id: 'layar', t: 'Screen time', s: 'durasi TikTok dan sosmed', on: false },
  { id: 'teks', t: 'Evaluasi dan catatan bebas', s: 'teks yang kamu ketik sendiri', on: false },
  { id: 'foto', t: 'Foto', s: 'dari Outfit > Kamera; belum dipakai fitur mana pun', on: false }
];
const aiBlank = () => ({ on: false, scope: 'open', chatModel: 'pro', web: true, proModel: '', mode: '', endpoint: '', token: '', fb: 'off', key: '', model: '', priv: AI_GROUPS.reduce((o, g) => { o[g.id] = g.on; return o; }, {}), updated: 0 });
let adb = aiBlank();
let aiOpen = false;   // panel Pengaturan AI terbuka
function aiClean(raw) {
  const b = aiBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  b.on = raw.on === true;
  b.mode = raw.mode === 'key' || raw.mode === 'proxy' ? raw.mode : '';
  b.endpoint = typeof raw.endpoint === 'string' ? raw.endpoint.trim().slice(0, 300) : '';
  b.token = typeof raw.token === 'string' && /^[\w.~+\/=-]{24,200}$/.test(raw.token.trim()) ? raw.token.trim() : '';   // token perangkat proxy (S1); potongan yang belum utuh dibuang saat dimuat
  b.fb = raw.fb === 'auto' ? 'auto' : 'off';   // bila proxy gagal: 'auto' = coba kunci cadangan (adb.key), 'off' = tampilkan galat
  b.scope = raw.scope === 'data' || raw.scope === 'plain' ? raw.scope : 'open';   // gaya jawaban Tanya AI
  b.chatModel = raw.chatModel === 'fast' ? 'fast' : 'pro';   // model obrolan Tanya AI: Pintar (Pro, bawaan) atau Cepat
  b.web = raw.web !== false;                                  // pencarian Google di obrolan (bawaan nyala; otomatis tidak dipakai di gaya Hanya data)
  b.proModel = typeof raw.proModel === 'string' && /^[\w.\-]{1,60}$/.test(raw.proModel.trim()) ? raw.proModel.trim() : '';
  if (/^claude/i.test(b.proModel)) b.proModel = '';
  b.key = typeof raw.key === 'string' ? raw.key.trim().slice(0, 300) : '';
  if (/^sk-ant-/i.test(b.key)) b.key = '';   // kunci Anthropic dari versi lama tidak berlaku untuk Gemini
  b.model = typeof raw.model === 'string' && /^[\w.\-]{1,60}$/.test(raw.model.trim()) ? raw.model.trim() : '';
  if (/^claude/i.test(b.model)) b.model = '';   // nama model lama: kembali ke bawaan Gemini
  if (raw.priv && typeof raw.priv === 'object') AI_GROUPS.forEach(g => { if (typeof raw.priv[g.id] === 'boolean') b.priv[g.id] = raw.priv[g.id]; });
  b.updated = Number(raw.updated) || 0;
  return b;
}
STORES.a = { key: KEY_AI, get: () => adb }; dirty.a = false;   // khusus perangkat: tidak ikut ekspor JSON
const aiMode = () => adb.mode === 'proxy' ? 'proxy' : 'key';   // Gemini selalu lewat kunci sendiri atau proxy
const aiOn = g => adb.priv[g] === true;
const aiFastModel = () => adb.model || AI_MODEL_KEY;
const aiProModel = () => adb.proModel || AI_MODEL_PRO;
const aiChatModel = () => adb.chatModel === 'fast' ? aiFastModel() : aiProModel();
const aiWebOn = () => adb.web === true && adb.scope !== 'data';   // gaya Hanya data tidak pernah memakai web

/* --- pemanggil --- */
const AI_BASE = 'Kamu asisten untuk aplikasi catatan harian kebugaran milik satu orang. Jawab dalam bahasa Indonesia, ringkas (sekitar 110 kata, muat satu layar HP), teks biasa tanpa tabel atau judul; poin boleh diawali "- ". ' +
  'Pakai hanya angka yang tertulis di DATA. Jangan menghitung, memperkirakan, atau mengarang angka baru. Jika DATA kosong atau kurang untuk menjawab, katakan terus terang. ' +
  'Kamu bukan dokter dan tidak mendiagnosis. Jika ada kram berulang, bengkak, nyeri dada, pusing berat, atau pingsan, sarankan menemui dokter.';
const AI_OPEN = 'Kamu asisten pribadi serbaguna di dalam aplikasi catatan harian kebugaran milik satu orang. Jawab pertanyaan apa pun dengan pengetahuanmu sendiri (kebugaran, gizi, kesehatan umum, ibadah, konten, teknologi, belajar, kehidupan sehari-hari, dan topik lain), tidak terbatas pada catatan pengguna. Pakai bahasa Indonesia kecuali diminta lain. ' +
  'Jika ada DATA, itu ringkasan catatan pengguna: pakai hanya bila relevan dengan pertanyaan, jangan mengarang angka tentang catatan pengguna yang tidak ada di DATA, dan katakan bila datanya kurang. Untuk pertanyaan umum, DATA boleh diabaikan. ' +
  'Langsung ke inti. Panjang menyesuaikan pertanyaan: ringkas untuk pertanyaan sederhana (sekitar 100-150 kata, muat satu layar HP), lebih panjang dan runtut bila pertanyaannya menuntut. Tulis ringkas dan enak dibaca di layar HP: paragraf pendek, boleh **tebal** untuk istilah penting, poin diawali "- " atau "1.", tanpa judul (#) dan tanpa tabel kecuali diminta. Katakan terus terang bila tidak yakin. ' +
  'Kamu bukan dokter: untuk soal kesehatan beri informasi umum, dan sarankan menemui dokter bila ada kram berulang, bengkak, nyeri dada, pusing berat, atau pingsan.';
const AI_SCOPES = {
  open: { t: 'Bebas + datamu', n: 'Menjawab pertanyaan apa pun. Ringkasan datamu (sesuai filter privasi) ikut dikirim sebagai konteks.' },
  plain: { t: 'Bebas saja', n: 'Menjawab pertanyaan apa pun. Tidak ada data log yang dikirim, hanya pertanyaanmu.' },
  data: { t: 'Hanya data', n: 'Hanya menjawab dari ringkasan datamu. Angka di luar data ditandai peringatan.' }
};
function aiSetScope(v) {
  if (!AI_SCOPES[v] || v === adb.scope) return;
  if ((v === 'data') !== (adb.scope === 'data') && chatMsgs.length) chatSep('Gaya jawaban diganti ke "' + AI_SCOPES[v].t + '". Obrolan sebelumnya tidak ikut dikirim.');   // obrolan tetap terlihat, tetapi tidak dibawa ke mode "Hanya data" dan sebaliknya
  adb.scope = v; aiSave();
}
function aiHttpErr(st, data, md) {
  const e = data && data.error && typeof data.error === 'object' ? data.error : {};
  const em = typeof e.message === 'string' ? e.message.slice(0, 140) : '', es = typeof e.status === 'string' ? e.status : '';
  const keyBad = (Array.isArray(e.details) ? e.details : []).some(x => x && typeof x.reason === 'string' && /^API_KEY/.test(x.reason)) || /api key/i.test(em);
  if (md === 'proxy' && /^\[proxy\] /.test(em)) {   // galat buatan Worker S1 sendiri (bukan dari Google): pesannya sudah spesifik dan berbahasa Indonesia, tampilkan apa adanya (401 token salah tetap memakai pesan lama di bawah)
    const px = em.slice(8), keySrv = /GEMINI_API_KEY/.test(px);
    if (st === 429) return { ok: false, code: 'rate', msg: px };   // batas pemakaian proxy sendiri: tidak diulang otomatis
    if (st === 400 || st === 413 || st === 415) return { ok: false, code: 'bad', msg: 'Permintaan ditolak: ' + px };
    if (st >= 500) return { ok: false, code: 'busy', msg: 'Proxy: ' + px, retry: !keySrv && st !== 503 };   // kunci server salah / belum diisi: mengulang tidak membantu; 'busy' tetap memicu kunci cadangan bila diizinkan
  }
  if (st === 429 || es === 'RESOURCE_EXHAUSTED') return { ok: false, code: 'rate', msg: 'Terlalu banyak permintaan atau kuota Gemini habis. Coba lagi sebentar lagi.', retry: true };
  if (st === 401 || st === 403 || keyBad) return { ok: false, code: 'auth', msg: md === 'proxy' ? 'Token perangkat proxy salah atau sudah dicabut. Periksa di Pengaturan › Preferensi › AI.' : 'Kunci API Gemini salah, dibatasi, atau tidak berlaku. Periksa di Pengaturan › Preferensi › AI.' };   // Gemini mengirim kunci salah sebagai HTTP 400
  if (st === 404) return { ok: false, code: 'model', msg: 'Model atau alamat tidak ditemukan. Periksa nama model atau alamat proxy di Pengaturan AI.' };
  if (es === 'FAILED_PRECONDITION') return { ok: false, code: 'region', msg: 'Gemini belum bisa dipakai dengan kunci ini (mis. wilayahmu belum didukung untuk kuota gratis, atau penagihan belum aktif). Cek di Google AI Studio.' };
  if (st === 400 || st === 413 || st === 422) return { ok: false, code: 'bad', msg: 'Permintaan ditolak' + (em ? ': ' + em : '.') };
  if (st >= 500) return { ok: false, code: 'busy', msg: 'Layanan Gemini sedang sibuk. Coba lagi nanti.', retry: true };
  return { ok: false, code: 'http', msg: 'AI mengembalikan kesalahan (' + st + ').' };
}
function aiRequest(o, fk) {
  const mode = fk ? 'key' : aiMode();
  const h = { 'Content-Type': 'application/json' };
  let url;
  if (mode === 'proxy') { url = adb.endpoint; if (/^[\w.~+\/=-]{24,200}$/.test(adb.token)) h['Authorization'] = 'Bearer ' + adb.token; h['X-DL-Model'] = o.model || aiFastModel(); }   // proxy menerima badan format Gemini generateContent dan memegang kunci + model sendiri
  else { url = AI_ENDPOINT + encodeURIComponent(o.model || adb.model || AI_MODEL_KEY) + ':generateContent'; h['x-goog-api-key'] = adb.key; }
  const parts = [{ text: String(o.user) }];
  if (o.image) parts.unshift({ inlineData: { mimeType: o.image.type, data: o.image.data } });
  // maxOutputTokens mencakup token berpikir; diberi ruang ekstra agar jawaban tidak kosong/terpotong di model yang berpikir
  const hist = (Array.isArray(o.history) ? o.history : []).filter(x => x && typeof x.text === 'string' && x.text).map(x => ({ role: x.role === 'model' ? 'model' : 'user', parts: [{ text: x.text }] }));
  const body = { contents: hist.concat([{ role: 'user', parts }]), generationConfig: { maxOutputTokens: (o.max || 900) + (o.think || 2048) } };
  if (o.system) body.systemInstruction = { parts: [{ text: String(o.system) }] };
  if (o.json) body.generationConfig.responseMimeType = 'application/json';
  if (o.web && !o.json) body.tools = [{ google_search: {} }];   // pencarian Google (grounding); tidak dipakai bersama keluaran JSON
  return { url, mode, init: { method: 'POST', headers: h, body: JSON.stringify(body) } };
}
// metadata pencarian Google: sumber (tautan), kueri, dan HTML "Search Suggestions" yang wajib ditampilkan menurut syarat Google
function aiGround(gm) {
  const src = [], seen = {};
  (Array.isArray(gm.groundingChunks) ? gm.groundingChunks : []).forEach(c => {
    const w = c && c.web;
    if (!w || typeof w.uri !== 'string' || !/^https?:\/\//i.test(w.uri) || seen[w.uri]) return;
    seen[w.uri] = 1; src.push({ uri: w.uri.slice(0, 600), title: typeof w.title === 'string' ? w.title.trim().slice(0, 120) : '' });
  });
  const queries = (Array.isArray(gm.webSearchQueries) ? gm.webSearchQueries : []).filter(q => typeof q === 'string' && q.trim()).map(q => q.trim().slice(0, 120)).slice(0, 5);
  const entry = gm.searchEntryPoint && typeof gm.searchEntryPoint.renderedContent === 'string' ? gm.searchEntryPoint.renderedContent.slice(0, 30000) : '';
  return { src: src.slice(0, 8), queries, entry };
}
const AI = {
  run: null,
  ready() {
    if (!adb.on) return { ok: false, why: 'off', msg: 'Fitur AI sedang mati. Nyalakan di Pengaturan › Preferensi › AI.' };
    const m = aiMode();
    if (m === 'key' && !adb.key) return { ok: false, why: 'nokey', msg: 'Kunci API belum diisi. Isi di Pengaturan › Preferensi › AI.' };
    if (m === 'proxy' && !/^(https:\/\/\S+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/\S*)?)$/i.test(adb.endpoint)) return { ok: false, why: 'noproxy', msg: 'Alamat proxy belum diisi atau tidak valid (harus diawali https://).' };
    return { ok: true };
  },
  cancel() { const r = this.run; this.run = null; if (r) { r.cancelled = true; r.ctl.abort(); } },
  // ask({task, system, user, image?, json?, max?, timeout?}) -> {ok, text, data?} | {ok:false, code, msg}. Tidak pernah melempar error.
  async ask(o) {
    const rd = this.ready();
    if (!rd.ok) return { ok: false, code: rd.why, msg: rd.msg };
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, code: 'offline', msg: 'Sedang offline. AI butuh internet, fitur lain tetap normal.' };
    if (this.run) return { ok: false, code: 'busy', msg: 'Permintaan sebelumnya masih berjalan.' };
    const run = { ctl: null, cancelled: false }; this.run = run;
    try {
      let r;
      for (let i = 0; i < (o.single === true ? 1 : 2); i++) {            // satu kali ulang untuk gangguan sementara; o.single (STK-3b-3b-4a, foto Kamera) = TANPA ulang
        r = await this.once(o, run);
        if (r.ok || !r.retry || run.cancelled) break;
        await new Promise(res => setTimeout(res, 1500));
        if (run.cancelled) break;
      }
      if (!r.ok && o.web && o.single !== true && !run.cancelled && ['bad', 'region', 'rate'].includes(r.code)) {   // pencarian web bisa belum tersedia di akun/kuotamu: coba sekali lagi tanpa web
        const r2 = await this.once(Object.assign({}, o, { web: false }), run);
        if (r2.ok) { r2.noWeb = true; r = r2; }
      }
      if (!r.ok && !run.cancelled && o.single !== true && aiMode() === 'proxy' && adb.fb === 'auto' && adb.key && ['net', 'timeout', 'busy', 'http', 'model'].includes(r.code)) {   // proxy mati: kunci cadangan (terpisah, kuota kecil) bila pemilik mengizinkan
        const r3 = await this.once(o, run, true);
        if (r3.ok) { r3.viaKey = true; r = r3; }
      }
      return run.cancelled ? { ok: false, code: 'cancelled', msg: '' } : r;
    } finally { if (this.run === run) this.run = null; }
  },
  async once(o, run, fk) {
    const rq = aiRequest(o, fk); run.ctl = new AbortController();
    let timedOut = false;
    const tm = setTimeout(() => { timedOut = true; run.ctl.abort(); }, o.timeout || (o.image ? 60000 : 40000));
    try {
      const res = await fetch(rq.url, Object.assign({ signal: run.ctl.signal }, rq.init));
      const raw = await res.text();
      let data = null; try { data = JSON.parse(raw); } catch (e) { /* bukan JSON */ }
      if (!res.ok) return aiHttpErr(res.status, data, rq.mode);
      const blk = { ok: false, code: 'blocked', msg: 'Gemini menolak permintaan ini (filter keamanan). Coba ubah pertanyaan atau kurangi data yang dikirim lewat pengaturan privasi.' };
      if (data && data.promptFeedback && data.promptFeedback.blockReason) return blk;
      const cand = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
      const txt = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts.filter(p => p && typeof p.text === 'string' && !p.thought).map(p => p.text).join('').trim() : '';
      if (!txt) {
        if (cand && ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY'].includes(cand.finishReason)) return blk;
        return { ok: false, code: 'empty', msg: 'AI tidak memberi jawaban. Coba lagi.', retry: true };
      }
      if (o.json) {
        try { return { ok: true, text: txt, data: JSON.parse(txt.replace(/```json|```/g, '').trim()) }; }
        catch (e) { return { ok: false, code: 'badjson', msg: 'Jawaban AI tidak bisa dibaca. Coba lagi.', retry: true }; }
      }
      const out = { ok: true, text: txt };
      if (cand && cand.finishReason === 'MAX_TOKENS') out.cut = true;   // jawaban terpotong batas token
      if (cand && cand.groundingMetadata && typeof cand.groundingMetadata === 'object') Object.assign(out, aiGround(cand.groundingMetadata));
      return out;
    } catch (e) {
      if (run.cancelled) return { ok: false, code: 'cancelled', msg: '' };
      if (timedOut) return { ok: false, code: 'timeout', msg: 'AI terlalu lama menjawab. Coba lagi.', retry: true };
      return { ok: false, code: 'net', msg: 'Tidak bisa terhubung ke AI. Periksa internet' + (rq.mode === 'proxy' ? ', alamat proxy, dan izin CORS' : '') + '.', retry: true };
    } finally { clearTimeout(tm); }
  },
  // sheet hasil: penanda "dihasilkan AI", pemeriksa angka, Pakai / Salin / Tutup. Hasil bisa diedit dulu dan tidak tersimpan otomatis.
  show(o) {
    const note = txt => {
      if (o.free) return '✦ Dihasilkan AI. Bisa keliru, terutama fakta dan angka; cek hal penting ke sumber tepercaya. Bukan diagnosis atau saran medis.';
      const bad = aiCheck(txt, o.basis || '');
      return '✦ Dihasilkan AI. Periksa sebelum dipakai. Bukan diagnosis atau saran medis.' + (bad.length ? '\n\n⚠ Angka ini tidak ada di datamu: ' + bad.join(', ') + '. Anggap perkiraan AI dan cek dulu.' : '');
    };
    const acts = [];
    if (o.onUse) acts.push({ label: o.useLabel || 'Pakai', primary: true, fn: () => { if (o.onUse($('#shText').value) !== false) closeSheet(); } });
    (o.more || []).forEach(x => acts.push({ label: x.label, fn: () => { if (x.fn($('#shText').value) !== false) closeSheet(); } }));
    acts.push({ label: 'Salin', primary: !o.onUse, fn: copyFromSheet });
    if (o.again) acts.push({ label: o.againLabel || 'Tanya lagi', fn: o.again });
    acts.push(closeBtn);
    openSheet({ title: o.title || '✦ Jawaban AI', note: note(o.text), pre: true, text: o.text, readonly: false, prose: true, placeholder: '', actions: acts, onInput: () => { $('#shNote').textContent = note($('#shText').value); } });
  }
};

/* --- pemeriksa angka (aturan 3): angka di keluaran AI harus ada di konteks --- */
function numTok(s) { const a = [], re = /\d+(?:[.,]\d+)*/g; let m; while ((m = re.exec(s))) a.push({ raw: m[0], i: m.index }); return a; }
function aiVals(raw) {
  const v = [];
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) v.push(parseFloat(raw.replace(/\./g, '').replace(',', '.')));
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) v.push(parseFloat(raw.replace(/,/g, '')));
  const d = parseFloat(raw.replace(',', '.')); if (Number.isFinite(d)) v.push(d);
  return v;
}
const aiDp = x => { const s = String(x), i = s.indexOf('.'); return i < 0 ? 0 : Math.min(2, s.length - i - 1); };
const aiSame = (x, c) => { if (x === c) return true; const k = Math.pow(10, aiDp(x)); return Math.abs(Math.round(c * k) / k - x) < 1e-9; };
function aiSkip(s, t) {
  const raw = t.raw, v = parseFloat(raw.replace(',', '.'));
  const before = s.slice(Math.max(0, t.i - 6), t.i), after = s.slice(t.i + raw.length, t.i + raw.length + 12), ls = s.lastIndexOf('\n', t.i - 1) + 1;
  if (/^\s*[-*•]?\s*$/.test(s.slice(ls, t.i)) && /^[.)]\s/.test(after)) return true;   // penanda daftar "1."
  if (/^(19|20)\d\d$/.test(raw)) return true;                                            // tahun
  if (s.charAt(t.i - 1) === ':' || /^:\d/.test(after)) return true;                      // jam 07:30
  if (/fase\s*$/i.test(before) && Number.isInteger(v) && v >= 1 && v <= 4) return true;
  if (Number.isInteger(v) && v >= 1 && v <= 7 && /^\s*(hari|pekan|minggu|kali|sesi|set|opsi|langkah|fokus|kalimat|poin|saran|bulan)\b/i.test(after)) return true;
  return false;
}
function aiCheck(out, basis) {
  const ok = []; numTok(basis).forEach(t => aiVals(t.raw).forEach(x => ok.push(x)));
  const bad = [];
  numTok(out).forEach(t => {
    if (aiSkip(out, t)) return;
    if (!aiVals(t.raw).some(x => ok.some(c => aiSame(x, c))) && !bad.includes(t.raw)) bad.push(t.raw);
  });
  return bad.slice(0, 8);
}

/* --- konteks: ringkasan padat, dihitung lokal, mengikuti filter privasi --- */
const ctx = {};
const AI_RIDE = { z2: 'Zone 2', thr: 'Threshold', long: 'ride panjang', vo2: 'VO2 max', free: 'bebas' };
const AI_SES = { kalistenik: 'kalistenik', sepeda: 'sepeda', rest: 'istirahat' };
const aiN = (v, d) => fmt(v, d == null ? 0 : d);
const aiTxt = (s, n) => String(s).replace(/\s+/g, ' ').trim().slice(0, n);
const aiHead = d => { const p = pos(d); return p && p.ph ? ' Fase ' + p.ph.id + ', hari ke-' + p.day + ', bulan ' + p.month + '.' : ''; };
function aiPack(head, L) {
  return { text: head + '\n' + (L.length ? L.map(x => '- ' + x).join('\n') : '- (belum ada data yang boleh dikirim)'), n: L.length, empty: !L.length };
}
function aiDayLines(d) {
  const e = db[d], t = tdb[d], T = tgFor(d), L = [];
  if (e) {
    if (aiOn('gizi')) {
      const k = num(e.kcal), p = num(e.protein), w = num(e.water), g = [];
      if (k != null) g.push('kalori ' + aiN(k) + ' (' + (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ')');
      if (p != null) g.push('protein ' + aiN(p, 1) + ' g (target ' + aiN(T.protein) + ')');
      if (w != null) g.push('air ' + aiN(w, 2) + ' L (target min ' + T.water + ')');
      if (g.length) L.push(g.join('; '));
      const ml = aiMealLine(d); if (ml) L.push(ml);
    }
    if (aiOn('latihan') && (e.sesi.length || e.rpe != null)) L.push('sesi: ' + (e.sesi.map(x => AI_SES[x] || x).join(' + ') || '-') + (e.rpe != null ? '; RPE ' + e.rpe : ''));
    if (aiOn('tidur')) {
      const sl = num(e.sleep), g = [];
      if (sl != null) g.push('tidur ' + aiN(sl, 1) + ' jam');
      if (e.snore) g.push('mengorok atau bangun lemas: ' + e.snore);
      if (g.length) L.push(g.join('; '));
    }
    if (aiOn('kram') && e.kram) L.push('kram: ' + e.kram + (e.kram === 'ya' && e.kramPart.trim() ? ' (' + aiTxt(e.kramPart, 40) + ')' : ''));
    if (aiOn('junk') && e.junk) L.push('junkfood atau manis: ' + e.junk + (e.junk === 'melanggar' && e.junkNote.trim() ? ' (' + aiTxt(e.junkNote, 80) + ')' : ''));
    if (aiOn('ibadah') && e.shalat) L.push('shalat 5 waktu: ' + (e.shalat === 'ya' ? 'tepat waktu' : 'bolong' + (e.missed.length ? ' (' + e.missed.join(', ') + ')' : '')));
    if (aiOn('pmo') && e.pmo !== '') L.push('streak PMO: hari ke-' + e.pmo);
    if (aiOn('layar') && METRIC.screen(e) != null) L.push('screen time ' + aiN(METRIC.screen(e), 1) + ' jam');
    if (aiOn('teks') && e.eval.trim()) L.push('evaluasi: "' + aiTxt(e.eval, 160) + '"');
  }
  if (t && aiOn('latihan')) {
    if (t.kal) L.push('kalistenik: ' + (t.kal.done ? 'selesai' : 'belum selesai') + ', ' + Object.values(t.kal.ex).reduce((a, x) => a + x.s.filter(y => y.d).length, 0) + ' set tercatat');
    t.rides.forEach(r => L.push('ride ' + (AI_RIDE[r.type] || 'bebas') + ': ' + [r.min != null && aiN(r.min) + ' menit', r.km != null && aiN(r.km, 1) + ' km', r.spd != null && aiN(r.spd, 1) + ' km/jam', r.rpe != null && 'RPE ' + r.rpe].concat(jrAiBits(r)).filter(Boolean).join(', ')));
  }
  return L;
}
function aiStatLines(days) {
  const L = [], ev = days.filter(d => db[d]);
  const vals = f => ev.map(d => f(db[d], d)).filter(x => x != null);
  const cnt = f => ev.filter(d => f(db[d], d)).length;
  const av = (a, dec, unit, label) => { if (a.length) L.push(label + ' rata-rata ' + aiN(a.reduce((s, x) => s + x, 0) / a.length, dec) + unit + ' (' + a.length + ' hari; terendah ' + aiN(Math.min(...a), dec) + ', tertinggi ' + aiN(Math.max(...a), dec) + ')'); };
  if (aiOn('gizi')) {
    const k = vals(e => num(e.kcal)), p = vals(e => num(e.protein)), w = vals(e => num(e.water));
    av(k, 0, ' kcal', 'kalori');
    if (k.length) L.push('kalori sesuai target di ' + cnt((e, d) => num(e.kcal) != null && kcalOk(num(e.kcal), tgFor(d))) + ' dari ' + k.length + ' hari');
    av(p, 0, ' g', 'protein');
    if (p.length) L.push('protein mencapai target di ' + cnt((e, d) => num(e.protein) != null && num(e.protein) >= tgFor(d).protein) + ' dari ' + p.length + ' hari');
    av(w, 2, ' L', 'air putih');
    if (w.length) L.push('air mencapai target di ' + cnt((e, d) => num(e.water) != null && num(e.water) >= tgFor(d).water) + ' dari ' + w.length + ' hari');
    if (days.length >= 6) {
      const h = Math.floor(days.length / 2), m = (ds, f) => { const a = ds.map(d => db[d] ? f(db[d]) : null).filter(x => x != null); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
      [['kalori', e => num(e.kcal), ' kcal'], ['protein', e => num(e.protein), ' g']].forEach(([n, f, u]) => {
        const a = m(days.slice(0, h), f), b = m(days.slice(-h), f);
        if (a != null && b != null) L.push(n + ' paruh awal ' + aiN(a) + u + ', paruh akhir ' + aiN(b) + u);
      });
    }
  }
  if (aiOn('latihan')) {
    const kal = cnt(e => e.sesi.includes('kalistenik')), bike = cnt(e => e.sesi.includes('sepeda')), rest = cnt(e => e.sesi.includes('rest'));
    if (kal || bike || rest) L.push('sesi tercatat: kalistenik ' + kal + ' hari, sepeda ' + bike + ' hari, istirahat ' + rest + ' hari');
    av(vals(e => e.rpe), 1, '', 'RPE');
    const kd = days.filter(d => tdb[d] && tdb[d].kal && tdb[d].kal.done).length;
    if (kd) L.push('sesi kalistenik selesai: ' + kd + ' kali');
    const rides = days.reduce((a, d) => a.concat(tdb[d] ? tdb[d].rides : []), []);
    if (rides.length) L.push('ride: ' + rides.length + ' kali, total ' + aiN(rides.reduce((s, r) => s + (r.km || 0), 0), 1) + ' km, ' + aiN(rides.reduce((s, r) => s + (r.min || 0), 0)) + ' menit' + (rides.some(r => r.kc != null) ? ', kalori terbakar ride ' + aiN(jrSum(rides, 'kc')) + ' kkal (perkiraan Strava)' : ''));
  }
  if (aiOn('tidur')) { av(vals(e => num(e.sleep)), 1, ' jam', 'tidur'); const a = cnt(e => e.snore != null); if (a) L.push('mengorok atau bangun lemas: ' + cnt(e => e.snore === 'ya') + ' dari ' + a + ' hari'); }
  if (aiOn('kram')) { const a = cnt(e => e.kram != null); if (a) L.push('kram: ' + cnt(e => e.kram === 'ya') + ' dari ' + a + ' hari'); }
  if (aiOn('junk')) { const a = cnt(e => e.junk != null); if (a) L.push('junkfood atau manis melanggar: ' + cnt(e => e.junk === 'melanggar') + ' dari ' + a + ' hari'); }
  if (aiOn('ibadah')) { const a = cnt(e => e.shalat != null); if (a) L.push('shalat tepat waktu: ' + cnt(e => e.shalat === 'ya') + ' dari ' + a + ' hari'); }
  if (aiOn('pmo')) { const l = ev.filter(d => db[d].pmo !== '').pop(); if (l) L.push('streak PMO terakhir: hari ke-' + db[l].pmo); }
  if (aiOn('layar')) av(vals(e => METRIC.screen(e)), 1, ' jam', 'screen time');
  if (aiOn('teks')) ev.filter(d => db[d].eval.trim()).slice(-7).forEach(d => L.push('evaluasi ' + shortDate(d) + ': "' + aiTxt(db[d].eval, 140) + '"'));
  return L;
}
function aiWeekLines(ws) {
  const w = wdb[ws], L = [];
  if (!w) return L;
  if (aiOn('badan')) {
    const g = [];
    if (num(w.bw) != null) { const r = bwDeltaEff(ws, w); g.push('berat rata-rata ' + aiN(num(w.bw), 2) + ' kg' + (r ? ' (perubahan ' + sgn(r.d, 2, true) + ' kg dari pekan sebelumnya)' : '')); }
    [['waist', 'lingkar perut'], ['chest', 'dada'], ['thigh', 'paha'], ['arm', 'lengan']].forEach(([k, n]) => { if (num(w[k]) != null) g.push(n + ' ' + aiN(num(w[k]), 1) + ' cm'); });
    if (g.length) L.push('audit pekan: ' + g.join('; '));
  }
  if (aiOn('latihan')) {
    const g = [];
    if (num(w.pushup) != null) g.push('push-up ' + aiN(num(w.pushup)) + ' reps');
    if (num(w.row) != null) g.push('inverted row ' + aiN(num(w.row)) + ' reps');
    if (num(w.km) != null) g.push('sepeda ' + aiN(num(w.km), 1) + ' km');
    if (num(w.speed) != null) g.push('speed ' + aiN(num(w.speed), 1) + ' km/jam');
    if (w.energy != null) g.push('energi ' + w.energy + ' dari 10');
    if (g.length) L.push('audit latihan: ' + g.join('; '));
  }
  if (aiOn('kram') && w.kram) L.push('kram pekan ini: ' + (w.kram === 'nol' ? '0 kali' : (num(w.kramN) != null ? aiN(num(w.kramN)) + ' kali' : 'ada')));
  if (aiOn('teks') && w.note.trim()) L.push('catatan audit: "' + aiTxt(w.note, 160) + '"');
  return L;
}
ctx.day = d => aiPack(dayLong(d) + '.' + aiHead(d), aiDayLines(d));
ctx.week = ws => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter(d => d <= today());
  return aiPack('Pekan ' + rangeLabel(ws) + '.' + aiHead(ws) + ' Hari tercatat: ' + days.filter(d => db[d]).length + ' dari ' + days.length + '.', aiStatLines(days).concat(aiWeekLines(ws)));
};
ctx.range = n => {
  const t = today(), days = Array.from({ length: n }, (_, i) => addDays(t, i - n + 1)), L = aiStatLines(days);
  if (aiOn('badan')) {
    const ws = Object.keys(wdb).filter(w => w >= weekStart(days[0]) && num(wdb[w].bw) != null).sort().slice(-6);
    if (ws.length) L.push('berat rata-rata per pekan: ' + ws.map(w => shortDate(w) + ' ' + aiN(num(wdb[w].bw), 2) + ' kg').join('; '));
    if (ws.length > 1) L.push('perubahan berat dari ' + shortDate(ws[0]) + ' ke ' + shortDate(ws[ws.length - 1]) + ': ' + sgn(num(wdb[ws[ws.length - 1]].bw) - num(wdb[ws[0]].bw), 2, true) + ' kg');
  }
  return aiPack(n + ' hari terakhir (' + shortDate(days[0]) + ' sampai ' + shortDate(t) + ').' + aiHead(t) + ' Hari tercatat: ' + days.filter(d => db[d]).length + ' dari ' + n + '.', L);
};

/* --- tombol "✦ Tanya AI" yang sadar halaman --- */
const AI_QUICK = {
  home: ['Apa prioritasku hari ini?'], today: ['Ringkas hari ini', 'Apa yang masih kurang hari ini?'], weekly: ['Ringkas pekan ini', 'Apa fokus pekan depan?'],
  history: ['Apa pola 2 pekan terakhir?', 'Mana yang paling perlu diperbaiki?'], train: ['Ringkas latihan 2 pekan terakhir'],
  roadmap: ['Apakah progresku sesuai fase?'], nutrition: ['Apakah asupan gizi cukup?'], content: ['Beri ide hook dari data hari ini']
};
function aiPage() {
  const v = curView;
  if (v === 'today') return { v, label: 'Jurnal, ' + dayShort(cur), c: ctx.day(cur) };
  if (v === 'weekly') return { v, label: 'Mingguan, ' + rangeLabel(curW), c: ctx.week(curW) };
  if (v === 'history') return { v, label: 'Riwayat, 14 hari terakhir', c: ctx.range(14) };
  if (v === 'content') return { v, label: 'Konten, data hari ini', c: ctx.day(today()) };
  if (v === 'roadmap') return { v, label: 'Peta, 28 hari terakhir', c: ctx.range(28) };
  return { v, label: ({ home: 'Beranda', train: 'Latihan', nutrition: 'Nutrisi' })[v] + ', 7 hari terakhir', c: ctx.range(7) };
}
function aiFabSync() {
  const b = $('#aiFab'); if (!b) return;
  b.hidden = !(adb.on && AI_VIEWS.includes(curView));
  document.body.classList.toggle('ai', !b.hidden);
  b11Sync();
  b12Sync();
  b14Sync();
  b15Sync();
  b16Sync();
  b17cSync();
  naiSync();
  tkAiSync();
  nxSync();   // v23w6
}
function aiFail(r, again) {
  const fix = ['off', 'nokey', 'noproxy', 'auth', 'model'].includes(r.code);
  openSheet({
    title: 'AI belum bisa dipakai', note: r.msg + '\n\nFitur lain dan teks yang sudah kamu ketik tidak terpengaruh.', pre: true,
    actions: [fix ? { label: 'Buka pengaturan AI', primary: true, fn: aiOpenSettings } : (again ? { label: 'Coba lagi', primary: true, fn: again } : null), closeBtn].filter(Boolean)
  });
}
function aiOpenSettings() {
  closeSheet(); aiOpen = true; showView('data');
  setTimeout(() => { const d = $('#aiDet'); if (d && d.scrollIntoView) d.scrollIntoView({ block: 'start' }); }, 60);
}
async function aiRun(o, done, again) {
  const rd = AI.ready();
  if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  openSheet({ title: '✦ AI sedang menyusun…', note: 'Biasanya 5 sampai 20 detik. Tekan Batal kapan saja; tidak ada yang berubah di datamu.', actions: [{ label: 'Batal', fn: () => { AI.cancel(); closeSheet(); } }], onClose: () => AI.cancel() });
  const r = await AI.ask(o);
  if (r.code === 'cancelled') return;
  if (!r.ok) { aiFail(r, again); return; }
  done(r);
}
/* --- obrolan ✦ Tanya AI (batch 10-3): panel layar penuh berbentuk bubble --- */
// Obrolan hanya ada di memori (hilang saat muat ulang atau Obrolan baru). Ringkasan data (DATA) hanya menempel pada pertanyaan terbaru, tidak masuk riwayat.
let chatCfgOpen = false, chatMsgs = [], chatBusy = false, chatBusyId = 0, chatTok = 0, chatId = 0, chatDraft = '', chatWaitT = null;
const CH_HIST_MAX = 16, CH_HIST_CHARS = 14000;   // riwayat yang dikirim: maks 16 pesan (8 putaran) dan ±14.000 huruf
const AI_OPEN_WEB = ' Kamu punya pencarian Google: pakai untuk fakta terbaru atau yang mudah berubah (berita, harga, jadwal, skor, versi, aturan), jangan untuk hal umum yang sudah kamu kuasai. Jangan menulis tautan mentah di jawaban; sumber ditampilkan terpisah oleh aplikasi.';
const AI_OPEN_NOWEB = ' Kamu tidak punya akses internet: untuk berita, harga, atau hal yang mungkin sudah berubah, katakan bahwa informasimu bisa usang.';
function aiSystem(free, web) {
  const d = ' Hari ini ' + dayLong(today()) + ' (menurut jam perangkat pengguna).';
  return free ? AI_OPEN + (web ? AI_OPEN_WEB : AI_OPEN_NOWEB) + d : AI_BASE + d;
}
const chatTier = () => adb.chatModel === 'fast' ? 'Cepat' : 'Pintar';

/* --- pemformat teks AI: markdown ringan, selalu di-escape dulu (tidak ada HTML dari AI yang lolos) --- */
const aiLink = (u, label) => '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
function aiMdInline(t) {
  const tk = [], keep = h => { tk.push(h); return '\u0001' + (tk.length - 1) + '\u0002'; };
  t = t.replace(/`([^`\n]+)`/g, (m, c) => keep('<code>' + c + '</code>'));
  t = t.replace(/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)/g, (m, a, u) => keep(aiLink(u, a)));
  t = t.replace(/https?:\/\/[^\s<>\u0001]+/g, u => {
    const m = u.match(/(?:[.,;:!?)\]]|&quot;|&#39;|&gt;|&lt;)+$/), tail = m ? m[0] : '', core = tail ? u.slice(0, -tail.length) : u;
    if (core.length < 9) return u;
    return keep(aiLink(core, core.length > 48 ? core.slice(0, 45).replace(/&[#\w]*$/, '') + '…' : core)) + tail;
  });
  t = t.replace(/\*\*(?=\S)([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[\s(])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?=$|[\s).,;:!?])/g, '$1<em>$2</em>');
  return t.replace(/\u0001(\d+)\u0002/g, (m, i) => tk[+i]);
}
function aiMd(src) {
  const L = esc(String(src).replace(/\r/g, '')).split('\n'), TB = /^\s*\|.*\|\s*$/;
  let h = '', i = 0, para = [], list = null;
  const flushP = () => { if (para.length) { h += '<p>' + para.map(aiMdInline).join('<br>') + '</p>'; para = []; } };
  const flushL = () => { if (list) { h += '<' + list.t + (list.t === 'ol' && list.s > 1 ? ' start="' + list.s + '"' : '') + '>' + list.i.map(x => '<li>' + aiMdInline(x) + '</li>').join('') + '</' + list.t + '>'; list = null; } };
  while (i < L.length) {
    const ln = L[i];
    if (/^\s*```/.test(ln)) {
      flushP(); flushL(); const code = []; i++;
      while (i < L.length && !/^\s*```/.test(L[i])) { code.push(L[i]); i++; }
      i++; h += '<pre><code>' + code.join('\n') + '</code></pre>'; continue;
    }
    if (/^\s*$/.test(ln)) { flushP(); flushL(); i++; continue; }
    if (/^\s*([-*_])\1{2,}\s*$/.test(ln)) { flushP(); flushL(); h += '<hr>'; i++; continue; }
    const hd = ln.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (hd) { flushP(); flushL(); h += '<p class="mdh">' + aiMdInline(hd[1]) + '</p>'; i++; continue; }
    if (TB.test(ln)) {
      flushP(); flushL(); const rows = [];
      while (i < L.length && TB.test(L[i])) { rows.push(L[i]); i++; }
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const sep = rows.length > 1 && /-/.test(rows[1]) && /^[\s:|-]+$/.test(rows[1]);
      const body = rows.slice(sep ? 2 : 0).map(r => '<tr>' + cells(r).map(c => '<td>' + aiMdInline(c) + '</td>').join('') + '</tr>').join('');
      h += '<div class="mdt"><table>' + (sep ? '<thead><tr>' + cells(rows[0]).map(c => '<th>' + aiMdInline(c) + '</th>').join('') + '</tr></thead>' : '') + '<tbody>' + body + '</tbody></table></div>';
      continue;
    }
    const bl = ln.match(/^\s*[-*•]\s+(.*)$/), nl = ln.match(/^\s*(\d{1,3})[.)]\s+(.*)$/);
    if (bl) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', i: [] }; } list.i.push(bl[1]); i++; continue; }
    if (nl) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', s: +nl[1], i: [] }; } list.i.push(nl[2]); i++; continue; }
    if (list && /^\s{2,}\S/.test(ln)) { list.i[list.i.length - 1] += '<br>' + ln.trim(); i++; continue; }   // lanjutan item daftar
    flushL(); para.push(ln.trim()); i++;
  }
  flushP(); flushL();
  return h;
}
async function aiCopy(text) {
  try { await navigator.clipboard.writeText(text); toast('Tersalin'); return; } catch (e) { /* cadangan di bawah */ }
  const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* abaikan */ }
  ta.remove(); toast(ok ? 'Tersalin' : 'Tidak bisa menyalin. Tekan lama teksnya untuk menyalin');
}

/* --- riwayat & konteks --- */
function chatFrom() { let k = 0; chatMsgs.forEach((m, i) => { if (m.r === 'sep') k = i + 1; }); return k; }   // indeks pesan pertama setelah garis pemisah terakhir
function chatHistory(upto) {   // hanya pasangan pertanyaan + jawaban yang utuh; pertanyaan yang gagal atau sedang menunggu tidak ikut. upto = hanya pesan sebelum indeks ini
  const out = [], end = upto == null ? chatMsgs.length : upto;
  for (let i = chatFrom(); i < end - 1; i++) {
    const a = chatMsgs[i], b = chatMsgs[i + 1];
    if (a.r === 'user' && b.r === 'model') { out.push({ role: 'user', text: a.text.slice(0, 1500) }, { role: 'model', text: b.text.slice(0, 2000) }); i++; }
  }
  let h = out.slice(-CH_HIST_MAX);
  while (h.length > 2 && h.reduce((s, x) => s + x.text.length, 0) > CH_HIST_CHARS) h = h.slice(2);
  return h;
}
const chatUserText = () => chatMsgs.slice(chatFrom()).filter(m => m.r === 'user').map(m => m.text).join('\n');
function chatSep(text) {
  const last = chatMsgs[chatMsgs.length - 1];
  if (last && last.r === 'sep') last.text = text; else chatMsgs.push({ id: ++chatId, r: 'sep', text });
  if (!$('#chat').hidden) chatPaint('end');
}

/* --- tampilan --- */
function chatBubble(m, last) {   // last = pesan paling akhir dan tidak sedang menunggu: hanya pesan ini yang punya Ulangi, Lanjutkan, dan saran
  if (m.r === 'sep') return '<div class="csep"><span>' + esc(m.text) + '</span></div>';
  if (m.r === 'user') return '<div class="cb u" data-id="' + m.id + '"><div class="bt">' + esc(m.text) + '</div></div>';
  if (m.r === 'err') {
    return '<div class="cb a e" data-id="' + m.id + '"><div class="bt"><b>AI belum bisa menjawab</b><br>' + esc(m.msg) + '<br><small>' + (m.regen || m.cont ? 'Jawaban sebelumnya tetap ada di atas.' : 'Pertanyaanmu tetap ada di atas.') + ' Fitur lain tidak terpengaruh.</small></div>' +
      '<div class="cact">' + (m.fix ? '<button class="btn sm primary" data-q="chatSettings">Buka pengaturan AI</button>' : '<button class="btn sm primary" data-q="chatRetry">Coba lagi</button>') + '</div></div>';
  }
  const warn = [];
  if (m.bad && m.bad.length) warn.push('⚠ Angka ini tidak ada di datamu: ' + m.bad.join(', ') + '. Anggap perkiraan AI dan cek dulu.');
  if (m.cut) warn.push('Jawaban terpotong karena terlalu panjang.');
  if (m.noWeb) warn.push('Pencarian web tidak tersedia untuk akunmu, jadi dijawab tanpa web.');
  return '<div class="cb a' + (chatBusy && chatBusyId === m.id ? ' dim' : '') + '" data-id="' + m.id + '"><div class="bt md">' + aiMd(m.text) + '</div>' +
    '<div class="cap">✦ AI (' + esc(m.tier) + ')' + (m.web ? ' · web' : '') + ' · bisa keliru, cek hal penting</div>' + warn.map(w => '<div class="cap warn">' + esc(w) + '</div>').join('') + chatSourcesHTML(m) +
    '<div class="cact"><button class="btn sm ghost" data-q="chatCopy" data-id="' + m.id + '">Salin</button>' +
    (last ? '<button class="btn sm ghost" data-q="chatRegen" data-id="' + m.id + '">Ulangi</button>' + (m.cut ? '<button class="btn sm primary" data-q="chatCont" data-id="' + m.id + '">Lanjutkan</button>' : '') : '') + '</div>' +
    (last && !m.cut ? chatFollowHTML(m) : '') + '</div>';
}
/* --- sumber web + Search Suggestions (wajib ditampilkan bila pencarian Google dipakai) --- */
function chatHost(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return String(u).slice(0, 40); } }
function chatSourcesHTML(m) {
  let h = '';
  if (m.src && m.src.length) h += '<div class="csrc"><div class="cap">Sumber web</div><div class="srcs">' + m.src.map(s => '<a class="srcchip" href="' + esc(s.uri) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title || chatHost(s.uri)) + '</a>').join('') + '</div></div>';
  if (m.entry) h += '<div class="cgse"><iframe class="gse" data-id="' + m.id + '" title="Saran pencarian Google" style="height:' + (m.eh || 44) + 'px" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>';   // tanpa allow-scripts: HTML dari luar tidak bisa menjalankan skrip
  else if (m.queries && m.queries.length) h += '<div class="csrc"><div class="cap">Dicari: ' + esc(m.queries.join(' · ')) + '</div></div>';
  return h;
}
const CH_GSE_HEAD = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:"><meta name="color-scheme" content="light dark"><base target="_blank"><style>html,body{margin:0;background:transparent}</style>';
function chatFrames() {   // HTML Search Suggestions dari Google diisi setelah gambar ulang; tinggi diukur lalu diingat agar tidak melompat
  $('#chatMsgs').querySelectorAll('iframe.gse').forEach(f => {
    const m = chatMsgs.find(x => String(x.id) === f.dataset.id); if (!m || !m.entry) return;
    f.addEventListener('load', () => {
      try { const d = f.contentDocument; if (d && d.documentElement) { m.eh = Math.min(Math.max(d.documentElement.scrollHeight, 36), 160); f.style.height = m.eh + 'px'; } } catch (e) { /* pakai tinggi bawaan */ }
    });
    f.srcdoc = CH_GSE_HEAD + m.entry;
  });
}
/* --- saran lanjutan: disusun lokal dari panjang jawaban dan gaya, tanpa memanggil AI; menekannya mengirim pertanyaan biasa --- */
function chatFollow(m) {
  const long = m.text.length > 700;
  if (adb.scope === 'data') return [long ? 'Ringkas jadi 3 poin' : 'Jelaskan lebih detail', 'Apa prioritas pertamanya?'];
  return long ? ['Ringkas jadi 3 poin', 'Jelaskan lebih sederhana', 'Beri contoh'] : ['Jelaskan lebih detail', 'Beri contoh', 'Apa langkah pertamanya?'];
}
function chatFollowHTML(m) { return '<div class="csug">' + chatFollow(m).map(t => '<button class="btn sm ghost" data-q="chatQuick" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>'; }
function chatEmptyHTML() {
  const pg = aiPage(), sc = adb.scope;
  const qs = sc === 'plain' ? ['Jelaskan apa itu defisit kalori', 'Ide menu sahur tinggi protein', 'Tips tidur lebih nyenyak'] : (AI_QUICK[pg.v] || []);
  const note = sc === 'plain' ? 'Tidak ada data log yang dikirim, hanya pertanyaanmu dan obrolan di layar ini.' :
    sc === 'open' ? 'Ringkasan datamu (sesuai pengaturan privasi) ikut dikirim sebagai konteks. Untuk pertanyaan umum, AI boleh mengabaikannya.' :
    'AI hanya menjawab dari ringkasan datamu. Angka di luar data ditandai peringatan.';
  return '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>Tanya apa saja</h4><p class="note">' + esc(note) + '</p>' +
    (qs.length ? '<div class="quick">' + qs.map(q => '<button class="btn sm ghost" data-q="chatQuick" data-t="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>' : '') + '</div>';
}
function chatHeadPaint() {
  const pg = aiPage(), sc = adb.scope;
  const lb = sc === 'plain' ? 'Tanpa data log: hanya pertanyaanmu yang dikirim' : 'Konteks: ' + pg.label + (pg.c.empty ? ' (belum ada data yang boleh dikirim)' : '');
  $('#chatCtx').innerHTML = '<span class="lb">' + esc(lb) + '</span>' + (sc === 'plain' || pg.c.empty ? '' : '<button data-q="chatPeek">Lihat data</button>');
  $('#chatNewBtn').hidden = !chatMsgs.some(m => m.r === 'user' || m.r === 'model');
}
const CH_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6.5 11.5L12 6l5.5 5.5"/></svg>';
const CH_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></svg>';
function chatBarPaint() {
  const b = $('#chatSend'); b.classList.toggle('stop', chatBusy); b.innerHTML = chatBusy ? CH_STOP : CH_SEND;
  b.setAttribute('aria-label', chatBusy ? 'Berhenti' : 'Kirim');
  $('#chatIn').placeholder = adb.scope === 'data' ? 'Tulis pertanyaan tentang datamu…' : 'Tanya apa saja…';
}
function chatPaint(stick) {   // stick: 'end' = turun ke bawah; kosong = tetap di bawah hanya bila memang sudah di bawah
  const box = $('#chatMsgs'); if (!box) return;
  const keep = box.scrollTop, near = box.scrollHeight - keep - box.clientHeight < 80;
  let h = chatMsgs.length ? chatMsgs.map((m, i) => chatBubble(m, !chatBusy && i === chatMsgs.length - 1)).join('') : chatEmptyHTML();
  if (chatBusy) h += '<div class="cb a" id="chatTyping"><div class="bt typing" aria-hidden="true"><i></i><i></i><i></i></div><div class="cap" id="chatWait">' + esc(chatWaitText(0)) + '</div></div>';
  box.innerHTML = h; chatFrames();
  chatHeadPaint(); chatBarPaint(); chatSetPaint();
  box.scrollTop = stick === 'end' || (stick == null && near) ? box.scrollHeight : keep;
}
function chatReveal(id) {   // jawaban panjang: tampilkan dari awalnya, bukan dari ujungnya
  const box = $('#chatMsgs'), el = box.querySelector('[data-id="' + id + '"]'); if (!el) return;
  box.scrollTop = el.offsetHeight > box.clientHeight * 0.75 ? Math.max(0, el.offsetTop - 8) : box.scrollHeight;
}
function chatGrow() { const t = $('#chatIn'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 132) + 'px'; }
function chatFit() {   // ikuti area yang terlihat saat keyboard HP muncul
  const c = $('#chat'); if (c.hidden) return;
  const vv = window.visualViewport;
  if (vv) { c.style.height = vv.height + 'px'; c.style.top = vv.offsetTop + 'px'; c.classList.toggle('kb', vv.height < window.innerHeight - 120); }
}
function chatLive(t) { const l = $('#chatLive'); if (l) l.textContent = t; }
const chatWaitText = s => s < 12 ? 'Menyusun jawaban…' : s < 40 ? (adb.chatModel === 'fast' ? 'Masih menyusun…' : 'Model Pintar kadang butuh waktu lebih lama. Masih menyusun…') : 'Masih mencoba. Tekan tombol berhenti bila ingin membatalkan.';
function chatWaitStart() {
  chatWaitStop(); const t0 = Date.now();
  chatWaitT = setInterval(() => { const el = $('#chatWait'), t = chatWaitText((Date.now() - t0) / 1000); if (el && el.textContent !== t) el.textContent = t; }, 1000);
}
function chatWaitStop() { if (chatWaitT) { clearInterval(chatWaitT); chatWaitT = null; } }

/* --- panel Atur (gaya, model, web) dan salin seluruh obrolan --- */
function chatSetPaint() {
  const el = $('#chatSet'), btn = $('#chatCfgBtn'); if (!el) return;
  btn.setAttribute('aria-expanded', String(chatCfgOpen)); el.hidden = !chatCfgOpen;
  if (!chatCfgOpen) return;
  const sc = adb.scope, lock = chatBusy, has = chatMsgs.some(m => m.r === 'user' || m.r === 'model');
  const pill = (f, v, on, t, dis) => '<button class="pill" data-q="chatPick" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + on + '"' + (lock || dis ? ' disabled' : '') + '>' + esc(t) + '</button>';
  el.innerHTML = '<div class="lbl">Gaya jawaban</div><div class="seg tri">' + Object.keys(AI_SCOPES).map(k => pill('scope', k, sc === k, AI_SCOPES[k].t)).join('') + '</div><p class="note">' + esc(AI_SCOPES[sc].n) + '</p>' +
    '<div class="lbl">Model</div><div class="seg">' + pill('cm', 'pro', adb.chatModel !== 'fast', 'Pintar (Pro)') + pill('cm', 'fast', adb.chatModel === 'fast', 'Cepat') + '</div>' +
    '<div class="lbl">Pencarian web (Google)</div><div class="seg">' + pill('web', '0', !adb.web, 'Mati', sc === 'data') + pill('web', '1', adb.web, 'Nyala', sc === 'data') + '</div>' +
    (sc === 'data' ? '<p class="note">Web tidak dipakai pada gaya Hanya data.</p>' : '') +
    (lock ? '<p class="note">Pengaturan dikunci selagi AI menyusun jawaban. Tekan berhenti bila ingin mengubahnya.</p>' : '<p class="note">Berlaku untuk pertanyaan berikutnya. Untuk jawaban terakhir, ubah lalu tekan Ulangi.</p>') +
    '<div class="quick"><button class="btn sm" data-q="chatCopyAll"' + (has ? '' : ' disabled') + '>Salin seluruh obrolan</button><button class="btn sm ghost" data-q="chatSettings">Pengaturan lengkap</button></div>';
}
function chatTranscript() {   // teks seluruh obrolan di layar (tanpa galat); sumber web ikut dicantumkan
  const L = [];
  chatMsgs.forEach(m => {
    if (m.r === 'user') L.push('Aku: ' + m.text);
    else if (m.r === 'model') L.push('AI (' + m.tier + (m.web ? ', web' : '') + '): ' + m.text + (m.src && m.src.length ? '\n\nSumber: ' + m.src.map(s => (s.title || chatHost(s.uri)) + ' <' + s.uri + '>').join('; ') : ''));
    else if (m.r === 'sep') L.push('— ' + m.text + ' —');
  });
  return L.length ? 'Obrolan ✦ Tanya AI · ' + dayLong(today()) + '\n\n' + L.join('\n\n') : '';
}

/* --- alur --- */
function chatOpen() {
  const rd = AI.ready(); if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  $('#chat').hidden = false; document.body.classList.add('chatlock');
  chatCfgOpen = false; $('#chatIn').value = chatDraft; chatGrow(); chatFit(); chatPaint('end');
  if (matchMedia('(pointer:fine)').matches) $('#chatIn').focus();   // di HP tidak otomatis fokus agar keyboard tidak menutupi saran
}
function chatClose() {
  if (chatBusy) chatStop();
  chatDraft = $('#chatIn').value;
  $('#chat').hidden = true; document.body.classList.remove('chatlock');
}
function chatStop() {   // batal: pertanyaan dikembalikan ke kotak tulis, tidak ada yang hilang
  if (!chatBusy) return;
  chatTok++; AI.cancel(); chatBusy = false; chatWaitStop();
  const m = chatMsgs[chatMsgs.length - 1];
  if (m && m.r === 'user') {
    chatMsgs.pop();
    const inp = $('#chatIn'), cur = inp.value.trim();
    inp.value = cur ? m.text + '\n\n' + cur : m.text; chatDraft = inp.value; chatGrow();
  }
  chatPaint('end'); toast(m && m.r === 'user' ? 'Dibatalkan. Pertanyaanmu kembali ke kotak tulis' : 'Dibatalkan. Jawaban sebelumnya tetap ada');
}
function chatReset() {
  chatTok++; if (chatBusy) AI.cancel(); chatBusy = false; chatWaitStop();
  chatMsgs = []; chatDraft = '';
  const c = $('#chat'); if (c && !c.hidden) { $('#chatIn').value = ''; chatGrow(); chatPaint('end'); }
}
function chatSend(q0, keepInput) {
  if (chatBusy) return;
  const q = String(q0 == null ? '' : q0).trim();
  if (!q) { toast('Tulis pertanyaan dulu'); return; }
  const rd = AI.ready(); if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  chatMsgs = chatMsgs.filter(m => m.r !== 'err');
  chatMsgs.push({ id: ++chatId, r: 'user', text: q.slice(0, 4000) });
  if (!keepInput) { $('#chatIn').value = ''; chatDraft = ''; chatGrow(); }
  chatAsk();
}
const CH_CONT = 'Lanjutkan jawabanmu tepat dari titik terakhir yang terpotong. Jangan mengulang bagian yang sudah ditulis, jangan membuka dengan salam atau kata pengantar, dan selesaikan jawabannya dengan ringkas.';
// opt kosong = jawab pertanyaan terakhir; {regen: id} = jawab ulang pertanyaan di atas jawaban terakhir (jawaban lama tetap tampil sampai yang baru sukses); {cont: id} = sambung jawaban terakhir yang terpotong (tanpa web)
async function chatAsk(opt) {
  opt = opt || {};
  const tid = opt.regen || opt.cont || 0;
  let qi = chatMsgs.length - 1, mi = -1;
  if (tid) {
    mi = chatMsgs.findIndex(m => m.id === tid && m.r === 'model');
    if (mi < 1 || mi !== chatMsgs.length - 1 || chatMsgs[mi - 1].r !== 'user') return;   // hanya jawaban paling akhir
    qi = mi - 1;
  }
  const qm = chatMsgs[qi];
  if (!qm || qm.r !== 'user') return;
  const old = mi >= 0 ? chatMsgs[mi] : null, cont = !!opt.cont;
  const pg = aiPage(), sc = adb.scope, free = sc !== 'data', tok = ++chatTok;
  const pro = cont && typeof old.pro === 'boolean' ? old.pro : adb.chatModel !== 'fast';
  const web = cont ? false : aiWebOn();
  const mdl = cont && old.mdl ? old.mdl : aiChatModel(), tier = cont && old.tier ? old.tier : chatTier();   // tingkat dan model diambil saat dikirim, bukan saat jawaban tiba
  const useData = sc !== 'plain' && !(sc === 'open' && pg.c.empty);
  const q = cont ? CH_CONT : qm.text;
  const user = useData ? 'DATA:\n' + pg.c.text + '\n\nPERTANYAAN:\n' + q : q;
  const basis = pg.c.text + '\n' + dayLong(today()) + '\n' + chatUserText();
  const hist = chatHistory(qi);
  if (cont) hist.push({ role: 'user', text: qm.text.slice(0, 1500) }, { role: 'model', text: old.text.slice(-8000) });
  chatBusy = true; chatBusyId = opt.regen || 0; chatWaitStart(); chatPaint('end');
  const r = await AI.ask({ task: 'ask', system: aiSystem(free, web), user, history: hist, model: mdl, web, max: pro ? 2000 : (free ? 1200 : 900), think: pro ? 8000 : 2048, timeout: pro ? 90000 : 60000 });
  if (tok !== chatTok) return;   // dibatalkan, direset, atau panel ditutup selagi menunggu
  chatBusy = false; chatWaitStop();
  if (r.code === 'cancelled') { chatBusy = true; chatStop(); return; }
  if (r.ok) {
    let nid;
    if (cont) {
      const t0 = old.text.replace(/\s+$/, ''), j = /^[\s.,;:!?)\]%]/.test(r.text) ? '' : /^(?:[-*•]\s|\d{1,3}[.)]\s)/.test(r.text) ? '\n' : (/[.!?:]$/.test(t0) ? '\n\n' : ' ');   // AI.ask memangkas spasi awal, jadi poin daftar disambung dengan satu baris baru
      old.text = t0 + j + r.text; old.cut = !!r.cut; old.cont = (old.cont || 0) + 1; old.bad = free ? [] : aiCheck(old.text, basis); nid = old.id;
    } else {
      nid = ++chatId;
      const nm = { id: nid, r: 'model', text: r.text, tier, mdl, pro, bad: free ? [] : aiCheck(r.text, basis), cut: !!r.cut, noWeb: !!r.noWeb, web: web && !r.noWeb, src: r.src || [], queries: r.queries || [], entry: r.entry || '' };
      if (old) chatMsgs[mi] = nm; else chatMsgs.push(nm);
    }
    if (cont) chatPaint('end'); else { chatPaint(); chatReveal(nid); }
    chatLive(cont ? 'Lanjutan jawaban sudah tampil' : 'Jawaban AI sudah tampil');
  } else {
    chatMsgs.push({ id: ++chatId, r: 'err', code: r.code, msg: r.msg || 'Terjadi kesalahan.', fix: ['off', 'nokey', 'noproxy', 'auth', 'model'].includes(r.code), regen: opt.regen || 0, cont: opt.cont || 0 });
    chatPaint('end'); chatLive('AI belum bisa menjawab');
  }
}
QACT.aiAsk = () => chatOpen();
QACT.chatClose = () => chatClose();
QACT.chatSend = () => { if (chatBusy) chatStop(); else chatSend($('#chatIn').value); };
QACT.chatQuick = el => chatSend(el.dataset.t, true);
QACT.chatRetry = () => { if (chatBusy) return; const e = chatMsgs.find(m => m.r === 'err'); chatMsgs = chatMsgs.filter(m => m.r !== 'err'); chatAsk(e && e.regen ? { regen: e.regen } : e && e.cont ? { cont: e.cont } : undefined); };
QACT.chatRegen = el => { if (!chatBusy) chatAsk({ regen: +el.dataset.id }); };
QACT.chatCont = el => { if (!chatBusy) chatAsk({ cont: +el.dataset.id }); };
QACT.chatCopy = el => { const m = chatMsgs.find(x => String(x.id) === el.dataset.id); if (m) aiCopy(m.text); };
QACT.chatSettings = () => { chatClose(); aiOpenSettings(); };
QACT.chatCfg = () => { chatCfgOpen = !chatCfgOpen; chatSetPaint(); };
/* TNX-1-begin: status header, orb hidup hanya saat AI menyusun, tombol "Ke pesan terbaru" (tampilan saja; alur obrolan tidak diubah) */
(function () {
  const base = chatBarPaint, box = $('#chatMsgs'), jb = $('#chatJump');
  const upd = () => { const c = $('#chat'); if (jb && box && c) jb.classList.toggle('on', !c.hidden && box.scrollHeight - box.scrollTop - box.clientHeight > 160); };
  chatBarPaint = function () {
    base();
    const c = $('#chat'); if (!c) return;
    c.classList.toggle('busy', !!chatBusy);
    const st = $('#chatSt'); if (st) st.textContent = chatBusy ? 'Menyusun jawaban…' : 'Siap membantu';
    requestAnimationFrame(upd);
  };
  if (box) box.addEventListener('scroll', upd, { passive: true });
  QACT.chatJump = () => { box.scrollTo({ top: box.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
})();
/* TNX-1-end */


QACT.chatPick = el => {
  if (chatBusy) { toast('Tunggu jawaban selesai, atau tekan berhenti dulu'); return; }
  const f = el.dataset.f, v = el.dataset.v, k = f + '|' + v;
  if (f === 'scope') aiSetScope(v); else if (f === 'cm') adb.chatModel = v === 'fast' ? 'fast' : 'pro'; else if (f === 'web') adb.web = v === '1';
  aiSave(); chatPaint(); renderAiBox();
  const nb = [...$('#chatSet').querySelectorAll('[data-f]')].find(b => b.dataset.f + '|' + b.dataset.v === k); if (nb && !nb.disabled) nb.focus();   // fokus tetap di pilihan yang diketuk (papan ketik)
};
QACT.chatCopyAll = () => { const t = chatTranscript(); if (!t) { toast('Belum ada obrolan'); return; } aiCopy(t); };
QACT.chatPeek = () => {
  const pg = aiPage();
  openSheet({ title: 'Data yang akan dikirim', note: 'Hanya teks ini, pertanyaanmu, dan obrolan di layar ini yang dikirim. Angka dihitung di perangkat ini.', text: pg.c.text, prose: true, actions: [closeBtn] });
};
QACT.chatNew = () => {
  if (!chatMsgs.length) return;
  openSheet({ title: 'Mulai obrolan baru?', note: 'Obrolan di layar ini dihapus dan tidak tersimpan di mana pun.', actions: [closeBtn, { label: 'Hapus obrolan', danger: true, fn: () => { closeSheet(); chatReset(); } }] });
};
{
  const inp = $('#chatIn');
  inp.addEventListener('input', () => { chatDraft = inp.value; chatGrow(); });
  inp.addEventListener('keydown', e => {   // di komputer Enter mengirim (Shift+Enter baris baru); di HP Enter = baris baru
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); QACT.chatSend(); }
  });
  inp.addEventListener('focus', () => setTimeout(() => { const b = $('#chatMsgs'); if (b.scrollHeight - b.scrollTop - b.clientHeight < 200) b.scrollTop = b.scrollHeight; }, 300));
  if (window.visualViewport) { visualViewport.addEventListener('resize', chatFit); visualViewport.addEventListener('scroll', chatFit); }
  window.addEventListener('resize', chatFit);
  // fase capture: berjalan sebelum pendengar Escape milik sheet, jadi Escape saat sheet terbuka hanya menutup sheet
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#chat').hidden && $('#sheet').hidden) { if (chatCfgOpen) { chatCfgOpen = false; chatSetPaint(); } else chatClose(); } }, true);
}

/* DL-SYNC-BEGIN (S3c, v104) */
/* Daily Log: modul klien SINKRON (S3b, versi "c1"). Satu berkas, tanpa dependensi; jalan di peramban dan Node 20+.
 *
 * Tugas: kata sandi -> kunci (PBKDF2-SHA256 600.000 putaran, garam 16 byte dari server) -> kompres (gzip bila ada) ->
 * enkripsi AES-256-GCM (IV acak 12 byte; AAD = "dl1|<nomor revisi>") -> kirim ke Worker S3a; dan sebaliknya.
 * Server tidak pernah melihat kata sandi, kunci, atau isi. Kata sandi salah = dekripsi gagal (tag GCM), bukan tebakan.
 *
 * Penggabungan TIDAK ditulis ulang di sini: pemanggil memberi getLocal() (teks cadangan JSON) dan applyRemote(teks)
 * (aplikasi memakai mergeImport yang hanya menambah/memperbarui, tidak pernah menghapus data lokal).
 *
 * Aturan "unggah hanya bila ada perubahan SENDIRI": hash kanonik (kunci diurutkan, tanpa "exported") dibandingkan dengan
 * hash saat sinkron terakhir, DIHITUNG SEBELUM menggabung data dari server. Tanpa aturan ini dua perangkat yang urutan
 * array-nya berbeda akan saling mengunggah tanpa henti (ping-pong).
 *
 * Pemakaian:
 *   const s = DLSync.create({ url, token, getLocal, applyRemote, isEmpty, load, save, fetch?, iter? });
 *   s.setPassword('kata sandi'); const r = await s.run();   // r.action: none | pulled | pushed | merged
 */
(function (root) {
  'use strict';
  const VER = 'c1', FMT = 'dl1', ITER = 600000, SALT_LEN = 16, IV_LEN = 12, MAX_PLAIN = 64 * 1024 * 1024;
  const enc = new TextEncoder(), dec = new TextDecoder('utf-8', { fatal: true });
  const TOK_RE = /^[A-Za-z0-9\-_.~+/=]{24,200}$/;
  const SALT_RE = /^[A-Za-z0-9_-]{22}$/, IV_RE = /^[A-Za-z0-9_-]{16}$/;
  const MSG = {
    no_password: 'Masukkan kata sandi sinkron dulu.',
    bad_password: 'Kata sandi salah, atau data di server rusak atau sudah diubah pihak lain.',
    bad_url: 'Alamat server harus diawali https:// (atau http://localhost untuk uji).',
    bad_token: 'Token perangkat tidak valid (24 sampai 200 karakter dari huruf, angka, dan - _ . ~ + / =).',
    network: 'Tidak bisa menghubungi server. Cek koneksi dan alamat server.',
    timeout: 'Server tidak menjawab tepat waktu.',
    unauthorized: 'Token perangkat salah atau sudah dicabut.',
    forbidden: 'Server menolak asal aplikasi ini. Periksa ALLOWED_ORIGINS di Worker.',
    rate_limited: 'Terlalu banyak permintaan. Coba lagi sebentar.',
    db_not_ready: 'Basis data di server belum disiapkan (jalankan schema.sql di D1 dan pasang binding DB).',
    server: 'Server bermasalah. Coba lagi nanti.',
    too_large: 'Data terlalu besar untuk server.',
    bad_response: 'Jawaban server tidak dikenali. Apakah alamatnya benar?',
    corrupt: 'Data di server tidak utuh.',
    unsupported: 'Peramban ini tidak mendukung kompresi yang dipakai data di server.',
    rollback: 'Revisi di server LEBIH LAMA dari yang pernah dilihat perangkat ini. Server mungkin dikembalikan ke versi lama. Tidak ada yang diubah.',
    server_reset: 'Server kosong padahal perangkat ini pernah sinkron. Data lokal aman. Mulai ulang sinkron bila memang disengaja.',
    conflict_exhausted: 'Server terus berubah selama sinkron. Coba lagi.',
    merge_failed: 'Data dari server tidak bisa digabungkan. Tidak ada yang diunggah.',
    conflict: 'Server sudah punya revisi yang lebih baru.',
    salt_mismatch: 'Garam kata sandi berbeda dengan yang ada di server.',
    not_found: 'Tidak ditemukan di server.'
  };
  class SyncError extends Error {
    constructor(code, extra) { super(MSG[code] || code); this.name = 'SyncError'; this.code = code; if (extra) Object.assign(this, extra); }
  }

  /* ---------- base64url ---------- */
  function b64uEnc(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64uDec(str) {
    if (typeof str !== 'string' || !/^[A-Za-z0-9_-]*$/.test(str) || str.length % 4 === 1) throw new SyncError('corrupt');
    const s = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ---------- kompresi ---------- */
  async function readAll(stream, cap) {
    const rd = stream.getReader(), parts = []; let n = 0;
    for (;;) {
      const r = await rd.read();
      if (r.done) break;
      n += r.value.length;
      if (n > cap) { try { await rd.cancel(); } catch (e) { /* abaikan */ } throw new SyncError('corrupt'); }
      parts.push(r.value);
    }
    const out = new Uint8Array(n); let o = 0;
    parts.forEach(p => { out.set(p, o); o += p.length; });
    return out;
  }
  async function gzip(u8) { return readAll(new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip')), MAX_PLAIN + 1024); }
  async function gunzip(u8) {
    if (typeof DecompressionStream === 'undefined') throw new SyncError('unsupported');
    try { return await readAll(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip')), MAX_PLAIN); }
    catch (e) { throw e instanceof SyncError ? e : new SyncError('corrupt'); }
  }

  /* ---------- kunci, segel, buka ---------- */
  async function deriveKey(password, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(password).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter || ITER }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const aad = rev => enc.encode(FMT + '|' + rev);
  const okRev = r => Number.isInteger(r) && r >= 1 && r <= 999999999;
  async function seal(key, text, rev) {
    if (!okRev(rev)) throw new SyncError('bad_response');
    const raw = enc.encode(text);
    let flag = 0, body = raw;
    if (typeof CompressionStream !== 'undefined') {
      try { const z = await gzip(raw); if (z.length < raw.length) { flag = 1; body = z; } } catch (e) { /* tanpa kompresi */ }
    }
    const plain = new Uint8Array(body.length + 1); plain[0] = flag; plain.set(body, 1);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(rev), tagLength: 128 }, key, plain));
    return { iv: b64uEnc(iv), body: b64uEnc(ct), bytes: ct.length };
  }
  async function open(key, bodyStr, ivStr, rev) {
    if (!okRev(rev) || !IV_RE.test(String(ivStr))) throw new SyncError('corrupt');
    const ct = b64uDec(bodyStr), iv = b64uDec(ivStr);
    let plain;
    try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad(rev), tagLength: 128 }, key, ct)); }
    catch (e) { throw new SyncError('bad_password'); }
    if (!plain.length) throw new SyncError('corrupt');
    let raw;
    if (plain[0] === 1) raw = await gunzip(plain.subarray(1));
    else if (plain[0] === 0) raw = plain.subarray(1);
    else throw new SyncError('corrupt');
    try { return dec.decode(raw); } catch (e) { throw new SyncError('corrupt'); }
  }

  /* ---------- hash kanonik ---------- */
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  function dropPath(o, p) {   // "a.b.c" membuang o.a.b.c (hanya untuk penentuan hash; data yang dikirim TIDAK diubah); jalur yang tak ada diabaikan
    const a = p.split('.');
    let x = o;
    for (let i = 0; i < a.length - 1 && x && typeof x === 'object'; i++) x = x[a[i]];
    if (x && typeof x === 'object' && !Array.isArray(x)) delete x[a[a.length - 1]];
  }
  async function canonHash(text, drop) {
    let s = text;
    try {
      const o = JSON.parse(text);
      if (o && typeof o === 'object' && !Array.isArray(o)) { delete o.exported; (drop || []).forEach(k => dropPath(o, String(k))); }
      s = stable(o);
    } catch (e) { /* bukan JSON: hash teks apa adanya */ }
    const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
    return Array.from(d, b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- aliran data ---------- */
  function normUrl(u) {
    const s = String(u || '').trim().replace(/\/+$/, '');
    if (!/^(https:\/\/[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:\d{1,5})?|http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?)$/.test(s)) throw new SyncError('bad_url');
    return s;
  }
  function normState(s) {
    s = s && typeof s === 'object' ? s : {};
    return {
      rev: Number.isInteger(s.rev) && s.rev >= 0 ? s.rev : 0,
      hash: typeof s.hash === 'string' && /^[0-9a-f]{64}$/.test(s.hash) ? s.hash : null,
      salt: typeof s.salt === 'string' && SALT_RE.test(s.salt) ? s.salt : null,
      ts: Number.isFinite(s.ts) ? s.ts : 0
    };
  }

  function create(o) {
    if (!o || typeof o.getLocal !== 'function' || typeof o.applyRemote !== 'function') throw new TypeError('getLocal dan applyRemote wajib');
    const tok = String(o.token || '').trim();
    if (!TOK_RE.test(tok)) throw new SyncError('bad_token');
    const cfg = { url: normUrl(o.url), token: tok, fetch: o.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null), iter: o.iter || ITER, timeout: o.timeout || 30000, maxTry: o.maxTry || 4, drop: o.drop || [] };
    if (!cfg.fetch) throw new SyncError('network');
    const getLocal = o.getLocal, applyRemote = o.applyRemote, isEmpty = o.isEmpty || (() => false);
    const load = o.load || (async () => null), save = o.save || (async () => {});
    const nowMs = o.now || (() => Date.now());
    let password = null, running = null;
    const keys = new Map();

    async function http(method, path, opt) {
      opt = opt || {};
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), cfg.timeout);
      let res, text;
      try {
        const headers = Object.assign({}, opt.auth === false ? {} : { Authorization: 'Bearer ' + cfg.token }, opt.headers || {});
        res = await cfg.fetch(cfg.url + path, { method, headers, body: opt.body, signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
        text = await res.text();
      } catch (e) {
        throw new SyncError(ctl.signal.aborted ? 'timeout' : 'network');
      } finally { clearTimeout(tm); }
      const out = { status: res.status, text, headers: res.headers, json: null };
      if (!opt.raw || res.status !== 200) { try { out.json = JSON.parse(text); } catch (e) { out.json = null; } }
      return out;
    }
    function fail(r) {   // pemetaan status/galat server -> kode
      const code = r.json && typeof r.json.error === 'string' ? r.json.error : '';
      if (r.status === 401) return new SyncError('unauthorized');
      if (r.status === 403) return new SyncError('forbidden');
      if (r.status === 429) { const ra = Number(r.headers.get('Retry-After')); return new SyncError('rate_limited', { retryAfter: Number.isFinite(ra) && ra > 0 ? ra : 60 }); }
      if (r.status === 413) return new SyncError('too_large');
      if (r.status === 404) return new SyncError('not_found');
      if (r.status === 503 && code === 'db_not_ready') return new SyncError('db_not_ready');
      if (r.status >= 500) return new SyncError(code === 'corrupt' ? 'corrupt' : 'server');
      return new SyncError('bad_response', { status: r.status });
    }
    async function getHead() {
      const r = await http('GET', '/sync/head');
      if (r.status !== 200) throw fail(r);
      const j = r.json;
      if (!j || typeof j !== 'object' || !Number.isInteger(j.rev) || j.rev < 0 || (j.salt !== null && !SALT_RE.test(String(j.salt))) || (j.rev > 0 && !IV_RE.test(String(j.iv)))) throw new SyncError('bad_response');
      return { rev: j.rev, dev: j.dev || null, ts: Number(j.ts) || 0, bytes: Number(j.bytes) || 0, iv: j.iv || null, salt: j.salt || null };
    }
    async function getSnap(rev) {
      const r = await http('GET', '/sync/snap/' + rev, { raw: true });
      if (r.status !== 200) throw fail(r);
      if (r.headers.get('X-DL-Rev') !== String(rev)) throw new SyncError('corrupt');
      return { text: r.text, iv: r.headers.get('X-DL-IV') };
    }
    async function keyFor(saltStr) {
      if (password === null) throw new SyncError('no_password');
      let k = keys.get(saltStr);
      if (!k) { k = await deriveKey(password, b64uDec(saltStr), cfg.iter); keys.set(saltStr, k); }
      return k;
    }
    async function putSnap(base, sealed, salt) {
      const r = await http('PUT', '/sync/snap', { body: sealed.body, headers: { 'X-DL-Base': String(base), 'X-DL-IV': sealed.iv, 'X-DL-Salt': salt, 'Content-Type': 'text/plain' } });
      if (r.status === 200 && r.json && r.json.ok === true && Number.isInteger(r.json.rev)) return { ok: true, rev: r.json.rev };
      if (r.status === 409 && r.json && r.json.error === 'conflict') return { ok: false, conflict: true };
      if (r.status === 409 && r.json && r.json.error === 'salt_mismatch') return { ok: false, conflict: true, salt: true };
      throw fail(r);
    }

    async function runInner() {
      if (password === null) throw new SyncError('no_password');
      let st = normState(await load());
      const hash0 = await canonHash(await getLocal(), cfg.drop);
      const empty0 = !!(await isEmpty());
      const own = !empty0 && hash0 !== st.hash;   // perubahan SENDIRI sejak sinkron terakhir (dihitung sebelum menggabung apa pun)
      let pulled = 0, merge = null, newSalt = null, tries = 0;
      for (;;) {
        if (++tries > cfg.maxTry) throw new SyncError('conflict_exhausted');
        const head = await getHead();
        if (head.rev < st.rev) throw new SyncError(head.rev === 0 ? 'server_reset' : 'rollback');
        const pull = head.rev > st.rev, need = head.rev === 0 ? !(await isEmpty()) : own;
        if (!pull && !need) return { action: 'none', rev: st.rev, pulled, pushed: false, merge, tries };   // tanpa menurunkan kunci (mahal)
        let saltStr = head.salt;
        if (!saltStr) { newSalt = newSalt || b64uEnc(crypto.getRandomValues(new Uint8Array(SALT_LEN))); saltStr = newSalt; }
        const key = await keyFor(saltStr);
        if (pull) {   // ada revisi baru: tarik, buka, gabung
          const snap = await getSnap(head.rev);
          if (snap.iv !== head.iv) throw new SyncError('corrupt');
          const text = await open(key, snap.text, snap.iv, head.rev);
          try { merge = await applyRemote(text, { rev: head.rev }); } catch (e) { throw new SyncError('merge_failed', { cause: e }); }
          pulled++;
          st = { rev: head.rev, hash: st.hash, salt: saltStr, ts: st.ts };
        }
        if (!need) {
          const h = await canonHash(await getLocal(), cfg.drop);
          st = { rev: head.rev, hash: h, salt: saltStr, ts: nowMs() };
          await save(st);
          return { action: 'pulled', rev: st.rev, pulled, pushed: false, merge, tries };
        }
        const text = await getLocal(), h = await canonHash(text, cfg.drop);
        const sealed = await seal(key, text, head.rev + 1);
        const r = await putSnap(head.rev, sealed, saltStr);
        if (r.ok) {
          st = { rev: r.rev, hash: h, salt: saltStr, ts: nowMs() };
          await save(st);
          return { action: pulled ? 'merged' : 'pushed', rev: r.rev, pulled, pushed: true, merge, tries, bytes: sealed.bytes };
        }
        // 409: ada perangkat lain yang menang lebih dulu; ulang (tarik, gabung, unggah)
      }
    }

    return {
      version: VER,
      setPassword(pw) { if (typeof pw !== 'string' || !pw.length) throw new SyncError('no_password'); password = pw; keys.clear(); },
      hasPassword() { return password !== null; },
      forget() { password = null; keys.clear(); },
      run() {
        if (running) return running;
        running = (async () => { try { return await runInner(); } finally { running = null; } })();
        return running;
      },
      async check() {
        const h = await http('GET', '/health', { auth: false });
        if (h.status !== 200 || !h.json || h.json.ok !== true) throw h.status === 403 ? new SyncError('forbidden') : (h.status >= 500 || h.status === 0 ? new SyncError('server') : new SyncError('bad_response'));
        if (h.json.db !== true) throw new SyncError('db_not_ready');
        const m = await http('GET', '/sync/me');
        if (m.status !== 200 || !m.json) throw fail(m);
        const hd = await getHead();
        return { ok: true, dev: m.json.dev || null, rev: hd.rev, hasData: hd.rev > 0, hasSalt: !!hd.salt, ts: hd.ts, bytes: hd.bytes, lastDev: hd.dev };
      },
      async verify() {   // kata sandi cocok dengan data di server? (tanpa menggabung)
        if (password === null) throw new SyncError('no_password');
        const hd = await getHead();
        if (hd.rev === 0) return { ok: true, empty: true };
        const key = await keyFor(hd.salt || (() => { throw new SyncError('corrupt'); })());
        const snap = await getSnap(hd.rev);
        if (snap.iv !== hd.iv) throw new SyncError('corrupt');
        await open(key, snap.text, snap.iv, hd.rev);
        return { ok: true, empty: false, rev: hd.rev };
      },
      async history() {
        const r = await http('GET', '/sync/history');
        if (r.status !== 200 || !r.json || !Array.isArray(r.json.items)) throw fail(r);
        return r.json.items;
      },
      async wipe() {
        const r = await http('DELETE', '/sync/all', { headers: { 'X-DL-Confirm': 'hapus-semua' } });
        if (r.status !== 200 || !r.json || r.json.ok !== true) throw fail(r);
        await save(normState(null));
        keys.clear();
        return true;
      },
      async resetState() { await save(normState(null)); },
      state: async () => normState(await load())
    };
  }

  /* ---------- kekuatan kata sandi (hanya saran untuk UI) ---------- */
  function strength(pw) {
    pw = String(pw || '');
    const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
    const uniq = new Set(pw).size;
    if (pw.length < 10 || uniq < 5) return { level: 0, label: 'Terlalu pendek: pakai minimal 10 karakter.' };
    if (pw.length >= 16 || (pw.length >= 12 && kinds >= 3)) return { level: 2, label: 'Kuat.' };
    return { level: 1, label: 'Cukup. Lebih panjang lebih baik: kata sandi ini melindungi semua datamu bila server bocor.' };
  }

  root.DLSync = Object.freeze({ VER, ITER, create, SyncError, MSG, strength, _t: Object.freeze({ b64uEnc, b64uDec, gzip, gunzip, deriveKey, seal, open, canonHash, stable, normUrl, normState }) });
})(typeof globalThis !== 'undefined' ? globalThis : this);
/* --- Sinkron antar perangkat (S3c, v104): panel di Pengaturan > Cadangan. Memakai DLSync (modul S3b) di atas. ---
   Data baru `dailylog:sync:v1` (alamat, token, status sinkron) dan `dailylog:syncpre:v1` (satu cadangan lokal sebelum sinkron terakhir
   yang mengubah data): khusus perangkat, TIDAK ikut ekspor JSON. KATA SANDI TIDAK PERNAH DISIMPAN: hanya di memori sampai aplikasi ditutup. */
const KEY_SY = 'dailylog:sync:v1', KEY_SYPRE = 'dailylog:syncpre:v1';
let sdb = { url: '', token: '', st: null, last: null }, syLoaded = false, syObj = null, syObjKey = '', syPw = null, syBusy = '', syMsg = null, syOpen = false, syClearPw = false;
let syLoadP = null;
function syLoad() { return syLoadP || (syLoadP = syLoadInner()); }
async function syLoadInner() {
  try {
    const o = await store.load(KEY_SY);
    if (o && typeof o === 'object' && !Array.isArray(o)) sdb = { url: String(o.url || '').slice(0, 300), token: String(o.token || '').slice(0, 300), st: o.st && typeof o.st === 'object' ? o.st : null, last: o.last && typeof o.last === 'object' ? o.last : null };
  } catch (e) { /* belum ada */ }
  syLoaded = true;
  return sdb;
}
const sySaveDb = () => store.save(KEY_SY, sdb);
function syReady() { return !!(sdb.url && sdb.token); }
function syStatus() {
  if (!syLoaded) return '…';
  if (!syReady()) return 'Belum diatur';
  if (sdb.st && sdb.st.rev > 0) return 'Revisi ' + sdb.st.rev + (syPw === null ? ' · sandi dibutuhkan' : '');
  return syPw === null ? 'Alamat diisi · sandi dibutuhkan' : 'Siap';
}
async function syApply(text) {   // dipanggil DLSync saat ada revisi baru dari server; hanya menggabung (mergeImport tidak pernah menghapus)
  await exEnsure();   // v106a
  const obj = parseBackup(text);
  if (typeof obj === 'string') throw new Error(obj);
  exSyncMode = true; let p; try { p = mergeImport(obj, false); } finally { exSyncMode = false; }   // v107f: pratinjau sinkron juga mode sinkron
  if (!hasMerge(p)) return { same: true };
  const pre = backupText();
  await store.save(KEY_SYPRE, { t: Date.now(), text: pre });   // satu cadangan lokal tepat sebelum data diubah
  exSyncMode = true; let r; try { r = importData(text); } finally { exSyncMode = false; }   // v107f
  if (typeof r === 'string') throw new Error(r);
  return { same: false };
}
function syInst() {
  const key = sdb.url + '\n' + sdb.token;
  if (syObj && syObjKey === key) return syObj;
  syObj = DLSync.create({
    url: sdb.url, token: sdb.token, getLocal: () => backupText(), applyRemote: syApply, isEmpty: () => !hasAnyData(),
    drop: ['ibadah.pref.rm.last'],   // penanda waktu pengingat yang berubah sendiri saat aplikasi terbuka: bukan perubahan pengguna (tetap ikut terkirim)
    load: async () => { await syLoad(); return sdb.st; },
    save: async st => { sdb.st = st; await sySaveDb(); }
  });
  syObjKey = key;
  if (syPw !== null) syObj.setPassword(syPw);
  return syObj;
}
const syErr = e => (e && e.name === 'SyncError') ? e.message : 'Terjadi galat tak terduga saat sinkron. Data lokal tidak diubah.';
function syWhen(ts) { if (!(ts > 0)) return ''; const d = new Date(ts); return d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + ' ' + String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0'); }
function syPaintStatus() {
  const el = $('#syStat'); if (!el) return;
  const m = syBusy ? { t: 'busy', s: syBusy } : syMsg;
  el.className = 'note sy' + (m ? ' ' + m.t : '');
  el.textContent = m ? m.s : (sdb.st && sdb.st.ts ? 'Terakhir sinkron ' + syWhen(sdb.st.ts) + ' (revisi ' + sdb.st.rev + ').' : '');
  el.setAttribute('role', m && m.t === 'err' ? 'alert' : 'status');
}
function renderSyBox() {
  const box = $('#syBox'); if (!box) return;
  const ae = document.activeElement;
  if (ae && ae.tagName === 'INPUT' && box.contains(ae)) return;   // jangan mengganggu saat mengetik
  const fq = ae && ae.tagName === 'BUTTON' && box.contains(ae) ? ae.dataset.q : '';   // pulihkan fokus tombol setelah digambar ulang
  if (!syLoaded) { syLoad().then(syAfterLoad); }
  const dis = syBusy ? ' disabled' : '';
  const cur = k => { const el = box.querySelector('[data-sy="' + k + '"]'); return el ? el.value : null; };   // isian yang belum disimpan tidak boleh hilang saat digambar ulang
  const dr = syLoaded ? { url: cur('url'), token: cur('token'), pw: syClearPw ? '' : cur('pw'), pw2: syClearPw ? '' : cur('pw2') } : { url: null, token: null, pw: '', pw2: '' };   // sebelum data tersimpan selesai dimuat, isian kosong BUKAN ketikan pengguna
  syClearPw = false;
  const inp = (k, type, ph, v, lbl) => '<label class="inp sm" style="margin-top:8px"><input' + (type === 'url' ? ' type="url" inputmode="url"' : ' type="password"') + ' data-sy="' + k + '" autocomplete="' + (k === 'url' ? 'off' : 'new-password') + '" autocapitalize="off" spellcheck="false" placeholder="' + ph + '" value="' + esc(v) + '" aria-label="' + lbl + '"></label>';
  box.innerHTML = '<details class="ph" id="syDet"' + (syOpen ? ' open' : '') + '><summary><span>Sinkron antar perangkat</span><small>' + esc(syStatus()) + '</small><i class="chev"></i></summary><div class="body">' +
    '<p class="note" style="margin-top:0">Menyamakan data antar perangkat lewat servermu sendiri (Cloudflare Worker + D1, panduan di PROGRESS-2 Tahap 102). Data dienkripsi di perangkat ini SEBELUM dikirim (AES-256-GCM, kunci dari kata sandi); server hanya menyimpan data acak. <b>Lupa kata sandi = data di server tidak bisa dibuka</b> (cadangan JSON tetap dianjurkan). Penghapusan data tidak ikut tersinkron.</p>' +
    inp('url', 'url', 'https://nama.akun.workers.dev', (dr.url !== null ? dr.url : sdb.url), 'Alamat server sinkron') +
    inp('token', 'password', 'Token perangkat ini', (dr.token !== null ? dr.token : sdb.token), 'Token perangkat sinkron') +
    inp('pw', 'password', 'Kata sandi sinkron', dr.pw || '', 'Kata sandi sinkron') +
    inp('pw2', 'password', 'Ulangi kata sandi (pertama kali)', dr.pw2 || '', 'Ulangi kata sandi sinkron') +
    '<p class="note" id="syHint"></p><p class="note sy" id="syStat" role="status" aria-live="polite"></p>' +
    '<div class="quick"><button class="btn sm" data-q="syRun"' + dis + '>Sinkron sekarang</button><button class="btn sm" data-q="syTest"' + dis + '>Tes koneksi</button>' +
    '<button class="btn sm ghost" data-q="syHist"' + dis + (syReady() ? '' : ' disabled') + '>Riwayat server</button>' +
    '<button class="btn sm ghost" data-q="syPre"' + dis + '>Cadangan sebelum sinkron</button>' +
    (syPw !== null ? '<button class="btn sm ghost" data-q="syForget"' + dis + '>Lupakan sandi</button>' : '') +
    '<button class="btn sm ghost danger" data-q="syWipe"' + dis + (syReady() ? '' : ' disabled') + '>Hapus data di server</button>' +
    (syReady() ? '<button class="btn sm ghost" data-q="syClear"' + dis + '>Lepas perangkat ini</button>' : '') + '</div>' +
    '<p class="note">Alamat dan token tersimpan di perangkat ini dan tidak ikut ekspor JSON. Kata sandi hanya di memori: setelah aplikasi ditutup, masukkan lagi sebelum sinkron. Pada HP lama, menurunkan kunci bisa memakan beberapa detik.</p>' +
    '</div></details>';
  syPaintStatus();
  if (fq) { const nb = box.querySelector('[data-q="' + fq + '"]'); if (nb && !nb.disabled) nb.focus(); }
}
function syAfterLoad() {   // data tersimpan baru selesai dimuat: isi kolom kosong di tempat (pengguna mungkin sudah mulai mengetik), lalu gambar ulang bila aman
  ['url', 'token'].forEach(k => { const el = $('#syBox [data-sy="' + k + '"]'); if (el && !el.value) el.value = sdb[k]; });
  const sm = $('#syBox summary small'); if (sm) sm.textContent = syStatus();
  renderSyBox();
}
function syCheckFields() {
  const v = k => { const el = $('#syBox [data-sy="' + k + '"]'); return el ? el.value : ''; };
  const url = v('url').trim(), token = v('token').trim(), pw = v('pw'), pw2 = v('pw2');
  let n;
  try { n = DLSync._t.normUrl(url); } catch (e) { return { err: syErr(e) }; }
  if (!/^[A-Za-z0-9\-_.~+/=]{24,200}$/.test(token)) return { err: DLSync.MSG.bad_token };
  if (n !== sdb.url || token !== sdb.token) { sdb.url = n; sdb.token = token; sdb.st = null; syObj = null; sySaveDb(); }   // server atau token berbeda = status sinkron lama tidak berlaku
  return { pw, pw2 };
}
async function syGuard(label, fn) {
  if (syBusy) return;
  const fq0 = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.q : '';
  syMsg = null; syBusy = label; $$('#syBox .quick button').forEach(b => { b.disabled = true; }); syPaintStatus();   // tanpa menggambar ulang: fokus tombol tetap
  try { const m = await fn(); syMsg = m ? { t: 'ok', s: m } : null; }
  catch (e) { syMsg = { t: 'err', s: syErr(e) }; try { console.warn('sinkron: ' + (e && e.code || '') + ' ' + (e && e.cause && (e.cause.stack || e.cause.message) || (e && e.message) || e)); } catch (_) { /* abaikan */ } }
  syBusy = ''; renderSyBox(); syPaintStatus();
  if (fq0) { const nb = $('#syBox [data-q="' + fq0 + '"]'); if (nb && !nb.disabled) nb.focus(); }
  if (syMsg) toast(syMsg.s.slice(0, 90));
}
QACT.syTest = () => syGuard('Menghubungi server…', async () => {
  const f = syCheckFields(); if (f.err) throw { name: 'SyncError', message: f.err };
  const c = await syInst().check();
  return 'Tersambung (perangkat ' + (c.dev || '?') + '). ' + (c.hasData ? 'Server sudah berisi data (revisi ' + c.rev + ').' : 'Server masih kosong: sinkron pertama akan menentukan kata sandi.');
});
QACT.syRun = () => syGuard('Menyinkron… (menurunkan kunci bisa beberapa detik)', async () => {
  const f = syCheckFields(); if (f.err) throw { name: 'SyncError', message: f.err };
  await exEnsure();   // v106a: toko ide/seri/statistik/A-B ikut snapshot
  const s = syInst();
  if (f.pw) { syPw = f.pw; s.setPassword(syPw); }
  if (syPw === null) throw { name: 'SyncError', message: DLSync.MSG.no_password };
  const c = await s.check();
  if (!c.hasData && sdb.st == null) {   // perangkat pertama: kata sandi baru ditetapkan di sini, salah ketik = terkunci
    if (f.pw && f.pw !== f.pw2) throw { name: 'SyncError', message: 'Kata sandi dan ulangannya tidak sama.' };
    if (DLSync.strength(syPw).level === 0) throw { name: 'SyncError', message: DLSync.strength(syPw).label };
  }
  const r = await s.run();
  syClearPw = true;
  const n = r.rev, sz = r.bytes ? ' (' + Math.max(1, Math.round(r.bytes / 1024)) + ' KB)' : '';
  return ({ none: 'Sudah mutakhir (revisi ' + n + ').', pulled: 'Data dari perangkat lain digabungkan (revisi ' + n + ').', pushed: 'Data terunggah' + sz + ' (revisi ' + n + ').', merged: 'Digabung dan diunggah' + sz + ' (revisi ' + n + ').' })[r.action] || 'Selesai.';
});
QACT.syForget = () => { syPw = null; if (syObj) syObj.forget(); syMsg = { t: 'ok', s: 'Kata sandi dilupakan dari memori.' }; renderSyBox(); };
QACT.syClear = () => openSheet({
  title: 'Lepas perangkat ini?', note: 'Alamat, token, dan status sinkron dihapus dari perangkat ini. Data lokal dan data di server TIDAK dihapus.',
  actions: [closeBtn, { label: 'Lepas', fn: async () => { sdb = { url: '', token: '', st: null, last: null }; syObj = null; syPw = null; syMsg = null; await sySaveDb(); closeSheet(); const bx = $('#syBox'); if (bx) bx.innerHTML = ''; renderSyBox(); toast('Perangkat dilepas dari sinkron'); } }]
});
QACT.syWipe = () => openSheet({
  title: 'Hapus SEMUA data di server?', note: 'Semua revisi terenkripsi di server dihapus permanen. Data di perangkat ini tidak dihapus. Perangkat lain yang masih punya data akan mengunggahnya lagi bila disinkron. Tidak bisa dibatalkan.',
  actions: [closeBtn, { label: 'Hapus di server', danger: true, fn: () => { closeSheet(); syGuard('Menghapus di server…', async () => { const f = syCheckFields(); if (f.err) throw { name: 'SyncError', message: f.err }; await syInst().wipe(); return 'Data di server dihapus. Status sinkron perangkat ini direset.'; }); } }]
});
QACT.syHist = () => syGuard('Mengambil riwayat…', async () => {
  const f = syCheckFields(); if (f.err) throw { name: 'SyncError', message: f.err };
  const it = await syInst().history();
  openSheet({ title: 'Riwayat server', note: it.length ? it.slice(0, 20).map(x => 'Revisi ' + x.rev + ' · ' + syWhen(x.ts) + ' · ' + (x.dev || '?') + ' · ' + Math.max(1, Math.round((x.bytes || 0) / 1024)) + ' KB').join('\n') : 'Belum ada revisi.', pre: true, actions: [closeBtn] });
  return it.length + ' revisi di server.';
});
QACT.syPre = async () => {
  const o = await store.load(KEY_SYPRE);
  if (!o || typeof o.text !== 'string' || !o.text) { toast('Belum ada: dibuat otomatis tepat sebelum sinkron mengubah data'); return; }
  download('daily-log-sebelum-sinkron-' + new Date(o.t).toISOString().slice(0, 10) + '.json', o.text, 'application/json');
  toast('Cadangan sebelum sinkron terakhir (' + syWhen(o.t) + ') diunduh');
};
document.addEventListener('input', ev => {
  const el = ev.target, k = el.dataset && el.dataset.sy; if (!k) return;
  if (k === 'pw' || k === 'pw2') {
    const h = $('#syHint'); if (!h) return;
    const pw = ($('#syBox [data-sy="pw"]') || {}).value || '';
    h.textContent = pw ? DLSync.strength(pw).label : '';
  }
});
document.addEventListener('toggle', ev => { if (ev.target && ev.target.id === 'syDet') syOpen = ev.target.open; }, true);
/* DL-SYNC-END */
/* --- Pengaturan AI (halaman Data) --- */
function aiStatus() {
  if (!adb.on) return 'Mati';
  return (AI.ready().ok ? 'Nyala' : 'Nyala, belum lengkap') + ' · ' + ({ key: 'Gemini', proxy: 'proxy' })[aiMode()];
}
function renderAiBox() {
  const box = $('#aiBox'); if (!box) return;
  const ae = document.activeElement;
  if (ae && ae.tagName === 'INPUT' && box.contains(ae)) return;   // jangan mengganggu saat mengetik
  const m = aiMode(), pill = (f, v, on, t) => '<button class="pill" data-q="aiSet" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + on + '">' + t + '</button>';
  let h = '<details class="ph" id="aiDet"' + (aiOpen ? ' open' : '') + '><summary><span>Pengaturan AI</span><small>' + esc(aiStatus()) + '</small><i class="chev"></i></summary><div class="body">' +
    '<p class="note" style="margin-top:0">AI opsional dan mati secara bawaan. Dipanggil hanya saat kamu menekan ✦ Tanya AI atau tombol AI lain. Angka log tetap dihitung di perangkat ini.</p>' +
    '<div class="f"><div class="lbl">Fitur AI</div><div class="seg">' + pill('on', '0', !adb.on, 'Mati') + pill('on', '1', adb.on, 'Nyala') + '</div></div>';
  if (adb.on) {
    h += '<div class="f"><div class="lbl">Gaya jawaban ✦ Tanya AI</div><div class="seg tri">' + Object.keys(AI_SCOPES).map(k => pill('scope', k, adb.scope === k, AI_SCOPES[k].t)).join('') + '</div><p class="note">' + AI_SCOPES[adb.scope].n + '</p></div>';
    h += '<div class="f"><div class="lbl">Model obrolan</div><div class="seg">' + pill('cm', 'pro', adb.chatModel !== 'fast', 'Pintar (Pro)') + pill('cm', 'fast', adb.chatModel === 'fast', 'Cepat') + '</div><p class="note">Pintar memakai Gemini Pro (' + esc(aiProModel()) + '): lebih cermat untuk pertanyaan sulit, tetapi lebih lambat dan lebih mahal. Cepat memakai ' + esc(aiFastModel()) + '. Bisa diganti langsung di obrolan.</p></div>';
    h += '<div class="f"><div class="lbl">Pencarian web (Google)</div><div class="seg">' + pill('web', '0', !adb.web, 'Mati') + pill('web', '1', adb.web, 'Nyala') + '</div><p class="note">Bila nyala, AI boleh mencari di Google untuk hal terbaru (berita, harga, jadwal). Tidak dipakai pada gaya Hanya data. Tagihan pencarian mengikuti akun Gemini-mu; bila ditolak, AI menjawab tanpa web.</p></div>';
    h += '<div class="f"><div class="lbl">Cara memanggil</div>';
    {
      h += '<div class="seg">' + pill('mode', 'key', m === 'key', 'Kunci sendiri') + pill('mode', 'proxy', m === 'proxy', 'Proxy') + '</div>';
      if (m === 'key') h += '<label class="inp sm" style="margin-top:12px"><input type="password" data-ai="key" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="Kunci API Gemini" value="' + esc(adb.key) + '" aria-label="Kunci API Gemini"></label>' +
        '<label class="inp sm" style="margin-top:8px"><input data-ai="model" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Model Cepat (bawaan ' + AI_MODEL_KEY + ')" value="' + esc(adb.model) + '" aria-label="Nama model Cepat"></label>' +
        '<label class="inp sm" style="margin-top:8px"><input data-ai="proModel" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Model Pintar/Pro (bawaan ' + AI_MODEL_PRO + ')" value="' + esc(adb.proModel) + '" aria-label="Nama model Pintar"></label>' +
        '<p class="note">Ambil kunci gratis di <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>. Kunci hanya tersimpan di browser perangkat ini dan tidak ikut cadangan. Pakai kunci khusus (jangan dibatasi referrer, file lokal tidak punya) dan hanya di perangkat pribadi.</p>' +
        '<p class="note">Perhatian privasi: pada kuota gratis Gemini API, Google dapat memakai isi permintaan untuk mengembangkan produknya dan peninjau manusia dapat membacanya. Pada akun berbayar tidak. Biarkan grup privasi yang sensitif tetap mati.</p>';
      else h += '<label class="inp sm" style="margin-top:12px"><input type="url" inputmode="url" data-ai="endpoint" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://alamat-servermu.example/ai" value="' + esc(adb.endpoint) + '" aria-label="Alamat proxy"></label>' +
        '<label class="inp sm" style="margin-top:8px"><input type="password" data-ai="token" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="Token perangkat (dari servermu)" value="' + esc(adb.token) + '" aria-label="Token perangkat proxy"></label>' +
        '<p class="note">Alamat dan token dari Worker milikmu (panduan: PROGRESS-2, Tahap 92). Kunci Gemini utama hanya ada di server; token ini bisa dicabut per perangkat. Alamat dan token tidak ikut ekspor JSON.</p>' +
        '<div class="f" style="margin-top:12px"><div class="lbl">Bila proxy gagal</div><div class="seg">' + pill('fb', 'off', adb.fb !== 'auto', 'Tampilkan galat') + pill('fb', 'auto', adb.fb === 'auto', 'Pakai kunci cadangan') + '</div></div>' +
        (adb.fb === 'auto' ? '<label class="inp sm" style="margin-top:8px"><input type="password" data-ai="key" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="Kunci cadangan Gemini (terpisah dari kunci server)" value="' + esc(adb.key) + '" aria-label="Kunci cadangan Gemini"></label>' +
          '<p class="note">Dipakai hanya bila proxy tidak terjangkau atau error server. Saran: buat kunci TERPISAH di Google AI Studio dengan kuota kecil; kunci ini tersimpan di HP, jadi tidak seaman kunci di server.</p>' : '');
    }
    h += '</div><div class="f"><div class="lbl">Data yang boleh dikirim <small>sisanya tidak pernah dikirim</small></div>' +
      AI_GROUPS.map(g => '<button class="chk" aria-pressed="' + (adb.priv[g.id] === true) + '" data-q="aiPriv" data-g="' + g.id + '"><i><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i><span><b>' + esc(g.t) + '</b><small>' + esc(g.s) + '</small></span></button>').join('') +
      '<p class="note">Sebelum mengirim, kamu selalu bisa melihat isi yang akan dikirim lewat tombol Lihat data.</p></div>' +
      '<div class="quick"><button class="btn sm" data-q="aiTest">Tes koneksi</button><button class="btn sm" data-q="aiTestPro">Tes model Pintar</button><button class="btn sm" data-q="aiTestWeb">Tes pencarian web</button>' + (adb.key ? '<button class="btn sm ghost" data-q="aiClearKey">Hapus kunci</button>' : '') + (adb.token ? '<button class="btn sm ghost" data-q="aiClearToken">Hapus token</button>' : '') + '</div>';
  }
  box.innerHTML = h + '<p class="note">Pengaturan AI dan kunci tidak ikut ekspor JSON. Bila AI mati atau offline, semua fitur lain tetap berjalan normal.</p></div></details>';
}
function aiSave() { adb.updated = Date.now(); queueSave('a'); }
QACT.aiSet = el => { const f = el.dataset.f, v = el.dataset.v; if (f === 'on') { adb.on = v === '1'; chatReset(); } if (f === 'mode') adb.mode = v; if (f === 'cm') adb.chatModel = v === 'fast' ? 'fast' : 'pro'; if (f === 'web') adb.web = v === '1'; if (f === 'fb') adb.fb = v === 'auto' ? 'auto' : 'off'; if (f === 'scope') aiSetScope(v); aiSave(); renderAiBox(); aiFabSync(); };
QACT.aiPriv = el => { const g = el.dataset.g; if (g in adb.priv) { adb.priv[g] = !adb.priv[g]; aiSave(); renderAiBox(); } };
QACT.aiClearToken = () => { adb.token = ''; aiSave(); renderAiBox(); toast('Token dihapus dari perangkat ini'); };
QACT.aiClearKey = () => { adb.key = ''; aiSave(); renderAiBox(); toast('Kunci dihapus dari perangkat ini'); };
QACT.aiTest = () => {
  aiRun({ task: 'test', system: 'Balas hanya dengan satu kata: siap.', user: 'tes koneksi', max: 20, timeout: 20000 }, r => {
    openSheet({ title: 'Tersambung', note: 'AI membalas: ' + aiTxt(r.text, 60) + '\n\nTidak ada data log yang dikirim pada tes ini.', pre: true, actions: [closeBtn] });
  }, () => QACT.aiTest());
};
function aiTestShow(name, r, extra) {
  openSheet({ title: 'Tersambung', note: name + ' membalas: ' + aiTxt(r.text, 120) + (extra ? '\n\n' + extra : '') + '\n\nTidak ada data log yang dikirim pada tes ini.', pre: true, actions: [closeBtn] });
}
QACT.aiTestPro = () => {
  const m = aiProModel();
  aiRun({ task: 'test', model: m, system: 'Balas hanya dengan satu kata: siap.', user: 'tes koneksi model Pro', max: 40, think: 6000, timeout: 60000 }, r => aiTestShow(m, r), () => QACT.aiTestPro());
};
QACT.aiTestWeb = () => {
  const m = aiChatModel();
  aiRun({ task: 'test', model: m, web: true, system: 'Jawab dalam satu kalimat singkat berbahasa Indonesia. Gunakan pencarian Google.', user: 'Cari di web: apa berita teknologi terbaru hari ini?', max: 200, think: 6000, timeout: 90000 }, r => {
    const n = (r.src || []).length;
    aiTestShow(m, r, r.noWeb ? 'Pencarian web ditolak untuk akunmu, jadi dijawab tanpa web. Cek penagihan/kuota Gemini di Google AI Studio.' : n ? 'Pencarian web aktif: ' + n + ' sumber dipakai.' : 'Tidak ada sumber web yang dipakai (model memutuskan tidak mencari, atau pencarian tidak aktif).');
  }, () => QACT.aiTestWeb());
};
document.addEventListener('input', ev => {
  const k = ev.target.dataset && ev.target.dataset.ai; if (!k) return;
  const v = ev.target.value.trim();
  if (k === 'key') adb.key = v.slice(0, 300);
  else if (k === 'endpoint') adb.endpoint = v.slice(0, 300);
  else if (k === 'token') adb.token = v.slice(0, 200);
  else if (k === 'model') { const mv = v.replace(/^models\//i, ''); adb.model = /^[\w.\-]{1,60}$/.test(mv) ? mv : ''; }
  else if (k === 'proModel') { const mv = v.replace(/^models\//i, ''); adb.proModel = /^[\w.\-]{1,60}$/.test(mv) ? mv : ''; }
  aiSave();
  const st = $('#aiDet small'); if (st) st.textContent = aiStatus();
});
document.addEventListener('toggle', ev => { if (ev.target.id === 'aiDet') aiOpen = ev.target.open; }, true);
window.DL = Object.freeze(Object.assign({}, window.DL, { AI, ctx, check: aiCheck, cfg: () => ({ on: adb.on, scope: adb.scope, chatModel: adb.chatModel, web: adb.web, model: adb.model, proModel: adb.proModel, webEff: aiWebOn(), chatModelName: aiChatModel() }), chat: Object.freeze({ md: aiMd, hist: chatHistory, sys: aiSystem, msgs: () => chatMsgs.map(m => Object.assign({}, m)), busy: () => chatBusy, follow: chatFollow, transcript: chatTranscript }) }));   // untuk pengujian dan batch berikutnya (kunci tidak diekspos); T3d-2-2-4: menggabung window.DL yang sudah ada (blok setTimeout 003/004 bisa jalan lebih dulu bila bagian dimuat terpisah)


