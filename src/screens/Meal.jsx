import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { recipeById, productById, aisleLabel } from '../lib/catalog.js';
import { computeMeal, nok, formatAmount } from '../lib/meal.js';
import { Icon, MealImage, ProductThumb, navigate, DemoNote } from '../components/ui.jsx';

function buyText(packs, p) {
  if (/^1 /.test(p.packLabel)) {
    const unit = p.packLabel.slice(2);
    return `${packs} ${unit}${packs > 1 ? (unit === 'loaf' ? '' : 's') : ''}`;
  }
  return `${packs} × ${p.packLabel}`;
}

export default function Meal({ id }) {
  const { state, dispatch, planOf } = useStore();
  const recipe = recipeById[id];
  const [swapFor, setSwapFor] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (recipe) dispatch({ type: 'ensurePlan', id });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!recipe) {
    return (
      <div className="pad">
        <p>Meal not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/home')}>Go home</button>
      </div>
    );
  }

  const cfg = planOf(id);
  const meal = computeMeal(recipe, cfg);
  const inList = state.listMeals.includes(id);
  const budget = state.convo.budget;
  const toBuyCount = meal.toBuy.length;

  function flash(t) {
    setToast(t);
    setTimeout(() => setToast(''), 1800);
  }

  return (
    <div className="meal">
      <div className="meal-hero">
        <MealImage recipe={recipe} />
        <button className="icon-btn floating" onClick={() => (history.length > 1 ? history.back() : navigate('/home'))} aria-label="Back">
          <Icon name="back" />
        </button>
      </div>

      <div className="meal-main">
        <h1>{recipe.name}</h1>
        <p className="muted">{recipe.short}</p>
        <div className="tags">
          <span className="tag"><Icon name="clock" size={16} /> {recipe.minutes} min</span>
          {meal.vegetarian && <span className="tag green"><Icon name="leaf" size={16} /> {meal.vegan ? 'Vegan' : 'Vegetarian'}</span>}
          {recipe.tags.includes('gluten-free') && <span className="tag">Gluten-free</span>}
        </div>

        <div className="total-box">
          <div>
            <span className="label">Shopping total</span>
            <span className="big-price">{nok(meal.total)}</span>
            <span className="small muted">Full packs · {toBuyCount} of {meal.lines.length} items to buy</span>
          </div>
          <div className="servings" aria-label="Servings">
            <span className="label">Servings</span>
            <div className="stepper">
              <button onClick={() => dispatch({ type: 'servings', id, servings: cfg.servings - 1 })} disabled={cfg.servings <= 1} aria-label="Fewer servings"><Icon name="minus" /></button>
              <strong>{cfg.servings}</strong>
              <button onClick={() => dispatch({ type: 'servings', id, servings: cfg.servings + 1 })} disabled={cfg.servings >= 10} aria-label="More servings"><Icon name="plus" /></button>
            </div>
          </div>
        </div>
        {meal.saved > 0 && <p className="saved">You save {nok(meal.saved)} with what you already have at home.</p>}
        {budget != null && (
          <p className={`budget ${meal.total <= budget ? 'ok' : 'over'}`}>
            {meal.total <= budget ? `✓ Fits your ${budget} kr budget` : `${nok(meal.total - budget)} over your ${budget} kr budget`}
          </p>
        )}

        <h2 className="h2">Ingredients & where to find them</h2>
        <ul className="ing-list">
          {meal.lines.map((l) => (
            <li key={l.key} className={`ing ${l.have ? 'have' : ''}`}>
              <div className="ing-top">
                <ProductThumb product={l.product} />
                <div className="ing-info">
                  <strong>{l.product.name}</strong>
                  <span className="need">Recipe needs {formatAmount(l.needed, l.product)}</span>
                  <span className="buy">
                    {l.have ? 'At home · not included' : `Buy ${buyText(l.packs, l.product)} · ${nok(l.product.price)} each`}
                  </span>
                </div>
                <span className={`ing-price ${l.have ? 'struck' : ''}`}>{nok(l.packCost)}</span>
              </div>
              <div className="ing-aisle"><Icon name="pin" size={14} /> {aisleLabel(l.product)}</div>
              <div className="ing-actions">
                <label className={`have-toggle ${l.have ? 'on' : ''}`}>
                  <input type="checkbox" checked={l.have} onChange={() => dispatch({ type: 'toggleHave', id, slot: l.key })} />
                  <span className="box"><Icon name="check" size={14} stroke={3} /></span>
                  I already have this
                </label>
                {l.swapOptions.length > 0 && (
                  <button className="swap-btn" onClick={() => setSwapFor(l)}>
                    <Icon name="swap" size={16} /> Swap
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="pantry">From your cupboard (not included): {recipe.pantry.join(', ')}.</p>

        <h2 className="h2">How to cook it</h2>
        <ol className="steps">
          {recipe.steps.map((s, i) => (
            <li key={i}><span className="step-n">{i + 1}</span><p>{s}</p></li>
          ))}
        </ol>
        <DemoNote />
      </div>

      <div className="cta-bar">
        <button
          className="btn btn-secondary"
          aria-label={inList ? 'Remove from shopping list' : 'Add to shopping list'}
          onClick={() => {
            if (inList) {
              dispatch({ type: 'removeMeal', id });
              flash('Removed from your list');
            } else {
              dispatch({ type: 'addMeal', id });
              flash('Added to your shopping list');
            }
          }}
        >
          {inList ? <><Icon name="check" /> Listed</> : <><Icon name="plus" /> List</>}
        </button>
        <button
          className="btn btn-primary grow"
          onClick={() => {
            dispatch({ type: 'addMeal', id });
            navigate('/guide');
          }}
          disabled={toBuyCount === 0}
        >
          <Icon name="map" /> Find ingredients in store
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {swapFor && (
        <div className="sheet-backdrop" onClick={() => setSwapFor(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <h3>Swap {swapFor.product.name.toLowerCase()}</h3>
            <p className="muted small">The price and shopping list update straight away.</p>
            {[swapFor.product.id, ...swapFor.swapOptions].map((pid) => {
              const p = productById[pid];
              const packs = Math.max(1, Math.ceil(swapFor.needed / p.size - 1e-9));
              const cost = packs * p.price;
              const diff = cost - swapFor.packCost;
              const current = pid === swapFor.product.id;
              return (
                <button
                  key={pid}
                  className={`swap-option ${current ? 'selected' : ''}`}
                  onClick={() => {
                    dispatch({ type: 'swap', id, slot: swapFor.key, productId: pid });
                    setSwapFor(null);
                    if (!current) flash(`Swapped to ${p.name.toLowerCase()}`);
                  }}
                >
                  <ProductThumb product={p} />
                  <div className="so-info">
                    <strong>{p.name}{!p.veg ? '' : ''}</strong>
                    <span>{packs} × {p.packLabel} · Aisle {p.aisle}</span>
                  </div>
                  <div className="so-price">
                    <strong>{nok(cost)}</strong>
                    {!current && <span className={diff <= 0 ? 'cheaper' : 'dearer'}>{diff <= 0 ? '−' : '+'}{nok(Math.abs(diff))}</span>}
                    {current && <span>Current</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
