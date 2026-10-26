const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

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
