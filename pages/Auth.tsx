import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat, ArrowRight, Lock, Mail, User, Store, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (isLogin) {
            const { success, error } = await login(email, password);
            if (!success) {
                setError(error || 'Erro ao fazer login. Verifique suas credenciais.');
            } else {
                navigate('/');
            }
        } else {
            if (!name || !storeName || !email || !password) {
                setError('Preencha todos os campos.');
                setIsLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                setIsLoading(false);
                return;
            }

            const { success, error } = await register(name, email, password, storeName);
            if (!success) {
                setError(error || 'Erro ao criar conta.');
            } else {
                // Auto login happens inside AuthContext usually, but session needs to be established
                // If email confirmation is off, user is logged in.
                navigate('/');
            }
        }
    } catch (err) {
        setError('Ocorreu um erro inesperado.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
        <Link to="/landing" className="flex items-center justify-center gap-2 text-orange-600 mb-2">
          <ChefHat size={40} />
          <span className="text-3xl font-bold tracking-tight">FoodCost Pro</span>
        </Link>
        <p className="text-gray-500">A plataforma de gestão para quem vive de comida.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isLogin ? 'Acessar sua Conta' : 'Criar Conta Grátis'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Restaurante</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Ex: Burger King da Esquina"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isLoading ? <Loader className="animate-spin" /> : (
                  <>
                    {isLogin ? 'Entrar no Sistema' : 'Começar Agora'} <ArrowRight size={20} />
                  </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); }}
              className="ml-1 text-orange-600 font-bold hover:underline"
            >
              {isLogin ? 'Cadastre-se grátis' : 'Fazer Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;