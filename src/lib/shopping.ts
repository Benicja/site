
export interface ShoppingItem {
  id: string;
  name: string;      // Display name: e.g. "375g Butter"
  baseItem: string;  // Normalized name: e.g. "Butter"
  amount: number | null;
  unit: string | null;
  category: string;
  checked: boolean;
}

export const CATEGORY_ORDER = [
  'Fruit & Veg',
  'Meat & Fish',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Pantry',
  'Frozen',
  'Other'
] as const;

export type Category = typeof CATEGORY_ORDER[number];

const CATEGORY_MAPPING: Record<string, Category> = {
  // Fruit & Veg
  'onion': 'Fruit & Veg',
  'garlic': 'Fruit & Veg',
  'aubergine': 'Fruit & Veg',
  'lemon': 'Fruit & Veg',
  'berry': 'Fruit & Veg',
  'berries': 'Fruit & Veg',
  'strawberry': 'Fruit & Veg',
  'raspberry': 'Fruit & Veg',
  'blueberry': 'Fruit & Veg',
  'blackberry': 'Fruit & Veg',
  'carrot': 'Fruit & Veg',
  'potato': 'Fruit & Veg',
  'tomato': 'Fruit & Veg',
  'pepper': 'Fruit & Veg',
  'cucumber': 'Fruit & Veg',
  'lettuce': 'Fruit & Veg',
  'spinach': 'Fruit & Veg',
  'broccoli': 'Fruit & Veg',
  'cauliflower': 'Fruit & Veg',
  'apple': 'Fruit & Veg',
  'banana': 'Fruit & Veg',
  'avocado': 'Fruit & Veg',
  'lime': 'Fruit & Veg',
  'herbs': 'Fruit & Veg',
  'thyme': 'Fruit & Veg',
  'rosemary': 'Fruit & Veg',
  'parsley': 'Fruit & Veg',
  'coriander': 'Fruit & Veg',
  'cilantro': 'Fruit & Veg',
  'ginger': 'Fruit & Veg',
  'chili': 'Fruit & Veg',
  'mushroom': 'Fruit & Veg',
  'zucchini': 'Fruit & Veg',
  'courgette': 'Fruit & Veg',
  'leek': 'Fruit & Veg',
  'spring onion': 'Fruit & Veg',
  'scallion': 'Fruit & Veg',
  'orange': 'Fruit & Veg',
  'fruit': 'Fruit & Veg',

  // Meat & Fish
  'beef': 'Meat & Fish',
  'chicken': 'Meat & Fish',
  'pork': 'Meat & Fish',
  'lamb': 'Meat & Fish',
  'turkey': 'Meat & Fish',
  'bacon': 'Meat & Fish',
  'sausage': 'Meat & Fish',
  'ham': 'Meat & Fish',
  'mince': 'Meat & Fish',
  'steak': 'Meat & Fish',
  'chorizo': 'Meat & Fish',
  'patty': 'Meat & Fish',
  'patties': 'Meat & Fish',

  // Fish
  'salmon': 'Meat & Fish',
  'cod': 'Meat & Fish',
  'prawn': 'Meat & Fish',
  'shrimp': 'Meat & Fish',
  'tuna': 'Meat & Fish',
  'haddock': 'Meat & Fish',
  'sea bass': 'Meat & Fish',

  // Dairy & Eggs
  'milk': 'Dairy & Eggs',
  'egg': 'Dairy & Eggs',
  'butter': 'Dairy & Eggs',
  'cheese': 'Dairy & Eggs',
  'mozzarella': 'Dairy & Eggs',
  'parmesan': 'Dairy & Eggs',
  'cheddar': 'Dairy & Eggs',
  'yogurt': 'Dairy & Eggs',
  'cream': 'Dairy & Eggs',
  'sour cream': 'Dairy & Eggs',
  'feta': 'Dairy & Eggs',
  'halloumi': 'Dairy & Eggs',
  'mascarpone': 'Dairy & Eggs',

  // Bakery
  'bread': 'Bakery & Bread',
  'baguette': 'Bakery & Bread',
  'roll': 'Bakery & Bread',
  'bun': 'Bakery & Bread',
  'tortilla': 'Bakery & Bread',
  'pitta': 'Bakery & Bread',
  'pastry': 'Bakery & Bread',
  'dough': 'Bakery & Bread',
  'croissant': 'Bakery & Bread',
  'lasagne sheets': 'Bakery & Bread',

  // Pantry
  'flour': 'Pantry',
  'sugar': 'Pantry',
  'salt': 'Pantry',
  'oil': 'Pantry',
  'vinegar': 'Pantry',
  'rice': 'Pantry',
  'pasta': 'Pantry',
  'spices': 'Pantry',
  'pepper': 'Pantry',
  'powder': 'Pantry',
  'syrup': 'Pantry',
  'honey': 'Pantry',
  'tahini': 'Pantry',
  'stock': 'Pantry',
  'sauce': 'Pantry',
  'paste': 'Pantry',
  'bean': 'Pantry',
  'lentil': 'Pantry',
  'chickpea': 'Pantry',
  'nut': 'Pantry',
  'seed': 'Pantry',
  'oats': 'Pantry',
  'cereal': 'Pantry',
  'cracker': 'Pantry',
  'tea': 'Pantry',
  'coffee': 'Pantry',
  'starch': 'Pantry',
  'powder': 'Pantry',
  'cumin': 'Pantry',
  'turmeric': 'Pantry',
  'paprika': 'Pantry',
  'cinnamon': 'Pantry',
  'mustard': 'Pantry',
  'yeast': 'Pantry',
  'gherkin': 'Pantry',
  'extract': 'Pantry',
  'essence': 'Pantry',
  'saffron': 'Pantry',
  'sweetcorn': 'Pantry',
};

