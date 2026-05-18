import { useAppStore } from '../store'

export const exportToCSV = () => {
  const { dailyLogs } = useAppStore.getState()

  const header = ['Date', 'Weight (kg)', 'Total Calories', 'Total Protein (g)', 'Total Carbs (g)', 'Total Fat (g)']
  const rows = [header.join(',')]

  const sortedLogs = Object.values(dailyLogs).sort((a, b) => a.date.localeCompare(b.date))

  sortedLogs.forEach(log => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fat = 0

    Object.values(log.meals).forEach(mealArray => {
      mealArray.forEach(entry => {
        calories += entry.calories
        protein += entry.protein
        carbs += entry.carbs
        fat += entry.fat
      })
    })

    const row = [
      log.date,
      log.weight || '',
      Math.round(calories),
      Math.round(protein),
      Math.round(carbs),
      Math.round(fat)
    ]

    rows.push(row.join(','))
  })

  const csvContent = rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `calorie-tracker-export-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
