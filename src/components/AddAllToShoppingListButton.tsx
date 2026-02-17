import React, { useState } from 'react';
import { toast } from '../lib/notifications';
import { aggregateIngredients, type ShoppingItem } from '../lib/shopping';

interface Ingredient {
  amount: string;
  item: string;
}

interface Props {
  ingredients: Ingredient[];
  className?: string;
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

export default function AddAllToShoppingListButton({ ingredients, className = '' }: Props) {
  const [isSpinning, setIsSpinning] = useState(false);

  function handleAddAll() {
    const current = loadList();
    const updated = aggregateIngredients(current, ingredients);
    
    // Check how many items were actually added or changed
    const addedCount = updated.length - current.length;
    const changedCount = updated.filter((item, idx) => 
      idx < current.length && JSON.stringify(item) !== JSON.stringify(current[idx])
    ).length;

    saveList(updated);
    
    // Always trigger spin for visual feedback!
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 500);

    if (addedCount > 0 || changedCount > 0) {
      const msg = addedCount > 0 
        ? `${addedCount} new item${addedCount > 1 ? 's' : ''} added ${changedCount > 0 ? `& ${changedCount} updated` : ''}`
        : `${changedCount} item${changedCount > 1 ? 's' : ''} updated`;
      toast(msg, 'success', addedCount);
    } else {
      toast('All ingredients already in shopping list!', 'info', 0);
    }
  }

  return (
    <>
      <button
        className={`w-full justify-center bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors flex items-center gap-2 ${className}`}
        onClick={handleAddAll}
        type="button"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin-once {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-once {
            animation: spin-once 0.5s ease-in-out;
          }
        `}} />
        <svg className={`w-5 h-5 ${isSpinning ? 'animate-spin-once' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
        </svg>
        Add All to Shopping
      </button>
    </>
  );
}
