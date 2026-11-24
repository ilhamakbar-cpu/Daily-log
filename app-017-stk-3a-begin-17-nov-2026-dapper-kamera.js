/* ===== STK-2d2-end ===== */
/* ===== STK-3a-begin (17 Nov 2026): Dapper > Kamera, bagian 3a: RANCANGAN MURNI permintaan kirim foto ke AI (scan). BELUM ada tombol, BELUM ada panggilan AI, BELUM ada jaringan: hanya fungsi yang memutuskan BOLEH/TIDAK sebuah foto dikirim dan, bila boleh, menyusun SPESIFIKASI permintaan (tugas, petunjuk sistem per sudut, teks pengguna, batas ukuran/waktu/token, metadata gambar). Spesifikasi TIDAK memuat data gambar; data kelak ditempelkan pemanggil (STK-3b) lewat AI.ask({ image: { type, data } }) yang sudah ada. Urutan pagar (dari yang pertama gagal): rencana 2a tidak sah/tanpa foto (nofoto) -> AI utama mati (aimati) -> grup Foto mati (grupmati) -> belum disetujui untuk foto INI (izin) -> sedang ada permintaan (sibuk) -> bukan JPEG (tipe) -> ukuran berkas tak sah (ukuran) -> terlalu besar (besar) -> dimensi tak sah/terlalu besar (dimensi) -> sudut tak dikenal (mode). Persetujuan dibaca ketat (=== true) dan hanya berlaku untuk satu foto (pemanggil wajib mengosongkannya bila foto berganti). Membalik: hapus blok ini. ===== */
const STK_ASK = Object.freeze({ maxBytes: 4000000, task: 'stkScan', maxTok: 900, think: 1024, timeout: 60000 });
const STK_ASK_RULES = 'Aturan wajib: jawab dalam bahasa Indonesia. Hanya bicara tentang apa yang TERLIHAT di foto; jangan menebak identitas, umur, atau kondisi kesehatan, jangan memberi diagnosis, jangan memperkirakan berat badan atau BMI, dan jangan merendahkan tubuh siapa pun. Bahasa netral dan sopan. Bila foto tidak menampakkan orang atau terlalu gelap/buram, katakan itu dan jangan mengarang. Jawab HANYA dengan JSON: { "terbaca": boolean, "ringkas": string, "catatan": [string, ...], "saran_foto": [string, ...] } tanpa teks lain. "saran_foto" berisi saran cara memotret ulang agar hasil lebih jelas.';
const STK_ASK_SYS = Object.freeze({
  depan: 'Kamu asisten pengamat postur dan proporsi dari foto badan TAMPAK DEPAN. Amati: kesejajaran bahu, kepala, pinggul, dan stance kaki, serta apakah seluruh badan masuk bingkai. ' + STK_ASK_RULES,
  samping: 'Kamu asisten pengamat postur dari foto badan TAMPAK SAMPING. Amati: posisi kepala terhadap bahu, lengkung punggung, kemiringan panggul, dan apakah seluruh badan masuk bingkai. ' + STK_ASK_RULES,
  wajah: 'Kamu asisten pengamat warna dari foto WAJAH. Amati: kesan warna kulit (hangat/dingin/netral), warna rambut, dan kondisi cahaya yang memengaruhi warna. ' + STK_ASK_RULES,
  outfit: 'Kamu asisten pengamat pakaian dari foto OUTFIT. Amati: jenis pakaian, warna dominan, kecocokan warna antarbagian, dan kerapian. ' + STK_ASK_RULES
});
const STK_ASK_USER = Object.freeze({ depan: 'Amati foto badan tampak depan ini.', samping: 'Amati foto badan tampak samping ini.', wajah: 'Amati foto wajah ini untuk warna.', outfit: 'Amati foto outfit ini.' });
const STK_ASK_MSG = Object.freeze({
  nofoto: 'Ambil foto dulu.', aimati: 'AI belum dinyalakan di Pengaturan AI, jadi foto tidak dikirim.', grupmati: 'Pengiriman foto belum diizinkan. Nyalakan "Foto" di Pengaturan AI. Foto tidak dikirim.',
  izin: 'Foto ini belum kamu setujui untuk dikirim, jadi tidak dikirim.', sibuk: 'Masih ada permintaan yang berjalan. Tunggu selesai dulu.', tipe: 'Foto bukan JPEG, jadi tidak dikirim.',
  ukuran: 'Ukuran berkas foto tidak terbaca, jadi tidak dikirim.', besar: 'Foto terlalu besar untuk dikirim. Ulangi foto atau kaburkan area lalu terapkan.', dimensi: 'Ukuran gambar foto tidak sah atau terlalu besar, jadi tidak dikirim.', mode: 'Sudut foto tidak dikenal, jadi tidak dikirim.'
});
function stkAskPlan(o) {   // MURNI: o = { plan (hasil stkSendPlan), consent, busy, mode, type, bytes, w, h } -> { ok, code, msg, spec }; spec hanya bila ok (tanpa data gambar)
  o = o && typeof o === 'object' ? o : {};
  const no = c => ({ ok: false, code: c, msg: STK_ASK_MSG[c], spec: null });
  const pl = o.plan && typeof o.plan === 'object' ? o.plan : null;
  if (!pl || pl.k === 'nofoto' || pl.canSend === undefined) return no('nofoto');
  if (pl.k === 'aimati') return no('aimati');
  if (pl.k === 'grupmati') return no('grupmati');
  if (pl.k !== 'siap' || pl.canSend !== true) return no('nofoto');
  if (o.consent !== true) return no('izin');
  if (o.busy === true) return no('sibuk');
  if (o.type !== 'image/jpeg') return no('tipe');
  if (!Number.isFinite(o.bytes) || o.bytes <= 0) return no('ukuran');
  if (o.bytes > STK_ASK.maxBytes) return no('besar');
  if (!Number.isInteger(o.w) || !Number.isInteger(o.h) || o.w <= 0 || o.h <= 0 || o.w > STK_AP.maxSide || o.h > STK_AP.maxSide || o.w * o.h > STK_AP.maxPx) return no('dimensi');
  if (typeof o.mode !== 'string' || !Object.prototype.hasOwnProperty.call(STK_ASK_SYS, o.mode)) return no('mode');
  return { ok: true, code: 'siap', msg: '', spec: { task: STK_ASK.task, mode: o.mode, system: STK_ASK_SYS[o.mode], user: STK_ASK_USER[o.mode], json: true, max: STK_ASK.maxTok, think: STK_ASK.think, timeout: STK_ASK.timeout, image: { type: 'image/jpeg', bytes: o.bytes, w: o.w, h: o.h } } };
}
function stkAskState(mode, consent, busy) { return stkAskPlan({ plan: stkSendState(), consent: consent, busy: busy, mode: mode, type: 'image/jpeg', bytes: STKP.bytes, w: STKP.w, h: STKP.h }); }   // keadaan nyata -> keputusan; dibaca saja (STK-3b memakainya)
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3a: Object.freeze({ cfg: STK_ASK, sys: STK_ASK_SYS, user: STK_ASK_USER, msg: STK_ASK_MSG, plan: stkAskPlan, state: stkAskState }) }));
/* ===== STK-3a-end ===== */
/* ===== STK-3b1-begin (17 Nov 2026): Dapper > Kamera, bagian 3b-1: PERSETUJUAN PER FOTO di memori (logika, BELUM ada tampilan, BELUM ada tombol, BELUM ada panggilan AI). Persetujuan = STKP.consent menyimpan alamat foto (blob) yang disetujui; sah HANYA bila sama dengan alamat foto sekarang, tidak ada area ditandai yang belum diterapkan, dan tidak sedang mengaburkan. Karena foto baru, hasil Terapkan kabur, dan foto yang dibuang semuanya menghasilkan alamat berbeda/kosong, persetujuan lama otomatis tidak berlaku; stkConsentSync (lewat pembungkus stkBlurSync) juga mengosongkannya. stkConsentGive menolak dengan alasan bila foto belum ada, pengiriman belum diizinkan (AI/grup Foto), sedang mengaburkan, atau ada area belum diterapkan. stkAskNow memasukkan persetujuan nyata ke stkAskPlan (3a). Hanya di memori, tidak disimpan, tidak ikut cadangan, tanpa jaringan. Membalik: hapus blok ini. ===== */
STKP.consent = '';   // alamat foto yang disetujui untuk dikirim; kosong = belum ada persetujuan; hanya di memori
const STK_CS_MSG = Object.freeze({ nofoto: 'Ambil foto dulu.', tutup: 'Pengiriman foto belum diizinkan di Pengaturan AI, jadi tidak ada yang perlu disetujui.', sibuk: 'Foto sedang dikaburkan. Tunggu sampai selesai.', belumterap: 'Ada area yang sudah ditandai tapi belum diterapkan. Terapkan kabur dulu atau hapus tandanya, baru setujui.' });
function stkConsentCheck(s) {   // MURNI: s = { hasUrl, canSend, busy, pending } -> { ok, code, msg }; hasUrl dan canSend dibaca ketat (=== true)
  s = s && typeof s === 'object' ? s : {};
  const no = c => ({ ok: false, code: c, msg: STK_CS_MSG[c] });
  if (s.hasUrl !== true) return no('nofoto');
  if (s.canSend !== true) return no('tutup');
  if (s.busy === true) return no('sibuk');
  if (Number.isInteger(s.pending) && s.pending > 0) return no('belumterap');
  return { ok: true, code: 'ok', msg: '' };
}
function stkConsentValid(consent, url) { return typeof consent === 'string' && typeof url === 'string' && url !== '' && consent === url; }   // MURNI: persetujuan sah hanya untuk alamat foto yang sama
function stkConsentHtml(o) {   // MURNI: o = { check (hasil stkConsentCheck), given } -> html kotak izin; tanpa tombol; kosong bila belum ada foto
  o = o && typeof o === 'object' ? o : {}; const c = o.check && typeof o.check === 'object' ? o.check : null;
  if (!c || c.code === 'nofoto') return '';
  const g = o.given === true;
  const t = g ? 'Kamu sudah menyetujui foto ini untuk dikirim ke AI. Persetujuan hilang bila foto diganti, dibuang, atau ditandai area baru.' : c.ok === true ? 'Foto ini belum kamu setujui. Setujui hanya setelah memeriksa kotak "Yang akan dikirim".' : String(c.msg || '');
  return '<section class="stk-cs' + (g ? ' stk-cs-ok' : '') + '" aria-label="Izin untuk foto ini"><h4 class="stk-t stk-cs-t">' + (g ? 'Foto ini disetujui' : 'Izin untuk foto ini') + '</h4><p class="nw-p stk-cs-p">' + esc(t) + '</p></section>';
}
function stkConsentState() { return { hasUrl: !!STKP.url, canSend: stkSendState().canSend === true, busy: STKB.busy === true, pending: STKB.list.length }; }   // keadaan nyata -> masukan stkConsentCheck
function stkConsentNow() { return stkConsentValid(STKP.consent, STKP.url) && STKB.list.length === 0 && STKB.busy !== true; }   // apakah foto SEKARANG sedang disetujui
function stkConsentGive() { const c = stkConsentCheck(stkConsentState()); if (c.ok) STKP.consent = STKP.url; return c; }   // setujui foto sekarang bila boleh
function stkConsentRevoke() { STKP.consent = ''; }
function stkConsentSync() { if (STKP.consent !== '' && !stkConsentNow()) STKP.consent = ''; }   // persetujuan yang tidak lagi sah dikosongkan
function stkAskNow(mode, busy) { return stkAskPlan({ plan: stkSendState(), consent: stkConsentNow(), busy: busy === true, mode: mode, type: 'image/jpeg', bytes: STKP.bytes, w: STKP.w, h: STKP.h }); }   // keputusan kirim dengan persetujuan NYATA
{ const baseBlurSync2 = stkBlurSync; stkBlurSync = function () { baseBlurSync2.apply(this, arguments); stkConsentSync(); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b1: Object.freeze({ check: stkConsentCheck, valid: stkConsentValid, html: stkConsentHtml, state: stkConsentState, now: stkConsentNow, give: stkConsentGive, revoke: stkConsentRevoke, ask: stkAskNow, msg: STK_CS_MSG, raw: () => STKP.consent }) }));
/* ===== STK-3b1-end ===== */
/* ===== STK-3b2-begin (17 Nov 2026): Dapper > Kamera, bagian 3b-2: TAMPILAN kotak izin per foto (#stkConsentBox) tepat di bawah kotak "Yang akan dikirim" (#stkSendBox) di kartu hasil foto, dengan tombol "Setujui foto ini" / "Batalkan persetujuan" (satu tombol bergantian, data-fk sama supaya fokus tidak hilang). TANPA tombol kirim dan TANPA panggilan AI: menyetujui TIDAK mengirim apa pun, dan kotak menyatakannya terang-terangan. Html kotak = stkConsentHtml (3b-1, murni) + catatan jujur + tombol; tombol nonaktif bila stkConsentCheck menolak (AI/grup Foto mati, sedang mengaburkan, area belum diterapkan). Idempoten, dipanggil lewat pembungkus stkBlurSync dan QACT.aiSet; bila Pengaturan AI membuat pengiriman tidak diizinkan, persetujuan yang sudah ada DICABUT (tidak hidup lagi bila AI dinyalakan kembali). Tanpa jaringan/penyimpanan/kamera. Membalik: hapus blok ini dan CSS STK-3b2. ===== */
function stkConsentBoxHtml() {   // html kotak izin untuk keadaan sekarang; kosong bila belum ada foto hasil
  if (!(STKP.st === 'shot' && !!STKP.url)) return '';
  const check = stkConsentCheck(stkConsentState()), given = stkConsentNow();
  const base = stkConsentHtml({ check: check, given: given }); if (!base) return '';
  const label = given ? 'Batalkan persetujuan' : 'Setujui foto ini';
  const btn = '<button type="button" class="stk-go ' + (given ? 'stk-go2' : '') + ' stk-cs-b" data-q="' + (given ? 'stkConsentRevoke' : 'stkConsentGive') + '" data-fk="stk-cs-btn"' + (given || check.ok ? '' : ' disabled') + '>' + label + '</button>';
  const note = '<p class="nw-fine stk-cs-n">Menyetujui belum mengirim apa pun. Foto baru dikirim ke AI saat kamu mengetuk Kirim ke AI, satu kali; bila gagal, tidak dicoba ulang otomatis.</p>';
  return base.replace(/<\/section>$/, note + btn + '</section>');
}
function stkConsentUiSync() {   // memasang/memperbarui/membuang #stkConsentBox; idempoten; fokus tombol dipertahankan
  const box = $('#stkPhBox'); if (!box) return;
  let el = box.querySelector('#stkConsentBox');
  const html = stkConsentBoxHtml();
  if (!html) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div'); el.id = 'stkConsentBox'; el.className = 'stk-csbox'; el.setAttribute('aria-live', 'polite');
    const anchor = box.querySelector('#stkSendBox') || box.querySelector('#stkBlurBox') || box.querySelector('figure.stk-res'); if (!anchor) return;
    anchor.after(el);
  }
  if (el.dataset.h === html) return;
  const ae = document.activeElement, keep = !!(ae && el.contains(ae) && ae.dataset && ae.dataset.fk === 'stk-cs-btn');
  el.dataset.h = html; el.innerHTML = html;
  if (keep) { const b = el.querySelector('[data-fk="stk-cs-btn"]'); if (b && !b.disabled) { try { b.focus({ preventScroll: true }); } catch (x) { /* abaikan */ } } }
}
QACT.stkConsentGive = () => { stkConsentGive(); stkConsentUiSync(); };
QACT.stkConsentRevoke = () => { stkConsentRevoke(); stkConsentUiSync(); };
{ const baseBlurSync3 = stkBlurSync; stkBlurSync = function () { baseBlurSync3.apply(this, arguments); stkConsentUiSync(); }; }   // setiap sinkron editor/kotak ikut menyinkronkan kotak izin (setelah stkConsentSync 3b-1)
{ const baseAiSet3 = QACT.aiSet; QACT.aiSet = function () { const r = baseAiSet3.apply(this, arguments); try { if (stkSendState().canSend !== true) stkConsentRevoke(); stkConsentUiSync(); } catch (x) { /* abaikan: kartu Kamera tidak terbuka */ } return r; }; }   // Pengaturan AI berubah: pengiriman tak diizinkan -> persetujuan dicabut; kotak ikut
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b2: Object.freeze({ html: stkConsentBoxHtml, sync: stkConsentUiSync }) }));
/* ===== STK-3b2-end ===== */
/* ===== STK-3b3a-begin (18 Nov 2026): Dapper > Kamera, bagian 3b-3a: LOGIKA PEMANGGILAN AI untuk foto (stkAskRun) + penguraian jawaban (stkAskParse). BELUM ada tombol dan BELUM ada tampilan hasil: pemilik belum melihat perubahan di layar; fungsi hanya bisa dipanggil lewat DL.stk3b3a.run(sudut). Urutan stkAskRun: (1) semua pagar stkAskNow (3a+3b-1: foto, AI, grup Foto, persetujuan, sibuk, tipe, ukuran, dimensi, sudut) lalu AI sedang dipakai permintaan lain (aibusy) lalu AI.ready; SEMUA ditolak SEBELUM foto dibaca. (2) Fase baca: foto dibaca dari alamatnya sebagai berkas lalu diperiksa (JPEG, ukuran sama dengan catatan STKP.bytes) dan diubah ke base64 (panjang diperiksa); data gambar HANYA ada di memori selama panggilan ini. (3) Sebelum dikirim, persetujuan dan alamat foto diperiksa ULANG: bila dicabut atau foto berganti selama membaca, TIDAK ada yang dikirim (berubah). (4) AI.ask (SATU-SATUNYA tempat blok ini memanggil AI; model sama dengan tugas foto lain, aiFastModel). (5) Setelah jawaban: bila foto berganti atau persetujuan dicabut, hasil DIBUANG (berubah). (6) stkAskParse (murni) menolak jawaban yang bukan objek / terbaca bukan boolean / ringkas bukan teks / daftar bukan larik berisi teks, membersihkan karakter kontrol, membatasi panjang dan jumlah, dan membuang baris yang menyebut berat badan, BMI, diagnosis, dsb (jaring kata kunci, bukan jaminan). stkAskCancel membatalkan: pada fase membaca hanya menandai, pada fase kirim memanggil AI.cancel HANYA bila permintaan yang berjalan memang milik blok ini (tidak pernah membatalkan permintaan AI milik fitur lain). stkConsentUiSync dibungkus: setiap kali persetujuan dicabut / foto berganti / area ditandai (jalur yang sudah memanggil sinkron kotak izin) dan permintaan sedang berjalan, permintaan dibatalkan. Blok TIDAK menulis STKP/STKB, tidak menyimpan apa pun, tidak mendefinisikan aksi QACT. Membalik: hapus blok ini. ===== */
const STK_RUN_MSG = Object.freeze({
  baca: 'Berkas foto tidak bisa dibaca dengan utuh, jadi tidak dikirim.',
  berubah: 'Foto berganti atau persetujuan dicabut, jadi permintaan dibatalkan dan hasilnya dibuang.',
  format: 'Jawaban AI tidak sesuai format, jadi tidak ditampilkan. Coba lagi.',
  langgar: 'Jawaban AI menyebut hal yang dilarang (berat badan, BMI, atau diagnosis), jadi tidak ditampilkan. Coba lagi.',
  aibusy: 'Permintaan AI lain masih berjalan. Tunggu selesai dulu.',
  galat: 'Terjadi galat. Tidak ada yang berubah.'
});
const STK_RUN_LIM = Object.freeze({ ringkas: 500, item: 280, items: 6, scan: 50 });
const STK_RUN_BAN = /\b(?:(?:bmi|imt|obesitas|kegemukan|overweight|underweight|diagnos\w*|kg|kurus|gemuk)(?:nya|mu|ku)?)\b|berat\s*badan|lemak\s*tubuh/i;
const STKA = { phase: 'idle', tok: 0, url: '', why: '', run: null };   // phase: idle | read | ask; hanya di memori
function stkRunClean(s) { return typeof s === 'string' ? s.replace(/[\u0000-\u001F\u007F-\u009F]+/g, ' ').replace(/\s+/g, ' ').trim() : ''; }
function stkRunClip(t, max) { const a = Array.from(t); return a.length > max ? a.slice(0, max - 1).join('').trimEnd() + '…' : t; }
function stkAskParse(d) {   // MURNI: jawaban AI (objek hasil JSON.parse) -> { ok, code, msg, result, dibuang }
  const no = c => ({ ok: false, code: c, msg: STK_RUN_MSG[c], result: null, dibuang: 0 });
  if (!d || typeof d !== 'object' || Array.isArray(d)) return no('format');
  const own = k => Object.prototype.hasOwnProperty.call(d, k) ? d[k] : undefined;
  const tb = own('terbaca'); if (tb !== true && tb !== false) return no('format');
  const rg = own('ringkas'); if (typeof rg !== 'string') return no('format');
  let ring = stkRunClean(rg);
  if (STK_RUN_BAN.test(ring)) return no('langgar');
  if (ring === '') { if (tb === true) return no('format'); ring = 'Foto tidak terbaca dengan jelas.'; }
  let dibuang = 0;
  const list = k => {
    const v = own(k); if (v === undefined || v === null) return [];
    if (!Array.isArray(v)) return null;
    const out = [];
    for (const x of v.slice(0, STK_RUN_LIM.scan)) {
      if (typeof x !== 'string') return null;
      const t = stkRunClean(x); if (t === '') continue;
      if (STK_RUN_BAN.test(t)) { dibuang++; continue; }
      out.push(stkRunClip(t, STK_RUN_LIM.item));
    }
    return out.slice(0, STK_RUN_LIM.items);
  };
  const ct = list('catatan'), sf = list('saran_foto'); if (ct === null || sf === null) return no('format');
  return { ok: true, code: 'ok', msg: '', result: { terbaca: tb, ringkas: stkRunClip(ring, STK_RUN_LIM.ringkas), catatan: ct, saran_foto: sf }, dibuang: dibuang };
}
function stkAskStill() { return STKA.url !== '' && STKP.url === STKA.url && stkConsentNow() === true; }   // foto sama dan persetujuan masih sah
function stkAskGone() { return STKA.why === 'berubah' ? { ok: false, code: 'berubah', msg: STK_RUN_MSG.berubah, result: null } : { ok: false, code: 'cancelled', msg: '', result: null }; }
function stkAskCancel(why) {   // true bila ada permintaan yang dibatalkan
  if (STKA.phase === 'idle') return false;
  STKA.tok++; STKA.why = why === 'berubah' ? 'berubah' : 'user';
  if (STKA.phase === 'ask' && STKA.run && AI.run === STKA.run) AI.cancel();   // hanya permintaan milik blok ini
  return true;
}
function stkAskGuard() { if (STKA.phase !== 'idle' && !stkAskStill()) stkAskCancel('berubah'); }
async function stkAskRun(mode) {   // -> { ok:true, code:'ok', mode, url, result, dibuang } | { ok:false, code, msg, result:null }; tidak pernah melempar galat
  const out = (c, m) => ({ ok: false, code: c, msg: m, result: null });
  try {
    const pl = stkAskNow(mode, STKA.phase !== 'idle'); if (!pl.ok) return out(pl.code, pl.msg);
    if (AI.run) return out('aibusy', STK_RUN_MSG.aibusy);
    const rd = AI.ready(); if (!rd.ok) return out(rd.why, rd.msg);
    const spec = pl.spec, tok = ++STKA.tok, url = STKP.url, octx = spec.mode === 'outfit' ? stkOutfitCtxNow() : null, args = stkAskArgs(spec, octx);
    STKA.phase = 'read'; STKA.url = url; STKA.why = ''; STKA.run = null;
    try {
      let blob = null, data = '';
      try { const rs = await fetch(url); blob = await rs.blob(); } catch (e) { blob = null; }
      if (tok !== STKA.tok) return stkAskGone();
      if (!blob || blob.type !== 'image/jpeg' || blob.size !== spec.image.bytes) return out('baca', STK_RUN_MSG.baca);
      try { data = await tkB64(blob); } catch (e) { data = ''; }
      if (tok !== STKA.tok) return stkAskGone();
      if (typeof data !== 'string' || data.length !== Math.ceil(blob.size / 3) * 4) return out('baca', STK_RUN_MSG.baca);
      if (!stkAskStill()) return out('berubah', STK_RUN_MSG.berubah);
      const again = stkAskNow(mode, false); if (!again.ok) return out(again.code, again.msg);
      STKA.phase = 'ask';
      const before = AI.run;
      const pr = AI.ask({ task: spec.task, model: aiFastModel(), system: args.system, user: args.user, image: { type: 'image/jpeg', data: data }, json: true, max: args.max, think: spec.think, timeout: spec.timeout, single: true });   // single (STK-3b-3b-4a): foto dikirim PALING SEKALI, tanpa ulang dan tanpa kunci cadangan
      STKA.run = before === null && AI.run ? AI.run : null;
      const r = await pr;
      if (tok !== STKA.tok) return stkAskGone();
      if (!stkAskStill()) return out('berubah', STK_RUN_MSG.berubah);
      if (!r || r.ok !== true) return out(r && r.code ? String(r.code) : 'gagal', r && typeof r.msg === 'string' ? r.msg : 'AI gagal menjawab.');
      const ps = stkAskReply(spec.mode, r.data, octx); if (!ps.ok) return out(ps.code, ps.msg);
      return Object.assign({ ok: true, code: 'ok', msg: '', mode: spec.mode, url: url, result: ps.result, dibuang: ps.dibuang }, ps.warna ? { warna: ps.warna } : {}, ps.outfit ? { outfit: ps.outfit } : {});
    } finally { STKA.phase = 'idle'; STKA.run = null; STKA.url = ''; }
  } catch (e) { return out('galat', STK_RUN_MSG.galat); }
}
{ const baseUiSync4 = stkConsentUiSync; stkConsentUiSync = function () { const r = baseUiSync4.apply(this, arguments); try { stkAskGuard(); } catch (x) { /* abaikan */ } return r; }; }   // sinkron kotak izin = foto/persetujuan berubah: permintaan yang berjalan dibatalkan
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b3a: Object.freeze({ msg: STK_RUN_MSG, lim: STK_RUN_LIM, parse: stkAskParse, run: stkAskRun, cancel: stkAskCancel, phase: () => STKA.phase }) }));
/* ===== STK-3b3a-end ===== */
/* ===== STK-3b3b1-begin (18 Nov 2026): Dapper > Kamera, bagian 3b-3b-1: PENAMPIL HASIL AI (stkResultHtml), MURNI: hasil stkAskParse (objek { terbaca, ringkas, catatan, saran_foto }) -> html kartu hasil. BELUM dipasang ke halaman, BELUM ada tombol kirim, BELUM ada CSS: pemilik belum melihat perubahan di layar; hanya bisa dicoba lewat DL.stk3b3b1.html(obj) di konsol. Penampil memeriksa ulang masukan (bentuk, kata terlarang, batas panjang) walau sudah lewat stkAskParse. Tanpa tombol, tautan, atau input. Membalik: hapus blok ini. ===== */
const STK_RS_NOTE = '✦ Dihasilkan AI. Bisa keliru. Bukan diagnosis atau saran medis. Hasil hanya tampil di layar ini, tidak disimpan, dan hilang bila foto berganti.';
function stkResultHtml(res) {   // MURNI; '' bila bukan hasil yang sah; tidak mengubah masukan
  if (!res || typeof res !== 'object' || Array.isArray(res)) return '';
  const own = k => Object.prototype.hasOwnProperty.call(res, k) ? res[k] : undefined;
  const tb = own('terbaca'), rg = own('ringkas'), ct = own('catatan'), sf = own('saran_foto');
  if ((tb !== true && tb !== false) || typeof rg !== 'string' || !Array.isArray(ct) || !Array.isArray(sf)) return '';
  const ring = stkRunClip(stkRunClean(rg), STK_RUN_LIM.ringkas);
  if (ring === '' || STK_RUN_BAN.test(ring)) return '';
  const list = a => {
    const out = [];
    for (const x of a.slice(0, STK_RUN_LIM.scan)) {
      if (typeof x !== 'string') return null;
      const t = stkRunClean(x); if (t === '' || STK_RUN_BAN.test(t)) continue;
      out.push(stkRunClip(t, STK_RUN_LIM.item));
    }
    return out.slice(0, STK_RUN_LIM.items);
  };
  const c = list(ct), s = list(sf); if (c === null || s === null) return '';
  const ul = a => '<ul class="stk-rs-ul">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const part = (k, h, a) => a.length ? '<div class="stk-rs-' + k + '"><h5 class="stk-rs-h">' + h + '</h5>' + ul(a) + '</div>' : '';
  return '<section class="stk-rs' + (tb ? '' : ' stk-rs-no') + '" aria-label="Hasil bacaan AI untuk foto ini"><h4 class="stk-t stk-rs-t">' + (tb ? 'Hasil bacaan AI' : 'Foto belum terbaca jelas') + '</h4><p class="nw-p stk-rs-p">' + esc(ring) + '</p>' + part('c', 'Catatan', c) + part('s', 'Saran foto berikutnya', s) + '<p class="nw-fine stk-rs-n">' + esc(STK_RS_NOTE) + '</p></section>';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b3b1: Object.freeze({ html: stkResultHtml, note: STK_RS_NOTE }) }));
