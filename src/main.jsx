import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/* global pendo */
pendo.initialize({
  visitor: { id: '' },
  location: {
    transforms: [{
      attr: 'search',
      action: 'ExcludeKeys',
      data: function (search, url) {
        // Strip OAuth callback parameters only on the Google Calendar redirect path
        return url.pathname === '/account' ? ['code', 'state'] : [];
      }
    }]
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
