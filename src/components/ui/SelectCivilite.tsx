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
import { useTranslation } from '@/hooks/useTranslation'

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
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="civilite" className="text-slate-700 dark:text-slate-300 text-start">
        {t('enseignants.modal.civilite_label', "Civilité")} <span className="text-red-500">*</span>
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
          <SelectValue placeholder={t('civilite.placeholder', "Sélectionner une civilité")} />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-900 border-slate-250/20 dark:border-border/60 text-slate-900 dark:text-slate-100">
          <SelectItem value="M">{t('civilite.m', "M. — Monsieur")}</SelectItem>
          <SelectItem value="Mme">{t('civilite.mme', "Mme — Madame")}</SelectItem>
          <SelectItem value="Mlle">{t('civilite.mlle', "Mlle — Mademoiselle")}</SelectItem>
          <SelectItem value="Dr">{t('civilite.dr', "Dr — Docteur")}</SelectItem>
          <SelectItem value="Pr">{t('civilite.pr', "Pr — Professeur")}</SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="text-[11px] text-red-500 text-start">{error}</p>}
    </div>
  )
}
