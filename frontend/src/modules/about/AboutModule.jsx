import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/context/AuthContext';

const DEFAULT_PROFILE = {
  name: 'Rakadnp',
  fullName: 'Raka Dwi P.',
  role: 'Software Engineer & Technical Researcher',
  availability: '',
  headline: 'Membangun Sistem Tangguh, Skalabel & Berkinerja Tinggi.',
  bio: 'Halo! Saya Rakadnp, seorang Software Engineer & Researcher yang berfokus pada arsitektur sistem backend berdaya tahan tinggi menggunakan Java Spring Boot dan PostgreSQL, dipadukan dengan pengalaman frontend interaktif menggunakan React.',
  photoUrl: '/author.jpg',
  location: 'Jakarta, Indonesia',
  experience: '5+ Tahun Pengalaman',
  specialization: '☕ Backend & System Architect',
  status: 'Aktif Menulis & Riset',
  githubUrl: 'https://github.com/rakandp',
  linkedinUrl: 'https://linkedin.com',
  email: 'rakandp.dev@gmail.com',
  highlights: [
    {
      id: 1,
      icon: '⚡',
      title: 'Backend Architecture & Scalability',
      desc: 'Pengembangan arsitektur backend tangguh berbasis Java 21, Spring Boot 4, dan microservices berkinerja tinggi.'
    },
    {
      id: 2,
      icon: '🗄️',
      title: 'Database & Concurrency Tuning',
      desc: 'Optimasi query PostgreSQL, pooling koneksi HikariCP, serta integritas data untuk throughput tinggi.'
    },
    {
      id: 3,
      icon: '🔬',
      title: 'Riset Teknologi & Analisis',
      desc: 'Eksplorasi mendalam benchmarking performa sistem, rekayasa software, dan publikasi riset terstruktur.'
    },
    {
      id: 4,
      icon: '🛡️',
      title: 'Reliabilitas & Clean Code',
      desc: 'Komitmen pada standar uptime 99.9%, fault-tolerance teruji, dan maintainability arsitektur jangka panjang.'
    }
  ]
};

