import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ChannelType,
  type VoiceChannel,
} from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { getGuild, setGuild } from "../../utils/guild-config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("เชื่อมต่อห้องเสียง")
    .setDMPermission(false)
    .setContexts(0)
    .setIntegrationTypes(0)
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("ห้องเสียงที่จะเชื่อมต่อ (ไม่ใส่ = ห้องที่คุณอยู่)")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("auto_read")
        .setDescription("อ่านข้อความในแชทนี้ด้วย TTS อัตโนมัติ")
        .setRequired(false)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({ content: "คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์", ephemeral: true });
      return;
    }

    const channelOpt = interaction.options.getChannel("channel") as VoiceChannel | null;
    const member = interaction.member as import("discord.js").GuildMember;
    const userVoice = member?.voice?.channel;
    const target = channelOpt ?? userVoice;

    if (!target || target.type !== ChannelType.GuildVoice) {
      await interaction.reply({
        content: "คุณต้องอยู่ในห้องเสียง หรือระบุห้องเสียง",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const vc = interaction.guild.members.me?.voice?.channel;
    let msg: string;

    if (vc) {
      if (vc.id !== target.id) {
        joinVoiceChannel({
          channelId: target.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator as any,
        });
        msg = `ย้ายไป ${target.toString()} แล้ว`;
      } else {
        msg = `อยู่ใน ${target.toString()} อยู่แล้ว`;
      }
    } else {
      joinVoiceChannel({
        channelId: target.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator as any,
      });
      msg = `เชื่อมต่อ ${target.toString()} แล้ว`;
    }

    const autoRead = interaction.options.getBoolean("auto_read") ?? true;
    const guildId = interaction.guild.id;

    if (autoRead) {
      setGuild(guildId, "auto_read_channel_id", target.id);
      setGuild(guildId, "auto_read_enabled", true);
      msg += " และเปิดอ่านข้อความอัตโนมัติ";
    } else {
      setGuild(guildId, "auto_read_enabled", false);
      msg += " และปิดอ่านข้อความอัตโนมัติ";
    }

    await interaction.followUp({ content: msg, ephemeral: true });
  },
};
