import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { askAI } from '../utils/aiHelper'; 
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const Advisor: React.FC = () => {
  const { products, ingredients, fixedCosts, settings } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: `Olá! Sou seu Consultor Financeiro de Restaurantes (IA). 
    
Posso analisar seu cardápio, custos e sugerir melhorias. Como posso ajudar hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Prepara o contexto do restaurante para a IA
      const context = `
        ATUE COMO UM CONSULTOR FINANCEIRO SÊNIOR ESPECIALIZADO EM RESTAURANTES.
        DADOS DO MEU RESTAURANTE:
        - Nome: ${settings.businessName}
        - Margem Alvo: ${settings.targetMargin}%
        - Produtos: ${JSON.stringify(products.map(p => ({ nome: p.name, preço: p.currentPrice })))}
        - Ingredientes Principais (com estoque baixo): ${JSON.stringify(ingredients.filter(i => (i.currentStock || 0) < (i.minStock || 0)).map(i => i.name))}
        - Despesas Fixas Totais: R$ ${fixedCosts.reduce((acc, e) => acc + e.amount, 0).toFixed(2)}
        
        PERGUNTA DO USUÁRIO: "${userMessage}"
        
        Responda com formatação Markdown (negrito, listas), seja direto, prático e foque no lucro.
      `;

      const response = await askAI(context);
      
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Desculpe, tive um problema ao processar sua solicitação. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-gray-800">Consultor IA</h2>
                    <p className="text-xs text-gray-500">Especialista em Food Cost</p>
                </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 font-medium">
                Powered by Gemini 1.5
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user' 
                        ? 'bg-orange-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                    {msg.role === 'ai' ? (
                        <div className="markdown-content">
                            <ReactMarkdown 
                                components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-indigo-700" {...props} />,
                                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        msg.content
                    )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-indigo-600" />
                        <span className="text-sm text-gray-500">Analisando dados...</span>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Como posso reduzir o custo do X-Burger?"
              className="flex-1 pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
              disabled={loading}
            />
            <button 
                onClick={handleSend} 
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
    </div>
  );
};

export default Advisor;
