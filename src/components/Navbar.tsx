import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageId } from '../types';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_LINKS: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Нүүр' },
  { id: 'about', label: 'Бидний тухай' },
  { id: 'training', label: 'Сургалт & Систем' },
  { id: 'services', label: 'Үйлчилгээ' },
  { id: 'cases', label: 'Төсөл & Кейс' },
];

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (page: PageId) => {
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleLinkClick('home')}
            className="text-base sm:text-lg font-extrabold tracking-tight text-[#0F294A] whitespace-nowrap shrink-0 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F294A]"
          >
            FEHUB · Д. Оюунгэрэл
          </button>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {NAV_LINKS.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleLinkClick(link.id)}
                  className={`transition-colors duration-150 whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-[#0F294A] font-semibold border-[#0F294A]'
                      : 'border-transparent hover:text-[#0F294A] hover:border-slate-300'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="hidden lg:flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleLinkClick('contact')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'contact'
                  ? 'bg-[#173B69] text-white ring-2 ring-[#0F294A]/20'
                  : 'bg-[#0F294A] hover:bg-[#173B69] text-white'
              }`}
            >
              Холбоо барих
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Цэс нээх"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-[#0F294A] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#0F294A]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <div className="pt-3 mt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleLinkClick('contact')}
              className="block w-full text-center px-4 py-2.5 rounded-lg bg-[#0F294A] text-white text-sm font-semibold cursor-pointer"
            >
              Холбоо барих
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
