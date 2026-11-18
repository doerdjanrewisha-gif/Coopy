// One entry point for chat, voice and the scanner.
// Live AI (server) only interprets the request; respond() in engine.js
// produces every meal, price and aisle from the demo catalogue.
import { parseLocal, respond } from './engine.js';

let liveStatus = null; // null = unknown, { live: bool }

export async function checkLive() {
  if (liveStatus) return liveStatus;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('/api/coopy', { signal: ctrl.signal });
    clearTimeout(t);
    const data = res.ok ? await res.json() : { live: false };
    liveStatus = { live: !!data.live };
  } catch {
    liveStatus = { live: false };
  }
  return liveStatus;
}

export async function ask(text, convo, { useLive = true, history = [] } = {}) {
  let parsed = null;
  let source = 'demo';
  if (useLive && (await checkLive()).live) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch('/api/coopy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, convo: slimConvo(convo), history: history.slice(-6) }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        if (data.parsed && data.parsed.intent) {
          parsed = data.parsed;
          source = 'live';
        }
      }
    } catch {
      /* fall back to demo mode below */
    }
  }
  if (!parsed) parsed = parseLocal(text, convo);
  const out = respond(parsed, convo);
  return { ...out, source };
}

function slimConvo(c) {
  const { people, budget, time, diet, have, exclude, lastProduct, lastMeals } = c;
  return { people, budget, time, diet, have, exclude, lastProduct, lastMeals };
}
