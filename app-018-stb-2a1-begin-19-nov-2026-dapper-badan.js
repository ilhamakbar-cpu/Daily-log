/* ===== STB-1c-end ===== */
/* ===== STB-2a1-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2a-1: LOGIKA MURNI tempat simpan baru `dailylog:badan:v1` (undertone, kontras, lingkar bahu opsional, palet): penyaring stbSaveClean, penggabung stbSaveMerge, pengubah stbSaveSet. BELUM terpasang ke STORES, tanpa tampilan, penyimpanan, jaringan, atau acak. Waktu selalu masuk sebagai argumen. ===== */
const STB_SAVE = Object.freeze({ key: 'dailylog:badan:v1', v: 1, undertone: Object.freeze(['hangat', 'dingin', 'netral']), sumber: Object.freeze(['pilih', 'pembuluh', 'scan']), kontras: Object.freeze(['rendah', 'sedang', 'tinggi']), bahu: Object.freeze([70, 200]), paletMax: 12, uMax: 4102444800000, bagian: Object.freeze(['undertone', 'kontras', 'bahu', 'palet']) });   // bahu = lingkar bahu (cm), batas wajar pilihan penyusun; u = penanda waktu ubah (ms)
function stbSaveFz(o) { Object.freeze(o); Object.keys(o).forEach(k => { const v = o[k]; if (v && typeof v === 'object' && !Object.isFrozen(v)) stbSaveFz(v); }); return o; }
function stbSaveClean(raw) {   // MURNI: masukan apa pun -> { data, dibuang, catatan } beku; tidak melempar galat, tidak mengubah masukan, hasilnya selalu bentuk baku
  const isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const own = (o, k) => (isObj(o) && Object.prototype.hasOwnProperty.call(o, k)) ? o[k] : undefined;
  const isEmpty = v => v === undefined || v === null || v === '';
  const catatan = []; let dibuang = 0;
  const U = sec => { const x = own(sec, 'u'); if (typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= STB_SAVE.uMax) return x; if (!isEmpty(x) && catatan.indexOf('waktu_tidak_sah') < 0) catatan.push('waktu_tidak_sah'); return 0; };
  const en = (v, list) => { if (isEmpty(v)) return ''; if (typeof v === 'string' && list.indexOf(v) >= 0) return v; dibuang++; return ''; };
  const hex = v => { if (typeof v !== 'string') return null; const m = v.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/); if (!m) return null; let h = m[1].toLowerCase(); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return '#' + h; };
  const list = v => { if (isEmpty(v)) return []; if (!Array.isArray(v)) { dibuang++; return []; } const out = []; v.forEach(x => { const h = hex(x); if (h === null || out.indexOf(h) >= 0 || out.length >= STB_SAVE.paletMax) { dibuang++; return; } out.push(h); }); return out; };
  if (!isEmpty(raw) && !isObj(raw)) catatan.push('bukan_objek');
  const ver = own(raw, 'v'); if (typeof ver === 'number' && ver > STB_SAVE.v) catatan.push('versi_baru');
  const ut = own(raw, 'undertone'), kt = own(raw, 'kontras'), bh = own(raw, 'bahu'), pl = own(raw, 'palet');
  const un = en(own(ut, 'n'), STB_SAVE.undertone), us = un ? en(own(ut, 's'), STB_SAVE.sumber) : '';
  const kn = en(own(kt, 'n'), STB_SAVE.kontras);
  let cm = null; const cRaw = own(bh, 'cm');
  if (!isEmpty(cRaw)) { const n = (typeof cRaw === 'string' || typeof cRaw === 'number') ? parseFloat(String(cRaw).replace(',', '.')) : NaN; if (Number.isFinite(n) && n >= STB_SAVE.bahu[0] && n <= STB_SAVE.bahu[1]) cm = Math.round(n * 10) / 10; else dibuang++; }
  const suka = list(own(pl, 'suka')); let hindari = list(own(pl, 'hindari'));
  const sebelum = hindari.length; hindari = hindari.filter(h => suka.indexOf(h) < 0); dibuang += sebelum - hindari.length;
  const data = { v: STB_SAVE.v, undertone: { n: un, s: us, u: U(ut) }, kontras: { n: kn, u: U(kt) }, bahu: { cm, u: U(bh) }, palet: { suka, hindari, u: U(pl) } };
  return stbSaveFz({ data, dibuang, catatan });
}
function stbSaveFilled(k, s) { return k === 'undertone' || k === 'kontras' ? !!s.n : k === 'bahu' ? s.cm !== null : (s.suka.length + s.hindari.length) > 0; }
function stbSaveMerge(a, b) {   // MURNI: dua isi (apa pun) -> data beku; tiap bagian: u lebih besar menang; u sama: bagian berisi menang atas yang kosong; masih sama: teks JSON lebih kecil menang (hasil tidak bergantung urutan a dan b)
  const A = stbSaveClean(a).data, B = stbSaveClean(b).data, out = { v: STB_SAVE.v };
  STB_SAVE.bagian.forEach(k => {
    const x = A[k], y = B[k];
    if (x.u !== y.u) out[k] = x.u > y.u ? x : y;
    else if (stbSaveFilled(k, x) !== stbSaveFilled(k, y)) out[k] = stbSaveFilled(k, x) ? x : y;
    else out[k] = JSON.stringify(x) <= JSON.stringify(y) ? x : y;
  });
  return stbSaveFz(out);
}
function stbSaveSet(cur, bagian, isi, now) {   // MURNI: ganti SATU bagian utuh; u = max(now, u lama + 1) supaya selalu maju; isi tidak sah (ada yang dibuang), bagian tak dikenal, atau now tak sah = data lama tanpa perubahan ({ ok: false, kode })
  const c = stbSaveClean(cur).data, no = kode => stbSaveFz({ ok: false, kode, data: c });
  if (STB_SAVE.bagian.indexOf(bagian) < 0) return no('bagian');
  if (!(typeof now === 'number' && Number.isInteger(now) && now >= 0 && now <= STB_SAVE.uMax)) return no('waktu');
  if (!isi || typeof isi !== 'object' || Array.isArray(isi)) return no('isi');
  const raw = JSON.parse(JSON.stringify(c)); raw[bagian] = Object.assign({}, isi, { u: Math.min(STB_SAVE.uMax, Math.max(now, c[bagian].u + 1)) });
  const r = stbSaveClean(raw); if (r.dibuang > 0) return no('isi');
  return stbSaveFz({ ok: true, kode: 'ok', data: r.data });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2a1: Object.freeze({ lim: STB_SAVE, clean: stbSaveClean, merge: stbSaveMerge, set: stbSaveSet }) }));
/* ===== STB-2a1-end ===== */
/* ===== STB-2a2-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2a-2: PASANG tempat simpan `dailylog:badan:v1` ke aplikasi: STORES.badan (muat lewat store.load, simpan lewat antrean simpan yang ada), DL.stb2a2 untuk baca/ubah. Catatan `versi_baru` = TIDAK menimpa. Ikut "Hapus semua data". BELUM ada tampilan; BELUM ikut ekspor/impor JSON (STB-2a-3). Membalik: hapus blok ini. ===== */
const SBS = { ready: false, loading: false, p: null, gen: 0, blocked: false, catatan: [], data: stbSaveClean(null).data };   // gen naik tiap "Hapus semua data": hasil muat yang datang terlambat dibuang
STORES.badan = { key: STB_SAVE.key, get: () => SBS.data }; dirty.badan = false;   // khusus perangkat sampai STB-2a-3 (ekspor/impor)
function sbsFail(kode) { return stbSaveFz({ ok: false, kode, data: SBS.data }); }
function sbsLoad0() {
  const g = SBS.gen; SBS.loading = true;
  const lama = new Promise(r => setTimeout(() => r(undefined), 4000));
  return Promise.race([store.load(STB_SAVE.key), lama]).then(raw => {
    if (g !== SBS.gen) return;   // dihapus selagi memuat
    if (raw === undefined) { SBS.p = null; return; }   // waktu habis: BELUM siap (bukan dianggap kosong, supaya data tersimpan tidak tertimpa); dicoba lagi pada pemanggilan berikutnya
    const r = stbSaveClean(raw); SBS.data = r.data; SBS.catatan = r.catatan.slice(); SBS.blocked = r.catatan.indexOf('versi_baru') >= 0; SBS.ready = true;
  }).catch(() => { if (g === SBS.gen) SBS.p = null; }).then(() => { if (g === SBS.gen) SBS.loading = false; });
}
function sbsLoad() { if (!SBS.p) SBS.p = sbsLoad0(); return SBS.p; }
function sbsSave() { dirty.badan = true; queueSave('badan'); }
async function sbsPut(bagian, isi) {   // -> { ok, kode, data } beku; menulis HANYA bila ok; kode: ok | bagian | waktu | isi | belum_siap | versi_baru
  await sbsLoad();
  if (!SBS.ready) return sbsFail('belum_siap');
  if (SBS.blocked) return sbsFail('versi_baru');   // catatan dari versi lebih baru: dibaca saja, tidak ditimpa
  const r = stbSaveSet(SBS.data, bagian, isi, Date.now());
  if (r.ok) { SBS.data = r.data; sbsSave(); }
  return r;
}
function sbsState() { const d = SBS.data; return Object.freeze({ ready: SBS.ready, loading: SBS.loading, blocked: SBS.blocked, dirty: dirty.badan, catatan: SBS.catatan.slice(), u: Math.max(d.undertone.u, d.kontras.u, d.bahu.u, d.palet.u), isi: STB_SAVE.bagian.filter(k => stbSaveFilled(k, d[k])) }); }
function sbsWipe() { SBS.gen++; SBS.data = stbSaveClean(null).data; SBS.blocked = false; SBS.catatan = []; SBS.ready = true; SBS.loading = false; SBS.p = Promise.resolve(); }   // dipanggil "Hapus semua data": sesudahnya flush menulis catatan kosong
{ const baseSbsWipe = odWipe; odWipe = function () { sbsWipe(); return baseSbsWipe.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2a2: Object.freeze({ load: sbsLoad, get: () => SBS.data, put: sbsPut, state: sbsState }) }));
/* ===== STB-2a2-end ===== */
/* ===== STB-2a3a-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2a-3a: LOGIKA MURNI ekspor/impor tempat simpan Badan: stbSnap (salinan untuk cadangan `extra.badan`, null bila belum pernah disentuh) dan stbMergeIn (gabung isi cadangan ke data lokal per BAGIAN lewat stbSaveMerge + hitungan baru/diperbarui/sama/tak sah). BELUM terpasang ke jalur cadangan (itu STB-2a-3b); tanpa penyimpanan, jaringan, waktu, atau acak. ===== */
function stbTouched(k, s) { return s.u > 0 || stbSaveFilled(k, s); }   // bagian "pernah disentuh" = punya waktu ubah atau punya isi (isi tanpa u hanya bisa datang dari berkas luar)
function stbSnap(data) {   // MURNI: data apa pun -> salinan bersih beku untuk cadangan, atau null bila tidak ada bagian yang pernah disentuh; urutan kunci tetap (dua perangkat yang sama = teks yang sama)
  const d = stbSaveClean(data).data;
  if (!STB_SAVE.bagian.some(k => stbTouched(k, d[k]))) return null;
  return stbSaveFz(JSON.parse(JSON.stringify(d)));
}
function stbMergeIn(cur, raw) {   // MURNI: -> { data, add, upd, same, tak } beku; add = bagian yang di sini belum pernah disentuh lalu terisi dari cadangan; upd = bagian yang sudah ada diganti cadangan yang lebih baru; same = bagian di cadangan yang tidak mengubah apa pun; tak = isian cadangan yang dibuang karena tidak sah; bagian cadangan yang belum pernah disentuh diabaikan
  const c = stbSaveClean(cur).data, inc = stbSaveClean(raw), m = stbSaveMerge(c, inc.data), r = { add: 0, upd: 0, same: 0 };
  STB_SAVE.bagian.forEach(k => {
    const ch = JSON.stringify(m[k]) !== JSON.stringify(c[k]);
    if (ch) { if (stbTouched(k, c[k])) r.upd++; else r.add++; }
    else if (stbTouched(k, inc.data[k])) r.same++;
  });
  return stbSaveFz({ data: m, add: r.add, upd: r.upd, same: r.same, tak: inc.dibuang });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2a3a: Object.freeze({ snap: stbSnap, mergeIn: stbMergeIn }) }));
/* ===== STB-2a3a-end ===== */
/* ===== STB-2a3b-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2a-3b: PASANG tempat simpan Badan ke cadangan JSON dan impor (`extra.badan`): sbsSnapOut (salinan untuk ekspor; null bila catatan lokal dari versi lebih baru, supaya salinan yang sudah dipangkas tidak diekspor) dan exMergeBadan (dipanggil exMerge; apply=false hanya menghitung). Titik lama yang disambung: exReady, exEnsure, exSnap, exMerge, importReview, doImport. Versi cadangan tetap 4; cadangan tanpa `badan` tetap terbaca. Membalik: hapus blok ini dan kembalikan 7 sambungan bertanda STB-2a-3b. ===== */
function sbsSnapOut() { return SBS.blocked ? null : stbSnap(SBS.data); }
function exMergeBadan(src, r, apply) {   // dipanggil exMerge
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || !src.badan) return;
  if (SBS.blocked) { r.sbBlok = 1; return; }   // catatan lokal dari versi lebih baru: tidak ditimpa
  const m = stbMergeIn(SBS.data, src.badan), ch = m.add + m.upd;
  r.sbAdd = (r.sbAdd || 0) + m.add; r.sbUpd = (r.sbUpd || 0) + m.upd;
  if (ch) r.exAdded += ch; else r.exSame++;
  if (apply && ch) { SBS.data = m.data; sbsSave(); }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2a3b: Object.freeze({ snapOut: sbsSnapOut }) }));
/* ===== STB-2a3b-end ===== */
/* ===== STB-2b1-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2b-1: LOGIKA MURNI pilih undertone (hangat/dingin/netral) + ringkasan tes pembuluh darah. Menghasilkan isian { n, s } yang SIAP dipakai DL.stb2a2.put('undertone', ...) tetapi TIDAK menulis apa pun sendiri. Memakai ulang STK_COL_VEIN dan stkColorConfirm (STK-4a) supaya aturan tes pembuluh darah dan pencocokan dengan scan foto tidak ada dua versi. Pagar isi: panduan umum, tanpa nilai baik/buruk, tanpa skor; hasil bisa diganti kapan saja. BELUM ada tampilan, BELUM ada penyimpanan baru. ===== */
const STB_UT = Object.freeze({
  pilihan: Object.freeze(['hangat', 'dingin', 'netral']),
  sumberTeks: Object.freeze({ pilih: 'dipilih sendiri', pembuluh: 'tes pembuluh darah', scan: 'scan foto dan tes pembuluh darah' }),
  arti: Object.freeze({ hangat: 'Hangat: rona dasar kulit cenderung keemasan atau kekuningan.', dingin: 'Dingin: rona dasar kulit cenderung kemerahan atau kebiruan.', netral: 'Netral: rona dasar kulit berada di antara hangat dan dingin.' }),
  veinOpsi: Object.freeze([
    Object.freeze({ k: 'hijau', teks: 'Lebih terlihat hijau atau zaitun', n: 'hangat' }),
    Object.freeze({ k: 'biru_ungu', teks: 'Lebih terlihat biru atau ungu', n: 'dingin' }),
    Object.freeze({ k: 'campur', teks: 'Campuran, hijau dan biru sama kuat', n: 'netral' }),
    Object.freeze({ k: 'tidak_jelas', teks: 'Sulit dilihat', n: null })]),
  langkah: Object.freeze(['Cari cahaya jendela siang; jauhi lampu kuning atau lampu berwarna.', 'Lihat pembuluh di bagian dalam pergelangan tangan, tanpa krim atau riasan.', 'Pilih warna yang paling terlihat; kalau ragu, pilih "Sulit dilihat".']),
  catatan: 'Panduan umum: tes ini hanya petunjuk kasar, bukan ukuran pasti, dan hasilnya boleh kamu ganti kapan saja.',
  msg: Object.freeze({ pilihTak: 'Pilihan undertone harus hangat, dingin, atau netral.', tesTak: 'Pilihan tes pembuluh darah tidak dikenal.', belumJelas: 'Tes pembuluh darah belum jelas, jadi belum ada hasil. Coba lagi di cahaya jendela siang atau pilih sendiri.', scanTak: 'Hasil scan atau pilihan tes tidak bisa dibaca.', belum: 'Belum ada hasil yang cukup pasti untuk disimpan.' })
});
function stbUnderRes(ok, kode, n, s, dekat, msg) { return stbSaveFz({ ok: ok, kode: kode, n: ok ? n : null, s: ok ? s : '', dekat: dekat === true, msg: msg }); }
function stbUnderFromPick(n) {   // MURNI: pilihan langsung pemilik -> { ok, kode, n, s: 'pilih', dekat, msg }
  if (typeof n !== 'string' || STB_UT.pilihan.indexOf(n) < 0) return stbUnderRes(false, 'pilihan', null, '', false, STB_UT.msg.pilihTak);
  return stbUnderRes(true, 'ok', n, 'pilih', false, 'Undertone dipilih: ' + n + '.');
}
function stbUnderFromVein(vein) {   // MURNI: pilihan tes pembuluh darah (kunci STK_COL_VEIN) -> { ok, kode, n, s: 'pembuluh', dekat, msg }; "tidak_jelas" = belum ada hasil (kode belum_jelas)
  if (typeof vein !== 'string' || !Object.prototype.hasOwnProperty.call(STK_COL_VEIN, vein)) return stbUnderRes(false, 'tes', null, '', false, STB_UT.msg.tesTak);
  const n = STK_COL_VEIN[vein];
  if (n === null) return stbUnderRes(false, 'belum_jelas', null, '', false, STB_UT.msg.belumJelas);
  return stbUnderRes(true, 'ok', n, 'pembuluh', false, 'Tes pembuluh darah menunjuk ' + n + '.');
}
function stbUnderFromScan(res, vein) {   // MURNI: hasil scan Kamera (stkColorParse.result) + pilihan tes pembuluh darah -> hasil yang sama; sumber 'scan' HANYA bila foto dan tes sama; tes saja = 'pembuluh'; beda atau belum = tidak ok (tidak ada yang dipilih diam-diam)
  let c = null; try { c = stkColorConfirm(res, vein); } catch (e) { c = null; }
  if (!c || c.ok !== true) return stbUnderRes(false, 'scan_hasil', null, '', false, STB_UT.msg.scanTak);
  if (c.final === null || STB_UT.pilihan.indexOf(c.final) < 0) return stbUnderRes(false, c.status === 'beda' ? 'beda' : 'belum', null, '', c.dekat === true, String(c.msg || STB_UT.msg.belum));
  return stbUnderRes(true, 'ok', c.final, c.status === 'cocok' ? 'scan' : 'pembuluh', false, c.msg);
}
function stbUnderPayload(r) {   // MURNI: hasil di atas -> isian untuk put('undertone', ...) atau null bila tidak ok
  if (!r || typeof r !== 'object' || r.ok !== true || typeof r.n !== 'string' || STB_UT.pilihan.indexOf(r.n) < 0 || typeof r.s !== 'string' || STB_SAVE.sumber.indexOf(r.s) < 0) return null;
  return stbSaveFz({ n: r.n, s: r.s });
}
function stbUnderText(und) {   // MURNI: bagian undertone tersimpan (apa pun) -> { ada, n, s, teks, arti }
  const u = stbSaveClean({ undertone: und }).data.undertone;
  if (!u.n) return stbSaveFz({ ada: false, n: '', s: '', teks: 'Undertone belum dipilih.', arti: '' });
  const asal = u.s && STB_UT.sumberTeks[u.s] ? ' (' + STB_UT.sumberTeks[u.s] + ')' : '';
  return stbSaveFz({ ada: true, n: u.n, s: u.s, teks: 'Undertone kamu: ' + u.n + asal + '.', arti: STB_UT.arti[u.n] });
}
function stbUnderSummary(und, vein) {   // MURNI: tersimpan + pilihan tes pembuluh darah -> { tersimpan, tes, tesN, beda, msg }; TIDAK mengubah apa pun: yang tersimpan baru berganti bila pemilik menekan Simpan
  const t = stbUnderText(und), v = stbUnderFromVein(vein);
  const beda = t.ada && v.ok && v.n !== t.n;
  const msg = !v.ok ? v.msg : !t.ada ? 'Tes pembuluh darah menunjuk ' + v.n + '. Belum ada yang tersimpan.' : beda ? 'Tes pembuluh darah menunjuk ' + v.n + ', berbeda dari yang tersimpan (' + t.n + '). Yang tersimpan tidak berubah sampai kamu menyimpan.' : 'Tes pembuluh darah sama dengan yang tersimpan (' + t.n + ').';
  return stbSaveFz({ tersimpan: t.n, tes: v.ok ? v.s : '', tesN: v.ok ? v.n : '', beda: beda, msg: msg });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2b1: Object.freeze({ cfg: STB_UT, pick: stbUnderFromPick, vein: stbUnderFromVein, scan: stbUnderFromScan, payload: stbUnderPayload, text: stbUnderText, summary: stbUnderSummary }) }));
