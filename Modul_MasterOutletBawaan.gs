/**
 * ============================================================================
 * MODUL: MASTER OUTLET BAWAAN (auto-seed saat akun baru pertama kali dipakai)
 * ============================================================================
 * [2026-08-11] MENGGANTIKAN fitur lama "Template Estimasi Cepat" (user pilih
 * 1 dari 4 kategori + isi 3 input sewa/gaji/gas lalu 1 outlet dikloning).
 * Fitur itu DIHAPUS TOTAL - layar, script client, & endpoint-nya sudah tidak
 * ada lagi. Sekarang TIDAK ADA yang perlu dipilih/diisi user: setiap akun
 * yang datanya masih kosong otomatis mendapat KEEMPAT outlet master milik
 * admin sebagai titik awal, lengkap dgn semua biayanya.
 *
 * MESIN KLONING-nya SAMA PERSIS seperti fitur lama (terbukti jalan) - yang
 * berubah cuma: (1) tidak ada lagi input user yang menimpa sewa/gaji/gas,
 * semua disalin apa adanya dari template, (2) dijalankan untuk 4 template
 * sekaligus, bukan 1 pilihan.
 *
 * CARA BACA DATA TEMPLATE ADMIN:
 * Template disimpan di spreadsheet TENANT ADMIN (AUTH_ADMIN_EMAIL_,
 * Modul_Auth.gs) - BUKAN di tenant user yang sedang login. Modul ini SATU-
 * SATUNYA tempat yang boleh baca-tulis LINTAS TENANT (buka spreadsheet lain
 * secara eksplisit), semua modul lain tetap terbatas ke tenant sendiri lewat
 * withTenant_/_activeDataSpreadsheet_ seperti biasa. Nama outlet template di
 * akun admin WAJIB PERSIS sama dengan MASTER_TEMPLATE_NAMES_ di bawah.
 *
 * KAPAN JALAN (lihat maybeSeedMasterOutlets_ di Script_Fitur_Dashboard.html):
 * client memanggil seedNextMasterOutlet SATU TEMPLATE PER PANGGILAN, hanya
 * kalau Dashboard mendapati akun ini belum punya outlet sama sekali. Dipecah
 * per template SENGAJA - 4 kloning sekaligus dalam 1 eksekusi berisiko kena
 * batas waktu Apps Script, dan dipecah begini juga membuat progresnya bisa
 * ditampilkan jujur ("Master Hybrid - 3 dari 4") alih-alih bar diam lama.
 *
 * SEKALI SEUMUR AKUN:
 * Keputusan "akun ini berhak di-seed atau tidak" diambil SEKALI lalu dicatat
 * permanen di key "masterSeedState_" milik tenant ybs. Akun yang saat
 * pertama diperiksa SUDAH punya outlet (customer lama yang sudah isi data
 * sendiri) ditandai "done" tanpa pernah disentuh - datanya tidak akan
 * pernah tercampur master bawaan. Begitu juga sebaliknya: customer yang
 * nanti menghapus semua outletnya TIDAK akan dapat kiriman master lagi.
 * ============================================================================
 */

// Nama outlet template di akun admin - HARUS PERSIS (case-sensitive), dicari
// dgn findTemplateCabangByName_. Urutan array ini = urutan outlet dibuat di
// akun customer.
var MASTER_TEMPLATE_NAMES_ = [
  "Master Self Service",
  "Master Jasa Setrika",
  "Master Hybrid",
  "Master Dropoff/Kiloan",
];

var KEY_MASTER_SEED_STATE_ = "masterSeedState_";

/**
 * getMasterSheetDirect_: sheet "_data_operasional" milik spreadsheet Master
 * (container-bound script ini) SELALU, terlepas dari tenant siapa yang
 * sedang login - BEDA dari ensureDataSheet_() yang ikut _activeDataSpreadsheet_.
 * Dipakai HANYA untuk cari tenantSpreadsheetId milik admin.
 */
function getMasterSheetDirect_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(DATA_SHEET_NAME);
}

