'use client'

import { Globe } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function LanguageToggle() {
  const { lang, setLanguage } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 rounded-full transition-all duration-300 flex items-center justify-center focus:outline-none shrink-0" aria-label="Choisir la langue">
        <Globe className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border border-border">
        <DropdownMenuItem 
          onClick={() => setLanguage('fr')}
          className={`font-semibold cursor-pointer ${lang === 'fr' ? 'text-primary' : 'text-text'}`}
        >
          Français (FR)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')}
          className={`font-semibold cursor-pointer ${lang === 'ar' ? 'text-primary font-display' : 'text-text'}`}
        >
          العربية (AR)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
