// ============================================================================
// REPORTS & ANALYTICS MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// Profit & Loss, Daily/Monthly Sales, Stock Valuation, Expenses
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderReportsView() {
  const sales = dbStore.getSales();
  const expenses = dbStore.getExpenses();
  const products = dbStore.getProducts();

  // 1. Profit & Loss Statement Calculations
  const grossSalesRevenue = sales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.subtotal ?? s.amount ?? s.totalAmount ?? s.total ?? 0), 0);
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Approximate Cost of Goods Sold (COGS based on buying prices)
  let estimatedCOGS = 0;
  sales.forEach(s => {
    const totalVal = Number(s.grandTotal ?? s.subtotal ?? s.amount ?? s.totalAmount ?? s.total ?? 0);
    try {
      const items = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const prod = products.find(p => p.id === item.id || p.name === item.name);
          const buyPrice = prod ? Number(prod.buyingPrice || item.price * 0.8) : (item.price || 0) * 0.8;
          estimatedCOGS += buyPrice * (item.qty || 1);
        });
      } else {
        estimatedCOGS += totalVal * 0.75;
      }
    } catch (e) {
      estimatedCOGS += totalVal * 0.75;
    }
  });

  const grossProfit = grossSalesRevenue - estimatedCOGS;
  const netProfit = grossProfit - totalExpensesAmount;

  const elRevenue = document.getElementById('report-sales-rev');
  if (elRevenue) elRevenue.innerText = `₹${grossSalesRevenue.toLocaleString('en-IN')}`;

  const elCogs = document.getElementById('report-cogs');
  if (elCogs) elCogs.innerText = `₹${Math.round(estimatedCOGS).toLocaleString('en-IN')}`;

  const elExp = document.getElementById('report-expenses');
  if (elExp) elExp.innerText = `₹${totalExpensesAmount.toLocaleString('en-IN')}`;

  const elNet = document.getElementById('report-net-profit');
  if (elNet) {
    elNet.innerText = `₹${Math.round(netProfit).toLocaleString('en-IN')}`;
    elNet.className = netProfit >= 0 ? 'text-2xl font-black text-emerald-400' : 'text-2xl font-black text-rose-400';
  }

  // 2. Inventory Stock Valuation Summary
  const totalStockItems = products.reduce((acc, p) => acc + Number(p.stockQty || 0), 0);
  const inventoryValueAtCost = products.reduce((acc, p) => acc + (Number(p.buyingPrice || 0) * Number(p.stockQty || 0)), 0);
  const inventoryValueAtRetail = products.reduce((acc, p) => acc + (Number(p.sellingPrice || 0) * Number(p.stockQty || 0)), 0);

  const elStockQty = document.getElementById('report-stock-qty');
  if (elStockQty) elStockQty.innerText = `${totalStockItems.toLocaleString('en-IN')} Units`;

  const elStockCost = document.getElementById('report-stock-cost');
  if (elStockCost) elStockCost.innerText = `₹${inventoryValueAtCost.toLocaleString('en-IN')}`;

  const elStockRetail = document.getElementById('report-stock-retail');
  if (elStockRetail) elStockRetail.innerText = `₹${inventoryValueAtRetail.toLocaleString('en-IN')}`;
}

export function exportFullShopReport() {
  const sales = dbStore.getSales();
  const expenses = dbStore.getExpenses();

  let summary = `SUPERMART RETAIL - EXECUTIVE SHOP REPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;
  summary += `=== SALES SUMMARY ===\nTotal Orders: ${sales.length}\nGross Sales Revenue: ₹${sales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.subtotal ?? s.amount ?? s.totalAmount ?? s.total ?? 0), 0)}\n\n`;
  summary += `=== EXPENSES SUMMARY ===\nTotal Vouchers: ${expenses.length}\nTotal Expenses: ₹${expenses.reduce((acc, e) => acc + e.amount, 0)}\n\n`;

  const blob = new Blob([summary], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `SuperMart_Shop_Executive_Report_${new Date().toISOString().split('T')[0]}.txt`);
  a.click();
}