/* ===== STB-2b1-end ===== */
/* ===== STB-2b2-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2b-2: TAMPILAN kartu "Undertone kamu" di tab Badan: tiga tombol pilih (hangat/dingin/netral) + "Kosongkan"; simpan lewat DL.stb2a2.put('undertone', ...) (antrean simpan yang ada); catatan dari versi lebih baru = hanya baca. BELUM ada tes pembuluh darah di layar (STB-2b-3). Pagar isi: panduan umum, tanpa nilai baik/buruk, tanpa skor. Membalik: hapus blok ini (dan blok CSS STB-2b2-css). ===== */
const STB_UN = Object.freeze({
  judul: 'Undertone kamu',
  petunjuk: 'Pilih sendiri rona dasar kulitmu. Boleh kamu ganti kapan saja.',
  fine: 'Panduan umum: undertone hanya petunjuk kasar tentang rona dasar kulit, bukan ukuran pasti. Pilihan tersimpan di perangkat ini dan ikut dalam cadangan JSON. Tes pembuluh darah ada di kartu di bawah ini.',
  msg: Object.freeze({ memuat: 'Memuat catatan Badan...', tak_dimuat: 'Catatan Badan belum bisa dimuat. Buka tab ini lagi untuk mencoba ulang.', belum_siap: 'Catatan Badan belum selesai dimuat, jadi pilihan belum tersimpan. Coba lagi sebentar lagi.', versi_baru: 'Catatan Badan ini berasal dari versi aplikasi yang lebih baru, jadi di sini hanya bisa dibaca dan tidak diubah.', gagal: 'Pilihan belum tersimpan. Coba lagi.' }),
  soon: Object.freeze([['Tes pembuluh darah dan simpan dari scan foto', 'STB-2b-3'], ['Palet musiman dan aturan 60-30-10', 'STB-2c'], ['Virtual draping untuk mencoba warna', 'STB-2d']])
});
const SBU = { flash: '', busy: false };   // hanya memori: pesan terakhir dan penjaga klik ganda
function stbUnHtml(v) {   // MURNI: { ready, loading, blocked, und, flash } -> teks HTML kartu (tidak melempar galat, tidak mengakses dokumen/penyimpanan)
  let x = {}; try { if (v && typeof v === 'object') x = { ready: v.ready === true, loading: v.loading === true, blocked: v.blocked === true, und: v.und, flash: typeof v.flash === 'string' ? v.flash : '' }; } catch (e) { x = {}; }   // galat dari masukan (getter yang melempar) = dianggap kosong
  const ready = x.ready === true, blocked = ready && x.blocked === true;
  let t = null; try { t = stbUnderText(x.und); } catch (e) { t = stbUnderText(null); }
  let h = '<section class="nw-card stb-card" id="stbUnder" aria-label="' + esc(STB_UN.judul) + '"><div class="nw-hd"><h3>' + esc(STB_UN.judul) + '</h3></div>';
  if (!ready) return h + '<p class="stb-m" role="status">' + esc(x.loading === true ? STB_UN.msg.memuat : STB_UN.msg.tak_dimuat) + '</p></section>';
  h += '<p class="stb-m"><strong>' + esc(t.teks) + '</strong></p><p class="stb-n">' + esc(t.ada ? t.arti : STB_UN.petunjuk) + '</p>';
  h += '<div class="stb-act" role="group" aria-label="Pilih undertone">' + STB_UT.pilihan.map(n => '<button class="btn sm' + (t.n === n ? ' primary' : '') + '" data-q="stbUnPick" data-v="' + n + '" data-fk="stbun-' + n + '" aria-pressed="' + (t.n === n ? 'true' : 'false') + '"' + (blocked ? ' disabled' : '') + '>' + esc(n.charAt(0).toUpperCase() + n.slice(1)) + '</button>').join('') + (t.ada && !blocked ? '<button class="btn sm ghost" data-q="stbUnClear" data-fk="stbun-clear">Kosongkan</button>' : '') + '</div>';
  h += '<ul class="stb-fl">' + STB_UT.pilihan.map(n => '<li class="stb-fi"><span class="stb-ft">' + esc(STB_UT.arti[n]) + '</span></li>').join('') + '</ul>';
  if (blocked) h += '<p class="stb-n">' + esc(STB_UN.msg.versi_baru) + '</p>';
  h += '<p class="stb-n" id="stbUnMsg" role="status" aria-live="polite">' + esc(x.flash || '') + '</p>';
  return h + '<p class="nw-fine">' + esc(STB_UN.fine) + '</p></section>';
}
function stbUnFlash(res, okMsg) {   // MURNI: hasil put -> kalimat untuk pemilik; kode tak dikenal (termasuk nama bawaan objek) atau hasil yang rusak = pesan umum
  try {
    if (res && res.ok === true) return String(okMsg || '');
    const k = res && typeof res.kode === 'string' ? res.kode : '';
    return Object.prototype.hasOwnProperty.call(STB_UN.msg, k) && k !== 'memuat' && k !== 'tak_dimuat' ? STB_UN.msg[k] : STB_UN.msg.gagal;
  } catch (e) { return STB_UN.msg.gagal; }
}
function stbUnState() { const s = DL.stb2a2.state(), d = DL.stb2a2.get(); return { ready: s.ready, loading: s.loading, blocked: s.blocked, und: d.undertone, flash: SBU.flash }; }
function stbUnRender() {   // gambar ulang kartu di tempat; fokus tombol dipulihkan
  const old = $('#stbUnder'); if (!old) return;
  const ae = document.activeElement, fk = ae && old.contains(ae) && ae.dataset ? ae.dataset.fk : null, t = document.createElement('div');
  t.innerHTML = stbUnHtml(stbUnState()); old.replaceWith(t.firstElementChild);
  if (fk) { const el = $('#stbUnder [data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
function stbUnMount() {   // dipanggil SESUDAH stcMount: kartu masuk sebelum kartu Menyusul, yang daftarnya diperbarui
  const wrap = $('#nwDapperBody') && $('#nwDapperBody').querySelector('#stbWrap'); if (!wrap) return;
  const old = wrap.querySelector('#stbUnder'); if (old) old.remove();
  const t = document.createElement('div'); t.innerHTML = stbUnHtml(stbUnState()); const card = t.firstElementChild;
  const soon = wrap.querySelector('#stbSoon'), t2 = document.createElement('div');
  t2.innerHTML = '<section class="nw-card" id="stbSoon"><div class="nw-hd"><h3>Menyusul di tab ini</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + STB_UN.soon.map(x => '<li>' + esc(x[0]) + ' <span class="hr-tg">(' + esc(x[1]) + ')</span></li>').join('') + '</ul><p class="nw-fine">Tab Badan & warna dikerjakan bertahap, satu bagian per tahap.</p></section>';
  const ns = t2.firstElementChild;
  if (soon) { soon.replaceWith(ns); wrap.insertBefore(card, ns); } else { wrap.appendChild(card); wrap.appendChild(ns); }
  if (!DL.stb2a2.state().ready) DL.stb2a2.load().then(() => stbUnRender()).catch(() => { /* kartu tetap menampilkan pesan */ });
}
async function stbUnApply(isi, okMsg) {
  if (SBU.busy) return; SBU.busy = true;
  let res = null; try { res = await DL.stb2a2.put('undertone', isi); } catch (e) { res = { ok: false, kode: 'gagal' }; }
  SBU.busy = false; SBU.flash = stbUnFlash(res, okMsg); stbUnRender();
}
QACT.stbUnPick = (el) => {
  const r = stbUnderFromPick(el && el.dataset ? el.dataset.v : ''), p = stbUnderPayload(r);
  if (!p) { SBU.flash = r.msg; stbUnRender(); return; }
  stbUnApply(p, 'Undertone disimpan: ' + p.n + '.');
};
QACT.stbUnClear = () => { stbUnApply({ n: '', s: '' }, 'Undertone dikosongkan.'); };
{ const baseNwUn = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;
  baseNwUn.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'badan') { stbUnMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2b2: Object.freeze({ cfg: STB_UN, html: stbUnHtml, flash: stbUnFlash, mount: stbUnMount, render: stbUnRender, soon: STB_UN.soon }) }));
/* ===== STB-2b2-end ===== */
/* ===== STB-2b3a-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2b-3a: TAMPILAN kartu "Tes pembuluh darah" di tab Badan (tiga langkah + empat pilihan + ringkasan tes vs yang tersimpan). Pilihan tes HANYA hidup di memori halaman: TIDAK ada put, TIDAK ada kunci simpan baru; tombol simpan menyusul (STB-2b-3b). Memakai ulang STB_UT.langkah, STB_UT.veinOpsi, stbUnderFromVein dan stbUnderSummary (STB-2b-1). Pagar isi: panduan umum, tanpa nilai baik/buruk, tanpa skor. Membalik: hapus blok ini (dan blok CSS STB-2b3a-css). ===== */
const STB_VN = Object.freeze({
  judul: 'Tes pembuluh darah',
  petunjuk: 'Ikuti tiga langkah ini, lalu pilih warna pembuluh yang paling terlihat.',
  kosong: 'Belum ada pilihan tes.',
  hapus: 'Hapus pilihan tes',
  simpan: 'Simpan hasil tes',
  fine: 'Panduan umum: tes ini hanya petunjuk kasar. Pilihan tes baru tersimpan setelah kamu menekan Simpan hasil tes; kalau tidak, pilihan hilang saat aplikasi dimuat ulang.',
  soon: Object.freeze([['Virtual draping dengan AI untuk mencoba warna (menunggu AI semua halaman)', 'A1']])
});
const SBV = { pick: '', flash: '', fk: '' };   // hanya memori: pilihan tes dan pesan terakhir
function stbVnKey(k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(STK_COL_VEIN, k) ? k : ''; }   // MURNI: kunci tes sah atau ''
function stbVnHtml(v) {   // MURNI: { ready, und, vein, flash } -> teks HTML kartu (tidak melempar galat, tidak mengakses dokumen/penyimpanan)
  let x = {}; try { if (v && typeof v === 'object') x = { ready: v.ready === true, blocked: v.blocked === true, und: v.und, vein: stbVnKey(v.vein), flash: typeof v.flash === 'string' ? v.flash : '' }; } catch (e) { x = {}; }   // masukan yang melempar galat = dianggap kosong
  const vein = stbVnKey(x.vein), ready = x.ready === true;
  let m = STB_VN.kosong;
  if (vein) { try { m = ready ? stbUnderSummary(x.und, vein).msg : stbUnderFromVein(vein).msg; } catch (e) { m = STB_VN.kosong; } }   // belum siap = tidak mengaku soal yang tersimpan
  if (x.flash) m = x.flash;
  let h = '<section class="nw-card stb-card" id="stbVein" aria-label="' + esc(STB_VN.judul) + '"><div class="nw-hd"><h3>' + esc(STB_VN.judul) + '</h3></div><p class="stb-n">' + esc(STB_VN.petunjuk) + '</p>';
  h += '<ol class="stb-st">' + STB_UT.langkah.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
  h += '<div class="stb-vl" role="group" aria-label="Warna pembuluh yang paling terlihat">' + STB_UT.veinOpsi.map(o => '<button class="btn sm stb-vb' + (vein === o.k ? ' primary' : '') + '" data-q="stbVnPick" data-v="' + o.k + '" data-fk="stbvn-' + o.k + '" aria-pressed="' + (vein === o.k ? 'true' : 'false') + '">' + esc(o.teks) + '</button>').join('') + '</div>';
  h += '<p class="stb-m" id="stbVnMsg" role="status" aria-live="polite">' + esc(m) + '</p>';
  if (vein) {
    const can = ready && x.blocked !== true && vein !== 'tidak_jelas';   // simpan hanya bila ada hasil, catatan siap, dan bukan catatan versi baru
    h += '<div class="stb-act"><button class="btn sm primary" data-q="stbVnSave" data-fk="stbvn-save"' + (can ? '' : ' disabled') + '>' + esc(STB_VN.simpan) + '</button><button class="btn sm ghost" data-q="stbVnClear" data-fk="stbvn-clear">' + esc(STB_VN.hapus) + '</button></div>';
    if (!ready) h += '<p class="stb-n">' + esc(STB_UN.msg.belum_siap) + '</p>'; else if (x.blocked === true) h += '<p class="stb-n">' + esc(STB_UN.msg.versi_baru) + '</p>';
  }
  return h + '<p class="nw-fine">' + esc(STB_VN.fine) + '</p></section>';
}
function stbVnKeyU() { try { const u = DL.stb2a2.get().undertone; return u ? [u.n, u.s, u.u].join('|') : ''; } catch (e) { return ''; } }   // sidik undertone tersimpan: pesan hasil hanya berlaku selama sidik ini sama (tidak basi sesudah undertone berubah)
function stbVnState() { let r = { ready: false, blocked: false, und: null }; try { const s = DL.stb2a2.state(), d = DL.stb2a2.get(); r = { ready: s.ready === true, blocked: s.blocked === true, und: d.undertone }; } catch (e) { /* tetap belum siap */ } return { ready: r.ready, blocked: r.blocked, und: r.und, vein: SBV.pick, flash: SBV.fk === stbVnKeyU() ? SBV.flash : '' }; }
function stbVnRender() {   // gambar ulang kartu di tempat; fokus tombol dipulihkan
  const old = $('#stbVein'); if (!old) return;
  const ae = document.activeElement, fk = ae && old.contains(ae) && ae.dataset ? ae.dataset.fk : null, t = document.createElement('div');
  t.innerHTML = stbVnHtml(stbVnState()); old.replaceWith(t.firstElementChild);
  if (fk) { const el = $('#stbVein [data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
function stbVnSoonHtml() { return '<section class="nw-card" id="stbSoon"><div class="nw-hd"><h3>Menyusul di tab ini</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + STB_VN.soon.map(x => '<li>' + esc(x[0]) + ' <span class="hr-tg">(' + esc(x[1]) + ')</span></li>').join('') + '</ul><p class="nw-fine">Tab Badan & warna dikerjakan bertahap, satu bagian per tahap.</p></section>'; }
function stbVnMount() {   // dipanggil SESUDAH stbUnMount: kartu masuk sesudah kartu Undertone dan sebelum kartu Menyusul, yang daftarnya diperbarui
  const wrap = $('#nwDapperBody') && $('#nwDapperBody').querySelector('#stbWrap'); if (!wrap) return;
  const old = wrap.querySelector('#stbVein'); if (old) old.remove();
  const t = document.createElement('div'); t.innerHTML = stbVnHtml(stbVnState()); const card = t.firstElementChild;
  const un = wrap.querySelector('#stbUnder'), soon = wrap.querySelector('#stbSoon'), t2 = document.createElement('div'); t2.innerHTML = stbVnSoonHtml(); const ns = t2.firstElementChild;
  if (soon) soon.replaceWith(ns); else wrap.appendChild(ns);
  if (un) un.after(card); else wrap.insertBefore(card, ns);
}
QACT.stbVnPick = (el) => {
  const k = stbVnKey(el && el.dataset ? el.dataset.v : '');
  if (!k) { SBV.flash = STB_UT.msg.tesTak; SBV.fk = stbVnKeyU(); stbVnRender(); return; }
  SBV.pick = k; SBV.flash = ''; stbVnRender();
};
QACT.stbVnClear = () => { SBV.pick = ''; SBV.flash = ''; stbVnRender(); };
{ const baseUnR = stbUnRender; stbUnRender = function () { baseUnR.apply(this, arguments); stbVnRender(); }; }   // simpan/kosongkan undertone -> ringkasan tes vs tersimpan ikut diperbarui
{ const baseNwVn = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;
  baseNwVn.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'badan') { stbVnMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2b3a: Object.freeze({ cfg: STB_VN, html: stbVnHtml, key: stbVnKey, mount: stbVnMount, render: stbVnRender, soon: STB_VN.soon }) }));
/* ===== STB-2b3a-end ===== */
/* ===== STB-2b3b-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2b-3b: tombol "Simpan hasil tes" di kartu "Tes pembuluh darah": menyimpan hasil tes lewat DL.stb2a2.put('undertone', { n, s: 'pembuluh' }) (antrean simpan Badan yang sama dengan kartu Undertone, penjaga klik ganda SBU.busy yang sama). Tombol hanya aktif bila ada hasil (bukan "Sulit dilihat"), catatan Badan sudah siap, dan bukan catatan dari versi lebih baru. Hasil scan Kamera BELUM terhubung (STB-2b-3c). Membalik: hapus blok ini dan blok CSS STB-2b3b-css (kartu tes kembali ke 3a hanya bila baris 3a yang diubah juga dibalik). ===== */
async function stbVnApply(p) {   // p = isian sah dari stbUnderPayload; hasil put -> pesan di kartu tes; kartu Undertone dan kartu tes digambar ulang
  if (SBU.busy) return; SBU.busy = true;
  let res = null; try { res = await DL.stb2a2.put('undertone', p); } catch (e) { res = { ok: false, kode: 'gagal' }; }
  SBU.busy = false; SBU.flash = '';
  SBV.flash = stbUnFlash(res, 'Undertone disimpan dari tes pembuluh darah: ' + p.n + '.'); SBV.fk = stbVnKeyU();
  stbUnRender();
}
QACT.stbVnSave = () => {
  if (!SBV.pick) { SBV.flash = STB_VN.kosong; SBV.fk = stbVnKeyU(); stbVnRender(); return; }
  const r = stbUnderFromVein(SBV.pick), p = stbUnderPayload(r);
  if (!p) { SBV.flash = r.msg; SBV.fk = stbVnKeyU(); stbVnRender(); return; }
  stbVnApply(p);
};
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2b3b: Object.freeze({ apply: stbVnApply, save: QACT.stbVnSave, keyU: stbVnKeyU, state: stbVnState }) }));
/* ===== STB-2b3b-end ===== */
/* ===== STB-2b3c-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2b-3c: tombol "Simpan undertone ke tab Badan" di kotak Kamera "Cocokkan dengan tes pembuluh darah" (#stkVeinBox). Muncul HANYA bila hasil scan Wajah dan tes pembuluh darah di kotak itu SAMA (status cocok -> sumber 'scan'); beda, belum jelas, atau hanya tes = tidak ada tombol (tes saja disimpan lewat kartu tes di tab Badan). Menyimpan lewat DL.stb2a2.put('undertone', { n, s: 'scan' }) (antrean simpan Badan dan penjaga klik ganda SBU.busy yang SAMA dengan kartu Undertone). Tombol mati bila catatan Badan belum siap atau dari versi lebih baru. Membalik: hapus blok ini dan blok CSS STB-2b3c-css, lalu kembalikan butir STB-2b-3c di STB_VN.soon. ===== */
const SBK = { flash: '', fk: '', pn: '' };   // hanya memori: pesan simpan dari scan, sidik undertone tersimpan, dan undertone yang disimpan saat pesan dibuat
function stbScanPlan(h, vein, st) {   // MURNI: h = hasil Wajah (stkResultGet()) atau null; vein = kunci tes atau ''; st = { ready, blocked } -> { show, can, p, why }; show hanya bila foto dan tes SAMA
  const no = Object.freeze({ show: false, can: false, p: null, why: '' });
  try {
    if (!h || typeof h !== 'object' || Array.isArray(h) || h.mode !== 'wajah' || typeof vein !== 'string' || vein === '') return no;
    const r = stbUnderFromScan(h.warna, vein);
    if (!r || r.ok !== true || r.s !== 'scan') return no;
    const p = stbUnderPayload(r); if (!p) return no;
    const ready = !!st && st.ready === true, blocked = !!st && st.blocked === true;
    return Object.freeze({ show: true, can: ready && !blocked, p: p, why: !ready ? 'belum_siap' : blocked ? 'versi_baru' : '' });
  } catch (e) { return no; }
}
function stbScanRowHtml(pl, flash) {   // MURNI: rencana + pesan -> baris tombol (teks HTML) atau '' bila tidak ada tombol; tidak melempar galat
  try {
    if (!pl || pl.show !== true || !pl.p) return '';
    const m = typeof flash === 'string' && flash ? flash : 'Hasil ini bisa disimpan sebagai undertone kamu di tab Badan.';
    const why = pl.why === 'belum_siap' ? STB_UN.msg.belum_siap : pl.why === 'versi_baru' ? STB_UN.msg.versi_baru : '';
    return '<div class="stb-sc"><p class="stk-rs-p" id="stbScMsg" role="status" aria-live="polite">' + esc(m) + '</p><button type="button" class="btn primary stb-sc-btn" data-q="stbScanSave" data-fk="stb-sc-save"' + (pl.can === true ? '' : ' disabled') + '>Simpan undertone ke tab Badan</button>' + (why ? '<p class="stk-rs-n">' + esc(why) + '</p>' : '') + '</div>';
  } catch (e) { return ''; }
}
function stbScanNow() { const h = stkResultGet(); return stbScanPlan(h, stkVeinGet(), stbVnState()); }
{ const baseVbH = stkVeinBoxHtml; stkVeinBoxHtml = function () {   // baris tombol masuk di AKHIR kotak (sesudah catatan kecil lama, dengan garis pemisah); kotak kosong atau berbentuk tak dikenal tetap tak berubah
  const h = baseVbH.apply(this, arguments); if (!h) return h;
  let row = ''; try { const pl = stbScanNow(); row = stbScanRowHtml(pl, SBK.fk === stbVnKeyU() && pl.p && SBK.pn === pl.p.n ? SBK.flash : ''); } catch (e) { row = ''; }
  if (!row) return h;
  const i = h.lastIndexOf('</div>'); return i < 0 || i !== h.length - 6 ? h : h.slice(0, i) + row + h.slice(i);
}; }
{ const baseUnR3c = stbUnRender; stbUnRender = function () { baseUnR3c.apply(this, arguments); try { stkVeinUiSync(); } catch (e) { /* abaikan */ } }; }   // undertone berubah (dari jalan mana pun) -> kotak Kamera ikut diperbarui (pesan lama tidak basi)
QACT.stbScanSave = async function () {
  if (SBU.busy) return;
  const pl = stbScanNow();
  if (!pl.show) { SBK.flash = STB_UT.msg.scanTak; SBK.fk = stbVnKeyU(); SBK.pn = ''; try { stkVeinUiSync(); } catch (e) { /* abaikan */ } return; }
  if (!pl.can) { SBK.flash = pl.why === 'versi_baru' ? STB_UN.msg.versi_baru : STB_UN.msg.belum_siap; SBK.fk = stbVnKeyU(); SBK.pn = pl.p.n; try { stkVeinUiSync(); } catch (e) { /* abaikan */ } return; }
  SBU.busy = true;
  let res = null; try { res = await DL.stb2a2.put('undertone', pl.p); } catch (e) { res = { ok: false, kode: 'gagal' }; }
  SBU.busy = false; SBU.flash = '';
  SBK.flash = stbUnFlash(res, 'Undertone disimpan dari scan foto dan tes pembuluh darah: ' + pl.p.n + '.'); SBK.fk = stbVnKeyU(); SBK.pn = pl.p.n;
  stbUnRender(); try { stkVeinUiSync(); } catch (e) { /* abaikan */ }
  try { const b = $('#stkVeinBox [data-fk="stb-sc-save"]'); if (b && !b.disabled && b.focus) b.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
};
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2b3c: Object.freeze({ plan: stbScanPlan, row: stbScanRowHtml, save: QACT.stbScanSave, now: stbScanNow }) }));
/* ===== STB-2b3c-end ===== */
/* ===== STB-2c1-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2c-1: LOGIKA MURNI palet musiman + aturan 60-30-10. Masukan: undertone (hangat/dingin/netral) + kontras (rendah/sedang/tinggi) dari tempat simpan Badan -> kelompok warna (kerangka empat musim yang populer: Semi, Panas, Gugur, Dingin) + contoh susunan 60-30-10 (warna dasar, pendukung, aksen). Data statis (nama warna dan kode hex contoh) disusun penyusun dari beberapa panduan web yang dicek (daftar di STB_PAL.rujukan); kerangka ini panduan umum, BUKAN ukuran pasti atau fakta ilmiah, dan sumbernya tidak seragam. Kalimat selalu \"kecenderungan\", tanpa nilai baik/buruk dan tanpa skor. Tanpa tampilan, penyimpanan, jaringan, jam, atau acak; semua hasil beku. Membalik: hapus blok ini. ===== */
const STB_PAL = stbSaveFz({
  v: 1,
  msg: { belumUnd: 'Pilih undertone dulu di kartu Undertone, lalu kelompok warna bisa dicari.', undTak: 'Undertone harus hangat, dingin, atau netral.', konTak: 'Kontras harus rendah, sedang, atau tinggi.', saran: 'Pilih kontras untuk menyempitkan.', luas: 'cocok ke beberapa kelompok sekaligus, jadi kerangka ini belum bisa menyempitkan' },
  catatan: 'Panduan umum: kelompok musiman adalah cara populer mengelompokkan warna, bukan ukuran pasti atau fakta ilmiah. Warna lain tetap boleh kamu pakai, dan pilihanmu boleh diganti kapan saja.',
  catatanSumber: 'Sumber populer tidak seragam: ada yang menaruh Musim Semi di kontras tinggi, ada yang di kontras sedang. Pemetaan di sini penyederhanaan dari kerangka empat musim, bukan hasil analisis warna profesional.',
  peta: { hangat: { rendah: ['gugur'], sedang: ['semi', 'gugur'], tinggi: ['semi'] }, dingin: { rendah: ['panas'], sedang: ['panas', 'dingin'], tinggi: ['dingin'] }, netral: { rendah: ['panas', 'gugur'], sedang: [], tinggi: ['semi', 'dingin'] } },
  petaUnd: { hangat: ['semi', 'gugur'], dingin: ['panas', 'dingin'], netral: [] },
  aturan: {
    catatan: 'Pedoman kasar: persentase tidak harus persis, dan satu warna boleh dipakai di lebih dari satu bagian.',
    peran: [
      { k: 'dasar', pct: 60, nama: 'Warna dasar', bagian: 'Bagian terbesar dari tampilan: celana, rok, jas, atau mantel.' },
      { k: 'pendukung', pct: 30, nama: 'Warna pendukung', bagian: 'Pelengkap dasar: kemeja, sweter, atau blazer.' },
      { k: 'aksen', pct: 10, nama: 'Warna aksen', bagian: 'Sentuhan kecil: dasi, syal, tas, jam, atau perhiasan.' }]
  },
  musim: {
    semi: {
      id: 'semi', nama: 'Musim Semi', en: 'Spring', suhu: 'hangat', logam: 'emas',
      ringkas: 'Hangat, jernih, dan segar: warna berdasar kuning keemasan dengan kesan cerah.',
      dasar: [{ n: 'Gading', h: '#fff6e0' }, { n: 'Krem', h: '#f1dfb8' }, { n: 'Unta muda', h: '#c8a27a' }, { n: 'Cokelat hangat muda', h: '#94704d' }],
      pendukung: [{ n: 'Persik', h: '#ffb48f' }, { n: 'Mint hangat', h: '#94d9a8' }, { n: 'Turkuois hangat', h: '#36b5ad' }, { n: 'Kuning keemasan', h: '#f4c542' }],
      aksen: [{ n: 'Koral', h: '#ff6f5c' }, { n: 'Oranye cerah', h: '#ff8f1f' }, { n: 'Hijau rumput', h: '#5db13a' }, { n: 'Jingga merah', h: '#e8502e' }],
      contoh: [[3, 0, 0], [2, 2, 1], [1, 1, 3]]
    },
    panas: {
      id: 'panas', nama: 'Musim Panas', en: 'Summer', suhu: 'dingin', logam: 'perak',
      ringkas: 'Dingin, lembut, dan kalem: warna berdasar kebiruan yang tidak terlalu tajam.',
      dasar: [{ n: 'Putih lembut', h: '#f4f2f6' }, { n: 'Abu merpati', h: '#a8afb9' }, { n: 'Taupe dingin', h: '#9b9096' }, { n: 'Navy lembut', h: '#4d5b7c' }],
      pendukung: [{ n: 'Biru bubuk', h: '#aecbe9' }, { n: 'Lavender', h: '#c4b3e3' }, { n: 'Mawar berdebu', h: '#d9a3b3' }, { n: 'Teal lembut', h: '#6fa9a9' }],
      aksen: [{ n: 'Mauve', h: '#a56f8d' }, { n: 'Periwinkle', h: '#8d9ae0' }, { n: 'Plum', h: '#7a4a6b' }, { n: 'Merah muda dingin', h: '#de7fa8' }],
      contoh: [[3, 0, 0], [1, 1, 1], [2, 3, 3]]
    },
    gugur: {
      id: 'gugur', nama: 'Musim Gugur', en: 'Autumn', suhu: 'hangat', logam: 'emas',
      ringkas: 'Hangat, kaya, dan membumi: warna berdasar keemasan yang tidak terlalu tajam.',
      dasar: [{ n: 'Krem hangat', h: '#efe0c0' }, { n: 'Unta', h: '#b78a5c' }, { n: 'Cokelat tua', h: '#6f4a2c' }, { n: 'Zaitun tua', h: '#55552b' }],
      pendukung: [{ n: 'Terakota', h: '#c4623e' }, { n: 'Mustar', h: '#d6a21c' }, { n: 'Zaitun', h: '#7f7b32' }, { n: 'Hijau lumut', h: '#7a8a45' }],
      aksen: [{ n: 'Karat', h: '#b5410d' }, { n: 'Oranye terbakar', h: '#cc5a0a' }, { n: 'Hijau hutan', h: '#2f5e3b' }, { n: 'Emas tua', h: '#b8860b' }],
      contoh: [[2, 1, 1], [3, 0, 2], [1, 3, 0]]
    },
    dingin: {
      id: 'dingin', nama: 'Musim Dingin', en: 'Winter', suhu: 'dingin', logam: 'perak',
      ringkas: 'Dingin, tegas, dan jernih: warna berdasar kebiruan dengan kesan tajam dan kontras kuat.',
      dasar: [{ n: 'Hitam', h: '#121212' }, { n: 'Navy', h: '#15233f' }, { n: 'Abu arang', h: '#36454f' }, { n: 'Putih murni', h: '#ffffff' }],
      pendukung: [{ n: 'Biru royal', h: '#2a50d8' }, { n: 'Zamrud', h: '#0c8a5e' }, { n: 'Abu perak', h: '#bcc3cc' }, { n: 'Ungu tua', h: '#4b2a82' }],
      aksen: [{ n: 'Fuksia', h: '#d4246c' }, { n: 'Merah tegas', h: '#c8102e' }, { n: 'Biru es', h: '#bfe4f6' }, { n: 'Kuning lemon', h: '#f4f06c' }],
      contoh: [[2, 0, 0], [1, 2, 2], [0, 1, 1]]
    }
  },
  rujukan: [
    { t: 'Free People: dasar analisis warna (undertone, kontras, empat musim)', u: 'https://www.freepeople.com/fpmovement/color-analysis-blog/' },
    { t: 'Season Approved: apa itu analisis warna musiman', u: 'https://www.seasonapproved.com/guides/what-is-seasonal-color-analysis' },
    { t: 'Sterling Style Academy: analisis warna hangat (Semi dan Gugur)', u: 'https://sterlingstyleacademy.com/feeds/blog/warm-color-analysis' },
    { t: 'Season Approved: Warm Spring lawan Warm Autumn', u: 'https://seasonapproved.com/guides/warm-spring-vs-warm-autumn' },
    { t: 'Wardrobe: 12 musim sebagai perluasan empat musim', u: 'https://help.getwardrobe.com/latest/items/color-analysis/' },
    { t: 'THE VOU: aturan tiga warna 60-30-10', u: 'https://thevou.com/blog/3-color-rule-outfits/' },
    { t: 'Lookiero: aturan tiga warna 60-30-10 menurut musim', u: 'https://lookiero.co.uk/blog/3-colour-rule-fashion' },
    { t: 'Sterling Style Academy: kritik terhadap analisis warna musiman', u: 'https://online.sterlingstyleacademy.com/blog/why-seasonal-color-analysis-is-outdated-and-what-actually-works' }]
});
function stbPalHas(o, k) { return !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k); }
function stbPalEmpty(v) { return v === undefined || v === null || v === ''; }
function stbPalRes(ok, kode, und, kon, ids, teks) {   // hasil baku beku; saat gagal: kelompok kosong dan bukan "luas"
  const list = ok ? ids.slice() : [];
  return stbSaveFz({ ok: ok, kode: kode, und: und, kon: kon, kelompok: list, pasti: ok && list.length === 1, luas: ok && list.length === 0, teks: teks, catatan: STB_PAL.catatan });
}
function stbPalSeason(id) { return typeof id === 'string' && stbPalHas(STB_PAL.musim, id) ? STB_PAL.musim[id] : null; }   // MURNI: data satu musim (beku) atau null
function stbPalNames(ids) { return ids.map(i => STB_PAL.musim[i].nama + ' (' + STB_PAL.musim[i].en + ')').join(' atau '); }
function stbPalPick(und, kon) {   // MURNI: undertone + kontras (boleh kosong) -> kelompok warna yang cenderung cocok; tidak melempar galat
  if (stbPalEmpty(und)) return stbPalRes(false, 'belum_undertone', '', '', [], STB_PAL.msg.belumUnd);
  if (typeof und !== 'string' || STB_SAVE.undertone.indexOf(und) < 0) return stbPalRes(false, 'undertone', '', '', [], STB_PAL.msg.undTak);
  const adaKon = !stbPalEmpty(kon);
  if (adaKon && (typeof kon !== 'string' || STB_SAVE.kontras.indexOf(kon) < 0)) return stbPalRes(false, 'kontras', und, '', [], STB_PAL.msg.konTak);
  const ids = adaKon ? STB_PAL.peta[und][kon] : STB_PAL.petaUnd[und];
  let t;
  if (ids.length === 0) t = 'Undertone netral' + (adaKon ? ' dengan kontras ' + kon : '') + ' ' + STB_PAL.msg.luas + '.' + (adaKon ? '' : ' ' + STB_PAL.msg.saran);
  else t = 'Dari undertone ' + und + (adaKon ? ' dan kontras ' + kon : '') + ', kecenderungannya: ' + stbPalNames(ids) + '.' + (adaKon ? '' : ' ' + STB_PAL.msg.saran);
  return stbPalRes(true, adaKon ? 'ok' : 'undertone_saja', und, adaKon ? kon : '', ids, t);
}
function stbPalFromSave(raw) {   // MURNI: isi tempat simpan Badan (apa pun) -> stbPalPick dari undertone dan kontras yang sah; isi rusak = dianggap kosong
  let d; try { d = stbSaveClean(raw).data; } catch (e) { d = stbSaveClean(null).data; }
  return stbPalPick(d.undertone.n, d.kontras.n);
}
function stbPalCombos(id) {   // MURNI: tiga contoh susunan 60-30-10 untuk satu musim (tetap, tanpa acak) atau null
  const m = stbPalSeason(id); if (!m) return null;
  const P = STB_PAL.aturan.peran;
  return stbSaveFz(m.contoh.map(c => { const o = {}; ['dasar', 'pendukung', 'aksen'].forEach((k, i) => { const w = m[k][c[i]]; o[k] = { n: w.n, h: w.h, pct: P[i].pct }; }); return o; }));
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2c1: Object.freeze({ cfg: STB_PAL, pick: stbPalPick, save: stbPalFromSave, season: stbPalSeason, combos: stbPalCombos }) }));
/* ===== STB-2c1-end ===== */
/* ===== STB-2c2-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2c-2: TAMPILAN kartu "Kontras kamu" di tab Badan: tiga tombol pilih (rendah/sedang/tinggi) + "Kosongkan"; simpan lewat DL.stb2a2.put('kontras', { n }) (antrean simpan yang ada); catatan dari versi lebih baru = hanya baca. BELUM ada kartu palet (STB-2c-3). Pagar isi: panduan umum, tanpa nilai baik/buruk, tanpa skor, tanpa "kamu adalah". Membalik: hapus blok ini (dan blok CSS STB-2c2-css). ===== */
const STB_KN = Object.freeze({
  judul: 'Kontras kamu',
  petunjuk: 'Kontras = seberapa jauh beda terang-gelap antara kulit, rambut, dan matamu. Pilih yang paling mendekati. Boleh kamu ganti kapan saja.',
  arti: Object.freeze({ rendah: 'Rendah: kulit, rambut, dan mata terang-gelapnya berdekatan.', sedang: 'Sedang: ada beda terang-gelap yang cukup jelas, tidak tajam.', tinggi: 'Tinggi: beda terang-gelapnya tajam, misalnya rambut sangat gelap dengan kulit cerah.' }),
  fine: 'Panduan umum: kontras hanya petunjuk kasar dan semua pilihan setara. Pilihan tersimpan di perangkat ini dan ikut dalam cadangan JSON. Dipakai nanti untuk saran palet musiman.'
});
const SBKN = { flash: '', busy: false };   // hanya memori: pesan terakhir dan penjaga klik ganda
function stbKnText(n) {   // MURNI: nilai tersimpan -> { ada, n, teks, arti }; nilai di luar daftar = belum dipilih
  const ok = typeof n === 'string' && STB_SAVE.kontras.indexOf(n) >= 0;
  return Object.freeze({ ada: ok, n: ok ? n : '', teks: ok ? 'Kontras kamu: ' + n + '.' : 'Kontras belum dipilih.', arti: ok ? STB_KN.arti[n] : '' });
}
function stbKnHtml(v) {   // MURNI: { ready, loading, blocked, kon, flash } -> teks HTML kartu (tidak melempar galat, tidak mengakses dokumen/penyimpanan)
  let x = {}; try { if (v && typeof v === 'object') x = { ready: v.ready === true, loading: v.loading === true, blocked: v.blocked === true, kon: v.kon, flash: typeof v.flash === 'string' ? v.flash : '' }; } catch (e) { x = {}; }
  const ready = x.ready === true, blocked = ready && x.blocked === true;
  let t = null; try { t = stbKnText(x.kon); } catch (e) { t = stbKnText(null); }
  let h = '<section class="nw-card stb-card" id="stbKon" aria-label="' + esc(STB_KN.judul) + '"><div class="nw-hd"><h3>' + esc(STB_KN.judul) + '</h3></div>';
  if (!ready) return h + '<p class="stb-m" role="status">' + esc(x.loading === true ? STB_UN.msg.memuat : STB_UN.msg.tak_dimuat) + '</p></section>';
  h += '<p class="stb-m"><strong>' + esc(t.teks) + '</strong></p><p class="stb-n">' + esc(t.ada ? t.arti : STB_KN.petunjuk) + '</p>';
  h += '<div class="stb-act" role="group" aria-label="Pilih kontras">' + STB_SAVE.kontras.map(n => '<button class="btn sm' + (t.n === n ? ' primary' : '') + '" data-q="stbKnPick" data-v="' + n + '" data-fk="stbkn-' + n + '" aria-pressed="' + (t.n === n ? 'true' : 'false') + '"' + (blocked ? ' disabled' : '') + '>' + esc(n.charAt(0).toUpperCase() + n.slice(1)) + '</button>').join('') + (t.ada && !blocked ? '<button class="btn sm" data-q="stbKnClear" data-fk="stbkn-clear">Kosongkan</button>' : '') + '</div>';
  h += '<ul class="stb-fl">' + STB_SAVE.kontras.map(n => '<li class="stb-fi"><span class="stb-ft">' + esc(STB_KN.arti[n]) + '</span></li>').join('') + '</ul>';
  if (blocked) h += '<p class="stb-n">' + esc(STB_UN.msg.versi_baru) + '</p>';
  h += '<p class="stb-n" id="stbKnMsg" role="status" aria-live="polite">' + esc(x.flash || '') + '</p>';
  return h + '<p class="nw-fine">' + esc(STB_KN.fine) + '</p></section>';
}
function stbKnState() { const s = DL.stb2a2.state(), d = DL.stb2a2.get(); return { ready: s.ready, loading: s.loading, blocked: s.blocked, kon: d.kontras.n, flash: SBKN.flash }; }
function stbKnRender() {   // gambar ulang kartu di tempat; fokus tombol dipulihkan
  const old = $('#stbKon'); if (!old) return;
  const ae = document.activeElement, fk = ae && old.contains(ae) && ae.dataset ? ae.dataset.fk : null, t = document.createElement('div');
  t.innerHTML = stbKnHtml(stbKnState()); old.replaceWith(t.firstElementChild);
  if (fk) { const el = $('#stbKon [data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
function stbKnMount() {   // dipanggil SESUDAH stbVnMount: kartu masuk sesudah kartu Tes pembuluh darah dan sebelum kartu Menyusul
  const wrap = $('#nwDapperBody') && $('#nwDapperBody').querySelector('#stbWrap'); if (!wrap) return;
  const old = wrap.querySelector('#stbKon'); if (old) old.remove();
  const t = document.createElement('div'); t.innerHTML = stbKnHtml(stbKnState()); const card = t.firstElementChild;
  const soon = wrap.querySelector('#stbSoon'); if (soon) wrap.insertBefore(card, soon); else wrap.appendChild(card);
  if (!DL.stb2a2.state().ready) DL.stb2a2.load().then(() => stbKnRender()).catch(() => { /* kartu tetap menampilkan pesan */ });
}
async function stbKnApply(isi, okMsg) {
  if (SBKN.busy) return; SBKN.busy = true;
  let res = null; try { res = await DL.stb2a2.put('kontras', isi); } catch (e) { res = { ok: false, kode: 'gagal' }; }
  SBKN.busy = false; SBKN.flash = stbUnFlash(res, okMsg); stbKnRender();
}
QACT.stbKnPick = (el) => {
  const v = el && el.dataset ? el.dataset.v : '';
  if (typeof v !== 'string' || STB_SAVE.kontras.indexOf(v) < 0) { SBKN.flash = STB_UN.msg.gagal; stbKnRender(); return; }
  stbKnApply({ n: v }, 'Kontras disimpan: ' + v + '.');
};
QACT.stbKnClear = () => { stbKnApply({ n: '' }, 'Kontras dikosongkan.'); };
{ const baseNwKn = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;
  baseNwKn.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'badan') { stbKnMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2c2: Object.freeze({ cfg: STB_KN, text: stbKnText, html: stbKnHtml, mount: stbKnMount, render: stbKnRender }) }));
/* ===== STB-2c2-end ===== */
/* ===== STB-2c3-begin (19 Nov 2026): Dapper > Badan & warna, bagian 2c-3: TAMPILAN kartu "Palet musiman kamu" di tab Badan (HANYA BACA): dari undertone + kontras yang tersimpan (DL.stb2a2.get) -> kelompok musim lewat stbPalPick, lalu 12 warna contoh (dasar/pendukung/aksen), logam, tiga contoh susunan 60-30-10, catatan dan rujukan. Kartu menyala ulang tiap kartu Undertone atau Kontras menyimpan. Pilihan musim (bila lebih dari satu) hanya di memori halaman: TIDAK ada put, TIDAK ada kunci simpan baru. Pagar isi: panduan umum, tanpa skor, tanpa penilaian tubuh, tanpa "kamu adalah". Kelompok "luas" (netral + kontras sedang) = hanya kalimat "belum bisa menyempit" (keputusan sementara). Membalik: hapus blok ini (dan blok CSS STB-2c3-css). ===== */
const STB_PL = Object.freeze({
  judul: 'Palet musiman kamu',
  logam: 'Logam yang biasanya serasi: ',
  contoh: 'Contoh susunan 60-30-10',
  rujukan: 'Rujukan'
});
const SBP = { sel: '' };   // hanya memori: musim yang sedang dilihat
function stbPlHex(h) { return typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h) ? h : ''; }   // MURNI: kode hex sah atau ''
function stbPlGroup(pick, sel) {   // MURNI: (hasil stbPalPick, pilihan) -> id musim yang ditampilkan atau ''
  const ids = pick && pick.ok === true && Array.isArray(pick.kelompok) ? pick.kelompok : [];
  if (!ids.length) return '';
  return typeof sel === 'string' && ids.indexOf(sel) >= 0 ? sel : ids[0];
}
function stbPlHtml(v) {   // MURNI: { ready, loading, und, kon, sel, open } -> teks HTML kartu (tidak melempar galat, tidak mengakses dokumen/penyimpanan)
  let x = {}; try { if (v && typeof v === 'object') x = { ready: v.ready === true, loading: v.loading === true, und: v.und, kon: v.kon, sel: v.sel, open: v.open === true }; } catch (e) { x = {}; }
  let h = '<section class="nw-card stb-card" id="stbPal" aria-label="' + esc(STB_PL.judul) + '"><div class="nw-hd"><h3>' + esc(STB_PL.judul) + '</h3></div>';
  if (x.ready !== true) return h + '<p class="stb-m" role="status">' + esc(x.loading === true ? STB_UN.msg.memuat : STB_UN.msg.tak_dimuat) + '</p></section>';
  let pk = null; try { pk = stbPalPick(x.und, x.kon); } catch (e) { pk = stbPalPick(null, null); }
  h += '<p class="stb-m"><strong>' + esc(pk.teks) + '</strong></p>';
  const id = stbPlGroup(pk, x.sel), m = id ? stbPalSeason(id) : null;
  if (!m) return h + '<p class="nw-fine">' + esc(STB_PAL.catatan) + '</p></section>';
  if (pk.kelompok.length > 1) h += '<div class="stb-act" role="group" aria-label="Pilih musim yang dilihat">' + pk.kelompok.map(k => { const s = stbPalSeason(k); return '<button class="btn sm' + (k === id ? ' primary' : '') + '" data-q="stbPlSel" data-v="' + esc(k) + '" data-fk="stbpl-' + esc(k) + '" aria-pressed="' + (k === id ? 'true' : 'false') + '">' + esc(s.nama) + '</button>'; }).join('') + '</div>';
  h += '<p class="stb-n">' + esc(m.ringkas) + '</p><p class="stb-n">' + esc(STB_PL.logam + m.logam + '.') + '</p>';
  const P = STB_PAL.aturan.peran;
  P.forEach(r => {
    h += '<p class="stb-h">' + esc(r.nama + ' (contoh)') + '</p><ul class="stb-fl">' + m[r.k].map(w => { const c = stbPlHex(w.h); return '<li class="stb-fi stb-pl-row">' + (c ? '<span class="stb-pl-chip" data-h="' + c + '" style="background:' + c + '" aria-hidden="true"></span>' : '') + '<span class="stb-ft">' + esc(w.n) + ' <span class="hr-tg">' + esc(c) + '</span></span></li>'; }).join('') + '</ul>';
  });
  const cb = stbPalCombos(id) || [];
  h += '<p class="stb-h">' + esc(STB_PL.contoh) + '</p><p class="stb-n">' + esc(STB_PAL.aturan.catatan) + '</p><ul class="stb-fl">' + cb.map((c, i) => '<li class="stb-fi"><div class="stb-pl-bar" role="img" aria-label="Contoh ' + (i + 1) + '">' + P.map(r => { const k = stbPlHex(c[r.k].h); return '<span style="flex:0 0 ' + r.pct + '%;background:' + (k || 'transparent') + '"></span>'; }).join('') + '</div><span class="stb-ft">' + P.map(r => esc(r.pct + '% ' + c[r.k].n)).join(' · ') + '</span></li>').join('') + '</ul>';
  h += '<details class="stb-pl-ref"' + (x.open ? ' open' : '') + '><summary>' + esc(STB_PL.rujukan) + '</summary><p class="stb-n">' + esc(STB_PAL.catatanSumber) + '</p><ul class="stb-fl">' + STB_PAL.rujukan.map(r => '<li class="stb-fi"><span class="stb-ft"><a href="' + esc(r.u) + '" target="_blank" rel="noopener noreferrer">' + esc(r.t) + '</a></span></li>').join('') + '</ul></details>';
  return h + '<p class="nw-fine">' + esc(STB_PAL.catatan) + '</p></section>';
}
function stbPlState() { const s = DL.stb2a2.state(), d = DL.stb2a2.get(), o = $('#stbPal .stb-pl-ref'); return { ready: s.ready, loading: s.loading, und: d.undertone.n, kon: d.kontras.n, sel: SBP.sel, open: !!(o && o.open) }; }
function stbPlRender() {   // gambar ulang kartu di tempat; fokus tombol dipulihkan
  const old = $('#stbPal'); if (!old) return;
  const ae = document.activeElement, fk = ae && old.contains(ae) && ae.dataset ? ae.dataset.fk : null, t = document.createElement('div');
  t.innerHTML = stbPlHtml(stbPlState()); old.replaceWith(t.firstElementChild);
  if (fk) { const el = $('#stbPal [data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
function stbPlMount() {   // dipanggil SESUDAH stbKnMount: kartu masuk sesudah kartu Kontras dan sebelum kartu Menyusul
  const wrap = $('#nwDapperBody') && $('#nwDapperBody').querySelector('#stbWrap'); if (!wrap) return;
  const old = wrap.querySelector('#stbPal'); if (old) old.remove();
  const t = document.createElement('div'); t.innerHTML = stbPlHtml(stbPlState()); const card = t.firstElementChild;
  const soon = wrap.querySelector('#stbSoon'); if (soon) wrap.insertBefore(card, soon); else wrap.appendChild(card);
  if (!DL.stb2a2.state().ready) DL.stb2a2.load().then(() => stbPlRender()).catch(() => { /* kartu tetap menampilkan pesan */ });
}
QACT.stbPlSel = (el) => { const v = el && el.dataset ? el.dataset.v : ''; if (typeof v === 'string' && stbPalSeason(v)) { SBP.sel = v; stbPlRender(); } };
{ const baseUn = stbUnRender; stbUnRender = function () { const r = baseUn.apply(this, arguments); try { stbPlRender(); } catch (e) { /* abaikan */ } return r; };
  const baseKn = stbKnRender; stbKnRender = function () { const r = baseKn.apply(this, arguments); try { stbPlRender(); } catch (e) { /* abaikan */ } return r; }; }
{ const baseNwPl = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;
  baseNwPl.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'badan') { stbPlMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb2c3: Object.freeze({ cfg: STB_PL, group: stbPlGroup, hex: stbPlHex, html: stbPlHtml, mount: stbPlMount, render: stbPlRender }) }));
/* ===== STB-2c3-end ===== */
/* ===== SNH-1a-begin (19 Nov 2026): Sinaps > Hari ini, bagian 1a: LOGIKA MURNI sesi latihan, ringkasan harian, streak, rekor, skor kelengkapan. Belum ada tampilan, penyimpanan, atau tombol. Membalik: hapus blok ini. ===== */
const SN_EX = Object.freeze([
  ['reaksi', 'Waktu reaksi', 'kecil', 'OTL-1'], ['digit', 'Rentang digit', 'besar', 'OTL-2'], ['stroop', 'Stroop', 'besar', 'OTL-3'],
  ['corsi', 'Corsi (balok)', 'besar', 'OTL-4'], ['nback', 'N-Back', 'besar', 'OTL-5'], ['hitung', 'Hitung cepat', 'besar', 'OTL-6']
].map(a => Object.freeze({ id: a[0], nama: a[1], lebih: a[2], tahap: a[3], siap: a[0] === 'reaksi' || a[0] === 'digit' || a[0] === 'stroop' || a[0] === 'corsi' || a[0] === 'nback' || a[0] === 'hitung' /* OTL-1c, OTL-2c, OTL-3c, OTL-4c, OTL-5c, OTL-6c: keenam latihan sudah punya tampilan dan penyimpanan */ })));
const SN_TARGET = 3, SN_MAX = 20000, SN_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const snExById = id => SN_EX.find(e => e.id === id) || null;
function snDayOk(k) {
  const m = typeof k === 'string' && SN_DAY.exec(k); if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return +m[1] >= 2000 && +m[1] <= 2200 && d.getUTCMonth() === +m[2] - 1;
}
function snAddDays(k, n) {
  const m = SN_DAY.exec(k), d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n));
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
function snClean(list) {
  const out = []; let buang = 0;
  (Array.isArray(list) ? list : []).forEach(s => {
    const ok = s && typeof s === 'object' && snExById(s.ex) && snDayOk(s.d) && typeof s.raw === 'number' && isFinite(s.raw) && s.raw >= 0 && s.raw <= SN_MAX;
    if (ok) out.push(Object.freeze({ ex: s.ex, d: s.d, raw: s.raw })); else buang++;
  });
  out.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return { sesi: Object.freeze(out), buang };
}
function snHari(sesi, d) {
  const ids = [], all = SN_EX.map(e => e.id); let n = 0;
  sesi.forEach(s => { if (s.d === d) { n++; ids.push(s.ex); } });
  return { d, n, selesai: all.filter(id => ids.indexOf(id) >= 0), belum: all.filter(id => ids.indexOf(id) < 0) };
}
function snStreak(sesi, today) {
  const days = []; sesi.forEach(s => { if (s.d <= today && days.indexOf(s.d) < 0) days.push(s.d); }); days.sort();
  let longest = 0, run = 0, prev = null;
  days.forEach(k => { run = prev !== null && snAddDays(prev, 1) === k ? run + 1 : 1; if (run > longest) longest = run; prev = k; });
  let now = 0, c = days.indexOf(today) >= 0 ? today : snAddDays(today, -1);
  while (days.indexOf(c) >= 0) { now++; c = snAddDays(c, -1); }
  return { now, longest };
}
function snRekor(sesi, id) {
  const e = snExById(id); if (!e) return null; let b = null;
  sesi.forEach(s => { if (s.ex !== id) return; if (b === null || (e.lebih === 'kecil' ? s.raw < b.raw : s.raw > b.raw)) b = { raw: s.raw, d: s.d }; });
  return b;
}
function snSkor(sesi, d, target) {
  const t = Number.isInteger(target) && target >= 1 && target <= SN_EX.length ? target : SN_TARGET, n = snHari(sesi, d).selesai.length;
  return { n, target: t, persen: Math.min(100, Math.round(100 * n / t)) };
}
function snRingkas(list, today, target) {
  if (!snDayOk(today)) throw new Error('tanggal hari ini tidak sah');
  const c = snClean(list), rekor = {}; SN_EX.forEach(e => { rekor[e.id] = snRekor(c.sesi, e.id); });
  return { today, buang: c.buang, total: c.sesi.length, hari: snHari(c.sesi, today), streak: snStreak(c.sesi, today), skor: snSkor(c.sesi, today, target), rekor };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { snh1a: Object.freeze({ ex: SN_EX, target: SN_TARGET, clean: snClean, ringkas: snRingkas, addDays: snAddDays, dayOk: snDayOk }) }));
