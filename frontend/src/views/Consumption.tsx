import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useLanguage } from '../LanguageContext';
import { AlertTriangle, HelpCircle, AlertCircle, ShoppingCart } from 'lucide-react';

export const Consumption: React.FC = () => {
  const { t } = useLanguage();
  const [consumption, setConsumption] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchConsumptionData = async () => {
    try {
      const cons = await api.analytics.getConsumption();
      const alr = await api.analytics.getAlerts();
      setConsumption(cons);
      setAlerts(alr);
    } catch (err) {
      console.error('Failed to fetch consumption data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumptionData();
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('cons.loading')}</div>;
  }

  const monthly = consumption?.monthlyConsumption || { milk: [], fuel: [], rice: [] };
  const frequent = consumption?.topFrequent || [];
  const noLonger = consumption?.noLongerBought || [];

  return (
    <div className="animate-fade-in">
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('cons.title')}</h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>{t('cons.subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Alerts Center */}
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: 'hsl(var(--primary))' }} />
            {t('cons.alerts.title')}
          </h2>
          
          {alerts.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'hsl(var(--success))',
              backgroundColor: 'hsl(var(--success-bg))',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--success) / 0.2)',
              fontSize: '0.9rem'
            }}>
              {t('cons.alerts.success')}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {alerts.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((alr, idx) => {
                  const isHigh = alr.severity === 'HIGH';
                  const isMedium = alr.severity === 'MEDIUM';
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      backgroundColor: isHigh ? 'hsl(var(--destructive-bg))' : isMedium ? 'hsl(var(--warning-bg))' : 'hsl(var(--primary) / 0.05)',
                      borderColor: isHigh ? 'hsl(var(--destructive) / 0.3)' : isMedium ? 'hsl(var(--warning) / 0.3)' : 'hsl(var(--primary) / 0.2)',
                      animation: 'slideIn 0.3s ease'
                    }}>
                      <div style={{
                        color: isHigh ? 'hsl(var(--destructive))' : isMedium ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{alr.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--foreground) / 0.9)', lineHeight: 1.4 }}>{alr.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid hsl(var(--card-border))',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                  <span>{t('pag.show')}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="form-control"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', minWidth: '70px', height: 'auto' }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>{t('pag.lines_per_page')}</span>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                  {t('pag.display_alerts')
                    .replace('{start}', (alerts.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0).toString())
                    .replace('{end}', Math.min(currentPage * pageSize, alerts.length).toString())
                    .replace('{total}', alerts.length.toString())}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {t('pag.prev')}
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', padding: '0 0.5rem' }}>
                    {t('pag.page_of').replace('{current}', currentPage.toString()).replace('{total}', (Math.ceil(alerts.length / pageSize) || 1).toString())}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === Math.ceil(alerts.length / pageSize) || alerts.length === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {t('pag.next')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quantities Consumed (Lait 2L) */}
        <div className="stat-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('cons.chart.milk')}</h2>
          {monthly.milk.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('cons.chart.no_data')}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--card-border))' }}>
              {monthly.milk.slice(-6).map((m: any, idx: number) => {
                const maxVal = Math.max(...monthly.milk.map((o: any) => o.qty)) || 1;
                const hPercent = (m.qty / maxVal) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>{m.qty} L</div>
                    <div style={{
                      width: '100%',
                      height: `${hPercent}px`,
                      maxHeight: '100px',
                      backgroundColor: 'hsl(var(--primary))',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 0.5s ease'
                    }}></div>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted))', marginTop: '0.4rem', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quantities Consumed (Essence Ordinaire 1L) */}
        <div className="stat-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('cons.chart.fuel')}</h2>
          {monthly.fuel.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('cons.chart.no_data_simple')}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--card-border))' }}>
              {monthly.fuel.slice(-6).map((m: any, idx: number) => {
                const maxVal = Math.max(...monthly.fuel.map((o: any) => o.qty)) || 1;
                const hPercent = (m.qty / maxVal) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>{m.qty} L</div>
                    <div style={{
                      width: '100%',
                      height: `${hPercent}px`,
                      maxHeight: '100px',
                      backgroundColor: 'hsl(var(--warning))',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 0.5s ease'
                    }}></div>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted))', marginTop: '0.4rem', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Frequent Products */}
        <div className="stat-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={16} />
            {t('cons.frequent.title_simple')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {frequent.slice(0, 5).map((p: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: 'hsl(var(--muted))' }}>
                  {t('cons.frequent.purchased_count').replace('{count}', p.count.toString()).replace('{unit}', p.unit.toLowerCase())}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* No Longer Bought Products */}
        <div className="stat-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={16} />
            {t('cons.abandoned.title_simple')}
          </h2>
          {noLonger.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))', fontStyle: 'italic' }}>{t('cons.abandoned.empty')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {noLonger.slice(0, 5).map((p: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{p.name}</span>
                  <span style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem' }}>
                    {t('cons.abandoned.last_date').replace('{date}', new Date(p.lastDate).toLocaleDateString(undefined, { timeZone: 'UTC' }))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
