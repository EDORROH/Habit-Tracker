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
        await addXP(-5); // Lose 5 XP
        await uncompleteHabit(habitId);
      } else {
        btn.classList.add('active');
        btn.style.background = '#4caf50';
        btn.style.color = 'white';
        await addXP(10); // Gain 10 XP
        await completeHabit(habitId);
      }
      // Re-render badges after state changes
      await renderBadges();
      // Always fetch latest state and re-render TowerView
      if (window.State && window.State.get) {
        const state = await window.State.get();
        const history = state.history || {};
        const { renderTowerView } = await import('./components/towerView.js');
        renderTowerView(history);
      }
      // Re-render badges after state changes
      await renderBadges();
      // Always fetch latest state and re-render TowerView
      if (window.State && window.State.get) {
        const state = await window.State.get();
        const history = state.history || {};
        const { renderTowerView } = await import('./components/towerView.js');
        renderTowerView(history);
      }
    });
  });
}

// app.js
// === Authentication Logic ===
// Attach login/register event listeners
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
});
// Debug: Print localStorage auth values before any state.js calls
// Auto-login UI patch: If token and userId are present, show logged-in section and Logout button
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  let userId = localStorage.getItem('authUserId');
  // If token exists but userId is missing, decode userId from JWT
  if (token && !userId) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
      localStorage.setItem('authUserId', userId);
    } catch (e) {
      console.error('[Startup] Failed to decode JWT for userId:', e);
    }
  }
  // If authenticated, show logged-in UI and Logout button
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
  }
  // Always render main UI (TowerView, habits, badges)
  if (typeof mainInit === 'function') {
    mainInit();
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
  // Always read latest values from localStorage
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
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      authUser = username;
      // Decode JWT to get userId
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
      // Load XP from backend after login
      await loadXP();
      // Re-run main app initialization to render habits, tower, badges
      if (typeof mainInit === 'function') {
        await mainInit();
      }
      // Force UI switch: hide form, show logged-in section
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
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showAuthStatus('Registration successful! You can now log in.', false);
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




// XP tracking variables (use backend state)
// Main app initialization: render habits, tower, badges, and XP
async function mainInit() {
  // Ensure habitPickerModule is loaded
  if (!window.habitPickerModule) {
    window.habitPickerModule = await import('./components/habitPicker.js');
  }
  // Render habit picker with default categories if not logged in
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
  // Set up habit listeners
  if (typeof setupHabitListeners === 'function') {
    setupHabitListeners();
  }
  // Render TowerView
  if (window.State && window.State.get) {
    const state = await window.State.get();
    const history = state.history || {};
    const { renderTowerView } = await import('./components/towerView.js');
    renderTowerView(history);
  }
  // Render badges
  if (typeof renderBadges === 'function') {
    await renderBadges();
  }
  // Load XP
  if (typeof loadXP === 'function') {
    await loadXP();
  }
}
let dailyXP = 0;
let totalXP = 0;

// Load XP from backend state
async function loadXP() {
  if (window.State && window.State.get) {
    const state = await window.State.get();
    dailyXP = state.xp && state.xp.dailyXP ? state.xp.dailyXP : 0;
    totalXP = state.xp && state.xp.totalXP ? state.xp.totalXP : 0;
    updateXPDisplay();
  }
}

// Save XP to backend state
async function saveXP() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    if (!state.xp) state.xp = {};
    state.xp.dailyXP = dailyXP;
    state.xp.totalXP = totalXP;
    await window.State.set(state);
  }
}

// Update XP display
function updateXPDisplay() {
  const dailyXPElement = document.getElementById('xp');
  const totalXPElement = document.getElementById('total-xp');
  if (dailyXPElement) dailyXPElement.textContent = dailyXP;
  if (totalXPElement) totalXPElement.textContent = totalXP;
}

// Add XP (positive or negative)
async function addXP(points) {
  dailyXP += points;
  totalXP += points;
  if (dailyXP < 0) dailyXP = 0;
  if (totalXP < 0) totalXP = 0;
  await saveXP();
  updateXPDisplay();
  showNotification(points > 0 ? `+${points} XP earned!` : `${points} XP lost!`);
}

// Show notification
function showNotification(message) {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  // Remove inline styles, use CSS class instead
  notification.classList.add('notification-success');
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(-10px)';
  notification.style.transition = 'all 0.3s ease';
  
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    }); // Closing parenthesis added here
  
  // Remove after 3 seconds
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


