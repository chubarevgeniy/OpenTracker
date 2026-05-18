import { calculateTDEE } from '../utils/calculations'
import { useState } from 'react'
import { useAppStore, type Gender, type ActivityLevel, type WeightGoal } from '../store'
import { exportToCSV } from '../utils/export'
import { importFromCSV } from '../utils/import'
import { Download, Upload, Trash2, Target, Moon, Sun, Laptop } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function Settings() {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const resetData = useAppStore((state) => state.resetData)

const [showGoalForm, setShowGoalForm] = useState(false)
  const [showGoalCalculator, setShowGoalCalculator] = useState(false)
  const [tdeeSource, setTdeeSource] = useState<'formula' | 'real'>('formula')
  const [goalTimeline, setGoalTimeline] = useState<'current' | 'start'>('current')
  const [goalForm, setGoalForm] = useState<WeightGoal>(
    settings.weightGoal || {
      targetWeight: settings.weight || '',
      initialWeight: settings.weight || '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      targetDate: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
    }
  )

  const calculateTargets = (
    gender: Gender,
    weight: number | '',
    height: number | '',
    age: number | '',
    activityLevel: ActivityLevel
  ) => {
    // Mifflin-St Jeor Equation
    // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    const bmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + (gender === 'male' ? 5 : -161)

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

  const handleSaveGoal = () => {
    updateSettings({ weightGoal: goalForm })
    setShowGoalForm(false)
  }

  const handleRemoveGoal = () => {
    updateSettings({ weightGoal: undefined })
    setShowGoalForm(false)
  }

const handleCalculateFromGoal = () => {
    if (!settings.weightGoal) return

    let baseTdee: number
    if (tdeeSource === 'formula') {
      baseTdee = calculateTargets(
        settings.gender,
        settings.weight,
        settings.height,
        settings.age,
        settings.activityLevel
      ).targetCalories
    } else {
      const dailyLogs = useAppStore.getState().dailyLogs
      const tdeeCalc = calculateTDEE(dailyLogs, 30)
      if (tdeeCalc && tdeeCalc.tdee) {
        baseTdee = tdeeCalc.tdee
      } else {
        alert("Not enough logged data to calculate Real TDEE.")
        return
      }
    }

    let diff: number
    let days: number

    if (goalTimeline === 'start') {
      diff = Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight)
      days = differenceInDays(new Date(settings.weightGoal.targetDate), new Date(settings.weightGoal.startDate))
    } else {
      diff = Number(settings.weight) - Number(settings.weightGoal.targetWeight)
      days = differenceInDays(new Date(settings.weightGoal.targetDate), new Date())
    }

    if (days <= 0) {
      alert("Target date must be in the future to calculate daily deficit.")
      return
    }

    const dailyDeficit = (diff * 7700) / days
    const targetCalories = Math.round(baseTdee - dailyDeficit)

    // Recalculate macros for the new calories
    const targetProtein = Math.round((targetCalories * 0.3) / 4)
    const targetCarbs = Math.round((targetCalories * 0.4) / 4)
    const targetFat = Math.round((targetCalories * 0.3) / 9)

    updateSettings({
      manualTargets: true,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat
    })
    setShowGoalCalculator(false)
  }

  const handleSetTargetFromFormula = () => {
    const targets = calculateTargets(
      settings.gender,
      settings.weight,
      settings.height,
      settings.age,
      settings.activityLevel
    )
    updateSettings({ manualTargets: true, ...targets })
  }

  const handleSetTargetFromTDEE = () => {
    const dailyLogs = useAppStore.getState().dailyLogs
    const tdeeCalc = calculateTDEE(dailyLogs, 30) // Default to 30 days for this
    if (tdeeCalc && tdeeCalc.tdee) {
      updateSettings({ manualTargets: true, targetCalories: tdeeCalc.tdee })
    } else {
      alert("Not enough logged data (minimum 14 days of food and weight) to calculate TDEE.")
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importFromCSV(file)
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
      resetData()
      alert('Data has been reset.')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                settings.theme === 'light' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                settings.theme === 'dark' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              onClick={() => updateSettings({ theme: 'system' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                settings.theme === 'system' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <Laptop size={16} /> System
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
            value={settings.gender}
            onChange={(e) => handleProfileChange('gender', e.target.value as Gender)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
              value={settings.age}
              onChange={(e) => handleProfileChange('age', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
              value={settings.weight}
              onChange={(e) => handleProfileChange('weight', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
              value={settings.height}
              onChange={(e) => handleProfileChange('height', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activity Level</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
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

      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Targets</h2>
          <div className="flex items-center">
            <input
              id="manual-targets"
              type="checkbox"
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
              checked={settings.manualTargets}
              onChange={handleManualTargetChange}
            />
            <label htmlFor="manual-targets" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Manual Override
            </label>
          </div>
        </div>

{settings.manualTargets && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button onClick={handleSetTargetFromFormula} className="flex-1 py-1.5 px-2 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200 hover:bg-purple-100 transition-colors">
                Auto from Formula
              </button>
              <button onClick={handleSetTargetFromTDEE} className="flex-1 py-1.5 px-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200 hover:bg-indigo-100 transition-colors">
                Auto from Real TDEE
              </button>
              {settings.weightGoal && (
                <button
                  onClick={() => setShowGoalCalculator(!showGoalCalculator)}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded border transition-colors ${showGoalCalculator ? 'bg-pink-100 text-pink-800 border-pink-300' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`}
                >
                  Calc from Goal
                </button>
              )}
            </div>

            {settings.weightGoal && showGoalCalculator && (
              <div className="p-3 bg-pink-50 border border-pink-100 rounded-lg text-sm space-y-3">
                <p className="font-medium text-pink-800 text-xs uppercase tracking-wide">Goal Calculator</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-pink-700 mb-1">Base TDEE on:</label>
                    <select
                      className="block w-full rounded border-pink-200 shadow-sm p-1.5 text-xs bg-white dark:bg-gray-800 focus:border-pink-500 focus:ring-pink-500"
                      value={tdeeSource}
                      onChange={(e) => setTdeeSource(e.target.value as 'formula' | 'real')}
                    >
                      <option value="formula">Standard Formula</option>
                      <option value="real">Real TDEE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-700 mb-1">Calculate from:</label>
                    <select
                      className="block w-full rounded border-pink-200 shadow-sm p-1.5 text-xs bg-white dark:bg-gray-800 focus:border-pink-500 focus:ring-pink-500"
                      value={goalTimeline}
                      onChange={(e) => setGoalTimeline(e.target.value as 'current' | 'start')}
                    >
                      <option value="current">Current Weight</option>
                      <option value="start">Initial Weight</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculateFromGoal}
                  className="w-full py-1.5 bg-pink-600 text-white font-medium rounded hover:bg-pink-700 text-xs transition-colors"
                >
                  Apply Goal Target
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Daily Calories (kcal)</label>
          <input
            type="number"
            disabled={!settings.manualTargets}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border disabled:bg-gray-100 dark:bg-gray-800 focus:border-purple-500 focus:ring-purple-500"
            value={settings.targetCalories}
            onChange={(e) => handleProfileChange('targetCalories', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Protein (g)</label>
            <input
              type="number"
              disabled={!settings.manualTargets}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border disabled:bg-gray-100 dark:bg-gray-800 focus:border-purple-500 focus:ring-purple-500"
              value={settings.targetProtein}
              onChange={(e) => handleProfileChange('targetProtein', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Carbs (g)</label>
            <input
              type="number"
              disabled={!settings.manualTargets}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border disabled:bg-gray-100 dark:bg-gray-800 focus:border-purple-500 focus:ring-purple-500"
              value={settings.targetCarbs}
              onChange={(e) => handleProfileChange('targetCarbs', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fat (g)</label>
            <input
              type="number"
              disabled={!settings.manualTargets}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border disabled:bg-gray-100 dark:bg-gray-800 focus:border-purple-500 focus:ring-purple-500"
              value={settings.targetFat}
              onChange={(e) => handleProfileChange('targetFat', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Weight Goal</h2>
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="text-sm text-purple-600 font-medium hover:text-purple-700"
          >
            {showGoalForm ? 'Cancel' : settings.weightGoal ? 'Edit Goal' : 'Set Goal'}
          </button>
        </div>

        {settings.weightGoal && !showGoalForm && (
          <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <Target size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Target: {settings.weightGoal.targetWeight} kg</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                From {settings.weightGoal.initialWeight} kg ({settings.weightGoal.startDate}) to {settings.weightGoal.targetDate}
              </p>
            </div>
          </div>
        )}

        {showGoalForm && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Weight (kg)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
                  value={goalForm.initialWeight}
                  onChange={(e) => setGoalForm({...goalForm, initialWeight: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Weight (kg)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
                  value={goalForm.targetWeight}
                  onChange={(e) => setGoalForm({...goalForm, targetWeight: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
                  value={goalForm.startDate}
                  onChange={(e) => setGoalForm({...goalForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-purple-500 focus:ring-purple-500"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({...goalForm, targetDate: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              {settings.weightGoal && (
                <button
                  onClick={handleRemoveGoal}
                  className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg"
                >
                  Remove Goal
                </button>
              )}
              <button
                onClick={handleSaveGoal}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
              >
                Save Goal
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 pb-10">
        <h2 className="text-xl font-semibold">Data Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Export your daily logs and weight history to a CSV file, import from an existing CSV, or reset all local data.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-green-50 text-green-700 font-medium rounded-xl hover:bg-green-100 transition-colors border border-green-200"
          >
            <Download size={20} />
            Export
          </button>

          <label className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer">
            <Upload size={20} />
            Import
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-colors border border-red-200 mt-4"
        >
          <Trash2 size={20} />
          Reset All Data
        </button>
      </div>
    </div>
  )
}
