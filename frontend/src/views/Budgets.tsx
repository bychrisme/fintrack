import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { DollarSign, Trash, AlertTriangle, Lightbulb, ClipboardList } from 'lucide-react';

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [budgetReports, setBudgetReports] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [consumption, setConsumption] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const fetchBudgetReports = async () => {
    try {
      const reports = await api.budgets.getReports(month, year);
      setBudgetReports(reports);
    } catch (err) {
      console.error('Failed to fetch budget reports:', err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const cats = await api.categories.findAllFlat();
      const cons = await api.analytics.getConsumption();
      setCategories(cats);
      setConsumption(cons);
      if (cats.length > 0) setCategoryId(cats[0].id);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBudgetReports(), fetchMetadata()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBudgetReports();
  }, [month, year]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      await api.budgets.create({
        amount: parseFloat(amount),
        month,
        year,
        categoryId: categoryId || undefined,
      });
      setAmount('');
      fetchBudgetReports();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer ce budget ?')) return;
    try {
      await api.budgets.delete(id);
      fetchBudgetReports();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // Generate Smart Shopping List
  // We scan frequent products. If last purchase date was more than 7 days ago, suggest adding it.
  const generateSmartShoppingList = () => {
    if (!consumption) return [];
    
    const list: any[] = [];
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    consumption.topFrequent.forEach((p: any) => {
      const lastDateMs = new Date(p.lastDate).getTime();
      const diffMs = now - lastDateMs;
      
      if (diffMs > sevenDaysMs) {
        const daysAgo = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        list.push({
          name: p.name,
          reason: `Achat suggéré (Dernier achat il y a ${daysAgo} jours. Habituellement acheté tous les 7 jours)`,
          unit: p.unit,
        });
      }
    });

    return list;
  };

  const shoppingList = generateSmartShoppingList();

  return (
    <div className="animate-fade-in">
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Enveloppes Budgétaires</h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>Définissez des limites de dépenses par catégorie et suivez leur respect.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Budgets Tracker */}
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Suivi des Budgets</h2>
            
            {/* Period Selector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="form-control" style={{ padding: '0.4rem 0.75rem' }} value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('fr', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select className="form-control" style={{ padding: '0.4rem 0.75rem' }} value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted))' }}>Mise à jour...</div>
          ) : budgetReports.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))', fontStyle: 'italic' }}>
              Aucun budget défini pour cette période. Utilisez le formulaire ci-contre pour en ajouter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {budgetReports.map((report) => {
                const color = report.category ? report.category.color : 'hsl(var(--primary))';
                const catName = report.category ? report.category.name : 'Budget Global';
                const percent = Math.min(report.percentage, 100);
                
                return (
                  <div key={report.id} style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--card-border))',
                    backgroundColor: 'hsl(var(--muted-dark) / 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }}></span>
                        <span style={{ fontWeight: 600 }}>{catName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: report.isExceeded ? 'hsl(var(--destructive))' : 'hsl(var(--muted))' }}>
                          {report.spent.toFixed(2)} {user?.currency || '$'} / {report.amount.toFixed(2)} {user?.currency || '$'}
                        </span>
                        {user?.role === 'ADMIN' && (
                          <button onClick={() => handleDeleteBudget(report.id)} className="btn btn-ghost" style={{ padding: '0.2rem', color: 'hsl(var(--destructive))' }}>
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'hsl(var(--muted-dark))', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.4rem' }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        backgroundColor: report.isExceeded ? 'hsl(var(--destructive))' : report.isWarning ? 'hsl(var(--warning))' : color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'hsl(var(--muted))' }}>{report.percentage.toFixed(0)}% utilisé</span>
                      {report.isExceeded && (
                        <span style={{ color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                          <AlertTriangle size={12} />
                          Dépassement de {(report.spent - report.amount).toFixed(2)} {user?.currency || '$'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget Creation Form */}
        <div className="stat-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} />
            Définir une limite
          </h2>
          <form onSubmit={handleCreateBudget}>
            <div className="form-group">
              <label>Montant du budget ({user?.currency || '$'})</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Ex: 400.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Catégorie</label>
              <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Budget Global (Toutes dépenses)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Enregistrer le budget
            </button>
          </form>
        </div>

        {/* Smart Shopping List */}
        <div className="stat-card" style={{ gridColumn: 'span 3' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={20} style={{ color: 'hsl(var(--primary))' }} />
            Liste d'Achats Intelligente
          </h2>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Le système suggère automatiquement des articles à votre liste selon vos fréquences et cycles d'achat habituels.
          </p>

          {shoppingList.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: 'hsl(var(--muted-dark) / 0.1)',
              border: '1px dashed hsl(var(--card-border))',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              color: 'hsl(var(--muted))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Lightbulb size={24} style={{ color: 'hsl(var(--warning))' }} />
              Votre garde-manger semble complet ! Aucune suggestion automatique requise pour aujourd'hui.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {shoppingList.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--card-border))',
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <input type="checkbox" style={{ marginTop: '0.2rem', cursor: 'pointer' }} />
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{item.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', marginTop: '0.25rem', lineHeight: 1.3 }}>{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
