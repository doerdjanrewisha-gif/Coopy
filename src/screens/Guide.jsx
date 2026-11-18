import { useStore } from '../store.jsx';
import { AISLES, STORE, aisleLabel } from '../lib/catalog.js';
import { buildList, nok } from '../lib/meal.js';
import { Icon, ProductThumb, navigate, TopBar, DemoNote } from '../components/ui.jsx';

// Simple floor plan. Coordinates are illustrative.
const MAP = {
  1: { x: 10, y: 108, w: 72, h: 62, label: 'Fruit & veg' },
  2: { x: 10, y: 38, w: 72, h: 60, label: 'Bakery' },
  3: { x: 98, y: 40, w: 30, h: 118, label: 'Tins' },
  4: { x: 142, y: 40, w: 30, h: 118, label: 'Pasta' },
  5: { x: 186, y: 40, w: 30, h: 118, label: 'Spices' },
  6: { x: 98, y: 8, w: 154, h: 22, label: 'Dairy & eggs' },
  7: { x: 232, y: 40, w: 78, h: 64, label: 'Meat & fish' },
  8: { x: 232, y: 112, w: 78, h: 46, label: 'Frozen' },
};
const center = (n) => ({ x: MAP[n].x + MAP[n].w / 2, y: MAP[n].y + MAP[n].h / 2 });

function StoreMap({ status, next }) {
  const stops = AISLES.filter((a) => status[a.n]).map((a) => center(a.n));
  const pts = [{ x: 46, y: 190 }, ...stops, { x: 262, y: 182 }];
  return (
    <svg className="store-map" viewBox="0 0 320 200" role="img" aria-label="Store map with your route">
      <rect x="2" y="2" width="316" height="196" rx="10" className="floor" />
      {AISLES.map((a) => {
        const m = MAP[a.n];
        const s = status[a.n];
        const cls = !s ? 'idle' : s === 'done' ? 'done' : a.n === next ? 'next' : 'todo';
        return (
          <g key={a.n} className={`zone ${cls}`}>
            <rect x={m.x} y={m.y} width={m.w} height={m.h} rx="6" />
            <text x={m.x + m.w / 2} y={m.y + m.h / 2 - (m.h > 40 ? 4 : -4)} textAnchor="middle" className="zn">{a.n}</text>
            {m.h > 40 && (
              <text x={m.x + m.w / 2} y={m.y + m.h / 2 + 12} textAnchor="middle" className="zl">{m.w > 40 ? m.label : ''}</text>
            )}
          </g>
        );
      })}
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} className="route" />
      <rect x="196" y="172" width="114" height="20" rx="5" className="checkout" />
      <text x="253" y="186" textAnchor="middle" className="zl dark">Checkout</text>
      <text x="46" y="186" textAnchor="middle" className="zl dark">Entrance ↑</text>
    </svg>
  );
}

export default function Guide() {
  const { state, dispatch } = useStore();
  const list = buildList(state.plans, state.listMeals, state.extras);
  const checked = new Set(state.checked);
  const items = list.items;
  const leftItems = items.filter((i) => !checked.has(i.product.id));
  const doneCount = items.length - leftItems.length;

  const groups = AISLES.map((a) => ({ aisle: a, items: items.filter((i) => i.product.aisle === a.n) })).filter((g) => g.items.length);
  const status = {};
  for (const g of groups) status[g.aisle.n] = g.items.every((i) => checked.has(i.product.id)) ? 'done' : 'todo';
  const nextGroup = groups.find((g) => status[g.aisle.n] === 'todo');
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  if (!items.length) {
    return (
      <div>
        <TopBar title="Aisle guide" />
        <div className="empty">
          <div className="empty-icon"><Icon name="map" size={40} /></div>
          <h2>Nothing to find yet</h2>
          <p className="muted">Choose a meal first, then tap “Find ingredients in store”.</p>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>Find a dinner</button>
        </div>
      </div>
    );
  }

  return (
    <div className="guide">
      <TopBar title="Aisle guide" right={<button className="icon-btn" onClick={() => navigate('/list')} aria-label="Shopping list"><Icon name="list" /></button>} />
      <div className="pad">
        <div className="progress-card">
          <div className="progress-top">
            <div>
              <strong className="left-count">{leftItems.length === 0 ? 'All done!' : `${leftItems.length} ${leftItems.length === 1 ? 'item' : 'items'} left`}</strong>
              <span className="muted small">{doneCount} of {items.length} found · {STORE.name}</span>
            </div>
            <span className="big-price sm">{nok(list.total)}</span>
          </div>
          <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></div>
          {nextGroup ? (
            <p className="next-stop"><Icon name="pin" size={16} /> Next stop: <strong>Aisle {nextGroup.aisle.n} · {nextGroup.aisle.name}</strong> — {nextGroup.aisle.hint.toLowerCase()}</p>
          ) : (
            <p className="next-stop done"><Icon name="check" size={16} /> You have everything. Head to the checkout!</p>
          )}
        </div>

        <StoreMap status={status} next={nextGroup?.aisle.n} />

        {groups.map((g) => {
          const allDone = status[g.aisle.n] === 'done';
          return (
            <section key={g.aisle.n} className={`aisle-group ${allDone ? 'done' : ''} ${nextGroup?.aisle.n === g.aisle.n ? 'current' : ''}`}>
              <div className="aisle-head">
                <span className="aisle-num">{g.aisle.n}</span>
                <div>
                  <strong>Aisle {g.aisle.n} · {g.aisle.name}</strong>
                  <span>{g.aisle.hint}</span>
                </div>
                {allDone && <span className="done-pill"><Icon name="check" size={14} stroke={3} /> Done</span>}
              </div>
              <ul>
                {g.items.map((it) => {
                  const done = checked.has(it.product.id);
                  return (
                    <li key={it.product.id}>
                      <button className={`guide-item ${done ? 'done' : ''}`} onClick={() => dispatch({ type: 'toggleChecked', productId: it.product.id })} aria-pressed={done}>
                        <span className={`tick ${done ? 'on' : ''}`}><Icon name="check" size={18} stroke={3} /></span>
                        <ProductThumb product={it.product} size={44} />
                        <span className="gi-info">
                          <strong>{it.packs} × {it.product.name}</strong>
                          <span className="gi-dir">{aisleLabel(it.product)}</span>
                          <span className="gi-sub">{it.product.packLabel} · {nok(it.product.price)}{it.product.stock === 'low' ? ' · few left' : ''}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {doneCount > 0 && (
          <button className="btn btn-ghost block" onClick={() => dispatch({ type: 'clearChecked' })}>Untick all</button>
        )}
        <DemoNote />
      </div>
    </div>
  );
}
