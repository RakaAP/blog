import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';

export default function AdminDashboard({ onToast, onOpenLogin, siteSettings = {}, onSettingsUpdated }) {
  const { adminUser, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('projects'); // 'projects' | 'research' | 'career' | 'blog' | 'inbox' | 'settings'

  // Data State
  const [projects, setProjects] = useState([]);
  const [careers, setCareers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (siteSettings && Object.keys(siteSettings).length > 0) {
      setSettingsForm(siteSettings);
    }
  }, [siteSettings]);

  // Modal / Form Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState('project'); // 'project' | 'research' | 'career' | 'blog'
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [projectForm, setProjectForm] = useState({
    title: '', category: 'Software Projects', type: 'project',
    description: '', details: '', tags: '', demoUrl: '', repoUrl: '', venue: '', doi: ''
  });

  const [careerForm, setCareerForm] = useState({
    role: '', company: '', period: '', type: 'work',
    summary: '', achievements: '', skills: ''
  });

  const [blogForm, setBlogForm] = useState({
    title: '', content: '', author: 'Admin', category: 'Technology'
  });

  // Auth header helper
  const getAuthHeader = () => {
    return adminUser?.token ? { 'Authorization': `Bearer ${adminUser.token}` } : {};
  };

  // Fetch all CMS data from PostgreSQL
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projRes, careerRes, postRes, inboxRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/career'),
        fetch('/api/posts'),
        fetch('/api/contact')
      ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (careerRes.ok) setCareers(await careerRes.json());
      if (postRes.ok) setPosts(await postRes.json());
      if (inboxRes.ok) setInbox(await inboxRes.json());
    } catch {
      onToast('Gagal memuat beberapa data CMS dari server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Open Form Handlers
  const handleOpenProjectForm = (item = null, type = 'project') => {
    setEditorType(type);
    setEditingItem(item);
    if (item) {
      setProjectForm({
        title: item.title || '',
        category: item.category || (type === 'project' ? 'Software Projects' : 'Riset & Publikasi'),
        type: item.type || type,
        description: item.description || '',
        details: item.details || '',
        tags: item.tags || '',
        demoUrl: item.demoUrl || '',
        repoUrl: item.repoUrl || '',
        venue: item.venue || '',
        doi: item.doi || ''
      });
    } else {
      setProjectForm({
        title: '',
        category: type === 'project' ? 'Software Projects' : 'Riset & Publikasi',
        type: type,
        description: '',
        details: '',
        tags: '',
        demoUrl: '',
        repoUrl: '',
        venue: '',
        doi: ''
      });
    }
    setIsEditorOpen(true);
  };

  const handleOpenCareerForm = (item = null) => {
    setEditorType('career');
    setEditingItem(item);
    if (item) {
      setCareerForm({
        role: item.role || '',
        company: item.company || '',
        period: item.period || '',
        type: item.type || 'work',
        summary: item.summary || '',
        achievements: item.achievements || '',
        skills: item.skills || ''
      });
    } else {
      setCareerForm({
        role: '', company: '', period: '', type: 'work',
        summary: '', achievements: '', skills: ''
      });
    }
    setIsEditorOpen(true);
  };

  const handleOpenBlogForm = (item = null) => {
    setEditorType('blog');
    setEditingItem(item);
    if (item) {
      setBlogForm({
        title: item.title || '',
        content: item.content || '',
        author: item.author || 'Admin',
        category: item.category || 'Technology'
      });
    } else {
      setBlogForm({
        title: '', content: '', author: 'Admin', category: 'Technology'
      });
    }
    setIsEditorOpen(true);
  };

  // Submit Project / Research (Terproteksi Spring Security)
  const handleSaveProject = async (e) => {
    e.preventDefault();
    const url = editingItem ? `/api/projects/${editingItem.id}` : '/api/projects';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        onToast(`Entri ${editorType === 'project' ? 'Project' : 'Riset'} berhasil disimpan ke PostgreSQL!`);
        setIsEditorOpen(false);
        fetchAllData();
      } else {
        onToast('Gagal menyimpan entri (Hak akses ADMIN diperlukan)', 'error');
      }
    } catch {
      onToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Submit Career (Terproteksi Spring Security)
  const handleSaveCareer = async (e) => {
    e.preventDefault();
    const url = editingItem ? `/api/career/${editingItem.id}` : '/api/career';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(careerForm)
      });
      if (res.ok) {
        onToast('Entri Karir berhasil disimpan ke PostgreSQL!');
        setIsEditorOpen(false);
        fetchAllData();
      } else {
        onToast('Gagal menyimpan entri karir (Hak akses ADMIN diperlukan)', 'error');
      }
    } catch {
      onToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Submit Blog (Terproteksi Spring Security)
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    const url = editingItem ? `/api/posts/${editingItem.id}` : '/api/posts';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(blogForm)
      });
      if (res.ok) {
        onToast('Artikel Blog berhasil disimpan ke PostgreSQL!');
        setIsEditorOpen(false);
        fetchAllData();
      } else {
        onToast('Gagal menyimpan artikel (Hak akses ADMIN diperlukan)', 'error');
      }
    } catch {
      onToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Delete Handlers (Terproteksi Spring Security)
  const handleDeleteItem = async (endpoint, id, name) => {
    if (!window.confirm(`Yakin ingin menghapus "${name}"?`)) return;
    try {
      const res = await fetch(`${endpoint}/${id}`, { 
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      if (res.ok) {
        onToast(`"${name}" berhasil dihapus dari database.`);
        fetchAllData();
      } else {
        onToast('Gagal menghapus entri (Hak akses ADMIN diperlukan)', 'error');
      }
    } catch {
      onToast('Terjadi kesalahan saat menghapus', 'error');
    }
  };

  // Save Dynamic Site Settings to Database: PUT /api/settings
  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        onToast('Parameter konfigurasi situs berhasil disimpan ke database PostgreSQL!');
        if (onSettingsUpdated) {
          onSettingsUpdated();
        }
      } else {
        onToast('Gagal memperbarui konfigurasi (Perlu otentikasi ADMIN)', 'error');
      }
    } catch {
      onToast('Terjadi kesalahan jaringan saat menyimpan konfigurasi', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ padding: '5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
        <h2 className="empty-title">Akses Admin Terproteksi</h2>
        <p className="empty-subtitle">
          Halaman Content Management System (CMS) ini memerlukan autentikasi administrator dengan kredensial yang valid.
        </p>
        <button className="btn-primary" onClick={onOpenLogin} style={{ margin: '0 auto' }}>
          Login Administrator Sekarang
        </button>
      </div>
    );
  }

  const softwareProjects = projects.filter(p => p.type === 'project');
  const researchPapers = projects.filter(p => p.type === 'research');

  return (
    <section id="module-admin">
      {/* Admin Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="section-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            Admin Portal Active
          </span>
          <h2 className="section-title">Content Management System (CMS)</h2>
          <p className="section-desc">Kelola seluruh konten dinamis PostgreSQL <code>personalBlog</code>: Projects, Riset, Karir, Blog, Settings & Pesan.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Login sebagai: <strong style={{ color: '#fff' }}>{adminUser?.displayName || 'Admin'}</strong>
          </div>
          <button className="btn-secondary" onClick={logout} style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('projects')}>
          <div className="stat-number">{softwareProjects.length}</div>
          <div className="stat-label">Software Projects</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('research')}>
          <div className="stat-number">{researchPapers.length}</div>
          <div className="stat-label">Riset & Publikasi</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('career')}>
          <div className="stat-number">{careers.length}</div>
          <div className="stat-label">Linimasa Karir</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('blog')}>
          <div className="stat-number">{posts.length}</div>
          <div className="stat-label">Artikel Blog</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('settings')}>
          <div className="stat-number" style={{ color: '#a5b4fc' }}>⚙️</div>
          <div className="stat-label">Site Settings</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('inbox')}>
          <div className="stat-number" style={{ color: '#67e8f9' }}>{inbox.length}</div>
          <div className="stat-label">Pesan Masuk</div>
        </div>
      </div>

      {/* CMS Sub-Navbar */}
      <div className="tab-switcher" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${activeSection === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveSection('projects')}
        >
          Manage Projects ({softwareProjects.length})
        </button>
        <button
          className={`tab-btn ${activeSection === 'research' ? 'active' : ''}`}
          onClick={() => setActiveSection('research')}
        >
          Manage Riset ({researchPapers.length})
        </button>
        <button
          className={`tab-btn ${activeSection === 'career' ? 'active' : ''}`}
          onClick={() => setActiveSection('career')}
        >
          Manage Karir ({careers.length})
        </button>
        <button
          className={`tab-btn ${activeSection === 'blog' ? 'active' : ''}`}
          onClick={() => setActiveSection('blog')}
        >
          Manage Blog ({posts.length})
        </button>
        <button
          className={`tab-btn ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          ⚙️ Site Settings
        </button>
        <button
          className={`tab-btn ${activeSection === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveSection('inbox')}
        >
          Inbox Pesan ({inbox.length})
        </button>
      </div>

      {/* 1. MANAGE PROJECTS */}
      {activeSection === 'projects' && (
        <div className="contact-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daftar Software Projects</h3>
            <button className="btn-primary" onClick={() => handleOpenProjectForm(null, 'project')}>
              + Tambah Project Baru
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {softwareProjects.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{p.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.category} &bull; Tags: {p.tags || '-'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => handleOpenProjectForm(p, 'project')} title="Edit Project">✏️</button>
                  <button className="btn-icon delete" onClick={() => handleDeleteItem('/api/projects', p.id, p.title)} title="Hapus Project">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. MANAGE RESEARCH */}
      {activeSection === 'research' && (
        <div className="contact-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daftar Riset & Publikasi</h3>
            <button className="btn-primary" onClick={() => handleOpenProjectForm(null, 'research')}>
              + Tambah Riset Baru
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {researchPapers.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{r.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Venue: {r.venue || '-'} &bull; DOI: {r.doi || '-'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => handleOpenProjectForm(r, 'research')} title="Edit Riset">✏️</button>
                  <button className="btn-icon delete" onClick={() => handleDeleteItem('/api/projects', r.id, r.title)} title="Hapus Riset">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MANAGE CAREER */}
      {activeSection === 'career' && (
        <div className="contact-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daftar Linimasa Karir & Pendidikan</h3>
            <button className="btn-primary" onClick={() => handleOpenCareerForm(null)}>
              + Tambah Karir / Edukasi Baru
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {careers.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{c.role} &bull; <span style={{ color: 'var(--primary)' }}>{c.company}</span></h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Periode: {c.period} &bull; Tipe: {c.type}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => handleOpenCareerForm(c)} title="Edit Karir">✏️</button>
                  <button className="btn-icon delete" onClick={() => handleDeleteItem('/api/career', c.id, c.role)} title="Hapus Karir">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MANAGE BLOG */}
      {activeSection === 'blog' && (
        <div className="contact-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daftar Artikel Blog di PostgreSQL</h3>
            <button className="btn-primary" onClick={() => handleOpenBlogForm(null)}>
              + Tulis Artikel Baru
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {posts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{p.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kategori: {p.category} &bull; Penulis: {p.author}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => handleOpenBlogForm(p)} title="Edit Blog">✏️</button>
                  <button className="btn-icon delete" onClick={() => handleDeleteItem('/api/posts', p.id, p.title)} title="Hapus Blog">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MANAGE SITE SETTINGS (Tabel site_settings) */}
      {activeSection === 'settings' && (
        <div className="contact-form-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Konfigurasi Dinamis Situs (Tabel <code>site_settings</code>)</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Seluruh parameter konfigurasi di bawah ini disimpan di PostgreSQL dan dibaca secara dinamis tanpa restart aplikasi.
            </p>
          </div>

          <form onSubmit={handleSaveSiteSettings}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Judul Tab Browser & SEO (site_title)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.site_title || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, site_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tagline Situs (site_tagline)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.site_tagline || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, site_tagline: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nama Brand / Header (brand_name)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.brand_name || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, brand_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Peran Brand (brand_role)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.brand_role || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, brand_role: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ maxWidth: '120px' }}>
                <label className="form-label">Avatar (brand_avatar)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textAlign: 'center', fontWeight: 700 }}
                  value={settingsForm.brand_avatar || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, brand_avatar: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Statistik: Pengalaman (stats_experience)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.stats_experience || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, stats_experience: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Statistik: Proyek (stats_projects)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.stats_projects || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, stats_projects: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Statistik: Riset (stats_research)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.stats_research || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, stats_research: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Statistik: Uptime (stats_uptime)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.stats_uptime || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, stats_uptime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Teks Footer Website (footer_text)</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={settingsForm.footer_text || ''}
                onChange={e => setSettingsForm({ ...settingsForm, footer_text: e.target.value })}
              />
            </div>

            <div className="modal-footer" style={{ padding: 0, marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSavingSettings}
              >
                {isSavingSettings ? 'Menyimpan ke PostgreSQL...' : '💾 Simpan Konfigurasi ke PostgreSQL (PUT /api/settings)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. INBOX (CONTACT MESSAGES) */}
      {activeSection === 'inbox' && (
        <div className="contact-form-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Pesan Masuk dari Pengunjung (Tabel <code>contact_messages</code>)
          </h3>

          {inbox.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Belum ada pesan yang masuk.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {inbox.map(msg => (
                <div key={msg.id} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem' }}>{msg.name} &lt;{msg.email}&gt;</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleString('id-ID') : '-'}</span>
                  </div>
                  {msg.subject && <div style={{ fontSize: '0.9rem', color: '#a5b4fc', marginBottom: '0.4rem', fontWeight: 600 }}>Topik: {msg.subject}</div>}
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC CRUD EDITOR MODAL */}
      {isEditorOpen && (
        <div className="modal-overlay" onClick={() => setIsEditorOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit ' : 'Tambah '}
                {editorType === 'project' && 'Software Project'}
                {editorType === 'research' && 'Karya Riset & Publikasi'}
                {editorType === 'career' && 'Linimasa Karir'}
                {editorType === 'blog' && 'Artikel Blog'}
              </h3>
              <button className="modal-close" onClick={() => setIsEditorOpen(false)}>✕</button>
            </div>

            {/* FORM: PROJECT OR RESEARCH */}
            {(editorType === 'project' || editorType === 'research') && (
              <form onSubmit={handleSaveProject}>
                <div className="form-group">
                  <label className="form-label">Judul {editorType === 'project' ? 'Project' : 'Paper Riset'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={projectForm.title}
                    onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <input
                      type="text"
                      className="form-input"
                      value={projectForm.category}
                      onChange={e => setProjectForm({ ...projectForm, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (Pisahkan koma)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Java, Spring Boot, PostgreSQL"
                      value={projectForm.tags}
                      onChange={e => setProjectForm({ ...projectForm, tags: e.target.value })}
                    />
                  </div>
                </div>

                {editorType === 'research' ? (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Venue / Jurnal</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nama Jurnal atau Konferensi"
                        value={projectForm.venue}
                        onChange={e => setProjectForm({ ...projectForm, venue: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">DOI Identifier</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="10.1234/example"
                        value={projectForm.doi}
                        onChange={e => setProjectForm({ ...projectForm, doi: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Live Demo URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="https://demo.domain.com"
                        value={projectForm.demoUrl}
                        onChange={e => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Repository URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="https://github.com/..."
                        value={projectForm.repoUrl}
                        onChange={e => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Deskripsi Ringkas</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={projectForm.description}
                    onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detail Arsitektur / Metodologi</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={projectForm.details}
                    onChange={e => setProjectForm({ ...projectForm, details: e.target.value })}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditorOpen(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Simpan ke Database</button>
                </div>
              </form>
            )}

            {/* FORM: CAREER */}
            {editorType === 'career' && (
              <form onSubmit={handleSaveCareer}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Peran / Jabatan / Gelar</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Lead Fullstack Engineer"
                      value={careerForm.role}
                      onChange={e => setCareerForm({ ...careerForm, role: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Perusahaan / Universitas</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama Instansi"
                      value={careerForm.company}
                      onChange={e => setCareerForm({ ...careerForm, company: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Periode</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="2024 — Sekarang"
                      value={careerForm.period}
                      onChange={e => setCareerForm({ ...careerForm, period: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipe</label>
                    <select
                      className="form-input"
                      value={careerForm.type}
                      onChange={e => setCareerForm({ ...careerForm, type: e.target.value })}
                    >
                      <option value="work">Pengalaman Kerja</option>
                      <option value="education">Pendidikan / Akademik</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ringkasan</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={careerForm.summary}
                    onChange={e => setCareerForm({ ...careerForm, summary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pencapaian Utama (Pisahkan dengan tanda titik koma ';')</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Meningkatkan performa 40%.; Memimpin 5 engineer."
                    value={careerForm.achievements}
                    onChange={e => setCareerForm({ ...careerForm, achievements: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keahlian Terkait (Pisahkan koma)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Java, Spring Boot, React"
                    value={careerForm.skills}
                    onChange={e => setCareerForm({ ...careerForm, skills: e.target.value })}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditorOpen(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Simpan ke Database</button>
                </div>
              </form>
            )}

            {/* FORM: BLOG */}
            {editorType === 'blog' && (
              <form onSubmit={handleSaveBlog}>
                <div className="form-group">
                  <label className="form-label">Judul Artikel</label>
                  <input
                    type="text"
                    className="form-input"
                    value={blogForm.title}
                    onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <input
                      type="text"
                      className="form-input"
                      value={blogForm.category}
                      onChange={e => setBlogForm({ ...blogForm, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Penulis</label>
                    <input
                      type="text"
                      className="form-input"
                      value={blogForm.author}
                      onChange={e => setBlogForm({ ...blogForm, author: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Konten Artikel</label>
                  <textarea
                    className="form-textarea"
                    rows="6"
                    value={blogForm.content}
                    onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditorOpen(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Simpan ke Database</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
