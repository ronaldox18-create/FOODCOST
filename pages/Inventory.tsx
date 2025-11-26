
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Ingredient } from '../types';
import { 
    Search, Package, AlertTriangle, ShoppingCart, 
    RefreshCcw, PlusCircle, Settings2, TrendingDown, ArrowDown, ArrowUp,
    Copy, Share2, X
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

type StockStatus = 'critical' | 'low' | 'good' | 'all';
type ModalType = 'entry' | 'adjust' | null;

const Inventory: React.FC = () => {
  const { ingredients, updateIngredient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<StockStatus>('all');
  
  // Modal States
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Shopping List Modal State
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [shoppingListContent, setShoppingListContent] = useState('');

  // --- CALCULAÇÕES & LÓGICA ---

  const getStockStatusInfo = (current: number, min: number) => {
    if (current <= 0) return { id: 'critical', label: 'Esgotado', color: 'text-red-700 bg-red-50 border-red-200', barColor: 'bg-red-500' };
    if (current <= min) return { id: 'low', label: 'Baixo', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', barColor: 'bg-yellow-500' };
    return { id: 'good', label: 'Normal', color: 'text-green-700 bg-green-50 border-green-200', barColor: 'bg-green-500' };
  };

  const processedData = useMemo(() => {
    return ingredients.map(ing => {
        const current = ing.currentStock || 0;
        const min = ing.minStock || 0;
        const status = getStockStatusInfo(current, min);
        const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
        const totalValue = current * pricePerUnit;
        
        // Suggestion: Buy enough to reach 1.5x MinStock or at least fill the gap
        const deficit = Math.max(0, (min * 1.5) - current); 
        
        return { ...ing, status, totalValue, deficit };
    });
  }, [ingredients]);

  const filteredList = useMemo(() => {
    return processedData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || item.status.id === activeTab || (activeTab === 'critical' && item.currentStock === 0);
        return matchesSearch && matchesTab;
    });
  }, [processedData, searchTerm, activeTab]);

  // Totals
  const totalStockValue = processedData.reduce((acc, i) => acc + i.totalValue, 0);
  const itemsToBuyCount = processedData.filter(i => i.status.id === 'low' || i.status.id === 'critical').length;

  // --- HANDLERS ---

  const openModal = (type: ModalType, ing: Ingredient) => {
      setSelectedIngredient(ing);
      setActiveModal(type);
      setInputValue(''); // Reset input
  };

  const closeModal = () => {
      setActiveModal(null);
      setSelectedIngredient(null);
      setInputValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedIngredient || !inputValue) return;

      const value = parseFloat(inputValue);
      if (isNaN(value)) return;

      let newStock = selectedIngredient.currentStock || 0;

      if (activeModal === 'entry') {
          // Add to existing stock
          newStock += value;
      } else if (activeModal === 'adjust') {
          // Overwrite existing stock (Correction)
          newStock = value;
      }

      updateIngredient({
          ...selectedIngredient,
          currentStock: newStock
      });

      closeModal();
  };

  const generateShoppingList = () => {
      const items = processedData
        .filter(i => i.status.id !== 'good')
        .map(i => {
            return `[ ] ${i.name}: Comprar +${i.deficit.toFixed(1).replace('.', ',')} ${i.purchaseUnit} (Atual: ${i.currentStock})`;
        });

      if (items.length > 0) {
          const text = `🛒 *LISTA DE COMPRAS* - ${new Date().toLocaleDateString('pt-BR')}\n\n${items.join('\n')}`;
          setShoppingListContent(text);
          setShoppingListOpen(true);
      } else {
          alert('Estoque está saudável! Nada para comprar hoje.');
      }
  };

  const copyToClipboard = () => {
      if (navigator.clipboard) {
          navigator.clipboard.writeText(shoppingListContent).then(() => {
              alert('Copiado para a área de transferência!');
          }).catch(err => {
              console.error(err);
              alert('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.');
          });
      } else {
           // Fallback for older browsers or non-secure context
           const textArea = document.createElement("textarea");
           textArea.value = shoppingListContent;
           document.body.appendChild(textArea);
           textArea.focus();
           textArea.select();
           try {
               document.execCommand('copy');
               alert('Copiado!');
           } catch (err) {
               alert('Não foi possível copiar. Selecione o texto manualmente.');
           }
           document.body.removeChild(textArea);
      }
  };

  const shareWhatsApp = () => {
      const url = `https://wa.me/?text=${encodeURIComponent(shoppingListContent)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h2>
          <p className="text-gray-500">Controle de entradas, auditoria e valorização.</p>
        </div>
        <button 
          onClick={generateShoppingList}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition shadow-lg font-bold"
        >
           <ShoppingCart size={18} /> Gerar Lista de Compras
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Capital em Estoque</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalStockValue)}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Itens para Reposição</p>
                <div className="flex items-end gap-2">
                    <p className={`text-2xl font-bold mt-1 ${itemsToBuyCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {itemsToBuyCount}
                    </p>
                    <span className="text-xs text-gray-400 mb-1">itens</span>
                </div>
            </div>
            <div className={`p-3 rounded-lg ${itemsToBuyCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Saúde do Estoque</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.round((processedData.filter(i => i.status.id === 'good').length / (processedData.length || 1)) * 100)}%
                </p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <TrendingDown size={24} />
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
         
         {/* Toolbar */}
         <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row justify-between gap-4 bg-white">
             {/* Tabs */}
             <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                 {(['all', 'critical', 'low', 'good'] as const).map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                     >
                         {tab === 'all' ? 'Todos' : tab === 'critical' ? 'Esgotados' : tab === 'low' ? 'Baixos' : 'Normais'}
                     </button>
                 ))}
             </div>

             {/* Search */}
             <div className="relative w-full xl:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar item..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                />
             </div>
         </div>

         {/* Table */}
         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                  <tr>
                     <th className="p-4 w-1/3">Item</th>
                     <th className="p-4 text-center">Nível</th>
                     <th className="p-4 text-right">Saldo Atual</th>
                     <th className="p-4 text-right">Financeiro</th>
                     <th className="p-4 text-center">Ações Rápidas</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredList.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="p-12 text-center text-gray-400">
                              <Package size={48} className="mx-auto mb-3 opacity-20" />
                              <p>Nenhum item encontrado.</p>
                          </td>
                      </tr>
                  ) : (
                      filteredList.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="p-4">
                                  <div className="font-bold text-gray-900">{item.name}</div>
                                  <div className="text-xs text-gray-500">Mínimo: {item.minStock} {item.purchaseUnit}</div>
                              </td>
                              <td className="p-4 align-middle">
                                  <div className="flex flex-col gap-1 max-w-[120px] mx-auto">
                                      <div className="flex justify-between text-xs font-bold text-gray-500">
                                          <span>{Math.round((item.currentStock || 0) / ((item.minStock || 1) * 2) * 100)}%</span>
                                      </div>
                                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${item.status.barColor}`} 
                                            style={{ width: `${Math.min(100, ((item.currentStock || 0) / ((item.minStock || 1) * 2)) * 100)}%` }}
                                          ></div>
                                      </div>
                                      <span className={`text-[10px] text-center px-1.5 py-0.5 rounded border w-fit mx-auto ${item.status.color}`}>
                                          {item.status.label}
                                      </span>
                                  </div>
                              </td>
                              <td className="p-4 text-right">
                                  <span className="text-lg font-bold text-gray-900">{item.currentStock}</span>
                                  <span className="text-xs text-gray-500 ml-1">{item.purchaseUnit}</span>
                              </td>
                              <td className="p-4 text-right">
                                  <div className="font-medium text-gray-900">{formatCurrency(item.totalValue)}</div>
                                  <div className="text-xs text-gray-400">Estocado</div>
                              </td>
                              <td className="p-4">
                                  <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => openModal('entry', item)}
                                        title="Registrar Compra (Entrada)"
                                        className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"
                                      >
                                          <ArrowUp size={16} />
                                      </button>
                                      <button 
                                        onClick={() => openModal('adjust', item)}
                                        title="Ajuste Manual / Auditoria"
                                        className="p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200"
                                      >
                                          <Settings2 size={16} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- STOCK ENTRY/ADJUST MODAL --- */}
      {activeModal && selectedIngredient && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
                  {/* Modal Header */}
                  <div className={`p-4 flex justify-between items-center ${activeModal === 'entry' ? 'bg-green-600' : 'bg-gray-800'}`}>
                      <h3 className="text-white font-bold flex items-center gap-2">
                          {activeModal === 'entry' ? <PlusCircle size={20}/> : <RefreshCcw size={20}/>}
                          {activeModal === 'entry' ? 'Entrada de Estoque' : 'Ajuste de Inventário'}
                      </h3>
                      <button onClick={closeModal} className="text-white/80 hover:text-white"><ArrowDown className="rotate-180" size={20}/></button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6">
                      <div className="mb-4 text-center">
                          <p className="text-sm text-gray-500">Item Selecionado</p>
                          <p className="text-xl font-bold text-gray-900">{selectedIngredient.name}</p>
                          <p className="text-xs text-gray-400 mt-1">
                              Saldo Atual: <span className="font-bold">{selectedIngredient.currentStock} {selectedIngredient.purchaseUnit}</span>
                          </p>
                      </div>

                      <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                              {activeModal === 'entry' ? 'Quantidade Comprada (+)' : 'Quantidade Contada (=)'}
                          </label>
                          <div className="relative">
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="w-full p-4 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-white text-gray-900"
                                placeholder="0.00"
                                autoFocus
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                  {selectedIngredient.purchaseUnit}
                              </span>
                          </div>
                          {activeModal === 'entry' && (
                              <p className="text-xs text-green-600 mt-2 text-center">
                                  Será somado ao saldo atual.
                              </p>
                          )}
                          {activeModal === 'adjust' && (
                              <p className="text-xs text-orange-600 mt-2 text-center">
                                  O saldo atual será substituído por este valor.
                              </p>
                          )}
                      </div>

                      <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={closeModal}
                            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                          >
                              Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className={`flex-1 py-3 rounded-lg text-white font-bold shadow-md transition-transform active:scale-95 ${
                                activeModal === 'entry' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-black'
                            }`}
                          >
                              Confirmar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- SHOPPING LIST MODAL --- */}
      {shoppingListOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <ShoppingCart className="text-orange-600" /> Lista de Compras
                      </h3>
                      <button onClick={() => setShoppingListOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="p-4 flex-1">
                      <p className="text-sm text-gray-500 mb-2">Baseado nos níveis mínimos de estoque configurados.</p>
                      <textarea 
                        className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none bg-gray-50 text-gray-900"
                        value={shoppingListContent}
                        readOnly
                      />
                  </div>

                  <div className="p-5 border-t border-gray-100 bg-white rounded-b-xl flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={shareWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition shadow-sm"
                      >
                          <Share2 size={18} /> Enviar no WhatsApp
                      </button>
                      <button 
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-lg hover:bg-black font-bold transition shadow-sm"
                      >
                          <Copy size={18} /> Copiar Texto
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Inventory;
