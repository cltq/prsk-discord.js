#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
msg()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[-]${NC} $1"; }

SERVICE_NAME="prsk-discord"
USER_DIR="${HOME}/.config/systemd/user"
SERVICE_FILE="${USER_DIR}/${SERVICE_NAME}.service"

# ---- Flags ----
case "${1:-}" in
    --install-systemd)
        msg "ติดตั้ง user systemd service..."
        mkdir -p "$USER_DIR"
        cp "$SCRIPT_DIR/prsk-discord.service" "$SERVICE_FILE"
        systemctl --user daemon-reload
        systemctl --user enable "$SERVICE_NAME"
        systemctl --user start "$SERVICE_NAME"
        loginctl enable-linger "$(whoami)" 2>/dev/null || true
        msg "Service ติดตั้งแล้ว — สถานะ:"
        systemctl --user status "$SERVICE_NAME" --no-pager || true
        exit 0
        ;;
    --remove)
        msg "ลบ user systemd service..."
        systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
        systemctl --user disable "$SERVICE_NAME" 2>/dev/null || true
        rm -f "$SERVICE_FILE"
        systemctl --user daemon-reload
        msg "ลบเรียบร้อย"
        exit 0
        ;;
esac

# ---- Normal run (no flags) ----

detect_os() {
    case "$(uname -s)" in
        Linux*)   echo linux;;
        Darwin*)  echo macos;;
        MINGW*|MSYS*|CYGWIN*) echo windows;;
        *)        echo unknown;;
    esac
}

detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif command -v lsb_release &>/dev/null; then
        lsb_release -si | tr '[:upper:]' '[:lower:]'
    else
        echo unknown
    fi
}

install_pkg() {
    local pkg=$1
    msg "ติดตั้ง $pkg..."
    case $DISTRO in
        ubuntu|debian|pop|linuxmint|elementary|kali)
            sudo apt-get update -qq && sudo apt-get install -y -qq "$pkg" ;;
        fedora|rhel|centos)
            sudo dnf install -y "$pkg" ;;
        arch|manjaro|endeavouros)
            sudo pacman -S --noconfirm "$pkg" ;;
        alpine)
            sudo apk add "$pkg" ;;
        opensuse*|suse)
            sudo zypper install -y "$pkg" ;;
        *) warn "ไม่รู้จัก distro '$DISTRO' — กรุณาติดตั้ง $pkg เอง" ;;
    esac
}

OS=$(detect_os)
DISTRO=$(detect_distro)
msg "ระบบ: $OS ($DISTRO)"

# ---- Bun ----
if ! command -v bun &>/dev/null; then
    warn "ไม่พบ Bun กำลังติดตั้ง..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi
msg "Bun: $(bun --version 2>&1)"

# ---- ffmpeg ----
if ! command -v ffmpeg &>/dev/null; then
    warn "ไม่พบ ffmpeg กำลังติดตั้ง..."
    case $OS in
        linux) install_pkg ffmpeg ;;
        macos)
            if command -v brew &>/dev/null; then brew install ffmpeg
            else warn "กรุณาติดตั้ง ffmpeg: brew install ffmpeg"; fi ;;
        windows) warn "กรุณาติดตั้ง ffmpeg จาก https://ffmpeg.org";;
    esac
fi
command -v ffmpeg &>/dev/null && msg "ffmpeg: $(ffmpeg -version 2>&1 | head -1)" || warn "ffmpeg ไม่พร้อม — เสียงจะไม่ทำงาน"

# ---- Git pull ----
msg "ตรวจสอบการอัปเดตจาก GitHub..."
REMOTE_URL="origin"
if command -v git &>/dev/null; then
    if git remote get-url "$REMOTE_URL" &>/dev/null; then
        git fetch "$REMOTE_URL" 2>&1 || warn "fetch ล้มเหลว — ข้าม"
        LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
        REMOTE=$(git rev-parse "@{upstream}" 2>/dev/null || echo "")
        if [ -n "$LOCAL" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
            msg "พบการอัปเดต — กำลัง pull..."
            git pull --ff-only "$REMOTE_URL" main 2>&1 || warn "pull ล้มเหลว — ใช้โค้ดเดิม"
        else
            msg "โค้ดล่าสุดแล้ว"
        fi
    else
        warn "ไม่มี remote '$REMOTE_URL' — ข้าม git pull"
    fi
else
    warn "ไม่พบ git — ข้ามการตรวจสอบอัปเดต"
fi

# ---- bun install & build ----
msg "ติดตั้ง dependencies..."
bun install --frozen-lockfile

msg "Build TypeScript..."
bun run build

# ---- .env ----
if [ ! -f .env ]; then
    err "ไม่พบไฟล์ .env"
    err "คัดลอกจาก .env.example และใส่ BOT_TOKEN"
    exit 1
fi

set -a; source .env; set +a

BOT_TOKEN_LEN=${#BOT_TOKEN}
if [ "$BOT_TOKEN_LEN" -lt 20 ]; then
    err "BOT_TOKEN ไม่ถูกต้อง (length=$BOT_TOKEN_LEN) — ตรวจสอบ .env"
    exit 1
fi
msg "BOT_TOKEN: loaded (${BOT_TOKEN_LEN} chars)"

msg "เริ่มบอท..."
exec bun run start
