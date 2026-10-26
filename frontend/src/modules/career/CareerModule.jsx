import React, { useState, useEffect } from 'react';

export default function CareerModule() {
  const [careerList, setCareerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'work' | 'education'
  const [expandedId, setExpandedId] = useState(null);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/career');
      if (res.ok) {
        const data = await res.json();
        setCareerList(data);
        if (data.length > 0) setExpandedId(data[0].id);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const filteredItems = careerList.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <section id="module-career">
      <div className="section-header">
        <span className="section-tag">Rekam Jejak Profesional</span>
        <h2 className="section-title">Perjalanan Karir & Pengalaman</h2>
        <p className="section-desc">Linimasa pengalaman kerja, kontribusi engineering, serta latar belakang akademik yang tersimpan di PostgreSQL.</p>
      </div>

      {/* Filter Switcher */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Semua ({careerList.length})
        </button>
        <button
          className={`tab-btn ${filter === 'work' ? 'active' : ''}`}
          onClick={() => setFilter('work')}
        >
          Pengalaman Kerja
        </button>
        <button
          className={`tab-btn ${filter === 'education' ? 'active' : ''}`}
          onClick={() => setFilter('education')}
        >
          Pendidikan
        </button>
      </div>

      {/* Vertical Timeline */}
      {loading ? (
        <div className="empty-state">
          <p className="empty-subtitle">Memuat data karir...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">Belum ada data karir yang tercatat</h3>
        </div>
      ) : (
        <div className="timeline">
          {filteredItems.map(item => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-card">
                <div className="timeline-header">
                  <div>
                    <h3 className="timeline-role">{item.role}</h3>
                    <div className="timeline-company">{item.company}</div>
                  </div>
                  <span className="timeline-period">{item.period}</span>
                </div>

                <p className="timeline-summary">{item.summary}</p>

                {item.achievements && (
                  <>
                    <button
                      className="accordion-btn"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <span>{expandedId === item.id ? 'Sembunyikan Pencapaian ▴' : 'Lihat Pencapaian Kunci ▾'}</span>
                    </button>

                    {expandedId === item.id && (
                      <ul className="achievements-list">
                        {item.achievements.split(';').map((ach, idx) => (
                          <li key={idx}>{ach.trim()}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {item.skills && (
                  <div className="chips-wrapper" style={{ marginTop: '0.6rem' }}>
                    {item.skills.split(',').map(s => (
                      <span key={s.trim()} className="tech-chip" style={{ fontSize: '0.74rem' }}>{s.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
