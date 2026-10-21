import { Link } from 'react-router-dom';
import { Heart, CalendarDays, Shield, ClipboardList, MessageCircle, ArrowRight, Check, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, shadow } from '../theme';

const FEATURES = [
  { icon: Heart,         color: C.rose,     title: 'Care profiles',         desc: 'Keep everything in one place — conditions, medications, doctors, and emergency contacts for each person you care for.' },
  { icon: CalendarDays,  color: C.primary,  title: 'Appointment calendar',   desc: 'Track every appointment across all your care recipients in a clear, colour-coded calendar. Never miss a check-up.' },
  { icon: Shield,        color: C.lavender, title: 'Insurance decoded',       desc: "Medicare, Medicaid, and private plans explained in plain English so you always know what's covered." },
  { icon: ClipboardList, color: C.sage,     title: 'Legal checklist',         desc: 'Power of attorney, advance directives, HIPAA forms — a guided checklist so nothing critical falls through the cracks.' },
  { icon: MessageCircle, color: C.peach,    title: 'Ask Aiden AI',            desc: 'Instant, compassionate answers to your caregiving questions — medical, legal, insurance, and emotional support.' },
  { icon: Users,         color: C.primary,  title: 'Up to 3 care recipients', desc: 'Add yourself and up to 2 others — a parent, sibling, or any loved one who needs your regular care and coordination.' },
];

const INCLUDED = [
  'All care features — profiles, calendar, documents, checklist',
  'AI assistant (Ask Aiden) — unlimited questions',
  'Up to 3 care recipients',
  'iOS & web access',
  'Always free for individuals',
];

export default function ForIndividuals() {
  return (
    <div style={{ background: C.bg }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #fdf6f5 0%, #f0e8f5 50%, #e8eff8 100%)', padding: '140px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(192,147,138,0.12)', border: `1px solid ${C.rose}40`, borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
            <Heart size={12} color={C.roseDark} fill={C.roseDark} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.5 }}>FOR INDIVIDUALS & FAMILIES</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 6vw, 60px)', lineHeight: 1.15, color: C.text, marginBottom: 20, letterSpacing: -1 }}>
            Caregiving support<br />built for families
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 1.8, maxWidth: 540, margin: '0 auto 36px' }}>
            Whether you're caring for a parent, a sibling, or a loved one with a disability — Aiden keeps everything organised so you can focus on what matters.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.roseDark, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <Link to="/businesses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: C.text, textDecoration: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}` }}>
              Looking for a business plan?
            </Link>
          </div>
          <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 16 }}>Free forever · No credit card · iOS & web</p>
        </div>
      </section>

      {/* What's included */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>Everything included, free</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px, 4vw, 36px)', color: C.text, letterSpacing: -0.5 }}>Nothing held back</h2>
          </div>
          <div style={{ background: C.bgWarm, borderRadius: 20, padding: '28px 32px', border: `1px solid ${C.border}` }}>
            {INCLUDED.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < INCLUDED.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#4a9e7a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={12} color="#fff" strokeWidth={2.5} />
                </div>
                <p style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{item}</p>
              </div>
            ))}
            <div style={{ marginTop: 24 }}>
              <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.roseDark, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700 }}>
                Create your free account <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 24px', background: C.bgWarm }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>Built for caregivers</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px, 4vw, 38px)', color: C.text, letterSpacing: -0.5 }}>Everything in one place</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, transition: 'box-shadow 0.2s' }}
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

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: C.roseDark, textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: '#fff', marginBottom: 16, letterSpacing: -0.5 }}>You don't have to do this alone</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>
            Join caregivers who use Aiden to stay organised, informed, and supported every day — completely free.
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
