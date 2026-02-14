import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordClient } from "../discord-client.js";

export function register(server: McpServer, client: DiscordClient, defaultGuildId?: string) {
  server.tool(
    "list_channels",
    "List all channels in the server",
    { guild_id: z.string().optional().describe("Server ID (uses DISCORD_GUILD_ID env if omitted)") },
    async ({ guild_id }) => {
      const id = guild_id || defaultGuildId;
      if (!id) throw new Error("guild_id is required (or set DISCORD_GUILD_ID env)");
      const result = await client.get(`/guilds/${id}/channels`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "find_channel",
    "Find channels by name (partial match). Returns id, name, type, parent_id",
    {
      name: z.string().describe("Channel name to search (partial match)"),
      guild_id: z.string().optional().describe("Server ID (uses DISCORD_GUILD_ID env if omitted)")
    },
    async ({ name, guild_id }) => {
      const id = guild_id || defaultGuildId;
      if (!id) throw new Error("guild_id is required (or set DISCORD_GUILD_ID env)");
      const channels = await client.get(`/guilds/${id}/channels`);
      const lower = name.toLowerCase();
      const matched = channels.filter((c: any) => c.name?.toLowerCase().includes(lower))
        .map((c: any) => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id }));
      return { content: [{ type: "text" as const, text: JSON.stringify(matched, null, 2) }] };
    }
  );

  server.tool(
    "get_channel",
    "Get detailed information about a specific channel",
    { channel_id: z.string().describe("Channel ID") },
    async ({ channel_id }) => {
      const result = await client.get(`/channels/${channel_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}