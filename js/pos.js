/* ==========================================================================
   SUPERMART RETAIL - POS PRODUCT CATALOG & CART SALES ENGINE
   ========================================================================== */

import { db, getTodayDateKey, showToast } from './firebase-config.js';
import { dbStore } from './data-store.js';

let salesListenerUnsub = null;
let currentTodaySales = [];

// Helper to retrieve live product catalog from database/Firestore
export function getStoreCatalog() {
  if (dbStore && typeof dbStore.getProducts === 'function') {
    const products = dbStore.getProducts();
    if (products && products.length > 0) return products;
  }
  return DEFAULT_CATALOG;
}

// Fallback Default Catalog
export const DEFAULT_CATALOG = [
  { id: 'p1', name: 'Aashirvaad Whole Wheat Atta 5kg', price: 245, category: 'Grocery', icon: 'fa-wheat-awn', unit: 'Pack' },
  { id: 'p2', name: 'Fortune Sunlite Oil 1L', price: 165, category: 'Grocery', icon: 'fa-bottle-droplet', unit: 'Pouch' },
  { id: 'p3', name: 'Amul Pasteurised Butter 500g', price: 275, category: 'Dairy', icon: 'fa-cheese', unit: 'Box' },
  { id: 'p4', name: 'Amul Taaza Toned Milk 1L', price: 56, category: 'Dairy', icon: 'fa-box-tissue', unit: 'Pack' },
  { id: 'p5', name: 'Coca-Cola Soft Drink 750ml', price: 40, category: 'Beverages', icon: 'fa-wine-bottle', unit: 'Bottle' },
  { id: 'p6', name: 'Tata Iodized Salt 1kg', price: 28, category: 'Grocery', icon: 'fa-bowl-rice', unit: 'Pack' },
  { id: 'p7', name: 'Maggi 2-Minute Noodles 4-Pack', price: 58, category: 'Snacks', icon: 'fa-bowl-food', unit: 'Pack' },
  { id: 'p8', name: 'Britannia Good Day Biscuits 200g', price: 35, category: 'Snacks', icon: 'fa-cookie', unit: 'Pack' },
  { id: 'p9', name: 'Cadbury Dairy Milk Silk 150g', price: 175, category: 'Snacks', icon: 'fa-candy-cane', unit: 'Bar' },
  { id: 'p10', name: 'Surf Excel Easy Wash Powder 1kg', price: 140, category: 'Household', icon: 'fa-shirt', unit: 'Pack' },
  { id: 'p11', name: 'Dettol Antiseptic Soap 125g', price: 48, category: 'Household', icon: 'fa-pump-soap', unit: 'Bar' },
  { id: 'p12', name: 'Fresh Farm Bananas 1 Dozen', price: 60, category: 'Fruits', icon: 'fa-apple-whole', unit: 'Dozen' }
];

// Active POS Shopping Cart State
export let posCart = [];

export function addToCart(productId) {
  const catalog = getStoreCatalog();
  const product = catalog.find(p => p.id === productId || p.sku === productId);
  if (!product) return;

  const existing = posCart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    posCart.push({ ...product, price: Number(product.sellingPrice || product.price || 0), quantity: 1 });
  }
  showToast(`Added ${product.name} to cart`, 'emerald');
}

export function updateCartQuantity(productId, delta) {
  const itemIndex = posCart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    posCart[itemIndex].quantity += delta;
    if (posCart[itemIndex].quantity <= 0) {
      posCart.splice(itemIndex, 1);
    }
  }
}

export function removeFromCart(productId) {
  posCart = posCart.filter(item => item.id !== productId);
}

export function clearCart() {
  posCart = [];
}

export function getCartSummary() {
  const totalItems = posCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal > 1000 ? Math.round(subtotal * 0.05) : 0; // 5% bulk discount over 1000
  const finalTotal = Math.max(0, subtotal - discount);

  return { totalItems, subtotal, discount, finalTotal };
}

// Listen to today's sales transactions in Realtime
export function listenToTodaySales(userPhone, onSalesUpdate) {
  if (!userPhone) return;

  const todayKey = getTodayDateKey();

  if (salesListenerUnsub) {
    salesListenerUnsub();
    salesListenerUnsub = null;
  }

  if (db) {
    salesListenerUnsub = db.collection('sales')
      .where('date', '==', todayKey)
      .where('phone', '==', userPhone)
      .onSnapshot((snapshot) => {
        const sales = [];
        snapshot.forEach(doc => sales.push({ id: doc.id, ...doc.data() }));
        sales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        currentTodaySales = sales;
        if (onSalesUpdate) onSalesUpdate(sales);
      }, (err) => {
        console.warn("Realtime sales listener fallback:", err);
      });
  } else {
    const local = localStorage.getItem(`sales_${userPhone}_${todayKey}`);
    currentTodaySales = local ? JSON.parse(local) : [];
    if (onSalesUpdate) onSalesUpdate(currentTodaySales);
  }
}

