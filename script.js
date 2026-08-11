// ============================================================================
// SUPERMART SHOP MANAGEMENT ADMIN PANEL - MAIN CONTROLLER & REALTIME ENGINE
// ============================================================================

import { db } from './js/firebase-config.js';
import {
  dbStore,
  SEED_EMPLOYEES,
  SEED_PRODUCTS,
  SEED_CATEGORIES,
  SEED_SALES,
  SEED_ATTENDANCE,
  SEED_EXPENSES,
  SEED_STOCK_LOGS,
  SEED_CUSTOMERS
} from './js/data-store.js';

import { handleAdminLoginSubmit, checkAdminPersistentLogin, adminLogout as authAdminLogout } from './js/auth.js';

import { renderDashboard, renderLiveActiveUsersWidget } from './js/admin/dashboard.js';
import { renderEmployeesView, filterEmployees, openAddEmployeeModal, openEditEmployeeModal, closeEmployeeModal, handleEmployeeFormSubmit, confirmDeleteEmployee } from './js/admin/employees.js';
import { renderAttendanceView, filterAttendanceRecords, openMarkAttendanceModal, closeMarkAttendanceModal, handleMarkAttendanceSubmit, exportAttendanceCSV, clearAttendanceDateFilter, exportAttendancePDFReport } from './js/admin/attendance.js';
import { renderPosView, filterPosCategory, searchPosCatalog, addToPosCart, updateCartQty, removeFromCart, clearCart, handleDiscountChange, toggleGstTax, processCheckoutSale, closeReceiptModal, printCurrentReceipt } from './js/admin/pos.js';
import { renderProductsView, filterProductsList, openAddProductModal, openEditProductModal, closeProductModal, handleProductFormSubmit, confirmDeleteProduct, updateProductImagePreview, handleProductPhotoFileUpload } from './js/admin/products.js';
import { renderCategoriesView, openAddCategoryModal, closeCategoryModal, handleCategoryFormSubmit, confirmDeleteCategory } from './js/admin/categories.js';
import { renderStockView, filterStockLogs, openAddStockInModal, closeAddStockInModal, handleStockInSubmit, openStockOutModal, closeStockOutModal, handleStockOutSubmit } from './js/admin/stock.js';
import { renderSalesView, filterSalesHistory, viewSaleInvoice, deleteSaleBill } from './js/admin/sales.js';
import { renderExpensesView, filterExpensesList, openAddExpenseModal, closeExpenseModal, handleExpenseFormSubmit } from './js/admin/expenses.js';
import { renderCustomersView, filterCustomersList, openAddCustomerModal, closeCustomerModal, handleCustomerFormSubmit, deleteCustomerItem } from './js/admin/customers.js';
import { renderReportsView, exportFullShopReport } from './js/admin/reports.js';
import { renderSettingsView, handleSaveSettingsSubmit, resetAllShopData } from './js/admin/settings.js';

// Current Active Tab
let activeTab = 'dashboard';

// Setup global functions for HTML inline handlers immediately
setupGlobalNavigation();

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initRealtimeClock();
  setupGlobalNavigation();

  checkAdminPersistentLogin((admin) => {
    hideLoginModal();
  }, () => {
    showLoginModal();
  });

  initFirestoreRealtimeListeners();
  switchAdminTab('dashboard');

  sendPresenceHeartbeat();
  setInterval(sendPresenceHeartbeat, 10000);
});

function showLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.remove('hidden');
}

function hideLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleAdminLoginSubmitEvent(event) {
  handleAdminLoginSubmit(event, (admin) => {
    hideLoginModal();
  });
}

