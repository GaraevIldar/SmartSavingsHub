# NexTalk

Платформа для командного общения. Аналог Discord.
Микросервисная архитектура с Kubernetes, Zitadel (IdP), Nginx Ingress и паттернами отказоустойчивости.

---

## Содержание

1. [Проблема и идея](#1-проблема-и-идея)
2. [MVP](#2-mvp)
3. [Эволюция архитектуры](#3-эволюция-архитектуры)
4. [Финальная архитектура](#4-финальная-архитектура)
5. [Функциональные требования (FR)](#5-функциональные-требования-fr)
6. [Сервисы системы](#6-сервисы-системы)
7. [Межсервисное взаимодействие](#7-межсервисное-взаимодействие)
8. [Отказоустойчивость](#8-отказоустойчивость)
9. [Нефункциональные требования (NFR)](#9-нефункциональные-требования-nfr)
10. [Где хранятся данные](#10-где-хранятся-данные)
11. [Фронтенд](#11-фронтенд)
12. [За рамками MVP](#12-за-рамками-mvp)
13. [Глоссарий](#13-глоссарий)

---

## 1. Проблема и идея

### Что это такое

NexTalk - веб-платформа для общения: серверы (гильдии), текстовые и голосовые каналы, роли и права доступа.

### Ключевые архитектурные решения

- **Микросервисы** - 4 бизнес-сервиса + WebSocket Gateway + Nginx, каждый деплоится независимо
- **Zitadel** - делегированная аутентификация (OIDC), отдельный IdP-сервис
- **Nginx** - единая точка входа (reverse proxy в docker-compose, Ingress Controller в k8s)
- **Kubernetes** - оркестрация контейнеров, Ingress, Secrets, Prometheus + Grafana
- **Паттерны отказоустойчивости** - Circuit Breaker, Retry, Rate Limiting, Idempotency, Health Checks
- **Outbox Pattern** - гарантия at-least-once доставки сообщений

### E2EE

Спроектировано на уровне архитектуры. В MVP сообщения передаются plain text (защищены TLS). Модульная структура готова к внедрению E2EE в следующей фазе.

---

## 2. MVP

### Входит в MVP

| Функция | Описание |
|:--|:--|
| **Аутентификация** | Zitadel (OIDC): регистрация, логин, JWT access + refresh tokens |
| **Серверы (гильдии)** | Создание, 3 фиксированные роли (Owner, Admin, Member) |
| **Текстовые каналы** | Создание, отправка/получение сообщений plain text |
| **Голосовые каналы** | WebRTC через LiveKit SFU |
| **Чат в реальном времени** | SignalR WebSocket, Outbox Pattern (at-least-once) |
| **Онлайн-статусы** | Heartbeat 20 сек, in-memory в WebSocket Gateway |
| **Модерация** | Кик/бан с мгновенным отключением от WS и голоса |
| **Инвайт-ссылки** | Генерация и принятие приглашений |
| **Микросервисы** | 5 .NET сервисов + Nginx + Zitadel |
| **Kubernetes** | k8s-манифесты, Ingress, Secrets |
| **Наблюдаемость** | Serilog + Correlation ID + Prometheus + Grafana |
| **Отказоустойчивость** | Circuit Breaker, Retry, Rate Limiting, Idempotency, Health Checks |

### Не входит в MVP

- E2EE - только в архитектуре и презентации
- Личные сообщения (DM)
- Email-уведомления
- Вложения, аватары (MinIO)
- OAuth (Google/GitHub) - Zitadel поддерживает, но не настраиваем
- Redis (presence и rate limiting in-memory)

---

## 3. Эволюция архитектуры

Система развивается в 3 стадии. Бизнес-логика не переписывается - меняется только способ развертывания и связывания модулей.

### Стадия 1 - Модульный монолит (неделя 1–2)

Все в одном .NET-процессе. Быстрый старт, удобная отладка.

```
┌─────────┐       ┌───────────┐       ┌────────────────────────────┐
│ Browser │──────→│   Nginx   │──────→│      .NET Монолит          │
│ (Vue)   │       │   :80     │       │  ┌────────┐ ┌───────────┐  │
└─────────┘       └───────────┘       │  │ Guild  │ │ Messaging │  │
     │                                │  │ Module │ │ Module    │  │
     │            ┌───────────┐       │  └────────┘ └───────────┘  │
     └───────────→│  Zitadel  │       │  ┌────────┐ ┌───────────┐  │
      OIDC login  │  :8080    │       │  │ Voice  │ │ WS Layer  │  │
                  └───────────┘       │  │ Module │ │ (SignalR) │  │
                                      │  └────────┘ └───────────┘  │
                                      └───────────────┬────────────┘
                                                      │
                                      ┌───────────────┼──────────┐
                                      │               │          │
                                ┌─────┴──────┐   ┌────┴────┐  ┌──┴───┐
                                │ PostgreSQL │   │ LiveKit │  │ ...  │
                                └────────────┘   └─────────┘  └──────┘
```

**Будут запущены:** Nginx, .NET монолит, PostgreSQL, Zitadel, LiveKit - **5 контейнеров**

**Как модули общаются:** прямые вызовы через интерфейсы внутри одного процесса.

### Стадия 2 - Микросервисы (неделя 3)

Каждый модуль становится отдельным сервисом. Интерфейсы остаются, но реализации заменяются на HTTP-клиенты.

```
┌─────────┐       ┌───────────────────────────────────────────────────┐
│ Browser │──────→│                   Nginx :80                       │
│ (Vue)   │       │  /api/guilds/*    → Guild Service :5001           │
└─────────┘       │  /api/channels/*  → Messaging Service :5002       │
     │            │  /api/voice/*     → Voice Service :5003           │
     │            │  /ws              → WS Gateway :5004 (WebSocket)  │
     │            │  /auth/*          → Zitadel :8080                 │
     │            └─────┬────────────┬───────────┬────────────┬───────┘
     │                  │            │           │            │
     │              ┌───┴────┐  ┌────┴────┐  ┌───┴────┐  ┌────┴────┐
     │              │ Guild  │  │Messaging│  │ Voice  │  │   WS    │
     │              │Service │  │ Service │  │Service │  │ Gateway │
     │              └───┬────┘  └────┬────┘  └──┬─────┘  └─────────┘
     │                  │            │          │           
     │            ┌─────┴────────────┴──────────┴─────┐
     │            │     PostgreSQL                    │
     │            │     ├── guild schema              │
     │            │     └── messaging schema          │
     │            └───────────────────────────────────┘
     │
     │            ┌───────────┐
     └───────────→│  Zitadel  │ (OIDC login)
                  └───────────┘
```

**Будут запущены:** Nginx, Guild Service, Messaging Service, Voice Service, WS Gateway, PostgreSQL, Zitadel, LiveKit - **8 контейнеров**

**Что изменилось по сравнению со Стадией 1:**
- ✂️ Монолит разрезан на 4 сервиса + WS Gateway
- ✂️ Nginx.conf обновлен: вместо одного upstream - пять
- ✂️ docker-compose.yml: вместо 1 .NET-контейнера - 5
- ✂️ Добавлены паттерны отказоустойчивости (Polly, Health Checks, Idempotency)

**Что НЕ изменилось:**
- ✅ Бизнес-логика внутри модулей - без изменений
- ✅ Схемы БД - без изменений
- ✅ Фронтенд - без изменений (тот же URL Nginx)
- ✅ Zitadel - без изменений
- ✅ LiveKit - без изменений

### Стадия 3 - Kubernetes (неделя 4)

docker-compose → k8s. Те же Docker-образы, другой оркестратор.

```
┌─────────┐     ┌──────────────────── Kubernetes (minikube) ───────────────────┐
│ Browser │────→│  Nginx Ingress Controller                                    │
│ (Vue)   │     │    │                                                         │
└─────────┘     │    ├── /api/guilds/*   → [Guild Pod]      → [PostgreSQL Pod] │
                │    ├── /api/channels/* → [Messaging Pod]  → [PostgreSQL Pod] │
                │    ├── /api/voice/*    → [Voice Pod]      → [LiveKit Pod]    │
                │    ├── /ws             → [WS Gateway Pod]                    │
                │    └── /auth/*         → [Zitadel Pod]                       │
                │                                                              │
                │  [Prometheus Pod] ──scrape──→ все сервисы /metrics           │
                │  [Grafana Pod]    ──query───→  Prometheus                    │
                └──────────────────────────────────────────────────────────────┘
```

**Будут запущены:** 11 подов в k8s (те же 8 сервисов + Prometheus + Grafana + Vue SPA)

**Что изменилось по сравнению со Стадией 2:**
- ✂️ docker-compose → k8s-манифесты (Deployment + Service + Ingress)
- ✂️ Nginx-контейнер → Nginx Ingress Controller (аддон minikube)
- ✂️ `.env` секреты → Kubernetes Secrets
- ✂️ Добавлены Prometheus + Grafana

**Что НЕ изменилось:**
- ✅ Docker-образы - те же самые
- ✅ Код сервисов - без изменений
- ✅ Правила маршрутизации - те же (только формат YAML вместо Nginx.conf)

> **docker-compose остается рабочим.** Это fallback: если k8s сломается перед демо, показываем docker-compose.

---

## 4. Финальная архитектура

### Контейнеры / Поды

| # | Сервис | Технология | Роль |
|:--|:--|:--|:--|
| 1 | **Nginx** | Nginx (контейнер) / Ingress Controller (k8s) | Reverse proxy, rate limiting, routing |
| 2 | **WebSocket Gateway** | ASP.NET + SignalR | WS-соединения, broadcast, presence |
| 3 | **Guild Service** | ASP.NET | Серверы, каналы, роли, инвайты, модерация |
| 4 | **Messaging Service** | ASP.NET | Сообщения, Outbox Pattern, идемпотентность |
| 5 | **Voice Service** | ASP.NET | LiveKit-токены, управление комнатами |
| 6 | **Zitadel** | Go | IdP: OIDC, регистрация, логин, JWT |
| 7 | **PostgreSQL** | PostgreSQL 17 | 2 схемы (guild, messaging) + БД Zitadel |
| 8 | **LiveKit** | Go | SFU + встроенный TURN |
| 9 | **Prometheus** | Prometheus | Сбор метрик /metrics |
| 10 | **Grafana** | Grafana | Дашборды, визуализация |
| 11 | **Vue SPA** | Vue 3 + Nginx | Фронтенд (статика через Nginx) |

### Пользователи и роли

| Роль | Права | Как получает |
|:--|:--|:--|
| **Owner** | Полный контроль: каналы, роли, удаление сервера, кик/бан | Создал сервер |
| **Admin** | Управление каналами, кик/бан, удаление сообщений | Назначен Owner |
| **Member** | Писать сообщения, участвовать в голосовых каналах | Принял инвайт |

3 фиксированные роли с хардкоженными правами. Не bitmask - простые enum-проверки.

### Use Cases

**UC-1: Регистрация и вход.** Пользователь нажимает "Войти" → redirect на Zitadel → логин/регистрация → redirect обратно с JWT.

**UC-2: Создание сервера.** Пользователь создает сервер → настраивает каналы → генерирует инвайт → приглашает друзей.

**UC-3: Отправка сообщения.** Пользователь пишет текст → WebSocket Gateway → Messaging Service сохраняет + outbox → broadcast всем онлайн.

**UC-4: Голосовой канал.** Пользователь входит → Voice Service генерирует LiveKit-токен → браузер подключается к LiveKit → голос.

**UC-5: Модерация.** Admin/Owner банит участника → мгновенное отключение от WebSocket и голоса.

---

## 5. Функциональные требования (FR)

### Аутентификация (Zitadel)

| ID   | Требование                                                        | Приоритет |
| :--- | :---------------------------------------------------------------- | :-------- |
| FR‑1 | Регистрация через Zitadel (OIDC Authorization Code + PKCE)        | Must      |
| FR‑2 | Логин через Zitadel с получением JWT access token + refresh token | Must      |
| FR‑3 | Автоматическое обновление access token (silent refresh)           | Must      |
| FR‑4 | Получение профиля из JWT claims (sub, email, name)                | Must      |

### Серверы и каналы

| ID | Требование | Приоритет |
|:--|:--|:--|
| FR‑5 | Создание сервера. Создатель получает роль Owner | Must |
| FR‑6 | Создание текстового канала внутри сервера | Must |
| FR‑7 | Создание голосового канала внутри сервера | Must |
| FR‑8 | Получение списка серверов пользователя | Must |
| FR‑9 | Получение списка каналов сервера | Must |
| FR‑10 | Удаление канала (Owner/Admin) | Should |

### Приглашения и участники

| ID | Требование | Приоритет |
|:--|:--|:--|
| FR‑11 | Генерация инвайт-ссылки с TTL и лимитом использований | Must |
| FR‑12 | Вступление на сервер по инвайт-ссылке | Must |
| FR‑13 | Назначение роли Admin участнику (только Owner) | Should |
| FR‑14 | Получение списка участников сервера с ролями и статусом | Must |

### Сообщения

| ID | Требование | Приоритет |
|:--|:--|:--|
| FR‑15 | Отправка текстового сообщения в канал (plain text) | Must |
| FR‑16 | Получение истории (cursor-based pagination, 50 на запрос) | Must |
| FR‑17 | Удаление сообщения (автор / Admin / Owner) | Should |
| FR‑18 | Доставка сообщений в реальном времени через WebSocket | Must |
| FR‑19 | Гарантия at-least-once доставки через Outbox Pattern | Must |
| FR-20 | Идемпотентность при повторной отправке (X-Idempotency-Key) | Must |

### Голос

| ID | Требование | Приоритет |
|:--|:--|:--|
| FR‑21 | Вход в голосовой канал с получением LiveKit-токена | Must |
| FR‑22 | Выход из голосового канала | Must |
| FR‑23 | Mute/unmute микрофона | Must |
| FR‑24 | Отображение говорящего (voice activity detection) | Should |

### Модерация

| ID | Требование | Приоритет |
|:--|:--|:--|
| FR‑25 | Кик участника с удалением из сервера | Must |
| FR‑26 | Бан участника с мгновенным отключением от WS и голоса | Must |

### Присутствие

| ID | Требование | Приоритет |
|:--|:--|:--|
| FR‑27 | Онлайн-статус участников по heartbeat (каждые 20 сек) | Must |
| FR‑28 | Автоматический переход в офлайн через 30 сек без heartbeat | Must |

---

## 6. Сервисы системы

### Nginx (Reverse Proxy / Ingress)

Единая точка входа. Маршрутизирует запросы к нужному сервису.

| Функция | Реализация |
|:--|:--|
| Маршрутизация | `location /api/guilds/ → guild-service:5001` и т.д. |
| Rate Limiting | `limit_req_zone` - 100 RPS на IP |
| WebSocket proxy | `proxy_pass` с `Upgrade: websocket` |
| Correlation ID | `proxy_set_header X-Request-Id $request_id` |
| TLS | Терминация HTTPS (в k8s - на Ingress) |

В docker-compose: контейнер `Nginx:alpine` с кастомным `Nginx.conf`.
В k8s: Nginx Ingress Controller (`minikube addons enable ingress`) + ресурс `Ingress`.

### Zitadel (Identity Provider)

Полностью берет на себя аутентификацию. NexTalk не хранит пароли и не выдает JWT.

| Что делает Zitadel | Как |
|:--|:--|
| Регистрация | Встроенная UI-форма (кастомизация брендинга) |
| Логин | OIDC Authorization Code Flow + PKCE |
| JWT выдача | Access token с claims: sub, email, name |
| Refresh tokens | Silent refresh через iframe |
| User management | Zitadel Console или Management API |

Фронтенд использует `oidc-client-ts` для OIDC-интеграции.
Бэкенд-сервисы валидируют JWT через OIDC Discovery (`.well-known/openid-configuration`).

Zitadel использует свою отдельную БД (`zitadel`) в том же экземпляре PostgreSQL.

### WebSocket Gateway (SignalR)

Управляет persistent WebSocket-соединениями.

| Эндпоинт | Назначение |
|:--|:--|
| WS `/ws/chat` | SignalR Hub: SendMessage, ReceiveMessage, Heartbeat |
| POST `/internal/broadcast` | Принять событие от Outbox → рассылка клиентам |
| POST `/internal/disconnect/{userId}` | Принудительное отключение (при бане) |
| GET `/health` | Статус + проверка downstream-сервисов |
| GET `/metrics` | Prometheus-метрики |

In-memory: ConcurrentDictionary для presence (userId → lastSeen), ConnectionManager (userId → connectionId).

### Guild Service - "Где ты общаешься?"

| Эндпоинт | Назначение |
|:--|:--|
| POST /api/guilds | Создать сервер |
| GET /api/guilds | Список серверов пользователя |
| POST /api/guilds/{id}/channels | Создать канал |
| GET /api/guilds/{id}/channels | Список каналов |
| POST /api/guilds/{id}/invites | Создать инвайт |
| POST /api/invites/{code}/accept | Принять инвайт |
| GET /api/guilds/{id}/members | Список участников |
| PUT /api/guilds/{id}/members/{uid}/role | Назначить роль |
| POST /api/guilds/{id}/members/{uid}/kick | Кик |
| POST /api/guilds/{id}/members/{uid}/ban | Бан |
| GET /internal/channels/{id}/check-access | Проверка прав (inter-service) |
| GET /internal/guilds/{id}/members | Участники (inter-service) |

Схема БД: `guild` (guilds, channels, members, invites, bans).

При вступлении пользователя: `display_name` копируется из JWT в таблицу `members` (денормализация - не ходить в Zitadel за именами).

### Messaging Service - "Что ты пишешь?"

| Эндпоинт | Назначение |
|:--|:--|
| POST /internal/messages | Создать сообщение (от WS Gateway, с X-Idempotency-Key) |
| GET /api/channels/{id}/messages | История (cursor-based, limit 50) |
| DELETE /api/messages/{id} | Удалить сообщение |

Outbox Pattern: в одной транзакции `INSERT message + INSERT outbox_event`. OutboxWorker (BackgroundService) → System.Threading.Channels → BroadcastConsumer → POST в WS Gateway `/internal/broadcast`.

Idempotency: таблица `idempotency_keys` с TTL 24ч.

Схема БД: `messaging` (messages, outbox_events, idempotency_keys).

### Voice Service - "Что ты говоришь?"

| Эндпоинт | Назначение |
|:--|:--|
| POST /api/voice/{channelId}/join | Вход, возврат LiveKit-токена |
| POST /api/voice/{channelId}/leave | Выход |
| DELETE /internal/voice/{userId}/disconnect | Принудительное отключение (при бане) |

Генерирует JWT для LiveKit. Управляет комнатами через LiveKit Server API. In-memory SessionStore (ConcurrentDictionary).

Нет собственной схемы БД - все данные в памяти или в LiveKit.

---

## 7. Межсервисное взаимодействие

### Протоколы

| Связь | Протокол | Паттерн |
|:--|:--|:--|
| Browser → Nginx | HTTPS | Reverse proxy |
| Browser → WS Gateway (через Nginx) | WSS (SignalR) | Bidirectional |
| Browser → LiveKit | WebRTC | Peer-to-SFU |
| Browser → Zitadel (через Nginx) | HTTPS | OIDC redirect |
| Nginx → Services | HTTP | Proxy |
| WS Gateway → Messaging | HTTP | Retry + Circuit Breaker |
| WS Gateway → Guild | HTTP | Retry + Circuit Breaker |
| Messaging → Guild | HTTP | Circuit Breaker + Deadline |
| Messaging → WS Gateway | HTTP | Outbox → broadcast |
| Voice → Guild | HTTP | Circuit Breaker + Deadline |
| Voice → LiveKit | HTTP | Timeout |
| Guild → WS Gateway | HTTP | Notify (kick/ban) |
| Guild → Voice | HTTP | Disconnect (kick/ban) |

### Internal API

Эндпоинты `/internal/*`:
- Не проксируются через Nginx
- Доступны только из внутренней Docker/k8s сети
- Не требуют JWT (доверие на уровне сети)
- Обязательно передают `X-Correlation-Id`
- Принимают `X-Deadline` для propagation таймаутов

### Как проверяются права

```
WS Gateway: пользователь хочет отправить сообщение в channel X
    │
    ├──→ Guild Service: GET /internal/channels/X/check-access?userId=123
    │    Guild Service: SELECT FROM members WHERE user_id=123 AND guild_id=...
    │    Guild Service: role == 'Member' → allowed: true
    │    └──→ WS Gateway: { allowed: true }
    │
    └──→ Messaging Service: POST /internal/messages
         Messaging Service: INSERT message + outbox_event
         └──→ WS Gateway: 201 Created
```

---

## 8. Отказоустойчивость

### 8.1 Health Checks

Каждый .NET сервис: `GET /health` (ASP.NET `HealthChecks`).
- Проверка зависимостей: PostgreSQL, downstream-сервисы
- Формат: `{"status": "Healthy", "checks": {"postgresql": "Healthy"}}`
- docker-compose: `healthcheck` + `depends_on: condition: service_healthy`
- k8s: `livenessProbe` + `readinessProbe` → `/health`

### 8.2 Retry + Exponential Backoff + Jitter

Polly Retry Policy на `IHttpClientFactory`:
- 3 попытки, задержки ~200ms → ~400ms → ~800ms
- Jitter ±25% (предотвращение thundering herd)
- Timeout per attempt: 2 секунды
- Только для safe-to-retry: GET или POST с Idempotency Key

### 8.3 Idempotency Key

Для POST-операций (отправка сообщения):
- Фронтенд генерирует UUID → заголовок `X-Idempotency-Key`
- Messaging Service проверяет `idempotency_keys` таблицу
- Дубль → кэшированный ответ (200 вместо 201)
- TTL: 24ч, cleanup через BackgroundService

### 8.4 Deadlines

- Заголовок `X-Deadline`: UTC timestamp
- Middleware: если deadline прошел → 504
- `CancellationTokenSource` привязан к deadline
- Default: 5 сек на всю цепочку

### 8.5 Rate Limiting

Два уровня:
1. **Nginx:** `limit_req` - 100 RPS на IP (грубая защита)
2. **Сервисы:** ASP.NET `AddRateLimiter()` - per-user по JWT claim `sub` (точная защита)

При превышении: HTTP 429 + `Retry-After: 1`.

### 8.6 Circuit Breaker

Polly Circuit Breaker на каждом `HttpClient`:
- Порог: 5 ошибок за 30 сек → circuit open
- Open state: 15 сек (немедленный 503, без сетевого вызова)
- Half-open: 1 тестовый запрос → при успехе → closed

### 8.7 Graceful Degradation

| Сценарий | Поведение |
|:--|:--|
| PostgreSQL down | Сервис → 503 `{"error": "Storage unavailable", "retryAfter": 5}` |
| Guild Service down | WS Gateway → Circuit Breaker → сообщение клиенту "Сервис недоступен" |
| Messaging Service down | Сообщение не отправляется, клиент видит ошибку + кнопку retry |
| WS Gateway down | Фронтенд → banner "Соединение потеряно. Обновите страницу" |

### 8.8 Outbox Pattern

1. Messaging Service: INSERT message + outbox_event **в одной PG-транзакции**
2. OutboxWorker (BackgroundService): poll каждые 2 сек
3. Публикация в `System.Threading.Channels<OutboxEvent>`
4. BroadcastConsumer → POST `/internal/broadcast` в WS Gateway
5. При успехе → `processed = true`
6. При ошибке → retry (exponential backoff, max 5 попыток)

---

## 9. Нефункциональные требования (NFR)

| ID | Характеристика | Целевой уровень | Как достигается |
|:--|:--|:--|:--|
| NFR-1 | Латентность сообщения | p95 < 200ms | SignalR broadcast |
| NFR-2 | Задержка голоса | < 150ms | LiveKit SFU + TURN |
| NFR-3 | Доступность | 99% | Health checks, restart, Circuit Breaker |
| NFR-4 | Безопасность | TLS 1.3 | HTTPS, WSS, DTLS |
| NFR-5 | Надежность доставки | At-least-once | Outbox Pattern |
| NFR-6 | Чтение истории | < 200ms | Cursor pagination, индексы |
| NFR-7 | Масштабируемость | Архитектурная готовность | Микросервисы, stateless |
| NFR-8 | Наблюдаемость | Full stack | Serilog JSON + Correlation ID + Prometheus + Grafana |
| NFR-9 | Rate Limiting | 100 RPS/user | Nginx + ASP.NET Rate Limiter |
| NFR-10 | Recovery time | < 15 сек | Circuit Breaker 15s + docker/k8s restart |
| NFR-11 | Нагрузка | 100+ одновременных | Single instance per service |
| NFR-12 | Secrets | Нет plaintext | Docker Secrets / k8s Secrets |
| NFR-13 | Аутентификация | Делегированная | Zitadel (OIDC) |

---

## 10. Где хранятся данные

### PostgreSQL

Один экземпляр PostgreSQL 17 с двумя базами:

| База данных | Владелец | Что хранит |
|:--|:--|:--|
| `zitadel` | Zitadel | Пользователи, сессии, ключи, проекции (управляется Zitadel) |
| `nextalk` | Сервисы NexTalk | Бизнес-данные |

Схемы в базе `nextalk`:

| Схема | Таблицы | Сервис |
|:--|:--|:--|
| `guild` | guilds, channels, members, invites, bans | Guild Service |
| `messaging` | messages, outbox_events, idempotency_keys | Messaging Service |

> Каждый сервис подключается только к своей схеме (отдельный PG-пользователь). Нужны чужие данные → HTTP-вызов к сервису-владельцу.

### In-Memory (без Redis)

| Данные | Где | Зачем |
|:--|:--|:--|
| Presence (кто онлайн) | WS Gateway, ConcurrentDictionary | Heartbeat TTL |
| Voice sessions | Voice Service, ConcurrentDictionary | Кто в каких каналах |
| Rate Limiting counters | Каждый сервис, in-memory | Per-user ограничение |
| Circuit Breaker state | Polly in-memory | Состояние CB |

---

## 11. Фронтенд

### Технологии

| Технология | Зачем |
|:--|:--|
| Vue.js 3 + TypeScript | UI-фреймворк |
| Pinia | Управление состоянием |
| Vue Router | Маршрутизация |
| oidc-client-ts | OIDC-интеграция с Zitadel |
| @microsoft/signalr | WebSocket-клиент |
| livekit-client | Голосовые каналы (WebRTC) |
| axios | HTTP-запросы |

### Авторизация (OIDC Flow)

```
1. Пользователь нажимает "Войти"
2. Vue SPA → redirect на Zitadel /oauth/v2/authorize
   (client_id, redirect_uri, response_type=code, PKCE)
3. Zitadel показывает форму логина/регистрации
4. Пользователь вводит credentials → Zitadel валидирует
5. Zitadel → redirect на /callback?code=...
6. Vue SPA обменивает code на tokens (POST /oauth/v2/token)
7. access_token сохраняется в памяти (Pinia store)
8. Все API-запросы: Authorization: Bearer <token>
```

### Layout

```
+----------+------------------+-------------------------+-------------+
| Серверы  |  Каналы сервера  |      Чат / голос        |  Участники  |
| (иконки) |                  |                         |  онлайн     |
|          |  # общий         |  [последние 50]         |             |
|  [S1]    |  # новости       |  [cursor-подгрузка ↑]   |  🟢 Маша    |
|  [S2]    |                  |  [поле ввода]           |  ⚫ Петя    |
|          |  🔊 Голос-1      |                         |             |
|  [+]     |  🔊 Голос-2      |                         |             |
+----------+------------------+-------------------------+-------------+
```

### Упрощения

- Последние 50 сообщений + cursor-pagination вверх
- При потере WS - banner "Соединение потеряно. Обновите страницу (F5)"
- Аватары - первая буква имени, цвет по хэшу userId
- Desktop only (CSS Grid, без мобильного адаптива)
- Логин/регистрация - UI Zitadel (кастомизация цветов/лого)

---

## 12. За рамками MVP

- E2EE (Signal Protocol, Web Crypto API) - архитектура готова
- Личные сообщения (DM)
- Email-уведомления (Outbox уже есть → добавить SMTP-consumer)
- Вложения и аватары (MinIO)
- OAuth провайдеры в Zitadel (Google, GitHub)
- Redis (distributed presence, distributed rate limiting)
- gRPC (замена HTTP для inter-service)
- Service mesh (Istio/Linkerd)
- Message broker (RabbitMQ/Kafka вместо Outbox + HTTP)

---

## 13. Глоссарий

| Термин | Определение |
|:--|:--|
| **OIDC** | OpenID Connect - протокол аутентификации поверх OAuth 2.0 |
| **PKCE** | Proof Key for Code Exchange - защита authorization code flow для SPA |
| **Zitadel** | Open-source Identity Provider (Go), аналог Keycloak |
| **JWT** | JSON Web Token - подписанный токен с claims |
| **SFU** | Selective Forwarding Unit - пересылает потоки без декодирования |
| **LiveKit** | Open-source SFU на Go с встроенным TURN |
| **Nginx Ingress** | Kubernetes-контроллер, маршрутизирующий HTTP-трафик к подам |
| **Outbox Pattern** | Событие + данные в одной транзакции → гарантия at-least-once |
| **Circuit Breaker** | При N ошибках - прекращает попытки, быстро отказывает |
| **Idempotency Key** | UUID от клиента, предотвращает дублирование при retry |
| **Polly** | .NET-библиотека для Retry, Circuit Breaker, Timeout |
| **Correlation ID** | UUID сквозной через все сервисы для трейсинга запроса |
| **SignalR** | ASP.NET библиотека для WebSocket |
| **Cursor Pagination** | "50 записей после этой" - работает быстро при любом объеме |
| **Graceful Degradation** | Система продолжает работать с ограничениями при сбоях |
| **Thundering Herd** | Массовый retry одновременно - jitter предотвращает |
| **RBAC** | Role-Based Access Control - управление доступом через роли |
| **Heartbeat** | Сигнал "я жив" каждые 20 сек |
