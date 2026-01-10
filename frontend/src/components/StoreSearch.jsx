/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Grid3X3, List, Map, Store, ChevronDown, X, Coffee, Utensils, ShoppingBag, Cake, Pizza, Star } from 'lucide-react';
import KakaoMap from './KakaoMap';

const regions = [
  { id: 'all', name: '전체 지역' },
  { id: 'seoul', name: '서울' },
  { id: 'gyeonggi', name: '경기' },
  { id: 'incheon', name: '인천' },
  { id: 'busan', name: '부산' },
  { id: 'daegu', name: '대구' },
  { id: 'daejeon', name: '대전' },
  { id: 'gwangju', name: '광주' },
  { id: 'jeju', name: '제주' }
];

const businessTypes = [
  { id: 'all', name: '전체 업종', icon: Store },
  { id: 'cafe', name: '카페', icon: Coffee },
  { id: 'restaurant', name: '음식점', icon: Utensils },
  { id: 'bakery', name: '베이커리', icon: Cake },
  { id: 'fastfood', name: '패스트푸드', icon: Pizza },
  { id: 'bar', name: '주점', icon: ShoppingBag }
];

// 데모용 매장 데이터
const demoStores = [
  { id: 1, name: '위마켓 카페 강남점', business_type: 'cafe', region: 'seoul', address: '서울시 강남구 테헤란로 123', rating: 4.8, review_count: 156, popular_menu: '시그니처 라떼', lat: 37.5012, lng: 127.0396 },
  { id: 2, name: '스타벅스 홍대점', business_type: 'cafe', region: 'seoul', address: '서울시 마포구 홍익로 45', rating: 4.5, review_count: 324, popular_menu: '아메리카노', lat: 37.5563, lng: 126.9240 },
  { id: 3, name: '맛있는 식당', business_type: 'restaurant', region: 'seoul', address: '서울시 종로구 인사동길 12', rating: 4.7, review_count: 89, popular_menu: '비빔밥', lat: 37.5740, lng: 126.9850 },
  { id: 4, name: '파리바게뜨 판교점', business_type: 'bakery', region: 'gyeonggi', address: '경기도 성남시 분당구 판교로 256', rating: 4.3, review_count: 67, popular_menu: '소금빵', lat: 37.3947, lng: 127.1112 },
  { id: 5, name: '맥도날드 부산역점', business_type: 'fastfood', region: 'busan', address: '부산시 동구 중앙대로 206', rating: 4.1, review_count: 203, popular_menu: '빅맥', lat: 35.1152, lng: 129.0422 },
  { id: 6, name: '블루보틀 성수점', business_type: 'cafe', region: 'seoul', address: '서울시 성동구 성수이로 78', rating: 4.9, review_count: 412, popular_menu: '싱글오리진', lat: 37.5447, lng: 127.0560 },
  { id: 7, name: '이디야커피 인천공항점', business_type: 'cafe', region: 'incheon', address: '인천시 중구 공항로 272', rating: 4.2, review_count: 156, popular_menu: '토피넛라떼', lat: 37.4602, lng: 126.4407 },
  { id: 8, name: '본죽 대구점', business_type: 'restaurant', region: 'daegu', address: '대구시 중구 동성로 88', rating: 4.6, review_count: 98, popular_menu: '전복죽', lat: 35.8714, lng: 128.5953 },
  { id: 9, name: '설빙 제주점', business_type: 'cafe', region: 'jeju', address: '제주시 연동 312-5', rating: 4.4, review_count: 234, popular_menu: '인절미빙수', lat: 33.4890, lng: 126.4983 },
  { id: 10, name: '교촌치킨 광주점', business_type: 'restaurant', region: 'gwangju', address: '광주시 서구 상무대로 776', rating: 4.5, review_count: 178, popular_menu: '허니콤보', lat: 35.1531, lng: 126.8895 }
];

