import { useState, useEffect } from 'react'
import { useAppStore, type MealType, type MealEntry } from '../store'
import { format, addDays, subDays, isToday } from 'date-fns'
import { Plus, Trash2, ChevronLeft, ChevronRight, Scale, Pencil, Check, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const ProgressBar = ({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => {
 const percentage = Math.min(100, Math.round((current / (target || 1)) * 100))
 return (
 <div className="flex-1">
 <div className="flex justify-between text-xs mb-1">
 <span className="font-medium text-text">{label}</span>
 <span className="text-text-muted">{Math.round(current)} / {target}g</span>
 </div>
 <div className="w-full bg-border rounded-full h-2">
 <div
 className={`h-2 rounded-full ${colorClass}`}
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
 <div className="bg-surface p-4 rounded-xl shadow-sm border border-border mb-4">
 <div className="flex justify-between items-center mb-3">
 <div>
 <h3 className="font-semibold text-lg text-text">{title}</h3>
 <span className="text-sm text-text-muted">{Math.round(mealCalories)} kcal</span>
 </div>
 <Link
 to={`/search?meal=${mealType}&date=${today}`}
 className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40"
 >
 <Plus size={20} />
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
 >
 <Check size={16} />
 </button>
 <button
 onClick={handleCancelEdit}
 className="p-1.5 bg-surface-hover text-text-muted text-text-muted rounded-full hover:bg-border"
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
 >
 <Pencil size={16} />
 </button>
 <button
 onClick={() => removeMealEntry(today, mealType, entry.id)}
 className="text-red-400 hover:text-red-600"
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
 // Find the most recent weight before selectedDate
 const sortedDates = Object.keys(dailyLogs).sort().reverse()
 for (const date of sortedDates) {
 if (date < selectedDate && dailyLogs[date].weight) {
 latestWeight = dailyLogs[date].weight;
 break;
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

 const goToPreviousDay = () => handleDateChange(subDays(selectedDateObj, 1))
 const goToNextDay = () => handleDateChange(addDays(selectedDateObj, 1))

 return (
 <div className="p-4 space-y-6 bg-bg min-h-[100%] pb-8">
 <header className="flex flex-col gap-4">
 <div className="flex justify-between items-center">
 <h1 className="text-2xl font-bold">
 {isToday(selectedDateObj) ? 'Today' : format(selectedDateObj, 'MMM d, yyyy')}
 </h1>
 <div className="flex items-center gap-2 bg-surface rounded-xl shadow-sm border border-border p-1">
 <button onClick={goToPreviousDay} className="p-1.5 hover:bg-surface-hover rounded-lg text-text-muted">
 <ChevronLeft size={20} />
 </button>
 <input
 type="date"
 value={selectedDate}
 onChange={(e) => {
 if (e.target.value) {
 handleDateChange(new Date(e.target.value + 'T00:00:00'))
 }
 }}
 className="bg-transparent border-none text-sm font-medium text-text focus:ring-0 cursor-pointer p-0 w-[110px]"
 />
 <button onClick={goToNextDay} className="p-1.5 hover:bg-surface-hover rounded-lg text-text-muted">
 <ChevronRight size={20} />
 </button>
 </div>
 </div>
 </header>

 {/* Weight Input */}
 <div className="bg-surface p-4 rounded-xl shadow-sm border border-border flex items-center gap-4">
 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
 <Scale size={20} />
 </div>
 <form onSubmit={handleWeightSubmit} className="flex-1 flex gap-2">
 <div className="flex-1 flex items-center border border-border rounded-lg px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-bg">
 <input
 type="number"
 step="0.1"
 value={weightInput}
 onChange={(e) => setWeightInput(e.target.value)}
 className="w-full bg-transparent border-none focus:ring-0 p-2 text-text"
 placeholder="Weight"
 />
 <span className="text-text-muted text-sm font-medium">kg</span>
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
 <div className="bg-surface p-5 rounded-2xl shadow-sm border border-border">
 <div className="flex flex-col items-center mb-6">
 <div className="relative w-32 h-32 flex items-center justify-center">
 {/* Simple circular progress visualization using conic-gradient */}
 <div
 className="absolute inset-0 rounded-full"
 style={{
 background: `conic-gradient(#aa3bff ${(totals.calories / Number(settings.targetCalories || 1)) * 360}deg, #f3f4f6 0deg)`
 }}
 ></div>
 <div className="absolute inset-2 bg-surface rounded-full flex flex-col items-center justify-center">
 <span className="text-2xl font-bold">{Math.round(Number(settings.targetCalories) - totals.calories)}</span>
 <span className="text-xs text-text-muted uppercase tracking-wider">Remaining</span>
 </div>
 </div>
 <div className="flex justify-between w-full mt-4 text-center px-4">
 <div>
 <p className="text-text-muted text-xs">Consumed</p>
 <p className="font-semibold">{Math.round(totals.calories)}</p>
 </div>
 <div>
 <p className="text-text-muted text-xs">Target</p>
 <p className="font-semibold">{settings.targetCalories || 0}</p>
 </div>
 </div>
 </div>

 <div className="flex gap-4">
 <ProgressBar label="Carbs"current={totals.carbs} target={Number(settings.targetCarbs)} colorClass="bg-blue-400"/>
 <ProgressBar label="Protein"current={totals.protein} target={Number(settings.targetProtein)} colorClass="bg-red-400"/>
 <ProgressBar label="Fat"current={totals.fat} target={Number(settings.targetFat)} colorClass="bg-yellow-400"/>
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