// Realtime Header Clock
function initRealtimeClock() {
  const clockEl = document.getElementById('header-clock');
  const dateEl = document.getElementById('header-date');

  function update() {
    const now = new Date();
    if (clockEl) clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (dateEl) dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  update();
  setInterval(update, 1000);
}

/**
 * Real-time Firestore Listeners Setup
 * Subscribes to 'products', 'sales', 'attendance', 'employees', 'categories', 'expenses', 'customers', 'stock_logs' collections
 */
function initFirestoreRealtimeListeners() {
  if (!db) {
    console.warn("⚠️ Firebase Firestore is not available. Using local storage data fallback.");
    renderActiveView();
    return;
  }

  console.log("⚡ Subscribing to Firebase Firestore real-time listeners...");

  // 1. Employees Realtime Listener
  db.collection('employees').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.log("🌱 Seeding Firestore 'employees' collection...");
      const list = dbStore.getEmployees();
      list.forEach(emp => db.collection('employees').doc(emp.id).set(emp).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (employeesData.length > 0) {
        dbStore.saveEmployees(employeesData);

        // Cascaded Attendance Cleanup: filter local attendance for active employees only
        const activeKeys = new Set(employeesData.flatMap(e => [e.id, e.empId, e.phone].filter(Boolean)));
        let atts = dbStore.getAttendance();
        const filteredAtts = atts.filter(a => a && (activeKeys.has(a.empId) || activeKeys.has(a.phone) || activeKeys.has(a.id)));
        dbStore.saveAttendance(filteredAtts);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'employees' listener warning:", error);
    renderActiveView();
  });

  // 2. Products Realtime Listener
  db.collection('products').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.log("🌱 Seeding Firestore 'products' collection...");
      const list = dbStore.getProducts();
      list.forEach(p => db.collection('products').doc(p.id).set(p).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (productsData.length > 0) {
        dbStore.saveProducts(productsData);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'products' listener warning:", error);
    renderActiveView();
  });

  // 3. Sales Realtime Listener
  db.collection('sales').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.log("🌱 Seeding Firestore 'sales' collection...");
      const list = dbStore.getSales();
      list.forEach(s => db.collection('sales').doc(s.id).set(s).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (salesData.length > 0) {
        dbStore.saveSales(salesData);
        dbStore.getCustomers();
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'sales' listener warning:", error);
    renderActiveView();
  });

  // 4. Attendance Realtime Listener
  db.collection('attendance').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.log("🌱 Seeding Firestore 'attendance' collection...");
      const list = dbStore.getAttendance();
      list.forEach(a => db.collection('attendance').doc(a.id).set(a).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const attendanceData = snapshot.docs.map(doc => ({ docId: doc.id, id: doc.id, ...doc.data() }));
      if (attendanceData.length > 0) {
        const activeEmps = dbStore.getEmployees();
        const activeKeys = new Set(activeEmps.flatMap(e => [e.id, e.empId, e.phone].filter(Boolean)));
        const activeAttendance = attendanceData.filter(a =>
          a && (activeKeys.has(a.empId) || activeKeys.has(a.phone) || activeKeys.has(a.id))
        );

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data && !activeKeys.has(data.empId) && !activeKeys.has(data.phone) && !activeKeys.has(data.id)) {
            db.collection('attendance').doc(doc.id).delete().catch(e => console.warn(e));
          }
        });

        dbStore.saveAttendance(activeAttendance);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'attendance' listener warning:", error);
    renderActiveView();
  });

  // 5. Categories Realtime Listener
  db.collection('categories').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      const list = dbStore.getCategories();
      list.forEach(c => db.collection('categories').doc(c.id).set(c).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (categoriesData.length > 0) {
        dbStore.saveCategories(categoriesData);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'categories' listener warning:", error);
    renderActiveView();
  });

  // 6. Expenses Realtime Listener
  db.collection('expenses').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      const list = dbStore.getExpenses();
      list.forEach(e => db.collection('expenses').doc(e.id).set(e).catch(err => console.warn(err)));
      renderActiveView();
    } else {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (expensesData.length > 0) {
        dbStore.saveExpenses(expensesData);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'expenses' listener warning:", error);
    renderActiveView();
  });

  // 7. Customers Realtime Listener
  db.collection('customers').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      const list = dbStore.getCustomers();
      list.forEach(c => db.collection('customers').doc(c.id).set(c).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (customersData.length > 0) {
        dbStore.saveCustomers(customersData);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'customers' listener warning:", error);
    renderActiveView();
  });

  // 8. Stock Logs Realtime Listener
  db.collection('stock_logs').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      const list = dbStore.getStockLogs();
      list.forEach(s => db.collection('stock_logs').doc(s.id).set(s).catch(e => console.warn(e)));
      renderActiveView();
    } else {
      const stockLogsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (stockLogsData.length > 0) {
        dbStore.saveStockLogs(stockLogsData);
      }
      renderActiveView();
    }
  }, (error) => {
    console.warn("Firestore 'stock_logs' listener warning:", error);
    renderActiveView();
  });

  // 9. Active Website Sessions / Realtime Presence Listener
  db.collection('active_sessions').onSnapshot((snapshot) => {
    const now = Date.now();
    const activeSessions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => s && (now - Number(s.timestamp || 0)) < 40000); // active within last 40s

    renderLiveActiveUsersWidget(activeSessions);
  }, (error) => {
    console.warn("Firestore 'active_sessions' listener warning:", error);
    renderLiveActiveUsersWidget([]);
  });
}

