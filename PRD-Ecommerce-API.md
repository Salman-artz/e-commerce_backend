# Product Requirements Document (PRD)
# E-Commerce API (Skala Kecil)

**Versi:** 1.0
**Penulis:** Putra
**Tanggal:** Juli 2026
**Status:** Draft — untuk proyek portofolio

---

## 1. Latar Belakang & Tujuan

### 1.1 Latar Belakang
E-commerce adalah salah satu studi kasus backend paling populer karena melibatkan banyak edge case nyata: manajemen stok, transaksi pembayaran, concurrency, dan keamanan data. Proyek ini membangun backend API e-commerce skala kecil yang mencakup alur inti dari toko online: mulai dari katalog produk hingga checkout dan pembayaran.

### 1.2 Tujuan Proyek
- Menunjukkan kemampuan mendesain sistem transaksional yang aman (mencegah race condition pada stok).
- Mendemonstrasikan integrasi payment gateway pihak ketiga.
- Menunjukkan penanganan data relasional untuk kebutuhan bisnis nyata (produk, order, pembayaran).
- Menghasilkan portofolio yang relevan karena e-commerce adalah domain umum di industri.

### 1.3 Target Pengguna
- Buyer: pengguna yang membeli produk
- Seller/Admin: pengguna yang mengelola produk & pesanan
- Digunakan sebagai studi kasus portofolio, dengan skala kecil-menengah (bukan multi-tenant marketplace besar)

---

## 2. Ruang Lingkup (Scope)

### 2.1 In-Scope (MVP)
- Manajemen produk (CRUD, kategori, stok)
- Shopping cart
- Order management dengan status lifecycle
- Payment gateway integration (Midtrans/Xendit) + webhook
- Manajemen stok dengan transaction-safe (anti race condition)
- Search & filter produk dengan pagination
- Upload gambar produk ke cloud storage
- Role: admin (seller) dan customer (buyer)

### 2.2 Out of Scope (untuk versi awal)
- Multi-seller/marketplace (banyak toko dalam satu platform)
- Sistem review & rating produk (nice-to-have, opsional)
- Sistem diskon/voucher kompleks
- Shipping API integration (bisa disimulasikan manual dulu)
- Aplikasi frontend/mobile

---

## 3. Peran & Hak Akses (Roles & Permissions)

| Role | Deskripsi | Hak Akses Utama |
|---|---|---|
| **Admin** | Pengelola toko | Kelola produk, kategori, lihat & update semua order |
| **Customer** | Pembeli | Browse produk, kelola cart, checkout, lihat order sendiri |

---

## 4. Functional Requirements

### 4.1 Autentikasi & User Management
- Register, login, logout (customer & admin)
- JWT access token + refresh token
- Update profil & alamat pengiriman

### 4.2 Manajemen Produk (Admin)
- CRUD produk: nama, deskripsi, harga, stok, kategori, gambar
- Manajemen kategori produk
- Upload gambar produk (multiple images per produk)
- Set status produk: `active`, `out_of_stock`, `discontinued`

### 4.3 Katalog Produk (Customer)
- List produk dengan pagination
- Search produk berdasarkan nama
- Filter berdasarkan kategori, rentang harga
- Detail produk

### 4.4 Shopping Cart
- Tambah/hapus/update qty item di cart
- Cart tersimpan per user (persistent, bukan session-only)
- Validasi stok saat menambah ke cart

### 4.5 Checkout & Order
- Checkout dari cart → buat order
- Order memiliki status: `pending`, `paid`, `processing`, `shipped`, `completed`, `cancelled`
- **Stock deduction menggunakan database transaction** untuk mencegah overselling saat concurrent checkout
- Snapshot harga produk saat order dibuat (harga tidak berubah meski produk diedit setelahnya)
- Riwayat order per customer

