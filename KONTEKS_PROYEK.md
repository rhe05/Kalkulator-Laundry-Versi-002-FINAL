# KONTEKS PROYEK: Kalkulator Laundry Versi 002
**File ini gabungan dari konteks proyek + rule desain dashboard. Upload file ini saja di awal sesi baru.**

---

## IDENTITAS PROYEK

- **Nama:** Kalkulator Laundry Versi 002 - FINAL
- **Platform:** Google Apps Script Web App
- **GitHub:** https://github.com/BangRhe99/Kalkulator-Laundry-Versi-002-FINAL
- **URL Produksi:** https://script.google.com/macros/s/AKfycbxQPKNOM8aTSZtWaRwp6GENbE2dT5nERK1Yd1cakULzKN2Pxrqpcui_88R_6jSCyR73xg/exec
  (dikonfirmasi ulang 2026-07-14 - URL lama `AKfycbxW6oL3...` sudah tidak akurat)
- **Folder Lokal:** `C:\Users\user\Documents\Kalkulator-Laundry-Versi-002-FINAL`

---

## STRUKTUR FILE UTAMA

| File | Fungsi |
|------|--------|
| `Code.gs` | Entry point Web App, `doGet()`, `include()` |
| `Index.html` | HTML utama + seluruh JavaScript browser (~4900+ baris) |
| `Style_Tokens.html` | CSS variables / design tokens |
| `Style_Base.html` | Layout dasar, body, wrap, header, brand |
| `Style_Components.html` | Card, tombol, komponen UI (~900+ baris) |
| `Style_Module_*.html` | CSS khusus per modul (masing-masing dibungkus `<style>...</style>`) |
| `Modul_Dashboard.gs` | Fungsi backend untuk data Dashboard (~550+ baris) |
| `Modul_Cabang.gs` | CRUD data outlet/cabang |
| `Modul_BiayaGas.gs` | Biaya Gas LPG |
| `Modul_BiayaListrik.gs` | Biaya Listrik |
| `Modul_BiayaAir.gs` | Biaya Air |
| `Modul_BiayaNotaKasir.gs` | Biaya Nota/Kasir |
| `Modul_BiayaTetapOutlet.gs` | Fixed Cost bulanan |
| `Modul_HargaLayanan.gs` | Harga Jual & Margin |
| `Modul_StrukturBiayaHPP.gs` | HPP per layanan |

---

## WORKFLOW STANDAR

```
Edit file lokal
→ git add . && git commit -m "pesan" && git push
→ clasp push
→ Deploy New Version di Apps Script editor
→ Test di URL /exec
```

**PENTING:** `clasp push` saja TIDAK cukup. Harus Deploy New Version.

---

## GAYA KOMUNIKASI USER

1. **Step by step** — satu langkah, satu konfirmasi
2. **Verifikasi dulu** sebelum eksekusi — cek posisi baris sebelum patch
3. **Tidak tebak-tebakan** — audit dulu, jangan asal patch
4. **Backup selalu** sebelum perubahan besar
5. **Verifikasi screen count = 16** setelah setiap patch Index.html
6. **Claude boleh dan wajib beda pendapat** kalau prinsip user bertentangan standar desain
7. **Tidak perlu jelaskan ulang** struktur atau alur kerja
8. **Hemat token** — verifikasi cukup 1 baris atau radius kecil (±3 baris), JANGAN minta user paste ulang seluruh blok
9. **Patch harus bersih sekali jalan** — hindari tambal-sulam baris per baris yang melelahkan
10. **Semua eksekusi/edit/debug file dilakukan user sendiri via PowerShell** — Claude hanya analisis dan menyiapkan perintah siap-pakai (KECUALI user eksplisit bilang "Claude edit langsung" di sesi itu — jangan asumsikan izin ini lanjut ke sesi berikutnya)
11. **Wajib sertakan blok perintah update di akhir SETIAP respons yang mengedit file** — siap-tempel: `git add <file spesifik>` → `git commit -m "..."` → `git push` → `clasp push` → `clasp open`, lalu instruksikan Deploy New Version manual di editor Apps Script. Tidak perlu diminta ulang tiap kali.

---

## METODE PATCH AMAN

### Berbasis Nomor Baris (untuk edit 1 baris):
```powershell
$lines = Get-Content "Index.html" -Encoding UTF8
$lines[index] = "isi baru"
Set-Content -Path "Index.html" -Value $lines -Encoding UTF8
```

### Splice untuk Ganti/Sisip Banyak Baris (PALING ANDAL untuk blok besar):
```powershell
$lines = Get-Content "Index.html" -Encoding UTF8
$before = $lines[0..N]
$after  = $lines[M..$($lines.Length - 1)]
$new = @('baris1', 'baris2', 'baris3')
Set-Content -Path "Index.html" -Value ($before + $new + $after) -Encoding UTF8
```
**HATI-HATI:** pastikan indeks `$before` dan `$after` tidak memotong baris penting
(mis. `.withSuccessHandler(function (res) {`). Ini penyebab bug berulang di sesi lalu.

### Patch Blok JS Kompleks (banyak quote) — via file temp:
Kalau string JS penuh kutip ganda/tunggal dan `<`, JANGAN tulis inline di PowerShell.
Tulis ke file `.txt` pakai here-string `@'...'@`, lalu inject:
```powershell
@'
...isi JS bersih...
'@ | Set-Content -Path "patch.txt" -Encoding UTF8

$lines = Get-Content "Index.html" -Encoding UTF8
$patch = Get-Content "patch.txt" -Encoding UTF8
$before = $lines[0..N]
$after  = $lines[M..$($lines.Length - 1)]
Set-Content -Path "Index.html" -Value ($before + $patch + $after) -Encoding UTF8
Remove-Item "patch.txt"
```

### VERIFIKASI SYNTAX PALING AKURAT — via Node.js:
Node sudah terpasang (v24). Ekstrak JS dari Index.html (buang komentar HTML dulu
supaya `<script>` di komentar tidak ikut), lalu `node --check`:
```powershell
@'
const fs = require('fs');
let html = fs.readFileSync('Index.html', 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '');
const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
let m, parts = [];
while ((m = re.exec(html)) !== null) { parts.push(m[1]); }
fs.writeFileSync('extracted2.js', parts.join('\n'), 'utf8');
'@ | Set-Content -Path "extract.js" -Encoding UTF8
node extract.js
node --check extracted2.js
```
Kalau bersih = tidak ada output. Kalau error = kasih nomor baris di
`extracted2.js` yang tinggal dicocokkan. **Selalu bersihkan file temp setelahnya.**

### Audit Syntax Error — Radius Minimum:
Error di baris N → audit `$lines[(N-4)..(N+16)]`. Cukup satu kali, tidak melebar.
**Catatan:** nomor baris dari browser Apps Script (`userCodeAppPanel`) kadang
menunjuk lokasi eksekusi, bukan lokasi asli error. `node --check` lebih akurat.

### Verifikasi Wajib Setelah Patch Index.html:
```powershell
(Select-String -Path "Index.html" -Pattern 'id="screen').Count
# Harus = 16
```

### Anti-Pattern yang Harus Dihindari:
- JANGAN `Add-Content` untuk CSS/JS — nempel di luar tag `</style>` / `</script>`,
  akibatnya CSS tercetak sebagai teks di halaman. CSS baru HARUS disisipkan
  SEBELUM `</style>` (pakai splice, bukan Add-Content).
- JANGAN `""` (double-double quote) di dalam JavaScript string
- JANGAN string replace multi-baris tanpa verifikasi kecocokan dulu
- JANGAN splice yang memotong baris pembuka handler (`.withSuccessHandler(...)`)
- JANGAN pakai `$lines` variabel lama setelah file diubah — selalu `Get-Content` ulang
- **JANGAN salah hitung index `$before`/`$after` saat splice** — ini penyebab bug
  paling sering di sesi 2026-07-04 (baris duplikat, baris hilang, kurung kurawal
  timpang). Selalu `Get-Content | Select-Object -Skip N -First M` untuk verifikasi
  hasil SEBELUM lanjut ke langkah berikutnya, jangan asumsi splice berhasil.
- **Semua fungsi yang dipanggil dari `onclick="..."` di HTML WAJIB pakai
  `window.namaFungsi = function () {...}`**, BUKAN `function namaFungsi() {...}`
  biasa — karena seluruh script utama Index.html dibungkus IIFE
  `(function () {...})()` (baris ~821-4889). Fungsi biasa di dalam IIFE tidak
  terjangkau dari onclick (scope global), errornya baru muncul saat tombol
  diklik (`ReferenceError: ... is not defined`), TIDAK muncul saat load halaman.
- **Tombol kecil di dalam card yang punya `onclick` navigasi** (misal seluruh
  `.menu-card` bisa diklik pindah layar) WAJIB `event.stopPropagation()` di
  handler tombolnya, kalau tidak klik tombol kecil ikut memicu navigasi pindah
  layar yang tidak diinginkan.
- **File `.gs` tidak bisa langsung `node --check`** (ekstensi tidak dikenali) —
  copy dulu ke `.js` sementara (`Copy-Item nama.gs nama_check.js`), baru cek,
  lalu hapus.

---

## RULE SESI DESAIN DASHBOARD

### Identitas Claude dalam sesi desain:
Bertindaklah sebagai **Elite FinTech UI/UX Director**, **Senior UI Engineer**, **Web Performance Architect**.

### Gaya Visual: Spatial Minimalist Hyper-Premium FinTech
- White-space presisi, card premium dengan shadow ambient lembut
- Border lembut, radius besar, gradient elegan (tidak berlebihan)
- Glassmorphism ringan jika sesuai
- Tampilan eksklusif, aman, profesional, mudah dibaca
- Tidak ramai, tidak penuh sesak — setiap elemen harus punya fungsi dan alasan visual