/* ===== STK-3b3b1-end ===== */
/* ===== STK-3b3b2-begin (18 Nov 2026): Dapper > Kamera, bagian 3b-3b-2: KEADAAN HASIL AI di memori (STKP.result). BELUM ada tombol kirim dan BELUM dipasang ke layar: pemilik belum melihat perubahan; hanya bisa dicoba lewat DL.stk3b3b2 di konsol. Hasil = { url, mode, result } (beku), HANYA di memori (tidak disimpan, tidak ikut cadangan, tanpa jaringan). Sah HANYA bila: foto hasil jepret masih ada, alamat foto SAMA dengan alamat saat hasil dibuat, persetujuan foto itu masih sah, dan pengiriman masih diizinkan (AI menyala + grup Foto). Karena foto berganti/dibuang/dikaburkan ulang, persetujuan dicabut, area baru ditandai, atau AI dimatikan membuat salah satu syarat gugur, hasil DIKOSONGKAN (stkResultSync lewat pembungkus stkConsentUiSync, plus pembungkus stkPhDiscard, plus pemeriksaan ulang di setiap pembacaan stkResultGet). Ini yang membuktikan kalimat catatan "hilang bila foto berganti" (STK_RS_NOTE, 3b-3b-1). stkResultRun = stkAskRun (3b-3a) lalu simpan; hasil lama diganti HANYA bila hasil baru sah (permintaan gagal/ditolak tidak membuang hasil lama untuk foto yang sama). Membalik: hapus blok ini. ===== */
STKP.result = null;   // { url, mode, result } beku; hanya di memori
function stkResultKeep(held, cx) {   // MURNI: hasil tersimpan boleh dipertahankan? -> { ok, why }; why: kosong | tanpaurl | bukanfoto | foto | izin | ai
  const no = w => ({ ok: false, why: w });
  if (!held || typeof held !== 'object' || Array.isArray(held)) return no('kosong');
  if (typeof held.url !== 'string' || held.url === '') return no('tanpaurl');
  if (!cx || typeof cx !== 'object') return no('bukanfoto');
  if (cx.shot !== true) return no('bukanfoto');
  if (typeof cx.url !== 'string' || cx.url !== held.url) return no('foto');
  if (cx.consent !== true) return no('izin');
  if (cx.canSend !== true) return no('ai');
  return { ok: true, why: '' };
}
function stkResultCtx() {   // keadaan nyata -> masukan stkResultKeep; galat apa pun = tidak sah
  try { return { shot: STKP.st === 'shot' && !!STKP.url, url: STKP.url, consent: stkConsentNow() === true, canSend: stkSendState().canSend === true }; } catch (e) { return { shot: false, url: '', consent: false, canSend: false }; }
}
function stkResultGet() {   // hasil yang masih sah atau null; hasil yang tidak lagi sah DIKOSONGKAN di sini juga
  const h = STKP.result; if (h === null) return null;
  if (!stkResultKeep(h, stkResultCtx()).ok) { STKP.result = null; return null; }
  return h;
}
function stkResultClear() { const had = STKP.result !== null; STKP.result = null; return had; }
function stkResultSync() { if (STKP.result !== null) stkResultGet(); }
function stkResultSet(run) {   // run = hasil stkAskRun; -> { ok, code }; menyimpan salinan beku HANYA bila semua syarat sah SEKARANG
  const no = c => ({ ok: false, code: c });
  if (!run || typeof run !== 'object' || run.ok !== true) return no('ditolak');
  if (typeof run.url !== 'string' || run.url === '') return no('ditolak');
  if (typeof run.mode !== 'string' || !Object.prototype.hasOwnProperty.call(STK_ASK_SYS, run.mode)) return no('mode');
  if (!stkResultKeep({ url: run.url }, stkResultCtx()).ok) return no('berubah');
  const rs = run.result; if (stkResultHtml(rs) === '') return no('format');
  const strs = a => Object.freeze(a.slice(0, STK_RUN_LIM.scan));   // stkResultHtml sudah memastikan 50 elemen pertama berupa teks
  STKP.result = Object.freeze({ url: run.url, mode: run.mode, result: Object.freeze({ terbaca: rs.terbaca, ringkas: rs.ringkas, catatan: strs(rs.catatan), saran_foto: strs(rs.saran_foto) }) });
  return { ok: true, code: 'ok' };
}
async function stkResultRun(mode) {   // stkAskRun lalu simpan; tidak pernah melempar galat; bentuk keluaran sama dengan stkAskRun (+ stored)
  try {
    const r = await stkAskRun(mode);
    if (!r || r.ok !== true) return r;
    const s = stkResultSet(r);
    if (!s.ok) return { ok: false, code: s.code === 'format' ? 'format' : 'berubah', msg: s.code === 'format' ? STK_RUN_MSG.format : STK_RUN_MSG.berubah, result: null };
    return Object.assign({}, r, { stored: true });
  } catch (e) { return { ok: false, code: 'galat', msg: STK_RUN_MSG.galat, result: null }; }
}
{ const baseUiSync5 = stkConsentUiSync; stkConsentUiSync = function () { try { return baseUiSync5.apply(this, arguments); } finally { try { stkResultSync(); } catch (x) { /* abaikan */ } } }; }   // setiap sinkron kotak izin (foto/persetujuan/AI berubah): hasil yang tidak sah dikosongkan
{ const baseDiscard5 = stkPhDiscard; stkPhDiscard = function () { STKP.result = null; return baseDiscard5.apply(this, arguments); }; }   // foto dibuang / pindah tab / pindah halaman / pagehide: hasil langsung dikosongkan
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b3b2: Object.freeze({ keep: stkResultKeep, ctx: stkResultCtx, get: stkResultGet, set: stkResultSet, clear: stkResultClear, sync: stkResultSync, run: stkResultRun, raw: () => STKP.result }) }));
/* ===== STK-3b3b2-end ===== */
/* ===== STK-3b3b3-begin (18 Nov 2026): Dapper > Kamera, bagian 3b-3b-3: PASANG TAMPILAN hasil AI (#stkAskBox) di kartu hasil foto, tepat di bawah kotak izin (#stkConsentBox). Isi kotak = stkResultHtml (3b-3b-1) dari hasil yang MASIH SAH menurut stkResultGet (3b-3b-2); tidak ada hasil sah = kotak tidak ada. TANPA tombol kirim: hasil baru bisa muncul lewat DL.stk3b3b3.run(sudut) atau DL.stk3b3b3.set(run) di konsol (pemilik belum punya tombolnya; itu 3b-3b-4). Idempoten; dipanggil lewat pembungkus stkConsentUiSync (foto/persetujuan/AI/editor berubah), stkResultSet, stkResultClear, dan stkPhDiscard, jadi kotak hilang seketika bersama hasilnya. Tanpa tombol, tautan, input, jaringan, penyimpanan. Membalik: hapus blok ini dan CSS STK-3b3b3. ===== */
function stkAskBoxHtml() {   // html kotak hasil; '' bila tidak ada hasil yang masih sah
  const h = stkResultGet(); if (h === null) return '';
  return stkResultHtml(h.result);
}
function stkAskUiSync() {   // memasang/memperbarui/membuang #stkAskBox; idempoten; urutan: ... #stkConsentBox lalu #stkAskBox
  const box = $('#stkPhBox'); if (!box) return;
  let el = box.querySelector('#stkAskBox'), html = '';
  try { html = stkAskBoxHtml(); } catch (x) { html = ''; }
  if (!html) { if (el) el.remove(); return; }
  const anchor = box.querySelector('#stkConsentBox') || box.querySelector('#stkSendBox') || box.querySelector('#stkBlurBox') || box.querySelector('figure.stk-res'); if (!anchor) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'stkAskBox'; el.className = 'stk-askbox'; el.setAttribute('aria-live', 'polite'); }
  if (el.previousElementSibling !== anchor) anchor.after(el);
  if (el.dataset.h === html) return;
  el.dataset.h = html; el.innerHTML = html;
}
{ const baseUiSync6 = stkConsentUiSync; stkConsentUiSync = function () { try { return baseUiSync6.apply(this, arguments); } finally { try { stkAskUiSync(); } catch (x) { /* abaikan */ } } }; }   // setelah kotak izin dan pengosongan hasil tidak sah (3b-3b-2)
{ const baseSet6 = stkResultSet; stkResultSet = function () { const r = baseSet6.apply(this, arguments); try { stkAskUiSync(); } catch (x) { /* abaikan */ } return r; }; }   // hasil baru disimpan: tampil
{ const baseClr6 = stkResultClear; stkResultClear = function () { const r = baseClr6.apply(this, arguments); try { stkAskUiSync(); } catch (x) { /* abaikan */ } return r; }; }
{ const baseDiscard6 = stkPhDiscard; stkPhDiscard = function () { const r = baseDiscard6.apply(this, arguments); try { stkAskUiSync(); } catch (x) { /* abaikan */ } return r; }; }   // foto dibuang/pindah tab: kotak ikut hilang
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b3b3: Object.freeze({ html: stkAskBoxHtml, sync: stkAskUiSync, set: stkResultSet, run: stkResultRun, clear: stkResultClear }) }));
/* ===== STK-3b3b3-end ===== */
/* ===== STK-3b3b4b-begin (18 Nov 2026): Dapper > Kamera, bagian 3b-3b-4b: TOMBOL "Kirim ke AI" di kotak izin (#stkConsentBox), DI ATAS tombol "Batalkan persetujuan". Muncul HANYA bila foto ini sedang disetujui (stkConsentNow). Isi: pilihan jenis foto (Badan depan / Badan samping / Wajah / Outfit; harus dipilih dulu, tidak ada bawaan), tombol "Kirim ke AI" (nonaktif sebelum jenis dipilih; berlabel "Kirim lagi" setelah gagal atau setelah ada hasil), keadaan "Sedang mengirim..." + tombol Batal (stkAskCancel('user')), dan pesan gagal yang jelas (stkAskFailText: bedakan "foto tidak dikirim" dari "tidak dicoba ulang otomatis"). Satu ketukan = SATU permintaan (stkResultRun -> stkAskRun dengan single, 3b-3b-4a). Jenis foto dan pesan gagal hanya di memori dan dikosongkan saat foto dibuang/berganti. Tanpa penyimpanan dan tanpa jaringan selain panggilan AI yang sudah ada. Membalik: hapus blok ini dan CSS STK-3b3b4b, kembalikan 2 kalimat lama. ===== */
const STK_SEND_MODES = Object.freeze([['depan', 'Badan depan'], ['samping', 'Badan samping'], ['wajah', 'Wajah'], ['outfit', 'Outfit']]);
const STK_NOSENT = Object.freeze(['nofoto', 'aimati', 'grupmati', 'izin', 'sibuk', 'tipe', 'ukuran', 'besar', 'dimensi', 'mode', 'baca', 'aibusy', 'off', 'nokey', 'noproxy']);   // kode penolakan SEBELUM foto dikirim
const STKS = { mode: '', fail: null };   // fail = { url, text }; hanya di memori
function stkAskSending() { return STKA.phase !== 'idle'; }
function stkAskFailText(r) {   // MURNI: hasil stkResultRun/stkAskRun -> teks pesan ('' bila berhasil)
  if (!r || typeof r !== 'object' || r.ok === true) return '';
  const code = typeof r.code === 'string' ? r.code : '';
  if (code === 'cancelled') return 'Dibatalkan. Bila foto sudah terlanjur terkirim, AI mungkin sudah menerimanya. Hasilnya tidak dipakai.';
  let m = stkRunClean(typeof r.msg === 'string' ? r.msg : ''); if (m === '') m = 'Pengiriman gagal.';
  m = stkRunClip(m, 200);
  if (STK_NOSENT.indexOf(code) >= 0) return m + ' Foto tidak dikirim.';
  if (code === 'berubah' || code === 'galat') return m;
  return m + ' Tidak dicoba ulang otomatis. Ketuk Kirim lagi bila mau.';
}
function stkAskCtlHtml(o) {   // MURNI: o = { mode, sending, fail (teks), hasResult } -> html kontrol kirim
  o = o && typeof o === 'object' ? o : {};
  const mode = STK_SEND_MODES.some(m => m[0] === o.mode) ? o.mode : '';
  if (o.sending === true) return '<div class="stk-ac" role="group" aria-label="Pengiriman ke AI"><p class="nw-p stk-ac-p" role="status">Sedang mengirim ke AI… Foto dikirim sekali dan tidak dicoba ulang otomatis.</p><button type="button" class="stk-go stk-go2 stk-ac-b" data-q="stkAskStop" data-fk="stk-ask-btn">Batal</button></div>';
  const chips = STK_SEND_MODES.map(m => '<button type="button" class="stk-ac-chip' + (m[0] === mode ? ' stk-ac-on' : '') + '" aria-pressed="' + (m[0] === mode ? 'true' : 'false') + '" data-q="stkAskMode" data-m="' + m[0] + '">' + esc(m[1]) + '</button>').join('');
  const err = typeof o.fail === 'string' && o.fail !== '' ? '<p class="nw-p stk-ac-err" role="alert">' + esc(o.fail) + '</p>' : '';
  const label = err !== '' || o.hasResult === true ? 'Kirim lagi' : 'Kirim ke AI';
  return '<div class="stk-ac" role="group" aria-label="Kirim ke AI"><p class="nw-fine stk-ac-l" id="stkAcL">Foto ini termasuk jenis apa?</p><div class="stk-ac-m" role="group" aria-labelledby="stkAcL">' + chips + '</div>' + err +
    '<button type="button" class="stk-go stk-ac-b" data-q="stkAskSend" data-fk="stk-ask-btn"' + (mode ? '' : ' disabled') + '>' + label + '</button>' + (mode ? '' : '<p class="nw-fine stk-ac-h">Pilih jenis foto dulu.</p>') + '</div>';
}
{ const baseBox7 = stkConsentBoxHtml; stkConsentBoxHtml = function () {   // kontrol kirim hanya bila foto ini disetujui; disisipkan sebelum tombol terakhir (Batalkan persetujuan)
  const h = baseBox7.apply(this, arguments); if (!h || stkConsentNow() !== true) return h;
  const f = STKS.fail && STKS.fail.url === STKP.url ? STKS.fail.text : '';
  const ctl = stkAskCtlHtml({ mode: STKS.mode, sending: stkAskSending(), fail: f, hasResult: stkResultGet() !== null });
  const i = h.lastIndexOf('<button'); return i < 0 ? h : h.slice(0, i) + ctl + h.slice(i);
}; }
function stkAskFocus(sel) {   // fokus ke kontrol baru bila fokus tadinya di kotak izin atau hilang (elemen lama dibuang saat digambar ulang)
  try { const box = $('#stkConsentBox'); if (!box) return; const ae = document.activeElement; if (ae && ae !== document.body && !box.contains(ae)) return; const b = box.querySelector(sel); if (b && !b.disabled) b.focus({ preventScroll: true }); } catch (x) { /* abaikan */ }
}
async function stkAskSendGo() {   // satu ketukan Kirim = satu permintaan; tidak pernah melempar galat
  if (stkAskSending() || !STK_SEND_MODES.some(m => m[0] === STKS.mode)) return null;
  const url = STKP.url; STKS.fail = null;
  const p = stkResultRun(STKS.mode);   // sinkron sampai fase baca dimulai: ketukan kedua langsung ditolak oleh stkAskSending
  try { stkConsentUiSync(); stkAskFocus('[data-fk="stk-ask-btn"]'); } catch (x) { /* abaikan */ }
  let r; try { r = await p; } catch (x) { r = { ok: false, code: 'galat', msg: STK_RUN_MSG.galat, result: null }; }
  STKS.fail = r && r.ok === true ? null : { url: url, text: stkAskFailText(r) };
  try { stkConsentUiSync(); stkAskFocus('[data-fk="stk-ask-btn"]'); const a = $('#stkAskBox'); if (r && r.ok === true && a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' }); } catch (x) { /* abaikan */ }
  return r;
}
QACT.stkAskMode = function (el) { const m = el && el.dataset ? el.dataset.m : ''; if (stkAskSending() || !STK_SEND_MODES.some(x => x[0] === m)) return; STKS.mode = m; STKS.fail = null; stkConsentUiSync(); stkAskFocus('[data-m="' + m + '"]'); };
QACT.stkAskSend = function () { stkAskSendGo(); };
QACT.stkAskStop = function () { stkAskCancel('user'); };   // stkAskSendGo menggambar ulang setelah permintaan berhenti
{ const baseDiscard8 = stkPhDiscard; stkPhDiscard = function () { STKS.mode = ''; STKS.fail = null; return baseDiscard8.apply(this, arguments); }; }   // foto dibuang/berganti: jenis dan pesan lama hilang
window.DL = Object.freeze(Object.assign({}, window.DL, { stk3b3b4b: Object.freeze({ ctl: stkAskCtlHtml, fail: stkAskFailText, send: stkAskSendGo, modes: STK_SEND_MODES, nosent: STK_NOSENT, state: () => ({ mode: STKS.mode, sending: stkAskSending(), fail: STKS.fail ? STKS.fail.text : '' }) }) }));
/* ===== STK-3b3b4b-end ===== */
/* ===== STK-4a-begin (18 Nov 2026): Dapper > Kamera, bagian 4a: LOGIKA MURNI "scan warna" (undertone + kontras): penguraian jawaban AI (stkColorParse) dan pencocokan dengan tes pembuluh darah (stkColorConfirm). BELUM ada tombol, BELUM ada tampilan, BELUM dihubungkan ke stkAskRun, BELUM ada jaringan: pemilik belum melihat perubahan di layar; semua fungsi MURNI (tidak membaca/menulis keadaan aplikasi). Rancangan STYOTK-R0: foto tunggal tidak andal (cahaya), jadi keluaran = KANDIDAT + tingkat keyakinan yang dibatasi, TIDAK PERNAH final; final hanya bila tes pembuluh darah SETUJU; bila berbeda, tidak ada yang dipilih. Pagar: hanya undertone dan kontras (bukan nilai baik/buruk), tanpa tebak identitas/umur/etnis/jenis kelamin/kesehatan, tanpa berat badan/BMI. ===== */
const STK_COL = Object.freeze({ undertone: Object.freeze(['hangat', 'dingin', 'netral', 'tidak_pasti']), keyakinan: Object.freeze(['rendah', 'sedang', 'tinggi']), kontras: Object.freeze(['rendah', 'sedang', 'tinggi', 'tidak_pasti']), lim: Object.freeze({ alasan: 280, items: 4, cahaya: 200, scan: 20 }), capKeyakinan: 'sedang' });
const STK_COL_VEIN = Object.freeze({ hijau: 'hangat', biru_ungu: 'dingin', campur: 'netral', tidak_jelas: null });   // tes pembuluh darah di pergelangan tangan, cahaya siang
const STK_COL_BAN = /\b(?:(?:bmi|imt|obesitas|kegemukan|overweight|underweight|diagnos\w*|kg|kurus|gemuk|etnis\w*|ras|suku|bule|pribumi|jenis\s*kelamin|cantik|jelek|tampan|menarik|umur|usia|jerawat|ruam|penyakit|kelainan)(?:nya|mu|ku)?)\b|berat\s*badan|lemak\s*tubuh|lebih\s+(cerah|putih|terang|bagus|baik|cantik)/i;
const STK_COL_RULES = 'Aturan wajib: jawab dalam bahasa Indonesia. Hanya bicara tentang apa yang TERLIHAT di foto. Tugasmu HANYA menebak KANDIDAT undertone kulit (hangat, dingin, netral) dan kontras (seberapa jauh beda terang-gelap antara kulit, rambut, dan mata). Foto tunggal tidak andal karena cahaya, jadi beri tingkat keyakinan yang jujur dan jangan memberi "tinggi" bila cahaya tidak netral. Undertone dan kontras BUKAN nilai: jangan menyebut satu lebih bagus, lebih cerah, atau lebih cantik dari yang lain. Jangan menebak identitas, umur, etnis, jenis kelamin, atau kondisi kesehatan; jangan memberi diagnosis; jangan menyebut berat badan atau BMI. Bila foto tidak menampakkan wajah, terlalu gelap, buram, atau cahayanya berwarna kuat, isi "terbaca" false dan "undertone" "tidak_pasti". Jawab HANYA dengan JSON: { "terbaca": boolean, "undertone": "hangat"|"dingin"|"netral"|"tidak_pasti", "keyakinan": "rendah"|"sedang"|"tinggi", "kontras": "rendah"|"sedang"|"tinggi"|"tidak_pasti", "alasan": [string, ...], "cahaya": string, "saran_foto": [string, ...] } tanpa teks lain. "alasan" berisi apa yang terlihat yang mendasari tebakan; "cahaya" menjelaskan kondisi cahaya; "saran_foto" berisi saran memotret ulang (mis. dekat jendela siang, tanpa filter).';
const STK_COL_SYS = 'Kamu asisten pengamat warna dari foto WAJAH untuk kandidat undertone dan kontras. ' + STK_COL_RULES;
const STK_COL_USER = 'Amati foto wajah ini untuk kandidat undertone dan kontras warna.';
const STK_COL_MSG = Object.freeze({
  format: 'Jawaban AI tidak sesuai format, jadi tidak ditampilkan. Coba lagi.',
  langgar: 'Jawaban AI menyebut hal yang dilarang (penilaian, identitas, kesehatan, atau berat badan), jadi tidak ditampilkan. Coba lagi.',
  hasil: 'Hasil scan warna tidak sah, jadi tidak dicocokkan.',
  tes: 'Pilihan tes pembuluh darah tidak dikenal.'
});
function stkColorParse(d) {   // MURNI: jawaban AI (objek hasil JSON.parse) -> { ok, code, msg, result, dibuang, dibatasi }
  const no = c => ({ ok: false, code: c, msg: STK_COL_MSG[c], result: null, dibuang: 0, dibatasi: false });
  if (!d || typeof d !== 'object' || Array.isArray(d)) return no('format');
  const own = k => Object.prototype.hasOwnProperty.call(d, k) ? d[k] : undefined;
  const pick = (k, list) => { const v = own(k); if (typeof v !== 'string') return null; const t = v.trim().toLowerCase(); return list.indexOf(t) >= 0 ? t : null; };
  const tb = own('terbaca'); if (tb !== true && tb !== false) return no('format');
  const ut = pick('undertone', STK_COL.undertone), ky = pick('keyakinan', STK_COL.keyakinan), kt = pick('kontras', STK_COL.kontras);
  if (ut === null || ky === null || kt === null) return no('format');
  const cv = own('cahaya'); if (cv !== undefined && cv !== null && typeof cv !== 'string') return no('format');
  let cahaya = typeof cv === 'string' ? stkRunClean(cv) : '';
  if (STK_COL_BAN.test(cahaya)) return no('langgar');
  let dibuang = 0;
  const list = k => {
    const v = own(k); if (v === undefined || v === null) return [];
    if (!Array.isArray(v)) return null;
    const out = [];
    for (const x of v.slice(0, STK_COL.lim.scan)) {
      if (typeof x !== 'string') return null;
      const t = stkRunClean(x); if (t === '') continue;
      if (STK_COL_BAN.test(t)) { dibuang++; continue; }
      out.push(stkRunClip(t, STK_COL.lim.alasan));
    }
    return out.slice(0, STK_COL.lim.items);
  };
  const al = list('alasan'), sf = list('saran_foto'); if (al === null || sf === null) return no('format');
  if (tb === false || ut === 'tidak_pasti') return { ok: true, code: 'ok', msg: '', result: { terbaca: tb, undertone: 'tidak_pasti', keyakinan: 'rendah', kontras: tb ? kt : 'tidak_pasti', alasan: al, cahaya: stkRunClip(cahaya, STK_COL.lim.cahaya), saran_foto: sf }, dibuang: dibuang, dibatasi: false };
  if (al.length === 0) return no(dibuang > 0 ? 'langgar' : 'format');   // tebakan tanpa dasar yang terlihat tidak ditampilkan
  const cap = ky === 'tinggi';   // foto tunggal tidak boleh 'tinggi'
  return { ok: true, code: 'ok', msg: '', result: { terbaca: true, undertone: ut, keyakinan: cap ? STK_COL.capKeyakinan : ky, kontras: kt, alasan: al, cahaya: stkRunClip(cahaya, STK_COL.lim.cahaya), saran_foto: sf }, dibuang: dibuang, dibatasi: cap };
}
function stkColorConfirm(res, vein) {   // MURNI: hasil stkColorParse.result + pilihan tes pembuluh darah -> { ok, code, status, final, kandidat, tes, msg }; status: cocok | beda | belum | hanya_tes; final hanya bila pasti
  const no = c => Object.freeze({ ok: false, code: c, status: '', final: null, kandidat: null, tes: null, dekat: false, msg: STK_COL_MSG[c] });
  if (!res || typeof res !== 'object' || Array.isArray(res)) return no('hasil');
  const U = Object.prototype.hasOwnProperty.call(res, 'undertone') ? res.undertone : undefined, B = Object.prototype.hasOwnProperty.call(res, 'terbaca') ? res.terbaca : undefined;
  if ((B !== true && B !== false) || typeof U !== 'string' || STK_COL.undertone.indexOf(U) < 0) return no('hasil');
  if (typeof vein !== 'string' || !Object.prototype.hasOwnProperty.call(STK_COL_VEIN, vein)) return no('tes');
  const tes = STK_COL_VEIN[vein], kand = B === true && U !== 'tidak_pasti' ? U : null;
  const mk = (st, fin, dk, msg) => Object.freeze({ ok: true, code: st, status: st, final: fin, kandidat: kand, tes: tes, dekat: dk, msg: msg });
  if (kand === null && tes === null) return mk('belum', null, false, 'Foto belum memberi kandidat dan tes pembuluh darah belum jelas. Coba tes perhiasan (emas atau perak) atau foto ulang di cahaya jendela siang.');
  if (kand === null) return mk('hanya_tes', tes, false, 'Foto belum memberi kandidat, jadi hasil mengikuti tes pembuluh darah saja: ' + tes + '.');
  if (tes === null) return mk('belum', null, false, 'Kandidat dari foto: ' + kand + '. Tes pembuluh darah belum jelas, jadi ini belum dipastikan.');
  if (kand === tes) return mk('cocok', tes, false, 'Foto dan tes pembuluh darah sama-sama menunjuk ' + tes + '.');
  const dk = kand === 'netral' || tes === 'netral';
  return mk('beda', null, dk, 'Foto menunjuk ' + kand + ', tes pembuluh darah menunjuk ' + tes + '. Belum ada yang dipilih' + (dk ? ' (netral berada di antara hangat dan dingin, jadi bedanya mungkin kecil)' : '') + '. Coba tes perhiasan atau foto ulang di cahaya jendela siang.');
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk4a: Object.freeze({ cfg: STK_COL, vein: STK_COL_VEIN, sys: STK_COL_SYS, user: STK_COL_USER, msg: STK_COL_MSG, parse: stkColorParse, confirm: stkColorConfirm }) }));
/* ===== STK-4a-end ===== */
/* ===== STK-4b1-begin (18 Nov 2026): Dapper > Kamera, bagian 4b-1: ADAPTER MURNI hasil scan warna -> bentuk umum { terbaca, ringkas, catatan, saran_foto } yang dibaca penampil hasil lama (stkResultHtml). BELUM dipasang ke jalur kirim (itu 4b-2), BELUM ada tombol/tampilan baru/jaringan/penyimpanan: pemilik belum melihat perubahan. Alasan: penampil dan penyimpan hasil 3b-3b hanya mengenal bentuk umum; adapter membuat hasil warna tampil di kotak yang SUDAH ada tanpa mengubah satu baris lama. Kalimat ringkas selalu menyebut bahwa ini tebakan dari satu foto dan belum pasti sebelum dicocokkan dengan tes pembuluh darah. ===== */
const STK_COL_NOTE = 'Ini baru tebakan dari satu foto, belum pasti sampai dicocokkan dengan tes pembuluh darah.';
function stkColorBrief(col) {   // MURNI: hasil stkColorParse.result -> { terbaca, ringkas, catatan, saran_foto } atau null bila bukan hasil warna yang sah
  if (!col || typeof col !== 'object' || Array.isArray(col)) return null;
  const own = k => Object.prototype.hasOwnProperty.call(col, k) ? col[k] : undefined;
  const tb = own('terbaca'), ut = own('undertone'), ky = own('keyakinan'), kt = own('kontras'), al = own('alasan'), cv = own('cahaya'), sf = own('saran_foto');
  if (tb !== true && tb !== false) return null;
  if (typeof ut !== 'string' || STK_COL.undertone.indexOf(ut) < 0 || typeof ky !== 'string' || STK_COL.keyakinan.indexOf(ky) < 0 || typeof kt !== 'string' || STK_COL.kontras.indexOf(kt) < 0) return null;
  if (!Array.isArray(al) || !Array.isArray(sf) || typeof cv !== 'string') return null;
  if (al.some(x => typeof x !== 'string') || sf.some(x => typeof x !== 'string')) return null;
  if (tb === false || ut === 'tidak_pasti') return { terbaca: tb, ringkas: tb ? 'Undertone belum bisa ditebak dari foto ini. ' + STK_COL_NOTE : 'Foto wajah belum terbaca cukup jelas untuk menebak warna.', catatan: al.slice(0, STK_COL.lim.items).concat(cv === '' ? [] : ['Cahaya: ' + cv]), saran_foto: sf.slice(0, STK_COL.lim.items) };
  return { terbaca: true, ringkas: 'Kandidat undertone: ' + ut + ' (keyakinan ' + ky + ').' + (kt === 'tidak_pasti' ? '' : ' Kontras: ' + kt + '.') + ' ' + STK_COL_NOTE, catatan: al.slice(0, STK_COL.lim.items).concat(cv === '' ? [] : ['Cahaya: ' + cv]), saran_foto: sf.slice(0, STK_COL.lim.items) };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk4b1: Object.freeze({ brief: stkColorBrief, note: STK_COL_NOTE }) }));
