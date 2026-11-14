import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PageId } from '../types';

interface DirectionsSectionProps {
  onNavigate: (page: PageId) => void;
}

const CORE_DIRECTIONS = [
  {
    index: '01.',
    title: 'МУТСТ ба нийцэл',
    description:
      'FATF-ийн 40 зөвлөмж, 11 шууд үр дүн болон 2027–2028 оны APG харилцан үнэлгээний бэлтгэлд ББСБ-уудыг системтэй сургах.',
    meta: 'СЗХ-ны мэдээлэх үүрэгтэй этгээд',
  },
  {
    index: '02.',
    title: 'ТУЗ-ийн засаглал',
    description:
      'ТУЗ-ийн нарийн бичгийн даргын ажил, тогтоолын төсөлд санал авах хуудас, шийдвэрийн хэрэгжилт ба аудитын хорооны тайлагнал.',
    meta: 'СТМ ББСБ ХХК зөвлөх стандарт',
  },
  {
    index: '03.',
    title: 'KPI / OKR удирдлага',
    description:
      'Байгууллага, албан тушаал, ажилтны гүйцэтгэлийг уялдуулах 8 хуудас бүхий автоматжуулсан үнэлгээний систем.',
    meta: 'Excel Dashboard ба SMART зорилт',
  },
  {
    index: '04.',
    title: 'Санхүүгийн академи',
    description:
      'СЗХ-ны зохицуулалттай холбоодыг чадавхжуулах, тасралтгүй мэргэжлийн хөгжлийн (CPD) цахим болон танхимийн сургалт.',
    meta: 'Санхүүгийн боловсролын зангилаа',
  },
];

const CAREER_TIMELINE = [
  {
    period: '2020 – Одоо',
    role: 'Гүйцэтгэх захирал',
    org: 'Санхүүгийн боловсролын зангилаа ГҮТББ (FEHUB)',
    summary:
      'Санхүүгийн боловсрол, МУТСТ цахим ба танхимийн сургалт, мэргэжлийн холбоодын чадавхжуулалт.',
  },
  {
    period: '2024 – Одоо',
    role: 'Зөвлөх, ТУЗ-ийн нарийн бичгийн дарга',
    org: 'СТМ ББСБ ХХК',
    summary:
      'ТУЗ-ийн бичиг баримтын стандарт, нийцэл, 2026 оны төлөвлөгөө, KPI/OKR систем нэвтрүүлэлт.',
  },
  {
    period: '2004 – 2024',
    role: 'Гүйцэтгэх удирдлага, Нэгжийн захирал',
    org: 'Монголын Банк, Даатгалын салбар',
    summary:
      'Эрсдэлийн удирдлага, санхүүгийн удирдлага, бүтээгдэхүүн хөгжүүлэлтийн 20+ жилийн туршлага.',
  },
  {
    period: 'Академик суурь',
    role: 'Төгсөгч, Ментор, Судлаач',
    org: 'СЭЗИС & SIFE хөтөлбөр',
    summary:
      'СЭЗИС, SIFE-SEZIS-ийн суурь боловсрол, ББСБ болон зохицуулалтын салбарын судалгааны арга зүй.',
  },
];

export const DirectionsSection: React.FC<DirectionsSectionProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-50">
      {/* Institutional Sub-page Header & Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-[#0F294A] cursor-pointer"
            >
              Нүүр
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#0F294A] font-medium">Бидний тухай ба Намтар</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight text-balance">
            Байгууллагын тухай ба Мэргэжлийн замнал
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Санхүүгийн боловсролын зангилаа ГҮТББ (FEHUB) болон Гүйцэтгэх захирал Дамдины Оюунгэрэлийн
            салбарын туршлага, зохицуулалттай байгууллагуудад чиглэсэн үндсэн чиглэлүүд.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* Part 1: FRC-style Core Advisory Directions */}
        <div>
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#B45309] mb-1.5">Үндсэн чиглэл</p>
            <h2 className="text-2xl font-bold text-[#0F294A]">Зөвлөх ба Сургалтын 4 тулгуур</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
            {CORE_DIRECTIONS.map((item) => (
              <div key={item.index} className="p-6 sm:p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold text-[#B45309] tabular-nums">
                    {item.index}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F294A]">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                  {item.meta}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Concise Career Ledger */}
        <div>
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#B45309] mb-1.5">Ажил эрхлэлтийн түүх</p>
            <h2 className="text-2xl font-bold text-[#0F294A]">Мэргэжлийн намтар</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-200">
              {CAREER_TIMELINE.map((item) => (
                <div
                  key={item.period}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 px-6 py-5 items-baseline hover:bg-slate-50/70 transition-colors"
                >
                  <div className="lg:col-span-2 text-xs font-mono font-semibold text-[#B45309] tabular-nums">
                    {item.period}
                  </div>
                  <div className="lg:col-span-3 font-bold text-sm text-[#0F294A]">
                    {item.role}
                  </div>
                  <div className="lg:col-span-3 text-sm font-medium text-slate-700">
                    {item.org}
                  </div>
                  <div className="lg:col-span-4 text-sm text-slate-600 leading-relaxed">
                    {item.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
