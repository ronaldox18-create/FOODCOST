
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Customer, Order } from '../types';
import { Plus, Search, MessageCircle, User, MapPin, Edit2, Trash2, Calendar, DollarSign, Gift, TrendingUp, Clock, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

type FilterTab = 'all' | 'vip' | 'missing' | 'birthdays';

const Customers: React.FC = () => {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer } = useApp();
  
  // States
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'totalSpent' | 'lastOrderDate'>>({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    address: '',
    notes: ''
  });

  // --- STATISTICS LOGIC ---

  // Calculate dynamic stats for a customer based on orders
  const getCustomerStats = (customerId: string) => {
    const customerOrders = orders.filter(o => o.customerId === customerId);
    const totalOrders = customerOrders.length;
    const ticketAvg = totalOrders > 0 
        ? customerOrders.reduce((sum, o) => sum + o.totalAmount, 0) / totalOrders 
        : 0;
    
    // Calculate Favorite Dish
    const productCounts: Record<string, number> = {};
    customerOrders.forEach(order => {
        order.items.forEach(item => {
            productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
        });
    });
    
    // Sort by count
    const favoriteDish = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nenhum';

    return { totalOrders, ticketAvg, favoriteDish, history: customerOrders };
  };

  // --- FILTER LOGIC ---
  const processedCustomers = useMemo(() => {
    let filtered = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
    );

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();

    switch (activeTab) {
      case 'vip':
        // VIP logic: Spent more than R$ 200
        filtered = filtered.filter(c => c.totalSpent > 200);
        break;
      case 'missing':
        // Missing logic: No order in last 30 days
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 30);
        filtered = filtered.filter(c => new Date(c.lastOrderDate) < limitDate);
        break;
      case 'birthdays':
        // Birthdays in current month
        filtered = filtered.filter(c => {
          if (!c.birthDate) return false;
          const [_, month] = c.birthDate.split('-').map(Number);
          return (month - 1) === currentMonth; // month in date string is 1-12
        });
        break;
    }

    return filtered.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
  }, [customers, searchTerm, activeTab]);

  // --- HANDLERS ---

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer && isEditModalOpen) {
      updateCustomer({ ...selectedCustomer, ...formData });
    } else {
      addCustomer({
        ...formData,
        id: crypto.randomUUID(),
        totalSpent: 0,
        lastOrderDate: new Date().toISOString()
      });
    }
    closeModals();
  };

  const openNewModal = () => {
    setFormData({ name: '', phone: '', email: '', birthDate: '', address: '', notes: '' });
    setSelectedCustomer(null);
    setIsEditModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      birthDate: c.birthDate || '',
      address: c.address || '',
      notes: c.notes || ''
    });
    setSelectedCustomer(c);
    setIsEditModalOpen(true);
  };

  const openDetailsModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDetailsModalOpen(true);
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedCustomer(null);
  };

  const openWhatsApp = (phone: string, type: 'birthday' | 'missing' | 'general' = 'general', customerName: string) => {
    const numbers = phone.replace(/\D/g, '');
    let text = '';
    
    switch (type) {
        case 'birthday':
            text = `Olá ${customerName}! 🎂 Feliz aniversário! Que tal comemorar com a gente hoje? Temos uma surpresa pra você!`;
            break;
        case 'missing':
            text = `Oi ${customerName}! 🍔 Faz tempo que não te vemos por aqui. Estamos com saudade! Segue nosso cardápio atualizado...`;
            break;
        default:
            text = `Olá ${customerName}, tudo bem?`;
    }

    window.open(`https://wa.me/55${numbers}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir este cliente?')) {
        deleteCustomer(id);
        closeModals();
    }
  }

  // --- COMPONENTS ---

  const TabButton = ({ id, label, icon: Icon, color }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
        activeTab === id 
          ? `bg-${color}-50 border-${color}-200 text-${color}-700` 
          : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} className={activeTab === id ? `text-${color}-600` : 'text-gray-400'} />
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h2>
          <p className="text-gray-500">CRM inteligente para fidelizar e vender mais.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm"
        >
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
        {/* Toolbar & Filter */}
        <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row gap-4 justify-between xl:items-center bg-white">
          <div className="flex flex-wrap gap-2">
            <TabButton id="all" label="Todos" icon={User} color="gray" />
            <TabButton id="vip" label="VIPs" icon={DollarSign} color="purple" />
            <TabButton id="missing" label="Sumidos" icon={Clock} color="red" />
            <TabButton id="birthdays" label="Aniversariantes" icon={Gift} color="blue" />
          </div>

          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 flex-1 content-start">
          {processedCustomers.map(customer => {
             const stats = getCustomerStats(customer.id);
             const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 3600 * 24));
             const isBirthday = customer.birthDate && new Date(customer.birthDate).getMonth() === new Date().getMonth();

             return (
              <div 
                key={customer.id} 
                onClick={() => openDetailsModal(customer)}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition cursor-pointer group relative overflow-hidden"
              >
                {/* Status Tags */}
                <div className="absolute top-0 right-0 p-3 flex gap-1">
                    {customer.totalSpent > 200 && <div className="w-2 h-2 rounded-full bg-purple-500" title="VIP"></div>}
                    {daysSinceLastOrder > 30 && <div className="w-2 h-2 rounded-full bg-red-500" title="Sumido"></div>}
                    {isBirthday && <div className="w-2 h-2 rounded-full bg-blue-500" title="Aniversário"></div>}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{customer.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                       <MapPin size={10} /> {customer.address ? customer.address.split(',')[0] : 'Sem endereço'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400">Total Gasto (LTV)</p>
                        <p className="font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Última Compra</p>
                        <p className={`font-medium ${daysSinceLastOrder > 30 ? 'text-red-500' : 'text-green-600'}`}>
                            {daysSinceLastOrder === 0 ? 'Hoje' : `${daysSinceLastOrder} dias atrás`}
                        </p>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                     <span className="text-xs text-gray-400 italic line-clamp-1">
                        Fav: {stats.favoriteDish}
                     </span>
                     <button className="text-orange-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Detalhes ->
                     </button>
                </div>
              </div>
            );
          })}
          
          {processedCustomers.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-12">
                 <User size={48} className="mb-2 opacity-20" />
                 <p>Nenhum cliente encontrado neste filtro.</p>
             </div>
          )}
        </div>
      </div>

      {/* --- MODAL DETALHES + HISTÓRICO + CRM --- */}
      {isDetailsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex overflow-hidden">
              
              {/* Coluna Esquerda: Perfil e Ações */}
              <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-200 flex flex-col">
                  <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-white border-2 border-orange-100 rounded-full flex items-center justify-center text-2xl font-bold text-orange-600 mx-auto mb-3 shadow-sm">
                          {selectedCustomer.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                      {selectedCustomer.email && <p className="text-xs text-gray-400">{selectedCustomer.email}</p>}
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto">
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ações Rápidas (WhatsApp)</p>
                          <div className="space-y-2">
                              <button 
                                onClick={() => openWhatsApp(selectedCustomer.phone, 'general', selectedCustomer.name)}
                                className="w-full flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 p-2 rounded transition border border-gray-100"
                              >
                                  <MessageCircle size={16} className="text-green-500" /> Conversar
                              </button>
                              
                              {/* Contextual Actions */}
                              {(selectedCustomer.birthDate && new Date(selectedCustomer.birthDate).getMonth() === new Date().getMonth()) && (
                                  <button 
                                    onClick={() => openWhatsApp(selectedCustomer.phone, 'birthday', selectedCustomer.name)}
                                    className="w-full flex items-center gap-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded transition"
                                  >
                                      <Gift size={16} /> Dar Parabéns
                                  </button>
                              )}

                              {(Math.floor((new Date().getTime() - new Date(selectedCustomer.lastOrderDate).getTime()) / (1000 * 3600 * 24)) > 30) && (
                                  <button 
                                    onClick={() => openWhatsApp(selectedCustomer.phone, 'missing', selectedCustomer.name)}
                                    className="w-full flex items-center gap-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded transition"
                                  >
                                      <Clock size={16} /> Recuperar Cliente
                                  </button>
                              )}
                          </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dados Cadastrais</p>
                           <div className="space-y-2 text-sm">
                               <div>
                                   <span className="text-gray-500 block text-xs">Aniversário</span>
                                   <span className="text-gray-900 font-medium">
                                       {selectedCustomer.birthDate ? new Date(selectedCustomer.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
                                   </span>
                               </div>
                               <div>
                                   <span className="text-gray-500 block text-xs">Endereço</span>
                                   <span className="text-gray-900">{selectedCustomer.address || '-'}</span>
                               </div>
                               <div>
                                   <span className="text-gray-500 block text-xs">Obs</span>
                                   <p className="text-gray-900 italic bg-yellow-50 p-2 rounded text-xs mt-1 border border-yellow-100">
                                       {selectedCustomer.notes || 'Nenhuma observação.'}
                                   </p>
                               </div>
                           </div>
                      </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <button 
                        onClick={() => {setIsDetailsModalOpen(false); openEditModal(selectedCustomer);}}
                        className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
                      >
                          Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(selectedCustomer.id)}
                        className="p-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                          <Trash2 size={18} />
                      </button>
                  </div>
              </div>

              {/* Coluna Direita: Estatísticas e Histórico */}
              <div className="w-2/3 p-6 flex flex-col bg-white">
                 <div className="flex justify-between items-center mb-6">
                     <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                         <TrendingUp size={20} className="text-orange-600" />
                         Inteligência de Consumo
                     </h4>
                     <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                         ✕
                     </button>
                 </div>

                 {/* Stats Cards */}
                 {(() => {
                     const stats = getCustomerStats(selectedCustomer.id);
                     return (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-600 font-bold uppercase">Ticket Médio</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.ticketAvg)}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <p className="text-xs text-purple-600 font-bold uppercase">Total Pedidos</p>
                                <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs text-orange-600 font-bold uppercase">Prato Favorito</p>
                                <p className="text-sm font-bold text-gray-900 line-clamp-2 mt-1">{stats.favoriteDish}</p>
                            </div>
                        </div>
                     );
                 })()}

                 <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                     <ShoppingBag size={16} /> Histórico de Pedidos
                 </h4>
                 
                 <div className="flex-1 overflow-auto border border-gray-100 rounded-lg">
                    {(() => {
                        const history = getCustomerStats(selectedCustomer.id).history;
                        if (history.length === 0) {
                            return <div className="p-8 text-center text-gray-400">Nenhum pedido registrado.</div>
                        }
                        return (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                    <tr>
                                        <th className="p-3">Data</th>
                                        <th className="p-3">Itens</th>
                                        <th className="p-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-gray-600 whitespace-nowrap">
                                                {new Date(order.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-3 text-gray-900">
                                                {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                                            </td>
                                            <td className="p-3 text-right font-medium text-gray-900">
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        );
                    })()}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL EDITAR / NOVO --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{selectedCustomer ? 'Editar' : 'Novo'} Cliente</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Tel</label>
                    <input 
                    required 
                    type="text" 
                    placeholder="11999999999"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
                    <input 
                    type="date" 
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input 
                  type="text" 
                  placeholder="Rua, Número, Bairro"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea 
                  rows={3}
                  placeholder="Ex: Não gosta de picles."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 resize-none" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white text-gray-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