/* ===== STK-4b1-end ===== */
/* ===== STK-4b2-begin (18 Nov 2026): Dapper > Kamera, bagian 4b-2: HUBUNGKAN sudut Wajah ke scan warna. Sudut Wajah memakai petunjuk STK_COL_SYS/STK_COL_USER (bukan petunjuk umum) dan jawabannya diurai stkColorParse (4a), lalu stkColorBrief (4b-1) membuat bentuk umum untuk penampil lama; hasil warna ASLI ikut disimpan beku di STKP.result.warna (untuk 4c). Sudut lain TIDAK berubah. Tetap satu foto = satu permintaan (single). TANPA tampilan baru, TANPA tombol baru, TANPA penyimpanan ke disk. ===== */
function stkColorFreeze(col) {   // MURNI: hasil warna -> salinan beku BARU bila sah (lolos stkColorParse dan tidak berubah olehnya), selain itu null; tidak melempar galat
  try {
    if (!col || typeof col !== 'object' || Array.isArray(col)) return null;
    const g = k => Object.prototype.hasOwnProperty.call(col, k) ? col[k] : undefined;
    const al = g('alasan'), sf = g('saran_foto'); if (!Array.isArray(al) || !Array.isArray(sf)) return null;
    const c = { terbaca: g('terbaca'), undertone: g('undertone'), keyakinan: g('keyakinan'), kontras: g('kontras'), alasan: al.slice(), cahaya: g('cahaya'), saran_foto: sf.slice() };
    const p = stkColorParse(c); if (!p.ok || JSON.stringify(p.result) !== JSON.stringify(c)) return null;
    c.alasan = Object.freeze(c.alasan); c.saran_foto = Object.freeze(c.saran_foto);
    return Object.freeze(c);
  } catch (e) { return null; }
}
function stkColorSame(res, w) {   // MURNI: apakah hasil bentuk umum `res` persis adaptasi dari hasil warna `w`?
  try { const b = stkColorBrief(w); if (b === null || !res || typeof res !== 'object') return false; return JSON.stringify({ terbaca: res.terbaca, ringkas: res.ringkas, catatan: res.catatan, saran_foto: res.saran_foto }) === JSON.stringify(b); } catch (e) { return false; }
}
function stkColorAsk(d) {   // MURNI: jawaban AI sudut Wajah (objek JSON.parse) -> { ok, code, msg, result (bentuk umum), warna (hasil warna beku), dibuang }
  const no = (c, m) => ({ ok: false, code: c, msg: m, result: null, warna: null, dibuang: 0 });
  const p = stkColorParse(d); if (!p.ok) return no(p.code, p.msg);
  const w = stkColorFreeze(p.result), b = w === null ? null : stkColorBrief(w);
  if (b === null || stkResultHtml(b) === '') return no('format', STK_COL_MSG.format);
  return { ok: true, code: 'ok', msg: '', result: b, warna: w, dibuang: p.dibuang };
}
{ const baseSet7 = stkResultSet; stkResultSet = function (run) {   // run dengan `warna` (sudut Wajah): hasil warna ikut disimpan beku; tanpa `warna` = perilaku lama persis
  if (!run || typeof run !== 'object' || !Object.prototype.hasOwnProperty.call(run, 'warna')) return baseSet7.apply(this, arguments);
  if (run.ok !== true) return { ok: false, code: 'ditolak' };
  if (run.mode !== 'wajah') return { ok: false, code: 'mode' };
  const w = stkColorFreeze(run.warna); if (w === null || !stkColorSame(run.result, w)) return { ok: false, code: 'format' };
  const r = baseSet7.call(this, run); if (!r || r.ok !== true) return r;
  const h = STKP.result; if (h !== null && h.url === run.url) STKP.result = Object.freeze(Object.assign({}, h, { warna: w }));
  return r;
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk4b2: Object.freeze({ ask: stkColorAsk, freeze: stkColorFreeze, same: stkColorSame }) }));
/* ===== STK-4b2-end ===== */
/* ===== STK-4c1-begin (18 Nov 2026): Dapper > Kamera, bagian 4c-1: KEADAAN pilihan tes pembuluh darah di memori + rencana tampilan (MURNI). Pilihan terikat pada hasil warna SAAT ITU (objek STKP.result yang sama): hasil diganti/dibuang/foto berganti/persetujuan dicabut = pilihan hilang. BELUM ada tombol dan BELUM ada tampilan (itu 4c-2); hanya bisa dicoba lewat DL.stk4c1 di konsol. Tidak menyimpan ke localStorage/sessionStorage/disk, tanpa jaringan, tanpa waktu, tanpa acak. ===== */
const STK_VEIN_OPT = Object.freeze([Object.freeze(['hijau', 'Lebih hijau']), Object.freeze(['biru_ungu', 'Lebih biru atau ungu']), Object.freeze(['campur', 'Campur, sulit dibedakan']), Object.freeze(['tidak_jelas', 'Tidak jelas'])]);
const STKVN = { ref: null, vein: '' };   // ref = objek hasil (STKP.result) yang dipilihkan; hanya di memori
function stkVeinPlan(h, vein) {   // MURNI: h = hasil tersimpan (STKP.result) atau null; vein = '' (belum) atau kunci STK_COL_VEIN -> { ok, code, show, chosen, confirm }; code: belum | ada | kosong | bukanwajah | tanpawarna | tes
  const no = c => ({ ok: false, code: c, show: false, chosen: '', confirm: null });
  if (!h || typeof h !== 'object' || Array.isArray(h)) return no('kosong');
  const own = k => Object.prototype.hasOwnProperty.call(h, k) ? h[k] : undefined;
  if (own('mode') !== 'wajah') return no('bukanwajah');
  const w = own('warna'); if (stkColorFreeze(w) === null) return no('tanpawarna');
  if (vein === '') return { ok: true, code: 'belum', show: true, chosen: '', confirm: null };
  const c = stkColorConfirm(w, vein); if (!c.ok) return no('tes');
  return { ok: true, code: 'ada', show: true, chosen: vein, confirm: c };
}
function stkVeinClear() { const had = STKVN.vein !== '' || STKVN.ref !== null; STKVN.ref = null; STKVN.vein = ''; return had; }
function stkVeinGet() {   // pilihan SEKARANG; '' bila belum ada atau hasilnya sudah tidak sah/berganti (keadaan lama ikut dibuang)
  const h = stkResultGet();
  if (h === null || STKVN.ref !== h) { STKVN.ref = null; STKVN.vein = ''; return ''; }
  return STKVN.vein;
}
function stkVeinSet(v) {   // -> { ok, code }; hanya untuk hasil Wajah yang masih sah; pilihan tak dikenal ditolak dan pilihan lama tetap
  const h = stkResultGet(), pl = stkVeinPlan(h, typeof v === 'string' && v !== '' ? v : '__tak_dikenal');
  if (!pl.ok) return { ok: false, code: pl.code };
  STKVN.ref = h; STKVN.vein = v; return { ok: true, code: 'ok' };
}
function stkVeinView() { return stkVeinPlan(stkResultGet(), stkVeinGet()); }   // rencana tampilan untuk keadaan sekarang
{ const baseDiscard8 = stkPhDiscard; stkPhDiscard = function () { try { stkVeinClear(); } catch (x) { /* abaikan */ } return baseDiscard8.apply(this, arguments); }; }   // foto dibuang / pindah tab / pindah halaman: pilihan langsung hilang
{ const baseUiSync8 = stkConsentUiSync; stkConsentUiSync = function () { try { return baseUiSync8.apply(this, arguments); } finally { try { stkVeinGet(); } catch (x) { /* abaikan */ } } }; }   // setiap sinkron (foto/persetujuan/AI berubah): pilihan yang hasilnya sudah tidak sah dibuang
window.DL = Object.freeze(Object.assign({}, window.DL, { stk4c1: Object.freeze({ opt: STK_VEIN_OPT, plan: stkVeinPlan, get: stkVeinGet, set: stkVeinSet, clear: stkVeinClear, view: stkVeinView, raw: () => STKVN.ref === null ? null : { vein: STKVN.vein } }) }));
/* ===== STK-4c1-end ===== */
/* ===== STK-4c2-begin (18 Nov 2026): Dapper > Kamera, bagian 4c-2: TAMPILAN kotak "Cocokkan dengan tes pembuluh darah" (#stkVeinBox) tepat di bawah kotak hasil (#stkAskBox), HANYA bila hasil Wajah (warna) masih sah. 4 tombol dari STK_VEIN_OPT; setelah dipilih tampil kalimat stkColorConfirm.msg. Pilihan hanya di memori (4c-1): tidak disimpan, tanpa jaringan, tanpa permintaan Gemini. Semua teks lewat esc(). Membalik: hapus blok ini dan CSS STK-4c2. ===== */
function stkVeinBoxHtml() {   // html kotak; '' bila tidak ada hasil warna yang sah
  const v = stkVeinView(); if (!v.show) return '';
  const chips = STK_VEIN_OPT.map(o => '<button type="button" class="stk-ac-chip' + (o[0] === v.chosen ? ' stk-ac-on' : '') + '" aria-pressed="' + (o[0] === v.chosen ? 'true' : 'false') + '" data-q="stkVeinPick" data-v="' + o[0] + '">' + esc(o[1]) + '</button>').join('');
  const msg = v.code === 'ada' && v.confirm && typeof v.confirm.msg === 'string' ? '<p class="stk-rs-p" data-fk="stk-vein-msg">' + esc(v.confirm.msg) + '</p>' : '';
  return '<div class="stk-rs stk-vein"><p class="stk-rs-t"><strong>Cocokkan dengan tes pembuluh darah</strong></p><p class="stk-rs-p">Lihat pembuluh darah di pergelangan tangan di cahaya siang. Warnanya lebih ke mana?</p><div class="stk-ac-m">' + chips + '</div>' + msg + '<p class="stk-rs-n">Pilihan ini belum disimpan dan hilang bila foto atau hasil diganti.</p></div>';
}
function stkVeinUiSync() {   // memasang/memperbarui/membuang #stkVeinBox; idempoten; urutan: #stkAskBox lalu #stkVeinBox
  const box = $('#stkPhBox'); if (!box) return;
  let el = box.querySelector('#stkVeinBox'), html = '';
  try { html = stkVeinBoxHtml(); } catch (x) { html = ''; }
  const anchor = box.querySelector('#stkAskBox');
  if (!html || !anchor) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'stkVeinBox'; el.className = 'stk-askbox'; el.setAttribute('aria-live', 'polite'); }
  if (el.previousElementSibling !== anchor) anchor.after(el);
  if (el.dataset.h === html) return;
  el.dataset.h = html; el.innerHTML = html;
}
{ const baseUiSync9 = stkConsentUiSync; stkConsentUiSync = function () { try { return baseUiSync9.apply(this, arguments); } finally { try { stkVeinUiSync(); } catch (x) { /* abaikan */ } } }; }
{ const baseSet9 = stkResultSet; stkResultSet = function () { const r = baseSet9.apply(this, arguments); try { stkVeinUiSync(); } catch (x) { /* abaikan */ } return r; }; }
{ const baseClr9 = stkResultClear; stkResultClear = function () { const r = baseClr9.apply(this, arguments); try { stkVeinUiSync(); } catch (x) { /* abaikan */ } return r; }; }
{ const baseDiscard9 = stkPhDiscard; stkPhDiscard = function () { const r = baseDiscard9.apply(this, arguments); try { stkVeinUiSync(); } catch (x) { /* abaikan */ } return r; }; }
QACT.stkVeinPick = function (el) {
  const v = el && el.dataset ? el.dataset.v : ''; if (typeof v !== 'string' || v === '') return;
  const r = stkVeinSet(v); try { stkVeinUiSync(); } catch (x) { /* abaikan */ }
  if (r && r.ok === true) { try { const b = $('#stkVeinBox [data-v="' + v + '"]'); if (b && b.focus) b.focus(); } catch (x) { /* abaikan */ } }
};
window.DL = Object.freeze(Object.assign({}, window.DL, { stk4c2: Object.freeze({ html: stkVeinBoxHtml, sync: stkVeinUiSync }) }));
/* ===== STK-4c2-end ===== */
/* ===== STK-5a-begin (18 Nov 2026): Dapper > Kamera, bagian 5a: LOGIKA MURNI "cek outfit": petunjuk AI (STK_OUT_SYS), kalimat pengguna menurut nada dan konteks (stkOutfitUser), dan penguraian jawaban AI (stkOutfitParse) menjadi 5 rincian bernilai 1 sampai 5 + DUA skor terpisah ("Cocok untukmu" dan "Lagi tren") + yang sudah bagus + yang bisa naik + SATU usulan ganti. BELUM ada tombol, BELUM ada tampilan, BELUM dihubungkan ke stkAskRun, BELUM ada jaringan: pemilik belum melihat perubahan di layar; semua fungsi MURNI (tidak membaca/menulis keadaan aplikasi). Rancangan STYOTK-R0: menilai PAKAIAN dan potongan, TIDAK menilai tubuh (tidak ada bidang skor tubuh, tidak ada satu angka gabungan, kata terlarang tentang tubuh/identitas/kesehatan/kulit dibuang). ===== */
const STK_OUT = Object.freeze({
  rincian: Object.freeze([
    Object.freeze({ id: 'ukuran_pas', label: 'Ukuran pas' }), Object.freeze({ id: 'proporsi', label: 'Proporsi' }), Object.freeze({ id: 'harmoni_warna', label: 'Harmoni warna' }),
    Object.freeze({ id: 'cocok_acara', label: 'Cocok acara' }), Object.freeze({ id: 'kerapian', label: 'Kerapian' })
  ]),
  nada: Object.freeze(['halus', 'apa_adanya']),
  acara: Object.freeze([['kerja', 'Kerja'], ['santai', 'Santai'], ['ibadah', 'Ibadah'], ['resmi', 'Acara resmi'], ['olahraga', 'Olahraga']].map(a => Object.freeze(a))),   // sama dengan HA_LIST (HR-4a)
  undertone: Object.freeze(['hangat', 'dingin', 'netral']),
  skor: Object.freeze({ min: 1, max: 5 }),
  lim: Object.freeze({ ringkas: 400, catatan: 220, alasan: 280, butir: 220, items: 4, scan: 20, saran: 280, minRincian: 3 }),
  ask: Object.freeze({ max: 1400, think: 1024 })   // usulan batas keluaran untuk 5c (jawaban outfit lebih panjang dari STK_ASK.maxTok 900)
});
const STK_OUT_BAN = /\b(?:(?:bmi|imt|obesitas|kegemukan|overweight|underweight|diagnos\w*|kg|kurus|gemuk|gendut|langsing|buncit|montok|bongsor|etnis\w*|ras|suku|bule|pribumi|jenis\s*kelamin|cantik|jelek|tampan|seksi|norak|murahan|kampungan|memalukan|umur|usia|jerawat|ruam|penyakit|kelainan|menyamarkan)(?:nya|mu|ku)?)\b|berat\s*badan|lemak\s*tubuh|(tubuh|badan|perut|paha|lengan|pinggang|pinggul|dada)\s+(yang\s+)?(ideal|sempurna|jelek|bagus|besar|kecil|berisi|gemuk|kurus|ramping|rata|buncit)|(membuat|bikin|menjadikan)\s+(kamu|anda|dirimu)\s+(terlihat|tampak|kelihatan|jadi)|(membuat|bikin|menjadikan)\s+(tubuh|badan|perut|paha|lengan|pinggang|kulit|wajah)\b|kulit\s+(yang\s+)?(lebih\s+)?(cerah|putih|terang|gelap|hitam)|(terlihat|tampak|kelihatan)\s+(lebih\s+)?(menarik|muda|tua)/i;
const STK_OUT_TREN_NOTE = 'Skor tren hanya perkiraan dari pengetahuan AI dan bisa sudah basi; untuk yang terkini lihat Tren sekarang (bertanggal dan bersumber).';
const STK_OUT_MSG = Object.freeze({
  format: 'Jawaban AI tidak sesuai format, jadi tidak ditampilkan. Coba lagi.',
  langgar: 'Jawaban AI menyebut hal yang dilarang (penilaian tubuh, identitas, kesehatan, atau kulit), jadi tidak ditampilkan. Coba lagi.',
  tanpaAcara: 'Acara belum dipilih, jadi kecocokan acara tidak dinilai.',
  tidakTerbaca: 'Foto outfit belum terbaca cukup jelas untuk dinilai.'
});
const STK_OUT_RULES = 'Aturan wajib: jawab dalam bahasa Indonesia. Hanya bicara tentang PAKAIAN dan potongannya yang TERLIHAT di foto. Jangan menilai tubuh, jangan menebak identitas, jenis kelamin, etnis, umur, atau kondisi kesehatan, jangan memberi diagnosis, jangan menyebut berat badan, BMI, kurus, atau gemuk, jangan menyebut kulit lebih cerah atau lebih gelap, dan jangan memuji atau merendahkan penampilan orangnya. Pujian dan saran hanya untuk pakaian. Jangan membuat satu angka gabungan. Tiap skor adalah bilangan bulat 1 sampai 5 (1 = banyak yang perlu diperbaiki, 3 = cukup, 5 = sangat baik), atau null bila tidak bisa dinilai dari foto; jangan menebak. Beri alasan nyata untuk tiap skor yang bukan null. Bila foto tidak menampakkan pakaian atau terlalu gelap atau buram, isi terbaca false dan jangan mengarang.';
const STK_OUT_SCHEMA = 'Jawab HANYA dengan JSON tanpa teks lain: { "terbaca": boolean, "ringkas": string, "rincian": [ { "id": "ukuran_pas" | "proporsi" | "harmoni_warna" | "cocok_acara" | "kerapian", "skor": 1-5 atau null, "catatan": string } ], "cocok": { "skor": 1-5 atau null, "alasan": string }, "tren": { "skor": 1-5 atau null, "alasan": string }, "sudah_bagus": [string], "bisa_naik": [string], "usulan_ganti": { "dari": string, "jadi": string, "alasan": string } atau null, "saran_foto": [string] }. "rincian" berisi kelima id (ukuran pas: apakah potongan pas di bahu, lengan, dan panjang pakaian; proporsi: keseimbangan atas dan bawah dan panjang potongan; harmoni_warna: kecocokan warna antarbagian pakaian; cocok_acara: kecocokan dengan acara yang disebut, null bila acara tidak disebut; kerapian: lipatan, kerah, kebersihan). "cocok" = seberapa cocok outfit ini untuk KONTEKS pengguna yang diberikan (acara dan undertone bila disebut), bukan penilaian tubuh. "tren" = perkiraanmu tentang seberapa sesuai outfit dengan gaya yang sedang populer; bisa basi, jangan menyebut tahun, merek, atau harga. "usulan_ganti" = SATU usulan mengganti satu butir pakaian (dari, jadi, alasan), atau null bila sudah baik. "saran_foto" = cara memotret ulang agar hasil lebih jelas.';
const STK_OUT_SYS = 'Kamu asisten pengamat pakaian dari foto OUTFIT untuk menilai kecocokan dan kerapian pakaian. ' + STK_OUT_RULES + ' ' + STK_OUT_SCHEMA;
const STK_OUT_TONE = Object.freeze({
  halus: 'Nada halus dan membesarkan hati: sebut yang sudah bagus lebih dulu dan sampaikan saran sebagai ajakan.',
  apa_adanya: 'Nada apa adanya: jujur dan langsung, tetap sopan, hanya soal pakaian, tanpa merendahkan.'
});
const STK_OUT_OWN = (o, k) => Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;
function stkOutfitUser(ctx) {   // MURNI: ctx = { nada, acara, undertone } (semua boleh kosong atau tidak sah) -> kalimat pengguna untuk AI; tidak melempar galat
  const c = ctx && typeof ctx === 'object' && !Array.isArray(ctx) ? ctx : {};
  const nd = STK_OUT.nada.indexOf(STK_OUT_OWN(c, 'nada')) >= 0 ? c.nada : 'halus';
  const ac = typeof STK_OUT_OWN(c, 'acara') === 'string' ? STK_OUT.acara.find(a => a[0] === c.acara) : undefined;
  const ut = STK_OUT.undertone.indexOf(STK_OUT_OWN(c, 'undertone')) >= 0 ? c.undertone : null;
  return 'Nilai foto outfit ini. ' + STK_OUT_TONE[nd] + ' ' +
    (ac ? 'Acara yang dituju: ' + ac[1] + '.' : 'Acara belum dipilih, jadi isi skor cocok_acara dengan null.') + ' ' +
    (ut ? 'Undertone kulit pengguna (dari pengguna sendiri, bukan dari foto ini): ' + ut + '.' : 'Undertone pengguna tidak diketahui: jangan menebaknya dari foto; nilai harmoni warna hanya antarbagian pakaian.');
}
function stkOutScore(v) {   // MURNI: skor mentah -> { v: null | 1..5 (bulat), r: dibulatkan? } atau null bila tidak sah
  if (v === null || v === undefined) return { v: null, r: false };
  let n = v;
  if (typeof v === 'string') { const t = v.trim(); if (!/^\d(\.\d+)?$/.test(t)) return null; n = Number(t); }
  if (typeof n !== 'number' || !Number.isFinite(n) || n < STK_OUT.skor.min || n > STK_OUT.skor.max) return null;
  const r = Math.round(n); return { v: r, r: r !== n };
}
function stkOutFreeze(o) { if (o !== null && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) stkOutFreeze(o[k]); } return o; }
function stkOutfitParse(d, ctx) {   // MURNI: jawaban AI (objek hasil JSON.parse) + konteks { acara } -> { ok, code, msg, result, dibuang, dibulatkan }; result beku dan berbentuk tetap
  const no = c => ({ ok: false, code: c, msg: STK_OUT_MSG[c], result: null, dibuang: 0, dibulatkan: 0 });
  if (!d || typeof d !== 'object' || Array.isArray(d)) return no('format');
  const own = k => STK_OUT_OWN(d, k), L = STK_OUT.lim;
  const acOk = ctx && typeof ctx === 'object' && !Array.isArray(ctx) && typeof STK_OUT_OWN(ctx, 'acara') === 'string' && STK_OUT.acara.some(a => a[0] === ctx.acara);
  const tb = own('terbaca'); if (tb !== true && tb !== false) return no('format');
  const rg = own('ringkas'); if (typeof rg !== 'string') return no('format');
  let ring = stkRunClean(rg);
  if (STK_OUT_BAN.test(ring)) return no('langgar');
  if (ring === '') { if (tb === true) return no('format'); ring = STK_OUT_MSG.tidakTerbaca; }
  let dibuang = 0, dibulat = 0;
  const list = (k, max) => {
    const v = own(k); if (v === undefined || v === null) return [];
    if (!Array.isArray(v)) return null;
    const out = [];
    for (const x of v.slice(0, L.scan)) {
      if (typeof x !== 'string') return null;
      const t = stkRunClean(x); if (t === '') continue;
      if (STK_OUT_BAN.test(t)) { dibuang++; continue; }
      out.push(stkRunClip(t, max));
    }
    return out.slice(0, L.items);
  };
  const sf = list('saran_foto', L.saran); if (sf === null) return no('format');
  const kosong = () => STK_OUT.rincian.map(r => ({ id: r.id, label: r.label, skor: null, catatan: '' }));
  const dua = () => ({ skor: null, alasan: '' });
  const tren0 = s => Object.assign({}, s, { basi: true, catatan: STK_OUT_TREN_NOTE });
  if (tb === false) return { ok: true, code: 'ok', msg: '', result: stkOutFreeze({ terbaca: false, ringkas: stkRunClip(ring, L.ringkas), rincian: kosong(), cocok: dua(), tren: tren0(dua()), sudah_bagus: [], bisa_naik: [], usulan: null, saran_foto: sf }), dibuang: dibuang, dibulatkan: 0 };
  // --- rincian
  const rin = own('rincian'); if (!Array.isArray(rin)) return no('format');
  const rows = kosong(), seen = new Set();
  for (const x of rin.slice(0, L.scan)) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return no('format');
    const g = k => STK_OUT_OWN(x, k), idv = g('id'); if (typeof idv !== 'string') return no('format');
    const row = rows.find(r => r.id === idv.trim().toLowerCase());
    if (!row || seen.has(row.id)) { dibuang++; continue; }   // id tak dikenal (mis. penilaian tubuh) atau ganda: dibuang
    seen.add(row.id);
    const sc = stkOutScore(g('skor')); if (sc === null) return no('format');
    const cv = g('catatan'); if (cv !== undefined && cv !== null && typeof cv !== 'string') return no('format');
    const cat = typeof cv === 'string' ? stkRunClean(cv) : '';
    if (STK_OUT_BAN.test(cat)) { dibuang++; continue; }
    if (sc.v !== null && cat === '') { dibuang++; continue; }   // skor tanpa alasan tidak ditampilkan
    row.skor = sc.v; row.catatan = stkRunClip(cat, L.catatan); if (sc.r) dibulat++;
  }
  const ca = rows.find(r => r.id === 'cocok_acara'); if (!acOk) { ca.skor = null; ca.catatan = STK_OUT_MSG.tanpaAcara; }   // tanpa acara: tidak dinilai, apa pun kata AI
  if (rows.filter(r => r.skor !== null).length < L.minRincian) return no(dibuang > 0 ? 'langgar' : 'format');
  // --- dua skor terpisah
  const two = k => {
    const v = own(k); if (v === null) return dua(); if (!v || typeof v !== 'object' || Array.isArray(v)) return 'format';
    const sc = stkOutScore(STK_OUT_OWN(v, 'skor')); if (sc === null) return 'format';
    const av = STK_OUT_OWN(v, 'alasan'); if (av !== undefined && av !== null && typeof av !== 'string') return 'format';
    const al = typeof av === 'string' ? stkRunClean(av) : '';
    if (STK_OUT_BAN.test(al)) return 'langgar';
    if (sc.v !== null && al === '') { dibuang++; return dua(); }   // skor tanpa alasan tidak ditampilkan
    if (sc.r) dibulat++;
    return { skor: sc.v, alasan: stkRunClip(al, L.alasan) };
  };
  const co = two('cocok'), tr = two('tren');
  if (typeof co === 'string') return no(co); if (typeof tr === 'string') return no(tr);
  // --- yang bagus, yang bisa naik, satu usulan ganti
  const sb = list('sudah_bagus', L.butir), bn = list('bisa_naik', L.butir); if (sb === null || bn === null) return no('format');
  if (sb.length === 0 && bn.length === 0) return no(dibuang > 0 ? 'langgar' : 'format');   // ulasan kosong tidak ditampilkan
  let us = null; const uv = own('usulan_ganti');
  if (uv !== undefined && uv !== null) {
    if (typeof uv !== 'object' || Array.isArray(uv)) return no('format');
    const f = {}; for (const k of ['dari', 'jadi', 'alasan']) { const v = STK_OUT_OWN(uv, k); if (typeof v !== 'string') return no('format'); f[k] = stkRunClean(v); }
    if (f.dari === '' || f.jadi === '' || f.alasan === '' || STK_OUT_BAN.test(f.dari + ' ' + f.jadi + ' ' + f.alasan)) dibuang++;
    else us = { dari: stkRunClip(f.dari, L.butir), jadi: stkRunClip(f.jadi, L.butir), alasan: stkRunClip(f.alasan, L.alasan) };
  }
  return { ok: true, code: 'ok', msg: '', result: stkOutFreeze({ terbaca: true, ringkas: stkRunClip(ring, L.ringkas), rincian: rows, cocok: co, tren: tren0(tr), sudah_bagus: sb, bisa_naik: bn, usulan: us, saran_foto: sf }), dibuang: dibuang, dibulatkan: dibulat };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk5a: Object.freeze({ cfg: STK_OUT, sys: STK_OUT_SYS, user: stkOutfitUser, msg: STK_OUT_MSG, trenNote: STK_OUT_TREN_NOTE, parse: stkOutfitParse }) }));
