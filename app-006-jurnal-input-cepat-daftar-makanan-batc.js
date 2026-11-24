/* ===== MODUL: JURNAL INPUT CEPAT & DAFTAR MAKANAN (batch 10) ===== */
// Aturan inti: db[tgl].kcal dan db[tgl].protein tetap satu-satunya sumber angka untuk stempel, meter, Riwayat, CSV, teks harian, ctx.*, Beranda.
// Bila satu hari punya daftar makanan, dua kolom itu DIISI OTOMATIS dengan jumlah item (item = sumber kebenaran). Hari tanpa daftar tidak disentuh.
const KEY_E = 'dailylog:meals:v1', KEY_F = 'dailylog:favs:v1';
const MSLOT = [['pagi', 'Pagi'], ['siang', 'Siang'], ['malam', 'Malam'], ['snack', 'Snack'], ['lain', 'Lain']];
const MSLOT_ID = MSLOT.map(s => s[0]);
const MSLOT_LBL = {}; MSLOT.forEach(s => { MSLOT_LBL[s[0]] = s[1]; });
const M_MAX_DAY = 60, M_MAX_FAV = 40;
const M_CAP_K = 20000, M_CAP_P = 2000;   // batas pembersihan data (cukup longgar untuk menampung total lama)
const M_IN_K = 5000, M_IN_P = 500;       // batas per item saat mengetik (menangkap salah ketik)
const M_OLD = 'Total tercatat sebelumnya';
let edb = {};   // daftar makanan per tanggal: {tgl: [{t, n, kcal, p, src}]}
let fdb = [];   // favorit: [{n, kcal, p}], terbaru di depan
let mealSlot = autoSlot();
let editIdx = -1, editSlot = 'lain';
STORES.e = { key: KEY_E, get: () => edb }; dirty.e = false;   // ikut ekspor JSON versi 4
STORES.f = { key: KEY_F, get: () => fdb }; dirty.f = false;

function autoSlot() { const h = new Date().getHours(); return h < 10 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'snack' : 'malam'; }
const mname = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 60);
function mnum(v, cap) {
  const x = typeof v === 'number' ? v : num(v);
  if (x == null || !Number.isFinite(x) || x < 0) return null;
  return Math.round(Math.min(x, cap) * 10) / 10;
}
function mitem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const k = mnum(raw.kcal, M_CAP_K), p = mnum(raw.p, M_CAP_P);
  if (k == null && p == null) return null;
  const o = { t: MSLOT_ID.includes(raw.t) ? raw.t : 'lain', n: mname(raw.n), kcal: k, p, src: raw.src === 'ai' ? 'ai' : 'manual' };
  ['f', 'c', 'fi'].forEach(q => { const v = mnum(raw[q], M_CAP_P); if (v != null) o[q] = v; });   // 83m: lemak, karbohidrat, serat (g); kosong bila tidak diketahui
  return o;
}
const mlist = a => Array.isArray(a) ? a.map(mitem).filter(Boolean).slice(0, M_MAX_DAY) : [];
function flist(a) {
  const out = [];
  (Array.isArray(a) ? a : []).forEach(x => {
    if (!x || typeof x !== 'object' || out.length >= M_MAX_FAV) return;
    const n = mname(x.n), k = mnum(x.kcal, M_CAP_K), p = mnum(x.p, M_CAP_P);
    if (!n || (k == null && p == null)) return;
    if (out.some(f => f.n.toLowerCase() === n.toLowerCase())) return;
    out.push({ n, kcal: k, p });
  });
  return out;
}
function msum(list) {
  let k = 0, p = 0, hk = false, hp = false;
  const m = { f: [0, 0], c: [0, 0], fi: [0, 0] };   // [jumlah, item yang punya data]
  list.forEach(x => {
    if (x.kcal != null) { k += x.kcal; hk = true; } if (x.p != null) { p += x.p; hp = true; }
    ['f', 'c', 'fi'].forEach(q => { if (x[q] != null) { m[q][0] += x[q]; m[q][1]++; } });
  });
  const r1 = a => a[1] ? Math.round(a[0] * 10) / 10 : null;
  return { kcal: hk ? Math.round(k * 10) / 10 : null, p: hp ? Math.round(p * 10) / 10 : null, f: r1(m.f), c: r1(m.c), fi: r1(m.fi), nm: Math.max(m.f[1], m.c[1]) };
}
const mstr = v => v == null ? '' : String(v).replace('.', ',');
// Samakan total hari d dengan daftarnya. Mengembalikan true bila ada yang diubah. Tidak menyentuh `updated` hari yang sudah ada.
function mApply(d) {
  const l = edb[d];
  if (!l || !l.length) return false;
  const s = msum(l);
  let e = db[d], ch = false;
  if (!e) { e = db[d] = blank(); e.updated = Date.now(); ch = true; }
  if (num(e.kcal) !== s.kcal || num(e.protein) !== s.p) { e.kcal = mstr(s.kcal); e.protein = mstr(s.p); ch = true; }
  return ch;
}
// Dipakai impor: hari dari file menang bersama daftarnya; tanpa daftar di file berarti daftar lokal tanggal itu dihapus.
function mTake(d, list) { if (list.length) { edb[d] = list; mApply(d); } else delete edb[d]; }
// Dipakai saat muat: gabungkan data tersimpan dengan yang sempat diketik saat muat, lalu perbaiki total yang tidak cocok.
function mLoad(le, lf) {
  const me = {};
  if (le && typeof le === 'object' && !Array.isArray(le)) Object.keys(le).forEach(d => { if (DATE_RE.test(d)) { const l = mlist(le[d]); if (l.length) me[d] = l; } });
  edb = Object.assign(me, edb);
  const sf = flist(lf);
  fdb.slice().reverse().forEach(f => { if (sf.length < M_MAX_FAV && !sf.some(x => x.n.toLowerCase() === f.n.toLowerCase())) sf.unshift(f); });
  fdb = sf;
  let fixed = 0;
  Object.keys(edb).forEach(d => { if (mApply(d)) fixed++; });
  if (fixed) queueSave('d');
}

/* --- perubahan oleh pengguna (selalu untuk hari `cur`) --- */
function mCommit(list) {
  const d = cur;
  if (list.length) edb[d] = list; else delete edb[d];
  const e = db[d] || (db[d] = blank());
  if (list.length) mApply(d); else { e.kcal = ''; e.protein = ''; }
  e.updated = Date.now();
  queueSave('d'); queueSave('e');
  mRefresh();
}
// 0 = gagal, 1 = ditambahkan, 2 = ditambahkan + total lama dipindah jadi item
function mAddItem(it) {
  const list = (edb[cur] || []).map(x => Object.assign({}, x));
  if (list.length >= M_MAX_DAY) { toast('Maksimal ' + M_MAX_DAY + ' item per hari'); return 0; }
  let moved = 0;
  if (!list.length && db[cur]) {
    const ok = num(db[cur].kcal), op = num(db[cur].protein);
    if (ok != null || op != null) {
      list.push({ t: 'lain', n: M_OLD, kcal: ok == null ? null : mnum(ok, M_CAP_K), p: op == null ? null : mnum(op, M_CAP_P), src: 'manual' });
      moved = 1;
    }
  }
  list.push(it);
  mCommit(list);
  return moved ? 2 : 1;
}
function mParse(nameEl, kEl, pEl) {
  const n = mname(nameEl.value), k = num(kEl.value), p = num(pEl.value);
  if (k == null && p == null) { toast('Isi kalori atau protein dulu'); return null; }
  if ((k != null && k > M_IN_K) || (p != null && p > M_IN_P)) { toast('Angka terlalu besar. Maksimal ' + fmt(M_IN_K, 0) + ' kcal dan ' + M_IN_P + ' g per item'); return null; }
  return { n, kcal: k == null ? null : Math.round(k * 10) / 10, p: p == null ? null : Math.round(p * 10) / 10 };
}

/* --- tampilan --- */
function mRefresh() {
  const e = E();
  $$('[data-k="kcal"],[data-k="protein"]').forEach(el => { el.value = e[el.dataset.k]; });
  derived(); mealPaint();
}
const slotPills = (q, sel) => MSLOT.map(s => '<button class="pill" data-q="' + q + '" data-v="' + s[0] + '" aria-pressed="' + (s[0] === sel) + '">' + s[1] + '</button>').join('');
const favLow = n => n.toLowerCase();
function mrowHTML(x, i) {
  const isFav = !!x.n && fdb.some(f => favLow(f.n) === favLow(x.n));
  const det = (x.kcal == null ? '–' : fmt(x.kcal, 1)) + ' kcal · ' + (x.p == null ? '–' : fmt(x.p, 1)) + ' g protein' + (x.f != null ? ' · ' + fmt(x.f, 1) + ' g lemak' : '') + (x.c != null ? ' · ' + fmt(x.c, 1) + ' g karbo' : '') + (x.src === 'ai' ? ' · estimasi AI' : '');
  return '<div class="mrow"><button class="mt" data-q="mEdit" data-i="' + i + '" aria-label="Ubah ' + esc(x.n || 'makanan') + '"><b>' + (x.n ? esc(x.n) : '<i>Tanpa nama</i>') + '</b><small>' + det + '</small></button>' +
    '<button class="ib' + (isFav ? ' on' : '') + '" data-q="mFav" data-i="' + i + '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? 'Hapus dari favorit' : 'Jadikan favorit') + '">' + (isFav ? '★' : '☆') + '</button>' +
    '<button class="ib del" data-q="mDel" data-i="' + i + '" aria-label="Hapus ' + esc(x.n || 'makanan') + '">×</button></div>';
}
function mealListHTML(l) {
  if (!l.length) return '<p class="note">Belum ada makanan yang dicatat per item. Kalori dan protein di atas tetap bisa diisi manual.</p>';
  const gs = MSLOT.map(s => [s, l.map((x, i) => [x, i]).filter(r => r[0].t === s[0])]).filter(g => g[1].length);
  const allF = gs.every(g => mFolded(g[0][0]));
  const bar = gs.length > 1 ? '<div class="mfoldall"><button class="btn sm ghost" data-q="mFoldAll" data-v="' + (allF ? '0' : '1') + '">' + (allF ? 'Buka semua' : 'Lipat semua') + '</button></div>' : '';
  return bar + gs.map(g => {
    const s = g[0], rows = g[1], f = mFolded(s[0]), t = msum(rows.map(r => r[0]));
    return '<div class="mgrp' + (f ? ' fold' : '') + '" data-s="' + s[0] + '"><h4><button class="mgh" data-q="mFold" data-v="' + s[0] + '" aria-expanded="' + !f + '" aria-controls="mgb-' + s[0] + '">' +
      '<span class="mgn">' + s[1] + '<small>' + rows.length + ' item</small></span>' +
      '<span class="mgs">' + (t.kcal == null ? '–' : fmt(t.kcal, 1)) + ' kcal · ' + (t.p == null ? '–' : fmt(t.p, 1)) + ' g</span><i class="chev" aria-hidden="true"></i></button></h4>' +
      '<div class="mgb" id="mgb-' + s[0] + '"' + (f ? ' hidden' : '') + '>' + rows.map(r => mrowHTML(r[0], r[1])).join('') + '</div></div>';
  }).join('');
}
/* lipat/buka grup: status disimpan di meta perangkat (tidak ikut ekspor); diubah di tempat agar fokus tombol tidak hilang */
const mFolded = k => mdb.fold.indexOf(k) >= 0;
function mFoldSet(k, on) { const i = mdb.fold.indexOf(k); if (on && i < 0) mdb.fold.push(k); else if (!on && i >= 0) mdb.fold.splice(i, 1); }
function mFoldPaint() {
  const gs = $$('#mealList .mgrp');
  gs.forEach(g => {
    const f = mFolded(g.dataset.s), b = $('.mgh', g), body = $('.mgb', g);
    g.classList.toggle('fold', f);
    if (b) b.setAttribute('aria-expanded', String(!f));
    if (body) body.hidden = f;
  });
  const all = $('#mealList [data-q="mFoldAll"]');
  if (all) { const allF = gs.length > 0 && gs.every(g => mFolded(g.dataset.s)); all.textContent = allF ? 'Buka semua' : 'Lipat semua'; all.dataset.v = allF ? '0' : '1'; }
}
QACT.mFold = el => { const k = el.dataset.v; if (MSLOT_ID.indexOf(k) < 0) return; mFoldSet(k, !mFolded(k)); queueSave('m'); mFoldPaint(); };
QACT.mFoldAll = el => { const on = el.dataset.v === '1'; $$('#mealList .mgrp').forEach(g => mFoldSet(g.dataset.s, on)); queueSave('m'); mFoldPaint(); };
function favHTML() {
  if (!fdb.length) return '';
  const chip = (f, i) => '<button class="btn sm fav" data-q="mFavUse" data-i="' + i + '">' + esc(f.n) + (f.kcal != null ? ' · ' + fmt(f.kcal, 0) : '') + '</button>';
  return '<div class="sublbl">Favorit: ketuk untuk menambah ke ' + MSLOT_LBL[mealSlot].toLowerCase() + '</div><div class="quick">' +
    fdb.slice(0, 8).map(chip).join('') + '<button class="btn sm ghost" data-q="mFavAll">' + (fdb.length > 8 ? 'Semua (' + fdb.length + ')' : 'Kelola') + '</button></div>';
}
function mealPaint() {
  const l = edb[cur] || [], has = l.length > 0;
  $$('[data-k="kcal"],[data-k="protein"]').forEach(el => { el.readOnly = has; if (el.parentElement) el.parentElement.classList.toggle('lock', has); });
  $('#mealNote').textContent = has ? 'Kalori dan protein terkunci: dihitung dari ' + l.length + ' item di daftar makanan. Hapus semua item untuk mengisi manual.' : '';
  $('#mSlots').innerHTML = slotPills('mSlot', mealSlot);
  $('#favRow').innerHTML = favHTML();
  $('#mealList').innerHTML = mealListHTML(l);
}
function mealPopulate() { $('#mName').value = ''; $('#mK').value = ''; $('#mP').value = ''; mealPaint(); }

/* --- aksi --- */
QACT.mSlot = el => { mealSlot = el.dataset.v; $$('#mSlots .pill').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === mealSlot))); $('#favRow').innerHTML = favHTML(); };
QACT.eSlot = el => { editSlot = el.dataset.v; $$('#eSlots .pill').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === editSlot))); };
QACT.mAdd = () => {
  const r = mParse($('#mName'), $('#mK'), $('#mP')); if (!r) return;
  const res = mAddItem({ t: mealSlot, n: r.n, kcal: r.kcal, p: r.p, src: 'manual' });
  if (!res) return;
  $('#mName').value = ''; $('#mK').value = ''; $('#mP').value = '';
  toast(res === 2 ? 'Ditambahkan. Total lama disimpan sebagai item “' + M_OLD + '”' : 'Ditambahkan: ' + (r.n || 'makanan'));
};
QACT.mFav = el => {
  const x = (edb[cur] || [])[+el.dataset.i]; if (!x) return;
  if (!x.n) { toast('Beri nama dulu agar bisa jadi favorit'); return; }
  const at = fdb.findIndex(f => favLow(f.n) === favLow(x.n));
  if (at >= 0) { fdb.splice(at, 1); toast('Dihapus dari favorit'); }
  else {
    if (fdb.length >= M_MAX_FAV) { toast('Favorit penuh (' + M_MAX_FAV + '). Hapus satu lewat Kelola'); return; }
    fdb.unshift({ n: x.n, kcal: x.kcal, p: x.p }); toast('Jadi favorit');
  }
  queueSave('f'); mealPaint();
};
QACT.mFavUse = el => {
  const f = fdb[+el.dataset.i]; if (!f) return;
  if (!mAddItem({ t: mealSlot, n: f.n, kcal: f.kcal, p: f.p, src: 'manual' })) return;
  if (el.closest('#sheet')) closeSheet();
  toast('Ditambahkan: ' + f.n);
};
function favManageHTML() {
  if (!fdb.length) return '<p class="note">Belum ada favorit. Ketuk ☆ pada makanan di daftar untuk menyimpannya.</p>';
  return fdb.map((f, i) => '<div class="mrow"><div class="mt"><b>' + esc(f.n) + '</b><small>' + (f.kcal == null ? '–' : fmt(f.kcal, 1)) + ' kcal · ' + (f.p == null ? '–' : fmt(f.p, 1)) + ' g protein</small></div>' +
    '<button class="btn sm" data-q="mFavUse" data-i="' + i + '">Pakai</button><button class="btn sm danger" data-q="mFavDel" data-i="' + i + '" aria-label="Hapus favorit ' + esc(f.n) + '">Hapus</button></div>').join('');
}
QACT.mFavAll = () => openSheet({ title: 'Favorit (' + fdb.length + ')', note: 'Pakai menambahkan ke waktu makan “' + MSLOT_LBL[mealSlot] + '”.', extra: favManageHTML(), actions: [closeBtn] });
QACT.mFavDel = el => {
  const i = +el.dataset.i; if (!fdb[i]) return;
  fdb.splice(i, 1); queueSave('f');
  $('#shExtra').innerHTML = favManageHTML(); $('#shTitle').textContent = 'Favorit (' + fdb.length + ')';
  mealPaint();
};
QACT.mEdit = el => {
  const x = (edb[cur] || [])[+el.dataset.i]; if (!x) return;
  editIdx = +el.dataset.i; editSlot = x.t;
  openSheet({
    title: 'Ubah makanan',
    extra: '<div class="mealform" id="editForm">' +
      '<label class="inp sm"><input id="eName" maxlength="60" autocomplete="off" placeholder="Nama makanan (boleh kosong)" aria-label="Nama makanan" value="' + esc(x.n) + '"></label>' +
      '<div class="addrow"><label class="inp sm"><input id="eK" data-mn="1" inputmode="numeric" autocomplete="off" placeholder="kcal" aria-label="Kalori" value="' + (x.kcal == null ? '' : esc(mstr(x.kcal))) + '"></label>' +
      '<label class="inp sm"><input id="eP" data-mn="1" inputmode="decimal" autocomplete="off" placeholder="protein g" aria-label="Protein gram" value="' + (x.p == null ? '' : esc(mstr(x.p))) + '"></label></div>' +
      '<div class="chips" id="eSlots" role="group" aria-label="Waktu makan">' + slotPills('eSlot', x.t) + '</div></div>',
    actions: [{ label: 'Simpan', primary: true, fn: mEditSave }, { label: 'Hapus', danger: true, fn: mEditDel }, closeBtn]
  });
};
function mEditSave() {
  const r = mParse($('#eName'), $('#eK'), $('#eP')); if (!r) return;
  const l = (edb[cur] || []).map(x => Object.assign({}, x)), x = l[editIdx];
  if (!x) { closeSheet(); return; }
  Object.assign(x, { n: r.n, kcal: r.kcal, p: r.p, t: editSlot });
  mCommit(l); closeSheet(); toast('Diperbarui');
}
// Hapus langsung dari daftar (tombol ×) atau lewat sheet Ubah. Urungkan memulihkan item di posisi semula, hanya bila daftar dan total hari itu belum berubah lagi.
let mUndo = null;
const mSnap = d => JSON.stringify([edb[d] || [], db[d] ? db[d].kcal : '', db[d] ? db[d].protein : '']);
function mRemove(i) {
  const d = cur, l = (edb[d] || []).map(x => Object.assign({}, x)), x = l[i];
  if (!x) return false;
  l.splice(i, 1);
  mCommit(l);
  mUndo = { d, i, x, snap: mSnap(d) };
  toast('Dihapus' + (x.n ? ': ' + x.n : '') + (l.length ? '' : '. Kalori dan protein bisa diisi manual lagi'), { label: 'Urungkan', fn: mRestore });
  return true;
}
function mRestore() {
  const u = mUndo; mUndo = null; if (!u) return;
  if (cur !== u.d) { toast('Tanggal sudah berganti, tidak bisa diurungkan'); return; }
  if (mSnap(u.d) !== u.snap) { toast('Daftar sudah berubah lagi, tidak bisa diurungkan'); return; }
  const l = (edb[u.d] || []).map(y => Object.assign({}, y));
  if (l.length >= M_MAX_DAY) { toast('Maksimal ' + M_MAX_DAY + ' item per hari, tidak bisa diurungkan'); return; }
  l.splice(Math.min(u.i, l.length), 0, u.x);
  mCommit(l); toast('Dipulihkan' + (u.x.n ? ': ' + u.x.n : ''));
}
QACT.mDel = el => { mRemove(+el.dataset.i); };
function mEditDel() {
  if (!(edb[cur] || [])[editIdx]) { closeSheet(); return; }
  closeSheet(); mRemove(editIdx);
}
document.addEventListener('input', ev => {
  const el = ev.target;
  if (el.dataset && el.dataset.mn) { const c = el.value.replace(/[^0-9.,]/g, ''); if (c !== el.value) el.value = c; }
});
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' || !ev.target.closest) return;
  if (ev.target.closest('#mealForm')) { ev.preventDefault(); QACT.mAdd(); }
  else if (ev.target.closest('#editForm')) { ev.preventDefault(); mEditSave(); }
});

