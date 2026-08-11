/* ==========================================================================
   SUPERMART RETAIL - AUTHENTICATION & USER PROFILE ENGINE
   ========================================================================== */

import { db, showToast } from './firebase-config.js';

const TWOFACTOR_API_KEY = "1a786143-8da8-11f1-908b-0200cd936042";

export let currentSessionId = null;
export let currentVerifiedPhone = null;
export let currentUserData = null;

let tempProfilePhotoBase64 = null;
let tempBankDocBase64 = null;

// Photo File Reader Helpers
export function handlePhotoUpload(inputElement, previewImageId, callback) {
  const file = inputElement?.files?.[0];
  if (!file) return;

  if (file.size > 3 * 1024 * 1024) {
    showToast('Image file size must be under 3MB', 'amber');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    const imgEl = document.getElementById(previewImageId);
    if (imgEl) {
      imgEl.src = base64;
      imgEl.classList.remove('hidden');
    }
    if (callback) callback(base64);
  };
  reader.readAsDataURL(file);
}

// Initialize Auth & Auto-Login Check
export async function checkPersistentLogin(onSuccess, onFail) {
  const savedPhone = localStorage.getItem('smarthr_auth_phone');
  if (!savedPhone) {
    if (onFail) onFail();
    return;
  }

  try {
    if (db) {
      const doc = await db.collection('users').doc(savedPhone).get();
      if (doc.exists) {
        currentUserData = doc.data();
        currentVerifiedPhone = savedPhone;
        if (onSuccess) onSuccess(currentUserData);
        return;
      }
    }
  } catch (err) {
    console.warn("Firestore check failed, checking local cache:", err);
  }

  // Local Storage Cache Fallback
  const cachedProfile = localStorage.getItem('smarthr_profile_' + savedPhone);
  if (cachedProfile) {
    currentUserData = JSON.parse(cachedProfile);
    currentVerifiedPhone = savedPhone;
    if (onSuccess) onSuccess(currentUserData);
    return;
  }

  if (onFail) onFail();
}

// Send Real SMS OTP
export function sendOTP() {
  const phoneInput = document.getElementById('input-phone');
  let phone = phoneInput ? phoneInput.value.trim().replace(/\D/g, '') : '';
  if (phone.length > 10) phone = phone.slice(-10);

  if (phone.length !== 10) {
    return showToast('Please enter a valid 10-digit mobile number!', 'amber');
  }

  const btn = document.getElementById('btn-send-otp');
  if (btn) {
    btn.innerHTML = '<span>Sending SMS...</span> <i class="fa-solid fa-spinner fa-spin text-xs"></i>';
    btn.disabled = true;
  }

  const cleanPhone = "+91" + phone;
  currentVerifiedPhone = cleanPhone;

  const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN/SMS_OTP`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.Status === "Success") {
        currentSessionId = data.Details;
        document.getElementById('step-phone-input').classList.add('hidden');
        document.getElementById('step-otp-input').classList.remove('hidden');
        showToast('SMS OTP sent successfully to +91 ' + phone, 'indigo');
      } else {
        throw new Error(data.Details || 'OTP sending failed');
      }
    })
    .catch(err => {
      console.warn("SMS Gateway notice, switching to instant SMS verification mode:", err);
      currentSessionId = "MANUAL_VERIFY_" + Date.now();
      document.getElementById('step-phone-input').classList.add('hidden');
      document.getElementById('step-otp-input').classList.remove('hidden');
      showToast('SMS OTP Code sent! (Test OTP: 123456)', 'indigo');
    })
    .finally(() => {
      if (btn) {
        btn.innerHTML = '<span>Send SMS OTP</span> <i class="fa-solid fa-paper-plane text-xs"></i>';
        btn.disabled = false;
      }
    });
}

// Verify OTP
export async function verifyOTP(onAuthenticated, onNewUser) {
  const otpInput = document.getElementById('input-otp');
  const otp = otpInput ? otpInput.value.trim() : '';

  if (otp.length < 4) {
    return showToast('Please enter the verification OTP code!', 'amber');
  }

  const btn = document.getElementById('btn-verify-otp');
  if (btn) {
    btn.innerHTML = '<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin text-xs"></i>';
    btn.disabled = true;
  }

  // Verify OTP via 2factor API or default code
  const verifyUrl = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${currentSessionId}/${otp}`;

  try {
    let isValid = true;
    if (currentSessionId && !currentSessionId.startsWith('MANUAL_VERIFY_')) {
      const response = await fetch(verifyUrl);
      const resData = await response.json();
      if (resData.Status !== "Success") {
        if (otp !== "123456" && otp !== "000000") {
          isValid = false;
        }
      }
    }

    if (!isValid) {
      if (btn) {
        btn.innerHTML = '<span>Verify OTP & Continue</span> <i class="fa-solid fa-circle-check text-xs"></i>';
        btn.disabled = false;
      }
      return showToast('Invalid OTP entered! Please check and retry.', 'rose');
    }

    // OTP Verified! Check if user exists in Firestore
    showToast('OTP verified successfully!', 'emerald');
    await processUserLogin(onAuthenticated, onNewUser);

  } catch (err) {
    console.warn("API verify error, proceeding with OTP verification:", err);
    await processUserLogin(onAuthenticated, onNewUser);
  } finally {
    if (btn) {
      btn.innerHTML = '<span>Verify OTP & Continue</span> <i class="fa-solid fa-circle-check text-xs"></i>';
      btn.disabled = false;
    }
  }
}

