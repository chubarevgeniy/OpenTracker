import { useMemo, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, subDays, differenceInDays, startOfWeek, startOfMonth, addDays } from 'date-fns'
import { useAppStore } from '../store'
import type { DailyLog } from '../store'
import { calculateTDEE } from '../utils/calculations'


type TimeRange = 7 | 30 | 90 | 180 | 365 | 'all' | 'goal'

interface AggregatedData {
  date: string
  fullDate: string
  totalCalories: number
  calCount: number
  weightSum: number
  weightCount: number
  weightMin: number
  weightMax: number
  goalWeight: number | "" | null
  tdeeSum: number
  tdeeCount: number
}

export default function Stats() {
 const dailyLogs = useAppStore((state) => state.dailyLogs)
 const settings = useAppStore((state) => state.settings)
 const settingsWeight = settings.weight || 0

 const [timeRange, setTimeRange] = useState<TimeRange>(30)
 const [averaging, setAveraging] = useState<'auto' | 'daily' | 'weekly' | 'monthly'>('auto')
 const [excludeZeroes, setExcludeZeroes] = useState(true)
 const [tdeeRange, setTdeeRange] = useState<30 | 60 | 90 | 'all'>(30)

 const chartData = useMemo(() => {
 const data = []
 const today = new Date()
    const sortedLogDates = Object.keys(dailyLogs).sort()

 let daysToCalculate = 30
 if (typeof timeRange === 'number') {
 daysToCalculate = timeRange
 } else if (timeRange === 'all') {
      if (sortedLogDates.length > 0) {
        daysToCalculate = differenceInDays(today, new Date(sortedLogDates[0])) + 1
 }
 } else if (timeRange === 'goal' && settings.weightGoal) {
 daysToCalculate = differenceInDays(today, new Date(settings.weightGoal.startDate)) + 1
 if (daysToCalculate < 1) daysToCalculate = 1
 }

 // Fill data for the last N days to ensure continuity
 for (let i = daysToCalculate - 1; i >= 0; i--) {
 const date = subDays(today, i)
 const dateStr = format(date, 'yyyy-MM-dd')
 const log = dailyLogs[dateStr]

 let calories = 0
 if (log) {
 Object.values(log.meals).forEach(mealArray => {
 mealArray.forEach(entry => {
 calories += entry.calories
 })
 })
 }

      const historicalTdeeCalc = calculateTDEE(dailyLogs, 14, date)

 data.push({
 dateObj: date,
 date: format(date, 'MMM dd'),
 fullDate: dateStr,
 calories: excludeZeroes && calories === 0 ? null : Math.round(calories),
 weight: log?.weight || null,
 goalWeight: settings.weightGoal ? settings.weightGoal.targetWeight : null,
        tdee: historicalTdeeCalc ? historicalTdeeCalc.tdee : null,
 })
 }

 // Interpolate missing weights for better visualization
 // First, try to find a weight BEFORE the range to use as a starting point
 let initialWeight: number | null = null
 if (data.length > 0) {
      for (let i = sortedLogDates.length - 1; i >= 0; i--) {
        const d = sortedLogDates[i]
 if (d < data[0].fullDate && dailyLogs[d].weight) {
 initialWeight = dailyLogs[d].weight
 break
 }
 }
 }

 // If no weight before range, use the first valid weight IN the range
 if (initialWeight === null) {
 for (const point of data) {
 if (point.weight !== null) {
 initialWeight = point.weight
 break
 }
 }
 }

 // If still null, fallback to settings weight (though the user prefers the earliest date)
 let lastKnownWeight = initialWeight !== null ? initialWeight : settingsWeight

 for (const point of data) {
 if (point.weight !== null) {
 lastKnownWeight = point.weight
 } else {
 point.weight = lastKnownWeight
 }
 }

 // Aggregation logic
 if (averaging === 'weekly' || (averaging === 'auto' && daysToCalculate > 60 && daysToCalculate <= 180)) {
 // Weekly average
      const weeklyData: Record<string, AggregatedData> = {}
 data.forEach(point => {
 const weekStart = format(startOfWeek(point.dateObj), 'yyyy-MM-dd')
 if (!weeklyData[weekStart]) {
 weeklyData[weekStart] = {
 date: format(startOfWeek(point.dateObj), 'MMM dd'),
 fullDate: weekStart,
 totalCalories: 0,
 calCount: 0,
 weightSum: 0,
 weightCount: 0,
            weightMin: Infinity,
            weightMax: -Infinity,
            goalWeight: point.goalWeight,
            tdeeSum: 0,
            tdeeCount: 0,
 }
 }
 if (point.calories !== null) {
 weeklyData[weekStart].totalCalories += (point.calories || 0)
 weeklyData[weekStart].calCount += 1
 }
 if (point.weight !== null) {
 weeklyData[weekStart].weightSum += point.weight
 weeklyData[weekStart].weightCount += 1
          if (point.weight < weeklyData[weekStart].weightMin) {
            weeklyData[weekStart].weightMin = point.weight
          }
          if (point.weight > weeklyData[weekStart].weightMax) {
            weeklyData[weekStart].weightMax = point.weight
          }
 }
        if (point.tdee !== null) {
          weeklyData[weekStart].tdeeSum += point.tdee
          weeklyData[weekStart].tdeeCount += 1
        }
 })
      return Object.values(weeklyData).map(w => ({
 date: w.date,
 fullDate: w.fullDate,
 calories: w.calCount > 0 ? Math.round(w.totalCalories / w.calCount) : null,
 weight: w.weightCount > 0 ? Number((w.weightSum / w.weightCount).toFixed(1)) : null,
        weightMin: w.weightCount > 0 ? w.weightMin : null,
        weightMax: w.weightCount > 0 ? w.weightMax : null,
        goalWeight: w.goalWeight,
        tdee: w.tdeeCount > 0 ? Math.round(w.tdeeSum / w.tdeeCount) : null,
 }))
 } else if (averaging === 'monthly' || (averaging === 'auto' && daysToCalculate > 180)) {
 // Monthly average
      const monthlyData: Record<string, AggregatedData> = {}
 data.forEach(point => {
 const monthStart = format(startOfMonth(point.dateObj), 'yyyy-MM')
 if (!monthlyData[monthStart]) {
 monthlyData[monthStart] = {
 date: format(startOfMonth(point.dateObj), 'MMM yyyy'),
 fullDate: monthStart + '-01',
 totalCalories: 0,
 calCount: 0,
 weightSum: 0,
 weightCount: 0,
            weightMin: Infinity,
            weightMax: -Infinity,
            goalWeight: point.goalWeight,
            tdeeSum: 0,
            tdeeCount: 0,
 }
 }
 if (point.calories !== null) {
 monthlyData[monthStart].totalCalories += (point.calories || 0)
 monthlyData[monthStart].calCount += 1
 }
 if (point.weight !== null) {
 monthlyData[monthStart].weightSum += point.weight
 monthlyData[monthStart].weightCount += 1
          if (point.weight < monthlyData[monthStart].weightMin) {
            monthlyData[monthStart].weightMin = point.weight
          }
          if (point.weight > monthlyData[monthStart].weightMax) {
            monthlyData[monthStart].weightMax = point.weight
          }
 }
        if (point.tdee !== null) {
          monthlyData[monthStart].tdeeSum += point.tdee
          monthlyData[monthStart].tdeeCount += 1
        }
 })
      return Object.values(monthlyData).map(m => ({
 date: m.date,
 fullDate: m.fullDate,
 calories: m.calCount > 0 ? Math.round(m.totalCalories / m.calCount) : null,
 weight: m.weightCount > 0 ? Number((m.weightSum / m.weightCount).toFixed(1)) : null,
        weightMin: m.weightCount > 0 ? m.weightMin : null,
        weightMax: m.weightCount > 0 ? m.weightMax : null,
        goalWeight: m.goalWeight,
        tdee: m.tdeeCount > 0 ? Math.round(m.tdeeSum / m.tdeeCount) : null,
 }))
 }

 return data
 }, [dailyLogs, timeRange, settingsWeight, settings.weightGoal, averaging, excludeZeroes])

 const tdeeCalc = useMemo(() => {
 return calculateTDEE(dailyLogs, tdeeRange)
 }, [dailyLogs, tdeeRange])

  const tomorrowPrediction = useMemo(() => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const todayLog = dailyLogs[todayStr]

    // Helper to get total calories for a log
    const getCalories = (log: DailyLog | undefined) => {
      if (!log) return 0
      let c = 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.values(log.meals).forEach((m: any[]) => m.forEach((e: any) => c += e.calories))
      return c
    }

    const todayCalories = getCalories(todayLog)

    // Find latest weight
    let latestWeight = settings.weight
    if (todayLog?.weight) {
      latestWeight = todayLog.weight
    } else {
      const sortedDates = Object.keys(dailyLogs).sort().reverse()
      for (const date of sortedDates) {
        if (date < todayStr && dailyLogs[date].weight) {
          latestWeight = dailyLogs[date].weight
          break
        }
      }
    }

    if (!latestWeight || typeof latestWeight !== 'number' || !tdeeCalc) return null

    // Calculate smart coefficient 'k' based on historical data
    let sumXY = 0
    let sumXX = 0

    const goalStartDate = settings.weightGoal?.startDate || format(subDays(today, 30), 'yyyy-MM-dd')
    let currentDate = new Date(goalStartDate)
    if (currentDate > today) currentDate = subDays(today, 30)

    const datesToCheck = []
    while(format(currentDate, 'yyyy-MM-dd') < todayStr) {
      datesToCheck.push(format(currentDate, 'yyyy-MM-dd'))
      currentDate = addDays(currentDate, 1)
    }

    datesToCheck.forEach(dateD => {
      const dateD_plus_1 = format(addDays(new Date(dateD), 1), 'yyyy-MM-dd')
      const dateD_minus_1 = format(subDays(new Date(dateD), 1), 'yyyy-MM-dd')

      const logD = dailyLogs[dateD]
      const logD_plus_1 = dailyLogs[dateD_plus_1]
      const logD_minus_1 = dailyLogs[dateD_minus_1]

      if (logD?.weight && logD_plus_1?.weight && logD_minus_1) {
        const calD = getCalories(logD)
        const calD_minus_1 = getCalories(logD_minus_1)

        if (calD > 500 && calD_minus_1 > 500) {
          const weightDelta = logD_plus_1.weight - logD.weight
          const fatLoss = (calD - tdeeCalc.tdee) / 7700
          const foodDelta = weightDelta - fatLoss
          const calDelta = calD - calD_minus_1

          sumXY += calDelta * foodDelta
          sumXX += calDelta * calDelta
        }
      }
    })

    // Default k: 1000 kcal diff = ~200g weight change (glycogen + food volume)
    let k = 0.0002
    if (sumXX > 50000) {
      k = Math.max(0, Math.min(0.001, sumXY / sumXX))
    }

    let predictedWeightChange = (todayCalories - tdeeCalc.tdee) / 7700
    let isSmart = false

    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')
    const yesterdayLog = dailyLogs[yesterdayStr]
    const yesterdayCalories = getCalories(yesterdayLog)

    if (yesterdayCalories > 500) {
      const calDelta = todayCalories - yesterdayCalories
      const foodWeightDelta = k * calDelta
      predictedWeightChange += foodWeightDelta
      isSmart = true
    }

    const predictedWeight = latestWeight + predictedWeightChange

    return {
      todayCalories: Math.round(todayCalories),
      latestWeight: latestWeight,
      predictedWeightChange: Number(predictedWeightChange.toFixed(3)),
      predictedWeight: Number(predictedWeight.toFixed(2)),
      isSmart
    }
  }, [dailyLogs, tdeeCalc, settings.weight, settings.weightGoal])

 return (
 <div className="p-4 space-y-6 bg-bg min-h-screen pb-24">
 <header className="flex flex-col gap-5 pt-2">
 <h1 className="text-2xl font-black text-text">Statistics</h1>
 <div className="flex bg-surface p-1.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
 {[7, 30, 90, 180, 365, 'all'].map((range) => (
 <button
 key={range}
 className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${timeRange === range ? 'bg-bg-alt text-text' : 'text-text-muted hover:text-text'}`}
 onClick={() => setTimeRange(range as TimeRange)}
 >
 {typeof range === 'number' ? (range >= 30 ? (range === 365 ? '1Y' : `${range/30}M`) : `${range}D`) : 'All'}
 </button>
 ))}
 {settings.weightGoal && (
 <button
 className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${timeRange === 'goal' ? 'bg-bg-alt text-text' : 'text-text-muted hover:text-text'}`}
 onClick={() => setTimeRange('goal')}
 >
 Goal
 </button>
 )}
 </div>
 <div className="flex items-center gap-3">
 <span className="text-sm text-text-muted font-bold">Averaging:</span>
 <div className="flex flex-1 bg-surface p-1.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
 {['auto', 'daily', 'weekly', 'monthly'].map((avg) => (
 <button
 key={avg}
 className={`flex-1 py-1.5 text-xs font-bold rounded-xl capitalize transition-colors ${averaging === avg ? 'bg-bg-alt text-text' : 'text-text-muted hover:text-text'}`}
 onClick={() => setAveraging(avg as typeof averaging)}
 >
 {avg}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-text">
 <input
 type="checkbox"
 className="h-5 w-5 text-primary focus:ring-primary border-transparent rounded-md bg-surface shadow-sm"
 checked={excludeZeroes}
 onChange={(e) => setExcludeZeroes(e.target.checked)}
 />
 Exclude 0 calorie days from lines
 </label>
 </div>
 </header>

 <div className="bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent h-80 flex flex-col">
 <h2 className="text-lg font-bold mb-4 text-text">Calories Consumed</h2>
 <div className="flex-1 min-h-0">
 <ResponsiveContainer width="100%"height="100%">
 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
 <BarChart data={chartData as any[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12}>
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="var(--theme-border)" />
 <XAxis dataKey="date"fontSize={10} tickMargin={10} axisLine={false} tickLine={false} fontWeight="bold" />
 <YAxis fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
 <Tooltip contentStyle={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)', border: 'none', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontWeight: 'bold' }} cursor={{fill: 'var(--theme-surface-hover)'}}/>
 <Bar dataKey="calories" fill="var(--color-primary)" radius={[4, 4, 4, 4]} name="Calories" />
 <ReferenceLine y={settings.targetCalories} stroke="var(--theme-text-muted)" strokeDasharray="3 3" strokeWidth={2}/>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent h-80 flex flex-col">
 <h2 className="text-lg font-bold mb-4 text-text">Body Weight</h2>
 <div className="flex-1 min-h-0">
 <ResponsiveContainer width="100%"height="100%">
 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
 <LineChart data={chartData as any[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="var(--theme-border)" />
 <XAxis dataKey="date"fontSize={10} tickMargin={10} axisLine={false} tickLine={false} fontWeight="bold" />
 <YAxis domain={['auto', 'auto']} fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
 <Tooltip contentStyle={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)', border: 'none', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontWeight: 'bold' }} />
 <Line type="monotone"dataKey="weight"stroke="#3b82f6"strokeWidth={4} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 7 }} name="Weight (kg)"/>
              {(averaging === 'weekly' || averaging === 'monthly' || (averaging === 'auto' && chartData.length > 0 && 'weightMin' in chartData[0])) && (
                <>
                  <Line type="monotone" dataKey="weightMin" stroke="#60a5fa" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Min Weight" />
                  <Line type="monotone" dataKey="weightMax" stroke="#60a5fa" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Max Weight" />
                </>
              )}
 {settings.weightGoal && (
 <Line type="monotone"dataKey="goalWeight"stroke="#10b981"strokeWidth={3} strokeDasharray="5 5"dot={false} name="Goal (kg)"/>
 )}
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent h-80 flex flex-col">
 <h2 className="text-lg font-bold mb-4 text-text">Base Consumption (TDEE)</h2>
 <div className="flex-1 min-h-0">
 <ResponsiveContainer width="100%" height="100%">
 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
 <LineChart data={chartData as any[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
 <XAxis dataKey="date" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} fontWeight="bold" />
 <YAxis domain={['auto', 'auto']} fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
 <Tooltip contentStyle={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)', border: 'none', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontWeight: 'bold' }} />
 <Line type="monotone" dataKey="tdee" stroke="#f59e0b" strokeWidth={4} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 7 }} name="TDEE (kcal)" connectNulls={true} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Real Energy Expenditure Card */}
 <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h2 className="text-lg font-semibold mb-1">True Maintenance (TDEE)</h2>
 <p className="text-purple-100 text-sm">Calculated from your logged data</p>
 </div>
 <select
 className="bg-surface/20 border border-white/30 text-white text-sm rounded-lg p-1.5 focus:ring-white focus:border-white"
 value={tdeeRange}
 onChange={(e) => setTdeeRange(e.target.value === 'all' ? 'all' : Number(e.target.value) as 30 | 60 | 90)}
 >
 <option value="30"className="text-text">Last 30 Days</option>
 <option value="60"className="text-text">Last 60 Days</option>
 <option value="90"className="text-text">Last 90 Days</option>
 <option value="all"className="text-text">All Time</option>
 </select>
 </div>

 {tdeeCalc ? (
 <div className="space-y-4">
 <div className="flex items-end justify-between">
 <div>
 <p className="text-3xl font-bold">{tdeeCalc.tdee}</p>
 <p className="text-purple-200 text-sm">kcal / day</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 text-sm bg-surface/10 p-3 rounded-xl backdrop-blur-sm">
 <div>
 <p className="text-purple-200">Avg Intake</p>
 <p className="font-medium">{tdeeCalc.avgIntake} kcal</p>
 </div>
 <div>
 <p className="text-purple-200">Weight Change</p>
 <p className="font-medium">{tdeeCalc.weightDelta > 0 ? '+' : ''}{tdeeCalc.weightDelta} kg in {tdeeCalc.days} days</p>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-surface/10 p-4 rounded-xl text-sm">
 <p>We need more data to calculate your true maintenance calories.</p>
 <p className="mt-2 text-purple-200 opacity-80">Log your food and weight consistently for at least 14 days.</p>
 </div>
 )}
 </div>

 {/* Tomorrow's Weight Prediction Card */}
 {tomorrowPrediction && tdeeCalc && (
   <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-2xl shadow-md">
     <div className="mb-4">
       <div className="flex justify-between items-start">
         <h2 className="text-lg font-semibold mb-1">Tomorrow's Weight Prediction</h2>
         {tomorrowPrediction.isSmart && (
           <span className="bg-emerald-800/50 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium tracking-wide uppercase" title="Accounts for food volume/glycogen trends based on your history">
             Smart
           </span>
         )}
       </div>
       <p className="text-emerald-100 text-sm">Based on today's intake & your TDEE</p>
     </div>

     <div className="space-y-4">
       <div className="flex items-end justify-between">
         <div>
           <p className="text-3xl font-bold">{tomorrowPrediction.predictedWeight}</p>
           <p className="text-emerald-200 text-sm">kg expected tomorrow</p>
         </div>
       </div>

       <div className="grid grid-cols-2 gap-4 text-sm bg-surface/10 p-3 rounded-xl backdrop-blur-sm">
         <div>
           <p className="text-emerald-200">Today's Intake</p>
           <p className="font-medium">{tomorrowPrediction.todayCalories} kcal</p>
         </div>
         <div>
           <p className="text-emerald-200">Expected Change</p>
           <p className="font-medium">
             {tomorrowPrediction.predictedWeightChange > 0 ? '+' : ''}
             {tomorrowPrediction.predictedWeightChange} kg
           </p>
         </div>
       </div>
     </div>
   </div>
 )}
 </div>
 )
}
