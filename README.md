# mcp-user-factory

Одиночный сервис для Coolify, который создаёт новых пользователей с собственными MCP SSE эндпоинтами
(tbxark/mcp-proxy + @aiondadotcom/mcp-ssh + @aakarsh-sasi/memory-bank-mcp).

## Развёртывание в Coolify
1) Создайте приложение типа **Dockerfile** или **Docker Image** и укажите этот репозиторий.
2) Пропишите переменные окружения (см. `.env.example`):
   - `COOLIFY_API_URL` (например, `https://coolify.ai-solutions.ru/api/v1`)
   - `COOLIFY_API_TOKEN` (из *Keys & Tokens → API tokens* вашей инсталляции)
   - `PROJECT_UUID`, `SERVER_UUID` (или `DESTINATION_UUID`)
   - `BASE_DOMAIN` (напр. `mcp.example.com`)
   - `FACTORY_FQDN` или `FACTORY_BASE_URL` (например, `factory.mcp.example.com`)
3) Повесьте FQDN на этот сервис (например, `factory.mcp.example.com`).
   Этот адрес будет использоваться для отдачи конфигураций `mcp-proxy` по пути
   `/configs/{configId}.json?token=...`.

## API
- `GET /health` — проверка живости.
- `POST /users` — создать пользователя.
  ```json
  {
    "user": "alice",
    "sshPrivateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n...",
    "sshPublicKey": "ssh-ed25519 AAAA...",
    "knownHosts": "github.com ssh-ed25519 AAAA...\n..."
  }
  ```
  **Ответ:**
  ```json
  {
    "user": "alice",
    "token": "tok_xxx",
    "fqdn": "alice.mcp.example.com",
    "sseUrl": "https://alice.mcp.example.com/sse",
    "messageUrl": "https://alice.mcp.example.com/mcp",
    "coolify": { "uuid": "..." }
  }
  ```
- `POST /apps/{uuid}/restart` — перезапуск приложения в Coolify.
- `DELETE /apps/{uuid}` — удаление приложения.

## Безопасность
- mcp-ssh фикс уязвимости: используем `@aiondadotcom/mcp-ssh@^1.1.0`.
- Для доступа к самому провизионеру добавьте внешний прокси/фаервол или простую проверку токена в `requireAuth`.

## Сборка локально
```bash
npm i
npm start
```

## Лицензия
MIT
# mcp-ssh-memory-chatgpt
