import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Camera, X } from 'lucide-react'
import { searchProducts, getProductByBarcode } from '../services/api'
import { useAppStore, type FoodItem, type MealType } from '../store'
import Scanner from '../components/Scanner'
import MealEntryForm from '../components/MealEntry'

type Tab = 'search' | 'recent' | 'frequent' | 'custom'

export default function Search() {
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })

  const handleCustomFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customFood.name || !customFood.calories) return

    const newFood: FoodItem = {
      id: crypto.randomUUID(),
      name: customFood.name,
      brand: 'Custom',
      calories: Number(customFood.calories),
      protein: Number(customFood.protein || 0),
      carbs: Number(customFood.carbs || 0),
      fat: Number(customFood.fat || 0),
    }

    setSelectedFood(newFood)
  }
  const [searchParams] = useSearchParams()
  const defaultMeal = (searchParams.get('meal') as MealType) || 'snack'
  const defaultDate = searchParams.get('date') || undefined

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [showScanner, setShowScanner] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)

  const searchHistory = useAppStore((state) => state.searchHistory)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    const items = await searchProducts(query)
    setResults(items)
    setLoading(false)
  }

  const handleScan = async (barcode: string) => {
    setShowScanner(false)
    setLoading(true)
    const item = await getProductByBarcode(barcode)
    if (item) {
      setSelectedFood(item)
    } else {
      alert('Product not found')
    }
    setLoading(false)
  }

  const recentItems = Object.values(searchHistory)
    .sort((a, b) => b.lastSearched - a.lastSearched)
    .map((item) => item.foodItem)
    .slice(0, 20)

  const frequentItems = Object.values(searchHistory)
    .sort((a, b) => b.count - a.count)
    .map((item) => item.foodItem)
    .slice(0, 20)

  // Use an effect to focus search input if not showing scanner or entry
  useEffect(() => {
    // optional auto focus
  }, [])

  const displayList = activeTab === 'search' ? results : activeTab === 'recent' ? recentItems : frequentItems

  if (selectedFood) {
    return (
      <div className="p-4 bg-bg h-full overflow-y-auto">
        <button
          onClick={() => setSelectedFood(null)}
          className="mb-4 text-text-muted hover:text-text flex items-center text-sm"
        >
          <X size={16} className="mr-1" /> Back to search
        </button>
        <MealEntryForm
          foodItem={selectedFood}
          defaultMealType={defaultMeal}
          defaultDate={defaultDate}
          onSuccess={() => setSelectedFood(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="p-4 bg-surface shadow-sm z-10 sticky top-0">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search food..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-hover text-text border-transparent rounded-xl focus:border-purple-500 focus:bg-surface focus:ring-0"
            />
            <SearchIcon className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className="p-2 bg-surface-hover text-text-muted rounded-xl hover:bg-border"
          >
            <Camera size={24} />
          </button>
        </form>

        <div className="flex gap-4 border-b">
          <button
            className={`pb-2 text-sm font-medium ${activeTab === 'search' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-text-muted hover:text-text'}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            className={`pb-2 text-sm font-medium ${activeTab === 'recent' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-text-muted'}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent
          </button>
          <button
            className={`pb-2 text-sm font-medium ${activeTab === 'frequent' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-text-muted'}`}
            onClick={() => setActiveTab('frequent')}
          >
            Frequent
          </button>
          <button
            className={`pb-2 text-sm font-medium ${activeTab === 'custom' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-text-muted'}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {showScanner && (
          <div className="mb-6">
            <Scanner onScan={handleScan} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-text-muted">Searching...</div>
        ) : (
          <div className="space-y-3">
            {displayList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedFood(item)}
                className="w-full text-left bg-surface p-3 rounded-xl shadow-sm border border-border flex items-center gap-4 hover:border-purple-200 transition-colors"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-surface-hover rounded-lg flex items-center justify-center text-gray-400">
                    <SearchIcon size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">{item.name}</p>
                  <p className="text-xs text-text-muted truncate">{item.brand || 'Generic'} • {Math.round(item.calories)} kcal / 100g</p>
                </div>
              </button>
            ))}
            {displayList.length === 0 && !loading && activeTab === 'search' && query && (
              <p className="text-center text-text-muted py-8">No results found for "{query}"</p>
            )}
            {displayList.length === 0 && activeTab !== 'search' && (
              <p className="text-center text-text-muted py-8">No history yet.</p>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <form onSubmit={handleCustomFoodSubmit} className="space-y-4 bg-surface p-4 rounded-xl shadow-sm">
            <div>
              <label className="block text-sm font-medium text-text">Food Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-border shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                value={customFood.name}
                onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                placeholder="e.g. Homemade Sandwich"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Calories (per 100g or 1 serving)</label>
              <input
                type="number"
                required
                className="mt-1 block w-full rounded-md border-border shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                value={customFood.calories}
                onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text">Protein (g)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-border shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  value={customFood.protein}
                  onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">Carbs (g)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-border shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  value={customFood.carbs}
                  onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">Fat (g)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-border shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  value={customFood.fat}
                  onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
            >
              Add Custom Food
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
