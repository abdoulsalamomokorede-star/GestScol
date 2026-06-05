'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Civilite } from '@/types'
import { cn } from '@/lib/utils'

interface SelectCiviliteProps {
  value: Civilite | ''
  onChange: (value: Civilite) => void
  error?: string
  disabled?: boolean
  className?: string
}

export function SelectCivilite({
  value,
  onChange,
  error,
  disabled,
  className,
}: SelectCiviliteProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="civilite" className="text-slate-700 dark:text-slate-300">
        Civilité <span className="text-red-500">*</span>
      </Label>
      <Select
        value={value}
        onValueChange={(val) => onChange(val as Civilite)}
        disabled={disabled}
      >
        <SelectTrigger 
          id="civilite" 
          className={cn(
            "text-xs h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-border/60 text-slate-900 dark:text-slate-100 focus:border-slate-300 focus-visible:ring-slate-200/50 rounded-xl", 
            error && "border-red-500",
            className
          )}
        >
          <SelectValue placeholder="Sélectionner une civilité" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-900 border-slate-250/20 dark:border-border/60 text-slate-900 dark:text-slate-100">
          <SelectItem value="M">M. — Monsieur</SelectItem>
          <SelectItem value="Mme">Mme — Madame</SelectItem>
          <SelectItem value="Mlle">Mlle — Mademoiselle</SelectItem>
          <SelectItem value="Dr">Dr — Docteur</SelectItem>
          <SelectItem value="Pr">Pr — Professeur</SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
