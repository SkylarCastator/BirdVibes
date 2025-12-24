import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'

interface AudioContextValue {
  getAudioContext: () => AudioContext
  currentlyPlaying: HTMLAudioElement | null
  setCurrentlyPlaying: (audio: HTMLAudioElement | null) => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [currentlyPlaying, setCurrentlyPlayingState] = useState<HTMLAudioElement | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const setCurrentlyPlaying = useCallback((audio: HTMLAudioElement | null) => {
    if (currentlyPlaying && currentlyPlaying !== audio) {
      currentlyPlaying.pause()
    }
    setCurrentlyPlayingState(audio)
  }, [currentlyPlaying])

  return (
    <AudioCtx.Provider value={{ getAudioContext, currentlyPlaying, setCurrentlyPlaying }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudioContext() {
  const ctx = useContext(AudioCtx)
  if (!ctx) {
    throw new Error('useAudioContext must be used within AudioProvider')
  }
  return ctx
}
