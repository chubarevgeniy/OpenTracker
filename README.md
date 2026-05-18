# Calorie Tracker

A mobile-friendly Calorie Tracker web application built with React, TypeScript, and Vite.

## Live Demo

[Open Calorie Tracker](https://chubarevgeniy.github.io/OpenTracker/)

## Features

- **Mobile First Design**: Optimized for mobile devices with a bottom navigation bar.
- **Offline First**: Uses IndexedDB (`localforage` + `zustand` persist) to save your data locally in the browser.
- **Product Search & Barcode Scanner**: Search for products or scan their barcodes using the Open Food Facts API.
- **Meal Logging**: Log your breakfast, lunch, dinner, and snacks.
- **Personalized Targets**: Calculate your daily calorie and macronutrient targets using the Mifflin-St Jeor formula based on your profile (age, gender, weight, height, activity level).
- **Statistics & Insights**: View your weight and calorie consumption history on interactive charts.
- **True TDEE Calculation**: Automatically estimates your real Total Daily Energy Expenditure after logging food and weight consistently for 14+ days.
- **Data Export**: Export your data to a CSV file to easily upload it to Google Sheets.

## Local Development

1. Install dependencies
```bash
cd calorie-tracker
npm install
```

2. Start the development server
```bash
npm run dev
```

3. Build for production
```bash
npm run build
```
