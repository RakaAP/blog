import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/context/AuthContext';

const DEFAULT_PROFILE = {
  name: 'Alex',
  fullName: 'Alex',
  role: 'Web Developer & Software Architect',
  headline: 'I build things for the web.',
  bio: "I'm a passionate web developer specializing in building exceptional digital experiences with modern technologies.",
  photoUrl: '/author.jpg',
  location: 'Jakarta, Indonesia',
  experience: '4+ Years Experience',
  githubUrl: 'https://github.com/rakandp',
  linkedinUrl: 'https://linkedin.com',
  email: 'hello@alexdev.com',
  phone: '+1 (555) 123-4567',
  cvUrl: '#',
  skills: [
    { name: 'HTML', percent: 95, icon: 'html', color: '#e34f26' },
    { name: 'CSS', percent: 90, icon: 'css', color: '#1572b6' },
    { name: 'JavaScript', percent: 90, icon: 'js', color: '#f7df1e' },
    { name: 'React.js', percent: 85, icon: 'react', color: '#61dafb' },
    { name: 'Next.js', percent: 80, icon: 'next', color: '#ffffff' },
    { name: 'TypeScript', percent: 85, icon: 'ts', color: '#3178c6' },
    { name: 'Node.js', percent: 80, icon: 'node', color: '#339933' },
    { name: 'Tailwind CSS', percent: 90, icon: 'tailwind', color: '#06b6d4' },
    { name: 'Git', percent: 85, icon: 'git', color: '#f05032' },
  ],
  testimonial: {
    quote: 'Alex is an exceptional developer who delivers high-quality work on time. His attention to detail and problem-solving skills are outstanding.',
    author: 'Sarah Johnson',
    role: 'CEO, TechStart',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  }
};

const DEFAULT_FEATURED_PROJECTS = [
  {
    id: 1,
    num: '01',
    title: 'E-Commerce Platform',
    desc: 'Full-stack e-commerce solution with modern UI/UX',
    tag: 'Next.js & PostgreSQL'
  },
  {
    id: 2,
    num: '02',
    title: 'Task Management App',
    desc: 'Collaborative task management application',
    tag: 'React & Spring Boot'
  },
  {
    id: 3,
    num: '03',
    title: 'Crypto Dashboard',
    desc: 'Real-time cryptocurrency tracking dashboard',
    tag: 'TypeScript & WebSockets'
  }
];