/* ===== STK-5a-end ===== */
/* ===== STK-5b-begin (18 Nov 2026): Dapper > Kamera, bagian 5b: ADAPTER MURNI hasil cek outfit (STK-5a) -> bentuk umum { terbaca, ringkas, catatan, saran_foto } yang dibaca penampil hasil lama (stkResultHtml) + SALINAN BEKU hasil outfit + PEMBUNGKUS stkResultSet yang menyimpan hasil outfit asli (beku) di STKP.result.outfit untuk kartu 5d. BELUM dihubungkan ke jalur kirim (itu 5c), BELUM ada tombol/tampilan baru/jaringan/penyimpanan ke disk: pemilik belum melihat perubahan. Hasil outfit hanya di memori dan hilang bersama hasil lama bila foto berganti. Dua skor tetap TERPISAH (tidak ada angka gabungan); skor tren selalu bertanda perkiraan/basi. ===== */
function stkOutfitCopy(o) {   // MURNI: hasil stkOutfitParse.result -> salinan BARU (belum beku) bila bentuknya persis sah, selain itu null; tidak melempar galat, tidak mengubah masukan
  try {
    const isO = x => x !== null && typeof x === 'object' && !Array.isArray(x);
    const g = (x, k) => Object.prototype.hasOwnProperty.call(x, k) ? x[k] : undefined;
    const keys = (x, ks) => { const a = Object.keys(x); return a.length === ks.length && ks.every(k => a.indexOf(k) >= 0); };
    const L = STK_OUT.lim;
    const txt = (v, max, kosongOk) => typeof v === 'string' && v === stkRunClean(v) && Array.from(v).length <= max && (kosongOk || v !== '') && !STK_OUT_BAN.test(v);
    const sk = v => v === null || (typeof v === 'number' && Number.isInteger(v) && v >= STK_OUT.skor.min && v <= STK_OUT.skor.max);
    const arr = (v, max) => Array.isArray(v) && v.length <= L.items && Array.from(v).every(x => txt(x, max, false));   // Array.from: lubang pada larik jarang dibaca sebagai undefined (every melewatinya)
    if (!isO(o) || !keys(o, ['terbaca', 'ringkas', 'rincian', 'cocok', 'tren', 'sudah_bagus', 'bisa_naik', 'usulan', 'saran_foto'])) return null;
    const tb = g(o, 'terbaca'); if (tb !== true && tb !== false) return null;
    const rg = g(o, 'ringkas'); if (!txt(rg, L.ringkas, false)) return null;
    const rin = g(o, 'rincian'); if (!Array.isArray(rin) || rin.length !== STK_OUT.rincian.length) return null;
    const rows = [];
    for (let i = 0; i < rin.length; i++) {
      const x = rin[i], def = STK_OUT.rincian[i];
      if (!isO(x) || !keys(x, ['id', 'label', 'skor', 'catatan'])) return null;
      const s = g(x, 'skor'), c = g(x, 'catatan');
      if (g(x, 'id') !== def.id || g(x, 'label') !== def.label || !sk(s) || !txt(c, L.catatan, true) || (s !== null && c === '')) return null;
      rows.push({ id: def.id, label: def.label, skor: s, catatan: c });
    }
    const two = (v, tren) => {
      if (!isO(v) || !keys(v, tren ? ['skor', 'alasan', 'basi', 'catatan'] : ['skor', 'alasan'])) return null;
      const s = g(v, 'skor'), a = g(v, 'alasan');
      if (!sk(s) || !txt(a, L.alasan, true) || (s !== null && a === '')) return null;
      if (!tren) return { skor: s, alasan: a };
      if (g(v, 'basi') !== true || g(v, 'catatan') !== STK_OUT_TREN_NOTE) return null;
      return { skor: s, alasan: a, basi: true, catatan: STK_OUT_TREN_NOTE };
    };
    const co = two(g(o, 'cocok'), false), tr = two(g(o, 'tren'), true); if (co === null || tr === null) return null;
    const sb = g(o, 'sudah_bagus'), bn = g(o, 'bisa_naik'), sf = g(o, 'saran_foto');
    if (!arr(sb, L.butir) || !arr(bn, L.butir) || !arr(sf, L.saran)) return null;
    const uv = g(o, 'usulan'); let us = null;
    if (uv !== null) {
      if (!isO(uv) || !keys(uv, ['dari', 'jadi', 'alasan'])) return null;
      const a = g(uv, 'dari'), b = g(uv, 'jadi'), c = g(uv, 'alasan');
      if (!txt(a, L.butir, false) || !txt(b, L.butir, false) || !txt(c, L.alasan, false)) return null;
      us = { dari: a, jadi: b, alasan: c };
    }
    const n = rows.filter(r => r.skor !== null).length;
    if (tb) { if (n < L.minRincian || (sb.length === 0 && bn.length === 0)) return null; }
    else if (n !== 0 || co.skor !== null || co.alasan !== '' || tr.skor !== null || tr.alasan !== '' || sb.length || bn.length || us !== null || rows.some(r => r.catatan !== '')) return null;
    return { terbaca: tb, ringkas: rg, rincian: rows, cocok: co, tren: tr, sudah_bagus: sb.slice(), bisa_naik: bn.slice(), usulan: us, saran_foto: sf.slice() };
  } catch (e) { return null; }
}
function stkOutfitFreezeCopy(o) { const c = stkOutfitCopy(o); return c === null ? null : stkOutFreeze(c); }   // MURNI: salinan beku BARU atau null
function stkOutfitBrief(o) {   // MURNI: hasil outfit sah -> { terbaca, ringkas, catatan, saran_foto } (bentuk umum penampil lama) atau null; paling banyak 6 butir catatan
  const c = stkOutfitCopy(o); if (c === null) return null;
  const clip = t => stkRunClip(t, STK_RUN_LIM.item), sf = c.saran_foto.slice(0, STK_RUN_LIM.items).map(clip);
  if (!c.terbaca) return { terbaca: false, ringkas: c.ringkas, catatan: [], saran_foto: sf };
  const nilai = r => (r.skor === null ? 'belum bisa dinilai' : r.skor + ' dari 5') + (r.alasan === '' ? '' : ' \u2014 ' + r.alasan);
  const cat = [clip('Cocok untukmu: ' + nilai(c.cocok)), clip('Lagi tren (perkiraan, bisa basi): ' + nilai(c.tren))];
  const nr = c.rincian.filter(r => r.skor !== null).map(r => r.label + ' ' + r.skor);
  if (nr.length) cat.push(clip('Rincian: ' + nr.join(', ')));
  if (c.sudah_bagus.length) cat.push(clip('Sudah bagus: ' + c.sudah_bagus.join('; ')));
  if (c.bisa_naik.length) cat.push(clip('Bisa naik: ' + c.bisa_naik.join('; ')));
  if (c.usulan !== null) cat.push(clip('Usulan ganti: dari ' + c.usulan.dari + ' jadi ' + c.usulan.jadi + ' \u2014 ' + c.usulan.alasan));
  return { terbaca: true, ringkas: c.ringkas, catatan: cat.slice(0, STK_RUN_LIM.items), saran_foto: sf };
}
function stkOutfitSame(res, o) {   // MURNI: apakah hasil bentuk umum `res` persis adaptasi dari hasil outfit `o`?
  try { const b = stkOutfitBrief(o); if (b === null || !res || typeof res !== 'object') return false; return JSON.stringify({ terbaca: res.terbaca, ringkas: res.ringkas, catatan: res.catatan, saran_foto: res.saran_foto }) === JSON.stringify(b); } catch (e) { return false; }
}
function stkOutfitAsk(d, ctx) {   // MURNI: jawaban AI sudut Outfit (objek JSON.parse) + konteks { acara } -> { ok, code, msg, result (bentuk umum), outfit (hasil outfit beku), dibuang, dibulatkan }
  const no = (c, m) => ({ ok: false, code: c, msg: m, result: null, outfit: null, dibuang: 0, dibulatkan: 0 });
  const p = stkOutfitParse(d, ctx); if (!p.ok) return no(p.code, p.msg);
  const o = stkOutfitFreezeCopy(p.result), b = o === null ? null : stkOutfitBrief(o);
  if (b === null || stkResultHtml(b) === '') return no('format', STK_OUT_MSG.format);
  return { ok: true, code: 'ok', msg: '', result: b, outfit: o, dibuang: p.dibuang, dibulatkan: p.dibulatkan };
}
{ const baseSet10 = stkResultSet; stkResultSet = function (run) {   // run dengan `outfit` (sudut Outfit): hasil outfit ikut disimpan beku; tanpa `outfit` = perilaku lama persis
  if (!run || typeof run !== 'object' || !Object.prototype.hasOwnProperty.call(run, 'outfit')) return baseSet10.apply(this, arguments);
  if (run.ok !== true) return { ok: false, code: 'ditolak' };
  if (run.mode !== 'outfit' || Object.prototype.hasOwnProperty.call(run, 'warna')) return { ok: false, code: 'mode' };
  const o = stkOutfitFreezeCopy(run.outfit); if (o === null || !stkOutfitSame(run.result, o)) return { ok: false, code: 'format' };
  const r = baseSet10.call(this, run); if (!r || r.ok !== true) return r;
  const h = STKP.result; if (h !== null && h.url === run.url) STKP.result = Object.freeze(Object.assign({}, h, { outfit: o }));
  return r;
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk5b: Object.freeze({ ask: stkOutfitAsk, brief: stkOutfitBrief, freeze: stkOutfitFreezeCopy, same: stkOutfitSame }) }));
/* ===== STK-5b-end ===== */
/* ===== STK-5c-begin (18 Nov 2026): Dapper > Kamera, bagian 5c: HUBUNGKAN sudut Outfit ke jalur kirim. Sudut Outfit kini memakai petunjuk STK_OUT_SYS (5a) dan kalimat pengguna stkOutfitUser(ctx) dengan ACARA HARI INI dari DL.hr4a.get (HR-4a); batas keluaran STK_OUT.ask.max (1400); jawaban AI diurai stkOutfitAsk (5b); hasil outfit asli ikut keluar dari stkAskRun sebagai kunci `outfit` (pembungkus stkResultSet 5b menyimpannya beku). Konteks dibaca SATU KALI per kirim (octx) dan dipakai untuk kalimat pengguna DAN penguraian. `undertone` selalu kosong (tidak dikirim, AI dilarang menebak) dan `nada` selalu 'apa_adanya' (keputusan pemilik 18 Nov 2026; tanpa pilihan nada). Pengungkapan jujur: kontrol kirim sudut Outfit menampilkan kalimat tentang teks yang ikut dikirim selain foto (acara hari ini), sebelum tombol Kirim. Sudut depan/samping/wajah TIDAK berubah. Tanpa tampilan hasil baru (itu 5d), tanpa penyimpanan ke disk, tanpa jaringan baru. Membalik: hapus blok ini dan kembalikan 4 baris stkAskRun (lihat patch). ===== */
function stkOutfitCtx(ev) {   // MURNI: id acara mentah (apa pun) -> { nada, acara (id sah atau ''), undertone } beku; tidak melempar galat
  const ok = typeof ev === 'string' && STK_OUT.acara.some(a => a[0] === ev);
  return Object.freeze({ nada: 'apa_adanya', acara: ok ? ev : '', undertone: '' });
}
function stkOutfitCtxNow() {   // konteks outfit untuk SEKARANG: acara hari ini dari HR-4a; gagal baca = tanpa acara
  let ev = ''; try { const h = window.DL && window.DL.hr4a; ev = h && typeof h.get === 'function' ? h.get() : ''; } catch (e) { ev = ''; }
  return stkOutfitCtx(ev);
}
function stkAskArgs(spec, octx) {   // MURNI: spec (hasil stkAskPlan) + konteks outfit -> { system, user, max } untuk AI.ask; depan/samping memakai petunjuk umum, wajah petunjuk warna, outfit petunjuk outfit
  const sp = spec && typeof spec === 'object' ? spec : {};
  if (sp.mode === 'wajah') return { system: STK_COL_SYS, user: STK_COL_USER, max: sp.max };
  if (sp.mode === 'outfit') return { system: STK_OUT_SYS, user: stkOutfitUser(octx), max: STK_OUT.ask.max };
  return { system: sp.system, user: sp.user, max: sp.max };
}
function stkAskReply(mode, d, octx) {   // MURNI: jawaban AI + sudut -> hasil penguraian sudut itu (wajah: stkColorAsk; outfit: stkOutfitAsk; lainnya: stkAskParse)
  return mode === 'wajah' ? stkColorAsk(d) : mode === 'outfit' ? stkOutfitAsk(d, octx) : stkAskParse(d);
}
function stkOutfitNote(ctx) {   // MURNI: konteks -> kalimat jujur tentang teks yang ikut dikirim selain foto
  const c = ctx && typeof ctx === 'object' && !Array.isArray(ctx) ? ctx : {};
  const a = typeof STK_OUT_OWN(c, 'acara') === 'string' ? STK_OUT.acara.find(x => x[0] === c.acara) : undefined;
  return a ? 'Selain foto dan petunjuk standar, ikut dikirim: acara hari ini (' + a[1] + ').' : 'Selain foto dan petunjuk standar, tidak ada yang ikut dikirim. Acara hari ini belum dipilih, jadi kecocokan acara tidak dinilai.';
}
{ const baseCtl5c = stkAskCtlHtml; stkAskCtlHtml = function (o) {   // sudut Outfit (tidak sedang mengirim): kalimat pengungkapan tepat sebelum tombol Kirim; sudut lain tanpa perubahan
  const h = baseCtl5c.apply(this, arguments);
  if (!o || typeof o !== 'object' || o.sending === true || o.mode !== 'outfit') return h;
  const i = h.indexOf('<button type="button" class="stk-go stk-ac-b" data-q="stkAskSend"'); if (i < 0) return h;
  return h.slice(0, i) + '<p class="nw-fine stk-ac-n" id="stkAcN">' + esc(stkOutfitNote(stkOutfitCtxNow())) + '</p>' + h.slice(i);
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk5c: Object.freeze({ ctx: stkOutfitCtx, ctxNow: stkOutfitCtxNow, args: stkAskArgs, reply: stkAskReply, note: stkOutfitNote }) }));
/* ===== STK-5c-end ===== */
/* ===== STK-5d1-begin (18 Nov 2026): Dapper > Kamera, bagian 5d-1: KARTU HASIL OUTFIT, MURNI (stkOutfitCardHtml): hasil outfit beku (STK-5b, kelak STKP.result.outfit) -> html kartu. BELUM dipasang ke halaman, BELUM ada CSS (kelas stk-of-* diberi gaya di 5d-2), BELUM ada tombol/jaringan: pemilik belum melihat perubahan di layar; hanya bisa dicoba lewat DL.stk5d1.card(obj) di konsol. Kartu memeriksa ulang masukan lewat stkOutfitCopy (bentuk persis, batas panjang, kata terlarang): tidak sah = ''. Semua teks AI lewat esc(). DUA skor terpisah (Cocok untukmu, Lagi tren), TANPA angka gabungan; skor tren selalu bertanda perkiraan/basi + catatan; skor null = "Tidak bisa dinilai"; titik skor hanya hiasan (aria-hidden), angkanya selalu tertulis. Membalik: hapus blok ini. ===== */
const STK_OF_NA = 'Tidak bisa dinilai';
function stkOfScoreText(s) { return s === null ? STK_OF_NA : s + ' dari ' + STK_OUT.skor.max; }   // MURNI: skor bulat 1..5 atau null -> teks; selain itu STK_OF_NA
function stkOfPips(s) {   // MURNI: skor bulat 1..5 -> 5 titik hiasan (aria-hidden); null/tidak sah -> ''
  if (typeof s !== 'number' || !Number.isInteger(s) || s < STK_OUT.skor.min || s > STK_OUT.skor.max) return '';
  let h = ''; for (let i = 1; i <= STK_OUT.skor.max; i++) h += '<span class="stk-of-pip' + (i <= s ? ' stk-of-on' : '') + '"></span>';
  return '<span class="stk-of-pips" aria-hidden="true">' + h + '</span>';
}
function stkOutfitCardHtml(o) {   // MURNI: hasil outfit sah -> html kartu; '' bila tidak sah; tidak mengubah masukan, tidak melempar galat
  try {
    const c = stkOutfitCopy(o); if (c === null) return '';
    const label = 'aria-label="Hasil cek outfit dari AI"';
    const note = '<p class="nw-fine stk-of-n">' + esc(STK_RS_NOTE) + '</p>';
    const ul = (k, h, a) => a.length ? '<div class="stk-of-' + k + '"><h5 class="stk-of-h">' + h + '</h5><ul class="stk-of-ul">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
    if (!c.terbaca) return '<section class="stk-of stk-of-no" ' + label + '><h4 class="stk-t stk-of-t">Foto belum terbaca jelas</h4><p class="nw-p stk-of-p">' + esc(c.ringkas) + '</p>' + ul('sf', 'Saran foto berikutnya', c.saran_foto) + note + '</section>';
    const val = s => '<p class="stk-of-v"><strong class="stk-of-num">' + esc(stkOfScoreText(s)) + '</strong>' + stkOfPips(s) + '</p>';
    const co = '<div class="stk-of-sc stk-of-co"><h5 class="stk-of-h">Cocok untukmu</h5>' + val(c.cocok.skor) + (c.cocok.alasan ? '<p class="stk-of-a">' + esc(c.cocok.alasan) + '</p>' : '') + '</div>';
    const tr = '<div class="stk-of-sc stk-of-tr"><h5 class="stk-of-h">Lagi tren <span class="stk-of-tag">perkiraan, bisa basi</span></h5>' + val(c.tren.skor) + (c.tren.alasan ? '<p class="stk-of-a">' + esc(c.tren.alasan) + '</p>' : '') + '<p class="nw-fine stk-of-tn">' + esc(c.tren.catatan) + '</p></div>';
    const rows = c.rincian.map(r => '<li class="stk-of-r"><span class="stk-of-rn">' + esc(r.label) + '</span><span class="stk-of-rv"><strong class="stk-of-num">' + esc(stkOfScoreText(r.skor)) + '</strong>' + stkOfPips(r.skor) + '</span>' + (r.catatan ? '<span class="stk-of-rc">' + esc(r.catatan) + '</span>' : '') + '</li>').join('');
    const us = c.usulan === null ? '' : '<div class="stk-of-us"><h5 class="stk-of-h">Usulan ganti</h5><p class="stk-of-ug"><span class="stk-of-k">Dari</span> ' + esc(c.usulan.dari) + '</p><p class="stk-of-ug"><span class="stk-of-k">Jadi</span> ' + esc(c.usulan.jadi) + '</p><p class="stk-of-a">' + esc(c.usulan.alasan) + '</p></div>';
    return '<section class="stk-of" ' + label + '><h4 class="stk-t stk-of-t">Cek outfit</h4><p class="nw-p stk-of-p">' + esc(c.ringkas) + '</p><div class="stk-of-two">' + co + tr + '</div><h5 class="stk-of-h">Rincian</h5><ul class="stk-of-rl">' + rows + '</ul>' + ul('sb', 'Yang sudah bagus', c.sudah_bagus) + ul('bn', 'Yang bisa naik', c.bisa_naik) + us + ul('sf', 'Saran foto berikutnya', c.saran_foto) + note + '</section>';
  } catch (e) { return ''; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk5d1: Object.freeze({ card: stkOutfitCardHtml, pips: stkOfPips, score: stkOfScoreText, na: STK_OF_NA }) }));
