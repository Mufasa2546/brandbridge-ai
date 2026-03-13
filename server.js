/**
 * Brandbridge AI Agent — API Server
 * POST /api/chat  — Chat with the AI assistant
 * POST /api/chat/stream — Streaming chat responses
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(express.static(__dirname));
const PORT = process.env.PORT || 3001;

// ── OpenAI client (uses OPENAI_API_KEY env var automatically) ──────────────
const openai = new OpenAI();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',                          // tighten to your domain in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID'],
}));
app.use(express.json({ limit: '1mb' }));

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Brandbridge AI Assistant — a helpful, professional, and friendly AI embedded in the Brandbridge client dashboard.

Your responsibilities:
- Help clients navigate the Brandbridge dashboard and understand their data
- Answer questions about campaigns, analytics, brand performance, and reports
- Guide users through features such as creating campaigns, viewing metrics, and managing brand assets
- Provide concise, actionable advice tailored to the client's context when provided
- Always maintain a professional yet approachable tone

When a client ID or dashboard context is provided in the system message, personalise your responses accordingly.
If you don't know something specific to the client's account, say so clearly and suggest they contact support.`;

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'brandbridge-ai-agent', timestamp: new Date().toISOString() });
});

// ── POST /api/chat  (standard JSON response) ──────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, clientId, dashboardContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Build context-aware system message
    let systemContent = SYSTEM_PROMPT;
    if (clientId) systemContent += `\n\nCurrent Client ID: ${clientId}`;
    if (dashboardContext) {
      systemContent += `\n\nDashboard Context:\n${JSON.stringify(dashboardContext, null, 2)}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message;

    res.json({
      message: reply,
      usage: completion.usage,
    });
  } catch (err) {
    console.error('[/api/chat] Error:', err.message);
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/chat/stream  (Server-Sent Events streaming) ─────────────────
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, clientId, dashboardContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    let systemContent = SYSTEM_PROMPT;
    if (clientId) systemContent += `\n\nCurrent Client ID: ${clientId}`;
    if (dashboardContext) {
      systemContent += `\n\nDashboard Context:\n${JSON.stringify(dashboardContext, null, 2)}`;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[/api/chat/stream] Error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Brandbridge AI Agent running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/chat`);
  console.log(`   POST http://localhost:${PORT}/api/chat/stream`);
});

module.exports = app;
