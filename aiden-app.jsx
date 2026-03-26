import { useState } from "react";
import {
  Home, CalendarDays, ClipboardList, Shield, MessageCircle,
  Plus, ChevronRight, ChevronLeft, Phone, Heart,
  CheckSquare, Square, Send, Clock, FileText,
  AlertCircle, Bell, Check, Info, ExternalLink, Eye, EyeOff,
} from "lucide-react";

// ─── COLOR PALETTE (warm neutrals) ─────────────────────────────────────────────

const C = {
  primary:      "#8096b2",  // warm slate blue
  primaryLight: "#e9eff6",
  primaryDark:  "#5c7490",
  rose:         "#bf8880",  // soft dusty rose  (recipient 1 / Mom)
  roseLight:    "#f7efed",
  blue:         "#7a92b0",  // soft muted blue  (recipient 2 / Tommy)
  blueLight:    "#e9eff6",
  bg:           "#f6f3f0",  // warm off-white background
  card:         "#ffffff",
  border:       "#e6e0d9",  // warm light border
  text:         "#3a3028",  // warm near-black
  muted:        "#8a8078",  // warm medium gray
  mutedLight:   "#b0a89e",
  sage:         "#7fa898",  // muted sage / success
  peach:        "#d4a47c",  // warm peach / warning
  coral:        "#bf7a74",  // soft coral / danger
  pink:         "#dba8a0",  // soft pink accent
  lavender:     "#9e8fb5",  // soft lavender
  lavenderLight:"#f0edf6",
};

// ─── DATA ──────────────────────────────────────────────────────────────────────

const DAILY_MESSAGES = [
  { text: "Every small act of care you give today matters more than you know. You are someone's whole world.", note: "Day 1" },
  { text: "You don't have to do everything perfectly. Showing up with love is enough.", note: "Day 2" },
  { text: "Taking care of yourself is part of taking care of them. Rest is not selfish — it is necessary.", note: "Day 3" },
  { text: "Caregiving is one of the most profound acts of love a person can offer. Your dedication is extraordinary.", note: "Day 4" },
  { text: "It's okay to feel overwhelmed sometimes. That means you care deeply. Give yourself grace today.", note: "Day 5" },
  { text: "You are doing a hard, beautiful, important thing. Don't forget to celebrate yourself too.", note: "Day 6" },
  { text: "The person you care for is lucky to have you — even on the days it doesn't feel that way.", note: "Day 7" },
  { text: "One step at a time. You don't have to solve everything today. Just be present.", note: "Day 8" },
  { text: "Caregiving asks so much of you. Please don't forget to ask something of yourself — rest, joy, connection.", note: "Day 9" },
  { text: "Your patience and love are quietly shaping someone's entire experience of the world. That is everything.", note: "Day 10" },
  { text: "Today might be hard. That's okay. Hard days pass, and your strength remains.", note: "Day 11" },
  { text: "You are not alone in this. Millions of people walk this road. Reach out when you need to.", note: "Day 12" },
  { text: "Breathe. You are enough. What you are doing is enough. You are more capable than you realize.", note: "Day 13" },
  { text: "Even the smallest moments of joy — a smile, a song, a shared meal — are worth cherishing.", note: "Day 14" },
  { text: "There is no perfect way to be a caregiver. There is only your way, done with love. That is enough.", note: "Day 15" },
  { text: "Your loved one sees your love, even when words are hard. Presence is the greatest gift.", note: "Day 16" },
  { text: "It's okay to grieve the things that have changed while still celebrating what remains.", note: "Day 17" },
  { text: "You are building something invisible and irreplaceable: a legacy of compassion and devotion.", note: "Day 18" },
  { text: "Accepting help is not weakness. It is wisdom. You deserve a village too.", note: "Day 19" },
  { text: "The hard conversations, the long drives, the middle-of-the-night moments — they all count.", note: "Day 20" },
  { text: "You show up even when it's hard. That quiet consistency is one of the most loving things a person can do.", note: "Day 21" },
  { text: "Caregiving teaches us what truly matters. You are living that lesson with grace.", note: "Day 22" },
  { text: "Today, do one small thing for yourself. Even five minutes of something that restores you.", note: "Day 23" },
  { text: "Love is action. And every action you take in care is a profound expression of love.", note: "Day 24" },
  { text: "You are navigating one of life's most complex seasons. Be proud of how far you've come.", note: "Day 25" },
  { text: "It's okay not to have all the answers. Doing your best with what you know is always enough.", note: "Day 26" },
  { text: "The person you're caring for may not be able to say it today, but your love reaches them.", note: "Day 27" },
  { text: "You carry a lot. Please remember that you're allowed to put some of it down for a little while.", note: "Day 28" },
  { text: "Your empathy and endurance are remarkable. Don't let the hard days make you forget that.", note: "Day 29" },
  { text: "Every day you show up is a gift. Thank you for being someone who shows up.", note: "Day 30" },
  { text: "You are doing sacred work. The love you give quietly sustains someone else's whole world.", note: "Day 31" },
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
  medicare: {
    name: "Medicare", shortName: "Medicare", color: "#5c7a9e", bg: "#edf1f7", emoji: "🏛️",
    parts: [
      { name: "Part A – Hospital Insurance", plain: "Covers inpatient hospital stays, skilled nursing facility care (up to 100 days after a hospital stay), hospice care, and some home health services. No monthly premium if you've worked 10+ years.", phone: "1-800-633-4227" },
      { name: "Part B – Medical Insurance", plain: "Covers doctor visits, outpatient care, preventive services like flu shots and screenings, and durable medical equipment. Monthly premium is around $185/month in 2026.", phone: "1-800-633-4227" },
      { name: "Part D – Prescriptions", plain: "Covers prescription drugs through private plans. Each plan has its own list of covered drugs (formulary). Review your plan's formulary annually during open enrollment.", phone: "1-800-633-4227" },
    ],
    warning: "⚠️ Medicare does NOT cover long-term custodial care (help with daily activities like bathing, dressing). Consider a supplemental Medigap plan or long-term care insurance.",
  },
  humana: {
    name: "Humana Medicare Advantage", shortName: "Humana", color: "#5e8a78", bg: "#edf4f1", emoji: "🌿",
    parts: [
      { name: "Part C – Medicare Advantage", plain: "Bundles Medicare Parts A & B, often including Part D (drugs), dental, vision, and hearing benefits. Usually lower premiums than original Medicare, but you must use network providers and may need referrals to see specialists.", phone: "1-800-833-6917" },
    ],
    warning: "⚠️ Always confirm a provider is in-network before scheduling appointments. Most Humana plans require a referral from your primary care doctor before seeing a specialist.",
  },
  medicaid: {
    name: "Medicaid", shortName: "Medicaid", color: "#9279a8", bg: "#f2eef7", emoji: "🏥",
    parts: [
      { name: "Full Coverage", plain: "Comprehensive health coverage for eligible low-income individuals. Covers doctor visits, hospital care, long-term care, mental health services, prescriptions, and home and community-based care. Coverage details vary by state.", phone: "1-877-267-2323" },
    ],
    warning: "✅ Unlike Medicare, Medicaid CAN cover long-term custodial care and home care services — this is a key benefit for families managing disabilities or aging-related needs.",
  },
  bcbs: {
    name: "Blue Cross Blue Shield", shortName: "BCBS", color: "#5c7a9e", bg: "#edf1f7", emoji: "🔵",
    parts: [
      { name: "Employer / Individual Plan", plain: "Coverage varies by specific plan. Typically includes preventive care, specialist visits, mental health services, prescriptions, and hospital stays. Always review your Summary of Benefits and Coverage (SBC) for exact details.", phone: "1-888-630-2583" },
    ],
    warning: "⚠️ Many procedures require prior authorization before they're performed. Always verify this in advance or you may face unexpected costs.",
  },
};

