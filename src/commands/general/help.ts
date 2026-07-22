import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
} from "discord.js";
import { EmbedBuilder } from "../../utils/embed-builder.js";

const PRIMARY = "#5865F2";

function buildEmbeds(client: Client) {
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((s, g) => s + (g.memberCount ?? 0), 0);
  const commands = client.commands;

  const categories = new Map<string, { name: string; commands: { name: string; description: string }[] }>();

  for (const [, cmd] of commands) {
    const catName = "อื่นๆ";
    if (!categories.has(catName)) {
      categories.set(catName, { name: catName, commands: [] });
    }
    categories.get(catName)!.commands.push({
      name: cmd.data.name,
      description: cmd.data.description,
    });
  }

  const overview = EmbedBuilder.hex(PRIMARY, "✨ วิธีใช้บอท", "บอทเซไกที่รวบรวมข้อมูลและคำแนะนำสำหรับเกม Project Sekai");
  if (client.user) {
    overview.setThumbnail(client.user.displayAvatarURL());
    overview.addInlineField("🤖 ชื่อ", client.user.username);
    overview.addInlineField("🆔 ID", client.user.id);
  }
  overview.addInlineField("🖥 เซิร์ฟเวอร์", String(guilds));
  overview.addInlineField("👥 ผู้ใช้", String(users));
  overview.addInlineField("📜 คำสั่งทั้งหมด", String(commands.size));

  for (const [, cat] of categories) {
    overview.addInlineField(
      `📂 ${cat.name}`,
      cat.commands.map((c) => `\`/${c.name}\``).join("\n")
    );
  }

  overview.setFooter({ text: "ใช้เมนูด้านล่างเพื่อดูคำสั่งแยกตามหมวดหมู่" });

  const embeds = new Map<string, EmbedBuilder>();
  embeds.set("__overview__", overview);

  for (const [, cat] of categories) {
    const catEmbed = EmbedBuilder.hex(PRIMARY, `📂 ${cat.name}`);
    catEmbed.setFooter({ text: "ใช้เมนูด้านล่างเพื่อเปลี่ยนหมวดหมู่" });
    for (const cmd of cat.commands) {
      catEmbed.addInlineField(`/${cmd.name}`, cmd.description || "ไม่มีคำอธิบาย", false);
    }
    embeds.set(cat.name, catEmbed);
  }

  return embeds;
}

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("แสดงข้อมูลบอทและคำสั่งทั้งหมด")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const embeds = buildEmbeds(interaction.client);

    const options = [
      { label: "ภาพรวม", description: "คำสั่งทั้งหมดของบอท", emoji: "🏠", value: "__overview__" },
      ...Array.from(embeds.keys())
        .filter((k) => k !== "__overview__")
        .sort()
        .map((k) => ({ label: k, description: "", emoji: undefined, value: k })),
    ];

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help_select")
        .setPlaceholder("เลือกหมวดหมู่คำสั่ง...")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options.map((o) => ({ label: o.label, description: o.description || undefined, emoji: o.emoji, value: o.value })))
    );

    const response = await interaction.reply({
      embeds: [embeds.get("__overview__")!.toJSON()],
      components: [row.toJSON()],
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120_000,
    });

    collector.on("collect", async (i: StringSelectMenuInteraction) => {
      const selected = embeds.get(i.values[0]);
      if (selected) {
        await i.update({ embeds: [selected.toJSON()] });
      }
    });

    collector.on("end", async () => {
      row.components[0].setDisabled(true);
      await interaction.editReply({ components: [row.toJSON()] }).catch(() => {});
    });
  },
};
