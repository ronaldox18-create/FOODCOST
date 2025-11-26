
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Product, AppSettings, FixedCost, Customer, Order } from '../types';

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
  targetMargin: 20, // 20% de lucro líquido alvo
  taxAndLossPercent: 12, // 12% (Simples + Taxa Cartão + Desperdício)
  businessName: "Meu Negócio",
  estimatedMonthlyBilling: 25000 // R$ 25k faturamento base
};

// --- DADOS DE MODELO (SEED) ---
const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Pão Brioche', purchaseUnit: 'un', purchaseQuantity: 6, purchasePrice: 15.00, yieldPercent: 100, currentStock: 48, minStock: 24 },
  { id: 'ing-2', name: 'Carne Moída (Blend)', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 38.90, yieldPercent: 95, currentStock: 4.5, minStock: 2 },
  { id: 'ing-3', name: 'Queijo Cheddar', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 65.00, yieldPercent: 100, currentStock: 0.8, minStock: 0.5 },
  { id: 'ing-4', name: 'Bacon Fatiado', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 45.00, yieldPercent: 60, currentStock: 0.4, minStock: 0.5 }, // Low stock example
  { id: 'ing-5', name: 'Alface Americana', purchaseUnit: 'un', purchaseQuantity: 1, purchasePrice: 4.00, yieldPercent: 80, currentStock: 3, minStock: 2 },
  { id: 'ing-6', name: 'Tomate', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 8.90, yieldPercent: 85, currentStock: 1.5, minStock: 1 },
  { id: 'ing-7', name: 'Maionese Especial', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 22.00, yieldPercent: 98, currentStock: 2, minStock: 0.5 },
  { id: 'ing-8', name: 'Batata Congelada', purchaseUnit: 'kg', purchaseQuantity: 2.5, purchasePrice: 35.00, yieldPercent: 100, currentStock: 10, minStock: 5 },
  { id: 'ing-9', name: 'Coca-Cola Lata', purchaseUnit: 'un', purchaseQuantity: 12, purchasePrice: 32.00, yieldPercent: 100, currentStock: 22, minStock: 24 }, // Low stock
  { id: 'ing-10', name: 'Embalagem Burger', purchaseUnit: 'un', purchaseQuantity: 100, purchasePrice: 60.00, yieldPercent: 100, currentStock: 150, minStock: 50 },
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Smash Burger',
    category: 'Lanches',
    currentPrice: 20.00,
    preparationMethod: '1. Selar pão na manteiga.\n2. Esmagar carne (smash) na chapa bem quente.\n3. Adicionar sal e pimenta.\n4. Virar, colocar queijo e abafar.\n5. Montar: Pão, Molho, Carne+Queijo, Pão.',
    recipe: [
      { ingredientId: 'ing-1', quantityUsed: 1, unitUsed: 'un' },
      { ingredientId: 'ing-2', quantityUsed: 100, unitUsed: 'g' },
      { ingredientId: 'ing-3', quantityUsed: 30, unitUsed: 'g' },
      { ingredientId: 'ing-7', quantityUsed: 20, unitUsed: 'g' },
      { ingredientId: 'ing-10', quantityUsed: 1, unitUsed: 'un' },
    ]
  },
  {
    id: 'prod-2',
    name: 'X-Salada Clássico',
    category: 'Lanches',
    currentPrice: 26.00,
    preparationMethod: '1. Grelhar hambúrguer de 160g ao ponto.\n2. Derreter queijo cheddar.\n3. Montar: Pão, Maionese, Alface picada, Tomate (2 fatias), Carne+Queijo.',
    recipe: [
      { ingredientId: 'ing-1', quantityUsed: 1, unitUsed: 'un' },
      { ingredientId: 'ing-2', quantityUsed: 160, unitUsed: 'g' },
      { ingredientId: 'ing-3', quantityUsed: 30, unitUsed: 'g' },
      { ingredientId: 'ing-5', quantityUsed: 0.1, unitUsed: 'un' },
      { ingredientId: 'ing-6', quantityUsed: 40, unitUsed: 'g' },
      { ingredientId: 'ing-7', quantityUsed: 20, unitUsed: 'g' },
      { ingredientId: 'ing-10', quantityUsed: 1, unitUsed: 'un' },
    ]
  },
  {
    id: 'prod-3',
    name: 'X-Bacon Supremo',
    category: 'Lanches',
    currentPrice: 32.00,
    preparationMethod: '1. Fritar bacon até ficar crocante.\n2. Grelhar carne 160g.\n3. Montar com bastante maionese da casa.',
    recipe: [
      { ingredientId: 'ing-1', quantityUsed: 1, unitUsed: 'un' },
      { ingredientId: 'ing-2', quantityUsed: 160, unitUsed: 'g' },
      { ingredientId: 'ing-3', quantityUsed: 30, unitUsed: 'g' },
      { ingredientId: 'ing-4', quantityUsed: 50, unitUsed: 'g' },
      { ingredientId: 'ing-7', quantityUsed: 30, unitUsed: 'g' },
      { ingredientId: 'ing-10', quantityUsed: 1, unitUsed: 'un' },
    ]
  },
  {
    id: 'prod-4',
    name: 'Batata Frita (M)',
    category: 'Porções',
    currentPrice: 18.00,
    preparationMethod: 'Fritar a 180°C por 4 minutos. Escorrer bem e salgar.',
    recipe: [
      { ingredientId: 'ing-8', quantityUsed: 300, unitUsed: 'g' },
      { ingredientId: 'ing-7', quantityUsed: 30, unitUsed: 'g' }, 
    ]
  },
  {
    id: 'prod-5',
    name: 'Refrigerante Lata',
    category: 'Bebidas',
    currentPrice: 6.00,
    recipe: [
      { ingredientId: 'ing-9', quantityUsed: 1, unitUsed: 'un' },
    ]
  }
];

