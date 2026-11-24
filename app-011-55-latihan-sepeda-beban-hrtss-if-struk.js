/* ===== MODUL 55: Latihan > Sepeda > beban (hrTSS, IF), struktur sesi, pemulihan, tes LTHR, cadence, karbo ===== */
// Tanpa power meter: hrTSS = jam x IF^2 x 100, IF = HR rata-rata / LTHR (dibatasi 1,3). LTHR = tes terbaru, jika tak ada 90% HRmax (perkiraan). Hanya ride dengan HR rata-rata dan durasi.
const B55_ZP = { 1: [0, 84], 2: [85, 89], 3: [90, 94], 4: [95, 99], 5: [100, 106] };
const B55_RC = [['s', 'Tidur', 'buruk', 'baik'], ['t', 'Stres', 'rendah', 'tinggi'], ['n', 'Nyeri otot', 'tidak', 'berat']];
const b55n = x => (x == null || x === '') ? null : Number(String(x).replace(',', '.'));
function b55Lthr() {
  let best = null;
  Object.keys(tdb).forEach(d => (tdb[d].lh || []).forEach(x => { if (!best || d > best.d || (d === best.d && x.t > best.t)) best = { d, b: x.b, t: x.t }; }));
  if (best) return { b: best.b, d: best.d, src: 'tes' };
  const h = hrInfo(); return h.st === 'ok' ? { b: Math.round(h.max * 0.9), d: null, src: 'perkiraan' } : null;
}
const b55If = (r, L) => (L && r.hr && r.min) ? Math.min(r.hr / L.b, 1.3) : null;
const b55Tss = (r, L) => { const i = b55If(r, L); return i == null ? null : r.min / 60 * i * i * 100; };
function b55Week(ws, L) {
  const o = { tss: 0, n: 0, cs: 0, cw: 0, el: 0, rides: 0 };
  for (let i = 0; i < 7; i++) (bzRides(addDays(ws, i))).forEach(r => {
    o.rides++; const t = b55Tss(r, L); if (t != null) { o.tss += t; o.n++; }
    if (r.cd) { o.cs += r.cd * (r.min || 1); o.cw += (r.min || 1); }
    if (r.el) o.el += r.el;
  });
  o.cd = o.cw ? o.cs / o.cw : null; return o;
}
function bk55Parts(r) {
  const p = [], L = b55Lthr(), i = b55If(r, L), t = b55Tss(r, L);
  if (i != null) p.push('IF ' + fmt(i, 2) + ', TSS ' + fmt(t, 0));
  if (r.cd) p.push('cadence ' + r.cd + ' rpm');
  if (r.cb != null) p.push('karbo ' + r.cb + ' g' + (r.min >= 60 ? ' (' + fmt(r.cb / (r.min / 60), 0) + ' g/jam)' : ''));
  return p;
}
function bk55Cols() {
  const o = {};
  for (const [k, hi, lbl] of [['cd', 200, 'Cadence'], ['cb', 500, 'Karbohidrat']]) {
    const raw = String(rideForm[k] == null ? '' : rideForm[k]).trim(); if (!raw) continue;
    if (!/^\d{1,3}$/.test(raw) || +raw > hi || (k === 'cd' && +raw < 30)) return { err: lbl + ' harus bilangan bulat ' + (k === 'cd' ? '30–200 rpm' : '0–500 g') + ', atau kosongkan.' };
    o[k] = +raw;
  }
  return { o };
}
function bk55FormHTML() {
  const f = rideForm, inp = (k, l, u) => '<div><div class="sublbl t0">' + l + '</div><label class="inp"><input data-rf="' + k + '" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="' + l + ', ' + u + '" value="' + esc(f[k]) + '"><span class="u">' + u + '</span></label></div>';
  return '<div class="sublbl" style="margin-top:12px">Cadence dan karbohidrat (opsional)</div><div class="pair rg">' + inp('cd', 'Cadence rata-rata', 'rpm') + inp('cb', 'Karbohidrat', 'g') + '</div>';
}
function b55Zone(z, mx) {   // 'Zone 3–4' -> teks bpm + cadence saran
  const n = (String(z).match(/\d/g) || []).map(Number), lo = Math.min(...n), hi = Math.max(...n);
  const bpm = mx ? hrAt(mx, HR_PCT[lo][0]) + '–' + hrAt(mx, HR_PCT[hi][1]) + ' bpm' : null;
  return [z, bpm, hi >= 5 ? '90–100 rpm' : '85–95 rpm'].filter(Boolean).join(' · ');
}
function b55StructHTML() {
  const type = curBk(), st = bikeSteps(type, curMins(type)), h = hrInfo(), mx = h.st === 'ok' ? h.max : null;
  const tot = Math.round(st.reduce((a, x) => a + x.s, 0) / 60);
  const zc = z => { const hi = Math.max(...(String(z).match(/\d/g) || [1]).map(Number)); return hi >= 5 ? 'z5' : hi >= 3 ? 'z34' : hi === 2 ? 'z2' : 'z1'; };
  return '<p class="note">' + st.length + ' segmen, total ' + tot + ' menit. Warna mengikuti intensitas zona.</p><div class="b55gs">' +
    st.map(x => '<div class="b55g ' + zc(x.z) + '"><div><b>' + esc(x.n) + '</b><small>' + esc(b55Zone(x.z, mx)) + '</small></div><span class="b55d">' + fmt(x.s / 60, x.s % 60 ? 1 : 0) + ' mnt</span></div>').join('') + '</div>' +
    '<p class="note">Cadence adalah saran umum. ' + (mx ? '' : 'Isi usia di Peta untuk melihat target bpm. ') + 'Uji bicara dan RPE tetap penentu.</p>';
}
function b55LoadHTML() {
  const L = b55Lthr(), ws = thisWeek(), w = b55Week(ws, L), p = [1, 2, 3].map(k => b55Week(addDays(ws, -7 * k), L)), pv = p[0], av = (p[0].tss + p[1].tss + p[2].tss) / 3;
  if (!L) return '<p class="note">Isi usia di profil atau catat tes LTHR agar TSS bisa dihitung.</p>';
  const lv = !w.n ? null : !av ? ['Belum ada pembanding', ''] : w.tss / av > 1.3 ? ['Naik cepat', 'bad'] : w.tss / av < 0.8 ? ['Ringan', ''] : ['Pas', 'ok'];
  const cell = (v, l) => '<div><b>' + v + '</b><small>' + l + '</small></div>';
  return '<div class="b55m">' + cell(w.n ? fmt(w.tss, 0) : '–', 'TSS pekan ini') + cell(pv.n ? fmt(pv.tss, 0) : '–', 'TSS pekan lalu') + cell(w.cd ? fmt(w.cd, 0) : '–', 'cadence rpm') + cell(w.el ? fmt(w.el, 0) : '–', 'naik (m)') + '</div>' +
    (lv ? '<span class="b55st ' + lv[1] + '">' + lv[0] + (av ? ' · rata-rata 3 pekan ' + fmt(av, 0) : '') + '</span>' : '') +
    '<p class="note">hrTSS = jam × IF² × 100; IF = HR rata-rata ÷ LTHR (' + L.b + ' bpm, ' + L.src + '). Perkiraan, bukan angka power. Kenaikan beban pekanan di atas sekitar 30% dari rata-rata patut diwaspadai. Cadence efisien umumnya 85–95 rpm.</p>';
}
function b55Rec() { const t = tdb[today()]; return (t && t.rc) || {}; }
function b55Status() {
  const r = b55Rec(), n = Object.keys(r).length; if (!n) return ['Belum diisi hari ini', '', 'Isi tiga skala di bawah, cukup ketuk.'];
  const f = (r.s != null && r.s <= 2) + (r.t != null && r.t >= 4) + (r.n != null && r.n >= 4);
  return f === 0 ? ['Siap latihan', 'ok', 'Tidak ada tanda kelelahan pada isian hari ini.'] : f === 1 ? ['Waspada', '', 'Satu tanda lelah: turunkan intensitas atau pilih Zone 2.'] : ['Pulih dulu', 'bad', 'Beberapa tanda lelah: istirahat atau Zone 1 saja. Nyeri tajam, bengkak, atau pusing: temui tenaga kesehatan.'];
}
function b55RecHTML() {
  const r = b55Rec(), s = b55Status();
  return '<span class="b55st ' + s[1] + '">' + s[0] + '</span><p class="note">' + esc(s[2]) + '</p>' + B55_RC.map(x => '<div class="sublbl t0" style="margin-top:10px">' + x[1] + ' (1 = ' + x[2] + ', 5 = ' + x[3] + ')</div><div class="rpe" role="group" aria-label="' + x[1] + '">' +
    [1, 2, 3, 4, 5].map(v => '<button class="pill" data-q="b55rc" data-k="' + x[0] + '" data-v="' + v + '" aria-pressed="' + (r[x[0]] === v) + '">' + v + '</button>').join('') + '</div>').join('');
}
function b55LthrHTML() {
  const L = b55Lthr(), tests = []; Object.keys(tdb).sort().reverse().forEach(d => (tdb[d].lh || []).slice().reverse().forEach(x => tests.push({ d, b: x.b })));
  const zr = L ? Object.keys(B55_ZP).map(z => '<div class="b55r"><b>Zone ' + z + '</b><span class="b55d">' + (z === '1' ? '< ' + Math.round(L.b * .85) : Math.round(L.b * B55_ZP[z][0] / 100) + '–' + (z === '5' ? '' : Math.round(L.b * B55_ZP[z][1] / 100))) + ' bpm</span></div>').join('') : '';
  return '<p class="note">LTHR dipakai untuk IF dan TSS. Tes: gowes stabil 30 menit sekuat mungkin sendirian; HR rata-rata 20 menit terakhir = LTHR. Ulangi tiap 6–8 pekan. Tes FTP (daya) ada di kartu Zona latihan.</p>' +
    (L ? '<p class="note"><b>LTHR sekarang: ' + L.b + ' bpm</b> (' + L.src + (L.d ? ', ' + esc(dayShort(L.d)) : '') + ')</p>' + zr : '') +
    '<div class="sublbl">Catat hasil tes</div><label class="inp"><input data-rf="lhv" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="LTHR hasil tes, bpm" value="' + esc(rideForm.lhv) + '"><span class="u">bpm</span></label>' +
    '<button class="btn primary wide" style="margin-top:10px" data-q="b55lh">Simpan tes LTHR</button>' +
    (tests.length ? '<div style="margin-top:8px">' + tests.slice(0, 3).map(x => '<div class="b55r"><span>' + esc(dayShort(x.d)) + '</span><span class="b55d">' + x.b + ' bpm</span></div>').join('') + '</div>' : '');
}
function bk55Cards() {
  try {
    const L = b55Lthr(), w = b55Week(thisWeek(), L), s = b55Status();
    return bzCardHTML('b55l', 'Beban latihan', w.n ? 'TSS pekan ini ' + fmt(w.tss, 0) + ' · ' + w.n + ' ride' : 'TSS, IF, cadence, elevasi', b55LoadHTML()) +
      bzCardHTML('b55r', 'Pemulihan', s[0], b55RecHTML()) +
      bzCardHTML('b55h', 'Tes LTHR', L ? 'LTHR ' + L.b + ' bpm (' + L.src + ')' : 'Kalibrasi zona', b55LthrHTML());
  } catch (x) { B55_ERR = String((x && x.message) || x); return ''; }
}
let B55_ERR = '';
QACT.b55rc = el => {
  const k = el.dataset.k, v = +el.dataset.v, d = today(), t = tdb[d] || (tdb[d] = tblank()), rc = Object.assign({}, t.rc || {});
  if (!['s', 't', 'n'].includes(k) || !(v >= 1 && v <= 5)) return;
  if (rc[k] === v) delete rc[k]; else rc[k] = v;
  if (Object.keys(rc).length) t.rc = rc; else delete t.rc;
  t.updated = Date.now(); queueSave('t'); renderTrain();
};
QACT.b55lh = () => {
  const raw = String(rideForm.lhv || '').trim();
  if (!/^\d{2,3}$/.test(raw) || +raw < 80 || +raw > 220) { toast('LTHR harus bilangan bulat 80–220 bpm'); return; }
  const d = today(), t = tdb[d] || (tdb[d] = tblank());
  t.lh = (t.lh || []).concat([{ id: 'h' + Date.now().toString(36), b: +raw, t: Date.now() }]).slice(-5);
  t.updated = Date.now(); queueSave('t'); rideForm.lhv = ''; toast('Tes LTHR tersimpan'); renderTrain();
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b55: Object.freeze({ lthr: b55Lthr, tss: b55Tss, week: b55Week, status: b55Status, err: () => B55_ERR, wk: () => { const w = b55Week(thisWeek(), b55Lthr()); return { tss: Math.round(w.tss), n: w.n, cd: w.cd, el: w.el }; }, day: d => JSON.parse(JSON.stringify(tdb[d || today()] || null)) }) }));

