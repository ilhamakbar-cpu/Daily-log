/* ===== HR-3a-end ===== */
/* ===== HR-3b-begin (17 Nov 2026): Dapper > Hari ini, kartu 3 (OOTD), BAGIAN b: TAMPILAN kartu "Pakaian hari ini" (chip pilihan cepat + catatan satu baris; Simpan, Ubah, Batal, Hapus dengan Urungkan). Memakai toko HR-3a. Belum ikut cadangan JSON dan sinkron (HR-3c). Membalik: hapus blok HR-3b, CSS .od-*, panggilan odCardHtml di hrHtml, dan pulihkan HR_SOON seperti HR-3a. ===== */
const ODV = { iso: '', edit: false, sel: [], note: '', msg: '' };   // draf tampilan (hanya di memori; bertahan saat pindah tab)
function odvReset(iso) { ODV.iso = iso; ODV.edit = false; ODV.sel = []; ODV.note = ''; ODV.msg = ''; }
function odDateLabel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso)); if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12); if (isNaN(d.getTime())) return '';
  return HR_HARI[d.getDay()] + ', ' + d.getDate() + ' ' + HR_BLN[d.getMonth()] + ' ' + d.getFullYear();
}
function odHm(u) { const d = new Date(u); if (!(u > 0) || isNaN(d.getTime())) return ''; const p = n => (n < 10 ? '0' : '') + n; return p(d.getHours()) + '.' + p(d.getMinutes()); }
function odToggle(sel, id) {   // -> { sel, over }; over = true bila sudah 12 butir dan butir baru ditolak
  const s = odPicks(sel), has = s.includes(id);
  if (has) return { sel: s.filter(x => x !== id), over: false };
  if (!OD_IDX.has(id)) return { sel: s, over: false };
  if (s.length >= OD_MAX_PICK) return { sel: s, over: true };
  return { sel: odPicks(s.concat([id])), over: false };
}
const OD_MSG = { kosong: 'Pilih minimal satu butir atau tulis catatan dulu.', tanggal: 'Tanggal perangkat tidak sah, catatan tidak disimpan.', depan: 'Tanggal perangkat tidak sah, catatan tidak disimpan.', lama: 'Penyimpanan penuh (120 tanggal) dan tanggal ini lebih tua dari yang tertua, catatan tidak disimpan.' };
function odCardHtml(c) {   // c = { ready, iso, rec ({p,n,u} atau null), edit, sel, note, msg }
  const head = b => '<div class="nw-hd"><h3>Pakaian hari ini</h3><span class="nw-soon">' + esc(b) + '</span></div>';
  const open = '<section class="nw-card hr-card od-card" id="hrOotd" aria-label="Catatan pakaian hari ini">';
  const fine = '<p class="nw-fine">Catatan ini tersimpan di perangkat ini dan ikut Ekspor/Impor JSON. Tanpa foto, tanpa AI.</p>';
  if (!c || !c.ready) return open + head('…') + '<p class="nw-p">Memuat catatan…</p></section>';
  const lbl = odDateLabel(c.iso), editing = !!c.edit || !c.rec;
  if (!editing) {
    const r = c.rec, tags = r.p.map(id => '<li>' + esc(odLabel(id)) + '</li>').join('');
    return open + head('Tercatat') + '<p class="nw-p">' + esc(lbl) + (r.u ? ' · diubah pukul ' + esc(odHm(r.u)) : '') + '</p>' +
      (tags ? '<ul class="od-tags" aria-label="Yang dipakai">' + tags + '</ul>' : '') + (r.n ? '<p class="od-note">' + esc(r.n) + '</p>' : '') +
      '<div class="od-row"><button type="button" class="btn primary" data-q="odEdit" data-fk="od-ubah">Ubah</button><button type="button" class="btn danger" data-q="odDel" data-fk="od-hapus">Hapus</button></div>' + fine + '</section>';
  }
  const sel = new Set(odPicks(c.sel));
  const grp = OD_GRP.map(g => '<div class="od-g" role="group" aria-label="' + esc(g[1]) + '"><div class="od-gl">' + esc(g[1]) + '</div><div class="chips">' +
    g[2].map(x => { const id = g[0] + '-' + x[0]; return '<button type="button" class="pill od-pill" data-q="odPick" data-id="' + esc(id) + '" data-fk="odp-' + esc(id) + '" aria-pressed="' + (sel.has(id) ? 'true' : 'false') + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>').join('');
  const note = typeof c.note === 'string' ? c.note : '';
  return open + head(c.rec ? 'Mengubah' : 'Belum dicatat') + '<p class="nw-p">' + esc(lbl) + '. Pilih yang dipakai hari ini, lalu tulis catatan bila perlu.</p>' + grp +
    '<label class="od-l" for="odNote">Catatan (opsional, satu baris)</label><input id="odNote" class="od-in" type="text" maxlength="' + OD_NOTE + '" autocomplete="off" enterkeyhint="done" data-fk="odnote" value="' + esc(note) + '"><div class="od-ct" id="odCt">' + Math.min(note.length, OD_NOTE) + '/' + OD_NOTE + '</div>' +
    (c.msg ? '<p class="od-msg" role="alert">' + esc(c.msg) + '</p>' : '') +
    '<div class="od-row"><button type="button" class="btn primary" data-q="odSave" data-fk="od-simpan">Simpan</button>' + (c.rec ? '<button type="button" class="btn ghost" data-q="odCancel" data-fk="od-batal">Batal</button>' : '') + '</div>' + fine + '</section>';
}
function odCtx() { const iso = today(); if (ODV.iso !== iso) odvReset(iso); return { ready: OD.ready, iso: iso, rec: odGet(OD.db, iso), edit: ODV.edit || ODV.sel.length > 0 || ODV.note !== '', sel: ODV.sel, note: ODV.note, msg: ODV.msg }; }
function odRefresh(fk) {   // ganti HANYA kartu OOTD; fk = data-fk yang diberi fokus sesudahnya (atau yang sedang fokus)
  if (curView !== 'dapper' || nwTab.dapper !== 'hari') return;
  const el = $('#hrOotd'); if (!el) return;
  const ae = document.activeElement, keep = ae && ae.dataset && el.contains(ae) ? ae.dataset.fk : null, t = document.createElement('div');
  t.innerHTML = odCardHtml(odCtx()); const n = t.firstElementChild; if (!n) return; el.replaceWith(n);
  const want = fk || keep; if (want) { const b = n.querySelector('[data-fk="' + want + '"]'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
{ const baseNwOd = nwRender; nwRender = function (key) { baseNwOd.apply(this, arguments); if (key === 'dapper' && nwTab.dapper === 'hari' && !OD.ready) odLoad().then(() => odRefresh(), () => odRefresh()); }; }   // hanya MEMBACA penyimpanan; kunci tidak ditulis sebelum Simpan
{ const baseOdWipe = odWipe; odWipe = function () { odvReset(''); return baseOdWipe.apply(this, arguments); }; }
QACT.odPick = b => {
  const id = b && b.dataset ? b.dataset.id : ''; if (!OD_IDX.has(id)) return; const iso = today(); if (ODV.iso !== iso) odvReset(iso);
  const r = odToggle(ODV.sel, id); if (r.over) { toast('Paling banyak ' + OD_MAX_PICK + ' butir.'); return; }
  ODV.sel = r.sel; ODV.msg = ''; b.setAttribute('aria-pressed', String(r.sel.includes(id)));
  const m = $('#hrOotd .od-msg'); if (m) m.remove();
};
QACT.odEdit = () => { const c = odCtx(); if (!c.rec) return; ODV.edit = true; ODV.sel = c.rec.p.slice(); ODV.note = c.rec.n; ODV.msg = ''; odRefresh('odp-' + (c.rec.p[0] || 'atas-kaos')); };
QACT.odCancel = () => { ODV.edit = false; ODV.sel = []; ODV.note = ''; ODV.msg = ''; odRefresh('od-ubah'); };
QACT.odSave = () => {
  const c = odCtx(); if (!c.ready) return;
  const r = odPut(OD.db, c.iso, ODV.sel, ODV.note, today(), Date.now());
  if (r !== 'ok') { ODV.msg = OD_MSG[r] || OD_MSG.kosong; odRefresh('odnote'); return; }
  odSave(); ODV.edit = false; ODV.sel = []; ODV.note = ''; ODV.msg = ''; toast('Catatan pakaian disimpan.'); odRefresh('od-ubah');
};
QACT.odDel = () => {
  const c = odCtx(); if (!c.rec) return; const prev = c.rec, iso = c.iso;
  if (!odRemove(OD.db, iso, Date.now())) return;
  odSave(); ODV.edit = false; ODV.sel = []; ODV.note = ''; ODV.msg = ''; odRefresh('odp-atas-kaos');
  toast('Catatan dihapus.', { label: 'Urungkan', fn: () => { if (odPut(OD.db, iso, prev.p, prev.n, today(), Date.now()) === 'ok') odSave(); odRefresh('od-ubah'); } });
};
document.addEventListener('input', ev => { const el = ev.target; if (!el || el.id !== 'odNote') return; ODV.note = el.value; const k = $('#odCt'); if (k) k.textContent = Math.min(el.value.length, OD_NOTE) + '/' + OD_NOTE; });
document.addEventListener('keydown', ev => { const el = ev.target; if (el && el.id === 'odNote' && ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); QACT.odSave(); } });
/* ===== HR-3b-end ===== */
/* ===== HR-3c-begin (17 Nov 2026): Dapper > Hari ini, kartu 3 (OOTD), BAGIAN c: catatan pakaian IKUT cadangan JSON (Ekspor/Impor) dan jalur SINKRON yang sama (sinkron memakai backupText + importData). Di `extra.ootd` = { days: { 'YYYY-MM-DD': { p, n, u } }, del: [[tanggal, u]], u }; TIDAK ditulis bila toko belum pernah disentuh (u = 0). Gabung per tanggal: u terbesar menang (catatan lama tidak menimpa yang baru); nisan hapus menang hanya bila u-nya LEBIH BESAR dari catatan (sama umur: catatan menang); impor BERKAS mengangkat nisan lokal untuk tanggal yang ada di berkas (aturan 107f), sinkron tidak. Hanya menambah/memperbarui/menghapus lewat nisan; maks 120 tanggal. "Hapus semua data" TIDAK merambat (seperti catatan harian). Membalik: hapus blok HR-3c dan pulihkan 6 baris (lihat patch_hr3c.py). ===== */
function odSnap() {   // salinan untuk cadangan; null bila belum pernah disentuh (u = 0). Urut tetap supaya dua perangkat yang sama menghasilkan teks yang sama
  const d = OD.db; if (!(d.u > 0)) return null;
  const days = {}; Object.keys(d.days).sort().forEach(k => { const r = d.days[k]; days[k] = { p: r.p.slice(), n: r.n, u: r.u }; });
  const o = { days: days, u: d.u }; if (d.del.length) o.del = d.del.map(x => [x[0], x[1]]);
  return o;
}
function odMerge(db, raw, sync) {   // MURNI: tidak mengubah db. raw = isi extra.ootd (dibersihkan di sini). -> { days, del, u, add, upd, rem, tomb, same }
  const c = odClean(raw), r = { add: 0, upd: 0, rem: 0, tomb: 0, same: 0 };
  const tm = new Map(db.del.filter(x => sync || !c.days[x[0]]).map(x => [x[0], x[1]]));   // impor berkas: nisan lokal diangkat untuk tanggal yang ada di berkas
  c.del.forEach(x => { if (!(tm.get(x[0]) >= x[1])) tm.set(x[0], x[1]); });
  const dead = (k, u) => tm.has(k) && tm.get(k) > u;
  const days = {};
  Object.keys(db.days).forEach(k => { if (!dead(k, db.days[k].u)) days[k] = db.days[k]; });
  Object.keys(c.days).forEach(k => {
    const x = c.days[k]; if (dead(k, x.u)) return;
    const l = days[k]; if (!l) days[k] = x; else if (x.u > l.u) days[k] = x; else r.same++;
  });
  const out = odTrim({ days: days, del: Array.from(tm, ([k, u]) => [k, u]).filter(x => !days[x[0]]), u: 0 });   // tanggal yang hidup tidak punya nisan
  Object.keys(out.days).forEach(k => { const l = db.days[k]; if (!l) r.add++; else if (out.days[k] !== l) r.upd++; });
  Object.keys(db.days).forEach(k => { if (!out.days[k]) r.rem++; });
  const key = a => JSON.stringify(a.slice().sort((p, q) => (p[0] < q[0] ? -1 : p[0] > q[0] ? 1 : 0)));
  if (key(out.del) !== key(db.del)) r.tomb = 1;
  r.days = out.days; r.del = out.del; r.u = Math.max(db.u, c.u); return r;
}
function exMergeOD(src, r, apply) {   // dipanggil exMerge; apply=false hanya menghitung
  r.exAdded = r.exAdded || 0; r.exSame = r.exSame || 0;
  if (!src || typeof src !== 'object' || !src.ootd) return;
  const m = odMerge(OD.db, src.ootd, exSyncMode), ch = m.add + m.upd + m.rem + m.tomb;
  r.odAdd = (r.odAdd || 0) + m.add; r.odUpd = (r.odUpd || 0) + m.upd; r.odRem = (r.odRem || 0) + m.rem;
  if (ch) r.exAdded += ch; else r.exSame++;
  if (apply && (ch || m.u > OD.db.u)) { OD.db.days = m.days; OD.db.del = m.del; OD.db.u = m.u; odSave(); if (!ODV.edit && !$('#odNote')) odRefresh(); }   // form terbuka (catatan baru atau Ubah): kartu tidak disusun ulang, ketikan aman; Simpan nanti menang karena u-nya lebih baru
}
window.DL = Object.freeze(Object.assign({}, window.DL, { hr3c: Object.freeze({ snap: odSnap, merge: odMerge, backup: () => backupText(), imp: t => importData(t), ready: () => exReady() }) }));
/* ===== HR-3c-end ===== */
/* ===== HR-3d-begin (17 Nov 2026): Dapper > Hari ini, kartu 3 (OOTD), BAGIAN d: RIWAYAT SINGKAT catatan pakaian hari-hari sebelumnya di dalam kartu (5 terbaru, tombol "Lihat N lagi" sampai 30). Hanya MEMBACA toko HR-3a; tidak menulis apa pun. Dipasang sebagai pembungkus odCtx, odCardHtml, odvReset (kode HR-3b tidak diubah). Membalik: hapus blok HR-3d dan CSS .od-hist/.od-h-*. ===== */
const OD_HIST_MIN = 5, OD_HIST_MAX = 30;
ODV.histAll = false;
function odDayDiff(a, b) {   // selisih hari kalender (b - a) untuk dua tanggal 'YYYY-MM-DD' sah; selain itu NaN
  if (!odIso(a) || !odIso(b)) return NaN;
  const p = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return Date.UTC(+m[1], +m[2] - 1, +m[3]); };
  return Math.round((p(b) - p(a)) / 864e5);
}
function odAgo(n) { if (!(n >= 1) || !Number.isFinite(n)) return ''; n = Math.floor(n); return n === 1 ? 'Kemarin' : n <= 13 ? n + ' hari lalu' : Math.floor(n / 7) + ' pekan lalu'; }
function odDateShort(iso, todayIso) {   // 'Senin, 16 Nov' (tahun ditambah bila beda dengan tahun hari ini)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso)); if (!m || !odIso(iso)) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12), t = /^(\d{4})/.exec(String(todayIso));
  return HR_HARI[d.getDay()] + ', ' + d.getDate() + ' ' + HR_BLN[d.getMonth()] + (t && +t[1] !== +m[1] ? ' ' + m[1] : '');
}
function odHistory(db, todayIso, all) {   // MURNI -> { rows: [{ iso, lbl, ago, p, n, u }], total }; hanya tanggal SEBELUM hari ini (hari ini tampil di atas), terbaru dulu
  const o = { rows: [], total: 0 }; if (!db || !db.days || !odIso(todayIso)) return o;
  const ks = Object.keys(db.days).filter(k => odIso(k) && k < todayIso).sort().reverse(); o.total = ks.length;
  ks.slice(0, all ? OD_HIST_MAX : OD_HIST_MIN).forEach(k => { const r = db.days[k]; o.rows.push({ iso: k, lbl: odDateShort(k, todayIso), ago: odDayDiff(k, todayIso), p: r.p.slice(), n: r.n, u: r.u }); });
  return o;
}
function odHistHtml(h, all) {
  if (!h || !Array.isArray(h.rows) || !h.rows.length) return '';
  const li = h.rows.map(r => '<li class="od-h-i"><div class="od-h-d"><span class="od-h-ago">' + esc(odAgo(r.ago)) + '</span><span class="od-h-dt">' + esc(r.lbl) + '</span></div>' +
    (r.p.length ? '<div class="od-h-t">' + esc(r.p.map(odLabel).filter(Boolean).join(' · ')) + '</div>' : '') + (r.n ? '<div class="od-h-n">' + esc(r.n) + '</div>' : '') + '</li>').join('');
  const cap = Math.min(h.total, OD_HIST_MAX);
  const btn = h.total > OD_HIST_MIN ? '<button type="button" class="btn ghost od-h-b" data-q="odHist" data-fk="od-riwayat" aria-expanded="' + (all ? 'true' : 'false') + '">' + (all ? 'Ringkas' : 'Lihat ' + (cap - OD_HIST_MIN) + ' hari lagi') + '</button>' : '';
  const cut = all && h.total > OD_HIST_MAX ? '<p class="nw-fine">Menampilkan ' + OD_HIST_MAX + ' catatan terbaru dari ' + h.total + '.</p>' : '';
  return '<div class="od-hist" role="region" aria-label="Riwayat pakaian"><h4 class="od-h-h">Riwayat singkat</h4><ul class="od-h-l">' + li + '</ul>' + btn + cut + '</div>';
}
{ const baseCtx = odCtx; odCtx = function () { const c = baseCtx.apply(this, arguments); c.histAll = !!ODV.histAll; c.hist = odHistory(OD.db, c.iso, c.histAll); return c; }; }
{ const baseCard = odCardHtml; odCardHtml = function (c) {
  const h = baseCard.apply(this, arguments), x = c && c.ready ? odHistHtml(c.hist, !!c.histAll) : ''; if (!x) return h;
  const i = h.lastIndexOf('<p class="nw-fine">'); return i < 0 ? h : h.slice(0, i) + x + h.slice(i);   // riwayat tepat di atas catatan kaki kartu
}; }
{ const baseReset = odvReset; odvReset = function () { baseReset.apply(this, arguments); ODV.histAll = false; }; }
QACT.odHist = () => { ODV.histAll = !ODV.histAll; odRefresh('od-riwayat'); };
window.DL = Object.freeze(Object.assign({}, window.DL, { hr3d: Object.freeze({ history: odHistory, apply: t => syApply(t) }) }));
/* ===== HR-3d-end ===== */
/* ===== HR-3e-begin (17 Nov 2026): Dapper > Hari ini, kartu 3 (OOTD), BAGIAN e: tombol "Pakai lagi" di tiap baris riwayat. Menyalin butir dan catatan hari itu ke FORM hari ini sebagai draf (BELUM disimpan sampai Simpan ditekan); toast "Urungkan" memulihkan draf sebelumnya. Tidak menulis toko. Kode HR-3a..3d tidak diubah; dipasang sebagai pembungkus odHistHtml. Membalik: hapus blok HR-3e dan CSS .od-h-use. ===== */
function odReuseDraft(db, iso, todayIso) {   // MURNI -> { sel, note } atau null; hanya tanggal sah SEBELUM hari ini yang punya catatan berisi
  if (!db || !db.days || !odIso(iso) || !odIso(todayIso) || !(iso < todayIso)) return null;
  const r = db.days[iso]; if (!r) return null;
  const sel = odPicks(r.p), note = typeof r.n === 'string' ? r.n.slice(0, OD_NOTE) : '';
  return sel.length || note ? { sel: sel, note: note } : null;
}
{ const baseHist = odHistHtml; odHistHtml = function (h, all) {
  const x = baseHist.apply(this, arguments); if (!x || !h || !Array.isArray(h.rows)) return x;
  const parts = x.split('</li>'); if (parts.length !== h.rows.length + 1) return x;   // bentuk tak dikenal: jangan disentuh
  return parts.map((s, i) => { const r = h.rows[i]; if (!r || !(odPicks(r.p).length || r.n)) return s;
    return s + '<button type="button" class="btn ghost od-h-use" data-q="odReuse" data-iso="' + esc(r.iso) + '" data-fk="odh-' + esc(r.iso) + '" aria-label="Pakai lagi catatan ' + esc(r.lbl) + '">Pakai lagi</button>'; }).join('</li>');
}; }
QACT.odReuse = b => {
  const iso = b && b.dataset ? b.dataset.iso : '', t = today(), d = odReuseDraft(OD.db, iso, t); if (!d) return;
  if (ODV.iso !== t) odvReset(t);
  const prev = { edit: ODV.edit, sel: ODV.sel.slice(), note: ODV.note };
  ODV.edit = true; ODV.sel = d.sel.slice(); ODV.note = d.note; ODV.msg = '';
  odRefresh('odnote'); const el = $('#hrOotd'); if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'start' }); } catch (e) { /* abaikan */ } }
  toast('Dipakai dari ' + odDateShort(iso, t) + '. Belum tersimpan.', { label: 'Urungkan', fn: () => { ODV.edit = prev.edit; ODV.sel = prev.sel; ODV.note = prev.note; ODV.msg = ''; odRefresh('odnote'); } });
};
window.DL = Object.freeze(Object.assign({}, window.DL, { hr3e: Object.freeze({ draft: odReuseDraft }) }));
/* ===== HR-3e-end ===== */
/* ===== HR-4a-begin (17 Nov 2026): Dapper > Hari ini, kartu 4 "Acara hari ini" (HR-4a): pilih SATU acara (Kerja, Santai, Ibadah, Acara resmi, Olahraga) untuk hari ini; ketuk lagi = hapus. Disimpan di perangkat dengan kunci kecil `dailylog:acara:v1` = { v: 1, d: tanggal, e: acara } dan HANYA berlaku pada tanggal itu (besok kembali kosong), karena itu tidak ikut cadangan JSON. Belum ada saran outfit (HR-4b memakai pilihan ini lewat DL.hr4a.get). Dipasang sebagai pembungkus hrHtml dan odWipe. Membalik: hapus blok HR-4a, CSS .ha-*, dan pulihkan HR_SOON. ===== */
const HA_KEY = 'dailylog:acara:v1';
const HA_LIST = [['kerja', 'Kerja'], ['santai', 'Santai'], ['ibadah', 'Ibadah'], ['resmi', 'Acara resmi'], ['olahraga', 'Olahraga']];
const HAV = { iso: '', ev: '', msg: '' };
const haLabel = id => { const x = HA_LIST.find(y => y[0] === id); return x ? x[1] : ''; };
function haClean(raw, todayIso) {   // MURNI -> id acara sah untuk HARI INI, selain itu ''
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== 1) return '';
  if (typeof raw.d !== 'string' || raw.d !== todayIso || !odIso(raw.d)) return '';
  return typeof raw.e === 'string' && HA_LIST.some(y => y[0] === raw.e) ? raw.e : '';
}
function haRead(todayIso) { try { const t = localStorage.getItem(HA_KEY); return t ? haClean(JSON.parse(t), todayIso) : ''; } catch (e) { return ''; } }
function haWrite(todayIso, id) {   // -> true bila tersimpan (atau terhapus)
  try { if (!id) localStorage.removeItem(HA_KEY); else localStorage.setItem(HA_KEY, JSON.stringify({ v: 1, d: todayIso, e: id })); return true; } catch (e) { return false; }
}
function haCtx() { const iso = today(); if (HAV.iso !== iso) { HAV.iso = iso; HAV.ev = haRead(iso); HAV.msg = ''; } return { iso: iso, ev: HAV.ev, msg: HAV.msg }; }
function haHtml(c) {
  const chips = HA_LIST.map(x => '<button type="button" class="pill od-pill ha-pill" data-q="haPick" data-id="' + esc(x[0]) + '" data-fk="ha-' + esc(x[0]) + '" aria-pressed="' + (c && c.ev === x[0] ? 'true' : 'false') + '">' + esc(x[1]) + '</button>').join('');
  return '<section class="nw-card hr-card ha-card" id="hrAcara" aria-label="Acara hari ini"><div class="nw-hd"><h3>Acara hari ini</h3><span class="nw-soon">' + (c && c.ev ? esc(haLabel(c.ev)) : 'Belum dipilih') + '</span></div>' +
    '<p class="nw-p">Pilih satu acara untuk hari ini. Ketuk lagi untuk membatalkan.</p><div class="chips" role="group" aria-label="Pilih acara">' + chips + '</div>' +
    (c && c.msg ? '<p class="od-msg" role="alert">' + esc(c.msg) + '</p>' : '') +
    '<p class="nw-fine">Hanya berlaku hari ini dan tersimpan di perangkat ini saja (tidak ikut Ekspor/Impor JSON). Saran outfit menurut acara dan cuaca menyusul di HR-4b.</p></section>';
}
{ const baseHr = hrHtml; hrHtml = function () {
  const h = baseHr.apply(this, arguments), x = haHtml(haCtx()), i = h.indexOf('<section class="nw-card" id="hrSoon"');
  return i < 0 ? h + x : h.slice(0, i) + x + h.slice(i);   // tepat sebelum kartu Menyusul
}; }
function haRefresh(fk) {
  if (curView !== 'dapper' || nwTab.dapper !== 'hari') return; const el = $('#hrAcara'); if (!el) return;
  const t = document.createElement('div'); t.innerHTML = haHtml(haCtx()); const n = t.firstElementChild; if (!n) return; el.replaceWith(n);
  if (fk) { const b = n.querySelector('[data-fk="' + fk + '"]'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
QACT.haPick = b => {
  const id = b && b.dataset ? b.dataset.id : ''; if (!HA_LIST.some(y => y[0] === id)) return;
  const c = haCtx(), next = c.ev === id ? '' : id; HAV.ev = next; HAV.msg = haWrite(c.iso, next) ? '' : 'Pilihan tidak bisa disimpan di perangkat ini, hanya berlaku selama aplikasi terbuka.';
  haRefresh('ha-' + id);
};
{ const baseWipe = odWipe; odWipe = function () { HAV.iso = ''; HAV.ev = ''; HAV.msg = ''; haWrite('', ''); return baseWipe.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { hr4a: Object.freeze({ get: () => haCtx().ev, clean: haClean, list: () => HA_LIST.map(x => x.slice()) }) }));
/* ===== HR-4a-end ===== */
/* ===== HR-4b-begin (17 Nov 2026): Dapper > Hari ini, kartu 5 "Saran outfit" (HR-4b): saran butir pakaian (atasan, bawahan, alas kaki, tambahan) dari ACARA terpilih (HR-4a) + cuaca hari ini (HR-2: hrWxSaran). Aturan lokal tanpa AI, tanpa data baru, TIDAK menulis apa pun; memakai butir yang sama dengan catatan pakaian (OD_GRP). Ambang dan pilihan butir ditetapkan penyusun. Tanpa data cuaca: saran hanya menurut acara. Tombol "Pakai saran ini" = HR-4c (osOutfit().utama sudah disiapkan). Membalik: hapus blok HR-4b, CSS .os-*, dan pulihkan HR_SOON. ===== */
const OS_BASE = {
  kerja: { atas: ['kemeja', 'polo'], bawah: ['panjang'], kaki: ['sepatu'], lain: ['jam', 'tas'] },
  santai: { atas: ['kaos', 'polo'], bawah: ['jeans', 'pendek'], kaki: ['sepatu', 'sandal'], lain: ['kacamata'] },
  ibadah: { atas: ['koko', 'batik', 'kemeja'], bawah: ['panjang', 'sarung'], kaki: ['sandal', 'sepatu'], lain: ['peci'] },
  resmi: { atas: ['batik', 'kemeja'], bawah: ['panjang'], kaki: ['sepatu'], lain: ['jam'] },
  olahraga: { atas: ['kaos'], bawah: ['olahraga', 'pendek'], kaki: ['sepatu'], lain: ['jam'] }
};
const OS_TIP = {
  kerja: 'Pilih potongan rapi dan bahan yang menyerap keringat bila perjalanan ke tempat kerja lama.',
  santai: 'Utamakan nyaman; pilih bahan yang cepat kering bila banyak berjalan.',
  ibadah: 'Pilih pakaian yang sopan dan bersih, serta alas kaki yang mudah dilepas.',
  resmi: 'Pilih pakaian yang rapi dan tersetrika; siapkan cadangan bila hujan atau panas.',
  olahraga: 'Pilih bahan yang menyerap keringat dan ganti pakaian yang basah setelah selesai.'
};
const OS_GL = { atas: 'Atasan', bawah: 'Bawahan', kaki: 'Alas kaki', lain: 'Tambahan' };
const osUniq = a => a.filter((x, i) => a.indexOf(x) === i);
function osOutfit(ev, s) {   // MURNI: ev = id acara, s = hasil hrWxSaran (atau null) -> { ev, band, groups: [{ g, label, pick, alt }], utama, notes } atau null bila acara tidak dikenal
  const B = typeof ev === 'string' && Object.prototype.hasOwnProperty.call(OS_BASE, ev) ? OS_BASE[ev] : null; if (!B) return null;
  const band = s && s.band ? s.band : '', ex = new Set(s && Array.isArray(s.tambah) ? s.tambah.map(x => x.id) : []);
  const hot = band === 'panas' || band === 'panas2', cold = band === 'dingin' || band === 'dingin2', hujan = ex.has('hujan') || ex.has('badai'), formal = ev === 'kerja' || ev === 'resmi' || ev === 'ibadah';
  let lp = [], la = [];   // lapisan atasan: dipakai / opsional
  if (band === 'sejuk') { if (formal) la = ['jaket']; else { lp = ['hoodie']; la = ['jaket']; } }
  else if (band === 'dingin') { lp = ['jaket']; la = formal ? [] : ['hoodie']; }
  else if (band === 'dingin2') { lp = formal ? ['jaket'] : ['hoodie', 'jaket']; }
  if (ex.has('angin') && !lp.includes('jaket')) { lp.push('jaket'); la = la.filter(x => x !== 'jaket'); }
  if (hujan && !lp.includes('jaket') && !la.includes('jaket')) la.push('jaket');
  const atas = { pick: [B.atas[0]].concat(lp), alt: B.atas.slice(1).concat(la) };
  let bw = B.bawah.slice();
  if (ev === 'santai') bw = hot ? ['pendek', 'jeans'] : cold ? ['jeans'] : ['jeans', 'pendek'];
  if (ev === 'olahraga') bw = cold ? ['olahraga'] : hot ? ['pendek', 'olahraga'] : ['olahraga', 'pendek'];
  let kk = B.kaki.slice();
  if (ev === 'santai' && hot && !hujan) kk = ['sandal', 'sepatu'];
  if (hujan || band === 'dingin2') kk = kk.filter(x => x !== 'sandal' && x !== 'sandalg');
  if (!kk.length) kk = ['sepatu'];
  const add = []; if (ex.has('matahari')) { if (ev !== 'resmi' && ev !== 'ibadah') add.push('topi'); add.push('kacamata'); }
  const raw = [['atas', atas.pick, atas.alt], ['bawah', [bw[0]], bw.slice(1)], ['kaki', [kk[0]], kk.slice(1)], ['lain', osUniq(B.lain.concat(add)), []]];
  const groups = raw.map(r => { const pick = osUniq(r[1]).filter(id => OD_IDX.has(r[0] + '-' + id)).map(id => r[0] + '-' + id); const alt = osUniq(r[2]).filter(id => !r[1].includes(id) && OD_IDX.has(r[0] + '-' + id)).map(id => r[0] + '-' + id); return { g: r[0], label: OS_GL[r[0]], pick: pick, alt: alt }; }).filter(g => g.pick.length || g.alt.length);
  const notes = [OS_TIP[ev]];
  if (s && s.label) notes.push('Cuaca hari ini ' + String(s.label).toLowerCase() + (hrFin(s.rasa) ? ' (terasa ' + Math.round(s.rasa) + ' °C)' : '') + '; saran sudah disesuaikan.');
  else notes.push('Data cuaca belum tersedia, saran hanya menurut acara.');
  if (hujan) notes.push('Alas kaki dipilih yang tahan basah.');
  return { ev: ev, band: band, groups: groups, utama: odPicks([].concat.apply([], groups.map(g => g.pick))), notes: notes };
}
function osHtml(ev, s) {
  const open = '<section class="nw-card hr-card os-card" id="hrSaran" aria-label="Saran outfit">', head = b => '<div class="nw-hd"><h3>Saran outfit</h3><span class="nw-soon">' + esc(b) + '</span></div>';
  const fine = '<p class="nw-fine">Saran penyusun berdasarkan aturan lokal (acara, suhu terasa, hujan, angin, matahari), bukan AI dan bukan hasil penelitian; sesuaikan dengan selera dan kondisi Anda. Belum menyimpan apa pun; tombol "Pakai saran ini" menyusul di HR-4c.</p>';
  const o = osOutfit(ev, s); if (!o) return open + head('Pilih acara') + '<p class="nw-p">Pilih acara hari ini di kartu di atas, lalu saran outfit muncul di sini.</p>' + fine + '</section>';
  const lb = id => esc(odLabel(id));
  const gs = o.groups.map(g => '<div class="od-g os-g"><div class="od-gl">' + esc(g.label) + '</div><ul class="od-tags" aria-label="Saran ' + esc(g.label) + '">' + g.pick.map(id => '<li data-id="' + esc(id) + '">' + lb(id) + '</li>').join('') + '</ul>' +
    (g.alt.length ? '<p class="os-alt">Alternatif: ' + g.alt.map(lb).join(', ') + '</p>' : '') + '</div>').join('');
  return open + head(haLabel(ev) + (s && s.label ? ' · ' + s.label : '')) + gs + o.notes.map(n => '<p class="nw-p os-note">' + esc(n) + '</p>').join('') + fine + '</section>';
}
function osWx() { try { const c = hrWxCtx(), a = c && c.v ? hrWxFrom(c.v, wxInfo) : null; return a ? hrWxSaran(a) : null; } catch (e) { return null; } }
function osRefresh() {
  if (curView !== 'dapper' || nwTab.dapper !== 'hari') return; const el = $('#hrSaran'); if (!el) return;
  const t = document.createElement('div'); t.innerHTML = osHtml(haCtx().ev, osWx()); const n = t.firstElementChild; if (n) el.replaceWith(n);
}
{ const baseHr4 = hrHtml; hrHtml = function () {
  const h = baseHr4.apply(this, arguments), x = osHtml(haCtx().ev, osWx()), i = h.indexOf('<section class="nw-card" id="hrSoon"');
  return i < 0 ? h + x : h.slice(0, i) + x + h.slice(i);   // tepat sebelum Menyusul, sesudah Acara
}; }
{ const baseHa = haRefresh; haRefresh = function () { const r = baseHa.apply(this, arguments); osRefresh(); return r; }; }   // acara diganti -> saran ikut
{ const baseWx = hrWxRefresh; hrWxRefresh = function () { const r = baseWx.apply(this, arguments); osRefresh(); return r; }; }   // cuaca selesai dimuat -> saran ikut
window.DL = Object.freeze(Object.assign({}, window.DL, { hr4b: Object.freeze({ outfit: osOutfit, html: osHtml }) }));
/* ===== HR-4b-end ===== */
/* ===== HR-4c-begin (17 Nov 2026): Dapper > Hari ini, kartu 5 "Saran outfit", BAGIAN c: tombol "Pakai saran ini" yang mengisi FORM catatan pakaian dengan butir utama saran (osOutfit().utama) lewat jalur draf yang sama dengan "Pakai lagi" (HR-3e): BELUM disimpan sampai Simpan ditekan, ada Urungkan. Catatan teks yang sedang ada TIDAK diubah; hanya pilihan butir yang diganti. Tidak menulis toko. Tahap c-a = logika murni (osCur, osDraft); tampilan menyusul di c-b. Membalik: hapus blok HR-4c. ===== */
function osCur(c) {   // MURNI: konteks odCtx() -> { sel, note } yang sedang berlaku untuk hari ini (draf bila sedang mengisi/mengubah, selain itu catatan tersimpan)
  if (!c || typeof c !== 'object') return { sel: [], note: '' };
  const draft = !!c.edit || !c.rec, src = draft ? { p: c.sel, n: c.note } : c.rec;
  return { sel: odPicks(src.p), note: typeof src.n === 'string' ? src.n.slice(0, OD_NOTE) : '' };
}
function osDraft(ev, s, cur) {   // MURNI: -> { sel, note, same } atau null (acara tak dikenal / saran kosong); same = true bila pilihan butir sekarang sudah persis sama dengan saran
  const o = osOutfit(ev, s); if (!o) return null;
  const sel = odPicks(o.utama); if (!sel.length) return null;
  const c = cur && typeof cur === 'object' ? cur : {}, cs = odPicks(c.sel);
  return { sel: sel, note: typeof c.note === 'string' ? c.note.slice(0, OD_NOTE) : '', same: cs.length === sel.length && cs.every((x, i) => x === sel[i]) };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { hr4c: Object.freeze({ cur: osCur, draft: osDraft }) }));
/* ===== HR-4c-end ===== */
/* ===== HR-4cb-begin (17 Nov 2026): Dapper > Hari ini, kartu 5 "Saran outfit", BAGIAN c tahap b: TAMPILAN tombol "Pakai saran ini" (QACT.osUse). Mengisi FORM catatan pakaian dengan butir utama saran lewat jalur draf yang sama dengan "Pakai lagi" (HR-3e): BELUM tersimpan sampai Simpan ditekan, toast "Urungkan" memulihkan draf sebelumnya. Catatan teks yang sedang ada TIDAK diubah. Pilihan sudah sama dengan saran = hanya toast. Kartu "Menyusul" dikosongkan (HR_SOON). Kalimat usang "menyusul di HR-4b" di kartu Acara diganti (pembungkus haHtml). Tidak menulis toko. Kode HR-4b dan HR-4c-a tidak diubah; dipasang sebagai pembungkus osHtml. Membalik: hapus blok HR-4cb, CSS .os-use, dan pulihkan isi HR_SOON. ===== */
const OS_FINE_OLD = ' Belum menyimpan apa pun; tombol "Pakai saran ini" menyusul di HR-4c.', OS_FINE_NEW = ' Tombol "Pakai saran ini" hanya mengisi catatan pakaian (catatan teks tidak diubah); belum tersimpan sampai Anda menekan Simpan.';
{ const baseOs = osHtml; osHtml = function (ev, s) {
  const x = baseOs.apply(this, arguments); if (typeof x !== 'string' || !osOutfit(ev, s)) return x;   // acara belum dipilih: tanpa tombol
  const i = x.lastIndexOf('<p class="nw-fine">'); if (i < 0) return x;
  const btn = '<button type="button" class="btn os-use" data-q="osUse" data-fk="os-use">Pakai saran ini</button>';
  return x.slice(0, i) + btn + x.slice(i).replace(OS_FINE_OLD, OS_FINE_NEW);
}; }
const HA_FINE_OLD = ' Saran outfit menurut acara dan cuaca menyusul di HR-4b.', HA_FINE_NEW = ' Saran outfit menurut acara dan cuaca ada di kartu Saran outfit di bawah.';   // kalimat usang dari HR-4a (HR-4b sudah selesai)
{ const baseHa4 = haHtml; haHtml = function () { const x = baseHa4.apply(this, arguments); return typeof x === 'string' ? x.replace(HA_FINE_OLD, HA_FINE_NEW) : x; }; }
HR_SOON.length = 0;   // semua butir tab Hari ini selesai: kartu Menyusul hilang (hrSoonHtml mengembalikan '' bila kosong)
QACT.osUse = () => {
  const c = odCtx(); if (!c.ready) { toast('Catatan pakaian belum siap. Coba lagi sebentar.'); return; }
  const d = osDraft(haCtx().ev, osWx(), osCur(c)); if (!d) { toast('Pilih acara dulu untuk mendapat saran.'); return; }
  if (d.same) { toast('Pilihan butir di catatan pakaian sudah sama dengan saran.'); return; }
  const prev = { edit: ODV.edit, sel: ODV.sel.slice(), note: ODV.note };   // draf sebelumnya, untuk Urungkan
  ODV.edit = true; ODV.sel = d.sel.slice(); ODV.note = d.note; ODV.msg = '';
  odRefresh('odnote'); const el = $('#hrOotd'); if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'start' }); } catch (e) { /* abaikan */ } }
  toast('Saran dipakai. Belum tersimpan.', { label: 'Urungkan', fn: () => { ODV.edit = prev.edit; ODV.sel = prev.sel; ODV.note = prev.note; ODV.msg = ''; odRefresh('odnote'); } });
};
window.DL = Object.freeze(Object.assign({}, window.DL, { hr4cb: Object.freeze({ html: osHtml }) }));
/* ===== HR-4cb-end ===== */
/* ===== STK-1a-begin (17 Nov 2026): Dapper > Kamera, bagian 1a: LOGIKA MURNI pengambilan foto (BELUM ada tampilan, tidak menyentuh DOM, tidak membuka kamera, tidak menulis toko, tanpa AI, tanpa jaringan, tidak ikut cadangan JSON). Isi: daftar sudut pengambilan + panduan, penganalisis piksel (kecerahan, kontra-cahaya, silau, cahaya berwarna), pemeriksa cahaya, pemeriksa tegak (sudut HP), hitung mundur timer, ukuran foto hasil, verdict "siap difoto". Semua ambang adalah PATOKAN PENYUSUN (bukan standar). Membalik: hapus blok STK-1a. ===== */
const STK_MODES = [
  { id: 'depan', t: 'Badan depan', s: 'Untuk bentuk badan dan potongan yang cocok', cam: 'environment', tm: 10, tegak: true, wajah: false,
    tips: ['Berdiri tegak 2 sampai 3 meter dari HP; seluruh badan dari kepala sampai kaki masuk bingkai.', 'Sandarkan HP tegak setinggi dada atau pinggang pada benda yang stabil.', 'Pakai pakaian yang pas badan, tangan rileks di samping.', 'Cahaya dari depan atau samping, latar polos.'] },
  { id: 'samping', t: 'Badan samping', s: 'Pasangan foto depan, untuk proporsi', cam: 'environment', tm: 10, tegak: true, wajah: false,
    tips: ['Hadap ke samping, tangan rileks di sisi badan, pandangan lurus ke depan.', 'Jarak dan tinggi HP sama seperti foto depan.', 'Pakai pakaian pas badan yang sama.'] },
  { id: 'wajah', t: 'Wajah dan warna', s: 'Untuk undertone dan palet warna', cam: 'user', tm: 3, tegak: false, wajah: true,
    tips: ['Cahaya jendela siang hari, wajah menghadap cahaya; hindari lampu kuning atau lampu neon.', 'Tanpa riasan dan tanpa filter; rambut disisihkan dari wajah.', 'Latar putih atau abu-abu netral, pakaian polos berwarna netral.', 'Kamera sejajar mata.'] },
  { id: 'outfit', t: 'Outfit', s: 'Untuk menilai pakaian yang dikenakan', cam: 'environment', tm: 10, tegak: true, wajah: false,
    tips: ['Berdiri tegak; seluruh pakaian sampai sepatu masuk bingkai.', 'Cahaya cukup dan merata; hindari jendela di belakang Anda.', 'Rapikan kerah, lipatan, dan ikat pinggang sebelum difoto.'] }
];
const STK_TIMES = [0, 3, 5, 10];   // pilihan timer (detik); 0 = langsung
const STK_MAXSIDE = 1280;          // sisi terpanjang foto hasil (piksel); sama dengan foto progres di Self Care
function stkGuide(id) { return typeof id === 'string' ? STK_MODES.find(m => m.id === id) || null : null; }
function stkTimerOk(n) { return STK_TIMES.includes(n); }
function stkAnalyze(d, w, h) {   // MURNI: d = data piksel RGBA (Uint8ClampedArray atau larik), w x h -> { avg, back, hi, lo, r, g, b } atau null bila data tidak cukup
  if (!d || !Number.isInteger(w) || !Number.isInteger(h) || w < 2 || h < 2 || d.length < w * h * 4) return null;
  const x0 = Math.floor(w / 4), x1 = Math.ceil(w * 3 / 4), y0 = Math.floor(h / 4), y1 = Math.ceil(h * 3 / 4);   // tengah = separuh lebar dan separuh tinggi
  let a = 0, ce = 0, nc = 0, ed = 0, ne = 0, hi = 0, lo = 0, r = 0, g = 0, b = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, l = Math.round((.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) * 1000) / 1000;   // dibulatkan 3 desimal: abu 245 tepat bernilai 245 (tanpa galat pecahan)
    a += l; r += d[i]; g += d[i + 1]; b += d[i + 2]; if (l >= 245) hi++; if (l <= 20) lo++;
    if (x >= x0 && x < x1 && y >= y0 && y < y1) { ce += l; nc++; } else { ed += l; ne++; }
  }
  const n = w * h; return { avg: a / n, back: ne && nc ? ed / ne - ce / nc : 0, hi: hi / n, lo: lo / n, r: r / n, g: g / n, b: b / n };
}
function stkLight(st, wajah) {   // MURNI: -> { k, ok, l, s } ; urutan prioritas: gelap, terang, belakang, silau, (khusus wajah) kuning/biru, cukup
  if (!st || ![st.avg, st.back, st.hi, st.r, st.g, st.b].every(Number.isFinite)) return { k: 'tak', ok: null, l: 'Belum terbaca', s: '' };
  if (st.avg < 50) return { k: 'gelap', ok: false, l: 'Terlalu gelap', s: 'Terlalu gelap. Nyalakan lampu atau mendekat ke jendela.' };
  if (st.avg > 205) return { k: 'terang', ok: false, l: 'Terlalu terang', s: 'Terlalu terang. Kurangi sinar langsung atau geser dari matahari.' };
  if (st.back > 45) return { k: 'belakang', ok: false, l: 'Cahaya dari belakang', s: 'Cahaya dari belakang. Hadapkan badan ke sumber cahaya atau jauhi jendela di belakang.' };
  if (st.hi > .2) return { k: 'silau', ok: false, l: 'Ada bagian silau', s: 'Sebagian gambar terlalu terang (silau). Hindari sinar langsung ke wajah atau badan.' };
  if (wajah && st.b > 0) {
    const q = st.r / st.b;
    if (q > 1.3) return { k: 'kuning', ok: false, l: 'Cahaya kekuningan', s: 'Cahaya tampak kekuningan; untuk warna wajah pakai cahaya jendela siang hari.' };
    if (q < .85) return { k: 'biru', ok: false, l: 'Cahaya kebiruan', s: 'Cahaya tampak kebiruan; untuk warna wajah pakai cahaya jendela siang hari.' };
  }
  return { k: 'cukup', ok: true, l: 'Cahaya cukup', s: '' };
}
function stkTilt(beta, gamma) {   // MURNI: sudut HP (DeviceOrientation, derajat) -> { k, ok, l, s, d }; tegak = beta sekitar 90 dan gamma sekitar 0, toleransi 8 derajat
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return { k: 'tak', ok: null, l: 'Tidak tersedia', s: '', d: 0 };
  if (Math.abs(gamma) > 45) return { k: 'datar', ok: false, l: 'HP mendatar', s: 'HP mendatar. Pegang atau sandarkan HP tegak.', d: Math.round(Math.abs(gamma)) };
  const d = beta - 90;
  if (d < -45) return { k: 'rebah', ok: false, l: 'HP terlalu rebah', s: 'HP terlalu rebah. Tegakkan HP.', d: Math.round(-d) };
  if (d < -8) return { k: 'belakang', ok: false, l: 'Miring ke belakang ' + Math.round(-d) + '°', s: 'Atas HP miring ke belakang ' + Math.round(-d) + '°. Tegakkan supaya proporsi badan tidak berubah.', d: Math.round(-d) };
  if (d > 8) return { k: 'depan', ok: false, l: 'Condong ke depan ' + Math.round(d) + '°', s: 'Atas HP condong ke depan ' + Math.round(d) + '°. Tegakkan supaya proporsi badan tidak berubah.', d: Math.round(d) };
  if (Math.abs(gamma) > 8) return { k: 'sisi', ok: false, l: 'Condong ke ' + (gamma > 0 ? 'kanan ' : 'kiri ') + Math.round(Math.abs(gamma)) + '°', s: 'HP condong ke ' + (gamma > 0 ? 'kanan ' : 'kiri ') + Math.round(Math.abs(gamma)) + '°. Luruskan.', d: Math.round(Math.abs(gamma)) };
  return { k: 'tegak', ok: true, l: 'HP tegak', s: '', d: Math.round(Math.max(Math.abs(d), Math.abs(gamma))) };
}
function stkCount(t0, now, total) {   // MURNI: hitung mundur -> { left (detik, dibulatkan ke atas), done, frac (0 sampai 1 yang sudah lewat) } atau null bila masukan tidak sah
  if (![t0, now, total].every(Number.isFinite) || total < 0) return null;
  const ms = total * 1000, el = Math.min(Math.max(now - t0, 0), ms);
  return { left: Math.ceil((ms - el) / 1000), done: el >= ms, frac: ms ? el / ms : 1 };
}
function stkFit(vw, vh, maxSide) {   // MURNI: ukuran foto hasil (sisi terpanjang <= maxSide, tidak diperbesar, rasio dijaga) -> { w, h } atau null
  if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw < 1 || vh < 1) return null;
  const m = Number.isFinite(maxSide) && maxSide >= 1 ? maxSide : STK_MAXSIDE, k = Math.min(1, m / Math.max(vw, vh));
  return { w: Math.max(1, Math.round(vw * k)), h: Math.max(1, Math.round(vh * k)) };
}
function stkReady(id, light, tilt) {   // MURNI: verdict "siap difoto" -> { ok, items[] }; sudut tak dikenal = tidak siap. Cahaya belum terbaca atau sudut HP tidak tersedia TIDAK menghalangi (tidak menebak). Pemeriksa tegak hanya untuk sudut badan dan outfit.
  const g = stkGuide(id); if (!g) return { ok: false, items: ['Pilih sudut pengambilan dulu.'] };
  const items = [];
  if (light && light.ok === false && light.s) items.push(light.s);
  if (g.tegak && tilt && tilt.ok === false && tilt.s) items.push(tilt.s);
  return { ok: items.length === 0, items: items };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1a: Object.freeze({ modes: STK_MODES, times: STK_TIMES, guide: stkGuide, analyze: stkAnalyze, light: stkLight, tilt: stkTilt, count: stkCount, fit: stkFit, ready: stkReady, timerOk: stkTimerOk }) }));
