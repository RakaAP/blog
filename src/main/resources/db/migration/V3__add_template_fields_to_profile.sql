-- =============================================================================
-- Flyway Migration: V3__add_template_fields_to_profile.sql
-- Penambahan kolom baru pada tabel author_profile untuk mendukung template portofolio modern
-- Non-destructive: menjaga keutuhan seluruh data yang sudah ada
-- =============================================================================

ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS cv_url VARCHAR(500);
ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS skills_json TEXT;
ALTER TABLE author_profile ADD COLUMN IF NOT EXISTS testimonial_json TEXT;

-- Update baris data default jika kolom masih kosong (NULL)
UPDATE author_profile
SET 
    cv_url = COALESCE(cv_url, '#'),
    phone = COALESCE(phone, '+62 812-3456-7890'),
    skills_json = COALESCE(skills_json, '[
      {"name": "HTML & Semantics", "percent": 95, "icon": "html", "category": "frontend"},
      {"name": "CSS3 & Modern Layout", "percent": 90, "icon": "css", "category": "frontend"},
      {"name": "JavaScript (ESNext)", "percent": 90, "icon": "js", "category": "frontend"},
      {"name": "React.js 19", "percent": 88, "icon": "react", "category": "frontend"},
      {"name": "Next.js & SSR", "percent": 82, "icon": "next", "category": "frontend"},
      {"name": "TypeScript", "percent": 85, "icon": "ts", "category": "frontend"},
      {"name": "Java 21 & Spring Boot 4", "percent": 95, "icon": "java", "category": "backend"},
      {"name": "PostgreSQL & Query Tuning", "percent": 90, "icon": "postgres", "category": "backend"},
      {"name": "Git & CI/CD Pipelines", "percent": 85, "icon": "git", "category": "devops"}
    ]'),
    testimonial_json = COALESCE(testimonial_json, '{
      "quote": "Raka adalah Software Engineer luar biasa yang mampu merancang arsitektur backend berdaya tahan tinggi dan pengalaman antarmuka modern dengan perhatian detail istimewa.",
      "author": "Sarah Johnson",
      "role": "VP of Engineering, Tech Innovation Lab",
      "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    }')
WHERE id = 1;
