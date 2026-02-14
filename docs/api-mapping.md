# Discord MCP Server — API Mapping

全18ツールとDiscord REST API v10エンドポイントの詳細マッピング。

Base URL: `https://discord.com/api/v10`

---

## Message Tools

### send_message

| Item | Value |
|---|---|
| Endpoint | `POST /channels/{channel_id}/messages` |
| Description | チャンネルまたはスレッドにメッセージを送信 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルまたはスレッドのID |
| content | string | Yes | メッセージ内容（最大2000文字） |

Request Body:
```json
{ "content": "Hello, World!" }
```

Response: Message object（id, channel_id, content, author, timestamp等）

---

### read_messages

| Item | Value |
|---|---|
| Endpoint | `GET /channels/{channel_id}/messages` |
| Description | チャンネルまたはスレッドのメッセージ履歴を取得 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| channel_id | string | Yes | - | チャンネルまたはスレッドのID |
| limit | number | No | 50 | 取得件数（1-100） |
| before | string | No | - | このメッセージIDより前を取得 |
| after | string | No | - | このメッセージIDより後を取得 |

Query String: `?limit={limit}&before={before}&after={after}`

Response: Array of Message objects（新しい順）

---

### add_reaction

| Item | Value |
|---|---|
| Endpoint | `PUT /channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me` |
| Description | メッセージにリアクション（絵文字）を追加 |
| Auth | Bot Token |
| Response | 204 No Content |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルID |
| message_id | string | Yes | メッセージID |
| emoji | string | Yes | 絵文字（Unicode: `👍`、カスタム: `name:id`） |

Note: emojiはURL Encodeが必要。`encodeURIComponent('👍')` → `%F0%9F%91%8D`

---

### pin_message

| Item | Value |
|---|---|
| Endpoint | `PUT /channels/{channel_id}/messages/pins/{message_id}` |
| Description | メッセージをピン留め |
| Auth | Bot Token |
| Response | 204 No Content |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルID |
| message_id | string | Yes | メッセージID |

---

### get_pinned_messages

| Item | Value |
|---|---|
| Endpoint | `GET /channels/{channel_id}/messages/pins` |
| Description | ピン留めされたメッセージ一覧を取得 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルID |
| limit | number | No | 取得件数（1-50、デフォルト50） |

Response:
```json
{
  "items": [{ "pinned_at": "ISO8601", "message": { ...Message object } }],
  "has_more": false
}
```

---

## Thread Tools

### create_thread_from_message

| Item | Value |
|---|---|
| Endpoint | `POST /channels/{channel_id}/messages/{message_id}/threads` |
| Description | 既存メッセージからスレッドを作成 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| channel_id | string | Yes | - | 親チャンネルID |
| message_id | string | Yes | - | スレッド元メッセージID |
| name | string | Yes | - | スレッド名（1-100文字） |
| auto_archive_duration | number | No | 1440 | 自動アーカイブ（分）: 60, 1440, 4320, 10080 |

Request Body:
```json
{ "name": "Discussion: new feature", "auto_archive_duration": 1440 }
```

Response: Channel object（type=11 PUBLIC_THREAD）

Note: GUILD_TEXTチャンネルではPUBLIC_THREAD、GUILD_ANNOUNCEMENTではANNOUNCEMENT_THREADが作成される。スレッドIDはメッセージIDと同一。

---

### create_thread

| Item | Value |
|---|---|
| Endpoint | `POST /channels/{channel_id}/threads` |
| Description | メッセージなしでスレッドを作成 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| channel_id | string | Yes | - | 親チャンネルID |
| name | string | Yes | - | スレッド名（1-100文字） |
| type | number | No | 11 | スレッドタイプ（11=PUBLIC_THREAD, 12=PRIVATE_THREAD） |
| auto_archive_duration | number | No | 1440 | 自動アーカイブ（分） |

Request Body:
```json
{ "name": "New topic", "type": 11, "auto_archive_duration": 1440 }
```

Response: Channel object

Note: Discord APIのデフォルトはPRIVATE_THREAD(12)だが、ツール側でデフォルトをPUBLIC_THREAD(11)に設定。

---

### list_active_threads

| Item | Value |
|---|---|
| Endpoint | `GET /guilds/{guild_id}/threads/active` |
| Description | サーバー内のアクティブスレッド一覧 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| guild_id | string | Yes* | サーバーID（*DISCORD_GUILD_IDでフォールバック） |

Response:
```json
{
  "threads": [{ ...Channel object }],
  "members": [{ ...ThreadMember object }]
}
```

---

### list_archived_threads

| Item | Value |
|---|---|
| Endpoint | `GET /channels/{channel_id}/threads/archived/public` |
| Description | チャンネル内のアーカイブ済み公開スレッド一覧 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | 親チャンネルID |
| limit | number | No | 取得件数 |
| before | string | No | このタイムスタンプ（ISO8601）より前を取得 |

