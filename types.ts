
export type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'un';

export interface Ingredient {
  id: string;
  name: string;
  purchaseUnit: UnitType;
  purchaseQuantity: number;
  purchasePrice: number;
  yieldPercent: number;
  currentStock?: number;
  minStock?: number;
  stockUnit?: UnitType;
  user_id?: string;
  created_at?: string;
}

export interface RecipeItem {
  ingredientId: string;
  quantityUsed: number;
  unitUsed: UnitType;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  currentPrice: number;
  recipe: RecipeItem[];
  preparationMethod?: string;
  created_at?: string;
  user_id?: string;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  category?: string;
  user_id?: string;
  created_at?: string;
}

export interface AppSettings {
  id?: string;
  targetMargin: number;
  taxAndLossPercent: number;
  businessName: string;
  estimatedMonthlyBilling: number;
  user_id?: string;
  created_at?: string;
}

export interface CalculatedProduct extends Product {
  costIngredients: number;
  costFixed: number;
  costVariable: number;
  totalCost: number;
  suggestedPrice: number;
  currentMargin: number;
  isProfitable: boolean;
  breakdown: {
    fixedCostPercent: number;
    variableCostPercent: number;
    profitPercent: number;
  }
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  lastOrderDate: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: 'pending' | 'completed' | 'canceled' | 'open'; // 'open' para mesa aberta
  tableId?: string; // Novo
  tableNumber?: number; // Novo
}

// --- NOVO: Sistema de Mesas ---
export interface Table {
  id: string;
  number: number;
  status: 'free' | 'occupied';
  currentOrderId?: string; // ID do pedido aberto, se houver
  currentOrderTotal?: number; // Total parcial
}

export interface User {
  id: string;
  name: string;
  email: string;
  storeName: string;
  plan: PlanType;
  createdAt: string;
}

export type PlanType = 'free' | 'starter' | 'pro';

import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthContextType {
  user: SupabaseUser | null;
  signIn: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
}
