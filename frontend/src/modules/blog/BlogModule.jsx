import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../shared/context/AuthContext';

const PAGE_SIZE = 6;

export default function BlogModule({ onToast }) {
  const { adminUser, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Read modal state
  const [readPost, setReadPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({ authorName: '', authorEmail: '', content: '' });
  const [commentLoading, setCommentLoading] = useState(false);

  // Write/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: 'Admin',
    category: 'Technology'
  });

  const fetchPosts = useCallback(async (page = 0, search = '', category = '') => {
    setLoading(true);
    try {
      let url = `/api/posts?page=${page}&size=${PAGE_SIZE}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Paged response
        if (data.content !== undefined) {
          setPosts(data.content);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
          setCurrentPage(data.currentPage);
        } else {
          // full list (backwards compat)
          setPosts(data);
          setTotalPages(1);
          setTotalElements(data.length);
          setCurrentPage(0);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(0, searchQuery, selectedCategory);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      fetchPosts(0, searchQuery, selectedCategory);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPosts(page, searchQuery, selectedCategory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Comments
  const fetchComments = async (postId) => {
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) setComments(await res.json());
      else setComments([]);
    } catch {
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleOpenRead = async (post) => {
    setReadPost(post);
    setCommentForm({ authorName: '', authorEmail: '', content: '' });
    await fetchComments(post.id);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentForm.authorName.trim() || !commentForm.content.trim()) {
      onToast('Nama dan isi komentar wajib diisi', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${readPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm)
      });
      if (res.ok) {
        onToast('Komentar berhasil ditambahkan!');
        setCommentForm({ authorName: '', authorEmail: '', content: '' });
        fetchComments(readPost.id);
      }
    } catch {
      onToast('Gagal mengirim komentar', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      const res = await fetch(`/api/posts/${readPost.id}/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('Komentar dihapus');
        fetchComments(readPost.id);
      }
    } catch {
      onToast('Gagal menghapus komentar', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '', author: 'Admin', category: 'Technology' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post, e) => {
    e.stopPropagation();
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      author: post.author || 'Admin',
      category: post.category || 'Technology'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      onToast('Judul dan isi artikel wajib diisi', 'error');
      return;
    }

    try {
      const authHeader = adminUser?.token ? { 'Authorization': `Bearer ${adminUser.token}` } : {};
      if (editingPost) {
        const res = await fetch(`/api/posts/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          onToast('Artikel berhasil diperbarui!');
          setIsModalOpen(false);
          fetchPosts(currentPage, searchQuery, selectedCategory);
        } else {
          onToast('Gagal memperbarui artikel (Otentikasi admin diperlukan)', 'error');
        }
      } else {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          onToast('Artikel baru berhasil diterbitkan!');
          setIsModalOpen(false);
          fetchPosts(0, '', 'All');
        } else {
          onToast('Gagal menerbitkan artikel (Otentikasi admin diperlukan)', 'error');
        }
      }
    } catch {
      onToast('Koneksi ke backend bermasalah', 'error');
    }
  };

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus artikel "${title}" dari database?`)) return;
    try {
      const authHeader = adminUser?.token ? { 'Authorization': `Bearer ${adminUser.token}` } : {};
      const res = await fetch(`/api/posts/${id}`, { 
        method: 'DELETE',
        headers: { ...authHeader }
      });
      if (res.ok) {
        onToast('Artikel berhasil dihapus');
        fetchPosts(currentPage, searchQuery, selectedCategory);
      } else {
        onToast('Gagal menghapus artikel (Otentikasi admin diperlukan)', 'error');
      }
    } catch {
      onToast('Terjadi kesalahan saat menghapus', 'error');
    }
  };

  const getReadTime = (text) => {
    if (!text) return '1 mnt baca';
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 150));
    return `${mins} mnt baca`;
  };

  return (
    <section id="module-blog">
      <div className="section-header">
        <span className="section-tag">Artikel &amp; Pemikiran</span>
        <h2 className="section-title">Personal Blog</h2>
        <p className="section-desc">
          Artikel teknis dan catatan pengalaman yang terhubung langsung ke database PostgreSQL{' '}
          <code>personalBlog</code>.{' '}
          {totalElements > 0 && <span style={{ color: 'var(--text-muted)' }}>({totalElements} artikel)</span>}
        </p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Cari artikel berdasarkan judul atau isi konten..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {isAuthenticated && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tulis Artikel Baru</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      {posts.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          {['All', ...new Set(posts.map(p => p.category || 'Technology'))].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: '1px solid ' + (selectedCategory === cat ? 'var(--primary)' : 'var(--border-subtle)'),
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid Posts */}
      {loading ? (
        <div className="empty-state">
          <p className="empty-subtitle">Memuat data artikel dari PostgreSQL...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">Belum ada artikel ditemukan</h3>
          <p className="empty-subtitle">
            {searchQuery ? 'Tidak ada artikel yang cocok dengan pencarian.' : 'Mulai publikasikan tulisan pertama Anda!'}
          </p>
          {isAuthenticated && (
            <button className="btn-primary" onClick={handleOpenCreate} style={{ margin: '0 auto' }}>
              Tulis Artikel Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <article
              key={post.id}
              className="post-card"
              onClick={() => handleOpenRead(post)}
              style={{ cursor: 'pointer' }}
            >
              <div className="post-header">
                <span className="post-category">{post.category || 'General'}</span>
                <div className="post-meta-right">
                  <span className="post-read-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {post.readTime || getReadTime(post.content)}
                  </span>
                  <span>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Baru saja'}
                  </span>
                </div>
              </div>

              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.summary || post.content?.substring(0, 160) + '...'}</p>

              <div className="post-footer">
                <span className="post-author">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  {post.author || 'Admin'}
                </span>

                <div className="post-actions" onClick={e => e.stopPropagation()}>
                  {isAuthenticated && (
                    <>
                      <button className="btn-icon" title="Edit Artikel" onClick={(e) => handleOpenEdit(post, e)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>

                      <button className="btn-icon delete" title="Hapus Artikel" onClick={(e) => handleDelete(post.id, post.title, e)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </>
                  )}
                  <button
                    className="btn-icon"
                    title="Baca Artikel"
                    onClick={(e) => { e.stopPropagation(); handleOpenRead(post); }}
                    style={{ color: 'var(--primary)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '0.4rem 0.8rem',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 0 ? 0.4 : 1
            }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              style={{
                background: i === currentPage ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                border: '1px solid ' + (i === currentPage ? 'var(--primary)' : 'var(--border-subtle)'),
                borderRadius: '8px',
                color: '#fff',
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
                fontWeight: i === currentPage ? 700 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '0.4rem 0.8rem',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages - 1 ? 0.4 : 1
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Read Article Modal */}
      {readPost && (
        <div className="modal-overlay" onClick={() => setReadPost(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <div>
                <span style={{
                  background: 'var(--primary-glow)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  marginBottom: '0.5rem',
                  display: 'inline-block'
                }}>
                  {readPost.category || 'General'}
                </span>
                <h3 className="modal-title" style={{ marginTop: '0.4rem' }}>{readPost.title}</h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span>✍️ {readPost.author || 'Admin'}</span>
                  <span>⏱ {readPost.readTime || getReadTime(readPost.content)}</span>
                  <span>📅 {readPost.createdAt ? new Date(readPost.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setReadPost(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Article content */}
            <div style={{
              padding: '1.5rem 0',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              fontSize: '0.95rem'
            }}>
              {readPost.content}
            </div>

            {/* Comments section */}
            <div style={{ paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Komentar ({comments.length})
              </h4>

              {commentLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat komentar...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Belum ada komentar. Jadilah yang pertama!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {comments.map(c => (
                    <div key={c.id} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.authorName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        {isAuthenticated && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              <form onSubmit={handleSubmitComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tambah Komentar</h5>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama Anda *"
                      value={commentForm.authorName}
                      onChange={e => setCommentForm({ ...commentForm, authorName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email (opsional)"
                      value={commentForm.authorEmail}
                      onChange={e => setCommentForm({ ...commentForm, authorEmail: e.target.value })}
                    />
                  </div>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Tulis komentar Anda... *"
                  value={commentForm.content}
                  onChange={e => setCommentForm({ ...commentForm, content: e.target.value })}
                  style={{ minHeight: '90px' }}
                />
                <div className="modal-footer" style={{ paddingTop: 0 }}>
                  <button type="button" className="btn-secondary" onClick={() => setReadPost(null)}>Tutup</button>
                  <button type="submit" className="btn-primary">Kirim Komentar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Write / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPost ? 'Edit Artikel Blog' : 'Tulis Artikel Blog Baru'}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="blog-title">Judul Artikel</label>
                <input
                  id="blog-title"
                  type="text"
                  className="form-input"
                  placeholder="Masukkan judul artikel yang berbobot..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="blog-cat">Kategori</label>
                  <input
                    id="blog-cat"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Technology, Database, Architecture"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="blog-author">Penulis</label>
                  <input
                    id="blog-author"
                    type="text"
                    className="form-input"
                    placeholder="Nama penulis"
                    value={formData.author}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="blog-content">Konten Artikel</label>
                <textarea
                  id="blog-content"
                  className="form-textarea"
                  style={{ minHeight: '180px' }}
                  placeholder="Tuliskan isi blog lengkap di sini..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  {editingPost ? 'Simpan Perubahan' : 'Terbitkan ke PostgreSQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
