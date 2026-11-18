import { useState } from 'react';
import { useStore } from '../store.jsx';
import { STORE, RECIPES } from '../lib/catalog.js';
import { computeMeal, buildList, nok } from '../lib/meal.js';
import { Icon, MealImage, navigate, DemoNote, TopBar, Price } from '../components/ui.jsx';
import { unlockSpeech } from '../lib/speech.js';

export const QUICK = 'Dinner for two under 150 NOK in 20 minutes';

const TABS = [
  { id: 'tonight', label: 'Tonight', filter: () => true },
  { id: 'quick', label: 'Under 20 min', filter: (r) => r.minutes <= 20 },
  { id: 'veg', label: 'Vegetarian', filter: (r) => r.tags.includes('vegetarian') },
  { id: 'fish', label: 'Fish', filter: (r) => r.tags.includes('pescetarian') },
];

export default function Home() {
  const { state, dispatch, planOf } = useStore();
  const [storeSheet, setStoreSheet] = useState(false);
  const [tab, setTab] = useState('tonight');
  const [q, setQ] = useState('');
  const list = buildList(state.plans, state.listMeals, state.extras);
  const left = list.items.filter((i) => !state.checked.includes(i.product.id)).length;
  const meals = RECIPES.filter(TABS.find((t) => t.id === tab).filter);

  return (
    <div className="home">
      <TopBar
        title="Coopy"
        back={false}
        image="/img/header.jpg"
        right={
          <button className="icon-btn on-dark" onClick={() => setStoreSheet(true)} aria-label="Choose store">
            <Icon name="pin" />
          </button>
        }
      />

      <form
        className="searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) navigate(`/chat?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <Icon name="search" size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What are you looking for? Ask Coopy…" aria-label="Ask Coopy or search a product" enterKeyHint="search" />
      </form>

      <section className="dinner-card">
        <div className="dinner-photo">
          <MealImage recipe={RECIPES[0]} />
          <span className="flag">NEW · COOPY</span>
        </div>
        <div className="dinner-body">
          <h2>What's for dinner?</h2>
          <p className="lead">Tell Coopy who's eating, your budget and your time. Get meal ideas and the exact aisle for every item in {STORE.name}. No sign-in needed.</p>
          <div className="dinner-actions">
            <button className="btn btn-primary" onClick={() => navigate('/chat')}>
              <Icon name="chat" /> Chat with Coopy
            </button>
            <button
              className="btn btn-call"
              onClick={() => {
                unlockSpeech();
                navigate('/call');
              }}
            >
              <Icon name="phone" /> Call Coopy
            </button>
          </div>
        </div>
      </section>

      <button className="quick" onClick={() => navigate(`/chat?q=${encodeURIComponent(QUICK)}`)}>
        <span className="quick-icon"><Icon name="sparkle" size={20} /></span>
        <span className="quick-text">
          <span className="quick-label">Try this</span>
          <span className="quick-q">“{QUICK}”</span>
        </span>
        <Icon name="chevron" />
      </button>

      {list.items.length > 0 && (
        <button className="continue" onClick={() => navigate('/guide')}>
          <div className="continue-icon"><Icon name="map" /></div>
          <div className="continue-text">
            <strong>Continue shopping</strong>
            <span>{left ? `${left} of ${list.items.length} items left` : 'All items found!'} · {nok(list.total)}</span>
          </div>
          <Icon name="chevron" />
        </button>
      )}

      <nav className="cat-tabs" aria-label="Meal categories">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="tile-grid">
        {meals.map((r) => {
          const m = computeMeal(r, planOf(r.id));
          const inList = state.listMeals.includes(r.id);
          return (
            <div key={r.id} className="tile">
              <button className="tile-open" onClick={() => navigate(`/meal/${r.id}`)}>
                <div className="tile-img">
                  <MealImage recipe={r} />
                  {m.vegetarian && <span className="eco" title="Vegetarian"><Icon name="leaf" size={14} stroke={2.5} /></span>}
                  {r.minutes <= 15 && <span className="ribbon">FAST · {r.minutes} MIN</span>}
                </div>
                <strong className="tile-name">{r.name}</strong>
                <span className="tile-sub">{r.minutes} min · {m.config.servings} people</span>
                <Price value={m.total} />
                <span className="tile-unit">{nok(m.total / m.config.servings)} per serving</span>
              </button>
              <button
                className={`qty ${inList ? 'on' : ''}`}
                onClick={() => dispatch({ type: inList ? 'removeMeal' : 'addMeal', id: r.id })}
                aria-label={inList ? `Remove ${r.name} from list` : `Add ${r.name} to list`}
              >
                {inList ? '1' : <Icon name="plus" size={20} stroke={2.6} />}
              </button>
            </div>
          );
        })}
      </div>

      <button className="scan-promo" onClick={() => navigate('/scan')}>
        <div className="scan-promo-icon"><Icon name="scan" size={26} /></div>
        <div>
          <strong>Scan & Talk</strong>
          <span>Scan a product to see its price and aisle, then ask Coopy what to cook with it.</span>
        </div>
        <Icon name="chevron" />
      </button>

      <DemoNote />

      {storeSheet && (
        <div className="sheet-backdrop" onClick={() => setStoreSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <h3>Your store</h3>
            <div className="store-option selected">
              <Icon name="pin" />
              <div>
                <strong>{STORE.name}</strong>
                <span>{STORE.area} · {STORE.hours}</span>
              </div>
              <Icon name="check" />
            </div>
            <p className="muted small">This concept has one example store. Aisles, prices and stock are illustrative demo data.</p>
            <button className="btn btn-primary block" onClick={() => setStoreSheet(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
