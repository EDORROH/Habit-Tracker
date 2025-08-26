/*
COMPONENT: Tower View  — renders into #towerView

Goal
- Visual "stack" showing recent completions (e.g., blocks for the last 7 days).

What to build
- Small colored blocks/rows based on State.history.
- Use category colors or simple colors to make the stack fun.

Steps
1) const el = document.getElementById('towerView')
2) Read State.history (dates → which habits done).
3) Draw blocks for each day/habit done.
4) Re-render when today’s data changes.

Avoid
- Fetching or saving data here; just read from State and render.
*/

// Get last 7 UTC date keys (YYYY-MM-DD)
function getLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - i
    ));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Map each date to boolean (filled if any habit done)
function mapDaysToCompletion(history) {
  const last7 = getLast7Days();
  return last7.map(date => {
    if (history[date]) {
      return Object.values(history[date]).some(Boolean);
    } else {
      return false; // No history for this day, so not completed
    }
  });
}

// Render colored squares for each day (now using CSS Grid)
export function renderTowerView(history) {
  const completions = mapDaysToCompletion(history);
  const el = document.getElementById('towerView');
  console.log('[TowerView] Rendering with history:', history);
  console.log('[TowerView] Completions for last 7 days:', completions);
  if (!el) {
    console.warn('[TowerView] #towerView element not found in DOM');
    return;
  }
  el.innerHTML = `
    <div class="tower-grid">
      ${completions.map(done => 
        `<div class="tower-day ${done ? 'completed' : 'not-completed'}"></div>`
      ).join('')}
    </div>
    <div class="legend">
      <span class="legend-item">
        <span class="legend-swatch completed"></span>
        Done
      </span>
      <span class="legend-item">
        <span class="legend-swatch not-completed"></span>
        Not Done
      </span>
    </div>
  `;
}

