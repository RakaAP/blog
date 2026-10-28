-- =============================================================================
-- Schema Migration (DDL Only): V3__add_template_fields_to_profile.sql
-- Penambahan kolom struktur pada tabel author_profile tanpa memodifikasi data
-- =============================================================================

ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS cv_url VARCHAR(500);
ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS skills_json TEXT;
ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS testimonial_json TEXT;
