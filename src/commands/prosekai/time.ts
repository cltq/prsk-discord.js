import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const DATA_FILE = path.resolve("src/data/time.txt");
const AQUA = "#00FFFF";

export default {
  data: new SlashCommandBuilder()
    .setName("ข้อมูลเวลาเซิร์ฟ")
    .setDescription("แสดงข้อมูลเวลาเซิร์ฟเวอร์ Global และ JP ในเซไก")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const text = fs.readFileSync(DATA_FILE, "utf-8");
    const embed = new EmbedBuilder().setColorHex(AQUA, "ข้อมูลเวลาเซิร์ฟ", text);
    await interaction.reply({ embeds: [embed.toJSON()] });
  },
};
