import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../App';
import { C, serif } from '../theme';
import Logo from './Logo';

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const appLinks = [
    { label: 'Home',      to: '/home'     },
    { label: 'Care',      to: '/care'     },
    { label: 'Calendar',  to: '/calendar' },
    { label: 'To Do',     to: '/todo'     },
    { label: 'Ask Aiden', to: '/chat'     },
  ];

  const supportLinks = [
    { label: 'FAQ',             to: '/faq' },
    { label: 'Contact Aiden',   to: '/contact' },
    { label: 'Privacy Policy',  to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ];

  return (
    <footer style={{ background: '#26201a', color: '#b4aca2', padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, marginBottom: 40 }}>

          {/* Brand */}
          <div style={{ maxWidth: 260 }}>
            <div style={{ marginBottom: 14 }}>
              <Logo width={72} style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              Your caregiving companion. Helping families navigate care with clarity, compassion, and confidence.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>

            {/* App nav */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>App</p>
              {appLinks.map(({ label, to }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 13, color: '#b4aca2', textDecoration: 'none', marginBottom: 10 }}>{label}</Link>
              ))}
            </div>

            {/* Support */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>Support</p>
              {supportLinks.map(({ label, to }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 13, color: '#b4aca2', textDecoration: 'none', marginBottom: 10 }}>{label}</Link>
              ))}
              <div style={{ marginTop: 4 }}>
                {user ? (
                  <button
                    onClick={() => { signOut(auth); navigate('/login'); }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: '#b4aca2', cursor: 'pointer', display: 'block', marginBottom: 10 }}
                  >
                    Sign out
                  </button>
                ) : (
                  <>
                    <Link to="/login" style={{ display: 'block', fontSize: 13, color: '#b4aca2', textDecoration: 'none', marginBottom: 10 }}>Sign in</Link>
                    <Link to="/login?mode=signup" style={{ display: 'block', fontSize: 13, color: '#c4938a', textDecoration: 'none', marginBottom: 10, fontWeight: 600 }}>Get started →</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #3a3028', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12 }}>© {new Date().getFullYear()} Aiden. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ fontSize: 12, color: '#b4aca2', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms"   style={{ fontSize: 12, color: '#b4aca2', textDecoration: 'none' }}>Terms of Service</Link>
            <p style={{ fontSize: 12, margin: 0 }}>Made with <Heart size={11} color={C.rose} fill={C.rose} style={{ display: 'inline', verticalAlign: 'middle' }} /> for caregivers</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