/* ===== MODUL 56: Sepeda > layar sesi berjalan: target bpm/cadence per segmen + jarak dan rute GPS (opsional) ===== */
// GPS hanya bila ditekan (izin lokasi). Titik < 30 m akurasi, geser >= 5 m, lompatan > 25 m/s dibuang. Rute hanya di memori selama sesi (tidak disimpan, tidak dikirim ke AI); jarak mengisi form ride.
const b56Hav = (a, b) => { const R = 6371, r = Math.PI / 180, dl = (b[0] - a[0]) * r, dn = (b[1] - a[1]) * r, h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
function b56Svg(P) {
  if (!P.length) return '';
  const W = 300, H = 150, pd = 14, st = Math.max(1, Math.ceil(P.length / 300)), Q = P.filter((p, i) => i % st === 0 || i === P.length - 1), k = Math.cos(P[0][0] * Math.PI / 180);
  const la = Q.map(p => p[0]), lo = Q.map(p => p[1] * k), x0 = Math.min(...lo), y1 = Math.max(...la), sx = Math.max(Math.max(...lo) - x0, 1e-5), sy = Math.max(y1 - Math.min(...la), 1e-5), sc = Math.min((W - 2 * pd) / sx, (H - 2 * pd) / sy);
  const ox = (W - sx * sc) / 2, oy = (H - sy * sc) / 2, pt = p => [(ox + (p[1] * k - x0) * sc).toFixed(1), (oy + (y1 - p[0]) * sc).toFixed(1)], A = Q.map(pt), s = A[0], e = A[A.length - 1];
  return '<svg viewBox="0 0 300 150" aria-hidden="true">' + (A.length > 1 ? '<polyline points="' + A.map(a => a.join(',')).join(' ') + '" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
    '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="5" fill="var(--ok)"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="5" fill="var(--teal)" stroke="var(--raise)" stroke-width="2"/></svg>';
}
/* b59-js-begin (tahap 59a) */
// Peta dasar = ubin raster (bawaan OpenStreetMap) di belakang garis rute. Yang dikirim ke penyedia: nomor ubin (area kira-kira) + alamat IP; rute TIDAK dikirim dan tetap tidak disimpan.
const B59K = 'dailylog:map59:v1', B59NS = 'http://www.w3.org/2000/svg', B59DEF = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
let B59C = null;
function b59Url(u) { u = String(u || '').trim(); return u.length <= 300 && /^https:\/\/[^\s"'<>]+$/.test(u) && /\{z\}/.test(u) && /\{x\}/.test(u) && /\{y\}/.test(u) ? u : ''; }
function b59Cfg() {
  if (B59C) return B59C;
  let o = {}; try { if (store.mode === 'local') o = JSON.parse(localStorage.getItem(B59K) || '{}') || {}; } catch (x) { o = {}; }
  B59C = { on: o.on !== false, url: b59Url(o.url) }; return B59C;
}
function b59Save() { try { if (store.mode === 'local') localStorage.setItem(B59K, JSON.stringify(B59C)); } catch (x) { /* abaikan */ } }
const b59Mer = p => { const s = Math.sin(Math.max(-85, Math.min(85, p[0])) * Math.PI / 180); return [(p[1] + 180) / 360, 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)]; };
function b59Tiles(Q, W, H, V) {   // Q = [[lat,lon],...] -> tampilan W x H px (bawaan 300x150; Mercator) + daftar ubin; V = {cx,cy,sc} bila peta digeser/di-zoom manual (tahap 60a)
  W = W || 300; H = H || 150;
  const pd = 18, M = Q.map(b59Mer), xs = M.map(m => m[0]), ys = M.map(m => m[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const f = V || { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, sc: Math.min((W - 2 * pd) / Math.max(x1 - x0, 1.5e-5), (H - 2 * pd) / Math.max(y1 - y0, 1.5e-5)) }, sc = f.sc;
  const vx = f.cx - W / 2 / sc, vy = f.cy - H / 2 / sc;
  const z = Math.max(3, Math.min(18, Math.round(Math.log2(sc / 128)))), n = Math.pow(2, z), ts = sc / n, T = [];
  for (let ty = Math.max(0, Math.floor(vy * n)); ty <= Math.min(n - 1, Math.floor((vy + H / sc) * n)); ty++)
    for (let tx = Math.floor(vx * n); tx <= Math.floor((vx + W / sc) * n); tx++) T.push({ z, x: ((tx % n) + n) % n, y: ty, px: (tx / n - vx) * sc, py: (ty / n - vy) * sc, ts });
  return { pts: M.map(m => [(m[0] - vx) * sc, (m[1] - vy) * sc]), T, z, v: { cx: f.cx, cy: f.cy, sc } };
}
/* tahap 60a: tampilan peta (pusat cx,cy dalam koordinat dunia 0..1 dan skala sc px/dunia) disimpan di objek GPS sesi (g.v60); null = otomatis pas ke rute */
const B60MIN = 1024, B60MAX = 67108864, B60 = { P: new Map(), g: null, w: null };
const b60G = () => (BK.run && BK.run.gps) || null, b60S = w => w._S || null, b60Sz = w => [w.clientWidth || 300, w.clientHeight || 150];
const b60Cl = v => ({ cx: Math.max(0, Math.min(1, v.cx)), cy: Math.max(0, Math.min(1, v.cy)), sc: Math.max(B60MIN, Math.min(B60MAX, v.sc)) });
function b60Cur(w) { const g = b60S(w); return (g && g.v60) || b59Tiles(w._Q, ...b60Sz(w)).v; }
function b60Set(w, v) { const g = b60S(w); if (!g) return; g.v60 = b60Cl(v); b60Paint(w); }
function b60Zoom(w, k, ax, ay) {   // k = faktor zoom; (ax, ay) = titik px yang tetap di tempatnya (bawaan: tengah)
  const [W, H] = b60Sz(w), v = b60Cur(w); ax = ax == null ? W / 2 : ax; ay = ay == null ? H / 2 : ay;
  const sc = Math.max(B60MIN, Math.min(B60MAX, v.sc * k)), wx = v.cx + (ax - W / 2) / v.sc, wy = v.cy + (ay - H / 2) / v.sc;
  b60Set(w, { cx: wx - (ax - W / 2) / sc, cy: wy - (ay - H / 2) / sc, sc });
}
function b60Paint(w) {
  const Q = w._Q; if (!Q || w.dataset.m !== '1') return;
  const g = b60S(w), V = b59Tiles(Q, ...b60Sz(w), g && g.v60), tpl = b59Cfg().url || B59DEF, gr = w.querySelector('.b59bg g'), keep = new Set(), a = V.pts[0], e = V.pts[V.pts.length - 1], pl = V.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  w.querySelector('.b59c').setAttribute('points', pl); w.querySelector('.b59l').setAttribute('points', pl);
  [['.b59s', a], ['.b59e', e]].forEach(([q, p]) => { const c = w.querySelector(q); c.setAttribute('cx', p[0].toFixed(1)); c.setAttribute('cy', p[1].toFixed(1)); });
  V.T.slice(0, 40).forEach(t => {
    const k = t.z + '/' + t.x + '/' + t.y; keep.add(k);
    let im = w._t.get(k);
    if (!im) {
      im = document.createElementNS(B59NS, 'image'); im.setAttribute('preserveAspectRatio', 'none');
      im.addEventListener('load', () => { im.classList.add('ld'); w._ok++; const m = w.querySelector('.b59x'); if (m) m.remove(); });
      im.addEventListener('error', () => { w._bad++; if (w._bad >= 3 && !w._ok && !w.querySelector('.b59x')) { const d = document.createElement('div'); d.className = 'b59x'; d.setAttribute('role', 'status'); d.textContent = 'Peta dasar tidak bisa dimuat (internet atau penyedia peta menolak). Garis rute tetap tampil.'; w.appendChild(d); } });
      im.setAttribute('href', tpl.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y).replace('{s}', 'a')); gr.appendChild(im); w._t.set(k, im);
    }
    im.setAttribute('x', t.px.toFixed(2)); im.setAttribute('y', t.py.toFixed(2)); im.setAttribute('width', (t.ts + 0.6).toFixed(2)); im.setAttribute('height', (t.ts + 0.6).toFixed(2));
  });
  w._t.forEach((im, k) => { if (!keep.has(k)) { im.remove(); w._t.delete(k); } });
  const f = w.querySelector('.b60f'); if (f) f.hidden = !(g && g.v60);
}
function b59Render(w, P) {
  const st = Math.max(1, Math.ceil(P.length / 300)), Q = P.filter((p, i) => i % st === 0 || i === P.length - 1);
  w._Q = Q;
  if (w.dataset.m !== '1') {
    w.className = 'b56map b59'; w.dataset.m = '1'; w._t = new Map(); w._ok = 0; w._bad = 0; w.setAttribute('role', 'group'); w.setAttribute('tabindex', '0'); w.setAttribute('aria-label', 'Peta rute. Seret untuk menggeser, cubit atau tombol plus dan minus untuk zoom, panah dan tanda plus minus di papan ketik.');
    w.innerHTML = '<svg class="b59bg" aria-hidden="true"><g></g></svg><svg aria-hidden="true"><polyline class="b59c" fill="none" stroke="var(--raise)" stroke-opacity=".9" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><polyline class="b59l" fill="none" stroke="var(--teal)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle class="b59s" r="5" fill="var(--ok)" stroke="var(--raise)" stroke-width="2"/><circle class="b59e" r="5" fill="var(--teal)" stroke="var(--raise)" stroke-width="2"/></svg><div class="b59a">© OpenStreetMap</div>' +
      '<div class="b60b"><button type="button" class="b60k" data-b60="in" aria-label="Perbesar peta">+</button><button type="button" class="b60k" data-b60="out" aria-label="Perkecil peta">−</button><button type="button" class="b60k b60f" data-b60="fit" aria-label="Pas ke seluruh rute" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div>';
  }
  b60Paint(w);
}
function b59Draw(pts) {
  const w = $('#b56mapw'); if (!w) return;
  const key = pts.length + '|' + (b59Cfg().on ? 1 : 0) + '|' + b59Cfg().url; if (w.dataset.n === key) return; w.dataset.n = key;
  if (!pts.length) { w.innerHTML = ''; w.dataset.m = ''; w.className = 'b56map'; w._Q = null; return; }
  if (b59Cfg().on) { w._S = b60G(); b59Render(w, pts); return; }
  w.dataset.m = ''; w.className = 'b56map'; w._Q = null; w.setAttribute('role', 'img'); w.removeAttribute('tabindex'); w.setAttribute('aria-label', 'Rute yang dilewati'); w.innerHTML = b56Svg(pts);
}
/* tahap 60a: gerakan (seret = geser, dua jari = cubit zoom, roda mouse, ketuk dua kali, tombol, papan ketik) */
const b60Map = ev => { const w = ev.target && ev.target.closest && ev.target.closest('.b56map.b59'); return w && w._Q ? w : null; };
const b60Pos = (w, ev) => { const r = w.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
function b60Snap(w) {   // awal gerakan baru dari titik yang sedang menekan
  const a = [...B60.P.values()], v = b60Cur(w);
  B60.g = a.length >= 2 ? { v, m: [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2], d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1, on: true } : a.length ? { v, m: a[0], on: false } : null;
}
document.addEventListener('pointerdown', ev => {
  const w = b60Map(ev); if (!w || ev.target.closest('.b60b') || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
  if (B60.w !== w) { B60.P.clear(); B60.w = w; }
  B60.P.set(ev.pointerId, b60Pos(w, ev)); try { w.setPointerCapture(ev.pointerId); } catch (x) { /* abaikan */ }
  b60Snap(w); w.classList.add('b60g');
});
document.addEventListener('pointermove', ev => {
  const w = B60.w, g = B60.g; if (!w || !g || !B60.P.has(ev.pointerId) || !w._Q) return;
  B60.P.set(ev.pointerId, b60Pos(w, ev));
  const a = [...B60.P.values()], [W, H] = b60Sz(w);
  if (a.length >= 2) {
    const m = [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1, sc = Math.max(B60MIN, Math.min(B60MAX, g.v.sc * d / g.d));
    const wx = g.v.cx + (g.m[0] - W / 2) / g.v.sc, wy = g.v.cy + (g.m[1] - H / 2) / g.v.sc;
    b60Set(w, { cx: wx - (m[0] - W / 2) / sc, cy: wy - (m[1] - H / 2) / sc, sc });
  } else {
    const p = a[0]; if (!g.on && Math.hypot(p[0] - g.m[0], p[1] - g.m[1]) < 4) return;   // ketukan biasa tidak menggeser
    g.on = true; b60Set(w, { cx: g.v.cx - (p[0] - g.m[0]) / g.v.sc, cy: g.v.cy - (p[1] - g.m[1]) / g.v.sc, sc: g.v.sc });
  }
  ev.preventDefault();
});
const b60Up = ev => { if (!B60.P.delete(ev.pointerId)) return; const w = B60.w; if (w) { try { w.releasePointerCapture(ev.pointerId); } catch (x) { /* abaikan */ } b60Snap(w); if (!B60.P.size) w.classList.remove('b60g'); } };
document.addEventListener('pointerup', b60Up); document.addEventListener('pointercancel', b60Up);
document.addEventListener('wheel', ev => {
  const w = b60Map(ev); if (!w) return; ev.preventDefault();
  const p = b60Pos(w, ev); b60Zoom(w, Math.pow(2, -Math.max(-120, Math.min(120, ev.deltaY)) / 240), p[0], p[1]);
}, { passive: false });
document.addEventListener('dblclick', ev => { const w = b60Map(ev); if (!w || ev.target.closest('.b60b')) return; const p = b60Pos(w, ev); b60Zoom(w, 2, p[0], p[1]); });
document.addEventListener('click', ev => {
  const b = ev.target && ev.target.closest && ev.target.closest('[data-b60]'), w = b && b60Map(ev); if (!w) return;
  const k = b.dataset.b60, g = b60S(w);
  if (k === 'in') b60Zoom(w, 2); else if (k === 'out') b60Zoom(w, 0.5); else if (g) { g.v60 = null; b60Paint(w); }
});
document.addEventListener('keydown', ev => {
  const w = ev.target; if (!w || !w.classList || !w.classList.contains('b59') || !w._Q || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const [W, H] = b60Sz(w), v = b60Cur(w), d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
  if (d) b60Set(w, { cx: v.cx + d[0] * W / 4 / v.sc, cy: v.cy + d[1] * H / 4 / v.sc, sc: v.sc });
  else if (ev.key === '+' || ev.key === '=') b60Zoom(w, 2); else if (ev.key === '-') b60Zoom(w, 0.5); else return;
  ev.preventDefault();
});
window.addEventListener('resize', () => { const w = $('#b56mapw'); if (w && w._Q) b60Paint(w); });
window.DL = Object.freeze(Object.assign({}, window.DL, { b60: Object.freeze({ view: () => { const g = b60G(); return g && g.v60 ? Object.assign({}, g.v60) : null; }, cur: () => { const w = $('#b56mapw'); return w && w._Q ? b60Cur(w) : null; }, zoom: k => { const w = $('#b56mapw'); if (w && w._Q) b60Zoom(w, k); }, lim: () => [B60MIN, B60MAX] }) }));
/* b61-js-begin (tahap 61a: rute ride disimpan di riwayat ride) */
// Rute sesi disederhanakan (Douglas-Peucker, <= 400 titik), disandikan sebagai teks polyline (1e-5 derajat, sekitar 1 m) dan disimpan di kolom opsional rt pada ride.
// Ikut data ride (ikut ekspor/impor JSON); TIDAK dikirim ke AI (pembangun konteks AI memakai kolom bernama saja). Hanya ride dari timer+GPS yang punya rute.
let RT61 = null, RT61O = null; const B61V = {};
function b61Simp(P, tol) {
  const n = P.length; if (n < 3) return P.slice();
  const k = Math.cos(P[0][0] * Math.PI / 180), X = P.map(p => [p[1] * k * 111320, p[0] * 110540]), keep = new Uint8Array(n), st = [[0, n - 1]]; keep[0] = keep[n - 1] = 1;
  while (st.length) {
    const [a, b] = st.pop(); let m = -1, dm = 0; const dx = X[b][0] - X[a][0], dy = X[b][1] - X[a][1], L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) { const d = L ? Math.abs(dy * (X[i][0] - X[a][0]) - dx * (X[i][1] - X[a][1])) / L : Math.hypot(X[i][0] - X[a][0], X[i][1] - X[a][1]); if (d > dm) { dm = d; m = i; } }
    if (m > 0 && dm > tol) { keep[m] = 1; st.push([a, m], [m, b]); }
  }
  return P.filter((p, i) => keep[i]);
}
function b61Enc(P) {
  let tol = 3, Q = b61Simp(P, tol); while (Q.length > 400 && tol < 500) { tol *= 1.5; Q = b61Simp(P, tol); }
  const e = v => { v = v < 0 ? ~(v << 1) : v << 1; let o = ''; while (v >= 32) { o += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } return o + String.fromCharCode(v + 63); };
  let s = '', pa = 0, po = 0; Q.forEach(p => { const a = Math.round(p[0] * 1e5), o = Math.round(p[1] * 1e5); s += e(a - pa) + e(o - po); pa = a; po = o; }); return s;
}
function b61Dec(s) {
  const o = []; let i = 0, a = 0, l = 0;
  const rd = () => { let r = 0, sh = 0, b; do { if (i >= s.length) return null; b = s.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && sh < 30); return (r & 1) ? ~(r >> 1) : r >> 1; };
  while (i < s.length) { const x = rd(), y = rd(); if (x == null || y == null) return null; a += x; l += y; if (Math.abs(a) > 9000000 || Math.abs(l) > 18000000) return null; o.push([a / 1e5, l / 1e5]); }
  return o;
}
function b61Ok(s) { if (typeof s !== 'string' || s.length > 6000 || !/^[?-~]+$/.test(s)) return false; const d = b61Dec(s); return !!d && d.length >= 2 && d.length <= 600; }
function b61Show(w, id) {
  let r = null; Object.keys(tdb).some(d => (tdb[d].rides || []).some(x => x.id === id && (r = x))); if (!r || !r.rt) return;
  const P = b61Dec(r.rt); if (!P) return;
  w._S = B61V[id] || (B61V[id] = {});
  if (b59Cfg().on) { w.dataset.m = ''; b59Render(w, P); } else { w.className = 'b56map'; w.innerHTML = b56Svg(P); }
}
function b61After() { const w = $('#b61map'); if (w) b61Show(w, w.dataset.id); }
const b61Btn = r => r.rt ? '<button class="btn sm ghost" data-q="b61Rt" data-id="' + esc(r.id) + '" aria-expanded="' + (RT61O === r.id) + '">Rute</button>' : '';
function b61Map(d, r) {
  if (!r.rt || RT61O !== r.id) return '';
  const armed = delArm === 'rt' + r.id;
  return '<div class="b61m"><div class="b56map" id="b61map" data-id="' + esc(r.id) + '" role="group" aria-label="Rute ride tersimpan"></div><button class="btn sm ' + (armed ? 'danger' : 'ghost') + '" data-q="b61RtDel" data-d="' + d + '" data-id="' + esc(r.id) + '">' + (armed ? 'Yakin hapus rute?' : 'Hapus rute saja') + '</button></div>';
}
function b61Form() {
  if (!RT61 || svSt.info) return '';
  return '<label class="b59sw"><input type="checkbox" data-b61="keep"' + (RT61.keep ? ' checked' : '') + '> Simpan rute GPS sesi ini di ride</label><p class="note">Rute memuat tempat Anda bersepeda, termasuk titik awal dan akhir (bisa rumah). Disimpan bersama data ride (ikut ekspor JSON), tidak dikirim ke AI. Bisa dihapus per ride dari daftar Ride terakhir.</p>';
}
QACT.b61Rt = el => { RT61O = RT61O === el.dataset.id ? null : el.dataset.id; renderTrain(); };
QACT.b61RtDel = el => {
  const id = el.dataset.id, d = el.dataset.d, k = 'rt' + id;
  if (delArm !== k) { delArm = k; renderTrain(); setTimeout(() => { if (delArm === k) { delArm = null; if (curView === 'train') renderTrain(); } }, 3500); return; }
  delArm = null; const t = tdb[d], r = t && (t.rides || []).find(x => x.id === id);
  if (r) { delete r.rt; t.updated = Date.now(); queueSave('t'); }
  RT61O = null; delete B61V[id]; toast('Rute dihapus dari ride ini'); renderTrain();
};
document.addEventListener('change', ev => { const el = ev.target && ev.target.closest && ev.target.closest('[data-b61]'); if (el && RT61) RT61.keep = !!el.checked; });
window.DL = Object.freeze(Object.assign({}, window.DL, { b61: Object.freeze({ enc: b61Enc, dec: b61Dec, ok: b61Ok, pending: () => RT61 ? { km: RT61.km, keep: RT61.keep, n: b61Dec(RT61.s).length } : null }) }));
/* b61-js-end */
function b59Ctl() {
  const c = b59Cfg();
  return '<div class="b59c2"><label class="b59sw"><input type="checkbox" data-b59="on"' + (c.on ? ' checked' : '') + '> Peta dasar di belakang rute</label>' +
    '<details class="b59d"><summary>Pengaturan peta</summary><p class="note">Peta dimuat dari internet. Seret peta untuk menggeser; cubit, roda mouse, ketuk dua kali, atau tombol + dan − untuk zoom. Penyedia peta melihat nomor ubin (area kira-kira tempat Anda berada) dan alamat IP; rute tidak dikirim dan tidak disimpan. Peta © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">kontributor OpenStreetMap</a>.</p>' +
    '<label class="note">URL ubin sendiri (opsional, https, memuat {z} {x} {y}; kosong = OpenStreetMap)<input class="txt" data-b59="url" inputmode="url" autocomplete="off" value="' + esc(c.url) + '" placeholder="https://.../{z}/{x}/{y}.png"></label></details></div>';
}
document.addEventListener('change', ev => {
  const el = ev.target && ev.target.closest && ev.target.closest('[data-b59]'); if (!el) return;
  const c = b59Cfg(), k = el.dataset.b59;
  if (k === 'on') c.on = !!el.checked; else if (k === 'url') { const u = String(el.value || '').trim(); c.url = b59Url(u); if (u && !c.url) { toast('URL ubin tidak sah: harus https dan memuat {z} {x} {y}'); el.value = ''; } }
  b59Save(); const w = $('#b56mapw'); if (w) { delete w.dataset.n; w.dataset.m = ''; } const g = BK.run && BK.run.gps; if (g) b59Draw(g.pts);
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b59: Object.freeze({ cfg: () => ({ on: b59Cfg().on, url: b59Cfg().url }), tiles: Q => b59Tiles(Q), url: b59Url }) }));
/* b59-js-end */
function b56RunExtra() {
  const r = BK.run, g = r.gps, tg = '<div class="b56t" id="bkTgt"></div>' + b58HTML();
  if (!g || !g.on) return tg + '<div class="b56g"><button class="btn sm" data-q="b56gps">Lacak jarak dan rute (GPS)</button>' + (g && g.err ? '<p class="note" role="alert">' + esc(g.err) + '</p>' : '<p class="note">Opsional. Butuh izin lokasi dan layar tetap menyala. Rute hanya tampil selama sesi dan tidak disimpan; jarak mengisi form ride. Peta dasar (bila nyala) dimuat dari internet.</p>') + '</div>';
  return tg + '<div class="b56m"><div><b id="b56d">0</b><small>km</small></div><div><b id="b56s">–</b><small>km/jam rata-rata</small></div></div><div class="mtxt" id="b56e"></div><div id="b56mapw" class="b56map" role="img" aria-label="Rute yang dilewati"></div>' + b59Ctl();
}
function b56Paint() {
  const r = BK.run; if (!r) return;
  const st = r.steps[r.i], h = hrInfo(), g = r.gps, set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set('#bkTgt', b55Zone(st.z, h.st === 'ok' ? h.max : null));
  b58Paint();
  if (!g || !g.on) return;
  const hrs = bkElapsed() / 3.6e6;
  set('#b56d', fmt(g.km, 2)); set('#b56s', g.km > 0.05 && hrs > 0 ? fmt(g.km / hrs, 1) : '–'); set('#b56e', g.err || (g.pts.length ? '' : 'Menunggu sinyal GPS…'));
  b59Draw(g.pts);
}
function b56Fix(p) {
  const r = BK.run, g = r && r.gps; if (!g || !g.on) return;
  const c = p.coords; if (!(c.accuracy <= 30)) return;
  if (!r.ra) { g.gap = true; return; }   // jeda: titik tidak dihitung
  const pt = [c.latitude, c.longitude], l = g.pts[g.pts.length - 1]; g.err = '';
  if (l && !g.gap) { const d = b56Hav(l, pt), dt = (p.timestamp - g.t) / 1000; if (d < 0.005 || (dt > 0 && d * 1000 / dt > 25)) return; g.km += d; }
  g.gap = false; g.pts.push(pt); g.t = p.timestamp; b56Paint();
}
function b56Start() {
  const r = BK.run; if (!r) return;
  if (!navigator.geolocation) { r.gps = { on: false, err: 'Browser ini tidak mendukung GPS.' }; renderTrain(); return; }
  const g = r.gps = { on: true, pts: [], km: 0, err: '', wid: null, gap: false, t: 0 };
  g.wid = navigator.geolocation.watchPosition(b56Fix, e => {
    if (e.code === 1) { b56Stop(); g.err = 'Izin lokasi ditolak. Aktifkan lokasi untuk browser ini lalu coba lagi.'; renderTrain(); } else { g.err = 'Sinyal GPS belum didapat. Coba di tempat terbuka.'; b56Paint(); }
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
  renderTrain();
}
function b56Stop() { const g = BK.run && BK.run.gps; if (g && g.wid != null) { try { navigator.geolocation.clearWatch(g.wid); } catch (x) { /* abaikan */ } g.wid = null; } if (g) g.on = false; }
QACT.b56gps = () => b56Start();
window.DL = Object.freeze(Object.assign({}, window.DL, { b56: Object.freeze({ gps: () => { const g = BK.run && BK.run.gps; return g ? { on: g.on, km: g.km, n: g.pts.length, err: g.err } : null; } }) }));

/* ===== MODUL 58: Sepeda > layar sesi berjalan: bpm dan cadence TERUKUR dari sensor Bluetooth LE (Web Bluetooth), opsional ===== */
// Hanya Chrome/Edge (Android atau komputer; TIDAK ada di iOS Safari) dan hanya bila tombol ditekan. Sensor dihubungkan per sesi dan diputus saat sesi berakhir; tanpa sensor semuanya berjalan seperti sebelumnya.
// HR: layanan 0x180D (0x2A37). Cadence: Cycling Speed and Cadence 0x1816 (0x2A5B) atau, bila tak ada, Cycling Power 0x1818 (0x2A63); keduanya memberi hitungan putaran engkol + waktu dalam 1/1024 detik.
// Rata-rata HR = rata-rata sampel saat TIDAK dijeda; HR maks = tertinggi dari rata-rata bergulir 5 sampel (meredam lonjakan sensor). Rata-rata cadence = total putaran / waktu mengayuh (meluncur 0 rpm tidak dihitung).
// Hasil hanya mengisi form ride (hr, hx, cd) saat sesi selesai; data mentah tidak disimpan dan tidak dikirim ke AI.
const B58 = { HR: 0x180D, HRM: 0x2A37, CSC: 0x1816, CSCM: 0x2A5B, CP: 0x1818, CPM: 0x2A63 };
function b58ParseHr(dv) {   // Heart Rate Measurement -> { bpm, contact } atau null
  if (!dv || dv.byteLength < 2) return null;
  const f = dv.getUint8(0), w = f & 1;
  if (w && dv.byteLength < 3) return null;
  return { bpm: w ? dv.getUint16(1, true) : dv.getUint8(1), contact: !(f & 4) || !!(f & 2) };   // bit2 = fitur kontak didukung, bit1 = kontak terdeteksi
}
function b58ParseCsc(dv) {   // CSC Measurement -> { crank: {rev, t} | null, wheel } atau null
  if (!dv || dv.byteLength < 1) return null;
  const f = dv.getUint8(0); let o = 1, wheel = false, crank = null;
  if (f & 1) { if (dv.byteLength < o + 6) return null; wheel = true; o += 6; }
  if (f & 2) { if (dv.byteLength < o + 4) return null; crank = { rev: dv.getUint16(o, true), t: dv.getUint16(o + 2, true) }; }
  return { crank, wheel };
}
function b58ParseCp(dv) {   // Cycling Power Measurement -> { crank } atau null
  if (!dv || dv.byteLength < 4) return null;
  const f = dv.getUint16(0, true); let o = 4;   // flags (2) + daya sesaat (2)
  if (f & 1) o += 1;      // keseimbangan pedal
  if (f & 4) o += 2;      // torsi terakumulasi
  if (f & 16) o += 6;     // data putaran roda
  if (!(f & 32)) return { crank: null };
  if (dv.byteLength < o + 4) return null;
  return { crank: { rev: dv.getUint16(o, true), t: dv.getUint16(o + 2, true) } };
}
function b58Slot(r, k) { r.sn = r.sn || {}; return r.sn[k] || (r.sn[k] = { k, st: 'idle', dev: null, ch: null, name: '', src: '', err: '', tries: 0, timer: 0, onVal: null, onDis: null, n: 0, sum: 0, max: 0, w: [], cur: null, t: 0, nc: false, rev: 0, sec: 0, win: [], ev: 0, last: null, pk: 0, crankSeen: false }); }
function b58Hr(s, p, run) {
  s.pk++;
  if (!p) return;
  if (!p.contact) { s.nc = true; s.cur = null; return; }
  s.nc = false;
  if (p.bpm < 30 || p.bpm > 230) return;   // 0 atau lonjakan: abaikan
  s.cur = p.bpm; s.t = Date.now();
  if (!run) return;
  s.n++; s.sum += p.bpm; s.w.push(p.bpm); if (s.w.length > 5) s.w.shift();
  if (s.w.length === 5) s.max = Math.max(s.max, s.w.reduce((a, x) => a + x, 0) / 5);
}
function b58Crank(s, cr, run) {
  s.pk++;
  if (!cr) return;
  s.crankSeen = true;
  const p = s.last; s.last = cr;
  if (!p) return;
  const dt = (cr.t - p.t) & 0xFFFF, dr = (cr.rev - p.rev) & 0xFFFF;   // & 0xFFFF = lewat batas 16 bit
  if (dt === 0) return;                                                // belum ada putaran baru (paket diulang)
  const sec = dt / 1024;
  if (dr === 0 || sec > 5 || dr / sec * 60 > 220) { s.win = []; return; }   // berhenti lama, sensor reset, atau lompatan: abaikan
  s.ev = Date.now(); s.win.push({ r: dr, s: sec });
  let ts = 0; s.win.forEach(x => { ts += x.s; });
  while (s.win.length > 1 && ts - s.win[0].s >= 3) { ts -= s.win[0].s; s.win.shift(); }
  s.cur = s.win.reduce((a, x) => a + x.r, 0) / ts * 60;
  if (run) { s.rev += dr; s.sec += sec; }
}
function b58Value(r, s, dv) {
  if (BK.run !== r) return;
  const run = !!r.ra;   // false saat jeda: tampil tetap jalan, rata-rata tidak bertambah
  if (s.k === 'hr') b58Hr(s, b58ParseHr(dv), run);
  else { const p = s.src === 'CP' ? b58ParseCp(dv) : b58ParseCsc(dv); if (p) b58Crank(s, p.crank, run); else s.pk++; }
}
function b58Tgt(r) {   // kisaran target segmen berjalan: bpm (bila usia terisi) dan cadence saran
  const st = r.steps[r.i], h = hrInfo(), n = (String(st.z).match(/\d/g) || []).map(Number);
  if (!n.length) return {};
  const lo = Math.min.apply(null, n), hi = Math.max.apply(null, n);
  return { hr: h.st === 'ok' && HR_PCT[lo] && HR_PCT[hi] ? [hrAt(h.max, HR_PCT[lo][0]), hrAt(h.max, HR_PCT[hi][1])] : null, cd: hi >= 5 ? [90, 100] : [85, 95] };
}
function b58Read(r, k, T) {   // nilai dan keterangan untuk satu sensor
  const s = r.sn && r.sn[k]; if (!s) return null;
  const now = Date.now(); let v = null, stat = '', cls = '';
  if (s.st === 'connecting') stat = 'Menyambung…';
  else if (s.st === 'lost') stat = 'Terputus, menyambung ulang…';
  else if (s.st === 'failed') { stat = s.err || 'Gagal terhubung.'; cls = 'bad'; }
  else if (s.st === 'on') {
    if (k === 'hr') {
      if (s.nc) stat = 'Sensor belum menempel di dada';
      else if (s.cur != null && now - s.t < 5000) v = Math.round(s.cur);
      else stat = 'Menunggu data…';
    } else if (s.pk >= 5 && !s.crankSeen) stat = 'Sensor ini tidak mengirim cadence (hanya kecepatan roda).';
    else if (s.ev) v = now - s.ev > 3000 ? 0 : Math.round(s.cur);
    else stat = 'Menunggu data… mulai mengayuh';
    if (v != null) {
      const rg = T && T[k];
      if (k === 'cd' && v === 0) stat = 'Tidak mengayuh';
      else if (rg) { stat = v < rg[0] ? 'Di bawah target' : v > rg[1] ? 'Di atas target' : 'Dalam target'; cls = stat === 'Dalam target' ? 'ok' : (stat === 'Di atas target' && k === 'hr') ? 'bad' : ''; }
      else stat = s.name;
    }
  }
  return { s, v, stat, cls };
}
const B58_KD = { hr: ['bpm', 'Hubungkan detak jantung', 'Detak jantung'], cd: ['rpm', 'Hubungkan cadence', 'Cadence'] };
function b58HTML() {
  const r = BK.run; if (!r) return '';
  if (!(navigator.bluetooth && navigator.bluetooth.requestDevice)) return '<div class="b58"><p class="note">Sensor bpm dan cadence perlu Chrome atau Edge (Android atau komputer). Browser ini belum mendukungnya.</p></div>';
  const T = b58Tgt(r), act = k => !!(r.sn && r.sn[k] && r.sn[k].st !== 'idle'), shown = ['hr', 'cd'].filter(act), idle = ['hr', 'cd'].filter(k => !act(k));
  const tile = k => {
    const x = b58Read(r, k, T), s = x.s, bad = s.st === 'failed' || s.st === 'lost';
    return '<div class="b58t" role="group" aria-label="' + B58_KD[k][2] + '"><div class="b58v"><b id="b58' + k + '">' + (x.v == null ? '–' : x.v) + '</b><small>' + B58_KD[k][0] + '</small></div>' +
      '<div class="b58s ' + x.cls + '" id="b58' + k + 's"' + (s.st === 'failed' ? ' role="alert"' : '') + '>' + esc(x.stat) + '</div>' +
      (bad ? '<button class="btn sm" data-q="b58retry" data-k="' + k + '">Coba lagi</button>' : '') +
      '<button class="btn sm" data-q="b58off" data-k="' + k + '">Putuskan</button></div>';
  };
  return '<div class="b58">' + (shown.length ? '<div class="b58g">' + shown.map(tile).join('') + '</div>' : '') +
    (idle.length ? '<div class="b58b">' + idle.map(k => '<button class="btn sm" data-q="b58' + k + '">' + B58_KD[k][1] + '</button>').join('') + '</div>' : '') +
    (shown.length ? '' : '<p class="note">Opsional: monitor detak jantung atau sensor cadence Bluetooth LE. Rata-rata keduanya mengisi form ride.</p>') + '</div>';
}
function b58Paint() {
  const r = BK.run; if (!r || !r.sn) return;
  const T = b58Tgt(r);
  ['hr', 'cd'].forEach(k => {
    const x = b58Read(r, k, T), a = $('#b58' + k), b = $('#b58' + k + 's'); if (!x || !a || !b) return;
    const v = x.v == null ? '–' : String(x.v), c = 'b58s ' + x.cls;
    if (a.textContent !== v) a.textContent = v;
    if (b.textContent !== x.stat) b.textContent = x.stat;
    if (b.className !== c) b.className = c;
  });
}
function b58Refresh() { if (BK.run && curView === 'train' && trainTab === 'bike') renderTrain(); }
function b58Err(e, link) {
  const n = e && e.name, m = String((e && e.message) || '');
  if (/adapter|powered off|bluetooth.*(off|disabled)/i.test(m)) return 'Bluetooth di perangkat ini mati. Nyalakan lalu coba lagi.';
  if (n === 'SecurityError') return 'Bluetooth diblokir browser (perlu HTTPS, localhost, atau berkas lokal, dan izin Bluetooth).';
  if (n === 'NotAllowedError') return 'Izin Bluetooth ditolak.';
  if (n === 'NotFoundError' && link) return 'Perangkat ini tidak punya layanan yang dibutuhkan.';
  if (n === 'NetworkError') return 'Sensor tidak terjangkau. Dekatkan, dan pastikan tidak sedang terhubung ke aplikasi lain.';
  return 'Gagal terhubung ke sensor. Dekatkan dan pastikan tidak terhubung ke aplikasi lain.';
}
function b58Detach(s) {   // putus + lepas pendengar; data rata-rata (n, sum, rev, sec) TETAP
  clearTimeout(s.timer); s.timer = 0;
  const dev = s.dev, ch = s.ch;
  s.st = 'idle'; s.dev = null; s.ch = null; s.cur = null; s.last = null; s.win = []; s.nc = false; s.err = ''; s.tries = 0;
  try { if (ch && s.onVal) ch.removeEventListener('characteristicvaluechanged', s.onVal); } catch (x) { /* abaikan */ }
  try { if (dev && s.onDis) dev.removeEventListener('gattserverdisconnected', s.onDis); } catch (x) { /* abaikan */ }
  try { if (ch && ch.stopNotifications) { const p = ch.stopNotifications(); if (p && p.catch) p.catch(() => { /* abaikan */ }); } } catch (x) { /* abaikan */ }
  try { if (dev && dev.gatt && dev.gatt.connected) dev.gatt.disconnect(); } catch (x) { /* abaikan */ }
}
function b58Stop() { const r = BK.run; if (r && r.sn) Object.keys(r.sn).forEach(k => b58Detach(r.sn[k])); }
function b58Retry(r, s) {   // sambung ulang otomatis: maksimal 5 kali, jeda 1,5 / 3 / 4,5 / 6 / 7,5 detik
  if (BK.run !== r || s.st === 'idle') return;
  if (s.tries >= 5) { s.st = 'failed'; s.err = 'Sensor terputus. Dekatkan sensor lalu coba lagi.'; b58Refresh(); return; }
  s.tries++; clearTimeout(s.timer); s.st = 'lost';
  s.timer = setTimeout(() => b58Link(r, s), 1500 * s.tries);
  b58Refresh();
}
async function b58Link(r, s) {
  const dev = s.dev; if (!dev || BK.run !== r) return;
  s.st = 'connecting'; s.err = ''; b58Refresh();
  try {
    const srv = await dev.gatt.connect(); let svc, ch, src;
    if (s.k === 'hr') { svc = await srv.getPrimaryService(B58.HR); ch = await svc.getCharacteristic(B58.HRM); src = 'HR'; }
    else {
      try { svc = await srv.getPrimaryService(B58.CSC); ch = await svc.getCharacteristic(B58.CSCM); src = 'CSC'; }
      catch (e) { svc = await srv.getPrimaryService(B58.CP); ch = await svc.getCharacteristic(B58.CPM); src = 'CP'; }
    }
    if (BK.run !== r || s.dev !== dev) { try { dev.gatt.disconnect(); } catch (x) { /* abaikan */ } return; }
    if (s.ch && s.onVal) { try { s.ch.removeEventListener('characteristicvaluechanged', s.onVal); } catch (x) { /* abaikan */ } }
    s.src = src; s.ch = ch; s.last = null; s.win = []; s.pk = 0; s.crankSeen = false;
    s.onVal = ev => b58Value(r, s, ev.target.value);
    ch.addEventListener('characteristicvaluechanged', s.onVal);
    await ch.startNotifications();
    if (BK.run !== r || s.dev !== dev) return;
    s.st = 'on'; s.tries = 0;
  } catch (e) {
    if (BK.run !== r || s.dev !== dev) return;
    const n = e && e.name;
    if (n === 'NotFoundError' || n === 'SecurityError' || n === 'NotSupportedError') { s.st = 'failed'; s.err = b58Err(e, true); } else { b58Retry(r, s); return; }
  }
  b58Refresh();
}
async function b58Pick(k) {   // harus dipanggil dari ketukan tombol (syarat Web Bluetooth)
  const r = BK.run; if (!r || !(navigator.bluetooth && navigator.bluetooth.requestDevice)) return;
  const s = b58Slot(r, k); if (s.st === 'connecting') return;
  const opts = k === 'hr' ? { filters: [{ services: [B58.HR] }] } : { filters: [{ services: [B58.CSC] }, { services: [B58.CP] }], optionalServices: [B58.CSC, B58.CP] };
  let dev;
  try { dev = await navigator.bluetooth.requestDevice(opts); }
  catch (e) {
    if (BK.run !== r) return;
    if (e && e.name === 'NotFoundError' && !/adapter|powered off/i.test(String(e.message || ''))) { b58Refresh(); return; }   // pilihan dibatalkan
    s.st = 'failed'; s.err = b58Err(e, false); b58Refresh(); return;
  }
  if (BK.run !== r) return;
  b58Detach(s);
  s.dev = dev; s.name = dev.name || 'Sensor'; s.tries = 0;
  s.onDis = () => { if (BK.run !== r || s.dev !== dev || s.st === 'idle' || s.st === 'failed') return; s.cur = null; b58Retry(r, s); };
  dev.addEventListener('gattserverdisconnected', s.onDis);
  await b58Link(r, s);
}
function b58Fill(r) {   // dipanggil saat sesi selesai: isi HR dan cadence form ride; hasil = daftar yang terisi
  const o = [], sn = r.sn || {}, H = sn.hr, C = sn.cd;
  if (H && H.n >= 20) { const a = Math.round(H.sum / H.n), x = Math.max(Math.round(H.max), a); if (a >= 30 && x <= 250) { rideForm.hr = String(a); rideForm.hx = String(x); o.push('HR'); } }
  if (C && C.sec >= 30) { const a = Math.round(C.rev / C.sec * 60); if (a >= 30 && a <= 200) { rideForm.cd = String(a); o.push('cadence'); } }
  return o;
}
QACT.b58hr = () => b58Pick('hr');
QACT.b58cd = () => b58Pick('cd');
QACT.b58retry = el => { const r = BK.run, s = r && r.sn && r.sn[el.dataset.k]; if (!s) return; if (s.dev) { s.tries = 0; clearTimeout(s.timer); b58Link(r, s); } else b58Pick(el.dataset.k); };
QACT.b58off = el => { const r = BK.run, s = r && r.sn && r.sn[el.dataset.k]; if (!s) return; b58Detach(s); renderTrain(); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b58: Object.freeze({ hr: b58ParseHr, csc: b58ParseCsc, cp: b58ParseCp, sn: () => { const r = BK.run, o = {}; if (r && r.sn) Object.keys(r.sn).forEach(k => { const s = r.sn[k]; o[k] = { st: s.st, n: s.n, sum: s.sum, max: s.max, rev: s.rev, sec: s.sec, cur: s.cur, name: s.name, src: s.src, err: s.err, tries: s.tries }; }); return o; } }) }));

/* q2-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Rencana vs realisasi" (tahap 21, q2) ===== */
// HANYA tampilan. Membaca schedFor/pdb/tdb; tidak menulis data, tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru (memakai kelas bzdl/bzsub/note/empty yang sudah ada).
// Terlaksana = ada ride tercatat PADA hari terjadwal itu; "sesuai jenis" dihitung terpisah. Ride yang digeser ke hari lain dihitung "di luar jadwal".
// Hari sebelum tanggal mulai program tidak dijadwalkan. Galat kartu ini tidak boleh menjatuhkan tampilan Sepeda: bzPlanCard() menelannya (pesan di DL.b31q2.err()).
const BZ_ZT = { z2: 1, long: 1 };
let BZ_PERR = '';
const bzRng = (a, b) => a === b ? fmt(a, 0) : fmt(a, 0) + '–' + fmt(b, 0);
function bzPlanMin(type, phId) {
  if (type === 'z2') return phId >= 2 ? [60, 60] : [45, 60];
  if (type === 'long') return phId >= 3 ? [150, 240] : [90, 120];
  const m = Math.round(bikeSteps(type, 0).reduce((a, s) => a + s.s, 0) / 60);
  return [m, m];
}
function bzPlanWeek(ws) {
  const st = pdb.start || null, rows = []; let z2 = 0, lo = 0, hi = 0, extra = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i), rs = bzRides(d), sc = schedFor(d), type = sc.s.bike || null;
    rs.forEach(r => { if (BZ_ZT[r.type] && r.min != null) z2 += r.min; });
    if (!type || (st && d < st)) { extra += rs.length; continue; }
    const pm = bzPlanMin(type, sc.ph.id);
    if (BZ_ZT[type]) { lo += pm[0]; hi += pm[1]; }
    rows.push({ d, type, rs, pm, done: rs.length > 0, match: rs.some(r => r.type === type) });
  }
  return { ws, rows, m: rows.length, n: rows.filter(r => r.done).length, nT: rows.filter(r => r.match).length, z2, lo, hi, extra };
}
function bzPlanRow(r, t) {
  const k = r.done ? 'ok' : r.d < t ? 'miss' : r.d === t ? 'now' : 'next';
  const lb = { ok: '✓ Terlaksana', miss: 'Terlewat', now: 'Hari ini', next: 'Nanti' }[k];
  const sm = r.done
    ? r.rs.map(x => RIDE_NAME(x.type) + (x.min != null ? ' ' + fmt(x.min, 0) + ' menit' : '') + (x.km != null ? ' · ' + fmt(x.km, 1) + ' km' : '')).join('; ') + (r.match ? '' : ' (jenis lain dari rencana)')
    : 'Rencana ' + (BZ_ZT[r.type] ? '' : 'sekitar ') + bzRng(r.pm[0], r.pm[1]) + ' menit';
  return '<li data-k="' + k + '"><b>' + esc(dayShort(r.d)) + ' · ' + esc(BIKE_LABEL[r.type]) + '</b><span>' + lb + '</span><small>' + esc(sm) + '</small></li>';
}
function bzPlanLines(W) {
  const L = [];
  if (W.hi > 0) L.push('Zone 2 (Zone 2 murni + Long ride): ' + fmt(W.z2, 0) + ' dari rencana ' + bzRng(W.lo, W.hi) + ' menit.');
  if (W.m) L.push(W.n + ' dari ' + W.m + ' sesi terjadwal terlaksana' + (W.n ? ', ' + W.nT + ' sesuai jenis' : '') + '.');
  if (W.extra) L.push(W.extra + ' ride di luar jadwal.');
  return L;
}
function bzPlanHTML() {
  const t = today(), ws = thisWeek(), W = bzPlanWeek(ws);
  let h = '';
  if (!pdb.start) h += '<p class="note">Tanggal mulai program belum diatur di Peta, jadi jadwal contoh Fase 1 dipakai.</p>';
  h += W.m ? '<ul class="bzdl">' + W.rows.map(r => bzPlanRow(r, t)).join('') + '</ul>' : '<p class="empty">Tidak ada sesi sepeda terjadwal pekan ini.</p>';
  const L = bzPlanLines(W); if (L.length) h += '<p class="note">' + L.map(esc).join(' ') + '</p>';
  const prev = [1, 2, 3, 4].map(k => bzPlanWeek(addDays(ws, -7 * k))).filter(x => x.m || x.extra);
  if (prev.length) {
    h += '<h3 class="bzsub">Pekan sebelumnya</h3><ul class="bzdl">' + prev.map(x => {
      const p = [];
      if (x.hi > 0) p.push('Zone 2 ' + fmt(x.z2, 0) + ' dari ' + bzRng(x.lo, x.hi) + ' menit');
      if (x.m) p.push(x.nT + ' sesuai jenis');
      if (x.extra) p.push(x.extra + ' di luar jadwal');
      return '<li><b>' + esc(rangeLabel(x.ws)) + '</b><span>' + (x.m ? x.n + ' dari ' + x.m : '–') + '</span>' + (p.length ? '<small>' + esc(p.join(' · ')) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  h += '<p class="note">Terlaksana = ada ride tercatat pada hari terjadwal itu; jenis ride dicocokkan terpisah. Ride yang digeser ke hari lain masuk "di luar jadwal". Menit rencana diambil dari teks fase dan Rencana sesi; anggap panduan, bukan target keras.</p>';
  return h;
}
function bzPlanSum() {
  const W = bzPlanWeek(thisWeek());
  if (!W.m) return W.extra ? 'Tidak ada jadwal pekan ini · ' + W.extra + ' ride di luar jadwal' : 'Tidak ada sesi sepeda terjadwal pekan ini';
  return 'Pekan ini: ' + W.n + ' dari ' + W.m + ' sesi terjadwal terlaksana';
}
function bzPlanCard() {
  try { const h = bzCardHTML('rvr', 'Rencana vs realisasi', bzPlanSum(), bzPlanHTML()); BZ_PERR = ''; return h; }
  catch (x) { BZ_PERR = String((x && x.message) || x); return ''; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b31q2: Object.freeze({ week: bzPlanWeek, html: bzPlanHTML, sum: bzPlanSum, err: () => BZ_PERR }) }));
/* q2-end */
/* q3a-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Kemajuan" (tahap 22, q3a: rekor + Long ride) ===== */
// HANYA tampilan. Membaca tdb/pdb; tidak menulis data, tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru (memakai kelas bzdl/bzsub/note/empty yang sudah ada).
// Rekor = nilai terbesar di seluruh riwayat ride; bila seri, ride yang PALING AWAL dipakai. Galat kartu ini tidak boleh menjatuhkan tampilan Sepeda: bzProgCard() menelannya (pesan di DL.b32q3.err()).
let BZ_QERR = '';
function bzAllRides() {
  const o = [];
  Object.keys(tdb).sort().forEach(d => bzRides(d).forEach(r => o.push({ d, r })));
  return o;
}
function bzBest(list, key) {
  let b = null;
  list.forEach(x => { const v = x.r[key]; if (v != null && v > 0 && (!b || v > b.v)) b = { v, d: x.d, r: x.r }; });
  return b;
}
function bzProgRecs(all) {
  all = all || bzAllRides();
  return { min: bzBest(all, 'min'), km: bzBest(all, 'km'), lmin: bzBest(all.filter(x => x.r.type === 'long'), 'min'), el: bzBest(all, 'el'), n: all.length };
}
function bzProgLongs(all) {
  all = all || bzAllRides();
  const L = all.filter(x => x.r.type === 'long' && x.r.min != null && x.r.min > 0);
  return L.map((x, i) => ({ d: x.d, min: x.r.min, km: x.r.km, dl: i ? x.r.min - L[i - 1].r.min : null })).slice(-5);
}
function bzRecRow(label, b, unit, dec) {
  if (!b) return '';
  const r = b.r, bits = [dayShort(b.d), RIDE_NAME(r.type)];
  if (unit === 'min' && r.km != null) bits.push(fmt(r.km, 1) + ' km');
  if (unit === 'km' && r.min != null) bits.push(fmt(r.min, 0) + ' menit');
  if (b.d >= thisWeek()) bits.push('pekan ini');
  return '<li><b>' + esc(label) + '</b><span>' + esc(fmt(b.v, dec) + ' ' + (unit === 'min' ? 'menit' : unit)) + '</span><small>' + esc(bits.join(' · ')) + '</small></li>';
}
function bzProgHTML() {
  const all = bzAllRides(), R = bzProgRecs(all);
  if (!all.length) return '<p class="empty">Belum ada ride tercatat. Rekor dan perkembangan Long ride muncul setelah ride pertama.</p>';
  const rows = bzRecRow('Ride terlama', R.min, 'min', 0) + bzRecRow('Ride terjauh', R.km, 'km', 1) + bzRecRow('Long ride terlama', R.lmin, 'min', 0) + bzRecRow('Tanjakan terbanyak', R.el, 'm', 0) + bzHxRow(all);
  let h = rows ? '<ul class="bzdl">' + rows + '</ul>' : '<p class="empty">Ride yang tercatat belum punya durasi atau jarak, jadi belum ada rekor.</p>';
  const Lg = bzProgLongs(all);
  h += '<h3 class="bzsub">Long ride terakhir</h3>';
  if (Lg.length) {
    h += '<ul class="bzdl">' + Lg.map(x => '<li><b>' + esc(dayShort(x.d)) + '</b><span>' + esc(fmt(x.min, 0)) + ' menit</span><small>' +
      esc((x.km != null ? fmt(x.km, 1) + ' km · ' : '') + (x.dl == null ? 'Long ride pertama tercatat' : x.dl === 0 ? 'sama dengan sebelumnya' : (x.dl > 0 ? '+' : '−') + fmt(Math.abs(x.dl), 0) + ' menit dari Long ride sebelumnya')) + '</small></li>').join('') + '</ul>';
  } else h += '<p class="empty">Belum ada Long ride bermenit tercatat.</p>';
  const ph = schedFor(today()).ph;
  if (pdb.start && ph.id >= 2) { const pm = bzPlanMin('long', ph.id); h += '<p class="note">Rencana Long ride di Fase ' + ph.id + ': ' + bzRng(pm[0], pm[1]) + ' menit.</p>'; }
  h += bzTrendHTML();
  h += bzHxNote(all);
  h += bzKdHTML(all);   // q5a
  h += '<p class="note">Rekor diambil dari semua ride tercatat; bila nilainya sama, ride yang paling awal dipakai. Ini catatan, bukan target.</p>';
  return h;
}
function bzProgSum() {
  const R = bzProgRecs();
  if (!R.n) return 'Belum ada ride';
  const p = [];
  if (R.min) p.push('Terlama ' + fmt(R.min.v, 0) + ' menit');
  if (R.km) p.push((p.length ? 'terjauh ' : 'Terjauh ') + fmt(R.km.v, 1) + ' km');
  return p.length ? p.join(' · ') : 'Belum ada durasi atau jarak';
}
function bzProgCard() {
  try { const h = bzCardHTML('prg', 'Kemajuan', bzProgSum(), bzProgHTML()); BZ_QERR = ''; return h; }
  catch (x) { BZ_QERR = String((x && x.message) || x); return ''; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b32q3: Object.freeze({ recs: bzProgRecs, longs: bzProgLongs, html: bzProgHTML, sum: bzProgSum, err: () => BZ_QERR }) }));
/* q3a-end */
/* q3b-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Kemajuan" > tren Zone 2 (tahap 23, q3b) ===== */
// HANYA tampilan. Membaca tdb; tidak menulis data, tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru (memakai kelas bzdl/bzsub/note/empty yang sudah ada).
// TANPA vonis naik/turun: hanya angka. Satu-satunya patokan buatan sendiri (bukan dari sumber): syarat data minimum 3 ride ber-HR dalam 2 pekan berbeda.
// Galat ditelan oleh bzTrendHTML() (pesan di DL.b32q3b.err()) supaya bagian Rekor di kartu yang sama tetap tampil.
let BZ_TERR = '';
const BZ_TR_WEEKS = 8, BZ_TR_MINR = 3, BZ_TR_MINW = 2;
function bzTrend() {
  const ws0 = thisWeek(), from = addDays(ws0, -7 * (BZ_TR_WEEKS - 1)), to = addDays(ws0, 6);
  let nAll = 0; const used = [];
  Object.keys(tdb).filter(d => DATE_RE.test(d) && d >= from && d <= to).sort().forEach(d => bzRides(d).forEach(r => {
    if (r.type !== 'z2' && r.type !== 'long') return;
    nAll++;
    const sp = b17cSpd(r);
    if (r.hr != null && r.hr > 0 && sp != null && sp > 0) used.push({ d, hr: r.hr, sp, e: sp / r.hr * 100 });
  }));
  const by = {};
  used.forEach(x => { const w = weekStart(x.d); (by[w] = by[w] || []).push(x); });
  const weeks = Object.keys(by).sort().map(w => ({ ws: w, n: by[w].length, sp: b17cMed(by[w].map(x => x.sp)), hr: b17cMed(by[w].map(x => x.hr)), e: b17cMed(by[w].map(x => x.e)) }));
  const enough = used.length >= BZ_TR_MINR && weeks.length >= BZ_TR_MINW;
  let change = null;
  if (enough) { const a = weeks[0], b = weeks[weeks.length - 1]; change = { from: a.ws, to: b.ws, a: a.e, b: b.e, pct: (b.e - a.e) / a.e * 100 }; }
  return { nAll, nUsed: used.length, weeks, enough, change, from, to };
}
function bzTrendHTML() {
  try {
    const T = bzTrend();
    let h = '<h3 class="bzsub">Tren Zone 2: kecepatan pada detak jantung</h3>';
    if (!T.nAll) h += '<p class="empty">Belum ada ride Zone 2 atau Long ride dalam 8 pekan terakhir.</p>';
    else if (!T.nUsed) h += '<p class="empty">Ada ' + T.nAll + ' ride Zone 2 atau Long ride, tetapi belum ada yang punya HR rata-rata dan kecepatan. Isi HR rata-rata di kartu Catat ride atau impor foto Strava.</p>';
    else {
      const cur = thisWeek();
      h += '<ul class="bzdl">' + T.weeks.slice().reverse().map(w => '<li><b>' + esc(rangeLabel(w.ws) + (w.ws === cur ? ' · pekan ini' : '')) + '</b><span>' + esc(fmt(w.sp, 1) + ' km/jam') + '</span><small>' +
        esc('HR ' + fmt(w.hr, 0) + ' · ' + w.n + ' ride · ' + fmt(w.e, 1) + ' km/jam per 100 bpm') + '</small></li>').join('') + '</ul>';
      if (T.change) {
        const p = Math.round(T.change.pct), ps = p > 0 ? '+' + fmt(p, 0) + '%' : p < 0 ? '−' + fmt(Math.abs(p), 0) + '%' : '0%';
        h += '<p class="note">Dari pekan ' + esc(rangeLabel(T.change.from)) + ' ke pekan ' + esc(rangeLabel(T.change.to)) + ': ' + esc(fmt(T.change.a, 1) + ' → ' + fmt(T.change.b, 1)) + ' km/jam per 100 bpm (' + esc(ps) + ').</p>';
      } else h += '<p class="note">Belum cukup data untuk membandingkan. Perlu minimal ' + BZ_TR_MINR + ' ride ber-HR dalam ' + BZ_TR_MINW + ' pekan berbeda (patokan aplikasi, bukan standar).</p>';
      h += '<p class="note">Hanya ride Zone 2 dan Long ride 8 pekan terakhir yang punya HR rata-rata dan kecepatan; angka per pekan = nilai tengah.' + (T.nAll > T.nUsed ? ' ' + (T.nAll - T.nUsed) + ' ride lain tidak dihitung karena belum ada HR atau kecepatan.' : '') + ' Ini petunjuk, bukan bukti: angin, tanjakan, panas, kurang tidur, dan sensor bisa mengubah angkanya.</p>';
    }
    BZ_TERR = '';
    return h;
  } catch (x) { BZ_TERR = String((x && x.message) || x); return ''; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b32q3b: Object.freeze({ trend: bzTrend, html: bzTrendHTML, err: () => BZ_TERR }) }));
/* q3b-end */
/* q4a-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Kemajuan" > HR maksimum tercatat (tahap 24, q4a) ===== */
// HANYA tampilan. Membaca tdb/pdb; tidak menulis data, tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru (memakai kelas bzdl/note yang sudah ada).
// HR maksimum tercatat = nilai hx (HR maks ride) TERTINGGI di seluruh riwayat; seri = ride yang paling awal (sama dengan rekor lain). TANPA vonis: dua angka (tercatat dan rumus usia) hanya ditaruh berdampingan.
// Zona latihan TIDAK berubah: tetap memakai perkiraan rumus usia (hrInfo). Galat ditelan (pesan di DL.b34q4a.err()) supaya bagian Rekor lain di kartu yang sama tetap tampil.
let BZ_HERR_ROW = '', BZ_HERR_NOTE = '';   // dua keadaan galat terpisah supaya galat baris tidak terhapus oleh catatan yang berhasil
function bzHxBest(all) { return bzBest(all || bzAllRides(), 'hx'); }
function bzHxRow(all) {
  try {
    const b = bzHxBest(all);
    BZ_HERR_ROW = '';
    if (!b) return '';
    const bits = [dayShort(b.d), RIDE_NAME(b.r.type)], h = hrInfo();
    const fm = h.src === 'terukur' ? h.fmax : (h.st === 'ok' ? h.max : null);
    if (fm != null) bits.push('rumus usia ≈ ' + fm + ' bpm');
    if (b.d >= thisWeek()) bits.push('pekan ini');
    return '<li><b>HR maksimum tercatat</b><span>' + esc(fmt(b.v, 0) + ' bpm') + '</span><small>' + esc(bits.join(' · ')) + '</small></li>';
  } catch (x) { BZ_HERR_ROW = String((x && x.message) || x); return ''; }
}
function bzHxNote(all) {
  try {
    BZ_HERR_NOTE = '';
    if (!bzHxBest(all)) return '';
    return '<p class="note">HR maksimum tercatat adalah HR tertinggi dari satu ride, bukan HRmax sebenarnya kecuali ride itu usaha maksimal; lonjakan sensor bisa membuat angkanya terlalu tinggi. ' + (hrInfo().src === 'terukur' ? 'Zona latihan memakai HRmax yang kamu isi sendiri.' : 'Zona latihan di aplikasi tetap memakai perkiraan rumus usia dan tidak berubah.') + '</p>';
  } catch (x) { BZ_HERR_NOTE = String((x && x.message) || x); return ''; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b34q4a: Object.freeze({ best: bzHxBest, row: bzHxRow, note: bzHxNote, err: () => BZ_HERR_ROW || BZ_HERR_NOTE }) }));
/* q4a-end */
/* q4b-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Zona latihan" > HRmax TERUKUR (tahap 25, q4b) ===== */
// OPT-IN. Kolom profil pdb.profile.hrmax (teks angka bulat 100-230; kosong = tidak dipakai). Tanpa kunci penyimpanan baru: ikut pdb.profile, jadi ikut cadangan JSON dan impor (pclean menyaringnya).
// Bila terisi, hrInfo() mengembalikan { st:'ok', src:'terukur', max, age, fmax }; semua zona, ringkasan, kartu sesi, dan Cek Zone 2 otomatis memakai angka itu.
// Bila kosong, hrInfo() mengembalikan objek yang SAMA dengan q4a. HRmax TIDAK dikirim ke AI (hanya kisaran bpm Zone 2 yang sudah ada sebelumnya).
// Galat editor ditelan (pesan di DL.b35q4b.err()) supaya baris zona dan uji bicara tetap tampil.
let HM_ERR = '';
function hmMeasured() {
  try {
    const p = pfd(), raw = p && p.hrmax != null ? String(p.hrmax).trim() : '';
    if (!/^\d{3}$/.test(raw)) return null;
    const v = +raw;
    return v >= 100 && v <= 230 ? v : null;
  } catch (x) { return null; }
}
function hmHead(h) {
  return '<p class="note">HRmax terukur (kamu isi sendiri) ' + h.max + ' bpm' +
    (h.fmax != null ? '; perkiraan rumus usia ' + h.fmax + ' bpm (208 − 0,7 × ' + h.age + ' tahun, Tanaka 2001, galat ±10 bpm)' : '') +
    '. Zona di bawah dihitung dari ' + h.max + ' bpm. Anggap angka bpm sebagai kisaran; uji bicara dan RPE tetap penentu. Nyeri dada, pusing berat, atau pingsan: berhenti dan temui dokter.</p>';
}
function hmEditorHTML() {
  try {
    HM_ERR = '';
    const m = hmMeasured(), b = bzHxBest(), same = !!b && m != null && b.v === m;
    let h = '<h3 class="bzsub">HRmax terukur (opsional)</h3>' +
      '<p class="note">' + (m == null
        ? 'Kosong: zona memakai perkiraan rumus usia. Bila kamu pernah mengukur HRmax (tes usaha maksimal yang aman atau sensor dada), isi di sini supaya zona dan Cek Zone 2 memakainya.'
        : 'Zona memakai angka ini. Hapus untuk kembali ke perkiraan rumus usia.') + '</p>' +
      '<div class="sublbl t0">HRmax</div><label class="inp"><input data-hm="v" inputmode="numeric" autocomplete="off" placeholder="mis. 185" value="' + esc(m == null ? '' : String(m)) + '" aria-label="HRmax terukur dalam bpm"><span class="u">bpm</span></label>' +
      '<button class="btn primary wide" style="margin-top:12px" data-q="hmSave">Simpan HRmax</button>';
    if (b && !same) h += '<button class="btn wide" style="margin-top:8px" data-q="hmUse">Pakai HR maks tertinggi dari ride (' + esc(fmt(b.v, 0)) + ' bpm)</button>';
    if (m != null) h += '<button class="btn ghost wide" style="margin-top:8px" data-q="hmClear">Hapus (kembali ke rumus usia)</button>';
    if (b && m != null && b.v > m) h += '<p class="note">Ada ride dengan HR maks ' + esc(fmt(b.v, 0)) + ' bpm (' + esc(dayShort(b.d)) + '), lebih tinggi dari angka ini.</p>';
    return h;
  } catch (x) { HM_ERR = String((x && x.message) || x); return ''; }
}
QACT.hmSave = () => {
  const el = $('#trainBody input[data-hm="v"]'), raw = el ? String(el.value).trim() : '';
  if (!raw) { toast('Isi angka HRmax (100–230 bpm), atau tekan Hapus untuk kembali ke rumus usia.'); return; }
  const v = /^\d+$/.test(raw) ? +raw : NaN;
  if (!(v >= 100 && v <= 230)) { toast('HRmax harus bilangan bulat antara 100 dan 230 bpm.'); return; }
  pfSet({ hrmax: String(v) });
  toast('HRmax terukur disimpan: ' + v + ' bpm. Zona diperbarui.'); renderTrain();
};
QACT.hmUse = () => {
  const b = bzHxBest(); if (!b) return;
  const v = Math.round(b.v);
  if (!(v >= 100 && v <= 230)) { toast('HR maks ride (' + v + ' bpm) di luar 100–230 bpm, jadi tidak dipakai. Isi sendiri bila yakin.'); return; }
  pfSet({ hrmax: String(v) });
  toast('HRmax diisi ' + v + ' bpm dari ride tertinggi. Zona diperbarui; Hapus untuk membatalkan.'); renderTrain();
};
QACT.hmClear = () => { pfSet({ hrmax: '' }); toast('HRmax terukur dihapus. Zona kembali memakai rumus usia.'); renderTrain(); };
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.hm !== 'v') return;
  const v = String(el.value).replace(/\D/g, '').slice(0, 3); if (v !== el.value) el.value = v;
});
document.addEventListener('keydown', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.hm !== 'v' || ev.key !== 'Enter') return;
  ev.preventDefault(); QACT.hmSave();
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b35q4b: Object.freeze({ measured: hmMeasured, head: hmHead, editor: hmEditorHTML, err: () => HM_ERR }) }));
/* q4b-end */
/* q5a-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Catat ride" + "Kemajuan" > KRAM, AIR, ELEKTROLIT (tahap 29, q5a) ===== */
// Tiga kolom ride OPSIONAL: kr (kram saat atau sesudah ride: 0 tidak, 1 ringan, 2 sedang, 3 berat), ml (air yang diminum selama ride, bilangan bulat 0-10000) dan lt (elektrolit: 0 tidak, 1 ya).
// Dibersihkan di svCols (jalur tclean saat memuat dan mengimpor cadangan), jadi ikut cadangan JSON tanpa kode cadangan baru. Kolom tidak ada = tidak diisi; kr = 0 = tidak kram (dibedakan supaya perbandingan jujur).
// q5b: ikut ke AI HANYA lewat filter privasi (kram dan elektrolit = grup Kram, air = grup Gizi) dan dibandingkan di Pola kram (Batch 18b) oleh modul q5b di bawah. Tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru (memakai kelas chips/pill/sublbl/inp/bzdl/bzsub/note yang sudah ada).
// Perbandingan di Kemajuan = rata-rata per kelompok, bukan sebab. Patokan buatan saya (bukan dari sumber): minimal 2 ride per kelompok untuk tiap rata-rata. Galat ditelan (pesan di DL.b36q5a.err()) supaya bagian lain kartu Kemajuan tetap tampil.
let BZ_KDERR = '';
const BZ_KD_MIN = 2, BZ_KD_NAME = ['tidak kram', 'kram ringan', 'kram sedang', 'kram berat'];
function bzKdParts(r) {   // keterangan ride (panel hari dan Ride terakhir); kolom tidak ada = tidak ada keterangan
  const p = [];
  if (r.kr === 0 || r.kr === 1 || r.kr === 2 || r.kr === 3) p.push(BZ_KD_NAME[r.kr]);
  if (typeof r.ml === 'number' && Number.isFinite(r.ml)) p.push('minum ' + fmt(r.ml, 0) + ' ml');
  if (r.lt === 1) p.push('elektrolit'); else if (r.lt === 0) p.push('tanpa elektrolit');
  return p;
}
function bzKdFormHTML() {   // blok form "Kram dan minum (opsional)"; ketuk pil yang sama lagi = kosongkan
  const f = rideForm;
  const pills = (act, arr, cur, lbl) => '<div class="chips" role="group" aria-label="' + lbl + '">' + arr.map(a => '<button class="pill" data-q="' + act + '" data-v="' + a[0] + '" aria-pressed="' + (cur === a[0]) + '">' + a[1] + '</button>').join('') + '</div>';
  return '<div class="sublbl" style="margin-top:12px">Kram dan minum (opsional)</div>' +
    '<div class="sublbl t0">Kram saat atau sesudah ride</div>' + pills('rfKr', [[0, 'Tidak'], [1, 'Ringan'], [2, 'Sedang'], [3, 'Berat']], f.kr, 'Kram saat atau sesudah ride') +
    '<div style="margin-top:12px"><div class="sublbl t0">Air yang diminum selama ride</div><label class="inp"><input data-rf="ml" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Air yang diminum selama ride, dalam ml" value="' + esc(f.ml) + '"><span class="u">ml</span></label></div>' +
    '<div class="sublbl t0" style="margin-top:12px">Pakai elektrolit</div>' + pills('rfLt', [[1, 'Ya'], [0, 'Tidak']], f.lt, 'Pakai elektrolit') +
    '<p class="note">Opsional. Tersimpan di perangkat ini. Ikut ke AI hanya bila AI menyala dan grup Kram (kram, elektrolit) atau Gizi (air) dicentang di Pengaturan AI.</p>';
}
function bzKdStat(all) {
  all = all || bzAllRides();
  const G = all.filter(x => x.r.kr === 0 || x.r.kr === 1 || x.r.kr === 2 || x.r.kr === 3);   // ride yang kolom kramnya diisi
  const av = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const grp = L => {
    const mn = L.map(x => x.r.min).filter(v => v != null && v > 0), ml = L.map(x => x.r.ml).filter(v => v != null);
    return { n: L.length, dn: mn.length, d: av(mn), mn: ml.length, m: av(ml) };
  };
  const yes = grp(G.filter(x => x.r.kr >= 1)), no = grp(G.filter(x => x.r.kr === 0));
  return { m: G.length, n: yes.n, yes, no, cmp: yes.n >= BZ_KD_MIN && no.n >= BZ_KD_MIN, dur: yes.dn >= BZ_KD_MIN && no.dn >= BZ_KD_MIN, ml: yes.mn >= BZ_KD_MIN && no.mn >= BZ_KD_MIN };
}
function bzKdHTML(all) {
  try {
    BZ_KDERR = '';
    const S = bzKdStat(all);
    if (!S.m) return '';
    let h = '<h3 class="bzsub">Kram dan minum</h3><p class="note" style="color:var(--ink)">' + S.n + ' dari ' + S.m + ' ride yang diisi tercatat kram.</p>';
    if (S.cmp) {
      const row = (lbl, g) => {
        const bits = [];
        if (S.dur) bits.push('durasi rata-rata ' + fmt(g.d, 0) + ' menit (' + g.dn + ' ride)');
        if (S.ml) bits.push('minum rata-rata ' + fmt(g.m, 0) + ' ml (' + g.mn + ' ride)');
        if (!bits.length) bits.push('durasi dan minum belum cukup diisi untuk dibandingkan');
        return '<li><b>' + lbl + '</b><span>' + g.n + ' ride</span><small>' + esc(bits.join(' · ')) + '</small></li>';
      };
      h += '<ul class="bzdl">' + row('Dengan kram', S.yes) + row('Tanpa kram', S.no) + '</ul>';
    } else h += '<p class="note">Perbandingan muncul bila ada minimal ' + BZ_KD_MIN + ' ride dengan kram dan ' + BZ_KD_MIN + ' ride tanpa kram yang diisi.</p>';
    h += '<p class="note">Ini perbandingan angka, bukan penyebab. Bila kram makin sering atau makin berat, periksakan ke dokter. Catatan ini terpisah dari log kram harian di Jurnal.</p>';
    return h;
  } catch (x) { BZ_KDERR = String((x && x.message) || x); return ''; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b36q5a: Object.freeze({ parts: bzKdParts, form: bzKdFormHTML, stat: bzKdStat, html: bzKdHTML, err: () => BZ_KDERR }) }));
