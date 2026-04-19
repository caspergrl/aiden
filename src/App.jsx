import { useState, useRef, useEffect } from "react";
import AuthScreen from './AuthScreen';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, addDoc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import {
  Home, CalendarDays, ClipboardList, Shield, MessageCircle,
  Plus, ChevronRight, ChevronLeft, Phone, Heart,
  CheckSquare, Square, Send, Clock, FileText,
  AlertCircle, Bell, Check, Info, ExternalLink, Eye, EyeOff, User,
  Scale, ArrowRightLeft, Users,
  Camera, Pencil, Trash2, X,
} from "lucide-react";

// ─── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  primary:       "#7a9dc2",
  primaryLight:  "#dde8f5",
  primaryDark:   "#4a6d8e",
  rose:          "#c4938a",
  roseLight:     "#f8f0ee",
  blue:          "#8aaabf",
  blueLight:     "#e4eef6",
  bg:            "#ffffff",
  card:          "#ffffff",
  border:        "#ede5d8",
  text:          "#26201a",
  muted:         "#8a8076",
  mutedLight:    "#b4aca2",
  sage:          "#8ab5a0",
  peach:         "#d4a87c",
  coral:         "#c4746e",
  lavender:      "#a89ac4",
  lavenderLight: "#f0ecf8",
};

const GRAD = "linear-gradient(160deg, #fdf6f5 0%, #ffffff 60%)";
const CARD_SHADOW = "0 4px 24px rgba(80,60,40,0.07), 0 1px 4px rgba(80,60,40,0.04)";
const CARD_SHADOW_SM = "0 2px 12px rgba(80,60,40,0.06)";

// ─── DATA ──────────────────────────────────────────────────────────────────────

const DAILY_MESSAGES = [
  "Every small act of care you give today matters more than you know. You are someone's whole world.",
  "You don't have to do everything perfectly. Showing up with love is enough.",
  "Taking care of yourself is part of taking care of them. Rest is not selfish — it is necessary.",
  "Caregiving is one of the most profound acts of love a person can offer. Your dedication is extraordinary.",
  "It's okay to feel overwhelmed sometimes. That means you care deeply. Give yourself grace today.",
  "You are doing a hard, beautiful, important thing. Don't forget to celebrate yourself too.",
  "The person you care for is lucky to have you — even on the days it doesn't feel that way.",
  "One step at a time. You don't have to solve everything today. Just be present.",
  "Caregiving asks so much of you. Please don't forget to ask something of yourself — rest, joy, connection.",
  "Your patience and love are quietly shaping someone's entire experience of the world. That is everything.",
  "Today might be hard. That's okay. Hard days pass, and your strength remains.",
  "You are not alone in this. Millions of people walk this road. Reach out when you need to.",
  "Breathe. You are enough. What you are doing is enough. You are more capable than you realize.",
  "Even the smallest moments of joy — a smile, a song, a shared meal — are worth cherishing.",
  "There is no perfect way to be a caregiver. There is only your way, done with love.",
  "Your loved one sees your love, even when words are hard. Presence is the greatest gift.",
  "It's okay to grieve the things that have changed while still celebrating what remains.",
  "You are building something invisible and irreplaceable: a legacy of compassion and devotion.",
  "Accepting help is not weakness. It is wisdom. You deserve a village too.",
  "The hard conversations, the long drives, the middle-of-the-night moments — they all count.",
  "You show up even when it's hard. That quiet consistency is one of the most loving things a person can do.",
  "Caregiving teaches us what truly matters. You are living that lesson with grace.",
  "Today, do one small thing for yourself. Even five minutes of something that restores you.",
  "Love is action. And every action you take in care is a profound expression of love.",
  "You are navigating one of life's most complex seasons. Be proud of how far you've come.",
  "It's okay not to have all the answers. Doing your best with what you know is always enough.",
  "The person you're caring for may not be able to say it today, but your love reaches them.",
  "You carry a lot. Please remember that you're allowed to put some of it down for a little while.",
  "Your empathy and endurance are remarkable. Don't let the hard days make you forget that.",
  "Every day you show up is a gift. Thank you for being someone who shows up.",
  "You are doing sacred work. The love you give quietly sustains someone else's whole world.",
];

const INITIAL_RECIPIENTS = [
  {
    id: 1, name: "Margaret Chen", nickname: "Mom", age: 78,
    email: "margaret.chen@email.com", phone: "(555) 123-4567",
    relationship: "Parent", photo: null,
    conditions: ["Type 2 Diabetes", "Mild Cognitive Impairment", "Hypertension"],
    medications: ["Metformin", "Lisinopril", "Donepezil"],
    insurancePlans: ["medicare", "humana"],
    notes: "Prefers morning appointments. Gets anxious in new environments. Enjoys crossword puzzles and classical music. Needs transportation assistance.",
    importantNumbers: [
      { label: "Dr. Kim's office", number: "(555) 200-1000" },
      { label: "CVS Pharmacy", number: "(555) 500-3000" },
      { label: "City Medical Center", number: "(555) 300-0000" },
      { label: "Medicare helpline", number: "1-800-633-4227" },
    ],
  },
  {
    id: 2, name: "Thomas Chen", nickname: "Tommy", age: 45,
    email: "tommy.chen@email.com", phone: "(555) 987-6543",
    relationship: "Sibling", photo: null,
    conditions: ["Down Syndrome", "Hypothyroidism"],
    medications: ["Levothyroxine"],
    insurancePlans: ["medicaid", "bcbs"],
    notes: "Follows routines well. Enjoys music therapy. Day program Tuesdays & Thursdays at Sunrise Center. Loves baseball and cooking shows.",
    importantNumbers: [
      { label: "Sunrise Day Program", number: "(555) 400-2000" },
      { label: "Dr. Park's office", number: "(555) 200-4000" },
      { label: "Medicaid helpline", number: "1-877-267-2323" },
    ],
  },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, recipientId: 1, title: "Cardiology Follow-up", date: "2026-03-28", time: "10:00 AM", location: "City Medical Center, Suite 302", doctor: "Dr. Robert Lee" },
  { id: 2, recipientId: 2, title: "Day Program – Music Therapy", date: "2026-03-26", time: "10:00 AM", location: "Sunrise Day Program", doctor: "" },
  { id: 3, recipientId: 1, title: "Annual Physical", date: "2026-04-05", time: "9:00 AM", location: "Primary Care Associates", doctor: "Dr. Sarah Kim" },
  { id: 4, recipientId: 2, title: "Neurologist Check-in", date: "2026-04-02", time: "2:30 PM", location: "Neurology Specialists", doctor: "Dr. James Park" },
  { id: 5, recipientId: 1, title: "Memory Care Assessment", date: "2026-04-15", time: "11:00 AM", location: "Cognitive Health Institute", doctor: "Dr. Angela Torres" },
];

const INITIAL_DOCTORS = [
  { id: 1, recipientId: 1, name: "Dr. Sarah Kim", specialty: "Primary Care", phone: "(555) 200-1000", address: "123 Main St, Suite 1", notes: "Primary physician" },
  { id: 2, recipientId: 1, name: "Dr. Robert Lee", specialty: "Cardiology", phone: "(555) 200-2000", address: "City Medical Center, Suite 302", notes: "" },
  { id: 3, recipientId: 1, name: "Dr. Angela Torres", specialty: "Neurology / Memory Care", phone: "(555) 200-3000", address: "Cognitive Health Institute", notes: "Specializes in dementia care" },
  { id: 4, recipientId: 2, name: "Dr. James Park", specialty: "Developmental Medicine", phone: "(555) 200-4000", address: "Neurology Specialists, Bldg B", notes: "Great with Tommy" },
];

const INITIAL_LOGISTICS = [
  { id: 1, title: "Will (ensure it's notarized)", completed: true, note: "Notarized March 2025", partnerLink: "trust-will" },
  { id: 2, title: "Advanced Directive / Living Will", completed: true, note: "On file at City Medical Center", partnerLink: null },
  { id: 3, title: "HIPAA Authorization Forms", completed: false, note: "", partnerLink: null },
  { id: 4, title: "Durable Power of Attorney", completed: false, note: "", partnerLink: "trust-will" },
  { id: 5, title: "Access to Financial Accounts", completed: false, note: "Need to be added to bank accounts", partnerLink: null },
  { id: 6, title: "Healthcare Proxy Designation", completed: false, note: "", partnerLink: null },
  { id: 7, title: "Long-term Care Insurance Review", completed: false, note: "", partnerLink: null },
  { id: 8, title: "Social Security Beneficiary Update", completed: false, note: "", partnerLink: null },
];

const INSURANCE_INFO = {
  medicare:  { name: "Medicare", shortName: "Medicare", color: "#6880a8", bg: "#edf1f8", emoji: "🏛️",
    parts: [
      { name: "Part A – Hospital Insurance", plain: "Covers inpatient hospital stays, skilled nursing facility care (up to 100 days after a hospital stay), hospice care, and some home health services. No monthly premium if you've worked 10+ years.", phone: "1-800-633-4227" },
      { name: "Part B – Medical Insurance", plain: "Covers doctor visits, outpatient care, preventive services like flu shots and screenings, and durable medical equipment. Monthly premium is around $185/month in 2026.", phone: "1-800-633-4227" },
      { name: "Part D – Prescriptions", plain: "Covers prescription drugs through private plans. Each plan has its own list of covered drugs. Review your plan's formulary annually during open enrollment.", phone: "1-800-633-4227" },
    ], warning: "⚠️ Medicare does NOT cover long-term custodial care. Consider a supplemental Medigap plan or long-term care insurance." },
  humana:    { name: "Humana Medicare Advantage", shortName: "Humana", color: "#5e8a78", bg: "#edf4f0", emoji: "🌿",
    parts: [{ name: "Part C – Medicare Advantage", plain: "Bundles Medicare Parts A & B, often including Part D, dental, vision, and hearing. Usually lower premiums but you must use network providers and may need referrals for specialists.", phone: "1-800-833-6917" }],
    warning: "⚠️ Always confirm a provider is in-network before scheduling. Referrals usually required for specialists." },
  medicaid:  { name: "Medicaid", shortName: "Medicaid", color: "#8878a8", bg: "#f0ecf8", emoji: "🏥",
    parts: [{ name: "Full Coverage", plain: "Comprehensive health coverage for eligible individuals. Covers doctor visits, hospital care, long-term care, mental health, prescriptions, and home care services. Coverage varies by state.", phone: "1-877-267-2323" }],
    warning: "✅ Unlike Medicare, Medicaid CAN cover long-term custodial care and home care services." },
  bcbs:      { name: "Blue Cross Blue Shield", shortName: "BCBS", color: "#6880a8", bg: "#edf1f8", emoji: "🔵",
    parts: [{ name: "Employer / Individual Plan", plain: "Varies by plan. Typically includes preventive care, specialist visits, mental health, prescriptions, and hospital stays. Review your Summary of Benefits for exact details.", phone: "1-888-630-2583" }],
    warning: "⚠️ Many procedures require prior authorization. Always verify before scheduling." },
};

const CAREGIVING_RECS = {
  "Mild Cognitive Impairment": ["Schedule regular cognitive assessments with a neurologist — track changes over time.", "Establish consistent daily routines to reduce confusion and anxiety.", "Research memory care facilities early — before a crisis, not during one.", "Consider a medical alert device or GPS tracker for safety and peace of mind.", "Attend a caregiver support group for dementia and MCI families.", "Simplify her living environment — reduce clutter, label cabinets, improve lighting."],
  "Type 2 Diabetes": ["Monitor blood sugar levels regularly and keep a log to share with Dr. Kim.", "Coordinate with a registered dietitian for a diabetes-friendly meal plan.", "Ensure regular A1C testing every 3–6 months.", "Know the signs of low blood sugar: shakiness, confusion, sweating.", "Keep glucose tablets or juice accessible at home and when traveling."],
  "Hypertension": ["Monitor blood pressure at home using a cuff and log daily readings.", "Reduce sodium intake — aim for under 2,300mg/day.", "Encourage light exercise such as short daily walks.", "Review all medications with the prescribing doctor twice a year."],
  "Down Syndrome": ["Annual thyroid screening is essential — hypothyroidism is very common in adults with Down syndrome.", "Schedule regular vision and hearing exams every 1–2 years.", "Cervical spine X-rays are recommended due to atlantoaxial instability risk.", "Begin supported living and employment planning as early as possible.", "Connect with your local Arc chapter for services, advocacy, and peer support.", "Annual cardiology screening is recommended even in adulthood."],
  "Hypothyroidism": ["Ensure Levothyroxine is taken consistently — same time every day, on an empty stomach.", "TSH levels should be checked every 6–12 months.", "Watch for signs of under-treatment: fatigue, unexplained weight gain, or depression."],
};

const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const CHAT_RESPONSES = {
  memory: "Memory changes with Mild Cognitive Impairment can be subtle at first. Watch for increasing forgetfulness that disrupts daily life, getting lost in familiar places, trouble with multi-step tasks, and personality or mood changes. If these worsen, talk to Dr. Torres about a full neuropsychological evaluation. Consistent routines and a simplified environment can also make a meaningful difference.",
  hipaa: "A HIPAA Authorization form allows healthcare providers to share your loved one's medical information with you. Request one from any doctor's office, or download a standard form online. Once signed, keep a copy with each provider and one at home. This is on your logistics checklist — worth doing soon.",
  directive: "An Advance Directive specifies what medical treatment someone wants if they can't communicate — covering life support, resuscitation, feeding tubes, and end-of-life care. It should be notarized, shared with all providers, and kept somewhere accessible. Trust & Will can help you complete this.",
  burnout: "Caregiver burnout is real and serious. Signs include persistent exhaustion, resentment, neglecting your own health, and withdrawing from others. What helps: schedule regular breaks, accept help, join a support group (AARP and Caregiver Action Network are wonderful), set clear boundaries, and keep your own appointments. You cannot pour from an empty cup, Holly.",
  default: "That's a thoughtful question. I'm here to help with medical coordination, legal documents, insurance, provider communication, and the emotional side of caregiving. Tell me more about what you're navigating and I'll do my best to help.",
};

const SUGGESTIONS = [
  "What signs should I watch for with Mom's memory?",
  "How do I get a HIPAA authorization form?",
  "What is an Advanced Directive?",
  "How do I manage caregiver burnout?",
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const serif = "'Ledger', Georgia, serif";
const sans  = "'Ledger', Georgia, serif";

function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(m, y) { return new Date(y, m, 1).getDay(); }
function rColor(id) { return id === 1 ? C.rose : C.blue; }
function rLightColor(id) { return id === 1 ? C.roseLight : C.blueLight; }
function initials(name) { return name.split(" ").map(n => n[0]).join("").slice(0, 2); }
function getDailyMessage() { return DAILY_MESSAGES[(new Date("2026-03-25").getDate() - 1) % DAILY_MESSAGES.length]; }
function getResponse(text) {
  const t = text.toLowerCase();
  if (t.includes("memory") || t.includes("cognitive")) return CHAT_RESPONSES.memory;
  if (t.includes("hipaa")) return CHAT_RESPONSES.hipaa;
  if (t.includes("directive") || t.includes("living will")) return CHAT_RESPONSES.directive;
  if (t.includes("burnout") || t.includes("overwhelm") || t.includes("stress") || t.includes("tired")) return CHAT_RESPONSES.burnout;
  return CHAT_RESPONSES.default;
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────────

function Avatar({ r, size = 44 }) {
  const col = rColor(r.id);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${col}bb, ${col})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: serif, fontWeight: 700, fontSize: size * 0.32, flexShrink: 0, boxShadow: `0 4px 14px ${col}44` }}>
      {initials(r.name)}
    </div>
  );
}