/* ===== SNH-1a-end ===== */
/* ===== SNH-1b-begin (19 Nov 2026): Sinaps > Hari ini, bagian 1b: tempat simpan `dailylog:sinaps:v1` (daftar sesi latihan) = logika murni snsClean/snsAdd + pemasangan STORES.sinaps lewat antrean simpan yang ada (pola Badan STB-2a-2). Catatan `versi_baru` = TIDAK menimpa. Ikut "Hapus semua data". BELUM ada tampilan; BELUM ikut ekspor/impor JSON (1c). Maksimum 5000 sesi (yang tertua dibuang). Membalik: hapus blok ini. ===== */
const SNS_KEY = 'dailylog:sinaps:v1', SNS_V = 1, SNS_CAP = 5000, SNS_WAIT = 4000, SNS_UMAX = 4102444800000;
function snsClean(raw) {   // MURNI: masukan apa pun -> { data, buang, catatan } beku; tidak melempar galat, tidak mengubah masukan
  const o = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : null, catatan = [];
  if (raw !== null && raw !== undefined && !o) catatan.push('bukan_objek');
  if (o && typeof o.v === 'number' && o.v > SNS_V) catatan.push('versi_baru');
  const c = snClean(o ? o.sesi : null), sesi = c.sesi.slice(-SNS_CAP);
  const u = o && typeof o.u === 'number' && isFinite(o.u) && o.u >= 0 && o.u <= SNS_UMAX ? o.u : 0;
  return Object.freeze({ data: Object.freeze({ v: SNS_V, sesi: Object.freeze(sesi), u }), buang: c.buang + (c.sesi.length - sesi.length), catatan: Object.freeze(catatan) });
}
function snsAdd(cur, s, now) {   // MURNI: tambah SATU sesi; u = max(now, u lama + 1) supaya selalu maju; sesi tak sah atau now tak sah = data lama ({ ok: false, kode: isi | waktu })
  const fail = kode => Object.freeze({ ok: false, kode, data: cur });
  if (!(typeof now === 'number' && isFinite(now) && now >= 0 && now <= SNS_UMAX)) return fail('waktu');
  const c = snClean([s]); if (c.buang || c.sesi.length !== 1) return fail('isi');
  const sesi = snClean(cur.sesi.concat(c.sesi)).sesi.slice(-SNS_CAP);
  return Object.freeze({ ok: true, kode: 'ok', data: Object.freeze({ v: SNS_V, sesi: Object.freeze(sesi), u: Math.max(now, cur.u + 1) }) });
}
const SNS = { ready: false, loading: false, p: null, gen: 0, blocked: false, catatan: [], data: snsClean(null).data };   // gen naik tiap "Hapus semua data": hasil muat yang datang terlambat dibuang
STORES.sinaps = { key: SNS_KEY, get: () => SNS.data }; dirty.sinaps = false;   // khusus perangkat sampai 1c (ekspor/impor)
function snsLoad0() {
  const g = SNS.gen; SNS.loading = true;
  const lama = new Promise(r => setTimeout(() => r(undefined), SNS_WAIT));
  return Promise.race([store.load(SNS_KEY), lama]).then(raw => {
    if (g !== SNS.gen) return;
    if (raw === undefined) { SNS.p = null; return; }   // waktu habis: BELUM siap (bukan dianggap kosong, supaya data tersimpan tidak tertimpa); dicoba lagi pada pemanggilan berikutnya
    const r = snsClean(raw); SNS.data = r.data; SNS.catatan = r.catatan.slice(); SNS.blocked = r.catatan.indexOf('versi_baru') >= 0; SNS.ready = true;
  }).catch(() => { if (g === SNS.gen) SNS.p = null; }).then(() => { if (g === SNS.gen) SNS.loading = false; });
}
function snsLoad() { if (!SNS.p) SNS.p = snsLoad0(); return SNS.p; }
async function snsPut(s, now) {   // -> { ok, kode, data } beku; menulis HANYA bila ok; kode: ok | isi | waktu | belum_siap | versi_baru
  await snsLoad();
  const fail = kode => Object.freeze({ ok: false, kode, data: SNS.data });
  if (!SNS.ready) return fail('belum_siap');
  if (SNS.blocked) return fail('versi_baru');
  const r = snsAdd(SNS.data, s, now === undefined ? Date.now() : now);
  if (r.ok) { SNS.data = r.data; dirty.sinaps = true; queueSave('sinaps'); }
  return r;
}
function snsState() { return Object.freeze({ ready: SNS.ready, loading: SNS.loading, blocked: SNS.blocked, dirty: dirty.sinaps, catatan: SNS.catatan.slice(), total: SNS.data.sesi.length, u: SNS.data.u }); }
function snsWipe() { SNS.gen++; SNS.data = snsClean(null).data; SNS.blocked = false; SNS.catatan = []; SNS.ready = true; SNS.loading = false; SNS.p = Promise.resolve(); }   // dipanggil "Hapus semua data": sesudahnya flush menulis daftar kosong
{ const baseSnsWipe = odWipe; odWipe = function () { snsWipe(); return baseSnsWipe.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { snh1b: Object.freeze({ key: SNS_KEY, cap: SNS_CAP, clean: snsClean, add: snsAdd, load: snsLoad, get: () => SNS.data, put: snsPut, state: snsState }) }));
/* ===== SNH-1b-end ===== */
/* ===== SNH-1c-begin (19 Nov 2026): Sinaps > Hari ini, bagian 1c: sesi latihan IKUT cadangan JSON dan impor (`extra.sinaps`) dan jalur SINKRON yang sama (pola Badan STB-2a-3). snsSnap = salinan murni untuk cadangan (null bila tidak ada sesi); snsMergeIn = gabung MURNI per kelipatan (sesi yang sama persis dihitung per jumlah, dipakai jumlah terbanyak dari dua sisi, jadi impor dua kali = tidak ada perubahan dan tidak ada sesi hilang); exMergeSinaps dipanggil exMerge (apply=false hanya menghitung). Titik lama yang disambung: exReady, exEnsure, exSnap (3 baris), exMerge, importReview, doImport; bertanda SNH-1c. Versi cadangan tetap 4; cadangan tanpa `sinaps` tetap terbaca. Membalik: hapus blok ini dan kembalikan 8 sambungan bertanda SNH-1c. ===== */
const snsKey = s => s.ex + '|' + s.d + '|' + s.raw;
const snsCmp = (a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.ex < b.ex ? -1 : a.ex > b.ex ? 1 : a.raw - b.raw);
function snsCount(list) { const m = new Map(); list.forEach(s => { const k = snsKey(s), e = m.get(k); if (e) e.n++; else m.set(k, { n: 1, s }); }); return m; }
function snsSnap(data) {   // MURNI: data apa pun -> salinan bersih beku untuk cadangan, atau null bila tidak ada sesi; urutan tetap (dua perangkat yang sama = teks yang sama)
  const d = snsClean(data).data;
  if (!d.sesi.length) return null;
  return Object.freeze({ v: SNS_V, sesi: Object.freeze(d.sesi.map(s => Object.freeze({ ex: s.ex, d: s.d, raw: s.raw })).sort(snsCmp)), u: d.u });
}
function snsMergeIn(cur, raw) {   // MURNI: -> { data, add, same, tak, baru } beku; add = sesi yang ditambahkan ke sini; same = sesi cadangan yang sudah ada di sini; tak = isian cadangan yang dibuang karena tidak sah; baru = cadangan berasal dari versi lebih baru (sesi yang sah tetap dibaca); u = yang terbesar dari dua sisi
  const c = snsClean(cur).data, inc = snsClean(raw), lc = snsCount(c.sesi), ic = snsCount(inc.data.sesi), all = c.sesi.slice();
  let same = 0;
  ic.forEach((e, k) => { const have = (lc.get(k) || { n: 0 }).n; same += Math.min(e.n, have); for (let i = have; i < e.n; i++) all.push(e.s); });
  all.sort(snsCmp);
  const sesi = snClean(all).sesi.slice(-SNS_CAP), fc = snsCount(sesi); let add = 0;
  fc.forEach((e, k) => { const have = (lc.get(k) || { n: 0 }).n; if (e.n > have) add += e.n - have; });
  return Object.freeze({ data: Object.freeze({ v: SNS_V, sesi: Object.freeze(sesi), u: Math.max(c.u, inc.data.u) }), add, same, tak: inc.buang, baru: inc.catatan.indexOf('versi_baru') >= 0 });
}
function snsSnapOut() { return SNS.blocked ? null : snsSnap(SNS.data); }   // catatan lokal dari versi lebih baru: tidak diekspor (salinan yang sudah dipangkas)
function exMergeSinaps(src, r, apply) {   // dipanggil exMerge
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || !src.sinaps) return;
  if (SNS.blocked) { r.snBlok = 1; return; }   // catatan lokal dari versi lebih baru: tidak ditimpa
  const m = snsMergeIn(SNS.data, src.sinaps);
  r.snAdd = (r.snAdd || 0) + m.add; r.snTak = (r.snTak || 0) + m.tak;
  if (m.add) r.exAdded += m.add; else r.exSame++;
  if (apply && (m.add || m.data.u !== SNS.data.u)) { SNS.data = m.data; dirty.sinaps = true; queueSave('sinaps'); }   // u selalu ikut maju supaya dua perangkat konvergen walau isi sama
}
window.DL = Object.freeze(Object.assign({}, window.DL, { snh1c: Object.freeze({ snap: snsSnap, mergeIn: snsMergeIn, snapOut: snsSnapOut, exMerge: exMergeSinaps }) }));
/* ===== SNH-1c-end ===== */
/* ===== SNH-1d1-begin (19 Nov 2026): Sinaps > Hari ini, bagian 1d-1: PEMBANGUN HTML MURNI kartu "Sinaps hari ini" (keluaran snRingkas + snsState -> teks HTML). Hanya baca. Belum dipasang ke halaman (1d-2). Membalik: hapus blok ini. ===== */
const SNH_HARI = Object.freeze(['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
const SNH_BUL = Object.freeze(['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']);
const SNH_UNIT = Object.freeze({ reaksi: ' ms', digit: ' angka', stroop: ' jawaban', corsi: ' blok', nback: ' poin', hitung: ' jawaban' });   // satuan hanya untuk yang sudah jelas; satuan latihan lain ditetapkan di tahap latihannya (OTL-2 sampai OTL-6)
function snhTgl(k, lengkap) {   // 'YYYY-MM-DD' -> 'Kamis, 19 Nov' atau '19 Nov' (spasi TAK-TERPUTUS: tanggal tidak patah di layar sempit); tanggal tak sah = ''
  if (!snDayOk(k)) return '';
  const m = SN_DAY.exec(k), t = (+m[3]) + '\u00a0' + SNH_BUL[+m[2] - 1];
  return lengkap ? SNH_HARI[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] + ', ' + t : t;
}
function snhNum(x) { return String(Math.round(x * 100) / 100).replace('.', ','); }   // angka Indonesia: koma desimal
function snhRekTeks(e, b) { return b ? 'Rekor ' + snhNum(b.raw) + (SNH_UNIT[e.id] || '') + ' · ' + snhTgl(b.d) : null; }
function snhBodyHtml(r, st) {   // MURNI: tidak mengubah masukan, tidak melempar galat; r = keluaran snRingkas (atau null), st = keluaran snsState
  const head = '<section class="nw-card snh-card" id="snhBody" aria-label="Sinaps hari ini"><div class="nw-hd"><h3>Sinaps hari ini</h3></div>';
  const fine = '<p class="nw-fine">Kelengkapan = jumlah latihan berbeda yang kamu selesaikan hari ini dibagi targetnya. Itu ukuran kebiasaan berlatih, bukan ukuran kecerdasan atau kemampuan otak. Angka dihitung di perangkat kamu dari catatan sesi latihan.</p></section>';
  if (!st || !st.ready || !r) {
    if (st && st.loading && !st.ready) return head + '<p class="nw-p snh-m" role="status">Memuat catatan latihan…</p>' + fine;
    return head + '<p class="nw-p snh-m">Catatan latihan belum bisa dibaca dari penyimpanan perangkat, jadi angka tidak ditampilkan agar tidak menyesatkan.</p><div class="snh-act"><button class="btn sm" data-q="snhRetry" data-fk="snh-retry">Coba lagi</button></div>' + fine;
  }
  const sk = r.skor, h = r.hari, sr = r.streak, siap = SN_EX.some(e => e.siap);
  let x = head + '<p class="snh-date">' + esc(snhTgl(r.today, true)) + '</p>';
  if (st.blocked) x += '<p class="nw-p snh-n">Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Ditampilkan apa adanya dan tidak diubah.</p>';
  if (st.total === 0) x += '<p class="nw-p snh-m">Belum ada sesi latihan tercatat. ' + (siap ? 'Buka tab Latihan untuk memulai.' : 'Latihan pertama (' + esc(SN_EX[0].nama) + ') masih disiapkan, jadi semua angka di bawah masih nol.') + '</p>';
  x += '<div class="snh-skor"><div class="snh-skh"><span>Kelengkapan hari ini</span><b class="snh-pct">' + sk.persen + '%</b></div>' +
    '<div class="snh-bar" role="progressbar" aria-label="Kelengkapan latihan hari ini" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + sk.persen + '" aria-valuetext="' + sk.n + ' dari ' + sk.target + ' latihan berbeda"><i style="width:' + sk.persen + '%"></i></div>' +
    '<p class="snh-sub">' + sk.n + ' dari ' + sk.target + ' latihan berbeda hari ini</p></div>';
  const sub = sr.now === 0 ? 'belum ada rangkaian' : h.n > 0 ? 'termasuk hari ini' : 'tetap hidup sampai akhir hari ini';
  x += '<div class="snh-st"><div class="snh-t"><b class="snh-big snh-now">' + sr.now + '</b><span>hari beruntun</span><small>' + sub + '</small></div>' +
    '<div class="snh-t"><b class="snh-big snh-long">' + sr.longest + '</b><span>terpanjang</span><small>hari beruntun</small></div></div>';
  x += '<h4 class="snh-h">Latihan hari ini</h4><ul class="snh-l">' + SN_EX.map(e => {
    const done = h.selesai.indexOf(e.id) >= 0, rk = snhRekTeks(e, r.rekor[e.id]);
    const chip = done ? '<span class="snh-chip snh-ok">✓ Sudah</span>' : e.siap ? '<span class="snh-chip snh-no">Belum</span>' : '<span class="snh-chip snh-soon">Segera</span>';
    const rc = rk || (e.siap ? 'Belum ada rekor' : 'Belum tersedia · tahap ' + e.tahap);
    return '<li class="snh-r" data-ex="' + e.id + '"><span class="snh-rn">' + esc(e.nama) + '</span>' + chip + '<span class="snh-rc">' + esc(rc) + '</span></li>';
  }).join('') + '</ul>';
  x += '<div class="snh-act"><button class="btn sm" data-q="nwTab" data-p="sinaps" data-v="latihan" data-fk="snh-lat">Buka tab Latihan</button></div>';
  return x + fine;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { snh1d1: Object.freeze({ html: snhBodyHtml, tgl: snhTgl }) }));
/* ===== SNH-1d1-end ===== */
/* ===== SNH-1d2-begin (19 Nov 2026): Sinaps > Hari ini, bagian 1d-2: PEMASANGAN kartu "Sinaps hari ini" ke tab Hari ini (pembungkus nwRender, muat catatan dengan batas waktu, tombol "Coba lagi", hari baru saat aplikasi dibuka lagi). HANYA BACA: tidak menulis apa pun. Pembangun HTML = snhBodyHtml (1d-1). Membalik: hapus blok ini dan CSS SNH-1d2. ===== */
let snhLast = 0, snhW = false;   // snhLast = waktu terakhir kita mulai atau ikut menunggu pemuatan (ms); snhW = sudah ada penunggu; satu percobaan per 8 detik supaya kegagalan tidak berputar tanpa henti
function snhNow() {   // -> { r, st }; r = snRingkas dari sesi tersimpan menurut hari HP sekarang, atau null bila gagal dihitung; TIDAK melempar. Belum siap = pembangun (1d-1) yang menolak menampilkan angka, jadi tidak diperiksa dua kali di sini
  const st = snsState();
  try { return { r: snRingkas(SNS.data.sesi, today()), st }; } catch (e) { return { r: null, st }; }
}
function snhOn() { return curView === 'sinaps' && nwTab.sinaps === 'hari'; }
function snhKick() {   // ikut menunggu pemuatan catatan (kita yang memulai ATAU pemuatan latar exEnsure yang sedang berjalan); selesai = gambar ulang hanya bila tab Hari ini masih terbuka
  if (SNS.ready || snhW) return;
  if (!SNS.loading && Date.now() - snhLast < 8000) return;   // gagal barusan: tidak mengulang otomatis sebelum 8 detik
  snhLast = Date.now(); snhW = true;
  snsLoad().then(() => { snhW = false; if (snhOn()) nwRender('sinaps'); });   // snsLoad memakai janji yang sedang berjalan bila ada
}
function snhMount() {   // ganti kartu kerangka NW0 dengan kartu asli; -> elemen pembungkus, atau null bila tidak ada kartu
  const root = $('#nwSinapsBody'), card = root && root.querySelector('.nw-card'); if (!card) return null;
  const w = document.createElement('div'), n = snhNow(); w.id = 'snhWrap'; w.innerHTML = snhBodyHtml(n.r, n.st); card.replaceWith(w); return w;
}
QACT.snhRetry = () => { if (!SNS.ready && !SNS.loading && !snhW) snhLast = 0; snhKick(); if (snhOn()) nwRender('sinaps'); };
{ const baseNwSn = nwRender; nwRender = function (key) {
  const root = key === 'sinaps' ? $('#nwSinapsBody') : null, ae = document.activeElement, fk = root && ae && root.contains(ae) ? (ae.dataset && ae.dataset.fk) || (ae.id === 'snhBody' ? 'snh-card' : null) : null;   // fokus dipulihkan sesudah kartu diganti
  baseNwSn.apply(this, arguments);
  if (key === 'sinaps' && nwTab.sinaps === 'hari') {
    snhKick();
    const w = snhMount();
    if (w && fk) {   // fokus: tombol di dalam kartu kembali bila masih ada; tombol "Coba lagi" yang hilang (memuat) atau kartu yang diganti = fokus ke kartu baru
      const el = fk === 'snh-card' ? w.querySelector('#snhBody') : root.querySelector('[data-fk="' + fk + '"]'), t = el || (fk === 'snh-retry' ? w.querySelector('#snhBody') : null);
      if (t) { if (t.id === 'snhBody') t.setAttribute('tabindex', '-1'); try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
    }
  }
}; }
document.addEventListener('visibilitychange', () => { if (!document.hidden && snhOn()) nwRender('sinaps'); });   // lewat tengah malam: tanggal dan hitungan hari ikut baru
window.DL = Object.freeze(Object.assign({}, window.DL, { snh1d2: Object.freeze({ now: snhNow, mount: snhMount, kick: snhKick }) }));
/* ===== SNH-1d2-end ===== */
/* ===== SNH-1e-begin (19 Nov 2026): Sinaps, bagian 1e: kalimat kecil di kartu hero halaman Sinaps ("Halaman ini masih kerangka...") menjadi jujur sejak tab Hari ini jadi. Hanya halaman Sinaps; Outfit dan English tidak berubah. Membalik: hapus blok ini. ===== */
const SNH_HERO = 'Tab Hari ini sudah aktif; tab lain menyusul.';
{ const baseNwHero = nwRender; nwRender = function (key) {
  baseNwHero.apply(this, arguments);
  if (key === 'sinaps') { const f = $('#nwSinapsBody .nw-hero .nw-fine'); if (f) f.textContent = SNH_HERO; }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { snh1e: Object.freeze({ hero: SNH_HERO }) }));
/* ===== SNH-1e-end ===== */
/* ===== OTL-1a-begin (19 Nov 2026): Sinaps > Latihan > Waktu reaksi, bagian 1a: LOGIKA MURNI pengukuran (mesin keadaan dengan waktu yang DISUNTIKKAN, pembanding dengan rata-rata diri sendiri). Belum ada tampilan, tombol, atau penyimpanan; latihan Waktu reaksi tetap `siap: false` sampai bagian tampilannya terpasang. Memakai snClean/snDayOk/snAddDays dari SNH-1a. Membalik: hapus blok ini. ===== */
const OTR = Object.freeze({ n: 5, maxCoba: 10, minSah: 3, dini: 100, lapse: 500, batas: 2000, tungguMin: 1500, tungguMax: 4000, banding: 0.05, hariBanding: 14, minBanding: 3 });   // ms; dini = di bawah ini bukan reaksi (tebakan); lapse = reaksi lambat tapi sah; batas = lewat ini dianggap terlewat
const otrOk = x => typeof x === 'number' && isFinite(x) && x >= 0;
const otrSet = (s, p) => Object.freeze(Object.assign({}, s, p));
function otrBaru() { return Object.freeze({ fase: 'siap', coba: 0, rt: Object.freeze([]), dini: 0, lewat: 0, t0: null, tunggu: null, tOn: null, conf: false, last: null }); }
function otrTunggu(r) { const x = typeof r === 'number' && r >= 0 && r < 1 ? r : 0.5; return OTR.tungguMin + Math.floor(x * (OTR.tungguMax - OTR.tungguMin + 1)); }   // r acak [0,1) -> jeda bulat ms di [1500, 4000]; r tak sah = tengah
function otrSelesaiP(s) { return s.rt.length >= OTR.n || s.coba >= OTR.maxCoba; }
function otrMulaiCoba(s, rand, now) { return otrSet(s, { fase: 'tunggu', t0: now, tunggu: otrTunggu(rand), tOn: null, conf: false }); }
function otrMulai(s, rand, now) { return s.fase === 'siap' && otrOk(now) ? otrMulaiCoba(s, rand, now) : s; }
function otrLanjut(s, rand, now) {   // sesudah hasil/dini/lewat: percobaan berikut, atau 'selesai' bila 5 reaksi sah terkumpul atau 10 percobaan habis
  if (s.fase !== 'hasil' && s.fase !== 'dini' && s.fase !== 'lewat') return s;
  if (otrSelesaiP(s)) return otrSet(s, { fase: 'selesai' });
  return otrOk(now) ? otrMulaiCoba(s, rand, now) : s;
}
function otrLewat(s) { return otrSet(s, { fase: 'lewat', coba: s.coba + 1, lewat: s.lewat + 1, last: Object.freeze({ jenis: 'lewat' }) }); }
function otrDini(s) { return otrSet(s, { fase: 'dini', coba: s.coba + 1, dini: s.dini + 1, last: Object.freeze({ jenis: 'dini' }) }); }
function otrTick(s, now) {   // dipanggil berkala oleh tampilan: tunggu -> tampil bila jeda habis; tampil -> lewat bila lebih dari 2000 ms tanpa ketukan
  if (!otrOk(now)) return s;
  if (s.fase === 'tunggu' && now >= s.t0 + s.tunggu) s = otrSet(s, { fase: 'tampil', tOn: s.t0 + s.tunggu });
  if (s.fase === 'tampil' && now - s.tOn > OTR.batas) return otrLewat(s);
  return s;
}
function otrShown(s, now) { return s.fase === 'tampil' && !s.conf && otrOk(now) && now >= s.tOn ? otrSet(s, { tOn: now, conf: true }) : s; }   // waktu GAMBAR benar-benar tampil menggantikan waktu rencana (sekali saja)
function otrTap(s, now) {
  if (!otrOk(now)) return s;
  if (s.fase === 'tunggu') {
    if (now >= s.t0 + s.tunggu) s = otrSet(s, { fase: 'tampil', tOn: s.t0 + s.tunggu });   // rangsang seharusnya sudah tampil tetapi tik belum sempat jalan
    else return otrDini(s);   // ketukan sebelum rangsang = tebakan dini
  }
  if (s.fase !== 'tampil') return s;
  const rt = now - s.tOn;
  if (rt < OTR.dini) return otrDini(s);   // terlalu cepat untuk reaksi manusia: tebakan, tidak dihitung
  if (rt > OTR.batas) return otrLewat(s);
  const v = Math.round(rt);
  return otrSet(s, { fase: 'hasil', coba: s.coba + 1, rt: Object.freeze(s.rt.concat([v])), last: Object.freeze({ jenis: 'sah', rt: v, lapse: v >= OTR.lapse }) });
}
function otrMedian(a) { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length ? (b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2) : null; }
function otrRingkas(s) {   // MURNI; raw = median reaksi sah dibulatkan (bukan rata-rata: tahan terhadap satu reaksi yang sangat lambat); sesi sah bila >= 3 reaksi sah
  const a = s.rt, sah = a.length >= OTR.minSah, med = otrMedian(a);
  return Object.freeze({ selesai: s.fase === 'selesai', coba: s.coba, n: a.length, dini: s.dini, lewat: s.lewat, lapse: a.filter(v => v >= OTR.lapse).length, sah,
    median: med, rata: a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null, terbaik: a.length ? Math.min.apply(null, a) : null, terburuk: a.length ? Math.max.apply(null, a) : null,
    raw: sah ? Math.round(med) : null });
}
function otrKeSesi(s, d) {   // sesi untuk disimpan ({ ex, d, raw }) atau null bila belum selesai, tidak sah, atau tanggal tak sah
  const r = otrRingkas(s); if (!r.selesai || !r.sah || !snDayOk(d)) return null;
  return Object.freeze({ ex: 'reaksi', d, raw: r.raw });   // bentuk sama dengan keluaran snClean; raw <= 2000 jadi selalu di bawah SN_MAX
}
function otrBanding(raw, sesi, today) {   // bandingkan dengan median reaksi diri sendiri 14 hari terakhir (hari ini ikut); perlu >= 3 sesi; batas +-5%. Dipanggil SEBELUM sesi baru ditambahkan
  const kosong = n => Object.freeze({ kode: 'belum_cukup', n, basis: null, selisih: null, persen: null });
  if (!otrOk(raw) || !snDayOk(today)) return kosong(0);
  const awal = snAddDays(today, -(OTR.hariBanding - 1)), v = snClean(sesi).sesi.filter(x => x.ex === 'reaksi' && x.d >= awal && x.d <= today).map(x => x.raw), basis = otrMedian(v);
  if (v.length < OTR.minBanding || !(basis > 0)) return kosong(v.length);
  const sel = raw - basis, p = sel / basis, kode = p < -OTR.banding ? 'lebih_cepat' : p > OTR.banding ? 'lebih_lambat' : 'sekitar';
  return Object.freeze({ kode, n: v.length, basis: Math.round(basis), selisih: Math.round(sel), persen: Math.round(p * 1000) / 10 });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl1a: Object.freeze({ cfg: OTR, baru: otrBaru, mulai: otrMulai, tick: otrTick, shown: otrShown, tap: otrTap, lanjut: otrLanjut, ringkas: otrRingkas, keSesi: otrKeSesi, banding: otrBanding, tunggu: otrTunggu }) }));
