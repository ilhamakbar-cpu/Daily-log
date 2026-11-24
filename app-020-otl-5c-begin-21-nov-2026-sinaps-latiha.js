/* ===== OTL-5b2a-end ===== */
/* ===== OTL-5c-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5c: SIMPAN sesi lewat snsPut (kunci dailylog:sinaps:v1) saat layar "Sesi selesai" tampil; hanya sesi sah (otbKeSesi: skor >= 10); nilai sesi = skor 0 sampai 100; pembanding dikunci SEBELUM sesi baru masuk catatan; status simpan jujur (menyimpan, tersimpan, tidak sah, gagal + coba lagi) menggantikan kalimat "belum disimpan". Pola OTL-4c (pesan dan kode gagal dipakai bersama dari OTL-1c). SN_EX[4].siap menjadi true dan satuan rekor "poin" (2 baris lama diubah di luar blok). Pembungkus obvHtml dan onxFinish (0 baris OTL-5b diubah). Membalik: hapus blok ini, kembalikan `siap` di SN_EX ke reaksi, digit, stroop, dan corsi saja dan SNH_UNIT tanpa nback. ===== */
function obzSimpanHtml(sv) {   // MURNI: status simpan -> paragraf status (+ tombol Coba simpan lagi bila boleh); sv kosong = masih menyimpan; pesan gagal = OTV_SV_KODE (OTL-1c)
  const st = sv && sv.st, p = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (st === 'ok') return p('Hasil sesi tersimpan di perangkat ini dan ikut cadangan JSON.');
  if (st === 'takSah') return p('Sesi belum sah, jadi tidak disimpan.');
  if (st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && otvHas(OTV_SV_KODE, k) ? OTV_SV_KODE[k] : 'Belum tersimpan (' + String(k) + ').';
    return p(t) + (otvBolehUlang(k) ? '<div class="snh-act"><button class="btn" type="button" data-q="otbSave" data-fk="obk-save">Coba simpan lagi</button></div>' : '');
  }
  return p('Menyimpan hasil sesi…');
}
function obzPasangSimpan(h, sv) { return typeof h === 'string' && h.indexOf(OBV_BELUM_P) >= 0 ? h.replace(OBV_BELUM_P, () => obzSimpanHtml(sv)) : h; }   // MURNI: ganti kalimat lama "belum disimpan" dengan status simpan
const OBZ_HTML0 = obvHtml;
function obzHtmlS(s, o, sv) {   // MURNI: fase selain selesai = persis hasil OTL-5b; selesai = pembanding terkunci (sv.ban) + status simpan
  if (!s || s.fase !== 'selesai') return OBZ_HTML0(s, o);
  const o2 = sv && sv.ban !== undefined ? Object.assign({}, o, { ban: sv.ban }) : o;
  return obzPasangSimpan(OBZ_HTML0(s, o2), sv);
}
/* OTL-5c-pure-end */
ONX.sv = null;   // { s: keadaan selesai yang disimpan, ses: { ex, d, raw } atau null, ban: pembanding terkunci, st: menyimpan | ok | gagal | takSah, kode }
obvHtml = function (s, o) { return obzHtmlS(s, o, o && o.sv !== undefined ? o.sv : (ONX.sv && ONX.sv.s === s ? ONX.sv : null)); };
function onxSimpan(v) {
  v.st = 'menyimpan'; v.kode = '';
  let p; try { p = snsPut(v.ses, Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(r => { v.st = r && r.ok ? 'ok' : 'gagal'; v.kode = r && r.ok ? '' : ((r && r.kode) || 'galat'); }, () => { v.st = 'gagal'; v.kode = 'galat'; })
    .then(() => { if (ONX.sv === v && ONX.s === v.s) onxDraw(); });
}
function onxUlang() { const v = ONX.sv; if (!v || v.s !== ONX.s || v.st !== 'gagal' || !v.ses || !otvBolehUlang(v.kode)) return; onxSimpan(v); onxDraw(); }
{ const baseFinishBz = onxFinish; onxFinish = function () {   // dipanggil sekali per sesi selesai (penjaga: keadaan yang sama tidak diproses dua kali, jadi pembanding tidak ikut menghitung sesi ini)
  const s = ONX.s; if (s.fase !== 'selesai' || (ONX.sv && ONX.sv.s === s)) return;
  baseFinishBz.apply(this, arguments);   // menghitung dan mengunci ONX.ban dari catatan lama (sesi ini belum masuk catatan)
  const ses = otbKeSesi(s, today()), v = { s, ses, ban: ONX.ban, st: ses ? 'menyimpan' : 'takSah', kode: '' };
  ONX.sv = v; if (ses) onxSimpan(v);   // pemanggil menggambar ulang sesudahnya
}; }
QACT.otbSave = () => onxUlang();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5c: Object.freeze({ simpanHtml: obzSimpanHtml, pasang: obzPasangSimpan, htmlS: obzHtmlS, sv: () => ONX.sv ? { st: ONX.sv.st, kode: ONX.sv.kode, ban: ONX.sv.ban, ses: ONX.sv.ses } : null, finish: onxFinish, ulang: onxUlang }) }));
/* ===== OTL-5c-end ===== */
/* ===== OTL-5d-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5d-1: LOGIKA MURNI riwayat (rekor = skor tertinggi, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, titik harian 14 hari). Belum ada tampilan; tidak mengubah baris lama. Memakai snClean/snDayOk/snAddDays (SNH-1a), OQW dan otqGrafik (OTL-2d), otrMedian (OTL-2a), OTB (OTL-5a). Pola sama dengan ocqRiwayat (OTL-4d). Membalik: hapus blok ini. ===== */
/* OTL-5d-pure-begin */
const ONQ = Object.freeze({ hari: OQW.hari, tren: OQW.tren, minTren: OQW.minTren, banding: OTB.banding, terakhir: OQW.terakhir, min: OTB.sahMin, maks: 100 });   // jendela dan jumlah sama dengan riwayat Rentang digit, Stroop, dan Corsi (OQW); banding = beda minimal (poin skor) yang sama dengan pembanding sesi N-Back (OTL-5a); sesi sah = skor bulat 10 sampai 100
const onqTren0 = Object.freeze({ kode: 'belum_cukup', n1: 0, n2: 0, kini: null, basis: null, selisih: null });
const onqKosong = Object.freeze({ total: 0, masaDepan: 0, hari: 0, rekor: null, terakhir: null, daftar: Object.freeze([]), titik: Object.freeze([]), tren: onqTren0 });
function onqRiwayat(list, today) {   // MURNI, tidak melempar galat: daftar sesi mentah + tanggal hari ini -> ringkasan riwayat N-Back (hanya sesi `nback` dengan raw bulat ONQ.min..ONQ.maks = skor; tanggal masa depan tidak dihitung, hanya dicacah)
  if (!snDayOk(today)) return onqKosong;
  const all = snClean(list).sesi.filter(x => x.ex === 'nback' && Number.isInteger(x.raw) && x.raw >= ONQ.min && x.raw <= ONQ.maks), v = all.filter(x => x.d <= today), depan = all.length - v.length;
  if (!v.length) return depan ? Object.freeze(Object.assign({}, onqKosong, { masaDepan: depan })) : onqKosong;
  let rek = null; v.forEach(x => { if (rek === null || x.raw > rek.raw) rek = x; });   // skor tertinggi; seri = yang paling awal (urutan tanggal)
  const hari = []; v.forEach(x => { if (hari.indexOf(x.d) < 0) hari.push(x.d); });
  const daftar = v.slice(-ONQ.terakhir).reverse().map(x => Object.freeze({ raw: x.raw, d: x.d }));   // terbaru dahulu; pada hari yang sama, yang disimpan terakhir dahulu
  const titik = [];
  for (let k = 0; k < ONQ.hari; k++) {
    const d = snAddDays(today, -(ONQ.hari - 1 - k)), r = v.filter(x => x.d === d).map(x => x.raw);
    if (r.length) titik.push(Object.freeze({ d, x: k, n: r.length, raw: otrMedian(r) }));   // median per hari (bisa x,5), sama dengan dasar pembanding sesi OTL-5a
  }
  const a0 = snAddDays(today, -(ONQ.tren - 1)), b0 = snAddDays(today, -(2 * ONQ.tren - 1)), b1 = snAddDays(today, -ONQ.tren);
  const A = v.filter(x => x.d >= a0).map(x => x.raw), B = v.filter(x => x.d >= b0 && x.d <= b1).map(x => x.raw);
  let tren = Object.freeze(Object.assign({}, onqTren0, { n1: A.length, n2: B.length }));
  if (A.length >= ONQ.minTren && B.length >= ONQ.minTren) {
    const kini = otrMedian(A), basis = otrMedian(B), sel = kini - basis;
    tren = Object.freeze({ kode: sel >= ONQ.banding ? 'lebih_tinggi' : sel <= -ONQ.banding ? 'lebih_rendah' : 'sekitar', n1: A.length, n2: B.length, kini, basis, selisih: sel });
  }
  return Object.freeze({ total: v.length, masaDepan: depan, hari: hari.length, rekor: Object.freeze({ raw: rek.raw, d: rek.d }), terakhir: daftar[0], daftar: Object.freeze(daftar), titik: Object.freeze(titik), tren });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5d: Object.freeze({ cfg: ONQ, riwayat: onqRiwayat, grafik: otqGrafik }) }));   // grafik = otqGrafik yang SUDAH ADA (OTL-2d-1), tidak diubah
/* OTL-5d-pure-end */
/* ===== OTL-5d-end ===== */
/* ===== OTL-5d2a-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5d-2a: PEMBANGUN HTML MURNI kartu "Riwayat N-Back" (rekor, sesi terakhir, kalimat tren, grafik garis median harian 14 hari, 5 sesi terbaru). BELUM dipasang ke halaman (pemasangan dan pengendali = 5d-2b); tidak mengubah baris lama. Memakai kelas CSS yang sudah ada (orh-*, snh-*, nw-*, otr-*, btn); tanpa CSS baru. Logika dari OTL-5d-1 (onqRiwayat, otqGrafik). Pola sama dengan ocqvHtml (OTL-4d-2). Membalik: hapus blok ini. ===== */
/* OTL-5d2a-pure-begin */
const ONQV_FINE = 'Riwayat dihitung di perangkat ini dari sesi N-Back yang tersimpan; hanya sesi sah (skor minimal ' + ONQ.min + ' dari ' + ONQ.maks + ') yang disimpan. Skor sesi = persen sasaran yang tertangkap dikurangi persen salah tekan, dibulatkan. Median dipakai supaya satu sesi yang sangat bagus atau sangat buruk tidak menggeser angka. N-Back ikut dipengaruhi kantuk, tidur, dan gangguan, jadi anggap ini gambaran kebiasaan, bukan nilai kecerdasan.';
const onqvPoin = v => snhNum(v) + '\u00a0poin';
function onqvTrenTeks(t) {   // MURNI: keluaran tren onqRiwayat -> kalimat
  if (!t || t.kode === 'belum_cukup') { const a = t && typeof t.n1 === 'number' ? t.n1 : 0, b = t && typeof t.n2 === 'number' ? t.n2 : 0; const pt = n => n >= ONQ.minTren ? 'cukup' : (n > 0 ? n : 0) + ' dari ' + ONQ.minTren + ' sesi'; return 'Tren belum tersedia. ' + ONQ.tren + ' hari terakhir: ' + pt(a) + '; sebelumnya: ' + pt(b) + '.'; }
  const aw = 'Tren: median ' + ONQ.tren + ' hari terakhir ' + onqvPoin(t.kini), ak = ' dari ' + ONQ.tren + ' hari sebelumnya (' + onqvPoin(t.basis) + ').', p = onqvPoin(Math.abs(t.selisih));
  return t.kode === 'lebih_tinggi' ? aw + ', lebih tinggi ' + p + ak : t.kode === 'lebih_rendah' ? aw + ', lebih rendah ' + p + ak : aw + ', sekitar sama dengan ' + ONQ.tren + ' hari sebelumnya (' + onqvPoin(t.basis) + '; selisih ' + p + ').';
}
function onqvSvg(g, today) {   // MURNI: keluaran otqGrafik (>= 2 titik) -> <svg>; warna lewat kelas CSS orh-* (token tema)
  const P = g.pts, mn = Math.min.apply(null, P.map(p => p.raw)), mx = Math.max.apply(null, P.map(p => p.raw));
  const lab = 'Grafik garis median N-Back per hari dalam ' + ONQ.hari + ' hari terakhir: ' + P.length + ' hari berisi data, dari ' + snhNum(mn) + ' sampai ' + snhNum(mx) + ' poin. Angka lengkap ada di daftar sesi terbaru.';
  return '<svg class="orh-svg" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(lab) + '"><line class="orh-g" x1="0" y1="' + (g.h - 0.5) + '" x2="' + g.w + '" y2="' + (g.h - 0.5) + '"/>' +
    '<polyline class="orh-l" points="' + P.map(p => p.x + ',' + p.y).join(' ') + '"/>' +
    P.map(p => '<circle class="orh-d" cx="' + p.x + '" cy="' + p.y + '" r="3.5"><title>' + esc(orhTgl(p.d, today) + ': ' + snhNum(p.raw) + ' poin' + (p.n > 1 ? ' (median ' + p.n + ' sesi)' : '')) + '</title></circle>').join('') + '</svg>';
}
function onqvHtml(rw, o, today) {   // MURNI: tidak mengubah masukan, tidak melempar galat; rw = keluaran onqRiwayat (atau null), o = { st: 'baca' | 'belum' | 'ok', blocked } -> isi kartu (tanpa pembungkus)
  o = o || {}; const hd = '<div class="nw-hd"><h3>Riwayat N-Back</h3></div>', fine = '<p class="nw-fine">' + esc(ONQV_FINE) + '</p>', st = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  const retry = hd + st('Catatan latihan belum terbaca, jadi riwayat belum bisa ditampilkan.') + '<div class="snh-act"><button class="btn" type="button" data-q="onqvRetry" data-fk="onqv-retry">Coba baca lagi</button></div>' + fine;
  if (o.st === 'baca') return hd + st('Membaca catatan latihan…') + fine;
  if (o.st !== 'ok' || !rw || typeof rw !== 'object') return retry;
  const blk = o.blocked ? st('Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Riwayat hanya dibaca; sesi baru tidak disimpan.') : '';
  const depan = rw.masaDepan > 0 ? st(rw.masaDepan + ' sesi bertanggal di masa depan tidak dihitung. Periksa jam perangkat.') : '';
  if (!rw.total) return hd + blk + depan + '<p class="nw-p otr-p">Belum ada sesi N-Back tersimpan. Selesaikan satu sesi sah di atas (skor minimal ' + ONQ.min + ' dari ' + ONQ.maks + '); rekor dan grafik muncul di sini.</p>' + fine;
  if (!rw.rekor || !rw.terakhir || !Array.isArray(rw.daftar) || !Array.isArray(rw.titik) || !rw.tren) return retry;   // keluaran tak utuh: jangan gambar setengah
  const tile = (v, nama, tgl) => '<div class="snh-t"><b class="snh-big">' + esc(snhNum(v)) + ' <i>poin</i></b><span>' + esc(nama) + '</span><small>' + esc(tgl) + '</small></div>';
  let x = hd + blk + depan + '<div class="snh-st">' + tile(rw.rekor.raw, 'Rekor terbaik', orhTgl(rw.rekor.d, today)) + tile(rw.terakhir.raw, 'Sesi terakhir', orhTgl(rw.terakhir.d, today)) + '</div>' +
    '<p class="nw-p otr-p">' + rw.total + ' sesi tersimpan di ' + rw.hari + ' hari berlatih.</p><p class="nw-p otr-p">' + esc(onqvTrenTeks(rw.tren)) + '</p>' +
    '<h4 class="orh-h">Median per hari, ' + ONQ.hari + ' hari terakhir</h4>';
  const g = otqGrafik(rw.titik, 300, 90, 8);
  x += g.pts.length >= 2 ? '<div class="orh-svgw">' + onqvSvg(g, today) + '</div>' + orhSumbuTgl(today, ONQ.hari) + '<p class="otr-prog">Skala ' + snhNum(g.lo) + ' sampai ' + snhNum(g.hi) + ' poin · makin tinggi makin baik</p>'
    : '<p class="nw-p otr-p">Grafik muncul begitu ada sesi di dua hari berbeda dalam ' + ONQ.hari + ' hari terakhir.</p>';
  let chip = false;   // tanda Rekor hanya pada SATU baris (yang pertama cocok), supaya dua sesi sama skor di hari yang sama tidak dua kali "Rekor"
  x += '<h4 class="orh-h">Sesi terbaru</h4><ul class="snh-l">' + rw.daftar.map(s => { const adaR = !chip && s.d === rw.rekor.d && s.raw === rw.rekor.raw; if (adaR) chip = true;
    return '<li class="snh-r"><span class="snh-rn">' + esc(onqvPoin(s.raw)) + '</span>' + (adaR ? '<span class="snh-chip snh-ok">Rekor</span>' : '') + '<span class="snh-rc">' + esc(orhTgl(s.d, today)) + '</span></li>'; }).join('') + '</ul>';
  return x + fine;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5d2: Object.freeze({ html: onqvHtml, trenTeks: onqvTrenTeks, svg: onqvSvg }) }));
