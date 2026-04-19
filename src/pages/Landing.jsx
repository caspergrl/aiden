import { Link } from 'react-router-dom';
import { CalendarDays, Shield, MessageCircle, ClipboardList, Heart, ArrowRight, Check, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Caring for her mother', quote: 'Aiden has been a lifesaver. I used to spend hours trying to remember which doctor said what. Now everything is in one place.' },
  { name: 'David K.', role: 'Caring for his brother', quote: 'The insurance explainer alone is worth it. I finally understand what Medicare actually covers.' },
  { name: 'Jennifer L.', role: 'Caring for both parents', quote: 'The AI assistant is like having a knowledgeable friend available at 2am when the anxiety hits.' },
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

      {/* Testimonials */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>From caregivers like you</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: C.text, letterSpacing: -0.5 }}>Stories from our community</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(({ name, role, quote }) => (
              <div key={name} style={{ background: C.bgWarm, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} color={C.peach} fill={C.peach} />)}
                </div>
                <p style={{ fontSize: 14, color: '#4a4038', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>"{quote}"</p>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{role}</p>
                </div>
              </div>
            ))}
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
          <Heart size={32} color="rgba(255,255,255,0.6)" fill="rgba(255,255,255,0.6)" style={{ marginBottom: 20 }} />
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
