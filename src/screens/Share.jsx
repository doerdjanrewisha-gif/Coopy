import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useStore } from '../store.jsx';
import { checkLive } from '../lib/assistant.js';
import { Icon, TopBar, navigate } from '../components/ui.jsx';

function detectedUrl() {
  return `${location.origin}${location.pathname}`.replace(/index\.html$/, '');
}
function isPrivateHost(h) {
  return /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h.endsWith('.local') || h === '';
}
function normalize(u) {
  let s = u.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const url = new URL(s);
    return url.href;
  } catch {
    return null;
  }
}

export default function Share() {
  const { state, dispatch } = useStore();
  const auto = detectedUrl();
  const autoPrivate = isPrivateHost(location.hostname);
  const [draft, setDraft] = useState(state.shareUrl || '');
  const [qr, setQr] = useState('');
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bad, setBad] = useState(false);
  const [live, setLive] = useState(null);
  const [installEvt, setInstallEvt] = useState(window.__coopyInstall || null);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;

  const target = state.shareUrl || (autoPrivate ? '' : auto);

  useEffect(() => {
    checkLive().then((s) => setLive(s.live));
    const on = () => setInstallEvt(window.__coopyInstall);
    window.addEventListener('coopy-install', on);
    return () => window.removeEventListener('coopy-install', on);
  }, []);

  useEffect(() => {
    if (!target) {
      setQr('');
      return;
    }
    QRCode.toDataURL(target, { errorCorrectionLevel: 'M', margin: 2, width: 720, color: { dark: '#002a5c', light: '#ffffff' } }).then(setQr);
  }, [target]);

  function apply(e) {
    e.preventDefault();
    const n = normalize(draft);
    if (n === null) {
      setBad(true);
      return;
    }
    setBad(false);
    dispatch({ type: 'shareUrl', value: n });
    setDraft(n);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(target);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = target;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function openFull() {
    setFull(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
  function closeFull() {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  return (
    <div className="share">
      <TopBar title="Share Coopy" back={false} />
      <div className="pad">
        <section className="qr-card">
          <h2>Scan to try Coopy</h2>
          <p className="muted small">Opens the app straight away. No download or sign-in needed.</p>
          {qr ? (
            <button className="qr-img-btn" onClick={openFull} aria-label="Show QR code full screen">
              <img src={qr} alt={`QR code for ${target}`} className="qr-img" />
            </button>
          ) : (
            <div className="qr-placeholder">
              <Icon name="info" size={28} />
              <p>This is a private preview ({location.host || 'local file'}). Enter the public app URL below to make a QR code people can open on their own phones.</p>
            </div>
          )}
          {target && <p className="qr-url">{target.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>}
          <div className="qr-actions">
            <button className="btn btn-primary" onClick={openFull} disabled={!qr}><Icon name="expand" /> Full-screen QR</button>
            <button className="btn btn-secondary" onClick={copy} disabled={!target}><Icon name="copy" /> {copied ? 'Copied!' : 'Copy link'}</button>
          </div>
          {navigator.share && target && (
            <button className="btn btn-ghost block" onClick={() => navigator.share({ title: 'Coopy', text: 'Try Coopy, the dinner helper for Coop', url: target }).catch(() => {})}>
              <Icon name="share" /> Share via…
            </button>
          )}
        </section>

        <form className="card" onSubmit={apply}>
          <h3>App link for the QR code</h3>
          <p className="small muted">
            {state.shareUrl ? 'Using the link you entered.' : autoPrivate ? 'No public link detected yet.' : `Using this page's address.`} Before presenting, open the link on another phone to check that it works without signing in.
          </p>
          <label htmlFor="url" className="small">Published URL</label>
          <div className="code-row">
            <input id="url" type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={autoPrivate ? 'https://your-app.vercel.app' : auto} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button className="btn btn-secondary">Use</button>
          </div>
          {bad && <p className="error small">That doesn't look like a web address.</p>}
          {state.shareUrl && (
            <button type="button" className="link-btn" onClick={() => { dispatch({ type: 'shareUrl', value: '' }); setDraft(''); }}>
              Use this page's address instead
            </button>
          )}
        </form>

        <section className="card">
          <h3>Add Coopy to your home screen</h3>
          {standalone ? (
            <p className="small"><Icon name="check" size={16} /> Coopy is installed on this device.</p>
          ) : installEvt ? (
            <button
              className="btn btn-primary block"
              onClick={async () => {
                installEvt.prompt();
                await installEvt.userChoice.catch(() => {});
                window.__coopyInstall = null;
                setInstallEvt(null);
              }}
            >
              <Icon name="plus" /> Install Coopy
            </button>
          ) : null}
          <div className="install-steps">
            <div>
              <strong> iPhone (Safari)</strong>
              <ol>
                <li>Tap the Share button <span className="kbd">⬆︎</span> at the bottom.</li>
                <li>Scroll and tap <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b>.</li>
              </ol>
            </div>
            <div>
              <strong>Android (Chrome)</strong>
              <ol>
                <li>Tap the menu <span className="kbd">⋮</span> at the top right.</li>
                <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
                <li>Tap <b>Install</b>.</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="card about">
          <h3>About Coopy</h3>
          <p className="small">Coopy is an in-app dinner and wayfinding assistant: chat or talk to it, pick a meal, and find every ingredient by aisle.</p>
          <p className="student-note">Student concept for Coop Norway · All Stars Consultancy case. Not an official Coop product.</p>
          <p className="small muted">Prices, stock and aisle locations are illustrative demo data for one example store. Your shopping list is saved only on this device.</p>
          <div className="ai-row">
            <div>
              <strong className="small">Assistant mode</strong>
              <span className="small muted">
                {live === null ? 'Checking…' : live ? (state.useLiveAI ? 'Live AI is on. Answers are grounded in the demo catalogue.' : 'Live AI is available but turned off.') : 'Demo mode: works offline, no API key needed.'}
              </span>
            </div>
            {live && (
              <label className="switch">
                <input type="checkbox" checked={state.useLiveAI} onChange={(e) => dispatch({ type: 'setLive', value: e.target.checked })} />
                <span />
              </label>
            )}
          </div>
          <button
            className="btn btn-ghost block"
            onClick={() => {
              if (confirm('Reset the demo? This clears the chat and shopping list on this phone.')) {
                dispatch({ type: 'resetAll' });
                navigate('/home');
              }
            }}
          >
            <Icon name="trash" size={18} /> Reset demo on this phone
          </button>
        </section>
      </div>

      {full && qr && (
        <div className="qr-full" onClick={closeFull} role="dialog" aria-label="Full-screen QR code">
          <p className="qf-brand"><span className="brand-mark">c</span> Coopy</p>
          <h2>Scan to try Coopy</h2>
          <img src={qr} alt={`QR code for ${target}`} />
          <p className="qf-url">{target.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
          <p className="qf-hint">Student concept for Coop Norway · tap anywhere to close</p>
        </div>
      )}
    </div>
  );
}
