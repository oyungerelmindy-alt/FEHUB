import React, { useState } from 'react';
import { Mail, Globe, MapPin, Send, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { PageId } from '../types';

interface ContactSectionProps {
  onNavigate: (page: PageId) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onNavigate }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    serviceType: 'МУТСТ & KYC Захиалгат сургалт (500,000₮-с)',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Хүсэлт илгээхэд алдаа гарлаа.');
      }

      setFormSubmitted(true);
      setFormData({
        name: '',
        organization: '',
        phone: '',
        email: '',
        serviceType: 'МУТСТ & KYC Захиалгат сургалт (500,000₮-с)',
        message: '',
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Сүлжээний алдаа гарлаа. Та дахин оролдоно уу.');
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
            <span className="text-[#0F294A] font-medium">Холбоо барих</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight text-balance">
            Хамтын ажиллагаа ба Холбоо барих
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Байгууллагын захиалгат сургалт, ТУЗ-ийн засаглал болон KPI/OKR систем нэвтрүүлэх асуудлаар
            доорх сувгуудаар шууд холбогдоно уу.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Official Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0F294A]">Албан ёсны хаяг ба сувгууд</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Санхүүгийн боловсролын зангилаа ГҮТББ (FEHUB) болон зөвлөх үйлчилгээний ажлын алба.
              </p>
            </div>

            <dl className="divide-y divide-slate-200 border-y border-slate-200 bg-white rounded-xl border-x">
              <div className="p-4 flex items-start gap-3.5">
                <Mail className="w-4 h-4 text-[#0F294A] shrink-0 mt-1" />
                <div>
                  <dt className="text-xs text-slate-500">Цахим шуудан</dt>
                  <dd className="text-sm font-semibold text-[#0F294A] mt-0.5">
                    <a href="mailto:oyungerel.mindy@gmail.com" className="hover:underline">
                      oyungerel.mindy@gmail.com
                    </a>
                  </dd>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3.5">
                <Globe className="w-4 h-4 text-[#0F294A] shrink-0 mt-1" />
                <div>
                  <dt className="text-xs text-slate-500">Албан ёсны цахим хуудас</dt>
                  <dd className="text-sm font-semibold text-[#0F294A] mt-0.5">
                    <a
                      href="https://feh.mn"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      www.feh.mn
                    </a>
                  </dd>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3.5">
                <MapPin className="w-4 h-4 text-[#0F294A] shrink-0 mt-1" />
                <div>
                  <dt className="text-xs text-slate-500">Хаяг</dt>
                  <dd className="text-sm font-medium text-slate-800 mt-0.5 leading-snug">
                    Улаанбаатар хот, Чингэлтэй дүүрэг, Бага тойруу, JJ Tower, 10 давхар
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Right: Clean Inquiry Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-[#0F294A]">Санал авах маягт</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Мэдээллээ үлдээснээр ажлын 24 цагийн дотор эргэн холбогдох болно.
            </p>

            {formSubmitted ? (
              <div className="py-8 text-center space-y-3 bg-slate-50 rounded-lg border border-slate-200 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-[#0F294A]">Хүсэлтийг амжилттай хүлээн авлаа</h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Баярлалаа. Таны илгээсэн мэдээллийг хүлээн авсан бөгөөд тун удахгүй эргэн холбогдох болно.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSubmitted(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
                >
                  Дахин хүсэлт илгээх
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Таны нэр <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="ББСБ / Байгууллагын нэр"
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
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@organization.mn"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Сонирхож буй үйлчилгээ
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0F294A]"
                  >
                    <option value="МУТСТ & KYC Захиалгат сургалт (500,000₮-с)">
                      МУТСТ & KYC Захиалгат сургалт (500,000₮-с)
                    </option>
                    <option value="KPI / OKR & Excel Dashboard багц (800,000₮-с)">
                      KPI / OKR & Excel Dashboard багц (800,000₮-с)
                    </option>
                    <option value="ТУЗ & Засаглалын баримт бичгийн багц (900,000₮-с)">
                      ТУЗ & Засаглалын баримт бичгийн багц (900,000₮-с)
                    </option>
                    <option value="5 тэрбумын ББСБ байгуулах судалгаа">
                      5 тэрбумын ББСБ байгуулах судалгаа
                    </option>
                    <option value="Бусад хамтын ажиллагаа">Бусад хамтын ажиллагаа</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Тайлбар, хүсэлтийн агуулга
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Байгууллагын ажилтны тоо, сургалтын хугацаа эсвэл зөвлөх ажлын хэрэгцээгээ бичнэ үү..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0F294A] resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-6 rounded-lg bg-[#0F294A] hover:bg-[#173B69] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Илгээж байна...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Хүсэлт илгээх</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
