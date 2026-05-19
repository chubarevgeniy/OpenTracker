import { differenceInDays } from 'date-fns'
import type { DailyLog } from '../store'

export function calculateTDEE(dailyLogs: Record<string, DailyLog>, tdeeRange: number | 'all') {
 const today = new Date()

 // Find earliest weight within range days
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
 if (dailyCals > 500) { // arbitrary threshold to count as a"logged"day
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
}
