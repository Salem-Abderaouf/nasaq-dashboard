import React from 'react';
import { DoorProduct, DoorCategory } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useProductsCatalog } from '../../hooks/products/useProductsCatalog';
import { 
  Layers, 
  Search, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  DoorOpen, 
  X,
  Package, 
  PackageCheck, 
  PackageX, 
  AlertTriangle, 
  Pencil, 
  Trash2, 
  Boxes, 
  Check 
} from 'lucide-react';

interface ProductsCatalogViewProps {
  onOpenStudioWithProduct?: (prod: DoorProduct) => void;
}

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  onOpenStudioWithProduct
}) => {
  const { t } = useLanguage();
  const { hasPermission, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManageProducts = isAdmin || hasPermission('canCreateOrders');

  const {
    products,
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    filteredProducts,
    stats,

    isAddModalOpen,
    setIsAddModalOpen,
    editingProduct,
    setEditingProduct,
    stockAdjustProduct,
    setStockAdjustProduct,

    addForm,
    editForm,
    stockAdjustForm,

    fetchProducts,
    handleCreateProduct,
    openEditModal,
    handleUpdateProduct,
    handleQuickAdjustStock,
    openStockModal,
    handleApplyStockAdjustment,
    handleDeleteProduct,
    handleSeedStandardProducts,
  } = useProductsCatalog();

  const handleSeedWithFeedback = async () => {
    const success = await handleSeedStandardProducts();
    if (success) {
      alert(t('products.seedSuccess', 'Catalogue initialisé avec les modèles de référence WPC et stocks !'));
    }
  };

  const handleDeleteWithConfirm = async (prod: DoorProduct) => {
    if (!confirm(t('products.confirmDelete', 'Êtes-vous sûr de vouloir supprimer ce modèle du catalogue ?'))) {
      return;
    }
    await handleDeleteProduct(prod);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-nasaq-teal" />
            <span>{t('products.title', 'Catalogue des Modèles Portes WPC')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('products.subtitle', 'Références certifiées NASAQ (Cuisine, Chambre, Salle de bain) et gestion des stocks en temps réel')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedWithFeedback}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nasaq-gold/20 hover:bg-nasaq-gold/30 text-nasaq-gold-dark border border-nasaq-gold/40 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Recharger les modèles officiels standards avec stocks prédéfinis"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('products.loadStandard', 'Catalogue Standard')}</span>
          </button>

          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Actualiser')}</span>
          </button>

          {canManageProducts && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('products.newProduct', 'Nouveau Modèle')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Inventory Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Stock Units */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('products.totalStock', 'Stock Total')}
            </div>
            <div className="text-2xl font-black font-mono text-nasaq-teal mt-0.5">
              {stats.totalStockUnits} <span className="text-xs font-normal text-slate-500 font-sans">{t('products.units', 'unités')}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-nasaq-teal-subtle text-nasaq-teal flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Total Catalog Models */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('products.totalModels', 'Modèles')}
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 mt-0.5">
              {stats.totalModels}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* In-Stock References */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('products.inStock', 'En stock')}
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-0.5">
              {stats.inStockCount} <span className="text-xs font-normal text-slate-400 font-sans">/ {stats.totalModels}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Out of Stock / Low Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('products.outOfStock', 'Rupture')} / {t('products.lowStock', 'Faible')}
            </div>
            <div className="text-2xl font-black font-mono text-rose-600 mt-0.5">
              {stats.outOfStockCount} <span className="text-xs font-semibold text-amber-500 font-sans">+ {stats.lowStockCount} bas</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder={t('products.searchPlaceholder', 'Rechercher par référence (ex: C1, K1) ou nom...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['All', 'Bedroom', 'Kitchen', 'Bathroom', 'Custom'].map(cat => {
              const label = cat === 'All' ? t('products.allCategories', 'Tous') 
                : cat === 'Bedroom' ? t('products.category.bedroom', 'Chambre') 
                : cat === 'Kitchen' ? t('products.category.kitchen', 'Cuisine') 
                : cat === 'Bathroom' ? t('products.category.bathroom', 'SDB') 
                : t('products.category.custom', 'Sur-mesure');
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                    categoryFilter === cat
                      ? 'bg-nasaq-teal text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setStockFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                stockFilter === 'All'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {t('products.stockFilterAll', 'Tous stocks')}
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('in_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                stockFilter === 'in_stock'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-100/60'
              }`}
            >
              {t('products.stockFilterInStock', 'En stock (> 0)')}
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                stockFilter === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-100/60'
              }`}
            >
              {t('products.stockFilterLow', 'Faible (≤ 5)')}
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out_of_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                stockFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              {t('products.stockFilterOut', 'Rupture (0)')}
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-nasaq-teal" />
            {t('products.loading', 'Chargement des modèles de portes et des stocks...')}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200 space-y-3">
            <PackageX className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">
              {products.length === 0
                ? t('products.empty', 'Aucun modèle dans le catalogue. Cliquez sur "Catalogue Standard" pour insérer les modèles officiels.')
                : 'Aucun modèle ne correspond à vos filtres de recherche ou de stock.'}
            </p>
          </div>
        ) : (
          filteredProducts.map(prod => {
            const stock = prod.stock_quantity ?? 0;
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock <= 5;

            const catLabel = prod.category === 'Bedroom' ? t('products.category.bedroom', 'Chambre')
              : prod.category === 'Kitchen' ? t('products.category.kitchen', 'Cuisine')
              : prod.category === 'Bathroom' ? t('products.category.bathroom', 'SDB')
              : t('products.category.custom', 'Sur-mesure');

            return (
              <div 
                key={prod.id}
                className="bg-white border border-slate-200 hover:border-nasaq-teal-light rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3.5 relative group"
              >
                <div>
                  {/* Reference & Category & Action Buttons */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-nasaq-teal-subtle text-nasaq-teal border border-nasaq-teal/20">
                        {prod.reference}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {catLabel}
                      </span>
                    </div>

                    {canManageProducts && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="p-1 text-slate-400 hover:text-nasaq-teal hover:bg-slate-100 rounded-md transition"
                          title="Modifier le modèle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(prod)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Supprimer du catalogue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Dimensions */}
                  <div className="mt-2.5">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{prod.name}</h3>
                    <div className="text-[11px] font-mono text-slate-500 font-medium mt-1">
                      {t('products.dimensions', 'Cotes Standards :')} {prod.height} × {prod.width} cm • {t('products.thickness', 'Épaisseur :')} {prod.thickness} cm
                    </div>
                    {prod.description && (
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  {/* STOCK STATUS & CONTROLS BADGE */}
                  <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('products.stock', 'Stock Disponible')}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                            <PackageX className="w-3.5 h-3.5" />
                            <span>{t('products.outOfStock', 'Rupture de stock')}</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{stock} {stock > 1 ? t('products.unitPieces', 'pièces') : t('products.unitPiece', 'pièce')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>{stock} {t('products.unitPieces', 'pièces')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Quick Controls */}
                    {canManageProducts && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStock(prod, -1)}
                          disabled={stock <= 0}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-slate-100 transition"
                          title="-1 pièce"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStock(prod, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-slate-100 transition"
                          title="+1 pièce"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => openStockModal(prod)}
                          className="px-2 py-1 text-[11px] font-bold bg-nasaq-teal-subtle text-nasaq-teal border border-nasaq-teal/30 hover:bg-nasaq-teal hover:text-white rounded-lg transition ml-1"
                          title="Gérer les arrivages ou définir l'inventaire"
                        >
                          {t('products.manageStock', 'Gérer')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10.5px] text-slate-400 font-mono">{t('products.wpcWaterproof', '100% WPC Étanche')}</span>
                  {onOpenStudioWithProduct && (
                    <button
                      type="button"
                      onClick={() => onOpenStudioWithProduct(prod)}
                      className="flex items-center gap-1.5 text-xs font-bold text-nasaq-teal hover:text-nasaq-teal-dark bg-nasaq-teal-subtle/50 hover:bg-nasaq-teal-subtle px-2.5 py-1 rounded-lg transition"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>{t('products.openInStudio', 'Ouvrir dans Studio')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">{t('products.modal.title', 'Ajouter un Modèle au Catalogue')}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.reference', 'Référence (ex: C3, K3) *')}</label>
                  <input 
                    type="text"
                    required
                    placeholder="ex: C3"
                    value={addForm.ref}
                    onChange={(e) => addForm.setRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold uppercase focus:border-nasaq-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.category', 'Catégorie *')}</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => addForm.setCategory(e.target.value as DoorCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none bg-white font-semibold"
                  >
                    <option value="Bedroom">{t('products.category.bedroom', 'Chambre')}</option>
                    <option value="Kitchen">{t('products.category.kitchen', 'Cuisine')}</option>
                    <option value="Bathroom">{t('products.category.bathroom', 'Salle de Bain')}</option>
                    <option value="Custom">{t('products.category.custom', 'Sur-mesure')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.name', 'Nom du Modèle *')}</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: Porte Chambre Deluxe WPC"
                  value={addForm.name}
                  onChange={(e) => addForm.setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.height', 'Hauteur (cm)')}</label>
                  <input 
                    type="number"
                    value={addForm.height}
                    onChange={(e) => addForm.setHeight(Number(e.target.value) || 210)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.width', 'Largeur (cm)')}</label>
                  <input 
                    type="number"
                    value={addForm.width}
                    onChange={(e) => addForm.setWidth(Number(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.thickness', 'Épaisseur (cm)')}</label>
                  <input 
                    type="number"
                    value={addForm.thickness}
                    onChange={(e) => addForm.setThickness(Number(e.target.value) || 4)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Initial Stock Input */}
              <div className="bg-nasaq-teal-subtle/50 p-3 rounded-xl border border-nasaq-teal/20">
                <label className="block font-bold text-nasaq-teal mb-1 flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span>{t('products.modal.stockQuantity', 'Quantité en Stock initiale')}</span>
                </label>
                <input 
                  type="number"
                  min="0"
                  value={addForm.initialStock}
                  onChange={(e) => addForm.setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs border border-nasaq-teal/40 rounded-lg font-mono font-bold text-slate-800 bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Nombre de portes WPC reçues et disponibles en stock atelier/magasin.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.description', 'Description Technique')}</label>
                <textarea 
                  rows={2}
                  placeholder={t('products.modal.descPlaceholder', 'Type de gravure, options de verre...')}
                  value={addForm.desc}
                  onChange={(e) => addForm.setDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={addForm.submitting}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={addForm.submitting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {addForm.submitting ? t('products.modal.creating', 'Création...') : t('products.modal.submit', 'Créer le Modèle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-nasaq-gold" />
                <h3 className="font-bold text-sm">
                  {t('products.modal.editTitle', 'Modifier le Modèle WPC')} ({editingProduct.reference})
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.reference', 'Référence')}</label>
                  <input 
                    type="text"
                    required
                    value={editForm.ref}
                    onChange={(e) => editForm.setRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold uppercase focus:border-nasaq-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.category', 'Catégorie')}</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => editForm.setCategory(e.target.value as DoorCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none bg-white font-semibold"
                  >
                    <option value="Bedroom">{t('products.category.bedroom', 'Chambre')}</option>
                    <option value="Kitchen">{t('products.category.kitchen', 'Cuisine')}</option>
                    <option value="Bathroom">{t('products.category.bathroom', 'Salle de Bain')}</option>
                    <option value="Custom">{t('products.category.custom', 'Sur-mesure')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.name', 'Nom du Modèle')}</label>
                <input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => editForm.setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.height', 'Hauteur (cm)')}</label>
                  <input 
                    type="number"
                    value={editForm.height}
                    onChange={(e) => editForm.setHeight(Number(e.target.value) || 210)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.width', 'Largeur (cm)')}</label>
                  <input 
                    type="number"
                    value={editForm.width}
                    onChange={(e) => editForm.setWidth(Number(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.thickness', 'Épaisseur (cm)')}</label>
                  <input 
                    type="number"
                    value={editForm.thickness}
                    onChange={(e) => editForm.setThickness(Number(e.target.value) || 4)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Stock Quantity in Edit Modal */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-nasaq-teal" />
                  <span>{t('products.modal.editStock', 'Stock Actuel (unités)')}</span>
                </label>
                <input 
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(e) => editForm.setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.description', 'Description Technique')}</label>
                <textarea 
                  rows={2}
                  value={editForm.desc}
                  onChange={(e) => editForm.setDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={editForm.saving}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={editForm.saving}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {editForm.saving ? t('common.saving', 'Enregistrement...') : t('products.modal.saveChanges', 'Enregistrer les Modifications')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Stock Management / Arrival Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">
                  {t('products.manageStock', 'Gérer le Stock')} — {stockAdjustProduct.reference}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setStockAdjustProduct(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyStockAdjustment} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="text-slate-500 font-semibold">{stockAdjustProduct.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock actuel :</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {stockAdjustProduct.stock_quantity ?? 0} {t('products.units', 'unités')}
                  </span>
                </div>
              </div>

              {/* Adjust Mode Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => stockAdjustForm.setMode('add')}
                  className={`py-1.5 text-center font-bold rounded-lg transition ${
                    stockAdjustForm.mode === 'add'
                      ? 'bg-white text-nasaq-teal shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Arrivage reçu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stockAdjustForm.setMode('set');
                    stockAdjustForm.setQuantity(stockAdjustProduct.stock_quantity ?? 0);
                  }}
                  className={`py-1.5 text-center font-bold rounded-lg transition ${
                    stockAdjustForm.mode === 'set'
                      ? 'bg-white text-nasaq-teal shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  = Définir total
                </button>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">
                  {stockAdjustForm.mode === 'add'
                    ? 'Quantité de portes reçues (à ajouter au stock) :'
                    : 'Quantité totale exacte en inventaire :'}
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0"
                    required
                    value={stockAdjustForm.quantity}
                    onChange={(e) => stockAdjustForm.setQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:border-nasaq-teal focus:outline-none"
                  />
                  <span className="text-slate-500 font-semibold shrink-0">{t('products.units', 'unités')}</span>
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-emerald-800">
                <span className="font-medium">Nouveau stock prévu :</span>
                <span className="font-mono font-black text-base">
                  {stockAdjustForm.mode === 'add'
                    ? (stockAdjustProduct.stock_quantity ?? 0) + Number(stockAdjustForm.quantity)
                    : Number(stockAdjustForm.quantity)} {t('products.units', 'unités')}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  disabled={stockAdjustForm.adjusting}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={stockAdjustForm.adjusting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{stockAdjustForm.adjusting ? t('common.saving', 'Enregistrement...') : t('common.confirm', 'Valider')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
