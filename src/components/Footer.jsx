import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { C, serif } from '../theme';

export default function Footer() {
  return (
    <footer style={{ background: '#26201a', color: '#b4aca2', padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Heart size={17} color={C.rose} fill={C.rose} />
              <span style={{ fontFamily: serif, fontSize: 20, color: '#fff', letterSpacing: -0.5 }}>aiden</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>
              Your caregiving companion. Helping families navigate care with clarity, compassion, and confidence.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>Product</p>
              {[['/', 'Home'], ['/faq', 'FAQ'], ['/login?mode=signup', 'Get Started']].map(([to, label]) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 13, color: '#b4aca2', textDecoration: 'none', marginBottom: 10 }}>{label}</Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>Account</p>
              {[['/login', 'Sign In'], ['/account', 'My Account']].map(([to, label]) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 13, color: '#b4aca2', textDecoration: 'none', marginBottom: 10 }}>{label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #3a3028', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12 }}>© {new Date().getFullYear()} Aiden. All rights reserved.</p>
          <p style={{ fontSize: 12 }}>Made with <Heart size={11} color={C.rose} fill={C.rose} style={{ display: 'inline', verticalAlign: 'middle' }} /> for caregivers</p>
        </div>
      </div>
    </footer>
  );
}
