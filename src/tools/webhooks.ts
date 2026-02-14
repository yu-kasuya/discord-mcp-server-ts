import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordClient } from "../discord-client.js";

export function register(server: McpServer, client: DiscordClient) {
  server.tool(
    "create_webhook",
    "Create a webhook for a channel",
    {
      channel_id: z.string().describe("Channel ID"),
      name: z.string().min(1).max(80).describe("Webhook name (1-80 chars)")
    },
    async ({ channel_id, name }) => {
      const result = await client.post(`/channels/${channel_id}/webhooks`, { name });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_webhooks",
    "List webhooks for a channel",
    { channel_id: z.string().describe("Channel ID") },
    async ({ channel_id }) => {
      const result = await client.get(`/channels/${channel_id}/webhooks`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "send_webhook_message",
    "Send a message via webhook with custom username/avatar for agent identification",
    {
      webhook_id: z.string().describe("Webhook ID"),
      webhook_token: z.string().describe("Webhook token"),
      content: z.string().describe("Message content"),
      username: z.string().optional().describe("Override display name (e.g. kiro-project-a)"),
      avatar_url: z.string().optional().describe("Override avatar URL")
    },
    async ({ webhook_id, webhook_token, content, username, avatar_url }) => {
      const body: any = { content };
      if (username) body.username = username;
      if (avatar_url) body.avatar_url = avatar_url;
      const result = await client.postWebhook(webhook_id, webhook_token, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_webhook",
    "Delete a webhook",
    { webhook_id: z.string().describe("Webhook ID") },
    async ({ webhook_id }) => {
      await client.delete(`/webhooks/${webhook_id}`);
      return { content: [{ type: "text" as const, text: `Webhook ${webhook_id} deleted` }] };
    }
  );
}