export default function AboutModule({ onNavigate, onCopyEmail, onToast, siteSettings }) {
  const { adminUser, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && adminUser?.role === 'ROLE_ADMIN';

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(DEFAULT_PROFILE);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Ambil data profil dari endpoint publik /api/profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        let parsedHighlights = DEFAULT_PROFILE.highlights;
        if (data.highlightsJson) {
          try {
            parsedHighlights = JSON.parse(data.highlightsJson);
          } catch (e) {
            console.error('Gagal mem-parse highlights JSON:', e);
          }
        }
        const merged = {
          ...data,
          photoUrl: data.avatarUrl || '/author.jpg',
          highlights: parsedHighlights
        };
        setProfile(merged);
        setEditForm(merged);
      }
    } catch (e) {
      console.warn('Gagal memuat profil dari server, menggunakan data bawaan:', e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Upload Avatar ke Endpoint Terproteksi: POST /api/profile/avatar
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
        if (onToast) onToast('Foto profil penulis berhasil diunggah ke server!');
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
    setEditForm(profile);
    setIsEditModalOpen(true);
  };

  // Simpan Pembaruan Profil ke Endpoint Terproteksi: PUT /api/profile
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      if (onToast) onToast('Akses ditolak: Anda harus terautentikasi sebagai Admin.', 'error');
      return;
    }

    try {
      const payload = {
        name: editForm.name,
        fullName: editForm.fullName,
        role: editForm.role,
        headline: editForm.headline,
        bio: editForm.bio,
        avatarUrl: editForm.photoUrl,
        location: editForm.location,
        experience: editForm.experience,
        specialization: editForm.specialization,
        status: editForm.status,
        availability: editForm.availability,
        githubUrl: editForm.githubUrl,
        linkedinUrl: editForm.linkedinUrl,
        email: editForm.email,
        highlightsJson: JSON.stringify(editForm.highlights)
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
        let parsedHighlights = editForm.highlights;
        if (data.highlightsJson) {
          try {
            parsedHighlights = JSON.parse(data.highlightsJson);
          } catch { }
        }
        setProfile({
          ...data,
          photoUrl: data.avatarUrl || editForm.photoUrl,
          highlights: parsedHighlights
        });
        setIsEditModalOpen(false);
        setImageError(false);
        if (onToast) onToast('Profil penulis & highlight berhasil diperbarui di database!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (onToast) onToast(errorData.message || 'Gagal memperbarui profil di server', 'error');
      }
    } catch {
      if (onToast) onToast('Gagal terhubung ke backend untuk memperbarui profil', 'error');
    }
  };

  const handleResetDefault = () => {
    if (window.confirm('Kembalikan isian formulir ke data default?')) {
      setEditForm(DEFAULT_PROFILE);
    }
  };

  const handleHighlightChange = (index, field, value) => {
    const updatedHighlights = [...editForm.highlights];
    updatedHighlights[index] = { ...updatedHighlights[index], [field]: value };
    setEditForm({ ...editForm, highlights: updatedHighlights });
  };

  return (
    <section id="module-about">
      {/* Hidden File Input for Direct Photo Upload (Hanya digunakan saat Admin) */}
      {isAdmin && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}

      {/* Hero Author Profile Card */}
      <div className="hero-card author-profile-hero">
        {/* Top Meta Bar */}
        <div className="hero-top-bar">
          <div className="hero-badges-wrapper">
            <span className="profile-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profil Penulis
            </span>
          </div>

          {/* KONTROL ADMIN: Tombol "Sesuaikan Profil" HANYA dirender jika pengguna login sebagai ADMIN */}
          {isAdmin && (
            <button
              className="btn-edit-profile"
              onClick={handleOpenEdit}
              title="Ubah info profil, foto, atau highlight (Khusus Admin)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Sesuaikan Profil</span>
            </button>
          )}
        </div>

        {/* Hero Content Grid: Author Info & Dedicated Photo Column */}
        <div className="hero-profile-grid">
          {/* Main Info Column */}
          <div className="hero-profile-main">
            <div className="author-name-tag">
              <h1 className="author-display-name">{profile.fullName || profile.name}</h1>
              <span className="author-handle">(@{profile.name})</span>
              <span className="author-role-tag">{profile.role}</span>
            </div>

            <h2 className="hero-headline">
              {profile.headline}
            </h2>

            <p className="hero-bio">
              {profile.bio}
            </p>

            {/* Author Highlights Section (Sorotan & Fokus Utama) */}
            <div className="hero-highlights-container">
              <div className="highlights-header">
                <div className="highlights-title-group">
                  <span className="highlights-icon">✨</span>
                  <span className="highlights-title">Highlight & Keahlian Utama Penulis</span>
                </div>
                <span className="highlights-sub">Fokus teknis & metodologi sistem</span>
              </div>

              <div className="hero-highlights-grid">
                {profile.highlights?.map((hl) => (
                  <div key={hl.id} className="highlight-item-card">
                    <div className="highlight-item-icon">{hl.icon}</div>
                    <div className="highlight-item-content">
                      <h4 className="highlight-item-title">{hl.title}</h4>
                      <p className="highlight-item-desc">{hl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="hero-actions-container">

              {/* Quick Social Links */}
              <div className="author-social-links">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    title="Lihat Repositori GitHub"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                )}

                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    title="Hubungkan di LinkedIn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}

                <button
                  className="social-btn"
                  onClick={() => onCopyEmail(profile.email || 'rakandp.dev@gmail.com')}
                  title="Salin Kontak Email"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Kontak</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Photo & Author Highlights Column */}
          <div className="hero-profile-photo-col">
            <div className="author-photo-card">
              {/* Photo Frame Container */}
              <div className="author-photo-frame">
                {!imageError && profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={`${profile.name} - Foto Penulis`}
                    className="author-avatar-img"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="author-avatar-fallback">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{profile.name}</span>
                  </div>
                )}
              </div>

              {/* KONTROL ADMIN: Tombol "Ganti / Unggah Foto" HANYA dirender jika pengguna login sebagai ADMIN */}
              {isAdmin && (
                <div className="author-photo-controls">
                  <button
                    type="button"
                    className="btn-upload-photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Klik untuk memilih foto profil baru dari komputer Anda (Khusus Admin)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{isUploading ? 'Mengunggah...' : 'Ganti / Unggah Foto'}</span>
                  </button>
                </div>
              )}

              {/* Author Quick Meta */}
              <div className="author-quick-meta">
                <div className="meta-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{profile.location}</span>
                </div>
                <div className="meta-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>{profile.experience}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid (Dinamis dari PostgreSQL site_settings) */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{siteSettings?.stats_experience || profile.experience || '5+'}</div>
          <div className="stat-label">Tahun Pengalaman Engineering</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{siteSettings?.stats_projects || '20+'}</div>
          <div className="stat-label">Proyek Produksi Terkirim</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{siteSettings?.stats_research || '5'}</div>
          <div className="stat-label">Karya Riset & Analisis Arsitektur</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{siteSettings?.stats_uptime || '99.9%'}</div>
          <div className="stat-label">Integritas Kode & Uptime</div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="section-header">
        <span className="section-tag">Keahlian & Teknologi</span>
        <h3 className="section-title">Teknologi Utama yang Digunakan</h3>
        <p className="section-desc">Pondasi teknologi yang telah teruji untuk menghadirkan solusi stabil dan efisien.</p>
      </div>

      <div className="skills-container">
        <div className="skill-category-card">
          <h4 className="skill-category-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#a5b4fc">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            Backend & Database
          </h4>
          <div className="chips-wrapper">
            <span className="tech-chip">Java 21</span>
            <span className="tech-chip">Spring Boot 4</span>
            <span className="tech-chip">Spring Data JPA</span>
            <span className="tech-chip">PostgreSQL</span>
            <span className="tech-chip">Hibernate</span>
            <span className="tech-chip">RESTful APIs</span>
            <span className="tech-chip">Microservices</span>
            <span className="tech-chip">HikariCP</span>
          </div>
        </div>

        <div className="skill-category-card">
          <h4 className="skill-category-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#67e8f9">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Frontend & User Experience
          </h4>
          <div className="chips-wrapper">
            <span className="tech-chip">React 19</span>
            <span className="tech-chip">Vite</span>
            <span className="tech-chip">Modern JavaScript</span>
            <span className="tech-chip">Vanilla CSS3</span>
            <span className="tech-chip">Glassmorphism</span>
            <span className="tech-chip">Responsive Web</span>
          </div>
        </div>

        <div className="skill-category-card">
          <h4 className="skill-category-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#6ee7b7">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            DevOps & Metodologi
          </h4>
          <div className="chips-wrapper">
            <span className="tech-chip">Docker</span>
            <span className="tech-chip">Docker Compose</span>
            <span className="tech-chip">Git & GitHub</span>
            <span className="tech-chip">CI/CD Pipelines</span>
            <span className="tech-chip">Query Benchmarking</span>
          </div>
        </div>
      </div>

      {/* Modal: Edit Author Profile & Highlights (Hanya dirender jika Admin) */}
      {isAdmin && isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-badge">Kustomisasi Admin</span>
                <h3>Sesuaikan Profil Penulis & Highlight</h3>
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
                    placeholder="/author.jpg atau https://..."
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
                  Berkas foto akan dikirim via endpoint terproteksi <code>POST /api/profile/avatar</code>.
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Penulis</label>
                  <input
                    type="text"
                    className="form-input"
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
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Peran / Posisi Profesional</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Headline Profil</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Bio Penulis</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lokasi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Pengalaman</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.experience}
                    onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tautan GitHub</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.githubUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tautan LinkedIn</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.linkedinUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Edit Highlights */}
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 700 }}>
                  Sorotan & Highlight Penulis (4 Poin Utama)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editForm.highlights?.map((hl, idx) => (
                    <div key={hl.id || idx} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ textAlign: 'center', fontSize: '1.2rem', padding: '0.4rem' }}
                          value={hl.icon}
                          onChange={(e) => handleHighlightChange(idx, 'icon', e.target.value)}
                          placeholder="⚡"
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={hl.title}
                          onChange={(e) => handleHighlightChange(idx, 'title', e.target.value)}
                          placeholder="Judul Highlight"
                        />
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={hl.desc}
                        onChange={(e) => handleHighlightChange(idx, 'desc', e.target.value)}
                        placeholder="Deskripsi singkat sorotan..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn-text-danger"
                  onClick={handleResetDefault}
                >
                  Isi Data Bawaan
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary">
                    Simpan ke Database (PUT /api/profile)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
