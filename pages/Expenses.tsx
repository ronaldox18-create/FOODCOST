
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { FixedCost } from '../types';
import { Plus, Trash2, DollarSign, PieChart } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/calculations';

const Expenses: React.FC = () => {
  const { fixedCosts, settings, addFixedCost, deleteFixedCost, updateSettings } = useApp();
  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  
  // Local state for billing input to avoid glitchy typing
  const [billingInput, setBillingInput] = useState(settings.estimatedMonthlyBilling.toString());

  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
  const fixedCostImpact = settings.estimatedMonthlyBilling > 0 
    ? (totalFixedCosts / settings.estimatedMonthlyBilling) * 100 
    : 0;

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostName || !newCostAmount) return;

    const cost: FixedCost = {
      id: crypto.randomUUID(),
      name: newCostName,
      amount: parseFloat(newCostAmount)
    };
    addFixedCost(cost);
    setNewCostName('');
    setNewCostAmount('');
  };

  const handleBillingBlur = () => {
    const val = parseFloat(billingInput);
    if (!isNaN(val)) {
        updateSettings({ ...settings, estimatedMonthlyBilling: val });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Despesas Operacionais</h2>
        <p className="text-gray-500">Cadastre seus custos fixos para calcular o peso deles no preço do produto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Input */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <DollarSign size={24} />
            <h3 className="text-lg font-bold">Faturamento Estimado</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Qual a média de vendas mensal do seu estabelecimento? Esse valor é usado para ratear os custos fixos.
          </p>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">R$</span>
            <input 
              type="number"
              value={billingInput}
              onChange={e => setBillingInput(e.target.value)}
              onBlur={handleBillingBlur}
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 font-medium">Total Custos Fixos</span>
            <span className="text-xl font-bold text-red-600">{formatCurrency(totalFixedCosts)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(fixedCostImpact, 100)}%` }}></div>
          </div>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <PieChart size={24} />
             </div>
             <div>
                <span className="text-sm text-gray-500">Impacto no Preço</span>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(fixedCostImpact)}</p>
             </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Significa que {formatPercent(fixedCostImpact)} de cada venda paga as contas do estabelecimento.
          </p>
        </div>
      </div>

      {/* Fixed Costs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Lista de Contas Fixas</h3>
        </div>
        
        {/* Add Form */}
        <form onSubmit={handleAddCost} className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 bg-white">
          <input 
            type="text" 
            placeholder="Nome da despesa (ex: Internet)" 
            value={newCostName}
            onChange={e => setNewCostName(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
          />
          <input 
            type="number" 
            placeholder="Valor (R$)" 
            value={newCostAmount}
            onChange={e => setNewCostAmount(e.target.value)}
            className="w-32 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
          />
          <button 
            type="submit" 
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Adicionar
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-100 text-sm">
              {fixedCosts.length === 0 ? (
                 <tr><td className="p-6 text-center text-gray-400">Nenhuma despesa cadastrada.</td></tr>
              ) : (
                fixedCosts.map(cost => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{cost.name}</td>
                    <td className="p-4 text-right font-medium text-red-600">{formatCurrency(cost.amount)}</td>
                    <td className="p-4 text-right w-16">
                      <button onClick={() => deleteFixedCost(cost.id)} className="text-gray-400 hover:text-red-600 transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
