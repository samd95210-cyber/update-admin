/* ==========================================================================
   SUPERMART RETAIL - LEAVE MANAGEMENT ENGINE (REALTIME)
   ========================================================================== */

import { db, showToast } from './firebase-config.js';

let leaveListenerUnsub = null;

// Listen to leave applications for user
export function listenToUserLeaves(userPhone, onUpdate) {
  if (!userPhone) return;

  if (leaveListenerUnsub) {
    leaveListenerUnsub();
    leaveListenerUnsub = null;
  }

  if (db) {
    leaveListenerUnsub = db.collection('leaves')
      .where('phone', '==', userPhone)
      .onSnapshot((snapshot) => {
        const leaves = [];
        snapshot.forEach(doc => leaves.push({ id: doc.id, ...doc.data() }));
        leaves.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        if (onUpdate) onUpdate(leaves);
      }, (err) => {
        console.warn("Leave listener fallback:", err);
      });
  } else {
    const local = localStorage.getItem(`leaves_${userPhone}`);
    const list = local ? JSON.parse(local) : [];
    if (onUpdate) onUpdate(list);
  }
}

// Submit Leave Application
export async function submitLeaveRequest(user, leaveData, onSuccess) {
  if (!user || !user.phone) return showToast('Invalid user session!', 'rose');

  const record = {
    phone: user.phone,
    empId: user.empId,
    name: user.name,
    role: user.role,
    type: leaveData.type,
    fromDate: leaveData.fromDate,
    days: Number(leaveData.days),
    reason: leaveData.reason,
    status: 'Pending', // 'Pending', 'Approved', 'Rejected'
    createdAt: new Date().toISOString()
  };

  try {
    if (db) {
      await db.collection('leaves').add(record);
    } else {
      const localKey = `leaves_${user.phone}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      existing.unshift(record);
      localStorage.setItem(localKey, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn("Leave submission fallback:", err);
  }

  showToast('Leave application submitted for Manager approval!', 'emerald');
  if (onSuccess) onSuccess(record);
}
