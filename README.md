# Coopy: dinner helper (student concept for Coop Norway)

A mobile-first web app built for the All Stars Consultancy case about Coop Norway.
A shopper in the store asks *"Dinner for two under 150 NOK in 20 minutes"*, picks a
meal, marks what they already have, and walks the store aisle by aisle.

> Student concept, not an official Coop product. Prices, stock and aisle locations
> are illustrative demo data for one example store.

## Features

| Screen | What it does |
| --- | --- |
| **Home** | Demo store, the "What's for dinner?" card, *Chat with Coopy*, *Call Coopy*, a one-tap suggestion. No sign-in. |
| **Chat** | Understands people, budget, time, diet, "I already have…", "no…". Asks one short follow-up if needed. Shows up to 3 meals (photo, time, servings, checkout total). Refine with "Make it vegetarian", "I already have rice", "Cheaper", "For 4 people". If nothing fits, it says which constraint to change. |
| **Call** | In-app voice conversation: mic button, listening status, live transcript, Coopy speaks back (Web Speech API). Text input when the mic is unavailable. Same engine as chat. |
| **Meal** | Recipe, steps, quantities; product, pack size, pack price and aisle for each item. Totals use **full packs**. "I already have this", servings, swaps; everything updates instantly. |
| **Aisle guide** | Shopping list grouped in walking order, store map with route, "Aisle 3 · Tinned food & beans · middle shelf, next to the beans", tick-off with items-left count. |
| **Scan & Talk** | Handheld-scanner mock-up: *Try a sample scan*, price + aisle, *Ask Coopy about this product*, meals that use it. No camera needed. |
| **Share** | Large QR code generated from the public URL, copy link, full-screen QR for the presentation, URL override for private previews, install instructions (iPhone/Android), About and the "Student concept" note, reset demo. |

The shopping list, chat and settings are saved in `localStorage`, so they survive a refresh.

## One source of truth

* `src/lib/catalog.js` holds the store, 8 aisles, about 50 products and 8 recipes. Every aisle string comes
  from `aisleLabel()` here, so chat, voice, recipe, list, guide and scanner always agree.
* `src/lib/meal.js` does the pack maths (full packs, "have it", swaps, servings, list merge).
* `src/lib/engine.js` turns a message into an intent and builds the reply. Chat, voice and the scanner all call it.

The headline example: **Chickpea & spinach coconut curry**, vegetarian (vegan), 20 min, for 2 =
**141,20 kr** in full packs (113,30 kr if you already have rice).

## Live AI (optional)

`api/coopy.js` is a Vercel serverless function. If `ANTHROPIC_API_KEY` is set in the
Vercel project's environment variables, Claude interprets each message into the same
structured intent the demo parser produces. The app still calculates every meal, price and aisle from the catalogue,
so answers stay grounded. The key never reaches the browser. Without a key, or if a call
fails, the app uses demo mode automatically. Optional: `COOPY_MODEL` (default `claude-opus-5-5`).

## Run locally

```bash
npm install
npm run dev            # http://localhost:5173 (demo mode)
npm run build          # downloads meal photos, then builds to dist/
npm run build:offline  # build without downloading photos
```

## Publish on Vercel

1. Import this repository in Vercel (framework: Vite; `vercel.json` sets the build).
2. Optional: add `ANTHROPIC_API_KEY` under *Settings → Environment Variables*.
3. Make sure *Settings → Deployment Protection* doesn't require login for the production URL.
4. Open the production URL on a phone that isn't signed in to Vercel. Then open **Share** and present the full-screen QR.

Meal photos are downloaded from Unsplash at build time. If a download fails, the app shows an
illustrated placeholder instead.
