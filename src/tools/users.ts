import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordClient } from "../discord-client.js";

export function register(server: McpServer, client: DiscordClient, defaultGuildId?: string) {
  server.tool(
    "find_user",
    "Search for a user by name in the server. Returns user ID for mentions (<@id>)",
    {
      query: z.string().describe("Username to search (partial match)"),
      guild_id: z.string().optional().describe("Server ID (uses DISCORD_GUILD_ID env if omitted)"),
      limit: z.number().min(1).max(1000).optional().describe("Max results (default 1)")
    },
    async ({ query, guild_id, limit }) => {
      const id = guild_id || defaultGuildId;
      if (!id) throw new Error("guild_id is required (or set DISCORD_GUILD_ID env)");
      const params = new URLSearchParams({ query, limit: String(limit ?? 1) });
      const result = await client.get(`/guilds/${id}/members/search?${params}`);
      const mapped = result.map((m: any) => ({
        user_id: m.user.id,
        username: m.user.username,
        display_name: m.nick || m.user.global_name || m.user.username,
        mention: `<@${m.user.id}>`
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }] };
    }
  );
}