/* q5a-end */
/* q5b-begin */
/* ===== MODUL: LATIHAN > SEPEDA x NUTRISI > POLA KRAM, DAN KOLOM RIDE KE AI (tahap 34, q5b) ===== */
// (1) Pola kram (Batch 18b) mendapat dua kartu bila ada ride: "Ride sepeda" (menit ride di hari kram vs hari tanpa kram, memakai kpCmp/kpCmpCard) dan "Kram menurut hari ride"
//     (dari hari yang ditandai kram atau tidak: persen hari kram pada hari ride vs hari tanpa ride). Tanpa ride sama sekali = kartu tidak digambar, tampilan sama dengan q5a.
// (2) Konteks AI Pola kram (naiKramCtx) mendapat dua baris perbandingan ride HANYA bila grup Latihan dicentang (grup Kram sudah wajib untuk konteks itu).
// (3) Konteks AI Ride (b17cCtx) mendapat kolom ride q5a di "RIDE TERAKHIR", tiap kolom di balik grupnya: kram dan elektrolit = grup Kram, air = grup Gizi.
// Semua angka dihitung di perangkat. Tanpa kunci penyimpanan baru, tanpa kolom data baru, tanpa permintaan jaringan baru. Perbandingan = dua hal bergerak bersama, bukan sebab.
// Patokan minimal memakai konstanta Pola kram yang sudah ada (HX_MIN_N hari berpasangan, HX_GRP_MIN hari per kelompok, HX_OK_N untuk peringatan data sedikit). Galat ditelan (DL.b37q5b.err()).
let BZ_KPERR = '';
function bzKpRide(dd) {   // dd = hari ber-db dalam rentang (dari kpPat); hasil disimpan di P.ride
  try {
    BZ_KPERR = '';
    if (!Array.isArray(dd) || !dd.some(d => bzRides(d).length > 0)) return { show: false, min: null, split: null };
    const min = kpCmp(dd, d => {
      const rs = bzRides(d);
      if (!rs.length) return 0;   // hari tanpa ride = 0 menit
      const m = rs.map(r => r.min).filter(v => typeof v === 'number' && Number.isFinite(v) && v > 0);
      return m.length ? m.reduce((a, v) => a + v, 0) : null;   // hari ber-ride tanpa durasi: tidak dihitung
    });
    let rideN = 0, rideK = 0, noN = 0, noK = 0;
    dd.forEach(d => {
      const e = db[d];
      if (!e || (e.kram !== 'ya' && e.kram !== 'tidak')) return;
      const k = e.kram === 'ya';
      if (bzRides(d).length) { rideN++; if (k) rideK++; } else { noN++; if (k) noK++; }
    });
    const n = rideN + noN, sp = { n, rn: rideN, rk: rideK, nn: noN, nk: noK, st: 'ok', warn: false, rp: null, np: null };
    if (n < HX_MIN_N) sp.st = 'few';
    else if (rideN < HX_GRP_MIN || noN < HX_GRP_MIN) sp.st = 'groups';
    else { sp.rp = Math.round(rideK * 100 / rideN); sp.np = Math.round(noK * 100 / noN); sp.warn = n < HX_OK_N; }
    return { show: true, min, split: sp };
  } catch (x) { BZ_KPERR = String((x && x.message) || x); return { show: false, min: null, split: null }; }
}
function bzKpRideHTML(P) {
  try {
    const R = P && P.ride;
    if (!R || !R.show) return '';
    let h = kpCmpCard('Ride sepeda', 'Menit ride yang dicatat di hari itu; hari tanpa ride dihitung 0 menit. Hari yang punya ride tetapi tanpa durasi tidak dihitung.', R.min, 0, 'menit');
    const s = R.split;
    h += '<div class="sublbl">Hari ride dibanding hari tanpa ride</div><section class="hxcard"><h3>Kram menurut hari ride</h3><p class="cmp">Dari hari yang kamu tandai kram atau tidak kram. Hari tanpa ride = tidak ada ride tercatat di hari itu.</p>';
    if (s.st === 'few') h += '<p>Belum dihitung: butuh minimal ' + HX_MIN_N + ' hari berpasangan, sekarang baru ' + s.n + '.</p>';
    else if (s.st === 'groups') h += '<p>Belum dihitung: butuh minimal ' + HX_GRP_MIN + ' hari ride dan ' + HX_GRP_MIN + ' hari tanpa ride. Sekarang ' + s.rn + ' hari ride dan ' + s.nn + ' hari tanpa ride.</p>';
    else {
      h += '<p>Hari ride: kram di ' + s.rk + ' dari ' + s.rn + ' hari (' + s.rp + '%). Hari tanpa ride: kram di ' + s.nk + ' dari ' + s.nn + ' hari (' + s.np + '%).</p>';
      if (s.warn) h += '<p class="warn">⚠ Data masih sedikit (' + s.n + ' hari). Anggap ini petunjuk awal, bukan kesimpulan; satu dua hari yang ganjil bisa mengubah angkanya.</p>';
    }
    return h + '<p class="note">Ini perbandingan dua kelompok hari, bukan bukti bahwa ride menyebabkan atau mencegah kram.</p></section>';
  } catch (x) { BZ_KPERR = String((x && x.message) || x); return ''; }
}
function bzKpRideAi(P) {   // baris untuk naiKramCtx (P = kpPat(90)); hanya bila grup Latihan dicentang dan ada ride
  try {
    if (!aiOn('latihan')) return [];
    const R = P && P.ride;
    if (!R || !R.show) return [];
    const s = R.split, L = [naiCmpLine('menit ride sepeda di hari itu (hari tanpa ride dihitung 0; hari ber-ride tanpa durasi tidak dihitung)', R.min, 0, 'menit')];
    L.push(s.st === 'few' ? 'kram menurut hari ride: belum dihitung, baru ' + s.n + ' hari berpasangan (minimal ' + HX_MIN_N + ')' :
      s.st === 'groups' ? 'kram menurut hari ride: belum dihitung, baru ' + s.rn + ' hari ride dan ' + s.nn + ' hari tanpa ride (minimal ' + HX_GRP_MIN + ' masing-masing)' :
      'kram menurut hari ride: hari ride kram ' + s.rk + ' dari ' + s.rn + ' hari (' + s.rp + '%), hari tanpa ride kram ' + s.nk + ' dari ' + s.nn + ' hari (' + s.np + '%); dua hal bergerak bersama, bukan sebab' +
        (s.warn ? '; data masih sedikit (' + s.n + ' hari), anggap petunjuk awal' : ''));
    return L;
  } catch (x) { BZ_KPERR = String((x && x.message) || x); return []; }
}
function bzKdAiParts(r) {   // kolom ride q5a untuk "RIDE TERAKHIR" di b17cCtx; kram dan elektrolit = grup Kram, air = grup Gizi; grup mati = null
  const p = { kram: null, ml: null, lt: null };
  try {
    if (aiOn('kram') && (r.kr === 0 || r.kr === 1 || r.kr === 2 || r.kr === 3)) p.kram = 'kram saat atau sesudah ride: ' + ['tidak', 'ringan', 'sedang', 'berat'][r.kr];
    if (aiOn('gizi') && typeof r.ml === 'number' && Number.isFinite(r.ml)) p.ml = 'minum ' + aiN(r.ml) + ' ml selama ride';
    if (aiOn('kram')) { if (r.lt === 1) p.lt = 'pakai elektrolit'; else if (r.lt === 0) p.lt = 'tanpa elektrolit'; }
  } catch (x) { BZ_KPERR = String((x && x.message) || x); }
  return p;
}
function bzKdAiBits(r) { const p = bzKdAiParts(r); return [p.kram, p.ml, p.lt].filter(Boolean); }
function bzKdAiNote(list) {   // satu bagian catatan bila ada kolom kram/minum/elektrolit yang ikut terkirim; hanya menyebut jenis yang benar-benar terkirim; list = ride terakhir ({d, r})
  try {
    if (!Array.isArray(list)) return [];
    const P = list.map(x => bzKdAiParts(x.r)), k = P.some(p => p.kram), m = P.some(p => p.ml), l = P.some(p => p.lt);
    if (!k && !m && !l) return [];
    const out = [[k && 'kram', m && 'minum', l && 'elektrolit'].filter(Boolean).join(', ') + ' di atas hanya catatan pengguna: jangan menyebut sebab, obat, suplemen, atau dosis'];
    if (k) out.push('bila kram makin sering atau makin berat, sarankan periksa ke dokter');
    return out;
  } catch (x) { BZ_KPERR = String((x && x.message) || x); return []; }
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b37q5b: Object.freeze({ ride: bzKpRide, html: bzKpRideHTML, ai: bzKpRideAi, bits: bzKdAiBits, parts: bzKdAiParts, note: bzKdAiNote, err: () => BZ_KPERR }) }));
/* q5b-end */
/* q6a-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Zona latihan" > FTP, W/KG, ZONA DAYA (tahap 37, q6a) ===== */
// Catatan tes FTP: tdb[tanggal].ft = [{id, m, p, t}] (m: c20 = tes 20 menit, rmp = tes rampa, dir = isi langsung; p = daya yang diketik, bilangan bulat 30-1200 W; t = cap waktu), paling banyak 5 per hari.
// FTP TIDAK disimpan: dihitung saat tampil = p x 95% (c20), p x 75% (rmp) atau p (dir), dibulatkan ke bilangan bulat (setengah ke atas, pakai bilangan bulat murni), harus 30-700 W. Pembersih ada di tclean (pola yang sama, ditulis ulang di sana supaya tidak bergantung urutan modul).
// W/kg = FTP / berat rata-rata pekan dari Audit mingguan (wdb[...].bw, 30-300 kg); tidak ada isian berat baru. Zona daya = tabel Coggan (Zone 1-5; Zone 6-7 tidak dipakai di program ini).
// Tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru (memakai kelas chips/pill/sublbl/inp/bzdl/bzsub/bzzr/note yang sudah ada). Sejak q6b3 FTP, metode, dan zona daya ikut konteks AI Ride (grup Latihan); W/kg hanya dengan grup Berat dan ukuran badan; angka berat tidak dikirim. Galat ditelan (pesan di DL.b38q6a.err()) supaya bagian lain kartu tetap tampil.
const FT_N = { c20: 'Tes 20 menit', rmp: 'Tes rampa', dir: 'Isi langsung' }, FT_K = { c20: 95, rmp: 75, dir: 100 };
const FT_PL = [30, 1200], FT_VL = [30, 700], FT_DAY = 5;
const FT_ZP = [[1, 0, 55], [2, 56, 75], [3, 76, 90], [4, 91, 105], [5, 106, 120]];   // zona, batas bawah %, batas atas % FTP (Coggan); Zone 1 = di bawah 55%
let FT = { m: null, p: '' }, FT_ERR = '';
const ftHas = m => m === 'c20' || m === 'rmp' || m === 'dir';
const ftPct = (v, pct) => Math.floor((v * pct + 50) / 100);   // pembulatan setengah ke atas dengan bilangan bulat murni (250 x 95 / 100 = 237,5 pasti 238)
const ftVal = (m, p) => (ftHas(m) && Number.isInteger(p) && p >= FT_PL[0] && p <= FT_PL[1]) ? ftPct(p, FT_K[m]) : null;   // FTP hasil hitung; null bila masukan tidak sah
const ftOkV = v => Number.isInteger(v) && v >= FT_VL[0] && v <= FT_VL[1];
const ftN2 = n => n.toFixed(2).replace('.', ',');
function ftAll() {   // semua tes sah, terbaru dulu (tanggal, lalu cap waktu, lalu urutan terbalik)
  const L = [];
  Object.keys(tdb).forEach(d => {
    const t = tdb[d]; if (!DATE_RE.test(d) || !t || !Array.isArray(t.ft)) return;
    t.ft.forEach((x, i) => { const v = x ? ftVal(x.m, x.p) : null; if (ftOkV(v)) L.push({ d, i, id: x.id, m: x.m, p: x.p, t: x.t || 0, v }); });
  });
  return L.sort((a, b) => a.d !== b.d ? (a.d < b.d ? 1 : -1) : ((b.t - a.t) || (b.i - a.i)));
}
function ftKg(day) {   // berat rata-rata pekan terakhir yang punya bw (30-300 kg) pada atau sebelum pekan `day`; tanpa day = yang terbaru
  const lim = day ? weekStart(day) : null;
  const ks = Object.keys(wdb).filter(w => DATE_RE.test(w) && (!lim || w <= lim) && kgOk(num(wdb[w].bw))).sort();
  return ks.length ? { w: ks[ks.length - 1], kg: num(wdb[ks[ks.length - 1]].bw) } : null;
}
function ftZones(v) {   // 5 zona dalam watt dari FTP v; Zone 1 hanya batas atas (di bawah 55%)
  return FT_ZP.map(z => ({ z: z[0], a: z[1], b: z[2], lo: z[0] === 1 ? null : ftPct(v, z[1]), hi: ftPct(v, z[2]) }));
}
function ftChange(L) {   // tes terbaru dibanding tes sebelumnya; beda metode = tidak sebanding
  if (L.length < 2) return null;
  const a = L[0], b = L[1];
  if (a.m !== b.m) return { same: false, b };
  return { same: true, b, dv: a.v - b.v, pct: (a.v - b.v) / b.v * 100 };
}
function ftPvText() {
  const m = FT.m; if (!m) return 'Pilih metode tes dulu.';
  const hint = m === 'c20' ? 'Isi daya rata-rata terbaik selama 20 menit; FTP = 95% darinya.' : m === 'rmp' ? 'Isi daya terbaik selama 1 menit di akhir tes rampa; FTP = 75% darinya.' : 'Isi FTP dari perangkat atau aplikasi.';
  const p = /^\d{1,4}$/.test(FT.p) ? Number(FT.p) : null, v = p == null ? null : ftVal(m, p);
  if (v == null) return hint;
  return ftOkV(v) ? hint + ' Hasil: FTP ' + v + ' W.' : hint + ' Hasil ' + v + ' W di luar 30–700 W, tidak bisa disimpan.';
}
function ftPvUpdate() { const e = $('#trainBody [data-ft="pv"]'); if (e) e.textContent = ftPvText(); }
function ftFormHTML() {
  const pills = '<div class="chips" role="group" aria-label="Metode tes FTP">' + ['c20', 'rmp', 'dir'].map(m => '<button class="pill" data-q="ftM" data-v="' + m + '" aria-pressed="' + (FT.m === m) + '">' + FT_N[m] + '</button>').join('') + '</div>';
  return '<div class="sublbl" style="margin-top:14px">Catat tes FTP</div>' + pills +
    '<div class="sublbl" style="margin-top:12px">Daya</div><label class="inp"><input data-ft="p" inputmode="numeric" autocomplete="off" placeholder="mis. 250" value="' + esc(FT.p) + '" aria-label="Daya dalam watt"><span class="u">W</span></label>' +
    '<p class="note" data-ft="pv">' + esc(ftPvText()) + '</p>' +
    '<button class="btn primary wide" style="margin-top:12px" data-q="ftSave">Simpan tes FTP</button>';
}
function ftHTML() {
  try {
    FT_ERR = '';
    const L = ftAll(), top = L[0] || null;
    let h = '<h3 class="bzsub">FTP dan zona daya (opsional)</h3>';
    if (!top) h += '<p class="note">Belum ada catatan FTP. Isi bila kamu punya power meter, tes di sepeda statis, atau angka FTP dari aplikasi. Dari FTP dihitung W/kg (memakai berat di Audit mingguan) dan zona daya.</p>';
    else {
      const kg = ftKg(null), ch = ftChange(L);
      let li = '<li><b>FTP terbaru</b><span>' + top.v + ' W</span><small>' + FT_N[top.m] + ' · ' + esc(dayShort(top.d)) + (top.m === 'dir' ? '' : ' (' + top.p + ' W × ' + FT_K[top.m] + '%)') + '</small></li>';
      li += kg
        ? '<li><b>W/kg</b><span>' + ftN2(top.v / kg.kg) + '</span><small>FTP ' + top.v + ' W ÷ berat ' + esc(fmt(kg.kg, 1)) + ' kg (rata-rata pekan ' + esc(shortDate(kg.w)) + ')</small></li>'
        : '<li><b>W/kg</b><span>–</span><small>Isi berat badan di Audit mingguan untuk menghitung W/kg.</small></li>';
      if (ch) li += '<li><b>Dibanding tes sebelumnya</b><span>' + (ch.same ? (ch.dv > 0 ? '+' : ch.dv < 0 ? '−' : '') + Math.abs(ch.dv) + ' W' : '–') + '</span><small>' +
        (ch.same ? (ch.dv === 0 ? 'Sama dengan' : (ch.dv > 0 ? 'Naik ' : 'Turun ') + fmt(Math.abs(ch.pct), 1) + '% dari') + ' tes ' + esc(dayShort(ch.b.d)) + ' (' + ch.b.v + ' W, metode sama)'
          : 'Beda metode dengan tes ' + esc(dayShort(ch.b.d)) + ' (' + FT_N[ch.b.m] + '), tidak sebanding') + '</small></li>';
      h += '<ul class="bzdl">' + li + '</ul>';
    }
    h += ftFormHTML();
    if (top) {
      h += '<div class="sublbl" style="margin-top:14px">Riwayat tes (' + Math.min(L.length, 5) + ' terakhir)</div>' + ftChartHTML(L) + '<ul class="bzdl">' + L.slice(0, 5).map(x => {
        const k = ftKg(x.d);
        return '<li><b>' + esc(dayShort(x.d)) + ' · ' + FT_N[x.m] + '</b><span>' + x.v + ' W</span><small>' + (x.m === 'dir' ? 'FTP diisi langsung' : 'dari ' + x.p + ' W × ' + FT_K[x.m] + '%') +
          (k ? ' · ' + ftN2(x.v / k.kg) + ' W/kg (berat pekan ' + esc(shortDate(k.w)) + ' ' + esc(fmt(k.kg, 1)) + ' kg)' : ' · tanpa berat, W/kg tidak dihitung') + '</small>' +
          '<button class="btn sm ghost" data-q="ftDel" data-d="' + x.d + '" data-id="' + esc(x.id) + '" aria-label="Hapus tes FTP ' + esc(dayShort(x.d)) + ' (' + x.v + ' W)">Hapus</button></li>';
      }).join('') + '</ul>';
      h += '<button class="btn sm ghost" style="margin-top:10px" data-q="ftCsv">Unduh CSV tes FTP</button>';
      const type = curBk(), nowZ = type === 'thr' ? [3, 4] : type === 'vo2' ? [5] : [2];
      h += '<div class="sublbl" style="margin-top:14px">Zona daya (dari FTP ' + top.v + ' W)</div>' + ftZones(top.v).map(r => {
        const now = nowZ.includes(r.z), nm = ZONES[r.z - 1].nama;
        return '<div class="bzzr' + (now ? ' now' : '') + '"><span class="bzzn" aria-hidden="true">' + r.z + '</span><div class="bzzt"><b>Zone ' + r.z + ': ' + esc(nm) + '</b><small class="bzzb">' + (r.lo == null ? '&lt; ' + r.hi + ' W' : '≈ ' + r.lo + '–' + r.hi + ' W') + '</small></div>' +
          '<span class="bzzp">' + (r.lo == null ? '&lt; 55%' : r.a + '–' + r.b + '%') + (now ? '<span class="bzzy">Sesi ini</span>' : '') + '</span></div>';
      }).join('') +
        '<p class="note">Persen zona dari tabel Coggan (Zone 1 di bawah 55%, 2: 56–75%, 3: 76–90%, 4: 91–105%, 5: 106–120% FTP); watt dibulatkan, jadi ada celah kecil antar zona akibat pembulatan tabelnya. Coggan juga punya Zone 6 (121–150%) dan Zone 7 (di atas 150%) yang tidak dipakai di program ini. Zona daya dan zona detak jantung di atas adalah dua ukuran berbeda, jadi angkanya tidak harus selaras; uji bicara dan RPE tetap penentu.</p>';
    }
    h += '<p class="note">Tes 20 menit: FTP = 95% dari daya rata-rata terbaik selama 20 menit. Tes rampa: FTP = 75% dari daya terbaik selama 1 menit. Galat tiap tes kira-kira ±3–5% (rampa lebih lebar), jadi anggap FTP sebagai perkiraan. Pakai metode yang sama tiap kali supaya perubahan bisa dibandingkan; hasil beda metode tidak sebanding. Tes usaha maksimal itu berat: lakukan hanya bila sehat dan sudah terbiasa ride; nyeri dada, pusing berat, atau pingsan: berhenti dan temui dokter. Catatan ini bukan diagnosis. Tersimpan di perangkat ini, ikut cadangan JSON, dan tidak dikirim ke AI.</p>';
    return h;
  } catch (x) { FT_ERR = String((x && x.message) || x); return ''; }
}
/* q6b2-begin */
// Grafik tren FTP: dipasang di Riwayat tes bila ada minimal 2 tes sah (maksimal 12 terakhir, lama di kiri). Garis HANYA menyambung tes berurutan bermetode SAMA (beda metode tidak sebanding, sama dengan ftChange); penanda per metode: lingkaran = tes 20 menit, belah ketupat = tes rampa, persegi = isi langsung.
// Memakai kelas .chart yang sudah ada (polyline.ln, circle.dt, rect.dl, rect.n, text.vl); tanpa CSS baru, tanpa kunci penyimpanan, tanpa jaringan, tidak ke AI.
const FT_CH_MAX = 12, FT_MK = { c20: 'Lingkaran = Tes 20 menit', rmp: 'belah ketupat = Tes rampa', dir: 'persegi = Isi langsung' };
function ftChartSVG(pts) {   // pts: tes kronologis (lama dulu), objek {d, m, v}, minimal 2
  const W = 300, H = 124, B = 16, T = 20, n = pts.length, step = W / n, x = i => step * i + step / 2;
  const vals = pts.map(p => p.v), lo0 = Math.min.apply(null, vals), hi0 = Math.max.apply(null, vals);
  const pad = Math.max((hi0 - lo0) * .3, hi0 * .05, 1), lo = Math.max(0, lo0 - pad), hi = hi0 + pad;
  const y = v => T + (H - B - T) * (1 - (v - lo) / (hi - lo));
  const a = pts[0], z = pts[n - 1];
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Tren FTP, ' + n + ' tes terakhir, dari ' + a.v + ' W (' + dayShort(a.d) + ') ke ' + z.v + ' W (' + dayShort(z.d) + ')') + '">';
  let i = 0;
  while (i < n) {
    let j = i; while (j + 1 < n && pts[j + 1].m === pts[i].m) j++;
    if (j > i) s += '<polyline class="ln" points="' + pts.slice(i, j + 1).map((p, k) => x(i + k).toFixed(1) + ',' + y(p.v).toFixed(1)).join(' ') + '"/>';
    i = j + 1;
  }
  pts.forEach((p, k) => {
    const cx = x(k).toFixed(1), cy = y(p.v).toFixed(1);
    s += p.m === 'c20' ? '<circle class="dt" cx="' + cx + '" cy="' + cy + '" r="3"/>'
      : p.m === 'rmp' ? '<rect class="dl" x="' + (x(k) - 3.2).toFixed(1) + '" y="' + (y(p.v) - 3.2).toFixed(1) + '" width="6.4" height="6.4" transform="rotate(45 ' + cx + ' ' + cy + ')"/>'
      : '<rect class="n" x="' + (x(k) - 3).toFixed(1) + '" y="' + (y(p.v) - 3).toFixed(1) + '" width="6" height="6"/>';
    s += '<text class="vl" x="' + cx + '" y="' + (y(p.v) - 9).toFixed(1) + '" text-anchor="middle">' + p.v + '</text>';
  });
  const every = n > 8 ? 2 : 1;
  pts.forEach((p, k) => { if ((n - 1 - k) % every === 0) { const d = pd(p.d); s += '<text x="' + x(k).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + d.getDate() + '/' + (d.getMonth() + 1) + '</text>'; } });
  return s + '</svg>';
}
function ftChartHTML(L) {   // L = ftAll() (terbaru dulu)
  if (L.length < 2) return '';
  const pts = L.slice(0, FT_CH_MAX).reverse().map(x => ({ d: x.d, m: x.m, v: x.v }));
  const ms = ['c20', 'rmp', 'dir'].filter(m => pts.some(p => p.m === m)).map(m => FT_MK[m]);
  return '<div class="chart"><div class="ch">Tren FTP <small>' + pts.length + ' tes terakhir</small></div>' + ftChartSVG(pts) +
    '<p class="note">' + ms.join(' · ') + '. Garis hanya menyambung tes berurutan dengan metode sama, karena beda metode tidak sebanding.</p></div>';
}
/* q6b2-end */
/* q6b3-begin */
// FTP ke konteks AI Ride (q6b3): bagian "FTP DAN ZONA DAYA" di b17cCtx, hanya bila ada minimal satu tes FTP sah (tanpa tes = tidak ada bagian, konteks IDENTIK dengan q6b2). Grup Latihan sudah menjadi syarat b17cCtx.
// W/kg HANYA bila grup 'badan' dicentang dan ada berat; angka berat TIDAK pernah dikirim. Tanpa anjuran tes ulang (tidak ada sumber terverifikasi untuk selang yang disarankan): hanya angka hari sejak tes terakhir. Tanpa kunci penyimpanan, jaringan, atau CSS baru. Galat ditelan (bagian dilewati, bagian lain konteks tetap).
function b48FtpLines() {
  try {
    const L = ftAll(); if (!L.length) return [];
    const top = L[0], t = today(), out = [];
    out.push('FTP terbaru: ' + top.v + ' W (' + FT_N[top.m] + ', ' + dayShort(top.d) + (top.m === 'dir' ? '' : '; dari ' + top.p + ' W × ' + FT_K[top.m] + '%') + ')');
    const ch = ftChange(L);
    if (ch) out.push(ch.same
      ? 'Dibanding tes sebelumnya (' + dayShort(ch.b.d) + ', ' + ch.b.v + ' W, metode sama): ' + (ch.dv === 0 ? 'sama' : (ch.dv > 0 ? 'naik ' : 'turun ') + Math.abs(ch.dv) + ' W (' + aiN(Math.abs(ch.pct), 1) + '%)')
      : 'Tes sebelumnya (' + dayShort(ch.b.d) + ', ' + FT_N[ch.b.m] + ') beda metode, tidak sebanding');
    const df = diffDays(top.d, t);
    out.push('Jumlah tes tercatat: ' + L.length + '; tes terbaru ' + (df === 0 ? 'hari ini' : df > 0 ? df + ' hari lalu' : 'bertanggal di masa depan'));
    out.push('Zona daya dari FTP ' + top.v + ' W (tabel Coggan): ' + ftZones(top.v).map(r => 'Zone ' + r.z + (r.lo == null ? ' < ' + r.hi : ' ' + r.lo + '–' + r.hi) + ' W').join('; '));
    if (!aiOn('badan')) out.push('W/kg tidak disertakan (grup Berat dan ukuran badan tidak dicentang)');
    else {
      const kg = ftKg(null);
      out.push(kg ? 'W/kg: ' + ftN2(top.v / kg.kg) + ' (FTP dibagi berat rata-rata pekan terbaru di Audit mingguan; angka beratnya tidak dikirim)' : 'W/kg tidak dihitung (belum ada berat di Audit mingguan)');
    }
    return out;
  } catch (x) { return []; }
}
/* q6b3-end */
/* q6b1-begin */
// CSV tes FTP: terpisah dari CSV sepeda (satu tes bukan satu ride). Satu baris per tes sah, lama dulu; berat dari pekan pada atau sebelum tes (ftKg), kosong bila tidak ada.
function toFtpCSV() {
  const head = ['tanggal', 'metode', 'daya_w', 'faktor_persen', 'ftp_w', 'berat_kg', 'wkg'];
  const rows = ftAll().slice().reverse().map(x => {
    const k = ftKg(x.d);
    return [x.d, FT_N[x.m], x.p, FT_K[x.m], x.v, k ? k.kg : '', k ? (x.v / k.kg).toFixed(2) : ''].map(csvt).join(',');
  });
  return [head.join(',')].concat(rows).join('\n');
}
QACT.ftCsv = () => { if (!ftAll().length) { toast('Belum ada catatan tes FTP'); return; } csvSheet('CSV tes FTP', toFtpCSV(), 'ftp'); };
/* q6b1-end */
QACT.ftM = el => {
  const v = el.dataset.v; if (!ftHas(v)) return;
  FT.m = FT.m === v ? null : v;
  $$('#trainBody [data-q="ftM"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === FT.m)));
  ftPvUpdate();
};
QACT.ftSave = () => {
  const el = $('#trainBody input[data-ft="p"]'), raw = (el ? String(el.value) : String(FT.p || '')).trim();
  if (!FT.m) { toast('Pilih metode tes dulu: tes 20 menit, tes rampa, atau isi FTP langsung.'); return; }
  if (!raw) { toast('Isi daya dalam watt (bilangan bulat).'); return; }
  const p = /^\d{1,4}$/.test(raw) ? +raw : NaN;
  if (!(p >= FT_PL[0] && p <= FT_PL[1])) { toast('Daya harus bilangan bulat antara ' + FT_PL[0] + ' dan ' + FT_PL[1] + ' W (tanpa titik atau koma).'); return; }
  const v = ftVal(FT.m, p);
  if (!ftOkV(v)) { toast('FTP hasil hitung ' + v + ' W di luar ' + FT_VL[0] + '–' + FT_VL[1] + ' W, jadi tidak disimpan. Periksa angka atau metodenya.'); return; }
  const d = today(), cur = tdb[d];
  if (cur && Array.isArray(cur.ft) && cur.ft.length >= FT_DAY) { toast('Sudah ' + FT_DAY + ' catatan FTP hari ini. Hapus salah satu bila perlu mencatat lagi.'); return; }
  const t = cur || (tdb[d] = tblank());
  if (!Array.isArray(t.ft)) t.ft = [];
  t.ft.push({ id: ('f' + Date.now().toString(36) + t.ft.length).slice(0, 24), m: FT.m, p, t: Date.now() });
  t.updated = Date.now(); queueSave('t');
  FT.m = null; FT.p = '';
  toast('Tes FTP tersimpan: FTP ' + v + ' W. Zona daya diperbarui.'); renderTrain();
};
QACT.ftDel = el => {
  const d = el.dataset.d, id = el.dataset.id, t = tdb[d]; if (!t || !Array.isArray(t.ft)) return;
  const i = t.ft.findIndex(x => x.id === id); if (i < 0) return;
  const gone = t.ft[i];
  t.ft.splice(i, 1); if (!t.ft.length) delete t.ft;
  t.updated = Date.now(); queueSave('t');
  toast('Catatan FTP dihapus.', { label: 'Urungkan', fn: () => {
    const u = tdb[d] || (tdb[d] = tblank());
    if (!Array.isArray(u.ft)) u.ft = [];
    if (u.ft.length >= FT_DAY || u.ft.some(x => x.id === gone.id)) { toast('Tidak bisa mengurungkan: hari itu sudah ' + FT_DAY + ' catatan.'); return; }
    u.ft.splice(Math.min(i, u.ft.length), 0, gone); u.updated = Date.now(); queueSave('t');
    if (curView === 'train') renderTrain();
  } });
  renderTrain();
};
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.ft !== 'p') return;
  const v = String(el.value).replace(/\D/g, '').slice(0, 4); if (v !== el.value) el.value = v;
  FT.p = v; ftPvUpdate();
});
document.addEventListener('keydown', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.ft !== 'p' || ev.key !== 'Enter') return;
  ev.preventDefault(); QACT.ftSave();
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b38q6a: Object.freeze({ val: ftVal, pct: ftPct, all: ftAll, kg: ftKg, zones: ftZones, change: ftChange, html: ftHTML, pv: ftPvText, state: () => ({ m: FT.m, p: FT.p }), reset: () => { FT.m = null; FT.p = ''; }, err: () => FT_ERR, lim: Object.freeze({ P: FT_PL, V: FT_VL, DAY: FT_DAY }) }) }));
window.DL = Object.freeze(Object.assign({}, window.DL, { b46q6b1: Object.freeze({ csv: toFtpCSV }), b47q6b2: Object.freeze({ svg: ftChartSVG, html: ftChartHTML, max: FT_CH_MAX }), b48q6b3: Object.freeze({ lines: b48FtpLines }) }));
/* q6a-end */
/* q7a-begin */
/* ===== MODUL: LATIHAN > SEPEDA > "Perawatan sepeda" (tahap 39, q7a) ===== */
// Catatan perawatan: tdb[HARI PENCATATAN].mt = [{id, c, d, i, t}] (c: lu = lumasi rantai, ch = periksa/ganti rantai, ti = ban, br = kampas rem, sv = servis bengkel; d = tanggal perawatan; i = interval km berikutnya (opsional, 50-20000); t = cap waktu), paling banyak 8 per hari.
// Disimpan di bawah hari pencatatan (bukan tanggal perawatan) supaya kalender Riwayat (hxFirstMonth memakai kunci tdb tertua) tidak melebar bila tanggal perawatan lama.
// km sejak perawatan = jumlah km ride pada tanggal SESUDAH d sampai hari ini (ride pada tanggal yang sama tidak dihitung). Status: Aman (< 80%), Segera (80% sampai < 100%), Waktunya (>= 100%) dari interval; bilangan bulat murni dalam satuan 0,1 km.
// Pembersih ada di tclean (pola yang sama, ditulis ulang di sana supaya tidak bergantung urutan modul). Tanpa kunci penyimpanan, permintaan jaringan, atau CSS baru; tidak dikirim ke AI. Galat ditelan (pesan di DL.b40q7a.err()) supaya Sepeda tetap tampil.
const MT_ORD = ['lu', 'ch', 'ti', 'br', 'sv'];
const MT_N = { lu: 'Lumasi rantai', ch: 'Periksa atau ganti rantai', ti: 'Periksa atau ganti ban', br: 'Periksa atau ganti kampas rem', sv: 'Servis di bengkel' };
const MT_DEF = { lu: 200, ch: 3000, ti: 4000, br: 1000, sv: 3000 };
const MT_DEFM = { lu: 0, ch: 0, ti: 0, br: 0, sv: 12 };   // q8a: batas bulan standar (0 = tanpa batas bulan); hanya servis di bengkel 12 bulan (pilihan saya; sumber: servis 6-12 bulan, rem hidrolik minimal setahun)
const MT_ST = { none: 'Belum dicatat', ok: 'Aman', soon: 'Segera', over: 'Waktunya' };
const MT_IL = [50, 20000], MT_DAY = 8, MT_D0 = '2000-01-01';
let MT = { c: null, d: '', i: '', m: '' }, MT_ERR = '';
const mtHas = c => typeof c === 'string' && MT_ORD.includes(c);
const mtDateOk = s => typeof s === 'string' && DATE_RE.test(s) && s >= MT_D0 && ymd(pd(s)) === s;
const mtIvOk = v => Number.isInteger(v) && v >= MT_IL[0] && v <= MT_IL[1];
const mtMoOk = v => Number.isInteger(v) && v >= 0 && v <= 60;   // q8a
function mtAll() {   // semua catatan sah, terbaru dulu (tanggal perawatan, cap waktu, hari pencatatan, urutan)
  const L = [];
  Object.keys(tdb).forEach(day => {
    const t = tdb[day]; if (!DATE_RE.test(day) || !t || !Array.isArray(t.mt)) return;
    t.mt.forEach((x, i) => { if (x && mtHas(x.c) && mtDateOk(x.d)) L.push({ day, idx: i, id: x.id, c: x.c, d: x.d, i: mtIvOk(x.i) ? x.i : null, m: mtMoOk(x.m) ? x.m : null, t: x.t || 0 }); });
  });
  return L.sort((a, b) => a.d !== b.d ? (a.d < b.d ? 1 : -1) : ((b.t - a.t) || (a.day !== b.day ? (a.day < b.day ? 1 : -1) : b.idx - a.idx)));
}
const mtLast = (c, L, t) => (L || mtAll()).find(x => x.c === c && x.d <= (t || today())) || null;   // catatan terbaru komponen c (tanggal di masa depan diabaikan)
const mtIv = (c, L, t) => { const l = mtLast(c, L, t); return l && l.i ? l.i : MT_DEF[c]; };
const mtMo = (c, L, t) => { const l = mtLast(c, L, t); return l && l.m != null ? l.m : MT_DEFM[c]; };   // q8a: batas bulan efektif komponen c
function mtAddMonths(d, m) {   // q8a: tanggal d + m bulan kalender; hari dipotong ke hari terakhir bulan tujuan
  const p = pd(d), y = p.getFullYear(), mo = p.getMonth() + m, dd = p.getDate(), last = new Date(y, mo + 1, 0).getDate();
  return ymd(new Date(y, mo, Math.min(dd, last)));
}
const mtDays = (a, b) => Math.round((pd(b) - pd(a)) / 86400000);   // q8a: selisih hari kalender a ke b
const MT_RK = { none: 0, ok: 1, soon: 2, over: 3 }, MT_RN = ['none', 'ok', 'soon', 'over'];
function mtMoLine(x) {   // q8a: baris batas bulan (kosong bila tanpa batas bulan)
  if (!(x.mo > 0) || !x.due) return '';
  const rd = x.D - x.E;
  return '<small>' + esc('batas ' + x.mo + ' bulan: jatuh tempo ' + dayShort(x.due) + (rd > 0 ? ', sisa ' + rd + ' hari' : rd === 0 ? ' (hari ini)' : ', lewat ' + (-rd) + ' hari')) + '</small>';
}
const mtMoHist = x => { const e = x.m != null ? x.m : MT_DEFM[x.c]; return e > 0 ? ' · batas ' + e + ' bulan' : (MT_DEFM[x.c] > 0 ? ' · tanpa batas bulan' : ''); };
function mtKm(d, t) {   // km ride pada tanggal sesudah d sampai t (satuan 0,1 km, bulat); ride tanpa jarak atau negatif dihitung terpisah
  let k10 = 0, nokm = 0;
  Object.keys(tdb).forEach(x => {
    if (!DATE_RE.test(x) || x <= d || x > t) return;
    bzRides(x).forEach(r => { if (r.km != null && Number.isFinite(r.km) && r.km >= 0) k10 += Math.round(r.km * 10); else nokm++; });
  });
  return { k10, nokm };
}
function mtInfo(c, L, t) {
  t = t || today(); L = L || mtAll();
  const last = mtLast(c, L, t), iv = last && last.i ? last.i : MT_DEF[c], mo = last && last.m != null ? last.m : MT_DEFM[c];
  if (!last) return { c, last: null, iv, mo, st: 'none', stK: 'none', stM: 'none', k10: 0, nokm: 0, due: null, E: 0, D: 0 };
  const g = mtKm(last.d, t), stK = g.k10 >= 10 * iv ? 'over' : g.k10 >= 8 * iv ? 'soon' : 'ok';
  let stM = 'none', due = null, E = 0, D = 0;
  if (mo > 0) { due = mtAddMonths(last.d, mo); E = mtDays(last.d, t); D = mtDays(last.d, due); stM = E >= D ? 'over' : E * 10 >= 8 * D ? 'soon' : 'ok'; }
  const st = MT_RN[Math.max(MT_RK[stK], MT_RK[stM])];   // q8a: yang lebih parah dari status km dan status bulan
  return { c, last, iv, mo, st, stK, stM, k10: g.k10, nokm: g.nokm, due, E, D };
}
function mtRow(x) {
  if (x.st === 'none') return '<li><b>' + esc(MT_N[x.c]) + '</b><span>' + MT_ST.none + '</span><small>Belum ada catatan. Interval standar ' + fmt(x.iv, 0) + ' km' + (x.mo ? ' atau ' + x.mo + ' bulan' : '') + '.</small></li>';
  const left = x.stK === 'over' ? 'lewat ' + fmt(Math.floor((x.k10 - 10 * x.iv) / 10), 0) + ' km' : 'sisa ' + fmt(Math.floor((10 * x.iv - x.k10) / 10), 0) + ' km';
  return '<li><b>' + esc(MT_N[x.c]) + '</b><span>' + MT_ST[x.st] + '</span><small>' + esc(fmt(x.k10 / 10, 1) + ' km sejak ' + dayShort(x.last.d) + ' · interval ' + fmt(x.iv, 0) + ' km · ' + left + (x.nokm ? ' · ' + x.nokm + ' ride tanpa jarak tidak dihitung' : '')) + '</small>' + mtMoLine(x) + '</li>';
}
function mtSum() {   // ringkasan kartu: satu sepeda
  const L = mtAll(), t = today(), I = MT_ORD.map(c => mtInfo(c, L, t)), n = I.filter(x => x.st !== 'none').length;
  if (!n) return 'Belum ada catatan · km sejak perawatan dan pengingat';
  const over = I.filter(x => x.st === 'over').length, soon = I.filter(x => x.st === 'soon').length, p = [];
  if (over) p.push(over + ' waktunya');
  if (soon) p.push(soon + ' segera');
  if (!p.length) p.push('Semua aman');
  if (n < MT_ORD.length) p.push(n + ' dari ' + MT_ORD.length + ' dicatat');
  return p.join(' · ');
}
function mtPvText() {
  const c = MT.c; if (!c) return 'Pilih komponen dulu.';
  const cur = mtIv(c), raw = String(MT.i || '');
  const base = 'Interval berlaku sekarang ' + fmt(cur, 0) + ' km' + (cur === MT_DEF[c] ? ' (standar)' : ' (kamu atur)') + '. Kosongkan isian untuk tetap memakainya.';
  if (!raw) return base;
  const v = /^\d{1,5}$/.test(raw) ? Number(raw) : NaN;
  return mtIvOk(v) ? 'Interval berikutnya ' + fmt(v, 0) + ' km.' : 'Interval harus bilangan bulat ' + fmt(MT_IL[0], 0) + '–' + fmt(MT_IL[1], 0) + ' km.';
}
function mtPvMoText() {   // q8a
  const c = MT.c; if (!c) return 'Pilih komponen dulu.';
  const cur = mtMo(c), raw = String(MT.m || '');
  const base = 'Batas bulan berlaku sekarang ' + (cur > 0 ? cur + ' bulan' : 'tidak ada') + (cur === MT_DEFM[c] ? ' (standar)' : ' (kamu atur)') + '. Kosongkan isian untuk tetap memakainya. Isi 0 untuk tanpa batas bulan.';
  if (!raw) return base;
  const v = /^\d{1,2}$/.test(raw) ? Number(raw) : NaN;
  return mtMoOk(v) ? (v > 0 ? 'Batas bulan berikutnya ' + v + ' bulan.' : 'Tanpa batas bulan.') : 'Batas bulan harus bilangan bulat 0–60.';
}
function mtPvUpdate() {
  const e = $('#trainBody [data-mt="pv"]'); if (e) e.textContent = mtPvText();
  const i = $('#trainBody input[data-mt="i"]'); if (i) i.placeholder = MT.c ? String(mtIv(MT.c)) : 'km';
  const e2 = $('#trainBody [data-mt="pvm"]'); if (e2) e2.textContent = mtPvMoText();
  const m2 = $('#trainBody input[data-mt="m"]'); if (m2) m2.placeholder = MT.c ? String(mtMo(MT.c)) : 'bulan';
}
function mtFormHTML() {
  const t = today();
  const pills = '<div class="chips" role="group" aria-label="Komponen yang dirawat">' + MT_ORD.map(c => '<button class="pill" data-q="mtC" data-v="' + c + '" aria-pressed="' + (MT.c === c) + '">' + esc(MT_N[c]) + '</button>').join('') + '</div>';
  return '<div class="sublbl" style="margin-top:14px">Catat perawatan</div>' + pills +
    '<div class="sublbl" style="margin-top:12px">Tanggal perawatan</div><label class="inp"><input type="date" data-mt="d" min="' + MT_D0 + '" max="' + t + '" value="' + esc(MT.d || t) + '" aria-label="Tanggal perawatan"></label>' +
    '<div class="sublbl" style="margin-top:12px">Interval berikutnya (opsional)</div><label class="inp"><input data-mt="i" inputmode="numeric" autocomplete="off" placeholder="' + (MT.c ? mtIv(MT.c) : 'km') + '" value="' + esc(MT.i) + '" aria-label="Interval berikutnya dalam km"><span class="u">km</span></label>' +
    '<p class="note" data-mt="pv">' + esc(mtPvText()) + '</p>' +
    '<div class="sublbl" style="margin-top:12px">Batas bulan (opsional)</div><label class="inp"><input data-mt="m" inputmode="numeric" autocomplete="off" placeholder="' + (MT.c ? mtMo(MT.c) : 'bulan') + '" value="' + esc(MT.m) + '" aria-label="Batas bulan berikutnya"><span class="u">bulan</span></label>' +
    '<p class="note" data-mt="pvm">' + esc(mtPvMoText()) + '</p>' +
    '<button class="btn primary wide" style="margin-top:12px" data-q="mtSave">Simpan perawatan</button>';
}
function mtHTML() {
  const L = mtAll(), t = today();
  let h = '<ul class="bzdl">' + MT_ORD.map(c => mtRow(mtInfo(c, L, t))).join('') + '</ul>';
  h += mtFormHTML();
  if (L.length) {
    h += '<div class="sublbl" style="margin-top:14px">Riwayat perawatan (' + Math.min(L.length, 5) + ' terakhir)</div><ul class="bzdl">' + L.slice(0, 5).map(x =>
      '<li><b>' + esc(dayShort(x.d)) + ' · ' + esc(MT_N[x.c]) + '</b><span>' + (x.i ? fmt(x.i, 0) + ' km' : 'standar') + '</span><small>' + (x.i ? 'Interval berikutnya diatur ' + fmt(x.i, 0) + ' km' : 'Interval berikutnya standar ' + fmt(MT_DEF[x.c], 0) + ' km') + mtMoHist(x) + '</small>' +
      '<button class="btn sm ghost" data-q="mtDel" data-day="' + x.day + '" data-id="' + esc(x.id) + '" aria-label="Hapus catatan ' + esc(MT_N[x.c]) + ' ' + esc(dayShort(x.d)) + '">Hapus</button></li>').join('') + '</ul>';
  }
  h += '<p class="note">Pengingat berdasarkan jarak ride yang tercatat di aplikasi ini (semua ride dihitung, termasuk yang di sepeda statis bila dicatat sebagai ride). Ride pada tanggal yang sama dengan perawatan tidak dihitung; bila kamu merawat sebelum ride hari itu, isi tanggal sehari sebelumnya. Aman = di bawah 80% interval, Segera = 80% sampai di bawah 100%, Waktunya = 100% atau lebih.</p>' +
    '<p class="note">Angka standar adalah perkiraan umum untuk sepeda jalan raya dari panduan perawatan sepeda (ciclimattio.com, active.com, elevationoutdoors.com): lumasi rantai 150–300 km (dipakai 200), rantai 3.000–5.000 km (dipakai 3.000; ukur dengan alat ukur keausan rantai), ban 3.000–6.000 km (dipakai 4.000), kampas rem 1.000–3.000 km (dipakai 1.000 supaya pengingat berarti periksa). Servis di bengkel 3.000 km adalah perkiraan saya, tidak ada angka tunggal dari sumber. Batas bulan (opsional) dihitung dari tanggal perawatan sampai jatuh tempo; Aman, Segera, dan Waktunya memakai persentase yang sama, dan bila ada batas km serta batas bulan, status yang lebih parah yang tampil. Standar bulan hanya untuk servis di bengkel, yaitu 12 bulan (sumber menyarankan servis profesional tiap 6–12 bulan dan rem hidrolik dikuras sedikitnya setahun sekali; angka 12 adalah pilihan saya). Sepeda gunung, jalan basah, berdebu, atau berlumpur, dan berat badan memperpendek umur komponen; ubah interval sesuai kebutuhanmu. Satu sumber menyarankan servis profesional 1–2 pekan sebelum acara atau lomba besar. Rem dan ban menyangkut keselamatan: bila ragu, bawa ke bengkel. Pengingat ini tidak menggantikan pemeriksaan sebelum ride (tekanan ban dan rem). Tersimpan di perangkat ini, ikut cadangan JSON, dan tidak dikirim ke AI.</p>';
  return h;
}
function bzMntCard() {
  try { const h = bzCardHTML('mnt', 'Perawatan sepeda', mtSum(), mtHTML()); MT_ERR = ''; return h; }
  catch (x) { MT_ERR = String((x && x.message) || x); return ''; }
}
QACT.mtC = el => {
  const v = el.dataset.v; if (!mtHas(v)) return;
  MT.c = MT.c === v ? null : v;
  $$('#trainBody [data-q="mtC"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === MT.c)));
  mtPvUpdate();
};
QACT.mtSave = () => {
  const c = MT.c;
  if (!c) { toast('Pilih komponen yang dirawat dulu.'); return; }
  const de = $('#trainBody input[data-mt="d"]'), t = today(), d = (de ? String(de.value) : (MT.d || t)).trim();
  if (!d) { toast('Isi tanggal perawatan.'); return; }
  if (!mtDateOk(d)) { toast('Tanggal perawatan tidak sah (mulai ' + MT_D0 + ').'); return; }
  if (d > t) { toast('Tanggal perawatan tidak boleh di masa depan.'); return; }
  const ie = $('#trainBody input[data-mt="i"]'), raw = (ie ? String(ie.value) : String(MT.i || '')).trim();
  let iv = mtIv(c);
  if (raw) {
    const v = /^\d{1,5}$/.test(raw) ? Number(raw) : NaN;
    if (!mtIvOk(v)) { toast('Interval harus bilangan bulat ' + fmt(MT_IL[0], 0) + '–' + fmt(MT_IL[1], 0) + ' km (tanpa titik atau koma).'); return; }
    iv = v;
  }
  const me = $('#trainBody input[data-mt="m"]'), rawM = (me ? String(me.value) : String(MT.m || '')).trim();
  let mv = mtMo(c);
  if (rawM) {
    const v = /^\d{1,2}$/.test(rawM) ? Number(rawM) : NaN;
    if (!mtMoOk(v)) { toast('Batas bulan harus bilangan bulat 0–60 (0 = tanpa batas bulan; tanpa titik atau koma).'); return; }
    mv = v;
  }
  const cur = tdb[t];
  if (cur && Array.isArray(cur.mt) && cur.mt.length >= MT_DAY) { toast('Sudah ' + MT_DAY + ' catatan perawatan hari ini. Hapus salah satu bila perlu mencatat lagi.'); return; }
  const b = cur || (tdb[t] = tblank());
  if (!Array.isArray(b.mt)) b.mt = [];
  const e = { id: ('m' + Date.now().toString(36) + b.mt.length).slice(0, 24), c, d };
  if (iv !== MT_DEF[c]) e.i = iv;
  if (mv !== MT_DEFM[c]) e.m = mv;
  e.t = Date.now();
  b.mt.push(e); b.updated = Date.now(); queueSave('t');
  MT.c = null; MT.d = ''; MT.i = ''; MT.m = '';
  toast('Perawatan tercatat: ' + MT_N[c] + ' (' + dayShort(d) + '). Hitungan km mulai dari ride sesudah tanggal itu.'); renderTrain();
};
QACT.mtDel = el => {
  const day = el.dataset.day, id = el.dataset.id, t = tdb[day]; if (!t || !Array.isArray(t.mt)) return;
  const i = t.mt.findIndex(x => x && x.id === id); if (i < 0) return;
  const gone = t.mt[i];
  t.mt.splice(i, 1); if (!t.mt.length) delete t.mt;
  t.updated = Date.now(); queueSave('t');
  toast('Catatan perawatan dihapus.', { label: 'Urungkan', fn: () => {
    const u = tdb[day] || (tdb[day] = tblank());
    if (!Array.isArray(u.mt)) u.mt = [];
    if (u.mt.length >= MT_DAY || u.mt.some(x => x && x.id === gone.id)) { toast('Tidak bisa mengurungkan: hari pencatatan itu sudah ' + MT_DAY + ' catatan.'); return; }
    u.mt.splice(Math.min(i, u.mt.length), 0, gone); u.updated = Date.now(); queueSave('t');
    if (curView === 'train') renderTrain();
  } });
  renderTrain();
};
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || !el.dataset || !el.dataset.mt) return;
  if (el.dataset.mt === 'i') { const v = String(el.value).replace(/\D/g, '').slice(0, 5); if (v !== el.value) el.value = v; MT.i = v; mtPvUpdate(); }
  else if (el.dataset.mt === 'm') { const v = String(el.value).replace(/\D/g, '').slice(0, 2); if (v !== el.value) el.value = v; MT.m = v; mtPvUpdate(); }
  else if (el.dataset.mt === 'd') MT.d = String(el.value);
});
document.addEventListener('keydown', ev => {
  const el = ev.target; if (!el || !el.dataset || (el.dataset.mt !== 'i' && el.dataset.mt !== 'm') || ev.key !== 'Enter') return;
  ev.preventDefault(); QACT.mtSave();
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b40q7a: Object.freeze({ all: mtAll, last: mtLast, iv: mtIv, km: mtKm, info: mtInfo, html: mtHTML, sum: mtSum, pv: mtPvText, state: () => ({ c: MT.c, d: MT.d, i: MT.i, m: MT.m }), reset: () => { MT.c = null; MT.d = ''; MT.i = ''; MT.m = ''; }, err: () => MT_ERR, def: Object.freeze(Object.assign({}, MT_DEF)), lim: Object.freeze({ I: MT_IL, DAY: MT_DAY, D0: MT_D0 }) }) }));
window.DL = Object.freeze(Object.assign({}, window.DL, { b43q8a: Object.freeze({ mo: mtMo, add: mtAddMonths, days: mtDays, defm: Object.freeze(Object.assign({}, MT_DEFM)), pvm: mtPvMoText, moLine: mtMoLine, ok: mtMoOk, hist: mtMoHist }) }));
/* q7a-end */
/* 77a-begin: Fase 3, tab Rekam: kamera 9:16, zona aman, cek cahaya dan suara (semua lokal, tanpa AI, tanpa kunci penyimpanan). 78a: rekam LANGSUNG portrait (jalur langsung atau kanvas 9:16), bitrate lebih tinggi, ukuran file ditampilkan */
const CM = { st: null, mr: null, ch: [], on: { zone: true, grid: false, mirror: true }, face: 'user', t0: 0, sec: 0, url: '', ext: 'webm', msg: '', ac: null, an: null, tm: 0, noise: '', mode: '', cv: null, raf: 0, lf: 0, rot: 0, info: '', src: '', fdim: '', last: null };
const CM_MAX = 120;   // detik, batas rekam
const CM_ZONE = 'inset:8% 16% 22% 4%';   // patokan saya: atas 8%, kanan 16%, bawah 22%, kiri 4% yang biasa tertutup tombol/caption TikTok
function cmHTML() {
  const live = !!CM.st, rec = !!(CM.mr && CM.mr.state === 'recording');
  const pl = (k, t) => '<button class="pill" data-q="cmOpt" data-v="' + k + '" aria-pressed="' + !!CM.on[k] + '">' + t + '</button>';
  return '<section class="sec cmsec"><h2>Kamera 9:16</h2><div class="cmfr" id="cmFr" data-zone="' + +CM.on.zone + '" data-grid="' + +CM.on.grid + '" data-mirror="' + +CM.on.mirror + '"><video id="cmVid" class="' + (CM.mode === 'kanvas' ? 'cmsrc' : '') + '" playsinline muted autoplay></video><div class="cmzn" style="' + CM_ZONE + '"></div><div class="cmgd"></div>' + (live ? '' : '<div class="cmph">Kamera belum dibuka</div>') + '</div>' +
    '<div class="seg cmopt" role="group" aria-label="Bantuan bingkai">' + pl('zone', 'Zona aman') + pl('grid', 'Grid') + pl('mirror', 'Cermin') + '</div>' + (live && CM.mode === 'kanvas' ? '<div class="cmrow"><button class="pill" data-q="cmRot"' + (rec ? ' disabled' : '') + '>Putar 90°</button></div>' : '') + (live ? '<p class="note cminfo" id="cmInfo" role="status">' + esc(CM.info) + '</p>' : '') +
    '<div class="cmrow"><button class="btn' + (live ? '' : ' primary') + '" data-q="cmOpen" ' + (rec ? 'disabled' : '') + '>' + (live ? 'Tutup kamera' : 'Buka kamera') + '</button>' + (live ? '<button class="btn" data-q="cmFlip" ' + (rec ? 'disabled' : '') + '>Balik kamera</button><button class="btn primary cmrb' + (rec ? ' on' : '') + '" data-q="cmRec">' + (rec ? 'Berhenti' : 'Rekam') + '</button><span id="cmT" class="cmt">' + (rec ? cmMS(CM.sec) : '') + '</span>' : '') + '</div>' +
    '<div class="cmchk" role="status"><div><b>Cahaya</b> <span id="cmLux">-</span></div><div><b>Suara</b> <span id="cmVol">-</span></div><div><b>Bising</b> <span id="cmNz">' + esc(CM.noise || '-') + '</span> <button class="pill" data-q="cmNoise"' + (live ? '' : ' disabled') + '>Cek 3 detik</button></div></div>' +
    '<p class="note tkmsg" id="cmMsg" role="status">' + esc(CM.msg) + '</p>' + clHTML() + evCtlHTML() +
    (CM.url ? '<div class="cmres"><div class="lbl">Rekaman terakhir (' + cmMS(CM.sec) + ')' + (CM.last ? ' · ' + CM.last.w + '×' + CM.last.h + ' · ' + (CM.last.mode === 'kanvas' ? 'dipotong 9:16' : 'langsung dari kamera') + ' · target ±' + (CM.last.bps / 1e6).toFixed(1).replace('.', ',') + ' Mbps' : '') + '</div><video src="' + CM.url + '" controls playsinline></video><p class="note cmfile" id="cmFile">' + esc(CM.fdim) + '</p><div class="cmrow"><a class="btn primary" download="vlog-' + today() + '.' + CM.ext + '" href="' + CM.url + '">Simpan video</a><button class="btn" data-q="cmDrop">Buang</button></div><p class="note">Rekaman hanya ada di layar ini dan tidak disimpan oleh app. Simpan dulu sebelum menutup halaman.</p>' + cmSubHTML() + '</div>' : '') +
    '<p class="note">Zona aman = bagian yang biasanya tertutup tombol dan caption TikTok (patokan saya, bukan ukuran resmi): taruh wajah dan teks di dalam garis putus-putus. Lihat ke lensa, bukan ke layar. Batas rekam ' + CM_MAX / 60 + ' menit. Mode cermin hanya mengubah pratinjau; file hasil tidak dibalik. Rekaman selalu berbentuk berdiri (portrait 9:16): kamera tegak direkam langsung, kamera mendatar dipotong bagian tengahnya dan yang terlihat di bingkai = isi file. Ambang cahaya dan suara adalah tebakan awal.</p></section>';
}
const cmMS = s => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');
function cmSet(id, t, bad) { const e = $('#' + id); if (e) { e.textContent = t; e.style.color = bad ? 'var(--bad)' : 'var(--ok)'; } }
function cmAfter() {
  sbAfter(); clAfter();
  const v = $('#cmVid'), fr = $('#cmFr');
  if (v && CM.st) { v.srcObject = CM.st; v.play().catch(() => {}); }
  if (fr && CM.mode === 'kanvas' && CM.cv) fr.insertBefore(CM.cv, fr.firstChild);
  const rv = $('.cmres video');
  if (rv) {   // baca ukuran FILE hasil dari file itu sendiri
    const f = () => { if (!rv.videoWidth) return; const w = rv.videoWidth, h = rv.videoHeight, ok = h > w; CM.fdim = 'File hasil: ' + w + '×' + h + (ok ? (Math.abs(w / h - 9 / 16) < .02 ? ' (berdiri, 9:16)' : ' (berdiri, bukan tepat 9:16)') : ' (MENDATAR)'); const e = $('#cmFile'); if (e) { e.textContent = CM.fdim; e.style.color = ok ? 'var(--ok)' : 'var(--bad)'; } };
    if (rv.readyState >= 1) f(); else rv.addEventListener('loadedmetadata', f, { once: true });
  }
}
const CM_R = 9 / 16;
const cmBps = (w, h) => Math.min(10e6, Math.max(2.5e6, Math.round(w * h * 30 * .12)));   // patokan saya: 12 bit per piksel per frame (1080x1920 = ±7,5 Mbps)
function cmDecide(v) {   // jalur LANGSUNG bila gambar sudah berdiri 9:16 (+-3%), selain itu jalur KANVAS (dipotong 9:16)
  const dw = CM.rot % 180 ? v.videoHeight : v.videoWidth, dh = CM.rot % 180 ? v.videoWidth : v.videoHeight; if (!dw || !dh) return null;
  if (!CM.rot && dh >= dw && Math.abs(dw / dh - CM_R) / CM_R <= .03) return { mode: 'langsung', w: dw, h: dh };
  let cw = dw, ch = dh; if (dw / dh > CM_R) cw = dh * CM_R; else ch = dw / CM_R;
  const k = Math.min(1, 1080 / cw, 1920 / ch); cw *= k; ch *= k;   // tanpa pembesaran semu, maksimal 1080x1920
  return { mode: 'kanvas', w: 2 * Math.round(cw / 2), h: 2 * Math.round(ch / 2) };
}
function cmDraw(v, c) {   // gambar frame kamera ke kanvas 9:16 (potong tengah, putar bila diminta)
  const dw = CM.rot % 180 ? v.videoHeight : v.videoWidth, dh = CM.rot % 180 ? v.videoWidth : v.videoHeight; if (!dw || !dh) return;
  const k = Math.max(c.width / dw, c.height / dh), x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  x.translate(c.width / 2, c.height / 2); x.rotate(CM.rot * Math.PI / 180); x.scale(k, k); x.drawImage(v, -v.videoWidth / 2, -v.videoHeight / 2);
}
function cmCanvas(p) {
  if (!CM.cv) CM.cv = document.createElement('canvas');
  CM.cv.width = p.w; CM.cv.height = p.h;
  if (!CM.raf) { const loop = t => { CM.raf = requestAnimationFrame(loop); if (t - CM.lf < 28) return; CM.lf = t; const v = $('#cmVid'); if (v && v.videoWidth && CM.cv) cmDraw(v, CM.cv); }; CM.raf = requestAnimationFrame(loop); }
}
function cmCanvasOff() { if (CM.raf) cancelAnimationFrame(CM.raf); CM.raf = 0; if (CM.cv && CM.cv.parentNode) CM.cv.remove(); }
function cmPick() {   // pilih jalur rekam dari ukuran gambar yang benar-benar tampil, lalu tampilkan keterangan jujur
  const v = $('#cmVid'); if (!v || !CM.st || !v.videoWidth) return;
  const p = cmDecide(v); if (!p) return;
  const d0 = v.videoWidth + '×' + v.videoHeight, mb = (cmBps(p.w, p.h) / 1e6).toFixed(1).replace('.', ',');
  CM.src = v.videoWidth + 'x' + v.videoHeight; CM.mode = p.mode;
  if (p.mode === 'kanvas') { cmCanvas(p); CM.info = 'Kamera mengirim gambar ' + d0 + (v.videoWidth > v.videoHeight ? ' (mendatar)' : '') + (CM.rot ? ', diputar ' + CM.rot + '°' : '') + '. Bagian tengah dipotong 9:16 dan direkam ' + p.w + '×' + p.h + ' (target ±' + mb + ' Mbps); yang terlihat di bingkai = isi file. Bila gambar tampak miring, ketuk Putar 90°. Untuk kualitas penuh, pegang HP tegak.'; }
  else { cmCanvasOff(); CM.info = 'Kamera tegak ' + d0 + ': direkam langsung tanpa dipotong (target ±' + mb + ' Mbps).'; }
  cnRender();
}
async function cmReady() {   // tunggu gambar pertama, lalu pilih jalur
  for (let i = 0; i < 60; i++) { const v = $('#cmVid'); if (!CM.st) return; if (v && v.videoWidth) break; await new Promise(r => setTimeout(r, 100)); }
  if (CM.st) cmPick();
}
async function cmPortrait(st) {   // kamera memberi gambar mendatar padahal diminta berdiri: coba paksa 9:16; bila tetap mendatar, jalur kanvas yang menangani
  const t = st && st.getVideoTracks()[0]; if (!t || !t.applyConstraints || !t.getSettings) return;
  const s = t.getSettings(); if (s.width && s.height && s.width > s.height) { try { await t.applyConstraints({ aspectRatio: { exact: 9 / 16 }, width: { ideal: 1080 }, height: { ideal: 1920 } }); } catch (e) {} }
}
async function cmGum() {   // coba kamera+suara; bila ditolak, coba terpisah supaya jelas mana yang ditolak
  const gm = c => navigator.mediaDevices.getUserMedia(c), V = { facingMode: CM.face, width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 }, frameRate: { ideal: 30 } };
  let st = null;
  try { st = await gm({ video: V, audio: true }); }
  catch (e) {
    if (e && e.name === 'OverconstrainedError') { try { st = await gm({ video: { facingMode: CM.face }, audio: true }); } catch (e2) { if (!e2 || e2.name !== 'NotAllowedError') throw e2; } }
    else if (!e || e.name !== 'NotAllowedError') throw e;
  }
  if (st) { await cmPortrait(st); return { st, miss: '' }; }
  let v = null, a = null; try { v = await gm({ video: V }); } catch (e) {} try { a = await gm({ audio: true }); } catch (e) {}
  if (!v) { if (a) a.getTracks().forEach(t => t.stop()); return { st: null, miss: a ? 'kamera' : 'keduanya' }; }
  await cmPortrait(v);
  return { st: a ? new MediaStream([...v.getVideoTracks(), ...a.getAudioTracks()]) : v, miss: a ? '' : 'mikrofon' };
}
async function cmDeny(miss) {
  let ps = []; for (const n of ['camera', 'microphone']) { try { const r = await navigator.permissions.query({ name: n }); ps.push((n === 'camera' ? 'kamera ' : 'mikrofon ') + ({ granted: 'diizinkan', denied: 'diblokir', prompt: 'belum ditanya' }[r.state] || r.state)); } catch (e) {} }
  return 'Izin ' + (miss === 'keduanya' ? 'kamera dan mikrofon' : 'kamera') + ' ditolak' + (ps.length ? ' (status: ' + ps.join(', ') + ')' : '') + '. Cara memperbaiki di Chrome Android: ketuk ikon (i) di kiri alamat > Izin > Kamera > Izinkan. Bila tidak ada atau tetap ditolak: Pengaturan HP > Aplikasi > Chrome > Izin > Kamera (dan Mikrofon) > Izinkan. Lalu muat ulang halaman dan ketuk Buka kamera. Catatan: halaman yang dibuka dari berkas (content://) kadang tidak menyimpan izin, jadi Chrome bisa bertanya lagi tiap kali.';
}
async function cmStart() {
  if ((typeof tkV !== 'undefined' && tkV.rec) || spV.rec) { CM.msg = 'Perekam suara di tab lain sedang jalan. Hentikan dulu.'; return cnRender(); }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') { CM.msg = 'Kamera atau perekam tidak didukung di peramban ini.'; return cnRender(); }
  try {
    const g = await cmGum(); CM.st = g.st; if (!CM.st) { CM.msg = await cmDeny(g.miss); return cnRender(); }
    CM.msg = g.miss ? 'Izin mikrofon ditolak: kamera jalan tanpa suara dan rekaman akan bisu. ' : ''; CM.rot = 0; CM.mode = ''; CM.src = ''; CM.last = null; CM.fdim = ''; CM.info = 'Membaca ukuran gambar kamera…';
    try { CM.ac = new (window.AudioContext || window.webkitAudioContext)(); CM.an = CM.ac.createAnalyser(); CM.an.fftSize = 1024; CM.ac.createMediaStreamSource(CM.st).connect(CM.an); } catch (e) { CM.an = null; }
    CM.tm = setInterval(cmTick, 500);
  } catch (e) { CM.st = null; CM.msg = 'Kamera tidak bisa dipakai (' + (e && e.name || 'galat') + '). Mungkin sedang dipakai aplikasi lain.'; }
  cnRender();
  if (CM.st) cmReady();
}
function cmLeave() {
  evLeave();
  if (CM.mr && CM.mr.state === 'recording') CM.mr.stop();
  clearInterval(CM.tm); CM.tm = 0;
  if (CM.st) CM.st.getTracks().forEach(t => t.stop()); CM.st = null;
  if (CM.ac) { CM.ac.close().catch(() => {}); } CM.ac = null; CM.an = null;
  cmCanvasOff(); CM.mode = ''; CM.src = ''; CM.rot = 0; CM.info = '';
}
function cmRms() { if (!CM.an) return null; const b = new Float32Array(CM.an.fftSize); CM.an.getFloatTimeDomainData(b); let s = 0; for (const x of b) s += x * x; return 20 * Math.log10(Math.sqrt(s / b.length) || 1e-6); }
const cmCv = document.createElement('canvas');
function cmLuma() {
  const v = CM.mode === 'kanvas' && CM.cv ? CM.cv : $('#cmVid'); if (!v || !(v.videoWidth || v.width)) return null; cmCv.width = 24; cmCv.height = 42;
  const c = cmCv.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0, 24, 42); const d = c.getImageData(0, 0, 24, 42).data; let a = 0, n = 0, ce = 0, nc = 0, ed = 0, ne = 0;
  for (let y = 0; y < 42; y++) for (let x = 0; x < 24; x++) { const i = (y * 24 + x) * 4, l = .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; a += l; n++; if (x > 6 && x < 18 && y > 10 && y < 32) { ce += l; nc++; } else { ed += l; ne++; } }
  return { avg: a / n, back: ed / ne - ce / nc };
}
function cmTick() {
  const vw = $('#v-content');
  if (!CM.st || cnTab !== 'cam' || curView !== 'content' || (vw && vw.hidden)) { cmLeave(); if (curView === 'content' && cnTab === 'cam') cnRender(); return; }
  const rv0 = $('#cmVid'); if (!(CM.mr && CM.mr.state === 'recording') && rv0 && rv0.videoWidth && CM.src && CM.src !== rv0.videoWidth + 'x' + rv0.videoHeight) cmPick();   // HP diputar: pilih ulang jalur
  const L = cmLuma(); if (L) { const t = L.avg < 50 ? 'Terlalu gelap' : L.avg > 205 ? 'Terlalu terang' : L.back > 45 ? 'Cahaya dari belakang' : 'Cukup'; cmSet('cmLux', t + ' (' + Math.round(L.avg) + '/255)', t !== 'Cukup'); }
  const r = cmRms(); if (r != null) { const t = r < -50 ? 'Nyaris tak terdengar' : r < -40 ? 'Pelan' : r > -10 ? 'Terlalu keras' : 'Pas'; cmSet('cmVol', t + ' (' + Math.round(r) + ' dB)', t !== 'Pas'); }
  if (CM.mr && CM.mr.state === 'recording') { CM.sec = (Date.now() - CM.t0) / 1000; const e = $('#cmT'); if (e) e.textContent = cmMS(CM.sec); if (CM.sec >= CM_MAX) CM.mr.stop(); }
}
function cmRec() {
  if (CM.mr && CM.mr.state === 'recording') { CM.mr.stop(); return; }
  if (!CM.st) return;
  const mt = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t));
  const kv = CM.mode === 'kanvas' && CM.cv, vv = $('#cmVid');
  const w = kv ? CM.cv.width : (vv && vv.videoWidth) || 0, h = kv ? CM.cv.height : (vv && vv.videoHeight) || 0, bps = cmBps(w, h);
  let src = CM.st, cvT = [];
  if (kv) { try { cvT = CM.cv.captureStream(30).getVideoTracks(); src = new MediaStream([...cvT, ...CM.st.getAudioTracks()]); } catch (e) { cvT = []; src = CM.st; } }
  let mr; try { mr = new MediaRecorder(src, Object.assign(mt ? { mimeType: mt } : {}, { videoBitsPerSecond: bps, audioBitsPerSecond: 128000 })); } catch (e) { mr = new MediaRecorder(src, mt ? { mimeType: mt } : undefined); }
  CM.ch = []; CM.ext = /mp4/.test(mr.mimeType) ? 'mp4' : 'webm'; CM.fdim = ''; CM.last = { w, h, bps, mode: kv ? 'kanvas' : 'langsung' };
  mr.ondataavailable = e => { if (e.data && e.data.size) CM.ch.push(e.data); };
  mr.onstop = () => { CM.sec = (Date.now() - CM.t0) / 1000; cvT.forEach(t => t.stop()); if (CM.ch.length && clTake(CM.ch, mr.mimeType)) CM.ch = []; if (CM.ch.length) { if (CM.url) URL.revokeObjectURL(CM.url); CM.url = URL.createObjectURL(new Blob(CM.ch, { type: mr.mimeType || 'video/webm' })); } CM.mr = null; if (curView === 'content' && cnTab === 'cam') cnRender(); };
  CM.mr = mr; CM.t0 = Date.now(); CM.sec = 0; mr.start(1000); cnRender();
}
QACT.cmOpen = () => { if (CM.st) { cmLeave(); cnRender(); } else cmStart(); };
QACT.cmFlip = () => { CM.face = CM.face === 'user' ? 'environment' : 'user'; cmLeave(); cmStart(); };
QACT.cmRec = cmRec;
QACT.cmRot = () => { if (CM.mr && CM.mr.state === 'recording') return; CM.rot = (CM.rot + 90) % 360; cmPick(); };
QACT.cmOpt = el => { const k = el.dataset.v; CM.on[k] = !CM.on[k]; el.setAttribute('aria-pressed', CM.on[k]); const f = $('#cmFr'); if (f) f.dataset[k] = +CM.on[k]; };
QACT.cmDrop = () => { sbReset(); if (CM.url) URL.revokeObjectURL(CM.url); CM.url = ''; CM.last = null; CM.fdim = ''; cnRender(); };
QACT.cmNoise = () => {
  if (!CM.an) { CM.noise = 'Tidak tersedia'; cnRender(); return; }
  let s = 0, n = 0; cmSet('cmNz', 'Diam 3 detik…', false);
  const iv = setInterval(() => { const r = cmRms(); if (r != null) { s += r; n++; } }, 150);
  setTimeout(() => { clearInterval(iv); const m = n ? s / n : -99; CM.noise = (m > -40 ? 'Bising' : m > -50 ? 'Agak bising' : 'Hening') + ' (' + Math.round(m) + ' dB)'; cmSet('cmNz', CM.noise, m > -50); }, 3000);
};
document.addEventListener('visibilitychange', () => { if (document.hidden) cmLeave(); });
window.DL = Object.freeze(Object.assign({}, window.DL, { b78a: Object.freeze({ cm: () => ({ mode: CM.mode, rot: CM.rot, info: CM.info, src: CM.src, cw: CM.cv ? CM.cv.width : 0, ch: CM.cv ? CM.cv.height : 0, last: CM.last, fdim: CM.fdim, url: !!CM.url }), bps: cmBps, decide: (w, h, r) => { const o = CM.rot; CM.rot = r || 0; const p = cmDecide({ videoWidth: w, videoHeight: h }); CM.rot = o; return p; } }) }));
/* 77a-end */
/* 78b-begin: Fase 3, tab Rekam, sesudah rekam: subtitle (transkrip berpenanda waktu lewat Gemini, ATAU teks sendiri disejajarkan secara lokal), bisa diedit, ekspor SRT/VTT; saran jump cut (jeda dari audio, filler dari teks; lokal); ekspor daftar klip. Tanpa kunci penyimpanan baru: semua hanya di memori sampai diunduh. */
const SB = { key: '', pcm: null, dur: 0, speech: [], sq: '', cues: [], tg: {}, thr: 0.7, busy: '', msg: '', how: '', txt: '', tx: false, stop: 0 };
const SB_PAD = 0.15, SB_MAXC = 64, SB_LINE = 32;
const sbR1 = x => Math.round(x * 10) / 10;
const sbDt = s => sbR1(s).toFixed(1).replace('.', ',');
const sbTc = (s, sep) => { let ms = Math.round(Math.max(0, s) * 1000); const h = Math.floor(ms / 3600000); ms -= h * 3600000; const m = Math.floor(ms / 60000); ms -= m * 60000; const se = Math.floor(ms / 1000); ms -= se * 1000; const p = (n, l) => String(n).padStart(l || 2, '0'); return p(h) + ':' + p(m) + ':' + p(se) + sep + p(ms, 3); };
const sbMS = s => { const t = Math.round(Math.max(0, s) * 10), m = Math.floor(t / 600); return m + ':' + ((t % 600) / 10).toFixed(1).padStart(4, '0'); };
function sbParseT(v) {   // "3.2", "3,2", "0:03.2", "1:02" -> detik, atau NaN bila tidak terbaca
  v = String(v).trim().replace(',', '.'); if (!v) return NaN;
  const m = v.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/); if (!m) return NaN;
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
}
function sbWrapT(t) {   // pecah satu baris panjang jadi dua baris di spasi terdekat dari tengah
  t = String(t).replace(/\s*\n\s*/g, ' ').trim(); if (t.length <= SB_LINE) return t;
  const mid = t.length / 2; let best = -1, bd = 1e9;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && Math.abs(i - mid) < bd) { bd = Math.abs(i - mid); best = i; }
  return best < 0 ? t : t.slice(0, best) + '\n' + t.slice(best + 1);
}

