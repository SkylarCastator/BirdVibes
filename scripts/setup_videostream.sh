#!/usr/bin/env bash
# Setup/update the video stream service and camera configuration
# Run this after pulling new code or to fix video stream issues:
#   sudo ./scripts/setup_videostream.sh
set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo: sudo $0"
  exit 1
fi

# Detect the installing user (not root)
if [ -n "$SUDO_USER" ]; then
  INSTALL_USER="$SUDO_USER"
  INSTALL_HOME=$(eval echo "~$SUDO_USER")
else
  INSTALL_USER="$USER"
  INSTALL_HOME="$HOME"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== BirdVibes Video Stream Setup ==="
echo "User: $INSTALL_USER"
echo "Project: $PROJECT_DIR"
echo ""

# --- 1. Install rpicam-apps if missing ---
echo "[1/5] Checking camera tools..."
if command -v rpicam-vid &>/dev/null; then
  echo "  rpicam-vid: found ($(which rpicam-vid))"
elif command -v libcamera-vid &>/dev/null; then
  echo "  libcamera-vid: found ($(which libcamera-vid))"
else
  echo "  No camera tool found. Installing rpicam-apps..."
  apt-get update -qq
  apt-get install -y rpicam-apps || echo "  WARNING: rpicam-apps not available. Try: sudo apt install libcamera-apps"
fi

# --- 2. Configure boot config for camera ---
echo ""
echo "[2/5] Configuring boot config for camera..."
BOOT_CONFIG=""
if [ -f /boot/firmware/config.txt ]; then
  BOOT_CONFIG=/boot/firmware/config.txt
elif [ -f /boot/config.txt ]; then
  BOOT_CONFIG=/boot/config.txt
fi

if [ -n "$BOOT_CONFIG" ]; then
  echo "  Boot config: $BOOT_CONFIG"

  # camera_auto_detect=1
  if grep -q "^camera_auto_detect=1" "$BOOT_CONFIG"; then
    echo "  camera_auto_detect=1: already set"
  elif grep -q "^camera_auto_detect=" "$BOOT_CONFIG"; then
    sed -i 's/^camera_auto_detect=.*/camera_auto_detect=1/' "$BOOT_CONFIG"
    echo "  camera_auto_detect=1: updated"
  elif grep -q "^#camera_auto_detect=" "$BOOT_CONFIG"; then
    sed -i 's/^#camera_auto_detect=.*/camera_auto_detect=1/' "$BOOT_CONFIG"
    echo "  camera_auto_detect=1: uncommented and set"
  else
    echo "camera_auto_detect=1" >> "$BOOT_CONFIG"
    echo "  camera_auto_detect=1: added"
  fi

  # start_x MUST be disabled on Bookworm+ — it conflicts with libcamera
  if grep -q "^start_x=1" "$BOOT_CONFIG"; then
    sed -i 's/^start_x=1/start_x=0/' "$BOOT_CONFIG"
    echo "  start_x=0: disabled (conflicts with libcamera on Bookworm+)"
  elif grep -q "^start_x=" "$BOOT_CONFIG"; then
    echo "  start_x: already not set to 1"
  else
    echo "  start_x: not present (OK for libcamera)"
  fi

  # gpu_mem >= 128
  if grep -q "^gpu_mem=" "$BOOT_CONFIG"; then
    current=$(grep "^gpu_mem=" "$BOOT_CONFIG" | head -1 | cut -d= -f2)
    if [ "$current" -ge 128 ] 2>/dev/null; then
      echo "  gpu_mem=$current: OK"
    else
      sed -i 's/^gpu_mem=.*/gpu_mem=128/' "$BOOT_CONFIG"
      echo "  gpu_mem=128: updated (was $current)"
    fi
  else
    echo "gpu_mem=128" >> "$BOOT_CONFIG"
    echo "  gpu_mem=128: added"
  fi
else
  echo "  No Raspberry Pi boot config found (not a Pi?), skipping"
fi

# --- 3. Symlink scripts ---
echo ""
echo "[3/5] Installing scripts..."
ln -sf "$PROJECT_DIR/scripts/videostream.sh" /usr/local/bin/videostream.sh
ln -sf "$PROJECT_DIR/scripts/mjpeg_server.py" /usr/local/bin/mjpeg_server.py
echo "  Linked videostream.sh -> /usr/local/bin/"
echo "  Linked mjpeg_server.py -> /usr/local/bin/"

# --- 4. Install and enable systemd service ---
echo ""
echo "[4/5] Installing systemd service..."
cat << EOF > "$PROJECT_DIR/templates/videostream.service"
[Unit]
Description=BirdNET-Pi Video Stream
After=network-online.target
Requires=network-online.target
[Service]
Restart=always
Type=simple
RestartSec=3
User=${INSTALL_USER}
ExecStart=/usr/local/bin/videostream.sh
[Install]
WantedBy=multi-user.target
EOF

ln -sf "$PROJECT_DIR/templates/videostream.service" /usr/lib/systemd/system/videostream.service
systemctl daemon-reload
systemctl enable videostream.service
echo "  Service installed and enabled"

# Start or restart the service
systemctl restart videostream.service
sleep 2
if systemctl is-active --quiet videostream.service; then
  echo "  Service is running"
else
  echo "  WARNING: Service failed to start. Check: journalctl -u videostream.service"
fi

# --- 5. Add user to video group ---
echo ""
echo "[5/5] Checking permissions..."
if id -nG "$INSTALL_USER" | grep -qw video; then
  echo "  User $INSTALL_USER already in video group"
else
  usermod -aG video "$INSTALL_USER"
  echo "  Added $INSTALL_USER to video group"
fi

# --- Summary ---
echo ""
echo "=== Setup Complete ==="
echo ""

# Check camera
echo "Camera check:"
ls /dev/video* 2>/dev/null && echo "  Video devices found" || echo "  WARNING: No video devices found"
echo ""

# Check service
echo "Service status:"
systemctl status videostream.service --no-pager -l 2>/dev/null | head -15
echo ""

# Check if reboot needed
NEEDS_REBOOT=false
if [ -n "$BOOT_CONFIG" ]; then
  # If start_x wasn't already enabled before we changed it, reboot is needed
  if ! grep -q "^start_x=1" "$BOOT_CONFIG" 2>/dev/null; then
    NEEDS_REBOOT=true
  fi
fi

if [ "$NEEDS_REBOOT" = true ]; then
  echo "*** REBOOT REQUIRED for boot config changes to take effect ***"
  echo "Run: sudo reboot"
else
  echo "Try accessing the video stream at http://$(hostname -I | awk '{print $1}'):8081/"
  echo "Or check health: http://$(hostname -I | awk '{print $1}'):8081/health"
fi
