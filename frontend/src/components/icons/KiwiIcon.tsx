interface KiwiIconProps {
  className?: string
}

export function KiwiIcon({ className }: KiwiIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Body - rounded oval shape */}
      <ellipse cx="10" cy="14" rx="7" ry="5" />
      {/* Long thin beak */}
      <path d="M17 12 L23 10" />
      {/* Small eye */}
      <circle cx="15" cy="12" r="0.5" fill="currentColor" />
      {/* Legs */}
      <path d="M7 19 L6 22" />
      <path d="M11 19 L12 22" />
      {/* Small wing detail */}
      <path d="M8 12 Q6 14 8 16" />
    </svg>
  )
}
