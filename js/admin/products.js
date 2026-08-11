// ============================================================================
// PRODUCTS & INVENTORY MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

let editingProductId = null;

export function renderProductsView() {
  const products = dbStore.getProducts();

  // Metrics
  const total = products.length;
  const lowStock = products.filter(p => p.stockQty > 0 && p.stockQty <= (p.minStockAlert || 5)).length;
  const outStock = products.filter(p => p.stockQty <= 0).length;

  const totalEl = document.getElementById('prod-stat-total');
  if (totalEl) totalEl.innerText = total;

  const lowEl = document.getElementById('prod-stat-low');
  if (lowEl) lowEl.innerText = lowStock;

  const outEl = document.getElementById('prod-stat-out');
  if (outEl) outEl.innerText = outStock;

  // Populate category filter dropdown
  const catFilter = document.getElementById('prod-category-filter');
  if (catFilter) {
    const categories = dbStore.getCategories();
    catFilter.innerHTML = `<option value="All">All Categories</option>` + 
      categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  filterProductsList();
}

export function filterProductsList() {
  const query = document.getElementById('prod-search-input')?.value.toLowerCase().trim() || '';
  const catVal = document.getElementById('prod-category-filter')?.value || 'All';
  const stockVal = document.getElementById('prod-stock-filter')?.value || 'All';

  let products = dbStore.getProducts();

  if (query) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) || 
      (p.barcode && p.barcode.includes(query))
    );
  }

  if (catVal !== 'All') {
    products = products.filter(p => p.category === catVal);
  }

  if (stockVal === 'Low') {
    products = products.filter(p => p.stockQty > 0 && p.stockQty <= (p.minStockAlert || 5));
  } else if (stockVal === 'Out') {
    products = products.filter(p => p.stockQty <= 0);
  }

  renderProductsGrid(products);
}

