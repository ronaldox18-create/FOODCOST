
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Ingredient, UnitType } from '../types';
import { Plus, Trash2, Edit2, Search, AlertTriangle, Info, ArrowUpDown, ArrowUp, ArrowDown, Package } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

type SortField = 'name' | 'purchasePrice' | 'realCost' | 'yieldPercent';
type SortDirection = 'asc' | 'desc';

const Ingredients: React.FC = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estado para confirmação de exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);

  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    purchaseUnit: 'kg',
    purchaseQuantity: 1,
    purchasePrice: 0,
    yieldPercent: 100
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const processedIngredients = useMemo(() => {
    let result = ingredients.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return result.sort((a, b) => {
      let valA: number | string = '';
      let valB: number | string = '';

      // Helper to calculate real cost per unit for sorting
      const getRealCost = (ing: Ingredient) => {
         const pricePerPackageUnit = ing.purchasePrice / ing.purchaseQuantity;
         const yieldFactor = (ing.yieldPercent || 100) / 100;
         return pricePerPackageUnit / yieldFactor;
      };

      switch (sortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'purchasePrice':
          valA = a.purchasePrice;
          valB = b.purchasePrice;
          break;
        case 'yieldPercent':
          valA = a.yieldPercent ?? 100;
          valB = b.yieldPercent ?? 100;
          break;
        case 'realCost':
          valA = getRealCost(a);
          valB = getRealCost(b);
          break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ingredients, searchTerm, sortField, sortDirection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateIngredient({ ...formData, id: editingId });
    } else {
      addIngredient({ ...formData, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (ing: Ingredient) => {
    // Definimos o estado explicitamente antes de abrir o modal
    setFormData({
      name: ing.name,
      purchaseUnit: ing.purchaseUnit,
      purchaseQuantity: ing.purchaseQuantity,
      purchasePrice: ing.purchasePrice,
      yieldPercent: ing.yieldPercent ?? 100
    });
    setEditingId(ing.id);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleDeleteClick = (ing: Ingredient) => {
    setDeleteConfirmation({ id: ing.id, name: ing.name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      deleteIngredient(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 0, yieldPercent: 100 });
    setEditingId(null);
  };

  // Helper para renderizar ícone de ordenação
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="text-orange-600" /> 
      : <ArrowDown size={14} className="text-orange-600" />;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ingredientes</h2>
          <p className="text-gray-500">Gerencie insumos e analise o custo real pós-perda.</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm"
        >
          <Plus size={18} /> Novo Ingrediente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
            />
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
             <Info size={14} />
             <span><strong>Custo Real:</strong> Valor ajustado considerando o desperdício (Yield).</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th 
                  className="p-4 cursor-pointer group hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Nome <SortIcon field="name" /></div>
                </th>
                <th className="p-4 text-center">Embalagem</th>
                <th 
                  className="p-4 text-right cursor-pointer group hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('yieldPercent')}
                >
                   <div className="flex items-center justify-end gap-1">Aproveitamento (Yield) <SortIcon field="yieldPercent" /></div>
                </th>
                <th 
                  className="p-4 text-right cursor-pointer group hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('realCost')}
                >
                  <div className="flex items-center justify-end gap-1">Custo Real / Un <SortIcon field="realCost" /></div>
                </th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {processedIngredients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Package size={48} className="mb-3 opacity-20" />
                    <p>Nenhum ingrediente encontrado.</p>
                  </td>
                </tr>
              ) : (
                processedIngredients.map(ing => {
                   const yieldVal = ing.yieldPercent ?? 100;
                   const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
                   const realCostPerUnit = pricePerUnit / (yieldVal / 100);
                   
                   return (
                    <tr key={ing.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{ing.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Compra: {formatCurrency(ing.purchasePrice)} / {ing.purchaseQuantity} {ing.purchaseUnit}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200 font-mono">
                          {ing.purchaseUnit}
                        </span>
                      </td>
                      <td className="p-4">
                         <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${yieldVal < 100 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {yieldVal}%
                            </span>
                            {yieldVal < 100 && (
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${yieldVal}%` }} />
                                </div>
                            )}
                         </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-gray-900 text-base">
                                {formatCurrency(realCostPerUnit)} <span className="text-xs font-normal text-gray-400">/ {ing.purchaseUnit}</span>
                            </span>
                            {yieldVal < 100 && (
                                <span className="text-xs text-gray-400 line-through decoration-gray-400">
                                    {formatCurrency(pricePerUnit)}
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(ing)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteClick(ing)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{editingId ? 'Editar' : 'Novo'} Ingrediente</h3>
            {/* O atributo key força o React a recriar o formulário quando mudamos de item, garantindo inputs atualizados */}
            <form onSubmit={handleSubmit} className="space-y-5" key={editingId || 'new'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Filé Mignon"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-shadow bg-white text-gray-900" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Compra</label>
                  <select 
                    value={formData.purchaseUnit}
                    onChange={e => setFormData({...formData, purchaseUnit: e.target.value as UnitType})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  >
                    <option value="kg">kg (Quilograma)</option>
                    <option value="g">g (Grama)</option>
                    <option value="l">l (Litro)</option>
                    <option value="ml">ml (Mililitro)</option>
                    <option value="un">un (Unidade)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Embalagem</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="Ex: 1"
                    value={formData.purchaseQuantity}
                    onChange={e => setFormData({...formData, purchaseQuantity: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Pago (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                        <input 
                        required 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={formData.purchasePrice}
                        onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
                        className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 group relative cursor-help">
                        Yield (%) <Info size={14} className="text-gray-400" />
                        <span className="invisible group-hover:visible absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 text-center">
                            Porcentagem aproveitável após limpeza/descasque. Ex: Batata = 85%.
                        </span>
                    </label>
                    <div className="relative">
                        <input 
                        required 
                        type="number" 
                        step="1"
                        min="1"
                        max="100"
                        value={formData.yieldPercent}
                        onChange={e => setFormData({...formData, yieldPercent: parseFloat(e.target.value)})}
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none pr-8 bg-white text-gray-900 ${formData.yieldPercent < 100 ? 'border-orange-300 focus:ring-orange-500' : 'border-gray-300 focus:ring-green-500'}`} 
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
                    </div>
                </div>
              </div>
              
              {/* Cálculo em tempo real no modal */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm space-y-1 shadow-sm">
                  <div className="flex justify-between text-gray-600">
                      <span>Preço Nominal:</span>
                      <span>{formatCurrency(formData.purchaseQuantity > 0 ? formData.purchasePrice / formData.purchaseQuantity : 0)} / {formData.purchaseUnit}</span>
                  </div>
                  {formData.yieldPercent < 100 && (
                      <div className="flex justify-between font-bold text-orange-700 pt-1 border-t border-gray-100 mt-1">
                          <span>Custo Real (Usável):</span>
                          <span>
                              {formatCurrency(
                                  (formData.purchaseQuantity > 0 ? formData.purchasePrice / formData.purchaseQuantity : 0) / 
                                  (formData.yieldPercent / 100)
                              )} / {formData.purchaseUnit}
                          </span>
                      </div>
                  )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors bg-white">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Ingrediente?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Tem certeza que deseja excluir <strong>{deleteConfirmation.name}</strong>? Essa ação não pode ser desfeita e pode afetar produtos que utilizam este ingrediente.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmation(null)} 
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white text-gray-700"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
