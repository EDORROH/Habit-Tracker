/*
UTILITY: XP (scoring)

Goal
- Compute daily XP from what was completed today and current streaks.

What belongs here
- A function like XP.computeDaily(state, dateKey) that returns a number.

Rules
- Pure logic only. No DOM, no localStorage writes.
*/

const XP_PER_HABIT = 10;

/**
 * Returns XP earned today based on number of habits completed.
 * @param {number} doneCount - Number of habits completed today
 * @returns {number} XP
 */
export function todayXp(doneCount) {
  if (!doneCount || doneCount < 0) return 0;
  return doneCount * XP_PER_HABIT;
}

/**
 * Returns total XP earned across history
 * @param {Array} history - Array of day objects with {doneCount}
 * @returns {number}
 */
export function totalXp(history) {
  if (!Array.isArray(history)) return 0;
  return history.reduce((xp, day) => {
    return xp + todayXp(day.doneCount);
  }, 0);
}


/**
 * Updates daily XP by adding points and ensures daily reset has occurred
 * @param {number} points - Points to add (can be negative)
 * @returns {object} Updated state with new daily XP
 */
function updateDailyXp(points) {
  // Check and reset daily XP if needed (this will transfer previous day's XP to total)
  return window.State.checkAndResetDailyXp().then(state => {
    state.dailyXp = Math.max(0, (state.dailyXp || 0) + points);
    return window.State.set(state).then(() => state);
  });
}

/**
 * Gets current daily XP, ensuring daily reset has occurred
 * @returns {number} Daily XP as a number
 */
function getDailyXp() {
  return window.State.checkAndResetDailyXp().then(result => result.dailyXp || 0);
}

/**
 * Gets total/lifetime XP
 * @returns {number} Total XP earned
 */
function getTotalXp() {
  return window.State.get().then(state => state.xp || 0);
}

/*
To add bonuses (e.g. streaks, achievements), 
pass an extra bonuses array/object and sum it in totalXp/history logic.
You can refactor the internals to add bonuses without changing the function signatures.
*/

function getHistory() {
  // For now, return empty array - this should be connected to actual state management
  return [];
}

// Export functions for ES6 modules
export { getHistory, updateDailyXp, getDailyXp, getTotalXp };
