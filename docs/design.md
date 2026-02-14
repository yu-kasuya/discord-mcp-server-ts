# Discord MCP Server — Architecture Design

## Overview

人間と複数のAI agent（Kiro, Claude Code等）がDiscordサーバーを開発ナレッジ共有ハブとして使うためのMCPサーバー。
既存実装（SaseQ/discord-mcp, hanweg/mcp-discord）にはスレッド操作がないため自作。

## System Architecture

```
┌─────────────────────────────────────────────────┐
│  AI Agents                                      │
│  ┌───────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Kiro  │  │ Claude Code│  │ Other Agents  │  │
│  └───┬───┘  └─────┬──────┘  └──────┬────────┘  │
│      │            │                │            │
│      └────────────┼────────────────┘            │
│                   │ stdio                       │
├───────────────────┼─────────────────────────────┤
│  MCP Server       │                             │
│  ┌────────────────▼────────────────────────┐    │
│  │  index.ts                               │    │
│  │  McpServer + StdioServerTransport       │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │  Tool Handlers (18 tools)        │   │    │
│  │  │  messages / threads / channels   │   │    │
│  │  │  server / users / webhooks       │   │    │
│  │  └──────────────┬───────────────────┘   │    │
│  │                 │                       │    │
│  │  ┌──────────────▼───────────────────┐   │    │
│  │  │  discord-client.ts               │   │    │
│  │  │  - Bot Token auth header         │   │    │
│  │  │  - fetch() wrapper               │   │    │
│  │  │  - Rate limit retry (429)        │   │    │
│  │  │  - Error handling                │   │    │
│  │  └──────────────┬───────────────────┘   │    │
│  └─────────────────┼───────────────────────┘    │
│                    │ HTTPS                       │
├────────────────────┼────────────────────────────┤
│  Discord           │                            │
│  ┌─────────────────▼──────────────────────┐     │
│  │  REST API v10                          │     │
│  │  https://discord.com/api/v10           │     │
│  │                                        │     │
│  │  Channels ─── Messages ─── Threads     │     │
│  │  Guilds ───── Members                  │     │
│  │  Webhooks (agent identity override)    │     │
│  └────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Choice | Reason |
|---|---|---|
| Language | TypeScript | 型安全、MCP SDK公式サポート |
| MCP SDK | @modelcontextprotocol/sdk | 公式SDK |
| Transport | stdio | Kiro/Claude Code統合に最適 |
| HTTP Client | Node.js built-in fetch | 依存ゼロ |
| Discord API | REST API v10 直接呼び出し | discord.js不使用、薄いラッパーで十分 |

## Directory Structure

```
discord/
├── docs/
│   ├── design.md           # 本ドキュメント
│   ├── api-mapping.md      # ツール↔API詳細マッピング
│   └── task-plan.md        # 実装タスク計画
├── src/
│   ├── index.ts            # エントリポイント（MCP Server起動 + 全ツール登録）
│   ├── discord-client.ts   # Discord REST APIクライアント
│   └── tools/
│       ├── messages.ts     # send_message, read_messages, add_reaction, pin_message, get_pinned_messages
│       ├── threads.ts      # create_thread_from_message, create_thread, list_active_threads, list_archived_threads
│       ├── channels.ts     # list_channels, find_channel, get_channel
│       ├── server.ts       # get_server_info
│       ├── users.ts        # find_user
│       └── webhooks.ts     # create_webhook, list_webhooks, send_webhook_message, delete_webhook
├── package.json
├── tsconfig.json
└── README.md
```

## Key Design Decisions

### 1. Bot Token共有 + Webhook agent識別

1つのBot Tokenを全agentで共有。通常のメッセージ送信（`send_message`）はBot名義で投稿される。
agent識別が必要な場合は `send_webhook_message` を使い、`username` と `avatar_url` パラメータで
agentごとに異なる表示名・アバターを設定する。

```
send_webhook_message(webhook_id, token, content, username="kiro-project-a", avatar_url="...")
send_webhook_message(webhook_id, token, content, username="claude-research", avatar_url="...")
```

### 2. スレッド必須

トピックごとにスレッドを使い、チャンネルの会話スプロールを防ぐ。
- `create_thread_from_message`: 既存メッセージからスレッド作成（アイデア投稿→議論）
- `create_thread`: メッセージなしでスレッド作成（新トピック開始）
- スレッドはchannelの一種（type=11 PUBLIC_THREAD）なので、`send_message` / `read_messages` でそのまま読み書き可能

### 3. Discord REST APIクライアント設計

```typescript
// discord-client.ts の責務
class DiscordClient {
  // GET/POST/PUT/PATCH/DELETE の汎用メソッド
  // - Authorization: Bot {token} ヘッダ自動付与
  // - 429 Rate Limit → Retry-After秒待機してリトライ
  // - 非2xx → エラーメッセージ付きで throw
}
```

### 4. 環境変数

| Variable | Required | Description |
|---|---|---|
| DISCORD_TOKEN | Yes | Bot token |
| DISCORD_GUILD_ID | No | デフォルトguild ID。設定するとguild_idパラメータが省略可能に |

### 5. ツール設計方針

- 各ツールファイルは `register(server, client)` 関数をexport
- `index.ts` で全ツールファイルのregisterを呼び出し
- guild_idが必要なツールは、パラメータ未指定時に `DISCORD_GUILD_ID` 環境変数をフォールバック
- レスポンスはDiscord APIのJSONをそのまま返す（加工しない）→ agentが自由に解釈可能

## Comparison with Existing Implementations

| Feature | SaseQ/discord-mcp (Java) | hanweg/mcp-discord (Python) | This Server |
|---|---|---|---|
| Language | Java (JDA) | Python (discord.py) | TypeScript |
| Thread Support | ❌ | ❌ | ✅ (4 tools) |
| Webhook Agent ID | ✅ | ❌ | ✅ |
| Pin Messages | ❌ | ❌ | ✅ |
| Reactions | ✅ | ❌ | ✅ |
| Channel Find | ✅ | ❌ | ✅ |
| User Search | ✅ | ❌ | ✅ |
| DM Support | ✅ | ✅ | ❌ (不要) |
| Role Management | ✅ | ❌ | ❌ (不要) |
| Category Management | ✅ | ❌ | ❌ (不要) |
| Total Tools | 30 | 8 | 18 |

## Future Extensions

- **Consultant Bot**: Gateway接続でリアルタイム応答（現在はオンデマンドのみ）
- **Daily Summary**: 1日の活動をまとめて投稿する自動化
- **Forum Channel**: `GUILD_FORUM` (type=15) でのスレッド作成対応
- **Message Edit/Delete**: 投稿の修正・削除ツール追加
- **Cross-project Knowledge Reuse**: プロジェクト横断でのナレッジ検索
