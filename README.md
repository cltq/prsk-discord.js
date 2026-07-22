# SekaiUtils Discord Bot

Discord bot สำหรับเกม Project Sekai พร้อมระบบเสียง TTS, ข้อมูลเกม, ยืนยันตัวตน OAuth2, และคำสั่งระบบ

Built with **TypeScript** + **discord.js 14** + **@discordjs/voice**

## Features

### ข้อมูล Project Sekai
| คำสั่ง | รายละเอียด |
|---|---|
| `/help` | แสดงข้อมูลบอทและคำสั่งทั้งหมด (dropdown menu) |
| `/info` | แสดงข้อมูลบอท (ชื่อ, ID, เจ้าของ, อัปไทม์, status page, GitHub/Gitea links) |
| `/chart <song> [difficulty]` | ค้นหา chart เพลง (autocomplete) พร้อมแสดงรูปภาพ (JP / EN) |
| `/songs [page]` | แสดงรายชื่อเพลงทั้งหมด (paginated, 20 ต่อหน้า) |
| `/ข้อมูลการหาเพชร` | วิธีการฟาร์มเพชรในเซไก |
| `/ข้อมูลการจัดทีม` | การจัดทีมและการทำคะแนน |
| `/ข้อมูลเวลาเซิร์ฟ` | เวลาเซิร์ฟเวอร์ JP/Global |
| `/ข้อมูลการยืมไอดี` | การยืมไอดีและรหัสผ่านแบบครั้งเดียว (OTP) |

### เสียง TTS
| คำสั่ง | รายละเอียด |
|---|---|
| `/join [channel] [auto_read]` | เชื่อมต่อห้องเสียง (default: auto_read=True) |
| `/leave` | ออกจากห้องเสียง |
| `/say <text> [voice]` | พูดข้อความด้วย TTS (Microsoft Edge TTS) |
| `/voices` | แสดงรายชื่อเสียง TTS ที่ใช้งานได้ |

### ยืนยันตัวตน
| คำสั่ง | รายละเอียด |
|---|---|
| `/invite` | รับลิงก์เชิญบอท (ตอบกลับแบบ ephemeral) |

### ระบบ
| คำสั่ง | รายละเอียด |
|---|---|
| `/git [remote] [all]` | ดู commits จาก remote (GitHub / Gitea) |
| `/uptime` | แสดง uptime ของบอท + ping latency |
| `/restart` | รีสตาร์ทบอท (owner only) |
| `/changelog` | ดู changelog ล่าสุด (autocomplete) |
| `/status` | แสดงสถานะระบบ (Bot healthcheck, API, Discord API) |

## Tech Stack

- **Runtime:** Node.js 20+ / Bun
- **Bot Framework:** discord.js 14
- **Voice:** @discordjs/voice + ffmpeg
- **TTS:** node-edge-tts (Microsoft Edge TTS)
- **Language:** TypeScript (strict mode)
- **Docker:** node:20-slim

## การติดตั้ง

### ด้วย Bun (แนะนำ)
```bash
git clone https://github.com/cltq/prsk-discord.js.git
cd prsk-discord.js
cp .env.example .env
# แก้ไข .env: ใส่ BOT_TOKEN, BOT_CREATOR, BOT_CLIENT_ID
bun install
bun run build
bun run start
```

### ด้วย auto.sh
```bash
./auto.sh
```

### Docker
```bash
cp .env.example .env
# แก้ไข .env
docker compose up -d --build
```

### Development
```bash
bun install
bun run dev        # hot-reload ด้วย tsx
bun run deploy     # register slash commands (ต้องใส่ BOT_CLIENT_ID ใน .env)
```

## ระบบ Auto-Read

เชื่อมต่อห้องเสียงและให้บอทอ่านข้อความในแชทอัตโนมัติด้วย TTS:

