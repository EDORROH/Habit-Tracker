// Attach click handlers to habit buttons
function setupHabitListeners() {
  const habitButtons = document.querySelectorAll('.habit-btn');
  habitButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const habitId = btn.dataset.habitId;
      const isActive = btn.classList.contains('active');
      if (isActive) {
        btn.classList.remove('active');
        btn.style.background = '';
        btn.style.color = '';
        await addXP(-5);
        await uncompleteHabit(habitId);
      } else {
        btn.classList.add('active');
        btn.style.background = '#4caf50';
        btn.style.color = 'white';
        await addXP(10);
        await completeHabit(habitId);
      }
      await renderBadges();
      if (window.State && window.State.get) {
        const state = await window.State.get();
        const history = state.history || {};
        const { renderTowerView } = await import('./components/towerView.js');
        renderTowerView(history);
      }
    });
  });
}

// Function to render habits without backend calls
async function renderHabitsOnly() {
  if (!window.habitPickerModule) {
    window.habitPickerModule = await import('./components/habitPicker.js');
  }
  const defaultCategories = [
    {
      id: "wellness",
      icon: "💪",
      name: "Wellness",
      habits: [
        { id: "h1", name: "Drink water" },
        { id: "h2", name: "Stretch" },
        { id: "h3", name: "Take a walk" }
      ]
    },
    {
      id: "focus",
      icon: "🧠",
      name: "Focus",
      habits: [
        { id: "h4", name: "Plan your day" },
        { id: "h5", name: "Review goals" },
        { id: "h6", name: "Clear distractions" }
      ]
    },
    {
      id: "learning",
      icon: "📚",
      name: "Learning",
      habits: [
        { id: "h7", name: "Find a mentor" },
        { id: "h8", name: "Practice for 15 minutes" },
        { id: "h9", name: "Read 1 chapter" }
      ]
    }
  ];
  if (window.habitPickerModule && window.habitPickerModule.renderHabits) {
    window.habitPickerModule.renderHabits(defaultCategories);
  }
  if (typeof setupHabitListeners === 'function') {
    setupHabitListeners();
  }
}

// === Authentication Logic ===
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const form = document.getElementById('auth-form');
  
  if (loginBtn && form) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = document.getElementById('auth-username').value;
      const password = document.getElementById('auth-password').value;
      await login(username, password);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('auth-username').value;
      const password = document.getElementById('auth-password').value;
      await login(username, password);
    });
  }
  
  if (registerBtn) {
    registerBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = document.getElementById('auth-username').value;
      const password = document.getElementById('auth-password').value;
      await register(username, password);
    });
  }

  // Auto-login UI patch
  const token = localStorage.getItem('authToken');
  let userId = localStorage.getItem('authUserId');
  
  if (token && !userId) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
      localStorage.setItem('authUserId', userId);
    } catch (e) {
      console.error('[Startup] Failed to decode JWT for userId:', e);
    }
  }
  
  if (token && userId) {
    const form = document.getElementById('auth-form');
    const loggedIn = document.getElementById('auth-logged-in');
    const userSpan = document.getElementById('auth-user');
    const logoutBtn = document.getElementById('auth-logout');
    if (form && loggedIn) {
      form.style.display = 'none';
      loggedIn.style.display = 'flex';
      if (userSpan) userSpan.textContent = localStorage.getItem('authUser') || '';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }
    updateAuthUI();
    
    // Only call mainInit if user is already logged in
    if (typeof mainInit === 'function') {
      mainInit();
    }
  } else {
    // If not logged in, just render the habits without backend data
    renderHabitsOnly();
  }
});

const API_BASE = 'http://localhost:4000';
let authToken = localStorage.getItem('authToken') || null;
let authUser = localStorage.getItem('authUser') || null;

function showAuthStatus(msg, error = false) {
  const status = document.getElementById('auth-status');
  if (status) {
    status.textContent = msg;
    status.style.color = error ? '#d32f2f' : '#388e3c';
  }
}

function updateAuthUI() {
  const form = document.getElementById('auth-form');
  const loggedIn = document.getElementById('auth-logged-in');
  const userSpan = document.getElementById('auth-user');
  const logoutBtn = document.getElementById('auth-logout');
  const currentToken = localStorage.getItem('authToken');
  const currentUser = localStorage.getItem('authUser');
  if (currentToken && currentUser) {
    form.style.display = 'none';
    loggedIn.style.display = 'flex';
    loggedIn.style.alignItems = 'center';
    userSpan.textContent = currentUser;
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.onclick = () => {
        logout();
        location.reload();
      };
    }
  } else {
    form.style.display = 'flex';
    loggedIn.style.display = 'none';
    userSpan.textContent = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

async function login(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      authUser = username;
      let authUserId = null;
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        authUserId = payload.userId;
      } catch (e) {
        console.error('[Login] Failed to decode JWT:', e);
      }
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('authUser', authUser);
      localStorage.setItem('authUserId', authUserId);
      showAuthStatus('Login successful!', false);
      updateAuthUI();
      
      await loadXP();
      await loadCompletedHabits();
      
      if (typeof mainInit === 'function') {
        await mainInit();
      }
      
      // Add a delay to ensure DOM is ready
      setTimeout(async () => {
        await restoreHabitButtonStates();
      }, 200);
      
      const form = document.getElementById('auth-form');
      const loggedIn = document.getElementById('auth-logged-in');
      if (form && loggedIn) {
        form.style.display = 'none';
        loggedIn.style.display = 'flex';
      }
    } else {
      showAuthStatus(data.error || 'Login failed', true);
    }
  } catch (err) {
    showAuthStatus('Login error', true);
  }
}

