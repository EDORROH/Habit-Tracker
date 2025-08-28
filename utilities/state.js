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
  const defaults = {
    goalCategories: {},
    selectedCategory: null,
    history: {},
    streaks: {},
    xp: 0,
    dailyXp: 0,
    lastXpResetDate: null,
    badges: {},
    timers: {},
    reminders: []
    darkMode: false 
  };

  const API_BASE = 'https://habit-tracker-c3pt-gzaxiok9g-ellerys-projects-2249135f.vercel.app/state';

  function getAuth() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('authUserId');
    return { token, userId };
  }

  async function load() {
    try {
      const { token, userId } = getAuth();
      
      // If not logged in, return default state (guest mode)
      if (!token || !userId) {
        console.log('Guest mode - using default state');
        return { ...defaults };
      }
      
      const response = await fetch(`${API_BASE}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch state');
      }

      const state = await response.json();
      return state || { ...defaults };
    } catch (err) {
      console.error('State load error:', err);
      return { ...defaults };
    }
  }

  async function save(state) {
    try {
      const { token, userId } = getAuth();
      
      // If not logged in, don't save (guest mode)
      if (!token || !userId) {
        console.log('Guest mode - progress not saved');
        return;
      }
      
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

  function get() { return load(); }
  function set(next) { return save(next); }

  function todayKey() {
    const now = new Date();
    const tz = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tz);
    return local.toISOString().slice(0, 10);
  }

  async function checkAndResetDailyXp() {
    const state = await get();
    const today = todayKey();

    if (state.lastXpResetDate !== today) {
      const previousDailyXp = state.dailyXp || 0;
      if (previousDailyXp > 0) {
        state.xp = (state.xp || 0) + previousDailyXp;
      }
      state.dailyXp = 0;
      state.lastXpResetDate = today;
      await set(state);
      return { ...state, wasReset: true, previousDailyXp: previousDailyXp };
    }
    return { ...state, wasReset: false };
  }

  window.State = { get, set, todayKey, checkAndResetDailyXp };
})();