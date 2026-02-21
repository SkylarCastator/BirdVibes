import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/Slider'
import { Radio, Play, Pause, Volume2, VolumeX, Loader2, WifiOff, Video, VideoOff, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useConfig } from '@/hooks/useApi'
import { api } from '@/lib/api'

type StreamStatus = 'idle' | 'connecting' | 'playing' | 'error'

interface VideoStatusData {
  enabled: boolean
  port: number
  camera_tool: string | null
  camera_tool_found: boolean
  video_devices: string[]
  service_active: boolean
  service_status: string
  service_logs: string
  server_reachable: boolean
  server_health: {
    status: string
    camera_command: string | null
    capture_running: boolean
    capture_error: string | null
    capture_stderr: string | null
    frame_count: number
    has_frame: boolean
    video_devices: string[]
    available_tools: Record<string, boolean>
  } | null
  boot_config: {
    path: string
    camera_auto_detect: boolean
    start_x: boolean
  } | null
}

export function LiveStream() {
  const { data: config } = useConfig()
  const audioRef = useRef<HTMLAudioElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [audioStatus, setAudioStatus] = useState<StreamStatus>('idle')
  const [videoStatus, setVideoStatus] = useState<StreamStatus>('idle')
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [videoDiag, setVideoDiag] = useState<VideoStatusData | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  // Stream URLs
  const audioStreamUrl = '/stream'
  const videoStreamUrl = '/video-stream'

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Auto-fetch diagnostics when video errors
  useEffect(() => {
    if (videoStatus === 'error') {
      fetchDiagnostics()
    }
  }, [videoStatus])

  const fetchDiagnostics = async () => {
    setDiagLoading(true)
    try {
      const data = await api.getVideoStatus()
      setVideoDiag(data)
    } catch {
      // API might not be reachable
      setVideoDiag(null)
    } finally {
      setDiagLoading(false)
    }
  }

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
      setVideoDiag(null)
    } else {
      setVideoStatus('connecting')
      if (imgRef.current) {
        imgRef.current.src = videoStreamUrl
      }
    }
  }

  const handleVideoLoad = () => {
    setVideoStatus('playing')
    setVideoDiag(null)
  }

  const handleVideoError = () => {
    if (videoStatus === 'connecting' || videoStatus === 'playing') {
      setVideoStatus('error')
    }
  }

  const DiagRow = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
    <div className="flex justify-between text-xs py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok === true ? 'text-green-500' : ok === false ? 'text-red-500' : ''}>
        {value}
      </span>
    </div>
  )

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

            {/* Error + Diagnostics */}
            {videoStatus === 'error' && (
              <div className="space-y-3">
                <div className="text-center p-4 bg-destructive/10 text-destructive rounded-lg">
                  <p className="font-medium">Video Stream Unavailable</p>
                  <p className="text-sm mt-1">
                    Check the diagnostics below to identify the issue
                  </p>
                </div>

                {/* Diagnostics panel */}
                <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Video Stream Diagnostics</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchDiagnostics}
                      disabled={diagLoading}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${diagLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  {diagLoading && !videoDiag && (
                    <p className="text-xs text-muted-foreground">Loading diagnostics...</p>
                  )}

                  {videoDiag && (
                    <div className="space-y-1 divide-y divide-border">
                      <DiagRow
                        label="Camera tool installed"
                        value={videoDiag.camera_tool ? `${videoDiag.camera_tool}` : 'Not found'}
                        ok={videoDiag.camera_tool_found}
                      />
                      <DiagRow
                        label="Video devices"
                        value={videoDiag.video_devices.length > 0 ? videoDiag.video_devices.join(', ') : 'None detected'}
                        ok={videoDiag.video_devices.length > 0}
                      />
                      <DiagRow
                        label="Service status"
                        value={videoDiag.service_status || 'unknown'}
                        ok={videoDiag.service_active}
                      />
                      <DiagRow
                        label="MJPEG server reachable"
                        value={videoDiag.server_reachable ? 'Yes' : 'No'}
                        ok={videoDiag.server_reachable}
                      />
                      {videoDiag.server_health && (
                        <>
                          <DiagRow
                            label="Capture running"
                            value={videoDiag.server_health.capture_running ? 'Yes' : 'No'}
                            ok={videoDiag.server_health.capture_running}
                          />
                          <DiagRow
                            label="Frames captured"
                            value={String(videoDiag.server_health.frame_count)}
                            ok={videoDiag.server_health.frame_count > 0}
                          />
                          {videoDiag.server_health.capture_error && (
                            <div className="pt-1">
                              <p className="text-xs text-red-500 font-medium">Capture error:</p>
                              <p className="text-xs text-red-400 font-mono mt-0.5">{videoDiag.server_health.capture_error}</p>
                            </div>
                          )}
                          {videoDiag.server_health.capture_stderr && (
                            <div className="pt-1">
                              <p className="text-xs text-muted-foreground font-medium">Camera output:</p>
                              <pre className="text-xs text-muted-foreground font-mono mt-0.5 whitespace-pre-wrap max-h-24 overflow-y-auto bg-black/10 rounded p-2">{videoDiag.server_health.capture_stderr}</pre>
                            </div>
                          )}
                        </>
                      )}
                      {videoDiag.boot_config && (
                        <>
                          <DiagRow
                            label="camera_auto_detect"
                            value={videoDiag.boot_config.camera_auto_detect ? 'Enabled' : 'Disabled'}
                            ok={videoDiag.boot_config.camera_auto_detect}
                          />
                          <DiagRow
                            label="start_x (camera firmware)"
                            value={videoDiag.boot_config.start_x ? 'Enabled' : 'Disabled'}
                            ok={videoDiag.boot_config.start_x}
                          />
                        </>
                      )}
                      {!videoDiag.boot_config && (
                        <DiagRow
                          label="Boot config"
                          value="Not a Raspberry Pi"
                          ok={undefined}
                        />
                      )}
                    </div>
                  )}

                  {/* Service logs */}
                  {videoDiag?.service_logs && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-xs"
                        onClick={() => setShowLogs(!showLogs)}
                      >
                        Service Logs
                        {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      {showLogs && (
                        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto bg-black/10 rounded p-2 mt-1">
                          {videoDiag.service_logs}
                        </pre>
                      )}
                    </div>
                  )}

                  {!videoDiag && !diagLoading && (
                    <p className="text-xs text-muted-foreground">
                      Could not reach diagnostics API. Make sure the backend is running.
                    </p>
                  )}
                </div>
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
