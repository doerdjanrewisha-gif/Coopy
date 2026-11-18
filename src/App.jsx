import { useEffect, useState } from 'react';
import { useStore } from './store.jsx';
import { Icon, navigate } from './components/ui.jsx';
import { buildList } from './lib/meal.js';
import Home from './screens/Home.jsx';
import Chat from './screens/Chat.jsx';
import Call from './screens/Call.jsx';
import Meal from './screens/Meal.jsx';
import List from './screens/List.jsx';
import Guide from './screens/Guide.jsx';
import Scan from './screens/Scan.jsx';
import Share from './screens/Share.jsx';
import { unlockSpeech } from './lib/speech.js';

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/home';
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'home', param: parts[1] ? decodeURIComponent(parts[1]) : null, query: new URLSearchParams(qs || '') };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const { state } = useStore();

  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    // iOS needs a user gesture before speech can play later.
    const unlock = () => unlockSpeech();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const list = buildList(state.plans, state.listMeals, state.extras);
  const left = list.items.filter((i) => !state.checked.includes(i.product.id)).length;

  let screen;
  switch (route.name) {
    case 'chat':
      screen = <Chat key={route.query.get('q') || 'chat'} initial={route.query.get('q')} />;
      break;
    case 'call':
      screen = <Call />;
      break;
    case 'meal':
      screen = <Meal id={route.param} />;
      break;
    case 'list':
      screen = <List />;
      break;
    case 'guide':
      screen = <Guide />;
      break;
    case 'scan':
      screen = <Scan />;
      break;
    case 'share':
      screen = <Share />;
      break;
    default:
      screen = <Home />;
  }

  const hideNav = route.name === 'call';
  const tab = { home: 'home', chat: 'chat', call: 'chat', meal: 'chat', list: 'list', guide: 'list', scan: 'scan', share: 'share' }[route.name] || 'home';

  return (
    <div className={`app ${hideNav ? 'no-nav' : ''}`}>
      <main className="screen">{screen}</main>
      {!hideNav && (
        <nav className="tabbar" aria-label="Main">
          <Tab icon="home" label="Home" active={tab === 'home'} to="/home" />
          <Tab icon="chat" label="Coopy" active={tab === 'chat'} to="/chat" />
          <button className={`tab tab-center ${tab === 'scan' ? 'active' : ''}`} onClick={() => navigate('/scan')} aria-current={tab === 'scan' ? 'page' : undefined}>
            <span className="center-btn"><Icon name="scan" size={24} /></span>
            <span className="tab-label">In store</span>
          </button>
          <Tab icon="basket" label="List" active={tab === 'list'} to="/list" badge={left || null} />
          <Tab icon="more" label="More" active={tab === 'share'} to="/share" />
        </nav>
      )}
    </div>
  );
}

function Tab({ icon, label, active, to, badge }) {
  return (
    <button className={`tab ${active ? 'active' : ''}`} onClick={() => navigate(to)} aria-current={active ? 'page' : undefined}>
      <span className="tab-icon">
        <Icon name={icon} size={24} stroke={icon === 'more' ? 3.2 : 1.8} />
        {badge ? <span className="badge">{badge}</span> : null}
      </span>
      <span className="tab-label">{label}</span>
    </button>
  );
}
