import { useState, useRef, useEffect } from 'react';
import { Send, Heart } from 'lucide-react';
import { C, serif } from '../../theme';
import { getResponse, SUGGESTIONS } from '../../data';
import { useAuth } from '../../App';

export default function Chat({ messages, setMessages }) {
  const { profile } = useAuth();
  const [input, setInput]     = useState('');
  const [waiting, setWaiting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, waiting]);

  function send(text) {
    if (!text.trim() || waiting) return;
    setMessages(p => [...p, { role: 'user', text }]);
    setInput('');
    setWaiting(true);
    setTimeout(() => {
      setMessages(p => [...p, { role: 'assistant', text: getResponse(text) }]);
      setWaiting(false);
    }, 900);
  }

  const firstName = profile?.name?.split(' ')[0] || 'there';

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
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end', maxWidth: '100%' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c8d5e4, #d8cad4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🤍</div>
            )}
            <div style={{ maxWidth: '68%', background: m.role === 'user' ? C.roseDark : '#fff', color: m.role === 'user' ? '#fff' : C.text, borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', fontSize: 14, lineHeight: 1.75, border: m.role === 'assistant' ? `1px solid ${C.border}` : 'none', boxShadow: '0 2px 8px rgba(80,60,40,0.06)' }}>
              {m.text}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 32, height: 32, background: C.roseLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.roseDark }}>
                {firstName[0].toUpperCase()}
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
        <div ref={bottomRef} />
      </div>

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