const CAREGIVING_RECS = {
  "Mild Cognitive Impairment": [
    "Schedule regular cognitive assessments with a neurologist — track changes over time.",
    "Establish consistent daily routines to reduce confusion and anxiety.",
    "Research memory care facilities early — before a crisis, not during one.",
    "Consider a medical alert device or GPS tracker for safety and peace of mind.",
    "Attend a caregiver support group for dementia and MCI families.",
    "Simplify her living environment — reduce clutter, label cabinets, improve lighting.",
  ],
  "Type 2 Diabetes": [
    "Monitor blood sugar levels regularly and keep a log to share with Dr. Kim.",
    "Coordinate with a registered dietitian for a diabetes-friendly meal plan.",
    "Ensure regular A1C testing every 3–6 months.",
    "Know the signs of low blood sugar: shakiness, confusion, sweating.",
    "Keep glucose tablets or juice accessible at home and when traveling.",
  ],
  "Hypertension": [
    "Monitor blood pressure at home using a cuff and log daily readings.",
    "Reduce sodium intake — aim for under 2,300mg/day.",
    "Encourage light exercise such as short daily walks.",
    "Review all medications with the prescribing doctor twice a year.",
  ],
  "Down Syndrome": [
    "Annual thyroid screening is essential — hypothyroidism is very common in adults with Down syndrome.",
    "Schedule regular vision and hearing exams every 1–2 years.",
    "Cervical spine X-rays are recommended due to atlantoaxial instability risk.",
    "Begin supported living and employment planning as early as possible.",
    "Connect with your local Arc chapter for services, advocacy, and peer support.",
    "Annual cardiology screening is recommended even in adulthood.",
  ],
  "Hypothyroidism": [
    "Ensure Levothyroxine is taken consistently — same time every day, on an empty stomach.",
    "TSH levels should be checked every 6–12 months.",
    "Watch for signs of under-treatment: fatigue, unexplained weight gain, or depression.",
  ],
};

