import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';

// 로딩 컴포넌트
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

// Landing (즉시 로드)
import Landing from './components/Landing';

// Auth (즉시 로드 - 작은 컴포넌트)
import Login from './components/Login';
import Register from './components/Register';

// Admin - Lazy Loading
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./components/admin/Dashboard'));
const StoreForm = lazy(() => import('./components/admin/StoreForm'));
const MenuManager = lazy(() => import('./components/admin/MenuManager'));
const TableManager = lazy(() => import('./components/admin/TableManager'));
const OrderManager = lazy(() => import('./components/admin/OrderManager'));
const SalesStats = lazy(() => import('./components/admin/SalesStats'));
const StaffManager = lazy(() => import('./components/admin/StaffManager'));
const AnalyticsDashboard = lazy(() => import('./components/admin/AnalyticsDashboard'));

// Kitchen - Lazy Loading
const KitchenDisplay = lazy(() => import('./components/kitchen/KitchenDisplay'));

// Customer - Lazy Loading
const Menu = lazy(() => import('./components/customer/Menu'));
const MenuDemo = lazy(() => import('./components/customer/MenuDemo'));

// Search - Lazy Loading
const StoreSearch = lazy(() => import('./components/StoreSearch'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
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
            <Route path="/admin/stores/:storeId/analytics" element={<AdminLayout><AnalyticsDashboard /></AdminLayout>} />

            {/* 주방 페이지 */}
            <Route path="/kitchen/:storeId" element={<KitchenDisplay />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
