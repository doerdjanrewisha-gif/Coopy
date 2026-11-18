import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';

// Capture the install prompt (Android/desktop Chrome) for the Share screen.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__coopyInstall = e;
  window.dispatchEvent(new Event('coopy-install'));
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
