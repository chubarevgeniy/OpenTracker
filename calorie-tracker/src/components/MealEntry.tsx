import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore, type FoodItem, type MealType } from '../store'

interface MealEntryFormProps {
 foodItem: FoodItem
 defaultMealType: MealType
 defaultDate?: string
 onSuccess: () => void
}

export default function MealEntryForm({ foodItem, defaultMealType, defaultDate, onSuccess }: MealEntryFormProps) {
 const navigate = useNavigate()
 const [amount, setAmount] = useState<number | ''>(100)
 const [mealType, setMealType] = useState<MealType>(defaultMealType)

 const addMealEntry = useAppStore((state) => state.addMealEntry)
 const addSearchHistory = useAppStore((state) => state.addSearchHistory)

 const handleAdd = () => {
 if (!amount || amount <= 0) return

 const factor = amount / 100
 const entry = {
 id: crypto.randomUUID(),
 foodItem,
 amount,
 calories: foodItem.calories * factor,
 protein: foodItem.protein * factor,
 carbs: foodItem.carbs * factor,
 fat: foodItem.fat * factor,
 timestamp: Date.now()
 }

 const today = defaultDate || format(new Date(), 'yyyy-MM-dd')

 addMealEntry(today, mealType, entry)
 addSearchHistory(foodItem)

 onSuccess()
 navigate(`/?date=${today}`)
 }

 const factor = (amount || 0) / 100

 return (
 <div className="bg-surface rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
 <div className="flex gap-4 items-start mb-6 pb-6 border-b border-border">
 {foodItem.image_url ? (
 <img src={foodItem.image_url} alt={foodItem.name} className="w-24 h-24 object-cover rounded-2xl shadow-sm"/>
 ) : (
 <div className="w-24 h-24 bg-bg-alt rounded-2xl flex items-center justify-center">
 <span className="text-text-muted text-xs font-bold">No image</span>
 </div>
 )}
 <div className="flex-1 py-1">
 <h2 className="text-2xl font-black leading-tight text-text tracking-tight">{foodItem.name}</h2>
 {foodItem.brand && <p className="text-text-muted text-sm mt-1 font-bold">{foodItem.brand}</p>}
 </div>
 </div>

 <div className="space-y-5">
 <div>
 <label className="block text-sm font-bold text-text mb-2">Amount (grams or ml)</label>
 <div className="relative">
 <input
 type="number"
 min="1"
 value={amount}
 onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
 className="w-full p-4 bg-bg border-2 border-transparent rounded-2xl focus:ring-0 focus:border-primary text-xl font-black transition-colors"
 />
 <span className="absolute right-5 top-4.5 text-text-muted font-bold text-lg">g</span>
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-text mb-2">Meal</label>
 <div className="relative">
 <select
 value={mealType}
 onChange={(e) => setMealType(e.target.value as MealType)}
 className="w-full p-4 bg-bg border-2 border-transparent rounded-2xl focus:ring-0 focus:border-primary text-text font-bold text-lg appearance-none transition-colors"
 >
 <option value="breakfast">Breakfast</option>
 <option value="lunch">Lunch</option>
 <option value="dinner">Dinner</option>
 <option value="snack">Snack</option>
 </select>
 <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center">
 <svg className="h-5 w-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <h3 className="text-xs font-black text-text-muted mb-4 uppercase tracking-widest text-center">Nutrition Summary</h3>
 <div className="grid grid-cols-4 gap-3 text-center">
 <div className="bg-text text-surface p-3 rounded-2xl shadow-sm flex flex-col justify-center min-h-[90px]">
 <div className="text-2xl font-black leading-none">{Math.round(foodItem.calories * factor)}</div>
 <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">kcal</div>
 </div>
 <div className="bg-[#EBF8FF] dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-300 flex flex-col justify-center min-h-[90px]">
 <div className="text-2xl font-black leading-none">{Math.round(foodItem.carbs * factor)}</div>
 <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Carbs</div>
 </div>
 <div className="bg-[#FFF5F5] dark:bg-red-900/30 p-3 rounded-2xl text-red-500 dark:text-red-300 flex flex-col justify-center min-h-[90px]">
 <div className="text-2xl font-black leading-none">{Math.round(foodItem.protein * factor)}</div>
 <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Protein</div>
 </div>
 <div className="bg-[#FFFFF0] dark:bg-yellow-900/30 p-3 rounded-2xl text-yellow-600 dark:text-yellow-300 flex flex-col justify-center min-h-[90px]">
 <div className="text-2xl font-black leading-none">{Math.round(foodItem.fat * factor)}</div>
 <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Fat</div>
 </div>
 </div>
 </div>

 <button
 onClick={handleAdd}
 disabled={!amount || amount <= 0}
 className="w-full mt-8 bg-primary text-black font-black text-lg py-5 rounded-2xl shadow-[0_4px_14px_rgba(197,248,42,0.4)] hover:opacity-90 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
 >
 Add to Diary
 </button>
 </div>
 )
}
