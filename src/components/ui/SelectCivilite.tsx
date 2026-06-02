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
      <Label htmlFor="civilite" className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
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
            "text-xs h-9 bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700 focus-visible:ring-slate-500/20", 
            error && "border-red-500",
            className
          )}
        >
          <SelectValue placeholder="Sélectionner une civilité" />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
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