/* --- CSV makanan (satu baris per item) --- */
function actExportMealCsv() {
  const days = Object.keys(edb).filter(d => edb[d].length).sort();
  if (!days.length) { toast('Belum ada daftar makanan'); return; }
  const q = v => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const rows = [];
  days.forEach(d => MSLOT_ID.forEach(id => edb[d].filter(x => x.t === id).forEach(x => rows.push([d, id, x.n, x.kcal == null ? '' : x.kcal, x.p == null ? '' : x.p, x.src].map(q).join(',')))));
  const text = ['tanggal,waktu,nama,kalori,protein_g,sumber'].concat(rows).join('\n');
  openSheet({ title: 'Ekspor CSV makanan', text, actions: [copyBtn, { label: 'Unduh', fn: () => download('meals-' + today() + '.csv', text, 'text/csv') }, closeBtn] });
}
window.DL = Object.freeze(Object.assign({}, window.DL, { meals: Object.freeze({ list: d => (edb[d] || []).map(x => Object.assign({}, x)), favs: () => fdb.map(f => Object.assign({}, f)), sum: msum, clean: mlist, add: mAddItem }) }));


/* ===== MODUL: JURNAL AI GIZI & EVALUASI (batch 11) ===== */
// Estimasi gizi dari teks/foto (item masuk daftar makanan lewat mAddItem, src:'ai') dan draf evaluasi satu kalimat.
// Aturan: panggilan hanya dari tombol; hasil selalu bisa diedit dulu dan tidak pernah masuk otomatis; teks/foto yang sudah diketik
// tidak hilang saat AI gagal (sejak batch 12-1 langkah 4 isian ada di obrolan makanan, lihat modul di bawah).
const FD_MAX_ITEMS = 12, FD_TXT_MAX = 600, FD_IMG_MAX = 1024, FD_FILE_MAX = 30 * 1024 * 1024;
let fdRec = null;                            // objek SpeechRecognition yang sedang jalan

function b11Sync() {
  const on = !!adb.on;
  ['#aiFoodRow', '#aiEvalRow'].forEach(s => { const el = $(s); if (el) el.hidden = !on; });
  if (!on) fdMicStop();
}

/* --- baris makanan per waktu makan untuk ctx.day (di bawah filter privasi gizi) --- */
const AI_MEAL_MAX = 12;   // paling banyak 12 item makanan dikirim ke AI per hari (total kcal/protein tetap dari semua item)
function aiMealLine(d) {
  const l = edb[d]; if (!l || !l.length) return '';
  const parts = []; let left = AI_MEAL_MAX;
  MSLOT.forEach(s => {
    const it = l.filter(x => x.t === s[0]); if (!it.length || left <= 0) return;
    const sh = it.slice(0, left); left -= sh.length;
    parts.push(s[1] + ': ' + sh.map(x => (x.n ? aiTxt(x.n, 30) : 'tanpa nama') + ' (' + [x.kcal != null && aiN(x.kcal, 0) + ' kcal', x.p != null && aiN(x.p, 1) + ' g protein'].filter(Boolean).join(', ') + (x.src === 'ai' ? ', estimasi AI' : '') + ')').join(', '));
  });
  const rest = l.length - (AI_MEAL_MAX - left);
  return parts.length ? 'makanan ' + l.length + ' item, ' + parts.join('; ') + (rest > 0 ? '; dan ' + rest + ' item lain' : '') : '';
}

/* --- pemeriksaan kewajaran lokal (pengganti pemeriksa angka untuk estimasi gizi) --- */
function fdWarns(k, p, f, c) {
  const w = [];
  if (k != null && k > 0 && p != null && f != null && c != null) { const e = 4 * p + 4 * c + 9 * f; if (Math.abs(e - k) > k * 0.3 + 30) w.push('Kalori dan makro kurang cocok (4 x protein + 4 x karbo + 9 x lemak = ' + Math.round(e) + ' kcal). Cek lagi.'); }
  if (k != null && p != null && p * 4 > k * 1.15 + 10) w.push('Protein terlalu tinggi dibanding kalorinya. Cek lagi.');
  if (k != null && k > 2500 && k <= M_IN_K) w.push('Lebih dari 2.500 kcal untuk satu item. Cek porsinya.');
  if ((k != null && k > M_IN_K) || (p != null && p > M_IN_P)) w.push('Melebihi batas input (' + fmt(M_IN_K, 0) + ' kcal, ' + M_IN_P + ' g). Ubah dulu agar bisa ditambahkan.');
  return w;
}

/* --- membersihkan keluaran JSON AI --- */
function fdParse(data) {
  const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
  const g = v => { const n = typeof v === 'number' ? v : (typeof v === 'string' ? num(v) : null); return n != null && Number.isFinite(n) && n >= 0 && n < 1e6 ? n : null; };
  const rg = (lo, v, hi) => (v != null && lo != null && hi != null && lo <= v && v <= hi) ? [lo, hi] : null;
  const items = [];
  arr.forEach(x => {
    if (!x || typeof x !== 'object' || items.length >= FD_MAX_ITEMS) return;
    let k = g(x.kcal), p = g(x.protein);
    if (k == null && p == null) return;
    const r1 = v => v == null ? null : Math.round(v * 10) / 10, fl = r1(g(x.lemak)), kh = r1(g(x.karbohidrat)), sr = r1(g(x.serat));
    if (k != null) k = Math.round(k);
    if (p != null) p = Math.round(p * 10) / 10;
    const kr = rg(g(x.kcal_min), k, g(x.kcal_maks)), pr = rg(g(x.protein_min), p, g(x.protein_maks));
    items.push({
      n: mname(x.nama != null ? x.nama : x.n), porsi: typeof x.porsi === 'string' ? aiTxt(x.porsi, 80) : '', k, p, f: fl, c: kh, fi: sr,
      kr: kr ? [Math.round(kr[0]), Math.round(kr[1])] : null, pr: pr ? [Math.round(pr[0] * 10) / 10, Math.round(pr[1] * 10) / 10] : null, on: true
    });
  });
  return { items, note: data && typeof data === 'object' && !Array.isArray(data) && typeof data.catatan === 'string' ? aiTxt(data.catatan, 300) : '' };
}

const FD_SYS = 'Kamu ahli gizi yang terbiasa dengan makanan dan minuman Indonesia. Dari deskripsi teks dan/atau foto makanan yang dimakan SATU orang, perkirakan kalori (kcal), protein, lemak, karbohidrat, dan serat (semuanya gram) per item. Aturan: ' +
  '1) Pecah menjadi item terpisah (mis. nasi, lauk, sayur, minuman), maksimal 12 item. ' +
  '2) Bila porsi tidak disebut, pakai porsi umum rumah tangga atau rumah makan di Indonesia dan tulis asumsi porsinya di "porsi" (mis. "1 centong nasi sekitar 150 g"). Dari foto, perkirakan porsi dari ukuran piring atau benda di sekitarnya. ' +
  '3) Beri nilai tengah ("kcal", "protein") dan rentang wajar ("kcal_min", "kcal_maks", "protein_min", "protein_maks"); rentang lebih lebar bila deskripsi samar atau foto kurang jelas. ' +
  '4) Hitung minyak goreng, santan, gula, dan saus bila lazim dipakai pada masakan itu. Usahakan kalori sejalan dengan makro (kira-kira 4 x protein + 4 x karbohidrat + 9 x lemak). ' +
  '5) Jangan menambah item yang tidak disebut atau tidak terlihat, dan jangan menebak merek. Bila tidak ada makanan yang bisa dikenali, kembalikan "items" kosong dan jelaskan di "catatan". ' +
  '6) Jawab HANYA dengan JSON valid tanpa teks lain, bentuk: {"items":[{"nama":"...","porsi":"...","kcal":0,"kcal_min":0,"kcal_maks":0,"protein":0,"protein_min":0,"protein_maks":0,"lemak":0,"karbohidrat":0,"serat":0}],"catatan":"..."}. "nama" singkat (maks 40 huruf) berbahasa Indonesia; "catatan" satu atau dua kalimat tentang asumsi terbesar atau ketidakpastian (boleh kosong). ' +
  'Ini perkiraan kasar untuk catatan pribadi, bukan saran medis atau diet.';

/* (sheet isian dan sheet hasil Batch 11 diganti obrolan makanan: lihat MODUL: MAKANAN SEBAGAI OBROLAN (batch 12-1, langkah 4)) */

/* --- draf evaluasi satu kalimat dari data hari itu --- */
const EV_SYS = 'Kamu membantu menulis evaluasi diri harian di aplikasi catatan kebugaran. Tulis TEPAT SATU kalimat berbahasa Indonesia, sudut pandang orang pertama ("saya"), nada jujur dan tenang, sekitar 15 sampai 30 kata. ' +
  'Pakai hanya fakta dari DATA; sebut satu hal yang berjalan baik dan/atau satu hal yang perlu diperbaiki bila ada di DATA. Jangan menambah angka atau fakta yang tidak ada di DATA, jangan memberi diagnosis atau saran medis, ' +
  'dan jangan memakai tanda kutip, daftar, atau pembuka seperti "Berikut". Jawab hanya kalimatnya.';
