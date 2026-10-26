import React, { useState, useEffect } from 'react';

export default function ProjectsModule() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects?type=project');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.toLowerCase().includes(q))
    );
  });

  return (
    <section id="module-projects">
      <div className="section-header">
        <span className="section-tag">Software Engineering</span>
        <h2 className="section-title">Software Projects</h2>
        <p className="section-desc">Koleksi aplikasi web, sistem terdistribusi, dan platform fullstack yang dibangun untuk skalabilitas dan efisiensi.</p>
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
            placeholder="Cari project atau teknologi (cth: Spring Boot, PostgreSQL, Docker)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p className="empty-subtitle">Memuat data proyek dari PostgreSQL...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">Tidak ada project yang ditemukan</h3>
          <p className="empty-subtitle">Coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map(item => (
            <div key={item.id} className="project-card">
              <div className="project-badge-row">
                <span className="project-type-badge badge-project">💻 Software Project</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
              </div>

              <h3 className="project-title">{item.title}</h3>
              <p className="project-desc">{item.description}</p>

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
                  onClick={() => setSelectedProject(item)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span>Quick View</span>
                </button>

                {item.demoUrl && item.demoUrl !== '#' && (
                  <a href={item.demoUrl} target="_blank" rel="noreferrer" className="btn-card-action">
                    <span>Live Demo ↗</span>
                  </a>
                )}

                {item.repoUrl && item.repoUrl !== '#' && (
                  <a href={item.repoUrl} target="_blank" rel="noreferrer" className="btn-card-action">
                    <span>GitHub ↗</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="project-type-badge badge-project" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
                  Software Project
                </span>
                <h3 className="modal-title">{selectedProject.title}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedProject(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deskripsi</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {selectedProject.description}
              </p>
            </div>

            {selectedProject.details && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arsitektur & Implementasi</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {selectedProject.details}
                </p>
              </div>
            )}

            {selectedProject.tags && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teknologi yang Digunakan</h4>
                <div className="chips-wrapper">
                  {selectedProject.tags.split(',').map(tag => (
                    <span key={tag.trim()} className="tech-chip">{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedProject(null)}>
                Tutup
              </button>
              {selectedProject.repoUrl && selectedProject.repoUrl !== '#' && (
                <a href={selectedProject.repoUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  Buka Repositori ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