const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const CHAT_RESPONSES = {
  memory: "Memory changes with Mild Cognitive Impairment can be subtle at first. Watch for increasing forgetfulness that disrupts daily life, getting lost in familiar places, trouble with multi-step tasks like cooking or paying bills, and personality or mood changes. If you notice these worsening, talk to Dr. Torres about a full neuropsychological evaluation. Creating structured routines and reducing decision fatigue at home can also make a meaningful difference.",
  hipaa: "A HIPAA Authorization form allows healthcare providers to share your loved one's medical information with you — otherwise, they legally cannot discuss their health. You can request a form from any doctor's office or download a standard HIPAA release form online. Once signed (and notarized in some states), keep a copy with each provider and one at home. This is on your logistics checklist — I'd recommend doing this soon!",
  directive: "An Advance Directive (also called a Living Will) is a legal document specifying what medical treatment someone wants if they can't communicate their wishes. It typically covers life support, resuscitation (DNR), feeding tubes, and end-of-life care preferences. It should be notarized, shared with all healthcare providers, and kept somewhere accessible. Trust & Will can help you complete this — it's on your checklist.",
  burnout: "Caregiver burnout is real, serious, and incredibly common — please don't ignore the signs. These include persistent exhaustion, resentment toward your loved one, neglecting your own health, feeling trapped or hopeless, and withdrawing from friends. What helps: schedule regular breaks (even 30 minutes daily), accept help from others, join a caregiver support group (AARP and Caregiver Action Network are wonderful), set boundaries, and keep your own doctor's appointments. You cannot pour from an empty cup, Holly. Your wellbeing matters deeply.",
  default: "That's a thoughtful question. I'm here to help with medical care coordination, legal documents, insurance questions, communication with providers, and the emotional side of caregiving. Could you tell me a bit more about what you're navigating? I want to give you the most helpful answer possible.",
};

