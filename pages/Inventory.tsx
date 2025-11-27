import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  Search, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Filter, 
  ShoppingCart,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Scale,
  Trash2, 
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { Ingredient, UnitType } from '../types';

const Inventory: React.FC = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado para ajuste rápido de estoque
  const [adjustment, setAdjustment] = useState<{id: string, type: 'in' | 'out', amount: number} | null>(null);

  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    purchaseUnit: 'kg',
    purchaseQuantity: 1,
    purchasePrice: 0,
    yieldPercent: 100,
    currentStock: 0,
    minStock: 0
  });

  // --- ANALYTICS ---
  const stockMetrics = useMemo(() => {
    let totalValue = 0;
    let lowStockCount = 0;
    let itemsCount = ingredients.length;

    ingredients.forEach(ing => {
        let multiplier = 1; 
        if (ing.purchaseUnit === 'kg' || ing.purchaseUnit === 'l') multiplier = 1000;
        
        const pricePerBaseUnit = ing.purchasePrice / (ing.purchaseQuantity * multiplier);
        const currentVal = (ing.currentStock || 0) * pricePerBaseUnit;
        totalValue += currentVal;

        if ((ing.currentStock || 0) <= (ing.minStock || 0)) {
            lowStockCount++;
        }
    });

    return { totalValue, lowStockCount, itemsCount };
  }, [ingredients]);

  // --- FILTROS ---
  const filteredIngredients = useMemo(() => {
      return ingredients.filter(ing => {
          const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
          let matchesStatus = true;
          if (filterStatus === 'low') matchesStatus = (ing.currentStock || 0) <= (ing.minStock || 0);
          if (filterStatus === 'ok') matchesStatus = (ing.currentStock || 0) > (ing.minStock || 0);
          return matchesSearch && matchesStatus;
      }).sort((a, b) => {
          const aCrit = (a.currentStock || 0) <= (a.minStock || 0) ? 1 : 0;
          const bCrit = (b.currentStock || 0) <= (b.minStock || 0) ? 1 : 0;
          return bCrit - aCrit;
      });
  }, [ingredients, searchTerm, filterStatus]);

  // --- CONVERSORES ---
  const toBaseUnit = (val: number, unit: UnitType): number => {
      if (unit === 'kg' || unit === 'l') return val * 1000;
      return val;
  };

  const fromBaseUnit = (val: number, unit: UnitType): number => {
      if (unit === 'kg' || unit === 'l') return val / 1000;
      return val;
  };

  // --- HELPERS ---
  const formatStockDisplay = (valBase: number, unit: UnitType) => {
      let valDisplay = valBase;
      if (unit === 'kg' || unit === 'l') {
          valDisplay = valBase / 1000;
      }
      return parseFloat(valDisplay.toFixed(3)); // Max 3 casas e remove zeros
  };

  const formatUnitLabel = (unit: UnitType) => {
      if (unit === 'kg') return 'kg';
      if (unit === 'l') return 'L';
      if (unit === 'ml') return 'ml';
      if (unit === 'g') return 'g';
      return 'un';
  };

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        ...formData,
        currentStock: toBaseUnit(formData.currentStock || 0, formData.purchaseUnit),
        minStock: toBaseUnit(formData.minStock || 0, formData.purchaseUnit)
    };

    if (editingId) {
      updateIngredient({ ...dataToSave, id: editingId });
    } else {
      addIngredient({ ...dataToSave, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleAdjustStock = (e: React.FormEvent) => {
      e.preventDefault();
      if (!adjustment) return;
      
      const ingredient = ingredients.find(i => i.id === adjustment.id);
      if (!ingredient) return;

      const currentBase = ingredient.currentStock || 0;
      const adjustmentBase = toBaseUnit(adjustment.amount, ingredient.purchaseUnit);

      let newStockBase = currentBase;
      if (adjustment.type === 'in') {
          newStockBase += adjustmentBase;
      } else {
          newStockBase = Math.max(0, currentBase - adjustmentBase);
      }

      updateIngredient({ ...ingredient, currentStock: newStockBase });
      setAdjustment(null);
  };

  const resetForm = () => {
    setFormData({ name: '', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 0, yieldPercent: 100, currentStock: 0, minStock: 0 });
    setEditingId(null);
  };

  const handleEdit = (ing: Ingredient) => {
    setFormData({
        ...ing,
        currentStock: parseFloat(fromBaseUnit(ing.currentStock || 0, ing.purchaseUnit).toFixed(3)),
        minStock: parseFloat(fromBaseUnit(ing.minStock || 0, ing.purchaseUnit).toFixed(3))
    });
    setEditingId(ing.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
      deleteIngredient(id);
    }
  };

  // --- MODAL SIMPLIFIED VARS ---
  const adjustmentIngredient = adjustment ? ingredients.find(i => i.id === adjustment.id) : null;
  const currentStockDisplay = adjustmentIngredient 
      ? formatStockDisplay(adjustmentIngredient.currentStock || 0, adjustmentIngredient.purchaseUnit)
      : 0;
  
  const predictedStockDisplay = adjustmentIngredient && adjustment
      ? (adjustment.type === 'in' 
          ? currentStockDisplay + adjustment.amount 
          : Math.max(0, currentStockDisplay - adjustment.amount))
      : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        
        {/* HEADER & KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">Valor em Estoque</p>
                    <h3 className="text-2xl font-black text-gray-900">{formatCurrency(stockMetrics.totalValue)}</h3>
                </div>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <DollarSign size={20} />
                </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">Itens Críticos</p>
                    <h3 className={`text-2xl font-black ${stockMetrics.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stockMetrics.lowStockCount}
                    </h3>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stockMetrics.lowStockCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                    <AlertTriangle size={20} />
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                 <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">Total Itens</p>
                    <h3 className="text-2xl font-black text-gray-900">{stockMetrics.itemsCount}</h3>
                </div>
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Package size={20} />
                </div>
            </div>

            <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg shadow-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-black transition-all group"
            >
                <Plus size={24} className="group-hover:scale-110 transition-transform"/>
                <span className="font-bold">Novo Ingrediente</span>
            </button>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
             <div className="relative w-full sm:max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                    type="text" 
                    placeholder="Buscar por nome..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                 />
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                 <button 
                    onClick={() => setFilterStatus('all')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                     Todos
                 </button>
                 <button 
                    onClick={() => setFilterStatus('low')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'low' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                     Críticos
                 </button>
             </div>
        </div>

        {/* LISTA */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Ingrediente</th>
                            <th className="px-6 py-4">Estoque Atual</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Custo Unit.</th>
                            <th className="px-6 py-4 text-center">Ações Rápidas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredIngredients.map(ing => {
                            const isLow = (ing.currentStock || 0) <= (ing.minStock || 0);
                            const pricePerPack = ing.purchasePrice; 
                            const unitLabel = formatUnitLabel(ing.purchaseUnit);
                            const costPerUnit = ing.purchasePrice / ing.purchaseQuantity;

                            return (
                                <tr key={ing.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 text-base">{ing.name}</p>
                                        <p className="text-xs text-gray-400">Min: {formatStockDisplay(ing.minStock || 0, ing.purchaseUnit)} {unitLabel}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-lg font-mono font-bold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                                            {formatStockDisplay(ing.currentStock || 0, ing.purchaseUnit)} {unitLabel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isLow ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                <AlertTriangle size={12} /> Repor
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                Normal
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-600">
                                            {formatCurrency(costPerUnit)} <span className="text-gray-400 text-xs">/{unitLabel}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setAdjustment({ id: ing.id, type: 'in', amount: 0 })}
                                                className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 tooltip-trigger"
                                                title="Entrada"
                                            >
                                                <ArrowDownLeft size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setAdjustment({ id: ing.id, type: 'out', amount: 0 })}
                                                className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                                                title="Saída / Perda"
                                            >
                                                <ArrowUpRight size={18} />
                                            </button>
                                            <div className="w-px h-8 bg-gray-200 mx-1"></div>
                                            <button 
                                                onClick={() => handleEdit(ing)}
                                                className="p-2 text-gray-400 hover:text-blue-600"
                                            >
                                                <Filter size={18} className="rotate-90" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(ing.id)}
                                                className="p-2 text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredIngredients.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-400">
                                    Nenhum ingrediente encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL CADASTRO */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900">{editingId ? 'Editar Ingrediente' : 'Novo Ingrediente'}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Farinha de Trigo"/>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Compra</label>
                                <select value={formData.purchaseUnit} onChange={e => setFormData({...formData, purchaseUnit: e.target.value as UnitType})} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                    <option value="kg">Quilo (kg)</option>
                                    <option value="l">Litro (l)</option>
                                    <option value="un">Unidade (un)</option>
                                    <option value="g">Grama (g)</option>
                                    <option value="ml">Mililitro (ml)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Embalagem</label>
                                <input required type="number" step="0.01" value={formData.purchaseQuantity} onChange={e => setFormData({...formData, purchaseQuantity: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Ex: 1"/>
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Compra (R$)</label>
                            <input required type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="0.00"/>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial ({formData.purchaseUnit})</label>
                                <div className="relative">
                                    <input required type="number" step="0.001" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg"/>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Informe a quantidade na unidade de compra</p>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo ({formData.purchaseUnit})</label>
                                <input required type="number" step="0.001" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg"/>
                             </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition mt-4 shadow-lg shadow-orange-200">
                            Salvar Ingrediente
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL AJUSTE RÁPIDO (REFEITO) */}
        {adjustment && adjustmentIngredient && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border border-white/20">
                    
                    {/* Header Colorido */}
                    <div className={`p-6 text-white text-center relative overflow-hidden ${adjustment.type === 'in' ? 'bg-green-600' : 'bg-red-600'}`}>
                        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                        
                        <button onClick={() => setAdjustment(null)} className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/30 transition text-white">
                            <XCircle size={20}/>
                        </button>

                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                            {adjustment.type === 'in' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
                        </div>
                        <h3 className="font-black text-xl tracking-tight">
                            {adjustment.type === 'in' ? 'Entrada de Estoque' : 'Saída / Quebra'}
                        </h3>
                        <p className="text-white/80 text-sm mt-1 font-medium">{adjustmentIngredient.name}</p>
                    </div>

                    <form onSubmit={handleAdjustStock} className="p-6">
                        
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                            <div className="text-center flex-1">
                                <span className="text-xs text-gray-400 uppercase font-bold">Atual</span>
                                <div className="text-lg font-bold text-gray-700">{parseFloat(currentStockDisplay.toFixed(3))} <span className="text-xs">{formatUnitLabel(adjustmentIngredient.purchaseUnit)}</span></div>
                            </div>
                            <ArrowRight className="text-gray-300" size={20} />
                            <div className="text-center flex-1">
                                <span className="text-xs text-gray-400 uppercase font-bold">Previsto</span>
                                <div className={`text-lg font-bold ${adjustment.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                    {parseFloat(predictedStockDisplay.toFixed(3))} <span className="text-xs">{formatUnitLabel(adjustmentIngredient.purchaseUnit)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                Quantidade ({formatUnitLabel(adjustmentIngredient.purchaseUnit)})
                            </label>
                            <div className="relative">
                                <input 
                                    autoFocus
                                    required 
                                    type="number" 
                                    step="0.001" 
                                    value={adjustment.amount || ''}
                                    onChange={e => setAdjustment({...adjustment, amount: parseFloat(e.target.value)})}
                                    className="w-full px-4 py-4 text-2xl font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-0 outline-none text-center transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <button type="submit" className={`w-full py-4 font-black rounded-xl text-white text-lg shadow-lg transform active:scale-95 transition-all ${adjustment.type === 'in' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                            Confirmar {adjustment.type === 'in' ? 'Entrada' : 'Saída'}
                        </button>
                    </form>
                </div>
             </div>
        )}

    </div>
  );
};

// Ícone XCircle que esqueci de importar
function XCircle({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
    )
}

export default Inventory;
