import React, { useState } from 'react';
import { Check, X, Send, Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { PageId, ServicePackage } from '../types';

interface ServicesPricingSectionProps {
  onNavigate: (page: PageId) => void;
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'aml-training',
    name: 'МУТСТ & KYC Захиалгат сургалт',
    shortDesc: 'Байгууллагын онцлогт нийцүүлсэн сургалт, практик кейс ба шалгалтын багц.',
    price: '500,000₮-с',
    categoryLabel: 'Салбарын сургалт',
    deliveryTime: '1–3 ажлын өдөр',
    featured: true,
    features: [
      'FATF 40 зөвлөмж, 11 шууд үр дүн ба APG 2027–2028 бэлтгэл',
      'KYC, цахим залилан ба "Мөнгөний мул" эрсдэлийн кейс',
      'Зээлийн эдийн засагчийн эрх зүйн хариуцлага, Moodle тест',
    ],
  },
  {
    id: 'kpi-okr-bundle',
    name: 'KPI / OKR & Excel Dashboard багц',
    shortDesc: '8 хуудаст үнэлгээний загвар, автомат ажлын өдөр тооцоологч ба SMART төлөвлөгөө.',
    price: '800,000₮-с',
    categoryLabel: 'Удирдлагын систем',
    deliveryTime: '5–7 ажлын өдөр',
    features: [
      'Байгууллагын OKR, Албан тушаалын KPI, Ажилтны OKR (8 хуудас)',
      'Улирал, жилийн үнэлгээ болон автомат Dashboard хяналт',
      'Google Forms судалгааг Excel тайлантай холбох шийдэл',
    ],
  },
  {
    id: 'bod-governance',
    name: 'ТУЗ & Засаглалын баримт бичгийн багц',
    shortDesc: 'Хурлын протокол, тогтоолын санал авах хуудас ба аудитын хорооны тайлангийн загвар.',
    price: '900,000₮-с',
    categoryLabel: 'ББСБ Засаглал',
    deliveryTime: '5–10 ажлын өдөр',
    features: [
      'ТУЗ-ийн хурлын протокол, шийдвэрийн хэрэгжилтийн бүртгэл',
      'Тогтоолын төсөлд санал авах хуудас ба аудитын загвар',
      'СЗХ-ны шаардлага, нийцлийн зөвлөх үйлчилгээтэй уялдуулах',
    ],
  },
];

