import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { PiggyBank, ShoppingBag, RefreshCw, Plus } from 'lucide-react';

export const Dashboard: React.FC<{ 
  navigateToInvoices: (subView: 'list' | 'add') => void;
}> = ({ navigateToInvoices }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.analytics.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('dash.loading')}</div>;
  }

  const kpis = stats?.kpis || {
    totalSpentThisMonth: 0,
    totalSpentThisYear: 0,
    totalSpentAllTime: 0,
    invoiceCount: 0,
    monthlyInvoiceCount: 0,
    totalItemsCount: 0,
    savingsIndex: 0,
  };

  const categoryData = stats?.categoryBreakdown || [];
  const storeData = stats?.storeBreakdown || [];
  const recentInvoices = stats?.recentInvoices || [];

  // Calculate SVG Donut segments
  let cumulativePercent = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const totalCategoryAmt = categoryData.reduce((s: number, c: any) => s + c.amount, 0);

  const donutSegments = categoryData.map((cat: any) => {
    const percent = totalCategoryAmt > 0 ? (cat.amount / totalCategoryAmt) * 100 : 0;
    const strokeLength = (percent / 100) * circumference;
    const strokeOffset = circumference - ((cumulativePercent / 100) * circumference);
    cumulativePercent += percent;
    return {
      ...cat,
      percent,
      strokeLength,
      strokeOffset,
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('dash.welcome')}, {user?.name || t('role.user')}</h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>{t('dash.welcome.desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            className={`btn btn-secondary ${refreshing ? 'animate-spin' : ''}`}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={16} />
            {t('dash.btn.refresh')}
          </button>
          <button
            onClick={() => navigateToInvoices('add')}
            className="btn btn-primary"
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <Plus size={16} />
            {t('dash.btn.newInvoice')}
          </button>
        </div>
      </div>

      {/* Total Expenses Section */}
      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted))', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {t('dash.overview')}
      </h3>
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-title">{t('dash.kpi.today')}</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{(kpis.totalSpentToday || 0).toFixed(2)} {user?.currency || '$'}</div>
          <div className="stat-footer">{t('dash.kpi.today.footer')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">{t('dash.kpi.week')}</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{(kpis.totalSpentThisWeek || 0).toFixed(2)} {user?.currency || '$'}</div>
          <div className="stat-footer">{t('dash.kpi.week.footer')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">{t('dash.kpi.month')}</div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'hsl(var(--primary))' }}>{kpis.totalSpentThisMonth.toFixed(2)} {user?.currency || '$'}</div>
          <div className="stat-footer">{kpis.monthlyInvoiceCount} {t('dash.kpi.month.footer')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">{t('dash.kpi.year')}</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{kpis.totalSpentThisYear.toFixed(2)} {user?.currency || '$'}</div>
          <div className="stat-footer">{t('dash.kpi.year.footer')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">{t('dash.kpi.cumulative')}</div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'hsl(var(--success))' }}>{kpis.totalSpentAllTime.toFixed(2)} {user?.currency || '$'}</div>
          <div className="stat-footer">{t('dash.kpi.cumulative.footer')}</div>
        </div>
      </div>

      {/* Stats and Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-title">{t('dash.items.title')}</div>
              <div className="stat-value">{Math.round(kpis.totalItemsCount)}</div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="stat-footer" style={{ marginTop: '0.5rem' }}>
            {kpis.invoiceCount} {t('dash.items.footer')}
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, hsl(208 95% 23% / 0.4), hsl(223 47% 14%))',
          borderColor: 'hsl(var(--primary) / 0.3)',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-title" style={{ color: 'hsl(var(--primary-foreground))', fontWeight: 600 }}>{t('dash.savings.title')}</div>
              <div className="stat-value" style={{ color: '#38bdf8' }}>{kpis.savingsIndex.toFixed(2)} {user?.currency || '$'}</div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="stat-footer" style={{ color: 'hsl(var(--foreground) / 0.7)', marginTop: '0.5rem' }}>
            {t('dash.savings.footer')}
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Category breakdown (SVG Donut) */}
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('dash.category.breakdown')}</h2>
          
          {categoryData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted))' }}>
              {t('dash.no_data')}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
              {/* Donut Chart SVG */}
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <svg width="150" height="150" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="hsl(var(--border))" strokeWidth="12" />
                  {donutSegments.map((seg: any, idx: number) => (
                    <circle
                      key={idx}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={`${seg.strokeLength} ${circumference}`}
                      strokeDashoffset={seg.strokeOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  ))}
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalCategoryAmt.toFixed(0)} {user?.currency || '$'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted))' }}>{t('dash.total')}</div>
                </div>
              </div>

              {/* Legends */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
                {donutSegments.map((seg: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }}></span>
                      <span style={{ fontWeight: 500 }}>{seg.name}</span>
                    </div>
                    <div style={{ color: 'hsl(var(--muted))' }}>
                      {seg.amount.toFixed(0)} {user?.currency || '$'} ({seg.percent.toFixed(0)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Store breakdown */}
        <div className="stat-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('dash.store.breakdown')}</h2>
          {storeData.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('dash.no_data')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {storeData.map((store: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 500 }}>{store.name}</span>
                    <span style={{ color: 'hsl(var(--muted))' }}>{store.amount.toFixed(2)} {user?.currency || '$'} ({store.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'hsl(var(--muted-dark))', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${store.percentage}%`,
                      height: '100%',
                      backgroundColor: idx === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.6)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--card-border))' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('dash.recent.purchases')}</h2>
          <button onClick={() => navigateToInvoices('list')} className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            {t('dash.view.all')}
          </button>
        </div>
        {recentInvoices.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('dash.recent.no_invoices')}</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>{t('inv.table.number')}</th>
                <th>{t('inv.table.store')}</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td>{new Date(inv.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.storeName}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{inv.totalAmount.toFixed(2)} {user?.currency || '$'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