// Presence Heartbeat
const SESSION_ID = sessionStorage.getItem('supermart_active_session_id') || (`sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
sessionStorage.setItem('supermart_active_session_id', SESSION_ID);

function sendPresenceHeartbeat() {
  if (!db) return;
  const userPhone = localStorage.getItem('smarthr_auth_phone') || '';
  let cachedProfile = null;
  if (userPhone) {
    try { cachedProfile = JSON.parse(localStorage.getItem('smarthr_profile_' + userPhone)); } catch(e){}
  }

  const name = cachedProfile?.name || 'Store Manager (Admin)';
  const role = cachedProfile?.role || 'Administrator';
  const page = activeTab ? activeTab.toUpperCase() : 'DASHBOARD';
  const device = window.innerWidth < 768 ? '📱 Mobile' : '💻 Desktop';

  db.collection('active_sessions').doc(SESSION_ID).set({
    id: SESSION_ID,
    name,
    role,
    phone: userPhone || 'N/A',
    page,
    device,
    timestamp: Date.now(),
    lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, { merge: true }).catch(err => console.warn('Heartbeat error:', err));
}

// Helper to re-render whichever panel is currently visible
function renderActiveView() {
  switch (activeTab) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'employees':
      renderEmployeesView();
      break;
    case 'attendance':
      renderAttendanceView();
      break;
    case 'pos':
      renderPosView();
      break;
    case 'products':
      renderProductsView();
      break;
    case 'categories':
      renderCategoriesView();
      break;
    case 'stock':
      renderStockView();
      break;
    case 'sales':
      renderSalesView();
      break;
    case 'expenses':
      renderExpensesView();
      break;
    case 'customers':
      renderCustomersView();
      break;
    case 'reports':
      renderReportsView();
      break;
    case 'settings':
      renderSettingsView();
      break;
  }
}

// Tab Switching Navigation
export function switchAdminTab(tabName) {
  activeTab = tabName;

  // Hide all view panels strictly
  const panels = document.querySelectorAll('.admin-view-panel');
  panels.forEach(p => {
    p.classList.add('hidden');
    p.style.display = 'none'; // Force complete hide to eliminate any dashboard bleed-through
  });

  // Highlight active sidebar nav item
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    if (item.dataset.tab === tabName) {
      item.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/30', 'font-extrabold');
      item.classList.remove('text-slate-400', 'hover:bg-slate-900', 'hover:text-slate-200');
    } else {
      item.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/30', 'font-extrabold');
      item.classList.add('text-slate-400', 'hover:bg-slate-900', 'hover:text-slate-200');
    }
  });

  // Show target panel smoothly
  const targetPanel = document.getElementById(`view-${tabName}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.style.display = 'block'; // Restore display cleanly
  }

  // Auto-close mobile sidebar if open on mobile screens
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.add('-translate-x-full');
  }

  // Smooth scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update Breadcrumb Header Title
  const breadcrumbEl = document.getElementById('header-breadcrumb-title');
  if (breadcrumbEl) {
    const titleMap = {
      dashboard: 'Shop Dashboard & Overview',
      employees: 'Staff & Employee Directory',
      attendance: 'Attendance & Daily Punch Logs',
      pos: 'POS Point of Sale Billing Counter',
      products: 'Products & Inventory Catalog',
      categories: 'Product Categories Taxonomy',
      stock: 'Inbound Stock In & Outbound Stock Log',
      sales: 'Sales Transactions & Billing Invoices',
      expenses: 'Store Operational Expenses',
      customers: 'Registered Customer Profiles',
      reports: 'Business Reports & P&L Analytics',
      settings: 'Shop Configuration & GST Tax Settings'
    };
    breadcrumbEl.innerText = titleMap[tabName] || 'Shop Admin Panel';
  }

  // Render view-specific data
  renderActiveView();
}

// Sidebar Drawer Toggle for Mobile Responsive
export function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('-translate-x-full');
  }
}

// Admin Logout
export function logoutAdmin() {
  authAdminLogout(() => {
    showLoginModal();
  });
}

