import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Products from './pages/Products';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            {/* Placeholder routes for other links to avoid 404s immediately */}
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<div className="text-white p-6">Sales Page (Coming Soon)</div>} />
            <Route path="quotations" element={<div className="text-white p-6">Quotations Page (Coming Soon)</div>} />
            <Route path="reports" element={<div className="text-white p-6">Reports Page (Coming Soon)</div>} />
            <Route path="settings" element={<div className="text-white p-6">Settings Page (Coming Soon)</div>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
