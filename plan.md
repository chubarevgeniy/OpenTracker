1. **Fix numeric inputs in `Settings.tsx` to allow temporary empty values.**
   - In `store.ts`, change the types of `age`, `weight`, `height`, `targetCalories`, `targetProtein`, `targetCarbs`, `targetFat` in `Settings` interface to allow `| ''`.
   - Update `WeightGoal` `targetWeight`, `initialWeight` to allow `| ''`.
   - Update `defaultSettings` to reflect changes if necessary (it already has numbers).
   - In `Settings.tsx`, change `Number(e.target.value)` to `e.target.value === '' ? '' : Number(e.target.value)` for these inputs.
   - Wait, if `Settings` has `| ''`, we need to make sure we cast to `Number()` in the `calculateTargets` function.
   - Alternatively, use local state for inputs. This is much cleaner than changing the central store interface. I'll use local state for inputs in `Settings.tsx` or simply `value={settings.age === 0 ? '' : settings.age}`. Wait, if `value` is `0`, and we clear it, `Number('')` becomes `0`. The input will re-render as `0`. We really need to use `e.target.value === '' ? '' : Number(e.target.value)` and update `Settings` type to `number | ''`.
   - Let's update `Settings` to `number | ''`.

2. **Add Averaging Method to Statistics.**
   - In `Stats.tsx`, add state `averaging`: `const [averaging, setAveraging] = useState<'auto'|'daily'|'weekly'|'monthly'>('auto')`.
   - Add UI buttons to select the averaging method.
   - Update the `chartData` generation logic. Currently it decides based on `daysToCalculate`. Now, if `averaging !== 'auto'`, override `daysToCalculate` logic (e.g., if `daily`, always return raw data; if `weekly`, group by week; if `monthly`, group by month).

3. **Exclude Zero Calorie Days from Chart.**
   - In `Stats.tsx`, add state `excludeZeroes`: `const [excludeZeroes, setExcludeZeroes] = useState(false)`.
   - Add a checkbox "Exclude zero calorie days".
   - In `chartData` calculation, if `excludeZeroes` is true and a daily log has 0 calories, set the `calories` field to `null` instead of `0`.
   - Add `connectNulls={true}` to the `<Line dataKey="calories">` component in `recharts`.

4. **TDEE Range Selection.**
   - In `Stats.tsx`, add state `tdeeRange`: `const [tdeeRange, setTdeeRange] = useState<30 | 60 | 90 | 'all'>(30)`.
   - Add a dropdown or buttons to select this range.
   - Update the `tdeeCalc` logic to filter `logsInPeriod` based on `tdeeRange`.

5. **Set Targets from TDEE/Formula in Settings.**
   - First, extract the TDEE calculation logic from `Stats.tsx` into a new utility function `calculateTDEE(dailyLogs, days)` in a new file `src/utils/calculations.ts`.
   - Use this utility in `Stats.tsx`.
   - In `Settings.tsx`, next to "Manual Override", add a section or buttons: "Set from Formula" and "Set from TDEE".
   - "Set from Formula" will just call `calculateTargets` with current profile info.
   - "Set from TDEE" will call `calculateTDEE`, take the returned `tdee` value, and set `targetCalories` to that value. If `tdee` is null (not enough data), show an alert.

6. **Pre-commit and Review**
   - Run linter/typechecks.
   - Ensure pre-commit steps are met.
   - Submit.
