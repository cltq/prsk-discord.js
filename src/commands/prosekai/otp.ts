import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const DATA_FILE = path.resolve("src/data/otp.txt");
const AQUA = "#00FFFF";

export default {
  data: new SlashCommandBuilder()
    .setName("ข้อมูลการยืมไอดี")
    .setDescription("แสดงข้อมูลสรุปการยืมไอดีและการใช้รหัสผ่านเข้าเกมแบบครั้งเดียวในเซไก")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const text = fs.readFileSync(DATA_FILE, "utf-8");
    const embed = new EmbedBuilder().setColorHex(AQUA, "สรุปการยืมไอดี", text);
    await interaction.reply({ embeds: [embed.toJSON()] });
  },
};
