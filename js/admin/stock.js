// ============================================================================
// STOCK MANAGEMENT MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// Handles Stock In & Stock Out
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderStockView() {
  const stockLogs = dbStore.getStockLogs();
  
  // Stat Summary
  const stockInLogs = stockLogs.filter(l => l.type === 'Stock In');
  const stockOutLogs = stockLogs.filter(l => l.type === 'Stock Out');

  const inQty = stockInLogs.reduce((acc, l) => acc + Number(l.quantity || 0), 0);
  const outQty = stockOutLogs.reduce((acc, l) => acc + Number(l.quantity || 0), 0);

  const elIn = document.getElementById('stock-stat-in');
  if (elIn) elIn.innerText = `+${inQty} Units`;

  const elOut = document.getElementById('stock-stat-out');
  if (elOut) elOut.innerText = `-${outQty} Units`;

  renderStockLogsTable(stockLogs);
}

export function filterStockLogs() {
  const query = document.getElementById('stock-search-input')?.value.toLowerCase().trim() || '';
  const typeVal = document.getElementById('stock-type-filter')?.value || 'All';

  let logs = dbStore.getStockLogs();

  if (typeVal !== 'All') {
    logs = logs.filter(l => l.type === typeVal);
  }

  if (query) {
    logs = logs.filter(l => 
      l.productName.toLowerCase().includes(query) || 
      (l.supplier && l.supplier.toLowerCase().includes(query)) ||
      (l.invoiceNumber && l.invoiceNumber.toLowerCase().includes(query))
    );
  }

  renderStockLogsTable(logs);
}

function renderStockLogsTable(logs) {
  const tbody = document.getElementById('stock-logs-table');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 font-semibold">No stock movement logs found</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const isIn = l.type === 'Stock In';
    const badgeClass = isIn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-900/60 transition text-xs">
        <td class="py-3 px-3 font-mono text-slate-400">${l.date}</td>
        <td class="py-3 px-3">
          <span class="font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">${l.type}</span>
        </td>
        <td class="py-3 px-3 font-bold text-white">${l.productName}</td>
        <td class="py-3 px-3 font-black ${isIn ? 'text-emerald-400' : 'text-rose-400'}">${isIn ? '+' : '-'}${l.quantity}</td>
        <td class="py-3 px-3 font-medium text-slate-300">${l.supplier || '---'}</td>
        <td class="py-3 px-3 font-mono text-indigo-400">${l.invoiceNumber || '---'}</td>
        <td class="py-3 px-3 text-slate-400">${l.reason || 'Regular Stock Adjustment'}</td>
      </tr>
    `;
  }).join('');
}

export function openAddStockInModal() {
  const modal = document.getElementById('stock-in-modal');
  if (!modal) return;

  const prodSelect = document.getElementById('stock-in-prod-select');
  const products = dbStore.getProducts();
  if (prodSelect) {
    prodSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (Cur: ${p.stockQty})</option>`).join('');
  }

  document.getElementById('stock-in-form').reset();
  document.getElementById('stock-in-date').value = new Date().toISOString().split('T')[0];
  modal.classList.remove('hidden');
}

export function closeAddStockInModal() {
  document.getElementById('stock-in-modal')?.classList.add('hidden');
}

export function handleStockInSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('stock-in-prod-select').value;
  const quantity = Number(document.getElementById('stock-in-qty').value) || 0;
  const supplier = document.getElementById('stock-in-supplier').value.trim() || 'General Supplier';
  const invoiceNumber = document.getElementById('stock-in-invoice').value.trim() || `SUP-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = document.getElementById('stock-in-date').value;

  const products = dbStore.getProducts();
  const prod = products.find(p => p.id === productId);

  dbStore.addStockLog({
    id: `stk_${Date.now()}`,
    type: 'Stock In',
    productId,
    productName: prod ? prod.name : 'Product',
    quantity,
    supplier,
    invoiceNumber,
    reason: 'Inbound Wholesale Restock',
    date
  });

  closeAddStockInModal();
  renderStockView();
}

export function openStockOutModal() {
  const modal = document.getElementById('stock-out-modal');
  if (!modal) return;

  const prodSelect = document.getElementById('stock-out-prod-select');
  const products = dbStore.getProducts();
  if (prodSelect) {
    prodSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stockQty})</option>`).join('');
  }

  document.getElementById('stock-out-form').reset();
  document.getElementById('stock-out-date').value = new Date().toISOString().split('T')[0];
  modal.classList.remove('hidden');
}

export function closeStockOutModal() {
  document.getElementById('stock-out-modal')?.classList.add('hidden');
}

export function handleStockOutSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('stock-out-prod-select').value;
  const quantity = Number(document.getElementById('stock-out-qty').value) || 0;
  const reason = document.getElementById('stock-out-reason').value || 'Damaged Products';
  const date = document.getElementById('stock-out-date').value;

  const products = dbStore.getProducts();
  const prod = products.find(p => p.id === productId);

  dbStore.addStockLog({
    id: `stk_${Date.now()}`,
    type: 'Stock Out',
    productId,
    productName: prod ? prod.name : 'Product',
    quantity,
    supplier: '---',
    invoiceNumber: '---',
    reason,
    date
  });

  closeStockOutModal();
  renderStockView();
}
