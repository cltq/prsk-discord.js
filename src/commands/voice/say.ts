import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EdgeTTS } from "node-edge-tts";
import { getGuild } from "../../utils/guild-config.js";

const DEFAULT_VOICE = "th-TH-NiwatNeural";
const TTS_RETRIES = 3;

async function ensureVoice(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) return false;
  const member = interaction.member;
  if (!member || !("voice" in member) || !member.voice.channel) {
    await interaction.reply({
      content: "คุณต้องอยู่ในห้องเสียงก่อนใช้คำสั่งนี้",
      ephemeral: true,
    });
    return false;
  }

  const target = member.voice.channel;
  const connection = getVoiceConnection(interaction.guild.id);

  if (connection) {
    const currentChannel = connection.joinConfig.channelId;
    if (currentChannel !== target.id) {
      connection.destroy();
    } else {
      return true;
    }
  }

  joinVoiceChannel({
    channelId: target.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator as any,
  });

  return true;
}

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

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("พูดข้อความด้วย TTS")
    .setDMPermission(false)
    .setContexts(0)
    .setIntegrationTypes(0)
    .addStringOption((opt) =>
      opt.setName("text").setDescription("ข้อความที่จะให้บอทพูด").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("voice").setDescription("เสียงที่จะใช้ (ดูรายชื่อได้ที่ /voices)").setRequired(false)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!(await ensureVoice(interaction))) return;

    const text = interaction.options.getString("text", true);
    const voice = interaction.options.getString("voice") || getGuild(interaction.guild!.id).default_voice || DEFAULT_VOICE;

    await interaction.deferReply({ ephemeral: true });

    const connection = getVoiceConnection(interaction.guild!.id);
    if (!connection) {
      await interaction.followUp({ content: "บอทตัดการเชื่อมต่อจากห้องเสียง", ephemeral: true });
      return;
    }

    await playTts(text, voice, interaction.guild!.id);
    await interaction.followUp({ content: `กำลังพูด: ${text}`, ephemeral: true });
  },
};
