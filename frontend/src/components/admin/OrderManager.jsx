import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI, storesAPI } from '../../api';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, ChefHat, Package,
  RefreshCw, Search, Filter, Calendar, Bell, User, MapPin,
  CreditCard, Banknote, ChevronDown, X, Eye, Volume2, VolumeX, Hash, Timer
} from 'lucide-react';
import notificationSound from '../../utils/notificationSound';

const statusConfig = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, next: 'confirmed' },
  confirmed: { label: '확인', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle, next: 'preparing' },
  preparing: { label: '조리중', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ChefHat, next: 'ready' },
  ready: { label: '완료', color: 'bg-green-100 text-green-800 border-green-200', icon: Package, next: 'completed' },
  completed: { label: '수령', color: 'bg-navy-100 text-navy-800 border-navy-200', icon: CheckCircle, next: null },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, next: null }
};

const OrderManager = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [queueEdit, setQueueEdit] = useState({ queue_number: '', estimated_minutes: '' });

  const prevOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price) + '원';
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 소리 활성화 (사용자 상호작용 필요)
  const enableSound = () => {
    notificationSound.init();
    notificationSound.resume();
    notificationSound.setEnabled(soundEnabled);
  };

  // 소리 토글
  const toggleSound = () => {
    enableSound();
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationSound.setEnabled(newState);
    if (newState) {
      notificationSound.playSuccess();
    }
  };

  // 테스트 알림음 재생
  const playTestSound = () => {
    enableSound();
    notificationSound.playNewOrder();
  };

  const fetchStore = useCallback(async () => {
    try {
      const res = await storesAPI.getById(storeId);
      setStore(res.data);
    } catch (error) {
      console.error('매장 로딩 실패:', error);
    }
  }, [storeId]);

  const fetchOrders = useCallback(async () => {
    try {
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const res = await ordersAPI.getByStore(storeId, status, selectedDate);
      const newOrders = res.data;

      // 새로운 대기 주문 감지
      if (!isFirstLoadRef.current && soundEnabled) {
        const currentOrderIds = new Set(newOrders.map(o => o.id));
        const newPendingOrders = newOrders.filter(order =>
          order.status === 'pending' && !prevOrderIdsRef.current.has(order.id)
        );

        if (newPendingOrders.length > 0) {
          notificationSound.playNewOrder();
          setNewOrderAlert(true);
          setTimeout(() => setNewOrderAlert(false), 3000);
        }
      }

      // 현재 주문 ID 저장
      prevOrderIdsRef.current = new Set(newOrders.map(o => o.id));
      isFirstLoadRef.current = false;

      setOrders(newOrders);
    } catch (error) {
      console.error('주문 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedStatus, selectedDate, soundEnabled]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 10000); // 10초마다 갱신
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchOrders]);

  useEffect(() => {
    let result = [...orders];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.order_number?.toLowerCase().includes(term) ||
        order.customer_name?.toLowerCase().includes(term) ||
        order.table_name?.toLowerCase().includes(term)
      );
    }
    setFilteredOrders(result);
  }, [orders, searchTerm]);

  // 날짜나 상태 필터 변경 시 주문 ID 초기화
  useEffect(() => {
    prevOrderIdsRef.current = new Set();
    isFirstLoadRef.current = true;
  }, [selectedDate, selectedStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      if (soundEnabled) {
        notificationSound.playSuccess();
      }
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleQueueUpdate = async (orderId) => {
    try {
      await ordersAPI.updateQueue(orderId, parseInt(queueEdit.queue_number) || null, parseInt(queueEdit.estimated_minutes) || null);
      if (soundEnabled) notificationSound.playSuccess();
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, queue_number: parseInt(queueEdit.queue_number) || null, estimated_minutes: parseInt(queueEdit.estimated_minutes) || null }));
      }
      alert('대기순번이 저장되었습니다.');
    } catch (error) {
      alert('저장에 실패했습니다.');
    }
  };

  const getStatusCounts = () => {
    const counts = { all: orders.length };
    Object.keys(statusConfig).forEach(status => {
      counts[status] = orders.filter(o => o.status === status).length;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const pendingCount = statusCounts.pending + statusCounts.confirmed;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 새 주문 알림 배너 */}
      {newOrderAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-lg flex items-center gap-3">
            <Bell className="w-5 h-5 animate-pulse" />
            <span className="font-bold">새로운 주문이 들어왔습니다!</span>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center hover:shadow-card transition-all">
            <ArrowLeft className="w-5 h-5 text-navy-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">주문 관리</h1>
            <p className="text-navy-500 text-sm">{store?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {pendingCount > 0 && (
            <div className={'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ' +
              (newOrderAlert ? 'bg-yellow-100 border-yellow-300 animate-pulse' : 'bg-yellow-50 border-yellow-200')}>
              <Bell className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">{pendingCount}건 대기중</span>
            </div>
          )}

          {/* 알림 소리 토글 */}
          <button
            onClick={toggleSound}
            className={'px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ' +
              (soundEnabled ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500')}
            title={soundEnabled ? '알림 소리 끄기' : '알림 소리 켜기'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="hidden sm:inline">{soundEnabled ? '알림 ON' : '알림 OFF'}</span>
          </button>

          {/* 테스트 소리 버튼 */}
          {soundEnabled && (
            <button
              onClick={playTestSound}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all text-sm"
              title="알림음 테스트"
            >
              테스트
            </button>
          )}

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={'px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ' +
              (autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}
          >
            <RefreshCw className={'w-4 h-4 ' + (autoRefresh ? 'animate-spin' : '')} />
            <span className="hidden sm:inline">자동새로고침</span>
          </button>
          <button onClick={fetchOrders} className="w-10 h-10 bg-white rounded-xl shadow-soft flex items-center justify-center hover:shadow-card transition-all">
            <RefreshCw className="w-5 h-5 text-navy-600" />
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              placeholder="주문번호, 고객명, 테이블 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-5 h-5 text-navy-400 hover:text-navy-600" />
              </button>
            )}
          </div>
          {/* 날짜 선택 */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* 상태 필터 탭 */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
          <button
            onClick={() => setSelectedStatus('all')}
            className={'px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ' +
              (selectedStatus === 'all' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-navy-600 hover:bg-gray-200')}
          >
            전체 ({statusCounts.all})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={'px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ' +
                (selectedStatus === key ? config.color + ' border' : 'bg-gray-100 text-navy-600 hover:bg-gray-200')}
            >
              <config.icon className="w-4 h-4" />
              {config.label} ({statusCounts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* 주문 목록 */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
          <Package className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-navy-900 mb-2">주문이 없습니다</h3>
          <p className="text-navy-500">선택한 조건에 맞는 주문이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={order.id}
                className={'bg-white rounded-2xl shadow-soft overflow-hidden card-hover border-l-4 ' +
                  (order.status === 'pending' ? 'border-l-yellow-400' :
                   order.status === 'preparing' ? 'border-l-purple-400' :
                   order.status === 'ready' ? 'border-l-green-400' : 'border-l-transparent')}
              >
                {/* 카드 헤더 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 text-lg">#{order.order_number}</span>
                      {order.status === 'pending' && (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                      )}
                    </div>
                    <span className={'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ' + config.color}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-navy-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(order.created_at)}
                    </span>
                    {order.table_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.table_name}
                      </span>
                    )}
                    {order.customer_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {order.customer_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* 주문 내역 */}
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-navy-700">{item.product_name} x {item.quantity}</span>
                        <span className="text-navy-500">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-sm text-navy-400">외 {order.items.length - 3}개 항목</p>
                    )}
                  </div>
                  {order.notes && (
                    <div className="p-3 bg-yellow-50 rounded-xl mb-4">
                      <p className="text-sm text-yellow-800">요청: {order.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-primary-600">{formatPrice(order.total_amount)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedOrder(order); setShowDetail(true); setQueueEdit({ queue_number: order.queue_number || '', estimated_minutes: order.estimated_minutes || '' }); }}
                        className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-navy-600" />
                      </button>
                      {config.next && (
                        <button
                          onClick={() => handleStatusChange(order.id, config.next)}
                          className="px-4 py-2 btn-primary text-white text-sm rounded-lg font-medium"
                        >
                          {statusConfig[config.next].label}
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="px-3 py-2 bg-red-100 text-red-600 text-sm rounded-lg font-medium hover:bg-red-200 transition-colors"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 주문 상세 모달 */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/90 backdrop-blur-lg p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-navy-900">주문 상세</h2>
              <button onClick={() => setShowDetail(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-navy-600" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* 주문 정보 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-navy-900">#{selectedOrder.order_number}</span>
                  <span className={'px-4 py-2 rounded-full font-medium ' + statusConfig[selectedOrder.status].color}>
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-navy-400 mb-1">주문시간</p>
                    <p className="font-medium text-navy-900">{formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-navy-400 mb-1">테이블</p>
                    <p className="font-medium text-navy-900">{selectedOrder.table_name || '포장'}</p>
                  </div>
                  {selectedOrder.customer_name && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-navy-400 mb-1">고객명</p>
                      <p className="font-medium text-navy-900">{selectedOrder.customer_name}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-navy-400 mb-1">결제상태</p>
                    <p className="font-medium text-navy-900">{selectedOrder.payment_status === 'paid' ? '결제완료' : '미결제'}</p>
                  </div>
                </div>
              </div>

              {/* 주문 항목 */}
              <div>
                <h3 className="font-bold text-navy-900 mb-3">주문 항목</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-navy-900">{item.product_name}</p>
                        <p className="text-sm text-navy-500">{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <p className="font-bold text-navy-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 요청사항 */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-bold text-navy-900 mb-3">요청사항</h3>
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <p className="text-yellow-800">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* 총액 */}
              <div className="flex justify-between items-center p-4 bg-primary-50 rounded-xl">
                <span className="font-bold text-navy-900">총 결제금액</span>
                <span className="text-2xl font-bold text-primary-600">{formatPrice(selectedOrder.total_amount)}</span>
              </div>

              {/* 상태 변경 버튼 */}
              <div className="flex gap-3">
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <>
                    {statusConfig[selectedOrder.status].next && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, statusConfig[selectedOrder.status].next);
                        }}
                        className="flex-1 py-4 btn-primary text-white rounded-2xl font-medium text-lg"
                      >
                        {statusConfig[statusConfig[selectedOrder.status].next].label}으로 변경
                      </button>
                    )}
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, 'cancelled');
                        }}
                        className="px-6 py-4 bg-red-100 text-red-600 rounded-2xl font-medium hover:bg-red-200 transition-colors"
                      >
                        취소
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
