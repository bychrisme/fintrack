import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Autocomplete } from '../components/Autocomplete';
import { Store, MapPin, ShoppingBag, Plus, Edit, Trash, X, Search } from 'lucide-react';

export const Stores: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [storeStats, setStoreStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Filter stores by name
  const filteredStores = storeStats.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredStores.length / pageSize);
  const paginatedStores = filteredStores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Canada');
  const [type, setType] = useState('SUPERMARKET');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Autocomplete lists
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  // Location helpers
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
    setCountry(val);
    setProvince('');
    setCity('');
    setAvailableCities([]);
    loadProvinces(val);
  };

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    setCity('');
    loadCities(country, val);
  };

  const fetchStoreStats = async () => {
    try {
      const data = await api.stores.getStats();
      setStoreStats(data);
    } catch (err) {
      console.error('Failed to fetch store stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreStats();
    loadCountries();
  }, []);

  const openAddModal = () => {
    setSelectedStore(null);
    setName('');
    setCity('');
    setProvince('');
    setCountry('Canada');
    setType('SUPERMARKET');
    setAddress('');
    setPhone('');
    setWebsite('');
    setIsModalOpen(true);
    // Load provinces for the default country ('Canada')
    loadProvinces('Canada');
    setAvailableCities([]);
  };

  const openEditModal = async (storeSummary: any) => {
    try {
      setLoading(true);
      const fullStore = await api.stores.findOne(storeSummary.id);
      setSelectedStore(fullStore);
      setName(fullStore.name);
      setCity(fullStore.city);
      setProvince(fullStore.province || '');
      setCountry(fullStore.country || 'Canada');
      setType(fullStore.type || 'SUPERMARKET');
      setAddress(fullStore.address || '');
      setPhone(fullStore.phone || '');
      setWebsite(fullStore.website || '');
      setIsModalOpen(true);

      // Load cascade lists for the edit values
      if (fullStore.country) {
        loadProvinces(fullStore.country);
        if (fullStore.province) {
          loadCities(fullStore.country, fullStore.province);
        }
      }
    } catch (err) {
      alert(t('store.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm(t('store.delete.confirm'))) return;
    try {
      setLoading(true);
      await api.stores.delete(id);
      await fetchStoreStats();
    } catch (err: any) {
      alert(err.message || t('store.error.delete'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    const payload = {
      name,
      city,
      province,
      country,
      type,
      address: address || undefined,
      phone: phone || undefined,
      website: website || undefined,
    };

    try {
      if (selectedStore) {
        await api.stores.update(selectedStore.id, payload);
      } else {
        await api.stores.create(payload);
      }
      setIsModalOpen(false);
      await fetchStoreStats();
    } catch (err: any) {
      alert(err.message || t('store.error.save'));
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && storeStats.length === 0) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>{t('store.loading')}</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('store.title')}</h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>{t('store.subtitle')}</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          {t('store.btn.add')}
        </button>
      </div>

      {/* Search Filter Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '1.5rem',
        maxWidth: '400px',
        width: '100%'
      }}>
        <input
          type="text"
          className="form-control"
          placeholder={t('store.filter.search_placeholder')}
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            paddingLeft: '2.5rem',
            width: '100%',
            height: '42px',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--card-border))',
            color: 'white'
          }}
        />
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '0.9rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--muted))'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="btn btn-ghost"
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '0.25rem',
              color: 'hsl(var(--muted))',
              height: 'auto',
              borderRadius: '50%'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {storeStats.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--card-border))', color: 'hsl(var(--muted))' }}>
          {t('store.empty')}
        </div>
      ) : filteredStores.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--card-border))', color: 'hsl(var(--muted))' }}>
          {t('store.empty_search').replace('{query}', searchQuery)}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {paginatedStores.map((store) => (
              <div key={store.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'hsl(var(--primary) / 0.1)',
                      color: 'hsl(var(--primary))'
                    }}>
                      <Store size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{store.name}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
                        <MapPin size={12} />
                        <span>{store.city}, {t('store.type.' + store.type.toLowerCase())}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEditModal(store)} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'hsl(var(--muted))' }} title={t('common.update')}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDeleteStore(store.id)} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'hsl(var(--destructive))' }} title={t('common.confirm.delete')}>
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                {/* Financial indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'hsl(var(--muted-dark))', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', display: 'block' }}>{t('store.card.spent_title')}</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>{store.totalSpent.toFixed(2)} {user?.currency || '$'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', display: 'block' }}>{t('store.card.avg')}</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{store.ticketMoyen.toFixed(2)} {user?.currency || '$'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '0.5rem' }}>
                  <span>{t('store.card.invoice_count')}</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{store.invoiceCount}</span>
                </div>

                {/* Top products */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <ShoppingBag size={14} />
                    {t('store.card.top')}
                  </h3>
                  
                  {store.topProducts.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))', fontStyle: 'italic' }}>{t('dash.recent.no_purchases')}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {store.topProducts.map((p: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: 'hsl(var(--foreground) / 0.95)' }}>{p.name}</span>
                          <span style={{
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'hsl(var(--secondary))',
                            color: 'hsl(var(--muted))',
                            fontSize: '0.75rem'
                          }}>{t('store.card.quantity')} {p.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                <span>{t('pag.show')}</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="form-control"
                  style={{ width: '75px', padding: '0.25rem 0.5rem', height: 'auto', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', color: 'white' }}
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span>{t('pag.lines_per_page')}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  className="btn btn-ghost" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  {t('pag.prev')}
                </button>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                  {t('pag.page_of').replace('{current}', currentPage.toString()).replace('{total}', (totalPages || 1).toString())}
                </span>
                <button 
                  className="btn btn-ghost" 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  {t('pag.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Store Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-scale-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {selectedStore ? t('store.modal.edit') : t('store.modal.add')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%', color: 'white' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitStore}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t('store.modal.label.name')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={language === 'fr' ? "Ex: Walmart" : "e.g. Walmart"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.label.country')}</label>
                    <Autocomplete
                      value={country}
                      onChange={handleCountryChange}
                      suggestions={availableCountries.map((c: any) => c.name)}
                      placeholder={language === 'fr' ? "Ex: Canada" : "e.g. Canada"}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.label.province')}</label>
                    <Autocomplete
                      value={province}
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
                      value={city}
                      onChange={setCity}
                      suggestions={availableCities.map((c: any) => c.name)}
                      placeholder={language === 'fr' ? "Ex: Montréal" : "e.g. Montreal"}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.type')}</label>
                    <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.phone_opt')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={language === 'fr' ? "Ex: 514-555-0199" : "e.g. 514-555-0199"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t('store.modal.web_opt')}</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder={language === 'fr' ? "Ex: https://www.walmart.ca" : "e.g. https://www.walmart.ca"}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  {t('store.modal.btn.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? t('store.modal.saving') : selectedStore ? t('store.modal.btn.update') : t('store.modal.btn.create')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
