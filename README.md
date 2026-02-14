# discord-mcp-server-ts

A Discord MCP (Model Context Protocol) server built with TypeScript. Provides 23 tools for interacting with Discord — messages, threads, channels, webhooks, and more.

Key differentiator: **Thread support** — create, list, and manage threads, which is not available in most existing Discord MCP servers.

## Quick Start

```bash
npm install
npm run build

# Test connection
DISCORD_TOKEN="your_token" DISCORD_GUILD_ID="your_id" node dist/index.js
```

## Setup

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. "New Application" → name it → Create
3. Left menu "Bot" → "Reset Token" → copy the token
4. Enable "MESSAGE CONTENT INTENT" on the same page

### 2. Invite Bot to Server

1. Left menu "OAuth2" → "OAuth2 URL Generator"
2. Scopes: check `bot`
3. Bot Permissions:
   - **Send Messages**
   - **Read Message History**
   - **Manage Messages**
   - **Add Reactions**
   - **Manage Webhooks**
   - **Create Public Threads**
   - **Send Messages in Threads**
   - **Manage Threads**
4. Open the generated URL → add to your server

### 3. Get Server ID

1. Discord Settings → Advanced → enable "Developer Mode"
2. Right-click your server icon → "Copy Server ID"

## MCP Configuration

### Kiro

Add to `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/path/to/discord-mcp-server-ts/dist/index.js"],
      "env": {
        "DISCORD_TOKEN": "your_bot_token",
        "DISCORD_GUILD_ID": "your_server_id"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add discord \
  -e DISCORD_TOKEN=your_bot_token \
  -e DISCORD_GUILD_ID=your_server_id \
  -- node /path/to/discord-mcp-server-ts/dist/index.js
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Discord Bot token |
| `DISCORD_GUILD_ID` | No | Default server ID. When set, `guild_id` becomes optional for tools that need it |

## Tools (23)

### Message

| Tool | Description | Key Parameters |
|---|---|---|
| `send_message` | Send a message to a channel or thread | `channel_id`, `content` |
| `read_messages` | Read message history | `channel_id`, `limit?`, `before?`, `after?` |
| `edit_message` | Edit a message | `channel_id`, `message_id`, `content` |
| `delete_message` | Delete a message | `channel_id`, `message_id` |
| `search_messages` | Search messages containing text | `channel_id`, `query`, `limit?` |
| `add_reaction` | Add emoji reaction | `channel_id`, `message_id`, `emoji` |
| `pin_message` | Pin a message | `channel_id`, `message_id` |
| `get_pinned_messages` | Get pinned messages | `channel_id` |
| `check_mentions` | Check for bot mentions across channel and threads | `guild_id?`, `channel_id?`, `limit?` |

### Thread

| Tool | Description | Key Parameters |
|---|---|---|
| `create_thread_from_message` | Create thread from existing message | `channel_id`, `message_id`, `name` |
| `create_thread` | Create new thread (no parent message) | `channel_id`, `name`, `type?` |
| `list_active_threads` | List active threads in server | `guild_id?` |
| `list_archived_threads` | List archived public threads | `channel_id`, `limit?` |
| `list_private_archived_threads` | List archived private threads | `channel_id`, `limit?` |

### Channel / Server / User

| Tool | Description | Key Parameters |
|---|---|---|
| `list_channels` | List all channels in server | `guild_id?` |
| `find_channel` | Find channel by name (partial match) | `name`, `guild_id?` |
| `get_channel` | Get channel details | `channel_id` |
| `get_server_info` | Get server information | `guild_id?` |
| `find_user` | Search user by name | `query`, `guild_id?`, `limit?` |

### Webhook

| Tool | Description | Key Parameters |
|---|---|---|
| `create_webhook` | Create webhook for a channel | `channel_id`, `name` |
| `list_webhooks` | List webhooks for a channel | `channel_id` |
| `send_webhook_message` | Send message with custom username/avatar | `webhook_id`, `webhook_token`, `content`, `username?`, `avatar_url?` |
| `delete_webhook` | Delete a webhook | `webhook_id` |

## Usage Examples

Once configured, you can ask your AI agent things like:

- "Post 'Hello world' to the #general channel"
- "Read the last 10 messages in #dev"
- "Create a thread called 'Bug Report' on that message"
- "List all active threads in the server"
- "Send a message as 'deploy-bot' using the webhook"
- "Find the user named Alice and mention them in #general"

## License

ISC
