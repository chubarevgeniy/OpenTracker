import { calculateTDEE } from '../utils/calculations'
import { useState } from 'react'
import { useAppStore, type Gender, type ActivityLevel, type WeightGoal } from '../store'
import { exportToCSV } from '../utils/export'
import { importFromCSV } from '../utils/import'
import { Download, Upload, Trash2, Target, Moon, Sun, Laptop, Info, Image as ImageIcon } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { parseSummaryImage } from '../utils/imageParser'

export default function Settings() {
 const settings = useAppStore((state) => state.settings)
 const updateSettings = useAppStore((state) => state.updateSettings)
 const resetData = useAppStore((state) => state.resetData)

const [showGoalForm, setShowGoalForm] = useState(false)
 const [showGoalCalculator, setShowGoalCalculator] = useState(false)
 const [tdeeSource, setTdeeSource] = useState<'formula' | 'real'>('formula')
 const [showInfoTooltip, setShowInfoTooltip] = useState(false)
 const [goalTimeline, setGoalTimeline] = useState<'current' | 'start'>('current')
 const [parsingImage, setParsingImage] = useState(false)
 const [parsedDataList, setParsedDataList] = useState<Array<{ date: string; calories: number; carbs: number; protein: number; fat: number }>>([])
 const [showParsedModal, setShowParsedModal] = useState(false)
 const [showImportModal, setShowImportModal] = useState(false)
 const [importFile, setImportFile] = useState<File | null>(null)
 const [importOptions, setImportOptions] = useState({ weight: true, nutrition: true })

 const addMealEntry = useAppStore((state) => state.addMealEntry)

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || [])
 if (files.length === 0) return

 setParsingImage(true)
 try {
 const results = await Promise.all(files.map(file => parseSummaryImage(file)))
 const validData = results.filter((data): data is NonNullable<typeof data> => data !== null)

 if (validData.length > 0) {
 setParsedDataList(validData)
 setShowParsedModal(true)
 } else {
 alert('Could not parse image data from any file.')
 }
 } catch (err) {
 console.error(err)
 alert('Error parsing image(s)')
 } finally {
 setParsingImage(false)
 // Reset input value so same files can be selected again
 e.target.value = ''
 }
 }

 const handleConfirmParsedDataList = () => {
 if (parsedDataList.length === 0) return

 parsedDataList.forEach(parsedData => {
 const entry = {
 id: crypto.randomUUID(),
 foodItem: {
 id: crypto.randomUUID(),
 name: 'Parsed Image Summary',
 brand: 'Image',
 calories: parsedData.calories,
 protein: parsedData.protein,
 carbs: parsedData.carbs,
 fat: parsedData.fat,
 },
 amount: 100, // represent as 100g chunk
 calories: parsedData.calories,
 protein: parsedData.protein,
 carbs: parsedData.carbs,
 fat: parsedData.fat,
 timestamp: Date.now(),
 }

 addMealEntry(parsedData.date, 'breakfast', entry)
 })

 setShowParsedModal(false)
 setParsedDataList([])
 }

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
 setImportFile(file)
 setShowImportModal(true)
 }
 // Reset the input value so the same file can be selected again
 e.target.value = ''
 }

 const handleConfirmImport = () => {
 if (importFile) {
 importFromCSV(importFile, importOptions)
 }
 setShowImportModal(false)
 setImportFile(null)
 }

 const handleReset = () => {
 if (window.confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
 resetData()
 alert('Data has been reset.')
 }
 }

 return (
 <div className="p-4 space-y-6 pb-24">
 <h1 className="text-2xl font-black text-text pt-2">Settings</h1>

 <div className="space-y-4 bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
 <h2 className="text-lg font-bold text-text">Appearance</h2>

 <div>
 <label className="block text-sm font-bold text-text mb-3">Theme</label>
 <div className="flex bg-bg p-1.5 rounded-2xl">
 <button
 onClick={() => updateSettings({ theme: 'light' })}
 className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-colors ${
 settings.theme === 'light' ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'
 }`}
 >
 <Sun size={18} strokeWidth={2.5}/> Light
 </button>
 <button
 onClick={() => updateSettings({ theme: 'dark' })}
 className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-colors ${
 settings.theme === 'dark' ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'
 }`}
 >
 <Moon size={18} strokeWidth={2.5}/> Dark
 </button>
 <button
 onClick={() => updateSettings({ theme: 'system' })}
 className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-colors ${
 settings.theme === 'system' ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'
 }`}
 >
 <Laptop size={18} strokeWidth={2.5}/> System
 </button>
 </div>
 </div>
 </div>

 <div className="space-y-4 bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
 <h2 className="text-lg font-bold text-text mb-2">Profile</h2>

 <div>
 <label className="block text-sm font-bold text-text mb-2">Gender</label>
          <div className="relative">
            <select
              className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0 appearance-none pr-10"
              value={settings.gender}
              onChange={(e) => handleProfileChange('gender', e.target.value as Gender)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-5 w-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-bold text-text mb-2">Age</label>
 <input
 type="number"
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={settings.age}
 onChange={(e) => handleProfileChange('age', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-text mb-2">Weight (kg)</label>
 <input
 type="number"
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={settings.weight}
 onChange={(e) => handleProfileChange('weight', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>
 <div className="col-span-2">
 <label className="block text-sm font-bold text-text mb-2">Height (cm)</label>
 <input
 type="number"
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={settings.height}
 onChange={(e) => handleProfileChange('height', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-text mb-2">Activity Level</label>
          <div className="relative">
            <select
              className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0 appearance-none pr-10"
              value={settings.activityLevel}
              onChange={(e) => handleProfileChange('activityLevel', e.target.value as ActivityLevel)}
            >
              <option value="sedentary">Sedentary (office job, little exercise)</option>
              <option value="light">Light (exercise 1-3 days/week)</option>
              <option value="moderate">Moderate (exercise 3-5 days/week)</option>
              <option value="active">Active (exercise 6-7 days/week)</option>
              <option value="very_active">Very Active (hard exercise daily/physical job)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-5 w-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
 </div>
 </div>

 <div className="space-y-4 bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-lg font-bold">Targets</h2>
 <div className="flex items-center gap-2 bg-bg px-3 py-1.5 rounded-xl">
 <input
 id="manual-targets"
 type="checkbox"
 className="h-4 w-4 text-primary focus:ring-primary border-transparent rounded bg-surface shadow-sm"
 checked={settings.manualTargets}
 onChange={handleManualTargetChange}
 />
 <label htmlFor="manual-targets"className="block text-xs font-bold text-text">
 Manual Override
 </label>
 </div>
 </div>

{settings.manualTargets && (
 <div className="space-y-3">
 <div className="flex gap-2">
 <button onClick={handleSetTargetFromFormula} className="flex-1 py-2 px-2 bg-bg text-text text-xs font-bold rounded-xl transition-colors hover:bg-surface-hover">
 Standard Formula
 </button>
 <button onClick={handleSetTargetFromTDEE} className="flex-1 py-2 px-2 bg-bg text-text text-xs font-bold rounded-xl transition-colors hover:bg-surface-hover">
 Real TDEE
 </button>
 {settings.weightGoal && (
 <button
 onClick={() => setShowGoalCalculator(!showGoalCalculator)}
 className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-colors ${showGoalCalculator ? 'bg-primary text-black' : 'bg-bg text-text hover:bg-surface-hover'}`}
 >
 Calc from Goal
 </button>
 )}
 </div>

 {settings.weightGoal && showGoalCalculator && (
 <div className="p-4 bg-bg rounded-2xl space-y-3">
 <p className="font-bold text-text text-xs uppercase tracking-widest">Goal Calculator</p>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-text mb-1">Base TDEE on:</label>
              <div className="relative">
                <select
                  className="block w-full rounded-xl border-transparent shadow-sm p-2 text-xs bg-surface font-medium focus:border-primary focus:ring-0 appearance-none pr-8"
                  value={tdeeSource}
                  onChange={(e) => setTdeeSource(e.target.value as 'formula' | 'real')}
                >
                  <option value="formula">Estimated (Formula)</option>
                  <option value="real">Real (Logged Data)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-text mb-1">Calculate from:</label>
              <div className="relative">
                <select
                  className="block w-full rounded-xl border-transparent shadow-sm p-2 text-xs bg-surface font-medium focus:border-primary focus:ring-0 appearance-none pr-8"
                  value={goalTimeline}
                  onChange={(e) => setGoalTimeline(e.target.value as 'current' | 'start')}
                >
                  <option value="current">Current Weight</option>
                  <option value="start">Start of Goal</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
 </div>
 </div>

 <button
 onClick={handleCalculateFromGoal}
 className="w-full py-2 bg-text text-surface font-bold rounded-xl hover:opacity-80 text-xs transition-opacity"
 >
 Apply Goal Target
 </button>
 </div>
 )}
 </div>
 )}

 <div className="relative">
 <div className="flex items-center gap-2 mb-2 mt-2">
 <label className="block text-sm font-bold text-text">Daily Calories (kcal)</label>
 {settings.manualTargets && settings.weightGoal && (
 <div className="relative flex items-center">
 <button
 type="button"
 onClick={() => setShowInfoTooltip(!showInfoTooltip)}
 onBlur={() => setShowInfoTooltip(false)}
 className="p-1 rounded-full hover:bg-surface focus:outline-none"
                aria-label="Target calculation info"
                title="Target calculation info"
 >
 <Info size={16} className="text-text-muted cursor-pointer"/>
 </button>
 {showInfoTooltip && (
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-text text-surface text-xs rounded-2xl shadow-xl z-10 whitespace-normal">
 <p className="font-bold mb-2 text-sm border-b border-surface/20 pb-2">Target Calculation</p>
 <ul className="space-y-2">
 <li className="flex justify-between">
 <span className="opacity-80">Base TDEE:</span>
 <span className="font-bold">{
 tdeeSource === 'formula'
 ? calculateTargets(settings.gender, settings.weight, settings.height, settings.age, settings.activityLevel).targetCalories
 : (calculateTDEE(useAppStore.getState().dailyLogs, 30)?.tdee || 'Unknown')
 } kcal</span>
 </li>
 <li className="flex justify-between">
 <span className="opacity-80">Goal:</span>
 <span className="font-bold">Lose {
 goalTimeline === 'start'
 ? (Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight)).toFixed(1)
 : (Number(settings.weight) - Number(settings.weightGoal.targetWeight)).toFixed(1)
 } kg</span>
 </li>
 <li className="flex justify-between">
 <span className="opacity-80">Total Deficit:</span>
 <span className="font-bold">{
 Math.round((goalTimeline === 'start'
 ? (Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight))
 : (Number(settings.weight) - Number(settings.weightGoal.targetWeight))) * 7700)
 } kcal</span>
 </li>
 <li className="flex justify-between">
 <span className="opacity-80">Timeline:</span>
 <span className="font-bold">{
 goalTimeline === 'start'
 ? differenceInDays(new Date(settings.weightGoal.targetDate), new Date(settings.weightGoal.startDate))
 : differenceInDays(new Date(settings.weightGoal.targetDate), new Date())
 } days</span>
 </li>
 <li className="flex justify-between text-primary pt-2 border-t border-surface/20 mt-1">
 <span className="font-bold">Daily Deficit:</span>
 <span className="font-black">{
 Math.round(((goalTimeline === 'start'
 ? (Number(settings.weightGoal.initialWeight) - Number(settings.weightGoal.targetWeight))
 : (Number(settings.weight) - Number(settings.weightGoal.targetWeight))) * 7700) / (goalTimeline === 'start'
 ? differenceInDays(new Date(settings.weightGoal.targetDate), new Date(settings.weightGoal.startDate))
 : differenceInDays(new Date(settings.weightGoal.targetDate), new Date())))
 } kcal/day</span>
 </li>
 </ul>
 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-text"></div>
 </div>
 )}
 </div>
 )}
 </div>
 <input
 type="number"
 disabled={!settings.manualTargets}
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 font-medium disabled:opacity-50 focus:border-primary focus:ring-0"
 value={settings.targetCalories}
 onChange={(e) => handleProfileChange('targetCalories', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-bold text-text mb-2 text-center">Protein (g)</label>
 <input
 type="number"
 disabled={!settings.manualTargets}
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 text-center font-medium disabled:opacity-50 focus:border-primary focus:ring-0"
 value={settings.targetProtein}
 onChange={(e) => handleProfileChange('targetProtein', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-2 text-center">Carbs (g)</label>
 <input
 type="number"
 disabled={!settings.manualTargets}
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 text-center font-medium disabled:opacity-50 focus:border-primary focus:ring-0"
 value={settings.targetCarbs}
 onChange={(e) => handleProfileChange('targetCarbs', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-2 text-center">Fat (g)</label>
 <input
 type="number"
 disabled={!settings.manualTargets}
 className="block w-full rounded-2xl bg-bg border-transparent shadow-sm p-3 text-center font-medium disabled:opacity-50 focus:border-primary focus:ring-0"
 value={settings.targetFat}
 onChange={(e) => handleProfileChange('targetFat', e.target.value === '' ? '' : Number(e.target.value))}
 />
 </div>
 </div>
 </div>

 <div className="space-y-4 bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-lg font-bold text-text">Weight Goal</h2>
 <button
 onClick={() => setShowGoalForm(!showGoalForm)}
 className="text-xs text-text bg-bg px-3 py-1.5 rounded-xl font-bold hover:bg-surface-hover transition-colors"
 >
 {showGoalForm ? 'Cancel' : settings.weightGoal ? 'Edit Goal' : 'Set Goal'}
 </button>
 </div>

 {settings.weightGoal && !showGoalForm && (
 <div className="bg-bg p-4 rounded-2xl flex items-center gap-4">
 <div className="p-3 bg-surface text-text rounded-xl shadow-sm">
 <Target size={24} strokeWidth={2.5}/>
 </div>
 <div className="flex-1">
 <p className="font-bold text-text">Target: {settings.weightGoal.targetWeight} kg</p>
 <p className="text-xs text-text-muted font-medium mt-1">
 From {settings.weightGoal.initialWeight} kg ({settings.weightGoal.startDate}) to {settings.weightGoal.targetDate}
 </p>
 </div>
 </div>
 )}

 {showGoalForm && (
 <div className="bg-bg p-5 rounded-2xl space-y-4">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-text mb-1">Initial (kg)</label>
 <input
 type="number"
 className="block w-full rounded-xl bg-surface border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={goalForm.initialWeight}
 onChange={(e) => setGoalForm({...goalForm, initialWeight: e.target.value === '' ? '' : Number(e.target.value)})}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-1">Target (kg)</label>
 <input
 type="number"
 className="block w-full rounded-xl bg-surface border-transparent shadow-sm p-3 font-medium focus:border-primary focus:ring-0"
 value={goalForm.targetWeight}
 onChange={(e) => setGoalForm({...goalForm, targetWeight: e.target.value === '' ? '' : Number(e.target.value)})}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-1">Start Date</label>
 <input
 type="date"
 className="block w-full rounded-xl bg-surface border-transparent shadow-sm p-3 font-medium text-sm focus:border-primary focus:ring-0"
 value={goalForm.startDate}
 onChange={(e) => setGoalForm({...goalForm, startDate: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-text mb-1">Target Date</label>
 <input
 type="date"
 className="block w-full rounded-xl bg-surface border-transparent shadow-sm p-3 font-medium text-sm focus:border-primary focus:ring-0"
 value={goalForm.targetDate}
 onChange={(e) => setGoalForm({...goalForm, targetDate: e.target.value})}
 />
 </div>
 </div>
 <div className="flex gap-2 pt-2">
 {settings.weightGoal && (
 <button
 onClick={handleRemoveGoal}
 className="flex-1 py-3 bg-[#FFF5F5] text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors"
 >
 Remove
 </button>
 )}
 <button
 onClick={handleSaveGoal}
 className="flex-1 py-3 bg-text text-surface font-bold rounded-xl hover:opacity-80 transition-opacity"
 >
 Save Goal
 </button>
 </div>
 </div>
 )}
 </div>

 <div className="space-y-4 bg-surface p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
 <h2 className="text-lg font-bold text-text mb-2">Data Management</h2>
 <p className="text-sm text-text-muted font-medium mb-4">
 Export your daily logs and weight history, import from an existing CSV, or reset all local data.
 </p>

 <label className="flex items-center justify-center w-full gap-3 py-4 px-4 bg-primary text-black font-black rounded-2xl shadow-[0_4px_14px_rgba(197,248,42,0.4)] hover:opacity-90 transition-all cursor-pointer mb-4">
 <ImageIcon size={20} strokeWidth={2.5}/>
 {parsingImage ? 'Parsing...' : 'Parse from Image'}
 <input type="file"accept="image/*"multiple onChange={handleImageUpload} className="hidden"disabled={parsingImage} />
 </label>

 <div className="grid grid-cols-2 gap-3">
 <button
 onClick={exportToCSV}
 className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-bg text-text font-bold rounded-xl hover:bg-surface-hover transition-colors"
 >
 <Download size={20} strokeWidth={2.5}/>
 Export
 </button>

 <label className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-bg text-text font-bold rounded-xl hover:bg-surface-hover transition-colors cursor-pointer">
 <Upload size={20} strokeWidth={2.5}/>
 Import
 <input type="file"accept=".csv,text/csv,application/csv,application/x-csv,text/comma-separated-values,text/x-csv,text/x-comma-separated-values,application/vnd.ms-excel"onChange={handleImport} className="hidden"/>
 </label>
 </div>

 <button
 onClick={handleReset}
          className="flex items-center justify-center w-full gap-2 py-3 px-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors mt-4"
 >
 <Trash2 size={20} strokeWidth={2.5}/>
 Reset All Data
 </button>
 </div>

 {showImportModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
 <div className="bg-surface rounded-2xl p-6 max-w-md w-full space-y-4">
 <h3 className="text-lg font-bold text-text">Import Options</h3>
 <p className="text-sm text-text-muted">Select what data you want to import from the CSV file.</p>

 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-surface-hover">
 <input
 type="checkbox"
 className="w-5 h-5 rounded border-border text-purple-600 focus:ring-purple-500"
 checked={importOptions.weight}
 onChange={(e) => setImportOptions({...importOptions, weight: e.target.checked})}
 />
 <div>
 <p className="font-medium text-text">Import Weight</p>
 <p className="text-xs text-text-muted">Body weight logs</p>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-surface-hover">
 <input
 type="checkbox"
 className="w-5 h-5 rounded border-border text-purple-600 focus:ring-purple-500"
 checked={importOptions.nutrition}
 onChange={(e) => setImportOptions({...importOptions, nutrition: e.target.checked})}
 />
 <div>
 <p className="font-medium text-text">Import Nutrition</p>
 <p className="text-xs text-text-muted">Food logs and macronutrients</p>
 </div>
 </label>
 </div>

 <div className="flex gap-3 pt-4">
 <button
 onClick={() => { setShowImportModal(false); setImportFile(null); }}
 className="flex-1 py-2 px-4 bg-surface-hover text-text font-medium rounded-xl hover:bg-border transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmImport}
 disabled={!importOptions.weight && !importOptions.nutrition}
 className="flex-1 py-2 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Confirm
 </button>
 </div>
 </div>
 </div>
 )}

 {showParsedModal && parsedDataList.length > 0 && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
 <div className="bg-surface rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
 <h3 className="text-lg font-bold text-text">Parsed Data ({parsedDataList.length} items)</h3>

 <div className="space-y-4">
 {parsedDataList.map((parsedData, index) => (
 <div key={index} className="p-4 border border-border rounded-xl space-y-2 bg-bg">
 {useAppStore.getState().dailyLogs[parsedData.date] && (
 <div className="p-2 mb-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-xs rounded-lg border border-yellow-200">
 Warning: Data already exists for {parsedData.date}.
 </div>
 )}
 <div className="grid grid-cols-2 gap-2 text-sm text-text">
 <p><strong>Date:</strong> {parsedData.date}</p>
 <p><strong>Calories:</strong> {parsedData.calories} kcal</p>
 <p><strong>Carbs:</strong> {parsedData.carbs} g</p>
 <p><strong>Protein:</strong> {parsedData.protein} g</p>
 <p><strong>Fat:</strong> {parsedData.fat} g</p>
 </div>
 </div>
 ))}
 </div>

 <div className="flex gap-3 pt-4 sticky bottom-0 bg-surface pb-2">
 <button
 onClick={() => { setShowParsedModal(false); setParsedDataList([]); }}
 className="flex-1 py-2 px-4 bg-surface-hover text-text font-medium rounded-xl hover:bg-border transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmParsedDataList}
 className="flex-1 py-2 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
 >
 Add All as Breakfast
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