/* ===== STK-1a-end ===== */
/* ===== STK-1b1-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-1: KARTU "Kamera gaya" (TAMPILAN, TANPA kamera): pilih sudut pengambilan, baca panduan, lihat dukungan perangkat. TIDAK membuka kamera, tidak mengambil foto, tidak menulis penyimpanan, tanpa AI, tanpa jaringan, tidak ikut cadangan JSON. Memakai fungsi murni STK-1a (STK_MODES, stkGuide). Pilihan sudut hanya di memori (STKV). Membalik: hapus blok STK-1b1 dan CSS .stk-*. ===== */
const STK_SOON = [['Buka kamera, pratinjau, dan siluet pemandu', 'STK-1b-2'], ['Cek cahaya dan cek tegak langsung', 'STK-1b-3'], ['Timer, tombol Foto, dan hasil sementara', 'STK-1b-4'], ['Privasi foto: pratinjau yang akan dikirim dan wajah dikaburkan', 'STK-2'], ['Scan badan, scan warna, dan cek outfit oleh AI', 'STK-3 sampai STK-5']];   // butir yang belum dikerjakan; tiap tahap selesai mengurangi daftar ini
const STK_LEAD = 'Pilih sudut foto, lalu baca panduannya. Kamera belum dibuka dan belum ada foto yang diambil.';
const STKV = { mode: 'depan' };   // sudut terpilih; hanya di memori
function stkSupport(nav, win) {   // MURNI: dukungan perangkat -> { cam: { k, ok, l, d }, tilt: { k, ok, izin, l, d } }; tidak melempar galat untuk masukan apa pun
  const gum = !!(nav && nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function');
  const cam = !gum ? { k: 'tak', ok: false, l: 'Tidak didukung', d: 'Peramban ini tidak punya akses kamera.' }
    : (win && win.isSecureContext === false) ? { k: 'aman', ok: false, l: 'Butuh sambungan aman', d: 'Kamera hanya jalan lewat https.' }
    : { k: 'ada', ok: true, l: 'Didukung', d: 'Izin kamera ditanya saat Anda membuka kamera.' };
  const doe = win && win.DeviceOrientationEvent, has = typeof doe !== 'undefined' && doe !== null && (typeof doe === 'function' || typeof doe === 'object');
  const tilt = !has ? { k: 'tak', ok: false, izin: false, l: 'Tidak ada', d: 'Cek tegak dilewati; foto tetap bisa diambil.' }
    : typeof doe.requestPermission === 'function' ? { k: 'izin', ok: true, izin: true, l: 'Didukung, perlu izin', d: 'Peramban akan meminta izin sensor gerak saat kamera dibuka.' }
    : { k: 'ada', ok: true, izin: false, l: 'Didukung', d: 'Ada tidaknya sensor baru terbukti saat kamera dibuka; bila tidak ada, cek tegak dilewati.' };
  return { cam: cam, tilt: tilt };
}
function stkCardHtml(modeId, sup) {
  const g = stkGuide(modeId) || STK_MODES[0], s = sup || stkSupport(null, null);
  const chips = STK_MODES.map(m => '<button type="button" class="stk-mode" data-q="stkMode" data-id="' + esc(m.id) + '" data-fk="stk-mode-' + esc(m.id) + '" aria-pressed="' + (m.id === g.id) + '">' + esc(m.t) + '</button>').join('');
  const meta = [['Kamera', g.cam === 'user' ? 'Depan' : 'Belakang'], ['Timer', g.tm + ' detik'], ['Cek tegak', g.tegak ? 'Ya' : 'Tidak perlu']].map(x => '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>').join('');
  const row = (nm, o) => '<li data-k="' + esc(o.k) + '"><b>' + esc(nm) + ':</b> ' + esc(o.l) + '. ' + esc(o.d) + '</li>';
  return '<section class="nw-card stk-card" id="stkCard" aria-label="Kamera gaya"><div class="nw-hd"><h3>Kamera gaya</h3><span class="nw-soon">Persiapan</span></div><p class="nw-p">' + esc(STK_LEAD) + '</p>' +
    '<div class="stk-modes" role="group" aria-label="Sudut pengambilan">' + chips + '</div>' +
    '<h4 class="stk-t">' + esc(g.t) + '</h4><p class="nw-p">' + esc(g.s) + '</p><ul class="nw-list">' + g.tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<dl class="stk-meta">' + meta + '</dl>' +
    '<ul class="stk-sup" aria-label="Dukungan di perangkat ini">' + row('Kamera', s.cam) + row('Sensor sudut HP', s.tilt) + '</ul>' +
    '<p class="nw-fine">Foto yang kelak diambil hanya berada di memori selama kartu ini terbuka: tidak disimpan, tidak dikirim, dan tidak ikut cadangan. Ambang cahaya dan tegak adalah patokan penyusun, bukan standar, dan hanya berupa saran.</p></section>';
}
function stkSoonHtml() {
  if (!STK_SOON.length) return '';
  return '<section class="nw-card" id="stkSoon"><div class="nw-hd"><h3>Menyusul di tab ini</h3><span class="nw-soon">Segera</span></div><ul class="nw-list">' + STK_SOON.map(x => '<li>' + esc(x[0]) + ' <span class="hr-tg">(' + esc(x[1]) + ')</span></li>').join('') + '</ul><p class="nw-fine">Tab Kamera dikerjakan bertahap, satu bagian per tahap (STK-1b sampai STK-6).</p></section>';
}
function stkHtml(modeId, sup) { return stkCardHtml(modeId, sup) + stkSoonHtml(); }
function stkMount() { const root = $('#nwDapperBody'), card = root && root.querySelector('.nw-card'); if (!card) return; const w = document.createElement('div'); w.id = 'stkWrap'; w.innerHTML = stkHtml(STKV.mode, stkSupport(navigator, window)); card.replaceWith(w); }
{ const baseNwStk = nwRender; nwRender = function (key) {
  const root = key === 'dapper' ? $('#nwDapperBody') : null, ae = document.activeElement, fk = root && ae && ae.dataset && root.contains(ae) ? ae.dataset.fk : null;   // fokus dipulihkan sesudah kartu diganti
  baseNwStk.apply(this, arguments);
  if (key === 'dapper' && nwTab.dapper === 'kamera') { stkMount(); if (fk) { const el = root.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } } }
}; }
QACT.stkMode = b => { const id = b && b.dataset ? b.dataset.id : ''; if (!stkGuide(id)) return; STKV.mode = id; nwRender('dapper'); };
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b1: Object.freeze({ support: stkSupport, card: stkCardHtml, html: stkHtml, soon: STK_SOON }) }));
/* ===== STK-1b1-end ===== */
/* ===== STK-1b2-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-2: BUKA/TUTUP KAMERA + PRATINJAU + SILUET PEMANDU. Tidak mengambil foto, tidak menggambar frame ke kanvas, tidak menulis penyimpanan, tanpa AI, tanpa jaringan, tidak ikut cadangan JSON. Kamera hanya jalan saat tombol Buka kamera ditekan dan MATI di semua jalur: tombol Tutup, pindah tab Dapper, pindah halaman, layar disembunyikan (visibilitychange), pagehide, track terputus, ganti sudut ke kamera lain, kamera Rekam atau pemindai barcode dibuka. Membalik: hapus blok STK-1b2, CSS .stk-cam/.stk-view/.stk-go, dan baris pembungkus. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-1b-2'); if (i >= 0) STK_SOON.splice(i, 1); })();   // butir yang kini selesai
const STKC = { st: 'off', stream: null, tok: 0, face: '', msg: '' };   // st: off | starting | live | err; hanya di memori
const STK_ERR = { perm: 'Izin kamera ditolak. Di Chrome Android: ketuk ikon di kiri alamat > Izin > Kamera > Izinkan, lalu buka kamera lagi.', nocam: 'Kamera yang dibutuhkan tidak ditemukan di perangkat ini.', busy: 'Kamera tidak bisa dipakai. Mungkin sedang dipakai aplikasi lain; tutup aplikasi itu lalu coba lagi.', cam: 'Kamera tidak bisa dibuka.' };
function stkCamPlan(modeId) {   // MURNI: urutan percobaan getUserMedia dari yang paling sesuai ke yang paling longgar; tanpa suara
  const g = stkGuide(modeId) || STK_MODES[0], f = g.cam === 'user' ? 'user' : 'environment';
  return { face: f, tries: [{ video: { facingMode: { ideal: f }, width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false }, { video: { facingMode: { ideal: f } }, audio: false }, { video: true, audio: false }] };
}
function stkCamErr(name) {   // MURNI: nama galat getUserMedia -> { k, m } (k: perm | nocam | busy | cam)
  const n = typeof name === 'string' ? name : '', k = n === 'NotAllowedError' || n === 'SecurityError' ? 'perm' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'nocam' : n === 'NotReadableError' || n === 'AbortError' || n === 'TrackStartError' ? 'busy' : 'cam';
  return { k: k, m: STK_ERR[k] };
}
function stkCamConflict(cmLive, scanBusy) { return cmLive ? 'Kamera tab Rekam sedang aktif. Tutup dulu kamera di tab Rekam.' : scanBusy ? 'Pemindai barcode sedang memakai kamera. Tutup dulu pemindainya.' : ''; }   // MURNI
function stkSil(modeId) {   // MURNI: siluet pemandu (SVG garis putus-putus) per sudut; hanya patokan posisi, bukan penilai
  const id = stkGuide(modeId) ? modeId : 'depan', body = '<path d="M36 36 Q50 31 64 36 L70 82 L62 82 L60 150 L52 150 L50 104 L48 150 L40 150 L38 82 L30 82 Z"/>', head = '<circle cx="50" cy="20" r="9"/>';
  const parts = id === 'wajah' ? '<ellipse cx="50" cy="66" rx="26" ry="36"/><path d="M8 160 Q12 126 50 120 Q88 126 92 160"/>'
    : id === 'samping' ? head + '<path d="M44 34 Q53 32 57 37 L58 82 L56 150 L46 150 L44 96 Z"/>'
    : id === 'outfit' ? head + body + '<line x1="22" y1="152" x2="78" y2="152"/>' : head + body;
  return '<svg class="stk-sil" data-sil="' + id + '" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' + parts + '</svg>';
}
function stkCamHtml(st, face, msg, canOpen) {   // MURNI: isi kotak kamera (tombol + status + pratinjau)
  const live = st === 'live' || st === 'starting';
  const btn = live ? '<button type="button" class="stk-go" data-q="stkCam" data-fk="stk-cam">' + (st === 'starting' ? 'Batalkan' : 'Tutup kamera') + '</button>' : canOpen ? '<button type="button" class="stk-go" data-q="stkCam" data-fk="stk-cam">Buka kamera</button>' : '';
  const stat = st === 'starting' ? 'Membuka kamera. Setujui izin bila ditanya.' : st === 'live' ? 'Kamera ' + (face === 'user' ? 'depan' : 'belakang') + ' aktif. Hanya pratinjau: belum ada foto yang diambil dan tidak ada gambar yang disimpan atau dikirim.' : (msg || '');
  const view = live ? '<div class="stk-view" data-face="' + esc(face) + '"><video id="stkVid" playsinline muted autoplay></video>' + stkSil(STKV.mode) + '</div>' : '';
  return btn + (stat ? '<p class="nw-p stk-st" id="stkSt" role="status">' + esc(stat) + '</p>' : '') + view;
}
function stkCamStop(msg) {   // aman dipanggil berulang; mematikan semua track
  STKC.tok++;
  const s = STKC.stream; STKC.stream = null;
  if (s) { try { s.getTracks().forEach(t => { try { t.onended = null; } catch (e) { /* abaikan */ } t.stop(); }); } catch (e) { /* abaikan */ } }
  const v = $('#stkVid'); if (v) { try { v.pause(); v.srcObject = null; } catch (e) { /* abaikan */ } }
  const was = STKC.st !== 'off'; STKC.st = msg ? 'err' : 'off'; STKC.msg = msg || ''; STKC.face = '';
  if (was || msg) stkCamPaint();
}
function stkCamPaint() {
  const card = $('#stkCard'); if (!card) return;
  const g = stkGuide(STKV.mode) || STK_MODES[0], face = g.cam === 'user' ? 'user' : 'environment';
  if ((STKC.st === 'live' || STKC.st === 'starting') && STKC.face && STKC.face !== face) { STKC.tok++; const s = STKC.stream; STKC.stream = null; if (s) { try { s.getTracks().forEach(t => t.stop()); } catch (e) { /* abaikan */ } } STKC.st = 'err'; STKC.msg = 'Sudut diganti ke kamera ' + (face === 'user' ? 'depan' : 'belakang') + '. Buka kamera lagi.'; STKC.face = ''; }
  let box = $('#stkCam'), ae = document.activeElement, fk = box && ae && ae.dataset && box.contains(ae) ? ae.dataset.fk : null;
  if (!box) { box = document.createElement('div'); box.id = 'stkCam'; box.className = 'stk-cam'; const ref = card.querySelector('.stk-sup'); if (ref) card.insertBefore(box, ref); else card.appendChild(box); }
  const sup = stkSupport(navigator, window);
  box.innerHTML = stkCamHtml(STKC.st, STKC.st === 'live' || STKC.st === 'starting' ? STKC.face : face, STKC.msg, sup.cam.ok);
  const lead = card.querySelector(':scope > p.nw-p'); if (lead && STKC.st !== 'off') lead.textContent = 'Pilih sudut foto, lalu atur posisi pada siluet. Kamera hanya untuk pratinjau; foto belum bisa diambil.';
  const v = $('#stkVid'); if (v && STKC.stream) { v.srcObject = STKC.stream; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  if (fk) { const el = box.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
async function stkCamOpen() {
  if (STKC.st === 'live' || STKC.st === 'starting') return;
  const sup = stkSupport(navigator, window); if (!sup.cam.ok) { STKC.st = 'err'; STKC.msg = sup.cam.l + '. ' + sup.cam.d; stkCamPaint(); return; }
  let cm = false, sc = false; try { cm = typeof CM !== 'undefined' && !!CM.st; } catch (e) { /* abaikan */ } try { sc = typeof gdScan !== 'undefined' && !!(gdScan.stream || gdScan.st === 'starting' || gdScan.st === 'live'); } catch (e) { /* abaikan */ }
  const cf = stkCamConflict(cm, sc); if (cf) { STKC.st = 'err'; STKC.msg = cf; stkCamPaint(); return; }
  const plan = stkCamPlan(STKV.mode), tok = ++STKC.tok; STKC.st = 'starting'; STKC.face = plan.face; STKC.msg = ''; stkCamPaint();
  let stream = null, err = null;
  for (const c of plan.tries) {
    try { stream = await navigator.mediaDevices.getUserMedia(c); err = null; break; } catch (e) { err = e; if (!e || e.name !== 'OverconstrainedError') break; }
    if (tok !== STKC.tok) break;
  }
  if (tok !== STKC.tok) { if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch (e) { /* abaikan */ } } return; }   // dibatalkan saat menunggu izin: matikan kamera segera
  if (!stream) { STKC.st = 'err'; STKC.msg = stkCamErr(err && err.name).m; STKC.face = ''; stkCamPaint(); return; }
  STKC.stream = stream; STKC.st = 'live';
  stream.getTracks().forEach(t => { t.onended = () => { if (tok === STKC.tok && STKC.stream === stream) stkCamStop('Kamera terputus. Buka kamera lagi bila perlu.'); }; });
  stkCamPaint();
}
QACT.stkCam = () => { if (STKC.st === 'live' || STKC.st === 'starting') stkCamStop(); else stkCamOpen(); };
{ const baseStkMount = stkMount; stkMount = function () { baseStkMount.apply(this, arguments); stkCamPaint(); }; }   // setiap kartu baru digambar ulang: kotak kamera dipasang lagi dan aliran yang hidup disambung ke video baru
{ const baseNwStk2 = nwRender; nwRender = function (key) { if (key === 'dapper' && nwTab.dapper !== 'kamera') stkCamStop(); baseNwStk2.apply(this, arguments); }; }   // pindah tab Dapper: kamera mati SEBELUM tab baru digambar
{ const baseShowStk = showView; showView = function (v) { if (v !== 'dapper') stkCamStop(); return baseShowStk.apply(this, arguments); }; }   // pindah halaman
document.addEventListener('visibilitychange', () => { if (document.hidden && (STKC.st === 'live' || STKC.st === 'starting')) stkCamStop('Kamera dimatikan saat layar disembunyikan. Buka kamera lagi bila perlu.'); });
addEventListener('pagehide', () => { if (STKC.stream) stkCamStop(); });
{ const baseScanQ = QACT.gdScan; if (typeof baseScanQ === 'function') QACT.gdScan = function () { stkCamStop(); return baseScanQ.apply(this, arguments); }; }   // pemindai barcode dibuka: kamera Dapper dimatikan dulu
{ const baseCmQ = QACT.cmOpen; if (typeof baseCmQ === 'function') QACT.cmOpen = function () { stkCamStop(); return baseCmQ.apply(this, arguments); }; }   // kamera Rekam dibuka
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b2: Object.freeze({ plan: stkCamPlan, err: stkCamErr, conflict: stkCamConflict, sil: stkSil, html: stkCamHtml, stop: stkCamStop, state: () => ({ st: STKC.st, face: STKC.face, msg: STKC.msg, live: !!STKC.stream, tracks: STKC.stream ? STKC.stream.getTracks().filter(t => t.readyState === 'live').length : 0 }) }) }));
/* ===== STK-1b2-end ===== */
/* ===== STK-1b3a-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-3a: CEK CAHAYA LANGSUNG. Saat kamera hidup, tiap sekitar 1 detik satu frame digambar ke kanvas KECIL 32 x 48 yang hanya ada di memori (tidak masuk halaman, tidak ada toDataURL/toBlob, tidak disimpan, tidak dikirim), dibaca dengan stkAnalyze + stkLight (STK-1a), lalu satu kalimat saran ditampilkan. Hanya saran, tidak memblokir apa pun. Berhenti bersama kamera. Tanpa AI, tanpa jaringan, tidak menulis penyimpanan. Membalik: hapus blok STK-1b3a, CSS .stk-lt, dan kembalikan butir STK-1b-3. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-1b-3'); if (i >= 0) STK_SOON[i] = ['Cek tegak langsung (sensor sudut HP)', 'STK-1b-3b']; })();   // cek cahaya selesai; cek tegak menyusul
const STKL = { t: null, cv: null, ctx: null, st: { shown: null, pend: null, n: 0 }, off: false };   // hanya di memori
const STK_LT = { w: 32, h: 48, ms: 1000, need: 2 };   // ukuran sampel, jeda, jumlah bacaan berturut-turut sebelum tampilan berganti
function stkLtStep(st, res) {   // MURNI: penghalus tampilan -> keadaan baru; bacaan 'tak' diabaikan; kategori baru baru tampil bila terbaca STK_LT.need kali berturut-turut (anti kedip)
  const s = st && typeof st === 'object' ? st : { shown: null, pend: null, n: 0 };
  if (!res || typeof res.k !== 'string' || res.k === 'tak') return { shown: s.shown, pend: s.pend, n: s.n };
  if (!s.shown || s.shown.k === res.k) return { shown: res, pend: null, n: 0 };
  const n = s.pend && s.pend.k === res.k ? s.n + 1 : 1;
  return n >= STK_LT.need ? { shown: res, pend: null, n: 0 } : { shown: s.shown, pend: res, n: n };
}
function stkLtHtml(shown, show) {   // MURNI: baris cahaya + catatan privasi; kosong bila belum ada bacaan atau kamera tidak hidup
  if (!show || !shown || typeof shown.k !== 'string') return '';
  return '<p class="nw-p stk-lt" id="stkLt" role="status" aria-live="polite" data-k="' + esc(shown.k) + '">' + esc(shown.s || shown.l || '') + '</p><p class="nw-fine" id="stkLtN">Cek cahaya membaca gambar kecil 32 x 48 di memori, sekitar sekali per detik; tidak disimpan atau dikirim, hanya saran.</p>';
}
function stkLtSample(video, cv, ctx, wajah) {   // gambar satu frame ke kanvas kecil, baca angkanya; null bila belum bisa
  if (!video || !cv || !ctx || !(video.readyState >= 2) || !(video.videoWidth > 0)) return null;
  try { ctx.drawImage(video, 0, 0, STK_LT.w, STK_LT.h); const d = ctx.getImageData(0, 0, STK_LT.w, STK_LT.h); return stkLight(stkAnalyze(d.data, STK_LT.w, STK_LT.h), !!wajah); } catch (e) { return null; }
}
function stkLtStopT() { if (STKL.t) { clearInterval(STKL.t); STKL.t = null; } STKL.cv = null; STKL.ctx = null; STKL.st = { shown: null, pend: null, n: 0 }; }
function stkLtShow() {
  const box = $('#stkCam'); if (!box) return;
  const live = STKC.st === 'live' && !!STKC.stream, sh = STKL.st.shown, el = $('#stkLt');
  if (!live || !sh) { if (el) { el.remove(); const n = $('#stkLtN'); if (n) n.remove(); } return; }
  if (!el) { box.insertAdjacentHTML('beforeend', stkLtHtml(sh, true)); return; }
  if (el.dataset.k !== sh.k) { el.dataset.k = sh.k; el.textContent = sh.s || sh.l || ''; }   // elemen tetap, hanya teks berubah: pembaca layar tidak diulang tiap detik
}
function stkLtTick() {
  if (STKC.st !== 'live' || !STKC.stream || document.hidden) { if (STKC.st !== 'live') stkLtStopT(); return; }
  const v = $('#stkVid'); if (!v) return;
  if (!STKL.cv && !STKL.off) { try { STKL.cv = document.createElement('canvas'); STKL.cv.width = STK_LT.w; STKL.cv.height = STK_LT.h; STKL.ctx = STKL.cv.getContext('2d', { willReadFrequently: true }); if (!STKL.ctx) { STKL.cv = null; STKL.off = true; } } catch (e) { STKL.cv = null; STKL.off = true; } }
  if (!STKL.cv) return;
  const r = stkLtSample(v, STKL.cv, STKL.ctx, STKV.mode === 'wajah'); if (!r) return;
  STKL.st = stkLtStep(STKL.st, r); stkLtShow();
}
{ const basePaintLt = stkCamPaint; stkCamPaint = function () {
  basePaintLt.apply(this, arguments);
  if (STKC.st === 'live' && STKC.stream) { if (!STKL.t) STKL.t = setInterval(stkLtTick, STK_LT.ms); stkLtShow(); } else { stkLtStopT(); stkLtShow(); }   // kotak digambar ulang: baris cahaya dipasang lagi; kamera tidak hidup: pewaktu mati
}; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b3a: Object.freeze({ step: stkLtStep, html: stkLtHtml, sample: stkLtSample, tick: stkLtTick, cfg: STK_LT, state: () => ({ timer: !!STKL.t, canvas: !!STKL.cv, shown: STKL.st.shown ? STKL.st.shown.k : null, pend: STKL.st.pend ? STKL.st.pend.k : null, n: STKL.st.n }) }) }));
/* ===== STK-1b3a-end ===== */
/* ===== STK-1b3b-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-3b: CEK TEGAK LANGSUNG. Saat kamera hidup pada sudut yang butuh tegak (bukan Wajah), sensor sudut HP (DeviceOrientation) dibaca dan stkTilt (STK-1a) menampilkan satu saran. Di iOS izin sensor hanya diminta dari tombol. Bila sensor tidak ada, ditolak, atau tidak mengirim data, cek tegak dilewati dengan pesan; foto tetap bisa diambil kelak. Hanya saran, tidak memblokir. Nilai sensor hanya di memori, tidak disimpan atau dikirim; tanpa AI, tanpa jaringan. Berhenti bersama kamera. Membalik: hapus blok STK-1b3b dan CSS .stk-tl, kembalikan butir STK-1b-3b. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-1b-3b'); if (i >= 0) STK_SOON.splice(i, 1); })();   // butir yang kini selesai
const STKT = { h: null, t: null, b: null, g: null, ev: 0, ticks: 0, perm: 'none', st: { shown: null, pend: null, n: 0 }, last: '' };   // perm: none | granted | denied; hanya di memori
const STK_TL = { ms: 500, wait: 5 };   // jeda baca; berapa jeda tanpa data sebelum dianggap sensor tidak ada
function stkTlPlan(modeId, sup, perm, ev, ticks) {   // MURNI: keadaan cek tegak -> off | na | need | denied | wait | live
  const g = stkGuide(modeId); if (!g || !g.tegak) return 'off';
  const t = sup && sup.tilt; if (!t || !t.ok) return 'na';
  if (t.izin && perm !== 'granted') return perm === 'denied' ? 'denied' : 'need';
  if (ev > 0) return 'live';
  return ticks >= STK_TL.wait ? 'na' : 'wait';
}
function stkTlHtml(state, shown) {   // MURNI: isi kotak cek tegak; kosong bila tidak perlu
  const p = (k, t) => '<p class="nw-p stk-tl" id="stkTl" role="status" aria-live="polite" data-k="' + esc(k) + '">' + esc(t) + '</p>';
  if (state === 'need') return '<button type="button" class="stk-go stk-tl-b" data-q="stkTilt" data-fk="stk-tilt">Aktifkan cek tegak</button><p class="nw-fine" id="stkTlN">HP akan meminta izin sensor gerak. Nilai sensor hanya dibaca di layar ini, tidak disimpan atau dikirim.</p>';
  if (state === 'denied') return p('izin', 'Izin sensor gerak ditolak, jadi cek tegak dilewati. Foto tetap bisa diambil.');
  if (state === 'na') return p('na', 'Sensor sudut HP tidak tersedia atau tidak mengirim data, jadi cek tegak dilewati. Foto tetap bisa diambil.');
  if (state === 'wait') return p('tunggu', 'Membaca sensor sudut HP...');
  if (state === 'live') return shown && typeof shown.k === 'string' ? p(shown.k, shown.s || shown.l || '') : p('tunggu', 'Membaca sensor sudut HP...');
  return '';
}
function stkTlStopT() { if (STKT.t) { clearInterval(STKT.t); STKT.t = null; } if (STKT.h) { try { removeEventListener('deviceorientation', STKT.h); } catch (e) { /* abaikan */ } STKT.h = null; } STKT.b = null; STKT.g = null; STKT.ev = 0; STKT.ticks = 0; STKT.st = { shown: null, pend: null, n: 0 }; STKT.last = ''; }
function stkTlState() { return stkTlPlan(STKV.mode, stkSupport(navigator, window), STKT.perm, STKT.ev, STKT.ticks); }
function stkTlShow() {
  const box = $('#stkTlBox'); if (!box) return;
  const html = stkTlHtml(STKC.st === 'live' && STKC.stream ? stkTlState() : 'off', STKT.st.shown);
  if (html === STKT.last) return; STKT.last = html; box.innerHTML = html;   // hanya diganti bila isinya berubah: pembaca layar tidak mengulang
}
function stkTlListen() {
  if (STKT.h) return;
  STKT.h = e => { if (e && Number.isFinite(e.beta) && Number.isFinite(e.gamma)) { STKT.b = e.beta; STKT.g = e.gamma; STKT.ev++; } };
  try { addEventListener('deviceorientation', STKT.h); } catch (e) { STKT.h = null; }
}
function stkTlTick() {
  if (STKC.st !== 'live' || !STKC.stream) { stkTlStopT(); stkTlShow(); return; }
  const s = stkTlState(); if (s === 'off') { stkTlStopT(); stkTlShow(); return; }
  if (s === 'wait') STKT.ticks++;
  if (s === 'live') STKT.st = stkLtStep(STKT.st, stkTilt(STKT.b, STKT.g));
  stkTlShow();
}
function stkTlEnsure() {   // dipanggil tiap kotak kamera digambar ulang
  const live = STKC.st === 'live' && !!STKC.stream, s = live ? stkTlState() : 'off';
  if (!live || s === 'off') { stkTlStopT(); const b = $('#stkTlBox'); if (b) b.remove(); return; }
  const cam = $('#stkCam'); if (!cam) return;
  let box = $('#stkTlBox'); if (!box) { box = document.createElement('div'); box.id = 'stkTlBox'; box.className = 'stk-tlbox'; cam.appendChild(box); }
  STKT.last = '';
  const sup = stkSupport(navigator, window);
  if (s !== 'need' && s !== 'denied' && sup.tilt.ok) stkTlListen();
  if (!STKT.t) STKT.t = setInterval(stkTlTick, STK_TL.ms);
  stkTlShow();
}
QACT.stkTilt = async () => {   // dari tombol: izin gaya iOS
  if (STKT.perm === 'granted') return;
  let r = 'denied'; try { const d = window.DeviceOrientationEvent; r = d && typeof d.requestPermission === 'function' ? await d.requestPermission() : 'granted'; } catch (e) { r = 'denied'; }
  STKT.perm = r === 'granted' ? 'granted' : 'denied';
  if (STKC.st === 'live') stkCamPaint();
};
{ const basePaintTl = stkCamPaint; stkCamPaint = function () { basePaintTl.apply(this, arguments); stkTlEnsure(); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b3b: Object.freeze({ plan: stkTlPlan, html: stkTlHtml, tick: stkTlTick, cfg: STK_TL, state: () => ({ timer: !!STKT.t, listening: !!STKT.h, ev: STKT.ev, ticks: STKT.ticks, perm: STKT.perm, shown: STKT.st.shown ? STKT.st.shown.k : null, plan: stkTlState() }) }) }));
/* ===== STK-1b3b-end ===== */
/* ===== STK-1b4a-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-4a: TIMER + TOMBOL FOTO + HASIL SEMENTARA. Pilih timer (Langsung/3/5/10 dtk; bawaan mengikuti sudut), ketuk Foto, hitung mundur (stkCount STK-1a), lalu satu frame diambil (ukuran stkFit, sisi terpanjang 1280) menjadi gambar JPEG SEMENTARA di memori (blob), kamera dimatikan, hasil tampil dengan tombol Ulangi dan Buang. TIDAK disimpan (tanpa penyimpanan, tanpa unduhan), TIDAK dikirim, tanpa AI, tanpa jaringan, tidak ikut cadangan JSON. Hasil dibuang bila tab Dapper atau halaman ditinggalkan, halaman ditutup, tombol Buang, atau Ulangi. Membalik: hapus blok STK-1b4a, CSS .stk-ph, kembalikan butir STK-1b-4 dan teks lama. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-1b-4'); if (i >= 0) STK_SOON[i] = ['Penilaian "siap difoto" sebelum jepret', 'STK-1b-4b']; })();   // timer, Foto, dan hasil sementara selesai
const STKP = { st: 'idle', tm: null, t0: 0, total: 0, left: 0, t: null, url: '', w: 0, h: 0, msg: '', last: '' };   // st: idle | count | shooting | shot; hanya di memori
const STK_PH = { ms: 250, q: 0.92 };
function stkPhTm(tm, modeId) { const g = stkGuide(modeId) || STK_MODES[0]; return stkTimerOk(tm) ? tm : g.tm; }   // MURNI: timer terpilih; belum dipilih atau tak sah -> bawaan sudut
function stkCdText(left) { return Number.isFinite(left) && left > 0 ? 'Foto dalam ' + left + ' detik. Tahan posisi.' : 'Mengambil foto...'; }   // MURNI
function stkPhHtml(s, o) {   // MURNI: isi kotak foto per keadaan: off | idle | count | wait | shot
  o = o && typeof o === 'object' ? o : {};
  const tm = stkPhTm(o.tm, o.mode), msg = o.msg ? '<p class="nw-p stk-ph-msg" role="status">' + esc(o.msg) + '</p>' : '';
  if (s === 'idle') {
    const chips = STK_TIMES.map(n => '<button type="button" class="stk-mode stk-tm" data-q="stkTm" data-t="' + n + '" data-fk="stk-tm-' + n + '" aria-pressed="' + (n === tm) + '">' + (n === 0 ? 'Langsung' : n + ' dtk') + '</button>').join('');
    return '<div class="stk-modes" role="group" aria-label="Timer foto">' + chips + '</div><button type="button" class="stk-go" data-q="stkFoto" data-fk="stk-foto">' + (tm === 0 ? 'Foto sekarang' : 'Foto (dalam ' + tm + ' detik)') + '</button>' + msg;
  }
  if (s === 'count') return '<p class="nw-p stk-cd" id="stkCd" role="status" aria-live="polite">' + esc(stkCdText(o.left)) + '</p><button type="button" class="stk-go" data-q="stkFotoBatal" data-fk="stk-batal">Batalkan foto</button>';
  if (s === 'wait') return '<p class="nw-p stk-cd" role="status">' + esc(stkCdText(0)) + '</p>';
  if (s === 'shot') return '<figure class="stk-res"><img src="' + esc(o.url || '') + '" alt="Hasil foto sementara" width="' + (Number.isFinite(o.w) ? o.w : 0) + '" height="' + (Number.isFinite(o.h) ? o.h : 0) + '"><figcaption class="nw-fine">Foto sementara (' + (Number.isFinite(o.w) ? o.w : 0) + ' x ' + (Number.isFinite(o.h) ? o.h : 0) + '): hanya ada di memori selama kartu ini terbuka. Belum disimpan dan belum dikirim.</figcaption></figure><button type="button" class="stk-go" data-q="stkFotoUlang" data-fk="stk-ulang">Ulangi foto</button><button type="button" class="stk-go stk-go2" data-q="stkFotoBuang" data-fk="stk-buang">Buang foto</button>' + msg;
  return '';
}
function stkPhState() { const live = STKC.st === 'live' && !!STKC.stream; if (STKP.st === 'shot') return 'shot'; if (!live) return 'off'; return STKP.st === 'count' ? 'count' : STKP.st === 'shooting' ? 'wait' : 'idle'; }
function stkPhStopT() { if (STKP.t) { clearInterval(STKP.t); STKP.t = null; } }
function stkPhRender() {
  const box = $('#stkPhBox'); if (!box) return;
  const html = stkPhHtml(stkPhState(), { tm: STKP.tm, mode: STKV.mode, left: STKP.left, url: STKP.url, w: STKP.w, h: STKP.h, msg: STKP.msg });
  if (html === STKP.last) return;
  const ae = document.activeElement, fk = ae && ae.dataset && box.contains(ae) ? ae.dataset.fk : null;
  STKP.last = html; box.innerHTML = html;
  if (fk) { const el = box.querySelector('[data-fk="' + fk + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }
}
function stkPhEnsure() {   // dipanggil tiap kotak kamera digambar ulang
  const live = STKC.st === 'live' && !!STKC.stream;
  if ((STKP.st === 'count' || STKP.st === 'shooting') && !live) { stkPhStopT(); STKP.st = 'idle'; }   // kamera mati saat hitung mundur: batal
  const s = stkPhState(), cam = $('#stkCam'); let box = $('#stkPhBox');
  if (s === 'off' || !cam) { if (box) box.remove(); const l0 = $('#stkCard > p.nw-p'); if (l0 && STKC.st === 'off') l0.textContent = STK_LEAD; return; }   // tidak ada kamera dan tidak ada foto: teks pembuka kembali ke semula
  if (!box) { box = document.createElement('div'); box.id = 'stkPhBox'; box.className = 'stk-ph'; cam.appendChild(box); }
  STKP.last = ''; stkPhRender();
  const lead = $('#stkCard > p.nw-p'), st = $('#stkSt');
  if (lead) lead.textContent = s === 'shot' ? 'Foto sementara siap. Anda bisa mengulang atau membuangnya.' : 'Pilih sudut foto, atur posisi pada siluet, lalu ketuk Foto.';
  if (st && live) st.textContent = 'Kamera ' + (STKC.face === 'user' ? 'depan' : 'belakang') + ' aktif. Foto yang diambil hanya di memori: tidak disimpan dan tidak dikirim.';
}
function stkPhDiscard() {
  stkPhStopT(); if (STKP.url) { try { URL.revokeObjectURL(STKP.url); } catch (e) { /* abaikan */ } }
  STKP.url = ''; STKP.w = 0; STKP.h = 0; STKP.msg = ''; STKP.st = 'idle'; STKP.left = 0; stkPhEnsure();
}
function stkPhShoot() {
  const v = $('#stkVid');
  if (!v || !(v.readyState >= 2) || !(v.videoWidth > 0)) { STKP.st = 'idle'; STKP.msg = 'Kamera belum siap. Tunggu gambar muncul lalu coba lagi.'; stkPhEnsure(); return; }
  const fit = stkFit(v.videoWidth, v.videoHeight, STK_MAXSIDE); if (!fit) { STKP.st = 'idle'; STKP.msg = 'Foto tidak bisa dibuat.'; stkPhEnsure(); return; }
  STKP.st = 'shooting'; STKP.msg = ''; stkPhStopT();
  try {
    const cv = document.createElement('canvas'); cv.width = fit.w; cv.height = fit.h; cv.getContext('2d').drawImage(v, 0, 0, fit.w, fit.h);
    cv.toBlob(b => {
      if (STKP.st !== 'shooting') return;   // dibatalkan atau kamera mati selagi menunggu: hasil dibuang
      if (!b) { STKP.st = 'idle'; STKP.msg = 'Foto tidak bisa dibuat.'; stkPhEnsure(); return; }
      if (STKP.url) { try { URL.revokeObjectURL(STKP.url); } catch (e) { /* abaikan */ } }
      STKP.url = URL.createObjectURL(b); STKP.bytes = b.size; STKP.w = fit.w; STKP.h = fit.h; STKP.st = 'shot'; stkCamStop();   // kamera dimatikan sesudah jepret; stkCamStop menggambar ulang
      stkPhEnsure();
    }, 'image/jpeg', STK_PH.q);
  } catch (e) { STKP.st = 'idle'; STKP.msg = 'Foto tidak bisa dibuat.'; stkPhEnsure(); }
}
function stkPhTick() {
  if (STKP.st !== 'count' || STKC.st !== 'live') { stkPhEnsure(); return; }
  const c = stkCount(STKP.t0, performance.now(), STKP.total); if (!c) { stkPhStopT(); STKP.st = 'idle'; stkPhEnsure(); return; }
  if (c.done) { stkPhStopT(); stkPhShoot(); stkPhEnsure(); return; }
  if (c.left !== STKP.left) { STKP.left = c.left; const el = $('#stkCd'); if (el) el.textContent = stkCdText(c.left); }   // teks diganti di tempat: tombol Batalkan tidak digambar ulang
}
QACT.stkTm = b => { const n = Number(b && b.dataset ? b.dataset.t : NaN); if (!stkTimerOk(n) || STKP.st !== 'idle') return; STKP.tm = n; STKP.msg = ''; stkPhRender(); };
QACT.stkFoto = () => {
  if (STKP.st !== 'idle' || STKC.st !== 'live' || !STKC.stream) return;
  const tm = stkPhTm(STKP.tm, STKV.mode); STKP.msg = '';
  if (tm === 0) { stkPhShoot(); stkPhEnsure(); return; }
  STKP.st = 'count'; STKP.total = tm; STKP.left = tm; STKP.t0 = performance.now(); stkPhStopT(); STKP.t = setInterval(stkPhTick, STK_PH.ms); stkPhEnsure();
};
QACT.stkFotoBatal = () => { if (STKP.st !== 'count') return; stkPhStopT(); STKP.st = 'idle'; STKP.left = 0; stkPhEnsure(); };
QACT.stkFotoBuang = () => { if (STKP.st === 'shot') stkPhDiscard(); };
QACT.stkFotoUlang = () => { if (STKP.st !== 'shot') return; stkPhDiscard(); QACT.stkCam(); };
{ const baseCamQ = QACT.stkCam; QACT.stkCam = function () { if (STKP.st === 'shot' && STKC.st !== 'live' && STKC.st !== 'starting') stkPhDiscard(); return baseCamQ.apply(this, arguments); }; }   // membuka kamera lagi: hasil lama dibuang dulu
{ const basePaintPh = stkCamPaint; stkCamPaint = function () { basePaintPh.apply(this, arguments); stkPhEnsure(); }; }
{ const baseNwPh = nwRender; nwRender = function (key) { if (key === 'dapper' && nwTab.dapper !== 'kamera') stkPhDiscard(); baseNwPh.apply(this, arguments); }; }   // pindah tab Dapper: hasil dibuang
{ const baseShowPh = showView; showView = function (v) { if (v !== 'dapper') stkPhDiscard(); return baseShowPh.apply(this, arguments); }; }   // pindah halaman
addEventListener('pagehide', () => { stkPhDiscard(); });
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b4a: Object.freeze({ tm: stkPhTm, cd: stkCdText, html: stkPhHtml, tick: stkPhTick, discard: stkPhDiscard, cfg: STK_PH, state: () => ({ st: STKP.st, tm: STKP.tm, left: STKP.left, timer: !!STKP.t, url: !!STKP.url, w: STKP.w, h: STKP.h, msg: STKP.msg }) }) }));
/* ===== STK-1b4a-end ===== */
/* ===== STK-1b4b1-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-4b-1: LOGIKA MURNI penilaian "siap difoto" (belum ada tampilan). Menggabungkan bacaan cahaya (STK-1b-3a) dan bacaan tegak (STK-1b-3b) lewat stkReady (STK-1a) menjadi satu verdict + daftar singkat: apa yang sudah baik, apa yang perlu diperbaiki, apa yang belum terbaca atau dilewati. Hanya SARAN: tidak ada keluaran yang memblokir foto. Bacaan tegak hanya dipakai bila cek tegak benar-benar hidup (keadaan 'live'); bacaan basi dari keadaan lain diabaikan. Tanpa DOM, tanpa penyimpanan, tanpa jaringan, tanpa kamera, tanpa waktu. Membalik: hapus blok STK-1b4b1. ===== */
const STK_RD_TITLE = { siap: 'Siap difoto', sebagian: 'Sejauh ini baik', catatan: 'Belum ideal', belum: 'Belum ada penilaian' };
const STK_RD_MARK = { siap: '✓', sebagian: '✓', catatan: '!', belum: '…' };   // tanda selain warna
function stkRdPick(o) {   // MURNI: bacaan sah (ok true, atau ok false dengan kalimat saran) -> objek itu; selain itu null (tak terbaca, tak sah)
  if (!o || typeof o !== 'object' || typeof o.l !== 'string' || !o.l) return null;
  if (o.ok === true) return o;
  if (o.ok === false && typeof o.s === 'string' && o.s) return o;
  return null;
}
function stkRdView(modeId, light, tilt, tlState) {   // MURNI: -> { k: siap | sebagian | catatan | belum, ok: true | false | null, title, bad[], good[], notes[], items[] }
  const g = stkGuide(modeId);
  if (!g) return { k: 'belum', ok: null, title: STK_RD_TITLE.belum, bad: [], good: [], notes: ['Pilih sudut pengambilan dulu.'], items: [] };
  const lt = stkRdPick(light), tl = g.tegak && tlState === 'live' ? stkRdPick(tilt) : null;
  const r = stkReady(modeId, lt, tl), bad = [], good = [], notes = [];
  if (lt) (lt.ok ? good : bad).push(lt.l);
  if (tl) (tl.ok ? good : bad).push(tl.l);
  if (!lt) notes.push('Cahaya belum terbaca.');
  const skip = g.tegak && !tl && (tlState === 'na' || tlState === 'denied');
  if (g.tegak && !tl) notes.push(skip ? 'Cek tegak dilewati.' : tlState === 'need' ? 'Cek tegak belum diaktifkan.' : 'Cek tegak belum terbaca.');
  const pend = (!lt ? 1 : 0) + (g.tegak && !tl && !skip ? 1 : 0);
  const k = !r.ok ? 'catatan' : !lt && !tl ? 'belum' : pend ? 'sebagian' : 'siap';
  return { k: k, ok: k === 'siap' ? true : k === 'catatan' ? false : null, title: STK_RD_TITLE[k], bad: bad, good: good, notes: notes, items: r.items };
}
function stkRdHtml(v) {   // MURNI: tampilan satu verdict; kosong bila masukan tak sah. Tanpa tombol, tanpa aria-live (cahaya dan tegak sudah punya baris berbunyi sendiri).
  if (!v || typeof v.k !== 'string' || !STK_RD_TITLE[v.k]) return '';
  const a = x => Array.isArray(x) ? x.filter(s => typeof s === 'string' && s) : [], bad = a(v.bad), good = a(v.good), notes = a(v.notes);
  let h = '<div class="stk-rd stk-rd-' + v.k + '" id="stkRd" data-k="' + v.k + '"><p class="nw-p stk-rd-t"><span class="stk-rd-i" aria-hidden="true">' + STK_RD_MARK[v.k] + '</span> <b>' + esc(STK_RD_TITLE[v.k]) + '</b></p>';
  if (bad.length) h += '<p class="nw-p stk-rd-l">Perlu diperbaiki: ' + esc(bad.join('; ')) + '.</p>';
  if (good.length) h += '<p class="nw-p stk-rd-l">Sudah baik: ' + esc(good.join('; ')) + '.</p>';
  if (notes.length) h += '<p class="nw-fine stk-rd-n">' + esc(notes.join(' ')) + '</p>';
  if (v.k === 'catatan' || v.k === 'sebagian') h += '<p class="nw-fine stk-rd-n">Hanya saran: foto tetap bisa diambil.</p>';
  return h + '</div>';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b4b1: Object.freeze({ view: stkRdView, html: stkRdHtml, pick: stkRdPick, titles: STK_RD_TITLE }) }));
