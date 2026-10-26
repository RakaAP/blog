# Personal Blog & Portfolio - Fullstack Modular Architecture

Aplikasi website portofolio, riset, blog, dan Content Management System (CMS) modern dengan backend **Java 21 Spring Boot 4**, database **PostgreSQL**, dan frontend **React 19 + Vite**.

---

## 🗄️ Konfigurasi Database PostgreSQL

Sesuai permintaan konfigurasi:
- **Database Name**: `personalBlog`
- **Username**: `admin`
- **Password**: `Admin*123`
- **Host**: `localhost:5432`

### Opsi 1: PostgreSQL Lokal (Homebrew / Native)
Database `personalBlog` dan user `admin` sudah dibuat dan dikonfigurasi di PostgreSQL lokal.

### Opsi 2: Menggunakan Docker
Tersedia file `docker-compose.yml` jika ingin menjalankan PostgreSQL melalui kontainer Docker:
```bash
docker compose up -d
```

---

## 🚀 Menjalankan Aplikasi

### 1. Menjalankan Backend (Spring Boot)
Di direktori utama project (`/Users/rakandp/github/blog`):
```bash
./mvnw spring-boot:run
```
Backend akan berjalan pada port **8080**:
- API URL: `http://localhost:8080/api`
- Health check: `http://localhost:8080/api/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- Actuator: `http://localhost:8080/actuator/health`

### 2. Menjalankan Frontend (React)
Buka terminal baru di direktori `frontend`:
```bash
cd frontend
npm run dev
```
Frontend akan berjalan pada port **5173**:
- Web UI: `http://localhost:5173`

---

## 🔐 Autentikasi Admin

Login menggunakan endpoint `/api/auth/login` dengan kredensial:
- **Username**: `admin`
- **Password**: `Admin*123`

Sistem menggunakan **JWT standar HMAC-SHA256** (expire 24 jam). Token dikirim di header:
```
Authorization: Bearer <jwt-token>
```

---

## 🛡️ Rate Limiting

API dilindungi dengan rate limiter in-memory:
- **Batas**: 180 request/menit per IP
- **Response**: HTTP `429 Too Many Requests` jika melebihi batas
- **Header**: `X-RateLimit-Limit` dan `X-RateLimit-Remaining`

---

## 📡 API Endpoints

### 1. System & Auth
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Cek status server dan koneksi ke PostgreSQL |
| `POST` | `/api/auth/login` | Login admin → kembalikan JWT token |
| `GET` | `/api/auth/me` | Validasi JWT token admin aktif |

### 2. Projects & Research
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | Mengambil semua project dan riset (bisa filter `?type=project` atau `?type=research`) |
| `GET` | `/api/projects/{id}` | Mengambil detail project / riset berdasarkan ID |
| `POST` | `/api/projects` | Menambahkan project / riset baru ke PostgreSQL |
| `PUT` | `/api/projects/{id}` | Memperbarui project / riset yang sudah ada |
| `DELETE` | `/api/projects/{id}` | Menghapus project / riset dari database |

### 3. Career & Education Timeline
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/career` | Mengambil seluruh linimasa karir & edukasi |
| `GET` | `/api/career/{id}` | Mengambil detail karir berdasarkan ID |
| `POST` | `/api/career` | Menambahkan entri karir / edukasi baru ke PostgreSQL |
| `PUT` | `/api/career/{id}` | Memperbarui entri karir yang sudah ada |
| `DELETE` | `/api/career/{id}` | Menghapus entri karir dari database |

### 4. Blog Posts
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/posts` | Daftar artikel (full). Untuk paginasi gunakan query params. |
| `GET` | `/api/posts?page=0&size=9` | Daftar artikel dengan paginasi server-side |
| `GET` | `/api/posts?search=keyword` | Pencarian full-text berdasarkan judul & isi |
| `GET` | `/api/posts?category=Technology` | Filter artikel berdasarkan kategori |
| `GET` | `/api/posts/{id}` | Mengambil detail artikel berdasarkan ID |
| `GET` | `/api/posts/slug/{slug}` | Mengambil detail artikel berdasarkan slug URL |
| `POST` | `/api/posts` | Menambahkan artikel baru (slug, summary, readTime auto-generate) |
| `PUT` | `/api/posts/{id}` | Memperbarui artikel yang sudah ada |
| `DELETE` | `/api/posts/{id}` | Menghapus artikel berdasarkan ID |

### 5. Blog Comments
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/posts/{postId}/comments` | Mengambil semua komentar untuk artikel tertentu |
| `POST` | `/api/posts/{postId}/comments` | Menambahkan komentar baru (authorName, authorEmail opsional, content) |
| `DELETE` | `/api/posts/{postId}/comments/{id}` | Menghapus komentar berdasarkan ID |

### 6. Contact Inquiries
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/contact` | Mengirim pesan kontak (name, email, phone opsional, subject, message) |
| `GET` | `/api/contact` | Mengambil seluruh pesan kontak yang masuk |
| `PATCH` | `/api/contact/{id}/read` | Menandai pesan sebagai sudah dibaca |
| `DELETE` | `/api/contact/{id}` | Menghapus pesan kontak dari database |

