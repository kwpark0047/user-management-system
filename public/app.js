const API_URL = 'http://localhost:3000/api';

// 토큰 관리
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// API 요청 헬퍼
async function api(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '요청 실패');
  }

  return data;
}

// 탭 전환
function showTab(tab) {
  const tabs = document.querySelectorAll('.tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    tabs[0].classList.add('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    tabs[1].classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

// 로그인
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  try {
    errorEl.textContent = '';
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    showToast('로그인 성공!', 'success');
    showMainSection(data.user);
  } catch (error) {
    errorEl.textContent = error.message;
  }
}

// 회원가입
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const errorEl = document.getElementById('registerError');

  try {
    errorEl.textContent = '';
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    setToken(data.token);
    showToast('회원가입 성공!', 'success');
    showMainSection(data.user);
  } catch (error) {
    errorEl.textContent = error.message;
  }
}

// 로그아웃
function logout() {
  removeToken();
  showToast('로그아웃 되었습니다', 'success');
  showAuthSection();
}

// 인증 섹션 표시
function showAuthSection() {
  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('mainSection').classList.add('hidden');
  document.getElementById('userInfo').classList.add('hidden');

  // 폼 초기화
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
}

// 메인 섹션 표시
function showMainSection(user) {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('mainSection').classList.remove('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  document.getElementById('userName').textContent = `${user.name}님`;

  loadUsers();
}

// 사용자 목록 로드
async function loadUsers() {
  const userList = document.getElementById('userList');

  try {
    userList.innerHTML = '<p>로딩 중...</p>';
    const users = await api('/users');

    if (users.length === 0) {
      userList.innerHTML = '<p>등록된 사용자가 없습니다.</p>';
      return;
    }

    userList.innerHTML = users.map(user => `
      <div class="user-item">
        <div class="user-info">
          <h3>${escapeHtml(user.name)}</h3>
          <p>${escapeHtml(user.email)}</p>
        </div>
        <button class="btn btn-danger" onclick="deleteUser(${user.id})">삭제</button>
      </div>
    `).join('');
  } catch (error) {
    userList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

// 사용자 삭제
async function deleteUser(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await api(`/users/${id}`, { method: 'DELETE' });
    showToast('사용자가 삭제되었습니다', 'success');
    loadUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 토스트 메시지
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// XSS 방지
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 초기화
async function init() {
  const token = getToken();

  if (token) {
    try {
      const data = await api('/auth/me');
      showMainSection(data.user);
    } catch (error) {
      removeToken();
      showAuthSection();
    }
  } else {
    showAuthSection();
  }
}

// 앱 시작
init();
