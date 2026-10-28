-- =============================================================================
-- Schema Migration (DDL Only): V5__add_twitter_instagram_to_profiles.sql
-- Penambahan kolom twitter_url dan instagram_url ke tabel profiles (tanpa mutasi data)
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);

CREATE OR REPLACE VIEW author_profile AS SELECT * FROM profiles;
