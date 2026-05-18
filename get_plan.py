def get_plan():
    return """
Let's make a plan based on the user's requirements:

1. **Fixing number inputs not allowing empty values:**
   - In `Settings.tsx`, there are inputs for `age`, `weight`, `height`, `targetCalories`, `targetProtein`, `targetCarbs`, `targetFat`, `initialWeight`, and `targetWeight`.
   - If they are directly tied to numbers, typing backspace to clear the field changes the value to `0`, which prevents it from being completely empty, resulting in `092`.
   - Solution: We will update the types in the `store.ts` for these fields to be `number | ''` or we can modify the `<input>` elements in `Settings.tsx` to handle `value={settings.age === 0 ? '' : settings.age}` and `onChange={(e) => handleProfileChange('age', e.target.value === '' ? '' : Number(e.target.value))}`. Wait, if we use `0 ? '' : settings.age`, you can't type `0`.
   - The proper way is to use `value={settings.age.toString() === '0' && e.target.value === '' ? '' : settings.age}` ... no, React inputs need to reflect local state to support empty strings, or the `Settings` type needs to allow empty strings (`number | ''`). If we change `Settings` interface in `store.ts` to allow `number | ''`, then `e.target.value === '' ? '' : Number(e.target.value)` works perfectly!
   - Let's check `store.ts`: update `Settings` to allow empty strings for `age`, `weight`, `height`, `targetCalories`, `targetProtein`, `targetCarbs`, `targetFat`. Same for `WeightGoal` `initialWeight`, `targetWeight`.
   - Wait, if we change `Settings`, then other parts of the app might break if they expect numbers.
   - Alternatively, we can use local state for the form in `Settings.tsx`, initialized from `settings`, and sync back to `settings` via `updateSettings` on blur or on change (using `Number(val) || 0`).
   - Or, simply use strings for inputs: `const [localSettings, setLocalSettings] = useState(...)`. This is safer. But `settings` is already used in `handleProfileChange` which updates the store immediately.
   - What if we just change the `Settings` interface in `store.ts` to allow `number | ''`? Let's look at `store.ts`. It says `age: number`. Changing to `age: number | ''` requires updating calculations.
   - A better way: in `Settings.tsx`, change the input value to `value={settings.age || ''}` and `onChange={(e) => handleProfileChange('age', e.target.value === '' ? '' : Number(e.target.value))}`. But we need to update `handleProfileChange`'s type to accept `number | ''`, and save `''` to the store as `''`. Actually, let's use `number | ''` in `store.ts` for these fields. When calculating, we just cast `Number(settings.age)`. This is the easiest and most React way.

2. **Stats menu: Averaging method:**
   - In `Stats.tsx`, add a state: `const [averaging, setAveraging] = useState<'auto' | 'daily' | 'weekly' | 'monthly'>('auto')`
   - Modify the `chartData` calculation logic to respect the `averaging` state.

3. **TDEE (Calculation menu):**
   - In `Stats.tsx`, add a state for TDEE time range: `const [tdeeRange, setTdeeRange] = useState<30 | 60 | 90 | 'all'>(30)`
   - Update `tdeeCalc` useMemo to use `tdeeRange` instead of fixed 30 days.

4. **Stats menu: Exclude zero calorie days:**
   - Add a state: `const [excludeZeroCalories, setExcludeZeroCalories] = useState(false)`
   - In `chartData` generation, if `excludeZeroCalories` is true and `point.calories === 0`, set `calories` to `null` instead of `0`.
   - Use `connectNulls={true}` on the `<Line dataKey="calories">` in the chart.

5. **Settings menu: Overwrite target from TDEE:**
   - Need to extract the `calculateTDEE` logic from `Stats.tsx` into a reusable function in `utils/calculations.ts` or somewhere, so `Settings.tsx` can use it.
   - Or, just calculate it inside `Settings.tsx` using `dailyLogs`.
   - Add a button in Settings under Targets: "Set from TDEE" (Calculates TDEE and sets `targetCalories` to it).

Let's refine the plan.
"""
