import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

export const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
    } catch (err: any) {
      setError(err.message || t('common.error.occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 50%), hsl(222 47% 6%)',
      padding: '1.5rem'
    }}>
      <div className="glass animate-scale-up" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            background: 'linear-gradient(to right, #3b82f6, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            FinTrack
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted))' }}>
            {isLogin ? t('auth.subtitle.login') : t('auth.subtitle.register')}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive) / 0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--destructive))',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">{t('auth.label.name')}</label>
              <input
                id="name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Jean Tremblay"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.label.email')}</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@exemple.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.label.password')}</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? t('common.loading') : isLogin ? t('auth.btn.login') : t('auth.btn.register')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))' }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? t('auth.link.toRegister') : t('auth.link.toLogin')}
          </button>
        </div>
      </div>
    </div>
  );
};
