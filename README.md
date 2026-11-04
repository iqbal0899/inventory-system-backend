# Inventory System

Aplikasi **Inventory Management System** berbasis web untuk mengelola produk, persediaan barang, pembelian, permintaan stok, supplier, dan aktivitas keluar-masuk stok secara terstruktur.

Aplikasi ini dikembangkan menggunakan React dan Vite pada sisi frontend serta Node.js, Express.js, Prisma ORM, dan PostgreSQL (Neon) pada sisi backend.

## Daftar Isi

- [Tentang Aplikasi](#tentang-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Role dan Hak Akses](#role-dan-hak-akses)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Integrasi dengan POS](#integrasi-dengan-pos)
- [Keamanan](#keamanan)
- [Pengembangan](#pengembangan)

## Tentang Aplikasi

Inventory System merupakan aplikasi pengelolaan persediaan barang yang dirancang untuk membantu bisnis mengontrol stok secara lebih efektif.

Aplikasi ini menyediakan pengelolaan data produk, pencatatan transaksi pembelian, pengelolaan supplier, pemantauan pergerakan stok, serta sistem permintaan stok yang dapat diintegrasikan dengan aplikasi Point of Sale (POS).

Sistem menggunakan role-based access control (RBAC) untuk membatasi akses pengguna berdasarkan hak dan tanggung jawab masing-masing.

## Fitur Utama

### 1. Dashboard

- Menampilkan ringkasan data inventory.
- Menampilkan jumlah produk.
- Memantau kondisi stok.
- Menampilkan produk dengan stok rendah.
- Menampilkan grafik pergerakan stok masuk dan keluar.
- Menyediakan pemantauan aktivitas inventory berdasarkan periode.

### 2. Manajemen Produk

- Menambahkan produk baru.
- Mengubah informasi produk.
- Mengelola kategori produk.
- Mengelola informasi supplier.
- Mengatur harga dan satuan produk.
- Mengaktifkan atau menonaktifkan produk.
- Mengelola gambar produk.
- Stok tidak dapat diubah langsung melalui form produk.

### 3. Manajemen Stok

- Mencatat stok masuk.
- Mencatat stok keluar.
- Melakukan penyesuaian stok.
- Menampilkan riwayat pergerakan stok.
- Memantau jumlah stok saat ini.
- Menyimpan informasi pengguna yang melakukan aktivitas stok.

### 4. Manajemen Pembelian

- Membuat transaksi pembelian barang.
- Memilih supplier.
- Menambahkan beberapa produk dalam satu pembelian.
- Menampilkan detail pembelian.
- Menerima barang dari supplier.
- Membatalkan pembelian.
- Menambahkan stok setelah barang diterima.
- Membatasi tindakan penerimaan dan pembatalan pembelian berdasarkan role pengguna.

### 5. Manajemen Permintaan Stok

- Membuat permintaan stok.
- Menampilkan daftar permintaan.
- Melihat detail permintaan.
- Menyetujui permintaan stok.
- Menolak permintaan stok.
- Menyelesaikan permintaan.
- Mengelola status permintaan.
- Mengurangi stok inventory ketika permintaan disetujui sesuai proses bisnis.

### 6. Manajemen Supplier

- Menambahkan supplier.
- Mengubah informasi supplier.
- Menampilkan daftar supplier.
- Menghubungkan supplier dengan produk dan pembelian.

### 7. Riwayat Aktivitas dan Audit

- Mencatat aktivitas pergerakan stok.
- Menampilkan riwayat stok masuk dan keluar.
- Menyimpan informasi pengguna yang melakukan perubahan.
- Membantu proses pemantauan aktivitas inventory.

### 8. Authentication dan Authorization

- Login dan logout.
- Autentikasi menggunakan JWT.
- Penyimpanan token menggunakan HTTP-only cookie.
- Pembatasan akses berdasarkan role.
- Validasi autentikasi pada endpoint yang dilindungi.
- Pembatasan percobaan login menggunakan rate limiter.

## Teknologi

### Frontend

| Teknologi | Kegunaan |
|---|---|
| React.js | Library UI |
| Vite | Development server dan build tool |
| JavaScript | Bahasa pemrograman |
| React Router DOM | Routing |
| Axios | HTTP client |
| CSS Modules | Styling komponen |
| Lucide React | Icon |
| Recharts | Visualisasi grafik |

### Backend

| Teknologi | Kegunaan |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| JavaScript ES Modules | Module system |
| Prisma ORM | Database ORM |
| Neon PostgreSQL | Database |
| JWT | Authentication |
| Bcrypt | Password hashing |
| Express Rate Limit | Request rate limiting |
| Helmet | HTTP security headers |

## Arsitektur Sistem

Aplikasi menggunakan arsitektur frontend dan backend yang terpisah.

```text
inventory-system/
│
├── inven-frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── css/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── inventory-server/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── prisma.config.ts
│   └── package.json
│
└── README.md
```

*Struktur di atas merupakan gambaran direktori utama dan dapat disesuaikan dengan struktur aktual repository.*

## Role dan Hak Akses

Aplikasi menggunakan tiga tingkatan role:

| Role | Hak Akses |
|---|---|
| SUPER_ADMIN | Memiliki akses penuh terhadap sistem |
| ADMIN | Mengelola operasional inventory dan melakukan tindakan administratif |
| STAFF | Mengakses fitur operasional sesuai izin yang diberikan |

Pembatasan akses dilakukan melalui middleware authorization pada backend dan pengaturan tampilan pada frontend.

**Catatan:** Validasi hak akses utama tetap dilakukan di backend, bukan hanya dengan menyembunyikan tombol pada frontend.

## Persyaratan

Pastikan perangkat sudah memiliki:

- Node.js
- npm
- Git
- Database PostgreSQL atau akun Neon
- Browser modern

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/iqbal0899/inventory-system.git

cd inventory-system
```

### 2. Instalasi Backend

```bash
cd inventory-server

npm install
```

### 3. Instalasi Frontend

Buka terminal baru:

```bash
cd inven-frontend

npm install
```

## Konfigurasi Environment

### Backend

Buat file `.env` pada direktori `inventory-server`.

```env
PORT=5100

DATABASE_URL="your_neon_database_connection_string"

JWT_SECRET="your_secure_jwt_secret"

NODE_ENV=development
```

Sesuaikan nama environment variable dengan konfigurasi yang digunakan pada source code backend.

### Frontend

Buat file `.env` pada direktori `inven-frontend`.

```env
VITE_API_URL=http://localhost:5100/api/v1
```

Pastikan konfigurasi Axios menggunakan environment variable tersebut.

**Penting:** Jangan mengunggah file `.env` yang berisi credential atau secret ke repository publik.

## Database

Aplikasi menggunakan Prisma ORM untuk mengelola database PostgreSQL.

Setelah mengatur koneksi database, jalankan perintah Prisma sesuai konfigurasi proyek.

```bash
npx prisma generate
```

Untuk menerapkan migration yang sudah tersedia:

```bash
npx prisma migrate deploy
```

Untuk pengembangan lokal, migration baru dapat dibuat menggunakan:

```bash
npx prisma migrate dev --name nama_migration
```

Jalankan proses seed apabila konfigurasi seed sudah tersedia pada proyek.

## Menjalankan Aplikasi

### Backend

```bash
cd inventory-server

npm run dev
```

Backend berjalan pada:

```text
http://localhost:5100
```

### Frontend

```bash
cd inven-frontend

npm run dev
```

Frontend berjalan pada:

```text
http://localhost:4000
```

Pastikan frontend dan backend berjalan bersamaan.

## Integrasi dengan POS

Inventory System dirancang agar dapat terintegrasi dengan aplikasi Point of Sale (POS).

Gambaran alur integrasi:

```text
       POS Application
              |
              |
       Membuat Permintaan
              |
              v
       Inventory System
              |
              |
       Admin Review Request
              |
              v
       Approve Permintaan
              |
              |
       Stok Inventory Berkurang
              |
              v
       Pengiriman Data Produk
              |
              v
       POS Menerima Produk
              |
              |
       Stok POS Bertambah
```

Integrasi antaraplikasi menggunakan komunikasi API dengan mekanisme autentikasi dan validasi data.

Informasi permintaan seperti request ID dan request number digunakan untuk menghubungkan proses transaksi antar sistem.

## Keamanan

Beberapa mekanisme keamanan yang diterapkan atau dikembangkan pada aplikasi:

- Password disimpan menggunakan hashing Bcrypt.
- Autentikasi menggunakan JWT.
- Token autentikasi disimpan dalam HTTP-only cookie.
- Authorization berdasarkan role pengguna.
- Rate limiting untuk membatasi percobaan login.
- Penguncian login setelah batas kegagalan tercapai.
- Reset rate limit berdasarkan username melalui endpoint khusus.
- HTTP security headers menggunakan Helmet.
- Validasi input pada backend.
- Pembatasan akses endpoint berdasarkan autentikasi dan otorisasi.

## Pengembangan

Aplikasi ini dikembangkan sebagai proyek pengelolaan inventory dengan fokus pada:

- Pengelolaan stok yang terstruktur.
- Pemantauan pergerakan barang.
- Pengelolaan pembelian dan supplier.
- Pengaturan hak akses pengguna.
- Integrasi sistem inventory dengan aplikasi POS.
- Penerapan praktik keamanan pada aplikasi web.

## Author

**Muhammad Iqbal**

Full-Stack Developer

GitHub: [@iqbal0899](https://github.com/iqbal0899)

---

© 2026 Inventory System. All Rights Reserved.
