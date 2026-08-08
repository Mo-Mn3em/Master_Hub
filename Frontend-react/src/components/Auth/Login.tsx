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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72,
            height: 72,
            background: 'white',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            overflow: 'hidden',
            padding: 4,
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <img src="/NOH_logo.jpg" alt="NOH Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }} />
          </div>
          <h2>Hospital Master Hub</h2>
          <p>Unified Coordinator Portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ color: '#9ca3af' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User className="w-4 h-4 text-slate-500" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                id="loginUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name as in the system"
                required
                autoComplete="username"
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
                id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, textAlign: 'left', background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '8px 12px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
