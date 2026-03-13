# Brandbridge AI Agent — React Integration Guide

This guide covers every method for integrating the Brandbridge AI Agent into a **Lovable-built React** website, from a simple script embed to a full native React component with dashboard context.

---

## Method 1 — Script Embed (Quickest)

The fastest way to add the widget to any Lovable project is to drop a single `<script>` tag into your `index.html`.

### Step 1 — Host `widget.js`

Upload `widget.js` to your CDN, Vercel static assets, or any public URL.

### Step 2 — Add to `index.html`

In your Lovable project, open `index.html` (found at the project root) and add the script tag just before `</body>`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>...</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>

    <!-- Brandbridge AI Widget -->
    <script
      src="https://your-cdn.com/widget.js"
      data-api-url="https://your-api-domain.com/api/chat"
      data-client-id="CLIENT_123"
      data-title="Brandbridge Assistant"
    ></script>
  </body>
</html>
```

**Widget script attributes**

| Attribute          | Description                                      | Default                        |
|--------------------|--------------------------------------------------|--------------------------------|
| `data-api-url`     | Your deployed API endpoint                       | `http://localhost:3001/api/chat` |
| `data-client-id`   | Brandbridge client ID for personalisation        | _(empty)_                      |
| `data-title`       | Chat window header title                         | `Brandbridge Assistant`        |
| `data-placeholder` | Input placeholder text                           | `Ask me anything…`             |

That's it — the widget will appear in the bottom-right corner on every page.

---

## Method 2 — React Component (Recommended for Lovable)

Use the included `ChatWidget.jsx` for full React integration with props and state.

### Step 1 — Copy the component

Copy `ChatWidget.jsx` into your Lovable project, e.g.:

```
src/
  components/
    ChatWidget.jsx
```

### Step 2 — Set the API URL

In your `.env` file (or Lovable environment settings):

```env
VITE_BRANDBRIDGE_API_URL=https://your-api-domain.com/api/chat
```

### Step 3 — Add to your app

In `src/App.tsx` (or your root layout):

```tsx
import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <>
      {/* your existing routes/pages */}
      <ChatWidget clientId="CLIENT_123" />
    </>
  );
}
```

The widget renders as a fixed overlay — it won't affect your page layout.

---

## Method 3 — useEffect Script Injection

If you cannot edit `index.html` directly, inject the script from a React component:

```tsx
import { useEffect } from 'react';

export function BrandbridgeWidgetLoader() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-cdn.com/widget.js';
    script.setAttribute('data-api-url', 'https://your-api-domain.com/api/chat');
    script.setAttribute('data-client-id', 'CLIENT_123');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
```

Add `<BrandbridgeWidgetLoader />` anywhere in your component tree.

---

## Connecting to the Brandbridge Client Dashboard

The AI agent can receive live dashboard context so it gives personalised, relevant answers.

### Option A — Props (React component)

Pass any dashboard state directly as props:

```tsx
import { useDashboard } from './hooks/useDashboard'; // your existing hook
import ChatWidget from './components/ChatWidget';

export default function DashboardLayout() {
  const { clientId, activeCampaigns, plan, currentPage } = useDashboard();

  return (
    <>
      {/* dashboard UI */}
      <ChatWidget
        clientId={clientId}
        dashboardContext={{
          activeCampaigns,
          plan,
          currentPage,
        }}
      />
    </>
  );
}
```

The `dashboardContext` object is sent with every chat request so the AI knows the user's current state.

### Option B — Global context (embed widget)

For the script-embed version, set context via the global `window.BrandbridgeContext` object:

```js
// Call this after the user logs in or navigates
window.BrandbridgeWidget?.setClientId('CLIENT_123');
window.BrandbridgeWidget?.setContext({
  activeCampaigns: 3,
  plan: 'Pro',
  currentPage: 'Analytics',
});
```

### Option C — Calling the API directly from a dashboard component

You can call the API from any React component without the widget UI:

```tsx
async function askAI(question: string, clientId: string) {
  const res = await fetch(`${import.meta.env.VITE_BRANDBRIDGE_API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: question }],
      clientId,
      dashboardContext: { currentPage: 'Reports' },
    }),
  });
  const data = await res.json();
  return data.message.content;
}
```

---

## Mobile & Desktop Responsiveness

The widget is fully responsive out of the box:

| Breakpoint       | Behaviour                                                    |
|------------------|--------------------------------------------------------------|
| **Desktop** (>480px) | Floating chat window, 370×520px, bottom-right corner     |
| **Mobile** (≤480px)  | Full-screen overlay, covers the entire viewport          |

No additional CSS is required. The widget uses `100dvh` on mobile to handle browser chrome correctly.

If you use Tailwind in your Lovable project and want to override styles, the widget's DOM IDs are:

- `#bb-widget-btn` — floating button
- `#bb-widget-window` — chat window
- `#bb-messages` — message list
- `#bb-input-area` — input row

---

## Environment Variables Summary

| Variable                    | Where to set         | Description                        |
|-----------------------------|----------------------|------------------------------------|
| `VITE_BRANDBRIDGE_API_URL`  | Lovable `.env`       | API base URL for React component   |
| `OPENAI_API_KEY`            | Server `.env`        | OpenAI key for the backend         |
| `PORT`                      | Server `.env`        | Port for the Express server        |
| `API_SECRET`                | Server `.env`        | Optional bearer token for auth     |
