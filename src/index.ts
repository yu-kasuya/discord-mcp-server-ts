import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DiscordClient } from "./discord-client.js";
import { register as registerServer } from "./tools/server.js";
import { register as registerMessages } from "./tools/messages.js";
import { register as registerThreads } from "./tools/threads.js";
import { register as registerChannels } from "./tools/channels.js";
import { register as registerUsers } from "./tools/users.js";
import { register as registerWebhooks } from "./tools/webhooks.js";

const token = process.env.DISCORD_TOKEN;
if (!token) { console.error("DISCORD_TOKEN env is required"); process.exit(1); }
const defaultGuildId = process.env.DISCORD_GUILD_ID;

const client = new DiscordClient(token);
const server = new McpServer({ name: "discord-mcp-server-ts", version: "1.0.0" });

registerServer(server, client, defaultGuildId);
registerMessages(server, client, defaultGuildId);
registerThreads(server, client, defaultGuildId);
registerChannels(server, client, defaultGuildId);
registerUsers(server, client, defaultGuildId);
registerWebhooks(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
