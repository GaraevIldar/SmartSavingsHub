# NexTalk — C4-модель

> Микросервисная архитектура с Zitadel, Nginx, Kubernetes.
> YAML для импорта в [IcePanel](https://icepanel.io) + Flows для основных сценариев.

---

## Как импортировать в IcePanel

1. Зарегистрируйтесь на [app.icepanel.io](https://app.icepanel.io).
2. Создайте Organization → Landscape.
3. **Import Model** → вставьте YAML из раздела ниже.
4. Расположите объекты на диаграмме и создайте Flows.

---

## Структура модели

### C4 Level 1 — System Context

| Тип | Объект | Описание |
|:--|:--|:--|
| Actor | Пользователь | Общается через браузер: текст, голос |
| Actor | Админ платформы | Мониторинг через Grafana |
| System | **NexTalk** | Платформа командного общения (микросервисы) |

### C4 Level 2 — Container Diagram

| Тип | Контейнер | Технология | Описание |
|:--|:--|:--|:--|
| App | Vue.js SPA | Vue 3, TypeScript | UI, OIDC-клиент, SignalR, LiveKit |
| App | Nginx | Nginx / Ingress Controller | Reverse proxy, rate limiting, routing |
| App | WebSocket Gateway | ASP.NET + SignalR | WS-соединения, broadcast, presence |
| App | Guild Service | ASP.NET | Серверы, каналы, роли, инвайты, модерация |
| App | Messaging Service | ASP.NET | Сообщения, Outbox Pattern, идемпотентность |
| App | Voice Service | ASP.NET | Голосовые сессии, LiveKit-токены |
| App | Zitadel | Go | IdP: OIDC, регистрация, логин, JWT |
| Store | PostgreSQL | PostgreSQL 17 | БД nextalk (guild, messaging) + БД zitadel |
| App | LiveKit | Go | SFU + встроенный TURN |
| App | Prometheus | Prometheus | Сбор метрик /metrics |
| App | Grafana | Grafana | Дашборды |

### C4 Level 3 — Components

#### Nginx

| Компонент | Описание |
|:--|:--|
| Reverse Proxy | Маршрутизация по location → upstream сервисы |
| Rate Limiter | limit_req_zone: 100 RPS на IP |
| WebSocket Proxy | proxy_pass с Upgrade для SignalR |
| Correlation ID | proxy_set_header X-Request-Id $request_id |

#### WebSocket Gateway

| Компонент | Описание |
|:--|:--|
| ChatHub (SignalR) | SendMessage, ReceiveMessage, Heartbeat |
| ConnectionManager | userId ↔ connectionId маппинг |
| PresenceTracker | In-memory ConcurrentDictionary, heartbeat TTL |
| MessagingHttpClient | HTTP → Messaging Service (Polly: Retry + CB) |
| GuildHttpClient | HTTP → Guild Service (Polly: Retry + CB) |
| BroadcastController | POST /internal/broadcast (от Outbox) |

#### Guild Service

| Компонент | Описание |
|:--|:--|
| GuildController | CRUD серверов |
| ChannelController | CRUD каналов |
| InviteController | Создание и принятие инвайтов |
| MemberController | Список, кик, бан, назначение ролей |
| InternalAccessController | GET /internal/channels/{id}/check-access |
| RbacService | Проверка прав (3 фиксированные роли: Owner/Admin/Member) |

#### Messaging Service

| Компонент | Описание |
|:--|:--|
| InternalMessageController | POST /internal/messages (от WS Gateway) |
| MessageController | GET history, DELETE message |
| IdempotencyMiddleware | Проверка X-Idempotency-Key |
| OutboxWriter | INSERT outbox_event в транзакции с message |
| OutboxWorker | BackgroundService: poll → Channel → broadcast |
| BroadcastConsumer | POST /internal/broadcast в WS Gateway |

#### Voice Service

| Компонент | Описание |
|:--|:--|
| VoiceController | POST join, POST leave |
| InternalVoiceController | DELETE /internal/voice/{userId}/disconnect |
| LiveKitTokenGenerator | Генерация JWT для LiveKit |
| LiveKitRoomClient | HTTP API: создание/удаление комнат |
| SessionStore | In-memory: userId → channelId |

---

## YAML для импорта в IcePanel

```yaml
# yaml-language-server: $schema=https://api.icepanel.io/v1/schemas/LandscapeImportData
namespace: nextalk
tagGroups:
- id: tg-layer
  name: Layer
  icon: globe
- id: tg-tech
  name: Technology
  icon: microchip
tags:
- id: tag-frontend
  groupId: tg-layer
  name: Frontend
  color: green
- id: tag-gateway
  groupId: tg-layer
  name: Gateway
  color: pink
- id: tag-service
  groupId: tg-layer
  name: Service
  color: blue
- id: tag-storage
  groupId: tg-layer
  name: Storage
  color: orange
- id: tag-media
  groupId: tg-layer
  name: Media
  color: purple
- id: tag-idp
  groupId: tg-layer
  name: Identity Provider
  color: yellow
- id: tag-observability
  groupId: tg-layer
  name: Observability
  color: grey
- id: tag-dotnet
  groupId: tg-tech
  name: ASP.NET
  color: blue
- id: tag-vue
  groupId: tg-tech
  name: Vue.js 3
  color: green
- id: tag-go
  groupId: tg-tech
  name: Go
  color: blue
- id: tag-postgres
  groupId: tg-tech
  name: PostgreSQL
  color: orange
- id: tag-nginx
  groupId: tg-tech
  name: Nginx
  color: pink

modelObjects:

# --- Domain ---
- id: domain-nextalk
  name: NexTalk
  type: domain
  description: Платформа командного общения (микросервисы + k8s)

# --- Actors ---
- id: actor-user
  name: Пользователь
  type: actor
  parentId: domain-nextalk
  description: Общается через браузер — текст и голос
  caption: Браузер

- id: actor-admin
  name: Админ платформы
  type: actor
  parentId: domain-nextalk
  description: Мониторинг через Grafana
  caption: Технический специалист

# --- System ---
- id: system-nextalk
  name: NexTalk Platform
  type: system
  parentId: domain-nextalk
  description: Микросервисная платформа с Zitadel (IdP), Nginx, Kubernetes
  caption: Микросервисы + k8s

# --- Frontend ---
- id: app-spa
  name: Vue.js SPA
  type: app
  parentId: system-nextalk
  description: 'UI: OIDC-клиент (oidc-client-ts), SignalR, LiveKit-клиент'
  caption: Vue 3 + TypeScript
  tagIds: [tag-frontend, tag-vue]

# --- Nginx ---
- id: app-nginx
  name: Nginx
  type: app
  parentId: system-nextalk
  description: 'Reverse proxy. Rate limiting (100 RPS/IP). Routing, WebSocket upgrade, Correlation ID.'
  caption: Nginx / Ingress Controller
  tagIds: [tag-gateway, tag-nginx]

# --- Zitadel ---
- id: app-zitadel
  name: Zitadel
  type: app
  parentId: system-nextalk
  description: 'Identity Provider. OIDC Authorization Code + PKCE. Регистрация, логин, JWT.'
  caption: Go — OIDC IdP
  tagIds: [tag-idp, tag-go]

# --- Business Services ---
- id: app-ws-gateway
  name: WebSocket Gateway
  type: app
  parentId: system-nextalk
  description: 'SignalR Hub: broadcast, heartbeat, presence (in-memory). Polly для downstream.'
  caption: ASP.NET + SignalR
  tagIds: [tag-gateway, tag-dotnet]

- id: app-guild
  name: Guild Service
  type: app
  parentId: system-nextalk
  description: 'Серверы, каналы, RBAC (3 роли), инвайты, модерация (кик/бан).'
  caption: Серверы, каналы, права
  tagIds: [tag-service, tag-dotnet]

- id: app-messaging
  name: Messaging Service
  type: app
  parentId: system-nextalk
  description: 'Сообщения (plain text). Outbox Pattern, идемпотентность (X-Idempotency-Key).'
  caption: Сообщения + Outbox
  tagIds: [tag-service, tag-dotnet]

- id: app-voice
  name: Voice Service
  type: app
  parentId: system-nextalk
  description: 'Голосовые сессии: join/leave, генерация JWT для LiveKit, управление комнатами.'
  caption: Голос + LiveKit
  tagIds: [tag-service, tag-dotnet]

# --- Storage ---
- id: store-postgres
  name: PostgreSQL
  type: store
  parentId: system-nextalk
  description: 'Два DB: nextalk (схемы guild, messaging) и zitadel (managed by Zitadel).'
  caption: PostgreSQL 17
  tagIds: [tag-storage, tag-postgres]

# --- Media ---
- id: app-livekit
  name: LiveKit
  type: app
  parentId: system-nextalk
  description: 'SFU-медиасервер со встроенным TURN. Пересылает голосовые SRTP-потоки.'
  caption: Go — SFU + TURN
  tagIds: [tag-media, tag-go]

# --- Observability ---
- id: app-prometheus
  name: Prometheus
  type: app
  parentId: system-nextalk
  description: Сбор метрик со всех .NET сервисов (/metrics).
  caption: Metrics collector
  tagIds: [tag-observability]

- id: app-grafana
  name: Grafana
  type: app
  parentId: system-nextalk
  description: Визуализация метрик. Дашборды для .NET, PostgreSQL.
  caption: Dashboards
  tagIds: [tag-observability]

# --- Components: WebSocket Gateway ---
- id: comp-ws-hub
  name: ChatHub
  type: component
  parentId: app-ws-gateway
  description: 'SignalR Hub: SendMessage, ReceiveMessage, Heartbeat'

- id: comp-ws-presence
  name: PresenceTracker
  type: component
  parentId: app-ws-gateway
  description: In-memory ConcurrentDictionary (userId → lastSeen)

- id: comp-ws-broadcast
  name: BroadcastController
  type: component
  parentId: app-ws-gateway
  description: POST /internal/broadcast — от Outbox Worker

- id: comp-ws-connmgr
  name: ConnectionManager
  type: component
  parentId: app-ws-gateway
  description: userId ↔ connectionId mapping, SignalR Groups

# --- Components: Guild Service ---
- id: comp-guild-controller
  name: GuildController
  type: component
  parentId: app-guild
  description: CRUD серверов и каналов

- id: comp-guild-invite
  name: InviteController
  type: component
  parentId: app-guild
  description: Создание и принятие инвайтов

- id: comp-guild-member
  name: MemberController
  type: component
  parentId: app-guild
  description: Список, кик, бан, назначение ролей

- id: comp-guild-rbac
  name: RbacService
  type: component
  parentId: app-guild
  description: 'Owner / Admin / Member — хардкоженные права'

- id: comp-guild-internal
  name: InternalAccessController
  type: component
  parentId: app-guild
  description: GET /internal/channels/{id}/check-access

# --- Components: Messaging Service ---
- id: comp-msg-internal
  name: InternalMessageController
  type: component
  parentId: app-messaging
  description: POST /internal/messages (от WS Gateway)

- id: comp-msg-controller
  name: MessageController
  type: component
  parentId: app-messaging
  description: GET history, DELETE message

- id: comp-msg-idempotency
  name: IdempotencyMiddleware
  type: component
  parentId: app-messaging
  description: Проверка X-Idempotency-Key

- id: comp-msg-outbox
  name: OutboxWorker
  type: component
  parentId: app-messaging
  description: 'BackgroundService: poll outbox → Channel → broadcast'

# --- Components: Voice Service ---
- id: comp-voice-controller
  name: VoiceController
  type: component
  parentId: app-voice
  description: POST join/leave

- id: comp-voice-token
  name: LiveKitTokenGenerator
  type: component
  parentId: app-voice
  description: Генерация JWT для LiveKit

- id: comp-voice-room
  name: LiveKitRoomClient
  type: component
  parentId: app-voice
  description: HTTP API LiveKit — создание/удаление комнат

modelConnections:

# --- User → Frontend ---
- id: conn-user-spa
  name: Использует
  originId: actor-user
  targetId: app-spa
  direction: outgoing
  description: Браузер

- id: conn-admin-grafana
  name: Мониторинг
  originId: actor-admin
  targetId: app-grafana
  direction: outgoing
  description: Grafana дашборды

# --- SPA → nginx ---
- id: conn-spa-nginx
  name: HTTPS
  originId: app-spa
  targetId: app-nginx
  direction: outgoing
  description: Все REST-запросы и WebSocket через Nginx

# --- SPA → Zitadel (через Nginx) ---
- id: conn-spa-zitadel
  name: OIDC
  originId: app-spa
  targetId: app-zitadel
  direction: outgoing
  description: 'Redirect: логин/регистрация через Zitadel UI'

# --- SPA → LiveKit ---
- id: conn-spa-livekit
  name: WebRTC
  originId: app-spa
  targetId: app-livekit
  direction: bidirectional
  description: Голосовые SRTP-потоки

# --- nginx → Services ---
- id: conn-nginx-guild
  name: '/api/guilds/*, /api/invites/*'
  originId: app-nginx
  targetId: app-guild
  direction: outgoing
  description: Proxy

- id: conn-nginx-messaging
  name: '/api/channels/*/messages, /api/messages/*'
  originId: app-nginx
  targetId: app-messaging
  direction: outgoing
  description: Proxy

- id: conn-nginx-voice
  name: '/api/voice/*'
  originId: app-nginx
  targetId: app-voice
  direction: outgoing
  description: Proxy

- id: conn-nginx-wsgw
  name: '/ws (WebSocket upgrade)'
  originId: app-nginx
  targetId: app-ws-gateway
  direction: outgoing
  description: SignalR WebSocket proxy

- id: conn-nginx-zitadel
  name: '/auth/*, /.well-known/*'
  originId: app-nginx
  targetId: app-zitadel
  direction: outgoing
  description: OIDC endpoints proxy

# --- Inter-service ---
- id: conn-wsgw-messaging
  name: HTTP (Polly)
  originId: app-ws-gateway
  targetId: app-messaging
  direction: outgoing
  description: 'POST /internal/messages (Retry + CB)'

- id: conn-wsgw-guild
  name: HTTP (Polly)
  originId: app-ws-gateway
  targetId: app-guild
  direction: outgoing
  description: 'GET /internal/channels/*/check-access (Retry + CB)'

- id: conn-messaging-guild
  name: HTTP (Polly)
  originId: app-messaging
  targetId: app-guild
  direction: outgoing
  description: Проверка прав на отправку

- id: conn-messaging-wsgw
  name: HTTP
  originId: app-messaging
  targetId: app-ws-gateway
  direction: outgoing
  description: 'Outbox → POST /internal/broadcast'

- id: conn-voice-guild
  name: HTTP (Polly)
  originId: app-voice
  targetId: app-guild
  direction: outgoing
  description: Проверка прав на голос

- id: conn-voice-livekit
  name: HTTP API
  originId: app-voice
  targetId: app-livekit
  direction: outgoing
  description: Создание/удаление комнат

- id: conn-guild-wsgw
  name: HTTP
  originId: app-guild
  targetId: app-ws-gateway
  direction: outgoing
  description: 'POST /internal/disconnect (при бане)'

- id: conn-guild-voice
  name: HTTP
  originId: app-guild
  targetId: app-voice
  direction: outgoing
  description: 'DELETE /internal/voice/{userId}/disconnect (при бане)'

# --- Services → Storage ---
- id: conn-guild-pg
  name: SQL (guild schema)
  originId: app-guild
  targetId: store-postgres
  direction: outgoing
  description: guilds, channels, members, invites, bans

- id: conn-messaging-pg
  name: SQL (messaging schema)
  originId: app-messaging
  targetId: store-postgres
  direction: outgoing
  description: messages, outbox_events, idempotency_keys

- id: conn-zitadel-pg
  name: SQL (zitadel DB)
  originId: app-zitadel
  targetId: store-postgres
  direction: outgoing
  description: Managed by Zitadel

# --- Observability ---
- id: conn-prometheus-services
  name: Scrape /metrics
  originId: app-prometheus
  targetId: app-ws-gateway
  direction: outgoing
  description: Все .NET сервисы

- id: conn-grafana-prometheus
  name: PromQL
  originId: app-grafana
  targetId: app-prometheus
  direction: outgoing
  description: Визуализация метрик
```

---

## Flows

### Flow 1: Регистрация и логин (OIDC)

```
1. Пользователь → Vue SPA: Нажимает «Войти»
2. Vue SPA: oidc-client-ts создаёт Authorization Request
   URL: /auth/oauth/v2/authorize?client_id=...&redirect_uri=...
        &response_type=code&scope=openid+profile+email&code_challenge=...
3. Browser → Nginx → Zitadel: Redirect на Zitadel Login UI
4. Пользователь: Вводит email + пароль (или регистрируется)
5. Zitadel: Валидация → создание сессии
6. Zitadel → Browser: Redirect на /callback?code=AUTH_CODE
7. Vue SPA: oidc-client-ts обменивает code на tokens
   POST /auth/oauth/v2/token (через Nginx → Zitadel)
   Body: grant_type=authorization_code, code, code_verifier (PKCE)
8. Zitadel → Vue SPA: { access_token (JWT), refresh_token, id_token }
9. Vue SPA → Pinia store: Сохранить access_token в памяти
   Декодировать JWT → sub, email, name → currentUser
10. Vue SPA: Redirect на главную страницу приложения
```

### Flow 2: Создание сервера

```
1. Пользователь → Vue SPA: «+» → ввод названия → «Создать»
2. Vue SPA → Nginx: POST /api/guilds { name } + Authorization: Bearer JWT
3. Nginx: Проверяет rate limit, добавляет X-Request-Id
4. Nginx → Guild Service: Proxy POST /api/guilds
5. Guild Service: Валидация JWT (OIDC discovery → Zitadel)
   Извлекает userId (sub), displayName (name) из claims
6. Guild Service → PostgreSQL (guild schema):
   BEGIN
     INSERT INTO guilds (id, name, owner_id)
     INSERT INTO members (guild_id, user_id, display_name, role='Owner')
     INSERT INTO channels (guild_id, name='general', type='text')
   COMMIT
7. Guild Service → Nginx: 201 Created { guild }
8. Nginx → Vue SPA: Сервер появляется в панели
```

### Flow 3: Отправка сообщения

```
1. Пользователь A → Vue SPA: Текст → «Отправить»
2. Vue SPA: idempotencyKey = crypto.randomUUID()
3. Vue SPA → Nginx → WS Gateway (SignalR):
   SendMessage(channelId, text, idempotencyKey)

4. WS Gateway → Guild Service (HTTP, Polly: Retry+CB):
   GET /internal/channels/{channelId}/check-access?userId=A
5. Guild Service → PostgreSQL: SELECT member
6. Guild Service → WS Gateway: { allowed: true, guildId }

7. WS Gateway → Messaging Service (HTTP, Polly: Retry+CB):
   POST /internal/messages
   Headers: X-Idempotency-Key, X-Correlation-Id, X-Deadline
   Body: { channelId, authorId, authorName, content }

8. Messaging Service: IdempotencyMiddleware → проверить ключ
   - Если дубль → вернуть кэшированный ответ (200)
   - Если новый → продолжить

9. Messaging Service → PostgreSQL (messaging schema):
   BEGIN
     INSERT INTO messages (id, channel_id, author_id, author_name, content, created_at)
     INSERT INTO outbox_events (event_type='message.created', payload)
     INSERT INTO idempotency_keys (key, response, expires_at)
   COMMIT

10. Messaging Service → WS Gateway: 201 Created { message }

11. WS Gateway: SignalR Groups → рассылка ReceiveMessage всем в канале

12. [Async] Outbox Worker:
    poll outbox_events → System.Threading.Channels
    → BroadcastConsumer → POST /internal/broadcast в WS Gateway
    → processed = true
```

### Flow 4: Подключение к голосовому каналу

```
1. Пользователь → Vue SPA: «Войти» в голосовом канале
2. Vue SPA → Nginx: POST /api/voice/{channelId}/join + JWT

3. Voice Service → Guild Service (HTTP, Polly):
   GET /internal/channels/{channelId}/check-access?userId=X
4. Guild Service: Проверяет членство + тип канала = voice
5. Guild Service → Voice Service: { allowed: true }

6. Voice Service: SessionStore → проверить, есть ли комната
   Если нет → LiveKit HTTP API: CreateRoom(channelId)
7. Voice Service: Генерирует LiveKit JWT:
   { room: channelId, identity: userId, canPublish: true, canSubscribe: true }
8. Voice Service → SessionStore: Добавить userId в participants
9. Voice Service → Nginx → Vue SPA: 200 { token, livekitUrl }

10. Vue SPA: const room = new Room()
    await room.connect(livekitUrl, token)
11. Vue SPA → LiveKit (WebRTC): Подключение, публикация аудио
12. LiveKit: Пересылает SRTP-пакеты другим участникам

13. Voice Service → WS Gateway (HTTP):
    POST /internal/broadcast { type: 'voice.joined', userId, channelId }
14. WS Gateway → Vue SPA (участники): Обновить список голосового канала
```

### Flow 5: Вступление по инвайту

```
1. Приглашённый → Vue SPA: Открывает /invite/{code}
2. Vue SPA: Проверяет авторизацию (есть JWT?)
   Если нет → redirect на Zitadel для логина → callback → /invite/{code}
3. Vue SPA → Nginx: POST /api/invites/{code}/accept + JWT
4. Nginx → Guild Service: Proxy
5. Guild Service: Валидация JWT → userId, displayName из claims
6. Guild Service → PostgreSQL:
   BEGIN
     SELECT invite WHERE code={code} AND expires_at > NOW() AND uses < max_uses
     INSERT INTO members (guild_id, user_id, display_name, role='Member')
     UPDATE invites SET uses = uses + 1
   COMMIT
7. Guild Service → Nginx → Vue SPA: 200 OK { guild }
8. Vue SPA: Сервер появляется в левой панели

9. Guild Service → WS Gateway (HTTP):
   POST /internal/broadcast { type: 'member.joined', userId, guildId }
10. WS Gateway → Vue SPA (онлайн-участники): Обновить список
```

### Flow 6: Кик/Бан

```
1. Admin → Vue SPA: ПКМ → «Забанить» → подтверждение
2. Vue SPA → Nginx: POST /api/guilds/{guildId}/members/{userId}/ban { reason }
3. Nginx → Guild Service: Proxy

4. Guild Service: Проверяет иерархию:
   Owner может банить Admin и Member
   Admin может банить только Member
5. Guild Service → PostgreSQL:
   BEGIN
     INSERT INTO bans (user_id, guild_id, reason, banned_by)
     DELETE FROM members WHERE user_id=X AND guild_id=Y
   COMMIT

6. Guild Service → WS Gateway (HTTP):
   POST /internal/disconnect { userId: X, guildId: Y, reason: 'banned' }
7. WS Gateway:
   a. → Клиент X: { type: 'banned', guildId, reason }
   b. Принудительно закрывает WS X для этого гильда
   c. → Остальные: { type: 'member.left', userId: X }

8. Guild Service → Voice Service (HTTP):
   DELETE /internal/voice/X/disconnect
9. Voice Service → LiveKit API: RemoveParticipant(X)
10. Voice Service → SessionStore: Удалить X из всех комнат гильда
```

### Flow 7: Heartbeat и Presence

```
1. Vue SPA: Каждые 20 сек → WS Gateway (SignalR): Heartbeat()
2. WS Gateway → PresenceTracker:
   dictionary[userId] = DateTime.UtcNow

3. Если пользователь был offline (нет в dictionary):
   a. WS Gateway → Guild Service: GET /internal/users/{userId}/guilds
   b. WS Gateway → SignalR Groups:
      { type: 'presence.online', userId } → участникам общих серверов

4. PresenceMonitor (BackgroundService, каждые 10 сек):
   Сканирует dictionary → если lastSeen > 30 сек назад:
   a. Удалить из dictionary
   b. → SignalR Groups: { type: 'presence.offline', userId }
```

### Flow 8: Демонстрация Circuit Breaker

```
Сценарий: Guild Service упал при отправке сообщения.

1. Vue SPA → WS Gateway: SendMessage(channelId, text)
2. WS Gateway → Guild Service: GET /internal/channels/{id}/check-access
   Попытка 1: Timeout 2с → Retry (backoff 200ms)
   Попытка 2: Connection refused → Retry (backoff 400ms)
   Попытка 3: Connection refused → Fail
3. Polly: ошибок > 5 за 30с → Circuit OPEN
4. WS Gateway → Vue SPA: { type: "error", message: "Сервис временно недоступен" }

5. Следующие 15 сек: любой запрос к Guild → мгновенный 503 (без сети)

6. Через 15с: Circuit HALF-OPEN
7. WS Gateway → Guild: 1 тестовый запрос
   Успех → Circuit CLOSED → нормальная работа
```

### Flow 9: Демонстрация Idempotency Key

```
1. Vue SPA: idempotencyKey = "550e8400-..."
2. Vue SPA → WS Gateway: SendMessage(channelId, text, idempotencyKey)
3. WS Gateway → Messaging: POST /internal/messages, X-Idempotency-Key: 550e8400
4. Messaging → PostgreSQL: INSERT message + outbox + idempotency_key
5. Messaging → WS Gateway: 201 Created { messageId: "abc" }
6. [Сеть обрывается до доставки ответа]
7. WS Gateway: Timeout → Polly Retry
8. WS Gateway → Messaging: POST /internal/messages, X-Idempotency-Key: 550e8400 (тот же!)
9. Messaging: SELECT FROM idempotency_keys → найден!
10. Messaging → WS Gateway: 200 OK { messageId: "abc" } (тот же, без дубля)
```
