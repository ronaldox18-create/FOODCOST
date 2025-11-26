
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configurações do Estabelecimento</h2>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Negócio</label>
          <input 
            type="text" 
            value={localSettings.businessName}
            onChange={e => setLocalSettings({...localSettings, businessName: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margem de Lucro Alvo (%)</label>
            <p className="text-xs text-gray-500 mb-2">Quanto você quer lucrar sobre a venda.</p>
            <div className="relative">
              <input 
                type="number" 
                min="1" 
                max="99"
                value={localSettings.targetMargin}
                onChange={e => setLocalSettings({...localSettings, targetMargin: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-8 bg-white text-gray-900"
              />
              <span className="absolute right-4 top-3.5 text-gray-400">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Perdas e Impostos (%)</label>
            <p className="text-xs text-gray-500 mb-2">Custos extras (gás, óleo, maquininha).</p>
            <div className="relative">
              <input 
                type="number" 
                min="0" 
                max="100"
                value={localSettings.taxAndLossPercent}
                onChange={e => setLocalSettings({...localSettings, taxAndLossPercent: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-8 bg-white text-gray-900"
              />
              <span className="absolute right-4 top-3.5 text-gray-400">%</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <span className={`text-sm text-green-600 font-medium transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
                Configurações salvas com sucesso!
            </span>
            <button 
                type="submit" 
                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition font-medium"
            >
                <Save size={18} /> Salvar Alterações
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
