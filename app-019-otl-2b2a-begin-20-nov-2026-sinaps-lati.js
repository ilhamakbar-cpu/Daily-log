/* ===== OTL-2b-end ===== */
/* ===== OTL-2b2a-begin (20 Nov 2026): Sinaps > Latihan > Rentang digit, bagian 2b-2a: PEMASANGAN kartu di tab Latihan (di antara Riwayat dan "Latihan berikutnya") + PENGENDALI (jeda Bersiap, angka satu per satu mengikuti otdJadwal, kolom jawab, papan angka, papan ketik fisik, keluar dari sesi bila layar tersembunyi atau pindah halaman atau memulai latihan lain). BELUM menyimpan (2c): hasil sesi hanya di memori dan hilang bila pindah tab; SN_EX[1].siap TETAP false; hanya mode maju. Membalik: hapus blok ini (kartu hilang, daftar lama kembali). ===== */
const OTX_BERSIAP = 1000;   // ms jeda "Bersiap" sebelum angka pertama
const OTX_NOTE = 'Sesi dihentikan karena layar tersembunyi, kamu pindah halaman, atau memulai latihan lain saat latihan berjalan. Mulai lagi kapan saja.';
const OTX = { s: otdBaru('maju'), idx: -1, ke: -1, t0: 0, raf: 0, note: null, tRes: 0 };   // s = keadaan sesi di memori; idx = angka yang sedang tampil; ke = angka terakhir yang sudah tampil; t0 = waktu angka pertama mulai; tRes = waktu umpan terakhir digambar (penjaga ketukan ganda)
const otxRun = s => s.fase === 'tampil' || s.fase === 'jawab';
const otxOn = () => curView === 'sinaps' && nwTab.sinaps === 'latihan' && !document.hidden;
const otxAcak = () => Array.from({ length: OTD.maks }, () => Math.random());
function otxPos(len, el) {   // MURNI: ms sejak t0 -> { idx, ke, usai }; idx = angka yang sedang tampil (-1 bersiap atau jeda), ke = angka terakhir yang sudah mulai tampil (-1 belum ada), usai = jadwal habis (kolom jawab dibuka)
  const j = otdJadwal(len); if (typeof el !== 'number' || !(el >= 0)) return Object.freeze({ idx: -1, ke: -1, usai: false });
  let idx = -1, ke = -1; for (const b of j.butir) { if (el >= b.on) ke = b.i; if (el >= b.on && el < b.off) idx = b.i; }
  return Object.freeze({ idx, ke, usai: el >= j.total });
}
function otxStop() { if (OTX.raf) { cancelAnimationFrame(OTX.raf); OTX.raf = 0; } }
function otxBan() { try { const r = otdRingkas(OTX.s); return SNS.ready && r.sah ? otdBanding(r.raw, SNS.data.sesi, today()) : null; } catch (e) { return null; } }
function otxDraw() {   // gambar ulang isi kartu; fokus dipulihkan (tombol yang sama, kalau mati: Kirim atau tombol pertama) bila tadinya di dalam kartu
  const body = $('#otdBody'); if (!body) return;
  const ae = document.activeElement, had = !!(ae && body.contains(ae)), fk = had && ae.dataset ? ae.dataset.fk : null;
  body.innerHTML = otwHtml(OTX.s, { idx: OTX.idx, ke: OTX.ke, ban: OTX.s.fase === 'selesai' ? otxBan() : undefined, note: OTX.note });
  if (OTX.s.fase === 'umpan') OTX.tRes = performance.now();
  if (had) {
    let t = fk ? body.querySelector('[data-fk="' + fk + '"]:not(:disabled)') : null;
    if (!t && OTX.s.fase === 'jawab') t = body.querySelector('.otd-kirim:not(:disabled)');   // saat menjawab fokus TIDAK pindah ke tombol angka pertama: Enter dari papan ketik fisik harus mengirim, bukan menambah angka
    else if (!t) t = body.querySelector('.btn:not(:disabled)');   // fase lain: satu tombol aksi (Mulai, Lanjut, Ulangi)
    if (!t) { t = body; body.setAttribute('tabindex', '-1'); }
    try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
}
function otxLoop() {
  OTX.raf = 0;
  if (!otxOn()) { otxLeave(); return; }
  const s = OTX.s;
  if (s.fase === 'tampil') {
    const p = otxPos(s.len, performance.now() - OTX.t0);
    if (p.usai) { OTX.s = otdTampilSelesai(s); OTX.idx = -1; OTX.ke = -1; otxDraw(); }
    else if (p.idx !== OTX.idx || p.ke !== OTX.ke) { OTX.idx = p.idx; OTX.ke = p.ke; otxDraw(); }
  }
  if (otxRun(OTX.s)) OTX.raf = requestAnimationFrame(otxLoop);
}
function otxLeave() { otxStop(); OTX.s = otdBaru('maju'); OTX.idx = -1; OTX.ke = -1; OTX.note = null; }   // pindah tab atau halaman: sesi di memori dibuang (belum ada simpan)
function otxAbort(note) { otxLeave(); OTX.note = note || null; otxDraw(); }
function otxBegin() { OTX.idx = -1; OTX.ke = -1; OTX.t0 = performance.now() + OTX_BERSIAP; otxStop(); otxDraw(); if (otxRun(OTX.s)) OTX.raf = requestAnimationFrame(otxLoop); }
function otxGo() { otxStop(); OTX.note = null; OTX.s = otdMulai(otdBaru('maju'), otxAcak()); otxBegin(); }
function otxNext() {
  if (performance.now() - OTX.tRes < 350) return;   // ketukan ganda pada Kirim tidak melompati umpan balik
  const s0 = OTX.s; OTX.s = otdLanjut(OTX.s, otxAcak()); if (OTX.s === s0) return;
  if (OTX.s.fase === 'tampil') otxBegin(); else { otxStop(); otxDraw(); }
}
function otxKey(d) { const s = OTX.s; if (s.fase !== 'jawab') return; const n = otdMasuk(s, d); if (n !== s) { OTX.s = n; otxDraw(); } }
function otxDel() { const s = OTX.s; if (s.fase !== 'jawab') return; const n = otdHapus(s); if (n !== s) { OTX.s = n; otxDraw(); } }
function otxSend() { const s = OTX.s; if (s.fase !== 'jawab') return; const n = otdKirim(s); if (n !== s) { OTX.s = n; otxStop(); otxDraw(); } }
QACT.otdGo = () => { if (otvRun(OTV.s)) otvAbort('Sesi dihentikan karena kamu memulai latihan lain.'); otxGo(); };
QACT.otdNext = () => otxNext();
QACT.otdKey = el => otxKey(el && el.dataset && /^[0-9]$/.test(el.dataset.v || '') ? Number(el.dataset.v) : -1);
QACT.otdDel = () => otxDel();
QACT.otdSend = () => otxSend();
document.addEventListener('keydown', ev => {   // papan ketik fisik: 0-9 mengisi, Backspace menghapus, Enter mengirim (bukan bila fokus di tombol: tombol punya aksinya sendiri)
  if (OTX.s.fase !== 'jawab' || ev.ctrlKey || ev.metaKey || ev.altKey || !otxOn() || !$('#otdBody')) return;
  const t = ev.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  if (/^[0-9]$/.test(ev.key)) { ev.preventDefault(); if (!ev.repeat) otxKey(Number(ev.key)); }
  else if (ev.key === 'Backspace') { ev.preventDefault(); otxDel(); }
  else if (ev.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { ev.preventDefault(); otxSend(); }
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && otxRun(OTX.s)) otxAbort(OTX_NOTE); });
{ const baseGoX = otvGo; otvGo = function () { if (otxRun(OTX.s)) otxAbort(OTX_NOTE); return baseGoX.apply(this, arguments); }; }   // memulai Waktu reaksi menghentikan sesi Rentang digit yang sedang berjalan
{ const baseMountX = otvMount; otvMount = function () {   // sisipkan kartu Rentang digit di antara Riwayat dan \"Latihan berikutnya\"; daftar lama diganti otwListHtml (tanpa Rentang digit)
  const w = baseMountX.apply(this, arguments); if (!w) return w;
  const nx = w.querySelector('.otr-next'), ls = otwListHtml();
  if (nx) { if (ls) { const tmp = document.createElement('div'); tmp.innerHTML = ls; nx.replaceWith(tmp.firstElementChild); } else nx.remove(); }
  const sec = document.createElement('section'); sec.className = 'nw-card otr-card otd-card'; sec.id = 'otdBody'; sec.setAttribute('aria-label', 'Rentang digit');
  const nx2 = w.querySelector('.otr-next'); if (nx2) w.insertBefore(sec, nx2); else w.appendChild(sec);
  otxDraw(); if (otxRun(OTX.s) && !OTX.raf) OTX.raf = requestAnimationFrame(otxLoop);
  return w;
}; }
{ const baseNwOtx = nwRender; nwRender = function (key) {
  baseNwOtx.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps !== 'latihan') otxLeave();
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl2b2: Object.freeze({ pos: otxPos, state: () => OTX.s, view: () => ({ idx: OTX.idx, ke: OTX.ke, note: OTX.note }), go: otxGo, next: otxNext, key: otxKey, del: otxDel, send: otxSend, abort: otxAbort, ban: otxBan, bersiapMs: OTX_BERSIAP }) }));
/* ===== OTL-2b2a-end ===== */
/* ===== OTL-2c-begin (20 Nov 2026): Sinaps > Latihan > Rentang digit, bagian 2c: SIMPAN sesi lewat snsPut (kunci dailylog:sinaps:v1) saat layar "Sesi selesai" tampil; hanya mode maju dan sesi sah (span >= 2); pembanding dikunci SEBELUM sesi baru masuk; status simpan jujur (menyimpan, tersimpan, tidak sah, gagal + coba lagi) menggantikan kalimat "belum disimpan". Pola OTL-1c (pesan dan kode gagal dipakai bersama). SN_EX[1].siap menjadi true dan satuan rekor "angka" (2 baris lama diubah di luar blok). Pembungkus otwHtml dan otxNext (0 baris lama OTL-2b diubah). Membalik: hapus blok ini, kembalikan `siap` di SN_EX ke 'reaksi' saja dan SNH_UNIT tanpa digit. ===== */
function otzSimpanHtml(sv) {   // MURNI: status simpan -> paragraf status (+ tombol Coba simpan lagi bila boleh); sv kosong = masih menyimpan; pesan gagal = OTV_SV_KODE (OTL-1c)
  const st = sv && sv.st, p = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (st === 'ok') return p('Hasil sesi tersimpan di perangkat ini dan ikut cadangan JSON.');
  if (st === 'takSah') return p('Sesi belum sah, jadi tidak disimpan.');
  if (st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && otvHas(OTV_SV_KODE, k) ? OTV_SV_KODE[k] : 'Belum tersimpan (' + String(k) + ').';
    return p(t) + (otvBolehUlang(k) ? '<div class="snh-act"><button class="btn" type="button" data-q="otdSave" data-fk="otd-save">Coba simpan lagi</button></div>' : '');
  }
  return p('Menyimpan hasil sesi…');
}
function otzPasangSimpan(h, sv) { return typeof h === 'string' && h.indexOf(OTW_BELUM_P) >= 0 ? h.replace(OTW_BELUM_P, () => otzSimpanHtml(sv)) : h; }   // MURNI: ganti kalimat lama "belum disimpan" dengan status simpan
const OTZ_HTML0 = otwHtml;
function otzHtmlS(s, o, sv) {   // MURNI: fase selain selesai = persis hasil OTL-2b; selesai = pembanding terkunci (sv.ban) + status simpan
  if (!s || s.fase !== 'selesai') return OTZ_HTML0(s, o);
  const o2 = sv && sv.ban !== undefined ? Object.assign({}, o, { ban: sv.ban }) : o;
  return otzPasangSimpan(OTZ_HTML0(s, o2), sv);
}
/* OTL-2c-pure-end */
OTX.sv = null;   // { s: keadaan selesai yang disimpan, ses: { ex, d, raw } atau null, ban: pembanding terkunci, st: menyimpan | ok | gagal | takSah, kode }
otwHtml = function (s, o) { return otzHtmlS(s, o, o && o.sv !== undefined ? o.sv : (OTX.sv && OTX.sv.s === s ? OTX.sv : null)); };
function otxSimpan(v) {
  v.st = 'menyimpan'; v.kode = '';
  let p; try { p = snsPut(v.ses, Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(r => { v.st = r && r.ok ? 'ok' : 'gagal'; v.kode = r && r.ok ? '' : ((r && r.kode) || 'galat'); }, () => { v.st = 'gagal'; v.kode = 'galat'; })
    .then(() => { if (OTX.sv === v && OTX.s === v.s) otxDraw(); });
}
function otxFinish() {   // dipanggil sekali per sesi yang selesai (penjaga: keadaan yang sama tidak disimpan dua kali)
  const s = OTX.s; if (s.fase !== 'selesai' || (OTX.sv && OTX.sv.s === s)) return;
  const ses = otdKeSesi(s, today()), v = { s, ses, ban: otxBan(), st: ses ? 'menyimpan' : 'takSah', kode: '' };   // otxBan() dihitung SEBELUM sesi masuk catatan, lalu dikunci di v.ban
  OTX.sv = v; otxDraw(); if (ses) otxSimpan(v);
}
function otxUlang() { const v = OTX.sv; if (!v || v.s !== OTX.s || v.st !== 'gagal' || !v.ses || !otvBolehUlang(v.kode)) return; otxSimpan(v); otxDraw(); }
{ const baseNextZ = otxNext; otxNext = function () { const s0 = OTX.s; baseNextZ.apply(this, arguments); if (OTX.s !== s0 && OTX.s.fase === 'selesai') otxFinish(); }; }
QACT.otdSave = () => otxUlang();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl2c: Object.freeze({ simpanHtml: otzSimpanHtml, pasang: otzPasangSimpan, htmlS: otzHtmlS, sv: () => OTX.sv ? { st: OTX.sv.st, kode: OTX.sv.kode, ban: OTX.sv.ban, ses: OTX.sv.ses } : null, finish: otxFinish, ulang: otxUlang }) }));
/* ===== OTL-2c-end ===== */
/* ===== OTL-2d-begin (20 Nov 2026): Sinaps > Latihan > Rentang digit, bagian 2d-1: LOGIKA MURNI riwayat (rekor = rentang terpanjang, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, titik harian 14 hari, geometri grafik). Belum ada tampilan; tidak mengubah baris lama. Memakai snClean/snDayOk/snAddDays (SNH-1a), otrMedian (OTL-1a), OTD (OTL-2a). Membalik: hapus blok ini. ===== */
const OQW = Object.freeze({ hari: 14, tren: 7, minTren: 3, banding: OTD.banding, terakhir: 5 });   // hari = lebar jendela grafik (hari ini ikut); tren = lebar tiap dua jendela pembanding; minTren = sesi minimal di tiap jendela; banding = beda minimal (angka) yang sama dengan pembanding sesi (OTL-2a)
const oqwTren0 = Object.freeze({ kode: 'belum_cukup', n1: 0, n2: 0, kini: null, basis: null, selisih: null });
const oqwKosong = Object.freeze({ total: 0, masaDepan: 0, hari: 0, rekor: null, terakhir: null, daftar: Object.freeze([]), titik: Object.freeze([]), tren: oqwTren0 });
function otqRiwayat(list, today) {   // MURNI, tidak melempar galat: daftar sesi mentah + tanggal hari ini -> ringkasan riwayat Rentang digit (hanya sesi `digit` dengan raw bulat di OTD.awal..OTD.maks; tanggal masa depan tidak dihitung, hanya dicacah)
  if (!snDayOk(today)) return oqwKosong;
  const all = snClean(list).sesi.filter(x => x.ex === 'digit' && Number.isInteger(x.raw) && x.raw >= OTD.awal && x.raw <= OTD.maks), v = all.filter(x => x.d <= today), depan = all.length - v.length;
  if (!v.length) return depan ? Object.freeze(Object.assign({}, oqwKosong, { masaDepan: depan })) : oqwKosong;
  let rek = null; v.forEach(x => { if (rek === null || x.raw > rek.raw) rek = x; });   // terpanjang; seri = yang paling awal (urutan tanggal)
  const hari = []; v.forEach(x => { if (hari.indexOf(x.d) < 0) hari.push(x.d); });
  const daftar = v.slice(-OQW.terakhir).reverse().map(x => Object.freeze({ raw: x.raw, d: x.d }));   // terbaru dahulu; pada hari yang sama, yang disimpan terakhir dahulu
  const titik = [];
  for (let k = 0; k < OQW.hari; k++) {
    const d = snAddDays(today, -(OQW.hari - 1 - k)), r = v.filter(x => x.d === d).map(x => x.raw);
    if (r.length) titik.push(Object.freeze({ d, x: k, n: r.length, raw: otrMedian(r) }));   // median per hari (bisa x,5), sama dengan dasar pembanding sesi
  }
  const a0 = snAddDays(today, -(OQW.tren - 1)), b0 = snAddDays(today, -(2 * OQW.tren - 1)), b1 = snAddDays(today, -OQW.tren);
  const A = v.filter(x => x.d >= a0).map(x => x.raw), B = v.filter(x => x.d >= b0 && x.d <= b1).map(x => x.raw);
  let tren = Object.freeze(Object.assign({}, oqwTren0, { n1: A.length, n2: B.length }));
  if (A.length >= OQW.minTren && B.length >= OQW.minTren) {
    const kini = otrMedian(A), basis = otrMedian(B), sel = kini - basis;
    tren = Object.freeze({ kode: sel >= OQW.banding ? 'lebih_panjang' : sel <= -OQW.banding ? 'lebih_pendek' : 'sekitar', n1: A.length, n2: B.length, kini, basis, selisih: sel });
  }
  return Object.freeze({ total: v.length, masaDepan: depan, hari: hari.length, rekor: Object.freeze({ raw: rek.raw, d: rek.d }), terakhir: daftar[0], daftar: Object.freeze(daftar), titik: Object.freeze(titik), tren });
}
function otqGrafik(titik, w, h, pad) {   // MURNI: titik riwayat -> koordinat grafik garis (x menurut hari dalam jendela, y: makin panjang makin ke atas); pad = batas dalam; tidak pernah NaN
  const ok = n => typeof n === 'number' && isFinite(n) && n > 0, W = ok(w) ? w : 300, H = ok(h) ? h : 90, P = typeof pad === 'number' && isFinite(pad) && pad >= 0 && pad * 2 < Math.min(W, H) ? pad : 8;
  const t = (Array.isArray(titik) ? titik : []).filter(p => p && ok(p.raw) && typeof p.x === 'number' && p.x >= 0 && p.x <= OQW.hari - 1);
  if (!t.length) return Object.freeze({ w: W, h: H, lo: null, hi: null, pts: Object.freeze([]) });
  let lo = Math.min.apply(null, t.map(p => p.raw)), hi = Math.max.apply(null, t.map(p => p.raw));
  if (hi - lo < 2) { const m = (lo + hi) / 2; lo = m - 1; hi = m + 1; }   // jendela sempit (< 2 angka): jangan menggembungkan selisih kecil menjadi lonjakan
  const px = x => Math.round((P + (x / (OQW.hari - 1)) * (W - 2 * P)) * 10) / 10, py = r => Math.round((H - P - ((r - lo) / (hi - lo)) * (H - 2 * P)) * 10) / 10;
  return Object.freeze({ w: W, h: H, lo, hi, pts: Object.freeze(t.map(p => Object.freeze({ d: p.d, raw: p.raw, n: p.n, x: px(p.x), y: py(p.raw) }))) });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl2d: Object.freeze({ cfg: OQW, riwayat: otqRiwayat, grafik: otqGrafik }) }));
