import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import BlogModule from '../blog/BlogModule';
import GitHubContributionsGraph from './components/GitHubContributionsGraph';

export const cleanPublicationUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  let trimmed = rawUrl.trim();
  if (trimmed.includes('google.') && trimmed.includes('/url?')) {
    try {
      const urlObj = new URL(trimmed);
      const targetUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
      if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
        trimmed = targetUrl;
      }
    } catch {
      // ignore parsing error, return trimmed
    }
  }

  // Bersihkan sisa parameter tracking Google (&ved=..., &usg=..., dll)
  const trackingKeys = ['&ved=', '&usg=', '&opi=', '&rct=', '&sa=', '&source=', '?ved=', '?usg='];
  for (const key of trackingKeys) {
    const idx = trimmed.indexOf(key);
    if (idx !== -1) {
      trimmed = trimmed.substring(0, idx);
    }
  }

  return trimmed;
};

const extractGitHubUsername = (url) => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) return match[1];
  if (trimmed.startsWith('@')) return trimmed.slice(1);
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return '';
};

const INITIAL_EDIT_FORM = {
  name: '',
  fullName: '',
  role: '',
  headline: '',
  photoUrl: '',
  avatarUrl: '',
  githubUrl: '',
  email: '',
  skills: [],
  researches: []
};

