#!/usr/bin/env python3
"""MJPEG streaming server for Raspberry Pi camera.

Launches rpicam-vid (or libcamera-vid) to capture MJPEG frames and serves them
over HTTP as multipart/x-mixed-replace for browser <img> tag consumption.

Endpoints:
  GET /        - MJPEG video stream
  GET /health  - JSON diagnostic info
"""

import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

# JPEG markers
SOI = b'\xff\xd8'
EOI = b'\xff\xd9'


class FrameBuffer:
    """Thread-safe container for the latest JPEG frame."""

    def __init__(self):
        self._frame = None
        self._frame_count = 0
        self._condition = threading.Condition()

    def update(self, frame):
        with self._condition:
            self._frame = frame
            self._frame_count += 1
            self._condition.notify_all()

    def wait_for_frame(self, timeout=5.0):
        with self._condition:
            self._condition.wait(timeout=timeout)
            return self._frame

    @property
    def frame_count(self):
        with self._condition:
            return self._frame_count

    @property
    def has_frame(self):
        with self._condition:
            return self._frame is not None


frame_buffer = FrameBuffer()

# Global status tracking
server_status = {
    'camera_command': None,
    'camera_command_found': False,
    'capture_running': False,
    'capture_error': None,
    'capture_stderr': '',
    'started_at': None,
    'video_devices': [],
}


def detect_video_devices():
    """List available /dev/video* devices."""
    return sorted(glob.glob('/dev/video*'))


def detect_camera_tools():
    """Check which camera tools are available."""
    tools = {}
    for cmd in ('rpicam-vid', 'libcamera-vid', 'ffmpeg'):
        tools[cmd] = shutil.which(cmd) is not None
    return tools


def capture_frames(command):
    """Read MJPEG stream from subprocess stdout, extract JPEG frames."""
    server_status['capture_running'] = True
    server_status['capture_error'] = None
    server_status['capture_stderr'] = ''

    try:
        proc = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # Read stderr in a separate thread
        def read_stderr():
            for line in proc.stderr:
                decoded = line.decode('utf-8', errors='replace').strip()
                if decoded:
                    print(f'[camera] {decoded}', file=sys.stderr)
                    # Keep last 2000 chars of stderr for diagnostics
                    server_status['capture_stderr'] = (
                        server_status['capture_stderr'] + decoded + '\n'
                    )[-2000:]

        stderr_thread = threading.Thread(target=read_stderr, daemon=True)
        stderr_thread.start()

        buf = b''
        while True:
            chunk = proc.stdout.read(4096)
            if not chunk:
                break
            buf += chunk
            while True:
                start = buf.find(SOI)
                if start == -1:
                    buf = b''
                    break
                end = buf.find(EOI, start + 2)
                if end == -1:
                    buf = buf[start:]
                    break
                frame = buf[start:end + 2]
                frame_buffer.update(frame)
                buf = buf[end + 2:]

        # Process exited
        ret = proc.wait()
        if ret != 0:
            server_status['capture_error'] = (
                f'Camera process exited with code {ret}'
            )
    except Exception as e:
        server_status['capture_error'] = str(e)
    finally:
        server_status['capture_running'] = False


class MJPEGHandler(BaseHTTPRequestHandler):
    """Serve MJPEG stream and health endpoint."""

    def do_GET(self):
        if self.path == '/health':
            self._handle_health()
        elif self.path == '/':
            self._handle_stream()
        else:
            self.send_error(404)

    def _handle_health(self):
        """Return JSON diagnostics."""
        tools = detect_camera_tools()
        devices = detect_video_devices()
        health = {
            'status': 'ok' if server_status['capture_running'] and frame_buffer.has_frame else 'error',
            'camera_command': server_status['camera_command'],
            'camera_command_found': server_status['camera_command_found'],
            'capture_running': server_status['capture_running'],
            'capture_error': server_status['capture_error'],
            'capture_stderr': server_status['capture_stderr'][-500:] if server_status['capture_stderr'] else None,
            'frame_count': frame_buffer.frame_count,
            'has_frame': frame_buffer.has_frame,
            'video_devices': devices,
            'available_tools': tools,
            'started_at': server_status['started_at'],
            'uptime_seconds': int(time.time() - server_status['started_at']) if server_status['started_at'] else 0,
        }
        body = json.dumps(health, indent=2).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _handle_stream(self):
        """Serve MJPEG multipart stream."""
        self.send_response(200)
        self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        try:
            while True:
                frame = frame_buffer.wait_for_frame(timeout=5.0)
                if frame is None:
                    continue
                self.wfile.write(b'--frame\r\n')
                self.wfile.write(b'Content-Type: image/jpeg\r\n')
                self.wfile.write(f'Content-Length: {len(frame)}\r\n'.encode())
                self.wfile.write(b'\r\n')
                self.wfile.write(frame)
                self.wfile.write(b'\r\n')
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format, *args):
        """Suppress default request logging."""
        pass


def find_camera_command(width, height, fps, quality):
    """Try rpicam-vid first, then libcamera-vid."""
    base_args = [
        '--codec', 'mjpeg',
        '--width', str(width),
        '--height', str(height),
        '--framerate', str(fps),
        '-q', str(quality),
        '-t', '0',
        '--output', '-',
    ]
    for cmd in ('rpicam-vid', 'libcamera-vid'):
        try:
            subprocess.run([cmd, '--help'], stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL, timeout=5)
            return [cmd] + base_args
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return None


def main():
    parser = argparse.ArgumentParser(description='MJPEG streaming server')
    parser.add_argument('--port', type=int, default=8081)
    parser.add_argument('--width', type=int, default=1280)
    parser.add_argument('--height', type=int, default=720)
    parser.add_argument('--fps', type=int, default=15)
    parser.add_argument('--quality', type=int, default=50)
    args = parser.parse_args()

    server_status['started_at'] = time.time()
    server_status['video_devices'] = detect_video_devices()

    # Log startup diagnostics
    tools = detect_camera_tools()
    print(f'Video devices: {server_status["video_devices"]}')
    print(f'Available tools: {tools}')

    command = find_camera_command(args.width, args.height, args.fps, args.quality)
    server_status['camera_command'] = ' '.join(command) if command else None
    server_status['camera_command_found'] = command is not None

    if command is None:
        print('WARNING: No camera command found (rpicam-vid, libcamera-vid).', file=sys.stderr)
        print('The /health endpoint is still available for diagnostics.', file=sys.stderr)
    else:
        print(f'Starting capture: {" ".join(command)}')
        capture_thread = threading.Thread(target=capture_frames, args=(command,), daemon=True)
        capture_thread.start()

    # Always start the HTTP server (so /health is reachable even without a camera)
    server = HTTPServer(('0.0.0.0', args.port), MJPEGHandler)
    print(f'MJPEG server listening on port {args.port}')
    print(f'  Stream: http://0.0.0.0:{args.port}/')
    print(f'  Health: http://0.0.0.0:{args.port}/health')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()


if __name__ == '__main__':
    main()
