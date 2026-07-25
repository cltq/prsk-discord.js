import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getGuild, setGuild } from "../../utils/guild-config.js";
import { EmbedBuilder } from "../../utils/embed-builder.js";
import { adminCheck } from "../../utils/admin-guard.js";

export default {
  data: new SlashCommandBuilder()
    .setName("autojoin")
    .setDescription("เปิด/ปิด autojoin เมื่อบอทถูกตัดจากห้องเสียง")
    .setDMPermission(false)
    .setContexts(0)
    .setIntegrationTypes(0)
    .addBooleanOption((opt) =>
      opt
        .setName("enabled")
        .setDescription("เปิด (true) หรือ ปิด (false) autojoin")
        .setRequired(false)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({
        content: "คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์",
        ephemeral: true,
      });
      return;
    }

    if (!await adminCheck(interaction)) return;

    const guildId = interaction.guild.id;
    const cfg = getGuild(guildId);
    const current = cfg.autojoin_enabled;

    const enabled = interaction.options.getBoolean("enabled");

    if (enabled === null) {
      const embed = EmbedBuilder.info(
        "Autojoin",
        `สถานะปัจจุบัน: **${current ? "เปิดอยู่" : "ปิดอยู่"}**\nใช้ \`/autojoin enabled:true\` หรือ \`/autojoin enabled:false\` เพื่อเปลี่ยน`
      );
      await interaction.reply({ embeds: [embed.toJSON()], ephemeral: true });
      return;
    }

    if (enabled === current) {
      const embed = EmbedBuilder.warning(
        "Autojoin",
        `autojoin **${current ? "เปิด" : "ปิด"}** อยู่แล้ว`
      );
      await interaction.reply({ embeds: [embed.toJSON()], ephemeral: true });
      return;
    }

    setGuild(guildId, "autojoin_enabled", enabled);

    const embed = EmbedBuilder.success(
      "Autojoin",
      `autojoin ถูก**${enabled ? "เปิด" : "ปิด"}**แล้ว`
    );
    await interaction.reply({ embeds: [embed.toJSON()], ephemeral: true });
  },
};
