import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Autocomplete } from '../components/Autocomplete';
import { Search, Plus, FileSpreadsheet, Printer, Trash, Upload, Sparkles, ArrowLeft, Calendar, Store, CreditCard, MessageSquare, Tag, Edit, Loader2, HelpCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const FormTooltip: React.FC<{ content: string }> = ({ content }) => {
  return (
    <span className="tooltip-container">
      <HelpCircle size={13} />
      <span className="tooltip-text">{content}</span>
    </span>
  );
};

interface ProductTourProps {
  active: boolean;
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const ProductTour: React.FC<ProductTourProps> = ({ active, step, onStepChange, onClose, t }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'bottom' });
  const [mobilePlacement, setMobilePlacement] = useState<'top' | 'bottom'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const stepsSelectors = [
    '.tour-ocr',
    '.tour-details',
    '.tour-items-header',
    '.tour-summary',
    '.tour-save'
  ];

  const steps = [
    {
      title: t('tour.step1.title'),
      content: t('tour.step1.content')
    },
    {
      title: t('tour.step2.title'),
      content: t('tour.step2.content')
    },
    {
      title: t('tour.step3.title'),
      content: t('tour.step3.content')
    },
    {
      title: t('tour.step4.title'),
      content: t('tour.step4.content')
    },
    {
      title: t('tour.step5.title'),
      content: t('tour.step5.content')
    }
  ];

  useEffect(() => {
    if (!active) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(stepsSelectors[step]);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    const element = document.querySelector(stepsSelectors[step]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(updateRect, 300);
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect);
      };
    } else {
      setTargetRect(null);
    }
  }, [active, step]);

  useEffect(() => {
    if (!targetRect || !active) return;
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      // Dynamic mobile sheet placement: place sheet at the top if target is in bottom half of screen
      if (targetRect.top >= window.innerHeight / 2) {
        setMobilePlacement('top');
      } else {
        setMobilePlacement('bottom');
      }
      return;
    }

    const tWidth = 340;
    const tHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 180;

    let top = targetRect.bottom + 16;
    let left = targetRect.left + (targetRect.width - tWidth) / 2;
    let placement = 'bottom';

    // If it doesn't fit below, place it above
    if (top + tHeight > window.innerHeight && targetRect.top - tHeight - 16 > 0) {
      top = targetRect.top - tHeight - 16;
      placement = 'top';
    }

    // Clamp left
    left = Math.max(16, Math.min(window.innerWidth - tWidth - 16, left));

    setTooltipPos({ top, left, placement });
  }, [targetRect, step, active]);

  if (!active) return null;

  const currentStepData = steps[step];
  if (!currentStepData) return null;

  const totalSteps = steps.length;
  const isMobile = window.innerWidth <= 600;

  return createPortal(
    <>
      <div className="tour-overlay" onClick={onClose} />

      {targetRect && (
        <div
          className="tour-highlight"
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 'var(--radius-lg)',
            pointerEvents: 'none',
            zIndex: 99999
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className={`tour-tooltip ${isMobile ? `tour-tooltip-mobile-${mobilePlacement}` : `tour-tooltip-${tooltipPos.placement}`}`}
        style={
          isMobile
            ? mobilePlacement === 'top'
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  zIndex: 100000,
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)'
                }
              : {
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  zIndex: 100000,
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  boxShadow: 'var(--shadow-lg)'
                }
            : {
                position: 'fixed',
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: '340px',
                zIndex: 100000
              }
        }
      >
        <div className="tour-tooltip-header">
          <span className="tour-step-badge">
            {t('tour.step.of')
              .replace('{current}', String(step + 1))
              .replace('{total}', String(totalSteps))}
          </span>
          <button className="tour-close-btn" type="button" onClick={onClose} title={t('inv.form.btn.cancel')}>
            <X size={16} />
          </button>
        </div>

        <div className="tour-tooltip-body">
          <h4 className="tour-tooltip-title">{currentStepData.title}</h4>
          <p className="tour-tooltip-content">{currentStepData.content}</p>
        </div>

        <div className="tour-tooltip-footer">
          <div className="tour-stepper-dots">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`tour-dot ${i === step ? 'active' : ''}`}
                onClick={() => onStepChange(i)}
              />
            ))}
          </div>

          <div className="tour-actions">
            {step > 0 && (
              <button
                type="button"
                className="btn btn-ghost tour-btn"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                onClick={() => onStepChange(step - 1)}
              >
                <ChevronLeft size={14} />
                {t('tour.btn.prev')}
              </button>
            )}
            {step < totalSteps - 1 ? (
              <button
                type="button"
                className="btn btn-primary tour-btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                onClick={() => onStepChange(step + 1)}
              >
                {t('tour.btn.next')}
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success tour-btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={onClose}
              >
                {t('tour.btn.finish')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export const Invoices: React.FC<{ initialView?: 'list' | 'add' | 'detail' }> = ({ initialView }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
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

  // Product Tour state
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const startTour = () => {
    setTourActive(true);
    setTourStep(0);
  };

  const handleCloseTour = () => {
    setTourActive(false);
    localStorage.setItem('fintrack_tour_completed', 'true');
  };

  useEffect(() => {
    if (view === 'add' && !editingInvoice) {
      const completed = localStorage.getItem('fintrack_tour_completed');
      if (!completed) {
        const timer = setTimeout(() => {
          setTourActive(true);
          setTourStep(0);
        }, 800);
        return () => clearTimeout(timer);
      }
    } else {
      setTourActive(false);
    }
  }, [view, editingInvoice]);

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

  // New Store Modal states
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreProvince, setNewStoreProvince] = useState('');
  const [newStoreCountry, setNewStoreCountry] = useState('Canada');
  const [newStoreType, setNewStoreType] = useState('SUPERMARKET');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreWebsite, setNewStoreWebsite] = useState('');
  const [storeFormLoading, setStoreFormLoading] = useState(false);

  // Autocomplete lists for Store creation in Invoices
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

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

  const fetchMetadata = async (selectedId?: string) => {
    try {
      const storesData = await api.stores.findAll();
      const categoriesData = await api.categories.findAllFlat();
      setStores(storesData);
      setCategories(categoriesData);
      if (selectedId) {
        setFormStoreId(selectedId);
      } else if (storesData.length > 0 && !formStoreId) {
        setFormStoreId(storesData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  const loadCountries = async () => {
    try {
      const list = await api.locations.getCountries();
      setAvailableCountries(list);
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const loadProvinces = async (countryName: string) => {
    if (!countryName) {
      setAvailableProvinces([]);
      return;
    }
    try {
      const list = await api.locations.getRegions(countryName);
      setAvailableProvinces(list);
    } catch (err) {
      console.error('Failed to load provinces:', err);
    }
  };

  const loadCities = async (countryName: string, provinceName: string) => {
    if (!countryName || !provinceName) {
      setAvailableCities([]);
      return;
    }
    try {
      const list = await api.locations.getCities(countryName, provinceName);
      setAvailableCities(list);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const handleCountryChange = (val: string) => {
    setNewStoreCountry(val);
    setNewStoreProvince('');
    setNewStoreCity('');
    setAvailableCities([]);
    loadProvinces(val);
  };

  const handleProvinceChange = (val: string) => {
    setNewStoreProvince(val);
    setNewStoreCity('');
    loadCities(newStoreCountry, val);
  };

  const handleOpenStoreModal = () => {
    setNewStoreName('');
    setNewStoreCity('');
    setNewStoreProvince('');
    setNewStoreCountry('Canada');
    setNewStoreType('SUPERMARKET');
    setNewStoreAddress('');
    setNewStorePhone('');
    setNewStoreWebsite('');
    setAvailableCities([]);
    loadProvinces('Canada');
    setIsStoreModalOpen(true);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreFormLoading(true);
    try {
      const createdStore = await api.stores.create({
        name: newStoreName,
        city: newStoreCity,
        province: newStoreProvince,
        country: newStoreCountry,
        type: newStoreType,
        address: newStoreAddress || undefined,
        phone: newStorePhone || undefined,
        website: newStoreWebsite || undefined,
      });
      await fetchMetadata(createdStore.id);
      setIsStoreModalOpen(false);
    } catch (err: any) {
      alert(err.message || t('store.error.save'));
    } finally {
      setStoreFormLoading(false);
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
    Promise.all([fetchInvoices(), fetchMetadata(), fetchUniqueProducts(), loadCountries()]).finally(() => setLoading(false));
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
      alert(language === 'fr' ? 'Erreur lors de l\'exportation CSV' : 'Error exporting CSV');
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
      alert(err.message || t('inv.ocr.error.process'));
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
      alert(language === 'fr' ? 'Erreur lors de la lecture du fichier' : 'Error reading file');
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
      alert(t('inv.form.select.store'));
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
      resetForm();
      setView('list');
      fetchUniqueProducts();
    } catch (err: any) {
      alert(err.message || t('inv.form.error.save'));
    }
  };

  const resetForm = () => {
    setInvoiceNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode(user?.defaultPaymentMode || 'DEBIT_CARD');
    setFormStoreId(stores.length > 0 ? stores[0].id : '');
    setComments('');
    setRawStoreName('');
    setGlobalDiscounts(0);
    setItems([{ productName: '', categoryId: categories.length > 0 ? categories[0].id : '', quantity: 1, unit: 'UNIT', unitPrice: 0, taxRate: 0, discount: 0, brand: '', barcode: '' }]);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm(t('inv.confirm.delete_one'))) return;
    try {
      await api.invoices.delete(id);
      setView('list');
      fetchInvoices();
    } catch (err) {
      alert(t('inv.error.delete'));
    }
  };

  const openAddPage = () => {
    resetForm();
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
    if (!window.confirm(t('inv.confirm.delete_selected'))) return;
    try {
      await api.invoices.bulkDelete(selectedIds);
      setSelectedIds([]);
      fetchInvoices();
    } catch (err) {
      alert(t('inv.error.delete'));
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('inv.title')}</h1>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>{t('inv.subtitle')}</p>
          </div>
          <div className="flex-header-actions">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn btn-danger">
                <Trash size={16} />
                {t('inv.btn.delete_selected')} ({selectedIds.length})
              </button>
            )}
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} />
              {language === 'fr' ? 'Imprimer PDF' : 'Print PDF'}
            </button>
            <button onClick={openAddPage} className="btn btn-primary">
              <Plus size={16} />
              {t('inv.btn.add')}
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
              placeholder={t('inv.filter.search')}
              className="form-control"
              style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.2rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-control" style={{ padding: '0.5rem 0.75rem' }} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">{t('inv.filter.store')}</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select className="form-control" style={{ padding: '0.5rem 0.75rem' }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t('prod.filter.cat')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="form-control" style={{ padding: '0.5rem 0.75rem' }} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="">{t('inv.form.select.pay_placeholder')}</option>
              <option value="CASH">{t('set.pay.cash')}</option>
              <option value="DEBIT_CARD">{t('set.pay.debit_card')}</option>
              <option value="CREDIT_CARD">{t('set.pay.credit_card')}</option>
              <option value="WIRE_TRANSFER">{t('set.pay.wire_transfer')}</option>
              <option value="OTHER">{t('set.pay.other')}</option>
            </select>

            <input
              type="date"
              className="form-control"
              style={{ padding: '0.5rem 0.75rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>{language === 'fr' ? 'à' : 'to'}</span>
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
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{language === 'fr' ? 'Mise à jour de la liste...' : 'Updating list...'}</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--card-border))', color: 'hsl(var(--muted))' }}>
            {t('inv.table.no_invoices')}
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
                  <th>{t('inv.table.date')}</th>
                  <th>{t('inv.table.number')}</th>
                  <th>{t('inv.table.store')}</th>
                  <th>{t('inv.table.pay')}</th>
                  <th>Taxes</th>
                  <th>Total</th>
                  {user?.role === 'ADMIN' && <th style={{ textAlign: 'right' }}>{t('inv.table.actions')}</th>}
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
                    <td>{new Date(inv.date).toLocaleDateString(language, { timeZone: 'UTC' })}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td>{inv.store.name}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        backgroundColor: 'hsl(var(--secondary))',
                        color: 'hsl(var(--muted))'
                      }}>
                        {inv.paymentMode === 'CASH' && t('set.pay.cash')}
                        {inv.paymentMode === 'DEBIT_CARD' && t('set.pay.debit_card')}
                        {inv.paymentMode === 'CREDIT_CARD' && t('set.pay.credit_card')}
                        {inv.paymentMode === 'WIRE_TRANSFER' && t('set.pay.wire_transfer')}
                        {inv.paymentMode === 'OTHER' && t('set.pay.other')}
                      </span>
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
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>{t('pag.lines_per_page')}</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                {t('pag.display_invoices')
                  .replace('{start}', String(invoices.length > 0 ? startIndex + 1 : 0))
                  .replace('{end}', String(Math.min(endIndex, invoices.length)))
                  .replace('{total}', String(invoices.length))}
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
                  {t('pag.page_of')
                    .replace('{current}', String(currentPage))
                    .replace('{total}', String(totalPages || 1))}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {t('pag.next')}
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
        <div className="flex-header" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => { resetForm(); setView('list'); }} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{editingInvoice ? t('inv.form.edit') : t('inv.form.add')}</h1>
              <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
                {editingInvoice 
                  ? (language === 'fr' ? 'Modifiez les détails et les articles de cette facture d\'achat.' : 'Edit details and products for this purchase invoice.') 
                  : (language === 'fr' ? 'Saisissez manuellement vos dépenses ou utilisez l\'assistant OCR.' : 'Manually enter your expenses or use the OCR assistant.')}
              </p>
            </div>
          </div>
          {!editingInvoice && (
            <button
              type="button"
              onClick={startTour}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              title={language === 'fr' ? "Lancer le guide d'utilisation" : "Start user guide"}
            >
              <HelpCircle size={16} />
              <span className="hide-mobile">{language === 'fr' ? 'Guide interactif' : 'Interactive Guide'}</span>
            </button>
          )}
        </div>

        {/* Layout */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Simulated OCR Scanner Banner */}
          {!editingInvoice && (
            <div className="glass tour-ocr" style={{
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
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ocrLoading ? (language === 'fr' ? 'Analyse du reçu par OCR...' : 'OCR receipt analysis...') : t('inv.ocr.title')}
                    <FormTooltip content={language === 'fr' ? 'Téléversez une image claire (JPEG/PNG) de votre reçu pour extraire automatiquement les informations.' : 'Upload a clear image (JPEG/PNG) of your receipt to automatically extract information.'} />
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: 'hsl(var(--warning) / 0.15)',
                      color: 'hsl(var(--warning))',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase',
                      border: '1px solid hsl(var(--warning) / 0.3)',
                      lineHeight: '1.2'
                    }}>Beta</span>
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', marginTop: '0.25rem' }}>
                    {ocrLoading 
                      ? (language === 'fr' ? 'Extraction des articles, taxes, magasin et date du reçu en cours...' : 'Extracting items, taxes, store, and date from the receipt...') 
                      : `${t('inv.ocr.desc')} ${t('inv.ocr.beta')}`}
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
                      {language === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      {language === 'fr' ? 'Importer un reçu' : 'Import a receipt'}
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
          <div className="stat-card tour-details">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              {language === 'fr' ? "Détails de l'achat" : 'Purchase Details'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {t('inv.form.label.number')}
                  <FormTooltip content={language === 'fr' ? 'Numéro unique figurant sur le reçu (ex: WMT-7654).' : 'Unique number shown on the receipt (e.g., WMT-7654).'} />
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={language === 'fr' ? "Ex: WMT-7654" : "e.g. WMT-7654"}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {t('inv.form.label.date')}
                  <FormTooltip content={language === 'fr' ? "La date d'achat imprimée sur votre ticket de caisse." : 'The purchase date printed on your store receipt.'} />
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.1rem' }}>
                  <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {t('inv.form.label.store')}
                    <FormTooltip content={language === 'fr' ? 'Le magasin où les achats ont été effectués.' : 'The store where the purchases were made.'} />
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenStoreModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--primary))',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.1rem 0.3rem',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                      e.currentTarget.style.color = 'hsl(var(--accent))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'hsl(var(--primary))';
                    }}
                  >
                    <Plus size={12} />
                    {language === 'fr' ? 'Nouveau ?' : 'New?'}
                  </button>
                </div>
                <select 
                  className="form-control" 
                  value={formStoreId} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__NEW_STORE__') {
                      handleOpenStoreModal();
                    } else {
                      setFormStoreId(val);
                    }
                  }} 
                  required 
                >
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="" disabled>{language === 'fr' ? '-- Sélectionner --' : '-- Select --'}</option>
                  <option value="__NEW_STORE__" style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>
                    ➕ {t('inv.form.btn.newStore')}...
                  </option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {t('inv.form.label.pay')}
                  <FormTooltip content={language === 'fr' ? 'Le moyen de paiement utilisé pour régler la facture.' : 'The payment method used to pay the invoice.'} />
                </label>
                <select className="form-control" value={formPaymentMode} onChange={(e) => setFormPaymentMode(e.target.value)} required>
                  <option value="DEBIT_CARD">{t('set.pay.debit_card')}</option>
                  <option value="CREDIT_CARD">{t('set.pay.credit_card')}</option>
                  <option value="CASH">{t('set.pay.cash')}</option>
                  <option value="WIRE_TRANSFER">{t('set.pay.wire_transfer')}</option>
                  <option value="OTHER">{t('set.pay.other')}</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {language === 'fr' ? 'Rabais global / Fidélité' : 'Global Discount / Loyalty'}
                  <FormTooltip content={language === 'fr' ? 'Remises appliquées sur le montant total ou réduction de points de fidélité.' : 'Discounts applied to the total amount or loyalty points deduction.'} />
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder={language === 'fr' ? "Ex: 10.00" : "e.g. 10.00"}
                  value={globalDiscounts || ''}
                  onChange={(e) => setGlobalDiscounts(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {t('inv.form.label.comment')} ({language === 'fr' ? 'facultatif' : 'optional'})
                <FormTooltip content={language === 'fr' ? 'Notes additionnelles ou détails spécifiques concernant cet achat.' : 'Additional notes or specific details about this purchase.'} />
              </label>
              <textarea
                className="form-control"
                placeholder={language === 'fr' ? "Notes de la facture..." : "Invoice notes..."}
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Section 2: Articles Achetés */}
          <div className="stat-card tour-items">
            <div className="tour-items-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('inv.form.items')}</h2>
              <button type="button" onClick={addItemRow} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                {t('inv.form.btn.addline')}
              </button>
            </div>

            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '1.5rem' }}>
              <div style={{ minWidth: '1150px', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '280px', paddingBottom: '20px' }}>
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
                  <div>{t('inv.form.col.name')}</div>
                  <div>{t('inv.form.col.cat')}</div>
                  <div>{t('inv.form.col.qty')}</div>
                  <div>{t('inv.form.col.unit')}</div>
                  <div>{t('inv.form.col.price')}</div>
                  <div>{t('inv.form.col.totalht')}</div>
                  <div>{t('inv.form.col.tax')}</div>
                  <div>{t('inv.form.col.discount')} ({user?.currency || '$'})</div>
                  <div></div>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1.3fr 0.8fr 1fr 1.1fr 1.1fr 0.8fr 0.8fr 40px',
                    gap: '0.5rem',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: items.length - idx
                  }}>
                    <Autocomplete
                      value={item.productName}
                      onChange={(val) => {
                        updateItemField(idx, 'productName', val);
                        const matching = uniqueProducts.find(
                          p => p.productName.toLowerCase() === val.toLowerCase()
                        );
                        if (matching && matching.categoryId) {
                          updateItemField(idx, 'categoryId', matching.categoryId);
                        }
                      }}
                      suggestions={uniqueProducts.map((p: any) => p.productName)}
                      placeholder={t('inv.form.autocomplete.product')}
                      required
                      inputStyle={{ padding: '0.5rem 0.4rem' }}
                    />

                    <select
                      className="form-control"
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.categoryId}
                      onChange={(e) => updateItemField(idx, 'categoryId', e.target.value)}
                      required
                    >
                      <option value="">{t('inv.form.select.cat')}</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder={language === 'fr' ? 'Qté' : 'Qty'}
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
                      <option value="UNIT">{language === 'fr' ? 'unité' : 'unit'}</option>
                      <option value="KG">kg</option>
                      <option value="LBS">{language === 'fr' ? 'lbs (livre)' : 'lbs (pound)'}</option>
                      <option value="LABS">labs</option>
                      <option value="G">g</option>
                      <option value="LITRE">litre</option>
                      <option value="ML">ml</option>
                      <option value="PACK">{language === 'fr' ? 'paquet' : 'pack'}</option>
                      <option value="BOX">{language === 'fr' ? 'boîte' : 'box'}</option>
                    </select>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder={language === 'fr' ? 'Prix unit.' : 'Unit price'}
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItemField(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder={language === 'fr' ? 'Total HT' : 'Total (Net)'}
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.totalPrice || ''}
                      onChange={(e) => updateItemField(idx, 'totalPrice', parseFloat(e.target.value) || 0)}
                    />

                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      placeholder={language === 'fr' ? 'Taxe' : 'Tax'}
                      style={{ padding: '0.5rem 0.4rem', width: '100%' }}
                      value={item.taxRate || ''}
                      onChange={(e) => updateItemField(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                    />

                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder={language === 'fr' ? 'Rabais' : 'Discount'}
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
            <div className="tour-summary" style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--muted-dark) / 0.3)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '220px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>{t('inv.form.summary.subtotal')}:</span>
                  <span>{formTotals.subtotal.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>{t('inv.form.summary.discounts')}:</span>
                  <span style={{ color: 'hsl(var(--success))' }}>- {formTotals.discounts.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>{t('inv.form.summary.taxes')}:</span>
                  <span>+ {formTotals.taxes.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                {formTotals.globalDiscounts > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--muted))' }}>{language === 'fr' ? 'Fidélité / Autre:' : 'Loyalty / Other:'}</span>
                    <span style={{ color: 'hsl(var(--success))' }}>- {formTotals.globalDiscounts.toFixed(2)} {user?.currency || '$'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid hsl(var(--card-border))', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                  <span>{t('inv.form.summary.net')}:</span>
                  <span style={{ color: 'hsl(var(--primary))', fontSize: '1rem' }}>{formTotals.total.toFixed(2)} {user?.currency || '$'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Actions footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => { resetForm(); setView('list'); }} className="btn btn-secondary">
              {t('inv.form.btn.cancel')}
            </button>
            <button type="submit" className="btn btn-primary tour-save">
              {editingInvoice ? t('inv.form.btn.update') : t('inv.form.btn.save')}
            </button>
          </div>
        </form>



        {isStoreModalOpen && createPortal(
          <div className="modal-overlay" onClick={() => setIsStoreModalOpen(false)}>
            <div className="modal-content animate-scale-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
              <div className="modal-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {t('store.modal.add')}
                </h2>
                <button type="button" onClick={() => setIsStoreModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%', color: 'white' }}>
                  <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </div>
              
              <form onSubmit={handleCreateStore}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.label.name')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={language === 'fr' ? "Ex: Walmart" : "e.g. Walmart"}
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('store.modal.label.country')}</label>
                      <Autocomplete
                        value={newStoreCountry}
                        onChange={handleCountryChange}
                        suggestions={availableCountries.map((c: any) => c.name)}
                        placeholder={language === 'fr' ? "Ex: Canada" : "e.g. Canada"}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('store.modal.label.province')}</label>
                      <Autocomplete
                        value={newStoreProvince}
                        onChange={handleProvinceChange}
                        suggestions={availableProvinces.map((p: any) => p.name)}
                        placeholder={language === 'fr' ? "Ex: Québec" : "e.g. Quebec"}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('store.modal.label.city')}</label>
                      <Autocomplete
                        value={newStoreCity}
                        onChange={setNewStoreCity}
                        suggestions={availableCities.map((c: any) => c.name)}
                        placeholder={language === 'fr' ? "Ex: Montréal" : "e.g. Montreal"}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('store.modal.type')}</label>
                      <select className="form-control" value={newStoreType} onChange={(e) => setNewStoreType(e.target.value)}>
                        <option value="SUPERMARKET">{t('store.type.supermarket')}</option>
                        <option value="PHARMACY">{t('store.type.pharmacy')}</option>
                        <option value="GAS_STATION">{t('store.type.gas_station')}</option>
                        <option value="TRANSPORT">{t('store.type.transport')}</option>
                        <option value="RETAIL">{t('store.type.retail')}</option>
                        <option value="RESTAU">{t('store.type.restau')}</option>
                        <option value="OTHER">{t('store.type.other')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.address')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={language === 'fr' ? "Ex: 123 Rue de la Montagne" : "e.g. 123 Mountain Road"}
                      value={newStoreAddress}
                      onChange={(e) => setNewStoreAddress(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('store.modal.phone_opt')}</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={language === 'fr' ? "Ex: 514-555-0199" : "e.g. 514-555-0199"}
                        value={newStorePhone}
                        onChange={(e) => setNewStorePhone(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('store.modal.web_opt')}</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder={language === 'fr' ? "Ex: https://www.walmart.ca" : "e.g. https://www.walmart.ca"}
                        value={newStoreWebsite}
                        onChange={(e) => setNewStoreWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
                  <button type="button" onClick={() => setIsStoreModalOpen(false)} className="btn btn-secondary">
                    {t('store.modal.btn.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={storeFormLoading}>
                    {storeFormLoading ? t('store.modal.saving') : t('store.modal.btn.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        <ProductTour
          active={tourActive}
          step={tourStep}
          onStepChange={setTourStep}
          onClose={handleCloseTour}
          t={t}
        />
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
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('inv.details.title')}</h1>
              <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
                {language === 'fr' 
                  ? 'Visualisation complète des produits achetés et de la ventilation.' 
                  : 'Complete view of purchased items and totals breakdown.'}
              </p>
            </div>
          </div>

          <div className="flex-header-actions">
            <button onClick={() => openEditPage(selectedInvoice)} className="btn btn-secondary">
              <Edit size={16} />
              {language === 'fr' ? 'Modifier' : 'Edit'}
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} />
              {language === 'fr' ? 'Imprimer PDF' : 'Print PDF'}
            </button>
            {user?.role === 'ADMIN' && (
              <button onClick={() => handleDeleteInvoice(selectedInvoice.id)} className="btn btn-danger">
                <Trash size={16} />
                {language === 'fr' ? 'Supprimer' : 'Delete'}
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
                <p style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  {language === 'fr' ? 'Facture N° :' : 'Invoice No:'} {selectedInvoice.invoiceNumber}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginTop: '0.2rem' }}>
                  {new Date(selectedInvoice.date).toLocaleDateString(language, { timeZone: 'UTC' })}
                </p>
              </div>
            </div>

            {/* List of articles */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                {language === 'fr' ? 'Articles' : 'Items'}
              </h3>
              
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
                      <div style={{ fontSize: '0.85rem' }}>
                        {item.quantity} {item.unit.toLowerCase() === 'unit' ? (language === 'fr' ? 'unité' : 'unit') : item.unit.toLowerCase()} × {item.unitPrice.toFixed(2)} {user?.currency || '$'}
                      </div>
                      {item.discount > 0 && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--success))' }}>{language === 'fr' ? 'Remise' : 'Discount'}: -{item.discount.toFixed(2)} {user?.currency || '$'}</div>}
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
                    <span style={{ color: 'hsl(var(--muted))' }}>{language === 'fr' ? 'Rabais global / Fidélité:' : 'Global Discount / Loyalty:'}</span>
                    <span style={{ color: 'hsl(var(--success))' }}>- {selectedInvoice.globalDiscounts.toFixed(2)} {user?.currency || '$'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted))' }}>{t('inv.details.taxes')}:</span>
                  <span>{selectedInvoice.totalTaxes.toFixed(2)} {user?.currency || '$'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid hsl(var(--card-border))', paddingTop: '0.5rem', marginTop: '0.3rem', fontSize: '1.15rem' }}>
                  <span>{t('inv.details.net')}:</span>
                  <span style={{ color: 'hsl(var(--primary))' }}>{selectedInvoice.totalAmount.toFixed(2)} {user?.currency || '$'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 250px', minWidth: '250px' }}>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.5rem' }}>
                {language === 'fr' ? 'Métadonnées' : 'Metadata'}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <CreditCard size={16} style={{ color: 'hsl(var(--muted))' }} />
                <span>{language === 'fr' ? 'Mode :' : 'Mode:'} <strong style={{ color: 'white' }}>
                  {selectedInvoice.paymentMode === 'CASH' && t('set.pay.cash')}
                  {selectedInvoice.paymentMode === 'DEBIT_CARD' && t('set.pay.debit_card')}
                  {selectedInvoice.paymentMode === 'CREDIT_CARD' && t('set.pay.credit_card')}
                  {selectedInvoice.paymentMode === 'WIRE_TRANSFER' && t('set.pay.wire_transfer')}
                  {selectedInvoice.paymentMode === 'OTHER' && t('set.pay.other')}
                </strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Calendar size={16} style={{ color: 'hsl(var(--muted))' }} />
                <span>{language === 'fr' ? 'Saisi par :' : 'Entered by:'} <strong style={{ color: 'white' }}>{selectedInvoice.user?.name || 'Utilisateur'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Tag size={16} style={{ color: 'hsl(var(--muted))' }} />
                <span>{language === 'fr' ? 'Type de commerce :' : 'Business Type:'} <strong style={{ color: 'white' }}>
                  {selectedInvoice.store.type === 'SUPERMARKET' && t('store.type.supermarket')}
                  {selectedInvoice.store.type === 'PHARMACY' && t('store.type.pharmacy')}
                  {selectedInvoice.store.type === 'GAS_STATION' && t('store.type.gas_station')}
                  {selectedInvoice.store.type === 'TRANSPORT' && t('store.type.transport')}
                  {selectedInvoice.store.type === 'RETAIL' && t('store.type.retail')}
                  {selectedInvoice.store.type === 'RESTAU' && t('store.type.restau')}
                  {selectedInvoice.store.type === 'OTHER' && t('store.type.other')}
                </strong></span>
              </div>
            </div>

            {selectedInvoice.comments && (
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={16} />
                  {language === 'fr' ? 'Commentaires' : 'Comments'}
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
