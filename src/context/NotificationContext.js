import React, { useState, useEffect, createContext, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Base64 short beep sound for emergency
  const alarmSound = new Audio('data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');

  const addNotification = (title, message, type = 'info', isEmergency = false) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, type, isEmergency }]);

    if (isEmergency) {
      try {
        alarmSound.play().catch(e => console.log('Audio play prevented', e));
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message, icon: '/logo192.png' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body: message, icon: '/logo192.png' });
            }
          });
        }
      } catch (e) {
        console.error('Notification error:', e);
      }
    }

    // Auto remove normal notifications after 5 seconds
    if (!isEmergency) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(notif => (
          <div 
            key={notif.id}
            className={`toast-notification ${notif.isEmergency ? 'emergency-pulse' : ''}`}
            style={{
              background: notif.isEmergency ? 'var(--danger)' : notif.type === 'success' ? 'var(--success)' : 'var(--white)',
              color: notif.isEmergency || notif.type === 'success' ? 'var(--white)' : 'var(--text-primary)',
              padding: '15px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '300px',
              borderLeft: notif.isEmergency ? 'none' : `5px solid ${notif.type === 'success' ? 'var(--success)' : 'var(--primary-color)'}`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              animation: 'slideInRight 0.3s ease-out forwards'
            }}
          >
            <button 
              onClick={() => removeNotification(notif.id)}
              style={{
                position: 'absolute',
                top: '5px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: '16px',
                cursor: 'pointer',
                opacity: 0.7
              }}
            >
              ×
            </button>
            <strong style={{ fontSize: '1rem', marginBottom: '4px' }}>{notif.title}</strong>
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>{notif.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
