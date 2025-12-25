import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/Slider'
import { Radio, Play, Pause, Volume2, VolumeX, Loader2, WifiOff } from 'lucide-react'

type StreamStatus = 'idle' | 'connecting' | 'playing' | 'error'

export function LiveStream() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  // Stream URL - points to Icecast2 via Caddy proxy
  const streamUrl = '/stream'

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const handlePlay = () => {
    if (!audioRef.current) return

    if (status === 'playing') {
      audioRef.current.pause()
      audioRef.current.src = '' // Reset source to stop buffering
      setStatus('idle')
    } else {
      setStatus('connecting')
      audioRef.current.src = streamUrl
      audioRef.current.play().catch(() => {
        setStatus('error')
      })
    }
  }

  const handleCanPlay = () => {
    setStatus('playing')
  }

  const handleError = () => {
    if (status === 'connecting' || status === 'playing') {
      setStatus('error')
    }
  }

  const handleEnded = () => {
    setStatus('idle')
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="w-6 h-6" />
          Live Audio
        </h1>
        <p className="text-muted-foreground">
          Listen to live audio from your BirdNET-Pi microphone
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'playing' && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            Live Stream
          </CardTitle>
          <CardDescription>
            {status === 'idle' && 'Click play to start listening'}
            {status === 'connecting' && 'Connecting to stream...'}
            {status === 'playing' && 'Streaming live audio'}
            {status === 'error' && 'Unable to connect to stream'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onCanPlay={handleCanPlay}
            onError={handleError}
            onEnded={handleEnded}
          />

          {/* Play/Pause button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              variant={status === 'playing' ? 'destructive' : 'default'}
              onClick={handlePlay}
              disabled={status === 'connecting'}
              className="w-32 h-32 rounded-full"
            >
              {status === 'connecting' ? (
                <Loader2 className="h-12 w-12 animate-spin" />
              ) : status === 'playing' ? (
                <Pause className="h-12 w-12" />
              ) : status === 'error' ? (
                <WifiOff className="h-12 w-12" />
              ) : (
                <Play className="h-12 w-12 ml-2" />
              )}
            </Button>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={isMuted ? 0 : volume}
              onValueChange={(v) => {
                setVolume(v)
                if (v > 0) setIsMuted(false)
              }}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {isMuted ? 0 : volume}%
            </span>
          </div>

          {/* Error message */}
          {status === 'error' && (
            <div className="text-center p-4 bg-destructive/10 text-destructive rounded-lg">
              <p className="font-medium">Stream Unavailable</p>
              <p className="text-sm mt-1">
                Make sure the livestream service is running on your BirdNET-Pi
              </p>
            </div>
          )}

          {/* Info */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Audio is streamed directly from your BirdNET-Pi microphone</p>
            <p className="text-xs">
              Tip: Keep this tab open while birding to hear what your station picks up
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stream info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Live Streaming</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The live stream uses Icecast2 to broadcast audio from your BirdNET-Pi's
            microphone in real-time. This is the same audio that BirdNET analyzes
            for bird detections.
          </p>
          <p>
            The stream is protected with the same authentication as your BirdNET-Pi
            web interface.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
