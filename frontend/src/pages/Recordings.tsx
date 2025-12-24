import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRecordingDates, useRecordingsByDate } from '@/hooks/useApi'
import { Bird, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function Recordings() {
  const { data: dates, isLoading: datesLoading } = useRecordingDates()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedDate = dates?.[selectedIndex]
  const { data: recordings, isLoading: recordingsLoading } = useRecordingsByDate(
    selectedDate ?? '',
    { limit: 100 }
  )

  const canPrev = selectedIndex < (dates?.length ?? 0) - 1
  const canNext = selectedIndex > 0

  const goToPrev = () => canPrev && setSelectedIndex(selectedIndex + 1)
  const goToNext = () => canNext && setSelectedIndex(selectedIndex - 1)

  if (datesLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (!dates?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Recordings</h2>
        <p className="text-muted-foreground">No bird recordings found yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Recordings</h1>
        <p className="text-muted-foreground">Browse detections by date</p>
      </div>

      {/* Date navigation */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            disabled={!canPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-medium">{selectedDate && formatDate(selectedDate)}</p>
            <p className="text-sm text-muted-foreground">
              {recordings?.length ?? 0} detections
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={!canNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Recordings list */}
      <Card>
        <CardHeader>
          <CardTitle>Detections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recordingsLoading ? (
            <p className="py-4 text-center text-muted-foreground">Loading...</p>
          ) : recordings?.length ? (
            recordings.map((r, i) => (
              <Link
                key={`${r.Time}-${r.Sci_Name}-${i}`}
                to={`/species/${encodeURIComponent(r.Sci_Name)}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bird className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.Com_Name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.Time} · {Math.round(r.Confidence * 100)}%
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">No detections on this date</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