const SEED_FIXED_COSTS: FixedCost[] = [
  { id: 'fc-1', name: 'Aluguel + IPTU', amount: 2500.00 },
  { id: 'fc-2', name: 'Energia Elétrica', amount: 800.00 },
  { id: 'fc-3', name: 'Água e Esgoto', amount: 250.00 },
  { id: 'fc-4', name: 'Internet / Telefone', amount: 120.00 },
  { id: 'fc-5', name: 'Sistemas / Contador', amount: 400.00 },
  { id: 'fc-6', name: 'Folha Pagamento (1 func + encargos)', amount: 2800.00 },
  { id: 'fc-7', name: 'Pró-labore (Dono)', amount: 3000.00 },
];

const SEED_CUSTOMERS: Customer[] = [
  { 
    id: 'c-1', 
    name: 'João Silva', 
    phone: '11999999999', 
    email: 'joao@email.com',
    birthDate: '1990-05-15',
    address: 'Rua das Flores, 123', 
    totalSpent: 156.00, 
    lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
    notes: 'Gosta de maionese extra.' 
  },
  { 
    id: 'c-2', 
    name: 'Maria Oliveira', 
    phone: '11988888888', 
    email: 'maria@email.com',
    birthDate: new Date().toISOString().split('T')[0], // Hoje (para teste de aniversário)
    address: 'Av. Paulista, 1000 - Apt 45', 
    totalSpent: 450.50, 
    lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    notes: 'Cliente VIP. Sempre pede Coca zero.' 
  },
  { 
    id: 'c-3', 
    name: 'Carlos Souza', 
    phone: '11977777777', 
    email: 'carlos@email.com',
    birthDate: '1985-11-20',
    address: 'Rua Augusta, 500', 
    totalSpent: 32.00, 
    lastOrderDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), 
    notes: '' 
  }, // Sumido
];

