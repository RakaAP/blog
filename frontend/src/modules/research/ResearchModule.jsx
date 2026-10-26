import React, { useState, useEffect } from 'react';

export default function ResearchModule() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);

  const fetchResearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects?type=research');
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, []);

  const filteredPapers = papers.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.toLowerCase().includes(q)) ||
      (p.venue && p.venue.toLowerCase().includes(q))
    );
  });

  return (
    <section id="module-research">
      <div className="section-header">
        <span className="section-tag">Riset & Publikasi</span>
        <h2 className="section-title">Kajian Ilmiah & Arsitektur</h2>
        <p className="section-desc">Publikasi riset empiris dan studi banding arsitektur perangkat lunak untuk sistem berskala tinggi.</p>
      </div>

      {/* Toolbar Search */}
      <div className="toolbar">
        <div className="search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Cari riset berdasarkan topik, jurnal, atau kata kunci..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p className="empty-subtitle">Memuat data riset dari PostgreSQL...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">Tidak ada publikasi riset ditemukan</h3>
          <p className="empty-subtitle">Coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredPapers.map(item => (
            <div key={item.id} className="project-card">
              <div className="project-badge-row">
                <span className="project-type-badge badge-research">📑 Riset / Paper</span>
                {item.doi && <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DOI: {item.doi}</span>}
              </div>

              <h3 className="project-title">{item.title}</h3>
              <p className="project-desc">{item.description}</p>

              {item.venue && (
                <div style={{ fontSize: '0.82rem', color: '#d8b4fe', marginBottom: '0.8rem', fontStyle: 'italic' }}>
                  Dipublikasikan pada: {item.venue}
                </div>
              )}

              {item.tags && (
                <div className="project-tags">
                  {item.tags.split(',').map(tag => (
                    <span key={tag.trim()} className="project-tag">{tag.trim()}</span>
                  ))}
                </div>
              )}

              <div className="project-links">
                <button 
                  className="btn-card-action"
                  onClick={() => setSelectedPaper(item)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span>Baca Abstrak</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Abstract Modal */}
      {selectedPaper && (
        <div className="modal-overlay" onClick={() => setSelectedPaper(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="project-type-badge badge-research" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
                  Publikasi Ilmiah
                </span>
                <h3 className="modal-title">{selectedPaper.title}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedPaper(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {selectedPaper.venue && (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#d8b4fe' }}>
                <strong>Publikasi:</strong> {selectedPaper.venue} {selectedPaper.doi && <span>&bull; DOI: {selectedPaper.doi}</span>}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abstrak Riset</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {selectedPaper.description}
              </p>
            </div>

            {selectedPaper.details && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metodologi & Hasil Temuan</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {selectedPaper.details}
                </p>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedPaper(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
