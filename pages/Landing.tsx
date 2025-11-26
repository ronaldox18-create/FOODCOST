
import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight, Star } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600">
            <ChefHat size={32} />
            <span className="text-xl font-bold">FoodCost Pro</span>
          </div>
          <div className="flex gap-4">
            <Link to="/auth" className="text-gray-600 font-medium hover:text-orange-600 py-2">Login</Link>
            <Link to="/auth" className="bg-orange-600 text-white px-5 py-2 rounded-full font-bold hover:bg-orange-700 transition shadow-lg">
              Teste Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full font-bold text-sm mb-6">
            <Star size={14} className="fill-orange-600" /> +1.500 Restaurantes já usam
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Pare de perder dinheiro no <span className="text-orange-600">seu cardápio.</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            A única ferramenta que calcula seu CMV real, sugere o preço ideal e te avisa quando o lucro está baixo. Simples, rápido e com IA.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" className="bg-orange-600 text-white text-lg px-8 py-4 rounded-full font-bold hover:bg-orange-700 transition shadow-xl flex items-center justify-center gap-2">
              Começar Grátis Agora <ArrowRight />
            </Link>
            <a href="#pricing" className="bg-gray-100 text-gray-700 text-lg px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition">
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Você comete esses erros?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Precificação no "Chutômetro"</h3>
              <p className="text-gray-500">"Meu concorrente cobra 30, vou cobrar 28". Esse é o caminho mais rápido para a falência.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Ignorar o Desperdício</h3>
              <p className="text-gray-500">1kg de batata não rende 1kg no prato. Se você não calcula a perda (Yield), seu lucro é ilusão.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Misturar as Contas</h3>
              <p className="text-gray-500">Vender muito e não ver a cor do dinheiro? É porque seus custos fixos estão comendo seu lucro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl font-bold">Tudo que você precisa para lucrar de verdade.</h2>
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg">Ficha Técnica Automática</h4>
                  <p className="text-gray-500">Monte o prato e o sistema calcula o custo centavo por centavo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg">Consultor IA</h4>
                  <p className="text-gray-500">Nossa IA analisa seu cardápio e diz: "Aumente R$ 2,00 nesse burger".</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg">Gestão de Clientes (CRM)</h4>
                  <p className="text-gray-500">Saiba quem são seus VIPs e mande ofertas automáticas no WhatsApp.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gray-900 rounded-2xl p-8 text-white shadow-2xl transform rotate-1 hover:rotate-0 transition duration-500">
               <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
                  <TrendingUp className="text-green-400" />
                  <span className="font-bold">Painel de Lucro em Tempo Real</span>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span>Faturamento Hoje</span>
                     <span className="text-2xl font-bold text-green-400">R$ 1.250,00</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[75%]"></div>
                  </div>
                  <div className="pt-4 text-sm text-gray-400">
                     "Parabéns! Sua margem média subiu para 22% após o ajuste de preços."
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Planos que cabem no seu bolso</h2>
          <p className="text-gray-400 mb-12">Cancele quando quiser. Sem fidelidade.</p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {/* Free */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition">
              <h3 className="text-xl font-bold mb-2">Iniciante</h3>
              <p className="text-4xl font-bold mb-6">Grátis</p>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex gap-2"><CheckCircle2 size={18} /> Até 5 produtos</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> Cálculo de CMV Simples</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> 1 Usuário</li>
              </ul>
              <Link to="/auth" className="block w-full text-center bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600">
                Criar Conta
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-orange-600 p-8 rounded-2xl border border-orange-500 shadow-2xl relative transform scale-105">
              <div className="absolute top-0 right-0 bg-yellow-400 text-orange-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                MAIS POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Profissional</h3>
              <p className="text-4xl font-bold mb-6">R$ 49<span className="text-xl font-normal">/mês</span></p>
              <ul className="space-y-3 mb-8 text-white">
                <li className="flex gap-2"><CheckCircle2 size={18} /> Produtos Ilimitados</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> Consultor IA Ilimitado</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> Gestão de Estoque</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> CRM de Clientes</li>
              </ul>
              <Link to="/auth" className="block w-full text-center bg-white text-orange-600 py-3 rounded-xl font-bold hover:bg-gray-100">
                Assinar Agora
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition">
              <h3 className="text-xl font-bold mb-2">Franquias</h3>
              <p className="text-4xl font-bold mb-6">R$ 199<span className="text-xl font-normal">/mês</span></p>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex gap-2"><CheckCircle2 size={18} /> Multi-lojas</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> API de Integração</li>
                <li className="flex gap-2"><CheckCircle2 size={18} /> Suporte Dedicado</li>
              </ul>
              <button className="block w-full text-center bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600">
                Falar com Vendas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-gray-100 text-center text-gray-500 text-sm">
        <p>© 2024 FoodCost Pro. Feito para quem ama cozinhar e lucrar.</p>
      </footer>
    </div>
  );
};

export default Landing;
