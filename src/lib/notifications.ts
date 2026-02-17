
export type NotificationType = 'success' | 'info';

export interface Notification {
  id: string;
  msg: string;
  type: NotificationType;
  addedCount?: number;
}

export function toast(msg: string, type: NotificationType = 'success', addedCount?: number) {
  const event = new CustomEvent('benicja:notification', {
    detail: { msg, type, id: Math.random().toString(36).substring(2, 9), addedCount }
  });
  window.dispatchEvent(event);
}
