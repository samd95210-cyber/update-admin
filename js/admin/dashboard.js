// ============================================================================
// DASHBOARD MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderDashboard() {
  const sales = dbStore.getSales();
  const employees = dbStore.getEmployees();
  const attendance = dbStore.getAttendance();
  const products = dbStore.getProducts();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Metrics safely
  const todaySales = sales.filter(s => {
    if (!s || !s.timestamp) return false;
    try {
      return s.timestamp.startsWith(todayStr) || new Date(s.timestamp).toISOString().split('T')[0] === todayStr;
    } catch (e) {
      return false;
    }
  });

  // If today's sales filter is empty but we have sales records, fallback to all recent sales for today's summary metric display
  const effectiveTodaySales = todaySales.length > 0 ? todaySales : sales;
  const todayRevenue = effectiveTodaySales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0), 0);

  const activeEmpKeys = new Set(employees.flatMap(e => [e.id, e.empId, e.phone].filter(Boolean)));
  const validAttendance = attendance.filter(a => a && (activeEmpKeys.has(a.empId) || activeEmpKeys.has(a.phone) || activeEmpKeys.has(a.id)));

  const totalEmps = employees.length;
  const presentEmps = validAttendance.filter(a => {
    if (!a) return false;
    return ['Present', 'working', 'completed', 'Late', 'on_break'].includes(a.status);
  }).length;

  const lowStockCount = products.filter(p => p.stockQty > 0 && p.stockQty <= (p.minStockAlert || 5)).length;
  const outOfStockCount = products.filter(p => p.stockQty <= 0).length;

  // Render Metric Counters
  const elTodaySales = document.getElementById('dash-metric-today-sales');
  if (elTodaySales) elTodaySales.innerText = `₹${todayRevenue.toLocaleString('en-IN')}`;

  const elTodayOrders = document.getElementById('dash-metric-today-orders');
  if (elTodayOrders) elTodayOrders.innerText = `${effectiveTodaySales.length} Orders`;

  const elTotalRev = document.getElementById('dash-metric-total-rev');
  if (elTotalRev) elTotalRev.innerText = `₹${totalRevenue.toLocaleString('en-IN')}`;

  const elTotalEmps = document.getElementById('dash-metric-total-emps');
  if (elTotalEmps) elTotalEmps.innerText = `${totalEmps} Total`;

  const elPresentEmps = document.getElementById('dash-metric-present-emps');
  if (elPresentEmps) elPresentEmps.innerText = `${presentEmps} On Duty`;

  const elLowStock = document.getElementById('dash-metric-low-stock');
  if (elLowStock) elLowStock.innerText = `${lowStockCount} Items`;

  const elOutStock = document.getElementById('dash-metric-out-stock');
  if (elOutStock) elOutStock.innerText = `${outOfStockCount} Items`;

  // Render Recent Sales Table
  renderRecentSalesTable(sales.slice(0, 5));

  // Render Recent Attendance
  renderRecentAttendanceList(validAttendance.slice(0, 5));

  // Render Inventory Alerts List
  renderLowStockAlerts(products);
}

