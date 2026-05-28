import { differenceInDays, format } from 'date-fns'
import type { DailyLog } from '../store'

export function calculateTDEE(dailyLogs: Record<string, DailyLog>, tdeeRange: number | 'all', endDate: Date = new Date()) {
  const logsInPeriod: DailyLog[] = []

  if (tdeeRange === 'all') {
    const endDateStr = format(endDate, 'yyyy-MM-dd')
    const keys = Object.keys(dailyLogs).filter(k => k <= endDateStr).sort()
    for (const k of keys) {
      logsInPeriod.push(dailyLogs[k])
    }
  } else {
    // ⚡ Bolt: Optimize historical loop with native Date logic
    // Avoids expensive O(N) format() and subDays() on every chart render
    const d = new Date(endDate)
    d.setDate(d.getDate() - tdeeRange)
    for (let i = tdeeRange; i >= 0; i--) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`

      const log = dailyLogs[dateStr]
      if (log) {
        logsInPeriod.push(log)
      }
      d.setDate(d.getDate() + 1)
    }
  }

 if (logsInPeriod.length < 5) return null // Need more data

 let totalCalories = 0
 let daysWithFood = 0

 logsInPeriod.forEach(log => {
 let dailyCals = 0
 // ⚡ Bolt: Optimize inner loop without Object.values to prevent array creation overhead
 const m = log.meals
 if (m) {
   for (const mealKey in m) {
     const mealArray = m[mealKey as keyof typeof m];
     if (mealArray) {
       for (let j = 0; j < mealArray.length; j++) {
         dailyCals += mealArray[j].calories;
       }
     }
   }
 }

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