```
/join                     # เชื่อมต่อห้องที่คุณอยู่ + เปิด auto-read
/join auto_read:False     # เชื่อมต่ออย่างเดียว ไม่เปิด auto-read
/join channel:#general    # เลือกห้องเสียง + เปิด auto-read
```

บอทจะ TTS ข้อความทุกข้อความในแชทที่มีชื่อเดียวกับห้องเสียงที่เชื่อมต่อ

## Health Check

บอทเปิด HTTP server บนพอร์ต `8899` สำหรับ health check:
```bash
curl http://localhost:8899
# => 200 ok
```

## โครงสร้างโปรเจกต์

```
src/
├── index.ts                          # Entry point — Client setup, health server, auto-reconnect
├── deploy-commands.ts                # Slash command registration script
├── types/
│   └── index.ts                      # Shared TypeScript types (Command, GuildConfig)
├── utils/
│   ├── embed-builder.ts              # EmbedBuilder subclass (fluent API)
│   ├── guild-config.ts              # JSON-based per-guild config
│   └── admin-guard.ts               # Admin allowlist + BOT_CREATOR check
├── commands/
│   ├── general/                      # /help, /info
│   ├── voice/                        # /join, /leave, /say, /voices
│   ├── system/                       # /uptime, /restart, /git, /changelog
│   ├── fumi/                         # /invite, /status
│   └── prosekai/                     # /chart, /songs, + 4 static info commands
├── events/
│   ├── interaction-create.ts         # Routes slash commands + autocomplete
│   ├── voice-state-update.ts         # Bot disconnect → reconnect loop
│   └── message-create.ts             # Auto-read TTS for matching text channels
└── data/
    ├── crystal-info.txt              # Static info text (Thai)
    ├── otp.txt
    ├── team.txt
    └── time.txt
changelogs/                            # Changelog markdown files
allowlist.txt                          # Admin allowlist (guildId: userId, username)
guild_configs.json                     # Per-guild config (gitignored)
```

## Systemd Service

มีตัวอย่างไฟล์ `prsk-discord.service` สำหรับรัน bot เป็น systemd service:

```bash
# แก้ไข User, Group, WorkingDirectory, ExecStart ในไฟล์ให้ตรงกับระบบของคุณ
sudo cp prsk-discord.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now prsk-discord

# ดู logs
journalctl -u prsk-discord -f
```

**สิ่งที่ต้องแก้ใน `prsk-discord.service`:**
- `User` / `Group` — ชื่อ user ของคุณ
- `WorkingDirectory` — path ที่เก็บโปรเจกต์
- `ExecStart` — path ไปยัง `auto.sh`

## ตัวแปรสภาพแวดล้อม (.env)

| ตัวแปร | จำเป็น | คำอธิบาย |
|---|---|---|
| `BOT_TOKEN` | ✓ | Token ของ Discord bot |
| `BOT_CREATOR` | ✓ | Discord user ID ของผู้สร้างบอท |
| `BOT_CLIENT_ID` | ✓* | Application ID สำหรับ deploy commands |
| `MACHINE_IP` | | IP สำหรับ status check (default: 127.0.0.1) |
| `DISCORD_CMD_AUTH_SK` | | Secret key สำหรับคำสั่ง `/auth` |
| `DISCORD_BOT_OA2_LINK` | | ลิงก์ OAuth2 สำหรับยืนยันตัวตน / คำสั่ง `/invite` |

\* จำเป็นเฉพาะตอน run `bun run deploy`

## NPM Scripts

| Script | คำอธิบาย |
|---|---|
| `bun run build` | Compile TypeScript → `dist/` |
| `bun run start` | รัน bot จาก `dist/index.js` |
| `bun run dev` | รัน bot ด้วย hot-reload (tsx) |
| `bun run deploy` | Register slash commands กับ Discord |
| `bun run typecheck` | ตรวจสอบ TypeScript types |

## Credits

พัฒนาโดย Fumi (cltq)