async function register(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      showAuthStatus('Registration successful! Logging you in...', false);
      await login(username, password);
    } else {
      showAuthStatus(data.error || 'Registration failed', true);
    }
  } catch (err) {
    showAuthStatus('Registration error', true);
  }
}

function logout() {
  authToken = null;
  authUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('authUserId');
  updateAuthUI();
}

async function restoreHabitButtonStates() {
  console.log('[DEBUG] Restoring habit button states...');
  if (window.State && window.State.get) {
    const state = await window.State.get();
    const today = new Date().toISOString().slice(0, 10);
    
    console.log('[DEBUG] State:', state);
    console.log('[DEBUG] Today:', today);
    console.log('[DEBUG] History for today:', state.history?.[today]);
    
    if (state.history && state.history[today]) {
      Object.entries(state.history[today]).forEach(([habitId, completed]) => {
        console.log(`[DEBUG] Checking habit ${habitId}: ${completed}`);
        if (completed) {
          const habitBtn = document.querySelector(`[data-habit-id="${habitId}"]`);
          console.log(`[DEBUG] Found button for ${habitId}:`, habitBtn);
          if (habitBtn) {
            habitBtn.classList.add('active');
            habitBtn.style.background = '#4caf50';
            habitBtn.style.color = 'white';
            console.log(`[DEBUG] Restored state for ${habitId}`);
          } else {
            console.log(`[DEBUG] Button not found for ${habitId}`);
          }
        }
      });
    } else {
      console.log('[DEBUG] No history found for today');
    }
  } else {
    console.log('[DEBUG] No state found');
  }
}

async function mainInit() {
  // First render the habits
  await renderHabitsOnly();
  
  // Then load backend data
  if (window.State && window.State.get) {
    const state = await window.State.get();
    const history = state.history || {};
    const { renderTowerView } = await import('./components/towerView.js');
    renderTowerView(history);
  }
  if (typeof renderBadges === 'function') {
    await renderBadges();
  }
  if (typeof loadXP === 'function') {
    await loadXP();
  }
}

let dailyXP = 0;
let totalXP = 0;

async function loadXP() {
  if (window.State && window.State.get) {
    const state = await window.State.get();
    dailyXP = state.xp && state.xp.dailyXP ? state.xp.dailyXP : 0;
    totalXP = state.xp && state.xp.totalXP ? state.xp.totalXP : 0;
    updateXPDisplay();
  }
}

async function saveXP() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    if (!state.xp) state.xp = {};
    state.xp.dailyXP = dailyXP;
    state.xp.totalXP = totalXP;
    await window.State.set(state);
  }
}

function updateXPDisplay() {
  const dailyXPElement = document.getElementById('xp');
  const totalXPElement = document.getElementById('total-xp');
  if (dailyXPElement) dailyXPElement.textContent = dailyXP;
  if (totalXPElement) totalXPElement.textContent = totalXP;
}

async function addXP(points) {
  dailyXP += points;
  totalXP += points;
  if (dailyXP < 0) dailyXP = 0;
  if (totalXP < 0) totalXP = 0;
  await saveXP();
  updateXPDisplay();
  showNotification(points > 0 ? `+${points} XP earned!` : `${points} XP lost!`);
}

function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.classList.add('notification-success');
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(-10px)';
  notification.style.transition = 'all 0.3s ease';
  
  document.body.appendChild(notification);
  
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  });
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

async function checkNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    if (state.lastXPReset !== today) {
      dailyXP = 0;
      state.lastXPReset = today;
      if (state.xp) {
        state.xp.dailyXP = 0;
      }
      await window.State.set(state);
      updateXPDisplay();
      completedHabits.clear();
      await saveCompletedHabits();
      await resetDailyStreak();
      resetHabitButtonStates();
      await renderBadges();
      showNotification('🔄 New day! All habits reset. Start fresh!');
    }
  }
}

function resetHabitButtonStates() {
  const habitButtons = document.querySelectorAll('.habit-btn');
  habitButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = '';
    btn.style.color = '';
  });
}

let completedHabits = new Set();

