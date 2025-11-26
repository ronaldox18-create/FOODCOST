
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { calculateProductMetrics, formatCurrency } from '../utils/calculations';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Bot, User, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const Advisor: React.FC = () => {
  const { products, ingredients, fixedCosts, settings, orders, customers } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá! Sou seu Consultor Gastronômico Inteligente. Analisei seu cardápio, vendas e custos. Como posso ajudar a melhorar seu lucro hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateContextData = () => {
    // 1. Product Metrics
    const productAnalysis = products.map(p => {
        const metrics = calculateProductMetrics(p, ingredients, fixedCosts, settings);
        
        // Sales Count (Simple logic based on existing orders)
        const salesCount = orders.reduce((acc, order) => {
            const item = order.items.find(i => i.productId === p.id);
            return acc + (item ? item.quantity : 0);
        }, 0);

        return {
            name: p.name,
            category: p.category,
            currentPrice: metrics.currentPrice,
            cost: metrics.totalCost,
            marginPercent: metrics.currentMargin,
            profitValue: metrics.currentPrice - metrics.totalCost,
            suggestedPrice: metrics.suggestedPrice,
            salesCount: salesCount
        };
    });

    // 2. Ingredient Alerts
    const criticalStock = ingredients
        .filter(i => (i.currentStock || 0) <= (i.minStock || 0))
        .map(i => ({ name: i.name, stock: i.currentStock, min: i.minStock }));

    // 3. Financial Summary
    const totalSales = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalOrders = orders.length;

    return JSON.stringify({
        businessName: settings.businessName,
        targetMargin: settings.targetMargin,
        menuAnalysis: productAnalysis,
        stockAlerts: criticalStock,
        salesSummary: { totalSales, totalOrders, ticketAvg: totalOrders > 0 ? totalSales/totalOrders : 0 },
        customersSample: customers.slice(0, 5).map(c => ({ name: c.name, totalSpent: c.totalSpent, lastOrder: c.lastOrderDate }))
    });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const contextData = generateContextData();
        
        const systemPrompt = `
        Você é um consultor especialista em gestão de restaurantes e engenharia de cardápio.
        Você tem acesso aos dados JSON reais do restaurante do usuário abaixo.
        
        DADOS DO NEGÓCIO:
        ${contextData}

        SUA MISSÃO:
        1. Responda de forma concisa, direta e muito prática.
        2. Use formatação Markdown (negrito, listas) para facilitar a leitura.
        3. Foco TOTAL em aumentar lucro e reduzir desperdício.
        4. Se o usuário pedir para escrever mensagens de marketing, escreva o texto pronto para copiar e colar.
        5. Analise os dados fornecidos para identificar "Pratos Estrela" (alto lucro/alta venda) e "Pratos Cão" (baixo lucro/baixa venda).

        Exemplo de resposta boa: "Seu X-Bacon tem margem negativa (-2%). Aumente o preço para R$ 34,00 ou reduza 20g de bacon."
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\nPergunta do usuário: " + text }] }
            ]
        });

        const aiMsg: Message = {
            id: crypto.randomUUID(),
            role: 'model',
            content: response.text || "Desculpe, não consegui analisar isso agora.",
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
        console.error("AI Error:", error);
        const errorMsg: Message = {
            id: crypto.randomUUID(),
            role: 'model',
            content: "Ops! Tive um problema ao conectar com minha inteligência. Verifique sua chave de API ou tente novamente.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
      handleSend(action);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto">
      <div className="flex-none mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-purple-600" /> Consultor IA
        </h2>
        <p className="text-gray-500">Inteligência artificial analisando seus custos e vendas em tempo real.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-purple-600 text-white shadow-md'
                      }`}>
                          {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-white text-gray-800 border border-gray-100 rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-purple-100 rounded-tl-none'
                      }`}>
                          {msg.role === 'model' ? (
                              <ReactMarkdown 
                                components={{
                                    strong: ({node, ...props}) => <span className="font-bold text-purple-900" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                    li: ({node, ...props}) => <li className="text-gray-700" {...props} />
                                }}
                              >
                                  {msg.content}
                              </ReactMarkdown>
                          ) : (
                              msg.content
                          )}
                          <div className="text-[10px] text-gray-400 mt-2 text-right">
                              {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                      </div>
                  </div>
              ))}
              {isLoading && (
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center animate-pulse">
                          <Bot size={20} />
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-gray-500 text-sm">
                          Analisando seus dados...
                      </div>
                  </div>
              )}
          </div>

          {/* Quick Actions & Input */}
          <div className="p-4 bg-white border-t border-gray-100">
              {messages.length < 3 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                      <button 
                        onClick={() => handleQuickAction("Analise meu cardápio: quais pratos dão prejuízo?")}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100 hover:bg-red-100 transition whitespace-nowrap"
                      >
                          <AlertTriangle size={14} /> Quais pratos dão prejuízo?
                      </button>
                      <button 
                        onClick={() => handleQuickAction("Crie uma promoção de WhatsApp para clientes sumidos.")}
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 hover:bg-green-100 transition whitespace-nowrap"
                      >
                          <Lightbulb size={14} /> Ideia de Promoção
                      </button>
                      <button 
                        onClick={() => handleQuickAction("Como posso aumentar minha margem de lucro geral?")}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 hover:bg-blue-100 transition whitespace-nowrap"
                      >
                          <TrendingUp size={14} /> Melhorar Lucro
                      </button>
                  </div>
              )}

              <div className="relative flex items-center gap-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder="Pergunte ao Chef IA... (Ex: Qual meu produto mais rentável?)"
                    className="flex-1 p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={() => handleSend(input)}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
                  >
                      <Send size={20} />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Advisor;
