# E-Commerce API

Backend API untuk studi kasus e-commerce skala kecil, dibangun dengan Node.js, Express, TypeScript, Prisma, dan MySQL.

## Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- MySQL
- Zod validation
- Swagger UI untuk dokumentasi API

## Fitur Utama

- Auth JWT access token + refresh token
- Role admin dan customer
- CRUD kategori dan produk
- Search/filter produk dengan pagination
- Cart persistent per user
- Checkout dengan transaction-safe stock deduction
- Order management dan payment webhook
- Auto-cancel order pending yang lewat 24 jam
- OpenAPI docs

## Instalasi

1. Install dependency.

```bash
npm install
```

2. Salin konfigurasi environment.

```bash
copy .env.example .env
```

3. Sesuaikan `.env` untuk database MySQL, secret JWT, dan `CORS_ORIGIN`.

## Konfigurasi Environment

- `NODE_ENV`
- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `PAYMENT_WEBHOOK_SECRET`
- `MIDTRANS_WEBHOOK_SECRET`
- `XENDIT_WEBHOOK_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Setup Database

Buat database MySQL terlebih dulu:

```bash
npm run db:create
```

Lalu jalankan migration:

```bash
npm run prisma:migrate:deploy
```

Jika ingin seed data dummy:

```bash
npm run db:seed
```

## Menjalankan Aplikasi

Mode development:

```bash
npm run dev
```

Mode production:

```bash
npm run build
npm start
```

## Menjalankan Test

```bash
npm test
```

## Dokumentasi API

Setelah aplikasi berjalan, buka:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## Endpoint Penting

- `GET /health`
- `GET /api/health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `GET /auth/me`
- `PATCH /auth/me`
- `GET /categories`
- `POST /categories`
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`
- `POST /products/:id/images`
- `GET /addresses`
- `POST /addresses`
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `POST /checkout`
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `PATCH /orders/:id/status`
- `POST /payments/webhook`
- `GET /payments/:orderId/status`

## Catatan Seed

Data dummy yang tersedia setelah seeding:

- Admin: `admin@ecommerce.test`
- Customer: `buyer1@ecommerce.test`
- Customer: `buyer2@ecommerce.test`

Password seed: `Admin12345!` untuk admin, `Customer12345!` untuk customer.