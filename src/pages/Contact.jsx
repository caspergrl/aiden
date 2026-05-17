import { useState } from 'react';
import { Send, CheckCircle, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif } from '../theme';

const FORMSPREE_ID = 'mojbqabj'; // ← replace with your Formspree form ID

const inp = {
  width: '100%',
  background: '#fff',
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 15,
  color: C.text,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', message: '' });
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error
  const [error, setError]     = useState('');

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();

    // Client-side validation
    if (!form.name.trim())    { setError('Please enter your name.');    return; }
    if (!form.email.trim())   { setError('Please enter your email.');   return; }
    if (!form.message.trim()) { setError('Please enter a message.');    return; }

    setError('');
    setStatus('sending');

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
      });

      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        throw new Error('Server error');
      }
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again or email us directly.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bgWarm }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 64px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* Header */}
          <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Get in touch</p>
          <h1 style={{ fontFamily: serif, fontSize: 38, color: C.text, letterSpacing: -0.5, marginBottom: 12 }}>Contact us</h1>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
            Have a question, feedback, or just want to say hello? We'd love to hear from you. Fill in the form below and we'll get back to you as soon as we can.
          </p>

          <a href="mailto:info@aidencare.co" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: C.roseDark, textDecoration: 'none', marginBottom: 40 }}>
            <Mail size={16} /> info@aidencare.co
          </a>

          {status === 'success' ? (
            /* ── Success state ── */
            <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(80,60,40,0.08)', border: `1px solid ${C.border}` }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#edf6ee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={30} color="#4caf72" />
              </div>
              <h2 style={{ fontFamily: serif, fontSize: 24, color: C.text, marginBottom: 10 }}>Message sent!</h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>Thank you for reaching out. We'll be in touch shortly.</p>
              <button
                onClick={() => setStatus('idle')}
                style={{ marginTop: 28, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
                Send another message
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate style={{ background: '#fff', borderRadius: 20, padding: '40px', boxShadow: '0 4px 24px rgba(80,60,40,0.08)', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Full name <span style={{ color: C.coral }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Jane Smith"
                  required
                  style={inp}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Email address <span style={{ color: C.coral }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="jane@example.com"
                  required
                  style={inp}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Message <span style={{ color: C.coral }}>*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Tell us what's on your mind…"
                  required
                  rows={6}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: C.coral, margin: '-8px 0' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: status === 'sending' ? C.border : C.roseDark,
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '14px 0', fontSize: 15, fontWeight: 700,
                  cursor: status === 'sending' ? 'default' : 'pointer',
                  transition: 'background 0.2s',
                }}>
                {status === 'sending' ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Sending…
                  </>
                ) : (
                  <><Send size={15} /> Send message</>
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