/* ===== OTL-1a-end ===== */
/* ===== OTL-1b-begin (19 Nov 2026): Sinaps > Latihan > Waktu reaksi, bagian 1b: TAMPILAN (kotak ketuk besar, hitung percobaan, hasil per percobaan, ringkasan sesi, pembanding dengan diri sendiri). BELUM menyimpan (1c): hasil sesi hanya di memori dan hilang bila pindah tab; `SN_EX[0].siap` TETAP false. Pembangun HTML murni (otvHtml) + pengendali (rAF, ketukan lewat pointerdown/keyboard). Kartu kerangka \"Segera\" tab Latihan diganti lewat pembungkus nwRender. Membalik: hapus blok ini dan CSS OTL-1b. ===== */
const OTV_INTRO = 'Ketuk kotak secepatnya begitu warnanya berubah hijau. Satu sesi = 5 reaksi, sekitar 1 menit.';
const OTV_FINE = 'Latihan ini hanya mengukur dan melatih tugas ini sendiri, bukan bukti otak jadi lebih pintar. Waktu di layar sentuh sudah termasuk jeda layar dan sentuh perangkat (puluhan milidetik), jadi bandingkan hanya dengan dirimu sendiri di perangkat yang sama.';
const OTV_NOTE_LAYAR = 'Sesi dihentikan karena layar tersembunyi saat berjalan. Mulai lagi kapan saja.';
const otvMs = v => v + '\u00a0ms';
function otvBandingTeks(b) {   // MURNI: keluaran otrBanding (atau null bila catatan belum terbaca) -> kalimat
  if (!b) return 'Catatan latihan belum terbaca, jadi pembanding tidak ditampilkan.';
  if (b.kode === 'belum_cukup') return 'Belum ada pembanding: butuh minimal ' + OTR.minBanding + ' sesi dalam ' + OTR.hariBanding + ' hari terakhir (sekarang ' + b.n + ').';
  const p = snhNum(Math.abs(b.persen)) + '%', dari = ' dari median ' + OTR.hariBanding + ' harimu (' + otvMs(b.basis) + ').';
  return b.kode === 'lebih_cepat' ? 'Lebih cepat ' + p + dari : b.kode === 'lebih_lambat' ? 'Lebih lambat ' + p + dari : 'Sekitar biasanya: selisih ' + p + dari;
}
function otvProg(s, selesaiCoba) { return '<p class="otr-prog" aria-live="off">' + (selesaiCoba ? 'Percobaan ' + s.coba + ' selesai' : 'Percobaan ' + (s.coba + 1)) + ' · reaksi sah ' + s.rt.length + ' dari ' + OTR.n + '</p>'; }
function otvHtml(s, o) {   // MURNI: tidak mengubah masukan, tidak melempar galat; s = keadaan mesin (otrBaru ...), o = { ban, note } -> isi kartu (tanpa pembungkus)
  o = o || {};
  const hd = '<div class="nw-hd"><h3>Waktu reaksi</h3></div>', fine = '<p class="nw-fine">' + esc(OTV_FINE) + '</p>';
  const note = o.note ? '<p class="nw-p snh-n" role="status">' + esc(o.note) + '</p>' : '';
  const btn = (q, fk, t) => '<div class="snh-act"><button class="btn" data-q="' + q + '" data-fk="' + fk + '">' + esc(t) + '</button></div>';
  const f = s.fase;
  if (f === 'siap') return hd + note + '<p class="nw-p otr-p">' + esc(OTV_INTRO) + '</p>' + btn('otrGo', 'otr-go', 'Mulai sesi') + fine;
  if (f === 'tunggu') return hd + otvProg(s, false) + '<div class="otr-pad otr-wait" data-otrpad="1" role="button" tabindex="0" data-fk="otr-pad" aria-label="Tunggu sampai kotak berubah hijau. Jangan ketuk dulu."><b>Tunggu…</b><span>Jangan ketuk dulu</span></div>' + fine;
  if (f === 'tampil') return hd + otvProg(s, false) + '<div class="otr-pad otr-now" data-otrpad="1" role="button" tabindex="0" data-fk="otr-pad" aria-label="Ketuk sekarang"><b>KETUK!</b></div>' + fine;
  if (f === 'hasil' || f === 'dini' || f === 'lewat') {
    const L = s.last || {}, lagi = otrSelesaiP(s) ? 'Lihat hasil sesi' : 'Lanjut';
    const body = f === 'hasil' ? '<b class="otr-big">' + esc(otvMs(L.rt)) + '</b><span>' + (L.lapse ? 'Lambat (500 ms atau lebih), tetap dihitung.' : 'Reaksi sah, dihitung.') + '</span>'
      : f === 'dini' ? '<b class="otr-big">Terlalu cepat</b><span>Kamu mengetuk sebelum kotak hijau atau di bawah 100 ms. Tidak dihitung sebagai reaksi.</span>'
      : '<b class="otr-big">Terlewat</b><span>Tidak ada ketukan dalam 2 detik. Tidak dihitung sebagai reaksi.</span>';
    return hd + otvProg(s, true) + '<div class="otr-res" role="status">' + body + '</div>' + btn('otrNext', 'otr-next', lagi) + fine;
  }
  // selesai
  const r = otrRingkas(s);
  let x = hd + '<p class="otr-prog">Sesi selesai</p>';
  if (r.sah) {
    x += '<div class="otr-res"><span>Nilai sesi (median)</span><b class="otr-big">' + esc(otvMs(r.raw)) + '</b></div>' +
      '<div class="snh-st"><div class="snh-t"><b class="snh-big">' + esc(otvMs(r.terbaik)) + '</b><span>Terbaik</span></div><div class="snh-t"><b class="snh-big">' + esc(otvMs(r.terburuk)) + '</b><span>Terburuk</span></div></div>' +
      '<p class="nw-p otr-p">Reaksi sah ' + r.n + ' dari ' + OTR.n + ' · tebakan terlalu cepat ' + r.dini + ' · terlewat ' + r.lewat + ' · lambat (500 ms atau lebih) ' + r.lapse + '.</p>' +
      '<p class="nw-p otr-p">' + esc(otvBandingTeks(o.ban === undefined ? null : o.ban)) + '</p>';
  } else x += '<div class="otr-res"><b class="otr-big">Sesi belum sah</b><span>Hanya ' + r.n + ' reaksi sah; minimal ' + OTR.minSah + '. Coba lagi dengan mata tetap di kotak.</span></div>';
  return x + '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>' + btn('otrGo', 'otr-go', 'Ulangi sesi') + fine;
}
function otvListHtml() {   // MURNI: kartu \"Latihan berikutnya\" dari SN_EX (selain waktu reaksi), semua masih \"Segera\"
  return '<section class="nw-card otr-next" aria-label="Latihan berikutnya"><div class="nw-hd"><h3>Latihan berikutnya</h3></div><ul class="snh-l">' + SN_EX.filter(e => e.id !== 'reaksi').map(e =>
    '<li class="snh-r"><span class="snh-rn">' + esc(e.nama) + '</span><span class="snh-chip snh-soon">Segera</span><span class="snh-rc">Belum tersedia · tahap ' + esc(e.tahap) + '</span></li>').join('') + '</ul></section>';
}
/* OTL-1b-pure-end */
const OTV = { s: otrBaru(), raf: 0, note: null, tRes: 0 };   // s = keadaan sesi di memori (tidak disimpan); tRes = waktu hasil terakhir digambar (penjaga ketukan ganda pada tombol Lanjut)
const otvRun = s => s.fase === 'tunggu' || s.fase === 'tampil';
const otvOn = () => curView === 'sinaps' && nwTab.sinaps === 'latihan' && !document.hidden;
function otvStop() { if (OTV.raf) { cancelAnimationFrame(OTV.raf); OTV.raf = 0; } }
function otvBan() { try { const r = otrRingkas(OTV.s); return SNS.ready && r.sah ? otrBanding(r.raw, SNS.data.sesi, today()) : null; } catch (e) { return null; } }
function otvDraw() {   // gambar ulang isi kartu; fokus dipulihkan bila tadinya di dalam kartu
  const body = $('#otrBody'); if (!body) return;
  const ae = document.activeElement, had = !!(ae && body.contains(ae));
  body.innerHTML = otvHtml(OTV.s, { ban: OTV.s.fase === 'selesai' ? otvBan() : undefined, note: OTV.note });
  if (OTV.s.fase === 'hasil' || OTV.s.fase === 'dini' || OTV.s.fase === 'lewat') OTV.tRes = performance.now();
  if (had) { const t = body.querySelector('[data-otrpad]') || body.querySelector('.btn') || body; if (t === body) body.setAttribute('tabindex', '-1'); try { t.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
}
function otvLoop() {
  OTV.raf = 0;
  if (!otvOn()) { otvLeave(); return; }
  const s0 = OTV.s, s1 = otrTick(s0, performance.now());
  if (s1 !== s0) {
    OTV.s = s1; otvDraw();
    if (s1.fase === 'tampil') requestAnimationFrame(() => { OTV.s = otrShown(OTV.s, performance.now()); });   // bingkai berikutnya = rangsang sudah tergambar: itu waktu mulai yang dipakai
  }
  if (otvRun(OTV.s)) OTV.raf = requestAnimationFrame(otvLoop);
}
function otvLeave() { otvStop(); OTV.s = otrBaru(); OTV.note = null; }   // pindah tab atau halaman: sesi di memori dibuang (belum ada simpan)
function otvAbort(note) { otvStop(); OTV.s = otrBaru(); OTV.note = note || null; otvDraw(); }
function otvGo() { otvStop(); OTV.note = null; OTV.s = otrMulai(otrBaru(), Math.random(), performance.now()); otvDraw(); if (otvRun(OTV.s)) OTV.raf = requestAnimationFrame(otvLoop); }
function otvNext() {
  if (performance.now() - OTV.tRes < 350) return;   // ketukan ganda pada kotak tidak melompati hasil
  OTV.s = otrLanjut(OTV.s, Math.random(), performance.now()); otvDraw(); if (otvRun(OTV.s)) { otvStop(); OTV.raf = requestAnimationFrame(otvLoop); }
}
function otvTs(ev) { const n = performance.now(), t = ev && typeof ev.timeStamp === 'number' ? ev.timeStamp : NaN; return t > 0 && t <= n && n - t < 300 ? t : n; }   // waktu kejadian bila masuk akal, kalau tidak waktu sekarang
function otvTap(ev) {
  if (!otvRun(OTV.s)) return;
  OTV.s = otrTap(OTV.s, otvTs(ev)); otvStop(); otvDraw();
  if (otvRun(OTV.s)) OTV.raf = requestAnimationFrame(otvLoop);
}
function otvMount() {   // ganti kartu kerangka NW0 tab Latihan dengan kartu asli + daftar latihan berikutnya; TIDAK mereset sesi (gambar ulang karena sebab lain tidak memutus sesi)
  const root = $('#nwSinapsBody'), card = root && root.querySelector('.nw-card'); if (!card) return null;
  const w = document.createElement('div'); w.id = 'otrWrap'; w.innerHTML = '<section class="nw-card otr-card" id="otrBody" aria-label="Waktu reaksi"></section>' + otvListHtml();
  card.replaceWith(w); otvDraw(); snsLoad(); if (otvRun(OTV.s) && !OTV.raf) OTV.raf = requestAnimationFrame(otvLoop); return w;
}
QACT.otrGo = () => otvGo(); QACT.otrNext = () => otvNext();
document.addEventListener('pointerdown', ev => {
  const p = ev.target && ev.target.closest ? ev.target.closest('[data-otrpad]') : null;
  if (!p || ev.isPrimary === false || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
  ev.preventDefault(); otvTap(ev);
}, true);
document.addEventListener('keydown', ev => {
  const p = ev.target && ev.target.closest ? ev.target.closest('[data-otrpad]') : null;
  if (!p || (ev.key !== ' ' && ev.key !== 'Enter')) return;
  ev.preventDefault(); if (!ev.repeat) otvTap(ev);
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && otvRun(OTV.s)) otvAbort(OTV_NOTE_LAYAR); });
{ const baseNwOtv = nwRender; nwRender = function (key) {
  baseNwOtv.apply(this, arguments);
  if (key === 'sinaps') { if (nwTab.sinaps === 'latihan') otvMount(); else otvLeave(); }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl1b: Object.freeze({ html: otvHtml, list: otvListHtml, banTeks: otvBandingTeks, state: () => OTV.s, go: otvGo, next: otvNext, abort: otvAbort }) }));
/* ===== OTL-1b-end ===== */
/* ===== OTL-1c-begin (19 Nov 2026): Sinaps > Latihan > Waktu reaksi, bagian 1c: SIMPAN sesi lewat snsPut (kunci dailylog:sinaps:v1) saat sesi selesai dan sah; pembanding dihitung SEBELUM sesi baru masuk lalu dikunci; status simpan jujur (menyimpan, tersimpan, tidak sah, gagal + coba lagi). Pembungkus otvHtml, otvBan, otvNext (0 baris lama OTL-1b diubah). Membalik: hapus blok ini dan kembalikan `siap: a[0] === 'reaksi'` di SN_EX menjadi `siap: false`. ===== */
const OTV_BELUM_P = '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>';
const OTV_SV_KODE = Object.freeze({
  versi_baru: 'Tidak disimpan: catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru, jadi tidak ditimpa.',
  belum_siap: 'Belum tersimpan: catatan latihan di perangkat ini belum terbaca.',
  waktu: 'Belum tersimpan: jam perangkat tidak masuk akal.',
  isi: 'Tidak disimpan: sesi ini tidak lolos pemeriksaan data.',
  galat: 'Belum tersimpan: terjadi galat saat menulis.'
});
const OTV_SV_ULANG = Object.freeze({ belum_siap: 1, waktu: 1, galat: 1 });   // kode yang boleh dicoba lagi (versi_baru dan isi tidak akan berubah dengan mencoba lagi)
const otvHas = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const otvBolehUlang = k => typeof k === 'string' && otvHas(OTV_SV_ULANG, k);
function otvSimpanHtml(sv) {   // MURNI: status simpan -> paragraf status (+ tombol Coba simpan lagi bila boleh); sv kosong = masih menyimpan
  const st = sv && sv.st, p = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (st === 'ok') return p('Hasil sesi tersimpan di perangkat ini dan ikut cadangan JSON.');
  if (st === 'takSah') return p('Sesi belum sah, jadi tidak disimpan.');
  if (st === 'gagal') {
    const k = sv.kode, t = typeof k === 'string' && otvHas(OTV_SV_KODE, k) ? OTV_SV_KODE[k] : 'Belum tersimpan (' + String(k) + ').';
    return p(t) + (otvBolehUlang(k) ? '<div class="snh-act"><button class="btn" data-q="otrSave" data-fk="otr-save">Coba simpan lagi</button></div>' : '');
  }
  return p('Menyimpan hasil sesi…');
}
function otvPasangSimpan(h, sv) { return typeof h === 'string' && h.indexOf(OTV_BELUM_P) >= 0 ? h.replace(OTV_BELUM_P, () => otvSimpanHtml(sv)) : h; }   // MURNI: ganti kalimat lama "belum disimpan" dengan status simpan
const OTV_HTML0 = otvHtml;
function otvHtmlS(s, o, sv) { const h = OTV_HTML0(s, o); return s && s.fase === 'selesai' ? otvPasangSimpan(h, sv) : h; }   // MURNI
/* OTL-1c-pure-end */
OTV.sv = null;   // { s: keadaan selesai yang disimpan, ses: { ex, d, raw } atau null, ban: pembanding terkunci, st: menyimpan | ok | gagal | takSah, kode }
otvHtml = function (s, o) { return otvHtmlS(s, o, o && o.sv !== undefined ? o.sv : (OTV.sv && OTV.sv.s === s ? OTV.sv : null)); };
const OTV_BAN0 = otvBan;
otvBan = function () { const v = OTV.sv; return v && v.s === OTV.s ? v.ban : OTV_BAN0(); };   // sesudah sesi selesai pembanding TERKUNCI (tidak ikut menghitung sesi yang baru disimpan)
function otvSimpan(v) {
  v.st = 'menyimpan'; v.kode = '';
  let p; try { p = snsPut(v.ses, Date.now()); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(r => { v.st = r && r.ok ? 'ok' : 'gagal'; v.kode = r && r.ok ? '' : ((r && r.kode) || 'galat'); }, () => { v.st = 'gagal'; v.kode = 'galat'; })
    .then(() => { if (OTV.sv === v && OTV.s === v.s) otvDraw(); });
}
function otvFinish() {   // dipanggil sekali per sesi yang selesai (penjaga: keadaan yang sama tidak disimpan dua kali)
  const s = OTV.s; if (s.fase !== 'selesai' || (OTV.sv && OTV.sv.s === s)) return;
  const ses = otrKeSesi(s, today()), v = { s, ses, ban: OTV_BAN0(), st: ses ? 'menyimpan' : 'takSah', kode: '' };
  OTV.sv = v; otvDraw(); if (ses) otvSimpan(v);
}
function otvUlang() { const v = OTV.sv; if (!v || v.s !== OTV.s || v.st !== 'gagal' || !v.ses || !otvBolehUlang(v.kode)) return; otvSimpan(v); otvDraw(); }
{ const baseNext1c = otvNext; otvNext = function () { const s0 = OTV.s; baseNext1c.apply(this, arguments); if (OTV.s !== s0 && OTV.s.fase === 'selesai') otvFinish(); }; }
QACT.otrSave = () => otvUlang();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl1c: Object.freeze({ simpanHtml: otvSimpanHtml, pasang: otvPasangSimpan, htmlS: otvHtmlS, html: otvHtml, boleh: otvBolehUlang, sv: () => OTV.sv ? { st: OTV.sv.st, kode: OTV.sv.kode, ban: OTV.sv.ban, ses: OTV.sv.ses } : null, finish: otvFinish, ulang: otvUlang, next: otvNext }) }));
/* ===== OTL-1c-end ===== */
/* ===== OTL-1d-begin (20 Nov 2026): Sinaps > Latihan > Waktu reaksi, bagian 1d-1: LOGIKA MURNI riwayat (rekor, sesi terakhir, tren 7 hari vs 7 hari sebelumnya, titik harian 14 hari, geometri grafik). Belum ada tampilan; tidak mengubah baris lama. Memakai snClean/snDayOk/snAddDays (SNH-1a) dan otrMedian (OTL-1a). Membalik: hapus blok ini. ===== */
const ORW = Object.freeze({ hari: 14, tren: 7, minTren: 3, banding: 0.05, terakhir: 5 });   // hari = lebar jendela grafik (hari terakhir, hari ini ikut); tren = lebar tiap dua jendela pembanding; minTren = sesi minimal di tiap jendela
const orwTren0 = Object.freeze({ kode: 'belum_cukup', n1: 0, n2: 0, kini: null, basis: null, selisih: null, persen: null });
const orwKosong = Object.freeze({ total: 0, masaDepan: 0, hari: 0, rekor: null, terakhir: null, daftar: Object.freeze([]), titik: Object.freeze([]), tren: orwTren0 });
function otrRiwayat(list, today) {   // MURNI, tidak melempar galat: daftar sesi mentah + tanggal hari ini -> ringkasan riwayat Waktu reaksi (sesi tanggal masa depan tidak dihitung, hanya dicacah)
  if (!snDayOk(today)) return orwKosong;
  const all = snClean(list).sesi.filter(x => x.ex === 'reaksi'), v = all.filter(x => x.d <= today), depan = all.length - v.length;
  if (!v.length) return depan ? Object.freeze(Object.assign({}, orwKosong, { masaDepan: depan })) : orwKosong;
  let rek = null; v.forEach(x => { if (rek === null || x.raw < rek.raw) rek = x; });   // terendah; seri = yang paling awal (urutan tanggal)
  const hari = []; v.forEach(x => { if (hari.indexOf(x.d) < 0) hari.push(x.d); });
  const daftar = v.slice(-ORW.terakhir).reverse().map(x => Object.freeze({ raw: x.raw, d: x.d }));   // terbaru dahulu; pada hari yang sama, yang disimpan terakhir dahulu
  const titik = [];
  for (let k = 0; k < ORW.hari; k++) {
    const d = snAddDays(today, -(ORW.hari - 1 - k)), r = v.filter(x => x.d === d).map(x => x.raw);
    if (r.length) titik.push(Object.freeze({ d, x: k, n: r.length, raw: Math.round(otrMedian(r)) }));
  }
  const a0 = snAddDays(today, -(ORW.tren - 1)), b0 = snAddDays(today, -(2 * ORW.tren - 1)), b1 = snAddDays(today, -ORW.tren);
  const A = v.filter(x => x.d >= a0).map(x => x.raw), B = v.filter(x => x.d >= b0 && x.d <= b1).map(x => x.raw);
  let tren = Object.freeze(Object.assign({}, orwTren0, { n1: A.length, n2: B.length }));
  const kini = otrMedian(A), basis = otrMedian(B);
  if (A.length >= ORW.minTren && B.length >= ORW.minTren && basis > 0) {
    const sel = kini - basis, p = sel / basis;
    tren = Object.freeze({ kode: p < -ORW.banding ? 'lebih_cepat' : p > ORW.banding ? 'lebih_lambat' : 'sekitar', n1: A.length, n2: B.length, kini: Math.round(kini), basis: Math.round(basis), selisih: Math.round(sel), persen: Math.round(p * 1000) / 10 });
  }
  return Object.freeze({ total: v.length, masaDepan: depan, hari: hari.length, rekor: Object.freeze({ raw: rek.raw, d: rek.d }), terakhir: daftar[0], daftar: Object.freeze(daftar), titik: Object.freeze(titik), tren });
}
function otrGrafik(titik, w, h, pad) {   // MURNI: titik riwayat -> koordinat grafik garis (x menurut hari dalam jendela, y: makin lambat makin ke atas); pad = batas dalam; tidak pernah NaN
  const ok = n => typeof n === 'number' && isFinite(n) && n > 0, W = ok(w) ? w : 300, H = ok(h) ? h : 90, P = typeof pad === 'number' && isFinite(pad) && pad >= 0 && pad * 2 < Math.min(W, H) ? pad : 8;
  const t = (Array.isArray(titik) ? titik : []).filter(p => p && ok(p.raw) && typeof p.x === 'number' && p.x >= 0 && p.x <= ORW.hari - 1);
  if (!t.length) return Object.freeze({ w: W, h: H, lo: null, hi: null, pts: Object.freeze([]) });
  let lo = Math.min.apply(null, t.map(p => p.raw)), hi = Math.max.apply(null, t.map(p => p.raw));
  if (hi - lo < 20) { const m = (lo + hi) / 2; lo = m - 10; hi = m + 10; }   // jendela sempit: jangan menggembungkan selisih kecil menjadi lonjakan
  const px = x => Math.round((P + (x / (ORW.hari - 1)) * (W - 2 * P)) * 10) / 10, py = r => Math.round((H - P - ((r - lo) / (hi - lo)) * (H - 2 * P)) * 10) / 10;
  return Object.freeze({ w: W, h: H, lo: Math.round(lo), hi: Math.round(hi), pts: Object.freeze(t.map(p => Object.freeze({ d: p.d, raw: p.raw, n: p.n, x: px(p.x), y: py(p.raw) }))) });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl1d: Object.freeze({ cfg: ORW, riwayat: otrRiwayat, grafik: otrGrafik }) }));
