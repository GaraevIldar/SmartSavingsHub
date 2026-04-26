```markdown
# NexTalk - План задач

> **Б1** (Backend/DevOps), **Б2** (Backend/QA), **Ф1** (Frontend), **Ф2** (Frontend).

---

## Содержание

1. [Обзор](#обзор)
2. [Стадия 1 - Монолит (Неделя 1–2)](#стадия-1--монолит-неделя-12)
3. [Стадия 2 - Микросервисы (Неделя 3)](#стадия-2--микросервисы-неделя-3)
4. [Стадия 3 - Kubernetes (Неделя 4)](#стадия-3--kubernetes-неделя-4)
5. [Граф зависимостей](#граф-зависимостей)
6. [Критический путь](#критический-путь)
7. [Тест-кейсы](#тест-кейсы)
8. [Что вернуть при опережении](#что-вернуть-при-опережении)
9. [Чего НЕ делать](#чего-не-делать)
10. [Бюджет часов](#бюджет-часов)

---

## Обзор

```
Неделя 1–2           Неделя 3                Неделя 4
┌──────────────┐   ┌────────────────────┐   ┌─────────────────────┐
│  Модульный   │   │   Микросервисы     │   │    Kubernetes       │
│  монолит     │──→│   docker-compose   │──→│    + Prometheus     │
│  + Zitadel   │   │   + Resilience     │   │    + Grafana        │
│  + Nginx     │   │   + Outbox         │   │    + Стабилизация   │
│  + LiveKit   │   │   + Health Checks  │   │    + Демо           │
└──────────────┘   └────────────────────┘   └─────────────────────┘
```

**Допуск:** 28 апреля.
**Демо:** ~13 мая.

---

## Стадия 1 - Монолит (Неделя 1–2)

### Неделя 1: Фундамент

#### Б1 - Backend / DevOps (~22 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б1-01 | Создать .NET 9 Solution: `NexTalk.sln`, проекты: `NexTalk.Api`, `NexTalk.Guild`, `NexTalk.Messaging`, `NexTalk.Voice`, `NexTalk.WebSocket`, `NexTalk.Shared` | 2 | Solution собирается, `dotnet build` ok | - |
| Б1-02 | docker-compose: Nginx (alpine) + .NET монолит + PostgreSQL 17 + Zitadel + LiveKit | 4 | `docker compose up` - все 5 контейнеров запускаются | Б1-01 |
| Б1-03 | Nginx.conf: proxy_pass к монолиту, WebSocket upgrade, rate_limit 100/IP, $request_id | 2 | Запросы от SPA через Nginx → монолит | Б1-02 |
| Б1-04 | Serilog JSON + Correlation ID middleware (X-Request-Id из Nginx) | 2 | Логи в stdout в JSON, request_id во всех строках | Б1-01 |
| Б1-05 | PostgreSQL: EF Core DbContext, схемы `guild` и `messaging`, первая миграция | 3 | `dotnet ef database update` создает таблицы | Б1-02 |
| Б1-06 | Guild Module: REST CRUD серверов и каналов (POST/GET), RbacService (Owner/Admin/Member) | 5 | API: POST /api/guilds, GET /api/guilds, POST /api/guilds/{id}/channels | Б1-05 |
| Б1-07 | Messaging Module: POST /internal/messages, GET /api/channels/{id}/messages (cursor pagination) | 4 | Сообщения сохраняются и читаются из БД | Б1-05 |

#### Б2 - Backend / QA (~22 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б2-01 | Настроить Zitadel: создать проект NexTalk, Application (SPA, PKCE), redirect URIs | 3 | Zitadel Console → Application → Client ID готов | Б1-02 |
| Б2-02 | JWT-валидация middleware в .NET: OIDC Discovery от Zitadel, извлечение sub/email/name/preferred_username | 3 | Запрос без валидного JWT → 401 Unauthorized | Б2-01 |
| Б2-03 | WebSocket Module: SignalR Hub `/ws/chat` - SendMessage, ReceiveMessage | 4 | Два клиента отправляют/получают сообщения через WS | Б1-01, Б2-02 |
| Б2-04 | WebSocket Module: Heartbeat, PresenceTracker (ConcurrentDictionary) | 3 | Клиент отправляет heartbeat → presence обновляется | Б2-03 |
| Б2-05 | Интерфейсы: `IGuildAccessClient`, `IMessagingClient`. In-process реализации | 3 | WS → IGuildAccessClient.CheckAccess() → Guild Module | Б1-06, Б2-03 |
| Б2-06 | Guild Module: инвайты (POST /api/guilds/{id}/invites, POST /api/invites/{code}/accept) | 4 | Генерация инвайта с TTL, вступление по ссылке | Б1-06 |
| Б2-Z | Брендинг Zitadel: логотип NexTalk, цвета, заголовок «Добро пожаловать в NexTalk» | 2 | Форма входа имеет логотип и цвета NexTalk, footer без упоминаний Zitadel | Б2-01 |

#### Ф1 - Frontend 1 (~18 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф1-01 | Создать Vue 3 + TypeScript + Vite проект: Pinia, Vue Router, axios | 2 | `npm run dev` - пустой проект запускается | - |
| Ф1-02 | OIDC-интеграция: oidc-client-ts, UserManager конфиг (client_id, redirect_uri, Zitadel) | 4 | Кнопка «Войти» → redirect на Zitadel → callback → JWT в Pinia | Б2-01 |
| Ф1-03 | axios interceptor: Authorization header, refresh token, 401 → redirect | 2 | Все запросы с Bearer token, auto-refresh | Ф1-02 |
| Ф1-04 | Layout: CSS Grid - серверы (лево), каналы, чат, участники (право) | 5 | 4-колоночный layout, placeholder контент | Ф1-01 |
| Ф1-05 | Страница серверов: GuildList (иконки), GuildCreate (форма), роутинг /guilds/:id | 5 | Создание сервера через UI, переход между серверами | Ф1-03, Ф1-04 |

#### Ф2 - Frontend 2 (~18 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф2-01 | SignalR клиент: @microsoft/signalr, HubConnection, автоматический reconnect | 4 | WS-соединение с WS Gateway, авто-реконнект | Б2-03, Ф1-02 |
| Ф2-02 | Pinia store для чата: messages[], sendMessage(), loadHistory() | 3 | Отправка и получение сообщений в Pinia | Ф2-01, Ф1-03 |
| Ф2-03 | ChatView: MessageList (scroll-to-bottom), MessageInput, cursor-подгрузка вверх | 5 | Чат работает: набрал → отправил → все видят | Ф2-02 |
| Ф2-04 | ChannelList: отображение текстовых и голосовых каналов, создание канала (Admin/Owner) | 3 | Список каналов, кнопка создания | Ф1-05 |
| Ф2-05 | MemberList: список участников с ролями и статусами (online/offline) | 3 | Правая панель - иконки, имена, роли, зеленые/серые точки | Ф2-04, Б2-04 |

---

### Неделя 2: Голос + Модерация + Приглашения

#### Б1 - Backend / DevOps (~22 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б1-08 | Voice Module: POST /api/voice/{channelId}/join → LiveKit JWT, POST leave | 5 | Запрос join → LiveKit token в ответе | Б1-02, Б2-02 |
| Б1-09 | Voice Module: LiveKitRoomClient (HTTP API), SessionStore (ConcurrentDictionary) | 4 | Комнаты создаются/удаляются в LiveKit, сессии in-memory | Б1-08 |
| Б1-10 | Guild Module: кик/бан (POST kick, POST ban), иерархия ролей (Owner > Admin > Member) | 4 | Бан: удаление из members, запись в bans | Б1-06, Б2-02 |
| Б1-11 | Guild Module → WS Module: уведомление о бане (in-process disconnect) | 3 | При бане → WS отключает пользователя | Б1-10, Б2-03 |
| Б1-12 | Guild Module → Voice Module: отключение из голоса при бане (in-process) | 2 | При бане → Voice удаляет из LiveKit | Б1-10, Б1-09 |
| Б1-13 | GET /api/guilds/{id}/members: список с ролями, онлайн-статусом | 2 | Список участников с presence | Б1-06, Б2-04 |
| Б1-14 | DELETE /api/messages/{id}: удаление сообщений (автор/Admin/Owner) | 2 | Сообщение удаляется, проверка прав | Б1-07, Б2-02 |

#### Б2 - Backend / QA (~24 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б2-07 | Guild Module: PUT /api/guilds/{id}/members/{uid}/role - назначение ролей (только Owner) | 3 | Owner может сделать Member → Admin | Б1-06 |
| Б2-08 | Voice Module: принудительное отключение DELETE /internal/voice/{userId}/disconnect | 2 | При бане Voice удаляет из LiveKit + SessionStore | Б1-09 |
| Б2-10 | WebSocket Module: POST /internal/disconnect/{userId} - принудительное отключение WS | 2 | При бане WS Gateway закрывает соединение | Б2-03 |
| Б2-11 | End-to-end ручное тестирование: регистрация → создание сервера → инвайт → сообщения → голос | 5 | Весь happy path работает в монолите | Все W1-W2 задачи |
| Б2-12 | Написать тест-кейсы: TC-01..TC-20 (чеклист для демо) | 4 | Документ с тест-кейсами, все проверены на монолите | Б2-11 |
| Б2-У1 | Юнит-тесты: RbacService (все роли), логика TTL/max_uses инвайтов, PresenceTracker (TTL-логика). xUnit + Moq. | 4 | `dotnet test` зелёный, coverage ≥80% на доменной логике | Б1-06, Б1-07, Б2-04 |
| Б2-У2 | Юнит-тесты: Voice (генерация токена — claims room/identity/canPublish). xUnit + Moq. | 4 | `dotnet test` зелёный, 100% покрытие Voice-токен-логики | Б1-08, Б1-09 |

#### Ф1 - Frontend 1 (~18 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф1-06 | InviteView: /invite/{code} - принятие инвайта, redirect если не авторизован | 4 | Переход по ссылке → авторизация → вступление | Б2-06, Ф1-02 |
| Ф1-07 | InviteCreateModal: генерация ссылки, копирование, отображение TTL и лимита | 3 | Кнопка «Пригласить» → модалка → скопировал ссылку | Б2-06, Ф1-05 |
| Ф1-08 | Модерация UI: контекстное меню на участнике → Кик / Бан / Назначить роль | 5 | ПКМ → меню → действие (с подтверждением) | Б1-10, Ф2-05 |
| Ф1-09 | Обработка событий модерации: banned → показать причину, кик → redirect | 3 | При бане: сообщение «Вы забанены: {причина}», выход с сервера | Б1-11, Ф2-01 |
| Ф1-10 | Delete message UI: кнопка удаления (автор/Admin/Owner), подтверждение | 3 | Удалить сообщение, проверка прав на фронте | Б1-14, Ф2-03 |

#### Ф2 - Frontend 2 (~18 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф2-06 | VoiceChannel UI: кнопка «Войти/Выйти», список участников в голосе | 4 | Кнопка join/leave, отображение кто в канале | Б1-08, Ф2-04 |
| Ф2-07 | livekit-client: Room, connect(), audioTrack publish/subscribe | 5 | Голос работает между двумя вкладками | Б1-08, Ф2-06 |
| Ф2-08 | Mute/Unmute: кнопка микрофона, voice activity indicator | 3 | Индикатор «говорит», кнопка mute | Ф2-07 |
| Ф2-09 | Presence UI: online/offline обновление в реальном времени | 3 | Зеленые/серые точки обновляются по heartbeat | Б2-04, Ф2-05 |
| Ф2-10 | Banner «Соединение потеряно»: отображение при обрыве WS, кнопка обновить | 3 | При потере WS → желтый баннер сверху | Ф2-01 |

---

## Стадия 2 - Микросервисы (Неделя 3)

### Неделя 3: Разрезаем монолит

#### Б1 - Backend / DevOps (~24 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б1-15 | Dockerfile для каждого сервиса (Guild, Messaging, Voice, WS Gateway) - multi-stage | 4 | 4 Docker-образа собираются, < 200MB каждый | Б1-01 |
| Б1-16 | docker-compose v2: 5 .NET контейнеров + Nginx + PG + Zitadel + LiveKit (8 контейнеров) | 3 | `docker compose up` - все 8 контейнеров стартуют | Б1-15 |
| Б1-17 | Nginx.conf v2: маршрутизация по 5 upstream (guild:5001, messaging:5002, voice:5003, ws:5004, zitadel:8080) | 2 | Каждый URL → свой сервис | Б1-16 |
| Б1-18 | `HttpGuildClient` - реализация IGuildAccessClient через HttpClient. Заменяет in-process вызовы из Стадии 1 (Б1-11, Б1-12) на HTTP. | 3 | Messaging → HTTP → Guild Service (вместо in-process) | Б1-15 |
| Б1-19 | `HttpMessagingClient` - реализация IMessagingClient через HttpClient. Заменяет in-process вызовы из Стадии 1 на HTTP. | 2 | WS Gateway → HTTP → Messaging Service | Б1-15 |
| Б1-20 | Health Checks: каждый сервис → GET /health (PG check, downstream check) | 2 | docker-compose healthcheck + depends_on condition: service_healthy | Б1-16 |
| Б1-21 | Polly: Retry (3x, backoff+jitter) + Circuit Breaker (5 errors/30s, 15s open) на всех HttpClient | 4 | Логи Circuit Breaker state transitions, retry attempts | Б1-18, Б1-19 |
| Б1-22 | Deadlines: X-Deadline middleware, CancellationToken propagation, default 5s | 2 | Timeout → 504, каскадная отмена | Б1-18 |
| Б1-23 | ASP.NET Rate Limiter: per-user по JWT sub, 100 RPS | 2 | Превышение → 429, Retry-After | Б2-02 |

#### Б2 - Backend / QA (~29 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б2-13 | Messaging Service: Outbox Pattern - INSERT message + outbox_event в одной транзакции | 4 | Outbox-запись создается рядом с сообщением | Б1-15 |
| Б2-14 | OutboxWorker (BackgroundService): poll → System.Threading.Channels → BroadcastConsumer | 4 | События из outbox → POST /internal/broadcast | Б2-13 |
| Б2-09 | WebSocket Module: POST /internal/broadcast - прием событий от Outbox, рассылка через SignalR Groups | 4 | Endpoint работает, SignalR Groups по channelId | Б2-03, Б2-14 |
| Б2-15 | IdempotencyMiddleware: проверка X-Idempotency-Key, таблица idempotency_keys, TTL 24ч | 3 | Дубль → 200 с кэшированным ответом, без INSERT | Б1-15 |
| Б2-16 | IdempotencyCleanup: BackgroundService, удаление expired keys каждый час | 1 | Таблица idempotency_keys не растет бесконечно | Б2-15 |
| Б2-17 | Internal API: /internal/* endpoints не требуют JWT, только X-Correlation-Id | 2 | Internal endpoints доступны без Bearer, но с correlation | Б1-15 |
| Б2-18 | Prometheus метрики: prometheus-net.AspNetCore (http_requests_total, http_request_duration_seconds) | 3 | GET /metrics → Prometheus-формат | Б1-15 |
| Б2-19 | End-to-end тестирование микросервисов: все TC-01..TC-20 | 5 | Все тест-кейсы зеленые на docker-compose | Б1-16, Б2-14 |
| Б2-У3 | Интеграционные тесты с TestContainers: Outbox end-to-end (мок BroadcastConsumer), Idempotency (дубль → 200, ровно одна запись в БД) | 5 | Интеграционные тесты зелёные локально и в GitHub Actions | Б2-13, Б2-14, Б2-15 |

#### Ф1 - Frontend 1 (~17 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф1-11 | Idempotency Key: crypto.randomUUID() при отправке сообщения + retry UI | 3 | При retry → тот же ключ → нет дубля | Б2-15, Ф2-02 |
| Ф1-12 | Error handling: 429 → «Слишком много запросов», 503 → «Сервис недоступен», 504 → Timeout | 4 | Toast-уведомления с человеческим текстом | Ф1-03 |
| Ф1-13 | Пофайловый рефакторинг: проверить, что фронт работает без изменений через Nginx v2 | 2 | Фронт работает с новым Nginx, все запросы проходят | Б1-17 |
| Ф1-14 | Баг-фиксы и polish: UX улучшения из Б2-19 тестирования | 8 | Все найденные баги исправлены | Б2-19 |

#### Ф2 - Frontend 2 (~17 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф2-11 | Retry UX: кнопка «Повторить» при ошибке отправки сообщения | 3 | Сообщение с красной галкой → кнопка → повтор | Ф1-11 |
| Ф2-12 | Presence events: voice.joined, voice.left, member.joined → обновление UI | 3 | Все события от WS Gateway обрабатываются | Б2-09, Ф2-09 |
| Ф2-13 | Circuit Breaker UX: при 503 → баннер «Сервис временно недоступен, повторите позже» | 3 | Желтый баннер с auto-dismiss через 15с | Ф1-12 |
| Ф2-14 | Баг-фиксы и polish: UX из Б2-19 тестирования | 8 | Все найденные баги исправлены | Б2-19 |

---

## Стадия 3 - Kubernetes (Неделя 4)

### Неделя 4: k8s + Наблюдаемость + Демо

#### Б1 - Backend / DevOps (~26 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б1-24 | minikube setup: `minikube start`, `minikube addons enable ingress` | 1 | minikube работает с Nginx Ingress Controller | - |
| Б1-25 | k8s-манифесты: Deployment + Service для Guild, Messaging, Voice, WS Gateway | 5 | `kubectl apply -f k8s/` → 4 сервисных пода запущены | Б1-24 |
| Б1-26 | k8s-манифесты: PostgreSQL StatefulSet + PersistentVolumeClaim | 3 | PostgreSQL в k8s с persistent storage | Б1-24 |
| Б1-27 | k8s-манифесты: Zitadel Deployment + Service | 2 | Zitadel в k8s, Application перенастроен | Б1-26 |
| Б1-28 | k8s-манифесты: LiveKit Deployment + Service | 1 | LiveKit в k8s | Б1-24 |
| Б1-29 | Ingress YAML: все маршруты (/api/guilds, /api/channels, /api/voice, /ws, /auth) | 3 | Nginx Ingress Controller маршрутизирует трафик | Б1-25, Б1-27 |
| Б1-30 | Kubernetes Secrets: PG password, JWT signing key, LiveKit API key | 2 | Секреты → envFrom: secretRef в Deployments | Б1-25 |
| Б1-31 | Prometheus + Grafana в k8s: Deployment + Service + ConfigMap (prometheus.yml, datasource) | 4 | Prometheus scrape → Grafana dashboard доступен | Б1-25 |
| Б1-32 | Grafana дашборд: HTTP RPS, latency p95, error rate, Circuit Breaker state | 3 | JSON-дашборд импортирован в Grafana | Б1-31 |
| Б1-33 | Smoke test: полный happy path в k8s (регистрация → сообщение → голос) | 2 | Все работает в k8s | Б1-29 |

#### Б2 - Backend / QA (~22 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Б2-20 | k8s probes: livenessProbe + readinessProbe → /health для каждого сервиса | 2 | Pods перезапускаются при зависании, не получают трафик если unhealthy | Б1-25 |
| Б2-21 | Финальное тестирование в k8s: все TC-01..TC-20 | 5 | Все тест-кейсы зеленые в k8s | Б1-33 |
| Б2-22 | Тестирование resilience: Circuit Breaker демо (убить Guild Pod → 503 → recover) | 3 | Показываемый сценарий для демо | Б1-21, Б2-21 |
| Б2-23 | Тестирование resilience: Idempotency демо (отправить → kill network → retry → нет дубля) | 2 | Показываемый сценарий для демо | Б2-15, Б2-21 |
| Б2-24 | Подготовка к демо: сценарий показа, порядок фич, fallback план | 3 | Документ «Сценарий демо» | Б2-21 |
| Б2-25 | Баг-фиксы: критические баги из Б2-21 | 5 | Все critical/high баги закрыты | Б2-21 |
| Б2-У4 | Coverage report: запустить `dotnet test --collect:"XPlat Code Coverage"` + `reportgenerator`. Проверить метрики: общее ≥70%, доменная логика ≥85%, критические пути (Outbox, Idempotency, RBAC) ≥90%. Добавить badge в README. | 2 | HTML coverage report сформирован, метрики достигнуты, badge в README | Б2-У1, Б2-У2, Б2-У3 |

#### Ф1 - Frontend 1 (~17 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф1-15 | Dockerfile для Vue SPA: multi-stage build (npm build → Nginx:alpine serve) | 2 | Docker-образ с SPA, < 50MB | Ф1-01 |
| Ф1-16 | Финальный polish: анимации, loading states, skeleton screens | 5 | UI выглядит завершенным | Ф1-14 |
| Ф1-17 | Демо-сценарий UI: подготовить тестовые данные, проверить все переходы | 3 | Демо-данные готовы (серверы, каналы, сообщения) | Б2-24 |
| Ф1-18 | Баг-фиксы из k8s тестирования | 7 | Все UI-баги закрыты | Б2-21 |

#### Ф2 - Frontend 2 (~17 ч)

| # | Задача | Часы | Результат | Зависит от |
|:--|:--|:--|:--|:--|
| Ф2-15 | Dockerfile для Vue SPA (если Ф1 не успевает) или кросс-ревью | 2 | Docker-образ готов | Ф1-15 |
| Ф2-16 | Voice polish: отображение уровня громкости, плавные анимации join/leave | 4 | Голосовой UI выглядит завершенным | Ф2-08 |
| Ф2-17 | Accessibility и edge cases: пустые состояния, длинные имена, ошибки сети | 4 | Нет битых состояний UI | Ф2-14 |
| Ф2-18 | Баг-фиксы из k8s тестирования | 7 | Все UI-баги закрыты | Б2-21 |

---

## Граф зависимостей

```
Б1-01 (Solution)
  ├── Б1-02 (docker-compose) ──→ Б2-01 (Zitadel setup) ──→ Б2-02 (JWT middleware)
  │     ├── Б1-03 (Nginx.conf)
  │     ├── Б1-05 (EF Core + миграции)
  │     │     ├── Б1-06 (Guild CRUD) ──→ Б1-10 (кик/бан) ──→ Б1-11 (disconnect WS)
  │     │     │     │                                      └──→ Б1-12 (disconnect Voice)
  │     │     │     ├── Б2-06 (инвайты) ──→ Ф1-06 (InviteView), Ф1-07 (InviteCreate)
  │     │     │     └── Б2-07 (назначение ролей) ──→ Ф1-08 (Модерация UI)
  │     │     └── Б1-07 (Messaging CRUD)
  │     └── Б1-08 (Voice Module) ──→ Б1-09 (LiveKit) ──→ Ф2-06 (Voice UI) ──→ Ф2-07 (livekit-client)
  ├── Б1-04 (Serilog)
  └── Б2-03 (SignalR Hub) ──→ Б2-04 (Presence) ──→ Б2-05 (интерфейсы)
        └── Ф2-01 (SignalR client) ──→ Ф2-02 (Pinia chat) ──→ Ф2-03 (ChatView)

