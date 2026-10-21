import { Link } from 'react-router-dom';
import { Building2, Users, ShieldCheck, BarChart2, ArrowRight, Check, Star, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, shadow } from '../theme';

const FEATURES = [
  { icon: Users,        color: C.primary,  title: 'Unlimited care recipients',  desc: 'Add every resident or client to Aiden with no caps. Each person gets a complete profile — conditions, medications, emergency contacts, and more.' },
  { icon: ShieldCheck,  color: C.sage,     title: 'Role-based team access',      desc: 'Owner, Admin, Caregiver, Viewer — assign the right level of access to each team member so everyone sees only what they need to.' },
  { icon: Building2,    color: C.lavender, title: 'Organisation management',     desc: 'Invite staff by email, manage roles, and see your whole team from one central dashboard. No IT department required.' },
  { icon: BarChart2,    color: C.peach,    title: 'Shared calendar & tasks',     desc: 'Keep appointments, to-dos, and check-ins coordinated across your entire team — no more miscommunication between shifts.' },
  { icon: Star,         color: C.rose,     title: 'Everything in the free plan',  desc: 'All individual features included — care profiles, insurance guidance, legal checklist, AI assistant — for every care recipient.' },
];

const ORG_TYPES = [
  'Personal care homes',
  'Assisted living facilities',
  'Skilled nursing facilities',
  'Home care agencies',
  'Adult day programs',
];

const STEPS = [
  { n: '1', title: 'Create your account', desc: 'Sign up for free at aidencare.co — takes under a minute.' },
  { n: '2', title: 'Upgrade to Business', desc: 'Go to your Account settings and select "Upgrade to Business". Choose your organisation type and name.' },
  { n: '3', title: 'Invite your team', desc: 'Add team members by email and assign each person a role. They\'ll receive an invite and can join right away.' },
];

export default function ForBusinesses() {
  return (
    <div style={{ background: C.bg }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #f0e8f5 0%, #e8f0fa 50%, #e8f5ee 100%)', padding: '140px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(100,120,180,0.1)', border: `1px solid ${C.primary}40`, borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
            <Building2 size={12} color={C.primary} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: 0.5 }}>FOR CARE FACILITIES & AGENCIES</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 6vw, 60px)', lineHeight: 1.15, color: C.text, marginBottom: 20, letterSpacing: -1 }}>
            Professional caregiving,<br />powered by Aiden
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 36px' }}>
            Built for personal care homes, assisted living facilities, and home care agencies who need a simple, organised way to manage care across their entire team.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.primary, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <Link to="/individuals" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: C.text, textDecoration: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}` }}>
              Individual caregivers →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 16 }}>Free during beta · No credit card · No limit on care recipients</p>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: '60px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.primary, textTransform: 'uppercase', marginBottom: 16 }}>Who uses Aiden for Business</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {ORG_TYPES.map(t => (
              <span key={t} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '7px 16px', fontSize: 14, fontWeight: 600, color: C.text }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 24px', background: C.bgWarm }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.primary, textTransform: 'uppercase', marginBottom: 12 }}>Business features</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px, 4vw, 38px)', color: C.text, letterSpacing: -0.5 }}>Everything your team needs</h2>
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

      {/* How it works */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.primary, textTransform: 'uppercase', marginBottom: 12 }}>Getting started</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px, 4vw, 36px)', color: C.text, letterSpacing: -0.5 }}>Up and running in minutes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', background: C.bgWarm, borderRadius: 20, padding: '22px 24px', border: `1px solid ${C.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{n}</span>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '72px 24px', background: C.bgWarm }}>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.primary, textTransform: 'uppercase', marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px, 4vw, 36px)', color: C.text, marginBottom: 16, letterSpacing: -0.5 }}>Free during beta</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 32 }}>
            Aiden for Business is completely free while we're in beta. We'll notify you well in advance before introducing any paid plans, and early adopters will always receive preferential pricing.
          </p>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: `1px solid ${C.border}`, textAlign: 'left' }}>
            {[
              'Unlimited care recipients',
              'Unlimited team members',
              'All business & individual features',
              'Priority support during beta',
              'Locked-in early adopter rate',
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#4a9e7a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color="#fff" strokeWidth={2.5} />
                </div>
                <p style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{item}</p>
              </div>
            ))}
            <div style={{ marginTop: 24 }}>
              <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.primary, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700 }}>
                Get started free <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: C.primary, textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(26px, 4vw, 40px)', color: '#fff', marginBottom: 16, letterSpacing: -0.5 }}>
            Ready to bring your team together?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>
            Sign up free, upgrade to Business in settings, and invite your team — all in under five minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login?mode=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: C.primary, textDecoration: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>
              Start free <ArrowRight size={16} />
            </Link>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600 }}>
              Talk to us <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
