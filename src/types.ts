export type PageId = 'home' | 'about' | 'training' | 'services' | 'cases' | 'contact';

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
}

export interface TrainingModule {
  number: number;
  title: string;
  category: string;
  hours: string;
  focus: string;
}
