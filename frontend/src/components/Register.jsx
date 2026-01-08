import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (form.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-4">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">회원가입</h1>
            <p className="text-navy-500 mt-2">위마켓과 함께 시작하세요</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                이름
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border-0 rounded-xl shadow-soft focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border-0 rounded-xl shadow-soft focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border-0 rounded-xl shadow-soft focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                placeholder="최소 6자 이상"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border-0 rounded-xl shadow-soft focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                placeholder="비밀번호 재입력"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 btn-primary text-white rounded-2xl font-medium text-lg shadow-lg disabled:opacity-50 mt-2"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-navy-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
