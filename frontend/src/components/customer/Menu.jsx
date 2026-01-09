import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { storesAPI, categoriesAPI, productsAPI, tablesAPI, ordersAPI } from "../../api";
import { ShoppingCart, Plus, Minus, X, Send, CreditCard, Banknote, Building2, Clock, CheckCircle, ChevronLeft, MapPin, Phone, Hash, Timer } from "lucide-react";

const defaultTheme = {
  primaryColor: "#f97316",
  secondaryColor: "#1e3a5f",
  accentColor: "#10b981",
  backgroundColor: "#f8fafc",
  textColor: "#1e293b",
  fontFamily: "Pretendard",
  logoText: ""
};

const paymentMethods = [
  { id: "card", label: "카드결제", icon: CreditCard, desc: "신용/체크카드" },
  { id: "cash", label: "현금결제", icon: Banknote, desc: "카운터 결제" },
  { id: "transfer", label: "계좌이체", icon: Building2, desc: "실시간 이체" }
];
const Menu = () => {
  const { qrCode } = useParams();
  const [searchParams] = useSearchParams();
  const storeIdParam = searchParams.get("store");
  const [store, setStore] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderForm, setOrderForm] = useState({ customer_name: "", customer_phone: "", notes: "", payment_method: "card" });
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderStep, setOrderStep] = useState("cart");
  const [orderPolling, setOrderPolling] = useState(false);

  const theme = useMemo(() => {
    if (!store?.theme) return defaultTheme;
    try {
      const parsed = typeof store.theme === "string" ? JSON.parse(store.theme) : store.theme;
      return { ...defaultTheme, ...parsed };
    } catch (e) { return defaultTheme; }
  }, [store]);

  useEffect(() => {
    if (qrCode) fetchTableData();
    else if (storeIdParam) fetchStoreData(storeIdParam);
  }, [qrCode, storeIdParam]);

  // Poll for order updates
  useEffect(() => {
    if (!orderSuccess?.id) return;
    const pollOrder = async () => {
      try {
        const res = await ordersAPI.getById(orderSuccess.id);
        if (res.data.queue_number !== orderSuccess.queue_number || res.data.estimated_minutes !== orderSuccess.estimated_minutes || res.data.status !== orderSuccess.status) {
          setOrderSuccess(prev => ({ ...prev, ...res.data }));
        }
      } catch (e) {}
    };
    const interval = setInterval(pollOrder, 5000);
    return () => clearInterval(interval);
  }, [orderSuccess?.id, orderSuccess?.queue_number, orderSuccess?.estimated_minutes, orderSuccess?.status]);

  const fetchTableData = async () => {
    try {
      const res = await tablesAPI.getByQrCode(qrCode);
      setTable(res.data);
      await fetchStoreData(res.data.store_id);
    } catch { setError("유효하지 않은 QR 코드입니다"); setLoading(false); }
  };

  const fetchStoreData = async (storeId) => {
    try {
      const [storeRes, categoriesRes, productsRes] = await Promise.all([
        storesAPI.getById(storeId), categoriesAPI.getByStore(storeId), productsAPI.getByStore(storeId)
      ]);
      setStore(storeRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data.filter((p) => p.is_active && !p.is_sold_out));
    } catch { setError("매장 정보를 불러올 수 없습니다"); }
    finally { setLoading(false); }
  };

  const formatPrice = (price) => new Intl.NumberFormat("ko-KR").format(price) + "원";
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) return prev.map((item) => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product_id: product.id, product_name: product.name, price: product.price, quantity: 1 }];
    });
  };
  const updateQuantity = (pid, d) => setCart((p) => p.map((i) => i.product_id === pid ? { ...i, quantity: i.quantity + d } : i).filter((i) => i.quantity > 0));
  const getTotalAmount = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const getTotalItems = () => cart.reduce((s, i) => s + i.quantity, 0);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    try {
      const res = await ordersAPI.create({ store_id: store.id, table_id: table?.id || null, customer_name: orderForm.customer_name || null, customer_phone: orderForm.customer_phone || null, notes: orderForm.notes || null, payment_method: orderForm.payment_method, items: cart });
      setOrderSuccess({ ...res.data, payment_method: orderForm.payment_method });
      setCart([]); setShowCart(false); setOrderStep("cart");
    } catch (err) { alert(err.response?.data?.error || "주문에 실패했습니다"); }
  };

  const filteredProducts = selectedCategory ? products.filter((p) => p.category_id === selectedCategory) : products;
  const themeStyles = { fontFamily: theme.fontFamily + ", sans-serif" };
  const gradientBg = "linear-gradient(135deg, " + theme.primaryColor + ", " + theme.secondaryColor + ")";
  const pageBg = "linear-gradient(180deg, " + theme.backgroundColor + " 0%, white 100%)";
  const loadingBg = "linear-gradient(135deg, " + theme.backgroundColor + ", white)";

  if (loading) return (<div className="min-h-screen flex items-center justify-center" style={{ background: loadingBg }}><div className="text-center"><div className="relative w-16 h-16 mx-auto"><div className="absolute inset-0 rounded-full border-4" style={{ borderColor: theme.primaryColor + "40" }} /><div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: theme.primaryColor, borderTopColor: "transparent" }} /></div><p className="mt-6 font-medium" style={{ color: theme.textColor }}>메뉴를 불러오는 중...</p></div></div>);
  if (error) return (<div className="min-h-screen flex items-center justify-center" style={{ background: theme.backgroundColor }}><p className="text-red-500 text-xl">{error}</p></div>);

  if (orderSuccess) {
    const pInfo = paymentMethods.find(p => p.id === orderSuccess.payment_method);

    return (<div className="min-h-screen flex items-center justify-center p-4" style={{ background: theme.backgroundColor, ...themeStyles }}><div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full"><div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: theme.accentColor + "20" }}><CheckCircle size={40} style={{ color: theme.accentColor }} /></div><h2 className="text-2xl font-bold text-center mb-2" style={{ color: theme.textColor }}>주문 완료!</h2><p className="text-center text-gray-500 mb-6">주문이 성공적으로 접수되었습니다</p>
      
      {/* 대기순번 표시 */}
      {(orderSuccess.queue_number || orderSuccess.estimated_minutes) && (
        <div className="mb-6 p-4 rounded-2xl text-center" style={{ backgroundColor: theme.primaryColor + "10" }}>
          {orderSuccess.queue_number && (
            <div className="mb-2">
              <p className="text-sm text-gray-500">대기 순번</p>
              <p className="text-4xl font-bold" style={{ color: theme.primaryColor }}>#{orderSuccess.queue_number}</p>
            </div>
          )}
          {orderSuccess.estimated_minutes && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Timer size={18} style={{ color: theme.secondaryColor }} />
              <span className="font-medium" style={{ color: theme.secondaryColor }}>약 {orderSuccess.estimated_minutes}분 소요 예정</span>
            </div>
          )}
        </div>
      )}
      
      <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: theme.backgroundColor }}><div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200"><span className="text-gray-500">주문번호</span><span className="font-bold text-lg" style={{ color: theme.primaryColor }}>#{orderSuccess.order_number}</span></div><div className="flex justify-between items-center mb-3"><span className="text-gray-500">결제 방법</span><span className="font-medium flex items-center gap-2">{pInfo && <pInfo.icon size={18} style={{ color: theme.secondaryColor }} />}{pInfo?.label || "카드결제"}</span></div><div className="flex justify-between items-center mb-3"><span className="text-gray-500">{table ? "테이블" : "주문 유형"}</span><span className="font-medium">{table?.name || "포장"}</span></div><div className="flex justify-between items-center mb-3"><span className="text-gray-500">주문 상태</span><span className="font-medium px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: orderSuccess.status === 'completed' ? '#10b98120' : orderSuccess.status === 'preparing' ? '#8b5cf620' : theme.primaryColor + '20', color: orderSuccess.status === 'completed' ? '#10b981' : orderSuccess.status === 'preparing' ? '#8b5cf6' : theme.primaryColor }}>{orderSuccess.status === 'pending' ? '대기중' : orderSuccess.status === 'confirmed' ? '확인됨' : orderSuccess.status === 'preparing' ? '조리중' : orderSuccess.status === 'ready' ? '준비완료' : orderSuccess.status === 'completed' ? '완료' : '취소'}</span></div><div className="flex justify-between items-center pt-3 border-t border-gray-200"><span className="font-medium">총 결제금액</span><span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{formatPrice(orderSuccess.total_amount)}</span></div></div><div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ backgroundColor: theme.primaryColor + "10" }}><Clock size={20} style={{ color: theme.primaryColor }} /><div><p className="font-medium" style={{ color: theme.textColor }}>{orderSuccess.status === 'pending' ? '주문 확인 대기중' : orderSuccess.status === 'confirmed' ? '주문이 확인되었습니다' : orderSuccess.status === 'preparing' ? '조리가 진행중입니다' : orderSuccess.status === 'ready' ? '음식이 준비되었습니다!' : '주문이 완료되었습니다'}</p><p className="text-sm text-gray-500">{orderSuccess.status === 'ready' ? '카운터에서 수령해주세요' : '잠시만 기다려주세요'}</p></div></div><div className="text-center text-sm text-gray-500 mb-6"><p className="font-medium" style={{ color: theme.textColor }}>{store?.name}</p>{store?.address && <p className="flex items-center justify-center gap-1 mt-1"><MapPin size={14} /> {store.address}</p>}{store?.phone && <p className="flex items-center justify-center gap-1 mt-1"><Phone size={14} /> {store.phone}</p>}</div><button onClick={() => setOrderSuccess(null)} className="w-full py-4 text-white rounded-2xl font-medium shadow-lg" style={{ backgroundColor: theme.primaryColor }}>추가 주문하기</button></div></div>);
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: pageBg, ...themeStyles }}>
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b" style={{ backgroundColor: "rgba(255,255,255,0.9)", borderColor: theme.primaryColor + "20" }}>
        <div className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: gradientBg }}>{(theme.logoText || store?.name || "M").charAt(0)}</div><div><h1 className="text-lg font-bold" style={{ color: theme.textColor }}>{theme.logoText || store?.name}</h1>{table && <p className="text-sm" style={{ color: theme.secondaryColor }}>{table.name}</p>}</div></div></div>
        <div className="flex overflow-x-auto px-4 pb-3 gap-2"><button onClick={() => setSelectedCategory(null)} className="px-4 py-2 rounded-full text-sm whitespace-nowrap font-medium" style={selectedCategory === null ? { background: gradientBg, color: "white" } : { backgroundColor: "white", color: theme.textColor }}>전체</button>{categories.map((c) => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className="px-4 py-2 rounded-full text-sm whitespace-nowrap font-medium" style={selectedCategory === c.id ? { backgroundColor: theme.primaryColor, color: "white" } : { backgroundColor: theme.secondaryColor + "10", color: theme.secondaryColor }}>{c.name}</button>))}</div>
      </div>
      <div className="p-4 grid gap-4">{filteredProducts.length === 0 ? (<div className="text-center py-12" style={{ color: theme.textColor + "80" }}>등록된 메뉴가 없습니다</div>) : (filteredProducts.map((p) => (<div key={p.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4" style={{ borderLeft: "4px solid " + theme.primaryColor + "20" }}>{p.image_url && <img src={p.image_url} alt={p.name} className="w-24 h-24 object-cover rounded-xl" />}<div className="flex-1 min-w-0"><h3 className="font-semibold truncate" style={{ color: theme.textColor }}>{p.name}</h3>{p.description && <p className="text-sm mt-1" style={{ color: theme.textColor + "70" }}>{p.description}</p>}<p className="font-bold mt-2" style={{ color: theme.primaryColor }}>{formatPrice(p.price)}</p></div><button onClick={() => addToCart(p)} className="self-center w-11 h-11 text-white rounded-xl flex items-center justify-center shadow-md" style={{ background: gradientBg }}><Plus size={20} /></button></div>)))}</div>
      {cart.length > 0 && (<div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-lg" style={{ backgroundColor: "rgba(255,255,255,0.95)" }}><button onClick={() => { setShowCart(true); setOrderStep("cart"); }} className="w-full py-4 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg font-medium" style={{ background: gradientBg }}><ShoppingCart size={20} /><span>장바구니 ({getTotalItems()})</span><span className="font-bold">{formatPrice(getTotalAmount())}</span></button></div>)}
      {showCart && (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"><div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto" style={themeStyles}><div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">{orderStep !== "cart" ? (<button onClick={() => setOrderStep("cart")} className="flex items-center gap-1" style={{ color: theme.primaryColor }}><ChevronLeft size={20} />뒤로</button>) : (<h2 className="text-lg font-bold" style={{ color: theme.textColor }}>장바구니</h2>)}<button onClick={() => { setShowCart(false); setOrderStep("cart"); }}><X size={24} style={{ color: theme.textColor }} /></button></div>{orderStep === "cart" && (<><div className="p-4 space-y-3">{cart.map((i) => (<div key={i.product_id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: theme.backgroundColor }}><div><p className="font-medium" style={{ color: theme.textColor }}>{i.product_name}</p><p className="text-sm" style={{ color: theme.primaryColor }}>{formatPrice(i.price)}</p></div><div className="flex items-center gap-3"><button onClick={() => updateQuantity(i.product_id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.secondaryColor + "15" }}><Minus size={16} style={{ color: theme.secondaryColor }} /></button><span className="w-8 text-center font-medium" style={{ color: theme.textColor }}>{i.quantity}</span><button onClick={() => updateQuantity(i.product_id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + "15" }}><Plus size={16} style={{ color: theme.primaryColor }} /></button></div></div>))}</div><div className="p-4 border-t"><div className="flex justify-between mb-4"><span className="font-medium" style={{ color: theme.textColor }}>총 금액</span><span className="text-xl font-bold" style={{ color: theme.primaryColor }}>{formatPrice(getTotalAmount())}</span></div><button onClick={() => setOrderStep("payment")} className="w-full py-4 text-white rounded-2xl font-medium shadow-lg" style={{ backgroundColor: theme.primaryColor }}>결제 방법 선택</button></div></>)}
{orderStep === "payment" && (<><div className="p-4"><h3 className="font-bold mb-4" style={{ color: theme.textColor }}>결제 방법을 선택하세요</h3><div className="space-y-3">{paymentMethods.map((m) => (<button key={m.id} onClick={() => setOrderForm({ ...orderForm, payment_method: m.id })} className="w-full p-4 rounded-2xl border-2 flex items-center gap-4" style={{ borderColor: orderForm.payment_method === m.id ? theme.primaryColor : "transparent", backgroundColor: orderForm.payment_method === m.id ? theme.primaryColor + "08" : theme.backgroundColor }}><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + "15" }}><m.icon size={24} style={{ color: theme.primaryColor }} /></div><div className="text-left"><p className="font-medium" style={{ color: theme.textColor }}>{m.label}</p><p className="text-sm" style={{ color: theme.textColor + "70" }}>{m.desc}</p></div>{orderForm.payment_method === m.id && <CheckCircle size={24} className="ml-auto" style={{ color: theme.primaryColor }} />}</button>))}</div></div><div className="p-4 border-t"><button onClick={() => setOrderStep("confirm")} className="w-full py-4 text-white rounded-2xl font-medium shadow-lg" style={{ backgroundColor: theme.primaryColor }}>주문 정보 입력</button></div></>)}
{orderStep === "confirm" && (<><div className="p-4 space-y-4"><h3 className="font-bold" style={{ color: theme.textColor }}>주문 정보 (선택)</h3><input type="text" placeholder="이름" value={orderForm.customer_name} onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ backgroundColor: theme.backgroundColor }} /><input type="tel" placeholder="전화번호" value={orderForm.customer_phone} onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ backgroundColor: theme.backgroundColor }} /><textarea placeholder="요청사항" value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl outline-none resize-none" style={{ backgroundColor: theme.backgroundColor }} /><div className="rounded-xl p-4" style={{ backgroundColor: theme.backgroundColor }}><h4 className="font-medium mb-3" style={{ color: theme.textColor }}>주문 요약</h4>{cart.map(i => (<div key={i.product_id} className="flex justify-between text-sm py-1"><span style={{ color: theme.textColor + "90" }}>{i.product_name} x {i.quantity}</span><span style={{ color: theme.textColor }}>{formatPrice(i.price * i.quantity)}</span></div>))}<div className="flex justify-between font-bold pt-3 mt-3 border-t" style={{ borderColor: theme.primaryColor + "20" }}><span style={{ color: theme.textColor }}>총 결제금액</span><span style={{ color: theme.primaryColor }}>{formatPrice(getTotalAmount())}</span></div><div className="flex items-center gap-2 mt-3 text-sm" style={{ color: theme.textColor + "70" }}>{(() => { const m = paymentMethods.find(x => x.id === orderForm.payment_method); return m ? <><m.icon size={16} />{m.label}</> : null; })()}</div></div></div><div className="p-4 border-t"><button onClick={handleOrder} className="w-full py-4 text-white rounded-2xl flex items-center justify-center gap-2 font-medium shadow-lg" style={{ background: gradientBg }}><Send size={20} />{formatPrice(getTotalAmount())} 주문하기</button></div></>)}</div></div>)}
    </div>
  );
};

export default Menu;
