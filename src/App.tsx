import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Products from './pages/Products';
import Sales from './pages/Sales';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            {/* Placeholder routes for other links to avoid 404s immediately */}
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="quotations" element={<div className="text-gray-900 dark:text-white p-6 font-black uppercase tracking-[0.2em] italic opacity-50">Quotations (Coming Soon)</div>} />
            <Route path="reports" element={<div className="text-gray-900 dark:text-white p-6 font-black uppercase tracking-[0.2em] italic opacity-50">Reports (Coming Soon)</div>} />
            <Route path="settings" element={<div className="text-gray-900 dark:text-white p-6 font-black uppercase tracking-[0.2em] italic opacity-50">Settings (Coming Soon)</div>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
  );
}

export default App;