/* OTL-2d-pure-end */
/* ===== OTL-2d-end ===== */
/* ===== OTL-2d2-begin (20 Nov 2026): Sinaps > Latihan > Rentang digit, bagian 2d-2: TAMPILAN kartu "Riwayat Rentang digit" di tab Latihan (rekor, sesi terakhir, tren 7 hari vs 7 hari sebelumnya, grafik garis median harian 14 hari, 5 sesi terbaru). Hanya BACA dari SNS.data; tidak menulis apa pun. Pembangun HTML murni (oqvHtml) + pengendali (pembungkus otvMount dan otxDraw; 0 baris lama diubah). CSS memakai kelas orh-* dari OTL-1d2 (tanpa CSS baru). Membalik: hapus blok ini. ===== */
const OQV_FINE = 'Riwayat dihitung di perangkat ini dari sesi yang tersimpan; hanya mode maju yang disimpan. Median dipakai supaya satu sesi yang sangat bagus atau sangat buruk tidak menggeser angka. Rentang digit ikut dipengaruhi kantuk, tidur, dan gangguan, jadi anggap ini gambaran kebiasaan, bukan nilai kecerdasan.';
const oqvAng = v => snhNum(v) + '\u00a0angka';
function oqvTrenTeks(t) {   // MURNI: keluaran tren otqRiwayat -> kalimat
  if (!t || t.kode === 'belum_cukup') { const a = t && typeof t.n1 === 'number' ? t.n1 : 0, b = t && typeof t.n2 === 'number' ? t.n2 : 0; const pt = n => n >= OQW.minTren ? 'cukup' : (n > 0 ? n : 0) + ' dari ' + OQW.minTren + ' sesi'; return 'Tren belum tersedia. ' + OQW.tren + ' hari terakhir: ' + pt(a) + '; sebelumnya: ' + pt(b) + '.'; }
  const aw = 'Tren: median ' + OQW.tren + ' hari terakhir ' + oqvAng(t.kini), ak = ' dari ' + OQW.tren + ' hari sebelumnya (' + oqvAng(t.basis) + ').', p = oqvAng(Math.abs(t.selisih));
  return t.kode === 'lebih_panjang' ? aw + ', lebih panjang ' + p + ak : t.kode === 'lebih_pendek' ? aw + ', lebih pendek ' + p + ak : aw + ', sekitar sama dengan ' + OQW.tren + ' hari sebelumnya (' + oqvAng(t.basis) + '; selisih ' + p + ').';
}
function oqvSvg(g, today) {   // MURNI: keluaran otqGrafik (>= 2 titik) -> <svg>; warna lewat kelas CSS orh-* (token tema)
  const P = g.pts, mn = Math.min.apply(null, P.map(p => p.raw)), mx = Math.max.apply(null, P.map(p => p.raw));
  const lab = 'Grafik garis median Rentang digit per hari dalam ' + OQW.hari + ' hari terakhir: ' + P.length + ' hari berisi data, dari ' + snhNum(mn) + ' sampai ' + snhNum(mx) + ' angka. Angka lengkap ada di daftar sesi terbaru.';
  return '<svg class="orh-svg" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(lab) + '"><line class="orh-g" x1="0" y1="' + (g.h - 0.5) + '" x2="' + g.w + '" y2="' + (g.h - 0.5) + '"/>' +
    '<polyline class="orh-l" points="' + P.map(p => p.x + ',' + p.y).join(' ') + '"/>' +
    P.map(p => '<circle class="orh-d" cx="' + p.x + '" cy="' + p.y + '" r="3.5"><title>' + esc(orhTgl(p.d, today) + ': ' + snhNum(p.raw) + ' angka' + (p.n > 1 ? ' (median ' + p.n + ' sesi)' : '')) + '</title></circle>').join('') + '</svg>';
}
function oqvHtml(rw, o, today) {   // MURNI: tidak mengubah masukan, tidak melempar galat; rw = keluaran otqRiwayat (atau null), o = { st: 'baca' | 'belum' | 'ok', blocked } -> isi kartu (tanpa pembungkus)
  o = o || {}; const hd = '<div class="nw-hd"><h3>Riwayat Rentang digit</h3></div>', fine = '<p class="nw-fine">' + esc(OQV_FINE) + '</p>', st = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (o.st === 'baca') return hd + st('Membaca catatan latihan…') + fine;
  if (o.st !== 'ok' || !rw) return hd + st('Catatan latihan belum terbaca, jadi riwayat belum bisa ditampilkan.') + '<div class="snh-act"><button class="btn" type="button" data-q="oqvRetry" data-fk="oqv-retry">Coba baca lagi</button></div>' + fine;
  const blk = o.blocked ? st('Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Riwayat hanya dibaca; sesi baru tidak disimpan.') : '';
  const depan = rw.masaDepan > 0 ? st(rw.masaDepan + ' sesi bertanggal di masa depan tidak dihitung. Periksa jam perangkat.') : '';
  if (!rw.total) return hd + blk + depan + '<p class="nw-p otr-p">Belum ada sesi Rentang digit tersimpan. Selesaikan satu sesi mode maju di atas; rekor dan grafik muncul di sini.</p>' + fine;
  const tile = (v, nama, tgl) => '<div class="snh-t"><b class="snh-big">' + esc(snhNum(v)) + ' <i>angka</i></b><span>' + esc(nama) + '</span><small>' + esc(tgl) + '</small></div>';
  let x = hd + blk + depan + '<div class="snh-st">' + tile(rw.rekor.raw, 'Rekor terbaik', orhTgl(rw.rekor.d, today)) + tile(rw.terakhir.raw, 'Sesi terakhir', orhTgl(rw.terakhir.d, today)) + '</div>' +
    '<p class="nw-p otr-p">' + rw.total + ' sesi tersimpan di ' + rw.hari + ' hari berlatih.</p><p class="nw-p otr-p">' + esc(oqvTrenTeks(rw.tren)) + '</p>' +
    '<h4 class="orh-h">Median per hari, ' + OQW.hari + ' hari terakhir</h4>';
  const g = otqGrafik(rw.titik, 300, 90, 8);
  x += g.pts.length >= 2 ? '<div class="orh-svgw">' + oqvSvg(g, today) + '</div>' + orhSumbuTgl(today, OQW.hari) + '<p class="otr-prog">Skala ' + snhNum(g.lo) + ' sampai ' + snhNum(g.hi) + ' angka · makin tinggi makin panjang</p>'
    : '<p class="nw-p otr-p">Grafik muncul begitu ada sesi di dua hari berbeda dalam ' + OQW.hari + ' hari terakhir.</p>';
  x += '<h4 class="orh-h">Sesi terbaru</h4><ul class="snh-l">' + rw.daftar.map(s => '<li class="snh-r"><span class="snh-rn">' + esc(oqvAng(s.raw)) + '</span>' +
    (s.d === rw.rekor.d && s.raw === rw.rekor.raw ? '<span class="snh-chip snh-ok">Rekor</span>' : '') + '<span class="snh-rc">' + esc(orhTgl(s.d, today)) + '</span></li>').join('') + '</ul>';
  return x + fine;
}
/* OTL-2d2-pure-end */
const OQV = { sig: '' };
function oqvState() { return { st: SNS.ready ? 'ok' : (SNS.loading ? 'baca' : 'belum'), blocked: SNS.blocked }; }
function oqvSig() { return [SNS.ready, SNS.loading, SNS.blocked, SNS.data.sesi.length, SNS.data.u, today()].join('|'); }
function oqvDraw(paksa) {   // gambar ulang kartu hanya bila isinya berubah; aman dipanggil sering
  const el = $('#oqvBody'); if (!el) return; const sig = oqvSig(); if (!paksa && sig === OQV.sig && el.innerHTML) return;
  OQV.sig = sig; let rw = null; try { rw = SNS.ready ? otqRiwayat(SNS.data.sesi, today()) : null; } catch (e) { rw = null; }
  const ae = document.activeElement, had = !!(ae && el.contains(ae));
  try { el.innerHTML = oqvHtml(rw, oqvState(), today()); } catch (e) { el.innerHTML = ''; }
  if (had) { const t = el.querySelector('.btn'); try { if (t) t.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } } catch (e) { /* abaikan */ } }
}
function oqvRetry() { let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } oqvDraw(true); Promise.resolve(p).then(() => oqvDraw(true), () => oqvDraw(true)); }
{ const baseMountQ = otvMount; otvMount = function () {   // sisipkan kartu Riwayat Rentang digit tepat di bawah kartu Rentang digit
  const w = baseMountQ.apply(this, arguments); if (!w) return w;
  const sec = document.createElement('section'); sec.className = 'nw-card orh-card oqv-card'; sec.id = 'oqvBody'; sec.setAttribute('aria-label', 'Riwayat Rentang digit');
  const d = w.querySelector('#otdBody'), nx = w.querySelector('.otr-next');
  if (d && d.nextSibling) w.insertBefore(sec, d.nextSibling); else if (nx) w.insertBefore(sec, nx); else w.appendChild(sec);
  OQV.sig = ''; oqvDraw(true); snsLoad().then(() => oqvDraw());
  return w;
}; }
{ const baseDrawQ = otxDraw; otxDraw = function () { baseDrawQ.apply(this, arguments); oqvDraw(); }; }   // sesudah simpan berhasil, otxDraw dipanggil: sesi baru ikut tampil
QACT.oqvRetry = () => oqvRetry();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl2d2: Object.freeze({ html: oqvHtml, trenTeks: oqvTrenTeks, svg: oqvSvg, draw: oqvDraw, retry: oqvRetry }) }));
/* ===== OTL-2d2-end ===== */
/* ===== OTL-3a-begin (20 Nov 2026): Sinaps > Latihan > Stroop, bagian 3a: LOGIKA MURNI (mesin keadaan; bilangan acak DAN waktu DISUNTIKKAN; tanpa jam, tanpa acak sendiri, tanpa DOM). Sesi 30 detik: kata nama warna tampil berwarna tinta, jawab WARNA TINTA-nya dari 4 pilihan; raw = jumlah jawaban benar (makin banyak makin baik, SN_EX.lebih = 'besar'). Belum ada tampilan, tombol, atau penyimpanan; SN_EX tidak diubah. Membalik: hapus blok ini. ===== */
const OST = Object.freeze({ durasiMs: 30000, warna: Object.freeze(['merah', 'biru', 'hijau', 'kuning']), kongruen: 0.25, sahMin: 10, akurasiMin: 0.7, minRt: 3, banding: 2, hariBanding: 14, minBanding: 3, maks: 200 });   // kongruen = peluang kata dan tinta sama; sahMin/akurasiMin = syarat sesi sah (anti asal tekan); minRt = butir minimal per kelompok untuk selisih waktu; banding = selisih minimal (jawaban benar) agar dianggap beda; maks = batas percobaan per sesi
const ostSet = (s, p) => Object.freeze(Object.assign({}, s, p));
const ostFin = x => typeof x === 'number' && isFinite(x);
const ostMed = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
function ostPilih(acak, prev) {   // MURNI: satu percobaan { kata, tinta, kongruen }; acak = larik 3 bilangan di [0,1) (butir tak sah dianggap 0,5); tidak pernah sama persis (kata dan tinta) dengan prev
  const W = OST.warna, n = W.length, r = i => { const v = Array.isArray(acak) ? acak[i] : undefined; return typeof v === 'number' && v >= 0 && v < 1 ? v : 0.5; };
  const kong = r(0) < OST.kongruen; let kata = Math.floor(r(1) * n), tinta;
  if (kong) tinta = kata; else { const k = Math.floor(r(2) * (n - 1)); tinta = k >= kata ? k + 1 : k; }
  if (prev && prev.kata === W[kata] && prev.tinta === W[tinta]) {
    if (kong) { kata = (kata + 1) % n; tinta = kata; } else { tinta = (tinta + 1) % n; if (tinta === kata) tinta = (tinta + 1) % n; }
  }
  return Object.freeze({ kata: W[kata], tinta: W[tinta], kongruen: kata === tinta });
}
function ostBaru() { return Object.freeze({ fase: 'siap', mulai: null, trial: null, tMuncul: null, riwayat: Object.freeze([]) }); }
function ostMulai(s, now, acak) { return s.fase === 'siap' && ostFin(now) && now >= 0 ? ostSet(s, { fase: 'jalan', mulai: now, trial: ostPilih(acak, null), tMuncul: now }) : s; }
function ostTick(s, now) { return s.fase === 'jalan' && ostFin(now) && now - s.mulai >= OST.durasiMs ? ostSet(s, { fase: 'selesai', trial: null, tMuncul: null }) : s; }
function ostJawab(s, w, now, acak) {   // jawaban sah hanya bila sesi berjalan, waktu < batas (jawaban di/atas batas diabaikan dan sesi selesai), waktu tidak mundur, dan warna dikenal; rt = ms sejak percobaan muncul
  if (s.fase !== 'jalan' || !ostFin(now)) return s;
  const t = ostTick(s, now); if (t !== s) return t;
  if (now < s.tMuncul || OST.warna.indexOf(w) < 0) return s;
  const rec = Object.freeze({ kata: s.trial.kata, tinta: s.trial.tinta, kongruen: s.trial.kongruen, pilih: w, benar: w === s.trial.tinta, rt: Math.round(now - s.tMuncul) }), rw = Object.freeze(s.riwayat.concat([rec]));
  return rw.length >= OST.maks ? ostSet(s, { fase: 'selesai', trial: null, tMuncul: null, riwayat: rw }) : ostSet(s, { riwayat: rw, trial: ostPilih(acak, s.trial), tMuncul: now });
}
function ostSisa(s, now) { if (s.fase === 'selesai') return 0; if (s.fase !== 'jalan' || !ostFin(now)) return OST.durasiMs; return Math.max(0, Math.min(OST.durasiMs, OST.durasiMs - (now - s.mulai))); }
function ostRingkas(s) {   // MURNI; sesi sah bila percobaan >= sahMin dan akurasi >= akurasiMin; raw = benar bila sah; interferensi = median rt benar tidak-kongruen dikurangi kongruen (>= minRt butir di tiap kelompok, selain itu null)
  const R = s.riwayat, benar = R.filter(x => x.benar).length, n = R.length, akur = n ? benar / n : null, sah = n >= OST.sahMin && akur >= OST.akurasiMin;
  const rtB = R.filter(x => x.benar), kg = rtB.filter(x => x.kongruen).map(x => x.rt), ik = rtB.filter(x => !x.kongruen).map(x => x.rt);
  return Object.freeze({ selesai: s.fase === 'selesai', percobaan: n, benar, salah: n - benar, akurasi: akur, sah, raw: sah ? benar : null, rtMedian: ostMed(rtB.map(x => x.rt)), interferensi: kg.length >= OST.minRt && ik.length >= OST.minRt ? ostMed(ik) - ostMed(kg) : null });
}
function ostKeSesi(s, d) { const r = ostRingkas(s); return !r.selesai || !r.sah || !snDayOk(d) ? null : Object.freeze({ ex: 'stroop', d, raw: r.raw }); }
function ostBanding(raw, sesi, today) {   // bandingkan dengan median jawaban benar diri sendiri 14 hari terakhir (hari ini ikut); perlu >= 3 sesi; beda minimal 2 jawaban. Dipanggil SEBELUM sesi baru ditambahkan
  const kosong = n => Object.freeze({ kode: 'belum_cukup', n, basis: null, selisih: null });
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > OST.maks || !snDayOk(today)) return kosong(0);
  const awal = snAddDays(today, -(OST.hariBanding - 1)), v = snClean(sesi).sesi.filter(x => x.ex === 'stroop' && x.d >= awal && x.d <= today).map(x => x.raw);
  if (v.length < OST.minBanding) return kosong(v.length);
  const basis = ostMed(v), sel = raw - basis, kode = sel >= OST.banding ? 'lebih_banyak' : sel <= -OST.banding ? 'lebih_sedikit' : 'sekitar';
  return Object.freeze({ kode, n: v.length, basis, selisih: sel });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl3a: Object.freeze({ cfg: OST, pilih: ostPilih, baru: ostBaru, mulai: ostMulai, tick: ostTick, jawab: ostJawab, sisa: ostSisa, ringkas: ostRingkas, keSesi: ostKeSesi, banding: ostBanding }) }));
