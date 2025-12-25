interface KiwiIconProps {
  className?: string
}

export function KiwiIcon({ className }: KiwiIconProps) {
  return (
    <img
      src="/kiwi.png"
      alt="BirdVibes"
      className={className}
    />
  )
}
