import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storesAPI, ordersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Store, ShoppingBag, DollarSign, Clock, Plus, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchStoreData(selectedStore.id);
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const res = await storesAPI.getMy();
      setStores(res.data);
      if (res.data.length > 0) {
        setSelectedStore(res.data[0]);
      }
    } catch (error) {
      console.error('매장 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreData = async (storeId) => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        ordersAPI.getStats(storeId),
        ordersAPI.getByStore(storeId),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">로그인이 필요합니다.</p>
        <Link to="/login" className="text-blue-600 hover:underline">로그인하기</Link>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="mx-auto text-gray-400 mb-4" size={64} />
        <h2 className="text-xl font-bold mb-2">등록된 매장이 없습니다</h2>
        <p className="text-gray-500 mb-6">첫 번째 매장을 등록하고 시작하세요!</p>
        <Link
          to="/admin/stores/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          매장 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <select
          value={selectedStore?.id || ''}
          onChange={(e) => {
            const store = stores.find((s) => s.id === parseInt(e.target.value));
            setSelectedStore(store);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingBag className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">오늘 주문</p>
              <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">오늘 매출</p>
              <p className="text-2xl font-bold">{formatPrice(stats?.total_sales || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">대기 중</p>
              <p className="text-2xl font-bold">{stats?.by_status?.pending || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Store className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">조리 중</p>
              <p className="text-2xl font-bold">{stats?.by_status?.preparing || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 퀵 메뉴 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link
          to={'/admin/stores/' + selectedStore?.id + '/menu'}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-medium">메뉴 관리</span>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
        <Link
          to={'/admin/stores/' + selectedStore?.id + '/tables'}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-medium">테이블 관리</span>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
        <Link
          to={'/admin/stores/' + selectedStore?.id + '/orders'}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-medium">주문 관리</span>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
        <Link
          to={'/admin/stores/' + selectedStore?.id + '/settings'}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-medium">매장 설정</span>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
      </div>

      {/* 최근 주문 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold">최근 주문</h2>
          <Link
            to={'/admin/stores/' + selectedStore?.id + '/orders'}
            className="text-blue-600 text-sm hover:underline"
          >
            전체 보기
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">주문이 없습니다</div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {order.table_name || '포장'} · {formatPrice(order.total_amount)}
                  </p>
                </div>
                <span
                  className={
                    'px-2 py-1 text-xs rounded-full ' +
                    (order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'preparing'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800')
                  }
                >
                  {order.status === 'pending'
                    ? '대기'
                    : order.status === 'confirmed'
                    ? '확인'
                    : order.status === 'preparing'
                    ? '조리중'
                    : order.status === 'ready'
                    ? '완료'
                    : order.status === 'completed'
                    ? '수령'
                    : '취소'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