/* ===== OTL-3a-end ===== */
/* ===== OTL-3b-begin (20 Nov 2026): Sinaps > Latihan > Stroop, bagian 3b-1: PEMBANGUN HTML MURNI kartu "Stroop" (satu cabang per fase: siap, jalan, selesai), kalimat pembanding dan interferensi, dan daftar "Latihan berikutnya" tanpa latihan yang sudah punya kartu. BELUM dipasang ke halaman (3b-2) dan belum menyimpan (3c); SN_EX tidak diubah. Membalik: hapus blok ini dan CSS OTL-3b. ===== */
/* OTL-3b-pure-begin */
const OSV_INTRO = 'Sebuah kata nama warna muncul dengan warna tinta tertentu. Pilih WARNA TINTA-nya, bukan kata yang tertulis (kata "MERAH" yang berwarna biru: pilih Biru). Waktunya 30 detik; jawab secepat dan setepat mungkin. Sesi dihitung sah bila minimal 10 jawaban dan 70 persen benar.';
const OSV_FINE = 'Latihan ini hanya mengukur dan melatih tugas ini sendiri, bukan bukti otak jadi lebih pintar. Hasilnya dipengaruhi kantuk dan gangguan di sekitarmu, jadi bandingkan hanya dengan dirimu sendiri. Latihan ini bergantung pada membedakan warna dan hanya bisa dipakai dengan melihat layar; bila merah dan hijau sulit kamu bedakan, latihan ini kurang cocok.';
const OSV_BELUM_P = '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>';
const OSV_KARTU = Object.freeze(['reaksi', 'digit', 'stroop']);   // latihan yang sudah punya kartu sendiri: tidak masuk daftar "Latihan berikutnya"
const OSV_NAMA = Object.freeze({ merah: 'Merah', biru: 'Biru', hijau: 'Hijau', kuning: 'Kuning' });
const osvJ = n => n + '\u00a0jawaban';
function osvBandingTeks(b) {   // MURNI: keluaran ostBanding (atau null bila catatan belum terbaca) -> kalimat
  if (!b) return 'Catatan latihan belum terbaca, jadi pembanding tidak ditampilkan.';
  if (b.kode === 'belum_cukup') return 'Belum ada pembanding: butuh minimal ' + OST.minBanding + ' sesi dalam ' + OST.hariBanding + ' hari terakhir (sekarang ' + b.n + ').';
  const sel = osvJ(snhNum(Math.abs(b.selisih))), dari = ' dari median ' + OST.hariBanding + ' harimu (' + osvJ(snhNum(b.basis)) + ').';
  return b.kode === 'lebih_banyak' ? 'Lebih banyak ' + sel + dari : b.kode === 'lebih_sedikit' ? 'Lebih sedikit ' + sel + dari : 'Sekitar biasanya: selisih ' + sel + dari;
}
function osvInterfTeks(v) {   // MURNI: interferensi (ms, median tidak-kongruen dikurangi kongruen) atau null -> kalimat; hanya info, bukan skor
  if (typeof v !== 'number' || !isFinite(v)) return 'Selisih waktu antara kata yang warnanya sama dan beda dengan tulisannya belum bisa dihitung: butuh minimal ' + OST.minRt + ' jawaban benar di tiap kelompok.';
  const m = Math.round(Math.abs(v));
  return (m === 0 ? 'Jawaban benar pada kata yang warnanya beda dengan tulisannya sama cepatnya dengan yang warnanya sama.' : 'Jawaban benar pada kata yang warnanya beda dengan tulisannya rata-rata (median) ' + m + '\u00a0ms ' + (v > 0 ? 'lebih lambat' : 'lebih cepat') + ' daripada yang warnanya sama.') + ' Ini hanya info, bukan skor.';
}
function osvSisaDetik(s, now) { return Math.ceil(ostSisa(s, now) / 1000); }   // MURNI: detik tersisa (dibulatkan ke atas), 30 sebelum mulai, 0 sesudah selesai
function osvKeys() {   // MURNI: 4 tombol nama warna (teks netral, bukan berwarna: tidak ikut efek Stroop dan tetap terbaca); urutan tetap
  return '<div class="osk-pd" role="group" aria-label="Pilih warna tinta">' + OST.warna.map(w =>
    '<button class="btn osk-key" type="button" data-q="ostJawab" data-v="' + w + '" data-fk="osk-k-' + w + '">' + esc(OSV_NAMA[w] || w) + '</button>').join('') + '</div>';
}
function osvHtml(s, o) {   // MURNI: tidak mengubah masukan, tidak melempar galat; s = keadaan mesin (ostBaru ...), o = { now, ban, note } -> isi kartu (tanpa pembungkus)
  o = o || {}; s = s || ostBaru();
  const hd = '<div class="nw-hd"><h3>Stroop</h3></div>', fine = '<p class="nw-fine">' + esc(OSV_FINE) + '</p>';
  const note = o.note ? '<p class="nw-p snh-n" role="status">' + esc(o.note) + '</p>' : '';
  const btn = (q, fk, t) => '<div class="snh-act"><button class="btn" type="button" data-q="' + q + '" data-fk="' + fk + '">' + esc(t) + '</button></div>';
  const R = (Array.isArray(s.riwayat) ? s.riwayat : []).filter(x => x && typeof x === 'object'), benar = R.filter(x => x.benar).length, salah = R.length - benar, f = s.fase;
  if (f === 'jalan' && s.trial && typeof s.trial.kata === 'string' && OST.warna.indexOf(s.trial.tinta) >= 0) {
    const last = R.length ? R[R.length - 1] : null, d = osvSisaDetik(s, o.now);
    return hd + '<p class="otr-prog" aria-live="off">Sisa ' + d + '\u00a0detik · benar ' + benar + ' · salah ' + salah + '</p>' +
      '<div class="osk-pad" role="img" aria-label="Perhatikan layar: kata nama warna dengan warna tinta"><b class="osk-word osk-i-' + s.trial.tinta + '">' + esc(s.trial.kata.toUpperCase()) + '</b></div>' +
      '<p class="nw-p otr-p">Pilih WARNA TINTA kata itu, bukan kata yang tertulis.</p>' + osvKeys() +
      '<p class="osk-fb" role="status" aria-live="off">' + (last ? 'Jawaban terakhir: <b>' + (last.benar ? 'Benar' : 'Salah') + '</b>' : 'Jawaban terakhir: belum ada') + '</p>' + fine;
  }
  if (f === 'selesai') {
    const r = ostRingkas(ostSet(s, { riwayat: Object.freeze(R) })); let x = hd + '<p class="otr-prog">Sesi selesai</p>';
    if (r.sah) {
      x += '<div class="otr-res"><span>Jawaban benar kamu</span><b class="otr-big">' + esc(osvJ(r.raw)) + '</b></div>' +
        '<div class="snh-st"><div class="snh-t"><b class="snh-big">' + r.benar + '</b><span>Jawaban benar</span></div><div class="snh-t"><b class="snh-big">' + r.salah + '</b><span>Jawaban salah</span></div></div>' +
        '<p class="nw-p otr-p">' + r.percobaan + ' percobaan, akurasi ' + Math.round(r.akurasi * 100) + ' persen' + (typeof r.rtMedian !== 'number' || !isFinite(r.rtMedian) ? '' : ', waktu jawab benar median ' + Math.round(r.rtMedian) + '\u00a0ms') + '.</p>' +
        '<p class="nw-p otr-p">' + esc(osvInterfTeks(r.interferensi)) + '</p>' +
        '<p class="nw-p otr-p">' + esc(osvBandingTeks(o.ban === undefined ? null : o.ban)) + '</p>';
    } else {
      const a = [];
      if (r.percobaan < OST.sahMin) a.push('baru ' + r.percobaan + ' percobaan (sesi sah butuh minimal ' + OST.sahMin + ')');
      if (r.akurasi !== null && r.akurasi < OST.akurasiMin) a.push('akurasi ' + Math.round(r.akurasi * 100) + ' persen (sesi sah butuh minimal ' + Math.round(OST.akurasiMin * 100) + ')');
      x += '<div class="otr-res"><b class="otr-big">Sesi belum sah</b><span>' + esc((a.length ? a.join(' dan ') : 'syarat sesi sah belum terpenuhi').replace(/^./, c => c.toUpperCase())) + '. Pilih warna TINTA, bukan katanya, dan coba lagi dengan perhatian penuh pada layar.</span></div>';
    }
    return x + OSV_BELUM_P + btn('ostGo', 'osk-go', 'Ulangi sesi') + fine;
  }
  return hd + note + '<p class="nw-p otr-p">' + esc(OSV_INTRO) + '</p>' + btn('ostGo', 'osk-go', 'Mulai sesi (30 detik)') + fine;   // siap (dan fase tak dikenal, atau jalan tanpa percobaan sah)
}
function osvListHtml() {   // MURNI: kartu "Latihan berikutnya" dari SN_EX, tanpa latihan yang sudah punya kartu (OSV_KARTU); yang lain masih "Segera"
  const l = SN_EX.filter(e => OSV_KARTU.indexOf(e.id) < 0); if (!l.length) return '';
  return '<section class="nw-card otr-next" aria-label="Latihan berikutnya"><div class="nw-hd"><h3>Latihan berikutnya</h3></div><ul class="snh-l">' + l.map(e =>
    '<li class="snh-r"><span class="snh-rn">' + esc(e.nama) + '</span><span class="snh-chip snh-soon">Segera</span><span class="snh-rc">Belum tersedia · tahap ' + esc(e.tahap) + '</span></li>').join('') + '</ul></section>';
}
/* OTL-3b-pure-end */
window.DL = Object.freeze(Object.assign({}, window.DL, { otl3b: Object.freeze({ html: osvHtml, list: osvListHtml, banTeks: osvBandingTeks, interfTeks: osvInterfTeks, sisaDetik: osvSisaDetik, keys: osvKeys }) }));
/* ===== OTL-3b-end ===== */
/* ===== OTL-3b2-begin (20 Nov 2026): Sinaps > Latihan > Stroop, bagian 3b-2: PEMASANGAN kartu Stroop di tab Latihan (di antara "Riwayat Rentang digit" dan "Latihan berikutnya") + PENGENDALI (hitung mundur 30 detik dari jam nyata, 4 tombol warna dan papan ketik 1 sampai 4, percobaan baru tiap jawaban, sesi selesai tepat di batas, keluar dari sesi bila layar tersembunyi atau pindah halaman atau memulai latihan lain). BELUM menyimpan (3c): hasil sesi hanya di memori dan hilang bila pindah tab; SN_EX[2].siap TETAP false. Membalik: hapus blok ini (kartu hilang, daftar lama kembali). ===== */
const OSX_NOTE = 'Sesi dihentikan karena layar tersembunyi, kamu pindah halaman, atau memulai latihan lain saat latihan berjalan. Mulai lagi kapan saja.';
const OSX_LAIN = 'Sesi dihentikan karena kamu memulai latihan lain.';
const OSX_MINRT = 150;         // ms: jawaban yang tiba lebih cepat dari ini sesudah kata muncul diabaikan (ketukan ganda dari tombol Mulai, pantulan tombol); di bawah waktu pilih manusia
const OSX_JEDA_ULANG = 700;    // ms: "Ulangi sesi" diabaikan sesudah layar hasil tergambar (ketukan terlambat dari sesi tidak langsung memulai sesi baru)
const OSX_KEY = Object.freeze({ '1': 'merah', '2': 'biru', '3': 'hijau', '4': 'kuning' });   // papan ketik fisik: angka 1 sampai 4 = urutan tombol
const OSX = { s: ostBaru(), raf: 0, note: null, tRes: 0, sec: -1, ban: undefined };   // s = keadaan sesi di memori; sec = detik tersisa yang terakhir digambar; tRes = waktu layar hasil digambar; ban = pembanding dikunci saat sesi selesai
const osxRun = s => s.fase === 'jalan';
const osxOn = () => curView === 'sinaps' && nwTab.sinaps === 'latihan' && !document.hidden;
const osxAcak = () => [Math.random(), Math.random(), Math.random()];
function osxKunci(k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(OSX_KEY, k) ? OSX_KEY[k] : null; }   // MURNI: tombol papan ketik -> warna, atau null
function osxStop() { if (OSX.raf) { cancelAnimationFrame(OSX.raf); OSX.raf = 0; } }
function osxFinish() {   // dipanggil sekali saat sesi selesai: pembanding dihitung dari catatan lama (sesi ini belum disimpan, jadi tidak menghitung dirinya sendiri) lalu dikunci
  const s = OSX.s; if (s.fase !== 'selesai') return; let ban = null;
  try { const r = ostRingkas(s); if (r.sah && SNS.ready) ban = ostBanding(r.raw, SNS.data.sesi, today()); } catch (e) { ban = null; }
  OSX.ban = ban;
}
function osxDraw() {   // gambar ulang seluruh kartu (saat fase atau jawaban berubah); fokus dipulihkan ke tombol yang sama bila tadinya di dalam kartu
  const body = $('#ostBody'); if (!body) return;
  const ae = document.activeElement, had = !!(ae && body.contains(ae)), fk = had && ae.dataset ? ae.dataset.fk : null, now = performance.now();
  body.innerHTML = osvHtml(OSX.s, { now, ban: OSX.s.fase === 'selesai' ? OSX.ban : undefined, note: OSX.note });
  body.querySelectorAll('.osk-key').forEach(b => { const k = Object.keys(OSX_KEY).find(x => OSX_KEY[x] === b.dataset.v); if (k) b.setAttribute('aria-keyshortcuts', k); });
  OSX.sec = OSX.s.fase === 'jalan' ? osvSisaDetik(OSX.s, now) : -1;
  if (OSX.s.fase === 'selesai') OSX.tRes = now;
  if (had) {
    let t = fk ? body.querySelector('[data-fk="' + fk + '"]:not(:disabled)') : null;
    if (!t && OSX.s.fase !== 'jalan') t = body.querySelector('.btn:not(:disabled)');   // siap atau selesai: satu tombol aksi (Mulai, Ulangi)
    if (!t) { t = body; body.setAttribute('tabindex', '-1'); }   // saat berjalan fokus ke kartu, BUKAN ke tombol warna: Enter atau spasi dari tombol Mulai tidak boleh langsung menjawab
    try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
}
function osxDrawSisa() {   // tiap detik hanya baris "Sisa N detik" yang diperbarui (tombol TIDAK dibuat ulang: ketukan yang sedang berlangsung tidak hilang)
  const body = $('#ostBody'), p = body && body.querySelector('.otr-prog'); if (!p || OSX.s.fase !== 'jalan') return;
  const tmp = document.createElement('div'); tmp.innerHTML = osvHtml(OSX.s, { now: performance.now() });
  const q = tmp.querySelector('.otr-prog'); if (q && q.textContent !== p.textContent) p.textContent = q.textContent;
}
function osxLoop() {
  OSX.raf = 0;
  if (!osxOn()) { osxLeave(); return; }
  const now = performance.now(), s = ostTick(OSX.s, now);
  if (s !== OSX.s) { OSX.s = s; osxFinish(); osxDraw(); return; }   // batas 30 detik tercapai
  const sec = osvSisaDetik(OSX.s, now); if (sec !== OSX.sec) { OSX.sec = sec; osxDrawSisa(); }
  if (osxRun(OSX.s)) OSX.raf = requestAnimationFrame(osxLoop);
}
function osxLeave() { osxStop(); OSX.s = ostBaru(); OSX.note = null; OSX.ban = undefined; OSX.sec = -1; }   // pindah tab atau halaman: sesi di memori dibuang (belum ada simpan)
function osxAbort(note) { osxLeave(); OSX.note = note || null; osxDraw(); }
function osxGo() {
  if (OSX.s.fase === 'selesai' && performance.now() - OSX.tRes < OSX_JEDA_ULANG) return;   // ketukan terlambat dari sesi tadi tidak memulai sesi baru
  osxStop(); OSX.note = null; OSX.ban = undefined; OSX.s = ostMulai(ostBaru(), performance.now(), osxAcak()); osxDraw();
  if (osxRun(OSX.s)) OSX.raf = requestAnimationFrame(osxLoop);
}
function osxJawab(w) {
  const s0 = OSX.s; if (!osxRun(s0) || OST.warna.indexOf(w) < 0) return;
  const now = performance.now(); if (now - s0.tMuncul < OSX_MINRT) return;   // terlalu cepat untuk jawaban manusia: abaikan
  const s = ostJawab(s0, w, now, osxAcak()); if (s === s0) return;
  OSX.s = s; if (s.fase === 'selesai') { osxStop(); osxFinish(); }   // jawaban di atau sesudah batas tidak dihitung: mesin menutup sesi
  osxDraw();
}
QACT.ostGo = () => {
  if (otvRun(OTV.s)) otvAbort(OSX_LAIN);
  if (otxRun(OTX.s)) otxAbort(OSX_LAIN);
  osxGo();
};
QACT.ostJawab = el => osxJawab(el && el.dataset ? el.dataset.v : '');
document.addEventListener('keydown', ev => {   // papan ketik fisik: 1 Merah, 2 Biru, 3 Hijau, 4 Kuning (tidak bila fokus di kolom isian, tidak saat tombol ditahan)
  if (OSX.s.fase !== 'jalan' || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || !osxOn() || !$('#ostBody')) return;
  const t = ev.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  const w = osxKunci(ev.key); if (w) { ev.preventDefault(); osxJawab(w); }
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && osxRun(OSX.s)) osxAbort(OSX_NOTE); });
{ const baseGoV = otvGo; otvGo = function () { if (osxRun(OSX.s)) osxAbort(OSX_LAIN); return baseGoV.apply(this, arguments); }; }   // memulai Waktu reaksi menghentikan sesi Stroop yang berjalan
{ const baseGoD = otxGo; otxGo = function () { if (osxRun(OSX.s)) osxAbort(OSX_LAIN); return baseGoD.apply(this, arguments); }; }   // memulai Rentang digit juga
{ const baseMountS = otvMount; otvMount = function () {   // sisipkan kartu Stroop tepat di atas "Latihan berikutnya"; daftar diganti osvListHtml (tanpa Waktu reaksi, Rentang digit, Stroop)
  const w = baseMountS.apply(this, arguments); if (!w) return w;
  const nx = w.querySelector('.otr-next'), ls = osvListHtml();
  if (nx) { if (ls) { const tmp = document.createElement('div'); tmp.innerHTML = ls; nx.replaceWith(tmp.firstElementChild); } else nx.remove(); }
  const sec = document.createElement('section'); sec.className = 'nw-card otr-card osk-card'; sec.id = 'ostBody'; sec.setAttribute('aria-label', 'Stroop');
  const nx2 = w.querySelector('.otr-next'); if (nx2) w.insertBefore(sec, nx2); else w.appendChild(sec);
  osxDraw(); if (osxRun(OSX.s) && !OSX.raf) OSX.raf = requestAnimationFrame(osxLoop);
  return w;
}; }
{ const baseNwOsx = nwRender; nwRender = function (key) {
  baseNwOsx.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps !== 'latihan') osxLeave();
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl3b2: Object.freeze({ kunci: osxKunci, state: () => OSX.s, view: () => ({ note: OSX.note, ban: OSX.ban, sec: OSX.sec }), go: osxGo, jawab: osxJawab, abort: osxAbort, minRtMs: OSX_MINRT, jedaUlangMs: OSX_JEDA_ULANG }) }));
/* ===== OTL-3b2-end ===== */
/* ===== OTL-3c-begin (20 Nov 2026): Sinaps > Latihan > Stroop, bagian 3c: SIMPAN sesi lewat snsPut (kunci dailylog:sinaps:v1) saat layar "Sesi selesai" tampil; hanya sesi sah (ostKeSesi: >= 10 percobaan dan >= 70 persen benar); pembanding dikunci SEBELUM sesi baru masuk catatan; status simpan jujur (menyimpan, tersimpan, tidak sah, gagal + coba lagi) menggantikan kalimat "belum disimpan". Pola OTL-2c (pesan dan kode gagal dipakai bersama dari OTL-1c). SN_EX[2].siap menjadi true dan satuan rekor "jawaban" (2 baris lama diubah di luar blok). Pembungkus osvHtml dan osxFinish (0 baris OTL-3b diubah). Membalik: hapus blok ini, kembalikan `siap` di SN_EX ke reaksi dan digit saja dan SNH_UNIT tanpa stroop. ===== */
function oszSimpanHtml(sv) {   // MURNI: status simpan -> paragraf status (+ tombol Coba simpan lagi bila boleh); sv kosong = masih menyimpan; pesan gagal = OTV_SV_KODE (OTL-1c)
  const st = sv && sv.st, p = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (st === 'ok') return p('Hasil sesi tersimpan di perangkat ini dan ikut cadangan JSON.');
  if (st === 'takSah') return p('Sesi belum sah, jadi tidak disimpan.');
  if (st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && otvHas(OTV_SV_KODE, k) ? OTV_SV_KODE[k] : 'Belum tersimpan (' + String(k) + ').';
    return p(t) + (otvBolehUlang(k) ? '<div class="snh-act"><button class="btn" type="button" data-q="ostSave" data-fk="ost-save">Coba simpan lagi</button></div>' : '');
  }
  return p('Menyimpan hasil sesi…');
}
function oszPasangSimpan(h, sv) { return typeof h === 'string' && h.indexOf(OSV_BELUM_P) >= 0 ? h.replace(OSV_BELUM_P, () => oszSimpanHtml(sv)) : h; }   // MURNI: ganti kalimat lama "belum disimpan" dengan status simpan
const OSZ_HTML0 = osvHtml;
function oszHtmlS(s, o, sv) {   // MURNI: fase selain selesai = persis hasil OTL-3b; selesai = pembanding terkunci (sv.ban) + status simpan
  if (!s || s.fase !== 'selesai') return OSZ_HTML0(s, o);
  const o2 = sv && sv.ban !== undefined ? Object.assign({}, o, { ban: sv.ban }) : o;
  return oszPasangSimpan(OSZ_HTML0(s, o2), sv);
}
/* OTL-3c-pure-end */
OSX.sv = null;   // { s: keadaan selesai yang disimpan, ses: { ex, d, raw } atau null, ban: pembanding terkunci, st: menyimpan | ok | gagal | takSah, kode }
osvHtml = function (s, o) { return oszHtmlS(s, o, o && o.sv !== undefined ? o.sv : (OSX.sv && OSX.sv.s === s ? OSX.sv : null)); };
function osxSimpan(v) {
  v.st = 'menyimpan'; v.kode = '';
  let p; try { p = snsPut(v.ses, Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(r => { v.st = r && r.ok ? 'ok' : 'gagal'; v.kode = r && r.ok ? '' : ((r && r.kode) || 'galat'); }, () => { v.st = 'gagal'; v.kode = 'galat'; })
    .then(() => { if (OSX.sv === v && OSX.s === v.s) osxDraw(); });
}
function osxUlang() { const v = OSX.sv; if (!v || v.s !== OSX.s || v.st !== 'gagal' || !v.ses || !otvBolehUlang(v.kode)) return; osxSimpan(v); osxDraw(); }
{ const baseFinishZ = osxFinish; osxFinish = function () {   // dipanggil sekali per sesi selesai (penjaga: keadaan yang sama tidak diproses dua kali, jadi pembanding tidak ikut menghitung sesi ini)
  const s = OSX.s; if (s.fase !== 'selesai' || (OSX.sv && OSX.sv.s === s)) return;
  baseFinishZ.apply(this, arguments);   // menghitung dan mengunci OSX.ban dari catatan lama (sesi ini belum masuk catatan)
  const ses = ostKeSesi(s, today()), v = { s, ses, ban: OSX.ban, st: ses ? 'menyimpan' : 'takSah', kode: '' };
  OSX.sv = v; if (ses) osxSimpan(v);   // pemanggil menggambar ulang sesudahnya
}; }
QACT.ostSave = () => osxUlang();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl3c: Object.freeze({ simpanHtml: oszSimpanHtml, pasang: oszPasangSimpan, htmlS: oszHtmlS, sv: () => OSX.sv ? { st: OSX.sv.st, kode: OSX.sv.kode, ban: OSX.sv.ban, ses: OSX.sv.ses } : null, finish: osxFinish, ulang: osxUlang }) }));
/* ===== OTL-3c-end ===== */
/* ===== OTL-3d-begin (20 Nov 2026): Sinaps > Latihan > Stroop, bagian 3d-1: LOGIKA MURNI riwayat (rekor = jawaban benar terbanyak, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, titik harian 14 hari). Belum ada tampilan; tidak mengubah baris lama. Memakai snClean/snDayOk/snAddDays (SNH-1a), OQW dan otqGrafik (OTL-2d), OST dan ostMed (OTL-3a). Membalik: hapus blok ini. ===== */
const OSQ = Object.freeze({ hari: OQW.hari, tren: OQW.tren, minTren: OQW.minTren, banding: OST.banding, terakhir: OQW.terakhir, maks: OST.maks });   // jendela dan jumlah sama dengan riwayat Rentang digit (OQW); banding = beda minimal (jawaban benar) yang sama dengan pembanding sesi Stroop (OTL-3a)
const osqTren0 = Object.freeze({ kode: 'belum_cukup', n1: 0, n2: 0, kini: null, basis: null, selisih: null });
const osqKosong = Object.freeze({ total: 0, masaDepan: 0, hari: 0, rekor: null, terakhir: null, daftar: Object.freeze([]), titik: Object.freeze([]), tren: osqTren0 });
function osqRiwayat(list, today) {   // MURNI, tidak melempar galat: daftar sesi mentah + tanggal hari ini -> ringkasan riwayat Stroop (hanya sesi `stroop` dengan raw bulat 1..OST.maks = jumlah jawaban benar; tanggal masa depan tidak dihitung, hanya dicacah)
  if (!snDayOk(today)) return osqKosong;
  const all = snClean(list).sesi.filter(x => x.ex === 'stroop' && Number.isInteger(x.raw) && x.raw >= 1 && x.raw <= OSQ.maks), v = all.filter(x => x.d <= today), depan = all.length - v.length;
  if (!v.length) return depan ? Object.freeze(Object.assign({}, osqKosong, { masaDepan: depan })) : osqKosong;
  let rek = null; v.forEach(x => { if (rek === null || x.raw > rek.raw) rek = x; });   // terbanyak; seri = yang paling awal (urutan tanggal)
  const hari = []; v.forEach(x => { if (hari.indexOf(x.d) < 0) hari.push(x.d); });
  const daftar = v.slice(-OSQ.terakhir).reverse().map(x => Object.freeze({ raw: x.raw, d: x.d }));   // terbaru dahulu; pada hari yang sama, yang disimpan terakhir dahulu
  const titik = [];
  for (let k = 0; k < OSQ.hari; k++) {
    const d = snAddDays(today, -(OSQ.hari - 1 - k)), r = v.filter(x => x.d === d).map(x => x.raw);
    if (r.length) titik.push(Object.freeze({ d, x: k, n: r.length, raw: ostMed(r) }));   // median per hari (bisa x,5), sama dengan dasar pembanding sesi OTL-3a
  }
  const a0 = snAddDays(today, -(OSQ.tren - 1)), b0 = snAddDays(today, -(2 * OSQ.tren - 1)), b1 = snAddDays(today, -OSQ.tren);
  const A = v.filter(x => x.d >= a0).map(x => x.raw), B = v.filter(x => x.d >= b0 && x.d <= b1).map(x => x.raw);
  let tren = Object.freeze(Object.assign({}, osqTren0, { n1: A.length, n2: B.length }));
  if (A.length >= OSQ.minTren && B.length >= OSQ.minTren) {
    const kini = ostMed(A), basis = ostMed(B), sel = kini - basis;
    tren = Object.freeze({ kode: sel >= OSQ.banding ? 'lebih_banyak' : sel <= -OSQ.banding ? 'lebih_sedikit' : 'sekitar', n1: A.length, n2: B.length, kini, basis, selisih: sel });
  }
  return Object.freeze({ total: v.length, masaDepan: depan, hari: hari.length, rekor: Object.freeze({ raw: rek.raw, d: rek.d }), terakhir: daftar[0], daftar: Object.freeze(daftar), titik: Object.freeze(titik), tren });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl3d: Object.freeze({ cfg: OSQ, riwayat: osqRiwayat, grafik: otqGrafik }) }));   // grafik = otqGrafik yang SUDAH ADA (OTL-2d-1), tidak diubah
