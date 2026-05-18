import re

with open('calorie-tracker/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { Download, Upload, Trash2, Target, Moon, Sun, Laptop } from 'lucide-react'", "import { Download, Upload, Trash2, Target, Moon, Sun, Laptop, Info } from 'lucide-react'")

target_html = """        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Daily Calories (kcal)</label>
          <input
            type="number"
            disabled={!settings.manualTargets}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border disabled:bg-gray-100 dark:bg-gray-800 focus:border-purple-500 focus:ring-purple-500"
            value={settings.targetCalories}
            onChange={(e) => handleProfileChange('targetCalories', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>"""

replacement_html = """        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Daily Calories (kcal)</label>
            {settings.manualTargets && settings.weightGoal && (
              <div className="group relative flex items-center">
                <Info size={16} className="text-purple-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 whitespace-normal">
                  <p className="font-semibold mb-2 text-sm border-b border-gray-700 pb-1">Target Calculation</p>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-400">Base TDEE:</span>
                      <span className="font-medium">{
                        tdeeSource === 'formula'
                          ? calculateTargets(settings.gender, settings.weight, settings.height, settings.age, settings.activityLevel).targetCalories
                          : (calculateTDEE(useAppStore.getState().dailyLogs, 30)?.tdee || 'Unknown')
                      } kcal</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Goal:</span>
                      <span className="font-medium">Lose {
                        goalTimeline === 'start'
                          ? (Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight)).toFixed(1)
                          : (Number(settings.weight) - Number(settings.weightGoal.targetWeight)).toFixed(1)
                      } kg</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Total Deficit:</span>
                      <span className="font-medium">{
                        Math.round((goalTimeline === 'start'
                          ? (Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight))
                          : (Number(settings.weight) - Number(settings.weightGoal.targetWeight))) * 7700)
                      } kcal</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Timeline:</span>
                      <span className="font-medium">{
                        goalTimeline === 'start'
                          ? differenceInDays(new Date(settings.weightGoal.targetDate), new Date(settings.weightGoal.startDate))
                          : differenceInDays(new Date(settings.weightGoal.targetDate), new Date())
                      } days</span>
                    </li>
                    <li className="flex justify-between text-purple-300 pt-1 border-t border-gray-700">
                      <span>Daily Deficit:</span>
                      <span className="font-medium">{
                        Math.round(((goalTimeline === 'start'
                          ? (Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight))
                          : (Number(settings.weight) - Number(settings.weightGoal.targetWeight))) * 7700) / (goalTimeline === 'start'
                            ? differenceInDays(new Date(settings.weightGoal.targetDate), new Date(settings.weightGoal.startDate))
                            : differenceInDays(new Date(settings.weightGoal.targetDate), new Date())))
                      } kcal/day</span>
                    </li>
                  </ul>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          <input
            type="number"
            disabled={!settings.manualTargets}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border disabled:bg-gray-100 dark:bg-gray-800 focus:border-purple-500 focus:ring-purple-500"
            value={settings.targetCalories}
            onChange={(e) => handleProfileChange('targetCalories', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>"""

if target_html in content:
    content = content.replace(target_html, replacement_html)
    with open('calorie-tracker/src/pages/Settings.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find target html")
