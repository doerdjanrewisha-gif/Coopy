import { createContext, useContext, useEffect, useReducer } from 'react';
import { initialConvo } from './lib/engine.js';
import { recipeById } from './lib/catalog.js';
import { defaultConfig } from './lib/meal.js';

const KEY = 'coopy-state-v1';

const initial = () => ({
  plans: {}, // recipeId -> { servings, have: [slotIds], swaps: { slot: productId } }
  listMeals: [], // recipeIds on the shopping list
  extras: [], // [{ productId, packs }]
  checked: [], // productIds ticked off in store
  chat: [],
  convo: initialConvo(),
  useLiveAI: true,
  shareUrl: '',
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const s = JSON.parse(raw);
    return { ...initial(), ...s, convo: { ...initialConvo(), ...(s.convo || {}) } };
  } catch {
    return initial();
  }
}

function planOf(state, id) {
  return state.plans[id] || defaultConfig(recipeById[id], state.convo.people ?? undefined);
}

function reducer(state, a) {
  switch (a.type) {
    case 'setPlan':
      return { ...state, plans: { ...state.plans, [a.id]: a.config } };
    case 'ensurePlan':
      if (state.plans[a.id]) return state;
      return { ...state, plans: { ...state.plans, [a.id]: a.config || planOf(state, a.id) } };
    case 'servings': {
      const p = planOf(state, a.id);
      return { ...state, plans: { ...state.plans, [a.id]: { ...p, servings: Math.max(1, Math.min(10, a.servings)) } } };
    }
    case 'toggleHave': {
      const p = planOf(state, a.id);
      const have = p.have.includes(a.slot) ? p.have.filter((s) => s !== a.slot) : [...p.have, a.slot];
      return { ...state, plans: { ...state.plans, [a.id]: { ...p, have } } };
    }
    case 'swap': {
      const p = planOf(state, a.id);
      const swaps = { ...p.swaps };
      if (a.productId === a.slot) delete swaps[a.slot];
      else swaps[a.slot] = a.productId;
      return { ...state, plans: { ...state.plans, [a.id]: { ...p, swaps } } };
    }
    case 'addMeal':
      return {
        ...state,
        plans: state.plans[a.id] ? state.plans : { ...state.plans, [a.id]: planOf(state, a.id) },
        listMeals: state.listMeals.includes(a.id) ? state.listMeals : [...state.listMeals, a.id],
      };
    case 'removeMeal':
      return { ...state, listMeals: state.listMeals.filter((m) => m !== a.id) };
    case 'addExtra': {
      const ex = state.extras.find((e) => e.productId === a.productId);
      const extras = ex
        ? state.extras.map((e) => (e.productId === a.productId ? { ...e, packs: e.packs + 1 } : e))
        : [...state.extras, { productId: a.productId, packs: 1 }];
      return { ...state, extras };
    }
    case 'removeExtra':
      return { ...state, extras: state.extras.filter((e) => e.productId !== a.productId) };
    case 'toggleChecked':
      return {
        ...state,
        checked: state.checked.includes(a.productId) ? state.checked.filter((c) => c !== a.productId) : [...state.checked, a.productId],
      };
    case 'clearChecked':
      return { ...state, checked: [] };
    case 'clearList':
      return { ...state, listMeals: [], extras: [], checked: [] };
    case 'chat':
      return { ...state, chat: a.chat.slice(-60), convo: a.convo ?? state.convo };
    case 'convo':
      return { ...state, convo: a.convo };
    case 'resetChat':
      return { ...state, chat: [], convo: initialConvo() };
    case 'setLive':
      return { ...state, useLiveAI: a.value };
    case 'shareUrl':
      return { ...state, shareUrl: a.value };
    case 'resetAll':
      return { ...initial(), shareUrl: state.shareUrl };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage blocked: app still works for this visit */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch, planOf: (id) => planOf(state, id) }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
