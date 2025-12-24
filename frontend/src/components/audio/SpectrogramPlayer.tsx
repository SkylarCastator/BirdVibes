import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Settings, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAudioContext } from './AudioContext'
import { useAudioProcessor, type GainLevel, type HighpassFreq, type LowpassFreq } from './useAudioProcessor'

const LEFT_MARGIN = 0.06
const RIGHT_MARGIN = 0.09

interface SpectrogramPlayerProps {
  audioUrl: string
  spectrogramUrl: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SpectrogramPlayer({
  audioUrl,
  spectrogramUrl,
  size = 'md',
  className,
}: SpectrogramPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { setCurrentlyPlaying } = useAudioContext()
  const processor = useAudioProcessor(audioRef.current)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const [gain, setGainState] = useState<GainLevel>('Off')
  const [highpass, setHighpassState] = useState<HighpassFreq>('Off')
  const [lowpass, setLowpassState] = useState<LowpassFreq>('Off')

  useEffect(() => {
    const saved = processor.getSavedSettings()
    setGainState(saved.gain)
    setHighpassState(saved.highpass)
    setLowpassState(saved.lowpass)
  }, [processor])

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      setIsLoading(true)
      try {
        processor.initAudioChain()
        if (gain !== 'Off') processor.setGain(gain)
        if (highpass !== 'Off') processor.setHighpass(highpass)
        if (lowpass !== 'Off') processor.setLowpass(lowpass)

        setCurrentlyPlaying(audio)
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [processor, gain, highpass, lowpass, setCurrentlyPlaying])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const container = containerRef.current
    if (!audio || !container || !audio.duration) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const playableWidth = rect.width * (1 - LEFT_MARGIN - RIGHT_MARGIN)
    const offset = rect.width * LEFT_MARGIN
    const seekFrac = Math.max(0, Math.min(1, (x - offset) / playableWidth))
    audio.currentTime = seekFrac * audio.duration
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    const handlePause = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => setHasError(true)

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  const handleGainChange = (level: GainLevel) => {
    setGainState(level)
    processor.setGain(level)
  }

  const handleHighpassChange = (freq: HighpassFreq) => {
    setHighpassState(freq)
    processor.setHighpass(freq)
  }

  const handleLowpassChange = (freq: LowpassFreq) => {
    setLowpassState(freq)
    processor.setLowpass(freq)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = audioUrl.split('/').pop() || 'audio.wav'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
  }

  const progressLeft = LEFT_MARGIN * 100 + progress * (100 - LEFT_MARGIN * 100 - RIGHT_MARGIN * 100)

  const sizeClasses = {
    sm: 'h-20',
    md: 'h-32',
    lg: 'h-48',
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative rounded-xl overflow-hidden bg-muted', sizeClasses[size], className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowSettings(false) }}
      onClick={handleSeek}
    >
      <audio ref={audioRef} src={audioUrl} preload="none" />

      <img
        src={spectrogramUrl}
        alt="Spectrogram"
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />

      {/* Progress indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-black/80 pointer-events-none transition-all"
        style={{ left: `${progressLeft}%` }}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white text-sm">
          Audio unavailable
        </div>
      )}

      {/* Play/pause overlay */}
      {(showControls || !isPlaying) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={(e) => { e.stopPropagation(); handlePlayPause() }}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </Button>
        </div>
      )}

      {/* Bottom controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); handleDownload() }}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Settings menu */}
      {showSettings && (
        <div
          className="absolute bottom-12 right-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <SettingsSection label="Gain (dB)">
            {(['Off', '6', '12', '18', '24', '30'] as GainLevel[]).map((level) => (
              <SettingsButton
                key={level}
                active={gain === level}
                onClick={() => handleGainChange(level)}
              >
                {level}
              </SettingsButton>
            ))}
          </SettingsSection>

          <SettingsSection label="High-pass (Hz)">
            {(['Off', '250', '500', '1000', '1500'] as HighpassFreq[]).map((freq) => (
              <SettingsButton
                key={freq}
                active={highpass === freq}
                onClick={() => handleHighpassChange(freq)}
              >
                {freq === 'Off' ? 'Off' : freq === '1000' ? '1k' : freq === '1500' ? '1.5k' : freq}
              </SettingsButton>
            ))}
          </SettingsSection>

          <SettingsSection label="Low-pass (Hz)">
            {(['Off', '2000', '4000', '8000'] as LowpassFreq[]).map((freq) => (
              <SettingsButton
                key={freq}
                active={lowpass === freq}
                onClick={() => handleLowpassChange(freq)}
              >
                {freq === 'Off' ? 'Off' : freq === '2000' ? '2k' : freq === '4000' ? '4k' : '8k'}
              </SettingsButton>
            ))}
          </SettingsSection>
        </div>
      )}
    </div>
  )
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

function SettingsButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={cn(
        'px-2 py-0.5 rounded text-xs transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-white/10 hover:bg-white/20'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
