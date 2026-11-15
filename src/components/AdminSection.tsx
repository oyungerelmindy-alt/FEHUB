import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Database,
  Edit3,
  Eye,
  Loader2,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { ADMIN_EMAIL, auth, googleProvider } from '../lib/firebase';
import {
  addAdminUser,
  checkIsAdminUser,
  deleteAdminUser,
  deleteContact,
  deleteOrder,
  deleteServicePackage,
  seedDefaultServicesToFirestore,
  subscribeAdminContacts,
  subscribeAdminOrders,
  subscribeAdminUsers,
  subscribePublicServices,
  updateContactStatus,
  updateOrderStatus,
  upsertServicePackage,
} from '../lib/firestoreService';
import {
  AdminUserRecord,
  ContactRecord,
  ContactStatus,
  OrderRecord,
  OrderStatus,
  PageId,
  ServicePackage,
} from '../types';

interface AdminSectionProps {
  onNavigate: (page: PageId) => void;
}

type AdminTab = 'dashboard' | 'orders' | 'services' | 'contacts';

type PendingDelete =
  | { kind: 'order'; id: string; label: string }
  | { kind: 'contact'; id: string; label: string }
  | { kind: 'service'; id: string; label: string }
  | { kind: 'admin'; id: string; label: string };

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Шинэ',
  reviewing: 'Хянагдаж буй',
  confirmed: 'Баталгаажсан',
  closed: 'Хаагдсан',
};

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'Шинэ',
  replied: 'Хариулсан',
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function translateAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code?: unknown }).code ?? '');
    if (code === 'auth/popup-blocked') {
      return 'Хөтөч нэвтрэх цонхыг (popup) хаасан байна. Энэ сайтын pop-up зөвшөөрлийг нээгээд дахин оролдоно уу.';
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Нэвтрэх цонх хаагдлаа. Дахин "Google хаягаар нэвтрэх" товчийг дарна уу.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Одоогийн домэйн Firebase Authentication дээр зөвшөөрөгдөөгүй байна.';
    }
  }
  return err instanceof Error ? err.message : 'Google хаягаар нэвтрэхэд алдаа гарлаа.';
}

function parseFirestoreErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  if (err.message.startsWith('{')) {
    try {
      const parsed = JSON.parse(err.message) as { error?: string };
      if (parsed.error?.includes('Missing or insufficient permissions')) {
        return 'Firestore хандалтын эрх хүрэлцэхгүй байна. Админ эрх болон дүрмийг шалгана уу.';
      }
      return parsed.error || fallback;
    } catch {
      return fallback;
    }
  }
  return err.message;
}

