import { useState, useRef, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    isConnected,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications
  } = useNotifications();

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_READY':
        return '🍽️';
      case 'NEW_ORDER':
        return '📥';
      case 'ORDER_STATUS_CHANGED':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} className={isConnected ? 'text-gray-700' : 'text-gray-400'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-red-400 rounded-full" />
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">알림</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title={soundEnabled ? '소리 끄기' : '소리 켜기'}
              >
                {soundEnabled ? (
                  <Volume2 size={18} className="text-gray-600" />
                ) : (
                  <VolumeX size={18} className="text-gray-400" />
                )}
              </button>
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    title="전체 읽음"
                  >
                    <Check size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    title="전체 삭제"
                  >
                    <Trash2 size={18} className="text-gray-600" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Bell size={40} className="mx-auto mb-3 text-gray-300" />
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    {notification.tableName && (
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.tableName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.receivedAt || notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 연결 상태 */}
          <div className={`px-4 py-2 text-xs text-center ${isConnected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isConnected ? '실시간 연결됨' : '연결 끊김 - 재연결 중...'}
          </div>
        </div>
      )}
    </div>
  );
}
