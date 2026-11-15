import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ADMIN_EMAIL, db, handleFirestoreError, OperationType } from './firebase';
import {
  AdminUserRecord,
  ContactRecord,
  ContactStatus,
  OrderRecord,
  OrderStatus,
  ServicePackage,
} from '../types';

export const DEFAULT_SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'aml-training',
    name: 'МУТСТ & KYC Захиалгат сургалт',
    shortDesc: 'Байгууллагын онцлогт нийцүүлсэн сургалт, практик кейс ба шалгалтын багц.',
    price: '500,000₮-с',
    categoryLabel: 'Салбарын сургалт',
    deliveryTime: '1–3 ажлын өдөр',
    featured: true,
    orderIndex: 1,
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
    featured: false,
    orderIndex: 2,
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
    featured: false,
    orderIndex: 3,
    features: [
      'ТУЗ-ийн хурлын протокол, шийдвэрийн хэрэгжилтийн бүртгэл',
      'Тогтоолын төсөлд санал авах хуудас ба аудитын загвар',
      'СЗХ-ны шаардлага, нийцлийн зөвлөх үйлчилгээтэй уялдуулах',
    ],
  },
];

function sanitizeText(value: string | undefined, maxLength: number): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

function generateDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

function toDateOrNull(val: unknown): Date | null {
  if (val instanceof Timestamp) return val.toDate();
  if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

export async function checkIsAdminUser(
  uid: string,
  email: string | null,
  emailVerified = true
): Promise<boolean> {
  if (!emailVerified) {
    return false;
  }
  if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export function subscribeAdminUsers(
  onData: (admins: AdminUserRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'admins';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdminUserRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          email: String(d.email ?? ''),
          role: 'admin',
          createdAt: toDateOrNull(d.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function addAdminUser(uid: string, email: string): Promise<void> {
  const cleanUid = uid.trim();
  const cleanEmail = sanitizeText(email, 160);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanUid)) {
    throw new Error('Хэрэглэгчийн UID зөвхөн үсэг, тоо, _ болон - тэмдэгтээс бүрдэх ёстой.');
  }
  if (cleanEmail.length < 5 || !cleanEmail.includes('@')) {
    throw new Error('Хүчинтэй имэйл хаяг оруулна уу.');
  }
  const path = `admins/${cleanUid}`;
  try {
    await setDoc(doc(db, 'admins', cleanUid), {
      email: cleanEmail,
      role: 'admin',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteAdminUser(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublicServices(
  onData: (services: ServicePackage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'services';
  const q = query(collection(db, path), orderBy('orderIndex', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ServicePackage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: String(data.name ?? ''),
          shortDesc: String(data.shortDesc ?? ''),
          price: String(data.price ?? ''),
          categoryLabel: String(data.categoryLabel ?? ''),
          deliveryTime: String(data.deliveryTime ?? ''),
          features: Array.isArray(data.features) ? data.features.map(String) : [],
          featured: Boolean(data.featured),
          orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 0,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function createOrderInFirestore(input: {
  name: string;
  organization: string;
  phone: string;
  email: string;
  serviceId: string;
  serviceName: string;
  packagePrice: string;
  participantsOrScope?: string;
  preferredDate?: string;
  message?: string;
}): Promise<{ orderId: string; orderRef: string }> {
  const orderId = generateDocId('ord');
  const orderRef = `ЗАХ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  let safeServiceId = input.serviceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  if (safeServiceId.length < 2) safeServiceId = 'custom-service';
  const path = `orders/${orderId}`;

  const payload = {
    orderRef: sanitizeText(orderRef, 32),
    name: sanitizeText(input.name, 120),
    organization: sanitizeText(input.organization, 160),
    phone: sanitizeText(input.phone, 32),
    email: sanitizeText(input.email, 160),
    serviceId: safeServiceId,
    serviceName: sanitizeText(input.serviceName, 160),
    packagePrice: sanitizeText(input.packagePrice, 40),
    participantsOrScope: sanitizeText(input.participantsOrScope, 160),
    preferredDate: sanitizeText(input.preferredDate, 32),
    message: sanitizeText(input.message, 1500),
    status: 'new' as OrderStatus,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'orders', orderId), payload);
    return { orderId, orderRef };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createContactInFirestore(input: {
  name: string;
  organization: string;
  phone: string;
  email: string;
  serviceType: string;
  message?: string;
}): Promise<string> {
  const contactId = generateDocId('msg');
  const path = `contacts/${contactId}`;

  const payload = {
    name: sanitizeText(input.name, 120),
    organization: sanitizeText(input.organization, 160),
    phone: sanitizeText(input.phone, 32),
    email: sanitizeText(input.email, 160),
    serviceType: sanitizeText(input.serviceType, 160),
    message: sanitizeText(input.message, 1500),
    status: 'new' as ContactStatus,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'contacts', contactId), payload);
    return contactId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeAdminOrders(
  onData: (orders: OrderRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: OrderRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          orderRef: String(d.orderRef ?? ''),
          name: String(d.name ?? ''),
          organization: String(d.organization ?? ''),
          phone: String(d.phone ?? ''),
          email: String(d.email ?? ''),
          serviceId: String(d.serviceId ?? ''),
          serviceName: String(d.serviceName ?? ''),
          packagePrice: String(d.packagePrice ?? ''),
          participantsOrScope: d.participantsOrScope ? String(d.participantsOrScope) : '',
          preferredDate: d.preferredDate ? String(d.preferredDate) : '',
          message: d.message ? String(d.message) : '',
          status: (d.status as OrderStatus) || 'new',
          createdAt: toDateOrNull(d.createdAt),
        };
      });
      onData(orders);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAdminContacts(
  onData: (contacts: ContactRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'contacts';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const contacts: ContactRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: String(d.name ?? ''),
          organization: String(d.organization ?? ''),
          phone: String(d.phone ?? ''),
          email: String(d.email ?? ''),
          serviceType: String(d.serviceType ?? ''),
          message: d.message ? String(d.message) : '',
          status: (d.status as ContactStatus) || 'new',
          createdAt: toDateOrNull(d.createdAt),
        };
      });
      onData(contacts);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function updateContactStatus(contactId: string, status: ContactStatus): Promise<void> {
  const path = `contacts/${contactId}`;
  try {
    await updateDoc(doc(db, 'contacts', contactId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContact(contactId: string): Promise<void> {
  const path = `contacts/${contactId}`;
  try {
    await deleteDoc(doc(db, 'contacts', contactId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertServicePackage(
  serviceId: string,
  input: Omit<ServicePackage, 'id'>
): Promise<void> {
  let safeId = serviceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  if (safeId.length < 2) safeId = generateDocId('svc');
  const path = `services/${safeId}`;
  const cleanFeatures = input.features
    .map((f) => sanitizeText(f, 240))
    .filter((f) => f.length > 0)
    .slice(0, 10);

  if (cleanFeatures.length === 0) {
    throw new Error('Үйлчилгээний багцад дор хаяж 1 онцлог оруулна уу.');
  }

  const payload = {
    name: sanitizeText(input.name, 140),
    shortDesc: sanitizeText(input.shortDesc, 320),
    price: sanitizeText(input.price, 40),
    categoryLabel: sanitizeText(input.categoryLabel, 60),
    deliveryTime: sanitizeText(input.deliveryTime, 60),
    features: cleanFeatures,
    featured: Boolean(input.featured),
    orderIndex: Math.min(1000, Math.max(0, Number(input.orderIndex) || 0)),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'services', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteServicePackage(serviceId: string): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultServicesToFirestore(): Promise<void> {
  const path = 'services';
  try {
    const batch = writeBatch(db);
    for (const pkg of DEFAULT_SERVICE_PACKAGES) {
      batch.set(doc(db, 'services', pkg.id), {
        name: pkg.name,
        shortDesc: pkg.shortDesc,
        price: pkg.price,
        categoryLabel: pkg.categoryLabel,
        deliveryTime: pkg.deliveryTime,
        features: pkg.features,
        featured: Boolean(pkg.featured),
        orderIndex: pkg.orderIndex ?? 1,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
