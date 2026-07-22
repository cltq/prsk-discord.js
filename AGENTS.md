# AGENTS.md — สำหรับ AI Agents

## โครงสร้างโปรเจกต์ (TypeScript / discord.js)

```
src/
├── index.ts                          # Entry point — Client setup, health server, auto-reconnect
├── deploy-commands.ts                # Slash command registration script (BOT_CLIENT_ID required)
├── types/
│   └── index.ts                      # Shared TypeScript types (Command, GuildConfig)
├── utils/
│   ├── embed-builder.ts              # EmbedBuilder subclass (fluent API)
│   ├── guild-config.ts              # JSON-based per-guild config (guild_configs.json)
│   └── admin-guard.ts               # Admin allowlist + BOT_CREATOR check
├── commands/
│   ├── general/
│   │   ├── help.ts                   # /help — Dynamic embed + select menu
│   │   └── info.ts                   # /info — Bot info embed
│   ├── voice/
│   │   ├── join.ts                   # /join — Connect to voice channel
│   │   ├── leave.ts                  # /leave — Disconnect from voice
│   │   ├── say.ts                    # /say — TTS via edge-tts
│   │   └── voices.ts                 # /voices — List TTS voices
│   ├── system/
│   │   ├── uptime.ts                 # /uptime — Bot uptime + ping
│   │   ├── restart.ts               # /restart — Owner-only restart
│   │   ├── git.ts                    # /git — Git log viewer
│   │   └── changelog.ts             # /changelog — Changelog viewer (reads from changelogs/)
│   ├── fumi/
│   │   ├── auth.ts                   # /auth — OAuth2 verification
│   │   └── status.ts                 # /status — System status checks
│   └── prosekai/
│       ├── chart.ts                  # /chart — Song chart viewer (with autocomplete)
│       ├── songs.ts                  # /songs — Paginated song list
│       ├── crystal-info.ts           # /ข้อมูลการหาเพชร
│       ├── otp.ts                    # /ข้อมูลการยืมไอดี
│       ├── team.ts                   # /ข้อมูลการจัดทีม
│       └── time.ts                   # /ข้อมูลเวลาเซิร์ฟ
├── events/
│   ├── interaction-create.ts         # Routes slash commands + autocomplete
│   ├── voice-state-update.ts         # Bot disconnect → reconnect loop
│   └── message-create.ts             # Auto-read TTS for matching text channels
└── data/
    ├── crystal-info.txt              # Static info text (Thai)
    ├── otp.txt
    ├── team.txt
    └── time.txt
changelogs/                            # Changelog markdown files (changelog-YYYY-MM-DD-HH-MM.md)
allowlist.txt                          # Admin allowlist (guildId: userId, username)
guild_configs.json                     # Per-guild config (gitignored)
```

GitHub repo: `https://github.com/cltq/prsk-discord.js`

## กฎและแนวทาง

### Command conventions
- แต่ละ command file export default `{ data: SlashCommandBuilder, execute, autocomplete? }`
- ใช้ `SlashCommandBuilder` สำหรับสร้าง slash commands
- ใช้ `.setDMPermission(true/false)`, `.setContexts()`, `.setIntegrationTypes()` ตามความเหมาะสม
- ใช้ `.addStringOption()` etc. สำหรับ parameters
- ใช้ `ephemeral: true` สำหรับการตอบกลับส่วนตัว
- Autocomplete: export `autocomplete` function พร้อม `.setAutocomplete(true)` on the option

### EmbedBuilder
```typescript
import { EmbedBuilder } from "../utils/embed-builder.js";

EmbedBuilder.success("Title", "Description")     // สีเขียว
EmbedBuilder.error("Title", "Description")       // สีแดง
EmbedBuilder.warning("Title", "Description")     // สีเหลือง
EmbedBuilder.info("Title", "Description")        // สีฟ้า
EmbedBuilder.primary("Title", "Description")     // สีน้ำเงิน
EmbedBuilder.hex("#FF00FF", "Title", "Text")     // สีกำหนดเอง
new EmbedBuilder().setColorHex("#AABBCC").addInlineField("k", "v")
```

### Guild config
```typescript
import { getGuild, setGuild } from "../utils/guild-config.js";
const cfg = getGuild(guildId);       // returns GuildConfig
setGuild(guildId, "key", value);     // sets a key
```

### Admin guard
```typescript
import { adminCheck, isUserAdmin } from "../utils/admin-guard.js";

// In command execute:
if (!await adminCheck(interaction)) return;
```

### ข้อควรรู้
- Bot ใช้ `discord.js` 14.x + `@discordjs/voice`, Node.js 20+
- Voice/TTS ใช้ `edge-tts` npm package + ffmpeg
- Commands โหลดอัตโนมัติจาก `src/commands/` ด้วย recursive directory scan
- Events โหลดจาก `src/events/` ด้วย same pattern
- Data files อยู่ใน `src/data/` (อ่านด้วย `fs.readFileSync`)
- `unused/` directory ถูกลบแล้ว (Python legacy)
- `.env` ใช้ `dotenv` package (อ่านจาก `src/index.ts`)
- Docker image: `node:20-slim` + ffmpeg
- Deploy commands: `npm run deploy` (requires `BOT_CLIENT_ID` in .env)
- Build: `npm run build` (tsc) or `npm run dev` (tsx hot-reload)
- Changelogs เก็บใน `changelogs/` ชื่อไฟล์ `changelog-YYYY-MM-DD-HH-MM.md` (markdown)

### Changelog rules (บังคับ)
- **ทุก commit ต้องมี changelog** — เพิ่ม/แก้ไขไฟล์ใน `changelogs/` ทุกครั้ง
- ถ้าวันเดียวกันมี changelog อยู่แล้ว → **append** ลงไฟล์เดิม ห้ามสร้างไฟล์ใหม่
- ถ้าเป็นวันใหม่ → สร้างไฟล์ใหม่ `changelog-YYYY-MM-DD-HH-MM.md`
- แต่ละรายการต้องลงท้ายด้วย commit link: `` [`short_id`](https://github.com/cltq/prsk-discord.js/commit/short_id) ``
- ใช้ sections: `## Added`, `## Changed`, `## Fixed`, `## Removed` ตามความเหมาะสม

### การเพิ่ม command ใหม่
1. สร้าง `.ts` file ใน `src/commands/<category>/`
2. Export default `{ data: SlashCommandBuilder, execute: async (interaction) => {...} }`
3. Bot จะโหลดอัตโนมัติ (recursive scan `src/commands/**/*.ts`)
4. Run `npm run deploy` เพื่อ register commands กับ Discord