const STRIP_WORDS = [
  'cold', 'softened', 'diced', 'chopped', 'fresh', 'dried', 'ground', 
  'minced', 'plain', 'grated', 'buffalo', 'cloves', 'paste', 'juice of', 'zest of',
  'handful', 'pinch', 'clove', 'head', 'stalk', 'bunch', 'whole', 'cubed', 'melted', 'beaten',
  'cooked', 'unsalted', 'salted', 'chilled', 'room temperature', 'warm', 'hot', 'cold'
];

const STAPLE_UNITS = ['tsp', 'tbsp', 'pinch', 'handful', 'clove', 'cloves'];
const STAPLE_KEYWORDS = [
  'oil', 'vinegar', 'salt', 'pepper', 'honey', 'syrup', 'sauce', 'stock', 
  'paste', 'extract', 'essence', 'starch', 'powder', 'cumin', 'turmeric', 
  'paprika', 'cinnamon', 'mustard', 'spice', 'curry', 'juice'
];

export function formatQuantity(amount: number, allowFractions: boolean = true): string {
  if (!allowFractions) {
    return (Math.round(amount * 100) / 100).toString();
  }

  const whole = Math.floor(amount);
  const decimal = amount - whole;
  
  // Round to handle floating point issues (e.g. 0.333333333)
  const roundedDecimal = Math.round(decimal * 100) / 100;
  
  let fraction = '';
  if (roundedDecimal === 0.5) fraction = '½';
  else if (roundedDecimal === 0.25) fraction = '¼';
  else if (roundedDecimal === 0.75) fraction = '¾';
  else if (roundedDecimal === 0.33 || roundedDecimal === 0.3) fraction = '⅓';
  else if (roundedDecimal === 0.66 || roundedDecimal === 0.67) fraction = '⅔';
  
  if (fraction) {
    return whole > 0 ? `${whole}${fraction}` : fraction;
  }
  
  return (Math.round(amount * 100) / 100).toString();
}

export function shouldHideAmount(baseItem: string, amount: number | null, unit: string | null, category: string): boolean {
  if (category !== 'Pantry') return false;
  
  const lowerItem = baseItem.toLowerCase();
  
  // Always hide for core staples like oil, salt, pepper regardless of unit
  if (STAPLE_KEYWORDS.some(k => lowerItem.includes(k))) return true;
  
  // Hide for other pantry items if the unit is "small" or missing
  if (!unit || STAPLE_UNITS.includes(unit.toLowerCase())) return true;
  
  // Hide for small gram/ml amounts in pantry (e.g. < 100g flour is probably just "check if you have flour")
  if ((unit === 'g' || unit === 'ml') && amount !== null && amount < 150) return true;
  
  return false;
}

export function normalizeIngredient(amountStr: string, itemStr: string) {
  // 1. Normalize Item Name
  let baseItem = itemStr.toLowerCase();
  
  // Remove suffixes in parentheses
  baseItem = baseItem.replace(/\(.*\)/g, '').trim();

  // Remove everything after a comma (e.g. "Eggs, Beaten" -> "Eggs")
  if (baseItem.includes(',')) {
    baseItem = baseItem.split(',')[0];
  }

  // Remove everything after " for " (e.g. "Butter For Greasing" -> "Butter")
  if (baseItem.includes(' for ')) {
    baseItem = baseItem.split(' for ')[0];
  }

  // Specific rules for eggs
  if (baseItem === 'egg yolk' || baseItem === 'egg white' || baseItem === 'egg yolks' || baseItem === 'egg whites') {
    baseItem = 'egg';
  }

  // Filter out water (you don't buy water!)
  if (baseItem === 'water') {
    return null;
  }
  
  // Strip descriptive words
  STRIP_WORDS.forEach(word => {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    baseItem = baseItem.replace(reg, '');
  });
  
  // Clean up and title case every word
  baseItem = baseItem.trim().replace(/\s+/g, ' ');
  if (!baseItem) baseItem = itemStr; // Fallback

  // Title Case every word
  const titleCased = baseItem
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // 2. Parse Amount and Unit
  let amount: number | null = null;
  let unit: string | null = null;

  if (amountStr) {
    // Look for a number (inc. fractions)
    const numMatch = amountStr.match(/(\d+\/\d+|\d+(\.\d+)?)/);
    
    if (numMatch) {
      const numPart = numMatch[0];
      if (numPart.includes('/')) {
        const [num, den] = numPart.split('/').map(n => parseFloat(n));
        amount = num / den;
      } else {
        amount = parseFloat(numPart);
      }

      // Extract unit from what's left
      const remaining = amountStr.replace(numPart, '').trim();
      const unitMatch = remaining.match(/[a-zA-Z]+/);
      if (unitMatch) {
        unit = unitMatch[0].toLowerCase();
      }
    }
  }

  // 3. Assign Category
  let category: Category = 'Other';
  const lowercaseBase = titleCased.toLowerCase();
  
  const pantryKeywords = [
    'starch', 'powder', 'juice', 'vinegar', 'oil', 'salt', 'pepper', 'sugar', 'flour', 
    'honey', 'syrup', 'sauce', 'paste', 'stock', 'cumin', 'turmeric', 'paprika', 
    'cinnamon', 'mustard', 'spice', 'curry', 'yeast', 'extract', 'essence', 'saffron', 'gherkin',
    'sweetcorn'
  ];

  // Prioritize Frozen if the name contains "frozen"
  if (lowercaseBase.includes('frozen')) {
    category = 'Frozen';
  } else if (pantryKeywords.some(pk => lowercaseBase.includes(pk))) {
    category = 'Pantry';
  } else {
    for (const [key, cat] of Object.entries(CATEGORY_MAPPING)) {
      if (lowercaseBase.includes(key)) {
        category = cat;
        break;
      }
    }
  }

  return {
    amount,
    unit,
    baseItem: titleCased,
    category
  };
}

