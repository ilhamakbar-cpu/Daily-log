/* ===== OTH-3b1-end ===== */
/* ===== OTH-3b2-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3b-2: kartu BUATAN SENDIRI (OTH-3a/3b-1) IKUT cadangan JSON dan impor (`extra.hafalanBuatan`) dan jalur SINKRON yang sama (pola OTH-1c). hfbSnap = salinan murni untuk cadangan (null bila tidak ada kartu, urut id); hfbMergeIn = gabung MURNI per id: id belum ada = ditambah (maks 500, sisanya dilewati dan dihitung); id sama dan isi sama = sama; id sama tetapi isi beda = isi yang LEBIH BESAR menurut urutan isi (depan, lalu belakang, lalu dibuat) menang, supaya hasil SAMA di kedua arah dan SAMA untuk urutan impor apa pun (gabung = maksimum per id: komutatif, asosiatif, idempoten; terbukti sapuan acak, termasuk tiga perangkat); `u` daftar TIDAK dipakai memilih pemenang karena `u` dikatrol impor lain dan membuat gabungan tidak asosiatif (cacat yang ditemukan uji pertama); kartu lokal TIDAK pernah dibuang; hasil diurut (dibuat, id) supaya perangkat berakhir dengan urutan yang sama. BATAS JUJUR: kartu belum punya waktu ubah sendiri, jadi bila DUA perangkat mengubah kartu YANG SAMA, pemenangnya ditentukan urutan isi, BUKAN ubahan terakhir (perbaikan = kolom `diubah` per kartu saat formulir ubah dibangun di 3c) [DIPERBARUI OTH-3c1c: kolom `diubah` SUDAH ada; ubahan yang lebih baru menang, urutan isi hanya memutus seri]; belum ada nisan hapus (3d), jadi impor hanya MENAMBAH atau MEMPERBARUI. exMergeBuatan dipanggil exMerge (apply=false hanya menghitung). Titik lama yang disambung: exReady, exEnsure, exSnap (3 tempat), exMerge, importReview, doImport; bertanda OTH-3b2. Versi cadangan tetap 4; cadangan tanpa `hafalanBuatan` tetap terbaca. Membalik: hapus blok ini dan kembalikan sambungan bertanda OTH-3b2. ===== */
const hfbById = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const hfbByDibuat = (a, b) => (a.dibuat - b.dibuat) || hfbById(a, b);
function hfbCmp(a, b) {   // urutan TOTAL atas kartu (diubah, depan, belakang, dibuat); 0 hanya bila semuanya sama persis. OTH-3c1c: `diubah` (0 = belum pernah diubah, urutan lama persis) didahulukan: kartu yang diubah LEBIH BARU menang; isi hanya memutus seri
  const D = k => (Number.isSafeInteger(k.diubah) && k.diubah > k.dibuat ? k.diubah : 0), x = [D(a), a.depan, a.belakang, a.dibuat], y = [D(b), b.depan, b.belakang, b.dibuat];
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}
function hfbSnap(data) {   // MURNI: data apa pun -> salinan bersih beku untuk cadangan, atau null bila tidak ada kartu; urut id (dua perangkat yang sama = teks yang sama)
  const d = hfbClean(data).data;
  if (!d.kartu.length) return null;
  return Object.freeze({ v: HFB_V, kartu: Object.freeze(d.kartu.map(c => Object.freeze(Object.assign({}, c))).sort(hfbById)), u: d.u });
}
function hfbMergeIn(cur, raw) {   // MURNI: -> { data, add, upd, same, penuh, kembar, tak, baru } beku; add = kartu baru di sini; upd = kartu lokal yang isinya diganti karena isi di file lebih besar; same = kartu file yang sudah sama atau kalah; penuh = kartu baru dilewati karena batas 500; kembar = kartu baru yang depannya sama dengan kartu lain (tetap ditambah, supaya dua perangkat konvergen); tak = isian file yang dibuang karena tidak sah; baru = file dari versi lebih baru (kartu yang sah tetap dibaca); u = yang terbesar dari dua sisi
  const c = hfbClean(cur).data, inc = hfbClean(raw), m = new Map(c.kartu.map(k => [k.id, k])), dep = new Set(c.kartu.map(k => k.depan));
  let add = 0, upd = 0, same = 0, penuh = 0, kembar = 0;
  inc.data.kartu.slice().sort(hfbById).forEach(k => {   // urut id: hasil tidak bergantung urutan di file
    const have = m.get(k.id);
    if (!have) { if (m.size >= HFU.cap) { penuh++; return; } if (dep.has(k.depan)) kembar++; dep.add(k.depan); m.set(k.id, k); add++; return; }
    const d = hfbCmp(k, have);
    if (d > 0) { m.set(k.id, k); upd++; } else same++;   // isi file lebih besar menang; sama atau lebih kecil = tidak berubah
  });
  return Object.freeze({ data: Object.freeze({ v: HFB_V, kartu: Object.freeze([...m.values()].sort(hfbByDibuat)), u: Math.max(c.u, inc.data.u) }), add, upd, same, penuh, kembar, tak: inc.buang, baru: inc.catatan.indexOf('versi_baru') >= 0 });
}
function hfbSnapOut() { return HFB.blocked ? null : hfbSnap(HFB.data); }   // catatan lokal dari versi lebih baru: tidak diekspor
function exMergeBuatan(src, r, apply) {   // dipanggil exMerge
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || !src.hafalanBuatan) return;
  if (HFB.blocked) { r.hbBlok = 1; return; }   // catatan lokal dari versi lebih baru: tidak ditimpa
  const m = hfbMergeIn(HFB.data, src.hafalanBuatan);
  r.hbAdd = (r.hbAdd || 0) + m.add; r.hbUpd = (r.hbUpd || 0) + m.upd; r.hbTak = (r.hbTak || 0) + m.tak; r.hbPenuh = (r.hbPenuh || 0) + m.penuh; r.hbKembar = (r.hbKembar || 0) + m.kembar;
  if (m.add || m.upd) r.exAdded += m.add + m.upd; else r.exSame++;
  if (apply && (m.add || m.upd || m.data.u !== HFB.data.u)) { HFB.data = m.data; dirty.hafalanBuatan = true; queueSave('hafalanBuatan'); }   // u selalu ikut maju supaya dua perangkat konvergen walau isi sama
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3b2: Object.freeze({ snap: hfbSnap, mergeIn: hfbMergeIn, snapOut: hfbSnapOut, exMerge: exMergeBuatan, cmp: hfbCmp }) }));
/* ===== OTH-3b2-end ===== */
/* ===== OTH-3b3-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3b-3: isi kartu BUATAN SENDIRI (`us.*`, OTH-3a/3b-1) DIDAFTARKAN ke tab Hafalan lewat jalur isi yang sama dengan deck Ibadah (`hfvPakaiIsi`, OTH-2b). Sumber isi sekarang = isi Ibadah dulu (`ib.*`, sama persis dengan pendaftaran 2b), lalu kartu buatan dibaca LANGSUNG dari `HFB.data` pada saat ditanya (perubahan dari formulir 3c dan hapus 3d langsung terbaca, tanpa daftar ulang). Bila catatan buatan belum dimuat saat isi `us.*` ditanya: kartu dilaporkan tanpa isi (perilaku lama hfvModel: tidak ikut antre, dihitung `tanpaIsi`), pemuatan dimulai SEKALI per 8 detik, dan tab digambar ulang bila pemuatan berhasil dan tab Hafalan masih terbuka. Isi dikembalikan sebagai salinan { depan, belakang }. BELUM ADA cara memasukkan kartu buatan ke jadwal (formulir 3c), jadi tampilan hari ini TIDAK berubah. Pendaftaran 2b dipertahankan; blok ini mendaftar ulang di atasnya (0 baris lama diubah). Membalik: hapus blok ini. ===== */
let hfbIb = null, hfbMap = { d: null, m: null }, hfbKickT = 0;
function hfbIbIsi(id) { if (!hfbIb) hfbIb = hfdIsiDari(hfdDeck()); return hfbIb(id); }   // isi Ibadah, dibangun malas sekali
function hfbKick() {   // mulai memuat catatan buatan (sekali per 8 detik); selesai = gambar ulang hanya bila berhasil dan tab Hafalan masih terbuka
  if (HFB.ready || Date.now() - hfbKickT < 8000) return;
  hfbKickT = Date.now(); hfbLoad().then(() => { if (HFB.ready && hfvOn()) nwRender('sinaps'); });
}
function hfbIsiGabung(id) {   // id -> { depan, belakang } (salinan) atau null; TIDAK melempar untuk id apa pun
  if (typeof id !== 'string') return null;
  const a = hfbIbIsi(id); if (a) return a;
  if (id.indexOf(HFU.awal) !== 0) return null;
  if (!HFB.ready) { hfbKick(); return null; }
  if (hfbMap.d !== HFB.data) hfbMap = { d: HFB.data, m: new Map(HFB.data.kartu.map(c => [c.id, c])) };
  const k = hfbMap.m.get(id); return k ? { depan: k.depan, belakang: k.belakang } : null;
}
try { hfvPakaiIsi(hfbIsiGabung); } catch (e) { /* abaikan: tab tetap memakai isi Ibadah */ }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3b3: Object.freeze({ isi: hfbIsiGabung }) }));
/* ===== OTH-3b3-end ===== */
/* ===== OTH-3c1a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3c-1a: LOGIKA MURNI isian formulir kartu BUATAN SENDIRI (state formulir, penghitung huruf, pesan galat per kolom, status tombol Simpan). Hanya hitung: TIDAK menulis, TIDAK menyimpan, belum ada tampilan, belum memanggil hfbTambah/hfbUbah (3c-1b). Memakai HFU, hfuTeks, hfuCek, hfuBersih, hfuDaftar dari OTH-3a. Membalik: hapus blok ini. */
const HFF_RAW = 10000, HFF_KOLOM = Object.freeze(['depan', 'belakang']);
const HFF_PESAN = Object.freeze({
  depan_kosong: 'Isi bagian depan (pertanyaan) dulu.', belakang_kosong: 'Isi bagian belakang (jawaban) dulu.',
  depan_panjang: 'Bagian depan terlalu panjang (maks ' + HFU.depanMax + ' huruf).', belakang_panjang: 'Bagian belakang terlalu panjang (maks ' + HFU.belakangMax + ' huruf).',
  kembar: 'Sudah ada kartu dengan bagian depan yang sama.', penuh: 'Sudah ada ' + HFU.cap + ' kartu buatan sendiri, hapus satu dulu.', tidak_ada: 'Kartu ini sudah tidak ada (mungkin dihapus di perangkat lain).',
  belum_siap: 'Catatan kartu belum selesai dimuat, coba lagi sebentar lagi.', versi_baru: 'Catatan kartu dibuat versi aplikasi yang lebih baru, jadi tidak diubah.', waktu: 'Jam perangkat tidak wajar, kartu tidak disimpan.', id_gagal: 'Gagal membuat id kartu, coba lagi.'
});
const hffRaw = v => (typeof v === 'string' ? v.slice(0, HFF_RAW) : '');
function hffState(mode, id, depan, belakang, awal, sentuh, coba) { const sn = sentuh && typeof sentuh === 'object' ? sentuh : {}; return Object.freeze({ mode, id, depan, belakang, awal, sentuh: Object.freeze({ depan: !!sn.depan, belakang: !!sn.belakang }), coba: !!coba }); }
function hffBaru() { return hffState('baru', null, '', '', Object.freeze({ depan: '', belakang: '' }), {}, false); }   // MURNI: formulir kosong untuk kartu baru
function hffDari(kartu) {   // MURNI: kartu tersimpan -> formulir mode ubah (isian = isi kartu, awal = isi kartu), atau null bila kartu tidak sah
  const k = hfuBersih(kartu); if (!k) return null;
  return hffState('ubah', k.id, k.depan, k.belakang, Object.freeze({ depan: k.depan, belakang: k.belakang }), {}, false);
}
function hffIsi(s, kolom, nilai) {   // MURNI: -> formulir baru dengan satu kolom diisi (ditandai disentuh); kolom tak dikenal atau formulir tak sah = formulir tidak berubah; nilai bukan teks = kosong
  if (!s || typeof s !== 'object' || HFF_KOLOM.indexOf(kolom) < 0) return s;
  const n = hffRaw(nilai), x = { depan: s.depan, belakang: s.belakang }; x[kolom] = n;
  return hffState(s.mode, s.id, x.depan, x.belakang, s.awal, Object.assign({}, s.sentuh, { [kolom]: true }), s.coba);
}
function hffSentuh(s, kolom) {   // MURNI: tandai satu kolom disentuh (mis. saat kolom ditinggalkan) tanpa mengubah isinya
  if (!s || typeof s !== 'object' || HFF_KOLOM.indexOf(kolom) < 0) return s;
  return hffState(s.mode, s.id, s.depan, s.belakang, s.awal, Object.assign({}, s.sentuh, { [kolom]: true }), s.coba);
}
function hffCoba(s) {   // MURNI: pemilik menekan Simpan: semua galat boleh tampil
  if (!s || typeof s !== 'object') return s;
  return hffState(s.mode, s.id, s.depan, s.belakang, s.awal, s.sentuh, true);
}
function hffHitung(s) {   // MURNI: { depan:{n,max,sisa,lebih}, belakang:{...} } dari teks yang SUDAH dibersihkan (sama dengan yang diperiksa hfuCek); tidak melempar
  const o = s && typeof s === 'object' ? s : {}, h = (v, max) => { const n = hfuTeks(v).length; return Object.freeze({ n, max, sisa: max - n, lebih: n > max }); };
  return Object.freeze({ depan: h(o.depan, HFU.depanMax), belakang: h(o.belakang, HFU.belakangMax) });
}
function hffGalat(s, daftar) {   // MURNI: -> { depan, belakang, umum } berisi kode galat atau null (SEMUA galat, tanpa melihat disentuh); umum: penuh (mode baru), tidak_ada (mode ubah, kartu hilang); kembar = depan sama dengan kartu LAIN
  const o = s && typeof s === 'object' ? s : {}, L = hfuDaftar(daftar).kartu, d = hfuTeks(o.depan), b = hfuTeks(o.belakang), ubah = o.mode === 'ubah';
  const r = { depan: null, belakang: null, umum: null };
  if (!d) r.depan = 'depan_kosong'; else if (d.length > HFU.depanMax) r.depan = 'depan_panjang'; else if (L.some(x => (!ubah || x.id !== o.id) && x.depan === d)) r.depan = 'kembar';
  if (!b) r.belakang = 'belakang_kosong'; else if (b.length > HFU.belakangMax) r.belakang = 'belakang_panjang';
  if (ubah) { if (!L.some(x => x.id === o.id)) r.umum = 'tidak_ada'; } else if (L.length >= HFU.cap) r.umum = 'penuh';
  return Object.freeze(r);
}
function hffTampil(s, daftar) {   // MURNI: galat yang BOLEH ditampilkan sekarang (kolom disentuh, atau sesudah Simpan ditekan); galat umum selalu tampil; -> { depan, belakang, umum } kode atau null
  const g = hffGalat(s, daftar), o = s && typeof s === 'object' ? s : {}, sn = o.sentuh || {}, buka = !!o.coba;
  return Object.freeze({ depan: buka || sn.depan ? g.depan : null, belakang: buka || sn.belakang ? g.belakang : null, umum: g.umum });
}
function hffKotor(s) {   // MURNI: ada perubahan dibanding awal? (dibandingkan sesudah dibersihkan, jadi spasi/baris kosong tambahan bukan perubahan)
  const o = s && typeof s === 'object' ? s : {}, a = o.awal && typeof o.awal === 'object' ? o.awal : {};
  return hfuTeks(o.depan) !== hfuTeks(a.depan) || hfuTeks(o.belakang) !== hfuTeks(a.belakang);
}
function hffStatus(s, daftar) {   // MURNI: -> { bisa, kotor, galat } bisa = Simpan boleh jalan (tanpa galat; mode ubah juga harus ada perubahan); galat = hffGalat
  const g = hffGalat(s, daftar), kotor = hffKotor(s), tanpaGalat = !g.depan && !g.belakang && !g.umum, ubah = !!s && s.mode === 'ubah';
  return Object.freeze({ bisa: tanpaGalat && (ubah ? kotor : true), kotor, galat: g });
}
function hffMasuk(s) {   // MURNI: -> { depan, belakang } untuk hfbTambah / hfbUbah (belum dibersihkan; pembersihan tetap oleh hfuCek di satu pintu tulis)
  const o = s && typeof s === 'object' ? s : {}; return Object.freeze({ depan: typeof o.depan === 'string' ? o.depan : '', belakang: typeof o.belakang === 'string' ? o.belakang : '' });
}
function hffPesan(kode) { return Object.prototype.hasOwnProperty.call(HFF_PESAN, kode) ? HFF_PESAN[kode] : 'Kartu belum bisa disimpan.'; }   // MURNI: kode galat -> kalimat untuk pemilik; kode tak dikenal = kalimat umum
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3c1a: Object.freeze({ baru: hffBaru, dari: hffDari, isi: hffIsi, sentuh: hffSentuh, coba: hffCoba, hitung: hffHitung, galat: hffGalat, tampil: hffTampil, kotor: hffKotor, status: hffStatus, masuk: hffMasuk, pesan: hffPesan }) }));
/* ===== OTH-3c1a-end ===== */
/* ===== OTH-3c1b-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3c-1b: AKSI formulir kartu BUATAN SENDIRI tanpa tampilan: hffSimpan (periksa ulang sesudah catatan dimuat, lalu tambah/ubah lewat hfbTambah/hfbUbah; kartu BARU otomatis dimasukkan ke jadwal lewat hfdAksi + hfsPut) dan hffJadwalkan (memasukkan kartu buatan yang belum ada di jadwal; tidak pernah menimpa kemajuan menghafal). Satu kunci sibuk. Belum ada tombol atau tampilan (3c-2). Membalik: hapus blok ini. */
const HFFA = { busy: false };
const HFFA_PESAN = Object.freeze({
  sibuk: 'Masih menyimpan, tunggu sebentar.', bukan_formulir: 'Formulir tidak dikenali; tutup lalu buka lagi.', tanpa_perubahan: 'Belum ada yang diubah.', galat: 'Penyimpanan di perangkat gagal, coba lagi.',
  ok_baru: 'Kartu disimpan.', ok_baru_jadwal: 'Kartu disimpan dan dimasukkan ke jadwal hafalan.', ok_ubah: 'Perubahan disimpan.',
  jadwal_penuh: 'Jadwal hafalan sudah penuh (batas ' + HFS_CAP + ' kartu), jadi kartu belum bisa dimasukkan.', jadwal_tidak_ada: 'Semua kartu buatan sendiri sudah ada di jadwal.', tanggal: 'Tanggal perangkat tidak terbaca, jadi kartu belum bisa dimasukkan ke jadwal.'
});
const hffAda = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function hffPesanAksi(kode) { return hffAda(HFFA_PESAN, kode) ? HFFA_PESAN[kode] : hffPesan(kode); }   // MURNI: kode hasil aksi -> kalimat; kode tak dikenal = kalimat dari hffPesan
function hffKodeGalat(g) {   // MURNI: hasil hffGalat -> SATU kode menurut urutan hfuBuat/hfuUbah (isian dulu, lalu penuh/tidak_ada, lalu kembar), atau null bila tanpa galat; masukan sampah = null
  if (!g || typeof g !== 'object') return null;
  if (g.depan === 'depan_kosong' || g.belakang === 'belakang_kosong' || g.depan === 'depan_panjang' || g.belakang === 'belakang_panjang') return g.depan === 'depan_kosong' ? 'depan_kosong' : g.belakang === 'belakang_kosong' ? 'belakang_kosong' : g.depan === 'depan_panjang' ? 'depan_panjang' : 'belakang_panjang';
  if (g.umum === 'penuh' || g.umum === 'tidak_ada') return g.umum;
  return g.depan === 'kembar' ? 'kembar' : null;
}
async function hffJadwalkan0(now) {   // -> { ok, kode, jumlah, terpotong } beku; kode: ok | belum_siap | versi_baru | tidak_ada | penuh | tanggal | deck | kategori | isi | waktu | galat; tidak memakai kunci sibuk
  const g = (kode, terpotong) => Object.freeze({ ok: false, kode, jumlah: 0, terpotong: terpotong | 0 });
  await hfbLoad(); await hfsLoad();
  if (!HFB.ready || !HFS.ready) return g('belum_siap');
  if (HFB.blocked || HFS.blocked) return g('versi_baru');
  const r = hfdAksi(hfuDeck(HFB.data.kartu), HFS.data.kartu, today(), HFU.kat, HFS_CAP);
  if (!r.ok) return g(r.kode, r.terpotong);
  const x = await hfsPut(r.kartu.slice(), now === undefined ? Date.now() : now);
  return x && x.ok ? Object.freeze({ ok: true, kode: 'ok', jumlah: r.kartu.length, terpotong: r.terpotong }) : g(x && typeof x.kode === 'string' && x.kode ? x.kode : 'galat');
}
async function hffJadwalkan(now) {   // memasukkan SEMUA kartu buatan yang belum ada di jadwal; -> { ok, kode, jumlah, terpotong, pesan } beku; tidak melempar
  if (HFFA.busy) return Object.freeze({ ok: false, kode: 'sibuk', jumlah: 0, terpotong: 0, pesan: hffPesanAksi('sibuk') });
  HFFA.busy = true;
  try {
    const j = await hffJadwalkan0(now);
    const pesan = j.ok ? j.jumlah + ' kartu buatan sendiri dimasukkan ke jadwal.' + (j.terpotong > 0 ? ' ' + j.terpotong + ' kartu lain belum masuk karena jadwal penuh.' : '') : j.kode === 'tidak_ada' ? hffPesanAksi('jadwal_tidak_ada') : j.kode === 'penuh' ? hffPesanAksi('jadwal_penuh') : j.kode === 'tanggal' ? hffPesanAksi('tanggal') : hffAda(HFD_ALASAN, j.kode) ? 'Belum masuk jadwal: ' + HFD_ALASAN[j.kode] + '.' : hffPesanAksi('galat');
    return Object.freeze(Object.assign({}, j, { pesan }));
  } catch (e) { return Object.freeze({ ok: false, kode: 'galat', jumlah: 0, terpotong: 0, pesan: hffPesanAksi('galat') }); }
  finally { HFFA.busy = false; }
}
async function hffSimpan(s, now) {   // formulir -> { ok, kode, kartu, jadwal, formulir, pesan } beku; tidak melempar. Gagal = TIDAK ada yang ditulis (formulir kembali dengan coba=true supaya galat tampil); ok mode baru = formulir kosong + kartu masuk jadwal (jadwal: hasil hffJadwalkan0, bisa gagal tanpa membatalkan kartu); ok mode ubah = formulir dari kartu baru
  const hasil = (ok, kode, kartu, jadwal, formulir, pesan) => Object.freeze({ ok, kode, kartu, jadwal, formulir, pesan: pesan || hffPesanAksi(kode) });
  const gagal = (kode, f) => hasil(false, kode, null, null, f, null);
  if (!s || typeof s !== 'object' || (s.mode !== 'baru' && s.mode !== 'ubah')) return gagal('bukan_formulir', s);
  if (HFFA.busy) return gagal('sibuk', s);
  HFFA.busy = true;
  try {
    await hfbLoad();
    if (!HFB.ready) return gagal('belum_siap', hffCoba(s));
    if (HFB.blocked) return gagal('versi_baru', hffCoba(s));
    const st = hffStatus(s, HFB.data.kartu);
    if (!st.bisa) return gagal(hffKodeGalat(st.galat) || 'tanpa_perubahan', hffCoba(s));
    const masuk = hffMasuk(s), r = s.mode === 'baru' ? await hfbTambah(masuk, now) : await hfbUbah(s.id, masuk, now);
    if (!r || !r.ok) return gagal(r && typeof r.kode === 'string' && r.kode ? r.kode : 'galat', hffCoba(s));
    if (s.mode === 'ubah') return hasil(true, 'ok', r.kartu, null, hffDari(r.kartu), hffPesanAksi('ok_ubah'));
    let j; try { j = await hffJadwalkan0(now); } catch (e) { j = Object.freeze({ ok: false, kode: 'galat', jumlah: 0, terpotong: 0 }); }
    const alasan = j.kode === 'penuh' ? 'jadwal sudah penuh' : hffAda(HFD_ALASAN, j.kode) ? HFD_ALASAN[j.kode] : 'terjadi galat';
    const pesan = j.ok ? hffPesanAksi('ok_baru_jadwal') : j.kode === 'tidak_ada' ? hffPesanAksi('ok_baru') : 'Kartu disimpan, tetapi belum masuk jadwal hafalan: ' + alasan + '. Kamu bisa memasukkannya nanti.';
    return hasil(true, 'ok', r.kartu, j, hffBaru(), pesan);
  } catch (e) { return gagal('galat', hffCoba(s)); }
  finally { HFFA.busy = false; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3c1b: Object.freeze({ simpan: hffSimpan, jadwalkan: hffJadwalkan, pesan: hffPesanAksi, kodeGalat: hffKodeGalat, sibuk: () => HFFA.busy }) }));
