import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import {
  Check,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Database,
  Plus,
  Edit3,
} from 'lucide-react';
import { PageId, ServicePackage } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import {
  checkIsAdminUser,
  createOrderInFirestore,
  DEFAULT_SERVICE_PACKAGES,
  deleteServicePackage,
  seedDefaultServicesToFirestore,
  subscribePublicServices,
  upsertServicePackage,
} from '../lib/firestoreService';

interface ServicesPricingSectionProps {
  onNavigate: (page: PageId) => void;
}

export const ServicesPricingSection: React.FC<ServicesPricingSectionProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<ServicePackage[]>(DEFAULT_SERVICE_PACKAGES);
  const [fromFirestore, setFromFirestore] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncingDb, setSyncingDb] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const autoSeededRef = useRef(false);

  // Order Modal State
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

  // Service Editor Modal State (Admin)
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    shortDesc: '',
    price: '',
    categoryLabel: '',
    deliveryTime: '',
    featuresText: '',
    featured: false,
    orderIndex: 1,
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const verified = await checkIsAdminUser(
          currentUser.uid,
          currentUser.email,
          currentUser.emailVerified
        );
        setIsAdmin(verified);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePublicServices(
      (items) => {
        if (items.length > 0) {
          setServices(items);
          setFromFirestore(true);
        } else {
          setServices(DEFAULT_SERVICE_PACKAGES);
          setFromFirestore(false);
        }
      },
      () => {
        setServices(DEFAULT_SERVICE_PACKAGES);
        setFromFirestore(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Automatically save default packages into Firestore when an authenticated admin visits and collection is empty
  useEffect(() => {
    if (isAdmin && fromFirestore === false && !autoSeededRef.current) {
      autoSeededRef.current = true;
      setSyncingDb(true);
      void seedDefaultServicesToFirestore()
        .catch((err) => {
          setSyncError(
            err instanceof Error ? err.message : 'Үйлчилгээний багцыг хадгалахад алдаа гарлаа.'
          );
        })
        .finally(() => setSyncingDb(false));
    }
  }, [isAdmin, fromFirestore]);

  const handleSaveCatalogToFirestore = async () => {
    setSyncingDb(true);
    setSyncError(null);
    try {
      let currentIsAdmin = isAdmin;
      if (!auth.currentUser) {
        const cred = await signInWithPopup(auth, googleProvider);
        currentIsAdmin = await checkIsAdminUser(
          cred.user.uid,
          cred.user.email,
          cred.user.emailVerified
        );
        setIsAdmin(currentIsAdmin);
      }
      if (!currentIsAdmin) {
        throw new Error('Зөвхөн админ хэрэглэгч үйлчилгээний мэдээллийг өгөгдлийн сан руу хадгалах эрхтэй.');
      }
      await seedDefaultServicesToFirestore();
      setFromFirestore(true);
    } catch (err: unknown) {
      setSyncError(
        err instanceof Error ? err.message : 'Өгөгдлийн сан руу хадгалахад алдаа гарлаа.'
      );
    } finally {
      setSyncingDb(false);
    }
  };

  const openAddServiceModal = () => {
    setEditingServiceId(null);
    setServiceFormError(null);
    setServiceForm({
      name: '',
      shortDesc: '',
      price: '',
      categoryLabel: '',
      deliveryTime: '',
      featuresText: '',
      featured: false,
      orderIndex: services.length + 1,
    });
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (pkg: ServicePackage) => {
    setEditingServiceId(pkg.id);
    setServiceFormError(null);
    setServiceForm({
      name: pkg.name,
      shortDesc: pkg.shortDesc,
      price: pkg.price,
      categoryLabel: pkg.categoryLabel,
      deliveryTime: pkg.deliveryTime,
      featuresText: pkg.features.join('\n'),
      featured: Boolean(pkg.featured),
      orderIndex: pkg.orderIndex ?? 1,
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingService) return;

    setSavingService(true);
    setServiceFormError(null);
    try {
      const features = serviceForm.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      if (features.length === 0) {
        throw new Error('Дор хаяж 1 гол бүрэлдэхүүн оруулна уу.');
      }

      const targetId = editingServiceId || `svc_${Date.now()}`;
      await upsertServicePackage(targetId, {
        name: serviceForm.name,
        shortDesc: serviceForm.shortDesc,
        price: serviceForm.price,
        categoryLabel: serviceForm.categoryLabel,
        deliveryTime: serviceForm.deliveryTime,
        features,
        featured: serviceForm.featured,
        orderIndex: Number(serviceForm.orderIndex) || 1,
      });
      setServiceModalOpen(false);
    } catch (err: unknown) {
      setServiceFormError(
        err instanceof Error ? err.message : 'Үйлчилгээг хадгалахад алдаа гарлаа.'
      );
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setServiceFormError(null);
    try {
      await deleteServicePackage(id);
      setServiceModalOpen(false);
    } catch (err: unknown) {
      setServiceFormError(
        err instanceof Error ? err.message : 'Устгах үед алдаа гарлаа.'
      );
    }
  };

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
      const { orderRef } = await createOrderInFirestore({
        name: orderForm.name,
        organization: orderForm.organization,
        phone: orderForm.phone,
        email: orderForm.email,
        serviceId: selectedPkg.id,
        serviceName: selectedPkg.name,
        packagePrice: selectedPkg.price,
        participantsOrScope: orderForm.participantsOrScope,
        preferredDate: orderForm.preferredDate,
        message: orderForm.message,
      });

      void fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderForm.name,
          organization: orderForm.organization,
          phone: orderForm.phone,
          email: orderForm.email,
          serviceType: `${selectedPkg.name} (${selectedPkg.price})`,
          participantsOrScope: orderForm.participantsOrScope,
          preferredDate: orderForm.preferredDate,
          message: orderForm.message,
          isOrder: true,
        }),
      }).catch(() => {});

      setOrderSuccessRef(orderRef);
      setOrderForm({
        name: '',
        organization: '',
        phone: '',
        email: '',
        participantsOrScope: '',
        preferredDate: '',
        message: '',
      });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error && !err.message.startsWith('{')
          ? err.message
          : 'Захиалга хадгалахад алдаа гарлаа. Мэдээллээ шалгаад дахин оролдоно уу.'
      );
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

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight text-balance">
                Байгууллагад зориулсан үйлчилгээний багц
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Үйлчилгээний багцын мэдээлэл болон захиалга Firestore өгөгдлийн санд хадгалагдана.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {fromFirestore === false && (
                <button
                  type="button"
                  onClick={handleSaveCatalogToFirestore}
                  disabled={syncingDb}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#0F294A] bg-white hover:bg-slate-50 text-[#0F294A] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {syncingDb ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span>Багцуудыг бааз руу хадгалах</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={openAddServiceModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F294A] hover:bg-[#173B69] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Шинэ үйлчилгээ нэмэх</span>
                </button>
              )}
            </div>
          </div>

          {syncError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}
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
                  <th className="py-3.5 px-6 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {services.map((pkg) => (
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
                      <div className="inline-flex items-center gap-2">
                        {isAdmin && fromFirestore && (
                          <button
                            type="button"
                            onClick={() => openEditServiceModal(pkg)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-[#0F294A] hover:bg-slate-100 cursor-pointer"
                            title="Засах"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openOrderModal(pkg)}
                          className="px-3.5 py-1.5 rounded-md border border-[#0F294A] text-[#0F294A] hover:bg-[#0F294A] hover:text-white font-semibold text-xs transition-colors duration-150 cursor-pointer"
                        >
                          Захиалах
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {services.map((pkg) => (
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

              <div className="space-y-2">
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

                {isAdmin && fromFirestore && (
                  <button
                    type="button"
                    onClick={() => openEditServiceModal(pkg)}
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 text-slate-600 hover:text-[#0F294A] hover:bg-slate-50 text-xs font-medium cursor-pointer"
                  >
                    Мэдээллийг засах (Firestore)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ORDER MODAL */}
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
                    <strong>{selectedPkg.name}</strong> ({selectedPkg.price}) багцын захиалга
                    өгөгдлийн санд бүртгэгдлээ. Ажлын 24 цагийн дотор тантай эргэн холбогдох болно.
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
                        minLength={2}
                        maxLength={120}
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
                        minLength={2}
                        maxLength={160}
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
                        minLength={6}
                        maxLength={32}
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
                        minLength={5}
                        maxLength={160}
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
                        maxLength={160}
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
                        maxLength={32}
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
                      maxLength={1500}
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
                        <span>Хадгалж байна...</span>
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

      {/* ADMIN SERVICE ADD / EDIT MODAL */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs font-semibold text-[#B45309]">Firestore Үйлчилгээ</p>
                <h3 className="text-base font-bold text-[#0F294A]">
                  {editingServiceId ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ нэмэх'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                aria-label="Хаах"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Үйлчилгээний нэр <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={140}
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ангилал <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    value={serviceForm.categoryLabel}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, categoryLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Жишиг үнэ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Бэлтгэх хугацаа <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    value={serviceForm.deliveryTime}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, deliveryTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Эрэмбэ
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={serviceForm.orderIndex}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, orderIndex: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Товч тайлбар <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  minLength={5}
                  maxLength={320}
                  value={serviceForm.shortDesc}
                  onChange={(e) => setServiceForm({ ...serviceForm, shortDesc: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Гол бүрэлдэхүүн (мөр бүрт 1 зүйл) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={serviceForm.featuresText}
                  onChange={(e) => setServiceForm({ ...serviceForm, featuresText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceForm.featured}
                  onChange={(e) => setServiceForm({ ...serviceForm, featured: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>Онцлох багц</span>
              </label>

              {serviceFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{serviceFormError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                {editingServiceId ? (
                  <button
                    type="button"
                    onClick={() => void handleDeleteService(editingServiceId)}
                    className="px-4 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    Устгах
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={savingService}
                  className="px-5 py-2.5 rounded-lg bg-[#0F294A] hover:bg-[#173B69] disabled:opacity-60 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
                >
                  {savingService && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Бааз руу хадгалах</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
