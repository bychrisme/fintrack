import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Autocomplete } from '../components/Autocomplete';
import { 
  TrendingUp, 
  TrendingDown, 
  Store, 
  Receipt, 
  Tag, 
  Percent, 
  DollarSign, 
  ShoppingBag, 
  Loader2, 
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

interface TrendChartProps {
  data: any[];
  currency: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, currency }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!chartRef.current) return;

    // Create root element
    const root = am5.Root.new(chartRef.current);

    // Set themes
    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "none",
        pinchZoomX: true,
        paddingLeft: 10,
        paddingRight: 20,
        paddingTop: 20,
        paddingBottom: 10
      })
    );

    // Create axes
    const rendererX = am5xy.AxisRendererX.new(root, {
      minGridDistance: 40,
      minorGridEnabled: true
    });
    rendererX.labels.template.setAll({
      fill: am5.color(0x94a3b8),
      fontSize: "0.8rem",
      fontWeight: "500"
    });
    rendererX.grid.template.setAll({
      stroke: am5.color(0x334155),
      strokeOpacity: 0.15
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "label",
        renderer: rendererX,
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    xAxis.data.setAll(data);

    const rendererY = am5xy.AxisRendererY.new(root, {});
    rendererY.labels.template.setAll({
      fill: am5.color(0x94a3b8),
      fontSize: "0.8rem",
      fontWeight: "500"
    });
    rendererY.grid.template.setAll({
      stroke: am5.color(0x334155),
      strokeOpacity: 0.15
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: rendererY
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: t('kpi.spend.evolution'),
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "amount",
        categoryXField: "label",
        tooltip: am5.Tooltip.new(root, {
          labelText: `{valueY} ${currency}`
        })
      })
    );

    series.strokes.template.setAll({
      strokeWidth: 3.5,
      stroke: am5.color(0x3b82f6)
    });

    // Add bullets (data labels that show up on hover)
    series.bullets.push(() => {
      const label = am5.Label.new(root, {
        text: `{valueY} ${currency}`,
        populateText: true,
        centerX: am5.p50,
        centerY: am5.p100,
        dy: -12,
        fill: am5.color(0x38bdf8),
        fontSize: "0.85rem",
        fontWeight: "600",
        opacity: 0
      });

      const circle = am5.Circle.new(root, {
        radius: 6.5,
        fill: am5.color(0x3b82f6),
        stroke: am5.color(0xffffff),
        strokeWidth: 2,
        interactive: true
      });

      circle.states.create("hover", {
        scale: 1.4,
        fill: am5.color(0x38bdf8)
      });

      circle.events.on("pointerover", () => {
        label.animate({
          key: "opacity",
          to: 1,
          duration: 150,
          easing: am5.ease.out(am5.ease.cubic)
        });
      });

      circle.events.on("pointerout", () => {
        label.animate({
          key: "opacity",
          to: 0,
          duration: 150,
          easing: am5.ease.out(am5.ease.cubic)
        });
      });

      const container = am5.Container.new(root, {});
      container.children.push(circle);
      container.children.push(label);

      return am5.Bullet.new(root, {
        sprite: container
      });
    });

    // Add cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none",
      xAxis: xAxis
    }));

    // Set data
    series.data.setAll(data);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000);

    return () => {
      root.dispose();
    };
  }, [data, currency]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: "100%", 
        height: "380px", 
        marginTop: "1rem" 
      }} 
    />
  );
};