/* ===== OTH-3c1b-end ===== */
/* ===== OTH-3c2a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3c-2a: PEMBANGUN HTML MURNI kartu "Kartu buatan sendiri" (ringkasan, tombol Tambah, formulir depan/belakang dengan penghitung huruf dan galat per kolom, daftar dengan tombol Ubah, tombol "Masukkan ke jadwal" untuk kartu yang belum ada di jadwal). Hanya membangun teks HTML: TIDAK menulis, TIDAK memanggil hfbTambah/hfbUbah/hffSimpan, belum dipasang ke tab, belum ada CSS dan penangan ketuk (3c-2b). Semua teks dari luar lewat esc(). Memakai HFU (3a), hfuDaftar (3a), HFF_RAW/hffHitung/hffTampil/hffStatus/hffPesan (3c-1a). Membalik: hapus blok ini. ===== */
const HFK_TAMPIL = 20, HFK_CUPLIK = 80;
const hfkCuplik = (v, n) => { const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''; return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };   // MURNI: satu baris, spasi/baris baru dipadatkan, dipotong n huruf + …
function hfkRingkas(daftar, jadwal, semua) {   // MURNI: -> { total, yatim, baris:[{id,depan,belakang}], sisa } beku; baris = terbaru dulu (dibuat menurun, id naik), HFK_TAMPIL pertama kecuali semua === true; yatim = kartu buatan yang id-nya belum ada di `jadwal` (daftar kartu jadwal; bukan daftar = 0, artinya jadwal belum siap)
  const L = hfuDaftar(daftar).kartu, ada = Array.isArray(jadwal) ? new Set(jadwal.filter(x => x && typeof x === 'object' && typeof x.id === 'string').map(x => x.id)) : null;
  const urut = L.slice().sort((a, b) => (b.dibuat - a.dibuat) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const baris = (semua === true ? urut : urut.slice(0, HFK_TAMPIL)).map(k => Object.freeze({ id: k.id, depan: hfkCuplik(k.depan, HFK_CUPLIK), belakang: hfkCuplik(k.belakang, HFK_CUPLIK) }));
  return Object.freeze({ total: L.length, yatim: ada ? L.filter(k => !ada.has(k.id)).length : 0, baris: Object.freeze(baris), sisa: L.length - baris.length });
}
function hfkForm(f, u, daftar) {   // MURNI: formulir (mode baru atau ubah) -> teks HTML; galat per kolom hanya bila kolom disentuh atau Simpan sudah ditekan (hffTampil)
  const T = hffTampil(f, daftar), S = hffStatus(f, daftar), H = hffHitung(f), ubah = f.mode === 'ubah', sibuk = u.sibuk === true;
  const fld = (k, judul, baris) => {
    const e = T[k], h = H[k], id = 'hfk-' + k;
    return '<div class="hfk-fld' + (e ? ' is-err' : '') + '"><label for="' + id + '">' + judul + '</label><textarea id="' + id + '" class="hfk-ta" data-f="' + k + '" rows="' + baris + '" maxlength="' + HFF_RAW + '" aria-describedby="hfk-c-' + k + (e ? ' hfk-e-' + k : '') + '"' + (e ? ' aria-invalid="true"' : '') + (sibuk ? ' readonly' : '') + '>' + esc(typeof f[k] === 'string' ? f[k] : '') + '</textarea><div class="hfk-meta"><span class="hfk-c' + (h.lebih ? ' is-lebih' : '') + '" id="hfk-c-' + k + '">' + h.n + ' dari ' + h.max + ' huruf</span>' + (e ? '<span class="hfk-e" id="hfk-e-' + k + '">' + esc(hffPesan(e)) + '</span>' : '') + '</div></div>';
  };
  return '<div class="hfk-form" role="group" aria-label="' + (ubah ? 'Ubah kartu' : 'Kartu baru') + '"><h4 class="hfk-ft">' + (ubah ? 'Ubah kartu' : 'Kartu baru') + '</h4>'
    + fld('depan', 'Depan (pertanyaan)', 2) + fld('belakang', 'Belakang (jawaban)', 4)
    + (T.umum ? '<p class="nw-p hfk-err" role="alert">' + esc(hffPesan(T.umum)) + '</p>' : '')
    + '<div class="hfk-act"><button class="btn sm primary hfk-save" type="button" data-q="hfkSimpan" data-fk="hfk-simpan"' + (sibuk || (ubah && !S.kotor) ? ' disabled' : '') + '>' + (sibuk ? 'Menyimpan…' : ubah ? 'Simpan perubahan' : 'Simpan kartu') + '</button><button class="btn sm ghost hfk-cancel" type="button" data-q="hfkTutup" data-fk="hfk-tutup"' + (sibuk ? ' disabled' : '') + '>Batal</button></div></div>';
}
function hfkHtml(ui, st, daftar, jadwal) {   // MURNI, tidak mengubah masukan, tidak melempar; ui = { form (state hff atau null), pesan:{ok,teks}, sibuk, semua }, st = hfbState (ready, loading, blocked), daftar = kartu buatan (HFB.data.kartu), jadwal = daftar kartu jadwal atau null bila belum siap
  const head = '<section class="nw-card hfk-card" id="hfkBody" aria-label="Kartu buatan sendiri"><div class="nw-hd"><h3>Kartu buatan sendiri</h3></div>', foot = '</section>';
  try {
    if (!st || typeof st !== 'object' || !st.ready) return head + '<p class="nw-p hfk-m"' + (st && st.loading ? ' role="status"' : '') + '>' + (st && st.loading ? 'Memuat kartu buatan sendiri…' : 'Kartu buatan sendiri belum bisa dibaca di perangkat ini.') + '</p>' + foot;
    const u = ui && typeof ui === 'object' ? ui : {}, f = u.form && typeof u.form === 'object' && (u.form.mode === 'baru' || u.form.mode === 'ubah') ? u.form : null, r = hfkRingkas(daftar, jadwal, u.semua === true), mati = u.sibuk === true;
    const jml = r.total ? '<p class="nw-p hfk-sum"><b>' + r.total + '</b> kartu buatan sendiri (maks ' + HFU.cap + ').</p>' : '<p class="nw-p hfk-sum">Belum ada kartu buatan sendiri.</p>';
    if (st.blocked === true) return head + jml + '<p class="nw-p hfk-n2">Catatan kartu di perangkat ini berasal dari versi aplikasi yang lebih baru. Menambah dan mengubah dimatikan supaya catatan itu tidak tertimpa.</p>' + foot;
    let x = head + '<p class="nw-p hfk-intro">Tulis pertanyaan di bagian depan dan jawabannya di bagian belakang. Kartu baru langsung masuk jadwal hafalan.</p>' + jml;
    if (r.yatim > 0) x += '<p class="nw-p hfk-n2">' + r.yatim + ' kartu belum ada di jadwal hafalan.</p><button class="btn sm hfk-jad" type="button" data-q="hfkJadwal" data-fk="hfk-jadwal"' + (mati ? ' disabled' : '') + '>Masukkan ' + r.yatim + ' kartu ke jadwal</button>';
    if (f) x += hfkForm(f, u, daftar);
    else { const penuh = r.total >= HFU.cap; x += '<button class="btn sm primary hfk-add" type="button" data-q="hfkBuka" data-fk="hfk-buka"' + (mati || penuh ? ' disabled' : '') + '>Tambah kartu sendiri</button>' + (penuh ? '<p class="nw-p hfk-n2">' + esc(hffPesan('penuh')) + '</p>' : ''); }
    const p = u.pesan && typeof u.pesan === 'object' && typeof u.pesan.teks === 'string' && u.pesan.teks ? u.pesan : null;
    if (p) x += '<p class="nw-p hfk-msg ' + (p.ok === true ? 'is-ok' : 'is-err') + '" role="status" aria-live="polite">' + esc(p.teks.slice(0, 300)) + '</p>';
    if (r.baris.length) {
      x += '<ul class="hfk-list" aria-label="Daftar kartu buatan sendiri">' + r.baris.map(k => { const sed = !!f && f.mode === 'ubah' && f.id === k.id; return '<li class="hfk-row' + (sed ? ' is-edit' : '') + '"><div class="hfk-nm"><span class="hfk-n">' + esc(k.depan) + '</span><small>' + esc(k.belakang) + '</small></div><button class="btn sm hfk-ubah" type="button" data-q="hfkUbah" data-id="' + esc(k.id) + '" data-fk="hfk-ubah-' + esc(k.id) + '"' + (sed || mati ? ' disabled' : '') + ' aria-label="Ubah kartu: ' + esc(k.depan) + '">' + (sed ? 'Sedang diubah' : 'Ubah') + '</button></li>'; }).join('') + '</ul>';
      if (r.sisa > 0) x += '<button class="btn sm ghost hfk-semua" type="button" data-q="hfkSemua" data-fk="hfk-semua">Tampilkan ' + r.sisa + ' kartu lainnya</button>';
      else if (u.semua === true && r.total > HFK_TAMPIL) x += '<button class="btn sm ghost hfk-semua" type="button" data-q="hfkSemua" data-fk="hfk-semua">Tampilkan ' + HFK_TAMPIL + ' terbaru saja</button>';
    }
    return x + foot;
  } catch (e) { return head + '<p class="nw-p hfk-m">Kartu buatan sendiri tidak bisa ditampilkan.</p>' + foot; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3c2a: Object.freeze({ html: hfkHtml, ringkas: hfkRingkas, cuplik: hfkCuplik, batas: Object.freeze({ tampil: HFK_TAMPIL, cuplik: HFK_CUPLIK }) }) }));
