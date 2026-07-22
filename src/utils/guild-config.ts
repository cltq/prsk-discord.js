import * as fs from "node:fs";
import * as path from "node:path";
import { DEFAULT_GUILD_CONFIG, type GuildConfig } from "../types/index.js";

const CONFIG_PATH = path.resolve("guild_configs.json");

function load(): Record<string, GuildConfig> {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function save(config: Record<string, GuildConfig>): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function getGuild(guildId: string): GuildConfig {
  const config = load();
  return config[guildId] ?? { ...DEFAULT_GUILD_CONFIG };
}

export function setGuild(guildId: string, key: keyof GuildConfig, value: unknown): void {
  const config = load();
  if (!config[guildId]) {
    config[guildId] = { ...DEFAULT_GUILD_CONFIG };
  }
  (config[guildId] as unknown as Record<string, unknown>)[key] = value;
  save(config);
}
