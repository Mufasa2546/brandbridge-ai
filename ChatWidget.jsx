/**
 * Brandbridge AI Chat Widget — React Component
 *
 * Drop this file into your Lovable/React project and import it anywhere.
 *
 * Usage:
 *   import ChatWidget from './ChatWidget';
 *   <ChatWidget clientId="CLIENT_123" dashboardContext={{ plan: 'Pro' }} />
 */

import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_BRANDBRIDGE_API_URL || 'http://localhost:3001/api/chat';

// ── Styles (inline for portability — move to CSS/Tailwind as preferred) ──
const styles = {
  btn: {
    position: 'fixed', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99999, transition: 'transform 0.2s',
  },
  window: (open) => ({
    position: 'fixed', bottom: 92, right: 24,
    width: 370, maxWidth: 'calc(100vw - 32px)',
    height: 520, maxHeight: 'calc(100vh - 120px)',
    background: '#1e1e2e', borderRadius: 16,
    boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    zIndex: 99998, fontFamily: 'system-ui, sans-serif',
    transition: 'opacity 0.2s, transform 0.2s',
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
    pointerEvents: open ? 'all' : 'none',
  }),
  header: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: '14px 16px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  msgUser: {
    maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
    borderBottomRightRadius: 4, fontSize: 14, lineHeight: 1.5,
    background: '#6366f1', color: '#fff', alignSelf: 'flex-end',
    wordBreak: 'break-word',
  },
  msgAssistant: {
    maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
    borderBottomLeftRadius: 4, fontSize: 14, lineHeight: 1.5,
    background: '#2a2a3e', color: '#e2e2f0', alignSelf: 'flex-start',
    wordBreak: 'break-word',
  },
  inputArea: {
    padding: '12px 14px', borderTop: '1px solid #2e2e42',
    display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
    background: '#1e1e2e',
  },
  input: {
    flex: 1, background: '#2a2a3e', border: '1px solid #3f3f5a',
    borderRadius: 10, color: '#e2e2f0', fontSize: 14,
    padding: '10px 12px', resize: 'none', outline: 'none',
    fontFamily: 'inherit', lineHeight: 1.4,
  },
  sendBtn: (disabled) => ({
    width: 38, height: 38, flexShrink: 0,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s',
  }),
};

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ ...styles.msgAssistant, display: 'flex', gap: 4, padding: '10px 14px' }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <span key={i} style={{
          width: 7, height: 7, background: '#6366f1', borderRadius: '50%',
          display: 'inline-block',
          animation: `bb-bounce 1.2s ${delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes bb-bounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ChatWidget({ clientId = '', dashboardContext = null }) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: 'Hi there! 👋 I\'m your Brandbridge AI Assistant. How can I help you today?',
        }]);
      }
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const body = { messages: newHistory };
      if (clientId) body.clientId = clientId;
      if (dashboardContext) body.dashboardContext = dashboardContext;

      const res = await fetch(API_URL, {
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
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        style={styles.btn}
        onClick={() => setOpen(o => !o)}
        aria-label="Open Brandbridge chat"
        aria-expanded={open}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* Chat window */}
      <div style={styles.window(open)} role="dialog" aria-label="Brandbridge Assistant">
        {/* Header */}
        <div style={styles.header}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            Brandbridge Assistant
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 20, padding: '2px 6px' }}
            aria-label="Close chat"
          >✕</button>
        </div>

        {/* Messages */}
        <div style={styles.messages} aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} style={msg.role === 'user' ? styles.msgUser : styles.msgAssistant}>
              {msg.content}
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            style={styles.input}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything…"
            aria-label="Chat input"
            disabled={loading}
          />
          <button
            style={styles.sendBtn(!input.trim() || loading)}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#4a4a6a', padding: '6px 0 8px' }}>
          Powered by Brandbridge AI
        </div>
      </div>
    </>
  );
}