/* ===== STK-5d1-end ===== */
/* ===== STK-5d2-begin (18 Nov 2026): Dapper > Kamera, bagian 5d-2b: PASANG KARTU hasil Outfit (stkOutfitCardHtml, 5d-1) di #stkAskBox, MENGGANTIKAN penampil lama untuk hasil outfit (keputusan pemilik 18 Nov 2026 butir 4 = "iya"). Hanya bila hasil yang masih sah membawa kunci `outfit` (STK-5b) DAN kartu menghasilkan html tidak kosong; selain itu penampil lama PERSIS (sudut depan/samping/wajah, atau kartu tidak sah). Pembungkus stkAskBoxHtml: 0 baris lama diubah. Tanpa tombol, tautan, input, jaringan, penyimpanan baru. Membalik: hapus blok ini dan CSS STK-5d2. ===== */
{ const baseBox7 = stkAskBoxHtml; stkAskBoxHtml = function () {
  const h = stkResultGet(); if (h === null) return '';
  if (h.outfit) { let c = ''; try { c = stkOutfitCardHtml(h.outfit); } catch (x) { c = ''; } if (c) return c; }
  return baseBox7.apply(this, arguments);
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk5d2: Object.freeze({ html: stkAskBoxHtml }) }));
/* ===== STK-5d2-end ===== */
/* ===== STK-5e1-begin (18 Nov 2026): Dapper > Kamera, kartu "Menyusul di tab ini" disesuaikan dengan kenyataan: STK-3 sampai STK-5 (scan badan, scan warna, cek outfit) sudah jalan, jadi butirnya DIBUANG; yang benar-benar belum: STK-6 (Tren sekarang) dan STK-4d (simpan hasil warna, menunggu tab Badan & warna, keputusan pemilik 18 Nov 2026). Hanya mengubah isi daftar STK_SOON (pola yang sama dengan tahap-tahap sebelumnya); 0 baris lama diubah. Membalik: hapus blok ini. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-3 sampai STK-5'); if (i >= 0) STK_SOON.splice(i, 1, ['Tren sekarang: kartu bertanggal dan bersumber dari pencarian web', 'STK-6'], ['Simpan hasil warna (menunggu tab Badan & warna)', 'STK-4d']); })();
/* ===== STK-5e1-end ===== */
/* ===== STK-5e2-begin (18 Nov 2026): Dapper > Kamera, bagian 5e-2: PILIHAN NADA sudut Outfit (Halus / Apa adanya), koreksi pemilik 18 Nov 2026 ("no. 4 ada pilihan nada"; menggantikan tafsiran 5d-2a bahwa nada selalu "apa adanya"). Pilihan hanya di MEMORI (STKN.nada, bawaan 'apa_adanya' = jawaban pemilik; tanpa penyimpanan baru), tampil HANYA di sudut Outfit (dua tombol sebelum kalimat pengungkapan), dan menentukan `nada` pada konteks yang dikirim (pembungkus stkOutfitCtxNow; fungsi murni 5a/5c tidak diubah). Sudut lain tanpa perubahan. Membalik: hapus blok ini. ===== */
const STKN = { nada: 'apa_adanya' };
const STK_TONE_OPTS = Object.freeze([['halus', 'Halus'], ['apa_adanya', 'Apa adanya']]);
{ const baseNow = stkOutfitCtxNow; stkOutfitCtxNow = function () {
  const c = baseNow.apply(this, arguments);
  return Object.freeze(Object.assign({}, c, { nada: STK_TONE_OPTS.some(o => o[0] === STKN.nada) ? STKN.nada : 'apa_adanya' }));
}; }
{ const baseCtl6 = stkAskCtlHtml; stkAskCtlHtml = function (o) {
  const h = baseCtl6.apply(this, arguments);
  const i = h.indexOf('<p class="nw-fine stk-ac-n" id="stkAcN">'); if (i < 0) return h;
  const chips = STK_TONE_OPTS.map(t => '<button type="button" class="stk-ac-chip' + (t[0] === STKN.nada ? ' stk-ac-on' : '') + '" aria-pressed="' + (t[0] === STKN.nada ? 'true' : 'false') + '" data-q="stkTone" data-m="' + t[0] + '">' + esc(t[1]) + '</button>').join('');
  return h.slice(0, i) + '<p class="nw-fine stk-ac-l" id="stkTnL">Nada penilaian</p><div class="stk-ac-m" role="group" aria-labelledby="stkTnL">' + chips + '</div>' + h.slice(i);
}; }
QACT.stkTone = function (el) { const m = el && el.dataset ? el.dataset.m : ''; if (stkAskSending() || !STK_TONE_OPTS.some(x => x[0] === m)) return; STKN.nada = m; stkConsentUiSync(); stkAskFocus('[data-q="stkTone"][data-m="' + m + '"]'); };
window.DL = Object.freeze(Object.assign({}, window.DL, { stk5e2: Object.freeze({ opts: STK_TONE_OPTS, get: () => STKN.nada }) }));
/* ===== STK-5e2-end ===== */
/* ===== STK-6a-begin (18 Nov 2026): Dapper > Kamera, bagian 6a: LOGIKA MURNI "Tren sekarang" (permintaan ke AI dengan pencarian web, penguraian jawaban teks, validasi sumber, usia tanggal). BELUM ada tombol, BELUM ada tampilan, BELUM memanggil AI: hanya fungsi murni (DL.stk6a). TEMUAN (menutup keputusan terbuka nomor 6 rancangan STYOTK-R0): bidang `web` di AI.ask NYATA = pencarian Google (grounding, aiRequest: tools google_search) dan mengembalikan sumber (src), kueri, dan entry; TAPI tidak bisa dipakai bersama keluaran JSON, jadi jawaban tren berupa TEKS BEBAS berformat baris yang diurai ketat di sini. Aturan: tren hanya tampil bila ada pencarian web DAN minimal satu sumber (tanpa itu = pengetahuan model yang bisa basi, tidak ditampilkan); tanggal = tanggal permintaan (WITA perangkat); tren = klaim sumber, bukan data penjualan; kata terlarang STK_OUT_BAN (tubuh/penilaian orang) menjatuhkan butir; tanpa data pribadi dan tanpa foto yang dikirim. 0 baris lama diubah. Membalik: hapus blok ini. ===== */
const STK_TREN_LIM = Object.freeze({ maxItem: 6, nama: 60, isi: 220, pakai: 200, ringkas: 300, src: 8, judul: 120, entry: 30000, stale: 30 });
const STK_TREN_SYS = 'Kamu asisten fashion. Gunakan pencarian Google untuk menemukan tren fashion pakaian pria yang sedang berjalan SEKARANG. Hanya bahas pakaian, sepatu, dan aksesori; jangan menilai tubuh atau orang; jangan menyebut harga; jangan mengarang: bila tidak yakin, lewati. Jawab HANYA dalam format ini, tanpa tanda bintang atau tabel: satu baris "RINGKAS: <satu kalimat>" lalu 3 sampai 6 baris "TREN: <nama singkat> | <apa itu, satu kalimat> | <cara memakainya, satu kalimat>". Bahasa Indonesia.';
function stkTrenIso(d) {   // MURNI: Date -> 'YYYY-MM-DD' (waktu lokal perangkat); bukan Date sah = ''
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const p = n => (n < 10 ? '0' : '') + n; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function stkTrenReq(iso) {   // MURNI: tanggal -> argumen AI.ask (web, tanpa ulang, tanpa foto, tanpa data pribadi)
  const d = typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '';
  return Object.freeze({ task: 'stkTren', system: STK_TREN_SYS, user: (d ? 'Tanggal hari ini: ' + d + '. ' : '') + 'Cari tren fashion pakaian pria yang sedang berjalan sekarang.', web: true, single: true, max: 700, think: 2048, timeout: 60000 });
}
function stkTrenDays(iso, nowIso) {   // MURNI: selisih hari bulat (now - iso); salah satu tidak sah atau di masa depan = null
  const re = /^(\d{4})-(\d{2})-(\d{2})$/, a = typeof iso === 'string' ? re.exec(iso) : null, b = typeof nowIso === 'string' ? re.exec(nowIso) : null;
  if (!a || !b) return null;
  const ua = Date.UTC(+a[1], +a[2] - 1, +a[3]), ub = Date.UTC(+b[1], +b[2] - 1, +b[3]);
  if (isNaN(ua) || isNaN(ub) || new Date(ua).getUTCDate() !== +a[3] || new Date(ub).getUTCDate() !== +b[3]) return null;
  const n = Math.round((ub - ua) / 86400000); return n < 0 ? null : n;
}
function stkTrenClean(s) {   // MURNI: teks AI -> satu baris bersih (tanpa markup, kurung sudut, spasi ganda)
  return String(s).replace(/[*_`#<>]/g, ' ').replace(/\s+/g, ' ').trim();
}
function stkTrenParse(text) {   // MURNI: teks AI -> { ringkas, items:[{nama,isi,pakai}] }; baris tidak sah DIJATUHKAN (tidak dipotong); tidak melempar galat
  const out = { ringkas: '', items: [] }; if (typeof text !== 'string') return out;
  const seen = {};
  text.replace(/```[a-z]*/gi, '').split(/\r?\n/).forEach(raw => {
    const m = /^\s*(?:[-•*]+\s*|\d+[.)]\s*)?\**\s*(RINGKAS|TREN)\s*\**\s*:\s*(.*)$/i.exec(raw); if (!m) return;
    const kind = m[1].toUpperCase(), body = m[2];
    if (kind === 'RINGKAS') { const r = stkTrenClean(body); if (!out.ringkas && r && r.length <= STK_TREN_LIM.ringkas && !STK_OUT_BAN.test(r)) out.ringkas = r; return; }
    if (out.items.length >= STK_TREN_LIM.maxItem) return;
    const p = body.split('|'); if (p.length !== 3) return;
    const nama = stkTrenClean(p[0]), isi = stkTrenClean(p[1]), pakai = stkTrenClean(p[2]);
    if (!nama || !isi || !pakai || nama.length > STK_TREN_LIM.nama || isi.length > STK_TREN_LIM.isi || pakai.length > STK_TREN_LIM.pakai) return;
    if (STK_OUT_BAN.test(nama + ' | ' + isi + ' | ' + pakai) || /https?:|www\./i.test(nama + isi + pakai)) return;
    const k = nama.toLowerCase(); if (seen[k]) return; seen[k] = 1;
    out.items.push(Object.freeze({ nama, isi, pakai }));
  });
  out.items = Object.freeze(out.items); return Object.freeze(out);
}
function stkTrenView(r, iso) {   // MURNI: hasil AI.ask (ok, text, src, queries, entry, noWeb) + tanggal -> { ok:true, ... } | { ok:false, code, msg }; tidak melempar galat
  const bad = (code, msg) => Object.freeze({ ok: false, code, msg });
  if (!r || typeof r !== 'object' || Array.isArray(r)) return bad('gagal', 'Tren belum bisa diambil. Coba lagi nanti.');
  if (r.ok !== true) return bad('gagal', typeof r.msg === 'string' && r.msg ? r.msg.slice(0, 300) : 'Tren belum bisa diambil. Coba lagi nanti.');
  if (r.noWeb === true) return bad('noweb', 'Pencarian web tidak tersedia, jadi tren tidak ditampilkan (jawaban tanpa pencarian bisa sudah basi).');
  const src = [], seen = {};
  (Array.isArray(r.src) ? r.src : []).forEach(s => {
    if (src.length >= STK_TREN_LIM.src || !s || typeof s !== 'object' || typeof s.uri !== 'string' || !/^https?:\/\/[^\s]+$/i.test(s.uri) || s.uri.length > 600 || seen[s.uri]) return;
    seen[s.uri] = 1; src.push(Object.freeze({ uri: s.uri, title: typeof s.title === 'string' ? stkTrenClean(s.title).slice(0, STK_TREN_LIM.judul) : '' }));
  });
  if (!src.length) return bad('tanpasumber', 'Jawaban tidak membawa sumber web, jadi tren tidak ditampilkan (tanpa sumber tidak bisa dicek).');
  const p = stkTrenParse(r.text);
  if (!p.items.length) return bad('kosong', 'Jawaban AI tidak bisa dibaca sebagai daftar tren. Coba lagi.');
  const d = typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '';
  return Object.freeze({ ok: true, date: d, ringkas: p.ringkas, items: p.items, src: Object.freeze(src), queries: Object.freeze((Array.isArray(r.queries) ? r.queries : []).filter(q => typeof q === 'string' && q.trim()).map(q => stkTrenClean(q).slice(0, 120)).slice(0, 5)), entry: typeof r.entry === 'string' ? r.entry.slice(0, STK_TREN_LIM.entry) : '', cut: r.cut === true });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk6a: Object.freeze({ lim: STK_TREN_LIM, sys: STK_TREN_SYS, iso: stkTrenIso, req: stkTrenReq, days: stkTrenDays, parse: stkTrenParse, view: stkTrenView }) }));
