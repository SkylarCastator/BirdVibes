interface KiwiIconProps {
  className?: string
}

export function KiwiIcon({ className }: KiwiIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Fluffy round body */}
      <path d="M4 14 Q2 10 5 7 Q8 4 13 5 Q16 6 17 9 Q18 12 16 15 Q14 18 10 18 Q6 18 4 14" />
      {/* Head bump */}
      <path d="M13 5 Q15 3 17 4 Q18 5 17 7" />
      {/* Long curved beak */}
      <path d="M17 7 Q20 7 22 8" />
      {/* Eye */}
      <circle cx="15.5" cy="6" r="0.7" fill="currentColor" />
      {/* Feather texture lines */}
      <path d="M6 10 Q7 11 6 12" />
      <path d="M8 8 Q9 9 8 10" />
      <path d="M10 12 Q11 13 10 14" />
      <path d="M7 14 Q8 15 7 16" />
      {/* Legs with feet */}
      <path d="M8 18 L7 21 M6 21 L8 21" />
      <path d="M12 18 L13 21 M12 21 L14 21" />
    </svg>
  )
}
