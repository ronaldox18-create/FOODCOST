import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Product, AppSettings, FixedCost, Customer, Order } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../src/lib/supabaseClient';

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
  loadingData: boolean;
}

const defaultSettings: AppSettings = {
  targetMargin: 20,
  taxAndLossPercent: 12,
  businessName: "Meu Negócio",
  estimatedMonthlyBilling: 25000
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loadingData, setLoadingData] = useState(true);

  // --- FETCH DATA FROM SUPABASE ---
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // 1. Settings
        const { data: settingsData } = await supabase.from('settings').select('*').single();
        if (settingsData) {
          setSettings({
            targetMargin: settingsData.target_margin,
            taxAndLossPercent: settingsData.tax_and_loss_percent,
            businessName: settingsData.business_name,
            estimatedMonthlyBilling: settingsData.estimated_monthly_billing
          });
        } else {
           // Create default settings if not exists
           await supabase.from('settings').insert({
               user_id: user.id,
               target_margin: 20,
               tax_and_loss_percent: 12,
               business_name: user.storeName,
               estimated_monthly_billing: 25000
           });
           setSettings({ ...defaultSettings, businessName: user.storeName });
        }

        // 2. Ingredients
        const { data: ingData } = await supabase.from('ingredients').select('*');
        if (ingData) {
            setIngredients(ingData.map((i: any) => ({
                id: i.id,
                name: i.name,
                purchaseUnit: i.purchase_unit,
                purchaseQuantity: i.purchase_quantity,
                purchasePrice: i.purchase_price,
                yieldPercent: i.yield_percent,
                currentStock: i.current_stock,
                minStock: i.min_stock
            })));
        }

        // 3. Products
        const { data: prodData } = await supabase.from('products').select('*');
        if (prodData) {
            setProducts(prodData.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                currentPrice: p.current_price,
                preparationMethod: p.preparation_method,
                recipe: p.recipe || []
            })));
        }

        // 4. Fixed Costs
        const { data: costData } = await supabase.from('fixed_costs').select('*');
        if (costData) {
            setFixedCosts(costData.map((c: any) => ({
                id: c.id,
                name: c.name,
                amount: c.amount
            })));
        }

        // 5. Customers
        const { data: custData } = await supabase.from('customers').select('*');
        if (custData) {
            setCustomers(custData.map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                birthDate: c.birth_date,
                address: c.address,
                notes: c.notes,
                totalSpent: c.total_spent,
                lastOrderDate: c.last_order_date
            })));
        }

        // 6. Orders
        const { data: orderData } = await supabase.from('orders').select('*').order('date', { ascending: false });
        if (orderData) {
            setOrders(orderData.map((o: any) => ({
                id: o.id,
                customerId: o.customer_id,
                customerName: o.customer_name,
                items: o.items || [],
                totalAmount: o.total_amount,
                paymentMethod: o.payment_method,
                status: o.status,
                date: o.date
            })));
        }

      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);


  // --- CRUD OPERATIONS ---

  // INGREDIENTS
  const addIngredient = async (ing: Ingredient) => {
    // Optimistic UI update
    setIngredients(prev => [...prev, ing]);
    
    await supabase.from('ingredients').insert({
        id: ing.id,
        user_id: user!.id,
        name: ing.name,
        purchase_unit: ing.purchaseUnit,
        purchase_quantity: ing.purchaseQuantity,
        purchase_price: ing.purchasePrice,
        yield_percent: ing.yieldPercent,
        current_stock: ing.currentStock || 0,
        min_stock: ing.minStock || 0
    });
  };

  const updateIngredient = async (ing: Ingredient) => {
    setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
    
    await supabase.from('ingredients').update({
        name: ing.name,
        purchase_unit: ing.purchaseUnit,
        purchase_quantity: ing.purchaseQuantity,
        purchase_price: ing.purchasePrice,
        yield_percent: ing.yieldPercent,
        current_stock: ing.currentStock,
        min_stock: ing.minStock
    }).eq('id', ing.id);
  };

  const deleteIngredient = async (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    await supabase.from('ingredients').delete().eq('id', id);
  };

  // PRODUCTS
  const addProduct = async (prod: Product) => {
    setProducts(prev => [...prev, prod]);
    
    await supabase.from('products').insert({
        id: prod.id,
        user_id: user!.id,
        name: prod.name,
        category: prod.category,
        description: prod.description,
        current_price: prod.currentPrice,
        preparation_method: prod.preparationMethod,
        recipe: prod.recipe
    });
  };

  const updateProduct = async (prod: Product) => {
    setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
    
    await supabase.from('products').update({
        name: prod.name,
        category: prod.category,
        description: prod.description,
        current_price: prod.currentPrice,
        preparation_method: prod.preparationMethod,
        recipe: prod.recipe
    }).eq('id', prod.id);
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  // FIXED COSTS
  const addFixedCost = async (cost: FixedCost) => {
    setFixedCosts(prev => [...prev, cost]);
    await supabase.from('fixed_costs').insert({
        id: cost.id,
        user_id: user!.id,
        name: cost.name,
        amount: cost.amount
    });
  };

  const deleteFixedCost = async (id: string) => {
    setFixedCosts(prev => prev.filter(c => c.id !== id));
    await supabase.from('fixed_costs').delete().eq('id', id);
  };

  // CUSTOMERS
  const addCustomer = async (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    
    await supabase.from('customers').insert({
        id: customer.id,
        user_id: user!.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        birth_date: customer.birthDate,
        address: customer.address,
        notes: customer.notes,
        total_spent: customer.totalSpent,
        last_order_date: customer.lastOrderDate
    });
  };

  const updateCustomer = async (customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    
    await supabase.from('customers').update({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        birth_date: customer.birthDate,
        address: customer.address,
        notes: customer.notes,
        total_spent: customer.totalSpent,
        last_order_date: customer.lastOrderDate
    }).eq('id', customer.id);
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    await supabase.from('customers').delete().eq('id', id);
  };

  // ORDERS
  const addOrder = async (order: Order) => {
    setOrders(prev => [order, ...prev]);

    // 1. Save Order
    await supabase.from('orders').insert({
        id: order.id,
        user_id: user!.id,
        customer_id: order.customerId,
        customer_name: order.customerName,
        items: order.items,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        status: order.status,
        date: order.date
    });

    // 2. Update Customer LTV if not guest
    if (order.customerId !== 'guest') {
        const customer = customers.find(c => c.id === order.customerId);
        if (customer) {
            const newTotal = customer.totalSpent + order.totalAmount;
            const newDate = order.date;
            
            // UI Update
            setCustomers(prev => prev.map(c => 
                c.id === order.customerId ? { ...c, totalSpent: newTotal, lastOrderDate: newDate } : c
            ));

            // DB Update
            await supabase.from('customers').update({
                total_spent: newTotal,
                last_order_date: newDate
            }).eq('id', order.customerId);
        }
    }

    // 3. Deduct Stock
    const deductionMap = new Map<string, number>();
    
    // Calculate deductions based on order items and recipes
    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.recipe.forEach(recipeItem => {
                const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                if (ingredient) {
                    let qtyUsed = recipeItem.quantityUsed * item.quantity;
                    // Conversion logic (same as calculations.ts)
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

    // Update ingredients state and DB
    const updates: any[] = [];
    
    const newIngredients = ingredients.map(ing => {
        const deduction = deductionMap.get(ing.id);
        if (deduction) {
            const newStock = Math.max(0, (ing.currentStock || 0) - deduction);
            updates.push(
                supabase.from('ingredients').update({ current_stock: newStock }).eq('id', ing.id)
            );
            return { ...ing, currentStock: newStock };
        }
        return ing;
    });

    setIngredients(newIngredients);
    await Promise.all(updates);
  };

  // SETTINGS
  const updateSettings = async (s: AppSettings) => {
    setSettings(s);
    // Upsert settings (requires user_id as unique constraint or just match user_id)
    const { data: existing } = await supabase.from('settings').select('id').single();
    
    if (existing) {
        await supabase.from('settings').update({
            target_margin: s.targetMargin,
            tax_and_loss_percent: s.taxAndLossPercent,
            business_name: s.businessName,
            estimated_monthly_billing: s.estimatedMonthlyBilling
        }).eq('id', existing.id);
    } else {
        await supabase.from('settings').insert({
            user_id: user!.id,
            target_margin: s.targetMargin,
            tax_and_loss_percent: s.taxAndLossPercent,
            business_name: s.businessName,
            estimated_monthly_billing: s.estimatedMonthlyBilling
        });
    }
  };

  return (
    <AppContext.Provider value={{
      ingredients, products, fixedCosts, settings, customers, orders,
      addIngredient, updateIngredient, deleteIngredient,
      addProduct, updateProduct, deleteProduct,
      addFixedCost, deleteFixedCost,
      addCustomer, updateCustomer, deleteCustomer,
      addOrder, updateSettings,
      loadingData
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