/* ===== OTH-3c2a-end ===== */
/* ===== OTH-3c2b1-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3c-2b-1: PEMASANGAN kartu "Kartu buatan sendiri" tepat di bawah kartu "Deck Doa & dzikir" + penangan ketuk BUKA / TUTUP / UBAH / TAMPILKAN SEMUA + ketikan di kolom (state formulir ikut, penghitung huruf dan galat diperbarui DI TEMPAT tanpa mengganti textarea, jadi kursor dan fokus aman). BELUM ada penangan Simpan dan Masukkan ke jadwal (3c-2b-2): ketukan keduanya belum melakukan apa pun. Tidak menulis apa pun ke penyimpanan. Pagar: hanya bila tab Hafalan terbuka, catatan buatan siap, bukan catatan versi lebih baru, tidak sedang sibuk. Logika murni = OTH-3c-1a (hff*), pembangun = OTH-3c-2a (hfkHtml). Membalik: hapus blok ini dan CSS OTH-3c2b1. ===== */
const HFKU = { form: null, pesan: null, sibuk: false, semua: false };   // form = state hff atau null; pesan = { ok, teks } atau null; sibuk dipakai 3c-2b-2 (menyimpan); semua = tampilkan semua kartu
const hfkUi = () => ({ form: HFKU.form, pesan: HFKU.pesan, sibuk: HFKU.sibuk, semua: HFKU.semua });
function hfkJadwalData() { const s = hfsState(); return s.ready && !s.blocked ? HFS.data.kartu : null; }   // daftar kartu jadwal, atau null bila jadwal belum siap
const hfkSiap = () => hfvOn() && HFB.ready && !HFB.blocked && !HFKU.sibuk;
function hfkDraw() { if (hfvOn()) nwRender('sinaps'); }
function hfkFokusKe(fk) {   // fk = id textarea ('hfk-depan'), nilai data-fk tombol, atau '#hfkBody'; yang sudah tidak ada atau mati = fokus ke kartu
  const root = $('#nwSinapsBody'); if (!root) return;
  let el = fk !== '#hfkBody' ? (root.querySelector('textarea[id="' + fk + '"]') || [...root.querySelectorAll('[data-fk]')].find(x => x.dataset.fk === fk)) : null;
  if (!el || el.disabled) el = root.querySelector('#hfkBody'); if (!el) return;
  if (el.id === 'hfkBody') el.setAttribute('tabindex', '-1');
  try { el.focus({ preventScroll: el.id === 'hfkBody' }); } catch (e) { /* abaikan */ }
}
function hfkMount() {   // pasang kartu tepat sesudah kartu deck (atau kartu ulasan bila deck tidak ada); -> elemen kartu, atau null; tidak pernah menggandakan, tidak melempar
  try {
    const root = $('#nwSinapsBody'), w = root && (root.querySelector('#hfdBody') || root.querySelector('#hfvWrap')); if (!w) return null;
    root.querySelectorAll('#hfkBody').forEach(x => x.remove());
    hfbKick();
    w.insertAdjacentHTML('afterend', hfkHtml(hfkUi(), hfbState(), HFB.data.kartu, hfkJadwalData()));
    return root.querySelector('#hfkBody');
  } catch (e) { return null; }
}
function hfkPatch() {   // sesudah ketikan atau kolom ditinggalkan: perbarui penghitung, galat per kolom, dan tombol Simpan TANPA mengganti textarea; false = perlu gambar ulang penuh
  try {
    const root = $('#hfkBody'); if (!root || !HFKU.form) return false;
    const tmp = document.createElement('div'); tmp.innerHTML = hfkHtml(hfkUi(), hfbState(), HFB.data.kartu, hfkJadwalData());
    const nb = tmp.querySelector('#hfkBody'); if (!nb) return false;
    for (const k of HFF_KOLOM) {
      const a = root.querySelector('#hfk-' + k), b = nb.querySelector('#hfk-' + k), fa = a && a.closest('.hfk-fld'), fb = b && b.closest('.hfk-fld');
      const ma = fa && fa.querySelector('.hfk-meta'), mb = fb && fb.querySelector('.hfk-meta'); if (!ma || !mb) return false;
      ma.replaceWith(mb); fa.className = fb.className;
      ['aria-invalid', 'aria-describedby'].forEach(n => { if (b.hasAttribute(n)) a.setAttribute(n, b.getAttribute(n)); else a.removeAttribute(n); });
    }
    const ua = root.querySelector('.hfk-err'), ub = nb.querySelector('.hfk-err'); if (!!ua !== !!ub || (ua && ua.textContent !== ub.textContent)) return false;
    const sa = root.querySelector('[data-q="hfkSimpan"]'), sb = nb.querySelector('[data-q="hfkSimpan"]'); if (!sa || !sb) return false;
    sa.disabled = sb.disabled; sa.textContent = sb.textContent;
    return true;
  } catch (e) { return false; }
}
QACT.hfkBuka = () => {
  if (!hfkSiap()) { hfkDraw(); return; }
  if (HFKU.form) { hfkFokusKe('hfk-depan'); return; }
  if (HFB.data.kartu.length >= HFU.cap) { HFKU.pesan = { ok: false, teks: hffPesan('penuh') }; hfkDraw(); return; }
  HFKU.form = hffBaru(); HFKU.pesan = null; hfkDraw(); hfkFokusKe('hfk-depan');
};
QACT.hfkTutup = () => {
  if (!hfvOn() || HFKU.sibuk) return;
  const f = HFKU.form; HFKU.form = null; HFKU.pesan = null; hfkDraw(); hfkFokusKe(f && f.mode === 'ubah' ? 'hfk-ubah-' + f.id : 'hfk-buka');
};
QACT.hfkUbah = el => {
  if (!hfkSiap()) { hfkDraw(); return; }
  const id = el && el.dataset && typeof el.dataset.id === 'string' ? el.dataset.id : '', k = HFB.data.kartu.find(x => x && x.id === id), f = k ? hffDari(k) : null;
  if (!f) { HFKU.pesan = { ok: false, teks: hffPesan('tidak_ada') }; hfkDraw(); return; }
  if (HFKU.form && hffKotor(HFKU.form)) { HFKU.pesan = { ok: false, teks: 'Formulir yang terbuka belum disimpan. Simpan atau batalkan dulu.' }; hfkDraw(); hfkFokusKe('hfk-depan'); return; }
  HFKU.form = f; HFKU.pesan = null; hfkDraw(); hfkFokusKe('hfk-depan');
};
QACT.hfkSemua = () => { if (!hfvOn()) return; HFKU.semua = !HFKU.semua; hfkDraw(); hfkFokusKe('hfk-semua'); };
document.addEventListener('input', ev => {   // ketikan di kolom formulir: state ikut; tampilan diperbarui di tempat
  const el = ev.target; if (!el || !el.classList || !el.classList.contains('hfk-ta') || !HFKU.form || HFKU.sibuk) return;
  const k = el.dataset.f; if (HFF_KOLOM.indexOf(k) < 0) return;
  HFKU.form = hffIsi(HFKU.form, k, el.value); if (!hfkPatch()) hfkDraw();
});
document.addEventListener('focusout', ev => {   // kolom ditinggalkan = disentuh: galat kolom itu boleh tampil (tombol di bawahnya tidak diganti, jadi ketukan tidak hilang)
  const el = ev.target; if (!el || !el.classList || !el.classList.contains('hfk-ta') || !HFKU.form || HFKU.sibuk) return;
  const k = el.dataset.f; if (HFF_KOLOM.indexOf(k) < 0) return;
  HFKU.form = hffSentuh(HFKU.form, k); hfkPatch();
});
{ const baseNwOth3c = nwRender; nwRender = function (key) {
  const root = key === 'sinaps' ? $('#nwSinapsBody') : null, ae = document.activeElement, inK = !!(root && ae && root.contains(ae) && ae.closest && ae.closest('#hfkBody'));
  const ta = inK && ae.classList.contains('hfk-ta') ? { id: ae.id, a: ae.selectionStart, b: ae.selectionEnd } : null, fk = inK && !ta ? (ae.id === 'hfkBody' ? '#hfkBody' : (ae.dataset && typeof ae.dataset.fk === 'string' ? ae.dataset.fk : null)) : null;   // fokus (dan kursor) dipulihkan sesudah kartu diganti
  if (key === 'sinaps' && nwTab.sinaps !== 'hafalan' && !HFKU.sibuk) HFKU.pesan = null;   // keluar dari tab Hafalan = pesan dibuang (isian formulir tetap ada selama aplikasi terbuka)
  baseNwOth3c.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps === 'hafalan') {
    hfkMount();
    if (ta) { hfkFokusKe(ta.id); const t = $('#' + ta.id); try { if (t && ta.a !== null) t.setSelectionRange(ta.a, ta.b); } catch (e) { /* abaikan */ } } else if (fk) hfkFokusKe(fk);
  }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3c2b1: Object.freeze({ mount: hfkMount, patch: hfkPatch, ui: () => Object.freeze(hfkUi()), buka: QACT.hfkBuka, tutup: QACT.hfkTutup, ubah: QACT.hfkUbah, semua: QACT.hfkSemua }) }));
/* ===== OTH-3c2b1-end ===== */
/* ===== OTH-3c2b2-begin (22 Nov 2026): Sinaps > Hafalan, bagian 3c-2b-2: tombol SIMPAN (QACT.hfkSimpan) dan MASUKKAN KE JADWAL (QACT.hfkJadwal) HIDUP. Memanggil aksi OTH-3c-1b (hffSimpan, hffJadwalkan) yang sudah teruji; di sini hanya urusan tampilan: HFKU.sibuk diatur SINKRON sebelum menunggu apa pun (ketuk ganda tidak menulis dua kali), formulir dan pesan diperbarui dari hasil, gambar ulang tab (kartu ulasan ikut menyala), fokus dipindah dengan benar. Galat kolom (kosong, kepanjangan, kembar) hanya tampil di kolomnya (tanpa pesan ganda) dan fokus ke kolom bergalat pertama; ubah sukses = formulir ditutup; kartu baru sukses = formulir kosong siap kartu berikutnya. Pindah tab selama menyimpan: formulir tetap diperbarui (supaya tidak tersimpan dua kali), pesan basi dibuang. Membalik: hapus blok ini. ===== */
const HFK_KODE_KOLOM = Object.freeze(['depan_kosong', 'belakang_kosong', 'depan_panjang', 'belakang_panjang', 'kembar']);   // galat yang sudah tampil di kolomnya
function hfkSelesai(r, f0, mode0, pulih) {   // hasil aksi -> state tampilan, gambar ulang, fokus; hanya dipakai dua penangan di bawah
  HFKU.sibuk = false;
  const on = hfvOn(), ok = !!r && typeof r === 'object' && r.ok === true;
  if (pulih === 'simpan') {
    const kode = r && typeof r.kode === 'string' ? r.kode : 'galat';
    if (ok) HFKU.form = mode0 === 'ubah' ? null : hffBaru(); else HFKU.form = r && r.formulir && typeof r.formulir === 'object' ? r.formulir : f0;
    const dikolom = !ok && HFK_KODE_KOLOM.indexOf(kode) >= 0;
    HFKU.pesan = on && !dikolom ? { ok, teks: r && typeof r.pesan === 'string' && r.pesan ? r.pesan : hffPesanAksi('galat') } : null;
    if (!on) return;
    hfkDraw();
    if (ok) hfkFokusKe(mode0 === 'ubah' ? 'hfk-ubah-' + f0.id : 'hfk-depan');
    else { const bad = $('#hfkBody [aria-invalid="true"]'); hfkFokusKe(bad && bad.id ? bad.id : 'hfk-simpan'); }
  } else {
    HFKU.pesan = on ? { ok, teks: r && typeof r.pesan === 'string' && r.pesan ? r.pesan : hffPesanAksi('galat') } : null;
    if (!on) return;
    hfkDraw(); hfkFokusKe(ok ? '#hfkBody' : 'hfk-jadwal');
  }
}
QACT.hfkSimpan = () => {
  if (!hfvOn() || HFKU.sibuk || HFFA.busy || !HFKU.form) return;
  const f = HFKU.form, st = hfbState(); if (!st.ready || st.blocked) { hfkDraw(); return; }
  HFKU.sibuk = true; HFKU.pesan = null; hfkDraw(); hfkFokusKe('#hfkBody');   // menyimpan = kolom dan tombol mati; fokus ke kartu supaya tidak hilang
  let p; try { p = hffSimpan(f); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(x => x, () => null).then(r => hfkSelesai(r, f, f.mode, 'simpan'));
};
QACT.hfkJadwal = () => {
  if (!hfvOn() || HFKU.sibuk || HFFA.busy) return;
  const st = hfbState(); if (!st.ready || st.blocked) { hfkDraw(); return; }
  HFKU.sibuk = true; HFKU.pesan = null; hfkDraw(); hfkFokusKe('#hfkBody');
  let p; try { p = hffJadwalkan(); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(x => x, () => null).then(r => hfkSelesai(r, null, null, 'jadwal'));
};
window.DL = Object.freeze(Object.assign({}, window.DL, { oth3c2b2: Object.freeze({ simpan: QACT.hfkSimpan, jadwal: QACT.hfkJadwal }) }));
/* ===== OTH-3c2b2-end ===== */
/* ===== OTH-4a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 4a: LOGIKA MURNI kartu "Hafal surah" (pilihan nama surah + jumlah ayat) untuk deck BUATAN SENDIRI. Hanya hitung: TIDAK menulis, TIDAK menyimpan, belum ada tampilan (4b). Kartu surah = kartu biasa { depan, belakang } yang DIBANGKITKAN dari pilihan, jadi format simpan, cadangan, sinkron, dan jadwal TIDAK berubah. Nama Latin + arti + jumlah ayat = QR_SURAH (sumber yang sama dengan halaman Ibadah > Al-Qur'an); nama Arab = gaya equran.id (sumber utama Ibadah), ditanam di sini karena Ibadah mengambilnya dari jaringan. Membalik: hapus blok ini. */
const HFZ_ARAB = Object.freeze([
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال',
  'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل',
  'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون', 'النور',
  'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم', 'لقمان', 'السجدة',
  'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
  'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح',
  'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة',
  'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن',
  'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج', 'نوح', 'الجن',
  'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس',
  'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية',
  'الفجر', 'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق',
  'القدر', 'البينة', 'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة',
  'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص',
  'الفلق', 'الناس'
]);
const hfzNo = v => { const k = typeof v === 'string' && /^[0-9]{1,3}$/.test(v.trim()) ? Number(v.trim()) : v; return Number.isInteger(k) && k >= 1 && k <= 114 ? k : 0; };   // MURNI: nomor surah sah (bilangan bulat atau teks angka 1..114) -> nomor, selain itu 0
function hfzInfo(n) {   // MURNI: nomor -> { n, latin, arti, total, arab } beku, atau null
  const k = hfzNo(n); if (!k) return null;
  const r = QR_SURAH[k - 1]; return Object.freeze({ n: k, latin: r[0], arti: r[1], total: r[2], arab: HFZ_ARAB[k - 1] });
}
function hfzDaftar() { const a = []; for (let k = 1; k <= 114; k++) a.push(hfzInfo(k)); return Object.freeze(a); }   // MURNI: 114 surah berurutan untuk daftar pilihan
const hfzJml = v => (typeof v === "number" ? String(v) : (typeof v === "string" ? v.trim() : ""));   // MURNI: jumlah dari formulir (teks atau bilangan) -> teks bersih; bilangan tak bulat atau tak hingga tetap jadi teks supaya ditolak sebagai tak sah, bukan kosong
function hfzCek(masuk) {   // MURNI: { surah, jumlah } (teks dari formulir atau bilangan) -> { ok:true, n, jumlah, total } atau { ok:false, kode, total? }; kode: bukan_objek, surah_kosong, surah_tak_sah, jumlah_kosong, jumlah_tak_sah, jumlah_lebih; tidak melempar
  if (!masuk || typeof masuk !== 'object') return Object.freeze({ ok: false, kode: 'bukan_objek' });
  const sr = typeof masuk.surah === 'number' ? String(masuk.surah) : (typeof masuk.surah === 'string' ? masuk.surah.trim() : '');
  if (!sr) return Object.freeze({ ok: false, kode: 'surah_kosong' });
  const n = hfzNo(sr); if (!n) return Object.freeze({ ok: false, kode: 'surah_tak_sah' });
  const total = QR_SURAH[n - 1][2], js = hfzJml(masuk.jumlah);
  if (!js) return Object.freeze({ ok: false, kode: 'jumlah_kosong', total });
  if (!/^[0-9]{1,4}$/.test(js) || Number(js) < 1) return Object.freeze({ ok: false, kode: 'jumlah_tak_sah', total });
  const jumlah = Number(js); if (jumlah > total) return Object.freeze({ ok: false, kode: 'jumlah_lebih', total });
  return Object.freeze({ ok: true, n, jumlah, total });
}
function hfzTeks(n, jumlah) {   // MURNI: nomor + jumlah ayat (sudah sah) -> { depan, belakang }; depan = nama Arab, baris kosong, "n. Latin" (seperti judul pembaca Ibadah); belakang = "J ayat" (semua ayat) atau "J dari T ayat"
  const i = hfzInfo(n); if (!i || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > i.total) return null;
  return Object.freeze({ depan: i.arab + '\n\n' + i.n + '. ' + i.latin, belakang: jumlah === i.total ? jumlah + ' ayat' : jumlah + ' dari ' + i.total + ' ayat' });
}
function hfzBuat(masuk) {   // MURNI: pilihan formulir -> { ok:true, n, jumlah, total, penuh, depan, belakang } atau { ok:false, kode }; teks lolos hfuCek (satu pintu tulis tetap hfuCek)
  const c = hfzCek(masuk); if (!c.ok) return c;
  const t = hfzTeks(c.n, c.jumlah); if (!t) return Object.freeze({ ok: false, kode: 'surah_tak_sah' });
  const k = hfuCek(t); if (!k.ok) return Object.freeze({ ok: false, kode: k.kode });
  return Object.freeze({ ok: true, n: c.n, jumlah: c.jumlah, total: c.total, penuh: c.jumlah === c.total, depan: k.depan, belakang: k.belakang });
}
function hfzBaca(kartu) {   // MURNI: kartu tersimpan -> { n, jumlah, total, penuh } bila ISINYA persis kartu surah (cocok dengan hfzTeks), selain itu null; dipakai agar Ubah membuka pilihan surah dan kartu tulisan sendiri tidak salah dikenali
  if (!kartu || typeof kartu !== 'object' || typeof kartu.depan !== 'string' || typeof kartu.belakang !== 'string') return null;
  const m = /^[^\n]+\n\n([0-9]{1,3})\. [^\n]+$/.exec(kartu.depan), b = /^([0-9]{1,4})(?: dari ([0-9]{1,4}))? ayat$/.exec(kartu.belakang); if (!m || !b) return null;
  const n = hfzNo(m[1]), i = hfzInfo(n); if (!i || String(n) !== m[1]) return null;
  const jumlah = Number(b[1]), t = hfzTeks(n, jumlah); if (!t || t.depan !== kartu.depan || t.belakang !== kartu.belakang) return null;
  return Object.freeze({ n, jumlah, total: i.total, penuh: jumlah === i.total });
}
function hfzAda(daftar) {   // MURNI: daftar kartu buatan -> Map nomor surah -> id kartu surah yang sudah ada (yang pertama menang); kartu bukan surah diabaikan
  const m = new Map(); (Array.isArray(daftar) ? daftar : []).forEach(k => { const r = hfzBaca(k); if (r && k && typeof k.id === 'string' && !m.has(r.n)) m.set(r.n, k.id); }); return m;
}
function hfzPesan(kode, total) {   // MURNI: kode galat -> kalimat untuk pemilik; kode tak dikenal = kalimat umum
  const P = { surah_kosong: 'Pilih surahnya dulu.', surah_tak_sah: 'Surah tidak dikenal, pilih dari daftar.', jumlah_kosong: 'Isi jumlah ayat yang mau dihafal.', jumlah_tak_sah: 'Jumlah ayat harus bilangan bulat 1 atau lebih.', jumlah_lebih: Number.isInteger(total) ? 'Surah ini hanya ' + total + ' ayat.' : 'Jumlah ayat melebihi isi surah.', bukan_objek: 'Pilihan surah belum lengkap.' };
  return Object.prototype.hasOwnProperty.call(P, kode) ? P[kode] : 'Kartu surah belum bisa disimpan.';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth4a: Object.freeze({ arab: HFZ_ARAB, no: hfzNo, info: hfzInfo, daftar: hfzDaftar, cek: hfzCek, teks: hfzTeks, buat: hfzBuat, baca: hfzBaca, ada: hfzAda, pesan: hfzPesan }) }));