const StoreSearch = () => {
  const [filteredStores, setFilteredStores] = useState(demoStores);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedStore, setSelectedStore] = useState(null);

  const filterStores = useCallback(() => {
    let result = [...demoStores];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(store =>
        store.name.toLowerCase().includes(term) ||
        store.address.toLowerCase().includes(term) ||
        store.popular_menu.toLowerCase().includes(term)
      );
    }

    if (selectedRegion !== 'all') {
      result = result.filter(store => store.region === selectedRegion);
    }

    if (selectedType !== 'all') {
      result = result.filter(store => store.business_type === selectedType);
    }

    setFilteredStores(result);
  }, [searchTerm, selectedRegion, selectedType]);

  useEffect(() => {
    filterStores();
  }, [filterStores]);

  const getTypeIcon = (type) => {
    const found = businessTypes.find(t => t.id === type);
    return found ? found.icon : Store;
  };

  const getTypeName = (type) => {
    const found = businessTypes.find(t => t.id === type);
    return found ? found.name : '기타';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm || selectedRegion !== 'all' || selectedType !== 'all';

  const renderStoreCard = (store, isListView = false) => {
    const TypeIcon = getTypeIcon(store.business_type);
    
    if (isListView) {
      return (
        <Link to={"/menu?store=" + store.id} key={store.id} className="bg-white rounded-2xl shadow-soft p-4 flex gap-4 card-hover">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-navy-900 truncate">{store.name}</h3>
              <div className="flex items-center gap-1 text-sm flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-navy-700">{store.rating}</span>
                <span className="text-navy-400">({store.review_count})</span>
              </div>
            </div>
            <p className="text-sm text-navy-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{store.address}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium">{getTypeName(store.business_type)}</span>
              <span className="text-sm text-navy-500">인기: {store.popular_menu}</span>
            </div>
          </div>
        </Link>
      );
    }
    
    return (
      <Link to={"/menu?store=" + store.id} key={store.id} className="bg-white rounded-2xl shadow-soft overflow-hidden card-hover">
        <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <TypeIcon className="w-12 h-12 text-primary-400" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-navy-900 truncate">{store.name}</h3>
            <div className="flex items-center gap-1 text-sm flex-shrink-0">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-medium">{store.rating}</span>
            </div>
          </div>
          <p className="text-sm text-navy-400 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />{store.address}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium">{getTypeName(store.business_type)}</span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
      {/* 헤더 */}
      <div className="glass sticky top-0 z-20 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-navy-900 hidden sm:block">위마켓</span>
            </Link>
            
            {/* 검색바 */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input
                  type="text"
                  placeholder="매장명, 주소, 메뉴 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-soft border-0 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <X className="w-5 h-5 text-navy-400 hover:text-navy-600" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block px-4 py-2 text-navy-600 font-medium hover:text-primary-600 transition-colors">로그인</Link>
              <Link to="/register" className="px-4 py-2 btn-primary text-white rounded-xl font-medium shadow-lg">시작하기</Link>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 뷰 모드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* 필터 버튼들 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 지역 필터 */}
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 bg-white rounded-xl shadow-soft border-0 font-medium text-navy-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
              >
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
            </div>

            {/* 업종 필터 */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 bg-white rounded-xl shadow-soft border-0 font-medium text-navy-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
              >
                {businessTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <X className="w-4 h-4" />필터 초기화
              </button>
            )}
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center bg-white rounded-xl shadow-soft p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={"p-2 rounded-lg transition-all " + (viewMode === 'grid' ? 'bg-primary-500 text-white shadow-lg' : 'text-navy-500 hover:text-navy-700')}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={"p-2 rounded-lg transition-all " + (viewMode === 'list' ? 'bg-primary-500 text-white shadow-lg' : 'text-navy-500 hover:text-navy-700')}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={"p-2 rounded-lg transition-all " + (viewMode === 'map' ? 'bg-primary-500 text-white shadow-lg' : 'text-navy-500 hover:text-navy-700')}
            >
              <Map className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 결과 개수 */}
        <p className="mt-4 text-navy-500">
          <span className="font-bold text-primary-600">{filteredStores.length}</span>개의 매장을 찾았습니다
        </p>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {filteredStores.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-navy-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-navy-300" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-navy-500 mb-6">다른 검색어나 필터를 시도해보세요</p>
            <button onClick={clearFilters} className="px-6 py-3 btn-primary text-white rounded-xl font-medium">필터 초기화</button>
          </div>
        ) : viewMode === 'map' ? (
          /* 지도 뷰 */
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="h-96 sm:h-[500px] relative">
              <KakaoMap 
                stores={filteredStores} 
                onStoreSelect={setSelectedStore}
                selectedStore={selectedStore}
              />
            </div>
            {/* 선택된 매장 또는 매장 리스트 */}
            <div className="p-4 border-t border-gray-100">
              {selectedStore ? (
                <Link to={"/menu?store=" + selectedStore.id} className="flex gap-4 p-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center flex-shrink-0">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-navy-900">{selectedStore.name}</h4>
                    <p className="text-sm text-navy-500 mt-1">{selectedStore.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-navy-700">{selectedStore.rating}</span>
                      </div>
                      <span className="text-navy-400">|</span>
                      <span className="text-sm text-primary-600">메뉴 보기 →</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
                  {filteredStores.slice(0, 5).map(store => {
                    const TypeIcon = getTypeIcon(store.business_type);
                    return (
                      <button key={store.id} onClick={() => setSelectedStore(store)} className="flex-shrink-0 w-48 bg-gray-50 rounded-xl p-3 text-left hover:bg-gray-100 transition-colors">
                        <h4 className="font-bold text-navy-900 text-sm truncate">{store.name}</h4>
                        <p className="text-xs text-navy-400 truncate mt-1">{store.address}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* 리스트 뷰 */
          <div className="space-y-4">
            {filteredStores.map(store => renderStoreCard(store, true))}
          </div>
        ) : (
          /* 그리드 뷰 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStores.map(store => renderStoreCard(store, false))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSearch;