interface CategoryChartProps {
  data: any[];
  currency: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, currency }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Create root element
    const root = am5.Root.new(chartRef.current);

    // Set themes
    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        paddingLeft: 0,
        paddingRight: 20,
        paddingTop: 30,
        paddingBottom: 10
      })
    );

    // Add cursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // Create axes
    const xRenderer = am5xy.AxisRendererX.new(root, { 
      minGridDistance: 30,
      minorGridEnabled: true
    });
    
    xRenderer.labels.template.setAll({
      fill: am5.color(0x94a3b8),
      fontSize: "0.8rem",
      fontWeight: "500"
    });

    xRenderer.grid.template.set("visible", false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "categoryName",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.labels.template.setAll({
      fill: am5.color(0x94a3b8),
      fontSize: "0.8rem",
      fontWeight: "500"
    });
    
    yRenderer.grid.template.setAll({
      strokeDasharray: [2, 2],
      stroke: am5.color(0x334155),
      strokeOpacity: 0.15
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        extraMax: 0.15, // Room for category image bullets
        renderer: yRenderer
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: t('kpi.tab.categories'),
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "amount",
        sequencedInterpolation: true,
        categoryXField: "categoryName",
        tooltip: am5.Tooltip.new(root, { 
          dy: -25, 
          labelText: `{valueY} ${currency}` 
        })
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 8,
      cornerRadiusTR: 8,
      strokeOpacity: 0,
      shadowColor: am5.color(0x000000),
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowOpacity: 0.15
    });

    // Color columns dynamically using theme palette
    series.columns.template.adapters.add("fill", (_fill, target) => {
      const colors = chart.get("colors");
      return colors ? colors.getIndex(series.columns.indexOf(target)) : undefined;
    });

    series.columns.template.adapters.add("stroke", (_stroke, target) => {
      const colors = chart.get("colors");
      return colors ? colors.getIndex(series.columns.indexOf(target)) : undefined;
    });

    // Prepare chart data with emojis inside SVG Data URIs
    const chartData = data.map((item, idx) => {
      const category = item.categoryName || "Divers";
      let emoji = "Divers";
      if (/aliment/i.test(category)) emoji = "🍏";
      else if (/transp/i.test(category)) emoji = "🚗";
      else if (/sant/i.test(category)) emoji = "🩺";
      else if (/loisir/i.test(category)) emoji = "🎮";
      else if (/educ/i.test(category) || /éduc/i.test(category)) emoji = "🎓";
      else if (/facture/i.test(category) || /abonn/i.test(category)) emoji = "📄";
      else if (/maison/i.test(category) || /entre/i.test(category) || /logement/i.test(category)) emoji = "🧹";
      else if (/vêt/i.test(category) || /vet/i.test(category) || /hab/i.test(category)) emoji = "👕";
      else if (/divers/i.test(category)) emoji = "Divers";
      else {
        const fallbacks = ["🍎", "🚙", "🏥", "🎬", "📚", "🧾", "🏡", "👞", "💼", "🎁"];
        emoji = fallbacks[idx % fallbacks.length];
      }

      if (emoji === "Divers") emoji = "📦";

      // Draw SVG Data URI (works perfectly offline)
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
        <text x="20" y="22" font-size="20" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      </svg>`;
      
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

      return {
        ...item,
        bulletSettings: {
          src: dataUri
        }
      };
    });

    // Add bullets (images on top)
    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Picture.new(root, {
          templateField: "bulletSettings",
          width: 40,
          height: 40,
          centerX: am5.p50,
          centerY: am5.p50,
          shadowColor: am5.color(0x000000),
          shadowBlur: 4,
          shadowOffsetX: 2,
          shadowOffsetY: 2,
          shadowOpacity: 0.4
        })
      });
    });

    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data, currency]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: "100%", 
        height: "380px", 
        marginTop: "1.5rem" 
      }} 
    />
  );
};

interface ProductHistoryChartProps {
  data: any[];
  currency: string;
}

const ProductHistoryChart: React.FC<ProductHistoryChartProps> = ({ data, currency }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Create root element
    const root = am5.Root.new(chartRef.current);

    // Set themes
    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 10
      })
    );

    // Add cursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // Prepare chart data
    const chartData = data.map(item => {
      const formattedDate = new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { 
        day: 'numeric', 
        month: 'short',
        timeZone: 'UTC'
      });
      return {
        ...item,
        label: `${formattedDate}\n(${item.storeName})`
      };
    });

    // Create axes
    const xRenderer = am5xy.AxisRendererX.new(root, { 
      minGridDistance: 30,
      minorGridEnabled: true
    });
    xRenderer.labels.template.setAll({
      fill: am5.color(0x94a3b8),
      fontSize: "0.75rem",
      fontWeight: "500"
    });
    xRenderer.grid.template.set("visible", false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "label",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
      })
    );
    xAxis.data.setAll(chartData);

    // Y-axis Left: Quantité (Column)
    const quantityAxisRenderer = am5xy.AxisRendererY.new(root, {});
    quantityAxisRenderer.labels.template.setAll({
      fill: am5.color(0x38bdf8),
      fontSize: "0.8rem",
      fontWeight: "600"
    });
    quantityAxisRenderer.grid.template.setAll({
      stroke: am5.color(0x334155),
      strokeOpacity: 0.15
    });

    const quantityAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: quantityAxisRenderer,
        extraMax: 0.1
      })
    );

    // Y-axis Right: Prix unitaire (Line)
    const priceAxisRenderer = am5xy.AxisRendererY.new(root, {
      opposite: true
    });
    priceAxisRenderer.labels.template.setAll({
      fill: am5.color(0x34d399),
      fontSize: "0.8rem",
      fontWeight: "600"
    });
    priceAxisRenderer.grid.template.set("forceHidden", true);

    const priceAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: priceAxisRenderer,
        extraMax: 0.1
      })
    );

    // Create Column Series for Quantities
    const quantitySeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: t('kpi.productDetail.qty_series'),
        xAxis: xAxis,
        yAxis: quantityAxis,
        valueYField: "quantity",
        categoryXField: "label",
        tooltip: am5.Tooltip.new(root, {
          labelText: `${t('kpi.productDetail.table.qty')} : {valueY} {unit}`
        })
      })
    );

    quantitySeries.columns.template.setAll({
      width: am5.percent(40),
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      strokeOpacity: 0,
      fill: am5.color(0x38bdf8),
      fillOpacity: 0.8
    });

    // Create Line Series for Unit Price
    const priceSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: t('kpi.productDetail.price_series'),
        xAxis: xAxis,
        yAxis: priceAxis,
        valueYField: "unitPrice",
        categoryXField: "label",
        tooltip: am5.Tooltip.new(root, {
          labelText: `${t('kpi.productDetail.price_axis')} : {valueY} ${currency}`
        })
      })
    );

    priceSeries.strokes.template.setAll({
      strokeWidth: 3,
      stroke: am5.color(0x34d399)
    });

    // Add square bullets
    priceSeries.bullets.push(() => {
      const rect = am5.Rectangle.new(root, {
        width: 10,
        height: 10,
        centerX: am5.p50,
        centerY: am5.p50,
        fill: am5.color(0x34d399),
        stroke: am5.color(0xffffff),
        strokeWidth: 2
      });

      return am5.Bullet.new(root, {
        sprite: rect
      });
    });

    // Set data
    quantitySeries.data.setAll(chartData);
    priceSeries.data.setAll(chartData);

    // Make stuff animate on load
    quantitySeries.appear(1000);
    priceSeries.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data, currency]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: "100%", 
        height: "380px", 
        marginTop: "1rem" 
      }} 
    />
  );
};

export const Kpis: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('evolution');

  // Store KPI states
  const [searchStoreKpi, setSearchStoreKpi] = useState('');
  const [currentStoreKpiPage, setCurrentStoreKpiPage] = useState(1);
  const [storeKpiPageSize, setStoreKpiPageSize] = useState(5);

  // Product Detail states
  const [searchProduct, setSearchProduct] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearched, setHistorySearched] = useState(false);

  // Fetch unique products list for suggestions
  useEffect(() => {
    if (activeSubTab === 'productDetail' && productSuggestions.length === 0) {
      const loadSuggestions = async () => {
        try {
          const list = await api.invoices.getUniqueProducts();
          setProductSuggestions(list);
        } catch (err) {
          console.error('Failed to load product suggestions:', err);
        }
      };
      loadSuggestions();
    }
  }, [activeSubTab, productSuggestions.length]);

  const handleProductSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchProduct) return;
    setHistoryLoading(true);
    setHistorySearched(true);
    try {
      const history = await api.analytics.getProductHistory(searchProduct);
      setHistoryData(history);
    } catch (err) {
      console.error('Failed to load product history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const stats = await api.analytics.getKpiDetails();
        setData(stats);
      } catch (err) {
        console.error('Failed to fetch KPI details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKpis();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem', color: 'hsl(var(--muted))' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
        <span>{t('kpi.loading')}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--card-border))', color: 'hsl(var(--muted))' }}>
        {t('kpi.error.load')}
      </div>
    );
  }

  const { evolutionStats, categoryStats, storeAnalysis, invoiceAnalysis, productAnalysis, taxAnalysis } = data;

  const subTabs = [
    { id: 'evolution', label: t('kpi.tab.evolution'), icon: <TrendingUp size={18} /> },
    { id: 'categories', label: t('kpi.tab.categories'), icon: <Tag size={18} /> },
    { id: 'stores', label: t('kpi.tab.stores'), icon: <Store size={18} /> },
    { id: 'invoices', label: t('kpi.tab.invoices'), icon: <Receipt size={18} /> },
    { id: 'products', label: t('kpi.tab.products'), icon: <ShoppingBag size={18} /> },
    { id: 'inflation', label: t('kpi.tab.inflation'), icon: <Percent size={18} /> },
    { id: 'taxes', label: t('kpi.tab.taxes'), icon: <DollarSign size={18} /> },
    { id: 'productDetail', label: t('kpi.tab.productDetail'), icon: <Search size={18} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('kpi.title')}</h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>{t('kpi.subtitle')}</p>
        </div>
      </div>

      {/* Internal Sub-Tabs Layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.5rem' }}>
        
        {/* Navigation Sidebar inside view */}
        <div style={{
          flex: '1 1 240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          backgroundColor: 'hsl(var(--card) / 0.5)',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--card-border))',
          alignSelf: 'flex-start'
        }}>
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.8)',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                {tab.icon}
                <span style={{ flex: 1, textAlign: 'left' }}>{tab.label}</span>
                <ChevronRight size={14} style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.2s' }} />
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: EVOLUTION & TENDANCES */}
          {activeSubTab === 'evolution' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>{t('kpi.spend.evolution.monthly')}</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.spend.this_month')}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                      {evolutionStats.thisMonthSpent.toFixed(2)} {user?.currency || '$'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.spend.prev_month')}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>
                      {evolutionStats.lastMonthSpent.toFixed(2)} {user?.currency || '$'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.spend.monthly_trend')}</div>
                    <div style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: 700, 
                      color: evolutionStats.variation > 0 ? 'hsl(var(--destructive))' : evolutionStats.variation < 0 ? 'hsl(var(--success))' : 'white',
                      marginTop: '0.2rem'
                    }}>
                      {evolutionStats.variation > 0 ? `+${evolutionStats.variation}` : evolutionStats.variation}%
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--card-border))' }}>
                  {t('kpi.spend.max_month')} {language === 'fr' ? 'observé' : 'observed'} : <strong>{evolutionStats.mostExpensiveMonth.month}</strong> ({evolutionStats.mostExpensiveMonth.amount.toFixed(2)} {user?.currency || '$'})
                </div>
              </div>

              {/* Tendance 12 mois */}
              <div className="stat-card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('kpi.tab.evolution')}</h2>
                <TrendChart data={evolutionStats.trend12Months} currency={user?.currency || '$'} />
              </div>
            </div>
          )}

          {/* TAB 2: POSTES DE DEPENSE (CATEGORIES) */}
          {activeSubTab === 'categories' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="stat-card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('dash.category.breakdown')}</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="stat-card" style={{ padding: '1rem', backgroundColor: 'hsl(var(--card-border) / 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.categories.most_costly')}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                      {categoryStats.mostExpensive}
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '1rem', backgroundColor: 'hsl(var(--card-border) / 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.spend.categories')}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                      {categoryStats.totalSpent.toFixed(2)} {user?.currency || '$'}
                    </div>
                  </div>
                </div>

                <CategoryChart data={categoryStats.breakdown} currency={user?.currency || '$'} />
              </div>

              <div className="stat-card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>{t('dash.overview')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {categoryStats.breakdown.map((cat: any, idx: number) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 500 }}>{cat.categoryName}</span>
                        <span style={{ color: 'hsl(var(--muted))' }}>
                          {cat.amount.toFixed(2)} {user?.currency || '$'} ({cat.percentage}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'hsl(var(--muted-dark) / 0.4)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${cat.percentage}%`,
                          height: '100%',
                          backgroundColor: `hsl(208 95% ${Math.max(30, 75 - idx * 8)}%)`,
                          borderRadius: 'var(--radius-full)',
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANALYSE DES MAGASINS */}
          {activeSubTab === 'stores' && (() => {
            const filteredKpiStores = storeAnalysis.stores.filter((s: any) =>
              s.storeName.toLowerCase().includes(searchStoreKpi.toLowerCase())
            );
            const totalKpiStorePages = Math.ceil(filteredKpiStores.length / storeKpiPageSize);
            const paginatedKpiStores = filteredKpiStores.slice(
              (currentStoreKpiPage - 1) * storeKpiPageSize,
              currentStoreKpiPage * storeKpiPageSize
            );

            return (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="stat-card">
                    <div className="stat-title">{t('kpi.store.frequent')}</div>
                    <div className="stat-value" style={{ fontSize: '1.3rem', marginTop: '0.2rem' }}>{storeAnalysis.mostVisited}</div>
                    <div className="stat-footer">{language === 'fr' ? 'Visité le plus de fois' : 'Visited the most times'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">{t('kpi.store.most_expensive')}</div>
                    <div className="stat-value" style={{ fontSize: '1.3rem', marginTop: '0.2rem', color: 'hsl(var(--destructive))' }}>{storeAnalysis.mostExpensive}</div>
                    <div className="stat-footer">{language === 'fr' ? 'Ticket moyen le plus élevé' : 'Highest average ticket'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title">{t('kpi.store.cheapest')}</div>
                    <div className="stat-value" style={{ fontSize: '1.3rem', marginTop: '0.2rem', color: 'hsl(var(--success))' }}>{storeAnalysis.cheapest}</div>
                    <div className="stat-footer">{language === 'fr' ? 'Ticket moyen le plus bas' : 'Lowest average ticket'}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{t('kpi.store.history')}</h2>
                    
                    {/* Search Bar for Table */}
                    <div style={{ position: 'relative', width: '260px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t('store.filter.search_placeholder')}
                        value={searchStoreKpi}
                        onChange={(e) => {
                          setSearchStoreKpi(e.target.value);
                          setCurrentStoreKpiPage(1);
                        }}
                        style={{
                          paddingLeft: '2.2rem',
                          height: '34px',
                          fontSize: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--card-border))',
                          color: 'white'
                        }}
                      />
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'hsl(var(--muted))'
                        }}
                      />
                      {searchStoreKpi && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchStoreKpi('');
                            setCurrentStoreKpiPage(1);
                          }}
                          className="btn btn-ghost"
                          style={{
                            position: 'absolute',
                            right: '0.4rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '0.2rem',
                            color: 'hsl(var(--muted))',
                            height: 'auto',
                            borderRadius: '50%'
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    {filteredKpiStores.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
                        {t('store.no_match')}
                      </div>
                    ) : (
                      <>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>{t('kpi.store.col.store')}</th>
                              <th style={{ textAlign: 'center' }}>{t('kpi.store.col.visits')}</th>
                              <th style={{ textAlign: 'right' }}>{t('kpi.store.col.avg')}</th>
                              <th style={{ textAlign: 'right' }}>{t('kpi.store.col.total')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedKpiStores.map((s: any, idx: number) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600 }}>{s.storeName}</td>
                                <td style={{ textAlign: 'center' }}>{s.visitCount}</td>
                                <td style={{ textAlign: 'right', fontWeight: 500 }}>{s.averageTicket.toFixed(2)} {user?.currency || '$'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{s.totalSpent.toFixed(2)} {user?.currency || '$'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination for Store KPI Table */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid hsl(var(--card-border) / 0.5)', paddingTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                            <span>{t('pag.show')}</span>
                            <select 
                              value={storeKpiPageSize} 
                              onChange={(e) => {
                                setStoreKpiPageSize(Number(e.target.value));
                                setCurrentStoreKpiPage(1);
                              }}
                              className="form-control"
                              style={{ width: '65px', padding: '0.2rem 0.4rem', height: 'auto', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', color: 'white', fontSize: '0.8rem' }}
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                            </select>
                            <span>{t('pag.lines_per_page')}</span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                            {t('pag.display_stores')
                              .replace('{start}', (filteredKpiStores.length > 0 ? (currentStoreKpiPage - 1) * storeKpiPageSize + 1 : 0).toString())
                              .replace('{end}', Math.min(currentStoreKpiPage * storeKpiPageSize, filteredKpiStores.length).toString())
                              .replace('{total}', filteredKpiStores.length.toString())}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-ghost" 
                              disabled={currentStoreKpiPage === 1}
                              onClick={() => setCurrentStoreKpiPage(currentStoreKpiPage - 1)}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              {t('pag.prev')}
                            </button>
                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                              {t('pag.page_of').replace('{current}', currentStoreKpiPage.toString()).replace('{total}', (totalKpiStorePages || 1).toString())}
                            </span>
                            <button 
                              className="btn btn-ghost" 
                              disabled={currentStoreKpiPage === totalKpiStorePages || totalKpiStorePages === 0}
                              onClick={() => setCurrentStoreKpiPage(currentStoreKpiPage + 1)}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              {t('pag.next')}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: ANALYSE DES FACTURES */}
          {activeSubTab === 'invoices' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-title">{t('kpi.invoice.total')}</div>
                  <div className="stat-value">{invoiceAnalysis.totalCount}</div>
                  <div className="stat-footer">{t('dash.kpi.cumulative.footer')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">{t('kpi.invoice.average')}</div>
                  <div className="stat-value">{invoiceAnalysis.averageAmount.toFixed(2)} {user?.currency || '$'}</div>
                  <div className="stat-footer">{language === 'fr' ? 'Par facture' : 'Per invoice'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">{t('kpi.invoice.max')}</div>
                  <div className="stat-value" style={{ color: 'hsl(var(--destructive))' }}>{invoiceAnalysis.largest.toFixed(2)} {user?.currency || '$'}</div>
                  <div className="stat-footer">{t('kpi.invoice.max')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">{t('kpi.invoice.min')}</div>
                  <div className="stat-value" style={{ color: 'hsl(var(--success))' }}>{invoiceAnalysis.smallest.toFixed(2)} {user?.currency || '$'}</div>
                  <div className="stat-footer">{t('kpi.invoice.min')}</div>
                </div>
              </div>

              {/* Invoices by month */}
              <div className="stat-card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('kpi.invoice.monthly_dist')}</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {invoiceAnalysis.monthlyCountTrend.map((m: any, idx: number) => {
                    const maxCount = Math.max(...invoiceAnalysis.monthlyCountTrend.map((x: any) => x.count)) || 1;
                    const pct = (m.count / maxCount) * 100;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '70px', fontSize: '0.8rem', color: 'hsl(var(--muted))', textTransform: 'capitalize' }}>
                          {m.label}
                        </div>
                        <div style={{ flex: 1, height: '14px', backgroundColor: 'hsl(var(--muted-dark) / 0.4)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${pct}%`, 
                            height: '100%', 
                            backgroundColor: 'hsl(var(--primary) / 0.7)',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <div style={{ width: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>
                          {m.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ARTICLES & TARIFS */}
          {activeSubTab === 'products' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="stat-card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('kpi.product.stats')}</h2>
                
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('kpi.product.col.name')}</th>
                        <th style={{ textAlign: 'center' }}>{t('cons.frequent.col.qty')}</th>
                        <th style={{ textAlign: 'right' }}>{t('kpi.product.col.avg')}</th>
                        <th style={{ textAlign: 'right' }}>{t('kpi.product.col.last')}</th>
                        <th style={{ textAlign: 'right' }}>{t('kpi.product.col.min')}</th>
                        <th style={{ textAlign: 'right' }}>{t('kpi.product.col.max')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productAnalysis.topProducts.map((p: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.productName}</td>
                          <td style={{ textAlign: 'center' }}>{p.totalQty}</td>
                          <td style={{ textAlign: 'right' }}>{p.avgPrice.toFixed(2)} {user?.currency || '$'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 500 }}>{p.latestPrice.toFixed(2)} {user?.currency || '$'}</td>
                          <td style={{ textAlign: 'right', color: 'hsl(var(--success))' }}>{p.minPrice.toFixed(2)} {user?.currency || '$'}</td>
                          <td style={{ textAlign: 'right', color: 'hsl(var(--destructive))' }}>{p.maxPrice.toFixed(2)} {user?.currency || '$'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: INFLATION & EVOLUTION DES PRIX */}
          {activeSubTab === 'inflation' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid hsl(var(--warning))' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('kpi.inflation.evolution')}</h2>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                  {productAnalysis.priceEvolution.basketInflation > 0 ? `+${productAnalysis.priceEvolution.basketInflation}` : productAnalysis.priceEvolution.basketInflation}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))', marginTop: '0.25rem' }}>
                  {t('kpi.inflation.desc')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* Plus fortes hausses */}
                <div className="stat-card">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'hsl(var(--destructive))', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={16} />
                    {t('kpi.inflation.rises')}
                  </h3>
                  {productAnalysis.priceEvolution.increases.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', padding: '1rem 0' }}>{language === 'fr' ? 'Aucune hausse observée.' : 'No increases observed.'}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {productAnalysis.priceEvolution.increases.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid hsl(var(--card-border) / 0.3)' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{item.productName}</span>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.1rem' }}>
                              Initial : {item.firstPrice.toFixed(2)} {user?.currency || '$'} → {language === 'fr' ? 'Actuel' : 'Current'} : {item.latestPrice.toFixed(2)} {user?.currency || '$'}
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: 'hsl(var(--destructive))' }}>+{item.percentageChange}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plus fortes baisses */}
                <div className="stat-card">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'hsl(var(--success))', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingDown size={16} />
                    {t('kpi.inflation.drops')}
                  </h3>
                  {productAnalysis.priceEvolution.decreases.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', padding: '1rem 0' }}>{language === 'fr' ? 'Aucune baisse observée.' : 'No decreases observed.'}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {productAnalysis.priceEvolution.decreases.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid hsl(var(--card-border) / 0.3)' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{item.productName}</span>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.1rem' }}>
                              Initial : {item.firstPrice.toFixed(2)} {user?.currency || '$'} → {language === 'fr' ? 'Actuel' : 'Current'} : {item.latestPrice.toFixed(2)} {user?.currency || '$'}
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: 'hsl(var(--success))' }}>{item.percentageChange}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: TVA & TAXES */}
          {activeSubTab === 'taxes' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-title">{t('kpi.taxes.total')}</div>
                  <div className="stat-value">{taxAnalysis.totalTaxesPaid.toFixed(2)} {user?.currency || '$'}</div>
                  <div className="stat-footer">{t('dash.kpi.cumulative.footer')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">{t('kpi.taxes.share')}</div>
                  <div className="stat-value">{taxAnalysis.taxPercentage}%</div>
                  <div className="stat-footer">{t('dash.kpi.cumulative.footer')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* Taxes par catégorie */}
                <div className="stat-card">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>{t('kpi.taxes.by_category')}</h3>
                  {taxAnalysis.byCategory.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', padding: '1rem 0' }}>{language === 'fr' ? 'Aucune taxe.' : 'No taxes.'}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {taxAnalysis.byCategory.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid hsl(var(--card-border) / 0.3)' }}>
                          <span style={{ fontWeight: 500 }}>{item.category}</span>
                          <span style={{ fontWeight: 600 }}>{item.amount.toFixed(2)} {user?.currency || '$'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Taxes par magasin */}
                <div className="stat-card">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>{t('kpi.taxes.by_store')}</h3>
                  {taxAnalysis.byStore.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', padding: '1rem 0' }}>{language === 'fr' ? 'Aucune taxe.' : 'No taxes.'}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {taxAnalysis.byStore.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid hsl(var(--card-border) / 0.3)' }}>
                          <span style={{ fontWeight: 500 }}>{item.storeName}</span>
                          <span style={{ fontWeight: 600 }}>{item.amount.toFixed(2)} {user?.currency || '$'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
          {/* TAB 8: SUIVI PAR ARTICLE */}
          {activeSubTab === 'productDetail' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="stat-card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('kpi.productDetail.title')}</h2>
                
                {/* Search Bar inside tab */}
                <form onSubmit={handleProductSearch} style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  maxWidth: '500px',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ color: 'hsl(var(--muted))', position: 'absolute', left: '0.75rem', zIndex: 5 }} />
                    <Autocomplete
                      value={searchProduct}
                      onChange={setSearchProduct}
                      suggestions={productSuggestions.map((p: any) => p.productName)}
                      placeholder={t('kpi.productDetail.search')}
                      required
                      inputStyle={{ paddingLeft: '2.5rem', paddingRight: searchProduct ? '3.5rem' : '2.5rem' }}
                    />
                    {searchProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchProduct('');
                          setHistoryData([]);
                          setHistorySearched(false);
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
                          zIndex: 5
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary">{t('comp.btn.search')}</button>
                </form>

                {historyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'hsl(var(--muted))' }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--primary))' }} />
                    <span style={{ marginLeft: '0.5rem' }}>{language === 'fr' ? 'Chargement de l\'historique...' : 'Loading history...'}</span>
                  </div>
                ) : !historySearched ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))', border: '1px dashed hsl(var(--card-border))', borderRadius: 'var(--radius-md)' }}>
                    {t('kpi.productDetail.placeholder')}
                  </div>
                ) : historyData.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))', border: '1px dashed hsl(var(--card-border))', borderRadius: 'var(--radius-md)' }}>
                    {t('kpi.productDetail.no_data')}
                  </div>
                ) : (
                  <div>
                    {/* Key Stats for the selected product */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="stat-card" style={{ padding: '1rem', backgroundColor: 'hsl(var(--card-border) / 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.productDetail.purchases_count')}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                          {historyData.length} (20 max)
                        </div>
                      </div>
                      <div className="stat-card" style={{ padding: '1rem', backgroundColor: 'hsl(var(--card-border) / 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.productDetail.qty_purchased')}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                          {historyData.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)} {historyData[0]?.unit || (language === 'fr' ? 'unité(s)' : 'unit(s)')}
                        </div>
                      </div>
                      <div className="stat-card" style={{ padding: '1rem', backgroundColor: 'hsl(var(--card-border) / 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{t('kpi.productDetail.avg_price')}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                          {(historyData.reduce((sum, item) => sum + item.unitPrice, 0) / historyData.length).toFixed(2)} {user?.currency || '$'}
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'hsl(var(--primary))', marginBottom: '1rem' }}>
                      {t('kpi.productDetail.recent_purchases').replace('{product}', searchProduct)}
                    </h3>
                    <ProductHistoryChart data={historyData} currency={user?.currency || '$'} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datalist for KPI product autocompletion */}
          <datalist id="kpis-products-datalist">
            {productSuggestions.map((p: any, idx: number) => (
              <option key={idx} value={p.productName} />
            ))}
          </datalist>

        </div>
      </div>
    </div>
  );
};
