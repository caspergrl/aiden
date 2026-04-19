// ─── Shared app data (mirrors mobile app) ─────────────────────────────────────

export const DAILY_MESSAGES = [
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

export const INITIAL_RECIPIENTS = [
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

export const INITIAL_APPOINTMENTS = [
  { id: 1, recipientId: 1, title: "Cardiology Follow-up", date: "2026-04-28", time: "10:00 AM", location: "City Medical Center, Suite 302", doctor: "Dr. Robert Lee" },
  { id: 2, recipientId: 2, title: "Day Program – Music Therapy", date: "2026-04-22", time: "10:00 AM", location: "Sunrise Day Program", doctor: "" },
  { id: 3, recipientId: 1, title: "Annual Physical", date: "2026-05-05", time: "9:00 AM", location: "Primary Care Associates", doctor: "Dr. Sarah Kim" },
  { id: 4, recipientId: 2, title: "Neurologist Check-in", date: "2026-05-02", time: "2:30 PM", location: "Neurology Specialists", doctor: "Dr. James Park" },
  { id: 5, recipientId: 1, title: "Memory Care Assessment", date: "2026-05-15", time: "11:00 AM", location: "Cognitive Health Institute", doctor: "Dr. Angela Torres" },
];

export const INITIAL_DOCTORS = [
  { id: 1, recipientId: 1, name: "Dr. Sarah Kim", specialty: "Primary Care", phone: "(555) 200-1000", address: "123 Main St, Suite 1", notes: "Primary physician" },
  { id: 2, recipientId: 1, name: "Dr. Robert Lee", specialty: "Cardiology", phone: "(555) 200-2000", address: "City Medical Center, Suite 302", notes: "" },
  { id: 3, recipientId: 1, name: "Dr. Angela Torres", specialty: "Neurology / Memory Care", phone: "(555) 200-3000", address: "Cognitive Health Institute", notes: "Specializes in dementia care" },
  { id: 4, recipientId: 2, name: "Dr. James Park", specialty: "Developmental Medicine", phone: "(555) 200-4000", address: "Neurology Specialists, Bldg B", notes: "Great with Tommy" },
];

export const INITIAL_LOGISTICS = [
  { id: 1, title: "Will (ensure it's notarized)", completed: true, note: "Notarized March 2025", partnerLink: "trust-will" },
  { id: 2, title: "Advanced Directive / Living Will", completed: true, note: "On file at City Medical Center", partnerLink: null },
  { id: 3, title: "HIPAA Authorization Forms", completed: false, note: "", partnerLink: null },
  { id: 4, title: "Durable Power of Attorney", completed: false, note: "", partnerLink: "trust-will" },
  { id: 5, title: "Access to Financial Accounts", completed: false, note: "Need to be added to bank accounts", partnerLink: null },
  { id: 6, title: "Healthcare Proxy Designation", completed: false, note: "", partnerLink: null },
  { id: 7, title: "Long-term Care Insurance Review", completed: false, note: "", partnerLink: null },
  { id: 8, title: "Social Security Beneficiary Update", completed: false, note: "", partnerLink: null },
];

export const INSURANCE_INFO = {
  medicare: { name: "Medicare", shortName: "Medicare", color: "#6880a8", bg: "#edf1f8", emoji: "🏛️",
    parts: [
      { name: "Part A – Hospital Insurance", plain: "Covers inpatient hospital stays, skilled nursing facility care (up to 100 days after a hospital stay), hospice care, and some home health services. No monthly premium if you've worked 10+ years.", phone: "1-800-633-4227" },
      { name: "Part B – Medical Insurance", plain: "Covers doctor visits, outpatient care, preventive services like flu shots and screenings, and durable medical equipment. Monthly premium is around $185/month in 2026.", phone: "1-800-633-4227" },
      { name: "Part D – Prescriptions", plain: "Covers prescription drugs through private plans. Each plan has its own list of covered drugs. Review your plan's formulary annually during open enrollment.", phone: "1-800-633-4227" },
    ], warning: "⚠️ Medicare does NOT cover long-term custodial care. Consider a supplemental Medigap plan or long-term care insurance." },
  humana: { name: "Humana Medicare Advantage", shortName: "Humana", color: "#5e8a78", bg: "#edf4f0", emoji: "🌿",
    parts: [{ name: "Part C – Medicare Advantage", plain: "Bundles Medicare Parts A & B, often including Part D, dental, vision, and hearing. Usually lower premiums but you must use network providers and may need referrals for specialists.", phone: "1-800-833-6917" }],
    warning: "⚠️ Always confirm a provider is in-network before scheduling. Referrals usually required for specialists." },
  medicaid: { name: "Medicaid", shortName: "Medicaid", color: "#8878a8", bg: "#f0ecf8", emoji: "🏥",
    parts: [{ name: "Full Coverage", plain: "Comprehensive health coverage for eligible individuals. Covers doctor visits, hospital care, long-term care, mental health, prescriptions, and home care services. Coverage varies by state.", phone: "1-877-267-2323" }],
    warning: "✅ Unlike Medicare, Medicaid CAN cover long-term custodial care and home care services." },
  bcbs: { name: "Blue Cross Blue Shield", shortName: "BCBS", color: "#6880a8", bg: "#edf1f8", emoji: "🔵",
    parts: [{ name: "Employer / Individual Plan", plain: "Varies by plan. Typically includes preventive care, specialist visits, mental health, prescriptions, and hospital stays. Review your Summary of Benefits for exact details.", phone: "1-888-630-2583" }],
    warning: "⚠️ Many procedures require prior authorization. Always verify before scheduling." },
};

export const CAREGIVING_RECS = {
  "Mild Cognitive Impairment": ["Schedule regular cognitive assessments with a neurologist — track changes over time.", "Establish consistent daily routines to reduce confusion and anxiety.", "Research memory care facilities early — before a crisis, not during one.", "Consider a medical alert device or GPS tracker for safety and peace of mind.", "Attend a caregiver support group for dementia and MCI families.", "Simplify her living environment — reduce clutter, label cabinets, improve lighting."],
  "Type 2 Diabetes": ["Monitor blood sugar levels regularly and keep a log to share with the doctor.", "Coordinate with a registered dietitian for a diabetes-friendly meal plan.", "Ensure regular A1C testing every 3–6 months.", "Know the signs of low blood sugar: shakiness, confusion, sweating.", "Keep glucose tablets or juice accessible at home and when traveling."],
  "Hypertension": ["Monitor blood pressure at home using a cuff and log daily readings.", "Reduce sodium intake — aim for under 2,300mg/day.", "Encourage light exercise such as short daily walks.", "Review all medications with the prescribing doctor twice a year."],
  "Down Syndrome": ["Annual thyroid screening is essential — hypothyroidism is very common in adults with Down syndrome.", "Schedule regular vision and hearing exams every 1–2 years.", "Cervical spine X-rays are recommended due to atlantoaxial instability risk.", "Begin supported living and employment planning as early as possible.", "Connect with your local Arc chapter for services, advocacy, and peer support.", "Annual cardiology screening is recommended even in adulthood."],
  "Hypothyroidism": ["Ensure Levothyroxine is taken consistently — same time every day, on an empty stomach.", "TSH levels should be checked every 6–12 months.", "Watch for signs of under-treatment: fatigue, unexplained weight gain, or depression."],
};

export const CHAT_RESPONSES = {
  memory: "Memory changes with Mild Cognitive Impairment can be subtle at first. Watch for increasing forgetfulness that disrupts daily life, getting lost in familiar places, trouble with multi-step tasks, and personality or mood changes. If these worsen, ask their neurologist about a full neuropsychological evaluation. Consistent daily routines and a simplified home environment can make a meaningful difference.",
  hipaa: "A HIPAA Authorization form allows healthcare providers to share your loved one's medical information with you. Request one from any doctor's office, or download a standard form online. Once signed, keep a copy with each provider and one at home. This is on your logistics checklist — worth completing soon.",
  directive: "An Advance Directive specifies what medical treatment someone wants if they can't communicate their wishes — covering life support, resuscitation, feeding tubes, and end-of-life care preferences. It should be notarized, shared with all providers, and kept somewhere easily accessible. Trust & Will can help you complete one.",
  burnout: "Caregiver burnout is real, serious, and incredibly common. Signs include persistent exhaustion, resentment, neglecting your own health, feeling trapped, and withdrawing from friends. What helps: schedule regular breaks, accept help from others, join a caregiver support group (AARP and Caregiver Action Network are wonderful), set clear boundaries, and keep your own doctor's appointments. You cannot pour from an empty cup.",
  default: "That's a thoughtful question. I'm here to help with medical care coordination, legal documents, insurance questions, provider communication, and the emotional side of caregiving. Tell me more about what you're navigating and I'll give you the most helpful answer I can.",
};

export const SUGGESTIONS = [
  "What signs should I watch for with Mom's memory?",
  "How do I get a HIPAA authorization form?",
  "What is an Advanced Directive?",
  "How do I manage caregiver burnout?",
];

export const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function getDailyMessage() {
  const day = new Date().getDate();
  return DAILY_MESSAGES[(day - 1) % DAILY_MESSAGES.length];
}

export function getResponse(text) {
  const t = text.toLowerCase();
  if (t.includes("memory") || t.includes("cognitive") || t.includes("dementia")) return CHAT_RESPONSES.memory;
  if (t.includes("hipaa")) return CHAT_RESPONSES.hipaa;
  if (t.includes("directive") || t.includes("living will") || t.includes("advance")) return CHAT_RESPONSES.directive;
  if (t.includes("burnout") || t.includes("overwhelm") || t.includes("stress") || t.includes("tired")) return CHAT_RESPONSES.burnout;
  return CHAT_RESPONSES.default;
}
