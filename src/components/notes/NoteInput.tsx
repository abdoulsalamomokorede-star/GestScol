import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NoteInputProps {
  value: number | ''
  onChange: (value: number | '') => void
  disabled?: boolean
}

export default function NoteInput({ value, onChange, disabled }: NoteInputProps) {
  const [localValue, setLocalValue] = useState<string>(value !== '' ? value.toString() : '')

  useEffect(() => {
    setLocalValue(value !== '' ? value.toString() : '')
  }, [value])

  const handleBlur = () => {
    if (localValue === '') {
      if (value !== '') onChange('')
      return
    }
    const num = parseFloat(localValue)
    if (isNaN(num)) {
      setLocalValue(value !== '' ? value.toString() : '')
      return
    }
    // Borner entre 0 et 20
    const clamped = Math.max(0, Math.min(20, num))
    const finalVal = parseFloat(clamped.toFixed(2))
    
    setLocalValue(finalVal.toString())
    if (value !== finalVal) {
      onChange(finalVal)
    }
  }

  const isInvalid = localValue !== '' && (parseFloat(localValue) < 0 || parseFloat(localValue) > 20)
  const isDanger = value !== '' && value < 10

  return (
    <Input
      type="number"
      min={0}
      max={20}
      step={0.5}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      className={cn(
        "w-full min-w-[70px] text-center font-medium",
        isDanger && "text-danger border-danger/50 focus-visible:ring-danger",
        isInvalid && "border-danger focus-visible:ring-danger"
      )}
    />
  )
}