function getAdminTenantSpreadsheet_() {
  var masterSheet = getMasterSheetDirect_();
  var raw = readKey_(masterSheet, authKeyUser_(AUTH_ADMIN_EMAIL_));
  if (!raw) {
    throw new Error("Akun admin belum terdaftar - template belum bisa dipakai.");
  }
  var adminUser = JSON.parse(raw);
  if (!adminUser.tenantSpreadsheetId) {
    throw new Error("Akun admin belum tersambung ke data tenant.");
  }
  return SpreadsheetApp.openById(adminUser.tenantSpreadsheetId);
}

/**
 * findTemplateCabangByName_: scan semua "cabang_<id>" di sheet admin, cari
 * yang namaLaundry-nya PERSIS sama. Balikin objek cabang APA ADANYA (belum
 * di-sanitize) supaya field/id mesin ikut apa adanya saat dikloning.
 */
function findTemplateCabangByName_(adminSheet, exactName) {
  var rows = readKeysByPrefix_(adminSheet, "cabang_");
  for (var i = 0; i < rows.length; i++) {
    var parsed;
    try { parsed = JSON.parse(rows[i].value); } catch (e) { continue; }
    var nama = parsed && parsed.profil ? parsed.profil.namaLaundry : "";
    if (String(nama || "").trim() === exactName) return parsed;
  }
  return null;
}

/**
 * cloneMasterOutlet_: salin SATU outlet template milik admin (beserta SELURUH
 * biayanya) jadi outlet baru milik tenant yang sedang aktif. Dipanggil dari
 * dalam withTenant_, jadi semua fungsi *_impl_ di bawah menulis ke tenant
 * yang benar tanpa perlu diberi tahu apa-apa.
 *
 * Semua nilai disalin APA ADANYA - tidak ada satu pun angka yang ditimpa,
 * termasuk sewa/gaji/harga gas (dulu ketiganya diisi user di layar Estimasi
 * Cepat yang sekarang sudah dihapus). Customer bebas mengedit sesudahnya
 * lewat layar biasa - hasil kloning ini outlet sungguhan, bukan contoh mati.
 */