async function loadCompletedHabits() {
  if (window.State && window.State.get) {
    const state = await window.State.get();
    if (state.completedHabits) {
      completedHabits = new Set(state.completedHabits);
    }
  }
}

async function saveCompletedHabits() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    state.completedHabits = Array.from(completedHabits);
    await window.State.set(state);
  }
}

async function getCurrentStreak() {
  if (window.State && window.State.get) {
    const state = await window.State.get();
    return state.streaks && state.streaks.currentStreak ? state.streaks.currentStreak : 0;
  }
  return 0;
}

function hasCompletedHabitsToday() {
  return completedHabits.size > 0;
}

async function updateStreak() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    const today = new Date().toISOString().slice(0, 10);
    if (!state.streaks) state.streaks = {};
    if (state.streaks.lastStreakUpdate !== today) {
      const currentStreak = state.streaks.currentStreak || 0;
      const newStreak = currentStreak + 1;
      state.streaks.currentStreak = newStreak;
      state.streaks.lastStreakUpdate = today;
      await window.State.set(state);
      return newStreak;
    } else {
      return state.streaks.currentStreak || 0;
    }
  }
  return 0;
}

async function resetDailyStreak() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    if (!state.streaks) state.streaks = {};
    state.streaks.currentStreak = 0;
    delete state.streaks.lastStreakUpdate;
    await window.State.set(state);
  }
}

async function completeHabit(habitId) {
  try {
    if (window.State && window.State.get && window.State.set) {
      const state = await window.State.get();
      const today = new Date().toISOString().slice(0, 10);
      if (!state.history) state.history = {};
      if (!state.history[today]) state.history[today] = {};
      state.history[today][habitId] = true;
      if (!state.completedHabits) state.completedHabits = [];
      if (!state.completedHabits.includes(habitId)) state.completedHabits.push(habitId);
      completedHabits.add(habitId);
      await window.State.set(state);
      await updateStreak();
      const newState = await window.State.get();
      await renderBadges();
      const history = newState.history || {};
      const { renderTowerView } = await import('./components/towerView.js');
      renderTowerView(history);
    } else {
      console.error('[completeHabit] window.State is missing or incomplete:', window.State);
    }
  } catch (err) {
    console.error('[completeHabit] Unexpected error:', err);
    showNotification('❌ Error in completeHabit!');
  }
}

async function uncompleteHabit(habitId) {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    const today = new Date().toISOString().slice(0, 10);
    if (state.history && state.history[today]) {
      state.history[today][habitId] = false;
      if (state.completedHabits) {
        state.completedHabits = state.completedHabits.filter(id => id !== habitId);
      }
      completedHabits.delete(habitId);
      try {
        await window.State.set(state);
      } catch (err) {
        console.error('[uncompleteHabit] Error saving state:', err);
        showNotification('❌ Error saving habit state!');
        return;
      }
      const newState = await window.State.get();
      await renderBadges();
      const history = newState.history || {};
      const { renderTowerView } = await import('./components/towerView.js');
      renderTowerView(history);
    }
  }
}

async function isBadgeUnlocked(badgeId) {
  let completedCount = 0;
  let currentStreak = 0;
  if (window.State && window.State.get) {
    const state = await window.State.get();
    const today = new Date().toISOString().slice(0, 10);
    if (state.history && state.history[today]) {
      completedCount = Object.values(state.history[today]).filter(Boolean).length;
    }
    currentStreak = state.streaks && state.streaks.currentStreak ? state.streaks.currentStreak : 0;
  }
  switch (badgeId) {
    case 'first-habit':
      return completedCount >= 1;
    case 'three-habits':
      return completedCount >= 3;
    case 'all-habits':
      return completedCount >= 9;
    case 'streak-3':
      return currentStreak >= 3;
    case 'streak-7':
      return currentStreak >= 7;
    default:
      return false;
  }
}

async function renderBadges() {
  const badgesSection = document.getElementById('badges');
  if (!badgesSection) return;
  const badges = [
    { id: 'first-habit', name: 'First Step', icon: '🎯', description: 'Complete your first habit' },
    { id: 'three-habits', name: 'Triple Threat', icon: '🔥', description: 'Complete 3 habits' },
    { id: 'all-habits', name: 'Habit Master', icon: '👑', description: 'Complete all 9 habits' },
    { id: 'streak-3', name: 'Consistent', icon: '📈', description: '3-day streak' },
    { id: 'streak-7', name: 'Week Warrior', icon: '🏆', description: '7-day streak' }
  ];
  const unlocked = await Promise.all(badges.map(badge => isBadgeUnlocked(badge.id)));
  badgesSection.innerHTML = `
    <h2>🏆 Achievement Badges</h2>
    <div class="badges-grid">
      ${badges.map((badge, i) => {
        const isUnlocked = unlocked[i];
        return `
          <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-description">${badge.description}</div>
            <div class="badge-status">${isUnlocked ? '✅ Unlocked' : '🔒 Locked'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}