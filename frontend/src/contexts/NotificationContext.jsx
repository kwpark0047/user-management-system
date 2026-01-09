import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket, onNotification, onConnect, onDisconnect } from '../utils/socket';
import notificationSound, { vibrateOrderReady, vibrateShort } from '../utils/notificationSound';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, storeId, userId, role }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 알림 추가
  const addNotification = useCallback((notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      read: false,
      receivedAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // 최대 50개 유지
    setUnreadCount(prev => prev + 1);

    // 알림 타입에 따라 소리/진동 재생
    if (soundEnabled) {
      notificationSound.resume();

      if (notification.type === 'ORDER_READY') {
        notificationSound.playOrderReady();
        vibrateOrderReady();
      } else if (notification.type === 'NEW_ORDER') {
        notificationSound.playNewOrder();
        vibrateShort();
      } else {
        notificationSound.playNotification();
        vibrateShort();
      }
    }
  }, [soundEnabled]);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // 전체 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // 알림 삭제
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // 전체 알림 삭제
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Socket 연결
  useEffect(() => {
    if (storeId && userId) {
      connectSocket(storeId, userId, role);

      const cleanupNotification = onNotification((data) => {
        addNotification(data);
      });

      const cleanupConnect = onConnect(() => {
        setIsConnected(true);
        console.log('[Socket] Connected');
      });

      const cleanupDisconnect = onDisconnect(() => {
        setIsConnected(false);
        console.log('[Socket] Disconnected');
      });

      return () => {
        cleanupNotification();
        cleanupConnect();
        cleanupDisconnect();
        disconnectSocket();
      };
    }
  }, [storeId, userId, role, addNotification]);

  // 소리 설정
  useEffect(() => {
    notificationSound.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    soundEnabled,
    setSoundEnabled,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