/* OTL-5d2a-pure-end */
/* ===== OTL-5d2a-end ===== */
/* ===== OTL-5d2b-begin (21 Nov 2026): Sinaps > Latihan > N-Back, bagian 5d-2b: PEMASANGAN kartu "Riwayat N-Back" di tab Latihan, tepat di bawah kartu N-Back (di atas "Latihan berikutnya"). Hanya BACA dari SNS.data; tidak menulis apa pun. Pembangun HTML = onqvHtml (OTL-5d-2a, tidak diubah). Pola sama dengan OTL-4d-2 (Corsi): kartu digambar ulang hanya bila tanda (SNS siap/memuat/terblokir, jumlah sesi, tanggal u, hari ini) berubah; fokus dijaga; tombol "Coba baca lagi" lewat QACT.onqvRetry; dipanggil sesudah onxDraw supaya sesi baru ikut tampil. Tanpa CSS, warna, token, animasi, atau penyimpanan baru. 0 baris lama diubah (pembungkus otvMount dan onxDraw). Membalik: hapus blok ini. ===== */
const ONQV = { sig: '' };
function onqvState() { return { st: SNS.ready ? 'ok' : (SNS.loading ? 'baca' : 'belum'), blocked: SNS.blocked }; }
function onqvSig() { return [SNS.ready, SNS.loading, SNS.blocked, SNS.data.sesi.length, SNS.data.u, today()].join('|'); }
function onqvDraw(paksa) {   // gambar ulang kartu hanya bila isinya berubah; aman dipanggil sering (onxDraw memanggilnya pada tiap pergantian fase, jadi pemeriksaan tanda harus murah)
  const el = $('#onqvBody'); if (!el) return; const sig = onqvSig(); if (!paksa && sig === ONQV.sig && el.innerHTML) return;
  ONQV.sig = sig; let rw = null; try { rw = SNS.ready ? onqRiwayat(SNS.data.sesi, today()) : null; } catch (e) { rw = null; }
  const ae = document.activeElement, had = !!(ae && el.contains(ae));
  try { el.innerHTML = onqvHtml(rw, onqvState(), today()); } catch (e) { el.innerHTML = ''; }
  if (had) { const t = el.querySelector('.btn'); try { if (t) t.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } } catch (e) { /* abaikan */ } }
}
function onqvRetry() { let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } onqvDraw(true); Promise.resolve(p).then(() => onqvDraw(true), () => onqvDraw(true)); }
{ const baseMountR = otvMount; otvMount = function () {   // sisipkan kartu Riwayat N-Back tepat di bawah kartu N-Back (di atas "Latihan berikutnya")
  const w = baseMountR.apply(this, arguments); if (!w) return w;
  const sec = document.createElement('section'); sec.className = 'nw-card orh-card onqv-card'; sec.id = 'onqvBody'; sec.setAttribute('aria-label', 'Riwayat N-Back');
  const s = w.querySelector('#obkBody'), nx = w.querySelector('.otr-next');
  if (s && s.nextSibling) w.insertBefore(sec, s.nextSibling); else if (nx) w.insertBefore(sec, nx); else w.appendChild(sec);
  ONQV.sig = ''; onqvDraw(true); let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } Promise.resolve(p).then(() => onqvDraw(), () => onqvDraw(true));
  return w;
}; }
{ const baseDrawR = onxDraw; onxDraw = function () { baseDrawR.apply(this, arguments); onqvDraw(); }; }   // sesudah simpan berhasil, onxDraw dipanggil: sesi baru ikut tampil
QACT.onqvRetry = () => onqvRetry();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl5d2b: Object.freeze({ draw: onqvDraw, retry: onqvRetry, sig: () => ONQV.sig }) }));
/* ===== OTL-5d2b-end ===== */
/* ===== OTL-6a-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6a + 6a-2: LOGIKA MURNI (mesin keadaan; bilangan acak DAN waktu DISUNTIKKAN; tanpa jam, tanpa acak sendiri, tanpa DOM). Sesi 45 detik: soal hitung kepala (tambah, kurang, kali) dengan 4 pilihan angka; KESULITAN NAIK OTOMATIS di dalam sesi (4 tingkat: 3 benar beruntun naik, 2 salah beruntun turun); raw = jumlah jawaban benar (makin banyak makin baik, SN_EX.lebih = 'besar'). Belum ada tampilan, tombol, atau penyimpanan; SN_EX tidak diubah. Membalik: hapus blok ini. ===== */
const OHC = Object.freeze({ durasiMs: 45000, pilihan: 4, sahMin: 5, akurasiMin: 0.7, banding: 2, hariBanding: 14, minBanding: 3, maks: 100, levelMax: 4, naikBenar: 3, turunSalah: 2 });   // pilihan = jumlah pilihan jawaban; sahMin/akurasiMin = syarat sesi sah (anti asal tekan); banding = selisih minimal (jawaban benar) agar dianggap beda; maks = batas soal per sesi; levelMax = tingkat tertinggi; naikBenar = benar beruntun untuk naik satu tingkat; turunSalah = salah beruntun untuk turun satu tingkat
const OHL = Object.freeze([null].concat([
  { tambah: [11, 79, 6, 34], kurang: [30, 70, 6, 44], kali: [3, 10, 3, 7] },
  { tambah: [21, 79, 11, 49], kurang: [50, 100, 11, 49], kali: [6, 10, 4, 8] },
  { tambah: [101, 299, 21, 79], kurang: [100, 300, 21, 79], kali: [11, 14, 6, 9] },
  { tambah: [201, 700, 51, 149], kurang: [200, 800, 51, 149], kali: [13, 17, 7, 13] }
].map(o => Object.freeze({ tambah: Object.freeze(o.tambah), kurang: Object.freeze(o.kurang), kali: Object.freeze(o.kali) }))));   // per tingkat dan jenis: [operan pertama paling kecil, banyaknya nilai, operan kedua paling kecil, banyaknya nilai]; pada kurang operan kedua dibatasi lebih kecil dari operan pertama
const ohcFin = x => typeof x === 'number' && isFinite(x);
const ohcSet = (s, p) => Object.freeze(Object.assign({}, s, p));
function ohcSoal(acak, prev, lv) {   // MURNI: satu soal { jenis, level, teks, nilai, pilihan (4 angka berbeda, tidak negatif), benar (indeks 0 sampai 3 dari jawaban benar) }; acak = larik >= 7 bilangan di [0,1) (butir tak sah dianggap 0,5); lv = tingkat 1 sampai 4 (selain itu dianggap 1); tidak pernah sama persis (teks) dengan prev. Butir 0 = jenis, 1 = operan pertama, 2 = operan kedua, 3 sampai 5 = pengecoh, 6 = letak jawaban benar
  const r = i => { const v = Array.isArray(acak) ? acak[i] : undefined; return typeof v === 'number' && v >= 0 && v < 1 ? v : 0.5; };
  const L = Number.isInteger(lv) && lv >= 1 && lv <= OHC.levelMax ? lv : 1;
  const jenis = r(0) < 0.4 ? 'tambah' : r(0) < 0.7 ? 'kurang' : 'kali', g = OHL[L][jenis];
  const bangun = rb => {
    const a = g[0] + Math.floor(r(1) * g[1]);
    if (jenis === 'tambah') { const b = g[2] + Math.floor(rb * g[3]); return { a, b, nilai: a + b, teks: a + ' + ' + b }; }
    if (jenis === 'kurang') { const b = g[2] + Math.floor(rb * (Math.min(g[2] + g[3] - 1, a - 1) - g[2] + 1)); return { a, b, nilai: a - b, teks: a + ' \u2212 ' + b }; }
    const b = g[2] + Math.floor(rb * g[3]); return { a, b, nilai: a * b, teks: a + ' \u00d7 ' + b };
  };
  let s = bangun(r(2)); if (prev && prev.teks === s.teks) s = bangun((r(2) + 0.5) % 1);
  const off = [1, 2, 3, -1, -2, -3, 10, -10]; if (L >= 3) off.push(20, -20, 100, -100); if (jenis === 'kali') off.push(s.a, -s.a, s.b, -s.b);
  const cand = []; off.forEach(o => { const v = s.nilai + o; if (v >= 0 && v !== s.nilai && cand.indexOf(v) < 0) cand.push(v); });
  const pil = []; for (let k = 0; k < OHC.pilihan - 1; k++) pil.push(cand.splice(Math.floor(r(3 + k) * cand.length), 1)[0]);
  const idx = Math.floor(r(6) * OHC.pilihan); pil.splice(idx, 0, s.nilai);
  return Object.freeze({ jenis, level: L, teks: s.teks, nilai: s.nilai, pilihan: Object.freeze(pil), benar: idx });
}
function ohcBaru() { return Object.freeze({ fase: 'siap', mulai: null, soal: null, tMuncul: null, riwayat: Object.freeze([]), level: 1, runB: 0, runS: 0 }); }
function ohcMulai(s, now, acak) { return s.fase === 'siap' && ohcFin(now) && now >= 0 ? ohcSet(s, { fase: 'jalan', mulai: now, soal: ohcSoal(acak, null, 1), tMuncul: now, level: 1, runB: 0, runS: 0 }) : s; }
function ohcTick(s, now) { return s.fase === 'jalan' && ohcFin(now) && now - s.mulai >= OHC.durasiMs ? ohcSet(s, { fase: 'selesai', soal: null, tMuncul: null }) : s; }
function ohcJawab(s, p, now, acak) {   // jawaban sah hanya bila sesi berjalan, waktu < batas (jawaban di/atas batas diabaikan dan sesi selesai), waktu tidak mundur, dan p = indeks pilihan bulat 0 sampai 3; rt = ms sejak soal muncul. Tingkat: naikBenar benar beruntun = naik 1 (maks levelMax), turunSalah salah beruntun = turun 1 (min 1); benar memutus deret salah dan sebaliknya
  if (s.fase !== 'jalan' || !ohcFin(now)) return s;
  const t = ohcTick(s, now); if (t !== s) return t;
  if (now < s.tMuncul || !Number.isInteger(p) || p < 0 || p >= OHC.pilihan) return s;
  const bn = p === s.soal.benar, rec = Object.freeze({ jenis: s.soal.jenis, level: s.soal.level, teks: s.soal.teks, pilih: p, benar: bn, rt: Math.round(now - s.tMuncul) }), rw = Object.freeze(s.riwayat.concat([rec]));
  let lv = s.level, rb = bn ? s.runB + 1 : 0, rs = bn ? 0 : s.runS + 1;
  if (rb >= OHC.naikBenar) { lv = Math.min(OHC.levelMax, lv + 1); rb = 0; }
  if (rs >= OHC.turunSalah) { lv = Math.max(1, lv - 1); rs = 0; }
  return rw.length >= OHC.maks ? ohcSet(s, { fase: 'selesai', soal: null, tMuncul: null, riwayat: rw, level: lv, runB: rb, runS: rs }) : ohcSet(s, { riwayat: rw, soal: ohcSoal(acak, s.soal, lv), tMuncul: now, level: lv, runB: rb, runS: rs });
}
function ohcSisa(s, now) { if (s.fase === 'selesai') return 0; if (s.fase !== 'jalan' || !ohcFin(now)) return OHC.durasiMs; return Math.max(0, Math.min(OHC.durasiMs, OHC.durasiMs - (now - s.mulai))); }
function ohcRingkas(s) {   // MURNI; sesi sah bila soal terjawab >= sahMin dan akurasi >= akurasiMin; raw = benar bila sah (jumlah benar, TIDAK dibobot tingkat); rtMedian = median waktu jawab yang benar; tertinggi = tingkat tertinggi yang pernah dicapai (null bila belum ada jawaban)
  const R = s.riwayat, benar = R.filter(x => x.benar).length, n = R.length, akur = n ? benar / n : null, sah = n >= OHC.sahMin && akur >= OHC.akurasiMin;
  return Object.freeze({ selesai: s.fase === 'selesai', percobaan: n, benar, salah: n - benar, akurasi: akur, sah, raw: sah ? benar : null, rtMedian: benar ? otrMedian(R.filter(x => x.benar).map(x => x.rt)) : null, level: s.level, tertinggi: n ? Math.max(s.level, Math.max.apply(null, R.map(x => x.level))) : null });
}
function ohcKeSesi(s, d) { const r = ohcRingkas(s); return !r.selesai || !r.sah || !snDayOk(d) ? null : Object.freeze({ ex: 'hitung', d, raw: r.raw }); }
function ohcBanding(raw, sesi, today) {   // bandingkan dengan median jawaban benar diri sendiri 14 hari terakhir (hari ini ikut); perlu >= 3 sesi; beda minimal 2 jawaban. Dipanggil SEBELUM sesi baru ditambahkan
  const kosong = n => Object.freeze({ kode: 'belum_cukup', n, basis: null, selisih: null });
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > OHC.maks || !snDayOk(today)) return kosong(0);
  const awal = snAddDays(today, -(OHC.hariBanding - 1)), v = snClean(sesi).sesi.filter(x => x.ex === 'hitung' && x.d >= awal && x.d <= today).map(x => x.raw);
  if (v.length < OHC.minBanding) return kosong(v.length);
  const basis = otrMedian(v), sel = raw - basis, kode = sel >= OHC.banding ? 'lebih_banyak' : sel <= -OHC.banding ? 'lebih_sedikit' : 'sekitar';
  return Object.freeze({ kode, n: v.length, basis, selisih: sel });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6a: Object.freeze({ cfg: OHC, lv: OHL, soal: ohcSoal, baru: ohcBaru, mulai: ohcMulai, tick: ohcTick, jawab: ohcJawab, sisa: ohcSisa, ringkas: ohcRingkas, keSesi: ohcKeSesi, banding: ohcBanding }) }));
