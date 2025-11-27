import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Utensils, Clock, DollarSign, LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

// Componente Card de Mesa Individual para isolar lógica e timer
const TableCard = ({ table, onDelete, onClick }: { table: any, onDelete: (id: string) => void, onClick: (id: string, status: string, orderId?: string) => void }) => {
    const { orders } = useApp();
    const [elapsedTime, setElapsedTime] = useState<string>('-');
    
    // Encontrar o pedido associado a esta mesa para garantir dados frescos
    // O AppContext já faz um bind, mas buscar direto garante caso o bind tenha lag
    const associatedOrder = useMemo(() => {
        if (table.status !== 'occupied') return null;
        // Tenta usar o que vem na mesa, ou busca nos pedidos abertos
        if (table.currentOrderId) {
            return orders.find(o => o.id === table.currentOrderId);
        }
        return orders.find(o => o.tableId === table.id && o.status === 'open');
    }, [table, orders]);

    // Timer local para atualização
    useEffect(() => {
        if (table.status !== 'occupied' || !associatedOrder) {
            setElapsedTime('-');
            return;
        }

        const updateTime = () => {
            try {
                const start = new Date(associatedOrder.date).getTime();
                const now = new Date().getTime();
                
                if (isNaN(start)) {
                    setElapsedTime('-');
                    return;
                }

                const diffMs = now - start;
                // Se a data for futura (erro de relógio), mostra 0
                if (diffMs < 0) {
                    setElapsedTime('0m');
                    return;
                }

                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins < 60) {
                    setElapsedTime(`${diffMins} min`);
                } else {
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    setElapsedTime(`${hours}h ${mins}m`);
                }
            } catch (e) {
                console.error("Erro calc tempo mesa", e);
                setElapsedTime('-');
            }
        };

        updateTime(); // Chama imediatamente
        const timer = setInterval(updateTime, 60000); // Atualiza a cada minuto

        return () => clearInterval(timer);
    }, [table.status, associatedOrder]);

    const isOccupied = table.status === 'occupied' && associatedOrder;
    const currentTotal = associatedOrder ? associatedOrder.totalAmount : 0;

    return (
        <div 
            onClick={() => onClick(table.id, table.status, associatedOrder?.id)}
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-h-[180px] overflow-hidden ${
                isOccupied
                    ? 'bg-white border-red-200 shadow-red-100' 
                    : 'bg-white border-gray-100 hover:border-green-300 shadow-sm'
            }`}
        >
            {/* Faixa superior de status */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isOccupied ? 'bg-red-500' : 'bg-green-400'}`}></div>

            <div className="flex justify-between items-start mt-2">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mesa</span>
                    <span className={`text-3xl font-black ${isOccupied ? 'text-gray-800' : 'text-gray-600'}`}>
                        {String(table.number).padStart(2, '0')}
                    </span>
                </div>
                {isOccupied ? (
                    <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold animate-pulse">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        OCUPADA
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        LIVRE
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center flex-1 my-4">
                {isOccupied ? (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                             <div className="flex items-center gap-2 text-gray-500">
                                 <Clock size={14} />
                                 <span className="text-xs font-medium">Tempo</span>
                             </div>
                             <span className="text-sm font-bold text-gray-900">{elapsedTime}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-0.5">Consumo Atual</span>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(currentTotal)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-300 flex flex-col items-center gap-2 opacity-60 group-hover:opacity-100 group-hover:text-green-500 transition-all">
                        <Utensils size={32} strokeWidth={1.5} />
                        <span className="text-xs font-medium">Toque para abrir</span>
                    </div>
                )}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(table.id); }}
                className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                title="Excluir Mesa"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

const Tables: React.FC = () => {
  const { tables, addTable, deleteTable, orders } = useApp();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');

  // Ordenar mesas por número
  const sortedTables = useMemo(() => {
      return [...tables].sort((a, b) => a.number - b.number);
  }, [tables]);

  // Métricas do Salão
  const metrics = useMemo(() => {
      const total = tables.length;
      const occupied = tables.filter(t => t.status === 'occupied').length;
      const free = total - occupied;
      const revenue = tables.reduce((acc, t) => acc + (t.currentOrderTotal || 0), 0);
      return { total, occupied, free, revenue };
  }, [tables]);

  const handleAddTable = async () => {
      if (!newTableNumber) return;
      const num = parseInt(newTableNumber);
      if (isNaN(num)) return;
      
      // Verificar se já existe
      if (tables.some(t => t.number === num)) {
          alert("Já existe uma mesa com este número.");
          return;
      }

      await addTable(num);
      setNewTableNumber('');
      setIsAdding(false);
  };

  const handleTableClick = (tableId: string, status: string, orderId?: string) => {
      if (status === 'occupied' && orderId) {
          // Ir para o pedido existente
          navigate(`/orders?tableId=${tableId}&orderId=${orderId}`);
      } else {
          // Abrir nova mesa
          navigate(`/orders?tableId=${tableId}`);
      }
  };

  const handleDeleteTable = async (id: string) => {
      if (confirm("Tem certeza que deseja excluir esta mesa?")) {
          await deleteTable(id);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header e Métricas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutGrid className="text-orange-600" /> Gestão de Mesas
                </h1>
                <p className="text-gray-500 text-sm mt-1">Visão geral do salão em tempo real.</p>
            </div>
            <div className="flex gap-3">
                 <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center min-w-[100px]">
                     <span className="text-xs text-gray-400 uppercase font-bold">Ocupação</span>
                     <div className="font-bold text-gray-900">
                         <span className="text-orange-600">{metrics.occupied}</span> <span className="text-gray-300">/</span> {metrics.total}
                     </div>
                 </div>
                 <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center min-w-[120px]">
                     <span className="text-xs text-gray-400 uppercase font-bold">Faturamento</span>
                     <div className="font-bold text-green-600">{formatCurrency(metrics.revenue)}</div>
                 </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className="bg-gray-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 h-full"
                >
                    <Plus size={18} /> <span className="hidden sm:inline">Nova Mesa</span>
                </button>
            </div>
        </div>

        {/* Formulário de Adição */}
        {isAdding && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex flex-col sm:flex-row gap-4 animate-slide-up max-w-lg mx-auto relative z-10">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Número da Mesa</label>
                    <input 
                        type="number" 
                        placeholder="Ex: 10" 
                        value={newTableNumber}
                        onChange={e => setNewTableNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-lg font-bold"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                    />
                </div>
                <div className="flex items-end gap-2">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleAddTable} className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">Adicionar Mesa</button>
                </div>
            </div>
        )}

        {/* Grid de Mesas */}
        {sortedTables.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <Utensils size={40} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">O salão está vazio</h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-6">Você ainda não cadastrou nenhuma mesa. Comece adicionando as mesas do seu estabelecimento.</p>
                <button onClick={() => setIsAdding(true)} className="text-orange-600 font-bold hover:underline flex items-center gap-1">
                    <Plus size={16} /> Cadastrar primeira mesa
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedTables.map(table => (
                    <TableCard 
                        key={table.id} 
                        table={table} 
                        onDelete={handleDeleteTable} 
                        onClick={handleTableClick} 
                    />
                ))}
            </div>
        )}
    </div>
  );
};

export default Tables;
