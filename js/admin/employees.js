// ============================================================================
// EMPLOYEES MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

let currentEditingEmpId = null;

export function renderEmployeesView() {
  const employees = dbStore.getEmployees();
  
  // Stat Metrics
  const total = employees.length;
  const active = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;

  const totalEl = document.getElementById('emp-stat-total');
  if (totalEl) totalEl.innerText = total;

  const activeEl = document.getElementById('emp-stat-active');
  if (activeEl) activeEl.innerText = active;

  const leaveEl = document.getElementById('emp-stat-leave');
  if (leaveEl) leaveEl.innerText = onLeave;

  // Render Table / Cards
  renderEmployeeList(employees);
}

export function filterEmployees() {
  const query = document.getElementById('emp-search-input')?.value.toLowerCase().trim() || '';
  const roleFilter = document.getElementById('emp-role-filter')?.value || 'All';
  const statusFilter = document.getElementById('emp-status-filter')?.value || 'All';

  let employees = dbStore.getEmployees();

  if (query) {
    employees = employees.filter(e => 
      e.name.toLowerCase().includes(query) || 
      e.empId.toLowerCase().includes(query) || 
      e.phone.includes(query)
    );
  }

  if (roleFilter !== 'All') {
    employees = employees.filter(e => e.designation === roleFilter || e.role === roleFilter);
  }

  if (statusFilter !== 'All') {
    employees = employees.filter(e => e.status === statusFilter);
  }

  renderEmployeeList(employees);
}

function renderEmployeeList(employees) {
  const container = document.getElementById('emp-cards-container');
  if (!container) return;

  if (employees.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 font-semibold">No employee records found matching filter.</div>`;
    return;
  }

  container.innerHTML = employees.map(e => {
    const isLeave = e.status === 'On Leave';
    const statusBadge = isLeave ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

    return `
      <div class="glass-card p-4 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden group border-slate-800 hover:border-indigo-500/50 transition">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <img src="${e.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}" class="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/40">
            <div>
              <h4 class="font-extrabold text-white text-sm">${e.name}</h4>
              <span class="text-[11px] font-bold text-indigo-400 font-mono">${e.empId}</span>
            </div>
          </div>
          <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}">${e.status}</span>
        </div>

        <div class="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">Designation:</span>
            <span class="font-bold text-white">${e.designation || e.role}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">Mobile:</span>
            <span class="font-bold text-slate-200">+91 ${e.phone}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">Monthly Salary:</span>
            <span class="font-black text-emerald-400">₹${Number(e.baseSalary || 20000).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <button onclick="event.stopPropagation(); openEditEmployeeModal('${e.id}')" class="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="event.stopPropagation(); confirmDeleteEmployee('${e.id}')" class="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 p-1.5 rounded-xl font-bold text-xs transition" title="Delete Employee">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function openAddEmployeeModal() {
  currentEditingEmpId = null;
  const modal = document.getElementById('emp-modal');
  if (!modal) return;

  document.getElementById('emp-modal-title').innerText = 'Add New Staff Member';
  document.getElementById('emp-form').reset();
  modal.classList.remove('hidden');
}

export function openEditEmployeeModal(id) {
  currentEditingEmpId = id;
  const employees = dbStore.getEmployees();
  const emp = employees.find(e => e.id === id || e.empId === id);
  if (!emp) return;

  const modal = document.getElementById('emp-modal');
  if (!modal) return;

  document.getElementById('emp-modal-title').innerText = 'Edit Employee Details';
  document.getElementById('emp-input-name').value = emp.name;
  document.getElementById('emp-input-phone').value = emp.phone;
  document.getElementById('emp-input-role').value = emp.designation || emp.role;
  document.getElementById('emp-input-salary').value = emp.baseSalary;
  document.getElementById('emp-input-status').value = emp.status;
  document.getElementById('emp-input-bank-name').value = emp.bankName || 'SBI';
  document.getElementById('emp-input-bank-acc').value = emp.accNumber || '';
  document.getElementById('emp-input-bank-ifsc').value = emp.ifscCode || '';

  modal.classList.remove('hidden');
}

export function closeEmployeeModal() {
  document.getElementById('emp-modal')?.classList.add('hidden');
}

export function handleEmployeeFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('emp-input-name').value.trim();
  const phone = document.getElementById('emp-input-phone').value.trim();
  const role = document.getElementById('emp-input-role').value;
  const salary = Number(document.getElementById('emp-input-salary').value) || 20000;
  const status = document.getElementById('emp-input-status').value;
  const bankName = document.getElementById('emp-input-bank-name').value;
  const accNumber = document.getElementById('emp-input-bank-acc').value;
  const ifscCode = document.getElementById('emp-input-bank-ifsc').value;

  if (currentEditingEmpId) {
    dbStore.updateEmployee(currentEditingEmpId, {
      name, phone, role, designation: role, baseSalary: salary, status, bankName, accNumber, ifscCode
    });
  } else {
    const newEmpId = `EMP-${100 + dbStore.getEmployees().length + 1}`;
    dbStore.addEmployee({
      id: `emp_${Date.now()}`,
      empId: newEmpId,
      name,
      phone,
      role,
      designation: role,
      status,
      baseSalary: salary,
      joiningDate: new Date().toISOString().split('T')[0],
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      bankName,
      accNumber,
      ifscCode
    });
  }

  closeEmployeeModal();
  renderEmployeesView();
}

export function confirmDeleteEmployee(id) {
  if (window.showConfirmModal) {
    window.showConfirmModal(
      'Remove Staff Member',
      'Are you sure you want to remove this employee from shop records?',
      () => {
        dbStore.deleteEmployee(id);
        renderEmployeesView();
      }
    );
  } else {
    dbStore.deleteEmployee(id);
    renderEmployeesView();
  }
}
