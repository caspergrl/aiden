const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

exports.onUserSignup = functions
  .runWith({ secrets: ['RESEND_API_KEY'] })
  .auth.user().onCreate(async (user) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return;
  }

  const resend = new Resend(apiKey);

  const signupTime = new Date(user.metadata.creationTime).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'long',
    timeStyle: 'short',
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
          <tr>
            <td style="padding: 8px 0; color: #888; width: 100px;">Email</td>
            <td style="padding: 8px 0; color: #222; font-weight: 600;">${user.email || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Name</td>
            <td style="padding: 8px 0; color: #222; font-weight: 600;">${user.displayName || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">UID</td>
            <td style="padding: 8px 0; color: #666; font-family: monospace; font-size: 12px;">${user.uid}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Signed up</td>
            <td style="padding: 8px 0; color: #222;">${signupTime} ET</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Provider</td>
            <td style="padding: 8px 0; color: #222;">${user.providerData?.[0]?.providerId || 'email/password'}</td>
          </tr>
        </table>
      </div>
    `,
  });

  console.log(`Signup notification sent for ${user.email}`);
});
