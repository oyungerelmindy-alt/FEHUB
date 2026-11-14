import React, { useState } from 'react';
import { Check, ArrowUpRight, ChevronRight } from 'lucide-react';
import { CaseStudy, PageId } from '../types';

interface CasesSectionProps {
  onNavigate: (page: PageId) => void;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'kulta',
    title: 'Kulta Finance — Үйлчилгээний стандарт & KYC',
    subtitle: '14 салбарын 50 орчим ажилтанд зориулсан сургалтын хөтөлбөр',
    category: 'Салбарын стандарт',
    summary:
      'Kulta Finance-ийн 14 салбар, 50 орчим ажилтны бүтээгдэхүүний онцлогт тохируулан харилцагчийн үйлчилгээний стандарт, олон улсын жишиг, KYC болон зээлийн эдийн засагчдын эрх зүйн хариуцлагын сургалтыг боловсруулав.',
    metrics: ['14 салбарын сүлжээ', '50 орчим ажилтан', 'KYC ба Эрх зүй'],
    keyOutcomes: [
      'Салбар бүрийн онцлогт нийцсэн харилцагчийн үйлчилгээний журам',
      'Зээлийн эдийн засагчийн гэрээ, эрх зүйн хариуцлагын бодит кейс',
      'Харилцагчийг таньж мэдэх (KYC) олон улсын жишиг заавар',
    ],
  },
  {
    id: 'lendmn',
    title: 'Lend.mn — Цахим залилан & "Мөнгөний мул"',
    subtitle: 'Финтек байгууллагын брэнд загварт нийцүүлсэн МУТСТ тусгай сургалт',
    category: 'Кибер залилан & МУТСТ',
    summary:
      'Lend.mn финтек байгууллагад цахим залилан, МУТСТ эрсдэл болон данс түрээслэх "мөнгөний мул" (money mule) схемээс сэргийлэх танилцуулгыг байгууллагын брэнд өнгө төрхөд нийцүүлэн боловсруулсан.',
    metrics: ['Финтек & Цахим зээл', 'Money Mule сэрэмжлүүлэг', 'Тусгайлсан хөтөлбөр'],
    keyOutcomes: [
      'Цахим залилангийн шинэ төрлийн хэв шинжийг илрүүлэх шалгуур',
      'Данс ашиглуулагчийн эрх зүйн үр дагавар ба эрсдэлийн зураглал',
      'Дотоод хяналт болон харилцагчдад зориулсан сэрэмжлүүлгийн систем',
    ],
  },
  {
    id: 'nbfi-study',
    title: '5 тэрбумын ББСБ байгуулах зах зээлийн судалгаа',
    subtitle: 'Улаанбаатар ба орон нутаг (Чойр), Шинэ зөвшөөрөл vs M&A харьцуулалт',
    category: 'Стратеги судалгаа',
    summary:
      'СЗХ-ны 5 тэрбум төгрөгийн дүрмийн сангийн шаардлагын хүрээнд шинээр ББСБ үүсгэн байгуулах болон бэлэн тусгай зөвшөөрөл худалдан авах хувилбарыг Улаанбаатар ба Чойр хотын зах зээлийн өртөг, эрсдэлээр харьцуулсан.',
    metrics: ['5 тэрбум ₮ дүрмийн сан', 'УБ ба Чойр зах зээл', 'M&A Due Diligence'],
    keyOutcomes: [
      'Улаанбаатар хот ба орон нутгийн түрээс, хүний нөөцийн зардлын харьцуулалт',
      'Шинээр зөвшөөрөл авах vs Бэлэн ББСБ худалдан авах өгөөжийн тооцоо',
      'СЗХ-ны зохицуулалт болон хууль эрх зүйн эрсдэлийн нарийвчилсан үнэлгээ',
    ],
  },
];

export const CasesSection: React.FC<CasesSectionProps> = ({ onNavigate }) => {
  const [activeCase, setActiveCase] = useState<CaseStudy>(CASE_STUDIES[0]);

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
            <span className="text-[#0F294A] font-medium">Төсөл & Кейс судалгаа</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight text-balance">
            Хэрэгжүүлсэн төсөл ба салбарын кейс судалгаа
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            ББСБ болон финтек байгууллагуудад хэрэгжүүлсэн сургалт, дотоод хяналт, зах зээлийн судалгааны
            бодит жишээнүүд.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* 3 Clean Selectable Case Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {CASE_STUDIES.map((item) => {
            const isSelected = activeCase.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCase(item)}
                className={`text-left p-6 rounded-xl border transition-colors duration-150 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#0F294A] bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="text-xs text-[#B45309] font-semibold">{item.category}</div>
                  <h3 className="text-base font-bold text-[#0F294A]">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-[#0F294A]">
                  <span>Дэлгэрэнгүй харах</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Case Detail Panel */}
        <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-slate-50/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-slate-500">
                <span>{activeCase.category}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Кейс танилцуулга</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F294A]">{activeCase.title}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                {activeCase.summary}
              </p>

              <div className="pt-2">
                <h4 className="text-xs font-semibold text-slate-500 mb-3">Хүрсэн гол үр дүн</h4>
                <ul className="space-y-2">
                  {activeCase.keyOutcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-[#0F294A] shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-3">Төслийн үзүүлэлт</h4>
                <dl className="divide-y divide-slate-200 border-y border-slate-200 bg-white rounded-lg">
                  {activeCase.metrics.map((metric, idx) => (
                    <div key={idx} className="px-4 py-3 text-sm font-semibold text-[#0F294A] font-mono tabular-nums">
                      {metric}
                    </div>
                  ))}
                </dl>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Байгууллагын дотоод журам, СЗХ-ны шаардлага ба бүтээгдэхүүний онцлогт нийцүүлэн гүйцэтгэсэн.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
