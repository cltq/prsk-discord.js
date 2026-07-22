import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import type { Command } from "./types/index.js";

const commands: SlashCommandBuilder[] = [];

function loadCommands(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
      const mod = require(fullPath);
      const cmd: Command = mod.default ?? mod;
      if (cmd.data) {
        commands.push(cmd.data);
      }
    }
  }
}

async function deploy(): Promise<void> {
  const token = process.env.BOT_TOKEN;
  const clientId = process.env.BOT_CLIENT_ID;
  if (!token || !clientId) {
    console.error("BOT_TOKEN and BOT_CLIENT_ID are required");
    process.exit(1);
  }

  loadCommands(path.join(__dirname, "commands"));

  console.log(`Deploying ${commands.length} commands...`);

  const rest = new REST({ version: "10" }).setToken(token);

  const result = await rest.put(Routes.applicationCommands(clientId), {
    body: commands.map((cmd) => cmd.toJSON()),
  });

  console.log(`Successfully deployed ${Array.isArray(result) ? result.length : 0} commands.`);
}

deploy().catch(console.error);
