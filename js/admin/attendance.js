// ============================================================================
// ATTENDANCE MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderAttendanceView() {
  const attendance = dbStore.getAttendance();
  const todayStr = new Date().toISOString().split('T')[0];

  const dateFilterInput = document.getElementById('att-date-filter');
  if (dateFilterInput && !dateFilterInput.value) {
    dateFilterInput.value = todayStr;
  }

  filterAttendanceRecords();
}

export function filterAttendanceRecords() {
  const query = document.getElementById('att-search-input')?.value.toLowerCase().trim() || '';
  const dateVal = document.getElementById('att-date-filter')?.value;
  const statusVal = document.getElementById('att-status-filter')?.value || 'All';

  let records = dbStore.getAttendance();

  // Active employees set to hide orphaned records from deleted employees
  const activeEmployees = dbStore.getEmployees();
  const activeKeys = new Set(activeEmployees.flatMap(e => [e.id, e.empId, e.phone].filter(Boolean)));
  records = records.filter(r => r && (activeKeys.has(r.empId) || activeKeys.has(r.phone) || activeKeys.has(r.id)));

  if (dateVal) {
    records = records.filter(r => r.date === dateVal);
  }

  if (query) {
    records = records.filter(r => {
      const name = (r.empName || r.name || '').toLowerCase();
      const id = (r.empId || r.phone || '').toLowerCase();
      return name.includes(query) || id.includes(query);
    });
  }

  if (statusVal !== 'All') {
    records = records.filter(r => {
      if (statusVal === 'Present') return ['Present', 'working', 'completed'].includes(r.status);
      return r.status === statusVal;
    });
  }

  // Update Stats Counters
  const presentCount = records.filter(r => ['Present', 'working', 'completed'].includes(r.status)).length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const leaveCount = records.filter(r => r.status === 'On Leave' || r.status === 'Absent').length;

  const elP = document.getElementById('att-stat-present');
  if (elP) elP.innerText = presentCount;

  const elL = document.getElementById('att-stat-late');
  if (elL) elL.innerText = lateCount;

  const elA = document.getElementById('att-stat-absent');
  if (elA) elA.innerText = leaveCount;

  renderAttendanceTable(records);
}

function renderAttendanceTable(records) {
  const tbody = document.getElementById('att-records-table');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 font-semibold">No attendance records found for selected filter</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(r => {
    const isPresent = ['Present', 'working', 'completed'].includes(r.status);
    const isLate = r.status === 'Late';
    const isOnBreak = r.status === 'on_break';

    const statusBadge = isPresent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        isLate ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        isOnBreak ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20';

    const statusText = r.status === 'working' ? 'Present' :
                       r.status === 'completed' ? 'Completed' :
                       r.status === 'on_break' ? 'On Break' : (r.status || 'Present');

    const empName = r.empName || r.name || 'Staff Member';
    const empId = r.empId || r.phone || 'N/A';
    const inTime = r.checkInTime || r.checkIn || '---';
    const outTime = r.checkOutTime || r.checkOut || '---';
    const workHours = r.workHours || r.totalHoursFormatted || '8 hrs';

    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-900/60 transition">
        <td class="py-3 px-3 font-mono font-bold text-indigo-400 text-xs">${empId}</td>
        <td class="py-3 px-3 font-bold text-white text-xs">${empName}</td>
        <td class="py-3 px-3 font-mono text-slate-300 text-xs">${r.date}</td>
        <td class="py-3 px-3 font-bold text-slate-200 text-xs">${inTime}</td>
        <td class="py-3 px-3 font-bold text-slate-200 text-xs">${outTime}</td>
        <td class="py-3 px-3 font-bold text-emerald-400 text-xs">${workHours}</td>
        <td class="py-3 px-3">
          <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}">${statusText}</span>
        </td>
      </tr>
    `;
  }).join('');
}

export function openMarkAttendanceModal() {
  const modal = document.getElementById('att-mark-modal');
  if (!modal) return;

  // Populate employee select options
  const empSelect = document.getElementById('att-mark-emp-select');
  const employees = dbStore.getEmployees();
  if (empSelect) {
    empSelect.innerHTML = employees.map(e => `<option value="${e.empId}">${e.name} (${e.empId})</option>`).join('');
  }

  document.getElementById('att-mark-date').value = new Date().toISOString().split('T')[0];
  modal.classList.remove('hidden');
}

export function closeMarkAttendanceModal() {
  document.getElementById('att-mark-modal')?.classList.add('hidden');
}

export function handleMarkAttendanceSubmit(e) {
  e.preventDefault();

  const empId = document.getElementById('att-mark-emp-select').value;
  const date = document.getElementById('att-mark-date').value;
  const status = document.getElementById('att-mark-status').value;
  const checkInTime = document.getElementById('att-mark-in-time').value || '09:00 AM';
  const checkOutTime = document.getElementById('att-mark-out-time').value || '07:00 PM';

  const employees = dbStore.getEmployees();
  const emp = employees.find(e => e.empId === empId);

  dbStore.markAttendance({
    id: `att_${Date.now()}`,
    empId,
    empName: emp ? emp.name : 'Employee',
    date,
    checkInTime,
    checkOutTime,
    status,
    workHours: status === 'Present' ? 9.5 : (status === 'Late' ? 8 : 0),
    overtimeHours: 0,
    location: 'Manual Admin Mark'
  });

  closeMarkAttendanceModal();
  renderAttendanceView();
}

export function clearAttendanceDateFilter() {
  const dateInput = document.getElementById('att-date-filter');
  if (dateInput) dateInput.value = '';
  filterAttendanceRecords();
}

export function exportAttendanceCSV() {
  const records = dbStore.getAttendance();
  let csv = 'Employee ID,Name,Date,Check In,Check Out,Work Hours,Status\n';

  records.forEach(r => {
    const empId = r.empId || r.phone || 'N/A';
    const empName = r.empName || r.name || 'Staff Member';
    const inTime = r.checkInTime || r.checkIn || '---';
    const outTime = r.checkOutTime || r.checkOut || '---';
    const hrs = r.workHours || r.totalHoursFormatted || '8';
    csv += `"${empId}","${empName}","${r.date || ''}","${inTime}","${outTime}","${hrs}","${r.status || 'Present'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Master_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  a.click();
}

