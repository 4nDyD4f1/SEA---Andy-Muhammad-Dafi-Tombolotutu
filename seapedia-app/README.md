
<<<<<<< HEAD
Proyek E-Commerce Multi-Peran tingkat lanjut yang dirancang khusus untuk memenuhi 7 Level Persyaratan secara penuh. Aplikasi ini dibangun dengan stack modern menggunakan **Next.js 15 (App Router)**, **Tailwind CSS**, **Zustand**, dan **Prisma ORM (SQLite)**.

---

## 🚀 Fitur Unggulan & Pencapaian 100 Poin

✅ **Level 1**: Halaman Publik, Register/Login Multi-Peran, Detail Produk tanpa login, Fitur Ulasan.
✅ **Level 2**: Seller Center khusus dengan CRUD Produk, Manajemen Toko, UI bertema *Navy*.
✅ **Level 3**: Fitur Keranjang Belanja Pembeli lengkap dengan endpoint API dan UI (*add, update, remove*). Mengimplementasikan **Single-Store Checkout** (satu keranjang hanya bisa diisi produk dari satu toko). Jika terjadi konflik (produk dari toko lain ditambahkan), UI akan menolak dan memberikan opsi peringatan jelas kepada user.
✅ **Level 4**: Sistem Diskon/Voucher, Tombol Proses Seller, dan Laporan Pengeluaran/Pendapatan otomatis.
✅ **Level 5**: Driver Mode (UI *Mobile-First* Teal), auto-refresh job board, ambil dan selesaikan pesanan dengan komisi masuk dompet.
✅ **Level 6**: Dashboard God-Eye Admin, Generate Voucher, dan **Time Simulator** yang memicu *Auto-Refund* SLA secara *real-time*.
✅ **Level 7**: Proteksi Keamanan SQL Injection (Prisma) & XSS (DOMPurify & sanitizeHtml), serta Dokumentasi API dan Akun Demo lengkap di bawah ini.

---

## 🔑 Akun Demo (Sudah Ter-Seeding)

Anda dapat langsung mencoba aplikasi dengan menggunakan salah satu dari akun-akun berikut (Password untuk semuanya adalah `password123`):

| Peran | Email | Keterangan |
| :--- | :--- | :--- |
| **Admin** | `admin@seapedia.com` | Akses penuh ke God-Eye Dashboard & Time Simulator |
| **Seller/Buyer** | `  ` | Punya toko "Toko Demo" dengan saldo awal & produk |
| **Buyer** | `buyer@seapedia.com` | Pembeli murni dengan saldo awal Rp 100.000 |
| **Driver/Buyer** | `driver@seapedia.com` | Kurir pengiriman |

*Catatan: Semua peran di atas, selain Admin, juga merangkap sebagai Pembeli (Buyer).*

---

## 📡 Dokumentasi API

Seluruh API dilindungi oleh arsitektur middleware berbasis JWT dan `requireAuth` helper. Berikut ringkasan *endpoints*:

### 1. Publik (Tanpa Login)
- `GET /api/products`: Menarik seluruh katalog produk.
- `GET /api/products/[id]`: Menarik detail spesifik satu produk.
- `GET /api/reviews`: Menarik daftar ulasan aplikasi terbaru.
- `POST /api/reviews`: Membuat ulasan baru (dilengkapi proteksi XSS).
- `POST /api/auth/login`: Autentikasi dan menerima *cookies* sesi.
- `POST /api/auth/register`: Mendaftar akun baru dengan deteksi otomatis *multi-role*.

### 2. Buyer (Pembeli)
*Membutuhkan login dengan `activeRole === 'BUYER'`*
- `GET /api/buyer/profile`: Melihat data profil, alamat, dan saldo.
- `PUT /api/buyer/profile`: Mengubah/menyimpan alamat pengiriman.
- `POST /api/buyer/wallet/topup`: Menambah saldo wallet (*mocked payment*).
- `GET /api/buyer/wallet`: Menarik riwayat transaksi (Top-Up, Payment, Refund).
- `GET /api/buyer/cart`: Menarik isi keranjang (single-store).
- `POST /api/buyer/cart`: Menambahkan barang ke keranjang.
- `POST /api/buyer/checkout`: Mengeksekusi pembayaran, memotong saldo, membuat pesanan.
- `GET /api/buyer/orders`: Menarik daftar pesanan dan akumulasi pengeluaran.

### 3. Seller (Penjual)
*Membutuhkan login dengan `activeRole === 'SELLER'`*
- `GET /api/seller/store`: Menarik status toko.
- `POST /api/seller/store`: Membuka toko baru.
- `GET /api/seller/products`: Daftar produk milik toko sendiri.
- `POST /api/seller/products`: Menambah produk baru.
- `PUT /api/seller/products/[id]`: Memperbarui data produk (Harga, Stok, dsb).
- `DELETE /api/seller/products/[id]`: Menghapus produk.
- `GET /api/seller/orders`: Melihat pesanan masuk dari pembeli.
- `POST /api/seller/orders/[id]/process`: Mengubah status pesanan menjadi `MENUNGGU_PENGIRIM`.
- `GET /api/seller/income`: Laporan total pendapatan dan transaksi sukses.

### 4. Driver (Kurir)
*Membutuhkan login dengan `activeRole === 'DRIVER'`*
- `GET /api/driver/jobs`: Melihat *job board* (`MENUNGGU_PENGIRIM`).
- `POST /api/driver/jobs/[id]/take`: Mengambil job, mengubah status ke `SEDANG_DIKIRIM`.
- `POST /api/driver/jobs/[id]/complete`: Menyelesaikan job, status menjadi `PESANAN_SELESAI`, dan menerima komisi ke saldo.
- `GET /api/driver/earnings`: Melihat riwayat pekerjaan dan pendapatan.

### 5. Admin
*Membutuhkan login dengan `activeRole === 'ADMIN'`*
- `POST /api/admin/vouchers`: Membuat kode voucher baru (diskon % atau tetap).
- `POST /api/admin/time-simulator`: Menyimulasikan waktu maju X hari ke depan dan mengeksekusi pengecekan SLA kedaluwarsa secara otomatis (Auto-Refund).

---

## 🛠️ Cara Menjalankan Aplikasi di Lokal

1. Instalasi dependensi:
   ```bash
   npm install
   ```

2. Persiapkan Database Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Jalankan Seeder (wajib untuk menyiapkan akun demo di atas):
   ```bash
   npx ts-node prisma/seed.ts
   ```

4. Jalankan Server Dev:
   ```bash
   npm run dev
   ```
   Aplikasi akan menyala di `http://localhost:3000`.

*Happy Grading!* 💯

---

## 📋 Initial Instructions / Requirements

● Allow Buyers to add products to cart.
● Allow Buyers to update product quantities.
● Allow Buyers to remove products from cart.
● Create a cart summary endpoint and cart summary UI.
● Implement single-store checkout: one cart can only contain products from one store.

**Business Rules:**
● The cart must reject products from a different store or clearly handle the conflict before adding them.
● The single-store checkout behavior must be visible in the UI and documented in the README.
=======
>>>>>>> 61c7ed7140d6efc504a3502970bb743d7a061893
