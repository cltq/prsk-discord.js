import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const JP_BASE = "https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main";
const EN_BASE = "https://raw.githubusercontent.com/Sekai-World/sekai-master-db-en-diff/main";

const SERVERS: [string, string][] = [
  ["\u{1F1EF}\u{1F1F5} JP", JP_BASE],
  ["\u{1F1FA}\u{1F1F8} EN", EN_BASE],
];

const DIFFICULTIES: Record<string, string> = {
  easy: "EASY", normal: "NORMAL", hard: "HARD", expert: "EXPERT", master: "MASTER", append: "APPEND",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#22CC44", normal: "#FFCC00", hard: "#FF8800", expert: "#FF2244", master: "#CC44FF", append: "#FF66AA",
};

const DIFFICULTY_ORDER = ["easy", "normal", "hard", "expert", "master", "append"];
const SONGS_PER_PAGE = 20;
const CHART_CDN = "https://storage.sekai.best/sekai-music-charts/jp";
const JACKET_CDN = "https://storage.sekai.best/sekai-jp-assets/music/jacket";

interface SongData { id: number; title: string; pronunciation?: string; composer?: string; assetbundleName: string; categories?: string[] }
interface DiffData { musicId: number; musicDifficulty: string; playLevel?: number; totalNoteCount?: number }
type ServerResult = { musics: SongData[]; diffMap: Map<number, DiffData[]> } | null;

const dataCache = new Map<string, { data: Record<string, ServerResult>; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchJson(url: string): Promise<any> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
  return resp.json();
}

async function fetchServer(base: string): Promise<{ musics: SongData[]; diffMap: Map<number, DiffData[]> }> {
  const [musics, diffs] = await Promise.all([
    fetchJson(`${base}/musics.json`) as Promise<SongData[]>,
    fetchJson(`${base}/musicDifficulties.json`) as Promise<DiffData[]>,
  ]);
  const diffMap = new Map<number, DiffData[]>();
  for (const d of diffs) {
    if (!diffMap.has(d.musicId)) diffMap.set(d.musicId, []);
    diffMap.get(d.musicId)!.push(d);
  }
  return { musics, diffMap };
}

async function fetchAll(): Promise<Record<string, ServerResult>> {
  const cached = dataCache.get("all");
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const results = await Promise.allSettled(SERVERS.map(([, base]) => fetchServer(base)));
  const data: Record<string, ServerResult> = {};
  for (let i = 0; i < SERVERS.length; i++) {
    const [label] = SERVERS[i];
    const r = results[i];
    data[label] = r.status === "fulfilled" ? r.value : null;
  }
  dataCache.set("all", { data, ts: Date.now() });
  return data;
}

function buildEnMap(allData: Record<string, ServerResult>): Map<number, string> {
  const enServer = allData["\u{1F1FA}\u{1F1F8} EN"];
  if (!enServer) return new Map();
  return new Map(enServer.musics.map((s) => [s.id, s.title]));
}

function chartImageUrl(songId: number, difficulty: string): string {
  return `${CHART_CDN}/${String(songId).padStart(4, "0")}/${difficulty}.png`;
}

function jacketUrl(name: string): string {
  return `${JACKET_CDN}/${name}/${name}.webp`;
}

function matchSong(query: string, serverData: ServerResult): SongData | null {
  if (!serverData) return null;
  const { musics } = serverData;
  const byId = musics.find((s) => String(s.id) === query);
  if (byId) return byId;
  const q = query.toLowerCase();
  const byTitle = musics.find((s) => (s.title ?? "").toLowerCase().includes(q));
  if (byTitle) return byTitle;
  return musics.find((s) => (s.pronunciation ?? "").toLowerCase().includes(q)) ?? null;
}

async function suggestSongs(interaction: AutocompleteInteraction, current: string): Promise<void> {
  try {
    const allData = await fetchAll();
    const enMap = buildEnMap(allData);
    const seenIds = new Set<number>();
    const suggestions: { name: string; value: string }[] = [];
    const q = current.toLowerCase();

    for (const [label] of SERVERS) {
      const server = allData[label];
      if (!server) continue;
      for (const s of server.musics) {
        if (seenIds.has(s.id)) continue;
        const title = s.title ?? "";
        const pron = s.pronunciation ?? "";
        if (title.toLowerCase().includes(q) || pron.toLowerCase().includes(q)) {
          seenIds.add(s.id);
          const enName = enMap.get(s.id);
          const display = enName ? `${title} (${enName})` : title;
          const tag = label.includes("JP") ? "\u{1F1EF}\u{1F1F5}" : "\u{1F1FA}\u{1F1F8}";
          suggestions.push({ name: `${tag} ${display}`, value: String(s.id) });
          if (suggestions.length >= 25) break;
        }
      }
      if (suggestions.length >= 25) break;
    }
    await interaction.respond(suggestions.slice(0, 25));
  } catch {
    await interaction.respond([{ name: "ไม่สามารถโหลดรายชื่อเพลงได้", value: "" }]);
  }
}