/* ===== OTH-4a-end ===== */
/* ===== OTH-4b1-begin (22 Nov 2026): Sinaps > Hafalan, bagian 4b-1: PEMBANGUN HTML MURNI formulir kartu "Hafal surah" (pilihan jenis Tulis sendiri / Hafal surah, daftar 114 surah dengan penanda "sudah ada", isian Jumlah ayat dengan bawaan seluruh ayat, pratinjau kartu depan/belakang). Hanya membangun teks HTML dan menghitung state: TIDAK menulis, TIDAK memanggil hffSimpan/hfbTambah/hfbUbah, belum dipasang ke tab, belum ada CSS dan penangan ketuk (4b-2). Semua teks dari luar lewat esc(). Memakai OTH-4a (hfz*), HFU (3a), hfuDaftar/hfuBersih (3a), hffPesan (3c-1a). Kartu surah tetap kartu biasa { id, depan, belakang, dibuat }; format simpan TIDAK berubah. Membalik: hapus blok ini. ===== */
const HFY_KOLOM = Object.freeze(['surah', 'jumlah']);
const hfyRaw = v => (typeof v === 'string' ? v.slice(0, 40) : (typeof v === 'number' && Number.isFinite(v) ? String(v) : ''));   // MURNI: isian bukan teks = kosong; dipotong 40 huruf (cukup untuk nomor surah dan jumlah ayat)
function hfyState(mode, id, surah, jumlah, awal, sentuh, coba) { const sn = sentuh && typeof sentuh === 'object' ? sentuh : {}; return Object.freeze({ mode, id, surah, jumlah, awal, sentuh: Object.freeze({ surah: !!sn.surah, jumlah: !!sn.jumlah }), coba: !!coba }); }
function hfyBaru() { return hfyState('baru', null, '', '', Object.freeze({ surah: '', jumlah: '' }), {}, false); }   // MURNI: formulir surah kosong untuk kartu baru
function hfyDari(kartu) {   // MURNI: kartu tersimpan -> formulir surah mode ubah, atau null bila BUKAN kartu surah (kartu tulisan sendiri tetap dibuka dengan formulir lama)
  const k = hfuBersih(kartu), r = k ? hfzBaca(k) : null; if (!r) return null;
  const a = Object.freeze({ surah: String(r.n), jumlah: String(r.jumlah) }); return hfyState('ubah', k.id, a.surah, a.jumlah, a, {}, false);
}
function hfyIsi(z, kolom, nilai) {   // MURNI: -> formulir baru dengan satu kolom diisi (ditandai disentuh); ganti surah = jumlah ayat ikut seluruh ayat surah baru bila jumlah belum disentuh, kosong, tak sah, atau melebihi isi surah baru; kolom tak dikenal atau formulir tak sah = tidak berubah
  if (!z || typeof z !== 'object' || HFY_KOLOM.indexOf(kolom) < 0) return z;
  const v = hfyRaw(nilai), sn = { surah: z.sentuh.surah, jumlah: z.sentuh.jumlah }; let s = z.surah, j = z.jumlah;
  if (kolom === 'surah') {
    s = v; sn.surah = true; const i = hfzInfo(hfzNo(v.trim())), jt = typeof j === 'string' ? j.trim() : '';
    if (i && (!sn.jumlah || !/^[0-9]{1,4}$/.test(jt) || Number(jt) < 1 || Number(jt) > i.total)) j = String(i.total);
  } else { j = v; sn.jumlah = true; }
  return hfyState(z.mode, z.id, s, j, z.awal, sn, z.coba);
}
function hfySentuh(z, kolom) { if (!z || typeof z !== 'object' || HFY_KOLOM.indexOf(kolom) < 0) return z; return hfyState(z.mode, z.id, z.surah, z.jumlah, z.awal, Object.assign({}, z.sentuh, { [kolom]: true }), z.coba); }   // MURNI: kolom ditinggalkan = disentuh
function hfyCoba(z) { if (!z || typeof z !== 'object') return z; return hfyState(z.mode, z.id, z.surah, z.jumlah, z.awal, z.sentuh, true); }   // MURNI: Simpan ditekan = semua galat boleh tampil
function hfyGalat(z, daftar) {   // MURNI: -> { surah, jumlah, umum } kode galat atau null (SEMUA galat, tanpa melihat disentuh); surah: surah_kosong, surah_tak_sah, kembar (surah itu sudah punya kartu LAIN); jumlah: jumlah_kosong, jumlah_tak_sah, jumlah_lebih; umum: penuh (mode baru), tidak_ada (mode ubah, kartu hilang)
  const o = z && typeof z === 'object' ? z : {}, L = hfuDaftar(daftar).kartu, ubah = o.mode === 'ubah', sr = hfyRaw(o.surah).trim(), js = hfyRaw(o.jumlah).trim(), r = { surah: null, jumlah: null, umum: null };
  const cs = hfzCek({ surah: sr, jumlah: '1' });
  if (!cs.ok) { r.surah = cs.kode === 'surah_kosong' || cs.kode === 'surah_tak_sah' ? cs.kode : 'surah_tak_sah'; }
  else { const ada = hfzAda(L).get(cs.n); if (ada && (!ubah || ada !== o.id)) r.surah = 'kembar'; }
  if (cs.ok) { const c = hfzCek({ surah: sr, jumlah: js }); if (!c.ok) r.jumlah = c.kode; }
  else if (!js) r.jumlah = 'jumlah_kosong'; else if (!/^[0-9]{1,4}$/.test(js) || Number(js) < 1) r.jumlah = 'jumlah_tak_sah';
  if (ubah) { if (!L.some(x => x.id === o.id)) r.umum = 'tidak_ada'; } else if (L.length >= HFU.cap) r.umum = 'penuh';
  return Object.freeze(r);
}
function hfyTampil(z, daftar) {   // MURNI: galat yang BOLEH tampil sekarang (kolom disentuh atau Simpan sudah ditekan); galat umum selalu tampil
  const g = hfyGalat(z, daftar), o = z && typeof z === 'object' ? z : {}, sn = o.sentuh && typeof o.sentuh === 'object' ? o.sentuh : {}, b = k => (o.coba === true || sn[k] === true) ? g[k] : null;
  return Object.freeze({ surah: b('surah'), jumlah: b('jumlah'), umum: g.umum });
}
function hfyKotor(z) { const o = z && typeof z === 'object' ? z : {}, a = o.awal && typeof o.awal === 'object' ? o.awal : {}; return hfyRaw(o.surah).trim() !== hfyRaw(a.surah).trim() || hfyRaw(o.jumlah).trim() !== hfyRaw(a.jumlah).trim(); }   // MURNI: ada perubahan dibanding awal?
function hfyMasuk(z) { const o = z && typeof z === 'object' ? z : {}, b = hfzBuat({ surah: hfyRaw(o.surah), jumlah: hfyRaw(o.jumlah) }); return b.ok ? Object.freeze({ depan: b.depan, belakang: b.belakang }) : null; }   // MURNI: isian -> { depan, belakang } untuk jalur simpan lama (hffIsi + hffSimpan), atau null bila isian belum sah
function hfyStatus(z, daftar) {   // MURNI: -> { bisa, kotor, galat, kartu } bisa = Simpan boleh jalan (tanpa galat; mode ubah juga harus ada perubahan); kartu = { depan, belakang } atau null
  const g = hfyGalat(z, daftar), kotor = hfyKotor(z), ubah = !!z && typeof z === 'object' && z.mode === 'ubah', ada = !!(g.surah || g.jumlah || g.umum);
  return Object.freeze({ bisa: !ada && (!ubah || kotor), kotor, galat: g, kartu: hfyMasuk(z) });
}
function hfyPesan(kode, total) { return kode === 'kembar' ? 'Surah ini sudah punya kartu. Untuk mengubah jumlah ayat, ubah kartu yang sudah ada.' : (kode === 'penuh' || kode === 'tidak_ada') ? hffPesan(kode) : hfzPesan(kode, total); }   // MURNI: kode galat -> kalimat untuk pemilik
function hfyOpsi(daftar) {   // MURNI: 114 baris pilihan surah { n, latin, arti, total, arab, id } id = kartu surah yang sudah ada (atau null); dipakai daftar pilihan dan penanda "sudah ada"
  const ada = hfzAda(hfuDaftar(daftar).kartu); return Object.freeze(hfzDaftar().map(i => Object.freeze({ n: i.n, latin: i.latin, arti: i.arti, total: i.total, arab: i.arab, id: ada.has(i.n) ? ada.get(i.n) : null })));
}
function hfyJenis(jenis, sibuk) {   // MURNI: pilihan jenis kartu (hanya mode baru) -> teks HTML; jenis = 'tulis' | 'surah'; dua tombol, yang aktif aria-pressed
  const sur = jenis === 'surah', mati = sibuk === true ? ' disabled' : '', b = (j, teks, on) => '<button class="btn sm hfz-opt' + (on ? ' is-on' : '') + '" type="button" data-q="hfyJenis" data-j="' + j + '" data-fk="hfz-j-' + j + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + mati + '>' + teks + '</button>';
  return '<div class="hfz-jenis" role="group" aria-label="Jenis kartu">' + b('tulis', 'Tulis sendiri', !sur) + b('surah', 'Hafal surah', sur) + '</div>';
}
function hfyForm(z, u, daftar) {   // MURNI: formulir "Hafal surah" (mode baru atau ubah) -> teks HTML; galat per kolom hanya bila kolom disentuh atau Simpan sudah ditekan; pratinjau kartu bila isian sudah sah
  const o = z && typeof z === 'object' ? z : hfyBaru(), uu = u && typeof u === 'object' ? u : {}, T = hfyTampil(o, daftar), S = hfyStatus(o, daftar), ubah = o.mode === 'ubah', sibuk = uu.sibuk === true;
  const sr = hfyRaw(o.surah).trim(), js = hfyRaw(o.jumlah), n = hfzNo(sr), info = hfzInfo(n), opsi = hfyOpsi(daftar);
  const err = (k, id) => T[k] ? '<span class="hfk-e" id="' + id + '">' + esc(hfyPesan(T[k], info ? info.total : undefined)) + '</span>' : '';
  const opt = '<option value=""' + (n ? '' : ' selected') + ' disabled>Pilih surah</option>' + opsi.map(i => '<option value="' + i.n + '"' + (i.n === n ? ' selected' : '') + '>' + i.n + '. ' + esc(i.latin) + ' (' + i.total + ' ayat)' + (i.id && i.id !== o.id ? ' · sudah ada' : '') + '</option>').join('');
  const fS = '<div class="hfk-fld hfz-fld' + (T.surah ? ' is-err' : '') + '"><label for="hfz-surah">Surah</label><select id="hfz-surah" class="hfz-sel" data-f="surah" aria-describedby="hfz-m-surah' + (T.surah ? ' hfz-e-surah' : '') + '"' + (T.surah ? ' aria-invalid="true"' : '') + (sibuk ? ' disabled' : '') + '>' + opt + '</select><div class="hfk-meta"><span class="hfk-c" id="hfz-m-surah">' + (info ? esc(info.arti) + ' · ' + info.total + ' ayat' : '114 surah, urut seperti di Al-Qur’an') + '</span>' + err('surah', 'hfz-e-surah') + '</div></div>';
  const fJ = '<div class="hfk-fld hfz-fld' + (T.jumlah ? ' is-err' : '') + '"><label for="hfz-jumlah">Jumlah ayat yang dihafal</label><div class="hfz-jrow"><input id="hfz-jumlah" class="hfz-in" type="text" inputmode="numeric" autocomplete="off" maxlength="4" data-f="jumlah" value="' + esc(js) + '" aria-describedby="hfz-m-jumlah' + (T.jumlah ? ' hfz-e-jumlah' : '') + '"' + (T.jumlah ? ' aria-invalid="true"' : '') + (sibuk ? ' readonly' : '') + '>'
    + '<button class="btn sm ghost hfz-all" type="button" data-q="hfySemuaAyat" data-fk="hfz-semua"' + (!info || sibuk ? ' disabled' : '') + '>Seluruh ayat</button></div><div class="hfk-meta"><span class="hfk-c" id="hfz-m-jumlah">' + (info ? 'Dari 1 sampai ' + info.total + ' ayat' : 'Pilih surah dulu, jumlah ayat terisi otomatis') + '</span>' + err('jumlah', 'hfz-e-jumlah') + '</div></div>';
  const k = S.kartu, pv = k ? '<div class="hfz-pv" aria-live="polite"><span class="hfz-pvl">Tampilan kartu</span><p class="hfz-arab" lang="ar" dir="rtl">' + esc(info.arab) + '</p><p class="hfz-lat">' + esc(info.n + '. ' + info.latin) + '</p><p class="hfz-jml">' + esc(k.belakang) + '</p></div>' : '';
  return '<div class="hfk-form hfz-form" role="group" aria-label="' + (ubah ? 'Ubah kartu surah' : 'Kartu baru: hafal surah') + '"><h4 class="hfk-ft">' + (ubah ? 'Ubah kartu surah' : 'Kartu baru') + '</h4>'
    + (ubah ? '' : hfyJenis('surah', sibuk)) + fS + fJ + pv
    + (T.umum ? '<p class="nw-p hfk-err" role="alert">' + esc(hfyPesan(T.umum)) + '</p>' : '')
    + '<div class="hfk-act"><button class="btn sm primary hfk-save" type="button" data-q="hfySimpan" data-fk="hfk-simpan"' + (sibuk || (ubah && !S.kotor) ? ' disabled' : '') + '>' + (sibuk ? 'Menyimpan…' : ubah ? 'Simpan perubahan' : 'Simpan kartu surah') + '</button><button class="btn sm ghost hfk-cancel" type="button" data-q="hfkTutup" data-fk="hfk-tutup"' + (sibuk ? ' disabled' : '') + '>Batal</button></div></div>';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth4b1: Object.freeze({ baru: hfyBaru, dari: hfyDari, isi: hfyIsi, sentuh: hfySentuh, coba: hfyCoba, galat: hfyGalat, tampil: hfyTampil, kotor: hfyKotor, masuk: hfyMasuk, status: hfyStatus, pesan: hfyPesan, opsi: hfyOpsi, jenis: hfyJenis, form: hfyForm }) }));
