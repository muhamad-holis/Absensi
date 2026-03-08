// ============================================================
// GOOGLE APPS SCRIPT — Sistem Absensi Karyawan Harian Lepas
// ============================================================
// CARA PASANG:
// 1. Buka script.google.com
// 2. Buat project baru → hapus kode default
// 3. Copy-paste seluruh kode ini
// 4. Klik Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy URL deployment → paste di dashboard admin & halaman absen
// ============================================================

const SPREADSHEET_ID = ''; // Kosongkan — akan dibuat otomatis
const SHEET_ABSENSI  = 'Absensi';
const SHEET_KARYAWAN = 'Karyawan';

// ============================================================
// MAIN HANDLER
// ============================================================

function doGet(e) {
  const action = e.parameter.action || '';
  
  try {
    if (action === 'getKaryawan')   return jsonResponse(getKaryawan());
    if (action === 'getAbsensi')    return jsonResponse(getAbsensi(e.parameter));
    if (action === 'ping')          return jsonResponse({ status: 'ok', message: 'Terhubung!' });
    return jsonResponse({ error: 'Action tidak dikenal' });
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || '';
    
    if (action === 'tambahKaryawan')  return jsonResponse(tambahKaryawan(data));
    if (action === 'hapusKaryawan')   return jsonResponse(hapusKaryawan(data));
    if (action === 'tambahAbsensi')   return jsonResponse(tambahAbsensi(data));
    if (action === 'hapusAbsensi')    return jsonResponse(hapusAbsensi(data));
    if (action === 'updateKeluar')    return jsonResponse(updateKeluar(data));
    
    return jsonResponse({ error: 'Action tidak dikenal' });
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

// ============================================================
// HELPER — Spreadsheet
// ============================================================

function getSpreadsheet() {
  // Cek apakah sudah ada spreadsheet ID tersimpan
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');
  
  if (!ssId) {
    // Buat spreadsheet baru
    const ss = SpreadsheetApp.create('📋 Rekap Absensi Karyawan Harian Lepas');
    ssId = ss.getId();
    props.setProperty('SPREADSHEET_ID', ssId);
    
    // Setup sheet Absensi
    const sheetAbsensi = ss.getActiveSheet();
    sheetAbsensi.setName(SHEET_ABSENSI);
    sheetAbsensi.getRange(1,1,1,10).setValues([[
      'ID','Timestamp','Nama','Tanggal','Status','Jam Masuk','Jam Keluar','Lembur (jam)','Catatan','Foto'
    ]]);
    sheetAbsensi.getRange(1,1,1,10).setFontWeight('bold').setBackground('#1a3a2a').setFontColor('#ffffff');
    
    // Setup sheet Karyawan
    const sheetKaryawan = ss.insertSheet(SHEET_KARYAWAN);
    sheetKaryawan.getRange(1,1,1,5).setValues([[
      'ID','Nama','Jabatan','Upah/Hari','No HP'
    ]]);
    sheetKaryawan.getRange(1,1,1,5).setFontWeight('bold').setBackground('#1a3a2a').setFontColor('#ffffff');
    
    Logger.log('Spreadsheet baru dibuat: ' + ss.getUrl());
  }
  
  return SpreadsheetApp.openById(ssId);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// KARYAWAN
// ============================================================

function getKaryawan() {
  const sheet = getSheet(SHEET_KARYAWAN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { karyawan: [] };
  
  const karyawan = rows.slice(1).map(r => ({
    id:      r[0],
    nama:    r[1],
    jabatan: r[2],
    upah:    r[3],
    hp:      r[4]
  })).filter(k => k.nama);
  
  return { karyawan };
}

function tambahKaryawan(data) {
  const sheet = getSheet(SHEET_KARYAWAN);
  const id = Date.now();
  const timestamp = new Date().toLocaleString('id-ID');
  
  // Cek duplikat nama
  const rows = sheet.getDataRange().getValues();
  const sudahAda = rows.slice(1).some(r => 
    r[1] && r[1].toString().toLowerCase() === data.nama.toLowerCase()
  );
  if (sudahAda) return { error: 'Nama karyawan sudah ada!' };
  
  sheet.appendRow([id, data.nama, data.jabatan || 'Harian Lepas', data.upah || 100000, data.hp || '']);
  
  return { success: true, message: `Karyawan ${data.nama} berhasil ditambahkan`, id };
}

function hapusKaryawan(data) {
  const sheet = getSheet(SHEET_KARYAWAN);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Karyawan dihapus' };
    }
  }
  return { error: 'Karyawan tidak ditemukan' };
}

// ============================================================
// ABSENSI
// ============================================================

function getAbsensi(params) {
  const sheet = getSheet(SHEET_ABSENSI);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { absensi: [] };
  
  let absensi = rows.slice(1).map(r => ({
    id:        r[0],
    timestamp: r[1],
    nama:      r[2],
    tanggal:   r[3] instanceof Date ? Utilities.formatDate(r[3], 'Asia/Jakarta', 'yyyy-MM-dd') : r[3],
    status:    r[4],
    masuk:     r[5],
    keluar:    r[6],
    lemburJam: r[7] || 0,
    catatan:   r[8] || '',
    foto:      r[9] || ''
  })).filter(a => a.nama);
  
  // Filter by tanggal if provided
  if (params.tanggal) {
    absensi = absensi.filter(a => a.tanggal === params.tanggal);
  }
  // Filter by bulan if provided (format: yyyy-MM)
  if (params.bulan) {
    absensi = absensi.filter(a => a.tanggal && a.tanggal.startsWith(params.bulan));
  }
  
  return { absensi };
}

function tambahAbsensi(data) {
  const sheet = getSheet(SHEET_ABSENSI);
  
  // Cek duplikat (nama + tanggal)
  const rows = sheet.getDataRange().getValues();
  const sudahAbsen = rows.slice(1).some(r => {
    const tgl = r[3] instanceof Date ? Utilities.formatDate(r[3], 'Asia/Jakarta', 'yyyy-MM-dd') : r[3];
    return r[2] === data.nama && tgl === data.tanggal;
  });
  
  if (sudahAbsen) return { error: `${data.nama} sudah absen di tanggal ${data.tanggal}` };
  
  const id = Date.now();
  const timestamp = new Date().toLocaleString('id-ID');
  
  sheet.appendRow([
    id,
    timestamp,
    data.nama,
    data.tanggal,
    data.status,
    data.masuk || '-',
    data.keluar || '-',
    data.lemburJam || 0,
    data.catatan || '',
    data.foto || ''
  ]);
  
  return { success: true, message: `Absensi ${data.nama} berhasil disimpan`, id };
}

function hapusAbsensi(data) {
  const sheet = getSheet(SHEET_ABSENSI);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Data tidak ditemukan' };
}

function updateKeluar(data) {
  const sheet = getSheet(SHEET_ABSENSI);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    const tgl = rows[i][3] instanceof Date 
      ? Utilities.formatDate(rows[i][3], 'Asia/Jakarta', 'yyyy-MM-dd') 
      : rows[i][3];
    if (rows[i][2] === data.nama && tgl === data.tanggal) {
      // Kolom G (index 6) = Jam Keluar
      sheet.getRange(i + 1, 7).setValue(data.keluar);
      return { success: true, message: `Jam keluar ${data.nama} diperbarui: ${data.keluar}` };
    }
  }
  return { error: 'Data absensi tidak ditemukan' };
}

// ============================================================
// TEST FUNCTION (jalankan manual untuk test)
// ============================================================
function testSetup() {
  const ss = getSpreadsheet();
  Logger.log('✅ Spreadsheet URL: ' + ss.getUrl());
  Logger.log('✅ Sheet Absensi: ' + getSheet(SHEET_ABSENSI).getName());
  Logger.log('✅ Sheet Karyawan: ' + getSheet(SHEET_KARYAWAN).getName());
  Logger.log('✅ Setup berhasil!');
}
