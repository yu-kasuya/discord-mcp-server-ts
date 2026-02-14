# Discord MCP Server — Task Plan

## Task 1: プロジェクト初期化 + Discord REST APIクライアント + get_server_info

### Files
- `package.json` — npm init + dependencies
- `tsconfig.json` — TypeScript設定
- `src/discord-client.ts` — Discord REST APIクライアント
- `src/tools/server.ts` — get_server_info ツール
- `src/index.ts` — MCP Server骨格 + ツール登録

### Dependencies
```
@modelcontextprotocol/sdk
typescript
```

### discord-client.ts 仕様
```typescript
class DiscordClient {
  constructor(token: string)
  get(path: string): Promise<any>
  post(path: string, body: object): Promise<any>
  put(path: string, body?: object): Promise<any>
  delete(path: string): Promise<any>
  // 内部: fetch + Authorization: Bot {token} + rate limit retry
}
```

### index.ts 仕様
- McpServer + StdioServerTransport で起動
- DISCORD_TOKEN 環境変数チェック（必須）
- DISCORD_GUILD_ID 環境変数読み取り（オプション）
- 各ツールファイルの register() を呼び出し

### ツール登録パターン（全ファイル共通）
```typescript
// src/tools/server.ts
export function register(server: McpServer, client: DiscordClient, defaultGuildId?: string) {
  server.tool("get_server_info", { ... }, async (params) => { ... });
}
```

### 確認方法
```bash
DISCORD_TOKEN=xxx DISCORD_GUILD_ID=yyy npx ts-node src/index.ts
# → MCP経由で get_server_info を呼び出し、サーバー名が返ることを確認
```

---

## Task 2: メッセージ送受信ツール

### Files
- `src/tools/messages.ts` — send_message, read_messages

### send_message
```typescript
server.tool("send_message", {
  channel_id: z.string(),
  content: z.string()
}, async ({ channel_id, content }) => {
  const result = await client.post(`/channels/${channel_id}/messages`, { content });
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
```

### read_messages
```typescript
server.tool("read_messages", {
  channel_id: z.string(),
  limit: z.number().optional(),
  before: z.string().optional(),
  after: z.string().optional()
}, async ({ channel_id, limit, before, after }) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (before) params.set("before", before);
  if (after) params.set("after", after);
  const query = params.toString() ? `?${params}` : "";
  const result = await client.get(`/channels/${channel_id}/messages${query}`);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
```

---

## Task 3: スレッド操作ツール

### Files
- `src/tools/threads.ts` — 4ツール

### create_thread_from_message
- `POST /channels/{channel_id}/messages/{message_id}/threads`
- Body: `{ name, auto_archive_duration? }`

### create_thread
- `POST /channels/{channel_id}/threads`
- Body: `{ name, type: 11, auto_archive_duration? }`
- ツール側デフォルト type=11 (PUBLIC_THREAD)

### list_active_threads
- `GET /guilds/{guild_id}/threads/active`
- guild_id フォールバック対応

### list_archived_threads
- `GET /channels/{channel_id}/threads/archived/public`
- limit, before パラメータ対応

---

## Task 4: チャンネル・サーバー情報 + ユーザー検索

### Files
- `src/tools/channels.ts` — list_channels, find_channel, get_channel
- `src/tools/users.ts` — find_user

### find_channel 実装
- `GET /guilds/{guild_id}/channels` を呼び出し
- レスポンスを `name` で部分一致フィルタ
- id, name, type, parent_id のみ返す

### find_user 実装
- `GET /guilds/{guild_id}/members/search?query={query}&limit={limit}`
- レスポンスに `mention: "<@{user.id}>"` を付加して返す

---

## Task 5: リアクション + ピン留め

### Files
- `src/tools/messages.ts` に追加

### add_reaction
- `PUT /channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me`
- emoji は `encodeURIComponent()` でエンコード
- 204 No Content → 成功メッセージを返す

### pin_message
- `PUT /channels/{channel_id}/messages/pins/{message_id}`
- 204 No Content → 成功メッセージを返す

### get_pinned_messages
- `GET /channels/{channel_id}/messages/pins`
- 新API: `{ items: [...], has_more: boolean }` 形式

---

## Task 6: Webhook管理ツール

### Files
- `src/tools/webhooks.ts` — 4ツール

### send_webhook_message 特記事項
- Bot Token認証不要（webhook_tokenがURL内）
- `POST /webhooks/{webhook_id}/{webhook_token}?wait=true`
- `?wait=true` でレスポンスにMessage objectが返る
- `username`, `avatar_url` パラメータでagent識別

### discord-client.ts への追加
- `postWebhook(webhookId, token, body)` メソッド追加（Bot Token不要のため別メソッド）

---

## Task 7: docs作成 + README

### Files
- `docs/design.md` ✅ 作成済み
- `docs/api-mapping.md` ✅ 作成済み
- `docs/task-plan.md` ✅ 本ドキュメント
- `README.md` — セットアップ手順、MCP設定例

### README.md 内容
- プロジェクト概要
- セットアップ手順（npm install, build）
- 環境変数
- Kiro MCP設定例
- Claude Code MCP設定例
- ツール一覧（簡易）