export function formatItemName(baseItem: string, amount: number | null, unit: string | null, category: string): string {
  if (amount === null) return baseItem;

  // Use shouldHideAmount to see if we should just show the name (e.g. for "Sunflower Oil")
  if (shouldHideAmount(baseItem, amount, unit, category)) {
    return baseItem;
  }

  let finalAmount = amount;
  let finalUnit = unit;

  // Convert large amounts to kg or L
  if (unit && amount >= 1000) {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit === 'g') {
      finalAmount = amount / 1000;
      finalUnit = 'kg';
    } else if (lowerUnit === 'ml') {
      finalAmount = amount / 1000;
      finalUnit = 'L';
    }
  }
  
  const displayAmount = formatQuantity(finalAmount, !finalUnit);
  
  if (finalUnit) {
    return `${displayAmount}${finalUnit} ${baseItem}`.trim();
  }
  
  // No unit? Use "x" prefix if > 1
  if (displayAmount !== '1') {
    return `x${displayAmount} ${baseItem}`;
  }
  
  return baseItem;
}

function itemsAreEqual(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;

  // Simple singularization/pluralization check
  function getBase(s: string) {
    if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
    // Handle 'es' for things like 'Potatoes' or 'Tomatoes'
    if (s.endsWith('es') && (s.endsWith('oes') || s.endsWith('hes') || s.endsWith('ses'))) return s.slice(0, -2);
    if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
    return s;
  }

  const b1 = getBase(n1);
  const b2 = getBase(n2);

  // Direct comparison of base forms
  if (b1 === b2) return true;

  // Final check for containment to handle cases like "Chicken Breast" vs "Chicken Breasts"
  // where one might be a multi-word string.
  return b1.startsWith(b2) || b2.startsWith(b1);
}

export function aggregateIngredients(currentItems: ShoppingItem[], newIngredients: { amount: string, item: string }[]): ShoppingItem[] {
  const updatedList = [...currentItems];
  
  newIngredients.forEach(ing => {
    const normalized = normalizeIngredient(ing.amount, ing.item);
    if (!normalized) return; // Skip if water or filtered out
    
    // Find if an identical (or singular/plural match) base item + unit already exists (and is not checked)
    const existingIndex = updatedList.findIndex(item => 
      !item.checked && 
      itemsAreEqual(item.baseItem, normalized.baseItem) && 
      item.unit === normalized.unit
    );

    if (existingIndex > -1) {
      // Aggregate! 
      const existing = updatedList[existingIndex];
      
      // If it's a "hide amount" item (e.g. oil), don't increment the number/name, just keep it as single name
      if (shouldHideAmount(existing.baseItem, existing.amount, existing.unit, existing.category)) {
          // do nothing, existing is already "Sunflower Oil"
      } else {
        const a1 = existing.amount === null ? 1 : existing.amount;
        const a2 = normalized.amount === null ? 1 : normalized.amount;
        const newAmount = a1 + a2;
        
        updatedList[existingIndex] = {
          ...existing,
          amount: newAmount,
          name: formatItemName(existing.baseItem, newAmount, existing.unit, existing.category)
        };
      }
    } else {
      // Add as new item
      updatedList.push({
        id: Date.now() + Math.random().toString(16),
        name: formatItemName(normalized.baseItem, normalized.amount, normalized.unit, normalized.category),
        baseItem: normalized.baseItem,
        amount: normalized.amount,
        unit: normalized.unit,
        category: normalized.category,
        checked: false
      });
    }
  });

  return updatedList;
}
