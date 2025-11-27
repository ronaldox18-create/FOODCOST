import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, Order, OrderItem, PaymentMethod } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Clock,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Utensils,
  Save,
  ChefHat,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const Orders: React.FC = () => {
  const { products, customers, addOrder, updateOrder, orders, tables } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Parâmetros de Mesa
  const tableId = searchParams.get('tableId');
  const existingOrderId = searchParams.get('orderId');
  
  // Estado do Carrinho e Contexto
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('guest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'pos' | 'history'>('pos');
  
  // Modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<Order | null>(null);

  // Carregar pedido existente se vier da mesa ocupada
  useEffect(() => {
      if (existingOrderId) {
          const existingOrder = orders.find(o => o.id === existingOrderId);
          if (existingOrder) {
              setCart(existingOrder.items);
              setSelectedCustomerId(existingOrder.customerId);
          }
      } else {
          setCart([]);
          setSelectedCustomerId('guest');
      }
  }, [existingOrderId, orders]);

  // Info da Mesa
  const currentTable = useMemo(() => tables.find(t => t.id === tableId), [tables, tableId]);

  // Categorias
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Outros'));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtros
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
      });
    });
  };

  // Salvar Pedido (Mesa Aberta - Enviar para Cozinha)
  const handleSaveOrder = async () => {
      if (cart.length === 0) return;
      if (!tableId) return;

      const customerName = selectedCustomerId === 'guest' 
        ? 'Mesa ' + currentTable?.number 
        : customers.find(c => c.id === selectedCustomerId)?.name || 'Cliente';

      const orderData: Order = {
          id: existingOrderId || crypto.randomUUID(),
          customerId: selectedCustomerId,
          customerName,
          items: cart,
          totalAmount: cartTotal,
          paymentMethod: 'money',
          status: 'open',
          date: existingOrderId ? orders.find(o => o.id === existingOrderId)?.date || new Date().toISOString() : new Date().toISOString(),
          tableId: tableId,
          tableNumber: currentTable?.number
      };

      if (existingOrderId) {
          await updateOrder(orderData);
      } else {
          await addOrder(orderData);
      }

      setShowKitchenModal(true);
  };

  const closeKitchenModal = () => {
      setShowKitchenModal(false);
      navigate('/tables');
  };

  // Fechar Conta (Checkout Final)
  const handleCheckout = async (method: PaymentMethod) => {
    // Permite fechar mesa vazia se ela já existir (liberar mesa)
    if (cart.length === 0 && !existingOrderId) return;

    const customerName = selectedCustomerId === 'guest' 
      ? (tableId ? `Mesa ${currentTable?.number}` : 'Consumidor Final') 
      : customers.find(c => c.id === selectedCustomerId)?.name || 'Cliente';

    const orderToSave: Order = {
      id: existingOrderId || crypto.randomUUID(), 
      customerId: selectedCustomerId,
      customerName,
      items: cart,
      totalAmount: cartTotal,
      paymentMethod: method,
      status: 'completed',
      date: existingOrderId ? orders.find(o => o.id === existingOrderId)?.date || new Date().toISOString() : new Date().toISOString(),
      tableId: tableId || undefined,
      tableNumber: currentTable?.number
    };

    if (existingOrderId) {
        await updateOrder(orderToSave);
    } else {
        await addOrder(orderToSave);
    }
    
    setLastOrderDetails(orderToSave);
    setShowSuccessModal(true);
    setCart([]);
    setSelectedCustomerId('guest');
  };

  // Cancelar Mesa Manualmente
  const handleCancelTable = async () => {
    if (!existingOrderId || !tableId) return;
    
    if (confirm("Deseja cancelar a mesa e liberar? O pedido será marcado como cancelado.")) {
        const orderToCancel: Order = {
            id: existingOrderId, 
            customerId: selectedCustomerId,
            customerName: 'Cancelado',
            items: [],
            totalAmount: 0,
            paymentMethod: 'money',
            status: 'canceled',
            date: new Date().toISOString(),
            tableId: tableId,
            tableNumber: currentTable?.number
        };

        await updateOrder(orderToCancel);
        navigate('/tables');
    }
  };

  const closeSuccessModal = () => {
      setShowSuccessModal(false);
      setLastOrderDetails(null);
      if (tableId) navigate('/tables');
  };

  const handlePrint = () => {
      if (!lastOrderDetails) return;
      const receiptWindow = window.open('', '', 'width=300,height=600');
      if (!receiptWindow) return;

      const businessName = 'Meu Restaurante'; 
      const date = new Date(lastOrderDetails.date).toLocaleString();
      const itemsHtml = lastOrderDetails.items.map(item => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${item.quantity}x ${item.productName}</span>
              <span>${formatCurrency(item.total)}</span>
          </div>
      `).join('');

      const html = `
        <html>
          <head>
            <title>Recibo #${lastOrderDetails.id.slice(0, 6)}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <b>${businessName}</b><br/>${date}<br/>Pedido #${lastOrderDetails.id.slice(0, 6)}
            </div>
            ${itemsHtml}
            <div style="text-align: right; font-weight: bold; margin-top: 10px;">TOTAL: ${formatCurrency(lastOrderDetails.totalAmount)}</div>
            <script>window.print();</script>
          </body>
        </html>
      `;
      receiptWindow.document.write(html);
      receiptWindow.document.close();
  };

  const PaymentIcon = ({ method }: { method: string }) => {
      switch(method) {
          case 'credit': return <CreditCard size={14}/>;
          case 'debit': return <CreditCard size={14} className="text-blue-500"/>;
          case 'pix': return <QrCode size={14} className="text-green-500"/>;
          default: return <Banknote size={14} className="text-green-600"/>;
      }
  };

  // Botões de Ação Habilitados mesmo com carrinho vazio se tiver pedido aberto
  const isActionDisabled = cart.length === 0 && !existingOrderId;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 animate-fade-in relative -m-6 p-6">
      
      {/* Header Simplificado */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/tables')} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-500 transition-all">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {tableId ? <><Utensils className="text-orange-600" size={24}/> Mesa {currentTable?.number}</> : 'Novo Pedido'}
            </h1>
            <p className="text-gray-500 text-sm">{tableId ? 'Gerencie os pedidos da mesa' : 'Venda de balcão'}</p>
        </div>
        
        {/* Toggle View Mode se não for mesa */}
        {!tableId && (
            <div className="ml-auto bg-white p-1 rounded-lg border border-gray-200 flex">
                <button onClick={() => setViewMode('pos')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'pos' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>PDV</button>
                <button onClick={() => setViewMode('history')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Histórico</button>
            </div>
        )}
      </div>

      {viewMode === 'pos' ? (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
          
          {/* ESQUERDA: Catálogo de Produtos */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             
             {/* Barra de Pesquisa e Categorias */}
             <div className="p-5 border-b border-gray-100 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-100 text-gray-900 placeholder-gray-400 transition-all"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
             </div>

             {/* Grid de Produtos */}
             <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
                {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <ShoppingBag size={64} className="mb-4 text-gray-300" />
                        <p className="font-medium">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => addToCart(product)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all group flex flex-col h-full"
                            >
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">{product.category}</span>
                                <h3 className="font-bold text-gray-900 leading-tight mb-auto line-clamp-2">{product.name}</h3>
                                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                                    <span className="font-bold text-lg text-gray-900">{formatCurrency(product.currentPrice)}</span>
                                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
                                        <Plus size={16} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>

          {/* DIREITA: Carrinho / Comanda */}
          <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-shrink-0">
             
             {/* Header do Carrinho */}
             <div className={`p-5 text-white flex justify-between items-center ${tableId ? 'bg-[#7c2d12]' : 'bg-gray-900'}`}>
                <div>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingBag size={20} /> {tableId ? 'Consumo Mesa' : 'Cesta'}
                    </h2>
                    {tableId && existingOrderId && (
                        <div className="flex items-center gap-2 mt-1 opacity-80 text-xs">
                           <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Pedido Aberto
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                     {tableId && existingOrderId && (
                         <button onClick={handleCancelTable} title="Cancelar Mesa" className="p-2 bg-white/10 hover:bg-red-500 rounded-lg transition text-white">
                             <XCircle size={18} />
                         </button>
                     )}
                     <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{cart.length} itens</span>
                </div>
             </div>

             {/* Lista de Itens */}
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                 {cart.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                         <ShoppingBag size={48} strokeWidth={1.5} className="mb-2" />
                         <p className="text-sm">Carrinho vazio</p>
                     </div>
                 ) : (
                     cart.map(item => (
                         <div key={item.productId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-slide-up">
                             <div className="flex-1 pr-2">
                                 <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                                 <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} un</p>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                     <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500"><Minus size={12}/></button>
                                     <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                     <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-500"><Plus size={12}/></button>
                                 </div>
                                 <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                             </div>
                         </div>
                     ))
                 )}
             </div>

             {/* Footer com Totais e Ações */}
             <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                 <div className="flex justify-between items-end mb-6">
                     <span className="text-gray-500 text-sm font-medium">Total a Pagar</span>
                     <span className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(cartTotal)}</span>
                 </div>

                 <div className="space-y-3">
                     {/* Botão Principal: Salvar */}
                     {tableId && (
                         <button 
                             onClick={handleSaveOrder}
                             disabled={cart.length === 0}
                             className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                         >
                             <Save size={18} /> Salvar / Enviar p/ Cozinha
                         </button>
                     )}

                     {/* Botões de Pagamento */}
                     <div className="relative py-2">
                         <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                         <div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ou Fechar Conta</span></div>
                     </div>

                     <div className="grid grid-cols-4 gap-2">
                        {['credit', 'debit', 'pix', 'money'].map((method) => (
                             <button
                                 key={method}
                                 onClick={() => handleCheckout(method as PaymentMethod)}
                                 disabled={isActionDisabled}
                                 className="flex flex-col items-center justify-center gap-1 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                             >
                                 <div className="text-gray-500 group-hover:text-gray-900 transition-colors"><PaymentIcon method={method} /></div>
                                 <span className="text-[9px] font-bold text-gray-500 group-hover:text-gray-900 uppercase">{method === 'money' ? '$$$' : method}</span>
                             </button>
                        ))}
                     </div>
                 </div>
             </div>
          </div>
        </div>
      ) : (
        /* Modo Histórico */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col p-8 items-center justify-center text-gray-400">
            <p>Histórico disponível na aba de Pedidos do menu principal.</p>
        </div>
      )}

      {/* MODAL DE SUCESSO - FECHAR CONTA */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-scale-in">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle size={40} /></div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Conta Fechada!</h2>
                <p className="text-gray-500 mb-8 font-medium">Mesa liberada e pedido finalizado.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={handlePrint} className="w-full py-3.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2">Imprimir Recibo</button>
                    <button onClick={closeSuccessModal} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg">Novo Pedido</button>
                </div>
           </div>
        </div>
      )}

      {/* MODAL DE SUCESSO - COZINHA */}
      {showKitchenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-scale-in">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><ChefHat size={40} /></div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Enviado!</h2>
                <p className="text-gray-500 mb-8 font-medium">O pedido foi para a cozinha.<br/>A mesa continua aberta.</p>
                <button onClick={closeKitchenModal} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">Voltar para Mesas</button>
           </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
