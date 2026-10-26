-- =============================================================================
-- Flyway Migration: V2__seed_initial_master_data.sql
-- Inisialisasi Master Data Awal (Cold Start) untuk Personal Blog & CMS
-- Idempotent: Menggunakan ON CONFLICT DO NOTHING dan pengecekan NOT EXISTS
-- =============================================================================

-- 1. Kredensial Akun Administrator Default (Password BCrypt Hash untuk: Admin*123)
INSERT INTO users (username, password, display_name, role, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$8FNXAUQWRJT.RIAta7UKB.lr8TQeLNbZf/pM3pxtvLhR4tgmzZSmm',
    'System Administrator',
    'ROLE_ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- 2. Data Profil Penulis Utama (Author Profile)
INSERT INTO author_profile (
    id, name, full_name, role, headline, bio, avatar_url, location, experience,
    specialization, status, availability, github_url, linkedin_url, email,
    internal_notes, highlights_json, updated_at
)
SELECT
    1,
    'Rakadnp',
    'Raka Dwi P.',
    'Software Engineer & Technical Researcher',
    'Membangun Sistem Tangguh, Skalabel & Berkinerja Tinggi.',
    'Halo! Saya Rakadnp, seorang Software Engineer & Researcher yang berfokus pada arsitektur sistem backend berdaya tahan tinggi menggunakan Java Spring Boot dan PostgreSQL, dipadukan dengan pengalaman frontend interaktif menggunakan React.',
    '/author.jpg',
    'Jakarta, Indonesia',
    '5+ Tahun Pengalaman',
    '☕ Backend & System Architect',
    'Aktif Menulis & Riset',
    NULL,
    'https://github.com/rakandp',
    'https://linkedin.com',
    'rakandp.dev@gmail.com',
    'Profil terverifikasi sistem blog.',
    '[{"id":1,"icon":"⚡","title":"Backend Architecture & Scalability","desc":"Arsitektur Java 21, Spring Boot 4, microservices, dan performa RESTful APIs."},{"id":2,"icon":"🗄️","title":"Database & Concurrency Tuning","desc":"Optimasi query PostgreSQL, pooling koneksi HikariCP, & konsistensi data tinggi."},{"id":3,"icon":"🔬","title":"Riset Teknologi & Analisis","desc":"Eksplorasi benchmarking performa sistem, rekayasa software, dan publikasi riset terstruktur."},{"id":4,"icon":"🛡️","title":"Reliabilitas & Clean Code","desc":"Komitmen pada standar uptime 99.9%, fault tolerance, dan maintainability jangka panjang."}]',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM author_profile WHERE id = 1);

-- 3. Parameter Konfigurasi Global Website (Site Settings Key-Value)
INSERT INTO site_settings (config_key, config_value, description, updated_at)
VALUES
    ('site_title', 'Rakadnp — Personal Portfolio & Technical Blog', 'Judul utama pada browser tab dan SEO header', CURRENT_TIMESTAMP),
    ('site_tagline', 'Software Engineering, Architecture & Distributed Systems', 'Tagline ringkas portofolio', CURRENT_TIMESTAMP),
    ('brand_name', 'Rakadnp', 'Nama brand/identitas utama pada navbar dan header', CURRENT_TIMESTAMP),
    ('brand_role', 'Software Engineer', 'Sub-judul peran profesional pada navbar dan footer', CURRENT_TIMESTAMP),
    ('brand_avatar', 'R', 'Inisial huruf logo brand di navigation bar', CURRENT_TIMESTAMP),
    ('footer_text', 'Modular Architecture with Java 21 Spring Boot 4, PostgreSQL (personalBlog), React 19 & Vite.', 'Teks hak cipta dan deskripsi arsitektur pada footer', CURRENT_TIMESTAMP),
    ('stats_experience', '5+ Thn', 'Statistik tahun pengalaman di kartu tentang saya', CURRENT_TIMESTAMP),
    ('stats_projects', '20+', 'Statistik jumlah software projects terkirim', CURRENT_TIMESTAMP),
    ('stats_research', '5', 'Statistik publikasi riset dan analisis arsitektur', CURRENT_TIMESTAMP),
    ('stats_uptime', '99.9%', 'Statistik tingkat reliabilitas & SLA sistem', CURRENT_TIMESTAMP),
    ('meta_description', 'Personal portfolio and technical blog of Rakadnp, focusing on Java Spring Boot, PostgreSQL, distributed systems, and React.', 'Deskripsi meta tag untuk mesin pencari', CURRENT_TIMESTAMP),
    ('seo_keywords', 'software engineer, java 21, spring boot 4, postgresql, react 19, distributed systems, system architecture', 'Kata kunci SEO blog', CURRENT_TIMESTAMP)