**[2026-07-12] Standar ini BERLAKU DI SELURUH APLIKASI, bukan cuma Dashboard**
(nama file/judul lama "PROMPT DESAIN DASHBOARD" menyesatkan - user konfirmasi
standar "hyper premium, standard profesional, standard internasional, no AI
slop" ini jadi acuan semua layar, termasuk Master Biaya, Profil Outlet, dst).

**Komponen kanonik "ringkasan fitur" (jangan bikin bahasa visual baru):**
`.gas-card` (+ `.gas-card-top`, `.title-group`, dot warna kategori, `.actions`
+ `.icon-btn`, `.gas-card-result`, `.gas-result-grid`, `.gas-result-cell`,
`.gas-result-cell.highlight`) di `Style_Module_MasterBiaya.html` adalah
CONTOH ACUAN yang sudah disetujui user secara eksplisit (screenshot kartu Gas
3 Kg, 2026-07-12): card putih (`--panel`) radius besar, titik warna kecil +
judul di header, 1 tombol ikon aksi di kanan, garis pemisah tipis, lalu sel
hasil kunci dengan warna highlight lembut (tint dari warna kategori, BUKAN
warna baru). Kalau diminta desain ulang "ringkasan"/"summary card" di layar
manapun, REUSE class ini dulu (persis seperti Chemical & Packing yang sudah
lebih dulu reuse `.gas-card` apa adanya) sebelum mempertimbangkan pola baru.

### Prinsip UX Wajib:
1. **F-Pattern / Z-Pattern** — KPI utama di posisi yang mata langsung tangkap
2. **The 5-Second Rule** — pengguna paham kondisi utama dalam 5 detik
3. **Progressive Disclosure** — data penting di depan, detail di balik klik
4. **Semantik Warna Konsisten:** Hijau/sage = aman/positif, Merah = risiko/bahaya,
   Kuning/oranye/brass = perhatian/brand, Abu/netral = data pendukung
5. **Visualisasi Tepat** — chart hanya kalau ada data tren/komparasi, bukan dekorasi

### Jenis Dashboard:
**Strategic Dashboard** (bukan Operational/Analytical) — pengguna adalah pemilik
laundry yang ingin melihat kondisi kesehatan bisnis secara sekilas untuk
pengambilan keputusan strategis.

### Aturan Teknis yang Tidak Boleh Dilanggar:
1. **100% Native Vanilla HTML/CSS/JS** — tidak boleh framework/library tambahan
2. **Tidak boleh mengubah** struktur database, logic backend, rumus, fungsi save/load
3. **CSS efisien** — GPU-friendly, tidak bertumpuk, tidak saling override
4. **Mobile-first** — semua harus pas di HP tanpa scroll horizontal
5. **Animasi** — smooth, elegan, tidak berat, tidak berlebihan
6. **Font angka finansial** — gunakan `font-variant-numeric: tabular-nums`
7. **Tidak boleh AI slop** — tidak ada emoji berlebihan, tidak ada dekorasi kosong

### Alur Desain yang Benar:
**Fase 1 — Analisis dulu, JANGAN langsung kode:** tentukan jenis dashboard, rancang
layout & hierarki visual, tentukan data depan vs di balik klik, beri wireframe
text sederhana, minta konfirmasi user sebelum lanjut.
**Fase 2 — Implementasi:** patch kecil per komponen, verifikasi tiap langkah,
tidak boleh patch besar sekaligus.

---

## DESIGN SYSTEM

### CSS Variables Utama (JANGAN buat baru sembarangan):
```css
--brass      /* oranye brand */
--sage       /* hijau/teal — aman, washer */
--volt       /* kuning */
--red        /* bahaya/error */
--panel      /* background card */
--panel-2    /* background card secondary */
--border     /* warna border */
--text       /* teks utama */
--text-dim   /* teks redup */
--text-faint /* teks sangat redup */
--radius     /* border radius standar */
--radius-lg  /* border radius besar */
--app-edge-x /* padding horizontal halaman */
--font-display, --font-body, --font-mono
```

---

## KATEGORI LAYANAN & KOMPONEN BIAYA (VARIABLE COST)

Kategori outlet: **Self Service, Cuci Saja, Kering Saja, Cuci Kering**

Struktur biaya per layanan:
- **Cuci Saja:** nota/admin, air per load, listrik washer per load, listrik pompa
- **Kering Saja:** nota/admin, listrik dryer per load, gas per load
- **Cuci Kering:** nota/admin, air per load, listrik washer per load, listrik pompa,
  listrik dryer per load, gas per load

**Catatan rumus listrik (untuk cost analysis, BUKAN rata-rata):**
- Pompa/load = `cuci[0].rpPompaPerLoad` (otomatis dibagi jumlah unit mesin cuci
  dari profil outlet: `wattPompaAir / totalUnitCuci`)
- Washer/load = `cuci[0].rpListrikPerLoad` (per unit, ambil mesin pertama)
- Dryer/load = `pengering[0].rpListrikPerLoad` (per unit, ambil mesin pertama)
- Total Listrik/load = Pompa + Washer + Dryer

---

## STATUS FITUR DASHBOARD

### SELESAI (semua 6 card dashboard sudah didesain ulang & live-tested):

**Header:** Icon mesin cuci SVG + "Kalkulator Laundry" (spasi terpisah), gap 6px, word-spacing -3px

**Filter Outlet:** Pill filter kanan atas sejajar "Dashboard Bisnis", klik → overlay
pilih outlet (tersimpan di localStorage), teks "1 outlet aktif" kecil di bawah pill

**Card Profil Outlet:** Badge kategori + jam operasional (format leading-zero
`07.00 – 21.00`), 1 tombol `?` tunggal di baris jam (bukan 3 tombol per-KPI lagi)
untuk tooltip penjelasan okupansi. KPI Cuci/Kering **center-align**, sejajar 1
baris. Untuk kategori **Drop Off/Kiloan & Hybrid** yang punya mesin setrika,
otomatis jadi **3 KPI sejajar** (Cuci/Kering/Setrika, font dikecilkan biar
tetap muat 1 baris di HP kecil, kelas `.kpi-3col`). Mini-card Washer/Dryer/Setrika
`flex:1`, tampil **2 baris** (jenis mesin di atas, durasi/kapasitas di bawah,
class `.profil-mesin-durasi`) — bukan digabung 1 baris lagi. Dryer jenis
"konversi" tampil apa adanya (dulu salah di-map jadi "home"). Setrika tampilkan
label "Setrika Listrik"/"Setrika Uap"/"Belum dipilih". JS: `window.toggleOkupansiTooltip`.
*Bug yang diperbaiki (riwayat):*
1. `listCabang()` awalnya tidak menyertakan `mesinCuci`/`mesinPengering` →
   sudah diperbaiki lewat `getCabang(id)` (fix lama).
2. `listCabang()` juga sempat lupa menyertakan `mesinSetrika` (baru ketahuan
   pas fitur Setrika ditambah) → info "listrik/uap" selalu kosong sampai
   field ini ditambahkan di `Modul_Cabang.gs:listCabang()`.
3. **Ganti outlet di dashboard dulu TIDAK memicu refresh sama sekali** (cuma
   ganti teks pill) → ditambahkan `refreshDashboardFast()`: render instan
   card Profil Outlet dari `cabangListCache` (tanpa nunggu server), lalu
   `refreshDashboard()` tetap jalan di belakang layar untuk semua card.
4. **Race condition**: kalau ganti outlet 2x cepat berturut-turut, jawaban
   server yang telat (punya seq lama) bisa menimpa tampilan sesaat (blip).
   Fix: `dashboardRequestSeq` — tiap `refreshDashboard()` dapat nomor urut,
   jawaban yang bukan dari request TERBARU otomatis dibuang (lihat
   `Index.html` fungsi `refreshDashboard`).

**Card Master Biaya Produksi:** Pill "Lengkap"/"N/4 komponen" **dihapus total**.
Bar chart diperbesar (`height:6px`, `border-radius:3px` persegi, bukan pill
tipis). Label komponen fixed `width:74px` (kolom sejajar rapi seperti tabel),
kolom persentase & nominal juga fixed width, gap dirapatkan. Angka dibulatkan
(`money0()`). Komponen yang sudah diisi tapi nilainya Rp0 (misal Air pakai
sumur) tetap tampil dengan label **"Rp 0 (tanpa biaya)"**, tidak hilang dari
daftar — backend pakai flag `gasComplete`/`listrikComplete`/`airComplete`/
`notaComplete` (form pernah diisi), bukan `nilai > 0`.

**Card Struktur Biaya HPP · Variable Cost:** Redesign total — jadi **3
mini-card collapsible**: HPP Cuci Saja / HPP Kering Saja / HPP Cuci Kering.
Tiap mini-card: baris ringkasan (judul + total Rp + panah ⌄), klik → detail
per komponen (label, persen, nominal) muncul di bawah, panah berputar 180°.
"Lengkap"/"TERTINGGI"/"TERENDAH" dihapus semua. Ketiga layanan SELALU tampil
(tidak lagi disortir/disembunyikan berdasar nilai). CSS: `.hpp-mini-*` di
`Style_Module_HPP.html`. JS: `window.toggleHppDetail`.

**Card Harga Layanan:** Pill status "Aman"/"Perhatian"/"Ada yang rugi"
**dihapus total** (warna bar sudah cukup jadi sinyal). Tiap baris layanan bisa
diklik → detail **HPP, Harga Jual, Margin** (Rupiah) muncul di bawah, pola
sama seperti card HPP. CSS: `.hl-item`, `.hl-detail-*`. JS: `window.toggleHlDetail`.

**Card Biaya Tetap Outlet (Fixed Cost):** Pill "Terisi"/"Belum diisi"
**dihapus**. Angka dibulatkan, "per bulan" ditaruh sejajar nominal (font kecil,
bukan di baris terpisah). Klik nominal → detail **6 komponen** (Sewa Outlet,
Gaji Karyawan, Internet, Penyusutan Mesin, Biaya Perawatan, Operasional
Lainnya) muncul di bawah. JS: `window.toggleFcDetail`.

**Card Target Titik Impas (BEP):** Ditambah **grafik garis BEP native SVG**
(tanpa library) — garis Omset (sage) vs Total Biaya (brass) berpotongan di
titik BEP, zona rugi (merah muda tipis)/untung (sage tipis), label angka di
ujung sumbu X (load maksimum grafik) & Y (Rp maksimum grafik). Semua angka
dibulatkan tanpa desimal (termasuk Load/Hari yang sebelumnya 1 desimal). Teks
kecil "load" di bawah angka Load/Bulan-Minggu-Hari dihapus (sudah terwakili di
label judul). Fungsi: `buildBepChartSvg(d)`.
*Belum selesai — lihat Prioritas Berikutnya #1:* label sumbu Y grafik saat ini
pakai skala arbitrer (`bepLoadPerBulan × 1.8`), BUKAN target omset maksimum
riil bisnis. User minta diganti dengan kapasitas maksimum sungguhan, tapi ini
butuh fitur baru "Kontribusi Omset" dulu (lihat detail di Prioritas #1).

**Form Profil Outlet (screenForm) - reorganisasi:** Urutan panel sekarang:
01 Profil & jam operasional -> 02 Kategori layanan (card sendiri, dipisah dari
Okupansi) -> 03 Mesin cuci (+ slider okupansi cuci NEMPEL di bawah card ini,
bukan di panel terpisah) -> 04 Mesin pengering (+ slider okupansi kering) ->
05 Mesin setrika (kondisional, tampil HANYA utk kategori Drop Off/Kiloan &
Hybrid; tiap baris ada pilihan Setrika Listrik/Uap, kapasitas kg/jam, TANPA
field durasi menit karena basisnya per jam bukan per load). Fix desktop: dulu
layout 2-kolom (form+preview) aktif dari lebar 760px yang bikin kolom form
kepotong/berdesakan (`.wrap` global dibatasi 480px, jadi 2-kolom sebenarnya
selalu sempit) -> sekarang `.wrap` dilebarkan khusus utk screenForm pakai
`body:has(#screenForm.active) .wrap`, dan breakpoint 2-kolom dinaikkan ke
1100px. Select jam buka/tutup juga sempat kepotong (flex-shrink) -> dikunci
`width:64px` tetap.

**Card Setrika Listrik di Analisa Biaya Listrik:** Card ke-4 (setelah
Cuci/Kering/Pompa), muncul HANYA jika kategori outlet Drop Off/Kiloan atau
Hybrid DAN ada mesin setrika berjenis "listrik" di Profil Outlet. Rumus beda
dari washer/dryer: `Rp/jam = (watt / 1000) x TDL` (murni per jam, TIDAK
dibagi durasi/load). Baris "Setrika Uap" tidak dihitung sama sekali (tidak
ada biaya listrik). Field baru `wattSetrikaListrik` di `Modul_BiayaListrik.gs`.

**Card Kap. Setrika di dashboard (Prioritas #2 lama - SUDAH SELESAI):**
`getDashboardCabangSummary` sekarang kirim `totalUnitSetrika`,
`kapasitasSetrikaKgPerJam`, `jenisSetrika`, `okupansiSetrika`. Dashboard
adaptif: Self Service tetap 2 KPI, Drop Off/Kiloan & Hybrid jadi 3 KPI
sejajar (lihat detail render di atas, bagian Card Profil Outlet).

**Fitur Chemical & Packing di Master Biaya (Prioritas #4 lama - SUDAH SELESAI):**
2 modul baru `Modul_BiayaChemical.gs` & `Modul_BiayaPacking.gs`, POLA SAMA
seperti `Modul_BiayaGas.gs` (multi-record per cabang) tapi TANPA acuan mesin
(`dryerRefId`) - basis hitungan murni per Kg, bukan per load. Skema per item:
`nama` (bebas: Deterjen/Softener/Parfum/Pelicin/dll), `hargaBeli` (per
kemasan), `isiKemasan` + `satuanKemasan` (bebas: gram/ml/pcs), `takaranPerKg`.
Rumus: `hargaPerUnit = hargaBeli / isiKemasan`, `biayaPerKg = hargaPerUnit x
takaranPerKg`. Total per cabang = jumlah semua item. Pill "Deterjen" (dulu
disabled) di-rename jadi "Chemical" krn isinya bukan cuma deterjen. Layar:
`screenChemicalList/Form` & `screenPackingList/Form` (reuse CSS `.gas-card`
apa adanya, tidak bikin style baru). Cascade delete sudah ditambahkan di
`Modul_Cabang.gs:deleteCabang()`. **BELUM terhubung ke Struktur Biaya HPP**
- itu langkah lanjutan, lihat Prioritas #3 di bawah (jangan dikira sudah
otomatis masuk hitungan HPP hanya karena datanya sudah bisa diisi).

**[2026-07-12] Layar Master Biaya DESKTOP (`#screenMasterBiaya`, >=1100px) -
SELESAI didesain ulang, JANGAN disamakan dgn "Card Master Biaya Produksi" di
Dashboard (itu kartu ringkas terpisah, tidak diubah).** Konsep sekarang sama
persis pola Dashboard & Profil Outlet: satu kartu besar utk SATU outlet
terpilih (pill nama+kategori kanan atas, ganti outlet lewat picker global),
brand "Kalkulator Laundry" + tombol Back dibuang. Di dalamnya, 6 komponen
biaya (Gas LPG/Listrik/Air/Chemical/Packing/Nota) masing-masing jadi kartu
`.gas-card` (REUSE apa adanya, lihat catatan komponen kanonik di atas) dengan
dot warna kategori, 1 tombol ikon (pensil="Kelola" kalau sudah ada data,
plus="Isi data" kalau belum) yang membuka layar kategori itu langsung utk
outlet ini (`openGasList`/`openListrikForm`/`openAirForm`/`openChemicalList`/
`openPackingList`/`openNotaKasirForm`), sel highlight berwarna tint kategori
utk nominal Rp/load (atau Rp/jam khusus Gas kategori Jasa Setrika), + sel
kontribusi %. Data dari `getDashboardMasterBiayaSummary(cabangId)` (fungsi
lama, dipakai bareng Dashboard) lewat `cachedServerRead_` (SWR, refetch tiap
masuk/balik ke layar). HP/tablet (<1100px) TIDAK diubah - tetap pill kategori
+ pilih cabang lama. File terkait: `Screen_MasterBiaya.html`,
`Script_Fitur_MasterBiaya.html` (`renderMasterBiayaDesktop_`,
`buildMasterBiayaDesktopHtml_`), `Style_Module_Dashboard_MasterBiaya.html`.

**[2026-07-12] Update lanjutan Master Biaya + Profil Outlet desktop:**
1. **Baris "Total biaya produksi per load" DIHAPUS** dari layar Master Biaya
   desktop (user tidak mau) - `buildMasterBiayaDesktopHtml_` sekarang cuma
   mengembalikan grid 6 kartu, tanpa header total.
2. **Tiap kartu komponen (Gas/Listrik/Air/Chemical/Packing/Nota) sekarang
   punya breakdown lebih lengkap**, bukan cuma 1 angka + persen. Field baru
   `komponenBiaya[].detail[]` di `getDashboardMasterBiayaSummary`
   (`Modul_Dashboard.gs`, ADITIF - tidak mengubah field lama/formula lama,
   cuma expose angka yang MEMANG SUDAH dihitung di dalam fungsi itu): Gas =
   jumlah data tabung; Listrik = breakdown Pompa Air/Washer/Dryer per load (3
   angka nyata); Air = label sumber air; Nota = breakdown Biaya
   Aplikasi/Kasir vs Biaya Nota/Kertas; Chemical = jumlah item + nama item
   (dipotong via `truncateDetailText_` biar kartu tetap padat); Packing =
   jumlah item yang dihitung (layanan kiloan). Dirender sbg baris `.meta-row`
   (component GLOBAL yang sudah ada, reuse persis) di atas divider hasil.
3. **Layar Master Biaya & Profil Outlet desktop sekarang TIDAK BISA
   discroll** (1 layar penuh), pakai teknik JS yang SAMA dgn Dashboard
   (`fitDesktopDashboardToViewport_` di `Script_Fitur_Dashboard.html` -
   FUNGSI INI DIGENERALISASI dari khusus `#screenMenu` jadi daftar target
   `SINGLE_SCREEN_FIT_TARGETS_` = `[screenMenu, screenList,
   screenMasterBiaya]`, masing-masing dgn 1 panel target yang tingginya
   diukur & dikunci ke `window.innerHeight - rect.top - gap` tiap ganti
   layar/resize/render data baru). Struktur CSS panel (`.panel` masing-
   masing layar) jadi `display:flex; flex-direction:column; overflow:hidden;`
   dengan child konten `flex:1; min-height:0; overflow:hidden` supaya grid/
   kartu di dalamnya menyesuaikan tinggi (`grid-auto-rows:1fr` utk Master
   Biaya), BUKAN memicu scrollbar internal. Kalau nambah layar "satu-outlet"
   baru yang butuh perilaku sama, TINGGAL tambah 1 entri ke
   `SINGLE_SCREEN_FIT_TARGETS_`, jangan tulis fungsi fit terpisah lagi.
4. Kepadatan kartu (padding/gap/font) dikecilkan scoped ke `.mb-desktop-card`
   supaya 6 kartu + breakdown tambahan tetap muat 1 layar di laptop umum
   (1366x768 ke atas) - kalau di window sangat kecil kontennya di-crop halus
   (`overflow:hidden`, BUKAN error) drpd memaksa scrollbar muncul.

**[2026-07-15] Rekomendasi "edukasi pemula" di layar HARGA LAYANAN (inline).**
3 fitur, semua ambang margin **>=20%** (Opsi B, nyambung status margin lama),
reuse `.hl-reco-text`/`.hl-reco-chip` + container `.hl-minorder-reco`/
`.hl-harga-reco` (`Style_Module_HargaLayanan.html`). Semua fungsi di
`Script_Fitur_HargaLayanan.html` (`computeMinOrderRecommendation`,
`updateMinOrderReco`, `updateHargaReco`, `applyMinOrderReco`, `applyHargaReco`
- WAJIB `window.*` krn dipanggil dari `onclick`). TIDAK mengubah rumus/struktur
data lama.
1. **Minimum Order** (layanan per-Kg: kiloan/hybrid/jasa setrika): saran Kg
   terkecil dari {3,4,5} yang bikin margin transaksi >=20%; maks 5 Kg; kalau 5
   Kg pun belum 20% -> warning "harga per Kg terlalu rendah, naikkan harga".
   Live ikut harga yang diketik. Murni client (data-hpp-siklus + input min
   order). Deploy @331.
2. **Harga Jual per-Kg + Bed Cover** (murni client): cost-plus = HPP siklus /
   (0.8 x N), N = min order saat ini (kosong -> asumsi **3 Kg**, ditulis di UI),
   dijepit RENTANG WAJAR per layanan: Cuci Saja 4-11rb, Cuci Kering Lipat
   5-12rb, Cuci Kering Setrika 6-15rb, Setrika Saja 4-10rb (semua /Kg). Bed
   Cover per ITEM: snap ke nilai terdekat KE ATAS dari daftar 20/22/25/28/30/32/
   35/38/40/42/45/48/50 rb yang menutup HPP/0.8. Deploy @332.
3. **Harga Jual Self Service** (per load, BUTUH backend): cost-plus = (HPP per
   load + jatah fixed cost per siklus) / 0.8, dijepit rentang wajar (Cuci Saja
   10-15rb, Kering Saja 10-20rb, Cuci Kering 20-30rb). Alokasi fixed cost
   "model A": `fixedCostPerCycle = total biaya tetap/bulan / (loadCuci +
   loadKering /bulan)`; Cuci Saja & Kering Saja x1 siklus, Cuci Kering x2 (pakai
   2 mesin). Backend `buildSelfServiceRecoContext_` (Modul_HargaLayanan.gs,
   panggil `getDashboardFixedCostSummary_impl_` + `getDashboardCabangSummary_impl_`,
   ADITIF) -> field item `fixedCostPerCycle`/`hasFixedData` via param baru
   `recoContext` di `buildHargaLayananItems_` -> atribut kartu
   `data-self-fixed-per-cycle`/`data-self-has-fixed`. Gas naik -> HPP naik ->
   saran naik (tanpa logika gas terpisah). Sewa naik -> jatah fixed cost naik ->
   saran naik. Fixed cost belum diisi -> catatan "saran baru dari HPP". Deploy
   @333. Catatan: response Self Service kini +2 baca sheet (fixed cost + summary
   cabang), tertutup cache SWR, dampak minim.

---

### Custom Domain / Link Pendek (2026-07-14)

User rencana jual app ini & mau custom domain/link pendek (bukan URL panjang
`script.google.com/...`) + bungkus repo di GitHub Private (sudah, dikonfirmasi
aman) supaya kode tidak gampang disalin.

**Percobaan 1 - Reverse proxy Vercel: GAGAL, jangan dicoba ulang dengan cara
sama.** Folder `vercel-proxy/` (Edge Function `api/proxy.js` yang `fetch()`
ke URL exec Apps Script lalu kirim ulang responsnya) supaya address bar
browser tetap domain custom - saat diakses lewat proxy ini, yang muncul
halaman **Login Google** (bukan Login Kalkulator Laundry). Penyebab: akses
anonim "Anyone" di Apps Script mengandalkan negosiasi cookie yang normalnya
terjadi LANGSUNG di browser pengunjung asli; begitu request dilewatkan
`fetch()` server-side Vercel (request baru tanpa cookie/histori), Google
menganggap ini mencurigakan dan minta login akun Google - padahal app ini
pakai auth sendiri (email+OTP), TIDAK butuh akun Google sama sekali.

**Percobaan 2 - GitHub Pages redirect: BERHASIL.** Halaman statis
`docs/index.html` (redirect via `<meta http-equiv="refresh">` +
`window.location.replace()`) di-hosting gratis GitHub Pages dari repo
SOURCE CODE utama (Settings > Pages > Source: Deploy from branch > `main` /
`/docs`) - link `https://rhe05.github.io/Kalkulator-Laundry-Versi-002-FINAL/`
TERBUKTI aman (langsung masuk Login Kalkulator Laundry, tidak ada layar
Login Google) tapi kepanjangan (nama repo ikut kebawa di URL).

**Percobaan 3 - Repo GitHub terpisah khusus redirect: FINAL, INI YANG
DIPAKAI SEKARANG.** Dibuat repo BARU terpisah bernama `kalkulator-laundry`
(Public, aman - isinya CUMA halaman redirect, tidak ada kode aplikasi sama
sekali) di folder lokal `C:\Users\user\Documents\kalkulator-laundry\`
(index.html sama persis, di root repo bukan folder `docs`), GitHub Pages
source: branch `main` / `/ (root)`. **Link resmi yang dipakai/dibagikan ke
pelanggan sekarang: `https://rhe05.github.io/kalkulator-laundry/`** - lebih
pendek & rapi drpd link Percobaan 2. Link Percobaan 2 (`.../Kalkulator-
Laundry-Versi-002-FINAL/`) MASIH aktif/jalan (tidak dihapus), tapi jangan
dipakai lagi sebagai link utama - biarkan `docs/index.html` di repo utama
sbg cadangan saja.

**Batasan yang harus diketahui (berlaku utk KEDUA link):** ini REDIRECT,
bukan proxy - begitu redirect terjadi, address bar browser BERUBAH jadi URL
exec Apps Script yang panjang (bukan tetap di `github.io`/domain custom).
Jadi ini cuma memendekkan LINK YANG DIBAGIKAN (WA/brosur/dst), bukan
menyembunyikan URL asli selamanya. Kalau update URL exec Apps Script Anda
(mis. redeploy versi baru dgn deployment ID beda), WAJIB update link di
KEDUA tempat: `docs/index.html` (repo utama) DAN
`C:\Users\user\Documents\kalkulator-laundry\index.html` (repo terpisah,
link resmi) - masing-masing 2 titik (`meta http-equiv="refresh"` &
`window.location.replace`), commit, push di masing-masing repo.

**Custom domain sungguhan** (ganti `github.io` jadi `laundry-anda.com`) bisa
ditambah kapan saja tanpa proxy - tinggal file `CNAME` di repo
`kalkulator-laundry` (yang dipakai sbg link resmi) isinya nama domain, plus
atur DNS (CNAME record) di registrar domain ke `rhe05.github.io`. BELUM
dikerjakan (user belum punya domain custom saat sesi ini) - lanjutkan ini
kalau user sudah beli domain.

Rencana custom domain "asli" (tetap di domain sendiri, tidak redirect ke
URL panjang) baru masuk akal lagi SETELAH migrasi ke Supabase + frontend
sendiri (Next.js/dst) - di titik itu tidak ada lagi ketergantungan ke
mekanisme sandbox Apps Script.

File `vercel-proxy/` DIBIARKAN di repo (tidak dihapus, tidak dipakai) sebagai
referensi gagal, JANGAN dipakai apa adanya tanpa perbaikan cookie-forwarding
kalau nanti mau dicoba lagi dgn pendekatan berbeda. Project Vercel-nya
(`kalkulator-laundry-versi-002-final` di akun Vercel user) juga
dibiarkan idle, dipakai ulang nanti saat migrasi Supabase.

---

### Optimasi Performa (2026-07-14)

User minta app lebih cepat (6 area: pindah fitur, pindah outlet, loading
pertama, simpan, edit, hapus). Audit dulu sebelum kerja - hasilnya:

**SUDAH OPTIMAL (dikonfirmasi, jangan disentuh ulang tanpa alasan baru):**
- Navigasi antar screen - murni client-side (show/hide DOM), instan.
- Pindah outlet - SEMUA layar satu-outlet (Dashboard/Profil Outlet/Master
  Biaya/Struktur HPP/Harga Layanan/Biaya Tetap) sudah konsisten pakai pola
  instant-render-dari-cache-lalu-refresh (`cachedServerRead_`).
- Kalau ini masih terasa lambat, itu keterbatasan bawaan Apps Script +
  Spreadsheet (bukan bug kode) - baru benar-benar hilang setelah migrasi
  Supabase nanti.

**DIPERBAIKI - kontensi lock global di operasi tulis (Simpan/Edit/Hapus):**
Semua write (`writeKey_`/`deleteKeyRow_`/`appendToOrder_`/`removeFromOrder_`
di `Util_Penyimpanan.gs`) pakai `LockService.getScriptLock()` GLOBAL (bukan
per-tenant) - user tenant A yang save antre di kunci yang SAMA dgn tenant B
walau data mereka di spreadsheet fisik berbeda. Operasi majemuk (mis. Hapus
Cabang) dulu bisa 7+ siklus kunci terpisah (tiap `deleteKeyRow_`/
`removeFromOrder_`/tiap record biaya kunci sendiri-sendiri).

Perbaikan yang SUDAH dikerjakan (bukan mengubah rumus/logic bisnis, murni
menggabungkan siklus kunci):
- `Util_Penyimpanan.gs`: tambah primitive unlocked `_deleteKeyRowCore_`,
  `_writeOrderCore_`, `_appendToOrderCore_`, `_removeFromOrderCore_` (dipakai
  utk MENGGABUNGKAN beberapa operasi storage dalam 1 siklus kunci) + helper
  `writeKeyAndAppendOrder_` (gabung writeKey_+appendToOrder_ jadi 1 kunci).
  Fungsi publik lama (`writeKey_`/`deleteKeyRow_`/dst) perilakunya TIDAK
  berubah, cuma jadi wrapper tipis di atas versi Core_.
- `createCabang_impl_`, `createBiayaGas_impl_`, `createBiayaChemical_impl_`,
  `createBiayaPacking_impl_`: 2 siklus kunci -> 1 (pakai
  `writeKeyAndAppendOrder_`).
- `deleteCabang_impl_` (Modul_Cabang.gs): SELURUH cascade (hapus cabang +
  hapus dari order + hapus semua record Gas/Listrik/Air/Chemical/Packing
  milik cabang itu) dibungkus 1 `_withDataLock_`. 5 fungsi
  `deleteBiayaXByCabang_` (satu di tiap Modul_BiayaX.gs) diubah pakai
  primitive `_xxxCore_` (TIDAK mengunci sendiri lagi) - **PENTING: fungsi
  `deleteBiayaXByCabang_` ini SEKARANG HANYA AMAN dipanggil dari dalam
  `deleteCabang_impl_`** (yang sudah pegang kunci), JANGAN dipanggil
  standalone dari tempat lain tanpa kunci aktif kalau nanti ada fitur baru
  yang butuh manggilnya (sudah dikonfirmasi 2026-07-14 tidak ada pemanggil
  lain saat ini).

**BELUM dikerjakan (ditunda, sengaja):**
- Kunci benar-benar terpisah per-tenant (bukan cuma dikurangi jumlah
  siklusnya) - butuh custom lock via CacheService (LockService bawaan GAS
  tidak punya "lock per key/tenant"). Risikonya lebih tinggi (bisa
  deadlock/race kalau salah desain retry-nya) & manfaatnya baru kerasa kalau
  BANYAK pelanggan aktif nulis bersamaan (belum terjadi saat ini, masih
  tahap awal). Pertimbangkan lagi kalau traffic sudah signifikan, atau
  sekalian dikerjakan pas migrasi Supabase (database sungguhan otomatis
  punya row-level locking, masalah ini hilang total).
- `cloneOnboardingTemplate_impl_` (Modul_OnboardingEstimasi.gs) - punya
  10-20+ siklus kunci terpisah (banyak create* dipanggil beruntun), TAPI
  fitur ini jarang dipakai (cuma sekali per user baru saat onboarding), jadi
  prioritas rendah - belum disentuh.
- Ukuran payload `Index.html` (gabungan 62 file, ±15.7k baris HTML+CSS+JS
  dikirim sekaligus tiap `doGet()`) - dampak "sedang", bukan kontributor
  utama. Belum ada tindakan (opsi masa depan: minifikasi HTML/CSS, TAPI
  risiko regresi kalau minifier JS-aware tidak dipakai dgn hati-hati -
  belum layak dikerjakan sekarang).

---

### PRIORITAS BERIKUTNYA

0. **[SEBAGIAN SELESAI 2026-07-15] Gap fitur "edukasi pemula".** Visi besar
   user: app bikin pemula laundry paham (a) harga jual ideal, (b) minimum order
   ideal, (c) % omset disisihkan utk perawatan & depresiasi, (d) harga sewa
   ideal, (e) jumlah mesin ideal. **SUDAH DIKERJAKAN 2026-07-15: (a) harga jual
   ideal (rekomendasi inline SEMUA kategori) + (b) minimum order ideal** - lihat
   blok "[2026-07-15] Rekomendasi edukasi pemula" di STATUS FITUR. Sisa (c/d/e)
   BELUM - tanyakan prioritas dulu. Audit read-only awal (2026-07-14):
   - **SUDAH ADA** (jangan disarankan ulang): status margin Rugi/Impas/
     Tipis/Aman ambang 20% (`Modul_HargaLayanan.gs` `getHargaLayananMarginStatus_`)
     - ini menjawab (a) harga jual ideal & warning "harga kurang untung"
     sekaligus. Badge Wajar/Perhatian/Tinggi utk sewa (`fcSewaStatus_`,
     Script_Fitur_BiayaTetapOutlet.html, dibuat sesi ini) - TAPI basisnya %
     sewa thd TOTAL BIAYA TETAP, BUKAN thd omset (lihat gap poin 3 di bawah,
     beda pertanyaan).
   - **BELUM ADA (gap nyata)** [update 2026-07-15: no.1 SELESAI]:
     1. ~~Rekomendasi minimum order~~ **SELESAI** (saran 3/4/5 Kg, margin >=20%,
        deploy @331 - lihat STATUS FITUR [2026-07-15]).
     2. Dana cadangan perawatan & depresiasi - belum ada rekomendasi "sisihkan
        X% omset/bulan" terpisah dari profit yang boleh diambil owner.
     3. Benchmark sewa VS OMSET bulanan (rule of thumb umum <10-15% omset) -
        beda dari badge yang sudah ada (itu vs biaya tetap sendiri).
     4. Jumlah mesin ideal dari target omset - `computeGroupLoad_`
        (Modul_Cabang.gs:410) arahnya KEBALIK (kapasitas dihitung DARI mesin
        yang sudah diisi user), belum ada arah sebaliknya (target omset ->
        rekomendasi jumlah mesin, berguna utk yang BELUM buka usaha).
   - **Tanyakan dulu prioritas** (khususnya poin 2 vs poin 4, dua ini paling
     besar dampak DAN paling besar kerjanya - butuh keputusan rumus/bisnis
     baru, bukan cuma UI) sebelum mulai kode di sesi berikutnya.

1. **[PENDING KEPUTUSAN USER] Fitur "Kontribusi Omset" + garis Target Omset
   Maksimum di grafik BEP.** User berhenti di sini untuk istirahat, tinggal
   lanjutkan dari titik ini. Konteks:
   - Tujuan: ganti label skala sumbu Y grafik BEP (saat ini angka arbitrer
     1.8× BEP) dengan **Target Omset Maksimum riil** berdasarkan kapasitas
     mesin outlet.
   - Kendala: outlet Self Service punya 3 layanan (Cuci Saja, Kering Saja,
     Cuci Kering) yang berbagi 2 sumber daya (mesin cuci & mesin pengering).
     Cuci Kering pakai KEDUANYA sekaligus, jadi kapasitas maksimum bukan
     penjumlahan sederhana — dibatasi oleh mesin yang jadi *bottleneck*.
   - Solusi yang disepakati arahnya: user usul form input baru **"Kontribusi
     Omset"** — owner set sendiri persentase kontribusi tiap layanan
     (misal Cuci Saja 50%, Kering Saja 5%, Cuci Kering 45%, total 100%).
   - Rumus yang perlu dibangun:
     - Pemakaian mesin cuci = (%CuciSaja + %CuciKering) × total transaksi
     - Pemakaian mesin pengering = (%KeringSaja + %CuciKering) × total transaksi
     - Total transaksi maksimum = yang lebih membatasi antara kapasitas mesin
       cuci vs pengering (`summary.cuci.loadMaksimalPerHari` &
       `summary.kering.loadMaksimalPerHari`, sudah ada di
       `Modul_Cabang.gs:362`, computeGroupLoad_ — ini SUMBER KEBENARAN
       TUNGGAL kapasitas, jangan hitung ulang dengan cara lain)
     - Omset maksimum = total transaksi maksimum × harga rata-rata tertimbang
   - Yang perlu dibangun kalau lanjut penuh: field data baru + migrasi default
     di `Modul_Cabang.gs`, form input 3 kolom persentase di layar Profil
     Outlet (validasi total = 100%), rumus bottleneck di backend, baru garis
     "Target Omset Maksimum" + gridline Y-axis di `buildBepChartSvg`.
   - Alternatif sementara (kalau tidak mau kerjain penuh dulu): pakai
     pendekatan bottleneck dengan asumsi kontribusi default, fitur
     "Kontribusi Omset" sesungguhnya jadi task terpisah nanti.
   - **User belum memilih salah satu opsi ini — tanyakan dulu di awal sesi
     berikutnya sebelum lanjut.**
2. **[SELESAI]** ~~Card "Kap. Setrika" untuk kategori Drop Off/Kiloan & Hybrid~~
   — lihat bagian "Card Kap. Setrika di dashboard" di atas.
3. **[SELESAI - 2026-07-07]** ~~Backend HPP untuk Drop Off/Kiloan & Hybrid~~ —
   `Modul_StrukturBiayaHPP.gs` sekarang punya `buildKiloanHPPStructure_`
   (5 layanan: Cuci Saja, Cuci Kering Lipat, Cuci Kering Setrika, Setrika Saja,
   Bed Cover) dan `buildJasaSetrikaHPPStructure_` (1 layanan: Setrika Saja),
   dipilih otomatis di `getStrukturBiayaHPP` berdasarkan `kategoriLayanan`
   cabang. Self Service TIDAK diubah (`buildSelfServiceHPPStructure_` tetap).
   Rumus final (dikonfirmasi user 2026-07-07):
   - Basis mesin (air/listrik washer&pompa/dryer/gas/nota) dihitung PER LOAD
     dulu (persis Self Service), lalu dibagi `kapasitasKgPerLoad` (rata-rata
     tertimbang `kapasitasKg` mesin cuci) untuk dapat angka per Kg.
   - Cuci Saja (kiloan) = Air+Washer+Pompa+Nota (per Kg) + Deterjen + Softener
     + Packing (langsung, karena chemical/packing sumbernya sudah per Kg).
   - Cuci Kering Lipat = semua komponen Cuci+Kering (per Kg) + Deterjen +
     Softener + Packing.
   - Cuci Kering Setrika = Cuci Kering Lipat + Setrika per Kg.
   - Setrika per Kg = (Rp/jam mesin setrika listrik, uap=Rp0) ÷ kapasitas
     kg/jam mesin setrika (weighted average, dari `Modul_BiayaListrik.gs`
     `summary.setrika[]`).
   - Setrika Saja = Setrika per Kg + Nota per Kg (Nota historisnya per load,
     dikonversi pakai `kapasitasKgPerLoad` yang sama — kalau outlet Jasa
     Setrika tidak punya mesin cuci sama sekali, komponen Nota ini jadi Rp0
     dengan warning, bukan salah hitung diam-diam).
   - Bed Cover = per ITEM, bukan per Kg (1 Bed Cover dianggap = 1 load penuh).
     Komponennya: Nota + HPP Cuci (Air+Washer+Pompa, tanpa nota) + HPP Kering
     (Dryer+Gas, tanpa nota) + Deterjen + Softener + Parfum + Packing (4
     terakhir dikonversi dari per-Kg ke per-load dengan dikali
     `kapasitasKgPerLoad`).
   - Bed Cover punya TOGGLE aktif/nonaktif per cabang (`setBedCoverAktif`,
     default AKTIF), disimpan di key `bedCoverAktif_<cabangId>`. Kalau
     nonaktif, layanan Bed Cover hilang dari HPP DAN Harga Layanan sekaligus
     (`Modul_HargaLayanan.gs` baca status yang sama). Toggle UI ada di dalam
     card HPP dashboard (`.hpp-bedcover-toggle-row` / `.hpp-bedcover-off-row`).
   - `Modul_HargaLayanan.gs`: kategori `jasa_setrika` sekarang dikenali
     terpisah (dulu jatuh ke default "drop_off" 5 layanan, salah - sekarang
     cuma 1 layanan Setrika Saja, sama seperti HPP). `hppSourceKey` untuk
     Cuci Kering Lipat/Setrika diubah dari sama-sama `"cuci_kering"` jadi
     key sendiri-sendiri (`cuci_kering_lipat`/`cuci_kering_setrika`) supaya
     match dengan HPP kiloan yang sekarang komponennya beda (Setrika nambah
     di versi Setrika).
   - Chevron `.hpp-mini-arrow` diperbesar jadi tombol bulat 26x26px (dulu
     cuma teks kecil font-size 10px, nyaris tak terlihat sebagai tombol).
4. **[SELESAI]** ~~2 card tambahan Packing dan Chemical~~ — lihat bagian
   "Fitur Chemical & Packing" di atas. Sudah terhubung ke HPP (lihat poin #3
   di atas, sesi 2026-07-07).
5. **[SELESAI - dicek 2026-07-07, TIDAK PERLU KODE]** ~~Perbaikan tampilan
   layar detail (Gas, Listrik, Air, Nota)~~ — catatan ini sudah usang. Audit
   ulang membuktikan format Rp (titik ribuan di input, tanpa desimal di
   ringkasan `money0()`) sudah konsisten rapi di SEMUA 4 layar tersebut, sama
   seperti Chemical/Packing. Gaya card Listrik (`.listrik-kategori-card`) &
   Air (`.air-result-panel`) memang beda dari Gas/Chemical/Packing
   (`.gas-card`), tapi itu wajar karena struktur datanya beda (Listrik/Air =
   satu konfigurasi per outlet, bukan daftar multi-item) — BUKAN cacat,
   sengaja tidak diseragamkan paksa. Jangan diusulkan ulang kecuali user
   nunjukkan masalah visual konkret (screenshot).
6. **[PENDING KEPUTUSAN USER] UX form Profil Outlet - validasi & feedback
   pengisian data.** User usul (2026-07-05): semua card collapsed dulu saat
   cabang baru, ada step-by-step tooltip, field kosong ditandai merah + card
   bergetar saat coba Simpan kalau ada yang belum lengkap. Rekomendasi Claude
   (BELUM disetujui user): jangan full wizard (risiko rebuild besar, owner
   sering perlu bolak-balik antar section) — versi ringan saja: (a) semua
   panel collapsed default utk cabang baru, (b) border merah + teks error di
   field yang wajib tapi kosong saat klik Simpan, (c) panel yang error
   auto-expand + scroll + shake singkat. **Tanyakan dulu di awal sesi
   berikutnya, jangan langsung kerjakan salah satu opsi.**
7. **Keputusan desain yang SUDAH FINAL (jangan diusulkan ulang):**
   - Tidak perlu warna berbeda per layanan HPP (sage/brass/volt) — user bilang
     "nanti kesan norak" kalau kategori lain (Drop Off/Kiloan) yang punya
     5-6 layanan ikut diwarnai semua. Total HPP tetap netral/hitam.
   - Warna hanya dipakai untuk Self Service (cuma 2-3 layanan, masih efektif
     jadi pembeda cepat)

---

## SESI 2026-07-27 (ringkasan - detail lengkap ada di memory Claude, bukan di sini)

**Catatan penting:** ada banyak sesi besar antara 2026-07-15 dan 2026-07-27
yang TIDAK sempat dicatat di file ini (multi-tenant + auth password/magic
link, migrasi sebagian ke Firestore, sistem Undangan Akun mandiri, dll) -
semua itu SUDAH ada, cek memory Claude (`project_multi_tenant_auth`,
`project_migrasi_firestore`, `project_layanan_hpp_custom`) kalau butuh
detailnya, JANGAN asumsikan app masih di kondisi 2026-07-15.

**Progress sesi 2026-07-27 (semua sudah deploy live, deployment ID SAMA
`AKfycbxQPKNOM8aTSZtWaRwp6GENbE2dT5nERK1Yd1cakULzKN2Pxrqpcui_88R_6jSCyR73xg`,
versi terakhir **@397**):**

1. **Auto-login setelah verifikasi email pendaftaran** (`Modul_Auth.gs`
   `verifyEmailMagicLink` + `Script_Fitur_Auth.html`) - klik link verifikasi
   di email sekarang langsung masuk app, tidak perlu ketik password lagi
   (server buat sessionToken via `loginFinish_`). Reset password TIDAK
   berubah (tetap alur lama).
2. **2 tool bypass admin di Panel Admin** (utk bantu user yg stuck
   daftar/masuk): (a) ikon 🔒 "Bebaskan batas percobaan" per akun -
   `adminClearRateLimit` (hapus rate-limit tanpa ubah password), (b) panel
   "Link Masuk Langsung" - admin masukkan email, kirim link sekali-pakai
   30 menit yg BENAR-BENAR skip password/OTP/limit (`adminGenerateDirectLoginLink`
   + `completeDirectLogin`, Modul_Auth.gs).
3. **Bug "GLOBAL ERROR" layar putih diperbaiki** - 5 form (Gas/Chemical/
   Packing/Listrik/Profil Outlet) listener-nya dipasang saat boot padahal
   variabel form-nya masih null sampai form dibuka; kalau ada event nyasar
   (diduga autofill browser) sebelum itu, dulu CRASH & window.onerror
   menghapus SELURUH tampilan app. Fix: guard `if (!xxxFormState) return;`
   di semua listener yg dipasang saat boot.
4. **Icon sidebar & kartu Dashboard diganti dari emoji ke SVG monokrom**
   (stroke `currentColor`, viewBox 24, stroke-width 1.8 - gaya yg SAMA dgn
   logo brand yg sudah ada, BUKAN gaya baru/library eksternal). Pola ini
   jadi ACUAN kalau ganti icon lagi di layar lain nanti.
5. **Sidebar diciutkan: logo jadi tombol lebarkan** (chevron disembunyikan,
   klik logo utk lebarkan) **+ tooltip nama menu saat hover icon ciutkan**
   (kartu gelap premium, posisi dihitung JS `position:fixed` - BUKAN CSS
   absolute biasa, krn `.app-sidebar` py `overflow-y:auto` yg otomatis
   memotong overflow-x juga).
6. **Layar baru "Target & Potensi" (sidebar, KHUSUS DESKTOP)** - `Screen_BEP.html`
   + `Script_Fitur_BEP.html` (file baru). BEP tampil ANGKA SAJA (grafik BEP
   dihapus total setelah berkali-kali gagal presisi di panel desktop manapun -
   reuse `.bep-hero-row-cards`/`.bep-item` yg sudah ada, TANPA
   `buildBepChartSvg`). Potensi Omset versi LENGKAP (breakdown per layanan +
   dasar perhitungan, sama persis kartu HP - `renderDashboardPotensiOmsetCard`
   sekarang terima parameter `targetId` opsional). **BEP & Potensi Omset TIDAK
   ADA lagi di Dashboard** (sempat dicoba taruh di sana dulu, user minta
   pindah krn Dashboard py aturan keras "1 layar tanpa scroll" yg gampang
   bentrok). Layar ini TIDAK dikunci 1-layar (beda dari Dashboard/Profil
   Outlet/dst) - dibiarkan scroll biasa krn konten Potensi Omset variatif
   panjangnya. TIDAK ADA versi HP (sidebar sendiri tidak tampil di HP).

---

## SESI 2026-08-11 s/d 12 — fokus MOBILE

Deployment ID **SAMA** seperti biasa
(`AKfycbxQPKNOM8aTSZtWaRwp6GENbE2dT5nERK1Yd1cakULzKN2Pxrqpcui_88R_6jSCyR73xg`),
versi terakhir **@405**. Semua sudah `git push` + `clasp push` + deploy.

**Seluruh sesi ini KHUSUS tampilan HP. Desktop sengaja tidak disentuh** —
tiap aturan CSS baru dikurung `@media (max-width: 1099.98px)`, atau memang
menyasar elemen yang hanya dirender di HP.

### Yang selesai

1. **@399 — TTL "Link Masuk Langsung" 30 menit → 24 jam**
   (`Modul_Auth.gs`, konstanta `DIRECT_LOGIN_TTL_MS_`). Dipicu kasus nyata: customer
   `rsg26.rsg@gmail.com` tidak bisa login (akun ADA, password salah — dia
   sempat minta reset 2026-08-06 tapi tidak pernah menyelesaikan klik link).

2. **@400 — Judul kartu Dashboard jadi hitam** (`.dashboard-card .menu-title`
   dari `--text-faint` ke `--text`), keluhan tidak terbaca di HP.

3. **@401 — 4 OUTLET MASTER OTOMATIS, "Template Estimasi Cepat" DIHAPUS TOTAL**
   - `Modul_OnboardingEstimasi.gs` **diganti nama** →
     `Modul_MasterOutletBawaan.gs`. Layar + script client + endpoint
     (`cloneOnboardingTemplate`, `getOnboardingCategories`) + entri navigasi
     **dihapus semua**; `Screen_OnboardingEstimasi.html` &
     `Script_Fitur_OnboardingEstimasi.html` sudah tidak ada.
   - Ganti: akun yang datanya masih kosong otomatis dibuatkan **keempat**
     outlet master milik admin, lengkap dgn seluruh biayanya. Mesin
     kloningnya SAMA seperti yang lama, cuma tanpa input user yang menimpa
     sewa/gaji/gas.
   - Endpoint baru: `getMasterSeedPlan` (murah, tidak mengkloning) &
     `seedNextMasterOutlet` (SATU outlet per panggilan — 4 sekaligus berisiko
     kena batas waktu Apps Script, dan dipecah begini progresnya bisa
     ditampilkan jujur di splash).
   - Dipicu HANYA saat `listCabang` di `refreshDashboard` melaporkan 0 outlet
     → tidak ada round-trip tambahan untuk customer yang sudah punya data.
   - Keputusan "akun ini berhak di-seed?" diambil SEKALI lalu dicatat
     permanen di key `masterSeedState_` milik tenant. Akun yang saat pertama
     diperiksa sudah punya outlet ditandai "done" & TIDAK PERNAH disentuh.
   - **Nama template di akun admin WAJIB PERSIS**: `Master Self Service`,
     `Master Jasa Setrika`, `Master Hybrid`, `Master Dropoff/Kiloan`
     (perhatikan: "Dropoff", bukan "Drop Off"). Kalau namanya diubah, master
     itu diam-diam gagal dibuat.

4. **@402–@403 — HEADER HP DIROMBAK: menu utama di balik avatar**
   - Header HP dapat garis rambut tipis (`rgba(17,24,39,0.08)`, sengaja lebih
     ringan dari `--border` yang dipakai tepi kartu).
   - Avatar bulat di kanan berisi **singkatan OUTLET AKTIF** — huruf awal tiap
     kata ("Aca Laundry"→AL, "Master Jasa Setrika"→MJ). Pola huruf-awal
     dipilih, BUKAN dua huruf pertama, karena keempat master diawali "Master"
     → semuanya jadi "MA" dan avatar kehilangan gunanya. Nama utuh ada di
     atribut `title`.
   - Tombol "Keluar" telanjang **pindah ke dalam menu**; di desktop tombol
     lama tetap dipakai apa adanya (`.auth-logout-btn` di-`display:none`
     hanya di HP, `.account-menu` di-`display:none` hanya di desktop).
   - Judul "Dashboard Bisnis" + subjudul + pemilih outlet + label "9 outlet
     aktif" **dihapus dari layar Dashboard HP** (`#screenMenu
     .dashboard-header-top { display:none }`).
     **JANGAN sembunyikan `.dashboard-header`** — di `Screen_Menu.html` div
     itu tidak pernah ditutup sebelum `.menu-grid`, jadi seluruh kartu ikut
     hilang.

5. **@404 — SELURUH NAVIGASI FITUR MASUK MENU UTAMA**
   Isi menu: Pilih Outlet │ Master Biaya, Struktur Biaya, Harga Layanan,
   Biaya Tetap, Target BEP, Potensi Omset │ Panel Admin (admin saja) │ Keluar.
   Dikelompokkan pemisah tipis, `max-height` + scroll supaya "Keluar" tidak
   pernah terpotong. Nama menu sengaja lebih pendek dari judul kartunya;
   **judul kartu Dashboard TIDAK diubah**. Profil Outlet tidak masuk menu
   (dia kartu pertama di Dashboard, yang juga layar awal).
   - **Layar "Target & Potensi" (`screenBEP`) DIAKTIFKAN DI HP** — sebelumnya
     dibungkus wadah desktop-only sehingga sama sekali tidak terjangkau dari
     HP. Class `.bep-screen-desktop` → `.bep-screen-body` (namanya sudah tidak
     benar). Di HP dua panelnya ditumpuk & pemilih outlet di headernya
     disembunyikan. Blok CSS desktop tidak diubah sebaris pun.
     "Target BEP" membukanya dari atas; "Potensi Omset" membukanya tergulung
     ke panel kedua (digulung SETELAH panel BEP selesai dirender, kalau tidak
     posisinya meleset).

6. **@405 — KARTU PROFIL OUTLET HP DIDESAIN ULANG (kapasitas + leher botol)**
   - **Temuan penting:** di `Modul_Cabang.gs` `computeGroupLoad_`,
     `kapasitas produksi = kapasitas maksimal × okupansi%`. Jadi angka yang
     selama ini tampil ("4,3 kg/jam") SUDAH dikali okupansi, tapi kapasitas
     MAKSIMAL-nya tidak pernah ditampilkan di mana pun — pemilik outlet harus
     membagi sendiri untuk tahu kemampuan asli mesinnya.
   - Bentuk baru per layanan: `Cuci │ 1.020 dari 1.200 load/bln` + bar 4px +
     `okupansi 85%`, ditumpuk ke bawah (bukan 3 kolom bergaris). Kotak abu
     di dalam kartu dibuang.
   - Layanan dgn okupansi tertinggi ditandai **"paling mepet"** (bar brass,
     bukan merah — ini bukan kesalahan, cuma yang pertama kewalahan kalau
     order naik). Ditandai HANYA kalau ada ≥2 layanan DAN puncaknya menang
     ≥1 poin; kalau seri tidak ada yang ditandai.
   - Builder baru `buildProfilOutletCardHpHtml_` (khusus kartu Dashboard =
     khusus HP). `buildProfilOutletCardHtml_` lama **DIHAPUS** — setelah ini
     tidak ada lagi yang memanggilnya.
   - **Koreksi catatan lama:** layar Profil Outlet DESKTOP ternyata sudah
     lama punya pembangun sendiri (`buildProfilOutletDetailHtml_` di
     `Script_Fitur_Cabang.html`); komentar yang bilang HP & desktop berbagi
     satu fungsi sudah basi dan sudah diperbaiki.

### Yang masih menggantung (mulai dari sini sesi berikutnya)

1. **BELUM ADA VERIFIKASI VISUAL SAMA SEKALI sepanjang sesi ini.** Claude
   tidak bisa login ke app (butuh password), jadi SEMUA perubahan tampilan
   di atas baru diverifikasi sintaks + logika, belum pernah dilihat di HP.
   Yang paling perlu dicek user: layar Target & Potensi versi HP (paling
   baru), popover menu 9 baris, dan angka "dari" (kapasitas maksimal) di
   kartu Profil Outlet — itu hasil bagi balik `terpakai ÷ okupansi`, jadi
   kalau okupansi diisi angka aneh hasilnya ikut aneh.

2. **6 kartu Dashboard sisanya belum didesain ulang** dengan aturan yang sama
   (Master Biaya, Struktur HPP, Harga Layanan, Biaya Tetap, Target BEP,
   Potensi Omset). Aturannya: tanya user dulu **"kalau tiap pagi cuma boleh
   lihat SATU angka dari kartu ini, angka apa?"** — jawabannya menentukan
   hero tiap kartu. Jangan desain 6 kartu sendiri-sendiri tanpa aturan itu.

3. **±200 baris CSS mati sengaja BELUM dihapus**
   (`.profil-outlet-kpi`, `.profil-kpi-item/label/value/unit/divider`,
   `.profil-outlet-mesin`, `.profil-mesin-*` di
   `Style_Module_Dashboard_ProfilOutlet.html`) — sudah tidak diproduksi JS
   mana pun setelah @405. Ditahan supaya kalau kartu baru ternyata meleset,
   yang lama masih ada untuk dibandingkan. **Hapus setelah user konfirmasi
   tampilan kartu Profil Outlet sudah benar.**
   CATATAN: `.profil-kpi-okupansi` & `.profil-outlet-okupansi-info` MASIH
   DIPAKAI (pembungkus tooltip "?"), jangan ikut dihapus.

4. **Beberapa file masih uncommitted di git tapi SUDAH ter-deploy**
   (`clasp push` mengirim working copy, tidak peduli git): `Code.gs`,
   `Screen_AdminAfiliator.html`, `Screen_Sidebar.html`,
   `Script_Fitur_AdminAfiliator.html`, `Script_Fitur_Sidebar.html`,
   `Script_Fitur_Biaya{Chemical,Gas,Listrik,Packing}.html`,
   `Style_Module_Dashboard{,_BEP,_DesktopDensity}.html`,
   `Style_Module_Sidebar.html`. Artinya: kode yang HIDUP di produksi tidak
   seluruhnya ada di GitHub. Tawarkan commit di awal sesi berikutnya.

5. Prioritas lama yang masih pending TIDAK berubah dari sesi 2026-07-27
   (gap edukasi pemula, Kontribusi Omset, UX validasi form Profil Outlet) —
   lihat blok-blok di bawah.

## SESI 2026-08-29 (PALING BARU) — rumus HPP setrika uap & HPP per Kg

Deployment ID SAMA seperti biasa, versi terakhir **@417**. Semua sudah
`git push` + `clasp push --force` + deploy.

Sesi ini dipicu satu pertanyaan user: "kenapa biaya gas setrika keluar
Rp10.938, padahal hitungan saya Rp7.813 per jam?" — dan berujung ke tiga
perbaikan rumus + satu mekanisme pencegah bug yang sama terulang.

### Yang selesai

1. **@414 — Setrika uap memakai basis PER JAM, tidak lagi dikali kapasitas
   mesin cuci** (`Modul_StrukturBiayaHPP.gs`). Sebelumnya Air/Gas Setrika
   dikonversi `rpPerJam ÷ kap kg/jam setrika × kap kg mesin cuci`. Keputusan
   user: untuk setrika uap **1 load = 1 jam operasi**, jadi rpPerJam dipakai
   apa adanya. Contoh K2 Laundry: LPG 12kg Rp250.000 ÷ 32 jam = Rp7.813/jam
   → baris "Gas Setrika per Load" kini Rp7.813 (dulu Rp10.938 = 7.813÷5×7).
   Konvensi ini menyamakan Hybrid dengan kategori Jasa Setrika yang memang
   sudah memakai basis itu sejak awal. **Setrika LISTRIK tidak berubah.**
   Diperbaiki di DUA tempat: `buildKiloanHPPStructure_` (layanan bawaan) dan
   `strukturHPPComponentPool_` (layanan custom) — kalau cuma satu, layanan
   custom menampilkan angka berbeda dari layanan bawaan.

2. **@415 — `HPP_FORMULA_VERSION_`: snapshot Firestore basi otomatis
   dihitung ulang.** Ini pelajaran terpenting sesi ini, baca poin "JEBAKAN"
   di bawah. Konstanta di `Modul_StrukturBiayaHPP.gs` (sekarang **3**) ikut
   ditulis ke `computed.hppFormulaVersion` oleh KEDUA penulis snapshot
   (`recomputeCabangSummary_` DAN `buildComputedWriteSpec_`);
   `getStrukturBiayaHPPFast_` menolak snapshot yang versinya beda lalu
   self-heal dengan `DASHBOARD_RECOMPUTE_HPP_GROUP_` saja (bukan 6 field —
   `fixedCost` tidak bergantung rumus HPP).
   **Cara pakai: ubah rumus HPP → naikkan angka itu → deploy. Selesai.**
   Ubah label/note/urutan tampilan saja TIDAK perlu menaikkan angka.

3. **@416 — HPP per Kg di Harga Layanan dihitung PER KOMPONEN**
   (`Modul_HargaLayanan.gs`). Dulu `hppPerKg = total per load ÷ kapasitas
   mesin cuci` — satu pembagi untuk semua komponen. Sekarang tiap komponen
   dibagi kapasitas mesin yang mengerjakannya:
   - Setrika (Air/Gas/Listrik) → kapasitas kg per **jam** mesin setrika
   - Dryer (Listrik/Gas) → kapasitas kg **mesin pengering** (field
     `konversi.kapasitasKgPerLoadPengering`, BARU — sebelumnya kapasitas
     mesin pengering tidak pernah dipakai di mana pun)
   - Sisanya → kapasitas kg mesin cuci
   Chemical & Packing sengaja masuk kelompok "sisanya": nilai per load-nya
   dibentuk dari `biayaPerKg × kap mesin cuci`, dan pembagian "per 5 kg"
   yang user maksud SUDAH terjadi di `Modul_BiayaPacking.gs`
   (`biayaPerKg = biayaPerLoad ÷ kapKgPerLembar`). Membaginya lagi akan
   menghitung pembagi yang sama dua kali.
   **Catatan penting:** kekeliruan komponen setrika di sini BARU MUNCUL
   akibat @414 — sebelumnya nilai per load-nya sudah terskala ×7/5 sehingga
   dibagi 7 kebetulan menghasilkan angka per kg yang benar.

4. **@417 — "Harga Total" di kartu Harga Layanan**
   (`Script_Fitur_HargaLayanan.html` + `Style_Module_HargaLayanan.html`).
   Satu baris berisi 4 info: HPP Layanan / Harga Jual / Min Order / Harga
   Total. Harga Total = Harga Jual × Min Order (7.000 × 4 = Rp 28.000),
   diperbarui tiap ketik; menampilkan "—" (bukan Rp0) selama Min Order
   kosong. Huruf memakai `clamp()` terhadap lebar layar + `tabular-nums`
   supaya "Rp 28.000" utuh sebaris di HP 360px tanpa kolom bergoyang saat
   angka berubah. Aturan lama yang meruntuhkan grid jadi 1 kolom di bawah
   520px sengaja tidak berlaku untuk baris ini. Kartu tanpa Min Order
   (Self Service & Bed Cover) tidak menerima kelas `hl-metric-grid-4`,
   jadi tetap 2 kolom persis seperti sebelumnya.

### JEBAKAN YANG MEMAKAN WAKTU PALING BANYAK (jangan sampai terulang)

Setelah @414 di-deploy, layar K2 Laundry **tetap menampilkan Rp10.938**.
Sesuai aturan "verifikasi akar masalah dulu", dilakukan
`clasp pull --versionNumber 414` — dan terbukti kode BARU memang sudah ada
di deployment produksi. Jadi bukan cache browser, bukan URL, bukan clasp.

Akar masalahnya: `getStrukturBiayaHPP` membaca snapshot `computed.hpp` dari
Firestore lewat `getStrukturBiayaHPPFast_`. **Selama dokumen itu ada,
fallback hitung-Sheets tidak pernah jalan, jadi rumus baru TIDAK PERNAH
dieksekusi untuk cabang itu.** Berlaku sama untuk keenam field `computed.*`
(`dashboardFastReader_`). Pemulihan manual: simpan ulang salah satu master
biaya cabang tsb (memicu `triggerRecomputeCabang`) — harus per cabang.

Itulah sebabnya `HPP_FORMULA_VERSION_` dibuat (@415). **Sejak sekarang,
jangan pernah menutup pekerjaan perubahan rumus dengan "sudah deploy" saja
— pastikan versinya dinaikkan.**

### Yang masih menggantung

1. **Belum ada verifikasi visual untuk @417.** Claude tidak bisa login ke
   app. Layout 4 kolom sudah diuji lewat menjalankan
   `renderHargaLayananServiceCard` sungguhan di Node (markup benar, Rp 28.000
   benar, Bed Cover tetap 2 kolom) + file pratinjau CSS asli, tapi **belum
   pernah dilihat di HP sungguhan**. Yang perlu dicek: apakah 4 kolom terasa
   sesak di HP kecil, dan apakah "Rp 28.000" benar-benar utuh sebaris.

2. **@417 IKUT MENGUBAH DESKTOP** — melanggar aturan "desktop jangan
   disentuh". Layar detail Harga Layanan dipakai bersama; desktop hanya
   menyusunnya jadi 2 kolom masonry (`@media min-width:1100px`). Akibatnya
   Min Order yang tadinya sebaris penuh kini masuk ke baris 4 kolom.
   Alternatifnya menyembunyikan Harga Total di desktop — dinilai lebih
   buruk. **User sudah diberi tahu dan belum memutuskan.** Kalau diminta,
   kunci `.hl-metric-grid-4` kembali ke 2 kolom khusus ≥1100px (1 baris CSS).

3. **Angka HPP per Kg hasil @416 belum dicocokkan user dengan hitungan
   tangan.** Angka 3.089 yang sempat muncul di percakapan adalah hasil uji
   dengan komponen KARANGAN (hanya totalnya, 18.497, yang nyata) — bukan
   angka K2 sebenarnya. Minta user mencocokkan.

4. **Outlet selain K2 akan lambat sekali di pembukaan pertama** setelah
   @416 (versi rumus naik ke 3 → semua snapshot lama dianggap basi → hitung
   ulang jalur Sheets ~8 detik). Sekali per outlet saja, wajar, bukan bug.

5. **File `.bak-*` menumpuk di root** hasil patch sesi ini
   (`*.bak-setrikauap-*`, `*.bak-fversi-*`, `*.bak-perkg-*`,
   `*.bak-hargatotal-*`). Aman dari `clasp push` (ekstensinya bukan
   .gs/.html) tapi mengotori folder. Hapus setelah user konfirmasi semua
   angka benar.

6. Prioritas lama TIDAK berubah — lihat blok-blok di bawah.

## DATA BACKEND TERSEDIA

### `getDashboardCabangSummary(cabangId)`:
`cabangId`, `namaLaundry`, `kategoriLayanan`, `totalUnitCuci`, `totalUnitPengering`,
`loadCuciPerBulan`, `loadKeringPerBulan`, `jamBukaMenit`, `jamTutupMenit`,
`jenisCuci`, `jenisKering`, `durasiCuci`, `durasiKering` (menit siklus, dari
mesin pertama), `okupansiCuci`, `okupansiKering` (persen 0-100) — 4 field
terakhir diambil via `getCabang(cabangId).data.cabang` karena `listCabang()`
tidak menyertakan array `mesinCuci`/`mesinPengering`/`okupansi`.

### `getDashboardMasterBiayaSummary(cabangId)`:
`cabangId`, `namaLaundry`, `lengkapCount`, `totalKomponen(4)`, `isComplete`,
`missing[]`, `komponenBiaya[]{key, label, biayaPerLoad, persen, unitSuffix?,
detail[]?}`, `totalBiayaPerLoad`.
Komponen sekarang di-push berdasarkan flag "form pernah diisi"
(`gasComplete`/`listrikComplete`/`airComplete`/`notaComplete`), BUKAN
`biayaPerLoad > 0` — supaya komponen yang sengaja Rp0 (misal air sumur) tetap
tampil, bukan hilang dari daftar.

**[2026-07-12] Field `detail[]` ditambahkan** (aditif, tidak mengubah field
lama) — array kecil `{label, amount?, text?}` berisi breakdown yang SUDAH
dihitung di dalam fungsi ini (bukan hitungan baru): Gas = jumlah data tabung;
Listrik = breakdown Pompa/Washer/Dryer per load (3 angka nyata, bukan cuma
total); Air = label sumber air (PDAM/Tangki/Sumur); Nota = breakdown Biaya
Aplikasi vs Biaya Nota/Kertas; Chemical = jumlah item + nama item; Packing =
jumlah item yang dihitung (layanan kiloan). Dipakai kartu Master Biaya
desktop (`buildMasterBiayaDesktopHtml_`) supaya "ringkasan fitur" lebih
lengkap tanpa nambah roundtrip atau formula baru.

### `getDashboardHPPSummary(cabangId)`:
`cabangId`, `namaLaundry`, `kategoriLayanan`, `isReady`, `hppMin`, `hppMax`,
`hppCuciKering`, `bedCoverAktif`, `warningsCount`, `errorText`,
`layananList[]{key, title, total, components[]{key, label, amount, percent}}`
— jumlah item TIDAK LAGI selalu 3, sekarang tergantung `kategoriLayanan`:
Self Service = 3 (Cuci Saja/Kering Saja/Cuci Kering), Drop Off/Hybrid = 4-5
(Cuci Saja, Cuci Kering Lipat, Cuci Kering Setrika, Setrika Saja, + Bed Cover
kalau `bedCoverAktif`), Jasa Setrika = 1 (Setrika Saja). TIDAK di-sort/filter
berdasarkan nilai, urutan natural dari backend builder masing-masing kategori.

### `getDashboardHargaLayananSummary(cabangId)`:
`cabangId`, `namaLaundry`, `totalLayanan`, `hargaTerisiCount`, `rugiCount`,
`tipisCount`, `impasCount`, `amanCount`, `minMarginPercent`, `warningsCount`,
`status`, `errorText`, `layananList[]{key, title, marginPercent, status, hpp,
hargaJual, margin}` — 3 field terakhir (`hpp`/`hargaJual`/`margin`) baru
ditambahkan untuk detail collapsible di dashboard.

### `getDashboardFixedCostSummary(cabangId)`:
`cabangId`, `namaLaundry`, `hasData`, `totalPerBulan`, `totalPerHari`,
`components[]{key, label, amount}` (6 komponen: sewa, gaji, internet,
depresiasi, perawatan, lainnya), `warningsCount`

### `getDashboardBEPSummary(cabangId)`:
`fixedCostPerBulan`, `rataHPP`, `rataHarga`, `marginPerLoad`, `bepLoadPerBulan`,
`bepOmsetPerBulan`, `bepLoadPerMinggu`, `bepOmsetPerMinggu`, `bepLoadPerHari`,
`bepOmsetPerHari`, `warnings[]`, `isComplete` (belum berubah — field
"Target Omset Maksimum" belum ditambahkan, lihat Prioritas #1)

### Kapasitas maksimum mesin (untuk fitur "Kontribusi Omset" mendatang):
`getCabang(cabangId).data.summary.cuci.loadMaksimalPerHari` dan
`.summary.kering.loadMaksimalPerHari` — kapasitas 100% okupansi per hari,
per grup mesin (cuci/pengering terpisah). Sumber: `computeGroupLoad_` di
`Modul_Cabang.gs:343` (SUMBER KEBENARAN TUNGGAL kapasitas, sudah dipakai juga
oleh angka "Kapasitas maksimal/hari" di layar detail Profil Outlet).

---

## SUMBER DATA MODUL (untuk referensi field yang benar)

- **Listrik** (`getBiayaListrik`): `data.summary.cuci[]` & `data.summary.pengering[]`,
  tiap item punya `rpListrikPerLoad`, `rpPompaPerLoad`, `rpTotalPerLoad`
- **Air** (`getBiayaAir`): `data.summary.biayaPerLoad` (BUKAN di record)
- **Nota/Kasir** (`getBiayaNotaKasir`): `data.summary.totalBiayaNotaKasirPerLoad`,
  `biayaAplikasiPerLoad`, `biayaNotaPerLoad`
- **HPP** (`getStrukturBiayaHPP`): `data.layanan[]` tiap item punya `key`, `title`,
  `total`, `components[]`; juga `data.warnings[]`

---

## CARA MULAI SESI BARU

1. Upload file `KONTEKS_PROYEK.md` ini ke Claude (satu file saja, cukup)
2. Tulis: **"Lanjutkan Kalkulator Laundry, lanjut dari yang kemarin."**
3. Claude langsung paham tanpa penjelasan ulang — rule proyek dan rule desain sudah menyatu di file ini.

### Titik berhenti sesi terakhir (2026-08-12, PALING BARU):
Lihat blok "## SESI 2026-08-11 s/d 12" di atas (tepat sebelum "DATA BACKEND
TERSEDIA"). Sesi KHUSUS MOBILE, desktop tidak disentuh. Deploy terakhir
**@405**. Ringkas: 4 outlet master otomatis untuk akun kosong (Template
Estimasi Cepat dihapus total), header HP dirombak jadi avatar + menu utama
yang memuat seluruh navigasi fitur, layar Target & Potensi diaktifkan di HP,
dan kartu Profil Outlet HP didesain ulang (kapasitas terpakai/maksimal +
penanda "paling mepet").

**4 hal yang harus diurus di awal sesi berikutnya** (detail di blok sesi):
(a) belum ada verifikasi visual sama sekali — minta user cek HP dulu;
(b) 6 kartu Dashboard sisanya menunggu didesain ulang, tanya dulu "satu
angka apa yang paling penting" per kartu; (c) ±200 baris CSS mati menunggu
dihapus setelah kartu Profil Outlet dikonfirmasi benar; (d) belasan file
masih uncommitted di git padahal sudah hidup di produksi — tawarkan commit.

### Titik berhenti sesi 2026-07-27:
Lihat blok "## SESI 2026-07-27" di atas (sebelum "DATA BACKEND TERSEDIA")
untuk ringkasan lengkap sesi paling baru - auto-login verifikasi email,
2 tool bypass admin (rate-limit + link masuk langsung), fix bug layar putih
5 form, icon SVG monokrom, sidebar collapse+tooltip, layar baru "Target &
Potensi" (BEP angka + Potensi Omset lengkap, terpisah dari Dashboard).
Deploy terakhir **@397**. Tidak ada keputusan pending yg menggantung dari
sesi ini. Catatan blok di bawah (2026-07-15 ke bawah) masih akurat utk
sejarahnya masing-masing, tapi ketahui ada gap besar sesi yg tidak tercatat
di sini antara 2026-07-15 dan 2026-07-27 (lihat disclaimer di blok SESI
2026-07-27).

### Titik berhenti sesi sebelumnya (2026-07-15):
Sesi 2026-07-15: SELESAI + deploy (@331/@332/@333) fitur rekomendasi "edukasi
pemula" bagian HARGA di layar Harga Layanan - (a) harga jual ideal SEMUA
kategori + (b) minimum order ideal. Detail lengkap di blok "[2026-07-15]" pada
STATUS FITUR. User verifikasi via refresh; link redirect
github.io/kalkulator-laundry sudah otomatis nyajikan @333 (deployment ID tetap,
TIDAK perlu update redirect selama pakai `clasp deploy --deploymentId <yg itu>`).
Sisa gap edukasi (dana cadangan #0.2, sewa vs omset #0.3, jumlah mesin #0.4) +
fitur Kontribusi Omset (#1) BELUM - tanyakan prioritas dulu. Catatan sesi
2026-07-14 (3 keputusan pending, masih relevan) di bawah:

Ada **3 keputusan pending** yang harus ditanyakan dulu di awal sesi berikutnya
sebelum lanjut kerja, jangan langsung pilih salah satu:
1. **Prioritas #0 (baru)** — gap fitur "edukasi pemula" (minimum order ideal,
   dana cadangan perawatan/depresiasi, sewa vs omset, jumlah mesin ideal dari
   target omset). User bilang "simpan dulu saja" - lihat detail lengkap di
   Prioritas #0 atas & memory `project_gap_edukasi_pemula`.
2. **Prioritas #1** — fitur "Kontribusi Omset" untuk grafik BEP (pending dari
   sesi 2026-07-04, belum berubah, lihat detail lengkap di Prioritas #1 atas).
3. **Prioritas #6** — UX validasi form Profil Outlet (collapsed
   default + validasi merah + shake, vs full wizard step-by-step). Claude
   sudah kasih rekomendasi (versi ringan) tapi user belum setuju/pilih.

Progress besar sesi 2026-07-14 (semua sudah verifikasi syntax Node, BELUM
live-tested di browser - user yang jalankan clasp push & deploy sendiri):
- **Sistem Kode Akses dirombak** (`Modul_Auth.gs`): kode akses jadi OPSIONAL
  saat daftar (kosong = akses permanen gratis), `resolveSession_` sekarang
  lacak `lastActivityAt` (throttle 1x/menit) utk status online, 3 fungsi
  admin baru (`adminGenerateAccessCode` - generate 1 kode trial 7 hari TANPA
  input email, `adminListAccessCodes` - riwayat kode, `adminDeleteAccount` -
  hapus akun+sesi+trash spreadsheet tenant permanen, AUTH_ADMIN_EMAIL_
  dilindungi tidak bisa dihapus lewat panel). Fungsi lama
  `adminCreateAffiliateAccount` dihapus (dead code, alur email-input diganti).
- **Panel Admin dirombak total** (`Screen_AdminAfiliator.html` +
  `Script_Fitur_AdminAfiliator.html`, sekarang berlabel "Panel Admin" bukan
  "Buat Akun Afiliator"): kartu ringkasan Total Aktif/Online Sekarang (klik
  utk expand daftar akun - Progressive Disclosure), tombol Generate Kode
  Akses + riwayat kode, tombol Hapus per akun (reuse `#confirmOverlay`
  bersama sama spt hapus item Chemical/Packing).
- **Master Biaya desktop** (`Script_Fitur_MasterBiaya.html`, HP TIDAK
  disentuh): kartu Listrik +Watt Pompa Air, kartu Air +Konversi Air/Liter
  +kebutuhan/biaya air setrika uap (utk outlet normal yg JUGA punya setrika
  uap, bukan cuma kategori Jasa Setrika murni), kartu Chemical breakdown
  Deterjen/Softener/Parfum/Pelicin per Load (exact-match nama, kondisional),
  kartu Packing breakdown per item. SEMUA persentase kontribusi di kartu
  Master Biaya desktop diformat 1 desimal + posisi kanan baris label (dulu
  2 desimal + teks "dari total" di bawah nominal).
- **Biaya Tetap Outlet desktop dirombak** (`Script_Fitur_BiayaTetapOutlet.html`
  + `Style_Module_FixedCost.html`, HP TIDAK disentuh): total ringkasan atas
  cuma Per Bulan/Per Hari (Per Tahun DIHAPUS - user takut angka tahunan bikin
  owner syok), Sewa Outlet dipisah jadi baris "spotlight" sendiri (SATU-
  SATUNYA komponen yg masih tampil /Tahun) + badge status Wajar(≤30%)/
  Perhatian(30-45%)/Tinggi(>45%) dari % kontribusi sewa thd TOTAL BIAYA
  TETAP (fungsi `fcSewaStatus_`) + catatan dampak ke Harga Layanan & BEP
  kalau Perhatian/Tinggi. Tabel komponen lain kolom /Tahun dihapus, padding
  dirapatkan (lebih premium, tidak longgar).
