/* ===== IB2-B3b3: data sunnah tahap 3b-3: tambahan 4 sunnah di kategori "Akhlak & pergaulan" (memakai pembantu dari B3a1; kategori sudah ada, tidak ada kategori baru). Nomor hadits dicek ke sunnah.com dan situs rujukan hadits lewat pencarian web (14 Nov 2026); isi cara mengamalkan dan catatan tetap ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3b3.py --reverse ===== */
ibxSnAddAfter("sn-senyum", [
  { id: "sn-jenguk", c: "akhlak", t: "Menjenguk orang sakit", v: 0, g: "Shahih", k: "jenguk menjenguk orang sakit mengunjungi sakit hak muslim atas muslim enam hak",
    p: "Luangkan waktu menjenguk saudara, teman, atau tetangga yang sedang sakit; datanglah dengan ramah, doakan kesembuhannya, dan jangan berlama-lama sampai memberatkannya.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: hak seorang muslim atas muslim lainnya ada enam. Bila bertemu, ucapkan salam; bila diundang, penuhilah; bila meminta nasihat, berilah nasihat; bila bersin lalu memuji Allah, doakan dengan yarhamukallah; bila sakit, jenguklah; dan bila wafat, antarkanlah jenazahnya.",
    n: "Riwayat Bukhari no. 1240 menyebut lima hak (tanpa hak memberi nasihat). Menurut ringkasan komentar yang tampil di situs hadits, An-Nawawi menyebut menjenguk orang sakit sebagai sunnah menurut kesepakatan ulama, sedangkan Ibnu Battal memandangnya fardhu kifayah; hukum persisnya dibahas ulama dan tidak diputuskan di sini.",
    s: "HR. Muslim no. 2162 dan Bukhari no. 1240" },
  { id: "sn-tamu", c: "akhlak", t: "Memuliakan tamu", v: 0, g: "Shahih", k: "tamu memuliakan menjamu keramahan hospitality iman hari akhir",
    p: "Sambut tamu dengan ramah dan jamulah semampunya; tidak perlu berlebihan, yang penting tamu merasa dihargai.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: barangsiapa beriman kepada Allah dan hari akhir, janganlah ia menyakiti tetangganya; barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia memuliakan tamunya; dan barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab barangsiapa beriman kepada Allah dan hari akhir tidak boleh menyakiti tetangganya. Ringkasan komentar di situs hadits menyebut memuliakan tamu sebagai tanda iman kepada Allah dan hari akhir; hukum persisnya (wajib atau sunnah) dibahas ulama dan tidak diputuskan di sini.",
    s: "HR. Bukhari no. 6018 dan Muslim no. 47" },
  { id: "sn-tetangga", c: "akhlak", t: "Berbuat baik kepada tetangga", v: 0, g: "Shahih", k: "tetangga jiran berbuat baik wasiat jibril ahli waris bertetangga",
    p: "Jaga hubungan baik dengan tetangga: sapa mereka, bantu bila mereka butuh, dan hindari mengganggu mereka, misalnya dengan suara keras atau sampah.",
    h: "Aisyah ra. meriwayatkan sabda Nabi ﷺ: Jibril terus-menerus berwasiat kepadaku tentang tetangga, sampai aku mengira ia akan menjadikan tetangga sebagai ahli waris.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab berwasiat agar berbuat baik kepada tetangga. Hadits yang sama juga diriwayatkan dari Ibnu Umar (Bukhari no. 6015).",
    s: "HR. Bukhari no. 6014 dan Muslim no. 2624" },
  { id: "sn-bersin", c: "akhlak", t: "Mendoakan orang yang bersin", v: 0, g: "Shahih", k: "bersin mendoakan yarhamukallah alhamdulillah yahdikumullah tasymit jawab",
    p: "Bila bersin, ucapkan alhamdulillah. Bila mendengar orang lain bersin lalu mengucapkan alhamdulillah, jawab dengan yarhamukallah; yang bersin membalas dengan yahdikumullah wa yushlihu balakum.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bila salah seorang kalian bersin, hendaklah ia mengucapkan alhamdulillah, dan saudaranya atau temannya mengucapkan yarhamukallah. Bila ia telah mengucapkan yarhamukallah, hendaklah yang bersin menjawab yahdikumullah wa yushlihu balakum.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab apa yang diucapkan bila seseorang bersin. Menurut ringkasan komentar di situs hadits, doa itu diucapkan kepada orang yang bersin dan memuji Allah; yang tidak mengucapkan alhamdulillah tidak didoakan.",
    s: "HR. Bukhari no. 6224" }
]);
/* ===== IB2-E1: tab Shalat (kerangka tab + tata cara shalat langkah demi langkah + 5 shalat wajib). Data ditulis dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Bacaan memakai doa yang SAMA dengan tab Doa & dzikir (kunci d = id doa), jadi teks Arab tidak disalin ulang. Tidak ada kunci penyimpanan baru. Membalik: patch_ib2e1.py --reverse ===== */
// Bidang kartu: id (awalan sh-), c (kategori IBX_SHC), t (judul), hk (hukum), rk (jumlah rakaat), w (waktu), p (langkah: {s teks, d [id doa], a {ar, lat, tr} bacaan sisipan}), n (catatan), s (sumber), g (derajat), k (kata kunci), v (0 = belum dicocokkan dengan kitab cetak)
const IBX_SHC = [["tata", "Tata cara shalat"], ["wajib", "Shalat wajib 5 waktu"]];
const IBX_SHL = [
  { id: "sh-tata", c: "tata", t: "Tata cara shalat dari takbir sampai salam", v: 0, g: "Shahih",
    k: "tata cara shalat urutan gerakan bacaan takbiratul ihram ruku sujud tasyahud salam rukun tuma'ninah panduan langkah",
    hk: "Wajib bagi setiap muslim yang baligh dan berakal. Berikut urutan satu shalat empat rakaat; shalat dua dan tiga rakaat memakai bagian yang sama.",
    p: [
      { s: "Persiapan: suci dari hadats dan najis (badan, pakaian, tempat), menutup aurat, sudah masuk waktu, dan menghadap kiblat." },
      { s: "Niat dalam hati untuk shalat yang dikerjakan. Melafazkan niat tidak diajarkan secara khusus oleh Nabi ﷺ; sebagian ulama mazhab Syafi'i menganggapnya sunnah untuk membantu hati, sebagian yang lain tidak." },
      { s: "Berdiri tegak bila mampu, lalu takbiratul ihram sambil mengangkat kedua tangan setinggi bahu atau telinga.", a: { ar: "اللَّهُ أَكْبَرُ", lat: "Allahu akbar.", tr: "Allah Maha Besar." } },
      { s: "Bersedekap: telapak tangan kanan di atas punggung telapak tangan kiri, diletakkan di dada atau di atas pusar. Pandangan ke tempat sujud." },
      { s: "Rakaat pertama saja: baca doa iftitah (pilih salah satu), lalu berlindung dari setan.", d: ["iftitah1", "iftitah2"], a: { ar: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", lat: "A'udzu billahi minasy syaithanir rajim.", tr: "Aku berlindung kepada Allah dari setan yang terkutuk." } },
      { s: "Baca Al-Fatihah pada setiap rakaat, lalu ucapkan \"Amin\". Pada dua rakaat pertama tambahkan ayat atau surah pendek dari Al-Qur'an.", d: ["fatihah"] },
      { s: "Takbir lalu ruku': punggung rata, kedua telapak tangan memegang lutut, kepala sejajar punggung.", d: ["ruku"] },
      { s: "Bangkit dari ruku' (i'tidal) dan berdiri tegak sampai tenang.", d: ["itidal"] },
      { s: "Takbir lalu sujud dengan tujuh anggota menyentuh lantai: dahi bersama hidung, dua telapak tangan, dua lutut, dan ujung dua kaki.", d: ["sujud"] },
      { s: "Takbir lalu duduk di antara dua sujud (kaki kiri dihamparkan dan diduduki, kaki kanan ditegakkan), tenang sejenak.", d: ["duasujud"] },
      { s: "Takbir lalu sujud yang kedua dengan bacaan yang sama. Setelah itu bangkit untuk rakaat berikutnya sambil bertakbir. Rakaat kedua sama seperti pertama, tanpa iftitah." },
      { s: "Pada shalat tiga atau empat rakaat, setelah rakaat kedua duduk tasyahud awal, lalu bangkit untuk rakaat ketiga dan keempat yang cukup dengan Al-Fatihah.", d: ["tasyahud"] },
      { s: "Rakaat terakhir: duduk tasyahud akhir (kaki kiri dikeluarkan ke sisi kanan, bokong menyentuh lantai), baca tasyahud, shalawat, lalu doa sebelum salam.", d: ["tasyahud", "shalawatibrahim", "sebelumsalam1", "sebelumsalam2"] },
      { s: "Salam ke kanan lalu ke kiri sambil menoleh.", d: ["salamshalat"] },
      { s: "Lanjutkan dengan dzikir setelah shalat (paket \"Setelah shalat wajib\" ada di tab Doa & dzikir)." }
    ],
    n: "Tuma'ninah (tenang sejenak di setiap gerakan) termasuk rukun. Perincian seperti letak tangan, duduk istirahat sebelum bangkit, dan bacaan tasyahud berbeda antarmazhab; bacaan di sini mengikuti cara yang umum di Indonesia (mazhab Syafi'i) dan semuanya memiliki dasar.",
    s: "HR. Bukhari no. 757 dan Muslim no. 397 (hadits orang yang buruk shalatnya, Abu Hurairah); perintah mencontoh shalat Nabi ﷺ: HR. Bukhari no. 631 (Malik bin Huwairits); tujuh anggota sujud: HR. Bukhari no. 812 dan Muslim no. 490 (Ibnu Abbas)" },
  { id: "sh-subuh", c: "wajib", t: "Shalat Subuh", v: 0, g: "Shahih", k: "subuh fajar shubuh dua rakaat qunut jahr wajib",
    hk: "Fardhu ain.", rk: "2 rakaat",
    w: "Dari terbit fajar shadiq sampai terbit matahari.",
    p: [
      { s: "Rakaat pertama: takbiratul ihram, iftitah, Al-Fatihah dan surah dengan suara keras (jahr), ruku', i'tidal, dua sujud.", d: ["iftitah1", "fatihah"] },
      { s: "Rakaat kedua: Al-Fatihah dan surah dengan suara keras, ruku', i'tidal (di sini mazhab Syafi'i membaca doa qunut), dua sujud.", d: ["qunut"] },
      { s: "Duduk tasyahud akhir: tasyahud, shalawat, doa sebelum salam, lalu salam.", d: ["tasyahud", "shalawatibrahim", "salamshalat"] }
    ],
    n: "Qunut pada Subuh: mazhab Syafi'i menyunnahkannya; mazhab Hanafi dan Hanbali tidak melakukannya pada Subuh biasa; mazhab Maliki menganggapnya dianjurkan dengan dibaca pelan sebelum ruku'. Dua rakaat sunnah sebelum Subuh ada di tab Sunnah.",
    s: "Waktu: HR. Muslim no. 612 (Abdullah bin Amr); waktu shalat ditentukan: QS. An-Nisa: 103" },
  { id: "sh-zhuhur", c: "wajib", t: "Shalat Zhuhur", v: 0, g: "Shahih", k: "zhuhur dzuhur duhur empat rakaat sirr pelan wajib",
    hk: "Fardhu ain.", rk: "4 rakaat",
    w: "Dari matahari tergelincir dari tengah langit sampai bayangan benda sama panjang dengan bendanya.",
    p: [
      { s: "Rakaat pertama dan kedua: Al-Fatihah dan surah dengan suara pelan (sirr). Setelah rakaat kedua duduk tasyahud awal.", d: ["fatihah", "tasyahud"] },
      { s: "Rakaat ketiga dan keempat: cukup Al-Fatihah, pelan." },
      { s: "Rakaat keempat: tasyahud akhir, shalawat, doa sebelum salam, lalu salam.", d: ["shalawatibrahim", "salamshalat"] }
    ],
    n: "Pada hari Jumat bagi laki-laki menggantinya dengan shalat Jumat dua rakaat. Rawatib Zhuhur ada di tab Sunnah.",
    s: "Waktu: HR. Muslim no. 612 (Abdullah bin Amr); bacaan dua rakaat pertama dan dua terakhir: HR. Bukhari no. 759 dan Muslim no. 451 (Abu Qatadah)" },
  { id: "sh-ashar", c: "wajib", t: "Shalat Ashar", v: 0, g: "Shahih", k: "ashar asar empat rakaat sirr pelan wajib wustha",
    hk: "Fardhu ain.", rk: "4 rakaat",
    w: "Dari bayangan benda sama panjang dengan bendanya sampai matahari terbenam. Waktu terbaik sebelum matahari menguning.",
    p: [
      { s: "Rakaat pertama dan kedua: Al-Fatihah dan surah dengan suara pelan (sirr). Setelah rakaat kedua duduk tasyahud awal.", d: ["fatihah", "tasyahud"] },
      { s: "Rakaat ketiga dan keempat: cukup Al-Fatihah, pelan." },
      { s: "Rakaat keempat: tasyahud akhir, shalawat, doa sebelum salam, lalu salam.", d: ["shalawatibrahim", "salamshalat"] }
    ],
    n: "Ashar termasuk shalat yang dijaga secara khusus (shalat wustha menurut sebagian besar ulama).",
    s: "Waktu: HR. Muslim no. 612 (Abdullah bin Amr); perintah menjaga shalat wustha: QS. Al-Baqarah: 238" },
  { id: "sh-maghrib", c: "wajib", t: "Shalat Maghrib", v: 0, g: "Shahih", k: "maghrib magrib tiga rakaat jahr wajib senja",
    hk: "Fardhu ain.", rk: "3 rakaat",
    w: "Dari matahari terbenam sampai hilangnya mega merah di ufuk barat.",
    p: [
      { s: "Rakaat pertama dan kedua: Al-Fatihah dan surah dengan suara keras (jahr). Setelah rakaat kedua duduk tasyahud awal.", d: ["fatihah", "tasyahud"] },
      { s: "Rakaat ketiga: cukup Al-Fatihah dengan suara pelan." },
      { s: "Tasyahud akhir, shalawat, doa sebelum salam, lalu salam.", d: ["shalawatibrahim", "salamshalat"] }
    ],
    n: "Waktunya paling singkat di antara shalat lima waktu; segerakan setelah masuk waktu.",
    s: "Waktu: HR. Muslim no. 612 (Abdullah bin Amr)" },
  { id: "sh-isya", c: "wajib", t: "Shalat Isya", v: 0, g: "Shahih", k: "isya isyak empat rakaat jahr wajib malam",
    hk: "Fardhu ain.", rk: "4 rakaat",
    w: "Dari hilangnya mega merah sampai tengah malam (waktu pilihan). Sebagian ulama membolehkannya sampai terbit fajar bagi yang berhalangan.",
    p: [
      { s: "Dua rakaat pertama: Al-Fatihah dan surah dengan suara keras (jahr); setelah rakaat kedua duduk tasyahud awal.", d: ["fatihah", "tasyahud"] },
      { s: "Rakaat ketiga dan keempat: cukup Al-Fatihah dengan suara pelan." },
      { s: "Tasyahud akhir, shalawat, doa sebelum salam, lalu salam.", d: ["shalawatibrahim", "salamshalat"] }
    ],
    n: "Shalat witir biasanya dikerjakan sesudah Isya; keterangannya ada di tab Sunnah.",
    s: "Waktu: HR. Muslim no. 612 (Abdullah bin Amr)" }
];
let ibxShCat = "all", ibxShIdx = null;
const ibxShLabel = c => (IBX_SHC.find(x => x[0] === c) || [0, ""])[1];
function ibxShStep(st) {
  const ds = (st.d || []).map(id => IBX_DOA.find(x => x.id === id)).filter(Boolean);
  return "<li>" + esc(st.s) + (st.a ? '<p class="ibx-ar" lang="ar" dir="rtl">' + esc(st.a.ar) + "</p>" + (ibdb.pref.lat ? '<p class="ibx-lat">' + esc(st.a.lat) + "</p>" : "") + '<p class="ibx-tr">' + esc(st.a.tr) + "</p>" : "") + ds.map(d => ibxDoaCard(d, false)).join("") + "</li>";
}
function ibxShCard(x, showKind) {
  return '<details class="ibx-doa ibx-sh" data-id="' + esc(x.id) + '"><summary><span class="t">' + esc(x.t) + '</span><span class="c">' + (showKind ? "Shalat · " : "") + esc(ibxShLabel(x.c)) + (x.rk ? " · " + esc(x.rk) : "") + " · " + esc(x.g) + '</span></summary><div class="ibx-db">' +
    '<p class="ibx-tr"><b>Hukum.</b> ' + esc(x.hk) + "</p>" +
    (x.rk ? '<p class="ibx-tr"><b>' + (/rakaat/.test(x.rk) ? "Jumlah rakaat." : "Bentuk shalat.") + "</b> " + esc(x.rk) + "</p>" : "") +
    (x.w ? '<p class="ibx-tr"><b>Waktu.</b> ' + esc(x.w) + "</p>" : "") +
    '<p class="ibx-tr"><b>Tata cara dan bacaan.</b></p><ol class="ibx-gs ibx-shs">' + x.p.map(ibxShStep).join("") + "</ol>" +
    (x.n ? '<p class="ibx-f"><b>Catatan.</b> ' + esc(x.n) + "</p>" : "") +
    '<p class="ibx-src">' + esc(x.s) + " · " + esc(x.g) + "</p></div></details>";
}
function ibxShPanel() {
  const chips = [["all", "Semua"]].concat(IBX_SHC), rows = ibxShCat === "all" ? IBX_SHL : IBX_SHL.filter(s => s.c === ibxShCat);
  return '<section class="ibx-card ibx-shhd"><h3>Shalat</h3><p class="ibx-tr">' + IBX_SHL.length + " panduan: tata cara shalat, shalat lima waktu, shalat sunnah, shalat karena sebab, serta shalat jenazah, gerhana, istisqa, Idul Fitri, dan Idul Adha. Ketuk kartu untuk melihat tata cara dan bacaannya; ketuk bacaan untuk membuka teks Arab, Latin, dan artinya.</p></section>" +
    '<div class="ibx-chips" role="group" aria-label="Kategori shalat">' + chips.map(c => '<button class="ibx-chip" data-q="ibxShCat" data-v="' + c[0] + '" aria-pressed="' + (ibxShCat === c[0]) + '">' + esc(c[1]) + "</button>").join("") + "</div>" +
    '<p class="ibx-cnt">' + rows.length + " panduan</p>" +
    '<div class="ibx-dl">' + rows.map(s => ibxShCard(s, false)).join("") + "</div>" +
    '<p class="ibx-fine">Tata cara ditulis ulang dari pengetahuan penyusun (ringkasan umum, mengikuti kebiasaan mazhab Syafi\'i di Indonesia) dan belum dicocokkan dengan kitab cetak. Nomor hadits mengikuti penomoran yang lazim. Perbedaan mazhab ditulis netral; untuk kasus khusus tanyakan kepada ustadz.</p>';
}
QACT.ibxShCat = b => { const v = b && b.dataset ? b.dataset.v : ""; ibxShCat = v === "all" || IBX_SHC.some(c => c[0] === v) ? v : "all"; ibxRender(); };
IBX_PANEL.shalat = ibxShPanel; IBX_READY.shalat = true;
IBX_FRESH.push(() => { ibxShCat = "all"; });
IBX_SEARCH.push(function (n, toks) {   // cari: judul, kata kunci, hukum, waktu, langkah, catatan
  if (!ibxShIdx) ibxShIdx = IBX_SHL.map(x => ({ x, r: { t: ibxNorm(x.t), k: ibxNorm(x.k + " shalat " + ibxShLabel(x.c)), a: ibxNorm(x.hk + " " + (x.w || "") + " " + x.p.map(p => p.s).join(" ") + " " + (x.n || "")), l: "", r: "" } }));
  const out = [];
  ibxShIdx.forEach(y => { const sc = ibxScoreOf(y.r, toks); if (sc) out.push({ s: sc, h: ibxShCard(y.x, true), id: y.x.id, kind: "shalat" }); });
  return out;
});
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2e: Object.freeze({ shl: IBX_SHL, cat: IBX_SHC, cur: () => ibxShCat, card: ibxShCard }) }));
/* ===== IB2-E2a: tab Shalat, kategori baru "Shalat sunnah" (3 kartu: rawatib, Dhuha, tahiyatul masjid). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Hanya menambah isi ke IBX_SHC dan IBX_SHL (tanpa kode tampilan baru). Membalik: patch_ib2e2a.py --reverse ===== */
IBX_SHC.push(["sunnah", "Shalat sunnah"]);
IBX_SHL.push(
  { id: "sh-rawatib", c: "sunnah", t: "Shalat rawatib (sebelum dan sesudah shalat wajib)", v: 0, g: "Shahih",
    k: "rawatib qabliyah badiyah sebelum sesudah subuh zhuhur ashar maghrib isya dua belas rakaat sunnah muakkad rumah surga",
    hk: "Sunnah muakkadah (sangat dianjurkan) untuk dua belas rakaat; empat rakaat sebelum Ashar sunnah yang tidak sekuat itu.",
    rk: "12 rakaat per hari",
    w: "Sebelum shalat wajib (qabliyah) atau sesudahnya (ba'diyah), selama masih dalam waktu shalat itu.",
    p: [
      { s: "Subuh: dua rakaat sebelum shalat wajib, dikerjakan ringan. Rasulullah ﷺ biasa membaca Al-Kafirun pada rakaat pertama dan Al-Ikhlas pada rakaat kedua; surahnya dapat dibuka di tab Al-Qur'an." },
      { s: "Zhuhur: empat rakaat sebelum shalat wajib (dua-dua, tiap dua rakaat satu salam) dan dua rakaat sesudahnya." },
      { s: "Maghrib: dua rakaat sesudah shalat wajib." },
      { s: "Isya: dua rakaat sesudah shalat wajib." },
      { s: "Ashar: empat rakaat sebelum shalat wajib (dua-dua) termasuk sunnah yang dianjurkan, tetapi tidak dihitung dalam dua belas rakaat." },
      { s: "Tata cara dan bacaan sama dengan shalat biasa; lihat kartu \"Tata cara shalat dari takbir sampai salam\". Niat dalam hati sesuai nama shalatnya." }
    ],
    n: "Ada riwayat lain yang menyebut sepuluh rakaat (dua sebelum Zhuhur, bukan empat); keduanya diamalkan para ulama. Mengerjakan shalat sunnah di rumah lebih utama daripada di masjid.",
    s: "HR. Muslim no. 728 (Ummu Habibah); rincian 12 rakaat: HR. Tirmidzi (Aisyah); riwayat 10 rakaat: HR. Bukhari dan Muslim (Ibnu Umar); dua rakaat fajar dan surahnya: HR. Muslim no. 725 dan 726; empat rakaat sebelum Ashar: HR. Abu Dawud dan Tirmidzi (dinilai hasan); shalat sunnah di rumah: HR. Bukhari no. 731 dan Muslim no. 781 (Zaid bin Tsabit)" },
  { id: "sh-dhuha", c: "sunnah", t: "Shalat Dhuha", v: 0, g: "Shahih",
    k: "dhuha duha pagi sedekah ruas tulang awwabin rezeki dua rakaat",
    hk: "Sunnah.", rk: "Paling sedikit 2 rakaat; riwayat menyebut 4 rakaat, dan boleh ditambah.",
    w: "Sejak matahari naik setinggi tombak (kira-kira 15 menit sesudah terbit) sampai menjelang Zhuhur. Waktu yang paling utama ketika matahari mulai terasa panas.",
    p: [
      { s: "Niat dalam hati untuk shalat Dhuha, lalu takbiratul ihram." },
      { s: "Kerjakan dua rakaat dengan tata cara shalat biasa (Al-Fatihah dan surah pilihan pada tiap rakaat), lalu salam. Tidak ada surah tertentu yang ditetapkan dalam hadits.", d: ["fatihah"] },
      { s: "Bila ingin menambah, kerjakan dua-dua rakaat dengan satu salam tiap dua rakaat." }
    ],
    n: "Doa khusus sesudah Dhuha yang beredar luas tidak dimuat di sini karena sebagian ulama menilai asal-usulnya lemah; pilihlah doa dari tab Doa & dzikir yang sumbernya jelas.",
    s: "HR. Muslim no. 720 (Abu Dzar); empat rakaat dan tambahan: HR. Muslim no. 719 (Aisyah); waktu ketika terasa panas: HR. Muslim no. 748 (Zaid bin Arqam)" },
  { id: "sh-tahiyat", c: "sunnah", t: "Shalat tahiyatul masjid", v: 0, g: "Shahih",
    k: "tahiyatul masjid tahiyat masjid masuk masjid dua rakaat sebelum duduk jumat khutbah",
    hk: "Sunnah muakkadah.", rk: "2 rakaat",
    w: "Ketika masuk masjid, sebelum duduk.",
    p: [
      { s: "Masuk masjid dengan kaki kanan sambil membaca doa masuk masjid.", d: ["masukmasjid"] },
      { s: "Sebelum duduk, kerjakan dua rakaat dengan tata cara shalat biasa, lalu salam." },
      { s: "Bila sudah masuk waktu shalat wajib dan jamaah sedang berdiri, cukup ikut shalat wajib; shalat wajib itu sudah mencukupi (menurut jumhur ulama)." },
      { s: "Saat khutbah Jumat sudah dimulai, kerjakan dua rakaat yang ringan lalu duduk mendengarkan khutbah." }
    ],
    n: "Pelaksanaan pada waktu yang dilarang untuk shalat (setelah Subuh dan setelah Ashar) diperselisihkan ulama; sebagian membolehkannya karena ada sebab, sebagian melarangnya. Tanyakan kepada ustadz bila perlu.",
    s: "HR. Bukhari no. 444 dan Muslim no. 714 (Abu Qatadah); khutbah Jumat: HR. Bukhari no. 930 dan Muslim no. 875 (Jabir)" }
);
/* ===== IB2-E2b1: tab Shalat, kategori Shalat sunnah, 2 kartu tarawih (versi 11 rakaat dan versi 23 rakaat). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Hanya menambah isi ke IBX_SHL (tanpa kode tampilan baru). Membalik: patch_ib2e2b1.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-tar11", c: "sunnah", t: "Shalat tarawih, versi 11 rakaat (8 + witir 3)", v: 0, g: "Shahih",
    k: "tarawih taraweh terawih qiyam ramadhan qiyamul lail ramadan sebelas rakaat delapan witir tiga berjamaah imam malam ramadhan",
    hk: "Sunnah muakkadah, khusus pada malam-malam Ramadhan; sangat dianjurkan, terutama berjamaah di masjid.",
    rk: "11 rakaat (8 tarawih + 3 witir)",
    w: "Sesudah shalat Isya sampai terbit fajar (sebelum masuk waktu Subuh), pada malam-malam Ramadhan.",
    p: [
      { s: "Kerjakan shalat Isya lebih dulu, lalu niat dalam hati untuk shalat tarawih (qiyam Ramadhan) dan takbiratul ihram. Bila berjamaah, ikuti imam." },
      { s: "Delapan rakaat tarawih dikerjakan dua rakaat satu salam, jadi empat kali salam (sesuai sabda Nabi ﷺ bahwa shalat malam itu dua rakaat dua rakaat). Ada pula riwayat Aisyah tentang empat rakaat berturut-turut; keduanya dicatat." },
      { s: "Tiap rakaat membaca Al-Fatihah dan surah pilihan. Rasulullah ﷺ biasa memanjangkan bacaan, rukuk, dan sujud; imam dianjurkan tidak memberatkan makmum.", d: ["fatihah"] },
      { s: "Tiap empat rakaat (dua salam) jamaah biasa beristirahat sejenak; dari sinilah nama tarawih (istirahat). Bacaan khusus di sela istirahat tidak ditetapkan dalam hadits yang shahih; bila ingin berzikir, pilih yang sumbernya jelas." },
      { s: "Tutup dengan witir tiga rakaat: dua rakaat salam, lalu satu rakaat salam (cara yang lebih utama menurut mazhab Syafi'i), atau tiga rakaat bersambung dengan satu tasyahud di akhir. Keterangan witir ada di tab Sunnah (Shalat witir)." },
      { s: "Doa qunut pada witir dibaca di rakaat terakhir sesudah i'tidal; menurut mazhab Syafi'i dibaca pada separuh akhir Ramadhan (mulai malam ke-16), dan ulama lain berbeda.", d: ["qunut"] },
      { s: "Mengikuti imam sampai selesai dicatat seperti shalat semalam penuh: karena itu tinggallah bersama imam sampai witir selesai." }
    ],
    n: "Aisyah ra ditanya tentang shalat Rasulullah ﷺ di bulan Ramadhan; jawabnya beliau tidak menambah lebih dari sebelas rakaat, baik di Ramadhan maupun di luar Ramadhan. Sebagian ulama memegang bilangan ini sebagai batas tuntunan; ulama lain memahaminya sebagai bilangan shalat malam Nabi ﷺ dan membolehkan lebih banyak. Kedua versi (11 dan 23) diamalkan kaum muslimin; ikuti imam di masjid dan saling menghormati.",
    s: "HR. Bukhari no. 1147 dan Muslim no. 738 (Aisyah) tentang 11 rakaat; shalat malam dua-dua: HR. Bukhari no. 990 dan Muslim no. 749 (Ibnu Umar); keutamaan qiyam Ramadhan: HR. Bukhari no. 37 dan Muslim no. 759 (Abu Hurairah); bersama imam sampai selesai: HR. Abu Dawud no. 1375 dan Tirmidzi no. 806 (Abu Dzar)" },
  { id: "sh-tar23", c: "sunnah", t: "Shalat tarawih, versi 23 rakaat (20 + witir 3)", v: 0, g: "Atsar sahabat",
    k: "tarawih taraweh terawih qiyam ramadhan qiyamul lail ramadan dua puluh tiga rakaat witir umar berjamaah imam malam ramadhan",
    hk: "Sunnah muakkadah, khusus pada malam-malam Ramadhan; bilangan 20 rakaat tarawih diamalkan jumhur ulama (mazhab Hanafi, Syafi'i, dan Hanbali).",
    rk: "23 rakaat (20 tarawih + 3 witir)",
    w: "Sesudah shalat Isya sampai terbit fajar (sebelum masuk waktu Subuh), pada malam-malam Ramadhan.",
    p: [
      { s: "Kerjakan shalat Isya lebih dulu, lalu niat dalam hati untuk shalat tarawih (qiyam Ramadhan) dan takbiratul ihram. Bila berjamaah, ikuti imam." },
      { s: "Dua puluh rakaat tarawih dikerjakan dua rakaat satu salam, jadi sepuluh kali salam. Tiap empat rakaat (dua salam) ada jeda istirahat sejenak." },
      { s: "Tiap rakaat membaca Al-Fatihah dan surah pilihan; imam dianjurkan menjaga bacaan agar tidak memberatkan makmum.", d: ["fatihah"] },
      { s: "Tutup dengan witir tiga rakaat: dua rakaat salam, lalu satu rakaat salam (cara yang lebih utama menurut mazhab Syafi'i), atau tiga rakaat bersambung dengan satu tasyahud di akhir. Keterangan witir ada di tab Sunnah (Shalat witir)." },
      { s: "Doa qunut pada witir dibaca di rakaat terakhir sesudah i'tidal; menurut mazhab Syafi'i dibaca pada separuh akhir Ramadhan (mulai malam ke-16), dan ulama lain berbeda.", d: ["qunut"] }
    ],
    n: "Dasar bilangan ini adalah praktik zaman Umar bin Khattab ra ketika beliau mengumpulkan orang untuk shalat tarawih berjamaah di belakang satu imam (HR. Bukhari no. 2010). Malik dalam al-Muwaththa' meriwayatkan dari Yazid bin Ruman bahwa orang-orang shalat pada masa Umar dengan 23 rakaat; Al-Baihaqi menjelaskan 20 rakaat tarawih ditambah 3 rakaat witir. Sebagian ulama dan lembaga fatwa (misalnya Majelis Tarjih Muhammadiyah) menilai riwayat 20 rakaat lemah dan memegang 11 rakaat; ulama lain menilainya kuat dan memegang praktik para sahabat. Mazhab Maliki dikenal dengan bilangan yang lebih banyak lagi. Kedua versi (11 dan 23) diamalkan; ikuti imam di masjid dan saling menghormati.",
    s: "HR. Bukhari no. 2010 (Abdurrahman bin Abdul Qari; praktik zaman Umar) dan al-Muwaththa' Malik (riwayat Yazid bin Ruman, 23 rakaat); shalat malam dua-dua: HR. Bukhari no. 990 dan Muslim no. 749 (Ibnu Umar); keutamaan qiyam Ramadhan: HR. Bukhari no. 37 dan Muslim no. 759 (Abu Hurairah)" }
);
/* ===== IB2-E2b2: tab Shalat, kategori Shalat sunnah, 2 kartu shalat malam (tahajud dan witir). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak. Hanya menambah isi ke IBX_SHL (tanpa kode tampilan baru). Membalik: patch_ib2e2b2.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-tahajud", c: "sunnah", t: "Shalat tahajud (qiyamul lail)", v: 0, g: "Shahih",
    k: "tahajud tahajjud qiyamul lail qiyam lail shalat malam sepertiga malam terakhir bangun tidur dua rakaat doa tahajud",
    hk: "Sunnah muakkadah; shalat sunnah yang paling utama sesudah shalat wajib.",
    rk: "Paling sedikit 2 rakaat; dikerjakan dua-dua tanpa batas atas",
    w: "Sesudah tidur malam sampai terbit fajar; paling utama pada sepertiga malam terakhir, ketika Allah turun ke langit dunia dan menjawab doa.",
    p: [
      { s: "Bangun tidur, baca doa bangun tidur, bersiwak, lalu berwudhu.", d: ["bangun"] },
      { s: "Buka dengan dua rakaat ringan, lalu lanjutkan shalat dua rakaat satu salam sebanyak yang dikehendaki. Niat dalam hati untuk shalat tahajud." },
      { s: "Tiap rakaat membaca Al-Fatihah dan surah pilihan; bacaan, rukuk, dan sujud boleh dipanjangkan sesuai kemampuan.", d: ["fatihah"] },
      { s: "Doa tahajud riwayat Ibnu Abbas dibaca setelah takbiratul ihram (sebagai doa pembuka), dimulai dengan “Allahumma lakal hamdu, anta qayyimus samawati wal ardhi wa man fihinna ...”. Teksnya panjang dan belum dimuat penuh di kartu ini; bacalah dari kitab doa yang terpercaya." },
      { s: "Tutup shalat malam dengan witir (1, 3, atau 5 rakaat); lihat kartu Shalat witir. Bila kantuk menyerang saat shalat, tidurlah dulu sampai kantuk hilang." },
      { s: "Perbanyak doa dan istighfar sebelum Subuh; waktu sepertiga malam terakhir adalah waktu yang dianjurkan untuk memohon." }
    ],
    n: "Menurut jumhur ulama tahajud ialah shalat malam sesudah tidur; shalat malam tanpa tidur lebih dulu disebut qiyamul lail. Hadits tidak membatasi jumlah rakaatnya; kebiasaan Rasulullah ﷺ adalah sebelas rakaat dengan witir. Bila khawatir tidak bangun di akhir malam, kerjakan witir sebelum tidur.",
    s: "HR. Muslim no. 1163 (Abu Hurairah; shalat malam paling utama sesudah wajib); sepertiga malam terakhir: HR. Bukhari no. 1145 dan Muslim no. 758 (Abu Hurairah); dua-dua: HR. Bukhari no. 990 dan Muslim no. 749 (Ibnu Umar); dua rakaat ringan: HR. Muslim no. 768 (Abu Hurairah); siwak: HR. Bukhari no. 245 dan Muslim no. 255 (Hudzaifah); doa tahajud: HR. Bukhari no. 1120 dan Muslim no. 769 (Ibnu Abbas); kantuk: HR. Bukhari no. 212 dan Muslim no. 786 (Aisyah)" },
  { id: "sh-witir", c: "sunnah", t: "Shalat witir (1, 3, atau 5 rakaat)", v: 0, g: "Shahih",
    k: "witir ganjil satu tiga lima rakaat penutup shalat malam isya qunut sabbihisma kafirun ikhlas subhanal malikil quddus",
    hk: "Sunnah muakkadah menurut jumhur ulama; mazhab Hanafi memandangnya wajib.",
    rk: "Ganjil: 1, 3, atau 5 rakaat (boleh lebih)",
    w: "Sesudah shalat Isya sampai terbit fajar; lebih utama diakhirkan ke akhir malam bagi yang yakin bangun, dan sebelum tidur bagi yang khawatir tidak bangun.",
    p: [
      { s: "Niat dalam hati untuk shalat witir. Jadikan witir sebagai penutup shalat malam." },
      { s: "Satu rakaat: takbiratul ihram, Al-Fatihah dan surah, rukuk, sujud, tasyahud akhir, lalu salam.", d: ["fatihah"] },
      { s: "Tiga rakaat, cara pertama (lebih utama menurut mazhab Syafi'i): dua rakaat lalu salam, kemudian satu rakaat lalu salam. Cara kedua: tiga rakaat bersambung dengan satu tasyahud di rakaat terakhir saja agar tidak menyerupai Maghrib." },
      { s: "Surah yang dianjurkan pada tiga rakaat: Al-A'la pada rakaat pertama, Al-Kafirun pada rakaat kedua, dan Al-Ikhlas pada rakaat ketiga; surahnya dapat dibuka di tab Al-Qur'an." },
      { s: "Lima rakaat: dikerjakan bersambung dengan duduk tasyahud dan salam hanya di rakaat kelima." },
      { s: "Doa qunut dibaca pada rakaat terakhir sesudah i'tidal; menurut mazhab Syafi'i pada separuh akhir Ramadhan, dan mazhab lain berbeda (misalnya mazhab Hanafi membacanya sepanjang tahun sebelum rukuk).", d: ["qunut"] },
      { s: "Sesudah salam, baca tiga kali; pada kali ketiga panjangkan dan keraskan suara.", a: { ar: "سُبْحَانَ الْمَلِكِ الْقُدُّوسِ", lat: "Subhanal malikil quddus.", tr: "Maha Suci Raja Yang Maha Suci." } }
    ],
    n: "Dalam satu malam tidak ada dua witir. Bila sudah witir sebelum tidur lalu bangun untuk tahajud, shalatlah dua-dua tanpa mengulang witir. Bilangan lebih dari lima (tujuh dan sembilan) juga diriwayatkan; rinciannya dapat ditanyakan kepada ustadz.",
    s: "HR. Abu Dawud no. 1422 dan Nasa'i no. 1710 (Abu Ayyub; satu, tiga, atau lima rakaat); penutup shalat malam: HR. Bukhari no. 998 dan Muslim no. 751 (Ibnu Umar); lima rakaat: HR. Muslim no. 737 (Aisyah); surah dan dzikir sesudah witir: HR. Abu Dawud no. 1423 dan Nasa'i no. 1699 (Ubay bin Ka'b); tidak ada dua witir: HR. Abu Dawud no. 1439 dan Tirmidzi no. 470 (Thalq bin Ali); witir sebelum tidur: HR. Bukhari no. 1981 dan Muslim no. 721 (Abu Hurairah)" }
);
/* ===== IB2-E3a1: tab Shalat, kategori baru "Shalat karena sebab" dengan 1 kartu (istikharah). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak; nomor Bukhari 1162, 6382, 7390 dan inti isi dicek ke hadeethenc.com dan hadithanswers.com. Hanya menambah isi ke IBX_SHC dan IBX_SHL (tanpa kode tampilan baru). Membalik: patch_ib2e3a1.py --reverse ===== */
IBX_SHC.push(["sebab", "Shalat karena sebab"]);
IBX_SHL.push(
  { id: "sh-istikharah", c: "sebab", t: "Shalat istikharah", v: 0, g: "Shahih",
    k: "istikharah istikhoroh pilihan ragu bimbang memilih keputusan petunjuk jodoh pekerjaan pindah doa istikharah dua rakaat astakhiruka",
    hk: "Sunnah (dianjurkan) pada urusan mubah yang belum jelas pilihan terbaiknya; tidak dilakukan untuk perkara wajib atau haram.",
    rk: "2 rakaat (di luar shalat wajib)",
    w: "Kapan saja selain waktu terlarang, sebelum mengambil keputusan.",
    p: [
      { s: "Pastikan urusannya mubah dan sudah dipikirkan. Berwudhu, lalu niat dalam hati untuk shalat istikharah." },
      { s: "Shalat dua rakaat di luar shalat wajib (misalnya sesudah shalat sunnah atau di waktu lapang yang tidak terlarang)." },
      { s: "Tiap rakaat membaca Al-Fatihah dan surah pilihan. Tidak ada surah khusus dari hadits; sebagian ulama menganjurkan Al-Kafirun pada rakaat pertama dan Al-Ikhlas pada rakaat kedua.", d: ["fatihah"] },
      { s: "Sesudah salam, pujilah Allah dan bershalawat, lalu baca doa istikharah. Pada kata “hadzal amra” (urusan ini), sebutkan urusan yang dimaksud. Sebagian ulama membolehkan membaca doa sebelum salam.", a: { ar: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ. اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي", lat: "Allahumma inni astakhiruka bi 'ilmika, wa astaqdiruka bi qudratika, wa as'aluka min fadlikal 'azhim, fa innaka taqdiru wa la aqdir, wa ta'lamu wa la a'lam, wa anta 'allamul ghuyub. Allahumma in kunta ta'lamu anna hadzal amra khairun li fi dini wa ma'asyi wa 'aqibati amri, faqdurhu li wa yassirhu li tsumma barik li fih. Wa in kunta ta'lamu anna hadzal amra syarrun li fi dini wa ma'asyi wa 'aqibati amri, fashrifhu 'anni washrifni 'anhu, waqdur liyal khaira haitsu kana tsumma ardhini.", tr: "Ya Allah, aku memohon pilihan terbaik kepada-Mu dengan ilmu-Mu, memohon kekuatan dengan kekuasaan-Mu, dan memohon karunia-Mu yang agung; sungguh Engkau berkuasa sedang aku tidak, Engkau mengetahui sedang aku tidak, dan Engkaulah Yang Maha Mengetahui perkara gaib. Ya Allah, bila Engkau mengetahui urusan ini (sebut urusannya) baik bagiku dalam agamaku, kehidupanku, dan akhir urusanku, maka takdirkan dan mudahkanlah untukku, lalu berkahilah aku di dalamnya. Bila Engkau mengetahui urusan ini buruk bagiku dalam agamaku, kehidupanku, dan akhir urusanku, maka jauhkanlah ia dariku dan jauhkan aku darinya, takdirkan kebaikan untukku di mana pun adanya, kemudian jadikan aku ridha dengannya." } },
      { s: "Sesudah itu lanjutkan urusan yang dimudahkan Allah dan hati menjadi lapang; bila belum mantap, boleh mengulang shalat dan doanya. Bertawakallah dan terimalah hasilnya." }
    ],
    n: "Istikharah bukan untuk perkara wajib atau sunnah yang memang diperintahkan (hukum asalnya dikerjakan), dan bukan untuk menghindari perkara haram atau makruh. Hadits tidak mensyaratkan mimpi atau tanda khusus. Para ulama juga menganjurkan bermusyawarah dengan orang yang berilmu dan tepercaya. Dalam riwayat doa ada ungkapan alternatif “fi ajili amri wa ajilih” sebagai ganti “fi dini wa ma'asyi wa 'aqibati amri”.",
    s: "HR. Bukhari no. 1162, 6382, dan 7390 (Jabir bin Abdullah); \"sebutkan hajatnya\" termasuk dalam riwayat yang sama" }
);
/* ===== IB2-E3a2: tab Shalat, kategori Shalat karena sebab, 2 kartu (hajat dan taubat). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak; nomor dan derajat dicek ke sunnah.com, hadeethenc.com, dan tohed.com. Hanya menambah isi ke IBX_SHL (tanpa kode tampilan baru). Membalik: patch_ib2e3a2.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-hajat", c: "sebab", t: "Shalat hajat", v: 0, g: "Dha'if (lemah)",
    k: "hajat hajah kebutuhan keinginan keperluan dikabulkan doa hajat dua rakaat memohon kepada allah",
    hk: "Diperselisihkan: haditsnya lemah. Sebagian ulama membolehkannya sebagai shalat sunnah dua rakaat yang disusul doa; sebagian lain tidak menganjurkannya sebagai shalat khusus.",
    rk: "2 rakaat",
    w: "Kapan saja selain waktu terlarang, ketika memiliki kebutuhan kepada Allah atau kepada seseorang.",
    p: [
      { s: "Niat dalam hati untuk shalat hajat, lalu berwudhu dengan sempurna." },
      { s: "Shalat dua rakaat; tiap rakaat membaca Al-Fatihah dan surah pilihan.", d: ["fatihah"] },
      { s: "Sesudah salam, pujilah Allah dan bershalawat kepada Nabi ﷺ." },
      { s: "Sebutkan hajat dengan bahasa sendiri, merendah, dan bersungguh-sungguh. Boleh membaca doa kebaikan dunia dan akhirat.", d: ["sapujagat"] },
      { s: "Serahkan hasilnya kepada Allah dan jangan berputus asa bila belum terkabul.", d: ["hasbi"] }
    ],
    n: "Hadits shalat hajat (Tirmidzi no. 479 dan Ibnu Majah no. 1384) dinilai lemah: Tirmidzi menyebutnya gharib dan menilai perawinya, Fa'id bin Abdurrahman, lemah; Al-Albani menilainya sangat lemah. Karena itu teks doa yang menyertai hadits itu tidak dimuat di kartu ini. Yang ada dalilnya ialah anjuran memohon pertolongan dengan sabar dan shalat. Bila memilih mengamalkannya, niatkan sebagai shalat sunnah dua rakaat yang disusul doa, bukan sebagai ketentuan yang pasti. Untuk memilih di antara dua urusan yang mubah, lihat shalat istikharah.",
    s: "HR. Tirmidzi no. 479 dan Ibnu Majah no. 1384 (Abdullah bin Abi Aufa; sanadnya lemah); QS. Al-Baqarah: 45 dan 153 (memohon pertolongan dengan sabar dan shalat)" },
  { id: "sh-taubat", c: "sebab", t: "Shalat taubat", v: 0, g: "Hasan",
    k: "taubat tobat taubat nasuha ampunan dosa istighfar menyesal dua rakaat shalat taubat",
    hk: "Sunnah (dianjurkan) bagi yang berbuat dosa; bertaubat dari dosa itu sendiri wajib.",
    rk: "2 rakaat",
    w: "Segera sesudah sadar telah berbuat dosa, selain waktu terlarang.",
    p: [
      { s: "Sadari dosanya: menyesal, berhenti dari dosa itu, dan bertekad tidak mengulanginya. Bila dosanya menyangkut hak orang lain, kembalikan hak itu atau mintalah maaf (syarat taubat menurut para ulama)." },
      { s: "Bersuci dengan baik: berwudhu dengan sempurna." },
      { s: "Shalat dua rakaat; tiap rakaat membaca Al-Fatihah dan surah pilihan.", d: ["fatihah"] },
      { s: "Sesudah salam, mohon ampun kepada Allah dengan sungguh-sungguh; boleh membaca Sayyidul istighfar.", d: ["sayyidul"] },
      { s: "Perbanyak amal baik sesudahnya dan jauhi hal yang mengajak pada dosa itu. Bila terjatuh lagi, segera bertaubat kembali dan jangan berputus asa dari rahmat Allah." }
    ],
    n: "Hadits ini diriwayatkan dari Abu Bakar ash-Shiddiq melalui Ali bin Abi Thalib; dalam sebagian riwayat Rasulullah ﷺ kemudian membaca ayat tentang orang yang berbuat dosa lalu mengingat Allah dan memohon ampun (QS. Ali Imran: 135). Taubat yang dimaksud ialah taubat nasuha (QS. At-Tahrim: 8).",
    s: "HR. Abu Dawud no. 1521, Tirmidzi no. 406, dan Ibnu Majah no. 1395 (Abu Bakar ash-Shiddiq); QS. Ali Imran: 135; QS. At-Tahrim: 8; QS. Az-Zumar: 53" }
);
/* ===== IB2-E3b: tab Shalat, kategori baru "Shalat berjamaah khusus" dengan 1 kartu (jenazah). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak; nomor hadits Bukhari 1245 dan 1335, Muslim 951, 957, dan 963, Abu Dawud 3199 dan 3201, Tirmidzi 1024, Ibnu Majah 1498 dicek ke sunnah.com, tohed.com, dan hadithunlocked.com. Menambah isi ke IBX_SHC dan IBX_SHL (data) ditambah dua perubahan kecil pada tampilan (label "Bentuk shalat" untuk kartu tanpa rakaat, dan kalimat pengantar tab). Membalik: patch_ib2e3b.py --reverse ===== */
IBX_SHC.push(["khusus", "Shalat berjamaah khusus"]);
IBX_SHL.push(
  { id: "sh-jenazah", c: "khusus", t: "Shalat jenazah", v: 0, g: "Shahih",
    k: "jenazah janazah jenasah mayit mayat meninggal wafat takbir empat dishalatkan kafan fardhu kifayah doa jenazah shalat jenazah sholat jenazah",
    hk: "Fardhu kifayah menurut jumhur ulama: bila sebagian muslim di tempat itu sudah mengerjakannya, gugurlah kewajiban yang lain; bila tidak ada yang mengerjakan, semuanya berdosa.",
    rk: "Empat takbir, tanpa rukuk dan sujud",
    w: "Kapan saja ada jenazah muslim, disegerakan dan tidak ditunda tanpa alasan.",
    p: [
      { s: "Pastikan jenazah muslim sudah dimandikan dan dikafani, lalu diletakkan di depan imam. Tidak ada adzan dan iqamah." },
      { s: "Berwudhu, menutup aurat, dan menghadap kiblat. Niat dalam hati untuk menshalatkan jenazah. Shalat dikerjakan dengan berdiri (bagi yang mampu), imam di depan, makmum bershaf di belakang. Tidak ada rukuk dan sujud." },
      { s: "Takbir pertama (takbiratul ihram), lalu membaca Al-Fatihah.", d: ["fatihah"] },
      { s: "Takbir kedua, lalu membaca shalawat atas Nabi ﷺ (misalnya shalawat Ibrahimiyah).", d: ["shalawatibrahim"] },
      { s: "Takbir ketiga, lalu mendoakan jenazah dengan tulus. Doa dari Auf bin Malik (kata ganti untuk jenazah laki-laki):", a: { ar: "اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ، وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ، وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ، وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ، وَأَدْخِلْهُ الْجَنَّةَ، وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ أَوْ مِنْ عَذَابِ النَّارِ", lat: "Allahummaghfir lahu warhamhu wa 'afihi wa'fu 'anhu, wa akrim nuzulahu wa wassi' mudkhalahu, waghsilhu bil-ma'i wats-tsalji wal-barad, wa naqqihi minal-khathaya kama naqqaitats-tsaubal-abyadha minad-danas, wa abdilhu daran khairan min darihi, wa ahlan khairan min ahlihi, wa zaujan khairan min zaujihi, wa adkhilhul-jannah, wa a'idzhu min 'adzabil-qabri aw min 'adzabin-nar.", tr: "Ya Allah, ampunilah dia, rahmatilah dia, selamatkanlah dia, dan maafkanlah dia. Muliakanlah tempat singgahnya dan luaskanlah tempat masuknya. Bersihkanlah dia dengan air, salju, dan es. Sucikanlah dia dari kesalahan sebagaimana pakaian putih disucikan dari kotoran. Gantikanlah untuknya rumah yang lebih baik dari rumahnya, keluarga yang lebih baik dari keluarganya, dan pasangan yang lebih baik dari pasangannya. Masukkanlah dia ke surga, dan lindungilah dia dari azab kubur atau dari azab neraka." } },
      { s: "Boleh juga (atau sebagai tambahan) membaca doa umum riwayat Abu Hurairah, yang mencakup yang hidup dan yang telah wafat:", a: { ar: "اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيرِنَا وَكَبِيرِنَا، وَذَكَرِنَا وَأُنْثَانَا. اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ، اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ وَلَا تُضِلَّنَا بَعْدَهُ", lat: "Allahummaghfir lihayyina wa mayyitina, wa syahidina wa gha'ibina, wa shaghirina wa kabirina, wa dzakarina wa untsana. Allahumma man ahyaitahu minna fa ahyihi 'alal-islam, wa man tawaffaitahu minna fa tawaffahu 'alal-iman. Allahumma la tahrimna ajrahu wa la tudhillana ba'dahu.", tr: "Ya Allah, ampunilah orang yang hidup di antara kami dan yang telah wafat, yang hadir dan yang tidak hadir, yang kecil dan yang besar, laki-laki dan perempuan kami. Ya Allah, siapa yang Engkau hidupkan di antara kami, hidupkanlah dia di atas Islam, dan siapa yang Engkau wafatkan di antara kami, wafatkanlah dia di atas iman. Ya Allah, jangan haramkan kami dari pahalanya dan jangan sesatkan kami sesudahnya." } },
      { s: "Takbir keempat, lalu diam sejenak. Boleh berdoa, misalnya dengan bagian akhir doa Abu Hurairah di atas (jangan haramkan kami dari pahalanya dan jangan sesatkan kami sesudahnya)." },
      { s: "Mengucapkan salam ke kanan. Sebagian ulama menganjurkan satu salam, sebagian dua salam (kanan dan kiri).", d: ["salamshalat"] }
    ],
    n: "Empat takbir adalah yang paling masyhur (Rasulullah ﷺ menshalatkan An-Najasyi dengan empat takbir, HR. Bukhari no. 1245 dan Muslim no. 951). Ada riwayat shahih lima takbir dari Zaid bin Arqam (HR. Muslim no. 957). Membaca Al-Fatihah berdasar riwayat Ibnu Abbas yang berkata bahwa itu sunnah (HR. Bukhari no. 1335); para ulama berbeda pendapat tentang hukumnya (sebagian mewajibkan, sebagian menganjurkan). Rasulullah ﷺ memerintahkan, \"Apabila kalian menshalatkan jenazah, ikhlaskanlah doa untuknya\" (HR. Abu Dawud no. 3199); inti shalat jenazah ialah mendoakan. Sesuaikan kata ganti: untuk jenazah perempuan (laha, warhamha, dan seterusnya), untuk beberapa jenazah (lahum). Untuk jenazah anak kecil, Bukhari menyebut doa riwayat Al-Hasan al-Bashri \"Allahummaj'alhu lana farathan wa salafan wa ajran\" (disebut tanpa sanad pada bab bacaan Al-Fatihah atas jenazah). Antarriwayat ada perbedaan kecil lafaz doa (misalnya kalimat penutup doa Auf bin Malik); kartu ini mengikuti lafaz yang tercantum pada kutipan di atas. Untuk yang wafat di tempat lain, ada shalat ghaib berdasar kisah An-Najasyi; para ulama berbeda soal cakupannya.",
    s: "HR. Bukhari no. 1245 dan Muslim no. 951 (Abu Hurairah; empat takbir atas An-Najasyi); HR. Bukhari no. 1335 (Ibnu Abbas; Al-Fatihah); HR. Muslim no. 957 (Zaid bin Arqam; lima takbir); HR. Muslim no. 963 (Auf bin Malik; doa jenazah); HR. Abu Dawud no. 3201, Tirmidzi no. 1024, dan Ibnu Majah no. 1498 (Abu Hurairah; doa umum); HR. Abu Dawud no. 3199 (Abu Hurairah; ikhlaskan doa)" }
);
/* ===== IB2-E3c1: tab Shalat, kategori "Shalat berjamaah khusus" bertambah 1 kartu (gerhana matahari dan bulan). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak; nomor hadits Bukhari 1041, 1043-1046, 1051, 1052, 1054, 1059, 1060, 1065 dan Muslim 901 dicek ke sunnah.com, hadithunlocked.com, islamtics.com; Muslim 911 dan 912 hanya dari islamqa.info; ringkasan pendapat ulama dari nu.or.id. Membalik: patch_ib2e3c1.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-gerhana", c: "khusus", t: "Shalat gerhana (matahari dan bulan)", v: 0, g: "Shahih",
    k: "gerhana kusuf khusuf gerhana matahari gerhana bulan shalat gerhana sholat gerhana dua rukuk tanda kekuasaan allah ash-shalatu jami'ah jamiah",
    hk: "Sunnah muakkadah (sangat dianjurkan) menurut mayoritas ulama, baik untuk gerhana matahari (kusuf) maupun gerhana bulan (khusuf); lebih utama dikerjakan berjamaah.",
    rk: "2 rakaat, tiap rakaat dua kali berdiri dan dua kali rukuk",
    w: "Sejak gerhana mulai terlihat sampai gerhana itu tersingkap (selesai).",
    p: [
      { s: "Shalat dikerjakan ketika gerhana matahari atau gerhana bulan sedang terjadi. Berwudhu, menutup aurat, menghadap kiblat, dan berniat dalam hati. Lebih utama berjamaah di masjid atau lapangan. Tidak ada adzan dan iqamah." },
      { s: "Jamaah diseru dengan kalimat berikut, lalu berkumpul dan bershaf:", a: { ar: "الصَّلَاةُ جَامِعَةٌ", lat: "Ash-shalatu jami'ah.", tr: "Marilah shalat berjamaah." } },
      { s: "Rakaat pertama, berdiri pertama: takbiratul ihram, doa iftitah (boleh dibaca), Al-Fatihah, lalu surat yang panjang.", d: ["iftitah1", "iftitah2", "fatihah"] },
      { s: "Takbir, lalu rukuk yang panjang dengan bacaan rukuk. Bangkit dari rukuk dengan \"Sami'allahu liman hamidah, rabbana wa lakal hamd\".", d: ["ruku", "itidal"] },
      { s: "Berdiri kedua (belum sujud): membaca Al-Fatihah dan surat lagi, tetapi lebih pendek dari yang pertama. Takbir, rukuk kedua yang lebih pendek dari rukuk pertama, lalu bangkit i'tidal." },
      { s: "Sujud dua kali dengan sujud yang panjang, diselingi duduk di antara dua sujud.", d: ["sujud", "duasujud"] },
      { s: "Rakaat kedua dikerjakan seperti rakaat pertama (berdiri, rukuk, berdiri lagi, rukuk lagi, lalu dua sujud), dengan bacaan dan gerakan yang lebih pendek daripada rakaat pertama." },
      { s: "Duduk tasyahud akhir, membaca shalawat, lalu salam ke kanan dan ke kiri.", d: ["tasyahud", "shalawatibrahim", "salamshalat"] },
      { s: "Setelah salam, imam menyampaikan khutbah atau nasihat: memuji Allah, mengingatkan bahwa gerhana adalah tanda kekuasaan-Nya yang tidak terjadi karena kematian atau kelahiran seseorang, serta mengajak berdoa, bertakbir, bersedekah, dan beristighfar. Selama gerhana berlangsung, perbanyak dzikir, doa, istighfar, dan sedekah." }
    ],
    n: "Rasulullah ﷺ bersabda bahwa matahari dan bulan adalah dua tanda kekuasaan Allah, keduanya tidak gerhana karena kematian atau kelahiran seseorang; bila melihatnya, berdoalah, bertakbirlah, shalatlah, dan bersedekahlah (HR. Bukhari no. 1044, 1041, dan 1059). Sabda ini disampaikan ketika orang-orang mengaitkan gerhana dengan wafatnya putra beliau, Ibrahim (HR. Bukhari no. 1043 dan 1060). Panjang bacaan: Ibnu Abbas menggambarkan berdiri pertama kira-kira sepanjang surat Al-Baqarah (HR. Bukhari no. 1052); kartu ini tidak menetapkan surat tertentu. Sujud pun dipanjangkan (HR. Bukhari no. 1051). Suara bacaan: dalam riwayat Aisyah, beliau mengeraskan bacaan (HR. Bukhari no. 1065); sebagian ulama (misalnya mazhab Syafi'i) menganjurkan bacaan pelan pada gerhana matahari dan keras pada gerhana bulan, sebagian lain mengeraskan pada keduanya mengikuti riwayat ini. Khutbah: para ulama berbeda tentang caranya; mazhab Syafi'i menganjurkan dua khutbah seperti khutbah Jumat, sedangkan riwayat Aisyah menyebut Nabi ﷺ berkhutbah (menyampaikan nasihat) setelah shalat; tidak ada khutbah bagi yang shalat sendirian. Memerdekakan hamba sahaya disebut dalam hadits Asma' (HR. Bukhari no. 1054). Menurut sebagian ulama (Malik dan Abu Hanifah, sebagaimana dikutip NU Online), gerhana bulan dikerjakan sendiri-sendiri dua rakaat seperti shalat sunnah biasa. Kartu ini tidak memuat jadwal gerhana; rujuklah lembaga resmi.",
    s: "HR. Bukhari no. 1046 dan Muslim no. 901 (Aisyah; dua rakaat, dua rukuk tiap rakaat, khutbah); HR. Bukhari no. 1044 (Aisyah; takbir, shalat, sedekah); HR. Bukhari no. 1041 dan Muslim no. 911 (Abu Mas'ud; gerhana tanda kekuasaan Allah); HR. Bukhari no. 1059 dan Muslim no. 912 (Abu Musa; dzikir, doa, istighfar); HR. Bukhari no. 1045 dan 1051 (Abdullah bin Amr; seruan shalat berjamaah); HR. Bukhari no. 1052 (Ibnu Abbas; berdiri sepanjang Al-Baqarah); HR. Bukhari no. 1065 (Aisyah; bacaan keras); HR. Bukhari no. 1054 (Asma binti Abu Bakar; memerdekakan hamba sahaya); HR. Bukhari no. 1043 dan 1060 (Mughirah bin Syu'bah; wafat Ibrahim, berdoa dan shalat hingga tersingkap)" }
);
/* ===== IB2-E3c2: tab Shalat, kategori "Shalat berjamaah khusus" bertambah 1 kartu (istisqa, shalat meminta hujan). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak; nomor hadits Bukhari 1010, 1012, 1013, 1025, 1031, Abu Dawud 1165, 1169, 1176 dicek ke sunnah.com, hadithunlocked.com, en.tohed.com, dorar.net; Muslim 894 dan 897 dari en.tohed.com dan dorar.net; Tirmidzi 558 dari hadithunlocked.com; tata cara mazhab Syafi'i dan ringkasan pendapat ulama dari nu.or.id. Membalik: patch_ib2e3c2.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-istisqa", c: "khusus", t: "Shalat istisqa (meminta hujan)", v: 0, g: "Shahih",
    k: "istisqa istisqo istiska shalat istisqa sholat istisqa minta hujan meminta hujan doa minta hujan kemarau kekeringan paceklik rida selendang membalik rida tanah lapang mushalla allahummasqina aghitsna",
    hk: "Sunnah muakkadah (sangat dianjurkan) menurut mayoritas ulama ketika terjadi kemarau atau kekeringan; lebih utama dikerjakan berjamaah di tanah lapang dan dipimpin imam.",
    rk: "2 rakaat, seperti shalat Id",
    w: "Dikerjakan ketika terjadi kemarau atau kekeringan. Menurut pendapat yang shahih dalam mazhab Syafi'i waktunya tidak terikat: boleh pagi, siang, sore, atau malam (dikutip NU Online); sebagian ulama menyamakan waktunya dengan shalat Id.",
    p: [
      { s: "Persiapan: imam mengajak warga bertaubat, memperbanyak istighfar, bersedekah, menghentikan kezaliman dan mengembalikan hak orang lain, serta berdamai dari perselisihan. Menurut sebagian ulama (mazhab Syafi'i), warga dianjurkan berpuasa tiga hari berturut-turut sebelumnya, lalu pada hari keempat berangkat bersama-sama." },
      { s: "Berangkat ke tanah lapang (mushalla) dengan pakaian sederhana, bukan pakaian mewah, dalam keadaan merendah, khusyuk, dan tenang. Berwudhu, menutup aurat, dan menghadap kiblat saat shalat." },
      { s: "Berniat dalam hati; boleh juga melafalkannya. Imam mengganti \"ma'muman\" dengan \"imaman\".", a: { ar: "أُصَلِّي سُنَّةَ الِاسْتِسْقَاءِ رَكْعَتَيْنِ مَأْمُومًا لِلَّهِ تَعَالَى", lat: "Ushalli sunnatal istisqa'i rak'ataini ma'muman lillahi ta'ala.", tr: "Aku berniat shalat sunnah istisqa (meminta hujan) dua rakaat sebagai makmum karena Allah Ta'ala." } },
      { s: "Rakaat pertama: takbiratul ihram dan doa iftitah. Menurut mazhab Syafi'i, lalu bertakbir tujuh kali (di luar takbiratul ihram) sebelum Al-Fatihah, seperti shalat Id. Kemudian membaca Al-Fatihah dan surat; imam mengeraskan bacaan.", d: ["iftitah1", "iftitah2", "fatihah"] },
      { s: "Rukuk dengan bacaan rukuk, bangkit i'tidal, lalu dua kali sujud diselingi duduk di antara dua sujud.", d: ["ruku", "itidal", "sujud", "duasujud"] },
      { s: "Rakaat kedua: bangkit sambil bertakbir, lalu menurut mazhab Syafi'i bertakbir lima kali sebelum Al-Fatihah. Membaca Al-Fatihah dan surat, rukuk, i'tidal, dan dua sujud seperti rakaat pertama." },
      { s: "Duduk tasyahud akhir, membaca shalawat, lalu salam ke kanan dan ke kiri.", d: ["tasyahud", "shalawatibrahim", "salamshalat"] },
      { s: "Khutbah: menurut mazhab Syafi'i, imam berkhutbah dua kali (boleh sekali) setelah shalat, dan khutbah sesudah shalat lebih utama. Khutbah dibuka dengan istighfar sebagai pengganti takbir pada khutbah Id: sembilan kali sebelum khutbah pertama dan tujuh kali sebelum khutbah kedua. Isinya mengajak bertaubat, memperbanyak istighfar, dan berdoa." },
      { s: "Setelah lewat sepertiga khutbah kedua, imam menghadap kiblat, mengangkat kedua tangan, dan memperbanyak doa dengan suara pelan maupun lantang; jamaah mengamini. Pada saat itu imam dan jamaah membalik selendang atau kain atas mereka (rida'), lalu imam kembali menghadap jamaah." },
      { s: "Doa yang diajarkan Nabi ﷺ ketika meminta hujan:", a: { ar: "اللَّهُمَّ اسْقِنَا غَيْثًا مُغِيثًا مَرِيئًا مَرِيعًا نَافِعًا غَيْرَ ضَارٍّ عَاجِلًا غَيْرَ آجِلٍ", lat: "Allahummasqina ghaitsan mughitsan mari'an mari'an nafi'an ghaira dharrin 'ajilan ghaira ajilin.", tr: "Ya Allah, berilah kami hujan yang menolong, menyegarkan, menyuburkan, bermanfaat dan tidak membahayakan, yang datang segera dan tidak tertunda." } },
      { s: "Doa lain dari Nabi ﷺ:", a: { ar: "اللَّهُمَّ اسْقِ عِبَادَكَ وَبَهَائِمَكَ، وَانْشُرْ رَحْمَتَكَ، وَأَحْيِ بَلَدَكَ الْمَيِّتَ", lat: "Allahummasqi 'ibadaka wa baha'imaka, wansyur rahmataka, wa ahyi baladakal mayyit.", tr: "Ya Allah, berilah minum hamba-hamba-Mu dan hewan ternak-Mu, limpahkanlah rahmat-Mu, dan hidupkanlah negeri-Mu yang mati (gersang)." } },
      { s: "Doa singkat yang diucapkan tiga kali dalam hadits Anas:", a: { ar: "اللَّهُمَّ أَغِثْنَا، اللَّهُمَّ أَغِثْنَا، اللَّهُمَّ أَغِثْنَا", lat: "Allahumma aghitsna, Allahumma aghitsna, Allahumma aghitsna.", tr: "Ya Allah, berilah kami hujan (diucapkan tiga kali)." } }
    ],
    n: "Dasar: Rasulullah ﷺ keluar ke tanah lapang untuk meminta hujan, menghadap kiblat, membalik rida'nya, dan shalat dua rakaat (HR. Bukhari no. 1012 dan Muslim no. 894); dalam riwayat lain beliau berdoa menghadap kiblat, membalik rida', lalu shalat dua rakaat dengan bacaan keras (HR. Bukhari no. 1025). Ibnu Abbas menggambarkan beliau keluar dengan merendah, berpakaian sederhana, khusyuk, dan tenang, lalu shalat dua rakaat seperti shalat Id, dan tidak berkhutbah seperti khutbah biasa (HR. Abu Dawud no. 1165 dan Tirmidzi no. 558). Mengangkat tangan: Anas menyebut beliau mengangkat kedua tangan sangat tinggi dalam doa istisqa hingga tampak putih ketiaknya (HR. Bukhari no. 1031). Perbedaan tata cara: mazhab Syafi'i menyerupakan shalat ini dengan shalat Id (takbir tujuh dan lima kali) dan menganjurkan khutbah sesudah shalat, sedangkan riwayat Ibnu Abbas menafikan khutbah seperti biasa; dalam Al-Muwattha' Imam Malik menyebut shalat dua rakaat dikerjakan sebelum khutbah, lalu imam berdoa menghadap kiblat sambil membalik rida' dan bacaan dikeraskan di kedua rakaat; menurut keterangan dalam syarah hadits (satu sumber), Imam Abu Hanifah tidak menetapkan shalat istisqa (cukup doa dan istighfar), sedangkan kedua muridnya (Abu Yusuf dan Muhammad) menyatakannya sunnah. Tingkatan: ulama Syafi'i membagi istisqa menjadi tiga tingkat, yaitu hanya berdoa, berdoa setelah shalat atau khutbah, dan yang paling lengkap dengan taubat, puasa, serta shalat istisqa (Nihayatuz Zain, dikutip NU Online). Tawasul: Umar bin Khattab meminta Abbas, paman Nabi ﷺ, untuk berdoa meminta hujan (HR. Bukhari no. 1010). Bila hujan terlalu lebat, Nabi ﷺ berdoa \"Allahumma hawalaina wa la 'alaina\" (Ya Allah, turunkan di sekitar kami dan jangan menimpa kami) (HR. Bukhari no. 1013). Derajat doa: doa Allahummasqina (Abu Dawud no. 1169) dinilai Shahih oleh Al-Albani, doa Allahummasqi 'ibadaka (Abu Dawud no. 1176 dan Malik) dinilai Hasan oleh Al-Albani, dan doa Allahumma aghitsna terdapat dalam Bukhari dan Muslim. Kartu ini tidak memuat penetapan waktu pelaksanaan setempat; rujuklah pemuka agama atau lembaga keagamaan setempat.",
    s: "HR. Bukhari no. 1012 dan Muslim no. 894 (Abdullah bin Zaid; keluar ke mushalla, menghadap kiblat, membalik rida', dua rakaat); HR. Bukhari no. 1025 (Abdullah bin Zaid; bacaan keras); HR. Abu Dawud no. 1165 dan Tirmidzi no. 558 (Ibnu Abbas; merendah, dua rakaat seperti shalat Id); HR. Bukhari no. 1031 (Anas; mengangkat tangan tinggi); HR. Bukhari no. 1010 (Anas; Umar dan Abbas); HR. Bukhari no. 1013 dan Muslim no. 897 (Anas; Allahumma aghitsna dan hawalaina); HR. Abu Dawud no. 1169 (Jabir; doa Allahummasqina); HR. Abu Dawud no. 1176 dan Malik (Amr bin Syu'aib; doa Allahummasqi 'ibadaka)" }
);
/* ===== IB2-E3d1: tab Shalat, kategori "Shalat berjamaah khusus" bertambah 1 kartu (shalat Idul Fitri). Data dari pengetahuan penyusun (v: 0): belum dicocokkan dengan kitab cetak; nomor hadits Bukhari 953, 958, 959, 960 dan Muslim 886 dicek ke sunnah.com dan en.tohed.com; Abu Dawud 1151 dan Tirmidzi 536 dari islamqa.info; perbedaan hukum antarmazhab dan niat dari nu.or.id. Membalik: patch_ib2e3d1.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-idulfitri", c: "khusus", t: "Shalat Idul Fitri", v: 0, g: "Shahih",
    k: "idul fitri idulfitri iedul fitri shalat id shalat ied sholat ied sholat idul fitri hari raya lebaran 1 syawal takbir takbiran tujuh takbir lima takbir kurma khutbah id tanpa adzan iqamah mushalla",
    hk: "Sunnah muakkadah (sangat dianjurkan) menurut mazhab Syafi'i dan Maliki; wajib menurut mazhab Hanafi; fardhu kifayah menurut mazhab Hanbali. Dikerjakan pada hari raya 1 Syawal, lebih utama berjamaah.",
    rk: "2 rakaat dengan takbir tambahan",
    w: "Pagi hari raya 1 Syawal. Batas awal dan akhir waktunya diperselisihkan ulama mazhab Syafi'i (NU Online); ikuti waktu yang ditetapkan pemuka agama atau panitia setempat.",
    p: [
      { s: "Malam 1 Syawal sampai imam berdiri untuk shalat: perbanyak takbiran, sesuai firman Allah agar umat mencukupkan bilangan puasa dan mengagungkan Allah atas petunjuk-Nya (QS. Al-Baqarah: 185). Lafaz yang lazim dibaca:", a: { ar: "اللهُ أَكْبَرُ اللهُ أَكْبَرُ اللهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ، اللهُ أَكْبَرُ وَلِلّٰهِ الْحَمْدُ", lat: "Allahu akbar, Allahu akbar, Allahu akbar, la ilaha illallahu wallahu akbar, Allahu akbar wa lillahil hamd.", tr: "Allah Maha Besar (tiga kali), tiada tuhan selain Allah, Allah Maha Besar, dan bagi Allah segala puji." } },
      { s: "Pagi harinya: mandi dan memakai pakaian terbaik. Ibnu Umar biasa mandi pada hari Idul Fitri sebelum berangkat ke mushalla (atsar sahabat dalam Al-Muwaththa' Malik); Ibnul Qayyim menyebut hadits mandi dari Nabi ada dua dan lemah, tetapi ketetapan dari Ibnu Umar kuat (islamqa.info no. 49020). Ibnu Umar juga memakai pakaian terbaiknya pada hari raya (Al-Baihaqi, Sunan Al-Kubra, melalui NU Online). Sebelum berangkat, makan beberapa butir kurma dalam jumlah ganjil (Anas, HR. Bukhari no. 953). Hikmahnya agar tidak ada sangkaan harus tetap berpuasa sampai shalat Id (islamqa.info)." },
      { s: "Berangkat ke mushalla (tanah lapang) atau masjid bersama keluarga. Rasulullah ﷺ keluar ke tempat shalat dan hal pertama yang beliau kerjakan adalah shalat, lalu berpaling menghadap jamaah untuk berkhutbah (islamqa.info no. 49020)." },
      { s: "Berniat dalam hati; melafalkannya hukumnya sunnah, yang wajib adalah maksud sadar dalam batin (NU Online). Imam mengganti \"ma'muman\" dengan \"imaman\".", a: { ar: "أُصَلِّي سُنَّةً لِعِيدِ الْفِطْرِ رَكْعَتَيْنِ مَأْمُومًا لِلَّهِ تَعَالَى", lat: "Ushalli sunnatan li'idil fithri rak'ataini ma'muman lillahi ta'ala.", tr: "Aku berniat shalat sunnah Idul Fitri dua rakaat sebagai makmum karena Allah Ta'ala." } },
      { s: "Tanpa adzan dan tanpa iqamah: shalat langsung dimulai (Ibnu Abbas dan Jabir, HR. Bukhari no. 960 dan Muslim no. 886)." },
      { s: "Rakaat pertama: takbiratul ihram dan doa iftitah. Lalu bertakbir tujuh kali di luar takbiratul ihram sebelum Al-Fatihah, berhenti sejenak di antara dua takbir (HR. Abu Dawud no. 1151; Tirmidzi no. 536). Kemudian membaca Al-Fatihah dan satu surat; imam mengeraskan bacaan.", d: ["iftitah1", "iftitah2", "fatihah"] },
      { s: "Rukuk dengan bacaannya, i'tidal, lalu dua sujud dengan duduk di antaranya.", d: ["ruku", "itidal", "sujud", "duasujud"] },
      { s: "Rakaat kedua: bangkit dengan takbir, lalu bertakbir lima kali sebelum Al-Fatihah (HR. Abu Dawud no. 1151; Tirmidzi no. 536). Membaca Al-Fatihah dan satu surat, lalu rukuk, i'tidal, dan dua sujud seperti rakaat pertama." },
      { s: "Duduk tasyahud akhir, membaca shalawat, lalu salam.", d: ["tasyahud", "shalawatibrahim", "salamshalat"] },
      { s: "Khutbah: dilakukan SESUDAH shalat, bukan sebelumnya seperti Jumat (Jabir, HR. Bukhari no. 958 dan 959). Menurut mazhab Syafi'i imam berkhutbah dua kali dengan duduk di antara keduanya (NU Online)." }
    ],
    n: "Hukum: perbedaan antarmazhab (Syafi'i dan Maliki sunnah muakkadah, Hanafi wajib, Hanbali fardhu kifayah) dikutip dari NU Online dan islamqa.info (no. 48983); kartu tidak memihak satu pendapat. Bila terlewat: mayoritas ulama dari mazhab Maliki, Syafi'i, dan Hanbali menganjurkan mengqadhanya (NU Online). Takbir tambahan: tujuh di rakaat pertama dan lima di rakaat kedua adalah pendapat mayoritas ulama; Abu Dawud no. 1151 dinilai Shahih oleh Al-Albani, dinilai Hasan oleh An-Nawawi, dan Tirmidzi menukil bahwa Al-Bukhari menshahihkannya (islamqa.info no. 138423). Ada riwayat lain tentang empat takbir seperti takbir jenazah (Abu Musa dan Hudzaifah) yang dibahas islamqa.info dan dinilai lebih lemah daripada riwayat tujuh dan lima. Adzan dan iqamah: Bukhari no. 960 dan Muslim no. 886 meniadakan keduanya; islamqa.info (mengutip Ibnul Qayyim) menyebut tidak pula dibiasakan seruan khusus. Kurma: hadits Anas menyebut makan kurma sebelum berangkat pada Idul Fitri; pada Idul Adha tuntunannya berbeda (lihat kartu Shalat Idul Adha). Tidak dimuat karena belum dicek: bacaan surat tertentu, lafaz dzikir di antara takbir tambahan, ucapan selamat \"taqabbalallahu minna wa minkum\", rincian khutbah (jumlah takbir pembuka), bersalaman dan saling memaafkan sesudah khutbah, merapikan shaf, shalat di rumah atau sendirian, serta keringanan bila Id bertepatan dengan Jumat. Kartu ini tidak menetapkan tanggal 1 Syawal; rujuklah penetapan pemerintah atau lembaga keagamaan setempat.",
    s: "HR. Bukhari no. 953 (Anas; kurma ganjil sebelum berangkat); HR. Bukhari no. 958 dan 959 (Jabir; shalat sebelum khutbah); HR. Bukhari no. 960 dan Muslim no. 886 (Ibnu Abbas dan Jabir; tanpa adzan dan iqamah); HR. Abu Dawud no. 1151 (tujuh dan lima takbir); HR. Tirmidzi no. 536 (Katsir bin Abdullah; tujuh dan lima takbir); QS. Al-Baqarah: 185 (takbiran); Al-Muwaththa' Malik (Ibnu Umar; mandi sebelum berangkat; nomor berbeda antar sumber, tidak dicantumkan); Al-Baihaqi, Sunan Al-Kubra (Ibnu Umar; pakaian terbaik, melalui NU Online); islamqa.info no. 49020 (komentar Ibnul Qayyim tentang mandi)" }
);
/* ===== IB2-E3d2: tab Shalat, kategori "Shalat berjamaah khusus" bertambah 1 kartu (shalat Idul Adha). Data dari pengetahuan penyusun dan NU Online (v: 0): belum dicocokkan dengan kitab cetak; nomor hadits Bukhari 951, 957, 960, 5545 dan Tirmidzi 542, Ibnu Majah 1756 dicek ke sunnah.com, en.tohed.com, dan alsunna.net; waktu, niat, bacaan di antara takbir, surat, dan waktu takbiran dari nu.or.id. Membalik: patch_ib2e3d2.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-iduladha", c: "khusus", t: "Shalat Idul Adha", v: 0, g: "Shahih",
    k: "idul adha iduladha iedul adha shalat id shalat ied sholat ied sholat idul adha hari raya kurban qurban haji nahr 10 dzulhijjah takbir tasyriq tasyrik takbiran tujuh takbir lima takbir khutbah id tanpa adzan iqamah mushalla tidak makan sebelum shalat menyembelih sembelih",
    hk: "Sunnah muakkadah (sangat dianjurkan) menurut mazhab Syafi'i dan Maliki; wajib menurut mazhab Hanafi; fardhu kifayah menurut mazhab Hanbali. Dikerjakan pada hari raya 10 Dzulhijjah, lebih utama berjamaah; bila terlambat atau berhalangan, boleh sendiri di rumah (NU Online).",
    rk: "2 rakaat dengan takbir tambahan",
    w: "Pagi 10 Dzulhijjah: sejak matahari terbit sampai masuk waktu Zuhur (NU Online). Dianjurkan mengawalkannya agar yang hendak berkurban punya waktu luas untuk menyembelih sesudah shalat (NU Online).",
    p: [
      { s: "Takbiran: dari terbenamnya matahari malam 10 Dzulhijjah sampai imam bertakbiratul ihram (takbir mursal), lalu setiap selesai shalat fardhu dari Subuh hari Arafah (9 Dzulhijjah) sampai akhir hari tasyriq, yaitu Ashar 13 Dzulhijjah (takbir muqayyad), menurut mazhab Syafi'i (NU Online, mengutip Fathul Qarib). Lafaz yang lazim dibaca dan dinilai baik oleh An-Nawawi (NU Online):", a: { ar: "اللهُ أَكْبَرُ اللهُ أَكْبَرُ اللهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ، اللهُ أَكْبَرُ وَلِلّٰهِ الْحَمْدُ", lat: "Allahu akbar, Allahu akbar, Allahu akbar, la ilaha illallahu wallahu akbar, Allahu akbar wa lillahil hamd.", tr: "Allah Maha Besar (tiga kali), tiada tuhan selain Allah, Allah Maha Besar, dan bagi Allah segala puji." } },
      { s: "Pagi harinya: mandi dan berpakaian rapi (kebiasaan yang lazim dianjurkan; belum dirujuk ke dalil di kartu ini). BERBEDA dari Idul Fitri: jangan makan dulu sebelum shalat, makan sesudah pulang dari shalat (Buraidah, HR. Tirmidzi no. 542; Ibnu Majah no. 1756)." },
      { s: "Berangkat ke mushalla (tanah lapang) atau masjid. Hal pertama yang dikerjakan pada hari itu adalah shalat, lalu pulang dan menyembelih kurban; siapa yang melakukannya, ia sesuai sunnah (Al-Bara', HR. Bukhari no. 951)." },
      { s: "Berniat dalam hati bersamaan dengan takbiratul ihram; melafalkannya sunnah untuk membimbing hati (NU Online). Imam mengganti \"ma'muman\" dengan \"imaman\"; yang shalat sendirian cukup sampai \"rak'ataini\".", a: { ar: "أُصَلِّي سُنَّةً لِعِيدِ الْأَضْحَى رَكْعَتَيْنِ مَأْمُومًا لِلَّهِ تَعَالَى", lat: "Ushalli sunnatan li'idil adh-ha rak'ataini ma'muman lillahi ta'ala.", tr: "Aku berniat shalat sunnah Idul Adha dua rakaat sebagai makmum karena Allah Ta'ala." } },
      { s: "Tanpa adzan dan tanpa iqamah: shalat langsung dimulai. Ibnu Abbas dan Jabir: tidak ada adzan pada hari Idul Fitri maupun Idul Adha (HR. Bukhari no. 960 dan Muslim no. 886)." },
      { s: "Rakaat pertama: takbiratul ihram dan doa iftitah. Lalu bertakbir tujuh kali di luar takbiratul ihram sebelum Al-Fatihah (HR. Abu Dawud no. 1151; Tirmidzi no. 536). Di antara dua takbir dianjurkan membaca bacaan berikut (NU Online, dari kitab Fashalatan karya KHR Asnawi). Setelah Al-Fatihah dianjurkan membaca Surat Al-A'la (NU Online).", a: { ar: "اللهُ أَكْبَرُ كَبِيرًا، وَالْحَمْدُ لِلّٰهِ كَثِيرًا، وَسُبْحَانَ اللهِ بُكْرَةً وَأَصِيلًا", lat: "Allahu akbar kabira, walhamdu lillahi katsira, wa subhanallahi bukratan wa ashila.", tr: "Allah Mahabesar dengan segala kebesaran, segala puji bagi Allah dengan pujian yang banyak, Mahasuci Allah baik waktu pagi dan petang." }, d: ["iftitah1", "iftitah2", "fatihah"] },
      { s: "Rukuk dengan bacaannya, i'tidal, lalu dua sujud dengan duduk di antaranya.", d: ["ruku", "itidal", "sujud", "duasujud"] },
      { s: "Rakaat kedua: bangkit dengan takbir, lalu bertakbir lima kali seraya mengangkat tangan sebelum Al-Fatihah (HR. Abu Dawud no. 1151; Tirmidzi no. 536). Di antara takbir boleh membaca bacaan yang sama seperti rakaat pertama, atau bacaan lain berikut (NU Online). Setelah Al-Fatihah dianjurkan membaca Surat Al-Ghasyiyah (NU Online), lalu rukuk, i'tidal, dan dua sujud seperti rakaat pertama.", a: { ar: "سُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ", lat: "Subhanallah, walhamdulillah, wa la ilaha illallah, wallahu akbar.", tr: "Mahasuci Allah, segala puji bagi Allah, tiada tuhan selain Allah, Allah Mahabesar." } },
      { s: "Duduk tasyahud akhir, membaca shalawat, lalu salam.", d: ["tasyahud", "shalawatibrahim", "salamshalat"] },
      { s: "Khutbah: dilakukan SESUDAH shalat, bukan sebelumnya seperti Jumat (Ibnu Umar, HR. Bukhari no. 957; Jabir, HR. Bukhari no. 958 dan 959). Jamaah dianjurkan menyimak khutbah sampai selesai dan tidak buru-buru pulang; orang yang shalat sendirian tidak ada khutbahnya (NU Online)." },
      { s: "Sesudah khutbah: pulang, lalu baru makan. Dalam riwayat Ahmad no. 22984 ada tambahan bahwa beliau makan dari hewan kurbannya (alsunna.net). Yang berkurban menyembelih sesudah shalat: siapa menyembelih sesudah shalat, penyembelihannya tepat waktu dan sesuai sunnah kaum muslimin (Al-Bara', HR. Bukhari no. 5545). Tata cara kurban tidak dibahas di kartu ini." }
    ],
    n: "Perbedaan dengan Idul Fitri: (1) tidak makan dulu sebelum shalat, sedangkan pada Idul Fitri makan kurma ganjil dulu; (2) takbiran lebih panjang, sampai akhir hari tasyriq; (3) waktu shalat dianjurkan dikawalkan; (4) sesudahnya ada penyembelihan kurban. Selebihnya sama: dua rakaat, tujuh dan lima takbir tambahan, tanpa adzan dan iqamah, khutbah sesudah shalat. Hukum: perbedaan antarmazhab sama seperti pada kartu Idul Fitri (sumber di kartu itu: NU Online dan islamqa.info no. 48983); kartu tidak memihak satu pendapat. Tidak makan sebelum shalat: Tirmidzi no. 542 dinilai Shahih oleh Al-Albani, juga disahihkan Ibnu Hibban, Ibnu Khuzaimah, dan Al-Hakim, sedangkan Zubair Ali Zai menilai sanadnya Hasan (en.tohed.com); At-Tirmidzi sendiri menyebutnya gharib. Takbir tambahan: derajat Abu Dawud no. 1151 dan riwayat empat takbir dibahas pada kartu Idul Fitri. Waktu takbiran 9 sampai 13 Dzulhijjah mengikuti mazhab Syafi'i (Fathul Qarib melalui NU Online); pendapat ulama lain tentang awal dan akhirnya tidak dirinci di sini. Bacaan di antara takbir dan pilihan Surat Al-A'la dan Al-Ghasyiyah adalah anjuran dari NU Online (kitab Fashalatan), bukan kutipan satu hadits; lafaz takbiran adalah lafaz yang lazim, bukan kutipan satu hadits. Tidak dimuat karena belum dicek: dalil takbir tasyriq, mengambil jalan berbeda saat pergi dan pulang, cara mengeraskan bacaan, tata cara dan hukum kurban, ucapan selamat, serta bila Id bertepatan dengan Jumat. Kartu ini tidak menetapkan tanggal 10 Dzulhijjah; rujuklah penetapan pemerintah atau lembaga keagamaan setempat.",
    s: "HR. Tirmidzi no. 542 dan Ibnu Majah no. 1756 (Buraidah; tidak makan sebelum shalat); HR. Ahmad no. 22984 (tambahan makan dari hewan kurban); HR. Bukhari no. 951 dan 5545 (Al-Bara'; shalat dulu, lalu menyembelih); HR. Bukhari no. 957 (Ibnu Umar; khutbah sesudah shalat), no. 958 dan 959 (Jabir); HR. Bukhari no. 960 dan Muslim no. 886 (Ibnu Abbas dan Jabir; tanpa adzan); HR. Abu Dawud no. 1151 (tujuh dan lima takbir); HR. Tirmidzi no. 536 (Katsir bin Abdullah; tujuh dan lima takbir); NU Online (waktu, niat, bacaan di antara takbir, surat, takbiran)" }
);
/* ===== IB2-E3d3: tab Shalat, kategori "Shalat sunnah" bertambah 1 kartu (shalat tasbih). Derajat hadits dan sikap ulama ditampilkan apa adanya, kartu tidak memihak (v: 0): belum dicocokkan dengan kitab cetak; teks hadits Abu Dawud no. 1297 dan kutipan sikap ulama dibaca di islamqa.info no. 145112; derajat dan jalur di en.tohed.com dan sunnah.com. Membalik: patch_ib2e3d3.py --reverse ===== */
IBX_SHL.push(
  { id: "sh-tasbih", c: "sunnah", t: "Shalat tasbih", v: 0, g: "Diperselisihkan",
    k: "shalat tasbih sholat tasbih salat tasbih shalatut tasbih empat rakaat 4 rakaat 300 tasbih 75 tasbih abbas paman nabi ampunan dosa sekali seumur hidup subhanallah walhamdulillah la ilaha illallah allahu akbar lima belas sepuluh kali dhaif hasan shahih diperselisihkan",
    hk: "DIPERSELISIHKAN ulama, dan sebabnya adalah perbedaan menilai derajat haditsnya. Dianjurkan (mustahabb) menurut Al-Qadhi Husain serta penulis At-Tahdzib dan At-Tatimmah, sebagaimana dikutip An-Nawawi dalam Al-Majmu'; Ibnul Mubarak menerima dan mengamalkannya. Tidak dianjurkan menurut Ahmad (tidak ada yang shahih tentangnya), Ibnu Taimiyah, dan Ibnu Utsaimin, yang menilai haditsnya dha'if. Kartu ini menyajikan kedua pendapat dan tidak memihak.",
    rk: "4 rakaat, tiap rakaat 75 bacaan tasbih (jumlah 300)",
    w: "Hadits yang dibaca menyebut seberapa sering, bukan jam tertentu: sekali sehari; bila tidak sanggup, sekali sepekan; bila tidak, sekali sebulan; bila tidak, sekali setahun; bila tidak, sekali seumur hidup (HR. Abu Dawud no. 1297). Waktu dalam hari tidak dimuat karena belum dicek.",
    p: [
      { s: "Niat: berniat dalam hati untuk shalat sunnah tasbih empat rakaat. Lafaz niat tidak disebut dalam hadits dan tidak dimuat karena belum dicek." },
      { s: "Rakaat pertama: takbiratul ihram, lalu membaca Al-Fatihah dan satu surah. Hadits hanya menyebut Fatihatul Kitab dan satu surah, tanpa menentukan surahnya (HR. Abu Dawud no. 1297)." },
      { s: "Sesudah selesai membaca surah, sambil berdiri ucapkan bacaan tasbih ini sebanyak 15 kali (HR. Abu Dawud no. 1297):", a: { ar: "سُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ", lat: "Subhanallah, walhamdulillah, wa la ilaha illallah, wallahu akbar.", tr: "Mahasuci Allah, segala puji bagi Allah, tiada tuhan selain Allah, Allah Mahabesar." } },
      { s: "Rukuk dan bacaan tasbih yang sama 10 kali; lalu bangkit dari rukuk (i'tidal) dan ucapkan 10 kali (HR. Abu Dawud no. 1297)." },
      { s: "Sujud pertama 10 kali; bangkit dan duduk di antara dua sujud 10 kali; sujud kedua 10 kali; lalu mengangkat kepala dari sujud kedua dan mengucapkannya 10 kali (HR. Abu Dawud no. 1297). Hadits yang dibaca tidak menyebut urutan antara bacaan ini dan bacaan rukuk atau sujud yang biasa; kartu tidak menetapkannya." },
      { s: "Hitungan satu rakaat: 15 + (6 x 10) = 75 kali. Lakukan hal yang sama pada keempat rakaat (HR. Abu Dawud no. 1297), sehingga jumlahnya 300 kali." },
      { s: "Akhiri dengan tasyahud akhir, shalawat, lalu salam. Hadits yang dibaca tidak menyebut apakah dikerjakan dua rakaat-dua rakaat atau empat rakaat sekali salam, juga tidak menyebut tasyahud pada rakaat kedua; bagian itu tidak dimuat karena belum dicek.", d: ["tasyahud", "shalawatibrahim", "salamshalat"] }
    ],
    n: "Keutamaan yang disebut hadits: Nabi bersabda kepada pamannya, Al-Abbas, bahwa dengan mengerjakannya Allah mengampuni dosanya yang awal dan akhir, lama dan baru, sengaja dan tidak, kecil dan besar, tersembunyi dan terang-terangan (HR. Abu Dawud no. 1297). Derajat: Al-Albani menilai Abu Dawud no. 1297 Shahih (sunnah.com); Zubair Ali Zai menilai sanadnya Hasan; Ibnu Khuzaimah dan Al-Hakim menshahihkannya (en.tohed.com). Sebagian ulama lain menilainya dha'if. Abu Dawud juga mencatat jalur lain yang menjadikannya ucapan sahabat, bukan sabda Nabi (en.tohed.com, bab shalat tasbih). At-Tirmidzi berkata ada lebih dari satu hadits tentangnya tetapi tidak banyak yang shahih (dikutip An-Nawawi). Sikap An-Nawawi dikutip berbeda oleh sumber yang dibaca: islamqa.info mengutip Al-Majmu' (3/547-548) bahwa anjuran itu masih perlu ditinjau karena haditsnya dha'if dan mengubah bentuk shalat yang biasa, sedangkan komentar Saeedi di en.tohed.com menyebutnya di antara yang menilai hasan; kartu tidak memutuskan dan tidak menelusuri kitab aslinya. Alasan pihak yang menolak: pokok ibadah adalah terlarang kecuali ada dalil (Ibnu Utsaimin, Majmu' Fatawa 14/327), dan tidak ada imam empat yang menganggapnya dianjurkan (Ibnu Taimiyah, Majmu' Fatawa 11/579). Tidak dimuat karena belum dicek: riwayat lain yang meletakkan 15 tasbih sebelum bacaan, doa iftitah dan ta'awudz, pembagian salam, surah yang dianjurkan, lafaz niat, dan waktu terlarang. Pembaca dianjurkan bertanya kepada ulama yang dipercaya dalam mazhabnya.",
    s: "HR. Abu Dawud no. 1297; Ibnu Majah no. 1387; Ibnu Khuzaimah no. 1216; Al-Hakim (Al-Mustadrak 1/318) (Ibnu Abbas; tata cara, keutamaan, dan frekuensi); sikap ulama: Al-Majmu' 3/547-548 (An-Nawawi), Al-Mughni 1/438 (Ibnu Qudamah), Majmu' Fatawa 11/579 (Ibnu Taimiyah) dan 14/327 (Ibnu Utsaimin), semuanya dikutip islamqa.info no. 145112; derajat: sunnah.com dan en.tohed.com (Abu Dawud no. 1297)" }
);
/* ===== IB2-B3c1: data sunnah tahap 3c-1: tambahan 3 sunnah di kategori "Tidur" (memakai pembantu ibxSnAddAfter; kategori sudah ada, tidak ada kategori baru). Teks dan nomor hadits dicek ke sunnah.com dan hadithunlocked.com lewat web (14 Nov 2026); isi cara mengamalkan dan catatan tetap ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3c1.py --reverse ===== */
ibxSnAddAfter("sn-tidur", [
  { id: "sn-kibas", c: "tidur", t: "Mengibaskan tempat tidur sebelum berbaring", v: 0, g: "Shahih", k: "kibas mengibaskan tempat tidur kasur sprei sarung izar sebelum tidur bismika rabbi",
    p: "Sebelum berbaring, kibaskan tempat tidur dengan bagian dalam kain sarung atau ujung kain yang kamu pakai, lalu baca doa Bismika Rabbi wadha'tu janbi.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bila salah seorang dari kalian hendak berbaring di tempat tidurnya, hendaklah ia mengibaskannya dengan bagian dalam kain sarungnya, karena ia tidak tahu apa yang menimpanya sepeninggalnya. Kemudian hendaklah ia membaca: Bismika Rabbi wadha'tu janbi wa bika arfa'uhu, in amsakta nafsi farhamha, wa in arsaltaha fahfazha bima tahfazu bihi ibadakash-shalihin.",
    n: "Arti doanya menurut penyusun: dengan nama-Mu, wahai Tuhanku, aku letakkan lambungku dan dengan-Mu pula aku mengangkatnya; bila Engkau menahan jiwaku maka rahmatilah ia, dan bila Engkau melepaskannya maka jagalah ia sebagaimana Engkau menjaga hamba-hamba-Mu yang shalih. Jumlah kibasan tidak dicantumkan karena teks yang saya baca tidak menyebutnya. Doa sebelum tidur lain ada di tab Doa & dzikir.",
    s: "HR. Bukhari no. 6320" },
  { id: "sn-kursi", c: "tidur", t: "Membaca Ayat Kursi sebelum tidur", v: 0, g: "Shahih", k: "ayat kursi ayatul kursi sebelum tidur al-baqarah 255 penjaga dari allah setan tidak mendekat",
    p: "Bila sudah di tempat tidur, bacalah Ayat Kursi (QS. Al-Baqarah: 255) sampai selesai sebelum memejamkan mata.",
    h: "Abu Hurairah ra. menceritakan bahwa ia ditugasi menjaga zakat Ramadhan, lalu menangkap seorang pencuri. Pencuri itu mengajarinya: bila engkau berbaring di tempat tidurmu, bacalah Ayat Kursi, maka akan ada penjaga dari Allah yang melindungimu sepanjang malam dan setan tidak akan mendekatimu sampai pagi. Nabi ﷺ bersabda: dia berkata benar kepadamu padahal dia pendusta, dan itu adalah setan.",
    n: "Hadits ini berupa kisah panjang; yang dicek hanya garis besar kisah dan kalimat inti dari teks Inggris di hadithunlocked.com (Bukhari no. 5010) dan nomor serta kemiripan redaksinya pada Bukhari no. 2311; teks Arab tidak dibuka. Ayat Kursi sendiri tidak dimuat di kartu ini.",
    s: "HR. Bukhari no. 2311 dan no. 5010" },
  { id: "sn-muawidzat", c: "tidur", t: "Membaca Al-Ikhlas, Al-Falaq, An-Nas lalu mengusap badan", v: 0, g: "Shahih", k: "muawwidzat muawidzat qul huwallahu ahad falaq nas tiup telapak tangan usap badan sebelum tidur tiga kali",
    p: "Menjelang tidur, rapatkan kedua telapak tangan, tiup ringan sambil membaca Al-Ikhlas, Al-Falaq, dan An-Nas, lalu usapkan ke badan, mulai dari kepala dan wajah, tiga kali.",
    h: "Aisyah ra. meriwayatkan bahwa setiap malam bila Nabi ﷺ berbaring di tempat tidurnya, beliau merapatkan kedua telapak tangannya, meniupnya, lalu membaca Qul huwallahu ahad, Qul a'udzu bi rabbil falaq, dan Qul a'udzu bi rabbin nas. Kemudian beliau mengusapkan kedua tangannya ke bagian tubuh yang dapat dijangkau, dimulai dari kepala dan wajah serta bagian depan tubuhnya, dan melakukannya tiga kali.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab keutamaan Al-Mu'awwidzat (Al-Falaq dan An-Nas). Teks yang dibaca adalah ringkasan dari sunnah.com, bukan salinan kata demi kata; redaksi persis dan kitab syarahnya tidak dibuka.",
    s: "HR. Bukhari no. 5017" }
]);
/* ===== IB2-B3c2: data sunnah tahap 3c-2: tambahan 3 sunnah di kategori "Makan & minum" (memakai ibxSnAddAfter; kategori sudah ada). Teks dan nomor hadits dicek ke hadithunlocked.com lewat web (14 Nov 2026); cara mengamalkan dan catatan ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3c2.py --reverse ===== */
ibxSnAddAfter("sn-minum", [
  { id: "sn-puji", c: "makan", t: "Memuji Allah setelah selesai makan", v: 0, g: "Shahih", k: "puji alhamdulillah selesai makan doa sesudah makan kathiran thayyiban mubarakan fihi rabbana",
    p: "Setelah selesai makan, ucapkan pujian kepada Allah: Alhamdu lillahi hamdan katsiran thayyiban mubarakan fihi ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu Rabbana.",
    h: "Abu Umamah ra. meriwayatkan bahwa bila hidangan Nabi ﷺ diangkat (selesai makan), beliau mengucapkan: Alhamdu lillahi hamdan katsiran thayyiban mubarakan fihi, ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu Rabbana.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab apa yang diucapkan seseorang setelah selesai makan. Artinya menurut penyusun: segala puji bagi Allah, pujian yang banyak, baik, dan penuh berkah; nikmat-Nya tidak tercukupi dengan sesuatu yang lain, tidak ditinggalkan, dan tidak dapat kami lepaskan darinya, wahai Tuhan kami. Bagian akhir lafaz ini dibaca dari ringkasan halaman rujukan, bukan dari teks Arabnya; mohon dicocokkan. Doa makan lain ada di tab Doa & dzikir.",
    s: "HR. Bukhari no. 5458" },
  { id: "sn-jari", c: "makan", t: "Menjilati jari sebelum mengelap tangan", v: 0, g: "Shahih", k: "jilat menjilat jari piring tangan mengelap lap sisa makanan keberkahan",
    p: "Sesudah makan dengan tangan, bersihkan sisa makanan di jari (dijilat, atau dibantu orang yang tidak keberatan) sebelum mencuci atau mengelap tangan; lakukan dengan sopan dan tidak di depan orang yang merasa jijik.",
    h: "Ibnu Abbas ra. meriwayatkan sabda Nabi ﷺ: bila kalian makan, janganlah mengelap tangan sampai ia menjilatinya atau meminta orang lain menjilatinya.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab menjilat dan mengisap jari. Kalimat tentang kesopanan dan orang yang merasa jijik adalah catatan penyusun, bukan bunyi hadits. Alasan (keberkahan makanan) yang disebut dalam riwayat lain tidak dimuat karena belum saya baca.",
    s: "HR. Bukhari no. 5456" },
  { id: "sn-sandar", c: "makan", t: "Tidak makan sambil bersandar", v: 0, g: "Shahih", k: "makan bersandar bersandar sambil makan duduk adab makan abu juhaifah",
    p: "Makanlah dengan duduk tegak atau posisi yang sopan, tidak bersandar atau berbaring santai saat makan.",
    h: "Abu Juhaifah ra. menceritakan bahwa Nabi ﷺ berkata kepada seorang laki-laki di dekatnya: aku tidak makan sambil bersandar.",
    n: "Imam Bukhari menempatkan hadits ini dalam bab makan sambil bersandar. Hadits ini berupa ucapan Nabi tentang kebiasaan beliau sendiri; bentuk duduk yang tepat dan hukum persisnya (makruh atau sekadar adab) dibahas ulama dan tidak diputuskan di sini.",
    s: "HR. Bukhari no. 5399" }
]);
/* ===== IB2-B3c3: data sunnah tahap 3c-3: tambahan 3 sunnah di kategori "Bersuci & rapi" (memakai ibxSnAddAfter; kategori sudah ada; disisipkan sesudah sn-fitrah dan SEBELUM sn-kanan supaya empat sunnah B3a1 tetap tepat sesudah sn-kanan). Teks dan nomor hadits dicek ke sunnah.com, hadithunlocked.com, hadeethenc.com lewat web (14 Nov 2026); cara mengamalkan dan catatan ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3c3.py --reverse ===== */
ibxSnAddAfter("sn-fitrah", [
  { id: "sn-tangan", c: "bersih", t: "Mencuci tangan setelah bangun tidur sebelum berwudhu", v: 0, g: "Shahih", k: "cuci tangan bangun tidur wudhu bejana tiga kali semalam",
    p: "Setelah bangun tidur, cucilah kedua tangan lebih dulu sebelum memasukkannya ke air wudhu atau bejana air. Riwayat Muslim menyebut tiga kali.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bila salah seorang dari kalian bangun dari tidurnya, hendaklah ia mencuci tangannya sebelum memasukkannya ke air wudhunya, karena salah seorang dari kalian tidak tahu di mana tangannya bermalam. Dalam riwayat Muslim: janganlah ia mencelupkan tangannya ke dalam bejana sebelum mencucinya tiga kali.",
    n: "Hadits Bukhari no. 162 memuat tiga perintah sekaligus: menghirup air ke hidung saat wudhu (lihat kartu berikutnya), bilangan ganjil saat bersuci dengan batu, dan mencuci tangan sesudah bangun tidur; kartu ini hanya memuat yang ketiga. Lafaz tiga kali ada pada riwayat Muslim, bukan pada redaksi Bukhari yang saya baca. Hukum persisnya (sunnah atau wajib) dibahas ulama dan tidak diputuskan di sini.",
    s: "HR. Bukhari no. 162; lafaz tiga kali: HR. Muslim no. 278" },
  { id: "sn-hidung", c: "bersih", t: "Menghirup dan mengeluarkan air dari hidung saat wudhu", v: 0, g: "Shahih", k: "hidung istinsyaq istintsar menghirup air wudhu setan bagian dalam hidung",
    p: "Saat berwudhu, hirup air ke dalam hidung lalu keluarkan kembali. Sesudah bangun tidur, bersihkan hidung dengan menghembuskan napas tiga kali.",
    h: "Abu Hurairah ra. meriwayatkan sabda Nabi ﷺ: bila salah seorang dari kalian berwudhu, hendaklah ia memasukkan air ke hidungnya lalu mengeluarkannya. Dalam riwayat Muslim dari Abu Hurairah: bila salah seorang dari kalian bangun dari tidurnya, hendaklah ia membersihkan hidungnya (dengan menghembuskan napas) tiga kali, karena setan bermalam di bagian dalam hidungnya.",
    n: "Dua hadits berbeda dari Abu Hurairah: perintah saat wudhu (Bukhari no. 162, hadits yang sama dengan kartu mencuci tangan) dan perintah sesudah bangun tidur (Muslim no. 238). Istilah ulama: istinsyaq (menghirup air ke hidung) dan istintsar (mengeluarkannya). Hukum, cara bagi yang sedang berpuasa, dan tafsir ucapan setan bermalam di hidung tidak dibahas di sini karena belum saya baca; kalimatnya diberikan apa adanya.",
    s: "HR. Bukhari no. 162; sesudah bangun tidur: HR. Muslim no. 238" },
  { id: "sn-istinja", c: "bersih", t: "Tidak memegang kemaluan dan beristinja dengan tangan kanan", v: 0, g: "Shahih", k: "istinja cebok kemaluan buang air kecil buang hajat tangan kiri adab toilet",
    p: "Saat buang air kecil, jangan memegang kemaluan dengan tangan kanan; saat membersihkan diri sesudah buang hajat, jangan memakai tangan kanan. Pakailah tangan kiri.",
    h: "Abu Qatadah ra. meriwayatkan sabda Nabi ﷺ: bila salah seorang dari kalian buang air kecil, janganlah ia memegang kemaluannya dengan tangan kanannya dan janganlah beristinja dengan tangan kanannya. Dalam riwayat lain: bila ia mendatangi tempat buang hajat, janganlah ia menyentuh kemaluannya dengan tangan kanannya dan janganlah membersihkan diri dengan tangan kanannya.",
    n: "Hadits hanya melarang tangan kanan; anjuran memakai tangan kiri adalah kesimpulan penyusun. Dua riwayat itu juga memuat larangan mengambil napas di dalam bejana saat minum (lihat Minum dengan tiga kali napas di kategori Makan & minum). Keterangan bahwa tangan kanan dimuliakan adalah penjelasan syarah, bukan bunyi hadits. Hukum persisnya (makruh atau haram) dan sah-tidaknya istinja dengan tangan kanan dibahas ulama dan tidak diputuskan di sini.",
    s: "HR. Bukhari no. 154 dan no. 153; Muslim no. 267" }
]);
/* ===== IB2-B3c4: data sunnah tahap 3c-4: tambahan 3 sunnah, satu di tiap kategori "Hari Jumat", "Pakaian & penampilan", "Keluarga & rumah" (memakai ibxSnAddAfter; kategori sudah ada; tiap sunnah disisipkan di AKHIR kategorinya supaya urutan data tetap berkelompok dan urutan sunnah lama tidak berubah). Teks dan nomor hadits dicek ke sunnah.com, hadithunlocked.com, en.tohed.com, islamqa.info lewat web (14 Nov 2026); cara mengamalkan dan catatan ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3c4.py --reverse ===== */
ibxSnAddAfter("sn-jdoa", [
  { id: "sn-jsubuh", c: "jumat", t: "Membaca As-Sajdah dan Al-Insan pada shalat Subuh hari Jumat", v: 0, g: "Shahih", k: "subuh jumat surah as-sajdah alif lam mim tanzil al-insan hal ata dahr bacaan fajar",
    p: "Pada shalat Subuh hari Jumat, bacalah Surah As-Sajdah (surah ke-32) pada rakaat pertama dan Surah Al-Insan (surah ke-76) pada rakaat kedua.",
    h: "Abu Hurairah ra. meriwayatkan bahwa pada shalat Subuh hari Jumat, Nabi ﷺ biasa membaca Alif Lam Mim Tanzil (Surah As-Sajdah) dan Hal ata 'alal insan (Surah Al-Insan, disebut juga Ad-Dahr).",
    n: "Teks Arab Bukhari no. 891 hanya menyebut dua surah dan kata biasa membaca; urutan rakaat pertama dan kedua saya baca dari terjemahan dan syarah. Hadits yang sama juga tercatat di Bukhari no. 1068. Nomor Muslim no. 880 saya ambil dari daftar takhrij; teks Muslim tidak saya baca langsung. Syarah yang saya baca menjelaskan bahwa kata biasa menunjukkan kebiasaan Nabi ﷺ dan menyebut hikmahnya (penciptaan Adam dan hari kiamat); itu penjelasan ulama, bukan bunyi hadits. Sujud tilawah pada Surah As-Sajdah dan perbedaan pendapat mazhab tidak dibahas di sini. Kartu ini hanya tentang shalat Subuh, bukan shalat Jumat.",
    s: "HR. Bukhari no. 891; Muslim no. 880" }
]);
ibxSnAddAfter("sn-rapi", [
  { id: "sn-doabaju", c: "pakaian", t: "Berdoa saat memakai pakaian baru", v: 0, g: "Shahih", k: "doa pakaian baru baju baru gamis sorban selendang kasawtanihi memakai",
    p: "Saat memakai pakaian baru, sebutkan jenisnya (misalnya baju, sorban, atau selendang), lalu baca: Allahumma lakal-hamdu anta kasawtanihi, as'aluka khairahu wa khaira ma suni'a lahu, wa a'udzu bika min syarrihi wa syarri ma suni'a lahu.",
    h: "Abu Said Al-Khudri ra. berkata: bila Nabi ﷺ memakai pakaian baru, beliau menyebut namanya, entah sorban, gamis, atau selendang, lalu berdoa: Ya Allah, bagi-Mu segala puji, Engkau yang memakaikannya kepadaku. Aku memohon kebaikannya dan kebaikan tujuan pembuatannya, dan aku berlindung kepada-Mu dari keburukannya dan keburukan tujuan pembuatannya.",
    n: "Teks doa dan keterangan menyebut nama pakaian saya baca dari Abu Dawud no. 4020 dan Riyadhus Shalihin no. 812; Tirmidzi no. 1767 tertera sebagai riwayat yang sama dan derajatnya tidak saya cek. Tulisan Latin di kolom cara adalah transliterasi dari sumber, bukan teks Arab. Ada riwayat lain berisi doa yang berbeda untuk memakai pakaian apa saja (Abu Dawud no. 4023); riwayat itu TIDAK dimuat di kartu ini karena derajatnya belum saya cek.",
    s: "HR. Abu Dawud no. 4020 (dinilai shahih oleh Al-Albani); juga Tirmidzi no. 1767" }
]);
ibxSnAddAfter("sn-kistri", [
  { id: "sn-krumah", c: "keluarga", t: "Memperbanyak shalat sunnah di rumah", v: 0, g: "Shahih", k: "shalat sunnah rumah nafilah bait terbaik kecuali wajib qiyamullail malam",
    p: "Kerjakan shalat sunnah di rumah. Shalat wajib dikecualikan dari anjuran ini.",
    h: "Zaid bin Tsabit ra. meriwayatkan sabda Nabi ﷺ: wahai manusia, shalatlah di rumah-rumah kalian, karena shalat yang paling utama bagi seseorang adalah shalatnya di rumahnya, kecuali shalat wajib.",
    n: "Sabda ini diucapkan setelah beberapa malam orang-orang ikut shalat malam bersama Nabi ﷺ di sebuah bilik kecil, lalu beliau khawatir shalat itu diwajibkan atas mereka (Bukhari no. 731, bab shalat malam). Hadits menyebut keutamaan shalat sunnah di rumah; ia tidak menyebut larangan shalat sunnah di masjid. Nomor Muslim no. 781 saya ambil dari daftar takhrij; teks Muslim tidak saya baca langsung. Hukum berjamaah bagi shalat wajib dan shalat sunnah yang dikerjakan berjamaah (misalnya shalat Id) tidak dibahas di sini.",
    s: "HR. Bukhari no. 731; Muslim no. 781" }
]);
/* ===== IB2-B3c5: data sunnah tahap 3c-5: tambahan 2 sunnah, satu di kategori "Shalat sunnah" dan satu di "Tidur" (memakai ibxSnAddAfter; kedua kategori sudah ada; tiap sunnah disisipkan di AKHIR kategorinya supaya data tetap berkelompok dan urutan 46 sunnah lama tidak berubah). Teks dan nomor hadits dicek ke hadithunlocked.com, en.tohed.com, portainer.sunnah.com, hadithanswers.com lewat web (14 Nov 2026); cara mengamalkan dan catatan ditulis penyusun (v: 0). Tidak ada kunci penyimpanan baru. Membalik: patch_ib2b3c5.py --reverse ===== */
ibxSnAddAfter("sn-witir", [
  { id: "sn-wudhu2", c: "shalat", t: "Shalat dua rakaat sesudah berwudhu", v: 0, g: "Shahih", k: "shalat sunnah sesudah wudhu dua rakaat sunnatul wudhu utsman humran khusyuk melantur dosa diampuni",
    p: "Sesudah berwudhu dengan baik, kerjakan shalat dua rakaat dan jagalah hati agar tidak melantur selama shalat itu.",
    h: "Humran, bekas budak Utsman bin Affan ra., melihat Utsman berwudhu, lalu menyampaikan sabda Nabi ﷺ: barangsiapa berwudhu seperti wudhuku ini, kemudian shalat dua rakaat yang ia tidak berbicara kepada dirinya di dalam keduanya, diampuni dosanya yang telah lalu.",
    n: "Teks Arab Bukhari no. 159 (Kitab Wudhu) dan Muslim no. 226 (Kitab Thaharah, bab sifat wudhu dan kesempurnaannya; di sumber bernomor 226a) saya baca dari hadithunlocked.com; kalimat intinya la yuhaddithu fihima nafsahu (ia tidak berbicara kepada dirinya di dalam keduanya). Arti hati tidak melantur adalah terjemahan dan penjelasan, bukan tambahan kata di teks yang saya baca; terjemahan Indonesia adalah parafrase penyusun. Halaman sumber menandai hadits ini muttafaq 'alaih (kesepakatan Bukhari dan Muslim). Jenis dosa yang diampuni (misalnya hanya dosa kecil), hukum shalat ini menurut mazhab, dan waktu terlarang untuk shalat tidak dibahas di sini.",
    s: "HR. Bukhari no. 159; Muslim no. 226" }
]);
ibxSnAddAfter("sn-muawidzat", [
  { id: "sn-lampu", c: "tidur", t: "Memadamkan lampu dan menutup pintu sebelum tidur", v: 0, g: "Shahih", k: "tidur lampu api padam pintu tutup kunci malam kantong air makanan minuman jabir kebakaran tikus sumbu pelita lilin",
    p: "Sebelum tidur di malam hari, padamkan api atau lampu yang berisiko (pelita, lilin, kompor), tutup pintu, ikat mulut tempat air, dan tutup makanan dan minuman.",
    h: "Jabir bin Abdullah ra. meriwayatkan perintah Nabi ﷺ: padamkanlah lampu-lampu di malam hari bila kalian hendak tidur, tutuplah pintu-pintu, ikatlah mulut kantong-kantong air, dan tutuplah makanan dan minuman.",
    n: "Teks Arab Bukhari no. 6296 (Kitab Isti'dzan, bab menutup pintu di malam hari) saya baca dari en.tohed.com dan portainer.sunnah.com (kutipan sebagian). Tambahan tentang sebatang kayu yang diletakkan melintang diriwayatkan perawi dengan keraguan dan TIDAK dimuat di sini. Alasan (tikus menarik sumbu hingga membakar penghuni rumah) disebut pada riwayat Bukhari no. 6295 dan Muslim no. 2012 menurut halaman hadithanswers.com; teks Arab kedua riwayat itu tidak saya baca. Halaman itu juga mengutip Al-Qurthubi (perintah ini arahan atau anjuran), Ibnu Daqiq al-Id (mayoritas ulama tidak mewajibkan, Ahli Zhahir mewajibkan), dan An-Nawawi (bila lampu aman dari bahaya kebakaran, membiarkannya menyala tidak masalah); itu kutipan perantara, bukan dari kitab syarahnya. Lampu listrik tidak dibahas di halaman itu dan kartu ini tidak memutuskan hukumnya. Riwayat lain yang menyebut basmalah saat menutup pintu tidak dimuat karena tidak saya baca.",
    s: "HR. Bukhari no. 6296; Muslim no. 2012" }
]);
/* ===== IB2-B3d1: data sunnah tahap 3d-1: kategori BARU "Olahraga" (di akhir daftar kategori, sesudah "Tidur") + 4 sunnah (memakai ibxSnAddCat dan ibxSnAddAfter; sunnah disisipkan sesudah sn-lampu, jadi sunnah terakhir, supaya data tetap berkelompok per kategori dan urutan 48 sunnah lama tidak berubah). Teks dan nomor hadits dicek ke en.tohed.com, hadithunlocked.com lewat web (14 Nov 2026); cara mengamalkan dan catatan ditulis penyusun (v: 0). Tidak ada CSS atau kunci penyimpanan baru. Membalik: patch_ib2b3d1.py --reverse ===== */
ibxSnAddCat("tidur", ["olahraga", "Olahraga"]);
ibxSnAddAfter("sn-lampu", [
  { id: "sn-panah", c: "olahraga", t: "Belajar dan berlatih memanah", v: 0, g: "Shahih", k: "olahraga memanah panah panahan latihan kekuatan quwwah ramyu uqbah bin amir bidik tembak al-anfal",
    p: "Bila ada kesempatan, belajarlah memanah dan berlatihlah dengan teratur di tempat latihan yang aman dan dengan bimbingan pelatih.",
    h: "Uqbah bin Amir ra. berkata: aku mendengar Rasulullah ﷺ bersabda di atas mimbar: siapkanlah untuk menghadapi mereka kekuatan semampu kalian. Ketahuilah, sesungguhnya kekuatan itu adalah memanah; ketahuilah, sesungguhnya kekuatan itu adalah memanah; ketahuilah, sesungguhnya kekuatan itu adalah memanah.",
    n: "Teks Arab Muslim no. 1917 (Kitab Al-Imarah, bab keutamaan memanah dan anjuran mempelajarinya) saya baca dari en.tohed.com; kalimat intinya ala inna al-quwwata ar-ramyu (ketahuilah, kekuatan itu memanah), diulang tiga kali. Kalimat sebelumnya (siapkan kekuatan semampu kalian) adalah penggalan firman Allah QS. Al-Anfal: 60; penyebutan surah dan ayat itu pengetahuan penyusun, tidak tertera pada halaman yang saya baca. Konteks hadits adalah persiapan menghadapi musuh; memanah sebagai olahraga latihan badan adalah penerapan penyusun, bukan bunyi hadits. Judul bab di halaman itu juga menyebut celaan bagi orang yang mempelajarinya lalu melupakannya, tetapi riwayat tentang celaan itu tidak saya baca dan tidak dimuat. Terjemahan Indonesia adalah parafrase penyusun. Hukum olahraga lain dan perbedaan mazhab tidak dibahas di sini.",
    s: "HR. Muslim no. 1917" },
  { id: "sn-panah2", c: "olahraga", t: "Menyemangati dan ikut berlatih memanah bersama", v: 0, g: "Shahih", k: "olahraga memanah panah latihan bani aslam ismail semangat tim ikut serta sportif salamah bin al-akwa kelompok lomba bersama",
    p: "Dorong teman atau anak-anak yang berlatih memanah, dan bila ada kesempatan ikutlah berlatih bersama mereka. Bila berlatih atau berlomba berkelompok, jaga agar tiap kelompok tetap bersemangat.",
    h: "Salamah bin al-Akwa' ra. meriwayatkan bahwa Nabi ﷺ melewati sekelompok orang dari Bani Aslam yang sedang berlatih memanah, lalu beliau bersabda: panahlah, wahai anak keturunan Isma'il, karena ayah kalian dahulu seorang pemanah, dan aku bersama kelompok si fulan. Salah satu kelompok berhenti memanah. Beliau bertanya: mengapa kalian tidak memanah? Mereka menjawab: bagaimana kami memanah, sedangkan engkau bersama mereka? Beliau bersabda: panahlah, aku bersama kalian semua.",
    n: "Teks Arab Bukhari no. 2899 (bab anjuran memanah) saya baca dari en.tohed.com; kalimat intinya irmu bani isma'ila fa inna abakum kana ramiyan, wa ana ma'a bani fulanin, dan irmu fa ana ma'akum kullikum. Kelompok yang beliau pihaki disebut bani fulan, tanpa nama. Pelajaran menjaga semangat tiap kelompok pada kolom cara adalah penjelasan penyusun, bukan bunyi hadits. Hanya Bukhari no. 2899 yang saya baca; riwayat serupa di kitab lain tidak saya baca. Terjemahan Indonesia adalah parafrase penyusun. Hukum lomba berhadiah dan perbedaan mazhab tidak dibahas di sini.",
    s: "HR. Bukhari no. 2899" },
  { id: "sn-lari", c: "olahraga", t: "Berlomba lari santai dengan keluarga", v: 0, g: "Shahih", k: "olahraga lari lomba balap aisyah istri pasangan keluarga santai bermain kebugaran perjalanan sabqah",
    p: "Ajak pasangan atau anggota keluarga berlomba lari dengan santai, sebagai olahraga sekaligus hiburan, dalam suasana akrab dan saling menyenangkan.",
    h: "Aisyah ra. meriwayatkan bahwa ia pernah bersama Nabi ﷺ dalam suatu perjalanan. Ia berkata: aku berlomba lari dengan beliau dan aku mengalahkan beliau dengan kedua kakiku. Kemudian ketika badanku sudah berisi, aku berlomba lagi dengan beliau dan beliau mengalahkanku. Beliau bersabda: ini untuk kemenangan yang dulu itu.",
    n: "Teks Arab Abu Dawud no. 2578 (Kitab Jihad, bab lomba lari) saya baca dari hadithunlocked.com; kalimat intinya hadzihi bitilkas sabqah (ini untuk kemenangan yang itu). Halaman itu menandai hadits ini Shahih menurut Al-Albani dan mencatat bahwa Abu Zur'ah Ar-Razi menilai versi melalui seorang laki-laki dari Abu Salamah lebih shahih (perbedaan jalur periwayatan); saya tidak menelusuri hal itu lebih jauh, jadi derajat Shahih di kartu ini mengikuti Al-Albani. Ibnu Majah no. 1979 muncul pada hasil pencarian sebagai kemungkinan riwayat yang sama, tetapi tidak saya baca sehingga tidak dicantumkan. Penerapan ke keluarga dan ke olahraga lari masa kini adalah penerapan penyusun. Terjemahan Indonesia adalah parafrase penyusun. Hukum lomba berhadiah dan perbedaan mazhab tidak dibahas di sini.",
    s: "HR. Abu Dawud no. 2578; dinilai shahih oleh Al-Albani" },
  { id: "sn-kuda", c: "olahraga", t: "Berlatih berkuda dan mengadakan perlombaan", v: 0, g: "Shahih", k: "olahraga berkuda kuda pacu pacuan lomba perlombaan abdullah bin umar hafya tsaniyyatul wada latihan ketangkasan",
    p: "Bila ada kesempatan, berlatihlah berkuda dan ikut dalam perlombaan yang sehat; utamakan keselamatan dan perlakukan hewan dengan baik.",
    h: "Abdullah bin Umar ra. meriwayatkan bahwa Nabi ﷺ mengadakan perlombaan untuk kuda-kuda yang sudah dilatih, dari Al-Hafya' sampai Tsaniyyatul Wada', dan untuk kuda-kuda yang belum dilatih, dari Tsaniyyah itu sampai masjid Bani Zuraiq. Ibnu Umar berkata: aku termasuk yang ikut berpacu.",
    n: "Teks Arab Bukhari no. 2868 (Kitab Jihad dan Sirah, bab perlombaan antar kuda) saya baca dari hadithunlocked.com; kata dhummira diterjemahkan halaman itu made lean (kurus karena dilatih), saya tulis sudah dilatih. Jarak yang tertera pada terjemahan halaman itu (sekitar lima atau enam mil dan satu mil) tidak saya muat, karena teks Arab yang saya ambil tidak memuatnya dan tampak sebagai keterangan tambahan. Bukhari no. 420 dan Muslim no. 1870 muncul di hasil pencarian untuk hadits yang sama, tetapi tidak saya baca. Konteks hadits adalah pelatihan kuda perang; berkuda sebagai olahraga masa kini adalah penerapan penyusun. Terjemahan Indonesia adalah parafrase penyusun. Hukum hadiah atau taruhan dalam perlombaan dan perbedaan mazhab tidak dibahas di sini.",
    s: "HR. Bukhari no. 2868" }
]);
/* ===== IB2-B2b3a: hitungan "sudah diamalkan" per pekan (Senin sampai Minggu) dan runtun hari. Fungsi murni: hanya MEMBACA ibdb.days[d].s (lapisan data B2b1); tampilannya di B2b3b; tanpa kunci penyimpanan baru. Membalik: patch_ib2b2b3a.py --reverse ===== */
const ibxSnOk = d => typeof d === "string" && DATE_RE.test(d) && ymd(pd(d)) === d;   // tanggal nyata (2026-02-31 ditolak)
function ibxSnIds(d) {   // id sunnah unik dan valid yang tercatat pada tanggal d; larik kosong bila tanggal tidak valid atau belum ada catatan
  const x = ibxSnOk(d) ? ibdb.days[d] : null;
  if (!x || !Array.isArray(x.s)) return [];
  return Array.from(new Set(x.s.filter(id => IBX_SUN.some(z => z.id === id))));
}
function ibxSnMon(d) {   // tanggal Senin dari pekan yang memuat d (pekan Senin sampai Minggu); "" bila d tidak valid
  if (!ibxSnOk(d)) return "";
  return addDays(d, -((pd(d).getDay() + 6) % 7));
}
function ibxSnWeek(d) {   // ringkasan pekan yang memuat d (bawaan: hari ini). Hari mendatang tetap dihitung bila datanya ada (angka = isi data, bukan tebakan)
  const mon = ibxSnMon(d == null ? today() : d);
  if (!mon) return null;
  const tdy = today(), days = [], seen = new Set();
  let total = 0, active = 0;
  for (let i = 0; i < 7; i++) {
    const ds = addDays(mon, i), ids = ibxSnIds(ds);
    ids.forEach(id => seen.add(id));
    total += ids.length;
    if (ids.length) active++;
    days.push({ d: ds, n: ids.length, now: ds === tdy, fut: ds > tdy });
  }
  return { start: mon, end: days[6].d, days, total, active, distinct: seen.size };
}
function ibxSnStreak(d) {   // hari berturut-turut dengan sedikitnya satu sunnah tercatat, berakhir di d (bawaan: hari ini); bila d belum tercatat, hitung dari sehari sebelumnya, jadi hari yang masih berjalan belum memutus runtun (sama dengan ibxStreakSunnah); batas 800 hari
  let x = d == null ? today() : d;
  if (!ibxSnOk(x)) return 0;
  if (!ibxSnIds(x).length) x = addDays(x, -1);
  let n = 0;
  while (n < 800 && ibxSnIds(x).length) { n++; x = addDays(x, -1); }
  return n;
}
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2bw: Object.freeze({ ids: ibxSnIds, mon: ibxSnMon, week: ibxSnWeek, streak: ibxSnStreak }) }));
/* ===== IB2-B2b3b: kartu "Sunnah pekan ini" di tab Hari ini (tujuh lingkaran Senin sampai Minggu, sunnah tercatat, hari aktif, runtun). Hanya MEMBACA lewat ibxSnWeek dan ibxSnStreak dari B2b3a; diperbarui di tempat oleh QACT.ibxSnMark; tanpa kunci penyimpanan baru. Membalik: patch_ib2b2b3b.py --reverse ===== */
const IBX_SNW_HR = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
function ibxSnWeekDm(d) { const x = pd(d); return x.getDate() + " " + BULAN[x.getMonth()].slice(0, 3); }   // "9 Nov"
function ibxSnWeekCard() {
  const w = ibxSnWeek(), st = ibxSnStreak();
  if (!w) return "";
  const td = w.days.find(x => x.now), tn = td ? td.n : 0;
  const lis = w.days.map((x, i) => {
    const lab = HARI[pd(x.d).getDay()] + " " + ibxSnWeekDm(x.d) + ": " + (x.n ? x.n + " sunnah" : "belum ada") + (x.now ? ", hari ini" : "") + (x.fut ? ", belum tiba" : "");
    return '<li class="ibx-snwd"' + (x.n ? ' data-n="' + x.n + '"' : "") + (x.now ? ' data-now="1"' : "") + (x.fut ? ' data-fut="1"' : "") + ' aria-label="' + esc(lab) + '"><span class="l" aria-hidden="true">' + IBX_SNW_HR[i] + '</span><span class="c" aria-hidden="true">' + (x.n || "") + "</span></li>";
  }).join("");
  const hint = !w.total ? "Belum ada yang tercatat pekan ini. Ketuk \"Sudah saya amalkan\" pada sunnah hari ini atau di tab Sunnah untuk mulai. "
    : (!tn && st ? "Hari beruntun dihitung sampai kemarin dan masih berjalan; catat satu sunnah hari ini agar bertambah. " : "");
  return '<section class="ibx-card ibx-snw" id="ibxSnW" aria-label="Sunnah pekan ini"><h3>Sunnah pekan ini</h3><p class="ibx-snk">' + ibxSnWeekDm(w.start) + "–" + ibxSnWeekDm(w.end) + "</p>" +
    '<ol class="ibx-snwk">' + lis + "</ol>" +
    '<div class="ibx-snws"><div><b>' + w.total + "</b><small>sunnah tercatat</small></div><div><b>" + w.active + "<i>/7</i></b><small>hari aktif</small></div><div><b>" + st + "</b><small>hari beruntun</small></div></div>" +
    '<p class="ibx-fine">' + hint + "Dihitung dari tombol \"Sudah saya amalkan\"; belum masuk skor ibadah harian.</p></section>";
}
function ibxSnWeekUpd() {   // gambar ulang kartu di tempat bila sedang tampil (tab Hari ini); tab lain: tidak ada yang dilakukan
  const el = document.getElementById("ibxSnW");
  if (el) el.outerHTML = ibxSnWeekCard();
}
window.DL = Object.freeze(Object.assign({}, window.DL, { ib2bx: Object.freeze({ card: ibxSnWeekCard, upd: ibxSnWeekUpd }) }));
/* ---------- tab Tasbih ---------- */
function ibxTsTarget(t) { return t.k === 'sholat' ? IBX_TS_SH[Math.min(t.ph, 2)][2] : t.t; }
function ibxTsDone(t) { return t.k === 'sholat' && t.ph >= 3; }
function ibxTsInner() {
  const t = ibdb.pref.tsb, tg = ibxTsTarget(t), done = ibxTsDone(t), pct = done ? 1 : tg > 0 ? Math.min(1, t.n / tg) : 0, C = 2 * Math.PI * 92;
  const sh = t.k === 'sholat' ? IBX_TS_SH[Math.min(t.ph, 2)] : null;
  const lab = done ? 'Selesai. Alhamdulillah.' : sh ? '<span class="ar" lang="ar" dir="rtl">' + sh[1] + '</span><span>' + sh[0] + ' · ' + (t.ph + 1) + ' dari 3</span>' : (tg ? 'Target ' + tg : 'Tanpa target');
  return '<button class="ibx-tsb" data-q="ibxTsTap" aria-label="Tambah hitungan" ' + (done ? 'disabled' : '') + '><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="92"/><circle id="ibxTsRing" class="fg" cx="100" cy="100" r="92" transform="rotate(-90 100 100)" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/></svg><b id="ibxTsN">' + (done ? '✓' : t.n) + '</b><span id="ibxTsL">' + lab + '</span></button>';
}
function ibxTsPanel() {
  const t = ibdb.pref.tsb, td = ibdb.pref.tsb.tot[today()] || 0, wk = Array.from({ length: 7 }, (_, i) => ibdb.pref.tsb.tot[addDays(today(), -i)] || 0).reduce((a, b) => a + b, 0);
  const msg = ibxTsMsg; ibxTsMsg = '';
  return '<section class="ibx-card ibx-ts"><div class="ibx-modes" role="group" aria-label="Mode tasbih"><button class="ibx-chip" data-q="ibxTsMode" data-v="bebas" aria-pressed="' + (t.k === 'bebas') + '">Bebas</button><button class="ibx-chip" data-q="ibxTsMode" data-v="sholat" aria-pressed="' + (t.k === 'sholat') + '">Setelah shalat (33·33·34)</button></div>' +
    (msg ? '<p class="ibx-tsm" role="status">' + esc(msg) + '</p>' : '') +
    (t.k === 'bebas' ? '<div class="ibx-chips ibx-tg" role="group" aria-label="Target hitungan">' + IBX_TS_PRE.map(v => '<button class="ibx-chip" data-q="ibxTsTarget" data-v="' + v + '" aria-pressed="' + (t.t === v) + '">' + (v ? v : 'Tanpa target') + '</button>').join('') + '</div>' : '') +
    '<div id="ibxTsBox" class="ibx-tbox">' + ibxTsInner() + '</div>' +
    '<div class="ibx-tsa"><button class="ibx-btn" data-q="ibxTsUndo"' + (t.n <= 0 && !(t.k === 'sholat' && t.ph > 0) ? ' disabled' : '') + '>Kurangi 1</button><button class="ibx-btn" data-q="ibxTsReset">Ulangi dari 0</button></div>' +
    '<div class="ibx-set"><div><b>Getar saat menekan</b></div><button class="ibx-sw" role="switch" aria-checked="' + ibdb.pref.vib + '" aria-label="Getar saat menekan" data-q="ibxVib"></button></div>' +
    '<p class="ibx-fine" id="ibxTsTot">Hari ini ' + td + ' kali · 7 hari terakhir ' + wk + ' kali. Hitungan tetap tersimpan walau halaman ditutup.</p></section>';
}
IBX_PANEL.tasbih = ibxTsPanel; IBX_READY.tasbih = true;
function ibxTsBuzz(p) { if (ibdb.pref.vib && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* abaikan */ } } }
function ibxTsAddTot(d) { const t = ibdb.pref.tsb, k = today(), v = (t.tot[k] || 0) + d; if (v > 0) t.tot[k] = v; else delete t.tot[k]; }
function ibxTsPaintLight() {   // perbarui angka dan cincin tanpa menggambar ulang tombol
  const t = ibdb.pref.tsb, tg = ibxTsTarget(t), pct = tg > 0 ? Math.min(1, t.n / tg) : 0, C = 2 * Math.PI * 92;
  const n = $('#ibxTsN'), r = $('#ibxTsRing'), tt = $('#ibxTsTot');
  if (n) n.textContent = t.n;
  if (r) r.setAttribute('stroke-dashoffset', (C * (1 - pct)).toFixed(1));
  if (tt) { const td = t.tot[today()] || 0, wk = Array.from({ length: 7 }, (_, i) => t.tot[addDays(today(), -i)] || 0).reduce((a, b) => a + b, 0); tt.textContent = 'Hari ini ' + td + ' kali · 7 hari terakhir ' + wk + ' kali. Hitungan tetap tersimpan walau halaman ditutup.'; }
}
function ibxTsTap() {
  const t = ibdb.pref.tsb;
  if (ibxTsDone(t)) return;
  t.n++; ibxTsAddTot(1);
  const tg = ibxTsTarget(t);
  let full = false;
  if (t.k === 'sholat' && t.n >= tg) { t.ph++; t.n = 0; full = true; }
  else if (t.k === 'bebas' && tg > 0 && t.n === tg) { ibxTsMsg = ''; full = true; ibxTsBuzz([70, 50, 70]); }
  else ibxTsBuzz(10);
  if (t.k === 'sholat' && full) ibxTsBuzz([70, 50, 70]);
  ibxSave();
  if (t.k === 'sholat' && full) { const b = $('#ibxTsBox'); if (b) b.innerHTML = ibxTsInner(); const u = $('[data-q="ibxTsUndo"]'); if (u) u.disabled = false; ibxTsPaintLight(); }
  else { ibxTsPaintLight(); const u = $('[data-q="ibxTsUndo"]'); if (u) u.disabled = false; }
}
QACT.ibxTsTap = ibxTsTap;
QACT.ibxTsUndo = () => {
  const t = ibdb.pref.tsb;
  if (t.n > 0) { t.n--; ibxTsAddTot(-1); }
  else if (t.k === 'sholat' && t.ph > 0) { t.ph--; t.n = IBX_TS_SH[t.ph][2] - 1; ibxTsAddTot(-1); }
  else return;
  ibxSave(); ibxRender();
};
QACT.ibxTsReset = () => { const t = ibdb.pref.tsb; t.n = 0; t.ph = 0; ibxSave(); ibxRender(); };
QACT.ibxTsMode = b => { const t = ibdb.pref.tsb, k = b.dataset.v === 'sholat' ? 'sholat' : 'bebas'; if (t.k === k) return; t.k = k; t.n = 0; t.ph = 0; ibxSave(); ibxRender(); };
QACT.ibxTsTarget = b => { const v = parseInt(b.dataset.v, 10); if (!IBX_TS_PRE.includes(v)) return; const t = ibdb.pref.tsb; t.t = v; ibxSave(); ibxRender(); };
QACT.ibxVib = () => { ibdb.pref.vib = !ibdb.pref.vib; ibxSave(); ibxRender(); if (ibdb.pref.vib) ibxTsBuzz(20); };
QACT.ibxTsGo = b => {   // dari kartu doa: pindah ke Tasbih dengan target jumlah bacaan
  const d = IBX_DOA.find(x => x.id === b.dataset.id); if (!d) return;
  const t = ibdb.pref.tsb;
  if (t.n > 0 || t.ph > 0) ibxTsMsg = 'Hitungan sebelumnya masih berjalan (' + t.n + '); ketuk "Ulangi dari 0" bila ingin memulai ' + d.n + ' kali untuk doa ini.';
  else if (d.id === 'tasbihshalat') { t.k = 'sholat'; t.ph = 0; }
  else { t.k = 'bebas'; t.t = IBX_TS_PRE.includes(d.n) ? d.n : 100; if (!IBX_TS_PRE.includes(d.n)) t.t = 100; }
  ibxSave(); ibxSrOpen = false; ibxQ = ''; ibxTab = 'tasbih'; ibxRender();
};
/* ---------- aksi tab Doa ---------- */
QACT.ibxCat = b => { ibxDoaCat = b.dataset.v; ibxRender(); };
QACT.ibxAr = b => { const n = ibdb.pref.ar + (parseInt(b.dataset.v, 10) || 0); if (n < 0 || n >= IBX_AR.length) return; ibdb.pref.ar = n; ibxSave(); ibxRender(); };
QACT.ibxLat = () => { ibdb.pref.lat = !ibdb.pref.lat; ibxSave(); ibxRender(); };
QACT.ibxFav = b => {
  const id = b.dataset.id, f = ibdb.pref.fav, i = f.indexOf(id);
  if (!IBX_DOA.some(d => d.id === id)) return;
  if (i >= 0) f.splice(i, 1); else if (f.length < 100) f.push(id); else { toast('Favorit penuh (maks. 100).'); return; }
  ibxSave();
  const on = f.includes(id);
  document.querySelectorAll('#ibBody [data-q="ibxFav"][data-id="' + id + '"]').forEach(x => { x.setAttribute('aria-pressed', String(on)); x.innerHTML = ibxStar(on) + '<span>' + (on ? 'Tersimpan' : 'Favorit') + '</span>'; });
};
QACT.ibxCopy = b => {
  const d = IBX_DOA.find(x => x.id === b.dataset.id); if (!d) return;
  const txt = d.t + '\n\n' + d.ar + '\n\n' + d.lat + '\n\n' + d.tr + '\n\nSumber: ' + d.s;
  const ok = () => toast('Doa disalin.'), no = () => toast('Tidak bisa menyalin di perangkat ini.');
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, no); else no(); } catch (e) { no(); }
};
QACT.ibxMark = b => {
  const id = b.dataset.id; ibxToggle(today(), id);
  const on = (ibdb.days[today()] || { c: [] }).c.includes(id); b.setAttribute('aria-pressed', String(on));
};
/* ---------- Cari ---------- */
const IBX_SR_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
const IBX_SUGG = ['tayamum', 'doa makan', 'sayyidul istighfar', 'safar', 'wudhu', 'berbuka'];
function ibxSearchHtml() {
  const q = ibxQ.trim();
  if (!q) return '<section class="ibx-card"><h3>Pencarian cerdas</h3><p class="ibx-sub">Cari judul doa, kata dalam artinya, tulisan Latin atau Arab, atau panduan fiqih. Ejaan dzikir/zikir dan shalat/salat sama saja.</p><div class="ibx-chips">' + IBX_SUGG.map(s => '<button class="ibx-chip" data-q="ibxSq" data-v="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></section>';
  const r = ibxSearch(q);
  if (!r.length) return '<section class="ibx-card"><h3>Tidak ketemu</h3><p class="ibx-sub">Tidak ada hasil untuk "' + esc(q) + '". Coba kata yang lebih umum, mis. "makan", "tidur", atau "wudhu".</p></section>';
  return '<p class="ibx-cnt" role="status">' + r.length + ' hasil</p><div class="ibx-dl" style="--ibar:' + IBX_AR[ibdb.pref.ar] + 'px">' + r.map(x => x.h).join('') + '</div>';
}
function ibxSrPaint() { const p = $('#ibxPanel'); if (p) p.innerHTML = ibxSearchHtml(); }
function ibxSrDecorate(wasQ) {
  const root = $('#ibBody'); if (!root) return;
  const tabs = root.querySelector('.ibx-tabs'); if (!tabs) return;
  if (ibxSrOpen) {
    const bar = document.createElement('div'); bar.className = 'ibx-sr';
    bar.innerHTML = IBX_SR_ICO + '<input id="ibxQ" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Cari doa, panduan, atau ayat" aria-label="Cari doa, panduan, atau ayat"><button class="ibx-lnk" data-q="ibxSrClose" data-fk="srx">Batal</button>';
    const inp = bar.querySelector('input'); inp.value = ibxQ;
    tabs.replaceWith(bar);
    ibxSrPaint();
    if (wasQ) { inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* abaikan */ } }
  } else tabs.insertAdjacentHTML('afterbegin', '<button class="ibx-tab ibx-sico" data-q="ibxSrOpen" data-fk="sr" aria-label="Cari doa, panduan, dan ayat">' + IBX_SR_ICO + '</button>');
}
{
  const baseRenderB = ibxRender;
  ibxRender = function () {
    const ae = document.activeElement, wasQ = !!(ae && ae.id === 'ibxQ');
    baseRenderB();
    ibxSrDecorate(wasQ);
  };
  RENDER.ibadah = ibxRender;
}
QACT.ibxSrOpen = () => { ibxSrOpen = true; ibxCompassStop(); ibxRender(); const i = $('#ibxQ'); if (i) i.focus(); };
QACT.ibxSrClose = () => { ibxSrOpen = false; ibxQ = ''; ibxRender(); };
QACT.ibxSq = b => { ibxQ = String(b.dataset.v || ''); const i = $('#ibxQ'); if (i) { i.value = ibxQ; i.focus(); } ibxSrPaint(); };
document.addEventListener('input', ev => { const t = ev.target; if (t && t.id === 'ibxQ') { ibxQ = t.value; ibxSrPaint(); } });
document.addEventListener('keydown', ev => { const t = ev.target; if (t && t.id === 'ibxQ' && ev.key === 'Escape') { ibxSrOpen = false; ibxQ = ''; ibxRender(); } });
IBX_FRESH.push(() => { ibxSrOpen = false; ibxQ = ''; ibxDoaCat = 'all'; ibxTsMsg = ''; });
{
  const baseTabB = QACT.ibxTab;
  QACT.ibxTab = b => { ibxSrOpen = false; ibxQ = ''; baseTabB(b); };
}
window.DL = Object.freeze(Object.assign({}, window.DL, { b81b: Object.freeze({ doa: IBX_DOA, guide: IBX_GUIDE, cat: IBX_CAT, norm: ibxNorm, search: ibxSearch, searchHooks: IBX_SEARCH, tsTap: ibxTsTap, tsInner: ibxTsInner, cleanPref2: ibxCleanPref2, setQ: q => { ibxQ = String(q); }, setCat: c => { ibxDoaCat = c; }, ar: IBX_AR }) }));
/* ===== /v81b ===== */
/* ===== v81c: halaman Ibadah: tab Al-Qur'an (daftar surah, pembaca, terjemahan Kemenag, tafsir ringkas, murottal beberapa qari, penanda, simpan offline, cari ayat). Membalik: patch81c.py --reverse ===== */
// Teks Al-Qur'an TIDAK ditanam di berkas ini (supaya tidak ada salah ketik pada ayat): diambil dari API publik saat dibuka, divalidasi (jumlah ayat harus cocok), lalu disimpan di IndexedDB `dailylog-quran` agar bisa dibaca tanpa internet.
// Yang ditanam hanya indeks 114 surah (nama Latin, arti, jumlah ayat; total harus 6236) untuk daftar dan pencarian.
const QR_SURAH = [
  ['Al-Fatihah', 'Pembukaan', 7],
  ['Al-Baqarah', 'Sapi Betina', 286],
  ["Ali 'Imran", 'Keluarga Imran', 200],
  ["An-Nisa'", 'Perempuan', 176],
  ["Al-Ma'idah", 'Hidangan', 120],
  ["Al-An'am", 'Binatang Ternak', 165],
  ["Al-A'raf", 'Tempat Tertinggi', 206],
  ['Al-Anfal', 'Rampasan Perang', 75],
  ['At-Taubah', 'Pengampunan', 129],
  ['Yunus', 'Yunus', 109],
  ['Hud', 'Hud', 123],
  ['Yusuf', 'Yusuf', 111],
  ["Ar-Ra'd", 'Guruh', 43],
  ['Ibrahim', 'Ibrahim', 52],
  ['Al-Hijr', 'Hijr', 99],
  ['An-Nahl', 'Lebah', 128],
  ["Al-Isra'", 'Perjalanan Malam', 111],
  ['Al-Kahf', 'Gua', 110],
  ['Maryam', 'Maryam', 98],
  ['Taha', 'Taha', 135],
  ["Al-Anbiya'", 'Para Nabi', 112],
  ['Al-Hajj', 'Haji', 78],
  ["Al-Mu'minun", 'Orang-orang Mukmin', 118],
  ['An-Nur', 'Cahaya', 64],
  ['Al-Furqan', 'Pembeda', 77],
  ["Asy-Syu'ara'", 'Para Penyair', 227],
  ['An-Naml', 'Semut', 93],
  ['Al-Qasas', 'Kisah-kisah', 88],
  ["Al-'Ankabut", 'Laba-laba', 69],
  ['Ar-Rum', 'Bangsa Romawi', 60],
  ['Luqman', 'Luqman', 34],
  ['As-Sajdah', 'Sujud', 30],
  ['Al-Ahzab', 'Golongan-golongan yang Bersekutu', 73],
  ["Saba'", "Kaum Saba'", 54],
  ['Fatir', 'Pencipta', 45],
  ['Yasin', 'Yasin', 83],
  ['As-Saffat', 'Barisan-barisan', 182],
  ['Sad', 'Sad', 88],
  ['Az-Zumar', 'Rombongan-rombongan', 75],
  ['Gafir', 'Maha Pengampun', 85],
  ['Fussilat', 'Yang Dijelaskan', 54],
  ['Asy-Syura', 'Musyawarah', 53],
  ['Az-Zukhruf', 'Perhiasan', 89],
  ['Ad-Dukhan', 'Kabut', 59],
  ['Al-Jasiyah', 'Yang Berlutut', 37],
  ['Al-Ahqaf', 'Bukit-bukit Pasir', 35],
  ['Muhammad', 'Muhammad', 38],
  ['Al-Fath', 'Kemenangan', 29],
  ['Al-Hujurat', 'Kamar-kamar', 18],
  ['Qaf', 'Qaf', 45],
  ['Az-Zariyat', 'Angin yang Menerbangkan', 60],
  ['At-Tur', 'Bukit', 49],
  ['An-Najm', 'Bintang', 62],
  ['Al-Qamar', 'Bulan', 55],
  ['Ar-Rahman', 'Yang Maha Pengasih', 78],
  ["Al-Waqi'ah", 'Hari Kiamat', 96],
  ['Al-Hadid', 'Besi', 29],
  ['Al-Mujadalah', 'Gugatan', 22],
  ['Al-Hasyr', 'Pengusiran', 24],
  ['Al-Mumtahanah', 'Wanita yang Diuji', 13],
  ['As-Saff', 'Barisan', 14],
  ["Al-Jumu'ah", 'Jumat', 11],
  ['Al-Munafiqun', 'Orang-orang Munafik', 11],
  ['At-Tagabun', 'Hari Dinampakkan Kesalahan', 18],
  ['At-Talaq', 'Talak', 12],
  ['At-Tahrim', 'Mengharamkan', 12],
  ['Al-Mulk', 'Kerajaan', 30],
  ['Al-Qalam', 'Pena', 52],
  ['Al-Haqqah', 'Hari Kiamat', 52],
  ["Al-Ma'arij", 'Tempat-tempat Naik', 44],
  ['Nuh', 'Nuh', 28],
  ['Al-Jinn', 'Jin', 28],
  ['Al-Muzzammil', 'Orang yang Berselimut', 20],
  ['Al-Muddassir', 'Orang yang Berkemul', 56],
  ['Al-Qiyamah', 'Hari Kiamat', 40],
  ['Al-Insan', 'Manusia', 31],
  ['Al-Mursalat', 'Malaikat-malaikat yang Diutus', 50],
  ["An-Naba'", 'Berita Besar', 40],
  ["An-Nazi'at", 'Malaikat-malaikat yang Mencabut', 46],
  ["'Abasa", 'Ia Berwajah Masam', 42],
  ['At-Takwir', 'Menggulung', 29],
  ['Al-Infitar', 'Terbelah', 19],
  ['Al-Mutaffifin', 'Orang-orang Curang', 36],
  ['Al-Insyiqaq', 'Terbelah', 25],
  ['Al-Buruj', 'Gugusan Bintang', 22],
  ['At-Tariq', 'Yang Datang di Malam Hari', 17],
  ["Al-A'la", 'Yang Paling Tinggi', 19],
  ['Al-Gasyiyah', 'Hari Pembalasan', 26],
  ['Al-Fajr', 'Fajar', 30],
  ['Al-Balad', 'Negeri', 20],
  ['Asy-Syams', 'Matahari', 15],
  ['Al-Lail', 'Malam', 21],
  ['Ad-Duha', 'Duha', 11],
  ['Asy-Syarh', 'Kelapangan', 8],
  ['At-Tin', 'Buah Tin', 8],
  ["Al-'Alaq", 'Segumpal Darah', 19],
  ['Al-Qadr', 'Kemuliaan', 5],
  ['Al-Bayyinah', 'Bukti Nyata', 8],
  ['Az-Zalzalah', 'Guncangan', 8],
  ["Al-'Adiyat", 'Kuda Perang yang Berlari Kencang', 11],
  ["Al-Qari'ah", 'Hari Kiamat', 11],
  ['At-Takasur', 'Bermegah-megahan', 8],
  ["Al-'Asr", 'Masa', 3],
  ['Al-Humazah', 'Pengumpat', 9],
  ['Al-Fil', 'Gajah', 5],
  ['Quraisy', 'Suku Quraisy', 4],
  ["Al-Ma'un", 'Barang-barang yang Berguna', 7],
  ['Al-Kausar', 'Nikmat yang Banyak', 3],
  ['Al-Kafirun', 'Orang-orang Kafir', 6],
  ['An-Nasr', 'Pertolongan', 3],
  ['Al-Lahab', 'Gejolak Api', 5],
  ['Al-Ikhlas', 'Ikhlas', 4],
  ['Al-Falaq', 'Waktu Subuh', 5],
  ['An-Nas', 'Manusia', 6]
];
const QR_QARI = [['01', 'Abdullah Al-Juhany'], ['02', 'Abdul Muhsin Al-Qasim'], ['03', 'Abdurrahman As-Sudais'], ['04', 'Ibrahim Al-Dossari'], ['05', 'Misyari Rasyid Al-Afasi']];
const QR_SPD = [0.75, 1, 1.25, 1.5];
const QR_PAGE = 30;
const QR_BSM = ['بسم', 'الله', 'الرحمن', 'الرحيم'];
const QR_BSM_TXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const qrDef = () => ({ lat: true, tr: true, q: '05', mode: 'ayat', spd: 1, rep: false, last: null, bm: [] });
function ibxCleanPref3(p, b) {   // dipanggil ibxClean: pengaturan + penanda + terakhir dibaca Al-Qur'an
  const r = p.qr && typeof p.qr === 'object' && !Array.isArray(p.qr) ? p.qr : {}, d = qrDef();
  d.lat = r.lat !== false;
  d.tr = r.tr !== false;
  d.q = QR_QARI.some(x => x[0] === r.q) ? r.q : '05';
  d.mode = r.mode === 'full' ? 'full' : 'ayat';
  d.spd = QR_SPD.includes(Number(r.spd)) ? Number(r.spd) : 1;
  d.rep = r.rep === true;
  const l = r.last;
  if (l && typeof l === 'object' && Number.isInteger(l.n) && l.n >= 1 && l.n <= 114 && Number.isInteger(l.a) && l.a >= 1 && l.a <= QR_SURAH[l.n - 1][2]) d.last = { n: l.n, a: l.a };
  if (Array.isArray(r.bm)) {
    const seen = new Set();
    r.bm.forEach(k => {
      const m = typeof k === 'string' ? /^(\d{1,3}):(\d{1,3})$/.exec(k) : null;
      if (!m) return;
      const n = +m[1], a = +m[2];
      if (n >= 1 && n <= 114 && a >= 1 && a <= QR_SURAH[n - 1][2] && seen.size < 200) seen.add(n + ':' + a);
    });
    d.bm = Array.from(seen);
  }
  b.pref.qr = d;
}
/* ---------- sumber data (dengan cadangan) ---------- */
const qrStrip = s => String(s == null ? '' : s).replace(/<[^>]*>/g, '').trim();
function qrAu(o) {
  const r = {};
  if (o && typeof o === 'object' && !Array.isArray(o)) QR_QARI.forEach(q => { const u = o[q[0]]; if (typeof u === 'string' && /^https?:\/\//.test(u)) r[q[0]] = u; });
  return r;
}
function qrStripBsm(t, n) {   // sebagian sumber menaruh basmalah di depan ayat 1; di pembaca basmalah ditampilkan sendiri
  if (n === 1 || n === 9) return t;
  const w = String(t).split(' ');
  if (w.length > 4 && QR_BSM.every((x, i) => ibxNorm(w[i]) === x)) return w.slice(4).join(' ');
  return t;
}
function qrNormEq(j, n) {
  const d = j && j.data;
  if (!d || !Array.isArray(d.ayat) || d.ayat.length !== QR_SURAH[n - 1][2]) throw new Error('format data tidak cocok');
  const ay = d.ayat.map((x, i) => ({ a: Number(x.nomorAyat) || i + 1, ar: qrStripBsm(String(x.teksArab || ''), n), lat: String(x.teksLatin || ''), id: String(x.teksIndonesia || ''), au: qrAu(x.audio) }));
  if (ay.some(x => !x.ar)) throw new Error('teks Arab kosong');
  return { n, nama: String(d.nama || ''), latin: String(d.namaLatin || QR_SURAH[n - 1][0]), arti: String(d.arti || QR_SURAH[n - 1][1]), tempat: String(d.tempatTurun || ''), desk: qrStrip(d.deskripsi), full: qrAu(d.audioFull), ay, src: 'eq', ts: Date.now() };
}
function qrNormAc(j, n) {
  const eds = j && Array.isArray(j.data) ? j.data : [];
  const get = id => eds.find(e => e && e.edition && e.edition.identifier === id);
  const ar = get('quran-uthmani'), idn = get('id.indonesian'), lt = get('en.transliteration');
  const cnt = QR_SURAH[n - 1][2];
  if (!ar || !idn || !ar.ayahs || ar.ayahs.length !== cnt || !idn.ayahs || idn.ayahs.length !== cnt) throw new Error('format data tidak cocok');
  const ay = ar.ayahs.map((x, i) => ({
    a: Number(x.numberInSurah) || i + 1, ar: qrStripBsm(String(x.text || ''), n), lat: lt && lt.ayahs && lt.ayahs[i] ? String(lt.ayahs[i].text || '') : '', id: String(idn.ayahs[i].text || ''),
    au: { '05': 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + x.number + '.mp3' }
  }));
  if (ay.some(x => !x.ar)) throw new Error('teks Arab kosong');
  return { n, nama: String(ar.name || ''), latin: QR_SURAH[n - 1][0], arti: QR_SURAH[n - 1][1], tempat: String(ar.revelationType || ''), desk: '', full: { '05': 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/' + n + '.mp3' }, ay, src: 'ac', ts: Date.now() };
}
const QR_SRC = [
  { id: 'eq', url: n => 'https://equran.id/api/v2/surat/' + n, norm: qrNormEq },
  { id: 'ac', url: n => 'https://api.alquran.cloud/v1/surah/' + n + '/editions/quran-uthmani,id.indonesian,en.transliteration', norm: qrNormAc }
];
const QR_TAF = n => 'https://equran.id/api/v2/tafsir/' + n;
async function qrFetchJson(url, ms) {
  const c = typeof AbortController === 'function' ? new AbortController() : null, t = setTimeout(() => { if (c) c.abort(); }, ms || 12000);
  try { const r = await fetch(url, c ? { signal: c.signal } : undefined); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); }
}
async function qrNet(n) {
  let err = null;
  for (const s of QR_SRC) { try { return s.norm(await qrFetchJson(s.url(n)), n); } catch (e) { err = e; } }
  throw err || new Error('gagal memuat');
}
/* ---------- penyimpanan offline (IndexedDB; tidak ikut cadangan JSON karena besar dan bisa diunduh ulang) ---------- */
const QR = { mem: {}, tfm: {}, have: new Set(), dbp: null, warm: null, err: {}, load: {}, nz: {}, idx: null };
function qrDb() {
  if (!QR.dbp) QR.dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('dailylog-quran', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('surah', { keyPath: 'n' }); d.createObjectStore('tafsir', { keyPath: 'n' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
    } catch (e) { rej(e); }
  });
  return QR.dbp;
}
async function qrIdb(st, mode, fn) {
  try {
    const d = await qrDb();
    return await new Promise((res, rej) => { const t = d.transaction(st, mode), s = t.objectStore(st), r = fn(s); t.oncomplete = () => res(r && 'result' in r ? r.result : true); t.onerror = t.onabort = () => rej(t.error); });
  } catch (e) { return null; }
}
const qrValid = (c, n) => !!c && c.n === n && Array.isArray(c.ay) && c.ay.length === QR_SURAH[n - 1][2] && c.ay.every(x => x && typeof x.ar === 'string' && x.ar);
async function qrGet(n) {
  if (QR.mem[n]) return QR.mem[n];
  const c = await qrIdb('surah', 'readonly', s => s.get(n));
  if (qrValid(c, n)) { QR.mem[n] = c; QR.have.add(n); return c; }
  const s = await qrNet(n);
  QR.mem[n] = s; QR.have.add(n);
  await qrIdb('surah', 'readwrite', st => st.put(s));
  return s;
}
function qrWarm() {
  if (!QR.warm) QR.warm = qrIdb('surah', 'readonly', s => s.getAll()).then(rows => {
    (Array.isArray(rows) ? rows : []).forEach(r => { if (r && qrValid(r, r.n)) { if (!QR.mem[r.n]) QR.mem[r.n] = r; QR.have.add(r.n); } });
    qrRefresh(null);
  });
  return QR.warm;
}
async function qrTafsir(n) {
  if (QR.tfm[n]) return QR.tfm[n];
  const c = await qrIdb('tafsir', 'readonly', s => s.get(n));
  if (c && c.n === n && c.t && typeof c.t === 'object') { QR.tfm[n] = c.t; return c.t; }
  const j = await qrFetchJson(QR_TAF(n)), d = j && j.data, arr = d && Array.isArray(d.tafsir) ? d.tafsir : null;
  if (!arr || !arr.length) throw new Error('tafsir tidak tersedia');
  const t = {}; arr.forEach(x => { const a = Number(x.ayat); if (a >= 1 && a <= QR_SURAH[n - 1][2] && x.teks) t[a] = String(x.teks); });
  if (!Object.keys(t).length) throw new Error('tafsir kosong');
  QR.tfm[n] = t;
  await qrIdb('tafsir', 'readwrite', s => s.put({ n, t }));
  return t;
}
/* ---------- status tampilan ---------- */
const qr = { n: 0, shown: QR_PAGE, fa: 0, tf: new Set(), find: '', flt: 'all', setOpen: false, clr: false, dl: null };
const qrP = () => ibdb.pref.qr;
const qrName = n => QR_SURAH[n - 1][0];
const qrCnt = n => QR_SURAH[n - 1][2];
function qrRefresh(n) {
  if (curView !== 'ibadah') return;
  if (ibxSrOpen) { ibxSrPaint(); return; }
  if (ibxTab === 'quran' && (n == null ? !qr.n : qr.n === n)) ibxRender();
}
const QI = {
  play: '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause: '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z"/></svg>',
  bm: on => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10v15l-5-3.6-5 3.6z"' + (on ? ' class="on"' : '') + '/></svg>',
  tf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h8l3 3v12H7zM10 11h5M10 14.5h5"/></svg>',
  cp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h9.5v10H9zM6 15.5v-11h9.5"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5.5v13M18 5.5l-9 6.5 9 6.5z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 5.5v13M6 5.5l9 6.5-9 6.5z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  dl: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 8"/></svg>'
};
/* ---------- audio murottal ---------- */
const QA = new Audio();
QA.preload = 'none';
try { QA.setAttribute('playsinline', ''); } catch (e) { /* abaikan */ }
const qa = { n: 0, a: 0, on: false, mode: 'ayat', q: '05' };
const qaQari = id => (QR_QARI.find(x => x[0] === id) || QR_QARI[4])[1];
function qaUrl(s, a) {
  const pick = o => { if (!o) return null; const q = qrP().q; if (o[q]) return [q, o[q]]; if (o['05']) return ['05', o['05']]; const k = Object.keys(o)[0]; return k ? [k, o[k]] : null; };
  return pick(qa.mode === 'full' ? s.full : (s.ay[a - 1] || {}).au);
}
function qaMeta(s) {
  try {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title: s.latin + (qa.mode === 'ayat' ? ' · ayat ' + qa.a : ''), artist: qaQari(qa.q), album: 'Al-Qur\'an' });
    [['play', () => { QA.play(); }], ['pause', () => { QA.pause(); }], ['previoustrack', () => qaStep(-1)], ['nexttrack', () => qaStep(1)], ['stop', qaStop]].forEach(h => { try { ms.setActionHandler(h[0], h[1]); } catch (e) { /* tidak didukung */ } });
  } catch (e) { /* abaikan */ }
}
async function qaStart(n, a, full) {
  let s;
  try { s = await qrGet(n); } catch (e) { toast('Audio butuh data surah; sambungkan internet dulu.'); return; }
  qa.n = n; qa.a = Math.min(Math.max(a || 1, 1), s.ay.length); qa.mode = full ? 'full' : qrP().mode;
  const u = qaUrl(s, qa.a);
  if (!u) { toast('Audio surah ini tidak tersedia di sumber data.'); qa.n = 0; qaPaintBar(); return; }
  qa.q = u[0];
  if (u[0] !== qrP().q) toast('Qari pilihan tidak tersedia di sumber ini; memakai ' + qaQari(u[0]) + '.');
  QA.src = u[1]; QA.playbackRate = qrP().spd;
  qaMeta(s);
  if (qa.mode === 'ayat') { qrP().last = { n, a: qa.a }; ibxSave(); }
  qaPaintBar(); qaMark(true);
  try { const pr = QA.play(); if (pr && pr.catch) pr.catch(() => { qa.on = false; qaPaintBar(); toast('Tidak bisa memutar audio (periksa internet).'); }); } catch (e) { qa.on = false; qaPaintBar(); }
}
function qaStep(d) {
  if (!qa.n) return;
  if (qa.mode === 'full') { const n = qa.n + d; if (n >= 1 && n <= 114) qaStart(n, 1, true); return; }
  const a = qa.a + d;
  if (a >= 1 && a <= qrCnt(qa.n)) qaStart(qa.n, a, false); else if (d < 0) qaStart(qa.n, 1, false);
}
function qaStop() { try { QA.pause(); } catch (e) { /* abaikan */ } QA.removeAttribute('src'); qa.n = 0; qa.on = false; qsClear(); try { qsChips(); } catch (e) { /* v81f */ } qaPaintBar(); qaMark(false); }
QA.addEventListener('play', () => { qa.on = true; qaPaintBar(); qaMark(false); });
QA.addEventListener('pause', () => { if (!QA.ended) { qa.on = false; qaPaintBar(); qaMark(false); } });
QA.addEventListener('error', () => { if (qa.n) { qa.on = false; qaPaintBar(); toast('Audio gagal dimuat (periksa internet).'); } });
QA.addEventListener('ended', () => {
  if (!qa.n) return;
  if (qsEnded()) return;   // v81f: timer tidur 'akhir surah'
  if (qa.mode === 'full') { if (qrP().rep) qaStart(qa.n, 1, true); else { qa.on = false; qaPaintBar(); } return; }
  if (qa.a < qrCnt(qa.n)) qaStart(qa.n, qa.a + 1, false);
  else if (qrP().rep) qaStart(qa.n, 1, false);
  else { qa.on = false; qaPaintBar(); qaMark(false); }
});
function qaMark(scroll) {   // sorot ayat yang diputar tanpa menggambar ulang halaman
  const pn = $('#ibxPanel'); if (!pn) return;
  pn.querySelectorAll('.qr-ay.now').forEach(e => e.classList.remove('now'));
  const show = qa.n && qa.n === qr.n && qa.mode === 'ayat';
  pn.querySelectorAll('[data-q=qrPlay]').forEach(b => b.setAttribute('aria-pressed', String(!!(show && qa.on && String(qa.a) === b.dataset.a))));
  if (!show || !ibxTab || ibxTab !== 'quran') return;
  const el = $('#qra-' + qa.a);
  if (el) { el.classList.add('now'); if (scroll) { try { el.scrollIntoView({ block: 'center' }); } catch (e) { /* abaikan */ } } }
  else if (scroll && qa.a > qr.shown) { qr.shown = Math.min(qrCnt(qr.n), qa.a + 10); qr.fa = qa.a; ibxRender(); }
}
function qrBarHtml() {
  if (!qa.n) return '';
  const nm = qrName(qa.n), pp = qa.on ? 'Jeda' : 'Putar';
  return '<div class="qr-bar" id="qrBar" role="region" aria-label="Pemutar murottal"><div class="qr-bt"><b>' + esc(nm) + '</b><span>' + (qa.mode === 'ayat' ? 'Ayat ' + qa.a + ' dari ' + qrCnt(qa.n) : 'Surah penuh') + ' · ' + esc(qaQari(qa.q)) + '</span></div>' +
    '<button data-q="qrPrev" aria-label="Sebelumnya">' + QI.prev + '</button><button data-q="qrPP" aria-pressed="' + qa.on + '" aria-label="' + pp + '">' + QI.play + QI.pause + '</button><button data-q="qrNext" aria-label="Berikutnya">' + QI.next + '</button><button data-q="qrStop" aria-label="Tutup pemutar">' + QI.stop + '</button></div>';
}
function qaPaintBar() {
  try { qgSync(); } catch (e) { /* v81f: abaikan */ }
  const old = $('#qrBar'); if (old) old.remove();
  const root = $('#ibBody'); if (!root || !qa.n) return;
  const a = root.querySelector('.ibx-tabs, .ibx-sr'); if (a) a.insertAdjacentHTML('afterend', qrBarHtml());
}
/* ---------- tampilan: daftar surah ---------- */
function qrIndex() {
  if (!QR.idx) QR.idx = QR_SURAH.map((r, i) => ({ n: i + 1, row: { t: ibxNorm(r[0]), k: ibxNorm(r[1]), a: '', l: '', r: '' } }));
  return QR.idx;
}
function qrFiltered() {
  const toks = ibxNorm(qr.find).split(' ').filter(Boolean);
  return qrIndex().filter(x => {
    if (qr.flt === 'off' && !QR.have.has(x.n)) return false;
    if (!toks.length) return true;
    if (toks.length === 1 && /^\d+$/.test(toks[0])) return String(x.n) === toks[0];
    return ibxScoreOf(x.row, toks) > 0 || toks.every(w => String(x.n) === w);
  }).map(x => x.n);
}
function qrRow(n, a) {
  const off = QR.have.has(n);
  return '<button class="qr-row" data-q="qrOpen" data-n="' + n + '"' + (a ? ' data-a="' + a + '"' : '') + '><span class="qr-n">' + n + '</span><span class="qr-nm"><b>' + esc(qrName(n)) + (a ? ' · ayat ' + a : '') + '</b><small>' + esc(QR_SURAH[n - 1][1]) + ' · ' + qrCnt(n) + ' ayat</small></span>' + (off && !a ? '<span class="qr-off" title="Tersimpan untuk offline">' + QI.dl + '</span>' : '') + '</button>';
}
function qrRowsHtml() {
  if (qr.flt === 'bm') {
    const bm = qrP().bm.slice().sort((x, y) => { const a = x.split(':').map(Number), b = y.split(':').map(Number); return a[0] - b[0] || a[1] - b[1]; });
    return bm.length ? bm.map(k => { const p = k.split(':').map(Number); return qrRow(p[0], p[1]); }).join('') : '<p class="ibx-empty">Belum ada penanda. Buka sebuah surah lalu ketuk ikon penanda pada ayat.</p>';
  }
  const l = qrFiltered();
  return l.length ? l.map(n => qrRow(n)).join('') : '<p class="ibx-empty">' + (qr.flt === 'off' && !qr.find ? 'Belum ada surah yang tersimpan offline.' : 'Tidak ada surah yang cocok.') + '</p>';
}
function qrDlHtml() {
  const have = QR.have.size, d = qr.dl;
  return '<section class="ibx-card qr-off-card"><h3>Simpan untuk offline</h3><p class="ibx-sub" id="qrDlT">' + (d ? 'Mengunduh ' + d.done + ' dari ' + d.total + ' surah…' : have + ' dari 114 surah tersimpan di perangkat ini.') + '</p>' +
    '<progress id="qrDlP" max="' + (d ? d.total : 114) + '" value="' + (d ? d.done : have) + '" aria-label="Kemajuan unduhan"></progress>' +
    '<div class="ibx-da">' + (d ? '<button class="ibx-mini" data-q="qrDlStop"><span>Berhenti</span></button>' : (have < 114 ? '<button class="ibx-mini" data-q="qrDlAll"><span>Simpan semua surah</span></button>' : '') + (have ? '<button class="ibx-mini" data-q="qrDlClear"><span>' + (qr.clr ? 'Yakin hapus semua?' : 'Hapus unduhan') + '</span></button>' : '')) + '</div>' +
    '<p class="ibx-fine">Teks diambil dari sumber publik (terjemahan Kemenag) sekali, lalu bisa dibaca tanpa internet. Audio murottal tetap butuh internet.</p></section>';
}
function qrListHtml() {
  const p = qrP(), l = p.last;
  const cont = l ? '<button class="qr-cont" data-q="qrOpen" data-n="' + l.n + '" data-a="' + l.a + '"><span><small>Lanjutkan membaca</small><b>' + esc(qrName(l.n)) + ' · ayat ' + l.a + '</b></span><span class="qr-go" aria-hidden="true">›</span></button>' : '';
  const chips = [['all', 'Semua'], ['bm', 'Penanda (' + p.bm.length + ')'], ['off', 'Tersimpan (' + QR.have.size + ')']];
  const done = (ibdb.days[today()] || { c: [] }).c.includes('tilawah');
  return cont +
    '<div class="ibx-sr qr-find">' + IBX_SR_ICO + '<input id="qrFind" data-fk="qrfind" type="search" inputmode="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Cari surah: nama, arti, atau nomor" aria-label="Cari surah" value="' + esc(qr.find) + '"></div>' +
    '<div class="ibx-chips" role="group" aria-label="Filter daftar">' + chips.map(c => '<button class="ibx-chip" data-q="qrFlt" data-v="' + c[0] + '" aria-pressed="' + (qr.flt === c[0]) + '">' + esc(c[1]) + '</button>').join('') + '</div>' +
    '<div class="ibx-da ibx-mk"><button class="ibx-mini" data-q="ibxMark" data-id="tilawah" aria-pressed="' + done + '">' + IBX_CHK + '<span>Tilawah hari ini selesai</span></button></div>' +
    '<div class="qr-list ibx-card" id="qrList">' + qrRowsHtml() + '</div>' + qrDlHtml();
}
/* ---------- tampilan: pembaca ---------- */
function qrSettingsHtml() {
  const p = ibdb.pref, q = qrP(), sw = (k, t) => '<div class="ibx-set"><div><b>' + t + '</b></div><button class="ibx-sw" role="switch" aria-checked="' + q[k] + '" aria-label="' + t + '" data-q="qrOpt" data-k="' + k + '"></button></div>';
  const chip = (act, items, cur) => '<div class="ibx-chips" role="group">' + items.map(i => '<button class="ibx-chip" data-q="' + act + '" data-v="' + i[0] + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + esc(i[1]) + '</button>').join('') + '</div>';
  return '<section class="ibx-card qr-set"><button class="qr-sh" data-q="qrSet" aria-expanded="' + qr.setOpen + '"><b>Tampilan & audio</b><span aria-hidden="true">' + (qr.setOpen ? '−' : '+') + '</span></button>' + (qr.setOpen ?
    ibxLookHtml() + '<div class="ibx-set"><div><b>Ukuran huruf Arab</b></div><div class="ibx-step"><button data-q="ibxAr" data-v="-1" aria-label="Perkecil huruf Arab"' + (p.ar <= 0 ? ' disabled' : '') + '>−</button><b lang="ar" class="ibx-arS" style="font-size:' + IBX_AR[p.ar] * 0.7 + 'px">أ</b><button data-q="ibxAr" data-v="1" aria-label="Perbesar huruf Arab"' + (p.ar >= IBX_AR.length - 1 ? ' disabled' : '') + '>+</button></div></div>' +
    sw('lat', 'Tulisan Latin') + sw('tr', 'Terjemahan Indonesia') +
    '<p class="ibx-sub">Qari</p>' + chip('qrQari', QR_QARI, q.q) +
    '<p class="ibx-sub">Cara memutar</p>' + chip('qrMode', [['ayat', 'Per ayat (disorot)'], ['full', 'Surah penuh']], q.mode) +
    '<p class="ibx-sub">Kecepatan</p>' + chip('qrSpd', QR_SPD.map(v => [v, v + '×']), q.spd) + sw('rep', 'Ulangi terus') +
    '<p class="ibx-sub">Timer tidur</p>' + chip('qrSleep', QS_OPT, qsCur()) + '<p class="ibx-fine" id="qsNote">' + qsNote() + '</p>' +
    '<p class="ibx-fine">Per ayat: ayat yang diputar disorot dan layar mengikuti. Surah penuh: satu berkas audio, lebih stabil saat layar terkunci. Qari lain butuh sumber utama (equran.id).</p>' : '') + '</section>';
}
function qrAyatHtml(s, x) {
  const p = qrP(), k = s.n + ':' + x.a, bm = p.bm.includes(k), last = p.last && p.last.n === s.n && p.last.a === x.a, now = qa.n === s.n && qa.mode === 'ayat' && qa.a === x.a, tfOpen = qr.tf.has(x.a);
  let tf = '';
  if (tfOpen) { const t = QR.tfm[s.n]; tf = '<div class="qr-tf"><b>Tafsir ringkas (Kemenag)</b><p>' + (t ? esc(t[x.a] || 'Tafsir ayat ini belum tersedia.') : 'Memuat…') + '</p></div>'; }
  return '<article class="qr-ay' + (now ? ' now' : '') + (last ? ' last' : '') + '" id="qra-' + x.a + '" data-a="' + x.a + '"><div class="qr-hd"><button class="qr-no" data-q="qrLast" data-a="' + x.a + '" aria-label="Tandai terakhir dibaca: ayat ' + x.a + '" aria-pressed="' + !!last + '">' + x.a + '</button><span class="qr-sp"></span>' +
    '<button class="qr-ib" data-q="qrPlay" data-a="' + x.a + '" aria-pressed="' + (now && qa.on) + '" aria-label="Putar ayat ' + x.a + '">' + QI.play + QI.pause + '</button>' +
    '<button class="qr-ib" data-q="qrBm" data-a="' + x.a + '" aria-pressed="' + bm + '" aria-label="Penanda ayat ' + x.a + '">' + QI.bm(bm) + '</button>' +
    '<button class="qr-ib" data-q="qrTf" data-a="' + x.a + '" aria-pressed="' + tfOpen + '" aria-label="Tafsir ayat ' + x.a + '">' + QI.tf + '</button>' +
    '<button class="qr-ib" data-q="qrCp" data-a="' + x.a + '" aria-label="Salin ayat ' + x.a + '">' + QI.cp + '</button></div>' +
    '<p class="ibx-ar" lang="ar" dir="rtl">' + esc(x.ar) + '</p>' + (p.lat && x.lat ? '<p class="ibx-lat">' + esc(x.lat) + '</p>' : '') + (p.tr && x.id ? '<p class="ibx-tr">' + esc(x.id) + '</p>' : '') + tf + '</article>';
}
function qrReaderHtml() {
  const n = qr.n, s = QR.mem[n], p = qrP();
  if (!s) {
    if (QR.err[n]) return '<section class="ibx-card"><h3>Surah belum bisa dimuat</h3><p class="ibx-sub">' + esc(qrName(n)) + ' belum tersimpan di perangkat dan sumber data tidak terjangkau (' + esc(QR.err[n]) + '). Sambungkan internet lalu coba lagi.</p><div class="ibx-da"><button class="ibx-mini" data-q="qrRetry"><span>Coba lagi</span></button><button class="ibx-mini" data-q="qrBack"><span>Kembali</span></button></div></section>';
    return '<section class="ibx-card" role="status"><h3>Memuat ' + esc(qrName(n)) + '…</h3><p class="ibx-sub">Pertama kali dibuka butuh internet; sesudahnya tersimpan untuk offline.</p><button class="ibx-lnk" data-q="qrBack">Kembali ke daftar</button></section>';
  }
  const cnt = s.ay.length, shown = Math.min(Math.max(qr.shown, QR_PAGE), cnt), done = (ibdb.days[today()] || { c: [] }).c.includes('tilawah');
  const head = '<section class="ibx-card qr-head"><button class="ibx-lnk" data-q="qrBack">‹ Daftar surah</button><h3 class="qr-at" lang="ar" dir="rtl">' + esc(s.nama) + '</h3><p class="qr-tt"><b>' + n + '. ' + esc(s.latin) + '</b> · ' + esc(s.arti) + '</p><p class="ibx-fine">' + (s.tempat ? esc(s.tempat) + ' · ' : '') + cnt + ' ayat' + (s.src === 'ac' ? ' · sumber cadangan' : '') + '</p>' +
    '<div class="ibx-da"><button class="ibx-mini" data-q="qrPlayAll"><span>Putar surah</span></button><button class="ibx-mini" data-q="ibxMark" data-id="tilawah" aria-pressed="' + done + '">' + IBX_CHK + '<span>Tilawah hari ini</span></button></div>' +
    '<div class="qr-jump"><input id="qrJ" data-fk="qrj" type="number" inputmode="numeric" min="1" max="' + cnt + '" placeholder="Ke ayat 1–' + cnt + '" aria-label="Lompat ke ayat"><button class="ibx-mini" data-q="qrJump"><span>Pergi</span></button></div></section>';
  const bsm = n !== 1 && n !== 9 ? '<p class="ibx-ar qr-bsm" lang="ar" dir="rtl">' + QR_BSM_TXT + '</p>' : '';
  const list = s.ay.slice(0, shown).map(x => qrAyatHtml(s, x)).join('');
  const more = shown < cnt ? '<button class="ibx-mini qr-more" data-q="qrMore"><span>Tampilkan ' + Math.min(QR_PAGE, cnt - shown) + ' ayat lagi (' + shown + '/' + cnt + ')</span></button>' : '';
  const nav = '<div class="qr-nav"><button class="ibx-mini" data-q="qrGo" data-v="-1"' + (n <= 1 ? ' disabled' : '') + '><span>‹ Sebelumnya</span></button><button class="ibx-mini" data-q="qrGo" data-v="1"' + (n >= 114 ? ' disabled' : '') + '><span>Berikutnya ›</span></button></div>';
  return head + qrSettingsHtml() + bsm + '<div class="qr-ayl" style="--ibar:' + IBX_AR[ibdb.pref.ar] + 'px">' + list + '</div>' + more + nav;
}
IBX_PANEL.quran = () => { if (qr.n) { if (!QR.mem[qr.n]) qrLoad(qr.n); return qrReaderHtml(); } return qrListHtml(); };
IBX_READY.quran = true;
function qrLoad(n) {
  if (QR.load[n] || QR.mem[n] || QR.err[n]) return;   // galat tidak diulang otomatis (hindari membanjiri server); tombol Coba lagi menghapus galat
  QR.load[n] = true;
  qrGet(n).then(() => { QR.load[n] = false; qrRefresh(n); }, e => { QR.load[n] = false; QR.err[n] = String((e && e.message) || e); qrRefresh(n); });
}
/* ---------- aksi ---------- */
const qrSave = () => ibxSave();
QACT.qrOpen = b => {
  const n = parseInt(b.dataset.n, 10), a = parseInt(b.dataset.a, 10) || 0;
  if (!(n >= 1 && n <= 114)) return;
  qr.n = n; qr.shown = Math.min(qrCnt(n), Math.max(QR_PAGE, a ? a + 10 : 0)); qr.fa = a; qr.tf = new Set(); qr.setOpen = false;
  ibxSrOpen = false; ibxQ = ''; ibxTab = 'quran'; ibxCompassStop(); ibxRender();
};
QACT.qrBack = () => { qr.n = 0; qr.fa = 0; ibxRender(); };
QACT.qrRetry = () => { delete QR.err[qr.n]; QR.load[qr.n] = false; ibxRender(); };
QACT.qrGo = b => { const n = qr.n + (parseInt(b.dataset.v, 10) || 0); if (n < 1 || n > 114) return; qr.n = n; qr.shown = QR_PAGE; qr.fa = 0; qr.tf = new Set(); ibxRender(); try { window.scrollTo(0, 0); } catch (e) { /* abaikan */ } };
QACT.qrMore = () => { qr.shown = Math.min(qrCnt(qr.n), qr.shown + QR_PAGE); ibxRender(); };
QACT.qrJump = () => {
  const i = $('#qrJ'), a = i ? parseInt(i.value, 10) : NaN;
  if (!(a >= 1 && a <= qrCnt(qr.n))) { toast('Isi nomor ayat 1–' + qrCnt(qr.n) + '.'); return; }
  if (a > qr.shown) qr.shown = Math.min(qrCnt(qr.n), a + 10);
  qr.fa = a; ibxRender();
};
QACT.qrSet = () => { qr.setOpen = !qr.setOpen; ibxRender(); };
QACT.qrOpt = b => { const k = b.dataset.k; if (!['lat', 'tr', 'rep'].includes(k)) return; qrP()[k] = !qrP()[k]; qrSave(); ibxRender(); };
QACT.qrQari = b => { if (!QR_QARI.some(x => x[0] === b.dataset.v)) return; qrP().q = b.dataset.v; qrSave(); ibxRender(); if (qa.n && qa.on) qaStart(qa.n, qa.a, qa.mode === 'full'); };
QACT.qrMode = b => { qrP().mode = b.dataset.v === 'full' ? 'full' : 'ayat'; qrSave(); ibxRender(); };
QACT.qrSpd = b => { const v = Number(b.dataset.v); if (!QR_SPD.includes(v)) return; qrP().spd = v; QA.playbackRate = v; qrSave(); ibxRender(); };
QACT.qrFlt = b => { qr.flt = ['bm', 'off'].includes(b.dataset.v) ? b.dataset.v : 'all'; qr.clr = false; ibxRender(); };
QACT.qrLast = b => { const a = parseInt(b.dataset.a, 10); if (!(a >= 1 && a <= qrCnt(qr.n))) return; qrP().last = { n: qr.n, a }; qrSave(); ibxRender(); toast('Terakhir dibaca: ' + qrName(qr.n) + ' ayat ' + a + '.'); };
QACT.qrBm = b => {
  const a = parseInt(b.dataset.a, 10), k = qr.n + ':' + a, bm = qrP().bm, i = bm.indexOf(k);
  if (!(a >= 1 && a <= qrCnt(qr.n))) return;
  if (i >= 0) bm.splice(i, 1); else if (bm.length < 200) bm.push(k); else { toast('Penanda penuh (maks. 200).'); return; }
  qrSave();
  const on = bm.includes(k); b.setAttribute('aria-pressed', String(on)); b.innerHTML = QI.bm(on);
};
QACT.qrTf = async b => {
  const a = parseInt(b.dataset.a, 10), n = qr.n;
  if (qr.tf.has(a)) { qr.tf.delete(a); ibxRender(); return; }
  qr.tf.add(a); ibxRender();
  if (!QR.tfm[n]) {
    try { await qrTafsir(n); } catch (e) { qr.tf.delete(a); toast('Tafsir butuh internet saat pertama dibuka.'); }
    if (qr.n === n) ibxRender();
  }
};
QACT.qrCp = b => {
  const a = parseInt(b.dataset.a, 10), s = QR.mem[qr.n], x = s && s.ay[a - 1]; if (!x) return;
  const txt = x.ar + '\n\n' + (x.id ? x.id + '\n\n' : '') + '(QS ' + s.latin + ' [' + s.n + ']: ' + a + ')';
  const ok = () => toast('Ayat disalin.'), no = () => toast('Tidak bisa menyalin di perangkat ini.');
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, no); else no(); } catch (e) { no(); }
};
QACT.qrPlay = b => {
  const a = parseInt(b.dataset.a, 10);
  if (qa.n === qr.n && qa.mode === 'ayat' && qa.a === a && qa.on) { QA.pause(); return; }
  if (qa.n === qr.n && qa.mode === 'ayat' && qa.a === a && !qa.on && QA.src) { QA.play().catch(() => {}); return; }
  const m = qrP().mode; qa.mode = m;
  qaStart(qr.n, a, false);
};
QACT.qrPlayAll = () => { qaStart(qr.n, 1, qrP().mode === 'full'); };
QACT.qrPP = () => { if (!qa.n) return; if (qa.on) QA.pause(); else { const pr = QA.play(); if (pr && pr.catch) pr.catch(() => {}); } };
QACT.qrPrev = () => qaStep(-1);
QACT.qrNext = () => qaStep(1);
QACT.qrStop = () => qaStop();
function qrPaintDl() {
  const d = qr.dl, t = $('#qrDlT'), p = $('#qrDlP');
  if (t) t.textContent = d ? 'Mengunduh ' + d.done + ' dari ' + d.total + ' surah…' : QR.have.size + ' dari 114 surah tersimpan di perangkat ini.';
  if (p) { p.max = d ? d.total : 114; p.value = d ? d.done : QR.have.size; }
}
async function qrDlAll() {
  if (qr.dl) return;
  const todo = []; for (let n = 1; n <= 114; n++) if (!QR.have.has(n)) todo.push(n);
  if (!todo.length) { toast('Semua surah sudah tersimpan.'); return; }
  const d = qr.dl = { done: 0, total: todo.length, fail: 0, stop: false };
  ibxRender();
  const worker = async () => { while (!d.stop) { const n = todo.shift(); if (!n) break; try { await qrGet(n); } catch (e) { d.fail++; } d.done++; qrPaintDl(); } };
  await Promise.all([worker(), worker(), worker()]);
  qr.dl = null;
  if (curView === 'ibadah' && ibxTab === 'quran' && !qr.n && !ibxSrOpen) ibxRender();
  toast(d.stop ? 'Unduhan dihentikan.' : d.fail ? 'Selesai; ' + d.fail + ' surah gagal (periksa internet lalu ulangi).' : 'Semua surah tersimpan untuk offline.');
}
QACT.qrDlAll = () => { qrDlAll(); };
QACT.qrDlStop = () => { if (qr.dl) qr.dl.stop = true; };
QACT.qrDlClear = async () => {
  if (!qr.clr) { qr.clr = true; ibxRender(); setTimeout(() => { if (qr.clr) { qr.clr = false; if (curView === 'ibadah' && ibxTab === 'quran' && !qr.n) ibxRender(); } }, 4000); return; }
  qr.clr = false;
  await qrIdb('surah', 'readwrite', s => s.clear()); await qrIdb('tafsir', 'readwrite', s => s.clear());
  QR.mem = {}; QR.have = new Set(); QR.tfm = {}; QR.nz = {}; QR.load = {}; QR.err = {};
  if (qr.n) qr.n = 0;
  ibxRender(); toast('Unduhan dihapus. Surah akan diunduh lagi saat dibuka.');
};
document.addEventListener('input', ev => { const t = ev.target; if (t && t.id === 'qrFind') { qr.find = t.value; const l = $('#qrList'); if (l) l.innerHTML = qrRowsHtml(); } });
document.addEventListener('keydown', ev => { const t = ev.target; if (t && t.id === 'qrJ' && ev.key === 'Enter') { ev.preventDefault(); QACT.qrJump(); } });
/* ---------- Cari: nomor surah:ayat, nama surah, dan teks ayat yang sudah tersimpan ---------- */
function qrSurahCard(n, a) {
  return '<div class="ibx-doa qr-hit">' + qrRow(n, a) + '</div>';
}
function qrAyatHit(s, x) {
  return '<details class="ibx-doa" data-id="ay-' + s.n + '-' + x.a + '"><summary><span class="t">' + esc(s.latin) + ' ' + s.n + ':' + x.a + '</span><span class="c">Ayat · ' + esc((x.id || '').slice(0, 70)) + '</span></summary><div class="ibx-db"><p class="ibx-ar" lang="ar" dir="rtl">' + esc(x.ar) + '</p>' + (x.id ? '<p class="ibx-tr">' + esc(x.id) + '</p>' : '') +
    '<div class="ibx-da"><button class="ibx-mini" data-q="qrOpen" data-n="' + s.n + '" data-a="' + x.a + '"><span>Buka di pembaca</span></button></div></div></details>';
}
IBX_SEARCH.push(function (n, toks) {
  const out = [];
  qrWarm();
  if (toks.length === 2 && toks.every(t => /^\d{1,3}$/.test(t))) {
    const sn = +toks[0], an = +toks[1];
    if (sn >= 1 && sn <= 114 && an >= 1 && an <= qrCnt(sn)) out.push({ s: 60, kind: 'ayat-ref', h: qrSurahCard(sn, an) });
  }
  if (toks.length === 1 && /^\d{1,3}$/.test(toks[0])) { const sn = +toks[0]; if (sn >= 1 && sn <= 114) out.push({ s: 40, kind: 'surah', h: qrSurahCard(sn) }); }
  else if (!toks.every(t => /^\d+$/.test(t))) {
    qrIndex().forEach(x => { const s = ibxScoreOf(x.row, toks); if (s) out.push({ s: s + 2, kind: 'surah', h: qrSurahCard(x.n) }); });
    if (n.length >= 3) {
      let hits = 0;
      for (const k of Object.keys(QR.mem)) {
        const s = QR.mem[k];
        for (const x of s.ay) {
          const key = s.n + ':' + x.a, z = QR.nz[key] || (QR.nz[key] = ibxNorm(x.id + ' ' + x.lat + ' ' + x.ar));
          if (toks.every(w => z.includes(w))) { out.push({ s: 5 + toks.length, kind: 'ayat', h: qrAyatHit(s, x) }); if (++hits >= 12) return out; }
        }
      }
    }
  }
  return out;
});
/* ---------- kaitan ke kerangka halaman ---------- */
{
  const baseRenderC = ibxRender;
  ibxRender = function () {
    baseRenderC();
    qaPaintBar();
    if (ibxTab === 'quran' && qr.n && QR.mem[qr.n]) {
      if (qr.fa) { const el = $('#qra-' + qr.fa); if (el) { try { el.scrollIntoView({ block: 'start' }); } catch (e) { /* abaikan */ } } qr.fa = 0; }
      qaMark(false);
    }
  };
  RENDER.ibadah = ibxRender;
}
IBX_FRESH.push(() => { qr.n = 0; qr.fa = 0; qr.shown = QR_PAGE; qr.tf = new Set(); qr.find = ''; qr.flt = 'all'; qr.setOpen = false; qr.clr = false; qrWarm(); });
window.DL = Object.freeze(Object.assign({}, window.DL, { b81c: Object.freeze({ surah: QR_SURAH, qari: QR_QARI, store: QR, view: qr, audio: QA, aud: qa, get: qrGet, net: qrNet, tafsir: qrTafsir, normEq: qrNormEq, normAc: qrNormAc, stripBsm: qrStripBsm, clean3: ibxCleanPref3, def: qrDef, dlAll: qrDlAll, warm: qrWarm, srcs: QR_SRC }) }));
