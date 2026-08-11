/* ==========================================================================
   SUPERMART RETAIL - PAYROLL & PAYSLIP CALCULATOR ENGINE
   ========================================================================== */

import { showToast } from './firebase-config.js';

export function calculatePayroll(user, presentDaysCount, totalSalesRevenue) {
  const baseSalary = Number(user?.salary || 18000);
  const dailyWage = baseSalary / 26; // 26 working days in month
  const earnedBase = Math.round(dailyWage * presentDaysCount);
  const commission = Math.round(totalSalesRevenue * 0.02); // 2% commission
  const netSalary = earnedBase + commission;

  return {
    baseSalary,
    dailyWage: Math.round(dailyWage),
    presentDaysCount,
    earnedBase,
    commission,
    netSalary,
    bankName: user?.bankName || "State Bank of India",
    bankAcc: user?.bankAcc || "38920192841",
    bankIfsc: user?.bankIfsc || "SBIN0001234"
  };
}

// Download / Print Payslip
export function printPayslip(user, payrollData) {
  if (!user || !payrollData) return showToast('Payroll data unavailable', 'rose');

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return showToast('Please allow popups to download payslip!', 'amber');

  const d = new Date();
  const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslip - ${user.name} - ${monthName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { margin: 0; color: #4338ca; font-size: 24px; }
        .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
        .box h3 { margin-top: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
        .table th { background: #f1f5f9; color: #475569; }
        .net-box { background: #eef2ff; border: 2px solid #6366f1; padding: 15px; border-radius: 12px; text-align: center; margin-top: 20px; }
        .net-box h2 { margin: 0; color: #3730a3; font-size: 22px; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SUPERMART RETAIL PVT LTD</h1>
        <p>Main Store Branch • Computer Generated Official Payslip for ${monthName}</p>
      </div>

      <div class="grid">
        <div class="box">
          <h3>Employee Information</h3>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Employee ID:</strong> ${user.empId}</p>
          <p><strong>Designation:</strong> ${user.role}</p>
          <p><strong>Contact:</strong> ${user.phone}</p>
        </div>
        <div class="box">
          <h3>Bank Transfer Details</h3>
          <p><strong>Bank:</strong> ${payrollData.bankName}</p>
          <p><strong>Account No:</strong> ${payrollData.bankAcc}</p>
          <p><strong>IFSC Code:</strong> ${payrollData.bankIfsc}</p>
          <p><strong>Days Present:</strong> ${payrollData.presentDaysCount} Days</p>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Earnings Head</th>
            <th>Calculated Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Monthly Base Salary</td>
            <td>₹${payrollData.baseSalary.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Earned Base Wage (${payrollData.presentDaysCount} Days)</td>
            <td>₹${payrollData.earnedBase.toLocaleString()}</td>
          </tr>
          <tr>
            <td>POS Sales Commission (2%)</td>
            <td>₹${payrollData.commission.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="net-box">
        <p style="margin: 0; font-size: 12px; color: #4f46e5; font-weight: bold;">TOTAL NET PAYABLE SALARY</p>
        <h2>₹${payrollData.netSalary.toLocaleString()}</h2>
      </div>

      <div class="footer">
        <p>This is a system generated document. No physical signature required.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  showToast('Payslip generated and opened for printing!', 'emerald');
}
