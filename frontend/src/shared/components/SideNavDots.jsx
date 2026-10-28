import React from 'react';

const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'research', label: 'Riset' },
  { id: 'projects', label: 'Projects' },
  { id: 'blog', label: 'Blog' },
  { id: 'contact', label: 'Contact' },
];

export default function SideNavDots({ activeSection, onNavigate }) {
  return (
    <nav className="side-nav-dots" aria-label="Navigasi Section Halaman">
      <ul className="side-dots-list">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <li key={sec.id} className="side-dot-item">
              <button
                type="button"
                className={`side-dot-btn ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate(sec.id);
                }}
                aria-label={`Lompat ke bagian ${sec.label}`}
                aria-current={isActive ? 'true' : undefined}
                title={sec.label}
              >
                <span className="side-dot-pip"></span>
                <span className="side-dot-tooltip">{sec.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
