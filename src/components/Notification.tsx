import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
  onClose?: () => void;
  id?: number;
}

const notificationVariants: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 }
};

const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  id
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#2ecc71';
      case 'error': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'info': return '#3498db';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      key={id}
      variants={notificationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '15px 25px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 1000,
        maxWidth: '300px',
        wordWrap: 'break-word'
      }}
    >
      <span style={{ marginRight: '10px', fontSize: '1.2em' }}>
        {getIcon()}
      </span>
      {message}
    </motion.div>
  );
};

export default Notification;

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = (notification: NotificationProps) => {
    const id = Date.now();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationContainer: React.FC = () => {
    return (
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        {notifications.map((notification) => (
          <Notification 
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id!)}
          />
        ))}
      </div>
    );
  };

  return { 
    addNotification, 
    NotificationContainer 
  };
};
