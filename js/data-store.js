// ============================================================================
// SUPERMART ADMIN - CENTRAL DATA STORE & PERSISTENCE ENGINE
// Supports LocalStorage fallback & Firestore sync
// ============================================================================

const STORAGE_KEYS = {
  ADMIN_USER: 'smarthr_admin_user',
  EMPLOYEES: 'supermart_admin_employees',
  ATTENDANCE: 'supermart_admin_attendance',
  PRODUCTS: 'supermart_admin_products',
  CATEGORIES: 'supermart_admin_categories',
  SALES: 'supermart_admin_sales',
  EXPENSES: 'supermart_admin_expenses',
  STOCK_LOGS: 'supermart_admin_stock_logs',
  CUSTOMERS: 'supermart_admin_customers',
  SETTINGS: 'supermart_admin_settings'
};

// Helper function to get today's local date string (YYYY-MM-DD)
const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayDate = getTodayDateStr();

import { db } from './firebase-config.js';

// Initial Seed Data for immediate rich experience
export const SEED_EMPLOYEES = [
  { id: 'emp_1', empId: 'EMP-101', name: 'Rahul Sharma', phone: '9876543210', role: 'Store Manager', designation: 'Store Manager', status: 'Active', baseSalary: 35000, joiningDate: '2024-01-15', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', bankName: 'SBI', accNumber: '39482019485', ifscCode: 'SBIN0001234' },
  { id: 'emp_2', empId: 'EMP-102', name: 'Priya Verma', phone: '9812345678', role: 'Senior Cashier', designation: 'Cashier', status: 'Active', baseSalary: 22000, joiningDate: '2024-03-10', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', bankName: 'HDFC', accNumber: '50100293849', ifscCode: 'HDFC0000456' },
  { id: 'emp_3', empId: 'EMP-103', name: 'Amit Kumar', phone: '9988776655', role: 'Sales Executive', designation: 'Salesman', status: 'Active', baseSalary: 18000, joiningDate: '2024-05-01', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', bankName: 'ICICI', accNumber: '00129384950', ifscCode: 'ICIC0000123' },
  { id: 'emp_4', empId: 'EMP-104', name: 'Neha Singh', phone: '9765432109', role: 'Inventory Handler', designation: 'Stock Supervisor', status: 'On Leave', baseSalary: 20000, joiningDate: '2024-06-20', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', bankName: 'Axis Bank', accNumber: '91802003948', ifscCode: 'UTIB0000789' }
];

export const SEED_CATEGORIES = [
  { id: 'cat_1', name: 'Groceries & Staples', icon: 'fa-wheat-awn', description: 'Atta, Rice, Dal, Edible Oils, Spices', productCount: 12 },
  { id: 'cat_2', name: 'Dairy & Bakery', icon: 'fa-box-open', description: 'Milk, Bread, Butter, Cheese, Yogurt', productCount: 8 },
  { id: 'cat_3', name: 'Snacks & Beverages', icon: 'fa-cookie-bite', description: 'Chips, Biscuits, Cold Drinks, Juices', productCount: 15 },
  { id: 'cat_4', name: 'Personal Care', icon: 'fa-pump-soap', description: 'Soaps, Shampoos, Toothpaste, Deos', productCount: 10 },
  { id: 'cat_5', name: 'Household Supplies', icon: 'fa-jug-detergent', description: 'Detergents, Cleaners, Tissues', productCount: 6 }
];

export const SEED_PRODUCTS = [
  { id: 'prod_1', sku: 'GRO-001', barcode: '890103080001', name: 'Aashirvaad Whole Wheat Atta 5kg', category: 'Groceries & Staples', buyingPrice: 210, sellingPrice: 245, stockQty: 45, minStockAlert: 10, unit: '5 kg Pack', icon: 'fa-wheat-awn', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_2', sku: 'GRO-002', barcode: '890103080002', name: 'Fortune Sunlite Sunflower Oil 1L', category: 'Groceries & Staples', buyingPrice: 125, sellingPrice: 145, stockQty: 28, minStockAlert: 10, unit: '1 Litre Pouch', icon: 'fa-bottle-droplet', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_3', sku: 'DAI-001', barcode: '890103080003', name: 'Amul Taaza Toned Milk 500ml', category: 'Dairy & Bakery', buyingPrice: 25, sellingPrice: 28, stockQty: 60, minStockAlert: 15, unit: '500 ml Pouch', icon: 'fa-wine-bottle', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_4', sku: 'DAI-002', barcode: '890103080004', name: 'Amul Butter Pasteurised 100g', category: 'Dairy & Bakery', buyingPrice: 50, sellingPrice: 56, stockQty: 4, minStockAlert: 8, unit: '100g Pack', icon: 'fa-cubes', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_5', sku: 'SNA-001', barcode: '890103080005', name: 'Lay\'s Magic Masala Chips 50g', category: 'Snacks & Beverages', buyingPrice: 16, sellingPrice: 20, stockQty: 85, minStockAlert: 20, unit: '50g Packet', icon: 'fa-cookie', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_6', sku: 'SNA-002', barcode: '890103080006', name: 'Coca Cola Soft Drink 750ml', category: 'Snacks & Beverages', buyingPrice: 32, sellingPrice: 40, stockQty: 0, minStockAlert: 10, unit: '750ml Bottle', icon: 'fa-bottle-water', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_7', sku: 'PER-001', barcode: '890103080007', name: 'Dove Beauty Bathing Soap 100g', category: 'Personal Care', buyingPrice: 48, sellingPrice: 58, stockQty: 32, minStockAlert: 10, unit: '100g Soap', icon: 'fa-pump-soap', imageUrl: 'https://images.unsplash.com/photo-1607006482602-7650827a223d?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_8', sku: 'PER-002', barcode: '890103080008', name: 'Colgate Strong Teeth Toothpaste 200g', category: 'Personal Care', buyingPrice: 82, sellingPrice: 98, stockQty: 3, minStockAlert: 10, unit: '200g Tube', icon: 'fa-tooth', imageUrl: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&q=80&w=300' }
];

export const SEED_CUSTOMERS = [
  { id: 'cust_1', name: 'Rajesh Sharma', phone: '9876500001', email: 'rajesh@gmail.com', totalPurchases: 14, totalSpent: 8450, loyaltyPoints: 420, createdAt: todayDate },
  { id: 'cust_2', name: 'Sunita Patel', phone: '9876500002', email: 'sunita@yahoo.com', totalPurchases: 8, totalSpent: 4200, loyaltyPoints: 210, createdAt: todayDate },
  { id: 'cust_3', name: 'Rohan Gupta', phone: '9876500003', email: 'rohan.g@gmail.com', totalPurchases: 21, totalSpent: 14900, loyaltyPoints: 745, createdAt: todayDate }
];

export const SEED_SALES = [
  { id: 'sale_101', invoiceNumber: 'INV-2026-0801', customerName: 'Rajesh Sharma', customerPhone: '9876500001', items: JSON.stringify([{ id: 'prod_1', name: 'Aashirvaad Atta 5kg', qty: 2, price: 245 }, { id: 'prod_2', name: 'Fortune Oil 1L', qty: 1, price: 145 }]), subtotal: 635, discount: 35, gstTax: 30, grandTotal: 630, paymentMode: 'UPI', cashierId: 'EMP-102', cashierName: 'Priya Verma', timestamp: new Date().toISOString(), status: 'Completed' },
  { id: 'sale_102', invoiceNumber: 'INV-2026-0802', customerName: 'Walk-in Customer', customerPhone: '9999999999', items: JSON.stringify([{ id: 'prod_5', name: 'Lay\'s Magic Masala', qty: 5, price: 20 }, { id: 'prod_3', name: 'Amul Milk 500ml', qty: 2, price: 28 }]), subtotal: 156, discount: 6, gstTax: 0, grandTotal: 150, paymentMode: 'Cash', cashierId: 'EMP-102', cashierName: 'Priya Verma', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'Completed' },
  { id: 'sale_103', invoiceNumber: 'INV-2026-0803', customerName: 'Sunita Patel', customerPhone: '9876500002', items: JSON.stringify([{ id: 'prod_8', name: 'Colgate Toothpaste', qty: 1, price: 98 }, { id: 'prod_7', name: 'Dove Bathing Soap', qty: 2, price: 58 }]), subtotal: 214, discount: 14, gstTax: 10, grandTotal: 210, paymentMode: 'Card', cashierId: 'EMP-101', cashierName: 'Rahul Sharma', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'Completed' }
];

export const SEED_ATTENDANCE = [
  { id: 'att_101', empId: 'EMP-101', empName: 'Rahul Sharma', date: todayDate, checkInTime: '08:55 AM', checkOutTime: '---', status: 'Present', workHours: 8.5, overtimeHours: 0, location: 'Store Main Gate' },
  { id: 'att_102', empId: 'EMP-102', empName: 'Priya Verma', date: todayDate, checkInTime: '09:02 AM', checkOutTime: '---', status: 'Present', workHours: 8.2, overtimeHours: 0, location: 'POS Counter 1' },
  { id: 'att_103', empId: 'EMP-103', empName: 'Amit Kumar', date: todayDate, checkInTime: '09:15 AM', checkOutTime: '---', status: 'Late', workHours: 7.8, overtimeHours: 0, location: 'Floor Display' },
  { id: 'att_104', empId: 'EMP-104', empName: 'Neha Singh', date: todayDate, checkInTime: '---', checkOutTime: '---', status: 'On Leave', workHours: 0, overtimeHours: 0, location: '---' }
];

export const SEED_EXPENSES = [
  { id: 'exp_1', category: 'Electricity', title: 'Monthly Store Air Conditioning & Lights', amount: 12500, date: todayDate, paymentMode: 'Bank Transfer', notes: 'Torrent Power Bill' },
  { id: 'exp_2', category: 'Rent', title: 'Retail Shop Floor Space Rent', amount: 45000, date: todayDate, paymentMode: 'Bank Transfer', notes: 'Paid to Property Owner' },
  { id: 'exp_3', category: 'Maintenance', title: 'POS Thermal Printer & Barcode Scanner Service', amount: 1800, date: todayDate, paymentMode: 'UPI', notes: 'Tech service visit' }
];

export const SEED_STOCK_LOGS = [
  { id: 'stk_1', type: 'Stock In', productId: 'prod_1', productName: 'Aashirvaad Whole Wheat Atta 5kg', quantity: 50, supplier: 'ITC Wholesale Ltd', invoiceNumber: 'SUP-9081', reason: 'Fresh Stock Inbound', date: todayDate },
  { id: 'stk_2', type: 'Stock Out', productId: 'prod_6', productName: 'Coca Cola Soft Drink 750ml', quantity: 12, supplier: '---', invoiceNumber: '---', reason: 'Damaged / Leaked Bottling', date: todayDate }
];

export const DEFAULT_SETTINGS = {
  shopName: 'SuperMart Retail',
  tagline: 'Fresh Groceries & Supermarket',
  address: 'Shop #12-15, Prime Commercial Hub, Main Road, City',
  phone: '9876543210',
  email: 'admin@supermart.com',
  gstin: '24AAAAA0000A1Z5',
  gstPercentage: 5,
  currencySymbol: '₹',
  receiptHeader: 'Thank You For Shopping At SuperMart!',
  receiptFooter: 'Goods once sold can be exchanged within 7 days with valid receipt.',
  logoUrl: ''
};

// Helper function to read from LocalStorage
function getStoredData(key, defaultData) {
  try {
    const data = localStorage.getItem(key);
    if (data === null || data === undefined || data === '' || data === '[]') {
      if (Array.isArray(defaultData) && defaultData.length > 0) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      }
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultData) && defaultData.length > 0) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return parsed;
  } catch (err) {
    console.error(`Error reading ${key}:`, err);
    return defaultData;
  }
}

// Helper function to write to LocalStorage
function setStoredData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error setting ${key}:`, err);
  }
}

// Global DB Interface
export const dbStore = {
  // Employees
  getEmployees: () => getStoredData(STORAGE_KEYS.EMPLOYEES, SEED_EMPLOYEES),
  saveEmployees: (data) => setStoredData(STORAGE_KEYS.EMPLOYEES, data),
  addEmployee: (emp) => {
    const list = dbStore.getEmployees();
    list.unshift(emp);
    dbStore.saveEmployees(list);
    if (db) db.collection('employees').doc(emp.id).set(emp).catch(e => console.warn(e));
    return list;
  },
  updateEmployee: (id, updatedFields) => {
    const list = dbStore.getEmployees();
    const idx = list.findIndex(e => e.id === id || e.empId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      dbStore.saveEmployees(list);
      if (db) db.collection('employees').doc(list[idx].id).set(list[idx]).catch(e => console.warn(e));
    }
    return list;
  },
  deleteEmployee: (id) => {
    let list = dbStore.getEmployees();
    const target = list.find(e => e.id === id || e.empId === id || e.phone === id);
    list = list.filter(e => e.id !== id && e.empId !== id && e.phone !== id);
    dbStore.saveEmployees(list);

    if (db) {
      if (target && target.id) db.collection('employees').doc(target.id).delete().catch(e => console.warn(e));
      if (target && target.empId) db.collection('employees').doc(target.empId).delete().catch(e => console.warn(e));
      if (id) db.collection('employees').doc(id).delete().catch(e => console.warn(e));
    }

    // Clean associated attendance records for deleted employee
    if (target) {
      let atts = dbStore.getAttendance();
      const matchKeys = [target.id, target.empId, target.phone].filter(Boolean);
      const toDelete = atts.filter(a => a && (matchKeys.includes(a.empId) || matchKeys.includes(a.phone) || matchKeys.includes(a.id)));
      atts = atts.filter(a => !a || (!matchKeys.includes(a.empId) && !matchKeys.includes(a.phone) && !matchKeys.includes(a.id)));
      dbStore.saveAttendance(atts);

      if (db) {
        toDelete.forEach(a => {
          if (a.docId) db.collection('attendance').doc(a.docId).delete().catch(e => console.warn(e));
          if (a.id) db.collection('attendance').doc(a.id).delete().catch(e => console.warn(e));
        });
      }
    }
    return list;
  },

  // Products
  getProducts: () => getStoredData(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS),
  saveProducts: (data) => setStoredData(STORAGE_KEYS.PRODUCTS, data),
  addProduct: (prod) => {
    const list = dbStore.getProducts();
    list.unshift(prod);
    dbStore.saveProducts(list);
    if (db) db.collection('products').doc(prod.id).set(prod).catch(e => console.warn(e));
    return list;
  },
  updateProduct: (id, fields) => {
    const list = dbStore.getProducts();
    const idx = list.findIndex(p => p.id === id || p.sku === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...fields };
      dbStore.saveProducts(list);
      if (db) db.collection('products').doc(list[idx].id).set(list[idx]).catch(e => console.warn(e));
    }
    return list;
  },
  deleteProduct: (id) => {
    let list = dbStore.getProducts();
    const target = list.find(p => p.id === id || p.sku === id);
    list = list.filter(p => p.id !== id && p.sku !== id);
    dbStore.saveProducts(list);
    if (db) {
      if (target && target.id) db.collection('products').doc(target.id).delete().catch(e => console.warn(e));
      if (target && target.sku) db.collection('products').doc(target.sku).delete().catch(e => console.warn(e));
      if (id) db.collection('products').doc(id).delete().catch(e => console.warn(e));
    }
    return list;
  },

  // Categories
  getCategories: () => getStoredData(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES),
  saveCategories: (data) => setStoredData(STORAGE_KEYS.CATEGORIES, data),
  addCategory: (cat) => {
    const list = dbStore.getCategories();
    list.unshift(cat);
    dbStore.saveCategories(list);
    if (db) db.collection('categories').doc(cat.id).set(cat).catch(e => console.warn(e));
    return list;
  },
  deleteCategory: (id) => {
    let list = dbStore.getCategories();
    const target = list.find(c => c.id === id || c.name === id);
    list = list.filter(c => c.id !== id && c.name !== id);
    dbStore.saveCategories(list);
    if (db) {
      if (target && target.id) db.collection('categories').doc(target.id).delete().catch(e => console.warn(e));
      if (target && target.name) db.collection('categories').doc(target.name).delete().catch(e => console.warn(e));
      if (id) db.collection('categories').doc(id).delete().catch(e => console.warn(e));
    }
    return list;
  },

  // Sales
  getSales: () => getStoredData(STORAGE_KEYS.SALES, SEED_SALES),
  saveSales: (data) => setStoredData(STORAGE_KEYS.SALES, data),
  addSale: (sale) => {
    const list = dbStore.getSales();

    // Verify if entered customer mobile number exists in customers collection
    try {
      const custPhone = (sale.customerPhone || sale.phone || '').trim();
      const custName = sale.customerName || 'Walk-in Customer';
      const grandTotal = Number(sale.grandTotal ?? sale.subtotal ?? sale.amount ?? 0);

      if (custPhone && custPhone !== '9999999999' && custPhone !== 'N/A' && custPhone !== 'Walk-in Customer') {
        const customers = dbStore.getCustomers();
        let custMatch = customers.find(c => c && c.phone === custPhone);

        if (custMatch) {
          // Exists: link document ID to sale
          sale.customerId = custMatch.id;
          sale.customerDocId = custMatch.id;
          custMatch.totalPurchases = (custMatch.totalPurchases || 0) + 1;
          custMatch.totalSpent = (custMatch.totalSpent || 0) + grandTotal;
          custMatch.loyaltyPoints = (custMatch.loyaltyPoints || 0) + Math.floor(grandTotal / 10);
          if (custName !== 'Walk-in Customer') custMatch.name = custName;
          dbStore.saveCustomers(customers);
          if (db) db.collection('customers').doc(custMatch.id).set(custMatch).catch(e => console.warn(e));
        } else {
          // Not found: treat as new customer and create profile entry in real-time
          const newCustId = sale.customerId || `cust_${custPhone.replace(/\D/g, '') || Date.now()}`;
          const newCust = {
            id: newCustId,
            name: custName !== 'Walk-in Customer' ? custName : `Customer (${custPhone.slice(-4)})`,
            phone: custPhone,
            email: `${custPhone}@supermart.in`,
            totalPurchases: 1,
            totalSpent: grandTotal,
            loyaltyPoints: Math.floor(grandTotal / 10),
            createdAt: new Date().toISOString().split('T')[0]
          };
          customers.unshift(newCust);
          dbStore.saveCustomers(customers);
          if (db) db.collection('customers').doc(newCust.id).set(newCust).catch(e => console.warn(e));
          sale.customerId = newCustId;
          sale.customerDocId = newCustId;
        }
      }
    } catch (err) {
      console.warn("Error linking customer profile on sale:", err);
    }

    list.unshift(sale);
    dbStore.saveSales(list);
    if (db) db.collection('sales').doc(sale.id).set(sale).catch(e => console.warn(e));

    // Deduct inventory stock for items sold
    try {
      const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
      const prods = dbStore.getProducts();
      items.forEach(item => {
        const pIdx = prods.findIndex(p => p.id === item.id || p.name === item.name);
        if (pIdx !== -1) {
          prods[pIdx].stockQty = Math.max(0, prods[pIdx].stockQty - item.qty);
          if (db) db.collection('products').doc(prods[pIdx].id).set(prods[pIdx]).catch(e => console.warn(e));
        }
      });
      dbStore.saveProducts(prods);
    } catch (e) { console.error('Error updating stock on sale', e); }

    return list;
  },
  deleteSale: (saleId) => {
    let list = dbStore.getSales();
    const target = list.find(s => s.id === saleId || s.invoiceNumber === saleId || s.invoiceNo === saleId || s.invoiceId === saleId);
    list = list.filter(s => s.id !== saleId && s.invoiceNumber !== saleId && s.invoiceNo !== saleId && s.invoiceId !== saleId);
    dbStore.saveSales(list);

    if (db) {
      if (target && target.id) db.collection('sales').doc(target.id).delete().catch(e => console.warn(e));
      if (target && target.invoiceId) db.collection('sales').doc(target.invoiceId).delete().catch(e => console.warn(e));
      if (saleId) db.collection('sales').doc(saleId).delete().catch(e => console.warn(e));
    }
    return list;
  },

  // Attendance
  getAttendance: () => getStoredData(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE),
  saveAttendance: (data) => setStoredData(STORAGE_KEYS.ATTENDANCE, data),
  markAttendance: (rec) => {
    const list = dbStore.getAttendance();
    list.unshift(rec);
    dbStore.saveAttendance(list);
    return list;
  },

  // Expenses
  getExpenses: () => getStoredData(STORAGE_KEYS.EXPENSES, SEED_EXPENSES),
  saveExpenses: (data) => setStoredData(STORAGE_KEYS.EXPENSES, data),
  addExpense: (exp) => {
    const list = dbStore.getExpenses();
    list.unshift(exp);
    dbStore.saveExpenses(list);
    return list;
  },

  // Stock Movement Logs
  getStockLogs: () => getStoredData(STORAGE_KEYS.STOCK_LOGS, SEED_STOCK_LOGS),
  saveStockLogs: (data) => setStoredData(STORAGE_KEYS.STOCK_LOGS, data),
  addStockLog: (log) => {
    const list = dbStore.getStockLogs();
    list.unshift(log);
    dbStore.saveStockLogs(list);

    // Update Product Stock Qty
    const prods = dbStore.getProducts();
    const pIdx = prods.findIndex(p => p.id === log.productId);
    if (pIdx !== -1) {
      if (log.type === 'Stock In') {
        prods[pIdx].stockQty += Number(log.quantity);
      } else {
        prods[pIdx].stockQty = Math.max(0, prods[pIdx].stockQty - Number(log.quantity));
      }
      dbStore.saveProducts(prods);
    }
    return list;
  },

  // Customers
  getCustomers: () => {
    let customers = getStoredData(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    const sales = getStoredData(STORAGE_KEYS.SALES, SEED_SALES);

    // Map sales by customer phone number
    const salesByPhone = {};
    sales.forEach(s => {
      let phone = (s.customerPhone || s.phone || '').trim();
      if (phone && phone !== 'N/A' && phone !== 'Walk-in Customer' && phone !== 'undefined') {
        if (!salesByPhone[phone]) salesByPhone[phone] = [];
        salesByPhone[phone].push(s);
      }
    });

    // Auto-create customer entries for phones present in sales but missing in customer list
    let listChanged = false;
    Object.keys(salesByPhone).forEach(phone => {
      const existing = customers.find(c => c && c.phone === phone);
      if (!existing) {
        const sampleSale = salesByPhone[phone][0];
        const custName = (sampleSale.customerName && sampleSale.customerName !== 'undefined' && sampleSale.customerName !== 'Walk-in Customer')
          ? sampleSale.customerName
          : (sampleSale.name && sampleSale.name !== 'Walk-in Customer') ? sampleSale.name : `Customer (${phone.slice(-4)})`;

        const newCust = {
          id: `cust_${phone.replace(/\D/g, '') || Date.now()}`,
          name: custName,
          phone: phone,
          email: `${phone}@supermart.in`,
          totalPurchases: 0,
          totalSpent: 0,
          loyaltyPoints: 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        customers.push(newCust);
        listChanged = true;
        if (db) db.collection('customers').doc(newCust.id).set(newCust).catch(e => console.warn(e));
      }
    });

    // Calculate real-time totals and loyalty points from actual sales
    customers = customers.map(c => {
      if (!c || !c.phone) return c;
      const custSales = salesByPhone[c.phone] || [];
      if (custSales.length > 0) {
        const realPurchases = custSales.length;
        const realSpent = custSales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.subtotal ?? s.amount ?? s.totalAmount ?? s.total ?? 0), 0);
        const realLoyalty = Math.floor(realSpent / 10); // 1 point for every ₹10 spent
        return {
          ...c,
          totalPurchases: realPurchases,
          totalSpent: realSpent,
          loyaltyPoints: Math.max(c.loyaltyPoints || 0, realLoyalty)
        };
      }
      return c;
    });

    if (listChanged) {
      setStoredData(STORAGE_KEYS.CUSTOMERS, customers);
    }

    return customers;
  },
  saveCustomers: (data) => setStoredData(STORAGE_KEYS.CUSTOMERS, data),
  addCustomer: (cust) => {
    const list = dbStore.getCustomers();
    const existingIdx = list.findIndex(c => c.phone === cust.phone || c.id === cust.id);
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...cust };
    } else {
      list.unshift(cust);
    }
    dbStore.saveCustomers(list);
    if (db) db.collection('customers').doc(cust.id || `cust_${Date.now()}`).set(cust).catch(e => console.warn(e));
    return list;
  },
  deleteCustomer: (id) => {
    let list = dbStore.getCustomers();
    const target = list.find(c => c.id === id || c.phone === id);
    list = list.filter(c => c.id !== id && c.phone !== id);
    dbStore.saveCustomers(list);
    if (db) {
      if (target && target.id) db.collection('customers').doc(target.id).delete().catch(e => console.warn(e));
      if (id) db.collection('customers').doc(id).delete().catch(e => console.warn(e));
    }
    return list;
  },

  // Settings
  getSettings: () => getStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (data) => setStoredData(STORAGE_KEYS.SETTINGS, data),

  // Reset Data to Factory Default
  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    window.location.reload();
  }
};
