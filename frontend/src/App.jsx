import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Landing
import Landing from './components/Landing';

// Auth
import Login from './components/Login';
import Register from './components/Register';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import StoreForm from './components/admin/StoreForm';
import MenuManager from './components/admin/MenuManager';
import TableManager from './components/admin/TableManager';
import OrderManager from './components/admin/OrderManager';
import SalesStats from './components/admin/SalesStats';
import StaffManager from './components/admin/StaffManager';

// Customer
import Menu from './components/customer/Menu';
import MenuDemo from './components/customer/MenuDemo';

// Search
import StoreSearch from './components/StoreSearch';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 랜딩 페이지 */}
          <Route path="/" element={<Landing />} />

          {/* 매장 검색 */}
          <Route path="/stores" element={<StoreSearch />} />


          {/* 고객용 메뉴 페이지 */}
          <Route path="/menu/demo" element={<MenuDemo />} />
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
          <Route path="/admin/stores/:storeId/orders" element={<AdminLayout><OrderManager /></AdminLayout>} />
          <Route path="/admin/stores/:storeId/stats" element={<AdminLayout><SalesStats /></AdminLayout>} />
          <Route path="/admin/stores/:storeId/staff" element={<AdminLayout><StaffManager /></AdminLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
