## 2024-05-21 - Added ARIA labels to icon-only buttons
**Learning:** Icon-only buttons using Lucide icons in Search and Settings pages lacked accessible names, reducing screen reader clarity and missing tooltip functionality.
**Action:** Always verify icon-only buttons (`<button><Icon /></button>`) have explicit `aria-label` and `title` attributes for accessibility and tooltip display.
