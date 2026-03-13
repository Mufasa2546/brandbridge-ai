/**
 * Brandbridge AI Chat Widget
 * Drop-in embed for any HTML page or React app.
 *
 * Usage:
 *   <script
 *     src="https://your-domain.com/widget.js"
 *     data-api-url="https://your-api.com/api/chat"
 *     data-client-id="CLIENT_123"
 *     data-theme="dark"
 *   ></script>
 */
(function () {
  'use strict';

  // ── Config from script tag attributes ─────────────────────────────────
  const scriptTag = document.currentScript ||
    document.querySelector('script[data-api-url]');

  const CONFIG = {
    apiUrl:    (scriptTag && scriptTag.getAttribute('data-api-url'))    || 'http://localhost:3001/api/chat',
    clientId:  (scriptTag && scriptTag.getAttribute('data-client-id'))  || '',
    theme:     (scriptTag && scriptTag.getAttribute('data-theme'))      || 'dark',
    title:     (scriptTag && scriptTag.getAttribute('data-title'))      || 'Brandbridge Assistant',
    placeholder:(scriptTag && scriptTag.getAttribute('data-placeholder'))|| 'Ask me anything…',
  };

  // ── Inject CSS ─────────────────────────────────────────────────────────
  const CSS = `
    #bb-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(99,102,241,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #bb-widget-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(99,102,241,0.65);
    }
    #bb-widget-btn svg { pointer-events: none; }

    #bb-widget-window {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 370px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #1e1e2e;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.45);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 99998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: opacity 0.2s ease, transform 0.2s ease;
      opacity: 0;
      transform: translateY(12px) scale(0.97);
      pointer-events: none;
    }
    #bb-widget-window.bb-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Header */
    #bb-header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #bb-header-title {
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #bb-header-title .bb-dot {
      width: 8px; height: 8px;
      background: #4ade80;
      border-radius: 50%;
      display: inline-block;
    }
    #bb-close-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    #bb-close-btn:hover { background: rgba(255,255,255,0.15); }

    /* Messages */
    #bb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    #bb-messages::-webkit-scrollbar { width: 4px; }
    #bb-messages::-webkit-scrollbar-track { background: transparent; }
    #bb-messages::-webkit-scrollbar-thumb { background: #3f3f5a; border-radius: 4px; }

    .bb-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .bb-msg.bb-user {
      background: #6366f1;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .bb-msg.bb-assistant {
      background: #2a2a3e;
      color: #e2e2f0;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .bb-msg.bb-error {
      background: #3b1f1f;
      color: #f87171;
      align-self: flex-start;
    }

    /* Typing indicator */
    .bb-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 10px 14px;
      background: #2a2a3e;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .bb-typing span {
      width: 7px; height: 7px;
      background: #6366f1;
      border-radius: 50%;
      animation: bb-bounce 1.2s infinite;
    }
    .bb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bb-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Input area */
    #bb-input-area {
      padding: 12px 14px;
      border-top: 1px solid #2e2e42;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
      background: #1e1e2e;
    }
    #bb-input {
      flex: 1;
      background: #2a2a3e;
      border: 1px solid #3f3f5a;
      border-radius: 10px;
      color: #e2e2f0;
      font-size: 14px;
      padding: 10px 12px;
      resize: none;
      outline: none;
      max-height: 100px;
      overflow-y: auto;
      font-family: inherit;
      transition: border-color 0.15s;
      line-height: 1.4;
    }
    #bb-input::placeholder { color: #6b6b8a; }
    #bb-input:focus { border-color: #6366f1; }
    #bb-send-btn {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    #bb-send-btn:hover { opacity: 0.88; transform: scale(1.05); }
    #bb-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    /* Branding footer */
    #bb-footer {
      text-align: center;
      font-size: 11px;
      color: #4a4a6a;
      padding: 6px 0 8px;
      flex-shrink: 0;
    }
    #bb-footer a { color: #6366f1; text-decoration: none; }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      #bb-widget-window {
        bottom: 0; right: 0;
        width: 100vw;
        max-width: 100vw;
        height: 100dvh;
        max-height: 100dvh;
        border-radius: 0;
      }
      #bb-widget-btn { bottom: 16px; right: 16px; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── Build DOM ──────────────────────────────────────────────────────────
  // Floating button
  const btn = document.createElement('button');
  btn.id = 'bb-widget-btn';
  btn.setAttribute('aria-label', 'Open Brandbridge chat');
  btn.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;

  // Chat window
  const win = document.createElement('div');
  win.id = 'bb-widget-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', CONFIG.title);
  win.innerHTML = `
    <div id="bb-header">
      <div id="bb-header-title">
        <span class="bb-dot"></span>
        ${CONFIG.title}
      </div>
      <button id="bb-close-btn" aria-label="Close chat">✕</button>
    </div>
    <div id="bb-messages" aria-live="polite"></div>
    <div id="bb-input-area">
      <textarea
        id="bb-input"
        rows="1"
        placeholder="${CONFIG.placeholder}"
        aria-label="Chat input"
      ></textarea>
      <button id="bb-send-btn" aria-label="Send message" disabled>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div id="bb-footer">Powered by <a href="#" tabindex="-1">Brandbridge AI</a></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  // ── State ──────────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  const history = []; // {role, content}

  const messagesEl = win.querySelector('#bb-messages');
  const inputEl    = win.querySelector('#bb-input');
  const sendBtn    = win.querySelector('#bb-send-btn');
  const closeBtn   = win.querySelector('#bb-close-btn');

  // ── Helpers ────────────────────────────────────────────────────────────
  function toggleOpen() {
    isOpen = !isOpen;
    win.classList.toggle('bb-open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      inputEl.focus();
      if (history.length === 0) addWelcome();
    }
  }

  function addWelcome() {
    appendMessage('assistant',
      'Hi there! 👋 I\'m your Brandbridge AI Assistant. How can I help you today?');
  }

  function appendMessage(role, content) {
    const el = document.createElement('div');
    el.className = `bb-msg bb-${role}`;
    el.textContent = content;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'bb-typing';
    el.id = 'bb-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('bb-typing-indicator');
    if (el) el.remove();
  }

  function setLoading(val) {
    isLoading = val;
    sendBtn.disabled = val || inputEl.value.trim() === '';
    inputEl.disabled = val;
  }

  // ── Send message ───────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;

    appendMessage('user', text);
    history.push({ role: 'user', content: text });

    setLoading(true);
    showTyping();

    try {
      const body = { messages: history };
      if (CONFIG.clientId) body.clientId = CONFIG.clientId;

      // Pass any dashboard context exposed on window
      if (window.BrandbridgeContext) body.dashboardContext = window.BrandbridgeContext;

      const res = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.message?.content || 'Sorry, I could not generate a response.';

      hideTyping();
      appendMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      hideTyping();
      appendMessage('error', `⚠️ ${err.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Event listeners ────────────────────────────────────────────────────
  btn.addEventListener('click', toggleOpen);
  closeBtn.addEventListener('click', toggleOpen);

  inputEl.addEventListener('input', function () {
    sendBtn.disabled = this.value.trim() === '' || isLoading;
    // Auto-resize textarea
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (isOpen && !win.contains(e.target) && e.target !== btn) {
      toggleOpen();
    }
  });

  // ── Public API (window.BrandbridgeWidget) ──────────────────────────────
  window.BrandbridgeWidget = {
    open:  () => { if (!isOpen) toggleOpen(); },
    close: () => { if (isOpen)  toggleOpen(); },
    setClientId: (id) => { CONFIG.clientId = id; },
    setContext:  (ctx) => { window.BrandbridgeContext = ctx; },
    clearHistory: () => { history.length = 0; messagesEl.innerHTML = ''; },
  };

  console.log('[Brandbridge Widget] Loaded ✓');
})();
