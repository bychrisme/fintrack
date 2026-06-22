import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { LayoutDashboard, Receipt, Store, Search, LineChart, DollarSign, LogOut, Sun, Moon, Settings as SettingsIcon, Menu, X, Package, BarChart3 } from 'lucide-react';
import { Dashboard } from '../views/Dashboard';
import { Invoices } from '../views/Invoices';
import { Stores } from '../views/Stores';
import { PriceComparison } from '../views/PriceComparison';
import { Consumption } from '../views/Consumption';
import { Budgets } from '../views/Budgets';
import { Settings } from '../views/Settings';
import { Products } from '../views/Products';
import { Kpis } from '../views/Kpis';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoicesInitialView, setInvoicesInitialView] = useState<'list' | 'add'>('list');
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigateToInvoices = (subView: 'list' | 'add') => {
    setInvoicesInitialView(subView);
    setActiveTab('invoices');
  };

  // Sync theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: 'kpis', label: t('nav.kpis'), icon: <BarChart3 size={20} /> },
    { id: 'invoices', label: t('nav.invoices'), icon: <Receipt size={20} /> },
    { id: 'stores', label: t('nav.stores'), icon: <Store size={20} /> },
    { id: 'articles', label: t('nav.articles'), icon: <Package size={20} /> },
    { id: 'prices', label: t('nav.prices'), icon: <Search size={20} /> },
    { id: 'consumption', label: t('nav.consumption'), icon: <LineChart size={20} /> },
    { id: 'budgets', label: t('nav.budgets'), icon: <DollarSign size={20} /> },
    { id: 'settings', label: t('nav.settings'), icon: <SettingsIcon size={20} /> },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard navigateToInvoices={navigateToInvoices} />;
      case 'kpis':
        return <Kpis />;
      case 'invoices':
        return <Invoices initialView={invoicesInitialView} />;
      case 'stores':
        return <Stores />;
      case 'articles':
        return <Products />;
      case 'prices':
        return <PriceComparison />;
      case 'consumption':
        return <Consumption />;
      case 'budgets':
        return <Budgets />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard navigateToInvoices={navigateToInvoices} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} className="btn btn-ghost hamburger-btn" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
          <Menu size={24} />
        </button>
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #3b82f6, #0ea5e9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.02em'
        }}>
          FinTrack
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Language Toggle Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '28px',
            gap: '2px'
          }}>
            <button
              onClick={() => setLanguage('fr')}
              style={{
                border: 'none',
                background: language === 'fr' ? 'linear-gradient(to right, #3b82f6, #0ea5e9)' : 'transparent',
                color: language === 'fr' ? 'white' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0 8px',
                height: '100%',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: language === 'fr' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              style={{
                border: 'none',
                background: language === 'en' ? 'linear-gradient(to right, #3b82f6, #0ea5e9)' : 'transparent',
                color: language === 'en' ? 'white' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0 8px',
                height: '100%',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: language === 'en' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              EN
            </button>
          </div>
          <button onClick={toggleTheme} className="btn btn-ghost theme-toggle" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Sidebar Panel */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Title branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            background: 'linear-gradient(to right, #3b82f6, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.02em'
          }}>
            FinTrack
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {/* Language Toggle Switch (desktop only) */}
            <div className="desktop-only" style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '28px',
              gap: '2px',
              marginRight: '4px'
            }}>
              <button
                onClick={() => setLanguage('fr')}
                style={{
                  border: 'none',
                  background: language === 'fr' ? 'linear-gradient(to right, #3b82f6, #0ea5e9)' : 'transparent',
                  color: language === 'fr' ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0 6px',
                  height: '100%',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: language === 'fr' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  border: 'none',
                  background: language === 'en' ? 'linear-gradient(to right, #3b82f6, #0ea5e9)' : 'transparent',
                  color: language === 'en' ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0 6px',
                  height: '100%',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: language === 'en' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                EN
              </button>
            </div>
            {/* Theme switch (desktop only) */}
            <button onClick={toggleTheme} className="btn btn-ghost theme-toggle desktop-only" style={{ padding: '0.4rem', borderRadius: '50%' }}>
              {theme === 'dark' ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
            </button>
            {/* Sidebar close button (mobile only) */}
            <button onClick={() => setIsSidebarOpen(false)} className="btn btn-ghost mobile-only close-btn" style={{ padding: '0.4rem', borderRadius: '50%', color: 'white' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'invoices') {
                    setInvoicesInitialView('list');
                  }
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.8)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {item.icon}
                <span style={{ marginLeft: '0.75rem' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div style={{
          borderTop: '1px solid hsl(var(--card-border))',
          paddingTop: '1rem',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
              {user?.role === 'ADMIN' ? t('role.admin') : user?.role === 'FAMILY' ? t('role.family') : t('role.user')}
            </span>
          </div>

          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}>
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
};
