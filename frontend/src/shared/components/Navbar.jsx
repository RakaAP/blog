import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  activeSection,
  onSectionNavigate,
  systemOnline,
  siteSettings,
  isLoadingSettings,
  onOpenAdminLogin,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleSectionOrTab = (sectionId, tabName) => {
    setMobileMenuOpen(false);

    // If navigating to an independent tab (like blog, research, career, admin)
    if (tabName && tabName !== 'about') {
      setActiveTab(tabName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If currently not on the portfolio/about tab, switch to it first then scroll
    if (activeTab !== 'about') {
      setActiveTab('about');
      setTimeout(() => {
        if (onSectionNavigate) onSectionNavigate(sectionId);
      }, 80);
    } else {
      if (onSectionNavigate) onSectionNavigate(sectionId);
    }
  };

  const isSectionActive = (secId) => {
    return activeTab === 'about' && activeSection === secId;
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar">
        {/* Brand Logo (Murni dari PostgreSQL site_settings) */}
        <div className="nav-brand" onClick={() => handleSectionOrTab('hero', 'about')}>
          {isLoadingSettings ? (
            <>
              <span className="ui-skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
              <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span className="ui-skeleton" style={{ width: '110px', height: '14px' }} />
                <span className="ui-skeleton" style={{ width: '85px', height: '10px' }} />
              </div>
            </>
          ) : (
            <>
              <div className="brand-avatar">{siteSettings?.brand_avatar || ''}</div>
              <div className="brand-text">
                <h1>{siteSettings?.brand_name || ''}</h1>
                <p>{siteSettings?.brand_role || ''}</p>
              </div>
            </>
          )}
        </div>

        {/* Desktop Nav Links (Synchronized with Full-Page Scroll Sections) */}
        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${isSectionActive('hero') ? 'active' : ''}`}
              onClick={() => handleSectionOrTab('hero', 'about')}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${isSectionActive('about') ? 'active' : ''}`}
              onClick={() => handleSectionOrTab('about', 'about')}
            >
              About
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${isSectionActive('research') ? 'active' : ''}`}
              onClick={() => handleSectionOrTab('research', 'about')}
            >
              Riset
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${isSectionActive('projects') ? 'active' : ''}`}
              onClick={() => handleSectionOrTab('projects', 'about')}
            >
              Projects
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${isSectionActive('blog') ? 'active' : ''}`}
              onClick={() => handleSectionOrTab('blog', 'about')}
            >
              Blog
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${isSectionActive('contact') ? 'active' : ''}`}
              onClick={() => handleSectionOrTab('contact', 'about')}
            >
              Contact
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
                style={{ background: activeTab === 'admin' ? 'var(--primary)' : 'rgba(99, 102, 241, 0.2)', color: '#fff', borderRadius: '6px', padding: '0.35rem 0.75rem' }}
                onClick={() => handleSectionOrTab(null, 'admin')}
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

          {/* Hire Me / Contact CTA */}
          <button
            className="nav-cta-btn"
            onClick={() => handleSectionOrTab('contact', 'about')}
            title="Lompat ke bagian Kontak & Kolaborasi"
          >
            <span>Hire Me</span>
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
          <button className={`nav-link ${isSectionActive('hero') ? 'active' : ''}`} onClick={() => handleSectionOrTab('hero', 'about')}>
            Home (Hero)
          </button>
          <button className={`nav-link ${isSectionActive('about') ? 'active' : ''}`} onClick={() => handleSectionOrTab('about', 'about')}>
            About Me & Statistik
          </button>
          <button className={`nav-link ${isSectionActive('research') ? 'active' : ''}`} onClick={() => handleSectionOrTab('research', 'about')}>
            Riset & Publikasi
          </button>
          <button className={`nav-link ${isSectionActive('projects') ? 'active' : ''}`} onClick={() => handleSectionOrTab('projects', 'about')}>
            Featured Projects
          </button>
          <button className={`nav-link ${isSectionActive('blog') ? 'active' : ''}`} onClick={() => handleSectionOrTab('blog', 'about')}>
            Personal Blog
          </button>
          <button className={`nav-link ${isSectionActive('contact') ? 'active' : ''}`} onClick={() => handleSectionOrTab('contact', 'about')}>
            Kontak & Kolaborasi ↗
          </button>
          {isAuthenticated ? (
            <button className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleSectionOrTab(null, 'admin')}>
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
