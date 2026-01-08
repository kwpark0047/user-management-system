import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || '로그인 실패');
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
            <h1 className="text-2xl font-bold text-navy-900">위마켓</h1>
            <p className="text-navy-500 mt-2">매장 관리 시스템에 로그인하세요</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 btn-primary text-white rounded-2xl font-medium text-lg shadow-lg disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-navy-500">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
