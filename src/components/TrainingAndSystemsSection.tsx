import React, { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { KpiSheetItem, PageId, TrainingModule } from '../types';

interface TrainingAndSystemsSectionProps {
  onNavigate: (page: PageId) => void;
}

type ActiveTab = 'aml' | 'kpi' | 'standards';

const TRAINING_MODULES: TrainingModule[] = [
  {
    number: 1,
    title: 'МУТСТ суурь ойлголт ба FATF 40 зөвлөмж',
    category: 'Хууль эрх зүй',
    hours: '1–2 цаг',
    focus: 'Мөнгө угаах үе шатууд, FATF зөвлөмжийн гол заалтууд ба ББСБ-ын үүрэг.',
  },
  {
    number: 2,
    title: '11 шууд үр дүн ба Үндэсний эрсдэлийн үнэлгээ (ҮЭҮ)',
    category: 'Нийцэл',
    hours: '1–2 цаг',
    focus: 'APG 2027–2028 харилцан үнэлгээний аргачлал ба шалгуур үзүүлэлтүүд.',
  },
  {
    number: 3,
    title: 'KYC ба Эцсийн өмчлөгчийг таньж тогтоох',
    category: 'Үйл ажиллагаа',
    hours: '1 цаг',
    focus: 'Харилцагчийг таньж мэдэх стандарт, улс төрд нөлөө бүхий этгээд (PEP) шалгалт.',
  },
  {
    number: 4,
    title: 'Зээлийн эдийн засагчдын эрх зүйн хариуцлага',
    category: 'Эрсдэл',
    hours: '1 цаг',
    focus: 'Гэрээний стандарт, зээлийн шинжилгээний эрх зүйн эрсдэлээс сэргийлэх.',
  },
  {
    number: 5,
    title: 'Цахим залилан ба "Мөнгөний мул" эрсдэл',
    category: 'Эрсдэл',
    hours: '1 цаг',
    focus: 'Шинэ төрлийн залилангийн схем ба сэжигтэй гүйлгээг эрт илрүүлэх.',
  },
  {
    number: 6,
    title: 'Харилцагчийн үйлчилгээний соёл ба стандарт',
    category: 'Үйл ажиллагаа',
    hours: '1 цаг',
    focus: 'Салбарын үйлчилгээний ёс зүй, гомдол маргаан шийдвэрлэх журам.',
  },
  {
    number: 7,
    title: 'ББСБ-ын эрсдэлийн нэгдсэн удирдлага',
    category: 'Эрсдэл',
    hours: '1.5 цаг',
    focus: 'Зээл, зах зээл, үйл ажиллагааны эрсдэлийн матриц ба хязгаар тогтоолт.',
  },
  {
    number: 8,
    title: 'KPI ба OKR гүйцэтгэлийн удирдлагын практик',
    category: 'Менежмент',
    hours: '2 цаг',
    focus: '8 хуудаст үнэлгээний систем, зорилт уялдуулалт ба урамшууллын тооцоо.',
  },
  {
    number: 9,
    title: 'Дижитал хэрэгсэл ба ажлын бүтээмж',
    category: 'Менежмент',
    hours: '1 цаг',
    focus: 'Өдөр тутмын тайлагнал, мэдээлэл боловсруулах хурдыг нэмэгдүүлэх.',
  },
  {
    number: 10,
    title: 'Өөрчлөлтийн удирдлага ба ажилтны хөгжил',
    category: 'Менежмент',
    hours: '1.5 цаг',
    focus: 'Байгууллагын шинэ соёл нэвтрүүлэх, багийн хамтын ажиллагааг бэхжүүлэх.',
  },
  {
    number: 11,
    title: 'Сэжигтэй ба бэлэн мөнгөний гүйлгээ тайлагнах (СЗХ)',
    category: 'Нийцэл',
    hours: '1 цаг',
    focus: 'CTR, STR тайлангийн хугацаа, маягт болон хяналт шалгалтын бэлтгэл.',
  },
  {
    number: 12,
    title: 'Кейс хэлэлцүүлэг ба Moodle шалгалт',
    category: 'Нийцэл',
    hours: '1 цаг',
    focus: 'Практик дасгал, Moodle платформоор шалгалт өгч автомат гэрчилгээ авах.',
  },
];

const KPI_SHEETS: KpiSheetItem[] = [
  {
    id: 1,
    name: 'Байгууллагын OKR',
    description: 'Компанийн стратеги зорилго, гол үр дүнгүүдийг жил, улирлаар хэмжих суурь хуудас.',
    targetUser: 'ТУЗ & Гүйцэтгэх удирдлага',
    details: [
      'Стратеги тэргүүлэх чиглэл ба амжилтын түлхүүр үзүүлэлтүүд',
      'Бизнесийн өсөлт, эрсдэлийн хязгаар, засаглалын зорилтууд',
      'Улирал бүрийн бодит биелэлтийн хяналт',
    ],
  },
  {
    id: 2,
    name: 'Албан тушаалын KPI',
    description: 'Нэгж, хэлтэс болон албан тушаал бүрийн үндсэн чиг үүргийн хэмжигдэхүүнүүд.',
    targetUser: 'Хэлтсийн захирал, Менежер',
    details: [
      'Зээлийн багцын чанар, хугацаа хэтрэлтийн түвшин',
      'МУТСТ нийцэл ба KYC баримт бичгийн бүрэн бүтэн байдал',
      'Харилцагчийн сэтгэл ханамж, үйлчилгээний стандарт',
    ],
  },
  {
    id: 3,
    name: 'Ажилтны OKR',
    description: 'Ажилтан бүрийн улирлын хувийн бүтээмж, ур чадварын өсөлтийг тодорхойлох хуудас.',
    targetUser: 'Бүх шатны мэргэжилтэн',
    details: [
      'Хувь хүний ур чадварын өсөлт, сургалтын цагийн биелэлт',
      'Шинэ санал санаачилга, бүтээмжийн ахиц',
      'Өдөр тутмын үйл ажиллагааны даалгаврын биелэлт',
    ],
  },
  {
    id: 4,
    name: 'Улирлын үнэлгээ',
    description: 'Улирал тутам ажлын гүйцэтгэлийг дүгнэж, урамшуулалтай уялдуулах бүтэц.',
    targetUser: 'Хүний нөөц & Удирдлага',
    details: [
      'Төлөвлөгөө ба бодит гүйцэтгэлийн хувьчилсан үнэлгээ',
      'Удирдлагын болон багийн үнэлгээний нэгтгэл',
      'Дараа улирлын сайжруулах чиглэл',
    ],
  },
  {
    id: 5,
    name: 'Жилийн үнэлгээ',
    description: 'Жилийн нэгдсэн гүйцэтгэл, албан тушаал дэвших, шагнал урамшууллын тайлан.',
    targetUser: 'ТУЗ & Гүйцэтгэх захирал',
    details: [
      'Дөрвөн улирлын жигнэсэн дундаж гүйцэтгэл',
      'Байгууллагын үнэт зүйл, ёс зүйн нийцэл',
      'Карьер төлөвлөлт, залгамж халааны үнэлгээ',
    ],
  },
  {
    id: 6,
    name: 'Хяналтын самбар (Dashboard)',
    description: 'KPI-ийн зөрүү, OKR-ийн ахиц, сургалтын хэрэгцээг нэг дор харуулах самбар.',
    targetUser: 'Удирдах зөвлөл & Менежер',
    details: [
      'Төлөвлөгөө ба гүйцэтгэлийн зөрүүгийн график',
      'Нэгж, албан тушаалаар эрэмбэлэгдсэн гүйцэтгэлийн индекс',
      'Сургалтын хэрэгцээг автоматаар тодорхойлох үзүүлэлт',
    ],
  },
  {
    id: 7,
    name: 'KPI лавлах сан',
    description: 'Бүх үзүүлэлтийн томьёолол, тооцоолох аргачлал, мэдээллийн эх сурвалжийн стандарт.',
    targetUser: 'Санхүү, Эрсдэл, Хүний нөөц',
    details: [
      'Шалгуур үзүүлэлт бүрийн нэгдсэн томьёо',
      'Тоо баримт цуглуулах системийн эх сурвалж',
      'Хэмжих давтамж ба шалгах аргачлал',
    ],
  },
  {
    id: 8,
    name: 'Үнэлгээний заавар',
    description: 'Оноожуулах дүрэм, шалгуурын тайлбар ба үнэлгээний алдаанаас сэргийлэх гарын авлага.',
    targetUser: 'Нийт ажилтнууд',
    details: [
      'Үнэлгээ хийх үе шат, хугацааны хуваарь',
      'Бодитой үнэлгээ өгөх арга зүйн зөвлөмж',
      'Санал зөрөлдөөнийг шийдвэрлэх журам',
    ],
  },
];

const CATEGORIES = ['Бүгд', 'Хууль эрх зүй', 'Нийцэл', 'Үйл ажиллагаа', 'Эрсдэл', 'Менежмент'];

export const TrainingAndSystemsSection: React.FC<TrainingAndSystemsSectionProps> = ({
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('aml');
  const [categoryFilter, setCategoryFilter] = useState('Бүгд');
  const [selectedSheet, setSelectedSheet] = useState<KpiSheetItem>(KPI_SHEETS[5]);
  const [seminarImageError, setSeminarImageError] = useState(false);

  const filteredModules =
    categoryFilter === 'Бүгд'
      ? TRAINING_MODULES
      : TRAINING_MODULES.filter((m) => m.category === categoryFilter);

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
            <span className="text-[#0F294A] font-medium">Сургалт & Систем</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight text-balance">
                Сургалтын хөтөлбөр, KPI/OKR систем ба стандарт
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                МУТСТ 12 модульт хөтөлбөр, 8 хуудас бүхий гүйцэтгэлийн удирдлагын загвар болон FEHUB-ийн
                албан баримт бичгийн стандартууд.
              </p>
            </div>

          {/* Clean Segmented Control */}
          <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('aml')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'aml'
                  ? 'bg-white text-[#0F294A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F294A]'
              }`}
            >
              МУТСТ 12 Модуль
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kpi')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'kpi'
                  ? 'bg-white text-[#0F294A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F294A]'
              }`}
            >
              KPI / OKR 8 Хуудас
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('standards')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'standards'
                  ? 'bg-white text-[#0F294A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F294A]'
              }`}
            >
              Стандарт & FEHUB
            </button>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* TAB 1: AML 12-Module Institutional Catalog Table */}
        {activeTab === 'aml' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-[#0F294A] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#0F294A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Нийт {filteredModules.length} модуль
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                      <th className="py-3.5 px-5 w-16">№</th>
                      <th className="py-3.5 px-5">Модулийн нэр</th>
                      <th className="py-3.5 px-5 whitespace-nowrap">Чиглэл</th>
                      <th className="py-3.5 px-5 whitespace-nowrap">Хугацаа</th>
                      <th className="py-3.5 px-5">Гол агуулга</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredModules.map((mod) => (
                      <tr key={mod.number} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 font-mono text-xs font-semibold text-[#B45309] tabular-nums">
                          {String(mod.number).padStart(2, '0')}
                        </td>
                        <td className="py-4 px-5 font-semibold text-[#0F294A]">{mod.title}</td>
                        <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap">
                          {mod.category}
                        </td>
                        <td className="py-4 px-5 text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {mod.hours}
                        </td>
                        <td className="py-4 px-5 text-xs sm:text-sm text-slate-600 max-w-md">
                          {mod.focus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KPI / OKR 8-Sheet Explorer */}
        {activeTab === 'kpi' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden bg-white">
              {KPI_SHEETS.map((sheet) => {
                const isActive = selectedSheet.id === sheet.id;
                return (
                  <button
                    key={sheet.id}
                    type="button"
                    onClick={() => setSelectedSheet(sheet)}
                    className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                      isActive ? 'bg-[#0F294A] text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-xs font-mono font-semibold tabular-nums shrink-0 ${
                          isActive ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        0{sheet.id}
                      </span>
                      <span className="text-sm font-semibold truncate">{sheet.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 border border-slate-200 rounded-xl p-6 sm:p-8 bg-slate-50/50 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 text-xs text-slate-500">
                <span className="font-mono font-semibold text-[#B45309] tabular-nums">
                  Хуудас 0{selectedSheet.id} / 08
                </span>
                <span>Хэрэглэгч: {selectedSheet.targetUser}</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0F294A]">
                  {selectedSheet.name}
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {selectedSheet.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-500">Бүрэлдэхүүн хэсгүүд</h4>
                <ul className="space-y-2.5">
                  {selectedSheet.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-[#0F294A] shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Standards & FEHUB Infrastructure */}
        {activeTab === 'standards' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5">
              <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {!seminarImageError ? (
                  <img
                    src="/src/assets/images/training_seminar_hall_1794638591563.jpg"
                    alt="FEHUB танхимийн болон удирдлагын сургалтын орчин"
                    referrerPolicy="no-referrer"
                    onError={() => setSeminarImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-sm text-slate-500">
                    Санхүүгийн боловсролын зангилаа сургалтын орчин
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white">
              <div className="p-6 space-y-1.5">
                <div className="text-xs font-mono font-semibold text-[#B45309]">01.</div>
                <h3 className="text-base font-bold text-[#0F294A]">
                  Албан хэрэг хөтлөлт ба баримт бичгийн стандарт
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  ТУЗ-ийн хурлын протокол, тогтоолын төсөлд санал авах хуудас, аудитын хорооны тайлан болон
                  төлөвлөгөөний баримт бичгүүдийг Times New Roman нэгдсэн форматаар цэгцлэн боловсруулна.
                </p>
              </div>

              <div className="p-6 space-y-1.5">
                <div className="text-xs font-mono font-semibold text-[#B45309]">02.</div>
                <h3 className="text-base font-bold text-[#0F294A]">
                  Автомат төлөвлөлт ба сургалтын хэрэгцээний шинжилгээ
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Google Forms судалгааг Excel Dashboard-тай холбон ажилтнуудын сургалтын хэрэгцээг албан
                  тушаалаар ангилж, ажлын өдөр тооцоолол болон SMART зорилтын хяналтыг автоматжуулна.
                </p>
              </div>

              <div className="p-6 space-y-1.5">
                <div className="text-xs font-mono font-semibold text-[#B45309]">03.</div>
                <h3 className="text-base font-bold text-[#0F294A]">
                  Moodle цахим сургалт ба СЗХ-ны хамтарсан гэрчилгээ
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  FEHUB (feh.mn) платформоор дамжуулан онлайн болон танхимийн МУТСТ сургалт явуулж, тестээр
                  баталгаажуулан албан ёсны гэрчилгээг автоматаар олгоно.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
