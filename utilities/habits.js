XP
/**
 * Get all completed habits for today
 * @returns {Object} - Object with habitId as keys and true as values for completed habits
 */
function getTodaysCompletedHabits() {
  return window.State.get().then(state => {
    const today = window.State.todayKey();
    return state.history[today] || {};
  });
}

/**
 * Get habit history for streak calculations
 * @param {string} habitId - The ID of the habit
 * @returns {Object} - History object with dates as keys and completion status as values
 */
function getHabitHistory(habitId) {
  return window.State.get().then(state => {
    const habitHistory = {};
    Object.keys(state.history).forEach(date => {
      if (state.history[date][habitId] !== undefined) {
        habitHistory[date] = state.history[date][habitId];
      }
    });
    return habitHistory;
  });
}

// Export functions for use in other modules
window.Habits = {
  toggleHabitCompletion,
  isHabitCompletedToday,
  getTodaysCompletedHabits,
  getHabitHistory
};