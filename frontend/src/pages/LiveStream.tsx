import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/Slider'
import { Radio, Play, Pause, Volume2, VolumeX, Loader2, WifiOff, Video, VideoOff } from 'lucide-react'
import { useConfig } from '@/hooks/useApi'

type StreamStatus = 'idle' | 'connecting' | 'playing' | 'error'

export function LiveStream() {
  const { data: config } = useConfig()
  const audioRef = useRef<HTMLAudioElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [audioStatus, setAudioStatus] = useState<StreamStatus>('idle')
  const [videoStatus, setVideoStatus] = useState<StreamStatus>('idle')
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  // Stream URLs
  const audioStreamUrl = '/stream'
  const videoStreamUrl = '/video-stream'

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const handleAudioPlay = () => {
    if (!audioRef.current) return

    if (audioStatus === 'playing') {
      audioRef.current.pause()
      audioRef.current.src = ''
      setAudioStatus('idle')
    } else {
      setAudioStatus('connecting')
      audioRef.current.src = audioStreamUrl
      audioRef.current.play().catch(() => {
        setAudioStatus('error')
      })
    }
  }

  const handleAudioCanPlay = () => {
    setAudioStatus('playing')
  }

  const handleAudioError = () => {
    if (audioStatus === 'connecting' || audioStatus === 'playing') {
      setAudioStatus('error')
    }
  }

  const handleAudioEnded = () => {
    setAudioStatus('idle')
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVideoToggle = () => {
    if (videoStatus === 'playing') {
      if (imgRef.current) {
        imgRef.current.src = ''
      }
      setVideoStatus('idle')
    } else {
      setVideoStatus('connecting')
      if (imgRef.current) {
        imgRef.current.src = videoStreamUrl
      }
    }
  }

  const handleVideoLoad = () => {
    setVideoStatus('playing')
  }

  const handleVideoError = () => {
    if (videoStatus === 'connecting' || videoStatus === 'playing') {
      setVideoStatus('error')
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="w-6 h-6" />
          Live Feed
        </h1>
        <p className="text-muted-foreground">
          {config?.video_stream_enabled && config?.livestream_enabled
            ? 'Watch and listen live from your station'
            : config?.video_stream_enabled
              ? 'Watch live video from your camera'
              : 'Listen to live audio from your microphone'}
        </p>
      </div>

      {/* Video Card */}
      {config?.video_stream_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {videoStatus === 'playing' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              Live Video
            </CardTitle>
            <CardDescription>
              {videoStatus === 'idle' && 'Click play to start watching'}
              {videoStatus === 'connecting' && 'Connecting to video stream...'}
              {videoStatus === 'playing' && 'Streaming live video'}
              {videoStatus === 'error' && 'Unable to connect to video stream'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video display */}
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img
                ref={imgRef}
                onLoad={handleVideoLoad}
                onError={handleVideoError}
                className="w-full h-full object-contain"
                alt="Live camera feed"
                style={{ display: videoStatus === 'playing' ? 'block' : 'none' }}
              />
              {videoStatus !== 'playing' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant={videoStatus === 'error' ? 'destructive' : 'secondary'}
                    onClick={handleVideoToggle}
                    disabled={videoStatus === 'connecting'}
                    className="w-20 h-20 rounded-full"
                  >
                    {videoStatus === 'connecting' ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : videoStatus === 'error' ? (
                      <VideoOff className="h-8 w-8" />
                    ) : (
                      <Video className="h-8 w-8" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Video controls */}
            {videoStatus === 'playing' && (
              <div className="flex justify-center">
                <Button
                  variant="destructive"
                  onClick={handleVideoToggle}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Video
                </Button>
              </div>
            )}

            {/* Error message */}
            {videoStatus === 'error' && (
              <div className="text-center p-4 bg-destructive/10 text-destructive rounded-lg">
                <p className="font-medium">Video Stream Unavailable</p>
                <p className="text-sm mt-1">
                  Make sure the video stream service is running and a camera is connected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audio Card */}
      {config?.livestream_enabled !== false && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {audioStatus === 'playing' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              Live Audio
            </CardTitle>
            <CardDescription>
              {audioStatus === 'idle' && 'Click play to start listening'}
              {audioStatus === 'connecting' && 'Connecting to stream...'}
              {audioStatus === 'playing' && 'Streaming live audio'}
              {audioStatus === 'error' && 'Unable to connect to stream'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              onCanPlay={handleAudioCanPlay}
              onError={handleAudioError}
              onEnded={handleAudioEnded}
            />

            {/* Play/Pause button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                variant={audioStatus === 'playing' ? 'destructive' : 'default'}
                onClick={handleAudioPlay}
                disabled={audioStatus === 'connecting'}
                className="w-32 h-32 rounded-full"
              >
                {audioStatus === 'connecting' ? (
                  <Loader2 className="h-12 w-12 animate-spin" />
                ) : audioStatus === 'playing' ? (
                  <Pause className="h-12 w-12" />
                ) : audioStatus === 'error' ? (
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
            {audioStatus === 'error' && (
              <div className="text-center p-4 bg-destructive/10 text-destructive rounded-lg">
                <p className="font-medium">Stream Unavailable</p>
                <p className="text-sm mt-1">
                  Make sure the livestream service is running
                </p>
              </div>
            )}

            {/* Info */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Audio is streamed directly from your microphone</p>
              <p className="text-xs">
                Tip: Keep this tab open while birding to hear what your station picks up
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stream info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Live Streaming</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The live stream uses Icecast2 to broadcast audio from your microphone
            in real-time. This is the same audio that BirdNET analyzes for bird
            detections.
          </p>
          {config?.video_stream_enabled && (
            <p>
              The video stream uses your Raspberry Pi camera to provide a live MJPEG
              feed directly in the browser.
            </p>
          )}
          <p>
            The stream is protected with the same authentication as the web
            interface.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
