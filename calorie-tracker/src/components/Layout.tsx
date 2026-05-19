import { Outlet, NavLink } from 'react-router-dom'
import { Home, Search, BarChart2, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Layout() {
 return (
 <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-bg">
 <main className="flex-1 w-full max-w-md mx-auto bg-surface shadow-sm overflow-y-auto pb-[70px]">
 <Outlet />
 </main>

 <nav className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-surface border-t-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 rounded-t-3xl pb-safe">
 <div className="flex justify-around items-center h-20 px-2">
 <NavLink to="/">
 {({ isActive }) => (
 <div className={cn(
 'flex flex-col items-center justify-center w-16 h-16 space-y-1 rounded-2xl transition-all',
 isActive ? 'text-text' : 'text-text-muted hover:text-text'
 )}>
 <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
 <span className="text-[10px] font-semibold">Home</span>
 </div>
 )}
 </NavLink>
 <NavLink to="/search">
 {({ isActive }) => (
 <div className={cn(
 'flex flex-col items-center justify-center w-16 h-16 space-y-1 rounded-2xl transition-all',
 isActive ? 'text-text' : 'text-text-muted hover:text-text'
 )}>
 <Search size={24} strokeWidth={isActive ? 2.5 : 2} />
 <span className="text-[10px] font-semibold">Search</span>
 </div>
 )}
 </NavLink>
 <NavLink to="/stats">
 {({ isActive }) => (
 <div className={cn(
 'flex flex-col items-center justify-center w-16 h-16 space-y-1 rounded-2xl transition-all',
 isActive ? 'text-text' : 'text-text-muted hover:text-text'
 )}>
 <BarChart2 size={24} strokeWidth={isActive ? 2.5 : 2} />
 <span className="text-[10px] font-semibold">Stats</span>
 </div>
 )}
 </NavLink>
 <NavLink to="/settings">
 {({ isActive }) => (
 <div className={cn(
 'flex flex-col items-center justify-center w-16 h-16 space-y-1 rounded-2xl transition-all',
 isActive ? 'text-text' : 'text-text-muted hover:text-text'
 )}>
 <Settings size={24} strokeWidth={isActive ? 2.5 : 2} />
 <span className="text-[10px] font-semibold">Settings</span>
 </div>
 )}
 </NavLink>
 </div>
 </nav>
 </div>
 )
}
