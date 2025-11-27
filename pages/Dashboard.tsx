import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Activity,
    PieChart,
    Zap,
    Award,
    Clock,
    Users,
    ArrowUpRight,
    Target,
    Crown,
    CalendarCheck,
    Megaphone,
    MessageCircle,
    Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const Dashboard: React.FC = () => {
    const { orders, ingredients, products, customers, settings } = useApp();

    // ==========================================================================
    // 1. CÁLCULOS DO DIA ATUAL (LIVE)
    // ==========================================================================

    const todayStats = useMemo(() => {
        const today = new Date();
        // Resetar horas para comparar apenas data
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));

        const todaysOrders = orders.filter(o => {
            const d = new Date(o.date);
            return d >= startOfDay && o.status !== 'canceled';
        });

        const revenue = todaysOrders.reduce((acc, o) => acc + o.totalAmount, 0);

        // Meta Diária: Meta Mensal / 26 dias úteis (estimativa padrão)
        const monthlyGoal = settings.estimatedMonthlyBilling || 50000;
        const dailyGoal = monthlyGoal / 26;

        const progress = Math.min((revenue / dailyGoal) * 100, 100);
        const remaining = Math.max(0, dailyGoal - revenue);

        return { revenue, ordersCount: todaysOrders.length, dailyGoal, progress, remaining };
    }, [orders, settings]);

    // Sugestões de Ação baseadas no Horário e Meta
    const actionSuggestions = useMemo(() => {
        const hour = new Date().getHours();
        const { progress } = todayStats;
        const suggestions: { icon: any, title: string, text: string, color: string, action: string }[] = [];

        // Se já passou das 18h e a meta está abaixo de 70%
        if (hour >= 18 && progress < 70) {
            suggestions.push({
                icon: Megaphone,
                title: "Meta em Risco!",
                text: "Faltam poucas horas e a meta está longe. Que tal uma promoção relâmpago de jantar?",
                color: "bg-red-50 text-red-700 border-red-100",
                action: "Criar Promo Jantar"
            });
            suggestions.push({
                icon: MessageCircle,
                title: "Ativar Clientes VIP",
                text: "Envie uma mensagem para seus 5 top clientes oferecendo sobremesa grátis.",
                color: "bg-blue-50 text-blue-700 border-blue-100",
                action: "Ver VIPs"
            });
        }
        // Se é hora do almoço (11h-14h) e o movimento está fraco
        else if (hour >= 11 && hour <= 14 && progress < 30) {
            suggestions.push({
                icon: Zap,
                title: "Movimento Lento no Almoço",
                text: "O movimento está abaixo do esperado. Ofereça bebida grátis no combo.",
                color: "bg-orange-50 text-orange-700 border-orange-100",
                action: "Oferta Almoço"
            });
        }
        // Meta Batida
        else if (progress >= 100) {
            suggestions.push({
                icon: Award,
                title: "Meta Batida! 🚀",
                text: "Parabéns! Você já atingiu a meta do dia. Tudo agora é lucro extra.",
                color: "bg-green-50 text-green-700 border-green-100",
                action: "Ver Relatório"
            });
        }

        return suggestions;
    }, [todayStats]);

    // ==========================================================================
    // 2. CÁLCULOS TENDÊNCIAS GERAIS
    // ==========================================================================

    const trends = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        let currentRev = 0;
        let prevRev = 0;
        let currentOrders = 0;
        let prevOrders = 0;

        orders.forEach(o => {
            if (o.status === 'canceled') return;
            const d = new Date(o.date);

            if (d >= oneWeekAgo) {
                currentRev += o.totalAmount;
                currentOrders++;
            } else if (d >= twoWeeksAgo && d < oneWeekAgo) {
                prevRev += o.totalAmount;
                prevOrders++;
            }
        });

        const revGrowth = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : 0;
        const ordersGrowth = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;

        return {
            currentRev, prevRev, revGrowth,
            currentOrders, prevOrders, ordersGrowth
        };
    }, [orders]);

    const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + (o.status !== 'canceled' ? o.totalAmount : 0), 0), [orders]);
    const ordersCount = useMemo(() => orders.length, [orders]);

    const financialData = useMemo(() => {
        let totalCost = 0;
        orders.forEach(order => {
            if (order.status === 'canceled') return;
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    let itemCost = 0;
                    product.recipe.forEach(r => {
                        const ing = ingredients.find(i => i.id === r.ingredientId);
                        if (ing) {
                            let qty = r.quantityUsed;
                            if (ing.purchaseUnit === 'kg' && r.unitUsed === 'g') qty /= 1000;
                            if (ing.purchaseUnit === 'l' && r.unitUsed === 'ml') qty /= 1000;
                            itemCost += (ing.purchasePrice / ing.purchaseQuantity) * qty;
                        }
                    });
                    totalCost += itemCost * item.quantity;
                }
            });
        });
        const profit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        return { cost: totalCost, profit, margin };
    }, [orders, products, ingredients, totalRevenue]);

    // Gráficos e Tabelas
    const busyHours = useMemo(() => {
        const hours = Array(24).fill(0);
        orders.forEach(o => {
            if (o.status === 'canceled') return;
            const hour = new Date(o.date).getHours();
            hours[hour] += 1;
        });
        const max = Math.max(...hours, 1);
        return hours.map((count, hour) => ({ hour, count, intensity: count / max }));
    }, [orders]);

    const weeklySalesData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        return last7Days.map(date => {
            const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
            const dayOrders = orders.filter(o => {
                const d = new Date(o.date);
                return d.getDate() === date.getDate() && o.status !== 'canceled';
            });
            const revenue = dayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
            return { day: dayStr, value: revenue, count: dayOrders.length };
        });
    }, [orders]);

    const topCustomers = useMemo(() => {
        return [...customers]
            .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
            .slice(0, 5);
    }, [customers]);

    const pricingOpportunities = useMemo(() => {
        const opportunities: any[] = [];
        const taxAndFixed = (settings.taxAndLossPercent || 12) + 25;

        products.forEach(p => {
            let cost = 0;
            p.recipe.forEach(r => {
                const ing = ingredients.find(i => i.id === r.ingredientId);
                if (ing) {
                    let qty = r.quantityUsed;
                    if (ing.purchaseUnit === 'kg' && r.unitUsed === 'g') qty /= 1000;
                    if (ing.purchaseUnit === 'l' && r.unitUsed === 'ml') qty /= 1000;
                    cost += (ing.purchasePrice / ing.purchaseQuantity) * qty;
                }
            });
            const divisor = 1 - ((taxAndFixed + (settings.targetMargin || 20)) / 100);
            const idealPrice = divisor > 0 ? cost / divisor : cost * 2;

            if (p.currentPrice < idealPrice * 0.9) {
                opportunities.push({
                    name: p.name,
                    current: p.currentPrice,
                    ideal: idealPrice,
                    diff: idealPrice - p.currentPrice
                });
            }
        });
        return opportunities.sort((a, b) => b.diff - a.diff).slice(0, 3);
    }, [products, ingredients, settings]);

    const maxSalesValue = Math.max(...weeklySalesData.map(d => d.value), 10);
    const monthlyGoal = settings.estimatedMonthlyBilling || 50000;
    const currentMonthRevenue = useMemo(() => {
        const now = new Date();
        return orders.reduce((acc, o) => {
            const d = new Date(o.date);
            return (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== 'canceled')
                ? acc + o.totalAmount
                : acc;
        }, 0);
    }, [orders]);
    const goalProgress = Math.min((currentMonthRevenue / monthlyGoal) * 100, 100);

    return (
        <div className="space-y-8 animate-fade-in pb-20">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        Dashboard <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-bold uppercase tracking-wide">Pro</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Visão geral do desempenho do {settings.businessName || 'negócio'}.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/advisor" className="btn-secondary text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                        <Zap size={18} /> Consultar IA
                    </Link>
                    <Link to="/orders" className="btn-primary">
                        <ShoppingBag size={18} /> Novo Pedido
                    </Link>
                </div>
            </div>

            {/* --- NOVA SEÇÃO: DESEMPENHO DO DIA (Premium) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Card Principal - Meta do Dia com Círculo de Progresso */}
                <div className="lg:col-span-5 p-8 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl relative overflow-hidden">
                    {/* Background decorativo */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-green-500/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <CalendarCheck size={20} className="text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Desempenho de Hoje</h3>
                                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Pedidos</p>
                                <p className="text-2xl font-bold text-white">{todayStats.ordersCount}</p>
                            </div>
                        </div>

                        {/* Circular Progress */}
                        <div className="flex items-center justify-center mb-8">
                            <div className="relative">
                                {/* SVG Circle */}
                                <svg className="transform -rotate-90" width="200" height="200">
                                    {/* Background circle */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="85"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="12"
                                        fill="none"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="85"
                                        stroke={todayStats.progress >= 100 ? "#10b981" : "url(#gradient)"}
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 85}`}
                                        strokeDashoffset={`${2 * Math.PI * 85 * (1 - todayStats.progress / 100)}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#f97316" />
                                            <stop offset="100%" stopColor="#fb923c" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-5xl font-bold mb-1">{todayStats.progress.toFixed(0)}%</p>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">da meta</p>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Display */}
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-400 mb-1">Faturamento de Hoje</p>
                            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                {formatCurrency(todayStats.revenue)}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <span className="text-gray-400">Meta:</span>
                                <span className="font-bold text-white">{formatCurrency(todayStats.dailyGoal)}</span>
                                {todayStats.remaining > 0 ? (
                                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                                        Falta {formatCurrency(todayStats.remaining)}
                                    </span>
                                ) : (
                                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <TrendingUp size={12} />
                                        Meta Superada!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <p className="text-xs text-gray-400 mb-1">Ticket Médio</p>
                                <p className="text-lg font-bold">{formatCurrency(todayStats.ordersCount > 0 ? todayStats.revenue / todayStats.ordersCount : 0)}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <p className="text-xs text-gray-400 mb-1">Por Pedido</p>
                                <p className="text-lg font-bold">{todayStats.ordersCount}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <p className="text-xs text-gray-400 mb-1">Hora Atual</p>
                                <p className="text-lg font-bold">{new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendas por Hora do Dia */}
                <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock size={20} className="text-orange-600" />
                                Vendas por Hora
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Desempenho ao longo do dia</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(() => {
                            const currentHour = new Date().getHours();
                            const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
                                const hourOrders = orders.filter(o => {
                                    const orderDate = new Date(o.date);
                                    const today = new Date();
                                    return orderDate.getDate() === today.getDate() &&
                                        orderDate.getMonth() === today.getMonth() &&
                                        orderDate.getFullYear() === today.getFullYear() &&
                                        orderDate.getHours() === hour &&
                                        o.status !== 'canceled';
                                });
                                const revenue = hourOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                                return { hour, revenue, count: hourOrders.length };
                            });

                            const maxHourlyRevenue = Math.max(...hourlyStats.map(h => h.revenue), 1);

                            // Mostrar apenas as últimas 12 horas + próximas 4
                            const relevantHours = hourlyStats.slice(Math.max(0, currentHour - 8), currentHour + 4);

                            return relevantHours.map((stat, idx) => {
                                const isPast = stat.hour < currentHour;
                                const isCurrent = stat.hour === currentHour;
                                const widthPercent = (stat.revenue / maxHourlyRevenue) * 100;

                                return (
                                    <div key={stat.hour} className={`flex items-center gap-3 group ${isCurrent ? 'bg-orange-50 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
                                        <span className={`text-xs font-mono w-12 ${isCurrent ? 'font-bold text-orange-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {String(stat.hour).padStart(2, '0')}:00
                                        </span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isCurrent ? 'bg-orange-600' :
                                                    isPast ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                                        'bg-gray-300'
                                                    }`}
                                                style={{ width: `${widthPercent}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold w-20 text-right ${isCurrent ? 'text-orange-600' : 'text-gray-700'}`}>
                                            {stat.revenue > 0 ? formatCurrency(stat.revenue) : '-'}
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Cards de Sugestões IA */}
                <div className="lg:col-span-3 flex flex-col gap-3">
                    {actionSuggestions.length > 0 ? (
                        actionSuggestions.map((action, idx) => (
                            <div key={idx} className={`flex-1 p-4 rounded-xl border flex gap-3 animate-slide-up hover:shadow-md transition-shadow ${action.color}`}>
                                <div className="mt-1 flex-shrink-0">
                                    <action.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{action.title}</h4>
                                    <p className="text-xs mt-1 opacity-90 leading-relaxed">{action.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 rounded-2xl flex items-center justify-center mb-3">
                                <CheckCircle size={32} strokeWidth={2.5} />
                            </div>
                            <p className="text-sm font-bold text-gray-800 mb-1">Tudo sob controle!</p>
                            <p className="text-xs text-gray-500">Continue vendendo assim 🚀</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- KPI CARDS GERAIS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Faturamento Semanal */}
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                            <DollarSign size={22} />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${trends.revGrowth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {trends.revGrowth >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                            {Math.abs(trends.revGrowth).toFixed(0)}%
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500">Vendas (7 dias)</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(trends.currentRev)}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">vs. {formatCurrency(trends.prevRev)} semana anterior</p>
                    </div>
                </div>

                {/* Lucro Estimado */}
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-10 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Award size={22} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500">Lucro Bruto (Total)</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.profit)}</h3>
                        <p className="text-xs text-indigo-500 mt-1 font-semibold">Margem Global: {financialData.margin.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Meta Mensal */}
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1"><Target size={14} /> Meta Mensal</p>
                            <span className="text-xs font-bold text-gray-900">{goalProgress.toFixed(0)}%</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{formatCurrency(currentMonthRevenue)}</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${goalProgress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Meta: {formatCurrency(monthlyGoal)}</p>
                </div>

                {/* Ticket Médio */}
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                            <Activity size={22} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(ordersCount ? totalRevenue / ordersCount : 0)}</h3>
                    </div>
                </div>
            </div>

            {/* --- GRID PRINCIPAL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Esquerda (2/3) - Gráficos Principais */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Gráfico Vendas */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-gray-400" />
                                Desempenho Semanal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between gap-3 h-64 pt-6">
                                {weeklySalesData.map((data, i) => {
                                    const heightPercent = maxSalesValue > 0 ? (data.value / maxSalesValue) * 100 : 0;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end gap-2 group h-full relative cursor-pointer">
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 whitespace-nowrap shadow-xl">
                                                <p className="font-bold">{formatCurrency(data.value)}</p>
                                                <p className="text-[10px] text-gray-400">{data.count} pedidos</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                                <div
                                                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                                    className={`w-full rounded-t-lg transition-all duration-700 ease-out relative ${data.value > 0 ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 'bg-gray-200'}`}
                                                ></div>
                                            </div>
                                            <span className="text-center text-xs text-gray-400 font-semibold uppercase">{data.day}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Clientes (VIP) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown size={20} className="text-gray-400" />
                                Top Clientes VIP
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                        <tr>
                                            <th className="px-4 py-3">Cliente</th>
                                            <th className="px-4 py-3">Total Gasto (LTV)</th>
                                            <th className="px-4 py-3 text-right">Última Compra</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {topCustomers.length === 0 ? (
                                            <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">Sem dados de clientes</td></tr>
                                        ) : (
                                            topCustomers.map((c, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                                                            {i + 1}
                                                        </div>
                                                        {c.name}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-gray-700">{formatCurrency(c.totalSpent)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-500">
                                                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Direita (1/3) - Widgets e IA */}
                <div className="space-y-6">

                    {/* IA - Auditoria de Preços */}
                    <Card className="border-l-4 border-l-purple-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 bg-purple-50 rounded-bl-full -mr-5 -mt-5 opacity-50"></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-purple-700">
                                <Zap size={20} className="fill-purple-600 text-purple-600" />
                                Oportunidades de Lucro
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pricingOpportunities.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500 mb-2">A IA detectou produtos com preço abaixo da margem ideal:</p>
                                    {pricingOpportunities.map((opp, i) => (
                                        <div key={i} className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-sm text-gray-800">{opp.name}</span>
                                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">-{formatCurrency(opp.diff)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 text-xs">
                                                <span className="text-gray-500">Atual: {formatCurrency(opp.current)}</span>
                                                <span className="text-purple-700 font-bold flex items-center gap-1">
                                                    Ideal: {formatCurrency(opp.ideal)} <ArrowUpRight size={10} />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Award size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Tudo Certo!</p>
                                    <p className="text-xs text-gray-500">Seus preços estão excelentes.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mapa de Calor */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" />
                                Horários de Pico
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-12 gap-1 h-24">
                                {busyHours.map((h, i) => {
                                    let bgClass = 'bg-gray-50';
                                    if (h.intensity > 0.8) bgClass = 'bg-orange-600';
                                    else if (h.intensity > 0.6) bgClass = 'bg-orange-400';
                                    else if (h.intensity > 0.3) bgClass = 'bg-orange-200';
                                    else if (h.intensity > 0) bgClass = 'bg-orange-100';

                                    const showLabel = i % 4 === 0;

                                    return (
                                        <div key={i} className="flex flex-col justify-end h-full gap-1 group relative">
                                            {h.count > 0 && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                                    {h.count} ped.
                                                </div>
                                            )}
                                            <div className={`w-full rounded-sm transition-all hover:opacity-80 ${bgClass}`} style={{ height: '100%' }}></div>
                                            {showLabel && <span className="text-[9px] text-gray-400 text-center">{i}h</span>}
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center">Intensidade de vendas (0h - 23h)</p>
                        </CardContent>
                    </Card>

                    {/* Análise Financeira Intuitiva */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <PieChart size={20} className="text-blue-600" />
                                Como Seu Dinheiro é Dividido
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">A cada R$ 100 que você vende, veja para onde vai o dinheiro:</p>
                        </CardHeader>
                        <CardContent>
                            {/* Visual da Pizza de R$ 100 */}
                            <div className="mb-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <DollarSign size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">A cada R$ 100,00 vendidos</p>
                                            <p className="text-xs text-gray-500">você recebe (em média):</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra Visual Única Dividida */}
                                <div className="relative h-12 rounded-xl overflow-hidden flex shadow-inner mb-4">
                                    {/* Custo (Vermelho) */}
                                    <div
                                        style={{ width: `${100 - financialData.margin}%` }}
                                        className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center relative group cursor-pointer"
                                        title="Custo dos Ingredientes"
                                    >
                                        <span className="text-white font-bold text-sm drop-shadow-md">
                                            R$ {((100 - financialData.margin)).toFixed(0)}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                            Gasto com ingredientes
                                        </div>
                                    </div>

                                    {/* Lucro (Verde) */}
                                    <div
                                        style={{ width: `${financialData.margin}%` }}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center relative group cursor-pointer"
                                        title="Sua margem de lucro"
                                    >
                                        <span className="text-white font-bold text-sm drop-shadow-md">
                                            R$ {(financialData.margin).toFixed(0)}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                            Sobra para você (lucro)
                                        </div>
                                    </div>
                                </div>

                                {/* Legenda detalhada */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Custo */}
                                    <div className="bg-white rounded-lg p-3 border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-xs font-semibold text-red-700 uppercase">Custo CMV</span>
                                        </div>
                                        <p className="text-2xl font-bold text-red-600 mb-1">
                                            {formatCurrency((100 - financialData.margin))}
                                        </p>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            Vai para pagar os ingredientes e matéria-prima
                                        </p>
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold">{(100 - financialData.margin).toFixed(1)}%</span> do faturamento
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lucro */}
                                    <div className="bg-white rounded-lg p-3 border border-green-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-xs font-semibold text-green-700 uppercase">Margem Bruta</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600 mb-1">
                                            {formatCurrency(financialData.margin)}
                                        </p>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            Sobra para pagar custos fixos e ter lucro
                                        </p>
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold">{financialData.margin.toFixed(1)}%</span> do faturamento
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Geral */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700">Faturamento Total</span>
                                    <span className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">💰 Lucro Bruto Real:</span>
                                        <span className="font-bold text-green-600">{formatCurrency(financialData.profit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">📊 Custo Total Real:</span>
                                        <span className="font-bold text-red-600">{formatCurrency(financialData.cost)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dica de Otimização */}
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-blue-800">
                                        <p className="font-semibold mb-1">💡 Dica:</p>
                                        <p className="leading-relaxed">
                                            {financialData.margin < 60
                                                ? "Sua margem está baixa. Considere aumentar preços ou reduzir porções para melhorar a lucratividade."
                                                : financialData.margin >= 70
                                                    ? "Excelente! Sua margem está saudável. Continue assim!"
                                                    : "Margem boa! Sempre revise seus preços para acompanhar custos."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </div>
            </div>
        </div>
    );
};
import { CheckCircle } from 'lucide-react';

export default Dashboard;
