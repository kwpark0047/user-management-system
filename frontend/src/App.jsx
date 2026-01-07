import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth
import Login from './components/Login';
import Register from './components/Register';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import StoreForm from './components/admin/StoreForm';
import MenuManager from './components/admin/MenuManager';
import TableManager from './components/admin/TableManager';

// Customer
import Menu from './components/customer/Menu';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 고객용 메뉴 페이지 (QR 스캔) */}
          <Route path="/menu/:qrCode" element={<Menu />} />
          <Route path="/menu" element={<Menu />} />

          {/* 인증 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 관리자 페이지 */}
          <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/stores/new" element={<AdminLayout><StoreForm /></AdminLayout>} />
          <Route path="/admin/stores/:id/settings" element={<AdminLayout><StoreForm /></AdminLayout>} />
          <Route path="/admin/stores/:storeId/menu" element={<AdminLayout><MenuManager /></AdminLayout>} />
          <Route path="/admin/stores/:storeId/tables" element={<AdminLayout><TableManager /></AdminLayout>} />

          {/* 기본 경로 -> 관리자 대시보드 */}
          <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
