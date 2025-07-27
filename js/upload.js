
document.getElementById('fileInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const text = event.target.result;
    const rows = text.split('\n').slice(1); // Skip header

    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    rows.forEach(row => {
      const cols = row.split(',');
      if (cols.length < 4) return;

      const date = cols[0];
      const description = cols[1];
      const amount = parseFloat(cols[2]);
      const type = cols[3].toLowerCase();

      if (type === 'debit') {
        expenses.push({
          amount,
          category: 'Bank',
          date: new Date(date).toISOString().split('T')[0],
          description
        });
      }
    });

    localStorage.setItem('expenses', JSON.stringify(expenses));
    document.getElementById('message').textContent = "Bank statement uploaded successfully!";
  };

  reader.readAsText(file);
});
