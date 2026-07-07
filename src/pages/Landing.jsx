import { Link } from 'react-router-dom';
import { CalendarDays, Shield, MessageCircle, ClipboardList, Heart, ArrowRight, Check, Smartphone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { C, serif, shadow } from '../theme';

const FEATURES = [
  { icon: Heart,          color: C.rose,     title: 'Care Profiles',       desc: 'Keep everything about your loved ones in one place — conditions, medications, doctors, and important contacts.' },
  { icon: CalendarDays,   color: C.primary,  title: 'Appointment Calendar', desc: 'Never miss a check-up. Track every appointment across all your care recipients in a clear, color-coded calendar.' },
  { icon: Shield,         color: C.lavender, title: 'Insurance Explained',  desc: 'Medicare, Medicaid, private plans — decoded into plain English so you always know what\'s covered.' },
  { icon: ClipboardList,  color: C.sage,     title: 'Legal Checklist',      desc: 'Power of attorney, advance directives, HIPAA forms — a guided checklist so nothing critical falls through the cracks.' },
  { icon: MessageCircle,  color: C.peach,    title: 'Ask Aiden AI',         desc: 'Get instant, compassionate answers to your caregiving questions — medical, legal, insurance, and emotional support.' },
];

const STEPS = [
  { n: '1', title: 'Create your account',     desc: 'Sign up in seconds. No credit card required to get started.' },
  { n: '2', title: 'Add your care recipients', desc: 'Enter your loved ones\' profiles — health conditions, medications, doctors.' },
  { n: '3', title: 'Stay organised, stay calm', desc: 'Manage appointments, track documents, and get AI-powered guidance whenever you need it.' },
];

const FAQ_PREVIEW = [
  { q: 'Who is Aiden for?', a: 'Aiden is designed for family caregivers — people caring for an aging parent, a sibling with a disability, or any loved one who needs regular support and coordination.' },
  { q: 'Is my data private and secure?', a: 'Yes. All data is encrypted and stored securely via Firebase. We never sell or share your personal or health information.' },
  { q: 'What devices does Aiden support?', a: 'Aiden is available as an iOS app and a web app that works on any modern browser.' },
];

export default function Landing() {
  return (
    <div style={{ background: C.bg }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #fdf6f5 0%, #f0e8f5 50%, #e8eff8 100%)', padding: '140px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(192,147,138,0.12)', border: `1px solid ${C.rose}40`, borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
            <Heart size={12} color={C.roseDark} fill={C.roseDark} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.5 }}>YOUR CAREGIVING COMPANION</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(38px, 6vw, 64px)', lineHeight: 1.15, color: C.text, marginBottom: 20, letterSpacing: -1 }}>
            Caregiving made<br />more manageable
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 1.8, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            Aiden helps family caregivers stay organised, informed, and supported — from tracking medications and appointments to navigating insurance and legal documents.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.roseDark, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <Link to="/faq" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: C.text, textDecoration: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}` }}>
              Learn more
            </Link>
          </div>
          <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 16 }}>No credit card required · Available on iOS & web</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>Everything you need</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: C.text, letterSpacing: -0.5 }}>One app for every part of caregiving</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ background: C.bgWarm, borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = shadow}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(160deg, #fdf6f5, #f5f0fa)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>Simple to start</p>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: C.text, marginBottom: 48, letterSpacing: -0.5 }}>Up and running in minutes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(80,60,40,0.05)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.roseDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 20, fontWeight: 700, margin: '0 auto 18px' }}>{n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get the app */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>Take it everywhere</p>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: C.text, marginBottom: 16, letterSpacing: -0.5 }}>Available on iOS & coming to Android</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 48px' }}>
            Install Aiden on your iPhone for a full native-feeling experience — no app store required. Android support is on the way.
          </p>

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* iOS card */}
            <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 36px', maxWidth: 320, flex: '1 1 280px' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.roseLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Smartphone size={24} color={C.roseDark} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.roseDark, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Available now</p>
              <h3 style={{ fontFamily: serif, fontSize: 22, color: C.text, marginBottom: 10 }}>iPhone & iPad</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
                Open Aiden in Safari, tap the Share button, and choose <strong>"Add to Home Screen"</strong> — it installs like a native app instantly.
              </p>
              <a
                href="https://aidencare.co"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.roseDark, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 700 }}>
                <Smartphone size={15} /> Open in Safari
              </a>
              <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 12 }}>Tap Share → Add to Home Screen</p>
            </div>

            {/* Android card */}
            <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 36px', maxWidth: 320, flex: '1 1 280px', opacity: 0.7 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17.523 15.341 20 11H4l2.477 4.341A2 2 0 0 0 8.237 16.5h7.526a2 2 0 0 0 1.76-1.159Z" fill="#5e8a78" opacity="0.7"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#5e8a78" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                  <circle cx="9" cy="18.5" r="1.5" fill="#5e8a78" opacity="0.7"/>
                  <circle cx="15" cy="18.5" r="1.5" fill="#5e8a78" opacity="0.7"/>
                </svg>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.sage, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Coming soon</p>
              <h3 style={{ fontFamily: serif, fontSize: 22, color: C.text, marginBottom: 10 }}>Android</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
                We're working on an Android app and it'll be ready soon. Sign up to be notified when it launches.
              </p>
              <Link
                to="/login?mode=signup"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: C.muted, textDecoration: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 700, border: `1px solid ${C.border}` }}>
                Notify me
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section style={{ padding: '80px 24px', background: C.bgWarm }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>Common questions</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: C.text, letterSpacing: -0.5 }}>We've got answers</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {FAQ_PREVIEW.map(({ q, a }) => (
              <div key={q} style={{ background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Check size={16} color={C.sage} style={{ flexShrink: 0, marginTop: 2 }} />{q}
                </p>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, paddingLeft: 26 }}>{a}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/faq" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.roseDark, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              See all FAQs <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: C.roseDark, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Logo width={100} style={{ filter: 'brightness(0) invert(1)', opacity: 0.7, marginBottom: 20 }} />
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: '#fff', marginBottom: 16, letterSpacing: -0.5 }}>You don't have to do this alone</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>
            Join thousands of caregivers who use Aiden to stay organised, informed, and supported every day.
          </p>
          <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: C.roseDark, textDecoration: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>
            Start for free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
