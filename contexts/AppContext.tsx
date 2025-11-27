import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Product, AppSettings, FixedCost, Customer, Order, OrderItem, Table } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

interface AppContextType {
  ingredients: Ingredient[];
  products: Product[];
  fixedCosts: FixedCost[];
  customers: Customer[];
  orders: Order[];
  tables: Table[];
  settings: AppSettings;
  loading: boolean;
  
  addIngredient: (ing: Ingredient) => Promise<void>;
  updateIngredient: (ing: Ingredient) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  
  addProduct: (prod: Product) => Promise<void>;
  updateProduct: (prod: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addFixedCost: (cost: FixedCost) => Promise<void>;
  deleteFixedCost: (id: string) => Promise<void>;
  
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
  
  addTable: (tableNumber: number) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  
  updateSettings: (settings: AppSettings) => Promise<void>;
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
  const [tables, setTables] = useState<Table[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIngredients([]);
      setProducts([]);
      setFixedCosts([]);
      setCustomers([]);
      setOrders([]);
      setTables([]);
      setSettings(defaultSettings);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: settingsData } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
        if (settingsData) setSettings({ 
            businessName: settingsData.business_name, 
            targetMargin: settingsData.target_margin, 
            taxAndLossPercent: settingsData.tax_and_loss_percent,
            estimatedMonthlyBilling: settingsData.estimated_monthly_billing
        });

        const { data: ingData } = await supabase.from('ingredients').select('*').eq('user_id', user.id);
        if (ingData) setIngredients(ingData.map(i => ({...i, purchaseUnit: i.purchase_unit, purchaseQuantity: i.purchase_quantity, purchasePrice: i.purchase_price, yieldPercent: i.yield_percent, currentStock: i.current_stock, minStock: i.min_stock})));

        const { data: prodData } = await supabase.from('products').select(`*, product_ingredients (*)`).eq('user_id', user.id);
        if (prodData) {
            setProducts(prodData.map(p => ({
                id: p.id, name: p.name, category: p.category, description: p.description, currentPrice: p.current_price, preparationMethod: p.preparation_method,
                recipe: p.product_ingredients.map((pi: any) => ({ ingredientId: pi.ingredient_id, quantityUsed: pi.quantity_used, unitUsed: pi.unit_used }))
            })));
        }

        const { data: custData } = await supabase.from('customers').select('*').eq('user_id', user.id);
        if (custData) setCustomers(custData.map(c => ({...c, totalSpent: c.total_spent, lastOrderDate: c.last_order_date, birthDate: c.birth_date})));

        const { data: costData } = await supabase.from('fixed_costs').select('*').eq('user_id', user.id);
        if(costData) setFixedCosts(costData);

        const { data: orderData } = await supabase.from('orders').select(`*, order_items (*)`).eq('user_id', user.id).order('date', { ascending: false });
        if (orderData) {
            const formattedOrders = orderData.map(o => ({
                id: o.id, customerId: o.customer_id || 'guest', customerName: o.customer_name, totalAmount: o.total_amount, paymentMethod: o.payment_method, status: o.status, date: o.date, tableId: o.table_id, tableNumber: o.table_number,
                items: o.order_items.map((oi: any) => ({ productId: oi.product_id, productName: oi.product_name, quantity: oi.quantity, unitPrice: oi.unit_price, total: oi.total }))
            }));
            setOrders(formattedOrders);
        }

        const { data: tableData } = await supabase.from('tables').select('*').eq('user_id', user.id).order('number');
        if (tableData) {
            setTables(tableData.map(t => ({
                id: t.id,
                number: t.number,
                status: t.status as 'free' | 'occupied'
            })));
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --- Helpers de Mesas ---
  useEffect(() => {
      if (tables.length > 0 && orders.length > 0) {
          setTables(prev => prev.map(t => {
              const openOrder = orders.find(o => o.tableId === t.id && o.status === 'open');
              return {
                  ...t,
                  status: openOrder ? 'occupied' : 'free',
                  currentOrderId: openOrder?.id,
                  currentOrderTotal: openOrder?.totalAmount
              };
          }));
      }
  }, [orders]);

  // --- Helpers de Estoque ---
  const handleStockUpdate = async (items: OrderItem[]) => {
    // Para cada item vendido, encontrar a receita e descontar do estoque
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.recipe) {
            for (const recipeItem of product.recipe) {
                const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                if (ingredient && ingredient.currentStock !== undefined) {
                    
                    // Normalizar unidades
                    let qtyToDeduct = recipeItem.quantityUsed * item.quantity; // Quantidade total na unidade da receita
                    
                    // Se a receita usa kg/l e estoque é kg/l, ok.
                    // Se receita usa g/ml e estoque é kg/l, divide por 1000.
                    // Se receita usa kg/l e estoque é g/ml (raro), multiplica por 1000.
                    
                    // Simplificação: Assumimos que a unidade de uso e compra são compatíveis ou convertemos para unidade base (g/ml/un)
                    // Melhor abordagem: Converter tudo para unidade base do ingrediente
                    
                    let deduction = qtyToDeduct;

                    // Se a unidade usada no produto for diferente da unidade de compra, precisa converter?
                    // Assumimos que quem cadastrou, cadastrou certo. Mas vamos fazer ajustes básicos.
                    
                    // Exemplo: Compra em KG, usa em G.
                    if ((ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'g') || (ingredient.purchaseUnit === 'l' && recipeItem.unitUsed === 'ml')) {
                        deduction = qtyToDeduct / 1000;
                    } 
                    // Exemplo: Compra em G, usa em KG (Raro)
                    else if ((ingredient.purchaseUnit === 'g' && recipeItem.unitUsed === 'kg') || (ingredient.purchaseUnit === 'ml' && recipeItem.unitUsed === 'l')) {
                        deduction = qtyToDeduct * 1000;
                    }

                    const newStock = Math.max(0, ingredient.currentStock - deduction);
                    
                    // Atualiza no banco
                    await supabase.from('ingredients').update({ current_stock: newStock }).eq('id', ingredient.id);
                    
                    // Atualiza localmente
                    setIngredients(prev => prev.map(ing => ing.id === ingredient.id ? { ...ing, currentStock: newStock } : ing));
                }
            }
        }
    }
  };

