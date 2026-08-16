import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogIn, Lock, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed.');
    }
  };

  return (
    <div id="loginWrapper">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 76,
            height: 76,
            background: '#ffffff',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            overflow: 'hidden',
            padding: 4,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
          }}>
            <img src="/NOH_logo.jpg" alt="NOH Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
          </div>
          <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
            PCC
          </h2>
          <p style={{ color: '#0f766e', fontSize: '13px', fontWeight: 600 }}>
            Patient Coordinator Center
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ color: '#334155', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6, display: 'block' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User className="w-4 h-4" style={{ color: '#0f766e', position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                id="loginUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your coordinator username"
                required
                autoComplete="username"
                style={{ paddingLeft: 42, background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '10px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ color: '#334155', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6, display: 'block' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock className="w-4 h-4" style={{ color: '#0f766e', position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingLeft: 42, background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '10px' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: 16, textAlign: 'left', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              marginTop: 8,
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#0f766e',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
