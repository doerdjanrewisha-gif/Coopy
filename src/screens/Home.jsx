import { useState } from 'react';
import { useStore } from '../store.jsx';
import { STORE, RECIPES } from '../lib/catalog.js';
import { computeMeal, buildList, nok } from '../lib/meal.js';
import { Icon, MealImage, navigate, DemoNote } from '../components/ui.jsx';
import { unlockSpeech } from '../lib/speech.js';

export const QUICK = 'Dinner for two under 150 NOK in 20 minutes';

export default function Home() {
  const { state, planOf } = useStore();
  const [storeSheet, setStoreSheet] = useState(false);
  const h = new Date().getHours();
  const greet = h < 10 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const list = buildList(state.plans, state.listMeals, state.extras);
  const left = list.items.filter((i) => !state.checked.includes(i.product.id)).length;
  const popular = ['chickpea-curry', 'salmon-potatoes', 'taco-friday', 'noodle-stir-fry'].map((id) => RECIPES.find((r) => r.id === id));

  return (
    <div className="home">
      <header className="home-head">
        <div className="brand-row">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">c</span>
            <span className="brand-name">Coopy</span>
          </div>
          <button className="store-pill" onClick={() => setStoreSheet(true)}>
            <Icon name="pin" size={16} />
            <span>{STORE.name}</span>
            <Icon name="down" size={16} />
          </button>
        </div>
        <p className="hello">{greet}! <span>No sign-in needed. Just start.</span></p>
      </header>

      <section className="dinner-card">
        <div className="dinner-photo">
          <MealImage recipe={RECIPES[0]} />
        </div>
        <div className="dinner-body">
          <p className="eyebrow"><Icon name="sparkle" size={16} /> Coopy · your dinner helper</p>
          <h2>What's for dinner?</h2>
          <p className="lead">Tell Coopy who's eating, your budget and your time. Get meal ideas and the exact aisle for every item in {STORE.name}.</p>
          <div className="dinner-actions">
            <button className="btn btn-white" onClick={() => navigate('/chat')}>
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
        <span className="quick-icon">⚡</span>
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

      <section className="section">
        <div className="section-head">
          <h3>Popular tonight in this store</h3>
        </div>
        <div className="hscroll">
          {popular.map((r) => {
            const m = computeMeal(r, planOf(r.id));
            return (
              <button key={r.id} className="mini-meal" onClick={() => navigate(`/meal/${r.id}`)}>
                <MealImage recipe={r} />
                <div className="mini-meal-body">
                  <strong>{r.name}</strong>
                  <span>{r.minutes} min · {m.config.servings} people · {nok(m.total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <button className="scan-promo" onClick={() => navigate('/scan')}>
        <div className="scan-promo-icon"><Icon name="barcode" size={28} /></div>
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