  // --- ACTIONS ---

  const addTable = async (number: number) => {
      if (!user) return;
      const { data } = await supabase.from('tables').insert([{ user_id: user.id, number, status: 'free' }]).select().single();
      if (data) setTables(prev => [...prev, { id: data.id, number: data.number, status: 'free' }]);
  };

  const deleteTable = async (id: string) => {
      if (!user) return;
      await supabase.from('tables').delete().eq('id', id);
      setTables(prev => prev.filter(t => t.id !== id));
  };

  const addIngredient = async (ing: Ingredient) => { 
      if (!user) return;
      const { data } = await supabase.from('ingredients').insert([{
        user_id: user.id, name: ing.name, purchase_unit: ing.purchaseUnit, purchase_quantity: ing.purchaseQuantity, purchase_price: ing.purchasePrice, yield_percent: ing.yieldPercent, current_stock: ing.currentStock, min_stock: ing.minStock
      }]).select().single();
      if (data) setIngredients(prev => [...prev, { ...ing, id: data.id }]);
  };
  const updateIngredient = async (ing: Ingredient) => {
      if (!user) return;
      setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
      await supabase.from('ingredients').update({
        name: ing.name, purchase_unit: ing.purchaseUnit, purchase_quantity: ing.purchaseQuantity, purchase_price: ing.purchasePrice, yield_percent: ing.yieldPercent, current_stock: ing.currentStock, min_stock: ing.minStock
      }).eq('id', ing.id);
  };
  const deleteIngredient = async (id: string) => {
      if (!user) return;
      setIngredients(prev => prev.filter(i => i.id !== id));
      await supabase.from('ingredients').delete().eq('id', id);
  };
  
  const addProduct = async (prod: Product) => {
    if (!user) return;
    const { data: prodData, error } = await supabase.from('products').insert([{
        user_id: user.id, name: prod.name, category: prod.category, description: prod.description, current_price: prod.currentPrice, preparation_method: prod.preparationMethod
    }]).select().single();
    if (error || !prodData) return;
    if (prod.recipe.length > 0) {
        const recipeItems = prod.recipe.map(r => ({
            user_id: user.id, product_id: prodData.id, ingredient_id: r.ingredientId, quantity_used: r.quantityUsed, unit_used: r.unitUsed
        }));
        await supabase.from('product_ingredients').insert(recipeItems);
    }
    setProducts(prev => [...prev, { ...prod, id: prodData.id }]);
  };

