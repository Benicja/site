import React, { useState, useEffect } from 'react';

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

const STORAGE_KEY = 'benicja_shopping_list';

function loadList(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveList(list: ShoppingItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function ShoppingList({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setItems(loadList());
  }, [open]);

  useEffect(() => {
    saveList(items);
  }, [items]);

  function addItem(name: string) {
    if (!name.trim()) return;
    setItems(list => [
      ...list,
      { id: Date.now() + Math.random().toString(16), name: name.trim(), checked: false }
    ]);
    setInput('');
  }

  function removeItem(id: string) {
    setItems(list => list.filter(item => item.id !== id));
  }

  function toggleItem(id: string) {
    setItems(list => list.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  }

  function clearList() {
    setItems([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center md:items-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl p-6 relative animate-fadeInUp">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close shopping list"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Shopping List</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            addItem(input);
          }}
          className="flex gap-2 mb-4"
        >
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            placeholder="Add custom item..."
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700"
          >
            Add
          </button>
        </form>
        <ul className="max-h-60 overflow-y-auto mb-4 divide-y divide-gray-100">
          {items.length === 0 && (
            <li className="text-gray-400 text-sm py-6 text-center">No items yet</li>
          )}
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-2 py-2 group">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                className="accent-gray-900 w-4 h-4"
              />
              <span className={
                `flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`
              }>{item.name}</span>
              <button
                className="text-gray-300 hover:text-red-500 text-lg px-1"
                onClick={() => removeItem(item.id)}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-between">
          <button
            className="text-xs text-gray-500 hover:text-red-500 font-bold uppercase tracking-widest"
            onClick={clearList}
            disabled={items.length === 0}
          >
            Clear List
          </button>
          <button
            className="text-xs text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
