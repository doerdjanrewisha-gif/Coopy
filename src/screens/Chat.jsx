import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { ask, checkLive } from '../lib/assistant.js';
import { Icon, MealCard, Chips, ProductCallout, Rich, navigate } from '../components/ui.jsx';
import { QUICK } from './Home.jsx';
import { unlockSpeech } from '../lib/speech.js';

const WELCOME = {
  id: 'welcome',
  role: 'coopy',
  text: "Hi! I'm Coopy. Tell me how many people are eating, your budget and how much time you have. I'll suggest meals and show you where to find everything in this store.",
  chips: [QUICK, 'Something vegetarian for 2', 'Where can I find chickpeas?', 'I have 30 minutes and some rice'],
};

export function useAssistant() {
  const { state, dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  async function send(text, { onReply } = {}) {
    const clean = text.trim();
    if (!clean || busy) return null;
    const s = stateRef.current;
    const userMsg = { id: `u${Date.now()}`, role: 'user', text: clean };
    const chat = [...s.chat, userMsg];
    dispatch({ type: 'chat', chat });
    setBusy(true);
    const history = chat.slice(-7, -1).map((m) => ({ role: m.role, text: m.text }));
    const started = Date.now();
    const { convo, reply, source } = await ask(clean, s.convo, { useLive: s.useLiveAI, history });
    // brief natural pause so the typing indicator is visible
    const wait = Math.max(0, 450 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    const botMsg = { id: `c${Date.now()}`, role: 'coopy', ...reply, source };
    dispatch({ type: 'chat', chat: [...stateRef.current.chat, botMsg], convo });
    setBusy(false);
    if (reply.action?.type === 'open_meal') {
      if (reply.action.config) dispatch({ type: 'setPlan', id: reply.action.mealId, config: reply.action.config });
      setTimeout(() => navigate(`/meal/${reply.action.mealId}`), 500);
    } else if (reply.action?.type === 'navigate') {
      setTimeout(() => navigate(reply.action.to), 500);
    }
    onReply?.(reply);
    return reply;
  }
  return { send, busy };
}

export function openCard(dispatch, card) {
  dispatch({ type: 'setPlan', id: card.mealId, config: card.config });
  navigate(`/meal/${card.mealId}`);
}

export default function Chat({ initial }) {
  const { state, dispatch } = useStore();
  const { send, busy } = useAssistant();
  const [text, setText] = useState('');
  const [live, setLive] = useState(false);
  const endRef = useRef(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    checkLive().then((s) => setLive(s.live));
  }, []);

  useEffect(() => {
    if (initial && !sentInitial.current) {
      sentInitial.current = true;
      history.replaceState(null, '', '#/chat');
      send(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.chat.length, busy]);

  const messages = [WELCOME, ...state.chat];
  const lastId = messages[messages.length - 1].id;

  function submit(e) {
    e?.preventDefault();
    const t = text;
    setText('');
    send(t);
  }

  return (
    <div className="chat">
      <header className="chat-head">
        <button className="icon-btn" onClick={() => navigate('/home')} aria-label="Back to home">
          <Icon name="back" />
        </button>
        <div className="chat-who">
          <span className="avatar">c</span>
          <div>
            <strong>Coopy</strong>
            <span className={`mode ${live && state.useLiveAI ? 'live' : ''}`}>{live && state.useLiveAI ? 'Live AI' : 'Demo mode'} · in-app assistant</span>
          </div>
        </div>
        <button
          className="icon-btn call-btn"
          onClick={() => {
            unlockSpeech();
            navigate('/call');
          }}
          aria-label="Call Coopy"
        >
          <Icon name="phone" />
        </button>
        <button className="icon-btn" onClick={() => dispatch({ type: 'resetChat' })} aria-label="Start a new chat" title="New chat">
          <Icon name="trash" size={20} />
        </button>
      </header>

      <div className="messages" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.role === 'coopy' && <span className="avatar sm">c</span>}
            <div className="msg-col">
              <div className="bubble">
                <Rich text={m.text} />
              </div>
              {m.product && <ProductCallout productId={m.product} />}
              {m.meals?.length > 0 && (
                <div className="meal-list">
                  {m.meals.map((card) => (
                    <MealCard key={card.mealId} card={card} onOpen={() => openCard(dispatch, card)} />
                  ))}
                </div>
              )}
              {m.id === lastId && !busy && <Chips chips={m.chips} onPick={(c) => send(c)} />}
            </div>
          </div>
        ))}
        {busy && (
          <div className="msg coopy">
            <span className="avatar sm">c</span>
            <div className="bubble typing" aria-label="Coopy is typing">
              <i /><i /><i />
            </div>
          </div>
        )}
        <div ref={endRef} style={{ height: 1 }} />
      </div>

      <form className="composer" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Coopy about dinner or a product…"
          aria-label="Message Coopy"
          enterKeyHint="send"
        />
        <button className="send" disabled={!text.trim() || busy} aria-label="Send">
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
