import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { storesAPI, categoriesAPI, productsAPI, tablesAPI, ordersAPI } from '../../api';
import { ShoppingCart, Plus, Minus, X, Send } from 'lucide-react';

const Menu = () => {
  const { qrCode } = useParams();
  const [searchParams] = useSearchParams();
  const storeIdParam = searchParams.get('store');

  const [store, setStore] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderForm, setOrderForm] = useState({ customer_name: '', customer_phone: '', notes: '' });
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    if (qrCode) {
      fetchTableData();
    } else if (storeIdParam) {
      fetchStoreData(storeIdParam);
    }
  }, [qrCode, storeIdParam]);

  const fetchTableData = async () => {
    try {
      const res = await tablesAPI.getByQrCode(qrCode);
      setTable(res.data);
      await fetchStoreData(res.data.store_id);
    } catch (err) {
      setError('유효하지 않은 QR 코드입니다');
      setLoading(false);
    }
  };

  const fetchStoreData = async (storeId) => {
    try {
      const [storeRes, categoriesRes, productsRes] = await Promise.all([
        storesAPI.getById(storeId),
        categoriesAPI.getByStore(storeId),
        productsAPI.getByStore(storeId),
      ]);
      setStore(storeRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data.filter((p) => p.is_active && !p.is_sold_out));
    } catch (err) {
      setError('매장 정보를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        store_id: store.id,
        table_id: table?.id || null,
        customer_name: orderForm.customer_name || null,
        customer_phone: orderForm.customer_phone || null,
        notes: orderForm.notes || null,
        items: cart,
      };

      const res = await ordersAPI.create(orderData);
      setOrderSuccess(res.data);
      setCart([]);
      setShowCart(false);
    } catch (err) {
      alert(err.response?.data?.error || '주문에 실패했습니다');
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">메뉴를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">주문 완료!</h2>
          <p className="text-gray-500 mb-4">주문번호: {orderSuccess.order_number}</p>
          <p className="text-lg font-medium mb-6">
            총 {formatPrice(orderSuccess.total_amount)}
          </p>
          <button
            onClick={() => setOrderSuccess(null)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            추가 주문하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">{store?.name}</h1>
          {table && <p className="text-sm text-gray-500">{table.name}</p>}
        </div>

        {/* 카테고리 탭 */}
        <div className="flex overflow-x-auto px-4 pb-2 gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={
              'px-4 py-2 rounded-full text-sm whitespace-nowrap ' +
              (selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700')
            }
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={
                'px-4 py-2 rounded-full text-sm whitespace-nowrap ' +
                (selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700')
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="p-4 grid gap-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">등록된 메뉴가 없습니다</div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow p-4 flex gap-4"
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                )}
                <p className="text-blue-600 font-bold mt-2">
                  {formatPrice(product.price)}
                </p>
              </div>
              <button
                onClick={() => addToCart(product)}
                className="self-center p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                <Plus size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 장바구니 버튼 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-4 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            <span>장바구니 ({getTotalItems()})</span>
            <span className="font-bold">{formatPrice(getTotalAmount())}</span>
          </button>
        </div>
      )}

      {/* 장바구니 모달 */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">장바구니</h2>
              <button onClick={() => setShowCart(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="p-1 rounded-full bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="p-1 rounded-full bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-4">
              <input
                type="text"
                placeholder="이름 (선택)"
                value={orderForm.customer_name}
                onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="tel"
                placeholder="전화번호 (선택)"
                value={orderForm.customer_phone}
                onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="요청사항 (선택)"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="p-4 border-t">
              <div className="flex justify-between mb-4">
                <span className="font-medium">총 결제금액</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(getTotalAmount())}
                </span>
              </div>
              <button
                onClick={handleOrder}
                className="w-full py-4 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <Send size={20} />
                주문하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
