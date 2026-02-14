import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordClient } from "../discord-client.js";

export function register(server: McpServer, client: DiscordClient, defaultGuildId?: string) {
  server.tool(
    "create_thread_from_message",
    "Create a thread from an existing message",
    {
      channel_id: z.string().describe("Parent channel ID"),
      message_id: z.string().describe("Message ID to create thread from"),
      name: z.string().min(1).max(100).describe("Thread name (1-100 chars)"),
      auto_archive_duration: z.number().optional().describe("Auto-archive minutes: 60, 1440, 4320, 10080")
    },
    async ({ channel_id, message_id, name, auto_archive_duration }) => {
      const body: any = { name };
      if (auto_archive_duration) body.auto_archive_duration = auto_archive_duration;
      const result = await client.post(`/channels/${channel_id}/messages/${message_id}/threads`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_thread",
    "Create a new thread without a message",
    {
      channel_id: z.string().describe("Parent channel ID"),
      name: z.string().min(1).max(100).describe("Thread name (1-100 chars)"),
      type: z.number().optional().describe("Thread type: 11=PUBLIC_THREAD (default), 12=PRIVATE_THREAD"),
      auto_archive_duration: z.number().optional().describe("Auto-archive minutes: 60, 1440, 4320, 10080")
    },
    async ({ channel_id, name, type, auto_archive_duration }) => {
      const body: any = { name, type: type ?? 11 };
      if (auto_archive_duration) body.auto_archive_duration = auto_archive_duration;
      const result = await client.post(`/channels/${channel_id}/threads`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_active_threads",
    "List all active threads in the server",
    { guild_id: z.string().optional().describe("Server ID (uses DISCORD_GUILD_ID env if omitted)") },
    async ({ guild_id }) => {
      const id = guild_id || defaultGuildId;
      if (!id) throw new Error("guild_id is required (or set DISCORD_GUILD_ID env)");
      const result = await client.get(`/guilds/${id}/threads/active`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_archived_threads",
    "List archived public threads in a channel",
    {
      channel_id: z.string().describe("Parent channel ID"),
      limit: z.number().optional().describe("Max threads to return"),
      before: z.string().optional().describe("ISO8601 timestamp - get threads archived before this")
    },
    async ({ channel_id, limit, before }) => {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (before) params.set("before", before);
      const query = params.toString() ? `?${params}` : "";
      const result = await client.get(`/channels/${channel_id}/threads/archived/public${query}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_private_archived_threads",
    "List archived private threads in a channel (requires Manage Threads permission)",
    {
      channel_id: z.string().describe("Parent channel ID"),
      limit: z.number().optional().describe("Max threads to return"),
      before: z.string().optional().describe("ISO8601 timestamp - get threads archived before this")
    },
    async ({ channel_id, limit, before }) => {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (before) params.set("before", before);
      const query = params.toString() ? `?${params}` : "";
      const result = await client.get(`/channels/${channel_id}/threads/archived/private${query}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}