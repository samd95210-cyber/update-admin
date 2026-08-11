// ============================================================================
// POS BILLING MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

let activeCart = [];
let selectedCategory = 'All';
let currentDiscount = 0;
let applyGstTax = true;

export function renderPosView() {
  activeCart = [];
  currentDiscount = 0;
  selectedCategory = 'All';
  
  renderPosCategories();
  renderPosCatalog();
  renderPosCart();
}

export function filterPosCategory(category) {
  selectedCategory = category;
  renderPosCategories();
  renderPosCatalog();
}

function renderPosCategories() {
  const container = document.getElementById('pos-categories-chips');
  if (!container) return;

  const categories = dbStore.getCategories();
  const allCats = [{ name: 'All' }, ...categories];

  container.innerHTML = allCats.map(c => {
    const isSelected = c.name === selectedCategory;
    const btnClass = isSelected 
      ? 'bg-emerald-600 text-white font-black border-emerald-500 shadow-md shadow-emerald-600/30' 
      : 'bg-slate-900 text-slate-300 font-bold border-slate-800 hover:border-slate-700';

    return `
      <button onclick="filterPosCategory('${c.name}')" class="px-3.5 py-1.5 rounded-xl text-xs border whitespace-nowrap transition ${btnClass}">
        ${c.name}
      </button>
    `;
  }).join('');
}

export function searchPosCatalog() {
  renderPosCatalog();
}

function renderPosCatalog() {
  const grid = document.getElementById('pos-product-grid');
  if (!grid) return;

  const query = document.getElementById('pos-search-input')?.value.toLowerCase().trim() || '';
  let products = dbStore.getProducts();

  if (selectedCategory !== 'All') {
    products = products.filter(p => p.category === selectedCategory);
  }

  if (query) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.includes(query))
    );
  }

  if (products.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 font-semibold">No inventory products found</div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const isOut = p.stockQty <= 0;

    return `
      <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-2xl flex flex-col justify-between transition group relative">
        <div class="space-y-2">
          <div class="flex items-start justify-between">
            <span class="text-[10px] bg-slate-950 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-800">${p.sku}</span>
            <span class="text-[10px] ${isOut ? 'text-rose-400 font-extrabold' : 'text-slate-400 font-bold'}">${isOut ? 'Out of Stock' : `Qty: ${p.stockQty}`}</span>
          </div>
          <div>
            <h5 class="font-bold text-white text-xs line-clamp-1 group-hover:text-emerald-400 transition">${p.name}</h5>
            <span class="text-[10px] text-slate-400">${p.unit || '1 Unit'}</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
          <span class="font-black text-emerald-400 text-sm">₹${p.sellingPrice}</span>
          <button onclick="addToPosCart('${p.id}')" ${isOut ? 'disabled' : ''} class="btn ${isOut ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'btn-emerald'} px-3 py-1.5 text-xs font-bold">
            + Add
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function addToPosCart(productId) {
  const products = dbStore.getProducts();
  const prod = products.find(p => p.id === productId || p.sku === productId);
  if (!prod) return;

  const existing = activeCart.find(item => item.id === prod.id);
  if (existing) {
    if (existing.qty < prod.stockQty) {
      existing.qty += 1;
    } else {
      alert(`Cannot add more than available stock (${prod.stockQty})`);
    }
  } else {
    activeCart.push({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      price: prod.sellingPrice,
      qty: 1,
      stockQty: prod.stockQty
    });
  }

  renderPosCart();
}

export function updateCartQty(productId, delta) {
  const item = activeCart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    activeCart = activeCart.filter(i => i.id !== productId);
  } else if (item.qty > item.stockQty) {
    item.qty = item.stockQty;
    alert(`Maximum available stock reached (${item.stockQty})`);
  }

  renderPosCart();
}

export function removeFromCart(productId) {
  activeCart = activeCart.filter(i => i.id !== productId);
  renderPosCart();
}

export function clearCart() {
  activeCart = [];
  renderPosCart();
}

function renderPosCart() {
  const container = document.getElementById('pos-cart-items-list');
  if (!container) return;

  if (activeCart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-500 space-y-2">
        <i class="fa-solid fa-basket-shopping text-3xl opacity-40"></i>
        <p class="text-xs font-semibold">POS Cart is empty. Select products to begin billing.</p>
      </div>
    `;
  } else {
    container.innerHTML = activeCart.map(item => `
      <div class="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <div class="flex-1 pr-2">
          <h6 class="font-bold text-white line-clamp-1">${item.name}</h6>
          <span class="text-[10px] text-slate-400 font-mono">₹${item.price} x ${item.qty} = <b class="text-emerald-400">₹${item.price * item.qty}</b></span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="updateCartQty('${item.id}', -1)" class="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold text-xs">-</button>
          <span class="font-extrabold text-white px-1.5">${item.qty}</span>
          <button onclick="updateCartQty('${item.id}', 1)" class="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center justify-center font-bold text-xs">+</button>
          <button onclick="removeFromCart('${item.id}')" class="text-slate-500 hover:text-rose-400 ml-1 text-xs"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `).join('');
  }

  // Calculate Cart Subtotal, Discount, Tax & Grand Total
  const subtotal = activeCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  const discountInput = document.getElementById('pos-discount-input');
  const discPercent = discountInput ? Number(discountInput.value) || 0 : 0;
  const discountAmount = Math.round((subtotal * discPercent) / 100);

  const settings = dbStore.getSettings();
  const gstRate = settings.gstPercentage || 5;
  const taxAmount = applyGstTax ? Math.round(((subtotal - discountAmount) * gstRate) / 100) : 0;

  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const elSubtotal = document.getElementById('pos-subtotal-val');
  if (elSubtotal) elSubtotal.innerText = `₹${subtotal}`;

  const elDisc = document.getElementById('pos-discount-val');
  if (elDisc) elDisc.innerText = `-₹${discountAmount}`;

  const elTax = document.getElementById('pos-tax-val');
  if (elTax) elTax.innerText = `+₹${taxAmount}`;

  const elGrand = document.getElementById('pos-grandtotal-val');
  if (elGrand) elGrand.innerText = `₹${grandTotal}`;
}

