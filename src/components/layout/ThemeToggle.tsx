'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Check initial theme state on mount
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 rounded-full transition-all duration-300 flex items-center justify-center focus:outline-none"
      aria-label="Changer le thème"
    >
      <div className="relative h-5 w-5 overflow-hidden">
        {/* Sun Icon (shown in dark mode) */}
        <Sun className="h-5 w-5 absolute inset-0 rotate-90 scale-0 transition-all duration-350 dark:rotate-0 dark:scale-100 text-amber-500" />
        {/* Moon Icon (shown in light mode) */}
        <Moon className="h-5 w-5 absolute inset-0 rotate-0 scale-100 transition-all duration-350 dark:-rotate-90 dark:scale-0 text-slate-500" />
      </div>
    </button>
  )
}