/* ===== OTH-4b1-end ===== */
/* ===== OTH-4b2-begin (22 Nov 2026): Sinaps > Hafalan, bagian 4b-2: PEMASANGAN formulir "Hafal surah" ke kartu "Kartu buatan sendiri": pilihan jenis (Tulis sendiri / Hafal surah) di formulir "Kartu baru", penangan ganti surah / ketik jumlah / Seluruh ayat / Simpan, dan tombol Ubah pada kartu surah membuka formulir surah. TIDAK mengubah satu pun baris lama: hfkHtml, QACT.hfkTutup, QACT.hfkUbah dan nwRender DIBUNGKUS (pola yang sama dengan 3c-2b-1); simpan = hfyMasuk -> hffIsi -> hffSimpan yang sudah teruji (format simpan, jadwal, cadangan TIDAK berubah). State tambahan di HFKU: z (formulir surah atau null), keep (formulir tulis yang ditinggal saat pindah jenis), zKeep (formulir surah yang ditinggal). Saat z terpasang, HFKU.form tetap berisi tiruan hff (baru = kosong; ubah = hffDari(kartu)) supaya baris daftar bertanda "Sedang diubah" dan pagar lama tetap jalan. Membalik: hapus blok ini dan CSS OTH-4b2. ===== */
HFKU.z = null; HFKU.keep = null; HFKU.zKeep = null;
function hfyFokus(id) {   // fokus ke kolom surah / jumlah; yang tidak ada atau mati = fokus ke kartu
  const root = $('#nwSinapsBody'); if (!root) return;
  if (id !== 'hfz-surah' && id !== 'hfz-jumlah') { hfkFokusKe(id); return; }   // tombol (data-fk) dan kartu: jalur lama
  const el = root.querySelector('#hfkBody #' + id); if (el && !el.disabled) { try { el.focus(); } catch (e) { /* abaikan */ } } else hfkFokusKe('#hfkBody');
}
{ const baseHfk = hfkHtml; hfkHtml = function (ui, st, daftar, jadwal) {   // bungkus pembangun kartu: formulir surah menggantikan blok formulir lama; formulir tulis mendapat pilihan jenis
  const h = baseHfk.apply(this, arguments);
  try {
    if (!st || typeof st !== 'object' || !st.ready || st.blocked === true) return h;
    const u = ui && typeof ui === 'object' ? ui : {}, f = u.form && typeof u.form === 'object' ? u.form : null; if (!f) return h;
    const a = h.indexOf('<div class="hfk-form"'), tail = '>Batal</button></div></div>'; if (a < 0) return h;
    const b = h.indexOf(tail, a); if (b < 0) return h;
    const z = HFKU.z && typeof HFKU.z === 'object' ? HFKU.z : null;
    if (z) { const ip = 'Tulis pertanyaan di bagian depan dan jawabannya di bagian belakang. Kartu baru langsung masuk jadwal hafalan.'; return h.slice(0, a).replace(ip, 'Pilih surah dan jumlah ayat yang mau dihafal. Kartu baru langsung masuk jadwal hafalan.') + hfyForm(z, u, daftar) + h.slice(b + tail.length); }
    if (f.mode === 'baru') { const hd = '<h4 class="hfk-ft">Kartu baru</h4>', i = h.indexOf(hd, a); if (i >= 0 && i < b) return h.slice(0, i + hd.length) + hfyJenis('tulis', u.sibuk === true) + h.slice(i + hd.length); }
    return h;
  } catch (e) { return h; }
}; }
function hfyPatch() {   // sesudah ketikan / ganti surah: perbarui meta, galat, pratinjau, nilai isian, dan tombol TANPA mengganti kolom yang sedang difokus; false = perlu gambar ulang penuh
  try {
    const root = $('#hfkBody'); if (!root || !HFKU.z) return false;
    const tmp = document.createElement('div'); tmp.innerHTML = hfkHtml(hfkUi(), hfbState(), HFB.data.kartu, hfkJadwalData());
    const nb = tmp.querySelector('#hfkBody'), fa = root.querySelector('.hfz-form'), fb = nb && nb.querySelector('.hfz-form'); if (!fa || !fb) return false;
    const A = [...fa.querySelectorAll('.hfk-fld')], B = [...fb.querySelectorAll('.hfk-fld')]; if (A.length !== 2 || B.length !== 2) return false;
    for (let i = 0; i < 2; i++) {
      const a = A[i], b = B[i], ca = a.querySelector('select,input'), cb = b.querySelector('select,input'), ma = a.querySelector('.hfk-meta'), mb = b.querySelector('.hfk-meta'); if (!ca || !cb || !ma || !mb) return false;
      ma.replaceWith(mb); a.className = b.className;
      ['aria-invalid', 'aria-describedby'].forEach(n => { if (cb.hasAttribute(n)) ca.setAttribute(n, cb.getAttribute(n)); else ca.removeAttribute(n); });
      if (ca !== document.activeElement && ca.value !== cb.value) ca.value = cb.value;
    }
    const ba = fa.querySelector('.hfz-all'), bb = fb.querySelector('.hfz-all'); if (ba && bb) ba.disabled = bb.disabled;
    const pa = fa.querySelector('.hfz-pv'), pb = fb.querySelector('.hfz-pv');
    if (pa && pb) pa.replaceWith(pb); else if (pa) pa.remove(); else if (pb) (fa.querySelector('.hfk-err') || fa.querySelector('.hfk-act')).before(pb);
    const ua = fa.querySelector('.hfk-err'), ub = fb.querySelector('.hfk-err'); if (!!ua !== !!ub || (ua && ua.textContent !== ub.textContent)) return false;
    const sa = fa.querySelector('[data-q="hfySimpan"]'), sb = fb.querySelector('[data-q="hfySimpan"]'); if (!sa || !sb) return false;
    sa.disabled = sb.disabled; sa.textContent = sb.textContent;
    return true;
  } catch (e) { return false; }
}
QACT.hfyJenis = el => {   // pindah jenis kartu (hanya formulir kartu BARU); isian jenis yang ditinggal disimpan sementara, Batal membuangnya
  if (!hfvOn() || HFKU.sibuk || !HFKU.form || HFKU.form.mode !== 'baru') return;
  const j = el && el.dataset && el.dataset.j; if (j !== 'tulis' && j !== 'surah') return;
  if ((j === 'surah') === !!HFKU.z) { hfyFokus('hfz-surah'); return; }
  if (j === 'surah') { HFKU.keep = HFKU.form; HFKU.z = HFKU.zKeep || hfyBaru(); HFKU.zKeep = null; HFKU.form = hffBaru(); }
  else { HFKU.zKeep = HFKU.z; HFKU.z = null; HFKU.form = HFKU.keep || hffBaru(); HFKU.keep = null; }
  HFKU.pesan = null; hfkDraw(); hfkFokusKe('hfz-j-' + j);
};
{ const baseTutup = QACT.hfkTutup; QACT.hfkTutup = () => { if (!hfvOn() || HFKU.sibuk) return; HFKU.z = null; HFKU.keep = null; HFKU.zKeep = null; baseTutup(); }; }
{ const baseUbah = QACT.hfkUbah; QACT.hfkUbah = el => {   // kartu surah membuka formulir surah; kartu tulisan sendiri tetap formulir lama
  if (!hfkSiap()) { baseUbah(el); return; }
  const id = el && el.dataset && typeof el.dataset.id === 'string' ? el.dataset.id : '', k = HFB.data.kartu.find(x => x && x.id === id), z = k ? hfyDari(k) : null;
  const kotor = HFKU.form && (HFKU.z ? hfyKotor(HFKU.z) : hffKotor(HFKU.form));
  if (!z) {
    if (HFKU.z && !kotor) { HFKU.z = null; HFKU.keep = null; HFKU.zKeep = null; HFKU.form = null; }
    else if (HFKU.z) { HFKU.pesan = { ok: false, teks: 'Formulir yang terbuka belum disimpan. Simpan atau batalkan dulu.' }; hfkDraw(); hfyFokus('hfz-surah'); return; }
    baseUbah(el); return;
  }
  if (kotor) { HFKU.pesan = { ok: false, teks: 'Formulir yang terbuka belum disimpan. Simpan atau batalkan dulu.' }; hfkDraw(); if (HFKU.z) hfyFokus('hfz-surah'); else hfkFokusKe('hfk-depan'); return; }
  HFKU.form = hffDari(k); HFKU.z = z; HFKU.keep = null; HFKU.zKeep = null; HFKU.pesan = null; hfkDraw(); hfyFokus('hfz-surah');
}; }
QACT.hfySemuaAyat = () => {
  if (!hfvOn() || HFKU.sibuk || !HFKU.z) return;
  const i = hfzInfo(hfzNo(hfyRaw(HFKU.z.surah).trim())); if (!i) return;
  HFKU.z = hfyIsi(HFKU.z, 'jumlah', String(i.total)); if (!hfyPatch()) hfkDraw();
};
function hfySelesai(r, z0) {   // hasil hffSimpan -> state tampilan, gambar ulang, fokus
  HFKU.sibuk = false;
  const on = hfvOn(), ok = !!r && typeof r === 'object' && r.ok === true, kode = r && typeof r.kode === 'string' ? r.kode : 'galat';
  if (ok) { if (z0.mode === 'ubah') { HFKU.z = null; HFKU.form = null; } else { HFKU.z = hfyBaru(); HFKU.form = hffBaru(); } } else HFKU.z = hfyCoba(z0);
  const g = HFKU.z ? hfyTampil(HFKU.z, HFB.data.kartu) : { surah: null, jumlah: null }, dikolom = !ok && !!(g.surah || g.jumlah);
  const teks = ok || kode !== 'kembar' ? (r && typeof r.pesan === 'string' && r.pesan ? r.pesan : hffPesanAksi('galat')) : hfyPesan('kembar');
  HFKU.pesan = on && !dikolom ? { ok, teks } : null;
  if (!on) return;
  hfkDraw();
  if (ok) hfyFokus(z0.mode === 'ubah' ? 'hfk-ubah-' + z0.id : 'hfz-surah');
  else { const bad = $('#hfkBody [aria-invalid="true"]'); hfyFokus(bad && bad.id ? bad.id : 'hfk-simpan'); }
}
QACT.hfySimpan = () => {
  if (!hfvOn() || HFKU.sibuk || HFFA.busy || !HFKU.z) return;
  const z = HFKU.z, st = hfbState(); if (!st.ready || st.blocked) { hfkDraw(); return; }
  const S = hfyStatus(z, HFB.data.kartu);
  if (!S.bisa) { if (S.galat.surah || S.galat.jumlah || S.galat.umum) { HFKU.z = hfyCoba(z); hfkDraw(); const bad = $('#hfkBody [aria-invalid="true"]'); hfyFokus(bad && bad.id ? bad.id : 'hfk-simpan'); } return; }
  const m = S.kartu, asal = z.mode === 'ubah' ? hffDari(HFB.data.kartu.find(x => x && x.id === z.id)) : hffBaru();
  if (!m || !asal) { HFKU.z = hfyCoba(z); hfkDraw(); return; }
  const s = hffIsi(hffIsi(asal, 'depan', m.depan), 'belakang', m.belakang);
  HFKU.sibuk = true; HFKU.pesan = null; hfkDraw(); hfkFokusKe('#hfkBody');   // menyimpan = kolom dan tombol mati; fokus ke kartu supaya tidak hilang
  let p; try { p = hffSimpan(s); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(x => x, () => null).then(r => hfySelesai(r, z));
};
document.addEventListener('input', ev => {   // ketikan di kolom jumlah ayat
  const el = ev.target; if (!el || !el.classList || !el.classList.contains('hfz-in') || !HFKU.z || HFKU.sibuk) return;
  HFKU.z = hfyIsi(HFKU.z, 'jumlah', el.value); if (!hfyPatch()) hfkDraw();
});
document.addEventListener('change', ev => {   // pilihan surah
  const el = ev.target; if (!el || !el.classList || !el.classList.contains('hfz-sel') || !HFKU.z || HFKU.sibuk) return;
  HFKU.z = hfyIsi(HFKU.z, 'surah', el.value); if (!hfyPatch()) hfkDraw();
});
document.addEventListener('focusout', ev => {   // kolom ditinggalkan = disentuh
  const el = ev.target; if (!el || !el.classList || !(el.classList.contains('hfz-in') || el.classList.contains('hfz-sel')) || !HFKU.z || HFKU.sibuk) return;
  const k = el.dataset.f; if (HFY_KOLOM.indexOf(k) < 0) return;
  HFKU.z = hfySentuh(HFKU.z, k); hfyPatch();
});
{ const baseNwOth4b = nwRender; nwRender = function (key) {   // fokus dan kursor di kolom surah / jumlah dipulihkan sesudah kartu diganti
  const root = key === 'sinaps' ? $('#nwSinapsBody') : null, ae = document.activeElement;
  const sel = root && ae && root.contains(ae) && ae.closest && ae.closest('#hfkBody') && (ae.id === 'hfz-surah' || ae.id === 'hfz-jumlah') ? { id: ae.id, a: ae.selectionStart, b: ae.selectionEnd } : null;
  baseNwOth4b.apply(this, arguments);
  if (sel && key === 'sinaps' && nwTab.sinaps === 'hafalan' && HFKU.z) { hfyFokus(sel.id); const t = $('#' + sel.id); try { if (t && sel.a !== null && sel.a !== undefined && t.tagName === 'INPUT') t.setSelectionRange(sel.a, sel.b); } catch (e) { /* abaikan */ } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth4b2: Object.freeze({ jenis: QACT.hfyJenis, simpan: QACT.hfySimpan, semuaAyat: QACT.hfySemuaAyat, patch: hfyPatch, z: () => HFKU.z }) }));
/* ===== OTH-4b2-end ===== */
/* ===== OTH-5a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5a: kartu "Ruang hafal" di ATAS tab Hafalan: daftar surah (Al-Fatihah + Juz 30, cari nama atau nomor, tombol semua 114) lalu ruang baca per ayat (Arab, Latin, arti) dari sumber yang sama dengan pembaca Ibadah (qrGet; surah yang sudah dibuka sekali tersimpan dan bisa dibaca tanpa internet). Hanya baca: TIDAK menulis ke penyimpanan apa pun. Belum ada audio (5b), mode tutup dan penanda hafal (5c). Membalik: hapus blok ini dan CSS OTH-5a. ===== */
const HFR = { n: 0, cari: '', semua: false, st: 'idle', s: null };   // n = surah yang dibuka (0 = daftar); st = idle | muat | ok | gagal; s = data surah
const HFR_NORM = t => String(t == null ? '' : t).toLowerCase().replace(/[^a-z0-9]/g, '');
function hfrDaftar(cari, semua) {   // MURNI: pencarian + pilihan -> daftar nomor surah (urut tampil)
  const q = HFR_NORM(cari), out = [];
  if (q) { for (let n = 1; n <= 114; n++) { const r = QR_SURAH[n - 1]; if (String(n) === q || HFR_NORM(r[0]).indexOf(q) >= 0 || HFR_NORM(r[1]).indexOf(q) >= 0) out.push(n); } return out; }
  if (semua) { for (let n = 1; n <= 114; n++) out.push(n); return out; }
  out.push(1); for (let n = 114; n >= 78; n--) out.push(n); return out;   // Al-Fatihah, lalu Juz 30 dari An-Nas mundur
}
function hfrItems(cari, semua) {   // MURNI: teks <li> daftar; semua teks dari luar lewat esc()
  const ls = hfrDaftar(cari, semua);
  if (!ls.length) return '<li class="hfr-none">Tidak ada surah yang cocok.</li>';
  return ls.map(n => { const i = hfzInfo(n); return '<li><button class="hfr-row" type="button" data-q="hfrBuka" data-n="' + n + '" data-fk="hfr-n-' + n + '"><span class="hfr-no">' + n + '</span><span class="hfr-nm"><b>' + esc(i.latin) + '</b><i>' + esc(i.arti) + ' · ' + i.total + ' ayat</i></span><span class="hfr-ar" lang="ar" dir="rtl">' + esc(i.arab) + '</span></button></li>'; }).join('');
}
function hfrAyat(s) {   // MURNI: data surah -> daftar ayat (Arab kanan-ke-kiri, Latin, arti)
  return '<ol class="hfr-ay">' + s.ay.map(a => '<li class="hfr-a" id="hfr-a-' + esc(a.a) + '"><span class="hfr-nn" aria-label="Ayat ' + esc(a.a) + '">' + esc(a.a) + '</span><p class="hfr-arab" lang="ar" dir="rtl">' + esc(a.ar) + '</p>' + (a.lat ? '<p class="hfr-lat">' + esc(a.lat) + '</p>' : '') + (a.id ? '<p class="hfr-id">' + esc(a.id) + '</p>' : '') + '</li>').join('') + '</ol>';
}
function hfrHtml() {
  const head = '<section class="nw-card hfv-card hfr-card" id="hfrBody" aria-label="Ruang hafal surah">';
  if (!HFR.n) {
    return head + '<div class="nw-hd"><h3>Ruang hafal</h3></div><p class="nw-p">Pilih surah untuk melihat semua ayatnya: Arab, Latin, dan arti.</p>' +
      '<label class="hfr-sr" for="hfrCari">Cari surah</label><input id="hfrCari" class="hfr-cari" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="Cari nama atau nomor surah" value="' + esc(HFR.cari) + '">' +
      '<ul class="hfr-list" id="hfrList">' + hfrItems(HFR.cari, HFR.semua) + '</ul>' +
      '<div class="snh-act"' + (HFR.cari ? ' hidden' : '') + '><button class="btn sm" type="button" data-q="hfrSemua" data-fk="hfr-semua" aria-pressed="' + (HFR.semua ? 'true' : 'false') + '">' + (HFR.semua ? 'Hanya Al-Fatihah dan Juz 30' : 'Tampilkan semua 114 surah') + '</button></div>' +
      '<p class="nw-fine">Teks dan arti sama dengan pembaca di Ibadah (terjemahan Kemenag). Surah yang sudah dibuka sekali bisa dibaca tanpa internet.</p></section>';
  }
  const i = hfzInfo(HFR.n);
  let x = head + '<div class="hfr-top"><button class="btn sm" type="button" data-q="hfrTutup" data-fk="hfr-back">\u2190 Semua surah</button></div>' +
    '<div class="hfr-jd"><span class="hfr-arab hfr-nama" lang="ar" dir="rtl">' + esc(i.arab) + '</span><h3>' + i.n + '. ' + esc(i.latin) + '</h3><p class="hfr-meta">' + esc(i.arti) + ' · ' + i.total + ' ayat</p></div>';
  if (HFR.st === 'muat') x += '<p class="nw-p" role="status">Memuat ayat…</p>';
  else if (HFR.st === 'gagal') x += '<p class="nw-p hfr-gagal" role="alert">Teks surah ini belum bisa diambil. Surah perlu dibuka sekali dengan internet; sesudah itu tersimpan di perangkat.</p><div class="snh-act"><button class="btn sm" type="button" data-q="hfrCoba" data-fk="hfr-coba">Coba lagi</button></div>';
  else if (HFR.st === 'ok' && HFR.s) x += hfrAyat(HFR.s);
  return x + '</section>';
}
function hfrFokus(fk) {   // fk = nilai data-fk, atau '#hfrBody'; tombol yang sudah tidak ada = fokus ke kartu
  const root = $('#hfrBody'); if (!root) return;
  const el = fk === '#hfrBody' ? root : [...root.querySelectorAll('[data-fk]')].find(x => x.dataset.fk === fk), t = el || root;
  if (t === root) root.setAttribute('tabindex', '-1');
  try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
}
function hfrDraw(fk) {   // fk undefined = pertahankan fokus tombol yang ada; null = tanpa fokus; teks = pindah fokus ke sana
  if (!hfvOn()) return;
  const old = $('#hfrBody'); if (!old) { nwRender('sinaps'); return; }
  const ae = document.activeElement, keep = fk === undefined ? (ae === old ? '#hfrBody' : (old.contains(ae) && ae.dataset && ae.dataset.fk ? ae.dataset.fk : null)) : fk;
  old.outerHTML = hfrHtml();
  if (keep) hfrFokus(keep);
}
function hfrMuat(n) {   // memuat surah lewat pembaca Ibadah; galat = keadaan gagal, bukan layar rusak; hasil basi (surah sudah ditutup atau diganti) dibuang
  HFR.st = 'muat'; HFR.s = null;
  let p; try { p = typeof qrGet === 'function' ? qrGet(n) : Promise.reject(new Error('pembaca tidak ada')); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(s => { if (HFR.n !== n) return; if (s && Array.isArray(s.ay) && s.ay.length) { HFR.s = s; HFR.st = 'ok'; } else HFR.st = 'gagal'; }, () => { if (HFR.n === n) HFR.st = 'gagal'; }).then(() => { if (HFR.n === n) hfrDraw(); });
}
function hfrMount() {   // pasang kartu tepat DI ATAS kartu ulasan; tidak pernah menggandakan, tidak melempar
  try {
    const root = $('#nwSinapsBody'), w = root && (root.querySelector('#hfvWrap') || root.querySelector('.nw-card')); if (!w) return null;
    root.querySelectorAll('#hfrBody').forEach(x => x.remove());
    w.insertAdjacentHTML('beforebegin', hfrHtml());
    return root.querySelector('#hfrBody');
  } catch (e) { return null; }
}
function hfrGulir() { const r = $('#hfrBody'); try { if (r && r.scrollIntoView) r.scrollIntoView({ block: 'start' }); } catch (e) { /* abaikan */ } }
QACT.hfrBuka = el => {
  if (!hfvOn()) return;
  const n = Number(el && el.dataset ? el.dataset.n : 0);
  if (!(n >= 1 && n <= 114) || n !== Math.floor(n)) { hfrDraw(null); return; }   // tombol basi: gambar ulang yang benar, diam
  HFR.n = n; hfrMuat(n); hfrDraw('#hfrBody'); hfrGulir();
};
QACT.hfrTutup = () => { if (!hfvOn()) return; const n = HFR.n; HFR.n = 0; HFR.st = 'idle'; HFR.s = null; hfrDraw('hfr-n-' + n); hfrGulir(); };
QACT.hfrCoba = () => { if (!hfvOn() || !HFR.n || HFR.st === 'muat') return; hfrMuat(HFR.n); hfrDraw('#hfrBody'); };
QACT.hfrSemua = () => { if (!hfvOn() || HFR.n) return; HFR.semua = !HFR.semua; hfrDraw('hfr-semua'); };
document.addEventListener('input', ev => {   // ketikan di kolom cari: hanya daftar yang diganti, kolom tidak (fokus dan papan ketik tetap)
  const el = ev.target; if (!el || el.id !== 'hfrCari' || HFR.n) return;
  HFR.cari = String(el.value).slice(0, 40);
  const ul = $('#hfrList'); if (ul) ul.innerHTML = hfrItems(HFR.cari, HFR.semua);
  const ac = $('#hfrBody .snh-act'); if (ac) ac.hidden = !!HFR.cari;
});
{ const baseNwOth5a = nwRender; nwRender = function (key) {
  const root = key === 'sinaps' ? $('#nwSinapsBody') : null, ae = document.activeElement, inR = !!(root && ae && root.contains(ae) && ae.closest && ae.closest('#hfrBody'));
  const cs = inR && ae.id === 'hfrCari' ? { a: ae.selectionStart, b: ae.selectionEnd } : null, fk = inR && !cs ? (ae.id === 'hfrBody' ? '#hfrBody' : (ae.dataset && typeof ae.dataset.fk === 'string' ? ae.dataset.fk : null)) : null;   // fokus dipulihkan sesudah kartu diganti
  baseNwOth5a.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps === 'hafalan') {
    hfrMount();
    if (cs) { const t = $('#hfrCari'); if (t) { try { t.focus({ preventScroll: true }); t.setSelectionRange(cs.a, cs.b); } catch (e) { /* abaikan */ } } } else if (fk) hfrFokus(fk);
  }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5a: Object.freeze({ daftar: hfrDaftar, items: hfrItems, html: hfrHtml, mount: hfrMount, buka: QACT.hfrBuka, tutup: QACT.hfrTutup, st: () => HFR.st, n: () => HFR.n }) }));