/* OTL-3d-pure-end */
/* ===== OTL-3d-end ===== */
/* ===== OTL-3d2-begin (20 Nov 2026): Sinaps > Latihan > Stroop, bagian 3d-2: TAMPILAN kartu "Riwayat Stroop" di tab Latihan (rekor = jawaban benar terbanyak, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, grafik garis median harian 14 hari, 5 sesi terbaru). Hanya BACA dari SNS.data; tidak menulis apa pun. Pembangun HTML murni (osqvHtml) + pengendali (pembungkus otvMount dan osxDraw; 0 baris lama diubah). CSS memakai kelas orh-* dari OTL-1d2 dan snh-* dari SNH-1d2 (tanpa CSS baru). Logika dari OTL-3d-1 (osqRiwayat, otqGrafik). Membalik: hapus blok ini. ===== */
const OSQV_FINE = 'Riwayat dihitung di perangkat ini dari sesi Stroop yang tersimpan; hanya sesi sah (minimal 10 jawaban dan 70 persen benar) yang disimpan. Nilai sesi = jumlah jawaban benar dalam 30 detik. Median dipakai supaya satu sesi yang sangat bagus atau sangat buruk tidak menggeser angka. Stroop ikut dipengaruhi kantuk, tidur, dan gangguan, jadi anggap ini gambaran kebiasaan, bukan nilai kecerdasan.';
const osqvJwb = v => snhNum(v) + '\u00a0jawaban';
function osqvTrenTeks(t) {   // MURNI: keluaran tren osqRiwayat -> kalimat
  if (!t || t.kode === 'belum_cukup') { const a = t && typeof t.n1 === 'number' ? t.n1 : 0, b = t && typeof t.n2 === 'number' ? t.n2 : 0; const pt = n => n >= OSQ.minTren ? 'cukup' : (n > 0 ? n : 0) + ' dari ' + OSQ.minTren + ' sesi'; return 'Tren belum tersedia. ' + OSQ.tren + ' hari terakhir: ' + pt(a) + '; sebelumnya: ' + pt(b) + '.'; }
  const aw = 'Tren: median ' + OSQ.tren + ' hari terakhir ' + osqvJwb(t.kini), ak = ' dari ' + OSQ.tren + ' hari sebelumnya (' + osqvJwb(t.basis) + ').', p = osqvJwb(Math.abs(t.selisih));
  return t.kode === 'lebih_banyak' ? aw + ', lebih banyak ' + p + ak : t.kode === 'lebih_sedikit' ? aw + ', lebih sedikit ' + p + ak : aw + ', sekitar sama dengan ' + OSQ.tren + ' hari sebelumnya (' + osqvJwb(t.basis) + '; selisih ' + p + ').';
}
function osqvSvg(g, today) {   // MURNI: keluaran otqGrafik (>= 2 titik) -> <svg>; warna lewat kelas CSS orh-* (token tema)
  const P = g.pts, mn = Math.min.apply(null, P.map(p => p.raw)), mx = Math.max.apply(null, P.map(p => p.raw));
  const lab = 'Grafik garis median Stroop per hari dalam ' + OSQ.hari + ' hari terakhir: ' + P.length + ' hari berisi data, dari ' + snhNum(mn) + ' sampai ' + snhNum(mx) + ' jawaban benar. Angka lengkap ada di daftar sesi terbaru.';
  return '<svg class="orh-svg" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(lab) + '"><line class="orh-g" x1="0" y1="' + (g.h - 0.5) + '" x2="' + g.w + '" y2="' + (g.h - 0.5) + '"/>' +
    '<polyline class="orh-l" points="' + P.map(p => p.x + ',' + p.y).join(' ') + '"/>' +
    P.map(p => '<circle class="orh-d" cx="' + p.x + '" cy="' + p.y + '" r="3.5"><title>' + esc(orhTgl(p.d, today) + ': ' + snhNum(p.raw) + ' jawaban' + (p.n > 1 ? ' (median ' + p.n + ' sesi)' : '')) + '</title></circle>').join('') + '</svg>';
}
function osqvHtml(rw, o, today) {   // MURNI: tidak mengubah masukan, tidak melempar galat; rw = keluaran osqRiwayat (atau null), o = { st: 'baca' | 'belum' | 'ok', blocked } -> isi kartu (tanpa pembungkus)
  o = o || {}; const hd = '<div class="nw-hd"><h3>Riwayat Stroop</h3></div>', fine = '<p class="nw-fine">' + esc(OSQV_FINE) + '</p>', st = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (o.st === 'baca') return hd + st('Membaca catatan latihan…') + fine;
  if (o.st !== 'ok' || !rw) return hd + st('Catatan latihan belum terbaca, jadi riwayat belum bisa ditampilkan.') + '<div class="snh-act"><button class="btn" type="button" data-q="osqvRetry" data-fk="osqv-retry">Coba baca lagi</button></div>' + fine;
  const blk = o.blocked ? st('Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Riwayat hanya dibaca; sesi baru tidak disimpan.') : '';
  const depan = rw.masaDepan > 0 ? st(rw.masaDepan + ' sesi bertanggal di masa depan tidak dihitung. Periksa jam perangkat.') : '';
  if (!rw.total) return hd + blk + depan + '<p class="nw-p otr-p">Belum ada sesi Stroop tersimpan. Selesaikan satu sesi sah di atas (minimal 10 jawaban dan 70 persen benar); rekor dan grafik muncul di sini.</p>' + fine;
  const tile = (v, nama, tgl) => '<div class="snh-t"><b class="snh-big">' + esc(snhNum(v)) + ' <i>jawaban</i></b><span>' + esc(nama) + '</span><small>' + esc(tgl) + '</small></div>';
  let x = hd + blk + depan + '<div class="snh-st">' + tile(rw.rekor.raw, 'Rekor terbaik', orhTgl(rw.rekor.d, today)) + tile(rw.terakhir.raw, 'Sesi terakhir', orhTgl(rw.terakhir.d, today)) + '</div>' +
    '<p class="nw-p otr-p">' + rw.total + ' sesi tersimpan di ' + rw.hari + ' hari berlatih.</p><p class="nw-p otr-p">' + esc(osqvTrenTeks(rw.tren)) + '</p>' +
    '<h4 class="orh-h">Median per hari, ' + OSQ.hari + ' hari terakhir</h4>';
  const g = otqGrafik(rw.titik, 300, 90, 8);
  x += g.pts.length >= 2 ? '<div class="orh-svgw">' + osqvSvg(g, today) + '</div>' + orhSumbuTgl(today, OSQ.hari) + '<p class="otr-prog">Skala ' + snhNum(g.lo) + ' sampai ' + snhNum(g.hi) + ' jawaban · makin tinggi makin banyak</p>'
    : '<p class="nw-p otr-p">Grafik muncul begitu ada sesi di dua hari berbeda dalam ' + OSQ.hari + ' hari terakhir.</p>';
  x += '<h4 class="orh-h">Sesi terbaru</h4><ul class="snh-l">' + rw.daftar.map(s => '<li class="snh-r"><span class="snh-rn">' + esc(osqvJwb(s.raw)) + '</span>' +
    (s.d === rw.rekor.d && s.raw === rw.rekor.raw ? '<span class="snh-chip snh-ok">Rekor</span>' : '') + '<span class="snh-rc">' + esc(orhTgl(s.d, today)) + '</span></li>').join('') + '</ul>';
  return x + fine;
}
/* OTL-3d2-pure-end */
const OSQV = { sig: '' };
function osqvState() { return { st: SNS.ready ? 'ok' : (SNS.loading ? 'baca' : 'belum'), blocked: SNS.blocked }; }
function osqvSig() { return [SNS.ready, SNS.loading, SNS.blocked, SNS.data.sesi.length, SNS.data.u, today()].join('|'); }
function osqvDraw(paksa) {   // gambar ulang kartu hanya bila isinya berubah; aman dipanggil sering (osxDraw memanggilnya pada tiap jawaban, jadi pemeriksaan tanda harus murah)
  const el = $('#osqvBody'); if (!el) return; const sig = osqvSig(); if (!paksa && sig === OSQV.sig && el.innerHTML) return;
  OSQV.sig = sig; let rw = null; try { rw = SNS.ready ? osqRiwayat(SNS.data.sesi, today()) : null; } catch (e) { rw = null; }
  const ae = document.activeElement, had = !!(ae && el.contains(ae));
  try { el.innerHTML = osqvHtml(rw, osqvState(), today()); } catch (e) { el.innerHTML = ''; }
  if (had) { const t = el.querySelector('.btn'); try { if (t) t.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } } catch (e) { /* abaikan */ } }
}
function osqvRetry() { let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } osqvDraw(true); Promise.resolve(p).then(() => osqvDraw(true), () => osqvDraw(true)); }
{ const baseMountW = otvMount; otvMount = function () {   // sisipkan kartu Riwayat Stroop tepat di bawah kartu Stroop (di atas "Latihan berikutnya")
  const w = baseMountW.apply(this, arguments); if (!w) return w;
  const sec = document.createElement('section'); sec.className = 'nw-card orh-card osqv-card'; sec.id = 'osqvBody'; sec.setAttribute('aria-label', 'Riwayat Stroop');
  const s = w.querySelector('#ostBody'), nx = w.querySelector('.otr-next');
  if (s && s.nextSibling) w.insertBefore(sec, s.nextSibling); else if (nx) w.insertBefore(sec, nx); else w.appendChild(sec);
  OSQV.sig = ''; osqvDraw(true); snsLoad().then(() => osqvDraw());
  return w;
}; }
{ const baseDrawW = osxDraw; osxDraw = function () { baseDrawW.apply(this, arguments); osqvDraw(); }; }   // sesudah simpan berhasil, osxDraw dipanggil: sesi baru ikut tampil
QACT.osqvRetry = () => osqvRetry();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl3d2: Object.freeze({ html: osqvHtml, trenTeks: osqvTrenTeks, svg: osqvSvg, draw: osqvDraw, retry: osqvRetry }) }));
/* ===== OTL-3d2-end ===== */
/* ===== OTL-4a-begin (20 Nov 2026): Sinaps > Latihan > Corsi (balok), bagian 4a: LOGIKA MURNI (mesin keadaan; bilangan acak DISUNTIKKAN; tanpa jam, tanpa acak sendiri, tanpa DOM). Belum ada tampilan, tombol, atau penyimpanan; SN_EX tidak diubah. Hanya urutan MAJU. Membalik: hapus blok ini. ===== */
const OTC = Object.freeze({ awal: 2, maks: 9, blok: 9, coba: 2, tampilMs: 700, jedaMs: 300, banding: 1, hariBanding: 14, minBanding: 3 });   // awal = panjang pertama; maks = blok (tanpa blok berulang dalam satu urutan); coba = percobaan per panjang; tampilMs + jedaMs = 1000 ms per blok; banding = selisih minimal (blok) agar dianggap beda
const OTC_PAPAN = Object.freeze([[0.26, 0.88], [0.17, 0.58], [0.88, 0.84], [0.72, 0.12], [0.48, 0.48], [0.12, 0.23], [0.79, 0.42], [0.42, 0.17], [0.56, 0.79]].map(p => Object.freeze({ x: p[0], y: p[1] })));   // letak 9 blok pada papan persegi (0 sampai 1, pusat blok); tidak membentuk kisi; selisih x atau y terkecil antar dua pusat >= 0,30, jadi blok selebar 0,2 tidak bertumpuk (OTL-4b-1: ukuran lama memakai jarak Euclid 0,23 dan blok bertumpuk di diagonal)
const otcIs = (x, a, b) => typeof x === 'number' && Number.isInteger(x) && x >= a && x <= b;
const otcSet = (s, p) => Object.freeze(Object.assign({}, s, p));
function otcBaru() { return Object.freeze({ fase: 'siap', len: OTC.awal, coba: 1, urut: null, jawab: Object.freeze([]), span: 0, riwayat: Object.freeze([]), last: null }); }
function otcUrut(len, acak, hindar) {   // MURNI: urutan blok 0 sampai 8 sepanjang len; TIDAK ada blok berulang; tidak identik dengan `hindar` (urutan sebelumnya pada panjang yang sama); acak = larik bilangan di [0,1) (butir tak sah dianggap 0,5)
  if (!otcIs(len, 1, OTC.maks)) return Object.freeze([]);
  const r = i => { const v = Array.isArray(acak) ? acak[i] : undefined; return typeof v === 'number' && v >= 0 && v < 1 ? v : 0.5; }, pool = [], d = [];
  for (let i = 0; i < OTC.blok; i++) pool.push(i);
  for (let i = 0; i < len; i++) d.push(pool.splice(Math.floor(r(i) * pool.length), 1)[0]);
  if (Array.isArray(hindar) && hindar.length === len && hindar.every((v, i) => v === d[i])) {
    if (pool.length) d[len - 1] = pool[0];   // masih ada blok yang belum dipakai: ganti blok terakhir dengannya
    else { const t = d[len - 1]; d[len - 1] = d[len - 2]; d[len - 2] = t; }   // 9 dari 9 blok terpakai: tukar dua yang terakhir
  }
  return Object.freeze(d);
}
function otcJadwal(len) {   // MURNI: kapan tiap blok menyala dan padam (ms sejak mulai); total = waktu sampai papan dibuka untuk dijawab
  if (!otcIs(len, 1, OTC.maks)) return Object.freeze({ total: 0, butir: Object.freeze([]) });
  const per = OTC.tampilMs + OTC.jedaMs, b = []; for (let i = 0; i < len; i++) b.push(Object.freeze({ i, on: i * per, off: i * per + OTC.tampilMs }));
  return Object.freeze({ total: len * per, butir: Object.freeze(b) });
}
function otcMulaiCoba(s, acak) { const prev = s.riwayat.length ? s.riwayat[s.riwayat.length - 1].urut : null; return otcSet(s, { fase: 'tampil', urut: otcUrut(s.len, acak, prev), jawab: Object.freeze([]), last: null }); }
function otcMulai(s, acak) { return s.fase === 'siap' ? otcMulaiCoba(s, acak) : s; }
function otcTampilSelesai(s) { return s.fase === 'tampil' ? otcSet(s, { fase: 'jawab' }) : s; }
function otcTap(s, b) { return s.fase === 'jawab' && otcIs(b, 0, OTC.blok - 1) && s.jawab.length < s.len ? otcSet(s, { jawab: Object.freeze(s.jawab.concat([b])) }) : s; }
function otcHapus(s) { return s.fase === 'jawab' && s.jawab.length ? otcSet(s, { jawab: Object.freeze(s.jawab.slice(0, -1)) }) : s; }
function otcKirim(s) {   // hanya bila ketukan selengkap urutan; benar = urutan sama persis
  if (s.fase !== 'jawab' || s.jawab.length !== s.len) return s;
  const benar = s.urut.every((v, i) => v === s.jawab[i]), rec = Object.freeze({ len: s.len, coba: s.coba, benar, urut: s.urut, jawab: s.jawab });
  return otcSet(s, { fase: 'umpan', span: benar ? Math.max(s.span, s.len) : s.span, riwayat: Object.freeze(s.riwayat.concat([rec])), last: Object.freeze({ benar, len: s.len, coba: s.coba }) });
}
function otcLanjut(s, acak) {   // benar: panjang + 1 (selesai bila sudah panjang maksimum); salah: percobaan kedua pada panjang yang sama, atau selesai bila dua-duanya salah
  if (s.fase !== 'umpan' || !s.last) return s;
  if (s.last.benar) return s.len >= OTC.maks ? otcSet(s, { fase: 'selesai' }) : otcMulaiCoba(otcSet(s, { len: s.len + 1, coba: 1 }), acak);
  return s.coba >= OTC.coba ? otcSet(s, { fase: 'selesai' }) : otcMulaiCoba(otcSet(s, { coba: s.coba + 1 }), acak);
}
function otcRingkas(s) {   // MURNI; span = urutan terpanjang yang dijawab benar; sesi sah bila span >= panjang awal; raw = span
  const benar = s.riwayat.filter(x => x.benar).length, sah = s.span >= OTC.awal;
  return Object.freeze({ selesai: s.fase === 'selesai', span: s.span, percobaan: s.riwayat.length, benar, salah: s.riwayat.length - benar, sah, raw: sah ? s.span : null });
}
function otcKeSesi(s, d) {   // sesi untuk disimpan ({ ex, d, raw }) atau null bila belum selesai, tidak sah, atau tanggal tak sah
  const r = otcRingkas(s); if (!r.selesai || !r.sah || !snDayOk(d)) return null;
  return Object.freeze({ ex: 'corsi', d, raw: r.raw });
}
function otcBanding(raw, sesi, today) {   // bandingkan dengan median rentang Corsi diri sendiri 14 hari terakhir (hari ini ikut); perlu >= 3 sesi; beda minimal 1 blok. Dipanggil SEBELUM sesi baru ditambahkan
  const kosong = n => Object.freeze({ kode: 'belum_cukup', n, basis: null, selisih: null });
  if (!otcIs(raw, 0, OTC.maks) || !snDayOk(today)) return kosong(0);
  const awal = snAddDays(today, -(OTC.hariBanding - 1)), v = snClean(sesi).sesi.filter(x => x.ex === 'corsi' && x.d >= awal && x.d <= today).map(x => x.raw), basis = otrMedian(v);
  if (v.length < OTC.minBanding) return kosong(v.length);
  const sel = raw - basis, kode = sel >= OTC.banding ? 'lebih_panjang' : sel <= -OTC.banding ? 'lebih_pendek' : 'sekitar';
  return Object.freeze({ kode, n: v.length, basis, selisih: sel });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4a: Object.freeze({ cfg: OTC, papan: OTC_PAPAN, baru: otcBaru, urut: otcUrut, jadwal: otcJadwal, mulai: otcMulai, tampilSelesai: otcTampilSelesai, tap: otcTap, hapus: otcHapus, kirim: otcKirim, lanjut: otcLanjut, ringkas: otcRingkas, keSesi: otcKeSesi, banding: otcBanding }) }));
