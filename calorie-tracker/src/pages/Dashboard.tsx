import { useState, useEffect, useMemo, memo } from 'react'
import { useAppStore, type MealType, type MealEntry } from '../store'
import { format, addDays, subDays, isToday } from 'date-fns'
import { Plus, Trash2, ChevronLeft, ChevronRight, Scale, Pencil, Check, X, Copy } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const MEAL_OPTIONS: { value: MealType, label: string }[] = [
 { value: 'breakfast', label: 'Breakfast' },
 { value: 'lunch', label: 'Lunch' },
 { value: 'dinner', label: 'Dinner' },
 { value: 'snack', label: 'Snack' },
]

// Circular progress ring around the day's calorie count.
const CalorieRing = memo(({ eaten, target }: { eaten: number, target: number }) => {
 const radius = 56
 const stroke = 9
 const normalizedRadius = radius - stroke / 2
 const circumference = 2 * Math.PI * normalizedRadius
 const pct = target > 0 ? Math.min(1, eaten / target) : 0
 const offset = circumference * (1 - pct)
 const over = target > 0 && eaten > target
 return (
 <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
 <svg height={radius * 2} width={radius * 2} className="-rotate-90">
 <circle
 className="text-bg-alt"
 stroke="currentColor"
 fill="transparent"
 strokeWidth={stroke}
 r={normalizedRadius}
 cx={radius}
 cy={radius}
 />
 <circle
 className={over ? 'text-red-400' : 'text-primary'}
 stroke="currentColor"
 fill="transparent"
 strokeWidth={stroke}
 strokeLinecap="round"
 r={normalizedRadius}
 cx={radius}
 cy={radius}
 style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
 />
 </svg>
 <div className="absolute flex flex-col items-center leading-none">
 <span className="text-3xl font-black">{Math.round(eaten)}</span>
 <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-1">
 / {target || 0}
 </span>
 </div>
 </div>
 )
})

