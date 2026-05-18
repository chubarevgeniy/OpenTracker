import { Outlet, NavLink } from 'react-router-dom'
import { Home, Search, BarChart2, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen pb-[70px] bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-sm min-h-screen">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-[var(--color-primary)]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
              )
            }
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-[var(--color-primary)]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
              )
            }
          >
            <Search size={24} />
            <span className="text-xs font-medium">Search</span>
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-[var(--color-primary)]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
              )
            }
          >
            <BarChart2 size={24} />
            <span className="text-xs font-medium">Stats</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-[var(--color-primary)]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
              )
            }
          >
            <Settings size={24} />
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
