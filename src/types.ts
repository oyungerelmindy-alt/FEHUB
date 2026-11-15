export type PageId =
  | 'home'
  | 'about'
  | 'training'
  | 'services'
  | 'cases'
  | 'contact'
  | 'admin';

export type OrderStatus = 'new' | 'reviewing' | 'confirmed' | 'closed';
export type ContactStatus = 'new' | 'replied';

export interface KpiSheetItem {
  id: number;
  name: string;
  description: string;
  targetUser: string;
  details: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  summary: string;
  metrics: string[];
  keyOutcomes: string[];
}

export interface ServicePackage {
  id: string;
  name: string;
  shortDesc: string;
  price: string;
  categoryLabel: string;
  deliveryTime: string;
  features: string[];
  featured?: boolean;
  orderIndex?: number;
}

export interface TrainingModule {
  number: number;
  title: string;
  category: string;
  hours: string;
  focus: string;
}

export interface OrderRecord {
  id: string;
  orderRef: string;
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
  status: OrderStatus;
  createdAt?: Date | null;
}

export interface ContactRecord {
  id: string;
  name: string;
  organization: string;
  phone: string;
  email: string;
  serviceType: string;
  message?: string;
  status: ContactStatus;
  createdAt?: Date | null;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  role: 'admin';
  createdAt?: Date | null;
}
