# Sistem Absensi Karyawan Harian Lepas

Sistem absensi berbasis web untuk karyawan harian lepas, terhubung ke Google Sheets via Google Apps Script.

## File

| File | Keterangan |
|------|-----------|
| `apps-script.gs` | Kode Google Apps Script (backend/database) |
| `admin-dashboard.html` | Halaman dashboard admin (dilindungi password) |
| `absen-karyawan.html` | Halaman absen untuk karyawan |

## Cara Setup

### 1. Setup Google Apps Script
1. Buka [script.google.com](https://script.google.com)
2. Buat project baru → hapus kode default
3. Copy-paste isi file `apps-script.gs`
4. Klik **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Klik **Deploy** → izinkan akses → **copy URL deployment**

### 2. Setup Dashboard Admin
1. Buka `admin-dashboard.html` di browser
2. Login dengan password default: `admin1234`
3. Buka tab **🔗 Setup** → paste URL Apps Script → klik **Hubungkan**
4. Mulai tambah karyawan di tab **⚙️ Karyawan**

### 3. Bagikan ke Karyawan
1. Upload `absen-karyawan.html` ke GitHub Pages atau hosting
2. Bagikan link ke karyawan via WhatsApp
3. Karyawan buka link → pilih nama → absen

## Alur Penggunaan

**Karyawan:**
- Buka halaman absen → pilih nama → pilih status → kirim
- Jika status Hadir → muncul tombol "Absen Keluar" saat pulang

**Admin:**
- Dashboard otomatis sync data dari Google Sheets
- Tab Harian: lihat absensi hari ini, catat jam keluar manual
- Tab Laporan: rekap per karyawan per bulan + slip gaji PDF
- Tab Input Manual: input lembur, koreksi, atau karyawan tanpa HP

## Password Default
- Password admin: `admin1234`
- Ganti password: klik "Ganti password?" di halaman login

## Catatan
- Setiap update Apps Script → Deploy ulang sebagai New Version
- Data tersimpan di Google Sheets (Sheet: Absensi & Karyawan)
