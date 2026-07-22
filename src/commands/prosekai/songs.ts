import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type ButtonInteraction,
} from "discord.js";
import { EmbedBuilder } from "../../utils/embed-builder.js";
import { fetchAll, buildEnMap, SONGS_PER_PAGE } from "./chart.js";

function buildPageEmbed(musics: any[], enMap: Map<number, string>, page: number, totalPages: number, total: number) {
  const start = (page - 1) * SONGS_PER_PAGE;
  const chunk = musics.slice(start, start + SONGS_PER_PAGE);

  const lines = chunk.map((s: any) => {
    const enName = enMap.get(s.id);
    const display = enName ? `${s.title} (${enName})` : s.title;
    return `\`${String(s.id).padStart(4)}\` ${display}`;
  });

  const embed = EmbedBuilder.hex("#FF66AA", "\u{1F3B5} รายชื่อเพลงทั้งหมด");
  embed.setFooter({ text: `หน้า ${page}/${totalPages} — เพลง ${total} เพลง` });
  embed.setDescription(lines.join("\n"));
  return embed.toJSON();
}

export default {
  data: new SlashCommandBuilder()
    .setName("songs")
    .setDescription("แสดงรายชื่อเพลงทั้งหมดใน Project Sekai พร้อม ID")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1)
    .addIntegerOption((opt) =>
      opt.setName("page").setDescription("หมายเลขหน้า (เริ่มที่ 1)").setRequired(false).setMinValue(1)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    const allData = await fetchAll();
    const enMap = buildEnMap(allData);
    const jpPair = allData["\u{1F1EF}\u{1F1F5} JP"];
    if (!jpPair) {
      await interaction.followUp({ content: "ไม่สามารถโหลดข้อมูลเพลงได้" });
      return;
    }

    const { musics } = jpPair;
    const total = musics.length;
    const totalPages = Math.ceil(total / SONGS_PER_PAGE);
    let page = interaction.options.getInteger("page") ?? 1;
    page = Math.max(1, Math.min(page, totalPages));

    const embed = buildPageEmbed(musics, enMap, page, totalPages, total);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("songs_prev").setLabel("◀").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("songs_next").setLabel("▶").setStyle(ButtonStyle.Secondary)
    );

    const response = await interaction.followUp({ embeds: [embed], components: [row.toJSON()] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    let currentPage = page;

    collector.on("collect", async (i: ButtonInteraction) => {
      if (i.customId === "songs_prev" && currentPage > 1) {
        currentPage--;
      } else if (i.customId === "songs_next" && currentPage < totalPages) {
        currentPage++;
      } else {
        return;
      }
      const newEmbed = buildPageEmbed(musics, enMap, currentPage, totalPages, total);
      await i.update({ embeds: [newEmbed] });
    });

    collector.on("end", async () => {
      row.components.forEach((b) => b.setDisabled(true));
      await interaction.editReply({ components: [row.toJSON()] }).catch(() => {});
    });
  },
};
