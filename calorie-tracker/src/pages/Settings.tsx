import { useAppStore, type Gender, type ActivityLevel } from '../store'
import { exportToCSV } from '../utils/export'
import { Download } from 'lucide-react'

export default function Settings() {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)

  const calculateTargets = (
    gender: Gender,
    weight: number,
    height: number,
    age: number,
    activityLevel: ActivityLevel
  ) => {
    // Mifflin-St Jeor Equation
    // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161)

    let activityFactor = 1.2
    switch (activityLevel) {
      case 'sedentary':
        activityFactor = 1.2
        break
      case 'light':
        activityFactor = 1.375
        break
      case 'moderate':
        activityFactor = 1.55
        break
      case 'active':
        activityFactor = 1.725
        break
      case 'very_active':
        activityFactor = 1.9
        break
    }

    const tdee = Math.round(bmr * activityFactor)

    // Default macros: 30% protein, 40% carbs, 30% fat
    const targetProtein = Math.round((tdee * 0.3) / 4)
    const targetCarbs = Math.round((tdee * 0.4) / 4)
    const targetFat = Math.round((tdee * 0.3) / 9)

    return {
      targetCalories: tdee,
      targetProtein,
      targetCarbs,
      targetFat,
    }
  }

  const handleProfileChange = (field: keyof typeof settings, value: string | number | boolean) => {
    const newSettings = { ...settings, [field]: value }

    if (!newSettings.manualTargets && field !== 'manualTargets') {
      const targets = calculateTargets(
        newSettings.gender,
        newSettings.weight,
        newSettings.height,
        newSettings.age,
        newSettings.activityLevel
      )
      updateSettings({ ...newSettings, ...targets })
    } else {
      updateSettings(newSettings)
    }
  }

  const handleManualTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isManual = e.target.checked
    if (isManual) {
      updateSettings({ manualTargets: true })
    } else {
      const targets = calculateTargets(
        settings.gender,
        settings.weight,
        settings.height,
        settings.age,
        settings.activityLevel
      )
      updateSettings({ manualTargets: false, ...targets })
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
            value={settings.gender}
            onChange={(e) => handleProfileChange('gender', e.target.value as Gender)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
              value={settings.age}
              onChange={(e) => handleProfileChange('age', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
              value={settings.weight}
              onChange={(e) => handleProfileChange('weight', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
              value={settings.height}
              onChange={(e) => handleProfileChange('height', Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Activity Level</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
            value={settings.activityLevel}
            onChange={(e) => handleProfileChange('activityLevel', e.target.value as ActivityLevel)}
          >
            <option value="sedentary">Sedentary (Little or no exercise)</option>
            <option value="light">Light (Exercise 1-3 days/week)</option>
            <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
            <option value="active">Active (Exercise 6-7 days/week)</option>
            <option value="very_active">Very Active (Hard exercise/sports)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Targets</h2>
          <div className="flex items-center">
            <input
              id="manual-targets"
              type="checkbox"
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              checked={settings.manualTargets}
              onChange={handleManualTargetChange}
            />
            <label htmlFor="manual-targets" className="ml-2 block text-sm text-gray-900">
              Manual Override
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Daily Calories (kcal)</label>
          <input
            type="number"
            disabled={!settings.manualTargets}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 focus:border-purple-500 focus:ring-purple-500"
            value={settings.targetCalories}
            onChange={(e) => handleProfileChange('targetCalories', Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Protein (g)</label>
            <input
              type="number"
              disabled={!settings.manualTargets}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 focus:border-purple-500 focus:ring-purple-500"
              value={settings.targetProtein}
              onChange={(e) => handleProfileChange('targetProtein', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Carbs (g)</label>
            <input
              type="number"
              disabled={!settings.manualTargets}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 focus:border-purple-500 focus:ring-purple-500"
              value={settings.targetCarbs}
              onChange={(e) => handleProfileChange('targetCarbs', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fat (g)</label>
            <input
              type="number"
              disabled={!settings.manualTargets}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 focus:border-purple-500 focus:ring-purple-500"
              value={settings.targetFat}
              onChange={(e) => handleProfileChange('targetFat', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200 pb-10">
        <h2 className="text-xl font-semibold">Data Export</h2>
        <p className="text-sm text-gray-500">
          Export your daily logs and weight history to a CSV file. You can easily import this file into Google Sheets.
        </p>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-green-50 text-green-700 font-medium rounded-xl hover:bg-green-100 transition-colors border border-green-200"
        >
          <Download size={20} />
          Export to CSV
        </button>
      </div>
    </div>
  )
}