function cloneMasterOutlet_(adminSs, adminSheet, templateName) {
  var templateCabang = findTemplateCabangByName_(adminSheet, templateName);
  if (!templateCabang || !templateCabang.id) {
    return { ok: false, error: "Template \"" + templateName + "\" belum ada di Profil Outlet akun admin.", stage: "cloneMasterOutlet_:template_not_found" };
  }
  var templateId = templateCabang.id;

  // 1) Cabang - salin apa adanya (mesin & id-nya ikut, cuma id cabang yang
  // diganti). createCabang_impl_ generate id baru sendiri.
  var cabangPayload = JSON.parse(JSON.stringify(templateCabang));
  delete cabangPayload.id;
  var cabangRes = createCabang_impl_(cabangPayload);
  if (!cabangRes || !cabangRes.ok) return cabangRes;
  var newCabangId = cabangRes.data.cabang.id;

  // 2) Gas (multi-record)
  readKeysByPrefix_(adminSheet, "biayaGas_").forEach(function (row) {
    var rec;
    try { rec = JSON.parse(row.value); } catch (e) { return; }
    if (rec.cabangId !== templateId) return;
    var payload = JSON.parse(JSON.stringify(rec));
    delete payload.id;
    payload.cabangId = newCabangId;
    createBiayaGas_impl_(payload);
  });

  // 3) Listrik (1 konfigurasi per cabang)
  var listrikRaw = readKey_(adminSheet, "biayaListrik_" + templateId);
  if (listrikRaw) {
    saveBiayaListrik_impl_(newCabangId, JSON.parse(listrikRaw));
  }

  // 4) Air (1 konfigurasi per cabang)
  var airRaw = readKey_(adminSheet, "biayaAir_" + templateId);
  if (airRaw) {
    saveBiayaAir_impl_(newCabangId, JSON.parse(airRaw));
  }

  // 5) Chemical (multi-record)
  readKeysByPrefix_(adminSheet, "biayaChemical_").forEach(function (row) {
    var rec;
    try { rec = JSON.parse(row.value); } catch (e) { return; }
    if (rec.cabangId !== templateId) return;
    var payload = JSON.parse(JSON.stringify(rec));
    delete payload.id;
    payload.cabangId = newCabangId;
    createBiayaChemical_impl_(payload);
  });

  // 6) Packing (multi-record)
  readKeysByPrefix_(adminSheet, "biayaPacking_").forEach(function (row) {
    var rec;
    try { rec = JSON.parse(row.value); } catch (e) { return; }
    if (rec.cabangId !== templateId) return;
    var payload = JSON.parse(JSON.stringify(rec));
    delete payload.id;
    payload.cabangId = newCabangId;
    createBiayaPacking_impl_(payload);
  });

  // 7) Nota/Kasir (sheet sendiri, 1 baris per cabang)
  var adminNotaSheet = adminSs.getSheetByName("BiayaNotaKasir");
  if (adminNotaSheet) {
    var notaRowIndex = findBiayaNotaKasirRowFast_(adminNotaSheet, templateId);
    if (notaRowIndex > 0) {
      var notaValues = adminNotaSheet.getRange(notaRowIndex, 1, 1, BIAYA_NOTA_KASIR_HEADERS_.length).getValues()[0];
      var notaObj = rowArrayToBiayaNotaKasirObject_(notaValues);
      saveBiayaNotaKasir_impl_(newCabangId, notaObj);
    }
  }

  // 8) Harga Layanan (1 konfigurasi per cabang)
  var hargaRaw = readKey_(adminSheet, "hargaLayanan_" + templateId);
  if (hargaRaw) {
    var hargaObj = JSON.parse(hargaRaw);
    saveHargaLayanan_impl_(newCabangId, {
      hargaJual: hargaObj.hargaJual || {},
      minimumOrderKg: hargaObj.minimumOrderKg || {},
    });
  }

  // 9) Biaya Tetap Outlet (sheet sendiri) - disalin PENUH termasuk sewa &
  // gaji. Depresiasi mesin ikut apa adanya (harga beli/residu/masa aus per
  // baris) - machineRefId-nya tetap cocok krn id mesin dipertahankan saat
  // kloning cabang di langkah 1, jadi tetap nyambung ke mesin outlet baru
  // ini tanpa perlu dipetakan ulang.
  var adminFcSheet = adminSs.getSheetByName(BIAYA_TETAP_SHEET_NAME_);
  if (adminFcSheet) {
    var fcRowIndex = findBiayaTetapRowFast_(adminFcSheet, templateId);
    if (fcRowIndex > 0) {
      var fcValues = adminFcSheet.getRange(fcRowIndex, 1, 1, BIAYA_TETAP_HEADERS_.length).getValues()[0];
      var fcObj = rowArrayToBiayaTetapObject_(fcValues);
      var fcPayload = {
        sewaPerTahun: Number(fcObj.sewaPerTahun) || 0,
        internetPerBulan: Number(fcObj.internetPerBulan) || 0,
        perawatanPerBulan: Number(fcObj.perawatanPerBulan) || 0,
        gajiRows: [],
        operasionalLainRows: [],
        depresiasiRows: [],
      };
      try { fcPayload.gajiRows = JSON.parse(fcObj.gajiRowsJson || "[]"); } catch (e) {}
      try { fcPayload.operasionalLainRows = JSON.parse(fcObj.operasionalLainRowsJson || "[]"); } catch (e) {}
      try { fcPayload.depresiasiRows = JSON.parse(fcObj.depresiasiRowsJson || "[]"); } catch (e) {}
      saveBiayaTetapOutlet_impl_(newCabangId, fcPayload);
    }
  }

  return { ok: true, data: { cabangId: newCabangId, namaLaundry: templateName } };
}

/**
 * readMasterSeedState_: baca catatan seeding milik tenant aktif. Kalau BELUM
 * ADA, keputusannya diambil SEKARANG & dicatat permanen:
 *   - tenant masih 0 outlet -> status "pending" (berhak dapat master bawaan)
 *   - tenant sudah punya outlet -> status "done" (data sendiri, jangan
 *     disentuh - berlaku juga utk akun admin yg justru sumber templatenya)
 * Sesudah tercatat, jumlah outlet TIDAK pernah diperiksa lagi.
 */
function readMasterSeedState_(sheet) {
  var raw = readKey_(sheet, KEY_MASTER_SEED_STATE_);
  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.done)) parsed.done = [];
      return parsed;
    } catch (e) {
      // Catatan rusak - perlakukan sbg sudah selesai supaya tidak ada
      // kloning berulang tak terduga di akun yang sudah dipakai.
      return { status: "done", done: [] };
    }
  }

  var punyaOutlet = readOrder_(sheet, KEY_CABANG_ORDER).length > 0;
  var state = {
    status: punyaOutlet ? "done" : "pending",
    done: [],
    decidedAt: new Date().toISOString(),
  };
  writeKey_(sheet, KEY_MASTER_SEED_STATE_, JSON.stringify(state));
  return state;
}

