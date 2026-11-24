/* ===== /v148a suara adegan ===== */
/* ===== MODUL: LATIHAN > KALISTENIK > SESI: tampilan baru (tahap 14, k1) ===== */
// HANYA tampilan. Data (tdb/pdb), logika hitung, dan semua tombol (data-q) tetap seperti sebelumnya.
// kzHTML() menggantikan kalHTML() di tab Sesi; exHTML() tetap dipakai untuk isi tiap gerakan (baris set, timer, nyeri, rekor)
// dan dibungkus kartu yang bisa dilipat. Bawaan: hanya gerakan berikutnya (set pertama yang belum selesai) yang terbuka; yang selesai terlipat sendiri.
// Keadaan buka/tutup hanya di memori (per hari). Buka/tutup mengubah DOM langsung (tanpa render ulang) supaya isian dan gulir tidak terganggu.
let kzCfg = false, kzOpen = {}, kzPop = '', kzRingPrev = 0, kzRingNext = 0, kzDay = '';
const kzRingC = 2 * Math.PI * 41;
const kzChk = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const kzChev = '<svg class="kzch" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const kzExDone = e => { const s = exState(e.id, e); return s.length > 0 && s.every(x => x.d); };
function kzExHTML(e, idx, isNext) {
  const st = exState(e.id, e), n = st.length, nd = st.filter(x => x.d).length, done = n > 0 && nd === n;
  const open = kzOpen[e.id] !== undefined ? kzOpen[e.id] : !!isNext;   // bawaan: hanya gerakan berikutnya yang terbuka
  const ph = e.sec ? rng(e.sec) + ' dtk' : e.r ? rng(e.r) + ' reps' : '';
  const sum = e.sets + ' set' + (ph ? ' × ' + ph : '') + (e.per ? ' per ' + e.per : '');
  return '<div class="kzx' + (done ? ' done' : '') + (isNext ? ' now' : '') + (open ? ' open' : '') + '" data-ex="' + e.id + '">' +
    '<button class="kzxh" data-q="kzEx" data-id="' + e.id + '" aria-expanded="' + open + '" aria-controls="kzb_' + e.id + '">' +
    '<span class="kzbd" aria-hidden="true">' + (done ? kzChk : idx + 1) + '</span>' +
    '<span class="kzxt"><b>' + esc(e.n) + '</b><small>' + esc(sum) + (done ? ' · selesai' : '') + '</small></span>' +
    '<span class="kzxs" aria-label="' + nd + ' dari ' + n + ' set selesai">' + nd + '/' + n + '</span>' + kzChev + '</button>' +
    '<div class="kzxb" id="kzb_' + e.id + '"><div class="kzxi">' + kzFormBtn(e) + exHTML(e) + '</div></div></div>';
}
function kzHeroHTML(sc, pr, k, prog) {
  const act = b19Active(), sp = act ? B18_SPLITS.find(s => s.id === act) : null;
  let title = pdb.opt === 'gym' ? 'Program gym' : 'Kalistenik';
  if (sp) { const di = b19Day(act); title = sp.n + (sp.days.length > 1 && sp.days[di] ? ' · ' + b19Short(sp.days[di]) : ''); }
  const planned = sc.s.kal ? 'Kalistenik terjadwal hari ini.' : 'Hari ini bukan jadwal kalistenik di Fase ' + sc.ph.id + '. Kamu tetap bisa latihan.';
  const pct = pr.tot ? pr.done / pr.tot : 0, full = pr.tot > 0 && pr.done === pr.tot, off = v => (kzRingC * (1 - v)).toFixed(2);
  kzRingNext = pct;
  const tags = '<span class="kzg">' + (prog === 3 ? 'Fase 3–4' : 'Fase ' + prog) + '</span><span class="kzg">' + (pdb.opt === 'gym' ? 'Di gym' : 'Di rumah') + '</span>' +
    (k && k.dl ? '<span class="kzg">Deload</span>' : '') + (k && k.done ? '<span class="kzg ok">Selesai</span>' : '');
  return '<section class="kzh" aria-label="Ringkasan sesi hari ini"><div class="kzh-m"><div class="kzh-t"><h2 class="kzt">' + esc(title) + '</h2><p>' + esc(planned) + '</p><div class="kzgs">' + tags + '</div></div>' +
    '<div class="kzring' + (full ? ' full' : '') + '" role="img" aria-label="' + pr.done + ' dari ' + pr.tot + ' set selesai"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="kzrt" cx="48" cy="48" r="41"/>' +
    '<circle class="kzrp" id="kzRing" cx="48" cy="48" r="41" style="stroke-dasharray:' + kzRingC.toFixed(2) + ';stroke-dashoffset:' + off(kzRingPrev) + '" data-to="' + off(pct) + '"/></svg>' +
    '<span class="kzrc"><b>' + pr.done + '</b><small>dari ' + pr.tot + ' set</small></span></div></div>' +
    '<button class="kzset" data-q="kzCfg" aria-expanded="' + kzCfg + '" aria-controls="kzcfg"><span>Atur sesi</span>' + kzChev + '</button></section>';
}
function kzCfgHTML() {
  const prog = curProg();
  const chip = (act, v, label, on) => '<button class="pill" data-q="' + act + '" data-v="' + v + '" aria-pressed="' + on + '">' + label + '</button>';
  return '<div class="f"><div class="lbl">Program</div><div class="seg">' + chip('prog', 1, 'Fase 1', prog === 1) + chip('prog', 2, 'Fase 2', prog === 2) + chip('prog', 3, 'Fase 3–4', prog === 3) + '</div>' +
    '<div class="sublbl">Tempat latihan</div><div class="seg">' + chip('opt', 'home', 'Di rumah', pdb.opt !== 'gym') + chip('opt', 'gym', 'Di gym', pdb.opt === 'gym') + '</div>' +
    '<div class="hint"><button class="link" data-q="tmAuto">Timer istirahat otomatis: ' + (pdb.auto === false ? 'mati' : 'nyala') + '</button>' + b16DlLink() + '</div></div>' + b19Ctl();
}
function kzHTML() {
  const t = today(), sc = schedFor(t), k = kalGet(false), pr = kalProgress(), prog = curProg(), L = exList();
  if (kzDay !== t) { kzDay = t; kzOpen = {}; }
  const nx = k && k.done ? null : L.find(e => !kzExDone(e));
  return kzHeroHTML(sc, pr, k, prog) +
    '<div class="kzcw' + (kzCfg ? ' open' : '') + '"><div class="kzxb" id="kzcfg"><div class="kzxi"><div class="kzcfg">' + kzCfgHTML() + '</div></div></div></div>' +
    b16GdCard('wu') +
    '<section class="sec"><h2>Sesi hari ini</h2>' + b16DlNote() + L.map((e, i) => kzExHTML(e, i, !!nx && nx.id === e.id)).join('') + '</section>' +
    b16GdCard('cd') +
    '<section class="sec"><h2>Selesaikan</h2>' + finishHTML(k, pr) + '</section>' +
    '<section class="sec kzsc" aria-label="Kemajuan latihan">' + kzSecHTML('lad', 'Tangga progresi', kzLadSum(), kzLadHTML()) +
    kzSecHTML('his', 'Sesi terakhir', kzHisSum(), '<div class="kzlist">' + kalHistHTML() + '</div>') + '</section>';
}
function kzAfter() {   // sesudah renderTrain: cincin bergerak dari nilai sebelumnya, centang yang baru diketuk berputar sekali
  const el = document.getElementById('kzRing');
  if (el) {
    const to = el.dataset.to;
    if (document.hidden) el.style.strokeDashoffset = to;
    else requestAnimationFrame(() => requestAnimationFrame(() => { el.style.strokeDashoffset = to; }));
    kzRingPrev = kzRingNext;
  }
  if (kzPop) {
    const p = kzPop.split('|'), b = $('.setok[data-id="' + p[0] + '"][data-i="' + p[1] + '"]');
    if (b) b.classList.add('pop');
    kzPop = '';
  }
}
QACT.kzCfg = el => {
  const w = el.closest('.kzh') && el.closest('.kzh').nextElementSibling, open = el.getAttribute('aria-expanded') !== 'true';
  kzCfg = open; el.setAttribute('aria-expanded', open);
  if (w) w.classList.toggle('open', open);
};
QACT.kzEx = el => {
  const card = el.closest('.kzx'); if (!card) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  kzOpen[el.dataset.id] = open; el.setAttribute('aria-expanded', open); card.classList.toggle('open', open);
};
const kzSetok = QACT.setok;
QACT.setok = el => {   // sama dengan aksi lama; tambahan: centang berputar, getar 8 md, fokus kembali (pengguna keyboard)
  const id = el.dataset.id, i = +el.dataset.i, e = exList().find(x => x.id === id), nd = !!e && !exState(id, e)[i].d;
  kzPop = nd ? id + '|' + i : '';
  kzSetok(el);
  kzPop = '';
  if (nd && navigator.vibrate) { try { navigator.vibrate(8); } catch (x) { /* abaikan */ } }
  let b = $('.setok[data-id="' + id + '"][data-i="' + i + '"]');
  if (!b || getComputedStyle(b).visibility === 'hidden') b = $('.kzxh[data-id="' + id + '"]');   // gerakan baru selesai = terlipat: fokus ke judulnya
  if (b) b.focus({ preventScroll: true });
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b24k1: Object.freeze({
  cfg: () => kzCfg, open: () => Object.assign({}, kzOpen), ring: () => ({ prev: kzRingPrev, next: kzRingNext })
}) }));

