import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppStoreProvider } from './lib/store.jsx';
import './styles.css';
import './job-reconciliation.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppStoreProvider><App/></AppStoreProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}), { once:true });
}
