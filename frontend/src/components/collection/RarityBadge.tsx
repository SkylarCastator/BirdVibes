import { cn } from '@/lib/utils'
import type { Rarity } from '@/lib/types'

interface RarityBadgeProps {
  rarity: Rarity
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const RARITY_CONFIG: Record<Rarity, { symbol: string; label: string; colors: string }> = {
  common: {
    symbol: '●',
    label: 'Common',
    colors: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  },
  uncommon: {
    symbol: '◆',
    label: 'Uncommon',
    colors: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  },
  rare: {
    symbol: '★',
    label: 'Rare',
    colors: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  },
  ultra_rare: {
    symbol: '★★',
    label: 'Ultra Rare',
    colors: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
  },
  unknown: {
    symbol: '?',
    label: 'Unknown',
    colors: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
  }
}

export function RarityBadge({ rarity, size = 'sm', showLabel, className }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity]

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        config.colors,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      <span>{config.symbol}</span>
      {(showLabel || size === 'lg') && <span>{config.label}</span>}
    </span>
  )
}
