import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { C, serif } from '../../theme';
import { SUGGESTIONS } from '../../data';
import { useAuth } from '../../App';

// Lightweight markdown → React renderer
// Handles: ## headings, - bullets, **bold**, *italic*
function renderMarkdown(text) {
  const lines = text.split('\n');
  const out = [];
  let bulletBuf = [];

  function flushBullets() {
    if (!bulletBuf.length) return;
    out.push(
      <ul key={`ul-${out.length}`} style={{ margin: '6px 0 10px', paddingLeft: 20, listStyleType: 'disc' }}>
        {bulletBuf.map((item, i) => <li key={i} style={{ fontSize: 14, color: 'inherit', lineHeight: 1.65, marginBottom: 3 }}>{inlineFormat(item)}</li>)}
      </ul>
    );
    bulletBuf = [];
  }

  function inlineFormat(str) {
    // Split on **bold** and *italic* markers
    const parts = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let last = 0, m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[0].startsWith('**')) parts.push(<strong key={m.index}>{m[2]}</strong>);
      else parts.push(<em key={m.index}>{m[3]}</em>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
  }

  lines.forEach((line, i) => {
    if (/^#{1,3}\s/.test(line)) {
      flushBullets();
      const txt = line.replace(/^#{1,3}\s+/, '');
      out.push(<p key={i} style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '14px 0 4px' }}>{inlineFormat(txt)}</p>);
    } else if (/^[-•]\s/.test(line)) {
      bulletBuf.push(line.replace(/^[-•]\s+/, ''));
    } else if (line.trim() === '') {
      flushBullets();
      const last = out[out.length - 1];
      const lastIsHeading = last?.props?.style?.fontWeight === 700 && last?.props?.style?.fontSize === 16;
      if (out.length && last?.type !== 'br' && !lastIsHeading) out.push(<br key={`br-${i}`} />);
    } else {
      flushBullets();
      out.push(<p key={i} style={{ fontSize: 14, lineHeight: 1.75, margin: '2px 0' }}>{inlineFormat(line)}</p>);
    }
  });
  flushBullets();
  return out;
}

const CONVERSATION_ID = 'askaiden';

const GREETING = (name) =>
  `Hi${name ? ` ${name}` : ''}! I'm Aiden, your personal caregiving assistant. I'm here to help you navigate caring for your loved ones — from medical questions to legal documents, insurance, and emotional support. What can I help you with? 🤍`;

export default function Chat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState(null); // null = loading
  const [input, setInput]       = useState('');
  const [waiting, setWaiting]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef = useRef(null);

  const firstName = profile?.name?.split(' ')[0] || '';

  // Load conversation history from Firestore on mount
  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    getDoc(doc(db, 'users', user.uid, 'conversations', CONVERSATION_ID))
      .then(snap => {
        if (snap.exists() && snap.data().messages?.length) {
          setMessages(snap.data().messages);
        } else {
          setMessages([{ role: 'assistant', text: GREETING(firstName) }]);
        }
      })
      .catch(() => {
        setMessages([{ role: 'assistant', text: GREETING(firstName) }]);
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, waiting]);

  async function send(text) {
    if (!text.trim() || waiting || !messages) return;
    setError(null);
    const userMsg = { role: 'user', text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setWaiting(true);

    try {
      const fn = httpsCallable(getFunctions(), 'askAiden');
      const result = await fn({ messages: updated, conversationId: CONVERSATION_ID });
      setMessages(prev => [...prev, { role: 'assistant', text: result.data.text, ts: Date.now() }]);
    } catch (e) {
      console.error('askAiden error:', e);
      setError('Something went wrong. Please try again.');
      setMessages(prev => prev.filter(m => m !== userMsg));
      setInput(text);
    } finally {
      setWaiting(false);
    }
  }

  if (!messages) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #ebe2d8', borderTopColor: '#c85c55', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)', maxHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.roseLight}, #f0eaf8)`, padding: '20px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 2px 12px rgba(120,100,80,0.1)' }}>🤍</div>
        <div>
          <h2 style={{ fontFamily: serif, fontSize: 20, color: C.text }}>Ask Aiden</h2>
          <p style={{ fontSize: 13, color: C.muted }}>Your AI caregiving assistant · Always available</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea.Root style={{ flex: 1, overflow: 'hidden' }}>
      <ScrollArea.Viewport style={{ height: '100%', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end', maxWidth: '100%' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c8d5e4, #d8cad4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🤍</div>
            )}
            <div style={{ maxWidth: '68%', background: m.role === 'user' ? C.roseDark : '#fff', color: m.role === 'user' ? '#fff' : C.text, borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', border: m.role === 'assistant' ? `1px solid ${C.border}` : 'none', boxShadow: '0 2px 8px rgba(80,60,40,0.06)' }}>
              {m.role === 'assistant' ? renderMarkdown(m.text) : <span style={{ fontSize: 14, lineHeight: 1.75 }}>{m.text}</span>}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 32, height: 32, background: C.roseLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.roseDark }}>
                {(firstName[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {waiting && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c8d5e4, #d8cad4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤍</div>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '18px 18px 18px 4px', padding: '13px 18px', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: C.mutedLight, animation: 'pulse 1.2s infinite', animationDelay: `${j * 0.2}s` }} />)}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#c0392b', background: '#fdf2f2', border: '1px solid #fac5c5', borderRadius: 10, padding: '10px 16px' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" style={{ display: 'flex', width: 6, padding: '2px 0', background: 'transparent' }}>
        <ScrollArea.Thumb style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 3, flex: 1 }} />
      </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Suggestions */}
      {messages.length <= 1 && !waiting && (
        <div style={{ padding: '0 32px 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Suggested questions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '8px 16px', fontSize: 13, color: C.text, cursor: 'pointer', fontWeight: 500, transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.rose}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 32px 24px', background: '#fff', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask anything about caregiving…"
          style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 24, padding: '11px 20px', fontSize: 14, outline: 'none', color: C.text }}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || waiting}
          style={{ width: 44, height: 44, background: input.trim() && !waiting ? C.roseDark : C.border, border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !waiting ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.2s' }}>
          <Send size={17} color="#fff" />
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
