import {
  Events,
  type Client,
  type Message,
  ChannelType,
} from "discord.js";
import {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EdgeTTS } from "node-edge-tts";
import { getGuild } from "../utils/guild-config.js";

const DEFAULT_VOICE = "th-TH-NiwatNeural";
const TTS_RETRIES = 3;

const readLocks = new Map<string, Promise<void>>();

async function playTts(text: string, voice: string, guildId: string): Promise<void> {
  const connection = getVoiceConnection(guildId);
  if (!connection) return;

  let tempPath: string | null = null;
  try {
    tempPath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < TTS_RETRIES; attempt++) {
      try {
        const tts = new EdgeTTS({
          voice,
          outputFormat: "audio-24khz-96kbitrate-mono-mp3",
        });
        await tts.ttsPromise(text, tempPath);
        lastError = null;
        break;
      } catch (e) {
        lastError = e as Error;
        console.warn(`TTS no audio (attempt ${attempt + 1}/${TTS_RETRIES}):`, e);
        if (attempt < TTS_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        }
      }
    }

    if (lastError) throw lastError;

    const resource = createAudioResource(tempPath);
    const player = createAudioPlayer();
    connection.subscribe(player);
    player.play(resource);

    await new Promise<void>((resolve) => {
      player.on(AudioPlayerStatus.Idle, () => resolve());
      player.on("error", () => resolve());
      setTimeout(resolve, 30000);
    });
  } catch (e) {
    console.error("TTS error:", e);
  } finally {
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    }
  }
}

async function readQueue(text: string, voice: string, guildId: string, _channelId: string): Promise<void> {
  const existing = readLocks.get(guildId) ?? Promise.resolve();
  const newLock = existing.then(() => playTts(text, voice, guildId));
  readLocks.set(guildId, newLock);
  try {
    await newLock;
  } finally {
    if (readLocks.get(guildId) === newLock) {
      readLocks.delete(guildId);
    }
  }
}

export default {
  name: Events.MessageCreate,
  execute: async (_client: Client, message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const cfg = getGuild(message.guild.id);
    if (!cfg.auto_read_enabled) return;

    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return;

    const voiceChannelId = cfg.auto_read_channel_id;
    if (!voiceChannelId) return;

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return;

    const textChannel = message.guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildText && ch.name === voiceChannel.name
    );
    if (!textChannel || message.channel.id !== textChannel.id) return;

    const voice = cfg.default_voice || DEFAULT_VOICE;
    readQueue(message.content, voice, message.guild.id, voiceChannelId);
  },
};
