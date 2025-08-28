
// app.js
console.log('🚀 App.js loading...');

// XP tracking variables
let dailyXP = 0;
let totalXP = 0;

// Authentication functions
function getAuthInfo() {
  return {
    token: localStorage.getItem('authToken'),
    userId: localStorage.getItem('authUserId'),
    username: localStorage.getItem('authUsername')
  };
}

function updateAuthUI() {
  const { token, username } = getAuthInfo();
  
  const authForm = document.getElementById('auth-form');
  const authLoggedIn = document.getElementById('auth-logged-in');
  const authUser = document.getElementById('auth-user');
  
  if (token && username) {
    // User is logged in
    if (authForm) authForm.style.display = 'none';
    if (authLoggedIn) authLoggedIn.style.display = 'block';
    if (authUser) authUser.textContent = username;
  } else {
    // User is not logged in  
    if (authForm) authForm.style.display = 'flex';
    if (authLoggedIn) authLoggedIn.style.display = 'none';
    if (authUser) authUser.textContent = '';
  }
}


function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUserId');
  localStorage.removeItem('authUsername');
  updateAuthUI();
  showNotification('👋 Logged out successfully!');
  window.location.reload();
}

async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('auth-username').value;
  const password = document.getElementById('auth-password').value;
  const authStatus = document.getElementById('auth-status');
  
  if (!username || !password) {
    authStatus.textContent = '⚠️ Please enter username and password';
    return;
  }
  
   try {
    const response = await fetch('https://habit-tracker-c3pt-gzaxiok9g-ellerys-projects-2249135f.vercel.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store auth info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUserId', data.userId);
      localStorage.setItem('authUsername', data.username);
      
      updateAuthUI();
      authStatus.style.color = '#4caf50';
      authStatus.textContent = `✅ Welcome back, ${data.username}!`;
      
    } else {
      authStatus.style.color = '#d32f2f';
      authStatus.textContent = `❌ Login failed: ${data.message}`;
    }
  } catch (error) {
    console.error('Login error:', error);
    authStatus.style.color = '#d32f2f';
    authStatus.textContent = '❌ Login failed. Please try again.';
  }
}

// Load XP from localStorage
function loadXP() {
  const savedDailyXP = localStorage.getItem('dailyXP');
  const savedTotalXP = localStorage.getItem('totalXP');
  
  if (savedDailyXP) dailyXP = parseInt(savedDailyXP);
  if (savedTotalXP) totalXP = parseInt(savedTotalXP);
  
  updateXPDisplay();
}

// Save XP to localStorage
function saveXP() {
  localStorage.setItem('dailyXP', dailyXP.toString());
  localStorage.setItem('totalXP', totalXP.toString());
}

// Update XP display
function updateXPDisplay() {
  const dailyXPElement = document.getElementById('xp');
  const totalXPElement = document.getElementById('total-xp');
  
  if (dailyXPElement) dailyXPElement.textContent = dailyXP;
  if (totalXPElement) totalXPElement.textContent = totalXP;
}

// Add XP (positive or negative)
function addXP(points) {
  dailyXP += points;
  totalXP += points;
  
  // Ensure XP doesn't go below 0
  if (dailyXP < 0) dailyXP = 0;
  if (totalXP < 0) totalXP = 0;
  
  saveXP();
  updateXPDisplay();
  
  // Show notification
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
  });
  
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