function evClean(t) {
  t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim().replace(/^["“”'`]+|["“”'`]+$/g, '').trim();
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  if (m && t.length > m[0].length + 3) t = m[0];   // satu kalimat saja
  if (t.length > 300) t = t.slice(0, 300).replace(/\s+\S*$/, '') + '…';
  return t;
}
function evalAi() {
  const rd = AI.ready(); if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  const c = ctx.day(cur);
  if (c.empty) {
    openSheet({ title: 'Data belum cukup', pre: true, note: 'Belum ada data ' + dayShort(cur) + ' yang boleh dikirim ke AI, jadi draf tidak dibuat (AI tidak akan mengarang). Isi log hari ini dulu, atau cek grup data yang diizinkan di Pengaturan AI.', actions: [{ label: 'Buka pengaturan AI', fn: aiOpenSettings }, closeBtn] });
    return;
  }
  const d = cur;
  aiRun({ task: 'eval', model: aiFastModel(), system: EV_SYS + ' Hari ini ' + dayLong(today()) + '.', user: 'DATA ' + dayLong(d) + ':\n' + c.text + '\n\nTulis evaluasi satu kalimat.', max: 200, think: 1024, timeout: 40000 },
    r => {
      const text = evClean(r.text);
      if (!text) { aiFail({ code: 'empty', msg: 'AI tidak memberi jawaban. Coba lagi.' }, evalAi); return; }
      const old = d === cur ? (E().eval || '').trim() : '';
      const put = (v, add) => {
        if (d !== cur) { toast('Tanggal berubah. Buka lagi harinya lalu buat draf baru'); return false; }
        const s = String(v).trim(); if (!s) { toast('Evaluasi masih kosong'); return false; }
        setField('eval', add && old ? old + '\n' + s : s);
        toast('Evaluasi diisi. Kamu masih bisa mengubahnya'); return true;
      };
      AI.show({
        title: '✦ Draf evaluasi', text, basis: c.text + ' ' + dayLong(today()),
        onUse: v => put(v, false), useLabel: old ? 'Ganti evaluasi' : 'Pakai',
        more: old ? [{ label: 'Tambah di bawah', fn: v => put(v, true) }] : [],
        again: evalAi, againLabel: 'Buat ulang'
      });
    }, evalAi);
}
QACT.evalAi = () => evalAi();

window.DL = Object.freeze(Object.assign({}, window.DL, { b11: Object.freeze({ parse: fdParse, warns: fdWarns, evClean, mealLine: aiMealLine, draft: () => ({ text: fcDraft.food, img: !!fcPhoto, kb: fcPhoto ? fcPhoto.kb : 0, w: fcPhoto ? fcPhoto.w : 0, h: fcPhoto ? fcPhoto.h : 0 }), res: () => { const m = fdOpenRes(FC.food); return m ? JSON.parse(JSON.stringify(m)) : null; } }) }));


/* ===== MODUL: BERANDA SKOR, PRIORITAS & AI (batch 12) ===== */
// Streak ceklis, skor harian, kartu prioritas: semua dihitung lokal di perangkat. AI (opsional) hanya merangkum.
// Aturan: AI mati = elemen tersembunyi + nol panggilan; skor tidak pernah dikirim ke AI; hasil AI tidak tersimpan permanen.
const CK_IDS = MORNING.concat(DAYLONG).map(i => i.id);
const CK_N = CK_IDS.length;
const PRIO_MAX = 4;
const SC_W = { chk: 20, lat: 25, kal: 15, pro: 15, air: 10, junk: 5, sal: 10 };

const hourNow = () => new Date().getHours();

/* --- ceklis lengkap & streak --- */
function chkCount(d) {
  const c = cdb[d]; if (!c) return 0;
  return CK_IDS.filter(id => c.m.includes(id) || c.e.includes(id)).length;
}
const chkFull = d => chkCount(d) === CK_N;
// streak = hari lengkap berturut-turut sampai hari ini; bila hari ini belum lengkap, dihitung sampai kemarin (belum putus)
function chkStreak() {
  const t = today(), full = Object.keys(cdb).filter(d => DATE_RE.test(d) && d <= t && chkFull(d)).sort();
  let best = 0, run = 0, prev = null;
  full.forEach(d => { run = prev && diffDays(prev, d) === 1 ? run + 1 : 1; if (run > best) best = run; prev = d; });
  let cur = 0, d = chkFull(t) ? t : addDays(t, -1);
  while (chkFull(d)) { cur++; d = addDays(d, -1); }
  return { cur, best, todayFull: chkFull(t), n: chkCount(t) };
}

/* --- skor harian 0-100 --- */
function dayHasData(d) {
  const e = db[d], c = cdb[d], tr = tdb[d], l = edb[d];
  return !!((e && (completion(e)[0] > 0 || shHas(e))) || (c && (c.m.length || c.e.length)) || (tr && (tr.kal || (tr.rides && tr.rides.length))) || (l && l.length));
}
// pecahan nilai kalori. Hari lampau: di bawah separuh target tidak dihargai (jangan menghargai makan terlalu sedikit).
function kcalFrac(v, T, past) {
  if (past && v < T.kcal * 0.5) return 0;
  if (T.mode === 'range') {
    if (v >= T.kcal && v <= T.kcalHi) return 1;
    if (v < T.kcal) return Math.max(0, v / T.kcal);
    return v <= T.kcalHi * 1.1 ? 0.5 : 0;
  }
  if (v <= T.kcal) return 1;
  return v <= T.kcalHi ? 0.5 : 0;
}
function dayScore(d) {
  const t = today(), isT = d === t;
  if (d > t || !dayHasData(d)) return { score: null, parts: [], today: isT };
  const e = db[d] || blank(), T = tgFor(d), sc = schedFor(d).s, parts = [];
  // semua komponen yang berlaku selalu dihitung; yang belum/tidak dicatat bernilai 0. Hari ini = skor "sejauh ini": naik seiring hari berjalan, tidak turun hanya karena mencatat lebih banyak.
  const add = (id, label, frac, txt) => parts.push({ id, label, w: SC_W[id], frac: Math.max(0, Math.min(1, frac || 0)), txt });
  const n = chkCount(d);
  add('chk', 'Ceklis harian', n / CK_N, n + ' dari ' + CK_N + ' tercentang');
  const ns = (sc.kal ? 1 : 0) + (sc.bike ? 1 : 0);
  if (ns) { const dn = (sc.kal && kalDone(d) ? 1 : 0) + (sc.bike && bikeDone(d) ? 1 : 0); add('lat', 'Latihan sesuai jadwal', dn / ns, dn + ' dari ' + ns + ' sesi selesai'); }
  const k = num(e.kcal), p = num(e.protein), w = num(e.water);
  add('kal', 'Kalori', k == null ? 0 : kcalFrac(k, T, !isT),
    k == null ? 'belum dicatat' : fmt(k, 0) + ' kcal, ' + (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + (!isT && k < T.kcal * 0.5 ? ' (di bawah separuh target, tidak dihargai)' : ''));
  add('pro', 'Protein', p == null ? 0 : p / T.protein, p == null ? 'belum dicatat' : fmt(p, 0) + ' dari ' + fmt(T.protein, 0) + ' g');
  add('air', 'Air putih', w == null ? 0 : w / T.water, w == null ? 'belum dicatat' : fmt(w, 2) + ' dari ' + T.water + ' L');
  add('junk', 'Pantang junkfood dan manis', e.junk === 'bersih' ? 1 : 0, e.junk == null ? 'belum dicatat' : (e.junk === 'bersih' ? 'bersih' : 'melanggar'));
  const miss = e.missed.length;
  if (shHas(e)) { const ss = shStat(e.sh); add('sal', 'Shalat 5 waktu', ss.tepat / PRAYERS.length, !ss.any ? 'belum dicatat' : ss.tepat + ' dari ' + PRAYERS.length + ' tepat waktu' + (ss.telat ? ', ' + ss.telat + ' telat' : '') + (ss.tidak ? ', ' + ss.tidak + ' tidak shalat' : '')); } else
  add('sal', 'Shalat 5 waktu', e.shalat === 'ya' ? 1 : e.shalat === 'bolong' ? (miss > 0 ? Math.max(0, (PRAYERS.length - miss) / PRAYERS.length) : 0.5) : 0,
    e.shalat == null ? 'belum dicatat' : (e.shalat === 'ya' ? 'tepat waktu' : 'bolong' + (miss ? ' (' + miss + ' waktu)' : '')));
  const sw = parts.reduce((a, x) => a + x.w, 0);
  parts.forEach(x => { x.max = x.w / sw * 100; x.pts = x.max * x.frac; });
  return { score: Math.round(parts.reduce((a, x) => a + x.pts, 0)), parts, today: isT };
}

/* --- kartu prioritas (aturan lokal; maks PRIO_MAX di kartu, semua di sheet) --- */
const PLATEAU_NOTE = 'Rencanamu menyarankan satu hari refeed';
function homePrios() {
  const t = today(), e = db[t] || blank(), sc = schedFor(t), h = hourNow(), T = tgFor(t), L = [];
  const add = (id, g, title, sub, btn) => L.push({ id, g, t: title, s: sub, btn: btn || null });
  // 1. kram
  const kr = [0, 1, 2].map(i => addDays(t, -i)).filter(d => db[d] && db[d].kram === 'ya').length;
  if (kr >= 2) add('kram', 'kram', 'Kram berulang: ' + kr + ' dari 3 hari terakhir', 'Periksakan ke dokter bila terus berulang, atau disertai bengkak, nyeri dada, atau pusing berat. Cek air, garam, dan magnesium.', { l: 'Lihat', q: 'openNutrition' });
  else if (e.kram === 'ya') add('kram', 'kram', 'Kram tercatat hari ini', 'Pastikan air, garam, kalium, dan magnesium sesuai rencana.', { l: 'Lihat', q: 'openNutrition' });
  // 2. plateau Fase 1
  if (sc.ph.id === 1 && !(cdb[t] && cdb[t].refeed) && plateau().st === 'yes') add('plateau', 'badan', 'Berat badan mendatar 2 pekan', PLATEAU_NOTE, { l: 'Lihat', q: 'openNutrition' });
  // 3. sesi latihan hari ini yang belum selesai
  const where = pdb.opt === 'gym' ? 'di gym' : 'di rumah';
  if (sc.s.kal && !kalDone(t) && !skipOf(t)) add('kal', 'latihan', 'Kalistenik hari ini belum selesai', 'Fase ' + sc.ph.id + ', ' + where, hasView('train') ? { l: 'Mulai', q: 'openTrain', t: 'kal' } : null);
  if (sc.s.bike && !bikeDone(t) && !skipOf(t)) add('bike', 'latihan', 'Sepeda hari ini belum selesai', BIKE_LABEL[sc.s.bike] + ', Fase ' + sc.ph.id, hasView('train') ? { l: 'Mulai', q: 'openTrain', t: 'bike', b: sc.s.bike } : null);
  // 4. protein tertinggal menurut jam
  const fr = h >= 20 ? 1 : h >= 18 ? 0.8 : h >= 15 ? 0.55 : h >= 12 ? 0.3 : 0;
  const [n, tt] = completion(e);
  if (fr > 0) {
    const p = num(e.protein);
    if (p == null) { if (n > 0) add('protein', 'gizi', 'Protein belum dicatat', 'Jurnal sudah terisi, tetapi protein masih kosong.', { l: 'Isi', q: 'openToday' }); }
    else if (p < T.protein * fr) add('protein', 'gizi', 'Protein tertinggal', 'Baru ' + fmt(p, 0) + ' dari ' + fmt(T.protein, 0) + ' g. Sampai jam ini idealnya sudah ' + fmt(T.protein * fr, 0) + ' g.', { l: 'Isi', q: 'openToday' });
  }
  // 5. ceklis belum lengkap, streak terancam
  if (h >= 18 && !chkFull(t)) {
    const st = chkStreak();
    add('ceklis', null, st.cur > 0 ? 'Streak ' + st.cur + ' hari bisa putus' : 'Ceklis hari ini belum lengkap', 'Baru ' + st.n + ' dari ' + CK_N + ' tercentang. Lengkapi sebelum tidur.');
  }
  // 6. jurnal kosong atau belum lengkap
  if (n === 0 && h >= 18) add('jurnal', null, 'Jurnal hari ini masih kosong', 'Catat makan, latihan, dan evaluasi singkat.', { l: 'Isi', q: 'openToday' });
  else if (n > 0 && n < tt && h >= 20) add('jurnal', null, 'Jurnal belum lengkap', n + ' dari ' + tt + ' terisi.', { l: 'Lanjut', q: 'openToday' });
  return L;
}
function prioRow(p) {
  let b = '';
  if (p.btn) b = '<button class="btn sm" data-q="' + p.btn.q + '"' + (p.btn.t ? ' data-t="' + p.btn.t + '"' : '') + (p.btn.b ? ' data-b="' + p.btn.b + '"' : '') + '>' + esc(p.btn.l) + '</button>';
  return '<div class="plan prio"><div><b>' + esc(p.t) + '</b><small>' + esc(p.s) + '</small></div>' + b + '</div>';
}
function homePrioHTML() {
  const L = homePrios(), show = L.slice(0, PRIO_MAX);
  let h = '<section class="sec" id="homePrio"><h2>Prioritas hari ini</h2>';
  h += show.length ? show.map(prioRow).join('') : '<div class="plan"><div><b>Semua prioritas hari ini sudah beres</b><small>Tidak ada yang mendesak menurut data yang tercatat.</small></div></div>';
  if (L.length > show.length) h += '<p class="note"><button class="link tap" data-q="prioAll">Lihat semua (' + L.length + ')</button></p>';
  h += '<div class="aibtn" id="aiHomeRow"' + (adb.on ? '' : ' hidden') + '><button class="btn sm" data-q="homeBrief">✦ Briefing pagi</button><button class="btn sm" data-q="homeReview">✦ Review malam</button></div>';
  return h + '</section>';
}

/* --- kartu skor & streak (v24c1: jadi kartu; skor harian bertanggal dan bisa digeser ke samping untuk melihat hari-hari sebelumnya) --- */
const SC_MIN = 14, SC_MAX = 90;   // jumlah hari pada barisan skor: dari hari pertama yang punya data sampai hari ini, minimal 14 dan maksimal 90
function scFirstDay(t) {
  const seen = {};
  [db, cdb, tdb, edb].forEach(o => Object.keys(o).forEach(d => { if (DATE_RE.test(d) && d <= t) seen[d] = 1; }));
  return Object.keys(seen).sort().find(d => dayHasData(d)) || t;
}
function scCellHTML(d, t) {
  const s = dayScore(d).score, past = d < t, dt = pd(d);
  const cls = s == null ? '' : s >= 80 ? 'hit' : (past && s < 50) ? 'miss' : '';
  return '<button class="stamp ' + cls + (d === t ? ' now' : '') + '" data-q="scoreInfo" data-d="' + d + '" aria-label="' + esc((s == null ? 'Belum ada skor' : 'Skor ' + s) + ', ' + dayLong(d) + '. Ketuk untuk rincian') + '"><span>' + (s == null ? '–' : s) + '</span><i class="bar" style="--s:' + (s == null ? 0 : Math.max(0, Math.min(100, s))) + '"></i><b>' + HARI[dt.getDay()].slice(0, 3) + '</b><small class="sdt">' + dt.getDate() + ' ' + BULAN[dt.getMonth()].slice(0, 3) + '</small></button>';
}
// posisi geser barisan skor dijaga saat Beranda digambar ulang (mis. sesudah mencentang); bila tadinya di ujung kanan (hari ini), tetap di ujung kanan
function scKeep() { const el = $('#scStrip'); return el ? { l: el.scrollLeft, end: el.scrollWidth - el.clientWidth - el.scrollLeft < 8 } : null; }
function scFit(k) {
  const el = $('#scStrip'); if (!el) return;
  const put = () => { el.scrollLeft = (!k || k.end) ? el.scrollWidth : k.l; };
  put(); requestAnimationFrame(put);
}
function homeScoreHTML() {
  const t = today(), st = chkStreak(), sc = dayScore(t);
  const T = (l, v, sub) => '<div class="tile"><small>' + l + '</small><b>' + v + '</b><em>' + sub + '</em></div>';
  const n = Math.max(SC_MIN, Math.min(SC_MAX, diffDays(scFirstDay(t), t) + 1));
  const cells = Array.from({ length: n }, (_, i) => scCellHTML(addDays(t, i - n + 1), t)).join('');
  let note = '';
  if (!st.todayFull) note = st.cur > 0 ? '<p class="note">Ceklis hari ini baru ' + st.n + ' dari ' + CK_N + '. Streak dihitung sampai kemarin, belum putus.</p>' : '<p class="note">Centang keenam ceklis hari ini untuk memulai streak.</p>';
  return '<section class="sec" id="homeScore"><div class="gh ib"><h2>Streak dan skor</h2>' + hmInfoBtn('nfoS', 'Cara membaca skor harian') + '</div>' +
    '<div class="recap">' + T('Streak', st.cur, 'hari ceklis lengkap') + T('Terbaik', st.best, 'hari berturut') + T('Skor hari ini', sc.score == null ? '–' : sc.score, sc.score == null ? 'belum ada data' : 'sejauh ini') + '</div>' +
    note + '<div class="scs" id="scStrip" role="group" aria-label="Skor harian ' + n + ' hari terakhir, dari yang terlama sampai hari ini. Geser ke samping untuk melihat hari sebelumnya">' + cells + '</div>' +
    hmNote('nfoS', 'Skor ' + n + ' hari terakhir. Geser ke samping untuk melihat hari-hari sebelumnya. Hijau 80 ke atas, abu-abu di bawah 80, merah di bawah 50 untuk hari yang sudah lewat. Ketuk hari untuk melihat rinciannya.') + '</section>';
}
QACT.scoreInfo = el => {
  const d = (el && el.dataset && DATE_RE.test(el.dataset.d || '')) ? el.dataset.d : today(), r = dayScore(d);
  const isT = d === today();
  if (r.score == null) {
    openSheet({ title: 'Skor ' + dayShort(d), pre: true, note: d > today() ? 'Hari ini belum tiba.' : 'Belum ada data di hari ini, jadi skor belum bisa dihitung.', actions: [closeBtn] });
    return;
  }
  const rows = r.parts.map(x => '<div class="scp"><div><span>' + esc(x.label) + '</span><span>' + fmt(x.pts, 0) + ' dari ' + fmt(x.max, 0) + '</span></div><small>' + esc(x.txt) + '</small></div>').join('');
  openSheet({
    title: 'Skor ' + dayShort(d) + ': ' + r.score,
    pre: true, note: (isT ? 'Skor sejauh ini: yang belum dicatat baru bernilai 0 dan naik seiring hari berjalan. ' : 'Hari yang sudah lewat: yang tidak dicatat bernilai 0. ') + 'Bobot dibagi ulang untuk komponen yang berlaku (latihan hanya di hari berjadwal), angka dibulatkan. Dihitung di perangkat ini dan tidak dikirim ke AI.',
    extra: rows, actions: [closeBtn]
  });
};
QACT.prioAll = () => {
  const L = homePrios();
  openSheet({ title: 'Semua prioritas hari ini (' + L.length + ')', extra: L.map(p => '<div class="scp"><div><span>' + esc(p.t) + '</span></div><small>' + esc(p.s) + '</small></div>').join(''), actions: [closeBtn] });
};

/* --- AI: briefing pagi dan review malam (model Cepat, tanpa web, tanpa riwayat) --- */
// Baris rencana dari jadwal dan target (rencana, bukan log), jadi aman dikirim.
function planLine(d) {
  const sc = schedFor(d), s = sc.s, T = tgFor(d), parts = [];
  if (s.kal) parts.push('kalistenik');
  if (s.bike) parts.push('sepeda ' + BIKE_LABEL[s.bike]);
  const ph = phaseOf(d);
  return 'Fase ' + sc.ph.id + (ph ? ' (' + sc.ph.nama + ')' : ' (acuan; tanggal mulai belum diatur)') + '. Jadwal ' + HARI[pd(d).getDay()] + ': ' + (parts.join(' + ') || 'istirahat') +
    '. Target kalori ' + (T.mode === 'range' ? 'rentang ' : 'batas ') + kcalTgt(T) + ' kcal' + (T.refeed ? ' (hari refeed)' : '') + ', protein ' + fmt(T.protein, 0) + ' g, air minimal ' + T.water + ' L.';
}
// prioritas terbuka yang grupnya diizinkan (tanpa grup = tidak sensitif)
function prioAiLines() {
  return homePrios().filter(p => p.g == null || aiOn(p.g)).slice(0, 6).map(p => p.t + '. ' + p.s);
}
function homeAiCtx(kind) {
  if (kind === 'week' || kind === 'track') return b14Ctx(kind);
  if (kind === 'ask') return b15Ctx();
  if (kind === 'coach') return b16Ctx();
  if (kind === 'bike') return b17cCtx();
  if (kind === 'tk') return tkAiCtx();
  if (kind === 'menu') return naiMenuCtx();
  if (kind === 'cramp') return naiKramCtx();
  const t = today(), st = chkStreak(), pr = prioAiLines();
  const streak = 'Ceklis harian lengkap berturut-turut: ' + st.cur + ' hari' + (st.todayFull ? '' : ' (hari ini baru ' + st.n + ' dari ' + CK_N + ' ceklis)') + '.';
  const prio = pr.length ? pr.map(x => '- ' + x).join('\n') : '- (tidak ada)';
  if (kind === 'brief') {
    const c = ctx.range(3);
    const body = 'RENCANA ' + dayLong(t) + ':\n' + planLine(t) + '\n\nTREN 3 HARI:\n' + (c.empty ? '(belum ada data yang boleh dikirim)' : c.text) + '\n\nPRIORITAS SAAT INI:\n' + prio + '\n\nSTREAK:\n' + streak;
    const user = body + '\n\nTulis briefing pagi.';
    return { user, body, basis: user + ' ' + dayLong(t), empty: false };
  }
  const c = ctx.day(t), tm = addDays(t, 1);
  const body = 'HARI INI:\n' + c.text + '\n\nBESOK ' + dayLong(tm) + ':\n' + planLine(tm) + '\n\nPRIORITAS TERBUKA:\n' + prio + '\n\nSTREAK:\n' + streak;
  const user = body + '\n\nTulis review malam.';
  return { user, body, basis: user + ' ' + dayLong(t), empty: c.empty };
}
const BR_COMMON = ' Jawab dalam bahasa Indonesia, teks biasa satu paragraf tanpa judul, daftar, atau tanda markdown, MAKSIMAL 4 kalimat. Pakai hanya fakta dari DATA; jangan menambah angka atau fakta yang tidak ada di DATA. Jangan memberi diagnosis atau saran medis; bila ada kram berulang, bengkak, nyeri dada, pusing berat, atau pingsan, sarankan menemui dokter. Nada tenang, praktis, dan jujur; jangan memuji berlebihan. Jawab hanya isinya, tanpa pembuka seperti "Berikut".';
const BR_SYS = 'Kamu menyusun briefing pagi singkat di aplikasi catatan kebugaran. Sebut fokus hari ini dari RENCANA (jadwal dan target), satu hal dari TREN 3 HARI yang perlu dijaga atau diperbaiki bila ada, dan satu langkah konkret.' + BR_COMMON;
const RV_SYS = 'Kamu menyusun review malam singkat di aplikasi catatan kebugaran. Sebut satu hal yang berjalan baik hari ini, satu hal yang perlu diperbaiki bila ada di DATA, dan satu persiapan untuk BESOK sesuai jadwalnya.' + BR_COMMON;
const BR_TITLE = { brief: '✦ Briefing pagi', review: '✦ Review malam', food: '✦ Estimasi gizi' };
// buang markdown dan batasi 4 kalimat; pemisah kalimat hanya titik/!/? yang diikuti spasi, jadi 1.600 dan 2,5 aman
function briefClean(t) {
  t = String(t == null ? '' : t).replace(/\r/g, '')
    .replace(/^[ \t]*(?:#{1,6}|>|[-*•]|\d+[.)])[ \t]+/gm, '')
    .replace(/\*\*|__|`/g, '').replace(/(^|\s)\*+(?=\S)/g, '$1').replace(/(?<=\S)\*+(?=\s|$)/g, '')
    .replace(/\s+/g, ' ').trim().replace(/^["“”'`]+|["“”'`]+$/g, '').trim();
  const ss = t.match(/.+?(?:[.!?]+(?=\s|$)|$)/g) || [];
  let out = ss.slice(0, 4).join('').trim();
  if (out.length > 700) out = out.slice(0, 700).replace(/\s+\S*$/, '') + '…';
  return out;
}
function b12Sync() {
  const on = !!adb.on, el = $('#aiHomeRow');
  if (el) el.hidden = !on;
  if (!on) fcResetAll();   // mematikan AI membuang obrolan
}
/* ===== MODUL: OBROLAN BUBBLE UNTUK BRIEFING & REVIEW (batch 12-1) ===== */
// Panel #fchat (kelas CSS obrolan yang sama dengan ✦ Tanya AI, tetapi terpisah dari #chat) dipakai untuk ✦ Briefing pagi dan ✦ Review malam.
// Aturan: ketukan tombol di Beranda membuka panel dan langsung menyusun jawaban pertama (ketukan = izin panggilan); sesudahnya hanya panggilan dari tombol kirim/saran.
// Jawaban pertama = prompt Batch 12 (BR_SYS/RV_SYS, maks 4 kalimat). Tanya lanjutan = gaya Hanya data (AI_BASE) + pemeriksa angka. Model Cepat, tanpa web.
// Obrolan hanya di memori per jenis dan per tanggal (hari baru = obrolan lama dibuang). AI mati = obrolan dibuang, nol panggilan.
const FC_AUTO = { brief: 'Susun briefing pagi untuk hari ini', review: 'Susun review malam untuk hari ini' };
const FC_FOLLOW = { brief: 'Ini obrolan lanjutan tentang briefing pagi yang baru kamu tulis.', review: 'Ini obrolan lanjutan tentang review malam yang baru kamu tulis.' };
const FC_CHIPS = {
  brief: ['Apa langkah paling penting hari ini?', 'Jelaskan lebih singkat', 'Apa yang perlu dijaga dari 3 hari terakhir?'],
  review: ['Apa yang perlu disiapkan besok?', 'Ringkas jadi satu kalimat', 'Apa yang paling perlu diperbaiki?']
};
const FC_CTX = { brief: 'Konteks: rencana hari ini + tren 3 hari', review: 'Konteks: log hari ini + rencana besok' };
const FC_HIST_MAX = 12, FC_Q_MAX = 600;
let FC = { brief: fcBlank(), review: fcBlank(), food: fcBlank(), week: fcBlankW(), track: fcBlank(), ask: fcBlank(), coach: fcBlank(), bike: fcBlank(), menu: fcBlank(), cramp: fcBlank(), tk: fcBlank() };   // {msgs: [{id, r: user|model|err|sys, ...}], date}
let fcKind = '', fcBusy = false, fcBusyId = 0, fcTok = 0, fcId = 0, fcWaitT = null;
const fcDraft = { brief: '', review: '', food: '', week: '', track: '', ask: '', coach: '', bike: '', menu: '', cramp: '', tk: '' };
let fcPhoto = null;   // foto yang dilampirkan di obrolan makanan dan belum dikirim: {type, data, url, w, h, kb}; hanya di memori

function fcBlank() { return { msgs: [], date: today() }; }
function fcBlankW() { return Object.assign(fcBlank(), { ws: '' }); }
const fcSt = () => FC[fcKind];
const fcHasChat = st => st.msgs.some(m => m.r === 'user' || m.r === 'model' || m.r === 'food');
function fcResetAll() {
  fcTok++; if (fcBusy) AI.cancel(); fcBusy = false; fcWaitStop();
  FC = { brief: fcBlank(), review: fcBlank(), food: fcBlank(), week: fcBlankW(), track: fcBlank(), ask: fcBlank(), coach: fcBlank(), bike: fcBlank(), menu: fcBlank(), cramp: fcBlank(), tk: fcBlank() }; fcDraft.brief = ''; fcDraft.review = ''; fcDraft.food = ''; fcDraft.week = ''; fcDraft.track = ''; fcDraft.ask = ''; fcDraft.coach = ''; fcDraft.bike = ''; fcDraft.menu = ''; fcDraft.cramp = ''; fcDraft.tk = ''; fcPhoto = null; fdMicStop();
  const c = $('#fchat'); if (c && !c.hidden) { c.hidden = true; document.body.classList.remove('chatlock'); } fcKind = '';
}
function fcStale(kind) {   // data atau jam berubah sejak jawaban pertama dibuat (prioritas bergantung jam)
  const first = FC[kind].msgs.find(m => m.r === 'model' && m.sig);
  return !!first && homeAiCtx(kind).user !== first.sig;
}
function fcHistory(st, upto) {   // hanya pasangan tanya + jawab yang utuh sebelum indeks upto
  const out = [];
  for (let i = 0; i < upto - 1; i++) {
    const a = st.msgs[i], b = st.msgs[i + 1];
    if (a.r === 'user' && b.r === 'model') { out.push({ role: 'user', text: a.text.slice(0, 600) }, { role: 'model', text: b.text.slice(0, 1200) }); i++; }
  }
  return out.slice(-FC_HIST_MAX);
}

/* --- tampilan --- */
function fcBubble(kind, m, last) {
  if (m.r === 'user') return '<div class="cb u" data-id="' + m.id + '"><div class="bt">' + (m.img ? '<img class="cimg" src="' + esc(m.img.url) + '" alt="Foto makanan yang kamu kirim">' : '') + esc(m.text) + '</div></div>';
  if (m.r === 'food') return fdBubble(m, last);
  if (m.r === 'sys') return '<div class="cb a" data-id="' + m.id + '"><div class="bt">' + esc(m.text) + '</div>' + (m.btn ? '<div class="cact"><button class="btn sm primary" data-q="' + m.btn.q + '">' + esc(m.btn.l) + '</button></div>' : '') + '</div>';
  if (m.r === 'err') {
    return '<div class="cb a e" data-id="' + m.id + '"><div class="bt"><b>AI belum bisa menjawab</b><br>' + esc(m.msg) + '<br><small>' + (m.regen ? 'Jawaban sebelumnya tetap ada di atas.' : 'Yang sudah kamu tulis tetap ada di atas.') + ' Fitur lain tidak terpengaruh.</small></div>' +
      '<div class="cact">' + (m.fix ? '<button class="btn sm primary" data-q="fcSettings">Buka pengaturan AI</button>' : '<button class="btn sm primary" data-q="fcRetry">Coba lagi</button>') + '</div></div>';
  }
  const warn = [];
  if (m.bad && m.bad.length) warn.push('⚠ Angka ini tidak ada di datamu: ' + m.bad.join(', ') + '. Anggap perkiraan AI dan cek dulu.');
  if (m.cut) warn.push('Jawaban terpotong karena terlalu panjang.');
  if (m.sig && fcStale(kind)) warn.push('Data sudah berubah sejak jawaban ini dibuat. ' + (last ? 'Tekan Ulangi untuk memperbarui.' : 'Tekan Baru di atas untuk menyusun ulang.'));
  return '<div class="cb a' + (fcBusy && fcBusyId === m.id ? ' dim' : '') + '" data-id="' + m.id + '"><div class="bt md">' + aiMd(m.text) + '</div>' +
    b18Cap(m) + warn.map(w => '<div class="cap warn">' + esc(w) + '</div>').join('') + b18Extra(kind, m) +
    '<div class="cact"><button class="btn sm ghost" data-q="fcCopy" data-id="' + m.id + '">Salin</button>' + (last ? '<button class="btn sm ghost" data-q="fcRegen" data-id="' + m.id + '">Ulangi</button>' : '') + '</div>' +
    (last && !m.cut ? '<div class="csug">' + b18Chips(kind).map(t => '<button class="btn sm ghost" data-q="fcChip" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' : '') + '</div>';
}
function fcEmptyHTML(kind) {
  if (kind === 'food') return fdEmptyHTML();
  if (kind === 'ask') return b15EmptyHTML();
  if (kind === 'coach') return b16EmptyHTML();
  if (kind === 'bike') return b17cEmptyHTML();
  if (naiK(kind)) return naiEmptyHTML(kind);
  if (B14_SYS[kind]) return b14EmptyHTML(kind);
  const b = kind === 'brief';
  return '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>' + (b ? 'Briefing pagi' : 'Review malam') + '</h4><p class="note">' +
    esc(b ? 'Ringkasan singkat dari rencana hari ini dan tren 3 hari terakhirmu. Setelah tampil, kamu bisa bertanya lanjutan.' : 'Ringkasan singkat dari log hari ini dan rencana besok. Setelah tampil, kamu bisa bertanya lanjutan.') +
    '</p><div class="quick"><button class="btn primary" data-q="fcGen">' + (b ? 'Susun briefing pagi' : 'Susun review malam') + '</button></div></div>';
}
function fcHeadPaint() {
  $('#fcTitle').textContent = BR_TITLE[fcKind];
  $('#fcCtx').innerHTML = '<span class="lb">' + esc(fcCtxText()) + '</span>' + (fcKind === 'ask' ? '<button data-q="fcRng" aria-label="Ganti rentang waktu">Ganti</button>' : '') + '<button data-q="fcPeek">Lihat data</button>';
  $('#fcNewBtn').hidden = !fcHasChat(fcSt());
}
function fcBarPaint() {
  const b = $('#fcSend'); b.classList.toggle('stop', fcBusy); b.innerHTML = fcBusy ? CH_STOP : CH_SEND;
  b.setAttribute('aria-label', fcBusy ? 'Berhenti' : 'Kirim');
  if (fcKind === 'food') fdBarPaint(); else $('#fcIn').placeholder = fcKind === 'bike' ? 'Tanya tentang ridemu…' : fcKind === 'coach' ? 'Tanya pelatih tentang latihanmu…' : fcKind === 'ask' ? 'Tanya apa saja tentang catatanmu…' : 'Tanya lanjutan tentang ' + FC_NOUN[fcKind] + ' ini…';
  fdAuxPaint();
  if (!$('#fchat').hidden) fcGrow();   // tinggi kotak tulis dihitung ulang setelah placeholder berganti (batch 14: baris kedua placeholder tidak terpotong)
}
const fcWaitText = s => s < 12 ? 'Menyusun jawaban…' : s < 40 ? 'Masih menyusun…' : 'Masih mencoba. Tekan tombol berhenti bila ingin membatalkan.';
function fcWaitStart() {
  fcWaitStop(); const t0 = Date.now();
  fcWaitT = setInterval(() => { const el = $('#fcWait'), t = fcWaitText((Date.now() - t0) / 1000); if (el && el.textContent !== t) el.textContent = t; }, 1000);
}
function fcWaitStop() { if (fcWaitT) { clearInterval(fcWaitT); fcWaitT = null; } }
function fcPaint(stick) {   // stick: 'end' = turun ke bawah; kosong = tetap di bawah hanya bila memang sudah di bawah
  const box = $('#fcMsgs'); if (!box || !fcKind) return;
  const st = fcSt(), keep = box.scrollTop, near = box.scrollHeight - keep - box.clientHeight < 80;
  let h = st.msgs.length ? st.msgs.map((m, i) => fcBubble(fcKind, m, !fcBusy && i === st.msgs.length - 1)).join('') : fcEmptyHTML(fcKind);
  if (fcBusy) h += '<div class="cb a" id="fcTyping"><div class="bt typing" aria-hidden="true"><i></i><i></i><i></i></div><div class="cap" id="fcWait">' + esc(fcWaitText(0)) + '</div></div>';
  box.innerHTML = h;
  fcHeadPaint(); fcBarPaint();
  box.scrollTop = stick === 'end' || (stick == null && near) ? box.scrollHeight : keep;
  if (fcKind === 'coach') b18Frames();
}
function fcReveal(id) {   // jawaban panjang: tampilkan dari awalnya
  const box = $('#fcMsgs'), el = box.querySelector('[data-id="' + id + '"]'); if (!el) return;
  box.scrollTop = el.offsetHeight > box.clientHeight * 0.75 ? Math.max(0, el.offsetTop - 8) : box.scrollHeight;
}
function fcGrow() { const t = $('#fcIn'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 132) + 'px'; }
function fcFit() {
  const c = $('#fchat'); if (c.hidden) return;
  const vv = window.visualViewport;
  if (vv) { c.style.height = vv.height + 'px'; c.style.top = vv.offsetTop + 'px'; c.classList.toggle('kb', vv.height < window.innerHeight - 120); }
}
function fcLive(t) { const l = $('#fcLive'); if (l) l.textContent = t; }

/* --- alur --- */
function fcOpen(kind) {
  const rd = AI.ready(); if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  fcKind = kind;
  if (FC[kind].date !== today()) { FC[kind] = fcBlank(); fcDraft[kind] = ''; if (kind === 'food') fcPhoto = null; }   // hari baru: obrolan lama dibuang
  const st = FC[kind];
  $('#fchat').hidden = false; document.body.classList.add('chatlock');
  $('#fcIn').value = fcDraft[kind]; fcGrow(); fcFit(); fcPaint('end');
  if (kind !== 'food' && !fcHasChat(st)) { st.msgs = []; if (kind !== 'ask' && kind !== 'coach' && kind !== 'bike' && !naiK(kind)) fcFirst(kind); else if (kind === 'coach' || kind === 'bike' || naiK(kind)) fcPaint('end'); }   // belum ada obrolan (atau hanya catatan "data belum cukup"): susun jawaban pertama
  if (matchMedia('(pointer:fine)').matches) $('#fcIn').focus();
}
function fcClose() {
  if (!fcKind) return;
  fdMicStop();
  if (fcBusy) fcStop();
  fcDraft[fcKind] = $('#fcIn').value;
  $('#fchat').hidden = true; document.body.classList.remove('chatlock'); fcKind = '';
}
function fcFirst(kind) {
  const st = FC[kind], c = homeAiCtx(kind);
  if (c.empty) {
    st.msgs.push({ id: ++fcId, r: 'sys', text: c.emptyMsg || 'Belum ada data hari ini yang boleh dikirim ke AI, jadi review tidak dibuat (AI tidak akan mengarang). Isi log hari ini dulu, atau cek grup data yang diizinkan di Pengaturan AI.', btn: (c.emptyMsg && !c.emptyBtn) ? null : { q: 'fcSettings', l: 'Buka pengaturan AI' } });
    fcPaint('end'); return;
  }
  st.msgs.push({ id: ++fcId, r: 'user', text: fcAutoText(kind), auto: true });
  fcAsk(kind);
}
function fcStop() {   // batal: pertanyaan lanjutan dikembalikan ke kotak tulis; permintaan otomatis pertama cukup dibuang
  if (!fcBusy) return;
  fcTok++; AI.cancel(); fcBusy = false; fcWaitStop();
  const st = fcSt(), m = st.msgs[st.msgs.length - 1];
  if (m && m.r === 'user') {
    st.msgs.pop();
    if (!m.auto) { const inp = $('#fcIn'), cur = inp.value.trim(); inp.value = [m.text, cur].filter(Boolean).join('\n\n'); fcDraft[fcKind] = inp.value; fcGrow(); if (m.img && !fcPhoto) fcPhoto = m.img; }
  }
  fcPaint('end'); toast(!m || m.r !== 'user' ? 'Dibatalkan. Jawaban sebelumnya tetap ada' : m.auto ? 'Dibatalkan' : 'Dibatalkan. Pertanyaanmu kembali ke kotak tulis');
}
function fcSend(q0, keep) {
  if (fcBusy) return;
  if (fcKind === 'food') { fdSend(q0); return; }
  const q = String(q0 == null ? '' : q0).trim();
  if (!q) { toast('Tulis pertanyaan dulu'); return; }
  const rd = AI.ready(); if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  const st = fcSt();
  if (fcKind !== 'ask' && fcKind !== 'coach' && fcKind !== 'bike' && !naiK(fcKind) && !st.msgs.some(m => m.r === 'model')) { toast('Susun ' + FC_NOUN[fcKind] + 'nya dulu, baru bertanya lanjutan'); return; }
  { const c0 = homeAiCtx(fcKind); if (c0.empty && !b18Open(fcKind)) { toast(c0.emptyMsg ? 'Data belum cukup, jadi AI tidak menjawab' : 'Belum ada data hari ini yang boleh dikirim ke AI'); return; } }
  st.msgs = st.msgs.filter(m => m.r !== 'err');
  st.msgs.push({ id: ++fcId, r: 'user', text: q.slice(0, FC_Q_MAX) });
  if (!keep) { $('#fcIn').value = ''; fcDraft[fcKind] = ''; fcGrow(); }
  fcAsk(fcKind);
}
// opt kosong = jawab pesan pengguna terakhir; {regen: id} = jawab ulang pertanyaan di atas jawaban terakhir (jawaban lama tetap tampil sampai yang baru sukses)
async function fcAsk(kind, opt) {
  opt = opt || {};
  if (kind === 'food') return fdAsk(opt);
  const st = FC[kind], ms = st.msgs;
  let qi = ms.length - 1, mi = -1;
  if (opt.regen) {
    mi = ms.findIndex(m => m.id === opt.regen && m.r === 'model');
    if (mi < 1 || mi !== ms.length - 1 || ms[mi - 1].r !== 'user') return;   // hanya jawaban paling akhir
    qi = mi - 1;
  }
  const qm = ms[qi]; if (!qm || qm.r !== 'user') return;
  const old = mi >= 0 ? ms[mi] : null, tok = ++fcTok, c = homeAiCtx(kind), first = !!qm.auto;
  const sm = !first && b18Open(kind) ? { tier: chatTier(), web: aiWebOn() } : null;   // batch 17-P: pelatih pintar (model obrolan + web) hanya untuk tanya lanjutan
  if (c.empty && !sm) {   // batch 14: data sudah tidak cukup sejak jawaban pertama (Ulangi / Coba lagi): jangan kirim DATA kosong ke AI (nanti AI mengarang)
    if (first) { st.msgs = st.msgs.filter(m => m !== qm); fcFirst(kind); return; }   // fcFirst menaruh pesan "data belum cukup" tanpa panggilan
    toast(c.emptyMsg ? 'Data belum cukup, jadi AI tidak menjawab' : 'Belum ada data yang boleh dikirim ke AI'); fcPaint('end'); return;
  }
  let o, basis;
  if (first) {
    o = { task: kind, model: aiFastModel(), system: fcSys(kind) + ' Hari ini ' + dayLong(today()) + '.', user: c.user, max: fcMax(kind), think: 1024, timeout: 40000 };
    basis = c.basis;
  } else if (sm) {
    o = b18Req(c, qm, st, qi); basis = '';
  } else {
    o = { task: kind + '-chat', model: aiFastModel(), system: AI_BASE + ' ' + FC_FOLLOW[kind] + ' Jawab pertanyaan pengguna dengan singkat (2 sampai 5 kalimat), hanya dari DATA dan obrolan sebelumnya; jangan menulis ulang seluruh ' + FC_NOUN[kind] + ' kecuali diminta. Hari ini ' + dayLong(today()) + '.',
      user: 'DATA:\n' + c.body + '\n\nPERTANYAAN:\n' + qm.text, history: fcHistory(st, qi), max: 600, think: 1024, timeout: 40000 };
    basis = c.body + '\n' + dayLong(today()) + '\n' + ms.filter(m => m.r === 'user' && !m.auto).map(m => m.text).join('\n');
  }
  fcBusy = true; fcBusyId = opt.regen || 0; fcWaitStart(); fcPaint('end');
  const r = await AI.ask(o);
  if (tok !== fcTok) return;   // dibatalkan, direset, atau panel ditutup selagi menunggu
  fcBusy = false; fcWaitStop();
  if (r.code === 'cancelled') { fcBusy = true; fcStop(); return; }
  const fail = (code, msg) => { ms.push({ id: ++fcId, r: 'err', code, msg: msg || 'Terjadi kesalahan.', fix: ['off', 'nokey', 'noproxy', 'auth', 'model'].includes(code), regen: opt.regen || 0 }); fcPaint('end'); fcLive('AI belum bisa menjawab'); };
  if (!r.ok) { fail(r.code, r.msg); return; }
  const text = b14Post(kind, first ? fcClean(kind, r.text) : String(r.text || '').trim());
  if (!text) { fail('empty', 'AI tidak memberi jawaban. Coba lagi.'); return; }
  const nm = { id: ++fcId, r: 'model', text, bad: sm ? [] : aiCheck(text, basis), cut: !!r.cut, sig: first ? c.user : '' };
  if (sm) Object.assign(nm, { smart: true, tier: sm.tier, web: sm.web && !r.noWeb, noWeb: !!r.noWeb, src: r.src || [], queries: r.queries || [], entry: r.entry || '' });
  if (old) ms[mi] = nm; else ms.push(nm);
  fcPaint(); fcReveal(nm.id); fcLive('Jawaban AI sudah tampil');
}
QACT.homeBrief = () => fcOpen('brief');
QACT.homeReview = () => fcOpen('review');
QACT.fcClose = () => fcClose();
QACT.fcSend = () => { if (fcBusy) fcStop(); else fcSend($('#fcIn').value); };
QACT.fcChip = el => fcSend(el.dataset.t, true);
QACT.fcGen = () => { if (fcBusy || !fcKind) return; FC[fcKind].msgs = []; fcFirst(fcKind); };
QACT.fcRegen = el => { if (!fcBusy) fcAsk(fcKind, { regen: +el.dataset.id }); };
QACT.fcRetry = () => { if (fcBusy) return; const st = fcSt(), e = st.msgs.find(m => m.r === 'err'); st.msgs = st.msgs.filter(m => m.r !== 'err'); fcAsk(fcKind, e && e.regen ? { regen: e.regen } : undefined); };
QACT.fcCopy = el => { const m = fcSt().msgs.find(x => String(x.id) === el.dataset.id); if (m) aiCopy(m.text); };
QACT.fcSettings = () => { fcClose(); aiOpenSettings(); };
QACT.fcPeek = () => openSheet({ title: 'Data yang akan dikirim', note: 'Hanya teks ini, pertanyaanmu, dan obrolan di layar ini yang dikirim. Angka dihitung di perangkat ini; grup data yang tidak dicentang di Pengaturan AI tidak ikut. Skor harian tidak dikirim.', text: homeAiCtx(fcKind).body, prose: true, actions: [closeBtn] });
QACT.fcNew = () => {
  const kind = fcKind; if (!kind) return;
  openSheet({ title: 'Susun ulang dari awal?', note: 'Obrolan di layar ini dihapus dan ' + FC_NOUN[kind] + ' disusun lagi dari data terbaru. Tidak tersimpan di mana pun.',
    actions: [closeBtn, { label: 'Susun ulang', primary: true, fn: () => { closeSheet(); fcTok++; if (fcBusy) AI.cancel(); fcBusy = false; fcWaitStop(); FC[kind] = fcBlank(); fcDraft[kind] = ''; $('#fcIn').value = ''; fcGrow(); fcPaint('end'); fcFirst(kind); } }] });
};
{
  const inp = $('#fcIn');
  inp.addEventListener('input', () => { if (fcKind) fcDraft[fcKind] = inp.value; fcGrow(); });
  inp.addEventListener('keydown', e => {   // di komputer Enter mengirim (Shift+Enter baris baru); di HP Enter = baris baru
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); QACT.fcSend(); }
  });
  inp.addEventListener('focus', () => setTimeout(() => { const b = $('#fcMsgs'); if (b.scrollHeight - b.scrollTop - b.clientHeight < 200) b.scrollTop = b.scrollHeight; }, 300));
  if (window.visualViewport) { visualViewport.addEventListener('resize', fcFit); visualViewport.addEventListener('scroll', fcFit); }
  window.addEventListener('resize', fcFit);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fchat').hidden && $('#sheet').hidden) fcClose(); }, true);
}
/* ===== MODUL: MAKANAN SEBAGAI OBROLAN (batch 12-1, langkah 4) ===== */
// ✦ Estimasi dari teks atau foto kini berupa obrolan bubble di panel #fchat jenis 'food' (menggantikan sheet isian + sheet hasil Batch 11).
// Aturan tetap: panggilan hanya dari tombol kirim; hasil selalu bisa diedit dan tidak pernah masuk otomatis (hanya lewat Tambahkan);
// data log tidak dikirim, hanya isi pesan (+ foto); pesan yang gagal tidak hilang. Obrolan hanya di memori; hari baru atau AI mati = dibuang.
const FD_HIST_PAIRS = 6;
const FD_CORR = ' Pengguna sedang mengoreksi atau menambah daftar makanan yang sudah kamu buat (lihat percakapan sebelumnya) lewat obrolan. Terapkan koreksinya, lalu kembalikan daftar LENGKAP terbaru (semua item yang masih berlaku, bukan hanya yang berubah) dengan bentuk JSON yang sama. Untuk item yang tidak dikoreksi, pakai angka dari daftar sebelumnya. Bila pengguna meminta item dihapus, jangan sertakan item itu.';
const FD_EXAMPLES = ['Nasi putih 1 piring, ayam goreng paha, tempe 2 potong, es teh manis', 'Soto ayam 1 mangkuk dengan nasi setengah porsi', 'Pisang 2 buah dan segelas susu'];
const fdSR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
function fdMicPaint(on) { const b = $('#fcMicBtn'); if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Berhenti mendengarkan' : 'Dikte suara'); } }
function fdMicStop() { const r = fdRec; fdRec = null; if (r) { try { r.stop(); } catch (e) { /* sudah berhenti */ } } fdMicPaint(false); }

const fdLastFood = st => { for (let i = st.msgs.length - 1; i >= 0; i--) if (st.msgs[i].r === 'food') return st.msgs[i]; return null; };
const fdOpenRes = st => { const m = fdLastFood(st); return m && !m.added ? m : null; };   // hasil terakhir yang belum ditambahkan
const fdMsg = id => FC.food.msgs.find(m => m.id === id && m.r === 'food') || null;
function fdTotText(m) {
  const on = m.items.filter(x => x.on), s = msum(on.map(x => ({ kcal: x.k, p: x.p, f: x.f, c: x.c })));
  return on.length ? on.length + ' item dicentang: ' + (s.kcal == null ? '–' : fmt(s.kcal, 0)) + ' kcal, ' + (s.p == null ? '–' : fmt(s.p, 1)) + ' g protein' + (s.f != null ? ', ' + fmt(s.f, 1) + ' g lemak' : '') + (s.c != null ? ', ' + fmt(s.c, 1) + ' g karbo' : '') : 'Belum ada item yang dicentang';
}
const fcCtxText = () => fcKind === 'food' ? 'Untuk ' + dayShort(cur) + ' · tanpa data log' : (typeof FC_CTX[fcKind] === 'function' ? FC_CTX[fcKind]() : FC_CTX[fcKind]);

/* --- baris hasil: semua angka bisa diedit, hanya item bercentang yang masuk --- */
function fdRowHTML(m, i, dis) {
  const rg = [m.kr && 'kalori ' + fmt(m.kr[0], 0) + '–' + fmt(m.kr[1], 0), m.pr && 'protein ' + fmt(m.pr[0], 1) + '–' + fmt(m.pr[1], 1) + ' g'].filter(Boolean);
  const info = [m.porsi && 'Asumsi: ' + m.porsi, rg.length && 'Rentang ' + rg.join(', ')].filter(Boolean).join(' · '), ds = dis ? ' disabled' : '';
  return '<div class="fdr' + (m.on ? '' : ' off') + '" data-i="' + i + '"><div class="fdr-h"><label class="fdchk"><input type="checkbox" class="fdc"' + (m.on ? ' checked' : '') + ds + ' aria-label="Ikutkan ' + esc(m.n || 'item') + '"></label>' +
    '<label class="inp sm fdn"><input class="fdni" maxlength="60" autocomplete="off" value="' + esc(m.n) + '" placeholder="Nama (boleh kosong)" aria-label="Nama item"' + ds + '></label></div>' +
    '<div class="addrow"><label class="inp sm"><input class="fdk" data-mn="1" inputmode="numeric" autocomplete="off" value="' + (m.k == null ? '' : esc(mstr(m.k))) + '" placeholder="kcal" aria-label="Kalori"' + ds + '><span class="u">kcal</span></label>' +
    '<label class="inp sm"><input class="fdp" data-mn="1" inputmode="decimal" autocomplete="off" value="' + (m.p == null ? '' : esc(mstr(m.p))) + '" placeholder="protein" aria-label="Protein gram"' + ds + '><span class="u">g</span></label></div>' +
    '<div class="addrow"><label class="inp sm"><input class="fdfat" data-mn="1" inputmode="decimal" autocomplete="off" value="' + (m.f == null ? '' : esc(mstr(m.f))) + '" placeholder="lemak" aria-label="Lemak gram"' + ds + '><span class="u">g lemak</span></label>' +
    '<label class="inp sm"><input class="fdcarb" data-mn="1" inputmode="decimal" autocomplete="off" value="' + (m.c == null ? '' : esc(mstr(m.c))) + '" placeholder="karbo" aria-label="Karbohidrat gram"' + ds + '><span class="u">g karbo</span></label></div>' +
    (info ? '<small class="fdinfo">' + esc(info) + '</small>' : '') + '<div class="fdw">' + fdWarns(m.k, m.p, m.f, m.c).map(w => '<small>⚠ ' + esc(w) + '</small>').join('') + '</div></div>';
}
function fdRead(row) {
  const ff = $('.fdfat', row), cc = $('.fdcarb', row);
  return { on: $('.fdc', row).checked, n: mname($('.fdni', row).value), k: num($('.fdk', row).value), p: num($('.fdp', row).value), f: ff ? num(ff.value) : null, c: cc ? num(cc.value) : null };
}

/* --- tampilan --- */
function fdBubble(m, last) {
  const st = FC.food, latest = fdLastFood(st) === m;
  if (m.added) {
    const a = m.added;
    return '<div class="cb a f" data-id="' + m.id + '"><div class="bt"><b>✓ ' + a.n + ' item ditambahkan</b> ke daftar makanan ' + esc(dayShort(m.d)) + '<br><small class="fdsub">' + (a.k == null ? '–' : fmt(a.k, 0)) + ' kcal · ' + (a.p == null ? '–' : fmt(a.p, 1)) + ' g protein (estimasi AI)' +
      (a.of > a.n ? ' · ' + (a.of - a.n) + ' item tidak masuk karena batas ' + M_MAX_DAY + ' item per hari' : '') + (a.moved ? ' · total lama disimpan sebagai “' + esc(M_OLD) + '”' : '') + '</small></div>' +
      (latest ? '<div class="cact">' + (!fcBusy && m.d === cur && mSnap(m.d) === a.snap ? '<button class="btn sm" data-q="fdUndo" data-id="' + m.id + '">Batalkan</button>' : '') + '<button class="btn sm ghost" data-q="fcClose">Selesai</button></div>' : '') + '</div>';
  }
  if (!latest) {   // hasil lama yang sudah diganti koreksi: ringkas, tanpa kolom isian
    const on = m.items.filter(x => x.on), s = msum(on.map(x => ({ kcal: x.k, p: x.p })));
    return '<div class="cb a" data-id="' + m.id + '"><div class="bt sum">Hasil sebelumnya: ' + on.length + ' item · ' + (s.kcal == null ? '–' : fmt(s.kcal, 0)) + ' kcal, ' + (s.p == null ? '–' : fmt(s.p, 1)) + ' g protein</div></div>';
  }
  const dim = fcBusy && fcBusyId === m.id;
  return '<div class="cb a f' + (dim ? ' dim' : '') + '" data-id="' + m.id + '"><div class="bt">' +
    '<div class="fdhd"><b>✦ Estimasi: ' + m.items.length + ' item</b> · ' + esc(dayShort(m.d)) + '</div>' + (m.note ? '<div class="fdnote">Catatan AI: ' + esc(m.note) + '</div>' : '') +
    '<div class="fdrows" data-id="' + m.id + '">' + m.items.map((x, i) => fdRowHTML(x, i, fcBusy)).join('') + '</div>' +
    '<div class="sublbl">Masuk ke waktu makan</div><div class="mealform"><div class="chips" data-id="' + m.id + '" role="group" aria-label="Waktu makan">' + slotPills('fdSlotB', m.slot) + '</div></div>' +
    '<div class="fdtot">' + esc(fdTotText(m)) + '</div></div>' +
    '<div class="cap">✦ AI (Cepat) · perkiraan kasar, bisa keliru. Hanya item bercentang yang ditambahkan.</div>' +
    (m.d !== cur ? '<div class="cap warn">Hasil ini untuk ' + esc(dayShort(m.d)) + ', bukan ' + esc(dayShort(cur)) + '. Buka lagi tanggal itu di Jurnal untuk menambahkannya.</div>' : '') +
    '<div class="cact"><button class="btn sm primary" data-q="fdAdd" data-id="' + m.id + '"' + (fcBusy ? ' disabled' : '') + '>Tambahkan</button>' + (last ? '<button class="btn sm ghost" data-q="fcRegen" data-id="' + m.id + '">Ulangi</button>' : '') + '</div></div>';
}
function fdEmptyHTML() {
  return '<div class="chempty"><div class="chic" aria-hidden="true">✦</div><h4>Estimasi gizi makanan</h4><p class="note">' +
    esc('Tulis apa yang kamu makan beserta porsinya. AI memperkirakan kalori dan protein per item; angkanya bisa kamu ubah sebelum masuk ke daftar makanan ' + dayShort(cur) + '. Kamu juga bisa melampirkan foto makanan (tombol kamera)' + (fdSR() ? ' atau berbicara (tombol mikrofon)' : '') + '. Yang dikirim ke AI hanya pesan dan foto di obrolan ini; data log tidak ikut.') +
    '</p>' + (fdSR() ? '<small class="fdmic">Dikte memakai layanan suara bawaan browser; di sebagian browser audionya diproses di server mereka.</small>' : '') + '<div class="csug">' + FD_EXAMPLES.map(t => '<button class="btn sm ghost" data-q="fdEx" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>';
}
function fdBarPaint() {   // placeholder kotak tulis untuk jenis food
  $('#fcIn').placeholder = fcPhoto ? 'Keterangan foto…' : fdOpenRes(FC.food) ? 'Koreksi atau tambahan…' : 'Tulis makanannya…';
}

/* --- alur --- */
// Rantai koreksi: pasangan (pertanyaan -> daftar terkini) sejak hasil terakhir yang sudah ditambahkan (rantai ditutup oleh Tambahkan).
// Pesan sys/err dan pertanyaan yatim (tanpa jawaban) dilewati supaya galat jaringan tidak memutus rantai.
function fdChain(st, qi) {
  const pairs = [];
  for (let i = qi - 1; i >= 0; i--) {
    const m = st.msgs[i];
    if (m.r !== 'food') continue;
    if (m.added) break;
    let j = i - 1; while (j >= 0 && st.msgs[j].r !== 'user') j--;
    if (j < 0) break;
    pairs.unshift([st.msgs[j], m]); i = j;
  }
  return pairs.slice(-FD_HIST_PAIRS);
}
const fdModelJson = m => JSON.stringify({ items: m.items.filter(x => x.on).map(x => ({ nama: x.n, porsi: x.porsi, kcal: x.k, protein: x.p })), catatan: m.note || '' });
function fdHistory(st, qi) {
  const out = [];
  fdChain(st, qi).forEach(p => out.push({ role: 'user', text: fdUserText(p[0]).slice(0, 600) }, { role: 'model', text: fdModelJson(p[1]).slice(0, 4000) }));
  return out;
}
// Batalkan: pulihkan daftar + total hari d ke keadaan sebelum Tambahkan (hanya dipanggil bila d === cur dan daftar belum berubah lagi)
function mRollback(d, b) {
  if (b.list.length) edb[d] = b.list.map(x => Object.assign({}, x)); else delete edb[d];
  const e = db[d] || (db[d] = blank());
  e.kcal = b.k; e.protein = b.p; e.updated = Date.now();
  queueSave('d'); queueSave('e'); mRefresh();
}
function fdUndo(id) {
  if (fcBusy) return;
  const m = fdMsg(id); if (!m || !m.added || fdLastFood(FC.food) !== m) return;
  const a = m.added;
  if (m.d !== cur) { toast('Tanggal sudah berganti, tidak bisa dibatalkan'); return; }
  if (mSnap(m.d) !== a.snap) { toast('Daftar sudah berubah lagi, tidak bisa dibatalkan'); return; }
  mRollback(m.d, a.before); m.added = null;
  fcPaint('end'); fcLive('Penambahan dibatalkan'); toast('Dibatalkan: ' + a.n + ' item dikeluarkan dari daftar makanan');
}
const fdUserText = u => (u.text || '(hanya foto)') + (u.img ? ' [foto terlampir]' : '');
function fdSend(q0) {
  const text = String(q0 == null ? '' : q0).trim().slice(0, FD_TXT_MAX);
  if (!text && !fcPhoto) { toast('Tulis makanannya atau lampirkan foto dulu'); return; }
  const rd = AI.ready(); if (!rd.ok) { aiFail({ code: rd.why, msg: rd.msg }); return; }
  const st = FC.food;
  st.msgs = st.msgs.filter(m => m.r !== 'err' && !m.tmp);
  fdMicStop();
  st.msgs.push({ id: ++fcId, r: 'user', text, d: cur, img: fcPhoto || undefined });
  fcPhoto = null;
  $('#fcIn').value = ''; fcDraft.food = ''; fcGrow();
  fdAsk();
}
async function fdAsk(opt) {
  opt = opt || {};
  const st = FC.food, ms = st.msgs;
  let qi = ms.length - 1, mi = -1;
  if (opt.regen) {
    mi = ms.findIndex(m => m.id === opt.regen && m.r === 'food');
    if (mi < 1 || mi !== ms.length - 1 || ms[mi].added || ms[mi - 1].r !== 'user') return;   // hanya hasil terakhir yang belum ditambahkan
    qi = mi - 1;
  }
  const qm = ms[qi]; if (!qm || qm.r !== 'user') return;
  const old = mi >= 0 ? ms[mi] : null, tok = ++fcTok, hist = fdHistory(st, qi), corr = hist.length > 0;
  const user = corr ? 'Koreksi atau tambahan dari pengguna:\n"""\n' + (qm.text || '(hanya foto)') + '\n"""' + (qm.img ? '\nFoto terlampir.' : '') + '\n\nBalas dengan daftar LENGKAP terbaru dalam JSON.'
    : qm.text ? 'Makanan yang dimakan:\n"""\n' + qm.text + '\n"""' + (qm.img ? '\nFoto terlampir menunjukkan makanan tersebut.' : '') : 'Perkirakan gizi makanan pada foto terlampir.';
  const o = { task: 'gizi', model: aiFastModel(), system: FD_SYS + (corr ? FD_CORR : '') + ' Hari ini ' + dayLong(today()) + '.', user, history: hist, image: qm.img ? { type: qm.img.type, data: qm.img.data } : undefined, json: true, max: 1400, think: 2048, timeout: 60000 };
  fcBusy = true; fcBusyId = opt.regen || 0; fcWaitStart(); fcPaint('end');
  const r = await AI.ask(o);
  if (tok !== fcTok) return;   // dibatalkan, direset, atau panel ditutup selagi menunggu
  fcBusy = false; fcWaitStop();
  if (r.code === 'cancelled') { fcBusy = true; fcStop(); return; }
  const fail = (code, msg) => { ms.push({ id: ++fcId, r: 'err', code, msg: msg || 'Terjadi kesalahan.', fix: ['off', 'nokey', 'noproxy', 'auth', 'model'].includes(code), regen: opt.regen || 0 }); fcPaint('end'); fcLive('AI belum bisa menjawab'); };
  if (!r.ok) { fail(r.code, r.msg); return; }
  const res = fdParse(r.data);
  if (!res.items.length) {
    ms.push({ id: ++fcId, r: 'sys', tmp: true, text: (corr ? 'AI tidak mengembalikan daftar untuk koreksi tadi. Daftar sebelumnya tetap ada di atas.' : 'AI tidak menemukan makanan yang bisa dihitung dari pesanmu.') + (res.note ? '\n\nCatatan AI: ' + res.note : '') + '\n\nTulis jenis makanan dan porsinya lebih jelas, lalu kirim lagi.', btn: { q: 'fdEdit', l: 'Ubah pesan' } });
    fcPaint('end'); fcLive('AI tidak menemukan makanan'); return;
  }
  const nm = { id: ++fcId, r: 'food', items: res.items, note: res.note, slot: mealSlot, d: qm.d || cur, added: null };
  if (old) ms[mi] = nm; else ms.push(nm);
  fcPaint(); fcReveal(nm.id); fcLive('Estimasi sudah tampil');
}
function fdAdd(id) {
  if (fcBusy) return;
  const st = FC.food, m = fdMsg(id); if (!m || m.added || fdLastFood(st) !== m) return;
  if (m.d !== cur) { toast('Tanggal berubah sejak estimasi. Buka lagi ' + dayShort(m.d) + ' di Jurnal, lalu buka obrolan ini'); return; }
  const picked = [];
  for (const x of m.items) {
    if (!x.on) continue;
    const label = x.n || 'item';
    if (x.k == null && x.p == null) { toast('Isi kalori atau protein untuk “' + label + '”, atau hilangkan centangnya'); return; }
    if ((x.k != null && x.k > M_IN_K) || (x.p != null && x.p > M_IN_P)) { toast('Angka “' + label + '” terlalu besar. Maksimal ' + fmt(M_IN_K, 0) + ' kcal dan ' + M_IN_P + ' g per item'); return; }
    const pk = { t: m.slot || mealSlot, n: x.n, kcal: x.k == null ? null : Math.round(x.k * 10) / 10, p: x.p == null ? null : Math.round(x.p * 10) / 10, src: 'ai' };
    ['f', 'c', 'fi'].forEach(q => { if (x[q] != null && Number.isFinite(x[q]) && x[q] >= 0 && x[q] <= M_IN_P) pk[q] = Math.round(x[q] * 10) / 10; });
    picked.push(pk);
  }
  if (!picked.length) { toast('Centang minimal satu item'); return; }
  const e0 = db[m.d], before = { list: (edb[m.d] || []).map(x => Object.assign({}, x)), k: e0 ? e0.kcal : '', p: e0 ? e0.protein : '' };
  let added = 0, moved = false;
  for (const it of picked) { const res = mAddItem(it); if (!res) break; added++; if (res === 2) moved = true; }
  if (!added) return;   // mAddItem sudah memberi toast (mis. batas 60 item)
  const s = msum(picked.slice(0, added).map(x => ({ kcal: x.kcal, p: x.p })));
  m.added = { n: added, of: picked.length, moved, k: s.kcal, p: s.p, snap: mSnap(m.d), before };
  fcPaint('end'); fcLive(added + ' item ditambahkan');
}
function fdPeek() {
  const st = FC.food, open = fdOpenRes(st), draft = $('#fcIn').value.trim();
  openSheet({ title: 'Yang akan dikirim', note: 'Hanya isi pesan di obrolan ini yang dikirim ke AI. Data log tidak ikut.', pre: true,
    text: (fcPhoto ? 'Foto terlampir (' + fcPhoto.w + '×' + fcPhoto.h + ' px, ' + fcPhoto.kb + ' KB) ikut dikirim bersama pesan; tidak disimpan.\n' : '') + 'Pesan di kotak tulis: ' + (draft ? '“' + draft.slice(0, 200) + (draft.length > 200 ? '…' : '') + '”' : '(kosong)') + '\n' + (open ? 'Daftar hasil terakhir ikut dikirim sebagai konteks koreksi.' : 'Belum ada daftar hasil; pesan berikutnya = estimasi baru.') + (fdSR() ? '\nDikte suara memakai layanan suara bawaan browser, bukan Gemini; di sebagian browser audionya diproses di server mereka.' : ''), prose: true, actions: [closeBtn] });
}
function fdNew() {
  openSheet({ title: 'Mulai obrolan makanan baru?', note: 'Obrolan di layar ini dihapus. Item yang sudah masuk ke daftar makanan tidak ikut terhapus. Tidak tersimpan di mana pun.',
    actions: [closeBtn, { label: 'Mulai baru', primary: true, fn: () => { closeSheet(); fcTok++; if (fcBusy) AI.cancel(); fcBusy = false; fcWaitStop(); FC.food = fcBlank(); fcDraft.food = ''; $('#fcIn').value = ''; fcGrow(); fcPaint('end'); } }] });
}
{
  const _new = QACT.fcNew, _peek = QACT.fcPeek;
  QACT.fcNew = () => fcKind === 'food' ? fdNew() : _new();
  QACT.fcPeek = () => fcKind === 'food' ? fdPeek() : _peek();
}
/* --- foto + dikte (langkah 4c) --- */
// Foto: dipilih lewat tombol kamera (kamera atau galeri menurut OS), diperkecil di perangkat ke sisi terpanjang <= 1024 px (JPEG 0,8, latar putih),
// hanya di memori (tidak ada di penyimpanan atau ekspor). Menempel di bubble pengguna dan dikirim hanya pada pesan itu (riwayat hanya teks).
let fdPhotoTok = 0;
function fdAuxPaint() {   // tombol foto + dikte hanya tampil di obrolan makanan; terkunci saat AI menyusun jawaban
  const food = fcKind === 'food', ph = $('#fcPhotoBtn'), mc = $('#fcMicBtn');
  if (ph) { ph.hidden = !food; ph.disabled = fcBusy; }
  if (mc) { mc.hidden = !food || !fdSR(); mc.disabled = fcBusy; }
  fdPrevPaint();
}
function fdPrevPaint() {
  const el = $('#fcPrev'); if (!el) return;
  if (fcKind !== 'food' || !fcPhoto) { if (!el.hidden) { el.hidden = true; el.innerHTML = ''; el.dataset.k = ''; } return; }
  const k = fcPhoto.w + 'x' + fcPhoto.h + ':' + fcPhoto.kb + ':' + fcPhoto.data.length;
  el.hidden = false;
  if (el.dataset.k === k) return;
  el.dataset.k = k;
  el.innerHTML = '<img class="fcthumb" src="' + esc(fcPhoto.url) + '" alt="Pratinjau foto makanan"><div class="fcinfo"><b>Foto siap dikirim</b><small>' + fcPhoto.w + '×' + fcPhoto.h + ' px · ' + fcPhoto.kb + ' KB · tidak disimpan</small></div>' +
    '<button class="chaux" data-q="fdPhotoDel" aria-label="Hapus foto">×</button>';
}
async function fdResize(file) {
  let bmp = null, tmp = '', src, w, h;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bmp = null; }
  try {
    if (bmp) { src = bmp; w = bmp.width; h = bmp.height; }
    else {
      tmp = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('bukan gambar')); img.src = tmp; });
      src = img; w = img.naturalWidth; h = img.naturalHeight;
    }
    if (!w || !h) throw new Error('kosong');
    const sc = Math.min(1, FD_IMG_MAX / Math.max(w, h)), cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); cx.drawImage(src, 0, 0, cw, ch);
    const url = cv.toDataURL('image/jpeg', 0.8), data = url.split(',')[1];
    if (!data) throw new Error('gagal');
    return { type: 'image/jpeg', data, url, w: cw, h: ch, kb: Math.max(1, Math.round(data.length * 3 / 4 / 1024)) };
  } finally { if (bmp && bmp.close) bmp.close(); if (tmp) URL.revokeObjectURL(tmp); }
}
async function fdPickPhoto(file) {
  if (!file || fcKind !== 'food') return;
  if (file.type && !/^image\//.test(file.type)) { toast('File itu bukan gambar. Pilih foto (JPG atau PNG)'); return; }
  if (file.size > FD_FILE_MAX) { toast('Foto terlalu besar (maksimal 30 MB)'); return; }
  const tok = ++fdPhotoTok;
  try {
    const p = await fdResize(file);
    if (tok !== fdPhotoTok || fcKind !== 'food' || fcBusy) return;   // panel ditutup, AI dimatikan, atau pesan sedang dikirim selagi foto diproses
    fcPhoto = p; fcDraft.food = $('#fcIn').value; fcBarPaint(); fcLive('Foto terlampir');
  } catch (e) { toast('Foto tidak bisa dibaca. Coba foto lain (JPG atau PNG)'); }
}
// Dikte: Web Speech API id-ID, hanya mengisi kotak tulis (tidak mengirim). Ketik selalu bisa. Menyentuh kotak tulis saat mendengarkan = dikte berhenti.
function fdMic() {
  if (fcKind !== 'food' || fcBusy) return;
  if (fdRec) { fdMicStop(); return; }
  const SR = fdSR(); if (!SR) { toast('Browser ini belum mendukung dikte. Ketik saja'); return; }
  let rec; try { rec = new SR(); } catch (e) { toast('Dikte tidak bisa dimulai. Ketik saja'); return; }
  rec.lang = 'id-ID'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  const inp = $('#fcIn'), base = inp.value.replace(/\s+$/, '');
  let fin = '';
  rec.onresult = ev => {
    if (fcKind !== 'food') return;
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i], t = r[0] ? String(r[0].transcript || '') : '';
      if (r.isFinal) fin = (fin ? fin + ' ' : '') + t.trim(); else interim += t;
    }
    const add = [fin, interim.trim()].filter(Boolean).join(' ');
    inp.value = ((base && add ? base + ' ' : base) + add).slice(0, FD_TXT_MAX); fcDraft.food = inp.value; fcGrow();
  };
  rec.onerror = ev => {
    const e = ev && ev.error;
    if (e === 'aborted') return;
    toast(e === 'not-allowed' || e === 'service-not-allowed' ? 'Izin mikrofon ditolak. Aktifkan di pengaturan browser, atau ketik saja'
      : e === 'no-speech' ? 'Tidak ada suara terdengar. Coba lagi atau ketik saja'
      : e === 'network' ? 'Dikte butuh koneksi internet. Ketik saja'
      : e === 'audio-capture' ? 'Mikrofon tidak ditemukan. Ketik saja'
      : 'Dikte gagal. Ketik saja');
  };
  rec.onend = () => { if (fdRec === rec) fdRec = null; fdMicPaint(false); };
  fdRec = rec; fdMicPaint(true);
  try { rec.start(); toast('Mendengarkan… ucapkan makananmu'); } catch (e) { fdRec = null; fdMicPaint(false); toast('Dikte tidak bisa dimulai. Ketik saja'); }
}
QACT.fdPhoto = () => { if (fcKind !== 'food' || fcBusy) return; fdMicStop(); const f = $('#fcFile'); if (f) f.click(); };
QACT.fdPhotoDel = () => { fcPhoto = null; fdPhotoTok++; fcBarPaint(); fcLive('Foto dihapus'); };
QACT.fdMic = () => fdMic();
{
  const f = $('#fcFile');
  if (f) f.addEventListener('change', e => { const file = e.target.files && e.target.files[0]; e.target.value = ''; fdPickPhoto(file); });
  $('#fcIn').addEventListener('input', () => { if (fdRec) fdMicStop(); });
}
QACT.foodAi = () => fcOpen('food');
QACT.fdEx = el => { const t = $('#fcIn'); if (!t) return; t.value = el.dataset.t || ''; fcDraft.food = t.value; fcGrow(); t.focus(); };
QACT.fdSlotB = el => {
  const box = el.closest('.chips'), m = box && fdMsg(+box.dataset.id); if (!m) return;
  m.slot = mealSlot = el.dataset.v;
  $$('.pill', box).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === m.slot)));
  mealPaint();
};
QACT.fdAdd = el => fdAdd(+el.dataset.id);
QACT.fdUndo = el => fdUndo(+el.dataset.id);
QACT.fdEdit = () => {   // kembalikan pesan terakhir ke kotak tulis (setelah hasil kosong)
  if (fcBusy) return;
  const st = FC.food; let i = st.msgs.length - 1; while (i >= 0 && st.msgs[i].r !== 'user') i--; if (i < 0) return;
  const m = st.msgs[i]; st.msgs.splice(i);
  const inp = $('#fcIn'), c = inp.value.trim(); inp.value = [m.text, c].filter(Boolean).join('\n\n'); fcDraft.food = inp.value; fcGrow();
  if (m.img && !fcPhoto) fcPhoto = m.img;
  fcPaint('end'); inp.focus();
};
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || !el.closest) return;
  const row = el.closest('.fdrows .fdr'); if (!row) return;
  const box = row.closest('.fdrows'), m = fdMsg(+box.dataset.id), it = m && m.items[+row.dataset.i]; if (!it) return;
  Object.assign(it, fdRead(row));
  const w = $('.fdw', row); if (w) w.innerHTML = fdWarns(it.k, it.p, it.f, it.c).map(t => '<small>⚠ ' + esc(t) + '</small>').join('');
  const t = $('.fdtot', box.closest('.bt')); if (t) t.textContent = fdTotText(m);
});
document.addEventListener('change', ev => {
  const el = ev.target; if (!el || !el.classList || !el.classList.contains('fdc')) return;
  const row = el.closest('.fdrows .fdr'); if (!row) return;
  const box = row.closest('.fdrows'), m = fdMsg(+box.dataset.id), it = m && m.items[+row.dataset.i]; if (!it) return;
  it.on = el.checked; row.classList.toggle('off', !el.checked);
  const t = $('.fdtot', box.closest('.bt')); if (t) t.textContent = fdTotText(m);
});