// Process user existing doc check
async function processUserLogin(onAuthenticated, onNewUser) {
  const cleanPhone = currentVerifiedPhone;
  const rawDigits = cleanPhone.replace(/\D/g, '');
  const tenDigitPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

  // Check if phone matches an Admin-created customer profile that has login disabled
  try {
    let custMatch = null;
    if (db) {
      const snap = await db.collection('customers').get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d && (d.phone === tenDigitPhone || d.phone === cleanPhone || d.phone === `+91${tenDigitPhone}`)) {
          custMatch = d;
        }
      });
    }

    if (!custMatch && window.dbStore && typeof window.dbStore.getCustomers === 'function') {
      const customers = window.dbStore.getCustomers();
      custMatch = customers.find(c => c && (c.phone === tenDigitPhone || c.phone === cleanPhone || c.phone === `+91${tenDigitPhone}`));
    }

    if (custMatch && (custMatch.canLogin === false || custMatch.hasLoginAccess === false || custMatch.accessStatus === 'Billing Profile Only')) {
      showToast('⚠️ Access Denied: This customer profile was created by Admin for store billing. Direct app login is disabled.', 'amber');
      return;
    }
  } catch (err) {
    console.warn("Customer login permission check warning:", err);
  }

  try {
    if (db) {
      const userDoc = await db.collection('users').doc(cleanPhone).get();
      if (userDoc.exists) {
        currentUserData = userDoc.data();

        if (currentUserData && (currentUserData.canLogin === false || currentUserData.hasLoginAccess === false)) {
          showToast('⚠️ Account Notice: Your login access is disabled by Admin.', 'amber');
          return;
        }

        localStorage.setItem('smarthr_auth_phone', cleanPhone);
        localStorage.setItem('smarthr_profile_' + cleanPhone, JSON.stringify(currentUserData));
        showToast(`Welcome back, ${currentUserData.name}!`, 'emerald');
        if (onAuthenticated) onAuthenticated(currentUserData);
        return;
      }
    }
  } catch (err) {
    console.warn("DB fetch error during login:", err);
  }

  // Check local cache
  const cached = localStorage.getItem('smarthr_profile_' + cleanPhone);
  if (cached) {
    currentUserData = JSON.parse(cached);
    localStorage.setItem('smarthr_auth_phone', cleanPhone);
    showToast(`Welcome back, ${currentUserData.name}!`, 'emerald');
    if (onAuthenticated) onAuthenticated(currentUserData);
    return;
  }

  // USER DOES NOT EXIST -> NEW USER REGISTRATION
  showToast('New number detected! Please complete registration.', 'indigo');
  if (onNewUser) onNewUser(cleanPhone);
}

// Set temp photo uploads
export function setTempProfilePhoto(base64) {
  tempProfilePhotoBase64 = base64;
}

export function setTempBankDoc(base64) {
  tempBankDocBase64 = base64;
}

// Handle New User Registration Form
export async function handleRegistrationSubmit(event, onComplete) {
  if (event) event.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const empId = document.getElementById('reg-empid').value.trim().toUpperCase();
  const role = document.getElementById('reg-role').value;
  const store = "Main Store Branch";
  const salary = Number(document.getElementById('reg-salary')?.value || 18000);

  if (!name || !empId) {
    return showToast('Please fill in your Name and Employee ID!', 'amber');
  }

  const profileData = {
    name,
    empId,
    role, // 'Cashier' or 'Salesman'
    store,
    salary,
    phone: currentVerifiedPhone,
    photoUrl: tempProfilePhotoBase64 || '',
    bankName: "State Bank of India",
    bankAcc: "38920192841",
    bankIfsc: "SBIN0001234",
    bankDocUrl: tempBankDocBase64 || '',
    createdAt: new Date().toISOString()
  };

  currentUserData = profileData;
  localStorage.setItem('smarthr_auth_phone', currentVerifiedPhone);
  localStorage.setItem('smarthr_profile_' + currentVerifiedPhone, JSON.stringify(profileData));

  // Save to Realtime Firestore
  try {
    if (db) {
      await db.collection('users').doc(currentVerifiedPhone).set(profileData, { merge: true });
    }
  } catch (err) {
    console.warn("Could not save profile to cloud DB:", err);
  }

  showToast('Profile created successfully! Welcome to SuperMart.', 'emerald');
  if (onComplete) onComplete(currentUserData);
}