// Check if it's a new day and reset daily XP
function checkNewDay() {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem('lastXPReset');
  
  if (lastReset !== today) {
    // Reset daily XP
    dailyXP = 0;
    localStorage.setItem('lastXPReset', today);
    updateXPDisplay();
    
    // Reset completed habits for the new day
    completedHabits.clear();
    saveCompletedHabits();
    
    // Reset daily streak (not total streak)
    resetDailyStreak();
    
    // Reset habit button visual states
    resetHabitButtonStates();
    
    // Update badges to reflect the reset
    renderBadges();
    
    // Show notification about daily reset
    showNotification('🔄 New day! All habits reset. Start fresh!');
    
    console.log('🔄 New day detected - Daily XP, habits, and streaks reset');
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
  console.log('🔄 Reset habit button visual states');
}

// Badge system
let completedHabits = new Set();

// Load completed habits from localStorage
function loadCompletedHabits() {
  const saved = localStorage.getItem('completedHabits');
  if (saved) {
    completedHabits = new Set(JSON.parse(saved));
  }
}

// Save completed habits to localStorage
function saveCompletedHabits() {
  localStorage.setItem('completedHabits', JSON.stringify(Array.from(completedHabits)));
}

// Get current streak (simplified - you can enhance this)
function getCurrentStreak() {
  console.log('🔄 getCurrentStreak() called');
  const streak = localStorage.getItem('currentStreak') || 0;
  const result = parseInt(streak);
  console.log('📈 Current streak from localStorage:', streak, 'Parsed as:', result);
  return result;
}

// Check if habits were completed today
function hasCompletedHabitsToday() {
  return completedHabits.size > 0;
}

// Update streak - only increment if habits were completed today
function updateStreak() {
  console.log('🔄 updateStreak() called');
  const today = new Date().toDateString();
  const lastStreakUpdate = localStorage.getItem('lastStreakUpdate');
  
  console.log('📅 Today:', today, 'Last update:', lastStreakUpdate);
  
  // Only update streak once per day
  if (lastStreakUpdate !== today) {
    const currentStreak = getCurrentStreak();
    const newStreak = currentStreak + 1;
    localStorage.setItem('currentStreak', newStreak.toString());
    localStorage.setItem('lastStreakUpdate', today);
    console.log('📈 Streak updated to:', newStreak);
    return newStreak;
  } else {
    const currentStreak = getCurrentStreak();
    console.log('📈 Streak already updated today, current streak:', currentStreak);
    return currentStreak;
  }
}

// Reset streak for new day
function resetDailyStreak() {
  localStorage.setItem('currentStreak', '0');
  localStorage.removeItem('lastStreakUpdate'); // Allow streak to be updated again
  console.log('🔄 Daily streak reset to 0');
}

// Render badges section
function renderBadges() {
  const badgesSection = document.getElementById('badges');
  if (!badgesSection) return;
  
  const badges = [
    { id: 'first-habit', name: 'First Step', icon: '🎯', description: 'Complete your first habit' },
    { id: 'three-habits', name: 'Triple Threat', icon: '🔥', description: 'Complete 3 habits' },
    { id: 'all-habits', name: 'Habit Master', icon: '👑', description: 'Complete all 9 habits' },
    { id: 'streak-3', name: 'Consistent', icon: '📈', description: '3-day streak' },
    { id: 'streak-7', name: 'Week Warrior', icon: '🏆', description: '7-day streak' }
  ];
  
  badgesSection.innerHTML = `
    <h2>🏆 Achievement Badges</h2>
    <div class="badges-grid">
      ${badges.map(badge => {
        const isUnlocked = isBadgeUnlocked(badge.id);
        return `
          <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-label">${badge.name}</div>
            <div class="badge-description">${badge.description}</div>
            <div class="badge-status">${isUnlocked ? '✅ Unlocked' : '🔒 Locked'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Check if a badge should be unlocked
function isBadgeUnlocked(badgeId) {
  console.log('🏆 isBadgeUnlocked() called with badgeId:', badgeId);
  const currentStreak = getCurrentStreak();
  const completedCount = completedHabits.size;
  
  console.log(`🏆 Checking badge ${badgeId}:`, {
    currentStreak,
    completedCount,
    totalHabits: 9
  });
  
  let result = false;
  switch (badgeId) {
    case 'first-habit':
      result = completedCount >= 1;
      break;
    case 'three-habits':
      result = completedCount >= 3;
      break;
    case 'all-habits':
      result = completedCount >= 9;
      break;
    case 'streak-3':
      result = currentStreak >= 3;
      break;
    case 'streak-7':
      result = currentStreak >= 7;
      break;
    default:
      result = false;
      break;
  }
  
  console.log(`🏆 Badge ${badgeId} result:`, result);
  return result;
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log('🎯 DOM Content Loaded');
   // Initialize authentication
  updateAuthUI();
  
  // Set up login form
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', handleLogin);
    console.log('🔐 Login form listener added');
  }
  
  // Set up logout button
  const authLogout = document.getElementById('auth-logout');
  if (authLogout) {
    authLogout.addEventListener('click', logout);
    console.log('🔐 Logout button listener added');
  }
  
  try {
    // Import and render Tower View
    const { renderTowerView } = await import("./components/towerView.js");
    if (window.State && window.State.get) {
      const state = await window.State.get();
      renderTowerView(state.history || {});
    }
    // Initialize XP system
    loadXP();
    checkNewDay();
    
    // Initialize badge system
    loadCompletedHabits();
    
    // Import the habit picker module
    const habitPickerModule = await import("./components/habitPicker.js");
    console.log('📦 Habit picker module loaded:', habitPickerModule);
    
    // Load and render habits
    console.log('📋 Loading categories...');
    fetch("./data/categories.json")
      .then(res => {
        console.log('📋 Categories fetch response:', res.status);
        return res.json();
      })
      .then(categories => {
        console.log('📋 Categories loaded:', categories);
        habitPickerModule.renderHabits(categories);
        console.log('📋 renderHabits called');
        
        // Set up habit click listeners after rendering
        setTimeout(() => {
          setupHabitListeners();
          renderBadges(); // Render badges after habits are set up
        }, 100);
      })
      .catch(err => {
        console.error("❌ Error loading categories:", err);
        showNotification('⚠️ Failed to load habits. Using fallback data.');
        // Use fallback categories if fetch fails
        const fallbackCategories = [
          {
            id: "health",
            name: "Health",
            icon: "🧘‍♂️",
            habits: [
              { id: "h1", name: "Drink 1 glass of water" },
              { id: "h2", name: "Take a 5-minute walk" },
              { id: "h3", name: "Take deep breaths" }
            ]
          },
          {
            id: "productivity",
            name: "Productivity",
            icon: "⏱️",
            habits: [
              { id: "h4", name: "Turn off notifications" },
              { id: "h5", name: "Create a quiet workspace" },
              { id: "h6", name: "Set specific work hours" }
            ]
          },
          {
            id: "learning",
            name: "Learning",
            icon: "📚",
            habits: [
              { id: "h7", name: "Find a mentor" },
              { id: "h8", name: "Practice for 15 minutes" },
              { id: "h9", name: "Read 1 chapter" }
            ]
          }
        ];
        habitPickerModule.renderHabits(fallbackCategories);
        
        // Set up habit click listeners after rendering
        setTimeout(() => {
          setupHabitListeners();
          renderBadges(); // Render badges after habits are set up
        }, 100);
      });

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      console.log('🌓 Setting up theme toggle');
      themeToggle.addEventListener("click", () => {
        console.log('🌓 Theme toggle clicked');
        document.body.classList.toggle("dark");
        themeToggle.textContent = document.body.classList.contains("dark") ? "🌗" : "🌙";
      });
    }

    console.log('✅ App initialization complete');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
});

// Set up habit click listeners
function setupHabitListeners() {
  const habitButtons = document.querySelectorAll('.habit-btn');
  console.log('🎯 Setting up listeners for', habitButtons.length, 'habit buttons');
  
  habitButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const habitId = btn.dataset.habitId;
      const isActive = btn.classList.contains('active');
      console.log('🎯 Habit clicked:', habitId, 'Current state:', isActive ? 'active' : 'inactive');
      // Get today's date string
      const today = new Date().toISOString().slice(0, 10);
      // Get current state from backend
      let state = (window.State && window.State.get) ? await window.State.get() : {};
      let history = state.history || {};
      if (!history[today] || typeof history[today] !== 'object') history[today] = {};
      if (isActive) {
        // Deactivating habit - lose XP and remove from completed
        btn.classList.remove('active');
        btn.style.background = '';
        btn.style.color = '';
        addXP(-5); // Lose 5 XP
        completedHabits.delete(habitId);
        // Remove habit from today's history (set to false)
        history[today][habitId] = false;
        console.log('❌ Habit deactivated:', habitId);
      } else {
        // Activating habit - gain XP and add to completed
        btn.classList.add('active');
        btn.style.background = '#4caf50';
        btn.style.color = 'white';
        addXP(10); // Gain 10 XP
        completedHabits.add(habitId);
        // Mark habit as completed for today
        history[today][habitId] = true;
        console.log('✅ Habit activated:', habitId);
        // Update streak when completing a habit
        updateStreak();
      }
      // Save completed habits and update badges
      saveCompletedHabits();
      renderBadges();
      // Update State.history in backend
      if (window.State && window.State.set) {
        await window.State.set({ ...state, history });
      } else if (window.State) {
        window.State.history = history;
      }
      // Always re-render Tower View after habit state changes
      console.log('[HabitClick] About to import and call renderTowerView');
      import('./components/towerView.js').then(({ renderTowerView }) => {
        console.log('[HabitClick] towerView.js imported, calling renderTowerView');
        renderTowerView(history);
        console.log('[HabitClick] renderTowerView called');
      }).catch(err => {
        console.error('[HabitClick] Error importing towerView.js:', err);
      });
    });
  });
}