Response:
```json
{
  "threads": [{ ...Channel object }],
  "members": [{ ...ThreadMember object }],
  "has_more": false
}
```

---

## Channel Tools

### list_channels

| Item | Value |
|---|---|
| Endpoint | `GET /guilds/{guild_id}/channels` |
| Description | サーバー内の全チャンネル一覧 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| guild_id | string | Yes* | サーバーID |

Response: Array of Channel objects

---

### find_channel

| Item | Value |
|---|---|
| Endpoint | `GET /guilds/{guild_id}/channels` + クライアント側nameフィルタ |
| Description | チャンネル名で検索してIDとtypeを取得 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| guild_id | string | Yes* | サーバーID |
| name | string | Yes | チャンネル名（部分一致） |

Implementation: list_channelsの結果をname部分一致でフィルタ

Response: Filtered array of Channel objects（id, name, type, parent_id）

---

### get_channel

| Item | Value |
|---|---|
| Endpoint | `GET /channels/{channel_id}` |
| Description | チャンネルの詳細情報を取得 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルID |

Response: Channel object

---

## Server Tools

### get_server_info

| Item | Value |
|---|---|
| Endpoint | `GET /guilds/{guild_id}` |
| Description | サーバーの詳細情報を取得 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| guild_id | string | Yes* | サーバーID |

Response: Guild object（id, name, icon, owner_id, member_count等）

---

## User Tools

### find_user

| Item | Value |
|---|---|
| Endpoint | `GET /guilds/{guild_id}/members/search?query={query}` |
| Description | ユーザー名で検索（メンション `<@id>` 用） |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| guild_id | string | Yes* | サーバーID |
| query | string | Yes | ユーザー名（部分一致） |
| limit | number | No | 取得件数（1-1000、デフォルト1） |

Query String: `?query={query}&limit={limit}`

Response: Array of GuildMember objects（user.id, user.username, nick等）

---

## Webhook Tools

### create_webhook

| Item | Value |
|---|---|
| Endpoint | `POST /channels/{channel_id}/webhooks` |
| Description | チャンネルにWebhookを作成 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルID |
| name | string | Yes | Webhook名（1-80文字） |

Request Body:
```json
{ "name": "dev-hub-webhook" }
```

Response: Webhook object（id, token, channel_id等）

---

### list_webhooks

| Item | Value |
|---|---|
| Endpoint | `GET /channels/{channel_id}/webhooks` |
| Description | チャンネルのWebhook一覧 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| channel_id | string | Yes | チャンネルID |

Response: Array of Webhook objects

---

### send_webhook_message

| Item | Value |
|---|---|
| Endpoint | `POST /webhooks/{webhook_id}/{webhook_token}` |
| Description | Webhook経由でメッセージ送信（agent識別用） |
| Auth | なし（tokenがURL内） |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| webhook_id | string | Yes | Webhook ID |
| webhook_token | string | Yes | Webhook token |
| content | string | Yes | メッセージ内容 |
| username | string | No | 表示名オーバーライド（agent名） |
| avatar_url | string | No | アバターURLオーバーライド |

Request Body:
```json
{
  "content": "Research findings on...",
  "username": "kiro-project-a",
  "avatar_url": "https://example.com/kiro-avatar.png"
}
```

Response: Message object（`?wait=true` 付きの場合）

Note: Bot Token認証不要。webhook_tokenがURL内に含まれるため。`?wait=true` を付けるとレスポンスにMessage objectが返る。

---

### delete_webhook

| Item | Value |
|---|---|
| Endpoint | `DELETE /webhooks/{webhook_id}` |
| Description | Webhookを削除 |
| Auth | Bot Token |

Parameters:
| Name | Type | Required | Description |
|---|---|---|---|
| webhook_id | string | Yes | Webhook ID |

Response: 204 No Content

---

## Common Notes

### Authentication
全エンドポイント（send_webhook_message除く）で以下のヘッダが必要:
```
Authorization: Bot {DISCORD_TOKEN}
Content-Type: application/json
```

### Rate Limiting
429レスポンス時、`Retry-After` ヘッダの秒数だけ待機してリトライ。

### guild_id フォールバック
`*` マーク付きのパラメータは、未指定時に `DISCORD_GUILD_ID` 環境変数をフォールバック。
両方未指定の場合はエラー。

### Channel Types Reference
| Type | ID | Description |
|---|---|---|
| GUILD_TEXT | 0 | テキストチャンネル |
| GUILD_VOICE | 2 | ボイスチャンネル |
| GUILD_CATEGORY | 4 | カテゴリ |
| GUILD_ANNOUNCEMENT | 5 | アナウンスチャンネル |
| PUBLIC_THREAD | 11 | 公開スレッド |
| PRIVATE_THREAD | 12 | プライベートスレッド |
| GUILD_FORUM | 15 | フォーラムチャンネル |
