import { useStore } from '../store.jsx';
import { recipeById, productById, aisleShort } from '../lib/catalog.js';
import { buildList, computeMeal, nok } from '../lib/meal.js';
import { Icon, MealImage, ProductThumb, navigate, TopBar, DemoNote, Price } from '../components/ui.jsx';

export default function List() {
  const { state, dispatch, planOf } = useStore();
  const list = buildList(state.plans, state.listMeals, state.extras);
  const left = list.items.filter((i) => !state.checked.includes(i.product.id));

  if (!list.items.length && !state.listMeals.length) {
    return (
      <div>
        <TopBar title="Shopping list" back={false} />
        <div className="empty">
          <div className="empty-icon"><Icon name="cart" size={40} /></div>
          <h2>Your list is empty</h2>
          <p className="muted">Ask Coopy for a dinner idea and tap “Find ingredients in store”. Your list is saved on this phone.</p>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}><Icon name="chat" /> Chat with Coopy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="list-screen">
      <TopBar title="Shopping list" back={false} />
      <div className="pad">
        <div className="list-summary">
          <div>
            <span className="label">Shopping total</span>
            <Price value={list.total} className="lg" />
            <span className="small muted">{list.items.length} products · {left.length} left to find</span>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/guide')} disabled={!list.items.length}>
            <Icon name="map" /> Aisle guide
          </button>
        </div>

        {state.listMeals.length > 0 && <h2 className="h2">Meals</h2>}
        {state.listMeals.map((id) => {
          const r = recipeById[id];
          const m = computeMeal(r, planOf(id));
          return (
            <div key={id} className="list-meal">
              <button className="list-meal-open" onClick={() => navigate(`/meal/${id}`)}>
                <MealImage recipe={r} />
                <div>
                  <strong>{r.name}</strong>
                  <span>{m.config.servings} servings · {m.toBuy.length} items · {nok(m.total)}</span>
                  <span className="link">Edit servings, swaps or items at home</span>
                </div>
              </button>
              <button className="icon-btn" onClick={() => dispatch({ type: 'removeMeal', id })} aria-label={`Remove ${r.name}`}>
                <Icon name="close" size={20} />
              </button>
            </div>
          );
        })}

        <h2 className="h2">Products in walking order</h2>
        <ul className="plain-list">
          {list.items.map((it) => {
            const done = state.checked.includes(it.product.id);
            const extra = state.extras.find((e) => e.productId === it.product.id);
            return (
              <li key={it.product.id} className={`plain-item ${done ? 'done' : ''}`}>
                <button className={`tick ${done ? 'on' : ''}`} onClick={() => dispatch({ type: 'toggleChecked', productId: it.product.id })} aria-label={`${done ? 'Untick' : 'Tick off'} ${it.product.name}`}>
                  <Icon name="check" size={18} stroke={3} />
                </button>
                <ProductThumb product={it.product} size={40} />
                <div className="pi-info">
                  <strong>{it.packs} × {it.product.name}</strong>
                  <span>{aisleShort(it.product)}</span>
                </div>
                <span className="pi-price">{nok(it.cost)}</span>
                {extra && !it.meals.length && (
                  <button className="icon-btn sm" onClick={() => dispatch({ type: 'removeExtra', productId: it.product.id })} aria-label="Remove">
                    <Icon name="close" size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {state.extras.length > 0 && <p className="small muted">Includes {state.extras.map((e) => productById[e.productId].name.toLowerCase()).join(', ')} added from the scanner.</p>}
        <button className="btn btn-ghost block" onClick={() => { if (confirm('Clear the whole shopping list?')) dispatch({ type: 'clearList' }); }}>
          <Icon name="trash" size={18} /> Clear list
        </button>
        <DemoNote />
      </div>
    </div>
  );
}
