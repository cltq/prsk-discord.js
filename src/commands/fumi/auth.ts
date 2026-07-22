import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("auth")
    .setDescription("รับลิงก์ยืนยันตัวตนสำหรับเชื่อมต่อบอทเซไก")
    .setDMPermission(true)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1)
    .addStringOption((opt) =>
      opt.setName("secret_key").setDescription("รหัสลับสำหรับยืนยันตัวตน").setRequired(true)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const secretKey = interaction.options.getString("secret_key", true);
    const expected = process.env.DISCORD_CMD_AUTH_SK ?? "";

    if (secretKey !== expected) {
      await interaction.reply({
        content: "รหัสลับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
        ephemeral: true,
      });
      return;
    }

    const link = process.env.DISCORD_BOT_OA2_LINK ?? "";
    if (!link) {
      await interaction.reply({
        content: "ไม่พบลิงก์ยืนยันตัวตนในระบบ โปรดแจ้งผู้ดูแล",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `ลิงก์ยืนยันตัวตนของคุณ: ${link}`,
      ephemeral: true,
    });
  },
};