export function handleDiscountChange() {
  renderPosCart();
}

export function toggleGstTax() {
  applyGstTax = !applyGstTax;
  renderPosCart();
}

export function processCheckoutSale() {
  if (activeCart.length === 0) {
    alert('Cart is empty! Add at least one item to generate sale receipt.');
    return;
  }

  const custName = document.getElementById('pos-cust-name')?.value.trim() || 'Walk-in Customer';
  const custPhone = document.getElementById('pos-cust-phone')?.value.trim() || '9999999999';
  const payMode = document.getElementById('pos-payment-mode')?.value || 'Cash';

  const subtotal = activeCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountInput = document.getElementById('pos-discount-input');
  const discPercent = discountInput ? Number(discountInput.value) || 0 : 0;
  const discountAmount = Math.round((subtotal * discPercent) / 100);

  const settings = dbStore.getSettings();
  const gstRate = settings.gstPercentage || 5;
  const taxAmount = applyGstTax ? Math.round(((subtotal - discountAmount) * gstRate) / 100) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Verify if entered mobile number exists in Firestore 'customers' collection
  const customers = dbStore.getCustomers();
  const existingCust = customers.find(c => c && c.phone === custPhone);
  let customerId = '';

  if (existingCust) {
    // Linked to existing customer document ID
    customerId = existingCust.id;
  } else if (custPhone && custPhone !== '9999999999' && custPhone !== 'N/A' && custPhone !== 'Walk-in Customer') {
    // Treat as new customer & create profile entry in real-time
    const newCustId = `cust_${custPhone.replace(/\D/g, '') || Date.now()}`;
    const newCustomer = {
      id: newCustId,
      name: custName !== 'Walk-in Customer' ? custName : `Customer (${custPhone.slice(-4)})`,
      phone: custPhone,
      email: `${custPhone}@supermart.in`,
      totalPurchases: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    dbStore.addCustomer(newCustomer);
    customerId = newCustId;
  }

  const newSale = {
    id: `sale_${Date.now()}`,
    invoiceNumber: invoiceNo,
    customerId: customerId,
    customerDocId: customerId,
    customerName: custName,
    customerPhone: custPhone,
    items: JSON.stringify(activeCart),
    subtotal,
    discount: discountAmount,
    gstTax: taxAmount,
    grandTotal,
    paymentMode: payMode,
    cashierId: 'EMP-101',
    cashierName: 'Admin Manager',
    timestamp: new Date().toISOString(),
    status: 'Completed'
  };

  dbStore.addSale(newSale);

  // Open Receipt Print Modal
  openPrintReceiptModal(newSale);

  // Clear Cart
  activeCart = [];
  renderPosView();
}

export function openPrintReceiptModal(sale) {
  const modal = document.getElementById('pos-receipt-modal');
  if (!modal) return;

  const settings = dbStore.getSettings();
  let items = [];
  try { items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []); } catch (e) {}

  const invNo = sale.invoiceNumber || sale.invoiceNo || sale.invoiceId || sale.id || 'INV-001';
  const custName = (sale.customerName && sale.customerName !== 'undefined') ? sale.customerName : (sale.name || 'Walk-in Customer');
  let custPhone = (sale.customerPhone && sale.customerPhone !== 'undefined') ? sale.customerPhone : (sale.phone || '');
  if (!custPhone || custPhone === custName || custPhone === 'Walk-in Customer') {
    custPhone = '';
  }
  const custDisplay = custPhone ? `${custName} (${custPhone})` : custName;
  const payMode = sale.paymentMode || sale.paymentMethod || 'Cash';
  const subtotal = sale.subtotal ?? sale.amount ?? 0;
  const discount = sale.discount ?? 0;
  const gstTax = sale.gstTax ?? 0;
  const grandTotal = sale.grandTotal ?? sale.subtotal ?? sale.amount ?? sale.totalAmount ?? sale.total ?? 0;

  let dateFormatted = new Date().toLocaleString();
  if (sale.timestamp) {
    try {
      const d = new Date(sale.timestamp);
      if (!isNaN(d.getTime())) dateFormatted = d.toLocaleString();
    } catch (e) {}
  }

  document.getElementById('receipt-shop-name').innerText = settings.shopName || 'SuperMart Retail';
  document.getElementById('receipt-shop-address').innerText = settings.address || '';
  document.getElementById('receipt-shop-gstin').innerText = `GSTIN: ${settings.gstin || '24AAAAA0000A1Z5'}`;
  document.getElementById('receipt-inv-no').innerText = invNo;
  document.getElementById('receipt-date').innerText = dateFormatted;
  document.getElementById('receipt-cust').innerText = custDisplay;
  document.getElementById('receipt-paymode').innerText = payMode;

  const itemsContainer = document.getElementById('receipt-items-body');
  if (itemsContainer) {
    itemsContainer.innerHTML = items.map(i => `
      <div class="flex justify-between text-xs py-1 border-b border-dashed border-slate-300 text-slate-800">
        <div class="flex-1">
          <div class="font-bold">${i.name || 'Item'}</div>
          <div class="text-[10px] text-slate-500">₹${i.price || 0} x ${i.qty || 1}</div>
        </div>
        <div class="font-bold text-right">₹${(i.price || 0) * (i.qty || 1)}</div>
      </div>
    `).join('');
  }

  document.getElementById('receipt-subtotal').innerText = `₹${subtotal}`;
  document.getElementById('receipt-discount').innerText = `-₹${discount}`;
  document.getElementById('receipt-tax').innerText = `+₹${gstTax}`;
  document.getElementById('receipt-grandtotal').innerText = `₹${grandTotal}`;
  document.getElementById('receipt-footer-msg').innerText = settings.receiptFooter || 'Thank you for shopping!';

  modal.classList.remove('hidden');
}

export function closeReceiptModal() {
  document.getElementById('pos-receipt-modal')?.classList.add('hidden');
}

export function printCurrentReceipt() {
  window.print();
}