/* ===== OTL-6a-end ===== */
/* ===== OTL-6b1-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6b-1: PEMBANGUN HTML MURNI kartu "Hitung cepat" (satu cabang per fase: siap, jalan, selesai), kalimat pembanding, penanda tingkat. BELUM dipasang ke halaman (6b-2) dan belum menyimpan (6c); SN_EX tidak diubah. Membalik: hapus blok ini dan CSS OTL-6b. ===== */
const OHV_INTRO = 'Sebuah soal hitung kepala muncul dengan empat pilihan jawaban. Pilih jawaban yang benar secepat dan setepat mungkin. Waktunya ' + Math.round(OHC.durasiMs / 1000) + ' detik. Soal naik satu tingkat setiap ' + OHC.naikBenar + ' jawaban benar beruntun dan turun satu tingkat setiap ' + OHC.turunSalah + ' salah beruntun. Sesi dihitung sah bila minimal ' + OHC.sahMin + ' jawaban dan ' + Math.round(OHC.akurasiMin * 100) + ' persen benar.';
const OHV_FINE = 'Latihan ini hanya mengukur dan melatih tugas ini sendiri, bukan bukti otak jadi lebih pintar. Hasilnya dipengaruhi kantuk dan gangguan di sekitarmu, jadi bandingkan hanya dengan dirimu sendiri. Skor adalah jumlah jawaban benar; soal yang makin sulit membuat tiap jawaban lebih lama, jadi skor tidak otomatis naik walau kamu makin mahir.';
const OHV_BELUM_P = '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>';
const ohvJ = n => n + ' jawaban';
const ohvLv = n => 'Tingkat ' + n + ' dari ' + OHC.levelMax;
function ohvBandingTeks(b) {   // MURNI: keluaran ohcBanding (atau null bila catatan belum terbaca) -> kalimat
  if (!b) return 'Catatan latihan belum terbaca, jadi pembanding tidak ditampilkan.';
  if (b.kode === 'belum_cukup') return 'Belum ada pembanding: butuh minimal ' + OHC.minBanding + ' sesi dalam ' + OHC.hariBanding + ' hari terakhir (sekarang ' + b.n + ').';
  const sel = ohvJ(snhNum(Math.abs(b.selisih))), dari = ' dari median ' + OHC.hariBanding + ' harimu (' + ohvJ(snhNum(b.basis)) + ').';
  return b.kode === 'lebih_banyak' ? 'Lebih banyak ' + sel + dari : b.kode === 'lebih_sedikit' ? 'Lebih sedikit ' + sel + dari : 'Sekitar biasanya: selisih ' + sel + dari;
}
function ohvSisaDetik(s, now) { return Math.ceil(ohcSisa(s, now) / 1000); }   // MURNI: detik tersisa (dibulatkan ke atas), durasi penuh sebelum mulai, 0 sesudah selesai
function ohvPct(s, now) { return Math.round(ohcSisa(s, now) / OHC.durasiMs * 100); }   // MURNI (6b-3): sisa waktu 0 sampai 100 persen untuk bilah (ohcSisa sudah menjepit 0 sampai durasi)
function ohvKeys(soal) {   // MURNI: 4 tombol angka pilihan (urutan = soal.pilihan; data-v = indeks 0 sampai 3)
  return '<div class="ohk-pd" role="group" aria-label="Pilih jawaban">' + soal.pilihan.map((v, i) =>
    '<button class="btn ohk-key" type="button" data-q="ohcJawab" data-v="' + i + '" data-fk="ohk-k-' + i + '">' + esc(String(v)) + '</button>').join('') + '</div>';
}
function ohvSoalOk(q) { return !!q && typeof q === 'object' && typeof q.teks === 'string' && Array.isArray(q.pilihan) && q.pilihan.length === OHC.pilihan && q.pilihan.every(v => typeof v === 'number' && isFinite(v)); }
function ohvHtml(s, o) {   // MURNI: tidak mengubah masukan, tidak melempar galat; s = keadaan mesin (ohcBaru ...), o = { now, ban, note } -> isi kartu (tanpa pembungkus)
  o = o || {}; s = s || ohcBaru();
  const hd = '<div class="nw-hd"><h3>Hitung cepat</h3></div>', fine = '<p class="nw-fine">' + esc(OHV_FINE) + '</p>';
  const note = o.note ? '<p class="nw-p snh-n" role="status">' + esc(o.note) + '</p>' : '';
  const btn = (q, fk, t) => '<div class="snh-act"><button class="btn" type="button" data-q="' + q + '" data-fk="' + fk + '">' + esc(t) + '</button></div>';
  const R = (Array.isArray(s.riwayat) ? s.riwayat : []).filter(x => x && typeof x === 'object'), benar = R.filter(x => x.benar).length, salah = R.length - benar, f = s.fase;
  const lvA = Number.isInteger(s.level) && s.level >= 1 && s.level <= OHC.levelMax ? s.level : 1;
  if (f === 'jalan' && ohvSoalOk(s.soal)) {
    const last = R.length ? R[R.length - 1] : null, d = ohvSisaDetik(s, o.now);
    return hd + '<p class="otr-prog" aria-live="off">Sisa ' + d + ' detik · benar ' + benar + ' · salah ' + salah + '</p>' +
      '<div class="ohk-bar" aria-hidden="true"><i style="width:' + ohvPct(s, o.now) + '%"></i></div>' +
      '<div class="ohk-pad" role="group" aria-label="Soal"><span class="ohk-lv">' + esc(ohvLv(lvA)) + '</span><b class="ohk-q">' + esc(s.soal.teks) + ' = ?</b></div>' +
      '<p class="nw-p otr-p">Pilih hasil yang benar.</p>' + ohvKeys(s.soal) +
      '<p class="ohk-fb" role="status" aria-live="off">' + (last ? 'Jawaban terakhir: <b class="' + (last.benar ? 'ohk-ok">✓ Benar' : 'ohk-bad">✕ Salah') + '</b>' : 'Jawaban terakhir: belum ada') + '</p>';
  }
  if (f === 'selesai') {
    const r = ohcRingkas(ohcSet(s, { riwayat: Object.freeze(R) })); let x = hd + '<p class="otr-prog">Sesi selesai</p>';
    if (r.sah) {
      x += '<div class="otr-res"><span>Jawaban benar kamu</span><b class="otr-big">' + esc(ohvJ(r.raw)) + '</b></div>' +
        '<div class="snh-st"><div class="snh-t"><b class="snh-big">' + r.tertinggi + '</b><span>Tingkat tertinggi</span></div><div class="snh-t"><b class="snh-big">' + r.salah + '</b><span>Jawaban salah</span></div></div>' +
        '<p class="nw-p otr-p">' + r.percobaan + ' percobaan, akurasi ' + Math.round(r.akurasi * 100) + ' persen' + (typeof r.rtMedian !== 'number' || !isFinite(r.rtMedian) ? '' : ', waktu jawab benar median ' + Math.round(r.rtMedian) + ' ms') + '.</p>' +
        '<p class="nw-p otr-p">' + esc(ohvBandingTeks(o.ban === undefined ? null : o.ban)) + '</p>';
    } else {
      const a = [];
      if (r.percobaan < OHC.sahMin) a.push('baru ' + r.percobaan + ' jawaban (sesi sah butuh minimal ' + OHC.sahMin + ')');
      if (r.akurasi !== null && r.akurasi < OHC.akurasiMin) a.push('akurasi ' + Math.round(r.akurasi * 100) + ' persen (sesi sah butuh minimal ' + Math.round(OHC.akurasiMin * 100) + ')');
      x += '<div class="otr-res"><b class="otr-big">Sesi belum sah</b><span>' + esc((a.length ? a.join(' dan ') : 'syarat sesi sah belum terpenuhi').replace(/^./, c => c.toUpperCase())) + '. Hitung dengan teliti: lebih baik tepat daripada asal tekan. Coba lagi.</span></div>';
    }
    return x + OHV_BELUM_P + btn('ohcGo', 'ohk-go', 'Ulangi sesi') + fine;
  }
  return hd + note + '<p class="nw-p otr-p">' + esc(OHV_INTRO) + '</p>' + btn('ohcGo', 'ohk-go', 'Mulai sesi (' + Math.round(OHC.durasiMs / 1000) + ' detik)') + fine;   // siap (dan fase tak dikenal, atau jalan tanpa soal sah)
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6b1: Object.freeze({ html: ohvHtml, banTeks: ohvBandingTeks, sisaDetik: ohvSisaDetik, keys: ohvKeys, lv: ohvLv, pct: ohvPct }) }));
/* ===== OTL-6b1-end ===== */
/* ===== OTL-6b2-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6b-2: PEMASANGAN kartu Hitung cepat di tab Latihan (paling bawah, sesudah "Riwayat N-Back"; daftar "Latihan berikutnya" kosong karena semua 6 latihan sudah punya kartu, jadi dibuang) + PENGENDALI (hitung mundur dari jam nyata, 4 tombol angka dan papan ketik 1 sampai 4, soal baru tiap jawaban, sesi selesai tepat di batas atau pada soal ke-100, keluar dari sesi bila layar tersembunyi atau pindah halaman atau memulai latihan lain). BELUM menyimpan (6c): hasil hanya di memori dan hilang bila pindah tab; SN_EX[5].siap TETAP false. Membalik: hapus blok ini (kartu hilang, daftar lama kembali). ===== */
const OHX_NOTE = 'Sesi dihentikan karena layar tersembunyi, kamu pindah halaman, atau memulai latihan lain saat latihan berjalan. Mulai lagi kapan saja.';
const OHX_LAIN = 'Sesi dihentikan karena kamu memulai latihan lain.';
const OHX_MINRT = 150;         // ms: jawaban yang tiba lebih cepat dari ini sesudah soal muncul diabaikan (ketukan ganda dari tombol Mulai, pantulan tombol); di bawah waktu hitung manusia
const OHX_JEDA_ULANG = 700;    // ms: "Ulangi sesi" diabaikan sesudah layar hasil tergambar (ketukan terlambat dari sesi tidak langsung memulai sesi baru)
const OHX_KEY = Object.freeze({ '1': 0, '2': 1, '3': 2, '4': 3 });   // papan ketik fisik: angka 1 sampai 4 = urutan tombol pilihan
const OHV_KARTU = Object.freeze(['reaksi', 'digit', 'stroop', 'corsi', 'nback', 'hitung']);   // latihan yang sudah punya kartu sendiri: tidak masuk daftar "Latihan berikutnya"
const OHX = { s: ohcBaru(), raf: 0, note: null, tRes: 0, sec: -1, ban: undefined };   // s = keadaan sesi di memori; sec = detik tersisa yang terakhir digambar; tRes = waktu layar hasil digambar; ban = pembanding dikunci saat sesi selesai
const ohxRun = s => s.fase === 'jalan';
const ohxOn = () => curView === 'sinaps' && nwTab.sinaps === 'latihan' && !document.hidden;
const ohxAcak = () => Array.from({ length: 7 }, () => Math.random());
function ohxKunci(k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(OHX_KEY, k) ? OHX_KEY[k] : null; }   // MURNI: tombol papan ketik -> indeks pilihan 0 sampai 3, atau null
function ohvListHtml() {   // MURNI: kartu "Latihan berikutnya" dari SN_EX, tanpa latihan yang sudah punya kartu (OHV_KARTU); kosong bila semua sudah punya kartu
  const l = SN_EX.filter(e => OHV_KARTU.indexOf(e.id) < 0); if (!l.length) return '';
  return '<section class="nw-card otr-next" aria-label="Latihan berikutnya"><div class="nw-hd"><h3>Latihan berikutnya</h3></div><ul class="snh-l">' + l.map(e =>
    '<li class="snh-r"><span class="snh-rn">' + esc(e.nama) + '</span><span class="snh-chip snh-soon">Segera</span><span class="snh-rc">Belum tersedia · tahap ' + esc(e.tahap) + '</span></li>').join('') + '</ul></section>';
}
function ohxStop() { if (OHX.raf) { cancelAnimationFrame(OHX.raf); OHX.raf = 0; } }
function ohxFinish() {   // dipanggil sekali saat sesi selesai: pembanding dihitung dari catatan lama (sesi ini belum disimpan, jadi tidak menghitung dirinya sendiri) lalu dikunci
  const s = OHX.s; if (s.fase !== 'selesai') return; let ban = null;
  try { const r = ohcRingkas(s); if (r.sah && SNS.ready) ban = ohcBanding(r.raw, SNS.data.sesi, today()); } catch (e) { ban = null; }
  OHX.ban = ban;
}
function ohxDraw() {   // gambar ulang seluruh kartu (saat fase atau jawaban berubah); fokus dipulihkan ke tombol yang sama bila tadinya di dalam kartu
  const body = $('#ohkBody'); if (!body) return;
  const ae = document.activeElement, had = !!(ae && body.contains(ae)), fk = had && ae.dataset ? ae.dataset.fk : null, now = performance.now();
  body.innerHTML = ohvHtml(OHX.s, { now, ban: OHX.s.fase === 'selesai' ? OHX.ban : undefined, note: OHX.note });
  body.querySelectorAll('.ohk-key').forEach(b => b.setAttribute('aria-keyshortcuts', String(+b.dataset.v + 1)));
  OHX.sec = OHX.s.fase === 'jalan' ? ohvSisaDetik(OHX.s, now) : -1;
  if (OHX.s.fase === 'selesai') OHX.tRes = now;
  if (had) {
    let t = fk ? body.querySelector('[data-fk="' + fk + '"]:not(:disabled)') : null;
    if (!t && OHX.s.fase !== 'jalan') t = body.querySelector('.btn:not(:disabled)');   // siap atau selesai: satu tombol aksi (Mulai, Ulangi)
    if (!t) { t = body; body.setAttribute('tabindex', '-1'); }   // saat berjalan dari tombol Mulai fokus ke kartu, BUKAN ke tombol angka: Enter atau spasi dari tombol Mulai tidak boleh langsung menjawab
    try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
}
function ohxDrawSisa() {   // tiap detik hanya baris "Sisa N detik" yang diperbarui (tombol TIDAK dibuat ulang: ketukan yang sedang berlangsung tidak hilang)
  const body = $('#ohkBody'), p = body && body.querySelector('.otr-prog'); if (!p || OHX.s.fase !== 'jalan') return;
  const tmp = document.createElement('div'); tmp.innerHTML = ohvHtml(OHX.s, { now: performance.now() });
  const q = tmp.querySelector('.otr-prog'); if (q && q.textContent !== p.textContent) p.textContent = q.textContent;
  const i1 = body.querySelector('.ohk-bar > i'), i2 = tmp.querySelector('.ohk-bar > i'); if (i1 && i2 && i1.style.width !== i2.style.width) i1.style.width = i2.style.width;   // 6b-3: bilah sisa waktu
}
function ohxLoop() {
  OHX.raf = 0;
  if (!ohxOn()) { ohxLeave(); return; }
  const now = performance.now(), s = ohcTick(OHX.s, now);
  if (s !== OHX.s) { OHX.s = s; ohxFinish(); ohxDraw(); return; }   // batas waktu tercapai
  const sec = ohvSisaDetik(OHX.s, now); if (sec !== OHX.sec) { OHX.sec = sec; ohxDrawSisa(); }
  if (ohxRun(OHX.s)) OHX.raf = requestAnimationFrame(ohxLoop);
}
function ohxLeave() { ohxStop(); OHX.s = ohcBaru(); OHX.note = null; OHX.ban = undefined; OHX.sec = -1; }   // pindah tab atau halaman: sesi di memori dibuang (belum ada simpan)
function ohxAbort(note) { ohxLeave(); OHX.note = note || null; ohxDraw(); }
function ohxGo() {
  if (OHX.s.fase === 'selesai' && performance.now() - OHX.tRes < OHX_JEDA_ULANG) return;   // ketukan terlambat dari sesi tadi tidak memulai sesi baru
  ohxStop(); OHX.note = null; OHX.ban = undefined; OHX.s = ohcMulai(ohcBaru(), performance.now(), ohxAcak()); ohxDraw();
  if (ohxRun(OHX.s)) OHX.raf = requestAnimationFrame(ohxLoop);
}
function ohxJawab(p) {
  const s0 = OHX.s; if (!ohxRun(s0) || !Number.isInteger(p) || p < 0 || p >= OHC.pilihan) return;
  const now = performance.now(); if (now - s0.tMuncul < OHX_MINRT) return;   // terlalu cepat untuk jawaban manusia: abaikan
  const s = ohcJawab(s0, p, now, ohxAcak()); if (s === s0) return;
  OHX.s = s; if (s.fase === 'selesai') { ohxStop(); ohxFinish(); }   // jawaban di atau sesudah batas tidak dihitung; soal ke-100 menutup sesi
  ohxDraw();
}
QACT.ohcGo = () => {
  if (otvRun(OTV.s)) otvAbort(OHX_LAIN);
  if (otxRun(OTX.s)) otxAbort(OHX_LAIN);
  if (osxRun(OSX.s)) osxAbort(OHX_LAIN);
  if (ocxRun(OCX.s)) ocxAbort(OHX_LAIN);
  if (onxRun(ONX.s)) onxAbort(OHX_LAIN);
  ohxGo();
};
QACT.ohcJawab = el => ohxJawab(el && el.dataset && /^\d$/.test(el.dataset.v || '') ? +el.dataset.v : -1);
document.addEventListener('keydown', ev => {   // papan ketik fisik: 1 sampai 4 = pilihan (tidak bila fokus di kolom isian, tidak saat tombol ditahan)
  if (OHX.s.fase !== 'jalan' || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || !ohxOn() || !$('#ohkBody')) return;
  const t = ev.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  const p = ohxKunci(ev.key); if (p !== null) { ev.preventDefault(); ohxJawab(p); }
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && ohxRun(OHX.s)) ohxAbort(OHX_NOTE); });
{ const baseGoV = otvGo; otvGo = function () { if (ohxRun(OHX.s)) ohxAbort(OHX_LAIN); return baseGoV.apply(this, arguments); }; }   // memulai Waktu reaksi menghentikan Hitung cepat yang berjalan
{ const baseGoD = otxGo; otxGo = function () { if (ohxRun(OHX.s)) ohxAbort(OHX_LAIN); return baseGoD.apply(this, arguments); }; }   // Rentang digit juga
{ const baseGoS = osxGo; osxGo = function () { if (ohxRun(OHX.s)) ohxAbort(OHX_LAIN); return baseGoS.apply(this, arguments); }; }   // Stroop juga
{ const baseGoC = QACT.otcGo; QACT.otcGo = function () { if (ohxRun(OHX.s)) ohxAbort(OHX_LAIN); return baseGoC.apply(this, arguments); }; }   // Corsi juga (aksinya ada di QACT)
{ const baseGoN = onxGo; onxGo = function () { if (ohxRun(OHX.s)) ohxAbort(OHX_LAIN); return baseGoN.apply(this, arguments); }; }   // N-Back juga
{ const baseMountH = otvMount; otvMount = function () {   // sisipkan kartu Hitung cepat paling bawah; daftar "Latihan berikutnya" diganti ohvListHtml (kosong = dibuang)
  const w = baseMountH.apply(this, arguments); if (!w) return w;
  const nx = w.querySelector('.otr-next'), ls = ohvListHtml();
  if (nx) { if (ls) { const tmp = document.createElement('div'); tmp.innerHTML = ls; nx.replaceWith(tmp.firstElementChild); } else nx.remove(); }
  const sec = document.createElement('section'); sec.className = 'nw-card otr-card ohk-card'; sec.id = 'ohkBody'; sec.setAttribute('aria-label', 'Hitung cepat');
  const nx2 = w.querySelector('.otr-next'); if (nx2) w.insertBefore(sec, nx2); else w.appendChild(sec);
  ohxDraw(); if (ohxRun(OHX.s) && !OHX.raf) OHX.raf = requestAnimationFrame(ohxLoop);
  return w;
}; }
{ const baseNwOhx = nwRender; nwRender = function (key) {
  baseNwOhx.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps !== 'latihan') ohxLeave();
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6b2: Object.freeze({ kunci: ohxKunci, list: ohvListHtml, state: () => OHX.s, view: () => ({ note: OHX.note, ban: OHX.ban, sec: OHX.sec }), go: ohxGo, jawab: ohxJawab, abort: ohxAbort, minRtMs: OHX_MINRT, jedaUlangMs: OHX_JEDA_ULANG }) }));
/* ===== OTL-6b2-end ===== */
/* ===== OTL-6c-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6c: SIMPAN sesi lewat snsPut (kunci dailylog:sinaps:v1) saat layar "Sesi selesai" tampil; hanya sesi sah (ohcKeSesi: minimal 5 jawaban dan akurasi 70 persen); nilai sesi = jumlah jawaban benar (0 sampai 100); pembanding dikunci SEBELUM sesi baru masuk catatan; status simpan jujur (menyimpan, tersimpan, tidak sah, gagal + coba lagi) menggantikan kalimat "belum disimpan". Pola OTL-5c (pesan dan kode gagal dipakai bersama dari OTL-1c). SN_EX[5].siap menjadi true dan satuan rekor "jawaban" (2 baris lama diubah di luar blok). Pembungkus ohvHtml dan ohxFinish (0 baris 6a, 6b1, 6b2, 6b3 diubah). Membalik: hapus blok ini, kembalikan siap di SN_EX ke lima latihan pertama dan SNH_UNIT tanpa hitung. ===== */
function ohzSimpanHtml(sv) {   // MURNI: status simpan -> paragraf status (+ tombol Coba simpan lagi bila boleh); sv kosong = masih menyimpan; pesan gagal = OTV_SV_KODE (OTL-1c)
  const st = sv && sv.st, p = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (st === 'ok') return p('Hasil sesi tersimpan di perangkat ini dan ikut cadangan JSON.');
  if (st === 'takSah') return p('Sesi belum sah, jadi tidak disimpan.');
  if (st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && otvHas(OTV_SV_KODE, k) ? OTV_SV_KODE[k] : 'Belum tersimpan (' + String(k) + ').';
    return p(t) + (otvBolehUlang(k) ? '<div class="snh-act"><button class="btn" type="button" data-q="ohcSave" data-fk="ohk-save">Coba simpan lagi</button></div>' : '');
  }
  return p('Menyimpan hasil sesi…');
}
function ohzPasangSimpan(h, sv) { return typeof h === 'string' && h.indexOf(OHV_BELUM_P) >= 0 ? h.replace(OHV_BELUM_P, () => ohzSimpanHtml(sv)) : h; }   // MURNI: ganti kalimat lama "belum disimpan" dengan status simpan
const OHZ_HTML0 = ohvHtml;
function ohzHtmlS(s, o, sv) {   // MURNI: fase selain selesai = persis hasil OTL-6b; selesai = pembanding terkunci (sv.ban) + status simpan
  if (!s || s.fase !== 'selesai') return OHZ_HTML0(s, o);
  const o2 = sv && sv.ban !== undefined ? Object.assign({}, o, { ban: sv.ban }) : o;
  return ohzPasangSimpan(OHZ_HTML0(s, o2), sv);
}
/* OTL-6c-pure-end */
OHX.sv = null;   // { s: keadaan selesai yang disimpan, ses: { ex, d, raw } atau null, ban: pembanding terkunci, st: menyimpan | ok | gagal | takSah, kode }
ohvHtml = function (s, o) { return ohzHtmlS(s, o, o && o.sv !== undefined ? o.sv : (OHX.sv && OHX.sv.s === s ? OHX.sv : null)); };
function ohxSimpan(v) {
  v.st = 'menyimpan'; v.kode = '';
  let p; try { p = snsPut(v.ses, Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(r => { v.st = r && r.ok ? 'ok' : 'gagal'; v.kode = r && r.ok ? '' : ((r && r.kode) || 'galat'); }, () => { v.st = 'gagal'; v.kode = 'galat'; })
    .then(() => { if (OHX.sv === v && OHX.s === v.s) ohxDraw(); });
}
function ohxUlang() { const v = OHX.sv; if (!v || v.s !== OHX.s || v.st !== 'gagal' || !v.ses || !otvBolehUlang(v.kode)) return; ohxSimpan(v); ohxDraw(); }
{ const baseFinishHz = ohxFinish; ohxFinish = function () {   // dipanggil sekali per sesi selesai (penjaga: keadaan yang sama tidak diproses dua kali, jadi pembanding tidak ikut menghitung sesi ini)
  const s = OHX.s; if (s.fase !== 'selesai' || (OHX.sv && OHX.sv.s === s)) return;
  baseFinishHz.apply(this, arguments);   // menghitung dan mengunci OHX.ban dari catatan lama (sesi ini belum masuk catatan)
  const ses = ohcKeSesi(s, today()), v = { s, ses, ban: OHX.ban, st: ses ? 'menyimpan' : 'takSah', kode: '' };
  OHX.sv = v; if (ses) ohxSimpan(v);   // pemanggil menggambar ulang sesudahnya
}; }
QACT.ohcSave = () => ohxUlang();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6c: Object.freeze({ simpanHtml: ohzSimpanHtml, pasang: ohzPasangSimpan, htmlS: ohzHtmlS, sv: () => OHX.sv ? { st: OHX.sv.st, kode: OHX.sv.kode, ban: OHX.sv.ban, ses: OHX.sv.ses } : null, finish: ohxFinish, ulang: ohxUlang }) }));
/* ===== OTL-6c-end ===== */
/* ===== OTL-6d-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6d-1: LOGIKA MURNI riwayat (rekor = jawaban benar terbanyak dalam satu sesi, sesi terakhir, tren median 7 hari vs 7 hari sebelumnya, titik harian 14 hari). Belum ada tampilan; tidak mengubah baris lama. Memakai snClean/snDayOk/snAddDays (SNH-1a), OQW dan otqGrafik (OTL-2d), otrMedian (OTL-2a), OHC (OTL-6a). Pola sama dengan onqRiwayat (OTL-5d). Membalik: hapus blok ini. ===== */
/* OTL-6d-pure-begin */
const OHQ = Object.freeze({ hari: OQW.hari, tren: OQW.tren, minTren: OQW.minTren, banding: OHC.banding, terakhir: OQW.terakhir, min: Math.ceil(OHC.sahMin * OHC.akurasiMin), maks: OHC.maks });   // jendela dan jumlah sama dengan riwayat Rentang digit, Stroop, Corsi, N-Back (OQW); banding = beda minimal (jawaban benar) yang sama dengan pembanding sesi Hitung cepat (OTL-6a); sesi sah = jumlah benar bulat min..maks (min = batas terkecil yang masih sah: 5 jawaban x 70 persen dibulatkan ke atas = 4)
const ohqTren0 = Object.freeze({ kode: 'belum_cukup', n1: 0, n2: 0, kini: null, basis: null, selisih: null });
const ohqKosong = Object.freeze({ total: 0, masaDepan: 0, hari: 0, rekor: null, terakhir: null, daftar: Object.freeze([]), titik: Object.freeze([]), tren: ohqTren0 });
function ohqRiwayat(list, today) {   // MURNI, tidak melempar galat: daftar sesi mentah + tanggal hari ini -> ringkasan riwayat Hitung cepat (hanya sesi `hitung` dengan raw bulat OHQ.min..OHQ.maks = jumlah jawaban benar; tanggal masa depan tidak dihitung, hanya dicacah)
  if (!snDayOk(today)) return ohqKosong;
  const all = snClean(list).sesi.filter(x => x.ex === 'hitung' && Number.isInteger(x.raw) && x.raw >= OHQ.min && x.raw <= OHQ.maks), v = all.filter(x => x.d <= today), depan = all.length - v.length;
  if (!v.length) return depan ? Object.freeze(Object.assign({}, ohqKosong, { masaDepan: depan })) : ohqKosong;
  let rek = null; v.forEach(x => { if (rek === null || x.raw > rek.raw) rek = x; });   // jawaban benar terbanyak; seri = yang paling awal (urutan tanggal)
  const hari = []; v.forEach(x => { if (hari.indexOf(x.d) < 0) hari.push(x.d); });
  const daftar = v.slice(-OHQ.terakhir).reverse().map(x => Object.freeze({ raw: x.raw, d: x.d }));   // terbaru dahulu; pada hari yang sama, yang disimpan terakhir dahulu
  const titik = [];
  for (let k = 0; k < OHQ.hari; k++) {
    const d = snAddDays(today, -(OHQ.hari - 1 - k)), r = v.filter(x => x.d === d).map(x => x.raw);
    if (r.length) titik.push(Object.freeze({ d, x: k, n: r.length, raw: otrMedian(r) }));   // median per hari (bisa x,5), sama dengan dasar pembanding sesi OTL-6a
  }
  const a0 = snAddDays(today, -(OHQ.tren - 1)), b0 = snAddDays(today, -(2 * OHQ.tren - 1)), b1 = snAddDays(today, -OHQ.tren);
  const A = v.filter(x => x.d >= a0).map(x => x.raw), B = v.filter(x => x.d >= b0 && x.d <= b1).map(x => x.raw);
  let tren = Object.freeze(Object.assign({}, ohqTren0, { n1: A.length, n2: B.length }));
  if (A.length >= OHQ.minTren && B.length >= OHQ.minTren) {
    const kini = otrMedian(A), basis = otrMedian(B), sel = kini - basis;
    tren = Object.freeze({ kode: sel >= OHQ.banding ? 'lebih_banyak' : sel <= -OHQ.banding ? 'lebih_sedikit' : 'sekitar', n1: A.length, n2: B.length, kini, basis, selisih: sel });
  }
  return Object.freeze({ total: v.length, masaDepan: depan, hari: hari.length, rekor: Object.freeze({ raw: rek.raw, d: rek.d }), terakhir: daftar[0], daftar: Object.freeze(daftar), titik: Object.freeze(titik), tren });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6d: Object.freeze({ cfg: OHQ, riwayat: ohqRiwayat, grafik: otqGrafik }) }));   // grafik = otqGrafik yang SUDAH ADA (OTL-2d-1), tidak diubah
