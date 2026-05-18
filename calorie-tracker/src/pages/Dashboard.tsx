import { useAppStore, type MealType, type MealEntry } from '../store'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const ProgressBar = ({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => {
  const percentage = Math.min(100, Math.round((current / (target || 1)) * 100))
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{Math.round(current)} / {target}g</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
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
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="text-sm text-gray-500">{Math.round(mealCalories)} kcal</span>
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
                <p className="font-medium">{entry.foodItem.name}</p>
                <p className="text-gray-500 text-xs">
                  {entry.amount}g • {entry.foodItem.brand || 'Generic'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{Math.round(entry.calories)} kcal</span>
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
  const today = format(new Date(), 'yyyy-MM-dd')
  const settings = useAppStore((state) => state.settings)
  const dailyLogs = useAppStore((state) => state.dailyLogs)
  const removeMealEntry = useAppStore((state) => state.removeMealEntry)

  const log = dailyLogs[today] || {
    date: today,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
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

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-24">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Today</h1>
        <span className="text-gray-500 font-medium">{format(new Date(), 'MMM d, yyyy')}</span>
      </header>

      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Simple circular progress visualization using conic-gradient */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#aa3bff ${(totals.calories / settings.targetCalories) * 360}deg, #f3f4f6 0deg)`
              }}
            ></div>
            <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{Math.round(settings.targetCalories - totals.calories)}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Remaining</span>
            </div>
          </div>
          <div className="flex justify-between w-full mt-4 text-center px-4">
            <div>
              <p className="text-gray-500 text-xs">Consumed</p>
              <p className="font-semibold">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Target</p>
              <p className="font-semibold">{settings.targetCalories}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <ProgressBar label="Carbs" current={totals.carbs} target={settings.targetCarbs} colorClass="bg-blue-400" />
          <ProgressBar label="Protein" current={totals.protein} target={settings.targetProtein} colorClass="bg-red-400" />
          <ProgressBar label="Fat" current={totals.fat} target={settings.targetFat} colorClass="bg-yellow-400" />
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <MealSection title="Breakfast" mealType="breakfast" meals={log.meals.breakfast} today={today} removeMealEntry={removeMealEntry} />
        <MealSection title="Lunch" mealType="lunch" meals={log.meals.lunch} today={today} removeMealEntry={removeMealEntry} />
        <MealSection title="Dinner" mealType="dinner" meals={log.meals.dinner} today={today} removeMealEntry={removeMealEntry} />
        <MealSection title="Snacks" mealType="snack" meals={log.meals.snack} today={today} removeMealEntry={removeMealEntry} />
      </div>
    </div>
  )
}