// Check if it's a new day and reset daily XP (backend)
async function checkNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    if (state.lastXPReset !== today) {
      // Reset daily XP
      dailyXP = 0;
      state.lastXPReset = today;
      if (state.xp) {
        state.xp.dailyXP = 0;
      }
      await window.State.set(state);
      updateXPDisplay();
      // Reset completed habits for the new day
      completedHabits.clear();
      await saveCompletedHabits();
      // Reset daily streak (not total streak)
      await resetDailyStreak();
      // Reset habit button visual states
      resetHabitButtonStates();
      // Update badges to reflect the reset
      await renderBadges();
      // Show notification about daily reset
      showNotification('🔄 New day! All habits reset. Start fresh!');
    }
  }
}

// Reset all habit buttons to inactive state
function resetHabitButtonStates() {
  const habitButtons = document.querySelectorAll('.habit-btn');
  habitButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = '';
    btn.style.color = '';
  });
}


// Badge system
let completedHabits = new Set();

// Load completed habits from backend state
async function loadCompletedHabits() {
  if (window.State && window.State.get) {
    const state = await window.State.get();
    if (state.completedHabits) {
      completedHabits = new Set(state.completedHabits);
    }
  }
}

// Save completed habits to backend state
async function saveCompletedHabits() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    state.completedHabits = Array.from(completedHabits);
    await window.State.set(state);
  }
}

// Get current streak (simplified - you can enhance this)
// Get current streak from backend state
async function getCurrentStreak() {
  if (window.State && window.State.get) {
    const state = await window.State.get();
    return state.streaks && state.streaks.currentStreak ? state.streaks.currentStreak : 0;
  }
  return 0;
}

// Check if habits were completed today
function hasCompletedHabitsToday() {
  return completedHabits.size > 0;
}

// Update streak - only increment if habits were completed today
// Update streak in backend state
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
// Reset streak for new day
// Reset streak in backend state
async function resetDailyStreak() {
  if (window.State && window.State.get && window.State.set) {
    const state = await window.State.get();
    if (!state.streaks) state.streaks = {};
    state.streaks.currentStreak = 0;
    delete state.streaks.lastStreakUpdate;
    await window.State.set(state);
  }
}
// When a habit is completed, update backend state
async function completeHabit(habitId) {
  try {
    if (window.State && window.State.get && window.State.set) {
      const state = await window.State.get();
      const today = new Date().toISOString().slice(0, 10);
      if (!state.history) state.history = {};
      if (!state.history[today]) state.history[today] = {};
      state.history[today][habitId] = true;
      // Update completedHabits set and backend
      if (!state.completedHabits) state.completedHabits = [];
      if (!state.completedHabits.includes(habitId)) state.completedHabits.push(habitId);
      completedHabits.add(habitId);
      const result = await window.State.set(state);
      await updateStreak();
      // Fetch latest state after saving
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
      // Remove from completedHabits set and backend
      if (state.completedHabits) {
        state.completedHabits = state.completedHabits.filter(id => id !== habitId);
      }
      completedHabits.delete(habitId);
      try {
        const result = await window.State.set(state);
      } catch (err) {
        console.error('[uncompleteHabit] Error saving state:', err);
        showNotification('❌ Error saving habit state!');
        return;
      }
      // Fetch latest state after saving
      const newState = await window.State.get();
      await renderBadges();
      const history = newState.history || {};
      const { renderTowerView } = await import('./components/towerView.js');
      renderTowerView(history);
    }
  }
}
// Render badges section
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
  let unlockedBadges = {};
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
// ...existing code...
            // Check if a badge should be unlocked
              async function isBadgeUnlocked(badgeId, isDaily) {
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
              // Badge logic
              switch (badgeId) {
                case 'first-habit':
                  if (completedCount >= 1) {
                    unlockedBadges[badgeId] = true;
                    await saveCompletedHabits();
                    return true;
                  }
                  return unlockedBadges[badgeId] || false;
                case 'three-habits':
                  if (completedCount >= 3) {
                    unlockedBadges[badgeId] = true;
                    await saveCompletedHabits();
                    return true;
                  }
                  return unlockedBadges[badgeId] || false;
                case 'all-habits':
                  if (completedCount >= 9) {
                    unlockedBadges[badgeId] = true;
                    await saveCompletedHabits();
                    return true;
                  }
                  return unlockedBadges[badgeId] || false;
                case 'streak-3':
                  if (currentStreak >= 3) {
                    unlockedBadges[badgeId] = true;
                    await saveCompletedHabits();
                    return true;
                  }
                  return unlockedBadges[badgeId] || false;
                case 'streak-7':
                  if (currentStreak >= 7) {
                    unlockedBadges[badgeId] = true;
                    await saveCompletedHabits();
                    return true;
                  }
                  return unlockedBadges[badgeId] || false;
                default:


                  return false;
              }
            }}// ...existing code...