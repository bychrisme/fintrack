import React, { useEffect, useState } from 'react';
import { api } from '../api';
import * as Icons from 'lucide-react';
import { Plus, Edit, Trash, X, Search, Filter, Package, HelpCircle } from 'lucide-react';

// Dynamic category icon renderer
const CategoryIcon: React.FC<{ name: string; size?: number; style?: React.CSSProperties }> = ({ name, size = 16, style }) => {
  const IconComponent = (Icons as any)[name] || HelpCircle;
  return <IconComponent size={size} style={style} />;
};

export const Products: React.FC = () => {
  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form input states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Fetch all products and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        api.products.findAll(),
        api.categories.findAllFlat()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open modal for creation
  const openAddModal = () => {
    setSelectedProduct(null);
    setName('');
    // Default to the first category if available
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Open modal for edition
  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setName(product.name);
    setCategoryId(product.categoryId);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Handle product deletion
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet article de votre catalogue ?')) return;
    try {
      setLoading(true);
      await api.products.delete(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression de l\'article');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission (Create or Update)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Le nom de l\'article est requis');
      setFormLoading(false);
      return;
    }

    if (!categoryId) {
      setErrorMessage('Veuillez sélectionner une catégorie');
      setFormLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId,
    };

    try {
      if (selectedProduct) {
        await api.products.update(selectedProduct.id, payload);
      } else {
        await api.products.create(payload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setFormLoading(false);
    }
  };

  // Client-side filtering and searching
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = currentPage * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package size={28} style={{ color: 'hsl(var(--primary))' }} />
            Catalogue des Articles
          </h1>
          <p style={{ color: 'hsl(var(--muted))', fontSize: '0.9rem' }}>
            Gérez la liste de vos articles récurrents et associez-les à des catégories budgétaires.
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          Ajouter un article
        </button>
      </div>

      {/* Search & Filters Controls */}
      <div className="stat-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher un article par son nom..."
              style={{ paddingLeft: '2.75rem', width: '100%', margin: 0 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div style={{ minWidth: '220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center' }}>
              <Filter size={16} />
            </span>
            <select
              className="form-control"
              style={{ paddingLeft: '2.5rem', width: '100%', margin: 0, appearance: 'none', paddingRight: '2rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center' }}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Table / Empty state */}
      {loading && products.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>
          Chargement du catalogue d'articles...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--card-border))',
          color: 'hsl(var(--muted))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--muted-dark))',
            color: 'hsl(var(--muted))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={36} />
          </div>
          <div>
            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {products.length === 0 ? 'Votre catalogue est vide' : 'Aucun article trouvé'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              {products.length === 0
                ? 'Commencez à ajouter des articles pour pouvoir les affecter rapidement lors de vos analyses.'
                : 'Essayez de modifier vos critères de recherche ou de filtre.'}
            </p>
          </div>
          {products.length === 0 && (
            <button onClick={openAddModal} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Créer mon premier article
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Nom de l'article</th>
                <th style={{ width: '35%' }}>Catégorie</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => {
                const categoryColor = product.category?.color || 'hsl(var(--primary))';
                return (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 500, color: 'white' }}>
                      {product.name}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        backgroundColor: `${categoryColor}15`, // HSL with 8% opacity
                        color: categoryColor,
                        border: `1px solid ${categoryColor}30`
                      }}>
                        <CategoryIcon name={product.category?.icon} size={14} />
                        {product.category?.name || 'Sans catégorie'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(product)}
                          className="btn btn-ghost"
                          style={{ padding: '0.5rem', color: 'hsl(var(--muted))' }}
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="btn btn-ghost"
                          style={{ padding: '0.5rem', color: 'hsl(var(--destructive))' }}
                          title="Supprimer"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              Affichage de {filteredProducts.length > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length} articles
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-scale-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} style={{ color: 'hsl(var(--primary))' }} />
                {selectedProduct ? 'Modifier l\'article' : 'Ajouter un article'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%', color: 'white' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                
                {errorMessage && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'hsl(var(--destructive-bg))',
                    color: 'hsl(var(--destructive))',
                    border: '1px solid hsl(var(--destructive) / 0.2)',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}>
                    {errorMessage}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nom de l'article *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Lait Lactantia 2%"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Catégorie *</label>
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Enregistrement...' : selectedProduct ? 'Enregistrer les modifications' : 'Créer l\'article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