function Pill({ label, color }) {
  return <span style={{ background: color + "16", color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: sans, whiteSpace: "nowrap" }}>{label}</span>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, borderRadius: 22, padding: 18, boxShadow: CARD_SHADOW, ...style }}>{children}</div>;
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 700, color: C.mutedLight, letterSpacing: 1.2, marginBottom: 12, textTransform: "uppercase", fontFamily: sans }}>{children}</p>;
}

function BackBtn({ onBack, label = "Back" }) {
  return (
    <button onClick={onBack} style={{ background: C.card, border: "none", borderRadius: 20, padding: "7px 14px", color: C.muted, fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginBottom: 16, boxShadow: CARD_SHADOW_SM }}>
      <ChevronLeft size={15} />{label}
    </button>
  );
}

// ─── DAILY MESSAGE ─────────────────────────────────────────────────────────────

function DailyMessageCard({ onHide }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #e8eff8 0%, #f0eaf8 50%, #f8eded 100%)", borderRadius: 22, padding: "18px 20px", marginBottom: 20, boxShadow: CARD_SHADOW_SM, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.2, marginBottom: 10, textTransform: "uppercase", fontFamily: sans }}>✦ Today's message</p>
          <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, fontFamily: serif, fontStyle: "italic", fontWeight: 400 }}>"{getDailyMessage()}"</p>
          <p style={{ fontSize: 11, color: C.mutedLight, marginTop: 10, fontFamily: sans }}>— Aiden</p>
        </div>
        <button onClick={onHide} style={{ background: "rgba(255,255,255,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <EyeOff size={13} color={C.muted} />
        </button>
      </div>
    </div>
  );
}

function ShowMessageBtn({ onShow }) {
  return (
    <button onClick={onShow} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: `1px dashed ${C.border}`, borderRadius: 14, padding: "8px 14px", color: C.mutedLight, fontSize: 12, fontWeight: 500, fontFamily: sans, cursor: "pointer", marginBottom: 20 }}>
      <Eye size={13} /> Show today's message
    </button>
  );
}

// ─── HOME TAB ──────────────────────────────────────────────────────────────────

