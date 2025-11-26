
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, RecipeItem, UnitType } from '../types';
import { Plus, Trash2, Edit2, Calculator, Info, AlertTriangle, Copy, Sparkles, Loader, Wand2, Brain, TrendingUp, CheckCircle2 } from 'lucide-react';
import { calculateProductMetrics, formatCurrency, formatPercent } from '../utils/calculations';
import { askAI } from '../utils/aiHelper';

const Products: React.FC = () => {
  const { products, ingredients, fixedCosts, settings, addProduct, updateProduct, deleteProduct } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // AI Loading States
  const [isAiDescLoading, setIsAiDescLoading] = useState(false);
  const [isAiPrepLoading, setIsAiPrepLoading] = useState(false);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);
  const [isAiPriceLoading, setIsAiPriceLoading] = useState(false);
  
  // AI Analysis Result
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  
  // Estado para confirmação de exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);

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
    setAiAnalysisResult('');
  };

  const handleEdit = (prod: Product) => {
    setFormData({ ...prod, description: prod.description || '', preparationMethod: prod.preparationMethod || '' });
    setEditingId(prod.id);
    setAiAnalysisResult(''); // Limpa análise anterior
    setIsModalOpen(true);
  };

  const handleDuplicate = (prod: Product) => {
    setFormData({ 
        ...prod, 
        name: `${prod.name} (Cópia)`,
        description: prod.description || '',
        preparationMethod: prod.preparationMethod || ''
    });
    setEditingId(null); // Null means create new
    setAiAnalysisResult('');
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
      
      setIsAiPriceLoading(true);

      const costIngredients = calculateCurrentCost();
      const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const fixedCostPercent = settings.estimatedMonthlyBilling > 0 
          ? (totalFixedCosts / settings.estimatedMonthlyBilling) * 100 
          : 0;

      const prompt = `Atue como um Especialista em Precificação de Restaurantes.
      
      DADOS DO PRODUTO:
      - Nome: ${formData.name || 'Produto sem nome'}
      - Categoria: ${formData.category || 'Geral'}
      - Custo dos Ingredientes (CMV): R$ ${costIngredients.toFixed(2)}
      
      ESTRUTURA DE CUSTOS DO NEGÓCIO:
      - Custo Fixo (Rateio): ${fixedCostPercent.toFixed(1)}%
      - Impostos/Taxas/Perdas: ${settings.taxAndLossPercent}%
      - Margem de Lucro Alvo: ${settings.targetMargin}%
      
      TAREFA:
      1. Calcule o preço técnico necessário para cobrir todos os custos e atingir a margem.
      2. Ajuste esse preço técnico usando PSICOLOGIA DE PREÇO (ex: terminar em ,90 ou ,00) para torná-lo comercialmente atraente para esta categoria de produto.
      3. Retorne APENAS o valor numérico final (ex: 29.90). Use ponto para decimais.`;

      const result = await askAI(prompt);
      
      // Extrair número da resposta (caso a IA mande texto junto)
      const priceString = result.replace(/[^0-9.]/g, '');
      const suggestedPrice = parseFloat(priceString);

      if (!isNaN(suggestedPrice) && suggestedPrice > 0) {
          setFormData(prev => ({ ...prev, currentPrice: suggestedPrice }));
      } else {
          alert("Não foi possível sugerir um preço. Tente novamente.");
      }
      
      setIsAiPriceLoading(false);
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

  const handleAnalyzeProduct = async () => {
      const costIngredients = calculateCurrentCost();
      const currentMargin = formData.currentPrice > 0 
        ? ((formData.currentPrice - costIngredients) / formData.currentPrice) * 100 
        : 0;

      setIsAiAnalysisLoading(true);
      
      const prompt = `Atue como um Consultor Financeiro de Restaurantes Sênior.
      Analise o seguinte produto e me dê um veredito curto e direto:
      
      Produto: ${formData.name}
      Categoria: ${formData.category}
      CMV (Custo Ingredientes): ${formatCurrency(costIngredients)}
      Preço Venda Atual: ${formatCurrency(formData.currentPrice)}
      Margem Bruta (aprox): ${currentMargin.toFixed(1)}%
      Ingredientes: ${getIngredientNames()}
      
      Responda neste formato:
      VEREDITO: [Bom/Ruim/Excelente]
      ANÁLISE: [Uma frase curta explicando o porquê]
      SUGESTÃO: [Uma ação prática para melhorar o lucro ou venda]`;

      const result = await askAI(prompt);
      if (result) setAiAnalysisResult(result);
      setIsAiAnalysisLoading(false);
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
                  {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8 flex flex-col md:flex-row h-[90vh] md:h-auto overflow-hidden">
             
             {/* LEFT SIDE: FORM */}
             <form onSubmit={handleSubmit} className="flex flex-col h-full w-full md:w-2/3 overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar' : 'Novo'} Produto</h3>
              </div>
              
              <div className="p-6 space-y-6">
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

                {/* AI Description */}
                <div>
                   <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Descrição (Vendas)</label>
                        <button 
                           type="button" 
                           onClick={handleGenerateDescription}
                           disabled={!formData.name || isAiDescLoading}
                           className="text-xs flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 hover:bg-purple-100 disabled:opacity-50 transition font-medium"
                        >
                            {isAiDescLoading ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Criar Copy Vendedora (IA)
                        </button>
                   </div>
                   <textarea 
                      rows={2}
                      placeholder="Descrição curta para o cardápio..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 resize-none" 
                    />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
                   <div className="flex gap-2">
                      <input 
                          required 
                          type="number" 
                          step="0.01"
                          value={formData.currentPrice}
                          onChange={e => setFormData({...formData, currentPrice: parseFloat(e.target.value)})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none max-w-[150px] bg-white text-gray-900" 
                        />
                      <button 
                          type="button" 
                          onClick={handleSuggestPrice}
                          disabled={isAiPriceLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-sm transition disabled:opacity-70"
                      >
                          {isAiPriceLoading ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-200" />}
                          Sugerir Preço (IA)
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1">
                      A IA calcula o markup e aplica psicologia de preço (ex: 29,90).
                   </p>
                </div>

                {/* Recipe Builder */}
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

                 {/* Preparation Method */}
                 <div>
                   <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Modo de Preparo</label>
                        <button 
                           type="button" 
                           onClick={handleOptimizePrepMethod}
                           disabled={!formData.name || isAiPrepLoading}
                           className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 disabled:opacity-50 transition font-medium"
                        >
                            {isAiPrepLoading ? <Loader size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            Padronizar com IA
                        </button>
                   </div>
                   <textarea 
                      rows={5}
                      placeholder="Descreva o passo a passo..."
                      value={formData.preparationMethod}
                      onChange={e => setFormData({...formData, preparationMethod: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 resize-none font-mono text-sm" 
                    />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl mt-auto">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition bg-white text-gray-700">Cancelar</button>
                 <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">Salvar Produto</button>
              </div>
            </form>

            {/* RIGHT SIDE: AI ANALYSIS */}
            <div className="w-full md:w-1/3 bg-gray-900 text-gray-100 p-6 flex flex-col">
                <div className="flex items-center gap-2 text-purple-400 mb-6">
                    <Brain size={24} />
                    <h3 className="text-lg font-bold">Chef IA Review</h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {!aiAnalysisResult ? (
                        <div className="text-center text-gray-500 mt-10">
                            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Preencha o produto ao lado e peça para a IA analisar a lucratividade e o equilíbrio da receita.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-green-500" /> Análise Completa
                                </h4>
                                <div className="text-sm leading-relaxed text-gray-200 whitespace-pre-line">
                                    {aiAnalysisResult}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800">
                    <button 
                        type="button"
                        onClick={handleAnalyzeProduct}
                        disabled={!formData.name || formData.currentPrice <= 0 || isAiAnalysisLoading}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                        {isAiAnalysisLoading ? <Loader size={20} className="animate-spin" /> : <Brain size={20} />}
                        {isAiAnalysisLoading ? 'Analisando...' : 'Analisar Lucratividade'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-3">
                        A IA analisa custos, margem e composição para dar dicas estratégicas.
                    </p>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
