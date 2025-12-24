import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/Slider'

interface AudioSpectrumPlayerProps {
  audioUrl: string
  title?: string
  subtitle?: string
  className?: string
  compact?: boolean
}

export function AudioSpectrumPlayer({
  audioUrl,
  title,
  subtitle,
  className,
  compact = false,
}: AudioSpectrumPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number>(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)

    audioContextRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source
  }, [])

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    const width = canvas.width
    const height = canvas.height
    const barWidth = (width / bufferLength) * 2.5
    const gap = 2

    ctx.clearRect(0, 0, width, height)

    // Pure cool tones - teals, blues, greens
    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, '#7a9e9e')   // Teal
    gradient.addColorStop(0.3, '#80a8b8') // Blue
    gradient.addColorStop(0.6, '#a8d0b8') // Seafoam
    gradient.addColorStop(1, '#b8dcd4')   // Mint

    let x = 0
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.9

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, height - barHeight, barWidth - gap, barHeight, 2)
      ctx.fill()

      x += barWidth
    }

    animationRef.current = requestAnimationFrame(drawSpectrum)
  }, [])

  const drawIdleSpectrum = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barCount = 64
    const barWidth = (width / barCount) * 2.5
    const gap = 2

    ctx.clearRect(0, 0, width, height)

    // Draw idle bars with subtle animation
    const time = Date.now() / 1000
    for (let i = 0; i < barCount; i++) {
      const barHeight = (Math.sin(time * 2 + i * 0.2) + 1) * 5 + 3
      ctx.fillStyle = 'rgba(122, 158, 158, 0.3)' // Soft teal #7a9e9e
      ctx.beginPath()
      ctx.roundRect(i * barWidth, height - barHeight, barWidth - gap, barHeight, 2)
      ctx.fill()
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      drawSpectrum()
    } else {
      cancelAnimationFrame(animationRef.current)
      drawIdleSpectrum()
    }

    return () => cancelAnimationFrame(animationRef.current)
  }, [isPlaying, drawSpectrum, drawIdleSpectrum])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      drawIdleSpectrum()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawIdleSpectrum])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      setIsLoading(true)
      try {
        initAudioContext()
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        await audio.play()
        setIsPlaying(true)
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = (value / 100) * duration
  }

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    const newVolume = value / 100
    setVolume(newVolume)
    audio.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isMuted) {
      audio.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => setProgress(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => { setIsPlaying(false); setProgress(0) }
    const handleError = () => setHasError(true)

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (hasError) {
    return (
      <div className={cn('rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive', className)}>
        Audio unavailable
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl bg-card border p-4', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />

      {/* Title/subtitle */}
      {(title || subtitle) && !compact && (
        <div className="mb-3">
          {title && <div className="font-medium text-sm truncate">{title}</div>}
          {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
        </div>
      )}

      {/* Spectrum visualizer */}
      <div className={cn('relative rounded-lg overflow-hidden bg-muted mb-3', compact ? 'h-12' : 'h-20')}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Progress slider */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground w-10">{formatTime(progress)}</span>
        <Slider
          value={duration ? (progress / duration) * 100 : 0}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(-5)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(5)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume */}
        {!compact && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={isMuted ? 0 : volume * 100}
              onValueChange={handleVolumeChange}
              max={100}
              className="w-20"
            />
          </div>
        )}
      </div>
    </div>
  )
}
