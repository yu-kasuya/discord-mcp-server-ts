import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordClient } from "../discord-client.js";

export function register(server: McpServer, client: DiscordClient, defaultGuildId?: string) {
  server.tool(
    "get_server_info",
    "Get Discord server (guild) information including name, member count, channels count, etc.",
    { guild_id: z.string().optional().describe("Server ID (uses DISCORD_GUILD_ID env if omitted)") },
    async ({ guild_id }) => {
      const id = guild_id || defaultGuildId;
      if (!id) throw new Error("guild_id is required (or set DISCORD_GUILD_ID env)");
      const result = await client.get(`/guilds/${id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}