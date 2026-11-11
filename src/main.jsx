import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

pendo.initialize({
  visitor: { id: '' },
  location: {
    transforms: [{
      attr: 'search',
      action: 'ExcludeKeys',
      data: function (search, url) {
        return url.pathname === '/account' ? ['code', 'state'] : [];
      }
    }]
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
