## 2025-06-08 - Date-Fns in High Frequency Tight Loops
**Learning:** `date-fns` functions (like `format`, `subDays`, `addDays`), while convenient, create significant garbage collection overhead and cpu bottlenecks when called inside tight `for` or `while` loops that iterate over hundreds of historical items, particularly in the `tomorrowPrediction` hook.
**Action:** Replace `date-fns` calls with native `Date.setDate(Date.getDate() + 1)` arithmetic and manual string padding (e.g. `String(d.getMonth() + 1).padStart(2, '0')`) when iterating over large datasets or constructing data for Recharts to avoid micro-allocations.
## 2025-06-09 - Multiple array reductions on the same local state
**Learning:** React components sometimes chain multiple `.reduce()` operations over an array (e.g. `meals.reduce(sum + item.calories)`, `meals.reduce(sum + item.protein)`, etc) which incurs unnecessary array iteration overhead and, more importantly, triggers expensive calculations when any unrelated local state in the component (like an input field's keystrokes) causes a re-render.
**Action:** Merge multiple `reduce` passes into a single `for` loop and wrap the calculation in a `useMemo` block with the array as a dependency so it only recalculates when the underlying array actually changes.

## 2025-06-11 - Optimize Stats.tsx aggregation by removing date-fns
**Learning:** `date-fns` formatting (`format()`) and manipulation functions (like `startOfWeek`, `startOfMonth`) have extremely high overhead when invoked repeatedly within tight loop boundaries or iterations such as when iterating historical daily logs (hundreds of items) for weekly/monthly statistics aggregation.
**Action:** Always favor native JavaScript `Date` API methods (`getFullYear`, `getMonth`, `getDate`, combined with manual string padding `padStart`) when generating loop-dependent date strings or bin keys to avoid rendering bottlenecks on large historical data arrays.

## 2024-05-18 - Avoid Mapping Discarded Elements
**Learning:** Mapping a large array only to slice and discard most of the elements afterwards is computationally wasteful.
**Action:** Always slice an array to the required subset first before applying `.map()` transformations to avoid unnecessary mapping operations.
