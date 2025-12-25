import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCollection, useEBirdRegion } from '@/hooks/useApi'
import { useFavorites } from '@/hooks/useFavorites'
import { useNewBirds } from '@/hooks/useNewBirds'
import { CollectionCard } from '@/components/collection/CollectionCard'
import { RarityBadge } from '@/components/collection/RarityBadge'
import { Search, Filter, Star, Grid3X3, Loader2 } from 'lucide-react'
import type { Rarity } from '@/lib/types'

type FilterOption = 'all' | 'discovered' | 'undiscovered' | 'favorites'
type SortOption = 'rarity' | 'alphabetical' | 'recent' | 'count'

const RARITY_ORDER: Record<Rarity, number> = {
  ultra_rare: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
  unknown: 4
}

export function Collection() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sort, setSort] = useState<SortOption>('rarity')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: collection, isLoading, error } = useCollection()
  const { data: region } = useEBirdRegion()
  const { toggleFavorite, isFavorite } = useFavorites()

  // Track discovered species for new bird notifications
  const discoveredSpecies = useMemo(() =>
    collection?.filter(s => s.discovered).map(s => s.sci_name) ?? [],
    [collection]
  )
  const { markAllAsKnown } = useNewBirds(discoveredSpecies)

  // Mark species as known when visiting collection
  useEffect(() => {
    if (collection && discoveredSpecies.length > 0) {
      markAllAsKnown()
    }
  }, [collection, discoveredSpecies.length, markAllAsKnown])

  const filtered = useMemo(() => {
    if (!collection) return []

    let result = [...collection]

    // Search filter (uses debounced value)
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase()
      result = result.filter(s =>
        s.com_name?.toLowerCase().includes(term) ||
        s.sci_name.toLowerCase().includes(term)
      )
    }

    // Status filter
    switch (filter) {
      case 'discovered':
        result = result.filter(s => s.discovered)
        break
      case 'undiscovered':
        result = result.filter(s => !s.discovered)
        break
      case 'favorites':
        result = result.filter(s => isFavorite(s.sci_name))
        break
    }

    // Sort
    switch (sort) {
      case 'alphabetical':
        result.sort((a, b) =>
          (a.com_name ?? a.sci_name).localeCompare(b.com_name ?? b.sci_name)
        )
        break
      case 'rarity':
        result.sort((a, b) => {
          const diff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
          if (diff !== 0) return diff
          // Secondary sort: discovered first within same rarity
          if (a.discovered !== b.discovered) return a.discovered ? -1 : 1
          return (a.com_name ?? a.sci_name).localeCompare(b.com_name ?? b.sci_name)
        })
        break
      case 'recent':
        result.sort((a, b) => {
          if (!a.last_seen && !b.last_seen) return 0
          if (!a.last_seen) return 1
          if (!b.last_seen) return -1
          return b.last_seen.localeCompare(a.last_seen)
        })
        break
      case 'count':
        result.sort((a, b) => b.count - a.count)
        break
    }

    return result
  }, [collection, debouncedSearch, filter, sort, isFavorite])

  const stats = useMemo(() => {
    if (!collection) return null
    return {
      total: collection.length,
      discovered: collection.filter(s => s.discovered).length,
      common: collection.filter(s => s.rarity === 'common').length,
      uncommon: collection.filter(s => s.rarity === 'uncommon').length,
      rare: collection.filter(s => s.rarity === 'rare').length,
      ultraRare: collection.filter(s => s.rarity === 'ultra_rare').length
    }
  }, [collection])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Grid3X3 className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Collection Unavailable</h2>
        <p className="text-muted-foreground">
          Make sure eBird API is configured in settings
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="w-6 h-6" />
            Collection
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? (
              'Loading regional species...'
            ) : stats ? (
              <>
                {stats.discovered} / {stats.total} species discovered
                {region && <span className="ml-1 text-xs">({region.region_name})</span>}
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {stats && (
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(stats.discovered / stats.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {Math.round((stats.discovered / stats.total) * 100)}% complete
          </p>
        </div>
      )}

      {/* Rarity breakdown */}
      {stats && (
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-1.5">
            <RarityBadge rarity="ultra_rare" size="sm" />
            <span className="text-xs text-muted-foreground">{stats.ultraRare}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RarityBadge rarity="rare" size="sm" />
            <span className="text-xs text-muted-foreground">{stats.rare}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RarityBadge rarity="uncommon" size="sm" />
            <span className="text-xs text-muted-foreground">{stats.uncommon}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RarityBadge rarity="common" size="sm" />
            <span className="text-xs text-muted-foreground">{stats.common}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search species..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Show</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'discovered', 'undiscovered', 'favorites'] as FilterOption[]).map(f => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f === 'favorites' && <Star className="w-3 h-3 mr-1" />}
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Sort by</p>
              <div className="flex flex-wrap gap-2">
                {(['rarity', 'alphabetical', 'recent', 'count'] as SortOption[]).map(s => (
                  <Button
                    key={s}
                    variant={sort === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSort(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading regional species...</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a moment on first load</p>
        </div>
      ) : !filtered.length ? (
        <div className="py-12 text-center text-muted-foreground">
          {search ? 'No matching species' : 'No species in this region'}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(sp => (
            <CollectionCard
              key={sp.sci_name}
              species={sp}
              isFavorite={isFavorite(sp.sci_name)}
              onToggleFavorite={() => toggleFavorite(sp.sci_name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
