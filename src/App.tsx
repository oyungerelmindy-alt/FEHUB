import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DirectionsSection } from './components/DirectionsSection';
import { TrainingAndSystemsSection } from './components/TrainingAndSystemsSection';
import { ServicesPricingSection } from './components/ServicesPricingSection';
import { CasesSection } from './components/CasesSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { PageId } from './types';

const VALID_PAGES: PageId[] = ['home', 'about', 'training', 'services', 'cases', 'contact'];

function getPageFromHash(): PageId {
  const hash = window.location.hash.replace('#', '') as PageId;
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(() => getPageFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setActivePage(getPageFromHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    const nextHash = page === 'home' ? '#home' : `#${page}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0F294A] selection:text-white">
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {activePage === 'home' && <HeroSection onNavigate={handleNavigate} />}
        {activePage === 'about' && <DirectionsSection onNavigate={handleNavigate} />}
        {activePage === 'training' && <TrainingAndSystemsSection onNavigate={handleNavigate} />}
        {activePage === 'services' && <ServicesPricingSection onNavigate={handleNavigate} />}
        {activePage === 'cases' && <CasesSection onNavigate={handleNavigate} />}
        {activePage === 'contact' && <ContactSection onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
