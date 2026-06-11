import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { User, Lock, DollarSign, CreditCard, Save, CheckCircle, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateUserLocally } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.currency || '$');
  const [defaultPaymentMode, setDefaultPaymentMode] = useState(user?.defaultPaymentMode || 'DEBIT_CARD');
  
  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status States
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setLoading(true);
    try {
      await api.auth.updateProfile({
        name,
        email,
        currency,
        defaultPaymentMode,
      });
      updateUserLocally({
        name,
        email,
        currency,
        defaultPaymentMode,
      });
      setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    try {
      await api.auth.updateSecurity({
        currentPassword,
        newPassword,
      });
      setSecurityMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour du mot de passe.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Paramètres</h1>
        <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
          Gérez vos informations de compte, vos préférences de devise et votre sécurité.
        </p>
      </div>

      {/* Tabs navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid hsl(var(--card-border))',
        marginBottom: '2.5rem'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'profile' ? '2px solid hsl(var(--primary))' : 'none',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            color: activeTab === 'profile' ? 'white' : 'hsl(var(--muted))',
            padding: '0.75rem 1.25rem',
            fontWeight: activeTab === 'profile' ? 600 : 400,
            background: activeTab === 'profile' ? 'hsl(var(--primary) / 0.05)' : 'transparent',
          }}
        >
          <User size={16} style={{ marginRight: '0.5rem' }} />
          Profil & Préférences
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'security' ? '2px solid hsl(var(--primary))' : 'none',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            color: activeTab === 'security' ? 'white' : 'hsl(var(--muted))',
            padding: '0.75rem 1.25rem',
            fontWeight: activeTab === 'security' ? 600 : 400,
            background: activeTab === 'security' ? 'hsl(var(--primary) / 0.05)' : 'transparent',
          }}
        >
          <Lock size={16} style={{ marginRight: '0.5rem' }} />
          Sécurité & Accès
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            Informations personnelles & Devise
          </h2>

          {profileMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              backgroundColor: profileMessage.type === 'success' ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
              borderColor: profileMessage.type === 'success' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--destructive) / 0.3)',
              color: profileMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
            }}>
              {profileMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span style={{ fontSize: '0.9rem' }}>{profileMessage.text}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Nom complet</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Adresse e-mail</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={15} /> Devise globale
              </label>
              <select className="form-control" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="$">Dollar ($)</option>
                <option value="€">Euro (€)</option>
                <option value="CA$">Dollar Canadien (CA$)</option>
                <option value="£">Livre Sterling (£)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={15} /> Mode de paiement par défaut
              </label>
              <select className="form-control" value={defaultPaymentMode} onChange={(e) => setDefaultPaymentMode(e.target.value)}>
                <option value="DEBIT_CARD">Carte Débit</option>
                <option value="CREDIT_CARD">Carte Crédit</option>
                <option value="CASH">Espèces</option>
                <option value="WIRE_TRANSFER">Virement</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Save size={16} />
              {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      )}

      {/* Security Form */}
      {activeTab === 'security' && (
        <form onSubmit={handleUpdateSecurity} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            Modifier le mot de passe
          </h2>

          {securityMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              backgroundColor: securityMessage.type === 'success' ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
              borderColor: securityMessage.type === 'success' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--destructive) / 0.3)',
              color: securityMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
            }}>
              {securityMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span style={{ fontSize: '0.9rem' }}>{securityMessage.text}</span>
            </div>
          )}

          <div className="form-group">
            <label>Mot de passe actuel</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer"
                minLength={6}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Lock size={16} />
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
