import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, LogIn, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginDev } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    // Since Firebase setup is skipped as per user request, we allow mock login for hospital coordinators
    loginDev();
  };

  return (
    <div id="loginWrapper">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'white',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifycontent: 'center',
            margin: '0 auto 14px',
            overflow: 'hidden',
            padding: 8,
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <ShieldAlert className="w-full h-full text-teal-600" />
          </div>
          <h2>Hospital Master Hub</h2>
          <p>Unified Coordinator Portal</p>
        </div>

        <div className="dev-banner">
          <p>★ Clinical Trial / Offline Mode</p>
          <button 
            type="button" 
            className="btn-dev"
            onClick={loginDev}
          >
            Enter Coordinator Dashboard (Dev Access)
          </button>
        </div>

        <button 
          type="button" 
          onClick={loginDev}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '10px 16px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#e2e8f0',
            transition: 'all 0.15s',
            marginBottom: 16,
            fontFamily: 'inherit'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google SSO Coordinator Log-in
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
          <span style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            or email login
          </span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ color: '#9ca3af' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail className="w-4 h-4 text-slate-500" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@hospital.org" 
                required 
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>
          <div className="form-group">
            <label style={{ color: '#9ca3af' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock className="w-4 h-4 text-slate-500" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>
          
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, textAlign: 'left' }}>
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
          >
            <LogIn className="w-4 h-4" />
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
};