/* OTL-1d-pure-end */
/* ===== OTL-1d-end ===== */
/* ===== OTL-1d2-begin (20 Nov 2026): Sinaps > Latihan > Waktu reaksi, bagian 1d-2: TAMPILAN kartu "Riwayat" di tab Latihan (rekor, sesi terakhir, tren 7 hari vs 7 hari sebelumnya, grafik garis median harian 14 hari, 5 sesi terbaru). Hanya BACA dari SNS.data; tidak menulis apa pun. Pembangun HTML murni (orhHtml) + pengendali (pembungkus otvMount dan otvDraw; 0 baris lama diubah). Membalik: hapus blok ini dan CSS OTL-1d2. ===== */
const ORH_FINE = 'Riwayat dihitung di perangkat ini dari sesi yang tersimpan. Median dipakai supaya satu reaksi yang sangat lambat tidak menggeser angka. Selisih antar hari belum tentu berarti kemampuanmu berubah: kantuk, tidur, dan perangkat ikut memengaruhi, jadi anggap ini gambaran kebiasaan, bukan nilai kecerdasan.';
function orhTgl(d, today) {   // MURNI: 'YYYY-MM-DD' -> 'Hari ini' | 'Kemarin' | '12 Nov' (+ tahun bila bukan tahun ini); tak sah = ''
  if (!snDayOk(d)) return '';
  if (snDayOk(today)) { if (d === today) return 'Hari ini'; if (d === snAddDays(today, -1)) return 'Kemarin'; }
  return snhTgl(d) + (snDayOk(today) && d.slice(0, 4) !== today.slice(0, 4) ? '\u00a0' + d.slice(0, 4) : '');
}
function orhTrenTeks(t) {   // MURNI: keluaran tren otrRiwayat -> kalimat
  if (!t || t.kode === 'belum_cukup') { const a = t && typeof t.n1 === 'number' ? t.n1 : 0, b = t && typeof t.n2 === 'number' ? t.n2 : 0; const pt = n => n >= ORW.minTren ? 'cukup' : (n > 0 ? n : 0) + ' dari ' + ORW.minTren + ' sesi'; return 'Tren belum tersedia. ' + ORW.tren + ' hari terakhir: ' + pt(a) + '; sebelumnya: ' + pt(b) + '.'; }
  const aw = 'Tren: median ' + ORW.tren + ' hari terakhir ' + otvMs(t.kini), ak = ' dari ' + ORW.tren + ' hari sebelumnya (' + otvMs(t.basis) + ').', p = snhNum(Math.abs(t.persen)) + '%';
  return t.kode === 'lebih_cepat' ? aw + ', lebih cepat ' + p + ak : t.kode === 'lebih_lambat' ? aw + ', lebih lambat ' + p + ak : aw + ', sekitar sama dengan ' + ORW.tren + ' hari sebelumnya (' + otvMs(t.basis) + '; selisih ' + p + ').';
}
function orhSvg(g, today) {   // MURNI: keluaran otrGrafik (>= 2 titik) -> <svg>; warna lewat kelas CSS (token tema), bukan atribut
  const P = g.pts, mn = Math.min.apply(null, P.map(p => p.raw)), mx = Math.max.apply(null, P.map(p => p.raw));
  const lab = 'Grafik garis median Waktu reaksi per hari dalam ' + ORW.hari + ' hari terakhir: ' + P.length + ' hari berisi data, dari ' + mn + ' sampai ' + mx + ' milidetik. Angka lengkap ada di daftar sesi terbaru.';
  return '<svg class="orh-svg" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(lab) + '"><line class="orh-g" x1="0" y1="' + (g.h - 0.5) + '" x2="' + g.w + '" y2="' + (g.h - 0.5) + '"/>' +
    '<polyline class="orh-l" points="' + P.map(p => p.x + ',' + p.y).join(' ') + '"/>' +
    P.map(p => '<circle class="orh-d" cx="' + p.x + '" cy="' + p.y + '" r="3.5"><title>' + esc(orhTgl(p.d, today) + ': ' + p.raw + ' ms' + (p.n > 1 ? ' (median ' + p.n + ' sesi)' : '')) + '</title></circle>').join('') + '</svg>';
}
function orhHtml(rw, o, today) {   // MURNI: tidak mengubah masukan, tidak melempar galat; rw = keluaran otrRiwayat (atau null), o = { st: 'baca' | 'belum' | 'ok', blocked } -> isi kartu (tanpa pembungkus)
  o = o || {}; const hd = '<div class="nw-hd"><h3>Riwayat Waktu reaksi</h3></div>', fine = '<p class="nw-fine">' + esc(ORH_FINE) + '</p>', st = t => '<p class="nw-p snh-n" role="status">' + esc(t) + '</p>';
  if (o.st === 'baca') return hd + st('Membaca catatan latihan…') + fine;
  if (o.st !== 'ok' || !rw) return hd + st('Catatan latihan belum terbaca, jadi riwayat belum bisa ditampilkan.') + '<div class="snh-act"><button class="btn" data-q="orhRetry" data-fk="orh-retry">Coba baca lagi</button></div>' + fine;
  const blk = o.blocked ? st('Catatan latihan di perangkat ini berasal dari versi aplikasi yang lebih baru. Riwayat hanya dibaca; sesi baru tidak disimpan.') : '';
  const depan = rw.masaDepan > 0 ? st(rw.masaDepan + ' sesi bertanggal di masa depan tidak dihitung. Periksa jam perangkat.') : '';
  if (!rw.total) return hd + blk + depan + '<p class="nw-p otr-p">Belum ada sesi tersimpan. Selesaikan satu sesi di atas; rekor dan grafik muncul di sini.</p>' + fine;
  const tile = (v, nama, tgl) => '<div class="snh-t"><b class="snh-big">' + esc(String(v)) + ' <i>ms</i></b><span>' + esc(nama) + '</span><small>' + esc(tgl) + '</small></div>';
  let x = hd + blk + depan + '<div class="snh-st">' + tile(rw.rekor.raw, 'Rekor terbaik', orhTgl(rw.rekor.d, today)) + tile(rw.terakhir.raw, 'Sesi terakhir', orhTgl(rw.terakhir.d, today)) + '</div>' +
    '<p class="nw-p otr-p">' + rw.total + ' sesi tersimpan di ' + rw.hari + ' hari berlatih.</p><p class="nw-p otr-p">' + esc(orhTrenTeks(rw.tren)) + '</p>' +
    '<h4 class="orh-h">Median per hari, ' + ORW.hari + ' hari terakhir</h4>';
  const g = otrGrafik(rw.titik, 300, 90, 8);
  x += g.pts.length >= 2 ? '<div class="orh-svgw">' + orhSvg(g, today) + '</div>' + orhSumbuTgl(today, ORW.hari) + '<p class="otr-prog">Skala ' + g.lo + ' sampai ' + g.hi + ' ms · makin rendah makin cepat</p>'
    : '<p class="nw-p otr-p">Grafik muncul begitu ada sesi di dua hari berbeda dalam ' + ORW.hari + ' hari terakhir.</p>';
  x += '<h4 class="orh-h">Sesi terbaru</h4><ul class="snh-l">' + rw.daftar.map(s => '<li class="snh-r"><span class="snh-rn">' + esc(otvMs(s.raw)) + '</span>' +
    (s.d === rw.rekor.d && s.raw === rw.rekor.raw ? '<span class="snh-chip snh-ok">Rekor</span>' : '') + '<span class="snh-rc">' + esc(orhTgl(s.d, today)) + '</span></li>').join('') + '</ul>';
  return x + fine;
}
/* OTL-1d2-pure-end */
const ORH = { sig: '' };
function orhState() { return { st: SNS.ready ? 'ok' : (SNS.loading ? 'baca' : 'belum'), blocked: SNS.blocked }; }
function orhSig() { return [SNS.ready, SNS.loading, SNS.blocked, SNS.data.sesi.length, SNS.data.u, today()].join('|'); }
function orhDraw(paksa) {   // gambar ulang kartu Riwayat hanya bila isinya berubah (tanda: siap, jumlah sesi, waktu ubah, tanggal); aman dipanggil sering
  const el = $('#orhBody'); if (!el) return; const sig = orhSig(); if (!paksa && sig === ORH.sig && el.innerHTML) return;
  ORH.sig = sig; let rw = null; try { rw = SNS.ready ? otrRiwayat(SNS.data.sesi, today()) : null; } catch (e) { rw = null; }
  const ae = document.activeElement, had = !!(ae && el.contains(ae));   // fokus di dalam kartu dipulihkan sesudah gambar ulang (tombol bisa hilang)
  try { el.innerHTML = orhHtml(rw, orhState(), today()); } catch (e) { el.innerHTML = ''; }
  if (had) { const t = el.querySelector('.btn'); try { if (t) t.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } } catch (e) { /* abaikan */ } }
}
function orhRetry() { let p; try { p = snsLoad(); } catch (e) { p = Promise.resolve(); } orhDraw(true); Promise.resolve(p).then(() => orhDraw(true), () => orhDraw(true)); }   // muat ulang catatan (bila muat sebelumnya masih menggantung, menunggu batas waktunya); selama itu kartu menulis Membaca
{ const baseMount = otvMount; otvMount = function () {   // sisipkan kartu Riwayat di antara kartu Waktu reaksi dan "Latihan berikutnya"
  const w = baseMount.apply(this, arguments); if (!w) return w;
  const sec = document.createElement('section'); sec.className = 'nw-card orh-card'; sec.id = 'orhBody'; sec.setAttribute('aria-label', 'Riwayat Waktu reaksi');
  const nx = w.querySelector('.otr-next'); if (nx) w.insertBefore(sec, nx); else w.appendChild(sec);
  ORH.sig = ''; orhDraw(true); snsLoad().then(() => orhDraw());
  return w;
}; }
{ const baseDraw = otvDraw; otvDraw = function () { baseDraw.apply(this, arguments); orhDraw(); }; }   // sesudah simpan berhasil, otvDraw dipanggil: sesi baru ikut tampil
QACT.orhRetry = () => orhRetry();
window.DL = Object.freeze(Object.assign({}, window.DL, { otl1d2: Object.freeze({ html: orhHtml, tgl: orhTgl, trenTeks: orhTrenTeks, svg: orhSvg, draw: orhDraw, retry: orhRetry }) }));
/* ===== OTL-1d2-end ===== */
/* ===== OTL-1d3-begin (20 Nov 2026): Sinaps, bagian 1d-3: kalimat kecil di kartu hero halaman Sinaps dihitung dari SN_EX (jumlah latihan yang siap), supaya jujur sejak tab Latihan punya latihan pertama. Hanya halaman Sinaps; Outfit dan English tidak berubah. 0 baris lama diubah. Membalik: hapus blok ini. ===== */
/* OTL-1d3-pure-begin */
function otlHeroTeks(ex) {
  const l = Array.isArray(ex) ? ex : [], n = l.length; let siap = 0;
  for (let i = 0; i < n; i++) if (l[i] && l[i].siap === true) siap++;
  if (!n || !siap) return 'Tab Hari ini sudah aktif; tab lain menyusul.';
  return 'Tab Hari ini dan Latihan sudah aktif (' + (siap === n ? 'semua ' + n : siap + ' dari ' + n) + ' latihan siap); tab lain menyusul.';
}
/* OTL-1d3-pure-end */
{ const baseNwHero3 = nwRender; nwRender = function (key) {
  baseNwHero3.apply(this, arguments);
  if (key === 'sinaps') { const f = $('#nwSinapsBody .nw-hero .nw-fine'); if (f) f.textContent = otlHeroTeks(SN_EX); }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { otl1d3: Object.freeze({ hero: otlHeroTeks }) }));
