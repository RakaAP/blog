import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, systemOnline, siteSettings, onOpenAdminLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleNav = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar">
        {/* Brand Logo (Dinamis dari PostgreSQL site_settings) */}
        <div className="nav-brand" onClick={() => handleNav('about')}>
          <div className="brand-avatar">{siteSettings?.brand_avatar || 'R'}</div>
          <div className="brand-text">
            <h1>{siteSettings?.brand_name || 'Rakadnp'}</h1>
            <p>{siteSettings?.brand_role || 'Software Engineer'}</p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleNav('about')}
            >
              Tentang
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => handleNav('projects')}
            >
              Project
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'research' ? 'active' : ''}`}
              onClick={() => handleNav('research')}
            >
              Riset
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'career' ? 'active' : ''}`}
              onClick={() => handleNav('career')}
            >
              Karir
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'blog' ? 'active' : ''}`}
              onClick={() => handleNav('blog')}
            >
              Blog
            </button>
          </li>
        </ul>

        {/* Right Section: DB Status, Admin Portal Toggle, Contact CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="status-badge" title="Status koneksi PostgreSQL database personalBlog">
            <span className={`status-dot ${systemOnline ? '' : 'error'}`}></span>
            <span>{systemOnline ? 'PostgreSQL Live' : 'Offline'}</span>
          </div>

          {/* Admin Portal Button */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                style={{ background: activeTab === 'admin' ? 'var(--primary)' : 'rgba(99, 102, 241, 0.2)', color: '#fff' }}
                onClick={() => handleNav('admin')}
              >
                <span>CMS Admin</span>
              </button>
              <button
                className="btn-icon"
                title="Keluar dari Admin"
                onClick={logout}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="btn-icon"
              title="Akses Admin Portal"
              onClick={onOpenAdminLogin}
              style={{ opacity: 0.8 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </button>
          )}

          {/* Contact CTA */}
          <button
            className="nav-cta-btn"
            onClick={() => handleNav('contact')}
          >
            <span>Mari Bicara</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu navigasi"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu open">
          <button className={`nav-link ${activeTab === 'about' ? 'active' : ''}`} onClick={() => handleNav('about')}>
            Tentang Saya & Profil
          </button>
          <button className={`nav-link ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleNav('projects')}>
            Software Projects
          </button>
          <button className={`nav-link ${activeTab === 'research' ? 'active' : ''}`} onClick={() => handleNav('research')}>
            Riset & Publikasi
          </button>
          <button className={`nav-link ${activeTab === 'career' ? 'active' : ''}`} onClick={() => handleNav('career')}>
            Perjalanan Karir
          </button>
          <button className={`nav-link ${activeTab === 'blog' ? 'active' : ''}`} onClick={() => handleNav('blog')}>
            Personal Blog
          </button>
          <button className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => handleNav('contact')}>
            Kontak & Kolaborasi ↗
          </button>
          {isAuthenticated ? (
            <button className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleNav('admin')}>
              ⚙️ CMS Dashboard Admin
            </button>
          ) : (
            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); onOpenAdminLogin(); }}>
              🔒 Login Admin Portal
            </button>
          )}
        </div>
      )}
    </header>
  );
}
