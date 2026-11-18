// Meal maths: full packs, "I already have this", swaps, servings.
import { productById, recipeById } from './catalog.js';

export const nok = (n) => `${n.toFixed(2).replace('.', ',')} kr`;
export const nokSpoken = (n) => {
  const kr = Math.floor(n + 1e-9);
  const ore = Math.round((n - kr) * 100);
  return ore ? `${kr} kroner ${ore}` : `${kr} kroner`;
};

export function formatAmount(amount, product) {
  const u = product.unit;
  if (u === 'pc') {
    const label = pcName(product);
    return `${fraction(amount)} ${label}`;
  }
  if (amount >= 1000 && u === 'g') return `${trim(amount / 1000)} kg`;
  if (amount >= 1000 && u === 'ml') return `${trim(amount / 1000)} l`;
  return `${Math.round(amount)} ${u}`;
}
function trim(n) {
  return Number(n.toFixed(2)).toString().replace('.', ',');
}
function fraction(n) {
  const whole = Math.floor(n + 1e-9);
  const rest = n - whole;
  const map = [[0.25, '¼'], [0.5, '½'], [0.75, '¾']];
  const f = map.find(([v]) => Math.abs(v - rest) < 0.01);
  if (rest < 0.01) return String(whole);
  if (f) return whole ? `${whole}${f[1]}` : f[1];
  return trim(n);
}
function pcName(product) {
  const l = product.packLabel.toLowerCase();
  if (l.includes('bulb')) return 'bulb';
  if (l.includes('pot')) return 'pot';
  if (l.includes('head')) return 'head';
  if (l.includes('loaf')) return 'loaf';
  if (product.id === 'eggs') return 'eggs';
  if (product.id === 'tortillas') return 'wraps';
  if (product.id === 'pita') return 'pita';
  if (product.id === 'fish-cakes') return 'fish cakes';
  if (product.id === 'veg-stock') return 'cubes';
  if (product.id === 'salmon' || product.id === 'cod') return 'fillet';
  return 'pc';
}

export function defaultConfig(recipe, servings) {
  return { servings: servings ?? recipe.baseServings, have: [], swaps: {} };
}

// Returns the full line-by-line breakdown and the checkout total.
export function computeMeal(recipeOrId, config) {
  const recipe = typeof recipeOrId === 'string' ? recipeById[recipeOrId] : recipeOrId;
  const cfg = config ?? defaultConfig(recipe);
  const servings = cfg.servings;
  const have = new Set(cfg.have || []);
  const lines = recipe.ingredients.map((ing) => {
    const productId = cfg.swaps?.[ing.product] || ing.product;
    const product = productById[productId];
    const needed = ing.perServing * servings;
    const packs = Math.max(1, Math.ceil(needed / product.size - 1e-9));
    const owned = have.has(ing.product);
    return {
      key: ing.product, // original ingredient slot (stable for have/swaps)
      product,
      swapped: productId !== ing.product,
      swapOptions: [ing.product, ...ing.swaps].filter((id) => id !== productId),
      needed,
      packs,
      cost: owned ? 0 : packs * product.price,
      packCost: packs * product.price,
      have: owned,
    };
  });
  const total = round(lines.reduce((s, l) => s + l.cost, 0));
  const fullTotal = round(lines.reduce((s, l) => s + l.packCost, 0));
  const vegetarian = lines.every((l) => l.have || l.product.veg);
  const vegan = lines.every((l) => l.have || l.product.vegan);
  const toBuy = lines.filter((l) => !l.have);
  return { recipe, config: cfg, lines, total, fullTotal, saved: round(fullTotal - total), vegetarian, vegan, toBuy };
}

const round = (n) => Math.round(n * 100) / 100;

// Merge several planned meals (+ extra items) into one shopping list.
// Needs from different meals are added up before rounding to full packs.
export function buildList(plans, listMeals, extras = []) {
  const map = new Map();
  for (const rid of listMeals) {
    const recipe = recipeById[rid];
    if (!recipe) continue;
    const m = computeMeal(recipe, plans[rid] || defaultConfig(recipe));
    for (const l of m.toBuy) {
      const cur = map.get(l.product.id) || { product: l.product, needed: 0, extraPacks: 0, meals: [] };
      cur.needed += l.needed;
      cur.meals.push(recipe.name);
      map.set(l.product.id, cur);
    }
  }
  for (const e of extras) {
    const product = productById[e.productId];
    if (!product) continue;
    const cur = map.get(product.id) || { product, needed: 0, extraPacks: 0, meals: [] };
    cur.extraPacks += e.packs || 1;
    map.set(product.id, cur);
  }
  const items = [...map.values()].map((it) => {
    const packs = (it.needed ? Math.ceil(it.needed / it.product.size - 1e-9) : 0) + it.extraPacks;
    return { ...it, packs, cost: round(packs * it.product.price) };
  });
  items.sort((a, b) => a.product.aisle - b.product.aisle || a.product.name.localeCompare(b.product.name));
  const total = round(items.reduce((s, i) => s + i.cost, 0));
  return { items, total };
}