/* OTL-6d-pure-end */
/* ===== OTL-6d-end ===== */
/* ===== OTL-6d2a-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6d-2a: PEMBANGUN HTML MURNI kartu "Riwayat Hitung cepat" (rekor, sesi terakhir, kalimat tren, grafik garis median harian 14 hari, 5 sesi terbaru). BELUM dipasang ke halaman (pemasangan dan pengendali = 6d-2b); tidak mengubah baris lama. Memakai kelas CSS yang sudah ada (orh-*, snh-*, nw-*, otr-*, btn); tanpa CSS baru. Logika dari OTL-6d-1 (ohqRiwayat, otqGrafik). Pola sama dengan onqvHtml (OTL-5d-2a) dan osqvHtml (Stroop, satuan jawaban). Membalik: hapus blok ini. ===== */
/* OTL-6d2a-pure-begin */
const OHQV_SAH = 'minimal ' + OHC.sahMin + ' jawaban dan ' + Math.round(OHC.akurasiMin * 100) + ' persen benar';
const OHQV_FINE = 'Riwayat dihitung di perangkat ini dari sesi Hitung cepat yang tersimpan; hanya sesi sah (' + OHQV_SAH + ') yang disimpan. Nilai sesi = jumlah jawaban benar dalam ' + Math.round(OHC.durasiMs / 1000) + ' detik. Soal naik tingkat sendiri bila kamu makin lancar, jadi nilai tidak otomatis naik walau kamu makin mahir. Median dipakai supaya satu sesi yang sangat bagus atau sangat buruk tidak menggeser angka. Hitung cepat ikut dipengaruhi kantuk, tidur, dan gangguan, jadi anggap ini gambaran kebiasaan, bukan nilai kecerdasan.';
const ohqvJwb = v => snhNum(v) + '\u00a0jawaban';
function ohqvTrenTeks(t) {   // MURNI: keluaran tren ohqRiwayat -> kalimat (kode lebih_banyak / lebih_sedikit / sekitar / belum_cukup)
  if (!t || t.kode === 'belum_cukup') { const a = t && typeof t.n1 === 'number' ? t.n1 : 0, b = t && typeof t.n2 === 'number' ? t.n2 : 0; const pt = n => n >= OHQ.minTren ? 'cukup' : (n > 0 ? n : 0) + ' dari ' + OHQ.minTren + ' sesi'; return 'Tren belum tersedia. ' + OHQ.tren + ' hari terakhir: ' + pt(a) + '; sebelumnya: ' + pt(b) + '.'; }
  const aw = 'Tren: median ' + OHQ.tren + ' hari terakhir ' + ohqvJwb(t.kini), ak = ' dari ' + OHQ.tren + ' hari sebelumnya (' + ohqvJwb(t.basis) + ').', p = ohqvJwb(Math.abs(t.selisih));
  return t.kode === 'lebih_banyak' ? aw + ', lebih banyak ' + p + ak : t.kode === 'lebih_sedikit' ? aw + ', lebih sedikit ' + p + ak : aw + ', sekitar sama dengan ' + OHQ.tren + ' hari sebelumnya (' + ohqvJwb(t.basis) + '; selisih ' + p + ').';
}
function ohqvSvg(g, today) {   // MURNI: keluaran otqGrafik (>= 2 titik) -> <svg>; warna lewat kelas CSS orh-* (token tema)
  const P = g.pts, mn = Math.min.apply(null, P.map(p => p.raw)), mx = Math.max.apply(null, P.map(p => p.raw));
  const lab = 'Grafik garis median Hitung cepat per hari dalam ' + OHQ.hari + ' hari terakhir: ' + P.length + ' hari berisi data, dari ' + snhNum(mn) + ' sampai ' + snhNum(mx) + ' jawaban benar. Angka lengkap ada di daftar sesi terbaru.';
  return '<svg class="orh-svg" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(lab) + '"><line class="orh-g" x1="0" y1="' + (g.h - 0.5) + '" x2="' + g.w + '" y2="' + (g.h - 0.5) + '"/>' +
    '<polyline class="orh-l" points="' + P.map(p => p.x + ',' + p.y).join(' ') + '"/>' +
    P.map(p => '<circle class="orh-d" cx="' + p.x + '" cy="' + p.y + '" r="3.5"><title>' + esc(orhTgl(p.d, today) + ': ' + snhNum(p.raw) + ' jawaban' + (p.n > 1 ? ' (median ' + p.n + ' sesi)' : '')) + '</title></circle>').join('') + '</svg>';
}
function ohqvHtml(rw, o, today) {   // MURNI: tidak mengubah masukan, tidak melempar galat; rw = keluaran ohqRiwayat (atau null), o = { st: 'baca' | 'belum' | 'ok', blocked } -> isi kartu (tanpa pembungkus)
  o = o || {}; const hd = '<div class="nw-hd"><h3>Riwayat Hitung cepat</h3></div>', fine = '<p class="nw-fine">' + esc(OHQV_FINE) + '</p>', st = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  const retry = hd + st('Catatan latihan belum terbaca, jadi riwayat belum bisa ditampilkan.') + '<div class="snh-act"><button class="btn" type="button" data-q="ohqvRetry" data-fk="ohqv-retry">Coba baca lagi</button></div>' + fine;
  if (o.st === 'baca') return hd + st('Membaca catatan latihan…') + fine;
  if (o.st !== 'ok' || !rw || typeof rw !== 'object') return retry;
  const blk = o.blocked ? st('Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Riwayat hanya dibaca; sesi baru tidak disimpan.') : '';
  const depan = rw.masaDepan > 0 ? st(rw.masaDepan + ' sesi bertanggal di masa depan tidak dihitung. Periksa jam perangkat.') : '';
  if (!rw.total) return hd + blk + depan + '<p class="nw-p otr-p">Belum ada sesi Hitung cepat tersimpan. Selesaikan satu sesi sah di atas (' + OHQV_SAH + '); rekor dan grafik muncul di sini.</p>' + fine;
  if (!rw.rekor || !rw.terakhir || !Array.isArray(rw.daftar) || !Array.isArray(rw.titik) || !rw.tren) return retry;   // keluaran tak utuh: jangan gambar setengah
  const tile = (v, nama, tgl) => '<div class="snh-t"><b class="snh-big">' + esc(snhNum(v)) + ' <i>jawaban</i></b><span>' + esc(nama) + '</span><small>' + esc(tgl) + '</small></div>';
  let x = hd + blk + depan + '<div class="snh-st">' + tile(rw.rekor.raw, 'Rekor terbaik', orhTgl(rw.rekor.d, today)) + tile(rw.terakhir.raw, 'Sesi terakhir', orhTgl(rw.terakhir.d, today)) + '</div>' +
    '<p class="nw-p otr-p">' + rw.total + ' sesi tersimpan di ' + rw.hari + ' hari berlatih.</p><p class="nw-p otr-p">' + esc(ohqvTrenTeks(rw.tren)) + '</p>' +
    '<h4 class="orh-h">Median per hari, ' + OHQ.hari + ' hari terakhir</h4>';
  const g = otqGrafik(rw.titik, 300, 90, 8);
  x += g.pts.length >= 2 ? '<div class="orh-svgw">' + ohqvSvg(g, today) + '</div>' + orhSumbuTgl(today, OHQ.hari) + '<p class="otr-prog">Skala ' + snhNum(g.lo) + ' sampai ' + snhNum(g.hi) + ' jawaban · makin banyak makin baik</p>'
    : '<p class="nw-p otr-p">Grafik muncul begitu ada sesi di dua hari berbeda dalam ' + OHQ.hari + ' hari terakhir.</p>';
  let chip = false;   // tanda Rekor hanya pada SATU baris (yang pertama cocok), supaya dua sesi sama nilai di hari yang sama tidak dua kali "Rekor"
  x += '<h4 class="orh-h">Sesi terbaru</h4><ul class="snh-l">' + rw.daftar.map(s => { const adaR = !chip && s.d === rw.rekor.d && s.raw === rw.rekor.raw; if (adaR) chip = true;
    return '<li class="snh-r"><span class="snh-rn">' + esc(ohqvJwb(s.raw)) + '</span>' + (adaR ? '<span class="snh-chip snh-ok">Rekor</span>' : '') + '<span class="snh-rc">' + esc(orhTgl(s.d, today)) + '</span></li>'; }).join('') + '</ul>';
  return x + fine;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6d2: Object.freeze({ html: ohqvHtml, trenTeks: ohqvTrenTeks, svg: ohqvSvg }) }));
/* OTL-6d2a-pure-end */
/* ===== OTL-6d2a-end ===== */
/* ===== OTL-6d2b-begin (21 Nov 2026): Sinaps > Latihan > Hitung cepat, bagian 6d-2b: PEMASANGAN kartu "Riwayat Hitung cepat" di tab Latihan, tepat di bawah kartu Hitung cepat (kartu paling bawah halaman; daftar "Latihan berikutnya" sudah kosong). Hanya BACA dari SNS.data; tidak menulis apa pun. Pembangun HTML = ohqvHtml (OTL-6d-2a, tidak diubah); riwayat = ohqRiwayat (OTL-6d-1). Pola sama dengan OTL-5d-2b (N-Back): kartu digambar ulang hanya bila tanda (SNS siap/memuat/terblokir, jumlah sesi, tanggal u, hari ini) berubah; fokus dijaga; tombol "Coba baca lagi" lewat QACT.ohqvRetry; dipanggil sesudah ohxDraw supaya sesi yang baru disimpan langsung tampil. Tanpa CSS, warna, token, animasi, atau penyimpanan baru. 0 baris lama diubah (pembungkus otvMount dan ohxDraw). Membalik: hapus blok ini. ===== */
const OHQV = { sig: '' };
function ohqvState() { return { st: SNS.ready ? 'ok' : (SNS.loading ? 'baca' : 'belum'), blocked: SNS.blocked }; }
function ohqvSig() { return [SNS.ready, SNS.loading, SNS.blocked, SNS.data.sesi.length, SNS.data.u, today()].join('|'); }
function ohqvDraw(paksa) {   // gambar ulang kartu hanya bila isinya berubah; aman dipanggil sering (ohxDraw memanggilnya pada tiap jawaban, jadi pemeriksaan tanda harus murah)
  const el = $('#ohqvBody'); if (!el) return; const sig = ohqvSig(); if (!paksa && sig === OHQV.sig && el.innerHTML) return;
  OHQV.sig = sig; let rw = null; try { rw = SNS.ready ? ohqRiwayat(SNS.data.sesi, today()) : null; } catch (e) { rw = null; }
  const ae = document.activeElement, had = !!(ae && el.contains(ae));
  try { el.innerHTML = ohqvHtml(rw, ohqvState(), today()); } catch (e) { el.innerHTML = ''; }
  if (had) { const t = el.querySelector('.btn'); try { if (t) t.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } } catch (e) { /* abaikan */ } }
}
function ohqvRetry() { let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } ohqvDraw(true); Promise.resolve(p).then(() => ohqvDraw(true), () => ohqvDraw(true)); }
{ const baseMountQ = otvMount; otvMount = function () {   // sisipkan kartu Riwayat Hitung cepat tepat di bawah kartu Hitung cepat (di atas "Latihan berikutnya" bila ada)
  const w = baseMountQ.apply(this, arguments); if (!w) return w;
  const sec = document.createElement('section'); sec.className = 'nw-card orh-card ohqv-card'; sec.id = 'ohqvBody'; sec.setAttribute('aria-label', 'Riwayat Hitung cepat');
  const s = w.querySelector('#ohkBody'), nx = w.querySelector('.otr-next');
  if (s && s.nextSibling) w.insertBefore(sec, s.nextSibling); else if (nx) w.insertBefore(sec, nx); else w.appendChild(sec);
  OHQV.sig = ''; ohqvDraw(true); let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } Promise.resolve(p).then(() => ohqvDraw(), () => ohqvDraw(true));
  return w;
}; }
{ const baseDrawQ = ohxDraw; ohxDraw = function () { baseDrawQ.apply(this, arguments); ohqvDraw(); }; }   // sesudah simpan berhasil, ohxDraw dipanggil: sesi baru ikut tampil
QACT.ohqvRetry = () => ohqvRetry();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl6d2b: Object.freeze({ draw: ohqvDraw, retry: ohqvRetry, sig: () => OHQV.sig }) }));
/* ===== OTL-6d2b-end ===== */
/* ===== OTL-6f3-begin (21 Nov 2026): Sinaps > Latihan, bagian 6f-3: LABEL TANGGAL dua ujung di bawah grafik median keenam kartu Riwayat (menggantikan "kiri 14 hari lalu, kanan hari ini", yang meleset satu hari: jendela 14 hari bermula 13 hari lalu). Satu fungsi MURNI bersama; 0 baris lama diubah di blok ini. Membalik: hapus blok ini + blok CSS OTL-6f3-css + kembalikan 12 penggantian di enam pembangun kartu (lihat patch_otl6f3.py). */
function orhSumbuTgl(today, hari) {   // MURNI: hari ini 'YYYY-MM-DD' + lebar jendela -> satu baris label dua ujung (tanggal hari pertama jendela di kiri, 'Hari ini' di kanan); tak ada galat, tak pernah NaN; hari ini tak sah = ujung kiri '<n> hari lalu'
  const n = typeof hari === 'number' && isFinite(hari) ? Math.floor(hari) : 0;
  const kiri = n >= 2 ? (snDayOk(today) ? orhTgl(snAddDays(today, -(n - 1)), today) : (n - 1) + ' hari lalu') : '';
  return '<div class="orh-ax"><span>' + esc(kiri) + '</span><span>Hari ini</span></div>';
}
/* ===== OTL-6f3-end ===== */
/* ===== OTH-1a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1a: LOGIKA MURNI mesin pengulangan berjarak (jadwal kartu per hari). Belum ada tampilan, penyimpanan, deck, atau tombol. Membalik: hapus blok ini. ===== */
const HF_GRADE = Object.freeze([['lupa', 'Lupa'], ['sulit', 'Sulit'], ['ingat', 'Ingat'], ['mudah', 'Mudah']].map(a => Object.freeze({ id: a[0], nama: a[1] })));
const HF = Object.freeze({ easeMin: 1.3, easeMax: 3, easeAwal: 2.5, ivlMax: 365, baruPerHari: 5 });
const hfIdOk = id => typeof id === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(id);
function hfSelisih(a, b) {   // hari dari a ke b (b - a); keduanya YYYY-MM-DD sah
  const m = SN_DAY.exec(a), n = SN_DAY.exec(b);
  return Math.round((Date.UTC(+n[1], +n[2] - 1, +n[3]) - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 86400000);
}
function hfBaru(id, today) {
  if (!hfIdOk(id)) throw new Error('id kartu tidak sah');
  if (!snDayOk(today)) throw new Error('tanggal tidak sah');
  return { id, due: today, ivl: 0, ease: HF.easeAwal, reps: 0, lapses: 0, mulai: null, last: null };
}
function hfBersih(c) {   // -> salinan bersih atau null (data tersimpan tidak dipercaya)
  if (!c || typeof c !== 'object' || !hfIdOk(c.id) || !snDayOk(c.due)) return null;
  const i = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi, hari = v => v === null || snDayOk(v);
  if (!i(c.ivl, 0, HF.ivlMax) || !i(c.reps, 0, 100000) || !i(c.lapses, 0, 100000)) return null;
  if (typeof c.ease !== 'number' || !isFinite(c.ease) || c.ease < HF.easeMin || c.ease > HF.easeMax) return null;
  if (!hari(c.mulai) || !hari(c.last)) return null;
  if ((c.last === null) !== (c.mulai === null) || (c.last === null && (c.reps !== 0 || c.ivl !== 0))) return null;
  return { id: c.id, due: c.due, ivl: c.ivl, ease: Math.round(c.ease * 100) / 100, reps: c.reps, lapses: c.lapses, mulai: c.mulai, last: c.last };
}
function hfUlas(card, grade, today) {   // -> kartu baru (masukan tidak diubah); melempar bila tidak sah
  const c = hfBersih(card); if (!c) throw new Error('kartu tidak sah');
  if (!HF_GRADE.some(g => g.id === grade)) throw new Error('nilai tidak sah');
  if (!snDayOk(today)) throw new Error('tanggal tidak sah');
  const telat = c.last === null ? 0 : Math.max(0, hfSelisih(c.due, today)), dasar = c.ivl + Math.floor(telat / 2);
  let ivl, ease = c.ease, reps = c.reps + 1, lapses = c.lapses;
  if (grade === 'lupa') { ivl = 1; ease -= 0.2; reps = 0; if (c.reps > 0) lapses++; }
  else if (grade === 'sulit') { ivl = c.reps === 0 ? 1 : Math.max(dasar + 1, Math.round(dasar * 1.2)); ease -= 0.15; }
  else if (grade === 'ingat') ivl = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.max(dasar + 1, Math.round(dasar * ease));
  else { ivl = c.reps === 0 ? 3 : c.reps === 1 ? 7 : Math.max(dasar + 2, Math.round(dasar * ease * 1.3)); ease += 0.15; }
  ease = Math.min(HF.easeMax, Math.max(HF.easeMin, Math.round(ease * 100) / 100));
  ivl = Math.min(HF.ivlMax, Math.max(1, ivl));
  return { id: c.id, due: snAddDays(today, ivl), ivl, ease, reps, lapses, mulai: c.mulai || today, last: today };
}
function hfAntrean(cards, today, batas) {   // -> { ulang: jatuh tempo (paling telat dulu), baru: sisa jatah hari ini, jatah, total, buang }
  if (!snDayOk(today)) throw new Error('tanggal tidak sah');
  const b = Number.isInteger(batas) && batas >= 0 && batas <= 50 ? batas : HF.baruPerHari, raw = Array.isArray(cards) ? cards : [];
  const seen = new Set(), U = [];
  raw.map(hfBersih).filter(Boolean).forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); U.push(c); } });
  const cmp = (x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
  const ulang = U.filter(c => c.last !== null && c.due <= today).sort(cmp);
  const sisa = Math.max(0, b - U.filter(c => c.mulai === today).length);
  const baru = U.filter(c => c.last === null).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)).slice(0, sisa);
  return { ulang, baru, jatah: sisa, total: U.length, buang: raw.length - U.length };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1a: Object.freeze({ grade: HF_GRADE, cfg: HF, baru: hfBaru, bersih: hfBersih, ulas: hfUlas, antrean: hfAntrean, selisih: hfSelisih }) }));