/* --- ucapan vs jeda dari audio (lokal) --- */
function sbSpeech(pcm, sr) {   // -> { segs: [[mulai, selesai], ...] detik, dur, none, quiet }
  const dur = pcm.length / sr, fl = Math.max(1, Math.round(sr * 0.02)), nf = Math.floor(pcm.length / fl);
  if (nf < 10) return { segs: [], dur, none: true, quiet: true };
  const db = new Float32Array(nf);
  for (let f = 0; f < nf; f++) { let s = 0; const o = f * fl; for (let i = 0; i < fl; i++) { const x = pcm[o + i]; s += x * x; } db[f] = 10 * Math.log10(s / fl + 1e-12); }
  const srt = Array.from(db).sort((a, b) => a - b), q = p => srt[Math.min(nf - 1, Math.floor(p * (nf - 1)))];
  const lo = q(0.1), hi = q(0.9);
  if (hi < -55) return { segs: [], dur, none: true, quiet: true };
  if (hi - lo < 10) return { segs: [[0, dur]], dur, none: false, quiet: true };   // tidak ada beda keras dan pelan: jeda tidak bisa dibedakan dari ucapan
  const thr = lo + (hi - lo) * 0.3, v = Array.from(db, x => x > thr);
  const runs = (val, fn) => { let i = 0; while (i < nf) { if (v[i] !== val) { i++; continue; } let j = i; while (j < nf && v[j] === val) j++; fn(i, j); i = j; } };
  runs(false, (a, b) => { if (a > 0 && b < nf && b - a < 8) for (let k = a; k < b; k++) v[k] = true; });   // celah < 160 ms di dalam kata bukan jeda
  runs(true, (a, b) => { if (b - a < 4) for (let k = a; k < b; k++) v[k] = false; });                      // letupan < 80 ms (klik) bukan ucapan
  const segs = []; runs(true, (a, b) => segs.push([a * 0.02, Math.min(dur, b * 0.02)]));
  return { segs, dur, none: !segs.length, quiet: false };
}

