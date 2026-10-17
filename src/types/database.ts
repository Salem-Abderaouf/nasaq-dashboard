// Database Schema Types matching Supabase project "nasaq admin app" (hqgburjxfuyvyeotmqae)

export type UserRole = 'admin' | 'worker';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
}

export type ProspectStatus = 
  | 'new' 
  | 'contacted' 
  | 'interested' 
  | 'negotiation' 
  | 'converted' 
  | 'lost';

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  status: ProspectStatus;
  created_by?: string | null;
  created_at?: string;
}

export type DoorCategory = 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Custom';

export interface DoorProduct {
  id: string;
  reference: string;
  name: string;
  category: DoorCategory | string;
  height: number;
  width: number;
  thickness: number;
  description?: string | null;
  drawing_url?: string | null;
  created_at?: string;
}

export type OrderStatus = 
  | 'draft'
  | 'confirmed'
  | 'manufacturing'
  | 'ready_for_dispatch'
  | 'in_transit'
  | 'delivered'
  | 'installation'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  worker_id?: string | null;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  is_promo_enabled: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  clients?: Client;
  users?: { name: string };
  order_items?: OrderItem[];
}

export interface GlassPane {
  id?: string;
  widthCm: number;
  heightCm: number;
  marginTopCm: number;
  marginLeftCm: number;
  leaf: 'left' | 'right';
}

export interface DoorItemConfig {
  id?: string;
  doorStructure: 'single' | 'double';
  leftLeafPercent?: number;
  hasRevetment: boolean;
  revetmentHeightCm?: number;
  glassPanes: GlassPane[];
  patternId?: string;
  hardwareColor?: 'black' | 'chrome';
  priceNormal: number;
  pricePromo: number;
  isCustom?: boolean;
  customReference?: string;
  customName?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  height: number;
  width: number;
  thickness: number;
  color: string;
  configuration?: DoorItemConfig;
  door_products?: DoorProduct;
}

export type PaymentStatus = 'successful' | 'voided';

export interface OrderPayment {
  id: string;
  order_id: string;
  amount: number;
  payment_date: string;
  notes?: string | null;
  received_by?: string | null;
  status: PaymentStatus;
  created_at: string;
  users?: { name: string };
  orders?: { order_number: string };
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_by?: string | null;
  changed_at: string;
  users?: { name: string };
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  position: string;
  employment_date: string;
  status: 'active' | 'inactive';
  base_salary: number;
  payment_day: number;
  user_id?: string | null;
  created_at?: string;
}

export interface SalaryPayment {
  id: string;
  worker_id: string;
  salary_month: number;
  salary_year: number;
  base_salary: number;
  total_bonuses: number;
  total_deductions: number;
  total_advances: number;
  net_salary: number;
  payment_date: string;
  created_at?: string;
}

export interface SalaryAdvance {
  id: string;
  worker_id: string;
  amount: number;
  date: string;
  reason?: string | null;
  approved_by?: string | null;
  is_settled: boolean;
  salary_payment_id?: string | null;
}

export interface SalaryBonus {
  id: string;
  worker_id: string;
  amount: number;
  date: string;
  reason?: string | null;
  created_by?: string | null;
}

export interface SalaryDeduction {
  id: string;
  worker_id: string;
  amount: number;
  date: string;
  reason?: string | null;
  created_by?: string | null;
}