/* ===== OTL-4a-end ===== */
/* ===== OTL-4b-begin (20 Nov 2026): Sinaps > Latihan > Corsi (balok), bagian 4b-1: PEMBANGUN HTML MURNI kartu "Corsi" (satu cabang per fase: siap, tampil, jawab, umpan, selesai), kalimat pembanding, dan daftar "Latihan berikutnya" tanpa latihan yang sudah punya kartu. BELUM dipasang ke halaman (4b-2) dan belum menyimpan (4c); SN_EX tidak diubah. Membalik: hapus blok ini dan CSS OTL-4b. ===== */
/* OTL-4b-pure-begin */
const OCV_INTRO = 'Sembilan blok tersebar di papan. Beberapa blok menyala satu per satu; ingat urutannya, lalu ketuk blok yang sama dengan urutan yang sama. Mulai dari 2 blok, naik satu setiap kali benar. Dua kali salah pada panjang yang sama mengakhiri sesi. Sesi dihitung sah bila kamu benar minimal sekali pada urutan 2 blok.';
const OCV_FINE = 'Latihan ini hanya mengukur dan melatih tugas ini sendiri, bukan bukti otak jadi lebih pintar. Hasilnya dipengaruhi kantuk dan gangguan di sekitarmu, jadi bandingkan hanya dengan dirimu sendiri. Latihan ini hanya bisa dipakai dengan melihat dan mengetuk layar.';
const OCV_BELUM_P = '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>';
const OCV_KARTU = Object.freeze(['reaksi', 'digit', 'stroop', 'corsi']);   // latihan yang sudah punya kartu sendiri: tidak masuk daftar "Latihan berikutnya"
const ocvA = n => n + '\u00a0blok';
function ocvBandingTeks(b) {   // MURNI: keluaran otcBanding (atau null bila catatan belum terbaca) -> kalimat
  if (!b) return 'Catatan latihan belum terbaca, jadi pembanding tidak ditampilkan.';
  if (b.kode === 'belum_cukup') return 'Belum ada pembanding: butuh minimal ' + OTC.minBanding + ' sesi dalam ' + OTC.hariBanding + ' hari terakhir (sekarang ' + b.n + ').';
  const sel = ocvA(snhNum(Math.abs(b.selisih))), dari = ' dari median ' + OTC.hariBanding + ' harimu (' + ocvA(snhNum(b.basis)) + ').';
  return b.kode === 'lebih_panjang' ? 'Lebih panjang ' + sel + dari : b.kode === 'lebih_pendek' ? 'Lebih pendek ' + sel + dari : 'Sekitar biasanya: selisih ' + sel + dari;
}
function ocvLanjutTeks(s) {   // MURNI: teks tombol sesudah umpan balik
  s = s || {}; const b = !!(s.last && s.last.benar), len = Number.isInteger(s.len) ? s.len : OTC.awal, coba = Number.isInteger(s.coba) ? s.coba : 1;
  if (b) return len >= OTC.maks ? 'Lihat hasil sesi' : 'Lanjut: ' + ocvA(len + 1);
  return coba >= OTC.coba ? 'Lihat hasil sesi' : 'Coba lagi (percobaan ' + (coba + 1) + ')';
}
function ocvProg(s, selesaiCoba) {
  return '<p class="otr-prog" aria-live="off">Panjang ' + ocvA(s.len) + ' · percobaan ' + s.coba + (selesaiCoba ? ' selesai' : ' dari ' + OTC.coba) + (s.span > 0 ? ' · rentang sejauh ini ' + ocvA(s.span) : '') + '</p>';
}
function ocvPapan(s, mode, o) {   // MURNI: papan persegi 9 blok (letak dari OTC_PAPAN); tampil = blok bukan tombol, satu menyala (o.idx); jawab = 9 tombol, urutan ketukan jadi angka; umpan = angka urutan yang BENAR, blok yang salah diketuk bergaris merah
  o = o || {}; const U = Array.isArray(s.urut) ? s.urut : [], J = Array.isArray(s.jawab) ? s.jawab : [], penuh = J.length >= s.len;
  const lit = mode === 'tampil' && Number.isInteger(o.idx) && o.idx >= 0 && o.idx < U.length ? U[o.idx] : -1;
  const salah = mode === 'umpan' && !(s.last && s.last.benar) ? J.filter((v, k) => v !== U[k]) : [];
  let h = '';
  for (let i = 0; i < OTC.blok; i++) {
    const p = OTC_PAPAN[i], st = ' style="left:' + (p.x * 100).toFixed(1) + '%;top:' + (p.y * 100).toFixed(1) + '%"';
    if (mode === 'jawab') {
      const k = J.indexOf(i), pilih = k >= 0;
      h += '<button class="ock-b' + (pilih ? ' ock-sel' : '') + '" type="button" data-q="otcTap" data-v="' + i + '" data-fk="ock-b' + i + '" aria-pressed="' + (pilih ? 'true' : 'false') + '" aria-label="' + esc('Blok ' + (i + 1) + (pilih ? ', sudah dipilih, ketukan ke-' + (k + 1) : '')) + '"' + (penuh && !pilih ? ' disabled' : '') + st + '>' + (pilih ? '<span class="ock-n">' + (k + 1) + '</span>' : '') + '</button>';
    } else {
      const k = mode === 'umpan' ? U.indexOf(i) : -1;
      h += '<span class="ock-b' + (i === lit ? ' ock-on' : '') + (k >= 0 ? ' ock-sel' : '') + (salah.indexOf(i) >= 0 ? ' ock-sal' : '') + '" aria-hidden="true"' + st + '>' + (k >= 0 ? '<span class="ock-n">' + (k + 1) + '</span>' : '') + '</span>';
    }
  }
  const lbl = mode === 'tampil' ? 'Perhatikan papan: blok menyala satu per satu' : mode === 'jawab' ? 'Papan 9 blok: ketuk blok sesuai urutan tadi' : 'Papan: angka menunjukkan urutan yang benar, garis merah menandai blok yang salah kamu ketuk';
  return '<div class="ock-board" role="' + (mode === 'jawab' ? 'group' : 'img') + '" aria-label="' + esc(lbl) + '">' + h + '</div>';
}
function ocvAksi(s) {   // MURNI: Hapus (aktif bila ada ketukan) dan Kirim (aktif hanya bila ketukan selengkap urutan)
  const n = Array.isArray(s.jawab) ? s.jawab.length : 0;
  return '<div class="ock-acts"><button class="btn" type="button" data-q="otcDel" data-fk="ock-del"' + (n === 0 ? ' disabled' : '') + '>Hapus</button><button class="btn" type="button" data-q="otcSend" data-fk="ock-send"' + (n >= s.len ? '' : ' disabled') + '>Kirim</button></div>';
}
function ocvHtml(s, o) {   // MURNI: tidak mengubah masukan, tidak melempar galat; s = keadaan mesin (otcBaru ...), o = { idx, ke, ban, note } -> isi kartu (tanpa pembungkus)
  o = o || {}; s = s || otcBaru();
  const hd = '<div class="nw-hd"><h3>Corsi (balok)</h3></div>', fine = '<p class="nw-fine">' + esc(OCV_FINE) + '</p>';
  const note = o.note ? '<p class="nw-p snh-n" role="status">' + esc(o.note) + '</p>' : '';
  const btn = (q, fk, t) => '<div class="snh-act"><button class="btn" type="button" data-q="' + q + '" data-fk="' + fk + '">' + esc(t) + '</button></div>';
  const f = s.fase, ok = Number.isInteger(s.len) && s.len >= 1 && s.len <= OTC.maks && Number.isInteger(s.coba);
  if (ok && f === 'tampil') {
    const U = Array.isArray(s.urut) ? s.urut : [], ix = Number.isInteger(o.idx) && o.idx >= 0 && o.idx < U.length ? o.idx : -1, ke = ix >= 0 ? ix : (Number.isInteger(o.ke) && o.ke >= 0 && o.ke < U.length ? o.ke : -1);   // ke = blok terakhir yang sudah menyala (label tetap saat jeda)
    return hd + ocvProg(s, false) + ocvPapan(s, 'tampil', o) + '<p class="otr-prog" aria-live="off">' + (ke >= 0 ? 'Blok ' + (ke + 1) + ' dari ' + s.len : 'Bersiap…') + '</p><p class="nw-p otr-p">Ingat urutannya. Papan bisa diketuk setelah blok terakhir padam.</p>' + fine;
  }
  if (ok && f === 'jawab') return hd + ocvProg(s, false) + ocvPapan(s, 'jawab', o) + ocvAksi(s) + '<p class="nw-p otr-p">Ketuk blok yang tadi menyala, dengan urutan yang sama.</p>' + fine;
  if (ok && f === 'umpan') {
    const benar = !!(s.last && s.last.benar);
    return hd + ocvProg(s, true) + ocvPapan(s, 'umpan', o) + '<div class="otr-res" role="status"><b class="otr-big">' + (benar ? 'Benar' : 'Salah') + '</b><span>' + (benar ? 'Urutan ' + ocvA(s.len) + ' kamu ulang dengan tepat.' : 'Ada blok yang tidak sesuai urutannya. Angka di papan menunjukkan urutan yang benar; blok bergaris merah adalah ketukanmu yang salah.') + '</span></div>' +
      btn('otcNext', 'ock-next', ocvLanjutTeks(s)) + fine;
  }
  if (f === 'selesai') {
    const R = Array.isArray(s.riwayat) ? s.riwayat.filter(x => x && typeof x === 'object') : [], r = otcRingkas(otcSet(s, { riwayat: Object.freeze(R) })); let x = hd + '<p class="otr-prog">Sesi selesai</p>';
    if (r.sah) {
      x += '<div class="otr-res"><span>Rentang Corsi kamu</span><b class="otr-big">' + esc(ocvA(r.span)) + '</b></div>' +
        '<div class="snh-st"><div class="snh-t"><b class="snh-big">' + r.benar + '</b><span>Jawaban benar</span></div><div class="snh-t"><b class="snh-big">' + r.salah + '</b><span>Jawaban salah</span></div></div>' +
        '<p class="nw-p otr-p">' + r.percobaan + ' percobaan. Rentang = urutan terpanjang yang kamu ulang dengan benar.</p>' +
        '<p class="nw-p otr-p">' + esc(ocvBandingTeks(o.ban === undefined ? null : o.ban)) + '</p>';
    } else x += '<div class="otr-res"><b class="otr-big">Sesi belum sah</b><span>Belum ada urutan ' + ocvA(OTC.awal) + ' yang kamu ulang dengan benar. Coba lagi dengan perhatian penuh pada layar.</span></div>';
    return x + OCV_BELUM_P + btn('otcGo', 'ock-go', 'Ulangi sesi') + fine;
  }
  return hd + note + '<p class="nw-p otr-p">' + esc(OCV_INTRO) + '</p>' + btn('otcGo', 'ock-go', 'Mulai sesi') + fine;   // siap (dan fase tak dikenal)
}
function ocvListHtml() {   // MURNI: kartu "Latihan berikutnya" dari SN_EX, tanpa latihan yang sudah punya kartu (OCV_KARTU); yang lain masih "Segera"
  const l = SN_EX.filter(e => OCV_KARTU.indexOf(e.id) < 0); if (!l.length) return '';
  return '<section class="nw-card otr-next" aria-label="Latihan berikutnya"><div class="nw-hd"><h3>Latihan berikutnya</h3></div><ul class="snh-l">' + l.map(e =>
    '<li class="snh-r"><span class="snh-rn">' + esc(e.nama) + '</span><span class="snh-chip snh-soon">Segera</span><span class="snh-rc">Belum tersedia · tahap ' + esc(e.tahap) + '</span></li>').join('') + '</ul></section>';
}
/* OTL-4b-pure-end */
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4b: Object.freeze({ html: ocvHtml, list: ocvListHtml, banTeks: ocvBandingTeks, lanjutTeks: ocvLanjutTeks, papan: ocvPapan, aksi: ocvAksi }) }));
/* ===== OTL-4b-end ===== */
/* ===== OTL-4b2a-begin (20 Nov 2026): Sinaps > Latihan > Corsi (balok), bagian 4b-2a: PEMASANGAN kartu Corsi di tab Latihan (tepat di bawah \"Riwayat Stroop\", di atas \"Latihan berikutnya\") + PENGENDALI (jeda Bersiap, blok menyala satu per satu mengikuti otcJadwal dari jam nyata, papan dibuka sesudah blok terakhir padam, ketukan mengabaikan blok yang sudah dipilih, Hapus, Kirim, Lanjut, keluar dari sesi bila layar tersembunyi atau pindah halaman atau memulai latihan lain). BELUM menyimpan (4c): hasil sesi hanya di memori dan hilang bila pindah tab; SN_EX[3].siap TETAP false; hanya mode maju. Membalik: hapus blok ini (kartu hilang, daftar lama kembali). ===== */
const OCX_BERSIAP = 1000;       // ms jeda \"Bersiap\" sebelum blok pertama menyala
const OCX_JEDA_LANJUT = 350;    // ms: \"Lanjut\" diabaikan sesudah umpan balik tergambar (ketukan ganda pada Kirim tidak melompati umpan)
const OCX_JEDA_ULANG = 700;     // ms: \"Ulangi sesi\" diabaikan sesudah layar hasil tergambar (ketukan terlambat dari tombol \"Lihat hasil sesi\" tidak langsung memulai sesi baru)
const OCX_NOTE = 'Sesi dihentikan karena layar tersembunyi, kamu pindah halaman, atau memulai latihan lain saat latihan berjalan. Mulai lagi kapan saja.';
const OCX_LAIN = 'Sesi dihentikan karena kamu memulai latihan lain.';
const OCX = { s: otcBaru(), idx: -1, ke: -1, t0: 0, raf: 0, note: null, tRes: 0, ban: undefined };   // s = keadaan sesi di memori; idx = blok yang sedang menyala; ke = blok terakhir yang sudah menyala; t0 = waktu blok pertama mulai; tRes = waktu umpan atau hasil terakhir digambar; ban = pembanding dikunci saat sesi selesai
const ocxRun = s => s.fase === 'tampil' || s.fase === 'jawab';
const ocxOn = () => curView === 'sinaps' && nwTab.sinaps === 'latihan' && !document.hidden;
const ocxAcak = () => Array.from({ length: OTC.maks }, () => Math.random());
function ocxPos(len, el) {   // MURNI: ms sejak t0 -> { idx, ke, usai }; idx = blok yang sedang menyala (-1 bersiap atau jeda), ke = blok terakhir yang sudah mulai menyala (-1 belum ada), usai = jadwal habis (papan dibuka untuk dijawab)
  const j = otcJadwal(len); if (typeof el !== 'number' || !(el >= 0) || !j.total) return Object.freeze({ idx: -1, ke: -1, usai: false });
  let idx = -1, ke = -1; for (const b of j.butir) { if (el >= b.on) ke = b.i; if (el >= b.on && el < b.off) idx = b.i; }
  return Object.freeze({ idx, ke, usai: el >= j.total });
}
function ocxStop() { if (OCX.raf) { cancelAnimationFrame(OCX.raf); OCX.raf = 0; } }
function ocxFinish() {   // dipanggil sekali saat sesi selesai: pembanding dihitung dari catatan lama (sesi ini belum disimpan, jadi tidak menghitung dirinya sendiri) lalu dikunci
  const s = OCX.s; if (s.fase !== 'selesai') return; let ban = null;
  try { const r = otcRingkas(s); if (r.sah && SNS.ready) ban = otcBanding(r.raw, SNS.data.sesi, today()); } catch (e) { ban = null; }
  OCX.ban = ban;
}
function ocxDraw() {   // gambar ulang isi kartu; fokus dipulihkan (tombol atau blok yang sama; bila mati: Kirim saat menjawab, atau tombol aksi) bila tadinya di dalam kartu
  const body = $('#ockBody'); if (!body) return;
  const ae = document.activeElement, had = !!(ae && body.contains(ae)), fk = had && ae.dataset ? ae.dataset.fk : null, now = performance.now();
  body.innerHTML = ocvHtml(OCX.s, { idx: OCX.idx, ke: OCX.ke, ban: OCX.s.fase === 'selesai' ? OCX.ban : undefined, note: OCX.note });
  if (OCX.s.fase === 'umpan' || OCX.s.fase === 'selesai') OCX.tRes = now;
  if (had) {
    let t = fk ? body.querySelector('[data-fk=\"' + fk + '\"]:not(:disabled)') : null;
    if (!t && OCX.s.fase === 'jawab') t = body.querySelector('[data-fk=\"ock-send\"]:not(:disabled)');   // saat menjawab fokus TIDAK pindah ke blok pertama: Enter dari papan ketik fisik harus mengirim
    else if (!t) t = body.querySelector('.btn:not(:disabled)');   // fase lain: satu tombol aksi (Mulai, Lanjut, Ulangi)
    if (!t) { t = body; body.setAttribute('tabindex', '-1'); }
    try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
}
function ocxLit() {   // fase tampil: hanya kelas blok menyala dan label yang diganti (simpul TIDAK dibuat ulang, supaya transisi warna 0,25 dtk berjalan); false bila bentuk kartu tak cocok (pemanggil menggambar ulang penuh)
  const body = $('#ockBody'), bd = body && body.querySelector('.ock-board'); if (!bd || OCX.s.fase !== 'tampil') return false;
  const tmp = document.createElement('div'); tmp.innerHTML = ocvHtml(OCX.s, { idx: OCX.idx, ke: OCX.ke });
  const nb = tmp.querySelectorAll('.ock-b'), ob = bd.querySelectorAll('.ock-b'); if (nb.length !== ob.length) return false;
  nb.forEach((n, i) => ob[i].classList.toggle('ock-on', n.classList.contains('ock-on')));
  const np = tmp.querySelectorAll('.otr-prog'), op = body.querySelectorAll('.otr-prog'); if (np.length !== op.length) return false;
  np.forEach((n, i) => { if (op[i].textContent !== n.textContent) op[i].textContent = n.textContent; });
  return true;
}
function ocxLoop() {
  OCX.raf = 0;
  if (!ocxOn()) { ocxLeave(); return; }
  const s = OCX.s;
  if (s.fase === 'tampil') {
    const p = ocxPos(s.len, performance.now() - OCX.t0);
    if (p.usai) { OCX.s = otcTampilSelesai(s); OCX.idx = -1; OCX.ke = -1; ocxDraw(); }
    else if (p.idx !== OCX.idx || p.ke !== OCX.ke) { OCX.idx = p.idx; OCX.ke = p.ke; if (!ocxLit()) ocxDraw(); }
  }
  if (ocxRun(OCX.s)) OCX.raf = requestAnimationFrame(ocxLoop);
}
function ocxLeave() { ocxStop(); OCX.s = otcBaru(); OCX.idx = -1; OCX.ke = -1; OCX.note = null; OCX.ban = undefined; }   // pindah tab atau halaman: sesi di memori dibuang (belum ada simpan)
function ocxAbort(note) { ocxLeave(); OCX.note = note || null; ocxDraw(); }
function ocxBegin() { OCX.idx = -1; OCX.ke = -1; OCX.t0 = performance.now() + OCX_BERSIAP; ocxStop(); ocxDraw(); if (ocxRun(OCX.s)) OCX.raf = requestAnimationFrame(ocxLoop); }
function ocxGo() {
  if (OCX.s.fase === 'selesai' && performance.now() - OCX.tRes < OCX_JEDA_ULANG) return;   // ketukan terlambat dari layar sebelumnya tidak memulai sesi baru
  ocxStop(); OCX.note = null; OCX.ban = undefined; OCX.s = otcMulai(otcBaru(), ocxAcak()); ocxBegin();
}
function ocxNext() {
  if (OCX.s.fase !== 'umpan' || performance.now() - OCX.tRes < OCX_JEDA_LANJUT) return;   // ketukan ganda pada Kirim tidak melompati umpan balik
  const s0 = OCX.s; OCX.s = otcLanjut(OCX.s, ocxAcak()); if (OCX.s === s0) return;
  if (OCX.s.fase === 'tampil') ocxBegin(); else { ocxStop(); if (OCX.s.fase === 'selesai') ocxFinish(); ocxDraw(); }
}
function ocxTap(b) {   // blok yang sudah dipilih diabaikan (urutan Corsi tidak berulang, jadi ketukan ulang pasti salah)
  const s = OCX.s; if (s.fase !== 'jawab' || !Number.isInteger(b) || s.jawab.indexOf(b) >= 0) return;
  const n = otcTap(s, b); if (n !== s) { OCX.s = n; ocxDraw(); }
}
function ocxDel() { const s = OCX.s; if (s.fase !== 'jawab') return; const n = otcHapus(s); if (n !== s) { OCX.s = n; ocxDraw(); } }
function ocxSend() { const s = OCX.s; if (s.fase !== 'jawab') return; const n = otcKirim(s); if (n !== s) { OCX.s = n; ocxStop(); ocxDraw(); } }
QACT.otcGo = () => {
  if (otvRun(OTV.s)) otvAbort(OCX_LAIN);
  if (otxRun(OTX.s)) otxAbort(OCX_LAIN);
  if (osxRun(OSX.s)) osxAbort(OCX_LAIN);
  ocxGo();
};
QACT.otcNext = () => ocxNext();
QACT.otcTap = el => ocxTap(el && el.dataset && /^[0-8]$/.test(el.dataset.v || '') ? Number(el.dataset.v) : -1);
QACT.otcDel = () => ocxDel();
QACT.otcSend = () => ocxSend();
document.addEventListener('keydown', ev => {   // papan ketik fisik: Backspace menghapus, Enter mengirim (bukan bila fokus di tombol: tombol punya aksinya sendiri); blok sendiri dipilih dengan ketukan atau Tab lalu Enter
  if (OCX.s.fase !== 'jawab' || ev.ctrlKey || ev.metaKey || ev.altKey || !ocxOn() || !$('#ockBody')) return;
  const t = ev.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  if (ev.key === 'Backspace') { ev.preventDefault(); ocxDel(); }
  else if (ev.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { ev.preventDefault(); ocxSend(); }
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && ocxRun(OCX.s)) ocxAbort(OCX_NOTE); });
{ const baseGoV = otvGo; otvGo = function () { if (ocxRun(OCX.s)) ocxAbort(OCX_LAIN); return baseGoV.apply(this, arguments); }; }   // memulai Waktu reaksi menghentikan sesi Corsi yang berjalan
{ const baseGoD = otxGo; otxGo = function () { if (ocxRun(OCX.s)) ocxAbort(OCX_LAIN); return baseGoD.apply(this, arguments); }; }   // memulai Rentang digit juga
{ const baseGoS = osxGo; osxGo = function () { if (ocxRun(OCX.s)) ocxAbort(OCX_LAIN); return baseGoS.apply(this, arguments); }; }   // memulai Stroop juga
{ const baseMountC = otvMount; otvMount = function () {   // sisipkan kartu Corsi tepat di atas \"Latihan berikutnya\" (di bawah Riwayat Stroop); daftar diganti ocvListHtml (tanpa Waktu reaksi, Rentang digit, Stroop, Corsi)
  const w = baseMountC.apply(this, arguments); if (!w) return w;
  const nx = w.querySelector('.otr-next'), ls = ocvListHtml();
  if (nx) { if (ls) { const tmp = document.createElement('div'); tmp.innerHTML = ls; nx.replaceWith(tmp.firstElementChild); } else nx.remove(); }
  const sec = document.createElement('section'); sec.className = 'nw-card otr-card ock-card'; sec.id = 'ockBody'; sec.setAttribute('aria-label', 'Corsi (balok)');
  const nx2 = w.querySelector('.otr-next'); if (nx2) w.insertBefore(sec, nx2); else w.appendChild(sec);
  ocxDraw(); if (ocxRun(OCX.s) && !OCX.raf) OCX.raf = requestAnimationFrame(ocxLoop);
  return w;
}; }
{ const baseNwOcx = nwRender; nwRender = function (key) {
  baseNwOcx.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps !== 'latihan') ocxLeave();
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4b2: Object.freeze({ pos: ocxPos, state: () => OCX.s, view: () => ({ idx: OCX.idx, ke: OCX.ke, note: OCX.note, ban: OCX.ban }), go: ocxGo, tap: ocxTap, del: ocxDel, send: ocxSend, next: ocxNext, abort: ocxAbort, bersiapMs: OCX_BERSIAP, jedaLanjutMs: OCX_JEDA_LANJUT, jedaUlangMs: OCX_JEDA_ULANG }) }));
/* ===== OTL-4b2a-end ===== */
/* ===== OTL-4c-begin (21 Nov 2026): Sinaps > Latihan > Corsi (balok), bagian 4c: SIMPAN sesi lewat snsPut (kunci dailylog:sinaps:v1) saat layar "Sesi selesai" tampil; hanya sesi sah (otcKeSesi: rentang >= 2 blok); nilai sesi = rentang (blok); pembanding dikunci SEBELUM sesi baru masuk catatan; status simpan jujur (menyimpan, tersimpan, tidak sah, gagal + coba lagi) menggantikan kalimat "belum disimpan". Pola OTL-3c (pesan dan kode gagal dipakai bersama dari OTL-1c). SN_EX[3].siap menjadi true dan satuan rekor "blok" (2 baris lama diubah di luar blok). Pembungkus ocvHtml dan ocxFinish (0 baris OTL-4b diubah). Membalik: hapus blok ini, kembalikan `siap` di SN_EX ke reaksi, digit, dan stroop saja dan SNH_UNIT tanpa corsi. ===== */
function oczSimpanHtml(sv) {   // MURNI: status simpan -> paragraf status (+ tombol Coba simpan lagi bila boleh); sv kosong = masih menyimpan; pesan gagal = OTV_SV_KODE (OTL-1c)
  const st = sv && sv.st, p = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (st === 'ok') return p('Hasil sesi tersimpan di perangkat ini dan ikut cadangan JSON.');
  if (st === 'takSah') return p('Sesi belum sah, jadi tidak disimpan.');
  if (st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && otvHas(OTV_SV_KODE, k) ? OTV_SV_KODE[k] : 'Belum tersimpan (' + String(k) + ').';
    return p(t) + (otvBolehUlang(k) ? '<div class="snh-act"><button class="btn" type="button" data-q="otcSave" data-fk="otc-save">Coba simpan lagi</button></div>' : '');
  }
  return p('Menyimpan hasil sesi…');
}
function oczPasangSimpan(h, sv) { return typeof h === 'string' && h.indexOf(OCV_BELUM_P) >= 0 ? h.replace(OCV_BELUM_P, () => oczSimpanHtml(sv)) : h; }   // MURNI: ganti kalimat lama "belum disimpan" dengan status simpan
const OCZ_HTML0 = ocvHtml;
function oczHtmlS(s, o, sv) {   // MURNI: fase selain selesai = persis hasil OTL-4b; selesai = pembanding terkunci (sv.ban) + status simpan
  if (!s || s.fase !== 'selesai') return OCZ_HTML0(s, o);
  const o2 = sv && sv.ban !== undefined ? Object.assign({}, o, { ban: sv.ban }) : o;
  return oczPasangSimpan(OCZ_HTML0(s, o2), sv);
}
/* OTL-4c-pure-end */
OCX.sv = null;   // { s: keadaan selesai yang disimpan, ses: { ex, d, raw } atau null, ban: pembanding terkunci, st: menyimpan | ok | gagal | takSah, kode }
ocvHtml = function (s, o) { return oczHtmlS(s, o, o && o.sv !== undefined ? o.sv : (OCX.sv && OCX.sv.s === s ? OCX.sv : null)); };
function ocxSimpan(v) {
  v.st = 'menyimpan'; v.kode = '';
  let p; try { p = snsPut(v.ses, Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(r => { v.st = r && r.ok ? 'ok' : 'gagal'; v.kode = r && r.ok ? '' : ((r && r.kode) || 'galat'); }, () => { v.st = 'gagal'; v.kode = 'galat'; })
    .then(() => { if (OCX.sv === v && OCX.s === v.s) ocxDraw(); });
}
function ocxUlang() { const v = OCX.sv; if (!v || v.s !== OCX.s || v.st !== 'gagal' || !v.ses || !otvBolehUlang(v.kode)) return; ocxSimpan(v); ocxDraw(); }
{ const baseFinishCz = ocxFinish; ocxFinish = function () {   // dipanggil sekali per sesi selesai (penjaga: keadaan yang sama tidak diproses dua kali, jadi pembanding tidak ikut menghitung sesi ini)
  const s = OCX.s; if (s.fase !== 'selesai' || (OCX.sv && OCX.sv.s === s)) return;
  baseFinishCz.apply(this, arguments);   // menghitung dan mengunci OCX.ban dari catatan lama (sesi ini belum masuk catatan)
  const ses = otcKeSesi(s, today()), v = { s, ses, ban: OCX.ban, st: ses ? 'menyimpan' : 'takSah', kode: '' };
  OCX.sv = v; if (ses) ocxSimpan(v);   // pemanggil menggambar ulang sesudahnya
}; }
QACT.otcSave = () => ocxUlang();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4c: Object.freeze({ simpanHtml: oczSimpanHtml, pasang: oczPasangSimpan, htmlS: oczHtmlS, sv: () => OCX.sv ? { st: OCX.sv.st, kode: OCX.sv.kode, ban: OCX.sv.ban, ses: OCX.sv.ses } : null, finish: ocxFinish, ulang: ocxUlang }) }));
/* ===== OTL-4c-end ===== */
/* ===== OTL-4d-begin (21 Nov 2026): Sinaps > Latihan > Corsi (balok), bagian 4d-1: LOGIKA MURNI riwayat (rekor = rentang terpanjang, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, titik harian 14 hari). Belum ada tampilan; tidak mengubah baris lama. Memakai snClean/snDayOk/snAddDays (SNH-1a), OQW dan otqGrafik (OTL-2d), otrMedian (OTL-2a), OTC (OTL-4a). Membalik: hapus blok ini. ===== */
const OCQ = Object.freeze({ hari: OQW.hari, tren: OQW.tren, minTren: OQW.minTren, banding: OTC.banding, terakhir: OQW.terakhir, min: OTC.awal, maks: OTC.maks });   // jendela dan jumlah sama dengan riwayat Rentang digit dan Stroop (OQW); banding = beda minimal (blok) yang sama dengan pembanding sesi Corsi (OTL-4a); sesi sah = rentang 2 sampai 9 blok
const ocqTren0 = Object.freeze({ kode: 'belum_cukup', n1: 0, n2: 0, kini: null, basis: null, selisih: null });
const ocqKosong = Object.freeze({ total: 0, masaDepan: 0, hari: 0, rekor: null, terakhir: null, daftar: Object.freeze([]), titik: Object.freeze([]), tren: ocqTren0 });
function ocqRiwayat(list, today) {   // MURNI, tidak melempar galat: daftar sesi mentah + tanggal hari ini -> ringkasan riwayat Corsi (hanya sesi `corsi` dengan raw bulat OCQ.min..OCQ.maks = rentang blok; tanggal masa depan tidak dihitung, hanya dicacah)
  if (!snDayOk(today)) return ocqKosong;
  const all = snClean(list).sesi.filter(x => x.ex === 'corsi' && Number.isInteger(x.raw) && x.raw >= OCQ.min && x.raw <= OCQ.maks), v = all.filter(x => x.d <= today), depan = all.length - v.length;
  if (!v.length) return depan ? Object.freeze(Object.assign({}, ocqKosong, { masaDepan: depan })) : ocqKosong;
  let rek = null; v.forEach(x => { if (rek === null || x.raw > rek.raw) rek = x; });   // terpanjang; seri = yang paling awal (urutan tanggal)
  const hari = []; v.forEach(x => { if (hari.indexOf(x.d) < 0) hari.push(x.d); });
  const daftar = v.slice(-OCQ.terakhir).reverse().map(x => Object.freeze({ raw: x.raw, d: x.d }));   // terbaru dahulu; pada hari yang sama, yang disimpan terakhir dahulu
  const titik = [];
  for (let k = 0; k < OCQ.hari; k++) {
    const d = snAddDays(today, -(OCQ.hari - 1 - k)), r = v.filter(x => x.d === d).map(x => x.raw);
    if (r.length) titik.push(Object.freeze({ d, x: k, n: r.length, raw: otrMedian(r) }));   // median per hari (bisa x,5), sama dengan dasar pembanding sesi OTL-4a
  }
  const a0 = snAddDays(today, -(OCQ.tren - 1)), b0 = snAddDays(today, -(2 * OCQ.tren - 1)), b1 = snAddDays(today, -OCQ.tren);
  const A = v.filter(x => x.d >= a0).map(x => x.raw), B = v.filter(x => x.d >= b0 && x.d <= b1).map(x => x.raw);
  let tren = Object.freeze(Object.assign({}, ocqTren0, { n1: A.length, n2: B.length }));
  if (A.length >= OCQ.minTren && B.length >= OCQ.minTren) {
    const kini = otrMedian(A), basis = otrMedian(B), sel = kini - basis;
    tren = Object.freeze({ kode: sel >= OCQ.banding ? 'lebih_panjang' : sel <= -OCQ.banding ? 'lebih_pendek' : 'sekitar', n1: A.length, n2: B.length, kini, basis, selisih: sel });
  }
  return Object.freeze({ total: v.length, masaDepan: depan, hari: hari.length, rekor: Object.freeze({ raw: rek.raw, d: rek.d }), terakhir: daftar[0], daftar: Object.freeze(daftar), titik: Object.freeze(titik), tren });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4d: Object.freeze({ cfg: OCQ, riwayat: ocqRiwayat, grafik: otqGrafik }) }));   // grafik = otqGrafik yang SUDAH ADA (OTL-2d-1), tidak diubah
