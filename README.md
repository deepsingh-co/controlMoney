# SmartExpense

A lightweight, fully client-side expense tracker built with plain HTML, CSS, and JavaScript. Log expenses manually, import them from a bank statement PDF, and visualise your spending on a dashboard — no backend, no accounts, no setup.

The repo includes a marketing landing page (`landing.html`) and the app itself, whose dashboard lives at `index.html`.

## Features

- **Landing page** — a responsive, glassmorphism marketing page with light/dark themes.
- **Dashboard overview** — total spent, today, this month, and your largest category at a glance, with empty states until you add data.
- **Six-month trend** — a bar chart of monthly spending with a text summary and an optional data table for accessibility.
- **Category breakdown** — a donut chart with a visible legend showing amounts and shares, plus a text fallback.
- **Recent transactions** — newest-first list with category icons and a "Show all" control.
- **Quick actions** — shortcuts to add an expense, import a statement, and learn how the app works.
- **Add expenses** — amount presets, category tiles, a sensible default date, and inline validation.
- **Bank statement import** — drag and drop a PDF; debit transactions are extracted with PDF.js, duplicate lines are skipped, and the result is listed before you return to the dashboard.
- **Dark mode** — a theme toggle that remembers your preference and applies before first paint.
- **Demo authentication** — signup/login with inline validation, password visibility toggles, and locally stored credentials.
- **Accessible by default** — skip links, visible focus styles, labelled icons, live-region status messages, and reduced-motion support.

## Tech Stack

| Layer | Tool |
| --- | --- |
| Markup | HTML5 |
| Styling | CSS3 (custom properties, flexbox, grid, glassmorphism) |
| Logic | Vanilla JavaScript (ES5/ES6) |
| Charts | [Chart.js](https://www.chartjs.org/) (CDN) |
| PDF parsing | [PDF.js](https://mozilla.github.io/pdf.js/) (CDN) |
| Storage | Browser `localStorage` |

No build step, package manager, or server-side code is required.

## Design System

The app and landing page share the tokens documented in `design-system/smartexpense/MASTER.md`: Lexend for headings, Source Sans 3 for body text, trust blue as the brand colour, profit green as the accent, and a dark-first glassmorphism surface treatment. Dashboard-specific overrides live in `design-system/smartexpense/pages/dashboard.md`.

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
3. Add expenses from **Add expense**: enter an amount or use a preset, pick a category, choose a date, and submit. You are returned to the dashboard with a confirmation toast.
4. Import a bank statement from **Import statement**: drop a PDF and debit transactions are parsed and previewed automatically.
5. Return to the **Dashboard** to see totals, trends, categories, and recent transactions.
6. Use the toggle in the header to switch between light and dark mode.

### Bank statement format

The PDF importer reads text from each page, groups it into lines, and matches debit lines in this shape:

```text
DD-MM-YYYY  <description>  <amount>(Dr)
```

Only lines ending in `(Dr)` with a two-decimal amount are captured. They are stored under the **Bank** category, and exact duplicates are skipped on re-import. Credit lines and scanned/image-only PDFs are ignored. If your bank formats statements differently, adjust the pattern in `js/upload.js` (`parseLines`).

## Project Structure

```text
controlMoney/
├── landing.html        # Marketing landing page (hero, features, import, FAQ)
├── index.html          # Dashboard: stats, charts, recent transactions, quick actions
├── add-expense.html    # Form for adding an expense manually
├── upload.html         # PDF bank statement import
├── login.html          # Demo login page
├── signup.html         # Demo signup page
├── css/
│   ├── style.css       # Shared app styles: tokens, layout, components, responsive rules
│   └── landing.css     # Landing page tokens, glassmorphism, landing layout
├── js/
│   ├── theme.js        # Applies the saved theme before first paint
│   ├── app.js          # Shared chrome: theme toggle, mobile nav, footer year
│   ├── dashboard.js    # Stats, recent list, Chart.js charts, empty states, toast
│   ├── add-expense.js  # Inline validation and local save
│   ├── upload.js       # PDF parsing, drag and drop, duplicate detection
│   ├── auth.js         # Demo login/signup validation and password toggles
│   └── landing.js      # Landing theme toggle and mobile navigation
└── design-system/
    └── smartexpense/   # Design tokens and page rules generated with UI/UX Pro Max
        ├── MASTER.md
        └── pages/
            └── dashboard.md
```

## Data Storage

Everything lives in your browser's `localStorage`; nothing is sent anywhere.

| Key | Contents |
| --- | --- |
| `expenses` | Array of `{ amount, category, date, description? }` objects. Imported transactions include a `description`. |
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