/* ===== OTL-1d3-end ===== */
/* ===== OTL-2a-begin (20 Nov 2026): Sinaps > Latihan > Rentang digit, bagian 2a: LOGIKA MURNI (mesin keadaan; bilangan acak DISUNTIKKAN; tanpa jam, tanpa acak sendiri, tanpa DOM). Belum ada tampilan, tombol, atau penyimpanan; SN_EX tidak diubah. Membalik: hapus blok ini. ===== */
const OTD = Object.freeze({ awal: 2, maks: 12, coba: 2, tampilMs: 800, jedaMs: 200, banding: 1, hariBanding: 14, minBanding: 3 });   // awal = panjang pertama; coba = percobaan per panjang; tampilMs + jedaMs = 1000 ms per angka; banding = selisih minimal (angka) agar dianggap beda
const otdIs = (x, a, b) => typeof x === 'number' && Number.isInteger(x) && x >= a && x <= b;
const otdSet = (s, p) => Object.freeze(Object.assign({}, s, p));
function otdBaru(mode) { return Object.freeze({ mode: mode === 'mundur' ? 'mundur' : 'maju', fase: 'siap', len: OTD.awal, coba: 1, urut: null, jawab: Object.freeze([]), span: 0, riwayat: Object.freeze([]), last: null }); }
function otdUrut(len, acak, hindar) {   // MURNI: urutan angka 0 sampai 9 sepanjang len; tidak ada angka yang sama berurutan; tidak identik dengan `hindar` (urutan sebelumnya); acak = larik bilangan di [0,1) (butir tak sah dianggap 0,5)
  if (!otdIs(len, 1, OTD.maks)) return Object.freeze([]);
  const r = i => { const v = Array.isArray(acak) ? acak[i] : undefined; return typeof v === 'number' && v >= 0 && v < 1 ? v : 0.5; }, d = [];
  for (let i = 0; i < len; i++) {
    if (i === 0) d.push(Math.floor(r(0) * 10));
    else { const k = Math.floor(r(i) * 9), p = d[i - 1]; d.push(k >= p ? k + 1 : k); }
  }
  if (Array.isArray(hindar) && hindar.length === len && hindar.every((v, i) => v === d[i])) {
    let c = (d[len - 1] + 1) % 10; if (len > 1 && c === d[len - 2]) c = (c + 1) % 10; d[len - 1] = c;
  }
  return Object.freeze(d);
}
function otdJadwal(len) {   // MURNI: kapan tiap angka tampil dan hilang (ms sejak mulai); total = waktu sampai kolom jawab dibuka
  if (!otdIs(len, 1, OTD.maks)) return Object.freeze({ total: 0, butir: Object.freeze([]) });
  const per = OTD.tampilMs + OTD.jedaMs, b = []; for (let i = 0; i < len; i++) b.push(Object.freeze({ i, on: i * per, off: i * per + OTD.tampilMs }));
  return Object.freeze({ total: len * per, butir: Object.freeze(b) });
}
function otdMulaiCoba(s, acak) { const prev = s.riwayat.length ? s.riwayat[s.riwayat.length - 1].urut : null; return otdSet(s, { fase: 'tampil', urut: otdUrut(s.len, acak, prev), jawab: Object.freeze([]), last: null }); }
function otdMulai(s, acak) { return s.fase === 'siap' ? otdMulaiCoba(s, acak) : s; }
function otdTampilSelesai(s) { return s.fase === 'tampil' ? otdSet(s, { fase: 'jawab' }) : s; }
function otdMasuk(s, d) { return s.fase === 'jawab' && otdIs(d, 0, 9) && s.jawab.length < s.len ? otdSet(s, { jawab: Object.freeze(s.jawab.concat([d])) }) : s; }
function otdHapus(s) { return s.fase === 'jawab' && s.jawab.length ? otdSet(s, { jawab: Object.freeze(s.jawab.slice(0, -1)) }) : s; }
function otdKirim(s) {   // hanya bila jawaban selengkap urutan; maju = sama persis, mundur = urutan terbalik
  if (s.fase !== 'jawab' || s.jawab.length !== s.len) return s;
  const tgt = s.mode === 'mundur' ? s.urut.slice().reverse() : s.urut, benar = tgt.every((v, i) => v === s.jawab[i]);
  const rec = Object.freeze({ len: s.len, coba: s.coba, benar, urut: s.urut, jawab: s.jawab });
  return otdSet(s, { fase: 'umpan', span: benar ? Math.max(s.span, s.len) : s.span, riwayat: Object.freeze(s.riwayat.concat([rec])), last: Object.freeze({ benar, len: s.len, coba: s.coba }) });
}
function otdLanjut(s, acak) {   // benar: panjang + 1 (selesai bila sudah panjang maksimum); salah: percobaan kedua pada panjang yang sama, atau selesai bila dua-duanya salah
  if (s.fase !== 'umpan' || !s.last) return s;
  if (s.last.benar) return s.len >= OTD.maks ? otdSet(s, { fase: 'selesai' }) : otdMulaiCoba(otdSet(s, { len: s.len + 1, coba: 1 }), acak);
  return s.coba >= OTD.coba ? otdSet(s, { fase: 'selesai' }) : otdMulaiCoba(otdSet(s, { coba: s.coba + 1 }), acak);
}
function otdRingkas(s) {   // MURNI; span = panjang terpanjang yang dijawab benar; sesi sah bila span >= panjang awal; raw = span
  const benar = s.riwayat.filter(x => x.benar).length, sah = s.span >= OTD.awal;
  return Object.freeze({ selesai: s.fase === 'selesai', mode: s.mode, span: s.span, percobaan: s.riwayat.length, benar, salah: s.riwayat.length - benar, sah, raw: sah ? s.span : null });
}
function otdKeSesi(s, d) {   // sesi untuk disimpan ({ ex, d, raw }) atau null bila belum selesai, tidak sah, tanggal tak sah, atau mode mundur (mundur belum punya bentuk simpan sendiri: akan tercampur dengan maju)
  const r = otdRingkas(s); if (!r.selesai || !r.sah || r.mode !== 'maju' || !snDayOk(d)) return null;
  return Object.freeze({ ex: 'digit', d, raw: r.raw });
}
function otdBanding(raw, sesi, today) {   // bandingkan dengan median rentang digit diri sendiri 14 hari terakhir (hari ini ikut); perlu >= 3 sesi; beda minimal 1 angka. Dipanggil SEBELUM sesi baru ditambahkan
  const kosong = n => Object.freeze({ kode: 'belum_cukup', n, basis: null, selisih: null });
  if (!otdIs(raw, 0, OTD.maks) || !snDayOk(today)) return kosong(0);
  const awal = snAddDays(today, -(OTD.hariBanding - 1)), v = snClean(sesi).sesi.filter(x => x.ex === 'digit' && x.d >= awal && x.d <= today).map(x => x.raw), basis = otrMedian(v);
  if (v.length < OTD.minBanding) return kosong(v.length);
  const sel = raw - basis, kode = sel >= OTD.banding ? 'lebih_panjang' : sel <= -OTD.banding ? 'lebih_pendek' : 'sekitar';
  return Object.freeze({ kode, n: v.length, basis, selisih: sel });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { otl2a: Object.freeze({ cfg: OTD, baru: otdBaru, urut: otdUrut, jadwal: otdJadwal, mulai: otdMulai, tampilSelesai: otdTampilSelesai, masuk: otdMasuk, hapus: otdHapus, kirim: otdKirim, lanjut: otdLanjut, ringkas: otdRingkas, keSesi: otdKeSesi, banding: otdBanding }) }));
