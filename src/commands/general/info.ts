import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import * as child_process from "node:child_process";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const PRIMARY = "#FFFFFF";
const OWNER_WEBSITE = "https://mapleji.xyz";
const startTime = Date.now();

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

async function ownerDisplay(client: ChatInputCommandInteraction["client"]): Promise<string> {
  const ownerId = process.env.BOT_CREATOR;
  if (!ownerId) return "ไม่ทราบ";
  try {
    const user = await client.users.fetch(ownerId);
    return user ? user.toString() : `\`${ownerId}\``;
  } catch {
    return `\`${ownerId}\``;
  }
}

function remoteUrl(remote: string): string | null {
  try {
    let url = child_process.execSync(`git remote get-url ${remote}`, { timeout: 10000 }).toString().trim();
    if (!url) return null;
    url = url.replace(".git", "");
    if (url.startsWith("https://")) return url;
    if (url.includes(":") && url.includes("@")) {
      const host = url.split("@")[1].split(":")[0];
      const repoPath = url.split(":")[1].replace(".git", "");
      return `https://${host}/${repoPath}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("แสดงข้อมูลบอท")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const ownerDisplayStr = await ownerDisplay(interaction.client);
    const ghUrl = remoteUrl("origin");
    const giteaUrl = remoteUrl("gitea");

    const embed = EmbedBuilder.hex(PRIMARY, "ข้อมูลบอท", `ข้อมูลทั่วไปของ ${interaction.client.user?.username ?? "Bot"}`);
    if (interaction.client.user) {
      embed.setThumbnail(interaction.client.user.displayAvatarURL());
    }
    embed.addInlineField("ชื่อ", interaction.client.user?.username ?? "?", false);
    embed.addInlineField("ID", interaction.client.user?.id ?? "?", false);
    embed.addInlineField("เจ้าของ", ownerDisplayStr, false);
    embed.addInlineField("เว็บไซต์", `[mapleji.xyz](${OWNER_WEBSITE})`, false);
    embed.addInlineField("อัปไทม์", formatUptime(), false);
    embed.addInlineField("Status Page", "https://discordbotstatus.mapleji.xyz/prsk", false);
    embed.addInlineField("Discord Status", "https://discordstatus.com", false);

    if (ghUrl) {
      const label = ghUrl.split("/").slice(-2).join("/");
      embed.addInlineField("GitHub", `[${label}](${ghUrl})`, false);
    }
    if (giteaUrl) {
      const label = giteaUrl.split("/").slice(-2).join("/");
      embed.addInlineField("Gitea", `[${label}](${giteaUrl})`, false);
    }
    embed.setFooter({ text: `Requested by ${interaction.user.displayName}` });

    await interaction.reply({ embeds: [embed.toJSON()] });
  },
};
