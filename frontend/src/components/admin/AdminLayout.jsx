import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, LogOut, LayoutDashboard, Menu, Settings } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="mb-4">로그인이 필요합니다</p>
          <Link to="/login" className="text-blue-600 hover:underline">로그인하기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                <Store size={24} />
                위마켓 관리자
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.name}님</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
