import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storesAPI } from '../../api';
import { ArrowLeft, Save, Palette, Type, Eye } from 'lucide-react';

const defaultTheme = {
  primaryColor: '#f97316',
  secondaryColor: '#1e3a5f',
  accentColor: '#10b981',
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  fontFamily: 'Pretendard',
  logoText: ''
};

const fontOptions = [
  { value: 'Pretendard', label: 'Pretendard (기본)' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR' },
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'Spoqa Han Sans Neo', label: 'Spoqa Han Sans' }
];

const presetThemes = [
  { name: '오렌지', primary: '#f97316', secondary: '#1e3a5f', accent: '#10b981' },
  { name: '블루', primary: '#3b82f6', secondary: '#1e293b', accent: '#f59e0b' },
  { name: '그린', primary: '#10b981', secondary: '#064e3b', accent: '#f97316' },
  { name: '퍼플', primary: '#8b5cf6', secondary: '#1e1b4b', accent: '#ec4899' },
  { name: '레드', primary: '#ef4444', secondary: '#1f2937', accent: '#fbbf24' },
  { name: '핑크', primary: '#ec4899', secondary: '#4a044e', accent: '#06b6d4' }
];

const StoreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '',
    business_type: 'cafe', open_time: '09:00', close_time: '22:00',
  });
  const [theme, setTheme] = useState(defaultTheme);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      storesAPI.getById(id).then((res) => {
        setForm(res.data);
        if (res.data.theme) {
          try {
            const parsed = typeof res.data.theme === 'string' ? JSON.parse(res.data.theme) : res.data.theme;
            setTheme({ ...defaultTheme, ...parsed });
          } catch (e) { console.error(e); }
        }
      }).catch(() => navigate('/admin'));
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleThemeChange = (key, value) => setTheme((p) => ({ ...p, [key]: value }));
  const applyPreset = (preset) => setTheme((p) => ({ ...p, primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { ...form, theme: JSON.stringify(theme) };
      if (isEdit) await storesAPI.update(id, data);
      else await storesAPI.create(data);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || '저장 실패');
    } finally { setLoading(false); }
  };

  const tabClass = (active) => 'flex-1 py-4 px-6 font-medium text-center transition-all ' +
    (active ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50' : 'text-navy-500 hover:text-navy-700');

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-6 font-medium">
        <ArrowLeft size={20} />뒤로가기
      </button>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="border-b border-gray-100 flex">
          <button onClick={() => setActiveTab('info')} className={tabClass(activeTab === 'info')}>기본 정보</button>
          <button onClick={() => setActiveTab('theme')} className={tabClass(activeTab === 'theme') + ' flex items-center justify-center gap-2'}>
            <Palette size={18} />테마 설정
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-navy-900">{isEdit ? '매장 정보 수정' : '새 매장 등록'}</h2>
          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

          <form onSubmit={handleSubmit}>
            {activeTab === 'info' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">매장명 <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="매장 이름" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">업종</label>
                  <select name="business_type" value={form.business_type} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="cafe">카페</option>
                    <option value="restaurant">음식점</option>
                    <option value="bar">주점</option>
                    <option value="bakery">베이커리</option>
                    <option value="fastfood">패스트푸드</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">주소</label>
                  <input type="text" name="address" value={form.address || ''} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="매장 주소" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">전화번호</label>
                  <input type="tel" name="phone" value={form.phone || ''} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="02-0000-0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">오픈 시간</label>
                    <input type="time" name="open_time" value={form.open_time} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">마감 시간</label>
                    <input type="time" name="close_time" value={form.close_time} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">매장 설명</label>
                  <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="매장에 대한 간단한 설명" />
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-3">프리셋 테마</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {presetThemes.map((preset, idx) => (
                      <button key={idx} type="button" onClick={() => applyPreset(preset)} className="p-3 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all">
                        <div className="flex gap-1 mb-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        </div>
                        <p className="text-xs text-navy-600">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-3">색상 설정</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { key: 'primaryColor', label: '메인 색상' },
                      { key: 'secondaryColor', label: '보조 색상' },
                      { key: 'accentColor', label: '강조 색상' }
                    ].map(item => (
                      <div key={item.key} className="bg-gray-50 rounded-xl p-4">
                        <label className="block text-xs text-navy-500 mb-2">{item.label}</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={theme[item.key]} onChange={(e) => handleThemeChange(item.key, e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                          <input type="text" value={theme[item.key]} onChange={(e) => handleThemeChange(item.key, e.target.value)} className="flex-1 px-3 py-2 bg-white rounded-lg text-sm font-mono" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-3"><Type size={16} className="inline mr-2" />글꼴 설정</label>
                  <select value={theme.fontFamily} onChange={(e) => handleThemeChange('fontFamily', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none">
                    {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">로고 텍스트</label>
                  <input type="text" value={theme.logoText} onChange={(e) => handleThemeChange('logoText', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none" placeholder="메뉴판에 표시될 로고 텍스트" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-3"><Eye size={16} className="inline mr-2" />미리보기</label>
                  <div className="rounded-2xl p-6 border-2 border-dashed border-gray-200" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
                        {(theme.logoText || form.name || 'W').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold" style={{ color: theme.textColor }}>{theme.logoText || form.name || '매장명'}</h3>
                        <p className="text-sm opacity-70" style={{ color: theme.textColor }}>{form.description || '매장 설명'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <span className="px-4 py-2 rounded-full text-white text-sm font-medium" style={{ backgroundColor: theme.primaryColor }}>카테고리1</span>
                      <span className="px-4 py-2 rounded-full text-sm font-medium bg-white" style={{ color: theme.secondaryColor }}>카테고리2</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-medium" style={{ color: theme.textColor }}>메뉴 이름</p>
                        <p className="text-sm opacity-60" style={{ color: theme.textColor }}>메뉴 설명</p>
                      </div>
                      <span className="font-bold" style={{ color: theme.primaryColor }}>5,000원</span>
                    </div>
                    <button type="button" className="w-full mt-4 py-3 rounded-xl text-white font-medium" style={{ backgroundColor: theme.primaryColor }}>장바구니 담기</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-100 text-navy-700 rounded-xl font-medium hover:bg-gray-200">취소</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 btn-primary text-white rounded-xl font-medium shadow-lg disabled:opacity-50">
                <Save size={18} />{loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoreForm;
