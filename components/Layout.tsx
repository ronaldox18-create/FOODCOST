
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import Auth
import { useApp } from '../contexts/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBasket, ChefHat, Settings, Menu, Landmark, Users, ClipboardList, Boxes, Sparkles, LogOut, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, active, highlight }: { to: string, icon: any, label: string, active: boolean, highlight?: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-orange-600 text-white shadow-md' 
        : highlight 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:opacity-90'
            : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
    }`}
  >
    <Icon size={20} className={highlight ? "animate-pulse" : ""} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth(); // Auth hooks
  const { settings } = useApp();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-orange-600">
            <ChefHat size={32} />
            <h1 className="text-xl font-bold tracking-tight">FoodCost Pro</h1>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
             <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                {user?.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="font-bold text-gray-900 truncate">{user?.storeName || settings.businessName}</p>
                <p className="truncate">{user?.name}</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/advisor" icon={Sparkles} label="Consultor IA" active={location.pathname === '/advisor'} highlight={true} />

          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2 mb-1">Gestão</p>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <NavItem to="/orders" icon={ClipboardList} label="Pedidos (PDV)" active={location.pathname === '/orders'} />
          <NavItem to="/customers" icon={Users} label="Clientes (CRM)" active={location.pathname === '/customers'} />
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-1">Custos & Estoque</p>
          <NavItem to="/products" icon={Menu} label="Cardápio" active={location.pathname === '/products'} />
          <NavItem to="/inventory" icon={Boxes} label="Estoque" active={location.pathname === '/inventory'} />
          <NavItem to="/ingredients" icon={ShoppingBasket} label="Ingredientes" active={location.pathname === '/ingredients'} />
          <NavItem to="/expenses" icon={Landmark} label="Despesas Fixas" active={location.pathname === '/expenses'} />
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-1">Sistema</p>
          <NavItem to="/settings" icon={Settings} label="Configurações" active={location.pathname === '/settings'} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 text-orange-600">
            <ChefHat size={24} />
            <span className="font-bold">FoodCost Pro</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600">
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-[60px] left-0 w-full bg-white shadow-lg z-10 p-4 flex flex-col gap-2 md:hidden">
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    {user?.name.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">{user?.storeName}</p>
                </div>
            </div>

            <NavItem to="/advisor" icon={Sparkles} label="Consultor IA" active={location.pathname === '/advisor'} highlight={true} />
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
            <NavItem to="/orders" icon={ClipboardList} label="Pedidos" active={location.pathname === '/orders'} />
            <NavItem to="/customers" icon={Users} label="Clientes" active={location.pathname === '/customers'} />
            <div className="border-t border-gray-100 my-2"></div>
            <NavItem to="/products" icon={Menu} label="Cardápio" active={location.pathname === '/products'} />
            <NavItem to="/inventory" icon={Boxes} label="Estoque" active={location.pathname === '/inventory'} />
            <NavItem to="/ingredients" icon={ShoppingBasket} label="Ingredientes" active={location.pathname === '/ingredients'} />
            <NavItem to="/expenses" icon={Landmark} label="Despesas Fixas" active={location.pathname === '/expenses'} />
            <NavItem to="/settings" icon={Settings} label="Configurações" active={location.pathname === '/settings'} />
            <button 
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium mt-2"
            >
                <LogOut size={20} /> Sair
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