/* --- teks -> baris subtitle berwaktu --- */
const sbWords = text => String(text).replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter(Boolean);
function sbChunks(words) {   // kelompokkan kata jadi baris subtitle: akhiri di tanda baca kalimat atau sebelum melewati SB_MAXC huruf
  const out = []; let cur = [];
  words.forEach(w => {
    if (cur.length && (cur.join(' ') + ' ' + w).length > SB_MAXC) { out.push(cur); cur = []; }
    cur.push(w);
    const L = cur.join(' ').length;
    if ((/[.!?…]$/.test(w) && L >= 12) || (/[,;:]$/.test(w) && L >= 36)) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
}
function sbAlignText(text, segs, dur) {   // bagi waktu menurut panjang kata, hanya di bagian yang ada suaranya (perkiraan)
  const words = sbWords(text); if (!words.length) return [];
  if (!segs || !segs.length) segs = [[0, dur]];
  const tot = segs.reduce((a, s) => a + (s[1] - s[0]), 0); if (!(tot > 0)) return [];
  const wt = words.map(w => w.length + 1), W = wt.reduce((a, b) => a + b, 0);
  const at = (u, st) => { let r = u; for (const s of segs) { const l = s[1] - s[0]; if (st ? r < l - 1e-9 : r <= l + 1e-9) return s[0] + Math.max(0, r); r -= l; } return segs[segs.length - 1][1]; };
  const w0 = [], w1 = []; let acc = 0;
  wt.forEach(x => { w0.push(acc / W * tot); acc += x; w1.push(acc / W * tot); });
  const cues = []; let i = 0;
  sbChunks(words).forEach(ch => { cues.push({ s: at(w0[i], true), e: at(w1[i + ch.length - 1], false), t: sbWrapT(ch.join(' ')) }); i += ch.length; });
  return cues;
}
function sbFix(cues, dur) {   // urut, jepit ke durasi, tanpa tumpang tindih, durasi minimal
  const o = cues.filter(c => c && c.t && isFinite(c.s) && isFinite(c.e)).map(c => ({ s: Math.max(0, c.s), e: Math.min(dur, c.e), t: c.t })).filter(c => c.s < dur - 0.05).sort((a, b) => a.s - b.s);
  o.forEach(c => { if (!(c.e > c.s)) c.e = Math.min(dur, c.s + 0.4); });
  for (let i = 0; i + 1 < o.length; i++) { const a = o[i], b = o[i + 1]; if (a.e > b.s) { if (b.s - a.s >= 0.3) a.e = b.s; else b.s = a.e; } }
  return o.filter(c => c.e - c.s > 0.05);
}
function sbNorm(arr, dur) {   // jawaban Gemini -> baris bersih
  const num = v => typeof v === 'number' ? v : sbParseT(v), o = [];
  (Array.isArray(arr) ? arr : []).slice(0, 150).forEach(c => {
    if (!c || typeof c !== 'object') return;
    const t = String(c.t != null ? c.t : c.text != null ? c.text : '').replace(/[ \t]+/g, ' ').trim().slice(0, 140);
    const s = num(c.s != null ? c.s : c.start); let e = num(c.e != null ? c.e : c.end);
    if (!t || !isFinite(s) || s < 0 || s > dur + 0.5) return;
    if (!isFinite(e) || e <= s) e = s + Math.max(1, t.length / 15);
    o.push({ s, e, t });
  });
  return sbFix(o, dur);
}
function sbSnap(cues, segs) {   // rapatkan awal dan akhir baris ke awal dan akhir ucapan terdekat (maks 0,7 dtk); tiap titik dipakai satu baris saja
  if (SB.sq !== 'ok') return { cues, n: 0 };
  const on = segs.map(s => s[0]), off = segs.map(s => s[1]), ua = {}, ub = {}; let n = 0;
  const near = (arr, t, used) => { let bi = -1, bd = 0.7; arr.forEach((x, i) => { const d = Math.abs(x - t); if (d <= bd && !used[i]) { bd = d; bi = i; } }); return bi; };
  const out = cues.map(c => {
    const o = { s: c.s, e: c.e, t: c.t }, i = near(on, c.s, ua), j = near(off, c.e, ub);
    if (i >= 0) { ua[i] = 1; if (on[i] !== o.s) { o.s = on[i]; n++; } }
    if (j >= 0 && off[j] - o.s >= 0.3) { ub[j] = 1; if (off[j] !== o.e) { o.e = off[j]; n++; } }
    return o;
  });
  return { cues: sbFix(out, SB.dur), n };
}

/* --- Gemini: transkrip berpenanda waktu --- */
const SB_SYS = 'Kamu pembuat subtitle video TikTok berbahasa Indonesia. Dengarkan rekaman, lalu tulis ucapan PERSIS seperti diucapkan, dalam bahasa aslinya (Indonesia, boleh campur bahasa daerah atau Inggris). Jangan memperbaiki tata bahasa, jangan menambah, jangan meringkas; pertahankan kata isian (eh, anu, jadi, kan). ' +
  'Pecah menjadi baris subtitle pendek: tiap baris maksimal 60 huruf dan sekitar 1-5 detik. Beri waktu mulai (s) dan selesai (e) tiap baris dalam DETIK sejak awal rekaman (angka desimal, contoh 3.4). Waktu harus sesuai saat kata itu benar-benar terdengar; jangan mengarang di bagian hening dan jangan melewati durasi total. ' +
  'Keluarkan HANYA array JSON seperti [{"s":0.0,"e":2.4,"t":"teks"}]. Jika tidak ada ucapan yang terdengar, keluarkan [].';
async function sbGen() {
  if (SB.busy || !SB.pcm) return;
  const rd = AI.ready();
  if (!rd.ok) { SB.msg = rd.msg + ' Sementara, tempel teks sendiri lalu ketuk Sejajarkan.'; SB.tx = true; return sbPaint(); }
  const key = SB.key; SB.busy = 'gen'; SB.msg = ''; sbPaint();
  let media = null; try { media = { type: 'audio/wav', data: tkWavB64(SB.pcm, 16000) }; } catch (e) { media = null; }
  if (!media) { SB.busy = ''; SB.msg = 'Suara rekaman tidak bisa disiapkan untuk AI. Tempel teks sendiri lalu ketuk Sejajarkan.'; return sbPaint(); }
  const r = await AI.ask({ task: 'sbGen', system: SB_SYS, user: 'Durasi rekaman: ' + SB.dur.toFixed(1) + ' detik. Buat subtitle-nya.', image: media, json: true, max: 4000, timeout: 90000 });
  if (SB.key !== key) return;
  SB.busy = '';
  if (!r.ok) { SB.msg = r.code === 'cancelled' ? 'Dibatalkan.' : (r.msg || 'Gagal membuat subtitle.') + ' Kamu bisa mencoba lagi atau menempel teks sendiri.'; return sbPaint(); }
  const list = Array.isArray(r.data) ? r.data : r.data && (Array.isArray(r.data.cues) ? r.data.cues : Array.isArray(r.data.subtitles) ? r.data.subtitles : null);
  const nm = sbNorm(list, SB.dur);
  if (!nm.length) { SB.msg = 'Gemini tidak menemukan ucapan di rekaman ini. Coba lagi atau tempel teks sendiri.'; return sbPaint(); }
  const sn = sbSnap(nm, SB.speech); SB.cues = sn.cues; SB.how = 'gemini'; SB.tg = {};
  SB.msg = SB.cues.length + ' baris dari Gemini' + (sn.n ? '; ' + sn.n + ' waktu dirapatkan ke suara yang terdeteksi' : '') + '. Periksa dan edit dulu: waktu dari AI itu perkiraan.';
  sbPaint();
}
function sbAlign() {
  const t = SB.txt.trim(); if (!t) { SB.msg = 'Tulis atau tempel teksnya dulu.'; return sbPaint(); }
  if (!(SB.dur > 0)) { SB.msg = 'Durasi rekaman belum terbaca.'; return sbPaint(); }
  const cues = sbFix(sbAlignText(t, SB.sq === 'ok' ? SB.speech : null, SB.dur), SB.dur);
  if (!cues.length) { SB.msg = 'Tidak ada baris yang bisa dibuat dari teks itu.'; return sbPaint(); }
  SB.cues = cues; SB.how = 'teks'; SB.tg = {};
  SB.msg = cues.length + ' baris dari teksmu' + (SB.sq === 'ok' ? ', waktunya dibagi di bagian yang ada suaranya (perkiraan)' : ', waktunya dibagi RATA karena jeda tidak terdeteksi (sangat kasar)') + '. Atur waktu tiap baris sambil memutar videonya.';
  sbPaint();
}

/* --- saran potong: jeda (audio) dan filler (teks) --- */
const SB_FW = [['eh', /\b(?:e+h+|ehm+|em+|hmm+|hm+|mm+|uh+|um+)\b/giu, 1], ['anu', /\banu\b/giu, 1], ['apa ya', /\bapa ya\b/giu, 1], ['apa namanya', /\bapa namanya\b/giu, 1], ['kan', /\bkan\b/giu, 0], ['jadi', /(?:^|[.!?…,\n]\s*)jadi\b/giu, 0]];
function sbCuts() {
  const out = [], dur = SB.dur, segs = SB.speech;
  if (SB.sq === 'ok' && segs.length) {
    const f = segs[0], l = segs[segs.length - 1];
    if (f[0] >= SB.thr) out.push({ k: 'awal', a: 0, b: f[0] - SB_PAD, from: 0, to: f[0] });
    for (let i = 0; i + 1 < segs.length; i++) { const a = segs[i][1], b = segs[i + 1][0]; if (b - a >= SB.thr) out.push({ k: 'jeda', a: a + SB_PAD, b: b - SB_PAD, from: a, to: b }); }
    if (dur - l[1] >= SB.thr) out.push({ k: 'akhir', a: l[1] + SB_PAD, b: dur, from: l[1], to: dur });
  }
  SB.cues.forEach(c => {
    const t = c.t.replace(/\s*\n\s*/g, ' ');
    SB_FW.forEach(fw => {
      fw[1].lastIndex = 0; let m;
      while ((m = fw[1].exec(t))) {
        const len = fw[0] === 'jadi' ? 4 : m[0].length, st = m.index + m[0].length - len;
        const a = Math.max(0, c.s + st / t.length * (c.e - c.s) - 0.08), b = Math.min(dur, c.s + (st + len) / t.length * (c.e - c.s) + 0.08);
        if (b - a >= 0.15) out.push({ k: 'filler', w: t.slice(st, st + len).toLowerCase(), real: fw[2] === 1, a, b, from: a, to: b, est: true });
        if (m[0].length === 0) fw[1].lastIndex++;
      }
    });
  });
  const res = out.filter(c => c.b - c.a >= 0.15).sort((x, y) => x.a - y.a);
  res.forEach(c => { c.id = c.k + ':' + sbR1(c.a); c.on = c.id in SB.tg ? SB.tg[c.id] : (c.k !== 'filler'); });
  return res;
}
const sbSel = () => sbCuts().filter(c => c.on);
function sbMerge(cuts) { const r = cuts.map(x => [x.a, x.b]).sort((p, q) => p[0] - q[0]), o = []; r.forEach(x => { const l = o[o.length - 1]; if (l && x[0] <= l[1] + 1e-6) l[1] = Math.max(l[1], x[1]); else o.push([x[0], x[1]]); }); return o; }
function sbKept(m) { const o = []; let p = 0; m.forEach(x => { if (x[0] - p > 0.05) o.push([p, x[0]]); p = Math.max(p, x[1]); }); if (SB.dur - p > 0.05) o.push([p, SB.dur]); return o; }
function sbMapT(t, m) { let rm = 0; for (const x of m) { if (t >= x[1]) rm += x[1] - x[0]; else { if (t > x[0]) rm += t - x[0]; break; } } return t - rm; }
function sbCutCues(cues, m) { const o = []; cues.forEach(c => { const a = sbMapT(c.s, m), b = sbMapT(c.e, m); if (b - a >= 0.25) o.push({ s: a, e: b, t: c.t }); }); return o; }
function sbClips() { const m = sbMerge(sbSel()); return sbKept(m).map((k, i) => ({ n: i + 1, a: k[0], b: k[1], d: k[1] - k[0], t: SB.cues.filter(c => c.e > k[0] + 0.05 && c.s < k[1] - 0.05).map(c => c.t.replace(/\s*\n\s*/g, ' ')).join(' ') })); }

/* --- ekspor --- */
function sbSrt(cues, vtt) { const sep = vtt ? '.' : ','; return (vtt ? 'WEBVTT\n\n' : '') + cues.map((c, i) => (vtt ? '' : (i + 1) + '\n') + sbTc(c.s, sep) + ' --> ' + sbTc(c.e, sep) + '\n' + (c.t.includes('\n') ? c.t : sbWrapT(c.t)) + '\n').join('\n'); }
function sbCsv(cl) { const q = v => '"' + String(v).replace(/"/g, '""') + '"'; return '\ufeff' + ['no,mulai,selesai,durasi_detik,teks'].concat(cl.map(c => [c.n, sbTc(c.a, '.'), sbTc(c.b, '.'), c.d.toFixed(2), q(c.t)].join(','))).join('\r\n') + '\r\n'; }
function sbClipTxt(cl) { const tot = cl.reduce((a, c) => a + c.d, 0); return 'DAFTAR KLIP (' + cl.length + ' klip, total ' + sbDt(tot) + ' dtk dari ' + sbDt(SB.dur) + ' dtk)\nPotong di timecode ini pada video aslinya, lalu susun berurutan.\n\n' + cl.map(c => c.n + '. ' + sbMS(c.a) + ' - ' + sbMS(c.b) + '  (' + sbDt(c.d) + ' dtk)' + (c.t ? '  "' + c.t + '"' : '')).join('\n') + '\n'; }
function sbBuild(kind) {
  if (kind === 'srt') return { name: 'subtitle-' + today() + '.srt', mime: 'application/x-subrip', body: sbSrt(SB.cues, false) };
  if (kind === 'vtt') return { name: 'subtitle-' + today() + '.vtt', mime: 'text/vtt', body: sbSrt(SB.cues, true) };
  if (kind === 'srtcut') return { name: 'subtitle-' + today() + '-dipotong.srt', mime: 'application/x-subrip', body: sbSrt(sbCutCues(SB.cues, sbMerge(sbSel())), false) };
  if (kind === 'csv') return { name: 'klip-' + today() + '.csv', mime: 'text/csv', body: sbCsv(sbClips()) };
  if (kind === 'txt') return { name: 'klip-' + today() + '.txt', mime: 'text/plain', body: sbClipTxt(sbClips()) };
  if (kind === 'plain') return { name: '', mime: 'text/plain', body: SB.cues.map(c => c.t.replace(/\s*\n\s*/g, ' ')).join('\n') };
  return null;
}
function sbSave(name, text, mime) {
  const u = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' })), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 15000);
}

/* --- tampilan --- */
function sbWarn(c) { const d = c.e - c.s, n = c.t.replace(/\s+/g, ' ').length; return d < 0.4 ? 'terlalu singkat' : n / d > 20 ? 'terlalu cepat dibaca (' + Math.round(n / d) + ' huruf per detik)' : n > SB_MAXC ? 'terlalu panjang (' + n + ' huruf)' : ''; }
function sbTl() {
  const d = SB.dur || 1, pc = x => (Math.max(0, Math.min(1, x / d)) * 100).toFixed(2) + '%';
  let h = '<div class="sbtl" data-q="sbTl" role="img" aria-label="Garis waktu rekaman: bagian ada suara, baris subtitle, dan bagian yang disarankan dipotong">';
  if (SB.sq === 'ok') SB.speech.forEach(s => { h += '<i class="sp" style="left:' + pc(s[0]) + ';width:' + pc(s[1] - s[0]) + '"></i>'; });
  SB.cues.forEach(c => { h += '<i class="cu" style="left:' + pc(c.s) + ';width:' + pc(c.e - c.s) + '"></i>'; });
  sbMerge(sbSel()).forEach(x => { h += '<i class="ct" style="left:' + pc(x[0]) + ';width:' + pc(x[1] - x[0]) + '"></i>'; });
  return h + '<b id="sbPh"></b></div>';
}
const SB_K = { awal: 'Hening di awal', jeda: 'Jeda', akhir: 'Hening di akhir', filler: 'Filler' };
function sbInner() {
  const q = SB.sq, has = SB.cues.length > 0;
  if (q === 'wait' || !q) return '<h3>Subtitle dan jump cut</h3><p class="note">Membaca suara rekaman…</p>';
  let h = '<h3>Subtitle dan jump cut</h3>';
  if (q === 'err') h += '<p class="note">Suara video ini tidak bisa dibaca di peramban ini, jadi jeda tidak bisa dideteksi dan AI tidak bisa mendengar rekamannya. Kamu tetap bisa menempel teks sendiri; waktunya dibagi rata (sangat kasar).</p>';
  else if (q === 'none') h += '<p class="note">Tidak ada ucapan yang terdengar di rekaman ini.</p>';
  else if (q === 'quiet') h += '<p class="note">Suara dan latar sulit dibedakan, jadi jeda tidak terdeteksi. Subtitle tetap bisa dibuat.</p>';
  const can = !!SB.pcm && q !== 'none' && !SB.busy;
  h += '<div class="cmrow"><button class="btn primary" data-q="sbGen"' + (can ? '' : ' disabled') + '>' + (SB.busy === 'gen' ? 'Gemini mendengarkan…' : has ? 'Buat ulang dengan Gemini' : 'Buat subtitle dengan Gemini') + '</button><button class="btn" data-q="sbTx" aria-pressed="' + SB.tx + '">Teks sendiri</button>' + (SB.busy ? '<button class="btn" data-q="sbCancel">Batal</button>' : '') + '</div>';
  h += '<p class="note" id="sbMsg" role="status">' + (SB.busy === 'gen' ? 'Menunggu Gemini (bisa 10-40 detik)… ' : '') + esc(SB.msg) + '</p>';
  if (SB.tx) {
    h += '<textarea class="sbtx" data-sb="txt" rows="4" maxlength="1500" placeholder="Tempel atau ketik apa yang kamu ucapkan di video ini" aria-label="Teks yang diucapkan">' + esc(SB.txt) + '</textarea>' +
      '<div class="cmrow"><button class="btn" data-q="sbScript">Isi dari skrip hari ini</button><button class="btn primary" data-q="sbAlign"' + (SB.dur > 0 && !SB.busy ? '' : ' disabled') + '>Sejajarkan teks</button></div>' +
      '<p class="note">Teks dipotong jadi baris pendek dan waktunya dibagi mengikuti bagian yang ada suaranya (perkiraan, tanpa AI dan tanpa internet). Cocok bila kamu membaca skripnya; bila ucapanmu beda dari skrip, pakai tombol Gemini.</p>';
  }
  h += sbTl() + '<p class="sbnow" id="sbNow" aria-live="off"></p>';
  if (has) {
    h += '<div class="lbl"><span>Baris subtitle</span><span class="sbn">' + SB.cues.length + ' baris' + (SB.how === 'gemini' ? ' · dari Gemini' : SB.how === 'teks' ? ' · dari teksmu' : '') + '</span></div>';
    SB.cues.forEach((c, i) => {
      const w = sbWarn(c);
      h += '<div class="sbcue" data-i="' + i + '"><div class="sbt"><input class="sbtm" data-sb="s" data-i="' + i + '" inputmode="decimal" value="' + sbMS(c.s) + '" aria-label="Mulai baris ' + (i + 1) + '"><span aria-hidden="true">→</span><input class="sbtm" data-sb="e" data-i="' + i + '" inputmode="decimal" value="' + sbMS(c.e) + '" aria-label="Selesai baris ' + (i + 1) + '"><button class="pill" data-q="sbSeek" data-t="' + c.s.toFixed(2) + '" data-e="' + c.e.toFixed(2) + '">Putar</button></div>' +
        '<textarea class="sbtx" data-sb="t" data-i="' + i + '" rows="2" maxlength="140" aria-label="Teks baris ' + (i + 1) + '">' + esc(c.t) + '</textarea>' +
        '<div class="sbact"><button class="pill" data-q="sbSplit" data-i="' + i + '">Pecah</button><button class="pill" data-q="sbJoin" data-i="' + i + '"' + (i + 1 < SB.cues.length ? '' : ' disabled') + '>Gabung ↓</button><button class="pill" data-q="sbDel" data-i="' + i + '">Hapus</button></div>' + (w ? '<p class="note sbw">⚠ ' + esc(w) + '</p>' : '') + '</div>';
    });
    h += '<div class="cmrow"><button class="btn" data-q="sbAdd">Tambah baris</button></div>';
  }
  const cuts = sbCuts();
  h += '<div class="lbl sbl2"><span>Saran jump cut</span><span class="sbn" id="sbSave"></span></div>';
  if (q === 'ok') h += '<label class="sbthr">Jeda minimal <b id="sbThrV">' + sbDt(SB.thr) + ' dtk</b><input type="range" data-sb="thr" min="0.5" max="1.5" step="0.1" value="' + SB.thr + '" aria-label="Jeda minimal yang disarankan dipotong"></label>';
  if (!cuts.length) h += '<p class="note">' + (q === 'ok' ? 'Tidak ada jeda sepanjang ' + sbDt(SB.thr) + ' dtk atau lebih. Mantap, ritmenya sudah rapat.' : 'Belum ada saran: jeda butuh suara yang terbaca, filler butuh subtitle.') + '</p>';
  cuts.forEach(c => {
    h += '<div class="sbrow"><button class="sbcut" data-q="sbCut" data-id="' + esc(c.id) + '" aria-pressed="' + c.on + '"><span><b>' + SB_K[c.k] + (c.k === 'filler' ? ' “' + esc(c.w) + '”' : '') + '</b> ' + (c.k === 'filler' ? '' : sbDt(c.to - c.from) + ' dtk · ') + sbMS(c.from) + (c.k === 'filler' ? '' : '–' + sbMS(c.to)) + '</span><small>' + (c.k === 'filler' ? (c.real ? 'waktu perkiraan, dengar dulu' : 'bisa kata biasa, dengar dulu') : 'sisa napas ' + sbDt(SB_PAD) + ' dtk di tiap sisi') + '</small></button><button class="pill" data-q="sbSeek" data-t="' + Math.max(0, c.a - 0.5).toFixed(2) + '" data-e="' + Math.min(SB.dur, c.b + 0.5).toFixed(2) + '">Dengar</button></div>';
  });
  if (cuts.length) h += '<p class="note">Jeda dicentang otomatis; filler tidak (waktunya perkiraan dari posisi kata di kalimat). Ketuk untuk memilih atau membatalkan.</p>';
  const dis = has ? '' : ' disabled', dc = sbSel().length ? '' : ' disabled';
  h += '<div class="lbl sbl2"><span>Ekspor</span></div><div class="cmrow sbex"><button class="btn" data-q="sbExp" data-v="srt"' + dis + '>SRT</button><button class="btn" data-q="sbExp" data-v="vtt"' + dis + '>VTT</button><button class="btn" data-q="sbExp" data-v="srtcut"' + (has && !dc ? '' : ' disabled') + '>SRT setelah dipotong</button><button class="btn" data-q="sbExp" data-v="plain"' + dis + '>Salin teks</button></div>' +
    '<div class="cmrow sbex"><button class="btn" data-q="sbExp" data-v="csv"' + dc + '>Daftar klip (CSV)</button><button class="btn" data-q="sbExp" data-v="txt"' + dc + '>Daftar klip (teks)</button></div>' +
    '<p class="note">SRT dan VTT = berkas subtitle standar. “SRT setelah dipotong” sudah disesuaikan waktunya dengan video yang jedanya dibuang. Daftar klip berisi timecode bagian yang DIPERTAHANKAN, untuk memotong manual di aplikasi edit (belum saya uji di CapCut; CapCut tidak punya impor daftar klip yang saya ketahui). App ini tidak memotong videonya.</p>';
  return h + evBoxHTML();
}
function sbSaveTxt() {
  const e = $('#sbSave'); if (!e) return;
  const m = sbMerge(sbSel()), cut = m.reduce((a, x) => a + (x[1] - x[0]), 0);
  e.textContent = cut > 0 ? sbDt(SB.dur) + ' → ' + sbDt(SB.dur - cut) + ' dtk (hemat ' + sbDt(cut) + ')' : sbDt(SB.dur) + ' dtk';
}
function sbPaint() { const b = $('#sbBox'); if (!b) return; b.innerHTML = sbInner(); sbSaveTxt(); sbTick(); }
function cmSubHTML() { return '<div class="sbx" id="sbBox">' + (SB.key === CM.url && CM.url ? sbInner() : '<h3>Subtitle dan jump cut</h3><p class="note">Membaca suara rekaman…</p>') + '</div>'; }
function sbReset() { if (SB.busy) AI.cancel(); Object.assign(SB, { key: '', pcm: null, speech: [], cues: [], tg: {}, busy: '', msg: '', how: '', sq: '', stop: 0 }); }
async function sbAnalyze() {
  const key = CM.url; if (!key || SB.key === key) return;
  if (SB.busy) AI.cancel();
  Object.assign(SB, { key, pcm: null, dur: CM.sec || 0, speech: [], sq: 'wait', cues: [], tg: {}, busy: '', msg: '', how: '', stop: 0 });
  sbPaint();
  try {
    const blob = await (await fetch(key)).blob(), pcm = await spDecode(blob);
    if (SB.key !== key) return;
    const sp = sbSpeech(pcm, 16000); SB.pcm = pcm; SB.dur = sp.dur; SB.speech = sp.segs; SB.sq = sp.none ? 'none' : sp.quiet ? 'quiet' : 'ok';
  } catch (e) { if (SB.key !== key) return; SB.sq = 'err'; SB.pcm = null; SB.dur = CM.sec || 0; }
  sbPaint();
}
function sbTick() {
  const rv = $('.cmres video'), t = rv ? rv.currentTime || 0 : 0;
  if (rv && SB.stop && t >= SB.stop) { rv.pause(); SB.stop = 0; }
  const i = SB.cues.findIndex(c => t >= c.s && t < c.e), nw = $('#sbNow'), ph = $('#sbPh');
  if (nw) nw.textContent = i >= 0 ? SB.cues[i].t.replace(/\s*\n\s*/g, ' ') : '';
  if (ph) ph.style.left = (Math.max(0, Math.min(1, t / (SB.dur || 1))) * 100).toFixed(2) + '%';
  document.querySelectorAll('.sbcue').forEach(e => e.classList.toggle('on', Number(e.dataset.i) === i));
}
function sbAfter() {   // dipanggil dari cmAfter() sesudah tab Rekam digambar
  const rv = $('.cmres video');
  if (rv && !rv._sb) { rv._sb = 1; rv.addEventListener('timeupdate', sbTick); rv.addEventListener('seeked', sbTick); }
  if (CM.url && SB.key !== CM.url) sbAnalyze(); else sbTick();
  sbSaveTxt();
}

/* --- aksi --- */
QACT.sbGen = () => { sbGen(); };
QACT.sbCancel = () => { if (SB.busy) AI.cancel(); };
QACT.sbTx = () => { SB.tx = !SB.tx; sbPaint(); };
QACT.sbAlign = () => { sbAlign(); };
QACT.sbScript = () => {
  let t = ''; try { t = tkSegs().map(s => (s.pub != null ? s.pub : s.text) || '').filter(x => x.trim()).join(' '); } catch (e) { t = ''; }
  t = t.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) { SB.msg = 'Skrip hari ini masih kosong. Buat dulu di tab Skrip, atau tulis teksnya di sini.'; return sbPaint(); }
  SB.txt = t.slice(0, 1500); SB.msg = 'Skrip diisi. Periksa apakah sama dengan yang kamu ucapkan, lalu ketuk Sejajarkan.'; sbPaint();
};
QACT.sbTl = (el, ev) => {
  const rv = $('.cmres video'); if (!rv || !ev) return; const r = el.getBoundingClientRect(); if (!r.width) return;
  SB.stop = 0; rv.currentTime = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * (SB.dur || 0); sbTick();
};
QACT.sbSeek = el => { const rv = $('.cmres video'); if (!rv) return; const t = Number(el.dataset.t), e = Number(el.dataset.e); if (!isFinite(t)) return; SB.stop = isFinite(e) && e > t ? e : 0; rv.currentTime = Math.max(0, t); rv.play().catch(() => {}); };
QACT.sbCut = el => { const id = el.dataset.id, c = sbCuts().find(x => x.id === id); if (!c) return; SB.tg[id] = !c.on; sbPaint(); };
QACT.sbDel = el => { const i = Number(el.dataset.i); if (!(i >= 0 && i < SB.cues.length)) return; const c = SB.cues.splice(i, 1)[0]; SB.msg = 'Baris dihapus.'; sbPaint(); toast('Baris dihapus', { label: 'Urungkan', fn: () => { SB.cues.push(c); SB.cues = sbFix(SB.cues, SB.dur); sbPaint(); } }); };
QACT.sbJoin = el => { const i = Number(el.dataset.i); if (!(i >= 0 && i + 1 < SB.cues.length)) return; const a = SB.cues[i], b = SB.cues.splice(i + 1, 1)[0]; a.e = Math.max(a.e, b.e); a.t = (a.t.replace(/\s*\n\s*/g, ' ') + ' ' + b.t.replace(/\s*\n\s*/g, ' ')).trim().slice(0, 140); sbPaint(); };
QACT.sbSplit = el => {
  const i = Number(el.dataset.i), c = SB.cues[i]; if (!c) return;
  const w = c.t.replace(/\s*\n\s*/g, ' ').split(' ').filter(Boolean); if (w.length < 2) { toast('Terlalu pendek untuk dipecah'); return; }
  const k = Math.round(w.length / 2), a = w.slice(0, k).join(' '), b = w.slice(k).join(' '), m = c.s + (c.e - c.s) * a.length / (a.length + b.length);
  SB.cues.splice(i, 1, { s: c.s, e: m, t: a }, { s: m, e: c.e, t: b }); sbPaint();
};
QACT.sbAdd = () => { const l = SB.cues[SB.cues.length - 1], s = l ? Math.min(SB.dur - 0.5, l.e) : 0; SB.cues.push({ s: Math.max(0, s), e: Math.min(SB.dur, Math.max(0, s) + 1.5), t: 'Teks baru' }); SB.cues = sbFix(SB.cues, SB.dur); sbPaint(); };
QACT.sbExp = el => {
  const o = sbBuild(el.dataset.v); if (!o) return;
  if (el.dataset.v === 'plain') { const done = () => toast('Teks subtitle disalin'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(o.body).then(done, () => toast('Tidak bisa menyalin. Pakai SRT.')); else toast('Tidak bisa menyalin. Pakai SRT.'); return; }
  sbSave(o.name, o.body, o.mime); toast(o.name + ' diunduh');
};
document.addEventListener('input', ev => {
  const el = ev.target, k = el.dataset && el.dataset.sb; if (!k) return;
  if (k === 't') { const c = SB.cues[Number(el.dataset.i)]; if (c) c.t = el.value.slice(0, 140); }
  else if (k === 'txt') SB.txt = el.value.slice(0, 1500);
  else if (k === 'thr') { SB.thr = Math.max(0.5, Math.min(1.5, Number(el.value) || 0.7)); const o = $('#sbThrV'); if (o) o.textContent = sbDt(SB.thr) + ' dtk'; clearTimeout(SB.tt); SB.tt = setTimeout(sbPaint, 250); }
});
document.addEventListener('change', ev => {
  const el = ev.target, k = el.dataset && el.dataset.sb; if (k !== 's' && k !== 'e') return;
  const i = Number(el.dataset.i), c = SB.cues[i]; if (!c) return;
  const v = sbParseT(el.value);
  if (!isFinite(v) || v < 0 || v > SB.dur + 0.05) { toast('Waktu tidak terbaca. Tulis seperti 0:03.2'); el.value = sbMS(c[k]); return; }
  const n = Object.assign({}, c); n[k] = Math.min(v, SB.dur);
  if (!(n.e - n.s >= 0.2)) { toast('Selesai harus sesudah mulai'); el.value = sbMS(c[k]); return; }
  c[k] = n[k]; SB.cues = sbFix(SB.cues, SB.dur); sbPaint();
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b78b: Object.freeze({
  st: () => ({ key: !!SB.key, sq: SB.sq, dur: SB.dur, n: SB.cues.length, how: SB.how, thr: SB.thr, busy: SB.busy, msg: SB.msg, speech: SB.speech.map(s => [sbR1(s[0]), sbR1(s[1])]) }),
  cues: () => SB.cues.map(c => ({ s: c.s, e: c.e, t: c.t })),
  cuts: () => sbCuts().map(c => ({ k: c.k, a: c.a, b: c.b, on: c.on, id: c.id, w: c.w })),
  build: kind => { const o = sbBuild(kind); return o && { name: o.name, body: o.body }; },
  speech: (pcm, sr) => sbSpeech(pcm, sr),
  align: (text, segs, dur) => sbAlignText(text, segs, dur),
  norm: (arr, dur) => sbNorm(arr, dur),
  parse: sbParseT, tc: sbTc,
  feed: (pcm, sr, o) => { o = o || {}; const sp = sbSpeech(pcm, sr); Object.assign(SB, { key: CM.url || 'feed', pcm, dur: sp.dur, speech: sp.segs, sq: sp.none ? 'none' : sp.quiet ? 'quiet' : 'ok', cues: o.cues ? sbFix(o.cues, sp.dur) : [], tg: {}, how: o.cues ? 'teks' : '' }); sbPaint(); return { sq: SB.sq, dur: SB.dur }; }
}) }));
/* 78b-end */
/* 78c-begin: Fase 3, tab Rekam: KLIP CEPAT 3-5 detik di sela kerja (rekam otomatis berhenti), disimpan PERMANEN di perangkat ini (IndexedDB `dailylog-clips`; tidak ikut cadangan JSON, tidak dikirim ke mana pun), label bagian skrip, putar/simpan/hapus. Bila IndexedDB tidak tersedia: hanya di memori dan diberi tahu. Memakai kamera dan perekam tab Rekam (cmRec) tanpa mengubah hasil "Rekaman terakhir". */
const CL_MAX = 60, CL_SG = ['Bebas', 'Hook', 'Progres', 'Pelajaran', 'Closing'], CL_DUR = [3, 4, 5], CL_SHOW = 8;
const CL = { items: [], ready: false, loading: false, mem: false, err: '', blobs: {}, urls: {}, qc: null, keep: null, sec: 4, sg: -1, cdOn: false, cd: 0, cx: false, busy: '', msg: '', open: '', all: false, tm: 0, iv: 0 };
const clSleep = ms => new Promise(r => setTimeout(r, ms));
const clP2 = n => String(n).padStart(2, '0');
const clId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clSec = s => (Math.round(s * 10) / 10).toFixed(1).replace('.', ',');
const clSize = b => b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const clExt = m => /mp4/.test(m || '') ? 'mp4' : 'webm';
function clWhen(t) { const d = new Date(t), dt = d.getFullYear() + '-' + clP2(d.getMonth() + 1) + '-' + clP2(d.getDate()); return (dt === today() ? 'Hari ini ' : d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + ' ') + clP2(d.getHours()) + '.' + clP2(d.getMinutes()); }
function clName(r) { const d = new Date(r.t); return 'klip-' + r.d + '-' + clP2(d.getHours()) + clP2(d.getMinutes()) + clP2(d.getSeconds()) + '-' + CL_SG[r.sg + 1].toLowerCase() + '.' + clExt(r.mime); }
function clClean(r) {   // bersihkan catatan dari penyimpanan
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const id = typeof r.id === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(r.id) ? r.id : '';
  const sec = Number(r.sec), t = Number(r.t); if (!id || !(sec > 0 && sec <= 600) || !(t > 0)) return null;
  const w = Number(r.w), h = Number(r.h), by = Number(r.bytes);
  return { id, t, d: typeof r.d === 'string' && DATE_RE.test(r.d) ? r.d : today(), sec, sg: [-1, 0, 1, 2, 3].includes(r.sg) ? r.sg : -1, mime: typeof r.mime === 'string' ? r.mime.slice(0, 40) : 'video/webm', bytes: by > 0 ? by : 0, w: w > 0 && w < 10000 ? Math.round(w) : 0, h: h > 0 && h < 10000 ? Math.round(h) : 0, th: typeof r.th === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]{1,30000}$/.test(r.th) ? r.th : '' };
}

/* --- penyimpanan IndexedDB: toko 'm' (catatan kecil + gambar mini) dan 'b' (isi video) --- */
let clDbP = null;
function clOpen() {
  if (clDbP) return clDbP;
  clDbP = new Promise((res, rej) => {
    try {
      if (!window.indexedDB) return rej(new Error('tanpa IndexedDB'));
      const q = indexedDB.open('dailylog-clips', 1);
      q.onupgradeneeded = () => { const db = q.result; if (!db.objectStoreNames.contains('m')) db.createObjectStore('m', { keyPath: 'id' }); if (!db.objectStoreNames.contains('b')) db.createObjectStore('b', { keyPath: 'id' }); };
      q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error || new Error('IndexedDB gagal')); q.onblocked = () => rej(new Error('IndexedDB terblokir'));
    } catch (e) { rej(e); }
  });
  clDbP.catch(() => { clDbP = null; });
  return clDbP;
}
const clReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function clAll() { const db = await clOpen(); return clReq(db.transaction('m').objectStore('m').getAll()); }
async function clPut(rec, blob) {
  const db = await clOpen();
  const go = body => new Promise((res, rej) => { let tx; try { tx = db.transaction(['m', 'b'], 'readwrite'); tx.objectStore('m').put(rec); tx.objectStore('b').put(body); } catch (e) { rej(e); return; } tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error || new Error('simpan gagal')); });
  try { await go({ id: rec.id, blob }); }
  catch (e) { if (e && e.name === 'QuotaExceededError') throw e; await go({ id: rec.id, ab: await blob.arrayBuffer(), type: blob.type }); }   // peramban lama: simpan sebagai ArrayBuffer
}
async function clPutM(rec) { const db = await clOpen(); return new Promise((res, rej) => { const tx = db.transaction('m', 'readwrite'); tx.objectStore('m').put(rec); tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error); }); }
async function clRemove(id) { const db = await clOpen(); return new Promise((res, rej) => { const tx = db.transaction(['m', 'b'], 'readwrite'); tx.objectStore('m').delete(id); tx.objectStore('b').delete(id); tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error); }); }
async function clBlob(id) {
  if (CL.blobs[id]) return CL.blobs[id];
  const db = await clOpen(), r = await clReq(db.transaction('b').objectStore('b').get(id));
  if (!r) throw new Error('klip tidak ada'); return r.blob || new Blob([r.ab], { type: r.type || 'video/webm' });
}
async function clLoad() {
  if (CL.loading || CL.ready) return; CL.loading = true;
  try { CL.items = (await clAll()).map(clClean).filter(Boolean).sort((a, b) => b.t - a.t); CL.mem = false; }
  catch (e) { CL.mem = true; CL.err = String(e && e.message || e); }
  CL.loading = false; CL.ready = true; clPaint();
}

