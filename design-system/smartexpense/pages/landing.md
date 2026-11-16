# Landing Page Overrides

> **PROJECT:** SmartExpense
> **Generated:** 2026-11-16
> **Page Type:** Marketing landing

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/smartexpense/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1160px for readable marketing copy and a contained hero mockup
- **Grid:** Single-column reading flow with two-column hero, import, and FAQ sections; 3-column feature and step grids on desktop
- **Header:** Sticky glass header, 74px tall; mobile navigation collapses below 860px

### Spacing Overrides

- **Content Density:** Medium — generous section spacing (`clamp(64px, 8vw, 104px)`) for a marketing page

### Typography Overrides

- No overrides — use Master typography (Lexend / Source Sans 3)

### Color Overrides

- Dark mode is the default brand presentation; light mode is provided via the shared `theme` localStorage key
- CTA accent uses high-contrast on-accent text instead of white-on-green: `#04261C` on `#10B981` in dark mode, `#FFFFFF` on `#047857` in light mode

### Component Overrides

- No overrides — use Master component specs

---

## Page-Specific Components

- **Dashboard mockup:** illustrative, `aria-hidden` product preview built with HTML/CSS (replaces a video demo)
- **Floating proof cards:** decorative glass cards showing parsed statement and category insight; hidden below 1180px
- **At-a-glance strip:** four honest product facts (0 servers, 1-click import, 5 categories, 100% local)
- **Import visual:** PDF file card, parse connector, extracted-transaction list, and expected format chip
- **Native FAQ disclosure:** `<details>/<summary>` accordion with visible focus and rotating plus icon

---

## Recommendations

- Keep the hero mockup static under `prefers-reduced-motion`; no video, autoplay, or scroll-jacking
- Maintain 4.5:1 contrast for body copy in both themes; do not use pure white page backgrounds
- Keep all icons as inline SVG from one stroke family — no emoji icons