### 4.6 Payment Integration
- Integrasi payment gateway (Midtrans atau Xendit — mendukung metode pembayaran Indonesia: VA, e-wallet, QRIS)
- Webhook handler untuk update status pembayaran otomatis
- Auto-cancel order jika pembayaran tidak selesai dalam batas waktu (misal 24 jam) — bisa pakai cron job/queue

### 4.7 Admin Order Management
- Lihat semua order masuk
- Update status order (`processing` → `shipped` → `completed`)
- Filter order berdasarkan status/tanggal

---

## 5. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Security** | Password hashing (bcrypt), validasi input, proteksi terhadap race condition pada stok, webhook signature verification |
| **Data Integrity** | Semua operasi stok & order menggunakan database transaction (ACID) |
| **Performance** | Endpoint katalog produk dioptimasi dengan indexing & pagination, response time < 300ms |
| **Scalability** | Desain skema mendukung penambahan kategori/produk tanpa migrasi besar |
| **Dokumentasi** | API terdokumentasi lengkap via Swagger/OpenAPI |

---

## 6. Data Model (Ringkasan Entitas)

```
User (id, name, email, password_hash, role, created_at)
Address (id, user_id, recipient_name, phone, full_address, is_default)
Category (id, name)
Product (id, name, description, price, stock, category_id, status, created_at)
ProductImage (id, product_id, image_url)
Cart (id, user_id)
CartItem (id, cart_id, product_id, quantity)
Order (id, user_id, address_id, status, total_amount, created_at)
OrderItem (id, order_id, product_id, product_name_snapshot, price_snapshot, quantity)
Payment (id, order_id, method, status, gateway_reference, paid_at)
```

**Relasi kunci:**
- 1 User → banyak Order
- 1 Order → banyak OrderItem (snapshot produk & harga saat itu)
- 1 Order → 1 Payment
- 1 Cart → banyak CartItem

---

## 7. Contoh Endpoint API (Ringkas)

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh-token

GET    /products?category=&search=&minPrice=&maxPrice=&page=
GET    /products/:id
POST   /products              (admin)
PATCH  /products/:id          (admin)
DELETE /products/:id          (admin)

GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id

POST   /checkout               -> create order dari cart
GET    /orders                 (riwayat order milik user)
GET    /orders/:id
PATCH  /orders/:id/status      (admin)

POST   /payments/webhook       (dipanggil oleh payment gateway)
GET    /payments/:orderId/status
```

---

## 8. Tech Stack yang Disarankan

| Layer | Teknologi |
|---|---|
| Runtime | Node.js + Express.js / TypeScript |
| Database | PostgreSQL (dukungan transaction kuat) |
| ORM | Prisma / TypeORM |
| Payment Gateway | Midtrans atau Xendit |
| File storage | Cloudinary / AWS S3 |
| Queue (untuk auto-cancel order) | BullMQ + Redis (opsional, bisa juga pakai cron sederhana) |
| Dokumentasi API | Swagger (OpenAPI) |
| Deployment | Railway / Render |
| Testing | Jest + Supertest |

---

## 9. Success Metrics (untuk Portofolio)

- API terdeploy live, bisa diuji end-to-end (register → browse produk → checkout → bayar via sandbox payment gateway)
- Uji simulasi race condition pada stok (misal 2 request checkout bersamaan tidak membuat stok minus)
- Dokumentasi lengkap (README + ERD + Swagger + Postman collection)
- Video/gif demo alur checkout untuk ditampilkan di portofolio

---

## 10. Milestone & Estimasi Waktu

| Fase | Deliverable | Estimasi |
|---|---|---|
| 1 | Setup project, auth, database schema | 3 hari |
| 2 | CRUD produk & kategori + upload gambar | 3–4 hari |
| 3 | Cart & checkout logic + transaction-safe stock | 4–5 hari |
| 4 | Integrasi payment gateway + webhook | 3–4 hari |
| 5 | Admin order management | 2 hari |
| 6 | Testing, dokumentasi, deployment | 3–4 hari |
| **Total** | | **~3–3.5 minggu** |