Ф1-01 (Vue проект)
  ├── Ф1-02 (OIDC) ──→ Ф1-03 (axios) ──→ Ф1-05 (Серверы UI)
  └── Ф1-04 (Layout)

--- Неделя 3 ---

Б1-15 (Dockerfiles) ──→ Б1-16 (compose v2) ──→ Б1-17 (Nginx v2)
  ├── Б1-18 (HttpGuildClient) ──→ Б1-21 (Polly)
  ├── Б1-19 (HttpMessagingClient) ──→ Б1-21
  ├── Б1-20 (Health Checks)
  ├── Б2-13 (Outbox) ──→ Б2-14 (OutboxWorker) ──→ Б2-09 (POST /internal/broadcast)
  └── Б2-15 (Idempotency) ──→ Б2-16 (Cleanup)

--- Неделя 4 ---

Б1-24 (minikube)
  ├── Б1-25 (k8s Deployments) ──→ Б1-29 (Ingress) ──→ Б1-33 (smoke test)
  ├── Б1-26 (PG StatefulSet)
  ├── Б1-27 (Zitadel k8s)
  ├── Б1-28 (LiveKit k8s)
  ├── Б1-30 (Secrets)
  └── Б1-31 (Prometheus + Grafana) ──→ Б1-32 (дашборд)
