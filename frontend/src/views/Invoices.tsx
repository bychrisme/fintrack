import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Search, Plus, FileSpreadsheet, Printer, Trash, Upload, Sparkles, ArrowLeft, Calendar, Store, CreditCard, MessageSquare, Tag, Edit, Loader2 } from 'lucide-react';

export const Invoices: React.FC<{ initialView?: 'list' | 'add' | 'detail' }> = ({ initialView }) => {
  const { user } = useAuth();
  
  // Tabbed sub-view state: 'list' | 'add' | 'detail'
  const [view, setView] = useState<'list' | 'add' | 'detail'>(initialView || 'list');

  useEffect(() => {
    if (initialView) {
      setView(initialView);
    }
  }, [initialView]);
  
  // Data lists
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [uniqueProducts, setUniqueProducts] = useState<any[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');

  // Selected invoice for detail view
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form state for creating invoice
  const [ocrLoading, setOcrLoading] = useState(false);
  const [rawStoreName, setRawStoreName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState(user?.defaultPaymentMode || 'DEBIT_CARD');
  const [formStoreId, setFormStoreId] = useState('');
  const [comments, setComments] = useState('');
  const [globalDiscounts, setGlobalDiscounts] = useState(0);
  const [items, setItems] = useState<any[]>([
    { productName: '', categoryId: '', quantity: 1, unit: 'UNIT', unitPrice: 0, totalPrice: 0, taxRate: 0, discount: 0, brand: '', barcode: '' }
  ]);

  const fetchInvoices = async () => {
    try {
      const data = await api.invoices.findAll({
        search,
        storeId,
        categoryId,
        startDate,
        endDate,
        paymentMode,
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const storesData = await api.stores.findAll();
      const categoriesData = await api.categories.findAllFlat();
      setStores(storesData);
      setCategories(categoriesData);
      if (storesData.length > 0) setFormStoreId(storesData[0].id);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
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
    setLoading(true);
    Promise.all([fetchInvoices(), fetchMetadata(), fetchUniqueProducts()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (view === 'list') {
      fetchInvoices();
    }
  }, [search, storeId, categoryId, startDate, endDate, paymentMode, view]);

  // Handle CSV Export
  const handleExportCSV = async () => {
    try {
      const csv = await api.reports.exportCSV('expenses');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fintrack-expenses-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erreur lors de l\'exportation CSV');
    }
  };

  // OCR scanner action
  const handleOCR = async (imageBase64: string | null, mockFileName?: string) => {
    setOcrLoading(true);
    setLoading(true);
    try {
      let ocrResult;
      if (mockFileName) {
        ocrResult = await api.invoices.ocr('', mockFileName);
      } else if (imageBase64) {
        ocrResult = await api.invoices.ocr(imageBase64);
      } else {
        return;
      }
      setInvoiceNumber(ocrResult.invoiceNumber);
      setDate(ocrResult.date);
      setFormPaymentMode(ocrResult.paymentMode);
      setFormStoreId(ocrResult.storeId);
      setComments(ocrResult.comments);
      setRawStoreName(ocrResult.rawStoreName || '');
      setGlobalDiscounts(ocrResult.globalDiscounts || 0);

      const mappedItems = ocrResult.items.map((item: any) => ({
        productName: item.productName,
        rawName: item.rawName || item.productName,
        categoryId: item.categoryId || (categories.length > 0 ? categories[0].id : ''),
        quantity: item.quantity || 1,
        unit: item.unit || 'UNIT',
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || parseFloat(((item.quantity || 1) * (item.unitPrice || 0)).toFixed(4)),
        taxRate: item.taxRate || 0,
        discount: item.discount || 0,
        brand: item.brand || '',
        barcode: item.barcode || '',
      }));
      setItems(mappedItems);
    } catch (err: any) {
      alert(err.message || 'La lecture du reçu a échoué');
    } finally {
      setOcrLoading(false);
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleOCR(base64);
    };
    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
  };

  // Add item row
  const addItemRow = () => {
    const defaultCat = categories.length > 0 ? categories[0].id : '';
    setItems([
      ...items,
      { productName: '', categoryId: defaultCat, quantity: 1, unit: 'UNIT', unitPrice: 0, totalPrice: 0, taxRate: 0, discount: 0, brand: '', barcode: '' }
    ]);
  };

  // Remove item row
  const removeItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Update item field with reciprocal calculation
  const updateItemField = (idx: number, field: string, value: any) => {
    const updated = [...items];
    updated[idx][field] = value;
    
    if (field === 'quantity') {
      const q = parseFloat(value) || 0;
      updated[idx].totalPrice = parseFloat((q * (updated[idx].unitPrice || 0)).toFixed(4));
    } else if (field === 'unitPrice') {
      const p = parseFloat(value) || 0;
      const q = parseFloat(updated[idx].quantity) || 0;
      updated[idx].totalPrice = parseFloat((q * p).toFixed(4));
    } else if (field === 'totalPrice') {
      const t = parseFloat(value) || 0;
      const q = parseFloat(updated[idx].quantity) || 0;
      if (q > 0) {
        updated[idx].unitPrice = parseFloat((t / q).toFixed(4));
      } else {
        updated[idx].unitPrice = 0;
      }
    }
    
    setItems(updated);
  };

  // Calculate live totals for the form
  const calculateFormTotals = () => {
    let subtotal = 0;
    let taxes = 0;
    let discounts = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const tax = parseFloat(item.taxRate) || 0;
      const disc = parseFloat(item.discount) || 0;

      const totalItem = qty * price;
      subtotal += totalItem;
      discounts += disc;
      taxes += (totalItem - disc) * (tax / 100);
    });

    const total = subtotal - discounts + taxes - (parseFloat(globalDiscounts as any) || 0);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discounts: parseFloat(discounts.toFixed(2)),
      taxes: parseFloat(taxes.toFixed(2)),
      globalDiscounts: parseFloat((parseFloat(globalDiscounts as any) || 0).toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  };

  const formTotals = calculateFormTotals();

  // Handle invoice submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStoreId) {
      alert('Veuillez sélectionner un magasin');
      return;
    }

    const cleanedItems = items.map(item => ({
      productName: item.productName,
      rawName: item.rawName,
      categoryId: item.categoryId || categories[0].id,
      quantity: parseFloat(item.quantity) || 1,
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice) || 0,
      taxRate: parseFloat(item.taxRate) || 0,
      discount: parseFloat(item.discount) || 0,
      brand: item.brand,
      barcode: item.barcode,
    }));

    try {
      if (editingInvoice) {
        await api.invoices.update(editingInvoice.id, {
          invoiceNumber,
          date,
          paymentMode: formPaymentMode,
          storeId: formStoreId,
          comments,
          items: cleanedItems,
          rawStoreName,
          globalDiscounts: parseFloat(globalDiscounts as any) || 0,
        });
      } else {
        await api.invoices.create({
          invoiceNumber,
          date,
          paymentMode: formPaymentMode,
          storeId: formStoreId,
          comments,
          items: cleanedItems,
          rawStoreName,
          globalDiscounts: parseFloat(globalDiscounts as any) || 0,
        });
      }

      // Reset form & transition back to list
      setInvoiceNumber('');
      setDate(new Date().toISOString().split('T')[0]);
      setItems([{ productName: '', categoryId: '', quantity: 1, unit: 'UNIT', unitPrice: 0, taxRate: 0, discount: 0, brand: '', barcode: '' }]);
      setComments('');
      setRawStoreName('');
      setGlobalDiscounts(0);
      setEditingInvoice(null);
      setView('list');
      fetchUniqueProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement de la facture');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cette facture et tous ses articles ?')) return;
    try {
      await api.invoices.delete(id);
      setView('list');
      fetchInvoices();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const openAddPage = () => {
    if (categories.length > 0 && items[0].categoryId === '') {
      const updated = [...items];
      updated[0].categoryId = categories[0].id;
      setItems(updated);
    }
    setFormPaymentMode(user?.defaultPaymentMode || 'DEBIT_CARD');
    setGlobalDiscounts(0);
    setView('add');
  };

  const openDetailPage = (inv: any) => {
    setSelectedInvoice(inv);
    setView('detail');
  };

  const handleSelectInvoice = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map(inv => inv.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Voulez-vous supprimer les ${selectedIds.length} factures sélectionnées ?`)) return;
    try {
      await api.invoices.bulkDelete(selectedIds);
      setSelectedIds([]);
      fetchInvoices();
    } catch (err) {
      alert('Erreur lors de la suppression groupée');
    }
  };

  const openEditPage = (inv: any) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoiceNumber);
    setDate(new Date(inv.date).toISOString().split('T')[0]);
    setFormPaymentMode(inv.paymentMode);
    setFormStoreId(inv.storeId);
    setComments(inv.comments || '');
    setGlobalDiscounts(inv.globalDiscounts || 0);
    
    const mappedItems = inv.items.map((item: any) => ({
      productName: item.productName,
      categoryId: item.categoryId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice || parseFloat((item.quantity * item.unitPrice).toFixed(4)),
      taxRate: item.taxRate,
      discount: item.discount,
      brand: item.brand || '',
      barcode: item.barcode || '',
    }));
    setItems(mappedItems);
    setView('add');
  };

  if (view === 'list') {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);
    const totalPages = Math.ceil(invoices.length / pageSize);

    return (
      <div className="animate-fade-in">
        <div className="flex-header">
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Factures & Achats</h1>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>Consultez, filtrez et importez vos factures d'achat.</p>
          </div>
          <div className="flex-header-actions">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn btn-danger">
                <Trash size={16} />
                Supprimer ({selectedIds.length})
              </button>
            )}
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} />
              Imprimer PDF
            </button>
            <button onClick={openAddPage} className="btn btn-primary">
              <Plus size={16} />
              Ajouter une facture
            </button>
          </div>
        </div>

        {/* Filter toolbar */}
        <div className="glass" style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--card-border))',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <Search size={18} style={{ color: 'hsl(var(--muted))' }} />
            <input
              type="text"
              placeholder="Rechercher produit, facture, commentaire..."
              className="form-control"
              style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.2rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-control" style={{ padding: '0.5rem 0.75rem' }} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">Tous les Magasins</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select className="form-control" style={{ padding: '0.5rem 0.75rem' }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Toutes les Catégories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="form-control" style={{ padding: '0.5rem 0.75rem' }} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="">Modes de paiement</option>
              <option value="CASH">Espèces</option>
              <option value="DEBIT_CARD">Carte Débit</option>
              <option value="CREDIT_CARD">Carte Crédit</option>
              <option value="WIRE_TRANSFER">Virement</option>
              <option value="OTHER">Autre</option>
            </select>

            <input
              type="date"
              className="form-control"
              style={{ padding: '0.5rem 0.75rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>à</span>
            <input
              type="date"
              className="form-control"
              style={{ padding: '0.5rem 0.75rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Invoices Grid/Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>Mise à jour de la liste...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--card-border))', color: 'hsl(var(--muted))' }}>
            Aucune facture ne correspond à ces critères.
          </div>
        ) : (
          <div className="table-container animate-fade-in">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', paddingRight: 0 }}>
                    <input
                      type="checkbox"
                      checked={invoices.length > 0 && selectedIds.length === invoices.length}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </th>
                  <th>Date</th>
                  <th>Numéro</th>
                  <th>Magasin</th>
                  <th>Mode</th>
                  <th>Articles</th>
                  <th>Taxes</th>
                  <th>Total</th>
                  {user?.role === 'ADMIN' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv: any) => (
                  <tr key={inv.id} onClick={() => openDetailPage(inv)} style={{ cursor: 'pointer' }}>
                    <td style={{ width: '40px', paddingRight: 0 }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleSelectInvoice(inv.id)}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </td>
                    <td>{new Date(inv.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td>{inv.store.name}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        backgroundColor: 'hsl(var(--secondary))',
                        color: 'hsl(var(--muted))'
                      }}>{inv.paymentMode}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {inv.items.map((item: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.8rem', color: 'hsl(var(--foreground))' }}>
                            • {item.productName} ({item.quantity} {item.unit.toLowerCase()}) - <span style={{ color: 'hsl(var(--muted))' }}>{item.netPrice} {user?.currency || '$'}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{inv.totalTaxes.toFixed(2)} {user?.currency || '$'}</td>
                    <td style={{ fontWeight: 600 }}>{inv.totalAmount.toFixed(2)} {user?.currency || '$'}</td>
                    {user?.role === 'ADMIN' && (
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'hsl(var(--destructive))' }}>
                          <Trash size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderTop: '1px solid hsl(var(--card-border))',
              backgroundColor: 'hsl(var(--card) / 0.5)',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                <span>Afficher</span>
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
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>lignes par page</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                Affichage de {invoices.length > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, invoices.length)} sur {invoices.length} factures
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Précédent
                </button>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', padding: '0 0.5rem' }}>
                  Page {currentPage} sur {totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER VIEW: SEPARATE ADD PAGE
  // ==========================================
  if (view === 'add') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Header toolbar */}
        <div className="flex-header" style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => { setView('list'); setEditingInvoice(null); }} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{editingInvoice ? 'Modifier la Facture' : 'Nouvelle Facture d\'Achat'}</h1>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
              {editingInvoice ? 'Modifiez les détails et les articles de cette facture d\'achat.' : 'Saisissez manuellement vos dépenses ou utilisez l\'assistant OCR.'}
            </p>
          </div>
        </div>

        {/* Layout */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Simulated OCR Scanner Banner */}
          {!editingInvoice && (
            <div className="glass" style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed hsl(var(--primary) / 0.4)',
              backgroundColor: 'hsl(var(--primary) / 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  {ocrLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Sparkles size={20} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {ocrLoading ? 'Analyse du reçu par OCR...' : 'Remplissage magique par reçu photo (OCR)'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
                    {ocrLoading 
                      ? 'Extraction des articles, taxes, magasin et date du reçu en cours...' 
                      : 'Téléversez une photo de votre reçu pour pré-remplir instantanément la facture.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label 
                  className={`btn btn-primary ${ocrLoading ? 'disabled' : ''}`} 
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.8rem', 
                    cursor: ocrLoading ? 'not-allowed' : 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.35rem', 
                    margin: 0,
                    opacity: ocrLoading ? 0.7 : 1
                  }}
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Importer un reçu
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={ocrLoading}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Section 1: Informations Générales */}
          <div className="stat-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              Détails de l'achat
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Numéro de facture *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: WMT-7654"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Date d'achat *</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Magasin *</label>
                <select className="form-control" value={formStoreId} onChange={(e) => setFormStoreId(e.target.value)} required>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mode de paiement *</label>
                <select className="form-control" value={formPaymentMode} onChange={(e) => setFormPaymentMode(e.target.value)} required>
                  <option value="DEBIT_CARD">Carte Débit</option>
                  <option value="CREDIT_CARD">Carte Crédit</option>
                  <option value="CASH">Espèces</option>
                  <option value="WIRE_TRANSFER">Virement</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Rabais global / Fidélité</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="Ex: 10.00"
                  value={globalDiscounts || ''}
                  onChange={(e) => setGlobalDiscounts(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Commentaires / Notes (facultatif)</label>
              <textarea
                className="form-control"
                placeholder="Notes de la facture..."
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Section 2: Articles Achetés */}
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Articles achetés</h2>
              <button type="button" onClick={addItemRow} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                + Ajouter une ligne
              </button>
            </div>

            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '1.5rem' }}>
              <div style={{ minWidth: '1150px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Header aligned with row inputs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1.3fr 0.8fr 1fr 1.1fr 1.1fr 0.8fr 0.8fr 40px',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'hsl(var(--muted))',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid hsl(var(--card-border))',
                  marginBottom: '0.25rem'
                }}>
                  <div>Nom de l'article *</div>
                  <div>Catégorie *</div>
                  <div>Quantité *</div>
                  <div>Unité</div>
                  <div>Prix unitaire *</div>
                  <div>Total (HT)</div>
                  <div>Taxe %</div>
                  <div>Rabais ({user?.currency || '$'})</div>
                  <div></div>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1.3fr 0.8fr 1fr 1.1fr 1.1fr 0.8fr 0.8fr 40px',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      list="products-datalist"
                      className="form-control"
                      placeholder="Nom du produit"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.productName}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateItemField(idx, 'productName', val);
                        const matching = uniqueProducts.find(
                          p => p.productName.toLowerCase() === val.toLowerCase()
                        );
                        if (matching && matching.categoryId) {
                          updateItemField(idx, 'categoryId', matching.categoryId);
                        }
                      }}
                      required
                    />

                    <select
                      className="form-control"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.categoryId}
                      onChange={(e) => updateItemField(idx, 'categoryId', e.target.value)}
                      required
                    >
                      <option value="">Catégorie</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Qté"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.quantity}
                      onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                      required
                    />

                    <select
                      className="form-control"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.unit}
                      onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                    >
                      <option value="UNIT">unité</option>
                      <option value="KG">kg</option>
                      <option value="LBS">lbs (livre)</option>
                      <option value="LABS">labs</option>
                      <option value="G">g</option>
                      <option value="LITRE">litre</option>
                      <option value="ML">ml</option>
                      <option value="PACK">paquet</option>
                      <option value="BOX">boîte</option>
                    </select>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Prix unit."
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItemField(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Total HT"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.totalPrice || ''}
                      onChange={(e) => updateItemField(idx, 'totalPrice', parseFloat(e.target.value) || 0)}
                    />

                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      placeholder="Taxe"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.taxRate || ''}
                      onChange={(e) => updateItemField(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                    />

                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="Rabais"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.discount || ''}
                      onChange={(e) => updateItemField(idx, 'discount', parseFloat(e.target.value) || 0)}
                    />

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="btn btn-ghost"
                      style={{ padding: '0.4rem', color: 'hsl(var(--destructive))' }}
                      disabled={items.length === 1}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotals breakdown block */}
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--muted-dark) / 0.3)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '220px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>Sous-total:</span>
                  <span>{formTotals.subtotal.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>Remises:</span>
                  <span style={{ color: 'hsl(var(--success))' }}>- {formTotals.discounts.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>Taxes:</span>
                  <span>+ {formTotals.taxes.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                {formTotals.globalDiscounts > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--muted))' }}>Fidélité / Autre:</span>
                    <span style={{ color: 'hsl(var(--success))' }}>- {formTotals.globalDiscounts.toFixed(2)} {user?.currency || '$'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid hsl(var(--card-border))', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                  <span>Total Net:</span>
                  <span style={{ color: 'hsl(var(--primary))', fontSize: '1rem' }}>{formTotals.total.toFixed(2)} {user?.currency || '$'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Actions footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => { setView('list'); setEditingInvoice(null); }} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editingInvoice ? 'Enregistrer les modifications' : 'Enregistrer la facture'}
            </button>
          </div>
        </form>

        {/* Datalist for autocomplete suggestions */}
        <datalist id="products-datalist">
          {uniqueProducts.map((p, pIdx) => (
            <option key={pIdx} value={p.productName} />
          ))}
        </datalist>
      </div>
    );
  }

  // ==========================================
  // RENDER VIEW: SEPARATE DETAILS VIEW
  // ==========================================
  if (view === 'detail' && selectedInvoice) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header toolbar */}
        <div className="flex-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setView('list')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Détails de la Facture</h1>
              <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>Visualisation complète des produits achetés et de la ventilation.</p>
            </div>
          </div>

          <div className="flex-header-actions">
            <button onClick={() => openEditPage(selectedInvoice)} className="btn btn-secondary">
              <Edit size={16} />
              Modifier
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} />
              Imprimer PDF
            </button>
            {user?.role === 'ADMIN' && (
              <button onClick={() => handleDeleteInvoice(selectedInvoice.id)} className="btn btn-danger">
                <Trash size={16} />
                Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Main receipt container */}
          <div className="stat-card" style={{ padding: '2rem', flex: '2 1 500px', minWidth: '300px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed hsl(var(--card-border))', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store size={22} style={{ color: 'hsl(var(--primary))' }} />
                  {selectedInvoice.store.name}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>{selectedInvoice.store.city}, {selectedInvoice.store.province}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>Facture N° : {selectedInvoice.invoiceNumber}</p>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>{new Date(selectedInvoice.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p>
              </div>
            </div>

            {/* List of articles */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Articles</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedInvoice.items.map((item: any, idx: number) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid hsl(var(--card-border) / 0.3)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.1rem' }}>
                        {item.brand ? `${item.brand} • ` : ''}{item.category.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem' }}>{item.quantity} {item.unit.toLowerCase()} × {item.unitPrice.toFixed(2)} {user?.currency || '$'}</div>
                      {item.discount > 0 && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--success))' }}>Remise: -{item.discount.toFixed(2)} {user?.currency || '$'}</div>}
                      <div style={{ fontWeight: 600, marginTop: '0.1rem' }}>{item.netPrice.toFixed(2)} {user?.currency || '$'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px dashed hsl(var(--card-border))' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '220px', fontSize: '0.9rem' }}>
                {selectedInvoice.globalDiscounts > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--muted))' }}>Rabais global / Fidélité:</span>
                    <span style={{ color: 'hsl(var(--success))' }}>- {selectedInvoice.globalDiscounts.toFixed(2)} {user?.currency || '$'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>Taxes cumulées:</span>
                  <span>{selectedInvoice.totalTaxes.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid hsl(var(--card-border))', paddingTop: '0.5rem', marginTop: '0.3rem', fontSize: '1.15rem' }}>
                  <span>Total Net:</span>
                  <span style={{ color: 'hsl(var(--primary))' }}>{selectedInvoice.totalAmount.toFixed(2)} {user?.currency || '$'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 250px', minWidth: '250px' }}>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.5rem' }}>Métadonnées</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <CreditCard size={16} style={{ color: 'hsl(var(--muted))' }} />
                <span>Mode : <strong style={{ color: 'white' }}>{selectedInvoice.paymentMode}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Calendar size={16} style={{ color: 'hsl(var(--muted))' }} />
                <span>Saisi par : <strong style={{ color: 'white' }}>{selectedInvoice.user?.name || 'Utilisateur'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Tag size={16} style={{ color: 'hsl(var(--muted))' }} />
                <span>Type de commerce : <strong style={{ color: 'white' }}>{selectedInvoice.store.type}</strong></span>
              </div>
            </div>

            {selectedInvoice.comments && (
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={16} />
                  Commentaires
                </h3>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'hsl(var(--foreground) / 0.9)', lineHeight: 1.4 }}>
                  {selectedInvoice.comments}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return null;
};
