import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AuthProvider } from './shared/context/AuthContext';
import Navbar from './shared/components/Navbar';
import Footer from './shared/components/Footer';
import SideNavDots from './shared/components/SideNavDots';
import { useActiveSection } from './shared/hooks/useActiveSection';
import AboutModule from './modules/about/AboutModule';
import ProjectsModule from './modules/projects/ProjectsModule';
import ResearchModule from './modules/research/ResearchModule';
import CareerModule from './modules/career/CareerModule';
import BlogModule from './modules/blog/BlogModule';
import ContactModule from './modules/contact/ContactModule';
import AdminDashboard from './modules/admin/AdminDashboard';
import AdminLoginModal from './modules/admin/components/AdminLoginModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'projects' | 'research' | 'career' | 'blog' | 'contact' | 'admin'
  const [systemOnline, setSystemOnline] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 1. Ref and IntersectionObserver / Snap-Event Active Section Tracker
  const scrollContainerRef = useRef(null);
  const portfolioSectionIds = useMemo(() => ['hero', 'about', 'research', 'projects', 'blog', 'contact'], []);
  const { activeSection, scrollToSection } = useActiveSection(portfolioSectionIds, scrollContainerRef, activeTab);

  const handleSectionNavigate = (sectionId) => {
    if (activeTab !== 'about') {
      setActiveTab('about');
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 80);
    } else {
      scrollToSection(sectionId);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    showToast(`Alamat email ${email} berhasil disalin ke clipboard!`);
  };

  // 2. Fetch Dynamic Site Configurations from PostgreSQL: GET /api/settings
  const fetchSiteSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const settings = await res.json();
        setSiteSettings(settings);
        if (settings.site_title) {
          document.title = settings.site_title;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat konfigurasi situs dari PostgreSQL:', e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // 3. Check Spring Boot & PostgreSQL status
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setSystemOnline(true);
      } else {
        setSystemOnline(false);
      }
    } catch {
      setSystemOnline(false);
    }
  };

  useEffect(() => {
    fetchSiteSettings();
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      {/* Fixed Header Navigation with Active State Synchronization */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSection={activeSection}
        onSectionNavigate={handleSectionNavigate}
        systemOnline={systemOnline}
        siteSettings={siteSettings}
        isLoadingSettings={isLoadingSettings}
        onOpenAdminLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Floating Side-Dot Navigation (Only displayed when viewing portfolio) */}
      {activeTab === 'about' && (
        <SideNavDots
          activeSection={activeSection}
          onNavigate={handleSectionNavigate}
        />
      )}

      {/* Self-Contained Full-Viewport Vertical Scroll Container */}
      <main
        ref={scrollContainerRef}
        className={`main-scroll-container ${activeTab === 'about' ? 'snap-container snap-y snap-mandatory scroll-smooth' : 'standard-scroll-container'}`}
      >
        {activeTab === 'about' && (
          <AboutModule 
            onNavigate={setActiveTab} 
            onCopyEmail={handleCopyEmail} 
            onToast={showToast}
            siteSettings={siteSettings}
            isLoadingSettings={isLoadingSettings}
            onScrollToSection={handleSectionNavigate}
          />
        )}

        {activeTab !== 'about' && (
          <div className="app-container standard-tab-view" style={{ paddingTop: '6rem' }}>
            {activeTab === 'projects' && <ProjectsModule />}
            {activeTab === 'research' && <ResearchModule />}
            {activeTab === 'career' && <CareerModule />}
            {activeTab === 'blog' && <BlogModule onToast={showToast} />}
            {activeTab === 'contact' && <ContactModule onToast={showToast} onCopyEmail={handleCopyEmail} />}
            {activeTab === 'admin' && (
              <AdminDashboard 
                onToast={showToast} 
                onOpenLogin={() => setIsLoginModalOpen(true)} 
                siteSettings={siteSettings || {}}
                onSettingsUpdated={fetchSiteSettings}
              />
            )}
            <Footer onNavigate={setActiveTab} siteSettings={siteSettings} isLoadingSettings={isLoadingSettings} />
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onToast={showToast}
        onSuccess={() => {
          setActiveTab('about');
        }}
      />

      {/* Global Toast Feedback */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
