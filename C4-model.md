
> Файл содержит описание C4-модели и JSON для импорта в [IcePanel](https://icepanel.io).

---

### Как импортировать в IcePanel

1. Зарегистрируйтесь на [app.icepanel.io](https://app.icepanel.io) (бесплатный план достаточен).
2. Создайте новую **Organization**.
3. Откройте **Overview → Import Model** (или через [API](https://developer.icepanel.io/)).
4. Импортируйте JSON или YAML из разделов[[]] ниже.
5. После импорта: **расположите** объекты на диаграмме и создайте **Flows** для пользовательских сценариев.

---

### Структура модели

#### C4 Level 1 - System Context

| Тип               | Объект          | Описание                                      |
| :---------------- | :-------------- | :-------------------------------------------- |
| Actor             | Пользователь    | Общается через браузер: текст, голос, DM      |
| Actor             | Админ платформы | Мониторинг, блокировка пользователей/серверов |
| System            | **NexTalk**     | Платформа командного общения с E2EE           |
| System (external) | Email-провайдер | SMTP - уведомления офлайн-пользователям       |

#### C4 Level 2 - Container Diagram

| Тип   | Объект       | Технология            | Описание                                             |
| :---- | :----------- | :-------------------- | :--------------------------------------------------- |
| App   | Vue.js SPA   | Vue 3, TypeScript     | UI, E2EE шифрование, WebSocket, WebRTC               |
| App   | .NET Монолит | .NET 10, ASP.NET Core | Вся бизнес-логика: Identity, Guild, Messaging, Voice |
| Store | PostgreSQL   | PostgreSQL 16         | Пользователи, серверы, зашифрованные сообщения       |
| Store | Redis        | Redis 7               | Онлайн-статусы, кэш прав, rate limiting              |
| Store | MinIO        | MinIO                 | Зашифрованные вложения, аватары                      |
| App   | LiveKit      | Go                    | SFU + встроенный TURN - пересылка голосовых потоков  |

#### C4 Level 3 - Component Diagram (.NET Монолит)

Внутренняя структура монолита:

| Тип       | Объект              | Описание                                                   |
| :-------- | :------------------ | :--------------------------------------------------------- |
| Component | Identity Module     | Регистрация, логин, JWT, профили                           |
| Component | Guild Module        | Серверы, каналы, роли (RBAC), инвайты, модерация           |
| Component | Messaging Module    | Сообщения, DM, пагинация, outbox                           |
| Component | Voice Module        | Голосовые сессии, выдача токенов LiveKit                   |
| Component | WebSocket Layer     | Управление WS-соединениями, broadcast, heartbeat, presence |
| Component | Background Services | Outbox Relay, Notification Service                         |


---

### YAML для импорта в IcePanel

> [!info]- **YAML**
> 
> ```
> # yaml-language-server: $schema=https://api.icepanel.io/v1/schemas/LandscapeImportData
> namespace: nextalk
> tagGroups:
> - id: tg-layer
>   name: Layer
>   icon: globe
> - id: tg-tech
>   name: Technology
>   icon: microchip
> tags:
> - id: tag-frontend
>   groupId: tg-layer
>   name: Frontend
>   color: green
> - id: tag-backend
>   groupId: tg-layer
>   name: Backend
>   color: blue
> - id: tag-storage
>   groupId: tg-layer
>   name: Storage
>   color: orange
> - id: tag-media
>   groupId: tg-layer
>   name: Media
>   color: purple
> - id: tag-external
>   groupId: tg-layer
>   name: External
>   color: grey
> - id: tag-dotnet
>   groupId: tg-tech
>   name: .NET 10
>   color: blue
> - id: tag-vue
>   groupId: tg-tech
>   name: Vue.js 3
>   color: green
> - id: tag-go
>   groupId: tg-tech
>   name: Go
>   color: blue
> - id: tag-postgres
>   groupId: tg-tech
>   name: PostgreSQL
>   color: orange
> - id: tag-redis
>   groupId: tg-tech
>   name: Redis
>   color: red
> modelObjects:
> - id: domain-nextalk
>   name: NexTalk
>   type: domain
>   description: Платформа командного общения с end-to-end шифрованием
> - id: actor-user
>   name: Пользователь
>   type: actor
>   parentId: domain-nextalk
>   description: 'Общается через браузер: текст, голос, DM.'
>   caption: Браузер
> - id: actor-admin
>   name: Админ платформы
>   type: actor
>   parentId: domain-nextalk
>   description: Мониторинг работоспособности, блокировка пользователей и серверов.
>   caption: Технический специалист
> - id: system-nextalk
>   name: NexTalk Platform
>   type: system
>   parentId: domain-nextalk
>   description: Платформа для командного общения (текст, голос, DM). Сервер не имеет доступа к содержимому сообщений.
>   caption: Модульный монолит + SPA
>   tagIds:
>   - tag-backend
> - id: system-email
>   name: Email-провайдер
>   type: system
>   parentId: domain-nextalk
>   external: true
>   description: Внешний SMTP-сервис для отправки email-уведомлений офлайн-пользователям. Только метаданные.
>   caption: SMTP
>   tagIds:
>   - tag-external
> - id: app-spa
>   name: Vue.js SPA
>   type: app
>   parentId: system-nextalk
>   description: Клиентское приложение в браузере. UI, WebSocket-клиент (SignalR), LiveKit-клиент.
>   caption: Vue 3 + TypeScript
>   tagIds:
>   - tag-frontend
>   - tag-vue
> - id: app-monolith
>   name: .NET Монолит
>   type: app
>   parentId: system-nextalk
>   description: 'Единый .NET 10 процесс со всеми бизнес-модулями: Identity, Guild, Messaging, Voice. Включает WebSocket-слой и фоновые сервисы.'
>   caption: .NET 10 Modular Monolith
>   tagIds:
>   - tag-backend
>   - tag-dotnet
> - id: store-postgres
>   name: PostgreSQL
>   type: store
>   parentId: system-nextalk
>   description: 'Основное хранилище. 3 схемы: identity, guild, messaging.'
>   caption: PostgreSQL 16
>   tagIds:
>   - tag-storage
>   - tag-postgres
> - id: store-redis
>   name: Redis
>   type: store
>   parentId: system-nextalk
>   description: In-memory хранилище. Онлайн-статусы, кэш RBAC-прав, голосовые сессии, rate limiting.
>   caption: Redis 7
>   tagIds:
>   - tag-storage
>   - tag-redis
> - id: store-minio
>   name: MinIO
>   type: store
>   parentId: system-nextalk
>   description: S3-совместимое объектное хранилище. Аватары.
>   caption: S3-compatible
>   tagIds:
>   - tag-storage
> - id: app-livekit
>   name: LiveKit
>   type: app
>   parentId: system-nextalk
>   description: SFU-медиасервер на Go со встроенным TURN. Пересылает зашифрованные голосовые потоки.
>   caption: Go — SFU + TURN
>   tagIds:
>   - tag-media
>   - tag-go
> - id: comp-identity
>   name: Identity Module
>   type: component
>   parentId: app-monolith
>   description: 'Регистрация, логин, JWT-токены, профили пользователей. Схема БД: identity.'
>   caption: Аутентификация
> - id: comp-guild
>   name: Guild Module
>   type: component
>   parentId: app-monolith
>   description: 'Серверы, каналы, роли (RBAC bitmask), инвайт-ссылки, модерация. Схема БД: guild.'
>   caption: Серверы, каналы, права
> - id: comp-messaging
>   name: Messaging Module
>   type: component
>   parentId: app-monolith
>   description: 'Приём и хранение сообщений, DM, cursor-based пагинация, outbox. Схема БД: messaging.'
>   caption: Сообщения и DM
> - id: comp-voice
>   name: Voice Module
>   type: component
>   parentId: app-monolith
>   description: 'Голосовые сессии: join/leave, выдача токенов LiveKit.'
>   caption: Голос
> - id: comp-websocket
>   name: WebSocket Layer
>   type: component
>   parentId: app-monolith
>   description: 'Управляет WebSocket-соединениями (SignalR): авторизация, broadcast, heartbeat, presence.'
>   caption: Real-time доставка
> - id: comp-background
>   name: Background Services
>   type: component
>   parentId: app-monolith
>   description: 'Outbox Relay: читает outbox_messages. Notification Service: отправляет email.'
>   caption: Outbox + Notifications
> modelConnections:
> - id: conn-user-spa
>   name: Использует
>   originId: actor-user
>   targetId: app-spa
>   direction: outgoing
>   description: Пользователь открывает SPA в браузере
> - id: conn-admin-monolith
>   name: Управляет
>   originId: actor-admin
>   targetId: app-monolith
>   direction: outgoing
>   description: Мониторинг, блокировка через HTTPS
> - id: conn-spa-monolith-rest
>   name: REST API
>   originId: app-spa
>   targetId: app-monolith
>   direction: outgoing
>   description: CRUD операции
> - id: conn-spa-monolith-ws
>   name: WebSocket
>   originId: app-spa
>   targetId: app-monolith
>   direction: bidirectional
>   description: 'Real-time: сообщения, статусы, signaling, heartbeat'
> - id: conn-spa-livekit
>   name: WebRTC
>   originId: app-spa
>   targetId: app-livekit
>   direction: bidirectional
>   description: Зашифрованные голосовые потоки + signaling
> - id: conn-monolith-postgres
>   name: SQL
>   originId: app-monolith
>   targetId: store-postgres
>   direction: outgoing
>   description: Чтение/запись данных
> - id: conn-monolith-redis
>   name: TCP
>   originId: app-monolith
>   targetId: store-redis
>   direction: outgoing
>   description: Кэш, статусы, rate limiting
> - id: conn-monolith-minio
>   name: S3 API
>   originId: app-monolith
>   targetId: store-minio
>   direction: outgoing
>   description: Загрузка/скачивание аватаров
> - id: conn-monolith-livekit
>   name: HTTP API
>   originId: app-monolith
>   targetId: app-livekit
>   direction: outgoing
>   description: Создание комнат, выдача токенов
> - id: conn-monolith-email
>   name: SMTP
>   originId: app-monolith
>   targetId: system-email
>   direction: outgoing
>   description: Отправка email-уведомлений
> - id: conn-ws-identity
>   name: JWT валидация
>   originId: comp-websocket
>   targetId: comp-identity
>   direction: outgoing
>   description: Проверка токена при подключении
> - id: conn-ws-messaging
>   name: Доставка сообщений
>   originId: comp-websocket
>   targetId: comp-messaging
>   direction: bidirectional
>   description: Получение и рассылка сообщений
> - id: conn-ws-voice
>   name: Signaling
>   originId: comp-websocket
>   targetId: comp-voice
>   direction: bidirectional
>   description: Передача голосовых событий
> - id: conn-ws-guild
>   name: Presence
>   originId: comp-websocket
>   targetId: comp-guild
>   direction: outgoing
>   description: Уведомления о подключении/отключении
> - id: conn-guild-identity
>   name: Профили
>   originId: comp-guild
>   targetId: comp-identity
>   direction: outgoing
>   description: Получение данных о пользователях
> - id: conn-messaging-identity
>   name: Публичные ключи
>   originId: comp-messaging
>   targetId: comp-identity
>   direction: outgoing
>   description: Получение ключей для E2EE (будущее)
> - id: conn-messaging-guild
>   name: Проверка прав
>   originId: comp-messaging
>   targetId: comp-guild
>   direction: outgoing
>   description: Проверка прав на отправку сообщений
> - id: conn-voice-identity
>   name: Валидация
>   originId: comp-voice
>   targetId: comp-identity
>   direction: outgoing
>   description: Проверка существования пользователя
> - id: conn-voice-guild
>   name: Проверка прав
>   originId: comp-voice
>   targetId: comp-guild
>   direction: outgoing
>   description: Проверка прав на подключение к голосу
> - id: conn-voice-livekit
>   name: Room management
>   originId: comp-voice
>   targetId: app-livekit
>   direction: outgoing
>   description: Создание/удаление комнат
> - id: conn-bg-messaging
>   name: Outbox
>   originId: comp-background
>   targetId: comp-messaging
>   direction: outgoing
>   description: Чтение таблицы outbox_messages
> - id: conn-bg-identity
>   name: Email получателя
>   originId: comp-background
>   targetId: comp-identity
>   direction: outgoing
>   description: Получение email для уведомлений
> 
> ```

---

### Flows

#### Flow 1: Регистрация и генерация ключей

```
1. Пользователь → Vue.js SPA: Открывает приложение
2. Vue.js SPA → .NET Монолит (REST): POST /api/auth/register
3. .NET Монолит → Identity Module: Создать аккаунт, хешировать пароль
4. Identity Module → PostgreSQL: INSERT в identity.users
5. Identity Module → .NET Монолит: 201 Created, user_id
6. .NET Монолит → Vue.js SPA: Ответ с user_id
7. Пользователь → Vue.js SPA: Ввод email и пароля
8. Vue.js SPA → .NET Монолит (REST): POST /api/auth/login
9. .NET Монолит → Identity Module: Проверить пароль
10. Identity Module → PostgreSQL: SELECT user
11. Identity Module → .NET Монолит: OK + claims
12. .NET Монолит: Генерация JWT access_token + refresh_token
13. .NET Монолит → Vue.js SPA: access_token, refresh_token (httpOnly cookie)
14. Vue.js SPA: Сохранить токен в памяти, перейти в приложение
```

#### Flow 2: Создание сервера и каналов

```
1. Пользователь → Vue.js SPA: Нажатие «+» в левой панели
2. Vue.js SPA: Модальное окно с формой (название сервера)
3. Пользователь → Vue.js SPA: Ввод названия, нажатие «Создать»
4. Vue.js SPA → .NET Монолит (REST): POST /api/guilds { name }
5. .NET Монолит → Guild Module: Создать сервер
6. Guild Module → Identity Module: Проверить существование пользователя
7. Guild Module → PostgreSQL: INSERT в guild.servers, INSERT owner в guild.members
8. Guild Module → .NET Монолит: server_id
9. .NET Монолит → Vue.js SPA: 201 Created, server
10. Vue.js SPA: Сервер появляется в левой панели
11. Пользователь → Vue.js SPA: Нажатие «Создать канал» в панели каналов
12. Vue.js SPA: Модальное окно (название, тип: текст/голос)
13. Пользователь → Vue.js SPA: Ввод данных, нажатие «Создать»
14. Vue.js SPA → .NET Монолит (REST): POST /api/guilds/{id}/channels
15. .NET Монолит → Guild Module: Создать канал
16. Guild Module → PostgreSQL: INSERT в guild.channels
17. Guild Module → .NET Монолит: channel_id
18. .NET Монолит → Vue.js SPA: 201 Created, channel
19. Vue.js SPA: Канал появляется в панели каналов
```

#### Flow 3: Отправка сообщения в канал

```
1. Пользователь A → Vue.js SPA: Ввод текста, нажатие «Отправить»
2. Vue.js SPA → .NET Монолит (WebSocket/SignalR): SendMessage(channelId, text)
3. WebSocket Layer → Identity Module: Валидация JWT (при handshake)
4. WebSocket Layer → Messaging Module: Принять сообщение
5. Messaging Module → Guild Module: Проверить право SEND_MESSAGES
6. Guild Module → Redis: Проверить кэш прав (если есть)
7. Guild Module → PostgreSQL (если промах кэша): SELECT permissions
8. Guild Module → Redis: Сохранить в кэш (TTL 5 мин)
9. Guild Module → Messaging Module: Доступ разрешён
10. Messaging Module → PostgreSQL: BEGIN TRANSACTION
    - INSERT INTO messaging.messages (id, channel_id, author_id, content, created_at)
    - INSERT INTO messaging.outbox_messages (event_type, payload)
    - COMMIT
11. Messaging Module → WebSocket Layer: Broadcast всем онлайн-участникам канала
12. WebSocket Layer: Найти все connection_id для участников канала (через SignalR Groups)
13. WebSocket Layer → Vue.js SPA (получатели B, C): ReceiveMessage(message)
14. Vue.js SPA (получатель): Отобразить сообщение в чате
15. Background Services (Outbox Relay): Читает outbox_messages (polling каждые 5 сек)
16. Background Services → Internal Queue (Channel): Публикует событие
17. Background Services (Notification Worker): Читает из очереди
18. Notification Worker → Identity Module: Получить email и настройки офлайн-получателей
19. Identity Module → PostgreSQL: SELECT email, notify_settings
20. Identity Module → Notification Worker: Список email
21. Notification Worker → Email-провайдер (SMTP): Отправить email (только метаданные)
22. Email-провайдер → Пользователь (офлайн): Email «Новое сообщение в #general от UserA»
```

#### Flow 4: Инвайт и вступление на сервер

```
1. Администратор → Vue.js SPA: Открыть настройки сервера → «Инвайты»
2. Vue.js SPA → .NET Монолит (REST): POST /api/guilds/{id}/invites { maxUses, ttl }
3. .NET Монолит → Guild Module: Создать инвайт
4. Guild Module → PostgreSQL: INSERT INTO guild.invites (code, guild_id, max_uses, expires_at)
5. Guild Module → .NET Монолит: invite_code
6. .NET Монолит → Vue.js SPA: { code, url: "https://nextalk.app/invite/abc123" }
7. Vue.js SPA: Показать ссылку, кнопка «Копировать»
8. Администратор → Приглашённый: Отправляет ссылку (вне системы)
9. Приглашённый → Vue.js SPA: Открывает ссылку /invite/abc123
10. Vue.js SPA → .NET Монолит (REST): POST /api/invites/{code}/accept
11. .NET Монолит → Guild Module: Принять инвайт
12. Guild Module → Identity Module: Проверить существование пользователя
13. Guild Module → PostgreSQL: BEGIN TRANSACTION
    - SELECT invite (проверить TTL, max_uses)
    - INSERT INTO guild.members (user_id, guild_id, default_role)
    - UPDATE invite (uses_count++)
    - COMMIT
14. Guild Module → Redis: Инвалидировать кэш серверов пользователя
15. Guild Module → .NET Монолит: guild_id, default_role
16. .NET Монолит → Vue.js SPA: 200 OK, guild info
17. Vue.js SPA: Сервер появляется в левой панели
18. WebSocket Layer → Участники сервера: { type: "member.joined", userId }
19. Vue.js SPA (участники онлайн): Обновить список участников
```

#### Flow 5: Подключение к голосовому каналу

```
1. Пользователь → Vue.js SPA: Нажатие «Войти» в голосовом канале
2. Vue.js SPA → .NET Монолит (WebSocket/SignalR): JoinVoiceChannel(channelId)
3. WebSocket Layer → Identity Module: Валидация JWT
4. WebSocket Layer → Voice Module: Запрос на подключение
5. Voice Module → Guild Module: Проверить право CONNECT_VOICE
6. Guild Module → Redis: Проверить кэш прав
7. Guild Module → PostgreSQL (при промахе): SELECT permissions
8. Guild Module → Voice Module: Доступ разрешён
9. Voice Module → Redis: Проверить, существует ли комната для канала
   - Если нет: Voice Module → LiveKit (HTTP API): POST /room { name: channelId }
   - LiveKit → Voice Module: room_id, ws_url
   - Voice Module → Redis: SET voice:room:{channelId} {room_id} (TTL 1 час)
10. Voice Module: Генерация JWT-токена LiveKit с claims:
    - room: channelId
    - identity: userId
    - name: username
    - permissions: canPublish, canSubscribe
11. Voice Module → WebSocket Layer: { type: "voice.token", room: channelId, token, url: "wss://livekit:7880" }
12. WebSocket Layer → Vue.js SPA: Токен и URL
13. Vue.js SPA: Инициализация LiveKit Client SDK
    - const room = new Room()
    - await room.connect(url, token)
14. Vue.js SPA → LiveKit (WebSocket): Подключение, аутентификация
15. LiveKit → Vue.js SPA: Connected, participant info
16. Vue.js SPA: Запрос доступа к микрофону (getUserMedia)
17. Vue.js SPA → LiveKit (WebRTC): Публикация аудио-трека
18. LiveKit: Пересылка зашифрованных SRTP-пакетов всем участникам комнаты
19. Voice Module → Redis: SADD voice:participants:{channelId} userId
20. Voice Module → Redis: SET voice:session:{userId} {channelId} (TTL 60 сек)
21. WebSocket Layer → Участники канала (через SignalR Group): { type: "voice.participant_joined", userId, channelId }
22. Vue.js SPA (другие участники): Отобразить вошедшего в списке голосового канала
23. Vue.js SPA (вошедший): Отобразить индикатор «Вы в голосовом канале», кнопки mute/deafen
```

#### Flow 6: Отключение от голосового канала

```
1. Пользователь → Vue.js SPA: Нажатие «Выйти» из голосового канала
2. Vue.js SPA → LiveKit: room.disconnect()
3. LiveKit: Закрыть WebRTC и WebSocket соединение
4. Vue.js SPA → .NET Монолит (WebSocket): LeaveVoiceChannel(channelId)
5. WebSocket Layer → Voice Module: Запрос на отключение
6. Voice Module → Redis: SREM voice:participants:{channelId} userId
7. Voice Module → Redis: DEL voice:session:{userId}
8. Voice Module → Redis: SCARD voice:participants:{channelId}
   - Если 0: Voice Module → LiveKit (HTTP API): DELETE /room/{channelId}
   - LiveKit: Удалить комнату
9. WebSocket Layer → Участники канала: { type: "voice.participant_left", userId, channelId }
10. Vue.js SPA (другие участники): Убрать пользователя из списка голосового канала
11. Vue.js SPA (вышедший): Скрыть индикатор голосового канала
```

#### Flow 7: Кик/бан участника

```
1. Администратор → Vue.js SPA: Правая панель участников → ПКМ на участнике X → «Забанить»
2. Vue.js SPA: Модальное окно подтверждения с полем «Причина»
3. Администратор → Vue.js SPA: Ввод причины, нажатие «Забанить»
4. Vue.js SPA → .NET Монолит (REST): POST /api/guilds/{guildId}/bans { userId, reason }
5. .NET Монолит → Guild Module: Запрос на бан
6. Guild Module → Identity Module: Проверить существование пользователя X
7. Guild Module → Identity Module: Проверить иерархию ролей (нельзя банить выше standing)
8. Guild Module → PostgreSQL: BEGIN TRANSACTION
    - INSERT INTO guild.bans (user_id, guild_id, reason, banned_by, banned_at)
    - DELETE FROM guild.members WHERE user_id = X AND guild_id = guildId
    - COMMIT
9. Guild Module → Redis: Инвалидировать кэш прав для X (DEL perm:{userId}:*)
10. Guild Module → Redis: Удалить сервер из списка серверов X
11. Guild Module → WebSocket Layer: Событие UserBanned(userId, guildId)
12. WebSocket Layer: Найти все connection_id для пользователя X
13. WebSocket Layer → Voice Module: ForceDisconnect(userId, guildId)
14. Voice Module → Redis: Получить голосовые каналы пользователя в этом сервере
15. Для каждого канала:
    - Voice Module → LiveKit (HTTP API): POST /room/{channelId}/remove { userId }
    - LiveKit: Принудительно отключить участника
    - Voice Module → Redis: SREM voice:participants:{channelId} userId
16. WebSocket Layer → X (каждое соединение): Принудительный разрыв WebSocket (close frame с причиной)
17. WebSocket Layer → Участники сервера (через SignalR Group): { type: "member.banned", userId: X, guildId }
18. Vue.js SPA (участники онлайн):
    - Убрать X из списка участников
    - Если X был в голосовом канале — убрать из списка
19. Background Services (Audit Worker): Читает событие из очереди
20. Audit Worker → PostgreSQL: INSERT INTO audit.log (action, actor, target, metadata)
21. Vue.js SPA (X): WebSocket закрыт, показать сообщение «Вы забанены на сервере X»
```

#### Flow 8: Личные сообщения (DM) (НЕ входит в текущую реализацию)

```
1. Пользователь A → Vue.js SPA: Открыть раздел «Личные сообщения», нажать «Написать»
2. Vue.js SPA: Модальное окно поиска пользователей
3. Пользователь A → Vue.js SPA: Ввод имени, выбор пользователя B, нажатие «Начать чат»
4. Vue.js SPA → .NET Монолит (REST): POST /api/dm/with/{userId}
5. .NET Монолит → Messaging Module: Создать/получить DM-канал
6. Messaging Module → Identity Module: Проверить существование пользователя B
7. Messaging Module → PostgreSQL: SELECT или INSERT dm_channel (user_a, user_b)
8. Messaging Module → .NET Монолит: channel_id
9. .NET Монолит → Vue.js SPA: 200 OK, channel_id
10. Vue.js SPA: Открыть DM-чат с пользователем B
11. Vue.js SPA → .NET Монолит (REST): GET /api/dm/{channelId}/messages?limit=50
12. .NET Монолит → Messaging Module: Получить историю
13. Messaging Module → PostgreSQL: SELECT messages FROM dm_messages WHERE channel_id = ...
14. Messaging Module → .NET Монолит: messages[]
15. .NET Монолит → Vue.js SPA: История сообщений
16. Vue.js SPA: Отобразить историю
17. Пользователь A → Vue.js SPA: Ввод текста, нажатие «Отправить»
18. Vue.js SPA → .NET Монолит (WebSocket): SendDMMessage(channelId, text)
19. WebSocket Layer → Messaging Module: Обработать DM
20. Messaging Module → PostgreSQL: INSERT INTO dm_messages + outbox
21. Messaging Module → WebSocket Layer: Доставить B (если онлайн)
22. WebSocket Layer → Vue.js SPA (пользователь B): ReceiveDMMessage(message)
23. Vue.js SPA (B): Отобразить сообщение, показать уведомление
24. Background Services: Отправить email B, если офлайн (через Identity за email)
```

#### Flow 9: Heartbeat и обновление Presence

```
1. Vue.js SPA: Каждые 20 секунд → WebSocket: SendHeartbeat()
2. WebSocket Layer → Identity Module: Валидация JWT (активность сессии)
3. WebSocket Layer → Redis: SET presence:{userId} "online" EX 30
4. WebSocket Layer: Проверить предыдущий статус (in-memory cache)
   - Если был "offline" или это первый heartbeat:
     a. WebSocket Layer → Guild Module: GetUserGuilds(userId)
     b. Guild Module → PostgreSQL: SELECT guild_id FROM guild.members WHERE user_id = userId
     c. Guild Module → WebSocket Layer: guildIds[]
     d. WebSocket Layer → Участники общих серверов (через SignalR Groups): { type: "presence.online", userId }
5. Vue.js SPA (получатели): Обновить индикатор пользователя (зелёный кружок)
6. Background Service (Presence Monitor): Каждые 10 секунд сканирует Redis
    - SCAN presence:* → проверить TTL
    - Если ключ истёк (нет heartbeat > 30 сек):
      a. WebSocket Layer → Участники общих серверов: { type: "presence.offline", userId }
      b. Redis: DEL presence:{userId}
7. Vue.js SPA (получатели): Обновить индикатор пользователя (серый кружок)
```


#### Flow 10: Отправка email-уведомлений (оффлайн) (НЕ входит в текущую реализацию)

```
1. Пользователь A отправляет сообщение в канал (см. Flow 3)
2. Messaging Module → PostgreSQL: INSERT в outbox_messages
3. Background Services (Outbox Relay): Polling каждые 5 сек
    - SELECT * FROM outbox_messages WHERE processed = false
4. Outbox Relay → Internal Queue (System.Threading.Channels): Публикует событие
5. Background Services (Notification Worker): Читает из очереди
6. Notification Worker: Десериализовать событие { type: "message.sent", channelId, senderId, messageId }
7. Notification Worker → Messaging Module: GetChannelMembers(channelId)
8. Messaging Module → PostgreSQL: SELECT user_id FROM guild.members WHERE channel_id = ...
9. Messaging Module → Notification Worker: allMemberIds[]
10. Notification Worker → WebSocket Layer: GetOnlineUserIds()
11. WebSocket Layer → Redis: SMEMBERS presence:online (или SCAN presence:*)
12. WebSocket Layer → Notification Worker: onlineUserIds[]
13. Notification Worker: offlineUserIds = allMemberIds \ onlineUserIds
14. Для каждого offlineUserId:
    a. Notification Worker → Identity Module: GetUserEmailAndSettings(userId)
    b. Identity Module → PostgreSQL: SELECT email, notify_settings FROM identity.users
    c. Identity Module → Notification Worker: email, settings
    d. Если settings.email_enabled:
       - Notification Worker → Guild Module: GetChannelInfo(channelId)
       - Guild Module → PostgreSQL: SELECT channel_name, guild_name
       - Guild Module → Notification Worker: channel_name, guild_name
       - Notification Worker → Identity Module: GetUserInfo(senderId)
       - Identity Module → PostgreSQL: SELECT username
       - Identity Module → Notification Worker: sender_name
       - Notification Worker → Email-провайдер (SMTP): Отправить email
         Тема: «Новое сообщение в #general на сервере MyServer»
         Тело: «UserA отправил сообщение: ...» (без текста, только метаданные)
15. Email-провайдер → Офлайн-пользователь: Email доставлен
16. Notification Worker → PostgreSQL: UPDATE outbox_messages SET processed = true, processed_at = NOW()
```

---
