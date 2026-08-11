// ============================================================================
// CATEGORIES MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderCategoriesView() {
  const categories = dbStore.getCategories();
  const products = dbStore.getProducts();

  const container = document.getElementById('categories-grid-container');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 font-semibold">No product categories created yet</div>`;
    return;
  }

  container.innerHTML = categories.map(c => {
    const prodCount = products.filter(p => p.category === c.name).length;

    return `
      <div class="glass-card p-4 rounded-2xl flex items-center justify-between border-slate-800 hover:border-indigo-500/50 transition">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl">
            <i class="fa-solid ${c.icon || 'fa-folder-open'}"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-white text-sm">${c.name}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1">${c.description || 'Category'}</p>
            <span class="text-[10px] font-bold text-emerald-400 font-mono mt-1 block">${prodCount} Products</span>
          </div>
        </div>
        <button onclick="event.stopPropagation(); confirmDeleteCategory('${c.id}')" class="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 p-2 rounded-xl text-xs font-bold transition" title="Delete Category">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  }).join('');
}

export function openAddCategoryModal() {
  const modal = document.getElementById('cat-modal');
  if (!modal) return;
  document.getElementById('cat-form').reset();
  modal.classList.remove('hidden');
}

export function closeCategoryModal() {
  document.getElementById('cat-modal')?.classList.add('hidden');
}

export function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('cat-input-name').value.trim();
  const description = document.getElementById('cat-input-desc').value.trim();
  const icon = document.getElementById('cat-input-icon').value || 'fa-box-open';

  dbStore.addCategory({
    id: `cat_${Date.now()}`,
    name,
    description,
    icon,
    productCount: 0
  });

  closeCategoryModal();
  renderCategoriesView();
}

export function confirmDeleteCategory(id) {
  if (window.showConfirmModal) {
    window.showConfirmModal(
      'Delete Category',
      'Are you sure you want to delete this category?',
      () => {
        dbStore.deleteCategory(id);
        renderCategoriesView();
      }
    );
  } else {
    dbStore.deleteCategory(id);
    renderCategoriesView();
  }
}
