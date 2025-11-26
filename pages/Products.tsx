
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, RecipeItem, UnitType } from '../types';
import { Plus, Trash2, Edit2, Calculator, Info, AlertTriangle, Copy } from 'lucide-react';
import { calculateProductMetrics, formatCurrency, formatPercent } from '../utils/calculations';

const Products: React.FC = () => {
  const { products, ingredients, fixedCosts, settings, addProduct, updateProduct, deleteProduct } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado para confirmação de exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    currentPrice: 0,
    recipe: [],
  });

  // Recipe builder local state
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newIngredientQty, setNewIngredientQty] = useState(0);
  const [newIngredientUnit, setNewIngredientUnit] = useState<UnitType>('g');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct({ ...formData, id: editingId });
    } else {
      addProduct({ ...formData, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', currentPrice: 0, recipe: [] });
    setEditingId(null);
    setNewIngredientId('');
    setNewIngredientQty(0);
  };

  const handleEdit = (prod: Product) => {
    setFormData({ ...prod });
    setEditingId(prod.id);
    setIsModalOpen(true);
  };

  const handleDuplicate = (prod: Product) => {
    setFormData({ 
        ...prod, 
        name: `${prod.name} (Cópia)`,
    });
    setEditingId(null); // Null means create new
    setIsModalOpen(true);
  };

  const handleDeleteClick = (prod: Product) => {
    setDeleteConfirmation({ id: prod.id, name: prod.name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      deleteProduct(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const addIngredientToRecipe = () => {
    if (!newIngredientId || newIngredientQty <= 0) return;
    
    setFormData(prev => {
      // Verifica se o ingrediente já existe na receita atual
      const existingIndex = prev.recipe.findIndex(item => item.ingredientId === newIngredientId);
      const newRecipe = [...prev.recipe];

      if (existingIndex >= 0) {
        // Se existe, atualiza a entrada existente com os novos valores
        newRecipe[existingIndex] = {
          ingredientId: newIngredientId,
          quantityUsed: newIngredientQty,
          unitUsed: newIngredientUnit
        };
      } else {
        // Se não existe, adiciona novo item
        newRecipe.push({
          ingredientId: newIngredientId,
          quantityUsed: newIngredientQty,
          unitUsed: newIngredientUnit
        });
      }

      return {
        ...prev,
        recipe: newRecipe
      };
    });

    setNewIngredientId('');
    setNewIngredientQty(0);
  };

  const removeRecipeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cardápio & Custos</h2>
          <p className="text-gray-500">Análise detalhada de custos, markup e preço sugerido.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map(product => {
          const metrics = calculateProductMetrics(product, ingredients, fixedCosts, settings);
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wide">
                    {product.category || 'Geral'}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">{product.name}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    Venda: <span className="text-gray-900 font-medium">{formatCurrency(product.currentPrice)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(product)} title="Editar" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDuplicate(product)} title="Duplicar" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Copy size={16} /></button>
                  <button onClick={() => handleDeleteClick(product)} title="Excluir" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="p-5 space-y-3 flex-1 text-sm">
                <div className="space-y-1 pb-3 border-b border-gray-50">
                    <div className="flex justify-between text-gray-500">
                        <span>Ingredientes (CMV):</span>
                        <span>{formatCurrency(metrics.costIngredients)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span className="flex items-center gap-1">Custos Fixos <Info size={12} title="Rateio baseado no faturamento"/>:</span>
                        <span>{formatCurrency(metrics.costFixed)}</span>
                    </div>
                     <div className="flex justify-between text-gray-500">
                        <span>Var (Imposto/Perda):</span>
                        <span>{formatCurrency(metrics.costVariable)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900 pt-1">
                        <span>Custo Total:</span>
                        <span>{formatCurrency(metrics.totalCost)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Lucro Líquido:</span>
                  <div className="text-right">
                    <span className={`block font-bold ${metrics.isProfitable ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(product.currentPrice - metrics.totalCost)}
                    </span>
                    <span className={`text-xs ${metrics.isProfitable ? 'text-green-600' : 'text-red-500'}`}>
                        {formatPercent(metrics.currentMargin)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-2 rounded-lg flex justify-between items-center text-blue-800">
                    <span>Preço Sugerido:</span>
                    <span className="font-bold">{formatCurrency(metrics.suggestedPrice)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
          <Calculator size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum produto cadastrado. Comece criando seu cardápio!</p>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Produto?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Tem certeza que deseja excluir <strong>{deleteConfirmation.name}</strong>? Essa ação não pode ser desfeita.
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

      {/* Modal Edição/Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
             <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar' : 'Novo'} Produto</h3>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Prato</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Lanches"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900" 
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda Atual (R$)</label>
                   <input 
                      required 
                      type="number" 
                      step="0.01"
                      value={formData.currentPrice}
                      onChange={e => setFormData({...formData, currentPrice: parseFloat(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none max-w-xs bg-white text-gray-900" 
                    />
                </div>

                {/* Recipe Builder - Using bg-gray-50 for container but bg-white for inputs */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Calculator size={16} /> Composição (Ingredientes)
                  </h4>
                  
                  {/* Adder */}
                  <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <select 
                      value={newIngredientId}
                      onChange={e => {
                        const ing = ingredients.find(i => i.id === e.target.value);
                        setNewIngredientId(e.target.value);
                        if (ing) {
                            setNewIngredientUnit(ing.purchaseUnit === 'l' ? 'ml' : (ing.purchaseUnit === 'kg' ? 'g' : 'un'));
                        }
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                    >
                      <option value="">Selecione um ingrediente...</option>
                      {ingredients.map(i => (
                        <option key={i.id} value={i.id}>{i.name} (compra em {i.purchaseUnit})</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Qtd" 
                      value={newIngredientQty || ''}
                      onChange={e => setNewIngredientQty(parseFloat(e.target.value))}
                      className="w-24 p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                    />
                    <select 
                      value={newIngredientUnit}
                      onChange={e => setNewIngredientUnit(e.target.value as UnitType)}
                      className="w-24 p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={addIngredientToRecipe}
                      disabled={!newIngredientId || !newIngredientQty}
                      className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-black"
                    >
                      {formData.recipe.some(r => r.ingredientId === newIngredientId) ? 'Atualizar' : 'Adicionar'}
                    </button>
                  </div>

                  {/* List */}
                  <div className="space-y-2">
                    {formData.recipe.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">Nenhum ingrediente adicionado.</p>}
                    {formData.recipe.map((item, idx) => {
                      const ingName = ingredients.find(i => i.id === item.ingredientId)?.name || 'Desconhecido';
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm shadow-sm">
                          <span className="text-gray-900">{ingName}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-gray-100 px-2 rounded text-xs text-gray-700">{item.quantityUsed} {item.unitUsed}</span>
                            <button type="button" onClick={() => removeRecipeItem(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition bg-white text-gray-700">Cancelar</button>
                 <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
