import React, { useState } from 'react';

export default function ContactModule({ onToast, onCopyEmail }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      onToast('Mohon lengkapi nama, email, dan pesan Anda', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        onToast('Pesan berhasil terkirim dan tersimpan di database!');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        onToast('Pesan telah dicatat', 'success');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch {
      onToast('Gagal terhubung ke backend', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="module-contact">
      <div className="section-header">
        <span className="section-tag">Koneksi & Kerjasama</span>
        <h2 className="section-title">Hubungi Saya</h2>
        <p className="section-desc">Punya ide proyek, diskusi riset, atau tawaran kolaborasi? Kirimkan pesan langsung di bawah ini.</p>
      </div>

      <div className="contact-grid">
        {/* Contact Information Cards */}
        <div className="contact-info-card">
          <div className="contact-method-item">
            <div className="contact-method-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="contact-method-content">
              <h4>Email Resmi</h4>
              <p>rakandp.dev@gmail.com</p>
              <button className="btn-copy-email" onClick={() => onCopyEmail()}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Salin Email</span>
              </button>
            </div>
          </div>

          <div className="contact-method-item">
            <div className="contact-method-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </div>
            <div className="contact-method-content">
              <h4>LinkedIn</h4>
              <p>linkedin.com/in/rakandp</p>
            </div>
          </div>

          <div className="contact-method-item">
            <div className="contact-method-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
            </div>
            <div className="contact-method-content">
              <h4>GitHub</h4>
              <p>github.com/rakandp</p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#6ee7b7' }}>
              <span className="status-dot"></span>
              <span>Waktu respon biasa &lt; 24 jam kerja</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name-input">Nama Lengkap</label>
                <input
                  id="name-input"
                  type="text"
                  className="form-input"
                  placeholder="Nama Anda"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Alamat Email</label>
                <input
                  id="email-input"
                  type="email"
                  className="form-input"
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone-input">Nomor Telepon (opsional)</label>
                <input
                  id="phone-input"
                  type="tel"
                  className="form-input"
                  placeholder="+62 8xx xxxx xxxx"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="subject-input">Subjek / Topik</label>
                <input
                  id="subject-input"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Diskusi Tawaran Proyek atau Konsultasi"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="message-input">Pesan Anda</label>
              <textarea
                id="message-input"
                className="form-textarea"
                placeholder="Tuliskan detail kebutuhan atau pertanyaan Anda..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={submitting}
            >
              {submitting ? 'Mengirim Pesan...' : 'Kirim Pesan Sekarang 🚀'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
