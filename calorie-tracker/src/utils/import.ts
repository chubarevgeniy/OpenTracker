import { useAppStore } from '../store'
import type { DailyLog, MealEntry, MealType } from '../store'

// Helper to parse CSV row considering quotes
const parseCSVRow = (text: string): string[] => {
 const result: string[] = []
 let cell = ''
 let inQuotes = false

 for (let i = 0; i < text.length; i++) {
 const char = text[i]
 if (char === '"') {
 if (inQuotes && text[i + 1] === '"') {
 cell += '"'
 i++ // Skip the escaped quote
 } else {
 inQuotes = !inQuotes
 }
 } else if (char === ',' && !inQuotes) {
 result.push(cell)
 cell = ''
 } else {
 cell += char
 }
 }
 result.push(cell)
 return result
}

export const importFromCSV = (file: File) => {
 const reader = new FileReader()

 reader.onload = (e) => {
 const text = e.target?.result as string
 if (!text) return

 const lines = text.split('\n')
 // header: ['Date', 'Weight (kg)', 'Total Calories', 'Total Protein (g)', 'Total Carbs (g)', 'Total Fat (g)', 'Meal Type', 'Food Name', 'Amount (g)', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Food ID', 'Brand']

 const store = useAppStore.getState()
 const importedLogs: Record<string, DailyLog> = {}
 let importedDays = 0
 let importedMeals = 0

 // Start from line 1 to skip headers
 for (let i = 1; i < lines.length; i++) {
 const line = lines[i].trim()
 if (!line) continue

 const columns = parseCSVRow(line)

 const date = columns[0]
 const weightStr = columns[1]

 if (!date) continue

 if (!importedLogs[date]) {
 importedLogs[date] = {
 date,
 meals: { breakfast: [], lunch: [], dinner: [], snack: [] }
 }
 importedDays++
 }

 if (weightStr) {
 const weight = parseFloat(weightStr)
 if (!isNaN(weight)) {
 importedLogs[date].weight = weight
 }
 }

 // Check if there is meal data (Meal Type is at index 6)
 const mealType = columns[6] as MealType
 const foodName = columns[7]
 const amountStr = columns[8]
 const caloriesStr = columns[9]
 const proteinStr = columns[10]
 const carbsStr = columns[11]
 const fatStr = columns[12]
 const foodId = columns[13]
 const brand = columns[14]

 if (mealType && foodName && amountStr && caloriesStr && proteinStr && carbsStr && fatStr && foodId) {
 const amount = parseFloat(amountStr)
 const calories = parseFloat(caloriesStr)
 const protein = parseFloat(proteinStr)
 const carbs = parseFloat(carbsStr)
 const fat = parseFloat(fatStr)

 if (!isNaN(amount) && !isNaN(calories) && !isNaN(protein) && !isNaN(carbs) && !isNaN(fat)) {

 // Reverse engineer per-100g values for the FoodItem base
 const factor = amount > 0 ? (100 / amount) : 0
 const baseCalories = factor ? calories * factor : 0
 const baseProtein = factor ? protein * factor : 0
 const baseCarbs = factor ? carbs * factor : 0
 const baseFat = factor ? fat * factor : 0

 const entry: MealEntry = {
 id: crypto.randomUUID(), // New UUID for the log entry
 foodItem: {
 id: foodId,
 name: foodName,
 brand: brand || undefined,
 calories: baseCalories,
 protein: baseProtein,
 carbs: baseCarbs,
 fat: baseFat
 },
 amount,
 calories,
 protein,
 carbs,
 fat,
 timestamp: Date.now() // Use current time as fallback
 }

 if (['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
 importedLogs[date].meals[mealType].push(entry)
 importedMeals++
 }
 }
 }
 }

 if (Object.keys(importedLogs).length > 0) {
 store.importData(importedLogs)
 alert(`Successfully imported ${importedDays} days and ${importedMeals} food entries!`)
 } else {
 alert('No valid data found to import.')
 }
 }

 reader.readAsText(file)
}