window.DL = Object.freeze(Object.assign({}, window.DL, { fc: Object.freeze({ state: () => JSON.parse(JSON.stringify(FC, (k, v) => (k === 'data' || k === 'url') ? undefined : v)), kind: () => fcKind, busy: () => fcBusy, photo: () => fcPhoto ? { type: fcPhoto.type, w: fcPhoto.w, h: fcPhoto.h, kb: fcPhoto.kb, len: fcPhoto.data.length } : null }) }));

window.DL = Object.freeze(Object.assign({}, window.DL, { b12: Object.freeze({ frac: kcalFrac, streak: chkStreak, score: dayScore, planLine, clean: briefClean, ctx: homeAiCtx, prios: homePrios, cache: () => JSON.parse(JSON.stringify({ brief: FC.brief, review: FC.review })) }) }));


/* ===== MODUL: PROFIL, BMR/TDEE & CEK TARGET FASE (batch 13) ===== */
// Mifflin-St Jeor (1990): pria 10 x kg + 6,25 x cm - 5 x usia + 5; wanita ... - 161. Divalidasi untuk usia 19-78, galat sekitar +-10% per orang.
const ACT_LO = 1.375, ACT_HI = 1.55;        // pengali aktivitas: ringan sampai sedang (dipakai sebagai rentang, bukan satu angka)
const KCAL_KG = 7700;                        // 1 kg lemak ~ 7.700 kcal: pendekatan statis, hasil nyata bisa lebih lambat
const PF_LIM = { h: [120, 230], a: [19, 78], kg: [30, 300] };
const PH_DEF = { 1: 500 };                   // defisit yang tertulis di teks fase (hanya Fase 1: "Defisit ±500 kcal")
const WK_MONTH = 30.4375 / 7;                // pekan per bulan rata-rata
const pfd = () => pdb.profile || { tinggi: '', usia: '', jk: '' };
const r10 = n => Math.round(n / 10) * 10;
const kgOk = v => v != null && v >= PF_LIM.kg[0] && v <= PF_LIM.kg[1];
const bmrOf = (kg, cm, age, jk) => 10 * kg + 6.25 * cm - 5 * age + (jk === 'L' ? 5 : -161);

