import React, { useState, useEffect } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

/**
 * GitHub Contributions Graph (Interactive Heatmap)
 * Fetches public contribution data from https://github-contributions-api.jogruber.de/v4/{username}?y=last
 * Styled with our Dark Navy & Indigo/Violet palette.
 */
export default function GitHubContributionsGraph({ username, profileUrl }) {
  const [data, setData] = useState(null);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchContributions = async () => {
      setLoading(true);
      setError(null);

      const tryFetch = async (uname) => {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${uname}?y=last`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        return json;
      };

      try {
        let result;
        try {
          result = await tryFetch(username);
        } catch (initialErr) {
          // Smart fallback: if the database username 'rakandp' is not registered on GitHub,
          // automatically attempt 'RakaAP' (the repository owner)
          if (username.toLowerCase() === 'rakandp') {
            result = await tryFetch('RakaAP');
          } else {
            throw initialErr;
          }
        }

        if (isMounted && result && Array.isArray(result.contributions)) {
          setData(result.contributions);
          const totalCount =
            result.total?.lastYear ??
            result.contributions.reduce((acc, curr) => acc + (curr.count || 0), 0);
          setTotal(totalCount);
          setError(null);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          console.warn('Gagal memuat data kontribusi GitHub:', err.message);
          setError(err.message || 'Offline');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContributions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [username]);

  // If no username provided and not loading, gracefully return null
  if (!username && !loading) {
    return null;
  }

  return (
    <div className="github-contributions-card">
      <div className="github-contributions-header">
        <div className="github-header-left">
          <div className="github-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div className="github-header-titles">
            <h4 className="github-contributions-title">GitHub Contributions &amp; Activity</h4>
            <p className="github-contributions-subtitle">
              Riwayat commit, pull request, dan kontribusi publik langsung dari GitHub
            </p>
          </div>
        </div>

        <div className="github-header-right">
          {!loading && !error && total !== null && (
            <span className="github-count-badge">
              <span className="count-number">{total}</span> contributions in the last year
            </span>
          )}
        </div>
      </div>

      <div className="github-calendar-content">
        {/* 1. SKELETON LOADER */}
        {loading && (
          <div className="github-skeleton-wrap" aria-label="Memuat data kontribusi GitHub...">
            <div className="github-skeleton-grid">
              {Array.from({ length: 44 }).map((_, i) => (
                <div key={i} className="github-skeleton-column">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <span key={j} className="github-skeleton-cell" />
                  ))}
                </div>
              ))}
            </div>
            <div className="github-skeleton-footer">
              <span className="github-skeleton-pill" />
              <span className="github-skeleton-pill short" />
            </div>
          </div>
        )}

        {/* 2. LIVE INTERACTIVE HEATMAP */}
        {!loading && !error && data && (
          <div className="github-calendar-scroll">
            <ActivityCalendar
              data={data}
              colorScheme="dark"
              theme={{
                dark: ['#161B26', '#312e81', '#4f46e5', '#6366f1', '#a855f7'],
              }}
              labels={{
                totalCount: '{{count}} contributions in the last year',
                legend: {
                  less: 'Sedikit',
                  more: 'Banyak',
                },
              }}
              blockSize={10.8}
              blockMargin={3}
              blockRadius={2.5}
              fontSize={11.5}
              showWeekdayLabels={false}
            />
          </div>
        )}

        {/* 3. GRACEFUL FALLBACK (OFFLINE / NOT FOUND) */}
        {!loading && error && (
          <div className="github-fallback-card">
            <div className="github-fallback-info">
              <span className="github-fallback-icon">ℹ️</span>
              <p className="github-fallback-text">
                Grafik kontribusi publik untuk <strong>@{username}</strong> sedang tidak tersedia.
              </p>
            </div>
            <a
              href={profileUrl || `https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-github-profile-link"
              title="Buka profil GitHub"
            >
              <span>Buka Profil di GitHub</span>
              <span className="arrow-icon">↗</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