/* ===== OTH-5a-end ===== */
/* ===== OTH-5b1-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5b-1: tombol putar/jeda per ayat di kartu "Ruang hafal". Pemutar SENDIRI (HFA), terpisah dari pemutar Ibadah (QA): tidak menyentuh keadaan Ibadah dan TIDAK menulis ke penyimpanan apa pun. Qari = pilihan di Ibadah (hanya dibaca), cadangan 05, lalu yang ada; kecepatan = pilihan Ibadah (hanya dibaca). Ayat tanpa audio tidak diberi tombol. Hanya satu suara sekaligus (QA berbunyi = HFA berhenti). Belum ada ulang N kali, putar berurutan, atau sorotan gulir (5b-2, 5b-3). Membalik: hapus blok ini dan CSS OTH-5b1. ===== */
const HFA = new Audio(); HFA.preload = 'none'; try { HFA.setAttribute('playsinline', ''); } catch (e) { /* abaikan */ }
const HFP = { a: 0, on: false };   // a = ayat yang sedang dipilih untuk diputar (0 = tidak ada); on = sedang berbunyi
const HFA_IC = { play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>', pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13M16 5.5v13"/></svg>' };
function hfaUrl(s, a) {   // MURNI: [idQari, alamat] untuk ayat a, atau null; hanya http(s)
  const o = s && Array.isArray(s.ay) && s.ay[a - 1] && s.ay[a - 1].au; if (!o || typeof o !== 'object') return null;
  let q = '05'; try { q = qrP().q || '05'; } catch (e) { /* pakai 05 */ }
  const k = typeof o[q] === 'string' ? q : (typeof o['05'] === 'string' ? '05' : Object.keys(o)[0]);
  return k && typeof o[k] === 'string' && /^https?:\/\//.test(o[k]) ? [k, o[k]] : null;
}
{ const baseAyat = hfrAyat; hfrAyat = function (s) {   // sisipkan tombol putar di samping nomor ayat (hanya bila ayat punya audio)
  return baseAyat(s).replace(/(<span class="hfr-nn" aria-label="Ayat (\d+)">\d+<\/span>)/g, (m, x, n) => '<div class="hfr-hd">' + x + (hfaUrl(s, Number(n)) ? '<button class="hfr-pl" type="button" data-q="hfrPutar" data-a="' + n + '" data-fk="hfr-pl-' + n + '" aria-pressed="false" aria-label="Putar ayat ' + n + '">' + HFA_IC.play + '</button>' : '') + '</div>');
}; }
function hfaMark() {   // sorot ayat yang dipilih tanpa menggambar ulang kartu
  const r = $('#hfrBody'); if (!r) return;
  r.querySelectorAll('.hfr-a').forEach(li => {
    const a = Number(li.id.slice(6)), pilih = HFP.a === a, main = pilih && HFP.on; li.classList.toggle('now', pilih);
    const b = li.querySelector('.hfr-pl'); if (!b) return;
    b.setAttribute('aria-pressed', main ? 'true' : 'false'); b.setAttribute('aria-label', (main ? 'Jeda ayat ' : 'Putar ayat ') + a); b.innerHTML = main ? HFA_IC.pause : HFA_IC.play;
  });
}
function hfaStop() { try { HFA.pause(); } catch (e) { /* abaikan */ } HFA.removeAttribute('src'); HFP.a = 0; HFP.on = false; hfaMark(); }
{ const baseDraw = hfrDraw; hfrDraw = function () { baseDraw.apply(this, arguments); hfaMark(); }; }
QACT.hfrPutar = el => {
  if (!hfvOn() || HFR.st !== 'ok' || !HFR.s) return;
  const a = Number(el && el.dataset ? el.dataset.a : 0); if (!(a >= 1) || a !== Math.floor(a)) return;
  if (HFP.a === a && HFP.on) { HFA.pause(); return; }
  if (HFP.a === a && HFA.getAttribute('src')) { if (HFA.ended) HFA.currentTime = 0; try { const pr = HFA.play(); if (pr && pr.catch) pr.catch(() => { HFP.on = false; hfaMark(); }); } catch (e) { /* abaikan */ } return; }
  const u = hfaUrl(HFR.s, a); if (!u) { toast('Audio ayat ini tidak tersedia di sumber data.'); return; }
  try { if (typeof qa !== 'undefined' && qa.on) QA.pause(); } catch (e) { /* abaikan */ }
  HFA.src = u[1]; let v = 1; try { v = qrP().spd || 1; } catch (e) { /* 1 */ } HFA.playbackRate = v; HFP.a = a; HFP.on = false; hfaMark();
  try { const pr = HFA.play(); if (pr && pr.catch) pr.catch(() => { HFP.on = false; hfaMark(); toast('Tidak bisa memutar audio (periksa internet).'); }); } catch (e) { HFP.on = false; hfaMark(); }
};
HFA.addEventListener('play', () => { HFP.on = true; hfaMark(); });
HFA.addEventListener('pause', () => { if (!HFA.ended) { HFP.on = false; hfaMark(); } });
HFA.addEventListener('ended', () => { hfaSelesai(); });
HFA.addEventListener('error', () => { if (HFP.a) { hfaStop(); toast('Audio gagal dimuat (periksa internet).'); } });
try { QA.addEventListener('play', () => { if (HFP.a) hfaStop(); }); } catch (e) { /* pemutar Ibadah tidak ada */ }
{ const b1 = QACT.hfrBuka, b2 = QACT.hfrTutup; QACT.hfrBuka = el => { hfaStop(); b1(el); }; QACT.hfrTutup = () => { hfaStop(); b2(); }; }
{ const baseNw = nwRender; nwRender = function (key) { baseNw.apply(this, arguments); if (key === 'sinaps' && nwTab.sinaps !== 'hafalan') hfaStop(); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b1: Object.freeze({ url: hfaUrl, putar: QACT.hfrPutar, stop: hfaStop, st: () => ({ a: HFP.a, on: HFP.on }), audio: HFA }) }));
/* ===== OTH-5b1-end ===== */
/* ===== OTH-5b2-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5b-2: pilihan ULANG (1, 3, 5, 10 kali per ayat) dan KECEPATAN (ikut Ibadah, 0,75 / 1 / 1,25 / 1,5) di kartu "Ruang hafal". Pilihan hanya hidup selama halaman terbuka: TIDAK menulis ke penyimpanan apa pun dan TIDAK mengubah pengaturan Ibadah. Satu baris lama diubah di blok OTH-5b1 (pendengar "ended" memanggil hfaSelesai). Belum ada putar berurutan antar-ayat (5b-3). Membalik: hapus blok ini dan CSS OTH-5b2, kembalikan pendengar ended ke hfaStop(). ===== */
const HFA_REP = [1, 3, 5, 10], HFA_SPD = [0.75, 1, 1.25, 1.5];
HFP.rep = 1; HFP.spd = 0; HFP.cnt = 0;   // rep = jumlah putar per ayat; spd = 0 ikut Ibadah; cnt = putaran ke berapa (0 = diam)
function hfaSpd() { let v = 1; try { v = qrP().spd || 1; } catch (e) { /* 1 */ } return HFP.spd || v; }
function hfaApplySpd() { const v = hfaSpd(); try { HFA.defaultPlaybackRate = v; HFA.playbackRate = v; } catch (e) { /* abaikan */ } }
function hfaCtl(s) {   // MURNI: baris pilihan; kosong bila tidak ada satu ayat pun yang punya audio
  if (!s || !Array.isArray(s.ay) || !s.ay.some((x, i) => hfaUrl(s, i + 1))) return '';
  const chip = (q, v, t, on) => '<button class="hfr-chip" type="button" data-q="' + q + '" data-v="' + v + '" data-fk="' + q + '-' + v + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + t + '</button>';
  return '<div class="hfr-ctl"><div class="hfr-grp"><span class="hfr-lb" id="hfrLbU">Ulang tiap ayat</span><div class="hfr-chips" role="group" aria-labelledby="hfrLbU">' + HFA_REP.map(v => chip('hfrUlang', v, v + '\u00d7', v === HFP.rep)).join('') + '</div></div>' +
    '<div class="hfr-grp"><span class="hfr-lb" id="hfrLbK">Kecepatan</span><div class="hfr-chips" role="group" aria-labelledby="hfrLbK">' + chip('hfrKec', 0, 'Ibadah', HFP.spd === 0) + HFA_SPD.map(v => chip('hfrKec', v, String(v).replace('.', ',') + '\u00d7', v === HFP.spd)).join('') + '</div></div></div>';
}
{ const b = hfrHtml; hfrHtml = function () { const x = b.apply(this, arguments); return HFR.n && HFR.st === 'ok' && HFR.s ? x.replace('<ol class="hfr-ay">', hfaCtl(HFR.s) + '<ol class="hfr-ay">') : x; }; }
{ const b = hfrAyat; hfrAyat = function (s) { return b(s).replace(/<button class="hfr-pl"/g, '<span class="hfr-ct" aria-hidden="true"></span><button class="hfr-pl"'); }; }
function hfaChips() {   // pilihan + penghitung "2/3" di ayat yang diputar, tanpa gambar ulang
  const r = $('#hfrBody'); if (!r) return;
  r.querySelectorAll('[data-q=hfrUlang]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === HFP.rep)));
  r.querySelectorAll('[data-q=hfrKec]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === HFP.spd)));
  r.querySelectorAll('.hfr-a').forEach(li => {
    const ct = li.querySelector('.hfr-ct'); if (!ct) return;
    const a = Number(li.id.slice(6)), on = HFP.a === a && HFP.rep > 1 && HFP.cnt > 0; ct.textContent = on ? HFP.cnt + '/' + HFP.rep : '';
    const b = li.querySelector('.hfr-pl'); if (b && on && HFP.on) b.setAttribute('aria-label', 'Jeda ayat ' + a + ', ulangan ' + HFP.cnt + ' dari ' + HFP.rep);
  });
}
{ const m = hfaMark; hfaMark = function () { m.apply(this, arguments); hfaChips(); }; }
{ const s = hfaStop; hfaStop = function () { HFP.cnt = 0; s.apply(this, arguments); }; }
function hfaSelesai() {   // audio selesai: ulang sampai jumlah putar tercapai, lalu berhenti
  if (HFP.a && HFP.cnt < HFP.rep) {
    HFP.cnt++; hfaApplySpd();
    try { HFA.currentTime = 0; const pr = HFA.play(); if (pr && pr.catch) pr.catch(() => { hfaStop(); }); } catch (e) { hfaStop(); return; }
    hfaMark(); return;
  }
  hfaStop();   // jumlah putar tercapai
}
{ const p = QACT.hfrPutar; QACT.hfrPutar = el => { const prev = HFP.a, a = Number(el && el.dataset ? el.dataset.a : 0); p(el); if (HFP.a === a && prev !== a) HFP.cnt = 1; hfaApplySpd(); hfaMark(); }; }
QACT.hfrUlang = el => { if (!hfvOn()) return; const v = Number(el && el.dataset ? el.dataset.v : 0); if (!HFA_REP.includes(v)) return; HFP.rep = v; hfaMark(); };
QACT.hfrKec = el => { if (!hfvOn()) return; const v = Number(el && el.dataset ? el.dataset.v : -1); if (v !== 0 && !HFA_SPD.includes(v)) return; HFP.spd = v; hfaApplySpd(); hfaMark(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b2: Object.freeze({ ctl: hfaCtl, spd: hfaSpd, selesai: hfaSelesai, putar: QACT.hfrPutar, ulang: QACT.hfrUlang, kec: QACT.hfrKec, st: () => ({ a: HFP.a, on: HFP.on, cnt: HFP.cnt, rep: HFP.rep, spd: HFP.spd }) }) }));
/* ===== OTH-5b2-end ===== */
/* ===== OTH-5b3-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5b-3: pilihan "Lanjut" (Satu ayat | Berurutan) di kartu "Ruang hafal". Berurutan: sesudah jumlah ulang sebuah ayat tercapai, ayat berikutnya yang punya audio diputar otomatis (ayat tanpa audio dilewati), layar menggulir ke ayat itu HANYA bila belum terlihat penuh (gerak mati bila pengguna mengurangi gerak), berhenti di akhir surah (tidak pindah ke surah lain). Bawaan = Satu ayat (perilaku 5b-1/5b-2 tidak berubah). Pilihan hanya hidup selama halaman terbuka: TIDAK menulis ke penyimpanan apa pun. 0 baris lama diubah. Membalik: hapus blok ini. ===== */
HFP.seq = false;   // false = Satu ayat; true = Berurutan
function hfaGulir(a) {   // gulir ke ayat a hanya bila tidak terlihat penuh
  const li = $('#hfr-a-' + a); if (!li || !li.getBoundingClientRect) return;
  const r = li.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= window.innerHeight) return;
  let red = false; try { red = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* gerak biasa */ }
  try { li.scrollIntoView({ block: 'center', behavior: red ? 'auto' : 'smooth' }); } catch (e) { /* abaikan */ }
}
function hfaMulai(a) {   // pindah otomatis ke ayat a: sumber baru, putaran 1, sorot, gulir; false bila tidak bisa
  const u = HFR.s ? hfaUrl(HFR.s, a) : null; if (!u) return false;
  HFA.src = u[1]; HFP.a = a; HFP.cnt = 1; hfaApplySpd();
  try { const pr = HFA.play(); if (pr && pr.catch) pr.catch(() => { hfaStop(); }); } catch (e) { hfaStop(); return false; }
  hfaMark(); hfaGulir(a); return true;
}
{ const b = hfaCtl; hfaCtl = function (s) {
  const x = b(s); if (!x) return x;
  const chip = (v, t) => '<button class="hfr-chip" type="button" data-q="hfrLanjut" data-v="' + v + '" data-fk="hfrLanjut-' + v + '" aria-pressed="' + ((v === 1) === HFP.seq ? 'true' : 'false') + '">' + t + '</button>';
  return x.replace(/<\/div>$/, '<div class="hfr-grp"><span class="hfr-lb" id="hfrLbL">Sesudah ayat selesai</span><div class="hfr-chips" role="group" aria-labelledby="hfrLbL">' + chip(0, 'Satu ayat') + chip(1, 'Berurutan') + '</div></div></div>');
}; }
{ const c = hfaChips; hfaChips = function () { c(); const r = $('#hfrBody'); if (r) r.querySelectorAll('[data-q=hfrLanjut]').forEach(b => b.setAttribute('aria-pressed', String((Number(b.dataset.v) === 1) === HFP.seq))); }; }
{ const sel = hfaSelesai; hfaSelesai = function () {
  if (HFP.seq && HFP.a && HFP.cnt >= HFP.rep && HFR.s) {
    for (let a = HFP.a + 1; a <= HFR.s.ay.length; a++) { if (hfaUrl(HFR.s, a)) { if (hfaMulai(a)) return; break; } }
  }
  sel.apply(this, arguments);   // ulang atau berhenti
}; }
QACT.hfrLanjut = el => { if (!hfvOn()) return; const v = Number(el && el.dataset ? el.dataset.v : -1); if (v !== 0 && v !== 1) return; HFP.seq = v === 1; hfaMark(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b3: Object.freeze({ mulai: hfaMulai, gulir: hfaGulir, lanjut: QACT.hfrLanjut, st: () => ({ a: HFP.a, on: HFP.on, cnt: HFP.cnt, rep: HFP.rep, seq: HFP.seq }) }) }));
/* ===== OTH-5b3-end ===== */
/* ===== OTH-5b4a-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5b-4a: BILAH KENDALI putar di kartu "Ruang hafal" (menempel di bawah layar, di atas bilah tab, tampil hanya saat ada ayat yang dipilih: "Ayat 3 · 2/3", tombol Jeda/Lanjut dan Henti). Tidak menulis ke penyimpanan apa pun. 0 baris lama diubah. Membalik: hapus blok ini dan CSS OTH-5b4a. ===== */
{ const b = hfrHtml; hfrHtml = function () {
  const x = b.apply(this, arguments);
  return x.replace(/<\/ol><\/section>$/, '</ol><div class="hfr-bar" id="hfrBar" role="group" aria-label="Kendali putar Ruang hafal" hidden><span class="hfr-bi" id="hfrBi" role="status"></span><button class="hfr-bb j" type="button" data-q="hfrBarJeda" data-fk="hfr-bar-jeda">Jeda</button><button class="hfr-bb" type="button" data-q="hfrBarHenti" data-fk="hfr-bar-henti">Henti</button></div></section>');
}; }
function hfaBarTeks() { return 'Ayat ' + HFP.a + (HFP.rep > 1 && HFP.cnt > 0 ? ' \u00b7 ' + HFP.cnt + '/' + HFP.rep : ''); }   // MURNI (bergantung pada HFP)
function hfaBar() {   // sinkronkan bilah dengan keadaan; tanpa bilah (daftar surah) = diam
  const bar = $('#hfrBar'); if (!bar) return;
  const tampil = HFP.a > 0; bar.hidden = !tampil; if (!tampil) return;
  const bi = $('#hfrBi'); if (bi) bi.textContent = hfaBarTeks();
  const j = bar.querySelector('[data-q=hfrBarJeda]'); if (j) j.textContent = HFP.on ? 'Jeda' : 'Lanjut';
}
{ const m = hfaMark; hfaMark = function () { m.apply(this, arguments); hfaBar(); }; }
QACT.hfrBarJeda = () => { if (!hfvOn() || !HFP.a) return; QACT.hfrPutar({ dataset: { a: String(HFP.a) } }); };   // putar/jeda ayat yang dipilih lewat jalur yang sama dengan tombol ayat
QACT.hfrBarHenti = () => { if (!hfvOn()) return; const a = HFP.a; hfaStop(); if (a) hfrFokus('hfr-pl-' + a); };   // bilah hilang: fokus pindah ke tombol putar ayat itu
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b4a: Object.freeze({ bar: hfaBar, teks: hfaBarTeks, jeda: QACT.hfrBarJeda, henti: QACT.hfrBarHenti }) }));
/* ===== OTH-5b4a-end ===== */
/* ===== OTH-5b4b-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5b-4b: pilihan putar (ulang, kecepatan, lanjut) DILIPAT jadi satu baris ringkas ("Ulang 3× · 1,5× · Lanjut otomatis") yang dibuka dengan satu ketukan; label diperbaiki: kecepatan Ibadah memuat angkanya ("Ibadah (1×)"), "Berurutan" menjadi "Lanjut otomatis ke ayat berikutnya: Mati | Hidup". Bawaan = tertutup setiap surah dibuka. Hanya hidup selama halaman terbuka: TIDAK menulis ke penyimpanan apa pun. 0 baris lama diubah. Membalik: hapus blok ini dan CSS OTH-5b4b. ===== */
HFP.open = false;   // true = kelompok pilihan terbuka
const hfaFmt = v => String(v).replace('.', ',') + '\u00d7';   // 1.5 -> "1,5×"
function hfaIbd() { let v = 1; try { v = qrP().spd || 1; } catch (e) { /* 1 */ } return v; }   // kecepatan pilihan Ibadah (hanya dibaca)
function hfaRingkas() { return 'Ulang ' + HFP.rep + '\u00d7 \u00b7 ' + hfaFmt(hfaSpd()) + (HFP.spd === 0 ? ' (Ibadah)' : '') + ' \u00b7 ' + (HFP.seq ? 'Lanjut otomatis' : 'Satu ayat'); }   // MURNI (bergantung pada HFP)
const HFA_SRP = '<span class="hfr-sr">Pengaturan putar: </span>';
{ const b = hfaCtl; hfaCtl = function (s) {
  const x = b(s); if (!x) return x;
  return x.replace('<div class="hfr-ctl">', '<div class="hfr-ctl"><button class="hfr-sum" type="button" data-q="hfrOpsi" data-fk="hfr-opsi" aria-expanded="' + (HFP.open ? 'true' : 'false') + '" aria-controls="hfrOpsiBox"><span class="hfr-sumt">' + HFA_SRP + hfaRingkas() + '</span><span class="hfr-sumi" aria-hidden="true"></span></button><div class="hfr-box" id="hfrOpsiBox"' + (HFP.open ? '' : ' hidden') + '>')
    .replace(/<\/div>$/, '</div></div>')
    .replace('>Satu ayat</button>', '>Mati</button>').replace('>Berurutan</button>', '>Hidup</button>')
    .replace('>Sesudah ayat selesai<', '>Lanjut otomatis ke ayat berikutnya<')
    .replace('>Ibadah</button>', '>Ibadah (' + hfaFmt(hfaIbd()) + ')</button>');
}; }
{ const c = hfaChips; hfaChips = function () {
  c.apply(this, arguments); const r = $('#hfrBody'); if (!r) return;
  const sm = r.querySelector('.hfr-sum'), bx = r.querySelector('#hfrOpsiBox'); if (!sm || !bx) return;
  sm.setAttribute('aria-expanded', String(HFP.open)); bx.hidden = !HFP.open;
  const t = sm.querySelector('.hfr-sumt'); if (t) t.innerHTML = HFA_SRP + hfaRingkas();   // hanya angka dan teks tetap
  const ib = r.querySelector('[data-q=hfrKec][data-v="0"]'); if (ib) ib.textContent = 'Ibadah (' + hfaFmt(hfaIbd()) + ')';
}; }
QACT.hfrOpsi = () => { if (!hfvOn()) return; HFP.open = !HFP.open; hfaChips(); };
{ const bu = QACT.hfrBuka; QACT.hfrBuka = el => { HFP.open = false; bu(el); }; }   // setiap surah dibuka: pilihan tertutup
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b4b: Object.freeze({ ctl: s => hfaCtl(s), ringkas: hfaRingkas, fmt: hfaFmt, ibd: hfaIbd, opsi: QACT.hfrOpsi, st: () => ({ open: HFP.open }) }) }));
/* ===== OTH-5b4b-end ===== */
/* ===== OTH-5b4c-begin (22 Nov 2026): Sinaps > Hafalan, bagian 5b-4c: gulir otomatis Ruang hafal LEBIH SOPAN. (1) Sesudah pemilik menggulir sendiri (roda, sentuh geser, tombol panah/PageUp/PageDown/Home/End/Spasi di luar kolom isian dan tombol) gulir otomatis DITUNDA 5 detik. (2) "Sudah terlihat" kini dihitung terhadap area baca yang sebenarnya (di atas bilah tab dan bilah kendali), bukan seluruh layar. (3) Ayat yang lebih tinggi dari 80% area baca dianggap terlihat bila awalnya ada di separuh atas area baca, dan bila perlu digulir ke ATAS (bukan ke tengah) supaya tidak melompat. Tidak menulis ke penyimpanan. Pengganti fungsi `hfaGulir` 5b-3 saat dijalankan (kode lama tidak diubah). Membalik: hapus blok ini dan CSS OTH-5b4c. ===== */
const HFA_TUNDA = 5000;   // ms gulir otomatis ditunda sesudah gulir manual
HFP.man = 0;   // waktu (Date.now) gulir manual terakhir; 0 = belum pernah
const hfaManual = () => { HFP.man = Date.now(); };
['wheel', 'touchmove'].forEach(e => window.addEventListener(e, hfaManual, { passive: true }));
window.addEventListener('keydown', ev => {
  if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(ev.key)) return;
  const t = ev.target, tg = t && t.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || tg === 'BUTTON' || (t && t.isContentEditable)) return;
  hfaManual();
});
function hfaBawah() {   // batas bawah area baca = di atas bilah tab dan (bila tampil) bilah kendali
  let b = window.innerHeight; const t = $('.tabs'); if (t) b = Math.min(b, t.getBoundingClientRect().top);
  const bar = $('#hfrBar'); if (bar && !bar.hidden) b = Math.min(b, bar.getBoundingClientRect().top);
  return b;
}
function hfaLihat(a) {   // true bila ayat a sudah cukup terlihat di area baca
  const li = $('#hfr-a-' + a); if (!li || !li.getBoundingClientRect) return true;
  const r = li.getBoundingClientRect(), b = hfaBawah();
  if (r.height > b * 0.8) return r.top >= 0 && r.top < b * 0.5;   // ayat tinggi: cukup awalnya terlihat di separuh atas
  return r.top >= 0 && r.bottom <= b;
}
hfaGulir = function (a) {
  if (Date.now() - HFP.man < HFA_TUNDA || hfaLihat(a)) return;
  const li = $('#hfr-a-' + a); if (!li) return;
  let red = false; try { red = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* gerak biasa */ }
  const tinggi = li.getBoundingClientRect().height > hfaBawah() * 0.8;
  try { li.scrollIntoView({ block: tinggi ? 'start' : 'center', behavior: red ? 'auto' : 'smooth' }); } catch (e) { /* abaikan */ }
};
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b4c: Object.freeze({ lihat: hfaLihat, bawah: hfaBawah, gulir: a => hfaGulir(a), manual: hfaManual, setMan: v => { HFP.man = v; }, st: () => ({ man: HFP.man, tunda: HFA_TUNDA }) }) }));
/* ===== OTH-5b4c-end ===== */
/* ===== OTH-5b4d-begin (22-23 Nov 2026): Sinaps > Hafalan, bagian 5b-4d: tiga perbaikan UI yang TERBUKTI dari tangkapan layar dan ukuran kontras (bukan tebakan). (1) Kolom cari Ruang hafal terpotong di 320 px ("Cari nama atau nomor sura"): teks petunjuk dipendekkan jadi "Cari nama atau nomor" (pembungkus hfrHtml, kode lama tidak diubah). (2) Ayat yang sedang diputar menggeser isinya 12 px (loncatan): CSS memberi SEMUA ayat lajur kiri 12 px yang tetap (lihat blok CSS 5b4d). (3) Tombol Jeda/Lanjut di bilah kendali mode terang kontras 4,44:1 (batas 4,5): latar tint 14% jadi 10% (lihat blok CSS). Tidak menulis ke penyimpanan. Membalik: hapus blok ini dan blok CSS 5b4d. ===== */
const HFR_PH = 'Cari nama atau nomor';
{ const b = hfrHtml; hfrHtml = function () { return b.apply(this, arguments).replace('placeholder="Cari nama atau nomor surah"', 'placeholder="' + HFR_PH + '"'); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5b4d: Object.freeze({ ph: HFR_PH }) }));
/* ===== OTH-5b4d-end ===== */
/* ===== OTH-5c1-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-1: MODE TUTUP di Ruang hafal, untuk menguji hafalan: pilihan "Tampilan ayat: Baca | Tutup Arab | Tutup semua" dan tombol "Buka ayat" per ayat (membuka satu ayat saja, "Tutup lagi" menutupnya). Tutup Arab = Arab dan Latin disembunyikan, arti tetap tampil sebagai petunjuk; Tutup semua = Arab, Latin, dan arti disembunyikan. Bagian tertutup tidak dibacakan pembaca layar (display:none). Pilihan dan ayat yang dibuka HANYA hidup selama halaman terbuka: TIDAK menulis ke penyimpanan. Ayat yang dibuka dikosongkan saat mode diganti dan saat surah dibuka atau ditutup; mode bertahan antar-surah. Penanda hafal dan progres: 5c-2. Membalik: hapus blok ini dan blok CSS 5c1. ===== */
const HFT_MODE = ['baca', 'arab', 'semua'];
const HFT = { m: 'baca', buka: new Set() };   // m = tampilan ayat; buka = nomor ayat yang dibuka sendiri
function hfrTampil(mode, terbuka) {   // MURNI: mode + apakah ayat dibuka -> bagian yang tampil (mode tak dikenal = baca)
  if (terbuka || HFT_MODE.indexOf(mode) < 1) return { arab: true, lat: true, id: true };
  return mode === 'arab' ? { arab: false, lat: false, id: true } : { arab: false, lat: false, id: false };
}
function hfrTtCtl(mode) {   // MURNI: baris pilihan tampilan ayat
  const chip = (v, t) => '<button class="hfr-chip" type="button" data-q="hfrTt" data-v="' + v + '" data-fk="hfrTt-' + v + '" aria-pressed="' + (v === mode ? 'true' : 'false') + '">' + t + '</button>';
  return '<div class="hfr-grp hfr-tt"><span class="hfr-lb" id="hfrLbT">Tampilan ayat</span><div class="hfr-chips" role="group" aria-labelledby="hfrLbT">' + chip('baca', 'Baca') + chip('arab', 'Tutup Arab') + chip('semua', 'Tutup semua') + '</div></div>';
}
{ const b = hfrAyat; hfrAyat = function () {   // tombol buka/tutup per ayat + kelas "buka" bagi ayat yang dibuka
  return b.apply(this, arguments).replace(/<li class="hfr-a" id="hfr-a-(\d+)">([\s\S]*?)<\/li>/g, (m, n, inner) => {
    const o = HFT.buka.has(Number(n));
    return '<li class="hfr-a' + (o ? ' buka' : '') + '" id="hfr-a-' + n + '">' + inner + '<button class="hfr-bk" type="button" data-q="hfrBk" data-a="' + n + '" data-fk="hfr-bk-' + n + '" aria-expanded="' + (o ? 'true' : 'false') + '">' + (o ? 'Tutup lagi' : 'Buka ayat') + '</button></li>';
  });
}; }
{ const b = hfrHtml; hfrHtml = function () {   // mode di akar kartu + baris pilihan di atas pilihan putar (atau di atas daftar ayat bila surah tanpa audio)
  let x = b.apply(this, arguments).replace('id="hfrBody"', 'id="hfrBody" data-tt="' + HFT.m + '"');
  if (HFR.n && HFR.st === 'ok' && HFR.s) { const c = hfrTtCtl(HFT.m), k = x.indexOf('<div class="hfr-ctl"'); x = k >= 0 ? x.slice(0, k) + c + x.slice(k) : x.replace('<ol class="hfr-ay">', c + '<ol class="hfr-ay">'); }
  return x;
}; }
function hfrTtApply() {   // pasang keadaan ke kartu yang sudah ada, tanpa gambar ulang (fokus dan sorotan putar tidak hilang)
  const r = $('#hfrBody'); if (!r) return;
  r.setAttribute('data-tt', HFT.m);
  r.querySelectorAll('[data-q=hfrTt]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === HFT.m ? 'true' : 'false'));
  r.querySelectorAll('.hfr-a').forEach(li => {
    const o = HFT.buka.has(Number(String(li.id).replace('hfr-a-', ''))); li.classList.toggle('buka', o);
    const k = li.querySelector('.hfr-bk'); if (k) { k.setAttribute('aria-expanded', o ? 'true' : 'false'); k.textContent = o ? 'Tutup lagi' : 'Buka ayat'; }
  });
}
QACT.hfrTt = el => {
  if (!hfvOn()) return;
  const v = el && el.dataset ? el.dataset.v : ''; if (HFT_MODE.indexOf(v) < 0 || v === HFT.m) return;
  HFT.m = v; HFT.buka.clear(); hfrTtApply();
};
QACT.hfrBk = el => {
  if (!hfvOn() || HFT.m === 'baca') return;
  const n = Number(el && el.dataset ? el.dataset.a : 0);
  if (!(n >= 1) || n !== Math.floor(n) || !HFR.s || !Array.isArray(HFR.s.ay) || !HFR.s.ay.some(x => Number(x.a) === n)) return;   // tombol basi atau ayat tak ada: diam
  if (HFT.buka.has(n)) HFT.buka.delete(n); else HFT.buka.add(n);
  hfrTtApply();
};
{ const b1 = QACT.hfrBuka, b2 = QACT.hfrTutup;   // ayat yang dibuka tidak terbawa ke surah lain
  QACT.hfrBuka = function () { HFT.buka.clear(); return b1.apply(this, arguments); };
  QACT.hfrTutup = function () { HFT.buka.clear(); return b2.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c1: Object.freeze({ tampil: hfrTampil, ctl: hfrTtCtl, mode: HFT_MODE.slice(), st: () => ({ m: HFT.m, buka: [...HFT.buka].sort((a, b) => a - b) }) }) }));
