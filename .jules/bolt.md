## 2026-05-25 - Memoizing calculateTotals to prevent re-calculating macros on every render
**Learning:** Found a performance bottleneck in `Dashboard.tsx` where `calculateTotals` was NOT memoized and recalculated `Object.values(log.meals).forEach` on EVERY render of the Dashboard (e.g. typing in inputs).
**Action:** Wrapped `calculateTotals` computation in a `useMemo` dependent on `log.meals` to prevent recalculating all macros every time a minor state like `weightInput` changed.## 2024-05-26 - Avoid O(N log N) sorts on keystrokes
**Learning:** In controlled React inputs like `Search.tsx`, performing array sorting (e.g. `Object.values(searchHistory).sort()`) on every render can cause severe input lag, as it forces O(N log N) operations on every keystroke.
**Action:** Always wrap computationally expensive operations like array sorting or filtering in `useMemo` when they appear inside components that re-render frequently, ensuring they only recalculate when their dependencies change.
## 2024-05-27 - Avoid sorting in hot paths when searching for maximums
**Learning:** In `Dashboard.tsx`, performing `Object.keys(dailyLogs).sort().reverse()` inside a `useMemo` that depends on `dailyLogs` caused O(N log N) work on every keystroke when logging food. The sorting was only used to find the maximum date (most recent log) before a target date.
**Action:** Replace `sort()` with a simple O(N) linear scan when searching for an extrema (like the most recent date before a specific point) in frequently-re-rendered components or hot paths.