/* keadaan isian profil: empty | partial | range | ok */
function pfState() {
  const p = pfd(), h = num(p.tinggi), a = num(p.usia), jk = p.jk === 'L' || p.jk === 'P' ? p.jk : '';
  const miss = [];
  if (h == null) miss.push('tinggi');
  if (a == null) miss.push('usia');
  if (!jk) miss.push('jenis kelamin');
  if (miss.length === 3) return { st: 'empty' };
  if (miss.length) return { st: 'partial', miss };
  if (h < PF_LIM.h[0] || h > PF_LIM.h[1] || a < PF_LIM.a[0] || a > PF_LIM.a[1] || a !== Math.floor(a)) return { st: 'range', h, a, jk };
  return { st: 'ok', h, a, jk };
}

/* energi harian: BMR, rentang TDEE, selisih terhadap rentang target kalori fase (+ = defisit, - = surplus) */
function calcEnergy(pf, kg, ph) {
  const bmr = bmrOf(kg, pf.h, pf.a, pf.jk);
  const lo = bmr * ACT_LO, hi = bmr * ACT_HI, mid = (lo + hi) / 2;
  const tgE = effTg(ph), iLo = tgE.kcal, iHi = tgE.kcalHi, iMid = (iLo + iHi) / 2;
  const dLo = lo - iHi, dHi = hi - iLo, dMid = mid - iMid;
  const rate = d => d * 7 / KCAL_KG, pct = d => rate(d) / kg * 100;
  return {
    bmr, kg, ph: ph.id, mode: ph.tg.mode, tdee: [lo, hi, mid], intake: [iLo, iHi, iMid], def: [dLo, dHi, dMid],
    rate: [rate(dLo), rate(dHi), rate(dMid)], pct: [pct(dLo), pct(dHi), pct(dMid)], belowBmr: iHi < bmr
  };
}