/* OTL-4d-pure-end */
/* ===== OTL-4d-end ===== */
/* ===== OTL-4d2-begin (21 Nov 2026): Sinaps > Latihan > Corsi (balok), bagian 4d-2: TAMPILAN kartu "Riwayat Corsi" di tab Latihan (rekor = rentang terpanjang, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, grafik garis median harian 14 hari, 5 sesi terbaru). Hanya BACA dari SNS.data; tidak menulis apa pun. Pembangun HTML murni (ocqvHtml) + pengendali (pembungkus otvMount dan ocxDraw; 0 baris lama diubah). CSS memakai kelas orh-* dari OTL-1d2 dan snh-* dari SNH-1d2 (tanpa CSS baru). Logika dari OTL-4d-1 (ocqRiwayat, otqGrafik). Membalik: hapus blok ini. ===== */
const OCQV_FINE = 'Riwayat dihitung di perangkat ini dari sesi Corsi yang tersimpan; hanya sesi sah (rentang minimal 2 blok) yang disimpan. Nilai sesi = rentang terpanjang yang diingat dengan benar, dalam jumlah blok. Median dipakai supaya satu sesi yang sangat bagus atau sangat buruk tidak menggeser angka. Corsi ikut dipengaruhi kantuk, tidur, dan gangguan, jadi anggap ini gambaran kebiasaan, bukan nilai kecerdasan.';
const ocqvBlk = v => snhNum(v) + '\u00a0blok';
function ocqvTrenTeks(t) {   // MURNI: keluaran tren ocqRiwayat -> kalimat
  if (!t || t.kode === 'belum_cukup') { const a = t && typeof t.n1 === 'number' ? t.n1 : 0, b = t && typeof t.n2 === 'number' ? t.n2 : 0; const pt = n => n >= OCQ.minTren ? 'cukup' : (n > 0 ? n : 0) + ' dari ' + OCQ.minTren + ' sesi'; return 'Tren belum tersedia. ' + OCQ.tren + ' hari terakhir: ' + pt(a) + '; sebelumnya: ' + pt(b) + '.'; }
  const aw = 'Tren: median ' + OCQ.tren + ' hari terakhir ' + ocqvBlk(t.kini), ak = ' dari ' + OCQ.tren + ' hari sebelumnya (' + ocqvBlk(t.basis) + ').', p = ocqvBlk(Math.abs(t.selisih));
  return t.kode === 'lebih_panjang' ? aw + ', lebih panjang ' + p + ak : t.kode === 'lebih_pendek' ? aw + ', lebih pendek ' + p + ak : aw + ', sekitar sama dengan ' + OCQ.tren + ' hari sebelumnya (' + ocqvBlk(t.basis) + '; selisih ' + p + ').';
}
function ocqvSvg(g, today) {   // MURNI: keluaran otqGrafik (>= 2 titik) -> <svg>; warna lewat kelas CSS orh-* (token tema)
  const P = g.pts, mn = Math.min.apply(null, P.map(p => p.raw)), mx = Math.max.apply(null, P.map(p => p.raw));
  const lab = 'Grafik garis median Corsi per hari dalam ' + OCQ.hari + ' hari terakhir: ' + P.length + ' hari berisi data, dari ' + snhNum(mn) + ' sampai ' + snhNum(mx) + ' blok. Angka lengkap ada di daftar sesi terbaru.';
  return '<svg class="orh-svg" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(lab) + '"><line class="orh-g" x1="0" y1="' + (g.h - 0.5) + '" x2="' + g.w + '" y2="' + (g.h - 0.5) + '"/>' +
    '<polyline class="orh-l" points="' + P.map(p => p.x + ',' + p.y).join(' ') + '"/>' +
    P.map(p => '<circle class="orh-d" cx="' + p.x + '" cy="' + p.y + '" r="3.5"><title>' + esc(orhTgl(p.d, today) + ': ' + snhNum(p.raw) + ' blok' + (p.n > 1 ? ' (median ' + p.n + ' sesi)' : '')) + '</title></circle>').join('') + '</svg>';
}
function ocqvHtml(rw, o, today) {   // MURNI: tidak mengubah masukan, tidak melempar galat; rw = keluaran ocqRiwayat (atau null), o = { st: 'baca' | 'belum' | 'ok', blocked } -> isi kartu (tanpa pembungkus)
  o = o || {}; const hd = '<div class="nw-hd"><h3>Riwayat Corsi</h3></div>', fine = '<p class="nw-fine">' + esc(OCQV_FINE) + '</p>', st = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (o.st === 'baca') return hd + st('Membaca catatan latihan…') + fine;
  if (o.st !== 'ok' || !rw) return hd + st('Catatan latihan belum terbaca, jadi riwayat belum bisa ditampilkan.') + '<div class="snh-act"><button class="btn" type="button" data-q="ocqvRetry" data-fk="ocqv-retry">Coba baca lagi</button></div>' + fine;
  const blk = o.blocked ? st('Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Riwayat hanya dibaca; sesi baru tidak disimpan.') : '';
  const depan = rw.masaDepan > 0 ? st(rw.masaDepan + ' sesi bertanggal di masa depan tidak dihitung. Periksa jam perangkat.') : '';
  if (!rw.total) return hd + blk + depan + '<p class="nw-p otr-p">Belum ada sesi Corsi tersimpan. Selesaikan satu sesi sah di atas (rentang minimal 2 blok); rekor dan grafik muncul di sini.</p>' + fine;
  const tile = (v, nama, tgl) => '<div class="snh-t"><b class="snh-big">' + esc(snhNum(v)) + ' <i>blok</i></b><span>' + esc(nama) + '</span><small>' + esc(tgl) + '</small></div>';
  let x = hd + blk + depan + '<div class="snh-st">' + tile(rw.rekor.raw, 'Rekor terbaik', orhTgl(rw.rekor.d, today)) + tile(rw.terakhir.raw, 'Sesi terakhir', orhTgl(rw.terakhir.d, today)) + '</div>' +
    '<p class="nw-p otr-p">' + rw.total + ' sesi tersimpan di ' + rw.hari + ' hari berlatih.</p><p class="nw-p otr-p">' + esc(ocqvTrenTeks(rw.tren)) + '</p>' +
    '<h4 class="orh-h">Median per hari, ' + OCQ.hari + ' hari terakhir</h4>';
  const g = otqGrafik(rw.titik, 300, 90, 8);
  x += g.pts.length >= 2 ? '<div class="orh-svgw">' + ocqvSvg(g, today) + '</div>' + orhSumbuTgl(today, OCQ.hari) + '<p class="otr-prog">Skala ' + snhNum(g.lo) + ' sampai ' + snhNum(g.hi) + ' blok · makin tinggi makin panjang</p>'
    : '<p class="nw-p otr-p">Grafik muncul begitu ada sesi di dua hari berbeda dalam ' + OCQ.hari + ' hari terakhir.</p>';
  x += '<h4 class="orh-h">Sesi terbaru</h4><ul class="snh-l">' + rw.daftar.map(s => '<li class="snh-r"><span class="snh-rn">' + esc(ocqvBlk(s.raw)) + '</span>' +
    (s.d === rw.rekor.d && s.raw === rw.rekor.raw ? '<span class="snh-chip snh-ok">Rekor</span>' : '') + '<span class="snh-rc">' + esc(orhTgl(s.d, today)) + '</span></li>').join('') + '</ul>';
  return x + fine;
}
/* OTL-4d2-pure-end */
const OCQV = { sig: '' };
function ocqvState() { return { st: SNS.ready ? 'ok' : (SNS.loading ? 'baca' : 'belum'), blocked: SNS.blocked }; }
function ocqvSig() { return [SNS.ready, SNS.loading, SNS.blocked, SNS.data.sesi.length, SNS.data.u, today()].join('|'); }
function ocqvDraw(paksa) {   // gambar ulang kartu hanya bila isinya berubah; aman dipanggil sering (ocxDraw memanggilnya pada tiap perubahan papan, jadi pemeriksaan tanda harus murah)
  const el = $('#ocqvBody'); if (!el) return; const sig = ocqvSig(); if (!paksa && sig === OCQV.sig && el.innerHTML) return;
  OCQV.sig = sig; let rw = null; try { rw = SNS.ready ? ocqRiwayat(SNS.data.sesi, today()) : null; } catch (e) { rw = null; }
  const ae = document.activeElement, had = !!(ae && el.contains(ae));
  try { el.innerHTML = ocqvHtml(rw, ocqvState(), today()); } catch (e) { el.innerHTML = ''; }
  if (had) { const t = el.querySelector('.btn'); try { if (t) t.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } } catch (e) { /* abaikan */ } }
}
function ocqvRetry() { let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } ocqvDraw(true); Promise.resolve(p).then(() => ocqvDraw(true), () => ocqvDraw(true)); }
{ const baseMountQ = otvMount; otvMount = function () {   // sisipkan kartu Riwayat Corsi tepat di bawah kartu Corsi (di atas "Latihan berikutnya")
  const w = baseMountQ.apply(this, arguments); if (!w) return w;
  const sec = document.createElement('section'); sec.className = 'nw-card orh-card ocqv-card'; sec.id = 'ocqvBody'; sec.setAttribute('aria-label', 'Riwayat Corsi');
  const s = w.querySelector('#ockBody'), nx = w.querySelector('.otr-next');
  if (s && s.nextSibling) w.insertBefore(sec, s.nextSibling); else if (nx) w.insertBefore(sec, nx); else w.appendChild(sec);
  OCQV.sig = ''; ocqvDraw(true); snsLoad().then(() => ocqvDraw());
  return w;
}; }
{ const baseDrawQ = ocxDraw; ocxDraw = function () { baseDrawQ.apply(this, arguments); ocqvDraw(); }; }   // sesudah simpan berhasil, ocxDraw dipanggil: sesi baru ikut tampil
QACT.ocqvRetry = () => ocqvRetry();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4d2: Object.freeze({ html: ocqvHtml, trenTeks: ocqvTrenTeks, svg: ocqvSvg, draw: ocqvDraw, retry: ocqvRetry }) }));
/* ===== OTL-4d2-end ===== */
/* ===== OTL-4d3-begin (21 Nov 2026): Sinaps > Hari ini, bagian 4d-3: kartu "Sinaps hari ini" tidak lagi menulis "4 dari 3 latihan berbeda hari ini" sesudah latihan ke-4 (Corsi) siap. Bila jumlah latihan berbeda hari ini MELEBIHI target kelengkapan, kalimat menjadi "4 latihan berbeda hari ini (target 3 terlampaui)" dan teks bilah (aria-valuetext) menjadi "4 latihan berbeda, target 3 terlampaui". Persen tetap dibatasi 100. Bila jumlah <= target keluaran TIDAK berubah satu karakter pun. Pembungkus snhBodyHtml (murni); 0 baris lama diubah. Membalik: hapus blok ini. ===== */
/* OTL-4d3-pure-begin */
function snhSkorTeks(sk, aria) {   // MURNI: null bila masukan tak sah; aria=true untuk teks bilah (tanpa "hari ini")
  const n = sk && sk.n, t = sk && sk.target;
  if (!Number.isInteger(n) || !Number.isInteger(t) || n < 0 || t < 1) return null;
  if (n <= t) return n + ' dari ' + t + ' latihan berbeda' + (aria ? '' : ' hari ini');
  return n + ' latihan berbeda' + (aria ? ', target ' + t + ' terlampaui' : ' hari ini (target ' + t + ' terlampaui)');
}
/* OTL-4d3-pure-end */
{ const baseSnhBody = snhBodyHtml; snhBodyHtml = function (r, st) {
  const h = baseSnhBody.apply(this, arguments), sk = r && r.skor;
  if (typeof h !== 'string' || !sk || !(sk.n > sk.target)) return h;
  const a0 = 'aria-valuetext="' + sk.n + ' dari ' + sk.target + ' latihan berbeda"', s0 = '<p class="snh-sub">' + sk.n + ' dari ' + sk.target + ' latihan berbeda hari ini</p>';
  const a1 = snhSkorTeks(sk, true), s1 = snhSkorTeks(sk, false);
  if (a1 === null || s1 === null || h.split(a0).length !== 2 || h.split(s0).length !== 2) return h;   // bentuk tak dikenal: biarkan apa adanya
  return h.replace(a0, () => 'aria-valuetext="' + a1 + '"').replace(s0, () => '<p class="snh-sub">' + s1 + '</p>');
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl4d3: Object.freeze({ skorTeks: snhSkorTeks, html: snhBodyHtml }) }));
/* ===== OTL-4d3-end ===== */
/* ===== OTL-5a-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5a: LOGIKA MURNI (mesin keadaan; bilangan acak DISUNTIKKAN; tanpa jam, tanpa acak sendiri, tanpa DOM). 2-back huruf: huruf muncul satu per satu, tekan "Sama" bila huruf sekarang = huruf DUA langkah sebelumnya. Skor = persen sasaran tertangkap dikurangi persen salah tekan (0 sampai 100, SN_EX.lebih = 'besar'). Belum ada tampilan, tombol, atau penyimpanan; SN_EX tidak diubah. Membalik: hapus blok ini. ===== */
const OTB = Object.freeze({ n: 2, total: 22, huruf: Object.freeze(['B', 'F', 'K', 'M', 'P', 'R', 'S', 'T']), sasaran: 6, tampilMs: 500, jedaMs: 2000, sahMin: 10, banding: 10, hariBanding: 14, minBanding: 3 });   // n = berapa langkah ke belakang; total = jumlah huruf (n pertama = pemanasan, tidak dinilai); sasaran = jumlah huruf "sama" di antara yang dinilai; tampilMs + jedaMs = 2500 ms per huruf; sahMin = skor minimal agar sesi sah (lebih baik dari menebak); banding = selisih minimal (poin skor) agar dianggap beda
const otbIs = (x, a, b) => typeof x === 'number' && Number.isInteger(x) && x >= a && x <= b;
const otbSet = (s, p) => Object.freeze(Object.assign({}, s, p));
function otbBaru() { return Object.freeze({ fase: 'siap', i: 0, stim: null, target: null, tekan: Object.freeze([]) }); }
function otbUrut(acak) {   // MURNI: urutan huruf (indeks 0 sampai 7) sepanjang total; tepat `sasaran` huruf yang dinilai SAMA dengan huruf n langkah sebelumnya, sisanya TIDAK sama; acak = larik >= total + sasaran bilangan di [0,1) (butir tak sah dianggap 0,5)
  const r = i => { const v = Array.isArray(acak) ? acak[i] : undefined; return typeof v === 'number' && v >= 0 && v < 1 ? v : 0.5; }, L = OTB.huruf.length, pool = [], sas = {};
  for (let i = OTB.n; i < OTB.total; i++) pool.push(i);
  for (let k = 0; k < OTB.sasaran; k++) sas[pool.splice(Math.floor(r(OTB.total + k) * pool.length), 1)[0]] = true;
  const stim = [], target = [];
  for (let i = 0; i < OTB.total; i++) {
    if (i < OTB.n) { stim.push(Math.floor(r(i) * L)); target.push(false); }
    else if (sas[i]) { stim.push(stim[i - OTB.n]); target.push(true); }
    else { const k = Math.floor(r(i) * (L - 1)); stim.push(k >= stim[i - OTB.n] ? k + 1 : k); target.push(false); }
  }
  return Object.freeze({ stim: Object.freeze(stim), target: Object.freeze(target) });
}
function otbJadwal() {   // MURNI: kapan tiap huruf menyala, padam, dan jendela jawabnya berakhir (ms sejak mulai); total = lama sesi
  const per = OTB.tampilMs + OTB.jedaMs, b = []; for (let i = 0; i < OTB.total; i++) b.push(Object.freeze({ i, on: i * per, off: i * per + OTB.tampilMs, akhir: (i + 1) * per }));
  return Object.freeze({ per, total: OTB.total * per, butir: Object.freeze(b) });
}
function otbMulai(s, acak) {
  if (s.fase !== 'siap') return s;
  const u = otbUrut(acak); return otbSet(s, { fase: 'jalan', i: 0, stim: u.stim, target: u.target, tekan: Object.freeze(Array.from({ length: OTB.total }, () => false)) });
}
function otbTekan(s) {   // "Sama": hanya pada huruf yang dinilai (bukan pemanasan), sekali per huruf (tekan ulang tidak mengubah)
  if (s.fase !== 'jalan' || s.i < OTB.n || s.tekan[s.i]) return s;
  return otbSet(s, { tekan: Object.freeze(s.tekan.map((v, k) => (k === s.i ? true : v))) });
}
function otbMaju(s) { return s.fase !== 'jalan' ? s : s.i + 1 >= OTB.total ? otbSet(s, { fase: 'selesai', i: OTB.total }) : otbSet(s, { i: s.i + 1 }); }   // i = jumlah huruf yang sudah selesai dijawab (pada selesai = total)
function otbRingkas(s) {   // MURNI; hanya huruf yang sudah selesai (indeks < i) dan dinilai (indeks >= n); skor = persen tertangkap - persen salah tekan (bulat, tidak di bawah 0); sah bila sesi selesai dan skor >= sahMin
  let hit = 0, miss = 0, fa = 0, cr = 0, sasaran = 0, bukan = 0;
  if (s.stim) for (let j = OTB.n; j < OTB.total; j++) { if (s.target[j]) sasaran++; else bukan++; if (j >= s.i) continue; if (s.target[j]) { if (s.tekan[j]) hit++; else miss++; } else if (s.tekan[j]) fa++; else cr++; }
  const dinilai = hit + miss + fa + cr, selesai = s.fase === 'selesai', skor = sasaran && bukan ? Math.max(0, Math.round(100 * (hit * bukan - fa * sasaran) / (sasaran * bukan))) : 0, sah = selesai && skor >= OTB.sahMin;
  return Object.freeze({ selesai, dinilai, sasaran, hit, miss, fa, cr, tepat: dinilai ? Math.round(100 * (hit + cr) / dinilai) : null, skor, sah, raw: sah ? skor : null });
}
function otbKeSesi(s, d) {   // sesi untuk disimpan ({ ex, d, raw }) atau null bila belum selesai, tidak sah, atau tanggal tak sah
  const r = otbRingkas(s); if (!r.selesai || !r.sah || !snDayOk(d)) return null;
  return Object.freeze({ ex: 'nback', d, raw: r.raw });
}
function otbBanding(raw, sesi, today) {   // bandingkan dengan median skor N-Back diri sendiri 14 hari terakhir (hari ini ikut); perlu >= 3 sesi; beda minimal 10 poin. Dipanggil SEBELUM sesi baru ditambahkan
  const kosong = n => Object.freeze({ kode: 'belum_cukup', n, basis: null, selisih: null });
  if (!otbIs(raw, 0, 100) || !snDayOk(today)) return kosong(0);
  const awal = snAddDays(today, -(OTB.hariBanding - 1)), v = snClean(sesi).sesi.filter(x => x.ex === 'nback' && x.d >= awal && x.d <= today).map(x => x.raw), basis = otrMedian(v);
  if (v.length < OTB.minBanding) return kosong(v.length);
  const sel = raw - basis, kode = sel >= OTB.banding ? 'lebih_tinggi' : sel <= -OTB.banding ? 'lebih_rendah' : 'sekitar';
  return Object.freeze({ kode, n: v.length, basis, selisih: sel });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5a: Object.freeze({ cfg: OTB, baru: otbBaru, urut: otbUrut, jadwal: otbJadwal, mulai: otbMulai, tekan: otbTekan, maju: otbMaju, ringkas: otbRingkas, keSesi: otbKeSesi, banding: otbBanding }) }));
