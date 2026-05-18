import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

localforage.config({
  name: 'calorie-tracker',
  storeName: 'calorie_store',
})

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return await localforage.getItem(name)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name)
  },
}

export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export interface WeightGoal {
  targetWeight: number
  initialWeight: number
  startDate: string // YYYY-MM-DD
  targetDate: string // YYYY-MM-DD
}

export interface Settings {
  gender: Gender
  age: number
  weight: number // kg
  height: number // cm
  activityLevel: ActivityLevel
  manualTargets: boolean
  targetCalories: number
  targetProtein: number // grams
  targetCarbs: number // grams
  targetFat: number // grams
  weightGoal?: WeightGoal
}

export interface FoodItem {
  id: string
  name: string
  brand?: string
  calories: number // per 100g
  protein: number // per 100g
  carbs: number // per 100g
  fat: number // per 100g
  image_url?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealEntry {
  id: string
  foodItem: FoodItem
  amount: number // grams
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: number
}

export interface DailyLog {
  date: string // YYYY-MM-DD
  weight?: number // Recorded weight for the day
  meals: {
    breakfast: MealEntry[]
    lunch: MealEntry[]
    dinner: MealEntry[]
    snack: MealEntry[]
  }
}

export interface SearchHistoryItem {
  foodItem: FoodItem
  lastSearched: number
  count: number
}

interface AppState {
  settings: Settings
  dailyLogs: Record<string, DailyLog>
  searchHistory: Record<string, SearchHistoryItem>

  updateSettings: (settings: Partial<Settings>) => void
  addMealEntry: (date: string, mealType: MealType, entry: MealEntry) => void
  removeMealEntry: (date: string, mealType: MealType, entryId: string) => void
  logWeight: (date: string, weight: number) => void
  addSearchHistory: (foodItem: FoodItem) => void
  resetData: () => void
}

const defaultSettings: Settings = {
  gender: 'male',
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  manualTargets: false,
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 65,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      dailyLogs: {},
      searchHistory: {},

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      addMealEntry: (date, mealType, entry) =>
        set((state) => {
          const log = state.dailyLogs[date] || {
            date,
            meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
          }
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [date]: {
                ...log,
                meals: {
                  ...log.meals,
                  [mealType]: [...log.meals[mealType], entry],
                },
              },
            },
          }
        }),

      removeMealEntry: (date, mealType, entryId) =>
        set((state) => {
          const log = state.dailyLogs[date]
          if (!log) return state

          return {
            dailyLogs: {
              ...state.dailyLogs,
              [date]: {
                ...log,
                meals: {
                  ...log.meals,
                  [mealType]: log.meals[mealType].filter((e) => e.id !== entryId),
                },
              },
            },
          }
        }),

      logWeight: (date, weight) =>
        set((state) => {
          const log = state.dailyLogs[date] || {
            date,
            meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
          }
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [date]: {
                ...log,
                weight,
              },
            },
            settings: {
              ...state.settings,
              weight,
            }
          }
        }),

      addSearchHistory: (foodItem) =>
        set((state) => {
          const existing = state.searchHistory[foodItem.id]
          return {
            searchHistory: {
              ...state.searchHistory,
              [foodItem.id]: {
                foodItem,
                lastSearched: Date.now(),
                count: existing ? existing.count + 1 : 1,
              },
            },
          }
        }),

      resetData: () => set(() => ({ dailyLogs: {}, searchHistory: {} })),
    }),
    {
      name: 'calorie-tracker-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)
