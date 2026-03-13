# Brandbridge AI Agent — API Documentation

## Overview

The Brandbridge AI Agent exposes a simple REST API that powers the chat widget and can be called directly from any React component or third-party integration.

---

## Base URL

```
https://your-api-domain.com
```

> Replace `your-api-domain.com` with your deployed server URL (e.g. a Railway, Render, or Vercel deployment).

---

## Endpoints

### `GET /health`

Returns the service status.

**Response**
```json
{
  "status": "ok",
  "service": "brandbridge-ai-agent",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

---

### `POST /api/chat`

Send a conversation and receive a full AI response.

**Request Headers**

| Header           | Value                        | Required |
|------------------|------------------------------|----------|
| `Content-Type`   | `application/json`           | Yes      |
| `Authorization`  | `Bearer <your-api-key>`      | Optional (add in production) |
| `X-Client-ID`    | `<client-id>`                | Optional |

**Request Body**

```json
{
  "messages": [
    { "role": "user", "content": "How do I view my campaign analytics?" }
  ],
  "clientId": "CLIENT_123",
  "dashboardContext": {
    "activeCampaigns": 3,
    "plan": "Pro",
    "currentPage": "Analytics"
  }
}
```

| Field              | Type     | Required | Description                                              |
|--------------------|----------|----------|----------------------------------------------------------|
| `messages`         | array    | Yes      | Array of `{role, content}` objects (OpenAI format)       |
| `clientId`         | string   | No       | Brandbridge client ID for personalised responses         |
| `dashboardContext` | object   | No       | Any dashboard state to give the AI additional context    |

**Response**

```json
{
  "message": {
    "role": "assistant",
    "content": "To view your campaign analytics, navigate to the Analytics tab in the left sidebar..."
  },
  "usage": {
    "prompt_tokens": 120,
    "completion_tokens": 85,
    "total_tokens": 205
  }
}
```

---

### `POST /api/chat/stream`

Same as `/api/chat` but returns a **Server-Sent Events (SSE)** stream for real-time token-by-token rendering.

**Request Body** — identical to `/api/chat`

**Response** — `text/event-stream`

```
data: {"delta":"To view"}
data: {"delta":" your campaign"}
data: {"delta":" analytics..."}
data: [DONE]
```

Each `data` line contains a JSON object with a `delta` string. The stream ends with `data: [DONE]`.

**JavaScript example (streaming)**

```js
const res = await fetch('https://your-api-domain.com/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, clientId }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const payload = line.slice(6);
      if (payload === '[DONE]') break;
      const { delta } = JSON.parse(payload);
      process.stdout.write(delta); // or append to React state
    }
  }
}
```

---

## Error Codes

| HTTP Status | Meaning                                      |
|-------------|----------------------------------------------|
| `400`       | Bad request — `messages` array missing/empty |
| `401`       | Unauthorized — invalid or missing API key    |
| `429`       | Rate limit exceeded (OpenAI upstream)        |
| `500`       | Internal server error                        |

**Error response format**

```json
{
  "error": "messages array is required"
}
```

---

## Authentication (Production)

In production, protect the API with a bearer token. Add this middleware to `server.js`:

```js
app.use((req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

Set `API_SECRET` in your environment variables and pass it from the widget:

```html
<script
  src="https://your-domain.com/widget.js"
  data-api-url="https://your-api-domain.com/api/chat"
  data-api-key="your-secret-key"
></script>
```

---

## CORS

The server is configured to accept requests from any origin (`*`). For production, restrict this to your Lovable domain:

```js
app.use(cors({ origin: 'https://your-lovable-app.lovable.app' }));
```