const SEED_ORDERS: Order[] = [
  {
    id: 'o-1',
    customerId: 'c-1',
    customerName: 'João Silva',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    totalAmount: 52.00,
    paymentMethod: 'credit',
    items: [
      { productId: 'prod-2', productName: 'X-Salada Clássico', quantity: 2, unitPrice: 26.00, total: 52.00 }
    ]
  },
  {
    id: 'o-2',
    customerId: 'c-2',
    customerName: 'Maria Oliveira',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    totalAmount: 38.00,
    paymentMethod: 'pix',
    items: [
      { productId: 'prod-3', productName: 'X-Bacon Supremo', quantity: 1, unitPrice: 32.00, total: 32.00 },
      { productId: 'prod-5', productName: 'Refrigerante Lata', quantity: 1, unitPrice: 6.00, total: 6.00 }
    ]
  }
];

// ------------------------------

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedIng = localStorage.getItem('foodcost_ingredients');
        const storedProd = localStorage.getItem('foodcost_products');
        const storedFixed = localStorage.getItem('foodcost_fixedCosts');
        const storedSettings = localStorage.getItem('foodcost_settings');
        const storedCustomers = localStorage.getItem('foodcost_customers');
        const storedOrders = localStorage.getItem('foodcost_orders');

        if (storedIng) {
            const parsedIng = JSON.parse(storedIng);
            const migratedIng = parsedIng.map((i: any) => ({
                ...i,
                yieldPercent: i.yieldPercent ?? 100,
                currentStock: i.currentStock ?? 0,
                minStock: i.minStock ?? 0
            }));
            setIngredients(migratedIng);
        }
        else setIngredients(SEED_INGREDIENTS);

        if (storedProd) setProducts(JSON.parse(storedProd));
        else setProducts(SEED_PRODUCTS);

        if (storedFixed) setFixedCosts(JSON.parse(storedFixed));
        else setFixedCosts(SEED_FIXED_COSTS);

        if (storedSettings) setSettings(JSON.parse(storedSettings));
        
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        else setCustomers(SEED_CUSTOMERS);

        if (storedOrders) setOrders(JSON.parse(storedOrders));
        else setOrders(SEED_ORDERS);

      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('foodcost_ingredients', JSON.stringify(ingredients));
      localStorage.setItem('foodcost_products', JSON.stringify(products));
      localStorage.setItem('foodcost_fixedCosts', JSON.stringify(fixedCosts));
      localStorage.setItem('foodcost_settings', JSON.stringify(settings));
      localStorage.setItem('foodcost_customers', JSON.stringify(customers));
      localStorage.setItem('foodcost_orders', JSON.stringify(orders));
    }
  }, [ingredients, products, fixedCosts, settings, customers, orders, loading]);

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
    setOrders(prev => [order, ...prev]); // Newest first
    
    // 1. Update Customer Stats
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

    // 2. Deduct Stock Logic
    // Create a map to track deductions so we handle multiple products using same ingredient
    const deductionMap = new Map<string, number>();

    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.recipe.forEach(recipeItem => {
                const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                if (ingredient) {
                    let qtyUsed = recipeItem.quantityUsed * item.quantity;
                    
                    // Simple Unit Conversion for Deduction
                    // Assuming recipe logic is correct, we need to convert recipe unit to purchase unit
                    if (ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'g') qtyUsed /= 1000;
                    else if (ingredient.purchaseUnit === 'l' && recipeItem.unitUsed === 'ml') qtyUsed /= 1000;
                    else if (ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'un') qtyUsed = 0; // Incompatible
                    // ... other conversions if necessary
                    
                    // Gross up by Yield (We need to deduct Raw material)
                    // If Yield is 80%, we use more raw material than the net recipe amount
                    const yieldFactor = (ingredient.yieldPercent || 100) / 100;
                    const grossQty = yieldFactor > 0 ? qtyUsed / yieldFactor : qtyUsed;

                    const currentDeduction = deductionMap.get(ingredient.id) || 0;
                    deductionMap.set(ingredient.id, currentDeduction + grossQty);
                }
            });
        }
    });

    // Apply deductions to state
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
      ingredients,
      products,
      fixedCosts,
      settings,
      customers,
      orders,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      addProduct,
      updateProduct,
      deleteProduct,
      addFixedCost,
      deleteFixedCost,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addOrder,
      updateSettings
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
