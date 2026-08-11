// ============================================================================
// CUSTOMERS MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderCustomersView() {
  const customers = dbStore.getCustomers();

  const total = customers.length;
  const elTot = document.getElementById('cust-stat-total');
  if (elTot) elTot.innerText = total;

  filterCustomersList();
}

export function filterCustomersList() {
  const query = document.getElementById('cust-search-input')?.value.toLowerCase().trim() || '';

  let customers = dbStore.getCustomers();

  if (query) {
    customers = customers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }

  renderCustomersGrid(customers);
}

function renderCustomersGrid(customers) {
  const grid = document.getElementById('customers-grid-container');
  if (!grid) return;

  if (customers.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 font-semibold">No customer profiles found</div>`;
    return;
  }

  grid.innerHTML = customers.map(c => {
    const name = c.name || 'Customer';
    const initial = name.charAt(0).toUpperCase();
    const phone = c.phone || 'N/A';
    const points = c.loyaltyPoints || 0;
    const purchases = c.totalPurchases || 0;
    const spent = Number(c.totalSpent || 0);

    const hasAccess = c.hasLoginAccess === true || c.canLogin === true;

    return `
      <div class="glass-card p-4 rounded-2xl space-y-3 border-slate-800 hover:border-indigo-500/50 transition relative group">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/30">
              ${initial}
            </div>
            <div>
              <h5 class="font-extrabold text-white text-xs">${name}</h5>
              <span class="text-[10px] text-slate-400 font-mono">+91 ${phone}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <i class="fa-solid fa-star text-[9px]"></i> ${points} pts
            </span>
            <button onclick="window.deleteCustomerItem(event, '${c.id}')" class="text-slate-500 hover:text-rose-400 p-1 transition" title="Delete Customer">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Access Status Badge & Info -->
        <div class="flex items-center justify-between pt-1 pb-1 border-t border-slate-800/60 text-[10px]">
          <div>
            ${hasAccess ? 
              `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><i class="fa-solid fa-user-check text-[9px]"></i> Login Enabled</span>` : 
              `<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1" title="Created by Admin for store billing. Mobile login access disabled."><i class="fa-solid fa-user-shield text-[9px]"></i> Billing Only (No Direct Login)</span>`
            }
          </div>
          <button onclick="window.toggleCustomerLoginAccess(event, '${c.id}')" class="text-[10px] font-bold ${hasAccess ? 'text-rose-400 hover:underline' : 'text-indigo-400 hover:underline'}">
            ${hasAccess ? 'Revoke Login' : 'Grant Login Access'}
          </button>
        </div>

        <div class="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-400">Total Visits/Orders:</span>
            <span class="font-bold text-white">${purchases} Orders</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Total Lifetime Spent:</span>
            <span class="font-black text-emerald-400">₹${spent.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function toggleCustomerLoginAccess(e, custId) {
  if (e && e.stopPropagation) e.stopPropagation();
  const customers = dbStore.getCustomers();
  const cust = customers.find(c => c.id === custId);
  if (cust) {
    const newStatus = !(cust.hasLoginAccess === true || cust.canLogin === true);
    cust.hasLoginAccess = newStatus;
    cust.canLogin = newStatus;
    cust.accessStatus = newStatus ? 'Active Login Granted' : 'Billing Profile Only';
    dbStore.saveCustomers(customers);
    renderCustomersView();
  }
}
window.toggleCustomerLoginAccess = toggleCustomerLoginAccess;

export function deleteCustomerItem(e, custId) {
  if (e && e.stopPropagation) e.stopPropagation();
  const doDelete = () => {
    dbStore.deleteCustomer(custId);
    renderCustomersView();
  };
  if (window.showConfirmModal) {
    window.showConfirmModal("Delete Customer", "Are you sure you want to delete this customer profile?", doDelete);
  } else if (confirm("Are you sure you want to delete this customer profile?")) {
    doDelete();
  }
}
window.deleteCustomerItem = deleteCustomerItem;

export function openAddCustomerModal() {
  const modal = document.getElementById('cust-modal');
  if (!modal) return;
  document.getElementById('cust-form').reset();
  modal.classList.remove('hidden');
}

export function closeCustomerModal() {
  document.getElementById('cust-modal')?.classList.add('hidden');
}

export function handleCustomerFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('cust-input-name').value.trim();
  const phone = document.getElementById('cust-input-phone').value.trim();
  const email = document.getElementById('cust-input-email').value.trim();

  dbStore.addCustomer({
    id: `cust_${Date.now()}`,
    name,
    phone,
    email,
    totalPurchases: 0,
    totalSpent: 0,
    loyaltyPoints: 50,
    canLogin: false,
    hasLoginAccess: false,
    accessStatus: 'Billing Profile Only',
    createdAt: new Date().toISOString().split('T')[0]
  });

  closeCustomerModal();
  renderCustomersView();
}