/* ===== OTH-1a-end ===== */
/* ===== OTH-1b-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1b: tempat simpan `dailylog:hafalan:v1` (daftar kartu) = logika murni hfsClean/hfsUpsert + pemasangan STORES.hafalan lewat antrean simpan yang ada (pola SNH-1b). Catatan `versi_baru` = TIDAK menimpa. Ikut "Hapus semua data". BELUM ada tampilan; BELUM ikut ekspor/impor JSON (1c). Maksimum 2000 kartu (kartu baru ke-2001 DITOLAK, yang lama tidak dibuang). Membalik: hapus blok ini. ===== */
const HFS_KEY = 'dailylog:hafalan:v1', HFS_V = 1, HFS_CAP = 2000, HFS_WAIT = 4000, HFS_UMAX = 4102444800000;
function hfsClean(raw) {   // MURNI: masukan apa pun -> { data, buang, catatan } beku; tidak melempar galat, tidak mengubah masukan; id kembar: yang pertama menang
  const o = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : null, catatan = [];
  if (raw !== null && raw !== undefined && !o) catatan.push('bukan_objek');
  if (o && typeof o.v === 'number' && o.v > HFS_V) catatan.push('versi_baru');
  const src = o && Array.isArray(o.kartu) ? o.kartu : [], seen = new Set(), kartu = [];
  src.forEach(c => { const b = hfBersih(c); if (b && !seen.has(b.id) && kartu.length < HFS_CAP) { seen.add(b.id); kartu.push(Object.freeze(b)); } });
  const u = o && typeof o.u === 'number' && isFinite(o.u) && o.u >= 0 && o.u <= HFS_UMAX ? o.u : 0;
  return Object.freeze({ data: Object.freeze({ v: HFS_V, kartu: Object.freeze(kartu), u }), buang: src.length - kartu.length, catatan: Object.freeze(catatan) });
}
function hfsUpsert(cur, cards, now) {   // MURNI, ATOMIK: tambah atau ganti (menurut id) satu atau banyak kartu; satu saja tak sah = tidak ada yang masuk ({ ok: false, kode: isi | waktu | penuh })
  const fail = kode => Object.freeze({ ok: false, kode, data: cur });
  if (!(typeof now === 'number' && isFinite(now) && now >= 0 && now <= HFS_UMAX)) return fail('waktu');
  const L = Array.isArray(cards) ? cards : [cards], B = L.map(hfBersih);
  if (!L.length || B.some(x => !x)) return fail('isi');
  const m = new Map(cur.kartu.map(c => [c.id, c]));
  B.forEach(b => m.set(b.id, Object.freeze(b)));
  if (m.size > HFS_CAP) return fail('penuh');
  return Object.freeze({ ok: true, kode: 'ok', data: Object.freeze({ v: HFS_V, kartu: Object.freeze([...m.values()]), u: Math.max(now, cur.u + 1) }) });
}
const HFS = { ready: false, loading: false, p: null, gen: 0, blocked: false, catatan: [], data: hfsClean(null).data };   // gen naik tiap "Hapus semua data": hasil muat yang datang terlambat dibuang
STORES.hafalan = { key: HFS_KEY, get: () => HFS.data }; dirty.hafalan = false;   // khusus perangkat sampai 1c (ekspor/impor)
function hfsLoad0() {
  const g = HFS.gen; HFS.loading = true;
  const lama = new Promise(r => setTimeout(() => r(undefined), HFS_WAIT));
  return Promise.race([store.load(HFS_KEY), lama]).then(raw => {
    if (g !== HFS.gen) return;
    if (raw === undefined) { HFS.p = null; return; }   // waktu habis: BELUM siap (bukan dianggap kosong, supaya data tersimpan tidak tertimpa); dicoba lagi pada pemanggilan berikutnya
    const r = hfsClean(raw); HFS.data = r.data; HFS.catatan = r.catatan.slice(); HFS.blocked = r.catatan.indexOf('versi_baru') >= 0; HFS.ready = true;
  }).catch(() => { if (g === HFS.gen) HFS.p = null; }).then(() => { if (g === HFS.gen) HFS.loading = false; });
}
function hfsLoad() { if (!HFS.p) HFS.p = hfsLoad0(); return HFS.p; }
async function hfsPut(cards, now) {   // -> { ok, kode, data } beku; menulis HANYA bila ok; kode: ok | isi | waktu | penuh | belum_siap | versi_baru
  await hfsLoad();
  const fail = kode => Object.freeze({ ok: false, kode, data: HFS.data });
  if (!HFS.ready) return fail('belum_siap');
  if (HFS.blocked) return fail('versi_baru');
  const r = hfsUpsert(HFS.data, cards, now === undefined ? Date.now() : now);
  if (r.ok) { HFS.data = r.data; dirty.hafalan = true; queueSave('hafalan'); }
  return r;
}
function hfsState() { return Object.freeze({ ready: HFS.ready, loading: HFS.loading, blocked: HFS.blocked, dirty: dirty.hafalan, catatan: HFS.catatan.slice(), total: HFS.data.kartu.length, u: HFS.data.u }); }
function hfsWipe() { HFS.gen++; HFS.data = hfsClean(null).data; HFS.blocked = false; HFS.catatan = []; HFS.ready = true; HFS.loading = false; HFS.p = Promise.resolve(); }   // dipanggil "Hapus semua data": sesudahnya flush menulis daftar kosong
{ const baseHfsWipe = odWipe; odWipe = function () { hfsWipe(); return baseHfsWipe.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1b: Object.freeze({ key: HFS_KEY, cap: HFS_CAP, clean: hfsClean, upsert: hfsUpsert, load: hfsLoad, get: () => HFS.data, put: hfsPut, state: hfsState }) }));
/* ===== OTH-1b-end ===== */
/* ===== OTH-1c-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1c: kartu Hafalan IKUT cadangan JSON dan impor (`extra.hafalan`) dan jalur SINKRON yang sama (pola SNH-1c). hfsSnap = salinan murni untuk cadangan (null bila tidak ada kartu, urut id); hfsMergeIn = gabung MURNI per id: kartu yang LEBIH BARU menang (urutan penuh: last, reps, due, ivl, ease, lapses, mulai; kartu yang sama persis = sama), jadi impor dua kali = tidak ada perubahan dan hasil sama di kedua arah; kartu lokal TIDAK pernah dibuang; kartu baru dari file yang melewati batas 2000 DILEWATI dan dihitung (hfPenuh); exMergeHafalan dipanggil exMerge (apply=false hanya menghitung). Titik lama yang disambung: exReady, exEnsure, exSnap (3 tempat), exMerge, importReview, doImport; bertanda OTH-1c. Versi cadangan tetap 4; cadangan tanpa `hafalan` tetap terbaca. Belum ada penghapusan kartu (jadi impor hanya MENAMBAH/memperbarui). Membalik: hapus blok ini dan kembalikan sambungan bertanda OTH-1c. ===== */
const hfsById = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const hfsRank = c => [c.last || '', c.reps, c.due, c.ivl, c.ease, c.lapses, c.mulai || ''];
function hfsCmp(a, b) {   // urutan TOTAL atas isi kartu (dipakai untuk memilih yang lebih baru); 0 hanya bila isinya sama persis
  const x = hfsRank(a), y = hfsRank(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}
function hfsSnap(data) {   // MURNI: data apa pun -> salinan bersih beku untuk cadangan, atau null bila tidak ada kartu; urut id (dua perangkat yang sama = teks yang sama)
  const d = hfsClean(data).data;
  if (!d.kartu.length) return null;
  return Object.freeze({ v: HFS_V, kartu: Object.freeze(d.kartu.map(c => Object.freeze(Object.assign({}, c))).sort(hfsById)), u: d.u });
}
function hfsMergeIn(cur, raw) {   // MURNI: -> { data, add, upd, same, penuh, tak, baru } beku; add = kartu baru di sini; upd = kartu lokal yang diganti karena versi file lebih baru; same = kartu file yang sudah sama atau lebih lama di sini; penuh = kartu baru dilewati karena batas; tak = isian file yang dibuang karena tidak sah; baru = file dari versi lebih baru (kartu yang sah tetap dibaca); u = yang terbesar dari dua sisi
  const c = hfsClean(cur).data, inc = hfsClean(raw), m = new Map(c.kartu.map(k => [k.id, k]));
  let add = 0, upd = 0, same = 0, penuh = 0;
  inc.data.kartu.slice().sort(hfsById).forEach(k => {   // urut id: hasil tidak bergantung urutan di file
    const have = m.get(k.id);
    if (!have) { if (m.size >= HFS_CAP) { penuh++; return; } m.set(k.id, k); add++; }
    else if (hfsCmp(k, have) > 0) { m.set(k.id, k); upd++; }
    else same++;
  });
  return Object.freeze({ data: Object.freeze({ v: HFS_V, kartu: Object.freeze([...m.values()]), u: Math.max(c.u, inc.data.u) }), add, upd, same, penuh, tak: inc.buang, baru: inc.catatan.indexOf('versi_baru') >= 0 });
}
function hfsSnapOut() { return HFS.blocked ? null : hfsSnap(HFS.data); }   // catatan lokal dari versi lebih baru: tidak diekspor
function exMergeHafalan(src, r, apply) {   // dipanggil exMerge
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || !src.hafalan) return;
  if (HFS.blocked) { r.hfBlok = 1; return; }   // catatan lokal dari versi lebih baru: tidak ditimpa
  const m = hfsMergeIn(HFS.data, src.hafalan);
  r.hfAdd = (r.hfAdd || 0) + m.add; r.hfUpd = (r.hfUpd || 0) + m.upd; r.hfTak = (r.hfTak || 0) + m.tak; r.hfPenuh = (r.hfPenuh || 0) + m.penuh;
  if (m.add || m.upd) r.exAdded += m.add + m.upd; else r.exSame++;
  if (apply && (m.add || m.upd || m.data.u !== HFS.data.u)) { HFS.data = m.data; dirty.hafalan = true; queueSave('hafalan'); }   // u selalu ikut maju supaya dua perangkat konvergen walau isi sama
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1c: Object.freeze({ snap: hfsSnap, mergeIn: hfsMergeIn, snapOut: hfsSnapOut, exMerge: exMergeHafalan, cmp: hfsCmp }) }));
/* ===== OTH-1c-end ===== */
/* ===== OTH-1d1-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1d-1: PEMBANGUN HTML MURNI antrean ulasan kartu Hafalan (kartu + hari + isi kartu -> model -> teks HTML). Hanya baca. Belum dipasang ke tab (1d-2) dan tombolnya belum terhubung (1d-3). Isi kartu (depan/belakang) TIDAK disimpan di catatan jadwal; ia disuntikkan lewat fungsi `isi(id)` yang nanti datang dari deck (OTH-2/OTH-3). Membalik: hapus blok ini. ===== */
const HFV_ARAB = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, HFV_HURUF = /\p{L}/gu;
function hfvArab(t) {   // MURNI: true bila lebih dari separuh huruf berskrip Arab (supaya doa berbahasa Arab tampil kanan-ke-kiri); selain string = false
  if (typeof t !== 'string') return false;
  const h = t.match(HFV_HURUF), a = t.match(HFV_ARAB);
  return !!(h && a && a.length * 2 > h.length);
}
function hfvIvl(n) {   // MURNI: jumlah hari -> teks pendek untuk tombol nilai; tak sah = ''
  if (!Number.isInteger(n) || n < 1) return '';
  if (n === 1) return 'besok';
  if (n < 30) return n + ' hari';
  if (n < 365) return '±' + Math.round(n / 30) + ' bulan';
  return '1 tahun';
}
function hfvIsi(x) {   // MURNI: isi kartu sah = objek dengan depan dan belakang berupa teks tidak kosong; selain itu null
  if (!x || typeof x !== 'object') return null;
  const d = typeof x.depan === 'string' ? x.depan.trim() : '', b = typeof x.belakang === 'string' ? x.belakang.trim() : '';
  return d && b ? { depan: d, belakang: b } : null;
}
function hfvBersihkan(cards) {   // kartu rusak dibuang; id kembar: yang pertama menang (sama dengan hfAntrean dan hfsClean)
  const seen = new Set(), U = [];
  (Array.isArray(cards) ? cards : []).map(hfBersih).filter(Boolean).forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); U.push(c); } });
  return U;
}
function hfvModel(cards, today, isi, batas) {   // MURNI, tidak melempar; -> model antrean atau null bila tanggal tak sah. Urutan dan jatah sama dengan hfAntrean, tetapi kartu TANPA ISI tidak memakan jatah dan tidak ikut antre
  if (!snDayOk(today)) return null;
  const b = Number.isInteger(batas) && batas >= 0 && batas <= 50 ? batas : HF.baruPerHari, U = hfvBersihkan(cards);
  const ambil = c => { try { return typeof isi === 'function' ? hfvIsi(isi(c.id)) : null; } catch (e) { return null; } };
  const byDue = (x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : x.id < y.id ? -1 : x.id > y.id ? 1 : 0), byId = (x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
  const tempo = U.filter(c => c.last !== null && c.due <= today).sort(byDue), baruAll = U.filter(c => c.last === null).sort(byId);
  const jatah = Math.max(0, b - U.filter(c => c.mulai === today).length);
  const ulang = tempo.filter(c => ambil(c) !== null), baruIsi = baruAll.filter(c => ambil(c) !== null), baru = baruIsi.slice(0, jatah);
  const dep = U.filter(c => c.last !== null && c.due > today && ambil(c) !== null).sort(byDue), d0 = dep.length ? dep[0].due : null;
  const cur = ulang.length ? ulang[0] : baru.length ? baru[0] : null, ci = cur ? ambil(cur) : null;
  return Object.freeze({ today, batas: b, total: U.length, ulang, baru, jatah, menunggu: baruIsi.length - baru.length, selesai: U.filter(c => c.last === today).length,
    tanpaIsi: (tempo.length - ulang.length) + (baruAll.length - baruIsi.length), berikut: d0 ? { d: d0, n: dep.filter(c => c.due === d0).length } : null,
    mode: U.length === 0 ? 'kosong' : cur ? 'ulas' : 'selesai', cur, isi: ci,
    nilai: cur ? HF_GRADE.map(g => ({ id: g.id, nama: g.nama, ivl: hfUlas(cur, g.id, today).ivl })) : [] });
}
function hfvSisi(t) {   // satu sisi kartu: teks apa adanya (garis baru dijaga lewat CSS); OTH-2b: tiap PARAGRAF (dipisah baris kosong) menentukan arahnya sendiri, skrip Arab -> kanan-ke-kiri, selainnya kiri-ke-kanan (satu paragraf = keluaran lama)
  return String(t).split(/\n{2,}/).map(p => { const ar = hfvArab(p); return '<div class="hfv-t' + (ar ? ' hfv-ar' : '') + '"' + (ar ? ' lang="ar" dir="rtl"' : '') + '>' + esc(p) + '</div>'; }).join('');
}
function hfvHtml(m, st, ui) {   // MURNI: tidak mengubah masukan, tidak melempar galat; m = keluaran hfvModel (atau null), st = keluaran hfsState, ui = { buka: bool }
  const head = '<section class="nw-card hfv-card" id="hfvBody" aria-label="Ulasan kartu hafalan"><div class="nw-hd"><h3>Ulasan hari ini</h3></div>';
  const fine = '<p class="nw-fine">Jadwal ulasan dihitung di perangkat ini dari nilai yang kamu beri. Angka interval memakai aturan sederhana (keluarga SM-2), bukan hasil uji pada hafalanmu.</p></section>';
  if (!st || typeof st !== 'object' || !st.ready) {
    if (st && st.loading && !st.ready) return head + '<p class="nw-p hfv-m" role="status">Memuat kartu hafalan…</p>' + fine;
    return head + '<p class="nw-p hfv-m">Kartu hafalan belum bisa dibaca dari penyimpanan perangkat, jadi tidak ditampilkan agar tidak menyesatkan.</p><div class="snh-act"><button class="btn sm" type="button" data-q="hfRetry" data-fk="hfv-retry">Coba lagi</button></div>' + fine;
  }
  if (!m || typeof m !== 'object' || !Array.isArray(m.ulang) || !Array.isArray(m.baru)) return head + '<p class="nw-p hfv-m">Tanggal perangkat tidak terbaca, jadi antrean ulasan tidak bisa dihitung.</p>' + fine;
  let x = head + '<p class="hfv-date">' + esc(snhTgl(m.today, true)) + '</p>';
  if (m.mode === 'kosong') {
    return x + '<p class="nw-p hfv-m">Belum ada kartu hafalan.</p><p class="nw-p">Kartu datang dari deck. Deck doa dan dzikir dari Ibadah sudah siap: tambahkan lewat kartu di bawah ini, lalu kartunya muncul di sini. Surat pendek dan deck buatan sendiri menyusul (OTH-3).</p>' + fine;   // OTH-2c2: kalimat diubah (tombol Tambahkan sudah ada)
  }
  x += '<ul class="hfv-cnt" aria-label="Antrean hari ini"><li><b>' + m.ulang.length + '</b><span>ulang</span></li><li><b>' + m.baru.length + '</b><span>baru</span></li><li><b>' + m.selesai + '</b><span>selesai</span></li></ul>';
  const catatan = () => (m.tanpaIsi > 0 ? '<p class="nw-p hfv-n">' + m.tanpaIsi + ' kartu belum punya isi (deck-nya belum tersedia), jadi tidak ditampilkan.</p>' : '');
  if (st.blocked) return x + '<p class="nw-p hfv-n">Kartu hafalan di perangkat ini berasal dari versi aplikasi yang lebih baru. Ulasan dimatikan supaya catatan itu tidak tertimpa.</p>' + catatan() + fine;
  if (m.mode !== 'ulas' || !m.cur || !m.isi) {
    x += '<p class="nw-p hfv-m">' + (m.selesai > 0 ? 'Semua kartu hari ini sudah diulas.' : m.berikut || m.menunggu > 0 ? 'Tidak ada kartu yang jatuh tempo hari ini.' : 'Belum ada kartu yang bisa ditampilkan.') + '</p>';
    if (m.berikut) x += '<p class="nw-p hfv-n">Berikutnya: ' + esc(snhTgl(m.berikut.d, true)) + ' · ' + m.berikut.n + ' kartu.</p>';
    if (m.menunggu > 0) x += '<p class="nw-p hfv-n">' + m.menunggu + ' kartu baru menunggu besok (batas ' + m.batas + ' kartu baru per hari).</p>';
    return x + catatan() + fine;
  }
  const buka = !!(ui && ui.buka === true);
  x += '<div class="hfv-face" aria-live="polite"><p class="hfv-lbl">' + (m.cur.last === null ? 'Kartu baru' : 'Ulang') + ' · Pertanyaan</p>' + hfvSisi(m.isi.depan);
  if (buka) x += '<hr class="hfv-sep"><p class="hfv-lbl">Jawaban</p>' + hfvSisi(m.isi.belakang);
  x += '</div>';
  if (!buka) x += '<div class="snh-act"><button class="btn primary wide" type="button" data-q="hfShow" data-fk="hfv-show">Tampilkan jawaban</button></div>';
  else {
    x += '<p class="hfv-ask" id="hfvAsk">Seberapa ingat kamu?</p><div class="hfv-grades" role="group" aria-labelledby="hfvAsk">' + (Array.isArray(m.nilai) ? m.nilai : []).map(g => {
      const t = hfvIvl(g.ivl);
      return '<button class="btn hfv-g hfv-g-' + esc(g.id) + '" type="button" data-q="hfGrade" data-v="' + esc(g.id) + '" data-fk="hfv-g-' + esc(g.id) + '" aria-label="' + esc(g.nama) + ', muncul lagi ' + (t === 'besok' ? 'besok' : 'dalam ' + esc(t)) + '"><b>' + esc(g.nama) + '</b><small>' + esc(t) + '</small></button>';
    }).join('') + '</div>';
  }
  return x + catatan() + fine;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1d1: Object.freeze({ model: hfvModel, html: hfvHtml, ivl: hfvIvl, arab: hfvArab, isi: hfvIsi }) }));