export function exportAttendancePDFReport() {
  const records = dbStore.getAttendance();
  const activeEmployees = dbStore.getEmployees();
  const activeKeys = new Set(activeEmployees.flatMap(e => [e.id, e.empId, e.phone].filter(Boolean)));

  // Clean active records only
  const cleanRecords = records.filter(r => r && (activeKeys.has(r.empId) || activeKeys.has(r.phone) || activeKeys.has(r.id)));

  // Sort line-by-line by date descending and staff name
  cleanRecords.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const printWin = window.open('', '_blank');
  if (!printWin) {
    alert("Please allow popups to generate the Master Attendance PDF Report.");
    return;
  }

  const rowsHtml = cleanRecords.map(r => {
    const empId = r.empId || r.phone || 'N/A';
    const empName = r.empName || r.name || 'Staff Member';
    const inTime = r.checkInTime || r.checkIn || '---';
    const outTime = r.checkOutTime || r.checkOut || '---';
    const hrs = r.workHours || r.totalHoursFormatted || '8 hrs';
    const status = r.status === 'working' ? 'Present' : (r.status || 'Present');

    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; font-weight: bold;">${r.date || '---'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #475569;">${empId}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${empName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${inTime}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${outTime}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; color: #16a34a;">${hrs}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
          <span style="padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
            ${status}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const settings = dbStore.getSettings ? dbStore.getSettings() : {};
  const shopName = settings.shopName || 'SuperMart Retail';

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${shopName} - Master Daily Attendance PDF Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #3730a3; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { margin: 5px 0 0 0; color: #64748b; font-size: 12px; }
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
        th { background: #4f46e5; color: white; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          🖨️ Print / Save as PDF
        </button>
      </div>
      <div class="header">
        <h1>${shopName}</h1>
        <p><b>MASTER STAFF ATTENDANCE REPORT (LINE-BY-LINE ALL DATES)</b></p>
        <p>Report Generated: ${new Date().toLocaleString('en-IN')}</p>
      </div>
      <div class="summary-box">
        <div><b>Total Active Staff Members:</b> ${activeEmployees.length}</div>
        <div><b>Total Logged Records:</b> ${cleanRecords.length} Entries</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Emp ID</th>
            <th>Staff Name</th>
            <th>In Time</th>
            <th>Out Time</th>
            <th>Work Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #94a3b8;">No attendance logs found.</td></tr>'}
        </tbody>
      </table>
      <div class="footer">
        Generated by SuperMart Shop Management System • Daily Attendance Master Log
      </div>
    </body>
    </html>
  `);
  printWin.document.close();
}
