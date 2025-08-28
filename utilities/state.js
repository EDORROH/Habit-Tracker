/*
UTILITY: State (single source of truth)

Goal
- Read and write the entire app state to localStorage safely.

What belongs here
- load/save functions
- small helpers like State.get(), State.set(), State.todayKey()
- (Students may add more helpers via tickets)
*/

(function () {
  const KEY = 'microStacker_v1';

  const defaults = {
    goalCategories: {},   // { [catId]: { stackProgress, activeHabits:[], unlockedHabits:[] } }
    selectedCategory: null,
    history: {},          // { 'YYYY-MM-DD': { [habitId]: true } }
    streaks: {},          // { [habitId]: number }
    xp: 0,                // Total/lifetime XP
    dailyXp: 0,           // XP earned today (resets daily)
    lastXpResetDate: null, // Date when XP was last reset (YYYY-MM-DD format)
    badges: {},           // { [badgeId]: true }
    timers: {},           // { [habitId]: { durationSec, remainingSec, running, lastStart } }
    reminders: []         // [{ id, scope:'global'|'habit', habitId?, type:'DAILY'|'WEEKLY', daysOfWeek?, times:[] }]
  };


  // Replace localStorage with MongoDB API
  const API_BASE = 'https://habit-tracker-c3pt-gzaxiok9g-ellerys-projects-2249135f.vercel.app/state';;


  function getAuth() {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('authUserId');
  return { token, userId };
  }

  async function load() {
  try {
    const { token, userId } = getAuth();
    if (!token || !userId) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/${userId}`, {  // Remove '/state'
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch state');
    const data = await res.json();
    return data ? data : { ...defaults };
  } catch (err) {
    console.error('State load error:', err);
    return { ...defaults };
  }
}


async function save(state) {
  try {
    const { token, userId } = getAuth();
    if (!token || !userId) throw new Error('Not authenticated');
    await fetch(`${API_BASE}/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(state)
    });
  } catch (err) {
    console.error('State save error:', err);
  }
}

  // get/set now return Promises
  function get() { return load(); }
  function set(next) { return save(next); }

  // Local YYYY-MM-DD (avoids timezone rollover surprises)
  function todayKey() {
    const now = new Date();
    const tz = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tz);
    return local.toISOString().slice(0, 10);
  }

  // Check if daily XP needs to be reset and reset it if necessary
async function checkAndResetDailyXp() {
  const state = await get(); // Add 'await' here
  const today = todayKey();

  if (state.lastXpResetDate !== today) {
    // New day detected - transfer daily XP to total XP, then reset daily XP
    const previousDailyXp = state.dailyXp || 0;

    // Add yesterday's daily XP to total XP (only if there was daily XP to transfer)
    if (previousDailyXp > 0) {
      state.xp = (state.xp || 0) + previousDailyXp;
    }

    // Reset daily XP for the new day
    state.dailyXp = 0;
    state.lastXpResetDate = today;
    await set(state); // Add 'await' here

    // Return info about the reset
    return {
      ...state,
      wasReset: true,
      previousDailyXp: previousDailyXp
    };
  }

  return { ...state, wasReset: false };
}
// Expose a tiny, safe API
window.State = { get, set, todayKey, checkAndResetDailyXp };
})();