/* --- rekam --- */
function clThumb() {   // gambar mini dari tampilan kamera saat ini (JPEG kecil); kosong bila gagal
  try {
    const src = CM.mode === 'kanvas' && CM.cv ? CM.cv : $('#cmVid'), sw = src && (src.videoWidth || src.width), sh = src && (src.videoHeight || src.height); if (!sw || !sh) return '';
    const c = document.createElement('canvas'); c.width = 72; c.height = 128; const x = c.getContext('2d'), k = Math.max(72 / sw, 128 / sh);
    x.fillStyle = '#000'; x.fillRect(0, 0, 72, 128); x.drawImage(src, (72 - sw * k) / 2, (128 - sh * k) / 2, sw * k, sh * k);
    const u = c.toDataURL('image/jpeg', 0.6); return /^data:image\/jpeg;base64,/.test(u) && u.length < 30000 ? u : '';
  } catch (e) { return ''; }
}
async function clCount(n) { CL.cx = false; for (let i = n; i > 0; i--) { CL.cd = i; clBtn(); await clSleep(1000); if (CL.cx || !CM.st) { CL.cd = 0; return false; } } CL.cd = 0; return true; }
async function clStart(sg) {
  if (CL.qc || CL.busy || CL.cd) return;
  if (CL.items.length >= CL_MAX) { CL.msg = 'Sudah ' + CL_MAX + ' klip. Simpan atau hapus yang lama dulu.'; return clPaint(); }
  if (sg === -1 || (sg >= 0 && sg <= 3)) CL.sg = sg;
  if (CM.mr && CM.mr.state === 'recording') { CL.msg = 'Sedang merekam. Hentikan dulu.'; return clPaint(); }
  let opened = false;
  if (!CM.st) {
    CL.busy = 'cam'; CL.msg = 'Membuka kamera…'; clPaint();
    await cmStart();
    for (let i = 0; i < 80 && CM.st && !CM.mode; i++) await clSleep(100);
    CL.busy = ''; opened = true;
    if (!CM.st) { CL.msg = 'Kamera belum terbuka. Lihat keterangan di atas (izin kamera).'; return clPaint(); }
  }
  if (CL.cdOn || opened) { CL.msg = opened ? 'Kamera baru dibuka: bersiap, merekam sebentar lagi.' : ''; clPaint(); if (!(await clCount(3))) { CL.msg = 'Dibatalkan.'; return clPaint(); } }
  if (!CM.st || (CM.mr && CM.mr.state === 'recording')) { CL.msg = 'Kamera tidak siap.'; return clPaint(); }
  CL.keep = { sec: CM.sec, last: CM.last, ext: CM.ext, fdim: CM.fdim };
  const th = clThumb();
  cmRec();
  if (!(CM.mr && CM.mr.state === 'recording')) { CL.keep = null; CL.msg = 'Perekam tidak bisa mulai.'; return clPaint(); }
  CL.qc = { sg: CL.sg, th, t: Date.now(), w: CM.last ? CM.last.w : 0, h: CM.last ? CM.last.h : 0, max: CL.sec };
  clearTimeout(CL.tm); CL.tm = setTimeout(() => { if (CL.qc && CM.mr && CM.mr.state === 'recording') CM.mr.stop(); }, CL.sec * 1000);
  clearInterval(CL.iv); CL.iv = setInterval(() => { if (!CL.qc) { clearInterval(CL.iv); CL.iv = 0; } clBtn(); }, 200);
  CL.msg = ''; clPaint();
}
function clTake(chunks, mime) {   // dipanggil dari mr.onstop di cmRec; true bila rekaman ini milik klip cepat (hasilnya tidak menggantikan "Rekaman terakhir")
  const q = CL.qc; if (!q) return false;
  CL.qc = null; clearTimeout(CL.tm); clearInterval(CL.iv); CL.iv = 0;
  const sec = Math.max(0, (Date.now() - CM.t0) / 1000), k = CL.keep; CL.keep = null;
  if (k) { CM.sec = k.sec; CM.last = k.last; CM.ext = k.ext; CM.fdim = k.fdim; }
  const blob = new Blob(chunks, { type: mime || 'video/webm' });
  if (sec < 0.8 || !blob.size) { CL.msg = 'Klip terlalu pendek, tidak disimpan.'; clPaint(); return true; }
  clAdd(blob, sec, q); return true;
}
async function clAdd(blob, sec, q) {
  const rec = { id: clId(), t: q.t, d: today(), sec: Math.round(sec * 10) / 10, sg: q.sg, mime: blob.type || 'video/webm', bytes: blob.size, w: q.w, h: q.h, th: q.th };
  CL.items.unshift(rec); CL.blobs[rec.id] = blob;
  CL.msg = 'Klip ' + clSec(rec.sec) + ' dtk disimpan' + (rec.sg >= 0 ? ' di bagian ' + CL_SG[rec.sg + 1] : '') + '.'; shtClip(rec); clhRefresh(); clPaint();
  try { await clPut(rec, blob); delete CL.blobs[rec.id]; }
  catch (e) { rec.mem = true; CL.mem = true; CL.err = String(e && e.name || e); CL.msg = 'Klip tidak bisa disimpan permanen (' + CL.err + '). Klip hanya ada di memori sampai halaman ditutup: simpan ke berkas sekarang.'; }
  clPaint();
}

