/*
COMPONENT: Badges  — renders into #badges

Goal
- Show badges the user has earned (first 7‑day streak, all‑green day, etc.).

What to build
- A simple list/grid of badge tiles.
- Logic to decide if a badge is earned can live in a small helper or here.

Steps
1) const el = document.getElementById('badges')
2) Check State (streaks/history) and decide which badges are earned.
3) Render earned vs locked visuals.

Avoid
- Writing to localStorage directly—if you need to save earned badges, go through State helpers.
*/

function calculateBadgeEligibility() {
  const statePromise = window.State.get();
  return statePromise.then(state => {
    const history = state.history || {};
    // Check if Streaks is available
    if (!window.Streaks) {
      console.error('❌ window.Streaks is not available!');
      return {
        currentStreak: 0,
        longestStreak: 0,
        hasAllGreenDay: false,
        totalActiveDays: 0
      };
    }
    // Calculate overall streaks by looking at days with any completed habits
    const dailyCompletionHistory = {};
    Object.keys(history).forEach(date => {
      const dayHabits = history[date];
      const hasAnyCompletedHabits = Object.values(dayHabits).some(completed => completed === true);
      dailyCompletionHistory[date] = hasAnyCompletedHabits;
    });
    const currentStreak = window.Streaks.calculateCurrentStreak(dailyCompletionHistory);
    const longestStreak = window.Streaks.bestStreak(dailyCompletionHistory);
    // Check for "all-green day" - a day where user completed multiple habits
    const hasAllGreenDay = Object.keys(history).some(date => {
      const dayHabits = history[date];
      const completedCount = Object.values(dayHabits).filter(completed => completed === true).length;
      return completedCount >= 3; // Consider 3+ habits as "all green"
    });
    // Calculate total active days
    const totalActiveDays = Object.keys(dailyCompletionHistory).filter(date =>
      dailyCompletionHistory[date] === true
    ).length;
    return {
      currentStreak,
      longestStreak,
      hasAllGreenDay,
      totalActiveDays
    };
  });

  // Check if Streaks is available
  if (!window.Streaks) {
    console.error('❌ window.Streaks is not available!');
    return {
      currentStreak: 0,
      longestStreak: 0,
      hasAllGreenDay: false,
      totalActiveDays: 0
    };
  }

  // Calculate overall streaks by looking at days with any completed habits
  const dailyCompletionHistory = {};
  Object.keys(history).forEach(date => {
    const dayHabits = history[date];
    const hasAnyCompletedHabits = Object.values(dayHabits).some(completed => completed === true);
    dailyCompletionHistory[date] = hasAnyCompletedHabits;
  });

  const currentStreak = window.Streaks.calculateCurrentStreak(dailyCompletionHistory);
  const longestStreak = window.Streaks.bestStreak(dailyCompletionHistory);

  // Check for "all-green day" - a day where user completed multiple habits
  const hasAllGreenDay = Object.keys(history).some(date => {
    const dayHabits = history[date];
    const completedCount = Object.values(dayHabits).filter(completed => completed === true).length;
    return completedCount >= 3; // Consider 3+ habits as "all green"
  });

  // Calculate total active days
  const totalActiveDays = Object.keys(dailyCompletionHistory).filter(date =>
    dailyCompletionHistory[date] === true
  ).length;

  return {
    currentStreak,
    longestStreak,
    hasAllGreenDay,
    totalActiveDays
  };
}

// Badge definitions with icons + tooltips
function getBadgesState() {
  return calculateBadgeEligibility().then(stats => [
    {
      name: 'First Steps',
      earned: stats.totalActiveDays >= 1,
      iconUnlocked: '👟',
      iconLocked: '❌',
      tooltip: "You've started your journey! First day completed."
    },
    {
      name: '7-Day Streak',
      earned: stats.longestStreak >= 7,
      iconUnlocked: '🔥',
      iconLocked: '❌',
      tooltip: "Amazing! You've maintained a 7-day streak!"
    },
    {
      name: 'All-Green Day',
      earned: stats.hasAllGreenDay,
      iconUnlocked: '✅',
      iconLocked: '❌',
      tooltip: "Fantastic! You completed 3+ habits in a single day!"
    },
    {
      name: 'Consistency King',
      earned: stats.totalActiveDays >= 14,
      iconUnlocked: '👑',
      iconLocked: '❌',
      tooltip: "You're building real consistency! 14+ active days!"
    },
    {
      name: 'Streak Master',
      earned: stats.longestStreak >= 21,
      iconUnlocked: '🏆',
      iconLocked: '❌',
      tooltip: "Incredible! You've achieved a 21-day streak!"
    }
  ]);
}

function renderBadges() {
  const el = document.getElementById('badges');
  if (!el) {
    console.error('❌ badges element not found!');
    return;
  }
  getBadgesState().then(badgesState => {
    el.innerHTML = `
      <h2 style="margin-bottom:0.5rem;">Badges</h2>
      <div class="badges-grid" role="list">
        ${badgesState.map(badge => `
          <div
            class="badge-card${badge.earned ? '' : ' locked'}"
            role="listitem"
            aria-label="${badge.name} badge ${badge.earned ? 'unlocked' : 'locked'}"
            title="${badge.tooltip}"
          >
            <span class="badge-icon" aria-hidden="true">
              ${badge.earned ? badge.iconUnlocked : badge.iconLocked}
            </span>
            <span class="badge-label">${badge.name}</span>
            <span class="badge-status">${badge.earned ? 'Unlocked' : 'Locked'}</span>
          </div>
        `).join('')}
      </div>
    `;
  });


}

// Make renderBadges available globally so app.js can call it
window.renderBadges = renderBadges;

// Only render after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderBadges();
  });
} else {
  renderBadges();
}