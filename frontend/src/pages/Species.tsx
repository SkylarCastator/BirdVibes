import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSpeciesList } from '@/hooks/useApi'
import { SpeciesGallery } from '@/components/species/SpeciesGallery'
import { Bird, Search, ArrowUpDown, LayoutGrid, List } from 'lucide-react'
import { Link } from 'react-router'

type SortOption = 'occurrences' | 'confidence' | 'date' | 'alphabetical'
type ViewMode = 'list' | 'gallery'

export function Species() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('occurrences')
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const { data: species, isLoading } = useSpeciesList({ sort })

  const filtered = species?.filter((s) =>
    s.com_name.toLowerCase().includes(search.toLowerCase()) ||
    s.sci_name.toLowerCase().includes(search.toLowerCase())
  )

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'occurrences', label: 'Most seen' },
    { value: 'confidence', label: 'Highest confidence' },
    { value: 'date', label: 'Most recent' },
    { value: 'alphabetical', label: 'A-Z' },
  ]

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Species</h1>
        <p className="text-muted-foreground">
          {species?.length ?? 0} species detected
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sort options and view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={sort === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSort(option.value)}
            >
              <ArrowUpDown className="mr-1 h-3 w-3" />
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('gallery')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Species display */}
      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Loading...</p>
      ) : !filtered?.length ? (
        <p className="py-8 text-center text-muted-foreground">
          {search ? 'No matching species' : 'No species detected yet'}
        </p>
      ) : viewMode === 'gallery' ? (
        <SpeciesGallery species={filtered} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.sci_name} to={`/species/${encodeURIComponent(s.sci_name)}`}>
              <Card className="h-full transition-colors hover:bg-muted">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bird className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.com_name}</p>
                    <p className="truncate text-sm italic text-muted-foreground">{s.sci_name}</p>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span>{s.count} detections</span>
                      <span>{Math.round(s.max_confidence * 100)}% max</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
