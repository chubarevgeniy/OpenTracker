import { useState, useMemo, useEffect } from 'react'
import { useAppStore, type MealType, type MealEntry } from '../store'
import { format, addDays, subDays, isToday } from 'date-fns'
import { Plus, Trash2, ChevronLeft, ChevronRight, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

const ProgressBar = ({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => {
  const percentage = Math.min(100, Math.round((current / (target || 1)) * 100))
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{Math.round(current)} / {target}g</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

const MealSection = ({ title, mealType, meals, today, removeMealEntry }: { title: string, mealType: MealType, meals: MealEntry[], today: string, removeMealEntry: (date: string, mealType: MealType, entryId: string) => void }) => {
  const mealCalories = meals.reduce((sum, item) => sum + item.calories, 0)

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(mealCalories)} kcal</span>
        </div>
        <Link
          to={`/search?meal=${mealType}`}
          className="p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100"
        >
          <Plus size={20} />
        </Link>
      </div>

      {meals.length > 0 ? (
        <div className="space-y-3">
          {meals.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center text-sm border-t border-gray-50 pt-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{entry.foodItem.name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {entry.amount}g • {entry.foodItem.brand || 'Generic'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.round(entry.calories)} kcal</span>
                <button
                  onClick={() => removeMealEntry(today, mealType, entry.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No food logged yet.</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [selectedDateObj, setSelectedDateObj] = useState(new Date())
  const selectedDate = format(selectedDateObj, 'yyyy-MM-dd')

  const settings = useAppStore((state) => state.settings)
  const dailyLogs = useAppStore((state) => state.dailyLogs)
  const removeMealEntry = useAppStore((state) => state.removeMealEntry)
  const logWeight = useAppStore((state) => state.logWeight)

  const log = dailyLogs[selectedDate] || {
    date: selectedDate,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
  }

  // Find latest weight
  const latestWeight = useMemo(() => {
    if (log.weight) return log.weight

    // Find the most recent weight before selectedDate
    const sortedDates = Object.keys(dailyLogs).sort().reverse()
    for (const date of sortedDates) {
      if (date < selectedDate && dailyLogs[date].weight) {
        return dailyLogs[date].weight
      }
    }

    return settings.weight
  }, [log.weight, dailyLogs, selectedDate, settings.weight])

  const [weightInput, setWeightInput] = useState(latestWeight.toString())

  useEffect(() => {
    // Synchronize local input state with latest weight calculation changes
    const timer = setTimeout(() => {
      setWeightInput(latestWeight.toString())
    }, 0)
    return () => clearTimeout(timer)
  }, [latestWeight, selectedDate])

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const w = parseFloat(weightInput)
    if (!isNaN(w) && w > 0) {
      logWeight(selectedDate, w)
    }
  }

  const calculateTotals = () => {
    let calories = 0, protein = 0, carbs = 0, fat = 0

    Object.values(log.meals).forEach(mealArray => {
      mealArray.forEach(entry => {
        calories += entry.calories
        protein += entry.protein
        carbs += entry.carbs
        fat += entry.fat
      })
    })

    return { calories, protein, carbs, fat }
  }

  const totals = calculateTotals()

  const goToPreviousDay = () => setSelectedDateObj(prev => subDays(prev, 1))
  const goToNextDay = () => setSelectedDateObj(prev => addDays(prev, 1))

  return (
    <div className="p-4 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen pb-24">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isToday(selectedDateObj) ? 'Today' : format(selectedDateObj, 'MMM d, yyyy')}
          </h1>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-1">
            <button onClick={goToPreviousDay} className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
              <ChevronLeft size={20} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateObj(new Date(e.target.value + 'T00:00:00'))
                }
              }}
              className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer p-0 w-[110px]"
            />
            <button onClick={goToNextDay} className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Weight Input */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
          <Scale size={20} />
        </div>
        <form onSubmit={handleWeightSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 flex items-center border border-gray-200 dark:border-gray-700 rounded-lg px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-gray-50 dark:bg-gray-900">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 p-2 text-gray-900 dark:text-gray-100"
              placeholder="Weight"
            />
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">kg</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </form>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Simple circular progress visualization using conic-gradient */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#aa3bff ${(totals.calories / Number(settings.targetCalories || 1)) * 360}deg, #f3f4f6 0deg)`
              }}
            ></div>
            <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{Math.round(Number(settings.targetCalories) - totals.calories)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remaining</span>
            </div>
          </div>
          <div className="flex justify-between w-full mt-4 text-center px-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Consumed</p>
              <p className="font-semibold">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Target</p>
              <p className="font-semibold">{settings.targetCalories || 0}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <ProgressBar label="Carbs" current={totals.carbs} target={Number(settings.targetCarbs)} colorClass="bg-blue-400" />
          <ProgressBar label="Protein" current={totals.protein} target={Number(settings.targetProtein)} colorClass="bg-red-400" />
          <ProgressBar label="Fat" current={totals.fat} target={Number(settings.targetFat)} colorClass="bg-yellow-400" />
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <MealSection title="Breakfast" mealType="breakfast" meals={log.meals.breakfast} today={selectedDate} removeMealEntry={removeMealEntry} />
        <MealSection title="Lunch" mealType="lunch" meals={log.meals.lunch} today={selectedDate} removeMealEntry={removeMealEntry} />
        <MealSection title="Dinner" mealType="dinner" meals={log.meals.dinner} today={selectedDate} removeMealEntry={removeMealEntry} />
        <MealSection title="Snacks" mealType="snack" meals={log.meals.snack} today={selectedDate} removeMealEntry={removeMealEntry} />
      </div>
    </div>
  )
}
