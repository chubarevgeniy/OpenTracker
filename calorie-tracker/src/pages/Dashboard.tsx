import { useState, useEffect, useMemo } from 'react'
import { useAppStore, type MealType, type MealEntry } from '../store'
import { format, addDays, subDays, isToday } from 'date-fns'
import { Plus, Trash2, ChevronLeft, ChevronRight, Scale, Pencil, Check, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const ProgressBar = ({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => {
 const percentage = Math.min(100, Math.round((current / (target || 1)) * 100))
 return (
 <div className="w-full">
 <div className="flex justify-between text-xs mb-1">
 <span className="font-semibold text-text">{label}</span>
 <span className="text-text-muted">{Math.round(current)} / {target}g</span>
 </div>
 <div className="w-full bg-bg-alt rounded-full h-3">
 <div
 className={`h-3 rounded-full ${colorClass}`}
 style={{ width: `${percentage}%` }}
 ></div>
 </div>
 </div>
 )
}

const MealSection = ({ title, mealType, meals, today, removeMealEntry, updateMealEntry }: { title: string, mealType: MealType, meals: MealEntry[], today: string, removeMealEntry: (date: string, mealType: MealType, entryId: string) => void, updateMealEntry: (date: string, mealType: MealType, entryId: string, amount: number) => void }) => {
 const mealCalories = meals.reduce((sum, item) => sum + item.calories, 0)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [editAmount, setEditAmount] = useState<string>('')

 const handleEditClick = (entry: MealEntry) => {
 setEditingId(entry.id)
 setEditAmount(entry.amount.toString())
 }

 const handleSaveEdit = (entryId: string) => {
 const amount = parseFloat(editAmount)
 if (!isNaN(amount) && amount > 0) {
 updateMealEntry(today, mealType, entryId, amount)
 }
 setEditingId(null)
 }

 const handleCancelEdit = () => {
 setEditingId(null)
 }

 return (
 <div className="bg-surface p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent mb-4">
 <div className="flex justify-between items-center mb-4">
 <div>
 <h3 className="font-bold text-xl text-text capitalize">{title}</h3>
 <span className="text-sm text-text-muted font-medium">{Math.round(mealCalories)} kcal</span>
 </div>
 <Link
 to={`/search?meal=${mealType}&date=${today}`}
 className="p-2 bg-text text-surface rounded-2xl hover:opacity-80 transition-opacity shadow-sm"
 aria-label={`Add ${title}`}
 title={`Add ${title}`}
 >
 <Plus size={20} strokeWidth={2.5} />
 </Link>
 </div>

 {meals.length > 0 ? (
 <div className="space-y-3">
 {meals.map((entry) => (
 <div key={entry.id} className="flex justify-between items-center text-sm border-t border-border pt-2">
 {editingId === entry.id ? (
 <div className="flex-1 flex items-center justify-between gap-2">
 <div className="flex-1">
 <p className="font-medium text-text line-clamp-1">{entry.foodItem.name}</p>
 <div className="flex items-center gap-2 mt-1">
 <input
 type="number"
 value={editAmount}
 onChange={(e) => setEditAmount(e.target.value)}
 className="w-20 px-2 py-1 text-sm border border-border rounded bg-surface text-text"
 autoFocus
 />
 <span className="text-text-muted">g</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleSaveEdit(entry.id)}
 className="p-1.5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/60"
 aria-label="Save changes"
 title="Save changes"
 >
 <Check size={16} />
 </button>
 <button
 onClick={handleCancelEdit}
 className="p-1.5 bg-surface-hover text-text-muted text-text-muted rounded-full hover:bg-border"
 aria-label="Cancel editing"
 title="Cancel editing"
 >
 <X size={16} />
 </button>
 </div>
 </div>
 ) : (
 <>
 <div className="flex-1">
 <p className="font-medium text-text">{entry.foodItem.name}</p>
 <p className="text-text-muted text-xs">
 {entry.amount}g • {entry.foodItem.brand || 'Generic'}
 </p>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-semibold text-text">{Math.round(entry.calories)} kcal</span>
 <button
 onClick={() => handleEditClick(entry)}
 className="text-blue-400 hover:text-blue-600 text-blue-500 hover:text-blue-400"
 aria-label={`Edit ${entry.foodItem.name}`}
 title={`Edit ${entry.foodItem.name}`}
 >
 <Pencil size={16} />
 </button>
 <button
 onClick={() => removeMealEntry(today, mealType, entry.id)}
 className="text-red-400 hover:text-red-600"
 aria-label={`Delete ${entry.foodItem.name}`}
 title={`Delete ${entry.foodItem.name}`}
 >
 <Trash2 size={16} />
 </button>
 </div>
 </>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-sm text-text-muted italic">No food logged yet.</p>
 )}
 </div>
 )
}

export default function Dashboard() {
 const [searchParams, setSearchParams] = useSearchParams()
 const dateParam = searchParams.get('date')

 const selectedDateObj = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()
 const selectedDate = format(selectedDateObj, 'yyyy-MM-dd')

 const handleDateChange = (newDate: Date) => {
 setSearchParams({ date: format(newDate, 'yyyy-MM-dd') })
 }

 const settings = useAppStore((state) => state.settings)
 const dailyLogs = useAppStore((state) => state.dailyLogs)
 const removeMealEntry = useAppStore((state) => state.removeMealEntry)
 const updateMealEntry = useAppStore((state) => state.updateMealEntry)
 const logWeight = useAppStore((state) => state.logWeight)

 const log = dailyLogs[selectedDate] || {
 date: selectedDate,
 meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
 }

 // Find latest weight
 let latestWeight = settings.weight;

 if (log.weight) {
 latestWeight = log.weight;
 } else {
    // ⚡ Bolt: Use O(n) linear search to find the most recent weight
    // instead of an expensive O(n log n) Object.keys(dailyLogs).sort().reverse()
    // which previously ran frequently when typing in meal inputs.
    let mostRecentDate = '';
    const dates = Object.keys(dailyLogs);
    for (const date of dates) {
      if (date < selectedDate && date > mostRecentDate && dailyLogs[date].weight) {
        mostRecentDate = date;
 latestWeight = dailyLogs[date].weight;
 }
 }
 }

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

 const totals = useMemo(() => {
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
  }, [log.meals])

 const goToPreviousDay = () => handleDateChange(subDays(selectedDateObj, 1))
 const goToNextDay = () => handleDateChange(addDays(selectedDateObj, 1))

 return (
 <div className="p-4 space-y-6 bg-bg min-h-[100%] pb-8">
 <header className="flex justify-center pt-2">
 <div className="inline-flex items-center gap-3 bg-surface rounded-full shadow-sm px-4 py-2">
 <button onClick={goToPreviousDay} className="p-1 hover:bg-surface-hover rounded-full text-text-muted transition-colors" aria-label="Previous day" title="Previous day">
 <ChevronLeft size={18} strokeWidth={2.5} />
 </button>
 <div className="relative flex items-center justify-center">
 <span className="text-sm font-bold w-[90px] text-center pointer-events-none">
 {isToday(selectedDateObj) ? 'Today' : format(selectedDateObj, 'MMM d, yyyy')}
 </span>
 <input
 type="date"
 value={selectedDate}
 onChange={(e) => {
 if (e.target.value) {
 handleDateChange(new Date(e.target.value + 'T00:00:00'))
 }
 }}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 </div>
 <button onClick={goToNextDay} className="p-1 hover:bg-surface-hover rounded-full text-text-muted transition-colors" aria-label="Next day" title="Next day">
 <ChevronRight size={18} strokeWidth={2.5} />
 </button>
 </div>
 </header>

 {/* Weight Input */}
 <div className="bg-surface p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3">
 <div className="flex items-center gap-2">
 <Scale size={18} className="text-text-muted" strokeWidth={2.5} />
 <span className="font-bold text-text">Today's Weight</span>
 </div>
 <form onSubmit={handleWeightSubmit} className="flex gap-3">
 <div className="flex-1 flex items-center bg-bg rounded-2xl px-4 py-2 border-2 border-transparent focus-within:border-primary transition-colors">
 <input
 type="number"
 step="0.1"
 value={weightInput}
 onChange={(e) => setWeightInput(e.target.value)}
 className="w-full bg-transparent border-none focus:ring-0 p-0 text-text font-bold text-lg"
 placeholder="0.0"
 />
 <span className="text-text-muted font-bold ml-2">kg</span>
 </div>
 <button
 type="submit"
 className="px-6 py-2 bg-primary text-black font-bold rounded-2xl hover:opacity-90 transition-opacity"
 >
 Save
 </button>
 </form>
 </div>

 {/* Summary Card */}
 <div className="bg-surface p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
 <div className="flex items-start gap-6">
 <div className="flex-1 space-y-4">
 <div>
 <h2 className="text-text font-bold text-lg">Calories</h2>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-4xl font-black">{Math.round(totals.calories)}</span>
 <span className="text-text-muted font-medium text-sm">kcal</span>
 </div>
 <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-1">Eaten</p>
 </div>

 <div className="flex gap-6">
 <div>
 <p className="text-lg font-bold">{settings.targetCalories || 0}</p>
 <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Target</p>
 </div>
 <div>
 <p className="text-lg font-bold">{Math.max(0, Math.round(Number(settings.targetCalories) - totals.calories))}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Left</p>
 </div>
 </div>
 </div>

 <div className="flex-1 flex flex-col justify-center space-y-5 py-2">
 <ProgressBar label="Protein"current={totals.protein} target={Number(settings.targetProtein)} colorClass="bg-primary"/>
 <ProgressBar label="Carbs"current={totals.carbs} target={Number(settings.targetCarbs)} colorClass="bg-orange-400"/>
 <ProgressBar label="Fat"current={totals.fat} target={Number(settings.targetFat)} colorClass="bg-pink-400"/>
 </div>
 </div>
 </div>

 {/* Meals List */}
 <div className="space-y-4">
 <MealSection title="Breakfast"mealType="breakfast"meals={log.meals.breakfast} today={selectedDate} removeMealEntry={removeMealEntry} updateMealEntry={updateMealEntry} />
 <MealSection title="Lunch"mealType="lunch"meals={log.meals.lunch} today={selectedDate} removeMealEntry={removeMealEntry} updateMealEntry={updateMealEntry} />
 <MealSection title="Dinner"mealType="dinner"meals={log.meals.dinner} today={selectedDate} removeMealEntry={removeMealEntry} updateMealEntry={updateMealEntry} />
 <MealSection title="Snacks"mealType="snack"meals={log.meals.snack} today={selectedDate} removeMealEntry={removeMealEntry} updateMealEntry={updateMealEntry} />
 </div>
 </div>
 )
}