/* ===== OTH-1d1-end ===== */
/* ===== OTH-1d2-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1d-2: PEMASANGAN kartu "Ulasan hari ini" ke tab Hafalan (pembungkus nwRender, muat catatan dengan batas waktu, tombol "Coba lagi", hari baru saat aplikasi dibuka lagi, kalimat kecil hero ikut jujur). Isi kartu (depan/belakang) datang dari deck lewat hfvPakaiIsi; sampai deck ada (OTH-2), tab menampilkan keadaan kosong yang jujur. "Tampilkan jawaban" hanya mengubah tampilan. TIDAK menulis apa pun ke penyimpanan (empat tombol nilai dan penyimpanan = 1d-3). Pembangun HTML = hfvHtml (1d-1). Membalik: hapus blok ini dan CSS OTH-1d2. ===== */
let hfvLast = 0, hfvW = false, HFV_SRC = null;   // hfvLast = waktu terakhir kita mulai atau ikut menunggu pemuatan (ms); hfvW = sudah ada penunggu; satu percobaan per 8 detik supaya kegagalan tidak berputar tanpa henti; HFV_SRC = fungsi isi(id) dari deck (null = belum ada deck)
const HFVUI = { buka: false, id: null };   // buka = jawaban kartu saat ini sudah ditampilkan; id = kartu yang sedang diulas (ganti kartu = jawaban tertutup lagi)
function hfvOn() { return curView === 'sinaps' && nwTab.sinaps === 'hafalan'; }
function hfvIsiOf(id) { try { return typeof HFV_SRC === 'function' ? HFV_SRC(id) : null; } catch (e) { return null; } }   // galat dari deck = kartu tanpa isi, bukan layar rusak
function hfvPakaiIsi(fn) { HFV_SRC = typeof fn === 'function' ? fn : null; if (hfvOn()) nwRender('sinaps'); }   // deck mendaftar di sini (OTH-2); selain fungsi = deck dicabut
function hfvNow() {   // -> { m, st }; m = hfvModel menurut hari HP sekarang, atau null bila belum siap atau tanggal tak sah; TIDAK melempar
  const st = hfsState();
  let m = null; try { m = st.ready ? hfvModel(HFS.data.kartu, today(), hfvIsiOf) : null; } catch (e) { m = null; }
  return { m, st };
}
function hfvKick() {   // ikut menunggu pemuatan catatan (kita yang memulai ATAU pemuatan latar exEnsure yang sedang berjalan); selesai = gambar ulang hanya bila tab Hafalan masih terbuka
  if (HFS.ready || hfvW) return;
  if (!HFS.loading && Date.now() - hfvLast < 8000) return;   // gagal barusan: tidak mengulang otomatis sebelum 8 detik
  hfvLast = Date.now(); hfvW = true;
  hfsLoad().then(() => { hfvW = false; if (hfvOn()) nwRender('sinaps'); });   // hfsLoad memakai janji yang sedang berjalan bila ada
}
function hfvMount() {   // ganti kartu kerangka dengan kartu asli; -> elemen pembungkus, atau null bila tidak ada kartu
  const root = $('#nwSinapsBody'), card = root && root.querySelector('.nw-card'); if (!card) return null;
  const n = hfvNow(), m = n.m;
  if (m && m.mode === 'ulas' && m.cur && !n.st.blocked) { if (HFVUI.id !== m.cur.id) { HFVUI.id = m.cur.id; HFVUI.buka = false; } } else { HFVUI.id = null; HFVUI.buka = false; }
  const w = document.createElement('div'); w.id = 'hfvWrap'; w.innerHTML = hfvHtml(m, n.st, { buka: HFVUI.buka }); card.replaceWith(w); return w;
}
QACT.hfRetry = () => { if (!HFS.ready && !HFS.loading && !hfvW) hfvLast = 0; hfvKick(); if (hfvOn()) nwRender('sinaps'); };
QACT.hfShow = () => {   // hanya tampilan: jawaban dibuka bila memang ada kartu yang sedang diulas
  if (!hfvOn()) return;
  const n = hfvNow(); if (!n.m || n.m.mode !== 'ulas' || !n.m.cur || n.st.blocked) return;
  HFVUI.id = n.m.cur.id; HFVUI.buka = true; nwRender('sinaps');
};
{ const baseNwHf = nwRender; nwRender = function (key) {
  const root = key === 'sinaps' ? $('#nwSinapsBody') : null, ae = document.activeElement, fk = root && ae && root.contains(ae) ? (ae.dataset && ae.dataset.fk) || (ae.id === 'hfvBody' ? 'hfv-card' : null) : null;   // fokus dipulihkan sesudah kartu diganti
  baseNwHf.apply(this, arguments);
  if (key !== 'sinaps') return;
  if (nwTab.sinaps !== 'hafalan') { HFVUI.buka = false; HFVUI.id = null; return; }
  hfvKick();
  const w = hfvMount();
  if (w && fk && fk.indexOf('hfv-') === 0) {   // tombol yang sama bila masih ada; tombol yang hilang (jawaban dibuka, memuat) = fokus ke kartu baru
    const el = root.querySelector('[data-fk="' + fk + '"]') || w.querySelector('#hfvBody');
    if (el) { if (el.id === 'hfvBody') el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
  }
}; }
function hfvHeroTeks(t, adaDeck) {   // MURNI: kalimat kecil hero Sinaps (dari tahap sebelumnya) + keadaan Hafalan yang jujur; kalimat yang tak dikenal dikembalikan apa adanya
  if (typeof t !== 'string') return '';
  const AKHIR = '; tab lain menyusul.';
  if (t.slice(-AKHIR.length) !== AKHIR) return t;
  return adaDeck === true ? t : t.slice(0, -AKHIR.length) + '; Hafalan menunggu deck' + AKHIR;
}
{ const baseNwHf2 = nwRender; nwRender = function (key) {
  baseNwHf2.apply(this, arguments);
  if (key === 'sinaps') { const f = $('#nwSinapsBody .nw-hero .nw-fine'); if (f) f.textContent = hfvHeroTeks(f.textContent, typeof HFV_SRC === 'function'); }
}; }
document.addEventListener('visibilitychange', () => { if (!document.hidden && hfvOn()) nwRender('sinaps'); });   // lewat tengah malam: tanggal dan antrean ikut baru
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1d2: Object.freeze({ now: hfvNow, mount: hfvMount, kick: hfvKick, pakaiIsi: hfvPakaiIsi, hero: hfvHeroTeks, ui: () => Object.freeze({ buka: HFVUI.buka, id: HFVUI.id }) }) }));
/* ===== OTH-1d2-end ===== */
/* ===== OTH-1d3a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1d-3a: LOGIKA MURNI aksi nilai kartu (kartu + nilai + hari -> kartu baru atau penolakan) dan status simpan nilai (teks + penyisip ke HTML kartu 1d-1 lewat pembungkus). Hanya baca: TIDAK menulis, TIDAK dipasang ke tombol (itu 1d-3b). Pagar murni: nilai hanya sah untuk kartu yang SEDANG ditampilkan di antrean (mencegah ketuk ganda menilai kartu berikutnya yang jawabannya belum dilihat). Membalik: hapus blok ini. ===== */
const HFV_SV_KODE = Object.freeze({
  versi_baru: 'Tidak disimpan: kartu hafalan di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi tidak ditimpa.',
  belum_siap: 'Belum tersimpan: kartu hafalan di perangkat ini belum terbaca.',
  waktu: 'Belum tersimpan: jam perangkat tidak masuk akal.',
  isi: 'Tidak disimpan: kartu ini tidak lolos pemeriksaan data.',
  penuh: 'Tidak disimpan: tempat simpan kartu hafalan penuh.',
  galat: 'Belum tersimpan: terjadi galat saat menulis.'
});
const HFV_SV_ULANG = Object.freeze({ belum_siap: 1, waktu: 1, galat: 1 });   // kode yang boleh dicoba lagi (versi_baru, isi, dan penuh tidak berubah dengan mencoba lagi)
const hfvHas = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const hfvBoleh = k => typeof k === 'string' && hfvHas(HFV_SV_ULANG, k);
function hfvKapan(n) {   // MURNI: jumlah hari -> "besok" | "dalam N hari" | "dalam ±N bulan" | "dalam 1 tahun"; tak sah = ''
  const t = hfvIvl(n);
  return t === '' ? '' : t === 'besok' ? 'besok' : 'dalam ' + t;
}
function hfvAksi(cards, id, grade, today, isi) {   // MURNI, tidak melempar, tidak mengubah masukan; -> { ok, kode, lama, baru, nilai } beku. kode: ok | tanggal | nilai | bukan_giliran | isi
  const f = kode => Object.freeze({ ok: false, kode, lama: null, baru: null, nilai: '' });
  if (!snDayOk(today)) return f('tanggal');
  const g = HF_GRADE.find(x => x.id === grade); if (!g) return f('nilai');
  let m = null; try { m = hfvModel(cards, today, isi); } catch (e) { m = null; }
  if (!m || m.mode !== 'ulas' || !m.cur || typeof id !== 'string' || m.cur.id !== id) return f('bukan_giliran');
  let baru; try { baru = hfUlas(m.cur, grade, today); } catch (e) { return f('isi'); }
  return Object.freeze({ ok: true, kode: 'ok', lama: m.cur, baru: Object.freeze(baru), nilai: g.nama });
}
function hfvSvHtml(sv) {   // MURNI: status simpan nilai { st: menyimpan | ok | gagal, nama, ivl, kode } -> satu paragraf status; selain itu ''
  if (!sv || typeof sv !== 'object') return '';
  const p = (t, r) => '<p class="nw-p hfv-n hfv-sv" id="hfvSv" role="' + r + '">' + esc(t) + '</p>', nama = typeof sv.nama === 'string' ? sv.nama : '', kapan = hfvKapan(sv.ivl);
  if (sv.st === 'menyimpan') return p('Menyimpan nilai…', 'status');
  if (sv.st === 'ok') return p('Nilai tersimpan di perangkat ini' + (nama && kapan ? ': ' + nama + ', muncul lagi ' + kapan + '.' : '.'), 'status');
  if (sv.st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && hfvHas(HFV_SV_KODE, k) ? HFV_SV_KODE[k] : typeof k === 'string' && k !== '' ? 'Belum tersimpan (' + k + ').' : 'Belum tersimpan.';
    return p(t + (hfvBoleh(k) ? ' Ketuk nilai lagi untuk mencoba.' : ''), 'alert');
  }
  return '';
}
const HFV_HTML0 = hfvHtml;
function hfvHtmlS(m, st, ui) {   // MURNI: hfvHtml (1d-1) + status simpan (ui.sv) tepat sebelum kalimat kecil di dasar kartu; sedang menyimpan = tombol nilai mati (tidak bisa diketuk dua kali)
  let h = HFV_HTML0(m, st, ui); const sv = ui && typeof ui === 'object' ? ui.sv : null, s = hfvSvHtml(sv);
  if (!s) return h;
  if (sv.st === 'menyimpan') h = h.split('<button class="btn hfv-g ').join('<button disabled class="btn hfv-g ');
  const i = h.lastIndexOf('<p class="nw-fine">');
  return i < 0 ? h + s : h.slice(0, i) + s + h.slice(i);
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1d3a: Object.freeze({ aksi: hfvAksi, svHtml: hfvSvHtml, htmlS: hfvHtmlS, kapan: hfvKapan, boleh: hfvBoleh, kode: HFV_SV_KODE }) }));
/* ===== OTH-1d3a-end ===== */
/* ===== OTH-1d3b-begin (22 Nov 2026): Sinaps > Hafalan, bagian 1d-3b: PEMASANGAN empat tombol nilai (QACT.hfGrade). Pagar: hanya bila tab Hafalan terbuka, kartu giliran = kartu yang ditampilkan, dan jawabannya SUDAH dibuka; penjaga ketuk ganda (HFVSV.busy diatur sinkron sebelum menunggu apa pun); tulis lewat hfsPut (satu kartu); sukses = jawaban tertutup + kartu berikutnya + status "tersimpan"; gagal = kartu dan jawaban tetap + pesan jujur, ketuk nilai lagi = coba lagi. Logika murni = OTH-1d-3a (hfvAksi, hfvHtmlS). Membalik: hapus blok ini dan CSS OTH-1d3b. ===== */
const HFVSV = { sv: null, busy: false };   // sv = { id, st: menyimpan | ok | gagal, nama, ivl, kode }; busy = sedang menulis satu nilai
function hfvSvPilih(v, m) {   // MURNI: status yang boleh tampil di keadaan m; ok = tampil di kartu BERIKUTNYA (sekali); menyimpan dan gagal hanya di kartu yang sama; selain itu null
  if (!v || typeof v !== 'object') return null;
  if (v.st === 'ok') return v;
  return m && m.cur && m.cur.id === v.id ? v : null;
}
hfvHtml = function (m, st, ui) {   // pembungkus: hfvHtmlS (1d-3a) + status simpan dari HFVSV; ui.sv yang diberikan pemanggil tetap menang
  const u = ui && typeof ui === 'object' ? Object.assign({}, ui) : {};
  if (u.sv === undefined) u.sv = hfvSvPilih(HFVSV.sv, m);
  return hfvHtmlS(m, st, u);
};
function hfvDraw() { if (hfvOn()) nwRender('sinaps'); }
function hfvFokusKe(sel) { const el = $('#nwSinapsBody ' + sel); if (!el) return; if (el.id === 'hfvBody') el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
QACT.hfGrade = el => {
  if (!hfvOn() || HFVSV.busy) return;   // bukan tab Hafalan, atau nilai sebelumnya masih ditulis (ketuk ganda)
  const g = el && el.dataset && typeof el.dataset.v === 'string' ? el.dataset.v : '';
  const n = hfvNow(), m = n.m;
  if (!m || m.mode !== 'ulas' || !m.cur || n.st.blocked || !HFVUI.buka || HFVUI.id !== m.cur.id) { hfvDraw(); return; }   // tombol basi atau jawaban belum dibuka: tidak menilai; gambar ulang yang benar, diam
  const r = hfvAksi(HFS.data.kartu, m.cur.id, g, today(), hfvIsiOf);
  if (!r.ok) {
    if (r.kode === 'bukan_giliran' || r.kode === 'nilai') { hfvDraw(); return; }
    HFVSV.sv = { id: m.cur.id, st: 'gagal', nama: '', ivl: 0, kode: r.kode === 'tanggal' ? 'waktu' : r.kode }; hfvDraw(); hfvFokusKe('[data-fk="hfv-g-' + g + '"]'); return;
  }
  HFVSV.busy = true;
  const v = { id: m.cur.id, st: 'menyimpan', nama: r.nilai, ivl: r.baru.ivl, kode: '' }; HFVSV.sv = v; hfvDraw();   // menyimpan = keempat tombol mati
  let p; try { p = hfsPut([r.baru], Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(x => x, () => null).then(x => {
    HFVSV.busy = false;
    if (x && x.ok) { v.st = 'ok'; HFVUI.buka = false; } else { v.st = 'gagal'; v.kode = x && typeof x.kode === 'string' && x.kode ? x.kode : 'galat'; }
    if (HFVSV.sv !== v) return;
    if (!hfvOn()) { HFVSV.sv = null; return; }   // pindah tab selama menulis: status basi dibuang
    nwRender('sinaps'); hfvFokusKe(v.st === 'ok' ? '#hfvBody' : '[data-fk="hfv-g-' + g + '"]');
  });
};
{ const baseShowOth3b = QACT.hfShow; QACT.hfShow = function () { if (HFVSV.sv && HFVSV.sv.st === 'ok') HFVSV.sv = null; return baseShowOth3b.apply(this, arguments); }; }   // membuka jawaban kartu berikutnya = status "tersimpan" sudah terbaca
{ const baseNwOth3b = nwRender; nwRender = function (key) { if (key === 'sinaps' && nwTab.sinaps !== 'hafalan' && !HFVSV.busy) HFVSV.sv = null; return baseNwOth3b.apply(this, arguments); }; }   // keluar dari tab Hafalan = status dibuang
window.DL = Object.freeze(Object.assign({}, window.DL, { oth1d3b: Object.freeze({ grade: QACT.hfGrade, pilih: hfvSvPilih, sv: () => HFVSV.sv ? Object.freeze(Object.assign({}, HFVSV.sv)) : null, busy: () => HFVSV.busy }) }));
/* ===== OTH-1d3b-end ===== */
/* ===== OTH-2a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 2a: LOGIKA MURNI deck "Doa & dzikir" dari Ibadah (IBX_DOA): entri doa -> isi kartu (depan/belakang), id kartu, ringkasan per kategori, dan daftar kartu BARU yang belum ada di catatan jadwal. Hanya baca: TIDAK menulis, TIDAK mendaftar ke tab (2b), belum ada tombol (2c). Kartu yang sudah ada TIDAK pernah ikut daftar baru (hfsUpsert mengganti menurut id, jadi menyertakannya akan mengosongkan kemajuan). Membalik: hapus blok ini. ===== */
const HFD_AWAL = 'ib.';
const hfdTeks = v => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '');
function hfdId(did) {   // MURNI: id doa Ibadah -> id kartu 'ib.<id>' bila sah sebagai id kartu, selain itu null
  if (typeof did !== 'string') return null;
  const id = HFD_AWAL + did; return hfIdOk(did) && hfIdOk(id) ? id : null;   // id doa sendiri juga harus sah (kosong atau diawali titik = tak sah)
}
function hfdDid(id) {   // MURNI: kebalikan hfdId; bukan kartu deck Ibadah = null
  if (typeof id !== 'string' || id.indexOf(HFD_AWAL) !== 0) return null;
  const d = id.slice(HFD_AWAL.length); return hfdId(d) === id ? d : null;
}
function hfdKartu(d) {   // MURNI: satu entri IBX_DOA -> { id, did, kat, depan, belakang } beku, atau null bila tak lengkap (butuh id sah, judul, dan teks Arab)
  if (!d || typeof d !== 'object') return null;
  const id = hfdId(d.id), t = hfdTeks(d.t), ar = hfdTeks(d.ar), lat = hfdTeks(d.lat), tr = hfdTeks(d.tr), s = hfdTeks(d.s);
  if (!id || !t || !ar) return null;
  const n = Number.isInteger(d.n) && d.n > 1 && d.n <= 1000 ? d.n : 0;
  return Object.freeze({ id, did: d.id, kat: typeof d.c === 'string' ? d.c : '', depan: t + (n ? '\n\nDibaca ' + n + ' kali' : ''),
    belakang: [ar, lat, tr ? 'Artinya: ' + tr : '', s ? 'Sumber: ' + s : ''].filter(Boolean).join('\n\n') });
}
function hfdBangun(doa, cats) {   // MURNI, tidak melempar: -> deck beku { kartu (urut asli), kat: [{ id, nama }] (urut cats, hanya yang punya kartu; kategori asing = 'Lainnya'), buang }; id kembar: yang pertama menang
  const src = Array.isArray(doa) ? doa : [], seen = new Set(), kartu = [];
  src.forEach(d => { const k = hfdKartu(d); if (k && !seen.has(k.id)) { seen.add(k.id); kartu.push(k); } });
  const C = (Array.isArray(cats) ? cats : []).filter(c => Array.isArray(c) && typeof c[0] === 'string' && c[0] !== '' && typeof c[1] === 'string' && c[1] !== '');
  const dikenal = new Set(C.map(c => c[0]));
  kartu.forEach((k, i) => { if (!dikenal.has(k.kat) && k.kat !== '') kartu[i] = Object.freeze(Object.assign({}, k, { kat: '' })); });   // kategori asing = '' (sama dengan chip Lainnya)
  const ada = new Set(kartu.map(k => (dikenal.has(k.kat) ? k.kat : '')));
  const kat = C.filter(c => ada.has(c[0])).map(c => Object.freeze({ id: c[0], nama: c[1] }));
  if (ada.has('')) kat.push(Object.freeze({ id: '', nama: 'Lainnya' }));
  return Object.freeze({ kartu: Object.freeze(kartu), kat: Object.freeze(kat), buang: src.length - kartu.length });
}
function hfdIsiDari(deck) {   // MURNI: deck -> fungsi isi(id) -> { depan, belakang } (salinan) atau null; untuk hfvPakaiIsi (2b)
  const m = new Map((deck && Array.isArray(deck.kartu) ? deck.kartu : []).map(k => [k.id, k]));
  return id => { const k = typeof id === 'string' ? m.get(id) : undefined; return k ? { depan: k.depan, belakang: k.belakang } : null; };
}
function hfdIdSimpan(tersimpan) { return new Set((Array.isArray(tersimpan) ? tersimpan : []).filter(c => c && typeof c === 'object' && typeof c.id === 'string').map(c => c.id)); }
function hfdBaruDari(deck, tersimpan, today, kat, cap) {   // MURNI: -> { kartu: [hfBaru], sudah, terpotong } atau null bila tanggal atau deck tak sah; hanya id yang BELUM ada di catatan; kat (teks) membatasi satu kategori; dibatasi sisa kapasitas (cap bawaan HFS_CAP), kelebihan dihitung di terpotong, urutan = urutan deck
  if (!snDayOk(today) || !deck || !Array.isArray(deck.kartu)) return null;
  const ada = hfdIdSimpan(tersimpan), batas = Number.isInteger(cap) && cap >= 0 ? cap : HFS_CAP;
  const pilih = deck.kartu.filter(k => typeof kat !== 'string' || k.kat === kat), baru = pilih.filter(k => !ada.has(k.id)), sisa = Math.max(0, batas - ada.size);
  return Object.freeze({ kartu: Object.freeze(baru.slice(0, sisa).map(k => Object.freeze(hfBaru(k.id, today)))), sudah: pilih.length - baru.length, terpotong: Math.max(0, baru.length - sisa) });
}
function hfdRingkas(deck, tersimpan) {   // MURNI: -> { total, ada, belum, perKat: [{ id, nama, total, ada }] } (ada = kartu deck yang sudah punya catatan jadwal)
  const ada = hfdIdSimpan(tersimpan), K = deck && Array.isArray(deck.kartu) ? deck.kartu : [], KT = deck && Array.isArray(deck.kat) ? deck.kat : [];
  const sudah = K.filter(k => ada.has(k.id)).length, dik = new Set(KT.map(c => c.id));
  const perKat = KT.map(c => { const L = K.filter(k => (dik.has(k.kat) ? k.kat : '') === c.id); return Object.freeze({ id: c.id, nama: c.nama, total: L.length, ada: L.filter(k => ada.has(k.id)).length }); });
  return Object.freeze({ total: K.length, ada: sudah, belum: K.length - sudah, perKat: Object.freeze(perKat) });
}
let HFD_DECK = null;
function hfdDeck() {   // deck dari Ibadah, dibangun sekali (malas); data Ibadah hilang = deck kosong, bukan galat
  if (!HFD_DECK) { let d = [], c = []; try { d = typeof IBX_DOA !== 'undefined' ? IBX_DOA : []; c = typeof IBX_CAT !== 'undefined' ? IBX_CAT : []; } catch (e) { /* abaikan */ } HFD_DECK = hfdBangun(d, c); }
  return HFD_DECK;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth2a: Object.freeze({ awal: HFD_AWAL, id: hfdId, did: hfdDid, kartu: hfdKartu, bangun: hfdBangun, isiDari: hfdIsiDari, baru: hfdBaruDari, ringkas: hfdRingkas, deck: hfdDeck }) }));