/* ===== OTH-5c1-end ===== */
/* ===== OTH-5c2a-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2a: LOGIKA MURNI penanda hafal per ayat + progres per surah (Ruang hafal). Hanya hitung: TIDAK menulis, TIDAK menyimpan, belum ada tombol atau tampilan (5c-2b tempat simpan, 5c-2c cadangan, 5c-2d tombol). Bentuk data: { "<nomor surah>": [nomor ayat hafal, naik, tanpa ganda] }; surah tanpa ayat hafal tidak disimpan. Semua fungsi mengembalikan objek BARU dan beku, masukan tidak pernah diubah. Jumlah ayat dari QR_SURAH (sama dengan 4a dan Ruang hafal). ===== */
const hfhAyat = (n, v) => { const k = hfzNo(n); if (!k) return 0; const a = typeof v === 'string' && /^[0-9]{1,3}$/.test(v.trim()) ? Number(v.trim()) : v; return Number.isInteger(a) && a >= 1 && a <= QR_SURAH[k - 1][2] ? a : 0; };   // MURNI: (surah, ayat) -> nomor ayat sah (bilangan bulat atau teks angka, 1..jumlah ayat surah itu) atau 0
function hfhBersih(data) {   // MURNI: data mentah (simpanan, impor, apa pun) -> data BERSIH beku; kunci harus nomor surah kanonik "1".."114" (bukan "07"), isi hanya BILANGAN ayat sah, tanpa ganda, naik; surah kosong dibuang; bukan objek biasa = {}; tidak melempar
  const out = {};
  if (data && typeof data === 'object' && !Array.isArray(data)) Object.keys(data).forEach(key => {
    if (!/^[0-9]{1,3}$/.test(key) || String(Number(key)) !== key) return;
    const n = hfzNo(key), src = data[key]; if (!n || !Array.isArray(src)) return;
    const s = new Set(); src.forEach(v => { if (typeof v === 'number') { const a = hfhAyat(n, v); if (a) s.add(a); } });
    if (s.size) out[String(n)] = Object.freeze([...s].sort((x, y) => x - y));
  });
  return Object.freeze(out);
}
function hfhAda(data, n, a) {   // MURNI: apakah ayat a surah n sudah ditandai hafal; data kotor atau masukan tak sah = false; tidak melempar
  const k = hfzNo(n), v = hfhAyat(n, a); if (!k || !v || !data || typeof data !== 'object' || Array.isArray(data)) return false;
  const r = data[String(k)]; return Array.isArray(r) && r.indexOf(v) >= 0;
}
function hfhUbah(data, n, a, nilai) {   // MURNI (dalam): tandai (nilai true) atau lepas (false) SATU ayat -> { ok:true, ubah, data } atau { ok:false, kode: surah_tak_sah | ayat_tak_sah }; ubah=false bila ayat sudah dalam keadaan itu; data selalu versi bersih
  const k = hfzNo(n); if (!k) return Object.freeze({ ok: false, kode: 'surah_tak_sah' });
  const v = hfhAyat(k, a); if (!v) return Object.freeze({ ok: false, kode: 'ayat_tak_sah' });
  const d = hfhBersih(data), cur = d[String(k)] || [], ada = cur.indexOf(v) >= 0;
  if (ada === nilai) return Object.freeze({ ok: true, ubah: false, data: d });
  const o = Object.assign({}, d), nx = nilai ? cur.concat([v]).sort((x, y) => x - y) : cur.filter(x => x !== v);
  if (nx.length) o[String(k)] = Object.freeze(nx); else delete o[String(k)];
  return Object.freeze({ ok: true, ubah: true, data: Object.freeze(o) });
}
const hfhTandai = (data, n, a) => hfhUbah(data, n, a, true);   // MURNI: tandai hafal satu ayat
const hfhLepas = (data, n, a) => hfhUbah(data, n, a, false);   // MURNI: lepas tanda satu ayat
const hfhBalik = (data, n, a) => hfhUbah(data, n, a, !hfhAda(hfhBersih(data), n, a));   // MURNI: balik tanda satu ayat (tombol "Tandai hafal")
function hfhSemua(data, n) {   // MURNI: tandai SEMUA ayat surah n -> { ok:true, ubah, data } atau { ok:false, kode:'surah_tak_sah' }; ubah=false bila sudah penuh
  const i = hfzInfo(n); if (!i) return Object.freeze({ ok: false, kode: 'surah_tak_sah' });
  const d = hfhBersih(data), cur = d[String(i.n)] || []; if (cur.length === i.total) return Object.freeze({ ok: true, ubah: false, data: d });
  const o = Object.assign({}, d), all = []; for (let a = 1; a <= i.total; a++) all.push(a); o[String(i.n)] = Object.freeze(all);
  return Object.freeze({ ok: true, ubah: true, data: Object.freeze(o) });
}
function hfhKosong(data, n) {   // MURNI: kosongkan semua tanda surah n -> { ok:true, ubah, data } atau { ok:false, kode:'surah_tak_sah' }; ubah=false bila memang kosong
  const k = hfzNo(n); if (!k) return Object.freeze({ ok: false, kode: 'surah_tak_sah' });
  const d = hfhBersih(data); if (!d[String(k)]) return Object.freeze({ ok: true, ubah: false, data: d });
  const o = Object.assign({}, d); delete o[String(k)]; return Object.freeze({ ok: true, ubah: true, data: Object.freeze(o) });
}
const hfhPersen = (hafal, total) => hafal <= 0 ? 0 : (hafal >= total ? 100 : Math.min(99, Math.max(1, Math.round(hafal * 100 / total))));   // MURNI: 0 hanya bila belum ada, 100 hanya bila penuh; selain itu 1..99 (1 ayat dari 286 tidak tampil 0 persen, 285 dari 286 tidak tampil 100 persen)
function hfhProgres(data, n) {   // MURNI: progres satu surah -> { n, hafal, total, persen, penuh } beku, atau null bila surah tak sah
  const i = hfzInfo(n); if (!i) return null;
  const hafal = (hfhBersih(data)[String(i.n)] || []).length;
  return Object.freeze({ n: i.n, hafal, total: i.total, persen: hfhPersen(hafal, i.total), penuh: hafal === i.total });
}
function hfhRingkas(data) {   // MURNI: ringkasan seluruh Al-Qur'an -> { hafal, total, surahMulai, surahPenuh, persen } beku
  const d = hfhBersih(data); let hafal = 0, total = 0, mulai = 0, penuh = 0;
  for (let k = 1; k <= 114; k++) { const t = QR_SURAH[k - 1][2], h = (d[String(k)] || []).length; total += t; hafal += h; if (h) mulai++; if (h === t) penuh++; }
  return Object.freeze({ hafal, total, surahMulai: mulai, surahPenuh: penuh, persen: hfhPersen(hafal, total) });
}
function hfhRentang(data, n) {   // MURNI: ayat hafal surah n sebagai teks rentang, mis. "1–5, 7, 9–11" (urutan beruntun >= 2 jadi rentang); tak sah atau kosong = ""
  const k = hfzNo(n); if (!k) return ''; const a = hfhBersih(data)[String(k)] || [], p = []; let i = 0;
  while (i < a.length) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; p.push(j > i ? a[i] + '–' + a[j] : String(a[i])); i = j + 1; }
  return p.join(', ');
}
function hfhLabel(pr) {   // MURNI: progres (dari hfhProgres) -> kalimat untuk daftar surah; null atau tak lengkap = ""
  if (!pr || typeof pr !== 'object' || !Number.isInteger(pr.hafal) || !Number.isInteger(pr.total) || pr.total < 1) return '';
  if (pr.hafal <= 0) return 'Belum ada yang dihafal';
  if (pr.hafal >= pr.total) return 'Hafal semua ' + pr.total + ' ayat';
  return pr.hafal + ' dari ' + pr.total + ' ayat · ' + hfhPersen(pr.hafal, pr.total) + '%';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2a: Object.freeze({ ayat: hfhAyat, bersih: hfhBersih, ada: hfhAda, tandai: hfhTandai, lepas: hfhLepas, balik: hfhBalik, semua: hfhSemua, kosong: hfhKosong, persen: hfhPersen, progres: hfhProgres, ringkas: hfhRingkas, rentang: hfhRentang, label: hfhLabel }) }));