/* ===== MODUL: LATIHAN > KALISTENIK > SESI: contoh gerakan + Tangga progresi satu kartu (tahap 14, k1b) ===== */
// HANYA tampilan dan teks petunjuk. Data (tdb/pdb), logika hitung, dan semua tombol lama (data-q) tetap. Tidak ada kunci penyimpanan baru.
// (1) Tiap kartu gerakan di tab Sesi punya tombol "Contoh gerakan yang benar" -> sheet berisi target set, cara satu set yang benar, langkah gerakan, kesalahan umum,
//     gambar (hanya bila pustaka punya dan hanya saat diketuk) dan tautan video. Isi ditulis dari pengetahuan umum kebugaran dan BELUM ditinjau pelatih.
// (2) Tangga progresi: empat kartu Push/Pull/Legs/Core digabung menjadi satu kartu (kzLadHTML); ladderHTML() lama tetap ada dan tidak dipakai di tab Sesi.
const KZ_FORM = {
  pushup: { n: 'Push-up', s: ['Tangan sedikit lebih lebar dari bahu, jari terbuka, badan lurus dari kepala sampai tumit.', 'Kencangkan perut dan bokong, lalu turun pelan sampai dada hampir menyentuh lantai. Siku sekitar 45° dari badan.', 'Dorong lantai menjauh sampai lengan lurus.'], e: ['Pinggang turun atau bokong naik (badan tidak lurus).', 'Siku melebar 90° ke samping sehingga bahu tertekan.', 'Turun hanya setengah. Bila belum kuat, pakai knee push-up daripada memendekkan gerak.'] },
  diamond_pushup: { n: 'Diamond push-up', s: ['Posisi push-up dengan kedua tangan di bawah dada; ibu jari dan telunjuk membentuk segitiga atau berlian.', 'Badan lurus, siku dekat badan (sekitar 30–45°), lalu turun pelan sampai dada hampir menyentuh tangan.', 'Dorong naik sampai lengan lurus. Bila pergelangan atau siku tidak nyaman, lebarkan sedikit tangan atau kembali ke push-up biasa.'], e: ['Siku melebar sehingga trisep tidak bekerja.', 'Pinggang turun atau bokong naik.', 'Memaksa dengan pergelangan atau siku nyeri.'] },
  knee_pushup: { n: 'Knee push-up', s: ['Posisi push-up dengan lutut di lantai (beri alas lunak), tangan sedikit lebih lebar dari bahu.', 'Badan lurus dari lutut sampai kepala; kencangkan perut dan bokong.', 'Turun pelan sampai dada hampir menyentuh lantai, lalu dorong naik.'], e: ['Bokong menonjol ke belakang (badan menekuk di pinggul).', 'Kepala jatuh atau leher menengadah; pandangan ke lantai sedikit di depan tangan.'] },
  decline_pushup: { n: 'Decline push-up', s: ['Letakkan kaki di bangku atau kursi kokoh, tangan di lantai selebar bahu.', 'Badan lurus seperti papan; kencangkan perut dan bokong.', 'Turun terkendali sampai dada hampir menyentuh lantai, lalu dorong naik.'], e: ['Pinggang melengkung ke bawah (kaki terlalu tinggi atau perut lemas).', 'Kepala maju sendiri; jaga leher sejajar badan.'] },
  dips: { n: 'Dips (bar paralel)', s: ['Tumpu badan di dua bar paralel (atau ring/kursi yang kokoh), lengan lurus, bahu turun menjauh dari telinga.', 'Condongkan badan sedikit ke depan, tekuk siku dan turun sampai bahu sekitar sejajar siku, atau sejauh nyaman.', 'Dorong naik sampai lengan hampir lurus.'], e: ['Bahu naik ke telinga atau jatuh ke depan di dasar gerakan.', 'Turun terlalu dalam sampai bahu depan nyeri. Berhenti di kedalaman yang nyaman.'] },
  pike_pushup: { n: 'Pike push-up', s: ['Mulai dari posisi V terbalik: tangan selebar bahu, pinggul tinggi, kaki hampir lurus.', 'Tekuk siku dan turunkan kepala ke depan, di antara kedua tangan.', 'Dorong naik lewat bahu sampai lengan lurus kembali.'], e: ['Pinggul turun sehingga menjadi push-up biasa.', 'Siku melebar; jaga sekitar 45° dari badan.'] },
  archer_pushup: { n: 'Archer push-up', s: ['Tangan lebar (sekitar 1,5 kali lebar bahu), badan lurus seperti push-up.', 'Geser badan ke satu tangan sambil menekuk siku sisi itu; lengan sisi lain tetap lurus.', 'Dorong naik, kembali ke tengah, lalu ganti sisi.'], e: ['Pinggul memutar atau bergoyang.', 'Lengan yang seharusnya lurus ikut menekuk.'] },
  doorway_pull: { n: 'Doorway pull', s: ['Berdiri menghadap kusen pintu yang kokoh; pegang kedua sisi kusen dengan kedua tangan.', 'Condongkan badan ke belakang dengan lengan lurus, badan lurus dari kepala sampai tumit.', 'Tarik dada ke kusen sambil menjepit tulang belikat, lalu kembali pelan.'], e: ['Memakai kusen yang goyah atau licin. Periksa kekuatannya dulu.', 'Pinggul menekuk ke belakang; jaga badan lurus.'] },
  scapular_pull: { n: 'Scapular pull-up', s: ['Gantung di bar dengan lengan lurus, pegangan selebar bahu.', 'Tanpa menekuk siku, tarik bahu turun dan sedikit ke belakang sehingga badan naik beberapa sentimeter.', 'Lepaskan pelan sampai bahu naik lagi.'], e: ['Siku menekuk (jadi pull-up kecil).', 'Badan berayun.'] },
  inverted_row: { n: 'Inverted row', s: ['Berbaring di bawah meja kokoh, bar, atau TRX; pegang dengan tangan selebar bahu dan lengan lurus.', 'Badan lurus dari kepala sampai tumit (kaki di bangku bila ingin lebih berat); perut dan bokong kencang.', 'Tarik dada ke bar sambil menjepit tulang belikat, tahan sebentar, lalu turun pelan sampai lengan lurus.'], e: ['Pinggul turun (badan melengkung).', 'Hanya menekuk siku tanpa menarik bahu ke belakang.', 'Meja yang tidak stabil atau bisa bergeser.'] },
  assisted_pullup: { n: 'Assisted pull-up', s: ['Pegang bar sedikit lebih lebar dari bahu; ringankan dengan karet bantu atau pijakan kaki di kursi.', 'Mulai dari gantung dengan bahu aktif (tidak menyatu ke telinga).', 'Tarik siku ke bawah dan belakang sampai dagu melewati bar, lalu turun sekitar 3 detik sampai lengan lurus.'], e: ['Bantuan terlalu besar atau mengandalkan dorongan kaki.', 'Turun cepat. Fase turun yang pelan justru yang paling melatih.'] },
  pullup: { n: 'Pull-up', s: ['Pegang bar sedikit lebih lebar dari bahu; gantung dengan lengan lurus dan bahu aktif.', 'Kencangkan perut dan bokong, tarik siku ke bawah dan belakang sampai dagu melewati bar.', 'Turun terkendali sampai lengan lurus penuh sebelum reps berikutnya.'], e: ['Berayun atau menendang sehingga otot tidak bekerja penuh.', 'Gerak setengah: tidak turun sampai lengan lurus.', 'Dagu menjulur ke depan untuk mencapai bar.'] },
  chinup: { n: 'Chin-up', s: ['Pegang bar dengan telapak menghadap kamu, selebar bahu; gantung dengan lengan lurus.', 'Tarik siku ke bawah dan depan badan sampai dagu melewati bar.', 'Turun pelan sampai lengan lurus.'], e: ['Berayun atau menendang.', 'Bahu naik ke telinga di bagian bawah; tetap aktif.'] },
  lsit_pullup: { n: 'L-sit pull-up', s: ['Gantung di bar, angkat kedua kaki lurus ke depan sampai sekitar sejajar pinggul (posisi L).', 'Pertahankan kaki lurus dan perut kencang, tarik siku ke bawah sampai dagu melewati bar.', 'Turun terkendali tanpa menurunkan kaki.'], e: ['Lutut menekuk atau kaki turun di tengah gerakan.', 'Punggung bawah melengkung berlebihan.'] },
  bw_squat: { n: 'Bodyweight squat', s: ['Kaki selebar bahu, ujung kaki sedikit keluar, dada tegak, pandangan ke depan.', 'Dorong pinggul ke belakang dan tekuk lutut; turun sampai paha sejajar lantai atau sejauh nyaman. Lutut searah ujung kaki, tumit tetap menempel.', 'Dorong lantai dengan seluruh telapak kaki sampai berdiri tegak.'], e: ['Lutut masuk ke dalam.', 'Tumit terangkat atau punggung membungkuk.', 'Turun terlalu cepat tanpa kendali.'] },
  glute_bridge: { n: 'Glute bridge', s: ['Telentang, lutut ditekuk, telapak kaki rata di lantai dengan tumit dekat bokong, lengan di samping badan.', 'Dorong lewat tumit dan angkat pinggul sampai badan lurus dari bahu ke lutut.', 'Jepit bokong 1 detik di atas, lalu turun pelan.'], e: ['Punggung bawah melengkung berlebihan di atas. Dorong dengan bokong, bukan pinggang.', 'Menumpu ujung kaki; tumit tetap menekan lantai.'] },
  reverse_lunge: { n: 'Reverse lunge', s: ['Berdiri tegak, tangan di pinggang atau di samping.', 'Langkahkan satu kaki ke belakang dan turun sampai lutut belakang mendekati lantai; lutut depan di atas pergelangan kaki.', 'Dorong lewat tumit kaki depan untuk kembali berdiri, lalu ganti kaki.'], e: ['Lutut depan terlalu maju atau masuk ke dalam.', 'Badan condong terlalu jauh ke depan.'] },
  bulgarian: { n: 'Bulgarian split squat', s: ['Berdiri membelakangi bangku, letakkan punggung kaki belakang di bangku; kaki depan satu langkah besar ke depan.', 'Badan sedikit condong ke depan, turun dengan menekuk lutut depan sampai paha depan hampir sejajar lantai.', 'Dorong lewat tumit kaki depan sampai berdiri. Selesaikan semua reps satu sisi, lalu ganti.'], e: ['Kaki depan terlalu dekat bangku sehingga lutut terdorong jauh ke depan.', 'Lutut depan masuk ke dalam.', 'Berat bertumpu pada kaki belakang.'] },
  calf_raise: { n: 'Calf raise', s: ['Berdiri dengan kaki selebar pinggul (di tepi anak tangga bila ingin gerak lebih penuh), berpegangan bila perlu.', 'Naik setinggi mungkin ke ujung jari kaki, tahan 1 detik.', 'Turun pelan sampai tumit sedikit di bawah atau sejajar tepi.'], e: ['Gerak terlalu pendek atau memantul.', 'Pergelangan kaki goyang ke luar atau ke dalam.'] },
  sl_rdl: { n: 'Single-leg Romanian deadlift', s: ['Berdiri satu kaki dengan lutut sedikit menekuk (tidak dikunci), tangan di depan atau memegang beban.', 'Dorong pinggul ke belakang sambil condongkan badan; kaki lain naik lurus ke belakang sebagai penyeimbang. Punggung tetap lurus.', 'Turun sampai terasa tarikan di paha belakang (badan sekitar sejajar lantai), lalu kembali tegak lewat bokong.'], e: ['Punggung membulat atau pinggul terbuka ke samping.', 'Lutut menekuk terlalu banyak sehingga menjadi squat.'] },
  sl_hipthrust: { n: 'Single-leg hip thrust', s: ['Punggung atas bersandar di bangku, satu kaki menapak di lantai, kaki lain diangkat.', 'Dorong lewat tumit kaki tumpu sampai badan lurus dari bahu ke lutut.', 'Jepit bokong 1 detik di atas, turun pelan, ulangi; lalu ganti kaki.'], e: ['Pinggang melengkung berlebihan di atas.', 'Pinggul miring ke satu sisi.'] },
  pistol: { n: 'Pistol squat', s: ['Berdiri satu kaki, kaki lain terangkat lurus ke depan; lengan lurus ke depan sebagai penyeimbang (atau pegang tiang).', 'Dorong pinggul ke belakang dan turun terkendali sampai paha sejajar lantai atau serendah yang bisa dikuasai. Tumit tetap menempel.', 'Dorong lantai sampai berdiri. Boleh duduk ke bangku atau berpegangan dulu bila belum kuat.'], e: ['Tumit terangkat atau lutut masuk ke dalam.', 'Jatuh di dasar gerakan. Kurangi kedalaman dulu.'] },
  shrimp: { n: 'Shrimp squat', s: ['Berdiri satu kaki, tekuk lutut kaki lain ke belakang dan pegang pergelangan atau punggung kakinya.', 'Turun dengan menekuk lutut kaki tumpu sampai lutut belakang menyentuh lantai dengan lembut.', 'Dorong lewat tumit kaki tumpu sampai berdiri; ganti kaki.'], e: ['Lutut belakang menghantam lantai.', 'Badan terlalu condong sehingga tumit terangkat.'] },
  plank: { n: 'Plank', s: ['Siku tepat di bawah bahu, lengan bawah di lantai, ujung kaki menapak.', 'Badan lurus dari kepala sampai tumit; kencangkan perut, bokong, dan paha. Pandangan ke lantai.', 'Tahan sambil bernapas teratur; berhenti saat pinggang mulai turun.'], e: ['Pinggang turun atau bokong naik.', 'Menahan napas.', 'Bahu naik ke telinga. Dorong lantai menjauh.'] },
  dead_bug: { n: 'Dead bug', s: ['Telentang, lengan lurus ke atas, pinggul dan lutut ditekuk 90° (paha tegak lurus).', 'Tekan punggung bawah ke lantai dan pertahankan.', 'Turunkan satu lengan ke belakang kepala dan kaki sisi lain lurus ke depan sampai hampir menyentuh lantai, kembali, lalu ganti sisi.'], e: ['Punggung bawah terangkat dari lantai.', 'Bergerak terlalu cepat.'] },
  leg_raise: { n: 'Leg raise', s: ['Telentang (kedua tangan di bawah pinggul) atau tergantung di bar; kaki lurus dan rapat.', 'Kencangkan perut, angkat kaki sampai sekitar 90° (atau setinggi yang bisa dikendalikan).', 'Turunkan pelan; punggung bawah tetap menempel di lantai, atau badan tidak berayun di bar.'], e: ['Punggung bawah melengkung saat kaki turun.', 'Berayun memakai momentum.'] },
  side_plank: { n: 'Side plank', s: ['Berbaring miring; satu siku tepat di bawah bahu, kaki ditumpuk atau satu di depan lainnya.', 'Angkat pinggul sampai badan lurus dari kepala sampai kaki.', 'Tahan sambil bernapas, lalu ganti sisi.'], e: ['Pinggul turun atau memutar ke depan atau belakang.', 'Siku tidak berada di bawah bahu.'] },
  bird_dog: { n: 'Bird dog', s: ['Merangkak: tangan di bawah bahu, lutut di bawah pinggul, punggung netral.', 'Luruskan satu lengan ke depan dan kaki sisi lawan ke belakang tanpa memutar pinggul.', 'Tahan 1 sampai 2 detik, kembali pelan, lalu ganti sisi.'], e: ['Punggung bawah melengkung atau pinggul terbuka.', 'Mengangkat kaki lebih tinggi dari sejajar badan.'] },
  copenhagen: { n: 'Copenhagen plank', s: ['Posisi plank samping; letakkan bagian dalam kaki atas (lutut atau pergelangan) di bangku, kaki bawah menggantung di bawahnya.', 'Siku bawah di bawah bahu; angkat pinggul sampai badan lurus.', 'Tahan; paha dalam kaki atas bekerja. Ganti sisi.'], e: ['Pinggul turun atau memutar.', 'Memaksa menahan sampai bentuk rusak. Mulai dengan lutut di bangku bila terlalu berat.'] },
  hollow: { n: 'Hollow body hold', s: ['Telentang, lengan lurus di atas kepala, kaki lurus rapat.', 'Tekan punggung bawah ke lantai, angkat bahu dan kaki sedikit dari lantai sehingga badan melengkung seperti pisang.', 'Tahan sambil bernapas. Bila punggung bawah terangkat, tekuk lutut atau turunkan lengan dulu.'], e: ['Punggung bawah terangkat dari lantai.', 'Menahan napas atau leher menekuk berlebihan.'] },
  dragon_flag: { n: 'Dragon flag', s: ['Telentang di bangku, pegang tepi bangku di belakang kepala; tumpuan ada di bahu.', 'Angkat badan lurus kaku dari bahu sampai kaki (mulai dengan pinggul ditekuk, lalu diluruskan).', 'Turunkan badan lurus dengan sangat pelan sampai hampir menyentuh bangku, lalu naik lagi. Kuasai hollow body dan leg raise dulu.'], e: ['Badan menekuk di pinggul.', 'Turun terlalu cepat atau menumpu leher. Tumpuan harus di bahu.'] },
  db_press: { n: 'Dumbbell chest press', s: ['Berbaring di bangku, kaki menapak di lantai, dumbbell di sisi dada, telapak menghadap ke depan.', 'Dorong dumbbell ke atas sampai lengan hampir lurus di atas dada.', 'Turunkan pelan sampai siku sekitar 45–60° dari badan dan dumbbell sejajar dada.'], e: ['Siku melebar 90° sehingga bahu tertekan.', 'Bokong terangkat dari bangku atau punggung melengkung berlebihan.', 'Beban terlalu berat sehingga gerak tidak terkendali.'] },
  smith_press: { n: 'Smith machine press', s: ['Atur bangku sehingga bar berada di atas dada tengah; berbaring, kaki menapak, tulang belikat dijepit.', 'Lepas kunci bar, turunkan pelan ke dada bagian tengah.', 'Dorong naik sampai lengan hampir lurus. Kunci bar kembali setelah selesai.'], e: ['Bangku terlalu maju atau mundur sehingga bar jatuh ke leher atau perut.', 'Lupa mengunci bar saat selesai.'] },
  lat_pulldown: { n: 'Lat pulldown', s: ['Duduk, paha di bawah bantalan, pegang bar sedikit lebih lebar dari bahu; badan sedikit condong ke belakang.', 'Tarik bar ke dada atas dengan menarik siku ke bawah dan belakang, dada membusung.', 'Kembali pelan sampai lengan lurus.'], e: ['Badan mengayun ke belakang untuk menarik beban.', 'Menarik bar ke belakang leher.', 'Bahu naik ke telinga.'] },
  seated_row: { n: 'Seated cable row', s: ['Duduk, kaki di pijakan, lutut sedikit menekuk, pegang handle; punggung lurus.', 'Tarik handle ke perut bagian bawah sambil menjepit tulang belikat.', 'Kembali pelan sampai lengan lurus tanpa membungkuk.'], e: ['Badan bergoyang maju-mundur.', 'Membungkuk saat kembali.'] },
  goblet: { n: 'Goblet squat', s: ['Pegang satu dumbbell tegak di depan dada dengan kedua tangan, siku di bawah; kaki selebar bahu.', 'Dada tegak, dorong pinggul ke belakang dan turun sampai paha sejajar lantai atau sejauh nyaman; siku boleh masuk di antara lutut.', 'Dorong lantai sampai berdiri tegak.'], e: ['Dada jatuh ke depan atau punggung membulat.', 'Tumit terangkat atau lutut masuk ke dalam.'] },
  rdl: { n: 'Romanian deadlift', s: ['Berdiri, kaki selebar pinggul, pegang beban di depan paha, lutut sedikit menekuk.', 'Dorong pinggul ke belakang sambil menurunkan beban dekat tungkai; punggung tetap lurus, pandangan ke lantai sedikit di depan.', 'Turun sampai terasa tarikan di paha belakang (biasanya sekitar bawah lutut), lalu dorong pinggul ke depan sampai berdiri.'], e: ['Punggung membulat.', 'Beban menjauh dari tungkai.', 'Lutut menekuk terlalu banyak sehingga menjadi squat.'] },
  hang_leg_raise: { n: 'Hanging leg raise', s: ['Gantung di bar dengan pegangan kokoh dan bahu aktif; kaki lurus, atau lutut ditekuk bila belum kuat.', 'Kencangkan perut dan angkat kaki sampai sekitar sejajar pinggul atau lebih tinggi.', 'Turunkan pelan tanpa berayun.'], e: ['Berayun memakai momentum.', 'Hanya paha yang mengangkat, perut tidak ikut bekerja.'] },
  woodchop: { n: 'Cable woodchopper', s: ['Berdiri menyamping ke mesin kabel, pegang handle dengan kedua tangan, kaki selebar bahu.', 'Tarik handle diagonal dari atas samping ke bawah sisi lain; putar lewat badan (perut dan samping perut), lengan relatif lurus.', 'Kembali pelan. Selesaikan semua reps satu sisi, lalu ganti.'], e: ['Memutar hanya dengan lengan atau punggung bawah.', 'Beban terlalu berat sehingga badan ikut terseret.'] },
  inc_db_press: { n: 'Incline dumbbell press', s: ['Atur bangku miring sekitar 30° (jangan lebih dari 45°), dumbbell di sisi dada atas.', 'Dorong ke atas sampai lengan hampir lurus di atas dada atas.', 'Turunkan pelan dengan siku sekitar 45–60° dari badan.'], e: ['Bangku terlalu curam sehingga bahu yang bekerja.', 'Siku terlalu melebar.'] },
  wt_pullup: { n: 'Weighted pull-up', s: ['Tambah beban (sabuk beban atau dumbbell di antara kaki) hanya bila pull-up tanpa beban sudah kuat dan bersih.', 'Gantung penuh, lalu tarik siku ke bawah dan belakang sampai dagu melewati bar.', 'Turun terkendali sampai lengan lurus penuh.'], e: ['Berayun karena beban terlalu berat.', 'Gerak setengah.'] },
  bb_squat: { n: 'Barbell back squat', s: ['Atur rak setinggi bahu; bar di punggung atas (bukan di leher), siku ke bawah dan belakang.', 'Mundur, kaki selebar bahu, dorong pinggul ke belakang dan turun sampai paha sejajar lantai atau sejauh nyaman; dada tegak, lutut searah ujung kaki.', 'Dorong lantai sampai berdiri. Pasang pengaman rak, dan pakai spotter untuk beban berat.'], e: ['Punggung membulat di dasar gerakan.', 'Lutut masuk ke dalam atau tumit terangkat.', 'Beban terlalu berat tanpa pengaman.'] },
  hack_squat: { n: 'Hack squat', s: ['Letakkan punggung dan bahu rata pada sandaran, kaki di pijakan selebar bahu, ujung kaki sedikit keluar.', 'Lepas pengunci, turun terkendali sampai paha sejajar atau sedikit di bawahnya, tumit tetap menempel.', 'Dorong lewat seluruh telapak kaki sampai hampir lurus, tanpa mengunci lutut dengan keras.'], e: ['Pinggul terangkat dari sandaran di dasar gerakan.', 'Mengunci lutut dengan keras di atas.', 'Lutut masuk ke dalam.'] },
  pallof: { n: 'Pallof press', s: ['Berdiri menyamping ke kabel atau karet setinggi dada, pegang handle di depan dada, kaki selebar bahu, lutut sedikit menekuk.', 'Luruskan lengan ke depan sambil menahan badan agar tidak berputar mengikuti tarikan.', 'Tahan 1 sampai 2 detik, kembali ke dada dengan pelan. Selesaikan satu sisi, lalu ganti.'], e: ['Badan berputar mengikuti beban.', 'Menahan napas atau bahu terangkat.'] }
};
// id gerakan sesi -> id contoh. Gerakan susunan Jenis latihan (id "s_<id pustaka>") otomatis memakai id pustaka yang sama.
const KZ_MAP = {
  h1_push: ['pushup', 'knee_pushup'], h1_row: ['inverted_row'], h1_squat: ['bw_squat'], h1_bridge: ['glute_bridge'], h1_plank: ['plank'],
  h2_dec: ['decline_pushup', 'dips'], h2_row: ['inverted_row'], h2_bss: ['bulgarian'], h2_pike: ['pike_pushup'], h2_cop: ['copenhagen'],
  a_pull: ['pullup'], a_push: ['archer_pushup', 'dips'], a_pistol: ['pistol'], a_hip: ['sl_hipthrust'], a_dragon: ['dragon_flag'],
  g1_press: ['db_press', 'smith_press'], g1_pull: ['lat_pulldown', 'seated_row'], g1_goblet: ['goblet'], g1_rdl: ['rdl'], g1_leg: ['hang_leg_raise', 'woodchop'],
  g2_inc: ['inc_db_press'], g2_pull: ['wt_pullup', 'lat_pulldown'], g2_sq: ['bb_squat', 'hack_squat'], g2_sl: ['sl_rdl'], g2_pal: ['pallof']
};
const kzFormOf = e => (KZ_MAP[e.id] || (/^s_/.test(e.id) ? [e.id.slice(2)] : [])).filter(i => KZ_FORM[i]).map(i => Object.assign({ id: i }, KZ_FORM[i]));
const kzFormIco = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10.2 8.6l5 3.4-5 3.4z"/></svg>';
function kzFormBtn(e) {
  if (!kzFormOf(e).length) return '';
  return '<div class="kzfw"><button class="kzfb" data-q="kzForm" data-id="' + esc(e.id) + '" aria-haspopup="dialog" aria-label="Contoh gerakan yang benar: ' + esc(e.n) + '">' + kzFormIco + '<span>Contoh gerakan yang benar</span></button></div>';
}
function kzFormTips(e) {   // cara satu set yang benar, dari data gerakan (set, reps/detik, per sisi, RIR)
  const t = [];
  if (e.sec) t.push('Tahan dengan bentuk benar. Hentikan set saat pinggang turun atau bahu naik, jangan memaksa. Pakai tombol Timer di baris set.');
  else t.push('Turun sekitar 2–3 detik, naik terkendali. Hembuskan napas saat bagian tersulit.');
  if (!e.sec) t.push(e.rir != null ? 'Sisakan ' + e.rir + ' reps di akhir set (RIR ' + e.rir + '). Bentuk rusak berarti set selesai.' : 'Berhenti 1–2 reps sebelum bentuk rusak, bukan sampai gagal total.');
  if (e.per) t.push('Selesaikan satu ' + e.per + ' dulu, lalu ganti. Set dihitung per ' + e.per + '.');
  return t;
}
/* ========= TAHAP 68a: VIDEO YOUTUBE DI SHEET KALISTENIK =========
   Cari di dalam aplikasi lewat YouTube Data API v3 (kunci API milik pemilik), putar lewat sematan youtube-nocookie.
   Tanpa ketukan pemilik, TIDAK ada permintaan ke Google/YouTube. Kunci dan video tersimpan: khusus perangkat, tidak ikut ekspor JSON. */
