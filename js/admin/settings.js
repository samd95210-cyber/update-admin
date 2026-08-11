// ============================================================================
// SETTINGS MODULE - SUPERMART SHOP MANAGEMENT ADMIN
// Shop Name & Logo, GST Tax Rate, Receipt Settings, Backup & Restore
// ============================================================================

import { dbStore } from '../data-store.js';

export function renderSettingsView() {
  const settings = dbStore.getSettings();

  const nameInput = document.getElementById('setting-shop-name');
  if (nameInput) nameInput.value = settings.shopName || 'SuperMart Retail';

  const addressInput = document.getElementById('setting-address');
  if (addressInput) addressInput.value = settings.address || '';

  const phoneInput = document.getElementById('setting-phone');
  if (phoneInput) phoneInput.value = settings.phone || '';

  const gstinInput = document.getElementById('setting-gstin');
  if (gstinInput) gstinInput.value = settings.gstin || '';

  const gstPctInput = document.getElementById('setting-gst-pct');
  if (gstPctInput) gstPctInput.value = settings.gstPercentage || 5;

  const footerInput = document.getElementById('setting-receipt-footer');
  if (footerInput) footerInput.value = settings.receiptFooter || '';
}

export function handleSaveSettingsSubmit(e) {
  e.preventDefault();

  const shopName = document.getElementById('setting-shop-name').value.trim();
  const address = document.getElementById('setting-address').value.trim();
  const phone = document.getElementById('setting-phone').value.trim();
  const gstin = document.getElementById('setting-gstin').value.trim();
  const gstPercentage = Number(document.getElementById('setting-gst-pct').value) || 5;
  const receiptFooter = document.getElementById('setting-receipt-footer').value.trim();

  const updated = {
    shopName,
    address,
    phone,
    gstin,
    gstPercentage,
    receiptFooter
  };

  dbStore.saveSettings(updated);

  // Update header shop title across UI
  const headerShopTitle = document.getElementById('header-shop-title');
  if (headerShopTitle) headerShopTitle.innerText = shopName;

  alert('Shop settings and GST tax rates saved successfully!');
}

export function resetAllShopData() {
  if (confirm('CRITICAL WARNING: This will reset all products, sales, attendance, employees, and expenses to initial factory defaults. Proceed?')) {
    dbStore.resetToDefaults();
  }
}