const SUGGESTIONS = [
  "What signs should I watch for with Mom's memory?",
  "How do I get a HIPAA authorization form?",
  "What is an Advanced Directive?",
  "How do I manage caregiver burnout?",
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function getDaysInMonth(month, year) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(month, year) { return new Date(year, month, 1).getDay(); }
function recipientColor(id) { return id === 1 ? C.rose : C.blue; }
function recipientLightColor(id) { return id === 1 ? C.roseLight : C.blueLight; }
function initials(name) { return name.split(" ").map(n => n[0]).join("").slice(0, 2); }
function getDailyMessage() {
  const day = new Date("2026-03-25").getDate(); // day 25 → index 24
  return DAILY_MESSAGES[(day - 1) % DAILY_MESSAGES.length];
}

function getResponse(text) {
  const t = text.toLowerCase();
  if (t.includes("memory") || t.includes("cognitive") || t.includes("dementia")) return CHAT_RESPONSES.memory;
  if (t.includes("hipaa")) return CHAT_RESPONSES.hipaa;
  if (t.includes("directive") || t.includes("living will") || t.includes("advance")) return CHAT_RESPONSES.directive;
  if (t.includes("burnout") || t.includes("overwhelm") || t.includes("stress") || t.includes("tired")) return CHAT_RESPONSES.burnout;
  return CHAT_RESPONSES.default;
}

// ─── SHARED UI ─────────────────────────────────────────────────────────────────

function Avatar({ r, size = 44 }) {
  const color = recipientColor(r.id);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: size * 0.34, flexShrink: 0, letterSpacing: -0.5 }}>
      {initials(r.name)}
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{ background: color + "20", color, border: `1px solid ${color}35`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function BackBtn({ onBack, label = "Back" }) {
  return (
    <button onClick={onBack} style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 20, padding: "6px 14px", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
      <ChevronLeft size={15} />{label}
    </button>
  );
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 800, color: C.mutedLight, letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" }}>{children}</p>;
}

// ─── DAILY MESSAGE CARD ────────────────────────────────────────────────────────

function DailyMessageCard({ onHide }) {
  const msg = getDailyMessage();
  return (
    <div style={{ background: "linear-gradient(135deg, #e8d8d4 0%, #d8e2ec 100%)", borderRadius: 20, padding: "16px 18px", marginBottom: 18, position: "relative", border: "1px solid #e0d4ce" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#8a7870", letterSpacing: 0.8, textTransform: "uppercase" }}>Today's message for you</span>
          </div>
          <p style={{ fontSize: 14, color: "#3a3028", lineHeight: 1.75, fontStyle: "italic", fontWeight: 500 }}>"{msg.text}"</p>
          <p style={{ fontSize: 11, color: "#9a8e86", marginTop: 8, fontWeight: 600 }}>— Aiden</p>
        </div>
        <button onClick={onHide} style={{ background: "rgba(255,255,255,0.45)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title="Hide daily message">
          <EyeOff size={14} color="#8a7870" />
        </button>
      </div>
    </div>
  );
}

function ShowMessageButton({ onShow }) {
  return (
    <button onClick={onShow} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed #c8bdb5", borderRadius: 12, padding: "7px 12px", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 18 }}>
      <Eye size={14} /> Show today's message
    </button>
  );
}

// ─── HOME TAB ──────────────────────────────────────────────────────────────────

function HomeTab({ recipients, onSelect, showMsg, setShowMsg }) {
  const pending = INITIAL_LOGISTICS.filter(l => !l.completed).length;
  return (
    <div style={{ padding: 16, paddingBottom: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: C.muted, fontSize: 13 }}>Wednesday, March 25, 2026</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 2, letterSpacing: -0.5 }}>Good morning, Holly 👋</h1>
      </div>

      {/* Daily message toggle */}
      {showMsg
        ? <DailyMessageCard onHide={() => setShowMsg(false)} />
        : <ShowMessageButton onShow={() => setShowMsg(true)} />
      }

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "linear-gradient(135deg, #c8d5e4 0%, #b8cad8 100%)", borderRadius: 18, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#5c7490", fontWeight: 800, marginBottom: 6, letterSpacing: 0.5 }}>CARE RECIPIENTS</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: C.primaryDark, lineHeight: 1 }}>{recipients.length}</p>
          <p style={{ fontSize: 11, color: "#6e8aa0", marginTop: 4 }}>people in your care</p>
        </div>
        <div style={{ background: "linear-gradient(135deg, #e4d0cc 0%, #d8c0ba 100%)", borderRadius: 18, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#8a5a54", fontWeight: 800, marginBottom: 6, letterSpacing: 0.5 }}>UPCOMING APPTS</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#7a4a44", lineHeight: 1 }}>5</p>
          <p style={{ fontSize: 11, color: "#9a6a64", marginTop: 4 }}>next 30 days</p>
        </div>
      </div>

      {/* Action alert */}
      {pending > 0 && (
        <div style={{ background: "#fdf4f3", border: `1px solid #e8c4c0`, borderRadius: 16, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={17} color={C.coral} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#8a4a44" }}>{pending} logistics items need attention</p>
            <p style={{ fontSize: 12, color: "#a06058", marginTop: 3, lineHeight: 1.5 }}>HIPAA forms, Power of Attorney, financial access, and more. Check your My List tab.</p>
          </div>
        </div>
      )}

      {/* Recipients */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>People I'm Caring For</p>
        <button style={{ background: C.primaryLight, border: "none", borderRadius: 20, padding: "5px 12px", color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {recipients.map(r => (
        <button key={r.id} onClick={() => onSelect(r)} style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, textAlign: "left", cursor: "pointer", marginBottom: 12, boxShadow: "0 2px 8px rgba(80,60,40,0.06)", display: "block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar r={r} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{r.name}</span>
                <span style={{ fontSize: 11, color: C.muted, background: C.bg, borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>{r.relationship}</span>
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                Age {r.age} · {r.conditions[0]}{r.conditions.length > 1 ? ` +${r.conditions.length - 1} more` : ""}
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {r.insurancePlans.map(p => (
                  <Pill key={p} label={INSURANCE_INFO[p].shortName} color={INSURANCE_INFO[p].color} />
                ))}
              </div>
            </div>
            <ChevronRight size={18} color={C.border} style={{ flexShrink: 0 }} />
          </div>
        </button>
      ))}

      <button style={{ width: "100%", border: `2px dashed ${C.border}`, borderRadius: 20, padding: 16, background: "none", color: C.mutedLight, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Plus size={17} /> Add a care recipient
      </button>
    </div>
  );
}

// ─── RECIPIENT PROFILE ─────────────────────────────────────────────────────────

function RecipientProfile({ r, onBack, doctors, appointments }) {
  const [tab, setTab] = useState("overview");
  const color = recipientColor(r.id);
  const lightColor = recipientLightColor(r.id);
  const myDoctors = doctors.filter(d => d.recipientId === r.id);
  const myAppts = appointments.filter(a => a.recipientId === r.id);
  const tabs = [{ id: "overview", label: "Overview" }, { id: "guidance", label: "Guidance" }, { id: "notes", label: "Notes" }];

  return (
    <div>
      <div style={{ background: color, padding: "12px 16px 0", color: "white" }}>
        <BackBtn onBack={onBack} />
        <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 16 }}>
          <div style={{ width: 68, height: 68, background: "rgba(255,255,255,0.22)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, flexShrink: 0, border: "3px solid rgba(255,255,255,0.35)", letterSpacing: -1 }}>
            {initials(r.name)}
          </div>
          <div>
            <p style={{ fontSize: 11, opacity: 0.75, fontWeight: 700, letterSpacing: 0.5 }}>{r.relationship.toUpperCase()}</p>
            <h2 style={{ fontSize: 21, fontWeight: 900, marginTop: 2, letterSpacing: -0.5 }}>{r.name}</h2>
            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Age {r.age} · {r.email}</p>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", color: tab === t.id ? "white" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, cursor: "pointer", borderBottom: tab === t.id ? "3px solid white" : "3px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {tab === "overview" && (
          <>
            <div style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <SectionLabel>Conditions</SectionLabel>
              {r.conditions.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < r.conditions.length - 1 ? `1px solid ${C.bg}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{c}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <SectionLabel>Medications</SectionLabel>
              {r.medications.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < r.medications.length - 1 ? `1px solid ${C.bg}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.peach, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{m}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SectionLabel>Doctors</SectionLabel>
                <button style={{ background: "none", border: "none", color, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, marginTop: -10 }}><Plus size={12} /> Add</button>
              </div>
              {myDoctors.map((d, i) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < myDoctors.length - 1 ? `1px solid ${C.bg}` : "none" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.name}</p>
                    <p style={{ fontSize: 12, color, fontWeight: 600 }}>{d.specialty}</p>
                    {d.notes ? <p style={{ fontSize: 11, color: C.mutedLight, marginTop: 1 }}>{d.notes}</p> : null}
                  </div>
                  <button style={{ width: 36, height: 36, background: color + "18", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Phone size={14} color={color} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, borderRadius: 18, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SectionLabel>Upcoming Appointments</SectionLabel>
                <button style={{ background: "none", border: "none", color, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, marginTop: -10 }}><Plus size={12} /> Add</button>
              </div>
              {myAppts.slice(0, 3).map((a, i) => (
                <div key={a.id} style={{ padding: "8px 0", borderBottom: i < Math.min(myAppts.length, 3) - 1 ? `1px solid ${C.bg}` : "none" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{a.title}</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                    <Clock size={11} color={C.mutedLight} />
                    <span style={{ fontSize: 12, color: C.muted }}>{a.date} · {a.time}</span>
                  </div>
                  {a.doctor ? <p style={{ fontSize: 12, color, fontWeight: 600, marginTop: 2 }}>{a.doctor}</p> : null}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "guidance" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #e8d8d4 0%, #d8e2ec 100%)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>What you need to know: Caring for {r.name}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Personalized based on {r.nickname}'s conditions and profile</p>
            </div>
            {r.conditions.map(cond =>
              CAREGIVING_RECS[cond] ? (
                <div key={cond} style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>{cond}</p>
                  {CAREGIVING_RECS[cond].map((rec, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < CAREGIVING_RECS[cond].length - 1 ? `1px solid ${C.bg}` : "none", alignItems: "flex-start" }}>
                      <Check size={14} color={C.sage} style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: "#4a4038", lineHeight: 1.65 }}>{rec}</p>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </>
        )}

        {tab === "notes" && (
          <>
            <div style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SectionLabel>Important Phone Numbers</SectionLabel>
                <button style={{ background: "none", border: "none", color, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, marginTop: -10 }}><Plus size={12} /> Add</button>
              </div>
              {r.importantNumbers.map((n, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < r.importantNumbers.length - 1 ? `1px solid ${C.bg}` : "none" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{n.label}</p>
                    <p style={{ fontSize: 13, color: C.muted }}>{n.number}</p>
                  </div>
                  <button style={{ width: 36, height: 36, background: color + "18", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Phone size={14} color={color} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, borderRadius: 18, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SectionLabel>Important Details</SectionLabel>
                <button style={{ background: color + "18", border: "none", borderRadius: 10, padding: "5px 12px", color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit</button>
              </div>
              <p style={{ fontSize: 14, color: "#4a4038", lineHeight: 1.8 }}>{r.notes}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CALENDAR TAB ──────────────────────────────────────────────────────────────

function CalendarTab({ appointments, recipients }) {
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [selected, setSelected] = useState(null);

  const days = getDaysInMonth(month, year);
  const first = getFirstDay(month, year);
  const apptDates = new Set(appointments.map(a => a.date));

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const visible = selected
    ? appointments.filter(a => a.date === selected)
    : appointments.filter(a => { const [y, m] = a.date.split("-").map(Number); return m - 1 === month && y === year; });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={prev} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer" }}>
          <ChevronLeft size={18} color={C.muted} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{FULL_MONTHS[month]} {year}</h2>
        <button onClick={next} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer" }}>
          <ChevronRight size={18} color={C.muted} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 8 }}>
        {DAYS_OF_WEEK.map(d => <span key={d} style={{ fontSize: 11, fontWeight: 800, color: C.mutedLight }}>{d}</span>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 16 }}>
        {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(days).fill(null).map((_, i) => {
          const day = i + 1;
          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasA = apptDates.has(ds);
          const isToday = ds === "2026-03-25";
          const isSel = selected === ds;
          return (
            <button key={day} onClick={() => setSelected(isSel ? null : ds)} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "none", background: isSel ? C.primary : isToday ? C.primaryLight : "transparent", cursor: "pointer", position: "relative", padding: 0 }}>
              <span style={{ fontSize: 13, fontWeight: (isToday || isSel) ? 900 : 400, color: isSel ? "white" : isToday ? C.primary : C.text }}>{day}</span>
              {hasA && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : C.rose, position: "absolute", bottom: 3 }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.muted }}>{selected || "This month"}</p>
        <button style={{ background: C.primaryLight, border: "none", borderRadius: 20, padding: "5px 12px", color: C.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={12} /> Add
        </button>
      </div>

      {visible.length === 0 ? (
        <p style={{ textAlign: "center", color: C.mutedLight, fontSize: 14, padding: 24 }}>No appointments</p>
      ) : visible.map(a => {
        const r = recipients.find(rec => rec.id === a.recipientId);
        const col = r ? recipientColor(r.id) : C.muted;
        return (
          <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 10, borderLeft: `4px solid ${col}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{a.title}</p>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                  <Clock size={11} color={C.mutedLight} />
                  <p style={{ fontSize: 12, color: C.muted }}>{a.date} · {a.time}</p>
                </div>
                {a.location && <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 2 }}>{a.location}</p>}
                {a.doctor && <p style={{ fontSize: 12, color: col, fontWeight: 700, marginTop: 4 }}>{a.doctor}</p>}
              </div>
              {r && <span style={{ background: col + "18", color: col, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.nickname}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LIST TAB ──────────────────────────────────────────────────────────────────

function ListTab({ logistics, setLogistics, doctors }) {
  const [sub, setSub] = useState("logistics");
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const done = logistics.filter(l => l.completed).length;
  const pct = Math.round((done / logistics.length) * 100);

  return (
    <div>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex" }}>
        {[{ id: "logistics", label: "Checklist" }, { id: "doctors", label: "Doctors" }, { id: "documents", label: "Documents" }].map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flex: 1, padding: "12px 8px", background: "none", border: "none", fontWeight: 800, fontSize: 13, color: sub === t.id ? C.primary : C.mutedLight, borderBottom: sub === t.id ? `3px solid ${C.primary}` : "3px solid transparent", cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {sub === "logistics" && (
          <>
            <div style={{ background: C.card, borderRadius: 18, padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{done} of {logistics.length} completed</p>
                <div style={{ width: 160, height: 6, background: C.bg, borderRadius: 3, marginTop: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose, borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose }}>{pct}%</span>
            </div>

            {logistics.map(item => (
              <div key={item.id} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 8, border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <button onClick={() => setLogistics(p => p.map(l => l.id === item.id ? { ...l, completed: !l.completed } : l))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}>
                  {item.completed ? <CheckSquare size={20} color={C.sage} /> : <Square size={20} color={C.border} />}
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: item.completed ? C.mutedLight : C.text, textDecoration: item.completed ? "line-through" : "none" }}>{item.title}</p>
                  {item.note ? <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{item.note}</p> : null}
                  {item.partnerLink === "trust-will" && !item.completed && (
                    <button style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 5, background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 8, padding: "4px 10px", color: C.primaryDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <ExternalLink size={11} /> Complete via Trust & Will
                    </button>
                  )}
                </div>
              </div>
            ))}

            {adding ? (
              <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `2px solid ${C.primary}`, marginTop: 8 }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New item..." autoFocus style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: C.text, background: "none" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => { if (newItem.trim()) { setLogistics(p => [...p, { id: Date.now(), title: newItem, completed: false, note: "", partnerLink: null }]); setNewItem(""); setAdding(false); } }} style={{ flex: 1, background: C.primary, color: "white", border: "none", borderRadius: 10, padding: "9px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Add</button>
                  <button onClick={() => { setAdding(false); setNewItem(""); }} style={{ flex: 1, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ marginTop: 8, width: "100%", border: `2px dashed ${C.border}`, borderRadius: 16, padding: 14, background: "none", color: C.mutedLight, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Plus size={16} /> Add item to checklist
              </button>
            )}
          </>
        )}

        {sub === "doctors" && (
          <>
            {doctors.map(d => {
              const col = recipientColor(d.recipientId);
              return (
                <div key={d.id} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${C.border}`, borderLeft: `4px solid ${col}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{d.name}</p>
                      <p style={{ fontSize: 13, color: col, fontWeight: 700, marginTop: 2 }}>{d.specialty}</p>
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{d.phone}</p>
                      <p style={{ fontSize: 12, color: C.mutedLight }}>{d.address}</p>
                      {d.notes ? <p style={{ fontSize: 12, color: C.muted, marginTop: 4, fontStyle: "italic" }}>{d.notes}</p> : null}
                    </div>
                    <button style={{ width: 38, height: 38, background: col + "18", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}>
                      <Phone size={15} color={col} />
                    </button>
                  </div>
                </div>
              );
            })}
            <button style={{ marginTop: 4, width: "100%", border: `2px dashed ${C.border}`, borderRadius: 16, padding: 14, background: "none", color: C.mutedLight, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={16} /> Add a doctor
            </button>
          </>
        )}

        {sub === "documents" && (
          <>
            <div style={{ background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 16, padding: 14, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={17} color={C.primary} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.primaryDark }}>Connect Google Drive</p>
                <p style={{ fontSize: 12, color: C.primary, marginTop: 3, lineHeight: 1.5, opacity: 0.9 }}>Store insurance cards, medical records, legal documents and more — all in one secure place.</p>
                <button style={{ marginTop: 10, background: C.primary, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <ExternalLink size={13} /> Connect Google Drive
                </button>
              </div>
            </div>

            {[
              { name: "Medicare Card – Margaret.pdf", date: "Mar 10, 2026", color: C.blue },
              { name: "Advanced Directive – Margaret.pdf", date: "Jan 5, 2025", color: C.sage },
              { name: "Will – Notarized 2025.pdf", date: "Mar 15, 2025", color: C.peach },
              { name: "Medicaid Approval – Thomas.pdf", date: "Nov 20, 2025", color: C.lavender },
              { name: "HIPAA Authorization Form.pdf", date: "—", color: C.mutedLight },
            ].map((doc, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 8, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: doc.color + "18", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} color={doc.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                  <p style={{ fontSize: 12, color: C.mutedLight }}>{doc.date}</p>
                </div>
                <ExternalLink size={15} color={C.border} />
              </div>
            ))}

            <button style={{ marginTop: 4, width: "100%", border: `2px dashed ${C.border}`, borderRadius: 14, padding: 14, background: "none", color: C.mutedLight, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={16} /> Upload document
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
        <div style={{ background: info.color, padding: "12px 16px 20px" }}>
          <BackBtn onBack={() => setSel(null)} label="All Insurance" />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 36 }}>{info.emoji}</span>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: "white" }}>{info.name}</h2>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {covered.map(r => (
                  <span key={r.id} style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{r.nickname}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {info.warning && (
            <div style={{ background: "#fdf6ef", border: `1px solid ${C.peach}60`, borderRadius: 14, padding: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#7a5a3a", lineHeight: 1.65 }}>{info.warning}</p>
            </div>
          )}
          {info.parts.map((part, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: info.color, marginBottom: 10 }}>{part.name}</p>
              <p style={{ fontSize: 13, color: "#4a4038", lineHeight: 1.75 }}>{part.plain}</p>
              <div style={{ marginTop: 14, background: info.bg, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>Member Services</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: info.color, marginTop: 2 }}>{part.phone}</p>
                </div>
                <button style={{ width: 40, height: 40, background: info.color, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Phone size={16} color="white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>Insurance</h2>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Coverage explained in plain language</p>
      </div>

      {allPlans.map(planId => {
        const info = INSURANCE_INFO[planId];
        const covered = recipients.filter(r => r.insurancePlans.includes(planId));
        return (
          <button key={planId} onClick={() => setSel(planId)} style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, textAlign: "left", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(80,60,40,0.05)" }}>
            <div style={{ width: 54, height: 54, background: info.bg, border: `2px solid ${info.color}22`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
              {info.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{info.name}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                {covered.map(r => (
                  <span key={r.id} style={{ background: recipientColor(r.id) + "18", color: recipientColor(r.id), borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{r.nickname}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={18} color={C.border} style={{ flexShrink: 0 }} />
          </button>
        );
      })}

      <button style={{ marginTop: 4, width: "100%", border: `2px dashed ${C.border}`, borderRadius: 20, padding: 14, background: "none", color: C.mutedLight, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Plus size={16} /> Add insurance plan
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
    setTimeout(() => {
      setMessages(p => [...p, { role: "assistant", text: getResponse(text) }]);
      setWaiting(false);
    }, 900);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "linear-gradient(135deg, #c8d5e4 0%, #d8cad4 100%)", padding: "12px 16px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.55)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤍</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Ask Aiden</p>
          <p style={{ fontSize: 12, color: C.muted }}>Your AI caregiving assistant</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #c8d5e4, #d8cad4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🤍</div>
            )}
            <div style={{ maxWidth: "80%", background: m.role === "user" ? C.primary : C.card, color: m.role === "user" ? "white" : C.text, borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 14px", fontSize: 13, lineHeight: 1.7, border: m.role === "assistant" ? `1px solid ${C.border}` : "none", boxShadow: "0 1px 4px rgba(80,60,40,0.07)" }}>
              {m.text}
            </div>
          </div>
        ))}
        {waiting && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #c8d5e4, #d8cad4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤍</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: C.mutedLight, animation: "pulse 1.2s infinite", animationDelay: `${j * 0.2}s` }} />)}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && !waiting && (
        <div style={{ padding: "0 16px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.mutedLight, letterSpacing: 0.5, textTransform: "uppercase" }}>Suggested questions</p>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 13px", textAlign: "left", fontSize: 13, color: C.text, cursor: "pointer", fontWeight: 500 }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "10px 16px 14px", background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Ask anything about caregiving..."
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 22, padding: "10px 16px", fontSize: 14, outline: "none", color: C.text }}
        />
        <button onClick={() => send(input)} style={{ width: 42, height: 42, background: input.trim() ? C.primary : C.bg, border: `1px solid ${input.trim() ? C.primary : C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "default", flexShrink: 0 }}>
          <Send size={16} color={input.trim() ? "white" : C.mutedLight} />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home",      Icon: Home,          label: "Home"      },
  { id: "calendar",  Icon: CalendarDays,   label: "Calendar"  },
  { id: "list",      Icon: ClipboardList,  label: "My List"   },
  { id: "insurance", Icon: Shield,         label: "Insurance" },
  { id: "chat",      Icon: MessageCircle,  label: "Ask Aiden" },
];

export default function AidenApp() {
  const [tab, setTab] = useState("home");
  const [selRecipient, setSelRecipient] = useState(null);
  const [recipients] = useState(INITIAL_RECIPIENTS);
  const [appointments] = useState(INITIAL_APPOINTMENTS);
  const [doctors] = useState(INITIAL_DOCTORS);
  const [logistics, setLogistics] = useState(INITIAL_LOGISTICS);
  const [showMsg, setShowMsg] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hi Holly! I'm Aiden, your personal caregiving assistant. I'm here to help you navigate caring for Margaret and Thomas — from medical questions to legal documents, insurance, and emotional support. What can I help you with? 🤍" }
  ]);

  const headerBg = tab === "home" && selRecipient ? recipientColor(selRecipient.id) : "transparent";
  const showAppHeader = !(tab === "home" && selRecipient) && tab !== "chat";

  function renderContent() {
    if (tab === "home") {
      return selRecipient
        ? <RecipientProfile r={selRecipient} onBack={() => setSelRecipient(null)} doctors={doctors} appointments={appointments} />
        : <HomeTab recipients={recipients} onSelect={r => setSelRecipient(r)} showMsg={showMsg} setShowMsg={setShowMsg} />;
    }
    if (tab === "calendar")  return <CalendarTab appointments={appointments} recipients={recipients} />;
    if (tab === "list")      return <ListTab logistics={logistics} setLogistics={setLogistics} doctors={doctors} />;
    if (tab === "insurance") return <InsuranceTab recipients={recipients} />;
    if (tab === "chat")      return <ChatTab messages={chatMessages} setMessages={setChatMessages} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #d8c8c4 0%, #c4ccd8 50%, #c8c0cc 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.35;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Wordmark above */}
      <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}>
        <Heart size={15} color="rgba(90,70,60,0.5)" fill="rgba(90,70,60,0.5)" />
        <span style={{ color: "rgba(90,70,60,0.5)", fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>Aiden</span>
      </div>

      {/* Phone shell */}
      <div style={{ width: 390, height: 844, background: C.bg, borderRadius: 48, overflow: "hidden", boxShadow: "0 50px 100px rgba(60,40,30,0.3), 0 0 0 8px #c8c0b8, 0 0 0 10px #b8b0a8", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Status bar */}
        <div style={{ background: tab === "home" && selRecipient ? recipientColor(selRecipient.id) : "linear-gradient(90deg, #c8d0d8, #d8ccd0)", padding: "14px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: tab === "home" && selRecipient ? "rgba(255,255,255,0.9)" : C.muted }}>9:41</span>
          <div style={{ width: 118, height: 28, background: "#1c1c1e", borderRadius: 14, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 12 }} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[4, 7, 10, 13].map(h => <div key={h} style={{ width: 3, height: h, background: tab === "home" && selRecipient ? "rgba(255,255,255,0.8)" : C.muted, borderRadius: 2 }} />)}
            <Bell size={13} color={tab === "home" && selRecipient ? "rgba(255,255,255,0.8)" : C.muted} style={{ marginLeft: 3 }} />
          </div>
        </div>

        {/* App header */}
        {showAppHeader && (
          <div style={{ background: "linear-gradient(90deg, #c8d0d8 0%, #d8ccd0 100%)", padding: "4px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Heart size={20} color={C.rose} fill={C.rose} />
              <span style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -1 }}>aiden</span>
            </div>
            <Bell size={19} color={C.muted} />
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {renderContent()}
        </div>

        {/* Bottom nav */}
        <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: 18, paddingTop: 8, flexShrink: 0 }}>
          {NAV.map(({ id, Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => { setTab(id); if (id !== "home") setSelRecipient(null); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                <div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: active ? C.primary + "18" : "transparent", borderRadius: 11 }}>
                  <Icon size={21} color={active ? C.primary : C.mutedLight} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? C.primary : C.mutedLight }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