/* ===== OTH-2a-end ===== */
/* ===== OTH-2b-begin (22 Nov 2026): Sinaps > Hafalan, bagian 2b: deck "Doa & dzikir" dari Ibadah DIDAFTARKAN ke tab Hafalan lewat hfvPakaiIsi (isi kartu `ib.*` sekarang ada; hero tidak lagi menulis "menunggu deck"). Belum ada tombol yang memasukkan kartu ke jadwal (2c), jadi tab tetap kosong sampai itu. Pendaftaran dibungkus try/catch: gagal = tab tanpa deck, bukan layar rusak. Perubahan kode lama (hfvSisi: arah baca per paragraf; kalimat keadaan kosong) bertanda OTH-2b. Membalik: hapus blok ini dan CSS OTH-2b, kembalikan dua titik lama bertanda OTH-2b. ===== */
try { hfvPakaiIsi(hfdIsiDari(hfdDeck())); } catch (e) { /* abaikan: tab tetap bekerja tanpa deck */ }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth2b: Object.freeze({ deckAktif: () => typeof HFV_SRC === 'function' }) }));
/* ===== OTH-2b-end ===== */
/* ===== OTH-2c1-begin (22 Nov 2026): Sinaps > Hafalan, bagian 2c-1: LOGIKA MURNI kartu "Deck Doa & dzikir" (aksi tambah per kategori + status + pembangun HTML). Belum dipasang ke tab, belum ada tombol yang hidup, belum menulis apa pun (pemasangan dan QACT.hfdAdd = 2c-2). Aksi hanya MENYIAPKAN kartu baru lewat hfdBaruDari (hanya id yang belum ada di catatan; tidak pernah menimpa kemajuan menghafal). Semua teks dari luar lewat esc(). Membalik: hapus blok ini. ===== */
const HFD_ALASAN = Object.freeze({ belum_siap: 'jadwal hafalan belum selesai dimuat', versi_baru: 'catatan di perangkat berasal dari versi aplikasi yang lebih baru', waktu: 'tanggal perangkat tidak terbaca', tanggal: 'tanggal perangkat tidak terbaca', isi: 'kartu tidak lolos pemeriksaan', galat: 'penyimpanan di perangkat gagal', kategori: 'kategori tidak dikenal', deck: 'deck doa tidak tersedia' });
function hfdAksi(deck, tersimpan, today, kat, cap) {   // MURNI, tidak melempar: -> { ok, kode, kartu, jumlah, nama, sudah, terpotong } beku; kode: ok | deck | tanggal | kategori | tidak_ada (semua sudah ada) | penuh (ada yang baru tetapi tidak muat di kapasitas); ok = ada minimal satu kartu baru untuk ditulis
  const g = kode => Object.freeze({ ok: false, kode, kartu: Object.freeze([]), jumlah: 0, nama: '', sudah: 0, terpotong: 0 });
  try {
    if (!deck || typeof deck !== 'object' || !Array.isArray(deck.kartu) || !Array.isArray(deck.kat)) return g('deck');
    if (!snDayOk(today)) return g('tanggal');
    const c = typeof kat === 'string' ? deck.kat.find(x => x && typeof x === 'object' && x.id === kat) : undefined;
    if (!c) return g('kategori');
    const b = hfdBaruDari(deck, tersimpan, today, kat, cap); if (!b) return g('deck');
    const o = { nama: String(c.nama), sudah: b.sudah, terpotong: b.terpotong };
    if (!b.kartu.length) return Object.freeze(Object.assign({ ok: false, kode: b.terpotong > 0 ? 'penuh' : 'tidak_ada', kartu: b.kartu, jumlah: 0 }, o));
    return Object.freeze(Object.assign({ ok: true, kode: 'ok', kartu: b.kartu, jumlah: b.kartu.length }, o));
  } catch (e) { return g('deck'); }
}
function hfdSvPilih(sv) {   // MURNI: status simpan yang sah -> salinan beku { st: menyimpan | ok | gagal, nama, n, terpotong, kode }; selain itu null
  if (!sv || typeof sv !== 'object') return null;
  const st = sv.st === 'menyimpan' || sv.st === 'ok' || sv.st === 'gagal' ? sv.st : null, I = v => (Number.isInteger(v) && v >= 0 && v <= 100000 ? v : 0);
  if (!st) return null;
  return Object.freeze({ st, nama: typeof sv.nama === 'string' ? sv.nama.slice(0, 80) : '', n: I(sv.n), terpotong: I(sv.terpotong), kode: typeof sv.kode === 'string' ? sv.kode.slice(0, 20) : '' });
}
function hfdSvTeks(sv) {   // MURNI: status -> satu kalimat (teks mentah, belum di-escape); null = tidak ada pesan
  const v = hfdSvPilih(sv); if (!v) return null;
  const k = v.n + ' kartu' + (v.nama ? ' ' + v.nama : '');
  if (v.st === 'menyimpan') return 'Menyimpan ' + k + '…';
  if (v.st === 'ok') return k + ' ditambahkan ke jadwal.' + (v.terpotong > 0 ? ' ' + v.terpotong + ' kartu lain tidak masuk karena jadwal sudah penuh (batas ' + HFS_CAP + ' kartu).' : '');
  if (v.kode === 'tidak_ada') return 'Tidak ada kartu baru di kategori ini; semuanya sudah ada di jadwal.';
  if (v.kode === 'penuh') return 'Jadwal sudah penuh (batas ' + HFS_CAP + ' kartu), jadi kartu baru belum bisa ditambahkan.';
  const a = Object.prototype.hasOwnProperty.call(HFD_ALASAN, v.kode) ? HFD_ALASAN[v.kode] : 'terjadi galat yang tidak dikenal';
  return 'Belum tersimpan: ' + a + '. Ketuk Tambahkan lagi untuk mencoba.';
}
function hfdHtml(r, st, ui) {   // MURNI, tidak mengubah masukan, tidak melempar galat; r = keluaran hfdRingkas, st = keluaran hfsState, ui = { sv }
  const head = '<section class="nw-card hfd-card" id="hfdBody" aria-label="Deck Doa dan dzikir"><div class="nw-hd"><h3>Deck Doa &amp; dzikir</h3></div>';
  const fine = '<p class="nw-fine">Teks doa diambil dari halaman Ibadah dan belum dicocokkan ulang dengan rujukan; periksa dulu sebelum menghafalkannya.</p></section>';
  try {
    if (!st || typeof st !== 'object' || !st.ready) return head + '<p class="nw-p hfd-m"' + (st && st.loading ? ' role="status"' : '') + '>' + (st && st.loading && !st.ready ? 'Memuat jadwal hafalan…' : 'Jadwal hafalan belum bisa dibaca, jadi kartu belum bisa ditambahkan.') + '</p>' + fine;
    const K = r && typeof r === 'object' && Array.isArray(r.perKat) ? r.perKat.filter(c => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.nama === 'string' && Number.isInteger(c.total) && c.total > 0 && Number.isInteger(c.ada) && c.ada >= 0 && c.ada <= c.total) : [];
    if (!K.length || !Number.isInteger(r.total) || r.total < 1) return head + '<p class="nw-p hfd-m">Deck doa dan dzikir belum tersedia di aplikasi ini.</p>' + fine;
    const sv = hfdSvPilih(ui && typeof ui === 'object' ? ui.sv : null), mati = st.blocked === true || (sv !== null && sv.st === 'menyimpan');
    const ada = K.reduce((a, c) => a + c.ada, 0), tot = K.reduce((a, c) => a + c.total, 0);
    let x = head + '<p class="nw-p hfd-intro">Pilih kategori untuk memasukkan doanya ke jadwal hafalan. Kartu yang sudah ada tidak diubah.</p>';
    x += '<p class="nw-p hfd-sum"><b>' + ada + '</b> dari <b>' + tot + '</b> doa sudah ada di jadwal hafalanmu.</p><ul class="hfd-list" aria-label="Kategori doa">';
    x += K.map(c => {
      const b = c.total - c.ada;
      return '<li class="hfd-row"><div class="hfd-nm"><span class="hfd-n">' + esc(c.nama) + '</span><small>' + c.ada + ' dari ' + c.total + ' sudah ada</small></div>' + (b > 0
        ? '<button class="btn sm hfd-add" type="button" data-q="hfdAdd" data-kat="' + esc(c.id) + '" data-fk="hfd-add-' + esc(c.id) + '"' + (mati ? ' disabled' : '') + ' aria-label="Tambahkan ' + b + ' kartu ' + esc(c.nama) + ' ke jadwal hafalan">Tambahkan ' + b + '</button>'
        : '<span class="hfd-done">Sudah semua</span>') + '</li>';
    }).join('') + '</ul>';
    if (st.blocked === true) x += '<p class="nw-p hfd-n2">Kartu hafalan di perangkat ini berasal dari versi aplikasi yang lebih baru. Menambah kartu dimatikan supaya catatan itu tidak tertimpa.</p>';
    const t = hfdSvTeks(sv); if (t) x += '<p class="nw-p hfd-msg" role="status" aria-live="polite">' + esc(t) + '</p>';
    return x + fine;
  } catch (e) { return head + '<p class="nw-p hfd-m">Kartu deck tidak bisa ditampilkan.</p>' + fine; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth2c1: Object.freeze({ aksi: hfdAksi, svPilih: hfdSvPilih, svTeks: hfdSvTeks, html: hfdHtml, alasan: HFD_ALASAN }) }));