// Log a new POS Sale
export async function logNewSale(user, saleData, onSuccess) {
  if (!user || !user.phone) return showToast('User session invalid', 'rose');

  const todayKey = getTodayDateKey();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const invoiceId = 'INV-' + Math.floor(100000 + Math.random() * 900000);

  const custPhoneClean = (saleData.customerPhone && saleData.customerPhone !== 'Walk-in Customer') ? saleData.customerPhone : 'N/A';
  const custNameClean = saleData.customerName || 'Walk-in Customer';

  const saleRecord = {
    id: `sale_${Date.now()}`,
    invoiceId,
    invoiceNumber: invoiceId,
    phone: user.phone,
    empId: user.empId,
    name: user.name,
    customerName: custNameClean,
    customerPhone: custPhoneClean,
    category: saleData.category || 'General Store',
    amount: Number(saleData.amount),
    subtotal: Number(saleData.amount),
    grandTotal: Number(saleData.amount),
    paymentMethod: saleData.paymentMethod || 'UPI',
    paymentMode: saleData.paymentMethod || 'UPI',
    items: saleData.items || 'SuperMart Grocery Items',
    itemDetails: saleData.itemDetails || [],
    date: todayKey,
    time: timeStr,
    timestamp: now.getTime()
  };

  try {
    if (dbStore && dbStore.addSale) {
      dbStore.addSale(saleRecord);
    } else if (db) {
      await db.collection('sales').add(saleRecord);
    } else {
      currentTodaySales.unshift(saleRecord);
      localStorage.setItem(`sales_${user.phone}_${todayKey}`, JSON.stringify(currentTodaySales));
    }
  } catch (err) {
    console.warn("Sale log cloud sync fallback:", err);
    currentTodaySales.unshift(saleRecord);
    localStorage.setItem(`sales_${user.phone}_${todayKey}`, JSON.stringify(currentTodaySales));
  }

  showToast(`Bill #${invoiceId} of ₹${saleData.amount} logged!`, 'emerald');
  if (onSuccess) onSuccess(saleRecord);
}

// Printable Thermal Receipt
export function printReceipt(sale) {
  if (!sale) return;
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return showToast('Pop-up blocked. Please allow pop-ups to print.', 'amber');

  const itemsHtml = Array.isArray(sale.itemDetails) && sale.itemDetails.length > 0
    ? sale.itemDetails.map(i => `
        <tr>
          <td style="padding: 4px 0;">${i.name} x${i.quantity}</td>
          <td style="text-align: right; padding: 4px 0;">₹${i.price * i.quantity}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="2" style="padding: 4px 0;">${sale.items}</td></tr>`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SuperMart Receipt - ${sale.invoiceId || 'POS'}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 15px; color: #000; width: 280px; margin: auto; }
        .text-center { text-align: center; }
        .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .flex-between { display: flex; justify-content: space-between; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="text-center border-b">
        <h2 style="margin: 0;">SUPERMART RETAIL</h2>
        <p style="margin: 2px 0;">Store #104 - Main Market Rd</p>
        <p style="margin: 2px 0;">GSTIN: 07AAAAA0000A1Z5</p>
      </div>

      <div class="border-b">
        <div class="flex-between"><span>Inv No:</span><span class="bold">${sale.invoiceId || 'INV-001'}</span></div>
        <div class="flex-between"><span>Date:</span><span>${sale.date} ${sale.time}</span></div>
        <div class="flex-between"><span>Cashier:</span><span>${sale.name || 'Staff'} (${sale.empId || 'EMP'})</span></div>
        <div class="flex-between"><span>Customer:</span><span>${sale.customerPhone}</span></div>
      </div>

      <table>
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left;">Item</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="border-b" style="padding-top: 5px;">
        <div class="flex-between bold" style="font-size: 14px;">
          <span>TOTAL AMOUNT:</span>
          <span>₹${sale.amount}</span>
        </div>
        <div class="flex-between" style="margin-top: 4px;">
          <span>Payment Mode:</span>
          <span>${sale.paymentMethod}</span>
        </div>
      </div>

      <div class="text-center" style="margin-top: 15px;">
        <p style="margin: 0;">Thank You For Shopping!</p>
        <p style="margin: 2px 0; font-size: 10px;">*** SuperMart Quality Guaranteed ***</p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Calculate total sales amount
export function getTotalSalesAmount(salesList) {
  if (!Array.isArray(salesList)) return 0;
  return salesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}
