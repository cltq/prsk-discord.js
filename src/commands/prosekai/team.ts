import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const DATA_FILE = path.resolve("src/data/team.txt");
const AQUA = "#00FFFF";

export default {
  data: new SlashCommandBuilder()
    .setName("ข้อมูลการจัดทีม")
    .setDescription("แสดงข้อมูลสรุปการจัดทีมและคะแนนในเซไก")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const text = fs.readFileSync(DATA_FILE, "utf-8");
    const embed = new EmbedBuilder().setColorHex(AQUA, "สรุปการจัดทีม", text);
    await interaction.reply({ embeds: [embed.toJSON()] });
  },
};
