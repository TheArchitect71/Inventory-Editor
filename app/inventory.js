export const STORAGE_KEY = 'inventory-editor.items.v1';

export function normalizeItem(input, existingId) {
  const name = String(input.name ?? '').trim();
  const sku = String(input.sku ?? '').trim();
  const category = String(input.category ?? '').trim();
  const quantity = Number(input.quantity);
  const reorderLevel = Number(input.reorderLevel);
  const unitPrice = Number(input.unitPrice);

  if (!name) throw new Error('Enter a product name.');
  if (!sku) throw new Error('Enter a SKU.');
  if (input.quantity === '' || !Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Quantity must be a whole number of 0 or more.');
  if (input.reorderLevel === '' || !Number.isSafeInteger(reorderLevel) || reorderLevel < 0) throw new Error('Low stock threshold must be a whole number of 0 or more.');
  if (input.unitPrice === '' || !Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('Unit price must be 0 or more.');

  return {
    id: existingId ?? crypto.randomUUID(),
    name,
    sku,
    category,
    quantity,
    reorderLevel,
    unitPrice: Math.round(unitPrice * 100) / 100,
    updatedAt: new Date().toISOString()
  };
}

export function loadItems(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

function isItem(item) {
  return item && typeof item.id === 'string' && typeof item.name === 'string' &&
    typeof item.sku === 'string' && typeof item.category === 'string' &&
    Number.isSafeInteger(item.quantity) && item.quantity >= 0 &&
    Number.isSafeInteger(item.reorderLevel) && item.reorderLevel >= 0 &&
    Number.isFinite(item.unitPrice) && item.unitPrice >= 0;
}

export function saveItems(items, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isLowStock(item) {
  return item.quantity <= item.reorderLevel;
}

export function getSummary(items) {
  return {
    products: items.length,
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    lowStock: items.filter(isLowStock).length,
    value: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  };
}

export function filterItems(items, query, stockFilter) {
  const term = query.trim().toLocaleLowerCase();
  return items.filter(item => {
    if (stockFilter === 'low' && !isLowStock(item)) return false;
    if (!term) return true;
    return [item.name, item.sku, item.category].some(value => value.toLocaleLowerCase().includes(term));
  });
}