/* ===== STK-6a-end ===== */
/* ===== STK-6b-begin (18 Nov 2026): Dapper > Kamera, bagian 6b: KEADAAN + PEMANGGIL "Tren sekarang" (hanya memori). BELUM ada tombol, BELUM ada tampilan. KOREKSI atas 6a (ditemukan 18 Nov 2026 saat membaca aiRequest): aiRequest TIDAK memeriksa pengaturan pemilik "Pencarian web (Google)"; semua pemanggil lain mengirim web: aiWebOn(). stkTrenReq (6a) memakai web:true tetap, jadi pemanggil di sini WAJIB memeriksa aiWebOn() lebih dulu: mati = AI TIDAK dipanggil sama sekali, pesan jelas (gaya "Hanya data" punya pesan sendiri). Aturan: satu permintaan sekaligus; hasil sah terakhir TIDAK ditimpa oleh permintaan yang gagal (tetap membawa tanggalnya, usia dihitung stkTrenAge); batal didukung dan hasil terlambat dari permintaan yang dibatalkan atau digantikan DIBUANG; tidak pernah melempar galat. 0 baris lama diubah. Membalik: hapus blok ini. ===== */
const STKTR = { st: 'idle', code: '', msg: '', res: null, seq: 0 };   // st: idle | loading | ok | err; hanya di memori; res = hasil sah terakhir (beku) atau null
const STK_TREN_MSG = Object.freeze({
  webmati: 'Pencarian web sedang mati, jadi tren tidak dicari (jawaban tanpa pencarian bisa sudah basi). Nyalakan di Pengaturan › Preferensi › AI › Pencarian web (Google).',
  webdata: 'Gaya jawaban "Hanya data" tidak memakai pencarian web, jadi tren tidak dicari. Ganti gaya jawaban di Pengaturan › Preferensi › AI bila ingin memakai tren.',
  sibuk: 'Pencarian tren masih berjalan.',
  galat: 'Tren belum bisa diambil. Coba lagi nanti.'
});
function stkTrenGate(o) {   // MURNI: o = { on (aiWebOn(), dibaca ketat === true), scope } -> { ok:true } | { ok:false, code, msg }
  const q = o && typeof o === 'object' ? o : {};
  if (q.on === true) return Object.freeze({ ok: true });
  const code = q.scope === 'data' ? 'webdata' : 'webmati';
  return Object.freeze({ ok: false, code, msg: STK_TREN_MSG[code] });
}
function stkTrenAge(res, nowIso) {   // MURNI: hasil tren + tanggal sekarang -> { days, stale } | null (tanpa hasil, tanggal hasil kosong atau tidak sah)
  if (!res || typeof res !== 'object') return null;
  const n = stkTrenDays(res.date, nowIso); if (n === null) return null;
  return Object.freeze({ days: n, stale: n > STK_TREN_LIM.stale });
}
function stkTrenSnap() {   // salinan beku keadaan untuk tampilan (6c); age dihitung terhadap hari ini
  return Object.freeze({ st: STKTR.st, code: STKTR.code, msg: STKTR.msg, res: STKTR.res, age: stkTrenAge(STKTR.res, stkTrenIso(new Date())) });
}
async function stkTrenRun() {   // -> { ok:true, code:'ok', res } | { ok:false, code, msg }; tidak pernah melempar galat
  if (STKTR.st === 'loading') return { ok: false, code: 'sibuk', msg: STK_TREN_MSG.sibuk };
  let g; try { g = stkTrenGate({ on: aiWebOn(), scope: adb.scope }); } catch (e) { g = { ok: false, code: 'galat', msg: STK_TREN_MSG.galat }; }
  if (!g.ok) { STKTR.st = 'err'; STKTR.code = g.code; STKTR.msg = g.msg; return { ok: false, code: g.code, msg: g.msg }; }
  const my = ++STKTR.seq, iso = stkTrenIso(new Date());
  STKTR.st = 'loading'; STKTR.code = ''; STKTR.msg = '';
  let r; try { r = await AI.ask(stkTrenReq(iso)); } catch (e) { r = null; }
  if (my !== STKTR.seq) return { ok: false, code: 'cancelled', msg: '' };   // dibatalkan atau digantikan: hasil terlambat dibuang
  if (r && r.ok === false && r.code === 'cancelled') { STKTR.st = STKTR.res ? 'ok' : 'idle'; return { ok: false, code: 'cancelled', msg: '' }; }   // dibatalkan dari luar (fitur AI lain)
  const v = stkTrenView(r, iso);
  if (!v.ok) { STKTR.st = 'err'; STKTR.code = v.code; STKTR.msg = v.msg; return { ok: false, code: v.code, msg: v.msg }; }   // res lama TIDAK ditimpa
  STKTR.st = 'ok'; STKTR.res = v; return { ok: true, code: 'ok', res: v };
}
function stkTrenCancel() {   // true bila ada permintaan tren yang dibatalkan
  if (STKTR.st !== 'loading') return false;
  STKTR.seq++; STKTR.st = STKTR.res ? 'ok' : 'idle'; STKTR.code = ''; STKTR.msg = '';
  try { AI.cancel(); } catch (e) { /* abaikan */ }
  return true;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk6b: Object.freeze({ msg: STK_TREN_MSG, gate: stkTrenGate, age: stkTrenAge, snap: stkTrenSnap, run: stkTrenRun, cancel: stkTrenCancel }) }));