ON CONFLICT (config_key) DO NOTHING;

-- 4. Data Dasar Postingan Blog Perdana
INSERT INTO posts (title, content, summary, slug, author, category, read_time, created_at, updated_at)
SELECT
    'Selamat Datang di Personal Blog!',
    'Ini adalah postingan perdana di blog pribadi Anda. Sistem ini dibangun menggunakan arsitektur modern: Java Spring Boot sebagai REST API backend, PostgreSQL sebagai database, dan React di sisi frontend. Anda dapat mulai menambahkan postingan baru, mengubah artikel, atau menghapusnya.',
    'Pengenalan sistem personal blog modern berbasis Spring Boot dan React.',
    'selamat-datang-di-personal-blog',
    'Admin',
    'Welcome',
    '2 mnt baca',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Selamat Datang di Personal Blog!');

INSERT INTO posts (title, content, summary, slug, author, category, read_time, created_at, updated_at)
SELECT
    'Arsitektur Fullstack: Spring Boot & React',
    'Menggabungkan ketangguhan Spring Boot di backend dengan kedinamisan React di frontend menghasilkan performa tinggi, kestabilan, dan pengalaman pengguna yang responsif. Dengan PostgreSQL, data artikel tersimpan secara andal dengan integritas relasional yang kuat.',
    'Eksplorasi sinergi arsitektur enterprise antara ekosistem Java dan React.',
    'arsitektur-fullstack-spring-boot-react',
    'Admin',
    'Technology',
    '3 mnt baca',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Arsitektur Fullstack: Spring Boot & React');

-- 5. Data Awal Software Projects & Karya Riset
INSERT INTO projects (title, type, category, description, details, tags, demo_url, repo_url, venue, doi, created_at)
SELECT
    'Enterprise Fullstack Blog & CMS Engine',
    'project',
    'Software Projects',
    'Platform blog dan publikasi artikel modern dengan arsitektur REST API Java Spring Boot 4, penyimpanan relasional PostgreSQL, dan frontend reaktif React 19 + Vite.',
    'Menerapkan koneksi pooling HikariCP dengan Hibernate DDL auto, proteksi CORS menyeluruh, serta arsitektur service-repository berlapis untuk performa throughput tinggi.',
    'Java 21, Spring Boot 4, PostgreSQL, React 19, Vite, Docker',
    'http://localhost:5173',
    'https://github.com/rakandp/blog',
    NULL,
    NULL,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Enterprise Fullstack Blog & CMS Engine');

INSERT INTO projects (title, type, category, description, details, tags, demo_url, repo_url, venue, doi, created_at)
SELECT
    'Studi Optimasi Kinerja Relasional PostgreSQL pada Beban Kerja Skala Tinggi',
    'research',
    'Riset & Publikasi',
    'Riset empiris tentang dampak indeks B-Tree, partisi tabel, dan konfigurasi cache HikariCP terhadap latensi transaksi database relasional.',
    'Menguji skenario 10.000 transaksi/detik dengan pg_bench. Menghasilkan reduksi waktu eksekusi query hingga 43% melalui optimasi indeks dan penghapusan N+1 query pada JPA.',
    'PostgreSQL, Database Benchmarking, Query Optimization, JPA',
    NULL,
    NULL,
    'Indonesian Journal of Computing and Software Systems',
    '10.1234/ijcss.2025.04',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Studi Optimasi Kinerja Relasional PostgreSQL pada Beban Kerja Skala Tinggi');

INSERT INTO projects (title, type, category, description, details, tags, demo_url, repo_url, venue, doi, created_at)
SELECT
    'Distributed E-Commerce Microservices Engine',
    'project',
    'Software Projects',
    'Arsitektur layanan e-commerce berbasis event-driven untuk pengelolaan inventaris, keranjang belanja, dan pembayaran realtime.',
    'Memisahkan layanan katalog, pesanan, dan otentikasi JWT dengan arsitektur microservices yang terisolasi serta caching terdistribusi Redis.',
    'Spring Cloud, PostgreSQL, Kafka, Redis, Docker',
    'https://github.com',
    'https://github.com',
    NULL,
    NULL,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Distributed E-Commerce Microservices Engine');