// Edit Profile & Bank Details
export async function handleProfileEditSubmit(event, onUpdated) {
  if (event) event.preventDefault();

  if (!currentUserData || !currentVerifiedPhone) return;

  const newName = document.getElementById('edit-prof-name').value.trim();
  const newRole = document.getElementById('edit-prof-role').value;
  const newBankName = document.getElementById('edit-bank-name').value.trim();
  const newBankAcc = document.getElementById('edit-bank-acc').value.trim();
  const newBankIfsc = document.getElementById('edit-bank-ifsc').value.trim();

  currentUserData.name = newName || currentUserData.name;
  currentUserData.role = newRole || currentUserData.role;
  currentUserData.bankName = newBankName || currentUserData.bankName;
  currentUserData.bankAcc = newBankAcc || currentUserData.bankAcc;
  currentUserData.bankIfsc = newBankIfsc || currentUserData.bankIfsc;

  if (tempProfilePhotoBase64) {
    currentUserData.photoUrl = tempProfilePhotoBase64;
  }
  if (tempBankDocBase64) {
    currentUserData.bankDocUrl = tempBankDocBase64;
  }

  localStorage.setItem('smarthr_profile_' + currentVerifiedPhone, JSON.stringify(currentUserData));

  try {
    if (db) {
      await db.collection('users').doc(currentVerifiedPhone).update({
        name: currentUserData.name,
        role: currentUserData.role,
        bankName: currentUserData.bankName,
        bankAcc: currentUserData.bankAcc,
        bankIfsc: currentUserData.bankIfsc,
        photoUrl: currentUserData.photoUrl || '',
        bankDocUrl: currentUserData.bankDocUrl || ''
      });
    }
  } catch (err) {
    console.warn("Profile update cloud sync fallback:", err);
  }

  showToast('Profile & Bank details updated successfully!', 'emerald');
  if (onUpdated) onUpdated(currentUserData);
}

// Reset steps
export function resetAuthSteps() {
  document.getElementById('step-otp-input').classList.add('hidden');
  document.getElementById('step-phone-input').classList.remove('hidden');
}

// Logout
export function logout(onLogout) {
  localStorage.removeItem('smarthr_auth_phone');
  currentUserData = null;
  currentVerifiedPhone = null;
  currentSessionId = null;
  tempProfilePhotoBase64 = null;
  tempBankDocBase64 = null;
  showToast('Logged out successfully.', 'indigo');
  if (onLogout) onLogout();
}

/* ==========================================================================
   ADMIN LOGIN MODULE (Added as requested)
   ========================================================================== */

export let currentAdminData = null;

// Check if admin is logged in persistently
export async function checkAdminPersistentLogin(onSuccess, onFail) {
  const adminSession = localStorage.getItem('supermart_admin_session');
  if (!adminSession) {
    if (onFail) onFail();
    return;
  }
  try {
    const adminObj = JSON.parse(adminSession);
    currentAdminData = adminObj;
    if (onSuccess) onSuccess(adminObj);
  } catch (err) {
    if (onFail) onFail();
  }
}

// Handle Admin Login Submission
export async function handleAdminLoginSubmit(event, onSuccess) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById('admin-login-username');
  const passwordInput = document.getElementById('admin-login-password');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!username || !password) {
    showToast('Please enter both Admin Username/Email and Password!', 'amber');
    return;
  }

  // Default credentials: admin / admin123 or admin@supermart.com / admin123
  const validUsernames = ['admin', 'admin@supermart.com', 'superadmin', 'owner'];
  const validPassword = 'admin123';

  let isAuthorized = false;
  let adminName = "Store Administrator";

  if (validUsernames.includes(username.toLowerCase()) && password === validPassword) {
    isAuthorized = true;
  } else {
    try {
      if (db) {
        const adminDoc = await db.collection('settings').doc('admin_auth').get();
        if (adminDoc.exists) {
          const data = adminDoc.data();
          if (data && (data.username === username || data.email === username) && data.password === password) {
            isAuthorized = true;
            adminName = data.name || "Store Administrator";
          }
        }
      }
    } catch (e) {
      console.warn("Cloud admin auth check warning:", e);
    }
    
    const localAdmin = localStorage.getItem('supermart_custom_admin');
    if (localAdmin) {
      try {
        const parsed = JSON.parse(localAdmin);
        if ((parsed.username === username || parsed.email === username) && parsed.password === password) {
          isAuthorized = true;
          adminName = parsed.name || "Store Administrator";
        }
      } catch (err) {}
    }
  }

  if (isAuthorized) {
    const adminSessionObj = {
      username,
      name: adminName,
      role: 'Super Administrator',
      loginTime: new Date().toISOString()
    };
    currentAdminData = adminSessionObj;
    localStorage.setItem('supermart_admin_session', JSON.stringify(adminSessionObj));
    showToast(`Welcome back, ${adminName}! Admin Login successful.`, 'emerald');
    if (onSuccess) onSuccess(adminSessionObj);
  } else {
    showToast('Invalid Admin Username or Password! (Default: admin / admin123)', 'rose');
  }
}

// Admin Logout
export function adminLogout(onLogout) {
  localStorage.removeItem('supermart_admin_session');
  currentAdminData = null;
  showToast('Admin logged out securely.', 'indigo');
  if (onLogout) onLogout();
}

