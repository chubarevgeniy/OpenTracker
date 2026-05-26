import { useState, useEffect, useMemo } from 'react'
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

 // ⚡ Bolt: Memoized search history sorts to prevent expensive O(N log N)
 // array sorting on every keystroke when typing in the search input
 const recentItems = useMemo(() => {
   return Object.values(searchHistory)
     .sort((a, b) => b.lastSearched - a.lastSearched)
     .map((item) => item.foodItem)
     .slice(0, 20)
 }, [searchHistory])

 const frequentItems = useMemo(() => {
   return Object.values(searchHistory)
     .sort((a, b) => b.count - a.count)
     .map((item) => item.foodItem)
     .slice(0, 20)
 }, [searchHistory])

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
 <X size={16} className="mr-1"/> Back to search
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
 <div className="flex flex-col h-full bg-bg pb-24">
 <div className="p-4 bg-bg z-10 sticky top-0">
 <form onSubmit={handleSearch} className="flex gap-3 mb-6">
 <div className="relative flex-1">
 <input
 type="text"
 placeholder="Search food..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="w-full pl-12 pr-4 py-3 bg-surface text-text font-medium border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl focus:border-primary focus:ring-0"
 />
 <SearchIcon className="absolute left-4 top-3.5 text-text-muted"size={20} strokeWidth={2.5} />
 </div>
 <button
 type="button"
 onClick={() => setShowScanner(!showScanner)}
 className="px-4 py-3 bg-text text-surface rounded-2xl shadow-sm hover:opacity-80 transition-opacity"
          aria-label={showScanner ? "Close barcode scanner" : "Open barcode scanner"}
          title={showScanner ? "Close barcode scanner" : "Open barcode scanner"}
 >
 <Camera size={24} strokeWidth={2.5} />
 </button>
 </form>

 <div className="flex bg-surface p-1.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
 <button
 className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'search' ? 'bg-bg-alt text-text' : 'text-text-muted hover:text-text'}`}
 onClick={() => setActiveTab('search')}
 >
 Search
 </button>
 <button
 className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'recent' ? 'bg-bg-alt text-text' : 'text-text-muted'}`}
 onClick={() => setActiveTab('recent')}
 >
 Recent
 </button>
 <button
 className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'frequent' ? 'bg-bg-alt text-text' : 'text-text-muted'}`}
 onClick={() => setActiveTab('frequent')}
 >
 Frequent
 </button>
 <button
 className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'custom' ? 'bg-bg-alt text-text' : 'text-text-muted'}`}
 onClick={() => setActiveTab('custom')}
 >
 Custom
 </button>
 </div>
 </div>

 <div className="px-4 flex-1 overflow-y-auto">
 {showScanner && (
 <div className="mb-6">
 <Scanner onScan={handleScan} />
 </div>
 )}

 {loading ? (
 <div className="text-center py-8 text-text-muted font-medium">Searching...</div>
 ) : (
 <div className="space-y-3">
 {displayList.map((item) => (
 <button
 key={item.id}
 onClick={() => setSelectedFood(item)}
 className="w-full text-left bg-surface p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:bg-surface-hover transition-colors"
 >
 {item.image_url ? (
 <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-2xl shadow-sm"/>
 ) : (
 <div className="w-14 h-14 bg-bg-alt rounded-2xl flex items-center justify-center text-text-muted">
 <SearchIcon size={24} strokeWidth={2.5} />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="font-bold text-text truncate text-base">{item.name}</p>
 <p className="text-sm font-medium text-text-muted truncate">{item.brand || 'Generic'} • {Math.round(item.calories)} kcal</p>
 </div>
 </button>
 ))}
 {displayList.length === 0 && !loading && activeTab === 'search' && query && (
 <p className="text-center text-text-muted py-8">No results found for"{query}"</p>
 )}
 {displayList.length === 0 && activeTab !== 'search' && (
 <p className="text-center text-text-muted py-8">No history yet.</p>
 )}
 </div>
 )}

 {activeTab === 'custom' && (
 <form onSubmit={handleCustomFoodSubmit} className="space-y-4 bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-2">
 <div>
 <label className="block text-sm font-bold text-text mb-1">Food Name</label>
 <input
 type="text"
 required
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={customFood.name}
 onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
 placeholder="e.g. Homemade Sandwich"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-text mb-1">Calories (per 100g / serving)</label>
 <input
 type="number"
 required
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={customFood.calories}
 onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
 placeholder="0"
 />
 </div>
 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-bold text-text mb-1 text-center">Protein (g)</label>
 <input
 type="number"
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 text-center font-medium focus:border-primary focus:ring-0"
 value={customFood.protein}
 onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
 placeholder="0"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-1 text-center">Carbs (g)</label>
 <input
 type="number"
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 text-center font-medium focus:border-primary focus:ring-0"
 value={customFood.carbs}
 onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
 placeholder="0"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-1 text-center">Fat (g)</label>
 <input
 type="number"
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 text-center font-medium focus:border-primary focus:ring-0"
 value={customFood.fat}
 onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
 placeholder="0"
 />
 </div>
 </div>
 <button
 type="submit"
 className="w-full py-4 mt-2 bg-primary text-black font-bold rounded-2xl hover:opacity-90 transition-opacity"
 >
 Add Custom Food
 </button>
 </form>
 )}
 </div>
 </div>
 )
}