/* ===== OTH-2c1-end ===== */
/* ===== OTH-2c2-begin (22 Nov 2026): Sinaps > Hafalan, bagian 2c-2: PEMASANGAN kartu "Deck Doa & dzikir" di bawah kartu "Ulasan hari ini" + QACT.hfdAdd (tombol Tambahkan per kategori). Pagar: hanya bila tab Hafalan terbuka, jadwal siap, bukan catatan versi lebih baru; penjaga ketuk ganda (HFDSV.busy diatur sinkron sebelum menunggu apa pun); tulis lewat hfsPut HANYA kartu dengan id baru (hfdAksi), tidak pernah menimpa kemajuan; sukses = pesan "ditambahkan" + kartu ulasan ikut menyala; gagal = pesan jujur, ketuk lagi = coba lagi. Logika murni = OTH-2c-1 (hfdAksi, hfdHtml). Membalik: hapus blok ini dan CSS OTH-2c2, kembalikan satu kalimat lama bertanda OTH-2c2. ===== */
const HFDSV = { sv: null, busy: false };   // sv = { st: menyimpan | ok | gagal, nama, n, terpotong, kode }; busy = sedang menulis satu kategori
function hfdFokusKe(fk) {   // fk = nilai data-fk tombol, atau '#hfdBody'; tombol yang sudah tidak ada = fokus ke kartu
  const root = $('#nwSinapsBody'); if (!root) return;
  const el = (fk !== '#hfdBody' ? [...root.querySelectorAll('[data-fk]')].find(x => x.dataset.fk === fk) : null) || root.querySelector('#hfdBody'); if (!el) return;
  if (el.id === 'hfdBody') el.setAttribute('tabindex', '-1');
  try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
}
function hfdDraw() { if (hfvOn()) nwRender('sinaps'); }
function hfdMount() {   // pasang kartu deck tepat sesudah kartu ulasan (#hfvWrap); -> elemen kartu, atau null; tidak pernah menggandakan, tidak melempar
  try {
    const root = $('#nwSinapsBody'), w = root && root.querySelector('#hfvWrap'); if (!w) return null;
    root.querySelectorAll('#hfdBody').forEach(x => x.remove());
    w.insertAdjacentHTML('afterend', hfdHtml(hfdRingkas(hfdDeck(), HFS.data.kartu), hfsState(), { sv: HFDSV.sv }));
    return root.querySelector('#hfdBody');
  } catch (e) { return null; }
}
QACT.hfdAdd = el => {
  if (!hfvOn() || HFDSV.busy || HFVSV.busy) return;   // bukan tab Hafalan, atau penulisan lain masih berjalan (ketuk ganda)
  const kat = el && el.dataset && typeof el.dataset.kat === 'string' ? el.dataset.kat : null, st = hfsState();
  if (kat === null || !st.ready || st.blocked) { hfdDraw(); return; }   // tombol basi, jadwal belum siap, atau catatan versi lebih baru: tidak menulis; gambar ulang yang benar, diam
  const r = hfdAksi(hfdDeck(), HFS.data.kartu, today(), kat, HFS_CAP);
  if (!r.ok) { HFDSV.sv = { st: 'gagal', nama: r.nama, n: 0, terpotong: r.terpotong, kode: r.kode }; hfdDraw(); hfdFokusKe('hfd-add-' + kat); return; }
  HFDSV.busy = true;
  const v = { st: 'menyimpan', nama: r.nama, n: r.jumlah, terpotong: r.terpotong, kode: '' }; HFDSV.sv = v; hfdDraw(); hfdFokusKe('#hfdBody');   // menyimpan = semua tombol Tambahkan mati; fokus ke kartu supaya tidak hilang
  let p; try { p = hfsPut(r.kartu.slice(), Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(x => x, () => null).then(x => {
    HFDSV.busy = false;
    if (x && x.ok) v.st = 'ok'; else { v.st = 'gagal'; v.kode = x && typeof x.kode === 'string' && x.kode ? x.kode : 'galat'; }
    if (HFDSV.sv !== v) return;
    if (!hfvOn()) { HFDSV.sv = null; return; }   // pindah tab selama menulis: status basi dibuang
    nwRender('sinaps'); hfdFokusKe(v.st === 'ok' ? '#hfdBody' : 'hfd-add-' + kat);
  });
};
{ const baseGradeOth2c = QACT.hfGrade; QACT.hfGrade = function () { if (HFDSV.busy) return; if (HFDSV.sv && HFDSV.sv.st !== 'menyimpan') HFDSV.sv = null; return baseGradeOth2c.apply(this, arguments); }; }   // menilai kartu = pesan tambah sudah terbaca; saat menambah, nilai ditahan sebentar
{ const baseNwOth2c = nwRender; nwRender = function (key) {
  const root = key === 'sinaps' ? $('#nwSinapsBody') : null, ae = document.activeElement;
  const fk = root && ae && root.contains(ae) ? (ae.dataset && typeof ae.dataset.fk === 'string' && ae.dataset.fk.indexOf('hfd-') === 0 ? ae.dataset.fk : (ae.id === 'hfdBody' ? '#hfdBody' : null)) : null;   // fokus dipulihkan sesudah kartu diganti
  if (key === 'sinaps' && nwTab.sinaps !== 'hafalan' && !HFDSV.busy) HFDSV.sv = null;   // keluar dari tab Hafalan = pesan dibuang
  baseNwOth2c.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps === 'hafalan') { hfdMount(); if (fk) hfdFokusKe(fk); }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth2c2: Object.freeze({ add: QACT.hfdAdd, mount: hfdMount, sv: () => HFDSV.sv ? Object.freeze(Object.assign({}, HFDSV.sv)) : null, busy: () => HFDSV.busy }) }));
/* ===== OTH-2c2-end ===== */
/* ===== OTH-3a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3a: LOGIKA MURNI deck BUATAN SENDIRI (kartu depan/belakang yang diketik pemilik): batas isi, pemeriksa masukan, pembuat id, pembersih data tersimpan, penggabung deck. Hanya hitung: TIDAK menulis, TIDAK menyimpan, belum ada tampilan, belum terdaftar ke tab (3b). Membalik: hapus blok ini. */
const HFU = Object.freeze({ awal: 'us.', kat: 'us', namaKat: 'Buatan sendiri', depanMax: 300, belakangMax: 2000, cap: 500 });
const hfuTeks = v => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim() : '');
function hfuCek(masuk) {   // MURNI: masukan formulir -> { ok:true, depan, belakang } atau { ok:false, kode } (kode: bukan_objek, depan_kosong, belakang_kosong, depan_panjang, belakang_panjang); tidak melempar
  if (!masuk || typeof masuk !== 'object') return Object.freeze({ ok: false, kode: 'bukan_objek' });
  const d = hfuTeks(masuk.depan), b = hfuTeks(masuk.belakang);
  if (!d) return Object.freeze({ ok: false, kode: 'depan_kosong' });
  if (!b) return Object.freeze({ ok: false, kode: 'belakang_kosong' });
  if (d.length > HFU.depanMax) return Object.freeze({ ok: false, kode: 'depan_panjang' });
  if (b.length > HFU.belakangMax) return Object.freeze({ ok: false, kode: 'belakang_panjang' });
  return Object.freeze({ ok: true, depan: d, belakang: b });
}
function hfuId(ada, benih) {   // MURNI: id kartu baru 'us.<base36 benih>[-n]' yang belum ada di himpunan/daftar id `ada`; benih = bilangan bulat >= 0 dari pemanggil (waktu); selain itu null
  if (!Number.isSafeInteger(benih) || benih < 0) return null;
  const s = ada instanceof Set ? ada : new Set(Array.isArray(ada) ? ada : []), dasar = HFU.awal + benih.toString(36);
  for (let n = 0; n < 1000; n++) { const id = n ? dasar + '-' + n : dasar; if (!s.has(id) && hfIdOk(id)) return id; }
  return null;
}
function hfuBersih(c) {   // MURNI: catatan tersimpan (tidak dipercaya) -> kartu beku { id, depan, belakang, dibuat } atau null
  if (!c || typeof c !== 'object' || typeof c.id !== 'string' || c.id.indexOf(HFU.awal) !== 0 || c.id.length <= HFU.awal.length || !hfIdOk(c.id)) return null;   // akhiran kosong ('us.') tak sah
  const k = hfuCek(c); if (!k.ok) return null;
  const dibuat = Number.isSafeInteger(c.dibuat) && c.dibuat >= 0 ? c.dibuat : 0, o = { id: c.id, depan: k.depan, belakang: k.belakang, dibuat };   // OTH-3c1c: `diubah` (waktu ubah terakhir) HANYA ada bila sah, bilangan bulat, lebih besar dari dibuat, dan <= tahun 2100; kartu yang belum pernah diubah = bentuk lama persis
  if (Number.isSafeInteger(c.diubah) && c.diubah > dibuat && c.diubah <= 4102444800000) o.diubah = c.diubah;
  return Object.freeze(o);
}
function hfuDaftar(arr) {   // MURNI: daftar tersimpan -> { kartu (urut asli, id kembar: yang pertama menang, maks HFU.cap), buang }
  const src = Array.isArray(arr) ? arr : [], seen = new Set(), kartu = [];
  src.forEach(c => { const k = hfuBersih(c); if (k && !seen.has(k.id) && kartu.length < HFU.cap) { seen.add(k.id); kartu.push(k); } });
  return Object.freeze({ kartu: Object.freeze(kartu), buang: src.length - kartu.length });
}
function hfuBuat(masuk, daftar, benih) {   // MURNI: -> { ok:true, kartu, daftar:[...baru] } atau { ok:false, kode } (kode dari hfuCek, atau penuh, id_gagal, kembar); daftar lama TIDAK diubah; kembar = depan sama persis dengan kartu lain
  const k = hfuCek(masuk); if (!k.ok) return k;
  const L = hfuDaftar(daftar).kartu; if (L.length >= HFU.cap) return Object.freeze({ ok: false, kode: 'penuh' });
  if (L.some(x => x.depan === k.depan)) return Object.freeze({ ok: false, kode: 'kembar' });
  const id = hfuId(L.map(x => x.id), benih); if (!id) return Object.freeze({ ok: false, kode: 'id_gagal' });
  const kartu = Object.freeze({ id, depan: k.depan, belakang: k.belakang, dibuat: benih });
  return Object.freeze({ ok: true, kartu, daftar: Object.freeze(L.concat([kartu])) });
}
function hfuUbah(id, masuk, daftar, now) {   // MURNI: ubah isi satu kartu (id dan dibuat tetap) -> { ok:true, kartu, daftar } atau { ok:false, kode } (kode: hfuCek, tidak_ada, kembar, waktu); OTH-3c1c: `now` (opsional) = waktu ubah, lihat `diubah` di bawah
  const k = hfuCek(masuk); if (!k.ok) return k;
  const L = hfuDaftar(daftar).kartu, i = L.findIndex(x => x.id === id); if (i < 0) return Object.freeze({ ok: false, kode: 'tidak_ada' });
  if (L.some((x, j) => j !== i && x.depan === k.depan)) return Object.freeze({ ok: false, kode: 'kembar' });
  const lama = L[i], o = { id: lama.id, depan: k.depan, belakang: k.belakang, dibuat: lama.dibuat }, ef = lama.diubah > lama.dibuat ? lama.diubah : lama.dibuat;   // OTH-3c1c: waktu sah (bilangan bulat 0..tahun 2100) DAN isi benar-benar berubah = diubah naik ke max(waktu, diubah lama + 1) (selalu LEBIH BESAR dari sebelumnya walau jam perangkat mundur); isi sama atau tanpa waktu = diubah lama dipertahankan (tidak ada ubahan semu yang menang konflik)
  if (Number.isSafeInteger(now) && now >= 0 && now <= 4102444800000 && (k.depan !== lama.depan || k.belakang !== lama.belakang)) { const d = Math.max(now, ef + 1); if (d > 4102444800000) return Object.freeze({ ok: false, kode: 'waktu' }); o.diubah = d; } else if (lama.diubah > lama.dibuat) o.diubah = lama.diubah;
  const kartu = Object.freeze(o), baru = L.slice(); baru[i] = kartu;
  return Object.freeze({ ok: true, kartu, daftar: Object.freeze(baru) });
}
function hfuHapus(id, daftar) {   // MURNI: buang satu kartu dari daftar -> { ok:true, daftar, kartu } atau { ok:false, kode:'tidak_ada' }; catatan jadwalnya ditangani tahap hapus (3d)
  const L = hfuDaftar(daftar).kartu, i = L.findIndex(x => x.id === id); if (i < 0) return Object.freeze({ ok: false, kode: 'tidak_ada' });
  return Object.freeze({ ok: true, kartu: L[i], daftar: Object.freeze(L.filter((x, j) => j !== i)) });
}
function hfuDeck(daftar) {   // MURNI: daftar tersimpan -> deck berbentuk SAMA dengan hfdBangun ({ kartu:[{id,did,kat,depan,belakang}], kat, buang }); satu kategori 'us' bila ada kartu; cocok dengan hfdIsiDari, hfdRingkas, hfdBaruDari
  const d = hfuDaftar(daftar), kartu = d.kartu.map(c => Object.freeze({ id: c.id, did: c.id, kat: HFU.kat, depan: c.depan, belakang: c.belakang }));
  return Object.freeze({ kartu: Object.freeze(kartu), kat: Object.freeze(kartu.length ? [Object.freeze({ id: HFU.kat, nama: HFU.namaKat })] : []), buang: d.buang });
}
function hfuGabung(a, b) {   // MURNI: dua deck -> satu deck (kartu a lalu b; id kembar: yang pertama menang; kategori digabung tanpa kembar); deck tak sah dianggap kosong
  const K = d => (d && Array.isArray(d.kartu) ? d.kartu : []), C = d => (d && Array.isArray(d.kat) ? d.kat : []), seen = new Set(), kartu = [];
  K(a).concat(K(b)).forEach(k => { if (k && typeof k.id === 'string' && !seen.has(k.id)) { seen.add(k.id); kartu.push(k); } });
  const kk = new Set(), kat = []; C(a).concat(C(b)).forEach(c => { if (c && typeof c.id === 'string' && !kk.has(c.id)) { kk.add(c.id); kat.push(c); } });
  return Object.freeze({ kartu: Object.freeze(kartu), kat: Object.freeze(kat), buang: (a && a.buang | 0) + (b && b.buang | 0) });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3a: Object.freeze({ batas: HFU, cek: hfuCek, id: hfuId, bersih: hfuBersih, daftar: hfuDaftar, buat: hfuBuat, ubah: hfuUbah, hapus: hfuHapus, deck: hfuDeck, gabung: hfuGabung }) }));
/* ===== OTH-3a-end ===== */
/* ===== OTH-3b1-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3b-1: TEMPAT SIMPAN `dailylog:hafalan-buatan:v1` (isi kartu buatan sendiri, OTH-3a) lewat antrean simpan yang ada (pola OTH-1b). Catatan `versi_baru` = TIDAK menimpa. Ikut "Hapus semua data". BELUM ikut ekspor/impor JSON (3b-2), BELUM didaftarkan ke tab (3b-3), BELUM ada formulir (3c). Hapus kartu di sini TIDAK menyentuh catatan jadwal `dailylog:hafalan:v1` (3d). Membalik: hapus blok ini. ===== */
const HFB_KEY = 'dailylog:hafalan-buatan:v1', HFB_V = 1, HFB_WAIT = 4000, HFB_UMAX = 4102444800000;
function hfbClean(raw) {   // MURNI: masukan apa pun -> { data:{v,kartu,u}, buang, catatan } beku; tidak melempar, tidak mengubah masukan
  const o = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : null, catatan = [];
  if (raw !== null && raw !== undefined && !o) catatan.push('bukan_objek');
  if (o && typeof o.v === 'number' && o.v > HFB_V) catatan.push('versi_baru');
  const d = hfuDaftar(o && Array.isArray(o.kartu) ? o.kartu : []), u = o && typeof o.u === 'number' && isFinite(o.u) && o.u >= 0 && o.u <= HFB_UMAX ? o.u : 0;
  return Object.freeze({ data: Object.freeze({ v: HFB_V, kartu: d.kartu, u }), buang: d.buang, catatan: Object.freeze(catatan) });
}
const HFB = { ready: false, loading: false, p: null, gen: 0, blocked: false, catatan: [], data: hfbClean(null).data };   // gen naik tiap "Hapus semua data": hasil muat yang datang terlambat dibuang
STORES.hafalanBuatan = { key: HFB_KEY, get: () => HFB.data }; dirty.hafalanBuatan = false;   // khusus perangkat sampai 3b-2 (ekspor/impor)
function hfbLoad0() {
  const g = HFB.gen; HFB.loading = true;
  const lama = new Promise(r => setTimeout(() => r(undefined), HFB_WAIT));
  return Promise.race([store.load(HFB_KEY), lama]).then(raw => {
    if (g !== HFB.gen) return;
    if (raw === undefined) { HFB.p = null; return; }   // waktu habis: BELUM siap (bukan dianggap kosong, supaya data tersimpan tidak tertimpa)
    const r = hfbClean(raw); HFB.data = r.data; HFB.catatan = r.catatan.slice(); HFB.blocked = r.catatan.indexOf('versi_baru') >= 0; HFB.ready = true;
  }).catch(() => { if (g === HFB.gen) HFB.p = null; }).then(() => { if (g === HFB.gen) HFB.loading = false; });
}
function hfbLoad() { if (!HFB.p) HFB.p = hfbLoad0(); return HFB.p; }
async function hfbJalan(fn, now) {   // satu pintu tulis: muat dulu, jaga belum_siap/versi_baru/waktu, jalankan fn(daftar, waktu) -> hasil hfu*; tulis HANYA bila ok
  await hfbLoad();
  const fail = kode => Object.freeze({ ok: false, kode });
  if (!HFB.ready) return fail('belum_siap');
  if (HFB.blocked) return fail('versi_baru');
  const w = now === undefined ? Date.now() : now;
  if (!(Number.isSafeInteger(w) && w >= 0 && w <= HFB_UMAX)) return fail('waktu');
  const r = fn(HFB.data.kartu, w); if (!r.ok) return r;
  HFB.data = Object.freeze({ v: HFB_V, kartu: r.daftar, u: Math.max(w, HFB.data.u + 1) }); dirty.hafalanBuatan = true; queueSave('hafalanBuatan');
  return r;
}
const hfbTambah = (masuk, now) => hfbJalan((L, w) => hfuBuat(masuk, L, w), now);   // -> { ok, kartu, daftar } | { ok:false, kode } (kode hfuCek, penuh, kembar, id_gagal, belum_siap, versi_baru, waktu)
const hfbUbah = (id, masuk, now) => hfbJalan((L, w) => hfuUbah(id, masuk, L, w), now);   // OTH-3c1c: waktu sah dari hfbJalan ikut ke hfuUbah (kolom diubah)
const hfbHapus = (id, now) => hfbJalan(L => hfuHapus(id, L), now);
function hfbState() { return Object.freeze({ ready: HFB.ready, loading: HFB.loading, blocked: HFB.blocked, dirty: dirty.hafalanBuatan, catatan: HFB.catatan.slice(), total: HFB.data.kartu.length, u: HFB.data.u }); }
function hfbWipe() { HFB.gen++; HFB.data = hfbClean(null).data; HFB.blocked = false; HFB.catatan = []; HFB.ready = true; HFB.loading = false; HFB.p = Promise.resolve(); }   // dipanggil "Hapus semua data": sesudahnya flush menulis daftar kosong
{ const baseHfbWipe = odWipe; odWipe = function () { hfbWipe(); return baseHfbWipe.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3b1: Object.freeze({ key: HFB_KEY, clean: hfbClean, load: hfbLoad, get: () => HFB.data, tambah: hfbTambah, ubah: hfbUbah, hapus: hfbHapus, state: hfbState }) }));
