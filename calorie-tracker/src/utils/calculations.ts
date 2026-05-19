import { differenceInDays, subDays, format } from 'date-fns'
import type { DailyLog } from '../store'

export function calculateTDEE(dailyLogs: Record<string, DailyLog>, tdeeRange: number | 'all', endDate: Date = new Date()) {
  const endDateStr = format(endDate, 'yyyy-MM-dd')
  let logsInPeriod: DailyLog[] = []

  if (tdeeRange === 'all') {
    logsInPeriod = Object.values(dailyLogs)
      .filter(log => log.date <= endDateStr)
      .sort((a, b) => a.date.localeCompare(b.date))
  } else {
    for (let i = tdeeRange; i >= 0; i--) {
      const dateStr = format(subDays(endDate, i), 'yyyy-MM-dd')
      if (dailyLogs[dateStr]) {
        logsInPeriod.push(dailyLogs[dateStr])
      }
    }
  }

 if (logsInPeriod.length < 5) return null // Need more data

 let totalCalories = 0
 let daysWithFood = 0

 logsInPeriod.forEach(log => {
 let dailyCals = 0
 Object.values(log.meals).forEach(mealArray => {
 mealArray.forEach(entry => dailyCals += entry.calories)
 })
 if (dailyCals > 500) { // arbitrary threshold to count as a"logged"day
 totalCalories += dailyCals
 daysWithFood++
 }
 })

  const requiredDays = tdeeRange === 'all' ? 14 : Math.min(14, Math.floor(tdeeRange * 0.5))
  if (daysWithFood < requiredDays) return null // Need minimum days of good food logging

 const avgDailyIntake = totalCalories / daysWithFood

 // Find weight delta
 const firstWeightLog = logsInPeriod.find(l => l.weight)
 const lastWeightLog = [...logsInPeriod].reverse().find(l => l.weight)

 if (!firstWeightLog || !lastWeightLog || firstWeightLog.date === lastWeightLog.date) return null

 const daysBetweenWeights = differenceInDays(
 new Date(lastWeightLog.date),
 new Date(firstWeightLog.date)
 )
  if (daysBetweenWeights < requiredDays) return null

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
}
