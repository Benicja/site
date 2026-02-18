
import { useState, useEffect } from 'react';
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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[1100000] flex flex-col-reverse gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-6 py-3 rounded-full shadow-lg text-sm font-semibold animate-fadeIn pointer-events-auto flex items-center gap-3
            ${n.type === 'success' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}
          style={{ minWidth: '220px', textAlign: 'center' }}
        >
          {n.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
          <span className="flex-1">{n.msg}</span>
        </div>
      ))}
    </div>
  );
}
