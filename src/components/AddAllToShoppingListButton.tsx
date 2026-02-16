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

export default function AddAllToShoppingListButton({ ingredients, className = '' }: Props) {
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'warn' } | null>(null);

  function handleAddAll() {
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
        msg: 'All ingredients already in shopping list!',
        type: 'warn',
      });
    }
    setTimeout(() => setNotification(null), 2200);
  }

  return (
    <>
      <button
        className={`w-full justify-center bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors flex items-center gap-2 ${className}`}
        onClick={handleAddAll}
        type="button"
      >
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
        </svg>
        Add Ingredients
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