/* kebutuhan target fase (tanpa profil): laju dan defisit agar target berat tercapai di akhir fase */
function phaseNeed(ph, b0) {
  if (ph.bwGoal == null) return null;
  const G = effGoal(ph), s0 = ph.id === 1 ? b0 : effGoal(PHASES[ph.id - 2]);
  const weeks = (ph.m[1] - ph.m[0] + 1) * WK_MONTH, kg = s0 - G;
  if (!(kg > 0)) return { ph: ph.id, s0, goal: G, weeks, kg: 0, none: true };
  const kgWk = kg / weeks, out = { ph: ph.id, s0, goal: G, weeks, kg, kgWk, def: kgWk * KCAL_KG / 7, pct: kgWk / s0 * 100, none: false };
  const w = PH_DEF[ph.id];
  if (w) {
    out.written = w;
    out.weeksAtWritten = kg * KCAL_KG / (7 * w);
    out.monthsAtWritten = out.weeksAtWritten / WK_MONTH;
    out.endAtWritten = s0 - w * 7 / KCAL_KG * weeks;
  }
  return out;
}

/* penilaian: perbandingan dengan rentang laju yang umum disarankan (0,5-1% berat badan per pekan) dan dengan kebutuhan fase */
function energyVerdict(c, need) {
  const kc = n => fmt(r10(Math.abs(n)), 0);
  if (c.mode === 'range') {
    const d = c.def[2], lim = c.tdee[2] * 0.1;
    if (Math.abs(d) <= lim) return { tone: 'ok', title: 'Target kalori sekitar maintenance', text: 'Selisih tengah ±' + kc(d) + ' kcal/hari dari TDEE perkiraan, sesuai status fase: maintenance / recomp. Galat rumus sekitar ±10%.' };
    if (d > 0) return { tone: 'info', title: 'Target kalori di bawah maintenance perkiraan', text: 'Defisit tengah ±' + kc(d) + ' kcal/hari, padahal teks fase menyebut maintenance / recomp. Periksa apakah TDEE perkiraan ini sesuai dengan aktivitasmu.' };
    return { tone: 'info', title: 'Target kalori di atas maintenance perkiraan', text: 'Surplus tengah ±' + kc(d) + ' kcal/hari; teks fase menyebut surplus tipis.' };
  }
  const d = c.def[2], r = c.rate[2], p = c.pct[2];
  const base = 'Defisit tengah ±' + kc(d) + ' kcal/hari ≈ ' + fmt(r, 2) + ' kg/pekan (' + fmt(p, 2) + '% berat badan per pekan)';
  let out;
  if (d <= 0) out = { tone: 'bad', title: 'Tidak ada defisit pada perkiraan ini', text: 'Target kalori setara atau di atas TDEE perkiraan, jadi berat badan tidak diharapkan turun. Periksa isian profil, berat, dan tingkat aktivitas sebenarnya.' };
  else if (p > 1) out = { tone: 'bad', title: 'Perkiraan laju di atas 1% berat badan per pekan', text: base + '. Untuk menjaga otot, yang umum disarankan 0,5–1% per pekan.' };
  else if (p >= 0.5) out = { tone: 'ok', title: 'Perkiraan laju dalam rentang yang disarankan', text: base + ', di dalam 0,5–1% per pekan yang umum disarankan.' };
  else out = { tone: 'info', title: 'Perkiraan laju di bawah 0,5% per pekan', text: base + '. Pelan, tetapi wajar bila target fase memang kecil.' };
  if (need && !need.none && d > 0) {
    const q = r / need.kgWk;
    out.text += ' Target Fase ' + need.ph + ' butuh ±' + fmt(need.kgWk, 2) + ' kg/pekan: perkiraanmu ' + (q < 0.8 ? 'lebih pelan dari itu.' : q > 1.25 ? 'lebih cepat dari itu.' : 'sekitar sama.');
  }
  return out;
}

const alertHTML = (tone, title, text) => '<div class="plan alert' + (tone === 'bad' ? ' bad' : '') + '"><div><b>' + esc(title) + '</b><small>' + esc(text) + '</small></div></div>';
function defTxt(lo, hi) {
  const f = n => fmt(r10(Math.abs(n)), 0);
  if (lo >= 0) return 'defisit ' + f(lo) + '–' + f(hi) + ' kcal/hari';
  if (hi <= 0) return 'surplus ' + f(hi) + '–' + f(lo) + ' kcal/hari';
  return 'surplus ' + f(lo) + ' sampai defisit ' + f(hi) + ' kcal/hari';
}

/* kartu "Profil & energi" di Peta */
function rmEnergyHTML() {
  const p = pos(today()), ph = (p && p.ph) || PHASES[0], b0 = bwStart(), lb = latestBw(), st = pfState();
  const need = kgOk(b0) ? phaseNeed(ph, b0) : null;
  let h = '';
  if (!(p && p.ph)) h += '<p class="note">Tanggal mulai belum tiba atau belum diatur, jadi Fase 1 dipakai sebagai acuan.</p>';

  /* A. energi harian (butuh profil) */
  if (st.st === 'empty') h += '<p class="note">Isi tinggi, usia, dan jenis kelamin untuk menghitung BMR (energi saat istirahat) dan TDEE (kebutuhan energi harian). Disimpan di perangkat dan ikut cadangan; tidak dikirim ke AI.</p>';
  else if (st.st === 'partial') h += '<p class="note">Lengkapi ' + esc(st.miss.join(', ')) + ' untuk melihat BMR dan TDEE.</p>';
  else if (st.st === 'range') h += '<p class="note">Rumus Mifflin-St Jeor dipakai untuk usia ' + PF_LIM.a[0] + '–' + PF_LIM.a[1] + ' tahun (angka bulat) dan tinggi ' + PF_LIM.h[0] + '–' + PF_LIM.h[1] + ' cm, jadi aplikasi tidak menampilkan angka untuk isian ini.</p>';
  else {
    const useWk = lb && kgOk(lb.v), kg = useWk ? lb.v : b0;
    if (!kgOk(kg)) h += '<p class="note">Berat badan awal tidak masuk akal (' + PF_LIM.kg[0] + '–' + PF_LIM.kg[1] + ' kg), jadi energi harian tidak dihitung. Perbaiki di bagian Mulai perjalanan.</p>';
    else {
      const c = calcEnergy(st, kg, ph), tg = effTg(ph);
      h += '<h3 class="rmh">Energi harian<span class="tag">perkiraan</span></h3>' +
        kv('Berat yang dipakai', fmt(kg, 1) + ' kg <small>(' + (useWk ? 'pekan ' + esc(shortDate(lb.w)) : 'berat awal') + ')</small>') +
        kv('BMR', '±' + fmt(r10(c.bmr), 0) + ' kcal') +
        kv('TDEE', fmt(r10(c.tdee[0]), 0) + '–' + fmt(r10(c.tdee[1]), 0) + ' kcal') +
        kv('Target kalori Fase ' + ph.id, fmt(tg.kcal, 0) + '–' + fmt(tg.kcalHi, 0) + ' kcal') +
        kv('Selisih', defTxt(c.def[0], c.def[1]));
      if (c.mode !== 'range' && c.def[2] > 0) h += kv('Laju turun perkiraan', '±' + fmt(c.rate[2], 2) + ' kg/pekan <small>(' + fmt(c.pct[2], 2) + '%)</small>');
      if (c.belowBmr) h += alertHTML('bad', 'Batas atas target kalori di bawah BMR perkiraan', 'Target ' + fmt(tg.kcalHi, 0) + ' kcal, BMR perkiraan ±' + fmt(r10(c.bmr), 0) + ' kcal (bisa meleset ±10%). Makan di bawah BMR dalam waktu lama bisa menguras tenaga dan menyulitkan pemulihan latihan. Bila sering lemas atau pusing, jangan dipaksakan; tanyakan ke dokter atau ahli gizi.');
      const v = energyVerdict(c, need);
      h += alertHTML(v.tone, v.title, v.text);
    }
  }

  /* B. cek target fase (tanpa profil) */
  if (ph.bwGoal == null) h += '<h3 class="rmh">Cek target Fase ' + ph.id + '</h3><p class="note">Fase ' + ph.id + ': pertahankan berat badan, jadi tidak ada target penurunan untuk dicek.</p>';
  else if (!need) h += '<h3 class="rmh">Cek target Fase ' + ph.id + '</h3><p class="note">Berat badan awal tidak masuk akal (' + PF_LIM.kg[0] + '–' + PF_LIM.kg[1] + ' kg), jadi target fase tidak dicek.</p>';
  else if (need.none) h += '<h3 class="rmh">Cek target Fase ' + ph.id + '</h3><p class="note">Berat awal fase ini (' + fmt(need.s0, 1) + ' kg) sudah di bawah atau sama dengan targetnya (' + fmt(need.goal, 0) + ' kg), jadi tidak ada penurunan yang dibutuhkan.</p>';
  else {
    h += '<h3 class="rmh">Cek target Fase ' + ph.id + '</h3>' +
      kv('Target fase', fmt(need.s0, 1) + ' → ' + fmt(need.goal, 0) + ' kg') +
      kv('Waktu fase', '±' + fmt(need.weeks, 0) + ' pekan <small>(' + (ph.m[1] - ph.m[0] + 1) + ' bulan)</small>') +
      kv('Laju dibutuhkan', '±' + fmt(need.kgWk, 2) + ' kg/pekan <small>(' + fmt(need.pct, 2) + '%)</small>') +
      kv('Defisit dibutuhkan', '±' + fmt(r10(need.def), 0) + ' kcal/hari');
    if (need.written && Math.abs(need.def - need.written) / need.written > 0.2)
      h += alertHTML('bad', 'Dua angka di teks Fase ' + ph.id + ' tidak cocok', 'Teks menulis defisit ±' + fmt(need.written, 0) + ' kcal/hari, tetapi turun ' + fmt(need.kg, 0) + ' kg dalam ' + fmt(need.weeks, 0) + ' pekan butuh ±' + fmt(r10(need.def), 0) + ' kcal/hari. Dengan defisit ' + fmt(need.written, 0) + ', ' + fmt(need.kg, 0) + ' kg butuh ±' + fmt(need.weeksAtWritten, 0) + ' pekan (±' + fmt(need.monthsAtWritten, 1) + ' bulan), atau berat di akhir fase ±' + fmt(need.endAtWritten, 1) + ' kg. Waktu yang lebih longgar atau defisit lebih besar adalah pilihanmu. Teks fase tetap menjadi rencana dasar; penyesuaian otomatis hanya menggeser batas kalori dan target berat (lihat Penyesuaian rencana).');
    h += '<p class="note">' + (need.pct > 1 ? 'Laju yang dibutuhkan di atas 1% berat badan per pekan: lebih cepat dari 0,5–1% yang umum disarankan untuk menjaga otot.' : need.pct >= 0.5 ? 'Laju yang dibutuhkan ada di dalam 0,5–1% berat badan per pekan yang umum disarankan.' : 'Laju yang dibutuhkan di bawah 0,5% berat badan per pekan: santai, masih ada ruang.') + '</p>';
  }
  return h + '<p class="note">Perkiraan kasar, bukan diagnosis atau saran medis. BMR memakai rumus Mifflin-St Jeor (galat sekitar ±10% per orang); TDEE = BMR × ' + fmt(ACT_LO, 3) + '–' + fmt(ACT_HI, 2) + ' (aktivitas ringan sampai sedang). 1 kg lemak ≈ 7.700 kcal hanyalah pendekatan; hasil nyata bisa lebih lambat. Perhitungan ini sendiri tidak mengubah apa pun; penyesuaian otomatis ada di bagian Penyesuaian rencana dan bisa dimatikan.</p>';
}

/* isian profil */
function pfSet(patch) {
  pdb.profile = Object.assign({}, pfd(), patch);
  pdb.updated = Date.now();
  queueSave('p');
  const box = $('#rmEnergy');
  if (box) box.innerHTML = rmEnergyHTML();   // hanya kartu energi: <details> fase yang dibuka tidak ikut tertutup
  ptSums();
}
function pfPaint() { $$('[data-q="pfSex"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === pfd().jk))); }
function pfPopulate() { $$('[data-pf]').forEach(el => { el.value = pfd()[el.dataset.pf] || ''; }); pfPaint(); }
document.addEventListener('input', ev => {
  const el = ev.target, k = el.dataset && el.dataset.pf;
  if (!k) return;
  const raw = el.value, v = (k === 'usia' ? raw.replace(/\D/g, '') : raw.replace(/[^0-9.,]/g, '')).slice(0, k === 'usia' ? 3 : 6);
  if (v !== raw) el.value = v;
  pfSet({ [k]: v });
});
QACT.pfSex = el => { pfSet({ jk: pfd().jk === el.dataset.v ? '' : el.dataset.v }); pfPaint(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b13: Object.freeze({ bmr: bmrOf, calc: calcEnergy, need: phaseNeed, verdict: energyVerdict, state: pfState, html: rmEnergyHTML, lim: PF_LIM, io: Object.freeze({ backup: backupText, imp: importData, pclean, pblank, pdb: () => JSON.parse(JSON.stringify(pdb)) }) }) }));


/* ===== MODUL: PENYESUAIAN RENCANA OTOMATIS (batch 13, langkah 5a: model + mesin) ===== */
// Rencana dasar (PHASES) tidak pernah ditimpa. Penyesuaian disimpan sebagai riwayat entri di pdb.adj.log dan dilipat per tanggal,
// jadi target hari yang sudah lewat tidak berubah. Mesin saran lokal dan deterministik (tanpa AI, tanpa jaringan), hanya membaca berat mingguan.
const ADJ_STEP = 100;        // langkah batas kalori (kcal)
const ADJ_KCAL_MAX = 200;    // total geser kalori dari rencana dasar (+-)
const ADJ_GOAL_MAX = 3;      // total pelonggaran target berat dari rencana dasar (kg)
const ADJ_COOL = 21;         // jeda antar penyesuaian (hari), supaya efeknya sempat terlihat di berat
const ADJ_LOG_MAX = 40;
const ADJ_DIS_DAYS = 7;      // saran yang diabaikan disembunyikan selama ini
const adjd = () => (pdb.adj && typeof pdb.adj === 'object' && Array.isArray(pdb.adj.log)) ? pdb.adj : { mode: 'auto', dis: null, log: [] };
const adjActive = () => adjd().log.filter(e => !e.off);

/* nilai efektif fase ph pada tanggal date: dasar + entri aktif dengan ph sama dan from <= date */
function adjEff(ph, date) {
  const out = { kcal: ph.tg.kcal, kcalHi: ph.tg.kcalHi, goal: ph.bwGoal, adj: false, n: 0 };
  adjActive().filter(e => e.ph === ph.id && e.from <= date)
    .sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : (a.t || 0) - (b.t || 0))
    .forEach(e => {
      if (e.kcal != null) { out.kcal = e.kcal; out.kcalHi = e.kcalHi != null ? e.kcalHi : e.kcal + (ph.tg.kcalHi - ph.tg.kcal); }
      if (e.goal != null && ph.bwGoal != null) out.goal = e.goal;
      out.adj = true; out.n++;
    });
  return out;
}
/* target kalori efektif (objek tg milik fase, dengan kcal/kcalHi yang disesuaikan); tanpa entri = objek dasar apa adanya */
function effTg(ph, date) {
  const e = adjEff(ph, date || today());
  if (!e.adj) return ph.tg;
  return Object.assign({}, ph.tg, { kcal: e.kcal, kcalHi: e.kcalHi, adj: true });
}

/* Senin pertama yang >= f: awal jendela tren yang tidak mencampur data sebelum dan sesudah titik f */
const adjMonOnAfter = f => { const w = weekStart(f); return w >= f ? w : addDays(w, 7); };
function adjWindowFrom(ph) {
  const last = adjActive().filter(e => e.ph === ph.id).map(e => e.from).sort().pop();
  const ps = phStart(ph);
  const f = (last && (!ps || last > ps)) ? last : ps;
  return f ? adjMonOnAfter(f) : null;
}

