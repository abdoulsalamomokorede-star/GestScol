import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  id?: string
}

export function DatePicker({ date, setDate, placeholder = "jj/mm/aaaa", className, id }: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  // Synchronise le champ texte quand la date est modifiée (via le calendrier ou de l'extérieur)
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"))
    } else {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    
    // Auto-formatage : ajout automatique des '/'
    if (val.length > inputValue.length) {
      val = val.replace(/\D/g, '') // Ne garde que les chiffres
      if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2)
      if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5)
      val = val.substring(0, 10)
    }

    setInputValue(val)
    
    // Parse manuellement si la saisie est complète
    if (val.length === 10) {
      const parts = val.split('/')
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        const y = parseInt(parts[2], 10)
        const parsedDate = new Date(y, m, d)
        
        if (!isNaN(parsedDate.getTime()) && parsedDate.getDate() === d) {
          setDate(parsedDate)
        }
      }
    } else if (val === "") {
      setDate(undefined)
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className={cn(
          "flex h-10 w-full rounded-xl border border-border bg-background px-3 pl-9 py-2 text-sm font-semibold file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border shadow-md" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setIsPopoverOpen(false)
            }}

            captionLayout="dropdown"

            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
