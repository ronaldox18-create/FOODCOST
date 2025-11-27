import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../utils/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { User, Mail, Store, CreditCard, Shield, Download, CheckCircle, AlertTriangle, Save, Loader2, Lock } from 'lucide-react';

const Account: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings, products, ingredients, customers, fixedCosts } = useApp();

  // Estados para formulários
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Estados para senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      const metadataName = user.user_metadata?.name || '';
      setName(metadataName);
    }
    if (settings) {
      setBusinessName(settings.businessName || '');
    }
  }, [user, settings]);

  const getInitials = (email: string | undefined) => email ? email.substring(0, 2).toUpperCase() : 'US';

  // --- FUNÇÕES DE AÇÃO ---

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMsg(null);
    try {
      // 1. Atualizar metadata no Supabase (Nome)
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name }
      });
      if (authError) throw authError;

      // 2. Atualizar configurações locais (Nome do Negócio) - COM AWAIT!
      await updateSettings({
        ...settings,
        businessName: businessName
      });

      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro ao atualizar: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro ao alterar senha: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: name,
        businessName: businessName
      },
      data: {
        products,
        ingredients,
        customers,
        fixedCosts,
        settings
      }
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_foodcost_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMsg({ type: 'success', text: 'Backup baixado com sucesso!' });
  };

  // Dados simulados para o plano (Visual apenas)
  const planDetails = {
    name: 'Pro',
    status: 'active',
    renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('pt-BR'),
    price: 'R$ 49,90',
    features: ['Produtos ilimitados', 'Ingredientes ilimitados', 'Gestão de Clientes', 'Consultor IA']
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Minha Conta</h1>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg border flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Coluna da Esquerda - Resumo */}
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center border-t-4 border-orange-500">
            <CardContent className="pt-8 flex flex-col items-center text-center w-full">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center text-3xl font-bold shadow-md mb-4 ring-4 ring-white">
                {getInitials(user?.email)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{name || 'Usuário'}</h2>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
              <div className="py-1 px-3 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                Plano {planDetails.name}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" />
              Segurança
            </div>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Senha</span>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-orange-600 hover:text-orange-700 font-medium text-xs"
                  >
                    {isChangingPassword ? 'Cancelar' : 'Alterar'}
                  </button>
                </div>

                {isChangingPassword && (
                  <div className="bg-gray-50 p-3 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="text-xs text-gray-500">Nova Senha</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="******"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Confirmar Senha</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="******"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={loading}
                      className="w-full bg-gray-900 text-white text-xs py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
                <span className="text-gray-600">Autenticação 2FA</span>
                <span className="text-gray-400 text-xs">Em breve</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita - Detalhes Editáveis */}
        <div className="md:col-span-2 space-y-6">

          {/* Dados Pessoais e do Negócio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-gray-500" />
                Dados do Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nome Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                    <User size={18} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nome do Negócio</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                    <Store size={18} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">E-mail (Não editável)</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
                    <Mail size={18} className="text-gray-400" />
                    <span>{user?.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">ID do Usuário</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-400 text-sm font-mono truncate">
                    <span>{user?.id}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 font-medium"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Alterações
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Plano e Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-gray-500" />
                Plano e Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold">Plano {planDetails.name}</h3>
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Ativo</span>
                    </div>
                    <p className="text-gray-400 text-sm">Renovação: {planDetails.renewalDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{planDetails.price}<span className="text-sm text-gray-400 font-normal">/mês</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Dados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-indigo-500 cursor-pointer hover:bg-indigo-50/10 transition-colors" onClick={handleExportData}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Download size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900">Backup dos Dados</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Baixe um arquivo JSON com todos os seus produtos, ingredientes e clientes.</p>
                <span className="text-indigo-600 font-medium text-sm hover:underline">Clique para baixar</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-red-500 opacity-80 hover:opacity-100 transition-opacity">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900">Zona de Perigo</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Ações irreversíveis como excluir sua conta ou resetar dados do sistema.</p>
                <button className="text-red-600 font-medium text-sm hover:underline">Configurações Avançadas</button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Account;
