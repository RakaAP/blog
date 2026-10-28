-- =============================================================================
-- Flyway Migration: V5__add_twitter_instagram_to_profiles.sql
-- Menambahkan kolom sosial media twitter_url dan instagram_url ke tabel profiles
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);

UPDATE profiles 
SET twitter_url = COALESCE(twitter_url, 'https://twitter.com'),
    instagram_url = COALESCE(instagram_url, 'https://instagram.com')
WHERE twitter_url IS NULL OR instagram_url IS NULL;

-- Perbarui view author_profile untuk backward-compatibility
CREATE OR REPLACE VIEW author_profile AS SELECT * FROM profiles;
