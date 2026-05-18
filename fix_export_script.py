import sys

def main():
    filepath = 'calorie-tracker/src/utils/export.ts'
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = """import { useAppStore } from '../store'

export const exportToCSV = () => {
  const { dailyLogs } = useAppStore.getState()

  const header = ['Date', 'Weight (kg)', 'Total Calories', 'Total Protein (g)', 'Total Carbs (g)', 'Total Fat (g)', 'Meal Type', 'Food Name', 'Amount (g)', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Food ID', 'Brand']
  const rows = [header.join(',')]

  const sortedLogs = Object.values(dailyLogs).sort((a, b) => a.date.localeCompare(b.date))

  sortedLogs.forEach(log => {
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0

    const mealRows: string[][] = []

    Object.entries(log.meals).forEach(([mealType, mealArray]) => {
      mealArray.forEach(entry => {
        totalCalories += entry.calories
        totalProtein += entry.protein
        totalCarbs += entry.carbs
        totalFat += entry.fat

        const safeName = `"${(entry.foodItem.name || '').replace(/"/g, '""')}"`
        const safeBrand = `"${(entry.foodItem.brand || '').replace(/"/g, '""')}"`

        mealRows.push([
          mealType,
          safeName,
          entry.amount.toString(),
          Math.round(entry.calories).toString(),
          Math.round(entry.protein).toString(),
          Math.round(entry.carbs).toString(),
          Math.round(entry.fat).toString(),
          entry.foodItem.id,
          safeBrand
        ])
      })
    })

    const baseRow = [
      log.date,
      log.weight || '',
      Math.round(totalCalories),
      Math.round(totalProtein),
      Math.round(totalCarbs),
      Math.round(totalFat)
    ]

    if (mealRows.length > 0) {
      mealRows.forEach(mealRow => {
        rows.push([...baseRow, ...mealRow].join(','))
      })
    } else {
      rows.push([...baseRow, '', '', '', '', '', '', '', '', ''].join(','))
    }
  })

  const csvContent = rows.join('\\n')
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
"""
    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Export script updated")

if __name__ == "__main__":
    main()
