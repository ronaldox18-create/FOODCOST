
import React, { useMemo, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { calculateProductMetrics, formatCurrency, formatPercent } from '../utils/calculations';
import { askAI } from '../utils/aiHelper';
import { 
    TrendingUp, DollarSign, ShoppingBag, PieChart, 
    ArrowRight, Activity, Calendar, Wallet, Sparkles, Lightbulb, Target, Trophy
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, 
    AreaChart, Area, Pie, PieChart as RePieChart, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend, aiBadge }: any) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group ${aiBadge ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {aiBadge && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Sparkles size={8} /> IA
              </span>
          )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      {subtext && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <TrendingUp size={14} className="text-green-500" />}
            {trend === 'down' && <TrendingUp size={14} className="text-red-500 rotate-180" />}
            <p className="text-xs text-gray-400">{subtext}</p>
          </div>
      )}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 relative z-10`}>
      <Icon size={24} className={colorClass.replace('text-', 'text-opacity-100 ')} />
    </div>
    
    {/* Decorative background element */}
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 ${colorClass.replace('text-', 'bg-')}`}></div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs border border-gray-700">
        <p className="font-bold mb-1 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
                {entry.name}: <span className="font-bold">{entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { products, ingredients, fixedCosts, settings, orders } = useApp();
  const [dailyInsight, setDailyInsight] = useState<string>('');
  const [revenueForecast, setRevenueForecast] = useState<number | null>(null);

  // --- 1. METRICS CALCULATION ---
  const kpis = useMemo(() => {
    // Sales Data
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    
    const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === today);
    const monthOrders = orders.filter(o => new Date(o.date).getMonth() === currentMonth);
    
    const salesToday = todaysOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const salesMonth = monthOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const ticketAvg = monthOrders.length > 0 ? salesMonth / monthOrders.length : 0;

    // Menu Health Data
    const calculatedProducts = products.map(p => calculateProductMetrics(p, ingredients, fixedCosts, settings));
    
    // Average Cost Structure (Pie Chart Data)
    let totalCMVPercent = 0;
    let totalFixedPercent = 0;
    let totalVariablePercent = 0;
    let totalProfitPercent = 0;
    const count = calculatedProducts.length || 1;

    calculatedProducts.forEach(p => {
        const price = p.currentPrice || 1;
        totalCMVPercent += (p.costIngredients / price);
        totalFixedPercent += (p.costFixed / price);
        totalVariablePercent += (p.costVariable / price);
        totalProfitPercent += (p.currentMargin / 100);
    });

    const costStructureData = [
        { name: 'Ingredientes (CMV)', value: (totalCMVPercent / count) * 100, fill: '#f97316' }, // Orange
        { name: 'Custos Fixos', value: (totalFixedPercent / count) * 100, fill: '#3b82f6' }, // Blue
        { name: 'Impostos/Variáveis', value: (totalVariablePercent / count) * 100, fill: '#a855f7' }, // Purple
        { name: 'Lucro Líquido', value: Math.max(0, (totalProfitPercent / count) * 100), fill: '#22c55e' }, // Green
    ];

    // Top Performers Chart
    const topProductsData = [...calculatedProducts]
      .sort((a, b) => b.currentMargin - a.currentMargin)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        margin: parseFloat(p.currentMargin.toFixed(1)),
        profitValue: p.currentPrice - p.totalCost,
      }));

    // Sales Trend Data (Last 7 days mock-up based on real orders if available, else grouped)
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toDateString();
    }).reverse();

    const salesTrendData = last7Days.map(dateStr => {
        const dayTotal = orders
            .filter(o => new Date(o.date).toDateString() === dateStr)
            .reduce((acc, o) => acc + o.totalAmount, 0);
        
        const day = new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
        return { name: day, Vendas: dayTotal };
    });

    // Goal Progress
    const goalPercent = Math.min(100, (salesMonth / settings.estimatedMonthlyBilling) * 100);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const monthProgressPercent = (currentDay / daysInMonth) * 100;

    return { 
        salesToday, 
        salesMonth, 
        ticketAvg, 
        ordersCount: monthOrders.length,
        costStructureData,
        topProductsData,
        salesTrendData,
        recentOrders: orders.slice(0, 5), // Last 5
        goalPercent,
        monthProgressPercent
    };
  }, [products, ingredients, fixedCosts, settings, orders]);

  // AI Daily Insight & Forecast Effect
  useEffect(() => {
    const fetchData = async () => {
        const storedDate = localStorage.getItem('foodcost_insight_date');
        const today = new Date().toDateString();
        const storedInsight = localStorage.getItem('foodcost_daily_insight');
        const storedForecast = localStorage.getItem('foodcost_revenue_forecast');

        // Restore if valid today
        if (storedDate === today) {
            if (storedInsight) setDailyInsight(storedInsight);
            if (storedForecast) setRevenueForecast(parseFloat(storedForecast));
            return;
        }

        // Only run prompts if we have products
        if (products.length === 0) return;

        // --- 1. Daily Insight ---
        const insightPrompt = `Analise estes dados de restaurante e me dê APENAS UMA dica curta e valiosa (máximo 15 palavras) para o dono melhorar o lucro hoje. 
        Dados: Vendas Hoje: R$ ${kpis.salesToday}, Ticket Médio: R$ ${kpis.ticketAvg}, Produto Top Margem: ${kpis.topProductsData[0]?.name || 'N/A'}.`;
        
        const insightResult = await askAI(insightPrompt);
        if (insightResult) {
            setDailyInsight(insightResult);
            localStorage.setItem('foodcost_daily_insight', insightResult);
        }

        // --- 2. Revenue Forecast ---
        if (orders.length > 0) {
            const last7DaysValues = kpis.salesTrendData.map(d => d.Vendas);
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const currentDay = new Date().getDate();
            const monthTotalSoFar = kpis.salesMonth;

            const forecastPrompt = `Atue como um estatístico financeiro.
            Dados de Vendas dos últimos 7 dias: [${last7DaysValues.join(', ')}].
            Faturamento acumulado deste mês (Dia ${currentDay}/${daysInMonth}): R$ ${monthTotalSoFar}.
            
            TAREFA: Estime com base na tendência qual será o Faturamento Total no final deste mês.
            Considere sazonalidade simples (média ponderada).
            Retorne APENAS o número (ex: 15400.00). Use ponto para decimais.`;

            const forecastResult = await askAI(forecastPrompt);
            const forecastNum = parseFloat(forecastResult.replace(/[^0-9.]/g, ''));
            
            if (!isNaN(forecastNum) && forecastNum > 0) {
                setRevenueForecast(forecastNum);
                localStorage.setItem('foodcost_revenue_forecast', forecastNum.toString());
            }
        }

        // Update timestamp
        localStorage.setItem('foodcost_insight_date', today);
    };
    
    fetchData();
  }, [kpis, orders, products.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
            <p className="text-gray-500">Monitoramento em tempo real do seu negócio.</p>
        </div>
        <div className="flex gap-2">
            <Link to="/orders" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
                Histórico
            </Link>
            <Link to="/orders" className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-bold transition shadow-md flex items-center gap-2">
                <ShoppingBag size={18} /> Registrar Venda
            </Link>
        </div>
      </div>

      {/* AI Daily Insight */}
      {dailyInsight && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Sparkles size={24} className="text-yellow-300" />
              </div>
              <div className="flex-1">
                  <p className="text-xs font-bold text-purple-100 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Lightbulb size={12} /> Insight do Dia (IA)
                  </p>
                  <p className="font-medium text-white text-sm md:text-base">"{dailyInsight}"</p>
              </div>
          </div>
      )}

      {/* KPI Grid - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Mês" 
          value={formatCurrency(kpis.salesMonth)} 
          subtext={`${kpis.ordersCount} pedidos realizados`}
          icon={Calendar} 
          colorClass="text-blue-600"
        />
        
        {/* AI Forecast Card */}
        {revenueForecast ? (
             <StatCard 
             title="Projeção (Fim do Mês)" 
             value={formatCurrency(revenueForecast)} 
             subtext={revenueForecast > kpis.salesMonth ? "Tendência de Alta" : "Meta Próxima"}
             icon={Target} 
             trend="up"
             colorClass="text-indigo-600"
             aiBadge={true}
           />
        ) : (
            <StatCard 
            title="Vendas Hoje" 
            value={formatCurrency(kpis.salesToday)} 
            subtext="Caixa diário atual"
            icon={Wallet} 
            colorClass="text-green-600"
          />
        )}

        <StatCard 
          title="Ticket Médio" 
          value={formatCurrency(kpis.ticketAvg)} 
          subtext="Média por pedido"
          icon={Activity} 
          colorClass="text-purple-600"
        />
        <StatCard 
          title="Margem Alvo" 
          value={`${settings.targetMargin}%`} 
          subtext="Meta de lucratividade"
          icon={TrendingUp} 
          colorClass="text-orange-600"
        />
      </div>

      {/* Goal & Trend Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Goal Progress Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Trophy size={20} className="text-yellow-500" />
                      Meta de Faturamento
                  </h3>
                  <p className="text-sm text-gray-500">Progresso vs Estimado ({formatCurrency(settings.estimatedMonthlyBilling)})</p>
              </div>

              <div className="mt-6">
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-3xl font-bold text-gray-900">{kpis.goalPercent.toFixed(1)}%</span>
                      <span className="text-sm font-medium text-gray-500">do objetivo</span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden w-full">
                      {/* Actual Progress */}
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                            kpis.goalPercent >= 100 ? 'bg-green-500' : 
                            kpis.goalPercent >= kpis.monthProgressPercent ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${kpis.goalPercent}%` }}
                      ></div>
                      
                      {/* Time Marker (Where we should be ideally) */}
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-gray-400 z-10"
                        style={{ left: `${kpis.monthProgressPercent}%` }}
                        title="Dia atual"
                      ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>R$ 0</span>
                      <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div> 
                          Hoje ({Math.round(kpis.monthProgressPercent)}%)
                      </span>
                      <span>{formatCurrency(settings.estimatedMonthlyBilling)}</span>
                  </div>

                  <div className="mt-4 bg-gray-50 p-3 rounded-lg text-xs text-gray-600 border border-gray-100">
                      {kpis.goalPercent >= kpis.monthProgressPercent 
                        ? "🚀 Ótimo! Você está vendendo acima do ritmo necessário para bater a meta."
                        : "⚠️ Atenção: As vendas estão um pouco abaixo do ritmo ideal para o dia do mês."
                      }
                  </div>
              </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-600" />
                      Evolução de Vendas
                  </h3>
                  <p className="text-sm text-gray-500">Faturamento dos últimos 7 dias.</p>
              </div>
              <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={kpis.salesTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(val) => `R$${val}`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                          <CartesianGrid vertical={false} stroke="#f3f4f6" />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="Vendas" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Cost Structure & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost Structure Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <PieChart size={20} className="text-purple-600" />
                    Para onde vai o dinheiro?
                </h3>
                <p className="text-sm text-gray-500">Estrutura média do seu cardápio.</p>
            </div>
            <div className="flex-1 min-h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={kpis.costStructureData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {kpis.costStructureData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatPercent(val)} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}}/>
                    </RePieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                     <span className="text-xs text-gray-400">Lucro Médio</span>
                     <span className="text-xl font-bold text-green-600">{formatPercent(kpis.costStructureData[3].value)}</span>
                </div>
            </div>
        </div>

        {/* Top Performers */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Campeões de Margem</h3>
                    <p className="text-sm text-gray-500">Produtos que geram mais lucro %.</p>
                </div>
                <Link to="/products" className="text-xs font-bold text-orange-600 hover:underline">Ver Cardápio</Link>
            </div>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpis.topProductsData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fontWeight: 500}} />
                        <Tooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                                return (
                                    <div className="bg-gray-900 text-white p-2 rounded text-xs">
                                        <p>{payload[0].payload.name}</p>
                                        <p className="font-bold text-green-400">{payload[0].value}% Margem</p>
                                    </div>
                                );
                             }
                             return null;
                        }} />
                        <Bar dataKey="margin" radius={[0, 4, 4, 0]} barSize={24} fill="#16a34a" background={{ fill: '#f3f4f6' }}>
                             <ReferenceLine x={settings.targetMargin} stroke="red" strokeDasharray="3 3" label="Meta" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Últimos Pedidos</h3>
                    <p className="text-sm text-gray-500">Atividade recente de vendas.</p>
                </div>
                <Link to="/orders" className="text-xs font-bold text-blue-600 hover:underline">Ver Todos</Link>
            </div>
            
            <div className="space-y-4">
                {kpis.recentOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <ShoppingBag className="mx-auto mb-2 opacity-20" size={32} />
                        <p>Nenhum venda registrada.</p>
                    </div>
                ) : (
                    kpis.recentOrders.map(order => (
                        <div key={order.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition border border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                    {order.customerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(order.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} • {order.items.length} itens
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    order.paymentMethod === 'pix' ? 'bg-green-100 text-green-700' :
                                    order.paymentMethod === 'money' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {order.paymentMethod}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