/* ===== OTL-2a-end ===== */
/* ===== OTL-2b-begin (20 Nov 2026): Sinaps > Latihan > Rentang digit, bagian 2b-1: PEMBANGUN HTML MURNI kartu "Rentang digit" (satu cabang per fase: siap, tampil, jawab, umpan, selesai), kalimat pembanding, dan daftar "Latihan berikutnya" tanpa latihan yang sudah punya kartu. BELUM dipasang ke halaman (2b-2) dan belum menyimpan (2c); SN_EX tidak diubah. Membalik: hapus blok ini dan CSS OTL-2b. ===== */
/* OTL-2b-pure-begin */
const OTW_INTRO = 'Perhatikan deret angka yang muncul satu per satu, lalu ketik ulang dengan urutan yang sama. Mulai dari 2 angka, naik satu setiap kali jawabanmu benar. Dua kali salah pada panjang yang sama mengakhiri sesi. Sekitar 3 menit.';
const OTW_FINE = 'Latihan ini hanya mengukur dan melatih tugas ini sendiri, bukan bukti otak jadi lebih pintar. Hasilnya dipengaruhi kantuk, gangguan di sekitarmu, dan caramu mengingat (misalnya mengelompokkan angka), jadi bandingkan hanya dengan dirimu sendiri. Latihan ini hanya bisa dipakai dengan melihat layar.';
const OTW_BELUM_P = '<p class="nw-p snh-n">Hasil sesi ini belum disimpan. Penyimpanan menyusul di bagian berikutnya, jadi hasilnya hilang bila kamu pindah tab.</p>';
const OTW_KARTU = Object.freeze(['reaksi', 'digit']);   // latihan yang sudah punya kartu sendiri: tidak masuk daftar "Latihan berikutnya"
const otwA = n => n + '\u00a0angka';
const otwSeq = a => Array.isArray(a) ? a.join(' ') : '';
function otwBandingTeks(b) {   // MURNI: keluaran otdBanding (atau null bila catatan belum terbaca) -> kalimat
  if (!b) return 'Catatan latihan belum terbaca, jadi pembanding tidak ditampilkan.';
  if (b.kode === 'belum_cukup') return 'Belum ada pembanding: butuh minimal ' + OTD.minBanding + ' sesi dalam ' + OTD.hariBanding + ' hari terakhir (sekarang ' + b.n + ').';
  const sel = snhNum(Math.abs(b.selisih)) + '\u00a0angka', dari = ' dari median ' + OTD.hariBanding + ' harimu (' + otwA(snhNum(b.basis)) + ').';
  return b.kode === 'lebih_panjang' ? 'Lebih panjang ' + sel + dari : b.kode === 'lebih_pendek' ? 'Lebih pendek ' + sel + dari : 'Sekitar biasanya: selisih ' + sel + dari;
}
function otwProg(s, selesaiCoba) {
  return '<p class="otr-prog" aria-live="off">Panjang ' + otwA(s.len) + ' · percobaan ' + s.coba + (selesaiCoba ? ' selesai' : ' dari ' + OTD.coba) + (s.span > 0 ? ' · rentang sejauh ini ' + otwA(s.span) : '') + '</p>';
}
function otwLanjutTeks(s) {   // MURNI: teks tombol sesudah umpan balik
  s = s || {}; const b = !!(s.last && s.last.benar), len = Number.isInteger(s.len) ? s.len : OTD.awal, coba = Number.isInteger(s.coba) ? s.coba : 1;
  if (b) return len >= OTD.maks ? 'Lihat hasil sesi' : 'Lanjut: ' + otwA(len + 1);
  return coba >= OTD.coba ? 'Lihat hasil sesi' : 'Coba lagi (percobaan ' + (coba + 1) + ')';
}
function otwSlots(s) {   // MURNI: kotak jawaban (satu per angka); yang terisi menampilkan angkanya, yang berikutnya ditandai
  const j = Array.isArray(s.jawab) ? s.jawab : [], n = s.len; let h = '';
  for (let i = 0; i < n; i++) h += '<span class="otd-slot' + (i < j.length ? ' otd-f' : i === j.length ? ' otd-c' : '') + '">' + (i < j.length ? esc(String(j[i])) : '') + '</span>';
  return '<div class="otd-ans" role="group" aria-label="' + esc('Jawabanmu: ' + j.length + ' dari ' + n + ' angka terisi') + '">' + h + '</div>';
}
function otwPapan(s) {   // MURNI: papan angka 1-9, Hapus, 0, Kirim (Kirim hanya aktif bila jawaban selengkap deret; angka mati bila sudah penuh)
  const j = Array.isArray(s.jawab) ? s.jawab : [], penuh = j.length >= s.len, kosong = j.length === 0;
  const k = d => '<button class="btn otd-key" type="button" data-q="otdKey" data-v="' + d + '" data-fk="otd-k' + d + '" aria-label="Angka ' + d + '"' + (penuh ? ' disabled' : '') + '>' + d + '</button>';
  return '<div class="otd-pd" role="group" aria-label="Papan angka">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k).join('') +
    '<button class="btn otd-key otd-aks" type="button" data-q="otdDel" data-fk="otd-del"' + (kosong ? ' disabled' : '') + '>Hapus</button>' + k(0) +
    '<button class="btn otd-key otd-aks otd-kirim" type="button" data-q="otdSend" data-fk="otd-send"' + (penuh ? '' : ' disabled') + '>Kirim</button></div>';
}
function otwHtml(s, o) {   // MURNI: tidak mengubah masukan, tidak melempar galat; s = keadaan mesin (otdBaru ...), o = { idx, ban, note } (idx = indeks angka yang sedang tampil, -1 = jeda atau bersiap) -> isi kartu (tanpa pembungkus)
  o = o || {}; s = s || otdBaru();
  const hd = '<div class="nw-hd"><h3>Rentang digit</h3></div>', fine = '<p class="nw-fine">' + esc(OTW_FINE) + '</p>';
  const note = o.note ? '<p class="nw-p snh-n" role="status">' + esc(o.note) + '</p>' : '';
  const btn = (q, fk, t) => '<div class="snh-act"><button class="btn" type="button" data-q="' + q + '" data-fk="' + fk + '">' + esc(t) + '</button></div>';
  const f = s.fase;
  if (f === 'tampil') {
    const U = Array.isArray(s.urut) ? s.urut : [], ix = Number.isInteger(o.idx) && o.idx >= 0 && o.idx < U.length ? o.idx : -1, ke = ix >= 0 ? ix : (Number.isInteger(o.ke) && o.ke >= 0 && o.ke < U.length ? o.ke : -1);   // ke = angka terakhir yang sudah tampil (label tetap saat jeda antar angka)
    return hd + otwProg(s, false) + '<div class="otd-pad" role="img" aria-label="Perhatikan layar: angka muncul satu per satu">' + (ix >= 0 ? '<b class="otd-dig">' + esc(String(U[ix])) + '</b>' : '<b class="otd-dig otd-kosong">·</b>') + '</div>' +
      '<p class="otr-prog" aria-live="off">' + (ke >= 0 ? 'Angka ' + (ke + 1) + ' dari ' + s.len : 'Bersiap…') + '</p><p class="nw-p otr-p">Ingat urutannya. Papan angka muncul setelah angka terakhir.</p>' + fine;
  }
  if (f === 'jawab') return hd + otwProg(s, false) + otwSlots(s) + '<p class="nw-p otr-p">Ketik angka yang tadi muncul, ' + (s.mode === 'mundur' ? 'dengan urutan terbalik' : 'dengan urutan yang sama') + '.</p>' + otwPapan(s) + fine;
  if (f === 'umpan') {
    const rec = Array.isArray(s.riwayat) && s.riwayat.length ? s.riwayat[s.riwayat.length - 1] : null, benar = !!(s.last && s.last.benar);
    let x = hd + otwProg(s, true) + '<div class="otr-res" role="status"><b class="otr-big">' + (benar ? 'Benar' : 'Salah') + '</b><span>' + (benar ? 'Deret ' + otwA(s.len) + ' kamu ulang dengan tepat.' : 'Ada angka yang tidak sesuai urutannya.') + '</span></div>';
    if (rec) {
      x += '<p class="nw-p otr-p">Urutan tadi: <b class="otd-seq">' + esc(otwSeq(rec.urut)) + '</b></p>';
      if (s.mode === 'mundur' && Array.isArray(rec.urut)) x += '<p class="nw-p otr-p">Seharusnya dijawab terbalik: <b class="otd-seq">' + esc(otwSeq(rec.urut.slice().reverse())) + '</b></p>';
      x += '<p class="nw-p otr-p">Jawabanmu: <b class="otd-seq">' + esc(otwSeq(rec.jawab)) + '</b></p>';
    }
    return x + btn('otdNext', 'otd-next', otwLanjutTeks(s)) + fine;
  }
  if (f === 'selesai') {
    const r = otdRingkas(s); let x = hd + '<p class="otr-prog">Sesi selesai</p>';
    if (r.sah) {
      x += '<div class="otr-res"><span>Rentang digit kamu</span><b class="otr-big">' + esc(otwA(r.span)) + '</b></div>' +
        '<div class="snh-st"><div class="snh-t"><b class="snh-big">' + r.benar + '</b><span>Jawaban benar</span></div><div class="snh-t"><b class="snh-big">' + r.salah + '</b><span>Jawaban salah</span></div></div>' +
        '<p class="nw-p otr-p">' + r.percobaan + ' percobaan. Rentang = deret terpanjang yang kamu ulang dengan benar' + (r.mode === 'mundur' ? ' (dijawab terbalik)' : '') + '.</p>' +
        '<p class="nw-p otr-p">' + esc(otwBandingTeks(o.ban === undefined ? null : o.ban)) + '</p>';
    } else x += '<div class="otr-res"><b class="otr-big">Sesi belum sah</b><span>Belum ada deret ' + OTD.awal + ' angka yang kamu jawab benar. Coba lagi dengan perhatian penuh pada layar.</span></div>';
    return x + OTW_BELUM_P + btn('otdGo', 'otd-go', 'Ulangi sesi') + fine;
  }
  return hd + note + '<p class="nw-p otr-p">' + esc(OTW_INTRO) + '</p>' + btn('otdGo', 'otd-go', 'Mulai sesi') + fine;   // siap (dan fase tak dikenal)
}
function otwListHtml() {   // MURNI: kartu "Latihan berikutnya" dari SN_EX, tanpa latihan yang sudah punya kartu (OTW_KARTU); yang lain masih "Segera"
  const l = SN_EX.filter(e => OTW_KARTU.indexOf(e.id) < 0); if (!l.length) return '';
  return '<section class="nw-card otr-next" aria-label="Latihan berikutnya"><div class="nw-hd"><h3>Latihan berikutnya</h3></div><ul class="snh-l">' + l.map(e =>
    '<li class="snh-r"><span class="snh-rn">' + esc(e.nama) + '</span><span class="snh-chip snh-soon">Segera</span><span class="snh-rc">Belum tersedia · tahap ' + esc(e.tahap) + '</span></li>').join('') + '</ul></section>';
}
/* OTL-2b-pure-end */
window.DL = Object.freeze(Object.assign({}, window.DL, { otl2b: Object.freeze({ html: otwHtml, list: otwListHtml, banTeks: otwBandingTeks, lanjutTeks: otwLanjutTeks, slots: otwSlots, papan: otwPapan }) }));