export const ServicesPricingSection: React.FC<ServicesPricingSectionProps> = ({ onNavigate }) => {
  const [selectedPkg, setSelectedPkg] = useState<ServicePackage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccessRef, setOrderSuccessRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [orderForm, setOrderForm] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    participantsOrScope: '',
    preferredDate: '',
    message: '',
  });

  const openOrderModal = (pkg: ServicePackage) => {
    setSelectedPkg(pkg);
    setOrderSuccessRef(null);
    setErrorMsg(null);
  };

  const closeOrderModal = () => {
    setSelectedPkg(null);
    setOrderSuccessRef(null);
    setErrorMsg(null);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderForm.name,
          organization: orderForm.organization,
          phone: orderForm.phone,
          email: orderForm.email,
          serviceType: `${selectedPkg.name} (${selectedPkg.price})`,
          packageId: selectedPkg.id,
          packagePrice: selectedPkg.price,
          participantsOrScope: orderForm.participantsOrScope,
          preferredDate: orderForm.preferredDate,
          message: orderForm.message,
          isOrder: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Захиалга илгээхэд алдаа гарлаа.');
      }

      setOrderSuccessRef(data.orderRef || 'ЗАХ-2026');
      setOrderForm({
        name: '',
        organization: '',
        phone: '',
        email: '',
        participantsOrScope: '',
        preferredDate: '',
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Сүлжээний алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  };

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
            <span className="text-[#0F294A] font-medium">Үйлчилгээ ба Ханш</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight text-balance">
            Байгууллагад зориулсан үйлчилгээний багц
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Байгууллагын цар хүрээ, ажилтны тоонд нийцүүлэн захиалга өгөх боломжтой бөгөөд ажлын 24 цагийн
            дотор эцсийн санал хүргүүлнэ.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Clean Service Schedule Table */}
        <div className="mb-10 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 px-6">Үйлчилгээний нэр</th>
                  <th className="py-3.5 px-6">Ангилал</th>
                  <th className="py-3.5 px-6">Бэлтгэх хугацаа</th>
                  <th className="py-3.5 px-6 text-right">Жишиг үнэ</th>
                  <th className="py-3.5 px-6 text-right">Захиалга</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {SERVICE_PACKAGES.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#0F294A]">{pkg.name}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {pkg.categoryLabel}
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {pkg.deliveryTime}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-[#0F294A] text-right tabular-nums whitespace-nowrap">
                      {pkg.price}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openOrderModal(pkg)}
                        className="px-3.5 py-1.5 rounded-md border border-[#0F294A] text-[#0F294A] hover:bg-[#0F294A] hover:text-white font-semibold text-xs transition-colors duration-150 cursor-pointer"
                      >
                        Захиалах
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3 Clean Service Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SERVICE_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-xl p-6 sm:p-7 flex flex-col justify-between bg-white border transition-colors ${
                pkg.featured ? 'border-[#0F294A]' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>{pkg.categoryLabel}</span>
                  <span className="font-mono tabular-nums">{pkg.deliveryTime}</span>
                </div>

                <h3 className="text-lg font-bold text-[#0F294A]">{pkg.name}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{pkg.shortDesc}</p>

                <div className="my-5 py-4 border-y border-slate-100 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#0F294A] font-mono tabular-nums">
                    {pkg.price}
                  </span>
                  <span className="text-xs text-slate-500">НӨАТ-гүй жишиг үнэ</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-[#0F294A] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => openOrderModal(pkg)}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors duration-150 cursor-pointer ${
                  pkg.featured
                    ? 'bg-[#0F294A] hover:bg-[#173B69] text-white'
                    : 'bg-slate-100 hover:bg-[#0F294A] text-[#0F294A] hover:text-white'
                }`}
              >
                Энэ багцыг захиалах
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Clean Institutional Order Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs font-semibold text-[#B45309]">Үйлчилгээний захиалга</p>
                <h3 className="text-base font-bold text-[#0F294A]">{selectedPkg.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeOrderModal}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Хаах"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {orderSuccessRef ? (
                <div className="py-6 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
                      Бүртгэлийн дугаар: {orderSuccessRef}
                    </div>
                    <h4 className="text-lg font-bold text-[#0F294A]">
                      Захиалгыг амжилттай хүлээн авлаа
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    <strong>{selectedPkg.name}</strong> ({selectedPkg.price}) багцын хүсэлт бүртгэгдлээ.
                    Ажлын 24 цагийн дотор тантай эргэн холбогдох болно.
                  </p>
                  <button
                    type="button"
                    onClick={closeOrderModal}
                    className="px-5 py-2 rounded-lg bg-[#0F294A] text-white font-semibold text-sm cursor-pointer"
                  >
                    Хаах
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      <div className="font-semibold text-[#0F294A]">{selectedPkg.name}</div>
                      <div className="mt-0.5">Гүйцэтгэх хугацаа: {selectedPkg.deliveryTime}</div>
                    </div>
                    <div className="text-sm font-mono font-bold text-[#0F294A] tabular-nums shrink-0">
                      {selectedPkg.price}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Таны нэр <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                        placeholder="Овог, Нэр"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Байгууллага <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderForm.organization}
                        onChange={(e) => setOrderForm({ ...orderForm, organization: e.target.value })}
                        placeholder="ББСБ / Компанийн нэр"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Утасны дугаар <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                        placeholder="9911-XXXX"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Имэйл хаяг <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={orderForm.email}
                        onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                        placeholder="name@company.mn"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Ажилтны / Салбарын тоо
                      </label>
                      <input
                        type="text"
                        value={orderForm.participantsOrScope}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, participantsOrScope: e.target.value })
                        }
                        placeholder="Жишээ: 30 ажилтан, 5 салбар"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Хүсэж буй огноо
                      </label>
                      <input
                        type="date"
                        value={orderForm.preferredDate}
                        onChange={(e) => setOrderForm({ ...orderForm, preferredDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Нэмэлт тайлбар
                    </label>
                    <textarea
                      rows={3}
                      value={orderForm.message}
                      onChange={(e) => setOrderForm({ ...orderForm, message: e.target.value })}
                      placeholder="Сургалтын сэдэв, баримт бичгийн онцлог шаардлагаа бичнэ үү..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A] resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-5 rounded-lg bg-[#0F294A] hover:bg-[#173B69] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Илгээж байна...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Захиалга илгээх</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
