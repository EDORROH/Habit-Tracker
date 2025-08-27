
// components/habitPicker.js
export function renderHabits(categories) {
  const container = document.getElementById("habit-container");

  if (!container) {
    console.error('❌ habit-container element not found!');
    return;
  }

  // Clear previous content
  container.innerHTML = "";

  categories.forEach((category, index) => {
    
    // Category card
    const categoryDiv = document.createElement("div");
    categoryDiv.classList.add("category-card", category.id); // 🔑 hooks for CSS

    // Category title
    const title = document.createElement("h2");
    title.classList.add("category-title");
    title.textContent = `${category.icon} ${category.name}`;
    categoryDiv.appendChild(title);

    // Habit buttons
    const habitsDiv = document.createElement("div");
    habitsDiv.classList.add("habits");

    category.habits.forEach((habit, habitIndex) => {
      
      const habitBtn = document.createElement("button");
      habitBtn.textContent = habit.name;
      habitBtn.classList.add("habit-btn");
      habitBtn.dataset.habitId = habit.id;
      habitsDiv.appendChild(habitBtn);
    });

    categoryDiv.appendChild(habitsDiv);
    container.appendChild(categoryDiv);
  });
}
