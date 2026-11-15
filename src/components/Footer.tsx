import React from 'react';
import { PageId } from '../types';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0F294A] text-slate-300 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/15">
          {/* Col 1: Institutional Identity */}
          <div className="space-y-3 md:col-span-2">
            <div className="text-white font-bold text-base">
              Санхүүгийн боловсролын зангилаа ГҮТББ (FEHUB)
            </div>
            <p className="text-slate-300/90 leading-relaxed max-w-md">
              Гүйцэтгэх захирал Дамдины Оюунгэрэл. Банк, санхүүгийн байгууллагын засаглал, МУТСТ
              сургалт, гүйцэтгэлийн удирдлагын зөвлөх үйлчилгээ.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3">Хуудсууд</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Бидний тухай ба Намтар
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('training')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Сургалт & KPI/OKR
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Үйлчилгээний багц
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('cases')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Төсөл & Кейс судалгаа
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Админ удирдлага
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3">Холбоо барих</h4>
            <ul className="space-y-2">
              <li>oyungerel.mindy@gmail.com</li>
              <li>
                <a
                  href="https://feh.mn"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  www.feh.mn
                </a>
              </li>
              <li className="text-slate-300/80">Чингэлтэй дүүрэг, JJ Tower, 10 давхар</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <div>
            © {new Date().getFullYear()} Санхүүгийн боловсролын зангилаа ГҮТББ. Бүх эрх хуулиар хамгаалагдсан.
          </div>
          <div>Улаанбаатар хот, Монгол Улс</div>
        </div>
      </div>
    </footer>
  );
};
