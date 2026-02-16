import React, { useState } from 'react';

interface Ingredient {
  amount: string;
  item: string;
}

interface Props {
  ingredients: Ingredient[];
  className?: string;
}

const STORAGE_KEY = 'benicja_shopping_list';

function loadList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveList(list: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function AddToShoppingListIconButton({ ingredients, className = '' }: Props) {
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'warn' } | null>(null);

  function handleAddAll(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = loadList();
    const names = new Set(current.map((i: any) => i.name));
    const newItems = ingredients
      .map(i => ({
        id: Date.now() + Math.random().toString(16),
        name: `${i.amount ? i.amount + ' ' : ''}${i.item}`.trim(),
        checked: false,
      }))
      .filter(i => !names.has(i.name));
    const updated = [...current, ...newItems];
    saveList(updated);
    if (newItems.length > 0) {
      setNotification({
        msg: `${newItems.length} item${newItems.length > 1 ? 's' : ''} added to shopping list!`,
        type: 'success',
      });
    } else {
      setNotification({
        msg: 'All ingredients are already in your shopping list!',
        type: 'warn',
      });
    }
    setTimeout(() => setNotification(null), 2200);
  }

  return (
    <>
      <button
        className={`w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer ${className}`}
        onClick={handleAddAll}
        type="button"
        aria-label="Add ingredients to shopping list"
        tabIndex={0}
        style={{ pointerEvents: 'auto' }}
      >
        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
        </svg>
      </button>
      {notification && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[9999] px-6 py-3 rounded shadow-lg text-sm font-semibold animate-fadeIn
            ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}
          style={{ minWidth: '220px', textAlign: 'center' }}
        >
          {notification.msg}
        </div>
      )}
    </>
  );
}