export default function AboutModule({ onNavigate, onCopyEmail, onToast, siteSettings }) {
  const { adminUser, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && adminUser?.role === 'ROLE_ADMIN';

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [featuredProjects, setFeaturedProjects] = useState(DEFAULT_FEATURED_PROJECTS);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(DEFAULT_PROFILE);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch Dynamic Author Profile from GET /api/profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        
        let parsedSkills = DEFAULT_PROFILE.skills;
        if (data.skillsJson) {
          try {
            const parsed = JSON.parse(data.skillsJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedSkills = parsed;
            }
          } catch (e) {
            console.error('Gagal mem-parse skills JSON:', e);
          }
        }

        let parsedTestimonial = DEFAULT_PROFILE.testimonial;
        if (data.testimonialJson) {
          try {
            const parsedT = JSON.parse(data.testimonialJson);
            if (parsedT && parsedT.quote) {
              parsedTestimonial = parsedT;
            }
          } catch (e) {
            console.error('Gagal mem-parse testimonial JSON:', e);
          }
        }

        const merged = {
          ...DEFAULT_PROFILE,
          ...data,
          fullName: data.fullName || data.name || DEFAULT_PROFILE.fullName,
          photoUrl: data.avatarUrl || '/author.jpg',
          skills: parsedSkills,
          testimonial: parsedTestimonial,
          cvUrl: data.cvUrl || DEFAULT_PROFILE.cvUrl,
          phone: data.phone || DEFAULT_PROFILE.phone
        };
        setProfile(merged);
        setEditForm(merged);
      }
    } catch (e) {
      console.warn('Gagal memuat profil dari server, menggunakan data bawaan:', e);
    }
  };

  // 2. Fetch Projects from GET /api/projects for the Featured Projects section
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.slice(0, 3).map((p, idx) => ({
            id: p.id,
            num: String(idx + 1).padStart(2, '0'),
            title: p.title,
            desc: p.description || p.details || 'Aplikasi produksi performa tinggi dengan arsitektur modern.',
            tag: p.tags || p.category || 'Fullstack'
          }));
          setFeaturedProjects(mapped);
        }
      }
    } catch {
      // Fallback to DEFAULT_FEATURED_PROJECTS
    }
  };

  useEffect(() => {
    fetchProfile();
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

  // Simpan Pembaruan Profil: PUT /api/profile
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
        githubUrl: editForm.githubUrl,
        linkedinUrl: editForm.linkedinUrl,
        email: editForm.email,
        phone: editForm.phone,
        cvUrl: editForm.cvUrl,
        skillsJson: JSON.stringify(editForm.skills),
        testimonialJson: JSON.stringify(editForm.testimonial)
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
        let parsedSkills = editForm.skills;
        if (data.skillsJson) {
          try {
            parsedSkills = JSON.parse(data.skillsJson);
          } catch { }
        }
        let parsedTestimonial = editForm.testimonial;
        if (data.testimonialJson) {
          try {
            parsedTestimonial = JSON.parse(data.testimonialJson);
          } catch { }
        }

        const merged = {
          ...editForm,
          ...data,
          photoUrl: data.avatarUrl || editForm.photoUrl,
          skills: parsedSkills,
          testimonial: parsedTestimonial
        };
        setProfile(merged);
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
    <section id="module-about" className="modern-portfolio-theme">
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

      {/* ========================================================================= */}
      {/* 1. HERO BANNER SECTION                                                   */}
      {/* ========================================================================= */}
      <div className="portfolio-hero-container">
        {/* Left Column: Headline, Bio, Buttons, Tech Logos */}
        <div className="portfolio-hero-text">
          <div className="hero-pill-badge">
            <span className="pill-dot"></span>
            <span>I'M A {profile.role ? profile.role.toUpperCase() : 'WEB DEVELOPER'}</span>
          </div>

          <h1 className="hero-main-title">
            Hi, I’m <span className="gradient-name">{profile.fullName || profile.name || 'Alex'}</span>
            <br />
            <span className="headline-secondary">{profile.headline || 'I build things for the web.'}</span>
          </h1>

          <p className="hero-sub-bio">
            {profile.bio || "I'm a passionate web developer specializing in building exceptional digital experiences with modern technologies."}
          </p>

          <div className="hero-button-group">
            <button className="btn-primary-purple" onClick={() => onNavigate('projects')}>
              <span>View My Work</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>

            <a 
              href={profile.cvUrl && profile.cvUrl !== '#' ? profile.cvUrl : '#'} 
              download
              className="btn-secondary-dark"
              onClick={(e) => {
                if (!profile.cvUrl || profile.cvUrl === '#') {
                  e.preventDefault();
                  if (onToast) onToast('Berkas CV dapat diunduh atau diperbarui melalui tombol Sesuaikan di akun Admin.');
                }
              }}
            >
              <span>Download CV</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
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

        {/* Right Column: Circular Glowing Backdrop & Photo + Floating Code Card */}
        <div className="portfolio-hero-visual">
          <div className="hero-circle-stage">
            {/* Ambient Purple Glowing Sphere */}
            <div className="purple-glow-sphere"></div>

            {/* Author Portrait Image */}
            <div className="author-photo-wrapper">
              {!imageError && profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={`${profile.name} - Portrait`}
                  className="author-portrait-img"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="author-portrait-fallback">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{profile.name}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ABOUT ME & 2x2 STATS SECTION                                          */}
      {/* ========================================================================= */}
      <div className="about-me-section">
        <div className="about-narrative-card">
          <span className="section-pill-tag">ABOUT ME</span>
          <h3 className="about-narrative-title">I’m passionate about creating digital solutions</h3>
          <p className="about-narrative-desc">
            With {siteSettings?.stats_experience || profile.experience || '4+'} of experience in web development, I help businesses and individuals bring their ideas to life through clean, efficient, and user-friendly code.
          </p>
          <button className="btn-learn-more" onClick={() => onNavigate('contact')}>
            <span>Learn More About Me</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>

        {/* 2x2 Stats Grid with Purple Icon Squares */}
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
              <div className="stat-number">{siteSettings?.stats_experience || '4+'}</div>
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
              <div className="stat-number">{siteSettings?.stats_projects || '50+'}</div>
              <div className="stat-label">Projects Completed</div>
            </div>
          </div>

          {/* Card 3: Happy Clients */}
          <div className="about-stat-card">
            <div className="stat-icon-square purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <div className="stat-card-text">
              <div className="stat-number">{siteSettings?.stats_clients || '30+'}</div>
              <div className="stat-label">Happy Clients</div>
            </div>
          </div>

          {/* Card 4: Satisfaction */}
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
              <div className="stat-number">{siteSettings?.stats_uptime || '100%'}</div>
              <div className="stat-label">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MY SKILLS ("Technologies I Master")                                   */}
      {/* ========================================================================= */}
      <div className="skills-master-section">
        <div className="section-centered-header">
          <span className="section-pill-tag">MY SKILLS</span>
          <h3 className="section-title-large">Technologies I Master</h3>
        </div>

        <div className="skills-progress-grid">
          {profile.skills?.map((skill, idx) => (
            <div key={idx} className="skill-progress-item">
              <div className="skill-item-header">
                <div className="skill-item-brand">
                  {renderTechIcon(skill.icon)}
                  <span className="skill-item-name">{skill.name}</span>
                </div>
                <span className="skill-item-percent">{skill.percent}%</span>
              </div>
              <div className="skill-track-bar">
                <div
                  className="skill-fill-bar"
                  style={{ width: `${skill.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FEATURED PROJECTS ("Some of My Recent Work")                           */}
      {/* ========================================================================= */}
      <div className="featured-projects-section">
        <div className="section-centered-header">
          <span className="section-pill-tag">FEATURED PROJECTS</span>
          <h3 className="section-title-large">Some of My Recent Work</h3>
        </div>

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

        {/* Carousel Pagination Dots */}
        <div className="featured-carousel-dots">
          <span className="carousel-dot active"></span>
          <span className="carousel-dot"></span>
          <span className="carousel-dot"></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM SECTION: WORK TOGETHER, TESTIMONIAL, FOLLOW ME                  */}
      {/* ========================================================================= */}
      <div className="bottom-portfolio-strip">
        {/* Left: Let's Work Together */}
        <div className="bottom-card work-together-box">
          <span className="strip-subtitle">LET'S WORK TOGETHER</span>
          <h3 className="bottom-card-title">Have a project in mind?</h3>
          <p className="bottom-card-desc">
            I'm always open to discussing new projects and opportunities. Let's create something amazing together!
          </p>
          <button className="btn-get-in-touch" onClick={() => onNavigate('contact')}>
            <span>Get In Touch</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>

        {/* Middle: Testimonial Quote Card */}
        <div className="bottom-card testimonial-card">
          <div className="testimonial-quote-icon">❝</div>
          <p className="testimonial-text">
            {profile.testimonial?.quote || 'Alex is an exceptional developer who delivers high-quality work on time. His attention to detail and problem-solving skills are outstanding.'}
          </p>
          <div className="testimonial-author-row">
            <img
              src={profile.testimonial?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
              alt={profile.testimonial?.author || 'Sarah Johnson'}
              className="testimonial-avatar-thumb"
            />
            <div className="testimonial-meta">
              <h5 className="testimonial-author-name">{profile.testimonial?.author || 'Sarah Johnson'}</h5>
              <span className="testimonial-author-role">{profile.testimonial?.role || 'CEO, TechStart'}</span>
            </div>
          </div>
        </div>

        {/* Right: Follow Me & Direct Contacts */}
        <div className="bottom-card follow-contacts-box">
          <span className="strip-subtitle">FOLLOW ME</span>
          
          <div className="follow-social-icons">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="social-circle-btn" title="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-circle-btn" title="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            )}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" title="Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>

          <div className="contact-info-list">
            <div className="contact-item-row" onClick={() => onCopyEmail && onCopyEmail(profile.email || 'hello@alexdev.com')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>{profile.email || 'hello@alexdev.com'}</span>
            </div>

            <div className="contact-item-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{profile.phone || '+1 (555) 123-4567'}</span>
            </div>
          </div>
        </div>
      </div>

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
                  Berkas foto akan disimpan di PostgreSQL & storage server via <code>POST /api/profile/avatar</code>.
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap (Tampil di Judul)</label>
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
                <label className="form-label">Peran / Profesi (Pill Badge Hero)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Web Developer, Software Architect, dll"
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
                  placeholder="I build things for the web."
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Bio Penulis (Paragraf Hero)</label>
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
                  <label className="form-label">Tautan Berkas CV (Download CV)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/cv.pdf atau link Google Drive"
                    value={editForm.cvUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, cvUrl: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Kontak / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Kontak</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Pengalaman (Teks Badge)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.experience || ''}
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

              {/* Edit Skills & Percentages */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                  Keahlian & Persentase Bar (Technologies I Master)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {editForm.skills?.map((sk, sIdx) => (
                    <div key={sIdx} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sk.name}</span>
                        <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 700 }}>{sk.percent}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={sk.percent}
                        onChange={(e) => {
                          const updated = [...editForm.skills];
                          updated[sIdx] = { ...updated[sIdx], percent: parseInt(e.target.value, 10) };
                          setEditForm({ ...editForm, skills: updated });
                        }}
                        style={{ width: '100%', accentColor: '#818cf8', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Testimonial */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                  Kutipan Testimoni (Testimonial Card)
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Isi testimoni atau quote pengembang..."
                  value={editForm.testimonial?.quote || ''}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    testimonial: { ...editForm.testimonial, quote: e.target.value }
                  })}
                />
                <div className="form-row" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Pemberi Testimoni (misal: Sarah Johnson)"
                    value={editForm.testimonial?.author || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      testimonial: { ...editForm.testimonial, author: e.target.value }
                    })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jabatan / Perusahaan (misal: CEO, TechStart)"
                    value={editForm.testimonial?.role || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      testimonial: { ...editForm.testimonial, role: e.target.value }
                    })}
                  />
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
    </section>
  );
}
