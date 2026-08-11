// ============================================================================
// EXPENSES MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderExpensesView() {
  const expenses = dbStore.getExpenses();

  const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const elTot = document.getElementById('expense-stat-total');
  if (elTot) elTot.innerText = `₹${totalExp.toLocaleString('en-IN')}`;

  filterExpensesList();
}

export function filterExpensesList() {
  const query = document.getElementById('expense-search-input')?.value.toLowerCase().trim() || '';
  const catVal = document.getElementById('expense-category-filter')?.value || 'All';

  let expenses = dbStore.getExpenses();

  if (catVal !== 'All') {
    expenses = expenses.filter(e => e.category === catVal);
  }

  if (query) {
    expenses = expenses.filter(e => 
      e.title.toLowerCase().includes(query) || 
      (e.notes && e.notes.toLowerCase().includes(query))
    );
  }

  renderExpensesTable(expenses);
}

function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expenses-records-table');
  if (!tbody) return;

  if (expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500 font-semibold">No shop expense logs found</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr class="border-b border-slate-800/80 hover:bg-slate-900/60 transition text-xs">
      <td class="py-3 px-3 font-mono text-slate-400">${e.date}</td>
      <td class="py-3 px-3">
        <span class="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">${e.category}</span>
      </td>
      <td class="py-3 px-3 font-bold text-white">${e.title}</td>
      <td class="py-3 px-3 font-black text-rose-400">₹${Number(e.amount).toLocaleString('en-IN')}</td>
      <td class="py-3 px-3 font-medium text-slate-300">${e.paymentMode || 'Cash'}</td>
      <td class="py-3 px-3 text-slate-400">${e.notes || '---'}</td>
    </tr>
  `).join('');
}

export function openAddExpenseModal() {
  const modal = document.getElementById('expense-modal');
  if (!modal) return;

  document.getElementById('expense-form').reset();
  document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
  modal.classList.remove('hidden');
}

export function closeExpenseModal() {
  document.getElementById('expense-modal')?.classList.add('hidden');
}

export function handleExpenseFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('expense-title').value.trim();
  const category = document.getElementById('expense-category').value;
  const amount = Number(document.getElementById('expense-amount').value) || 0;
  const paymentMode = document.getElementById('expense-paymode').value;
  const date = document.getElementById('expense-date').value;
  const notes = document.getElementById('expense-notes').value.trim();

  dbStore.addExpense({
    id: `exp_${Date.now()}`,
    title,
    category,
    amount,
    paymentMode,
    date,
    notes
  });

  closeExpenseModal();
  renderExpensesView();
}
