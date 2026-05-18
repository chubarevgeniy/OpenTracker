def get_code():
    with open('calorie-tracker/src/pages/Stats.tsx', 'r') as f:
        content = f.read()

    lines = content.split('\n')
    tdee_start = -1
    for i, line in enumerate(lines):
        if 'const tdeeCalc = useMemo(() => {' in line:
            tdee_start = i
            break

    if tdee_start == -1:
        print("Not found")
        return

    tdee_end = -1
    for i in range(tdee_start, len(lines)):
        if '  }, [dailyLogs, tdeeRange])' in lines[i]:
            tdee_end = i
            break

    print('\n'.join(lines[tdee_start:tdee_end+1]))

get_code()
