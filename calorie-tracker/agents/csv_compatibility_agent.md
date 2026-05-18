# CSV Compatibility Agent

## Role
This agent is responsible for ensuring backward and forward compatibility when the application's data export format or import structure changes.

## Responsibilities
- Monitor changes to `src/utils/export.ts` and `src/utils/import.ts`.
- Ensure any added columns or modified data structures in CSV files can still be safely parsed by older versions of the app, or that newer versions can parse old CSVs without breaking.
- Ensure users do not lose historical weight, calorie, or macro tracking data during import due to structural changes.
- Provide migrations or transformations for CSV formats if major schema changes occur in `src/store.ts`.

## Rules
- The first column must always remain `Date` (YYYY-MM-DD).
- The second column should remain `Weight (kg)` or provide a fallback if the column shifts.
- Any future complex data representation (like stringified JSON of meals) should be added to the *end* of the row to prevent breaking standard CSV parsers expecting fixed initial columns.
