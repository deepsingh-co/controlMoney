
const switchToggle = document.getElementById('themeSwitch');
const body = document.body;
switchToggle.addEventListener('change', () => {
  body.classList.toggle('dark');
  localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
});
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
  switchToggle.checked = true;
}

const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
const todayDate = new Date();
let total = 0;
let todayTotal = 0;

expenses.forEach(exp => {
  total += exp.amount;

  const expDate = new Date(exp.date);
  if (
    expDate.getDate() === todayDate.getDate() &&
    expDate.getMonth() === todayDate.getMonth() &&
    expDate.getFullYear() === todayDate.getFullYear()
  ) {
    todayTotal += exp.amount;
  }
});

document.querySelector(".summary .card:nth-child(1) p").textContent = `₹${total}`;
document.querySelector(".summary .card:nth-child(2) p").textContent = `₹${todayTotal}`;

// Handle Recent Transactions
const list = document.querySelector(".recent ul");
const container = document.querySelector(".recent");
list.innerHTML = "";

const reversed = expenses.slice().reverse();
const firstThree = reversed.slice(0, 3);
const rest = reversed.slice(3);

firstThree.forEach(exp => {
  const li = document.createElement("li");
  const date = new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  li.innerHTML = `💰 ${exp.category} - ₹${exp.amount} <span>${date}</span>`;
  list.appendChild(li);
});

let showMoreBtn = document.querySelector(".show-more-btn");
if (!showMoreBtn && rest.length > 0) {
  showMoreBtn = document.createElement("button");
  showMoreBtn.textContent = "Show More";
  showMoreBtn.className = "show-more-btn";

  showMoreBtn.style.marginTop = "10px";
  showMoreBtn.style.padding = "8px 16px";
  showMoreBtn.style.backgroundColor = "#4b5563";
  showMoreBtn.style.color = "white";
  showMoreBtn.style.border = "none";
  showMoreBtn.style.borderRadius = "8px";
  showMoreBtn.style.cursor = "pointer";

  showMoreBtn.addEventListener("click", () => {
    rest.forEach(exp => {
      const li = document.createElement("li");
      const date = new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      li.innerHTML = `💰 ${exp.category} - ₹${exp.amount} <span>${date}</span>`;
      list.appendChild(li);
    });
    showMoreBtn.remove();
  });

  container.appendChild(showMoreBtn);
}

// Charts
const categoryTotals = {};
expenses.forEach(exp => {
  categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
});
const chartLabels = Object.keys(categoryTotals);
const chartData = Object.values(categoryTotals);
new Chart(document.getElementById('expenseChart').getContext('2d'), {
  type: 'pie',
  data: {
    labels: chartLabels,
    datasets: [{
      data: chartData,
      backgroundColor: ['#f87171', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa'],
      borderColor: '#fff',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  }
});
const monthlyTotals = { current: 0, previous: 0 };
const now = new Date();
const currMonth = now.getMonth(), prevMonth = currMonth === 0 ? 11 : currMonth - 1;
const currYear = now.getFullYear(), prevYear = currMonth === 0 ? currYear - 1 : currYear;
expenses.forEach(exp => {
  const d = new Date(exp.date);
  const m = d.getMonth(), y = d.getFullYear();
  if (m === currMonth && y === currYear) monthlyTotals.current += exp.amount;
  if (m === prevMonth && y === prevYear) monthlyTotals.previous += exp.amount;
});
new Chart(document.getElementById('monthlyChart').getContext('2d'), {
  type: 'bar',
  data: {
    labels: ["Last Month", "This Month"],
    datasets: [{
      data: [monthlyTotals.previous, monthlyTotals.current],
      backgroundColor: ['#60a5fa', '#f87171']
    }]
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  }
});
