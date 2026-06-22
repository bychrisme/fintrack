import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { api } from '../api';
import { User, Lock, DollarSign, CreditCard, Save, CheckCircle, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateUserLocally } = useAuth();
  const { t } = useLanguage();
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
      setProfileMessage({ type: 'success', text: t('set.profile.success') });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || t('set.profile.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: t('set.security.mismatch') });
      return;
    }
    setLoading(true);
    try {
      await api.auth.updateSecurity({
        currentPassword,
        newPassword,
      });
      setSecurityMessage({ type: 'success', text: t('set.security.success') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMessage({ type: 'error', text: err.message || t('set.security.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('nav.settings')}</h1>
        <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
          {t('set.subtitle')}
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
          {t('set.tab.profile.title')}
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
          {t('set.tab.security.title')}
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            {t('set.profile.section.title')}
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
              <label>{t('set.profile.label.name')}</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('set.profile.label.email')}</label>
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
                <DollarSign size={15} /> {t('set.profile.label.currency')}
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
                <CreditCard size={15} /> {t('set.profile.label.pay')}
              </label>
              <select className="form-control" value={defaultPaymentMode} onChange={(e) => setDefaultPaymentMode(e.target.value)}>
                <option value="DEBIT_CARD">{t('set.pay.debit_card')}</option>
                <option value="CREDIT_CARD">{t('set.pay.credit_card')}</option>
                <option value="CASH">{t('set.pay.cash')}</option>
                <option value="WIRE_TRANSFER">{t('set.pay.wire_transfer')}</option>
                <option value="OTHER">{t('set.pay.other')}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Save size={16} />
              {loading ? t('set.btn.saving') : t('set.profile.btn.save')}
            </button>
          </div>
        </form>
      )}

      {/* Security Form */}
      {activeTab === 'security' && (
        <form onSubmit={handleUpdateSecurity} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            {t('set.security.title')}
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
            <label>{t('set.security.label.old')}</label>
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
              <label>{t('set.security.label.new')}</label>
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
              <label>{t('set.security.label.confirm')}</label>
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
              {loading ? t('set.btn.modifying') : t('set.security.btn.save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