function renderProductsGrid(products) {
  const grid = document.getElementById('products-grid-container');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 font-semibold">No products found matching criteria</div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const isOut = p.stockQty <= 0;
    const isLow = p.stockQty > 0 && p.stockQty <= (p.minStockAlert || 5);

    const stockBadge = isOut ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                       isLow ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

    return `
      <div class="glass-card p-3.5 rounded-2xl flex flex-col justify-between space-y-3 relative border-slate-800 hover:border-indigo-500/50 transition group">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] bg-slate-900 font-mono font-bold text-indigo-400 px-2 py-0.5 rounded border border-slate-800">${p.sku}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${stockBadge}">${isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock')}</span>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              ${p.imageUrl ? `<img src="${p.imageUrl}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-box-open text-slate-600 text-lg"></i>`}
            </div>
            <div>
              <h5 class="font-bold text-white text-xs line-clamp-1 group-hover:text-indigo-300 transition">${p.name}</h5>
              <span class="text-[10px] text-slate-400 font-medium">${p.category}</span>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-400">Buying Price:</span>
            <span class="font-bold text-slate-300">₹${p.buyingPrice || 0}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Selling Price:</span>
            <span class="font-black text-emerald-400">₹${p.sellingPrice}</span>
          </div>
          <div class="flex justify-between border-t border-slate-800/80 pt-1">
            <span class="text-slate-400">Current Stock:</span>
            <span class="font-black ${isOut ? 'text-rose-400' : (isLow ? 'text-amber-400' : 'text-white')}">${p.stockQty} ${p.unit || 'pcs'}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="event.stopPropagation(); openEditProductModal('${p.id}')" class="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="event.stopPropagation(); confirmDeleteProduct('${p.id}')" class="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 p-1.5 rounded-xl text-xs font-bold transition" title="Delete Product">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function updateProductImagePreview(url) {
  const preview = document.getElementById('prod-image-preview');
  if (!preview) return;
  if (url && url.trim()) {
    preview.innerHTML = `<img src="${url.trim()}" class="w-full h-full object-cover">`;
  } else {
    preview.innerHTML = `<i class="fa-solid fa-image text-slate-600 text-xl"></i>`;
  }
}

export function handleProductPhotoFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    const imgInput = document.getElementById('prod-input-image');
    if (imgInput) imgInput.value = dataUrl;
    updateProductImagePreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

export function openAddProductModal() {
  editingProductId = null;
  const modal = document.getElementById('prod-modal');
  if (!modal) return;

  document.getElementById('prod-modal-title').innerText = 'Add New Inventory Product';
  document.getElementById('prod-form').reset();
  const imgInput = document.getElementById('prod-input-image');
  if (imgInput) imgInput.value = '';
  updateProductImagePreview('');

  // Populate category select options
  const catSelect = document.getElementById('prod-input-cat');
  if (catSelect) {
    const categories = dbStore.getCategories();
    catSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  modal.classList.remove('hidden');
}

export function openEditProductModal(id) {
  editingProductId = id;
  const products = dbStore.getProducts();
  const p = products.find(prod => prod.id === id || prod.sku === id);
  if (!p) return;

  const modal = document.getElementById('prod-modal');
  if (!modal) return;

  document.getElementById('prod-modal-title').innerText = 'Edit Inventory Product';
  document.getElementById('prod-input-sku').value = p.sku;
  document.getElementById('prod-input-barcode').value = p.barcode || '';
  document.getElementById('prod-input-name').value = p.name;
  
  const catSelect = document.getElementById('prod-input-cat');
  if (catSelect) {
    const categories = dbStore.getCategories();
    catSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    catSelect.value = p.category || (categories[0] ? categories[0].name : 'Groceries & Staples');
  }

  document.getElementById('prod-input-buy-price').value = p.buyingPrice || 0;
  document.getElementById('prod-input-sell-price').value = p.sellingPrice;
  document.getElementById('prod-input-stock').value = p.stockQty;
  document.getElementById('prod-input-min-alert').value = p.minStockAlert || 5;
  document.getElementById('prod-input-unit').value = p.unit || '1 Unit';

  const imgInput = document.getElementById('prod-input-image');
  if (imgInput) imgInput.value = p.imageUrl || '';
  updateProductImagePreview(p.imageUrl || '');

  modal.classList.remove('hidden');
}

export function closeProductModal() {
  document.getElementById('prod-modal')?.classList.add('hidden');
}

export function handleProductFormSubmit(e) {
  e.preventDefault();

  const sku = document.getElementById('prod-input-sku').value.trim();
  const barcode = document.getElementById('prod-input-barcode').value.trim();
  const name = document.getElementById('prod-input-name').value.trim();
  const category = document.getElementById('prod-input-cat').value || 'Groceries & Staples';
  const buyingPrice = Number(document.getElementById('prod-input-buy-price').value) || 0;
  const sellingPrice = Number(document.getElementById('prod-input-sell-price').value) || 0;
  const stockQty = Number(document.getElementById('prod-input-stock').value) || 0;
  const minStockAlert = Number(document.getElementById('prod-input-min-alert').value) || 5;
  const unit = document.getElementById('prod-input-unit').value.trim() || '1 Unit';
  const imageUrl = document.getElementById('prod-input-image')?.value.trim() || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300';

  if (editingProductId) {
    dbStore.updateProduct(editingProductId, {
      sku, barcode, name, category, buyingPrice, sellingPrice, stockQty, minStockAlert, unit, imageUrl
    });
  } else {
    dbStore.addProduct({
      id: `prod_${Date.now()}`,
      sku,
      barcode: barcode || `8901030${Math.floor(10000 + Math.random() * 90000)}`,
      name,
      category,
      buyingPrice,
      sellingPrice,
      stockQty,
      minStockAlert,
      unit,
      imageUrl
    });
  }

  closeProductModal();
  renderProductsView();
}

export function confirmDeleteProduct(id) {
  if (window.showConfirmModal) {
    window.showConfirmModal(
      'Delete Inventory Product',
      'Are you sure you want to delete this product from inventory?',
      () => {
        dbStore.deleteProduct(id);
        renderProductsView();
      }
    );
  } else {
    dbStore.deleteProduct(id);
    renderProductsView();
  }
}
