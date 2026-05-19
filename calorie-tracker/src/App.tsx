import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useAppStore } from './store'
import Layout from './components/Layout'

import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

function App() {
 const theme = useAppStore(state => state.settings.theme)

 useEffect(() => {
 const root = window.document.documentElement

 if (theme === 'system') {
 const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
 if (systemTheme === 'dark') {
 root.classList.add('dark')
 } else {
 root.classList.remove('dark')
 }
 } else if (theme === 'dark') {
 root.classList.add('dark')
 } else {
 root.classList.remove('dark')
 }
 }, [theme])

 return (
 <HashRouter>
 <Routes>
 <Route path="/"element={<Layout />}>
 <Route index element={<Dashboard />} />
 <Route path="search"element={<Search />} />
 <Route path="stats"element={<Stats />} />
 <Route path="settings"element={<Settings />} />
 </Route>
 </Routes>
 </HashRouter>
 )
}

export default App
