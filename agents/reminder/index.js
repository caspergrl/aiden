/**
 * Aiden Reminder Agent
 *
 * Runs on a schedule (e.g. every morning via cron or Claude schedule).
 * For each user it:
 *   1. Fetches today's + tomorrow's appointments from Firestore
 *   2. Fetches active medication schedules + recent logs (for context)
 *   3. Uses Claude to write a warm, personalised reminder email
 *   4. Sends via Resend from reminders@aidencare.co
 *
 * Firestore collections read:
 *   users/{uid}/appointments        — { recipientId, title, date, time, location, doctor }
 *   users/{uid}/medicationSchedules — { recipientId, medicationName, times[], enabled }
 *   users/{uid}/medicationLogs      — { scheduleId, medicationName, administeredAt, note }
 *   users/{uid}/recipients          — { name, nickname, ... }
 */

import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import admin from 'firebase-admin';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

// ── Load Firebase service account ─────────────────────────────────────────────
const require = createRequire(import.meta.url);
const saPath = resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json');
let serviceAccount;
try {
  serviceAccount = require(saPath);
} catch {
  console.error(`Could not load service account from ${saPath}`);
  console.error('Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

// ── Init services ──────────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const authAdmin = admin.auth();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Date helpers ───────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const fmtDateTime = (d) => d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

// ── Main runner ────────────────────────────────────────────────────────────────
async function run() {
  const now = new Date();
  const todayStr = toDateStr(now);
  const tomorrowStr = toDateStr(addDays(now, 1));

  if (isDryRun) console.log('🔍 DRY RUN — emails will be previewed, not sent\n');
  console.log(`▶ Aiden reminder agent — ${todayStr}`);

  const usersSnap = await db.collection('users').get();
  console.log(`  Found ${usersSnap.size} users\n`);

  let sent = 0, skipped = 0, errors = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    try {
      const result = await processUser(uid, todayStr, tomorrowStr, now);
      if (result === 'sent') sent++;
      else skipped++;
    } catch (err) {
      console.error(`  ✗ [${uid}] ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✓ Done — ${sent} sent, ${skipped} skipped (nothing due), ${errors} errors`);
}

// ── Per-user processing ────────────────────────────────────────────────────────
async function processUser(uid, todayStr, tomorrowStr, now) {
  // Get caregiver info from Firebase Auth
  let userRecord;
  try {
    userRecord = await authAdmin.getUser(uid);
  } catch {
    return 'skipped'; // Account may have been deleted
  }
  const caregiverEmail = userRecord.email;
  if (!caregiverEmail) return 'skipped';

  // Extract first name (fall back to 'there')
  const caregiverName = userRecord.displayName?.split(' ')[0] || 'there';

  // Get notification role preference from user doc
  const userDocSnap = await db.collection('users').doc(uid).get();
  const notificationRole = userDocSnap.data()?.notificationRole || 'caretaker';

  // Parallel fetch of everything we need
  const [apptSnap, schedSnap, recipSnap] = await Promise.all([
    db.collection('users').doc(uid).collection('appointments').get(),
    db.collection('users').doc(uid).collection('medicationSchedules').get(),
    db.collection('users').doc(uid).collection('recipients').get(),
  ]);

  const appointments = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const schedules = schedSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.enabled !== false);
  const recipients = recipSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const todayAppts = appointments.filter(a => a.date === todayStr);
  const tomorrowAppts = appointments.filter(a => a.date === tomorrowStr);

  // Fetch recent medication logs for context (last 48 hours)
  let recentLogs = [];
  if (schedules.length > 0) {
    try {
      const cutoff = admin.firestore.Timestamp.fromDate(new Date(now - 48 * 3600 * 1000));
      const logsSnap = await db
        .collection('users').doc(uid)
        .collection('medicationLogs')
        .where('administeredAt', '>=', cutoff)
        .orderBy('administeredAt', 'desc')
        .get();
      recentLogs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      // medicationLogs may not have any entries yet — that's fine
    }
  }

  // Nothing to remind about today?
  if (todayAppts.length === 0 && tomorrowAppts.length === 0 && schedules.length === 0) {
    return 'skipped';
  }

  // Build structured context for Claude
  const recipMap = Object.fromEntries(recipients.map(r => [r.id, r]));
  const recipNick = (id) => {
    const r = recipMap[id];
    return r?.nickname || r?.name?.split(' ')[0] || 'your loved one';
  };

  const context = {
    caregiverName,
    currentDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    todayAppointments: todayAppts.map(a => ({
      recipientName: recipNick(a.recipientId),
      title: a.title,
      time: a.time,
      location: a.location || null,
      doctor: a.doctor || null,
    })),
    tomorrowAppointments: tomorrowAppts.map(a => ({
      recipientName: recipNick(a.recipientId),
      title: a.title,
      time: a.time,
      location: a.location || null,
      doctor: a.doctor || null,
    })),
    medicationReminders: schedules.map(s => {
      const lastLog = recentLogs.find(l => l.scheduleId === s.id);
      return {
        recipientName: recipNick(s.recipientId),
        medication: s.medicationName,
        scheduledTimes: s.times || [],
        lastGiven: lastLog
          ? fmtDateTime(lastLog.administeredAt.toDate())
          : null,
        lastNote: lastLog?.note || null,
      };
    }),
  };

  // Generate personalised email via Claude
  const { subject, body } = await generateEmail(context, notificationRole);

  if (isDryRun) {
    console.log(`  ── [${caregiverEmail}] ──────────────────────────`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${body.split('\n').map(l => '    ' + l).join('\n')}\n`);
    return 'sent';
  }

  // Send via Resend
  const { error } = await resend.emails.send({
    from: 'Aiden <reminders@aidencare.co>',
    to: caregiverEmail,
    subject,
    html: buildEmailHtml(body),
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }

  console.log(`  ✓ Sent to ${caregiverEmail} (${todayAppts.length} today, ${tomorrowAppts.length} tomorrow, ${schedules.length} meds)`);
  return 'sent';
}

// ── Claude email generation ────────────────────────────────────────────────────
async function generateEmail(ctx, notificationRole = 'caretaker') {
  const lines = [];

  if (ctx.todayAppointments.length > 0) {
    lines.push('TODAY\'S APPOINTMENTS:');
    ctx.todayAppointments.forEach(a => {
      let s = `  - ${a.recipientName}: ${a.title} at ${a.time}`;
      if (a.location) s += ` @ ${a.location}`;
      if (a.doctor) s += ` with ${a.doctor}`;
      lines.push(s);
    });
  }

  if (ctx.tomorrowAppointments.length > 0) {
    lines.push('\nTOMORROW\'S APPOINTMENTS:');
    ctx.tomorrowAppointments.forEach(a => {
      let s = `  - ${a.recipientName}: ${a.title} at ${a.time}`;
      if (a.location) s += ` @ ${a.location}`;
      if (a.doctor) s += ` with ${a.doctor}`;
      lines.push(s);
    });
  }

  if (ctx.medicationReminders.length > 0) {
    lines.push('\nMEDICATION REMINDERS:');
    ctx.medicationReminders.forEach(m => {
      let s = `  - ${m.medication} for ${m.recipientName}`;
      if (m.scheduledTimes.length > 0) s += ` (scheduled: ${m.scheduledTimes.join(', ')})`;
      if (m.lastGiven) s += ` — last given ${m.lastGiven}`;
      else s += ` — not yet logged today`;
      if (m.lastNote) s += ` (note: ${m.lastNote})`;
      lines.push(s);
    });
  }

  const isCaretaker = notificationRole !== 'observer';

  const roleGuidance = isCaretaker
    ? `- This person is the CARETAKER — they physically give medications and attend appointments
- For medications: use actionable language ("it's time to give", "Metformin is due")
- Mention when each medication was last given if the data shows it (e.g. "you gave Metformin to Mom last night at 8:02 PM")
- For appointments today: make it feel urgent and prep-oriented ("Mom's cardiology is at 10 AM today — don't forget to leave early")
- Tone: warm partner-in-care, like a helpful reminder from someone who cares`
    : `- This person is an OBSERVER — they stay informed but do not give medications or attend appointments themselves
- For medications: use informational language ("Metformin is scheduled for", "is due to be given")
- If medication was recently logged, say who likely gave it and when ("Metformin was given to Mom last night at 8:02 PM")
- For appointments: frame as FYI ("Mom has a cardiology appointment today at 10 AM with Dr. Lee")
- Tone: warm update, like a caring family member being kept in the loop — no urgency or action items`;

  const prompt = `You are Aiden, a warm and supportive caregiving companion app.
Write a brief reminder email to a caregiver. Today is ${ctx.currentDate}.

${lines.join('\n')}

Guidelines:
- Address them by first name: ${ctx.caregiverName}
- Warm but not saccharine — matter-of-fact with genuine care
${roleGuidance}
- For appointments tomorrow: frame as upcoming (not urgent)
- Keep it under 160 words
- End with ONE brief encouraging sentence — something real, not generic
- No markdown, no bullet points in the email — natural paragraphs

Respond with valid JSON only:
{ "subject": "...", "body": "paragraph1\\n\\nparagraph2\\n\\nparagraph3" }`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude did not return valid JSON');

  return JSON.parse(match[0]);
}

// ── HTML email template ────────────────────────────────────────────────────────
function buildEmailHtml(body) {
  const paras = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 18px 0;line-height:1.85;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Aiden Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f5ede8;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:580px;margin:0 auto;padding:28px 16px 40px;">

    <!-- Card -->
    <div style="background:#ffffff;border-radius:20px;padding:36px 32px;box-shadow:0 4px 28px rgba(140,60,40,0.09);">

      <!-- Logo -->
      <div style="margin-bottom:28px;">
        <svg width="88" height="39" viewBox="0 0 138 61" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.704 60.48C6.05867 60.48 3.94667 59.52 2.368 57.6C0.789333 55.68 0 53.1627 0 50.048C0 46.6347 0.789333 43.4133 2.368 40.384C3.94667 37.312 6.03733 34.8587 8.64 33.024C11.2853 31.1467 14.08 30.208 17.024 30.208C17.9627 30.208 18.5813 30.4 18.88 30.784C19.2213 31.1253 19.4987 31.7653 19.712 32.704C20.608 32.5333 21.5467 32.448 22.528 32.448C24.6187 32.448 25.664 33.1947 25.664 34.688C25.664 35.584 25.344 37.7173 24.704 41.088C23.7227 45.9947 23.232 49.408 23.232 51.328C23.232 51.968 23.3813 52.48 23.68 52.864C24.0213 53.248 24.448 53.44 24.96 53.44C25.7707 53.44 26.752 52.928 27.904 51.904C29.056 50.8373 30.6133 49.1307 32.576 46.784C33.088 46.1867 33.664 45.888 34.304 45.888C34.8587 45.888 35.2853 46.144 35.584 46.656C35.9253 47.168 36.096 47.872 36.096 48.768C36.096 50.4747 35.6907 51.7973 34.88 52.736C33.1307 54.912 31.2747 56.7467 29.312 58.24C27.3493 59.7333 25.4507 60.48 23.616 60.48C22.208 60.48 20.9067 60.0107 19.712 59.072C18.56 58.0907 17.6853 56.768 17.088 55.104C14.8693 58.688 12.0747 60.48 8.704 60.48ZM11.008 54.016C11.9467 54.016 12.8427 53.4613 13.696 52.352C14.5493 51.2427 15.168 49.7707 15.552 47.936L17.92 36.16C16.128 36.2027 14.464 36.8853 12.928 38.208C11.4347 39.488 10.24 41.1947 9.344 43.328C8.448 45.4613 8 47.7227 8 50.112C8 51.4347 8.256 52.416 8.768 53.056C9.32267 53.696 10.0693 54.016 11.008 54.016Z" fill="#D29C9C"/>
          <path d="M38.7665 60.48C35.9932 60.48 33.9665 59.4987 32.6865 57.536C31.4492 55.5733 30.8305 52.9707 30.8305 49.728C30.8305 47.808 31.0652 45.3547 31.5345 42.368C32.0465 39.3387 32.6865 36.5227 33.4545 33.92C33.8385 32.5547 34.3505 31.616 34.9905 31.104C35.6305 30.592 36.6545 30.336 38.0625 30.336C40.2385 30.336 41.3265 31.0613 41.3265 32.512C41.3265 33.5787 40.9212 36.0533 40.1105 39.936C39.0865 44.6293 38.5745 47.808 38.5745 49.472C38.5745 50.752 38.7452 51.7333 39.0865 52.416C39.4278 53.0987 40.0038 53.44 40.8145 53.44C41.5825 53.44 42.5425 52.9067 43.6945 51.84C44.8465 50.7733 46.3825 49.088 48.3025 46.784C48.8145 46.1867 49.3905 45.888 50.0305 45.888C50.5852 45.888 51.0118 46.144 51.3105 46.656C51.6518 47.168 51.8225 47.872 51.8225 48.768C51.8225 50.4747 51.4172 51.7973 50.6065 52.736C46.3825 57.8987 42.4358 60.48 38.7665 60.48Z" fill="#D29C9C"/>
          <path d="M108.126 45.888C108.681 45.888 109.107 46.144 109.406 46.656C109.747 47.168 109.918 47.872 109.918 48.768C109.918 50.4747 109.513 51.7973 108.702 52.736C107.123 54.656 104.883 56.4267 101.982 58.048C99.1233 59.6693 96.0513 60.48 92.766 60.48C88.286 60.48 84.8087 59.264 82.334 56.832C79.8593 54.4 78.622 51.072 78.622 46.848C78.622 43.904 79.2407 41.1733 80.478 38.656C81.7153 36.096 83.422 34.0693 85.598 32.576C87.8167 31.0827 90.3127 30.336 93.086 30.336C95.5607 30.336 97.5447 31.0827 99.038 32.576C100.531 34.0267 101.278 36.0107 101.278 38.528C101.278 41.472 100.211 44.0107 98.078 46.144C95.9873 48.2347 92.4247 49.8987 87.39 51.136C88.4567 53.0987 90.4833 54.08 93.47 54.08C95.39 54.08 97.566 53.4187 99.998 52.096C102.473 50.7307 104.606 48.96 106.398 46.784C106.91 46.1867 107.486 45.888 108.126 45.888ZM91.998 36.608C90.4193 36.608 89.0753 37.5253 87.966 39.36C86.8993 41.1947 86.366 43.4133 86.366 46.016V46.144C88.8833 45.5467 90.8673 44.6507 92.318 43.456C93.7687 42.2613 94.494 40.8747 94.494 39.296C94.494 38.4853 94.2593 37.8453 93.79 37.376C93.3633 36.864 92.766 36.608 91.998 36.608Z" fill="#D29C9C"/>
          <path d="M109.251 60.48C107.63 60.48 106.478 59.6267 105.795 57.92C105.155 56.2133 104.835 53.4827 104.835 49.728C104.835 44.1813 105.624 38.912 107.203 33.92C107.587 32.6827 108.206 31.7867 109.059 31.232C109.955 30.6347 111.192 30.336 112.771 30.336C113.624 30.336 114.222 30.4427 114.563 30.656C114.904 30.8693 115.075 31.2747 115.075 31.872C115.075 32.5547 114.755 34.0907 114.115 36.48C113.688 38.1867 113.347 39.68 113.091 40.96C112.835 42.24 112.622 43.8187 112.451 45.696C113.859 42.0267 115.438 39.04 117.187 36.736C118.936 34.432 120.643 32.7893 122.307 31.808C124.014 30.8267 125.571 30.336 126.979 30.336C128.344 30.336 129.368 30.6987 130.051 31.424C130.776 32.1067 131.139 33.1307 131.139 34.496C131.139 35.6053 130.904 37.696 130.435 40.768C130.008 43.3707 129.667 45.8453 129.411 48.192C129.155 50.496 127.605 54.08 132.215 54.08C134.442 53.8674 137.624 52.3945 137.213 56.3617C136.782 60.527 126.296 60.48 124.803 60.48C123.395 60.48 122.371 60.1173 121.731 59.392C121.091 58.6667 120.771 57.5787 120.771 56.128C120.771 54.4213 121.07 51.6053 121.667 47.68C122.179 44.2667 122.435 42.0907 122.435 41.152C122.435 40.4693 122.2 40.128 121.731 40.128C121.176 40.128 120.387 40.8533 119.363 42.304C118.382 43.712 117.358 45.5893 116.291 47.936C115.267 50.2827 114.435 52.7573 113.795 55.36C113.326 57.3653 112.771 58.7307 112.131 59.456C111.534 60.1387 110.574 60.48 109.251 60.48Z" fill="#D29C9C"/>
          <path d="M8.704 60.48C6.05867 60.48 3.94667 59.52 2.368 57.6C0.789333 55.68 0 53.1627 0 50.048C0 46.6347 0.789333 43.4133 2.368 40.384C3.94667 37.312 6.03733 34.8587 8.64 33.024C11.2853 31.1467 14.08 30.208 17.024 30.208C17.9627 30.208 18.5813 30.4 18.88 30.784C19.2213 31.1253 19.4987 31.7653 19.712 32.704C20.608 32.5333 21.5467 32.448 22.528 32.448C24.6187 32.448 25.664 33.1947 25.664 34.688C25.664 35.584 25.344 37.7173 24.704 41.088C23.7227 45.9947 23.232 49.408 23.232 51.328C23.232 51.968 23.3813 52.48 23.68 52.864C24.0213 53.248 24.448 53.44 24.96 53.44C25.7707 53.44 26.752 52.928 27.904 51.904C29.056 50.8373 30.6133 49.1307 32.576 46.784C33.088 46.1867 33.664 45.888 34.304 45.888C34.8587 45.888 35.2853 46.144 35.584 46.656C35.9253 47.168 36.096 47.872 36.096 48.768C36.096 50.4747 35.6907 51.7973 34.88 52.736C33.1307 54.912 31.2747 56.7467 29.312 58.24C27.3493 59.7333 25.4507 60.48 23.616 60.48C22.208 60.48 20.9067 60.0107 19.712 59.072C18.56 58.0907 17.6853 56.768 17.088 55.104C14.8693 58.688 12.0747 60.48 8.704 60.48ZM11.008 54.016C11.9467 54.016 12.8427 53.4613 13.696 52.352C14.5493 51.2427 15.168 49.7707 15.552 47.936L17.92 36.16C16.128 36.2027 14.464 36.8853 12.928 38.208C11.4347 39.488 10.24 41.1947 9.344 43.328C8.448 45.4613 8 47.7227 8 50.112C8 51.4347 8.256 52.416 8.768 53.056C9.32267 53.696 10.0693 54.016 11.008 54.016Z" fill="url(#rg0)"/>
          <path d="M38.7665 60.48C35.9932 60.48 33.9665 59.4987 32.6865 57.536C31.4492 55.5733 30.8305 52.9707 30.8305 49.728C30.8305 47.808 31.0652 45.3547 31.5345 42.368C32.0465 39.3387 32.6865 36.5227 33.4545 33.92C33.8385 32.5547 34.3505 31.616 34.9905 31.104C35.6305 30.592 36.6545 30.336 38.0625 30.336C40.2385 30.336 41.3265 31.0613 41.3265 32.512C41.3265 33.5787 40.9212 36.0533 40.1105 39.936C39.0865 44.6293 38.5745 47.808 38.5745 49.472C38.5745 50.752 38.7452 51.7333 39.0865 52.416C39.4278 53.0987 40.0038 53.44 40.8145 53.44C41.5825 53.44 42.5425 52.9067 43.6945 51.84C44.8465 50.7733 46.3825 49.088 48.3025 46.784C48.8145 46.1867 49.3905 45.888 50.0305 45.888C50.5852 45.888 51.0118 46.144 51.3105 46.656C51.6518 47.168 51.8225 47.872 51.8225 48.768C51.8225 50.4747 51.4172 51.7973 50.6065 52.736C46.3825 57.8987 42.4358 60.48 38.7665 60.48Z" fill="url(#rg1)"/>
          <defs>
            <linearGradient id="rg0" x1="86.5" y1="50.2" x2="68.7" y2="43.7" gradientUnits="userSpaceOnUse">
              <stop offset="0.067" stop-color="#D29C9C"/><stop offset="1" stop-color="#904848"/>
            </linearGradient>
            <linearGradient id="rg1" x1="86.5" y1="50.2" x2="68.7" y2="43.7" gradientUnits="userSpaceOnUse">
              <stop offset="0.067" stop-color="#D29C9C"/><stop offset="1" stop-color="#904848"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <!-- Body -->
      <div style="font-size:15px;color:#3a3028;">
        ${paras}
      </div>

      <!-- Divider -->
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #ede5d8;">
        <p style="margin:0;font-size:12px;color:#b4aca2;font-family:Arial,Helvetica,sans-serif;">
          Sent by Aiden &middot;
          <a href="https://aidencare.co" style="color:#904848;text-decoration:none;">aidencare.co</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Run ────────────────────────────────────────────────────────────────────────
run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
