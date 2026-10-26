import React from 'react';

export default function Footer({ onNavigate, siteSettings }) {
  return (
    <footer className="app-container">
      <div className="app-footer">
        <div>
          <p style={{ fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
            {siteSettings?.brand_name || 'Rakadnp'} &bull; {siteSettings?.brand_role || 'Software Engineer'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {siteSettings?.footer_text || 'Modular Architecture with Java 21 Spring Boot 4, PostgreSQL (personalBlog), React 19 & Vite.'}
          </p>
        </div>

        <div className="footer-nav">
          <span className="footer-link" onClick={() => onNavigate('about')}>Tentang</span>
          <span className="footer-link" onClick={() => onNavigate('projects')}>Project</span>
          <span className="footer-link" onClick={() => onNavigate('research')}>Riset</span>
          <span className="footer-link" onClick={() => onNavigate('career')}>Karir</span>
          <span className="footer-link" onClick={() => onNavigate('blog')}>Blog</span>
          <span className="footer-link" onClick={() => onNavigate('contact')}>Kontak</span>
        </div>
      </div>
    </footer>
  );
}
