import './styles.css';
import { filterItems, getSummary, isLowStock, loadItems, normalizeItem, saveItems } from './inventory.js';

const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const integer = new Intl.NumberFormat();
const app = document.querySelector('#app');
let items = loadItems();
let query = '';
let stockFilter = 'all';
let editingId = null;

app.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar" aria-label="Main navigation">
      <div class="brand"><span class="brand-mark" aria-hidden="true">▦</span><span>Inventory<br><strong>Editor</strong></span></div>
      <div class="sidebar-label">WORKSPACE</div>
      <a class="nav-item active" href="#inventory" aria-current="page"><span aria-hidden="true">▤</span> Inventory</a>
      <div class="sidebar-footer"><span class="status-dot" aria-hidden="true"></span> Saved on this device</div>
    </aside>

    <main id="inventory" class="main-content">
      <header class="topbar"><span>Workspace <span class="crumb">/</span> Inventory</span><span class="topbar-right"><span class="status-dot" aria-hidden="true"></span> Local workspace</span></header>
      <div class="content">
        <div class="page-heading">
          <div><p class="eyebrow">YOUR WORKSPACE</p><h1>Inventory</h1><p class="subtitle">Keep track of what you have, what is running low, and what it is worth.</p></div>
          <button class="button primary add-top" id="add-item" type="button"><span aria-hidden="true">＋</span> Add product</button>
        </div>

        <section class="stats" aria-label="Inventory summary">
          <article class="stat-card"><p>Total products</p><strong id="stat-products">0</strong><span>Distinct items</span></article>
          <article class="stat-card"><p>Units in stock</p><strong id="stat-units">0</strong><span>Across all products</span></article>
          <article class="stat-card"><p>Low stock</p><strong id="stat-low">0</strong><span>At or below threshold</span></article>
          <article class="stat-card"><p>Inventory value</p><strong id="stat-value">$0.00</strong><span>Quantity × unit price</span></article>
        </section>

        <section class="inventory-panel" aria-labelledby="list-title">
          <div class="panel-heading"><div><h2 id="list-title">Products</h2><p id="list-description">Manage your inventory in one place.</p></div><button class="button quiet" id="export-items" type="button">Export JSON</button></div>
          <div class="toolbar">
            <label class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span><span class="sr-only">Search products</span><input id="search" type="search" placeholder="Search name, SKU, or category" autocomplete="off"></label>
            <div class="filter-group" role="group" aria-label="Stock filter"><button type="button" class="filter active" data-filter="all" aria-pressed="true">All products</button><button type="button" class="filter" data-filter="low" aria-pressed="false">Low stock</button></div>
          </div>
          <div class="table-scroll"><table><thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Category</th><th scope="col" class="number">In stock</th><th scope="col" class="number">Unit price</th><th scope="col">Status</th><th scope="col" class="actions-heading">Actions</th></tr></thead><tbody id="products-body"></tbody></table></div>
          <div id="empty-state" class="empty-state" hidden></div>
          <footer class="panel-footer"><span id="result-count">0 products</span><span>Changes save automatically in this browser</span></footer>
        </section>
      </div>
    </main>
  </div>

  <dialog id="item-dialog" aria-labelledby="dialog-title">
    <form id="item-form" novalidate>
      <div class="dialog-heading"><div><p class="eyebrow">INVENTORY ITEM</p><h2 id="dialog-title">Add product</h2></div><button type="button" class="icon-button" id="close-dialog" aria-label="Close">×</button></div>
      <div class="dialog-body">
        <label>Product name <span aria-hidden="true">*</span><input name="name" required maxlength="100" placeholder="e.g. Wireless keyboard"></label>
        <div class="field-row"><label>SKU <span aria-hidden="true">*</span><input name="sku" required maxlength="60" placeholder="e.g. KB-001"></label><label>Category<input name="category" maxlength="60" placeholder="e.g. Electronics"></label></div>
        <div class="field-row"><label>Quantity<input name="quantity" type="number" min="0" step="1" value="0" required></label><label>Low stock threshold<input name="reorderLevel" type="number" min="0" step="1" value="5" required></label></div>
        <label>Unit price (USD)<input name="unitPrice" type="number" min="0" step="0.01" value="0" required></label>
        <p class="form-error" id="form-error" role="alert" hidden></p>
      </div>
      <div class="dialog-footer"><button type="button" class="button quiet" id="cancel-dialog">Cancel</button><button type="submit" class="button primary" id="save-button">Add product</button></div>
    </form>
  </dialog>
  <div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