/* ===== STK-1b4b1-end ===== */
/* ===== STK-1b4b2-begin (17 Nov 2026): Dapper > Kamera, bagian 1b-4b-2: TAMPILAN "siap difoto". Memasang kotak #stkRd (verdict STK-1b-4b-1) di kartu Kamera gaya tepat di atas timer dan tombol Foto, HANYA saat kamera hidup dan belum menghitung mundur; hilang saat hitung mundur, jepret, hasil, atau kamera mati. Diperbarui dari tik cahaya (STK-1b-3a) dan tik tegak (STK-1b-3b) dan penggambaran kotak foto (STK-1b-4a) yang sudah ada: TANPA pewaktu baru, TANPA membaca kamera sendiri, tanpa penyimpanan, tanpa jaringan, tanpa AI. Hanya saran: tidak memblokir tombol Foto. Baris cahaya dan tegak dirapikan ke atas kotak ini (hanya memindah elemen yang tidak bisa difokus). Membalik: hapus blok STK-1b4b2 dan CSS .stk-rd, kembalikan butir STK-1b-4b. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-1b-4b'); if (i >= 0) STK_SOON.splice(i, 1); })();   // butir yang kini selesai
const STKRD = { last: '' };   // hanya di memori
function stkRdOrder() {   // urutan di #stkCam: baris cahaya, catatan cahaya, kotak tegak, verdict, kotak foto. Hanya memindah elemen yang tak bisa difokus (baris cahaya, catatan, verdict), jadi fokus papan ketik tidak hilang.
  const ph = $('#stkPhBox'); if (!ph) return;
  const rd = $('#stkRd'), tb = $('#stkTlBox'), lt = $('#stkLt'), ln = $('#stkLtN');
  if (rd && rd.nextElementSibling !== ph) ph.before(rd);
  const a = tb || rd || ph;
  if (ln && ln.nextElementSibling !== a) a.before(ln);
  if (lt && lt.nextElementSibling !== (ln || a)) (ln || a).before(lt);
}
function stkRdShow() {   // satu pintu pembaruan: pasang, ganti isi, atau buang kotak verdict
  const live = STKC.st === 'live' && !!STKC.stream, ph = $('#stkPhBox'), cam = $('#stkCam'); let rd = $('#stkRd');
  if (!live || STKP.st !== 'idle' || !ph || !cam) { if (rd) rd.remove(); STKRD.last = ''; if (live && ph) stkRdOrder(); return; }
  const html = stkRdHtml(stkRdView(STKV.mode, STKL.st.shown, STKT.st.shown, stkTlState()));
  if (!html) { if (rd) rd.remove(); STKRD.last = ''; stkRdOrder(); return; }
  if (!rd || html !== STKRD.last) { const t = document.createElement('div'); t.innerHTML = html; const n = t.firstElementChild; if (!n) return; if (rd) rd.replaceWith(n); else ph.before(n); STKRD.last = html; }   // elemen diganti hanya bila isinya berubah
  stkRdOrder();
}
{ const baseLtShowRd = stkLtShow; stkLtShow = function () { baseLtShowRd.apply(this, arguments); stkRdShow(); }; }   // tik cahaya
{ const baseTlShowRd = stkTlShow; stkTlShow = function () { baseTlShowRd.apply(this, arguments); stkRdShow(); }; }   // tik tegak
{ const basePhEnsureRd = stkPhEnsure; stkPhEnsure = function () { basePhEnsureRd.apply(this, arguments); stkRdShow(); }; }   // kotak foto digambar ulang: hitung mundur, jepret, hasil, kamera mati
window.DL = Object.freeze(Object.assign({}, window.DL, { stk1b4b2: Object.freeze({ show: stkRdShow, order: stkRdOrder, state: () => { const e = $('#stkRd'); return { shown: !!e, k: e ? e.dataset.k : null, last: !!STKRD.last }; } }) }));
/* ===== STK-1b4b2-end ===== */
/* ===== STK-2a-begin (17 Nov 2026): Dapper > Kamera, bagian 2a: LOGIKA MURNI PENGABURAN AREA FOTO + RINGKASAN "YANG AKAN DIKIRIM" (belum ada tampilan, belum dihubungkan ke foto). Tanpa DOM, penyimpanan, jaringan, kamera, waktu. (1) Area kabur disimpan sebagai PECAHAN gambar (0 sampai 1) supaya tidak tergantung ukuran piksel; (2) stkBlurAdd/stkBlurUndo = operasi daftar area (batas 12, area terlalu kecil ditolak); (3) stkPixelate = mosaik rata-rata per kotak langsung pada data RGBA (tidak bisa dibalik: detail di dalam kotak hilang); (4) stkSendPlan = ringkasan jujur apa yang akan dikirim dan apakah boleh. Membalik: hapus blok ini. ===== */
const STK_BLUR = { max: 12, minFrac: 0.03, minBlock: 8, div: 5, maxSide: 8192 };   // max area per foto; sisi area terkecil (pecahan); kotak mosaik minimum (piksel); sisi pendek area dibagi paling banyak 5 kotak
function stkFrac(v) { return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : NaN; }   // MURNI: jepit ke 0..1; bukan angka -> NaN
function stkBlurNorm(a) {   // MURNI: area { x, y, w, h } (pecahan; w atau h boleh negatif bila ditarik ke kiri/atas) -> area rapi di dalam gambar, atau null
  if (!a || typeof a !== 'object') return null;
  const x0 = stkFrac(a.x), y0 = stkFrac(a.y), x1 = stkFrac(a.x + a.w), y1 = stkFrac(a.y + a.h);
  if (![x0, y0, x1, y1].every(Number.isFinite)) return null;
  const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.max(x0, x1) - x, h = Math.max(y0, y1) - y;
  if (w < STK_BLUR.minFrac || h < STK_BLUR.minFrac) return null;
  return { x, y, w, h };
}
function stkBlurAdd(list, a) {   // MURNI: tambah satu area -> { list (baru, tidak mengubah masukan), ok, why } ; why: '' | 'kecil' | 'penuh'
  const cur = Array.isArray(list) ? list.map(stkBlurNorm).filter(Boolean) : [];
  const n = stkBlurNorm(a);
  if (!n) return { list: cur, ok: false, why: 'kecil' };
  if (cur.length >= STK_BLUR.max) return { list: cur, ok: false, why: 'penuh' };
  return { list: cur.concat([n]), ok: true, why: '' };
}
function stkBlurUndo(list) { return (Array.isArray(list) ? list.map(stkBlurNorm).filter(Boolean) : []).slice(0, -1); }   // MURNI: buang area terakhir
function stkBlurRect(a, w, h) {   // MURNI: area pecahan -> kotak piksel bulat di dalam gambar { x, y, w, h }, atau null
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > STK_BLUR.maxSide || h > STK_BLUR.maxSide) return null;
  const n = stkBlurNorm(a); if (!n) return null;
  const x0 = Math.min(w - 1, Math.floor(n.x * w + 1e-9)), y0 = Math.min(h - 1, Math.floor(n.y * h + 1e-9));
  const x1 = Math.min(w, Math.max(x0 + 1, Math.ceil((n.x + n.w) * w - 1e-9))), y1 = Math.min(h, Math.max(y0 + 1, Math.ceil((n.y + n.h) * h - 1e-9)));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function stkBlockSize(r) { return r && r.w >= 1 && r.h >= 1 ? Math.max(STK_BLUR.minBlock, Math.ceil(Math.min(r.w, r.h) / STK_BLUR.div)) : STK_BLUR.minBlock; }   // MURNI: sisi kotak mosaik; wajah selalu jadi paling banyak sekitar 5 x 5 kotak
