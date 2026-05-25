const fs = require('fs');
fs.writeFileSync('.jules/bolt.md', `## 2026-05-25 - Memoizing calculateTotals to prevent re-calculating macros on every render
**Learning:** Found a performance bottleneck in \`Dashboard.tsx\` where \`calculateTotals\` was NOT memoized and recalculated \`Object.values(log.meals).forEach\` on EVERY render of the Dashboard (e.g. typing in inputs).
**Action:** Wrapped \`calculateTotals\` computation in a \`useMemo\` dependent on \`log.meals\` to prevent recalculating all macros every time a minor state like \`weightInput\` changed.`);
