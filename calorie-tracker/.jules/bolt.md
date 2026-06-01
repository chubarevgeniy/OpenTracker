## 2024-05-18 - Avoid Object.values().forEach() on hot paths
**Learning:** In highly nested objects like `log.meals`, using `Object.values().forEach()` allocates new arrays and incurs function creation overhead. This adds significant garbage collection pressure when recalculating derived states frequently (e.g., in useMemo on Dashboard and Stats).
**Action:** Always prefer native `for...in` loops and traditional `for` loops over the nested arrays for these data structures to ensure high performance and fewer garbage collections.
