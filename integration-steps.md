# Brandbridge AI Agent — End-to-End Integration Steps

This document summarises every step required to go from zero to a fully working AI assistant on your Lovable-built Brandbridge website.

---

## Step 1 — Deploy the API Server

The AI backend must be running before the widget can function.

### 1.1 Install dependencies

```bash
cd brandbridge-ai-integration
npm install
```

### 1.2 Set environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...          # Your OpenAI API key
PORT=3001                       # Server port (default 3001)
API_SECRET=your-secret-token   # Optional: protect the API
```

### 1.3 Start the server

```bash
node server.js
```

You should see:
```
✅ Brandbridge AI Agent running on http://localhost:3001
   POST http://localhost:3001/api/chat
   POST http://localhost:3001/api/chat/stream
```

### 1.4 Deploy to production

Recommended platforms (all support Node.js with free tiers):

| Platform   | Deploy command / method                        |
|------------|------------------------------------------------|
| **Railway** | Connect GitHub repo → auto-deploy              |
| **Render**  | New Web Service → set env vars → deploy        |
| **Vercel**  | `vercel deploy` (use serverless functions)     |
| **Fly.io**  | `fly launch` → `fly deploy`                    |

After deployment, note your public URL, e.g. `https://brandbridge-ai.railway.app`.

---

## Step 2 — Add the Widget to Your Lovable Website

### Option A — Script tag (no code changes needed)

Open your Lovable project → **Settings** → **Custom Code** → **Body Scripts**, and paste:

```html
<script
  src="https://your-cdn.com/widget.js"
  data-api-url="https://brandbridge-ai.railway.app/api/chat"
  data-client-id="CLIENT_123"
  data-title="Brandbridge Assistant"
></script>
```

### Option B — React component (recommended)

1. Copy `ChatWidget.jsx` into `src/components/`
2. Add `VITE_BRANDBRIDGE_API_URL=https://brandbridge-ai.railway.app/api/chat` to your `.env`
3. Import and render in `App.tsx`:

```tsx
import ChatWidget from './components/ChatWidget';

// Inside your root component:
<ChatWidget clientId="CLIENT_123" />
```

---

## Step 3 — Connect to the Brandbridge Client Dashboard

Pass live dashboard data to the AI so it gives context-aware answers.

```tsx
// In your dashboard layout component:
<ChatWidget
  clientId={user.clientId}
  dashboardContext={{
    plan: user.plan,
    activeCampaigns: campaigns.length,
    currentPage: router.pathname,
  }}
/>
```

For the script-embed version, call after login:

```js
window.BrandbridgeWidget?.setClientId(user.clientId);
window.BrandbridgeWidget?.setContext({ plan: user.plan });
```

---

## Step 4 — Verify Mobile & Desktop

| Test                          | Expected result                                      |
|-------------------------------|------------------------------------------------------|
| Desktop (>480px)              | Floating button bottom-right, 370×520px chat window  |
| Mobile (≤480px)               | Full-screen chat overlay when button tapped          |
| Keyboard (mobile)             | Chat window scrolls above keyboard                   |
| Accessibility                 | Widget is keyboard-navigable, has ARIA labels        |

---

## Step 5 — (Optional) Secure the API

Add a bearer token to prevent unauthorised usage:

1. Set `API_SECRET=your-secret` on the server
2. Uncomment the auth middleware in `server.js`
3. Pass the token from the widget via `data-api-key` attribute or the React component's `apiKey` prop

---

## File Reference

| File                        | Purpose                                              |
|-----------------------------|------------------------------------------------------|
| `server.js`                 | Express API server (deploy this)                     |
| `widget.js`                 | Self-contained embed widget (host on CDN)            |
| `ChatWidget.jsx`            | Native React component for Lovable projects          |
| `api-docs.md`               | Full API reference                                   |
| `react-integration-guide.md`| Detailed React integration guide                     |
| `integration-steps.md`      | This file — end-to-end steps                         |

---

## Quick-Start Checklist

- [ ] `OPENAI_API_KEY` set in server environment
- [ ] `node server.js` starts without errors
- [ ] Server deployed to a public URL
- [ ] Widget script tag added to Lovable site **or** `ChatWidget.jsx` imported in `App.tsx`
- [ ] `clientId` and `dashboardContext` passed from dashboard state
- [ ] Tested on mobile and desktop
- [ ] (Production) CORS restricted to your domain
- [ ] (Production) `API_SECRET` set and auth middleware enabled