const KEY_YT = 'dailylog:yt:v1';
const YT_API = 'https://www.googleapis.com/youtube/v3/search';
const YT_ID = /^[A-Za-z0-9_-]{11}$/, YT_CTX = /^[A-Za-z0-9_.:-]{1,48}$/, YT_KEYRE = /^[A-Za-z0-9_-]{20,80}$/;
const YT_TIMEOUT = 10000, YT_N = 8;
const ytBlank = () => ({ updated: 0, k: '', v: {} });
let ydb = ytBlank();
function ytVid(x) { return x && typeof x === 'object' && YT_ID.test(String(x.id)) ? { id: String(x.id), t: String(x.t == null ? '' : x.t).slice(0, 140), c: String(x.c == null ? '' : x.c).slice(0, 90) } : null; }
function ytClean(raw) {
  const b = ytBlank();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return b;
  const u = Number(raw.updated); b.updated = Number.isFinite(u) && u > 0 ? u : 0;
  b.k = typeof raw.k === 'string' && YT_KEYRE.test(raw.k) ? raw.k : '';
  const v = raw.v && typeof raw.v === 'object' && !Array.isArray(raw.v) ? raw.v : {};
  Object.keys(v).slice(0, 500).forEach(id => { const x = YT_CTX.test(id) && id !== '__proto__' ? ytVid(v[id]) : null; if (x) b.v[id] = x; });
  return b;
}
STORES.yt = { key: KEY_YT, get: () => ydb }; dirty.yt = false;   // khusus perangkat: tidak ikut ekspor JSON
let ytS = null;   // sheet yang sedang terbuka: { id, q, st: idle|setup|busy|list|play, res, sel, err, seq, ctrl }
function ytBegin(id, name, hid, hk) { ytEnd(); ytS = { id: id, nm: name, hid: hk ? '' : (hid || 'ytHost'), hk: hk || '', q: name + ' tutorial', st: 'idle', res: [], sel: null, err: '', seq: 0, ctrl: null }; }
function ytEnd() {
  const s = ytS; ytS = null;
  if (s && s.ctrl) { try { s.ctrl.abort(); } catch (e) { /* abaikan */ } }
  const h = s ? ytHostEl(s) : $('#ytHost'); if (h) h.innerHTML = s && s.hk ? ytSavedCard(s.id, s.nm, s.hk) : '';   // sheet hanya disembunyikan: bongkar pemutar supaya suara berhenti
}
const ytDec = s => { try { return new DOMParser().parseFromString(String(s), 'text/html').documentElement.textContent || ''; } catch (e) { return String(s); } };   // judul dari API berisi entitas HTML
function ytParse(js) {
  if (!js || typeof js !== 'object' || !Array.isArray(js.items)) return null;
  const out = [];
  js.items.forEach(it => {
    const id = it && it.id && typeof it.id === 'object' ? it.id.videoId : null, sn = it && it.snippet && typeof it.snippet === 'object' ? it.snippet : {};
    const v = typeof id === 'string' ? ytVid({ id: id, t: ytDec(sn.title || ''), c: ytDec(sn.channelTitle || '') }) : null;
    if (v && !out.some(o => o.id === v.id) && out.length < YT_N) out.push(v);
  });
  return out;
}
function ytErr(status, js) {
  const e = js && typeof js === 'object' && js.error && typeof js.error === 'object' ? js.error : {};
  const rs = [];
  [e.errors, e.details].forEach(a => { if (Array.isArray(a)) a.forEach(x => { if (x && typeof x.reason === 'string') rs.push(x.reason); }); });
  if (typeof e.status === 'string') rs.push(e.status);
  const has = re => rs.some(r => re.test(r));
  if (status === 429 || has(/^(quotaExceeded|dailyLimitExceeded|rateLimitExceeded|RESOURCE_EXHAUSTED|RATE_LIMIT_EXCEEDED)$/)) return 'Kuota pencarian gratis habis (batas sekitar 100 pencarian per hari, direset tiap tengah malam waktu Pasifik, sore hari di WITA). Video yang sudah disimpan tetap bisa diputar.';
  if (has(/^(API_KEY_INVALID|keyInvalid)$/)) return 'Kunci API salah atau sudah dihapus. Hapus kunci lalu tempel yang benar.';
  if (has(/^(accessNotConfigured|SERVICE_DISABLED|API_KEY_SERVICE_BLOCKED)$/)) return 'Kunci ini belum boleh memakai YouTube Data API v3. Aktifkan API-nya di Google Cloud atau periksa pembatasan API pada kunci.';
  if (has(/REFERRER_BLOCKED|ipRefererBlocked/)) return 'Kunci dibatasi ke alamat situs lain. Tambahkan alamat tempat aplikasi ini dibuka pada pembatasan situs web kunci. Aplikasi yang dibuka dari berkas lokal tidak punya alamat situs.';
  return 'YouTube menolak permintaan (kode ' + status + ').' + (typeof e.message === 'string' && e.message ? ' ' + e.message.slice(0, 140) : '');
}
function ytPlayerHTML(v) { return '<div class="ytv"><iframe src="https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1" title="' + esc('Video: ' + v.t) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'; }
function ytHostHTML() {
  const s = ytS; if (!s) return '';
  const sv = ydb.v[s.id], btn = (q, l, c) => '<button type="button" class="btn sm' + (c ? ' ' + c : '') + '" data-q="' + q + '">' + l + '</button>';
  let h = '';
  if (s.st === 'setup') {
    h = '<div class="ytc"><b>Kunci API YouTube (gratis, sekali saja)</b><ol><li>Buka console.cloud.google.com, buat proyek.</li><li>Di Library, aktifkan "YouTube Data API v3".</li><li>Di Credentials, pilih Create credentials, lalu API key.</li><li>Batasi kunci: API restrictions ke YouTube Data API v3, dan Websites ke alamat tempat aplikasi ini dibuka (mis. GitHub Pages-mu).</li><li>Tempel kunci di bawah.</li></ol>' +
      '<input id="ytKeyIn" type="password" name="yt-key" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tempel kunci API" aria-label="Kunci API YouTube">' +
      '<div class="b18act">' + btn('ytKeySave', 'Simpan dan cari', 'primary') + btn('ytShut', 'Batal') + '</div>' +
      '<p class="note">Kunci hanya disimpan di perangkat ini dan tidak ikut ekspor, tetapi siapa pun yang memakai perangkat ini bisa melihatnya. Setiap pencarian memakai kuota gratis (sekitar 100 per hari).</p></div>';
  } else if (s.st === 'play' && s.sel) {
    const saved = sv && sv.id === s.sel.id;
    h = ytPlayerHTML(s.sel) + '<p class="ytm"><b>' + esc(s.sel.t) + '</b><br>' + esc(s.sel.c) + '</p><div class="b18act">' +
      (saved ? btn('ytDelVid', 'Hapus video tersimpan') : btn('ytSave', 'Simpan untuk latihan ini', 'primary')) + (s.res.length ? btn('ytBack', 'Kembali ke hasil') : '') + btn('ytShut', 'Tutup video') + '</div>';
  } else if (s.st === 'list' || s.st === 'busy') {
    h = '<div class="yts"><input id="ytQ" type="search" value="' + esc(s.q) + '" enterkeyhint="search" autocomplete="off" aria-label="Cari video">' + btn('ytGo', 'Cari', 'primary') + '</div>';
    if (s.st === 'busy') h += '<p class="ytm" role="status">Mencari…</p>';
    else if (!s.res.length) { if (!s.err) h += '<p class="ytm">Tidak ada video yang cocok. Coba kata kunci lain.</p>'; }
    else h += s.res.map(v => '<button type="button" class="ytr" data-q="ytPlay" data-v="' + v.id + '"><img src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg" alt="" width="96" height="54" loading="lazy"><span><b>' + esc(v.t) + '</b><small>' + esc(v.c) + '</small></span></button>').join('');
    h += '<div class="b18act">' + btn('ytShut', 'Tutup pencarian') + btn('ytKeyDel', 'Hapus kunci') + '</div><p class="note">Hasil dari YouTube, hanya video yang boleh disematkan. Mengetuk hasil memuat video dari YouTube.</p>';
  } else if (sv) {
    h = '<button type="button" class="ytr" data-q="ytPlay" data-v="' + sv.id + '"><span><b>▶ Putar video tersimpan</b><small>' + esc(sv.t) + (sv.c ? ' · ' + esc(sv.c) : '') + '</small></span></button>';
  }
  if (s.err) h += '<p class="yte" role="alert">' + esc(s.err) + '</p>';
  return h;
}
function ytRender() { const h = ytHostEl(ytS); if (h) h.innerHTML = ytHostHTML(); }
async function ytSearch() {
  const s = ytS; if (!s || s.st === 'busy') return;
  if (!ydb.k) { s.st = 'setup'; ytRender(); return; }
  const q = s.q.trim(); if (!q) { s.err = 'Ketik kata kunci dulu.'; ytRender(); return; }
  const ctrl = new AbortController(), seq = ++s.seq; s.ctrl = ctrl; s.st = 'busy'; s.err = ''; ytRender();
  let to = false; const tm = setTimeout(() => { to = true; ctrl.abort(); }, YT_TIMEOUT);
  let res = null, err = '';
  try {
    const r = await fetch(YT_API + '?part=snippet&type=video&videoEmbeddable=true&maxResults=' + YT_N + '&q=' + encodeURIComponent(q) + '&key=' + encodeURIComponent(ydb.k), { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' });
    let js = null; try { js = await r.json(); } catch (e) { js = null; }
    if (!r.ok) err = ytErr(r.status, js); else { res = ytParse(js); if (!res) err = 'Jawaban YouTube tidak dikenali. Coba lagi nanti.'; }
  } catch (e) { err = to ? 'Pencarian terlalu lama. Cek koneksi lalu coba lagi.' : (navigator.onLine === false ? 'Tidak ada koneksi internet.' : 'Tidak bisa terhubung ke YouTube. Cek koneksi lalu coba lagi.'); }
  clearTimeout(tm);
  if (ytS !== s || s.seq !== seq) return;   // sheet ditutup atau ada pencarian yang lebih baru: hasil dibuang
  s.ctrl = null; s.st = 'list'; s.err = err; if (res) s.res = res;
  ytRender();
}
QACT.ytOpen = () => { const s = ytS; if (!s) return; s.err = ''; if (!ydb.k) { s.st = 'setup'; ytRender(); const i = $('#ytKeyIn'); if (i) i.focus(); } else ytSearch(); };
QACT.ytKeySave = () => {
  const s = ytS, i = $('#ytKeyIn'); if (!s || !i) return;
  const k = i.value.trim();
  if (!YT_KEYRE.test(k)) { s.err = 'Kunci tidak terlihat benar. Kunci API Google berupa 30 sampai 60 huruf dan angka tanpa spasi.'; ytRender(); return; }
  ydb.k = k; ydb.updated = Date.now(); queueSave('yt'); s.err = ''; ytSearch();
};
QACT.ytKeyDel = () => { const s = ytS; ydb.k = ''; ydb.updated = Date.now(); queueSave('yt'); toast('Kunci dihapus'); if (s) { s.st = 'idle'; s.res = []; s.err = ''; ytRender(); } };
QACT.ytGo = () => ytSearch();
QACT.ytPlay = el => {
  const s = ytS; if (!s) return; const id = el.dataset.v, sv = ydb.v[s.id];
  const v = s.res.find(x => x.id === id) || (sv && sv.id === id ? sv : null); if (!v) return;
  s.sel = v; s.st = 'play'; s.err = ''; ytRender();
};
QACT.ytBack = () => { const s = ytS; if (!s) return; s.st = 'list'; s.sel = null; s.err = ''; ytRender(); };
QACT.ytShut = () => { const s = ytS; if (!s) return; if (s.ctrl) s.ctrl.abort(); s.ctrl = null; s.seq++; s.st = 'idle'; s.sel = null; s.err = ''; ytRender(); };
QACT.ytSave = () => { const s = ytS; if (!s || !s.sel) return; ydb.v[s.id] = { id: s.sel.id, t: s.sel.t, c: s.sel.c }; ydb.updated = Date.now(); queueSave('yt'); toast('Video disimpan untuk latihan ini'); ytRender(); };
QACT.ytDelVid = () => { const s = ytS; if (!s) return; delete ydb.v[s.id]; ydb.updated = Date.now(); queueSave('yt'); toast('Video tersimpan dihapus'); s.st = 'idle'; s.sel = null; ytRender(); };
document.addEventListener('input', ev => { if (ev.target && ev.target.id === 'ytQ' && ytS) ytS.q = ev.target.value; });
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' || !ev.target || !ytS) return;
  if (ev.target.id === 'ytQ') { ev.preventDefault(); ytSearch(); } else if (ev.target.id === 'ytKeyIn') { ev.preventDefault(); QACT.ytKeySave(); }
});
/* ===== Tahap 68c: video YouTube di Pustaka dan sheet gerakan (wadah berbasis atribut, sesi malas) ===== */
const YT_HK = /^[A-Za-z0-9_.:|-]{1,80}$/;
function ytHostEl(s) { return s ? (s.hid ? document.getElementById(s.hid) : (YT_HK.test(s.hk) ? document.querySelector('[data-yh="' + s.hk + '"]') : null)) : null; }
function ytSavedCard(key, name, hk) {
  const sv = ydb.v[key]; if (!sv) return '';
  return '<button type="button" class="ytr" data-q="ytAtPlay" data-k="' + esc(key) + '" data-n="' + esc(name) + '" data-h="' + esc(hk) + '" data-v="' + sv.id + '"><span><b>▶ Putar video tersimpan</b><small>' + esc(sv.t) + (sv.c ? ' · ' + esc(sv.c) : '') + '</small></span></button>';
}
function ytMountBlock(key, name, hk) { return '<div class="ytp" data-yh="' + esc(hk) + '">' + (ytS && ytS.id === key && ytS.hk === hk ? ytHostHTML() : ytSavedCard(key, name, hk)) + '</div>'; }
function ytAtBtn(key, name, hk, cls) { return '<button type="button" class="' + cls + '" data-q="ytAt" data-k="' + esc(key) + '" data-n="' + esc(name) + '" data-h="' + esc(hk) + '">Cari video di sini</button>'; }
function ytEndHk(hk) { return () => { if (ytS && ytS.hk === hk) ytEnd(); }; }
function b18Base(m) { return m.n.replace(/\s*\(.*\)\s*/, ' ').trim(); }   // sama dengan b18Ytq (tanpa kurung)
function ytKeyD(id) {   // kunci simpan database: id sumber, dipotong + sidik bila lebih dari 46 huruf (batas kunci 48)
  id = String(id); if (id.length <= 46) return 'd:' + id;
  let h = 2166136261; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return 'd:' + id.slice(0, 38) + '.' + h.toString(36);
}
function ytLazyStart(el) {
  const k = el.dataset.k, n = (el.dataset.n || '').slice(0, 120), hk = el.dataset.h;
  if (!YT_CTX.test(k || '') || !YT_HK.test(hk || '')) return false;
  if (!ytS || ytS.id !== k || ytS.hk !== hk) ytBegin(k, n, '', hk);
  return true;
}
QACT.ytAt = el => { if (ytLazyStart(el)) QACT.ytOpen(); };
QACT.ytAtPlay = el => { if (ytLazyStart(el)) QACT.ytPlay(el); };
function ytWatch() {   // sesudah tiap klik: bongkar pemutar bila wadahnya hilang, terlepas, tersembunyi, atau baris/grup Pustaka-nya tertutup
  const s = ytS; if (!s) return;
  const h = ytHostEl(s);
  if (!h || !h.isConnected || h.closest('[hidden]') || (h.closest('.pmr') && !h.closest('.pmr.open')) || (h.closest('.pmg') && !h.closest('.pmg.open'))) ytEnd();
}
['click', 'input', 'change'].forEach(t => document.addEventListener(t, () => { setTimeout(ytWatch, 80); }, true));   // v68c2: juga sesudah mengetik/mengubah saringan (daftar dibangun ulang tanpa klik)
/* ========= TAHAP 69a: SHEET "CONTOH GERAKAN YANG BENAR" = SLIDE (langkah, kesalahan, set) =========
   HANYA tampilan. Data KZ_FORM/KZ_MAP, kzFormOf, kzFormTips, tombol pembuka, mesin video (ytBegin/#ytHost) dan gambar (b18Img/#b18Imgs) TETAP.
   Keadaan (slide aktif, varian) hanya di memori dan dibuang saat sheet ditutup. Slide = scroll-snap bawaan peramban (geser jari),
   plus tombol sebelumnya/berikutnya, bilah segmen, tab Langkah/Kesalahan/Set, dan panah kiri/kanan papan ketik. */
let kzsUi = null;   // { e, fs, vi, idx, n, g, lb, busy, bt, raf } selama sheet contoh terbuka
const kzsIc = {
  l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  c: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  img: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10.5" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15 13l5 4.5"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>'
};
const kzsSm = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth';
function kzsFacts(e) {   // target set sebagai chip (menggantikan kalimat "Target: ...")
  const ph = e.sec ? rng(e.sec) + ' dtk' : e.r ? rng(e.r) + ' reps' : '';
  const a = [e.sets + ' set']; if (ph) a.push(ph); if (e.per) a.push('per ' + e.per); a.push('istirahat ' + e.rest + ' dtk');
  return '<ul class="kzs-fx" aria-label="Target">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
}
function kzsSlides(e, f) {   // satu slide per langkah + satu slide kesalahan + satu slide cara satu set
  const n = f.s.length, list = (a, g, ic) => '<ul class="kzs-ls">' + a.map(x => '<li><span class="kzs-ic kzs-ic-' + g + '" aria-hidden="true">' + ic + '</span><span>' + esc(x) + '</span></li>').join('') + '</ul>';
  const out = f.s.map((t, i) => ({ g: 's', lb: 'Langkah ' + (i + 1) + ' dari ' + n, bd: String(i + 1), k: 'Langkah ' + (i + 1) + ' <small>dari ' + n + '</small>', h: '<p class="kzs-tx">' + esc(t) + '</p>' }));
  if (f.e && f.e.length) out.push({ g: 'e', lb: 'Kesalahan umum', bd: kzsIc.x, k: 'Kesalahan umum', h: list(f.e, 'e', kzsIc.x) });
  const tp = kzFormTips(e);
  if (tp.length) out.push({ g: 't', lb: 'Satu set yang benar', bd: kzsIc.c, k: 'Satu set yang benar', h: list(tp, 't', kzsIc.c) });
  return out;
}
function kzsMainHTML(u) {   // tab bagian + jendela slide + navigasi
  const f = u.fs[u.vi], sl = kzsSlides(u.e, f);
  u.n = sl.length; u.g = sl.map(s => s.g); u.lb = sl.map(s => s.lb); if (!(u.idx >= 0 && u.idx < u.n)) u.idx = 0;
  const names = { s: 'Langkah', e: 'Kesalahan', t: 'Set' }, cur = u.g[u.idx];
  const tabs = ['s', 'e', 't'].filter(g => u.g.indexOf(g) >= 0).map(g => '<button type="button" class="kzs-tb" data-q="kzsGrp" data-g="' + g + '" aria-pressed="' + (g === cur) + '">' + names[g] + '</button>').join('');
  const cards = sl.map((s, i) => '<section class="kzs-sl" role="group" aria-roledescription="slide" aria-label="' + esc('Slide ' + (i + 1) + ' dari ' + sl.length + ': ' + s.lb) + '"><div class="kzs-cd kzs-cd-' + s.g + '"><div class="kzs-hd"><span class="kzs-bd kzs-bd-' + s.g + '" aria-hidden="true">' + s.bd + '</span><span class="kzs-k">' + s.k + '</span></div>' + s.h + '</div></section>').join('');
  const segs = sl.map((s, i) => '<button type="button" class="kzs-sg kzs-sg-' + s.g + (i === u.idx ? ' on' : i < u.idx ? ' past' : '') + '" data-q="kzsGo" data-i="' + i + '" aria-label="' + esc('Slide ' + (i + 1) + ' dari ' + sl.length + ': ' + s.lb) + '"' + (i === u.idx ? ' aria-current="true"' : '') + '><i></i></button>').join('');
  return '<div class="kzs-tabs" role="group" aria-label="Bagian contoh gerakan">' + tabs + '</div>' +
    '<div class="kzs-vp" id="kzsVp" tabindex="0" role="group" aria-roledescription="carousel" aria-label="' + esc('Contoh gerakan ' + f.n + '. Geser ke samping atau pakai tombol panah.') + '"><div class="kzs-tr">' + cards + '</div></div>' +
    '<div class="kzs-nav"><button type="button" class="kzs-ar" id="kzsPrev" data-q="kzsPrev" aria-label="Slide sebelumnya"' + (u.idx === 0 ? ' aria-disabled="true"' : '') + '>' + kzsIc.l + '</button>' +
    '<div class="kzs-seg" role="group" aria-label="Pilih slide">' + segs + '</div>' +
    '<button type="button" class="kzs-ar" id="kzsNext" data-q="kzsNext" aria-label="Slide berikutnya"' + (u.idx === u.n - 1 ? ' aria-disabled="true"' : '') + '>' + kzsIc.r + '</button></div>' +
    '<p class="kzs-sr" id="kzsSr" role="status"></p>';
}
function kzsMediaHTML(u) {   // gambar hanya bila gerakan ada di pustaka; video dan YouTube lewat mesin Tahap 68 (tetap)
  const f = u.fs[u.vi], mv = b18Mv(f.id);
  return (mv ? '<button type="button" class="kzs-mb b18go" data-q="b18Img" data-id="' + mv.id + '">' + kzsIc.img + '<span>Tampilkan gambar</span></button>' : '') +
    '<button type="button" class="kzs-mb b18go" data-q="ytOpen">' + kzFormIco + '<span>Cari video di sini</span></button>' +
    '<a class="kzs-mb b18go" href="' + esc(B18_YT + encodeURIComponent(f.n + ' tutorial')) + '" target="_blank" rel="noopener noreferrer">' + kzsIc.ext + '<span>Buka di YouTube</span></a>';
}
function kzsPaint(say) {   // sinkronkan tab, segmen, panah, dan pengumuman dengan slide aktif (tanpa membangun ulang DOM)
  const u = kzsUi, main = $('#kzsMain'); if (!u || !main) return;
  main.querySelectorAll('.kzs-sg').forEach((b, i) => {
    b.classList.toggle('on', i === u.idx); b.classList.toggle('past', i < u.idx);
    if (i === u.idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  main.querySelectorAll('.kzs-tb').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === u.g[u.idx])));
  const p = $('#kzsPrev'), n = $('#kzsNext');
  if (p) p.setAttribute('aria-disabled', String(u.idx === 0)); if (n) n.setAttribute('aria-disabled', String(u.idx === u.n - 1));
  const sr = $('#kzsSr'); if (sr && say) sr.textContent = 'Slide ' + (u.idx + 1) + ' dari ' + u.n + ': ' + u.lb[u.idx];
}
function kzsSync() {   // posisi gulir (geser jari) -> slide aktif
  const u = kzsUi, vp = $('#kzsVp'); if (!u || !vp || u.busy || !vp.clientWidth) return;
  const i = Math.max(0, Math.min(u.n - 1, Math.round(vp.scrollLeft / vp.clientWidth)));
  if (i !== u.idx) { u.idx = i; kzsPaint(true); }
}
function kzsGo(i, instant) {
  const u = kzsUi, vp = $('#kzsVp'); if (!u || !vp) return;
  i = Math.max(0, Math.min(u.n - 1, Math.round(Number(i) || 0)));
  const ch = i !== u.idx; u.idx = i; u.busy = true; clearTimeout(u.bt);
  vp.scrollTo({ left: i * vp.clientWidth, behavior: instant ? 'auto' : kzsSm() });
  u.bt = setTimeout(() => { if (kzsUi === u) { u.busy = false; kzsSync(); } }, instant ? 30 : 500);   // selama animasi, abaikan kejadian gulir supaya tab tidak berkedip
  kzsPaint(ch);
}
function kzsBind() {
  const u = kzsUi, vp = $('#kzsVp'); if (!u || !vp) return;
  vp.addEventListener('scroll', () => { const k = kzsUi; if (!k || k.raf) return; k.raf = requestAnimationFrame(() => { k.raf = 0; kzsSync(); }); }, { passive: true });
  if (u.idx) vp.scrollLeft = u.idx * vp.clientWidth;
}
function kzsRender() {   // ganti varian: bangun ulang slide + media; mesin video dan kotak gambar TETAP
  const u = kzsUi, main = $('#kzsMain'); if (!u || !main) return;
  const f = u.fs[u.vi]; main.innerHTML = kzsMainHTML(u); const md = $('#kzsMedia'); if (md) md.innerHTML = kzsMediaHTML(u);
  const im = $('#b18Imgs'); if (im) im.textContent = '';
  document.querySelectorAll('#sheet .kzs-vb').forEach((b, i) => b.setAttribute('aria-pressed', String(i === u.vi)));
  if (ytS && ytS.id === 'k:' + u.e.id && ytS.st === 'idle') { ytS.nm = f.n; ytS.q = f.n + ' tutorial'; }   // pencarian video yang belum dimulai mengikuti varian
  kzsBind(); kzsPaint(true);
}
function kzFormSheet(e) {
  const fs = kzFormOf(e); if (!fs.length) return;
  ytBegin('k:' + e.id, fs[0].n);
  const u = kzsUi = { e: e, fs: fs, vi: 0, idx: 0, n: 0, g: [], lb: [], busy: false, bt: 0, raf: 0 };
  const vr = fs.length > 1 ? '<div class="kzs-vr" role="group" aria-label="Varian gerakan">' + fs.map((f, i) => '<button type="button" class="kzs-vb" data-q="kzsVar" data-v="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(f.n) + '</button>').join('') + '</div>' : '';
  const h = '<div class="kzf kzs">' + kzsFacts(e) + vr + '<div id="kzsMain">' + kzsMainHTML(u) + '</div><div class="kzs-md" id="kzsMedia">' + kzsMediaHTML(u) + '</div>' +
    '<div class="ytp" id="ytHost">' + ytHostHTML() + '</div><div class="b18imgs" id="b18Imgs" aria-live="polite"></div>' +
    '<p class="note">Petunjuk ditulis dari pengetahuan umum kebugaran dan belum ditinjau pelatih. Sesuaikan dengan kemampuanmu. Nyeri tajam, bengkak, atau mati rasa: hentikan dan temui tenaga kesehatan. Gambar dan video hanya dibuka bila kamu mengetuknya.</p></div>';
  const acts = [];
  if (b18CanAsk()) acts.push({ label: '✦ Tanya pelatih', primary: true, fn: () => { const nm = kzsUi ? kzsUi.fs[kzsUi.vi].n : fs[0].n; closeSheet(); b18Ask('Jelaskan teknik ' + nm + ' yang benar, kesalahan umum, dan cara membuatnya lebih mudah atau lebih sulit.'); } });
  acts.push(closeBtn);
  openSheet({ title: e.n, note: '', extra: h, actions: acts, onClose: () => { kzsUi = null; ytEnd(); } });
  kzsBind();
}
QACT.kzForm = el => { const e = exList().find(x => x.id === el.dataset.id); if (e) kzFormSheet(e); };
QACT.kzsGo = el => kzsGo(el.dataset.i);
QACT.kzsPrev = () => { if (kzsUi) kzsGo(kzsUi.idx - 1); };
QACT.kzsNext = () => { if (kzsUi) kzsGo(kzsUi.idx + 1); };
QACT.kzsGrp = el => { if (!kzsUi) return; const i = kzsUi.g.indexOf(el.dataset.g); if (i >= 0) kzsGo(i); };
QACT.kzsVar = el => {   // ganti varian gerakan; tetap di bagian (Langkah/Kesalahan/Set) yang sama
  const u = kzsUi; if (!u) return; const v = Number(el.dataset.v);
  if (!(v >= 0 && v < u.fs.length) || v === u.vi) return;
  const g = u.g[u.idx]; u.vi = v; u.idx = 0; u.busy = false; clearTimeout(u.bt);
  const sl = kzsSlides(u.e, u.fs[v]), at = sl.findIndex(s => s.g === g); u.idx = at > 0 ? at : 0;
  kzsRender();
};
document.addEventListener('keydown', ev => {   // panah kiri/kanan = slide sebelumnya/berikutnya (bukan saat mengetik)
  const u = kzsUi; if (!u || ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
  if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
  const t = ev.target; if (t && t.closest && t.closest('input,textarea,select,[contenteditable]')) return;
  if ($('#sheet').hidden) return;
  ev.preventDefault(); kzsGo(u.idx + (ev.key === 'ArrowRight' ? 1 : -1));
});
window.addEventListener('resize', () => { const u = kzsUi, vp = $('#kzsVp'); if (u && vp) vp.scrollTo({ left: u.idx * vp.clientWidth, behavior: 'auto' }); });
function kzLadHTML() {   // empat blok Push/Pull/Legs/Core dalam SATU kartu (aksi tombol sama dengan ladderHTML: data-q="lvl")
  return '<div class="f kzlad">' + LK.map(k => {
    const L = LADDER[k], lv = pdb.ladder[k];
    return '<div class="kzlr"><div class="lbl">' + L.nama + ' <small>' + esc(L.otot) + '</small></div>' +
      '<div class="seg">' + [1, 2, 3, 4].map(n => '<button class="pill" data-q="lvl" data-pat="' + k + '" data-v="' + n + '" aria-label="' + L.nama + ' level ' + n + '" aria-pressed="' + (n === lv) + '">' + n + '</button>').join('') + '</div>' +
      '<div class="mtxt kzln">Sekarang: ' + esc(L.lv[lv - 1]) + '</div>' +
      '<div class="mtxt">' + (lv < 4 ? 'Berikutnya: ' + esc(L.lv[lv]) : 'Level tertinggi di tangga ini') + '</div></div>';
  }).join('') + '<p class="note">Naik level saat kamu bisa lebih dari 15–20 reps dengan bentuk sempurna.</p></div>';
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b24k1b: Object.freeze({ form: kzFormOf, forms: KZ_FORM, map: KZ_MAP, sheet: kzFormSheet, ladder: kzLadHTML }) }));
window.DL = Object.freeze(Object.assign({}, window.DL, { b69a: Object.freeze({ state: () => kzsUi ? { vi: kzsUi.vi, idx: kzsUi.idx, n: kzsUi.n, g: kzsUi.g.slice(), lb: kzsUi.lb.slice() } : null, go: kzsGo }) }));

/* ===== MODUL: LATIHAN > KALISTENIK > SESI: Tangga progresi + Sesi terakhir = kartu lipat, terlipat tiap Kalistenik BARU dibuka (tahap 14, k1c) ===== */
// HANYA tampilan. Data (tdb/pdb), logika, dan semua tombol lama (data-q="lvl" dst.) TETAP. Tidak ada kunci penyimpanan baru: keadaan buka/tutup hanya di memori.
// "BARU dibuka" = Latihan dibuka dari tampilan lain (showView) atau pindah Sepeda -> Kalistenik (trTab). Selama masih di Kalistenik (ganti tab Sesi/Rekor/Pulih/Pustaka,
// ketuk tombol level, centang set) pilihan buka/tutup DIINGAT, supaya kartu tidak menutup sendiri di tengah dipakai.
let kzSec = {};   // 'lad' | 'his' -> true bila dibuka; kosong = terlipat
function kzFresh() { try { kzSec = {}; rzFresh(); plFresh(); pmFresh(); } catch (x) { /* modul belum berjalan: abaikan */ } }
function kzLadSum() { return LK.map(k => LADDER[k].nama + ' ' + pdb.ladder[k]).join(' · '); }
function kzHisSum() {
  const ds = Object.keys(tdb).filter(d => tdb[d].kal && tdb[d].kal.done).sort().reverse();
  if (!ds.length) return 'Belum ada sesi selesai';
  const k = tdb[ds[0]].kal; let n = 0;
  Object.keys(k.ex).forEach(id => { n += k.ex[id].s.filter(x => x.d).length; });
  return 'Terakhir ' + dayShort(ds[0]) + ' · ' + n + ' set';
}
function kzSecHTML(id, title, sum, body) {
  const open = !!kzSec[id];
  return '<div class="kzx kzsx' + (open ? ' open' : '') + '" data-sec="' + id + '">' +
    '<button class="kzxh" data-q="kzSec" data-sid="' + id + '" aria-expanded="' + open + '" aria-controls="kzsb_' + id + '">' +
    '<span class="kzxt"><b>' + esc(title) + '</b><small>' + esc(sum) + '</small></span>' + kzChev + '</button>' +
    '<div class="kzxb" id="kzsb_' + id + '"><div class="kzxi">' + body + '</div></div></div>';
}
QACT.kzSec = el => {
  const card = el.closest('.kzx'); if (!card) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  kzSec[el.dataset.sid] = open; el.setAttribute('aria-expanded', open); card.classList.toggle('open', open);
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b24k1c: Object.freeze({ sec: () => Object.assign({}, kzSec), fresh: kzFresh }) }));

