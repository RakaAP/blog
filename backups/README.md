# Panduan Backup & Rollback Sistem (Frontend, Backend, & Database)

Dokumen ini berisi informasi mengenai data cadangan (backup) dan instruksi langkah-demi-langkah untuk melakukan **rollback** (pemulihan) ke kondisi stabil saat ini.

---

## 📌 Rincian Backup
- **Waktu Backup:** 26 Oktober 2026 (16:21 WIB)
- **Komponen Backend:** Spring Boot 4, JPA/Hibernate, Spring Security JWT, Flyway Migrations, REST API Controllers & Services.
- **Komponen Frontend:** React 19 + Vite, UI Glassmorphism modern, routing modul (About, Projects, Blog, Career, Research, Contact, Admin).
- **Komponen Basis Data:** PostgreSQL (`personalBlog`) berisi tabel `users`, `author_profile`, `posts`, `projects`, `careers`, `site_settings`, dan riwayat migrasi `flyway_schema_history`.
- **Git Commit / Tag:** Tag `v1.0.0-stable` pada branch `main`.

---

## 🗂️ Struktur File Backup

```text
blog/
├── backups/
│   ├── README.md                              <- Panduan ini
│   ├── db/
│   │   └── personalBlog_dump_20261026.sql     <- Dump basis data lengkap PostgreSQL
│   ├── archive/
│   │   └── blog_source_backup_20261026.tar.gz <- Arsip kode sumber frontend & backend (3.8MB)
│   └── scripts/
│       └── restore_db.sh                      <- Skrip otomatis rollback database PostgreSQL
```

---

## 🔄 Cara Melakukan Rollback

### Cara 1: Rollback Kode Menggunakan Git (Paling Cepat & Direkomendasikan)
Jika Anda melakukan perubahan kode dan ingin mengembalikan semua file ke versi backup ini:

1. **Batalkan semua perubahan file yang belum di-commit:**
   ```bash
   git restore .
   git clean -fd
   ```

2. **Atau kembali ke titik tag stabil (`v1.0.0-stable`):**
   ```bash
   git checkout v1.0.0-stable
   ```

3. **Jika ingin memaksa branch `main` kembali ke titik backup ini:**
   ```bash
   git reset --hard v1.0.0-stable
   ```

---

### Cara 2: Rollback Basis Data PostgreSQL (Data Master & Konfigurasi)
Jika data di database berubah, terhapus, atau corrupt, jalankan skrip otomatis yang sudah disiapkan:

```bash
./backups/scripts/restore_db.sh
```

Atau jalankan perintah `psql` manual:
```bash
PGPASSWORD='Admin*123' psql -h localhost -p 5432 -U admin -d personalBlog -f backups/db/personalBlog_dump_20261026.sql
```

---

### Cara 3: Rollback Kode dari Arsip Standalone (`.tar.gz`)
Jika folder `.git` rusak atau Anda ingin memulihkan kode secara terpisah di direktori lain:

1. Masuk ke direktori root proyek:
   ```bash
   cd /Users/rakandp/github/blog
   ```

2. Ekstrak arsip:
   ```bash
   tar -xzf backups/archive/blog_source_backup_20261026.tar.gz
   ```

3. Pasang dependensi frontend jika diperlukan:
   ```bash
   cd frontend && npm install
   ```

---

## 🚀 Memverifikasi Aplikasi Setelah Rollback

1. **Jalankan Backend Spring Boot:**
   ```bash
   ./mvnw spring-boot:run
   ```
2. **Jalankan Frontend React (Vite):**
   ```bash
   cd frontend && npm run dev
   ```
3. Akses aplikasi di browser pada:
   - Web App: `http://localhost:5173`
   - Backend API: `http://localhost:8080/api/profile`