export const AdminSection: React.FC<AdminSectionProps> = ({ onNavigate }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);

  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | ContactStatus>('all');
  const [contactSearch, setContactSearch] = useState('');

  const [dataError, setDataError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const autoSeededRef = useRef(false);

  // Detail & Confirmation Modals
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Co-Admin Allowlist Form State
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Service Editor State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    name: '',
    shortDesc: '',
    price: '',
    categoryLabel: '',
    deliveryTime: '',
    featuresText: '',
    featured: false,
    orderIndex: 1,
  });
  const [savingService, setSavingService] = useState(false);
  const [seedingServices, setSeedingServices] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
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
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) {
      setOrders([]);
      setContacts([]);
      setAdminUsers([]);
      return;
    }

    setDataError(null);
    const unsubOrders = subscribeAdminOrders(
      (list) => setOrders(list),
      (err) => setDataError(parseFirestoreErrorMessage(err, 'Захиалга уншихад алдаа гарлаа.'))
    );
    const unsubContacts = subscribeAdminContacts(
      (list) => setContacts(list),
      (err) => setDataError(parseFirestoreErrorMessage(err, 'Хүсэлт уншихад алдаа гарлаа.'))
    );
    const unsubServices = subscribePublicServices(
      (list) => {
        setServices(list);
        if (list.length === 0 && !autoSeededRef.current) {
          autoSeededRef.current = true;
          void seedDefaultServicesToFirestore().catch(() => {});
        }
      },
      (err) => setDataError(parseFirestoreErrorMessage(err, 'Үйлчилгээ уншихад алдаа гарлаа.'))
    );
    const unsubAdmins = subscribeAdminUsers(
      (list) => setAdminUsers(list),
      () => {}
    );

    return () => {
      unsubOrders();
      unsubContacts();
      unsubServices();
      unsubAdmins();
    };
  }, [user, isAdmin]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    window.setTimeout(() => {
      setActionNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setAuthError(translateAuthError(err));
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    setSelectedOrder(null);
    setSelectedContact(null);
    setPendingDelete(null);
    await signOut(auth);
  };

  const handleCopyUid = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 2500);
    } catch {
      setCopiedUid(false);
    }
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setServiceForm({
      id: '',
      name: '',
      shortDesc: '',
      price: '',
      categoryLabel: '',
      deliveryTime: '',
      featuresText: '',
      featured: false,
      orderIndex: services.length + 1,
    });
  };

  const startEditService = (svc: ServicePackage) => {
    setEditingServiceId(svc.id);
    setServiceForm({
      id: svc.id,
      name: svc.name,
      shortDesc: svc.shortDesc,
      price: svc.price,
      categoryLabel: svc.categoryLabel,
      deliveryTime: svc.deliveryTime,
      featuresText: svc.features.join('\n'),
      featured: Boolean(svc.featured),
      orderIndex: svc.orderIndex ?? 1,
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingService) return;

    setSavingService(true);
    setDataError(null);
    try {
      const targetId = editingServiceId || serviceForm.id.trim() || `svc_${Date.now()}`;
      const features = serviceForm.featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (features.length === 0) {
        throw new Error('Гол бүрэлдэхүүн хэсэгт дор хаяж 1 мөр оруулна уу.');
      }

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

      const savedTitle = serviceForm.name.trim();
      resetServiceForm();
      showNotice(
        editingServiceId
          ? `"${savedTitle}" үйлчилгээний өөрчлөлтийг Firestore-д хадгаллаа.`
          : `"${savedTitle}" шинэ үйлчилгээг Firestore-д бүртгэлээ.`
      );
    } catch (err: unknown) {
      setDataError(parseFirestoreErrorMessage(err, 'Үйлчилгээ хадгалахад алдаа гарлаа.'));
    } finally {
      setSavingService(false);
    }
  };

  const handleSeedDefaultServices = async () => {
    if (seedingServices) return;
    setSeedingServices(true);
    setDataError(null);
    try {
      await seedDefaultServicesToFirestore();
      showNotice('Анхны 3 үйлчилгээний багцыг Firestore-д амжилттай орууллаа.');
    } catch (err: unknown) {
      setDataError(parseFirestoreErrorMessage(err, 'Багц оруулахад алдаа гарлаа.'));
    } finally {
      setSeedingServices(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    setDataError(null);
    try {
      await updateOrderStatus(orderId, status);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      showNotice(`Захиалгын төлөвийг "${ORDER_STATUS_LABELS[status]}" болгож шинэчиллээ.`);
    } catch (err: unknown) {
      setDataError(parseFirestoreErrorMessage(err, 'Захиалгын төлөв шинэчлэхэд алдаа гарлаа.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleContactStatusChange = async (contactId: string, status: ContactStatus) => {
    setUpdatingId(contactId);
    setDataError(null);
    try {
      await updateContactStatus(contactId, status);
      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, status });
      }
      showNotice(`Хүсэлтийн төлөвийг "${CONTACT_STATUS_LABELS[status]}" болгож шинэчиллээ.`);
    } catch (err: unknown) {
      setDataError(parseFirestoreErrorMessage(err, 'Хүсэлтийн төлөв шинэчлэхэд алдаа гарлаа.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingAdmin) return;
    setAddingAdmin(true);
    setDataError(null);
    try {
      await addAdminUser(newAdminUid, newAdminEmail);
      showNotice(`${newAdminEmail.trim()} хаягт админ эрх олголоо.`);
      setNewAdminUid('');
      setNewAdminEmail('');
    } catch (err: unknown) {
      setDataError(parseFirestoreErrorMessage(err, 'Админ эрх нэмэхэд алдаа гарлаа.'));
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDataError(null);
    try {
      if (pendingDelete.kind === 'order') {
        await deleteOrder(pendingDelete.id);
        if (selectedOrder?.id === pendingDelete.id) setSelectedOrder(null);
        showNotice(`"${pendingDelete.label}" захиалгыг устгалаа.`);
      } else if (pendingDelete.kind === 'contact') {
        await deleteContact(pendingDelete.id);
        if (selectedContact?.id === pendingDelete.id) setSelectedContact(null);
        showNotice(`"${pendingDelete.label}" хүсэлтийг устгалаа.`);
      } else if (pendingDelete.kind === 'service') {
        await deleteServicePackage(pendingDelete.id);
        if (editingServiceId === pendingDelete.id) resetServiceForm();
        showNotice(`"${pendingDelete.label}" үйлчилгээг устгалаа.`);
      } else if (pendingDelete.kind === 'admin') {
        await deleteAdminUser(pendingDelete.id);
        showNotice(`"${pendingDelete.label}" админ эрхийг хаслаа.`);
      }
      setPendingDelete(null);
    } catch (err: unknown) {
      setDataError(parseFirestoreErrorMessage(err, 'Устгах үед алдаа гарлаа.'));
    } finally {
      setDeleting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderFilter !== 'all' && o.status !== orderFilter) return false;
      if (!q) return true;
      return (
        o.orderRef.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.serviceName.toLowerCase().includes(q)
      );
    });
  }, [orders, orderFilter, orderSearch]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      if (contactFilter !== 'all' && c.status !== contactFilter) return false;
      if (!q) return true;
      return (
        c.organization.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.serviceType.toLowerCase().includes(q) ||
        (c.message ?? '').toLowerCase().includes(q)
      );
    });
  }, [contacts, contactFilter, contactSearch]);

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const newContactsCount = contacts.filter((c) => c.status === 'new').length;

  return (
    <div className="bg-slate-50 min-h-[70vh]">
      {/* Header & Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-[#0F294A] cursor-pointer"
            >
              Нүүр
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#0F294A] font-medium">Админ удирдлага</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
                Удирдлагын самбар
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Захиалга, үйлчилгээний багц болон ирсэн хүсэлтүүдийг Firestore өгөгдлийн сантай шууд
                удирдана.
              </p>
            </div>

            {user && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#0F294A]">
                    {user.displayName || 'Хэрэглэгч'}
                  </div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Гарах</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {authLoading ? (
          <div className="py-16 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Холболт шалгаж байна...</span>
          </div>
        ) : !user ? (
          /* Login View */
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0F294A] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F294A]">Админ нэвтрэлт (Gmail)</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Удирдлагын хяналтын самбар (Dashboard), захиалга, үйлчилгээ болон хүсэлтүүдийг
                удирдахын тулд эрх бүхий Gmail хаягаар нэвтэрнэ үү.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F294A] hover:bg-[#173B69] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {signingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gmail-ээр нэвтэрч байна...</span>
                </>
              ) : (
                <span>Gmail хаягаар нэвтрэх</span>
              )}
            </button>

            <p className="text-xs text-slate-500">
              Үндсэн админ Gmail: <span className="font-mono text-[#0F294A]">{ADMIN_EMAIL}</span>
            </p>
          </div>
        ) : !isAdmin ? (
          /* Unauthorized View */
          <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h2 className="text-lg font-bold text-[#0F294A]">Хандах эрх хүрэлцэхгүй байна</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Таны нэвтэрсэн хаяг (<strong>{user.email}</strong>) админ эрхгүй байна. Зөвхөн{' '}
              <strong>{ADMIN_EMAIL}</strong> болон бүртгэлтэй админ хэрэглэгч хандах боломжтой.
            </p>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-left space-y-2">
              <div className="text-xs text-slate-500">Таны Firebase UID (эрх нэмүүлэх бол хуулна уу):</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-[#0F294A] break-all">{user.uid}</code>
                <button
                  type="button"
                  onClick={() => void handleCopyUid(user.uid)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 shrink-0 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedUid ? 'Хуулагдлаа' : 'Хуулах'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-[#0F294A] hover:bg-[#173B69] text-white text-xs font-semibold cursor-pointer"
            >
              Өөр хаягаар нэвтрэх
            </button>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="space-y-6">
            {/* Sub-Navigation Tabs: Dashboard | Orders | Services | Contact */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-200/70 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-[#0F294A] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F294A]'
                  }`}
                >
                  Хяналтын самбар
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-white text-[#0F294A] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F294A]'
                  }`}
                >
                  Захиалгууд ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'services'
                      ? 'bg-white text-[#0F294A] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F294A]'
                  }`}
                >
                  Үйлчилгээ ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'contacts'
                      ? 'bg-white text-[#0F294A] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F294A]'
                  }`}
                >
                  Холбоо барих ({contacts.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="text-xs font-semibold text-[#0F294A] hover:text-[#B45309] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                Нийтийн үйлчилгээний хуудас үзэх →
              </button>
            </div>

            {actionNotice && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  aria-label="Мэдэгдэл хаах"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {dataError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dataError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDataError(null)}
                  className="text-rose-700 hover:text-rose-900 cursor-pointer"
                  aria-label="Алдаа хаах"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <dl className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                  <div className="p-6">
                    <dt className="text-xs text-slate-500">Нийт захиалга</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-[#0F294A] font-mono tabular-nums">
                      {orders.length}
                    </dd>
                    <p className="mt-1 text-xs text-slate-400 font-mono tabular-nums">
                      Баталгаажсан: {orders.filter((o) => o.status === 'confirmed').length}
                    </p>
                  </div>
                  <div className="p-6">
                    <dt className="text-xs text-slate-500">Шинэ захиалга</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-[#B45309] font-mono tabular-nums">
                      {newOrdersCount}
                    </dd>
                    <p className="mt-1 text-xs text-slate-400 font-mono tabular-nums">
                      Хянагдаж буй: {orders.filter((o) => o.status === 'reviewing').length}
                    </p>
                  </div>
                  <div className="p-6">
                    <dt className="text-xs text-slate-500">Холбоо барих хүсэлт</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-[#0F294A] font-mono tabular-nums">
                      {contacts.length}
                    </dd>
                    <p className="mt-1 text-xs text-[#B45309] font-mono tabular-nums">
                      Хариулаагүй шинэ: {newContactsCount}
                    </p>
                  </div>
                  <div className="p-6">
                    <dt className="text-xs text-slate-500">Firestore Үйлчилгээ</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-[#0F294A] font-mono tabular-nums">
                      {services.length}
                    </dd>
                    <p className="mt-1 text-xs text-slate-400 font-mono tabular-nums">
                      Онцлох багц: {services.filter((s) => s.featured).length}
                    </p>
                  </div>
                </dl>

                {/* Status Breakdown & Service Catalog Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0F294A]">Захиалгын төлөвийн хуваарилалт</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-semibold text-[#0F294A] hover:underline cursor-pointer"
                      >
                        Удирдах
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(['new', 'reviewing', 'confirmed', 'closed'] as const).map((st) => {
                        const count = orders.filter((o) => o.status === st).length;
                        const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                        return (
                          <div key={st} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700">
                                {ORDER_STATUS_LABELS[st]}
                              </span>
                              <span className="font-mono text-slate-500 tabular-nums">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  st === 'new'
                                    ? 'bg-[#B45309]'
                                    : st === 'confirmed'
                                      ? 'bg-emerald-600'
                                      : st === 'reviewing'
                                        ? 'bg-[#0F294A]'
                                        : 'bg-slate-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0F294A]">Идэвхтэй үйлчилгээний багцууд</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('services')}
                        className="text-xs font-semibold text-[#0F294A] hover:underline cursor-pointer"
                      >
                        Засах / Нэмэх
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {services.length === 0 ? (
                        <div className="p-6 text-xs text-slate-500 text-center">
                          Үйлчилгээ бүртгэгдээгүй байна.
                        </div>
                      ) : (
                        services.slice(0, 4).map((svc) => (
                          <div
                            key={svc.id}
                            className="px-6 py-3 flex items-center justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0F294A] truncate">{svc.name}</div>
                              <div className="text-xs text-slate-500">
                                {svc.categoryLabel} · {svc.deliveryTime}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono font-bold text-[#0F294A] tabular-nums">
                                {svc.price}
                              </div>
                              {svc.featured && (
                                <div className="text-[11px] font-semibold text-[#B45309]">Онцлох</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0F294A]">Сүүлийн захиалгууд</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-semibold text-[#0F294A] hover:underline cursor-pointer"
                      >
                        Бүгдийг харах
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {orders.length === 0 ? (
                        <div className="p-6 text-sm text-slate-500 text-center">
                          Одоогоор захиалга бүртгэгдээгүй байна.
                        </div>
                      ) : (
                        orders.slice(0, 5).map((ord) => (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="w-full text-left px-6 py-3.5 flex items-center justify-between gap-4 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0F294A] truncate">
                                {ord.organization} · {ord.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{ord.serviceName}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono font-semibold text-[#B45309]">
                                {ORDER_STATUS_LABELS[ord.status]}
                              </div>
                              <div className="text-xs text-slate-400 font-mono tabular-nums">
                                {formatDate(ord.createdAt)}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0F294A]">Сүүлийн холбоо барих хүсэлт</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('contacts')}
                        className="text-xs font-semibold text-[#0F294A] hover:underline cursor-pointer"
                      >
                        Бүгдийг харах
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {contacts.length === 0 ? (
                        <div className="p-6 text-sm text-slate-500 text-center">
                          Одоогоор холбоо барих хүсэлт ирээгүй байна.
                        </div>
                      ) : (
                        contacts.slice(0, 5).map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => setSelectedContact(msg)}
                            className="w-full text-left px-6 py-3.5 flex items-center justify-between gap-4 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0F294A] truncate">
                                {msg.organization} · {msg.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{msg.serviceType}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono font-semibold text-slate-700">
                                {CONTACT_STATUS_LABELS[msg.status]}
                              </div>
                              <div className="text-xs text-slate-400 font-mono tabular-nums">
                                {formatDate(msg.createdAt)}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Access & Firestore Reference */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0F294A]">Админ эрхийн бүртгэл (/admins)</h3>
                      <span className="text-xs font-mono text-slate-500">
                        Үндсэн: {ADMIN_EMAIL}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {adminUsers.length === 0 ? (
                        <div className="p-5 text-xs text-slate-500">
                          Нэмэлт админ хэрэглэгч бүртгэгдээгүй байна. Зөвхөн үндсэн имэйл ({ADMIN_EMAIL}) идэвхтэй.
                        </div>
                      ) : (
                        adminUsers.map((adm) => (
                          <div
                            key={adm.id}
                            className="px-6 py-3.5 flex items-center justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0F294A] truncate">{adm.email}</div>
                              <div className="text-xs font-mono text-slate-500 truncate">UID: {adm.id}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  kind: 'admin',
                                  id: adm.id,
                                  label: adm.email,
                                })
                              }
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                              title="Эрх хасах"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#0F294A]">Нэмэлт админ нэмэх</h3>
                      <p className="text-xs text-slate-500">
                        Firebase Project: <span className="font-mono">{firebaseConfig.projectId}</span>
                      </p>
                    </div>

                    <form onSubmit={handleAddAdmin} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Хэрэглэгчийн Firebase UID <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminUid}
                          onChange={(e) => setNewAdminUid(e.target.value)}
                          placeholder="Жишээ: xY9aBc..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Google Имэйл <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="colleague@feh.mn"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addingAdmin}
                        className="w-full py-2 px-4 rounded-lg border border-[#0F294A] text-[#0F294A] hover:bg-[#0F294A] hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {addingAdmin ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>Админ эрх олгох</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'new', 'reviewing', 'confirmed', 'closed'] as const).map((st) => {
                      const count =
                        st === 'all' ? orders.length : orders.filter((o) => o.status === st).length;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrderFilter(st)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                            orderFilter === st
                              ? 'bg-[#0F294A] text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F294A]'
                          }`}
                        >
                          {st === 'all' ? 'Бүгд' : ORDER_STATUS_LABELS[st]} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Дугаар, байгууллагаар хайх..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#0F294A]"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                          <th className="py-3.5 px-5">Дугаар / Огноо</th>
                          <th className="py-3.5 px-5">Захиалагч</th>
                          <th className="py-3.5 px-5">Багц үйлчилгээ</th>
                          <th className="py-3.5 px-5">Тайлбар</th>
                          <th className="py-3.5 px-5">Төлөв</th>
                          <th className="py-3.5 px-5 text-right">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              Захиалга олдсонгүй.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50/70 align-top">
                              <td className="py-4 px-5 whitespace-nowrap">
                                <div className="font-mono text-xs font-bold text-[#0F294A] tabular-nums">
                                  {ord.orderRef}
                                </div>
                                <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                                  {formatDate(ord.createdAt)}
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-semibold text-[#0F294A]">{ord.organization}</div>
                                <div className="text-xs text-slate-600">
                                  {ord.name} · {ord.phone}
                                </div>
                                <div className="text-xs text-slate-500">{ord.email}</div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-medium text-slate-800">{ord.serviceName}</div>
                                <div className="text-xs font-mono text-[#B45309] mt-0.5">
                                  {ord.packagePrice}
                                </div>
                                {ord.participantsOrScope && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    Хамрах хүрээ: {ord.participantsOrScope}
                                  </div>
                                )}
                                {ord.preferredDate && (
                                  <div className="text-xs text-slate-500">
                                    Хүссэн огноо: {ord.preferredDate}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-5 text-xs text-slate-600 max-w-xs line-clamp-2">
                                {ord.message || '—'}
                              </td>
                              <td className="py-4 px-5">
                                <select
                                  value={ord.status}
                                  disabled={updatingId === ord.id}
                                  onChange={(e) =>
                                    void handleOrderStatusChange(ord.id, e.target.value as OrderStatus)
                                  }
                                  className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F294A] disabled:opacity-60"
                                >
                                  <option value="new">Шинэ</option>
                                  <option value="reviewing">Хянагдаж буй</option>
                                  <option value="confirmed">Баталгаажсан</option>
                                  <option value="closed">Хаагдсан</option>
                                </select>
                              </td>
                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(ord)}
                                    className="p-1.5 rounded-md text-slate-500 hover:text-[#0F294A] hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Дэлгэрэнгүй"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingDelete({
                                        kind: 'order',
                                        id: ord.id,
                                        label: `${ord.orderRef} (${ord.organization})`,
                                      })
                                    }
                                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Устгах"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SERVICES */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-[#0F294A]">
                      Бүртгэлтэй үйлчилгээнүүд ({services.length})
                    </h3>
                    {services.length === 0 && (
                      <button
                        type="button"
                        disabled={seedingServices}
                        onClick={() => void handleSeedDefaultServices()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {seedingServices ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Database className="w-3.5 h-3.5" />
                        )}
                        <span>Анхны 3 багцыг Firestore-д оруулах</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
                    {services.length === 0 ? (
                      <div className="p-6 text-sm text-slate-500 text-center">
                        Firestore дахь `services` цуглуулга хоосон байна. Баруун талын маягтаар шинээр
                        нэмэх эсвэл дээрх товчоор анхны 3 багцыг үүсгэнэ үү.
                      </div>
                    ) : (
                      services.map((svc) => (
                        <div key={svc.id} className="p-5 flex items-start justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono text-[#B45309] font-semibold">
                                #{svc.orderIndex ?? 0}
                              </span>
                              <span>·</span>
                              <span>{svc.categoryLabel}</span>
                              <span>·</span>
                              <span className="font-mono font-semibold text-[#0F294A]">{svc.price}</span>
                              <span>·</span>
                              <span className="font-mono">{svc.deliveryTime}</span>
                              {svc.featured && (
                                <>
                                  <span>·</span>
                                  <span className="font-semibold text-[#B45309]">Онцлох багц</span>
                                </>
                              )}
                            </div>
                            <h4 className="font-bold text-[#0F294A]">{svc.name}</h4>
                            <p className="text-xs text-slate-600">{svc.shortDesc}</p>
                            <div className="text-xs text-slate-400 font-mono">
                              Бүрэлдэхүүн: {svc.features.length} мөр
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditService(svc)}
                              className="p-2 rounded-md text-slate-500 hover:text-[#0F294A] hover:bg-slate-100 cursor-pointer"
                              title="Засах"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  kind: 'service',
                                  id: svc.id,
                                  label: svc.name,
                                })
                              }
                              className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Устгах"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add/Edit Service Form */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0F294A]">
                      {editingServiceId ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ нэмэх'}
                    </h3>
                    {editingServiceId && (
                      <button
                        type="button"
                        onClick={resetServiceForm}
                        className="text-xs text-slate-500 hover:text-[#0F294A] cursor-pointer"
                      >
                        Болих
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveService} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Нэр <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={140}
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        placeholder="МУТСТ & KYC Захиалгат сургалт"
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
                          placeholder="Салбарын сургалт"
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
                          placeholder="500,000₮-с"
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
                          placeholder="1–3 ажлын өдөр"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Эрэмбэ (Order)
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
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, shortDesc: e.target.value })
                        }
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
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, featuresText: e.target.value })
                        }
                        placeholder={'FATF 40 зөвлөмж...\nKYC кейс дасгал...'}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceForm.featured}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, featured: e.target.checked })
                        }
                        className="rounded border-slate-300"
                      />
                      <span>Онцлох багцаар тэмдэглэх</span>
                    </label>

                    <button
                      type="submit"
                      disabled={savingService}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0F294A] hover:bg-[#173B69] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingService ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>{editingServiceId ? 'Өөрчлөлт хадгалах' : 'Үйлчилгээ нэмэх'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: CONTACTS */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'new', 'replied'] as const).map((st) => {
                      const count =
                        st === 'all' ? contacts.length : contacts.filter((c) => c.status === st).length;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setContactFilter(st)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                            contactFilter === st
                              ? 'bg-[#0F294A] text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F294A]'
                          }`}
                        >
                          {st === 'all' ? 'Бүгд' : CONTACT_STATUS_LABELS[st]} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Байгууллага, нэрээр хайх..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#0F294A]"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                          <th className="py-3.5 px-5">Огноо</th>
                          <th className="py-3.5 px-5">Илгээгч</th>
                          <th className="py-3.5 px-5">Сонирхсон чиглэл</th>
                          <th className="py-3.5 px-5">Хүсэлтийн агуулга</th>
                          <th className="py-3.5 px-5">Төлөв</th>
                          <th className="py-3.5 px-5 text-right">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {filteredContacts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              Холбоо барих хүсэлт олдсонгүй.
                            </td>
                          </tr>
                        ) : (
                          filteredContacts.map((msg) => (
                            <tr key={msg.id} className="hover:bg-slate-50/70 align-top">
                              <td className="py-4 px-5 text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
                                {formatDate(msg.createdAt)}
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-semibold text-[#0F294A]">{msg.organization}</div>
                                <div className="text-xs text-slate-600">
                                  {msg.name} · {msg.phone}
                                </div>
                                <div className="text-xs text-slate-500">{msg.email}</div>
                              </td>
                              <td className="py-4 px-5 text-xs font-medium text-slate-700 max-w-[200px]">
                                {msg.serviceType}
                              </td>
                              <td className="py-4 px-5 text-xs text-slate-600 max-w-sm line-clamp-2">
                                {msg.message || '—'}
                              </td>
                              <td className="py-4 px-5">
                                <select
                                  value={msg.status}
                                  disabled={updatingId === msg.id}
                                  onChange={(e) =>
                                    void handleContactStatusChange(
                                      msg.id,
                                      e.target.value as ContactStatus
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F294A] disabled:opacity-60"
                                >
                                  <option value="new">Шинэ</option>
                                  <option value="replied">Хариулсан</option>
                                </select>
                              </td>
                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedContact(msg)}
                                    className="p-1.5 rounded-md text-slate-500 hover:text-[#0F294A] hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Унших"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingDelete({
                                        kind: 'contact',
                                        id: msg.id,
                                        label: `${msg.organization} (${msg.name})`,
                                      })
                                    }
                                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Устгах"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <p className="text-xs font-mono font-semibold text-[#B45309] tabular-nums">
                  {selectedOrder.orderRef}
                </p>
                <h3 className="text-base font-bold text-[#0F294A]">Захиалгын дэлгэрэнгүй</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                aria-label="Хаах"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div>
                  <dt className="text-xs text-slate-500">Байгууллага</dt>
                  <dd className="font-semibold text-[#0F294A] mt-0.5">{selectedOrder.organization}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Захиалагч</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{selectedOrder.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Утас</dt>
                  <dd className="font-mono text-slate-800 mt-0.5">{selectedOrder.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Имэйл</dt>
                  <dd className="text-slate-800 mt-0.5 break-all">{selectedOrder.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Үйлчилгээний багц</dt>
                  <dd className="font-semibold text-[#0F294A] mt-0.5">{selectedOrder.serviceName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Жишиг үнэ / Огноо</dt>
                  <dd className="font-mono text-[#B45309] mt-0.5">
                    {selectedOrder.packagePrice} · {formatDate(selectedOrder.createdAt)}
                  </dd>
                </div>
                {selectedOrder.participantsOrScope && (
                  <div>
                    <dt className="text-xs text-slate-500">Хамрах хүрээ</dt>
                    <dd className="text-slate-800 mt-0.5">{selectedOrder.participantsOrScope}</dd>
                  </div>
                )}
                {selectedOrder.preferredDate && (
                  <div>
                    <dt className="text-xs text-slate-500">Хүссэн огноо</dt>
                    <dd className="font-mono text-slate-800 mt-0.5">{selectedOrder.preferredDate}</dd>
                  </div>
                )}
              </dl>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Нэмэлт тайлбар</div>
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedOrder.message || 'Тайлбар бичигдээгүй.'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Төлөв:</span>
                  <select
                    value={selectedOrder.status}
                    disabled={updatingId === selectedOrder.id}
                    onChange={(e) =>
                      void handleOrderStatusChange(
                        selectedOrder.id,
                        e.target.value as OrderStatus
                      )
                    }
                    className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-800"
                  >
                    <option value="new">Шинэ</option>
                    <option value="reviewing">Хянагдаж буй</option>
                    <option value="confirmed">Баталгаажсан</option>
                    <option value="closed">Хаагдсан</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-lg bg-[#0F294A] text-white text-xs font-semibold cursor-pointer"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT DETAIL MODAL */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <p className="text-xs font-mono text-slate-500 tabular-nums">
                  {formatDate(selectedContact.createdAt)}
                </p>
                <h3 className="text-base font-bold text-[#0F294A]">Холбоо барих хүсэлт</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                aria-label="Хаах"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div>
                  <dt className="text-xs text-slate-500">Байгууллага</dt>
                  <dd className="font-semibold text-[#0F294A] mt-0.5">{selectedContact.organization}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Илгээгч</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{selectedContact.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Утас</dt>
                  <dd className="font-mono text-slate-800 mt-0.5">{selectedContact.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Имэйл</dt>
                  <dd className="text-slate-800 mt-0.5 break-all">{selectedContact.email}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Сонирхсон чиглэл</dt>
                  <dd className="font-medium text-[#0F294A] mt-0.5">{selectedContact.serviceType}</dd>
                </div>
              </dl>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Хүсэлтийн агуулга</div>
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message || 'Агуулга бичигдээгүй.'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Төлөв:</span>
                  <select
                    value={selectedContact.status}
                    disabled={updatingId === selectedContact.id}
                    onChange={(e) =>
                      void handleContactStatusChange(
                        selectedContact.id,
                        e.target.value as ContactStatus
                      )
                    }
                    className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-800"
                  >
                    <option value="new">Шинэ</option>
                    <option value="replied">Хариулсан</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 rounded-lg bg-[#0F294A] text-white text-xs font-semibold cursor-pointer"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#0F294A]">Устгах үйлдэл баталгаажуулах</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Та <strong>{pendingDelete.label}</strong> бүртгэлийг Firestore өгөгдлийн сангаас
                бүрмөсөн устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Болих
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Устгах</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