/* ===== STK-6b-end ===== */
/* ===== KPT-2a-begin (19 Nov 2026): Dapper > Kamera, penutupan tab: keputusan "Tren sekarang" = A (TIDAK dibangun; Era & gaya sudah punya "Sedang tren", lihat KPT-1). Butir STK-6 dibuang dari kartu "Menyusul"; kartu yang kini hanya memuat butir yang menunggu tab lain berlabel "Menunggu" (bukan "Segera"); kaki kartu tidak lagi menyebut STK-6. Hanya menambah blok ini: 0 baris lama diubah. Membalik: hapus blok ini. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-6'); if (i >= 0) STK_SOON.splice(i, 1); })();
{ const baseSoonHtml = stkSoonHtml; stkSoonHtml = function () { return baseSoonHtml.apply(this, arguments).replace('<span class="nw-soon">Segera</span>', '<span class="nw-soon">Menunggu</span>').replace('(STK-1b sampai STK-6)', '(STK-1b sampai STK-5)'); }; }
/* ===== KPT-2a-end ===== */
/* ===== STB-1a-begin (19 Nov 2026): Dapper > Badan & warna, bagian 1a: LOGIKA MURNI "ukuran dan rasio" (stbBodyRead): membaca profil dan audit mingguan yang SUDAH ada, menghitung rasio lingkar dan perubahannya sejak pekan pertama. BELUM ada tombol, tampilan, penyimpanan, jaringan, waktu, atau acak. Tidak ada skor, kategori, atau kata penilai: hanya angka dan arah. ===== */
const STB_LIM = Object.freeze({ waist: Object.freeze([40, 200]), chest: Object.freeze([50, 200]), thigh: Object.freeze([25, 120]), arm: Object.freeze([15, 80]), tinggi: Object.freeze([120, 230]) });   // batas wajar (cm); di luar batas = DIBUANG dan dihitung, bukan dipaksa jadi angka
const STB_KEYS = Object.freeze(['waist', 'chest', 'thigh', 'arm']);
const STB_RATIOS = Object.freeze([['dadaPinggang', 'chest', 'waist'], ['pahaPinggang', 'thigh', 'waist'], ['lenganPinggang', 'arm', 'waist']]);   // [id, pembilang, penyebut]; pinggangTinggi dihitung terpisah (penyebutnya tinggi profil)
function stbBodyRead(profile, weeks) {   // MURNI: (profil, audit mingguan) -> keluaran beku { status, profil, jumlahPekan, dibuang, ukuran, rasio, catatan }
  const own = (o, k) => (o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k)) ? o[k] : undefined;
  const parse = v => { if (typeof v !== 'string' && typeof v !== 'number') return null; const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const isEmpty = v => v === undefined || v === null || v === '';
  const r1 = x => Math.round(x * 10) / 10, r3 = x => Math.round(x * 1000) / 1000;
  const dir = d => d > 0 ? 'naik' : d < 0 ? 'turun' : 'tetap';
  const fz = o => { Object.freeze(o); Object.keys(o).forEach(k => { const v = o[k]; if (v && typeof v === 'object' && !Object.isFrozen(v)) fz(v); }); return o; };
  const catatan = [];
  const hRaw = own(profile, 'tinggi'), hNum = isEmpty(hRaw) ? null : parse(hRaw);
  const tinggiOk = hNum !== null && hNum >= STB_LIM.tinggi[0] && hNum <= STB_LIM.tinggi[1];
  const jkRaw = own(profile, 'jk'), jk = jkRaw === 'L' || jkRaw === 'P' ? jkRaw : '';
  if (isEmpty(hRaw)) catatan.push('tinggi_kosong'); else if (!tinggiOk) catatan.push('tinggi_luar');
  if (!jk) catatan.push('jk_kosong');
  const byWeek = {}; let dibuang = 0;
  if (weeks && typeof weeks === 'object' && !Array.isArray(weeks)) {
    Object.keys(weeks).filter(w => /^\d{4}-\d{2}-\d{2}$/.test(w)).forEach(w => {
      const e = weeks[w]; if (!e || typeof e !== 'object') return;
      STB_KEYS.forEach(k => {
        const raw = own(e, k); if (isEmpty(raw)) return;
        const n = parse(raw);
        if (n === null || n < STB_LIM[k][0] || n > STB_LIM[k][1]) { dibuang++; return; }
        (byWeek[w] || (byWeek[w] = {}))[k] = n;
      });
    });
  }
  const wk = Object.keys(byWeek).sort();
  const ukuran = {};
  STB_KEYS.forEach(k => {
    const pts = wk.filter(w => byWeek[w][k] !== undefined).map(w => ({ w, v: byWeek[w][k] }));
    if (!pts.length) { ukuran[k] = { n: 0, kini: null, awal: null, selisih: null, arah: null }; return; }
    const a = pts[0], b = pts[pts.length - 1], d = pts.length > 1 ? r1(b.v - a.v) : null;
    ukuran[k] = { n: pts.length, kini: { w: b.w, v: b.v }, awal: { w: a.w, v: a.v }, selisih: d, arah: d === null ? null : dir(d) };
  });
  const mkRatio = pts => {   // pts = [{w, r}] urut pekan -> { n, nilai, w, awal, wAwal, selisih, arah } atau null
    if (!pts.length) return null;
    const a = pts[0], b = pts[pts.length - 1], d = pts.length > 1 ? r3(b.r - a.r) : null;
    return { n: pts.length, nilai: r3(b.r), w: b.w, awal: r3(a.r), wAwal: a.w, selisih: d, arah: d === null ? null : dir(d) };
  };
  const rasio = {};
  STB_RATIOS.forEach(([id, top, bot]) => { rasio[id] = mkRatio(wk.filter(w => byWeek[w][top] !== undefined && byWeek[w][bot] !== undefined).map(w => ({ w, r: byWeek[w][top] / byWeek[w][bot] }))); });
  rasio.pinggangTinggi = tinggiOk ? mkRatio(wk.filter(w => byWeek[w].waist !== undefined).map(w => ({ w, r: byWeek[w].waist / hNum }))) : null;
  const anyRatio = Object.keys(rasio).some(k => rasio[k] !== null);
  const status = !wk.length ? 'kosong' : anyRatio ? 'ok' : 'sebagian';
  if (wk.length === 1) catatan.push('satu_pekan');
  if (dibuang > 0) catatan.push('ada_dibuang');
  if (wk.length && !anyRatio) catatan.push('tanpa_pasangan');
  return fz({ status, profil: { tinggi: tinggiOk ? hNum : null, jk }, jumlahPekan: wk.length, dibuang, ukuran, rasio, catatan });
}
function stbBodyNow() { return stbBodyRead(typeof pfd === 'function' ? pfd() : null, typeof wdb === 'object' ? wdb : null); }   // membaca keadaan hidup aplikasi (profil + audit mingguan); tidak mengubah apa pun
window.DL = Object.freeze(Object.assign({}, window.DL, { stb1a: Object.freeze({ lim: STB_LIM, keys: STB_KEYS, read: stbBodyRead, now: stbBodyNow }) }));
/* ===== STB-1a-end ===== */
/* ===== STB-1b-begin (19 Nov 2026): Dapper > Badan & warna, bagian 1b: TAMPILAN kartu "Ukuran dan rasio kamu" (HANYA BACA, dari stbBodyNow() = profil + audit mingguan yang sudah ada). Tanpa penyimpanan baru, tanpa jaringan, tanpa AI, tanpa skor, tanpa kategori, tanpa warna baik/buruk: hanya angka dan arah (naik, turun, tetap). Membalik: hapus blok STB-1b dan CSS STB-1b. ===== */
const STB_BL = Object.freeze({ waist: 'Perut (navel)', chest: 'Dada', thigh: 'Paha', arm: 'Lengan (bicep)' });
const STB_RL = Object.freeze({ dadaPinggang: 'Dada ÷ perut', pahaPinggang: 'Paha ÷ perut', lenganPinggang: 'Lengan ÷ perut', pinggangTinggi: 'Perut ÷ tinggi' });
const STB_SOON = Object.freeze([['Panduan potongan: bahu, panjang celana, aturan sepertiga', 'STB-1c'], ['Undertone, palet musiman, dan aturan 60-30-10', 'STB-2'], ['Virtual draping untuk mencoba warna', 'STB-2']]);
const STB_MON = Object.freeze(['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']);
function stbF(x, d) { return Number(x).toFixed(d).replace('.', ','); }   // angka Indonesia: koma desimal
function stbD(w, yr) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(w); if (!m) return ''; const mo = +m[2]; if (mo < 1 || mo > 12) return ''; return (+m[3]) + '\u00a0' + STB_MON[mo - 1] + (yr ? '\u00a0' + m[1] : ''); }   // spasi TAK-TERPUTUS: tanggal tidak patah di tengah (mis. "5 / Okt" di layar sempit)
function stbArrow(a) { return a === 'naik' ? '↑' : a === 'turun' ? '↓' : '→'; }
function stbChange(arah, sel, dec, unit, wAwal, wKini) {   // kalimat perubahan netral; satu pekan = belum ada perbandingan
  if (arah === null || arah === undefined) return 'baru satu pekan terisi';
  const since = ' sejak ' + stbD(wAwal, String(wAwal).slice(0, 4) !== String(wKini).slice(0, 4));
  if (arah === 'tetap') return 'tetap' + since;
  return arah + ' ' + stbF(Math.abs(sel), dec) + (unit ? ' ' + unit : '') + since;
}
function stbRowHtml(name, val, sub, arah) {
  return '<li class="stb-r"><span class="stb-rn">' + esc(name) + '</span><span class="stb-rv"><b class="stb-num">' + esc(val) + '</b></span><span class="stb-rc">' + (arah ? '<span class="stb-ar" aria-hidden="true">' + stbArrow(arah) + '</span> ' : '') + esc(sub) + '</span></li>';
}
function stbBodyHtml(r) {   // MURNI: keluaran stbBodyRead -> teks HTML kartu
  const has = k => r.catatan.indexOf(k) >= 0;
  const weekBtn = '<div class="stb-act"><button class="btn sm" data-q="openWeek" data-fk="stb-week">Buka Audit mingguan</button></div>';
  let h = '<section class="nw-card stb-card" id="stbBody" aria-label="Ukuran dan rasio kamu"><div class="nw-hd"><h3>Ukuran dan rasio kamu</h3></div>';
  if (r.status === 'kosong') {
    h += '<p class="nw-p stb-m">Belum ada lingkar tubuh yang bisa dibaca. Isi Perut, Dada, Paha, atau Lengan di Audit mingguan, lalu angkanya muncul di sini.</p>';
    if (has('ada_dibuang')) h += '<p class="nw-p stb-m">' + r.dibuang + ' isian lingkar di luar batas wajar tidak dihitung. Periksa angkanya di Audit mingguan.</p>';
    h += weekBtn;
  } else {
    const us = STB_KEYS.filter(k => r.ukuran[k].n > 0);
    h += '<h4 class="stb-h">Lingkar tubuh</h4><ul class="stb-rl">' + us.map(k => { const u = r.ukuran[k]; return stbRowHtml(STB_BL[k], stbF(u.kini.v, 1) + ' cm', 'pekan ' + stbD(u.kini.w) + ' · ' + stbChange(u.arah, u.selisih, 1, 'cm', u.awal.w, u.kini.w), u.arah); }).join('') + '</ul>';
    const rs = Object.keys(STB_RL).filter(k => r.rasio[k] !== null);
    if (rs.length) h += '<h4 class="stb-h">Rasio</h4><ul class="stb-rl">' + rs.map(k => { const x = r.rasio[k]; return stbRowHtml(STB_RL[k], stbF(x.nilai, 3), 'pekan ' + stbD(x.w) + ' · ' + stbChange(x.arah, x.selisih, 3, '', x.wAwal, x.w), x.arah); }).join('') + '</ul>';
    const notes = [];
    if (has('satu_pekan')) notes.push('Baru satu pekan terisi, jadi belum ada perubahan untuk dibandingkan.');
    if (has('tanpa_pasangan')) notes.push('Rasio butuh dua lingkar dari pekan yang sama, misalnya Dada dan Perut.');
    else if (['dadaPinggang', 'pahaPinggang', 'lenganPinggang'].some(k => r.rasio[k] === null)) notes.push('Rasio yang belum tampil menunggu lingkarnya diisi pada pekan yang sama di Audit mingguan.');
    if (has('ada_dibuang')) notes.push(r.dibuang + ' isian lingkar di luar batas wajar tidak dihitung. Periksa angkanya di Audit mingguan.');
    const needH = r.ukuran.waist.n > 0 && r.rasio.pinggangTinggi === null;
    if (needH && has('tinggi_kosong')) notes.push('Isi tinggi badan di Profil agar Perut ÷ tinggi dihitung.');
    if (needH && has('tinggi_luar')) notes.push('Tinggi di Profil di luar ' + STB_LIM.tinggi[0] + '–' + STB_LIM.tinggi[1] + ' cm, jadi Perut ÷ tinggi tidak dihitung.');
    h += notes.map(t => '<p class="stb-n">' + esc(t) + '</p>').join('');
    h += '<div class="stb-act">' + (needH ? '<button class="btn sm" data-q="bkProfile" data-fk="stb-prof">Buka Profil</button>' : '') + '<button class="btn sm" data-q="openWeek" data-fk="stb-week">Buka Audit mingguan</button></div>';
  }
  return h + '<p class="nw-fine">Angka dihitung di perangkat kamu dari Audit mingguan dan Profil. Rasio = satu lingkar dibagi lingkar lain pada pekan yang sama; dipakai untuk membaca bentuk dan potongan pakaian, bukan untuk menilai tubuh.</p></section>';
}
function stbSoonHtml() { return '<section class="nw-card" id="stbSoon"><div class="nw-hd"><h3>Menyusul di tab ini</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + STB_SOON.map(x => '<li>' + esc(x[0]) + ' <span class="hr-tg">(' + esc(x[1]) + ')</span></li>').join('') + '</ul><p class="nw-fine">Tab Badan & warna dikerjakan bertahap, satu bagian per tahap.</p></section>'; }
function stbMount() { const root = $('#nwDapperBody'), card = root && root.querySelector('.nw-card'); if (!card) return; const w = document.createElement('div'); w.id = 'stbWrap'; w.innerHTML = stbBodyHtml(stbBodyNow()) + stbSoonHtml(); card.replaceWith(w); }
{ const baseNwStb = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;   // fokus dipulihkan sesudah kartu diganti
  baseNwStb.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'badan') { stbMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb1b: Object.freeze({ html: stbBodyHtml, soon: STB_SOON, mount: stbMount }) }));