function setupGlobalNavigation() {
  // Attach all functions to window for HTML inline listeners
  window.switchAdminTab = switchAdminTab;
  window.toggleMobileSidebar = toggleMobileSidebar;
  window.logoutAdmin = logoutAdmin;
  window.handleAdminLoginSubmitEvent = handleAdminLoginSubmitEvent;

  // Employee functions
  window.filterEmployees = filterEmployees;
  window.openAddEmployeeModal = openAddEmployeeModal;
  window.openEditEmployeeModal = openEditEmployeeModal;
  window.closeEmployeeModal = closeEmployeeModal;
  window.handleEmployeeFormSubmit = handleEmployeeFormSubmit;
  window.confirmDeleteEmployee = confirmDeleteEmployee;

  // Attendance functions
  window.filterAttendanceRecords = filterAttendanceRecords;
  window.openMarkAttendanceModal = openMarkAttendanceModal;
  window.closeMarkAttendanceModal = closeMarkAttendanceModal;
  window.handleMarkAttendanceSubmit = handleMarkAttendanceSubmit;
  window.exportAttendanceCSV = exportAttendanceCSV;
  window.clearAttendanceDateFilter = clearAttendanceDateFilter;
  window.exportAttendancePDFReport = exportAttendancePDFReport;

  // POS functions
  window.filterPosCategory = filterPosCategory;
  window.searchPosCatalog = searchPosCatalog;
  window.addToPosCart = addToPosCart;
  window.updateCartQty = updateCartQty;
  window.removeFromCart = removeFromCart;
  window.clearCart = clearCart;
  window.handleDiscountChange = handleDiscountChange;
  window.toggleGstTax = toggleGstTax;
  window.processCheckoutSale = processCheckoutSale;
  window.closeReceiptModal = closeReceiptModal;
  window.printCurrentReceipt = printCurrentReceipt;

  // Products functions
  window.filterProductsList = filterProductsList;
  window.openAddProductModal = openAddProductModal;
  window.openEditProductModal = openEditProductModal;
  window.closeProductModal = closeProductModal;
  window.handleProductFormSubmit = handleProductFormSubmit;
  window.confirmDeleteProduct = confirmDeleteProduct;
  window.updateProductImagePreview = updateProductImagePreview;
  window.handleProductPhotoFileUpload = handleProductPhotoFileUpload;

  // Custom Confirm Modal Helper
  window.showConfirmModal = function(title, message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal) {
      onConfirm();
      return;
    }
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-msg');
    if (titleEl) titleEl.innerText = title || 'Confirm Delete';
    if (msgEl) msgEl.innerText = message || 'Are you sure you want to delete this record?';

    const okBtn = document.getElementById('confirm-modal-ok-btn');
    const cancelBtn = document.getElementById('confirm-modal-cancel-btn');

    const close = () => {
      modal.classList.add('hidden');
      if (okBtn) okBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
    };

    if (okBtn) {
      okBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        close();
        onConfirm();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        close();
      };
    }

    modal.classList.remove('hidden');
  };

  // Categories functions
  window.openAddCategoryModal = openAddCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.handleCategoryFormSubmit = handleCategoryFormSubmit;
  window.confirmDeleteCategory = confirmDeleteCategory;

  // Stock functions
  window.filterStockLogs = filterStockLogs;
  window.openAddStockInModal = openAddStockInModal;
  window.closeAddStockInModal = closeAddStockInModal;
  window.handleStockInSubmit = handleStockInSubmit;
  window.openStockOutModal = openStockOutModal;
  window.closeStockOutModal = closeStockOutModal;
  window.handleStockOutSubmit = handleStockOutSubmit;

  // Sales functions
  window.filterSalesHistory = filterSalesHistory;
  window.viewSaleInvoice = viewSaleInvoice;
  window.deleteSaleBill = deleteSaleBill;

  // Expenses functions
  window.filterExpensesList = filterExpensesList;
  window.openAddExpenseModal = openAddExpenseModal;
  window.closeExpenseModal = closeExpenseModal;
  window.handleExpenseFormSubmit = handleExpenseFormSubmit;

  // Customers functions
  window.filterCustomersList = filterCustomersList;
  window.openAddCustomerModal = openAddCustomerModal;
  window.closeCustomerModal = closeCustomerModal;
  window.handleCustomerFormSubmit = handleCustomerFormSubmit;
  window.deleteCustomerItem = deleteCustomerItem;

  // Reports functions
  window.exportFullShopReport = exportFullShopReport;

  // Settings functions
  window.handleSaveSettingsSubmit = handleSaveSettingsSubmit;
  window.resetAllShopData = resetAllShopData;
}