`;

const byId = id => document.getElementById(id);
const dialog = byId('item-dialog');
const form = byId('item-form');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function render() {
  const summary = getSummary(items);
  byId('stat-products').textContent = integer.format(summary.products);
  byId('stat-units').textContent = integer.format(summary.units);
  byId('stat-low').textContent = integer.format(summary.lowStock);
  byId('stat-value').textContent = money.format(summary.value);

  const visible = filterItems(items, query, stockFilter).sort((a, b) => a.name.localeCompare(b.name));
  byId('products-body').innerHTML = visible.map(item => `
    <tr>
      <td><div class="product-name">${escapeHtml(item.name)}</div></td>
      <td class="sku">${escapeHtml(item.sku)}</td>
      <td>${escapeHtml(item.category || '—')}</td>
      <td class="number quantity">${integer.format(item.quantity)}</td>
      <td class="number">${money.format(item.unitPrice)}</td>
      <td><span class="status ${isLowStock(item) ? 'status-low' : 'status-ok'}">${isLowStock(item) ? 'Low stock' : 'In stock'}</span></td>
      <td class="row-actions"><button type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.name)}">Edit</button><button type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}">Delete</button></td>
    </tr>`).join('');

  const empty = byId('empty-state');
  const table = document.querySelector('.table-scroll');
  empty.hidden = visible.length > 0;
  table.hidden = visible.length === 0;
  if (visible.length === 0) {
    empty.innerHTML = items.length === 0
      ? '<div class="empty-icon" aria-hidden="true">▦</div><h3>Your inventory starts here</h3><p>Add a product to begin tracking stock and value.</p><button type="button" class="button primary" id="add-empty">Add your first product</button>'
      : '<div class="empty-icon" aria-hidden="true">⌕</div><h3>No matching products</h3><p>Try a different search or switch to all products.</p>';
  }
  byId('result-count').textContent = `${visible.length} ${visible.length === 1 ? 'product' : 'products'}`;
}

function openForm(item = null) {
  editingId = item?.id ?? null;
  form.reset();
  byId('form-error').hidden = true;
  byId('dialog-title').textContent = item ? 'Edit product' : 'Add product';
  byId('save-button').textContent = item ? 'Save changes' : 'Add product';
  if (item) {
    for (const key of ['name', 'sku', 'category', 'quantity', 'reorderLevel', 'unitPrice']) form.elements[key].value = item[key];
  }
  dialog.showModal();
  form.elements.name.focus();
}

function persist(nextItems, message) {
  try {
    saveItems(nextItems);
    items = nextItems;
    render();
    byId('announcement').textContent = message;
    return true;
  } catch {
    const error = 'Could not save in this browser. Check that local storage is available.';
    if (dialog.open) {
      byId('form-error').textContent = error;
      byId('form-error').hidden = false;
    } else {
      alert(error);
    }
    return false;
  }
}

byId('add-item').addEventListener('click', () => openForm());
byId('close-dialog').addEventListener('click', () => dialog.close());
byId('cancel-dialog').addEventListener('click', () => dialog.close());
byId('empty-state').addEventListener('click', event => { if (event.target.closest('#add-empty')) openForm(); });
byId('search').addEventListener('input', event => { query = event.target.value; render(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  stockFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(other => {
    const active = other === button;
    other.classList.toggle('active', active);
    other.setAttribute('aria-pressed', String(active));
  });
  render();
}));

byId('products-body').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const item = items.find(candidate => candidate.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === 'edit') openForm(item);
  if (button.dataset.action === 'delete' && confirm(`Delete “${item.name}” from inventory?`)) {
    persist(items.filter(candidate => candidate.id !== item.id), `${item.name} deleted.`);
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  try {
    const item = normalizeItem(values, editingId);
    if (items.some(other => other.sku.toLocaleLowerCase() === item.sku.toLocaleLowerCase() && other.id !== item.id)) {
      throw new Error('That SKU is already in use.');
    }
    const nextItems = editingId ? items.map(other => other.id === editingId ? item : other) : [...items, item];
    if (persist(nextItems, editingId ? `${item.name} updated.` : `${item.name} added.`)) dialog.close();
  } catch (error) {
    byId('form-error').textContent = error.message;
    byId('form-error').hidden = false;
  }
});

byId('export-items').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  byId('announcement').textContent = 'Inventory exported.';
});

render();