/* --- tampilan --- */
function clBtn() {
  const b = $('#clRec'); if (!b) return;
  const rec = !!(CM.mr && CM.mr.state === 'recording');
  if (CL.cd > 0) { b.textContent = 'Mulai dalam ' + CL.cd + '… (ketuk untuk batal)'; b.disabled = false; return; }
  if (CL.qc && rec) { b.textContent = 'Berhenti · ' + clSec(Math.min(CL.qc.max, (Date.now() - CL.qc.t) / 1000)) + ' / ' + CL.qc.max + ' dtk'; b.disabled = false; return; }
  b.textContent = CL.busy === 'cam' ? 'Membuka kamera…' : CM.st ? 'Rekam klip ' + CL.sec + ' dtk' : 'Buka kamera dan rekam klip';
  b.disabled = !!CL.busy || CL.items.length >= CL_MAX || (rec && !CL.qc);
}
function clItem(r) {
  const o = CL.open === r.id;
  return '<div class="clit" data-id="' + esc(r.id) + '">' + (r.th ? '<img class="clth" alt="" src="' + r.th + '">' : '<div class="clth" aria-hidden="true"></div>') +
    '<div class="clmeta"><b>' + esc(clWhen(r.t)) + '</b> · ' + clSec(r.sec) + ' dtk · ' + clSize(r.bytes) + (r.mem ? ' · <span class="bad">belum tersimpan permanen</span>' : '') +
    '<label class="clsl">Bagian <select data-cl="isg" data-id="' + esc(r.id) + '" aria-label="Bagian skrip untuk klip ' + esc(clWhen(r.t)) + '">' + CL_SG.map((n, i) => '<option value="' + (i - 1) + '"' + (r.sg === i - 1 ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
    '<div class="clact"><button class="pill" data-q="clPlay" data-id="' + esc(r.id) + '" aria-pressed="' + o + '">' + (o ? 'Tutup' : 'Putar') + '</button><button class="pill" data-q="clSave" data-id="' + esc(r.id) + '">Simpan</button><button class="pill" data-q="clDel" data-id="' + esc(r.id) + '">Hapus</button></div></div>' +
    (o && CL.urls[r.id] ? '<video class="clvid" controls playsinline src="' + CL.urls[r.id] + '"></video>' : '') + '</div>';
}
function clInner() {
  const n = CL.items.length, tot = CL.items.reduce((a, r) => a + r.bytes, 0), td = CL.items.filter(r => r.d === today()).length;
  const pl = (k, v, t) => '<button class="pill" data-q="clOpt" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (CL[k] === v) + '">' + t + '</button>';
  let h = '<h3>Klip cepat</h3><p class="note">Rekam 3-5 detik di sela kerja; otomatis berhenti dan tersimpan di perangkat ini. Beri label bagian skripnya supaya mudah dirakit di akhir hari.</p>' +
    '<div class="clopt" role="group" aria-label="Lama klip">' + CL_DUR.map(d => pl('sec', d, d + ' dtk')).join('') + '<button class="pill" data-q="clCd" aria-pressed="' + CL.cdOn + '">Mundur 3 dtk</button></div>' +
    '<label class="clsl clnext">Untuk bagian <select data-cl="nsg" aria-label="Bagian skrip untuk klip berikutnya">' + CL_SG.map((x, i) => '<option value="' + (i - 1) + '"' + (CL.sg === i - 1 ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>' +
    '<div class="cmrow"><button class="btn primary clrb" id="clRec" data-q="clRec">Rekam klip</button></div>' +
    '<p class="note" id="clMsg" role="status">' + esc(CL.msg) + '</p>' + clhSetHTML() + shtHTML() + mdHTML();
  if (CL.mem) h += '<p class="note sbw">Penyimpanan permanen tidak tersedia di peramban ini' + (CL.err ? ' (' + esc(CL.err) + ')' : '') + ': klip yang belum bertanda tersimpan hanya ada di memori. Simpan ke berkas sebelum menutup halaman.</p>';
  if (!CL.ready) return h + '<p class="note">Membaca klip tersimpan…</p>';
  h += '<div class="lbl"><span>Klip tersimpan</span><span class="sbn">' + n + ' klip' + (n ? ' · ' + clSize(tot) + ' · hari ini ' + td : '') + '</span></div>';
  if (!n) h += '<p class="note">Belum ada klip. Ketuk Rekam klip, lalu ulangi kapan saja di sela kerja.</p>';
  (CL.all ? CL.items : CL.items.slice(0, CL_SHOW)).forEach(r => { h += clItem(r); });
  if (n > CL_SHOW) h += '<div class="cmrow"><button class="btn" data-q="clAll">' + (CL.all ? 'Tampilkan lebih sedikit' : 'Tampilkan semua (' + n + ')') + '</button></div>';
  h += '<p class="note">Klip disimpan di IndexedDB perangkat ini: tidak ikut cadangan JSON dan tidak dikirim ke mana pun. Bila peramban membersihkan data situs, klip ikut hilang, jadi simpan klip penting ke berkas. Batas ' + CL_MAX + ' klip.</p>';
  return h;
}
function clPaint() { const b = $('#clBox'); if (!b) return; b.innerHTML = clInner(); clBtn(); }
function clHTML() { return '<div class="clx" id="clBox">' + clInner() + '</div>'; }
function clAfter() { if (!CL.ready && !CL.loading) clLoad(); clBtn(); }
function clRevoke(id) { if (CL.urls[id]) { URL.revokeObjectURL(CL.urls[id]); delete CL.urls[id]; } }
function clDl(blob, name) { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 15000); }

/* --- aksi --- */
QACT.clRec = () => {
  if (CL.cd > 0) { CL.cx = true; return; }
  if (CL.qc && CM.mr && CM.mr.state === 'recording') { CM.mr.stop(); return; }
  clStart();
};
QACT.clOpt = el => { const k = el.dataset.k, v = Number(el.dataset.v); if (k === 'sec' && CL_DUR.includes(v)) { CL.sec = v; clPaint(); } };
QACT.clCd = () => { CL.cdOn = !CL.cdOn; clPaint(); };
QACT.clAll = () => { CL.all = !CL.all; clPaint(); };
QACT.clPlay = async el => {
  const id = el.dataset.id; if (CL.open === id) { clRevoke(id); CL.open = ''; return clPaint(); }
  if (CL.open) clRevoke(CL.open); CL.open = '';
  try { CL.urls[id] = URL.createObjectURL(await clBlob(id)); CL.open = id; } catch (e) { CL.msg = 'Klip tidak bisa dibuka.'; }
  clPaint(); const v = $('#clBox video'); if (v) v.play().catch(() => {});
};
/* 78d: diganti modul 78d (QACT.clSave dengan pembersihan lokasi) */
QACT.clDel = async el => {
  const id = el.dataset.id, i = CL.items.findIndex(x => x.id === id); if (i < 0) return;
  const rec = CL.items[i]; let blob = null; try { blob = await clBlob(id); } catch (e) { blob = null; }
  CL.items.splice(i, 1); clRevoke(id); if (CL.open === id) CL.open = ''; delete CL.blobs[id]; CL.msg = ''; clPaint();
  try { await clRemove(id); } catch (e) { /* sudah hilang dari daftar; abaikan */ }
  toast('Klip dihapus', blob ? { label: 'Urungkan', fn: async () => {
    CL.items.push(rec); CL.items.sort((a, b) => b.t - a.t); CL.blobs[id] = blob; clPaint();
    try { await clPut(rec, blob); delete CL.blobs[id]; } catch (e) { rec.mem = true; } clPaint();
  } } : undefined);
};
document.addEventListener('change', async ev => {
  const el = ev.target, k = el.dataset && el.dataset.cl; if (!k) return;
  const v = Number(el.value); if (!(v === -1 || (v >= 0 && v <= 3))) return;
  if (k === 'nsg') { CL.sg = v; return; }
  if (k === 'isg') { const r = CL.items.find(x => x.id === el.dataset.id); if (!r) return; r.sg = v; try { if (!r.mem) await clPutM(r); } catch (e) { toast('Label tidak tersimpan'); } }
});
QACT.clGo = () => { cnTab = 'cam'; showView('content'); if (!CM.st) setTimeout(() => { if (curView === 'content' && cnTab === 'cam' && !CM.st) cmStart(); }, 60); };
window.DL = Object.freeze(Object.assign({}, window.DL, { b78c: Object.freeze({
  st: () => ({ ready: CL.ready, mem: CL.mem, err: CL.err, n: CL.items.length, sec: CL.sec, sg: CL.sg, qc: !!CL.qc, cd: CL.cd, busy: CL.busy, msg: CL.msg, open: CL.open, mem2: Object.keys(CL.blobs).length }),
  items: () => CL.items.map(r => ({ id: r.id, d: r.d, t: r.t, sec: r.sec, sg: r.sg, mime: r.mime, bytes: r.bytes, w: r.w, h: r.h, th: r.th.length, mem: !!r.mem })),
  start: sg => clStart(sg), clean: clClean, name: clName,
  wipe: async () => { for (const r of CL.items.slice()) { try { await clRemove(r.id); } catch (e) {} } CL.items = []; CL.blobs = {}; clPaint(); },
  noIdb: () => { clDbP = Promise.reject(new Error('uji: IndexedDB mati')); clDbP.catch(() => {}); }
}) }));
/* 78c-end */
/* 78c2-begin: Fase 3, tab Rekam: DAFTAR SHOT PER SEGMEN skrip (saran visual lokal per bagian, ceklis per hari, hitungan klip hari ini per bagian, tombol Rekam per shot yang mencentang sendiri sesudah klipnya tersimpan, dan saran shot dari Gemini bila AI nyala). Data kecil `dailylog:shots:v1` (khusus perangkat ini, hanya hari ini, tidak ikut ekspor JSON). Gemini hanya menerima teks PUBLIK segmen (sama seperti Poin bicara). */
const SHT_KEY = 'dailylog:shots:v1', SHT_LEN = 90, SHT_N = 4;
const SHT = { d: '', u: 0, ck: {}, ai: {}, ready: false, loading: false, busy: false, msg: '', pend: null, open: -1 };
function shtBlank() { return { d: today(), u: 0, ck: {}, ai: {} }; }
function shtClean(raw) {   // bersihkan data tersimpan; ceklis hanya berlaku untuk hari ini
  const o = shtBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  if (typeof raw.d !== 'string' || !DATE_RE.test(raw.d) || raw.d !== today()) return o;
  const u = Number(raw.u); o.u = u > 0 ? u : 0;
  for (let i = 0; i < SHT_N; i++) {
    const c = raw.ck && typeof raw.ck === 'object' && !Array.isArray(raw.ck) ? raw.ck[i] : null;
    if (c && typeof c === 'object' && !Array.isArray(c)) { const m = {}; Object.keys(c).slice(0, 12).forEach(k => { if (/^[la][0-9]$/.test(k) && c[k] === 1) m[k] = 1; }); if (Object.keys(m).length) o.ck[i] = m; }
    const a = raw.ai && typeof raw.ai === 'object' && !Array.isArray(raw.ai) ? raw.ai[i] : null;
    if (a && typeof a === 'object' && typeof a.t === 'string' && Array.isArray(a.k)) {
      const k = a.k.filter(x => typeof x === 'string').map(shtIdea).filter(Boolean).slice(0, 3);
      if (k.length) o.ai[i] = { t: a.t.slice(0, 800), k };
    }
  }
  return o;
}
const shtIdea = x => String(x).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, SHT_LEN);
function shtCur() { if (SHT.d !== today()) { const b = shtBlank(); SHT.d = b.d; SHT.u = 0; SHT.ck = {}; SHT.ai = {}; SHT.open = -1; SHT.pend = null; } }
function shtSave() { SHT.u = Date.now(); dirty.sht = true; queueSave('sht'); }
STORES.sht = { key: SHT_KEY, get: () => ({ d: SHT.d, u: SHT.u, ck: SHT.ck, ai: SHT.ai }) }; dirty.sht = false;   // ikut cadangan JSON dan sinkron hanya untuk HARI INI (v107b, extra.shots)
async function shtLoad() {
  if (SHT.loading || SHT.ready) return; SHT.loading = true;
  try {
    const raw = await Promise.race([store.load(SHT_KEY), new Promise(r => setTimeout(() => r(null), 4000))]);
    const o = shtClean(raw); if (!(SHT.u > 0)) { SHT.d = o.d; SHT.u = o.u; SHT.ck = o.ck; SHT.ai = o.ai; }
  } catch (e) { /* data rusak: mulai kosong */ }
  SHT.loading = false; SHT.ready = true; clPaint();
}
function shtLocal(i, F) {   // saran shot lokal per segmen (tanpa AI, tanpa jaringan)
  let a;
  if (i === 0) a = ['Wajah dekat, tatap lensa, ucapkan kalimat pembuka', 'Berjalan ke arah kamera lalu berhenti dan menyapa', 'Angka di timbangan atau layar app (tutup data pribadi)'];
  else if (i === 1) a = (F.vis.length ? F.vis.map(v => 'Rekam ' + v + ' beberapa detik') : ['Rekam latihan, sepeda, atau makananmu beberapa detik']).concat(['Close-up porsi makan atau gelas minum', 'Sepatu atau alat latihan di lantai']);
  else if (i === 2) a = [pdb.tkLesson === 'ganti' ? 'Gelas air putih dingin, lalu satu gerakan push-up' : pdb.tkLesson === 'catat' ? 'Catatan kalori atau buku catatanmu di layar' : 'Peragakan triknya: tangan dan bendanya kelihatan', 'Dua klip pendek: sebelum dan sesudah', 'Wajah menjelaskan, satu kalimat saja'];
  else a = ['Tatap lensa, ucapkan kalimat penutup', 'Angka berat awal dan sekarang di layar (tutup data pribadi)', 'Anggukan atau lambaian penutup'];
  return a.slice(0, 4).map((t, k) => ({ id: 'l' + k, t }));
}
function shtIdeas(i, s, F) {
  const o = SHT.ai[i], tx = s.pub != null ? s.pub : s.text;
  return o && o.t === tx ? o.k.map((t, k) => ({ id: 'a' + k, t })) : shtLocal(i, F);
}
function shtData() { shtCur(); const segs = tkSegs().slice(0, SHT_N), F = tkFacts(); return segs.map((s, i) => ({ i, n: s.n, tm: s.t, ai: !!(SHT.ai[i] && SHT.ai[i].t === (s.pub != null ? s.pub : s.text)), ideas: shtIdeas(i, s, F) })); }
const shtDone = (i, ideas) => ideas.filter(x => SHT.ck[i] && SHT.ck[i][x.id]).length;
function shtHTML() {
  if (!SHT.ready && !SHT.loading) shtLoad();
  let D; try { D = shtData(); } catch (e) { return ''; }
  const td = today(), nCl = i => CL.items.filter(r => r.d === td && r.sg === i).length, ready = CL.ready;
  let tot = 0, dn = 0; D.forEach(g => { tot += g.ideas.length; dn += shtDone(g.i, g.ideas); });
  const firstOpen = D.find(g => shtDone(g.i, g.ideas) < g.ideas.length), op = SHT.open === -1 ? (firstOpen ? firstOpen.i : -2) : SHT.open;
  const rd = AI.ready(), cl = ready ? CL.items.filter(r => r.d === td).length : 0;
  let h = '<h3>Daftar shot hari ini</h3><p class="note">Saran visual per bagian skrip. Ketuk Rekam di samping shot: klip 3-5 detik akan dilabeli bagian itu dan shot tercentang sendiri setelah klipnya tersimpan. Bisa juga dicentang manual.</p>' +
    '<div class="shtl-sum" role="status"><span>' + dn + ' dari ' + tot + ' shot selesai</span>' + (ready ? '<span>' + cl + ' klip hari ini</span>' : '') + '</div>';
  D.forEach(g => {
    const d2 = shtDone(g.i, g.ideas), o = op === g.i, nc = nCl(g.i);
    h += '<section class="shtl-sg' + (d2 === g.ideas.length && g.ideas.length ? ' fin' : '') + '"><button class="shtl-h" data-q="shtOpen" data-i="' + g.i + '" aria-expanded="' + o + '"><b>' + esc(g.n) + '</b><span class="shtl-tm">' + esc(g.tm) + '</span><span class="shtl-n">' + d2 + '/' + g.ideas.length + (ready ? ' · ' + nc + ' klip' : '') + '</span></button>';
    if (o) {
      h += '<div class="shtl-b">' + (g.ai ? '<p class="note">✦ Saran Gemini. Bisa keliru; pilih yang cocok dengan tempat dan waktumu.</p>' : '');
      g.ideas.forEach(x => {
        const on = !!(SHT.ck[g.i] && SHT.ck[g.i][x.id]);
        h += '<div class="shtl-i' + (on ? ' on' : '') + '"><label class="shtl-ck"><input type="checkbox" data-sht="ck" data-sg="' + g.i + '" data-id="' + x.id + '"' + (on ? ' checked' : '') + '><span>' + esc(x.t) + '</span></label><button class="pill" data-q="shtRec" data-sg="' + g.i + '" data-id="' + x.id + '" aria-label="Rekam klip untuk shot: ' + esc(x.t) + '">Rekam</button></div>';
      });
      h += '<div class="clact"><button class="pill" data-q="shtRec" data-sg="' + g.i + '" data-id="">Rekam klip bagian ini</button>' +
        '<button class="pill" data-q="shtAi"' + (SHT.busy ? ' disabled' : '') + '>' + (SHT.busy ? 'Menunggu Gemini…' : rd.ok ? 'Saran Gemini' : 'Saran Gemini (AI mati)') + '</button>' +
        (g.ai ? '<button class="pill" data-q="shtLocalOnly" data-sg="' + g.i + '">Saran lokal</button>' : '') + '</div></div>';
    }
    h += '</section>';
  });
  h += '<p class="note" id="shtMsg" role="status">' + esc(SHT.msg) + '</p><div class="cmrow"><button class="btn" data-q="shtReset">Kosongkan ceklis hari ini</button></div>' +
    '<p class="note">Ceklis dan saran hanya berlaku untuk hari ini dan tersimpan di perangkat ini saja (tidak ikut cadangan JSON). Gemini hanya menerima teks segmen yang berlabel publik.</p>';
  return '<div class="shtl">' + h + '</div>';
}
function shtClip(rec) {   // dipanggil dari clAdd sesudah klip tersimpan: centang shot yang sedang direkam
  const p = SHT.pend; SHT.pend = null;
  if (!p || !p.id || rec.sg !== p.sg || rec.t < p.t || rec.t - p.t > 90000) return;
  shtCur(); const m = SHT.ck[p.sg] || (SHT.ck[p.sg] = {});
  if (!m[p.id]) { m[p.id] = 1; shtSave(); CL.msg += ' Shot dicentang.'; }
}
const shtClRec = QACT.clRec; QACT.clRec = function () { SHT.pend = null; return shtClRec.apply(this, arguments); };   // ketuk tombol utama (termasuk membatalkan hitung mundur) membatalkan shot yang menunggu
QACT.shtOpen = el => { const i = Number(el.dataset.i); if (!(i >= 0 && i < SHT_N)) return; const cur = SHT.open === -1 ? -3 : SHT.open; SHT.open = cur === i ? -2 : i; clPaint(); };
QACT.shtRec = el => {
  const sg = Number(el.dataset.sg), id = String(el.dataset.id || ''); if (!(sg >= 0 && sg < SHT_N) || (id && !/^[la][0-9]$/.test(id))) return;
  if (CL.qc || CL.busy || CL.cd) return;
  shtCur(); SHT.pend = id ? { sg, id, t: Date.now() } : null; clStart(sg);
};
QACT.shtReset = () => { shtCur(); SHT.ck = {}; SHT.msg = ''; shtSave(); clPaint(); };
QACT.shtLocalOnly = el => { const i = Number(el.dataset.sg); if (!(i >= 0 && i < SHT_N)) return; delete SHT.ai[i]; if (SHT.ck[i]) { Object.keys(SHT.ck[i]).forEach(k => { if (k[0] === 'a') delete SHT.ck[i][k]; }); } shtSave(); clPaint(); };
document.addEventListener('change', ev => {
  const el = ev.target; if (!el.dataset || el.dataset.sht !== 'ck') return;
  const sg = Number(el.dataset.sg), id = String(el.dataset.id || ''); if (!(sg >= 0 && sg < SHT_N) || !/^[la][0-9]$/.test(id)) return;
  shtCur(); const m = SHT.ck[sg] || (SHT.ck[sg] = {}); if (el.checked) m[id] = 1; else delete m[id];
  shtSave(); clPaint(); const b = document.querySelector('[data-sht="ck"][data-sg="' + sg + '"][data-id="' + id + '"]'); if (b) b.focus();
});
const SHT_SYS = 'Kamu sutradara video vertikal pendek untuk vlog diet harian. Untuk tiap segmen skrip, usulkan 3 ide shot (apa yang direkam kamera) yang singkat, konkret, dan bisa direkam sendiri dengan HP dalam 3 sampai 5 detik, maksimal 12 kata per ide. ' +
  'Pakai hanya hal yang ada di teks segmen atau benda umum (wajah, tangan, makanan, minuman, sepeda, sepatu). Jangan menambah fakta, angka, atau nama. Jangan usulkan merekam orang lain, anak-anak, plat nomor, alamat, atau layar yang berisi data pribadi. ' +
  'Segmen kosong atau berupa [isi: ...] tetap diberi ide umum yang cocok dengan namanya. Balas HANYA JSON: {"shots":[[...],[...],[...],[...]]} dengan urutan yang sama dengan segmen.';
QACT.shtAi = async () => {
  const rd = AI.ready(); if (!rd.ok) { SHT.msg = rd.msg; clPaint(); return; }
  if (SHT.busy) return; shtCur(); const segs = tkSegs().slice(0, SHT_N); SHT.busy = true; SHT.msg = 'Gemini menyusun saran shot…'; clPaint();
  const r = await AI.ask({ task: 'shots', system: SHT_SYS, user: segs.map((s, i) => (i + 1) + '. ' + s.n + ' (' + s.t + '): ' + (s.pub || '')).join('\n'), json: true, max: 700, timeout: 30000 });
  SHT.busy = false; SHT.msg = '';
  if (r.ok && r.data && Array.isArray(r.data.shots)) {
    let n = 0;
    r.data.shots.slice(0, SHT_N).forEach((a, i) => {
      if (!Array.isArray(a) || !segs[i]) return;
      const k = a.filter(x => typeof x === 'string').map(shtIdea).filter(Boolean).slice(0, 3); if (!k.length) return;
      SHT.ai[i] = { t: segs[i].pub != null ? segs[i].pub : segs[i].text, k };
      if (SHT.ck[i]) Object.keys(SHT.ck[i]).forEach(x => { if (x[0] === 'a') delete SHT.ck[i][x]; });
      n++;
    });
    if (n) { shtSave(); SHT.msg = 'Saran Gemini dipasang untuk ' + n + ' bagian.'; } else SHT.msg = 'Jawaban Gemini kosong. Saran lokal tetap dipakai.';
  } else if (r.code !== 'cancelled') SHT.msg = (r.msg || 'AI gagal.') + ' Saran lokal tetap dipakai.';
  clPaint();
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b78c2: Object.freeze({
  st: () => ({ ready: SHT.ready, d: SHT.d, ck: JSON.parse(JSON.stringify(SHT.ck)), ai: JSON.parse(JSON.stringify(SHT.ai)), busy: SHT.busy, msg: SHT.msg, pend: SHT.pend, open: SHT.open }),
  data: () => shtData().map(g => ({ i: g.i, n: g.n, ai: g.ai, ideas: g.ideas.map(x => x.id + '|' + x.t), done: shtDone(g.i, g.ideas) })),
  clean: shtClean, key: SHT_KEY,
  lesson: x => { pdb.tkLesson = 'custom'; tkS.custom = x; clPaint(); }, paint: () => clPaint()   // gancing uji
}) }));
/* 78c2-end */
/* 78c3-begin: Fase 3, SOROTAN PENGINGAT KLIP di Beranda. Bila dinyalakan di tab Rekam dan sudah lewat jam yang diatur tetapi belum ada klip hari ini, Beranda menampilkan kartu lembut "Belum ada klip hari ini" dengan tombol Rekam klip (langsung ke tab Rekam) dan Tutup untuk hari ini. Aplikasi tidak punya notifikasi dorong: kartu hanya muncul saat aplikasi terbuka. Data kecil `dailylog:clrem:v1` (khusus perangkat ini, tidak ikut ekspor JSON). Mati = Beranda identik dengan 78c-2. */
const CLH_KEY = 'dailylog:clrem:v1', CLH_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLH = { on: false, t: '15:00', hide: '', u: 0, ready: false, loading: false, last: '' };
function clhClean(raw) {
  const o = { on: false, t: '15:00', hide: '', u: 0 };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  o.on = raw.on === true;
  if (typeof raw.t === 'string' && CLH_RE.test(raw.t)) o.t = raw.t;
  if (typeof raw.hide === 'string' && DATE_RE.test(raw.hide)) o.hide = raw.hide;
  const u = Number(raw.u); o.u = u > 0 ? u : 0;
  return o;
}
STORES.clh = { key: CLH_KEY, get: () => ({ on: CLH.on, t: CLH.t, hide: CLH.hide, u: CLH.u }) }; dirty.clh = false;   // khusus perangkat: tidak ikut ekspor JSON
function clhSave() { CLH.u = Date.now(); dirty.clh = true; queueSave('clh'); }
async function clhLoad() {
  if (CLH.loading || CLH.ready) return; CLH.loading = true;
  try {
    const raw = await Promise.race([store.load(CLH_KEY), new Promise(r => setTimeout(() => r(null), 4000))]);
    const o = clhClean(raw); if (!(CLH.u > 0)) { CLH.on = o.on; CLH.t = o.t; CLH.hide = o.hide; CLH.u = o.u; }
  } catch (e) { /* data rusak: mulai mati */ }
  CLH.loading = false; CLH.ready = true; clhRefresh(); try { clPaint(); } catch (e) { /* tab Rekam belum ada */ }
}
const clhMin = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
function clhDue() {   // true bila kartu harus tampil sekarang
  if (!CLH.ready || !CLH.on) return false;
  if (CLH.hide === today()) return false;
  const n = new Date(); if (n.getHours() * 60 + n.getMinutes() < clhMin(CLH.t)) return false;
  if (!CL.ready) { if (!CL.loading) clLoad().then(clhRefresh); return false; }
  return !CL.items.some(r => r.d === today());
}
function clhHTML() {
  if (!CLH.ready && !CLH.loading) clhLoad();
  let due = false; try { due = clhDue(); } catch (e) { due = false; }
  CLH.last = due ? 'y' : 'n';
  if (!due) return '';
  return '<section class="sec" id="clhBox"><h2>Klip hari ini</h2><div class="plan clh"><div><b>Belum ada klip hari ini</b><small>Sudah lewat pukul ' + esc(CLH.t.replace(':', '.')) + '. Rekam 3-5 detik saja di sela kerja; tidak perlu sempurna.</small></div><button class="btn sm primary" data-q="clhGo">Rekam klip</button></div>' +
    '<p class="note" style="margin-top:0"><button class="link tap" data-q="clhHide">Tutup untuk hari ini</button></p></section>';
}
function clhRefresh() {   // gambar ulang Beranda hanya bila status tampil/tidak berubah
  if (curView !== 'home' || document.hidden) return;
  let due = false; try { due = clhDue(); } catch (e) { due = false; }
  if ((due ? 'y' : 'n') !== CLH.last) renderHome();
}
setInterval(clhRefresh, 30000);
QACT.clhGo = () => { cnTab = 'cam'; showView('content'); };
QACT.clhHide = () => { CLH.hide = today(); clhSave(); renderHome(); toast('Pengingat klip disembunyikan sampai besok'); };
QACT.clhOn = () => { CLH.on = !CLH.on; clhSave(); clPaint(); const b = document.querySelector('[data-q="clhOn"]'); if (b) b.focus(); };
document.addEventListener('change', ev => {
  const el = ev.target; if (!el.dataset || el.dataset.clh !== 't') return;
  if (CLH_RE.test(el.value)) { CLH.t = el.value; CLH.hide = ''; clhSave(); } else el.value = CLH.t;
  clPaint(); const b = document.querySelector('[data-clh="t"]'); if (b) b.focus();
});
function clhSetHTML() {
  if (!CLH.ready && !CLH.loading) clhLoad();
  return '<div class="clhs"><h3>Pengingat klip</h3><p class="note">Bila nyala, Beranda menyorot kartu lembut setelah jam yang kamu atur selama belum ada klip hari ini. Aplikasi ini tidak bisa mengirim notifikasi dorong, jadi kartu hanya muncul saat aplikasi terbuka.</p>' +
    '<div class="clopt"><button class="pill" data-q="clhOn" aria-pressed="' + CLH.on + '">' + (CLH.on ? 'Pengingat nyala' : 'Pengingat mati') + '</button>' +
    '<label class="clsl">Setelah jam <input type="time" data-clh="t" value="' + esc(CLH.t) + '" aria-label="Jam mulai pengingat klip"></label></div>' +
    '<p class="note">Pengaturan ini tersimpan di perangkat ini saja (tidak ikut cadangan JSON).</p></div>';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b78c3: Object.freeze({
  st: () => ({ ready: CLH.ready, on: CLH.on, t: CLH.t, hide: CLH.hide, last: CLH.last }),
  clean: clhClean, key: CLH_KEY, due: () => clhDue(), refresh: () => clhRefresh()
}) }));
/* 78c3-end */
/* 78d-begin: Fase 3, HAPUS METADATA LOKASI + cek privasi sebelum posting. (1) Pemindai/pembersih MP4/MOV tanpa pustaka: mencari tag lokasi (©xyz, xyz, loci, kotak gps, kunci meta bernama location/gps/ISO6709 beserta nilainya) lalu menetralkannya TANPA mengubah ukuran berkas (kotak diganti 'free' berisi nol), sehingga tidak ada offset yang bergeser. (2) Tiap klip yang disimpan dari tab Rekam otomatis dipindai dan dibersihkan. (3) Kartu "Bersihkan lokasi video": pilih video dari galeri, lihat apa yang ditemukan, simpan salinan bersih. (4) Trek GPS bertipe data (kamera Android/aksi) dan tanda di WebM hanya DIDETEKSI dan diberi tahu, tidak dihapus. Semua di perangkat, tanpa jaringan, tanpa AI. */
const MD_MAX = 300 * 1048576, MD_GEO = /location|gps|iso6709|geo|xyz|coordinat/i, MD_CONT = { moov: 1, trak: 1, mdia: 1, minf: 1, udta: 1 };
const MD = { busy: false, file: null, res: null, msg: '' };
const md4 = (u, p) => String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]);
function mdMeta(u, dv, p, hd, sz, o) {
  let s = p + hd; if (s + 4 > p + sz) return; if (dv.getUint32(s) === 0) s += 4;
  const e = p + sz; let keys = null, ilst = null, q = s;
  while (q + 8 <= e) { const z = dv.getUint32(q), t = md4(u, q + 4); if (z < 8 || q + z > e) break; if (t === 'keys') keys = { off: q, size: z }; else if (t === 'ilst') ilst = { off: q, size: z }; q += z; }
  if (!keys || keys.size < 16) return;
  const cnt = dv.getUint32(keys.off + 12), ke = keys.off + keys.size, idx = []; let r = keys.off + 16;
  for (let i = 1; i <= cnt && r + 8 <= ke; i++) {
    const z = dv.getUint32(r); if (z < 8 || r + z > ke) break;
    let name = ''; for (let b = r + 8; b < r + z; b++) name += String.fromCharCode(u[b]);
    if (MD_GEO.test(name) && !/^-+$/.test(name)) { idx.push(i); o.hits.push({ k: 'name', off: r + 8, end: r + z, why: 'Kunci lokasi: ' + name.replace(/[^\x20-\x7e]/g, '').slice(0, 40) }); }
    r += z;
  }
  if (ilst && idx.length) { q = ilst.off + 8; const ee = ilst.off + ilst.size; while (q + 8 <= ee) { const z = dv.getUint32(q), t = dv.getUint32(q + 4); if (z < 8 || q + z > ee) break; if (idx.includes(t)) o.hits.push({ k: 'box', off: q, size: z, hd: 8, why: 'Nilai lokasi (meta)' }); q += z; } }
}
function mdWalk(u, dv, s, e, depth, ctx, o) {
  let p = s;
  while (p + 8 <= e && depth < 8) {
    let sz = dv.getUint32(p), hd = 8; const ty = md4(u, p + 4);
    if (sz === 1) { if (p + 16 > e) { o.bad = true; break; } sz = dv.getUint32(p + 8) * 4294967296 + dv.getUint32(p + 12); hd = 16; } else if (sz === 0) sz = e - p;
    if (sz < hd || p + sz > e) { o.bad = true; break; }
    o.n++;
    if (ctx === 'udta' && (ty === '\xA9xyz' || ty === 'xyz ' || ty === 'loci')) o.hits.push({ k: 'box', off: p, size: sz, hd, why: ty === 'loci' ? 'Lokasi 3GPP (loci)' : 'Koordinat GPS (\xA9xyz)' });
    else if (ctx === 'moov' && ty === 'gps ') o.hits.push({ k: 'box', off: p, size: sz, hd, why: 'Data GPS (kotak gps)' });
    else if (ty === 'meta') mdMeta(u, dv, p, hd, sz, o);
    else if (ty === 'hdlr' && ctx === 'mdia' && p + hd + 12 <= p + sz) { if (md4(u, p + hd + 8) === 'meta') { let nm = ''; for (let b = p + hd + 12; b < p + sz && b < p + hd + 60; b++) nm += String.fromCharCode(u[b]); if (/gps|location|geo/i.test(nm)) o.gps.push('Trek data GPS'); } }
    else if (MD_CONT[ty]) mdWalk(u, dv, p + hd, p + sz, depth + 1, ty, o);
    p += sz;
  }
}
function mdVint(u, p, isId) {   // bilangan panjang-variabel EBML; null bila rusak
  const b = u[p]; if (!b) return null; let len = 1, mask = 0x80; while (len <= 8 && !(b & mask)) { len++; mask >>= 1; }
  if (len > 8 || p + len > u.length) return null;
  let v = isId ? b : (b & (mask - 1)), unk = !isId && (b & (mask - 1)) === mask - 1;
  for (let i = 1; i < len; i++) { v = v * 256 + u[p + i]; if (u[p + i] !== 255) unk = false; }
  return { v, len, unk };
}
function mdWebm(u) {   // hanya baca elemen Info dan Tags (bukan data Cluster), supaya byte video acak tidak memicu peringatan palsu
  let hit = false, guard = 0;
  const txt = (s, e) => { let t = ''; for (let i = s; i < e; i++) t += u[i] > 31 && u[i] < 127 ? String.fromCharCode(u[i]) : ' '; return t; };
  const walk = (p, e) => {
    while (p < e && guard++ < 5000) {
      const id = mdVint(u, p, true); if (!id) return; const sz = mdVint(u, p + id.len, false); if (!sz) return;
      const ds = p + id.len + sz.len, en = sz.unk ? e : Math.min(e, ds + sz.v);
      if (id.v === 0x18538067) walk(ds, en);
      else if (id.v === 0x1254c367 || id.v === 0x1549a966) { if (/ISO6709|GPS|LOCATION|GEOLOCAT/i.test(txt(ds, Math.min(en, ds + 262144)))) hit = true; }
      else if (id.v === 0x1f43b675 && sz.unk) return;
      if (sz.unk) return; p = en;
    }
  };
  walk(0, u.length); return hit;
}
function mdScan(buf) {   // buf: ArrayBuffer. Mengembalikan { kind, hits, gps, bad, n, warn }
  const u = new Uint8Array(buf), o = { kind: 'lain', hits: [], gps: [], bad: false, n: 0, warn: false };
  if (u.length >= 12 && md4(u, 4) === 'ftyp') { o.kind = 'mp4'; mdWalk(u, new DataView(buf), 0, u.length, 0, 'top', o); }
  else if (u.length >= 4 && u[0] === 0x1a && u[1] === 0x45 && u[2] === 0xdf && u[3] === 0xa3) { o.kind = 'webm'; o.warn = mdWebm(u); }
  return o;
}
function mdApply(buf, hits) {   // netralkan di tempat; ukuran berkas tidak berubah
  const u = new Uint8Array(buf);
  hits.forEach(h => {
    if (h.k === 'box') { u.fill(0, h.off + h.hd, h.off + h.size); u[h.off + 4] = 0x66; u[h.off + 5] = 0x72; u[h.off + 6] = 0x65; u[h.off + 7] = 0x65; }
    else u.fill(0x2d, h.off, h.end);
  });
}
async function mdClean(blob) {   // -> { blob, scan, n, skip }
  if (!blob || blob.size > MD_MAX) return { blob, scan: null, n: 0, skip: true };
  const buf = await blob.arrayBuffer(), sc = mdScan(buf);
  if (sc.kind === 'mp4' && sc.hits.length) {
    mdApply(buf, sc.hits); const again = mdScan(buf);
    if (!again.hits.length && !again.bad === !sc.bad) return { blob: new Blob([buf], { type: blob.type }), scan: sc, n: sc.hits.length, skip: false, after: again };
    return { blob, scan: sc, n: 0, skip: false, fail: true };
  }
  return { blob, scan: sc, n: 0, skip: false };
}
function mdMsg(m) {
  if (m.skip) return 'Berkas terlalu besar untuk dipindai.';
  if (m.fail) return 'Pembersihan gagal, berkas asli yang disimpan.';
  const s = m.scan; if (!s) return '';
  if (s.kind === 'mp4') return (m.n ? 'Metadata lokasi dihapus (' + m.n + ' tag).' : 'Tidak ada metadata lokasi.') + (s.gps.length ? ' Ada trek data GPS yang tidak bisa dihapus otomatis.' : '');
  if (s.kind === 'webm') return s.warn ? 'Ada penanda lokasi di berkas WebM; tidak bisa dihapus otomatis.' : 'Tidak ada metadata lokasi.';
  return 'Format tidak dikenal, tidak dipindai.';
}
QACT.clSave = async el => {
  const r = CL.items.find(x => x.id === el.dataset.id); if (!r) return;
  try { const m = await mdClean(await clBlob(r.id)); clDl(m.blob, clName(r)); toast(clName(r) + ' diunduh. ' + mdMsg(m)); } catch (e) { toast('Klip tidak bisa dibaca'); }
};
async function mdPick(f) {
  if (!f) return; MD.busy = true; MD.file = f; MD.res = null; MD.msg = ''; clPaint();
  try {
    if (f.size > MD_MAX) { MD.res = { name: f.name, size: f.size, big: true }; }
    else { const sc = mdScan(await f.arrayBuffer()); MD.res = { name: f.name, size: f.size, kind: sc.kind, hits: sc.hits.map(h => h.why), gps: sc.gps, warn: sc.warn, bad: sc.bad, done: false }; }
  } catch (e) { MD.msg = 'Berkas tidak bisa dibaca.'; MD.file = null; }
  MD.busy = false; clPaint();
}
document.addEventListener('change', ev => { const el = ev.target; if (el && el.dataset && el.dataset.md === 'file') { const f = el.files && el.files[0]; el.value = ''; mdPick(f); } });
QACT.mdSave = async () => {
  const f = MD.file, r = MD.res; if (!f || !r || r.kind !== 'mp4' || !r.hits.length || MD.busy) return;
  MD.busy = true; clPaint();
  try {
    const m = await mdClean(f);
    if (m.fail || m.skip || !m.n) MD.msg = mdMsg(m);
    else { const nm = 'bersih-' + String(f.name).replace(/[^\w.\- ]+/g, '_').slice(0, 80); clDl(m.blob, nm); r.done = true; MD.msg = 'Salinan bersih diunduh (' + nm + '). Dipindai ulang: 0 tag lokasi.'; }
  } catch (e) { MD.msg = 'Pembersihan gagal.'; }
  MD.busy = false; clPaint();
};
QACT.mdReset = () => { MD.file = null; MD.res = null; MD.msg = ''; clPaint(); };
QACT.mdTick = () => { try { tkV.pc[4] = true; const n = $('#tkPcN'); if (n) n.textContent = tkV.pc.filter(Boolean).length + ' dari ' + TK_PRIV.length; } catch (e) { /* tab Skrip belum dibuka */ } toast('Dicentang di Cek privasi sebelum posting'); };
function mdHTML() {
  const r = MD.res, kb = n => n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  let h = '<div class="mdx"><h3>Bersihkan lokasi video</h3><p class="note">Klip yang disimpan dari app ini sudah otomatis dipindai dan dibersihkan. Untuk video dari galeri HP: pilih berkasnya, lihat apa yang ditemukan, lalu simpan salinan bersih (MP4/MOV). Berkas tidak dikirim ke mana pun.</p>' +
    '<div class="cmrow"><label class="btn mdlbl" for="mdFile">Pilih video dari galeri</label><input id="mdFile" class="mdfile" type="file" accept="video/*" data-md="file" aria-label="Pilih video untuk dipindai metadata lokasinya"></div>';
  if (MD.busy) h += '<p class="note" role="status">Memindai…</p>';
  if (r && !MD.busy) {
    h += '<div class="mdres" role="status"><b>' + esc(r.name) + '</b> · ' + kb(r.size) + '<br>';
    if (r.big) h += 'Terlalu besar (lebih dari 300 MB) untuk dipindai di peramban. Bersihkan lewat editor video.';
    else if (r.kind === 'lain') h += 'Format tidak dikenal. Hanya MP4/MOV dan WebM yang bisa dipindai.';
    else if (r.kind === 'webm') h += r.warn ? 'Ada penanda lokasi di berkas WebM. Tidak bisa dihapus otomatis: ekspor ulang dari editor video.' : 'Tidak ada penanda lokasi (pemindaian ringan WebM).';
    else if (r.hits.length) h += (r.done ? 'Sudah dibersihkan pada salinan yang diunduh. ' : '') + 'Ditemukan ' + r.hits.length + ' tag lokasi:<ul>' + r.hits.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    else h += 'Tidak ditemukan metadata lokasi di berkas ini.';
    if (r.gps && r.gps.length) h += '<br><span class="bad">Terdeteksi trek data GPS. Tidak bisa dihapus otomatis: ekspor ulang dari editor video tanpa lokasi.</span>';
    if (r.bad) h += '<br>Struktur berkas tidak biasa; hasil pemindaian mungkin tidak lengkap.';
    h += '</div><div class="cmrow">';
    if (r.kind === 'mp4' && r.hits.length && !r.done) h += '<button class="btn primary" data-q="mdSave">Simpan salinan bersih</button>';
    if ((r.kind === 'mp4' && (r.done || !r.hits.length) && !(r.gps && r.gps.length)) || (r.kind === 'webm' && !r.warn)) h += '<button class="btn" data-q="mdTick">Centang di Cek privasi</button>';
    h += '<button class="btn" data-q="mdReset">Pilih lain</button></div>';
  }
  h += '<p class="note" id="mdMsg" role="status">' + esc(MD.msg) + '</p><p class="note">Yang dibaca hanya metadata berkas. Wajah, plat, nama toko, struk, atau papan nama yang terlihat di gambar tetap harus kamu cek sendiri di daftar Cek privasi (tab Skrip).</p></div>';
  return h;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b78d: Object.freeze({
  scan: buf => { const s = mdScan(buf); return { kind: s.kind, hits: s.hits.map(h => h.why), gps: s.gps, bad: s.bad, warn: s.warn, n: s.n }; },
  clean: async blob => { const m = await mdClean(blob); return { n: m.n, fail: !!m.fail, skip: !!m.skip, size: m.blob ? m.blob.size : 0, buf: m.blob ? Array.from(new Uint8Array(await m.blob.arrayBuffer())).length : 0 }; },
  msg: mdMsg, st: () => ({ busy: MD.busy, res: MD.res && JSON.parse(JSON.stringify(MD.res)), msg: MD.msg })
}) }));
/* 78d-end */
/* 79a-begin: Fase 4 (Word), tab STATISTIK: catat performa per video (views, durasi, rata-rata tonton, titik penonton pergi, like, komentar, share, simpan, pengikut baru), IMPOR CSV (TikTok Studio / Excel / Sheets; kolom dikenali otomatis, pratinjau sebelum masuk) dan ekspor CSV. Analisis lokal: retensi menurut jenis hook dan durasi, titik penonton paling sering pergi (bagian skrip), daftar hook terbaik. Data `dailylog:perf:v1` (khusus perangkat ini, tidak ikut ekspor JSON; cadangan = Ekspor CSV). Tanpa AI, tanpa jaringan. */
const TSX_KEY = 'dailylog:perf:v1', TSX_MAX = 400, TSX_CSV_CHARS = 2000000, TSX_ROWS = 2000;
const TSX_HT = { angka: 'Angka', tanya: 'Pertanyaan', akui: 'Pengakuan', aksi: 'Tengah aksi', kontra: 'Kontra-intuitif', lain: 'Lainnya' };
const TSX_SEG = ['Hook', 'Progres', 'Pelajaran', 'Closing'];
const TSX = { ready: false, loading: false, items: [], del: [], u: 0, form: null, imp: null };
STORES.tsx = { key: TSX_KEY, get: () => ({ v: 1, items: TSX.items, u: TSX.u, del: TSX.del }) }; dirty.tsx = false;   // v106: ikut ekspor JSON dan sinkron lewat `extra`

