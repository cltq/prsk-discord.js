import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from "discord.js";
import * as child_process from "node:child_process";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const REMOTE_CHOICES = [
  { name: "GitHub", value: "origin" },
];

const REMOTE_LABELS: Record<string, string> = {
  origin: "GitHub",
};

function gitLog(remote: string, allCommits: boolean): string {
  try {
    child_process.execSync(`git fetch --quiet ${remote} main`, { timeout: 15000 });
    const args = `git log ${remote}/main --oneline --no-merges${allCommits ? "" : " -5"}`;
    const result = child_process.execSync(args, { timeout: 15000 }).toString().trim();
    const lines = result.split("\n").filter(Boolean);
    if (!lines.length) return "(no commits found)";
    return lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
  } catch {
    return "(failed to fetch log)";
  }
}

function remoteInfo(remote: string): { repoPath: string; host: string } | null {
  try {
    const url = child_process.execSync(`git remote get-url ${remote}`, { timeout: 10000 }).toString().trim();
    if (!url) return null;
    const raw = url.replace(".git", "");
    let parts: string[];
    let host: string;
    if (raw.startsWith("https://")) {
      parts = raw.split("/");
      host = parts[2];
    } else if (raw.includes(":") && raw.includes("@")) {
      parts = raw.split(":")[1].split("/");
      host = raw.split("@")[1].split(":")[0];
    } else {
      return null;
    }
    if (parts.length >= 2) {
      return { repoPath: `${parts[parts.length - 2]}/${parts[parts.length - 1]}`, host };
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("git")
    .setDescription("ดู commits จาก GitHub")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1)
    .addStringOption((opt) =>
      opt
        .setName("remote")
        .setDescription("เลือก remote ที่ต้องการดู commits")
        .setRequired(true)
        .addChoices(...REMOTE_CHOICES)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("all")
        .setDescription("แสดงทั้งหมด (true) หรือแค่ 5 ล่าสุด (false, default)")
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("ephemeral")
        .setDescription("ตอบกลับแบบส่วนตัว (default: false)")
        .setRequired(false)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const remote = interaction.options.getString("remote", true);
    const all = interaction.options.getBoolean("all") ?? false;
    const ephemeral = interaction.options.getBoolean("ephemeral") ?? false;

    await interaction.deferReply({ ephemeral });

    const embed = EmbedBuilder.hex("#F05032", "📋 Git Log");
    embed.setFooter({ text: `Requested by ${interaction.user.displayName}` });

    const log = gitLog(remote, all);
    const label = REMOTE_LABELS[remote] ?? remote;
    const info = remoteInfo(remote);

    let fieldLabel: string;
    let fieldValue: string;

    if (info) {
      const url = `https://${info.host}/${info.repoPath}`;
      fieldLabel = `🔗 ${label} (using ${remote}/main) - ${remote}/${info.repoPath}`;
      fieldValue = `[\`${info.repoPath}\`](${url})\n\`\`\`${log}\`\`\``;
    } else {
      fieldLabel = `🔗 ${label} (using ${remote}/main)`;
      fieldValue = `\`\`\`${log}\`\`\``;
    }

    embed.addInlineField(fieldLabel, fieldValue, false);

    await interaction.followUp({ embeds: [embed.toJSON()], ephemeral });
  },
};
