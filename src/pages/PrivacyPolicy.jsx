import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, sans } from '../theme';

const EFFECTIVE_DATE = 'July 5, 2026';

const h2 = { fontFamily: serif, fontSize: 22, color: C.text, marginBottom: 12, marginTop: 40 };
const p  = { fontSize: 15, color: '#4a4038', lineHeight: 1.85, marginBottom: 16, fontFamily: sans };
const ul = { fontSize: 15, color: '#4a4038', lineHeight: 1.85, paddingLeft: 24, marginBottom: 16, fontFamily: sans };

export default function PrivacyPolicy() {
  return (
    <div style={{ background: C.bg }}>
      <Navbar />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 12, fontFamily: sans }}>Legal</p>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5vw, 48px)', color: C.text, letterSpacing: -0.5, marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: C.muted, fontFamily: sans }}>Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p style={p}>
          Aiden Caregiving, LLC ("we," "our," or "us") is committed to protecting the privacy of the caregivers and families who use our platform. This Privacy Policy explains what information we collect, how we use it, and the choices you have regarding your data.
        </p>
        <p style={p}>
          By using Aiden — whether through our iOS app or our website at aiden.care — you agree to the practices described in this policy. If you do not agree, please do not use our services.
        </p>

        <h2 style={h2}>1. Information We Collect</h2>
        <p style={p}><strong>Account information.</strong> When you create an account, we collect your name, email address, and a hashed password. We use this to authenticate you and personalise your experience.</p>
        <p style={p}><strong>Care recipient information.</strong> You may choose to enter information about the people you care for, including their name, age, medical conditions, medications, insurance plans, doctors, and care notes. This information is provided voluntarily by you and is stored securely in your account.</p>
        <p style={p}><strong>Appointment and scheduling data.</strong> We store the appointments, reminders, and calendar events you create within Aiden.</p>
        <p style={p}><strong>Communications with Ask Aiden.</strong> When you use our AI chat assistant, your messages and the responses generated are associated with your account. We may use these interactions in aggregate, anonymised form to improve the quality of our service.</p>
        <p style={p}><strong>Usage data.</strong> We collect standard technical information about how you use the app, including device type, operating system, browser, IP address, pages visited, and actions taken. This data is used to understand how our service is used and to diagnose technical issues.</p>
        <p style={p}><strong>Notifications and communication preferences.</strong> If you opt in to email or SMS reminders, we collect the contact details necessary to send them.</p>

        <h2 style={h2}>2. How We Use Your Information</h2>
        <p style={p}>We use the information we collect to:</p>
        <ul style={ul}>
          <li>Provide, maintain, and improve the Aiden platform</li>
          <li>Personalise your experience and surface relevant information about your care recipients</li>
          <li>Send appointment reminders and notifications you have requested</li>
          <li>Power the Ask Aiden AI assistant with context relevant to your caregiving situation</li>
          <li>Respond to your support requests and communicate with you about your account</li>
          <li>Detect and prevent fraud, abuse, and security incidents</li>
          <li>Comply with applicable legal obligations</li>
        </ul>
        <p style={p}>We do not use your or your care recipient's health or personal information to serve you advertisements.</p>

        <h2 style={h2}>3. How We Store and Protect Your Data</h2>
        <p style={p}>
          All data is stored securely using <strong>Firebase</strong> (Google Cloud Platform), which maintains SOC 2 Type II and ISO 27001 compliance. Data is encrypted at rest and in transit using industry-standard TLS and AES-256 encryption.
        </p>
        <p style={p}>
          Access to your data within our systems is restricted to authorised personnel on a need-to-know basis. We regularly review our security practices and update them in response to new threats.
        </p>
        <p style={p}>
          While we take data security seriously, no system can guarantee absolute security. We encourage you to use a strong, unique password and to keep your login credentials private.
        </p>

        <h2 style={h2}>4. Information Sharing and Disclosure</h2>
        <p style={p}><strong>We do not sell your personal information.</strong> We do not rent, trade, or share your personal or health information with third parties for marketing or advertising purposes.</p>
        <p style={p}>We may share your information only in the following limited circumstances:</p>
        <ul style={ul}>
          <li><strong>Service providers:</strong> We work with trusted third-party providers (such as Firebase/Google, email delivery services, and analytics providers) who process data on our behalf under strict contractual obligations. These providers are not permitted to use your data for any purpose other than providing services to us.</li>
          <li><strong>Legal requirements:</strong> We may disclose your information if required to do so by law, court order, or governmental authority, or to protect the rights, property, or safety of Aiden, our users, or the public.</li>
          <li><strong>Business transfers:</strong> If Aiden is acquired by or merges with another company, your information may be transferred as part of that transaction. We will notify you in advance of any such change in ownership.</li>
          <li><strong>With your consent:</strong> We may share your information for any other purpose with your explicit consent.</li>
        </ul>

        <h2 style={h2}>5. Health Information and HIPAA</h2>
        <p style={p}>
          Aiden is a personal caregiving organisation tool, not a healthcare provider or health plan. As such, we are not a "covered entity" under the Health Insurance Portability and Accountability Act (HIPAA). The health information you enter about your care recipients is stored as general user data, not as regulated Protected Health Information (PHI) under HIPAA.
        </p>
        <p style={p}>
          You are responsible for determining whether using Aiden is appropriate given your own legal obligations. If you are a licensed healthcare professional using Aiden in a professional capacity, please contact us before doing so.
        </p>

        <h2 style={h2}>6. AI Assistant (Ask Aiden)</h2>
        <p style={p}>
          Ask Aiden provides general information and guidance to support caregivers. It is not a medical professional, and its responses do not constitute medical, legal, or financial advice. Always consult qualified professionals for decisions that affect your care recipient's health or safety.
        </p>
        <p style={p}>
          Your conversations with Ask Aiden are stored in your account. We may review anonymised, aggregated conversation data to improve response quality, but we do not identify or expose individual users' conversations to third parties.
        </p>

        <h2 style={h2}>7. Data Retention</h2>
        <p style={p}>
          We retain your account data for as long as your account is active. If you delete your account, we will permanently delete your personal data, care recipient information, appointments, and conversation history within 30 days. Some anonymised, aggregated data may be retained for analytics purposes.
        </p>
        <p style={p}>
          We may retain certain data for longer periods where required by law or to resolve disputes.
        </p>

        <h2 style={h2}>8. Your Rights and Choices</h2>
        <p style={p}>You have the following rights with respect to your personal information:</p>
        <ul style={ul}>
          <li><strong>Access:</strong> You may request a copy of the personal information we hold about you.</li>
          <li><strong>Correction:</strong> You may update or correct inaccurate information through your account settings.</li>
          <li><strong>Deletion:</strong> You may delete your account and all associated data at any time through the Account page. Deletion is immediate and irreversible.</li>
          <li><strong>Data portability:</strong> You may request an export of your data in a readable format by contacting us at the email address below.</li>
          <li><strong>Opt-out of communications:</strong> You may unsubscribe from marketing emails at any time using the link in any email we send.</li>
        </ul>
        <p style={p}>
          If you are located in the European Economic Area (EEA) or California, you may have additional rights under the GDPR or CCPA respectively. Please contact us to exercise those rights.
        </p>

        <h2 style={h2}>9. Cookies and Tracking</h2>
        <p style={p}>
          Our website uses cookies and similar technologies to maintain your login session, remember your preferences, and understand how our service is used. We use only essential and analytics cookies — we do not use advertising or tracking cookies.
        </p>
        <p style={p}>
          You can control cookies through your browser settings. Disabling essential cookies may prevent you from using certain features of the service.
        </p>

        <h2 style={h2}>10. Children's Privacy</h2>
        <p style={p}>
          Aiden is not intended for use by anyone under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with their personal information, please contact us and we will promptly delete it.
        </p>

        <h2 style={h2}>11. Changes to This Policy</h2>
        <p style={p}>
          We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or a prominent in-app notice at least 14 days before the changes take effect. Your continued use of Aiden after the effective date constitutes acceptance of the updated policy.
        </p>

        <h2 style={h2}>12. Contact Us</h2>
        <p style={p}>
          If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
        </p>
        <p style={{ ...p, background: C.bgWarm, borderRadius: 14, padding: '20px 24px', border: `1px solid ${C.border}` }}>
          <strong>Aiden Caregiving, LLC</strong><br />
          Email: <a href="mailto:privacy@aiden.care" style={{ color: C.roseDark }}>privacy@aiden.care</a><br />
          Website: aiden.care
        </p>

      </div>

      <Footer />
    </div>
  );
}
