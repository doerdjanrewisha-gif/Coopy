import { useState } from 'react';
import { recipeById, productById, aisleShort } from '../lib/catalog.js';
import { nok } from '../lib/meal.js';

export function navigate(to) {
  if (location.hash !== `#${to}`) location.hash = to;
}

const paths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chat: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  phone: 'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  scan: 'M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M17 8v8',
  share: 'M12 3v12M7 8l5-5 5 5M5 13v7h14v-7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  send: 'M4 12 20 4l-6 16-2-7z',
  back: 'M15 5l-7 7 7 7',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  people: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.87M16 3.13a3.5 3.5 0 0 1 0 6.75',
  pin: 'M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  check: 'M5 12.5 10 17 19 7',
  swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7',
  cart: 'M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.76L21 8H6M9 20.5h.01M17 20.5h.01',
  speaker: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  mute: 'M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  chevron: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  barcode: 'M4 6v12M7 6v12M10 6v12M13 6v12M17 6v12M20 6v12',
};

export function Icon({ name, size = 22, stroke = 2, className = '', style }) {
  return (
    <svg className={`icon ${className}`} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export function MealImage({ recipe, className = '' }) {
  const [failed, setFailed] = useState(false);
  const emoji = { 'chickpea-curry': '🍛', 'tomato-mozzarella-pasta': '🍝', shakshuka: '🍳', 'noodle-stir-fry': '🍜', 'salmon-potatoes': '🐟', 'taco-friday': '🌮', 'bean-chili': '🌶️', 'fish-cakes': '🍽️' }[recipe.id];
  if (failed) {
    return (
      <div className={`meal-img fallback ${className}`} style={{ background: `linear-gradient(135deg, hsl(${recipe.hue} 70% 82%), hsl(${recipe.hue + 25} 65% 65%))` }} role="img" aria-label={recipe.name}>
        <span>{emoji}</span>
      </div>
    );
  }
  return <img className={`meal-img ${className}`} src={recipe.image} alt={recipe.name} loading="lazy" onError={() => setFailed(true)} />;
}

export function ProductThumb({ product, size = 44 }) {
  return (
    <div className="pthumb" style={{ width: size, height: size, fontSize: size * 0.5, background: `hsl(${product.hue} 60% 94%)` }} aria-hidden="true">
      {product.emoji}
    </div>
  );
}

export function MealCard({ card, onOpen }) {
  const recipe = recipeById[card.mealId];
  return (
    <button className="meal-card" onClick={onOpen}>
      <MealImage recipe={recipe} />
      <div className="meal-card-body">
        <div className="meal-card-title">{recipe.name}</div>
        <div className="meta-row">
          <span><Icon name="clock" size={15} /> {recipe.minutes} min</span>
          <span><Icon name="people" size={15} /> {card.servings}</span>
          {card.vegetarian && <span className="veg"><Icon name="leaf" size={15} /> Veg</span>}
        </div>
        <div className="meal-card-price">
          <span className="price">{nok(card.total)}</span>
          <span className="sub">est. checkout</span>
        </div>
      </div>
    </button>
  );
}

export function Chips({ chips, onPick, disabled }) {
  if (!chips?.length) return null;
  return (
    <div className="chips">
      {chips.map((c) => (
        <button key={c} className="chip" onClick={() => onPick(c)} disabled={disabled}>
          {c}
        </button>
      ))}
    </div>
  );
}

export function ProductCallout({ productId }) {
  const p = productById[productId];
  if (!p) return null;
  return (
    <div className="product-callout">
      <ProductThumb product={p} size={48} />
      <div>
        <div className="pc-name">{p.name}</div>
        <div className="pc-aisle"><Icon name="pin" size={14} /> {aisleShort(p)}</div>
        <div className="pc-sub">{p.packLabel} · {nok(p.price)} · {p.stock === 'low' ? <b className="low">Few left</b> : <b className="in">In stock</b>}</div>
      </div>
      <div className="aisle-badge">{p.aisle}</div>
    </div>
  );
}

export function Rich({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export function TopBar({ title, back = true, right }) {
  return (
    <header className="topbar">
      {back ? (
        <button className="icon-btn" onClick={() => (history.length > 1 ? history.back() : navigate('/home'))} aria-label="Back">
          <Icon name="back" />
        </button>
      ) : (
        <span style={{ width: 44 }} />
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">{right || <span style={{ width: 44 }} />}</div>
    </header>
  );
}

export function DemoNote({ children }) {
  return <p className="demo-note"><Icon name="info" size={14} /> {children || 'Prices, stock and aisle locations are illustrative demo data.'}</p>;
}