/* ===== MODUL: LATIHAN > KALISTENIK > REKOR: tampilan baru (tahap 16, k2) ===== */
// HANYA tampilan. Data (tdb), perhitungan (b16Compute / b16Prs / b16Sum) dan tab lain TETAP. Tidak ada kunci penyimpanan baru:
// buka/tutup kartu, saringan, rentang grafik, dan titik terpilih hanya di memori (reset tiap Kalistenik BARU dibuka, lewat kzFresh).
// Buka/tutup, saringan, dan pilih titik mengubah DOM langsung (tanpa render ulang) supaya gulir dan animasi tidak terganggu.
let rzOpen = {}, rzSel = {}, rzRange = 12, rzFilter = 'all', rzBox = false;   // k3: rzBox = kartu besar "Rekor per gerakan" terbuka
function rzFresh() { rzOpen = {}; rzSel = {}; rzRange = 12; rzFilter = 'all'; rzBox = false; }
const rzIc = {
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/></svg>',
  l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
};
const rzDays = d => Math.round((pd(today()) - pd(d)) / 864e5);
function rzGroups() {
  const S = b16Compute(), gs = Object.keys(S).map(k => S[k]);
  gs.sort((a, b) => b.pts[b.pts.length - 1].d.localeCompare(a.pts[a.pts.length - 1].d) || a.key.localeCompare(b.key));
  return gs;
}
const rzLabel = g => { const l = b16LvName(g.id, g.lv); return b16Name(g.id) + (l ? ' · ' + l : ''); };
function rzMeta(g) { const prs = b16Prs(g); return { g, s: b16Sum(g), prs, fresh: prs.indexOf(g.pts.length - 1) >= 0 }; }
function rzSpark(g) {
  const v = g.pts.slice(-8).map(p => p.best), n = v.length;
  if (n < 2) return '<svg viewBox="0 0 56 26"><circle class="sd" cx="28" cy="13" r="2.6"/></svg>';
  const lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), rg = hi - lo || 1;
  const P = v.map((x, i) => [3 + i * 50 / (n - 1), hi === lo ? 13 : 22 - (x - lo) / rg * 18]);
  return '<svg viewBox="0 0 56 26"><polyline class="sl" points="' + P.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '"/><circle class="sd" cx="' + P[n - 1][0].toFixed(1) + '" cy="' + P[n - 1][1].toFixed(1) + '" r="2.6"/></svg>';
}
function rzHeroHTML(gs, shown) {
  const sess = new Set(); let pr30 = 0, last = null;
  gs.forEach(g => { g.pts.forEach(p => sess.add(p.d)); b16Prs(g).forEach(i => { const dd = rzDays(g.pts[i].d); if (dd >= 0 && dd <= 30) pr30++; }); });
  shown.forEach(g => b16Prs(g).forEach(i => { const p = g.pts[i]; if (!last || p.d > last.p.d) last = { g, p, i }; }));
  let jump = '';
  if (last) {
    const prev = Math.max.apply(null, last.g.pts.slice(0, last.i).map(q => q.best));
    jump = '<button class="rzpr" data-q="rzJump" data-k="' + esc(last.g.key) + '"><span class="rzpri">' + rzIc.up + '</span><span class="rzprt"><b>' + esc(rzLabel(last.g)) +
      '</b><small>Rekor baru ' + prev + ' → ' + last.p.best + ' ' + b16Unit(last.g.id) + ' · ' + esc(dayShort(last.p.d)) + '</small></span>' + rzIc.r + '</button>';
  }
  const chip = pr30 > 0 ? '<span class="kzg ok">' + pr30 + ' rekor baru dalam 30 hari</span>' : '<span class="kzg">Belum ada rekor baru dalam 30 hari</span>';
  return '<section class="rzh" aria-label="Ringkasan rekor"><h2 class="kzt">Rekor</h2><p>' + gs.length + ' gerakan · ' + sess.size + ' sesi tercatat</p><div class="kzgs">' + chip + '</div>' + jump + '</section>';
}
function rzFilterHTML(nAll, nPr) {
  if (!nPr) return '';
  const chip = (v, l, n) => '<button class="pill" data-q="rzFilter" data-v="' + v + '" aria-pressed="' + (rzFilter === v) + '">' + l + ' <span class="rzn">' + n + '</span></button>';
  return '<div class="rzfl" role="group" aria-label="Saring gerakan">' + chip('all', 'Semua', nAll) + chip('pr', 'Rekor baru', nPr) + '</div>';
}
const rzSelOf = g => { const n = g.pts.length, off = Math.max(0, n - Math.min(rzRange, B16_MAX_PTS)), s = rzSel[g.key] === undefined ? n - 1 : rzSel[g.key]; return Math.max(off, Math.min(n - 1, s)); };
function rzSVG(g, pts, off, sel, prs) {
  const W = 300, H = 128, B = 18, T = 24, n = pts.length, step = W / n, x = i => step * i + step / 2, base = H - B;
  const vals = pts.map(p => p.best), lo0 = Math.min.apply(null, vals), hi0 = Math.max.apply(null, vals);
  const pad = Math.max((hi0 - lo0) * .3, hi0 * .05, 1), lo = Math.max(0, lo0 - pad), hi = hi0 + pad;
  const y = v => T + (H - B - T) * (1 - (v - lo) / (hi - lo));
  const P = pts.map((p, i) => [x(i), y(p.best)]);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Set terbaik per sesi, ' + b16Name(g.id)) + ', ' + n + ' sesi terakhir">';
  s += '<path class="rza" d="M' + P[0][0].toFixed(1) + ',' + base + ' ' + P.map(q => 'L' + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + ' L' + P[n - 1][0].toFixed(1) + ',' + base + ' Z"/>';
  s += '<line class="rzb" x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '"/>';
  s += '<polyline class="rzl" pathLength="1" points="' + P.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '"/>';
  pts.forEach((p, i) => {
    const cx = P[i][0].toFixed(1), cy = P[i][1].toFixed(1), on = i + off === sel;
    if (on) s += '<line class="rzg" x1="' + cx + '" y1="' + (T - 6) + '" x2="' + cx + '" y2="' + base + '"/>';
    if (prs.has(i + off)) s += '<circle class="rzring" cx="' + cx + '" cy="' + cy + '" r="7.5"/>';
    s += p.dl ? '<rect class="rzdl' + (on ? ' on' : '') + '" x="' + (P[i][0] - 3.6).toFixed(1) + '" y="' + (P[i][1] - 3.6).toFixed(1) + '" width="7.2" height="7.2" transform="rotate(45 ' + cx + ' ' + cy + ')"/>'
      : '<circle class="rzd' + (on ? ' on' : '') + '" cx="' + cx + '" cy="' + cy + '" r="' + (on ? 4.6 : 3.2) + '"/>';
  });
  const sp = P[sel - off];
  s += '<text class="rzvl" x="' + Math.max(12, Math.min(W - 12, sp[0])).toFixed(1) + '" y="' + (sp[1] - 11).toFixed(1) + '" text-anchor="middle">' + pts[sel - off].best + '</text>';
  const every = n > 8 ? 2 : 1;
  pts.forEach((p, i) => { if ((n - 1 - i) % every === 0) { const d = pd(p.d); s += '<text x="' + P[i][0].toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + d.getDate() + '/' + (d.getMonth() + 1) + '</text>'; } });
  return s + '</svg>';
}
function rzChartInner(g) {
  const n0 = g.pts.length;
  if (n0 < 2) return '<p class="note rznote">Baru 1 sesi tercatat. Grafik muncul mulai sesi kedua.</p>';
  const u = b16Unit(g.id), R = Math.min(rzRange, B16_MAX_PTS), pts = g.pts.slice(-R), off = n0 - pts.length, prs = new Set(b16Prs(g)), sel = rzSelOf(g);
  const p = g.pts[sel], isPr = prs.has(sel), hasDl = pts.some(x => x.dl), k = esc(g.key);
  const nav = (v, ic, lab, dis) => '<button class="rznv" data-q="rzNav" data-k="' + k + '" data-v="' + v + '" aria-label="' + lab + '"' + (dis ? ' aria-disabled="true"' : '') + '>' + ic + '</button>';
  const rg = n0 > 6 ? '<div class="rzrg" role="group" aria-label="Rentang grafik"><button class="pill" data-q="rzRange" data-v="6" aria-pressed="' + (R === 6) + '">6 terakhir</button><button class="pill" data-q="rzRange" data-v="12" aria-pressed="' + (R !== 6) + '">12 terakhir</button></div>' : '';
  const hits = pts.map((q, i) => '<button class="rzhit" tabindex="-1" data-q="rzPt" data-k="' + k + '" data-i="' + (i + off) + '" style="left:' + (i * 100 / pts.length).toFixed(3) + '%;width:' + (100 / pts.length).toFixed(3) + '%" aria-label="' + esc(shortDate(q.d)) + ': ' + q.best + ' ' + u + '"></button>').join('');
  return '<div class="rzch">' + nav(-1, rzIc.l, 'Sesi sebelumnya', sel <= off) +
    '<div class="rzro" aria-live="polite"><b>' + esc(dayShort(p.d)) + (isPr ? '<span class="rzpb">PR</span>' : '') + '</b><small>' + p.best + ' ' + u + ' terbaik · ' + p.n + ' set · total ' + p.tot + (p.dl ? ' · deload' : '') + '</small></div>' +
    nav(1, rzIc.r, 'Sesi berikutnya', sel >= n0 - 1) + '</div>' +
    '<div class="rzcv">' + rzSVG(g, pts, off, sel, prs) + hits + '</div>' +
    '<div class="rzcf"><p class="rzleg">Cincin = rekor baru' + (hasDl ? ' · belah ketupat = deload' : '') + '</p>' + rg + '</div>';
}
const rzTile = (v, u, lab, d) => '<div><b>' + v + '<small>' + u + '</small></b><span>' + lab + '</span><span>' + esc(shortDate(d)) + '</span></div>';
function rzPanel(m) {
  const g = m.g, s = m.s, u = b16Unit(g.id);
  const lv = g.lv ? 'Level saat itu: ' + esc(b16LvName(g.id, g.lv)) : (B16_PAT[g.id] ? 'Level saat itu tidak tercatat (sesi sebelum Batch 16).' : '');
  return '<div class="rzp"><div class="rzst">' + rzTile(s.best, u, 'Set terbaik', s.bestD) + rzTile(s.tot, u, 'Total terbaik', s.totD) + rzTile(s.last.best, u, 'Sesi terakhir', s.last.d) + '</div>' +
    '<div class="rzc" data-k="' + esc(g.key) + '">' + rzChartInner(g) + '</div>' +
    '<p class="rzlv">' + s.n + ' sesi · ' + s.sets + ' set selesai' + (lv ? ' · ' + lv : '') + '</p></div>';
}
function rzCardHTML(m, i) {
  const g = m.g, s = m.s, open = !!rzOpen[g.key], k = esc(g.key);
  return '<div class="kzx rzx' + (open ? ' open' : '') + (m.fresh ? ' pr' : '') + '" data-k="' + k + '">' +
    '<button class="kzxh rzxh" data-q="rzTog" data-k="' + k + '" aria-expanded="' + open + '" aria-controls="rzb_' + i + '">' +
    '<span class="kzxt"><b>' + esc(rzLabel(g)) + (m.fresh ? '<span class="rzpb">PR</span>' : '') + '</b><small>' + s.n + ' sesi · terakhir ' + esc(shortDate(s.last.d)) + '</small></span>' +
    '<span class="rzsp" aria-hidden="true">' + rzSpark(g) + '</span><span class="rzv"><b>' + s.best + '</b><small>' + b16Unit(g.id) + '</small></span>' + kzChev + '</button>' +
    '<div class="kzxb" id="rzb_' + i + '"><div class="kzxi">' + rzPanel(m) + '</div></div></div>';
}
const rzListHTML = M => (rzFilter === 'pr' ? M.filter(m => m.fresh) : M).map(rzCardHTML).join('');
// k3: SATU kartu lipat berisi saringan + semua kartu gerakan; terlipat tiap halaman Rekor dimasuki (rzFresh)
function rzBoxHTML(M, nPr) {
  const sum = M.length + ' gerakan' + (nPr ? ' · ' + nPr + ' dengan rekor baru' : '');
  return '<div class="rzbox' + (rzBox ? ' open' : '') + '" data-sec="rek">' +
    '<button class="rzboxh" data-q="rzBox" aria-expanded="' + rzBox + '" aria-controls="rzbox_b">' +
    '<span class="kzxt"><b>Rekor per gerakan</b><small>' + esc(sum) + '</small></span>' + kzChev + '</button>' +
    '<div class="rzboxb" id="rzbox_b"><div class="rzboxi"><div class="rzboxp">' + rzFilterHTML(M.length, nPr) +
    '<div id="rzList" class="rzlist">' + rzListHTML(M) + '</div></div></div></div></div>';
}
function rzHTML() {
  const gs = rzGroups();
  if (!gs.length) return '<section class="rzem"><h2 class="kzt">Rekor</h2><p>Belum ada set selesai yang tercatat. Rekor dan grafik muncul setelah kamu menandai set selesai di tab Sesi.</p><button class="btn primary" data-q="b16Tab" data-v="ses">Ke tab Sesi</button></section>';
  const shown = gs.slice(0, B16_MAX_GRP), M = shown.map(rzMeta), nPr = M.filter(m => m.fresh).length;
  if (rzFilter === 'pr' && !nPr) rzFilter = 'all';
  return rzHeroHTML(gs, shown) + rzBoxHTML(M, nPr) +
    '<p class="rzfn">Rekor dihitung dari set yang kamu tandai selesai. Gerakan yang sama di level berbeda dihitung terpisah.' + (gs.length > shown.length ? ' Menampilkan ' + shown.length + ' gerakan terbaru dari ' + gs.length + '.' : '') + '</p>';
}
const rzCardEl = k => Array.prototype.find.call(document.querySelectorAll('#v-train .rzx'), c => c.dataset.k === k);
function rzRepaint(key, focusSel) {   // gambar ulang SATU/SEMUA grafik (key kosong = semua) tanpa render ulang halaman
  const gs = rzGroups(), cs = Array.prototype.filter.call(document.querySelectorAll('#v-train .rzc'), c => !key || c.dataset.k === key);
  cs.forEach(c => { const g = gs.find(x => x.key === c.dataset.k); if (g) c.innerHTML = rzChartInner(g); });
  if (focusSel && cs[0]) { const b = cs[0].querySelector(focusSel); if (b) b.focus({ preventScroll: true }); }
}
QACT.rzBox = el => {
  const card = el.closest('.rzbox'); if (!card) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  rzBox = open; el.setAttribute('aria-expanded', open); card.classList.toggle('open', open);
};
QACT.rzTog = el => {
  const card = el.closest('.rzx'); if (!card) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  rzOpen[card.dataset.k] = open; el.setAttribute('aria-expanded', open); card.classList.toggle('open', open);
};
QACT.rzFilter = el => {
  const v = el.dataset.v === 'pr' ? 'pr' : 'all'; if (v === rzFilter) return;
  rzFilter = v;
  document.querySelectorAll('#v-train .rzfl .pill').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  const L = $('#rzList'); if (L) L.innerHTML = rzListHTML(rzGroups().slice(0, B16_MAX_GRP).map(rzMeta));
};
QACT.rzPt = el => { rzSel[el.dataset.k] = +el.dataset.i; rzRepaint(el.dataset.k); };
QACT.rzNav = el => {
  if (el.getAttribute('aria-disabled') === 'true') return;
  const g = rzGroups().find(x => x.key === el.dataset.k); if (!g) return;
  const n = g.pts.length, off = Math.max(0, n - Math.min(rzRange, B16_MAX_PTS));
  rzSel[g.key] = Math.max(off, Math.min(n - 1, rzSelOf(g) + (+el.dataset.v)));
  const v = +el.dataset.v, still = (v < 0 ? rzSel[g.key] > off : rzSel[g.key] < n - 1);
  rzRepaint(g.key, '[data-q="rzNav"][data-v="' + (still ? v : -v) + '"]');
};
QACT.rzRange = el => {
  const v = +el.dataset.v === 6 ? 6 : 12; if (v === rzRange) return;
  rzRange = v; rzRepaint('', '[data-q="rzRange"][data-v="' + v + '"]');
};
QACT.rzJump = el => {
  const k = el.dataset.k; let card = rzCardEl(k);
  if (!card) { const b = document.querySelector('#v-train .rzfl .pill[data-v="all"]'); if (b) QACT.rzFilter(b); card = rzCardEl(k); }
  if (!card) return;
  const box = document.querySelector('#v-train .rzbox'), shut = !!box && !box.classList.contains('open');
  if (box) { rzBox = true; box.classList.add('open'); const bh = box.querySelector('.rzboxh'); if (bh) bh.setAttribute('aria-expanded', 'true'); }
  rzOpen[k] = true; card.classList.add('open');
  const h = card.querySelector('.rzxh'); if (h) h.setAttribute('aria-expanded', 'true');
  const rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = () => { card.scrollIntoView({ block: 'start', behavior: rm ? 'auto' : 'smooth' }); if (h) h.focus({ preventScroll: true }); };
  if (shut && !rm) setTimeout(go, 320); else go();   // k3: tunggu kartu besar selesai membuka sebelum menggulir
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b25k2: Object.freeze({ open: () => Object.assign({}, rzOpen), sel: () => Object.assign({}, rzSel), range: () => rzRange, filter: () => rzFilter, fresh: rzFresh, html: rzHTML, box: () => rzBox }) }));

