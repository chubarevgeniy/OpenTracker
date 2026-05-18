import sys

def main():
    filepath = 'calorie-tracker/src/pages/Settings.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    new_handlers = """  const handleRemoveGoal = () => {
    updateSettings({ weightGoal: undefined })
    setShowGoalForm(false)
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
"""

    content = content.replace("""  const handleRemoveGoal = () => {
    updateSettings({ weightGoal: undefined })
    setShowGoalForm(false)
  }
""", new_handlers)

    ui_target = """            <label htmlFor="manual-targets" className="ml-2 block text-sm text-gray-900">
              Manual Override
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Daily Calories (kcal)</label>"""

    ui_replace = """            <label htmlFor="manual-targets" className="ml-2 block text-sm text-gray-900">
              Manual Override
            </label>
          </div>
        </div>

        {settings.manualTargets && (
          <div className="flex gap-2">
            <button onClick={handleSetTargetFromFormula} className="flex-1 py-1.5 px-2 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200 hover:bg-purple-100 transition-colors">
              Auto from Formula
            </button>
            <button onClick={handleSetTargetFromTDEE} className="flex-1 py-1.5 px-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200 hover:bg-indigo-100 transition-colors">
              Auto from Real TDEE
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Daily Calories (kcal)</label>"""

    content = content.replace(ui_target, ui_replace)

    with open(filepath, 'w') as f:
        f.write(content)

    print("Successfully added buttons.")

if __name__ == "__main__":
    main()
