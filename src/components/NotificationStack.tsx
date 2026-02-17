
import React, { useState, useEffect } from 'react';
import type { Notification } from '../lib/notifications';

export default function NotificationStack() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotification = (event: any) => {
      const newNotif = event.detail as Notification;
      setNotifications(prev => [...prev, newNotif]);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 3000);
    };

    window.addEventListener('benicja:notification', handleNotification);
    return () => window.removeEventListener('benicja:notification', handleNotification);
  }, []);

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[2147483647] flex flex-col-reverse gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-6 py-3 rounded shadow-lg text-sm font-semibold animate-fadeIn pointer-events-auto
            ${n.type === 'success' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}
          style={{ minWidth: '220px', textAlign: 'center' }}
        >
          {n.msg}
        </div>
      ))}
    </div>
  );
}