/* ===== MODUL: LATIHAN > KALISTENIK > PULIH: tampilan baru (tahap 17, l1) ===== */
// HANYA tampilan. Data (tdb), perhitungan (b16PainRows / b16Deload / b16Alt) dan tab lain TETAP. Tidak ada kunci penyimpanan baru, tidak ada tombol yang menulis data:
// buka/tutup kartu dan hari terpilih hanya di memori (reset tiap tab Pulih dimasuki dan tiap Kalistenik BARU dibuka, lewat plFresh).
// Buka/tutup kartu dan pilih hari mengubah DOM langsung (tanpa render ulang) supaya gulir dan animasi tidak terganggu.
// Bila penggambaran gagal, plHTML() jatuh kembali ke b16PulHTML() (tampilan lama) supaya halaman Latihan tidak pernah kosong.
let plSec = {}, plSel = '', plErr = '';   // plSec: id kartu -> terbuka; plSel: tanggal terpilih di kalender 28 hari ('' = belum ada)
function plFresh() { plSec = {}; plSel = ''; }
function plDayInfo(d) {   // hanya MEMBACA tdb; aturan sah-tidaknya nilai sama dengan b16PainRows / b16Deload
  const t = tdb[d], k = t && t.kal, o = { d, sets: 0, rpe: null, dl: false, pain: [], max: null };
  if (k && typeof k === 'object') {
    const ex = k.ex && typeof k.ex === 'object' ? k.ex : {};
    Object.keys(ex).forEach(id => { const s = ex[id] && Array.isArray(ex[id].s) ? ex[id].s : []; o.sets += s.filter(x => x && x.d).length; });
    o.dl = k.dl === true;
    o.rpe = typeof k.rpe === 'number' && Number.isFinite(k.rpe) ? k.rpe : null;
    const P = k.pain && typeof k.pain === 'object' ? k.pain : {};
    Object.keys(P).forEach(id => {
      const p = P[id]; if (!p || typeof p !== 'object') return;
      const l = Number.isInteger(p.l) && p.l >= 0 && p.l <= 10 ? p.l : null, n = typeof p.n === 'string' ? p.n : '';
      if (l == null && !n) return;
      o.pain.push({ id, l, n });
    });
    o.pain.sort((a, b) => (b.l == null ? -1 : b.l) - (a.l == null ? -1 : a.l) || a.id.localeCompare(b.id));
    o.max = o.pain.reduce((m, p) => p.l != null && (m == null || p.l > m) ? p.l : m, null);
  }
  return o;
}
const plLvCls = l => l == null ? '' : l >= 7 ? 'hi' : l >= 4 ? 'md' : l >= 1 ? 'lo' : '';
function plDot(o) { return o.max == null ? (o.pain.length ? 'lo' : '') : plLvCls(o.max); }
function plCellLabel(o) {
  return dayShort(o.d) + ': ' + (o.sets ? 'sesi ' + o.sets + ' set' + (o.dl ? ', deload' : '') : 'tanpa sesi') +
    (o.pain.length ? ', ' + (o.max != null ? 'nyeri tertinggi ' + o.max + ' dari 10' : 'catatan nyeri tanpa angka') : ', tanpa catatan nyeri');
}
function plGridHTML(t) {
  const from = addDays(t, -(B16_PUL_DAYS - 1)); let h = '';
  for (let i = 0; i < B16_PUL_DAYS; i++) {
    const d = addDays(from, i), o = plDayInfo(d), dot = plDot(o);
    h += '<button class="plc' + (o.sets ? ' ses' : '') + (d === t ? ' td' : '') + '" data-q="plDay" data-d="' + d + '" aria-pressed="' + (plSel === d) + '" aria-label="' + esc(plCellLabel(o)) + '">' +
      '<span class="pln">' + pd(d).getDate() + '</span>' + (dot ? '<i class="pld ' + dot + '" aria-hidden="true"></i>' : '') + '</button>';
  }
  return h;
}
function plDetailHTML(d) {
  if (!d) return '<p class="plhint">Ketuk satu hari untuk melihat sesi dan catatan nyeri.</p>';
  const o = plDayInfo(d);
  const ses = o.sets ? o.sets + ' set selesai' + (o.dl ? ' · deload' : '') + (o.rpe != null ? ' · RPE ' + fmt(o.rpe, 1) : '') : 'Tidak ada sesi tercatat';
  const pn = o.pain.map(p => '<li><b>' + esc(b16Name(p.id)) + '</b><span>' + (p.l == null ? 'catatan' : p.l + '/10') + '</span>' + (p.n ? '<small>“' + esc(p.n) + '”</small>' : '') + '</li>').join('');
  return '<div class="pldh"><b>' + esc(dayShort(d)) + '</b><small>' + esc(ses) + '</small></div>' + (pn ? '<ul class="plpl">' + pn + '</ul>' : '<p class="plhint">Tidak ada catatan nyeri.</p>');
}
// pesan deload: judul dan isi diambil dari b16DeloadHTML (satu sumber teks); bentuk lain jatuh ke HTML aslinya
function plDlMsg(r) {
  const html = b16DeloadHTML(r), m = /<b>([^<]*)<\/b><small>([^<]*)<\/small>/.exec(html);
  return m ? { title: m[1], text: m[2], alert: /class="plan alert"/.test(html), raw: '' } : { title: 'Saran deload', text: '', alert: false, raw: html };
}
const plTile = (v, lab) => '<div><b>' + v + '</b><span>' + lab + '</span></div>';
function plDlBody(r, msg) {
  const tiles = '<div class="pltl">' + plTile(r.n28, 'sesi dalam 28 hari') + plTile(r.ref ? r.since + '<small> hari</small>' : '–', r.refKind === 'deload' ? 'sejak deload terakhir' : 'sejak sesi pertama') +
    plTile(r.elig ? r.stag + '<small>/' + r.elig + '</small>' : '–', 'gerakan stagnan') + plTile(r.rpe.n >= 3 ? fmt(r.rpe.avg, 1) : '–', 'RPE rata-rata 14 hari') + '</div>';
  const note = msg.raw || '<p class="plmsg' + (msg.alert ? ' alert' : '') + '"><b>' + msg.title + '</b>' + (msg.text ? '<span>' + msg.text + '</span>' : '') + '</p>';
  return tiles + note + '<button class="btn plgo" data-q="b16Tab" data-v="ses">Mode deload ada di tab Sesi</button>';
}
function plPainRow(r) {
  const bits = [r.lastL == null ? 'Hanya catatan teks' : 'Terakhir ' + r.lastL + '/10 (' + dayShort(r.lastLD) + ')', r.hi + ' sesi dengan nyeri ≥ ' + B16_PAIN_MIN];
  const cls = plLvCls(r.max);
  return '<div class="plr"><div class="plrt"><b>' + esc(b16Name(r.id)) + '</b>' + (r.rep ? '<span class="pltag">berulang</span>' : '') + '<span class="plrv">' + (r.max == null ? '–' : r.max + '/10') + '</span></div>' +
    (r.max == null ? '' : '<div class="plbar" role="img" aria-label="' + esc('Nyeri tertinggi ' + r.max + ' dari 10') + '"><i class="' + cls + '" style="--w:' + (r.max * 10) + '%"></i></div>') +
    '<small>' + esc(bits.join(' · ')) + '</small>' + (r.lastN ? '<small>“' + esc(r.lastN) + '”</small>' : '') + '</div>';
}
function plPainBody(rows) {
  if (!rows.length) return '<p class="plhint">Belum ada catatan nyeri dalam 28 hari terakhir. Catat lewat tombol “Catat nyeri” di bawah tiap gerakan pada tab Sesi.</p>';
  return rows.map(plPainRow).join('') + '<p class="plhint plnt">“Berulang” = nyeri ' + B16_PAIN_MIN + ' atau lebih pada minimal 2 sesi. Nyeri tajam, bengkak, mati rasa, atau tidak membaik: temui tenaga kesehatan. Bukan diagnosis.</p>';
}
function plAltBody(alt, rows) {
  if (!rows.some(r => r.hi >= 1)) return '<p class="plhint">Tidak ada gerakan dengan nyeri ' + B16_PAIN_MIN + ' atau lebih dalam 28 hari terakhir, jadi belum ada alternatif yang perlu ditampilkan.</p>';
  const items = alt.pats.map(a => '<div class="plr"><div class="plrt"><b>' + esc(a.nama) + '</b><span class="plrv">Level ' + a.lv + '</span></div>' +
    '<small>' + esc('Gerakan bernyeri: ' + a.ids.map(b16Name).join(', ') + '. Level sekarang: ' + a.cur + '.') + '</small>' +
    (a.lighter.length ? '<small>Lebih ringan:</small><div class="plchs">' + a.lighter.map(x => '<span class="plch">' + esc(x.n) + '<em>level ' + x.lv + '</em></span>').join('') + '</div>'
      : '<small>Sudah di level terendah. Kurangi jumlah set atau rentang gerak, atau lewati gerakan ini sampai nyeri reda.</small>') + '</div>');
  if (alt.none.length) items.push('<div class="plr"><div class="plrt"><b>Tanpa tangga progresi</b></div><small>' + esc(alt.none.map(b16Name).join(', ')) + ': kurangi beban atau rentang gerak, atau lewati dulu sampai nyeri reda.</small></div>');
  return items.join('') + '<p class="plhint plnt">Level tidak diubah otomatis. Mau turun level? Ubah sendiri di Tangga progresi pada tab Sesi.</p><button class="btn plgo" data-q="b16Tab" data-v="ses">Buka tab Sesi</button>';
}
function plCardHTML(id, title, sum, body) {
  const open = !!plSec[id];
  return '<div class="kzx plx' + (open ? ' open' : '') + '" data-sid="' + id + '">' +
    '<button class="kzxh plxh" data-q="plSec" data-sid="' + id + '" aria-expanded="' + open + '" aria-controls="plb_' + id + '">' +
    '<span class="kzxt"><b>' + esc(title) + '</b><small>' + esc(sum) + '</small></span>' + kzChev + '</button>' +
    '<div class="kzxb" id="plb_' + id + '"><div class="kzxi"><div class="plb">' + body + '</div></div></div></div>';
}
function plBuild() {
  const t = today(), rows = b16PainRows(t), dl = b16Deload(t), alt = b16Alt(rows), msg = plDlMsg(dl);
  const hi = rows.filter(r => r.hi >= 1).length, rep = rows.filter(r => r.rep).length;
  const dlChip = '<span class="kzg' + (dl.state === 'ok' ? ' ok' : dl.state === 'few' ? '' : ' warn') + '">' + esc(msg.title) + '</span>';
  const pnChip = hi ? '<span class="kzg warn">' + hi + ' gerakan nyeri ≥ ' + B16_PAIN_MIN + '</span>' : '<span class="kzg ok">Tidak ada nyeri ≥ ' + B16_PAIN_MIN + '</span>';
  const repChip = rep ? '<span class="kzg bad">' + rep + ' berulang</span>' : '';
  const hero = '<section class="plh" aria-label="Ringkasan pulih"><h2 class="kzt">Pulih</h2><p>' + dl.n28 + ' sesi dalam ' + B16_PUL_DAYS + ' hari terakhir</p>' +
    '<div class="kzgs">' + dlChip + pnChip + repChip + '</div>' +
    '<div class="plgrid" id="plGrid" role="group" aria-label="Kalender ' + B16_PUL_DAYS + ' hari terakhir">' + plGridHTML(t) + '</div>' +
    '<p class="plleg">Latar teal = ada sesi. Titik = nyeri tertinggi: abu 1–3, kuning 4–6, merah 7+.</p>' +
    '<div class="plday" id="plDay" aria-live="polite">' + plDetailHTML(plSel) + '</div></section>';
  const sumPn = rows.length ? rows.length + ' gerakan' + (rep ? ' · ' + rep + ' berulang' : '') : 'Belum ada catatan';
  const nAlt = alt.pats.length + (alt.none.length ? 1 : 0), sumAl = rows.some(r => r.hi >= 1) ? nAlt + ' pola' : 'Belum perlu';
  return hero +
    '<div class="plcards">' + plCardHTML('dl', 'Saran deload', msg.title, plDlBody(dl, msg)) +
    plCardHTML('pn', 'Nyeri ' + B16_PUL_DAYS + ' hari terakhir', sumPn, plPainBody(rows)) +
    plCardHTML('al', 'Alternatif dari tangga progresi', sumAl, plAltBody(alt, rows)) + '</div>' +
    '<p class="plfn">Bagian ini hanya membaca catatanmu di perangkat ini. Tidak ada yang diubah otomatis: tangga progresi dan jumlah set tetap sampai kamu sendiri mengubahnya.</p>';
}
function plHTML() {
  try { plErr = ''; return plBuild(); }
  catch (e) { plErr = String(e && e.message || e); return b16PulHTML(); }   // jaring pengaman: tampilan lama
}
QACT.plSec = el => {
  const card = el.closest('.plx'); if (!card) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  plSec[card.dataset.sid] = open; el.setAttribute('aria-expanded', open); card.classList.toggle('open', open);
};
QACT.plDay = el => {
  const d = el.dataset.d; if (!DATE_RE.test(d)) return;
  plSel = plSel === d ? '' : d;
  Array.prototype.forEach.call(document.querySelectorAll('#v-train .plc'), c => c.setAttribute('aria-pressed', String(c.dataset.d === plSel)));
  const p = document.getElementById('plDay'); if (p) p.innerHTML = plDetailHTML(plSel);
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b25l1: Object.freeze({ sec: () => Object.assign({}, plSec), sel: () => plSel, err: () => plErr, fresh: plFresh, html: plHTML }) }));

/* ===== MODUL: LATIHAN > KALISTENIK > PUSTAKA: tampilan baru (tahap 18, m1) ===== */
// HANYA tampilan. Data (B18_MV, B18_SPLITS, pdb.ladder, pdb.split) dan perilaku tab lain TETAP. Tidak ada kunci penyimpanan baru, tidak ada jaringan kecuali
// gambar yang diketuk (sama dengan sebelumnya). Keadaan (pencarian, saringan, gerakan terbuka, kartu terbuka) hanya di memori dan direset tiap tab Pustaka dimasuki
// dan tiap Kalistenik BARU dibuka (pmFresh). Pencarian dan saringan hanya mengganti isi #pmList (bukan seluruh halaman) supaya kotak cari tidak kehilangan fokus.
// Bila penggambaran gagal, pmHTML() jatuh kembali ke b19Pus() (tampilan lama) supaya halaman Latihan tidak pernah kosong.
let pmQ = '', pmPat = '', pmLv = false, pmOpen = '', pmGrp = {}, pmSec = {}, pmErr = '';
const PM_PATS = ['push', 'pull', 'legs', 'core'];
const PM_FIL = [['', 'Semua'], ['push', 'Push'], ['pull', 'Pull'], ['legs', 'Legs'], ['core', 'Core']];
function pmFresh() { pmQ = ''; pmPat = ''; pmLv = false; pmOpen = ''; pmGrp = {}; pmSec = {}; pdFresh(); }
const pmCur = m => !!(m.L && pdb.ladder && pdb.ladder[m.L[0]] === m.L[1]);
const pmWords = () => b18Norm(pmQ).trim().split(' ').filter(Boolean);
const pmFiltering = () => !!(pmWords().length || pmPat || pmLv);
const pmHay = {};
function pmHayOf(m) {
  return pmHay[m.id] || (pmHay[m.id] = b18Norm([m.n].concat(m.al, [B18_POLA[m.p]], m.a.map(k => B18_MUS[k]), m.b.map(k => B18_MUS[k])).join(' ')));
}
function pmMatch(m) {
  if (pmPat && m.p !== pmPat) return false;
  if (pmLv && !pmCur(m)) return false;
  const w = pmWords(); if (!w.length) return true;
  const h = pmHayOf(m);
  return w.every(x => h.indexOf(x) >= 0);
}
const pmMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; } catch (e) { return 'auto'; } };
const pmLvOf = m => m.L ? m.L[1] : 9;

