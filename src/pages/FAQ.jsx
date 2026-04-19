import { useState } from 'react';
import { ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif } from '../theme';

const FAQS = [
  {
    category: 'About Aiden',
    items: [
      { q: 'What is Aiden?', a: 'Aiden is a caregiving companion app designed to help family caregivers stay organised, informed, and supported. It brings together care recipient profiles, appointment scheduling, insurance explanations, legal checklists, and an AI-powered assistant — all in one place.' },
      { q: 'Who is Aiden for?', a: 'Aiden is for anyone caring for a loved one — whether that\'s an aging parent, a sibling with a disability, a partner with a chronic illness, or any family member who relies on your support. If you coordinate medical appointments, manage medications, or navigate insurance on someone\'s behalf, Aiden is for you.' },
      { q: 'Is there a free plan?', a: 'Yes! Aiden offers a free tier that lets you set up one care recipient, manage appointments, and access the basics. Premium plans unlock unlimited care recipients, advanced AI features, document storage, and priority support.' },
    ],
  },
  {
    category: 'Privacy & Security',
    items: [
      { q: 'Is my data private and secure?', a: 'Absolutely. All data is encrypted at rest and in transit using industry-standard encryption. We use Firebase (Google Cloud) infrastructure, which meets SOC 2 and ISO 27001 compliance standards. We never sell or share your personal or health information with third parties.' },
      { q: 'Who can see my care recipient\'s information?', a: 'Only you. Each account is private and accessible only to the account holder. We are building family sharing features for a future release, which will allow explicit, consent-based sharing with other family members.' },
      { q: 'Can I delete my account and data?', a: 'Yes. You can delete your account and all associated data at any time from the Account Settings page. Deletion is permanent and irreversible — we do not retain any personal data after deletion.' },
    ],
  },
  {
    category: 'Features',
    items: [
      { q: 'What does the AI assistant (Ask Aiden) do?', a: 'Ask Aiden is your on-demand caregiving advisor. You can ask it questions about managing specific conditions, understanding insurance coverage, navigating legal documents like HIPAA forms and power of attorney, managing caregiver burnout, and much more. It gives thoughtful, informed answers tailored to your specific situation.' },
      { q: 'What does the insurance section cover?', a: 'The insurance section explains each of your care recipient\'s insurance plans in plain language — what is covered, what is not, how to use it, and who to call. We cover Medicare (Parts A, B, C, D), Medicaid, Humana, Blue Cross Blue Shield, and many other major plans.' },
      { q: 'Can I track multiple care recipients?', a: 'Yes. Aiden is built for caregivers who look after more than one person. Each care recipient has their own profile, appointments, medications, doctors, and insurance plan.' },
      { q: 'What is the legal checklist?', a: 'The legal checklist walks you through the essential legal and financial documents every caregiver should have in place — including power of attorney, advance directives, HIPAA authorisations, financial account access, and more. Each item can be checked off as complete, and some items link directly to trusted services like Trust & Will.' },
    ],
  },
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I add a care recipient?', a: 'After creating an account and signing in, tap "Add a care recipient" on the Home screen. You\'ll be guided through entering their name, age, conditions, medications, insurance plans, and care team. You can always update this information later.' },
      { q: 'What devices does Aiden support?', a: 'Aiden is available as a native iOS app (iPhone and iPad) and as a full-featured web app that works in any modern browser on desktop, tablet, or mobile. Your data syncs seamlessly across all devices.' },
      { q: 'Can I share my Aiden account with other family members?', a: 'Shared accounts are on our roadmap and coming soon. For now, each account is individual. In the meantime, you can export information and share it manually with other family members.' },
      { q: 'How do I reset my password?', a: 'On the sign-in screen, click "Forgot password?" below the password field. Enter your email address and we\'ll send you a secure reset link. Check your spam or junk folder if it doesn\'t appear within a few minutes.' },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', background: open ? C.bgWarm : '#fff', transition: 'background 0.2s' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.5 }}>{q}</span>
        {open ? <ChevronUp size={18} color={C.muted} style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color={C.muted} style={{ flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px' }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div style={{ background: C.bg }}>
      <Navbar />

      {/* Header */}
      <section style={{ background: 'linear-gradient(160deg, #fdf6f5, #f0eaf8)', padding: '120px 24px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12 }}>FAQ</p>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5vw, 52px)', color: C.text, marginBottom: 16, letterSpacing: -0.5 }}>Frequently asked questions</h1>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7 }}>Everything you need to know about Aiden. Can't find an answer? <Link to="/login" style={{ color: C.roseDark, fontWeight: 600 }}>Sign in and ask Aiden directly.</Link></p>
        </div>
      </section>

      {/* FAQ sections */}
      <section style={{ padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
          {FAQS.map(({ category, items }) => (
            <div key={category}>
              <h2 style={{ fontFamily: serif, fontSize: 22, color: C.text, marginBottom: 20, paddingBottom: 12, borderBottom: `2px solid ${C.border}` }}>{category}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => <FAQItem key={item.q} {...item} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section style={{ padding: '60px 24px', background: C.bgWarm, textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <Heart size={28} color={C.rose} fill={C.rose} style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: serif, fontSize: 28, color: C.text, marginBottom: 12 }}>Still have questions?</h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>Sign in and Ask Aiden directly — our AI assistant is always available to help you navigate caregiving.</p>
          <Link to="/login" style={{ display: 'inline-block', background: C.roseDark, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700 }}>
            Sign in and ask Aiden
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
