import test from 'node:test';
import assert from 'node:assert/strict';
import { filterItems, getSummary, isLowStock, loadItems, normalizeItem, saveItems, STORAGE_KEY } from '../src/inventory-model.js';

const sample = [
  { id: 'a', name: 'Keyboard', sku: 'KB-1', category: 'Electronics', quantity: 12, reorderLevel: 5, unitPrice: 25 },
  { id: 'b', name: 'Notebook', sku: 'NB-2', category: 'Office', quantity: 2, reorderLevel: 3, unitPrice: 4.5 }
];

test('inventory totals and low stock are calculated from quantities', () => {
  assert.deepEqual(getSummary(sample), { products: 2, units: 14, lowStock: 1, value: 309 });
  assert.equal(isLowStock(sample[1]), true);
  assert.equal(isLowStock(sample[0]), false);
});

test('search matches name, SKU, and category with low stock filtering', () => {
  assert.deepEqual(filterItems(sample, 'kb-1', 'all'), [sample[0]]);
  assert.deepEqual(filterItems(sample, 'office', 'low'), [sample[1]]);
  assert.deepEqual(filterItems(sample, '', 'low'), [sample[1]]);
});

test('product input is trimmed and rejects invalid stock values', () => {
  const item = normalizeItem({ name: '  Keyboard ', sku: ' KB-1 ', category: ' Office ', quantity: '4', reorderLevel: '5', unitPrice: '9.99' }, 'a');
  assert.equal(item.id, 'a');
  assert.equal(item.name, 'Keyboard');
  assert.equal(item.unitPrice, 9.99);
  assert.throws(() => normalizeItem({ name: 'X', sku: 'X', quantity: '-1', reorderLevel: '0', unitPrice: '1' }), /Quantity/);
  assert.throws(() => normalizeItem({ name: 'X', sku: 'X', quantity: '1.2', reorderLevel: '0', unitPrice: '1' }), /Quantity/);
  assert.throws(() => normalizeItem({ name: 'X', sku: 'X', quantity: '', reorderLevel: '0', unitPrice: '1' }), /Quantity/);
});

test('saved inventory survives reload and corrupt storage is ignored', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  saveItems(sample, storage);
  assert.deepEqual(loadItems(storage), sample);
  values.set(STORAGE_KEY, '{');
  assert.deepEqual(loadItems(storage), []);
});