/* --- isi tiap gerakan --- */
function pmDetail(m) {
  const lv = pdb.ladder ? (pdb.ladder[m.L ? m.L[0] : 'push'] || 0) : 0;
  const tags = (arr, on) => arr.length ? arr.map(k => '<button class="pmtag' + (on ? ' on' : '') + '" data-q="pmMus" data-k="' + k + '">' + esc(B18_MUS[k]) + '</button>').join('') : '<span class="pmnone">–</span>';
  const prog = m.L
    ? '<p class="pmprog"><b>' + esc(LADDER[m.L[0]].nama) + ' · level ' + m.L[1] + '</b>' + (pmCur(m) ? '<span class="pmnow">Levelmu sekarang</span>' : lv ? '<span>Kamu di level ' + lv + '</span>' : '') + '</p>'
    : '<p class="pmprog"><b>' + esc(B18_POLA[m.p]) + '</b><span>Variasi di luar tangga progresi</span></p>';
  const dn = m.L ? B18_MV.filter(x => x.L && x.L[0] === m.L[0] && x.L[1] === m.L[1] - 1) : [], up = m.L ? B18_MV.filter(x => x.L && x.L[0] === m.L[0] && x.L[1] === m.L[1] + 1) : [];
  const nb = (t, a) => a.length ? '<div class="pmlab">' + t + '</div><div class="pmchs">' + a.map(x => '<button class="pmnb" data-q="pmGo" data-id="' + x.id + '">' + esc(x.n) + '</button>').join('') + '</div>' : '';
  return prog + nb('Lebih ringan', dn) + nb('Lebih berat', up) +
    '<div class="pmlab">Otot utama</div><div class="pmchs">' + tags(m.a, true) + '</div>' +
    '<div class="pmlab">Otot pendukung</div><div class="pmchs">' + tags(m.b, false) + '</div>' +
    '<p class="pmhint">Ketuk nama otot untuk melihat gerakan lain yang melatihnya.</p>' +
    '<p class="pmtip">' + esc(m.t) + '</p>' +
    '<div class="pmact"><button class="btn sm" data-q="pmImg" data-id="' + m.id + '">Tampilkan gambar</button>' +
    ytAtBtn('p:' + m.id, b18Base(m), 'm|p:' + m.id, 'btn sm') + '<a class="btn sm" href="' + esc(b18Ytq(m)) + '" target="_blank" rel="noopener noreferrer">Buka di YouTube</a>' +
    (b18CanAsk() ? '<button class="btn sm" data-q="pmAsk" data-id="' + m.id + '">✦ Tanya pelatih</button>' : '') + '</div>' +
    ytMountBlock('p:' + m.id, b18Base(m), 'm|p:' + m.id) +
    '<div class="pmimgs" aria-live="polite"></div>';
}
function pmRowHTML(m) {
  const cur = pmCur(m), open = pmOpen === m.id;
  const badge = m.L ? '<span class="pmbd' + (cur ? ' now' : '') + '" aria-hidden="true">' + m.L[1] + '</span>' : '<span class="pmbd" aria-hidden="true">+</span>';
  const sr = m.L ? 'Level ' + m.L[1] + (cur ? ', levelmu sekarang' : '') : 'Variasi di luar tangga';
  return '<div class="pmr' + (open ? ' open' : '') + (cur ? ' cur' : '') + '" data-id="' + m.id + '">' +
    '<button class="pmrh" data-q="pmRow" data-id="' + m.id + '" aria-expanded="' + open + '" aria-controls="pmb_' + m.id + '">' + badge +
    '<span class="pmrt"><b>' + esc(m.n) + '</b><small>' + esc(m.a.map(k => B18_MUS[k]).join(', ')) + '</small></span>' +
    (cur ? '<span class="pmcurt" aria-hidden="true">Levelmu</span>' : '') + '<span class="pmsr">' + esc(sr) + '</span>' + kzChev + '</button>' +
    '<div class="kzxb" id="pmb_' + m.id + '"><div class="kzxi"><div class="pmb">' + pmDetail(m) + '</div></div></div></div>';
}
function pmGroupHTML(p, rows, filtering) {
  const open = pmGrp[p] !== undefined ? !!pmGrp[p] : filtering;
  const cur = rows.filter(pmCur);
  const sum = filtering ? rows.length + ' cocok' : rows.length + ' gerakan' + (cur.length ? ' · levelmu: ' + cur[0].n + (cur.length > 1 ? ' +' + (cur.length - 1) : '') : '');
  return '<div class="pmg' + (open ? ' open' : '') + '" data-p="' + p + '">' +
    '<button class="pmgh" data-q="pmGrp" data-p="' + p + '" aria-expanded="' + open + '" aria-controls="pmg_' + p + '"><span class="pmgn" aria-hidden="true">' + rows.length + '</span>' +
    '<span class="pmgt"><b>' + esc(B18_POLA[p]) + '</b><small>' + esc(sum) + '</small></span>' + kzChev + '</button>' +
    '<div class="kzxb" id="pmg_' + p + '"><div class="kzxi"><div class="pmgb">' + rows.map(pmRowHTML).join('') + '</div></div></div></div>';
}
function pmListHTML() {
  const filtering = pmFiltering();
  const h = PM_PATS.map(p => {
    const rows = B18_MV.map((m, i) => ({ m, i })).filter(x => x.m.p === p && pmMatch(x.m)).sort((a, b) => (pmLvOf(a.m) - pmLvOf(b.m)) || (a.i - b.i)).map(x => x.m);
    return rows.length ? pmGroupHTML(p, rows, filtering) : '';
  }).join('');
  return h || '<div class="pmempty"><b>Tidak ada gerakan yang cocok</b><p>Coba kata lain, atau hapus saringan.</p><button class="btn sm" data-q="pmReset">Hapus saringan</button></div>';
}
const pmCountText = () => { const n = B18_MV.filter(pmMatch).length, t = B18_MV.length; return pmFiltering() ? n + ' dari ' + t + ' gerakan' : t + ' gerakan'; };
function pmCardHTML(id, title, sum, body) {
  const open = !!pmSec[id];
  return '<div class="kzx pmx pmxs' + (open ? ' open' : '') + '" data-sid="' + id + '">' +
    '<button class="kzxh pmxh" data-q="pmSec" data-sid="' + id + '" aria-expanded="' + open + '" aria-controls="pmc_' + id + '"><span class="kzxt"><b>' + esc(title) + '</b><small>' + esc(sum) + '</small></span>' + kzChev + '</button>' +
    '<div class="kzxb" id="pmc_' + id + '"><div class="kzxi">' + body + '</div></div></div>';
}
function pmBuild() {
  if (pdb.split && b19Days(pdb.split)) b18Split = pdb.split;
  const sp = B18_SPLITS.find(x => x.id === b18Split) || B18_SPLITS[0], inst = !!(pdb.split && b19Days(pdb.split));
  const hero = '<section class="pmh" id="pmHero" aria-label="Pustaka gerakan"><h2 class="kzt">Pustaka</h2>' +
    '<p>Cari gerakan, lihat otot yang bekerja, petunjuk bentuk, gambar, dan video.</p>' +
    '<div class="pmsearch"><svg class="pmsi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
    '<input id="pmQ" class="pmq" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40" placeholder="Cari gerakan atau otot" aria-label="Cari gerakan atau otot" value="' + esc(pmQ) + '">' +
    '<button id="pmClr" class="pmclr" data-q="pmClear" aria-label="Hapus pencarian"' + (pmQ ? '' : ' hidden') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="pmfl" role="group" aria-label="Saring menurut pola">' + PM_FIL.map(f => '<button class="pill pmfp" data-q="pmPat" data-v="' + f[0] + '" aria-pressed="' + (f[0] === pmPat) + '">' + f[1] + '</button>').join('') + '</div>' +
    '<div class="pmrow2"><p class="pmcnt" id="pmCnt" aria-live="polite">' + pmCountText() + '</p>' +
    '<button id="pmLv" class="pmlvb" data-q="pmLv" aria-pressed="' + pmLv + '"><i class="b18dot" aria-hidden="true"></i>Levelku</button></div>' +
    '<p class="pmleg">Angka = level di tangga progresi. Teal = levelmu sekarang. + = variasi di luar tangga.</p></section>';
  const jb = '<div class="pmjb"><div class="seg tri b18seg" role="group" aria-label="Jenis latihan">' +
    B18_SPLITS.map(s => '<button class="pill" data-q="b18Split" data-v="' + s.id + '" aria-pressed="' + (s.id === sp.id) + '">' + esc(s.n) + '</button>').join('') + '</div>' +
    '<p class="note">' + esc(sp.ket) + '</p>' + b19PusNote() +
    '<p class="note"><i class="b18dot" aria-hidden="true"></i> Titik = gerakan di levelmu sekarang pada Tangga progresi. Ketuk gerakan untuk melihat otot, petunjuk, gambar, dan video.</p>' +
    sp.days.map(b18DayHTML).join('') + '</div>';
  return hero + '<div id="pmList" class="pmlist">' + pmListHTML() + '</div>' +
    pdCardHTML() + pmCardHTML('jt', 'Jenis latihan', sp.n + (inst ? ' · terpasang di Sesi' : ' · belum dipasang'), jb) +
    '<div id="b18AiRow" class="aibtn"' + (b18CanAsk() ? '' : ' hidden') + '><button class="btn sm b18go" data-q="b18AskSplit">✦ Tanya pelatih tentang ' + esc(sp.n) + '</button></div>' +
    '<p class="pmfn">Isi pustaka ditulis dari pengetahuan umum kebugaran dan belum ditinjau pelatih; otot yang ditampilkan adalah perkiraan umum, bukan pengukuran. Gambar dan video hanya dibuka bila kamu mengetuknya. Bukan diagnosis: nyeri tajam, bengkak, atau mati rasa, hentikan dan temui tenaga kesehatan.</p>';
}
function pmHTML() {
  try { pmErr = ''; return pmBuild(); }
  catch (e) { pmErr = String(e && e.message || e); return b19Pus(); }   // jaring pengaman: tampilan lama
}

/* --- interaksi (mengubah DOM langsung, tanpa render ulang halaman) --- */
function pmRefresh() {
  const L = document.getElementById('pmList'); if (!L) return;
  L.innerHTML = pmListHTML();
  const inp = document.getElementById('pmQ'); if (inp && inp.value !== pmQ) inp.value = pmQ;
  const c = document.getElementById('pmClr'); if (c) c.hidden = !pmQ;
  const n = document.getElementById('pmCnt'); if (n) n.textContent = pmCountText();
  Array.prototype.forEach.call(document.querySelectorAll('#v-train .pmfp'), b => b.setAttribute('aria-pressed', String((b.dataset.v || '') === pmPat)));
  const lv = document.getElementById('pmLv'); if (lv) lv.setAttribute('aria-pressed', String(pmLv));
}
function pmSetOpen(id) {
  pmOpen = id;
  Array.prototype.forEach.call(document.querySelectorAll('#v-train .pmr'), r => {
    const on = r.dataset.id === id; r.classList.toggle('open', on);
    const h = r.querySelector('.pmrh'); if (h) h.setAttribute('aria-expanded', String(on));
  });
}
function pmShow(id, block) {
  setTimeout(() => {
    const r = document.querySelector('#v-train .pmr[data-id="' + id + '"] .pmrh');
    if (r && r.scrollIntoView) r.scrollIntoView({ block, behavior: pmMotion() });
  }, 320);
}
QACT.pmRow = el => { const row = el.closest('.pmr'); if (!row) return; const id = row.dataset.id, on = pmOpen !== id; pmSetOpen(on ? id : ''); if (on) pmShow(id, 'nearest'); };
QACT.pmGrp = el => {
  const g = el.closest('.pmg'); if (!g) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  pmGrp[g.dataset.p] = open; el.setAttribute('aria-expanded', String(open)); g.classList.toggle('open', open);
};
QACT.pmSec = el => {
  const card = el.closest('.pmx'); if (!card) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  pmSec[card.dataset.sid] = open; el.setAttribute('aria-expanded', String(open)); card.classList.toggle('open', open);
};
QACT.pmPat = el => { const v = el.dataset.v || ''; if (v && PM_PATS.indexOf(v) < 0) return; pmPat = (v && v === pmPat) ? '' : v; pmOpen = ''; pmGrp = {}; pmRefresh(); };
QACT.pmLv = () => { pmLv = !pmLv; pmOpen = ''; pmGrp = {}; pmRefresh(); };
QACT.pmClear = () => { pmQ = ''; pmOpen = ''; pmGrp = {}; pmRefresh(); const i = document.getElementById('pmQ'); if (i) i.focus(); };
QACT.pmReset = () => { pmQ = ''; pmPat = ''; pmLv = false; pmOpen = ''; pmGrp = {}; pmRefresh(); };
QACT.pmMus = el => {
  const k = el.dataset.k; if (!B18_MUS[k]) return;
  pmQ = B18_MUS[k]; pmPat = ''; pmLv = false; pmOpen = ''; pmGrp = {}; pmRefresh();
  const h = document.getElementById('pmHero'); if (h && h.scrollIntoView) h.scrollIntoView({ block: 'start', behavior: pmMotion() });
};
QACT.pmGo = el => {
  const id = el.dataset.id, m = b18Mv(id); if (!m) return;
  const was = pmFiltering();
  if (was) { pmQ = ''; pmPat = ''; pmLv = false; pmGrp = {}; }
  pmGrp[m.p] = true; pmOpen = id;
  if (was) pmRefresh();
  else {
    const g = document.querySelector('#v-train .pmg[data-p="' + m.p + '"]');
    if (g) { g.classList.add('open'); const h = g.querySelector('.pmgh'); if (h) h.setAttribute('aria-expanded', 'true'); }
    pmSetOpen(id);
  }
  pmShow(id, 'center');
};
function pmLoadImg(id, box) {
  const m = b18Mv(id); if (!m || !box) return;
  const live = () => document.body.contains(box);
  const say = t => { if (live()) { box.textContent = ''; const p = document.createElement('p'); p.className = 'note'; p.textContent = t; box.appendChild(p); } };
  if (!m.im.length) { say('Gambar belum tersedia untuk gerakan ini. Coba tombol Cari video.'); return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { say('Sedang offline, gambar tidak bisa dimuat.'); return; }
  say('Memuat gambar…');
  let i = 0;
  const next = () => {
    if (!live()) return;
    if (i >= m.im.length) { say('Gambar tidak bisa dimuat (tidak tersedia untuk gerakan ini, atau koneksi bermasalah). Coba tombol Cari video.'); return; }
    const gid = m.im[i++], a = new Image();
    a.referrerPolicy = 'no-referrer'; a.className = 'b18img'; a.alt = 'Peragaan ' + m.n + ' (gambar 1)';
    a.onload = () => {
      if (!live()) return;
      box.textContent = ''; box.appendChild(a);
      const c = document.createElement('p'); c.className = 'note'; c.textContent = 'Gambar: free-exercise-db (domain publik), "' + gid.replace(/_/g, ' ') + '". Periksa apakah sesuai dengan gerakanmu.'; box.appendChild(c);
      const b = new Image(); b.referrerPolicy = 'no-referrer'; b.className = 'b18img'; b.alt = 'Peragaan ' + m.n + ' (gambar 2)';
      b.onload = () => { if (live()) box.insertBefore(b, c); };
      b.onerror = () => { /* gambar kedua opsional */ };
      b.src = B18_IMG + gid + '/1.jpg';
    };
    a.onerror = next;
    a.src = B18_IMG + gid + '/0.jpg';
  };
  next();
}
QACT.pmImg = el => { const row = el.closest('.pmr'), box = row && row.querySelector('.pmimgs'); if (box) pmLoadImg(el.dataset.id, box); };
QACT.pmAsk = el => { const m = b18Mv(el.dataset.id); if (m) b18Ask('Jelaskan teknik ' + m.n + ' yang benar, kesalahan umum, dan cara membuatnya lebih mudah atau lebih sulit.'); };
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || el.id !== 'pmQ') return;
  pmQ = el.value; pmOpen = ''; pmGrp = {}; pmRefresh();
});
document.addEventListener('keydown', ev => {
  const el = ev.target; if (ev.key === 'Enter' && el && el.id === 'pmQ') { ev.preventDefault(); el.blur(); }
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b27m1: Object.freeze({
  st: () => ({ q: pmQ, pat: pmPat, lv: pmLv, open: pmOpen, grp: Object.assign({}, pmGrp), sec: Object.assign({}, pmSec) }),
  err: () => pmErr, fresh: pmFresh, html: pmHTML, ids: () => B18_MV.filter(pmMatch).map(m => m.id)
}) }));

