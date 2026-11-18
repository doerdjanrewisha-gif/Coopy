import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { PRODUCTS, productById, aisleLabel, SAMPLE_SCANS, recipeById } from '../lib/catalog.js';
import { nok } from '../lib/meal.js';
import { ask } from '../lib/assistant.js';
import { shortName } from '../lib/engine.js';
import { Icon, Rich, TopBar, DemoNote } from '../components/ui.jsx';
import { openCard } from './Chat.jsx';
import { canListen, listenWithFallback, speak, stopSpeaking } from '../lib/speech.js';

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 1760;
    g.gain.value = 0.05;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 300);
  } catch {
    /* no audio */
  }
}

// Fake but stable demo barcodes for every product.
const eanOf = (p) => p.ean || `70356200${String(PRODUCTS.indexOf(p) + 100).padStart(5, '0')}`;

export default function Scan() {
  const { state, dispatch } = useStore();
  const [phase, setPhase] = useState('idle'); // idle | scanning | result
  const [pid, setPid] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [err, setErr] = useState('');
  const idx = useRef(0);
  const product = pid ? productById[pid] : null;

  function scan(id) {
    stopSpeaking();
    setAnswer(null);
    setErr('');
    setPhase('scanning');
    setTimeout(() => {
      beep();
      setPid(id);
      setPhase('result');
      dispatch({ type: 'convo', convo: { ...state.convo, lastProduct: id } });
    }, 750);
  }

  function sample() {
    const id = SAMPLE_SCANS[idx.current % SAMPLE_SCANS.length];
    idx.current += 1;
    scan(id);
  }

  function typed(e) {
    e.preventDefault();
    const c = code.replace(/\D/g, '');
    const p = PRODUCTS.find((x) => eanOf(x) === c || eanOf(x).endsWith(c) && c.length >= 4);
    if (!p) {
      setErr('No product with that barcode in this demo store.');
      return;
    }
    setCode('');
    scan(p.id);
  }

  async function askCoopy(text) {
    setBusy(true);
    const convo = { ...state.convo, lastProduct: pid };
    const res = await ask(text, convo, { useLive: state.useLiveAI });
    dispatch({ type: 'convo', convo: res.convo });
    setAnswer(res.reply);
    setBusy(false);
    speak(res.reply.speak || res.reply.text);
  }

  function talk() {
    if (listening) return;
    setListening(true);
    setHeard('');
    listenWithFallback({
      onInterim: setHeard,
      onFinal: (t) => askCoopy(t),
      onError: () => setErr('Voice input is not available here. Use the buttons instead.'),
      onEnd: () => setListening(false),
    });
  }

  return (
    <div className="scan-screen">
      <TopBar title="Scan & Talk" back={false} />
      <div className="pad">
        <p className="muted small center">How Coopy could work on a store handheld scanner. Same assistant, same store data.</p>

        <div className="device">
          <div className="device-top">
            <span className="device-led" />
            <span>Coopy Handheld · demo device</span>
            <span className="device-batt">▮▮▮▯</span>
          </div>
          <div className="lcd">
            {phase !== 'result' && (
              <div className={`viewfinder ${phase}`}>
                <div className="vf-corners" />
                <div className="laser" />
                <div className="fake-barcode" aria-hidden="true">
                  {Array.from({ length: 28 }).map((_, i) => <span key={i} style={{ width: (i * 7) % 3 + 1 }} />)}
                </div>
                <p>{phase === 'scanning' ? 'Scanning…' : 'Point at a barcode'}</p>
              </div>
            )}

            {phase === 'result' && product && (
              <div className="scan-result">
                <div className="sr-top">
                  <span className="sr-emoji" style={{ background: `hsl(${product.hue} 60% 92%)` }}>{product.emoji}</span>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.packLabel} · EAN {eanOf(product)}</span>
                  </div>
                </div>
                <div className="sr-price">{nok(product.price)}</div>
                <div className="sr-aisle"><Icon name="pin" size={16} /> {aisleLabel(product)}</div>
                <div className={`sr-stock ${product.stock}`}>{product.stock === 'low' ? 'Few left in store' : 'In stock'}{product.vegan ? ' · Vegan' : product.veg ? ' · Vegetarian' : ''}</div>

                {!answer && (
                  <div className="sr-actions">
                    <button className="btn btn-primary block" disabled={busy} onClick={() => askCoopy(`What can I cook with ${shortName(product)}?`)}>
                      <Icon name="sparkle" /> {busy ? 'Asking Coopy…' : 'Ask Coopy about this product'}
                    </button>
                    {canListen && (
                      <button className={`btn btn-secondary block ${listening ? 'listening' : ''}`} onClick={talk} disabled={busy}>
                        <Icon name="mic" /> {listening ? (heard ? `“${heard}”` : 'Listening…') : 'Talk: ask anything about it'}
                      </button>
                    )}
                  </div>
                )}

                {answer && (
                  <div className="sr-answer">
                    <div className="sr-bubble"><span className="avatar sm">c</span><p><Rich text={answer.text} /></p></div>
                    {answer.meals?.map((c) => (
                      <button key={c.mealId} className="sr-meal" onClick={() => openCard(dispatch, c)}>
                        <div>
                          <strong>{recipeById[c.mealId].name}</strong>
                          <span>{c.minutes} min · {c.servings} people · {nok(c.total)}</span>
                        </div>
                        <Icon name="chevron" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="sr-row">
                  <button className="btn btn-ghost" onClick={() => { dispatch({ type: 'addExtra', productId: product.id }); setErr('Added to your shopping list.'); }}>
                    <Icon name="plus" size={18} /> Add to list
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setPhase('idle'); setPid(null); setAnswer(null); stopSpeaking(); }}>
                    <Icon name="barcode" size={18} /> Scan another
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="device-bottom">
            <button className="trigger" onClick={sample} disabled={phase === 'scanning'}>
              <Icon name="barcode" size={22} /> Try a sample scan
            </button>
          </div>
        </div>

        {err && <p className="scan-msg">{err}</p>}

        <form className="code-form" onSubmit={typed}>
          <label htmlFor="ean" className="small muted">Or type a barcode (try 7035620001010)</label>
          <div className="code-row">
            <input id="ean" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Barcode number" />
            <button className="btn btn-secondary" disabled={!code.trim()}>Look up</button>
          </div>
        </form>

        <label className="small muted" htmlFor="pick">Or pick any product</label>
        <select id="pick" className="select" value="" onChange={(e) => e.target.value && scan(e.target.value)}>
          <option value="">Choose a product…</option>
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · Aisle {p.aisle}</option>
          ))}
        </select>
        <DemoNote>No camera needed. Barcodes, prices and aisles are illustrative demo data.</DemoNote>
      </div>
    </div>
  );
}