INSERT INTO projects (title, type, category, description, details, tags, demo_url, repo_url, venue, doi, created_at)
SELECT
    'Analisis Komparatif Modular Monolith vs Microservices untuk Ekosistem Startup',
    'research',
    'Riset & Publikasi',
    'Analisis trade-off kompleksitas operasional, biaya infrastruktur cloud, dan kecepatan iterasi antara Monolith Modular dan Microservices.',
    'Menghadirkan panduan evaluasi arsitektur berdasarkan ukuran tim dan volume transaksi guna mencegah over-engineering di fase awal produk.',
    'Software Architecture, System Design, Domain-Driven Design',
    NULL,
    NULL,
    'Software Engineering Practice & Architecture Review',
    '10.5678/separ.2024.11',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Analisis Komparatif Modular Monolith vs Microservices untuk Ekosistem Startup');

-- 6. Data Riwayat Linimasa Karir & Pendidikan
INSERT INTO careers (role, company, period, type, summary, achievements, skills, created_at)
SELECT
    'Lead Fullstack Software Engineer',
    'Enterprise Digital Solutions',
    '2024 — Sekarang',
    'work',
    'Memimpin arsitektur aplikasi berskala besar, standardisasi backend Spring Boot & modern frontend, serta mentoring tim engineer.',
    'Merancang arsitektur sistem backend dengan response time rata-rata di bawah 80ms.;Memigrasikan sistem legacy ke Java 21 dan Spring Boot modern dengan zero-downtime.;Mengurangi beban server database PostgreSQL sebesar 35% melalui strategi indexing dan caching terukur.',
    'Java 21, Spring Boot, PostgreSQL, React, Docker, System Architecture',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE role = 'Lead Fullstack Software Engineer' AND company = 'Enterprise Digital Solutions');

INSERT INTO careers (role, company, period, type, summary, achievements, skills, created_at)
SELECT
    'Senior Backend Engineer',
    'Global FinTech Hub',
    '2022 — 2024',
    'work',
    'Fokus pada pengembangan API transaksi keuangan berintegritas tinggi dengan standar keamanan finansial ketat.',
    'Mengembangkan REST API dan batch processing transaksi harian senilai miliaran rupiah.;Mengimplementasikan unit & integration testing dengan code coverage di atas 90%.;Membangun pipeline CI/CD otomatis untuk deployment cepat dan aman.',
    'Spring Data JPA, PostgreSQL, Redis, Kafka, CI/CD',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE role = 'Senior Backend Engineer' AND company = 'Global FinTech Hub');

INSERT INTO careers (role, company, period, type, summary, achievements, skills, created_at)
SELECT
    'Fullstack Developer & Researcher',
    'Software Innovation Lab',
    '2020 — 2022',
    'work',
    'Melakukan riset terapan teknologi software web serta membangun produk prototipe siap komersialisasi.',
    'Menulis 3 publikasi riset terapan bidang optimasi basis data dan arsitektur web.;Membangun 10+ solusi web portal responsif menggunakan ekosistem Java dan React.',
    'Java, React, MySQL, PostgreSQL, Research & Analysis',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE role = 'Fullstack Developer & Researcher' AND company = 'Software Innovation Lab');

INSERT INTO careers (role, company, period, type, summary, achievements, skills, created_at)
SELECT
    'Sarjana Ilmu Komputer (S.Kom)',
    'Fakultas Ilmu Komputer & Informatika',
    '2016 — 2020',
    'education',
    'Lulus dengan predikat Sangat Memuaskan, fokus riset pada Rekayasa Perangkat Lunak dan Basis Data Terdistribusi.',
    'Penerima beasiswa prestasi akademik 4 semester berturut-turut.;Ketua divisi penelitian dan pengembangan himpunan mahasiswa teknologi.',
    'Algoritma & Struktur Data, Basis Data, Rekayasa Perangkat Lunak',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE role = 'Sarjana Ilmu Komputer (S.Kom)' AND company = 'Fakultas Ilmu Komputer & Informatika');
