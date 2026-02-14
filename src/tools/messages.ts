import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordClient } from "../discord-client.js";

export function register(server: McpServer, client: DiscordClient) {
  // Tool 1: send_message
  server.tool(
    "send_message",
    "Send a message to a Discord channel or thread",
    { 
      channel_id: z.string().describe("Channel or thread ID"), 
      content: z.string().min(1).max(2000).describe("Message content (1-2000 chars)")
    },
    async ({ channel_id, content }) => {
      const result = await client.post(`/channels/${channel_id}/messages`, { content });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool 2: read_messages
  server.tool(
    "read_messages",
    "Read message history from a Discord channel or thread",
    {
      channel_id: z.string().describe("Channel or thread ID"),
      limit: z.number().min(1).max(100).optional().describe("Number of messages to fetch (1-100, default 50)"),
      before: z.string().optional().describe("Get messages before this message ID"),
      after: z.string().optional().describe("Get messages after this message ID")
    },
    async ({ channel_id, limit, before, after }) => {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (before) params.set("before", before);
      if (after) params.set("after", after);
      const query = params.toString() ? `?${params}` : "";
      const result = await client.get(`/channels/${channel_id}/messages${query}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool 3: add_reaction
  server.tool(
    "add_reaction",
    "Add a reaction emoji to a message. Use Unicode emoji like 👍 or custom emoji in name:id format",
    {
      channel_id: z.string().describe("Channel or thread ID"),
      message_id: z.string().describe("Message ID"),
      emoji: z.string().describe("Emoji (Unicode like 👍 or custom name:id)")
    },
    async ({ channel_id, message_id, emoji }) => {
      const encoded = encodeURIComponent(emoji);
      await client.put(`/channels/${channel_id}/messages/${message_id}/reactions/${encoded}/@me`);
      return { content: [{ type: "text" as const, text: `Reaction ${emoji} added` }] };
    }
  );

  // Tool 4: pin_message
  server.tool(
    "pin_message",
    "Pin a message in a channel",
    {
      channel_id: z.string().describe("Channel ID"),
      message_id: z.string().describe("Message ID to pin")
    },
    async ({ channel_id, message_id }) => {
      await client.put(`/channels/${channel_id}/messages/pins/${message_id}`);
      return { content: [{ type: "text" as const, text: `Message ${message_id} pinned` }] };
    }
  );

  // Tool 5: get_pinned_messages
  server.tool(
    "get_pinned_messages",
    "Get pinned messages in a channel",
    { channel_id: z.string().describe("Channel ID") },
    async ({ channel_id }) => {
      const result = await client.get(`/channels/${channel_id}/messages/pins`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool 6: edit_message
  server.tool(
    "edit_message",
    "Edit a message content",
    {
      channel_id: z.string().describe("Channel or thread ID"),
      message_id: z.string().describe("Message ID to edit"),
      content: z.string().min(1).max(2000).describe("New message content (1-2000 chars)")
    },
    async ({ channel_id, message_id, content }) => {
      const result = await client.patch(`/channels/${channel_id}/messages/${message_id}`, { content });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool 7: delete_message
  server.tool(
    "delete_message",
    "Delete a message",
    {
      channel_id: z.string().describe("Channel or thread ID"),
      message_id: z.string().describe("Message ID to delete")
    },
    async ({ channel_id, message_id }) => {
      await client.delete(`/channels/${channel_id}/messages/${message_id}`);
      return { content: [{ type: "text" as const, text: `Message ${message_id} deleted` }] };
    }
  );

  // Tool 8: search_messages
  server.tool(
    "search_messages",
    "Search for messages in a channel or thread containing specific text",
    {
      channel_id: z.string().describe("Channel or thread ID"),
      query: z.string().describe("Search query text"),
      limit: z.number().min(1).max(100).optional().describe("Number of messages to search through (1-100, default 50)")
    },
    async ({ channel_id, query, limit }) => {
      // Discord doesn't have a direct search endpoint for channels, so we'll search through recent messages
      const messages = await client.get(`/channels/${channel_id}/messages?limit=${limit || 50}`);
      const searchTerm = query.toLowerCase();
      const matchedMessages = messages.filter((msg: any) => 
        msg.content && msg.content.toLowerCase().includes(searchTerm)
      );
      
      return { content: [{ type: "text" as const, text: JSON.stringify(matchedMessages, null, 2) }] };
    }
  );
}