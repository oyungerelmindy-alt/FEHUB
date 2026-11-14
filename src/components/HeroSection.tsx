import React, { useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { PageId } from '../types';

interface HeroSectionProps {
  onNavigate: (page: PageId) => void;
}

const INSTITUTIONAL_STATS = [
  { value: '20+ жил', label: 'Банк, даатгал, санхүүгийн удирдлагын туршлага' },
  { value: '12 модуль', label: 'FATF 40 & СЗХ-ны нийцлийн сургалтын хөтөлбөр' },
  { value: '8 хуудас', label: 'KPI / OKR гүйцэтгэлийн удирдлагын систем' },
  { value: 'feh.mn', label: 'Санхүүгийн боловсролын зангилаа ГҮТББ' },
];

const HOME_PILLARS: {
  index: string;
  title: string;
  summary: string;
  targetPage: PageId;
  linkLabel: string;
}[] = [
  {
    index: '01.',
    title: 'МУТСТ ба СЗХ-ны нийцэл',
    summary:
      'FATF 40 зөвлөмж, 11 шууд үр дүн болон 2027–2028 оны APG үнэлгээнд ББСБ-уудыг бэлтгэх 12 модульт сургалт.',
    targetPage: 'training',
    linkLabel: 'Хөтөлбөр үзэх',
  },
  {
    index: '02.',
    title: 'ТУЗ ба Засаглалын зөвлөх',
    summary:
      'ТУЗ-ийн нарийн бичгийн даргын бичиг баримтын стандарт, тогтоолын санал, аудитын тайлагнал ба KPI/OKR систем.',
    targetPage: 'services',
    linkLabel: 'Үйлчилгээ харах',
  },
  {
    index: '03.',
    title: 'Салбарын төсөл ба судалгаа',
    summary:
      'Kulta Finance, Lend.mn болон 5 тэрбум төгрөгийн дүрмийн сантай ББСБ байгуулах зах зээлийн судалгааны кейсүүд.',
    targetPage: 'cases',
    linkLabel: 'Кейсүүд унших',
  },
  {
    index: '04.',
    title: 'FEHUB & Мэргэжлийн намтар',
    summary:
      'Дамдины Оюунгэрэлийн 20+ жилийн удирдлагын замнал, СЭЗИС суурь болон Санхүүгийн Академийн санаачилга.',
    targetPage: 'about',
    linkLabel: 'Намтар танилцах',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div>
      {/* Institutional Hero Split */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-medium text-slate-500">
                <span>Санхүүгийн боловсролын зангилаа ГҮТББ</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>СТМ ББСБ ХХК-ийн Зөвлөх</span>
              </div>

              <h1 className="text-[clamp(2rem,3.6vw,3.15rem)] font-extrabold tracking-tight text-[#0F294A] leading-[1.15] text-balance">
                Санхүүгийн засаглал, МУТСТ нийцэл ба мэргэжлийн сургалт
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Дамдины Оюунгэрэл нь банк, санхүүгийн салбарт 20 гаруй жил ажилласан туршлагадаа
                тулгуурлан ББСБ болон СЗХ-ны зохицуулалттай байгууллагуудад ТУЗ-ийн засаглал, МУТСТ
                сургалт, гүйцэтгэлийн удирдлагын цогц шийдлийг хүргэж байна.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0F294A] hover:bg-[#173B69] text-white font-semibold text-sm transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Үйлчилгээ захиалах</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('training')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F294A] hover:text-[#B45309] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Сургалтын хөтөлбөр үзэх</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Editorial Architectural Photography */}
            <div className="lg:col-span-6">
              <figure className="h-full flex flex-col">
                <div className="relative flex-1 min-h-[280px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  {!imageError ? (
                    <img
                      src="/src/assets/images/hero_financial_hub_1794638590093.jpg"
                      alt="Санхүүгийн боловсролын зангилаа болон удирдлагын зөвлөх уулзалтын танхим"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Building2 className="w-10 h-10 text-[#0F294A] mb-3" />
                      <div className="text-sm font-semibold text-[#0F294A]">
                        Санхүүгийн боловсролын зангилаа ГҮТББ
                      </div>
                    </div>
                  )}
                </div>
                <figcaption className="mt-2.5 text-xs text-slate-500 flex items-center justify-between">
                  <span>Улаанбаатар хот, Чингэлтэй дүүрэг, JJ Tower</span>
                  <span className="font-mono tabular-nums text-slate-400">FEHUB · 2026</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Institutional Key Facts Strip */}
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {INSTITUTIONAL_STATS.map((stat) => (
                <div key={stat.value} className="py-5 px-4 sm:px-6 first:pl-0 last:pr-0">
                  <dt className="text-2xl font-extrabold text-[#0F294A] font-mono tabular-nums tracking-tight">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs text-slate-600 leading-snug">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Home Page Quick Navigation Grid to Sub-Pages (FRC.mn / FEH.mn portal pattern) */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#B45309] mb-2">Үндсэн булангууд</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
                Үйл ажиллагааны чиглэл ба мэдээллийн сан
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-sm">
              Сэдэв бүрийг тусдаа хуудаснаас дэлгэрэнгүй үзэх боломжтой.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {HOME_PILLARS.map((pillar) => (
              <div key={pillar.index} className="p-6 sm:p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold text-[#B45309] tabular-nums">
                    {pillar.index}
                  </div>
                  <h3 className="text-base font-bold text-[#0F294A]">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate(pillar.targetPage)}
                  className="pt-4 border-t border-slate-100 inline-flex items-center justify-between text-xs font-semibold text-[#0F294A] hover:text-[#B45309] transition-colors cursor-pointer"
                >
                  <span>{pillar.linkLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
