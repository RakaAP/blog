import React, { useState, useEffect } from 'react';
import { AuthProvider } from './shared/context/AuthContext';
import Navbar from './shared/components/Navbar';
import Footer from './shared/components/Footer';
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
  const [siteSettings, setSiteSettings] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const handleCopyEmail = (email = 'rakandp.dev@gmail.com') => {
    navigator.clipboard.writeText(email);
    showToast(`Alamat email ${email} berhasil disalin ke clipboard!`);
  };

  // 1. Fetch Dynamic Site Configurations from PostgreSQL: GET /api/settings
  const fetchSiteSettings = async () => {
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
    }
  };

  // 2. Check Spring Boot & PostgreSQL status
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
    <div>
      {/* Sticky Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemOnline={systemOnline}
        siteSettings={siteSettings}
        onOpenAdminLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Modular Body */}
      <main className="app-container">
        {activeTab === 'about' && (
          <AboutModule 
            onNavigate={setActiveTab} 
            onCopyEmail={handleCopyEmail} 
            onToast={showToast}
            siteSettings={siteSettings}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsModule />
        )}

        {activeTab === 'research' && (
          <ResearchModule />
        )}

        {activeTab === 'career' && (
          <CareerModule />
        )}

        {activeTab === 'blog' && (
          <BlogModule onToast={showToast} />
        )}

        {activeTab === 'contact' && (
          <ContactModule onToast={showToast} onCopyEmail={handleCopyEmail} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard 
            onToast={showToast} 
            onOpenLogin={() => setIsLoginModalOpen(true)} 
            siteSettings={siteSettings}
            onSettingsUpdated={fetchSiteSettings}
          />
        )}
      </main>

      {/* Footer */}
      <Footer 
        onNavigate={setActiveTab} 
        siteSettings={siteSettings}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onToast={showToast}
        onSuccess={() => setActiveTab('admin')}
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
