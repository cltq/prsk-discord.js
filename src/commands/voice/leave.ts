import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { setGuild } from "../../utils/guild-config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("ตัดการเชื่อมต่อจากห้องเสียง")
    .setDMPermission(false)
    .setContexts(0)
    .setIntegrationTypes(0),

  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.followUp({ content: "คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์", ephemeral: true });
      return;
    }

    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
      await interaction.followUp({ content: "บอทไม่ได้เชื่อมต่อกับห้องเสียง", ephemeral: true });
      return;
    }

    try {
      connection.destroy();
      setGuild(interaction.guild.id, "auto_read_enabled", false);
      setGuild(interaction.guild.id, "auto_read_channel_id", null);
      await interaction.followUp({
        content: "ตัดการเชื่อมต่อจากห้องเสียงแล้ว และปิดอ่านข้อความอัตโนมัติ",
        ephemeral: true,
      });
    } catch (e) {
      console.error("Failed to disconnect from voice:", e);
      await interaction.followUp({ content: `ไม่สามารถตัดการเชื่อมต่อได้: ${e}`, ephemeral: true });
    }
  },
};
