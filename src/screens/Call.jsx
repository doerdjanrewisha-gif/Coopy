import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useAssistant, openCard } from './Chat.jsx';
import { Icon, Rich, navigate, ProductCallout } from '../components/ui.jsx';
import { canListen, canSpeak, speak, stopSpeaking, listenWithFallback } from '../lib/speech.js';
import { recipeById } from '../lib/catalog.js';
import { nok } from '../lib/meal.js';

const GREETING = "Hi, this is Coopy. I can find dinner ideas and show you where things are in this store. What can I help with?";
const PROMPTS = ['Where can I find chickpeas?', 'What can I cook with them?', 'Dinner for two under 150 NOK in 20 minutes'];

export default function Call() {
  const { dispatch } = useStore();
  const { send, busy } = useAssistant();
  const [phase, setPhase] = useState('connecting'); // connecting | idle | listening | thinking | speaking
  const [interim, setInterim] = useState('');
  const [lines, setLines] = useState([]);
  const [muted, setMuted] = useState(false);
  const [typing, setTyping] = useState(!canListen);
  const [text, setText] = useState('');
  const [micError, setMicError] = useState(canListen ? null : 'unsupported');
  const [secs, setSecs] = useState(0);
  const stopRef = useRef(null);
  const mutedRef = useRef(false);
  mutedRef.current = muted;
  const endRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    const c = setTimeout(() => {
      setLines([{ role: 'coopy', text: GREETING }]);
      say(GREETING);
    }, 1100);
    return () => {
      clearInterval(t);
      clearTimeout(c);
      stopSpeaking();
      stopRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines.length, interim]);

  function say(t) {
    if (mutedRef.current || !canSpeak) {
      setPhase('idle');
      return;
    }
    setPhase('speaking');
    speak(t, { onEnd: () => setPhase((p) => (p === 'speaking' ? 'idle' : p)) });
  }

  async function handle(utterance) {
    setInterim('');
    setLines((l) => [...l, { role: 'user', text: utterance }]);
    setPhase('thinking');
    const reply = await send(utterance);
    if (!reply) {
      setPhase('idle');
      return;
    }
    setLines((l) => [...l, { role: 'coopy', ...reply }]);
    say(reply.speak || reply.text);
  }

  function toggleMic() {
    if (phase === 'listening') {
      stopRef.current?.();
      return;
    }
    stopSpeaking();
    setMicError(null);
    setPhase('listening');
    setInterim('');
    stopRef.current = listenWithFallback({
      onInterim: setInterim,
      onFinal: (t) => handle(t),
      onError: (err) => {
        setMicError(err === 'not-allowed' || err === 'service-not-allowed' ? 'denied' : err === 'no-speech' ? 'no-speech' : 'error');
        if (err !== 'no-speech') setTyping(true);
      },
      onEnd: () => setPhase((p) => (p === 'listening' ? 'idle' : p)),
    });
  }

  function submit(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    const t = text;
    setText('');
    handle(t);
  }

  function end() {
    stopSpeaking();
    stopRef.current?.();
    navigate('/chat');
  }

  const status = {
    connecting: 'Connecting to Coopy…',
    idle: canListen && !micError ? 'Tap the microphone and ask a question' : 'Type your question below',
    listening: 'Listening…',
    thinking: 'Coopy is thinking…',
    speaking: 'Coopy is speaking…',
  }[phase];

  const mm = String(Math.floor(secs / 60)).padStart(1, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="call">
      <header className="call-head">
        <div className="call-title">
          <strong>Coopy</strong>
          <span>In-app voice conversation · {mm}:{ss}</span>
        </div>
        <button className={`icon-btn light ${muted ? 'off' : ''}`} onClick={() => { setMuted(!muted); if (!muted) stopSpeaking(); }} aria-label={muted ? 'Turn Coopy voice on' : 'Mute Coopy voice'}>
          <Icon name={muted ? 'mute' : 'speaker'} />
        </button>
      </header>

      <div className={`orb-wrap ${phase}`}>
        <div className="orb">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="orb-core">c</span>
        </div>
        <p className="call-status" aria-live="polite">{status}</p>
        {phase === 'listening' && interim && <p className="interim">“{interim}”</p>}
      </div>

      <div className="transcript" aria-label="Transcript">
        {lines.map((l, i) => (
          <div key={i} className={`tline ${l.role}`}>
            <span className="who">{l.role === 'user' ? 'You' : 'Coopy'}</span>
            <div className="ttext"><Rich text={l.text} /></div>
            {l.product && <ProductCallout productId={l.product} />}
            {l.meals?.length > 0 && (
              <div className="tmeals">
                {l.meals.map((c) => (
                  <button key={c.mealId} className="tmeal" onClick={() => { stopSpeaking(); openCard(dispatch, c); }}>
                    <strong>{recipeById[c.mealId].name}</strong>
                    <span>{c.minutes} min · {c.servings} people · {nok(c.total)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {micError && (
        <p className="mic-note">
          {micError === 'unsupported' && 'Voice input is not available in this browser. Type your question instead. Coopy still answers out loud.'}
          {micError === 'denied' && 'Microphone access is blocked. Type your question instead, or allow the microphone in your browser settings.'}
          {micError === 'no-speech' && "I didn't hear anything. Tap the mic and try again."}
          {micError === 'error' && 'Voice input stopped. You can type your question instead.'}
        </p>
      )}

      <div className="call-prompts">
        {PROMPTS.map((p) => (
          <button key={p} className="chip dark" disabled={busy || phase === 'connecting'} onClick={() => handle(p)}>{p}</button>
        ))}
      </div>

      {typing && (
        <form className="call-type" onSubmit={submit}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type to Coopy…" aria-label="Type your question" enterKeyHint="send" />
          <button className="send" disabled={!text.trim() || busy} aria-label="Send"><Icon name="send" /></button>
        </form>
      )}

      <div className="call-controls">
        <button className={`ctl ${typing ? 'on' : ''}`} onClick={() => setTyping(!typing)} aria-label="Type instead">
          <Icon name="keyboard" />
          <span>Type</span>
        </button>
        <button className={`mic ${phase === 'listening' ? 'active' : ''}`} onClick={toggleMic} disabled={!canListen || phase === 'connecting' || phase === 'thinking'} aria-label={phase === 'listening' ? 'Stop listening' : 'Start talking'}>
          <Icon name="mic" size={34} />
        </button>
        <button className="ctl end" onClick={end} aria-label="End call">
          <Icon name="phone" style={{ transform: 'rotate(135deg)' }} />
          <span>End</span>
        </button>
      </div>
    </div>
  );
}
