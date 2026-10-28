-- =============================================================================
-- Schema Migration (DDL Only): V6__add_avatar_data_to_profiles.sql
-- Penambahan kolom avatar_data (BYTEA) dan avatar_content_type ke tabel profiles
-- =============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_data BYTEA,
ADD COLUMN IF NOT EXISTS avatar_content_type VARCHAR(100);

CREATE OR REPLACE VIEW author_profile AS SELECT * FROM profiles;
