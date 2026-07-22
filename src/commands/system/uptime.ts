import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "../../utils/embed-builder.js";
import { startTime } from "../../index.js";

const PRIMARY = "#5865F2";

function formatUptime(): string {
  const delta = Math.floor((Date.now() - startTime) / 1000);
  const days = Math.floor(delta / 86400);
  const hours = Math.floor((delta % 86400) / 3600);
  const minutes = Math.floor((delta % 3600) / 60);
  const seconds = delta % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} วัน`);
  if (hours) parts.push(`${hours} ชั่วโมง`);
  if (minutes) parts.push(`${minutes} นาที`);
  parts.push(`${seconds} วินาที`);
  return parts.join(" ");
}

export default {
  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("แสดง uptime ของบอท")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const embed = EmbedBuilder.hex(PRIMARY, "⏱ Uptime");
    embed.addInlineField("อัปไทม์", formatUptime(), false);
    embed.addInlineField("Ping", `${Math.round(interaction.client.ws.ping)}ms`, false);
    embed.setFooter({ text: `Requested by ${interaction.user.displayName}` });

    await interaction.reply({ embeds: [embed.toJSON()] });
  },
};
