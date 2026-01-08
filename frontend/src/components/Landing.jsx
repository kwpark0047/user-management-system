import { Link } from 'react-router-dom';
import { Store, QrCode, BarChart3, Smartphone, Clock, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: QrCode, title: 'QR 코드 주문', description: '테이블에 부착된 QR 코드를 스캔하면 바로 메뉴를 확인하고 주문할 수 있습니다.' },
    { icon: Smartphone, title: '모바일 최적화', description: '어떤 기기에서도 완벽하게 작동하는 반응형 디자인으로 고객 경험을 극대화합니다.' },
    { icon: Clock, title: '실시간 주문 관리', description: '들어오는 주문을 실시간으로 확인하고 상태를 업데이트할 수 있습니다.' },
    { icon: BarChart3, title: '매출 분석', description: '일별, 월별 매출 통계와 인기 메뉴 분석으로 매장 운영을 최적화하세요.' }
  ];

  const steps = [
    { step: '01', title: '회원가입', description: '간단한 정보 입력으로 1분 안에 가입 완료' },
    { step: '02', title: '매장 등록', description: '매장 정보와 메뉴를 손쉽게 등록' },
    { step: '03', title: 'QR 코드 생성', description: '테이블별 QR 코드 자동 생성 및 다운로드' },
    { step: '04', title: '주문 접수 시작', description: '고객이 QR 스캔으로 바로 주문 시작' }
  ];

  const plans = [
    { name: 'Free', price: '0', period: '영구 무료', description: '소규모 매장에 적합', features: ['매장 1개', '테이블 5개', '기본 메뉴 관리', 'QR 코드 생성', '주문 접수'], cta: '무료로 시작하기', popular: false },
    { name: 'Pro', price: '29,000', period: '월', description: '성장하는 매장을 위한 플랜', features: ['매장 3개', '테이블 무제한', '고급 메뉴 관리', '매출 분석', '우선 지원', '커스텀 QR 디자인'], cta: '14일 무료 체험', popular: true },
    { name: 'Enterprise', price: '문의', period: '', description: '대규모 프랜차이즈용', features: ['매장 무제한', '전용 서버', 'API 연동', '전담 매니저', 'SLA 보장', '맞춤 개발'], cta: '상담 신청', popular: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
      <nav className="glass sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg"><Store className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-bold text-navy-900">위마켓</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/stores" className="text-navy-600 hover:text-primary-600 font-medium">매장찾기</Link>
              <a href="#features" className="text-navy-600 hover:text-primary-600 font-medium">기능</a>
              <a href="#how-it-works" className="text-navy-600 hover:text-primary-600 font-medium">이용방법</a>
              <a href="#pricing" className="text-navy-600 hover:text-primary-600 font-medium">요금제</a>
              <Link to="/menu/demo" className="text-navy-600 hover:text-primary-600 font-medium">데모</Link>
              <Link to="/login" className="text-navy-600 hover:text-primary-600 font-medium">로그인</Link>
              <Link to="/register" className="px-5 py-2.5 btn-primary text-white rounded-xl font-medium shadow-lg">무료로 시작하기</Link>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl hover:bg-gray-100">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-3">
            <Link to="/stores" className="block py-2 text-navy-600 font-medium">매장찾기</Link>
            <a href="#features" className="block py-2 text-navy-600 font-medium">기능</a>
            <a href="#how-it-works" className="block py-2 text-navy-600 font-medium">이용방법</a>
            <a href="#pricing" className="block py-2 text-navy-600 font-medium">요금제</a>
            <Link to="/menu/demo" className="block py-2 text-navy-600 font-medium">데모</Link>
            <Link to="/login" className="block py-2 text-navy-600 font-medium">로그인</Link>
            <Link to="/register" className="block w-full py-3 btn-primary text-white rounded-xl font-medium text-center">무료로 시작하기</Link>
          </div>
        )}
      </nav>

      <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>지금 바로 무료로 시작하세요
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-900 leading-tight mb-6">QR 코드 하나로<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">스마트한 매장 운영</span></h1>
          <p className="text-lg sm:text-xl text-navy-500 mb-10 max-w-2xl mx-auto">테이블 주문, 메뉴 관리, 매출 분석까지 위마켓 하나로 모든 것을 해결하세요</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 btn-primary text-white rounded-2xl font-medium text-lg shadow-lg flex items-center justify-center gap-2">무료로 시작하기<ArrowRight size={20} /></Link>
            <Link to="/menu/demo" className="px-8 py-4 bg-white text-navy-700 rounded-2xl font-medium text-lg shadow-soft hover:shadow-card transition-all flex items-center justify-center gap-2">데모 체험하기</Link>
          </div>
          <div className="mt-16 glass rounded-3xl shadow-card p-4 sm:p-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white"><p className="text-white/60 text-sm">오늘 매출</p><p className="text-2xl font-bold mt-1">1,234,000원</p></div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white"><p className="text-white/60 text-sm">주문 건수</p><p className="text-2xl font-bold mt-1">48건</p></div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white"><p className="text-white/60 text-sm">대기 주문</p><p className="text-2xl font-bold mt-1">3건</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">매장 운영의 모든 것</h2><p className="text-navy-500 text-lg max-w-2xl mx-auto">복잡한 주문 시스템은 이제 그만, 위마켓으로 간편하게 관리하세요</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (<div key={index} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 shadow-soft card-hover"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-5"><feature.icon className="w-7 h-7 text-white" /></div><h3 className="text-xl font-bold text-navy-900 mb-2">{feature.title}</h3><p className="text-navy-500">{feature.description}</p></div>))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">4단계로 시작하세요</h2><p className="text-navy-500 text-lg">복잡한 설정 없이 빠르게 시작할 수 있습니다</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (<div key={index} className="relative"><div className="text-6xl font-bold text-primary-100 mb-4">{item.step}</div><h3 className="text-xl font-bold text-navy-900 mb-2">{item.title}</h3><p className="text-navy-500">{item.description}</p></div>))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">합리적인 요금제</h2><p className="text-navy-500 text-lg">매장 규모에 맞는 요금제를 선택하세요</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (<div key={index} className={plan.popular ? "rounded-3xl p-8 bg-gradient-to-br from-navy-800 to-navy-900 text-white shadow-float md:scale-105" : "rounded-3xl p-8 bg-white shadow-card"}>
              {plan.popular && <div className="inline-block px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded-full mb-4">인기</div>}
              <h3 className={plan.popular ? "text-2xl font-bold mb-2 text-white" : "text-2xl font-bold mb-2 text-navy-900"}>{plan.name}</h3>
              <p className={plan.popular ? "text-sm mb-4 text-white/70" : "text-sm mb-4 text-navy-500"}>{plan.description}</p>
              <div className="mb-6"><span className={plan.popular ? "text-4xl font-bold text-white" : "text-4xl font-bold text-navy-900"}>{plan.price === '문의' ? '' : '₩'}{plan.price}</span>{plan.period && <span className={plan.popular ? "text-white/70" : "text-navy-500"}>/{plan.period}</span>}</div>
              <ul className="space-y-3 mb-8">{plan.features.map((feature, fIndex) => (<li key={fIndex} className="flex items-center gap-2"><CheckCircle className={plan.popular ? "w-5 h-5 text-primary-400" : "w-5 h-5 text-primary-500"} /><span className={plan.popular ? "text-white/90" : "text-navy-600"}>{feature}</span></li>))}</ul>
              <button className={plan.popular ? "w-full py-3 rounded-xl font-medium bg-white text-navy-900 hover:bg-gray-100 transition-colors" : "w-full py-3 rounded-xl font-medium btn-primary text-white"}>{plan.cta}</button>
            </div>))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass rounded-3xl shadow-card p-8 sm:p-12 text-center bg-gradient-to-br from-primary-500 to-primary-600">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
          <p className="text-white/80 text-lg mb-8">무료로 시작하고, 매장 운영을 혁신하세요</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-2xl font-medium text-lg shadow-lg hover:shadow-xl transition-all">무료 체험 시작<ArrowRight size={20} /></Link>
        </div>
      </section>

      <footer className="bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><Store className="w-5 h-5 text-white" /></div><span className="text-xl font-bold">위마켓</span></div>
          <div className="flex gap-8 text-white/60"><a href="#" className="hover:text-white transition-colors">이용약관</a><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a><a href="#" className="hover:text-white transition-colors">고객센터</a></div>
          <p className="text-white/40 text-sm">© 2026 위마켓. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