/* ===== OTH-5c2a-end ===== */
/* ===== OTH-5c2b-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2b: TEMPAT SIMPAN `dailylog:hafalan-hafal:v1` (tanda hafal per ayat, OTH-5c2a) lewat antrean simpan yang ada (pola OTH-1b dan OTH-3b-1). Bentuk: { v, hafal:{ "<surah>":[ayat...] }, u }. Catatan `versi_baru` = TIDAK menimpa; waktu habis saat memuat = BELUM siap (tidak dianggap kosong). Ikut "Hapus semua data". Menulis HANYA bila ada ayat yang benar-benar berubah. BELUM ikut ekspor/impor JSON (5c-2c), BELUM ada tombol atau tampilan (5c-2d). Membalik: hapus blok ini. ===== */
const HFN_KEY = 'dailylog:hafalan-hafal:v1', HFN_V = 1, HFN_WAIT = 4000, HFN_UMAX = 4102444800000;
function hfnClean(raw) {   // MURNI: masukan apa pun -> { data:{v,hafal,u}, buang, catatan } beku; buang = jumlah butir (surah bukan larik, ayat tak sah, ganda) yang tidak ikut; tidak melempar, tidak mengubah masukan
  const o = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : null, catatan = [];
  if (raw !== null && raw !== undefined && !o) catatan.push('bukan_objek');
  if (o && typeof o.v === 'number' && o.v > HFN_V) catatan.push('versi_baru');
  const h = o && o.hafal !== null && typeof o.hafal === 'object' && !Array.isArray(o.hafal) ? o.hafal : null, bersih = hfhBersih(h);
  let mentah = 0, sisa = 0; if (h) Object.keys(h).forEach(k => { mentah += Array.isArray(h[k]) ? h[k].length : 1; }); Object.keys(bersih).forEach(k => { sisa += bersih[k].length; });
  const u = o && typeof o.u === 'number' && isFinite(o.u) && o.u >= 0 && o.u <= HFN_UMAX ? o.u : 0;
  return Object.freeze({ data: Object.freeze({ v: HFN_V, hafal: bersih, u }), buang: Math.max(0, mentah - sisa), catatan: Object.freeze(catatan) });
}
const HFN = { ready: false, loading: false, p: null, gen: 0, blocked: false, catatan: [], data: hfnClean(null).data };   // gen naik tiap "Hapus semua data": hasil muat yang datang terlambat dibuang
STORES.hafalanTanda = { key: HFN_KEY, get: () => HFN.data }; dirty.hafalanTanda = false;   // khusus perangkat sampai 5c-2c (ekspor/impor)
function hfnLoad0() {
  const g = HFN.gen; HFN.loading = true;
  const lama = new Promise(r => setTimeout(() => r(undefined), HFN_WAIT));
  return Promise.race([store.load(HFN_KEY), lama]).then(raw => {
    if (g !== HFN.gen) return;
    if (raw === undefined) { HFN.p = null; return; }   // waktu habis: BELUM siap (bukan dianggap kosong, supaya data tersimpan tidak tertimpa)
    const r = hfnClean(raw); HFN.data = r.data; HFN.catatan = r.catatan.slice(); HFN.blocked = r.catatan.indexOf('versi_baru') >= 0; HFN.ready = true;
  }).catch(() => { if (g === HFN.gen) HFN.p = null; }).then(() => { if (g === HFN.gen) HFN.loading = false; });
}
function hfnLoad() { if (!HFN.p) HFN.p = hfnLoad0(); return HFN.p; }
async function hfnJalan(fn, now) {   // satu pintu tulis: muat dulu, jaga belum_siap/versi_baru/waktu, jalankan fn(hafal) -> hasil hfh*; tulis HANYA bila ok dan ubah
  await hfnLoad();
  const fail = kode => Object.freeze({ ok: false, kode });
  if (!HFN.ready) return fail('belum_siap');
  if (HFN.blocked) return fail('versi_baru');
  const w = now === undefined ? Date.now() : now;
  if (!(Number.isSafeInteger(w) && w >= 0 && w <= HFN_UMAX)) return fail('waktu');
  const r = fn(HFN.data.hafal); if (!r.ok || !r.ubah) return r;
  HFN.data = Object.freeze({ v: HFN_V, hafal: r.data, u: Math.max(w, HFN.data.u + 1) }); dirty.hafalanTanda = true; queueSave('hafalanTanda');
  return r;
}
const hfnTandai = (n, a, now) => hfnJalan(h => hfhTandai(h, n, a), now);   // -> { ok, ubah, data } | { ok:false, kode } (surah_tak_sah, ayat_tak_sah, belum_siap, versi_baru, waktu)
const hfnLepas = (n, a, now) => hfnJalan(h => hfhLepas(h, n, a), now);
const hfnBalik = (n, a, now) => hfnJalan(h => hfhBalik(h, n, a), now);
const hfnSemua = (n, now) => hfnJalan(h => hfhSemua(h, n), now);
const hfnKosong = (n, now) => hfnJalan(h => hfhKosong(h, n), now);
function hfnState() { return Object.freeze({ ready: HFN.ready, loading: HFN.loading, blocked: HFN.blocked, dirty: dirty.hafalanTanda, catatan: HFN.catatan.slice(), ayat: hfhRingkas(HFN.data.hafal).hafal, u: HFN.data.u }); }
function hfnWipe() { HFN.gen++; HFN.data = hfnClean(null).data; HFN.blocked = false; HFN.catatan = []; HFN.ready = true; HFN.loading = false; HFN.p = Promise.resolve(); }   // dipanggil "Hapus semua data": sesudahnya flush menulis data kosong
{ const baseHfnWipe = odWipe; odWipe = function () { hfnWipe(); return baseHfnWipe.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2b: Object.freeze({ key: HFN_KEY, clean: hfnClean, load: hfnLoad, get: () => HFN.data, tandai: hfnTandai, lepas: hfnLepas, balik: hfnBalik, semua: hfnSemua, kosong: hfnKosong, state: hfnState, ada: (n, a) => hfhAda(HFN.data.hafal, n, a), progres: n => hfhProgres(HFN.data.hafal, n), ringkas: () => hfhRingkas(HFN.data.hafal) }) }));
/* ===== OTH-5c2b-end ===== */
/* ===== OTH-5c2c-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2c: tanda hafal per ayat (OTH-5c2a/5c2b) IKUT cadangan JSON dan impor (`extra.hafalanTanda`) dan jalur SINKRON yang sama (pola OTH-1c dan OTH-3b2). hfnSnap = salinan murni untuk cadangan (null bila tidak ada ayat hafal; kunci surah naik); hfnMergeIn = gabung MURNI = UNION himpunan ayat per surah (komutatif, asosiatif, idempoten, jadi hasil SAMA di kedua arah dan untuk urutan impor apa pun, termasuk tiga perangkat); tanda lokal TIDAK pernah dibuang; `u` = yang terbesar dari dua sisi. KEPUTUSAN TERBUKA untuk pemilik (bawaan dipakai): bila satu perangkat sudah MELEPAS tanda hafal, union akan menghidupkannya lagi dari perangkat lain (belum ada nisan hapus; sama dengan kartu Hafalan sebelum 3d). exMergeTanda dipanggil exMerge (apply=false hanya menghitung). Catatan lokal dari versi lebih baru (`HFN.blocked`) tidak diekspor dan tidak ditimpa. Titik lama yang disambung: exReady, exEnsure, exSnap (3 tempat), exMerge, importReview, doImport. Membalik: hapus blok ini dan sambungan bertanda OTH-5c2c. ===== */
function hfnSnap(data) {   // MURNI: data apa pun -> salinan bersih beku { v, hafal, u } untuk cadangan, atau null bila tidak ada ayat hafal; kunci surah naik (dua perangkat yang sama = teks yang sama)
  const d = hfnClean(data).data, h = {};
  Object.keys(d.hafal).sort((a, b) => Number(a) - Number(b)).forEach(k => { h[k] = Object.freeze(d.hafal[k].slice()); });
  if (!Object.keys(h).length) return null;
  return Object.freeze({ v: HFN_V, hafal: Object.freeze(h), u: d.u });
}
function hfnMergeIn(cur, raw) {   // MURNI: -> { data, add, same, surah, tak, baru } beku; add = ayat BARU di sini; same = ayat file yang sudah ada di sini; surah = jumlah surah yang bertambah ayatnya; tak = isian file yang dibuang karena tidak sah; baru = file dari versi lebih baru (ayat yang sah tetap dibaca); u = yang terbesar dari dua sisi
  const c = hfnClean(cur).data, inc = hfnClean(raw), out = {};
  let add = 0, same = 0, surah = 0;
  for (let k = 1; k <= 114; k++) {
    const key = String(k), a = c.hafal[key] || [], b = inc.data.hafal[key] || [];
    if (!a.length && !b.length) continue;
    const s = new Set(a); let n = 0;
    b.forEach(v => { if (s.has(v)) same++; else { s.add(v); n++; } });
    if (n) { add += n; surah++; }
    out[key] = Object.freeze([...s].sort((x, y) => x - y));
  }
  return Object.freeze({ data: Object.freeze({ v: HFN_V, hafal: Object.freeze(out), u: Math.max(c.u, inc.data.u) }), add, same, surah, tak: inc.buang, baru: inc.catatan.indexOf('versi_baru') >= 0 });
}
function hfnSnapOut() { return HFN.blocked ? null : hfnSnap(HFN.data); }   // catatan lokal dari versi lebih baru: tidak diekspor
function exMergeTanda(src, r, apply) {   // dipanggil exMerge
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || !src.hafalanTanda) return;
  if (HFN.blocked) { r.htBlok = 1; return; }   // catatan lokal dari versi lebih baru: tidak ditimpa
  const m = hfnMergeIn(HFN.data, src.hafalanTanda);
  r.htAdd = (r.htAdd || 0) + m.add; r.htSurah = (r.htSurah || 0) + m.surah; r.htTak = (r.htTak || 0) + m.tak;
  if (m.add) r.exAdded += m.add; else r.exSame++;
  if (apply && (m.add || m.data.u !== HFN.data.u)) { HFN.data = m.data; dirty.hafalanTanda = true; queueSave('hafalanTanda'); }   // u selalu ikut maju supaya dua perangkat konvergen walau isi sama
}
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2c: Object.freeze({ snap: hfnSnap, mergeIn: hfnMergeIn, snapOut: hfnSnapOut, exMerge: exMergeTanda }) }));
/* ===== OTH-5c2c-end ===== */
/* ===== OTH-5c2d1-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-1: TOMBOL "Hafal" per ayat di Ruang hafal (memakai tanda hafal OTH-5c2a/5c2b/5c2c: `hfnBalik`, `hfhAda`). Tombol di baris nomor ayat, sesudah tombol putar; tombol bertanda `aria-pressed`, nama pembaca layar "Hafal ayat N". Selama catatan hafal BELUM selesai dimuat (atau berasal dari versi aplikasi lebih baru) tombol `aria-disabled` dan redup: keadaan sebenarnya belum diketahui, jadi mengetuk tidak boleh membalik apa pun (mencegah ayat yang sudah hafal terlepas karena salah tampil). Ketukan memperbarui tampilan TANPA menggambar ulang kartu (fokus, gulir, dan sorotan putar tidak hilang) dan memakai keadaan tersimpan, bukan tebakan tampilan. Kegagalan = toast dengan alasan. Tidak ada penyimpanan baru: semua lewat `hfnBalik` (antrean simpan yang ada). Belum ada progres per surah (5c-2d-2). Membalik: hapus blok ini dan blok CSS 5c2d1. ===== */
const HFH_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.7 2.7 5.5-5.6"/></svg>';
function hfrHfTombol(a, on, mati) {   // MURNI: tombol "Hafal" ayat a; a bukan bilangan bulat >= 1 = teks kosong; on = sudah hafal; mati = belum bisa diubah
  const n = typeof a === 'number' ? a : (typeof a === 'string' && /^[0-9]{1,3}$/.test(a) ? Number(a) : 0); if (!Number.isInteger(n) || n < 1) return '';
  return '<button class="hfr-hf' + (mati ? ' mati' : '') + '" type="button" data-q="hfrHf" data-a="' + n + '" data-fk="hfr-hf-' + n + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (mati ? ' aria-disabled="true"' : '') + '>' + HFH_IC + '<span>Hafal<span class="hfr-sr"> ayat ' + n + '</span></span></button>';
}
function hfrHfPesan(kode) {   // MURNI: kode kegagalan hfnJalan -> kalimat toast
  if (kode === 'belum_siap') return 'Catatan hafal belum siap. Coba lagi sebentar.';
  if (kode === 'versi_baru') return 'Catatan hafal ini dari versi aplikasi yang lebih baru, jadi tidak diubah di sini.';
  if (kode === 'waktu') return 'Tanda hafal belum bisa disimpan: jam perangkat tidak wajar.';
  return 'Tanda hafal belum bisa disimpan.';
}
{ const b = hfrAyat; hfrAyat = function (s) {   // tombol Hafal di akhir baris nomor ayat + kelas "hafal" pada ayat yang sudah ditandai
  const n = HFR.n, mati = !HFN.ready || HFN.blocked, h = HFN.ready ? HFN.data.hafal : null;
  return b.apply(this, arguments).replace(/<li class="hfr-a( buka)?" id="hfr-a-(\d+)">([\s\S]*?)<\/li>/g, (m, bk, a, inner) => {
    const on = !!h && hfhAda(h, n, Number(a));
    return '<li class="hfr-a' + (bk || '') + (on ? ' hafal' : '') + '" id="hfr-a-' + a + '">' + inner.replace('</div>', () => hfrHfTombol(a, on, mati) + '</div>') + '</li>';
  });
}; }
function hfrHfApply() {   // pasang keadaan tersimpan ke kartu yang ada, tanpa gambar ulang
  const r = $('#hfrBody'); if (!r || !HFR.n) return;
  const mati = !HFN.ready || HFN.blocked, h = HFN.ready ? HFN.data.hafal : null;
  r.querySelectorAll('.hfr-a').forEach(li => {
    const k = li.querySelector('.hfr-hf'); if (!k) return;
    const a = Number(String(li.id).replace('hfr-a-', '')), on = !!h && hfhAda(h, HFR.n, a);
    li.classList.toggle('hafal', on); k.setAttribute('aria-pressed', on ? 'true' : 'false'); k.classList.toggle('mati', mati);
    if (mati) k.setAttribute('aria-disabled', 'true'); else k.removeAttribute('aria-disabled');
  });
}
{ const b = hfrDraw; hfrDraw = function () { b.apply(this, arguments); if (HFR.n && HFR.st === 'ok' && !HFN.ready) hfnLoad().then(hfrHfApply); }; }   // catatan belum siap saat ayat tergambar: muat lalu aktifkan tombol
{ const b = QACT.hfrBuka; QACT.hfrBuka = function () { if (hfvOn()) hfnLoad().then(hfrHfApply); return b.apply(this, arguments); }; }   // muat catatan sejak surah diketuk, supaya biasanya sudah siap saat ayat muncul
QACT.hfrHf = el => {
  if (!hfvOn() || HFR.st !== 'ok' || !HFR.s || !Array.isArray(HFR.s.ay)) return;
  const n = HFR.n, a = Number(el && el.dataset ? el.dataset.a : 0);
  if (!(a >= 1) || a !== Math.floor(a) || !HFR.s.ay.some(x => Number(x.a) === a)) return;   // tombol basi atau ayat tak ada: diam
  if (!HFN.ready) { toast(hfrHfPesan('belum_siap')); hfnLoad().then(hfrHfApply); return; }
  if (HFN.blocked) { toast(hfrHfPesan('versi_baru')); return; }
  hfnBalik(n, a).then(r => { if (!r || !r.ok) toast(hfrHfPesan(r && r.kode)); hfrHfApply(); }, () => { toast(hfrHfPesan('')); hfrHfApply(); });
};
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d1: Object.freeze({ tombol: hfrHfTombol, pesan: hfrHfPesan, apply: hfrHfApply, ikon: HFH_IC }) }));
/* ===== OTH-5c2d1-end ===== */
/* ===== OTH-5c2d2a-begin (23 Nov 2026): Sinaps > Hafalan, bagian 5c-2d-2a: PROGRES HAFAL per surah di judul surah Ruang hafal ("3 dari 4 ayat · 75%" + bilah tipis). Memakai fungsi murni 5c-2a (`hfhProgres`, `hfhLabel`) dan keadaan 5c-2b (`HFN`). Hidup: diperbarui di tempat (tanpa gambar ulang kartu) lewat pembungkus `hfrHfApply` dari 5c-2d-1, jadi tiap ketukan Hafal (dan nanti Tandai semua / Kosongkan) ikut. Selama catatan belum siap tampil "Memuat tanda hafal…" (bukan "Belum ada yang dihafal", karena keadaan sebenarnya belum diketahui). Tanpa penyimpanan baru. Membalik: hapus blok ini dan CSS OTH-5c2d2a. ===== */
function hfrProgTeks(pr, siap, blok) {   // MURNI: progres satu surah (dari hfhProgres) + keadaan catatan -> { m, teks, persen }; m = muat | blok | kosong | jalan | penuh | '' (tak sah); tidak melempar
  if (!siap) return { m: 'muat', teks: 'Memuat tanda hafal…', persen: 0 };
  if (blok) return { m: 'blok', teks: 'Catatan hafal dari versi aplikasi lebih baru, jadi tidak ditampilkan di sini.', persen: 0 };
  const t = hfhLabel(pr); if (!t) return { m: '', teks: '', persen: 0 };
  return { m: pr.penuh ? 'penuh' : (pr.hafal > 0 ? 'jalan' : 'kosong'), teks: t, persen: pr.penuh ? 100 : Math.max(0, Math.min(99, pr.persen | 0)) };
}
function hfrProgIsi(x) {   // MURNI: { m, teks, persen } -> isi baris progres (teks yang dibacakan + bilah dekoratif); m kosong = teks kosong
  if (!x || !x.m) return '';
  return '<span class="hfr-prog-t" role="status">' + esc(x.teks) + '</span><span class="hfr-pb" aria-hidden="true"><i style="width:' + x.persen + '%"></i></span>';
}
function hfrProgHtml(pr, siap, blok) {   // MURNI: baris progres lengkap; surah tak sah (m kosong) = teks kosong
  const x = hfrProgTeks(pr, siap, blok); if (!x.m) return '';
  return '<div class="hfr-prog" id="hfrProg" data-m="' + x.m + '">' + hfrProgIsi(x) + '</div>';
}
function hfrProgKini() { return HFR.n ? hfrProgTeks(hfhProgres(HFN.ready ? HFN.data.hafal : null, HFR.n), HFN.ready, HFN.blocked) : { m: '', teks: '', persen: 0 }; }
{ const b = hfrHtml; hfrHtml = function () {   // baris progres tepat sesudah "arti · N ayat" di judul surah (hanya saat ayat sudah tampil)
  const x = b.apply(this, arguments); if (!(HFR.n && HFR.st === 'ok' && HFR.s)) return x;
  const p = hfrProgHtml(hfhProgres(HFN.ready ? HFN.data.hafal : null, HFR.n), HFN.ready, HFN.blocked); if (!p) return x;
  return x.replace(/(<p class="hfr-meta">[\s\S]*?<\/p>)(<\/div>)/, (m, a, c) => a + p + c);
}; }
function hfrProgApply() {   // perbarui baris progres di tempat (elemen yang sama, supaya bilah bergeser halus); tanpa kartu atau tanpa baris = diam
  const r = $('#hfrProg'); if (!r || !HFR.n) return;
  const x = hfrProgKini(); if (!x.m) { r.remove(); return; }
  r.setAttribute('data-m', x.m);
  const t = r.querySelector('.hfr-prog-t'), i = r.querySelector('.hfr-pb i');
  if (t && t.textContent !== x.teks) t.textContent = x.teks;
  if (i) i.style.width = x.persen + '%';
}
{ const b = hfrHfApply; hfrHfApply = function () { const v = b.apply(this, arguments); hfrProgApply(); return v; }; }   // satu titik sinkron: ketukan Hafal, muat selesai, buka surah
window.DL = Object.freeze(Object.assign({}, window.DL, { oth5c2d2a: Object.freeze({ teks: hfrProgTeks, isi: hfrProgIsi, html: hfrProgHtml, apply: hfrProgApply, kini: hfrProgKini }) }));
