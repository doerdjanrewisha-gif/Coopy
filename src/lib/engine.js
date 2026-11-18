// Coopy's brain. Chat, voice and the scanner all call respond().
// parseLocal() turns text into an intent (demo mode). When live AI is on,
// the server returns the same intent shape, so results are identical in
// structure and every number still comes from the catalogue.
import { PRODUCTS, RECIPES, productById, recipeById, aisleLabel } from './catalog.js';
import { computeMeal, nok, nokSpoken, formatAmount } from './meal.js';

export const initialConvo = () => ({
  people: null,
  budget: null,
  time: null,
  diet: null, // 'vegetarian' | 'vegan' | 'pescetarian' | null
  have: [],
  exclude: [],
  askedFollowUp: false,
  lastProduct: null,
  lastMeals: [],
});

const FISH = new Set(['salmon', 'cod', 'fish-cakes']);
const POPULAR = ['chickpea-curry', 'tomato-mozzarella-pasta', 'shakshuka', 'noodle-stir-fry', 'salmon-potatoes', 'taco-friday', 'fish-cakes', 'bean-chili'];
const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };

// ---------- text helpers ----------
const norm = (t) =>
  ` ${t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9æøå'\-,. ]/g, ' ').replace(/\s+/g, ' ')} `;

const KEYWORDS = PRODUCTS.flatMap((p) => [p.name.toLowerCase(), ...p.keywords].map((k) => ({ k: k.toLowerCase(), id: p.id })))
  .sort((a, b) => b.k.length - a.k.length);

