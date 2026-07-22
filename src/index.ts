import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });
import * as http from "node:http";
import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  Collection,
} from "discord.js";
import type { Command } from "./types/index.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

let botConnected = false;
let restartRequested = false;
let clientDestroyed = false;
export const startTime = Date.now();

export function requestRestart(): void {
  restartRequested = true;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

client.commands = new Collection();

function loadCommands(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
      const mod = require(fullPath);
      const cmd: Command = mod.default ?? mod;
      if (cmd?.data && typeof cmd?.execute === "function") {
        client.commands.set(cmd.data.name, cmd);
      }
    }
  }
}

function loadEvents(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadEvents(fullPath);
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
      const mod = require(fullPath);
      const event = mod.default ?? mod;
      if (event.once) {
        client.once(event.name, (...args: unknown[]) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args: unknown[]) => event.execute(client, ...args));
      }
    }
  }
}

client.on(Events.ClientReady, async (readyClient) => {
  console.log(`Bot is ready — starting sync`);
  console.log(`Logged in as ${readyClient.user.tag} (ID: ${readyClient.user.id})`);
  console.log(`Connected to ${readyClient.guilds.cache.size} guilds`);
  for (const [, g] of readyClient.guilds.cache) {
    console.log(`  Guild: ${g.name} (ID: ${g.id}) — ${g.memberCount} members`);
  }
  const totalUsers = readyClient.guilds.cache.reduce(
    (sum, g) => sum + (g.memberCount ?? 0),
    0
  );
  console.log(`Total users visible: ${totalUsers}`);
  console.log(`Registered ${client.commands.size} commands:`);
  for (const [, cmd] of client.commands) {
    console.log(`  /${cmd.data.name} — ${cmd.data.description}`);
  }
  console.log("Bot fully ready");

  readyClient.user.setActivity({
    type: ActivityType.Custom,
    name: "Custom Status",
    state: "meow! :D - Fumi",
  });

  botConnected = true;
});

client.on(Events.Error, (error) => {
  console.error("Client error:", error);
});

client.on(Events.ShardDisconnect, () => {
  botConnected = false;
  console.warn("Disconnected from Discord gateway");
});

client.on(Events.ShardReconnecting, () => {
  console.log("Reconnecting to Discord gateway...");
});

async function keepAlive(): Promise<void> {
  while (!clientDestroyed) {
    try {
      client.user?.setActivity({
        type: ActivityType.Custom,
        name: "Custom Status",
        state: "meow! :D - Fumi",
      });
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 60000));
  }
}

const HEALTH_HOST = "0.0.0.0";
const HEALTH_PORT = 8899;

function runHealthServer(): void {
  const server = http.createServer((_req, res) => {
    const status = botConnected ? 200 : 503;
    const text = botConnected ? "ok" : "disconnected";
    res.writeHead(status, {
      "Content-Type": "text/plain",
      Connection: "close",
    });
    res.end(`${status} ${text}`);
  });
  server.listen(HEALTH_PORT, HEALTH_HOST, () => {
    console.log(`Health check server listening on ${HEALTH_HOST}:${HEALTH_PORT}`);
  });
}

async function runBotForever(): Promise<void> {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN environment variable is required");
  }

  while (true) {
    try {
      console.log("Starting bot session...");
      const commandsDir = path.join(__dirname, "commands");
      const eventsDir = path.join(__dirname, "events");
      loadCommands(commandsDir);
      loadEvents(eventsDir);

      console.log("Connecting to Discord gateway...");

      clientDestroyed = false;
      client.once("destroy", () => { clientDestroyed = true; });

      await client.login(token);
      await keepAlive();
    } catch (error) {
      if (clientDestroyed) {
        // Intentional destroy
      } else {
        console.error("Bot session ended with error:", error);
      }
    }

    if (restartRequested) {
      console.log("Restart requested — exiting process");
      process.exit(0);
    }

    console.log("Reconnecting in 10 seconds...");
    await new Promise((r) => setTimeout(r, 10000));
  }
}

async function main(): Promise<void> {
  runHealthServer();
  await runBotForever();
}

main();
