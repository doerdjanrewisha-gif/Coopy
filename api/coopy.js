// Vercel serverless function: optional live AI for Coopy.
// The API key stays here, on the server (env var ANTHROPIC_API_KEY).
// Claude only interprets the shopper's request into a structured intent,
// grounded in the demo catalogue. The app then computes meals, packs,
// prices and aisles from the same catalogue, so numbers never drift.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { catalogForPrompt } from '../src/lib/engine.js';
import { productById, recipeById, STORE } from '../src/lib/catalog.js';

const MODEL = process.env.COOPY_MODEL || 'claude-opus-5-5';

const Intent = z.object({
  intent: z.enum(['recommend', 'find_product', 'cook_with', 'cheaper', 'faster', 'open_meal', 'show_list', 'reset', 'greet', 'thanks', 'general']),
  people: z.number().int().nullable(),
  budget: z.number().nullable(),
  time: z.number().int().nullable(),
  diet: z.enum(['vegetarian', 'vegan', 'pescetarian', 'none']).nullable(),
  haveAdd: z.array(z.string()),
  haveRemove: z.array(z.string()),
  excludeAdd: z.array(z.string()),
  productId: z.string().nullable(),
  mealId: z.string().nullable(),
  surprise: z.boolean(),
  reply: z.string().nullable(),
});

const SYSTEM = `You are the language-understanding layer of "Coopy", an in-store dinner assistant in a grocery app (a student concept for Coop Norway). The store is "${STORE.name}, ${STORE.area}". All data is illustrative demo data.

Your only job: turn the shopper's latest message into a structured intent. The app computes meals, prices, pack sizes and aisles itself from the catalogue below, so never invent products, prices or aisles.

Fields:
- intent: recommend (wants dinner ideas or refines them: people, budget, time, diet, "I already have X", "no X"), find_product (where is / price of / is X in stock), cook_with (what can I make with X; use productId; "them/it" = the last product in the conversation state), cheaper, faster, open_meal (wants to see one specific recipe; set mealId), show_list, reset (start over), greet, thanks, general (anything else; then write "reply").
- people, budget (NOK), time (minutes): only values stated in THIS message, else null.
- diet: only if stated in this message ("none" if they say meat is fine), else null.
- haveAdd: product ids the shopper says they already have at home. haveRemove: ids they say they do NOT have. excludeAdd: ids they don't want.
- productId / mealId: ids exactly as listed in the catalogue, or null.
- surprise: true if they want you to just pick ("surprise me", "anything").
- reply: only for intent "general": one or two short, friendly sentences in simple English. Stay on topic (cooking, this store, the app). If they ask about something not in the catalogue, say this demo store does not list it. Otherwise null.

Use only ids from this catalogue:
${catalogForPrompt()}`;

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({ live: !!client, model: client ? MODEL : null });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!client) return res.status(503).json({ error: 'Live AI is not configured' });

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const text = String(body.text || '').slice(0, 500).trim();
  if (!text) return res.status(400).json({ error: 'Missing text' });
  const convo = body.convo || {};
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  const state = `Conversation state: people=${convo.people ?? 'unknown'}, budget=${convo.budget ?? 'none'}, time=${convo.time ?? 'none'}, diet=${convo.diet ?? 'any'}, already have=[${(convo.have || []).join(', ')}], excluded=[${(convo.exclude || []).join(', ')}], last product=${convo.lastProduct ?? 'none'}, meals last shown=[${(convo.lastMeals || []).join(', ')}]`;
  const transcript = history
    .filter((m) => m && typeof m.text === 'string')
    .map((m) => `${m.role === 'user' ? 'Shopper' : 'Coopy'}: ${m.text.slice(0, 300)}`)
    .join('\n');

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(Intent) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `${state}\n\nRecent conversation:\n${transcript || '(none)'}\n\nShopper's latest message: ${text}`,
        },
      ],
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return res.status(502).json({ error: 'No usable answer' });
    }
    return res.status(200).json({ parsed: clean(response.parsed_output), source: 'live' });
  } catch (err) {
    console.error('coopy live AI error', err?.status, err?.message);
    return res.status(502).json({ error: 'Live AI unavailable' });
  }
}

// Drop anything that is not in the catalogue.
function clean(p) {
  const ids = (a) => (Array.isArray(a) ? a.filter((id) => productById[id]) : []);
  return {
    ...p,
    haveAdd: ids(p.haveAdd),
    haveRemove: ids(p.haveRemove),
    excludeAdd: ids(p.excludeAdd),
    productId: productById[p.productId] ? p.productId : null,
    mealId: recipeById[p.mealId] ? p.mealId : null,
    people: p.people && p.people > 0 && p.people <= 10 ? p.people : null,
    budget: p.budget && p.budget > 0 && p.budget < 5000 ? p.budget : null,
    time: p.time && p.time > 0 && p.time <= 240 ? p.time : null,
    diet: p.diet || null,
    reply: p.intent === 'general' ? String(p.reply || '').slice(0, 400) : null,
  };
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