function stkImgOk(data, w, h) { return !!data && ArrayBuffer.isView(data) && data.BYTES_PER_ELEMENT === 1 && Number.isInteger(w) && Number.isInteger(h) && w >= 1 && h >= 1 && w <= STK_BLUR.maxSide && h <= STK_BLUR.maxSide && data.length === w * h * 4; }   // MURNI: data RGBA 8 bit dengan panjang tepat
function stkPixelate(data, w, h, r, block) {   // data RGBA diubah LANGSUNG: tiap kotak di dalam r diganti rata-rata warnanya; di luar r dan kanal alfa tidak disentuh. true bila dikerjakan
  if (!stkImgOk(data, w, h) || !r || ![r.x, r.y, r.w, r.h].every(Number.isInteger) || r.x < 0 || r.y < 0 || r.w < 1 || r.h < 1 || r.x + r.w > w || r.y + r.h > h) return false;
  const bs = Number.isInteger(block) && block >= 1 ? block : stkBlockSize(r), ex = r.x + r.w, ey = r.y + r.h;
  for (let by = r.y; by < ey; by += bs) {
    const y1 = Math.min(by + bs, ey);
    for (let bx = r.x; bx < ex; bx += bs) {
      const x1 = Math.min(bx + bs, ex); let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) { const i = (y * w + x) * 4; sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++; }
      const mr = Math.round(sr / n), mg = Math.round(sg / n), mb = Math.round(sb / n);
      for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) { const i = (y * w + x) * 4; data[i] = mr; data[i + 1] = mg; data[i + 2] = mb; }
    }
  }
  return true;
}
function stkBlurApply(data, w, h, list) {   // kabur semua area pada data RGBA -> { ok, n (jumlah area yang dikerjakan), rects }
  if (!stkImgOk(data, w, h)) return { ok: false, n: 0, rects: [] };
  const rects = (Array.isArray(list) ? list : []).slice(0, STK_BLUR.max).map(a => stkBlurRect(a, w, h)).filter(Boolean);
  rects.forEach(r => stkPixelate(data, w, h, r));
  return { ok: true, n: rects.length, rects };
}
function stkKb(bytes) {   // MURNI: ukuran berkas yang mudah dibaca ("48 KB", "1,2 MB"); bukan angka atau <= 0 -> ''
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (Math.round(bytes / (1024 * 1024) * 10) / 10).toString().replace('.', ',') + ' MB';
}
function stkSendPlan(o) {   // MURNI: ringkasan jujur "yang akan dikirim" -> { k, canSend, title, lines[], why }. o: { ai (AI menyala), grup (izin grup Foto), w, h, bytes, n (jumlah area kabur) }
  o = o && typeof o === 'object' ? o : {};
  const has = Number.isInteger(o.w) && o.w > 0 && Number.isInteger(o.h) && o.h > 0 && Number.isFinite(o.bytes) && o.bytes > 0;
  if (!has) return { k: 'nofoto', canSend: false, title: 'Belum ada foto', lines: [], why: 'Ambil foto dulu.' };
  const n = Number.isInteger(o.n) && o.n > 0 ? Math.min(o.n, STK_BLUR.max) : 0;
  const lines = ['Satu foto, ' + o.w + ' x ' + o.h + ' piksel, sekitar ' + stkKb(o.bytes) + '.', n ? n + ' area dikaburkan di perangkat ini sebelum dikirim.' : 'Tidak ada area yang dikaburkan.', 'Foto dibuat ulang dari gambar kamera, jadi tidak membawa lokasi, tanggal, atau data kamera.'];
  if (o.ai !== true) return { k: 'aimati', canSend: false, title: 'Belum akan dikirim', lines, why: 'AI belum dinyalakan di Pengaturan AI.' };
  if (o.grup !== true) return { k: 'grupmati', canSend: false, title: 'Belum akan dikirim', lines, why: 'Pengiriman foto belum diizinkan. Nyalakan "Foto" di Pengaturan AI.' };
  return { k: 'siap', canSend: true, title: 'Yang akan dikirim', lines, why: '' };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2a: Object.freeze({ cfg: STK_BLUR, norm: stkBlurNorm, add: stkBlurAdd, undo: stkBlurUndo, rect: stkBlurRect, block: stkBlockSize, pixelate: stkPixelate, apply: stkBlurApply, kb: stkKb, plan: stkSendPlan }) }));