/* ===== OTL-5a-end ===== */
/* ===== OTL-5b-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5b-1: PEMBANGUN HTML MURNI kartu "N-Back" (satu cabang per fase: siap, jalan, selesai), kalimat pembanding, dan daftar "Latihan berikutnya" tanpa latihan yang sudah punya kartu. BELUM dipasang ke halaman (5b-2) dan belum menyimpan (5c); SN_EX tidak diubah. Membalik: hapus blok ini dan CSS OTL-5b. ===== */
/* OTL-5b-pure-begin */
const OBV_INTRO = 'Huruf muncul satu per satu di tengah layar. Tekan Sama bila huruf sekarang SAMA dengan huruf dua langkah sebelumnya (pada B K B, huruf ketiga sama dengan huruf pertama). Dua huruf pertama hanya untuk diingat dan tidak dinilai. Ada 22 huruf, sekitar 1 menit. Skor = sasaran yang tertangkap dikurangi salah tekan, jadi menekan terus tidak membantu. Sesi dihitung sah bila selesai dan skornya minimal 10.';
const OBV_FINE = 'Latihan ini hanya mengukur dan melatih tugas ini sendiri, bukan bukti otak jadi lebih pintar. Hasilnya dipengaruhi kantuk dan gangguan di sekitarmu, jadi bandingkan hanya dengan dirimu sendiri. Latihan ini hanya bisa dipakai dengan melihat dan mengetuk layar.';
const OBV_BELUM_P = '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>';
const OBV_KARTU = Object.freeze(['reaksi', 'digit', 'stroop', 'corsi', 'nback']);   // latihan yang sudah punya kartu sendiri: tidak masuk daftar "Latihan berikutnya"
const obvP = n => n + '\u00a0poin';
function obvBandingTeks(b) {   // MURNI: keluaran otbBanding (atau null bila catatan belum terbaca) -> kalimat
  if (!b) return 'Catatan latihan belum terbaca, jadi pembanding tidak ditampilkan.';
  if (b.kode === 'belum_cukup') return 'Belum ada pembanding: butuh minimal ' + OTB.minBanding + ' sesi dalam ' + OTB.hariBanding + ' hari terakhir (sekarang ' + b.n + ').';
  const sel = obvP(snhNum(Math.abs(b.selisih))), dari = ' dari median ' + OTB.hariBanding + ' harimu (' + obvP(snhNum(b.basis)) + ').';
  return b.kode === 'lebih_tinggi' ? 'Lebih tinggi ' + sel + dari : b.kode === 'lebih_rendah' ? 'Lebih rendah ' + sel + dari : 'Sekitar biasanya: selisih ' + sel + dari;
}
function obvJalanOk(s) {   // MURNI: keadaan 'jalan' cukup utuh untuk digambar (larik huruf, larik tekan, indeks huruf sekarang)
  return !!s && s.fase === 'jalan' && Array.isArray(s.stim) && s.stim.length === OTB.total && Array.isArray(s.tekan) && s.tekan.length === OTB.total && Number.isInteger(s.i) && s.i >= 0 && s.i < OTB.total && Number.isInteger(s.stim[s.i]) && s.stim[s.i] >= 0 && s.stim[s.i] < OTB.huruf.length;
}
function obvKey(s, tampil) {   // MURNI: tombol "Sama" (mati saat pemanasan dan sesudah ditekan) + baris status huruf ini
  const hangat = s.i < OTB.n, sudah = !!s.tekan[s.i], mati = hangat || sudah;
  const st = hangat ? 'Pemanasan: belum perlu menekan.' : sudah ? 'Sama sudah ditekan untuk huruf ini.' : 'Belum menekan Sama untuk huruf ini.';
  return '<button class="btn obk-same' + (sudah ? ' obk-hit' : '') + '" type="button" data-q="otbSama" data-fk="obk-same" aria-pressed="' + (sudah ? 'true' : 'false') + '"' + (mati ? ' disabled' : '') + '>Sama</button>' +
    '<p class="obk-fb" role="status" aria-live="off">' + esc(st) + '</p>';
}
function obvHtml(s, o) {   // MURNI: tidak mengubah masukan, tidak melempar galat; s = keadaan mesin (otbBaru ...), o = { tampil, ban, note } (tampil === false = jeda antar huruf: huruf disembunyikan) -> isi kartu (tanpa pembungkus)
  o = o || {}; s = s || otbBaru();
  const hd = '<div class="nw-hd"><h3>N-Back</h3></div>', fine = '<p class="nw-fine">' + esc(OBV_FINE) + '</p>';
  const note = o.note ? '<p class="nw-p snh-n" role="status">' + esc(o.note) + '</p>' : '';
  const btn = (q, fk, t) => '<div class="snh-act"><button class="btn" type="button" data-q="' + q + '" data-fk="' + fk + '">' + esc(t) + '</button></div>';
  const f = s.fase;
  if (obvJalanOk(s)) {
    const tampil = o.tampil !== false, ch = OTB.huruf[s.stim[s.i]], hangat = s.i < OTB.n;
    return hd + '<p class="otr-prog" aria-live="off">Huruf ' + (s.i + 1) + '\u00a0dari\u00a0' + OTB.total + (hangat ? ' · <span class="obk-tag">Pemanasan, belum dinilai</span>' : '') + '</p>' +
      '<div class="obk-pad" role="img" aria-label="' + esc(tampil ? 'Huruf sekarang: ' + ch : 'Jeda: tunggu huruf berikutnya') + '">' + (tampil ? '<b class="obk-ch">' + esc(ch) + '</b>' : '<span class="obk-dot" aria-hidden="true"></span>') + '</div>' +
      '<p class="nw-p otr-p">Tekan Sama bila huruf ini sama dengan huruf dua langkah sebelumnya.</p>' + obvKey(s, tampil);   // OTL-5b-2b: catatan kecil hanya di fase siap dan hasil, bukan di tiap huruf
  }
  if (f === 'selesai') {
    const r = otbRingkas(s); let x = hd + '<p class="otr-prog">Sesi selesai</p>';
    if (r.sah) {
      const bukan = r.dinilai - r.sasaran;
      x += '<div class="otr-res"><span>Skor N-Back kamu</span><b class="otr-big">' + r.skor + '</b></div>' +
        '<div class="snh-st"><div class="snh-t"><b class="snh-big">' + r.hit + '</b><span>Sasaran tertangkap (dari ' + r.sasaran + ')</span></div><div class="snh-t"><b class="snh-big">' + r.fa + '</b><span>Salah tekan</span></div></div>' +
        '<p class="nw-p otr-p">Kamu melewatkan ' + r.miss + ' sasaran dan menekan Sama pada ' + r.fa + ' dari ' + bukan + ' huruf yang bukan sasaran. ' + r.dinilai + ' huruf dinilai; dua huruf pertama hanya pemanasan. Skor 0 sampai 100 = persen sasaran tertangkap dikurangi persen salah tekan.</p>' +
        '<p class="nw-p otr-p">' + esc(obvBandingTeks(o.ban === undefined ? null : o.ban)) + '</p>';
    } else x += '<div class="otr-res"><b class="otr-big">Sesi belum sah</b><span>Skor ' + r.skor + ' (sesi sah butuh minimal ' + OTB.sahMin + '). Tekan Sama hanya bila huruf sama dengan huruf dua langkah sebelumnya; menekan terus tidak menambah skor. Coba lagi dengan perhatian penuh pada layar.</span></div>';
    return x + OBV_BELUM_P + btn('otbGo', 'obk-go', 'Ulangi sesi') + fine;
  }
  return hd + note + '<p class="nw-p otr-p">' + esc(OBV_INTRO) + '</p>' + btn('otbGo', 'obk-go', 'Mulai sesi (sekitar 1 menit)') + fine;   // siap (dan fase tak dikenal, atau jalan yang rusak)
}
function obvListHtml() {   // MURNI: kartu "Latihan berikutnya" dari SN_EX, tanpa latihan yang sudah punya kartu (OBV_KARTU); yang lain masih "Segera"
  const l = SN_EX.filter(e => OBV_KARTU.indexOf(e.id) < 0); if (!l.length) return '';
  return '<section class="nw-card otr-next" aria-label="Latihan berikutnya"><div class="nw-hd"><h3>Latihan berikutnya</h3></div><ul class="snh-l">' + l.map(e =>
    '<li class="snh-r"><span class="snh-rn">' + esc(e.nama) + '</span><span class="snh-chip snh-soon">Segera</span><span class="snh-rc">Belum tersedia · tahap ' + esc(e.tahap) + '</span></li>').join('') + '</ul></section>';
}
/* OTL-5b-pure-end */
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5b: Object.freeze({ html: obvHtml, list: obvListHtml, banTeks: obvBandingTeks, key: obvKey, jalanOk: obvJalanOk }) }));
/* ===== OTL-5b-end ===== */
/* ===== OTL-5b2a-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5b-2a: PEMASANGAN kartu N-Back di tab Latihan (tepat di bawah \"Riwayat Corsi\", di atas \"Latihan berikutnya\") + PENGENDALI (jeda Bersiap, huruf tampil 500 ms dan jeda 2000 ms dari jam nyata, tombol Sama lewat ketukan atau Spasi dan Enter, mesin dimajukan tepat di batas jendela jawab, layar hasil, Ulangi sesi, keluar dari sesi bila layar tersembunyi atau pindah halaman atau memulai latihan lain). BELUM menyimpan (5c): hasil hanya di memori dan hilang bila pindah tab; SN_EX[4].siap TETAP false. Membalik: hapus blok ini (kartu hilang, daftar lama kembali). ===== */
const ONX_BERSIAP = 1000;       // ms jeda sebelum huruf pertama (titik jeda ditampilkan)
const ONX_JEDA_ULANG = 700;     // ms: \"Ulangi sesi\" diabaikan sesudah layar hasil tergambar (ketukan terlambat dari tombol Sama tidak langsung memulai sesi baru)
const ONX_NOTE = 'Sesi dihentikan karena layar tersembunyi, kamu pindah halaman, atau memulai latihan lain saat latihan berjalan. Mulai lagi kapan saja.';
const ONX_LAIN = 'Sesi dihentikan karena kamu memulai latihan lain.';
const ONX = { s: otbBaru(), t0: 0, raf: 0, note: null, tRes: 0, ban: undefined, tp: false };   // s = keadaan mesin di memori; t0 = waktu huruf pertama mulai (sudah termasuk Bersiap); tp = huruf sedang tampil (terakhir digambar); tRes = waktu layar hasil digambar; ban = pembanding dikunci saat sesi selesai
const onxRun = s => s.fase === 'jalan';
const onxOn = () => curView === 'sinaps' && nwTab.sinaps === 'latihan' && !document.hidden;
const onxAcak = () => Array.from({ length: OTB.total + OTB.sasaran }, () => Math.random());
function onxPos(el) {   // MURNI: ms sejak t0 -> { i, tampil, usai }; i = huruf yang sedang berlaku (jendela jawabnya), tampil = hurufnya sedang terlihat, usai = jadwal habis; sebelum mulai (el < 0 atau bukan angka) = huruf 0 belum tampil
  const j = otbJadwal(); if (typeof el !== 'number' || !(el >= 0)) return Object.freeze({ i: 0, tampil: false, usai: false });
  if (el >= j.total) return Object.freeze({ i: OTB.total - 1, tampil: false, usai: true });
  const i = Math.floor(el / j.per); return Object.freeze({ i, tampil: el - i * j.per < OTB.tampilMs, usai: false });
}
function onxAdvance(s, p) {   // MURNI: majukan mesin sampai huruf p.i (atau selesai bila p.usai); mesin tidak pernah mundur
  let n = s, g = 0; while (n.fase === 'jalan' && g++ <= OTB.total + 1 && (p.usai || n.i < p.i)) n = otbMaju(n); return n;
}
function onxStop() { if (ONX.raf) { cancelAnimationFrame(ONX.raf); ONX.raf = 0; } }
function onxFinish() {   // sekali saat sesi selesai: pembanding dihitung dari catatan lama (sesi ini belum disimpan) lalu dikunci
  const s = ONX.s; if (s.fase !== 'selesai') return; let ban = null;
  try { const r = otbRingkas(s); if (r.sah && SNS.ready) ban = otbBanding(r.raw, SNS.data.sesi, today()); } catch (e) { ban = null; }
  ONX.ban = ban;
}
function onxDraw() {   // gambar ulang penuh isi kartu (pergantian fase); fokus dipulihkan bila tadinya di dalam kartu
  const body = $('#obkBody'); if (!body) return;
  const ae = document.activeElement, had = !!(ae && body.contains(ae)), fk = had && ae.dataset ? ae.dataset.fk : null, now = performance.now();
  body.innerHTML = obvHtml(ONX.s, { tampil: ONX.tp, ban: ONX.s.fase === 'selesai' ? ONX.ban : undefined, note: ONX.note });
  if (ONX.s.fase === 'selesai') ONX.tRes = now;
  if (had) {
    let t = fk ? body.querySelector('[data-fk=\"' + fk + '\"]:not(:disabled)') : null;
    if (!t) t = body.querySelector('.btn:not(:disabled)');
    if (!t) { t = body; body.setAttribute('tabindex', '-1'); }
    try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
}
function onxPatch() {   // jalan -> jalan: ubah ISI simpul yang ada; simpul tombol Sama TIDAK dibuat ulang (jari yang sedang menekan saat huruf berganti tidak kehilangan ketukannya); false bila bentuk kartu tak cocok (pemanggil menggambar ulang penuh)
  const body = $('#obkBody'); if (!body || ONX.s.fase !== 'jalan') return false;
  const tmp = document.createElement('div'); tmp.innerHTML = obvHtml(ONX.s, { tampil: ONX.tp });
  const g = (r, k) => r.querySelector(k), np = g(tmp, '.obk-pad'), op = g(body, '.obk-pad'), ns = g(tmp, '.obk-same'), os = g(body, '.obk-same'), nf = g(tmp, '.obk-fb'), of = g(body, '.obk-fb'), ng = g(tmp, '.otr-prog'), og = g(body, '.otr-prog');
  if (!np || !op || !ns || !os || !nf || !of || !ng || !og) return false;
  const lostFocus = document.activeElement === os && ns.disabled;
  op.innerHTML = np.innerHTML; op.setAttribute('aria-label', np.getAttribute('aria-label')); og.innerHTML = ng.innerHTML; of.textContent = nf.textContent;
  os.disabled = ns.disabled; os.className = ns.className; os.setAttribute('aria-pressed', ns.getAttribute('aria-pressed'));
  if (lostFocus) { body.setAttribute('tabindex', '-1'); try { body.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }   // tombol mati tidak boleh membuang fokus ke halaman: Spasi dan Enter tetap bekerja lewat papan ketik
  return true;
}
function onxShow(prev) { if (ONX.s.fase === 'selesai') onxStop(); if (prev.fase === 'jalan' && ONX.s.fase === 'jalan' && onxPatch()) return; onxDraw(); }
function onxLoop() {
  ONX.raf = 0;
  if (!onxOn()) { onxLeave(); return; }
  const prev = ONX.s, p = onxPos(performance.now() - ONX.t0), n = onxAdvance(prev, p);
  if (n !== prev || p.tampil !== ONX.tp) { ONX.s = n; ONX.tp = p.tampil && n.fase === 'jalan'; if (n.fase === 'selesai') onxFinish(); onxShow(prev); }
  if (onxRun(ONX.s)) ONX.raf = requestAnimationFrame(onxLoop);
}
function onxLeave() { onxStop(); ONX.s = otbBaru(); ONX.tp = false; ONX.note = null; ONX.ban = undefined; }   // pindah tab atau halaman: sesi di memori dibuang (belum ada simpan)
function onxAbort(note) { onxLeave(); ONX.note = note || null; onxDraw(); }
function onxBegin() { ONX.tp = false; ONX.t0 = performance.now() + ONX_BERSIAP; onxStop(); onxDraw(); if (onxRun(ONX.s)) ONX.raf = requestAnimationFrame(onxLoop); }
function onxGo() {
  if (ONX.s.fase === 'selesai' && performance.now() - ONX.tRes < ONX_JEDA_ULANG) return;   // ketukan terlambat dari layar sebelumnya tidak memulai sesi baru
  onxStop(); ONX.note = null; ONX.ban = undefined; ONX.s = otbMulai(otbBaru(), onxAcak()); onxBegin();
}
function onxTap() {   // jam nyata dulu: ketukan tepat sesudah batas dihitung ke huruf BERIKUTNYA walau bingkai belum menggambar; pada pemanasan atau tekan ulang tidak ada perubahan
  const prev = ONX.s; if (prev.fase !== 'jalan') return;
  const p = onxPos(performance.now() - ONX.t0), a = onxAdvance(prev, p), n = otbTekan(a);
  if (n === prev) return;
  ONX.s = n; ONX.tp = p.tampil && n.fase === 'jalan'; if (n.fase === 'selesai') onxFinish(); onxShow(prev);
}
QACT.otbGo = () => {
  if (otvRun(OTV.s)) otvAbort(ONX_LAIN);
  if (otxRun(OTX.s)) otxAbort(ONX_LAIN);
  if (osxRun(OSX.s)) osxAbort(ONX_LAIN);
  if (ocxRun(OCX.s)) ocxAbort(ONX_LAIN);
  onxGo();
};
QACT.otbSama = () => onxTap();
document.addEventListener('keydown', ev => {   // papan ketik fisik: Spasi atau Enter = Sama (bukan bila fokus di tombol: tombol punya aksinya sendiri)
  if (ONX.s.fase !== 'jalan' || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || !onxOn() || !$('#obkBody')) return;
  const t = ev.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || (t && t.isContentEditable)) return;
  if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); onxTap(); }
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && onxRun(ONX.s)) onxAbort(ONX_NOTE); });
{ const baseGoV = otvGo; otvGo = function () { if (onxRun(ONX.s)) onxAbort(ONX_LAIN); return baseGoV.apply(this, arguments); }; }   // memulai Waktu reaksi menghentikan N-Back yang berjalan
{ const baseGoD = otxGo; otxGo = function () { if (onxRun(ONX.s)) onxAbort(ONX_LAIN); return baseGoD.apply(this, arguments); }; }   // Rentang digit juga
{ const baseGoS = osxGo; osxGo = function () { if (onxRun(ONX.s)) onxAbort(ONX_LAIN); return baseGoS.apply(this, arguments); }; }   // Stroop juga
{ const baseGoC = QACT.otcGo; QACT.otcGo = function () { if (onxRun(ONX.s)) onxAbort(ONX_LAIN); return baseGoC.apply(this, arguments); }; }   // Corsi juga (aksinya ada di QACT)
{ const baseMountN = otvMount; otvMount = function () {   // sisipkan kartu N-Back tepat di atas \"Latihan berikutnya\" (di bawah Riwayat Corsi); daftar diganti obvListHtml (tanpa Waktu reaksi, Rentang digit, Stroop, Corsi, N-Back)
  const w = baseMountN.apply(this, arguments); if (!w) return w;
  const nx = w.querySelector('.otr-next'), ls = obvListHtml();
  if (nx) { if (ls) { const tmp = document.createElement('div'); tmp.innerHTML = ls; nx.replaceWith(tmp.firstElementChild); } else nx.remove(); }
  const sec = document.createElement('section'); sec.className = 'nw-card otr-card obk-card'; sec.id = 'obkBody'; sec.setAttribute('aria-label', 'N-Back (huruf)');
  const nx2 = w.querySelector('.otr-next'); if (nx2) w.insertBefore(sec, nx2); else w.appendChild(sec);
  onxDraw(); if (onxRun(ONX.s) && !ONX.raf) ONX.raf = requestAnimationFrame(onxLoop);
  return w;
}; }
{ const baseNwOnx = nwRender; nwRender = function (key) {
  baseNwOnx.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps !== 'latihan') onxLeave();
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5b2: Object.freeze({ pos: onxPos, adv: onxAdvance, state: () => ONX.s, view: () => ({ tp: ONX.tp, note: ONX.note, ban: ONX.ban, t0: ONX.t0 }), go: onxGo, tap: onxTap, abort: onxAbort, bersiapMs: ONX_BERSIAP, jedaUlangMs: ONX_JEDA_ULANG }) }));
