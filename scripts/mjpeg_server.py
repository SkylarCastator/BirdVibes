#!/usr/bin/env python3
"""MJPEG streaming server for Raspberry Pi camera.

Launches rpicam-vid (or libcamera-vid) to capture MJPEG frames and serves them
over HTTP as multipart/x-mixed-replace for browser <img> tag consumption.
"""

import argparse
import subprocess
import sys
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# JPEG markers
SOI = b'\xff\xd8'
EOI = b'\xff\xd9'


class FrameBuffer:
    """Thread-safe container for the latest JPEG frame."""

    def __init__(self):
        self._frame = None
        self._condition = threading.Condition()

    def update(self, frame):
        with self._condition:
            self._frame = frame
            self._condition.notify_all()

    def wait_for_frame(self, timeout=5.0):
        with self._condition:
            self._condition.wait(timeout=timeout)
            return self._frame


frame_buffer = FrameBuffer()


def capture_frames(command):
    """Read MJPEG stream from subprocess stdout, extract JPEG frames."""
    proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    buf = b''
    try:
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
    finally:
        proc.terminate()
        proc.wait()


class MJPEGHandler(BaseHTTPRequestHandler):
    """Serve MJPEG stream as multipart/x-mixed-replace."""

    def do_GET(self):
        if self.path != '/':
            self.send_error(404)
            return

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

    command = find_camera_command(args.width, args.height, args.fps, args.quality)
    if command is None:
        print('Error: Neither rpicam-vid nor libcamera-vid found.', file=sys.stderr)
        sys.exit(1)

    print(f'Starting capture: {" ".join(command)}')
    capture_thread = threading.Thread(target=capture_frames, args=(command,), daemon=True)
    capture_thread.start()

    server = HTTPServer(('0.0.0.0', args.port), MJPEGHandler)
    print(f'MJPEG server listening on port {args.port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()


if __name__ == '__main__':
    main()
