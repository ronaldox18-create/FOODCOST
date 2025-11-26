
export type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'un';

export interface Ingredient {
  id: string;
  name: string;
  purchaseUnit: UnitType;
  purchaseQuantity: number;
  purchasePrice: number;
  yieldPercent: number; // Porcentagem de aproveitamento (1-100). Ex: Batata descascada rende 85%
  currentStock?: number; // Novo: Estoque atual na unidade de compra
  minStock?: number; // Novo: Estoque mínimo para alerta
}

export interface RecipeItem {
  ingredientId: string;
  quantityUsed: number;
  unitUsed: UnitType; // Should be compatible with purchaseUnit (e.g., g for kg)
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string; // Novo: Texto de marketing para cardápio/delivery
  currentPrice: number;
  recipe: RecipeItem[];
  preparationMethod?: string; // Novo campo: Modo de Preparo
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
}

export interface AppSettings {
  targetMargin: number; // Percentage (0-100)
  taxAndLossPercent: number; // Percentage (0-100) - Impostos sobre venda + Taxa Cartão + Perda
  businessName: string;
  estimatedMonthlyBilling: number; // Faturamento Mensal Estimado para rateio
}

export interface CalculatedProduct extends Product {
  costIngredients: number; // CMV Apenas ingredientes
  costFixed: number; // Valor em R$ absorvido pelos custos fixos
  costVariable: number; // Valor em R$ de impostos/perdas
  totalCost: number; // Soma de tudo
  suggestedPrice: number;
  currentMargin: number; // Margem de lucro líquida atual
  isProfitable: boolean;
  breakdown: {
    fixedCostPercent: number;
    variableCostPercent: number;
    profitPercent: number;
  }
}

// --- NOVAS INTERFACES CRM & PEDIDOS ---

export interface Customer {
  id: string;
  name: string;
  phone: string; // Apenas números para link WhatsApp
  email?: string; // Novo: Email para marketing
  birthDate?: string; // Novo: Data de Nascimento (YYYY-MM-DD)
  address?: string;
  notes?: string; // Ex: "Não gosta de cebola"
  totalSpent: number; // LTV
  lastOrderDate: string; // ISO Date String
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
  customerId: string; // 'guest' se for venda balcão
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: string; // ISO Date String
  status: 'pending' | 'completed' | 'canceled';
}

// --- SAAS & AUTH INTERFACES ---

export type PlanType = 'free' | 'starter' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  storeName: string;
  plan: PlanType;
  createdAt: string;
}
