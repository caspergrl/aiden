import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Start Pendo once, before the first render. The empty id lets the agent reuse the visitor
// it stored on a previous visit (or start an anonymous one); AuthProvider in App.jsx
// identifies the user once they are signed in.
pendo.initialize({ visitor: { id: '' } });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
