/* ===== OTH-5c2d2a-end ===== */
/* ===== OTH-5c2d2b-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2b: PROGRES HAFAL di tiap baris DAFTAR surah Ruang hafal ("3 dari 7 ayat · 43%" + bilah 4 px di bawah "arti · N ayat"). HANYA surah yang sudah ada ayat hafalnya (kosong = tanpa baris tambahan, supaya daftar 38 sampai 114 surah tidak jadi papan dasbor); belum siap atau versi lebih baru = tanpa baris (tidak menulis "Memuat" di puluhan baris). Memakai fungsi murni 5c-2a (`hfhProgres`, `hfhLabel`), keadaan 5c-2b (`HFN`), dan aturan teks 5c-2d-2a (`hfrProgTeks`). Pembungkus `hfrItems` (render awal, hasil cari, kembali dari surah) + `hfrListApply()` yang memperbarui di TEMPAT sesudah catatan selesai dimuat. Hanya membaca: tanpa penyimpanan baru. Membalik: hapus blok ini dan CSS OTH-5c2d2b. ===== */
function hfrLpTeks(pr, siap, blok) {   // MURNI: progres satu surah + keadaan catatan -> { m, teks, persen }; m = jalan | penuh, selain itu '' (kosong, belum siap, versi baru, tak sah = tanpa baris)
  const x = hfrProgTeks(pr, siap, blok);
  return x.m === 'jalan' || x.m === 'penuh' ? x : { m: '', teks: '', persen: 0 };
}
function hfrLpIsi(x) {   // MURNI: { m, teks, persen } -> baris progres daftar (teks polos + bilah dekoratif); m kosong = ''
  if (!x || !x.m) return '';
  return '<span class="hfr-lp" data-m="' + x.m + '"><span class="hfr-lp-t">' + esc(x.teks) + '</span><span class="hfr-lp-b" aria-hidden="true"><span class="hfr-lp-f" style="width:' + x.persen + '%"></span></span></span>';
}
function hfrLpKini(n) { return hfrLpTeks(hfhProgres(HFN.ready ? HFN.data.hafal : null, n), HFN.ready, HFN.blocked); }
{ const b = hfrItems; hfrItems = function () {   // baris progres dipasang di akhir `.hfr-nm` tiap baris (sebelum nama Arab); fungsi asli (DL.oth5a.items) tetap murni
  const x = b.apply(this, arguments); if (!HFN.ready || HFN.blocked) return x;
  return x.replace(/<button class="hfr-row"[^>]*data-n="(\d+)"[\s\S]*?<\/span><span class="hfr-ar"/g, (m, n) => { const p = hfrLpIsi(hfrLpKini(Number(n))); return p ? m.replace(/<\/span><span class="hfr-ar"$/, () => p + '</span><span class="hfr-ar"') : m; });
}; }
function hfrListApply() {   // perbarui baris progres daftar di tempat (elemen daftar dan fokus tetap); tanpa daftar (surah terbuka) = diam
  const ul = $('#hfrList'); if (!ul || HFR.n) return;
  ul.querySelectorAll('button.hfr-row[data-n]').forEach(bt => {
    const nm = bt.querySelector('.hfr-nm'); if (!nm) return;
    const x = hfrLpKini(Number(bt.dataset.n)), cur = nm.querySelector('.hfr-lp');
    if (!x.m) { if (cur) cur.remove(); return; }
    if (!cur) { nm.insertAdjacentHTML('beforeend', hfrLpIsi(x)); return; }
    cur.setAttribute('data-m', x.m);
    const t = cur.querySelector('.hfr-lp-t'), f = cur.querySelector('.hfr-lp-f');
    if (t && t.textContent !== x.teks) t.textContent = x.teks;
    if (f) f.style.width = x.persen + '%';
  });
}
function hfrListMuat() { if (HFR.n || HFN.ready || !$('#hfrList')) return; hfnLoad().then(hfrListApply); }   // daftar tampil tapi catatan belum siap: muat lalu pasang baris (gagal atau waktu habis = tetap tanpa baris, tanpa pesan)
{ const b = hfrMount; hfrMount = function () { const r = b.apply(this, arguments); hfrListMuat(); return r; }; }
{ const b = hfrDraw; hfrDraw = function () { b.apply(this, arguments); hfrListMuat(); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2b: Object.freeze({ teks: hfrLpTeks, isi: hfrLpIsi, kini: hfrLpKini, items: hfrItems, apply: hfrListApply, muat: hfrListMuat }) }));
/* ===== OTH-5c2d2b-end ===== */
/* ===== OTH-5c2d2c1-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2c-1: tombol "Tandai semua" dan "Kosongkan" di judul surah Ruang hafal, KEDUANYA lewat lembar konfirmasi (openSheet; tindakan menyentuh puluhan sampai ratusan ayat dan hanya bisa dibalik dengan tangan). Memakai `hfnSemua` / `hfnKosong` (5c-2b: satu pintu tulis, antrean simpan yang ada; menulis HANYA bila ada yang berubah). Tombol mati (`aria-disabled`) bila catatan belum siap, versi baru, atau tidak ada yang bisa diubah (penuh = Tandai semua mati; belum ada = Kosongkan mati); mengetuk tombol mati = toast alasan, tidak ada lembar. Setelah konfirmasi: keadaan dibaca ulang (surah harus sama), hasil lewat `hfrHfApply` (ayat, progres, tombol ikut tanpa gambar ulang). Tidak ada penyimpanan baru. Belum ada rentang hafal (5c-2d-2c-2). Membalik: hapus blok ini dan blok CSS-nya. ===== */
function hfrBkKeadaan(pr, siap, blok) {   // MURNI: progres + keadaan catatan -> { semua:{mati,kode}, kosong:{mati,kode} } beku; progres tak sah = null; kode '' bila aktif
  if (!pr || typeof pr !== 'object' || !Number.isInteger(pr.hafal) || !Number.isInteger(pr.total) || pr.total < 1 || pr.hafal < 0 || pr.hafal > pr.total) return null;
  const k = (m, c) => Object.freeze({ mati: m, kode: c });
  if (!siap) return Object.freeze({ semua: k(true, 'belum_siap'), kosong: k(true, 'belum_siap') });
  if (blok) return Object.freeze({ semua: k(true, 'versi_baru'), kosong: k(true, 'versi_baru') });
  return Object.freeze({ semua: pr.hafal >= pr.total ? k(true, 'sudah_semua') : k(false, ''), kosong: pr.hafal <= 0 ? k(true, 'belum_ada') : k(false, '') });
}
function hfrBkPesan(kode) {   // MURNI: kode -> kalimat toast
  if (kode === 'sudah_semua') return 'Semua ayat surah ini sudah ditandai hafal.';
  if (kode === 'belum_ada') return 'Belum ada ayat yang ditandai hafal.';
  return hfrHfPesan(kode);
}
function hfrBkKonfirm(jenis, nama, pr) {   // MURNI: jenis semua | kosong + nama surah + progres -> { title, note, label, danger } atau null
  if (!pr || !Number.isInteger(pr.hafal) || !Number.isInteger(pr.total) || pr.total < 1) return null;
  const s = String(nama || '').trim() || 'ini';
  if (jenis === 'semua') return Object.freeze({ title: 'Tandai semua ayat hafal?', note: 'Semua ' + pr.total + ' ayat surah ' + s + ' akan ditandai hafal' + (pr.hafal > 0 ? ' (' + pr.hafal + ' ayat sudah ditandai sebelumnya).' : '.') + ' Tanda bisa dilepas lagi satu per satu atau lewat Kosongkan.', label: 'Tandai semua', danger: false });
  if (jenis === 'kosong') return Object.freeze({ title: 'Kosongkan tanda hafal?', note: pr.hafal + ' tanda hafal di surah ' + s + ' akan dihapus. Ayatnya sendiri tidak terhapus dan bisa ditandai lagi.', label: 'Kosongkan', danger: true });
  return null;
}
function hfrBkHtml(pr, siap, blok) {   // MURNI: baris dua tombol; progres tak sah = teks kosong
  const x = hfrBkKeadaan(pr, siap, blok); if (!x) return '';
  const t = (q, lb, s) => '<button class="btn sm' + (s.mati ? ' mati' : '') + '" type="button" data-q="' + q + '" data-fk="hfr-mb-' + (q === 'hfrBkSemua' ? 'semua' : 'kosong') + '"' + (s.mati ? ' aria-disabled="true"' : '') + '>' + lb + '</button>';
  return '<div class="hfr-mb" id="hfrMb" role="group" aria-label="Tanda hafal seluruh surah">' + t('hfrBkSemua', 'Tandai semua', x.semua) + t('hfrBkKosong', 'Kosongkan', x.kosong) + '</div>';
}
function hfrBkKini() { return HFR.n ? hfhProgres(HFN.ready ? HFN.data.hafal : null, HFR.n) : null; }
{ const b = hfrHtml; hfrHtml = function () {   // dua tombol tepat sesudah baris progres di judul surah (hanya saat ayat tampil)
  const x = b.apply(this, arguments); if (!(HFR.n && HFR.st === 'ok' && HFR.s)) return x;
  const h = hfrBkHtml(hfrBkKini(), HFN.ready, HFN.blocked); if (!h) return x;
  return x.replace(/(<div class="hfr-prog"[^>]*>[\s\S]*?<\/div>)(<\/div>)/, (m, a, c) => a + h + c);
}; }
function hfrBkApply() {   // perbarui keadaan tombol di tempat (elemen dan fokus tetap)
  const r = $('#hfrMb'); if (!r || !HFR.n) return;
  const x = hfrBkKeadaan(hfrBkKini(), HFN.ready, HFN.blocked); if (!x) { r.remove(); return; }
  [['hfrBkSemua', x.semua], ['hfrBkKosong', x.kosong]].forEach(([q, s]) => { const k = r.querySelector('[data-q="' + q + '"]'); if (!k) return; k.classList.toggle('mati', s.mati); if (s.mati) k.setAttribute('aria-disabled', 'true'); else k.removeAttribute('aria-disabled'); });
}
{ const b = hfrHfApply; hfrHfApply = function () { const v = b.apply(this, arguments); hfrBkApply(); return v; }; }
function hfrBkJalan(jenis, n) {   // jalankan sesudah konfirmasi; surah harus masih yang sama
  if (HFR.n !== n || HFR.st !== 'ok') { closeSheet(); return Promise.resolve(); }
  closeSheet();
  return (jenis === 'semua' ? hfnSemua(n) : hfnKosong(n)).then(r => {
    if (!r || !r.ok) toast(hfrHfPesan(r && r.kode));
    else if (!r.ubah) toast(hfrBkPesan(jenis === 'semua' ? 'sudah_semua' : 'belum_ada'));
    else { const p = hfhProgres(HFN.data.hafal, n); toast(jenis === 'semua' ? 'Semua ' + p.total + ' ayat ditandai hafal' : 'Tanda hafal surah ini dikosongkan'); }
    hfrHfApply();
  }, () => { toast(hfrHfPesan('')); hfrHfApply(); });
}
function hfrBkBuka(jenis, el) {
  if (!hfvOn() || HFR.st !== 'ok' || !HFR.s || !HFR.n) return;
  if (!HFN.ready) { toast(hfrHfPesan('belum_siap')); hfnLoad().then(hfrHfApply); return; }
  const x = hfrBkKeadaan(hfrBkKini(), HFN.ready, HFN.blocked); if (!x) return;
  const s = jenis === 'semua' ? x.semua : x.kosong; if (s.mati) { toast(hfrBkPesan(s.kode)); return; }
  const n = HFR.n, kf = hfrBkKonfirm(jenis, HFR.s.latin || HFR.s.nama || '', hfrBkKini()); if (!kf) return;
  openSheet({ title: kf.title, note: kf.note, actions: [closeBtn, { label: kf.label, primary: !kf.danger, danger: kf.danger, fn: () => hfrBkJalan(jenis, n) }] });
}
QACT.hfrBkSemua = el => hfrBkBuka('semua', el);
QACT.hfrBkKosong = el => hfrBkBuka('kosong', el);
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2c1: Object.freeze({ keadaan: hfrBkKeadaan, pesan: hfrBkPesan, konfirm: hfrBkKonfirm, html: hfrBkHtml, apply: hfrBkApply, kini: hfrBkKini }) }));
/* ===== OTH-5c2d2c1-end ===== */
/* ===== OTH-5c2d2c2a-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2c-2a: LOGIKA MURNI rentang hafal. `hfhParse(teks, n)` MEMBACA teks rentang seperti "1-5, 7, 9-11" menjadi daftar ayat sah surah n (kebalikan dari `hfhRentang` yang hanya memformat); `hfhTerap(data, n, ayat, nilai)` menandai (true) atau melepas (false) BANYAK ayat sekaligus dalam satu hasil; `hfhTerapTeks` = keduanya; `hfhPesanRentang(kode, detail)` = kode galat -> kalimat. Hanya hitung: TIDAK menulis, TIDAK menyimpan, belum ada isian, tombol, atau tampilan (2c-2b tampilan teks rentang, 2c-2c isian dan penulisan lewat satu pintu `hfn*`). Pemisah bagian: koma, titik koma, koma Arab, baris baru; tanda rentang: strip, tanda pisah (en dash), tanda pisah panjang, tanda minus; angka Latin, Arab-Indik, dan Persia diterima; bagian kosong (mis. koma di ujung) dilewati. Galat dilaporkan menurut bagian PERTAMA yang salah (kiri ke kanan). Batas teks (1000 huruf, 150 bagian) dipilih supaya SEMUA keadaan yang bisa ditampilkan `hfhRentang` bisa dibaca balik (kasus terburuk: surah 2 dengan ayat selang-seling = 143 bagian, sekitar 715 huruf). Membalik: hapus blok ini. ===== */
const HFRT = Object.freeze({ maxPanjang: 1000, maxBagian: 150, maxAngka: 6 });
function hfrtAngka(s) {   // MURNI: angka Arab-Indik (U+0660..0669) dan Persia (U+06F0..06F9) -> angka Latin; tanda pisah dan minus -> strip; pemisah Arab -> pemisah biasa
  return s.replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/[\u06F0-\u06F9]/g, c => String(c.charCodeAt(0) - 0x6F0))
    .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[\u060C\u061B;\r\n]/g, ',');
}
function hfhParse(teks, n) {   // MURNI: teks rentang + nomor surah -> { ok:true, ayat:[naik, tanpa ganda] (beku), bagian, total } atau { ok:false, kode, detail? } (beku); tidak melempar; kode: surah_tak_sah | kosong | terlalu_panjang | terlalu_banyak | format_salah | ayat_di_luar | rentang_terbalik
  const g = (kode, detail) => Object.freeze(detail === undefined ? { ok: false, kode } : { ok: false, kode, detail });
  const k = hfzNo(n); if (!k) return g('surah_tak_sah');
  if (typeof teks !== 'string') return g('kosong');
  if (teks.length > HFRT.maxPanjang) return g('terlalu_panjang');
  const total = QR_SURAH[k - 1][2], bag = hfrtAngka(teks).split(',').map(x => x.trim()).filter(x => x.length);
  if (!bag.length) return g('kosong');
  if (bag.length > HFRT.maxBagian) return g('terlalu_banyak', bag.length);
  const re1 = new RegExp('^([0-9]{1,' + HFRT.maxAngka + '})$'), re2 = new RegExp('^([0-9]{1,' + HFRT.maxAngka + '})\\s*-\\s*([0-9]{1,' + HFRT.maxAngka + '})$'), pot = x => x.length > 12 ? x.slice(0, 12) + '…' : x, s = new Set();
  for (const b of bag) {
    const m1 = re1.exec(b), m2 = m1 ? null : re2.exec(b); if (!m1 && !m2) return g('format_salah', pot(b));
    const x = Number(m1 ? m1[1] : m2[1]), y = Number(m1 ? m1[1] : m2[2]);
    if (x > y) return g('rentang_terbalik', pot(b));
    if (x < 1 || y > total) return g('ayat_di_luar', pot(b));
    for (let a = x; a <= y; a++) s.add(a);
  }
  return Object.freeze({ ok: true, ayat: Object.freeze([...s].sort((p, q) => p - q)), bagian: bag.length, total });
}
function hfhTerap(data, n, ayat, nilai) {   // MURNI: tandai (nilai true) atau lepas (false) BANYAK ayat surah n -> { ok:true, ubah, jumlah (ayat yang benar-benar berubah), data } atau { ok:false, kode: surah_tak_sah | nilai_tak_sah | kosong | ayat_tak_sah }; ubah=false dan jumlah=0 bila tidak ada yang berubah; data selalu versi bersih; satu ayat tak sah di daftar = seluruh daftar ditolak
  const k = hfzNo(n); if (!k) return Object.freeze({ ok: false, kode: 'surah_tak_sah' });
  if (nilai !== true && nilai !== false) return Object.freeze({ ok: false, kode: 'nilai_tak_sah' });
  if (!Array.isArray(ayat) || !ayat.length) return Object.freeze({ ok: false, kode: 'kosong' });
  const v = []; for (const a of ayat) { const x = typeof a === 'number' ? hfhAyat(k, a) : 0; if (!x) return Object.freeze({ ok: false, kode: 'ayat_tak_sah' }); v.push(x); }
  const d = hfhBersih(data), cur = d[String(k)] || [], s = new Set(cur); let jumlah = 0;
  v.forEach(x => { if (nilai ? !s.has(x) : s.has(x)) { jumlah++; if (nilai) s.add(x); else s.delete(x); } });
  if (!jumlah) return Object.freeze({ ok: true, ubah: false, jumlah: 0, data: d });
  const o = Object.assign({}, d), nx = [...s].sort((p, q) => p - q); if (nx.length) o[String(k)] = Object.freeze(nx); else delete o[String(k)];
  return Object.freeze({ ok: true, ubah: true, jumlah, data: Object.freeze(o) });
}
function hfhTerapTeks(data, n, teks, nilai) {   // MURNI: baca teks rentang lalu terapkan -> { ok:true, ubah, jumlah, data, ayat (daftar yang ditulis) } atau galat dari hfhParse / hfhTerap
  const p = hfhParse(teks, n); if (!p.ok) return p;
  const r = hfhTerap(data, n, p.ayat, nilai); return r.ok ? Object.freeze(Object.assign({}, r, { ayat: p.ayat })) : r;
}
function hfhPesanRentang(kode, detail) {   // MURNI: kode galat (dan detail dari hfhParse) -> kalimat untuk toast atau teks bantu; kode tak dikenal = kalimat umum
  const d = detail === undefined || detail === null ? '' : String(detail);
  if (kode === 'kosong') return 'Tulis rentang ayat dulu, misalnya 1-5, 7, 9-11.';
  if (kode === 'format_salah') return 'Format belum dikenal' + (d ? ': "' + d + '"' : '') + '. Pakai angka, tanda hubung, dan koma, misalnya 1-5, 7, 9-11.';
  if (kode === 'ayat_di_luar') return 'Ayat ' + (d ? '"' + d + '" ' : '') + 'di luar surah ini. Cek jumlah ayat surah lalu tulis ulang.';
  if (kode === 'rentang_terbalik') return 'Rentang ' + (d ? '"' + d + '" ' : '') + 'terbalik: tulis angka yang kecil dulu.';
  if (kode === 'terlalu_panjang') return 'Teks terlalu panjang (maksimal ' + HFRT.maxPanjang + ' huruf).';
  if (kode === 'terlalu_banyak') return 'Terlalu banyak bagian (maksimal ' + HFRT.maxBagian + ' dipisah koma).';
  if (kode === 'surah_tak_sah') return 'Surah tidak dikenal.';
  return 'Rentang tidak bisa dibaca. Tulis seperti 1-5, 7, 9-11.';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2c2a: Object.freeze({ parse: hfhParse, terap: hfhTerap, terapTeks: hfhTerapTeks, pesan: hfhPesanRentang, batas: HFRT }) }));
