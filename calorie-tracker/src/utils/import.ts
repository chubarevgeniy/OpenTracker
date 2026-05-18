import { useAppStore } from '../store'

export const importFromCSV = (file: File) => {
  const reader = new FileReader()

  reader.onload = (e) => {
    const text = e.target?.result as string
    if (!text) return

    const lines = text.split('\n')
    // header: ['Date', 'Weight (kg)', 'Total Calories', 'Total Protein (g)', 'Total Carbs (g)', 'Total Fat (g)']

    // Using store
    const store = useAppStore.getState()
    let importedWeights = 0

    // Start from line 1 to skip headers
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const [date, weightStr] = line.split(',')
      if (date && weightStr) {
        const weight = parseFloat(weightStr)
        if (!isNaN(weight)) {
          store.logWeight(date, weight)
          importedWeights++
        }
      }
    }

    if (importedWeights > 0) {
      alert(`Successfully imported ${importedWeights} days of weight logs! Note: Calories/macros cannot be imported back as individual foods yet.`)
    } else {
      alert('No valid weight data found to import.')
    }
  }

  reader.readAsText(file)
}
