
const form = document.getElementById('expenseForm');
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const newExpense = { amount, category, date };

  const saved = JSON.parse(localStorage.getItem('expenses')) || [];
  saved.push(newExpense);
  localStorage.setItem('expenses', JSON.stringify(saved));
  window.location.href = "index.html";
});
