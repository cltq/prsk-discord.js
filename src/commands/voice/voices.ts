import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

const VOICE_LIST_URL = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";

export default {
  data: new SlashCommandBuilder()
    .setName("voices")
    .setDescription("แสดงรายชื่อเสียง TTS ที่ใช้งานได้")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const resp = await fetch(VOICE_LIST_URL);
      const voices: any[] = await resp.json();
      const lines = voices.map(
        (v: any) => `\`${v.ShortName}\` — ${v.Locale} (${v.Gender})`
      );
      let text = lines.join("\n");
      if (text.length > 2000) text = text.slice(0, 1997) + "...";

      await interaction.reply({
        content: `**รายชื่อเสียงที่มีให้ใช้ (${voices.length} เสียง):**\n${text}`,
        ephemeral: true,
      });
    } catch (e) {
      console.error("Voice list error:", e);
      await interaction.reply({
        content: `เกิดข้อผิดพลาด: ${e}`,
        ephemeral: true,
      });
    }
  },
};
