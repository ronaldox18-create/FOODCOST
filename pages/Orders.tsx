
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Order, OrderItem, PaymentMethod, Product } from '../types';
import { 
    Plus, Search, Trash2, ShoppingBag, User, Calendar, 
    CheckCircle, CreditCard, Banknote, QrCode, LayoutGrid, X 
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const Orders: React.FC = () => {
  const { orders, customers, products, addOrder } = useApp();
  
  // PDV Modal State
  const [isPDVOpen, setIsPDVOpen] = useState(false);
  
  // PDV Logic State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('guest');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('credit');
  
  // Filters for Product Catalog
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Dashboard Filters
  const [historySearch, setHistorySearch] = useState('');

  // --- STATS ---
  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === today);
    const total = todaysOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const count = todaysOrders.length;
    return { total, count };
  }, [orders]);

  // --- PDV FUNCTIONS ---

  const addToCart = (product: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => 
            i.productId === product.id 
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } 
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.currentPrice,
        total: product.currentPrice
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems(prev => prev.map(item => {
        if (item.productId === productId) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setOrderItems(prev => prev.filter(i => i.productId !== productId));
  };

  const cartTotal = useMemo(() => orderItems.reduce((acc, i) => acc + i.total, 0), [orderItems]);

  const handleFinishSale = () => {
    if (orderItems.length === 0) return;

    let customerName = 'Consumidor Final';
    if (selectedCustomerId !== 'guest') {
        const c = customers.find(cust => cust.id === selectedCustomerId);
        if (c) customerName = c.name;
    }

    const newOrder: Order = {
        id: crypto.randomUUID(),
        customerId: selectedCustomerId,
        customerName,
        items: orderItems,
        totalAmount: cartTotal,
        date: new Date().toISOString(),
        status: 'completed',
        paymentMethod: selectedPayment
    };

    addOrder(newOrder);
    closePDV();
  };

  const closePDV = () => {
    setIsPDVOpen(false);
    setOrderItems([]);
    setSelectedCustomerId('guest');
    setProductSearch('');
    setSelectedCategory('all');
    setSelectedPayment('credit');
  };

  const getFilteredProducts = () => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
  };

  const uniqueCategories = useMemo(() => {
      const cats = new Set(products.map(p => p.category).filter(Boolean));
      return ['all', ...Array.from(cats)];
  }, [products]);

  const getPaymentIcon = (method: PaymentMethod) => {
      switch(method) {
          case 'credit': return <CreditCard size={14}/>;
          case 'debit': return <CreditCard size={14}/>; // Could differentiate icon
          case 'money': return <Banknote size={14}/>;
          case 'pix': return <QrCode size={14}/>;
      }
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    const labels = { credit: 'Crédito', debit: 'Débito', money: 'Dinheiro', pix: 'Pix' };
    return labels[method];
  };

  return (
    <div>
      {/* Header & Daily Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Pedidos</h2>
          <p className="text-gray-500">Acompanhe suas vendas e abra o caixa.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 uppercase font-bold">Vendas Hoje</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(todayStats.total)}</p>
            </div>
            <button 
                onClick={() => setIsPDVOpen(true)}
                className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition shadow-lg font-bold"
            >
                <ShoppingBag size={20} /> Abrir Frente de Caixa (PDV)
            </button>
        </div>
      </div>

      {/* Orders History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
           <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente..." 
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Itens</th>
                <th className="p-4">Pagamento</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-12 text-center text-gray-400">
                      <ShoppingBag size={48} className="mx-auto mb-3 opacity-20"/>
                      Nenhuma venda registrada ainda.
                   </td>
                </tr>
              ) : (
                orders
                .filter(o => o.customerName.toLowerCase().includes(historySearch.toLowerCase()))
                .map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{new Date(order.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-xs">{new Date(order.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                        {order.customerName}
                        {order.customerId === 'guest' && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Balcão</span>}
                    </td>
                    <td className="p-4 text-gray-600">
                        <span className="line-clamp-1" title={order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}>
                             {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className="flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2 py-1 rounded w-fit text-xs font-medium border border-gray-200">
                            {getPaymentIcon(order.paymentMethod || 'money')}
                            {getPaymentLabel(order.paymentMethod || 'money')}
                        </span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900 text-base">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- POS FULL SCREEN MODAL --- */}
      {isPDVOpen && (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col md:flex-row h-screen w-screen overflow-hidden">
           
           {/* LEFT SIDE: CATALOG */}
           <div className="flex-1 flex flex-col h-full border-r border-gray-200 bg-gray-50">
              {/* Top Bar */}
              <div className="p-4 bg-white border-b border-gray-200 flex gap-4 items-center shadow-sm z-10">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Buscar produto (ex: X-Bacon)..." 
                        autoFocus
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none text-lg bg-white text-gray-900"
                      />
                  </div>
                  <button onClick={closePDV} className="md:hidden p-2 bg-gray-200 rounded">
                      <X />
                  </button>
              </div>

              {/* Categories */}
              <div className="p-2 bg-white border-b border-gray-200 flex gap-2 overflow-x-auto no-scrollbar">
                  {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategory === cat 
                            ? 'bg-orange-600 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                          {cat === 'all' ? 'Todos' : cat}
                      </button>
                  ))}
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getFilteredProducts().map(product => (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all text-left flex flex-col h-full group active:scale-95"
                          >
                              <div className="flex-1">
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">{product.category}</span>
                                  <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{product.name}</h3>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                  <span className="font-bold text-lg text-gray-900">{formatCurrency(product.currentPrice)}</span>
                                  <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus size={18} />
                                  </div>
                              </div>
                          </button>
                      ))}
                      {getFilteredProducts().length === 0 && (
                          <div className="col-span-full text-center py-20 text-gray-400">
                              <Search size={48} className="mx-auto mb-2 opacity-20" />
                              <p>Nenhum produto encontrado.</p>
                          </div>
                      )}
                  </div>
              </div>
           </div>

           {/* RIGHT SIDE: CART & CHECKOUT */}
           <div className="w-full md:w-[400px] xl:w-[450px] bg-white flex flex-col h-full shadow-2xl relative z-20">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                  <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                      <ShoppingBag className="text-orange-600" /> Carrinho
                  </h3>
                  <button onClick={closePDV} className="text-gray-400 hover:text-red-500 p-2">
                      <X size={24} />
                  </button>
              </div>

              {/* Customer Select */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-300">
                      <User className="ml-2 text-gray-400" size={20} />
                      <select 
                        value={selectedCustomerId}
                        onChange={e => setSelectedCustomerId(e.target.value)}
                        className="w-full p-2 bg-transparent outline-none text-gray-900 font-medium"
                      >
                          <option value="guest">Consumidor Final (Balcão)</option>
                          {customers.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                  </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {orderItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                          <LayoutGrid size={64} className="mb-4" />
                          <p className="text-lg font-medium">Seu carrinho está vazio</p>
                          <p className="text-sm">Selecione produtos ao lado</p>
                      </div>
                  ) : (
                      orderItems.map(item => (
                          <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-sm">{item.productName}</h4>
                                  <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} un</p>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                      <button 
                                        onClick={() => updateQuantity(item.productId, -1)}
                                        className="px-2 py-1 hover:bg-gray-100 text-gray-600 border-r border-gray-300"
                                      >-</button>
                                      <span className="px-2 w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                                      <button 
                                        onClick={() => updateQuantity(item.productId, 1)}
                                        className="px-2 py-1 hover:bg-gray-100 text-gray-600 border-l border-gray-300"
                                      >+</button>
                                  </div>
                                  <p className="font-bold text-gray-900 w-16 text-right">{formatCurrency(item.total)}</p>
                                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>

              {/* Checkout Area */}
              <div className="bg-gray-50 border-t border-gray-200 p-6 space-y-4">
                  {/* Payment Methods */}
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Forma de Pagamento</p>
                      <div className="grid grid-cols-2 gap-2">
                          {(['money', 'credit', 'debit', 'pix'] as PaymentMethod[]).map(method => (
                              <button
                                key={method}
                                onClick={() => setSelectedPayment(method)}
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all border ${
                                    selectedPayment === method 
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                  {getPaymentIcon(method)}
                                  {getPaymentLabel(method)}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Totals */}
                  <div className="pt-2">
                      <div className="flex justify-between items-center mb-1 text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-2xl font-bold text-gray-900">
                          <span>Total</span>
                          <span>{formatCurrency(cartTotal)}</span>
                      </div>
                  </div>

                  {/* Action */}
                  <button 
                    onClick={handleFinishSale}
                    disabled={orderItems.length === 0}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2"
                  >
                      <CheckCircle /> Finalizar Venda
                  </button>
              </div>
           </div>

        </div>
      )}
    </div>
  );
};

export default Orders;
