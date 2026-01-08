import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tablesAPI, storesAPI } from '../../api';
import { ArrowLeft, Plus, Edit, Trash2, QrCode, RefreshCw, Download, FileText, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const TableManager = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showQrModal, setShowQrModal] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { fetchData(); }, [storeId]);

  const fetchData = async () => {
    try {
      const [storeRes, tablesRes] = await Promise.all([storesAPI.getById(storeId), tablesAPI.getByStore(storeId)]);
      setStore(storeRes.data);
      setTables(tablesRes.data);
    } catch (error) { console.error(error); navigate('/admin'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 테이블을 삭제하시겠습니까?')) return;
    try { await tablesAPI.delete(id); fetchData(); }
    catch (error) { alert(error.response?.data?.error || '삭제 실패'); }
  };

  const handleRegenerateQr = async (id) => {
    if (!window.confirm('QR 코드를 재생성하시겠습니까?')) return;
    try { await tablesAPI.regenerateQr(id); fetchData(); }
    catch (error) { alert(error.response?.data?.error || 'QR 재생성 실패'); }
  };

  const getQrUrl = (qrCode) => window.location.origin + '/menu/' + qrCode;
  const getQrImageUrl = (qrCode, size = 200) => 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(getQrUrl(qrCode));

  const loadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

  const generatePDF = async () => {
    if (tables.length === 0) { alert('출력할 테이블이 없습니다'); return; }
    setPdfLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210, pageHeight = 297, margin = 15, qrSize = 60;
      const cellWidth = (pageWidth - margin * 2) / 2, cellHeight = 90, qrsPerPage = 6;
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const positionInPage = i % qrsPerPage;
        const col = positionInPage % 2, row = Math.floor(positionInPage / 2);
        if (i > 0 && positionInPage === 0) doc.addPage();
        if (positionInPage === 0) {
          doc.setFillColor(30, 58, 95);
          doc.rect(0, 0, pageWidth, 25, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.text(store?.name || '', pageWidth / 2, 12, { align: 'center' });
          doc.setFontSize(10);
          doc.text('QR Code Menu', pageWidth / 2, 20, { align: 'center' });
        }
        const x = margin + col * cellWidth, y = 35 + row * cellHeight;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(x + 5, y, cellWidth - 10, cellHeight - 5, 3, 3, 'S');
        try {
          const img = await loadImage(getQrImageUrl(table.qr_code, 300));
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', x + (cellWidth - qrSize) / 2, y + 8, qrSize, qrSize);
        } catch (err) {
          doc.setTextColor(255, 0, 0);
          doc.setFontSize(10);
          doc.text('QR 오류', x + cellWidth / 2, y + 40, { align: 'center' });
        }
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(14);
        doc.text(table.name, x + cellWidth / 2, y + qrSize + 15, { align: 'center' });
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('Scan to order', x + cellWidth / 2, y + qrSize + 22, { align: 'center' });
      }
      const totalPages = Math.ceil(tables.length / qrsPerPage);
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text('Page ' + i + ' / ' + totalPages, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      doc.save((store?.name || 'tables') + '_QR_codes.pdf');
    } catch (error) { alert('PDF 생성에 실패했습니다'); }
    finally { setPdfLoading(false); }
  };

  if (loading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin")} className="text-gray-600 hover:text-gray-900"><ArrowLeft size={24} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">테이블 관리</h1>
          <p className="text-gray-500">{store?.name}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-bold">테이블 목록 ({tables.length}개)</h2>
          <div className="flex gap-2">
            <button onClick={generatePDF} disabled={pdfLoading || tables.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {pdfLoading ? <><Loader2 size={18} className="animate-spin" />PDF 생성 중...</> : <><FileText size={18} />전체 QR PDF 출력</>}
            </button>
            <button onClick={() => { setEditingTable(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={18} />테이블 추가
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {tables.length === 0 ? <div className="col-span-full text-center py-8 text-gray-500">등록된 테이블이 없습니다</div> :
            tables.map((table) => (
              <div key={table.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{table.name}</h3>
                    <p className="text-sm text-gray-500">{table.capacity}인석</p>
                  </div>
                  <span className={"px-2 py-1 text-xs rounded-full " + (table.is_occupied ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
                    {table.is_occupied ? "사용중" : "비어있음"}
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setShowQrModal(table)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
                    <QrCode size={16} />QR 보기
                  </button>
                  <button onClick={() => handleRegenerateQr(table.id)} className="p-2 text-gray-400 hover:text-blue-600" title="QR 재생성"><RefreshCw size={18} /></button>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditingTable(table); setShowModal(true); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(table.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
        </div>
      </div>
      {showModal && <TableModal storeId={storeId} table={editingTable} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchData(); }} />}
      {showQrModal && <QrModal table={showQrModal} qrUrl={getQrUrl(showQrModal.qr_code)} onClose={() => setShowQrModal(null)} />}
    </div>
  );
};

const TableModal = ({ storeId, table, onClose, onSave }) => {
  const [form, setForm] = useState({ name: table?.name || "", capacity: table?.capacity || 4 });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (table) await tablesAPI.update(table.id, form);
      else await tablesAPI.create({ store_id: parseInt(storeId), ...form });
      onSave();
    } catch (error) { alert(error.response?.data?.error || "저장 실패"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{table ? "테이블 수정" : "테이블 추가"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="테이블명 (예: 1번 테이블)" required className="w-full px-3 py-2 border rounded-lg" />
          <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} placeholder="수용 인원" min={1} className="w-full px-3 py-2 border rounded-lg" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">취소</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const QrModal = ({ table, qrUrl, onClose }) => {
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(qrUrl);
  const handleDownload = () => { const link = document.createElement("a"); link.href = qrImageUrl; link.download = table.name + "_QR.png"; link.click(); };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-bold mb-4">{table.name} QR 코드</h3>
        <div className="mb-4"><img src={qrImageUrl} alt="QR Code" className="mx-auto" /></div>
        <p className="text-sm text-gray-500 mb-4 break-all">{qrUrl}</p>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Download size={18} />다운로드</button>
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">닫기</button>
        </div>
      </div>
    </div>
  );
};

export default TableManager;
