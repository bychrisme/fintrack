import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
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
        await register({ email, password, name, role });
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
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
            {isLogin ? 'Connectez-vous pour gérer vos dépenses' : 'Créez un compte famille ou utilisateur'}
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
              <label htmlFor="name">Nom Complet</label>
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
            <label htmlFor="email">Adresse Email</label>
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
            <label htmlFor="password">Mot de passe</label>
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

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="role">Rôle de l'utilisateur</label>
              <select
                id="role"
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">Utilisateur Simple</option>
                <option value="FAMILY">Membre de Famille</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Chargement...' : isLogin ? 'Se Connecter' : 'Créer un compte'}
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
            {isLogin ? "Pas de compte? Inscrivez-vous" : "Déjà un compte? Connectez-vous"}
          </button>
        </div>
      </div>
    </div>
  );
};
