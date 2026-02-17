import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';

interface Props {
  className?: string;
}

export default function ShoppingListButton({ className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const handleNotification = (event: any) => {
      const { type, addedCount } = event.detail;
      if (type === 'success' && addedCount) {
        setBadgeCount(prev => prev + addedCount);
      }
    };

    window.addEventListener('benicja:notification', handleNotification);
    return () => window.removeEventListener('benicja:notification', handleNotification);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setBadgeCount(0);
  };

  return (
    <>
      <div className={`group ${className} relative`}>
        <button
          className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all hover:scale-110 active:scale-95 focus:outline-none bg-black/90 text-white flex items-center justify-center"
          onClick={handleOpen}
          aria-label="Open shopping list"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 22H5C3.34315 22 2 20.6569 2 19V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V15H22V19C22 20.6569 20.6569 22 19 22ZM18 17V19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19V17H18ZM6 7V9H14V7H6ZM6 11V13H14V11H6ZM6 15V17H11V15H6Z"></path>
          </svg>
        </button>
        {badgeCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-white text-black border-2 border-black rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold pointer-events-none">
            {badgeCount}
          </div>
        )}
      </div>
      <ShoppingList open={open} onClose={() => setOpen(false)} />
    </>
  );
}
