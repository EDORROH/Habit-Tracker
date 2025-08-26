function showEmptyState() {

  function showEmptyState() {
  const el = document.getElementById('checklist');
  if (!el) return;
  function showEmptyState() {
  // ...function code...
}

window.showEmptyState = showEmptyState;

  
  const el = document.getElementById('checklist');
  el.innerHTML = `
    <div class="empty-state" role="alert" aria-live="polite">
      <p id="emptyStateMsg">No habits selected yet. Let’s add some!</p>
      <button id="goToHabitPicker" class="btn" aria-label="Pick habits and go to habit picker" aria-describedby="emptyStateMsg">Pick Habits</button>
    </div>
  `;

  // Scroll to habit picker on button click
  document.getElementById('goToHabitPicker').onclick = () => {
    const picker = document.getElementById('habitPicker');
    if (picker) {
      picker.scrollIntoView({ behavior: 'smooth' });
    }
    // If using a router, you could do: router.navigate('/habit-picker');
  };
}

