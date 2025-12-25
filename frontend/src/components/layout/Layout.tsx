import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, Bird, Calendar, BarChart3, TrendingUp, Settings, Menu, X, Grid3X3, Radio } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useSpeciesList } from '@/hooks/useApi'
import { useNewBirds } from '@/hooks/useNewBirds'

const navItems = [
  { path: '/', label: 'Overview', icon: Home },
  { path: '/detections', label: 'Detections', icon: Bird },
  { path: '/species', label: 'Species', icon: BarChart3 },
  { path: '/collection', label: 'Collection', icon: Grid3X3 },
  { path: '/recordings', label: 'Recordings', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/live', label: 'Live', icon: Radio },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Track new birds for notification badge
  const { data: speciesList } = useSpeciesList()
  const discoveredSpecies = useMemo(() =>
    speciesList?.map(s => s.sci_name) ?? [],
    [speciesList]
  )
  const { newCount } = useNewBirds(discoveredSpecies)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Bird className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">BirdNET-Pi</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const showBadge = item.path === '/collection' && newCount > 0
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {newCount > 9 ? '9+' : newCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Bird className="h-6 w-6 text-primary" />
          <span className="font-bold">BirdNET-Pi</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={`fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 transform border-r border-border bg-card transition-transform md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const showBadge = item.path === '/collection' && newCount > 0
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {newCount > 9 ? '9+' : newCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="pt-14 md:ml-64 md:pt-0">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          const showBadge = item.path === '/collection' && newCount > 0
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {newCount > 9 ? '!' : newCount}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