/* ===== OTH-5c2d2c2a-end ===== */
/* ===== OTH-5c2d2c2b-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2c-2b: TEKS RENTANG HAFAL di judul surah Ruang hafal ("Hafal: 1–5, 7, 9–11"), HANYA BACA. Memakai `hfhRentang` (5c-2a) dan keadaan `HFN` (5c-2b). Dipasang tepat sesudah baris progres (sebelum dua tombol massal). Surah belum ada hafalnya, catatan belum siap, atau versi lebih baru = tanpa teks (tidak menulis "Memuat" dua kali; baris progres sudah memberi tahu). Hidup: diperbarui di tempat lewat pembungkus `hfrHfApply` yang sama dengan progres dan tombol massal (ketukan Hafal, Tandai semua, Kosongkan, muat selesai). Tanpa role=status supaya pembaca layar tidak membacakan dua kali bersama baris progres. Teks panjang membungkus (tidak melebarkan halaman). */
function hfrRgTeks(data, n, siap, blok) {   // MURNI: data hafal + surah + keadaan -> "Hafal: 1–5, 7" atau "" (kosong, belum siap, versi baru, surah tak sah); tidak melempar
  if (!siap || blok) return '';
  const r = hfhRentang(data, n); return r ? 'Hafal: ' + r : '';
}
function hfrRgHtml(teks) { return teks ? '<p class="hfr-rg" id="hfrRg">' + esc(teks) + '</p>' : ''; }   // MURNI: teks kosong = ''
function hfrRgKini() { return HFR.n ? hfrRgTeks(HFN.ready ? HFN.data.hafal : null, HFR.n, HFN.ready, HFN.blocked) : ''; }
{ const b = hfrHtml; hfrHtml = function () {   // teks tepat sesudah baris progres di judul surah (hanya saat ayat tampil)
  const x = b.apply(this, arguments); if (!(HFR.n && HFR.st === 'ok' && HFR.s)) return x;
  const h = hfrRgHtml(hfrRgKini()); if (!h) return x;
  return x.replace(/(<div class="hfr-prog"[^>]*>[\s\S]*?<\/div>)/, (m, a) => a + h);
}; }
function hfrRgApply() {   // perbarui di tempat (elemen sama bila ada); tanpa surah terbuka = diam
  if (!HFR.n) return; const r = $('#hfrRg'), t = hfrRgKini();
  if (!t) { if (r) r.remove(); return; }
  if (r) { if (r.textContent !== t) r.textContent = t; return; }
  const p = $('#hfrProg'); if (p) p.insertAdjacentHTML('afterend', hfrRgHtml(t));
}
{ const b = hfrHfApply; hfrHfApply = function () { const v = b.apply(this, arguments); hfrRgApply(); return v; }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2c2b: Object.freeze({ teks: hfrRgTeks, html: hfrRgHtml, kini: hfrRgKini, apply: hfrRgApply }) }));
/* ===== OTH-5c2d2c2b-end ===== */
/* ===== OTH-5c2d2c2b2-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2c-2b-2: teks rentang hafal yang PANJANG dipotong 3 baris dengan tombol "Selengkapnya" / "Lebih sedikit" (keputusan pemilik untuk (de)). Dibangun DI ATAS blok 5c-2d-2c-2b lewat pembungkus (0 baris lama diubah). Tombol hanya ada bila teks lebih dari 30 huruf (lebih pendek tak mungkin melebihi 3 baris), lalu DIUKUR di layar: dalam keadaan tertutup tombol disembunyikan bila teks ternyata muat (scrollHeight <= clientHeight); gagal ukur (elemen tak terlihat) = tombol tetap tampil (aman). Keadaan terbuka satu saja (hanya satu kartu surah), direset tiap surah dibuka atau diganti. Diukur ulang saat teks berubah (lewat hfrRgApply), kartu digambar ulang (hfrDraw), ukuran layar berubah, dan font selesai dimuat. */
const HFRG = { n: 0, buka: false };
const HFRG_MIN = 30;
function hfrRgPanjang(teks) { return typeof teks === 'string' && teks.length > HFRG_MIN; }   // MURNI
function hfrRgBtn(teks, buka) {   // MURNI: tombol sesuai keadaan; teks pendek atau bukan teks = ''
  if (!hfrRgPanjang(teks)) return '';
  return '<button class="hfr-rgk" id="hfrRgK" type="button" data-q="hfrRgK" data-fk="hfr-rgk" aria-controls="hfrRg" aria-expanded="' + (buka ? 'true' : 'false') + '">' + (buka ? 'Lebih sedikit' : 'Selengkapnya') + '</button>';
}
function hfrRgBuka() { if (HFRG.n !== HFR.n) { HFRG.n = HFR.n; HFRG.buka = false; } return HFRG.buka; }   // keadaan terbuka; ganti surah = tertutup
{ const b = hfrRgHtml; hfrRgHtml = function (teks) {   // tambah data-k pada <p> dan tombol tepat sesudahnya
  const x = b.apply(this, arguments); if (!x) return x; const o = hfrRgBuka();
  return x.replace('<p class="hfr-rg" id="hfrRg">', '<p class="hfr-rg" id="hfrRg" data-k="' + (o ? 'buka' : 'tutup') + '">') + hfrRgBtn(teks, o);
}; }
function hfrRgSync() {   // selaraskan tombol dan data-k dengan teks yang ada, lalu ukur; tanpa teks = buang tombol sisa
  const p = $('#hfrRg'), k = $('#hfrRgK');
  if (!p) { if (k) k.remove(); return; }
  const t = p.textContent;
  if (!hfrRgPanjang(t)) { HFRG.buka = false; p.setAttribute('data-k', 'tutup'); if (k) k.remove(); return; }
  const o = hfrRgBuka(); p.setAttribute('data-k', o ? 'buka' : 'tutup');
  let b = k; if (!b) { p.insertAdjacentHTML('afterend', hfrRgBtn(t, o)); b = $('#hfrRgK'); if (!b) return; }
  b.textContent = o ? 'Lebih sedikit' : 'Selengkapnya'; b.setAttribute('aria-expanded', o ? 'true' : 'false');
  if (o) b.hidden = false; else if (p.clientWidth > 0) b.hidden = !(p.scrollHeight > p.clientHeight + 1);
}
QACT.hfrRgK = () => { if (!HFR.n || !$('#hfrRg')) return; const o = hfrRgBuka(); HFRG.buka = !o; hfrRgSync(); };
{ const b = hfrRgApply; hfrRgApply = function () { const v = b.apply(this, arguments); hfrRgSync(); return v; }; }
{ const b = hfrDraw; hfrDraw = function () { const v = b.apply(this, arguments); hfrRgSync(); return v; }; }
{ const b = QACT.hfrBuka; QACT.hfrBuka = function () { HFRG.buka = false; return b.apply(this, arguments); }; }
window.addEventListener('resize', hfrRgSync);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(hfrRgSync, () => {});
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2c2b2: Object.freeze({ panjang: hfrRgPanjang, tombol: hfrRgBtn, buka: hfrRgBuka, sinkron: hfrRgSync }) }));
/* ===== OTH-5c2d2c2b2-end ===== */
/* ===== OTH-5c2d2c2c1-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2c-2c-1: LOGIKA MURNI + PINTU TULIS untuk isian rentang hafal di judul surah (tampilan isian dan tombol menyusul di 2c-2c-2; blok ini TANPA tampilan, TANPA tombol, TANPA penyimpanan baru). `hfrRtRencana(data, n, teks, nilai)` = LARI KERING murni: membaca teks (`hfhParse`) lalu menghitung ayat yang BENAR-BENAR berubah pada data sekarang (`berubah`, `jumlah`), tanpa menulis; `konfirm` = true bila yang berubah dua ayat atau lebih (keputusan dc: lembar konfirmasi wajib); `hfrRtKonfirm` = kalimat lembar konfirmasi; `hfrRtHasil` = kalimat toast; `hfrRtPesan` = kode galat -> kalimat (galat per bagian dari `hfhPesanRentang`, galat catatan dari `hfrHfPesan`); `hfrRtKeadaan` = isian aktif atau mati; `hfnRentang(n, teks, nilai, now)` = SATU-SATUNYA jalan tulis rentang, lewat `hfnJalan` (antrean simpan yang ada; menulis HANYA bila ada ayat yang berubah; versi baru dan belum siap dijaga di sana). Membalik: hapus blok ini. ===== */
const HFRR = Object.freeze({ ringkasMax: 60, konfirmDari: 2 });
function hfrRtRingkas(n, ayat) {   // MURNI: daftar ayat -> teks rentang ringkas "1–5, 7"; lebih dari 60 huruf dipotong di batas koma lalu ", …" (tidak pernah memotong di tengah angka); tak sah = ""
  const k = hfzNo(n); if (!k || !Array.isArray(ayat)) return '';
  const t = hfhRentang({ [String(k)]: ayat }, k); if (t.length <= HFRR.ringkasMax) return t;
  const c = t.slice(0, HFRR.ringkasMax), i = c.lastIndexOf(', '); return (i > 0 ? c.slice(0, i) : c) + ', …';
}
function hfrRtPesan(kode, detail) {   // MURNI: kode galat (hfhParse, hfhTerap, hfnJalan) -> kalimat; galat teks lewat hfhPesanRentang, galat catatan lewat hfrHfPesan
  if (kode === 'kosong' || kode === 'format_salah' || kode === 'ayat_di_luar' || kode === 'rentang_terbalik' || kode === 'terlalu_panjang' || kode === 'terlalu_banyak' || kode === 'surah_tak_sah') return hfhPesanRentang(kode, detail);
  if (kode === 'nilai_tak_sah' || kode === 'ayat_tak_sah') return hfhPesanRentang('', '');
  return hfrHfPesan(kode);
}
function hfrRtRencana(data, n, teks, nilai) {   // MURNI: lari kering -> { ok:true, nilai, n, ayat, diminta, berubah, jumlah, ubah, konfirm, ringkas } atau { ok:false, kode, detail?, pesan } (beku); tidak menulis, tidak melempar
  const g = (kode, detail) => Object.freeze(detail === undefined ? { ok: false, kode, pesan: hfrRtPesan(kode) } : { ok: false, kode, detail, pesan: hfrRtPesan(kode, detail) });
  if (nilai !== true && nilai !== false) return g('nilai_tak_sah');
  const p = hfhParse(teks, n); if (!p.ok) return g(p.kode, p.detail);
  const k = hfzNo(n), s = new Set(hfhBersih(data)[String(k)] || []), berubah = p.ayat.filter(a => nilai ? !s.has(a) : s.has(a));
  return Object.freeze({ ok: true, nilai, n: k, ayat: p.ayat, diminta: p.ayat.length, berubah: Object.freeze(berubah), jumlah: berubah.length, ubah: berubah.length > 0, konfirm: berubah.length >= HFRR.konfirmDari, ringkas: hfrRtRingkas(k, berubah) });
}
function hfrRtKeadaan(siap, blok) {   // MURNI: keadaan catatan -> { mati, kode } beku; kode '' bila aktif
  if (!siap) return Object.freeze({ mati: true, kode: 'belum_siap' });
  if (blok) return Object.freeze({ mati: true, kode: 'versi_baru' });
  return Object.freeze({ mati: false, kode: '' });
}
function hfrRtKonfirm(nilai, nama, r) {   // MURNI: rencana + nama surah -> { title, note, label, danger } atau null (rencana gagal atau tidak ada yang berubah)
  if (!r || r.ok !== true || !r.ubah || (nilai !== true && nilai !== false) || r.nilai !== nilai) return null;
  const s = String(nama || '').trim() || 'ini', lain = r.diminta - r.jumlah;
  if (nilai) return Object.freeze({ title: 'Tandai ' + r.jumlah + ' ayat hafal?', note: 'Ayat ' + r.ringkas + ' surah ' + s + ' akan ditandai hafal' + (lain > 0 ? ' (' + lain + ' ayat lain di rentang itu sudah ditandai).' : '.') + ' Tanda bisa dilepas lagi.', label: 'Tandai', danger: false });
  return Object.freeze({ title: 'Lepas ' + r.jumlah + ' tanda hafal?', note: 'Tanda hafal ayat ' + r.ringkas + ' surah ' + s + ' akan dilepas' + (lain > 0 ? ' (' + lain + ' ayat lain di rentang itu memang belum ditandai).' : '.') + ' Ayatnya sendiri tidak terhapus dan bisa ditandai lagi.', label: 'Lepas', danger: true });
}
function hfrRtHasil(nilai, r) {   // MURNI: hasil hfnRentang -> kalimat toast; galat = hfrRtPesan
  if (!r || r.ok !== true) return hfrRtPesan(r && r.kode, r && r.detail);
  if (!r.ubah) return nilai ? 'Semua ayat di rentang itu sudah ditandai hafal.' : 'Belum ada ayat di rentang itu yang ditandai hafal.';
  return nilai ? r.jumlah + ' ayat ditandai hafal' : r.jumlah + ' tanda hafal dilepas';
}
const hfnRentang = (n, teks, nilai, now) => hfnJalan(h => hfhTerapTeks(h, n, teks, nilai), now);   // -> { ok, ubah, jumlah, data, ayat } | { ok:false, kode, detail? } (kode hfhParse/hfhTerap + belum_siap, versi_baru, waktu)
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2c2c1: Object.freeze({ batas: HFRR, ringkas: hfrRtRingkas, pesan: hfrRtPesan, rencana: hfrRtRencana, keadaan: hfrRtKeadaan, konfirm: hfrRtKonfirm, hasil: hfrRtHasil, tulis: hfnRentang }) }));
/* ===== OTH-5c2d2c2c1-end ===== */
/* ---------- aksi ---------- */
const ibxRmSet = fn => { const rm = ibdb.pref.rm; fn(rm); rm.last = Date.now(); ibxSave(); ibxRender(); };   // mengubah apa pun: pengingat yang sudah lewat tidak ikut berbunyi
QACT.ibxRmTg = b => {
  const id = b.dataset.id; if (!IBX_RM_IDS.includes(id)) return;
  ibxRmSet(rm => { const i = rm.on.indexOf(id); if (i >= 0) rm.on.splice(i, 1); else rm.on.push(id); });
};
QACT.ibxRmLead = b => { const n = parseInt(b.dataset.v, 10); if (!IBX_RM_LEADS.includes(n)) return; ibxRmSet(rm => { rm.lead = n; }); };
QACT.ibxRmDis = b => { const i = parseInt(b.dataset.v, 10); if (!(i >= 0 && i < ibxRmFeed.length)) return; ibxRmFeed.splice(i, 1); ibxRmFeedPaint(); };
QACT.ibxRmNt = b => {
  const rm = ibdb.pref.rm;
  if (b.dataset.v === "0") { rm.nt = false; ibxSave(); ibxRender(); return; }
  if (typeof Notification === "undefined") { toast("Peramban ini tidak mendukung notifikasi. Pengingat tetap tampil di dalam aplikasi"); return; }
  if (Notification.permission === "denied") { toast("Notifikasi diblokir di pengaturan peramban"); return; }
  const done = p => { rm.nt = p === "granted"; rm.last = Date.now(); ibxSave(); if (!rm.nt) toast("Izin notifikasi tidak diberikan"); ibxRender(); };
  if (Notification.permission === "granted") done("granted");
  else { try { Promise.resolve(Notification.requestPermission(done)).then(done).catch(() => done("denied")); } catch (e) { done("denied"); } }
};
QACT.ibxRmTest = () => {
  const ok = ibxRmPush({ k: "uji:" + Date.now(), t: "Uji pengingat", b: "Pengingat Ibadah bekerja. Ini hanya percobaan." }, Date.now());
  ibxRmFeedPaint();
  const st = $("#rmSt"); if (st) { /* status tetap */ }
  toast(ok ? "Pengingat uji dikirim" : "Pengingat uji tampil di aplikasi (notifikasi sistem belum aktif)");
};
QACT.ibxRmKahfi = () => QACT.qrOpen({ dataset: { n: "18", a: "0" } });
QACT.ibxRmGo = () => { ibxSrOpen = false; ibxQ = ""; ibxTab = "ingat"; ibxRender(); };
QACT.ibxRmIcs = () => {
  const r = ibxRmIcs();
  if (!r.n) { toast("Nyalakan minimal satu jenis pengingat dulu"); return; }
  download("pengingat-ibadah.ics", r.text, "text/calendar;charset=utf-8");
};
document.addEventListener("change", ev => {
  const t = ev.target; if (!t || (t.id !== "rmKahfi" && t.id !== "rmSk")) return;
  const k = t.id === "rmKahfi" ? "kahfiAt" : "skAt", rm = ibdb.pref.rm;
  if (!IBX_RM_TM.test(t.value)) { t.value = rm[k]; toast("Jam tidak valid"); return; }
  ibxRmSet(r => { r[k] = t.value; });
});
IBX_FRESH.push(() => { /* pengingat yang sudah dibaca tidak perlu bertahan antar kunjungan */ ibxRmFeed = []; });
/* ---------- berkas kalender (.ics) ---------- */
const ibxIcsEsc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ibxIcsFold = l => { const o = []; while (l.length > 70) { o.push(l.slice(0, 70)); l = " " + l.slice(70); } o.push(l); return o.join("\r\n"); };
const ibxIcsUtc = ms => { const d = new Date(ms); return "" + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z"; };
const ibxIcsLoc = ms => { const d = new Date(ms); return "" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00"; };
const IBX_ICS_WD = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function ibxRmIcs() {
  const rm = ibdb.pref.rm, now = Date.now(), stamp = ibxIcsUtc(now), t0 = today(), ev = [];
  const add = (uid, start, end, sum, desc, alarm, rr) => {
    const L = ["BEGIN:VEVENT", "UID:" + uid + "@dailylog.local", "DTSTAMP:" + stamp, start, end];
    if (rr) L.push("RRULE:" + rr);
    L.push("SUMMARY:" + ibxIcsEsc(sum), "DESCRIPTION:" + ibxIcsEsc(desc), "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + ibxIcsEsc(sum), "TRIGGER:" + (alarm ? "-PT" + alarm + "M" : "PT0S"), "END:VALARM", "END:VEVENT");
    ev.push(L.map(ibxIcsFold).join("\r\n"));
  };
  const uidOf = k => "dl-ibx-" + k.replace(/[^A-Za-z0-9]+/g, "-");
  for (let i = 0; i < 30; i++) ibxRmOcc(addDays(t0, i), rm, ["adzan", "sepertiga"]).forEach(o => { if (o.due > now) add(uidOf(o.k), "DTSTART:" + ibxIcsUtc(o.due), "DTEND:" + ibxIcsUtc(o.due + 600000), o.sm, o.b, o.lead); });
  for (let i = 0; i < 400; i++) ibxRmOcc(addDays(t0, i), rm, ["bidh", "besar"]).forEach(o => { if (o.at > now) add(uidOf(o.k), "DTSTART:" + ibxIcsLoc(o.at), "DTEND:" + ibxIcsLoc(o.at + 600000), o.sm, o.b, 0); });
  const nextWd = (w, tm) => { const s = addDays(t0, (w - pd(t0).getDay() + 7) % 7); let a = ibxRmAtLocal(s, tm); if (a <= now) { a = ibxRmAtLocal(addDays(s, 7), tm); } return a; };
  if (rm.on.includes("kahfi")) { const a = nextWd(5, rm.kahfiAt); add("dl-ibx-kahfi-mingguan", "DTSTART:" + ibxIcsLoc(a), "DTEND:" + ibxIcsLoc(a + 600000), "Jumat: baca Surah Al-Kahfi", "Perbanyak shalawat juga hari ini.", 0, "FREQ=WEEKLY;BYDAY=FR"); }
  if (rm.on.includes("sk")) [[0, "Senin"], [3, "Kamis"]].forEach(x => { const a = nextWd(x[0], rm.skAt); add("dl-ibx-sk-" + x[1].toLowerCase(), "DTSTART:" + ibxIcsLoc(a), "DTEND:" + ibxIcsLoc(a + 600000), "Besok puasa sunnah " + x[1], "Siapkan niat dan sahur.", 0, "FREQ=WEEKLY;BYDAY=" + IBX_ICS_WD[x[0]]); });
  if (rm.on.includes("kajian")) ibdb.pref.kj.it.forEach(it => {
    const nd = ibxKjNextDate(it, t0); if (!nd) return;
    const tm = it.tm || "07:00", a = ibxRmAtLocal(nd, tm), ld = it.tm ? rm.lead : 0, dur = it.tm ? 3600000 : 600000;
    add("dl-ibx-kajian-" + it.id, "DTSTART:" + ibxIcsLoc(a), "DTEND:" + ibxIcsLoc(a + dur), "Kajian: " + it.t, [it.s, it.u, it.n].filter(Boolean).join(" | ") || "Jadwal dari Kajian saya.", ld, it.w === "sekali" ? "" : "FREQ=WEEKLY;BYDAY=" + IBX_ICS_WD[it.wd]);
  });
  if (!ev.length) return { text: "", n: 0 };
  return { n: ev.length, text: ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Daily Log//Pengingat Ibadah//ID", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Pengingat Ibadah"].join("\r\n") + "\r\n" + ev.join("\r\n") + "\r\nEND:VCALENDAR\r\n" };
}
/* cari: "pengingat", "alarm", "notifikasi", "tahajud", "kahfi" ... */
IBX_SEARCH.push(function (n, toks) {
  const row = { t: ibxNorm("Pengingat ibadah"), k: ibxNorm("pengingat alarm notifikasi adzan azan sepertiga malam tahajud al kahfi jumat puasa senin kamis ayyamul bidh hari besar kajian kalender ics"), a: ibxNorm("alarm kalender hp notifikasi pengingat shalat"), l: "", r: "" }, s = ibxScoreOf(row, toks);
  if (!s) return [];
  const on = ibdb.pref.rm.on.length;
  return [{ s: s + 1, kind: "pengingat", id: "rm", h: '<div class="ibx-doa guide kj-sr"><div class="kj-srb"><span class="t">Pengingat ibadah</span><span class="c">' + on + " dari " + IBX_RM.length + ' jenis menyala</span></div><button class="ibx-mini" data-q="ibxRmGo"><span>Buka di Pengingat</span></button></div>' }];
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b81d3: Object.freeze({ types: IBX_RM, occ: ibxRmOcc, between: ibxRmBetween, run: ibxRmRun, ics: ibxRmIcs, clean5: ibxCleanPref5, feed: () => ibxRmFeed, notify: ibxRmNotify, panel: ibxRmPanel, grace: IBX_RM_GRACE }) }));
/* ===== v81e: tema halaman Ibadah (otomatis siang/malam) + jenis huruf Arab. Dibatasi halaman Ibadah. Membalik: patch81e.py --reverse ===== */
const IBX_TH = [['app', 'Ikut aplikasi'], ['malam', 'Otomatis'], ['terang', 'Terang'], ['gelap', 'Gelap']];
const IBX_AF = [['sys', 'Bawaan'], ['amiri', 'Amiri Quran'], ['sch', 'Scheherazade']];
const IBX_AF_FAM = { amiri: 'Amiri Quran', sch: 'Scheherazade New' };
const IBX_AF_URL = { amiri: 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap', sch: 'https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;500&display=swap' };
const ibxAfSt = {};   // id -> 'loading' | 'ok' | 'fail'
const ibxThVal = () => (ibdb && ibdb.pref && IBX_TH.some(x => x[0] === ibdb.pref.th)) ? ibdb.pref.th : 'app';
const ibxAfVal = () => (ibdb && ibdb.pref && IBX_AF.some(x => x[0] === ibdb.pref.af)) ? ibdb.pref.af : 'sys';
function ibxCleanPref6(p, b) {   // dipanggil ibxClean: tema halaman Ibadah dan jenis huruf Arab
  b.pref.th = IBX_TH.some(x => x[0] === p.th) ? p.th : 'app';
  b.pref.af = IBX_AF.some(x => x[0] === p.af) ? p.af : 'sys';
}
/* malam = dari Maghrib sampai Subuh di lokasi; tanpa lokasi (atau jadwal tak lengkap) pukul 18.00-05.00 waktu perangkat */
function ibxNightNow(now) {
  try {
    if (hxHas()) {
      const p = hxParts(now, ldb), d = hxDay(p.y, p.m, p.d, ldb), fj = d.items[0].at, mg = d.items[4].at;
      if (fj != null && mg != null) return now < fj || now >= mg;
    }
  } catch (e) { /* jatuh ke jam tetap */ }
  const x = new Date(now), h = x.getHours() + x.getMinutes() / 60;
  return h >= 18 || h < 5;
}
let ibxNightC = { at: -1e15, v: false }, ibxThApplied = null;
function ibxNightCached(now) {
  if (now < ibxNightC.at || now - ibxNightC.at > 15000) ibxNightC = { at: now, v: ibxNightNow(now) };
  return ibxNightC.v;
}
function ibxThWant(now) {   // 'light' | 'dark' | null (null = tidak mengubah tema aplikasi)
  if (curView !== 'ibadah') return null;
  const t = ibxThVal();
  if (t === 'terang') return 'light';
  if (t === 'gelap') return 'dark';
  if (t === 'malam') return ibxNightCached(now) ? 'dark' : 'light';
  return null;
}
function ibxThemeSync(now) {
  const r = document.documentElement, want = ibxThWant(now == null ? Date.now() : now);
  if (want) {
    if (ibxThApplied !== want || r.getAttribute('data-theme') !== want) {
      r.setAttribute('data-theme', want);
      $$('meta[name="theme-color"]').forEach(m => {
        if (m.dataset.m0 == null) m.dataset.m0 = m.getAttribute('media') || '';
        m.setAttribute('media', /dark/.test(m.dataset.m0) === (want === 'dark') ? 'all' : 'not all');
      });
    }
    ibxThApplied = want;
    const nt = $('#ibxThNote'); if (nt) nt.textContent = ibxThNote();   // catatan "Sekarang: siang/malam" ikut berganti
  } else if (ibxThApplied) {   // keluar dari Ibadah (atau kembali ke "Ikut aplikasi"): kembalikan tema aplikasi
    ibxThApplied = null;
    upApply();
  }
}
function ibxAfLoad(af) {
  const url = IBX_AF_URL[af];
  if (!url) return;
  const old = document.getElementById('ibxAf-' + af);
  if (old) old.remove();
  ibxAfSt[af] = 'loading';
  const l = document.createElement('link');
  l.id = 'ibxAf-' + af; l.rel = 'stylesheet'; l.href = url;
  const done = st => { ibxAfSt[af] = st; ibxAfNotePaint(); };
  l.onload = () => {
    const f = document.fonts && document.fonts.load ? document.fonts.load('32px "' + IBX_AF_FAM[af] + '"', '\u0628\u0650\u0633\u0652\u0645\u0650') : Promise.resolve([1]);
    f.then(fs => done(fs && fs.length ? 'ok' : 'fail')).catch(() => done('fail'));
  };
  l.onerror = () => done('fail');
  document.head.appendChild(l);
}
function ibxAfSync() {
  const af = ibxAfVal(), r = document.documentElement;
  if (af === 'sys') { if (r.hasAttribute('data-ibaf')) r.removeAttribute('data-ibaf'); }
  else if (r.getAttribute('data-ibaf') !== af) r.setAttribute('data-ibaf', af);
  if (curView === 'ibadah' && IBX_AF_URL[af] && ibxAfSt[af] == null) ibxAfLoad(af);
}
function ibxThNote() {
  const t = ibxThVal();
  if (t === 'app') return 'Mengikuti tema aplikasi (Pengaturan, Tema).';
  if (t === 'terang') return 'Halaman Ibadah selalu terang. Halaman lain tetap mengikuti tema aplikasi.';
  if (t === 'gelap') return 'Halaman Ibadah selalu gelap. Halaman lain tetap mengikuti tema aplikasi.';
  try {
    if (hxHas()) {
      const now = Date.now(), p = hxParts(now, ldb), d = hxDay(p.y, p.m, p.d, ldb), fj = d.items[0].at, mg = d.items[4].at;
      if (fj != null && mg != null) return 'Terang di siang hari, gelap dari Maghrib (' + hxHM(mg, d.tz) + ') sampai Subuh (' + hxHM(fj, d.tz) + '). Sekarang: ' + (ibxNightNow(now) ? 'malam' : 'siang') + '.';
    }
  } catch (e) { /* abaikan */ }
  return 'Terang di siang hari, gelap pukul 18.00-05.00. Atur lokasi agar mengikuti Maghrib dan Subuh.';
}
function ibxAfNoteText() {
  const af = ibxAfVal(), st = ibxAfSt[af];
  if (af === 'sys') return 'Memakai huruf Naskh bawaan perangkat. Gaya IndoPak belum tersedia.';
  if (st === 'loading') return 'Memuat huruf dari internet...';
  if (st === 'ok') return 'Huruf siap dipakai.';
  if (st === 'fail') return 'Tidak bisa dimuat (butuh internet). Sementara memakai huruf bawaan perangkat. Pilih lagi untuk mencoba ulang.';
  return 'Huruf dimuat dari internet saat dipakai; tanpa internet memakai huruf bawaan perangkat.';
}
function ibxAfNotePaint() { const el = $('#ibxAfNote'); if (el) el.textContent = ibxAfNoteText(); }
function ibxLookHtml() {
  const chips = (act, items, cur, fk) => '<div class="ibx-chips" role="group" aria-label="' + (act === 'ibxTh' ? 'Tema halaman Ibadah' : 'Jenis huruf Arab') + '">' + items.map(i => '<button class="ibx-chip" data-q="' + act + '" data-v="' + i[0] + '" data-fk="' + fk + i[0] + '" aria-pressed="' + (cur === i[0]) + '">' + esc(i[1]) + '</button>').join('') + '</div>';
  return '<div class="ibx-look"><p class="ibx-sub">Tema halaman Ibadah</p>' + chips('ibxTh', IBX_TH, ibxThVal(), 'th-') + '<p class="ibx-fine" id="ibxThNote">' + esc(ibxThNote()) + '</p>' +
    '<p class="ibx-sub">Jenis huruf Arab</p>' + chips('ibxAf', IBX_AF, ibxAfVal(), 'af-') + '<p class="ibx-fine" id="ibxAfNote" role="status">' + esc(ibxAfNoteText()) + '</p>' +
    '<p class="ibx-ar ibx-lookS" lang="ar" dir="rtl" style="--ibar:' + IBX_AR[ibdb.pref.ar] + 'px">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p></div>';
}
QACT.ibxTh = b => { const v = b.dataset.v; if (!IBX_TH.some(x => x[0] === v)) return; ibdb.pref.th = v; ibxSave(); ibxNightC = { at: -1e15, v: false }; ibxThemeSync(); ibxRender(); };
QACT.ibxAf = b => {
  const v = b.dataset.v; if (!IBX_AF.some(x => x[0] === v)) return;
  ibdb.pref.af = v; ibxSave();
  if (IBX_AF_URL[v]) ibxAfLoad(v);
  ibxAfSync(); ibxRender();
};
{
  const baseShowLook = showView;
  showView = function (v) { const r = baseShowLook(v); try { ibxThemeSync(); ibxAfSync(); } catch (e) { /* abaikan */ } return r; };
}
setInterval(() => { try { ibxThemeSync(); ibxAfSync(); } catch (e) { /* jangan ganggu aplikasi */ } }, 1000);
window.DL = Object.freeze(Object.assign({}, window.DL, { b81e: Object.freeze({ th: IBX_TH, af: IBX_AF, night: ibxNightNow, want: ibxThWant, sync: ibxThemeSync, afSt: ibxAfSt, afLoad: ibxAfLoad, clean6: ibxCleanPref6, look: ibxLookHtml, thNote: ibxThNote, afNote: ibxAfNoteText }) }));
/* ===== v81f: pemutar murottal global + timer tidur. Membalik: patch81f.py --reverse ===== */
const QS = { end: 0, m: 0, surah: false };   // timer tidur: tidak disimpan (hanya berlaku selama aplikasi terbuka)
const QS_OPT = [['0', 'Mati'], ['15', '15 menit'], ['30', '30 menit'], ['60', '60 menit'], ['end', 'Akhir surah']];
const qsCur = () => QS.surah ? 'end' : QS.end ? String(QS.m) : '0';
const qsLeftMin = now => QS.end ? Math.max(1, Math.ceil((QS.end - now) / 60000)) : 0;
function qsNote() {
  if (QS.surah) return 'Murottal berhenti sendiri di akhir surah yang sedang diputar.';
  if (QS.end) return 'Murottal dijeda otomatis sekitar ' + qsLeftMin(Date.now()) + ' menit lagi.';
  return 'Timer tidur: murottal dijeda sendiri (pemutar tidak ditutup). Hanya berlaku selama aplikasi terbuka.';
}
function qsClear() { QS.end = 0; QS.m = 0; QS.surah = false; }
function qsChips() {   // chip Timer tidur selalu cocok dengan keadaan sebenarnya (timer habis / pemutar ditutup tanpa menggambar ulang halaman)
  const cur = qsCur();
  document.querySelectorAll('[data-q=qrSleep]').forEach(b => { const p = String(b.dataset.v === cur); if (b.getAttribute('aria-pressed') !== p) b.setAttribute('aria-pressed', p); });
}
function qsSet(v) {
  const m = /^\d+$/.test(String(v)) ? parseInt(v, 10) : 0;
  if (v === 'end') { QS.surah = true; QS.end = 0; QS.m = 0; }
  else if (m === 15 || m === 30 || m === 60) { QS.surah = false; QS.m = m; QS.end = Date.now() + m * 60000; }
  else qsClear();
}
function qsFire() {   // waktu timer habis: jeda, jangan tutup pemutar
  qsClear();
  try { QA.pause(); } catch (e) { /* abaikan */ }
  qa.on = false; qaPaintBar(); qaMark(false);
  toast('Timer tidur selesai: murottal dijeda.');
  if (curView === 'ibadah') ibxRender();
}
function qsEnded() {   // dipanggil saat satu audio selesai; true = jangan lanjut ke ayat berikutnya
  if (!QS.surah || !qa.n) return false;
  const last = qa.mode === 'full' || qa.a >= qrCnt(qa.n);
  if (!last) return false;
  qsClear(); qa.on = false; qaPaintBar(); qaMark(false);
  toast('Murottal berhenti di akhir surah.');
  if (curView === 'ibadah') ibxRender();
  return true;
}
QACT.qrSleep = b => { qsSet(b.dataset.v); ibxRender(); };
function qgEl() {
  let el = $('#qaGlob');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'qaGlob'; el.className = 'qg'; el.hidden = true;
  el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Pemutar murottal');
  el.innerHTML = '<button class="qg-t" data-q="qgOpen" aria-label="Buka pemutar di halaman Ibadah"><b></b><span></span></button>' +
    '<button data-q="qrPrev" aria-label="Sebelumnya">' + QI.prev + '</button>' +
    '<button data-q="qrPP" aria-pressed="false" aria-label="Putar">' + QI.play + QI.pause + '</button>' +
    '<button data-q="qrNext" aria-label="Berikutnya">' + QI.next + '</button>' +
    '<button data-q="qrStop" aria-label="Tutup pemutar">' + QI.stop + '</button>';
  document.body.appendChild(el);
  return el;
}
function qgSync() {
  const show = !!qa.n && curView !== 'ibadah';
  const el = show ? qgEl() : $('#qaGlob');
  document.body.classList.toggle('qg-on', show);
  if (!el) return;
  el.hidden = !show;
  if (!show) return;
  const nm = qrName(qa.n);
  const sub = (qa.mode === 'ayat' ? 'Ayat ' + qa.a + ' dari ' + qrCnt(qa.n) : 'Surah penuh') + (QS.end ? ' · tidur ' + qsLeftMin(Date.now()) + ' m' : QS.surah ? ' · tidur: akhir surah' : '') + ' · ' + qaQari(qa.q);   // info timer di depan supaya tidak terpotong elipsis
  const b = $('.qg-t b', el), s = $('.qg-t span', el);
  if (b.textContent !== nm) b.textContent = nm;
  if (s.textContent !== sub) s.textContent = sub;
  const pp = $('[data-q=qrPP]', el), lb = qa.on ? 'Jeda' : 'Putar';
  if (pp.getAttribute('aria-pressed') !== String(qa.on)) pp.setAttribute('aria-pressed', String(qa.on));
  if (pp.getAttribute('aria-label') !== lb) pp.setAttribute('aria-label', lb);
  let top = window.innerHeight;   // letak: tepat di atas bilah tab (dan di atas bilah timer latihan bila ada)
  [$('.tabs'), document.body.classList.contains('tm') ? $('.tmbar') : null].forEach(x => { if (!x) return; const r = x.getBoundingClientRect(); if (r.height > 0 && r.top < top) top = r.top; });
  const bt = Math.max(0, Math.round(window.innerHeight - top + 6)) + 'px';
  if (el.style.bottom !== bt) el.style.bottom = bt;
}
QACT.qgOpen = () => {
  if (!qa.n) return;
  showView('ibadah');
  ibxTab = 'quran'; ibxSrOpen = false; ibxQ = '';
  qr.n = qa.n; qr.shown = Math.min(qrCnt(qa.n), Math.max(QR_PAGE, qa.mode === 'ayat' ? qa.a + 10 : 0)); qr.fa = qa.mode === 'ayat' ? qa.a : 0; qr.tf = new Set(); qr.setOpen = false;
  ibxRender();
};
{
  const baseShowQg = showView;
  showView = function (v) { const r = baseShowQg(v); try { qgSync(); } catch (e) { /* abaikan */ } return r; };
}
window.addEventListener('resize', () => { try { qgSync(); } catch (e) { /* abaikan */ } });
setInterval(() => {
  try {
    if (QS.end && Date.now() >= QS.end) qsFire();
    const nt = $('#qsNote'); if (nt) { const t = qsNote(); if (nt.textContent !== t) nt.textContent = t; }
    qsChips();
    qgSync();
  } catch (e) { /* jangan ganggu aplikasi */ }
}, 1000);
window.DL = Object.freeze(Object.assign({}, window.DL, { b81f: Object.freeze({ qs: QS, opt: QS_OPT, cur: qsCur, set: qsSet, note: qsNote, fire: qsFire, ended: qsEnded, sync: qgSync, chips: qsChips }) }));

/* v82a-begin */
/* ===== v82a: halaman Self Care (Lainnya > Self Care): kerangka 4 tab + tab "Hari ini" (skor glow, hidrasi, tugas harian, streak). Membalik: patch82.py --reverse ===== */
// Data baru disimpan di kunci dailylog:selfcare:v1 (STORES.sc) dan ikut cadangan JSON (kunci `selfcare`).
// Air putih, tidur, dan junkfood DIBACA dari Jurnal (satu sumber); air putih bisa ditambah dari sini dan ditulis ke Jurnal.
const SC_KEY = 'dailylog:selfcare:v1';
const SC_TASKS = [   // m = dicentang manual; a = otomatis dari Jurnal; w = bobot skor (jumlah 100)
  { id: 'hy', t: 'Air putih cukup', s: 'Mencapai target hari ini (dari Jurnal)', w: 20, a: 1 },
  { id: 'sl', t: 'Tidur 7 jam atau lebih', s: 'Dari isian tidur di Jurnal', w: 20, a: 1 },
  { id: 'jk', t: 'Tanpa junkfood dan manis', s: 'Dari isian Jurnal: bersih', w: 10, a: 1 },
  { id: 'skam', t: 'Skincare pagi', s: 'Cuci muka, pelembap, tabir surya', w: 10, m: 1 },
  { id: 'skpm', t: 'Skincare malam', s: 'Bersihkan, perawatan, pelembap', w: 10, m: 1 },
  { id: 'supp', t: 'Vitamin dan suplemen', s: 'Sesuai jadwal tumpukan Anda', w: 10, m: 1 },
  { id: 'pt', t: 'Peregangan postur', s: 'Leher, bahu, punggung', w: 5, m: 1 },
  { id: 'br', t: 'Latihan napas', s: 'Box breathing atau 4-7-8', w: 5, m: 1 },
  { id: 'sn', t: 'Cahaya matahari pagi', s: 'Sekitar 10 menit di luar ruangan', w: 5, m: 1 },
  { id: 'scr', t: 'Layar mati 1 jam sebelum tidur', s: 'Ponsel dan layar lain', w: 5, m: 1 }
];
const SC_MAN = SC_TASKS.filter(x => x.m).map(x => x.id);
const SC_SKIN = [['', 'Belum dipilih'], ['normal', 'Normal'], ['kering', 'Kering'], ['berminyak', 'Berminyak'], ['kombinasi', 'Kombinasi'], ['sensitif', 'Sensitif']];
const scBlank = () => ({ v: 1, days: {}, pref: { skin: '', hid: [] }, u: 0 });
let scdb = scBlank();
function scNumIn(v, lo, hi) { const n = Number(v); return v != null && v !== '' && Number.isFinite(n) && n >= lo && n <= hi ? n : null; }
function scCleanDay(r) {
  const o = { ck: [], u: 0 };
  if (!r || typeof r !== 'object' || Array.isArray(r)) return o;
  o.ck = (Array.isArray(r.ck) ? r.ck : []).filter((x, i, a) => SC_MAN.includes(x) && a.indexOf(x) === i);
  const u = Number(r.u); o.u = Number.isFinite(u) && u > 0 ? u : 0;
  if (typeof scCleanDay2 === 'function') scCleanDay2(r, o);   // v82d+
  return o;
}
function scClean(raw) {
  const b = scBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  if (raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days)) {
    Object.keys(raw.days).forEach(d => { if (DATE_RE.test(d) && d <= addDays(today(), 1)) { const x = scCleanDay(raw.days[d]); if (x.ck.length || x.u || scDayHas(x)) b.days[d] = x; } });
  }
  const p = raw.pref && typeof raw.pref === 'object' ? raw.pref : {};
  b.pref.skin = SC_SKIN.some(x => x[0] === p.skin) ? p.skin : '';
  b.pref.hid = (Array.isArray(p.hid) ? p.hid : []).filter((x, i, a) => SC_MAN.includes(x) && a.indexOf(x) === i);
  if (typeof scCleanPref2 === 'function') scCleanPref2(p, b.pref);   // v82b+
  const u = Number(raw.u); b.u = Number.isFinite(u) && u > 0 ? u : 0;
  return b;
}
function scDayHas(x) { return !!(x && (x.ck.length || (typeof scDayHas2 === 'function' && scDayHas2(x)))); }
STORES.sc = { key: SC_KEY, get: () => scdb }; dirty.sc = false;   // ikut ekspor JSON (kunci `selfcare`)
const scSave = () => { scdb.u = Date.now(); queueSave('sc'); };
const scDay = d => scdb.days[d] || { ck: [], u: 0 };
function scEdit(d, fn) { const x = scdb.days[d] || (scdb.days[d] = { ck: [], u: 0 }); fn(x); x.u = Date.now(); scSave(); }
function scMergeIn(raw, r, apply, eff) {   // impor: per tanggal, versi dengan u lebih besar menang
  r.scAdded = 0; r.scApplied = 0; r.scSame = 0;
  if (!raw) return;
  const ii = scClean(raw);
  Object.keys(ii.days).forEach(d => {
    const inc = ii.days[d], loc = scdb.days[d];
    if (!loc || inc.u > loc.u) { if (apply) { scdb.days[d] = inc; r.scApplied++; } if (eff !== false) r.scAdded++; } else r.scSame++;
  });
  if (raw.pref && ii.u > scdb.u) { if (apply) { scdb.pref = ii.pref; scdb.u = ii.u; r.scApplied++; } }
}
/* ---------- skor dan streak ---------- */
function scWaterT(d) { let w = 3; try { const x = tgBase(d).water; if (Number.isFinite(x) && x > 0) w = x; } catch (e) { /* bawaan 3 L */ } return w; }
function scJ(d) { return db[d] || null; }
function scSleepH(d) { const e = scJ(d); return e ? num(e.sleep) : null; }
function scWaterV(d) { const e = scJ(d); return e ? num(e.water) : null; }
function scFrac(id, d) {   // 0..1 untuk satu tugas pada tanggal d (null = belum ada data)
  const e = scJ(d);
  if (id === 'hy') { const w = scWaterV(d); return w == null ? null : Math.min(1, w / scWaterT(d)); }
  if (id === 'sl') { const h = scSleepH(d); return h == null ? null : (h > 9 ? 0.9 : Math.min(1, h / 7)); }
  if (id === 'jk') return !e || !e.junk ? null : (e.junk === 'bersih' ? 1 : 0);
  return scDay(d).ck.includes(id) ? 1 : 0;
}
function scDone(id, d) {
  if (id === 'hy') { const f = scFrac(id, d); return f != null && f >= 1; }
  if (id === 'sl') { const h = scSleepH(d); return h != null && h >= 7; }
  if (id === 'jk') return scFrac(id, d) === 1;
  return scDay(d).ck.includes(id);
}
function scScore(d) {
  const parts = SC_TASKS.map(t => { const f = scFrac(t.id, d), got = f == null ? 0 : f * t.w; return { id: t.id, t: t.t, w: t.w, f, got }; });
  const pts = parts.reduce((a, p) => a + p.got, 0), any = parts.some(p => p.f != null && (p.f > 0 || SC_TASKS.find(t => t.id === p.id).a));
  return { pts: Math.round(pts), pct: Math.max(0, Math.min(1, pts / 100)), parts, any: parts.some(p => p.f != null && (SC_MAN.includes(p.id) ? p.f > 0 : true)) };
}
function scStreak(id) {
  const t = today(); let d = t, n = 0;
  if (!scDone(id, d)) d = addDays(d, -1);
  while (n < 400 && scDone(id, d)) { n++; d = addDays(d, -1); }
  return n;
}
function scBand(sc) {
  if (!sc.any) return 'Belum ada catatan hari ini';
  const p = sc.pts; return p >= 85 ? 'Prima hari ini' : p >= 70 ? 'Bagus, pertahankan' : p >= 50 ? 'Cukup, masih bisa naik' : 'Mulai dari yang kecil';
}
function scRing(pct, num_, label) {
  const R = 52, C = 2 * Math.PI * R, off = C * (1 - Math.max(0, Math.min(1, pct)));
  return '<svg class="sc-ring" viewBox="0 0 120 120" role="img" aria-label="' + esc(label) + '"><circle class="bg" cx="60" cy="60" r="' + R + '"/><circle class="fg" cx="60" cy="60" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 60 60)"/><text x="60" y="64" text-anchor="middle" class="n">' + num_ + '</text><text x="60" y="82" text-anchor="middle" class="u">dari 100</text></svg>';
}
const SC_CHK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
/* ---------- tab Hari ini ---------- */
function scHero(t) {
  const sc = scScore(t), lab = 'Skor glow hari ini ' + sc.pts + ' dari 100';
  const wv = scWaterV(t), sh = scSleepH(t);
  const days7 = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(t, -i)), rec = days7.filter(d => scScore(d).any), av = rec.length ? Math.round(rec.reduce((a, d) => a + scScore(d).pts, 0) / rec.length) : null;
  return '<section class="sc-card sc-hero" aria-label="Skor glow"><div class="sc-hr">' + scRing(sc.pct, sc.pts, lab) + '<div class="sc-ht"><small>Glow hari ini</small><b>' + esc(scBand(sc)) + '</b>' +
    '<span>' + (wv == null ? 'Air putih belum dicatat' : fmt(wv, 2) + ' L air') + ' · ' + (sh == null ? 'tidur belum dicatat' : fmt(sh, 1) + ' jam tidur') + '</span>' +
    '<span>' + (av == null ? 'Rata-rata 7 hari: belum ada' : 'Rata-rata 7 hari: ' + av) + '</span></div></div></section>';
}
function scWaterCard(t) {
  const w = scWaterV(t), tg = scWaterT(t), f = w == null ? 0 : Math.min(1, w / tg), left = w == null ? tg : Math.max(0, tg - w);
  const btn = (v, l) => '<button class="sc-btn" data-q="scWater" data-v="' + v + '" data-fk="w' + v + '" aria-label="' + (v > 0 ? 'Tambah ' : 'Kurangi ') + Math.abs(v) + ' liter air">' + l + '</button>';
  return '<section class="sc-card"><h3>Hidrasi</h3><div class="sc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + fmt(tg, 1) + '" aria-valuenow="' + (w == null ? 0 : fmt(w, 2)) + '" aria-label="Air putih hari ini"><i style="width:' + Math.round(f * 100) + '%"></i></div>' +
    '<p class="sc-sub"><b>' + (w == null ? '0' : fmt(w, 2)) + '</b> dari ' + fmt(tg, 1) + ' L' + (left > 0 ? ' · sisa ' + fmt(left, 2) + ' L' : ' · target tercapai') + '</p>' +
    '<div class="sc-row">' + btn(-0.25, '−0,25') + btn(0.25, '+0,25 L') + btn(0.5, '+0,5 L') + '</div><p class="sc-fine">Tersimpan ke isian air putih di Jurnal.</p></section>';
}
function scTaskRow(x, t) {
  const done = scDone(x.id, t), n = scStreak(x.id), sk = n ? '<em class="sc-sk" title="Beruntun">' + n + ' hari</em>' : '';
  if (x.a) return '<div class="sc-task auto' + (done ? ' on' : '') + '"><span class="sc-box" aria-hidden="true">' + SC_CHK + '</span><span class="t"><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></span>' + sk + '<span class="sc-tag">' + (done ? 'Tercapai' : 'Otomatis') + '</span></div>';
  return '<button class="sc-task' + (done ? ' on' : '') + '" role="checkbox" aria-checked="' + done + '" data-q="scTg" data-id="' + x.id + '" data-fk="tg-' + x.id + '"><span class="sc-box" aria-hidden="true">' + SC_CHK + '</span><span class="t"><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></span>' + sk + '</button>';
}
function scTasks(t) {
  const vis = SC_TASKS.filter(x => x.a || !scdb.pref.hid.includes(x.id)), got = vis.filter(x => scDone(x.id, t)).length;
  return '<section class="sc-card"><h3>Tugas hari ini</h3><p class="sc-sub">' + got + ' dari ' + vis.length + ' tercapai. Angka "hari" = beruntun berturut-turut.</p>' + vis.map(x => scTaskRow(x, t)).join('') + '</section>';
}
function scWeek(t) {
  const ds = [6, 5, 4, 3, 2, 1, 0].map(i => addDays(t, -i)), sc = ds.map(scScore);
  const bars = ds.map((d, i) => '<div class="sc-b' + (d === t ? ' now' : '') + '"><i style="height:' + (sc[i].any ? Math.max(6, Math.round(sc[i].pct * 100)) : 0) + '%" class="' + (!sc[i].any ? 'nil' : sc[i].pts >= 70 ? 'hi' : sc[i].pts >= 40 ? 'mid' : 'lo') + '"></i><span>' + HARI[pd(d).getDay()].slice(0, 1) + '</span><b>' + (sc[i].any ? sc[i].pts : '–') + '</b></div>').join('');
  const rec = sc.filter(x => x.any);
  return '<section class="sc-card"><h3>7 hari terakhir</h3><div class="sc-chart" role="img" aria-label="Skor glow tujuh hari terakhir: ' + sc.map((x, i) => HARI[pd(ds[i]).getDay()] + ' ' + (x.any ? x.pts : 'kosong')).join(', ') + '">' + bars + '</div><p class="sc-fine">' + (rec.length ? 'Rata-rata ' + Math.round(rec.reduce((a, x) => a + x.pts, 0) / rec.length) + ' dari ' + rec.length + ' hari tercatat.' : 'Belum ada hari tercatat.') + ' Hijau 70 ke atas, kuning 40 ke atas.</p></section>';
}
function scPulse() {
  const t = today();
  return scHero(t) + scWaterCard(t) + scTasks(t) + scWeek(t) +
    '<button class="sc-link" data-goto="today">Isi tidur, junkfood, dan catatan lain di Jurnal &rsaquo;</button>' +
    '<p class="sc-fine">Panduan umum untuk kebiasaan sehat, bukan pengganti saran dokter. Keluhan kulit atau kesehatan yang menetap perlu diperiksakan.</p>';
}
/* ---------- kerangka ---------- */
const SC_TABS = [['pulse', 'Hari ini'], ['gizi', 'Gizi'], ['vit', 'Vitamin'], ['glow', 'Glow-Up']];
const SC_PANEL = { pulse: scPulse }, SC_READY = { pulse: true };
let scTab = 'pulse';
function scRender() {
  const root = $('#scBody'); if (!root) return;
  const ae = document.activeElement, fk = ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null, keep = window.scrollY;
  if (!SC_READY[scTab] || !SC_PANEL[scTab]) scTab = 'pulse';
  const tabs = SC_TABS.filter(x => SC_READY[x[0]]);
  root.innerHTML = (tabs.length > 1 ? '<div class="sc-tabs" role="group" aria-label="Bagian Self Care">' + tabs.map(x => '<button class="sc-tab" data-q="scTab" data-v="' + x[0] + '" data-fk="tab-' + x[0] + '" aria-pressed="' + (scTab === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div>' : '') + '<div id="scPanel">' + SC_PANEL[scTab]() + '</div>';
  if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
  void keep;
}
RENDER.selfcare = scRender;
QACT.scTab = b => { const v = b.dataset.v; if (!SC_READY[v]) return; scTab = v; scRender(); try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ } };
QACT.scTg = b => {
  const id = b.dataset.id; if (!SC_MAN.includes(id)) return; const t = today();
  scEdit(t, x => { const i = x.ck.indexOf(id); if (i >= 0) x.ck.splice(i, 1); else x.ck.push(id); });
  scRender();
};
QACT.scWater = b => {
  const dv = Number(b.dataset.v); if (!Number.isFinite(dv) || Math.abs(dv) > 1) return;
  const t = today(), e = db[t] || (db[t] = blank()), w = num(e.water) || 0, nw = Math.max(0, Math.min(15, Math.round((w + dv) * 100) / 100));
  if (nw === w && w === 0 && e.water === '') { scRender(); return; }
  e.water = String(nw); e.updated = Date.now(); queueSave();
  try { derived(); if (cur === t) populate(); } catch (x) { /* abaikan */ }
  scRender();
};
{
  const baseShowSc = showView;
  showView = function (v) { if (v === 'selfcare' && curView !== 'selfcare') scTab = 'pulse'; return baseShowSc(v); };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b82a: Object.freeze({
  state: () => scdb, clean: scClean, key: SC_KEY, tasks: SC_TASKS, score: scScore, streak: scStreak, done: scDone, merge: scMergeIn, render: scRender, tab: () => scTab, waterT: scWaterT,
  t: Object.freeze({ set: (d, fn) => scEdit(d, fn), blank: scBlank, reset: () => { scdb = scBlank(); } })
}) }));
/* v82a-end */
/* v82b-begin */
/* ===== v82b: Self Care > tab GIZI: kalkulator kalori + makro, piring ideal, matriks makanan anti-inflamasi/kolagen, Clean Plate (wajib vs hindari). Membalik: patch82.py --reverse ===== */
// Isian kalkulator diambil dari profil + berat terbaru yang sudah ada (pfState, latestBw); perubahan di sini disimpan di pengaturan Self Care, TIDAK menimpa profil.
const SC_ACT = [
  ['1', 'Sangat ringan', 1.2, 'Duduk hampir seharian, jarang olahraga'],
  ['2', 'Ringan', 1.375, 'Olahraga ringan 1-3 hari per pekan'],
  ['3', 'Sedang', 1.55, 'Olahraga 3-5 hari per pekan'],
  ['4', 'Berat', 1.725, 'Olahraga berat 6-7 hari per pekan'],
  ['5', 'Sangat berat', 1.9, 'Latihan dua kali sehari atau kerja fisik berat']
];
const SC_GOAL = [   // adj = penyesuaian kalori terhadap maintenance, pk = protein g per kg berat badan
  ['defisit', 'Turun lemak', -0.2, 2.0, 'Defisit sekitar 20%'],
  ['ringan', 'Turun pelan', -0.1, 1.8, 'Defisit sekitar 10%'],
  ['jaga', 'Jaga berat', 0, 1.6, 'Sama dengan maintenance'],
  ['naik', 'Tambah massa', 0.1, 1.8, 'Surplus sekitar 10%']
];
const SC_CALC0 = () => ({ jk: '', age: '', h: '', kg: '', act: '3', goal: 'jaga' });
function scCalcClean(c) {
  const o = SC_CALC0(); if (!c || typeof c !== 'object') return o;
  o.jk = c.jk === 'L' || c.jk === 'P' ? c.jk : '';
  const a = scNumIn(c.age, 15, 90), h = scNumIn(c.h, 120, 230), k = scNumIn(c.kg, 30, 300);
  o.age = a == null ? '' : String(Math.round(a)); o.h = h == null ? '' : String(Math.round(h * 10) / 10); o.kg = k == null ? '' : String(Math.round(k * 10) / 10);
  o.act = SC_ACT.some(x => x[0] === String(c.act)) ? String(c.act) : '3';
  o.goal = SC_GOAL.some(x => x[0] === c.goal) ? c.goal : 'jaga';
  return o;
}
function scCleanPref2(p, out) { out.calc = scCalcClean(p.calc); }
const scCalcP = () => scdb.pref.calc || (scdb.pref.calc = SC_CALC0());
function scCalcVals() {   // nilai efektif: isian sendiri, kalau kosong ambil dari profil / berat terbaru
  const c = scCalcP(), v = { jk: c.jk, age: num(c.age), h: num(c.h), kg: num(c.kg), act: c.act, goal: c.goal, from: {} };
  let pf = null; try { pf = pfd(); } catch (e) { /* belum ada */ }
  if (!v.jk && pf && (pf.jk === 'L' || pf.jk === 'P')) { v.jk = pf.jk; v.from.jk = 1; }
  if (v.age == null && pf && num(pf.usia) != null) { v.age = num(pf.usia); v.from.age = 1; }
  if (v.h == null && pf && num(pf.tinggi) != null) { v.h = num(pf.tinggi); v.from.h = 1; }
  if (v.kg == null) { let bw = null; try { bw = latestBw(); } catch (e) { /* belum ada */ } if (bw && bw.v != null) { v.kg = bw.v; v.from.kg = 1; } }
  return v;
}
function scCalc(v) {
  const miss = [];
  if (v.jk !== 'L' && v.jk !== 'P') miss.push('jenis kelamin');
  if (v.age == null || v.age < 15 || v.age > 90) miss.push('usia 15-90');
  if (v.h == null || v.h < 120 || v.h > 230) miss.push('tinggi 120-230 cm');
  if (v.kg == null || v.kg < 30 || v.kg > 300) miss.push('berat 30-300 kg');
  if (miss.length) return { ok: false, miss };
  const bmr = 10 * v.kg + 6.25 * v.h - 5 * v.age + (v.jk === 'L' ? 5 : -161);
  const ac = SC_ACT.find(x => x[0] === v.act) || SC_ACT[2], gl = SC_GOAL.find(x => x[0] === v.goal) || SC_GOAL[2];
  const tdee = bmr * ac[2], target = Math.round(tdee * (1 + gl[2]));
  const pg = Math.round(gl[3] * v.kg), pk = pg * 4;
  let fk = Math.round(target * 0.25), fg = Math.round(fk / 9); const fmin = Math.round(0.6 * v.kg);
  if (fg < fmin) { fg = fmin; fk = fg * 9; }
  let ck = target - pk - fk, cg = Math.round(ck / 4); const low = ck < 0;
  if (cg < 0) { cg = 0; ck = 0; }
  const tot = pk + fk + ck || 1;
  return { ok: true, bmr: Math.round(bmr), tdee: Math.round(tdee), target, below: target < bmr, act: ac, goal: gl,
    P: { g: pg, k: pk, p: Math.round(pk / tot * 100) }, F: { g: fg, k: fk, p: Math.round(fk / tot * 100) }, C: { g: cg, k: ck, p: Math.round(ck / tot * 100) }, low };
}
function scChips(act, items, cur, lab) {
  return '<div class="sc-chips" role="group" aria-label="' + esc(lab) + '">' + items.map(i => '<button class="sc-chip" data-q="' + act + '" data-v="' + esc(i[0]) + '" data-fk="' + act + '-' + esc(i[0]) + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + esc(i[1]) + '</button>').join('') + '</div>';
}
function scCalcCard() {
  const v = scCalcVals(), r = scCalc(v), f = k => v.from[k] ? ' <em class="sc-from">dari profil</em>' : '';
  const inp = (k, lab, val, ph, mode) => '<label class="sc-fl"><span>' + lab + f(k) + '</span><input class="sc-in" data-sck="' + k + '" data-fk="in-' + k + '" type="text" inputmode="' + mode + '" autocomplete="off" placeholder="' + ph + '" value="' + (val == null ? '' : esc(String(val))) + '"></label>';
  let h = '<section class="sc-card"><h3>Kalkulator kalori dan makro</h3><p class="sc-sub">Perkiraan kebutuhan harian (rumus Mifflin-St Jeor). Isian awal diambil dari profil dan berat terbaru Anda.</p>' +
    scChips('scJk', [['L', 'Pria'], ['P', 'Wanita']], v.jk, 'Jenis kelamin') +
    '<div class="sc-grid3">' + inp('age', 'Usia', v.age, 'tahun', 'numeric') + inp('h', 'Tinggi (cm)', v.h, 'cm', 'decimal') + inp('kg', 'Berat (kg)', v.kg, 'kg', 'decimal') + '</div>' +
    '<p class="sc-lab">Aktivitas</p>' + scChips('scAct', SC_ACT.map(x => [x[0], x[1]]), v.act, 'Tingkat aktivitas') + '<p class="sc-fine" id="scActD">' + esc((SC_ACT.find(x => x[0] === v.act) || SC_ACT[2])[3]) + '</p>' +
    '<p class="sc-lab">Tujuan</p>' + scChips('scGoal', SC_GOAL.map(x => [x[0], x[1]]), v.goal, 'Tujuan') + '<p class="sc-fine">' + esc((SC_GOAL.find(x => x[0] === v.goal) || SC_GOAL[2])[4]) + '</p>';
  if (!r.ok) return h + '<div class="sc-res empty" role="status">Lengkapi dulu: ' + esc(r.miss.join(', ')) + '.</div></section>';
  const mac = (nm, o, cls) => '<div class="sc-mac ' + cls + '"><div class="sc-mh"><b>' + nm + '</b><span>' + o.g + ' g</span></div><div class="sc-mb" role="img" aria-label="' + nm + ' ' + o.p + ' persen kalori"><i style="width:' + Math.max(2, o.p) + '%"></i></div><small>' + o.p + '% · ' + o.k + ' kkal</small></div>';
  h += '<div class="sc-res" role="status"><div class="sc-big"><div><small>Maintenance</small><b>' + r.tdee + '</b><span>kkal per hari</span></div><div class="tg"><small>Target ' + esc(r.goal[1].toLowerCase()) + '</small><b>' + r.target + '</b><span>kkal per hari</span></div></div>' +
    mac('Protein', r.P, 'p') + mac('Lemak sehat', r.F, 'f') + mac('Karbohidrat kompleks', r.C, 'c') + '</div>';
  if (r.below) h += '<p class="sc-warn" role="alert">Target ini di bawah BMR (' + r.bmr + ' kkal). Defisit sedalam ini tidak disarankan tanpa pengawasan ahli gizi atau dokter; pilih tujuan yang lebih ringan.</p>';
  if (r.low) h += '<p class="sc-warn" role="alert">Kalori target terlalu kecil untuk protein dan lemak minimum, jadi karbohidrat dibulatkan ke 0 g. Pilih tujuan yang lebih ringan.</p>';
  return h + '<p class="sc-fine">BMR ' + r.bmr + ' kkal. Protein ' + r.goal[3] + ' g per kg berat; lemak sekitar 25% kalori (minimal 0,6 g per kg); sisanya karbohidrat. Ini perkiraan, galatnya bisa sekitar 10% per orang. Pantau berat 2-3 minggu lalu sesuaikan.</p></section>';
}
function scPlateCard() {
  const C = 2 * Math.PI * 40;
  const seg = (a, b, cls, t) => { const f = b - a; return '<circle class="' + cls + '" cx="60" cy="60" r="40" fill="none" stroke-width="34" stroke-dasharray="' + (C * f).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-C * a).toFixed(2) + '" transform="rotate(-90 60 60)"><title>' + t + '</title></circle>'; };
  return '<section class="sc-card"><h3>Piring ideal</h3><p class="sc-sub">Patokan sederhana tiap kali makan besar.</p><div class="sc-plate"><svg viewBox="0 0 120 120" role="img" aria-label="Piring: setengah sayur dan buah, seperempat protein, seperempat karbohidrat kompleks">' +
    seg(0, 0.5, 'pv', 'Sayur dan buah 50%') + seg(0.5, 0.75, 'pp', 'Protein 25%') + seg(0.75, 1, 'pk', 'Karbohidrat kompleks 25%') + '</svg>' +
    '<ul><li><i class="pv"></i><span><b>½ sayur dan buah</b><small>Beragam warna: serat, vitamin C, antioksidan</small></span></li><li><i class="pp"></i><span><b>¼ protein</b><small>Ikan, telur, ayam, tahu, tempe</small></span></li><li><i class="pk"></i><span><b>¼ karbo kompleks</b><small>Nasi merah, oats, ubi, kentang rebus</small></span></li></ul></div>' +
    '<p class="sc-fine">Tambahkan satu ibu jari lemak sehat (alpukat, minyak zaitun, kacang). Minum air putih di sela makan.</p></section>';
}
const SC_FOODS = [   // t = nama, g = tag (kol kolagen/protein, inf anti-inflamasi, ant antioksidan, kul kulit), k = zat kunci, p = porsi, n = catatan
  { t: 'Ikan berlemak (salmon, tenggiri, kembung, lemuru)', g: ['inf', 'kul'], k: 'Omega-3 EPA/DHA', p: '2-3 kali sepekan, 100-150 g', n: 'Membantu menekan peradangan dan menjaga kelembapan kulit. Pilih dipanggang, dikukus, atau direbus.' },
  { t: 'Telur utuh', g: ['kol'], k: 'Protein lengkap, kolin, vitamin D', p: '1-3 butir per hari', n: 'Kuning telur memberi vitamin A, D, dan kolin; putihnya protein bermutu tinggi.' },
  { t: 'Dada ayam tanpa kulit', g: ['kol'], k: 'Protein tinggi (prolin, glisin)', p: '100-150 g per kali makan', n: 'Asam amino bahan baku kolagen dan pemulihan otot. Hindari digoreng berulang.' },
  { t: 'Tahu dan tempe', g: ['kol', 'inf'], k: 'Protein nabati, isoflavon', p: '100-150 g per hari', n: 'Tempe difermentasi sehingga lebih mudah dicerna. Pilih yang dikukus, dipanggang, atau ditumis ringan.' },
  { t: 'Kaldu tulang', g: ['kol'], k: 'Gelatin (glisin, prolin)', p: '1 mangkuk, beberapa kali sepekan', n: 'Sumber gelatin. Bukti manfaat langsungnya ke kulit masih terbatas; anggap pelengkap, bukan pengganti protein.' },
  { t: 'Jambu biji', g: ['ant', 'kul'], k: 'Vitamin C sangat tinggi', p: '1 buah sedang', n: 'Vitamin C diperlukan tubuh untuk membentuk kolagen. Seringkali lebih tinggi dari jeruk per buah.' },
  { t: 'Paprika merah', g: ['ant', 'kul'], k: 'Vitamin C, beta-karoten', p: '½-1 buah', n: 'Lebih kaya vitamin C bila dimakan mentah atau dimasak sebentar.' },
  { t: 'Jeruk dan jeruk nipis', g: ['ant'], k: 'Vitamin C, flavonoid', p: '1 buah atau perasan di air', n: 'Pilih buah utuh dibanding jus kemasan bergula.' },
  { t: 'Brokoli', g: ['inf', 'ant'], k: 'Sulforafan, vitamin C dan K', p: '1 mangkuk kecil', n: 'Kukus 3-5 menit agar zat bermanfaatnya tidak banyak hilang.' },
  { t: 'Bayam dan kangkung', g: ['ant'], k: 'Magnesium, folat, lutein', p: '1-2 genggam', n: 'Magnesium membantu relaksasi otot dan tidur lebih nyenyak.' },
  { t: 'Alpukat', g: ['inf', 'kul'], k: 'Lemak tak jenuh tunggal, vitamin E', p: '¼-½ buah', n: 'Membantu penyerapan vitamin larut lemak (A, D, E, K).' },
  { t: 'Almond dan kenari', g: ['inf', 'kul'], k: 'Vitamin E, lemak sehat (kenari: omega-3 ALA)', p: 'Segenggam kecil (±30 g)', n: 'Kalorinya padat; takar porsinya. Pilih yang tanpa garam dan tanpa gula.' },
  { t: 'Chia dan biji rami', g: ['inf'], k: 'Omega-3 ALA, serat', p: '1-2 sendok makan', n: 'Rendam dulu atau campur ke oats dan yogurt. Biji rami lebih baik digiling.' },
  { t: 'Ubi jalar', g: ['ant', 'kul'], k: 'Beta-karoten, karbohidrat kompleks', p: '1 buah sedang', n: 'Indeks glikemik lebih rendah bila direbus atau dikukus dibanding dipanggang.' },
  { t: 'Tomat masak', g: ['ant', 'kul'], k: 'Likopen', p: '1-2 buah atau saus tanpa gula', n: 'Likopen lebih mudah diserap saat dimasak dengan sedikit minyak. Bukan pengganti tabir surya.' },
  { t: 'Kunyit', g: ['inf'], k: 'Kurkumin', p: '½-1 sendok teh bubuk dalam masakan', n: 'Penyerapan naik bila bersama lada hitam dan lemak. Ragukan klaim "obat"; ini bumbu pendukung.' },
  { t: 'Jahe', g: ['inf'], k: 'Gingerol', p: '1-2 ruas jari dalam minuman atau masakan', n: 'Hangat dan menenangkan; baik sebagai pengganti minuman bergula.' },
  { t: 'Teh hijau tanpa gula', g: ['ant', 'inf'], k: 'Katekin (EGCG)', p: '1-3 cangkir, tidak mendekati jam tidur', n: 'Mengandung kafein; batasi sore dan malam. Hindari bersamaan dengan suplemen zat besi.' },
  { t: 'Pepaya', g: ['ant', 'kul'], k: 'Vitamin C dan A', p: '1 potong besar', n: 'Ringan di perut dan kaya serat.' },
  { t: 'Bawang putih', g: ['inf'], k: 'Senyawa sulfur (alisin)', p: '1-2 siung dalam masakan', n: 'Cincang dan diamkan 10 menit sebelum dimasak agar senyawanya terbentuk.' },
  { t: 'Buah beri (stroberi, blueberry)', g: ['ant'], k: 'Antosianin, vitamin C', p: '1 mangkuk kecil', n: 'Beku pun baik dan sering lebih murah.' },
  { t: 'Oats dan nasi merah', g: ['inf'], k: 'Serat, karbohidrat kompleks', p: '½-1 cangkir matang', n: 'Pelepasan gula lebih lambat sehingga lonjakan insulin lebih ringan.' },
  { t: 'Biji labu dan kacang mete', g: ['kul'], k: 'Zink', p: 'Segenggam kecil', n: 'Zink membantu penyembuhan luka dan pengaturan minyak kulit.' },
  { t: 'Yogurt tanpa gula', g: ['inf'], k: 'Probiotik, protein', p: '½-1 cangkir', n: 'Pilih yang plain; tambah buah sendiri.' }
];
const SC_FTAGS = [['all', 'Semua'], ['kol', 'Kolagen dan protein'], ['inf', 'Anti-inflamasi'], ['ant', 'Antioksidan'], ['kul', 'Kulit']];
let scFTag = 'all', scFQ = '';
const scNorm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function scFoodList() {
  const q = scNorm(scFQ), tk = q ? q.split(' ') : [];
  return SC_FOODS.filter(x => (scFTag === 'all' || x.g.includes(scFTag)) && (!tk.length || tk.every(w => scNorm(x.t + ' ' + x.k + ' ' + x.n).includes(w))));
}
function scFoodRows() {
  const l = scFoodList();
  return l.length ? l.map(x => '<details class="sc-fd"><summary><span class="t">' + esc(x.t) + '</span><span class="c">' + esc(x.k) + '</span></summary><div class="sc-db"><p><b>Porsi.</b> ' + esc(x.p) + '</p><p>' + esc(x.n) + '</p><div class="sc-tg">' + x.g.map(g => '<i>' + esc((SC_FTAGS.find(z => z[0] === g) || [0, g])[1]) + '</i>').join('') + '</div></div></details>').join('') : '<p class="sc-empty">Tidak ada makanan yang cocok. Coba kata lain atau pilih "Semua".</p>';
}
function scMatrixCard() {
  return '<section class="sc-card"><h3>Matriks makanan</h3><p class="sc-sub">Makanan yang membantu regenerasi kulit dan sendi serta menekan peradangan. Ketuk untuk melihat porsi.</p>' +
    '<input class="sc-in sc-q" id="scFQ" data-fk="fq" type="search" inputmode="search" autocomplete="off" placeholder="Cari makanan atau zat, mis. vitamin C" aria-label="Cari makanan" value="' + esc(scFQ) + '">' +
    scChips('scFTag', SC_FTAGS, scFTag, 'Saring makanan') + '<p class="sc-fine" id="scFCnt" role="status">' + scFoodList().length + ' dari ' + SC_FOODS.length + ' makanan</p><div id="scFRows">' + scFoodRows() + '</div></section>';
}
const SC_PLATE = [   // dari blueprint: wajib dimakan vs wajib dihindari + alasan ilmiah
  { t: 'Protein', ok: 'Dada ayam, ikan berlemak (salmon/tenggiri), telur utuh, tahu/tempe, whey isolate.', no: 'Daging olahan tinggi pengawet (sosis, nugget pabrikan) dan daging tinggi lemak jenuh.', why: 'Protein menyediakan asam amino (prolin dan glisin) sebagai bahan baku utama pembentukan kolagen dan pemulihan otot.' },
  { t: 'Karbohidrat', ok: 'Nasi merah/hitam, oats, ubi jalar, kentang rebus, quinoa, biji-bijian utuh.', no: 'Gula rafinasi, tepung terigu putih, kue manis kemasan, minuman bersoda dan boba.', why: 'Mencegah lonjakan insulin drastis (glikemik tinggi) yang memicu peradangan kulit; glikasi merusak elastisitas kulit.' },
  { t: 'Lemak sehat', ok: 'Alpukat, minyak zaitun extra virgin, almond/kenari, chia.', no: 'Minyak goreng curah yang dipakai berulang (lemak trans) dan margarin padat.', why: 'Menjaga keseimbangan hormon, pelumasan sendi, dan penyerapan vitamin larut lemak (A, D, E, K).' },
  { t: 'Hidrasi', ok: 'Air putih, air infus lemon, teh hijau tanpa gula.', no: 'Minuman energi tinggi kafein dan gula, alkohol, jus kemasan dengan pemanis tambahan.', why: 'Mendukung kerja ginjal, menjaga turgor (kekenyalan) kulit, dan mencegah kelesuan metabolik.' }
];
let scPlOpen = 'Protein';
function scCleanCard() {
  return '<section class="sc-card"><h3>Clean Plate: makan ini, hindari itu</h3><p class="sc-sub">Ketuk kategori untuk melihat perbandingan dan alasannya.</p>' + SC_PLATE.map(x => {
    const on = scPlOpen === x.t;
    return '<div class="sc-cp' + (on ? ' on' : '') + '"><button class="sc-cph" data-q="scPl" data-v="' + esc(x.t) + '" data-fk="pl-' + esc(x.t) + '" aria-expanded="' + on + '"><b>' + esc(x.t) + '</b><span aria-hidden="true">' + (on ? '−' : '+') + '</span></button>' +
      (on ? '<div class="sc-cpb"><div class="ok"><small>Target optimal</small><p>' + esc(x.ok) + '</p></div><div class="no"><small>Zona merah</small><p>' + esc(x.no) + '</p></div><p class="why"><b>Alasan ilmiah.</b> ' + esc(x.why) + '</p></div>' : '') + '</div>';
  }).join('') + '</section>';
}
function scGizi() {
  return scCalcCard() + scPlateCard() + scMatrixCard() + scCleanCard() +
    '<button class="sc-link" data-goto="nutrition">Rencana menu mingguan dan daftar belanja &rsaquo;</button>' +
    '<p class="sc-fine">Panduan gizi umum, bukan pengganti ahli gizi atau dokter. Bila punya penyakit kronis, hamil, atau alergi makanan, konsultasikan dulu.</p>';
}
SC_PANEL.gizi = scGizi; SC_READY.gizi = true;
QACT.scJk = b => { scCalcP().jk = b.dataset.v === 'P' ? 'P' : 'L'; scSave(); scRender(); };
QACT.scAct = b => { if (SC_ACT.some(x => x[0] === b.dataset.v)) { scCalcP().act = b.dataset.v; scSave(); scRender(); } };
QACT.scGoal = b => { if (SC_GOAL.some(x => x[0] === b.dataset.v)) { scCalcP().goal = b.dataset.v; scSave(); scRender(); } };
QACT.scFTag = b => { if (SC_FTAGS.some(x => x[0] === b.dataset.v)) { scFTag = b.dataset.v; scRender(); } };
QACT.scPl = b => { scPlOpen = scPlOpen === b.dataset.v ? '' : b.dataset.v; scRender(); };
document.addEventListener('change', ev => {
  const el = ev.target, k = el && el.dataset && el.dataset.sck; if (!k || !['age', 'h', 'kg'].includes(k)) return;
  const raw = String(el.value).replace(',', '.').trim(), c = scCalcP();
  if (raw === '') c[k] = ''; else { const lim = { age: [15, 90], h: [120, 230], kg: [30, 300] }[k], n = scNumIn(raw, lim[0], lim[1]); if (n == null) { toast('Isi angka ' + lim[0] + ' sampai ' + lim[1]); scRender(); return; } c[k] = String(k === 'age' ? Math.round(n) : Math.round(n * 10) / 10); }
  scSave(); scRender();
});
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || el.id !== 'scFQ') return;
  scFQ = el.value; const r = $('#scFRows'), c = $('#scFCnt'); if (r) r.innerHTML = scFoodRows(); if (c) c.textContent = scFoodList().length + ' dari ' + SC_FOODS.length + ' makanan';
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b82b: Object.freeze({ calc: scCalc, vals: scCalcVals, foods: SC_FOODS, list: scFoodList, plate: SC_PLATE, clean: scCalcClean, act: SC_ACT, goal: SC_GOAL, setQ: q => { scFQ = q; }, setTag: t => { scFTag = t; } }) }));
/* v82b-end */
/* v82c-begin */
/* ===== v82c: Self Care > tab VITAMIN: jadwal vitamin hari ini (+ beruntun), perencana tumpukan (waktu serap + bentrok), cek gejala kekurangan, panduan mikronutrien. Membalik: patch82x.py c --reverse ===== */
// Data baru: days[d].sp = id suplemen yang sudah diminum hari itu; pref.stack = {id: waktu} tumpukan pilihan; pref.sym = id gejala yang dicentang.
// Semua ikut cadangan JSON, impor, hapus-semua lewat scClean (kunci `selfcare`). Tugas "Vitamin dan suplemen" di Dashboard otomatis tercentang bila semua tumpukan hari ini diminum.
const SC_SLOTS = [['pagi', 'Pagi', 'Setelah sarapan'], ['siang', 'Siang', 'Bersama makan siang'], ['mlm', 'Malam', 'Bersama makan malam'], ['tidur', 'Sebelum tidur', '30 menit sebelum tidur']];
const SC_SUPS = [   // slot = waktu bawaan; fat = larut lemak (sebaiknya bersama makan)
  { id: 'vc', t: 'Vitamin C', slot: 'pagi', q: 'Setelah makan', fat: 0, how: 'Pagi hari, setelah makan. Larut air, jadi kelebihannya dibuang lewat urin; dosis besar sebaiknya dibagi.', fn: 'Kofaktor utama sintesis kolagen, mencerahkan kulit, antioksidan penangkal radikal bebas.', src: 'Jambu biji, paprika merah, jeruk, brokoli.', note: 'Dosis di atas 1 g sekali minum bisa memicu mual atau diare. Batas atas aman dewasa 2.000 mg per hari.' },
  { id: 'd3k2', t: 'Vitamin D3 + K2', slot: 'siang', q: 'Dengan lemak sehat', fat: 1, how: 'Siang hari, bersama makanan yang mengandung lemak sehat (larut lemak).', fn: 'Memperkuat imunitas, kesehatan tulang, penyerapan kalsium, dan regulasi mood.', src: 'Paparan matahari pagi, kuning telur, ikan berlemak.', note: 'Vitamin K berinteraksi dengan obat pengencer darah (mis. warfarin): tanya dokter lebih dulu. Batas atas vitamin D dewasa 100 mcg (4.000 IU) per hari.' },
  { id: 'om3', t: 'Omega-3 (EPA/DHA)', slot: 'siang', q: 'Bersama makan', fat: 1, how: 'Bersama makan siang atau makan malam.', fn: 'Menjaga kelembapan alami kulit dari dalam, mengurangi peradangan sendi dan jerawat meradang.', src: 'Ikan salmon, lemuru, tenggiri, suplemen minyak ikan berkualitas.', note: 'Dosis tinggi (di atas sekitar 3 g EPA+DHA per hari) dapat memperlambat pembekuan darah. Bila memakai pengencer darah atau akan operasi, tanyakan dokter.' },
  { id: 'zn', t: 'Zink (Zinc picolinate)', slot: 'mlm', q: 'Jauh dari kalsium dan susu', fat: 0, how: 'Malam hari. Hindari bersamaan dengan kalsium atau susu agar penyerapan maksimal. Bila perut mual, minum bersama makanan kecil.', fn: 'Mempercepat penyembuhan luka dan jerawat, mengatur produksi sebum, sintesis protein.', src: 'Daging merah, biji labu, kacang mete, kerang.', note: 'Di atas 40 mg per hari dalam jangka panjang dapat menurunkan kadar tembaga tubuh.' },
  { id: 'mg', t: 'Magnesium (glisinat/malat)', slot: 'tidur', q: '30 menit sebelum tidur', fat: 0, how: '30 menit sebelum tidur malam. Bentuk glisinat atau malat umumnya lebih lembut di perut.', fn: 'Relaksasi otot, memperbaiki kualitas tidur dalam, meredakan stres kronis.', src: 'Bayam, cokelat hitam murni, alpukat, almond.', note: 'Dari suplemen, batas atas dewasa 350 mg per hari; berlebihan memicu diare. Penderita gangguan ginjal perlu bertanya ke dokter.' },
  { id: 'ca', t: 'Kalsium', slot: 'siang', q: 'Bersama makan, jauh dari zink', fat: 0, how: 'Bersama makan, dosis sekali minum tidak lebih dari sekitar 500 mg. Beri jarak minimal 2 jam dari zink dan zat besi.', fn: 'Menjaga tulang dan gigi, membantu kontraksi otot dan saraf.', src: 'Susu, yogurt, ikan teri, tahu, sayur hijau.', note: 'Utamakan dari makanan. Batas atas dewasa 2.500 mg per hari (2.000 mg setelah usia 50 tahun).' },
  { id: 'fe', t: 'Zat besi', slot: 'pagi', q: 'Dengan vitamin C, jauh dari teh dan kopi', fat: 0, how: 'Paling baik saat perut kosong atau bersama vitamin C; jauhkan dari teh, kopi, susu, dan kalsium. Bila perut tidak nyaman, minum bersama makanan.', fn: 'Pembentukan hemoglobin, energi, kesehatan rambut dan kuku.', src: 'Daging merah, hati ayam, kerang, bayam, tempe.', note: 'Minum HANYA bila terbukti kurang (hasil lab) atau dianjurkan dokter: kelebihan zat besi berbahaya. Batas atas dewasa 45 mg per hari.' }
];
const SC_SUP_IDS = SC_SUPS.map(x => x.id), SC_SLOT_IDS = SC_SLOTS.map(x => x[0]);
const SC_CONF = [['zn', 'ca', 'keduanya bersaing diserap'], ['zn', 'fe', 'keduanya bersaing diserap'], ['ca', 'fe', 'kalsium menghambat penyerapan zat besi']];
const SC_NUT = {   // zat yang bisa muncul di hasil cek gejala
  vc: { t: 'Vitamin C', src: 'Jambu biji, paprika merah, jeruk, brokoli, pepaya.', lab: '', n: '' },
  vd: { t: 'Vitamin D', src: 'Sinar matahari pagi, kuning telur, ikan berlemak (salmon, sarden).', lab: 'Kadar vitamin D (25-OH) dalam darah.', n: 'Banyak orang kurang vitamin D walau tinggal di negara tropis karena sedikit terkena matahari.' },
  om3: { t: 'Omega-3', src: 'Salmon, tenggiri, lemuru, kenari, chia.', lab: '', n: '' },
  zn: { t: 'Zink', src: 'Daging merah, kerang, biji labu, kacang mete, tahu dan tempe.', lab: 'Kadar zink serum, bila dokter menilai perlu.', n: '' },
  mg: { t: 'Magnesium', src: 'Bayam, cokelat hitam, alpukat, almond, kacang-kacangan.', lab: '', n: 'Kram dan susah tidur juga sering karena kurang cairan, kurang tidur, atau stres.' },
  fe: { t: 'Zat besi', src: 'Daging merah, hati ayam, kerang, bayam, tempe; makan bersama sumber vitamin C.', lab: 'Hemoglobin dan feritin (cadangan zat besi).', n: 'Jangan minum suplemen zat besi tanpa hasil lab atau saran dokter.' },
  b12: { t: 'Vitamin B12', src: 'Daging, ikan, telur, susu dan olahannya (sumber utama hewani).', lab: 'Kadar vitamin B12 dalam darah.', n: 'Lebih berisiko pada yang vegetarian ketat atau lansia.' },
  bio: { t: 'Biotin (B7)', src: 'Telur matang, kacang-kacangan, alpukat, ubi jalar, ikan.', lab: '', n: 'Kekurangan nyata jarang. Kuku rapuh lebih sering karena kulit kuku kering, sering terkena air dan deterjen, atau kurang protein dan zat besi.' },
  va: { t: 'Vitamin A', src: 'Wortel, ubi jalar, bayam, hati ayam, telur, pepaya.', lab: '', n: 'Jangan dosis berlebih, terutama saat hamil.' }
};
const SC_NUT_ORDER = Object.keys(SC_NUT);
const SC_SYM = [   // h = [zat, bobot 1-3]; dr = sebaiknya diperiksakan ke dokter
  { id: 'kuku', t: 'Kuku rapuh atau mudah patah', h: [['zn', 2], ['bio', 2], ['fe', 1]] },
  { id: 'kusam', t: 'Kulit kusam, tidak bercahaya', h: [['vc', 2], ['om3', 1], ['fe', 1]] },
  { id: 'gusi', t: 'Gusi mudah berdarah atau luka lambat sembuh', h: [['vc', 3], ['zn', 2]] },
  { id: 'jerawat', t: 'Jerawat meradang yang sulit sembuh', h: [['zn', 2], ['om3', 1], ['vd', 1]] },
  { id: 'kering', t: 'Kulit kering, kasar, sering gatal', h: [['om3', 2], ['va', 1]] },
  { id: 'rontok', t: 'Rambut rontok lebih banyak dari biasa', h: [['fe', 2], ['zn', 2], ['bio', 1], ['vd', 1]] },
  { id: 'lelah', t: 'Mudah lelah, pucat, jantung berdebar', h: [['fe', 3], ['b12', 2]], dr: 1 },
  { id: 'tidur', t: 'Sulit tidur nyenyak, gelisah', h: [['mg', 2]] },
  { id: 'kram', t: 'Otot kram atau berkedut', h: [['mg', 3]] },
  { id: 'sakit', t: 'Sering sakit (flu, batuk berulang)', h: [['vd', 2], ['zn', 2], ['vc', 1]] },
  { id: 'mood', t: 'Mood turun, kurang semangat', h: [['vd', 2], ['om3', 1], ['b12', 1], ['mg', 1]] },
  { id: 'tulang', t: 'Nyeri tulang atau otot terasa lemah', h: [['vd', 3], ['mg', 1]], dr: 1 },
  { id: 'sendi', t: 'Sendi kaku atau nyeri', h: [['om3', 2], ['vd', 1]] },
  { id: 'bibir', t: 'Bibir pecah, sudut mulut sobek', h: [['fe', 1], ['b12', 1], ['zn', 1]] },
  { id: 'semut', t: 'Kesemutan di tangan atau kaki', h: [['b12', 3], ['mg', 1]], dr: 1 },
  { id: 'mata', t: 'Mata kering atau perih', h: [['om3', 2], ['va', 2]] },
  { id: 'fokus', t: 'Sulit fokus, otak terasa berkabut', h: [['b12', 2], ['om3', 1], ['fe', 1], ['vd', 1]] }
];
const SC_SYM_IDS = SC_SYM.map(x => x.id);
/* ---------- data: bersih, tumpukan, hari ---------- */
const SC_DAYX = [];   // pembersih tambahan per hari (tahap lanjutan menambah di sini): { clean(r, o), has(x) }
function scCleanDay2(r, o) { SC_DAYX.forEach(h => h.clean(r, o)); }
function scDayHas2(x) { return SC_DAYX.some(h => h.has(x)); }
SC_DAYX.push({
  clean: (r, o) => { o.sp = (Array.isArray(r.sp) ? r.sp : []).filter((x, i, a) => SC_SUP_IDS.includes(x) && a.indexOf(x) === i); },
  has: x => !!(x.sp && x.sp.length)
});
{
  const baseP = scCleanPref2;
  scCleanPref2 = function (p, out) {
    baseP(p, out);
    out.stack = {};
    if (p.stack && typeof p.stack === 'object' && !Array.isArray(p.stack)) SC_SUPS.forEach(x => { const s = p.stack[x.id]; if (SC_SLOT_IDS.includes(s)) out.stack[x.id] = s; });
    out.sym = (Array.isArray(p.sym) ? p.sym : []).filter((x, i, a) => SC_SYM_IDS.includes(x) && a.indexOf(x) === i);
  };
}
const scStackMap = () => scdb.pref.stack || (scdb.pref.stack = {});
const scStackIds = () => SC_SUPS.filter(x => scStackMap()[x.id]).map(x => x.id);
const scSupSlot = id => scStackMap()[id] || (SC_SUPS.find(x => x.id === id) || {}).slot;
const scSymSel = () => scdb.pref.sym || (scdb.pref.sym = []);
const scSupName = id => (SC_SUPS.find(x => x.id === id) || { t: id }).t;
const scSlotName = s => (SC_SLOTS.find(x => x[0] === s) || [0, s])[1];
function scSupTaken(d) { const sp = scDay(d).sp || []; return scStackIds().filter(id => sp.includes(id)); }
function scSupAllDone(d) { const st = scStackIds(); return st.length > 0 && scSupTaken(d).length === st.length; }
function scSupStreak() {
  let d = today(), n = 0; if (!scSupAllDone(d)) d = addDays(d, -1);
  while (n < 400 && scSupAllDone(d)) { n++; d = addDays(d, -1); }
  return n;
}
function scSupFix(x) {   // selaraskan tugas Dashboard "supp" dengan tumpukan; true bila ada perubahan
  const st = scStackIds(); if (!st.length) return false;
  const sp = x.sp || [], all = st.every(i => sp.includes(i)), k = x.ck.indexOf('supp');
  if (all && k < 0) { x.ck.push('supp'); return true; }
  if (!all && k >= 0) { x.ck.splice(k, 1); return true; }
  return false;
}
function scSupCheck(map) {   // map = {id: waktu}; hasil: warn (bentrok / kurang pas), tip (cocok)
  const ids = SC_SUPS.filter(x => map[x.id]).map(x => x.id), warn = [], tip = [];
  const near = (a, b) => map[a] === map[b] || (['mlm', 'tidur'].includes(map[a]) && ['mlm', 'tidur'].includes(map[b]));
  SC_CONF.forEach(c => {
    if (ids.includes(c[0]) && ids.includes(c[1]) && near(c[0], c[1])) warn.push(scSupName(c[0]) + ' dan ' + scSupName(c[1]) + ' diminum berdekatan (' + scSlotName(map[c[0]]) + '): ' + c[2] + '. Beri jarak minimal 2 jam, mis. pindahkan salah satunya.');
  });
  SC_SUPS.forEach(x => { if (x.fat && map[x.id] === 'tidur') warn.push(x.t + ' larut lemak: lebih baik bersama makan, bukan menjelang tidur.'); });
  if (ids.includes('vc') && ids.includes('fe') && map.vc === map.fe) tip.push('Vitamin C dan zat besi di waktu yang sama: vitamin C membantu penyerapan zat besi.');
  if (ids.includes('d3k2') && ids.includes('ca') && map.d3k2 === map.ca) tip.push('Vitamin D membantu tubuh menyerap kalsium: pas diminum bersama.');
  if (ids.includes('mg') && map.mg === 'tidur') tip.push('Magnesium sebelum tidur adalah waktu yang disarankan untuk tidur lebih nyenyak.');
  return { warn, tip };
}
function scSymRes(sel) {   // petunjuk zat dari gejala yang dicentang, urut skor
  const acc = {};
  SC_SYM.filter(s => sel.includes(s.id)).forEach(s => s.h.forEach(h => { const a = acc[h[0]] || (acc[h[0]] = { id: h[0], score: 0, syms: [] }); a.score += h[1]; a.syms.push(s.t); }));
  return Object.keys(acc).map(k => acc[k]).sort((a, b) => b.score - a.score || SC_NUT_ORDER.indexOf(a.id) - SC_NUT_ORDER.indexOf(b.id))
    .map(x => Object.assign({}, x, { level: x.score >= 5 ? 'kuat' : x.score >= 3 ? 'sedang' : 'awal', n: SC_NUT[x.id] }));
}
/* ---------- tampilan ---------- */
function scSupRow(id, on) {
  const s = SC_SUPS.find(x => x.id === id);
  return '<button class="sc-task' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + on + '" data-q="scSupTake" data-id="' + id + '" data-fk="sp-' + id + '"><span class="sc-box" aria-hidden="true">' + SC_CHK + '</span><span class="t"><b>' + esc(s.t) + '</b><small>' + esc(s.q) + '</small></span></button>';
}
function scSupToday() {
  const t = today(), st = scStackIds();
  if (!st.length) return '<section class="sc-card"><h3>Jadwal vitamin hari ini</h3><div class="sc-res empty" role="status">Belum ada tumpukan. Pilih vitamin yang Anda minum di "Atur tumpukan" di bawah; jadwal waktu terbaiknya muncul di sini.</div></section>';
  const tk = scSupTaken(t), n = scSupStreak(), f = tk.length / st.length;
  const groups = SC_SLOTS.map(sl => { const items = st.filter(id => scSupSlot(id) === sl[0]); return items.length ? '<p class="sc-lab">' + esc(sl[1]) + ' · ' + esc(sl[2]) + '</p>' + items.map(id => scSupRow(id, tk.includes(id))).join('') : ''; }).join('');
  const ds = [6, 5, 4, 3, 2, 1, 0].map(i => addDays(t, -i)), fr = ds.map(d => scSupTaken(d).length / st.length);
  const bars = ds.map((d, i) => '<div class="sc-b' + (d === t ? ' now' : '') + '"><i style="height:' + (fr[i] > 0 ? Math.max(6, Math.round(fr[i] * 100)) : 0) + '%" class="' + (fr[i] >= 1 ? 'hi' : fr[i] >= 0.5 ? 'mid' : fr[i] > 0 ? 'lo' : 'nil') + '"></i><span>' + HARI[pd(d).getDay()].slice(0, 1) + '</span><b>' + (fr[i] > 0 ? scSupTaken(d).length + '/' + st.length : '–') + '</b></div>').join('');
  return '<section class="sc-card"><h3>Jadwal vitamin hari ini</h3><p class="sc-sub"><b>' + tk.length + ' dari ' + st.length + '</b> sudah diminum' + (n ? ' · beruntun ' + n + ' hari' : '') + '</p>' +
    '<div class="sc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + st.length + '" aria-valuenow="' + tk.length + '" aria-label="Vitamin diminum hari ini"><i style="width:' + Math.round(f * 100) + '%"></i></div>' + groups +
    (tk.length < st.length ? '<div class="sc-row" style="margin-top:10px"><button class="sc-btn" data-q="scSupAll" data-fk="sp-all">Tandai semua sudah diminum</button></div>' : '<p class="sc-tipok">Semua vitamin hari ini sudah diminum. Tugas "Vitamin dan suplemen" di Hari ini ikut tercentang.</p>') +
    '<p class="sc-lab">7 hari terakhir</p><div class="sc-chart" role="img" aria-label="Vitamin diminum tujuh hari terakhir: ' + ds.map((d, i) => HARI[pd(d).getDay()] + ' ' + scSupTaken(d).length + ' dari ' + st.length).join(', ') + '">' + bars + '</div>' +
    '<p class="sc-fine">Dihitung terhadap tumpukan Anda saat ini. Hijau = semua diminum.</p></section>';
}
function scSupPlan() {
  const m = scStackMap(), ids = scStackIds(), chk = scSupCheck(m);
  const chips = '<div class="sc-chips" role="group" aria-label="Vitamin yang Anda minum">' + SC_SUPS.map(x => '<button class="sc-chip" data-q="scSupTog" data-v="' + x.id + '" data-fk="st-' + x.id + '" aria-pressed="' + !!m[x.id] + '">' + esc(x.t.replace(/ \(.*\)$/, '')) + '</button>').join('') + '</div>';
  const rows = ids.map(id => {
    const s = SC_SUPS.find(x => x.id === id);
    return '<div class="sc-sp"><b>' + esc(s.t) + '</b><small>' + esc(s.how) + '</small><div class="sc-chips" role="group" aria-label="Waktu minum ' + esc(s.t) + '">' +
      SC_SLOTS.map(sl => '<button class="sc-chip" data-q="scSupSlot" data-id="' + id + '" data-v="' + sl[0] + '" data-fk="sl-' + id + '-' + sl[0] + '" aria-pressed="' + (m[id] === sl[0]) + '">' + esc(sl[1]) + '</button>').join('') + '</div>' +
      (m[id] !== s.slot ? '<small>Waktu yang disarankan: ' + esc(scSlotName(s.slot)) + '.</small>' : '') + '</div>';
  }).join('');
  return '<section class="sc-card"><h3>Atur tumpukan vitamin</h3><p class="sc-sub">Pilih yang Anda minum. Waktu terbaik penyerapan terisi otomatis; ubah bila jadwal Anda berbeda.</p>' + chips +
    (ids.length ? rows : '<p class="sc-empty">Belum ada yang dipilih.</p>') +
    chk.warn.map(w => '<p class="sc-warn" role="alert">' + esc(w) + '</p>').join('') + chk.tip.map(w => '<p class="sc-tipok">' + esc(w) + '</p>').join('') +
    (ids.length && !chk.warn.length ? '<p class="sc-fine">Tidak ada bentrok penyerapan pada jadwal ini.</p>' : '') + '</section>';
}
function scSymCard() {
  const sel = scSymSel(), res = scSymRes(sel), dr = SC_SYM.filter(s => s.dr && sel.includes(s.id));
  const rows = SC_SYM.map(s => { const on = sel.includes(s.id); return '<button class="sc-task sym' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + on + '" data-q="scSym" data-id="' + s.id + '" data-fk="sy-' + s.id + '"><span class="sc-box" aria-hidden="true">' + SC_CHK + '</span><span class="t"><b>' + esc(s.t) + '</b></span></button>'; }).join('');
  let out;
  if (!sel.length) out = '<div class="sc-res empty" role="status">Pilih satu gejala atau lebih untuk melihat zat yang mungkin terkait.</div>';
  else out = '<div class="sc-res" role="status"><b>Petunjuk dari ' + sel.length + ' gejala</b>' + res.slice(0, 5).map(r => '<div class="sc-sr"><div class="sc-sh"><b>' + esc(r.n.t) + '</b><em class="sc-lv ' + r.level + '">Petunjuk ' + r.level + '</em></div><small>Dari gejala: ' + esc(r.syms.join('; ')) + '</small><p><b>Makanan:</b> ' + esc(r.n.src) + '</p>' +
    (r.n.lab ? '<p><b>Bisa dicek:</b> ' + esc(r.n.lab) + '</p>' : '') + (r.n.n ? '<p class="sc-fine">' + esc(r.n.n) + '</p>' : '') + '</div>').join('') + '</div>';
  const urgent = dr.length ? '<p class="sc-warn" role="alert">' + esc(dr.map(s => s.t).join('; ')) + ': sebaiknya diperiksakan ke dokter (mis. tes darah), jangan hanya menebak lewat suplemen.</p>' : '';
  const many = sel.length >= 4 ? '<p class="sc-warn" role="alert">Banyak gejala sekaligus (' + sel.length + '). Periksakan ke dokter untuk mencari penyebab yang tepat.</p>' : '';
  return '<section class="sc-card"><h3>Cek gejala kekurangan</h3><p class="sc-sub">Centang gejala yang Anda alami belakangan ini. Hasilnya hanya petunjuk awal, bukan diagnosis.</p>' + rows +
    (sel.length ? '<div class="sc-row" style="margin-top:10px"><button class="sc-btn" data-q="scSymClr" data-fk="sy-clr">Hapus semua pilihan</button></div>' : '') + out + urgent + many +
    '<p class="sc-fine">Gejala yang sama bisa juga karena kurang tidur, kurang minum, stres, atau kurang protein dan kalori. Mulailah dari makanan dan pola hidup; suplemen setelah hasil lab atau saran dokter. Bila gejala menetap lebih dari 2-4 minggu, periksa ke dokter.</p></section>';
}
let scVOpen = '';
function scSupGuide() {
  return '<section class="sc-card"><h3>Panduan mikronutrien</h3><p class="sc-sub">Fungsi, waktu minum, dan sumber alami. Ketuk untuk melihat detail.</p>' + SC_SUPS.map(s => {
    const on = scVOpen === s.id;
    return '<div class="sc-cp' + (on ? ' on' : '') + '"><button class="sc-cph" data-q="scVG" data-v="' + s.id + '" data-fk="vg-' + s.id + '" aria-expanded="' + on + '"><b>' + esc(s.t) + '</b><span aria-hidden="true">' + (on ? '−' : '+') + '</span></button>' +
      (on ? '<div class="sc-vgb"><p><b>Fungsi.</b> ' + esc(s.fn) + '</p><p><b>Waktu dan cara.</b> ' + esc(s.how) + '</p><p><b>Sumber alami.</b> ' + esc(s.src) + '</p><p class="why"><b>Perhatian.</b> ' + esc(s.note) + '</p></div>' : '') + '</div>';
  }).join('') + '</section>';
}
function scVit() {
  return scSupToday() + scSupPlan() + scSymCard() + scSupGuide() +
    '<p class="sc-fine">Panduan umum, bukan resep. Angka batas atas mengacu pada rujukan umum untuk orang dewasa sehat dan bisa berbeda untuk Anda. Bila hamil, menyusui, punya penyakit kronis, atau minum obat rutin, konsultasikan dulu dengan dokter atau apoteker.</p>';
}
SC_PANEL.vit = scVit; SC_READY.vit = true;
QACT.scSupTog = b => {
  const id = b.dataset.v; if (!SC_SUP_IDS.includes(id)) return;
  const m = scStackMap(), t = today();
  if (m[id]) delete m[id]; else m[id] = SC_SUPS.find(x => x.id === id).slot;
  const d = scDay(t), probe = { ck: d.ck.slice(), sp: (d.sp || []).slice() };
  if (scSupFix(probe)) scEdit(t, x => { scSupFix(x); }); else scSave();
  scRender();
};
QACT.scSupSlot = b => {
  const id = b.dataset.id, s = b.dataset.v, m = scStackMap();
  if (!SC_SUP_IDS.includes(id) || !m[id] || !SC_SLOT_IDS.includes(s)) return;
  m[id] = s; scSave(); scRender();
};
QACT.scSupTake = b => {
  const id = b.dataset.id; if (!SC_SUP_IDS.includes(id) || !scStackMap()[id]) return;
  scEdit(today(), x => { const sp = x.sp || (x.sp = []), i = sp.indexOf(id); if (i >= 0) sp.splice(i, 1); else sp.push(id); scSupFix(x); });
  scRender();
};
QACT.scSupAll = () => {
  scEdit(today(), x => { const sp = x.sp || (x.sp = []); scStackIds().forEach(id => { if (!sp.includes(id)) sp.push(id); }); scSupFix(x); });
  scRender();
};
QACT.scSym = b => {
  const id = b.dataset.id; if (!SC_SYM_IDS.includes(id)) return;
  const s = scSymSel(), i = s.indexOf(id); if (i >= 0) s.splice(i, 1); else s.push(id);
  scSave(); scRender();
};
QACT.scSymClr = () => { scdb.pref.sym = []; scSave(); scRender(); };
QACT.scVG = b => { if (SC_SUP_IDS.includes(b.dataset.v)) { scVOpen = scVOpen === b.dataset.v ? '' : b.dataset.v; scRender(); } };
window.DL = Object.freeze(Object.assign({}, window.DL, { b82c: Object.freeze({
  sups: SC_SUPS, slots: SC_SLOTS, nut: SC_NUT, sym: SC_SYM, check: scSupCheck, res: scSymRes, stack: scStackIds, taken: scSupTaken, streak: scSupStreak, allDone: scSupAllDone, fix: scSupFix,
  setOpen: id => { scVOpen = id; }
}) }));
/* v82c-end */
/* v82d-begin */
/* ===== v82d: Self Care > tab GLOW-UP: skincare AM/PM per jenis kulit + rotasi bahan aktif (dengan jeda iritasi), audit postur dan peregangan harian, kebersihan tidur (skor, suhu, kalkulator siklus), napas terpandu (box, 4-7-8, physiological sigh) + stres. Membalik: patch82x.py d --reverse ===== */
// Data baru (semua lewat scClean, jadi ikut cadangan JSON, impor gabung, hapus-semua):
//   days[tgl]: sk (langkah skincare dicentang), ir (kulit iritasi), st (peregangan), sh (kebiasaan tidur), rt (suhu kamar C), sq (kualitas bangun 1-5), sr (stres 1-5), bw (sesi napas selesai)
//   pref: skin (sudah ada), act (tingkat toleransi bahan aktif), erg (audit meja), wake (jam bangun), bt (teknik napas terakhir)
// Tugas Dashboard yang disinkronkan: skam, skpm (langkah wajib skincare), pt (semua peregangan), br (sesi napas selesai). 'scr' dan 'sn' dipakai bersama (satu sumber).
const SC_GSUBS = [['kulit', 'Kulit'], ['postur', 'Postur'], ['tidur', 'Tidur'], ['napas', 'Napas']];
const SC_GSUB_IDS = SC_GSUBS.map(x => x[0]);
const SC_SKS = [   // w = am | pm; req = wajib untuk menandai tugas Dashboard
  { id: 'am-cl', w: 'am', k: 'cl', t: 'Pembersih (cleanser)', req: 1 },
  { id: 'am-to', w: 'am', k: 'to', t: 'Toner atau essence', req: 0 },
  { id: 'am-se', w: 'am', k: 'se', t: 'Serum antioksidan atau hidrasi', req: 0 },
  { id: 'am-mo', w: 'am', k: 'mo', t: 'Pelembap', req: 1 },
  { id: 'am-sp', w: 'am', k: 'sp', t: 'Tabir surya SPF 30 atau lebih', req: 1 },
  { id: 'pm-cl', w: 'pm', k: 'cl', t: 'Pembersih (double cleanse bila perlu)', req: 1 },
  { id: 'pm-to', w: 'pm', k: 'to', t: 'Toner atau essence', req: 0 },
  { id: 'pm-ac', w: 'pm', k: 'ac', t: 'Perawatan aktif malam ini', req: 0 },
  { id: 'pm-mo', w: 'pm', k: 'mo', t: 'Pelembap', req: 1 }
];
const SC_SK_IDS = SC_SKS.map(x => x.id);
const SC_SKT = {   // saran per jenis kulit untuk tiap langkah (panduan umum)
  normal: { cl: 'Pembersih berbusa lembut atau gel dengan pH sekitar 5,5; pijat 30 detik, bilas air suam-suam kuku.', to: 'Toner atau essence hidrasi (gliserin, hyaluronic acid); tepuk dengan tangan, tidak perlu kapas.', se: 'Serum vitamin C (antioksidan, mencerahkan) atau niacinamide; mulai dari konsentrasi rendah.', mo: 'Lotion atau gel-krim ringan yang melembapkan tanpa lengket.', sp: 'SPF 30 atau lebih, PA+++, sekitar dua ruas jari untuk wajah dan leher.' },
  kering: { cl: 'Pembersih krim atau susu yang tidak berbusa banyak dan bebas sabun keras; pagi cukup bilas air atau pembersih sangat lembut.', to: 'Essence hidrasi (hyaluronic acid, panthenol, gliserin); hindari toner beralkohol.', se: 'Serum hyaluronic acid atau ceramide; vitamin C turunan lembut bila tidak perih.', mo: 'Krim kaya dengan ceramide, squalane, atau shea butter; oleskan saat kulit masih lembap.', sp: 'Tabir surya berformula krim atau pelembap, SPF 30 atau lebih, PA+++.' },
  berminyak: { cl: 'Pembersih gel atau foaming lembut; boleh yang mengandung salisilat ringan, tetapi jangan mencuci muka lebih dari 2 kali sehari.', to: 'Toner ringan (niacinamide, zinc PCA, teh hijau) tanpa alkohol keras.', se: 'Niacinamide 4-5% untuk membantu mengontrol minyak dan tampilan pori.', mo: 'Gel atau lotion ringan non-komedogenik. Kulit berminyak tetap butuh pelembap.', sp: 'Tabir surya gel, fluid, atau matte non-komedogenik, SPF 30 atau lebih, PA+++.' },
  kombinasi: { cl: 'Pembersih gel lembut yang tidak mengeringkan area pipi.', to: 'Toner hidrasi ringan; area T (dahi, hidung, dagu) bisa ditambah niacinamide.', se: 'Niacinamide 4-5% atau vitamin C ringan; sesuaikan area yang kering dan berminyak.', mo: 'Gel-krim ringan; lebih tipis di area T dan lebih tebal di pipi bila perlu.', sp: 'Tabir surya fluid ringan, SPF 30 atau lebih, PA+++.' },
  sensitif: { cl: 'Pembersih krim atau gel sangat lembut tanpa pewangi, tanpa alkohol, tanpa sabun; bilas air suam.', to: 'Essence menenangkan (centella, panthenol, beta-glucan) tanpa pewangi; boleh dilewati.', se: 'Serum menenangkan (centella, panthenol); tambah bahan baru satu per satu setelah uji tempel.', mo: 'Krim pemulih sawar kulit (ceramide, kolesterol, asam lemak) tanpa pewangi.', sp: 'Tabir surya mineral (zinc oxide atau titanium dioxide), SPF 30 atau lebih; uji tempel lebih dulu.' }
};
const SC_SKT_IDS = Object.keys(SC_SKT);
const SC_ACTS = {
  ret: { t: 'Retinoid', ex: 'retinol, retinal, adapalene 0,1% (tretinoin hanya dengan resep dokter)', d: 'Membantu pembaruan sel kulit, jerawat, dan tanda penuaan. Hanya dipakai malam hari.', how: 'Sebesar sebutir kacang polong untuk seluruh wajah, pada kulit yang sudah kering sepenuhnya, lalu pelembap. Bila kulit mudah perih, oleskan pelembap tipis dulu (metode sandwich). Hindari area sudut mata dan hidung yang tipis.' },
  aha: { t: 'AHA', ex: 'asam laktat, asam mandelat, asam glikolat', d: 'Mengelupas lapisan permukaan: kulit kusam dan tekstur kasar.', how: 'Mulai dari konsentrasi rendah (mis. asam laktat sekitar 5%), 1 malam per pekan, ikuti lama kontak di kemasan, lalu pelembap.' },
  bha: { t: 'BHA', ex: 'asam salisilat 0,5-2%', d: 'Larut dalam minyak dan masuk ke pori: komedo dan jerawat ringan.', how: 'Mulai dari 0,5-1%, 1 malam per pekan, tambah bertahap bila kulit tidak perih; lalu pelembap.' },
  rest: { t: 'Malam pemulihan', ex: 'pembersih lembut + pelembap sawar kulit', d: 'Tanpa bahan aktif. Hari istirahat adalah bagian dari rencana, bukan hari yang terlewat.', how: 'Bersihkan lembut, lalu pelembap dengan ceramide atau panthenol. Niacinamide boleh tetap dipakai.' }
};
const SC_ACT_IDS = Object.keys(SC_ACTS);
const SC_LEVELS = [['p', 'Pemula', 'Baru mulai, atau kulit mudah bereaksi'], ['t', 'Terbiasa', 'Sudah 2-3 bulan memakai bahan aktif tanpa iritasi'], ['b', 'Berpengalaman', 'Kulit toleran dan lama memakai retinoid']];
const SC_LV_IDS = SC_LEVELS.map(x => x[0]);
const SC_DAYN = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const SC_DAYFULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const SC_RULES = [
  'Tambah satu bahan aktif baru setiap 2 minggu, dan uji tempel dulu di rahang atau belakang telinga selama 24 jam.',
  'Retinoid dan asam (AHA atau BHA) tidak dipakai di malam yang sama; jadwal di atas sudah memisahkannya.',
  'Tabir surya wajib setiap pagi: retinoid dan asam membuat kulit lebih peka terhadap sinar matahari.',
  'Kulit perih, merah, atau mengelupas: tandai "Kulit iritasi hari ini". Bahan aktif dijeda 3 hari, cukup pembersih lembut dan pelembap pemulih sawar kulit.',
  'Hamil, menyusui, atau merencanakan kehamilan: jangan memakai retinoid; tanyakan dokter.',
  'Jerawat kistik, eksim, atau rosacea: periksakan ke dokter kulit, jangan hanya mengandalkan produk.'
];
const SC_STR = [
  { id: 'dagu', t: 'Dagu ditarik (chin tuck)', s: '10 kali, tahan 3 detik', d: 'Duduk tegak, tarik dagu lurus ke belakang seperti membuat dagu ganda, pandangan tetap lurus. Mengurangi kepala condong ke depan.' },
  { id: 'leher', t: 'Miringkan leher ke samping', s: '30 detik per sisi', d: 'Telinga mendekati bahu pelan-pelan, bahu seberang tetap turun. Jangan menarik kepala dengan tangan terlalu kuat.' },
  { id: 'bahu', t: 'Putar bahu', s: '10 kali ke belakang', d: 'Angkat bahu ke telinga, putar ke belakang dan turunkan; rasakan tulang belikat merapat.' },
  { id: 'dada', t: 'Buka dada di kusen pintu', s: '30 detik', d: 'Siku 90° di kusen pintu, melangkah pelan sampai dada terasa teregang. Napas biasa, jangan melengkungkan pinggang.' },
  { id: 'kucing', t: 'Kucing-sapi (cat-cow)', s: '10 kali pelan', d: 'Merangkak, lengkungkan punggung ke atas saat buang napas dan turunkan perut saat tarik napas.' },
  { id: 'pinggul', t: 'Regangan pangkal paha (hip flexor)', s: '30 detik per sisi', d: 'Posisi setengah berlutut, dorong pinggul ke depan dengan perut dikencangkan. Lawan kebiasaan duduk lama.' }
];
const SC_STR_IDS = SC_STR.map(x => x.id);
const SC_ERG = [
  { id: 'layar', t: 'Tepi atas layar sejajar mata', s: 'Jarak sekitar sepanjang lengan. Laptop: pakai penyangga dan keyboard terpisah.' },
  { id: 'punggung', t: 'Punggung bersandar, pinggang tertopang', s: 'Bantal kecil di lekuk pinggang; hindari membungkuk ke depan.' },
  { id: 'kaki', t: 'Kaki menapak lantai, lutut sekitar 90°', s: 'Pakai pijakan kaki bila kaki menggantung.' },
  { id: 'siku', t: 'Siku sekitar 90°, bahu rileks', s: 'Pergelangan tangan lurus saat mengetik, bahu tidak terangkat.' },
  { id: 'hp', t: 'Ponsel diangkat sejajar mata', s: 'Menunduk lama membebani leher; angkat ponsel atau istirahatkan tiap beberapa menit.' },
  { id: 'cahaya', t: 'Cahaya cukup, layar tanpa silau', s: 'Hindari lampu atau jendela tepat di belakang layar.' },
  { id: 'jeda', t: 'Berdiri dan bergerak tiap 30-45 menit', s: 'Pasang alarm; berjalan 2-3 menit sudah membantu.' },
  { id: 'mata', t: 'Aturan 20-20-20 untuk mata', s: 'Tiap 20 menit, lihat benda sekitar 6 meter selama 20 detik.' }
];
const SC_ERG_IDS = SC_ERG.map(x => x.id);
const SC_SHY = [
  { id: 'gelap', t: 'Kamar gelap dan tenang', s: 'Tutup tirai, matikan lampu kecil, pakai penutup mata bila perlu' },
  { id: 'kafein', t: 'Tanpa kafein 8 jam sebelum tidur', s: 'Kopi, teh pekat, minuman energi (mis. setelah pukul 14.00)' },
  { id: 'jadwal', t: 'Jam tidur dan bangun konsisten', s: 'Selisih tidak lebih dari sekitar 1 jam' },
  { id: 'makan', t: 'Tanpa makan berat 2-3 jam sebelum tidur', s: 'Camilan ringan boleh' }
];
const SC_SHY_IDS = SC_SHY.map(x => x.id);
const SC_BR = {   // ph = [label, detik, kelas, skala awal, skala akhir]; cy = jumlah putaran satu sesi
  box: { t: 'Box breathing', sub: '4-4-4-4', cy: 5, d: 'Menenangkan dan menstabilkan fokus. Cocok sebelum rapat atau saat tegang.', ph: [['Tarik napas', 4, 'in', 0.45, 1], ['Tahan', 4, 'hold', 1, 1], ['Buang napas', 4, 'out', 1, 0.45], ['Tahan', 4, 'hold', 0.45, 0.45]] },
  b478: { t: '4-7-8', sub: 'Tarik 4, tahan 7, buang 8', cy: 4, d: 'Buang napas yang panjang membantu tubuh rileks; cocok menjelang tidur. Bila pusing, kembali bernapas biasa.', ph: [['Tarik napas lewat hidung', 4, 'in', 0.45, 1], ['Tahan', 7, 'hold', 1, 1], ['Buang napas lewat mulut', 8, 'out', 1, 0.45]] },
  sigh: { t: 'Physiological sigh', sub: 'Dua tarikan, satu buangan panjang', cy: 6, d: 'Dua kali tarik napas lewat hidung (yang kedua pendek), lalu buang panjang lewat mulut. Cepat meredakan tegang.', ph: [['Tarik napas dalam lewat hidung', 2, 'in', 0.45, 0.85], ['Tarik sedikit lagi', 1, 'in', 0.85, 1], ['Buang napas panjang lewat mulut', 6, 'out', 1, 0.45]] }
};
const SC_BR_IDS = Object.keys(SC_BR);
/* ---------- data: bersih ---------- */
SC_DAYX.push({
  clean: (r, o) => {
    const pick = (a, ids) => (Array.isArray(a) ? a : []).filter((x, i, z) => ids.includes(x) && z.indexOf(x) === i);
    o.sk = pick(r.sk, SC_SK_IDS); o.st = pick(r.st, SC_STR_IDS); o.sh = pick(r.sh, SC_SHY_IDS);
    o.ir = r.ir === 1 || r.ir === true ? 1 : 0;
    o.rt = scNumIn(r.rt, 10, 40); if (o.rt != null) o.rt = Math.round(o.rt * 10) / 10;
    const q = Math.round(Number(r.sq)), s = Math.round(Number(r.sr)), b = Math.round(Number(r.bw));
    o.sq = q >= 1 && q <= 5 ? q : 0; o.sr = s >= 1 && s <= 5 ? s : 0; o.bw = b >= 1 && b <= 99 ? b : 0;
  },
  has: x => !!((x.sk && x.sk.length) || (x.st && x.st.length) || (x.sh && x.sh.length) || x.ir || x.rt != null || x.sq || x.sr || x.bw)
});
{
  const baseP2 = scCleanPref2;
  scCleanPref2 = function (p, out) {
    baseP2(p, out);
    out.act = SC_LV_IDS.includes(p.act) ? p.act : 'p';
    out.erg = (Array.isArray(p.erg) ? p.erg : []).filter((x, i, a) => SC_ERG_IDS.includes(x) && a.indexOf(x) === i);
    out.wake = typeof p.wake === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.wake) ? p.wake : '';
    out.bt = SC_BR_IDS.includes(p.bt) ? p.bt : 'box';
  };
}
const scLevel = () => (SC_LV_IDS.includes(scdb.pref.act) ? scdb.pref.act : 'p');
const scErgSel = () => scdb.pref.erg || (scdb.pref.erg = []);
const scBtech = () => (SC_BR_IDS.includes(scdb.pref.bt) ? scdb.pref.bt : 'box');
const scDayList = (d, k) => scDay(d)[k] || [];
const scWdx = d => (pd(d).getDay() + 6) % 7;   // 0 = Senin
/* ---------- logika murni ---------- */
function scExfT(skin, i) { return ({ berminyak: ['bha', 'bha'], kombinasi: ['bha', 'aha'], kering: ['aha', 'aha'] }[skin] || ['aha', 'bha'])[i]; }
function scRotation(level, skin) {   // 7 malam, indeks 0 = Senin; isi: ret | aha | bha | rest
  const sk = SC_SKT_IDS.includes(skin) ? skin : 'normal', lv = SC_LV_IDS.includes(level) ? level : 'p', r = ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'];
  if (sk === 'sensitif') { r[1] = 'ret'; r[5] = 'ret'; return r; }   // sensitif: retinoid 2 malam, tanpa asam
  if (lv === 'p') { r[1] = 'ret'; r[4] = 'ret'; r[6] = scExfT(sk, 0); }
  else if (lv === 't') { r[0] = 'ret'; r[2] = 'ret'; r[4] = 'ret'; r[5] = scExfT(sk, 0); }
  else { r[0] = 'ret'; r[2] = 'ret'; r[4] = 'ret'; r[1] = scExfT(sk, 0); r[5] = scExfT(sk, 1); }
  return r;
}
function scIrrLast(d) { for (let i = 0; i < 3; i++) { const e = addDays(d, -i); if (scDay(e).ir) return e; } return null; }
function scTonight(d) {   // {id, paused, resume}: jeda 3 hari (hari iritasi + 2 hari sesudahnya)
  const li = scIrrLast(d);
  if (li) return { id: 'rest', paused: true, resume: addDays(li, 3) };
  return { id: scRotation(scLevel(), scdb.pref.skin)[scWdx(d)], paused: false, resume: null };
}
function scSkAll(x, w) { const sk = x.sk || []; return SC_SKS.filter(s => s.w === w && s.req).every(s => sk.includes(s.id)); }
function scStAll(x) { const st = x.st || []; return SC_STR_IDS.every(i => st.includes(i)); }
function scSyncTask(x, tid, before, after) {   // true bila ada perubahan: lengkap -> centang; lengkap lalu tidak lengkap -> cabut
  const k = x.ck.indexOf(tid);
  if (after && k < 0) { x.ck.push(tid); return true; }
  if (before && !after && k >= 0) { x.ck.splice(k, 1); return true; }
  return false;
}
function scSleepScore(d) {   // 50 poin durasi (Jurnal) + 50 poin dari 7 kebiasaan
  const h = scSleepH(d), x = scDay(d), n = (x.sh || []).length + (scDone('scr', d) ? 1 : 0) + (scDone('sn', d) ? 1 : 0) + (x.rt != null && x.rt >= 18 && x.rt <= 24 ? 1 : 0);
  const dur = h == null ? 0 : (h >= 7 && h <= 9 ? 50 : h > 9 ? 45 : Math.round(50 * h / 7)), hyg = Math.round(50 * n / 7);
  return { pts: dur + hyg, dur, hyg, n, of: 7, h, any: h != null || n > 0 };
}
function scBedTimes(wake) {   // jam tidur supaya bangun di akhir siklus 90 menit (+15 menit untuk terlelap)
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(wake || ''); if (!m) return [];
  const w = Number(m[1]) * 60 + Number(m[2]), p2 = n => String(n).padStart(2, '0');
  return [6, 5, 4].map(c => { const b = (((w - (c * 90 + 15)) % 1440) + 1440) % 1440; return { cycles: c, hours: c * 1.5, bed: p2(Math.floor(b / 60)) + ':' + p2(b % 60) }; });
}
function scBrTotal(id) { const b = SC_BR[id]; return b.ph.reduce((a, p) => a + p[1], 0) * b.cy; }
function scBrAt(id, sec) {   // keadaan napas pada detik ke-sec sejak mulai
  if (!SC_BR_IDS.includes(id)) return null;
  const b = SC_BR[id], cyc = b.ph.reduce((a, p) => a + p[1], 0), total = cyc * b.cy;
  if (sec >= total) return { done: true, total, cycle: b.cy, label: 'Selesai', remain: 0, scale: 0.45, phase: -1 };
  const s = Math.max(0, sec), ci = Math.floor(s / cyc); let r = s - ci * cyc, i = 0;
  while (r >= b.ph[i][1]) { r -= b.ph[i][1]; i++; }
  const p = b.ph[i], f = r / p[1];
  return { done: false, total, cycle: ci + 1, label: p[0], remain: Math.ceil(p[1] - r), scale: p[3] + (p[4] - p[3]) * f, phase: i, kind: p[2] };
}
function scSkinTxt(skin, k) { return (SC_SKT[SC_SKT_IDS.includes(skin) ? skin : 'normal'] || {})[k] || ''; }
/* ---------- tampilan: umum ---------- */
function scGRow(q, id, on, title, sub, fk, extra) {
  return '<button class="sc-task' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + on + '" data-q="' + q + '" data-id="' + id + '" data-fk="' + fk + '"><span class="sc-box" aria-hidden="true">' + SC_CHK + '</span><span class="t"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span>' + (extra || '') + '</button>';
}
function scMini(ds, valFn, clsFn, lab) {   // grafik 7 hari generik (valFn -> 0..1 atau null)
  const bars = ds.map(d => { const v = valFn(d); return '<div class="sc-b' + (d === today() ? ' now' : '') + '"><i style="height:' + (v == null ? 0 : Math.max(6, Math.round(v * 100))) + '%" class="' + (v == null ? 'nil' : clsFn(v)) + '"></i><span>' + HARI[pd(d).getDay()].slice(0, 1) + '</span><b>' + (v == null ? '–' : Math.round(v * 100)) + '</b></div>'; }).join('');
  return '<div class="sc-chart" role="img" aria-label="' + esc(lab) + ': ' + ds.map(d => HARI[pd(d).getDay()] + ' ' + (valFn(d) == null ? 'kosong' : Math.round(valFn(d) * 100))).join(', ') + '">' + bars + '</div>';
}
const scDays7 = () => [6, 5, 4, 3, 2, 1, 0].map(i => addDays(today(), -i));
const scClsHi = v => (v >= 0.7 ? 'hi' : v >= 0.4 ? 'mid' : 'lo');
/* ---------- sub-tab Kulit ---------- */
let scGSub = 'kulit', scGWhen = 'am';
function scSkinPick() {
  const sk = scdb.pref.skin;
  return '<section class="sc-card"><h3>Jenis kulit</h3><p class="sc-sub">Pilih yang paling sesuai; saran produk di rutinitas mengikuti pilihan ini.</p><div class="sc-chips" role="group" aria-label="Jenis kulit">' +
    SC_SKIN.filter(x => x[0]).map(x => '<button class="sc-chip" data-q="scSkin" data-v="' + x[0] + '" data-fk="sk-' + x[0] + '" aria-pressed="' + (sk === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    (sk ? '' : '<p class="sc-fine">Belum dipilih: saran di bawah memakai kulit normal. Tidak yakin? Kulit sensitif bila mudah perih atau merah; berminyak bila mengilap dalam 2-3 jam setelah cuci muka; kering bila terasa tertarik.</p>') + '</section>';
}
function scSkinRoutine() {
  const t = today(), w = scGWhen === 'pm' ? 'pm' : 'am', steps = SC_SKS.filter(s => s.w === w), x = scDay(t), sk = x.sk || [], tn = scTonight(t);
  const rq = steps.filter(s => s.req), got = rq.filter(s => sk.includes(s.id)).length, tid = w === 'am' ? 'skam' : 'skpm', n = scStreak(tid);
  const rows = steps.map(s => {
    let sub = scSkinTxt(scdb.pref.skin, s.k);
    if (s.k === 'cl' && w === 'pm') sub = 'Malam: bila memakai tabir surya tebal atau makeup, bersihkan dulu dengan balm atau minyak pembersih sekitar 1 menit, lalu ' + sub.charAt(0).toLowerCase() + sub.slice(1);
    if (s.k === 'mo' && w === 'pm') sub += ' Malam boleh memakai versi yang lebih kaya.';
    if (s.k === 'ac') { const a = SC_ACTS[tn.id]; sub = tn.paused ? 'Kulit sedang dijeda dari bahan aktif: cukup pembersih lembut dan pelembap pemulih sawar kulit.' : tn.id === 'rest' ? 'Malam ini tanpa bahan aktif: lewati langkah ini atau pakai serum menenangkan.' : a.t + ' (' + a.ex + '). ' + a.how; }
    return scGRow('scSkTake', s.id, sk.includes(s.id), s.t, sub, 'sk-' + s.id, '<span class="sc-tag">' + (s.req ? 'Wajib' : 'Opsional') + '</span>');
  }).join('');
  return '<section class="sc-card"><h3>Rutinitas hari ini</h3><div class="sc-chips" role="group" aria-label="Waktu rutinitas"><button class="sc-chip" data-q="scGWhen" data-v="am" data-fk="gw-am" aria-pressed="' + (w === 'am') + '">Pagi</button><button class="sc-chip" data-q="scGWhen" data-v="pm" data-fk="gw-pm" aria-pressed="' + (w === 'pm') + '">Malam</button></div>' +
    '<p class="sc-sub"><b>' + got + ' dari ' + rq.length + '</b> langkah wajib selesai' + (n ? ' · beruntun ' + n + ' hari' : '') + '</p>' + rows +
    (got === rq.length ? '<p class="sc-tipok">Langkah wajib ' + (w === 'am' ? 'pagi' : 'malam') + ' selesai. Tugas "Skincare ' + (w === 'am' ? 'pagi' : 'malam') + '" di Hari ini ikut tercentang.</p>' : '') +
    '<p class="sc-fine">Urutan dari paling encer ke paling kental: pembersih, toner, serum, pelembap, lalu tabir surya (pagi). Tunggu sekitar 1 menit antar produk bila kulit mudah perih.</p></section>';
}
function scSkinRot() {
  const t = today(), lv = scLevel(), rot = scRotation(lv, scdb.pref.skin), tn = scTonight(t), a = SC_ACTS[tn.id], ix = scWdx(t), ir = !!scDay(t).ir;
  const short = { ret: 'RET', aha: 'AHA', bha: 'BHA', rest: '–' };
  const grid = '<div class="sc-rot" role="list" aria-label="Rotasi bahan aktif satu pekan">' + rot.map((k, i) => '<div class="sc-rd ' + k + (i === ix ? ' now' : '') + '" role="listitem" aria-label="' + SC_DAYFULL[i] + ': ' + esc(SC_ACTS[k].t) + (i === ix ? ' (hari ini)' : '') + '"><span>' + SC_DAYN[i] + '</span><b>' + short[k] + '</b></div>').join('') + '</div>';
  const info = scdb.pref.skin === 'sensitif' ? '<p class="sc-warn" role="note">Kulit sensitif: jadwal dibatasi retinoid 2 malam per pekan tanpa asam (AHA atau BHA), apa pun tingkat Anda. Mulai dengan konsentrasi paling rendah.</p>' : '';
  let now;
  if (tn.paused) { const r = tn.resume; now = '<div class="sc-res" role="status"><b>Malam ini: ' + esc(a.t) + '</b><p>Kulit sedang dijeda dari bahan aktif karena Anda menandai iritasi. Dilanjutkan lagi mulai ' + HARI[pd(r).getDay()] + ' tanggal ' + pd(r).getDate() + '. Cukup pembersih lembut dan pelembap pemulih sawar kulit.</p></div>'; }
  else now = '<div class="sc-res" role="status"><b>Malam ini: ' + esc(a.t) + '</b><p>' + esc(a.d) + '</p><p class="sc-fine">Contoh: ' + esc(a.ex) + '. ' + esc(a.how) + '</p></div>';
  return '<section class="sc-card"><h3>Rotasi bahan aktif</h3><p class="sc-sub">Naikkan bertahap sesuai toleransi kulit. Pilih tingkat Anda:</p><div class="sc-chips" role="group" aria-label="Tingkat toleransi">' +
    SC_LEVELS.map(x => '<button class="sc-chip" data-q="scLevel" data-v="' + x[0] + '" data-fk="lv-' + x[0] + '" aria-pressed="' + (lv === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div><p class="sc-fine">' + esc(SC_LEVELS.find(x => x[0] === lv)[2]) + '. Satu pekan, Senin sampai Minggu (RET retinoid, AHA/BHA asam, – pemulihan):</p>' + grid + info + now +
    '<div class="sc-row" style="margin-top:10px"><button class="sc-btn' + (ir ? ' on' : '') + '" data-q="scIrr" data-fk="irr" aria-pressed="' + ir + '">' + (ir ? 'Iritasi ditandai (ketuk untuk batal)' : 'Kulit iritasi hari ini') + '</button></div>' +
    '<p class="sc-lab">Niacinamide</p><p class="sc-fine" style="margin-top:4px">Niacinamide 4-5% cocok dipakai tiap hari, pagi atau malam, bersama bahan lain: membantu sawar kulit, minyak berlebih, dan tampilan pori.</p>' +
    '<p class="sc-lab">Aturan aman</p><ul class="sc-ul">' + SC_RULES.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul></section>';
}
function scSkinAll() { return scSkinPick() + scSkinRoutine() + scSkinRot(); }
/* ---------- sub-tab Postur ---------- */
function scPostAll() {
  const t = today(), er = scErgSel(), st = scDayList(t, 'st'), n = scStreak('pt'), score = er.length;
  const ergRows = SC_ERG.map(x => scGRow('scErg', x.id, er.includes(x.id), x.t, x.s, 'eg-' + x.id)).join('');
  const strRows = SC_STR.map(x => scGRow('scStTake', x.id, st.includes(x.id), x.t + ' · ' + x.s, x.d, 'st-' + x.id)).join('');
  return '<section class="sc-card"><h3>Audit meja dan postur</h3><p class="sc-sub"><b>' + score + ' dari ' + SC_ERG.length + '</b> sudah sesuai' + (score === SC_ERG.length ? ' · meja kerja Anda sudah ergonomis' : '') + '</p>' +
    '<div class="sc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + SC_ERG.length + '" aria-valuenow="' + score + '" aria-label="Skor ergonomi"><i style="width:' + Math.round(100 * score / SC_ERG.length) + '%"></i></div>' + ergRows +
    '<p class="sc-fine">Centang yang sudah sesuai; audit disimpan, ulangi bila pindah meja atau pekerjaan. Yang belum dicentang adalah bahan perbaikan berikutnya.</p></section>' +
    '<section class="sc-card"><h3>Peregangan harian</h3><p class="sc-sub"><b>' + st.length + ' dari ' + SC_STR.length + '</b> selesai hari ini' + (n ? ' · beruntun ' + n + ' hari' : '') + '</p>' + strRows +
    (st.length === SC_STR.length ? '<p class="sc-tipok">Semua peregangan selesai. Tugas "Peregangan postur" di Hari ini ikut tercentang.</p>' : '') +
    '<p class="sc-fine">Gerakan pelan, tanpa menghentak, sampai terasa teregang (bukan nyeri). Berhenti bila ada nyeri tajam, kesemutan, atau mati rasa, dan periksakan ke dokter bila menetap.</p></section>';
}
/* ---------- sub-tab Tidur ---------- */
function scSleepAll() {
  const t = today(), x = scDay(t), sc = scSleepScore(t), h = scSleepH(t), sh = x.sh || [], wake = scdb.pref.wake || '06:00', bt = scBedTimes(wake);
  const hy = SC_SHY.map(i => scGRow('scShTake', i.id, sh.includes(i.id), i.t, i.s, 'sh-' + i.id)).join('') + scTaskRow(SC_TASKS.find(z => z.id === 'scr'), t) + scTaskRow(SC_TASKS.find(z => z.id === 'sn'), t);
  const tmp = x.rt == null ? '' : x.rt >= 18 && x.rt <= 24 ? 'Suhu nyaman untuk tidur.' : x.rt > 24 ? 'Agak panas: kipas atau AC membantu tubuh menurunkan suhu inti.' : 'Agak dingin: pakai selimut tipis.';
  const sqs = [1, 2, 3, 4, 5], sq = x.sq || 0;
  const week = scDays7(), rec = week.filter(d => scDay(d).sq);
  return '<section class="sc-card"><h3>Skor tidur hari ini</h3><div class="sc-hr">' + scRing(sc.pts / 100, sc.pts, 'Skor tidur ' + sc.pts + ' dari 100') + '<div class="sc-ht"><small>Tidur dan kebiasaan</small><b>' + (sc.any ? sc.pts + ' dari 100' : 'Belum ada catatan') + '</b><span>' + (h == null ? 'Durasi tidur belum dicatat di Jurnal' : fmt(h, 1) + ' jam tidur (' + sc.dur + ' dari 50)') + '</span><span>Kebiasaan ' + sc.n + ' dari ' + sc.of + ' (' + sc.hyg + ' dari 50)</span></div></div>' +
    '<p class="sc-fine">Durasi diambil dari isian tidur di Jurnal (7-9 jam = nilai penuh). Kebiasaan tidur di bawah menambah sisa poin.</p></section>' +
    '<section class="sc-card"><h3>Kebiasaan tidur hari ini</h3>' + hy +
    '<label class="sc-fl" style="margin-top:12px"><span>Suhu kamar (°C), mis. 23</span><input class="sc-in" data-sg="rt" data-fk="rt" type="text" inputmode="decimal" autocomplete="off" placeholder="18-24 dianggap nyaman" value="' + (x.rt == null ? '' : esc(String(x.rt).replace('.', ','))) + '"></label>' + (tmp ? '<p class="sc-fine">' + esc(tmp) + '</p>' : '') + '</section>' +
    '<section class="sc-card"><h3>Kualitas bangun</h3><p class="sc-sub">Seberapa segar bangun pagi ini? (1 = sangat lelah, 5 = sangat segar)</p><div class="sc-chips" role="group" aria-label="Kualitas bangun">' + sqs.map(v => '<button class="sc-chip" data-q="scSq" data-v="' + v + '" data-fk="sq-' + v + '" aria-pressed="' + (sq === v) + '">' + v + '</button>').join('') + '</div>' +
    '<p class="sc-fine">' + (rec.length ? 'Rata-rata 7 hari: ' + fmt(rec.reduce((a, d) => a + scDay(d).sq, 0) / rec.length, 1) + ' dari ' + rec.length + ' hari tercatat.' : 'Belum ada catatan 7 hari terakhir.') + '</p></section>' +
    '<section class="sc-card"><h3>Skor tidur 7 hari</h3>' + scMini(week, d => { const s = scSleepScore(d); return s.any ? s.pts / 100 : null; }, scClsHi, 'Skor tidur tujuh hari terakhir') + '<p class="sc-fine">Hijau = 70 atau lebih.</p></section>' +
    '<section class="sc-card"><h3>Jam tidur ideal</h3><p class="sc-sub">Satu siklus tidur sekitar 90 menit. Bangun di akhir siklus terasa lebih segar. Masukkan jam bangun:</p><label class="sc-fl"><span>Jam bangun</span><input class="sc-in" data-sg="wake" data-fk="wake" type="time" value="' + esc(wake) + '"></label>' +
    '<div class="sc-bt" role="list">' + bt.map(b => '<div role="listitem"><b>' + b.bed + '</b><small>' + b.cycles + ' siklus · ' + fmt(b.hours, 1) + ' jam</small></div>').join('') + '</div><p class="sc-fine">Sudah termasuk sekitar 15 menit untuk terlelap. Sasaran orang dewasa 7-9 jam (5-6 siklus).</p></section>' +
    '<section class="sc-card"><h3>Cahaya pagi dan suhu</h3><p class="sc-fine" style="margin-top:0">Cahaya luar ruang pagi hari bisa 10.000 lux atau lebih, sedangkan di dalam ruangan hanya 100-500 lux. Cahaya pagi membantu mengatur jam biologis: tubuh lebih mudah mengantuk di malam hari. Suhu kamar yang sejuk dan gelap membantu suhu inti tubuh turun saat tidur. Pelacakan fase tidur memerlukan alat khusus; di sini yang dicatat adalah durasi, kualitas bangun, dan kebiasaannya.</p></section>';
}
/* ---------- sub-tab Napas ---------- */
let scBrS = null;   // sesi berjalan: { id, t0, iv, lab }
function scBrStop() { if (scBrS && scBrS.iv) clearInterval(scBrS.iv); scBrS = null; }
function scBrView(sec) {
  const id = scBrS ? scBrS.id : scBtech(), s = scBrS ? scBrAt(id, sec) : null;
  if (!s) return { txt: 'Siap. Duduk tegak, bahu rileks.', scale: 0.45, sub: scBrTotal(id) + ' detik · ' + SC_BR[id].cy + ' putaran' };
  return { txt: s.label + ' ' + s.remain, scale: s.scale, sub: 'Putaran ' + s.cycle + ' dari ' + SC_BR[id].cy };
}
function scBrTick() {
  if (!scBrS) return;
  const box = document.getElementById('scBrBox');
  if (!box || box.offsetParent === null) { scBrStop(); return; }
  const sec = (Date.now() - scBrS.t0) / 1000, s = scBrAt(scBrS.id, sec);
  if (s.done) {
    scBrStop();
    scEdit(today(), x => { const b = x.ck.includes('br'); if (!b) x.ck.push('br'); x.bw = Math.min(99, (x.bw || 0) + 1); });
    try { toast('Sesi napas selesai'); } catch (e) { /* abaikan */ }
    scRender(); return;
  }
  const v = scBrView(sec), o = document.getElementById('scBrO'), tx = document.getElementById('scBrT'), sb = document.getElementById('scBrS'), lv = document.getElementById('scBrL');
  if (o) o.style.transform = 'scale(' + v.scale.toFixed(3) + ')';
  if (tx) tx.textContent = v.txt;
  if (sb) sb.textContent = v.sub;
  if (lv && scBrS.lab !== s.label + s.cycle) { scBrS.lab = s.label + s.cycle; lv.textContent = s.label; }
}
function scBreathAll() {
  const t = today(), id = scBrS ? scBrS.id : scBtech(), b = SC_BR[id], x = scDay(t), run = !!scBrS, v = scBrView(run ? (Date.now() - scBrS.t0) / 1000 : 0), n = scStreak('br'), sr = x.sr || 0, week = scDays7(), rec = week.filter(d => scDay(d).sr);
  return '<section class="sc-card"><h3>Napas terpandu</h3><p class="sc-sub">Napas yang diatur membantu menurunkan tegang dan hormon stres. Pilih teknik:</p><div class="sc-chips" role="group" aria-label="Teknik napas">' +
    SC_BR_IDS.map(k => '<button class="sc-chip" data-q="scBrTech" data-v="' + k + '" data-fk="bt-' + k + '" aria-pressed="' + (id === k) + '">' + esc(SC_BR[k].t) + '</button>').join('') + '</div>' +
    '<p class="sc-fine"><b>' + esc(b.t) + '</b> (' + esc(b.sub) + '). ' + esc(b.d) + '</p>' +
    '<div class="sc-brc" id="scBrBox"><div class="sc-bro" id="scBrO" style="transform:scale(' + v.scale.toFixed(3) + ')"></div></div><p class="sc-brt" id="scBrT">' + esc(v.txt) + '</p><p class="sc-fine" id="scBrS" style="text-align:center;margin-top:2px">' + esc(v.sub) + '</p><span class="sc-sr-only" id="scBrL" role="status" aria-live="polite"></span>' +
    '<div class="sc-row" style="margin-top:10px"><button class="sc-btn" data-q="scBrGo" data-fk="brgo">' + (run ? 'Berhenti' : 'Mulai sesi') + '</button></div>' +
    '<p class="sc-sub" style="margin-top:12px"><b>' + (x.bw || 0) + '</b> sesi selesai hari ini' + (n ? ' · beruntun ' + n + ' hari' : '') + '</p><p class="sc-fine">Selesai satu sesi penuh = tugas "Latihan napas" di Hari ini tercentang. Berhenti bila pusing; bernapaslah biasa. Bila ada penyakit paru atau jantung, tanyakan dokter lebih dulu.</p></section>' +
    '<section class="sc-card"><h3>Tingkat stres hari ini</h3><p class="sc-sub">1 = sangat tenang, 5 = sangat tegang.</p><div class="sc-chips" role="group" aria-label="Tingkat stres">' + [1, 2, 3, 4, 5].map(k => '<button class="sc-chip" data-q="scSr" data-v="' + k + '" data-fk="sr-' + k + '" aria-pressed="' + (sr === k) + '">' + k + '</button>').join('') + '</div>' +
    scMini(week, d => { const q = scDay(d).sr; return q ? q / 5 : null; }, v2 => (v2 <= 0.4 ? 'hi' : v2 <= 0.6 ? 'mid' : 'lo'), 'Tingkat stres tujuh hari terakhir (1 sampai 5, rendah lebih baik; angka = persen dari skala)') +
    '<p class="sc-fine">' + (rec.length ? 'Rata-rata 7 hari: ' + fmt(rec.reduce((a, d) => a + scDay(d).sr, 0) / rec.length, 1) + ' dari ' + rec.length + ' hari tercatat.' : 'Belum ada catatan 7 hari terakhir.') + ' Hijau = tenang.</p></section>' +
    '<section class="sc-card"><h3>Mengendalikan kortisol</h3><ul class="sc-ul"><li>Cahaya pagi dan jam bangun yang tetap membantu ritme kortisol harian.</li><li>Kafein secukupnya dan tidak terlalu sore; kafein berlebih menambah rasa tegang.</li><li>Jalan kaki 10-15 menit atau olahraga ringan menurunkan stres.</li><li>Tidur cukup: kurang tidur menaikkan kortisol dan memperburuk jerawat.</li><li>Stres kronis yang mengganggu hidup perlu ditangani dengan bantuan profesional.</li></ul></section>';
}
/* ---------- kerangka tab ---------- */
function scGlow() {
  return '<div class="sc-chips" role="group" aria-label="Bagian Glow-Up" style="margin-top:12px">' + SC_GSUBS.map(x => '<button class="sc-chip" data-q="scGSub" data-v="' + x[0] + '" data-fk="gs-' + x[0] + '" aria-pressed="' + (scGSub === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    ({ kulit: scSkinAll, postur: scPostAll, tidur: scSleepAll, napas: scBreathAll }[scGSub] || scSkinAll)() +
    '<p class="sc-fine">Panduan umum perawatan diri, bukan pengganti saran dokter. Keluhan kulit yang berat atau menetap, nyeri postur yang menjalar, atau gangguan tidur berkepanjangan perlu diperiksakan.</p>';
}
SC_PANEL.glow = scGlow; SC_READY.glow = true;
/* ---------- aksi ---------- */
QACT.scGSub = b => { const v = b.dataset.v; if (!SC_GSUB_IDS.includes(v)) return; if (v !== scGSub) scBrStop(); scGSub = v; scRender(); };
QACT.scGWhen = b => { scGWhen = b.dataset.v === 'pm' ? 'pm' : 'am'; scRender(); };
QACT.scSkin = b => { const v = b.dataset.v; if (!SC_SKT_IDS.includes(v)) return; scdb.pref.skin = scdb.pref.skin === v ? '' : v; scSave(); scRender(); };
QACT.scLevel = b => { const v = b.dataset.v; if (!SC_LV_IDS.includes(v)) return; scdb.pref.act = v; scSave(); scRender(); };
QACT.scIrr = () => { scEdit(today(), x => { x.ir = x.ir ? 0 : 1; }); scRender(); };
QACT.scSkTake = b => {
  const id = b.dataset.id, s = SC_SKS.find(z => z.id === id); if (!s) return;
  scEdit(today(), x => {
    const sk = x.sk || (x.sk = []), before = scSkAll(x, s.w), i = sk.indexOf(id); if (i >= 0) sk.splice(i, 1); else sk.push(id);
    scSyncTask(x, s.w === 'am' ? 'skam' : 'skpm', before, scSkAll(x, s.w));
  });
  scRender();
};
QACT.scErg = b => { const id = b.dataset.id; if (!SC_ERG_IDS.includes(id)) return; const e = scErgSel(), i = e.indexOf(id); if (i >= 0) e.splice(i, 1); else e.push(id); scSave(); scRender(); };
QACT.scStTake = b => {
  const id = b.dataset.id; if (!SC_STR_IDS.includes(id)) return;
  scEdit(today(), x => { const st = x.st || (x.st = []), before = scStAll(x), i = st.indexOf(id); if (i >= 0) st.splice(i, 1); else st.push(id); scSyncTask(x, 'pt', before, scStAll(x)); });
  scRender();
};
QACT.scShTake = b => {
  const id = b.dataset.id; if (!SC_SHY_IDS.includes(id)) return;
  scEdit(today(), x => { const sh = x.sh || (x.sh = []), i = sh.indexOf(id); if (i >= 0) sh.splice(i, 1); else sh.push(id); });
  scRender();
};
QACT.scSq = b => { const v = Number(b.dataset.v); if (!(v >= 1 && v <= 5)) return; scEdit(today(), x => { x.sq = x.sq === v ? 0 : v; }); scRender(); };
QACT.scSr = b => { const v = Number(b.dataset.v); if (!(v >= 1 && v <= 5)) return; scEdit(today(), x => { x.sr = x.sr === v ? 0 : v; }); scRender(); };
QACT.scBrTech = b => { const v = b.dataset.v; if (!SC_BR_IDS.includes(v)) return; scBrStop(); scdb.pref.bt = v; scSave(); scRender(); };
QACT.scBrGo = () => {
  if (scBrS) { scBrStop(); scRender(); return; }
  scBrS = { id: scBtech(), t0: Date.now(), iv: setInterval(scBrTick, 250), lab: '' };
  scRender(); scBrTick();
};
document.addEventListener('change', ev => {
  const el = ev.target, k = el && el.dataset && el.dataset.sg; if (!k) return;
  if (k === 'rt') {
    const raw = String(el.value).replace(',', '.').trim();
    if (raw === '') scEdit(today(), x => { x.rt = null; });
    else { const n = scNumIn(raw, 10, 40); if (n == null) { toast('Isi suhu 10 sampai 40 °C'); scRender(); return; } scEdit(today(), x => { x.rt = Math.round(n * 10) / 10; }); }
    scRender();
  } else if (k === 'wake') {
    const v = String(el.value); if (/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) { scdb.pref.wake = v; scSave(); }
    scRender();
  }
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b82d: Object.freeze({
  rot: scRotation, tonight: scTonight, sleep: scSleepScore, bed: scBedTimes, brAt: scBrAt, brTotal: scBrTotal, sks: SC_SKS, acts: SC_ACTS, str: SC_STR, erg: SC_ERG, shy: SC_SHY, br: SC_BR, skAll: scSkAll, stAll: scStAll, sync: scSyncTask,
  sub: () => scGSub, setSub: v => { scGSub = v; }, running: () => !!scBrS, stop: scBrStop
}) }));
/* v82d-end */
/* v82e-begin */
