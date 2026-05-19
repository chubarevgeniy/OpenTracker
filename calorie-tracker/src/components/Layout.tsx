import { Outlet, NavLink } from 'react-router-dom'
import { Home, Search, BarChart2, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Layout() {
 return (
 <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-bg">
 <main className="flex-1 w-full max-w-md mx-auto bg-surface shadow-sm overflow-y-auto pb-[70px]">
 <Outlet />
 </main>

 <nav className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-surface border-t border-border shadow-lg z-50">
 <div className="flex justify-around items-center h-16">
 <NavLink
 to="/"
 className={({ isActive }) =>
 cn(
 'flex flex-col items-center justify-center w-full h-full space-y-1',
 isActive ? 'text-[var(--color-primary)]' : 'text-text-muted hover:text-text'
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
 isActive ? 'text-[var(--color-primary)]' : 'text-text-muted hover:text-text'
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
 isActive ? 'text-[var(--color-primary)]' : 'text-text-muted hover:text-text'
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
 isActive ? 'text-[var(--color-primary)]' : 'text-text-muted hover:text-text'
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
