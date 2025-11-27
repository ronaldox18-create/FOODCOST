import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

const Auth: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Erro no login:", err);
      if (err.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha inválidos. Verifique e tente novamente.');
      } else {
        setError('Falha no login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Removido o <Layout> e substituído por uma div que centraliza o conteúdo
    <div className="bg-gray-50 flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
            <Link to="/" className="flex justify-center items-center gap-2 text-orange-600 mb-4">
                <ChefHat size={32} />
                <h1 className="text-2xl font-bold tracking-tight">FoodCost Pro</h1>
            </Link>
          <h2 className="text-xl text-gray-700">Acesse sua conta para continuar</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500">
            Não tem uma conta?{' '}
            <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                Cadastre-se grátis
            </a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
