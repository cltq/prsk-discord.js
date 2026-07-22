import { EmbedBuilder as DjsEmbedBuilder, type RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Colors } from "discord.js";

const COLOR_MAP = {
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
  info: 0x00a8fc,
} as const;

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export class EmbedBuilder extends DjsEmbedBuilder {
  static primary(title?: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLOR_MAP.primary)
      .setTitle(title ?? null)
      .setDescription(description ?? null);
  }

  static success(title?: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLOR_MAP.success)
      .setTitle(title ?? null)
      .setDescription(description ?? null);
  }

  static warning(title?: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLOR_MAP.warning)
      .setTitle(title ?? null)
      .setDescription(description ?? null);
  }

  static error(title?: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLOR_MAP.error)
      .setTitle(title ?? null)
      .setDescription(description ?? null);
  }

  static info(title?: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLOR_MAP.info)
      .setTitle(title ?? null)
      .setDescription(description ?? null);
  }

  static hex(hexColor: string, title?: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(hexToInt(hexColor))
      .setTitle(title ?? null)
      .setDescription(description ?? null);
  }

  setPrimary(title?: string, description?: string): this {
    this.setColor(COLOR_MAP.primary);
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    return this;
  }

  setSuccess(title?: string, description?: string): this {
    this.setColor(COLOR_MAP.success);
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    return this;
  }

  setWarning(title?: string, description?: string): this {
    this.setColor(COLOR_MAP.warning);
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    return this;
  }

  setError(title?: string, description?: string): this {
    this.setColor(COLOR_MAP.error);
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    return this;
  }

  setInfo(title?: string, description?: string): this {
    this.setColor(COLOR_MAP.info);
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    return this;
  }

  setColorHex(hexColor: string, title?: string, description?: string): this {
    this.setColor(hexToInt(hexColor));
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    return this;
  }

  setBody(title: string, description: string, url?: string): this {
    this.setTitle(title);
    this.setDescription(description);
    if (url) this.setURL(url);
    return this;
  }

  setImageUrl(url: string): this {
    this.setImage(url);
    return this;
  }

  setThumbnailUrl(url: string): this {
    this.setThumbnail(url);
    return this;
  }

  addInlineField(name: string, value: string, inline = true): this {
    this.addFields({ name, value, inline });
    return this;
  }

  addBlankField(inline = false): this {
    this.addFields({ name: "\u200B", value: "\u200B", inline });
    return this;
  }
}
