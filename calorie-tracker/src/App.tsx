import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter basename="/OpenTracker/">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
