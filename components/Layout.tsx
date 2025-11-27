
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBasket, ChefHat, Settings, Menu, Landmark, Users, ClipboardList, Boxes, Sparkles, LogOut, User as UserIcon, LayoutGrid } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, active, highlight }: { to: string, icon: any, label: string, active: boolean, highlight?: boolean }) => (
  <Link
    to={to}
    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out ${
      active 
        ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 font-medium' 
        : highlight 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-200 hover:opacity-90 font-medium'
            : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
    }`}
  >
    <Icon size={20} className={`transition-transform duration-200 ${active || highlight ? '' : 'group-hover:scale-110'} ${highlight ? "animate-pulse" : ""}`} />
    <span className="text-sm">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { settings } = useApp();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const getInitials = (email: string | undefined) => email ? email.substring(0, 2).toUpperCase() : 'FC';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 text-orange-600 mb-8">
            <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat size={28} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">FoodCost Pro</h1>
          </div>

          <Link to="/account" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors group">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                {getInitials(user?.email)}
             </div>
             <div className="overflow-hidden">
                <p className="font-semibold text-gray-900 text-sm truncate">{settings.businessName || 'Meu Restaurante'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
             </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4">
          <NavItem to="/advisor" icon={Sparkles} label="Consultor IA" active={location.pathname === '/advisor'} highlight={true} />

          <div className="pt-6 pb-2 px-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gestão</p>
          </div>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
          <NavItem to="/tables" icon={LayoutGrid} label="Mesas (Salão)" active={location.pathname === '/tables'} />
          <NavItem to="/orders" icon={ClipboardList} label="Pedidos (PDV)" active={location.pathname === '/orders'} />
          <NavItem to="/customers" icon={Users} label="Clientes (CRM)" active={location.pathname === '/customers'} />
          
          <div className="pt-6 pb-2 px-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custos & Estoque</p>
          </div>
          <NavItem to="/products" icon={Menu} label="Cardápio" active={location.pathname === '/products'} />
          <NavItem to="/inventory" icon={Boxes} label="Estoque" active={location.pathname === '/inventory'} />
          <NavItem to="/ingredients" icon={ShoppingBasket} label="Ingredientes" active={location.pathname === '/ingredients'} />
          <NavItem to="/expenses" icon={Landmark} label="Despesas Fixas" active={location.pathname === '/expenses'} />
          
          <div className="pt-6 pb-2 px-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sistema</p>
          </div>
          <NavItem to="/account" icon={UserIcon} label="Minha Conta" active={location.pathname === '/account'} />
          <NavItem to="/settings" icon={Settings} label="Configurações" active={location.pathname === '/settings'} />
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-50">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600">
            <ChefHat size={24} />
            <span className="font-bold text-gray-900">FoodCost Pro</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col md:hidden animate-in slide-in-from-top-10 duration-200">
             <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><LogOut size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
                <NavItem to="/tables" icon={LayoutGrid} label="Mesas" active={location.pathname === '/tables'} />
                <NavItem to="/orders" icon={ClipboardList} label="Pedidos" active={location.pathname === '/orders'} />
                <NavItem to="/customers" icon={Users} label="Clientes" active={location.pathname === '/customers'} />
                <NavItem to="/products" icon={Menu} label="Cardápio" active={location.pathname === '/products'} />
                <NavItem to="/inventory" icon={Boxes} label="Estoque" active={location.pathname === '/inventory'} />
                <NavItem to="/ingredients" icon={ShoppingBasket} label="Ingredientes" active={location.pathname === '/ingredients'} />
                <NavItem to="/expenses" icon={Landmark} label="Despesas" active={location.pathname === '/expenses'} />
                <NavItem to="/account" icon={UserIcon} label="Minha Conta" active={location.pathname === '/account'} />
                <NavItem to="/settings" icon={Settings} label="Configurações" active={location.pathname === '/settings'} />
                <button onClick={signOut} className="w-full text-left p-4 text-red-600 font-medium">Sair</button>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