```

---

## Критический путь

```
Б1-01 → Б1-02 → Б2-01 → Б2-02 → Б2-03 → Б2-05 → Б1-06 → Б1-07
  → Б2-11 (E2E тест монолита)
  → Б1-15 → Б1-16 → Б1-18 → Б1-21 → Б2-13 → Б2-14 → Б2-09
  → Б2-19 (E2E тест микросервисов)
  → Б1-24 → Б1-25 → Б1-29 → Б1-33
  → Б2-21 (E2E тест k8s)
```

**Критические вехи:**
- Конец Недели 1: монолит запускается, регистрация + сообщения работают
- Конец Недели 2: полный happy path монолита (голос, модерация, инвайты)
- Конец Недели 3: микросервисы в docker-compose, все resilience-паттерны
- Конец Недели 4: k8s, Prometheus + Grafana, демо-сценарий отрепетирован

---

## Тест-кейсы

| ID | Сценарий | Ожидаемый результат | FR |
|:--|:--|:--|:--|
| TC-01 | Регистрация нового пользователя через Zitadel | Пользователь создан, redirect на главную | FR-1 |
| TC-02 | Логин существующего пользователя | JWT получен, профиль отображается | FR-2 |
| TC-03 | Access token истекает → silent refresh | Новый token без redirect на логин | FR-3 |
| TC-04 | Создание сервера | Сервер в списке, роль Owner | FR-5 |
| TC-05 | Создание текстового канала | Канал в списке каналов | FR-6 |
| TC-06 | Создание голосового канала | Канал с иконкой 🔊 в списке | FR-7 |
| TC-07 | Генерация инвайт-ссылки (TTL + max uses) | Ссылка скопирована, отображается срок и лимит | FR-11 |
| TC-08 | Вступление по инвайту | Сервер появляется у второго пользователя | FR-12 |
| TC-09 | Отправка сообщения | Сообщение видно отправителю и получателю в реальном времени | FR-15, FR-18 |
| TC-10 | Загрузка истории (scroll вверх) | Подгружаются старые сообщения (50 шт) | FR-16 |
| TC-11 | Удаление своего сообщения | Сообщение исчезает у всех | FR-17 |
| TC-12 | Вход в голосовой канал | Голос слышен собеседнику | FR-21 |
| TC-13 | Mute/Unmute микрофона | Иконка меняется, голос не передается при mute | FR-23 |
| TC-14 | Кик участника | Участник удален из сервера, WS отключен | FR-25 |
| TC-15 | Бан участника | Участник забанен, WS и голос отключены, причина показана | FR-26 |
| TC-16 | Онлайн-статус: пользователь заходит | Зеленая точка у участника | FR-27 |
| TC-17 | Офлайн-статус: пользователь закрывает вкладку | Серая точка через ≤30 сек | FR-28 |
| TC-18 | Circuit Breaker: убить Guild Pod | 503 → через 15с recover → нормальная работа | NFR-10 |
| TC-19 | Idempotency: двойная отправка одного сообщения | Одно сообщение в БД (не два) | FR-20 |
| TC-20 | Rate Limiting: 150 запросов за секунду | 429 Too Many Requests после порога | NFR-9 |

---

## Что вернуть при опережении

Если команда идет быстрее плана, добавлять в порядке приоритета:

| Приоритет | Фича | Часы | Кто |
|:--|:--|:--|:--|
| 1 | Редактирование сообщений (PUT /api/messages/{id}) | 4 | Б2 + Ф2 |
| 2 | Emoji-реакции на сообщения | 6 | Б2 + Ф2 |
| 3 | Typing indicator (SignalR event) | 3 | Б2 + Ф2 |
| 4 | Поиск серверов / пользователей | 5 | Б1 + Ф1 |
| 5 | OAuth (Google) в Zitadel | 3 | Б2 |
| 6 | Больше Grafana дашбордов (per-service breakdown) | 3 | Б1 |

---

## Чего НЕ делать

| Запрет | Почему |
|:--|:--|
| ❌ Redis | In-memory достаточно для демо (1 instance). Redis - лишняя сложность |
| ❌ gRPC | HTTP проще отлаживать, Polly работает из коробки |
| ❌ RabbitMQ / Kafka | Outbox + HTTP заменяют broker для наших объемов |
| ❌ Service mesh (Istio) | Слишком тяжелый для minikube + 4 человека |
| ❌ E2EE реализация | Только в архитектуре и презентации, не в коде |
| ❌ Мобильный адаптив | Desktop only, CSS Grid без media queries |
| ❌ Полный CI/CD с деплоем | Только GitHub Actions: build + test на PR |
| ❌ 100% test coverage | Цель: ≥70% общее, ≥85% Domain, ≥90% критические пути |
| ❌ Кастомизация Zitadel UI | Только цвет + логотип, не кастомные формы |
| ❌ MinIO / файловые вложения | Нет файлов в MVP |
| ❌ Helm charts | Обычные YAML-манифесты, Helm - overkill |
| ❌ HPA (автоскейлинг) | Один replica per service, нет нагрузки для скейлинга |

---

## Бюджет часов

### Сводка по неделям

| Неделя | Б1 | Б2 | Ф1 | Ф2 | Итого |
|:--|:--|:--|:--|:--|:--|
| 1 | 22 | 22 | 18 | 18 | **80** |
| 2 | 22 | 24 | 18 | 18 | **82** |
| 3 | 24 | 29 | 17 | 17 | **87** |
| 4 | 26 | 22 | 17 | 17 | **82** |
| **Итого** | **94** | **97** | **70** | **70** | **331** |

### Примечания

- **Б1 перегружен** на неделе 4 (26 ч = k8s манифесты + Grafana). Компенсируется: Ф1/Ф2 на неделе 4 занимаются баг-фиксами и polish, могут помочь с тестированием.
- **Б2 перегружен** на неделе 3 (29 ч = Outbox + Idempotency + интеграционные тесты). Это ключевая неделя для resilience-паттернов. Б1 может помочь с OutboxWorker если Б2 не успевает.
- **Б2 - QA-буфер**: Б2 на неделях 2 и 4 занимается тестированием. Если багов мало - берет задачи из «Что вернуть при опережении».
- **Ф1 и Ф2** на неделе 3–4 в основном баг-фиксы. Это ожидаемо - на этом этапе фронт стабилен.
- **Тесты**: добавлены Б2-У1, Б2-У2, Б2-У3, Б2-У4 (15 часов на тесты и coverage). Это требование преподавателя — 5 баллов.
- **Запас**: ~331 ч из ~320 доступных (~21 ч/нед × 4 чел × 4 нед). Превышение на ~11 ч. Компенсируется: задачи «Что вернуть при опережении» выполняются только при реальном опережении графика.
- **Fallback**: если k8s не работает к демо → показываем docker-compose. Если Prometheus/Grafana не готовы → показываем логи Serilog в терминале.
```