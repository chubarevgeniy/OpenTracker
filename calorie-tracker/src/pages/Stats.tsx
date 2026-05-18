import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, subDays, differenceInDays, startOfWeek, startOfMonth } from 'date-fns'
import { useAppStore } from '../store'

type TimeRange = 7 | 30 | 90 | 180 | 365 | 'all' | 'goal'

export default function Stats() {
  const dailyLogs = useAppStore((state) => state.dailyLogs)
  const logWeight = useAppStore((state) => state.logWeight)
  const settings = useAppStore((state) => state.settings)
  const settingsWeight = settings.weight

  const [currentWeightInput, setCurrentWeightInput] = useState(settingsWeight.toString())
  const [timeRange, setTimeRange] = useState<TimeRange>(30)

  const handleLogWeight = () => {
    const w = parseFloat(currentWeightInput)
    if (!isNaN(w) && w > 0) {
      logWeight(format(new Date(), 'yyyy-MM-dd'), w)
      alert('Weight logged successfully!')
    }
  }

  const chartData = useMemo(() => {
    const data = []
    const today = new Date()

    let daysToCalculate = 30
    if (typeof timeRange === 'number') {
      daysToCalculate = timeRange
    } else if (timeRange === 'all') {
      const allDates = Object.keys(dailyLogs).sort()
      if (allDates.length > 0) {
        daysToCalculate = differenceInDays(today, new Date(allDates[0])) + 1
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

      data.push({
        dateObj: date,
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        calories: Math.round(calories),
        weight: log?.weight || null,
        goalWeight: settings.weightGoal ? settings.weightGoal.targetWeight : null,
      })
    }

    // Interpolate missing weights for better visualization
    let lastKnownWeight = settingsWeight

    // Attempt to find an initial weight for interpolation if the first point is null
    if (data.length > 0 && data[0].weight === null) {
      const sortedDates = Object.keys(dailyLogs).sort().reverse()
      for (const d of sortedDates) {
        if (d < data[0].fullDate && dailyLogs[d].weight) {
          lastKnownWeight = dailyLogs[d].weight
          break
        }
      }
    }

    for (const point of data) {
      if (point.weight !== null) {
        lastKnownWeight = point.weight
      } else {
        point.weight = lastKnownWeight
      }
    }

    // Aggregation logic
    if (daysToCalculate > 60 && daysToCalculate <= 180) {
      // Weekly average
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weeklyData: Record<string, any> = {}
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
            goalWeight: point.goalWeight
          }
        }
        if (point.calories > 0) {
          weeklyData[weekStart].totalCalories += point.calories
          weeklyData[weekStart].calCount += 1
        }
        if (point.weight !== null) {
          weeklyData[weekStart].weightSum += point.weight
          weeklyData[weekStart].weightCount += 1
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Object.values(weeklyData).map((w: any) => ({
        date: w.date,
        fullDate: w.fullDate,
        calories: w.calCount > 0 ? Math.round(w.totalCalories / w.calCount) : 0,
        weight: w.weightCount > 0 ? Number((w.weightSum / w.weightCount).toFixed(1)) : null,
        goalWeight: w.goalWeight
      }))
    } else if (daysToCalculate > 180) {
      // Monthly average
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monthlyData: Record<string, any> = {}
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
            goalWeight: point.goalWeight
          }
        }
        if (point.calories > 0) {
          monthlyData[monthStart].totalCalories += point.calories
          monthlyData[monthStart].calCount += 1
        }
        if (point.weight !== null) {
          monthlyData[monthStart].weightSum += point.weight
          monthlyData[monthStart].weightCount += 1
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Object.values(monthlyData).map((m: any) => ({
        date: m.date,
        fullDate: m.fullDate,
        calories: m.calCount > 0 ? Math.round(m.totalCalories / m.calCount) : 0,
        weight: m.weightCount > 0 ? Number((m.weightSum / m.weightCount).toFixed(1)) : null,
        goalWeight: m.goalWeight
      }))
    }

    return data
  }, [dailyLogs, timeRange, settingsWeight, settings.weightGoal])

  const tdeeCalc = useMemo(() => {
    const today = new Date()

    // Find earliest weight within 30 days
    const logsInPeriod = Object.values(dailyLogs).filter(log => {
      const date = new Date(log.date)
      return differenceInDays(today, date) <= 30
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
  }, [dailyLogs])

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-24">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Statistics</h1>
        <div className="flex flex-wrap gap-2 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-1">
          {[7, 30, 90, 180, 365, 'all'].map((range) => (
            <button
              key={range}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md ${timeRange === range ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setTimeRange(range as TimeRange)}
            >
              {typeof range === 'number' ? (range >= 30 ? (range === 365 ? '1Y' : `${range/30}M`) : `${range}D`) : 'All'}
            </button>
          ))}
          {settings.weightGoal && (
            <button
              className={`flex-1 px-2 py-1.5 text-xs rounded-md ${timeRange === 'goal' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setTimeRange('goal')}
            >
              Goal
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Log Weight</h2>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            value={currentWeightInput}
            onChange={(e) => setCurrentWeightInput(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Weight in kg"
          />
          <button
            onClick={handleLogWeight}
            className="px-6 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700"
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-72">
        <h2 className="text-lg font-semibold mb-2">Calories Consumed</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" fontSize={12} tickMargin={10} />
            <YAxis fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="calories" stroke="#c084fc" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} name="Calories" />
            <ReferenceLine y={settings.targetCalories} stroke="#e5e7eb" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-72">
        <h2 className="text-lg font-semibold mb-2">Body Weight</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" fontSize={12} tickMargin={10} />
            <YAxis domain={['auto', 'auto']} fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} name="Weight (kg)" />
            {settings.weightGoal && (
              <Line type="monotone" dataKey="goalWeight" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Goal (kg)" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Real Energy Expenditure Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold mb-1">True Maintenance (TDEE)</h2>
        <p className="text-purple-100 text-sm mb-4">Calculated from your logged data</p>

        {tdeeCalc ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{tdeeCalc.tdee}</p>
                <p className="text-purple-200 text-sm">kcal / day</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-white/10 p-3 rounded-xl backdrop-blur-sm">
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
          <div className="bg-white/10 p-4 rounded-xl text-sm">
            <p>We need more data to calculate your true maintenance calories.</p>
            <p className="mt-2 text-purple-200 opacity-80">Log your food and weight consistently for at least 14 days.</p>
          </div>
        )}
      </div>
    </div>
  )
}
