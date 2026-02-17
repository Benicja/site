import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  type ShoppingItem, 
  CATEGORY_ORDER, 
  normalizeIngredient, 
  aggregateIngredients,
  formatQuantity,
  shouldHideAmount
} from '../lib/shopping';
import { toast } from '../lib/notifications';

const STORAGE_KEY = 'benicja_shopping_list';
const UTILITY_STORAGE_KEY = 'benicja_utility_list';

function loadList(key: string): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveList(key: string, list: ShoppingItem[]) {
  localStorage.setItem(key, JSON.stringify(list));
}

export default function ShoppingList({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [utilityItems, setUtilityItems] = useState<ShoppingItem[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'shopping' | 'utility'>('shopping');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Log state for debugging
  useEffect(() => {
    console.log('ShoppingList state:', { activeTab, itemsCount: items.length, utilityItemsCount: utilityItems.length, open });
  }, [activeTab, items.length, utilityItems.length, open]);

  // List to display/modify based on active tab
  const currentList = activeTab === 'shopping' ? items : utilityItems;
  const setCurrentList = activeTab === 'shopping' ? setItems : setUtilityItems;

  useEffect(() => {
    if (open) {
      setItems(loadList(STORAGE_KEY));
      const loaded = loadList(UTILITY_STORAGE_KEY);
      
      // Populate default utility items if empty
      if (loaded.length === 0) {
        const defaultItems = [
          { amount: '', item: 'Grapes' },
          { amount: '6', item: 'Bell Peppers' },
          { amount: '', item: 'Broccoli' },
          { amount: '', item: 'Greek Yoghurt' },
          { amount: '', item: 'Toilet Paper' },
          { amount: '', item: 'Shower Gel' },
          { amount: '', item: 'Protein Oats' },
          { amount: '', item: 'Deodorant' },
          { amount: '', item: 'Hand Soap' },
          { amount: '', item: 'Toothpaste' },
          { amount: '', item: 'Kitchen Towel' },
          { amount: '', item: 'Sweetcorn' }
        ];
        const populated = aggregateIngredients([], defaultItems);
        setUtilityItems(populated);
        saveList(UTILITY_STORAGE_KEY, populated);
      } else {
        setUtilityItems(loaded);
      }
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      saveList(STORAGE_KEY, items);
    }
  }, [items, open]);

  useEffect(() => {
    if (open) {
      saveList(UTILITY_STORAGE_KEY, utilityItems);
    }
  }, [utilityItems, open]);

  function addItem(text: string) {
    if (!text.trim()) return;
    
    // Use aggregateIngredients to handle normalization and potential merging
    const newIngredient = { amount: '', item: text.trim() };
    const updated = aggregateIngredients(currentList, [newIngredient]);
    setCurrentList(updated);
    setInput('');
  }

  function removeItem(id: string) {
    setCurrentList(list => list.filter(item => item.id !== id));
  }

  function moveItemsToShopping(itemsToMove: ShoppingItem[]) {
    console.log('moveItemsToShopping called with:', itemsToMove);
    if (itemsToMove.length === 0) return;
    // Convert utility items to ingredient format for aggregateIngredients
    const itemsToAdd = itemsToMove.map(item => {
      // Reconstruct the amount string from amount and unit (e.g., "6kg" or "1.5L")
      let amountStr = '';
      if (item.amount !== null && item.amount !== undefined) {
        amountStr = String(item.amount);
        if (item.unit) {
          amountStr += item.unit;
        }
      }
      return {
        amount: amountStr,
        item: item.baseItem
      };
    });
    console.log('itemsToAdd:', itemsToAdd);
    const updated = aggregateIngredients(items, itemsToAdd);
    console.log('updated shopping list:', updated);
    setItems(updated);
    const message = itemsToMove.length === 1 
      ? `Added ${itemsToMove[0].baseItem} to Shopping List`
      : `Added ${itemsToMove.length} items to Shopping List`;
    toast(message, 'success', itemsToMove.length);
  }

  function startEditing(item: ShoppingItem, displayQty: string) {
    setEditingId(item.id);
    setEditValue(displayQty ? `${displayQty} ${item.baseItem}` : item.baseItem);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValue('');
  }

  function saveEdit(id: string) {
    if (!editValue.trim()) {
      removeItem(id);
    } else {
      const trimmed = editValue.trim();
      // Parse quantity and item name (e.g., "x4 Garlic" or "1kg Flour" or "Garlic")
      const isCountMatch = trimmed.match(/^x([0-9.]+)\s+(.+)$/);
      const qtyMatch = trimmed.match(/^([0-9.]+)\s*([a-z]*)\s+(.+)$/i);
      
      let newAmount: number | null = null;
      let newUnit: string | null = null;
      let newBaseItem = trimmed;
      
      if (isCountMatch) {
        // Format: "x4 Garlic"
        newAmount = parseFloat(isCountMatch[1]);
        newUnit = null;
        newBaseItem = isCountMatch[2];
      } else if (qtyMatch) {
        // Format: "1 kg Flour" or "500ml Oil"
        newAmount = parseFloat(qtyMatch[1]);
        newUnit = qtyMatch[2] || null;
        newBaseItem = qtyMatch[3];
      }
      
      setCurrentList(list => list.map(item => {
        if (item.id === id) {
          const updated = { ...item, baseItem: newBaseItem };
          if (newAmount !== null) updated.amount = newAmount;
          if (newUnit !== null) updated.unit = newUnit;
          return updated;
        }
        return item;
      }));
    }
    setEditingId(null);
  }

  function toggleItem(id: string) {
    setCurrentList(list => list.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  }

  function clearList() {
    setCurrentList([]);
  }

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    
    currentList.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    // Sort categories based on CATEGORY_ORDER
    return Object.entries(groups).sort(([a], [b]) => {
      const indexA = CATEGORY_ORDER.indexOf(a as any);
      const indexB = CATEGORY_ORDER.indexOf(b as any);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [currentList]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1000000] flex items-end justify-center md:items-center bg-black/20 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl px-4 py-3 relative animate-fadeInUp flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-900 text-2xl font-bold z-10"
          onClick={onClose}
          aria-label="Close shopping list"
        >
          ×
        </button>

        <div className="flex p-1 bg-gray-100 rounded-xl mb-2 mr-8">
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'shopping' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Shopping List
          </button>
          <button
            onClick={() => setActiveTab('utility')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'utility' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Utility
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-200 relative">
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
              <svg className="w-12 h-12 stroke-current opacity-20" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p className="text-sm font-medium">Your list is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {activeTab === 'utility' && utilityItems.length > 0 && (
                  <button
                    onClick={() => moveItemsToShopping(utilityItems)}
                    className="w-full py-2 px-3 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Add All to Shopping
                  </button>
                )}
                {activeTab === 'utility' ? (
                  <ul className="grid gap-0.5">
                    {currentList.map(item => {
                      const showAmount = item.amount !== null && !shouldHideAmount(item.baseItem, item.amount, item.unit, item.category);
                      
                      let displayQty = '';
                      if (showAmount && item.amount !== null) {
                        let finalAmount = item.amount;
                        let finalUnit = item.unit;
                        if (item.unit && item.amount >= 1000) {
                          const lowerUnit = item.unit.toLowerCase();
                          if (lowerUnit === 'g') {
                            finalAmount = item.amount / 1000;
                            finalUnit = 'kg';
                          } else if (lowerUnit === 'ml') {
                            finalAmount = item.amount / 1000;
                            finalUnit = 'L';
                          }
                        }
                        
                        const qtyStr = formatQuantity(finalAmount, !finalUnit);
                        const isAbbreviation = finalUnit && /^(g|ml|kg|l)$/i.test(finalUnit);
                        displayQty = finalUnit ? (isAbbreviation ? `${qtyStr}${finalUnit}` : `${qtyStr} ${finalUnit}`) : `x${qtyStr}`;
                        if (displayQty === 'x1') displayQty = '';
                      }

                      return (
                        <li key={item.id} className="flex items-center gap-3 p-1 group hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleItem(item.id)}
                              className="peer appearance-none w-[18px] h-[18px] border-2 border-gray-200 rounded-[3px] checked:bg-gray-900 checked:border-gray-900 transition-all cursor-pointer"
                            />
                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {editingId === item.id ? (
                            <input
                              className="flex-1 text-[13px] font-medium bg-white border border-gray-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-gray-900/50"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(item.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(item.id);
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              autoFocus
                            />
                          ) : (
                            <>
                              <span 
                                className={
                                  `flex-1 text-[13px] font-medium transition-all cursor-pointer ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`
                                }
                                onClick={() => startEditing(item, displayQty)}
                              >
                                {displayQty && (
                                  <span className={`mr-1.5 tabular-nums ${item.checked ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {displayQty}
                                  </span>
                                )}
                                {item.baseItem}
                              </span>
                              <button
                                className="bg-gray-900 text-white hover:bg-gray-800 transition-all p-1 rounded"
                                onClick={() => moveItemsToShopping([item])}
                                aria-label="Add to Shopping"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </button>
                              <button
                                className="text-gray-400 hover:text-red-500 transition-all p-0.5"
                                onClick={() => removeItem(item.id)}
                                aria-label="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  groupedItems.map(([category, catItems]) => (
                    <div key={category} className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                      {category}
                    </h3>
                    <ul className="grid gap-0.5">
                      {catItems.map(item => {
                        const showAmount = item.amount !== null && !shouldHideAmount(item.baseItem, item.amount, item.unit, item.category);
                        
                        let displayQty = '';
                        if (showAmount && item.amount !== null) {
                          let finalAmount = item.amount;
                          let finalUnit = item.unit;
                          if (item.unit && item.amount >= 1000) {
                            const lowerUnit = item.unit.toLowerCase();
                            if (lowerUnit === 'g') {
                              finalAmount = item.amount / 1000;
                              finalUnit = 'kg';
                            } else if (lowerUnit === 'ml') {
                              finalAmount = item.amount / 1000;
                              finalUnit = 'L';
                            }
                          }
                          
                          const qtyStr = formatQuantity(finalAmount, !finalUnit);
                          const isAbbreviation = finalUnit && /^(g|ml|kg|l)$/i.test(finalUnit);
                          displayQty = finalUnit ? (isAbbreviation ? `${qtyStr}${finalUnit}` : `${qtyStr} ${finalUnit}`) : `x${qtyStr}`;
                          if (displayQty === 'x1') displayQty = '';
                        }

                        return (
                          <li key={item.id} className="flex items-center gap-3 p-1 group hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleItem(item.id)}
                                className="peer appearance-none w-[18px] h-[18px] border-2 border-gray-200 rounded-[3px] checked:bg-gray-900 checked:border-gray-900 transition-all cursor-pointer"
                              />
                              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            {editingId === item.id ? (
                              <input
                                className="flex-1 text-[13px] font-medium bg-white border border-gray-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-gray-900/50"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() => saveEdit(item.id)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEdit(item.id);
                                  if (e.key === 'Escape') cancelEditing();
                                }}
                                autoFocus
                              />
                            ) : (
                              <>
                                <span 
                                  className={
                                    `flex-1 text-[13px] font-medium transition-all cursor-pointer ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`
                                  }
                                  onClick={() => startEditing(item, displayQty)}
                                >
                                  {displayQty && (
                                    <span className={`mr-1.5 tabular-nums ${item.checked ? 'text-gray-400' : 'text-gray-900'}`}>
                                      {displayQty}
                                    </span>
                                  )}
                                  {item.baseItem}
                                </span>
                                <button
                                  className="text-gray-400 hover:text-red-500 transition-all p-0.5"
                                  onClick={() => removeItem(item.id)}
                                  aria-label="Remove"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 mt-auto space-y-2">
          <form
            onSubmit={e => {
              e.preventDefault();
              addItem(input);
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 border border-gray-200 rounded-xl px-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900/50 bg-gray-50/50"
              placeholder="Add item..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-5 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
            >
              Add
            </button>
          </form>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-gray-400 hover:text-red-500 px-1 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center whitespace-nowrap"
              onClick={clearList}
              disabled={currentList.length === 0}
              title="Clear All"
            >
              Clear All
            </button>
            {currentList.length > 0 && (
              <span className="text-[10px] font-black text-gray-400 tabular-nums uppercase tracking-widest px-1">
                {currentList.filter(i => i.checked).length} / {currentList.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