/* ===== STK-2a-end ===== */
/* ===== STK-2b-begin (17 Nov 2026): Dapper > Kamera, bagian 2b: grup privasi `foto` di AI_GROUPS (bawaan MATI), tampil di Pengaturan AI. Blok ini hanya pegangan uji BACA-SAJA; perubahan sebenarnya = satu butir baru di AI_GROUPS (lihat patch_stk2b.py). Belum ada fitur yang memakai grup ini; STK-3 yang akan memeriksa aiOn('foto') sebelum mengirim foto. ===== */
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2b: Object.freeze({ groups: () => AI_GROUPS.map(g => ({ id: g.id, t: g.t, s: g.s, on: g.on })), fotoOn: () => aiOn('foto'), clean: aiClean, blank: aiBlank }) }));
/* ===== STK-2b-end ===== */
/* ===== STK-2c1-begin (17 Nov 2026): Dapper > Kamera, bagian 2c-1: EDITOR TANDAI AREA KABUR di kartu hasil foto. Tombol "Kaburkan area" membuka editor: tarik jari (atau mouse) di atas foto hasil untuk menandai kotak, daftar area dengan Hapus per area, Urungkan, Hapus semua, Selesai. Area disimpan sebagai PECAHAN gambar (stkBlurNorm STK-2a), maksimal 12, hanya di memori, dibuang bersama fotonya. Tahap ini HANYA MENANDAI: foto TIDAK diubah (Terapkan = STK-2c-2), tanpa AI, tanpa jaringan, tanpa penyimpanan, tidak ikut cadangan JSON. Kode lama tidak diubah (pembungkus stkPhEnsure; kartu hasil STK-1b-4a tetap utuh, gambar hanya dipindah ke dalam pembungkus). Membalik: hapus blok ini + CSS STK-2c1-css ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-2'); if (i >= 0) STK_SOON[i] = ['Privasi foto: Terapkan kabur dan kotak "Yang akan dikirim"', 'STK-2c-2 dan STK-2d']; })();
const STKB = { open: false, list: [], drag: null, msg: '', url: '' };   // hanya di memori; list = area pecahan yang sudah dirapikan
const STK_TAP = 6;   // gerak jari di bawah ini (piksel layar) dianggap ketukan biasa, bukan tarikan: diabaikan tanpa pesan
function stkPtFrac(x, y, r) {   // MURNI: titik layar -> pecahan di dalam kotak r { left, top, width, height }; masukan rusak -> null
  if (!r || ![r.left, r.top, r.width, r.height].every(Number.isFinite) || r.width <= 0 || r.height <= 0 || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: stkFrac((x - r.left) / r.width), y: stkFrac((y - r.top) / r.height) };
}
function stkDragRect(p0, p1) {   // MURNI: dua titik pecahan -> kotak { x, y, w, h } (belum disaring ukuran minimum); titik rusak -> null
  if (!p0 || !p1 || ![p0.x, p0.y, p1.x, p1.y].every(Number.isFinite)) return null;
  return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
}
function stkBlurDrop(list, i) {   // MURNI: buang area ke-i; indeks tak sah -> daftar tetap (dirapikan); masukan tidak diubah
  const cur = Array.isArray(list) ? list.map(stkBlurNorm).filter(Boolean) : [];
  return Number.isInteger(i) && i >= 0 && i < cur.length ? cur.filter((_, k) => k !== i) : cur;
}
function stkRectStyle(r) {   // MURNI: kotak pecahan -> gaya CSS persen; tanpa penyaringan ukuran (untuk kotak yang sedang ditarik)
  if (!r || ![r.x, r.y, r.w, r.h].every(Number.isFinite)) return '';
  const p = v => Math.round(Math.min(1, Math.max(0, v)) * 10000) / 100;
  return 'left:' + p(r.x) + '%;top:' + p(r.y) + '%;width:' + p(r.w) + '%;height:' + p(r.h) + '%';
}
function stkBoxStyle(a) { const n = stkBlurNorm(a); return n ? stkRectStyle(n) : ''; }   // MURNI: area sah -> gaya CSS persen; tidak sah -> ''
function stkBlurLabel(a, i) { const n = stkBlurNorm(a); return n && Number.isInteger(i) && i >= 0 ? 'Area ' + (i + 1) + ': lebar ' + Math.round(n.w * 100) + '%, tinggi ' + Math.round(n.h * 100) + '%' : ''; }   // MURNI
function stkBlurWhy(why) { return why === 'kecil' ? 'Area terlalu kecil. Tarik lebih lebar.' : why === 'penuh' ? 'Sudah ' + STK_BLUR.max + ' area (batas). Hapus satu dulu.' : ''; }   // MURNI
function stkBlurHtml(o) {   // MURNI: isi kotak kendali editor: o = { open, areas[], msg }
  o = o && typeof o === 'object' ? o : {};
  const areas = (Array.isArray(o.areas) ? o.areas : []).map(stkBlurNorm).filter(Boolean).slice(0, STK_BLUR.max), n = areas.length;
  const msg = o.msg ? '<p class="nw-p stk-ph-msg" role="status">' + esc(o.msg) + '</p>' : '';
  if (!o.open) return '<button type="button" class="stk-go stk-go2" data-q="stkBlurOpen" data-fk="stk-bl-open">' + (n ? 'Atur area kabur (' + n + ')' : 'Kaburkan area (wajah, dll.)') + '</button>' + (n ? '<p class="nw-fine">' + n + ' area ditandai di foto. Belum diterapkan: foto belum berubah.</p>' : '') + msg;
  const rows = areas.map((a, i) => '<li><span>' + esc(stkBlurLabel(a, i)) + '</span><button type="button" class="stk-bl-b" data-q="stkBlurDel" data-i="' + i + '" data-fk="stk-bl-del-' + i + '" aria-label="Hapus Area ' + (i + 1) + '">Hapus</button></li>').join('');
  return '<div class="stk-bl" role="group" aria-label="Kaburkan area foto"><p class="nw-p">Tarik jari (atau mouse) di atas foto untuk menandai area yang ingin dikaburkan, misalnya wajah. Kotak bisa ditarik ke segala arah.</p>' +
    '<p class="nw-fine" role="status">' + n + ' dari ' + STK_BLUR.max + ' area ditandai.</p>' + (n ? '<ol class="stk-bl-l">' + rows + '</ol>' : '') +
    '<div class="stk-bl-bt"><button type="button" class="stk-bl-b" data-q="stkBlurUndo" data-fk="stk-bl-undo"' + (n ? '' : ' disabled') + '>Urungkan</button><button type="button" class="stk-bl-b" data-q="stkBlurClear" data-fk="stk-bl-clear"' + (n ? '' : ' disabled') + '>Hapus semua</button><button type="button" class="stk-bl-b stk-bl-ok" data-q="stkBlurClose" data-fk="stk-bl-close">Selesai</button></div>' +
    '<p class="nw-fine">Tombol Terapkan menyusul (STK-2c-2). Sampai saat itu tanda ini hanya penanda di layar: foto TIDAK berubah, belum disimpan, belum dikirim.</p></div>' + msg;
}
function stkLiveBox(ov) {   // kotak putus-putus selama ditarik; diperbarui di tempat, tanpa menggambar ulang kartu
  const d = STKB.drag; if (!d) return;
  let b = ov.querySelector('.stk-box-live'); if (!b) { b = document.createElement('span'); b.className = 'stk-box stk-box-live'; b.setAttribute('aria-hidden', 'true'); ov.appendChild(b); }
  b.style.cssText = stkRectStyle(stkDragRect(d.p0, d.p1));
}
function stkOvEnd(ov, e, ok) {
  const d = STKB.drag; if (!d || e.pointerId !== d.id) return;
  STKB.drag = null; try { ov.releasePointerCapture(e.pointerId); } catch (x) { /* abaikan */ }
  const live = ov.querySelector('.stk-box-live'); if (live) live.remove();
  if (ok) {
    const p = stkPtFrac(e.clientX, e.clientY, ov.getBoundingClientRect()); if (p) d.p1 = p;
    if (d.mv >= STK_TAP) { const r = stkBlurAdd(STKB.list, stkDragRect(d.p0, d.p1)); STKB.list = r.list; STKB.msg = stkBlurWhy(r.why); }   // ketukan pendek diabaikan tanpa pesan
  }
  stkBlurSync();
}
function stkOvBind(ov) {
  ov.addEventListener('pointerdown', e => {
    if (!STKB.open || STKB.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = stkPtFrac(e.clientX, e.clientY, ov.getBoundingClientRect()); if (!p) return;
    e.preventDefault(); try { ov.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ }
    STKB.drag = { id: e.pointerId, p0: p, p1: p, cx: e.clientX, cy: e.clientY, mv: 0 }; stkLiveBox(ov);
  });
  ov.addEventListener('pointermove', e => {
    const d = STKB.drag; if (!d || e.pointerId !== d.id) return;
    const p = stkPtFrac(e.clientX, e.clientY, ov.getBoundingClientRect()); if (!p) return;
    d.p1 = p; d.mv = Math.max(d.mv, Math.hypot(e.clientX - d.cx, e.clientY - d.cy)); stkLiveBox(ov);
  });
  ov.addEventListener('pointerup', e => stkOvEnd(ov, e, true));
  ov.addEventListener('pointercancel', e => stkOvEnd(ov, e, false));
}
function stkBlurReset(url) { STKB.open = false; STKB.list = []; STKB.drag = null; STKB.msg = ''; STKB.url = url || ''; }
function stkBlurSync() {   // memasang/memperbarui pembungkus gambar, lapisan kotak, dan kotak kendali di kartu hasil; idempoten
  const shot = STKP.st === 'shot' && !!STKP.url;
  if (!shot) { stkBlurReset(''); return; }   // tidak ada hasil: editor dan area dibuang
  if (STKB.url !== STKP.url) stkBlurReset(STKP.url);   // foto baru: area foto lama tidak ikut
  const box = $('#stkPhBox'), fig = box && box.querySelector('figure.stk-res'), img = fig && fig.querySelector('img'); if (!fig || !img) return;
  let wrap = fig.querySelector('.stk-wrap'); if (!wrap) { wrap = document.createElement('div'); wrap.className = 'stk-wrap'; fig.insertBefore(wrap, img); wrap.appendChild(img); }
  let ov = wrap.querySelector('.stk-ov'); if (!ov) { ov = document.createElement('div'); ov.className = 'stk-ov'; ov.id = 'stkOv'; wrap.appendChild(ov); stkOvBind(ov); STKB.drag = null; }
  ov.classList.toggle('stk-ov-on', STKB.open);
  const live = STKB.drag ? ov.querySelector('.stk-box-live') : null;
  ov.innerHTML = STKB.list.map((a, i) => '<span class="stk-box" aria-hidden="true" style="' + stkBoxStyle(a) + '"><i>' + (i + 1) + '</i></span>').join(''); if (live) ov.appendChild(live);
  let ctl = box.querySelector('#stkBlurBox'); if (!ctl) { ctl = document.createElement('div'); ctl.id = 'stkBlurBox'; ctl.className = 'stk-blbox'; fig.after(ctl); }
  const html = stkBlurHtml({ open: STKB.open, areas: STKB.list, msg: STKB.msg });
  if (ctl.dataset.h === html) return;
  const ae = document.activeElement, fk = ae && ae.dataset && ctl.contains(ae) ? ae.dataset.fk : null;
  ctl.dataset.h = html; ctl.innerHTML = html;
  if (fk) { let el = ctl.querySelector('[data-fk="' + fk + '"]'); if (!el || el.disabled) el = ctl.querySelector('[data-fk="stk-bl-close"], [data-fk="stk-bl-open"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (x) { /* abaikan */ } } }
}
QACT.stkBlurOpen = () => { if (STKP.st !== 'shot') return; STKB.open = true; STKB.msg = ''; stkBlurSync(); };
QACT.stkBlurClose = () => { if (!STKB.open) return; STKB.open = false; STKB.drag = null; STKB.msg = ''; stkBlurSync(); };
QACT.stkBlurUndo = () => { if (!STKB.open) return; STKB.list = stkBlurUndo(STKB.list); STKB.msg = ''; stkBlurSync(); };
QACT.stkBlurClear = () => { if (!STKB.open) return; STKB.list = []; STKB.msg = ''; stkBlurSync(); };
QACT.stkBlurDel = b => { if (!STKB.open) return; const i = Number(b && b.dataset ? b.dataset.i : NaN); if (!Number.isInteger(i)) return; STKB.list = stkBlurDrop(STKB.list, i); STKB.msg = ''; stkBlurSync(); };
{ const baseEnsureBl = stkPhEnsure; stkPhEnsure = function () { baseEnsureBl.apply(this, arguments); stkBlurSync(); }; }   // tiap kartu hasil digambar ulang: pasang ulang editor dari keadaan di memori
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2c1: Object.freeze({ tap: STK_TAP, ptFrac: stkPtFrac, dragRect: stkDragRect, drop: stkBlurDrop, rectStyle: stkRectStyle, boxStyle: stkBoxStyle, label: stkBlurLabel, why: stkBlurWhy, html: stkBlurHtml, sync: stkBlurSync, state: () => ({ open: STKB.open, n: STKB.list.length, list: STKB.list.map(a => ({ x: a.x, y: a.y, w: a.w, h: a.h })), drag: !!STKB.drag, msg: STKB.msg, url: !!STKB.url }) }) }));
/* ===== STK-2c1-end ===== */
/* ===== STK-2c2a-begin (17 Nov 2026): Dapper > Kamera, bagian 2c-2a: TOMBOL TERAPKAN KABUR. Area yang ditandai di editor (STK-2c-1) kini bisa DITERAPKAN: gambar foto sementara dimuat ke kanvas, piksel diambil, stkBlurApply (STK-2a) mengganti tiap area dengan mosaik, hasilnya dibuat ulang menjadi foto JPEG baru di memori yang MENGGANTIKAN foto lama (blob lama dibuang), area dikosongkan, dan jumlah area yang sudah dikaburkan dicatat. Sampai hasil siap, kendali diganti "Mengaburkan area..."; bila gagal atau foto dibuang/diganti di tengah jalan, foto tidak berubah dan hasil basi dibuang. Tanpa AI, tanpa jaringan, tanpa penyimpanan, tidak ikut cadangan JSON, belum ada deteksi wajah otomatis (2c-2b). Kode lama tidak diubah (pembungkus stkBlurHtml, stkBlurReset, QACT.stkBlurOpen). Membalik: hapus blok ini + CSS STK-2c2a-css ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-2c-2 dan STK-2d'); if (i >= 0) STK_SOON[i] = ['Privasi foto: deteksi wajah otomatis (bila peramban mendukung) dan kotak "Yang akan dikirim"', 'STK-2c-2b dan STK-2d']; })();
STKB.busy = false; STKB.done = 0; STKB.job = 0;   // busy: sedang mengaburkan; done: jumlah area yang sudah dikaburkan di foto ini; job: nomor pekerjaan (hasil pekerjaan basi dibuang)
const STK_AP = { maxSide: 8192, maxPx: 25000000 };
function stkApplyDims(w, h) { return Number.isInteger(w) && Number.isInteger(h) && w >= 1 && h >= 1 && w <= STK_AP.maxSide && h <= STK_AP.maxSide && w * h <= STK_AP.maxPx; }   // MURNI: ukuran gambar masuk akal untuk dikerjakan di kanvas
function stkApplyPlan(o) {   // MURNI: boleh menerapkan? o = { st, hasUrl, busy, areas[] } -> { ok, why, n }
  o = o && typeof o === 'object' ? o : {};
  if (o.st !== 'shot' || o.hasUrl !== true) return { ok: false, why: 'nofoto', n: 0 };
  if (o.busy === true) return { ok: false, why: 'busy', n: 0 };
  const n = Math.min(STK_BLUR.max, (Array.isArray(o.areas) ? o.areas : []).map(stkBlurNorm).filter(Boolean).length);
  return n ? { ok: true, why: '', n } : { ok: false, why: 'noarea', n: 0 };
}
function stkApplyMsg(k, n) {   // MURNI: pesan per hasil
  if (k === 'ok') return Number.isInteger(n) && n > 0 ? n + ' area dikaburkan. Foto sementara sudah diganti dengan hasil kabur dan foto asli dibuang dari memori; ini tidak bisa dibatalkan. Belum disimpan dan belum dikirim.' : '';
  if (k === 'noarea') return 'Tandai dulu area yang mau dikaburkan, lalu ketuk Terapkan.';
  if (k === 'load') return 'Foto tidak bisa dibaca. Foto tidak berubah.';
  if (k === 'make') return 'Hasil kabur tidak bisa dibuat. Foto tidak berubah.';
  return '';
}
function stkApplyHtml(base, o) {   // MURNI: html kotak kendali dasar (stkBlurHtml STK-2c-1) -> ditambah tombol Terapkan dan keterangan; o = { open, areas[], done, busy }
  o = o && typeof o === 'object' ? o : {};
  if (o.busy === true) return '<p class="nw-p stk-ph-msg" role="status" aria-live="polite">Mengaburkan area...</p>';
  const n = Math.min(STK_BLUR.max, (Array.isArray(o.areas) ? o.areas : []).map(stkBlurNorm).filter(Boolean).length), done = Number.isInteger(o.done) && o.done > 0 ? o.done : 0;
  let h = String(base == null ? '' : base);
  const doneP = done ? '<p class="nw-fine" role="status">Sudah dikaburkan di foto ini: ' + done + ' area.</p>' : '';
  if (o.open === true) {
    const OLD = '<p class="nw-fine">Tombol Terapkan menyusul (STK-2c-2). Sampai saat itu tanda ini hanya penanda di layar: foto TIDAK berubah, belum disimpan, belum dikirim.</p>';
    const NEW = '<p class="nw-fine">Terapkan mengaburkan area yang ditandai (mosaik) pada foto sementara ini. Foto asli diganti dan tidak bisa dikembalikan; untuk foto baru pakai Ulangi foto. Tetap hanya di memori: belum disimpan, belum dikirim.</p>';
    const OK = '<button type="button" class="stk-bl-b stk-bl-ok" data-q="stkBlurClose" data-fk="stk-bl-close">Selesai</button>';
    const BTN = '<button type="button" class="stk-bl-b stk-bl-ap" data-q="stkBlurApply" data-fk="stk-bl-apply"' + (n ? '' : ' disabled') + '>' + (n ? 'Terapkan kabur (' + n + ')' : 'Terapkan kabur') + '</button>';
    h = h.replace(OLD, NEW + doneP).replace(OK, BTN + OK);
  } else {
    const OPEN_END = 'data-fk="stk-bl-open">';
    const i = h.indexOf(OPEN_END), j = i >= 0 ? h.indexOf('</button>', i) : -1;
    if (n && j >= 0) h = h.slice(0, j + 9) + '<button type="button" class="stk-go" data-q="stkBlurApply" data-fk="stk-bl-apply2">Terapkan kabur (' + n + ')</button>' + h.slice(j + 9);
    if (doneP) { const m = h.indexOf('<p class="nw-p stk-ph-msg"'); h = m >= 0 ? h.slice(0, m) + doneP + h.slice(m) : h + doneP; }
  }
  return h;
}
{ const baseReset = stkBlurReset; stkBlurReset = function (url) { baseReset.apply(this, arguments); STKB.busy = false; STKB.done = 0; STKB.job++; }; }   // foto baru atau dibuang: pekerjaan yang berjalan dibatalkan (hasilnya basi), hitungan dikosongkan
{ const baseHtmlAp = stkBlurHtml; stkBlurHtml = function (o) { return stkApplyHtml(baseHtmlAp.apply(this, arguments), { open: o && o.open, areas: o && o.areas, done: STKB.done, busy: STKB.busy }); }; }
function stkApplyRun() {
  const plan = stkApplyPlan({ st: STKP.st, hasUrl: !!STKP.url, busy: STKB.busy, areas: STKB.list });
  if (!plan.ok) { if (plan.why === 'noarea') { STKB.msg = stkApplyMsg('noarea'); stkBlurSync(); } return; }
  const url0 = STKP.url, job = ++STKB.job, list = STKB.list.map(stkBlurNorm).filter(Boolean);   // salinan yang sudah dirapikan; butir rusak dibuang
  const stale = () => STKB.job !== job || STKP.url !== url0 || STKP.st !== 'shot';   // dibuang, diganti, atau dibatalkan selagi menunggu
  const fail = k => { if (stale()) return; STKB.busy = false; STKB.msg = stkApplyMsg(k); stkBlurSync(); };
  STKB.busy = true; STKB.open = false; STKB.drag = null; STKB.msg = ''; stkBlurSync();
  const img = new Image();
  img.onerror = () => fail('load');
  img.onload = () => {
    if (stale()) return;
    const w = img.naturalWidth, h = img.naturalHeight; if (!stkApplyDims(w, h)) { fail('load'); return; }
    try {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const id = cx.getImageData(0, 0, w, h), r = stkBlurApply(id.data, w, h, list); if (!r.ok || r.n < 1) { fail('make'); return; }
      cx.putImageData(id, 0, 0);
      cv.toBlob(b => {
        if (stale()) return;
        if (!b) { fail('make'); return; }
        const nu = URL.createObjectURL(b); try { URL.revokeObjectURL(url0); } catch (e) { /* abaikan */ }
        STKP.url = nu; STKP.bytes = b.size; STKP.w = w; STKP.h = h; STKB.url = nu; STKB.list = []; STKB.done += r.n; STKB.busy = false; STKB.open = false; STKB.drag = null; STKB.msg = stkApplyMsg('ok', r.n);
        stkPhEnsure();   // kartu hasil digambar ulang dengan foto baru; editor dipasang ulang dari keadaan di memori
      }, 'image/jpeg', STK_PH.q);
    } catch (e) { fail('make'); }
  };
  img.src = url0;
}
QACT.stkBlurApply = () => { stkApplyRun(); };
{ const baseOpenAp = QACT.stkBlurOpen; QACT.stkBlurOpen = function () { if (STKB.busy) return; return baseOpenAp.apply(this, arguments); }; }
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2c2a: Object.freeze({ cfg: STK_AP, dims: stkApplyDims, plan: stkApplyPlan, msg: stkApplyMsg, html: stkApplyHtml, run: stkApplyRun, state: () => ({ busy: STKB.busy, done: STKB.done, job: STKB.job }) }) }));
/* ===== STK-2c2a-end ===== */
/* ===== STK-2c2b1-begin (17 Nov 2026): Dapper > Kamera, bagian 2c-2b-1: LOGIKA MURNI DETEKSI WAJAH OTOMATIS (belum ada tampilan, belum dihubungkan ke foto, belum memanggil FaceDetector). Hasil FaceDetector (kotak piksel) diubah menjadi area kabur berupa PECAHAN (STK-2a) dengan tepi diperlebar supaya dahi, dagu, dan rambut ikut tertutup; kotak yang sudah ditandai tidak digandakan; yang melebihi batas 12 area dibuang (wajah terbesar didahulukan); ada rencana (boleh mencari?), pesan jujur, dan putusan uji-coba pendukung (konstruktor ada belum berarti didukung: hanya NotSupportedError yang berarti tidak didukung). Tanpa DOM, penyimpanan, jaringan, kamera, waktu. Membalik: hapus blok ini. ===== */
const STK_FACE = { pad: 0.2, dup: 0.5, maxIn: 50 };   // pad: tepi diperlebar tiap sisi (pecahan dari sisi kotak wajah); dup: tumpang tindih (IoU) mulai dianggap kotak yang sama; maxIn: paling banyak hasil detektor yang dibaca
function stkFaceHas(win) { return !!win && typeof win === 'object' && typeof win.FaceDetector === 'function'; }   // MURNI: konstruktor ada? (BELUM berarti didukung; lihat stkFaceProbeOk)
function stkFaceProbeOk(err) { return err == null ? true : !(typeof err === 'object' && err.name === 'NotSupportedError'); }   // MURNI: hasil uji-coba detect pada kanvas kosong: tanpa galat = didukung; NotSupportedError = tidak; galat lain = dianggap didukung (menurut dokumentasi Chrome)
function stkFaceBox(f) {   // MURNI: satu hasil detektor (DetectedFace dengan boundingBox, atau kotak langsung) -> { x, y, w, h } piksel, atau null
  if (!f || typeof f !== 'object') return null;
  const r = f.boundingBox && typeof f.boundingBox === 'object' ? f.boundingBox : f;
  const x = r.x, y = r.y, w = r.width, h = r.height;
  if (![x, y, w, h].every(v => typeof v === 'number' && Number.isFinite(v)) || w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}
function stkFaceArea(box, iw, ih) {   // MURNI: kotak piksel + ukuran gambar -> area pecahan yang sudah dirapikan dan diperlebar, atau null (di luar gambar / terlalu kecil)
  if (!box || !stkApplyDims(iw, ih)) return null;
  const px = box.w * STK_FACE.pad, py = box.h * STK_FACE.pad;
  return stkBlurNorm({ x: (box.x - px) / iw, y: (box.y - py) / ih, w: (box.w + 2 * px) / iw, h: (box.h + 2 * py) / ih });
}
function stkFaceIou(a, b) {   // MURNI: tumpang tindih dua area pecahan (0 sampai 1); masukan rusak -> 0
  const A = stkBlurNorm(a), B = stkBlurNorm(b); if (!A || !B) return 0;
  const iw = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), ih = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
  if (!(iw > 0) || !(ih > 0)) return 0;
  const inter = iw * ih, uni = A.w * A.h + B.w * B.h - inter;
  return uni > 0 ? inter / uni : 0;
}
function stkFaceNorm(found, iw, ih, existing) {   // MURNI: hasil detektor -> { areas (area BARU yang boleh ditambahkan), found (wajah sah), added, dup (sudah ditandai), full (tidak muat), bad (ukuran gambar tak sah) }; tidak mengubah masukan
  const out = { areas: [], found: 0, added: 0, dup: 0, full: 0, bad: false };
  if (!stkApplyDims(iw, ih)) { out.bad = true; return out; }
  const cand = (Array.isArray(found) ? found.slice(0, STK_FACE.maxIn) : []).map(f => stkFaceArea(stkFaceBox(f), iw, ih)).filter(Boolean);
  out.found = cand.length;
  cand.sort((p, q) => q.w * q.h - p.w * p.h);   // wajah terbesar dahulu (urutan sort stabil)
  const cur = (Array.isArray(existing) ? existing : []).map(stkBlurNorm).filter(Boolean), slots = Math.max(0, STK_BLUR.max - cur.length), keep = [];
  for (const c of cand) {
    if (cur.concat(keep).some(o => stkFaceIou(o, c) >= STK_FACE.dup)) { out.dup++; continue; }
    if (keep.length >= slots) { out.full++; continue; }
    keep.push(c);
  }
  out.areas = keep; out.added = keep.length; return out;
}
function stkFacePlan(o) {   // MURNI: boleh mencari wajah? o = { st, hasUrl, busy, finding, can } -> { ok, why }; why: '' | 'nofoto' | 'busy' | 'finding' | 'nosupport'
  o = o && typeof o === 'object' ? o : {};
  if (o.st !== 'shot' || o.hasUrl !== true) return { ok: false, why: 'nofoto' };
  if (o.busy === true) return { ok: false, why: 'busy' };
  if (o.finding === true) return { ok: false, why: 'finding' };
  if (o.can !== true) return { ok: false, why: 'nosupport' };
  return { ok: true, why: '' };
}
function stkFaceKind(r) { r = r && typeof r === 'object' ? r : {}; return r.bad === true ? 'fail' : r.added > 0 ? 'ok' : !(r.found > 0) ? 'none' : r.full > 0 && !(r.dup > 0) ? 'full' : 'dup'; }   // MURNI: hasil stkFaceNorm -> jenis pesan
function stkFaceMsg(k, r) {   // MURNI: pesan jujur per jenis; r = hasil stkFaceNorm (untuk 'ok')
  if (k === 'ok') {
    const n = r && Number.isInteger(r.added) && r.added > 0 ? r.added : 0; if (!n) return '';
    const dup = r && r.dup > 0 ? ' ' + r.dup + ' wajah sudah ditandai sebelumnya.' : '', full = r && r.full > 0 ? ' ' + r.full + ' wajah tidak muat (batas ' + STK_BLUR.max + ' area).' : '';
    return n + ' wajah ditandai otomatis. Periksa kotaknya: hapus yang salah, tarik sendiri bila ada yang terlewat. Foto belum berubah.' + dup + full;
  }
  if (k === 'none') return 'Tidak ada wajah yang ditemukan. Tandai sendiri bila perlu.';
  if (k === 'dup') return 'Wajah yang ditemukan sudah ditandai.';
  if (k === 'full') return 'Area sudah penuh (batas ' + STK_BLUR.max + '). Hapus satu dulu.';
  if (k === 'nosupport') return 'Peramban ini tidak bisa mencari wajah. Tandai sendiri.';
  if (k === 'fail') return 'Pencarian wajah gagal. Foto tidak berubah. Tandai sendiri.';
  return '';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2c2b1: Object.freeze({ cfg: STK_FACE, has: stkFaceHas, probeOk: stkFaceProbeOk, box: stkFaceBox, area: stkFaceArea, iou: stkFaceIou, norm: stkFaceNorm, plan: stkFacePlan, kind: stkFaceKind, msg: stkFaceMsg }) }));
