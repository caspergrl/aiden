const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');
const Anthropic = require('@anthropic-ai/sdk');

admin.initializeApp();

// ── Helpers ────────────────────────────────────────────────────────────────────
function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmtDate(ds) {
  const [y, m, day] = ds.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  return '+' + digits;
}

// ── Signup notification ────────────────────────────────────────────────────────
exports.onUserSignup = functions
  .runWith({ secrets: ['RESEND_API_KEY'] })
  .auth.user().onCreate(async (user) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const signupTime = new Date(user.metadata.creationTime).toLocaleString('en-US', {
      timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short',
    });
    await resend.emails.send({
      from: 'Aiden <noreply@aidencare.co>',
      to: 'info@aidencare.co',
      subject: 'New Aiden signup',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #904848; margin-bottom: 8px;">New signup 🎉</h2>
          <p style="color: #444; margin: 0 0 20px;">A new user just created an Aiden account.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #888; width: 100px;">Email</td><td style="padding: 8px 0; color: #222; font-weight: 600;">${user.email || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0; color: #222; font-weight: 600;">${user.displayName || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">UID</td><td style="padding: 8px 0; color: #666; font-family: monospace; font-size: 12px;">${user.uid}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Signed up</td><td style="padding: 8px 0; color: #222;">${signupTime} ET</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Provider</td><td style="padding: 8px 0; color: #222;">${user.providerData?.[0]?.providerId || 'email/password'}</td></tr>
          </table>
        </div>
      `,
    });
    console.log(`Signup notification sent for ${user.email}`);
  });

// ── Appointment reminders (runs daily at 9 AM ET) ──────────────────────────────
exports.scheduledReminders = functions
  .runWith({ secrets: ['RESEND_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'] })
  .pubsub.schedule('every day 09:00')
  .timeZone('America/New_York')
  .onRun(async () => {
    const today = new Date();
    const in7   = dateStr(addDays(today, 7));
    const in1   = dateStr(addDays(today, 1));

    const resend = new Resend(process.env.RESEND_API_KEY);
    const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom  = process.env.TWILIO_PHONE_NUMBER;
    const twilio = twilioSid && twilioToken
      ? require('twilio')(twilioSid, twilioToken)
      : null;

    let pageToken;
    do {
      const result = await admin.auth().listUsers(1000, pageToken);
      for (const userRecord of result.users) {
        try {
          await sendRemindersForUser(userRecord, in7, in1, resend, twilio, twilioFrom);
        } catch (e) {
          console.error(`Reminder failed for ${userRecord.uid}:`, e.message);
        }
      }
      pageToken = result.pageToken;
    } while (pageToken);

    console.log(`Reminder run complete for ${in1} (1-day) and ${in7} (7-day)`);
  });

async function sendRemindersForUser(userRecord, in7, in1, resend, twilio, twilioFrom) {
  const userDoc = await admin.firestore().doc(`users/${userRecord.uid}`).get();
  const prefs = userDoc.data() || {};

  const wantsEmail = prefs.notifEmail !== false; // default true
  const wantsSms   = prefs.notifSms === true && prefs.notifPhone;
  if (!wantsEmail && !wantsSms) return;

  const apptSnap = await admin.firestore()
    .collection(`users/${userRecord.uid}/appointments`)
    .get();
  const appointments = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const recSnap = await admin.firestore()
    .collection(`users/${userRecord.uid}/recipients`)
    .get();
  const recipientMap = {};
  recSnap.docs.forEach(d => { recipientMap[d.id] = d.data().name || d.data().nickname || 'your care recipient'; });

  for (const appt of appointments) {
    const daysOut = appt.date === in7 ? 7 : appt.date === in1 ? 1 : null;
    if (!daysOut) continue;

    const label       = daysOut === 7 ? 'in 1 week' : 'tomorrow';
    const recipName   = appt.recipientId ? (recipientMap[appt.recipientId] || 'your care recipient') : null;
    const apptTitle   = appt.title || 'Appointment';
    const apptDate    = fmtDate(appt.date);
    const apptTime    = appt.time || '';
    const apptLoc     = appt.location || '';
    const apptDoctor  = appt.doctor || '';

    if (wantsEmail) {
      await resend.emails.send({
        from: 'Aiden <reminders@aidencare.co>',
        to: userRecord.email,
        subject: `Reminder: ${apptTitle} is ${label}`,
        html: buildReminderEmail({ apptTitle, apptDate, apptTime, apptLoc, apptDoctor, recipName, label }),
      });
    }

    if (wantsSms && twilio) {
      const smsBody = buildReminderSms({ apptTitle, apptDate, apptTime, apptLoc, recipName, label });
      await twilio.messages.create({
        from: twilioFrom,
        to: normalizePhone(prefs.notifPhone),
        body: smsBody,
      });
    }
  }
}

function buildReminderEmail({ apptTitle, apptDate, apptTime, apptLoc, apptDoctor, recipName, label }) {
  const rows = [
    ['Date', apptDate],
    apptTime   ? ['Time', apptTime]   : null,
    apptLoc    ? ['Location', apptLoc]   : null,
    apptDoctor ? ['Provider', apptDoctor] : null,
    recipName  ? ['For', recipName]   : null,
  ].filter(Boolean);

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="font-size: 12px; font-weight: 700; color: #c85c55; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">Appointment reminder</p>
      <h2 style="color: #2c2018; font-size: 22px; margin: 0 0 6px;">${apptTitle}</h2>
      <p style="color: #6b5c52; font-size: 15px; margin: 0 0 24px;">This appointment is <strong>${label}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding: 7px 0; color: #a09080; width: 90px; vertical-align: top;">${k}</td>
            <td style="padding: 7px 0; color: #2c2018; font-weight: 600;">${v}</td>
          </tr>`).join('')}
      </table>
      <p style="font-size: 12px; color: #a09080; margin: 0;">Sent by <a href="https://aidencare.co" style="color: #c85c55; text-decoration: none;">Aiden</a> · Manage reminders in Account settings</p>
    </div>
  `;
}

function buildReminderSms({ apptTitle, apptDate, apptTime, apptLoc, recipName, label }) {
  const parts = [`Aiden reminder: ${apptTitle} is ${label} (${apptDate}`];
  if (apptTime) parts[0] += ` at ${apptTime}`;
  parts[0] += ')';
  if (recipName) parts.push(`For: ${recipName}`);
  if (apptLoc) parts.push(`Location: ${apptLoc}`);
  return parts.join('\n');
}

// ── Ask Aiden (Claude-powered chat) ───────────────────────────────────────────
exports.askAiden = functions
  .runWith({ secrets: ['ANTHROPIC_API_KEY'] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = context.auth.uid;
    const { messages = [], conversationId = 'askaiden' } = data;

    // Load user context from Firestore
    const [userDoc, recSnap, apptSnap, docSnap, chgSnap] = await Promise.all([
      admin.firestore().doc(`users/${uid}`).get(),
      admin.firestore().collection(`users/${uid}/recipients`).get(),
      admin.firestore().collection(`users/${uid}/appointments`).get(),
      admin.firestore().collection(`users/${uid}/doctors`).get(),
      admin.firestore().collection(`users/${uid}/careChanges`).limit(50).get(),
    ]);

    const userProfile  = userDoc.data() || {};
    const recipients   = recSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const appointments = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const doctors      = docSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const careChanges  = chgSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build system prompt with full recipient context
    const caregiverName = userProfile.name ? userProfile.name.split(' ')[0] : 'there';

    const recipientContext = recipients.length === 0
      ? 'No care recipients have been added yet.'
      : recipients.map(r => {
          const myDoctors = doctors.filter(d => d.recipientId === r.id);
          const myChanges = careChanges
            .filter(c => c.recipientId === r.id)
            .slice(0, 15);
          const today = new Date();
          const upcoming = appointments
            .filter(a => a.recipientId === r.id && a.date >= today.toISOString().slice(0, 10))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 10);

          const lines = [
            `**${r.nickname || r.name.split(' ')[0]} (${r.name})**`,
            `Relationship: ${r.relationship || 'Care recipient'}`,
          ];
          if (r.birthdate) {
            const age = Math.floor((Date.now() - new Date(r.birthdate)) / (1000 * 60 * 60 * 24 * 365.25));
            lines.push(`Age: ${age} (born ${r.birthdate})`);
          }
          if (r.conditions?.length)  lines.push(`Conditions: ${r.conditions.join(', ')}`);
          if (r.allergies?.length)   lines.push(`Allergies: ${r.allergies.join(', ')}`);
          if (r.medications?.length) lines.push(`Medications: ${r.medications.join(', ')}`);
          if (r.notes)               lines.push(`Notes: ${r.notes}`);
          if (myDoctors.length) {
            lines.push('Care team: ' + myDoctors.map(d =>
              [d.name, d.specialty, d.phone].filter(Boolean).join(' · ')
            ).join('; '));
          }
          if (upcoming.length) {
            lines.push('Upcoming appointments:');
            upcoming.forEach(a => {
              const loc = a.location ? ` at ${a.location}` : '';
              lines.push(`  - ${a.date} ${a.time || ''}: ${a.title}${loc}`);
            });
          }
          if (myChanges.length) {
            lines.push('Recent care changes (newest first):');
            myChanges.forEach(c => {
              const when = c.date || '';
              const who  = c.reportedBy ? ` (noted by ${c.reportedBy})` : '';
              lines.push(`  - ${when}${who}: ${c.title || c.type || 'Change'}${c.notes ? ` — ${c.notes}` : ''}`);
            });
          }
          return lines.join('\n');
        }).join('\n\n');

    const systemPrompt = `You are Aiden, a knowledgeable and compassionate AI caregiving assistant. You bring together the perspective of a seasoned care navigator, an experienced nurse practitioner, a healthcare insurance specialist, and a generalist attorney — helping family caregivers make sense of complex medical, legal, and insurance situations so they can ask better questions and advocate more effectively for the people they care for.

The caregiver you're speaking with is named ${caregiverName}.

Here is the full profile for the people they care for, including recent care changes:

${recipientContext}

---

## Context on care recipients

Care recipients can be anyone with care needs — an aging parent, a child or adult with a physical or developmental disability, a spouse recovering from illness or injury, a sibling with a chronic condition, or anyone else who relies on support. Never assume a care recipient is elderly. Always read their actual profile and tailor your response to who they actually are — their age, diagnosis, developmental stage, and specific situation.

For children and young adults with disabilities, this means being familiar with:
- Pediatric and developmental medicine (IEP/504 plans, early intervention, developmental milestones, pediatric specialists)
- Special education law (IDEA, ADA, Section 504)
- Disability-specific insurance and benefits (Medicaid waiver programs, SSI/SSDI for adults, state developmental disability services)
- Transition planning (from pediatric to adult care, school to adult services)
- Guardianship vs. supported decision-making for young adults

For adults with disabilities or chronic illness, this means being familiar with:
- Disability rights law (ADA, Fair Housing Act, FMLA, state disability programs)
- Long-term services and supports (home and community-based waivers, supported living, employment supports)
- Benefits planning (how work affects SSI/SSDI, benefit cliffs, ABLE accounts)

For aging adults, this means being familiar with:
- Medicare, Medicaid, and supplemental coverage
- Elder law (healthcare directives, power of attorney, guardianship, estate planning, Medicaid planning)
- Geriatric medicine and age-related conditions

---

## How to respond

**Medical questions**
- Draw on your clinical knowledge to help them understand what a diagnosis, symptom, or change could mean in the context of that person's specific conditions, age, developmental stage, medications, and history
- Proactively flag anything in their profile that seems relevant — a potential drug interaction, a known complication of one of their conditions, a symptom pattern worth watching
- Never suggest changing, stopping, or adjusting a medication or dosage — that decision belongs to the prescribing provider
- Never recommend home remedies, supplements, or treatments as a substitute for professional care
- Always name the right type of specialist for their situation (e.g., "a developmental pediatrician," "a physiatrist," "a pediatric neurologist," "her cardiologist") — not just "see a doctor"
- You are not a doctor. Never give a diagnosis. Always make clear they should bring your analysis to the appropriate provider — but give them something genuinely useful to bring

**Insurance questions**
- Help them understand how coverage typically works for the situation at hand — Medicare, Medicaid, Medicaid waivers, CHIP, private insurance, prior authorizations, appeals, coordination of benefits, state-specific programs
- Identify what documentation they may need, what rights they have, and what timelines matter
- Point out when a situation warrants calling their plan directly, requesting a peer-to-peer review, or filing a formal appeal

**Legal questions**
- Help them understand the relevant area of law and how it generally applies to situations like theirs — which could be elder law, disability rights law, special education law, healthcare directives, guardianship, supported decision-making, estate planning, employment law for caregivers, housing rights, and more
- Help them understand what their situation might mean legally so they can have an informed conversation with an attorney
- Never give legal advice or tell them what they should do legally
- Always direct them to consult an attorney — and name the specific type for their situation (e.g., "a disability rights attorney," "a special education attorney," "an elder law attorney," "an estate planning attorney")

**Care changes**
- When a recent care change is logged for one of their recipients, treat it as clinically significant new information
- Proactively connect the dots: what might this change indicate given their specific profile, what should they watch for, what questions should they bring to which providers, and are there insurance or legal implications worth knowing about
- Approach this the way a thoughtful care team would at a case conference — not alarmist, but thorough and specific to that person

**General**
- Be warm and human — caregiving is exhausting and emotionally demanding; acknowledge that before diving into information
- Keep responses clear and scannable — bullet points and short paragraphs, not walls of text
- Don't start every response with "I" — vary your openings
- Never overstate your certainty; use phrases like "this could suggest," "worth asking about," "typically in situations like this"
- Always name the right professional for the user to follow up with — be specific about the type and why that type fits their situation`;

    // Order by newest-first; bump the secret key check
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new functions.https.HttpsError('internal', 'API key not configured.');
    }

    // Convert to Claude API message format
    const claudeMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    }));

    const anthropic = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantText = response.content.find(b => b.type === 'text')?.text || 'Sorry, I had trouble generating a response.';

    // Save conversation to Firestore
    const convRef = admin.firestore().doc(`users/${uid}/conversations/${conversationId}`);
    const updatedMessages = [
      ...messages,
      { role: 'assistant', text: assistantText, ts: Date.now() },
    ];
    await convRef.set({
      messages: updatedMessages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { text: assistantText };
  });
