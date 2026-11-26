import { useState, useRef, useEffect } from 'react';
import { Send, Heart, Plus, ThumbsUp, ThumbsDown, Paperclip, X } from 'lucide-react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import { C, serif } from '../../theme';
import { SUGGESTIONS } from '../../data';
import { useAuth } from '../../App';
import { checkEmergency } from '../../lib/emergencyCheck';
import EmergencyBanner from '../../components/chat/EmergencyBanner';
import ConfirmActionCard from '../../components/chat/ConfirmActionCard';
import RecipientPill from '../../components/chat/RecipientPill';

// Lightweight markdown → React renderer
function renderMarkdown(text) {
  const lines = text.split('\n');
  const out = [];
  let listBuf = [];

  function detectListItem(line) {
    const ol = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (ol) return { indent: ol[1].length, text: ol[3], type: 'ol' };
    const ul = line.match(/^(\s*)[-•*]\s+(.+)$/);
    if (ul) return { indent: ul[1].length, text: ul[2], type: 'ul' };
    return null;
  }

  function inlineFormat(str) {
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

  function buildList(items, keyPrefix, depth = 0) {
    if (!items.length) return null;
    const minIndent = Math.min(...items.map(i => i.indent));
    const isOrdered = items.find(i => i.indent === minIndent)?.type === 'ol';
    const ulStyles = ['disc', 'circle', 'square'];
    const olStyles = ['decimal', 'lower-alpha', 'lower-roman'];
    const listStyle = isOrdered ? (olStyles[depth] || 'decimal') : (ulStyles[depth] || 'square');
    const ListTag = isOrdered ? 'ol' : 'ul';

    const groups = [];
    let i = 0;
    while (i < items.length) {
      if (items[i].indent === minIndent) {
        const children = [];
        let j = i + 1;
        while (j < items.length && items[j].indent > minIndent) {
          children.push(items[j]);
          j++;
        }
        groups.push({ item: items[i], children });
        i = j;
      } else {
        i++;
      }
    }

    return (
      <ListTag key={keyPrefix} style={{
        margin: depth === 0 ? '6px 0 10px' : '3px 0 2px',
        paddingLeft: 20,
        listStyleType: listStyle,
      }}>
        {groups.map(({ item, children }, idx) => (
          <li key={idx} style={{ fontSize: 14, lineHeight: 1.65, marginBottom: children.length ? 4 : 3, color: 'inherit' }}>
            {inlineFormat(item.text)}
            {children.length ? buildList(children, `${keyPrefix}-${idx}`, depth + 1) : null}
          </li>
        ))}
      </ListTag>
    );
  }

  function flushList() {
    if (!listBuf.length) return;
    out.push(buildList(listBuf, `list-${out.length}`));
    listBuf = [];
  }

  function nextNonBlankIsListItem(fromIdx) {
    for (let j = fromIdx + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') continue;
      return detectListItem(lines[j]) !== null;
    }
    return false;
  }

  lines.forEach((line, i) => {
    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const txt = line.replace(/^#{1,3}\s+/, '');
      out.push(<p key={i} style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '14px 0 4px' }}>{inlineFormat(txt)}</p>);
    } else {
      const item = detectListItem(line);
      if (item) {
        listBuf.push(item);
      } else if (line.trim() === '') {
        if (listBuf.length && nextNonBlankIsListItem(i)) {
          // blank line between list items — stay in list context
        } else {
          flushList();
          const last = out[out.length - 1];
          const lastIsHeading = last?.props?.style?.fontWeight === 700 && last?.props?.style?.fontSize === 16;
          if (out.length && last?.type !== 'br' && !lastIsHeading) out.push(<br key={`br-${i}`} />);
        }
      } else {
        flushList();
        out.push(<p key={i} style={{ fontSize: 14, lineHeight: 1.75, margin: '2px 0' }}>{inlineFormat(line)}</p>);
      }
    }
  });
  flushList();
  return out;
}

const GREETING = (name) =>
  `Hi${name ? ` ${name}` : ''}! I'm Aiden, your personal caregiving assistant. I'm here to help you navigate caring for your loved ones — from medical questions to legal documents, insurance, and emotional support. What can I help you with?`;