// Finds products mentioned in a piece of text (longest keyword first).
export function findProducts(text) {
  let t = norm(text);
  const found = [];
  for (const { k, id } of KEYWORDS) {
    const re = new RegExp(`(^|[^a-zæøå])${escapeRe(k)}(?=[^a-zæøå]|$)`);
    if (re.test(t)) {
      if (!found.includes(id)) found.push(id);
      t = t.replace(new RegExp(escapeRe(k), 'g'), ' ');
    }
  }
  return found;
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function num(w) {
  if (!w) return null;
  if (/^\d+$/.test(w)) return parseInt(w, 10);
  return WORDNUM[w] ?? null;
}
const NUMW = '(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)';

function parsePeople(t) {
  let m;
  if (/\b(just me|only me|myself|for one|alone|by myself|single portion)\b/.test(t)) return 1;
  if ((m = t.match(new RegExp(`family of ${NUMW}`)))) return num(m[1]);
  if ((m = t.match(new RegExp(`\\b(we are|we're|were|there are|there's|cooking for|dinner for|meal for) ${NUMW}\\b(?! ?(min|minute|minutes|kr|nok|kroner|hour))`)))) return num(m[2]);
  if ((m = t.match(new RegExp(`\\b${NUMW} (people|persons|person|of us|adults|guests|servings|portions|pax)\\b`)))) return num(m[1]);
  if ((m = t.match(new RegExp(`\\bfor ${NUMW}\\b(?! ?(min|minute|minutes|kr|nok|kroner|hour))`)))) return num(m[1]);
  if (/\b(couple|my partner|my wife|my husband|girlfriend|boyfriend|date night|the two of us|both of us)\b/.test(t)) return 2;
  if (/\bfamily\b/.test(t)) return 4;
  return null;
}
function parseBudget(t) {
  let m;
  if ((m = t.match(/\b(under|below|less than|max|maximum|budget(?: of| is)?|up to|within|no more than|around|about)\s*(nok|kr)?\s*(\d{2,4})\b(?! ?(min|minute|minutes|people|persons))/))) return +m[3];
  if ((m = t.match(/\b(\d{2,4})\s*(nok|kr|kroner|crowns)\b/))) return +m[1];
  if ((m = t.match(/\b(nok|kr)\s*(\d{2,4})\b/))) return +m[2];
  return null;
}
function parseTime(t) {
  let m;
  if ((m = t.match(/\b(\d{1,3})\s*(min|mins|minutes|minute|m)\b/))) return +m[1];
  if (/\bhalf an hour\b/.test(t)) return 30;
  if (/\b(an|one) hour\b/.test(t)) return 60;
  if (/\b(\d) hours?\b/.test(t)) return 60 * +t.match(/\b(\d) hours?\b/)[1];
  return null;
}
function parseDiet(t) {
  if (/\b(vegan|plant[- ]based|no animal|dairy[- ]free and)\b/.test(t)) return 'vegan';
  if (/\b(vegetarian|veggie|veg\b|meat[- ]?free|no meat|without meat|meatless)\b/.test(t)) return 'vegetarian';
  if (/\b(pescetarian|pescatarian)\b/.test(t)) return 'pescetarian';
  if (/\b(meat is fine|with meat|not vegetarian|any diet|anything)\b/.test(t)) return 'none';
  return null;
}

// ---------- intent parsing (demo mode) ----------
export function parseLocal(text, convo) {
  const t = norm(text);
  const out = { intent: 'unknown', people: null, budget: null, time: null, diet: null, haveAdd: [], haveRemove: [], excludeAdd: [], productId: null, mealId: null, reply: null };

  out.people = parsePeople(t);
  out.budget = parseBudget(t);
  out.time = parseTime(t);
  out.diet = parseDiet(t);

  // "I already have rice and onions"
  const haveM = t.match(/\b(i already have|already have|i have|i've got|ive got|i got|we have|we've got|got some|there is|there's)\b(.*)/);
  if (haveM && !/\b(i have (\d+|one|two|three|four|five|six) (min|minutes|people)|i have (a )?budget|i have (only )?\d+ ?(kr|nok))\b/.test(t)) {
    const seg = haveM[2].split(/\b(but|and need|need|want|for dinner|what|where)\b/)[0];
    out.haveAdd = findProducts(seg);
  }
  const notHaveM = t.match(/\b(i don't have|i dont have|i do not have|out of|ran out of)\b(.*)/);
  if (notHaveM) out.haveRemove = findProducts(notHaveM[2]);
  const exM = t.match(/\b(no|without|not|don't like|dont like|hate|allergic to|skip|avoid)\b(.*)/);
  if (exM && !/\b(no meat|without meat|not vegetarian|no more than)\b/.test(t)) {
    out.excludeAdd = findProducts(exM[2].split(/\b(but|and i|please)\b/)[0]).filter((id) => !out.haveAdd.includes(id));
  }
  const mentioned = findProducts(text);

  if (/\bclear exclusions\b/.test(t)) return { ...out, intent: 'recommend', clearExclude: true };
  if (/\b(start over|reset|new search|clear (the )?chat|forget (it|that))\b/.test(t)) return { ...out, intent: 'reset' };
  if (/\b(where|which aisle|what aisle|aisle for|aisle is|location of|find (the |some )?|looking for|where's|wheres)\b/.test(t) && !/\b(recipe|cook|make|dinner|meal)\b/.test(t)) {
    return { ...out, intent: 'find_product', productId: mentioned[0] || (/\b(it|them|this|that)\b/.test(t) ? convo.lastProduct : null) };
  }
  if (/\b(how much|price|cost of|what does .* cost|is .* in stock|in stock)\b/.test(t) && mentioned.length) {
    return { ...out, intent: 'find_product', productId: mentioned[0] };
  }
  if (/\b(cook|make|use|recipes?|meals?|dinner|ideas?)\b.*\b(with|using|from)\b/.test(t) || /\b(use (it|them|this|that))\b/.test(t)) {
    const pid = mentioned.find((id) => !out.haveAdd.includes(id)) || (/\b(it|them|this|that|these)\b/.test(t) ? convo.lastProduct : null) || out.haveAdd[0];
    if (pid && !/\balready have\b/.test(t)) return { ...out, intent: 'cook_with', productId: pid };
  }
  if (out.haveAdd.length && /\b(what can i (cook|make)|what should i (cook|make)|ideas?|recipes?)\b/.test(t) && !/\balready have\b/.test(t)) {
    return { ...out, intent: 'cook_with', productId: out.haveAdd[0] };
  }
  if (/\b(shopping list|my list|show (me )?the list)\b/.test(t)) return { ...out, intent: 'show_list' };
  if (/\b(cheaper|less expensive|lower price|save money|too expensive|tighter budget)\b/.test(t)) return { ...out, intent: 'cheaper' };
  if (/\b(faster|quicker|less time|shorter|in a hurry|no time)\b/.test(t) && out.time == null) return { ...out, intent: 'faster' };

  // pick a shown meal by name or position
  const ord = t.match(/\b(first|second|third|1st|2nd|3rd|number (1|2|3)|option (1|2|3))\b/);
  if (ord && convo.lastMeals.length && /\b(show|open|take|choose|pick|go with|want|select|that|one)\b/.test(t)) {
    const idx = { first: 0, '1st': 0, second: 1, '2nd': 1, third: 2, '3rd': 2 }[ord[1]] ?? (parseInt(ord[2] || ord[3], 10) - 1);
    const id = convo.lastMeals[idx];
    if (id) return { ...out, intent: 'open_meal', mealId: id };
  }
  const named = RECIPES.find((r) => mealNameHit(r, t));
  if (named && /\b(show|open|choose|pick|go with|want|select|let's do|lets do|recipe for|how do i make|cook the|make the)\b/.test(t)) {
    return { ...out, intent: 'open_meal', mealId: named.id };
  }

  const hasConstraint = out.people || out.budget || out.time || out.diet || out.haveAdd.length || out.excludeAdd.length || out.haveRemove.length;
  if (hasConstraint || /\b(dinner|meal|cook|eat|recipe|idea|ideas|hungry|suggest|tonight|lunch|food|make|surprise me|inspiration|what should|what can)\b/.test(t)) {
    return { ...out, intent: 'recommend', surprise: /\bsurprise me\b/.test(t) };
  }
  if (/^\s*(hi|hello|hey|hei|hallo|good (morning|evening|afternoon)|yo)\b/.test(t)) return { ...out, intent: 'greet' };
  if (/\b(thanks|thank you|takk|great|perfect|awesome|cool)\b/.test(t)) return { ...out, intent: 'thanks' };
  if (mentioned.length) return { ...out, intent: 'find_product', productId: mentioned[0] };
  return out;
}

function mealNameHit(r, t) {
  const keys = {
    'chickpea-curry': ['curry', 'chickpea curry'],
    'tomato-mozzarella-pasta': ['pasta', 'mozzarella pasta', 'tomato pasta'],
    shakshuka: ['shakshuka'],
    'noodle-stir-fry': ['stir-fry', 'stir fry', 'noodles', 'wok'],
    'salmon-potatoes': ['salmon'],
    'taco-friday': ['taco', 'tacos'],
    'bean-chili': ['chili', 'chilli'],
    'fish-cakes': ['fish cakes', 'fiskekaker'],
  }[r.id] || [];
  return keys.some((k) => t.includes(` ${k}`));
}

// ---------- planning ----------
const FAMILY = [['jasmine-rice', 'quick-rice'], ['penne', 'spaghetti'], ['egg-noodles', 'rice-noodles'], ['spinach', 'frozen-spinach']];
function sameFamily(a, b) {
  return a === b || FAMILY.some((f) => f.includes(a) && f.includes(b));
}

function allowedByDiet(product, diet) {
  if (!diet || diet === 'none') return true;
  if (diet === 'vegan') return product.vegan;
  if (diet === 'vegetarian') return product.veg;
  if (diet === 'pescetarian') return product.veg || FISH.has(product.id);
  return true;
}

// Builds a meal config that respects the conversation, or null if impossible.
export function planFor(recipe, c, servingsOverride) {
  const servings = servingsOverride ?? c.people ?? recipe.baseServings ?? 2;
  const have = [];
  const swaps = {};
  const notes = [];
  for (const ing of recipe.ingredients) {
    const options = [ing.product, ...ing.swaps];
    if (c.have.some((h) => options.some((o) => sameFamily(o, h)))) have.push(ing.product);
    let chosen = ing.product;
    const ok = (id) => allowedByDiet(productById[id], c.diet) && !c.exclude.includes(id);
    if (!ok(chosen)) {
      const alt = ing.swaps.find(ok);
      if (!alt) return null;
      swaps[ing.product] = alt;
      notes.push(`${productById[ing.product].name.toLowerCase()} → ${productById[alt].name.toLowerCase()}`);
      chosen = alt;
    }
  }
  const config = { servings, have, swaps };
  const meal = computeMeal(recipe, config);
  return { recipe, config, meal, notes };
}

function fits(p, c) {
  return (c.time == null || p.recipe.minutes <= c.time) && (c.budget == null || p.meal.total <= c.budget + 1e-9);
}

export function recommend(c, sort) {
  const plans = RECIPES.map((r) => planFor(r, c)).filter(Boolean);
  const ok = plans.filter((p) => fits(p, c));
  if (sort === 'price') ok.sort((a, b) => a.meal.total - b.meal.total);
  else if (sort === 'time') ok.sort((a, b) => a.recipe.minutes - b.recipe.minutes || a.meal.total - b.meal.total);
  else ok.sort((a, b) => POPULAR.indexOf(a.recipe.id) - POPULAR.indexOf(b.recipe.id));
  return { matches: ok.slice(0, 3), plans };
}

// When nothing fits: say which single change would help.
function suggestRelax(c, plans) {
  const tips = [];
  const byTime = plans.filter((p) => c.time == null || p.recipe.minutes <= c.time);
  const byBudget = plans.filter((p) => c.budget == null || p.meal.total <= c.budget);
  if (c.budget != null && byTime.length) {
    const cheapest = byTime.reduce((a, b) => (a.meal.total < b.meal.total ? a : b));
    const need = Math.ceil(cheapest.meal.total / 10) * 10;
    tips.push({ text: `raise your budget to ${need} kr (cheapest option: ${cheapest.recipe.name}, ${nok(cheapest.meal.total)})`, chip: `Budget ${need} kr`, patch: { budget: need } });
  }
  if (c.time != null && byBudget.length) {
    const fastest = byBudget.reduce((a, b) => (a.recipe.minutes < b.recipe.minutes ? a : b));
    tips.push({ text: `allow ${fastest.recipe.minutes} minutes (${fastest.recipe.name})`, chip: `Allow ${fastest.recipe.minutes} min`, patch: { time: fastest.recipe.minutes } });
  }
  if (!tips.length && plans.length && (c.budget != null || c.time != null)) {
    const best = plans.reduce((a, b) => (a.meal.total < b.meal.total ? a : b));
    const need = Math.ceil(best.meal.total / 10) * 10;
    tips.push({ text: `allow ${need} kr and ${best.recipe.minutes} minutes (${best.recipe.name})`, chip: `${need} kr, ${best.recipe.minutes} minutes`, patch: { budget: need, time: best.recipe.minutes } });
  }
  if (c.diet && c.diet !== 'none') tips.push({ text: `drop the ${c.diet} filter`, chip: 'Any diet', patch: { diet: 'none' } });
  if (c.people && c.people > 2) tips.push({ text: `cook for fewer people`, chip: 'For 2 people', patch: { people: 2 } });
  if (c.exclude.length) tips.push({ text: `allow ${c.exclude.map((id) => productById[id].name.toLowerCase()).join(', ')} again`, chip: 'Clear exclusions', patch: { clearExclude: true } });
  return tips.slice(0, 3);
}

function describe(c) {
  const parts = [];
  const people = c.people ?? 2;
  parts.push(`for ${people === 1 ? 'one' : people}`);
  if (c.budget != null) parts.push(`under ${c.budget} kr`);
  if (c.time != null) parts.push(`in ${c.time} minutes or less`);
  if (c.diet && c.diet !== 'none') parts.push(c.diet);
  return parts.join(', ');
}

function applyPatch(c, p) {
  const n = { ...c, have: [...c.have], exclude: [...c.exclude] };
  if (p.people) n.people = clamp(p.people, 1, 10);
  if (p.budget) n.budget = p.budget;
  if (p.time) n.time = p.time;
  if (p.diet) n.diet = p.diet === 'none' ? null : p.diet;
  for (const id of p.haveAdd || []) if (!n.have.includes(id)) n.have.push(id);
  for (const id of p.haveRemove || []) n.have = n.have.filter((h) => !sameFamily(h, id));
  for (const id of p.excludeAdd || []) if (!n.exclude.includes(id)) n.exclude.push(id);
  if (p.clearExclude) n.exclude = [];
  return n;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const REFINE_CHIPS = (c) => {
  const chips = [];
  if (c.diet !== 'vegetarian' && c.diet !== 'vegan') chips.push('Make it vegetarian');
  if (!c.have.some((h) => sameFamily(h, 'jasmine-rice'))) chips.push('I already have rice');
  chips.push('Cheaper');
  chips.push(c.people === 4 ? 'For 2 people' : 'For 4 people');
  return chips;
};

// ---------- respond ----------
// Returns { convo, reply } where reply = { text, speak, meals, product, chips, action }
export function respond(parsed, convoIn) {
  let c = { ...initialConvo(), ...convoIn };
  const r = (text, extra = {}) => ({ convo: c, reply: { text, speak: extra.speak ?? stripMd(text), meals: [], product: null, chips: [], ...extra } });

  switch (parsed.intent) {
    case 'reset':
      c = initialConvo();
      return r('Fresh start! Tell me how many people, your budget and how much time you have.', { chips: ['Dinner for two under 150 NOK in 20 minutes', 'Something vegetarian', 'Where can I find chickpeas?'] });

    case 'greet':
      return r("Hi! I'm Coopy, your dinner helper in this store. Tell me how many people are eating, your budget and your time, and I'll find meals and show you where everything is.", {
        chips: ['Dinner for two under 150 NOK in 20 minutes', 'Where can I find chickpeas?', 'Something vegetarian'],
      });

    case 'thanks':
      return r('You are welcome! Enjoy your dinner. Tap "Find ingredients in store" when you are ready to shop.', { chips: ['Show my shopping list'] });

    case 'show_list':
      return r('Opening your shopping list.', { action: { type: 'navigate', to: '/list' } });

    case 'open_meal': {
      const recipe = recipeById[parsed.mealId];
      if (!recipe) break;
      const plan = planFor(recipe, c);
      return r(`Good choice! Opening ${recipe.name}.`, { action: { type: 'open_meal', mealId: recipe.id, config: plan?.config } });
    }

    case 'find_product': {
      const p = productById[parsed.productId];
      if (!p) {
        return r("I couldn't find that in this demo store's catalogue. Try chickpeas, rice, salmon, pasta or eggs.", { chips: ['Where can I find chickpeas?', 'Where is the rice?'] });
      }
      c = { ...c, lastProduct: p.id };
      const stock = p.stock === 'low' ? 'Only a few left today.' : 'In stock today.';
      const text = `**${p.name.split(',')[0]}** are in **${aisleLabel(p)}**. Price: ${nok(p.price)} for ${/^\d/.test(p.packLabel) && !/×/.test(p.packLabel) ? 'a ' : ''}${p.packLabel}. ${stock}`.replace(/\*\*(.+?)\*\* are/, (m, n) => (/(s|es)$/.test(n.split(',')[0]) ? m : `**${n}** is`));
      return r(text, {
        speak: `${p.name.split(',')[0]}: ${aisleLabel(p).replace(/·/g, ',')}. ${p.packLabel} costs ${nokSpoken(p.price)}.`,
        product: p.id,
        chips: [`What can I cook with ${shortName(p)}?`, 'Dinner for two under 150 NOK in 20 minutes'],
      });
    }

    case 'cook_with': {
      const p = productById[parsed.productId];
      if (!p) break;
      c = applyPatch({ ...c, lastProduct: p.id }, parsed);
      const plans = RECIPES.filter((rc) => rc.ingredients.some((i) => i.product === p.id || i.swaps.includes(p.id) || sameFamily(i.product, p.id)))
        .map((rc) => {
          const owned = (parsed.haveAdd || []).includes(p.id);
          const base = owned ? c : { ...c, have: c.have.filter((h) => !sameFamily(h, p.id)) };
          const plan = planFor(rc, base);
          if (!plan) return null;
          const slot = rc.ingredients.find((i) => i.swaps.includes(p.id) && i.product !== p.id);
          if (slot && !rc.ingredients.some((i) => i.product === p.id)) {
            plan.config = { ...plan.config, swaps: { ...plan.config.swaps, [slot.product]: p.id } };
            plan.meal = computeMeal(rc, plan.config);
          }
          return plan;
        })
        .filter(Boolean)
        .sort((a, b) => POPULAR.indexOf(a.recipe.id) - POPULAR.indexOf(b.recipe.id))
        .slice(0, 3);
      if (!plans.length) return r(`I don't have a recipe with ${shortName(p)} in this demo yet. Want some other dinner ideas?`, { chips: ['Dinner for two under 150 NOK in 20 minutes'] });
      c = { ...c, lastMeals: plans.map((x) => x.recipe.id) };
      const first = plans[0];
      return r(`Here ${plans.length === 1 ? 'is a meal' : `are ${plans.length} meals`} with **${shortName(p)}** (${aisleLabel(p)}):`, {
        speak: `You can make ${listNames(plans)}. The ${first.recipe.name} takes ${first.recipe.minutes} minutes and costs about ${nokSpoken(first.meal.total)} for ${first.config.servings}.`,
        meals: plans.map(toCard),
        chips: REFINE_CHIPS(c).slice(0, 3),
      });
    }

    case 'cheaper': {
      const top = c.lastMeals.length ? planFor(recipeById[c.lastMeals[0]], c)?.meal.total : null;
      const budget = top ? Math.floor(top - 1) : Math.round((c.budget ?? 150) * 0.8);
      c = applyPatch(c, { budget });
      return recommendReply(c, r, `Cheaper it is: under ${budget} kr.`, 'price');
    }

    case 'faster': {
      const cur = c.lastMeals.length ? Math.min(...c.lastMeals.map((id) => recipeById[id].minutes)) : null;
      const time = cur ? cur - 5 : 20;
      c = applyPatch(c, { time });
      return recommendReply(c, r, `Let's go faster: ${time} minutes or less.`, 'time');
    }

    case 'recommend': {
      c = applyPatch(c, parsed);
      const nothingNew = !parsed.clearExclude && !parsed.people && !parsed.budget && !parsed.time && !parsed.diet && !(parsed.haveAdd || []).length && !(parsed.excludeAdd || []).length;
      if (!c.people && !c.budget && !c.time && !c.diet && nothingNew && !c.askedFollowUp && !parsed.surprise) {
        c = { ...c, askedFollowUp: true };
        return r('Happy to help! Quick question: how many people are eating, and what is your budget and time?', {
          chips: ['2 people · 150 kr · 20 min', 'Just me, under 100 kr', 'Family of 4, 45 minutes', 'Surprise me'],
        });
      }
      const intro = [];
      if ((parsed.haveAdd || []).length) intro.push(`Got it, you already have ${parsed.haveAdd.map((id) => shortName(productById[id])).join(' and ')}. I've taken ${parsed.haveAdd.length > 1 ? 'them' : 'it'} off the shopping total.`);
      if (parsed.diet === 'vegetarian' || parsed.diet === 'vegan') intro.push(`Sure, ${parsed.diet} it is.`);
      return recommendReply(c, r, intro.join(' '));
    }

    case 'general':
      if (parsed.reply) return r(parsed.reply, { chips: ['Dinner for two under 150 NOK in 20 minutes', 'Where can I find chickpeas?'] });
      break;
    default:
      break;
  }
  return r("Sorry, I didn't quite get that. You can ask me for dinner ideas, like \"dinner for two under 150 NOK in 20 minutes\", or ask where to find a product.", {
    chips: ['Dinner for two under 150 NOK in 20 minutes', 'Where can I find chickpeas?', 'What can I cook with chickpeas?'],
  });
}

function recommendReply(c, r, intro = '', sort) {
  const { matches, plans } = recommend(c, sort);
  if (!matches.length) {
    const tips = suggestRelax(c, plans);
    const tipText = tips.length ? ` You could ${tips.map((t) => t.text).join(', or ')}.` : '';
    const res = r(`${intro ? intro + ' ' : ''}I couldn't find a meal ${describe(c)}.${tipText}`, {
      chips: tips.map((t) => t.chip).concat(['Start over']).slice(0, 4),
    });
    res.convo = { ...c, lastMeals: [] };
    return res;
  }
  c = { ...c, lastMeals: matches.map((m) => m.recipe.id) };
  const swapNotes = matches.flatMap((m) => m.notes);
  const swapText = swapNotes.length ? ` I swapped ${[...new Set(swapNotes)].slice(0, 2).join(' and ')} to match.` : '';
  const first = matches[0];
  const text = `${intro ? intro + ' ' : ''}Here ${matches.length === 1 ? 'is 1 dinner' : `are ${matches.length} dinners`} ${describe(c)}.${swapText} Prices are for the full packs you need to buy.`;
  const speak = `${intro ? intro + ' ' : ''}I found ${matches.length === 1 ? 'one idea' : `${matches.length} ideas`}. My top pick is ${first.recipe.name}: ${first.recipe.minutes} minutes, about ${nokSpoken(first.meal.total)} for ${first.config.servings}. Tap a meal to see where everything is in the store.`;
  const res = r(text, { speak, meals: matches.map(toCard), chips: REFINE_CHIPS(c) });
  res.convo = c;
  return res;
}

function toCard(p) {
  return { mealId: p.recipe.id, config: p.config, total: p.meal.total, minutes: p.recipe.minutes, servings: p.config.servings, vegetarian: p.meal.vegetarian };
}
const listNames = (plans) => {
  const n = plans.map((p) => p.recipe.name);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} or ${n[n.length - 1]}` : n[0];
};
export const shortName = (p) => p.name.split(',')[0].toLowerCase().replace(/ \(.+\)/, '');
const stripMd = (s) => s.replace(/\*\*/g, '').replace(/·/g, ',');

// Convenience for chips that carry a patch ("Budget 160 kr", "Allow 25 min").
export function chipToText(chip) {
  return chip;
}

// Text summary of the catalogue for the live-AI prompt.
export function catalogForPrompt() {
  const prods = PRODUCTS.map((p) => `${p.id} | ${p.name} | ${p.packLabel} | ${p.price} kr | aisle ${p.aisle} | ${p.keywords.join(', ')}`).join('\n');
  const recs = RECIPES.map((r) => `${r.id} | ${r.name} | ${r.minutes} min | ${r.tags.join(', ') || 'contains meat or fish'} | uses: ${r.ingredients.map((i) => i.product).join(', ')}`).join('\n');
  return `PRODUCTS (id | name | pack | price | aisle | keywords)\n${prods}\n\nRECIPES (id | name | time | diet | ingredients)\n${recs}`;
}

export { formatAmount };
