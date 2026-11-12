import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// ─── Novus by Pendo ────────────────────────────────────────────────────────────
// Boot once with an anonymous visitor. AuthProvider (App.jsx) calls
// pendo.identify() after sign-in and pendo.clearSession() after sign-out.
window.pendo.initialize({
  visitor: { id: '' },
  location: {
    transforms: [{
      // The Google Calendar OAuth flow (gcal.js) redirects back to
      // /account?code=...&state=gcal_connect. Keep the one-time authorization
      // code out of recorded URLs. Gated on /account so other pages keep any
      // `code` or `state` query parameter they use.
      attr: 'search',
      action: 'ExcludeKeys',
      data: function (search, url) {
        return url && url.pathname === '/account' ? ['code', 'state'] : [];
      },
    }],
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