/* --- angka, detik, tanggal: pembaca yang toleran (id-ID dan en-US) --- */
function tsxParseNum(v, int) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  const m = s.match(/^([\d.,]+)(k|rb|ribu|m|jt|juta)?%?$/); if (!m) return null;
  s = m[1]; const u = m[2], mul = !u ? 1 : (u === 'k' || u === 'rb' || u === 'ribu') ? 1e3 : 1e6;
  const hasD = s.includes('.'), hasC = s.includes(',');
  if (hasD && hasC) s = s.lastIndexOf('.') > s.lastIndexOf(',') ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
  else if (hasC) s = int && !u && /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  else if (hasD && int && !u && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if ((s.match(/\./g) || []).length > 1) return null;
  const n = Number(s) * mul; return Number.isFinite(n) ? n : null;
}
function tsxParseSec(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v == null ? '' : v).trim().toLowerCase(); if (!s) return null;
  let m = s.match(/^(\d+(?:[.,]\d+)?)$/); if (m) return Number(m[1].replace(',', '.'));
  m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?(?:[.,]\d+)?$/); if (m) return m[3] != null ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : (+m[1]) * 60 + (+m[2]);
  m = s.match(/^(?:(\d+)\s*(?:m|mnt|menit|min)\s*)?(?:(\d+(?:[.,]\d+)?)\s*(?:s|dtk|detik|sec|secs|seconds)?)?$/);
  if (m && (m[1] || m[2])) return (m[1] ? +m[1] * 60 : 0) + (m[2] ? Number(m[2].replace(',', '.')) : 0);
  return null;
}
const TSX_MON = { jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3, apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, agu: 8, agt: 8, agustus: 8, aug: 8, august: 8, sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, october: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12, december: 12 };
function tsxParseDate(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase(); if (!s) return '';
  let y, mo, d, m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?!\d)/))) { y = +m[3]; const a = +m[1], b = +m[2]; if (a > 12) { d = a; mo = b; } else if (b > 12) { mo = a; d = b; } else { d = a; mo = b; } }   // ambigu (kedua <= 12): dianggap hari/bulan
  else if ((m = s.match(/^(\d{1,2})\s+([a-z]+)\.?,?\s+(\d{4})/)) && TSX_MON[m[2]]) { d = +m[1]; mo = TSX_MON[m[2]]; y = +m[3]; }
  else if ((m = s.match(/^([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/)) && TSX_MON[m[1]]) { mo = TSX_MON[m[1]]; d = +m[2]; y = +m[3]; }
  else return '';
  const out = y + '-' + pad(mo) + '-' + pad(d);
  return y >= 2020 && y <= 2100 && cnDateOk(out) ? out : '';
}
const tsxN = (v, lo, hi, int) => { const n = typeof v === 'number' ? v : (typeof v === 'string' ? tsxParseNum(v, int) : null); if (n == null || !Number.isFinite(n) || n < lo || n > hi) return null; return int ? Math.round(n) : Math.round(n * 10) / 10; };

/* --- bersihkan data (dipakai untuk data tersimpan, formulir, dan CSV) --- */
function tsxItemClean(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const id = cnId(r.id); if (!id) return null;
  const it = { id, d: typeof r.d === 'string' && cnDateOk(r.d) ? r.d : '', t: cnTxt(r.t, 80), h: cnTxt(r.h, 160), lnk: cnId(r.lnk), nt: cnTxt(r.nt, 200),
    dur: tsxN(r.dur, 0.5, 600), avg: tsxN(r.avg, 0, 600), drop: tsxN(r.drop, 0, 600), fin: tsxN(r.fin, 0, 100),
    vw: tsxN(r.vw, 0, 1e10, true), lk: tsxN(r.lk, 0, 1e10, true), cm: tsxN(r.cm, 0, 1e10, true), sh: tsxN(r.sh, 0, 1e10, true), sv: tsxN(r.sv, 0, 1e10, true), fl: tsxN(r.fl, 0, 1e10, true),
    tm: typeof r.tm === 'string' ? tsxParseTime(r.tm) : '', src: r.src === 'csv' ? 'csv' : 'manual', u: cnUpd(r.u) || 1 };
  if (!it.t && !it.d) return null;
  return it;
}
function tsxClean(raw) {
  const o = { items: [], del: [], u: 0 }; if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  const seen = new Set();
  (Array.isArray(raw.items) ? raw.items : []).slice(0, TSX_MAX).forEach(r => { const c = tsxItemClean(r); if (c && !seen.has(c.id)) { seen.add(c.id); o.items.push(c); } });
  o.del = exTClean(raw.del); o.u = cnUpd(raw.u); return o;
}
async function tsxLoad() {
  if (TSX.loading || TSX.ready) return; TSX.loading = true;
  try {
    const raw = await Promise.race([store.load(TSX_KEY), new Promise(r => setTimeout(() => r(null), 4000))]);
    { const o = tsxClean(raw); if (!(TSX.u > 0)) { TSX.items = o.items; TSX.u = o.u; } TSX.del = exTList(exTMap(TSX.del, o.del)); }   // v108a
  } catch (e) { /* data rusak: mulai kosong */ }
  TSX.loading = false; TSX.ready = true; tsxRefresh();
}
const tsxSave = () => { TSX.u = Math.max(Date.now(), TSX.u + 1); dirty.tsx = true; queueSave('tsx'); };
function tsxWipe() { TSX.items = []; TSX.u = Date.now(); TSX.ready = true; TSX.form = null; TSX.imp = null; }   // dipanggil dari "Hapus semua data"
function tsxRefresh() { if (typeof curView !== 'undefined' && curView === 'content' && (cnTab === 'stat' || cnTab === 'kal')) cnRender(); }
function tsxId() { const seen = new Set(TSX.items.map(x => x.id)); let id, n = 0; do { id = ('v' + Math.random().toString(36).slice(2, 9) + (n++).toString(36)).slice(0, 24); } while (seen.has(id)); return id; }

/* --- turunan dan analisis --- */
const tsxRet = it => it.avg != null && it.dur ? Math.min(100, it.avg / it.dur * 100) : null;   // retensi = rata-rata tonton / durasi
const tsxEng = it => { const k = ['lk', 'cm', 'sh', 'sv'].filter(x => it[x] != null); return it.vw && k.length ? k.reduce((a, x) => a + it[x], 0) / it.vw * 100 : null; };
function tsxHookType(h) {
  const s = String(h || '').toLowerCase().replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim(); if (!s) return '';   // 79b: [isian] tidak dihitung (tanda tanya di dalamnya bukan pertanyaan)
  const first = s.split(/(?<=[.!?])\s/)[0];
  if (/^(jujur|sejujurnya|aku ngaku|gue ngaku|aku harus ngaku|gue harus ngaku|ngaku|pengakuan)/.test(s)) return 'akui';
  if (/^(ternyata|bukan |salah kaprah|mitos|kebanyakan orang|orang bilang|jangan )/.test(s) || /\bbukan\b[^.!?]*\btapi\b/.test(first)) return 'kontra';
  if (/^(lagi |pas |tadi |barusan|baru aja|baru saja|detik ini|sambil )/.test(s)) return 'aksi';
  if (first.includes('?')) return 'tanya';
  if (/\d/.test(first)) return 'angka';
  return 'lain';
}
const tsxMean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const tsxMed = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const TSX_DB = [['≤ 15 detik', 0, 15], ['16–30 detik', 15.0001, 30], ['31–60 detik', 30.0001, 60], ['> 60 detik', 60.0001, 1e9]];
function tsxInsights(L) {
  const R = L.filter(x => tsxRet(x) != null), o = { n: L.length, nr: R.length, avgVw: tsxMean(L.filter(x => x.vw != null).map(x => x.vw)), avgRet: tsxMean(R.map(tsxRet)), avgWatch: tsxMean(L.filter(x => x.avg != null).map(x => x.avg)), byHook: [], byDur: [], drop: null, top: [] };
  const g = {}; R.forEach(x => { const k = tsxHookType(x.h); if (k) (g[k] = g[k] || []).push(tsxRet(x)); });
  o.byHook = Object.keys(g).map(k => ({ k, label: TSX_HT[k], n: g[k].length, ret: tsxMean(g[k]) })).sort((a, b) => b.ret - a.ret);
  o.byDur = TSX_DB.map(b => { const a = R.filter(x => x.dur >= b[1] && x.dur <= b[2]).map(tsxRet); return { label: b[0], n: a.length, ret: tsxMean(a) }; }).filter(x => x.n);
  const D = L.filter(x => x.drop != null && x.dur);
  if (D.length >= 3) { const p = tsxMed(D.map(x => x.drop / x.dur)), s = tsxMed(D.map(x => x.drop)); o.drop = { n: D.length, sec: s, seg: p < 5 / 30 ? 0 : p < 15 / 30 ? 1 : p < 25 / 30 ? 2 : 3 }; }
  else o.dropN = D.length;
  o.top = R.slice().sort((a, b) => tsxRet(b) - tsxRet(a) || (b.vw || 0) - (a.vw || 0)).slice(0, 5);
  return o;
}

/* --- CSV: pembaca, pemetaan kolom, rencana impor --- */
function tsxCsv(text) {
  const s = String(text || '').replace(/^\uFEFF/, ''), first = s.split(/\r?\n/, 1)[0] || '';
  const cnt = ch => { let q = false, n = 0; for (const c of first) { if (c === '"') q = !q; else if (!q && c === ch) n++; } return n; };
  const best = [[',', cnt(',')], [';', cnt(';')], ['\t', cnt('\t')]].sort((a, b) => b[1] - a[1])[0], D = best[1] > 0 ? best[0] : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"' && cell === '') q = true;
    else if (c === D) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim() !== '')) rows.push(row); row = []; if (rows.length > TSX_ROWS + 6) break; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some(x => x.trim() !== '')) rows.push(row); }
  return rows;
}
const tsxNorm = h => String(h || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const TSX_RULES = [   // urutan penting: yang lebih khusus lebih dulu
  ['drop', k => /titikpergi|dropoff|droppoint|penontonpergi/.test(k)],
  ['fin', k => /fullvideo|completion|finishrate|selesai|sampaiakhir|hinggaakhir|watchedfull/.test(k)],
  ['avg', k => !/total|persen|percent/.test(k) && /(avg|average|ratarata|rata)(.*)(watch|view|tonton|durasi|waktu)/.test(k)],
  ['dur', k => /^(video)?(duration|length|durasi)(video)?(detik|s|sec|seconds)?$/.test(k)],
  ['fl', k => /newfollowers|followergain|followersgained|pengikutbaru|^followers$/.test(k)],
  ['vw', k => !/profil|unique|unik|fullvideo|persen/.test(k) && /(views|tayangan|penayangan|dilihat|viewcount)/.test(k)],
  ['lk', k => /^(total)?(likes?|suka|disukai)$/.test(k)],
  ['cm', k => /^(total)?(comments?|komentar)$/.test(k)],
  ['sh', k => /^(total)?(shares?|bagikan|dibagikan)$/.test(k)],
  ['sv', k => /^(total)?(saves?|favorites?|simpan|disimpan|favorit)$/.test(k)],
  ['hk', k => k === 'hook'],
  ['tm', k => /^(jam|jamposting|jampost|jamunggah|jamupload|postinghour|posthour|publishhour|uploadhour|hour|timeofday)$/.test(k)],
  ['d', k => /postdate|tanggal|^date$|publish|createtime|waktuposting|posttime/.test(k)],
  ['t', k => /title|judul|videodescription|^description$|deskripsi|^caption$|^video$/.test(k)]];
const TSX_LAB = { t: 'Judul', d: 'Tanggal', hk: 'Hook', dur: 'Durasi', vw: 'Views', avg: 'Rata-rata tonton', fin: 'Selesai ditonton', drop: 'Titik pergi', lk: 'Like', cm: 'Komentar', sh: 'Share', sv: 'Simpan', fl: 'Pengikut baru', tm: 'Jam posting' };
function tsxMapH(head) {
  const mp = {}, used = new Set(), keys = head.map(tsxNorm);
  TSX_RULES.forEach(([f, fn]) => { const i = keys.findIndex((k, j) => k && !used.has(j) && fn(k)); if (i >= 0) { mp[f] = i; used.add(i); } });
  return mp;
}
function tsxRowItem(r, mp) {
  const g = k => mp[k] != null && mp[k] < r.length ? r[mp[k]] : '';
  return { id: '', d: tsxParseDate(g('d')), t: cnTxt(g('t'), 80), h: cnTxt(g('hk'), 160), lnk: '', nt: '', dur: tsxN(tsxParseSec(g('dur')), 0.5, 600), avg: tsxN(tsxParseSec(g('avg')), 0, 600), drop: tsxN(tsxParseSec(g('drop')), 0, 600),
    fin: tsxN(tsxParseNum(g('fin')), 0, 100), vw: tsxN(tsxParseNum(g('vw'), true), 0, 1e10, true), lk: tsxN(tsxParseNum(g('lk'), true), 0, 1e10, true), cm: tsxN(tsxParseNum(g('cm'), true), 0, 1e10, true),
    sh: tsxN(tsxParseNum(g('sh'), true), 0, 1e10, true), sv: tsxN(tsxParseNum(g('sv'), true), 0, 1e10, true), fl: tsxN(tsxParseNum(g('fl'), true), 0, 1e10, true), tm: tsxParseTime(g('tm')) || tsxParseTime(g('d'), true), src: 'csv', u: 1 };
}
const TSX_MET = ['dur', 'avg', 'drop', 'fin', 'vw', 'lk', 'cm', 'sh', 'sv', 'fl'];
const tsxKey = it => (it.d || '') + '|' + (it.t || '').toLowerCase().slice(0, 60);
function tsxPlan(text) {   // -> { ok, msg, map, head, add: [..], upd: [{id, it}], skip, over }
  const t = String(text || '');
  if (!t.trim()) return { ok: false, msg: 'Belum ada isi. Tempel CSV atau pilih berkas.' };
  if (t.length > TSX_CSV_CHARS) return { ok: false, msg: 'Berkas terlalu besar (maksimal sekitar 2 MB). Potong dulu jadi lebih sedikit baris.' };
  const rows = tsxCsv(t); let hi = -1, mp = null;
  for (let i = 0; i < Math.min(6, rows.length); i++) { const m = tsxMapH(rows[i]); if (Object.keys(m).length >= 2 && TSX_MET.some(k => m[k] != null)) { hi = i; mp = m; break; } }
  if (hi < 0) return { ok: false, msg: 'Kolom statistik tidak dikenali. Baris pertama harus berisi nama kolom, misalnya "Video title, Post date, Total views, Average watch time".' };
  const exist = new Map(); TSX.items.forEach(x => exist.set(tsxKey(x), x));
  const add = [], upd = [], seenK = new Set(); let skip = 0, over = 0;
  rows.slice(hi + 1, hi + 1 + TSX_ROWS).forEach(r => {
    const it = tsxRowItem(r, mp);
    if ((!it.t && !it.d) || !TSX_MET.some(k => it[k] != null)) { skip++; return; }
    const k = tsxKey(it); if (seenK.has(k)) { skip++; return; } seenK.add(k);
    const ex = exist.get(k);
    if (ex) upd.push({ id: ex.id, it }); else if (TSX.items.length + add.length >= TSX_MAX) over++; else add.push(it);
  });
  return { ok: true, map: mp, head: rows[hi], add, upd, skip, over, total: add.length + upd.length + skip + over };
}
function tsxApply(p) {
  const now = Date.now(); let a = 0, u = 0;
  p.upd.forEach(x => { const ex = TSX.items.find(y => y.id === x.id); if (!ex) return; TSX_MET.forEach(k => { if (x.it[k] != null) ex[k] = x.it[k]; }); if (!ex.h && x.it.h) ex.h = x.it.h; if (!ex.tm && x.it.tm) ex.tm = x.it.tm; ex.u = Math.max(now, ex.u + 1); u++; });
  p.add.forEach(it => { const c = tsxItemClean(Object.assign({}, it, { id: tsxId(), u: now })); if (c) { TSX.items.push(c); a++; } });
  if (a || u) tsxSave();
  return { a, u };
}

/* --- tampilan --- */
const tsxFmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const tsxPct = n => (Math.round(n * 10) / 10).toString().replace('.', ',') + '%';
const tsxSecT = n => (Math.round(n * 10) / 10).toString().replace('.', ',') + ' dtk';
const tsxDate = d => { if (!d) return 'tanpa tanggal'; const [y, m, dd] = d.split('-').map(Number); return dd + ' ' + BULAN[m - 1].slice(0, 3) + ' ' + y; };
function tsxBars(rows) {
  const mx = Math.max(1, ...rows.map(r => r.ret));
  return rows.map(r => '<div class="tsxbar"><span>' + esc(r.label) + '</span><span class="tr"><i style="width:' + Math.max(2, Math.round(r.ret / mx * 100)) + '%"></i></span><em>' + tsxPct(r.ret) + ' <small>(' + r.n + ' video)</small></em></div>').join('');
}
function tsxInsHTML(o) {
  if (!o.n) return '';
  if (!o.nr) return '<p class="mtxt">Belum ada video dengan durasi dan rata-rata tonton, jadi retensi belum bisa dihitung. Isi kedua kolom itu (ada di TikTok Studio > Analitik) supaya hook dan durasi bisa dibandingkan.</p>';
  let h = '<p class="mtxt">Retensi rata-rata <b>' + tsxPct(o.avgRet) + '</b> dari ' + o.nr + ' video (rata-rata tonton dibagi durasi).' + (o.nr < 5 ? ' Baru ' + o.nr + ' video: anggap ini petunjuk awal, bukan kepastian.' : '') + '</p>';
  if (o.byHook.length) { h += '<h3>Menurut jenis hook</h3>' + tsxBars(o.byHook); const b = o.byHook.filter(x => x.n >= 2)[0]; h += '<p class="mtxt">' + (b && o.byHook.length > 1 ? 'Sementara ini hook <b>' + esc(b.label) + '</b> paling lama ditonton di datamu (' + tsxPct(b.ret) + ', ' + b.n + ' video). Jenis dibaca dari kalimat hook; yang kosong tidak ikut dihitung.' : 'Perlu minimal 2 video per jenis hook sebelum ada yang bisa disebut terbaik. Jenis dibaca dari kalimat hook; yang kosong tidak ikut dihitung.') + '</p>'; }
  else h += '<p class="mtxt">Isi kolom hook di tiap video supaya retensi bisa dikaitkan ke jenis hook.</p>';
  if (o.byDur.length > 1) h += '<h3>Menurut durasi video</h3>' + tsxBars(o.byDur);
  if (o.drop) h += '<h3>Titik penonton pergi</h3><p class="mtxt">Biasanya sekitar <b>detik ' + Math.round(o.drop.sec) + '</b>, yaitu di bagian <b>' + TSX_SEG[o.drop.seg] + '</b> (dari ' + o.drop.n + ' video; bagian dihitung dari proporsi 5 / 15 / 25 detik pada skrip 30 detik).</p>';
  else if (o.dropN != null) h += '<p class="mtxt">Titik penonton pergi baru terisi di ' + o.dropN + ' video; perlu minimal 3.</p>';
  return h;
}
function tsxHTML() {
  if (!TSX.ready) { tsxLoad(); return '<section class="sec tsxx"><h2>Statistik video</h2><p class="mtxt">Memuat…</p></section>'; }
  const L = TSX.items.slice().sort((a, b) => (b.d || '').localeCompare(a.d || '') || b.u - a.u), o = tsxInsights(L), has = L.length > 0;
  const sum = '<div class="tsxsum"><div><b>' + L.length + '</b><small>video tercatat</small></div><div><b>' + (o.avgVw != null ? tsxFmt(o.avgVw) : '–') + '</b><small>rata-rata views</small></div><div><b>' + (o.avgRet != null ? tsxPct(o.avgRet) : '–') + '</b><small>retensi rata-rata</small></div><div><b>' + (o.avgWatch != null ? tsxSecT(o.avgWatch) : '–') + '</b><small>rata-rata tonton</small></div></div>';
  const btn = '<div class="aibtn tsxbtn"><button class="btn primary" data-q="tsxNew">+ Catat video</button><button class="btn" data-q="tsxImp">Impor CSV</button><button class="btn" data-q="tsxExp"' + (has ? '' : ' disabled') + '>Ekspor CSV</button></div>';
  const top = o.top.length ? '<section class="sec tsxx"><h2>Hook terbaik</h2>' + o.top.map((x, i) => '<button class="tsxrow" data-q="tsxEdit" data-id="' + x.id + '"><b>' + (i + 1) + '. ' + (x.h ? esc(x.h) : '<i>(hook belum diisi)</i>') + '</b><small>' + tsxPct(tsxRet(x)) + ' ditonton' + (x.vw != null ? ' · ' + tsxFmt(x.vw) + ' views' : '') + ' · ' + esc(x.t || tsxDate(x.d)) + '</small></button>').join('') + '<p class="mtxt">Urut dari retensi tertinggi. Hook pendek dengan sampel kecil belum tentu berulang.</p></section>' : '';
  const list = has ? L.map(x => { const r = tsxRet(x), e = tsxEng(x); return '<button class="tsxrow" data-q="tsxEdit" data-id="' + x.id + '"><b>' + esc(x.t || '(tanpa judul)') + '</b><small>' + tsxDate(x.d) + (x.tm ? ' ' + x.tm : '') + (x.vw != null ? ' · ' + tsxFmt(x.vw) + ' views' : '') + (r != null ? ' · retensi ' + tsxPct(r) : '') + (e != null ? ' · interaksi ' + tsxPct(e) : '') + (x.h ? '' : ' · hook kosong') + '</small></button>'; }).join('') : '<p class="mtxt">Belum ada video. Catat satu video setelah diposting (views dan rata-rata tonton ada di TikTok Studio), atau impor CSV dari TikTok Studio atau Google Sheets.</p>';
  return '<section class="sec tsxx"><h2>Statistik video</h2>' + sum + btn + '<p class="mtxt">Tersimpan di perangkat ini saja dan tidak ikut cadangan JSON. Untuk cadangan pakai Ekspor CSV.</p></section>' +
    (has ? '<section class="sec tsxx"><h2>Yang terlihat dari datamu</h2>' + tsxInsHTML(o) + '</section>' : '') + top + tmSecHTML(L) + '<section class="sec tsxx"><h2>Daftar video</h2>' + list + '</section>';
}
function tsxSegSoon() { requestAnimationFrame(() => { const s = document.querySelector('#v-content .cnseg'), b = s && s.querySelector('.pill[aria-pressed=true]'); if (s && b) s.scrollLeft = Math.max(0, b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2); }); }
function tsxAfter() { tsxSegSoon(); }

/* --- formulir catat/ubah video --- */
const tsxFld = (id, lbl, v, ph, mode) => '<div class="cnf"><div class="lbl">' + lbl + '</div><label class="inp"><input id="' + id + '" data-tsx="num" inputmode="' + (mode || 'decimal') + '" autocomplete="off" style="font-size:calc(16px * var(--fs))" placeholder="' + ph + '" value="' + esc(v == null ? '' : String(v).replace('.', ',')) + '"></label></div>';
function tsxFormHTML(f) {
  const cands = cnActive().filter(e => e.s !== 'ide').sort((a, b) => (b.d || '').localeCompare(a.d || '')).slice(0, 40);
  const opts = '<option value="">(tidak dikaitkan)</option>' + cands.map(e => '<option value="' + esc(e.id) + '"' + (f.lnk === e.id ? ' selected' : '') + '>' + esc(e.t) + (e.d ? ' (' + e.d + ')' : '') + '</option>').join('');
  return '<div class="tsxx">' + (cands.length ? '<div class="cnf"><div class="lbl">Dari kalender konten <small>boleh kosong</small></div><label class="inp"><select id="tsxfK" data-tsx="link" style="font-size:calc(16px * var(--fs))">' + opts + '</select></label></div>' : '') +
    '<div class="cnf"><div class="lbl">Judul</div><label class="inp"><input id="tsxfT" maxlength="80" autocomplete="off" style="font-size:calc(16px * var(--fs))" placeholder="Mis. Hari ke-12" value="' + esc(f.t) + '"></label></div>' +
    '<div class="cnf"><div class="lbl">Tanggal posting</div><label class="inp"><input type="date" id="tsxfD" style="font-size:calc(16px * var(--fs))" value="' + esc(f.d) + '"></label></div>' +
    '<div class="cnf"><div class="lbl">Jam posting <small>boleh kosong</small></div><label class="inp"><input type="time" id="tsxfTm" style="font-size:calc(16px * var(--fs))" value="' + esc(f.tm || '') + '"></label></div>' +
    '<div class="cnf"><div class="lbl">Hook <small>kalimat pembuka yang dipakai</small></div><textarea class="ta" id="tsxfH" rows="2" maxlength="160">' + esc(f.h) + '</textarea></div>' +
    '<div class="tsxg">' + tsxFld('tsxfDur', 'Durasi video <small>detik</small>', f.dur, '30') + tsxFld('tsxfVw', 'Views', f.vw, '1200', 'numeric') + tsxFld('tsxfAvg', 'Rata-rata tonton <small>detik</small>', f.avg, '14,5') + tsxFld('tsxfDrop', 'Titik pergi <small>detik</small>', f.drop, '6') + '</div>' +
    '<details class="tsxmore"' + (['fin', 'lk', 'cm', 'sh', 'sv', 'fl'].some(k => f[k] != null) || f.nt ? ' open' : '') + '><summary>Lebih detail</summary><div class="tsxg">' + tsxFld('tsxfFin', 'Selesai ditonton <small>%</small>', f.fin, '35') + tsxFld('tsxfFl', 'Pengikut baru', f.fl, '3', 'numeric') + tsxFld('tsxfLk', 'Like', f.lk, '', 'numeric') + tsxFld('tsxfCm', 'Komentar', f.cm, '', 'numeric') + tsxFld('tsxfSh', 'Share', f.sh, '', 'numeric') + tsxFld('tsxfSv', 'Simpan', f.sv, '', 'numeric') + '</div>' +
    '<div class="cnf"><div class="lbl">Catatan</div><label class="inp"><input id="tsxfN" maxlength="200" autocomplete="off" style="font-size:calc(16px * var(--fs))" value="' + esc(f.nt) + '"></label></div></details>' +
    '<p class="mtxt">Durasi dan rata-rata tonton bisa diketik 12 atau 0:12. Kosongkan yang tidak ada.</p></div>';
}
function tsxRead() {
  const g = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  return { t: cnTxt(g('tsxfT'), 80), d: cnDateOk(g('tsxfD')) ? g('tsxfD') : '', tm: tsxParseTime(g('tsxfTm')), h: cnTxt(g('tsxfH'), 160), lnk: cnId(g('tsxfK')), nt: cnTxt(g('tsxfN'), 200), raw: { dur: g('tsxfDur'), avg: g('tsxfAvg'), drop: g('tsxfDrop'), fin: g('tsxfFin'), vw: g('tsxfVw'), lk: g('tsxfLk'), cm: g('tsxfCm'), sh: g('tsxfSh'), sv: g('tsxfSv'), fl: g('tsxfFl') } };
}
function tsxOpen(id) {
  if (!TSX.ready) { tsxLoad(); toast('Data statistik sedang dimuat, coba lagi sebentar'); return; }
  const cur = id ? TSX.items.find(x => x.id === id) : null; if (id && !cur) { toast('Video tidak ditemukan'); return; }
  if (!cur && TSX.items.length >= TSX_MAX) { toast('Maksimal ' + TSX_MAX + ' video. Hapus yang lama dulu.'); return; }
  TSX.form = cur ? Object.assign({}, cur) : { id: '', d: today(), t: '', h: '', lnk: '', nt: '', dur: null, avg: null, drop: null, fin: null, vw: null, lk: null, cm: null, sh: null, sv: null, fl: null };
  const acts = [closeBtn, { label: 'Simpan', primary: true, fn: tsxSaveForm }];
  if (cur) acts.push({ label: 'Hapus', danger: true, fn: () => tsxDel(cur.id) });
  openSheet({ title: cur ? 'Ubah statistik video' : 'Catat video', extra: tsxFormHTML(TSX.form), actions: acts, onClose: () => { TSX.form = null; } });
  setTimeout(() => { const el = document.getElementById(cur ? 'tsxfVw' : 'tsxfT'); if (el) el.focus(); }, 60);
}
function tsxSaveForm() {
  const f = TSX.form; if (!f) return; const v = tsxRead(), R = v.raw;
  if (!v.t) { toast('Isi judulnya dulu'); const e = document.getElementById('tsxfT'); if (e) e.focus(); return; }
  const num = (s, lo, hi, int, sec) => { if (String(s).trim() === '') return { v: null }; const n = sec ? tsxParseSec(s) : tsxParseNum(s, int); if (n == null || n < lo || n > hi) return { bad: true }; return { v: int ? Math.round(n) : Math.round(n * 10) / 10 }; };
  const spec = [['dur', 0.5, 600, false, true, 'Durasi video'], ['avg', 0, 600, false, true, 'Rata-rata tonton'], ['drop', 0, 600, false, true, 'Titik pergi'], ['fin', 0, 100, false, false, 'Selesai ditonton (0 sampai 100)'], ['vw', 0, 1e10, true, false, 'Views'], ['lk', 0, 1e10, true, false, 'Like'], ['cm', 0, 1e10, true, false, 'Komentar'], ['sh', 0, 1e10, true, false, 'Share'], ['sv', 0, 1e10, true, false, 'Simpan'], ['fl', 0, 1e10, true, false, 'Pengikut baru']];
  const out = {};
  for (const [k, lo, hi, int, sec, lab] of spec) { const r = num(R[k], lo, hi, int, sec); if (r.bad) { toast(lab + ' tidak valid'); return; } out[k] = r.v; }
  if (out.dur != null && out.avg != null && out.avg > out.dur + 0.05) { toast('Rata-rata tonton tidak bisa lebih lama dari durasi video'); return; }
  if (out.dur != null && out.drop != null && out.drop > out.dur + 0.05) { toast('Titik pergi tidak bisa melewati durasi video'); return; }
  const cur = f.id ? TSX.items.find(x => x.id === f.id) : null, now = Date.now();
  const it = tsxItemClean(Object.assign({}, cur || {}, out, { id: cur ? cur.id : tsxId(), t: v.t, d: v.d, tm: v.tm, h: v.h, lnk: v.lnk, nt: v.nt, src: cur ? cur.src : 'manual', u: Math.max(now, (cur ? cur.u : 0) + 1) }));
  if (!it) { toast('Data tidak bisa disimpan'); return; }
  if (cur) TSX.items[TSX.items.indexOf(cur)] = it; else TSX.items.push(it);
  tsxSave(); TSX.form = null; closeSheet(); tsxRefresh(); toast('Tersimpan');
}
function tsxDel(id) {
  const i = TSX.items.findIndex(x => x.id === id); if (i < 0) return; const prev = TSX.items[i];
  TSX.items.splice(i, 1); exTAdd(TSX, id); tsxSave(); TSX.form = null; closeSheet(); tsxRefresh();
  toast('Video dihapus dari statistik', { label: 'Urungkan', fn: () => { if (!TSX.items.some(x => x.id === prev.id)) { prev.u = Math.max(Date.now(), prev.u + 1); exTDrop(TSX, prev.id); TSX.items.push(prev); tsxSave(); tsxRefresh(); } } });
}

/* --- impor CSV (lembar) dan ekspor CSV --- */
function tsxPlanHTML(p) {
  if (!p.ok) return '<p class="mtxt tsxerr">' + esc(p.msg) + '</p>';
  const cols = Object.keys(p.map).map(k => '<li><b>' + TSX_LAB[k] + '</b> ← "' + esc(String(p.head[p.map[k]]).slice(0, 40)) + '"</li>').join('');
  return '<p><b>' + p.add.length + ' baru</b>, <b>' + p.upd.length + ' diperbarui</b>' + (p.skip ? ', ' + p.skip + ' dilewati (tanpa judul/tanggal, tanpa angka, atau ganda)' : '') + (p.over ? ', ' + p.over + ' tidak muat (batas ' + TSX_MAX + ' video)' : '') + '.</p><p class="mtxt">Kolom yang terbaca:</p><ul class="tsxcols">' + cols + '</ul><p class="mtxt">Kolom lain diabaikan. Video yang judul dan tanggalnya sama dengan yang sudah ada hanya diperbarui angkanya; hook dan catatanmu tidak diubah.</p>';
}
const tsxPickHTML = () => '<label class="btn tsxlbl">Pilih berkas CSV<input type="file" class="mdfile" data-tsx="file" accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values,application/vnd.ms-excel"></label>';
function tsxImpOpen(text, plan) {
  if (!TSX.ready) { tsxLoad(); toast('Data statistik sedang dimuat, coba lagi sebentar'); return; }
  const acts = [closeBtn];
  if (plan && plan.ok && plan.add.length + plan.upd.length > 0) acts.push({ label: 'Impor ' + (plan.add.length + plan.upd.length) + ' video', primary: true, fn: () => { const r = tsxApply(plan); closeSheet(); tsxRefresh(); toast(r.a + ' video baru, ' + r.u + ' diperbarui'); } });
  acts.push({ label: plan ? 'Periksa lagi' : 'Periksa', fn: () => { const t = document.getElementById('shText').value; tsxImpOpen(t, tsxPlan(t)); } });
  openSheet({ title: 'Impor statistik (CSV)', note: 'Tempel isi CSV atau pilih berkas. Baris pertama = nama kolom. Dikenali: judul, tanggal, views, durasi, rata-rata tonton, selesai ditonton, titik pergi, like, komentar, share, simpan, pengikut baru (Indonesia atau Inggris, koma atau titik koma).', text: text || '', readonly: false, placeholder: 'Tempel CSV di sini', extra: tsxPickHTML() + (plan ? tsxPlanHTML(plan) : ''), actions: acts });
}
const tsxCell = (v, txt) => { let s = v == null ? '' : String(v); if (txt && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function tsxCsvOut(L) {
  const H = ['tanggal', 'judul', 'hook', 'jenis_hook', 'durasi_detik', 'views', 'rata_tonton_detik', 'retensi_persen', 'selesai_persen', 'titik_pergi_detik', 'like', 'komentar', 'share', 'simpan', 'pengikut_baru', 'catatan', 'jam_posting'];
  const rows = L.map(x => { const r = tsxRet(x); return [x.d, x.t, x.h, x.h ? TSX_HT[tsxHookType(x.h)] : '', x.dur, x.vw, x.avg, r != null ? Math.round(r * 10) / 10 : '', x.fin, x.drop, x.lk, x.cm, x.sh, x.sv, x.fl, x.nt, x.tm || ''].map((v, i) => tsxCell(v, i === 1 || i === 2 || i === 15)).join(','); });
  return '\uFEFF' + H.join(',') + '\r\n' + rows.join('\r\n') + (rows.length ? '\r\n' : '');
}
function tsxExport() {
  if (!TSX.items.length) { toast('Belum ada data untuk diekspor'); return; }
  const L = TSX.items.slice().sort((a, b) => (a.d || '').localeCompare(b.d || '')), name = 'statistik-tiktok-' + today() + '.csv';
  try { const url = URL.createObjectURL(new Blob([tsxCsvOut(L)], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast(name + ' diunduh'); } catch (e) { toast('Ekspor gagal'); }
}

/* --- aksi dan kabel --- */
QACT.tsxNew = () => tsxOpen('');
QACT.tsxEdit = el => tsxOpen(String(el.dataset.id || ''));
QACT.tsxImp = () => tsxImpOpen('', null);
QACT.tsxExp = () => tsxExport();
document.addEventListener('input', ev => { const el = ev.target; if (!el || !el.dataset || el.dataset.tsx !== 'num') return; const c = el.value.replace(/[^0-9.,:%a-z\s]/gi, ''); if (c !== el.value) el.value = c; });
document.addEventListener('change', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.tsx !== 'link') return;
  const e = cnDb.it[el.value]; if (!e || e.x) return;
  const set = (id, v) => { const x = document.getElementById(id); if (x && !x.value.trim() && v) x.value = v; };
  set('tsxfT', e.t); set('tsxfH', e.h);
  const dd = document.getElementById('tsxfD'); if (dd && e.d) dd.value = e.d;   // tanggal kalender menggantikan tanggal bawaan (hari ini); tetap bisa diubah
});
document.addEventListener('change', ev => {
  const el = ev.target; if (!el || !el.dataset || el.dataset.tsx !== 'file') return;
  const f = el.files && el.files[0]; el.value = ''; if (!f) return;
  if (f.size > TSX_CSV_CHARS * 2) { toast('Berkas terlalu besar (maksimal sekitar 2 MB)'); return; }
  const r = new FileReader(); r.onload = () => { const t = String(r.result || ''); tsxImpOpen(t, tsxPlan(t)); }; r.onerror = () => toast('Berkas tidak bisa dibaca'); r.readAsText(f);
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b79a: Object.freeze({ csv: tsxCsv, plan: tsxPlan, apply: tsxApply, num: tsxParseNum, sec: tsxParseSec, date: tsxParseDate, hookType: tsxHookType, insights: tsxInsights, clean: tsxClean, itemClean: tsxItemClean, mapH: tsxMapH, out: tsxCsvOut, ret: tsxRet, eng: tsxEng, wipe: tsxWipe, ready: () => TSX.ready, state: () => JSON.parse(JSON.stringify(TSX.items)), lim: Object.freeze({ MAX: TSX_MAX, ROWS: TSX_ROWS }) }) }));
/* 79a-end */
/* 79b-begin: Fase 4 (Word), TES A/B HOOK + DAFTAR HOOK TERBAIK, di dalam tab Statistik (bilah kecil: Video / Tes A/B / Hook terbaik). Satu tes = 2 sampai 3 hook untuk isi yang sama; tiap varian dikaitkan ke videonya di Statistik, app membandingkan retensi (rata-rata tonton / durasi). Menang bila selisih >= 3 poin persen; kurang dari itu = seri. Hook terbaik bisa disimpan dari varian tes, dari Statistik, atau diketik. Varian bisa diusulkan Gemini (kata sensitif tidak dikirim) atau diisi dari pustaka hook (lokal). Data `dailylog:ab:v1` (khusus perangkat ini, tidak ikut ekspor JSON). */
const AB_KEY = 'dailylog:ab:v1', AB_MAX_T = 60, AB_MAX_B = 100, AB_TIE = 3, AB_L = ['A', 'B', 'C'];
const AB = { ready: false, loading: false, tests: [], best: [], del: [], u: 0, view: 'video', form: null, busy: false };
STORES.ab = { key: AB_KEY, get: () => ({ v: 1, tests: AB.tests, best: AB.best, u: AB.u, del: AB.del }) }; dirty.ab = false;   // v106: ikut ekspor JSON dan sinkron lewat `extra`
const abHN = h => String(h || '').toLowerCase().replace(/\s+/g, ' ').trim();
const abPh = h => /\[[^\]]*\]/.test(String(h || ''));   // masih ada [isian]
const AB_BAN = /\b(mari|perjalanan|transformasi)\b/i;   // kata yang terdengar seperti AI (rancangan Word)
function abTestClean(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const id = cnId(r.id); if (!id) return null;
  const vs = (Array.isArray(r.v) ? r.v : []).slice(0, 3).map(x => ({ h: cnTxt(x && x.h, 160), vid: cnId(x && x.vid) }));
  if (vs.length < 2) return null;
  return { id, t: cnTxt(r.t, 80), c: typeof r.c === 'string' && cnDateOk(r.c) ? r.c : '', v: vs, st: r.st === 'selesai' ? 'selesai' : 'jalan', nt: cnTxt(r.nt, 200), u: cnUpd(r.u) || 1 };
}
function abBestClean(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const id = cnId(r.id), h = cnTxt(r.h, 160); if (!id || !h) return null;
  const ret = typeof r.ret === 'number' && Number.isFinite(r.ret) && r.ret >= 0 && r.ret <= 100 ? Math.round(r.ret * 10) / 10 : null;
  return { id, h, ret, src: r.src === 'ab' || r.src === 'stat' ? r.src : 'manual', nt: cnTxt(r.nt, 120), u: cnUpd(r.u) || 1 };
}
function abClean(raw) {
  const o = { tests: [], best: [], del: [], u: 0 }; if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return o;
  const s1 = new Set(), s2 = new Set(), s3 = new Set();
  (Array.isArray(raw.tests) ? raw.tests : []).slice(0, AB_MAX_T).forEach(r => { const c = abTestClean(r); if (c && !s1.has(c.id)) { s1.add(c.id); o.tests.push(c); } });
  (Array.isArray(raw.best) ? raw.best : []).slice(0, AB_MAX_B).forEach(r => { const c = abBestClean(r); if (c && !s2.has(c.id) && !s3.has(abHN(c.h))) { s2.add(c.id); s3.add(abHN(c.h)); o.best.push(c); } });
  o.del = exTClean(raw.del); o.u = cnUpd(raw.u); return o;
}
async function abLoad() {
  if (AB.loading || AB.ready) return; AB.loading = true;
  try {
    const raw = await Promise.race([store.load(AB_KEY), new Promise(r => setTimeout(() => r(null), 4000))]);
    { const o = abClean(raw); if (!(AB.u > 0)) { AB.tests = o.tests; AB.best = o.best; AB.u = o.u; } AB.del = exTList(exTMap(AB.del, o.del)); }   // v108a
  } catch (e) { /* data rusak: mulai kosong */ }
  AB.loading = false; AB.ready = true; abRefresh();
}
const abSave = () => { AB.u = Math.max(Date.now(), AB.u + 1); dirty.ab = true; queueSave('ab'); };
function abWipe() { AB.tests = []; AB.best = []; AB.u = Date.now(); AB.ready = true; AB.form = null; AB.view = 'video'; }
function abRefresh() { if (typeof curView !== 'undefined' && curView === 'content' && cnTab === 'stat') cnRender(); }
function abId(list) { const seen = new Set(list.map(x => x.id)); let id, n = 0; do { id = ('a' + Math.random().toString(36).slice(2, 9) + (n++).toString(36)).slice(0, 24); } while (seen.has(id)); return id; }

/* --- perbandingan (murni) --- */
function abVerdict(t, items) {
  const by = {}; (items || []).forEach(x => { by[x.id] = x; });
  const rows = t.v.map((x, i) => { const it = x.vid ? by[x.vid] : null; return { i, h: x.h, vid: x.vid, miss: !!x.vid && !it, ret: it ? tsxRet(it) : null, vw: it && it.vw != null ? it.vw : null, avg: it && it.avg != null ? it.avg : null, dur: it && it.dur ? it.dur : null }; });
  const R = rows.filter(r => r.ret != null).sort((a, b) => b.ret - a.ret || (b.vw || 0) - (a.vw || 0));
  const o = { rows, n: R.length, state: 'wait', top: -1, gap: null, partial: false, durWarn: false };
  if (R.length < 2) return o;
  o.gap = Math.round((R[0].ret - R[1].ret) * 10) / 10; o.top = R[0].i; o.state = o.gap >= AB_TIE ? 'win' : 'tie'; o.partial = R.length < rows.length;
  const ds = R.map(r => r.dur).filter(Boolean); o.durWarn = ds.length >= 2 && Math.max.apply(null, ds) > Math.min.apply(null, ds) * 1.5;
  return o;
}
function abSayHTML(v) {
  const L = AB_L, r = v.rows;
  if (v.state === 'wait') return v.n === 0 ? 'Belum ada varian yang punya data. Catat videonya di tab Video (durasi dan rata-rata tonton), lalu hubungkan ke varian.' : 'Baru 1 varian yang punya retensi; butuh minimal 2 untuk membandingkan.';
  const a = r.find(x => x.i === v.top), b = v.rows.filter(x => x.ret != null).sort((p, q) => q.ret - p.ret)[1];
  let s = v.state === 'win' ? '<b>Hook ' + L[v.top] + ' unggul</b>: ' + tsxPct(a.ret) + ' ditonton vs ' + tsxPct(b.ret) + ' (selisih ' + tsxPct(v.gap).replace('%', '') + ' poin).' : '<b>Seri</b>: selisih ' + tsxPct(v.gap).replace('%', '') + ' poin, kurang dari ' + AB_TIE + '. Belum bisa disebut menang; coba ulangi dengan video lain.';
  if (v.partial) s += ' Ada varian yang belum punya data.';
  if (v.durWarn) s += ' Durasi video berbeda jauh, jadi perbandingan kurang adil.';
  return s + ' Satu video per varian itu petunjuk, bukan bukti: topik dan jam posting ikut berpengaruh.';
}

/* --- daftar hook terbaik --- */
function abBestAdd(h, ret, src, nt) {   // -> 'ok' | 'dup' | 'full' | 'empty' | 'ph'
  const t = cnTxt(h, 160); if (!t) return 'empty'; if (abPh(t)) return 'ph';
  if (AB.best.some(x => abHN(x.h) === abHN(t))) return 'dup';
  if (AB.best.length >= AB_MAX_B) return 'full';
  const it = abBestClean({ id: abId(AB.best), h: t, ret: typeof ret === 'number' ? ret : null, src, nt: nt || '', u: Math.max(Date.now(), AB.u + 1) });
  if (!it) return 'empty'; AB.best.push(it); abSave(); return 'ok';
}
const AB_BEST_MSG = { ok: 'Disimpan ke Hook terbaik', dup: 'Hook ini sudah ada di daftar', full: 'Daftar penuh (' + AB_MAX_B + '). Hapus yang lama dulu.', empty: 'Hook kosong', ph: 'Hook masih berisi [isian]. Isi dulu.' };
const abBestSorted = () => AB.best.slice().sort((a, b) => (b.ret == null ? -1 : b.ret) - (a.ret == null ? -1 : a.ret) || b.u - a.u);

/* --- tampilan --- */
function abNav() {
  const n = AB.tests.length, m = AB.best.length;
  return '<div class="seg abseg" role="group" aria-label="Isi Statistik">' + [['video', 'Video'], ['ab', 'Tes A/B' + (n ? ' (' + n + ')' : '')], ['best', 'Hook terbaik' + (m ? ' (' + m + ')' : '')]].map(x => '<button class="pill" data-q="abView" data-v="' + x[0] + '" aria-pressed="' + (AB.view === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
}
function abStatHTML() {
  if (!AB.ready) abLoad();
  const nav = abNav();
  if (AB.view === 'video' || !['ab', 'best'].includes(AB.view)) return nav + tsxHTML();
  if (!AB.ready || !TSX.ready) { if (!TSX.ready) tsxLoad(); return nav + '<section class="sec tsxx"><p class="mtxt">Memuat…</p></section>'; }
  return nav + (AB.view === 'ab' ? abTestsHTML() : abBestHTML());
}
function abTestCard(t) {
  const v = abVerdict(t, TSX.items), done = t.st === 'selesai';
  const rows = v.rows.map(r => {
    const win = v.state === 'win' && v.top === r.i, meta = r.miss ? 'videonya sudah dihapus dari Statistik' : r.ret != null ? tsxPct(r.ret) + ' ditonton' + (r.avg != null ? ' · rata-rata ' + tsxSecT(r.avg) : '') + (r.vw != null ? ' · ' + tsxFmt(r.vw) + ' views' : '') : r.vid ? 'videonya belum punya durasi dan rata-rata tonton' : 'belum dikaitkan ke video';
    return '<div class="abv' + (win ? ' win' : '') + '"><div class="abtx"><b>' + AB_L[r.i] + (win ? ' · unggul' : '') + '</b> ' + esc(r.h) + '<small>' + meta + '</small></div><button class="btn sm" data-q="abSaveHook" data-id="' + t.id + '" data-i="' + r.i + '" aria-label="Simpan hook ' + AB_L[r.i] + ' ke Hook terbaik">☆ Simpan</button></div>';
  }).join('');
  return '<section class="sec tsxx abt"><h3>' + esc(t.t || '(tanpa judul)') + ' <span class="abchip">' + (done ? 'Selesai' : 'Berjalan') + '</span></h3>' + rows + '<p class="mtxt abvd">' + abSayHTML(v) + '</p>' +
    '<div class="tsxbtn"><button class="btn" data-q="abOpen" data-id="' + t.id + '">Ubah</button><button class="btn" data-q="abDone" data-id="' + t.id + '">' + (done ? 'Buka lagi' : 'Tandai selesai') + '</button></div></section>';
}
function abTestsHTML() {
  const L = AB.tests.slice().sort((a, b) => (a.st === 'selesai') - (b.st === 'selesai') || b.u - a.u);
  return '<section class="sec tsxx"><h2>Tes A/B hook</h2><p class="mtxt">Pakai isi yang sama dengan hook berbeda (2 sampai 3), catat tiap video di tab Video, lalu hubungkan. App membandingkan retensi: rata-rata tonton dibagi durasi.</p><div class="tsxbtn"><button class="btn primary" data-q="abNew">+ Tes baru</button></div>' + (L.length ? '' : '<p class="mtxt">Belum ada tes. Mulai dari hook yang sedang kamu ragukan.</p>') + '</section>' + L.map(abTestCard).join('');
}
function abBestRow(x) {
  const ty = tsxHookType(x.h);
  return '<div class="abv"><div class="abtx"><b>' + esc(x.h) + '</b><small>' + (ty ? TSX_HT[ty] : 'tanpa jenis') + (x.ret != null ? ' · ' + tsxPct(x.ret) + ' ditonton' : '') + ' · ' + ({ ab: 'dari tes A/B', stat: 'dari Statistik', manual: 'ditulis sendiri' })[x.src] + (x.nt ? ' · ' + esc(x.nt) : '') + '</small></div><div class="abbt"><button class="btn sm" data-q="abCopy" data-id="' + x.id + '">Salin</button><button class="btn sm" data-q="abBestEdit" data-id="' + x.id + '">Ubah</button></div></div>';
}
function abBestHTML() {
  const have = new Set(AB.best.map(x => abHN(x.h)));
  const sug = TSX.items.filter(x => x.h && tsxRet(x) != null && !have.has(abHN(x.h)) && !abPh(x.h)).sort((a, b) => tsxRet(b) - tsxRet(a) || (b.vw || 0) - (a.vw || 0)).slice(0, 5);
  return '<section class="sec tsxx"><h2>Hook terbaikmu</h2>' + (AB.best.length ? abBestSorted().map(abBestRow).join('') : '<p class="mtxt">Belum ada. Simpan pemenang tes A/B, hook dari Statistik, atau tulis sendiri.</p>') + '<div class="tsxbtn"><button class="btn primary" data-q="abBestNew">+ Tambah hook</button></div><p class="mtxt">Urut dari retensi tertinggi. Ini contoh yang pernah jalan di videomu, bukan jaminan; sampel kecil belum tentu berulang.</p></section>' +
    (sug.length ? '<section class="sec tsxx"><h2>Saran dari Statistik</h2>' + sug.map(x => '<div class="abv"><div class="abtx"><b>' + esc(x.h) + '</b><small>' + tsxPct(tsxRet(x)) + ' ditonton · ' + esc(x.t || tsxDate(x.d)) + '</small></div><button class="btn sm" data-q="abSugSave" data-id="' + x.id + '">☆ Simpan</button></div>').join('') + '<p class="mtxt">Hook dari videomu dengan retensi tertinggi yang belum ada di daftar.</p></section>' : '');
}