### 7. Monitoring & Docs
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/actuator/health` | Health check detail (DB, diskspace) |
| `GET` | `/actuator/info` | Info versi & nama aplikasi |
| `GET` | `/actuator/metrics` | Metrik runtime JVM |
| `GET` | `/swagger-ui.html` | Swagger UI (eksplorasi API interaktif) |
| `GET` | `/api-docs` | OpenAPI 3 schema (JSON) |

---

## 📂 Struktur Modular Project

```
blog/
├── pom.xml                                     # Konfigurasi Maven & dependencies
├── docker-compose.yml                          # Konfigurasi PostgreSQL Docker
├── src/main/
│   ├── java/com/personal/blog/
│   │   ├── BlogApplication.java               # Main Application Entry
│   │   ├── config/
│   │   │   ├── WebConfig.java                  # CORS Configuration
│   │   │   └── DataInitializer.java           # Seeder awal posts, projects, & career
│   │   ├── controller/
│   │   │   ├── AuthController.java             # Endpoint Autentikasi Admin (JWT)
│   │   │   ├── ProjectController.java          # REST API Projects & Research
│   │   │   ├── CareerController.java           # REST API Linimasa Karir
│   │   │   ├── PostController.java             # REST API Blog (+ pagination, search, slug)
│   │   │   ├── CommentController.java          # REST API Komentar Blog  ← baru
│   │   │   └── ContactController.java          # REST API Pesan Kontak (+ read, delete)
│   │   ├── model/
│   │   │   ├── Project.java                    # JPA Entity tabel projects
│   │   │   ├── Career.java                     # JPA Entity tabel careers
│   │   │   ├── Post.java                       # JPA Entity tabel posts (+ slug, summary, readTime)
│   │   │   ├── Comment.java                    # JPA Entity tabel comments  ← baru
│   │   │   └── ContactMessage.java             # JPA Entity tabel contact_messages (+ phone, isRead)
│   │   ├── repository/
│   │   │   ├── ProjectRepository.java          # Repository Projects
│   │   │   ├── CareerRepository.java           # Repository Karir
│   │   │   ├── PostRepository.java             # Repository Blog (+ search, slug, pageable)
│   │   │   ├── CommentRepository.java          # Repository Komentar  ← baru
│   │   │   └── ContactMessageRepository.java   # Repository Pesan Kontak
│   │   ├── security/
│   │   │   ├── JwtUtil.java                    # JWT generate & validate (HMAC-SHA256)  ← baru
│   │   │   └── RateLimiterFilter.java          # Rate limiter 180 req/menit/IP  ← baru
│   │   └── service/
│   │       └── PostService.java                # Business logic Blog CRUD (+ pagination, slug, search)
│   └── resources/
│       └── application.properties              # Konfigurasi DB, Actuator, SpringDoc
└── frontend/                                   # React 19 + Vite Frontend
    ├── package.json
    ├── vite.config.js                          # Proxy ke backend port 8080
    ├── index.html
    └── src/
        ├── shared/                             # Reusable Shared Layout & Context
        │   ├── components/
        │   │   ├── Navbar.jsx                  # Top Sticky Navbar & Mobile Drawer
        │   │   └── Footer.jsx                  # Footer Informasi & Navigasi
        │   └── context/
        │       └── AuthContext.jsx             # Admin Auth State & JWT Storage
        ├── modules/                            # Domain Feature Modules
        │   ├── about/
        │   │   └── AboutModule.jsx             # Profil, Bio, Stats & Tech Stack
        │   ├── projects/
        │   │   └── ProjectsModule.jsx          # Software Projects & Quick View Modal
        │   ├── research/
        │   │   └── ResearchModule.jsx          # Riset, Publikasi, DOI & Abstract
        │   ├── career/
        │   │   └── CareerModule.jsx            # Linimasa Karir & Accordion Pencapaian
        │   ├── blog/
        │   │   └── BlogModule.jsx              # Blog (pagination, search, read modal, komentar)  ← diperbarui
        │   ├── contact/
        │   │   └── ContactModule.jsx           # Form Kontak (+ field telepon)  ← diperbarui
        │   └── admin/
        │       ├── components/
        │       │   └── AdminLoginModal.jsx     # Modal Login Admin
        │       └── AdminDashboard.jsx          # CMS Dashboard (Projects, Riset, Karir, Blog, Inbox)
        ├── App.jsx                             # Coordinator / Router Shell
        ├── main.jsx                            # Entrypoint React
        └── index.css                           # Styling modern, responsif & dark mode
```

---

## 🗃️ Skema Tabel Database

| Tabel | Kolom Utama |
| :--- | :--- |
| `posts` | id, title, **slug**, **summary**, content, author, category, **readTime**, created_at, updated_at |
| `comments` | id, **post_id**, author_name, author_email, content, created_at |
| `projects` | id, title, type, category, description, details, tags, demoUrl, repoUrl, venue, doi |
| `careers` | id, role, company, period, type, summary, achievements, skills |
| `contact_messages` | id, name, email, **phone**, subject, message, **is_read**, created_at |

> Kolom dengan **bold** adalah kolom yang baru ditambahkan.

---

## 🔧 Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| Backend | Java 21, Spring Boot 4, Spring Data JPA, Hibernate 7 |
| Database | PostgreSQL 18, HikariCP connection pooling |
| Auth | JWT HMAC-SHA256 (custom, tanpa dependency eksternal) |
| API Docs | SpringDoc OpenAPI 3 + Swagger UI |
| Monitoring | Spring Boot Actuator |
| Frontend | React 19, Vite 6, Vanilla CSS |
| Containerization | Docker Compose (PostgreSQL) |
