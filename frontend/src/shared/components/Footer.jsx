import React from 'react';

export default function Footer({ onNavigate, siteSettings, isLoadingSettings }) {
  return (
    <footer className="app-container">
      <div className="app-footer">
        <div>
          {isLoadingSettings ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="ui-skeleton" style={{ width: '210px', height: '16px' }} />
              <span className="ui-skeleton" style={{ width: '320px', height: '12px' }} />
            </div>
          ) : (
            <>
              <p style={{ fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                {siteSettings?.brand_name || ''}
                {siteSettings?.brand_name && siteSettings?.brand_role ? ' • ' : ''}
                {siteSettings?.brand_role || ''}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {siteSettings?.footer_text || ''}
              </p>
            </>
          )}
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
