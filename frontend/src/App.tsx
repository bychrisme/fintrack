import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { Auth } from './views/Auth';
import { MainLayout } from './components/MainLayout';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'hsl(222 47% 11%)',
        color: 'white',
        fontSize: '1.25rem',
        fontWeight: 600
      }}>
        {t('app.init')}
      </div>
    );
  }

  return user ? <MainLayout /> : <Auth />;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
