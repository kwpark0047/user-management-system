import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoriesAPI, productsAPI, storesAPI } from '../../api';
import { ArrowLeft, Plus, Edit, Trash2, FolderPlus } from 'lucide-react';

const MenuManager = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    try {
      const [storeRes, categoriesRes, productsRes] = await Promise.all([
        storesAPI.getById(storeId),
        categoriesAPI.getByStore(storeId),
        productsAPI.getByStore(storeId),
      ]);
      setStore(storeRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error(error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price) + '원';

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('이 카테고리를 삭제하시겠습니까?')) return;
    try {
      await categoriesAPI.delete(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '삭제 실패');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('이 상품을 삭제하시겠습니까?')) return;
    try {
      await productsAPI.delete(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '삭제 실패');
    }
  };

  if (loading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">메뉴 관리</h1>
          <p className="text-gray-500">{store?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 카테고리 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">카테고리</h2>
              <button
                onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <FolderPlus size={20} />
              </button>
            </div>
            <div className="divide-y">
              <button
                onClick={() => setSelectedCategory(null)}
                className={'w-full px-4 py-3 text-left hover:bg-gray-50 ' +
                  (selectedCategory === null ? 'bg-blue-50 text-blue-600' : '')}
              >
                전체 ({products.length})
              </button>
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center group">
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={'flex-1 px-4 py-3 text-left hover:bg-gray-50 ' +
                      (selectedCategory === cat.id ? 'bg-blue-50 text-blue-600' : '')}
                  >
                    {cat.name} ({products.filter((p) => p.category_id === cat.id).length})
                  </button>
                  <div className="hidden group-hover:flex pr-2 gap-1">
                    <button
                      onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">상품 목록</h2>
              <button
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                상품 추가
              </button>
            </div>
            <div className="divide-y">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">등록된 상품이 없습니다</div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 flex items-center gap-4">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{product.name}</h3>
                        {product.is_sold_out ? (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">품절</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-500">{product.category_name || '미분류'}</p>
                      <p className="text-blue-600 font-medium">{formatPrice(product.price)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
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
        </div>
      </div>

      {/* 카테고리 모달 */}
      {showCategoryModal && (
        <CategoryModal
          storeId={storeId}
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={() => { setShowCategoryModal(false); fetchData(); }}
        />
      )}

      {/* 상품 모달 */}
      {showProductModal && (
        <ProductModal
          storeId={storeId}
          categories={categories}
          product={editingProduct}
          onClose={() => setShowProductModal(false)}
          onSave={() => { setShowProductModal(false); fetchData(); }}
        />
      )}
    </div>
  );
};

const CategoryModal = ({ storeId, category, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (category) {
        await categoriesAPI.update(category.id, { name });
      } else {
        await categoriesAPI.create({ store_id: parseInt(storeId), name });
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
        <h3 className="text-lg font-bold mb-4">{category ? '카테고리 수정' : '카테고리 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="카테고리명"
            required
            className="w-full px-3 py-2 border rounded-lg mb-4"
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

const ProductModal = ({ storeId, categories, product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    category_id: product?.category_id || '',
    price: product?.price || '',
    description: product?.description || '',
    image_url: product?.image_url || '',
    is_sold_out: product?.is_sold_out || 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        store_id: parseInt(storeId),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        price: parseInt(form.price) || 0,
      };
      if (product) {
        await productsAPI.update(product.id, data);
      } else {
        await productsAPI.create(data);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{product ? '상품 수정' : '상품 추가'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="상품명 *"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">카테고리 선택</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="가격 (원)"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="상품 설명"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="이미지 URL"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_sold_out === 1}
              onChange={(e) => setForm({ ...form, is_sold_out: e.target.checked ? 1 : 0 })}
            />
            품절
          </label>
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

export default MenuManager;
