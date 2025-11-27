import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, RecipeItem, UnitType } from '../types';
import { Plus, Trash2, Edit2, Calculator, Info, AlertTriangle, Copy, Sparkles, Loader, Wand2, X, TrendingUp, DollarSign, Percent, ChevronRight } from 'lucide-react';
import { calculateProductMetrics, formatCurrency, formatPercent } from '../utils/calculations';
import { askAI } from '../utils/aiHelper';

const Products: React.FC = () => {
  const { products, ingredients, fixedCosts, settings, addProduct, updateProduct, deleteProduct } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // AI Loading States
  const [isAiDescLoading, setIsAiDescLoading] = useState(false);
  const [isAiPrepLoading, setIsAiPrepLoading] = useState(false);

  // Price Suggestion Modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    suggested: number;
    costIngredients: number;
    fixedPercent: number;
    variablePercent: number;
    marginPercent: number;
    breakdown: string;
  } | null>(null);

  // Estado para confirmação de exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string } | null>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    description: '',
    currentPrice: 0,
    preparationMethod: '',
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
    setFormData({ name: '', category: '', description: '', currentPrice: 0, preparationMethod: '', recipe: [] });
    setEditingId(null);
    setNewIngredientId('');
    setNewIngredientQty(0);
  };

  const handleEdit = (prod: Product) => {
    setFormData({ ...prod, description: prod.description || '', preparationMethod: prod.preparationMethod || '' });
    setEditingId(prod.id);
    setIsModalOpen(true);
  };

  const handleDuplicate = (prod: Product) => {
    setFormData({
      ...prod,
      name: `${prod.name} (Cópia)`,
      description: prod.description || '',
      preparationMethod: prod.preparationMethod || ''
    });
    setEditingId(null);
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

  // --- AI ACTIONS ---

  const getIngredientNames = () => {
    return formData.recipe.map(r => {
      const ing = ingredients.find(i => i.id === r.ingredientId);
      return ing ? ing.name : '';
    }).filter(Boolean).join(', ');
  };

  const calculateCurrentCost = () => {
    let costIngredients = 0;
    formData.recipe.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient) {
        const multiplier = item.unitUsed === 'kg' || item.unitUsed === 'l' ? 1000 : 1;
        const baseQty = item.quantityUsed * multiplier;

        const ingMultiplier = ingredient.purchaseUnit === 'kg' || ingredient.purchaseUnit === 'l' ? 1000 : 1;
        const basePurchaseQty = ingredient.purchaseQuantity * ingMultiplier;

        const yieldFactor = (ingredient.yieldPercent || 100) / 100;
        const pricePerBaseUnit = ingredient.purchasePrice / (basePurchaseQty * yieldFactor);

        costIngredients += pricePerBaseUnit * baseQty;
      }
    });
    return costIngredients;
  };

  const handleSuggestPrice = async () => {
    if (formData.recipe.length === 0) {
      alert("Adicione ingredientes primeiro para calcular o custo.");
      return;
    }

    const costIngredients = calculateCurrentCost();
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const fixedCostPercent = settings.estimatedMonthlyBilling > 0
      ? (totalFixedCosts / settings.estimatedMonthlyBilling) * 100
      : 0;

    const totalDeductions = fixedCostPercent + settings.taxAndLossPercent + settings.targetMargin;

    // Calcular preço sugerido
    let suggestedPrice = 0;
    let breakdown = '';

    if (totalDeductions >= 100) {
      // Impossível - usar margem mínima de 10%
      const minDeductions = fixedCostPercent + settings.taxAndLossPercent + 10;
      suggestedPrice = costIngredients / (1 - (minDeductions / 100));
      breakdown = `⚠️ ATENÇÃO: A soma dos custos (${totalDeductions.toFixed(1)}%) excede 100%!\n\nUsamos margem mínima de 10% para viabilidade.`;
    } else {
      suggestedPrice = costIngredients / (1 - (totalDeductions / 100));
      breakdown = `Cálculo baseado na fórmula de Markup por Dentro:\n\nPreço = CMV ÷ (1 - Deduções%)\nPreço = ${formatCurrency(costIngredients)} ÷ ${(1 - (totalDeductions / 100)).toFixed(3)}\nPreço = ${formatCurrency(suggestedPrice)}`;
    }

    // Arredondar para preço psicológico
    const roundedPrice = Math.ceil(suggestedPrice * 10) / 10;
    const finalPrice = roundedPrice % 1 === 0 ? roundedPrice - 0.10 : roundedPrice;

    setPriceSuggestion({
      suggested: finalPrice,
      costIngredients,
      fixedPercent: fixedCostPercent,
      variablePercent: settings.taxAndLossPercent,
      marginPercent: settings.targetMargin,
      breakdown
    });

    setPriceModalOpen(true);
  };

  const applyPriceSuggestion = () => {
    if (priceSuggestion) {
      setFormData(prev => ({ ...prev, currentPrice: priceSuggestion.suggested }));
      setPriceModalOpen(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) return;
    setIsAiDescLoading(true);

    const ingredientNames = getIngredientNames();

    const prompt = `Atue como um copywriter especialista em iFood e Delivery.
      Escreva uma descrição VENDEDORA, curta (máximo 280 caracteres) e apetitosa para o prato: "${formData.name}" (Categoria: ${formData.category}). 
      Ingredientes principais: ${ingredientNames}. 
      Use emojis. Foco em despertar fome e valorizar a qualidade.`;

    const result = await askAI(prompt);
    if (result) setFormData(prev => ({ ...prev, description: result }));
    setIsAiDescLoading(false);
  };

  const handleOptimizePrepMethod = async () => {
    if (!formData.preparationMethod && formData.recipe.length === 0) return;
    setIsAiPrepLoading(true);

    const ingredientNames = getIngredientNames();
    const currentPrep = formData.preparationMethod || "Não informado.";

    const prompt = `Atue como um Chef de Cozinha Executivo.
      Padronize o seguinte modo de preparo para o prato "${formData.name}".
      Ingredientes disponíveis: ${ingredientNames}.
      Rascunho atual: "${currentPrep}".
      
      Instruções:
      1. Crie uma lista numerada lógica.
      2. Seja direto e técnico (ex: "Sele a carne", "Emprate").
      3. Se o rascunho for vazio, crie um modo de preparo genérico e lógico baseado nos ingredientes.`;

    const result = await askAI(prompt);
    if (result) setFormData(prev => ({ ...prev, preparationMethod: result }));
    setIsAiPrepLoading(false);
  };

  // --- RECIPE BUILDER ---

  const addIngredientToRecipe = () => {
    if (!newIngredientId || newIngredientQty <= 0) return;

    setFormData(prev => {
      const existingIndex = prev.recipe.findIndex(item => item.ingredientId === newIngredientId);
      const newRecipe = [...prev.recipe];

      if (existingIndex >= 0) {
        newRecipe[existingIndex] = {
          ingredientId: newIngredientId,
          quantityUsed: newIngredientQty,
          unitUsed: newIngredientUnit
        };
      } else {
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
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map(product => {
          const metrics = calculateProductMetrics(product, ingredients, fixedCosts, settings);
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wide">
                    {product.category || 'Geral'}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">{product.name}</h3>
                  {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(product)} title="Editar" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                  <button onClick={() => handleDuplicate(product)} title="Duplicar" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"><Copy size={16} /></button>
                  <button onClick={() => handleDeleteClick(product)} title="Excluir" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 text-sm">
                <div className="space-y-1 pb-3 border-b border-gray-50">
                  <div className="flex justify-between text-gray-500">
                    <span>Ingredientes (CMV):</span>
                    <span>{formatCurrency(metrics.costIngredients)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1">Custos Fixos <span title="Rateio baseado no faturamento"><Info size={12} /></span>:</span>
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

                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-orange-700 font-medium">Preço Atual:</span>
                  <span className="font-bold text-xl text-orange-900">{formatCurrency(product.currentPrice)}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
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
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white text-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sugestão de Preço */}
      {priceModalOpen && priceSuggestion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={24} className="text-yellow-300" />
                    <h3 className="text-xl font-bold">Preço Sugerido</h3>
                  </div>
                  <p className="text-green-100 text-sm">Análise completa de custos e markup</p>
                </div>
                <button
                  onClick={() => setPriceModalOpen(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Preço em destaque */}
              <div className="mt-6 text-center">
                <div className="text-sm text-green-100 mb-1">Preço Recomendado</div>
                <div className="text-5xl font-bold text-white mb-1">
                  {formatCurrency(priceSuggestion.suggested)}
                </div>
                <div className="text-green-100 text-sm">
                  Margem líquida de {priceSuggestion.marginPercent}%
                </div>
              </div>
            </div>

            {/* Body - Breakdown */}
            <div className="p-6 space-y-4">
              {/* Custo Ingredientes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calculator size={16} className="text-orange-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Composição do Preço</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                    <span className="text-gray-600">CMV (Ingredientes)</span>
                    <span className="font-bold text-gray-900">{formatCurrency(priceSuggestion.costIngredients)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                    <span className="text-gray-600 flex items-center gap-1">
                      Custos Fixos
                      <span className="text-xs text-gray-400">({priceSuggestion.fixedPercent.toFixed(1)}%)</span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {formatCurrency((priceSuggestion.suggested * priceSuggestion.fixedPercent) / 100)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                    <span className="text-gray-600 flex items-center gap-1">
                      Impostos/Perdas
                      <span className="text-xs text-gray-400">({priceSuggestion.variablePercent}%)</span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {formatCurrency((priceSuggestion.suggested * priceSuggestion.variablePercent) / 100)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-green-700 font-medium flex items-center gap-1">
                      Lucro Líquido
                      <span className="text-xs text-green-600">({priceSuggestion.marginPercent}%)</span>
                    </span>
                    <span className="font-bold text-green-700">
                      {formatCurrency((priceSuggestion.suggested * priceSuggestion.marginPercent) / 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formula Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-900 whitespace-pre-line leading-relaxed">
                    {priceSuggestion.breakdown}
                  </div>
                </div>
              </div>

              {/* Comparação com preço atual */}
              {formData.currentPrice > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Preço Atual:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(formData.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">Diferença:</span>
                    <span className={`font-bold ${priceSuggestion.suggested > formData.currentPrice ? 'text-green-600' : 'text-red-600'}`}>
                      {priceSuggestion.suggested > formData.currentPrice ? '+' : ''}
                      {formatCurrency(priceSuggestion.suggested - formData.currentPrice)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setPriceModalOpen(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-white font-medium text-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={applyPriceSuggestion}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold transition shadow-sm flex items-center justify-center gap-2"
              >
                <DollarSign size={18} />
                Aplicar Preço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edição/Criação - REDESENHADO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8">
            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{editingId ? '✏️ Editar' : '✨ Novo'} Produto</h3>
                    <p className="text-sm text-gray-500 mt-1">Preencha os dados e otimize com IA</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                {/* Informações Básicas */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Info size={14} className="text-orange-600" />
                    </div>
                    Informações Básicas
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto *</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: X-Bacon Classic"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-gray-900 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                      <input
                        type="text"
                        placeholder="Ex: Lanches"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-gray-900 transition"
                      />
                    </div>
                  </div>

                  {/* Descrição com IA */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Descrição para Vendas</label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={!formData.name || isAiDescLoading}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition font-medium shadow-sm"
                      >
                        {isAiDescLoading ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Gerar com IA
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Uma descrição vendedora que desperta o apetite..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-gray-900 resize-none transition"
                    />
                  </div>
                </div>

                {/* Preço */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign size={14} className="text-green-600" />
                    </div>
                    Precificação
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Venda (R$) *</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.currentPrice}
                        onChange={e => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-gray-900 font-bold text-lg transition"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSuggestPrice}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles size={18} className="text-yellow-300" />
                        Sugerir Preço
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                    <Info size={12} />
                    A IA calcula considerando todos os custos e aplica estratégias de preço
                  </p>
                </div>

                {/* Composição/Receita */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calculator size={14} className="text-blue-600" />
                    </div>
                    Composição (Ingredientes)
                  </h4>

                  {/* Adder */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <select
                      value={newIngredientId}
                      onChange={e => {
                        const ing = ingredients.find(i => i.id === e.target.value);
                        setNewIngredientId(e.target.value);
                        if (ing) {
                          setNewIngredientUnit(ing.purchaseUnit === 'l' ? 'ml' : (ing.purchaseUnit === 'kg' ? 'g' : 'un'));
                        }
                      }}
                      className="sm:col-span-6 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="">Selecione um ingrediente...</option>
                      {ingredients.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={newIngredientQty || ''}
                      onChange={e => setNewIngredientQty(parseFloat(e.target.value))}
                      className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <select
                      value={newIngredientUnit}
                      onChange={e => setNewIngredientUnit(e.target.value as UnitType)}
                      className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition"
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
                      className="sm:col-span-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700 font-medium transition flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Lista de ingredientes */}
                  <div className="space-y-2">
                    {formData.recipe.length === 0 && (
                      <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Calculator size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum ingrediente adicionado</p>
                      </div>
                    )}
                    {formData.recipe.map((item, idx) => {
                      const ingName = ingredients.find(i => i.id === item.ingredientId)?.name || 'Desconhecido';
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition group">
                          <span className="text-gray-900 font-medium">{ingName}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-blue-50 px-3 py-1 rounded-lg text-sm text-blue-700 font-bold">
                              {item.quantityUsed} {item.unitUsed}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRecipeItem(idx)}
                              className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Modo de Preparo */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <ChevronRight size={14} className="text-indigo-600" />
                      </div>
                      Modo de Preparo
                    </h4>
                    <button
                      type="button"
                      onClick={handleOptimizePrepMethod}
                      disabled={!formData.name || isAiPrepLoading}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition font-medium shadow-sm"
                    >
                      {isAiPrepLoading ? <Loader size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      Padronizar com IA
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    placeholder="1. Grelhe a carne...&#10;2. Toste o pão...&#10;3. Monte o sanduíche..."
                    value={formData.preparationMethod}
                    onChange={e => setFormData({ ...formData, preparationMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-gray-900 resize-none font-mono text-sm transition"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-white transition bg-white text-gray-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-bold shadow-sm flex items-center gap-2"
                >
                  <Calculator size={18} />
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
