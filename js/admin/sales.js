// ============================================================================
// SALES HISTORY MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';
import { openPrintReceiptModal } from './pos.js';

export function renderSalesView() {
  filterSalesHistory();
}

export function filterSalesHistory() {
  const query = document.getElementById('sales-search-input')?.value.toLowerCase().trim() || '';
  const payModeVal = document.getElementById('sales-paymode-filter')?.value || 'All';

  let sales = dbStore.getSales();

  if (query) {
    sales = sales.filter(s => {
      const inv = (s.invoiceNumber || s.invoiceNo || s.id || '').toLowerCase();
      const cust = (s.customerName || '').toLowerCase();
      const phone = (s.customerPhone || '');
      return inv.includes(query) || cust.includes(query) || phone.includes(query);
    });
  }

  if (payModeVal !== 'All') {
    sales = sales.filter(s => (s.paymentMode || s.paymentMethod || 'Cash') === payModeVal);
  }

  // Calculate Summary Metrics
  const totalAmount = sales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0), 0);
  const orderCount = sales.length;

  const elTot = document.getElementById('sales-stat-total-amt');
  if (elTot) elTot.innerText = `₹${totalAmount.toLocaleString('en-IN')}`;

  const elCnt = document.getElementById('sales-stat-count');
  if (elCnt) elCnt.innerText = `${orderCount} Sales`;

  renderSalesTable(sales);
}

function renderSalesTable(sales) {
  const tbody = document.getElementById('sales-history-table');
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 font-semibold">No sales billing invoices found</td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map(s => {
    let itemsCount = 0;
    try {
      const parsed = typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || []);
      itemsCount = Array.isArray(parsed) ? parsed.length : 1;
    } catch (e) { itemsCount = 1; }

    const invNo = s.invoiceNumber || s.invoiceNo || s.invoiceId || s.id || 'INV-001';
    const custName = (s.customerName && s.customerName !== 'undefined') ? s.customerName : (s.name || 'Walk-in Customer');
    let custPhone = (s.customerPhone && s.customerPhone !== 'undefined') ? s.customerPhone : (s.phone || '');
    if (!custPhone || custPhone === custName || custPhone === 'Walk-in Customer') {
      custPhone = '';
    }
    const grandTotal = s.grandTotal ?? s.subtotal ?? s.amount ?? s.totalAmount ?? s.total ?? 0;
    const payMode = s.paymentMode || s.paymentMethod || 'Cash';

    let dateFormatted = 'Today';
    if (s.timestamp) {
      try {
        const d = new Date(s.timestamp);
        if (!isNaN(d.getTime())) {
          dateFormatted = d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        }
      } catch (e) {}
    }

    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-900/60 transition text-xs">
        <td class="py-3 px-3 font-mono font-bold text-indigo-400">${invNo}</td>
        <td class="py-3 px-3 font-mono text-slate-400">${dateFormatted}</td>
        <td class="py-3 px-3">
          <div class="font-bold text-white">${custName}</div>
          ${custPhone ? `<div class="text-[10px] text-slate-400 font-mono">${custPhone}</div>` : ''}
        </td>
        <td class="py-3 px-3 text-slate-300 font-medium">${itemsCount} Items</td>
        <td class="py-3 px-3 font-black text-emerald-400">₹${Number(grandTotal).toLocaleString('en-IN')}</td>
        <td class="py-3 px-3">
          <span class="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">${payMode}</span>
        </td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-1.5">
            <button onclick="viewSaleInvoice('${s.id}')" class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1 rounded-xl font-bold text-[11px] transition flex items-center gap-1">
              <i class="fa-solid fa-receipt"></i> Receipt
            </button>
            <button onclick="deleteSaleBill(event, '${s.id}')" class="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 px-2.5 py-1 rounded-xl font-bold text-[11px] transition flex items-center gap-1" title="Delete Bill Invoice">
              <i class="fa-solid fa-trash-can text-xs"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export function viewSaleInvoice(saleId) {
  const sales = dbStore.getSales();
  const sale = sales.find(s => s.id === saleId || s.invoiceNumber === saleId);
  if (!sale) return;

  openPrintReceiptModal(sale);
}

export function deleteSaleBill(e, saleId) {
  if (e && e.stopPropagation) e.stopPropagation();
  const doDelete = () => {
    dbStore.deleteSale(saleId);
    filterSalesHistory();
  };
  if (window.showConfirmModal) {
    window.showConfirmModal("Delete Bill Invoice", "Are you sure you want to delete this sales billing invoice? This action cannot be undone.", doDelete);
  } else if (confirm("Are you sure you want to delete this bill invoice?")) {
    doDelete();
  }
}
