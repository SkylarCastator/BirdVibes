import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onValueChange?: (value: number) => void
}

export function Slider({ className, value, onValueChange, ...props }: SliderProps) {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onValueChange?.(parseFloat(e.target.value))}
      className={cn(
        'w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
        '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
        '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md',
        '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
        className
      )}
      {...props}
    />
  )
}
