/* ==========================================================================
   SUPERMART RETAIL - ATTENDANCE & PUNCH ENGINE (REALTIME)
   ========================================================================== */

import { db, getTodayDateKey, showToast } from './firebase-config.js';

let todayListenerUnsub = null;
let timerInterval = null;
let currentAttendanceDoc = null;

// Listen to today's attendance document in Firestore
export function listenToTodayAttendance(userPhone, onUpdate) {
  if (!userPhone) return;

  const todayKey = getTodayDateKey();
  const docId = `${userPhone}_${todayKey}`;

  if (todayListenerUnsub) {
    todayListenerUnsub();
    todayListenerUnsub = null;
  }

  if (db) {
    todayListenerUnsub = db.collection('attendance').doc(docId).onSnapshot((doc) => {
      if (doc.exists) {
        currentAttendanceDoc = doc.data();
      } else {
        currentAttendanceDoc = null;
      }
      if (onUpdate) onUpdate(currentAttendanceDoc);
    }, (err) => {
      console.warn("Realtime attendance listener warning:", err);
    });
  } else {
    // Local state fallback
    const localSaved = localStorage.getItem(`att_${docId}`);
    currentAttendanceDoc = localSaved ? JSON.parse(localSaved) : null;
    if (onUpdate) onUpdate(currentAttendanceDoc);
  }
}

// Action 1: Check In
export async function actionCheckIn(user, onSuccess) {
  if (!user || !user.phone) return showToast('User session expired. Please log in again.', 'rose');

  const todayKey = getTodayDateKey();
  const docId = `${user.phone}_${todayKey}`;
  const now = new Date();
  const checkInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const record = {
    docId,
    phone: user.phone,
    empId: user.empId,
    name: user.name,
    role: user.role,
    date: todayKey,
    status: 'working', // 'working', 'on_break', 'completed'
    checkIn: checkInTime,
    checkInTimestamp: now.getTime(),
    breakTotalMinutes: 0,
    checkOut: null,
    totalHoursFormatted: '00h 00m',
    lastUpdated: new Date().toISOString()
  };

  currentAttendanceDoc = record;
  localStorage.setItem(`att_${docId}`, JSON.stringify(record));

  try {
    if (db) {
      await db.collection('attendance').doc(docId).set(record, { merge: true });
    }
  } catch (err) {
    console.warn("CheckIn cloud sync error:", err);
  }

  showToast(`Checked in successfully at ${checkInTime}!`, 'emerald');
  if (onSuccess) onSuccess(record);
}

// Action 2: Toggle Break
export async function actionToggleBreak(user, onSuccess) {
  if (!currentAttendanceDoc || !user) return showToast('No active check-in record found!', 'amber');

  const todayKey = getTodayDateKey();
  const docId = `${user.phone}_${todayKey}`;
  const now = new Date();

  if (currentAttendanceDoc.status === 'working') {
    // Start Break
    currentAttendanceDoc.status = 'on_break';
    currentAttendanceDoc.breakStartTime = now.getTime();
    showToast('Break started. Enjoy your break!', 'amber');
  } else if (currentAttendanceDoc.status === 'on_break') {
    // End Break
    currentAttendanceDoc.status = 'working';
    if (currentAttendanceDoc.breakStartTime) {
      const diffMins = Math.round((now.getTime() - currentAttendanceDoc.breakStartTime) / 60000);
      currentAttendanceDoc.breakTotalMinutes = (currentAttendanceDoc.breakTotalMinutes || 0) + diffMins;
      delete currentAttendanceDoc.breakStartTime;
    }
    showToast('Welcome back! Resumed shift work.', 'emerald');
  }

  currentAttendanceDoc.lastUpdated = new Date().toISOString();
  localStorage.setItem(`att_${docId}`, JSON.stringify(currentAttendanceDoc));

  try {
    if (db) {
      await db.collection('attendance').doc(docId).set(currentAttendanceDoc, { merge: true });
    }
  } catch (err) {
    console.warn("Break toggle sync error:", err);
  }

  if (onSuccess) onSuccess(currentAttendanceDoc);
}

// Action 3: Check Out
export async function actionCheckOut(user, onSuccess) {
  if (!currentAttendanceDoc || !user) return showToast('No active check-in record to check out!', 'amber');

  const todayKey = getTodayDateKey();
  const docId = `${user.phone}_${todayKey}`;
  const now = new Date();
  const checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Calculate total duration
  let durationMs = now.getTime() - (currentAttendanceDoc.checkInTimestamp || now.getTime());
  const breakMs = (currentAttendanceDoc.breakTotalMinutes || 0) * 60000;
  if (durationMs > breakMs) durationMs -= breakMs;

  const totalHrs = Math.floor(durationMs / 3600000);
  const totalMins = Math.floor((durationMs % 3600000) / 60000);
  const formattedHours = `${String(totalHrs).padStart(2, '0')}h ${String(totalMins).padStart(2, '0')}m`;

  currentAttendanceDoc.status = 'completed';
  currentAttendanceDoc.checkOut = checkOutTime;
  currentAttendanceDoc.checkOutTimestamp = now.getTime();
  currentAttendanceDoc.totalHoursFormatted = formattedHours;
  currentAttendanceDoc.lastUpdated = new Date().toISOString();

  localStorage.setItem(`att_${docId}`, JSON.stringify(currentAttendanceDoc));

  try {
    if (db) {
      await db.collection('attendance').doc(docId).set(currentAttendanceDoc, { merge: true });
    }
  } catch (err) {
    console.warn("CheckOut cloud sync error:", err);
  }

  showToast(`Shift checked out! Worked: ${formattedHours}`, 'emerald');
  if (onSuccess) onSuccess(currentAttendanceDoc);
}

// Stopwatch controller
export function updateStopwatchTimer(attDoc) {
  const displayEl = document.getElementById('work-stopwatch');
  if (!displayEl) return;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (!attDoc || attDoc.status === 'completed' || !attDoc.checkInTimestamp) {
    if (attDoc && attDoc.status === 'completed') {
      displayEl.textContent = attDoc.totalHoursFormatted;
    } else {
      displayEl.textContent = '00h 00m 00s';
    }
    return;
  }

  const runTimer = () => {
    const now = Date.now();
    let elapsedMs = now - attDoc.checkInTimestamp;
    const breakMs = (attDoc.breakTotalMinutes || 0) * 60000;
    if (elapsedMs > breakMs) elapsedMs -= breakMs;

    const hrs = String(Math.floor(elapsedMs / 3600000)).padStart(2, '0');
    const mins = String(Math.floor((elapsedMs % 3600000) / 60000)).padStart(2, '0');
    const secs = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0');

    displayEl.textContent = `${hrs}h ${mins}m ${secs}s`;
  };

  runTimer();
  timerInterval = setInterval(runTimer, 1000);
}
