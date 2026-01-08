import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsAPI, storesAPI, staffAPI } from '../../api';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Award, Clock, BarChart3 } from 'lucide-react';

const AnalyticsDashboard = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState('30');
  const [salesData, setSalesData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [products, setProducts] = useState(null);
  const [staffStats, setStaffStats] = useState(null);
  const [productSort, setProductSort] = useState('quantity');

  useEffect(() => {
    fetchInitialData();
  }, [storeId]);

  useEffect(() => {
    if (myRole === 'owner') {
      fetchAnalytics();
    }
  }, [period, dateRange, productSort, myRole]);

  const fetchInitialData = async () => {
    try {
      const [storeRes, roleRes] = await Promise.all([
        storesAPI.getById(storeId),
        staffAPI.getMyRole(storeId)
      ]);
      setStore(storeRes.data);
      setMyRole(roleRes.data.role);
      if (roleRes.data.role !== 'owner') {
        navigate('/admin');
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [salesRes, compRes, prodRes, staffRes] = await Promise.all([
        analyticsAPI.getSales(storeId, period, startDate, endDate),
        analyticsAPI.getComparison(storeId, period === 'monthly' ? 'monthly' : 'weekly'),
        analyticsAPI.getProducts(storeId, startDate, endDate, 10, productSort),
        analyticsAPI.getStaff(storeId, startDate, endDate)
      ]);

      setSalesData(salesRes.data);
      setComparison(compRes.data);
      setProducts(prodRes.data);
      setStaffStats(staffRes.data);
    } catch (error) {
      console.error('분석 데이터 로딩 실패:', error);
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return (price / 10000000).toFixed(1) + '천만';
    } else if (price >= 10000) {
      return (price / 10000).toFixed(0) + '만';
    }
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatFullPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (myRole !== 'owner') {
    return (
      <div className="text-center py-12">
        <p className="text-navy-500">분석 대시보드는 대표만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const maxSales = salesData?.data ? Math.max(...salesData.data.map(d => d.sales), 1) : 1;

  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">분석 대시보드</h1>
            <p className="text-gray-500">{store?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </select>

          {/* 분석 단위 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  period === p ? 'bg-white shadow text-primary-600' : 'text-gray-600'
                }`}
              >
                {p === 'daily' ? '일별' : p === 'weekly' ? '주별' : '월별'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">총 매출</span>
          </div>
          <p className="text-2xl font-bold">{formatPrice(salesData?.summary?.total_sales || 0)}원</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">총 주문</span>
          </div>
          <p className="text-2xl font-bold">{salesData?.summary?.total_orders || 0}건</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${comparison?.growth?.sales >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {comparison?.growth?.sales >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <span className="text-sm text-gray-500">전기간 대비</span>
          </div>
          <p className={`text-2xl font-bold ${comparison?.growth?.sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {comparison?.growth?.sales >= 0 ? '+' : ''}{comparison?.growth?.sales || 0}%
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-full">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">평균 주문금액</span>
          </div>
          <p className="text-2xl font-bold">{formatPrice(salesData?.summary?.avg_order_amount || 0)}원</p>
        </div>
      </div>

      {/* 매출 차트 */}
      <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">매출 추이</h2>
        {salesData?.data?.length > 0 ? (
          <div className="space-y-2">
            {salesData.data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500 shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(item.sales / maxSales) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-sm font-medium text-right">{formatFullPrice(item.sales)}</span>
                <span className="w-16 text-xs text-gray-400 text-right">{item.orders}건</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">데이터가 없습니다</div>
        )}
      </div>

      {/* 하단 그리드 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 인기 메뉴 */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              인기 메뉴 TOP 10
            </h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setProductSort('quantity')}
                className={`px-2 py-1 text-xs rounded ${productSort === 'quantity' ? 'bg-white shadow' : ''}`}
              >
                판매량
              </button>
              <button
                onClick={() => setProductSort('sales')}
                className={`px-2 py-1 text-xs rounded ${productSort === 'sales' ? 'bg-white shadow' : ''}`}
              >
                매출액
              </button>
            </div>
          </div>

          {products?.products?.length > 0 ? (
            <div className="space-y-3">
              {products.products.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    item.rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.rank}
                  </span>
                  <span className="flex-1 truncate">{item.product_name}</span>
                  <span className="text-sm text-gray-500">{item.total_quantity}개</span>
                  <span className="text-sm font-medium w-20 text-right">{formatPrice(item.total_sales)}원</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">데이터가 없습니다</div>
          )}
        </div>

        {/* 직원 성과 */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            직원 성과
          </h2>

          {staffStats?.staff?.length > 0 ? (
            <div className="space-y-3">
              {staffStats.staff.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    member.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    member.rank === 2 ? 'bg-gray-200 text-gray-700' :
                    member.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.rank}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role_label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{member.orders_processed}건</p>
                    <p className="text-xs text-gray-500">{formatPrice(member.total_sales)}원</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>직원 활동 데이터가 없습니다</p>
              <p className="text-sm">주문 상태를 변경하면 기록됩니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 최고 매출일 */}
      {salesData?.summary?.best_day && (
        <div className="mt-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">최고 매출일</p>
              <p className="text-2xl font-bold">{salesData.summary.best_day.date}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm">매출액</p>
              <p className="text-2xl font-bold">{formatFullPrice(salesData.summary.best_day.sales)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
