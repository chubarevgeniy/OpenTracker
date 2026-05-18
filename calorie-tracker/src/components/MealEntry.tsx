import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore, type FoodItem, type MealType } from '../store'

interface MealEntryFormProps {
  foodItem: FoodItem
  defaultMealType: MealType
  onSuccess: () => void
}

export default function MealEntryForm({ foodItem, defaultMealType, onSuccess }: MealEntryFormProps) {
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

    const today = format(new Date(), 'yyyy-MM-dd')

    addMealEntry(today, mealType, entry)
    addSearchHistory(foodItem)

    onSuccess()
    navigate('/')
  }

  const factor = (amount || 0) / 100

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex gap-4 items-start mb-6">
        {foodItem.image_url ? (
          <img src={foodItem.image_url} alt={foodItem.name} className="w-20 h-20 object-cover rounded-xl" />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold leading-tight">{foodItem.name}</h2>
          {foodItem.brand && <p className="text-gray-500 text-sm mt-1">{foodItem.brand}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (grams or ml)</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
            />
            <span className="absolute right-4 top-3.5 text-gray-400">g</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Nutrition Info</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{Math.round(foodItem.calories * factor)}</div>
            <div className="text-xs text-gray-500">kcal</div>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg text-blue-900">
            <div className="text-lg font-bold">{Math.round(foodItem.carbs * factor)}</div>
            <div className="text-xs opacity-70">Carbs</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg text-red-900">
            <div className="text-lg font-bold">{Math.round(foodItem.protein * factor)}</div>
            <div className="text-xs opacity-70">Protein</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg text-yellow-900">
            <div className="text-lg font-bold">{Math.round(foodItem.fat * factor)}</div>
            <div className="text-xs opacity-70">Fat</div>
          </div>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!amount || amount <= 0}
        className="w-full mt-8 bg-purple-600 text-white font-semibold py-4 rounded-xl shadow-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Add to Log
      </button>
    </div>
  )
}