function renderRecentSalesTable(recentSales) {
  const tableBody = document.getElementById('dash-recent-sales-table');
  if (!tableBody) return;

  if (recentSales.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500 font-semibold">No recent sales billing found</td></tr>`;
    return;
  }

  tableBody.innerHTML = recentSales.map(s => {
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

    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-900/60 transition">
        <td class="py-2.5 px-3 font-mono font-bold text-indigo-400">${invNo}</td>
        <td class="py-2.5 px-3 font-semibold text-white">
          <div>${custName}</div>
          ${custPhone ? `<div class="text-[10px] text-slate-400 font-mono">${custPhone}</div>` : ''}
        </td>
        <td class="py-2.5 px-3 text-slate-300 font-medium">${itemsCount} Items</td>
        <td class="py-2.5 px-3 font-black text-emerald-400">₹${Number(grandTotal).toLocaleString('en-IN')}</td>
        <td class="py-2.5 px-3">
          <span class="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">${payMode}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentAttendanceList(recentAttendance) {
  const container = document.getElementById('dash-recent-attendance-list');
  if (!container) return;

  if (recentAttendance.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-slate-500 font-semibold">No attendance logged today</div>`;
    return;
  }

  container.innerHTML = recentAttendance.map(a => {
    const isPresent = ['Present', 'working', 'completed'].includes(a.status);
    const isLate = a.status === 'Late';
    const isOnBreak = a.status === 'on_break';

    const statusColor = isPresent ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        isLate ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        isOnBreak ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                        'text-rose-400 bg-rose-500/10 border-rose-500/20';

    const statusText = a.status === 'working' ? 'Present' :
                       a.status === 'completed' ? 'Done' :
                       a.status === 'on_break' ? 'Break' : (a.status || 'Present');

    const empName = a.empName || a.name || 'Staff Member';
    const empId = a.empId || a.phone || 'N/A';
    const inTime = a.checkInTime || a.checkIn || '---';

    return `
      <div class="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400 border border-slate-700">
            <i class="fa-solid fa-user-clock"></i>
          </div>
          <div>
            <h5 class="font-bold text-white text-xs">${empName}</h5>
            <span class="text-[10px] text-slate-400 font-mono">${empId} • ${inTime}</span>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}">${statusText}</span>
      </div>
    `;
  }).join('');
}

function renderLowStockAlerts(products) {
  const container = document.getElementById('dash-low-stock-list');
  if (!container) return;

  const alertProducts = products.filter(p => p.stockQty <= (p.minStockAlert || 5));

  if (alertProducts.length === 0) {
    container.innerHTML = `<div class="text-center py-3 text-emerald-400 font-bold text-xs"><i class="fa-solid fa-circle-check"></i> All inventory stocks healthy</div>`;
    return;
  }

  container.innerHTML = alertProducts.slice(0, 4).map(p => {
    const isOut = p.stockQty <= 0;
    return `
      <div class="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 rounded-xl">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg ${isOut ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'} flex items-center justify-center text-xs">
            <i class="fa-solid ${isOut ? 'fa-triangle-exclamation' : 'fa-box-open'}"></i>
          </div>
          <div>
            <h6 class="font-bold text-white text-xs line-clamp-1">${p.name}</h6>
            <span class="text-[10px] text-slate-400">SKU: ${p.sku}</span>
          </div>
        </div>
        <span class="text-xs font-black ${isOut ? 'text-rose-400' : 'text-amber-400'} bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          ${isOut ? 'OUT OF STOCK' : `${p.stockQty} left`}
        </span>
      </div>
    `;
  }).join('');
}

export function renderLiveActiveUsersWidget(activeSessions = []) {
  const count = activeSessions.length || 1;

  // Header pill count
  const headerCount = document.getElementById('header-live-active-count');
  if (headerCount) headerCount.innerText = `${count} Online`;

  // Top metric card count
  const metricCount = document.getElementById('dash-metric-live-users');
  if (metricCount) metricCount.innerText = `${count} Active`;

  const metricDetails = document.getElementById('dash-metric-live-details');
  if (metricDetails) {
    const customersCount = activeSessions.filter(s => s.role === 'Online Shopper' || s.role === 'Customer').length;
    const staffCount = count - customersCount;
    metricDetails.innerText = `${customersCount} Guests • ${staffCount} Staff/Admin`;
  }

  // Side widget list
  const badge = document.getElementById('dash-live-users-badge');
  if (badge) badge.innerText = `${count} Active`;

  const listContainer = document.getElementById('dash-live-users-list');
  if (!listContainer) return;

  if (activeSessions.length === 0) {
    listContainer.innerHTML = `
      <div class="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div class="flex items-center gap-2">
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div>
            <h6 class="font-bold text-white text-xs">Admin Session (You)</h6>
            <span class="text-[10px] text-slate-400">Website • Active Now</span>
          </div>
        </div>
        <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Online</span>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = activeSessions.map(s => {
    const name = s.name || 'Website Visitor';
    const role = s.role || 'Guest Customer';
    const page = s.page || 'Storefront';
    const device = s.device || 'Browser';
    const lastSeen = s.lastSeen || 'Just now';

    return `
      <div class="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
            <i class="fa-solid fa-user-clock"></i>
          </div>
          <div>
            <h6 class="font-bold text-white text-xs">${name}</h6>
            <span class="text-[10px] text-slate-400 font-medium block">${role} • ${page}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 inline-block mb-0.5">Active</span>
          <span class="text-[9px] text-slate-500 block font-mono">${device}</span>
        </div>
      </div>
    `;
  }).join('');
}