export default function AboutModule({ onNavigate, onCopyEmail, onToast, siteSettings, isLoadingSettings = false, onScrollToSection }) {
  const { adminUser, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && adminUser?.role === 'ROLE_ADMIN';

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [researches, setResearches] = useState([]);
  const [isLoadingResearches, setIsLoadingResearches] = useState(true);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [doiCopied, setDoiCopied] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const fileInputRef = useRef(null);
  const githubUsername = extractGitHubUsername(profile?.githubUrl);

  // Handler menutup modal detail / reader riset
  const handleCloseResearchModal = () => {
    setSelectedResearch(null);
    setIsViewingDocument(false);
    setIsPdfLoading(true);
  };

  // Copy to clipboard helper dengan umpan balik toast & indikator visual
  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    if (onToast) {
      onToast(`${fieldName === 'email' ? 'Alamat email' : 'Nomor kontak'} berhasil disalin ke clipboard!`);
    }
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  // Copy DOI helper
  const handleCopyDoi = (doiText) => {
    if (!doiText) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(doiText);
    }
    setDoiCopied(true);
    if (onToast) {
      onToast('DOI / Sitasi publikasi berhasil disalin ke clipboard!');
    }
    setTimeout(() => {
      setDoiCopied(false);
    }, 2000);
  };

  // 1. Fetch Dynamic Author Profile directly from GET /api/profile (PostgreSQL Single Source of Truth)
  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const loadedSkills = Array.isArray(data.skills) ? data.skills : [];
        const normalizedSkills = loadedSkills.map((sk) => ({
          ...sk,
          percent: sk.percent ?? sk.proficiency ?? 0,
          proficiency: sk.proficiency ?? sk.percent ?? 0
        }));

        const normalizedProfile = {
          ...data,
          name: data.name || '',
          fullName: data.fullName || '',
          role: data.role || '',
          headline: data.headline || '',
          photoUrl: data.photoUrl || data.avatarUrl || '',
          avatarUrl: data.avatarUrl || '',
          githubUrl: data.githubUrl || '',
          email: data.email || '',
          skills: normalizedSkills,
          researches: Array.isArray(data.researches) ? data.researches : []
        };

        setProfile(normalizedProfile);
        setEditForm(normalizedProfile);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.warn('Gagal memuat profil dari PostgreSQL:', e);
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // 2. Fetch Researches directly from GET /api/researches (PostgreSQL Single Source of Truth)
  const fetchResearches = async () => {
    setIsLoadingResearches(true);
    try {
      const res = await fetch('/api/researches');
      if (res.ok) {
        const data = await res.json();
        setResearches(Array.isArray(data) ? data : []);
      } else {
        setResearches([]);
      }
    } catch (e) {
      console.warn('Gagal memuat daftar riset dari PostgreSQL:', e);
      setResearches([]);
    } finally {
      setIsLoadingResearches(false);
    }
  };

  // 3. Fetch Projects directly from GET /api/projects?type=project (PostgreSQL Single Source of Truth)
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch('/api/projects?type=project');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.slice(0, 3).map((p, idx) => ({
            id: p.id,
            num: String(idx + 1).padStart(2, '0'),
            title: p.title || '',
            desc: p.description || p.details || '',
            tag: p.tags || p.category || ''
          }));
          setFeaturedProjects(mapped);
        } else {
          setFeaturedProjects([]);
        }
      } else {
        setFeaturedProjects([]);
      }
    } catch (e) {
      console.warn('Gagal memuat daftar proyek dari PostgreSQL:', e);
      setFeaturedProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchResearches();
    fetchProjects();
  }, []);

  // Upload Avatar: POST /api/profile/avatar
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      if (onToast) onToast('Akses ditolak: Hanya pengguna dengan peran ADMIN yang dapat mengunggah foto.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      if (onToast) onToast('Harap pilih berkas gambar valid (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (onToast) onToast('Ukuran berkas melebihi batas maksimum 10MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminUser.token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.status === 'SUCCESS') {
        const newAvatarUrl = data.avatarUrl;
        setProfile((prev) => ({ ...prev, photoUrl: newAvatarUrl }));
        setEditForm((prev) => ({ ...prev, photoUrl: newAvatarUrl }));
        setImageError(false);
        if (onToast) onToast('Foto profil penulis berhasil disimpan secara permanen di basis data PostgreSQL!');
      } else {
        if (onToast) onToast(data.message || 'Gagal mengunggah foto profil', 'error');
      }
    } catch {
      if (onToast) onToast('Terjadi kesalahan jaringan saat mengunggah foto', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenEdit = () => {
    if (!isAdmin) {
      if (onToast) onToast('Akses ditolak: Silakan login sebagai Admin terlebih dahulu.', 'error');
      return;
    }
    setEditForm({
      ...(profile || INITIAL_EDIT_FORM),
      researches: researches
    });
    setIsEditModalOpen(true);
  };

  // Simpan Pembaruan Profil: PUT /api/profile
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      if (onToast) onToast('Akses ditolak: Anda harus terautentikasi sebagai Admin.', 'error');
      return;
    }

    try {
      // Pastikan avatarUrl tetap merujuk ke data PostgreSQL jika user hanya mengubah teks profil
      const avatarToSave = editForm.photoUrl?.trim() || profile?.photoUrl || '';

      const cleanedResearches = (editForm.researches || []).map((r) => ({
        ...r,
        publicationUrl: cleanPublicationUrl(r.publicationUrl)
      }));

      const payload = {
        name: editForm.name,
        fullName: editForm.fullName,
        role: editForm.role,
        headline: editForm.headline,
        avatarUrl: avatarToSave,
        photoUrl: avatarToSave,
        githubUrl: editForm.githubUrl,
        email: editForm.email,
        skills: editForm.skills,
        skillsJson: JSON.stringify(editForm.skills),
        researches: cleanedResearches
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminUser.token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const loadedSkills = Array.isArray(data.skills) ? data.skills : [];
        const normalizedSkills = loadedSkills.map((sk) => ({
          ...sk,
          percent: sk.percent ?? sk.proficiency ?? 0,
          proficiency: sk.proficiency ?? sk.percent ?? 0
        }));
        const updatedResearches = Array.isArray(data.researches) ? data.researches : [];

        const merged = {
          ...data,
          photoUrl: data.photoUrl || data.avatarUrl || '',
          avatarUrl: data.avatarUrl || '',
          githubUrl: data.githubUrl || '',
          email: data.email || '',
          skills: normalizedSkills,
          researches: updatedResearches
        };
        setProfile(merged);
        setResearches(updatedResearches);
        setIsEditModalOpen(false);
        setImageError(false);
        if (onToast) onToast('Profil & konfigurasi portofolio berhasil diperbarui di database!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (onToast) onToast(errorData.message || 'Gagal memperbarui profil di server', 'error');
      }
    } catch {
      if (onToast) onToast('Gagal terhubung ke backend untuk memperbarui profil', 'error');
    }
  };

  // Tech Icon Renderer
  const renderTechIcon = (iconName) => {
    switch (iconName) {
      case 'html':
        return (
          <span className="tech-icon-badge html" title="HTML5">
            <span>5</span>
          </span>
        );
      case 'css':
        return (
          <span className="tech-icon-badge css" title="CSS3">
            <span>3</span>
          </span>
        );
      case 'js':
        return (
          <span className="tech-icon-badge js" title="JavaScript">
            <span>JS</span>
          </span>
        );
      case 'ts':
        return (
          <span className="tech-icon-badge ts" title="TypeScript">
            <span>TS</span>
          </span>
        );
      case 'react':
        return (
          <span className="tech-icon-badge react" title="React.js">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(150 12 12)" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </span>
        );
      case 'next':
        return (
          <span className="tech-icon-badge next" title="Next.js">
            <span>N</span>
          </span>
        );
      case 'node':
      case 'java':
        return (
          <span className="tech-icon-badge node" title="Node.js / Java">
            <span>⬢</span>
          </span>
        );
      case 'tailwind':
      case 'postgres':
        return (
          <span className="tech-icon-badge tailwind" title="Tailwind CSS">
            <span>≈</span>
          </span>
        );
      case 'git':
        return (
          <span className="tech-icon-badge git" title="Git">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="12" r="3" />
              <path d="M6 9v6m0-3l9-3" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="tech-icon-badge default">
            <span>&lt;/&gt;</span>
          </span>
        );
    }
  };

  return (
    <div id="module-about" className="modern-portfolio-theme">
      {/* Hidden File Input for Direct Photo Upload (Admin Only) */}
      {isAdmin && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. HERO BANNER SECTION (FULL-VIEWPORT SNAP)                               */}
      {/* ========================================================================= */}
      <section id="hero" className="fullpage-snap-section section-hero snap-start snap-always w-full min-h-dvh flex flex-col justify-center items-center" aria-label="Hero Section">
        <div className="section-inner-container">
          {/* Admin Floating Control Button */}
          {isAdmin && (
            <div className="admin-customize-bar">
              <button
                className="btn-edit-portfolio"
                onClick={handleOpenEdit}
                title="Kustomisasi tampilan profil, teks, dan statistik (Khusus Admin)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Sesuaikan Halaman Portofolio</span>
              </button>
            </div>
          )}

          {isLoadingProfile ? (
            <div className="portfolio-hero-container" aria-label="Memuat profil dari PostgreSQL...">
              <div className="portfolio-hero-text">
                <span className="ui-skeleton" style={{ width: '175px', height: '30px', borderRadius: '9999px', marginBottom: '1.25rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  <span className="ui-skeleton" style={{ width: '88%', height: '48px', borderRadius: '10px' }} />
                  <span className="ui-skeleton" style={{ width: '65%', height: '38px', borderRadius: '10px' }} />
                </div>
                <span className="ui-skeleton" style={{ width: '165px', height: '46px', borderRadius: '12px', marginBottom: '2rem' }} />
              </div>
              <div className="portfolio-hero-visual">
                <div className="hero-circle-stage">
                  <div className="purple-glow-sphere"></div>
                  <div className="author-photo-wrapper rounded-3xl">
                    <span className="ui-skeleton rounded-3xl" style={{ width: '100%', height: '100%', borderRadius: '1.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : profile ? (
            <div className="portfolio-hero-container">
              {/* Left Column: Headline, Bio, Buttons, Tech Logos */}
              <div className="portfolio-hero-text">
                {profile.role && (
                  <div className="hero-pill-badge">
                    <span className="pill-dot"></span>
                    <span>I'M A {profile.role.toUpperCase()}</span>
                  </div>
                )}

                <h1 className="hero-main-title">
                  Hi, I’m <span className="gradient-name">{profile.fullName || profile.name}</span>
                  {profile.headline && (
                    <>
                      <br />
                      <span className="headline-secondary">{profile.headline}</span>
                    </>
                  )}
                </h1>

                <div className="hero-button-group">
                  <button
                    className="btn-primary-purple"
                    onClick={() => onScrollToSection ? onScrollToSection('projects') : onNavigate('projects')}
                  >
                    <span>View My Work</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </button>
                </div>

                {/* Technologies I Work With */}
                <div className="hero-tech-strip">
                  <span className="tech-strip-label">TECHNOLOGIES I WORK WITH</span>
                  <div className="tech-strip-icons">
                    {renderTechIcon('html')}
                    {renderTechIcon('css')}
                    {renderTechIcon('js')}
                    {renderTechIcon('ts')}
                    {renderTechIcon('react')}
                    {renderTechIcon('next')}
                    {renderTechIcon('git')}
                  </div>
                </div>
              </div>

              {/* Right Column: Ambient Glowing Backdrop & Photo */}
              <div className="portfolio-hero-visual">
                <div className="hero-circle-stage">
                  <div className="purple-glow-sphere"></div>

                  <div className="author-photo-wrapper rounded-3xl">
                    {!imageError && profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt={`${profile.fullName || profile.name} - Portrait`}
                        className="author-portrait-img rounded-3xl"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="author-portrait-fallback rounded-3xl">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{profile.name || profile.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              Data profil belum tersedia di database PostgreSQL.
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ABOUT ME & 2x2 STATS SECTION (FULL-VIEWPORT SNAP)                      */}
      {/* ========================================================================= */}
      <section id="about" className="fullpage-snap-section section-about snap-start snap-always w-full min-h-dvh flex flex-col justify-center items-center" aria-label="About Section">
        <div className="section-inner-container">
          <div className="about-me-section">
            <div className="about-narrative-card">
              <span className="section-pill-tag">ABOUT ME</span>
              <h3 className="about-narrative-title">I’m passionate about creating digital solutions</h3>
              {isLoadingSettings && isLoadingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0 1.5rem 0' }}>
                  <span className="ui-skeleton" style={{ width: '100%', height: '16px' }} />
                  <span className="ui-skeleton" style={{ width: '92%', height: '16px' }} />
                  <span className="ui-skeleton" style={{ width: '74%', height: '16px' }} />
                </div>
              ) : (
                <p className="about-narrative-desc">
                  With {siteSettings?.stats_experience || profile?.experience || '—'} of experience in software engineering and web development, I help businesses and individuals bring their ideas to life through clean, efficient, and user-friendly code.
                </p>
              )}
              <button
                className="btn-learn-more"
                onClick={() => onScrollToSection ? onScrollToSection('contact') : onNavigate('contact')}
              >
                <span>Learn More About Me</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>

        {/* 2x2 Stats Grid with Purple Icon Squares (Murni dari PostgreSQL site_settings) */}
        <div className="about-stats-grid">
          {/* Card 1: Experience */}
          <div className="about-stat-card">
            <div className="stat-icon-square purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-card-text">
              <div className="stat-number">
                {isLoadingSettings ? (
                  <span className="ui-skeleton" style={{ width: '64px', height: '26px' }} />
                ) : (
                  siteSettings?.stats_experience || profile?.experience || '—'
                )}
              </div>
              <div className="stat-label">Years Experience</div>
            </div>
          </div>

          {/* Card 2: Projects */}
          <div className="about-stat-card">
            <div className="stat-icon-square purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div className="stat-card-text">
              <div className="stat-number">
                {isLoadingSettings ? (
                  <span className="ui-skeleton" style={{ width: '48px', height: '26px' }} />
                ) : (
                  siteSettings?.stats_projects || '—'
                )}
              </div>
              <div className="stat-label">Projects Completed</div>
            </div>
          </div>

          {/* Card 3: Research & Publications */}
          <div className="about-stat-card">
            <div className="stat-icon-square purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="stat-card-text">
              <div className="stat-number">
                {isLoadingSettings && isLoadingResearches ? (
                  <span className="ui-skeleton" style={{ width: '48px', height: '26px' }} />
                ) : (
                  siteSettings?.stats_research || String(researches.length)
                )}
              </div>
              <div className="stat-label">Research &amp; Publications</div>
            </div>
          </div>

          {/* Card 4: System Uptime */}
          <div className="about-stat-card">
            <div className="stat-icon-square purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </div>
            <div className="stat-card-text">
              <div className="stat-number">
                {isLoadingSettings ? (
                  <span className="ui-skeleton" style={{ width: '64px', height: '26px' }} />
                ) : (
                  siteSettings?.stats_uptime || '—'
                )}
              </div>
              <div className="stat-label">System Uptime</div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RESEARCH & PUBLICATIONS ("Riset & Publikasi Ilmiah") (FULL-VIEWPORT SNAP) */}
      {/* ========================================================================= */}
      <section id="research" className="fullpage-snap-section section-research snap-start snap-always w-full min-h-dvh flex flex-col justify-center items-center" aria-label="Research & Publications Section">
        <div className="section-inner-container">
          <div className="research-section-container">
            <div className="section-centered-header">
              <span className="section-pill-tag">RESEARCH & PUBLICATIONS</span>
              <h3 className="section-title-large">Riset & Publikasi Ilmiah</h3>
            </div>

            {isLoadingResearches ? (
              <div className="research-cards-grid" aria-label="Memuat riset dari PostgreSQL...">
                {[1, 2, 3].map((sk) => (
                  <div key={sk} className="research-card" style={{ opacity: 0.7 }}>
                    <span className="ui-skeleton" style={{ height: '24px', width: '45%', borderRadius: '9999px', marginBottom: '1rem' }} />
                    <span className="ui-skeleton" style={{ height: '22px', width: '85%', borderRadius: '6px', marginBottom: '0.75rem' }} />
                    <span className="ui-skeleton" style={{ height: '14px', width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
                    <span className="ui-skeleton" style={{ height: '14px', width: '70%', borderRadius: '4px', marginBottom: '1.5rem' }} />
                    <span className="ui-skeleton" style={{ height: '36px', width: '100%', borderRadius: '10px' }} />
                  </div>
                ))}
              </div>
            ) : researches.length > 0 ? (
              <div className="research-cards-grid">
                {researches.map((res, idx) => (
                  <div key={res.id || idx} className="research-card">
                    {/* 1. Tahun & Nama Jurnal Badge */}
                    <div className="research-card-header">
                      <span className="research-journal-badge">
                        {res.year} • {res.journalName}
                      </span>
                    </div>

                    {/* 2. Judul Riset */}
                    <h4 className="research-card-title">{res.title}</h4>

                    {/* 3. Ringkasan Mengenai Riset */}
                    <p className="research-card-summary">{res.summary}</p>

                    {/* 4. Footer: Nama Researcher & Button Detail */}
                    <div className="research-card-footer">
                      <div className="research-author-row" title={`Peneliti: ${res.researchers}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{res.researchers}</span>
                      </div>

                      {/* 5. Button Direct Link Detail */}
                      <button
                        type="button"
                        className="btn-research-detail"
                        onClick={() => {
                          setSelectedResearch(res);
                          setIsViewingDocument(false);
                          setIsPdfLoading(true);
                        }}
                      >
                        <span>Lihat Detail Riset</span>
                        <span>↗</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Belum ada data riset & publikasi ilmiah di database.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURED PROJECTS ("Some of My Recent Work") (FULL-VIEWPORT SNAP)      */}
      {/* ========================================================================= */}
      <section id="projects" className="fullpage-snap-section section-projects snap-start snap-always w-full min-h-dvh flex flex-col justify-center items-center" aria-label="Featured Projects Section">
        <div className="section-inner-container">
          <div className="featured-projects-section">
        <div className="section-centered-header">
          <span className="section-pill-tag">FEATURED PROJECTS</span>
          <h3 className="section-title-large">Some of My Recent Work</h3>
        </div>

        {isLoadingProjects ? (
          <div className="featured-projects-grid" aria-label="Memuat proyek dari PostgreSQL...">
            {[1, 2, 3].map((sk) => (
              <div key={sk} className="featured-project-card" style={{ pointerEvents: 'none' }}>
                <div className="project-card-banner">
                  <span className="ui-skeleton" style={{ width: '100%', height: '140px', borderRadius: '12px' }} />
                </div>
                <div className="project-card-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <span className="ui-skeleton" style={{ width: '75%', height: '20px' }} />
                  <span className="ui-skeleton" style={{ width: '100%', height: '14px' }} />
                  <span className="ui-skeleton" style={{ width: '60%', height: '14px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProjects.length > 0 ? (
          <div className="featured-projects-grid">
            {featuredProjects.map((proj, idx) => (
              <div key={proj.id || idx} className="featured-project-card" onClick={() => onNavigate('projects')}>
                <div className="project-card-banner">
                  <span className="project-number-tag">{proj.num}</span>
                  {/* Modern Dashboard Screen Mockup */}
                  <div className="project-mockup-frame">
                    <div className="mockup-top-nav">
                      <span className="dot dot-red"></span>
                      <span className="dot dot-yellow"></span>
                      <span className="dot dot-green"></span>
                    </div>
                    <div className={`mockup-body-preview theme-${idx % 3}`}>
                      <div className="mockup-chart-circle"></div>
                      <div className="mockup-chart-bars">
                        <span></span><span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="project-card-details">
                  <h4 className="project-card-heading">{proj.title}</h4>
                  <p className="project-card-summary">{proj.desc}</p>
                  <div className="project-card-bottom">
                    <span className="project-view-cta">
                      View Project <span className="arrow-sym">→</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            Belum ada data proyek perangkat lunak di database PostgreSQL.
          </div>
        )}

        {/* Carousel Pagination Dots */}
        <div className="featured-carousel-dots">
          <span className="carousel-dot active"></span>
          <span className="carousel-dot"></span>
          <span className="carousel-dot"></span>
        </div>
      </div>
      </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. LATEST ARTICLES & BLOG SECTION (FULL-VIEWPORT SNAP)                   */}
      {/* ========================================================================= */}
      <BlogModule onToast={onToast} />

      {/* ========================================================================= */}
      {/* 6. BOTTOM SECTION: FOLLOW ME & DIRECT CONTACT (SINGLE CENTERED)          */}
      {/* ========================================================================= */}
      <section id="contact" className="fullpage-snap-section section-contact snap-start snap-always w-full min-h-dvh flex flex-col justify-center items-center" aria-label="Contact Section">
        <div className="section-inner-container w-full px-4">
          <div className="follow-contact-centered-wrapper">
            <div className="follow-contact-card">
              <div className="follow-contact-header">
                <span className="section-pill-tag">CONNECT &amp; GITHUB ACTIVITY</span>
                <h3 className="follow-contact-title">Let’s Connect &amp; Collaborate</h3>
                <p className="follow-contact-subtitle">
                  Hubungi saya langsung melalui email atau pantau riwayat kontribusi open-source dan rekayasa perangkat lunak saya di GitHub.
                </p>
              </div>

              {/* 1. Baris Kontak 2 Kolom Seimbang: Email Langsung & GitHub Profile (Murni dari PostgreSQL) */}
              <div className="contact-two-column-grid">
                {/* Kartu 1: Email Langsung dengan Tombol Salin */}
                <div className="contact-direct-card">
                  <div className="contact-card-left">
                    <div className="contact-card-icon-wrap email">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div className="contact-card-text">
                      <span className="contact-card-label">Email Langsung</span>
                      {isLoadingProfile ? (
                        <span className="ui-skeleton" style={{ width: '175px', height: '16px', marginTop: '0.2rem' }} />
                      ) : profile?.email ? (
                        <a
                          href={`mailto:${profile.email}`}
                          className="contact-card-val"
                          title={`Kirim email ke ${profile.email}`}
                        >
                          {profile.email}
                        </a>
                      ) : (
                        <span className="contact-card-val">—</span>
                      )}
                    </div>
                  </div>
                  {!isLoadingProfile && profile?.email && (
                    <button
                      type="button"
                      className={`btn-copy-chip ${copiedField === 'email' ? 'copied' : ''}`}
                      onClick={() => handleCopyText(profile.email, 'email')}
                      title="Salin alamat email"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Kartu 2: GitHub Profile dengan Link Langsung */}
                <a
                  href={!isLoadingProfile && profile?.githubUrl ? profile.githubUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-direct-card github-card-link"
                  title={githubUsername ? `Buka profil GitHub @${githubUsername}` : 'Profil GitHub'}
                >
                  <div className="contact-card-left">
                    <div className="contact-card-icon-wrap github">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </div>
                    <div className="contact-card-text">
                      <span className="contact-card-label">GitHub Profile</span>
                      {isLoadingProfile ? (
                        <span className="ui-skeleton" style={{ width: '115px', height: '16px', marginTop: '0.2rem' }} />
                      ) : (
                        <span className="contact-card-val">{githubUsername ? `@${githubUsername}` : '—'}</span>
                      )}
                    </div>
                  </div>
                  {!isLoadingProfile && profile?.githubUrl && (
                    <div className="contact-link-pill">
                      <span>Lihat Profil</span>
                      <span className="contact-arrow-icon">↗</span>
                    </div>
                  )}
                </a>
              </div>

              {/* 2. Kartu Live Heatmap GitHub Contributions */}
              <GitHubContributionsGraph
                username={githubUsername}
                profileUrl={profile?.githubUrl}
                isLoadingProfile={isLoadingProfile}
              />
            </div>
          </div>

          <div className="bottom-copyright-strip">
            {isLoadingProfile ? (
              <span className="ui-skeleton" style={{ width: '260px', height: '14px' }} />
            ) : (
              <>
                <p className="copyright-text">
                  © {new Date().getFullYear()} {profile?.fullName || profile?.name || ''}. All rights reserved.
                </p>
                {(profile?.name || profile?.fullName) && (
                  <p className="made-with-love">
                    Made with <span className="heart-icon">❤️</span> by {profile?.name || profile?.fullName}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. POP-UP MODAL DETAIL RISET & IN-APP PUBLICATION READER                  */}
      {/* ========================================================================= */}
      {selectedResearch && (
        <div className="modal-overlay" onClick={handleCloseResearchModal}>
          {isViewingDocument ? (
            /* Mode 1: In-App PDF Viewer (Full-Screen Document Reader) */
            <div className="modal-content research-detail-modal reader-mode" onClick={(e) => e.stopPropagation()}>
              <div className="reader-header-bar">
                <div className="reader-header-left">
                  <button
                    type="button"
                    className="btn-reader-back"
                    onClick={() => setIsViewingDocument(false)}
                    title="Kembali ke tampilan ringkasan dan metadata riset"
                  >
                    <span>←</span>
                    <span>Kembali ke Ringkasan Detail</span>
                  </button>
                  <span className="research-journal-badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                    {selectedResearch.year} • {selectedResearch.journalName}
                  </span>
                  <span className="reader-title-snippet" title={selectedResearch.title}>
                    {selectedResearch.title}
                  </span>
                </div>

                <div className="reader-header-right">
                  <a
                    href={`/api/researches/${selectedResearch.id}/document`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    title="Buka dokumen PDF ini di tab browser terpisah"
                  >
                    <span>Tab Baru</span>
                    <span>↗</span>
                  </a>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleCloseResearchModal}
                    aria-label="Tutup Reader"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="reader-frame-container">
                {isPdfLoading && (
                  <div className="reader-loading-overlay">
                    <div className="reader-spinner" />
                    <span className="reader-loading-text">Memuat dokumen publikasi PDF dari repositori...</span>
                  </div>
                )}
                <iframe
                  src={`/api/researches/${selectedResearch.id}/document#toolbar=1&navpanes=0`}
                  title={selectedResearch.title}
                  className="reader-pdf-iframe"
                  onLoad={() => setIsPdfLoading(false)}
                />
              </div>
            </div>
          ) : (
            /* Mode 2: Ringkasan Riset & Metadata Grid */
            <div className="modal-content research-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <span className="research-journal-badge" style={{ marginBottom: '0.45rem', alignSelf: 'flex-start' }}>
                    {selectedResearch.year} • {selectedResearch.journalName}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', lineHeight: '1.4', margin: '0.25rem 0', color: '#f8fafc' }}>
                    {selectedResearch.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseResearchModal}
                  aria-label="Tutup Detail Riset"
                >
                  ✕
                </button>
              </div>

              <div className="modal-body" style={{ marginTop: '1rem' }}>
                {/* Ringkasan Riset / Abstrak Lengkap */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="research-meta-label" style={{ marginBottom: '0.4rem' }}>
                    Ringkasan Riset & Abstrak
                  </div>
                  <p style={{ fontSize: '0.92rem', lineHeight: '1.7', color: '#cbd5e1', whiteSpace: 'pre-line', margin: 0 }}>
                    {selectedResearch.summary}
                  </p>
                </div>

                {/* Section Detail Publikasi (Metadata Grid/Box) */}
                <div className="research-detail-meta-grid">
                  <div className="research-meta-box">
                    <span className="research-meta-label">Tahun Publikasi</span>
                    <span className="research-meta-val">{selectedResearch.year}</span>
                  </div>

                  <div className="research-meta-box">
                    <span className="research-meta-label">Jurnal / Prosiding</span>
                    <span className="research-meta-val">{selectedResearch.journalName}</span>
                  </div>

                  <div className="research-meta-box">
                    <span className="research-meta-label">Penulis / Researcher</span>
                    <span className="research-meta-val">{selectedResearch.researchers}</span>
                  </div>

                  <div className="research-meta-box">
                    <span className="research-meta-label">DOI / Tautan Publikasi</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span className="research-meta-val" style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {selectedResearch.doi || '-'}
                      </span>
                      {selectedResearch.doi && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
                          onClick={() => handleCopyDoi(selectedResearch.doi)}
                        >
                          {doiCopied ? 'Tersalin!' : 'Salin'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Button CTA Baca Publikasi (In-App Viewer) */}
                {selectedResearch.publicationUrl && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn-primary-purple"
                      onClick={() => {
                        setIsViewingDocument(true);
                        setIsPdfLoading(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.7rem 1.4rem',
                        fontWeight: 600,
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Baca Publikasi Lengkap</span>
                      <span>📖</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: EDIT AUTHOR PROFILE & PORTFOLIO TEMPLATE (ADMIN ONLY)           */}
      {/* ========================================================================= */}
      {isAdmin && isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-badge">Kustomisasi Portofolio</span>
                <h3>Sesuaikan Halaman Portofolio & Profil</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body">
              {/* Photo Input Field */}
              <div className="form-group">
                <label className="form-label">
                  <span>URL Foto Profil Penulis (atau gunakan Unggah Berkas)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/api/profile/avatar/image atau https://..."
                    value={editForm.photoUrl}
                    onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Unggah Berkas
                  </button>
                </div>
                <span className="form-hint">
                  Berkas foto disimpan secara permanen di database PostgreSQL via <code>POST /api/profile/avatar</code>.
                </span>
              </div>

              {/* Baris 1: Nama Lengkap & Username */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap (Tampil di Judul)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Lengkap"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username / Handle</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="username"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Baris 2: Peran / Profesi & Headline Profil */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Peran / Profesi (Pill Badge Hero)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Software Engineer"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Headline Profil (Baris Kedua Judul)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Headline profil"
                    value={editForm.headline}
                    onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Baris 3: Email Kontak & Tautan GitHub */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Kontak (Connect Section)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="nama@domain.com"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tautan GitHub (Connect & Activity Graph)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://github.com/username"
                    value={editForm.githubUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Manajemen Riset & Publikasi Ilmiah */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                      Manajemen Riset & Publikasi Ilmiah
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Kelola daftar publikasi ilmiah yang tersimpan di PostgreSQL
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderColor: '#8b5cf6', color: '#c084fc' }}
                    onClick={() => {
                      const newResearch = {
                        year: new Date().getFullYear().toString(),
                        journalName: 'Nama Jurnal / Prosiding',
                        title: 'Judul Riset Baru',
                        summary: 'Ringkasan atau abstrak publikasi penelitian ilmiah...',
                        researchers: editForm.fullName || editForm.name || 'Peneliti',
                        doi: '',
                        publicationUrl: '',
                        displayOrder: (editForm.researches?.length || 0) + 1
                      };
                      setEditForm({
                        ...editForm,
                        researches: [...(editForm.researches || []), newResearch]
                      });
                    }}
                  >
                    + Tambah Riset
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {editForm.researches && editForm.researches.length > 0 ? (
                    editForm.researches.map((res, rIdx) => (
                      <div
                        key={res.id || rIdx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '1rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc' }}>
                            Item Riset #{rIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editForm.researches.filter((_, idx) => idx !== rIdx);
                              setEditForm({ ...editForm, researches: updated });
                            }}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 600
                            }}
                            title="Hapus Riset"
                          >
                            Hapus
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Tahun</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                              value={res.year || ''}
                              onChange={(e) => {
                                const updated = [...editForm.researches];
                                updated[rIdx] = { ...updated[rIdx], year: e.target.value };
                                setEditForm({ ...editForm, researches: updated });
                              }}
                              placeholder="2026"
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Nama Jurnal / Prosiding</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                              value={res.journalName || ''}
                              onChange={(e) => {
                                const updated = [...editForm.researches];
                                updated[rIdx] = { ...updated[rIdx], journalName: e.target.value };
                                setEditForm({ ...editForm, researches: updated });
                              }}
                              placeholder="IEEE Access / Springer"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Judul Riset</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                            value={res.title || ''}
                            onChange={(e) => {
                              const updated = [...editForm.researches];
                              updated[rIdx] = { ...updated[rIdx], title: e.target.value };
                              setEditForm({ ...editForm, researches: updated });
                            }}
                            placeholder="Judul lengkap publikasi riset"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Nama Peneliti / Researcher</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                              value={res.researchers || ''}
                              onChange={(e) => {
                                const updated = [...editForm.researches];
                                updated[rIdx] = { ...updated[rIdx], researchers: e.target.value };
                                setEditForm({ ...editForm, researches: updated });
                              }}
                              placeholder="Raka AP, dkk."
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>DOI / Kode Sitasi</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                              value={res.doi || ''}
                              onChange={(e) => {
                                const updated = [...editForm.researches];
                                updated[rIdx] = { ...updated[rIdx], doi: e.target.value };
                                setEditForm({ ...editForm, researches: updated });
                              }}
                              placeholder="10.1109/ACCESS.2026.XXXX"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>URL Baca Publikasi (PDF / Jurnal)</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                            value={res.publicationUrl || ''}
                            onChange={(e) => {
                              const cleaned = cleanPublicationUrl(e.target.value);
                              const updated = [...editForm.researches];
                              updated[rIdx] = { ...updated[rIdx], publicationUrl: cleaned };
                              setEditForm({ ...editForm, researches: updated });
                            }}
                            placeholder="http://etd.repository.ugm.ac.id/... atau https://..."
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>Ringkasan Riset / Abstrak</label>
                          <textarea
                            className="form-input"
                            rows={3}
                            style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem', resize: 'vertical' }}
                            value={res.summary || ''}
                            onChange={(e) => {
                              const updated = [...editForm.researches];
                              updated[rIdx] = { ...updated[rIdx], summary: e.target.value };
                              setEditForm({ ...editForm, researches: updated });
                            }}
                            placeholder="Ringkasan abstrak riset..."
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Belum ada data riset. Klik tombol <strong>+ Tambah Riset</strong> untuk menambahkan publikasi baru.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary-purple">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
