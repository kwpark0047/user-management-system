import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tablesAPI, storesAPI } from '../../api';
import { ArrowLeft, Plus, Edit, Trash2, QrCode, RefreshCw, Download } from 'lucide-react';

const TableManager = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showQrModal, setShowQrModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    try {
      const [storeRes, tablesRes] = await Promise.all([
        storesAPI.getById(storeId),
        tablesAPI.getByStore(storeId),
      ]);
      setStore(storeRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      console.error(error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 테이블을 삭제하시겠습니까?')) return;
    try {
      await tablesAPI.delete(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '삭제 실패');
    }
  };

  const handleRegenerateQr = async (id) => {
    if (!window.confirm('QR 코드를 재생성하시겠습니까? 기존 QR 코드는 더 이상 사용할 수 없습니다.')) return;
    try {
      await tablesAPI.regenerateQr(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'QR 재생성 실패');
    }
  };

  const getQrUrl = (qrCode) => {
    return window.location.origin + '/menu/' + qrCode;
  };

  if (loading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">테이블 관리</h1>
          <p className="text-gray-500">{store?.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold">테이블 목록</h2>
          <button
            onClick={() => { setEditingTable(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            테이블 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {tables.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              등록된 테이블이 없습니다
            </div>
          ) : (
            tables.map((table) => (
              <div key={table.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{table.name}</h3>
                    <p className="text-sm text-gray-500">{table.capacity}인석</p>
                  </div>
                  <span className={
                    'px-2 py-1 text-xs rounded-full ' +
                    (table.is_occupied ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')
                  }>
                    {table.is_occupied ? '사용중' : '비어있음'}
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setShowQrModal(table)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <QrCode size={16} />
                    QR 보기
                  </button>
                  <button
                    onClick={() => handleRegenerateQr(table.id)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="QR 재생성"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setEditingTable(table); setShowModal(true); }}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 테이블 추가/수정 모달 */}
      {showModal && (
        <TableModal
          storeId={storeId}
          table={editingTable}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchData(); }}
        />
      )}

      {/* QR 코드 모달 */}
      {showQrModal && (
        <QrModal
          table={showQrModal}
          qrUrl={getQrUrl(showQrModal.qr_code)}
          onClose={() => setShowQrModal(null)}
        />
      )}
    </div>
  );
};

const TableModal = ({ storeId, table, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: table?.name || '',
    capacity: table?.capacity || 4,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (table) {
        await tablesAPI.update(table.id, form);
      } else {
        await tablesAPI.create({ store_id: parseInt(storeId), ...form });
      }
      onSave();
    } catch (error) {
      alert(error.response?.data?.error || '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{table ? '테이블 수정' : '테이블 추가'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="테이블명 (예: 1번 테이블)"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
            placeholder="수용 인원"
            min={1}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">취소</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const QrModal = ({ table, qrUrl, onClose }) => {
  const qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(qrUrl);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = table.name + '_QR.png';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-bold mb-4">{table.name} QR 코드</h3>
        <div className="mb-4">
          <img src={qrImageUrl} alt="QR Code" className="mx-auto" />
        </div>
        <p className="text-sm text-gray-500 mb-4 break-all">{qrUrl}</p>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <Download size={18} />
            다운로드
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableManager;