/**
 * getMasterSeedPlan: pemeriksaan MURAH (tidak mengkloning apa pun) - dipakai
 * client utk memutuskan perlu tidaknya menampilkan layar penyiapan SEBELUM
 * kloning pertama dimulai. Tanpa ini, akun yang ternyata tidak berhak di-seed
 * akan tetap melihat kedipan layar tunggu sesaat, dan akun yang berhak akan
 * diam ~10 detik tanpa penjelasan (kloning pertama sudah jalan duluan).
 * Panggilan ini juga yang MENETAPKAN keputusan permanen itu (readMasterSeedState_).
 */
function getMasterSeedPlan(sessionToken) {
  return withTenant_(sessionToken, function () {
    try {
      var state = readMasterSeedState_(ensureDataSheet_());
      return {
        ok: true,
        data: {
          pending: state.status !== "done",
          doneCount: state.done.length,
          total: MASTER_TEMPLATE_NAMES_.length,
        },
      };
    } catch (err) {
      return errorResponse_(err, "getMasterSeedPlan");
    }
  });
}

function seedNextMasterOutlet(sessionToken) {
  return withTenant_(sessionToken, function () {
    return seedNextMasterOutlet_impl_();
  });
}

/**
 * seedNextMasterOutlet_impl_: kloning SATU template yang belum dibuat, lalu
 * balas progresnya. Client memanggil berulang sampai finished true (lihat
 * maybeSeedMasterOutlets_, Script_Fitur_Dashboard.html).
 *
 * Template yang GAGAL dikloning (mis. admin mengganti nama outlet templatenya)
 * tetap dicatat sbg "sudah dikerjakan" supaya perulangan client pasti
 * berhenti - kegagalannya dilaporkan lewat field `errors`, tidak dilempar
 * sbg error yang menghentikan seluruh proses. Prinsipnya: customer lebih baik
 * masuk dgn 3 master + 1 catatan gagal daripada tertahan di layar tunggu.
 */
function seedNextMasterOutlet_impl_() {
  try {
    var sheet = ensureDataSheet_();
    var state = readMasterSeedState_(sheet);
    var total = MASTER_TEMPLATE_NAMES_.length;

    if (state.status === "done") {
      return { ok: true, data: { finished: true, doneCount: state.done.length, total: total, lastName: null, errors: [] } };
    }

    var nextName = null;
    for (var i = 0; i < MASTER_TEMPLATE_NAMES_.length; i++) {
      if (state.done.indexOf(MASTER_TEMPLATE_NAMES_[i]) === -1) {
        nextName = MASTER_TEMPLATE_NAMES_[i];
        break;
      }
    }

    if (!nextName) {
      state.status = "done";
      writeKey_(sheet, KEY_MASTER_SEED_STATE_, JSON.stringify(state));
      return { ok: true, data: { finished: true, doneCount: state.done.length, total: total, lastName: null, errors: [] } };
    }

    var errors = [];
    try {
      var adminSs = getAdminTenantSpreadsheet_();
      var adminSheet = adminSs.getSheetByName(DATA_SHEET_NAME);
      if (!adminSheet) throw new Error("Data template admin belum siap.");

      var res = cloneMasterOutlet_(adminSs, adminSheet, nextName);
      if (!res || !res.ok) {
        errors.push((res && res.error) ? res.error : ("Gagal menyalin " + nextName + "."));
      }
    } catch (cloneErr) {
      errors.push(cloneErr && cloneErr.message ? cloneErr.message : String(cloneErr));
    }

    state.done.push(nextName);
    if (state.done.length >= total) state.status = "done";
    writeKey_(sheet, KEY_MASTER_SEED_STATE_, JSON.stringify(state));

    return {
      ok: true,
      data: {
        finished: state.status === "done",
        doneCount: state.done.length,
        total: total,
        lastName: nextName,
        errors: errors,
      },
    };
  } catch (err) {
    return errorResponse_(err, "seedNextMasterOutlet");
  }
}