/* evaluasi: {st:'prop', prop} atau {st:<kode>, why, ...}; murni (tidak menulis apa pun) */
function adjEval(date) {
  date = date || today();
  const A = adjd(), out = { mode: A.mode, date };
  const none = (st, why, x) => Object.assign(out, { st, why, prop: null }, x || {});
  if (!pdb.start) return none('nostart', 'Tanggal mulai belum diatur di bagian Mulai perjalanan, jadi fase aktif tidak diketahui. Penyesuaian membutuhkannya.');
  const p = pos(date);
  if (!p || !p.ph) return none('before', 'Perjalanan belum dimulai. Penyesuaian mulai dinilai setelah tanggal mulai.');
  const ph = p.ph; out.ph = ph.id;
  if (ph.bwGoal == null || ph.id > 2) return none('phase', 'Penyesuaian otomatis hanya untuk Fase 1 dan 2 (fase penurunan berat). Fase ' + ph.id + ' tidak disesuaikan.');
  const act = adjActive(), lastAny = act.map(e => e.from).sort().pop();
  if (lastAny && diffDays(lastAny, date) < ADJ_COOL) {
    const until = addDays(lastAny, ADJ_COOL);
    return none('cool', 'Penyesuaian terakhir berlaku sejak ' + dY(lastAny) + '. Penilaian berikutnya setelah ' + dY(until) + ', supaya efeknya sempat terlihat di berat badan.', { until });
  }
  const from = adjWindowFrom(ph), t = trendOf('bw', 12, from);
  out.t = t; out.from = from;
  if (!t.ok) return none('few', 'Butuh minimal ' + TR_MIN + ' pekan berisi berat badan sejak awal fase atau sejak penyesuaian terakhir (sekarang ' + t.cnt + ').', { cnt: t.cnt });
  const kgWk = -t.slope, pct = kgWk / t.fitLast * 100, se = t.se || 0, lowPct = (kgWk - se) / t.fitLast * 100;
  const eff = adjEff(ph, date), wIn = diffDays(phStart(ph), date) / 7;
  const devK = eff.kcal - ph.tg.kcal;
  const ev = { kgWk, pct, lowPct, wIn, cnt: t.cnt, eff };
  Object.assign(out, ev);
  const rate = '±' + fmt(Math.abs(kgWk), 2) + ' kg/pekan (' + fmt(Math.abs(pct), 2) + '% berat badan)';
  const mk = (kind, auto, change, title, text) => Object.assign(out, {
    st: 'prop', why: null,
    prop: { kind, auto, ph: ph.id, change, title, text, sig: kind + '|' + ph.id + '|' + JSON.stringify(change) }
  });

  // F: terlalu cepat -> kalori naik (arah aman, boleh otomatis)
  if (pct > 1 && lowPct > 0.8) {
    if (devK + ADJ_STEP > ADJ_KCAL_MAX) return none('capped', 'Laju turun ' + rate + ' di atas 1% per pekan, tetapi batas kalori sudah naik ' + fmt(devK, 0) + ' kcal dari rencana dasar (maksimal ' + ADJ_KCAL_MAX + '). Aplikasi tidak menaikkan lagi; pertimbangkan sendiri atau reset ke rencana dasar.', ev);
    return mk('faster', true, { kcal: eff.kcal + ADJ_STEP, kcalHi: eff.kcalHi + ADJ_STEP },
      'Laju turun terlalu cepat: naikkan batas kalori ' + ADJ_STEP + ' kcal',
      'Garis tren turun ' + rate + ' dari ' + t.cnt + ' pekan data, di atas 1% per pekan yang umum disarankan agar otot terjaga. Batas kalori Fase ' + ph.id + ' naik dari ' + fmt(eff.kcal, 0) + ' ke ' + fmt(eff.kcal + ADJ_STEP, 0) + ' kcal. Perkiraan kasar.');
  }
  // C: datar / naik -> kalori turun (selalu tanya dulu; butuh profil dan lantai BMR)
  if (pct < 0.2 && t.cnt >= 4 && wIn >= 4) {
    const st = pfState();
    const blocked = why => none('cut-blocked', 'Berat tidak turun (' + (kgWk <= 0 ? 'garis tren datar atau naik' : 'garis tren ' + rate) + ' selama ' + t.cnt + ' pekan), tetapi aplikasi tidak menyarankan memotong kalori: ' + why + ' Cek dulu isian berat dan catatan makan; naik-turun air bisa menutupi tren.', ev);
    if (st.st !== 'ok') return blocked('profil (tinggi, usia, jenis kelamin) belum lengkap, jadi batas aman terhadap BMR tidak bisa dihitung.');
    const bmr = calcEnergy(st, t.fitLast, ph).bmr, newHi = eff.kcalHi - ADJ_STEP, newK = eff.kcal - ADJ_STEP;
    if (newHi < bmr) return blocked('batas atas baru (' + fmt(newHi, 0) + ' kcal) akan di bawah BMR perkiraan (±' + fmt(r10(bmr), 0) + ' kcal).');
    if (ph.tg.kcal - newK > ADJ_KCAL_MAX) return blocked('batas kalori sudah turun ' + fmt(ph.tg.kcal - eff.kcal, 0) + ' kcal dari rencana dasar (maksimal ' + ADJ_KCAL_MAX + ').');
    return mk('cut', false, { kcal: newK, kcalHi: newHi },
      'Berat belum turun: kurangi batas kalori ' + ADJ_STEP + ' kcal?',
      'Garis tren ' + (kgWk <= 0 ? 'datar atau naik' : 'turun ' + rate) + ' selama ' + t.cnt + ' pekan. Sebelum memotong, cek isian berat dan catatan makan. Batas kalori Fase ' + ph.id + ' dari ' + fmt(eff.kcal, 0) + ' ke ' + fmt(newK, 0) + ' kcal; batas atas baru ' + fmt(newHi, 0) + ' tetap di atas BMR perkiraan (±' + fmt(r10(bmr), 0) + '). Perkiraan kasar, bukan saran medis.');
  }
  // G: target berat tak terkejar -> target dilonggarkan (arah aman, boleh otomatis)
  const end = phEnd(ph);
  if (kgWk > 0.1 && end && t.cnt >= 4) {
    const ref = addDays(t.last.w, 3), left = Math.max(0, diffDays(ref, end) / 7), endW = t.fitLast - kgWk * left;
    out.endW = endW;
    if (endW > eff.goal + 1) {
      if (wIn < 6) return none('early', 'Berat perkiraan di akhir fase (±' + fmt(endW, 1) + ' kg) masih di atas target ' + fmt(eff.goal, 0) + ' kg, tetapi baru ' + fmt(Math.floor(wIn), 0) + ' pekan di fase ini; dinilai lagi mulai pekan ke-6.', ev);
      const cap = ph.bwGoal + ADJ_GOAL_MAX, ng = Math.min(Math.ceil(endW * 2) / 2, cap);
      if (!(ng > eff.goal)) return none('capped', 'Target berat sudah dilonggarkan sampai batas (' + fmt(eff.goal, 1) + ' kg, maksimal +' + ADJ_GOAL_MAX + ' kg dari rencana dasar). Aplikasi tidak menggeser lagi.', ev);
      if (!(ng <= t.fitLast - 0.5)) return none('capped', 'Target baru (' + fmt(ng, 1) + ' kg) tidak lagi di bawah berat sekarang (±' + fmt(t.fitLast, 1) + ' kg), jadi tidak bermakna sebagai target. Aplikasi tidak menggesernya.', ev);
      return mk('goal', true, { goal: ng },
        'Target berat Fase ' + ph.id + ' kemungkinan tak terkejar: geser ke ' + fmt(ng, 1) + ' kg',
        'Dengan laju ' + rate + ', berat perkiraan di akhir fase (' + dY(end) + ') sekitar ' + fmt(endW, 1) + ' kg, lebih dari target ' + fmt(eff.goal, 0) + ' kg. Target digeser ke ' + fmt(ng, 1) + ' kg supaya terkejar; kalori tidak berubah. Perkiraan kasar.');
    }
  }
  if (pct > 1) return none('noisy', 'Laju ' + rate + ' di atas 1%, tetapi kisarannya lebar (galat baku ±' + fmt(se, 2) + ' kg/pekan) untuk ' + t.cnt + ' pekan data, jadi belum cukup yakin untuk mengubah rencana.', ev);
  return none('ok', 'Belum ada yang perlu diubah. Laju ' + rate + ' dari ' + t.cnt + ' pekan data' + (out.endW != null ? '; berat perkiraan di akhir fase ±' + fmt(out.endW, 1) + ' kg' : '') + '.', ev);
}

const adjDismissed = prop => { const d = adjd().dis; return !!(prop && d && d.sig === prop.sig && d.until >= today()); };
const adjUid = () => 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
function adjTouch() {
  pdb.updated = Date.now();
  queueSave('p');
  derived();
  adjRepaint();
}
/* terapkan saran: menambah entri berlaku mulai besok. Mengembalikan entri, atau null bila ditolak (riwayat penuh / saran tidak sah) */
function adjApply(prop, auto) {
  if (!prop || !prop.change || !Number.isInteger(prop.ph)) return null;
  if (!pdb.adj || !Array.isArray(pdb.adj.log)) pdb.adj = { mode: 'auto', dis: null, log: [] };
  const A = pdb.adj;
  while (A.log.length >= ADJ_LOG_MAX) { const i = A.log.findIndex(e => e.off); if (i < 0) return null; A.log.splice(i, 1); }
  const c = prop.change, e = {
    id: adjUid(), from: addDays(today(), 1), ph: prop.ph,
    kcal: c.kcal != null ? c.kcal : null, kcalHi: c.kcalHi != null ? c.kcalHi : null, goal: c.goal != null ? c.goal : null,
    kind: prop.kind, why: String(prop.title || '').slice(0, 200), auto: !!auto, t: Date.now(), off: false
  };
  A.log.push(e);
  A.dis = null;
  adjTouch();
  return e;
}
/* tanda tangan saran dari sebuah entri (sama dengan prop.sig di adjEval) */
const adjSigOf = e => { const c = {}; if (e.kcal != null) { c.kcal = e.kcal; c.kcalHi = e.kcalHi; } if (e.goal != null) c.goal = e.goal; return e.kind + '|' + e.ph + '|' + JSON.stringify(c); };
/* urungkan entri aktif terbaru (tumpukan); saran yang sama disembunyikan ADJ_UNDO_DIS hari supaya tidak langsung diterapkan lagi */
function adjUndo() {
  const A = adjd(), i = (() => { for (let k = A.log.length - 1; k >= 0; k--) if (!A.log[k].off) return k; return -1; })();
  if (i < 0) return null;
  const e = A.log[i];
  e.off = true;
  A.dis = { sig: adjSigOf(e).slice(0, 80), until: addDays(today(), ADJ_UNDO_DIS) };
  adjTouch();
  return e;
}
/* urungkan hanya bila entri itu masih yang terbaru (untuk tombol Urungkan di toast) */
function adjUndoId(id) {
  const last = adjd().log.slice().reverse().find(e => !e.off);
  return last && last.id === id ? adjUndo() : null;
}
/* kembali ke rencana dasar: semua entri aktif ditandai dibatalkan; mengembalikan daftar id (untuk Urungkan) */
function adjReset() {
  const A = adjd(), ids = [];
  let lastE = null;
  A.log.forEach(e => { if (!e.off) { e.off = true; ids.push(e.id); lastE = e; } });
  if (ids.length) { A.dis = { sig: adjSigOf(lastE).slice(0, 80), until: addDays(today(), ADJ_UNDO_DIS) }; adjTouch(); }
  return ids;
}
function adjRestore(ids) {
  const A = adjd();
  let n = 0;
  A.log.forEach(e => { if (ids.indexOf(e.id) >= 0 && e.off) { e.off = false; n++; } });
  if (n) { A.dis = null; adjTouch(); }
  return n;
}
function adjSetMode(m) {
  if (!['auto', 'ask', 'off'].includes(m)) return false;
  if (!pdb.adj || !Array.isArray(pdb.adj.log)) pdb.adj = { mode: 'auto', dis: null, log: [] };
  pdb.adj.mode = m;
  adjTouch();
  return true;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b13a: Object.freeze({ eff: adjEff, effTg, eval: adjEval, apply: adjApply, undo: adjUndo, reset: adjReset, setMode: adjSetMode, active: adjActive, from: adjWindowFrom, dismissed: adjDismissed, lim: Object.freeze({ step: ADJ_STEP, kcalMax: ADJ_KCAL_MAX, goalMax: ADJ_GOAL_MAX, cool: ADJ_COOL, logMax: ADJ_LOG_MAX }) }) }));

/* membersihkan satu entri riwayat (impor/muat): tanggal sah, fase 1-2, angka dibatasi pada rentang rencana dasar, teks dipotong */
function adjCleanEntry(x) {
  if (!x || typeof x !== 'object') return null;
  const ph = PHASES.find(p => p.id === x.ph);
  if (!ph || ph.id > 2 || typeof x.from !== 'string' || !DATE_RE.test(x.from)) return null;
  const n = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  let k = n(x.kcal), kh = n(x.kcalHi), g = n(x.goal);
  if (k != null) {
    k = Math.min(Math.max(Math.round(k), ph.tg.kcal - ADJ_KCAL_MAX), ph.tg.kcal + ADJ_KCAL_MAX);
    kh = kh != null ? Math.min(Math.max(Math.round(kh), ph.tg.kcalHi - ADJ_KCAL_MAX), ph.tg.kcalHi + ADJ_KCAL_MAX) : k + (ph.tg.kcalHi - ph.tg.kcal);
    if (kh < k) kh = k + (ph.tg.kcalHi - ph.tg.kcal);   // batas atas tidak boleh di bawah batas bawah (file rusak): pakai selisih rencana dasar
  } else kh = null;
  if (g != null) g = Math.min(Math.max(Math.round(g * 2) / 2, ph.bwGoal), ph.bwGoal + ADJ_GOAL_MAX);
  if (k == null && g == null) return null;
  return {
    id: String(x.id != null ? x.id : adjUid()).slice(0, 24), from: x.from, ph: ph.id, kcal: k, kcalHi: kh, goal: g,
    kind: ['faster', 'goal', 'cut'].includes(x.kind) ? x.kind : 'manual', why: String(x.why == null ? '' : x.why).slice(0, 200),
    auto: x.auto === true, t: Number(x.t) || 0, off: x.off === true
  };
}

/* ===== MODUL: PENYESUAIAN RENCANA OTOMATIS: UI + JALAN SAAT MUAT (batch 13, langkah 5b) ===== */
const ADJ_UNDO_DIS = 14;   // setelah Urungkan / Kembali ke dasar, saran yang sama tidak diajukan lagi selama ini (hari)
const adjFmtE = e => { const a = []; if (e.kcal != null) a.push('batas kalori Fase ' + e.ph + ' ' + fmt(e.kcal, 0) + ' kcal'); if (e.goal != null) a.push('target berat Fase ' + e.ph + ' ' + fmt(e.goal, 1) + ' kg'); return a.join(', '); };
function adjEnsure() { if (!pdb.adj || !Array.isArray(pdb.adj.log)) pdb.adj = { mode: 'auto', dis: null, log: [] }; return pdb.adj; }
/* gambar ulang Peta tanpa menutup <details> fase yang sedang dibuka */
function adjRepaint() {
  if (curView !== 'roadmap') return;
  const open = $$('#rmPhases details').map(d => d.open);
  rmDynamic();
  $$('#rmPhases details').forEach((d, i) => { d.open = !!open[i]; });
}
function adjFocus(sel) { const b = $(sel); if (b) b.focus(); }
/* catatan di kartu fase: teks fase = rencana dasar; ini menunjukkan angka yang sedang berlaku */
function adjPhNote(ph) {
  if (ph.id > 2) return '';
  const c = adjEff(ph, today());
  if (!c.adj) return '';
  const a = [];
  if (c.kcal !== ph.tg.kcal) a.push('batas kalori ' + fmt(c.kcal, 0) + ' kcal (dasar ' + fmt(ph.tg.kcal, 0) + ')');
  if (c.goal !== ph.bwGoal) a.push('target berat ' + fmt(c.goal, 1) + ' kg (dasar ' + fmt(ph.bwGoal, 0) + ')');
  return a.length ? '<p class="note">Disesuaikan aplikasi: ' + a.join(', ') + '. Angka di atas adalah rencana dasar.</p>' : '';
}
const ADJ_MODE_NOTE = {
  auto: 'Otomatis: saat aplikasi dibuka, aplikasi menerapkan sendiri penyesuaian yang arahnya aman (batas kalori naik atau target berat dilonggarkan), berlaku mulai besok, dengan tombol Urungkan. Memotong kalori selalu menunggu persetujuanmu.',
  ask: 'Tanya dulu: aplikasi hanya menyarankan; kamu yang menekan Terapkan.',
  off: 'Mati: tidak ada perubahan baru. Penyesuaian yang sudah berlaku tetap jalan sampai kamu menekan Kembali ke rencana dasar.'
};
const ADJ_ST_TITLE = { 'cut-blocked': 'Tidak ada saran memotong kalori', capped: 'Batas penyesuaian tercapai', noisy: 'Datanya belum cukup meyakinkan' };
function rmAdjHTML() {
  const A = adjd(), mode = A.mode, t0 = today(), t1 = addDays(t0, 1), p = pos(t0), ph = p && p.ph && p.ph.id <= 2 ? p.ph : null;
  let h = '<div class="f"><div class="lbl">Mode <small>kapan aplikasi boleh mengubah rencana</small></div><div class="seg" role="group" aria-label="Mode penyesuaian rencana">' +
    [['auto', 'Otomatis'], ['ask', 'Tanya dulu'], ['off', 'Mati']].map(x => '<button class="pill" data-q="adjMode" data-v="' + x[0] + '" aria-pressed="' + (mode === x[0]) + '">' + x[1] + '</button>').join('') + '</div></div>' +
    '<p class="note">' + esc(ADJ_MODE_NOTE[mode] || ADJ_MODE_NOTE.auto) + ' Rencana dasar di teks fase tidak pernah ditimpa.</p>';
  if (ph) {
    const c = adjEff(ph, t0), n = adjEff(ph, t1);
    h += '<h3 class="rmh" style="margin-top:6px">Rencana Fase ' + ph.id + ' yang berlaku</h3>' +
      kv('Batas kalori', fmt(c.kcal, 0) + ' kcal' + (c.kcal !== ph.tg.kcal ? ' <small>(dasar ' + fmt(ph.tg.kcal, 0) + ')</small>' : '')) +
      kv('Target berat', fmt(c.goal, 1) + ' kg' + (c.goal !== ph.bwGoal ? ' <small>(dasar ' + fmt(ph.bwGoal, 0) + ')</small>' : ''));
    if (n.kcal !== c.kcal || n.goal !== c.goal) h += '<p class="note">Mulai besok: batas kalori ' + fmt(n.kcal, 0) + ' kcal, target berat ' + fmt(n.goal, 1) + ' kg.</p>';
  }
  const ev = adjEval();
  h += '<h3 class="rmh">Penilaian<span class="tag">perkiraan</span></h3>';
  if (ev.st === 'prop') {
    const pr = ev.prop;
    h += alertHTML('info', pr.title, pr.text);
    if (adjDismissed(pr)) h += '<p class="note">Saran ini disembunyikan sampai ' + esc(dY(A.dis.until)) + '.</p>';
    else {
      const how = mode === 'off' ? 'Mode Mati: tidak diterapkan sendiri.' : (pr.auto && mode === 'auto') ? 'Mode Otomatis: diterapkan sendiri saat aplikasi dibuka berikutnya, atau tekan Terapkan sekarang.' : 'Menunggu persetujuanmu.';
      h += '<p class="note">' + how + ' Berlaku mulai besok.</p>' +
        '<div class="acts"><button class="btn primary" data-q="adjApplyNow">Terapkan</button><button class="btn ghost" data-q="adjDismiss">Sembunyikan ' + ADJ_DIS_DAYS + ' hari</button></div>';
    }
  } else if (ADJ_ST_TITLE[ev.st]) h += alertHTML('info', ADJ_ST_TITLE[ev.st], ev.why);
  else h += '<p class="note">' + esc(ev.why) + '</p>';
  h += '<div class="acts"><button class="btn" data-q="adjCheck">Periksa sekarang</button></div>';
  const log = A.log.slice().reverse(), last = log.find(e => !e.off);
  if (log.length) {
    h += '<h3 class="rmh">Riwayat penyesuaian</h3>';
    log.slice(0, 8).forEach(e => {
      h += '<div class="plan"><div><b>' + esc(adjFmtE(e)) + '</b><small>Berlaku ' + esc(dY(e.from)) + ' · ' + (e.auto ? 'otomatis' : 'manual') + (e.off ? ' · dibatalkan' : '') + (e.why ? '<br>' + esc(e.why) : '') + '</small></div>' +
        (last && e.id === last.id ? '<button class="btn" style="flex:none" data-q="adjUndo">Urungkan</button>' : '') + '</div>';
    });
    if (log.length > 8) h += '<p class="note">dan ' + (log.length - 8) + ' entri yang lebih lama.</p>';
    if (last) h += '<div class="acts"><button class="btn ghost" data-q="adjReset">Kembali ke rencana dasar</button></div>';
  }
  return h + '<p class="note">Saran dihitung di perangkat dari berat mingguan (garis regresi), tanpa AI dan tanpa internet. Angka kg/pekan itu perkiraan kasar dan berat badan naik-turun, jadi aplikasi sengaja lambat: minimal ' + TR_MIN + ' pekan data, jeda ' + ADJ_COOL + ' hari antar penyesuaian, geser kalori maksimal ±' + ADJ_KCAL_MAX + ' kcal dan target maksimal +' + ADJ_GOAL_MAX + ' kg dari rencana dasar. Ini bukan saran medis; bila sering lemas atau pusing, tanyakan ke dokter atau ahli gizi.</p>';
}