/* ===== STB-1b-end ===== */
/* ===== STB-1c-begin (19 Nov 2026): Dapper > Badan & warna, bagian 1c: kartu "Panduan potongan umum" (cara pakaian jatuh di badan: bahu, lengan, panjang jas, panjang celana, aturan sepertiga). Isi tetap = data di kode dengan rujukan web yang dicek 19 Nov 2026 (kalimat ditulis ulang, bukan salinan); angka kamu dibaca dari stbBodyNow(). Tanpa penyimpanan baru, tanpa jaringan, tanpa AI, tanpa skor, tanpa kategori tubuh. Membalik: hapus blok STB-1c dan CSS STB-1c. ===== */
const STC_CEK = '2026-11-19';
const STC_REF = Object.freeze({
  pc: Object.freeze({ n: 'Proper Cloth', u: 'https://propercloth.com/reference/how-jacket-sleeve-length-should-fit/' }),
  ss: Object.freeze({ n: 'SuitShop', u: 'https://suitshop.com/blogs/news/how-should-a-suit-jacket-fit/' }),
  le: Object.freeze({ n: 'Lands\u2019 End', u: 'https://www.landsend.com/article/how-should-a-jacket-fit/' }),
  sa: Object.freeze({ n: 'Sartoro', u: 'https://sartoro.co/blogs/sartorial/how-long-should-suit-pants-be' }),
  eg: Object.freeze({ n: 'Effortless Gent', u: 'https://effortlessgent.com/suit-trousers-break-trouser-length/' }),
  wo: Object.freeze({ n: 'Wardrobe Oxygen', u: 'https://www.wardrobeoxygen.com/pant-length-tips-hemming-trousers/' }),
  ik: Object.freeze({ n: 'inkl', u: 'https://inkl.com/news/the-rule-of-thirds-a-beginner-s-guide-to-transforming-your-look' }),
  hh: Object.freeze({ n: 'Hayden Hill', u: 'https://haydenhill.co/blogs/journal/rule-of-thirds-fashion' }),
  cc: Object.freeze({ n: 'Chip Chick', u: 'https://www.chipchick.com/2024/03/you-can-use-the-famous-rule-of-thirds-to-balance-out-your-outfit-and-create-a-look-thats-as-cohesive-and-proportional-as-possible.html' })
});
const STC_GRUP = Object.freeze({ atas: 'Atasan dan jaket', celana: 'Celana', sepertiga: 'Proporsi pakaian: aturan sepertiga' });
const STC_ITEMS = Object.freeze([
  Object.freeze({ id: 'bahu', g: 'atas', u: '*', r: ['ss', 'le'], t: 'Jahitan bahu duduk di ujung bahu kamu, tepat di tempat bahu mulai turun ke lengan. Jika jahitan jatuh di lengan atas, pakaian kemungkinan terlalu besar di bahu; jika naik ke arah leher, kemungkinan terlalu kecil.' }),
  Object.freeze({ id: 'lengan', g: 'atas', u: '*', r: ['pc'], t: 'Lengan jaket atau blazer menyisakan sekitar 0,6 sampai 1,3 cm manset kemeja yang terlihat saat tangan menggantung di sisi badan.' }),
  Object.freeze({ id: 'panjangJas', g: 'atas', u: 'L', r: ['ss'], t: 'Panjang jas menutupi bagian atas pantat dan berhenti kira-kira di buku jari saat tangan menggantung rileks.' }),
  Object.freeze({ id: 'sepatu', g: 'celana', u: '*', r: ['wo'], t: 'Ukur atau permak panjang celana sambil memakai sepatu yang akan dipakai bersamanya, supaya hem jatuh sesuai sepatu itu.' }),
  Object.freeze({ id: 'hemL', g: 'celana', u: 'L', r: ['sa', 'eg'], t: 'Celana jas atau celana kain: hem menyentuh bagian atas sepatu dengan satu lipatan kecil di depan (disebut half break atau medium break), pilihan yang paling umum.' }),
  Object.freeze({ id: 'hemP', g: 'celana', u: 'P', r: ['wo'], t: 'Celana lebar atau flare dibuat cukup panjang sampai hanya ujung sepatu yang terlihat; celana lurus boleh sedikit lebih pendek, tetapi jangan terlalu pendek karena akan tampak kependekan.' }),
  Object.freeze({ id: 'sepertiga', g: 'sepertiga', u: '*', r: ['ik', 'hh', 'cc'], t: 'Bagi tampilan dari bahu sampai ujung celana menjadi sepertiga dan dua pertiga, bukan separuh-separuh. Yang sering membaginya dua tanpa sengaja adalah atasan yang berhenti di pinggul di atas celana. Untuk menggeser titik bagi: masukkan atasan ke dalam celana, tambah lapisan sepanjang tiga perempat, atau pakai ikat pinggang. Ini panduan gaya, bukan aturan baku; sesuaikan dengan tinggi dan seleramu.' })
]);
const STC_SOON = Object.freeze([['Undertone, palet musiman, dan aturan 60-30-10', 'STB-2'], ['Virtual draping untuk mencoba warna', 'STB-2']]);
const STC_UBAH = 2;   // cm (angka yang tampil): perubahan lingkar perut sejak pekan pertama yang memicu catatan pakaian lama
function stcPick(r) {   // MURNI: keluaran stbBodyRead -> pilihan butir (tanpa teks), beku
  const jk = r && r.profil && (r.profil.jk === 'L' || r.profil.jk === 'P') ? r.profil.jk : '';
  const ids = STC_ITEMS.filter(x => x.u === '*' || x.u === jk).map(x => x.id);
  const ukur = [], uk = r && r.ukuran ? r.ukuran : {};
  STB_KEYS.forEach(k => { const u = uk[k]; if (u && u.n > 0 && u.kini && stbD(u.kini.w)) ukur.push(Object.freeze({ k, v: u.kini.v, w: u.kini.w })); });
  const wu = uk.waist; let ubah = null;
  if (wu && wu.n > 0 && (wu.arah === 'naik' || wu.arah === 'turun') && Math.abs(wu.selisih) >= STC_UBAH && stbD(wu.awal.w) && stbD(wu.kini.w)) ubah = Object.freeze({ arah: wu.arah, sel: Math.abs(wu.selisih), wAwal: wu.awal.w, wKini: wu.kini.w });
  return Object.freeze({ jk, ids: Object.freeze(ids), ukur: Object.freeze(ukur), ubah, jkKosong: !jk });
}
function stcFitHtml(r) {   // MURNI: keluaran stbBodyRead -> teks HTML kartu #stbFit
  const p = stcPick(r), used = [];
  const refs = x => { const nm = []; x.r.forEach(k => { if (used.indexOf(k) < 0) used.push(k); nm.push(STC_REF[k].n); }); return '<span class="stb-src">Rujukan: ' + esc(nm.join(', ')) + '</span>'; };
  let h = '<section class="nw-card stb-card" id="stbFit" aria-label="Panduan potongan umum"><div class="nw-hd"><h3>Panduan potongan umum</h3></div>';
  ['atas', 'celana', 'sepertiga'].forEach(g => {
    const xs = STC_ITEMS.filter(x => x.g === g && p.ids.indexOf(x.id) >= 0);
    if (!xs.length) return;
    h += '<h4 class="stb-h">' + esc(STC_GRUP[g]) + '</h4><ul class="stb-fl">' + xs.map(x => '<li class="stb-fi"><span class="stb-ft">' + esc(x.t) + '</span>' + refs(x) + '</li>').join('') + '</ul>';
  });
  if (p.ukur.length || p.ubah) {
    h += '<h4 class="stb-h">Dari angka kamu</h4><ul class="stb-fl">';
    if (p.ukur.length) h += '<li class="stb-fi"><span class="stb-ft">Saat membandingkan dengan tabel ukuran toko, bawa angka terbaru ini: ' + p.ukur.map(x => esc(STB_BL[x.k]) + ' ' + stbF(x.v, 1) + '\u00a0cm (' + stbD(x.w) + ')').join(' · ') + '. Tabel ukuran tiap merek berbeda, jadi cek tabel merek yang dituju.</span><span class="stb-src">Panduan umum</span></li>';
    if (p.ubah) h += '<li class="stb-fi"><span class="stb-ft">Lingkar perut ' + p.ubah.arah + ' ' + stbF(p.ubah.sel, 1) + '\u00a0cm sejak ' + stbD(p.ubah.wAwal, String(p.ubah.wAwal).slice(0, 4) !== String(p.ubah.wKini).slice(0, 4)) + '. Pakaian lama bisa terasa lebih ' + (p.ubah.arah === 'turun' ? 'longgar' : 'sempit') + ' di pinggang; coba dulu sebelum membeli ukuran baru, dan tanyakan ke penjahit soal menyesuaikan pinggang.</span><span class="stb-src">Panduan umum</span></li>';
    h += '</ul>';
  }
  if (p.jkKosong) h += '<p class="stb-n">Isi jenis kelamin di Profil agar panduan jas dan celana menyesuaikan; sekarang yang tampil hanya panduan yang berlaku umum.</p><div class="stb-act"><button class="btn sm" data-q="bkProfile" data-fk="stc-prof">Buka Profil</button></div>';
  if (used.length) h += '<details class="stb-rf"><summary>Rujukan web (' + used.length + ')</summary><ul class="stb-rfl">' + used.map(k => '<li><a href="' + esc(STC_REF[k].u) + '" target="_blank" rel="noopener noreferrer">' + esc(STC_REF[k].n) + '</a></li>').join('') + '</ul></details>';
  return h + '<p class="nw-fine">Panduan umum tentang cara pakaian jatuh di badan, ditulis ulang dari rujukan web yang dicek ' + stbD(STC_CEK, true) + ' dan bisa berubah. Bukan penilaian tubuh; angka kamu hanya dibaca dari data di perangkat ini.</p></section>';
}
function stcSoonHtml() { return '<section class="nw-card" id="stbSoon"><div class="nw-hd"><h3>Menyusul di tab ini</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + STC_SOON.map(x => '<li>' + esc(x[0]) + ' <span class="hr-tg">(' + esc(x[1]) + ')</span></li>').join('') + '</ul><p class="nw-fine">Tab Badan & warna dikerjakan bertahap, satu bagian per tahap.</p></section>'; }
function stcMount() {   // dipanggil SESUDAH stbMount: sisipkan kartu panduan sebelum kartu Menyusul dan perbarui kartu Menyusul
  const wrap = $('#nwDapperBody') && $('#nwDapperBody').querySelector('#stbWrap'); if (!wrap) return;
  const old = wrap.querySelector('#stbFit'); if (old) old.remove();
  const soon = wrap.querySelector('#stbSoon'), tmp = document.createElement('div');
  tmp.innerHTML = stcFitHtml(stbBodyNow()) + stcSoonHtml();
  const fit = tmp.firstElementChild, ns = tmp.lastElementChild;
  if (soon) { soon.replaceWith(ns); wrap.insertBefore(fit, ns); } else { wrap.appendChild(fit); wrap.appendChild(ns); }
}
{ const baseNwStc = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;
  baseNwStc.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'badan') { stcMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stb1c: Object.freeze({ pick: stcPick, html: stcFitHtml, items: STC_ITEMS, refs: STC_REF, soon: STC_SOON, mount: stcMount }) }));
