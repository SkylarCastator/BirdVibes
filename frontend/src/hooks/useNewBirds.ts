import { useState, useEffect, useCallback, useMemo } from 'react'

const KNOWN_SPECIES_KEY = 'birdnet-known-species'
const LAST_CHECK_KEY = 'birdnet-last-collection-check'

export function useNewBirds(currentSpecies: string[] | undefined) {
  const [knownSpecies, setKnownSpecies] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(KNOWN_SPECIES_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Calculate new species (discovered species not in known set)
  const newSpecies = useMemo(() => {
    if (!currentSpecies) return []
    return currentSpecies.filter(s => !knownSpecies.has(s))
  }, [currentSpecies, knownSpecies])

  const newCount = newSpecies.length

  // Mark all current species as known (call when user views collection)
  const markAllAsKnown = useCallback(() => {
    if (!currentSpecies) return

    setKnownSpecies(prev => {
      const next = new Set(prev)
      currentSpecies.forEach(s => next.add(s))
      return next
    })

    try {
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
    } catch {
      // localStorage unavailable
    }
  }, [currentSpecies])

  // Persist known species
  useEffect(() => {
    try {
      localStorage.setItem(KNOWN_SPECIES_KEY, JSON.stringify([...knownSpecies]))
    } catch {
      // localStorage unavailable
    }
  }, [knownSpecies])

  return { newSpecies, newCount, markAllAsKnown }
}
