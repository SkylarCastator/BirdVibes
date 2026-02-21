#!/usr/bin/env bash
# Live Video Stream Service Script
source /etc/birdnet/birdnet.conf

# Read the logging level from the configuration option
LOGGING_LEVEL="${LogLevel_VideoStreamService}"
# If empty for some reason default to log level of error
[ -z $LOGGING_LEVEL ] && LOGGING_LEVEL='error'
# Additionally if we're at debug or info level then allow printing of script commands and variables
if [ "$LOGGING_LEVEL" == "info" ] || [ "$LOGGING_LEVEL" == "debug" ];then
  # Enable printing of commands/variables etc to terminal for debugging
  set -x
fi

PORT="${VIDEO_STREAM_PORT:-8081}"
WIDTH="${VIDEO_STREAM_WIDTH:-1280}"
HEIGHT="${VIDEO_STREAM_HEIGHT:-720}"
FPS="${VIDEO_STREAM_FPS:-15}"
QUALITY="${VIDEO_STREAM_QUALITY:-50}"

# Log startup diagnostics
echo "=== Video Stream Service Starting ==="
echo "Config: ${WIDTH}x${HEIGHT} @ ${FPS}fps, quality=${QUALITY}, port=${PORT}"
echo "Video devices: $(ls /dev/video* 2>/dev/null || echo 'none found')"

if command -v rpicam-vid &>/dev/null; then
  echo "Camera tool: rpicam-vid (found)"
elif command -v libcamera-vid &>/dev/null; then
  echo "Camera tool: libcamera-vid (found)"
else
  echo "WARNING: No camera tool found (rpicam-vid, libcamera-vid)"
  echo "Install with: sudo apt install rpicam-apps"
  echo "Starting server anyway for diagnostics (check /health endpoint)"
fi

exec python3 /usr/local/bin/mjpeg_server.py \
  --port "$PORT" \
  --width "$WIDTH" \
  --height "$HEIGHT" \
  --fps "$FPS" \
  --quality "$QUALITY"