function HomeTab({ recipients, appointments, logistics, onSelect, onGoToList, showMsg, setShowMsg, onShowAddEvent }) {
  const pending = logistics.filter(l => !l.completed).length;
  const sorted = [...appointments].sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time));

  function fmtDate(d) {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div style={{ padding: "20px 18px 8px" }}>
      <p style={{ color: C.mutedLight, fontSize: 12, fontFamily: sans, letterSpacing: 0.3, marginBottom: 4 }}>Wednesday, March 25, 2026</p>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: C.text, marginBottom: 20, fontFamily: serif, letterSpacing: -0.5, lineHeight: 1.25 }}>Good morning,<br /><em>Holly.</em></h1>

      {showMsg ? <DailyMessageCard onHide={() => setShowMsg(false)} /> : <ShowMessageBtn onShow={() => setShowMsg(true)} />}

      {/* Alert row */}
      {pending > 0 && (
        <button onClick={() => onGoToList()} style={{ width: "100%", background: "#fdf6f5", borderRadius: 18, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center", boxShadow: "0 2px 12px rgba(180,80,70,0.08)", border: "none", cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#904848", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "white", fontFamily: sans, lineHeight: 1 }}>{pending}</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#7a3a34", fontFamily: sans }}>items need your attention</p>
          <ChevronRight size={13} color={C.coral} style={{ marginLeft: "auto", flexShrink: 0 }} />
        </button>
      )}

      {/* Upcoming appointments */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: serif }}>Upcoming Appointments</p>
        <button onClick={onShowAddEvent} style={{ display: "flex", alignItems: "center", gap: 4, background: C.primaryLight, border: "none", borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: C.primaryDark, fontFamily: sans, cursor: "pointer" }}>
          <Plus size={13} /> Add event
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {sorted.map(appt => {
          const r = recipients.find(x => x.id === appt.recipientId);
          const col = r?.id === 1 ? C.rose : C.blue;
          return (
            <div key={appt.id} style={{ background: C.card, borderRadius: 18, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: CARD_SHADOW_SM }}>
              {/* Avatar */}
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: col + "22", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 13, fontWeight: 700, color: col, flexShrink: 0 }}>
                {r ? initials(r.name) : "?"}
              </div>
              {/* Date badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 34, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: sans }}>{fmtDate(appt.date).split(" ")[0]}</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.1, fontFamily: serif }}>{fmtDate(appt.date).split(" ")[1]}</span>
              </div>
              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: sans, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.title}</p>
                <p style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginTop: 2 }}>{appt.time}{appt.doctor ? ` · ${appt.doctor}` : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RECIPIENTS PAGE ────────────────────────────────────────────────────────────

function RecipientsPage({ recipients, onSelect, onBack }) {
  return (
    <div style={{ padding: "20px 18px 8px" }}>
      <BackBtn onBack={onBack} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: C.text, fontFamily: serif, letterSpacing: -0.5 }}>People I'm<br /><em>Caring For</em></h1>
        <button style={{ background: C.primaryLight, border: "none", color: C.primaryDark, fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, borderRadius: 20, padding: "7px 14px" }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {recipients.map(r => (
        <button key={r.id} onClick={() => onSelect(r)} style={{ width: "100%", background: C.card, border: "none", borderRadius: 22, padding: "16px 18px", textAlign: "left", cursor: "pointer", marginBottom: 12, boxShadow: CARD_SHADOW, display: "block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar r={r} size={54} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: serif }}>{r.name}</span>
                <span style={{ fontSize: 10, color: C.muted, background: C.bg, borderRadius: 10, padding: "2px 8px", fontWeight: 600, fontFamily: sans }}>{r.relationship}</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontFamily: sans }}>Age {r.age} · {r.conditions[0]}{r.conditions.length > 1 ? ` +${r.conditions.length - 1}` : ""}</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {r.insurancePlans.map(p => <Pill key={p} label={INSURANCE_INFO[p].shortName} color={INSURANCE_INFO[p].color} />)}
              </div>
            </div>
            <ChevronRight size={16} color={C.border} style={{ flexShrink: 0 }} />
          </div>
        </button>
      ))}

      <button style={{ width: "100%", border: `1.5px dashed ${C.border}`, borderRadius: 22, padding: "14px 18px", background: "none", color: C.mutedLight, fontSize: 13, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Plus size={16} /> Add a care recipient
      </button>
    </div>
  );
}

// ─── RECIPIENT PROFILE ─────────────────────────────────────────────────────────

function EditInput({ value, onChange, placeholder, multiline }) {
  const s = { width: "100%", background: "#f7f5f2", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: sans, color: C.text, outline: "none", boxSizing: "border-box" };
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...s, resize: "none", lineHeight: 1.6 }} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s} />;
}

function EditBtn({ onClick, col }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginTop: -12, display: "flex", alignItems: "center", gap: 4, color: col, fontSize: 12, fontFamily: sans, fontWeight: 600 }}>
      <Pencil size={12} /> Edit
    </button>
  );
}

function SaveCancelRow({ onSave, onCancel, col }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button onClick={onSave} style={{ flex: 1, background: col, border: "none", borderRadius: 12, padding: "9px 0", color: "white", fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: "pointer" }}>Save</button>
      <button onClick={onCancel} style={{ flex: 1, background: C.bg, border: "none", borderRadius: 12, padding: "9px 0", color: C.muted, fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: "pointer" }}>Cancel</button>
    </div>
  );
}

function RecipientProfile({ r, onBack, onUpdate, doctors, appointments }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ ...r });
  const [editSection, setEditSection] = useState(null);
  const [buf, setBuf] = useState({});
  const [openSections, setOpenSections] = useState(new Set(["numbers"]));
  const fileRef = useRef();

  function toggleSection(key) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const col = rColor(data.id);
  const myDoctors = doctors.filter(d => d.recipientId === data.id);
  const myAppts = appointments.filter(a => a.recipientId === data.id);
  const profileGrad = data.id === 1
    ? "linear-gradient(148deg, #ede0dc 0%, #e0d4ec 100%)"
    : "linear-gradient(148deg, #d8e4f2 0%, #d4d8f0 100%)";

  function save(updates) {
    const updated = { ...data, ...updates };
    setData(updated);
    onUpdate && onUpdate(updated);
    setEditSection(null);
    setBuf({});
  }

  function startEdit(section, initial) {
    setEditSection(section);
    setBuf(initial);
  }

  function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    save({ photo: url });
  }

  // ── List helpers ──────────────────────────────────────────────────────────
  function addItem(key, val) {
    if (!val.trim()) return;
    save({ [key]: [...data[key], val.trim()] });
  }
  function removeItem(key, idx) {
    save({ [key]: data[key].filter((_, i) => i !== idx) });
  }
  function updateItem(key, idx, val) {
    const arr = [...data[key]];
    arr[idx] = val;
    save({ [key]: arr });
  }

  // shared row style
  const rowStyle = (last) => ({ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: last ? "none" : `1px solid ${C.bg}` });

  return (
    <div>
      <div style={{ background: profileGrad, padding: "16px 18px 0" }}>
        <BackBtn onBack={onBack} />

        {/* Avatar + basic info */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 18 }}>
          {/* Tappable avatar with camera overlay */}
          <div style={{ position: "relative", flexShrink: 0 }} onClick={() => fileRef.current.click()}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: data.photo ? "transparent" : "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 22, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", color: col, overflow: "hidden", cursor: "pointer" }}>
              {data.photo
                ? <img src={data.photo} alt={data.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials(data.name)}
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: col, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
              <Camera size={11} color="white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>

          {editSection === "basic" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <EditInput value={buf.name ?? data.name} onChange={v => setBuf(b => ({ ...b, name: v }))} placeholder="Full name" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <EditInput value={buf.nickname ?? data.nickname} onChange={v => setBuf(b => ({ ...b, nickname: v }))} placeholder="Nickname" />
                <EditInput value={buf.age ?? data.age} onChange={v => setBuf(b => ({ ...b, age: v }))} placeholder="Age" />
              </div>
              <EditInput value={buf.relationship ?? data.relationship} onChange={v => setBuf(b => ({ ...b, relationship: v }))} placeholder="Relationship" />
              <EditInput value={buf.email ?? data.email} onChange={v => setBuf(b => ({ ...b, email: v }))} placeholder="Email" />
              <EditInput value={buf.phone ?? data.phone} onChange={v => setBuf(b => ({ ...b, phone: v }))} placeholder="Phone" />
              <SaveCancelRow col={col} onSave={() => save(buf)} onCancel={() => setEditSection(null)} />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: col, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: sans, marginBottom: 4 }}>{data.relationship}</p>
              <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: serif, color: C.text, letterSpacing: -0.3, marginBottom: 3 }}>{data.name}</h2>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginBottom: 6 }}>Age {data.age} · {data.email}</p>
              <button onClick={() => startEdit("basic", {})} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.5)", border: "none", borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: col, fontFamily: sans, cursor: "pointer" }}>
                <Pencil size={10} /> Edit info
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {["overview", "guidance", "notes"].map(t => (
            <button key={t} onClick={() => { setTab(t); setEditSection(null); }} style={{ flex: 1, padding: "11px 4px", background: "none", border: "none", fontWeight: tab === t ? 700 : 400, fontSize: 12, color: tab === t ? C.text : C.muted, fontFamily: sans, cursor: "pointer", borderBottom: tab === t ? `2px solid ${col}` : "2px solid transparent", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 18px" }}>
        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {/* Conditions */}
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionLabel>Conditions</SectionLabel>
                <EditBtn col={col} onClick={() => startEdit("conditions", { newItem: "" })} />
              </div>
              {data.conditions.map((c, i) => (
                <div key={i} style={rowStyle(i === data.conditions.length - 1 && editSection !== "conditions")}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
                  {editSection === "conditions"
                    ? <EditInput value={c} onChange={v => updateItem("conditions", i, v)} />
                    : <span style={{ fontSize: 14, color: C.text, fontFamily: sans, flex: 1 }}>{c}</span>}
                  {editSection === "conditions" && (
                    <button onClick={() => removeItem("conditions", i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Trash2 size={14} color={C.coral} />
                    </button>
                  )}
                </div>
              ))}
              {editSection === "conditions" && (
                <>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <EditInput value={buf.newItem || ""} onChange={v => setBuf(b => ({ ...b, newItem: v }))} placeholder="Add condition…" />
                    <button onClick={() => { addItem("conditions", buf.newItem || ""); setBuf(b => ({ ...b, newItem: "" })); }} style={{ background: col + "22", border: "none", borderRadius: 10, padding: "0 12px", color: col, fontFamily: sans, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Add</button>
                  </div>
                  <SaveCancelRow col={col} onSave={() => setEditSection(null)} onCancel={() => { setData({ ...data }); setEditSection(null); }} />
                </>
              )}
            </Card>

            {/* Medications */}
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionLabel>Medications</SectionLabel>
                <EditBtn col={col} onClick={() => startEdit("medications", { newItem: "" })} />
              </div>
              {data.medications.map((m, i) => (
                <div key={i} style={rowStyle(i === data.medications.length - 1 && editSection !== "medications")}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.peach, flexShrink: 0 }} />
                  {editSection === "medications"
                    ? <EditInput value={m} onChange={v => updateItem("medications", i, v)} />
                    : <span style={{ fontSize: 14, color: C.text, fontFamily: sans, flex: 1 }}>{m}</span>}
                  {editSection === "medications" && (
                    <button onClick={() => removeItem("medications", i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Trash2 size={14} color={C.coral} />
                    </button>
                  )}
                </div>
              ))}
              {editSection === "medications" && (
                <>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <EditInput value={buf.newItem || ""} onChange={v => setBuf(b => ({ ...b, newItem: v }))} placeholder="Add medication…" />
                    <button onClick={() => { addItem("medications", buf.newItem || ""); setBuf(b => ({ ...b, newItem: "" })); }} style={{ background: C.peach + "33", border: "none", borderRadius: 10, padding: "0 12px", color: C.peach, fontFamily: sans, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Add</button>
                  </div>
                  <SaveCancelRow col={col} onSave={() => setEditSection(null)} onCancel={() => setEditSection(null)} />
                </>
              )}
            </Card>

            {/* Doctors */}
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionLabel>Doctors</SectionLabel>
                <button onClick={() => startEdit("addDoctor", { name: "", specialty: "", phone: "", notes: "" })} style={{ background: "none", border: "none", color: col, fontSize: 12, fontFamily: sans, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, marginTop: -12 }}><Plus size={12} /> Add</button>
              </div>
              {myDoctors.map((d, i) => (
                <div key={d.id} style={rowStyle(i === myDoctors.length - 1)}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: sans }}>{d.name}</p>
                    <p style={{ fontSize: 12, color: col, fontFamily: sans }}>{d.specialty}</p>
                    {d.notes && <p style={{ fontSize: 11, color: C.mutedLight, fontFamily: sans }}>{d.notes}</p>}
                  </div>
                  <button style={{ width: 34, height: 34, background: col + "14", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Phone size={13} color={col} />
                  </button>
                </div>
              ))}
              {editSection === "addDoctor" && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, borderTop: `1px solid ${C.bg}`, paddingTop: 12 }}>
                  <EditInput value={buf.name || ""} onChange={v => setBuf(b => ({ ...b, name: v }))} placeholder="Doctor name" />
                  <EditInput value={buf.specialty || ""} onChange={v => setBuf(b => ({ ...b, specialty: v }))} placeholder="Specialty" />
                  <EditInput value={buf.phone || ""} onChange={v => setBuf(b => ({ ...b, phone: v }))} placeholder="Phone number" />
                  <EditInput value={buf.notes || ""} onChange={v => setBuf(b => ({ ...b, notes: v }))} placeholder="Notes (optional)" />
                  <SaveCancelRow col={col}
                    onSave={() => {
                      if (buf.name?.trim()) {
                        const updated = { ...data, _doctorBuf: buf };
                        onUpdate && onUpdate({ ...data, _newDoctor: { ...buf, id: Date.now(), recipientId: data.id } });
                      }
                      setEditSection(null);
                    }}
                    onCancel={() => setEditSection(null)} />
                </div>
              )}
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionLabel>Upcoming Appointments</SectionLabel>
                <button style={{ background: "none", border: "none", color: col, fontSize: 12, fontFamily: sans, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, marginTop: -12 }}><Plus size={12} /> Add</button>
              </div>
              {myAppts.slice(0, 3).map((a, i) => (
                <div key={a.id} style={rowStyle(i === Math.min(myAppts.length, 3) - 1)}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: sans }}>{a.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}><Clock size={11} color={C.mutedLight} /><span style={{ fontSize: 12, color: C.muted, fontFamily: sans }}>{a.date} · {a.time}</span></div>
                    {a.doctor && <p style={{ fontSize: 11, color: col, fontFamily: sans, marginTop: 2 }}>{a.doctor}</p>}
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* ── GUIDANCE ─────────────────────────────────────────────────── */}
        {tab === "guidance" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #e8d8d4 0%, #d8c8e8 50%, #d4e0f0 100%)", borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: CARD_SHADOW_SM }}>
              <p style={{ fontSize: 15, fontWeight: 600, fontFamily: serif, color: C.text }}>Caring for {data.name}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: sans }}>Personalized guidance based on {data.nickname}'s profile</p>
            </div>
            {data.conditions.map(cond => CAREGIVING_RECS[cond] ? (
              <Card key={cond} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: serif, marginBottom: 12 }}>{cond}</p>
                {CAREGIVING_RECS[cond].map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < CAREGIVING_RECS[cond].length - 1 ? `1px solid ${C.bg}` : "none", alignItems: "flex-start" }}>
                    <Check size={13} color={C.sage} style={{ marginTop: 3, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#4a4038", lineHeight: 1.7, fontFamily: sans }}>{rec}</p>
                  </div>
                ))}
              </Card>
            ) : null)}
          </>
        )}

        {/* ── NOTES ────────────────────────────────────────────────────── */}
        {tab === "notes" && (
          <>
            {/* Important phone numbers — collapsible */}
            <Card style={{ marginBottom: 12 }}>
              <button onClick={() => toggleSection("numbers")} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
                <SectionLabel>Important Phone Numbers</SectionLabel>
                <ChevronRight size={15} color={C.mutedLight} style={{ transform: openSections.has("numbers") ? "rotate(90deg)" : "none", transition: "transform 0.2s", marginTop: -10, flexShrink: 0 }} />
              </button>
              {openSections.has("numbers") && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    {data.importantNumbers.map((n, i) => (
                      <div key={i} style={{ ...rowStyle(i === data.importantNumbers.length - 1 && editSection !== "editNumber" + i), justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: C.text, fontFamily: sans }}>{n.label}</p>
                          <p style={{ fontSize: 12, color: C.muted, fontFamily: sans }}>{n.number}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button onClick={() => startEdit("editNumber" + i, { label: n.label, number: n.number, idx: i })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                            <Pencil size={13} color={C.mutedLight} />
                          </button>
                          <button onClick={() => save({ importantNumbers: data.importantNumbers.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                            <Trash2 size={13} color={C.coral} />
                          </button>
                          <button style={{ width: 34, height: 34, background: col + "14", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Phone size={13} color={col} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {data.importantNumbers.map((n, i) => editSection === "editNumber" + i && (
                      <div key={"edit" + i} style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, borderTop: `1px solid ${C.bg}`, paddingTop: 12 }}>
                        <EditInput value={buf.label ?? n.label} onChange={v => setBuf(b => ({ ...b, label: v }))} placeholder="Label" />
                        <EditInput value={buf.number ?? n.number} onChange={v => setBuf(b => ({ ...b, number: v }))} placeholder="Number" />
                        <SaveCancelRow col={col}
                          onSave={() => { const nums = [...data.importantNumbers]; nums[i] = { label: buf.label ?? n.label, number: buf.number ?? n.number }; save({ importantNumbers: nums }); }}
                          onCancel={() => setEditSection(null)} />
                      </div>
                    ))}
                  </div>
                  {editSection === "addNumber" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, borderTop: `1px solid ${C.bg}`, paddingTop: 12 }}>
                      <EditInput value={buf.label || ""} onChange={v => setBuf(b => ({ ...b, label: v }))} placeholder="Label (e.g. Dr. Kim's office)" />
                      <EditInput value={buf.number || ""} onChange={v => setBuf(b => ({ ...b, number: v }))} placeholder="Phone number" />
                      <SaveCancelRow col={col}
                        onSave={() => { if (buf.label?.trim()) save({ importantNumbers: [...data.importantNumbers, { label: buf.label, number: buf.number }] }); else setEditSection(null); }}
                        onCancel={() => setEditSection(null)} />
                    </div>
                  ) : (
                    <button onClick={() => startEdit("addNumber", { label: "", number: "" })} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, padding: "7px 12px", width: "100%", justifyContent: "center", color: C.mutedLight, fontSize: 12, fontFamily: sans, cursor: "pointer" }}>
                      <Plus size={13} /> Add number
                    </button>
                  )}
                </>
              )}
            </Card>

            {/* Notes — collapsible */}
            <Card>
              <button onClick={() => toggleSection("notes")} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
                <SectionLabel>Notes</SectionLabel>
                <ChevronRight size={15} color={C.mutedLight} style={{ transform: openSections.has("notes") ? "rotate(90deg)" : "none", transition: "transform 0.2s", marginTop: -10, flexShrink: 0 }} />
              </button>
              {openSections.has("notes") && (
                editSection === "notes" ? (
                  <>
                    <EditInput multiline value={buf.notes ?? data.notes} onChange={v => setBuf(b => ({ ...b, notes: v }))} placeholder="Notes about this person…" />
                    <SaveCancelRow col={col} onSave={() => save({ notes: buf.notes })} onCancel={() => setEditSection(null)} />
                  </>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 14, color: "#4a4038", lineHeight: 1.8, fontFamily: sans, marginBottom: 12 }}>{data.notes}</p>
                    <button onClick={() => startEdit("notes", { notes: data.notes })} style={{ background: col + "14", border: "none", borderRadius: 10, padding: "5px 14px", color: col, fontSize: 12, fontFamily: sans, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                  </div>
                )
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ADD EVENT SCREEN ──────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE"; // Replace with your Google Maps API key

const EVENT_TYPES = [
  "Doctor's Appointment", "Physical Therapy", "Occupational Therapy",
  "Meeting", "Lab / Test", "Specialist", "Other",
];

const RECURRENCE_OPTIONS = [
  { id: "none", label: "None" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
];

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function AddEventScreen({ onBack, onSave, recipients }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [recurrence, setRecurrence] = useState("none");
  const [customDays, setCustomDays] = useState([]);
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [recipientId, setRecipientId] = useState(recipients[0]?.id || "");
  const searchTimeout = useRef(null);

  const days = getDaysInMonth(calMonth, calYear);
  const first = getFirstDay(calMonth, calYear);

  function toggleDate(ds) {
    setSelectedDates(prev => prev.includes(ds) ? prev.filter(d => d !== ds) : [...prev, ds]);
  }

  function toggleCustomDay(i) {
    setCustomDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  }

  async function fetchSuggestions(query) {
    if (!query || query.length < 3) { setSuggestions([]); return; }
    try {
      if (GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE") {
        setSuggestions([
          { place_id: "1", description: `${query} Medical Center, New York, NY` },
          { place_id: "2", description: `${query} Clinic, Los Angeles, CA` },
          { place_id: "3", description: `${query} Health Center, Chicago, IL` },
        ]);
      } else {
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&types=establishment|geocode`);
        const data = await res.json();
        setSuggestions(data.predictions || []);
      }
    } catch { setSuggestions([]); }
  }

  function handleAddressInput(val) {
    setAddressQuery(val);
    setAddress(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  function selectSuggestion(s) {
    setAddress(s.description);
    setAddressQuery(s.description);
    setSuggestions([]);
  }

  function handleSave() {
    if (!name.trim() || selectedDates.length === 0) return;
    let allDates = [...selectedDates];

    if (recurrence !== "none" && selectedDates.length > 0) {
      const base = new Date(selectedDates[0] + "T12:00:00");
      const end = recurrenceEnd ? new Date(recurrenceEnd + "T23:59:59") : null;
      const limit = end ? 365 : 12;
      let current = new Date(base);
      let count = 0;

      while (count < limit) {
        if (recurrence === "daily")   current.setDate(current.getDate() + 1);
        else if (recurrence === "weekly")  current.setDate(current.getDate() + 7);
        else if (recurrence === "monthly") current.setMonth(current.getMonth() + 1);
        else if (recurrence === "yearly")  current.setFullYear(current.getFullYear() + 1);
        else if (recurrence === "custom") {
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const next = new Date(current); next.setDate(next.getDate() + i);
            if (customDays.includes(next.getDay())) { current = next; found = true; break; }
          }
          if (!found) break;
        }
        if (end && current > end) break;
        const ds = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,"0")}-${String(current.getDate()).padStart(2,"0")}`;
        if (!allDates.includes(ds)) allDates.push(ds);
        count++;
      }
    }

    const newAppts = allDates.map((date, i) => ({
      id: Date.now() + i,
      title: name.trim(),
      date,
      time: "12:00 PM",
      location: address || null,
      type: type || null,
      notes: notes || null,
      url: url || null,
      recipientId: recipientId || null,
      doctor: null,
    }));
    onSave(newAppts);
  }

  const canSave = name.trim() && selectedDates.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: GRAD, padding: "16px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontFamily: sans, fontSize: 14, fontWeight: 600, padding: 0 }}>Cancel</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: serif }}>New Event</span>
        <button onClick={handleSave} disabled={!canSave} style={{ background: canSave ? "#904848" : C.border, border: "none", borderRadius: 12, padding: "7px 16px", color: "white", fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: canSave ? "pointer" : "default", transition: "background 0.2s" }}>Save</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "22px 18px 40px" }}>

        {/* Event Name */}
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Event Name</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cardiology Follow-up" style={{ width: "100%", background: "#f7f5f2", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: sans, color: C.text, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* For (recipient) */}
        {recipients.length > 1 && (
          <div style={{ marginBottom: 26 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>For</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {recipients.map(r => (
                <button key={r.id} onClick={() => setRecipientId(r.id)} style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${recipientId === r.id ? "#904848" : C.border}`, background: recipientId === r.id ? "#fdf6f5" : "white", color: recipientId === r.id ? "#904848" : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {r.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type */}
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Type</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EVENT_TYPES.map(t => (
              <button key={t} onClick={() => setType(type === t ? "" : t)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${type === t ? "#904848" : C.border}`, background: type === t ? "#fdf6f5" : "white", color: type === t ? "#904848" : C.muted, fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Date picker */}
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
            Date{selectedDates.length > 1 ? "s" : ""}{selectedDates.length > 0 ? ` · ${selectedDates.length} selected` : ""}
          </p>
          <div style={{ background: "#f7f5f2", borderRadius: 16, padding: "14px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <button onClick={() => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y-1)) : setCalMonth(m => m-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ChevronLeft size={16} color={C.muted} /></button>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: sans }}>{FULL_MONTHS[calMonth]} {calYear}</span>
              <button onClick={() => calMonth === 11 ? (setCalMonth(0), setCalYear(y => y+1)) : setCalMonth(m => m+1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ChevronRight size={16} color={C.muted} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 4 }}>
              {CAL_DAYS.map(d => <span key={d} style={{ fontSize: 9, fontWeight: 700, color: C.mutedLight, fontFamily: sans }}>{d}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(days).fill(null).map((_, i) => {
                const day = i + 1;
                const ds = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isSel = selectedDates.includes(ds);
                return (
                  <button key={day} onClick={() => toggleDate(ds)} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: isSel ? "#904848" : "transparent", cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: isSel ? 700 : 400, color: isSel ? "white" : C.text, fontFamily: sans }}>{day}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {selectedDates.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[...selectedDates].sort().map(d => (
                <span key={d} onClick={() => toggleDate(d)} style={{ background: "#fdf6f5", border: "1px solid #e8d0d0", borderRadius: 10, padding: "4px 10px", fontSize: 11, color: "#904848", fontFamily: sans, fontWeight: 600, cursor: "pointer" }}>{d} ×</span>
              ))}
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Repeat</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RECURRENCE_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setRecurrence(o.id)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${recurrence === o.id ? C.primary : C.border}`, background: recurrence === o.id ? C.primaryLight : "white", color: recurrence === o.id ? C.primaryDark : C.muted, fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {o.label}
              </button>
            ))}
          </div>
          {recurrence === "custom" && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginBottom: 8 }}>Repeat on</p>
              <div style={{ display: "flex", gap: 6 }}>
                {CAL_DAYS.map((d, i) => (
                  <button key={i} onClick={() => toggleCustomDay(i)} style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${customDays.includes(i) ? C.primary : C.border}`, background: customDays.includes(i) ? C.primaryLight : "white", color: customDays.includes(i) ? C.primaryDark : C.muted, fontFamily: sans, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          {recurrence !== "none" && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginBottom: 6 }}>End date <span style={{ color: C.mutedLight }}>(optional)</span></p>
              <input type="date" value={recurrenceEnd} onChange={e => setRecurrenceEnd(e.target.value)} style={{ background: "#f7f5f2", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: sans, color: C.text, outline: "none" }} />
            </div>
          )}
        </div>

        {/* Address */}
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Address</p>
          <div style={{ position: "relative" }}>
            <input value={addressQuery} onChange={e => handleAddressInput(e.target.value)} placeholder="Search address or location…" style={{ width: "100%", background: "#f7f5f2", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: sans, color: C.text, outline: "none", boxSizing: "border-box" }} />
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", borderRadius: 12, boxShadow: CARD_SHADOW, zIndex: 20, overflow: "hidden" }}>
                {suggestions.map((s, i) => (
                  <button key={s.place_id} onClick={() => selectSuggestion(s)} style={{ width: "100%", padding: "11px 14px", background: "none", border: "none", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none", textAlign: "left", cursor: "pointer", fontFamily: sans, fontSize: 13, color: C.text, display: "block" }}>
                    {s.description}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p style={{ fontSize: 10, color: C.mutedLight, fontFamily: sans, marginTop: 5 }}>Powered by Google Maps</p>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Notes <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(optional)</span></p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details…" rows={3} style={{ width: "100%", background: "#f7f5f2", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: sans, color: C.text, outline: "none", boxSizing: "border-box", resize: "none" }} />
        </div>

        {/* Event URL */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Event URL <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(optional)</span></p>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" style={{ width: "100%", background: "#f7f5f2", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: sans, color: C.text, outline: "none", boxSizing: "border-box" }} />
        </div>

      </div>
    </div>
  );
}

// ─── CALENDAR TAB ──────────────────────────────────────────────────────────────

function CalendarTab({ appointments, recipients, onShowAddEvent }) {
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [selected, setSelected] = useState(null);
  const days = getDaysInMonth(month, year);
  const first = getFirstDay(month, year);
  const apptDates = new Set(appointments.map(a => a.date));
  const prev = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const next = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);
  const visible = selected
    ? appointments.filter(a => a.date === selected)
    : appointments.filter(a => { const [y, m] = a.date.split("-").map(Number); return m - 1 === month && y === year; });

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={prev} style={{ background: C.card, border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", boxShadow: CARD_SHADOW_SM }}><ChevronLeft size={17} color={C.muted} /></button>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, fontFamily: serif }}>{FULL_MONTHS[month]} {year}</h2>
        <button onClick={next} style={{ background: C.card, border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", boxShadow: CARD_SHADOW_SM }}><ChevronRight size={17} color={C.muted} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 8 }}>
        {DAYS_OF_WEEK.map(d => <span key={d} style={{ fontSize: 10, fontWeight: 600, color: C.mutedLight, fontFamily: sans, letterSpacing: 0.5 }}>{d}</span>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 20 }}>
        {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(days).fill(null).map((_, i) => {
          const day = i + 1;
          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasA = apptDates.has(ds), isToday = ds === "2026-03-25", isSel = selected === ds;
          return (
            <button key={day} onClick={() => setSelected(isSel ? null : ds)} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "none", background: isSel ? C.primary : isToday ? C.primaryLight : "transparent", cursor: "pointer", position: "relative", padding: 0 }}>
              <span style={{ fontSize: 13, fontWeight: isToday || isSel ? 700 : 400, color: isSel ? "white" : isToday ? C.primary : C.text, fontFamily: sans }}>{day}</span>
              {hasA && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : C.rose, position: "absolute", bottom: 4 }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, fontFamily: sans }}>{selected || "This month"}</p>
        <button onClick={onShowAddEvent} style={{ display: "flex", alignItems: "center", gap: 4, background: C.primaryLight, border: "none", borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: C.primaryDark, fontFamily: sans, cursor: "pointer" }}>
          <Plus size={13} /> Add event
        </button>
      </div>

      {visible.length === 0
        ? <p style={{ textAlign: "center", color: C.mutedLight, fontFamily: sans, fontSize: 13, padding: 24 }}>No appointments</p>
        : visible.map(a => {
          const r = recipients.find(rec => rec.id === a.recipientId);
          const col = r ? rColor(r.id) : C.muted;
          return (
            <div key={a.id} style={{ background: C.card, borderRadius: 18, padding: 14, marginBottom: 10, boxShadow: CARD_SHADOW_SM, borderLeft: `3px solid ${col}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: sans }}>{a.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}><Clock size={11} color={C.mutedLight} /><span style={{ fontSize: 12, color: C.muted, fontFamily: sans }}>{a.date} · {a.time}</span></div>
                  {a.location && <p style={{ fontSize: 11, color: C.mutedLight, marginTop: 2, fontFamily: sans }}>{a.location}</p>}
                  {a.doctor && <p style={{ fontSize: 12, color: col, fontFamily: sans, marginTop: 4, fontWeight: 600 }}>{a.doctor}</p>}
                </div>
                {r && <span style={{ background: col + "14", color: col, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontFamily: sans, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.nickname}</span>}
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ─── LIST TAB ──────────────────────────────────────────────────────────────────

function MiniAvatar({ r, size = 22 }) {
  const col = rColor(r.id);
  const ini = r.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <div title={r.nickname || r.name} style={{ width: size, height: size, borderRadius: "50%", background: col + "22", border: `1.5px solid ${col}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.38), fontWeight: 700, color: col, flexShrink: 0, fontFamily: sans }}>
      {ini}
    </div>
  );
}

function RecipFilterBar({ recipients, filterId, setFilterId }) {
  if (!recipients?.length) return null;
  const opts = [{ id: null, label: "All" }, ...recipients.map(r => ({ id: r.id, label: r.nickname || r.name.split(" ")[0], r }))];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {opts.map(opt => {
        const active = filterId === opt.id;
        const col = opt.r ? rColor(opt.r.id) : C.primary;
        return (
          <button key={String(opt.id)} onClick={() => setFilterId(opt.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${active ? col : C.border}`, background: active ? col + "15" : "transparent", color: active ? col : C.mutedLight, fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: sans, cursor: "pointer", whiteSpace: "nowrap" }}>
            {opt.r && <MiniAvatar r={opt.r} size={16} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ListTab({ logistics, onUpdateLogistic, onAddLogistic, doctors, recipients = [] }) {
  const [sub, setSub] = useState("logistics");
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newItemRecipId, setNewItemRecipId] = useState(null);
  const [filterRecipId, setFilterRecipId] = useState(null);
  const done = logistics.filter(l => l.completed).length;
  const pct = Math.round((done / logistics.length) * 100);

  const filteredLogistics = filterRecipId ? logistics.filter(l => l.recipientId === filterRecipId) : logistics;
  const filteredDoctors   = filterRecipId ? doctors.filter(d => d.recipientId === filterRecipId) : doctors;

  // Mock documents with recipientId
  const MOCK_DOCS = [
    { name: "Medicare Card – Margaret.pdf", date: "Mar 10, 2026", recipientId: 1 },
    { name: "Advanced Directive – Margaret.pdf", date: "Jan 5, 2025", recipientId: 1 },
    { name: "Will – Notarized 2025.pdf", date: "Mar 15, 2025", recipientId: null },
    { name: "Medicaid Approval – Thomas.pdf", date: "Nov 20, 2025", recipientId: 2 },
  ];
  const filteredDocs = filterRecipId ? MOCK_DOCS.filter(d => d.recipientId === filterRecipId) : MOCK_DOCS;

  return (
    <div>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.bg}`, display: "flex" }}>
        {[{ id: "logistics", label: "Checklist" }, { id: "doctors", label: "Doctors" }, { id: "documents", label: "Documents" }].map(t => (
          <button key={t.id} onClick={() => { setSub(t.id); setFilterRecipId(null); }} style={{ flex: 1, padding: "13px 8px", background: "none", border: "none", fontWeight: sub === t.id ? 700 : 400, fontSize: 12, color: sub === t.id ? C.primary : C.mutedLight, fontFamily: sans, borderBottom: sub === t.id ? `2px solid ${C.primary}` : "2px solid transparent", cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 18px" }}>
        {sub === "logistics" && (
          <>
            <Card style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: C.text, fontFamily: sans }}>{done} of {logistics.length} complete</p>
                <div style={{ width: 150, height: 4, background: C.bg, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? `linear-gradient(90deg, ${C.sage}, #6aa88e)` : pct >= 40 ? `linear-gradient(90deg, ${C.peach}, #c4986c)` : `linear-gradient(90deg, ${C.rose}, #b47870)`, borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ fontSize: 28, fontWeight: 600, fontFamily: serif, color: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose }}>{pct}%</span>
            </Card>

            <RecipFilterBar recipients={recipients} filterId={filterRecipId} setFilterId={setFilterRecipId} />

            {filteredLogistics.map(item => {
              const recip = item.recipientId ? recipients.find(r => r.id === item.recipientId) : null;
              return (
                <div key={item.id} style={{ background: C.card, borderRadius: 18, padding: "13px 16px", marginBottom: 8, boxShadow: CARD_SHADOW_SM, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <button onClick={() => onUpdateLogistic(item.id, { completed: !item.completed })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}>
                    {item.completed ? <CheckSquare size={19} color={C.sage} /> : <Square size={19} color={C.border} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: item.completed ? C.mutedLight : C.text, textDecoration: item.completed ? "line-through" : "none", fontFamily: sans }}>{item.title}</p>
                    {item.note && <p style={{ fontSize: 11, color: C.muted, marginTop: 3, fontFamily: sans }}>{item.note}</p>}
                  </div>
                  {recip && <MiniAvatar r={recip} size={24} />}
                </div>
              );
            })}

            {filteredLogistics.length === 0 && (
              <p style={{ textAlign: "center", color: C.mutedLight, fontSize: 13, fontFamily: sans, padding: "16px 0" }}>
                {filterRecipId ? "No items for this person." : "All done! 🎉"}
              </p>
            )}

            {adding ? (
              <div style={{ background: C.card, borderRadius: 18, padding: "14px 16px", border: `1.5px solid ${C.primary}40`, boxShadow: CARD_SHADOW }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New item..." autoFocus style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: C.text, background: "none", fontFamily: sans, marginBottom: 10 }} />
                {recipients.length > 0 && (
                  <select value={newItemRecipId ?? ""} onChange={e => setNewItemRecipId(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: newItemRecipId ? C.text : C.mutedLight, background: C.bg, fontFamily: sans, marginBottom: 10, outline: "none" }}>
                    <option value="">For (optional)</option>
                    {recipients.map(r => <option key={r.id} value={r.id}>{r.nickname || r.name.split(" ")[0]}</option>)}
                  </select>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { if (newItem.trim()) { onAddLogistic({ id: Date.now(), title: newItem, completed: false, note: "", partnerLink: null, recipientId: newItemRecipId ?? null }); setNewItem(""); setNewItemRecipId(null); setAdding(false); } }} style={{ flex: 1, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: "white", border: "none", borderRadius: 10, padding: "9px", fontWeight: 600, fontFamily: sans, cursor: "pointer", fontSize: 13 }}>Add</button>
                  <button onClick={() => { setAdding(false); setNewItem(""); setNewItemRecipId(null); }} style={{ flex: 1, background: C.bg, color: C.muted, border: "none", borderRadius: 10, padding: "9px", fontWeight: 500, fontFamily: sans, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ marginTop: 8, width: "100%", border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: 14, background: "none", color: C.mutedLight, fontSize: 13, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Plus size={15} /> Add item
              </button>
            )}
          </>
        )}

        {sub === "doctors" && (
          <>
            <RecipFilterBar recipients={recipients} filterId={filterRecipId} setFilterId={setFilterRecipId} />
            {filteredDoctors.map(d => {
              const col = rColor(d.recipientId);
              const recip = d.recipientId ? recipients.find(r => r.id === d.recipientId) : null;
              return (
                <div key={d.id} style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: CARD_SHADOW_SM, borderLeft: `3px solid ${col}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: serif }}>{d.name}</p>
                        {recip && <MiniAvatar r={recip} size={20} />}
                      </div>
                      <p style={{ fontSize: 12, color: col, fontFamily: sans, marginTop: 2 }}>{d.specialty}</p>
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: sans }}>{d.phone}</p>
                      <p style={{ fontSize: 11, color: C.mutedLight, fontFamily: sans }}>{d.address}</p>
                    </div>
                    <button style={{ width: 36, height: 36, background: col + "14", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <Phone size={14} color={col} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredDoctors.length === 0 && (
              <p style={{ textAlign: "center", color: C.mutedLight, fontSize: 13, fontFamily: sans, padding: "16px 0" }}>
                {filterRecipId ? "No doctors for this person." : "No doctors yet."}
              </p>
            )}
            <button style={{ width: "100%", border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: 14, background: "none", color: C.mutedLight, fontSize: 13, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={15} /> Add a doctor
            </button>
          </>
        )}

        {sub === "documents" && (
          <>
            <RecipFilterBar recipients={recipients} filterId={filterRecipId} setFilterId={setFilterRecipId} />
            {filteredDocs.map((doc, i) => {
              const recip = doc.recipientId ? recipients.find(r => r.id === doc.recipientId) : null;
              const col = recip ? rColor(recip.id) : C.primary;
              return (
                <div key={i} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 8, boxShadow: CARD_SHADOW_SM, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, background: col + "16", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={16} color={col} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text, fontFamily: sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: C.mutedLight, fontFamily: sans }}>{doc.date}</p>
                  </div>
                  {recip && <MiniAvatar r={recip} size={22} />}
                </div>
              );
            })}
            {filteredDocs.length === 0 && (
              <p style={{ textAlign: "center", color: C.mutedLight, fontSize: 13, fontFamily: sans, padding: "16px 0" }}>
                {filterRecipId ? "No documents for this person." : "No documents yet."}
              </p>
            )}
            <button style={{ width: "100%", border: `1.5px dashed ${C.border}`, borderRadius: 16, padding: 14, background: "none", color: C.mutedLight, fontSize: 13, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={15} /> Upload document
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── INSURANCE TAB ─────────────────────────────────────────────────────────────

function InsuranceTab({ recipients }) {
  const [sel, setSel] = useState(null);
  const allPlans = [...new Set(recipients.flatMap(r => r.insurancePlans))];

  if (sel) {
    const info = INSURANCE_INFO[sel];
    const covered = recipients.filter(r => r.insurancePlans.includes(sel));
    return (
      <div>
        <div style={{ background: `linear-gradient(148deg, ${info.bg}, #f7f2ea)`, padding: "16px 18px 0" }}>
          <BackBtn onBack={() => setSel(null)} label="All Insurance" />
          <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 18 }}>
            <span style={{ fontSize: 40 }}>{info.emoji}</span>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: serif, color: C.text }}>{info.name}</h2>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {covered.map(r => <span key={r.id} style={{ background: rColor(r.id) + "18", color: rColor(r.id), borderRadius: 20, padding: "3px 10px", fontSize: 11, fontFamily: sans, fontWeight: 600 }}>{r.nickname}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "18px 18px" }}>
          {info.warning && (
            <div style={{ background: "#fdf6f0", borderRadius: 16, padding: 14, marginBottom: 16, boxShadow: CARD_SHADOW_SM }}>
              <p style={{ fontSize: 13, color: "#7a5a3a", lineHeight: 1.7, fontFamily: sans }}>{info.warning}</p>
            </div>
          )}
          {info.parts.map((part, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: info.color, fontFamily: serif, marginBottom: 10 }}>{part.name}</p>
              <p style={{ fontSize: 13, color: "#4a4038", lineHeight: 1.8, fontFamily: sans }}>{part.plain}</p>
              <div style={{ marginTop: 14, background: info.bg, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: sans }}>Member Services</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: info.color, marginTop: 2, fontFamily: sans }}>{part.phone}</p>
                </div>
                <button style={{ width: 38, height: 38, background: info.color, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Phone size={15} color="white" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 18px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, fontFamily: serif, color: C.text, marginBottom: 4 }}>Insurance</h2>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 22, fontFamily: sans }}>Coverage explained in plain language</p>
      {allPlans.map(planId => {
        const info = INSURANCE_INFO[planId];
        const covered = recipients.filter(r => r.insurancePlans.includes(planId));
        return (
          <button key={planId} onClick={() => setSel(planId)} style={{ width: "100%", background: C.card, border: "none", borderRadius: 22, padding: "16px 18px", textAlign: "left", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 14, boxShadow: CARD_SHADOW }}>
            <div style={{ width: 52, height: 52, background: info.bg, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{info.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: serif }}>{info.name}</p>
              <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                {covered.map(r => <span key={r.id} style={{ background: rColor(r.id) + "14", color: rColor(r.id), borderRadius: 20, padding: "2px 8px", fontSize: 10, fontFamily: sans, fontWeight: 600 }}>{r.nickname}</span>)}
              </div>
            </div>
            <ChevronRight size={16} color={C.border} style={{ flexShrink: 0 }} />
          </button>
        );
      })}
      <button style={{ width: "100%", border: `1.5px dashed ${C.border}`, borderRadius: 22, padding: 14, background: "none", color: C.mutedLight, fontSize: 13, fontFamily: sans, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Plus size={15} /> Add insurance plan
      </button>
    </div>
  );
}

// ─── CHAT TAB ──────────────────────────────────────────────────────────────────

function ChatTab({ messages, setMessages }) {
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);

  function send(text) {
    if (!text.trim() || waiting) return;
    setMessages(p => [...p, { role: "user", text }]);
    setInput("");
    setWaiting(true);
    setTimeout(() => { setMessages(p => [...p, { role: "assistant", text: getResponse(text) }]); setWaiting(false); }, 900);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "linear-gradient(135deg, #dde8f6 0%, #e8ddf0 60%, #f0dde6 100%)", padding: "14px 18px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid rgba(0,0,0,0.05)` }}>
        <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.55)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 2px 10px rgba(100,120,160,0.12)" }}>🤍</div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: serif }}>Ask Aiden</p>
          <p style={{ fontSize: 11, color: C.muted, fontFamily: sans }}>Your AI caregiving assistant</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #dde8f6, #f0dde6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>🤍</div>
            )}
            <div style={{ maxWidth: "80%", background: m.role === "user" ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.card, color: m.role === "user" ? "white" : C.text, borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 15px", fontSize: 13, lineHeight: 1.7, fontFamily: sans, boxShadow: CARD_SHADOW_SM }}>
              {m.text}
            </div>
          </div>
        ))}
        {waiting && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #dde8f6, #f0dde6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤍</div>
            <div style={{ background: C.card, borderRadius: "18px 18px 18px 4px", padding: "13px 16px", display: "flex", gap: 5, boxShadow: CARD_SHADOW_SM }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: C.mutedLight, animation: "pulse 1.2s infinite", animationDelay: `${j * 0.2}s` }} />)}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && !waiting && (
        <div style={{ padding: "0 18px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.mutedLight, letterSpacing: 1, textTransform: "uppercase", fontFamily: sans }}>Suggested</p>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ background: C.card, border: "none", borderRadius: 14, padding: "10px 14px", textAlign: "left", fontSize: 13, color: C.text, fontFamily: sans, cursor: "pointer", boxShadow: CARD_SHADOW_SM }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "10px 18px 16px", background: C.card, borderTop: `1px solid ${C.bg}`, display: "flex", gap: 10, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Ask anything about caregiving..." style={{ flex: 1, background: C.bg, border: "none", borderRadius: 22, padding: "10px 16px", fontSize: 13, outline: "none", color: C.text, fontFamily: sans }} />
        <button onClick={() => send(input)} style={{ width: 40, height: 40, background: input.trim() ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.bg, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "default", flexShrink: 0, boxShadow: input.trim() ? `0 4px 14px ${C.primary}44` : "none" }}>
          <Send size={15} color={input.trim() ? "white" : C.mutedLight} />
        </button>
      </div>
    </div>
  );
}

// ─── INFO SECTION PAGES ────────────────────────────────────────────────────────

function LegalSection({ onBack }) {
  const topics = [
    { title: "Will & Testament", body: "A legal document that outlines how your loved one's assets should be distributed after their passing. Should be notarized and updated after major life changes. Trust & Will can help you create or update one quickly online." },
    { title: "Advanced Directive / Living Will", body: "Specifies the medical treatments your loved one does or doesn't want if they become unable to communicate — covering life support, resuscitation, feeding tubes, and end-of-life preferences. Share copies with all providers." },
    { title: "HIPAA Authorization", body: "Allows healthcare providers to share your loved one's medical information with you. Request a form from any doctor's office. Once signed, keep a copy with each provider and one at home." },
    { title: "Durable Power of Attorney", body: "Grants you legal authority to make financial and legal decisions on behalf of your loved one if they become incapacitated. Must be signed while they still have mental capacity." },
    { title: "Healthcare Proxy", body: "Designates you (or another trusted person) to make medical decisions when your loved one cannot. Different from a Living Will — this names a person rather than listing specific wishes." },
    { title: "Guardianship & Conservatorship", body: "If your loved one lacks capacity and no prior legal documents exist, a court can appoint a guardian (for personal decisions) or conservator (for financial decisions). This process can be lengthy — plan ahead." },
  ];
  const [open, setOpen] = useState(null);
  return (
    <div style={{ padding: "16px 18px 8px" }}>
      <BackBtn onBack={onBack} label="Get help" />
      <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, fontFamily: serif, marginBottom: 4 }}>Legal</h2>
      <p style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginBottom: 20, lineHeight: 1.6 }}>Wills, directives, and legal documents explained in plain language.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topics.map((t, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 18, overflow: "hidden", boxShadow: CARD_SHADOW_SM }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: serif, textAlign: "left" }}>{t.title}</span>
              <ChevronRight size={15} color={C.mutedLight} style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>
            {open === i && <p style={{ fontSize: 13, color: C.muted, fontFamily: sans, lineHeight: 1.7, padding: "0 16px 16px" }}>{t.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TransitionalSection({ onBack }) {
  const topics = [
    { title: "Moving to Assisted Living", body: "Assisted living communities offer housing, personal care, and support services for those who need help with daily activities but don't require full nursing care. Tour several facilities, review state inspection reports, and involve your loved one in the decision as much as possible." },
    { title: "Memory Care Facilities", body: "Specialized communities designed for people with Alzheimer's or other forms of dementia. They offer secured environments, structured routines, and staff trained in memory care. Ask about staff-to-resident ratios and how they handle behavioral changes." },
    { title: "Skilled Nursing / Rehab", body: "Short-term skilled nursing is often covered by Medicare after a qualifying hospital stay (3+ nights). It provides physical therapy, occupational therapy, and medical oversight during recovery. Confirm coverage before admission." },
    { title: "Hospice Care", body: "Hospice focuses on comfort and quality of life for those with a terminal illness and a prognosis of 6 months or less. It is covered by Medicare and most insurers, and can be provided at home, in a facility, or in a dedicated hospice center." },
    { title: "Palliative Care", body: "Available at any stage of illness (unlike hospice), palliative care focuses on symptom relief and quality of life alongside curative treatment. Ask your loved one's doctor for a palliative care referral." },
    { title: "In-Home Transition Support", body: "After a hospital or rehab stay, transitional care managers can help coordinate follow-up appointments, medications, and home health services to reduce the risk of readmission." },
  ];
  const [open, setOpen] = useState(null);
  return (
    <div style={{ padding: "16px 18px 8px" }}>
      <BackBtn onBack={onBack} label="Get help" />
      <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, fontFamily: serif, marginBottom: 4 }}>Transitional Help</h2>
      <p style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginBottom: 20, lineHeight: 1.6 }}>Guidance for major care transitions — assisted living, hospice, rehab, and more.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topics.map((t, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 18, overflow: "hidden", boxShadow: CARD_SHADOW_SM }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: serif, textAlign: "left" }}>{t.title}</span>
              <ChevronRight size={15} color={C.mutedLight} style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>
            {open === i && <p style={{ fontSize: 13, color: C.muted, fontFamily: sans, lineHeight: 1.7, padding: "0 16px 16px" }}>{t.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportSection({ onBack }) {
  const topics = [
    { title: "Caregiver Support Groups", body: "Connecting with other caregivers can reduce isolation and provide practical advice. The Caregiver Action Network (caregiveraction.org) and AARP offer local and online groups. The Alzheimer's Association has specialized groups for dementia caregivers." },
    { title: "Home Health Aides", body: "Licensed home health aides can assist with bathing, dressing, medication reminders, and light housekeeping. Medicare may cover skilled home health visits if your loved one is homebound and a doctor orders it. Private aides are typically paid out of pocket or through long-term care insurance." },
    { title: "Adult Day Programs", body: "Structured daytime programs offer social activities, meals, and health monitoring for adults who need supervision. They provide respite for caregivers while keeping loved ones engaged. Many accept Medicaid." },
    { title: "Respite Care", body: "Short-term relief for caregivers — from a few hours to several weeks. Can be provided by volunteers, home health agencies, or residential facilities. The ARCH National Respite Network (archrespite.org) can help you find local programs." },
    { title: "Nonprofit Resources", body: "Many nonprofits offer free services: Meals on Wheels provides home-delivered meals; Area Agencies on Aging (eldercare.acl.gov) connect families with local services; the National Alliance for Caregiving offers research and advocacy." },
    { title: "Mental Health Support for Caregivers", body: "Caregiver burnout is real. Therapy, counseling, and peer support can help. The 988 Suicide & Crisis Lifeline also supports caregivers in crisis. Many therapists specialize in family caregiving stress — ask your doctor for a referral." },
  ];
  const [open, setOpen] = useState(null);
  return (
    <div style={{ padding: "16px 18px 8px" }}>
      <BackBtn onBack={onBack} label="Get help" />
      <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, fontFamily: serif, marginBottom: 4 }}>Support</h2>
      <p style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginBottom: 20, lineHeight: 1.6 }}>Support groups, home health, nonprofits, and caregiver resources.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topics.map((t, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 18, overflow: "hidden", boxShadow: CARD_SHADOW_SM }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: serif, textAlign: "left" }}>{t.title}</span>
              <ChevronRight size={15} color={C.mutedLight} style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>
            {open === i && <p style={{ fontSize: 13, color: C.muted, fontFamily: sans, lineHeight: 1.7, padding: "0 16px 16px" }}>{t.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INFO TAB ──────────────────────────────────────────────────────────────────

function InfoTab({ recipients }) {
  const [section, setSection] = useState(null);

  if (section === "insurance")    return <div><div style={{ padding: "16px 18px 0" }}><BackBtn onBack={() => setSection(null)} label="Get help" /></div><InsuranceTab recipients={recipients} /></div>;
  if (section === "legal")        return <LegalSection onBack={() => setSection(null)} />;
  if (section === "transitional") return <TransitionalSection onBack={() => setSection(null)} />;
  if (section === "support")      return <SupportSection onBack={() => setSection(null)} />;

  const items = [
    { id: "insurance",    Icon: Shield,           label: "Insurance",          desc: "Medicare, Medicaid, Humana & more in plain language",              color: C.blue },
    { id: "legal",        Icon: Scale,            label: "Legal",              desc: "Wills, Advanced Directives, HIPAA, Power of Attorney & more",       color: C.lavender },
    { id: "transitional", Icon: ArrowRightLeft,   label: "Transitional Help",  desc: "Assisted living, hospice, rehab, memory care & in-home transitions", color: C.sage },
    { id: "support",      Icon: Users,            label: "Support",            desc: "Support groups, home health, nonprofits & caregiver resources",      color: C.peach },
  ];

  return (
    <div style={{ padding: "20px 18px 8px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: C.text, marginBottom: 6, fontFamily: serif, letterSpacing: -0.5 }}>Get help</h1>
      <p style={{ fontSize: 13, color: C.muted, fontFamily: sans, marginBottom: 24 }}>Resources and reference information.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(({ id, Icon: ItemIcon, label, desc, color }) => (
          <button key={id} onClick={() => setSection(id)} style={{ width: "100%", background: C.card, border: "none", borderRadius: 22, padding: "18px 20px", textAlign: "left", cursor: "pointer", boxShadow: CARD_SHADOW, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ItemIcon size={20} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: serif, marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: sans, lineHeight: 1.5 }}>{desc}</p>
            </div>
            <ChevronRight size={16} color={C.border} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home",      Icon: Home,          label: "Home"      },
  { id: "calendar",  Icon: CalendarDays,  label: "Calendar"  },
  { id: "list",      Icon: ClipboardList, label: "To do"    },
  { id: "info",      Icon: Info,           label: "Get help"  },
  { id: "chat",      Icon: MessageCircle, label: "Ask Aiden" },
];

export default function AidenApp() {
  const [tab, setTab] = useState("home");
  const [selRecipient, setSelRecipient] = useState(null);
  const [showRecipients, setShowRecipients] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [showMsg, setShowMsg] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hi Holly! I'm Aiden, your personal caregiving assistant. I'm here to help you navigate caring for Margaret and Thomas — from medical questions to legal documents, insurance, and emotional support. What can I help you with? 🤍" }
  ]);

  // ── Auth state ───────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    // Safety timeout: if Firebase doesn't respond in 8s, stop showing the loading screen
    const timeout = setTimeout(() => setAuthLoading(false), 8000);
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => { clearTimeout(timeout); setUser(u); setAuthLoading(false); },
      (err) => { clearTimeout(timeout); console.error('Auth error:', err); setAuthLoading(false); }
    );
    return () => { unsubscribe(); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadUserData(user.uid);
  }, [user]);

  // ── Firestore helpers ────────────────────────────────────────────────────────
  async function seedUserData(uid) {
    const batch = writeBatch(db);

    INITIAL_RECIPIENTS.forEach((r) => {
      const ref = doc(collection(db, 'users', uid, 'recipients'));
      const { id: _id, ...data } = r;
      batch.set(ref, { ...data, _localId: r.id });
    });
    INITIAL_APPOINTMENTS.forEach(a => {
      const ref = doc(collection(db, 'users', uid, 'appointments'));
      const { id: _id, ...data } = a;
      batch.set(ref, data);
    });
    INITIAL_LOGISTICS.forEach(l => {
      const ref = doc(collection(db, 'users', uid, 'logistics'));
      const { id: _id, ...data } = l;
      batch.set(ref, data);
    });
    INITIAL_DOCTORS.forEach(d => {
      const ref = doc(collection(db, 'users', uid, 'doctors'));
      const { id: _id, ...data } = d;
      batch.set(ref, data);
    });

    await setDoc(doc(db, 'users', uid), { seeded: true, createdAt: new Date().toISOString() });
    await batch.commit();
  }

  async function loadUserData(uid) {
    setDataLoading(true);
    try {
      const checkSnap = await getDocs(collection(db, 'users', uid, 'recipients'));
      if (checkSnap.empty) {
        await seedUserData(uid);
      }

      const [recSnap, apptSnap, logSnap, docSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'recipients')),
        getDocs(collection(db, 'users', uid, 'appointments')),
        getDocs(collection(db, 'users', uid, 'logistics')),
        getDocs(collection(db, 'users', uid, 'doctors')),
      ]);

      setRecipients(recSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setAppointments(apptSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLogistics(logSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setDoctors(docSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setDataLoading(false);
  }

  // ── Firestore-wired mutations ────────────────────────────────────────────────
  async function updateRecipient(updated) {
    const { id, ...data } = updated;
    setRecipients(rs => rs.map(r => r.id === id ? updated : r));
    if (selRecipient?.id === id) setSelRecipient(updated);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'recipients', String(id)), data);
      } catch (e) { console.error('Error updating recipient:', e); }
    }
  }

  async function handleAddAppointments(newAppts) {
    if (user) {
      try {
        const added = await Promise.all(
          newAppts.map(({ id: _id, ...appt }) => addDoc(collection(db, 'users', user.uid, 'appointments'), appt))
        );
        const withIds = added.map((ref, i) => ({ ...newAppts[i], id: ref.id }));
        setAppointments(prev => [...prev, ...withIds]);
      } catch (e) { console.error('Error adding appointments:', e); }
    } else {
      setAppointments(prev => [...prev, ...newAppts]);
    }
    setShowAddEvent(false);
  }

  async function updateLogisticItem(id, updates) {
    setLogistics(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'logistics', String(id)), updates);
      } catch (e) { console.error('Error updating logistic:', e); }
    }
  }

  async function addLogisticItem(item) {
    if (user) {
      try {
        const { id: _id, ...data } = item;
        const ref = await addDoc(collection(db, 'users', user.uid, 'logistics'), data);
        setLogistics(prev => [...prev, { ...item, id: ref.id }]);
      } catch (e) { console.error('Error adding logistic:', e); }
    } else {
      setLogistics(prev => [...prev, item]);
    }
  }

  // ── Auth loading screens ─────────────────────────────────────────────────────
  const SplashScreen = ({ subtitle }) => (
    <>
      <style>{`
        @keyframes aidenWriteIn {
          0%   { clip-path: inset(0 102% 0 0); }
          100% { clip-path: inset(0 0%   0 0); }
        }
        @keyframes aidenSubFade {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #fdf6f5 0%, #ffffff 60%)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="207" height="91" viewBox="0 0 138 61" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', margin: '0 auto', animation: 'aidenWriteIn 1.5s cubic-bezier(0.45, 0, 0.35, 1) forwards' }}>
            <path d="M8.704 60.48C6.05867 60.48 3.94667 59.52 2.368 57.6C0.789333 55.68 0 53.1627 0 50.048C0 46.6347 0.789333 43.4133 2.368 40.384C3.94667 37.312 6.03733 34.8587 8.64 33.024C11.2853 31.1467 14.08 30.208 17.024 30.208C17.9627 30.208 18.5813 30.4 18.88 30.784C19.2213 31.1253 19.4987 31.7653 19.712 32.704C20.608 32.5333 21.5467 32.448 22.528 32.448C24.6187 32.448 25.664 33.1947 25.664 34.688C25.664 35.584 25.344 37.7173 24.704 41.088C23.7227 45.9947 23.232 49.408 23.232 51.328C23.232 51.968 23.3813 52.48 23.68 52.864C24.0213 53.248 24.448 53.44 24.96 53.44C25.7707 53.44 26.752 52.928 27.904 51.904C29.056 50.8373 30.6133 49.1307 32.576 46.784C33.088 46.1867 33.664 45.888 34.304 45.888C34.8587 45.888 35.2853 46.144 35.584 46.656C35.9253 47.168 36.096 47.872 36.096 48.768C36.096 50.4747 35.6907 51.7973 34.88 52.736C33.1307 54.912 31.2747 56.7467 29.312 58.24C27.3493 59.7333 25.4507 60.48 23.616 60.48C22.208 60.48 20.9067 60.0107 19.712 59.072C18.56 58.0907 17.6853 56.768 17.088 55.104C14.8693 58.688 12.0747 60.48 8.704 60.48ZM11.008 54.016C11.9467 54.016 12.8427 53.4613 13.696 52.352C14.5493 51.2427 15.168 49.7707 15.552 47.936L17.92 36.16C16.128 36.2027 14.464 36.8853 12.928 38.208C11.4347 39.488 10.24 41.1947 9.344 43.328C8.448 45.4613 8 47.7227 8 50.112C8 51.4347 8.256 52.416 8.768 53.056C9.32267 53.696 10.0693 54.016 11.008 54.016Z" fill="#D29C9C"/>
            <path d="M38.7665 60.48C35.9932 60.48 33.9665 59.4987 32.6865 57.536C31.4492 55.5733 30.8305 52.9707 30.8305 49.728C30.8305 47.808 31.0652 45.3547 31.5345 42.368C32.0465 39.3387 32.6865 36.5227 33.4545 33.92C33.8385 32.5547 34.3505 31.616 34.9905 31.104C35.6305 30.592 36.6545 30.336 38.0625 30.336C40.2385 30.336 41.3265 31.0613 41.3265 32.512C41.3265 33.5787 40.9212 36.0533 40.1105 39.936C39.0865 44.6293 38.5745 47.808 38.5745 49.472C38.5745 50.752 38.7452 51.7333 39.0865 52.416C39.4278 53.0987 40.0038 53.44 40.8145 53.44C41.5825 53.44 42.5425 52.9067 43.6945 51.84C44.8465 50.7733 46.3825 49.088 48.3025 46.784C48.8145 46.1867 49.3905 45.888 50.0305 45.888C50.5852 45.888 51.0118 46.144 51.3105 46.656C51.6518 47.168 51.8225 47.872 51.8225 48.768C51.8225 50.4747 51.4172 51.7973 50.6065 52.736C46.3825 57.8987 42.4358 60.48 38.7665 60.48Z" fill="#D29C9C"/>
            <path d="M82.9965 45.888C83.5512 45.888 83.9778 46.144 84.2765 46.656C84.6178 47.168 84.7885 47.872 84.7885 48.768C84.7885 50.4747 84.3832 51.7973 83.5725 52.736C81.8232 54.8693 79.9032 56.704 77.8125 58.24C75.7218 59.7333 73.6525 60.48 71.6045 60.48C68.3618 60.48 65.8872 58.5813 64.1805 54.784C62.3885 57.0453 60.8098 58.56 59.4445 59.328C58.1218 60.096 56.5645 60.48 54.7725 60.48C52.1698 60.48 50.0152 59.52 48.3085 57.6C46.6445 55.6373 45.8125 53.0987 45.8125 49.984C45.8125 46.5707 46.5378 43.4133 47.9885 40.512C49.4392 37.568 51.4232 35.1787 53.9405 33.344C56.5005 31.4667 59.3592 30.3573 62.5165 30.016C63.3272 21.7387 64.8632 14.6773 67.1245 8.832C69.4285 2.944 72.4365 0 76.1485 0C77.9832 0 79.4978 0.832001 80.6925 2.496C81.9298 4.16 82.5485 6.67733 82.5485 10.048C82.5485 14.8267 81.3752 20.416 79.0285 26.816C76.6818 33.216 73.5458 39.7867 69.6205 46.528C69.7912 49.0027 70.1538 50.7733 70.7085 51.84C71.3058 52.9067 72.0525 53.44 72.9485 53.44C74.1005 53.44 75.2738 52.928 76.4685 51.904C77.6632 50.88 79.2632 49.1733 81.2685 46.784C81.7805 46.1867 82.3565 45.888 82.9965 45.888ZM75.4445 6.272C74.6338 6.272 73.8232 7.72267 73.0125 10.624C72.2018 13.4827 71.4978 17.2373 70.9005 21.888C70.3458 26.5387 69.9405 31.4027 69.6845 36.48C74.4632 26.0693 76.8525 17.7067 76.8525 11.392C76.8525 9.77067 76.7032 8.512 76.4045 7.616C76.1485 6.72 75.8285 6.272 75.4445 6.272ZM57.0125 54.016C57.8232 54.016 58.6338 53.696 59.4445 53.056C60.2552 52.3733 61.2792 51.136 62.5165 49.344C62.0898 47.04 61.8765 44.4587 61.8765 41.6C61.8765 40.576 61.9192 38.912 62.0045 36.608C59.6578 37.3333 57.6952 38.912 56.1165 41.344C54.5805 43.7333 53.8125 46.4 53.8125 49.344C53.8125 52.4587 54.8792 54.016 57.0125 54.016Z" fill="#D29C9C"/>
            <path d="M108.126 45.888C108.681 45.888 109.107 46.144 109.406 46.656C109.747 47.168 109.918 47.872 109.918 48.768C109.918 50.4747 109.513 51.7973 108.702 52.736C107.123 54.656 104.883 56.4267 101.982 58.048C99.1233 59.6693 96.0513 60.48 92.766 60.48C88.286 60.48 84.8087 59.264 82.334 56.832C79.8593 54.4 78.622 51.072 78.622 46.848C78.622 43.904 79.2407 41.1733 80.478 38.656C81.7153 36.096 83.422 34.0693 85.598 32.576C87.8167 31.0827 90.3127 30.336 93.086 30.336C95.5607 30.336 97.5447 31.0827 99.038 32.576C100.531 34.0267 101.278 36.0107 101.278 38.528C101.278 41.472 100.211 44.0107 98.078 46.144C95.9873 48.2347 92.4247 49.8987 87.39 51.136C88.4567 53.0987 90.4833 54.08 93.47 54.08C95.39 54.08 97.566 53.4187 99.998 52.096C102.473 50.7307 104.606 48.96 106.398 46.784C106.91 46.1867 107.486 45.888 108.126 45.888ZM91.998 36.608C90.4193 36.608 89.0753 37.5253 87.966 39.36C86.8993 41.1947 86.366 43.4133 86.366 46.016V46.144C88.8833 45.5467 90.8673 44.6507 92.318 43.456C93.7687 42.2613 94.494 40.8747 94.494 39.296C94.494 38.4853 94.2593 37.8453 93.79 37.376C93.3633 36.864 92.766 36.608 91.998 36.608Z" fill="#D29C9C"/>
            <path d="M109.251 60.48C107.63 60.48 106.478 59.6267 105.795 57.92C105.155 56.2133 104.835 53.4827 104.835 49.728C104.835 44.1813 105.624 38.912 107.203 33.92C107.587 32.6827 108.206 31.7867 109.059 31.232C109.955 30.6347 111.192 30.336 112.771 30.336C113.624 30.336 114.222 30.4427 114.563 30.656C114.904 30.8693 115.075 31.2747 115.075 31.872C115.075 32.5547 114.755 34.0907 114.115 36.48C113.688 38.1867 113.347 39.68 113.091 40.96C112.835 42.24 112.622 43.8187 112.451 45.696C113.859 42.0267 115.438 39.04 117.187 36.736C118.936 34.432 120.643 32.7893 122.307 31.808C124.014 30.8267 125.571 30.336 126.979 30.336C128.344 30.336 129.368 30.6987 130.051 31.424C130.776 32.1067 131.139 33.1307 131.139 34.496C131.139 35.6053 130.904 37.696 130.435 40.768C130.008 43.3707 129.667 45.8453 129.411 48.192C129.155 50.496 127.605 54.08 132.215 54.08C134.442 53.8674 137.624 52.3945 137.213 56.3617C136.782 60.527 126.296 60.48 124.803 60.48C123.395 60.48 122.371 60.1173 121.731 59.392C121.091 58.6667 120.771 57.5787 120.771 56.128C120.771 54.4213 121.07 51.6053 121.667 47.68C122.179 44.2667 122.435 42.0907 122.435 41.152C122.435 40.4693 122.2 40.128 121.731 40.128C121.176 40.128 120.387 40.8533 119.363 42.304C118.382 43.712 117.358 45.5893 116.291 47.936C115.267 50.2827 114.435 52.7573 113.795 55.36C113.326 57.3653 112.771 58.7307 112.131 59.456C111.534 60.1387 110.574 60.48 109.251 60.48Z" fill="#D29C9C"/>
            <path d="M8.704 60.48C6.05867 60.48 3.94667 59.52 2.368 57.6C0.789333 55.68 0 53.1627 0 50.048C0 46.6347 0.789333 43.4133 2.368 40.384C3.94667 37.312 6.03733 34.8587 8.64 33.024C11.2853 31.1467 14.08 30.208 17.024 30.208C17.9627 30.208 18.5813 30.4 18.88 30.784C19.2213 31.1253 19.4987 31.7653 19.712 32.704C20.608 32.5333 21.5467 32.448 22.528 32.448C24.6187 32.448 25.664 33.1947 25.664 34.688C25.664 35.584 25.344 37.7173 24.704 41.088C23.7227 45.9947 23.232 49.408 23.232 51.328C23.232 51.968 23.3813 52.48 23.68 52.864C24.0213 53.248 24.448 53.44 24.96 53.44C25.7707 53.44 26.752 52.928 27.904 51.904C29.056 50.8373 30.6133 49.1307 32.576 46.784C33.088 46.1867 33.664 45.888 34.304 45.888C34.8587 45.888 35.2853 46.144 35.584 46.656C35.9253 47.168 36.096 47.872 36.096 48.768C36.096 50.4747 35.6907 51.7973 34.88 52.736C33.1307 54.912 31.2747 56.7467 29.312 58.24C27.3493 59.7333 25.4507 60.48 23.616 60.48C22.208 60.48 20.9067 60.0107 19.712 59.072C18.56 58.0907 17.6853 56.768 17.088 55.104C14.8693 58.688 12.0747 60.48 8.704 60.48ZM11.008 54.016C11.9467 54.016 12.8427 53.4613 13.696 52.352C14.5493 51.2427 15.168 49.7707 15.552 47.936L17.92 36.16C16.128 36.2027 14.464 36.8853 12.928 38.208C11.4347 39.488 10.24 41.1947 9.344 43.328C8.448 45.4613 8 47.7227 8 50.112C8 51.4347 8.256 52.416 8.768 53.056C9.32267 53.696 10.0693 54.016 11.008 54.016Z" fill="#904848"/>
            <path d="M38.7665 60.48C35.9932 60.48 33.9665 59.4987 32.6865 57.536C31.4492 55.5733 30.8305 52.9707 30.8305 49.728C30.8305 47.808 31.0652 45.3547 31.5345 42.368C32.0465 39.3387 32.6865 36.5227 33.4545 33.92C33.8385 32.5547 34.3505 31.616 34.9905 31.104C35.6305 30.592 36.6545 30.336 38.0625 30.336C40.2385 30.336 41.3265 31.0613 41.3265 32.512C41.3265 33.5787 40.9212 36.0533 40.1105 39.936C39.0865 44.6293 38.5745 47.808 38.5745 49.472C38.5745 50.752 38.7452 51.7333 39.0865 52.416C39.4278 53.0987 40.0038 53.44 40.8145 53.44C41.5825 53.44 42.5425 52.9067 43.6945 51.84C44.8465 50.7733 46.3825 49.088 48.3025 46.784C48.8145 46.1867 49.3905 45.888 50.0305 45.888C50.5852 45.888 51.0118 46.144 51.3105 46.656C51.6518 47.168 51.8225 47.872 51.8225 48.768C51.8225 50.4747 51.4172 51.7973 50.6065 52.736C46.3825 57.8987 42.4358 60.48 38.7665 60.48Z" fill="#904848"/>
            <path d="M82.9965 45.888C83.5512 45.888 83.9778 46.144 84.2765 46.656C84.6178 47.168 84.7885 47.872 84.7885 48.768C84.7885 50.4747 84.3832 51.7973 83.5725 52.736C81.8232 54.8693 79.9032 56.704 77.8125 58.24C75.7218 59.7333 73.6525 60.48 71.6045 60.48C68.3618 60.48 65.8872 58.5813 64.1805 54.784C62.3885 57.0453 60.8098 58.56 59.4445 59.328C58.1218 60.096 56.5645 60.48 54.7725 60.48C52.1698 60.48 50.0152 59.52 48.3085 57.6C46.6445 55.6373 45.8125 53.0987 45.8125 49.984C45.8125 46.5707 46.5378 43.4133 47.9885 40.512C49.4392 37.568 51.4232 35.1787 53.9405 33.344C56.5005 31.4667 59.3592 30.3573 62.5165 30.016C63.3272 21.7387 64.8632 14.6773 67.1245 8.832C69.4285 2.944 72.4365 0 76.1485 0C77.9832 0 79.4978 0.832001 80.6925 2.496C81.9298 4.16 82.5485 6.67733 82.5485 10.048C82.5485 14.8267 81.3752 20.416 79.0285 26.816C76.6818 33.216 73.5458 39.7867 69.6205 46.528C69.7912 49.0027 70.1538 50.7733 70.7085 51.84C71.3058 52.9067 72.0525 53.44 72.9485 53.44C74.1005 53.44 75.2738 52.928 76.4685 51.904C77.6632 50.88 79.2632 49.1733 81.2685 46.784C81.7805 46.1867 82.3565 45.888 82.9965 45.888ZM75.4445 6.272C74.6338 6.272 73.8232 7.72267 73.0125 10.624C72.2018 13.4827 71.4978 17.2373 70.9005 21.888C70.3458 26.5387 69.9405 31.4027 69.6845 36.48C74.4632 26.0693 76.8525 17.7067 76.8525 11.392C76.8525 9.77067 76.7032 8.512 76.4045 7.616C76.1485 6.72 75.8285 6.272 75.4445 6.272ZM57.0125 54.016C57.8232 54.016 58.6338 53.696 59.4445 53.056C60.2552 52.3733 61.2792 51.136 62.5165 49.344C62.0898 47.04 61.8765 44.4587 61.8765 41.6C61.8765 40.576 61.9192 38.912 62.0045 36.608C59.6578 37.3333 57.6952 38.912 56.1165 41.344C54.5805 43.7333 53.8125 46.4 53.8125 49.344C53.8125 52.4587 54.8792 54.016 57.0125 54.016Z" fill="#904848"/>
            <path d="M108.126 45.888C108.681 45.888 109.107 46.144 109.406 46.656C109.747 47.168 109.918 47.872 109.918 48.768C109.918 50.4747 109.513 51.7973 108.702 52.736C107.123 54.656 104.883 56.4267 101.982 58.048C99.1233 59.6693 96.0513 60.48 92.766 60.48C88.286 60.48 84.8087 59.264 82.334 56.832C79.8593 54.4 78.622 51.072 78.622 46.848C78.622 43.904 79.2407 41.1733 80.478 38.656C81.7153 36.096 83.422 34.0693 85.598 32.576C87.8167 31.0827 90.3127 30.336 93.086 30.336C95.5607 30.336 97.5447 31.0827 99.038 32.576C100.531 34.0267 101.278 36.0107 101.278 38.528C101.278 41.472 100.211 44.0107 98.078 46.144C95.9873 48.2347 92.4247 49.8987 87.39 51.136C88.4567 53.0987 90.4833 54.08 93.47 54.08C95.39 54.08 97.566 53.4187 99.998 52.096C102.473 50.7307 104.606 48.96 106.398 46.784C106.91 46.1867 107.486 45.888 108.126 45.888ZM91.998 36.608C90.4193 36.608 89.0753 37.5253 87.966 39.36C86.8993 41.1947 86.366 43.4133 86.366 46.016V46.144C88.8833 45.5467 90.8673 44.6507 92.318 43.456C93.7687 42.2613 94.494 40.8747 94.494 39.296C94.494 38.4853 94.2593 37.8453 93.79 37.376C93.3633 36.864 92.766 36.608 91.998 36.608Z" fill="#904848"/>
            <path d="M109.251 60.48C107.63 60.48 106.478 59.6267 105.795 57.92C105.155 56.2133 104.835 53.4827 104.835 49.728C104.835 44.1813 105.624 38.912 107.203 33.92C107.587 32.6827 108.206 31.7867 109.059 31.232C109.955 30.6347 111.192 30.336 112.771 30.336C113.624 30.336 114.222 30.4427 114.563 30.656C114.904 30.8693 115.075 31.2747 115.075 31.872C115.075 32.5547 114.755 34.0907 114.115 36.48C113.688 38.1867 113.347 39.68 113.091 40.96C112.835 42.24 112.622 43.8187 112.451 45.696C113.859 42.0267 115.438 39.04 117.187 36.736C118.936 34.432 120.643 32.7893 122.307 31.808C124.014 30.8267 125.571 30.336 126.979 30.336C128.344 30.336 129.368 30.6987 130.051 31.424C130.776 32.1067 131.139 33.1307 131.139 34.496C131.139 35.6053 130.904 37.696 130.435 40.768C130.008 43.3707 129.667 45.8453 129.411 48.192C129.155 50.496 127.605 54.08 132.215 54.08C134.442 53.8674 137.624 52.3945 137.213 56.3617C136.782 60.527 126.296 60.48 124.803 60.48C123.395 60.48 122.371 60.1173 121.731 59.392C121.091 58.6667 120.771 57.5787 120.771 56.128C120.771 54.4213 121.07 51.6053 121.667 47.68C122.179 44.2667 122.435 42.0907 122.435 41.152C122.435 40.4693 122.2 40.128 121.731 40.128C121.176 40.128 120.387 40.8533 119.363 42.304C118.382 43.712 117.358 45.5893 116.291 47.936C115.267 50.2827 114.435 52.7573 113.795 55.36C113.326 57.3653 112.771 58.7307 112.131 59.456C111.534 60.1387 110.574 60.48 109.251 60.48Z" fill="#904848"/>
            <g clipPath="url(#splashHeartClip)">
              <path d="M48.1737 14.5326C47.8274 14.0773 47.3949 13.6947 46.9007 13.4067C46.4066 13.1186 45.8605 12.9308 45.2938 12.8538C44.727 12.7768 44.1506 12.8123 43.5976 12.9582C43.0445 13.104 42.5256 13.3574 42.0705 13.7039L41.1261 14.4225L40.4074 13.4781C39.708 12.5589 38.672 11.9551 37.5275 11.7997C36.3829 11.6443 35.2235 11.9499 34.3043 12.6494C33.385 13.3488 32.7813 14.3848 32.6259 15.5293C32.4705 16.6739 32.7761 17.8333 33.4756 18.7526L39.4687 26.6288L47.345 20.6357C47.8002 20.2895 48.1828 19.8569 48.4709 19.3628C48.7589 18.8687 48.9468 18.3226 49.0238 17.7558C49.1007 17.1891 49.0652 16.6127 48.9194 16.0596C48.7735 15.5066 48.5201 14.9877 48.1737 14.5326Z" fill="#904848"/>
            </g>
            <defs>
              <clipPath id="splashHeartClip">
                <rect width="19" height="19" fill="white" transform="translate(32.3164 8.6964) rotate(7.73233)"/>
              </clipPath>
            </defs>
          </svg>
          {subtitle && (
            <p style={{ color: '#b4aca2', fontFamily: "'Ledger', Georgia, serif", fontSize: 14, marginTop: 24,
              animation: 'aidenSubFade 0.5s ease 1.6s both' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </>
  );

  if (authLoading) return <SplashScreen />;

  if (!user) return <AuthScreen />;

  if (dataLoading) return <SplashScreen subtitle="Setting up your account…" />;

  // ── Render ───────────────────────────────────────────────────────────────────
  function renderContent() {
    if (showAddEvent) return <AddEventScreen onBack={() => setShowAddEvent(false)} onSave={handleAddAppointments} recipients={recipients} />;
    if (showRecipients) {
      if (selRecipient) return <RecipientProfile r={selRecipient} onBack={() => setSelRecipient(null)} onUpdate={updateRecipient} doctors={doctors} appointments={appointments} />;
      return <RecipientsPage recipients={recipients} onSelect={r => setSelRecipient(r)} onBack={() => setShowRecipients(false)} />;
    }
    if (tab === "home") return selRecipient
      ? <RecipientProfile r={selRecipient} onBack={() => setSelRecipient(null)} onUpdate={updateRecipient} doctors={doctors} appointments={appointments} />
      : <HomeTab recipients={recipients} appointments={appointments} logistics={logistics} onSelect={r => setSelRecipient(r)} onGoToList={() => setTab("list")} showMsg={showMsg} setShowMsg={setShowMsg} onShowAddEvent={() => setShowAddEvent(true)} />;
    if (tab === "calendar")  return <CalendarTab appointments={appointments} recipients={recipients} onShowAddEvent={() => setShowAddEvent(true)} />;
    if (tab === "list")      return <ListTab logistics={logistics} onUpdateLogistic={updateLogisticItem} onAddLogistic={addLogisticItem} doctors={doctors} recipients={recipients} />;
    if (tab === "info")      return <InfoTab recipients={recipients} />;
    if (tab === "chat")      return <ChatTab messages={chatMessages} setMessages={setChatMessages} />;
  }

  return (
    <div style={{ height: "100%", background: C.bg, display: "flex", flexDirection: "column", fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ledger&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* App header */}
      {!showAddEvent && !(tab === "home" && selRecipient) && tab !== "chat" && (
        <div style={{ background: GRAD, paddingTop: "env(safe-area-inset-top, 0px)", paddingLeft: 18, paddingRight: 18, paddingBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => { setTab("home"); setSelRecipient(null); setShowRecipients(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <svg width="72" height="32" viewBox="0 0 138 61" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.704 60.48C6.05867 60.48 3.94667 59.52 2.368 57.6C0.789333 55.68 0 53.1627 0 50.048C0 46.6347 0.789333 43.4133 2.368 40.384C3.94667 37.312 6.03733 34.8587 8.64 33.024C11.2853 31.1467 14.08 30.208 17.024 30.208C17.9627 30.208 18.5813 30.4 18.88 30.784C19.2213 31.1253 19.4987 31.7653 19.712 32.704C20.608 32.5333 21.5467 32.448 22.528 32.448C24.6187 32.448 25.664 33.1947 25.664 34.688C25.664 35.584 25.344 37.7173 24.704 41.088C23.7227 45.9947 23.232 49.408 23.232 51.328C23.232 51.968 23.3813 52.48 23.68 52.864C24.0213 53.248 24.448 53.44 24.96 53.44C25.7707 53.44 26.752 52.928 27.904 51.904C29.056 50.8373 30.6133 49.1307 32.576 46.784C33.088 46.1867 33.664 45.888 34.304 45.888C34.8587 45.888 35.2853 46.144 35.584 46.656C35.9253 47.168 36.096 47.872 36.096 48.768C36.096 50.4747 35.6907 51.7973 34.88 52.736C33.1307 54.912 31.2747 56.7467 29.312 58.24C27.3493 59.7333 25.4507 60.48 23.616 60.48C22.208 60.48 20.9067 60.0107 19.712 59.072C18.56 58.0907 17.6853 56.768 17.088 55.104C14.8693 58.688 12.0747 60.48 8.704 60.48ZM11.008 54.016C11.9467 54.016 12.8427 53.4613 13.696 52.352C14.5493 51.2427 15.168 49.7707 15.552 47.936L17.92 36.16C16.128 36.2027 14.464 36.8853 12.928 38.208C11.4347 39.488 10.24 41.1947 9.344 43.328C8.448 45.4613 8 47.7227 8 50.112C8 51.4347 8.256 52.416 8.768 53.056C9.32267 53.696 10.0693 54.016 11.008 54.016Z" fill="#D29C9C"/>
              <path d="M38.7665 60.48C35.9932 60.48 33.9665 59.4987 32.6865 57.536C31.4492 55.5733 30.8305 52.9707 30.8305 49.728C30.8305 47.808 31.0652 45.3547 31.5345 42.368C32.0465 39.3387 32.6865 36.5227 33.4545 33.92C33.8385 32.5547 34.3505 31.616 34.9905 31.104C35.6305 30.592 36.6545 30.336 38.0625 30.336C40.2385 30.336 41.3265 31.0613 41.3265 32.512C41.3265 33.5787 40.9212 36.0533 40.1105 39.936C39.0865 44.6293 38.5745 47.808 38.5745 49.472C38.5745 50.752 38.7452 51.7333 39.0865 52.416C39.4278 53.0987 40.0038 53.44 40.8145 53.44C41.5825 53.44 42.5425 52.9067 43.6945 51.84C44.8465 50.7733 46.3825 49.088 48.3025 46.784C48.8145 46.1867 49.3905 45.888 50.0305 45.888C50.5852 45.888 51.0118 46.144 51.3105 46.656C51.6518 47.168 51.8225 47.872 51.8225 48.768C51.8225 50.4747 51.4172 51.7973 50.6065 52.736C46.3825 57.8987 42.4358 60.48 38.7665 60.48Z" fill="#D29C9C"/>
              <path d="M82.9965 45.888C83.5512 45.888 83.9778 46.144 84.2765 46.656C84.6178 47.168 84.7885 47.872 84.7885 48.768C84.7885 50.4747 84.3832 51.7973 83.5725 52.736C81.8232 54.8693 79.9032 56.704 77.8125 58.24C75.7218 59.7333 73.6525 60.48 71.6045 60.48C68.3618 60.48 65.8872 58.5813 64.1805 54.784C62.3885 57.0453 60.8098 58.56 59.4445 59.328C58.1218 60.096 56.5645 60.48 54.7725 60.48C52.1698 60.48 50.0152 59.52 48.3085 57.6C46.6445 55.6373 45.8125 53.0987 45.8125 49.984C45.8125 46.5707 46.5378 43.4133 47.9885 40.512C49.4392 37.568 51.4232 35.1787 53.9405 33.344C56.5005 31.4667 59.3592 30.3573 62.5165 30.016C63.3272 21.7387 64.8632 14.6773 67.1245 8.832C69.4285 2.944 72.4365 0 76.1485 0C77.9832 0 79.4978 0.832001 80.6925 2.496C81.9298 4.16 82.5485 6.67733 82.5485 10.048C82.5485 14.8267 81.3752 20.416 79.0285 26.816C76.6818 33.216 73.5458 39.7867 69.6205 46.528C69.7912 49.0027 70.1538 50.7733 70.7085 51.84C71.3058 52.9067 72.0525 53.44 72.9485 53.44C74.1005 53.44 75.2738 52.928 76.4685 51.904C77.6632 50.88 79.2632 49.1733 81.2685 46.784C81.7805 46.1867 82.3565 45.888 82.9965 45.888ZM75.4445 6.272C74.6338 6.272 73.8232 7.72267 73.0125 10.624C72.2018 13.4827 71.4978 17.2373 70.9005 21.888C70.3458 26.5387 69.9405 31.4027 69.6845 36.48C74.4632 26.0693 76.8525 17.7067 76.8525 11.392C76.8525 9.77067 76.7032 8.512 76.4045 7.616C76.1485 6.72 75.8285 6.272 75.4445 6.272ZM57.0125 54.016C57.8232 54.016 58.6338 53.696 59.4445 53.056C60.2552 52.3733 61.2792 51.136 62.5165 49.344C62.0898 47.04 61.8765 44.4587 61.8765 41.6C61.8765 40.576 61.9192 38.912 62.0045 36.608C59.6578 37.3333 57.6952 38.912 56.1165 41.344C54.5805 43.7333 53.8125 46.4 53.8125 49.344C53.8125 52.4587 54.8792 54.016 57.0125 54.016Z" fill="#D29C9C"/>
              <path d="M108.126 45.888C108.681 45.888 109.107 46.144 109.406 46.656C109.747 47.168 109.918 47.872 109.918 48.768C109.918 50.4747 109.513 51.7973 108.702 52.736C107.123 54.656 104.883 56.4267 101.982 58.048C99.1233 59.6693 96.0513 60.48 92.766 60.48C88.286 60.48 84.8087 59.264 82.334 56.832C79.8593 54.4 78.622 51.072 78.622 46.848C78.622 43.904 79.2407 41.1733 80.478 38.656C81.7153 36.096 83.422 34.0693 85.598 32.576C87.8167 31.0827 90.3127 30.336 93.086 30.336C95.5607 30.336 97.5447 31.0827 99.038 32.576C100.531 34.0267 101.278 36.0107 101.278 38.528C101.278 41.472 100.211 44.0107 98.078 46.144C95.9873 48.2347 92.4247 49.8987 87.39 51.136C88.4567 53.0987 90.4833 54.08 93.47 54.08C95.39 54.08 97.566 53.4187 99.998 52.096C102.473 50.7307 104.606 48.96 106.398 46.784C106.91 46.1867 107.486 45.888 108.126 45.888ZM91.998 36.608C90.4193 36.608 89.0753 37.5253 87.966 39.36C86.8993 41.1947 86.366 43.4133 86.366 46.016V46.144C88.8833 45.5467 90.8673 44.6507 92.318 43.456C93.7687 42.2613 94.494 40.8747 94.494 39.296C94.494 38.4853 94.2593 37.8453 93.79 37.376C93.3633 36.864 92.766 36.608 91.998 36.608Z" fill="#D29C9C"/>
              <path d="M109.251 60.48C107.63 60.48 106.478 59.6267 105.795 57.92C105.155 56.2133 104.835 53.4827 104.835 49.728C104.835 44.1813 105.624 38.912 107.203 33.92C107.587 32.6827 108.206 31.7867 109.059 31.232C109.955 30.6347 111.192 30.336 112.771 30.336C113.624 30.336 114.222 30.4427 114.563 30.656C114.904 30.8693 115.075 31.2747 115.075 31.872C115.075 32.5547 114.755 34.0907 114.115 36.48C113.688 38.1867 113.347 39.68 113.091 40.96C112.835 42.24 112.622 43.8187 112.451 45.696C113.859 42.0267 115.438 39.04 117.187 36.736C118.936 34.432 120.643 32.7893 122.307 31.808C124.014 30.8267 125.571 30.336 126.979 30.336C128.344 30.336 129.368 30.6987 130.051 31.424C130.776 32.1067 131.139 33.1307 131.139 34.496C131.139 35.6053 130.904 37.696 130.435 40.768C130.008 43.3707 129.667 45.8453 129.411 48.192C129.155 50.496 127.605 54.08 132.215 54.08C134.442 53.8674 137.624 52.3945 137.213 56.3617C136.782 60.527 126.296 60.48 124.803 60.48C123.395 60.48 122.371 60.1173 121.731 59.392C121.091 58.6667 120.771 57.5787 120.771 56.128C120.771 54.4213 121.07 51.6053 121.667 47.68C122.179 44.2667 122.435 42.0907 122.435 41.152C122.435 40.4693 122.2 40.128 121.731 40.128C121.176 40.128 120.387 40.8533 119.363 42.304C118.382 43.712 117.358 45.5893 116.291 47.936C115.267 50.2827 114.435 52.7573 113.795 55.36C113.326 57.3653 112.771 58.7307 112.131 59.456C111.534 60.1387 110.574 60.48 109.251 60.48Z" fill="#D29C9C"/>
              <path d="M8.704 60.48C6.05867 60.48 3.94667 59.52 2.368 57.6C0.789333 55.68 0 53.1627 0 50.048C0 46.6347 0.789333 43.4133 2.368 40.384C3.94667 37.312 6.03733 34.8587 8.64 33.024C11.2853 31.1467 14.08 30.208 17.024 30.208C17.9627 30.208 18.5813 30.4 18.88 30.784C19.2213 31.1253 19.4987 31.7653 19.712 32.704C20.608 32.5333 21.5467 32.448 22.528 32.448C24.6187 32.448 25.664 33.1947 25.664 34.688C25.664 35.584 25.344 37.7173 24.704 41.088C23.7227 45.9947 23.232 49.408 23.232 51.328C23.232 51.968 23.3813 52.48 23.68 52.864C24.0213 53.248 24.448 53.44 24.96 53.44C25.7707 53.44 26.752 52.928 27.904 51.904C29.056 50.8373 30.6133 49.1307 32.576 46.784C33.088 46.1867 33.664 45.888 34.304 45.888C34.8587 45.888 35.2853 46.144 35.584 46.656C35.9253 47.168 36.096 47.872 36.096 48.768C36.096 50.4747 35.6907 51.7973 34.88 52.736C33.1307 54.912 31.2747 56.7467 29.312 58.24C27.3493 59.7333 25.4507 60.48 23.616 60.48C22.208 60.48 20.9067 60.0107 19.712 59.072C18.56 58.0907 17.6853 56.768 17.088 55.104C14.8693 58.688 12.0747 60.48 8.704 60.48ZM11.008 54.016C11.9467 54.016 12.8427 53.4613 13.696 52.352C14.5493 51.2427 15.168 49.7707 15.552 47.936L17.92 36.16C16.128 36.2027 14.464 36.8853 12.928 38.208C11.4347 39.488 10.24 41.1947 9.344 43.328C8.448 45.4613 8 47.7227 8 50.112C8 51.4347 8.256 52.416 8.768 53.056C9.32267 53.696 10.0693 54.016 11.008 54.016Z" fill="#904848"/>
              <path d="M38.7665 60.48C35.9932 60.48 33.9665 59.4987 32.6865 57.536C31.4492 55.5733 30.8305 52.9707 30.8305 49.728C30.8305 47.808 31.0652 45.3547 31.5345 42.368C32.0465 39.3387 32.6865 36.5227 33.4545 33.92C33.8385 32.5547 34.3505 31.616 34.9905 31.104C35.6305 30.592 36.6545 30.336 38.0625 30.336C40.2385 30.336 41.3265 31.0613 41.3265 32.512C41.3265 33.5787 40.9212 36.0533 40.1105 39.936C39.0865 44.6293 38.5745 47.808 38.5745 49.472C38.5745 50.752 38.7452 51.7333 39.0865 52.416C39.4278 53.0987 40.0038 53.44 40.8145 53.44C41.5825 53.44 42.5425 52.9067 43.6945 51.84C44.8465 50.7733 46.3825 49.088 48.3025 46.784C48.8145 46.1867 49.3905 45.888 50.0305 45.888C50.5852 45.888 51.0118 46.144 51.3105 46.656C51.6518 47.168 51.8225 47.872 51.8225 48.768C51.8225 50.4747 51.4172 51.7973 50.6065 52.736C46.3825 57.8987 42.4358 60.48 38.7665 60.48Z" fill="#904848"/>
              <path d="M82.9965 45.888C83.5512 45.888 83.9778 46.144 84.2765 46.656C84.6178 47.168 84.7885 47.872 84.7885 48.768C84.7885 50.4747 84.3832 51.7973 83.5725 52.736C81.8232 54.8693 79.9032 56.704 77.8125 58.24C75.7218 59.7333 73.6525 60.48 71.6045 60.48C68.3618 60.48 65.8872 58.5813 64.1805 54.784C62.3885 57.0453 60.8098 58.56 59.4445 59.328C58.1218 60.096 56.5645 60.48 54.7725 60.48C52.1698 60.48 50.0152 59.52 48.3085 57.6C46.6445 55.6373 45.8125 53.0987 45.8125 49.984C45.8125 46.5707 46.5378 43.4133 47.9885 40.512C49.4392 37.568 51.4232 35.1787 53.9405 33.344C56.5005 31.4667 59.3592 30.3573 62.5165 30.016C63.3272 21.7387 64.8632 14.6773 67.1245 8.832C69.4285 2.944 72.4365 0 76.1485 0C77.9832 0 79.4978 0.832001 80.6925 2.496C81.9298 4.16 82.5485 6.67733 82.5485 10.048C82.5485 14.8267 81.3752 20.416 79.0285 26.816C76.6818 33.216 73.5458 39.7867 69.6205 46.528C69.7912 49.0027 70.1538 50.7733 70.7085 51.84C71.3058 52.9067 72.0525 53.44 72.9485 53.44C74.1005 53.44 75.2738 52.928 76.4685 51.904C77.6632 50.88 79.2632 49.1733 81.2685 46.784C81.7805 46.1867 82.3565 45.888 82.9965 45.888ZM75.4445 6.272C74.6338 6.272 73.8232 7.72267 73.0125 10.624C72.2018 13.4827 71.4978 17.2373 70.9005 21.888C70.3458 26.5387 69.9405 31.4027 69.6845 36.48C74.4632 26.0693 76.8525 17.7067 76.8525 11.392C76.8525 9.77067 76.7032 8.512 76.4045 7.616C76.1485 6.72 75.8285 6.272 75.4445 6.272ZM57.0125 54.016C57.8232 54.016 58.6338 53.696 59.4445 53.056C60.2552 52.3733 61.2792 51.136 62.5165 49.344C62.0898 47.04 61.8765 44.4587 61.8765 41.6C61.8765 40.576 61.9192 38.912 62.0045 36.608C59.6578 37.3333 57.6952 38.912 56.1165 41.344C54.5805 43.7333 53.8125 46.4 53.8125 49.344C53.8125 52.4587 54.8792 54.016 57.0125 54.016Z" fill="#904848"/>
              <g clipPath="url(#heartClip)">
                <path d="M48.1737 14.5326C47.8274 14.0773 47.3949 13.6947 46.9007 13.4067C46.4066 13.1186 45.8605 12.9308 45.2938 12.8538C44.727 12.7768 44.1506 12.8123 43.5976 12.9582C43.0445 13.104 42.5256 13.3574 42.0705 13.7039L41.1261 14.4225L40.4074 13.4781C39.708 12.5589 38.672 11.9551 37.5275 11.7997C36.3829 11.6443 35.2235 11.9499 34.3043 12.6494C33.385 13.3488 32.7813 14.3848 32.6259 15.5293C32.4705 16.6739 32.7761 17.8333 33.4756 18.7526L39.4687 26.6288L47.345 20.6357C47.8002 20.2895 48.1828 19.8569 48.4709 19.3628C48.7589 18.8687 48.9468 18.3226 49.0238 17.7558C49.1007 17.1891 49.0652 16.6127 48.9194 16.0596C48.7735 15.5066 48.5201 14.9877 48.1737 14.5326Z" fill="#904848"/>
              </g>
              <defs>
                <clipPath id="heartClip">
                  <rect width="19" height="19" fill="white" transform="translate(32.3164 8.6964) rotate(7.73233)"/>
                </clipPath>
              </defs>
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { setShowRecipients(true); setSelRecipient(null); }} style={{ display: "flex", alignItems: "center", gap: 5, background: C.primaryLight, borderRadius: 20, padding: "5px 10px 5px 8px", border: "none", cursor: "pointer" }}>
              <User size={13} color={C.primaryDark} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primaryDark, fontFamily: sans }}>{recipients.length}</span>
            </button>
            <Bell size={17} color={C.mutedLight} />
            <button onClick={() => signOut(auth)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} title="Sign out">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.mutedLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", background: C.bg, display: "flex", flexDirection: "column" }}>
        {renderContent()}
      </div>

      {/* Bottom nav */}
      <div style={{ background: "linear-gradient(180deg, rgba(253,246,245,0.92) 0%, rgba(255,255,255,0.92) 100%)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: 8, paddingTop: 8, paddingLeft: "5%", paddingRight: "5%", flexShrink: 0 }}>
        {NAV.map(({ id, Icon, label }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => { setTab(id); if (id !== "home") setSelRecipient(null); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: active ? C.primaryLight : "transparent", borderRadius: 10 }}>
                <Icon size={20} color={active ? C.primary : C.mutedLight} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, color: active ? C.primary : C.mutedLight, fontFamily: sans, letterSpacing: 0.2 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