/* ===== STK-2c2b1-end ===== */
/* ===== STK-2c2b2-begin (17 Nov 2026): Dapper > Kamera, bagian 2c-2b-2: TOMBOL "Cari wajah otomatis" di editor kabur. Tombol hanya tampil bila editor terbuka dan peramban punya FaceDetector (stkFaceHas). Ketuk: foto sementara dimuat ke kanvas, detektor diuji-coba pada kanvas kosong (NotSupportedError = tidak didukung: pesan jujur dan tombol disembunyikan), lalu dijalankan pada foto; hasilnya lewat stkFaceNorm (2c-2b-1) ditambahkan sebagai area kabur biasa (bisa dihapus/diurungkan/diterapkan seperti area manual). Foto TIDAK berubah di langkah ini. Selama mencari: kendali diganti "Mencari wajah...", Terapkan dan tarik jari dikunci; hasil basi (foto diganti/dibuang) dibuang. Tanpa AI, tanpa jaringan, tanpa penyimpanan, tidak ikut cadangan JSON. Kode lama tidak diubah (pembungkus stkBlurHtml, stkBlurReset, stkBlurSync, QACT.stkBlurApply). Membalik: hapus blok ini + CSS STK-2c2b2-css. ===== */
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-2c-2b dan STK-2d'); if (i >= 0) STK_SOON[i] = ['Privasi foto: kotak "Yang akan dikirim"', 'STK-2d']; })();
STKB.finding = false; STKB.faceNo = false;   // finding: sedang mencari wajah; faceNo: peramban terbukti tidak mendukung (tombol disembunyikan sampai halaman dimuat ulang)
function stkFaceHtml(base, o) {   // MURNI: html kendali dasar -> ditambah tombol Cari wajah otomatis (editor terbuka, didukung, belum terbukti tidak didukung) atau status "Mencari wajah..." ; o = { open, can, finding, no }
  o = o && typeof o === 'object' ? o : {};
  if (o.finding === true) return '<p class="nw-p stk-ph-msg" role="status" aria-live="polite">Mencari wajah...</p>';
  const h = String(base == null ? '' : base);
  if (o.open !== true || o.can !== true || o.no === true) return h;
  const A = '<div class="stk-bl-bt">', i = h.indexOf(A); if (i < 0) return h;
  return h.slice(0, i + A.length) + '<button type="button" class="stk-bl-b stk-bl-fc" data-q="stkFaceFind" data-fk="stk-bl-face">Cari wajah otomatis</button>' + h.slice(i + A.length);
}
async function stkFaceDetect(win, cv, blank) {   // detektor dibuat, diuji-coba pada kanvas kosong, lalu dijalankan; -> { kind: 'run' | 'nosupport' | 'fail', found[] }; tidak menyentuh DOM (kanvas diberikan pemanggil)
  let det;
  try { det = new win.FaceDetector({ fastMode: true, maxDetectedFaces: STK_FACE.maxIn }); } catch (e) { return { kind: stkFaceProbeOk(e) ? 'fail' : 'nosupport', found: [] }; }
  try { await det.detect(blank); } catch (e) { if (!stkFaceProbeOk(e)) return { kind: 'nosupport', found: [] }; }
  try { const f = await det.detect(cv); return { kind: 'run', found: Array.isArray(f) ? f : [] }; } catch (e) { return { kind: stkFaceProbeOk(e) ? 'fail' : 'nosupport', found: [] }; }
}
function stkFaceRun() {
  const plan = stkFacePlan({ st: STKP.st, hasUrl: !!STKP.url, busy: STKB.busy, finding: STKB.finding, can: stkFaceHas(window) && !STKB.faceNo });
  if (!plan.ok) { if (plan.why === 'nosupport' && STKP.st === 'shot') { STKB.msg = stkFaceMsg('nosupport'); stkBlurSync(); } return; }
  const url0 = STKP.url, job = STKB.job;   // job tidak dinaikkan: foto baru atau dibuang menaikkannya, hasil pencarian jadi basi
  const stale = () => STKB.job !== job || STKP.url !== url0 || STKP.st !== 'shot';
  const end = (k, r) => {
    if (stale()) return; STKB.finding = false; STKB.msg = stkFaceMsg(k, r); stkBlurSync();
    const el = document.querySelector('#stkBlurBox [data-fk="stk-bl-face"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (x) { /* abaikan */ } }
  };
  STKB.finding = true; STKB.msg = ''; STKB.drag = null; stkBlurSync();
  const img = new Image();
  img.onerror = () => end('fail');
  img.onload = async () => {
    if (stale()) return;
    const w = img.naturalWidth, h = img.naturalHeight; if (!stkApplyDims(w, h)) { end('fail'); return; }
    let r;
    try {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0);
      const bl = document.createElement('canvas'); bl.width = 32; bl.height = 32;
      r = await stkFaceDetect(window, cv, bl);
    } catch (e) { r = { kind: 'fail', found: [] }; }
    if (r.kind === 'nosupport') STKB.faceNo = true;
    if (stale()) return;
    if (r.kind !== 'run') { end(r.kind); return; }
    const cur = STKB.list.map(stkBlurNorm).filter(Boolean), n = stkFaceNorm(r.found, w, h, cur);   // daftar dibaca SAAT hasil datang
    STKB.list = cur.concat(n.areas); end(stkFaceKind(n), n);
  };
  img.src = url0;
}
QACT.stkFaceFind = () => { stkFaceRun(); };
{ const baseApFc = QACT.stkBlurApply; QACT.stkBlurApply = function () { if (STKB.finding) return; return baseApFc.apply(this, arguments); }; }   // Terapkan dikunci selama mencari
{ const baseResetFc = stkBlurReset; stkBlurReset = function () { baseResetFc.apply(this, arguments); STKB.finding = false; }; }   // foto baru atau dibuang: pencarian dibatalkan
{ const baseHtmlFc = stkBlurHtml; stkBlurHtml = function (o) { return stkFaceHtml(baseHtmlFc.apply(this, arguments), { open: o && o.open, can: stkFaceHas(window), finding: STKB.finding, no: STKB.faceNo }); }; }
{ const baseSyncFc = stkBlurSync; stkBlurSync = function () { baseSyncFc.apply(this, arguments); const ov = $('#stkOv'); if (ov) ov.classList.toggle('stk-ov-fd', STKB.finding === true); }; }   // tarik jari dikunci selama mencari
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2c2b2: Object.freeze({ html: stkFaceHtml, detect: stkFaceDetect, run: stkFaceRun, state: () => ({ finding: STKB.finding, no: STKB.faceNo, can: stkFaceHas(window) }) }) }));
/* ===== STK-2c2b2-end ===== */
/* ===== STK-2d1-begin (17 Nov 2026): Dapper > Kamera, bagian 2d-1: LOGIKA MURNI kotak "Yang akan dikirim" + pencatatan ukuran berkas foto (STKP.bytes). BELUM ada tampilan di layar dan BELUM ada tombol kirim. stkSendIn memetakan keadaan nyata (AI menyala, izin grup Foto, ukuran foto, jumlah area yang sudah dikaburkan) ke masukan stkSendPlan (2a); stkSendHtml mengubah rencana itu menjadi html kotak (semua teks lewat esc; tidak ada data foto di dalamnya, hanya ukuran); area yang ditandai tapi belum diterapkan diperingatkan jujur. Tanpa jaringan, penyimpanan, kamera. Perubahan kode lama: 2 sisipan `STKP.bytes = b.size` (stkPhShoot dan stkApplyRun). Membalik: hapus blok ini dan 2 sisipan itu. ===== */
STKP.bytes = 0;   // ukuran berkas foto sementara (byte); hanya di memori; bermakna bila STKP.url tidak kosong
function stkSendIn(s) {   // MURNI: keadaan -> masukan stkSendPlan. s = { ai, grup, hasUrl, w, h, bytes, done }; ai, grup, hasUrl dibaca ketat (=== true)
  s = s && typeof s === 'object' ? s : {};
  const has = s.hasUrl === true;
  return { ai: s.ai === true, grup: s.grup === true, w: has ? s.w : 0, h: has ? s.h : 0, bytes: has ? s.bytes : 0, n: has ? s.done : 0 };
}
function stkSendHtml(plan, o) {   // MURNI: rencana stkSendPlan -> html kotak "Yang akan dikirim"; tanpa foto atau rencana rusak -> ''; o = { pending } (jumlah area ditandai yang belum diterapkan)
  o = o && typeof o === 'object' ? o : {};
  if (!plan || typeof plan !== 'object' || plan.k === 'nofoto' || !Array.isArray(plan.lines) || !plan.lines.length) return '';
  const p = Number.isInteger(o.pending) && o.pending > 0 ? Math.min(o.pending, STK_BLUR.max) : 0, ok = plan.canSend === true;
  return '<section class="stk-sd' + (ok ? ' stk-sd-ok' : '') + '" aria-label="Yang akan dikirim"><h4 class="stk-t stk-sd-t">' + esc(plan.title) + '</h4><ul class="nw-list stk-sd-l">' + plan.lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' +
    (p ? '<p class="nw-p stk-sd-warn" role="status">' + p + ' area baru ditandai tapi belum diterapkan, jadi belum dikaburkan di foto ini.</p>' : '') +
    (plan.why ? '<p class="nw-fine stk-sd-why">' + esc(plan.why) + '</p>' : '') +
    '<p class="nw-fine">Kotak ini menunjukkan apa yang akan dikirim bila kamu mengetuk Kirim ke AI. Foto tidak dikirim sebelum kamu menyetujuinya dan mengetuk tombol itu.</p></section>';
}
function stkSendState() { return stkSendPlan(stkSendIn({ ai: adb.on, grup: aiOn('foto'), hasUrl: !!STKP.url, w: STKP.w, h: STKP.h, bytes: STKP.bytes, done: STKB.done })); }   // keadaan nyata aplikasi -> rencana
function stkSendBoxHtml() { return stkSendHtml(stkSendState(), { pending: STKB.list.length }); }   // html kotak dari keadaan nyata (dipakai tampilan di STK-2d-2)
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2d1: Object.freeze({ inn: stkSendIn, html: stkSendHtml, plan: stkSendState, box: stkSendBoxHtml, bytes: () => STKP.bytes }) }));
/* ===== STK-2d1-end ===== */
/* ===== STK-2d2-begin (17 Nov 2026): Dapper > Kamera, bagian 2d-2: TAMPILAN kotak "Yang akan dikirim" di kartu hasil foto. stkSendSync memasang/memperbarui #stkSendBox tepat di bawah kotak kendali kabur (#stkBlurBox) memakai html dari stkSendBoxHtml (2d-1); dipanggil lewat pembungkus stkBlurSync (tiap kartu hasil digambar ulang, area ditandai/dihapus, Terapkan kabur, foto dibuang/diganti) dan pembungkus QACT.aiSet (Pengaturan AI berubah). Idempoten, tanpa jaringan/penyimpanan/kamera/tombol; foto tidak dikirim ke mana pun. Butir "Menyusul" untuk kotak ini dihapus. Membalik: hapus blok ini dan CSS STK-2d2. ===== */
function stkSendSync() {   // memasang/memperbarui/membuang kotak; idempoten
  const box = $('#stkPhBox'); if (!box) return;
  let el = box.querySelector('#stkSendBox');
  const html = (STKP.st === 'shot' && !!STKP.url) ? stkSendBoxHtml() : '';
  if (!html) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div'); el.id = 'stkSendBox'; el.className = 'stk-sdbox';
    const anchor = box.querySelector('#stkBlurBox') || box.querySelector('figure.stk-res'); if (!anchor) return;
    anchor.after(el);
  }
  if (el.dataset.h === html) return;
  el.dataset.h = html; el.innerHTML = html;
}
{ const baseBlurSync = stkBlurSync; stkBlurSync = function () { baseBlurSync.apply(this, arguments); stkSendSync(); }; }   // setiap sinkron editor kabur ikut menyinkronkan kotak
{ const baseAiSet = QACT.aiSet; QACT.aiSet = function () { const r = baseAiSet.apply(this, arguments); try { stkSendSync(); } catch (x) { /* abaikan: kartu Kamera tidak terbuka */ } return r; }; }   // Pengaturan AI berubah: kotak ikut
(() => { const i = STK_SOON.findIndex(x => x[1] === 'STK-2d'); if (i >= 0) STK_SOON.splice(i, 1); })();   // butir yang kini selesai
window.DL = Object.freeze(Object.assign({}, window.DL, { stk2d2: Object.freeze({ sync: stkSendSync }) }));
