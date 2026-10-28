-- =============================================================================
-- Flyway Migration: V6__add_avatar_data_to_profiles.sql
-- Tambahkan kolom avatar_data (BYTEA) dan avatar_content_type (VARCHAR(100))
-- ke tabel profiles untuk penyimpanan biner foto profil permanen di PostgreSQL.
-- =============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_data BYTEA,
ADD COLUMN IF NOT EXISTS avatar_content_type VARCHAR(100);

-- Refresh view author_profile agar mencakup kolom baru
CREATE OR REPLACE VIEW author_profile AS SELECT * FROM profiles;

-- Pulihkan avatar_url ke /author.jpg jika sebelumnya menunjuk ke berkas sementara /uploads/avatars/ yang rusak/hilang
UPDATE profiles 
SET avatar_url = '/author.jpg' 
WHERE avatar_url LIKE '/uploads/avatars/%' AND avatar_data IS NULL;
