import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Auth } from './views/Auth';
import { MainLayout } from './components/MainLayout';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

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
        Initialisation de FinTrack...
      </div>
    );
  }

  return user ? <MainLayout /> : <Auth />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
