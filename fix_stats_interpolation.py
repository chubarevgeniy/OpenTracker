import sys

def main():
    filepath = 'calorie-tracker/src/pages/Stats.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    search_block = """    // Interpolate missing weights for better visualization
    let lastKnownWeight = settingsWeight

    // Attempt to find an initial weight for interpolation if the first point is null
    if (data.length > 0 && data[0].weight === null) {
      const sortedDates = Object.keys(dailyLogs).sort().reverse()
      for (const d of sortedDates) {
        if (d < data[0].fullDate && dailyLogs[d].weight) {
          lastKnownWeight = dailyLogs[d].weight
          break
        }
      }
    }

    for (const point of data) {
      if (point.weight !== null) {
        lastKnownWeight = point.weight
      } else {
        point.weight = lastKnownWeight
      }
    }"""

    replace_block = """    // Interpolate missing weights for better visualization
    // First, try to find a weight BEFORE the range to use as a starting point
    let initialWeight: number | null = null
    if (data.length > 0) {
      const sortedDates = Object.keys(dailyLogs).sort().reverse()
      for (const d of sortedDates) {
        if (d < data[0].fullDate && dailyLogs[d].weight) {
          initialWeight = dailyLogs[d].weight
          break
        }
      }
    }

    // If no weight before range, use the first valid weight IN the range
    if (initialWeight === null) {
      for (const point of data) {
        if (point.weight !== null) {
          initialWeight = point.weight
          break
        }
      }
    }

    // If still null, fallback to settings weight (though the user prefers the earliest date)
    let lastKnownWeight = initialWeight !== null ? initialWeight : settingsWeight

    for (const point of data) {
      if (point.weight !== null) {
        lastKnownWeight = point.weight
      } else {
        point.weight = lastKnownWeight
      }
    }"""

    if search_block in content:
        content = content.replace(search_block, replace_block)
        with open(filepath, 'w') as f:
            f.write(content)
        print("Successfully replaced interpolation logic.")
    else:
        print("Search block not found.")

if __name__ == "__main__":
    main()