function makeConvId() {
  return 'chat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function Chat({ conversationId: propConvId, onNewChat, services }) {
  const { user, profile } = useAuth();
  const [convId]          = useState(() => propConvId || makeConvId());
  const [messages, setMessages] = useState(null);
  const [input, setInput]       = useState('');
  const [waiting, setWaiting]   = useState(false);
  const [error, setError]       = useState(null);
  const [emergencyState, setEmergencyState]   = useState(null);
  const [pendingAction, setPendingAction]     = useState(null);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [recipientId, setRecipientId]         = useState(null);
  const [feedback, setFeedback]               = useState({});
  const [attachment, setAttachment]           = useState(null);
  const [uploading, setUploading]             = useState(false);
  const titledRef = useRef(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  // Whether the conversation has had its first user message (locks recipient)
  const hasMessagedRef = useRef(false);

  // Maps tool names to service functions
  const serviceMap = services ? {
    create_appointment:     (args) => services.addAppointment(args),
    update_appointment:     ({ appointmentId, ...rest }) => services.updateAppointment(appointmentId, rest),
    create_logistic_item:   (args) => services.addLogistic({ ...args, completed: false }),
    complete_logistic_item: ({ logisticId }) => services.updateLogistic(logisticId, { completed: true }),
    create_care_change:     (args) => services.addChange(args),
    add_doctor:             (args) => services.addDoctor(args),
  } : {};

  const firstName = profile?.name?.split(' ')[0] || '';

  useEffect(() => {
    if (!user) return;
    titledRef.current = false;
    hasMessagedRef.current = false;
    const db = getFirestore();
    getDoc(doc(db, 'users', user.uid, 'conversations', convId))
      .then(snap => {
        if (snap.exists() && snap.data().messages?.length) {
          if (snap.data().title) titledRef.current = true;
          if (snap.data().recipientId) {
            setRecipientId(snap.data().recipientId);
            hasMessagedRef.current = true; // existing conversation: lock recipient
          }
          if (snap.data().feedback) setFeedback(snap.data().feedback);
          setMessages(snap.data().messages);
        } else {
          // Auto-select the only recipient for new conversations
          const recs = services?.recipients || [];
          if (recs.length === 1) setRecipientId(recs[0].id);
          setMessages([{ role: 'assistant', text: GREETING(firstName) }]);
        }
      })
      .catch(() => {
        const recs = services?.recipients || [];
        if (recs.length === 1) setRecipientId(recs[0].id);
        setMessages([{ role: 'assistant', text: GREETING(firstName) }]);
      });
  }, [user, convId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, waiting]);

  function handleFeedback(idx, dir) {
    const next = { ...feedback, [idx]: feedback[idx] === dir ? null : dir };
    setFeedback(next);
    const db = getFirestore();
    setDoc(doc(db, 'users', user.uid, 'conversations', convId), { feedback: next }, { merge: true }).catch(() => {});
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAttachment(file);
  }

  async function handleSend() {
    if (waiting || !messages || pendingAction || uploading) return;
    let text = input.trim();
    const currentAttachment = attachment;
    if (!text && !currentAttachment) return;

    setInput('');
    setAttachment(null);

    if (currentAttachment) {
      const isText = /text\/(plain|csv)/.test(currentAttachment.type) || /\.(txt|csv)$/i.test(currentAttachment.name);
      if (isText && currentAttachment.size < 100000) {
        try {
          const content = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.onerror = rej;
            reader.readAsText(currentAttachment);
          });
          const preview = content.length > 8000 ? content.slice(0, 8000) + '\n[...truncated]' : content;
          text = text
            ? `${text}\n\n[Attached: ${currentAttachment.name}]\n${preview}`
            : `[File: ${currentAttachment.name}]\n${preview}`;
        } catch {
          setError('Failed to read file.');
          setAttachment(currentAttachment);
          return;
        }
      } else {
        setUploading(true);
        try {
          const path = `users/${user.uid}/documents/${Date.now()}_${currentAttachment.name}`;
          const sRef = storageRef(storage, path);
          await uploadBytes(sRef, currentAttachment, {
            contentType: currentAttachment.type || 'application/octet-stream',
            customMetadata: { originalName: currentAttachment.name, recipientId: recipientId || '', docType: 'Other' },
          });
          const mention = `I've uploaded **${currentAttachment.name}** as a reference document.`;
          text = text ? `${text}\n\n${mention}` : mention;
        } catch {
          setError('Failed to upload file. Please try again.');
          setAttachment(currentAttachment);
          setUploading(false);
          return;
        }
        setUploading(false);
      }
    }

    if (!text.trim()) return;
    await send(text);
  }

  async function send(text) {
    if (!text.trim() || waiting || !messages || pendingAction) return;
    setError(null);
    setEmergencyState(null);

    // Client-side emergency check — show banner immediately
    const emergency = checkEmergency(text);
    if (emergency.isEmergency) setEmergencyState(emergency);

    const userMsg = { role: 'user', text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setWaiting(true);

    // Save title + recipientId on first user message
    if (!titledRef.current) {
      titledRef.current = true;
      hasMessagedRef.current = true;
      const title = text.trim().slice(0, 60) + (text.trim().length > 60 ? '…' : '');
      const db = getFirestore();
      setDoc(doc(db, 'users', user.uid, 'conversations', convId), {
        title,
        ...(recipientId ? { recipientId } : {}),
      }, { merge: true }).catch(() => {});
    }

    try {
      const fn = httpsCallable(getFunctions(), 'askAiden');
      const result = await fn({ messages: updated, conversationId: convId, scopedRecipientId: recipientId || null });

      if (result.data.pendingAction) {
        // Claude wants to call a tool — show confirm card
        const pa = result.data.pendingAction;
        // Show Claude's pre-tool text if any
        if (pa.preText) {
          setMessages(prev => [...prev, { role: 'assistant', text: pa.preText, ts: Date.now() }]);
        }
        setPendingAction({ ...pa, sentMessages: updated });
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: result.data.text, ts: Date.now() }]);
      }
    } catch (e) {
      console.error('askAiden error:', e);
      setError('Something went wrong. Please try again.');
      setMessages(prev => prev.filter(m => m !== userMsg));
      setInput(text);
    } finally {
      setWaiting(false);
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction || confirmingAction) return;
    setConfirmingAction(true);
    try {
      // Execute service function locally (optimistic UI)
      const serviceFn = serviceMap[pendingAction.tool];
      if (serviceFn) await serviceFn(pendingAction.args);

      // Tell Claude the action was completed
      const fn = httpsCallable(getFunctions(), 'askAiden');
      const result = await fn({
        messages: pendingAction.sentMessages,
        conversationId: convId,
        scopedRecipientId: recipientId || null,
        toolConfirmation: {
          toolUseBlock: pendingAction.toolUseBlock,
          summary: pendingAction.summary,
          success: true,
          cancelled: false,
        },
      });

      // Build readable conversation: original messages + summary + ack
      setMessages([
        ...pendingAction.sentMessages,
        ...(pendingAction.preText ? [{ role: 'assistant', text: pendingAction.preText }] : []),
        { role: 'assistant', text: `✓ ${pendingAction.summary}`, ts: Date.now() },
        { role: 'assistant', text: result.data.text, ts: Date.now() },
      ]);
      setPendingAction(null);
    } catch (e) {
      console.error('confirm action error:', e);
      setError('Something went wrong saving. Please try again.');
    } finally {
      setConfirmingAction(false);
    }
  }

  async function handleCancelAction() {
    if (!pendingAction || confirmingAction) return;
    setConfirmingAction(true);
    try {
      const fn = httpsCallable(getFunctions(), 'askAiden');
      const result = await fn({
        messages: pendingAction.sentMessages,
        conversationId: convId,
        scopedRecipientId: recipientId || null,
        toolConfirmation: {
          toolUseBlock: pendingAction.toolUseBlock,
          summary: pendingAction.summary,
          success: false,
          cancelled: true,
        },
      });
      setMessages([
        ...pendingAction.sentMessages,
        ...(pendingAction.preText ? [{ role: 'assistant', text: pendingAction.preText }] : []),
        { role: 'assistant', text: result.data.text, ts: Date.now() },
      ]);
      setPendingAction(null);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setConfirmingAction(false);
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
      <div style={{ background: '#fff', padding: '16px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, background: C.roseLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={18} color={C.roseDark} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.text }}>Ask Aiden</h2>
          <p style={{ fontSize: 12, color: C.muted }}>Your AI caregiving assistant</p>
        </div>
        {services?.recipients?.length > 0 && (
          <RecipientPill
            recipients={services.recipients}
            recipientId={recipientId}
            onChange={setRecipientId}
            locked={hasMessagedRef.current}
          />
        )}
        {onNewChat && (
          <button onClick={onNewChat} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f7f7f7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, color: C.muted, cursor: 'pointer' }}>
            <Plus size={13} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea.Root style={{ flex: 1, overflow: 'hidden' }}>
      <ScrollArea.Viewport style={{ height: '100%', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end', maxWidth: '100%' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c8d5e4, #d8cad4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start', marginTop: 4 }}><Heart size={14} color={C.roseDark} /></div>
            )}
            <div style={{ maxWidth: '68%', background: m.role === 'user' ? C.roseDark : '#fff', color: m.role === 'user' ? '#fff' : C.text, borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', border: m.role === 'assistant' ? `1px solid ${C.border}` : 'none', boxShadow: '0 2px 8px rgba(80,60,40,0.06)' }}>
              {m.role === 'assistant' ? renderMarkdown(m.text) : <span style={{ fontSize: 14, lineHeight: 1.75 }}>{m.text}</span>}
              {m.role === 'assistant' && i > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {['up', 'down'].map(dir => {
                    const active = feedback[i] === dir;
                    return (
                      <button key={dir} onClick={() => handleFeedback(i, dir)} title={dir === 'up' ? 'Helpful' : 'Not helpful'} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
                        background: active ? (dir === 'up' ? '#e8f5e9' : '#fce4e4') : 'transparent',
                        border: `1px solid ${active ? (dir === 'up' ? '#81c784' : '#e57373') : C.border}`,
                        borderRadius: 20, cursor: 'pointer',
                        color: active ? (dir === 'up' ? '#388e3c' : '#c62828') : C.muted,
                        fontSize: 11, fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                      }}>
                        {dir === 'up' ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                        {active && <span>{dir === 'up' ? 'Helpful' : 'Not helpful'}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 32, height: 32, background: C.roseLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.roseDark }}>
                {(firstName[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {/* Emergency banner — shown after the user's message, before Claude's response */}
        {emergencyState?.isEmergency && (
          <EmergencyBanner isCrisis={emergencyState.isCrisis} isPoisoning={emergencyState.isPoisoning} />
        )}

        {/* Confirm-before-write card */}
        {pendingAction && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c8d5e4, #d8cad4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Heart size={14} color={C.roseDark} /></div>
            <ConfirmActionCard
              action={pendingAction}
              onConfirm={handleConfirmAction}
              onCancel={handleCancelAction}
              confirming={confirmingAction}
            />
          </div>
        )}

        {waiting && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c8d5e4, #d8cad4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={14} color={C.roseDark} /></div>
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
          <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 10 }}>Suggested questions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '8px 16px', fontSize: 13, color: C.text, cursor: 'pointer', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.rose}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment chip */}
      {attachment && (
        <div style={{ padding: '8px 32px 0', background: '#fff', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 8px', background: '#f3f4f6', border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 13, color: C.text, maxWidth: '100%' }}>
            <Paperclip size={12} color={C.muted} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{attachment.name}</span>
            <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: C.muted, display: 'flex', alignItems: 'center', flexShrink: 0 }}><X size={13} /></button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 32px 24px', background: '#fff', borderTop: attachment ? 'none' : `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <input ref={fileInputRef} type="file" accept=".pdf,.csv,.txt,image/png,image/jpeg" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!!pendingAction || uploading}
          title="Attach file (PDF, CSV, TXT, PNG)"
          style={{ width: 36, height: 36, background: 'none', border: `1px solid ${C.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: pendingAction || uploading ? 'default' : 'pointer', color: attachment ? C.rose : C.muted, flexShrink: 0, opacity: pendingAction ? 0.4 : 1, transition: 'color 0.15s' }}
          onMouseEnter={e => { if (!pendingAction) e.currentTarget.style.borderColor = C.rose; }}
          onMouseLeave={e => { if (!pendingAction) e.currentTarget.style.borderColor = C.border; }}>
          <Paperclip size={15} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={pendingAction ? 'Confirm or cancel the action above first…' : uploading ? 'Uploading…' : 'Ask anything about caregiving…'}
          disabled={!!pendingAction || uploading}
          style={{ flex: 1, background: pendingAction ? '#f3f4f6' : '#f7f7f7', border: `1px solid ${C.border}`, borderRadius: 24, padding: '11px 20px', fontSize: 14, outline: 'none', color: C.text, opacity: pendingAction || uploading ? 0.6 : 1 }}
        />
        <button onClick={handleSend} disabled={(!input.trim() && !attachment) || waiting || !!pendingAction || uploading}
          style={{ width: 44, height: 44, background: (input.trim() || attachment) && !waiting && !pendingAction && !uploading ? C.roseDark : C.border, border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (input.trim() || attachment) && !waiting && !pendingAction && !uploading ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.2s' }}>
          <Send size={17} color="#fff" />
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
