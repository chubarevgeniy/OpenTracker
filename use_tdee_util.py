import sys

def main():
    filepath = 'calorie-tracker/src/pages/Stats.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    # Import the function
    import_statement = "import { calculateTDEE } from '../utils/calculations'\n"
    if 'import { calculateTDEE }' not in content:
        lines = content.split('\n')
        # find last import
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        lines.insert(last_import + 1, import_statement)
        content = '\n'.join(lines)

    # Replace tdeeCalc useMemo
    search_block = """  const tdeeCalc = useMemo(() => {
    const today = new Date()

    // Find earliest weight within 30 days
    const logsInPeriod = Object.values(dailyLogs).filter(log => {
      const date = new Date(log.date)
      return tdeeRange === 'all' ? true : differenceInDays(today, date) <= tdeeRange
    }).sort((a, b) => a.date.localeCompare(b.date))

    if (logsInPeriod.length < 5) return null // Need more data

    let totalCalories = 0
    let daysWithFood = 0

    logsInPeriod.forEach(log => {
      let dailyCals = 0
      Object.values(log.meals).forEach(mealArray => {
        mealArray.forEach(entry => dailyCals += entry.calories)
      })
      if (dailyCals > 500) { // arbitrary threshold to count as a "logged" day
        totalCalories += dailyCals
        daysWithFood++
      }
    })

    if (daysWithFood < 14) return null // Need at least 14 days of good food logging

    const avgDailyIntake = totalCalories / daysWithFood

    // Find weight delta
    const firstWeightLog = logsInPeriod.find(l => l.weight)
    const lastWeightLog = [...logsInPeriod].reverse().find(l => l.weight)

    if (!firstWeightLog || !lastWeightLog || firstWeightLog.date === lastWeightLog.date) return null

    const daysBetweenWeights = differenceInDays(
      new Date(lastWeightLog.date),
      new Date(firstWeightLog.date)
    )
    if (daysBetweenWeights < 14) return null

    const weightDelta = lastWeightLog.weight! - firstWeightLog.weight!

    // 1 kg of body weight = ~7700 calories
    const totalCaloricDeficitOrSurplus = weightDelta * 7700
    const dailyCaloricDelta = totalCaloricDeficitOrSurplus / daysBetweenWeights

    // If weightDelta is negative (lost weight), maintenance = intake + deficit
    // If weightDelta is positive (gained weight), maintenance = intake - surplus
    const estimatedTDEE = avgDailyIntake - dailyCaloricDelta

    return {
      avgIntake: Math.round(avgDailyIntake),
      weightDelta: Number(weightDelta.toFixed(1)),
      days: daysBetweenWeights,
      tdee: Math.round(estimatedTDEE)
    }
  }, [dailyLogs, tdeeRange])"""

    replace_block = """  const tdeeCalc = useMemo(() => {
    return calculateTDEE(dailyLogs, tdeeRange)
  }, [dailyLogs, tdeeRange])"""

    if search_block in content:
        content = content.replace(search_block, replace_block)
        with open(filepath, 'w') as f:
            f.write(content)
        print("Successfully replaced tdeeCalc logic.")
    else:
        print("Search block not found.")

if __name__ == "__main__":
    main()