/* ===== MODUL: LATIHAN > KALISTENIK > PUSTAKA: database lengkap free-exercise-db (tahap 28, n1) ===== */
// Sumber: free-exercise-db (yuhonas; Unlicense = domain publik); asal data: exercises.json oleh Ollie Jennings. Petunjuk gerakan berbahasa Inggris (dari sumbernya).
// Jaringan HANYA saat pengguna mengetuk "Muat database lengkap" (satu berkas JSON, sekitar 1 MB) dan saat mengetuk "Tampilkan gambar". Hasil unduhan disimpan di
// Cache Storage ('dl-fedb-v1', BUKAN localStorage) supaya dibuka lagi tanpa internet. Tidak menulis ke tdb/pdb/db/wdb/edb; tidak ada kunci penyimpanan baru.
// Data B18_MV (31 gerakan + tangga progresi) dan kartu lain di Pustaka TIDAK diubah. Semua teks dari luar dilewatkan esc() dan divalidasi (id, jalur gambar).
// Home/Gym diturunkan dari kolom "equipment": tanpa alat (body only/kosong) = Home tanpa alat; barbell/cable/machine/e-z curl bar = Gym; lainnya = Home alat ringan.
const PD_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const PD_CACHE = 'dl-fedb-v1', PD_PAGE = 30;
const PD_MUS = { abdominals: 'Perut', abductors: 'Paha luar', adductors: 'Paha dalam', biceps: 'Bisep', calves: 'Betis', chest: 'Dada', forearms: 'Lengan bawah', glutes: 'Bokong', hamstrings: 'Paha belakang', lats: 'Punggung lebar', 'lower back': 'Punggung bawah', 'middle back': 'Punggung tengah', neck: 'Leher', quadriceps: 'Paha depan', shoulders: 'Bahu', traps: 'Trapezius', triceps: 'Trisep' };
const PD_EQ = { 'body only': 'Tanpa alat', dumbbell: 'Dumbbell', barbell: 'Barbel', cable: 'Kabel', machine: 'Mesin', bands: 'Resistance band', kettlebells: 'Kettlebell', 'foam roll': 'Foam roller', 'exercise ball': 'Bola latihan', 'medicine ball': 'Medicine ball', 'e-z curl bar': 'EZ bar', other: 'Alat lain' };
const PD_CAT = { strength: 'Kekuatan', stretching: 'Peregangan', cardio: 'Kardio', plyometrics: 'Plyometrik', powerlifting: 'Powerlifting', 'olympic weightlifting': 'Angkat besi olimpiade', strongman: 'Strongman' };
const PD_LV = { beginner: 'Pemula', intermediate: 'Menengah', expert: 'Mahir' };
const PD_ENV = [['', 'Semua'], ['tanpa', 'Tanpa alat'], ['ringan', 'Alat ringan'], ['gym', 'Gym']];
const PD_ENVS = { tanpa: 'Tanpa alat', ringan: 'Alat ringan', gym: 'Gym' };
const PD_ID_RE = /^[0-9A-Za-z_-]+$/, PD_IMG_RE = /^[0-9A-Za-z_-]+\/\d+\.(?:jpg|jpeg|png|webp)$/i;
let pdData = [], pdById = {}, pdSt = 'idle', pdMsg = '', pdQ = '', pdEnvSel = '', pdMusSel = '', pdCatSel = '', pdLvSel = '', pdOpen = '', pdLim = PD_PAGE, pdTok = 0, pdErr = '';
const pdEnvOf = eq => (!eq || eq === 'body only') ? 'tanpa' : /^(barbell|cable|machine|e-z curl bar)$/.test(eq) ? 'gym' : 'ringan';
function pdFresh() { pdQ = ''; pdEnvSel = ''; pdMusSel = ''; pdCatSel = ''; pdLvSel = ''; pdOpen = ''; pdLim = PD_PAGE; if (pdSt === 'error') { pdSt = 'idle'; pdMsg = ''; } }
const pdFiltering = () => !!(b18Norm(pdQ).trim() || pdEnvSel || pdMusSel || pdCatSel || pdLvSel);
function pdNorm(raw) {
  const out = []; if (!Array.isArray(raw)) return out;
  const arr = a => Array.isArray(a) ? a.filter(x => typeof x === 'string') : [];
  raw.forEach(r => {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !PD_ID_RE.test(r.id) || typeof r.name !== 'string' || !r.name.trim()) return;
    const s = v => typeof v === 'string' ? v : '', eq = s(r.equipment);
    const e = { id: r.id, n: r.name.trim().slice(0, 120), f: s(r.force), lv: s(r.level), me: s(r.mechanic), eq: eq, env: pdEnvOf(eq), cat: s(r.category),
      pm: arr(r.primaryMuscles), sm: arr(r.secondaryMuscles), ins: arr(r.instructions).map(x => x.slice(0, 700)), img: arr(r.images).filter(p => PD_IMG_RE.test(p)).slice(0, 4) };
    e.nn = b18Norm(e.n);
    e.h = b18Norm([e.n, eq, PD_EQ[eq] || '', e.cat, PD_CAT[e.cat] || '', PD_LV[e.lv] || ''].concat(e.pm, e.sm, e.pm.map(k => PD_MUS[k] || ''), e.sm.map(k => PD_MUS[k] || '')).join(' '));
    out.push(e);
  });
  return out;
}
async function pdCacheGet() {
  try { if (typeof caches === 'undefined') return null; const c = await caches.open(PD_CACHE), r = await c.match(PD_URL); return r ? await r.json() : null; } catch (e) { return null; }
}
async function pdCachePut(resp) { try { if (typeof caches === 'undefined') return; const c = await caches.open(PD_CACHE); await c.put(PD_URL, resp); } catch (e) { /* cache opsional */ } }
function pdApply(raw) {
  const d = pdNorm(raw); if (d.length < 20) throw new Error('Isi database tidak sesuai format.');
  d.sort((a, b) => a.n.localeCompare(b.n)); pdData = d; pdById = {}; d.forEach(e => { pdById[e.id] = e; }); pdSt = 'ready'; pdMsg = '';
}
const pdSum = () => pdSt === 'ready' ? pdData.length + ' gerakan · tersedia' : pdSt === 'loading' ? 'Memuat…' : 'Daftar lengkap · muat dari internet sekali';
function pdPaint() {
  const b = document.getElementById('pdBody'); if (b) b.innerHTML = pdBodyHTML();
  const s = document.querySelector('#v-train .pmx[data-sid="db"] .kzxt small'); if (s) s.textContent = pdSum();
}
async function pdLoad() {
  if (pdSt === 'loading' || pdSt === 'ready') return;
  const tok = ++pdTok; pdSt = 'loading'; pdMsg = ''; pdPaint();
  try {
    let raw = await pdCacheGet(), copy = null;
    if (!raw) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Sedang offline dan database belum pernah dimuat.');
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = ctl ? setTimeout(() => ctl.abort(), 30000) : 0;
      let resp; try { resp = await fetch(PD_URL, { referrerPolicy: 'no-referrer', signal: ctl ? ctl.signal : undefined }); } finally { if (to) clearTimeout(to); }
      if (!resp.ok) throw new Error('Server menjawab ' + resp.status + '.');
      copy = resp.clone(); raw = await resp.json();
    }
    if (tok !== pdTok) return;
    pdApply(raw); if (copy) pdCachePut(copy);
  } catch (e) {
    if (tok !== pdTok) return;
    pdSt = 'error'; pdMsg = (e && e.name === 'AbortError') ? 'Waktu habis. Periksa koneksi lalu coba lagi.' : (e && e.message ? e.message : 'Gagal memuat.') + ' Periksa koneksi lalu coba lagi.';
  }
  pdPaint();
}
async function pdAuto() {   // hanya membaca cache perangkat (tanpa jaringan)
  if (pdSt !== 'idle') return;
  const raw = await pdCacheGet(); if (!raw || pdSt !== 'idle') return;
  try { pdApply(raw); } catch (e) { return; }
  pdPaint();
}
/* --- penyaringan --- */
function pdFiltered() {
  const w = b18Norm(pdQ).trim().split(' ').filter(Boolean);
  const rows = pdData.filter(e => (!pdEnvSel || e.env === pdEnvSel) && (!pdCatSel || e.cat === pdCatSel) && (!pdLvSel || e.lv === pdLvSel) &&
    (!pdMusSel || e.pm.indexOf(pdMusSel) >= 0 || e.sm.indexOf(pdMusSel) >= 0) && w.every(x => e.h.indexOf(x) >= 0));
  const rank = e => (w.length && !w.every(x => e.nn.indexOf(x) >= 0) ? 2 : 0) + (pdMusSel && e.pm.indexOf(pdMusSel) < 0 ? 1 : 0);
  return rows.map(e => ({ e, r: rank(e) })).sort((a, b) => (a.r - b.r) || a.e.n.localeCompare(b.e.n)).map(x => x.e);
}
const pdCountText = n => pdFiltering() ? n + ' dari ' + pdData.length + ' gerakan' : pdData.length + ' gerakan';
function pdAlt(e) {
  if (!e.pm.length) return [];
  const want = e.env === 'gym' ? ['tanpa', 'ringan'] : ['gym'];
  const sc = c => (c.me && c.me === e.me ? 2 : 0) + (c.f && c.f === e.f ? 1 : 0) + c.pm.filter(k => e.pm.indexOf(k) >= 0).length + (c.lv === e.lv ? 1 : 0) + (e.env === 'gym' && c.env === 'tanpa' ? 1 : 0);
  return pdData.filter(c => c.id !== e.id && want.indexOf(c.env) >= 0 && c.cat === e.cat && c.pm[0] === e.pm[0] && (!e.f || !c.f || c.f === e.f))
    .map(c => ({ c, s: sc(c) })).sort((a, b) => (b.s - a.s) || a.c.n.localeCompare(b.c.n)).slice(0, 4).map(x => x.c);
}
/* --- tampilan --- */
const pdMusL = ks => ks.length ? ks.map(k => PD_MUS[k] || k).join(', ') : '–';
function pdDetailHTML(e) {
  const tags = (arr, on) => arr.length ? arr.map(k => '<button class="pmtag' + (on ? ' on' : '') + '" data-q="pdMus" data-k="' + esc(k) + '">' + esc(PD_MUS[k] || k) + '</button>').join('') : '<span class="pmnone">–</span>';
  const meta = [PD_LV[e.lv], PD_CAT[e.cat], e.eq ? (PD_EQ[e.eq] || e.eq) : 'Alat tidak dicatat'].filter(Boolean).join(' · ');
  const alt = pdAlt(e);
  const altH = alt.length ? '<div class="pmlab">' + (e.env === 'gym' ? 'Kalau latihan di home (otot sama)' : 'Kalau latihan di gym (otot sama)') + '</div><div class="pmchs">' +
    alt.map(c => '<button class="pmnb" data-q="pdGo" data-id="' + esc(c.id) + '">' + esc(c.n) + '</button>').join('') + '</div>' : '';
  return '<div class="pdb"><p class="pdmeta">' + esc(meta) + '</p>' +
    '<div class="pmlab">Otot utama</div><div class="pmchs">' + tags(e.pm, true) + '</div>' +
    '<div class="pmlab">Otot pendukung</div><div class="pmchs">' + tags(e.sm, false) + '</div>' +
    '<div class="pmlab">Cara melakukan (bahasa Inggris)</div>' +
    (e.ins.length ? '<ol class="pdins">' + e.ins.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' : '<p class="pdmeta">Petunjuk belum tersedia untuk gerakan ini.</p>') +
    altH +
    '<div class="pmact"><button class="btn sm" data-q="pdImg" data-id="' + esc(e.id) + '">Tampilkan gambar</button>' +
    ytAtBtn(ytKeyD(e.id), e.n + ' exercise', 'd|' + ytKeyD(e.id), 'btn sm') + '<a class="btn sm" href="' + esc(B18_YT + encodeURIComponent(e.n + ' exercise tutorial')) + '" target="_blank" rel="noopener noreferrer">Buka di YouTube</a>' +
    (b18CanAsk() ? '<button class="btn sm" data-q="pdAsk" data-id="' + esc(e.id) + '">✦ Tanya pelatih</button>' : '') + '</div>' +
    ytMountBlock(ytKeyD(e.id), e.n + ' exercise', 'd|' + ytKeyD(e.id)) +
    '<div class="pmimgs" aria-live="polite"></div></div>';
}
function pdRowHTML(e) {
  const open = pdOpen === e.id;
  return '<div class="pdr' + (open ? ' open' : '') + '" data-id="' + esc(e.id) + '"><button class="pdrh" data-q="pdRow" data-id="' + esc(e.id) + '" aria-expanded="' + open + '">' +
    '<span class="pdrt"><b>' + esc(e.n) + '</b><small>' + esc(pdMusL(e.pm)) + ' · ' + esc(e.eq ? (PD_EQ[e.eq] || e.eq) : 'Alat tidak dicatat') + '</small></span>' +
    '<span class="pdev ' + e.env + '">' + PD_ENVS[e.env] + '</span>' + kzChev + '</button>' + (open ? pdDetailHTML(e) : '') + '</div>';
}
function pdListHTML() {
  const rows = pdFiltered(); pdLastN = rows.length;
  const oi = pdOpen ? rows.findIndex(e => e.id === pdOpen) : -1;
  if (pdOpen && oi < 0) pdOpen = '';
  if (oi >= pdLim) pdLim = Math.ceil((oi + 1) / PD_PAGE) * PD_PAGE;
  if (!rows.length) return '<div class="pmempty"><b>Tidak ada gerakan yang cocok</b><p>Coba kata lain (bahasa Inggris atau Indonesia), atau hapus saringan.</p><button class="btn sm" data-q="pdReset">Hapus saringan</button></div>';
  const show = rows.slice(0, pdLim), rest = rows.length - show.length;
  return show.map(pdRowHTML).join('') + (rest > 0 ? '<button class="pdmore" data-q="pdMore">Tampilkan ' + Math.min(PD_PAGE, rest) + ' lagi (' + rest + ' tersisa)</button>' : '');
}
let pdLastN = 0;
function pdAttr() {
  return '<p class="pdattr">Data: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">free-exercise-db</a> oleh yuhonas dan kontributor (Unlicense, domain publik); data awal dari exercises.json oleh Ollie Jennings. Petunjuk berbahasa Inggris. Pembagian Home/Gym adalah perkiraan dari alat yang dicatat. Bukan pengganti pelatih; nyeri tajam, hentikan.</p>';
}
function pdOpts(map, cur, all) { return '<option value="">' + all + '</option>' + Object.keys(map).map(k => '<option value="' + esc(k) + '"' + (k === cur ? ' selected' : '') + '>' + esc(map[k]) + '</option>').join(''); }
function pdBodyHTML() {
  if (pdSt !== 'ready') {
    const ld = pdSt === 'loading';
    return '<div class="pdgate"><p>Daftar lengkap lebih dari 800 gerakan: otot yang dilatih, cara melakukan, gambar, dan mana yang cocok untuk home atau gym. Dimuat sekali dari internet (sekitar 1 MB), lalu disimpan di perangkat supaya bisa dibuka tanpa internet.</p>' +
      (pdMsg ? '<p class="pderr" role="alert">' + esc(pdMsg) + '</p>' : '') +
      '<button class="btn sm" data-q="pdLoad"' + (ld ? ' disabled' : '') + '>' + (ld ? 'Memuat…' : pdSt === 'error' ? 'Coba lagi' : 'Muat database lengkap') + '</button></div>' + pdAttr();
  }
  return '<div class="pmsearch" id="pdCtl"><svg class="pmsi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
    '<input id="pdQ" class="pmq" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40" placeholder="Cari gerakan atau otot" aria-label="Cari di database lengkap" value="' + esc(pdQ) + '">' +
    '<button id="pdClr" class="pmclr" data-q="pdClear" aria-label="Hapus pencarian"' + (pdQ ? '' : ' hidden') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="pdfl" role="group" aria-label="Saring menurut tempat latihan">' + PD_ENV.map(f => '<button class="pill pdfp" data-q="pdEnv" data-v="' + f[0] + '" aria-pressed="' + (f[0] === pdEnvSel) + '">' + f[1] + '</button>').join('') + '</div>' +
    '<div class="pdsel"><label><span>Otot</span><select id="pdSelMus">' + pdOpts(PD_MUS, pdMusSel, 'Semua') + '</select></label>' +
    '<label><span>Jenis</span><select id="pdSelCat">' + pdOpts(PD_CAT, pdCatSel, 'Semua') + '</select></label>' +
    '<label><span>Level</span><select id="pdSelLv">' + pdOpts(PD_LV, pdLvSel, 'Semua') + '</select></label></div>' +
    '<div class="pdrow2"><p class="pdcnt" id="pdCnt" aria-live="polite">' + pdCountText(pdFiltered().length) + '</p><button id="pdRst" class="pdrst" data-q="pdReset"' + (pdFiltering() ? '' : ' hidden') + '>Hapus saringan</button></div>' +
    '<div id="pdList">' + pdListHTML() + '</div>' + pdAttr();
}
function pdCardHTML() {
  try { pdErr = ''; return pmCardHTML('db', 'Pustaka lengkap', pdSum(), '<div id="pdBody" class="pdwrap">' + pdBodyHTML() + '</div>'); }
  catch (e) { pdErr = String(e && e.message || e); return ''; }   // jaring pengaman: kartu lain tetap tampil
}
/* --- interaksi (mengubah DOM langsung) --- */
function pdRefresh() {
  const L = document.getElementById('pdList'); if (!L) return;
  L.innerHTML = pdListHTML();
  const inp = document.getElementById('pdQ'); if (inp && inp.value !== pdQ) inp.value = pdQ;
  const c = document.getElementById('pdClr'); if (c) c.hidden = !pdQ;
  const n = document.getElementById('pdCnt'); if (n) n.textContent = pdCountText(pdLastN);
  const r = document.getElementById('pdRst'); if (r) r.hidden = !pdFiltering();
  Array.prototype.forEach.call(document.querySelectorAll('#v-train .pdfp'), b => b.setAttribute('aria-pressed', String((b.dataset.v || '') === pdEnvSel)));
  [['pdSelMus', pdMusSel], ['pdSelCat', pdCatSel], ['pdSelLv', pdLvSel]].forEach(x => { const s = document.getElementById(x[0]); if (s && s.value !== x[1]) s.value = x[1]; });
}
const pdPrev = QACT.pmSec;
QACT.pmSec = (el, ev) => { pdPrev(el, ev); if (el.dataset.sid === 'db' && el.getAttribute('aria-expanded') === 'true') pdAuto(); };
QACT.pdLoad = () => { pdLoad(); };
QACT.pdEnv = el => { const v = el.dataset.v || ''; if (v && !PD_ENVS[v]) return; pdEnvSel = (v && v === pdEnvSel) ? '' : v; pdOpen = ''; pdLim = PD_PAGE; pdRefresh(); };
QACT.pdRow = el => {
  const id = el.dataset.id; if (!pdById[id]) return;
  pdOpen = pdOpen === id ? '' : id; pdRefresh();
  if (pdOpen) setTimeout(() => { const h = document.querySelector('#v-train .pdr[data-id="' + id + '"] .pdrh'); if (h && h.scrollIntoView) h.scrollIntoView({ block: 'nearest', behavior: pmMotion() }); }, 30);
};
QACT.pdMore = () => { pdLim += PD_PAGE; pdRefresh(); };
QACT.pdClear = () => { pdQ = ''; pdOpen = ''; pdLim = PD_PAGE; pdRefresh(); const i = document.getElementById('pdQ'); if (i) i.focus(); };
QACT.pdReset = () => { pdQ = ''; pdEnvSel = ''; pdMusSel = ''; pdCatSel = ''; pdLvSel = ''; pdOpen = ''; pdLim = PD_PAGE; pdRefresh(); };
QACT.pdMus = el => {
  const k = el.dataset.k; if (!PD_MUS[k]) return;
  pdMusSel = k; pdQ = ''; pdOpen = ''; pdLim = PD_PAGE; pdRefresh();
  const h = document.getElementById('pdCtl'); if (h && h.scrollIntoView) h.scrollIntoView({ block: 'start', behavior: pmMotion() });
};
QACT.pdGo = el => {
  const e = pdById[el.dataset.id]; if (!e) return;
  pdQ = e.n; pdEnvSel = ''; pdMusSel = ''; pdCatSel = ''; pdLvSel = ''; pdOpen = e.id; pdLim = PD_PAGE; pdRefresh();
  setTimeout(() => { const h = document.querySelector('#v-train .pdr[data-id="' + e.id + '"] .pdrh'); if (h && h.scrollIntoView) h.scrollIntoView({ block: 'start', behavior: pmMotion() }); }, 30);
};
function pdLoadImg(id, box) {
  const e = pdById[id]; if (!e || !box) return;
  const live = () => document.body.contains(box);
  const say = t => { if (live()) { box.textContent = ''; const p = document.createElement('p'); p.className = 'note'; p.textContent = t; box.appendChild(p); } };
  if (!e.img.length) { say('Gambar belum tersedia untuk gerakan ini. Coba tombol Cari video.'); return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { say('Sedang offline, gambar tidak bisa dimuat.'); return; }
  say('Memuat gambar…');
  const want = e.img.slice(0, 2), got = []; let done = 0;
  want.forEach((p, i) => {
    const im = new Image(); im.referrerPolicy = 'no-referrer'; im.className = 'b18img'; im.alt = 'Peragaan ' + e.n + ' (gambar ' + (i + 1) + ')';
    const fin = ok => {
      if (ok) got[i] = im; done++;
      if (done < want.length || !live()) return;
      const ok2 = got.filter(Boolean); if (!ok2.length) { say('Gambar tidak bisa dimuat (tidak tersedia, atau koneksi bermasalah). Coba tombol Cari video.'); return; }
      box.textContent = ''; ok2.forEach(x => box.appendChild(x));
      const c = document.createElement('p'); c.className = 'note'; c.textContent = 'Gambar: free-exercise-db (domain publik). Periksa apakah sesuai dengan gerakanmu.'; box.appendChild(c);
    };
    im.onload = () => fin(true); im.onerror = () => fin(false); im.src = B18_IMG + p;
  });
}
QACT.pdImg = el => { const row = el.closest('.pdr'), box = row && row.querySelector('.pmimgs'); if (box) pdLoadImg(el.dataset.id, box); };
QACT.pdAsk = el => { const e = pdById[el.dataset.id]; if (e) b18Ask('Jelaskan teknik ' + e.n + ' yang benar, kesalahan umum, dan cara membuatnya lebih mudah atau lebih sulit.'); };
document.addEventListener('input', ev => {
  const el = ev.target; if (!el || el.id !== 'pdQ') return;
  pdQ = el.value; pdOpen = ''; pdLim = PD_PAGE; pdRefresh();
});
document.addEventListener('change', ev => {
  const el = ev.target; if (!el) return;
  if (el.id === 'pdSelMus') pdMusSel = PD_MUS[el.value] ? el.value : '';
  else if (el.id === 'pdSelCat') pdCatSel = PD_CAT[el.value] ? el.value : '';
  else if (el.id === 'pdSelLv') pdLvSel = PD_LV[el.value] ? el.value : '';
  else return;
  pdOpen = ''; pdLim = PD_PAGE; pdRefresh();
});
document.addEventListener('keydown', ev => {
  const el = ev.target; if (ev.key === 'Enter' && el && el.id === 'pdQ') { ev.preventDefault(); el.blur(); }
});
window.DL = Object.freeze(Object.assign({}, window.DL, { b28n1: Object.freeze({
  st: () => ({ st: pdSt, msg: pdMsg, n: pdData.length, q: pdQ, env: pdEnvSel, mus: pdMusSel, cat: pdCatSel, lv: pdLvSel, open: pdOpen, lim: pdLim }),
  err: () => pdErr, fresh: pdFresh, load: pdLoad, ids: () => pdFiltered().map(e => e.id), envOf: pdEnvOf, norm: pdNorm
}) }));

/* ===== MODUL: LATIHAN > SEPEDA: tampilan baru, modern, minimalis, interaktif (tahap 20, o1) ===== */
// HANYA tampilan. Data (tdb), logika, dan semua tombol lama (data-q="bkType", "bkMin", "bkStart", "bkPause", "bkSkip", "bkEnd", "rfType", "rfRpe", "rfSave",
// "rideDel", "talk", "bkWk", "svPick" dst.) TETAP dan dipakai ulang. Tidak ada kunci penyimpanan baru, tidak ada permintaan jaringan baru.
// Fungsi lama `bikeHTML` TETAP ada sebagai jaring pengaman: bila `bzHTML` gagal, tampilan lama dipakai dan pesan galat disimpan di DL.b29o1.st().err.
// Buka/tutup kartu, hari terpilih, dan pekan terpilih hanya di memori; direset tiap Sepeda BARU dibuka (dari tampilan lain atau dari Kalistenik).
const BZ = { sec: {}, day: null, wk: null, pend: false, err: '', fail: false, g: 'latih' };
const BZ_DN = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const bzRides = d => (tdb[d] && Array.isArray(tdb[d].rides)) ? tdb[d].rides : [];
const bzKm = d => bzRides(d).reduce((a, r) => a + (r.km != null ? r.km : 0), 0);
const bzMin = d => bzRides(d).reduce((a, r) => a + (r.min != null ? r.min : 0), 0);
const bzCount = () => Object.keys(tdb).reduce((a, d) => a + bzRides(d).length, 0);
function bzFresh() { BZ.g = 'latih'; BZ.sec = {}; BZ.day = null; BZ.wk = null; if (BZ.pend) { BZ.sec.rec = true; BZ.pend = false; } }

/* --- kartu ringkasan pekan + jalur tujuh hari --- */
function bzDayHTML(d) {
  const rs = bzRides(d), t = today(), isT = d === t, pl = schedFor(d).s.bike;
  const km = bzKm(d), mn = bzMin(d);
  const sum = rs.length ? rs.length + ' ride' + (km > 0 ? ' · ' + fmt(km, 1) + ' km' : '') + (mn > 0 ? ' · ' + fmt(mn, 0) + ' menit' : '') : '';
  let h = '<div class="bzdh"><b>' + esc(dayShort(d)) + (isT ? ' · hari ini' : '') + '</b>' + (sum ? '<small>' + esc(sum) + '</small>' : '') + '</div>';
  if (rs.length) {
    h += '<ul class="bzdl">' + rs.map(r => {
      const p = [];
      if (r.min != null) p.push(fmt(r.min, 0) + ' menit');
      if (r.spd != null) p.push(fmt(r.spd, 1) + ' km/jam');
      if (r.rpe != null) p.push('RPE ' + r.rpe);
      if (r.hr != null) p.push('HR ' + fmt(r.hr, 0) + (r.hx != null ? '/' + fmt(r.hx, 0) : ''));
      if (r.el != null) p.push('naik ' + fmt(r.el, 0) + ' m');
      bzKdParts(r).forEach(x => p.push(x));   // q5a
      return '<li><b>' + esc(RIDE_NAME(r.type)) + '</b><span>' + (r.km != null ? esc(fmt(r.km, 1)) + ' km' : '–') + '</span>' + (p.length ? '<small>' + esc(p.join(' · ')) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
  } else if (d <= t) {
    h += '<p class="bzdn">' + (isT ? (pl ? 'Belum ada ride hari ini. Terjadwal: ' + esc(BIKE_LABEL[pl]) + '.' : 'Belum ada ride hari ini. Bukan jadwal sepeda, tapi kamu tetap bisa bersepeda.') : 'Tidak ada ride tercatat.') + '</p>';
  } else {
    h += '<p class="bzdn">' + (pl ? 'Terjadwal: ' + esc(BIKE_LABEL[pl]) + '.' : 'Tidak ada jadwal sepeda.') + '</p>';
  }
  return h;
}
function bzHeroHTML() {
  const ws = thisWeek(), W = weekRides(ws), t = today(), tb = todayBike();
  const days = Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i); return { d, n: bzRides(d).length, km: bzKm(d), pl: d >= t && !!schedFor(d).s.bike, lb: schedFor(d).s.bike }; });
  const mx = Math.max.apply(null, days.map(x => x.km));
  if (!BZ.day || BZ.day < ws || BZ.day > addDays(ws, 6)) BZ.day = t;
  const done = bzRides(t).length > 0;
  const chip = done ? '<span class="kzg ok">Ride hari ini ✓</span>' : tb ? '<span class="kzg">Hari ini: ' + esc(BIKE_LABEL[tb]) + '</span>' : '<span class="kzg">Hari ini bebas</span>';
  const cells = days.map((x, i) => {
    const h = x.km > 0 ? Math.max(10, Math.round(x.km / mx * 100)) : (x.n ? 10 : 0);
    const lab = dayShort(x.d) + ': ' + (x.n ? x.n + ' ride' + (x.km > 0 ? ', ' + fmt(x.km, 1) + ' km' : '') : (x.pl ? 'terjadwal ' + BIKE_LABEL[x.lb] : 'tidak ada ride'));
    return '<button class="bzd' + (x.d === t ? ' td' : '') + (x.pl ? ' pl' : '') + '" data-q="bzDay" data-d="' + x.d + '" aria-pressed="' + (x.d === BZ.day) + '" aria-label="' + esc(lab) + '">' +
      '<span class="bzdb" aria-hidden="true"><i style="--h:' + h + '%"></i></span><span class="bzdn2">' + BZ_DN[i] + '</span><span class="bzdd">' + pd(x.d).getDate() + '</span><span class="bzpl" aria-hidden="true"></span></button>';
  }).join('');
  const T = (v, l) => '<div><b>' + esc(v) + '</b><span>' + l + '</span></div>';
  return '<section class="bzh" aria-label="Sepeda pekan ini"><div class="bzh-t"><h2 class="kzt">Sepeda</h2><p>' + esc(rangeLabel(ws)) + '</p><div class="kzgs">' + chip + '</div></div>' +
    '<div class="bzst">' + T(String(W.n), 'ride') + T(fmt(W.km, 1), 'km') + T(fmt(W.min / 60, 1), 'jam') + T(W.spd == null ? '–' : fmt(W.spd, 1), 'km/jam') + '</div>' +
    '<div class="bzwk" role="group" aria-label="Tujuh hari pekan ini">' + cells + '</div>' +
    '<div class="bzdp" id="bzDayP" aria-live="polite">' + bzDayHTML(BZ.day) + '</div></section>';
}

/* --- kartu sesi dan timer --- */
function bzZoneTxt(type) {
  const h = hrInfo(), ok = h.st === 'ok', A = p => hrAt(h.max, p);
  if (type === 'thr') return 'Zone 3–4' + (ok ? ' · ≈ ' + A(70) + '–' + A(90) + ' bpm' : '');
  if (type === 'vo2') return 'Zone 5 tiap set' + (ok ? ' · ≈ ' + A(90) + '–' + A(95) + ' bpm' : '');
  return 'Zone 2' + (ok ? ' · ≈ ' + A(60) + '–' + A(70) + ' bpm' : '');
}
function bzSessionHTML() {
  const type = curBk(), bt = BT[type], fixed = !bt.min, mins = fixed ? null : curMins(type);
  const tot = Math.round(bikeSteps(type, mins).reduce((a, s) => a + s.s, 0) / 60), open = !!BZ.sec.plan;
  const chips = BKTYPES.map(t => '<button class="pill" data-q="bkType" data-v="' + t + '" aria-pressed="' + (t === type) + '">' + esc(BIKE_LABEL[t]) + '</button>').join('');
  const step = fixed ? '<p class="note bzfx">Durasi tetap, sudah termasuk pemanasan dan pendinginan.</p>' :
    '<div class="stepper"><button class="btn" data-q="bkMin" data-v="-5" aria-label="Kurangi 5 menit">− 5</button><b>Durasi</b><button class="btn" data-q="bkMin" data-v="5" aria-label="Tambah 5 menit">+ 5</button></div>';
  return '<section class="bzs" aria-label="Sesi sepeda"><div class="bzs-m"><h2 class="bzt">Sesi</h2><div class="bzchips">' + chips + '</div>' +
    '<div class="bzsum"><b>' + tot + '<small>menit</small></b><span>' + esc(bzZoneTxt(type)) + '</span></div>' + step +
    '<button class="btn primary wide bzgo" data-q="bkStart">Mulai sesi ' + tot + ' menit</button></div>' +
    '<div class="bzpw' + (open ? ' open' : '') + '" data-bz="plan"><button class="kzset" data-q="bzSec" data-sid="plan" aria-expanded="' + open + '" aria-controls="bzb_plan"><span>Struktur sesi</span>' + kzChev + '</button>' +
    '<div class="kzxb" id="bzb_plan"><div class="kzxi"><div class="bzpb">' + b55StructHTML() + '</div></div></div></div></section>';
}
function bzRunHTML() {
  const r = BK.run, st = r.steps[r.i];
  return '<section class="bzrun" aria-label="Sesi berjalan"><span class="bzrz" id="bkZone">' + esc(st.z) + '</span><div class="bzrs" id="bkStep">' + esc(st.n) + '</div>' +
    '<div class="bzrt" id="bkTime">' + mmss(st.s) + '</div><div class="mtxt" id="bkNext"></div>' + b56RunExtra() +
    '<div class="bzbar"><i id="bkBar" style="width:0%"></i></div><div class="mtxt" id="bkTotal"></div>' +
    '<div class="bzra"><button class="btn" data-q="bkPause">' + (r.ra ? 'Jeda' : 'Lanjut') + '</button><button class="btn" data-q="bkSkip">Lewati langkah</button><button class="btn danger" data-q="bkEnd">Akhiri</button></div>' +
    '<p class="bzrn">Tanda suara dan getar muncul tiap pergantian langkah, jadi layar tidak perlu dipantau terus. Layar dijaga tetap menyala.</p></section>';
}

/* --- kartu lipat --- */
function bzCardHTML(id, title, sum, body) {
  const open = !!BZ.sec[id];
  return '<div class="kzx bzx' + (open ? ' open' : '') + '" data-bz="' + id + '">' +
    '<button class="kzxh" data-q="bzSec" data-sid="' + id + '" aria-expanded="' + open + '" aria-controls="bzb_' + id + '"><span class="kzxt"><b>' + esc(title) + '</b><small>' + esc(sum) + '</small></span>' + kzChev + '</button>' +
    '<div class="kzxb" id="bzb_' + id + '"><div class="kzxi"><div class="bzbody">' + body + '</div></div></div></div>';
}
function bzRecSum() {
  if (svSt.busy) return 'Membaca foto Strava…';
  if (svSt.info) return 'Foto Strava terbaca, periksa lalu simpan';
  const f = rideForm, p = [];
  if (num(f.min) != null) p.push(fmt(num(f.min), 0) + ' menit');
  if (num(f.km) != null) p.push(fmt(num(f.km), 1) + ' km');
  return p.length ? 'Draf: ' + p.join(' · ') + ' (belum disimpan)' : 'Durasi, jarak, RPE, atau impor foto Strava';
}
function bzKrHTML(x, avg) {
  const parts = [x.n + ' ride', fmt(x.km, 1) + ' km', fmt(x.min / 60, 1) + ' jam'];
  let diff = '';
  if (avg != null && !x.cur && x.km > 0) { const dv = x.km - avg; diff = (dv >= 0 ? '+' : '−') + fmt(Math.abs(dv), 1) + ' km dari rata-rata'; }
  return '<b>' + esc(rangeLabel(x.ws)) + (x.cur ? ' · pekan ini' : '') + '</b><small>' + esc(parts.join(' · ')) + '</small>' + (diff ? '<small>' + esc(diff) + '</small>' : '');
}
function bzKmSum() {
  const st = bkKmStats(bkKmData(bkWeeks));
  if (!(st.total > 0)) return 'Belum ada jarak ' + bkWeeks + ' pekan terakhir';
  return (st.avg != null ? 'Rata-rata ' + fmt(st.avg, 1) + ' km per pekan' : 'Total ' + fmt(st.total, 1) + ' km') + ' · ' + bkWeeks + ' pekan';
}
function bzKmHTML() {
  const d = bkKmData(bkWeeks), st = bkKmStats(d);
  const seg = '<div class="seg bzseg" id="bkWkSeg" role="group" aria-label="Rentang grafik">' + BK_WK_OPTS.map(n => '<button class="pill" data-q="bkWk" data-v="' + n + '" aria-pressed="' + (n === bkWeeks) + '">' + n + ' pekan</button>').join('') + '</div>';
  if (!(st.total > 0)) return seg + '<p class="empty">Belum ada jarak ride dalam ' + bkWeeks + ' pekan terakhir.' + (st.nokm ? ' ' + st.nokm + ' ride tercatat tanpa jarak.' : '') + '</p>';
  if (!BZ.wk || !d.some(x => x.ws === BZ.wk)) BZ.wk = d[d.length - 1].ws;
  const hi = Math.max.apply(null, d.map(x => x.km)), sel = d.find(x => x.ws === BZ.wk);
  const bars = d.map((x, i) => {
    const p = pd(x.ws), h = x.km > 0 ? Math.max(5, Math.round(x.km / hi * 100)) : 0;
    const lab = 'Pekan mulai ' + p.getDate() + ' ' + BULAN[p.getMonth()].slice(0, 3) + ': ' + (x.km > 0 ? fmt(x.km, 1) + ' km, ' + x.n + ' ride' : 'tidak ada jarak') + (x.cur ? ' (pekan berjalan)' : '');
    return '<button class="bzbc' + (x.cur ? ' cur' : '') + '" data-q="bzBar" data-ws="' + x.ws + '" aria-pressed="' + (x.ws === BZ.wk) + '" aria-label="' + esc(lab) + '"><span class="bzbt"><i style="--h:' + h + '%"></i></span><span class="bzbl">' + ((d.length - 1 - i) % (d.length <= 4 ? 1 : d.length <= 8 ? 2 : 3) === 0 ? p.getDate() + '/' + (p.getMonth() + 1) : '') + '</span></button>';
  }).join('');
  const avg = st.avg != null && st.avg > 0 ? '<span class="bzavg" style="--avg:' + (st.avg / hi).toFixed(3) + '" aria-hidden="true"></span>' : '';
  const lines = ['Total ' + fmt(st.total, 1) + ' km dalam ' + bkWeeks + ' pekan (' + st.rides + ' ride).'];
  if (st.avg != null) lines.push('Rata-rata ' + fmt(st.avg, 1) + ' km per pekan (' + st.doneN + ' pekan penuh; pekan berjalan tidak ikut dan digambar lebih pudar; garis putus-putus = rata-rata).');
  if (st.best) lines.push('Pekan terjauh ' + fmt(st.best.km, 1) + ' km (pekan ' + dayShort(st.best.ws).replace(/^[^,]+, /, '') + ').');
  if (st.nokm) lines.push(st.nokm + ' ride tanpa jarak tidak masuk grafik.');
  return seg + '<div class="bzbars" role="group" aria-label="Km per pekan, ' + bkWeeks + ' pekan terakhir">' + bars + avg + '</div>' +
    '<div class="bzkr" id="bzKr" aria-live="polite">' + bzKrHTML(sel, st.avg) + '</div><p class="note">' + lines.map(esc).join(' ') + '</p>';
}
function bzZonesHTML() {
  const h = hrInfo(), type = curBk(), nowZ = type === 'thr' ? [3, 4] : type === 'vo2' ? [5] : [2];
  const head = h.src === 'terukur' ? hmHead(h) : h.st === 'ok'
    ? '<p class="note">Perkiraan detak jantung maksimal (HRmax) ' + h.max + ' bpm = 208 − 0,7 × ' + h.age + ' tahun (Tanaka 2001). Galat rumus ±10 bpm, jadi anggap angka bpm sebagai kisaran kasar; uji bicara dan RPE tetap penentu. Nyeri dada, pusing berat, atau pingsan: berhenti dan temui dokter.</p>'
    : '<p class="note">' + (h.st === 'range' ? 'Usia di profil (' + esc(String(h.age)) + ') di luar rentang rumus (19–78 tahun), jadi angka bpm tidak dihitung.' : 'Isi usia di Peta › Profil & energi untuk melihat perkiraan zona detak jantung (bpm) di sini.') + '</p><button class="btn sm ghost b17go" data-q="bkProfile">Buka profil di Peta</button>';
  return head + ZONES.map(z => {
    const r = HR_PCT[z.z], now = nowZ.includes(z.z);
    return '<div class="bzzr' + (now ? ' now' : '') + '"><span class="bzzn" aria-hidden="true">' + z.z + '</span><div class="bzzt"><b>Zone ' + z.z + ': ' + esc(z.nama) + '</b><small>' + esc(z.efek) + '</small>' +
      (h.st === 'ok' ? '<small class="bzzb">≈ ' + hrAt(h.max, r[0]) + '–' + hrAt(h.max, r[1]) + ' bpm (' + r[0] + '–' + r[1] + '% HRmax)</small>' : '') + '</div>' +
      '<span class="bzzp">RPE ' + z.rpe + (now ? '<span class="bzzy">Sesi ini</span>' : '') + '</span></div>';
  }).join('') + hmEditorHTML() + ftHTML() + '<h3 class="bzsub">Uji bicara</h3>' + talkHTML();
}
function bzZonSum() { const h = hrInfo(); return h.st === 'ok' ? (h.src === 'terukur' ? 'HRmax terukur ' : 'HRmax ≈ ') + h.max + ' bpm · uji bicara' : 'Zone 1–5 dan uji bicara'; }
function bzLastSum() {
  const ds = Object.keys(tdb).filter(d => bzRides(d).length).sort();
  if (!ds.length) return 'Belum ada ride';
  let n = 0; ds.forEach(d => { n += bzRides(d).length; });
  return n + ' ride · terakhir ' + dayShort(ds[ds.length - 1]);
}
const BZ_GR = [['latih', 'Latih'], ['pekan', 'Pekan'], ['kondisi', 'Kondisi']];   // 72a
const bzG = (g, h) => '<div class="bzg" data-g="' + g + '">' + h + '</div>';
function bzSegHTML() {
  return '<div class="bzgs" role="tablist" aria-label="Bagian Sepeda">' + BZ_GR.map(x => '<button type="button" role="tab" data-q="bzGrp" data-g="' + x[0] + '" aria-selected="' + (BZ.g === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
}
function bzMiniHTML() {
  const W = weekRides(thisWeek());
  return '<button type="button" class="bzmini" data-q="bzGrp" data-g="pekan"><span><b>Pekan ini</b> ' + W.n + ' ride · ' + fmt(W.km, 1) + ' km</span><span>Lihat ›</span></button>';
}
function bzHTML() {
  if (BZ.fail) throw new Error('uji galat');   // hanya diset lewat DL.b29o1.test.fail (uji jaring pengaman)
  return '<div class="kz bz" data-grp="' + BZ.g + '">' + bzSegHTML() + bzG('pekan', bzHeroHTML()) + bzG('latih', bzMiniHTML() + (BK.run ? bzRunHTML() : bzSessionHTML())) + '<div class="bzcards">' +
    bzG('latih', bzCardHTML('rec', 'Catat ride', bzRecSum(), rideFormHTML())) +
    bzG('pekan', bzPlanCard() + bzCardHTML('km', 'Km per pekan', bzKmSum(), bzKmHTML()) + bzProgCard()) +
    bzG('kondisi', bzMntCard() + bk55Cards() + bzCardHTML('zon', 'Zona latihan', bzZonSum(), bzZonesHTML())) +
    bzG('latih', bzCardHTML('rid', 'Ride terakhir', bzLastSum(), recentRidesHTML() + b17cAiRowHTML())) + '</div></div>';
}

/* --- aksi (hanya mengubah tampilan; tanpa render ulang supaya fokus keyboard tetap) --- */
QACT.bzGrp = el => {   // 72a: ganti tab Sepeda; hanya tampilan, tanpa render ulang
  const g = el.dataset.g; if (!BZ_GR.some(x => x[0] === g)) return;
  BZ.g = g; const r = $('#trainBody .bz'); if (r) r.dataset.grp = g;
  $$('#trainBody .bzgs button').forEach(b => b.setAttribute('aria-selected', b.dataset.g === g ? 'true' : 'false'));
  if (r) { const q = r.getBoundingClientRect().top + window.scrollY - 70; if (window.scrollY > q) window.scrollTo(0, Math.max(0, q)); }
};
window.DL = Object.freeze(Object.assign({}, window.DL, { b72a: Object.freeze({ grp: () => BZ.g, groups: () => BZ_GR.map(x => x[0]) }) }));
QACT.bzSec = el => {
  const c = el.closest('[data-bz]'); if (!c) return;
  const open = el.getAttribute('aria-expanded') !== 'true';
  BZ.sec[el.dataset.sid] = open; el.setAttribute('aria-expanded', open); c.classList.toggle('open', open);
};
QACT.bzDay = el => {
  const d = el.dataset.d; if (!d) return;
  BZ.day = d;
  $$('#trainBody .bzd').forEach(b => b.setAttribute('aria-pressed', b === el ? 'true' : 'false'));
  const p = $('#bzDayP'); if (p) p.innerHTML = bzDayHTML(d);
};
QACT.bzBar = el => {
  const ws = el.dataset.ws; if (!ws) return;
  BZ.wk = ws;
  $$('#trainBody .bzbc').forEach(b => b.setAttribute('aria-pressed', b === el ? 'true' : 'false'));
  const d = bkKmData(bkWeeks), x = d.find(y => y.ws === ws), r = $('#bzKr');
  if (x && r) r.innerHTML = bzKrHTML(x, bkKmStats(d).avg);
};

document.addEventListener('input', ev => {   // ringkasan kartu "Catat ride" ikut berubah saat mengetik (urutan pendengar: sesudah pendengar lama yang mengisi rideForm)
  const el = ev.target;
  if (el && el.dataset && el.dataset.rf) { const s = $('#trainBody [data-bz="rec"] .kzxt small'); if (s) s.textContent = bzRecSum(); }
});

/* --- pemasangan: tampilan baru menggantikan bikeHTML; yang lama tetap sebagai jaring pengaman --- */
{
  const _old = bikeHTML;
  bikeHTML = function () {
    try { const h = bzHTML(); BZ.err = ''; return h; } catch (x) { BZ.err = String((x && x.message) || x); return _old(); }
  };
  const _sv = showView;
  showView = function (v) { try { if (v === 'train' && curView !== 'train') bzFresh(); } catch (x) { /* abaikan */ } return _sv.apply(this, arguments); };
  const _tt = QACT.trTab;
  QACT.trTab = el => { try { if (el.dataset.v === 'bike' && trainTab !== 'bike') bzFresh(); } catch (x) { /* abaikan */ } return _tt(el); };
  const _bf = bkFinish;
  bkFinish = function (secs, natural) { try { BZ.sec.rec = true; BZ.g = 'latih'; if (curView !== 'train') BZ.pend = true; } catch (x) { /* abaikan */ } return _bf(secs, natural); };   // sesi selesai: kartu "Catat ride" terbuka untuk mengisi jarak
  const _rs = QACT.rfSave;
  QACT.rfSave = el => {
    const n0 = bzCount(); _rs(el);
    try {
      if (bzCount() > n0 && curView === 'train' && trainTab === 'bike') {   // ride tersimpan: kartu menutup, hari ride itu terpilih, tampilan naik ke ringkasan pekan
        let nd = null, nt = -1;
        Object.keys(tdb).forEach(d => bzRides(d).forEach(r => { if ((r.t || 0) > nt) { nt = r.t || 0; nd = d; } }));
        BZ.sec.rec = false; BZ.g = 'pekan'; if (nd) BZ.day = nd;
        renderTrain(); window.scrollTo(0, 0);
      }
    } catch (x) { /* abaikan */ }
  };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b29o1: Object.freeze({
  st: () => ({ sec: Object.assign({}, BZ.sec), day: BZ.day, wk: BZ.wk, pend: BZ.pend, err: BZ.err }), fresh: bzFresh, html: bzHTML, day: bzDayHTML,
  count: bzCount, today: () => today(), week: () => { const W = weekRides(thisWeek()); return { n: W.n, km: W.km, min: W.min, spd: W.spd }; },
  mins: () => curMins(curBk()), rf: () => Object.assign({}, rideForm), run: () => !!BK.run, weeks: () => bkWeeks,
  test: Object.freeze({ fail: v => { BZ.fail = !!v; } })
}) }));