const ProgressBar = memo(({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => {
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
})

const MealSection = memo(({ title, mealType, meals, today, removeMealEntry, updateMealEntry }: { title: string, mealType: MealType, meals: MealEntry[], today: string, removeMealEntry: (date: string, mealType: MealType, entryId: string) => void, updateMealEntry: (date: string, mealType: MealType, entryId: string, amount: number) => void }) => {
 // ⚡ Bolt: Merge multiple reduce passes into a single O(N) loop and memoize to prevent recalculations on local UI state updates
 const { mealCalories, mealProtein, mealCarbs, mealFat } = useMemo(() => {
   let cals = 0, pro = 0, car = 0, fat = 0;
   for (let i = 0; i < meals.length; i++) {
     cals += meals[i].calories;
     pro += meals[i].protein;
     car += meals[i].carbs;
     fat += meals[i].fat;
   }
   return { mealCalories: cals, mealProtein: pro, mealCarbs: car, mealFat: fat };
 }, [meals]);
 const [editingId, setEditingId] = useState<string | null>(null)
 const [editAmount, setEditAmount] = useState<string>('')
 const [isExpanded, setIsExpanded] = useState(false)
 const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

 const copyEntries = useAppStore((state) => state.copyEntries)
 const [showCopy, setShowCopy] = useState(false)
 // Copy target defaults to the current (real) day; meal type defaults to same.
 const [copyDate, setCopyDate] = useState(format(new Date(), 'yyyy-MM-dd'))
 const [copyMealType, setCopyMealType] = useState<MealType>(mealType)
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

 const openCopy = () => {
 setCopyDate(format(new Date(), 'yyyy-MM-dd'))
 setCopyMealType(mealType)
 setSelectedIds(new Set(meals.map((m) => m.id)))
 setShowCopy(true)
 }

 const toggleSelected = (id: string) => {
 setSelectedIds((prev) => {
 const next = new Set(prev)
 if (next.has(id)) next.delete(id)
 else next.add(id)
 return next
 })
 }

 const handleCopyConfirm = () => {
 const toCopy = meals.filter((m) => selectedIds.has(m.id))
 if (toCopy.length === 0) return
 copyEntries(copyDate, copyMealType, toCopy)
 setShowCopy(false)
 }

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
 <div
   className="cursor-pointer select-none"
   onClick={() => setIsExpanded(!isExpanded)}
   title={`Toggle ${title} macros`}
 >
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-xl text-text capitalize">{title}</h3>
 <span className="text-text-muted text-xs bg-bg rounded-full px-2 py-0.5">{meals.length} items</span>
 </div>
 <span className="text-sm text-text-muted font-medium">{Math.round(mealCalories)} kcal</span>
 </div>
 <div className="flex items-center gap-2">
 {meals.length > 0 && (
 <button
 onClick={openCopy}
 className="p-2 bg-bg text-text-muted rounded-2xl hover:text-text hover:bg-bg-alt transition-colors shadow-sm"
 aria-label={`Copy ${title}`}
 title={`Copy ${title} to another day`}
 >
 <Copy size={18} strokeWidth={2.5} />
 </button>
 )}
 <Link
 to={`/search?meal=${mealType}&date=${today}`}
 className="p-2 bg-text text-surface rounded-2xl hover:opacity-80 transition-opacity shadow-sm"
 aria-label={`Add ${title}`}
 title={`Add ${title}`}
 >
 <Plus size={20} strokeWidth={2.5} />
 </Link>
 </div>
 </div>

 {isExpanded && meals.length > 0 && (
 <div className="flex gap-4 mb-4 text-xs font-semibold text-text-muted">
 <span>Protein: {Math.round(mealProtein)}g</span>
 <span>Carbs: {Math.round(mealCarbs)}g</span>
 <span>Fat: {Math.round(mealFat)}g</span>
 </div>
 )}

 {meals.length > 0 ? (
 <div className="space-y-3">
 {meals.map((entry) => (
 <div key={entry.id} className="flex flex-col text-sm border-t border-border pt-2">
 <div className="flex justify-between items-center">
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
 <div
   className="flex-1 cursor-pointer select-none"
   onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
 >
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
 {expandedEntryId === entry.id && editingId !== entry.id && (
 <div className="flex gap-4 mt-2 text-xs font-medium text-text-muted bg-bg rounded-xl p-2 px-3">
 <span>P: {Math.round(entry.protein)}g</span>
 <span>C: {Math.round(entry.carbs)}g</span>
 <span>F: {Math.round(entry.fat)}g</span>
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-sm text-text-muted italic">No food logged yet.</p>
 )}

 {showCopy && (
 <div
 className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-4"
 onClick={() => setShowCopy(false)}
 >
 <div
 className="bg-surface w-full max-w-md rounded-3xl p-5 shadow-xl max-h-[85vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-lg text-text">Copy {title}</h3>
 <button
 onClick={() => setShowCopy(false)}
 className="p-1.5 text-text-muted hover:text-text rounded-full"
 aria-label="Close"
 title="Close"
 >
 <X size={18} />
 </button>
 </div>

 <div className="space-y-3 mb-4">
 <div>
 <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">To day</label>
 <input
 type="date"
 value={copyDate}
 onChange={(e) => e.target.value && setCopyDate(e.target.value)}
 className="w-full p-3 bg-bg border-2 border-transparent rounded-2xl focus:ring-0 focus:border-primary text-text font-bold"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">To meal</label>
 <select
 value={copyMealType}
 onChange={(e) => setCopyMealType(e.target.value as MealType)}
 className="w-full p-3 bg-bg border-2 border-transparent rounded-2xl focus:ring-0 focus:border-primary text-text font-bold appearance-none"
 >
 {MEAL_OPTIONS.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 </div>
 </div>

 <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Items</p>
 <div className="space-y-2 mb-5">
 {meals.map((entry) => (
 <label
 key={entry.id}
 className="flex items-center gap-3 bg-bg rounded-2xl p-3 cursor-pointer"
 >
 <input
 type="checkbox"
 checked={selectedIds.has(entry.id)}
 onChange={() => toggleSelected(entry.id)}
 className="w-5 h-5 rounded accent-primary"
 />
 <div className="flex-1 min-w-0">
 <p className="font-medium text-text text-sm truncate">{entry.foodItem.name}</p>
 <p className="text-text-muted text-xs">{entry.amount}g • {Math.round(entry.calories)} kcal</p>
 </div>
 </label>
 ))}
 </div>

 <button
 onClick={handleCopyConfirm}
 disabled={selectedIds.size === 0}
 className="w-full py-4 bg-primary text-black font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
 >
 Copy {selectedIds.size > 0 ? `${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}` : ''}
 </button>
 </div>
 </div>
 )}
 </div>
 )
})

// ⚡ Bolt: Define default meals outside component to preserve referential equality for React.memo
const DEFAULT_MEALS = { breakfast: [], lunch: [], dinner: [], snack: [] }

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
    meals: DEFAULT_MEALS,
 }

 // Find latest weight
 let latestWeight = settings.weight;

 const memoizedLatestWeight = useMemo(() => {
 if (log.weight) return log.weight;
 let mostRecentDate = "";
 let w = settings.weight;
 for (const date in dailyLogs) {
 if (date < selectedDate && dailyLogs[date].weight && date > mostRecentDate) {
 mostRecentDate = date;
 w = dailyLogs[date].weight;
 }
 }
 return w;
 }, [log.weight, dailyLogs, selectedDate, settings.weight]);

 latestWeight = memoizedLatestWeight;

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
    // ⚡ Bolt: Replace Object.values() with for...in to prevent array allocation overhead
    for (const mealKey in log.meals) {
      const mealArray = log.meals[mealKey as keyof typeof log.meals];
      for (let i = 0; i < mealArray.length; i++) {
        const entry = mealArray[i];
        calories += entry.calories
        protein += entry.protein
        carbs += entry.carbs
        fat += entry.fat
      }
    }
    return { calories, protein, carbs, fat }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
 <div className="flex items-center gap-6">
 <div className="flex flex-col items-center gap-3">
 <CalorieRing eaten={totals.calories} target={Number(settings.targetCalories) || 0} />
 <div className="flex gap-5 text-center">
 <div>
 <p className="text-sm font-bold">{settings.targetCalories || 0}</p>
 <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Target</p>
 </div>
 <div>
 <p className="text-sm font-bold">{Math.max(0, Math.round(Number(settings.targetCalories) - totals.calories))}</p>
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