  const updateProduct = async (prod: Product) => {
    if (!user) return;
    setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
    await supabase.from('products').update({
        name: prod.name, category: prod.category, description: prod.description, current_price: prod.currentPrice, preparation_method: prod.preparationMethod
    }).eq('id', prod.id);
    await supabase.from('product_ingredients').delete().eq('product_id', prod.id);
    if (prod.recipe.length > 0) {
        const recipeItems = prod.recipe.map(r => ({
            user_id: user.id, product_id: prod.id, ingredient_id: r.ingredientId, quantity_used: r.quantityUsed, unit_used: r.unitUsed
        }));
        await supabase.from('product_ingredients').insert(recipeItems);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const addFixedCost = async (cost: FixedCost) => {
    if (!user) return;
    const { data } = await supabase.from('fixed_costs').insert([{ user_id: user.id, name: cost.name, amount: cost.amount }]).select().single();
    if (data) setFixedCosts(prev => [...prev, { ...cost, id: data.id }]);
  };
  const deleteFixedCost = async (id: string) => {
    if (!user) return;
    setFixedCosts(prev => prev.filter(c => c.id !== id));
    await supabase.from('fixed_costs').delete().eq('id', id);
  };

  const addCustomer = async (customer: Customer) => {
      if (!user) return;
      const { data } = await supabase.from('customers').insert([{ user_id: user.id, name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes, birth_date: customer.birthDate }]).select().single();
      if (data) setCustomers(prev => [...prev, { ...customer, id: data.id, totalSpent: 0, lastOrderDate: '' }]);
  };
  const updateCustomer = async (customer: Customer) => {
      if (!user) return;
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      await supabase.from('customers').update({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes, birth_date: customer.birthDate }).eq('id', customer.id);
  };
  const deleteCustomer = async (id: string) => {
      if (!user) return;
      setCustomers(prev => prev.filter(c => c.id !== id));
      await supabase.from('customers').delete().eq('id', id);
  };
  
  const updateSettings = async (newSettings: AppSettings) => {
    if (!user) return;
    setSettings(newSettings);
    await supabase.from('user_settings').upsert({
        user_id: user.id, business_name: newSettings.businessName, target_margin: newSettings.targetMargin, tax_and_loss_percent: newSettings.taxAndLossPercent, estimated_monthly_billing: newSettings.estimatedMonthlyBilling
    });
  };

  // --- ORDER MANAGEMENT ---

  const addOrder = async (order: Order) => {
    if (!user) return;
    
    try {
        // 1. Insert Order
        const { data: orderData, error } = await supabase.from('orders').insert([{
            id: order.id, 
            user_id: user.id,
            customer_id: order.customerId === 'guest' ? null : order.customerId,
            customer_name: order.customerName,
            total_amount: order.totalAmount,
            payment_method: order.paymentMethod,
            status: order.status,
            date: order.date,
            table_id: order.tableId,
            table_number: order.tableNumber
        }]).select().single();

        if (error) {
            console.error("Erro ao criar pedido (Supabase):", error);
            throw error; 
        }

        const orderId = orderData.id;

        // 2. Insert Items
        if (order.items.length > 0) {
            const items = order.items.map(i => ({
                user_id: user.id,
                order_id: orderId,
                product_id: i.productId,
                product_name: i.productName,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                total: i.total
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(items);
            if (itemsError) console.error("Erro ao inserir itens:", itemsError);
        }

        // 3. Update Table Status
        if (order.tableId) {
            // Se for completed, libera. Se for open, ocupa.
            const newStatus = order.status === 'open' ? 'occupied' : 'free';
            await supabase.from('tables').update({ status: newStatus }).eq('id', order.tableId);
        }

        // 4. Update Local State
        setOrders(prev => [{...order, id: orderId}, ...prev]);

        // 5. BAIXAR ESTOQUE SE O PEDIDO JÁ NASCER CONCLUÍDO (Balcão)
        if (order.status === 'completed') {
            await handleStockUpdate(order.items);
        }

    } catch (err) {
        console.error("Falha crítica no addOrder:", err);
        alert("Erro ao salvar pedido. Verifique sua conexão.");
    }
  };

  const updateOrder = async (order: Order) => {
      if (!user) return;
      
      try {
          // Check previous status to see if we need to deduct stock
          const prevOrder = orders.find(o => o.id === order.id);
          const wasOpen = prevOrder?.status === 'open';
          const isCompleted = order.status === 'completed';

          // Update DB
          const { error } = await supabase.from('orders').update({
              total_amount: order.totalAmount,
              status: order.status,
              payment_method: order.paymentMethod
          }).eq('id', order.id);

          if (error) throw error;

          // Re-sync items
          await supabase.from('order_items').delete().eq('order_id', order.id);
          
          if (order.items.length > 0) {
              const items = order.items.map(i => ({
                user_id: user.id,
                order_id: order.id,
                product_id: i.productId,
                product_name: i.productName,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                total: i.total
              }));
              await supabase.from('order_items').insert(items);
          }

          if (isCompleted && order.tableId) {
              await supabase.from('tables').update({ status: 'free' }).eq('id', order.tableId);
          }

          // Update local
          setOrders(prev => prev.map(o => o.id === order.id ? order : o));

          // 5. BAIXAR ESTOQUE (Se mudou de Aberto -> Concluído)
          if (wasOpen && isCompleted) {
              await handleStockUpdate(order.items);
          }

      } catch (err) {
          console.error("Falha crítica no updateOrder:", err);
          alert("Erro ao atualizar pedido. Tente novamente.");
      }
  };

  return (
    <AppContext.Provider value={{
      ingredients, products, fixedCosts, settings, customers, orders, tables, loading,
      addIngredient, updateIngredient, deleteIngredient,
      addProduct, updateProduct, deleteProduct,
      addFixedCost, deleteFixedCost,
      addCustomer, updateCustomer, deleteCustomer,
      addOrder, updateOrder,
      addTable, deleteTable,
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
