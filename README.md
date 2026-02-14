# discord-mcp-server

Discord MCP Server for AI agent knowledge sharing. Multiple AI agents (Kiro, Claude Code, etc.) share development knowledge via Discord threads.

Key differentiator: **Thread support** — not available in existing Discord MCP servers (SaseQ/discord-mcp, hanweg/mcp-discord).

## Quick Start

```bash
# 1. Build
npm install
npm run build

# 2. Test connection
DISCORD_TOKEN="your_token" DISCORD_GUILD_ID="your_id" node dist/index.js
```

## Prerequisites

### 1. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. "New Application" → name it → Create
3. Left menu "Bot" → "Reset Token" → copy the token
4. Enable "MESSAGE CONTENT INTENT" on the same page

### 2. Invite Bot to Server

1. Left menu "OAuth2" → "OAuth2 URL Generator"
2. Scopes: check `bot`
3. Bot Permissions:
   - **Send Messages** (required for send_message, send_webhook_message)
   - **Read Message History** (required for read_messages, search_messages)
   - **Manage Messages** (required for pin_message, delete_message, edit_message)
   - **Add Reactions** (required for add_reaction)
   - **Manage Webhooks** (required for webhook tools)
   - **Create Public Threads** (required for create_thread, create_thread_from_message)
   - **Send Messages in Threads** (required for sending messages to threads)
   - **Manage Threads** (required for list_private_archived_threads)
4. Open the generated URL → add to your server

**Note**: The bot needs these permissions in each channel it will access. Some tools like `list_private_archived_threads` require elevated permissions.

### 3. Get Server ID

1. Discord app → Settings → Advanced → enable "Developer Mode"
2. Right-click your server icon → "Copy Server ID"

### 4. Channel Permissions

The bot needs access to channels it will use. In Discord:
- Server Settings → Channels → select channel → Permissions
- Add the bot role and grant the permissions listed above

## MCP Configuration

### Kiro

Add to `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/home/ksy/10_programs/discord/dist/index.js"],
      "env": {
        "DISCORD_TOKEN": "your_bot_token",
        "DISCORD_GUILD_ID": "your_server_id"
      }
    }
  }
}
```

Then in Kiro you can say:
- "Discordの#devチャンネルにこの調査結果を投稿して"
- "#devのスレッド一覧を見せて"
- "この内容でスレッドを作成して"

### Claude Code

```bash
claude mcp add discord \
  -e DISCORD_TOKEN=your_bot_token \
  -e DISCORD_GUILD_ID=your_server_id \
  -- node /home/ksy/10_programs/discord/dist/index.js
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Discord Bot token |
| `DISCORD_GUILD_ID` | No | Default server ID. When set, `guild_id` parameter becomes optional for all tools that need it |

## Tools (22)

### Message

| Tool | Description | Key Parameters |
|---|---|---|
| `send_message` | Send a message to a channel or thread | `channel_id`, `content` |
| `read_messages` | Read message history | `channel_id`, `limit?`, `before?`, `after?` |
| `edit_message` | Edit a message content | `channel_id`, `message_id`, `content` |
| `delete_message` | Delete a message | `channel_id`, `message_id` |
| `search_messages` | Search messages containing specific text | `channel_id`, `query`, `limit?` |
| `add_reaction` | Add emoji reaction to a message | `channel_id`, `message_id`, `emoji` |
| `pin_message` | Pin a message | `channel_id`, `message_id` |
| `get_pinned_messages` | Get pinned messages | `channel_id` |

### Thread

| Tool | Description | Key Parameters |
|---|---|---|
| `create_thread_from_message` | Create thread from existing message | `channel_id`, `message_id`, `name` |
| `create_thread` | Create new thread (no parent message) | `channel_id`, `name`, `type?` |
| `list_active_threads` | List active threads in server | `guild_id?` |
| `list_archived_threads` | List archived public threads in channel | `channel_id`, `limit?` |
| `list_private_archived_threads` | List archived private threads in channel | `channel_id`, `limit?` |

### Channel / Server / User

| Tool | Description | Key Parameters |
|---|---|---|
| `list_channels` | List all channels in server | `guild_id?` |
| `find_channel` | Find channel by name (partial match) | `name`, `guild_id?` |
| `get_channel` | Get channel details | `channel_id` |
| `get_server_info` | Get server information | `guild_id?` |
| `find_user` | Search user by name (returns `<@id>` for mentions) | `query`, `guild_id?`, `limit?` |

### Webhook (Agent Identification)

| Tool | Description | Key Parameters |
|---|---|---|
| `create_webhook` | Create webhook for a channel | `channel_id`, `name` |
| `list_webhooks` | List webhooks for a channel | `channel_id` |
| `send_webhook_message` | Send message as custom agent name/avatar | `webhook_id`, `webhook_token`, `content`, `username?`, `avatar_url?` |
| `delete_webhook` | Delete a webhook | `webhook_id` |

## Usage Patterns

### Basic: Post a note to a channel

```
1. find_channel(name="dev")           → get channel_id
2. send_message(channel_id, content)  → message posted
```

### Thread workflow: Discuss a topic

```
1. send_message(channel_id, content)                          → post idea
2. create_thread_from_message(channel_id, message_id, name)   → start discussion
3. send_message(thread_id, content)                            → reply in thread
```

### Agent identification: Post as different agents

```
1. create_webhook(channel_id, name="dev-hub")                 → get webhook_id + token (once)
2. send_webhook_message(webhook_id, token, content, username="kiro-project-a")
3. send_webhook_message(webhook_id, token, content, username="claude-research")
```

### Curate useful content

```
1. add_reaction(channel_id, message_id, "👍")   → mark as useful
2. pin_message(channel_id, message_id)           → pin important info
3. get_pinned_messages(channel_id)               → review pinned items
```

### Mention a user

```
1. find_user(query="ksy")   → returns { mention: "<@805968862028890133>" }
2. send_message(channel_id, "Hey <@805968862028890133> check this out")
```

## Docs

- [Architecture Design](docs/design.md)
- [API Mapping](docs/api-mapping.md) — full endpoint details for all 18 tools
- [Task Plan](docs/task-plan.md)
