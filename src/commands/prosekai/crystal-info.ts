import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const DATA_FILE = path.resolve("src/data/crystal-info.txt");
const MINT = "#98FF98";

function parseSections(text: string): [string, string][] {
  const lines = text.trim().split("\n");
  const sections: [string, string][] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];
  let state = 0;

  for (const line of lines) {
    if (line.startsWith("===")) {
      if (state === 0) state = 1;
      else if (state === 1) state = 2;
      else if (state === 2) {
        if (currentTitle !== null) {
          sections.push([currentTitle, currentLines.join("\n").trim()]);
          currentLines = [];
          currentTitle = null;
        }
        state = 1;
      }
      continue;
    }
    const stripped = line.trim();
    if (!stripped) continue;
    if (state === 1) currentTitle = stripped;
    else if (state === 2) currentLines.push(line);
  }

  if (currentTitle !== null) {
    sections.push([currentTitle, currentLines.join("\n").trim()]);
  }

  return sections;
}

export default {
  data: new SlashCommandBuilder()
    .setName("ข้อมูลการหาเพชร")
    .setDescription("แสดงข้อมูลสรุปการหาเพชรในเซไก")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const text = fs.readFileSync(DATA_FILE, "utf-8");
    const sections = parseSections(text);

    const embed = new EmbedBuilder().setColorHex(MINT, "สรุปการหาเพชร", "");
    for (const [title, content] of sections) {
      embed.addInlineField(title, content, false);
    }

    await interaction.reply({ embeds: [embed.toJSON()] });
  },
};
