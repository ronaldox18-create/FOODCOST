import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Ingredients from './pages/Ingredients';
import Products from './pages/Products';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Advisor from './pages/Advisor';
import Landing from './pages/Landing';
import Auth from './pages/Auth';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // If authenticated, render the children wrapped in AppProvider (so data loads with user ID)
  return (
    <AppProvider>
        <Layout>
            {children}
        </Layout>
    </AppProvider>
  );
};

// Main Router logic isolated
const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/landing" element={!isAuthenticated ? <Landing /> : <Navigate to="/" />} />
            <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} />

            {/* Private Routes (Wrapped in ProtectedRoute) */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/advisor" element={<ProtectedRoute><Advisor /></ProtectedRoute>} />
            <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/landing"} replace />} />
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
          <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;