function adjUndoToast(id) {
  const e = adjUndoId(id);
  toast(e ? 'Dibatalkan: ' + adjFmtE(e) + '. Saran yang sama tidak diajukan lagi selama ' + ADJ_UNDO_DIS + ' hari.' : 'Tidak bisa diurungkan dari sini karena sudah ada penyesuaian yang lebih baru. Pakai Riwayat di Peta.');
}
QACT.adjMode = el => { const v = el.dataset.v; adjSetMode(v); adjFocus('[data-q="adjMode"][data-v="' + v + '"]'); };
QACT.adjApplyNow = () => {
  const ev = adjEval();
  if (ev.st !== 'prop') { adjRepaint(); toast('Saran itu sudah tidak berlaku.'); return; }
  const e = adjApply(ev.prop, false);
  if (e) toast('Rencana disesuaikan mulai besok: ' + adjFmtE(e), { label: 'Urungkan', fn: () => adjUndoToast(e.id) });
  else toast('Riwayat penuh, penyesuaian baru tidak bisa ditambah.');
};
QACT.adjDismiss = () => {
  const ev = adjEval();
  if (ev.st !== 'prop') { adjRepaint(); return; }
  adjEnsure().dis = { sig: ev.prop.sig.slice(0, 80), until: addDays(today(), ADJ_DIS_DAYS) };
  adjTouch();
  toast('Saran disembunyikan ' + ADJ_DIS_DAYS + ' hari.');
};
QACT.adjCheck = () => {
  const ev = adjEval();
  if (ev.st === 'prop' && !adjDismissed(ev.prop)) {
    if (adjd().mode === 'auto' && ev.prop.auto) { adjAutoRun(true); return; }
    adjRepaint(); toast(adjd().mode === 'off' ? 'Ada saran, tetapi mode Mati.' : 'Ada saran penyesuaian di bawah.'); return;
  }
  adjRepaint(); toast('Tidak ada perubahan yang disarankan sekarang.');
};
QACT.adjUndo = () => {
  const e = adjUndo();
  toast(e ? 'Dibatalkan: ' + adjFmtE(e) + '. Saran yang sama tidak diajukan lagi selama ' + ADJ_UNDO_DIS + ' hari.' : 'Tidak ada penyesuaian aktif.');
};
QACT.adjReset = () => {
  const ids = adjReset();
  if (ids.length) toast('Kembali ke rencana dasar (' + ids.length + ' penyesuaian dibatalkan).', { label: 'Urungkan', fn: () => { adjRestore(ids); toast('Penyesuaian dipulihkan.'); } });
};

/* jalan sekali tiap muat: Otomatis menerapkan saran yang arahnya aman; selain itu hanya memberi tahu. Tanpa AI, tanpa jaringan. */
let adjRan = false;
function adjAutoRun(force) {
  if (adjRan && !force) return null;
  adjRan = true;
  const A = adjd();
  if (A.mode === 'off') return null;
  const ev = adjEval();
  if (ev.st !== 'prop' || adjDismissed(ev.prop)) return null;
  if (A.mode === 'auto' && ev.prop.auto) {
    const e = adjApply(ev.prop, true);
    if (e) toast('Rencana disesuaikan mulai besok: ' + adjFmtE(e) + '. Alasannya ada di Peta.', { label: 'Urungkan', fn: () => adjUndoToast(e.id) });
    return e;
  }
  toast('Ada saran penyesuaian rencana.', { label: 'Lihat', fn: () => { showView('roadmap'); ptOpen('adj'); setTimeout(() => { const el = $('#rmAdj'); if (el) el.scrollIntoView(); }, 60); } });
  return null;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b13u: Object.freeze({ html: rmAdjHTML, autoRun: adjAutoRun, undoId: adjUndoId, restore: adjRestore, phNote: adjPhNote, fmtE: adjFmtE, sigOf: adjSigOf, undoDis: ADJ_UNDO_DIS }) }));


/* ===== MODUL: TREN, LAJU, PROYEKSI & MILESTONE (batch 13, langkah 3-4) ===== */
// Laju = kemiringan garis regresi linear pada berat/lingkar mingguan (bukan selisih dua titik, karena berat mingguan berisik).
const TR_MIN = 3;               // minimal pekan berisi data untuk laju dan proyeksi
const TR_PROJ_WEEKS = 8;        // jendela tetap untuk proyeksi (tidak mengikuti pilihan 4/8/12)
const effGoal = (ph, d) => adjEff(ph, d || today()).goal;   // titik tunggal target berat fase: rencana dasar + penyesuaian (langkah 5)
const dY = s => shortDate(s) + ' ' + pd(s).getFullYear();

/* regresi linear kuadrat terkecil. pts = [{x, y}] -> {slope, icpt, n, se (galat baku kemiringan, null bila n < 3), at(x)} */
function linFit(pts) {
  const n = pts.length;
  if (n < 2) return null;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxx = 0, sxy = 0;
  pts.forEach(p => { sxx += (p.x - mx) * (p.x - mx); sxy += (p.x - mx) * (p.y - my); });
  if (!(sxx > 0)) return null;
  const slope = sxy / sxx, icpt = my - slope * mx;
  let sse = 0;
  pts.forEach(p => { const e = p.y - (icpt + slope * p.x); sse += e * e; });
  return { slope, icpt, n, se: n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : null, at: x => icpt + slope * x };
}

/* titik mingguan (kunci pekan = Senin) untuk kolom k di jendela n pekan terakhir (termasuk pekan ini); from = pekan paling awal yang dipakai (opsional) */
function trPoints(k, n, from) {
  const t = thisWeek(), w0 = addDays(t, -7 * (n - 1)), out = [];
  Object.keys(wdb).sort().forEach(w => {
    if (w < w0 || w > t || (from && w < from)) return;
    const v = num(wdb[w][k]);
    if (v == null || !(v > 0)) return;
    if (k === 'bw' && !kgOk(v)) return;
    out.push({ w, x: diffDays(w0, w) / 7, y: v });
  });
  return out;
}
/* tren satu kolom: {ok:false, cnt} bila < TR_MIN pekan berisi data; selain itu laju per pekan dan nilai garis tren di titik terakhir */
function trendOf(k, n, from) {
  const pts = trPoints(k, n, from), out = { k, n, cnt: pts.length, ok: false };
  if (pts.length < TR_MIN) return out;
  const f = linFit(pts);
  if (!f) return out;
  const first = pts[0], last = pts[pts.length - 1];
  return Object.assign(out, { ok: true, slope: f.slope, se: f.se, fitLast: f.at(last.x), first, last, spanWk: last.x - first.x, pts });
}

/* penilaian laju berat terhadap fase aktif (+ kg/pekan = turun) */
function trVerdict(t, ph, need) {
  const kgWk = -t.slope, pct = kgWk / t.fitLast * 100, a = Math.abs;
  const rate = '±' + fmt(a(kgWk), 2) + ' kg/pekan (' + fmt(a(pct), 2) + '%)';
  let cmp = '';
  if (need && !need.none && kgWk > 0) {
    const q = kgWk / need.kgWk;
    cmp = ' Target Fase ' + need.ph + ' butuh ±' + fmt(need.kgWk, 2) + ' kg/pekan: lajumu ' + (q < 0.8 ? 'lebih pelan.' : q > 1.25 ? 'lebih cepat.' : 'sekitar sama.');
  }
  if (ph.tg.mode === 'max') {
    if (pct < -0.1) return { tone: 'bad', title: 'Berat cenderung naik', text: 'Garis tren naik ' + rate + '. Bila baru beberapa pekan, cek dulu isian berat dan catatan makan sebelum menyimpulkan.' };
    if (pct < 0.1) return { tone: 'info', title: 'Berat cenderung datar', text: 'Garis tren hampir tidak bergerak (' + rate + '). Naik-turun air dan isi usus bisa menutupi tren pendek, jadi 2 pekan terlalu pendek untuk menyebutnya plateau.' + cmp };
    if (pct > 1) return { tone: 'bad', title: 'Laju turun di atas 1% berat badan per pekan', text: 'Turun ' + rate + '. Yang umum disarankan 0,5–1% per pekan untuk menjaga otot.' + cmp };
    if (pct >= 0.5) return { tone: 'ok', title: 'Laju turun dalam rentang yang disarankan', text: 'Turun ' + rate + ', di dalam 0,5–1% per pekan.' + cmp };
    return { tone: 'info', title: 'Laju turun pelan (di bawah 0,5%)', text: 'Turun ' + rate + '.' + cmp };
  }
  if (ph.bwGoal == null) {
    if (a(pct) <= 0.25) return { tone: 'ok', title: 'Berat stabil', text: 'Perubahan garis tren ' + rate + ', sesuai tujuan Fase ' + ph.id + ': pertahankan berat.' };
    return { tone: 'info', title: 'Berat berubah ' + (pct > 0 ? 'turun' : 'naik'), text: 'Garis tren ' + (pct > 0 ? 'turun' : 'naik') + ' ' + rate + ', sedangkan tujuan Fase ' + ph.id + ' adalah mempertahankan berat.' };
  }
  if (pct < -0.1) return { tone: 'info', title: 'Berat cenderung naik', text: 'Garis tren naik ' + rate + '. Fase ' + ph.id + ' menargetkan turun perlahan ke ' + fmt(effGoal(ph), 0) + ' kg.' };
  return { tone: 'info', title: 'Berat ' + (pct < 0.1 ? 'cenderung datar' : 'turun'), text: 'Garis tren ' + rate + '.' + cmp };
}

/* kartu "Laju N pekan terakhir" di Mingguan */
function trCardHTML() {
  const n = trWeeks, b = trendOf('bw', n), w = trendOf('waist', n);
  const p = pos(today()), ph = (p && p.ph) || PHASES[0], b0 = bwStart(), need = kgOk(b0) ? phaseNeed(ph, b0) : null;
  let h = '<h3 class="rmh" style="margin-top:6px">Laju ' + n + ' pekan terakhir<span class="tag">perkiraan</span></h3>';
  if (!b.ok) h += '<p class="note">Laju berat belum dihitung: butuh minimal ' + TR_MIN + ' pekan berisi berat badan dalam ' + n + ' pekan terakhir (sekarang ' + b.cnt + ').</p>';
  else {
    h += kv('Berat', sgn(b.slope, 2) + ' kg/pekan <small>(' + sgn(b.slope / b.fitLast * 100, 2) + '%)</small>') +
      kv('Dasar hitungan', b.cnt + ' pekan berisi data');
    const v = trVerdict(b, ph, need);
    h += alertHTML(v.tone, v.title, v.text + (p && p.ph ? '' : ' (Acuan Fase 1: tanggal mulai belum diatur atau belum tiba.)'));
  }
  if (w.ok) h += kv('Lingkar perut', sgn(w.slope, 2) + ' cm/pekan <small>(' + w.cnt + ' pekan)</small>');
  else if (w.cnt > 0) h += '<p class="note">Lingkar perut: butuh minimal ' + TR_MIN + ' pekan berisi data (sekarang ' + w.cnt + ').</p>';
  if (n === 4) h += '<p class="note">Jendela 4 pekan mudah berisik; bandingkan dengan 8 atau 12 pekan sebelum menyimpulkan.</p>';
  return h + '<p class="note">Laju = kemiringan garis regresi linear pada nilai mingguan, bukan selisih dua titik. Berat badan naik-turun harian, jadi anggap ini perkiraan kasar.</p>';
}
QACT.trRange = el => {
  const v = +el.dataset.v;
  if (!TR_OPTS.includes(v)) return;
  trWeeks = v; trSegPaint();
  renderWTrend();
};
function trSegPaint() {
  $$('[data-q="trRange"]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === trWeeks)));
  const h = $('#wTrendT') || $('#wTrendH'); if (h) h.textContent = 'Tren ' + trWeeks + ' pekan';
  if (typeof wkTr === 'function') wkTr();   // v23w4: chip status kartu Tren
}

/* batas fase sebagai tanggal (mengikuti pos()/monthsBetween, jadi sama dengan penentuan fase aktif); null bila tanggal mulai kosong */
function phStart(ph) {
  if (!pdb.start) return null;
  if (ph.m[0] <= 1) return pdb.start;
  let d = addDays(pdb.start, Math.max(0, Math.floor((ph.m[0] - 1) * 30.4375) - 40));
  for (let i = 0; i < 90; i++, d = addDays(d, 1)) if (monthsBetween(pdb.start, d) + 1 >= ph.m[0]) return d;
  return null;
}
function phEnd(ph) {
  if (!pdb.start) return null;
  let d = addDays(pdb.start, Math.max(0, Math.floor(ph.m[1] * 30.4375) - 40));
  for (let i = 0; i < 90; i++, d = addDays(d, 1)) if (monthsBetween(pdb.start, d) + 1 > ph.m[1]) return addDays(d, -1);
  return null;
}

/* proyeksi tanggal tercapainya target berat fase aktif (jendela tetap 8 pekan; butuh >= 3 pekan berisi berat) */
function trProject(ph) {
  const goal = effGoal(ph);
  if (goal == null) return { st: 'hold' };
  const t = trendOf('bw', TR_PROJ_WEEKS);
  if (!t.ok) return { st: 'few', cnt: t.cnt };
  const now = t.fitLast, kgWk = -t.slope;
  if (now <= goal) return { st: 'done', now, goal, t };
  if (!(kgWk > 0.01)) return { st: 'flat', now, goal, t, kgWk };
  const ref = addDays(t.last.w, 3), wk = (now - goal) / kgWk, date = addDays(ref, Math.round(wk * 7));
  const out = { st: 'ok', now, goal, kgWk, wk, date, ref, t, early: null, late: null, lateOpen: false };
  // kisaran: laju +- ketidakpastian = galat baku kemiringan, tetapi minimal 15% laju (data yang sangat rapi tidak berarti masa depan pasti)
  const u = Math.max(t.se || 0, 0.15 * kgWk);
  out.u = u;
  out.early = addDays(ref, Math.round((now - goal) / (kgWk + u) * 7));
  if (kgWk - u > 0.01) out.late = addDays(ref, Math.round((now - goal) / (kgWk - u) * 7)); else out.lateOpen = true;
  const end = phEnd(ph);
  out.end = end;
  if (end) { out.vsEnd = diffDays(date, end); out.atEnd = now - kgWk * (diffDays(ref, end) / 7); }   // vsEnd > 0 = lebih cepat dari akhir fase
  return out;
}

/* bagian "Proyeksi & milestone" di Peta */
function rmProjHTML() {
  const p = pos(today()), ph = (p && p.ph) || PHASES[0], pr = trProject(ph), tdy = today();
  let h = '';
  if (!(p && p.ph)) h += '<p class="note">Tanggal mulai belum tiba atau belum diatur, jadi Fase 1 dipakai sebagai acuan.</p>';
  h += '<h3 class="rmh" style="margin-top:6px">Proyeksi target Fase ' + ph.id + '<span class="tag">perkiraan</span></h3>';
  if (pr.st === 'hold') h += '<p class="note">Fase ' + ph.id + ': pertahankan berat badan, jadi tidak ada target untuk diproyeksikan.</p>';
  else if (pr.st === 'few') h += '<p class="note">Proyeksi belum tampil: butuh minimal ' + TR_MIN + ' pekan berisi berat badan dalam ' + TR_PROJ_WEEKS + ' pekan terakhir (sekarang ' + pr.cnt + '). Isi berat di audit mingguan.</p>';
  else if (pr.st === 'done') h += kv('Berat menurut garis tren', fmt(pr.now, 1) + ' kg') + kv('Target Fase ' + ph.id, fmt(pr.goal, 1) + ' kg') + alertHTML('ok', 'Target Fase ' + ph.id + ' sudah tercapai menurut garis tren', 'Garis tren berada di ' + fmt(pr.now, 1) + ' kg, di bawah atau sama dengan target ' + fmt(pr.goal, 1) + ' kg.');
  else if (pr.st === 'flat') h += kv('Berat menurut garis tren', fmt(pr.now, 1) + ' kg') + kv('Target Fase ' + ph.id, fmt(pr.goal, 1) + ' kg') + alertHTML('info', 'Belum ada proyeksi: berat tidak turun pada garis tren', 'Dengan laju sekarang (' + sgn(-pr.kgWk, 2) + ' kg/pekan) target tidak tercapai. Proyeksi muncul lagi setelah garis tren turun.');
  else {
    h += kv('Berat menurut garis tren', fmt(pr.now, 1) + ' kg') + kv('Target Fase ' + ph.id, fmt(pr.goal, 1) + ' kg') + kv('Laju tren', '±' + fmt(pr.kgWk, 2) + ' kg/pekan') +
      kv('Perkiraan tercapai', 'sekitar ' + esc(dY(pr.date)));
    h += kv('Kisaran', esc(dY(pr.early)) + ' – ' + (pr.lateOpen ? 'tak tentu' : esc(dY(pr.late))));
    if (pr.end) {
      const dd = Math.abs(pr.vsEnd), endTxt = dY(pr.end);
      if (pr.vsEnd >= 0) h += alertHTML('ok', 'Sekitar ' + dd + ' hari lebih cepat dari akhir fase', 'Akhir Fase ' + ph.id + ' ' + endTxt + '. Bila laju ini bertahan, target ' + fmt(pr.goal, 0) + ' kg tercapai sebelum itu.');
      else h += alertHTML(dd > 28 ? 'bad' : 'info', 'Sekitar ' + dd + ' hari lebih lambat dari akhir fase', 'Akhir Fase ' + ph.id + ' ' + endTxt + '. Bila laju ini bertahan, berat di akhir fase ±' + fmt(pr.atEnd, 1) + ' kg (target ' + fmt(pr.goal, 0) + ' kg).');
    } else h += '<p class="note">Atur tanggal mulai di atas untuk membandingkan dengan akhir fase.</p>';
    h += '<p class="note">Garis regresi dari ' + pr.t.cnt + ' pekan berisi data; laju yang berubah akan menggeser tanggal ini. Kisaran memakai laju ± ketidakpastiannya (minimal 15%) dan tidak memperhitungkan perubahan laju di masa depan, jadi bukan jaminan.</p>';
  }
  h += '<h3 class="rmh">Milestone fase</h3>';
  PHASES.forEach(f => {
    const g = effGoal(f), a = phStart(f), b = phEnd(f);
    let when, st = '';
    if (a && b) {
      when = dY(a) + ' – ' + dY(b);
      if (tdy > b) st = 'selesai';
      else if (tdy >= a) st = 'berjalan, sisa ' + (diffDays(tdy, b) + 1) + ' hari';
      else st = 'belum mulai';
    } else when = 'Bulan ' + f.m[0] + '–' + f.m[1];
    h += '<div class="plan"><div><b>Fase ' + f.id + ': ' + esc(f.nama) + '</b><small>' + esc(when) + ' · ' + (g == null ? 'pertahankan berat' : 'target ' + fmt(g, 0) + ' kg') + (st ? ' · ' + esc(st) : '') + '</small></div></div>';
  });
  return h;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b13t: Object.freeze({ fit: linFit, trend: trendOf, verdict: trVerdict, card: trCardHTML, proj: trProject, projHtml: rmProjHTML, phStart, phEnd, min: TR_MIN, weeks: () => trWeeks }) }));


/* 3d-2-1: dua blok TNX di bawah dipindah dari 005 ke sini (pembungkus fcHeadPaint, fcBarPaint, fcPaint harus sesudah fungsi aslinya di 006; urutan muat relatif bagian lain tidak berubah) */
/* TNX-2-begin: judul #fchat tanpa bintang ganda, status header, orb hidup hanya saat AI menyusun (tampilan saja; alur obrolan tidak diubah) */
(function () {
  if (typeof fcBarPaint !== 'function' || typeof fcHeadPaint !== 'function') return;
  const baseB = fcBarPaint, baseH = fcHeadPaint;
  fcHeadPaint = function () {
    baseH();
    const h = $('#fcTitle'); if (!h) return;
    const t = h.textContent;
    if (t.charAt(0) === '\u2726') h.innerHTML = '<span class="tnx-star">\u2726 </span>' + esc(t.replace(/^\u2726\s*/, ''));
  };
  fcBarPaint = function () {
    baseB();
    const c = $('#fchat'); if (!c) return;
    c.classList.toggle('busy', !!fcBusy);
    const st = $('#fcSt'); if (st) st.textContent = fcBusy ? 'Menyusun jawaban…' : 'Siap membantu';
  };
})();
/* TNX-2-end */
/* TNX-2b-begin: tombol "Ke pesan terbaru" di #fchat (tampilan saja; posisi mengikuti tinggi kolom ketik dan pratinjau foto) */
(function () {
  const c = $('#fchat'), box = $('#fcMsgs'), jb = $('#fcJump'); if (!c || !box || !jb || typeof fcBarPaint !== 'function' || typeof fcPaint !== 'function') return;
  const upd = () => {
    if (c.hidden) { jb.classList.remove('on'); return; }
    const pv = $('#fcPrev'), bar = c.querySelector('.chbar'), chin = c.querySelector('.chin');
    const top = ((pv && !pv.hidden) ? pv : bar).getBoundingClientRect().top;
    jb.style.bottom = Math.round(chin.getBoundingClientRect().bottom - top + 12) + 'px';
    jb.classList.toggle('on', box.scrollHeight - box.scrollTop - box.clientHeight > 160);
  };
  const bb = fcBarPaint, bp = fcPaint;
  fcBarPaint = function () { bb(); requestAnimationFrame(upd); };
  fcPaint = function (a) { bp(a); requestAnimationFrame(upd); };
  box.addEventListener('scroll', upd, { passive: true });
  QACT.fcJump = () => { box.scrollTo({ top: box.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
})();
/* TNX-2b-end */
/* T3d-2-2-4: blok DL.b83m dipindah dari 003 (isinya memakai msum, mitem, mlist, fdWarns, fdRowHTML, mealListHTML milik bagian ini); isi baris tidak diubah */
setTimeout(() => { window.DL = Object.freeze(Object.assign({}, window.DL, { b83m: Object.freeze({ msum, mitem, mlist, warns: fdWarns, macro: nutMacroHTML, rowHtml: fdRowHTML, listHtml: mealListHTML, test: Object.freeze({ edb: () => edb, cur: () => cur, FC: () => FC, fdAdd, add: mAddItem, today: () => today(), show: v => showView(v) }) }) })); }, 0);