async function showSong(interaction: ChatInputCommandInteraction, song: SongData, charts: DiffData[], server: string, enMap: Map<number, string>): Promise<void> {
  const title = song.title ?? "(ไม่ทราบชื่อ)";
  const enName = enMap.get(song.id);
  const display = enName ? `${title} (${enName})` : title;
  const composer = song.composer ?? "(ไม่ทราบผู้แต่ง)";
  const categories = song.categories ?? ["original"];
  const category = categories[0] ?? "original";

  const embed = EmbedBuilder.hex("#FF66AA", `\u{1F3B5} ${display}`);
  embed.setFooter({ text: `ID: ${song.id} — Requested by ${interaction.user.displayName}` });
  embed.setThumbnail(jacketUrl(song.assetbundleName));
  embed.addInlineField("ผู้แต่ง", composer, false);
  embed.addInlineField("เซิร์ฟเวอร์", server, false);

  const seen = new Set<string>();
  const sorted = [...charts].sort(
    (a, b) => (DIFFICULTY_ORDER.indexOf(a.musicDifficulty) ?? 99) - (DIFFICULTY_ORDER.indexOf(b.musicDifficulty) ?? 99)
  );
  for (const d of sorted) {
    if (seen.has(d.musicDifficulty)) continue;
    seen.add(d.musicDifficulty);
    embed.addInlineField(
      `${DIFFICULTIES[d.musicDifficulty] ?? d.musicDifficulty} \u2605${d.playLevel ?? "?"}`,
      `โน้ต: ${d.totalNoteCount ?? "?"}`
    );
  }

  embed.addInlineField("หมวดหมู่", category, false);

  const master = charts.find((d) => d.musicDifficulty === "master");
  if (master) embed.setImage(chartImageUrl(song.id, "master"));

  await interaction.followUp({ embeds: [embed.toJSON()] });
}

async function showChart(interaction: ChatInputCommandInteraction, song: SongData, chart: DiffData, server: string, enMap: Map<number, string>): Promise<void> {
  const diff = chart.musicDifficulty;
  const title = song.title ?? "(ไม่ทราบชื่อ)";
  const enName = enMap.get(song.id);
  const display = enName ? `${title} (${enName})` : title;
  const level = chart.playLevel ?? "?";
  const notes = chart.totalNoteCount ?? "?";
  const color = DIFFICULTY_COLORS[diff] ?? "#FFFFFF";
  const label = DIFFICULTIES[diff] ?? diff.toUpperCase();

  const embed = EmbedBuilder.hex(color, `\u{1F3B5} ${display} — ${label} \u2605${level}`);
  embed.setFooter({ text: `ID: ${song.id} — Requested by ${interaction.user.displayName}` });
  embed.setImage(chartImageUrl(song.id, diff));
  embed.addInlineField("เซิร์ฟเวอร์", server, false);
  embed.addInlineField("โน้ตทั้งหมด", String(notes));

  await interaction.followUp({ embeds: [embed.toJSON()] });
}

export default {
  data: new SlashCommandBuilder()
    .setName("chart")
    .setDescription("ค้นหา chart เพลงใน Project Sekai (JP / EN)")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1)
    .addStringOption((opt) =>
      opt.setName("song").setDescription("ชื่อเพลง, ID, หรือเลือกจากรายการ").setRequired(true).setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("difficulty")
        .setDescription("ระดับ difficulty")
        .setRequired(false)
        .addChoices(
          ...Object.entries(DIFFICULTIES).map(([, v]) => ({ name: v, value: v.toLowerCase() }))
        )
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    const songQuery = interaction.options.getString("song", true);
    const difficulty = interaction.options.getString("difficulty");

    const allData = await fetchAll();
    const enMap = buildEnMap(allData);

    let matchedSong: SongData | null = null;
    let matchedLabel: string | null = null;

    for (const [label] of SERVERS) {
      const s = matchSong(songQuery, allData[label]);
      if (s) {
        matchedSong = s;
        matchedLabel = label;
        break;
      }
    }

    if (!matchedSong || !matchedLabel) {
      await interaction.followUp({ content: `ไม่พบเพลงที่ตรงกับ "${songQuery}"` });
      return;
    }

    const presence: string[] = [];
    const jpData = allData["\u{1F1EF}\u{1F1F5} JP"];
    const enData = allData["\u{1F1FA}\u{1F1F8} EN"];
    if (jpData?.musics.some((s) => s.id === matchedSong!.id)) presence.push("\u{1F1EF}\u{1F1F5} JP");
    if (enData?.musics.some((s) => s.id === matchedSong!.id)) presence.push("\u{1F1FA}\u{1F1F8} EN");
    const presenceStr = presence.length ? presence.join(" / ") : matchedLabel;

    const serverResult = allData[matchedLabel];
    const charts = serverResult?.diffMap.get(matchedSong.id) ?? [];

    if (difficulty) {
      const chart = charts.find((d) => d.musicDifficulty === difficulty);
      if (!chart) {
        await interaction.followUp({
          content: `ไม่พบ chart ${DIFFICULTIES[difficulty] ?? difficulty} สำหรับเพลง "${matchedSong.title}"`,
        });
        return;
      }
      await showChart(interaction, matchedSong, chart, presenceStr, enMap);
    } else {
      await showSong(interaction, matchedSong, charts, presenceStr, enMap);
    }
  },

  autocomplete: async (interaction: AutocompleteInteraction) => {
    await suggestSongs(interaction, interaction.options.getString("song") ?? "");
  },
};

export { fetchAll, buildEnMap, SONGS_PER_PAGE, jacketUrl };
