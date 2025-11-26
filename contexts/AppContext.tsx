
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Product, AppSettings, FixedCost, Customer, Order } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  ingredients: Ingredient[];
  products: Product[];
  fixedCosts: FixedCost[];
  customers: Customer[];
  orders: Order[];
  settings: AppSettings;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (ing: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  addProduct: (prod: Product) => void;
  updateProduct: (prod: Product) => void;
  deleteProduct: (id: string) => void;
  addFixedCost: (cost: FixedCost) => void;
  deleteFixedCost: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (order: Order) => void;
  updateSettings: (settings: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  targetMargin: 20,
  taxAndLossPercent: 12,
  businessName: "Meu Negócio",
  estimatedMonthlyBilling: 25000
};

// Seed Data moved to a separate variable to keep component clean
const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Pão Brioche', purchaseUnit: 'un', purchaseQuantity: 6, purchasePrice: 15.00, yieldPercent: 100, currentStock: 48, minStock: 24 },
  { id: 'ing-2', name: 'Carne Moída (Blend)', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 38.90, yieldPercent: 95, currentStock: 4.5, minStock: 2 },
  { id: 'ing-3', name: 'Queijo Cheddar', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 65.00, yieldPercent: 100, currentStock: 0.8, minStock: 0.5 },
  { id: 'ing-9', name: 'Coca-Cola Lata', purchaseUnit: 'un', purchaseQuantity: 12, purchasePrice: 32.00, yieldPercent: 100, currentStock: 22, minStock: 24 },
  { id: 'ing-10', name: 'Embalagem Burger', purchaseUnit: 'un', purchaseQuantity: 100, purchasePrice: 60.00, yieldPercent: 100, currentStock: 150, minStock: 50 },
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Smash Burger',
    category: 'Lanches',
    description: 'Delicioso smash burger com crosta perfeita.',
    currentPrice: 20.00,
    preparationMethod: '1. Selar pão.\n2. Smash carne.\n3. Queijo.',
    recipe: [
      { ingredientId: 'ing-1', quantityUsed: 1, unitUsed: 'un' },
      { ingredientId: 'ing-2', quantityUsed: 100, unitUsed: 'g' },
      { ingredientId: 'ing-3', quantityUsed: 30, unitUsed: 'g' },
      { ingredientId: 'ing-10', quantityUsed: 1, unitUsed: 'un' },
    ]
  },
  {
    id: 'prod-5',
    name: 'Refrigerante Lata',
    category: 'Bebidas',
    description: 'Lata 350ml gelada.',
    currentPrice: 6.00,
    recipe: [
      { ingredientId: 'ing-9', quantityUsed: 1, unitUsed: 'un' },
    ]
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Hook into Auth Context
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Helper to get prefix
  const getKey = (key: string) => user ? `${user.id}_${key}` : `guest_${key}`;

  // Load data when User changes
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    try {
      // 1. Settings
      const storedSettings = localStorage.getItem(getKey('settings'));
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        setSettings({ ...defaultSettings, businessName: user.storeName });
      }

      // 2. Ingredients
      const storedIng = localStorage.getItem(getKey('ingredients'));
      if (storedIng) setIngredients(JSON.parse(storedIng));
      else setIngredients(SEED_INGREDIENTS); // Initialize with seeds for new users too

      // 3. Products
      const storedProd = localStorage.getItem(getKey('products'));
      if (storedProd) setProducts(JSON.parse(storedProd));
      else setProducts(SEED_PRODUCTS);

      // 4. Others...
      const storedFixed = localStorage.getItem(getKey('fixedCosts'));
      if (storedFixed) setFixedCosts(JSON.parse(storedFixed));
      else setFixedCosts([]);

      const storedCustomers = localStorage.getItem(getKey('customers'));
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      else setCustomers([]);

      const storedOrders = localStorage.getItem(getKey('orders'));
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      else setOrders([]);

    } catch (e) {
      console.error("Failed to load user data", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save data when state changes (only if user exists)
  useEffect(() => {
    if (!loading && user) {
      localStorage.setItem(getKey('ingredients'), JSON.stringify(ingredients));
      localStorage.setItem(getKey('products'), JSON.stringify(products));
      localStorage.setItem(getKey('fixedCosts'), JSON.stringify(fixedCosts));
      localStorage.setItem(getKey('settings'), JSON.stringify(settings));
      localStorage.setItem(getKey('customers'), JSON.stringify(customers));
      localStorage.setItem(getKey('orders'), JSON.stringify(orders));
    }
  }, [ingredients, products, fixedCosts, settings, customers, orders, loading, user]);

  // Actions
  const addIngredient = (ing: Ingredient) => setIngredients(prev => [...prev, ing]);
  const updateIngredient = (ing: Ingredient) => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
  const deleteIngredient = (id: string) => setIngredients(prev => prev.filter(i => i.id !== id));

  const addProduct = (prod: Product) => setProducts(prev => [...prev, prod]);
  const updateProduct = (prod: Product) => setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  const addFixedCost = (cost: FixedCost) => setFixedCosts(prev => [...prev, cost]);
  const deleteFixedCost = (id: string) => setFixedCosts(prev => prev.filter(c => c.id !== id));

  const addCustomer = (customer: Customer) => setCustomers(prev => [...prev, customer]);
  const updateCustomer = (customer: Customer) => setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
  const deleteCustomer = (id: string) => setCustomers(prev => prev.filter(c => c.id !== id));

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    
    // Update Customer Stats
    if (order.customerId !== 'guest') {
        setCustomers(prev => prev.map(c => {
        if (c.id === order.customerId) {
            return {
            ...c,
            totalSpent: c.totalSpent + order.totalAmount,
            lastOrderDate: order.date
            };
        }
        return c;
        }));
    }

    // Deduct Stock
    const deductionMap = new Map<string, number>();
    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.recipe.forEach(recipeItem => {
                const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                if (ingredient) {
                    let qtyUsed = recipeItem.quantityUsed * item.quantity;
                    if (ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'g') qtyUsed /= 1000;
                    else if (ingredient.purchaseUnit === 'l' && recipeItem.unitUsed === 'ml') qtyUsed /= 1000;
                    
                    const yieldFactor = (ingredient.yieldPercent || 100) / 100;
                    const grossQty = yieldFactor > 0 ? qtyUsed / yieldFactor : qtyUsed;
                    const currentDeduction = deductionMap.get(ingredient.id) || 0;
                    deductionMap.set(ingredient.id, currentDeduction + grossQty);
                }
            });
        }
    });

    setIngredients(prev => prev.map(ing => {
        const deduction = deductionMap.get(ing.id);
        if (deduction) {
            const currentStock = ing.currentStock || 0;
            return { ...ing, currentStock: Math.max(0, currentStock - deduction) };
        }
        return ing;
    }));
  };

  const updateSettings = (s: AppSettings) => setSettings(s);

  return (
    <AppContext.Provider value={{
      ingredients, products, fixedCosts, settings, customers, orders,
      addIngredient, updateIngredient, deleteIngredient,
      addProduct, updateProduct, deleteProduct,
      addFixedCost, deleteFixedCost,
      addCustomer, updateCustomer, deleteCustomer,
      addOrder, updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
