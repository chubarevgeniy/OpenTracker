import sys

def main():
    filepath = 'calorie-tracker/src/pages/Stats.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    search_block = """      {/* Real Energy Expenditure Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold mb-1">True Maintenance (TDEE)</h2>
        <p className="text-purple-100 text-sm mb-4">Calculated from your logged data</p>

        {tdeeCalc ? ("""

    replace_block = """      {/* Real Energy Expenditure Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">True Maintenance (TDEE)</h2>
            <p className="text-purple-100 text-sm">Calculated from your logged data</p>
          </div>
          <select
            className="bg-white/20 border border-white/30 text-white text-sm rounded-lg p-1.5 focus:ring-white focus:border-white"
            value={tdeeRange}
            onChange={(e) => setTdeeRange(e.target.value === 'all' ? 'all' : Number(e.target.value) as any)}
          >
            <option value="30" className="text-gray-900">Last 30 Days</option>
            <option value="60" className="text-gray-900">Last 60 Days</option>
            <option value="90" className="text-gray-900">Last 90 Days</option>
            <option value="all" className="text-gray-900">All Time</option>
          </select>
        </div>

        {tdeeCalc ? ("""

    if search_block in content:
        content = content.replace(search_block, replace_block)
        with open(filepath, 'w') as f:
            f.write(content)
        print("Successfully replaced.")
    else:
        print("Search block not found.")

if __name__ == "__main__":
    main()
