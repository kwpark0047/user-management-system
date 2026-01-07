import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, Calendar, FileText } from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  lead: 'bg-yellow-100 text-yellow-800',
};

const statusLabels = {
  active: '활성',
  inactive: '비활성',
  lead: '잠재고객',
};

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersAPI.getById(id)
      .then((res) => setCustomer(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await customersAPI.delete(id);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || '삭제 실패');
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!customer) {
    return <div className="text-center py-8">고객을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={20} />
        목록으로
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${statusColors[customer.status]}`}>
                {statusLabels[customer.status]}
              </span>
            </div>
            {user && (
              <div className="flex gap-2">
                <Link
                  to={`/customers/${id}/edit`}
                  className="flex items-center gap-1 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <Edit size={18} />
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={18} />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="text-gray-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-medium">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Phone className="text-gray-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="font-medium">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                      {customer.phone}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building className="text-gray-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">회사</p>
                <p className="font-medium">{customer.company || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="text-gray-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">등록일</p>
                <p className="font-medium">
                  {new Date(customer.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-gray-600" size={20} />
                <h3 className="font-medium text-gray-900">메모</h3>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {customer.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
