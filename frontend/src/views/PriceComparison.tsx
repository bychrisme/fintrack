import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Autocomplete } from '../components/Autocomplete';
import { Search, TrendingDown, ArrowUpDown, X } from 'lucide-react';

export const PriceComparison: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [productName, setProductName] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uniqueProducts, setUniqueProducts] = useState<any[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await api.analytics.comparePrices(productName);
      setComparison(data);
    } catch (err) {
      console.error('Failed to compare prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniqueProducts = async () => {
    try {
      const data = await api.invoices.getUniqueProducts();
      setUniqueProducts(data);
    } catch (err) {
      console.error('Failed to fetch unique products:', err);
    }
  };

  useEffect(() => {
    fetchUniqueProducts();
  }, []);

  const stats = comparison?.stats || { min: 0, max: 0, average: 0, spread: 0, cheapestStore: 'N/A' };
  const storeComparison = comparison?.storeComparison || [];
  const history = comparison?.history || [];

  // SVG Line Chart calculations
  const chartWidth = 600;
  const chartHeight = 250;
  const padding = 40;

  let svgPath = '';
  let svgAreaPath = '';
  let points: Array<{ x: number; y: number; price: number; date: Date; store: string }> = [];

  if (history.length > 0) {
    const minPrice = Math.min(...history.map((h: any) => h.price)) * 0.95; // 5% cushion
    const maxPrice = Math.max(...history.map((h: any) => h.price)) * 1.05;
    const priceDiff = maxPrice - minPrice || 1;

    points = history.map((h: any, idx: number) => {
      const x = padding + (idx / (history.length - 1 || 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - ((h.price - minPrice) / priceDiff) * (chartHeight - padding * 2);
      return {
        x,
        y,
        price: h.price,
        date: new Date(h.date),
        store: h.store,
      };
    });

    // Generate path
    svgPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    // Generate gradient area path
    svgAreaPath = `${svgPath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('comp.title')}</h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>{t('comp.subtitle')}</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass" style={{
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid hsl(var(--card-border))',
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, position: 'relative' }}>
          <Search size={20} style={{ color: 'hsl(var(--muted))', position: 'absolute', left: '0.75rem', zIndex: 5 }} />
          <Autocomplete
            value={productName}
            onChange={setProductName}
            suggestions={uniqueProducts.map((p: any) => p.productName)}
            placeholder={t('comp.search.placeholder')}
            required
            inputStyle={{ border: 'none', backgroundColor: 'transparent', paddingLeft: '2.5rem', paddingRight: productName ? '3.5rem' : '2.5rem' }}
          />
          {productName && (
            <button
              type="button"
              onClick={() => {
                setProductName('');
                setComparison(null);
              }}
              style={{
                position: 'absolute',
                right: '2.2rem',
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--muted))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
                zIndex: 5
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary">{t('comp.btn.search')}</button>
      </form>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('comp.status.searching')}</div>
      ) : comparison === null ? (
        <div style={{
          padding: '4rem',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--card-border))',
          color: 'hsl(var(--muted))'
        }}>
          {t('comp.placeholder')}
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{t('comp.placeholder.tip')}</div>
        </div>
      ) : !comparison?.found ? (
        <div style={{
          padding: '4rem',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--card-border))',
          color: 'hsl(var(--muted))'
        }}>
          {t('comp.no_data')}
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{t('comp.placeholder.tip')}</div>
        </div>
      ) : (
        <div className="animate-fade-in">
          
          {/* Key Metrics Cards */}
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-title">{t('comp.kpi.min')}</div>
              <div className="stat-value" style={{ color: 'hsl(var(--success))' }}>{stats.min.toFixed(2)} {user?.currency || '$'}</div>
              <div className="stat-footer">{t('comp.kpi.min.desc')} <span style={{ fontWeight: 600 }}>{stats.cheapestStore}</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-title">{t('comp.kpi.max')}</div>
              <div className="stat-value" style={{ color: 'hsl(var(--destructive))' }}>{stats.max.toFixed(2)} {user?.currency || '$'}</div>
              <div className="stat-footer">{t('comp.kpi.max.desc')}</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">{t('comp.kpi.avg')}</div>
              <div className="stat-value">{stats.average.toFixed(2)} {user?.currency || '$'}</div>
              <div className="stat-footer">{t('comp.kpi.avg.desc')}</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">{t('comp.kpi.spread')}</div>
              <div className="stat-value" style={{ color: 'hsl(var(--primary))' }}>{stats.spread.toFixed(2)} {user?.currency || '$'}</div>
              <div className="stat-footer">
                {t('comp.kpi.spread.footer').replace('{percent}', (stats.min > 0 ? ((stats.spread / stats.min) * 100) : 0).toFixed(0))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Price Spread Table */}
            <div className="stat-card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpDown size={18} />
                {t('comp.table.title')}
              </h2>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>{t('comp.table.col.store')}</th>
                    <th style={{ textAlign: 'right' }}>{t('comp.table.col.price')}</th>
                    <th>{t('comp.table.col.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {storeComparison.map((sc: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{sc.storeName}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: idx === 0 ? 'hsl(var(--success))' : '' }}>
                        {sc.latestPrice.toFixed(2)} {user?.currency || '$'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                        {new Date(sc.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price History Line Graph */}
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={18} />
                {t('comp.chart.title')}
              </h2>
              
              <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {history.length < 2 ? (
                  <div style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>{t('comp.chart.no_data')}</div>
                ) : (
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* X & Y Axis */}
                      <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="hsl(var(--border))" strokeWidth="1" />
                      <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="hsl(var(--border))" strokeWidth="1" />

                      {/* Area Fill */}
                      <path d={svgAreaPath} fill="url(#chartGlow)" />

                      {/* Line */}
                      <path d={svgPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Nodes */}
                      {points.map((p, idx) => (
                        <g key={idx} style={{ cursor: 'pointer' }}>
                          <circle cx={p.x} cy={p.y} r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5" />
                          <text x={p.x} y={p.y - 12} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                            {p.price.toFixed(2)}{user?.currency || '$'}
                          </text>
                          {/* Label date at bottom */}
                          {idx % 3 === 0 && (
                            <text x={p.x} y={chartHeight - padding + 18} textAnchor="middle" fill="hsl(var(--muted))" fontSize="8">
                              {p.date.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' })}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Datalist for autocomplete suggestions */}
      <datalist id="comparison-products-datalist">
        {uniqueProducts.map((p, pIdx) => (
          <option key={pIdx} value={p.productName} />
        ))}
      </datalist>
    </div>
  );
};
