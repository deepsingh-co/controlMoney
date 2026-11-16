# SmartExpense

A lightweight, fully client-side expense tracker built with plain HTML, CSS, and JavaScript. Log expenses manually, import them from a bank statement PDF, and visualise your spending on a dashboard — no backend, no accounts, no setup.

The repo includes a marketing landing page (`landing.html`) and the app itself, whose dashboard lives at `index.html`.

## Features

- **Landing page** — a responsive, glassmorphism marketing page with light/dark themes.
- **Dashboard overview** — total spent and today's spending at a glance.
- **Recent transactions** — latest three expenses, with a "Show More" button for the rest.
- **Expense by category** — interactive pie chart powered by Chart.js.
- **Monthly comparison** — bar chart comparing this month's spend with last month's.
- **Add expenses** — amount, category, and date, saved instantly.
- **Bank statement import** — upload a PDF statement and the app extracts debit transactions with PDF.js.
- **Dark mode** — theme toggle that remembers your preference.
- **Demo authentication** — simple signup/login flow stored locally.

## Tech Stack

| Layer | Tool |
| --- | --- |
| Markup | HTML5 |
| Styling | CSS3 (flexbox, responsive, dark theme) |
| Logic | Vanilla JavaScript (ES5/ES6) |
| Charts | [Chart.js](https://www.chartjs.org/) (CDN) |
| PDF parsing | [PDF.js](https://mozilla.github.io/pdf.js/) (CDN) |
| Storage | Browser `localStorage` |

No build step, package manager, or server-side code is required.

## Getting Started

### Option 1: Open directly

Clone the repository and open `landing.html` in your browser for the marketing page, or `index.html` for the dashboard.

```bash
git clone https://github.com/deepsingh-co/controlMoney.git
cd controlMoney
```

### Option 2: Run a local server (recommended)

A local server avoids any browser restrictions around local files.

```bash
# Python 3
python -m http.server 8000

# or with Node.js
npx serve .
```

Then visit <http://localhost:8000/landing.html> for the landing page or <http://localhost:8000/index.html> for the dashboard.

## Usage

1. **Start on the landing page** (`landing.html`) for an overview, then open the dashboard from the header.
2. **Sign up** on `signup.html`, then **log in** on `login.html` (optional — the dashboard works without logging in).
3. Add expenses from **Add Expense**: enter an amount, pick a category, choose a date, and submit.
4. Import a bank statement from **Upload Statement**: select a PDF and debit transactions are parsed automatically.
5. Return to the **Dashboard** to see totals, recent transactions, and charts.
6. Use the toggle in the header to switch between light and dark mode.

### Bank statement format

The PDF importer reads text from each page and matches debit lines in this shape:

```text
DD-MM-YYYY  <description>  <amount>(Dr)
```

Only lines ending in `(Dr)` with a two-decimal amount are captured, and they are stored under the **Bank** category. If your bank formats statements differently, adjust the regular expression in `upload.html` (`processText`).

## Project Structure

```text
controlMoney/
├── landing.html        # Marketing landing page (hero, features, import, FAQ)
├── index.html          # Dashboard: totals, recent transactions, charts
├── add-expense.html    # Form for adding an expense manually
├── upload.html         # PDF bank statement import (inline PDF.js logic)
├── login.html          # Demo login page
├── signup.html         # Demo signup page
├── css/
│   ├── style.css       # Shared app styles, responsive layout, dark theme
│   └── landing.css     # Landing page tokens, glassmorphism, landing layout
├── js/
│   ├── dashboard.js    # Totals, recent list, Chart.js charts, theme toggle
│   ├── add-expense.js  # Saves new expenses to localStorage
│   ├── upload.js       # CSV statement parser (not currently linked to a page)
│   └── landing.js      # Landing theme toggle and mobile navigation
└── design-system/
    └── smartexpense/   # Design tokens and page rules generated with UI/UX Pro Max
```

## Data Storage

Everything lives in your browser's `localStorage`; nothing is sent anywhere.

| Key | Contents |
| --- | --- |
| `expenses` | Array of `{ amount, category, date }` objects |
| `theme` | `"light"` or `"dark"` |
| `user` | Demo signup credentials (see note below) |
| `isLoggedIn` | `"true"` after a successful login |

To reset the app, clear site data for the page in your browser settings.

## Notes & Limitations

- **Demo only authentication.** Credentials are stored in plain text in `localStorage` and are not secure. Do not use this login for anything real.
- **Data is per-browser.** Expenses do not sync across devices and are lost if you clear site data.
- **Statement parsing is format-specific.** It expects the `DD-MM-YYYY ... amount(Dr)` pattern described above; scanned/image-only PDFs will not work because there is no OCR.
- **No edit or delete UI yet.** Expenses can only be added.

## License

No license has been specified for this project.
