-- =============================================================================
-- Flyway Migration: V8__seed_etd_ugm_research.sql
-- Integrasi data publikasi nyata ETD Universitas Gadjah Mada (573142 - Abstract)
-- =============================================================================

-- Perbarui item riset pertama agar memuat data riil publikasi ETD UGM
UPDATE researches
SET 
    year = '2020',
    journal_name = 'ETD Repository — Universitas Gadjah Mada',
    title = 'Pengembangan Aplikasi Pengenalan Suara Speech-to-Text Bahasa Indonesia pada Laptop dan Dekstop',
    summary = 'Aplikasi automatic speech recognition (ASR) bernama ARISE dikembangkan untuk memudahkan penyandang disabilitas dan pengguna yang kesulitan menggunakan keyboard atau touchscreen agar dapat mengetik angka "nol" hingga "sembilan" melalui suara. Sistem ini menggunakan metode ekstraksi ciri MFCC dan algoritma klasifikasi SVM (dengan KNN sebagai pembanding) yang menghasilkan performa F1-score pada model SVM berkisar antara 69% hingga 98%.',
    researchers = 'Raka Andinan Pratama, Dr. Ir. Risanuri Hidayat, M.Sc., IPM.',
    doi = 'ETD-UGM-573142',
    publication_url = 'http://etd.repository.ugm.ac.id/penelitian/unduh/573142',
    display_order = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = (
    SELECT id FROM researches 
    ORDER BY display_order ASC, id ASC 
    LIMIT 1
);

-- Jaga-jaga jika tabel researches belum memiliki data publikasi ini
INSERT INTO researches (
    profile_id, year, journal_name, title, summary, researchers, doi, publication_url, display_order, created_at, updated_at
)
SELECT 
    p.id,
    '2020',
    'ETD Repository — Universitas Gadjah Mada',
    'Pengembangan Aplikasi Pengenalan Suara Speech-to-Text Bahasa Indonesia pada Laptop dan Dekstop',
    'Aplikasi automatic speech recognition (ASR) bernama ARISE dikembangkan untuk memudahkan penyandang disabilitas dan pengguna yang kesulitan menggunakan keyboard atau touchscreen agar dapat mengetik angka "nol" hingga "sembilan" melalui suara. Sistem ini menggunakan metode ekstraksi ciri MFCC dan algoritma klasifikasi SVM (dengan KNN sebagai pembanding) yang menghasilkan performa F1-score pada model SVM berkisar antara 69% hingga 98%.',
    'Raka Andinan Pratama, Dr. Ir. Risanuri Hidayat, M.Sc., IPM.',
    'ETD-UGM-573142',
    'http://etd.repository.ugm.ac.id/penelitian/unduh/573142',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM researches WHERE doi = 'ETD-UGM-573142')
LIMIT 1;
