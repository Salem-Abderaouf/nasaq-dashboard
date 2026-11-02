import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../api/supabase';
import { DoorProduct, DoorCategory } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
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
  Check,
  TrendingUp
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleData';

interface ProductsCatalogViewProps {
  onOpenStudioWithProduct?: (prod: DoorProduct) => void;
}

type StockFilterType = 'All' | 'in_stock' | 'low_stock' | 'out_of_stock';

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  onOpenStudioWithProduct
}) => {
  const { t } = useLanguage();
  const { hasPermission, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManageProducts = isAdmin || hasPermission('canCreateOrders');

  const [products, setProducts] = useState<DoorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DoorProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<DoorProduct | null>(null);

  // New product form
  const [ref, setRef] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DoorCategory>('Bedroom');
  const [height, setHeight] = useState(210);
  const [width, setWidth] = useState(90);
  const [thickness, setThickness] = useState(4);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stock Adjust form
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjusting, setAdjusting] = useState(false);

  // Edit product form
  const [editRef, setEditRef] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<DoorCategory>('Bedroom');
  const [editHeight, setEditHeight] = useState(210);
  const [editWidth, setEditWidth] = useState(90);
  const [editThickness, setEditThickness] = useState(4);
  const [editStock, setEditStock] = useState<number>(0);
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('door_products')
        .select('*')
        .order('reference');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = prod.reference.toLowerCase().includes(q);
        const matchName = prod.name.toLowerCase().includes(q);
        const matchDesc = prod.description?.toLowerCase().includes(q);
        if (!matchRef && !matchName && !matchDesc) return false;
      }
      // Category
      if (categoryFilter !== 'All' && prod.category !== categoryFilter) {
        return false;
      }
      // Stock
      const stock = prod.stock_quantity ?? 0;
      if (stockFilter === 'in_stock' && stock <= 0) return false;
      if (stockFilter === 'low_stock' && (stock <= 0 || stock > 5)) return false;
      if (stockFilter === 'out_of_stock' && stock > 0) return false;

      return true;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Overall Inventory Stats
  const totalModels = products.length;
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock_quantity ?? 0), 0);
  }, [products]);
  const inStockCount = useMemo(() => {
    return products.filter(p => (p.stock_quantity ?? 0) > 0).length;
  }, [products]);
  const lowStockCount = useMemo(() => {
    return products.filter(p => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= 5).length;
  }, [products]);
  const outOfStockCount = useMemo(() => {
    return products.filter(p => (p.stock_quantity ?? 0) <= 0).length;
  }, [products]);

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref.trim() || !name.trim()) {
      alert(t('common.required', 'Référence et nom requis.'));
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('door_products')
        .insert({
          reference: ref.trim().toUpperCase(),
          name: name.trim(),
          category: category,
          height: height,
          width: width,
          thickness: thickness,
          stock_quantity: Math.max(0, initialStock || 0),
          description: desc.trim() || null
        })
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => [...prev, data]);
      setIsAddModalOpen(false);
      setRef('');
      setName('');
      setInitialStock(0);
      setDesc('');
    } catch (err: any) {
      console.error('Error creating product:', err);
      alert(err.message || t('common.error', 'Erreur lors de la création du modèle.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (prod: DoorProduct) => {
    setEditingProduct(prod);
    setEditRef(prod.reference);
    setEditName(prod.name);
    setEditCategory((prod.category as DoorCategory) || 'Bedroom');
    setEditHeight(prod.height || 210);
    setEditWidth(prod.width || 90);
    setEditThickness(prod.thickness || 4);
    setEditStock(prod.stock_quantity ?? 0);
    setEditDesc(prod.description || '');
  };

  // Save Product Edits
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    try {
      const { data, error } = await supabase
        .from('door_products')
        .update({
          reference: editRef.trim().toUpperCase(),
          name: editName.trim(),
          category: editCategory,
          height: editHeight,
          width: editWidth,
          thickness: editThickness,
          stock_quantity: Math.max(0, Number(editStock) || 0),
          description: editDesc.trim() || null
        })
        .eq('id', editingProduct.id)
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p));
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Error updating product:', err);
      alert(err.message || t('common.error', 'Erreur lors de la mise à jour du modèle.'));
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick delta adjustment (+1 / -1)
  const handleQuickAdjustStock = async (prod: DoorProduct, delta: number) => {
    const current = prod.stock_quantity ?? 0;
    const newQty = Math.max(0, current + delta);
    if (newQty === current) return;

    try {
      const { error } = await supabase
        .from('door_products')
        .update({ stock_quantity: newQty })
        .eq('id', prod.id);

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, stock_quantity: newQty } : p));
    } catch (err) {
      console.error('Error quick adjusting stock:', err);
    }
  };

  // Open Stock Modal
  const openStockModal = (prod: DoorProduct) => {
    setStockAdjustProduct(prod);
    setAdjustMode('add');
    setAdjustQuantity(10);
  };

  // Submit Stock Adjustment
  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;

    setAdjusting(true);
    try {
      const current = stockAdjustProduct.stock_quantity ?? 0;
      const targetQty = adjustMode === 'add' 
        ? Math.max(0, current + Number(adjustQuantity))
        : Math.max(0, Number(adjustQuantity));

      const { data, error } = await supabase
        .from('door_products')
        .update({ stock_quantity: targetQty })
        .eq('id', stockAdjustProduct.id)
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === stockAdjustProduct.id ? data : p));
      setStockAdjustProduct(null);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      alert(err.message || t('common.error', 'Erreur lors de la mise à jour du stock.'));
    } finally {
      setAdjusting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod: DoorProduct) => {
    if (!confirm(t('products.confirmDelete', 'Êtes-vous sûr de vouloir supprimer ce modèle du catalogue ?'))) return;

    try {
      const { error } = await supabase
        .from('door_products')
        .delete()
        .eq('id', prod.id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== prod.id));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.message || t('common.error', 'Impossible de supprimer ce modèle (peut-être référencé dans des commandes existantes).'));
    }
  };

  // Seed standard products with upsert
  const handleSeedStandardProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('door_products')
        .upsert(SAMPLE_PRODUCTS, { onConflict: 'reference' })
        .select();

      if (error) throw error;
      await fetchProducts();
      alert(t('products.seedSuccess', 'Catalogue initialisé avec les modèles de référence WPC et stocks !'));
    } catch (err: any) {
      console.error('Error seeding products:', err);
      alert(err.message || t('common.error', 'Erreur d\'initialisation.'));
    } finally {
      setLoading(false);
    }
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
            onClick={handleSeedStandardProducts}
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
              {totalStockUnits} <span className="text-xs font-normal text-slate-500 font-sans">{t('products.units', 'unités')}</span>
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
              {totalModels}
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
              {inStockCount} <span className="text-xs font-normal text-slate-400 font-sans">/ {totalModels}</span>
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
              {outOfStockCount} <span className="text-xs font-semibold text-amber-500 font-sans">+ {lowStockCount} bas</span>
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
                          onClick={() => handleDeleteProduct(prod)}
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
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold uppercase focus:border-nasaq-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.category', 'Catégorie *')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DoorCategory)}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.height', 'Hauteur (cm)')}</label>
                  <input 
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value) || 210)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.width', 'Largeur (cm)')}</label>
                  <input 
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.thickness', 'Épaisseur (cm)')}</label>
                  <input 
                    type="number"
                    value={thickness}
                    onChange={(e) => setThickness(Number(e.target.value) || 4)}
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
                  value={initialStock}
                  onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
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
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submitting ? t('products.modal.creating', 'Création...') : t('products.modal.submit', 'Créer le Modèle')}
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
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold uppercase focus:border-nasaq-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.category', 'Catégorie')}</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as DoorCategory)}
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.height', 'Hauteur (cm)')}</label>
                  <input 
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(Number(e.target.value) || 210)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.width', 'Largeur (cm)')}</label>
                  <input 
                    type="number"
                    value={editWidth}
                    onChange={(e) => setEditWidth(Number(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.thickness', 'Épaisseur (cm)')}</label>
                  <input 
                    type="number"
                    value={editThickness}
                    onChange={(e) => setEditThickness(Number(e.target.value) || 4)}
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
                  value={editStock}
                  onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('products.modal.description', 'Description Technique')}</label>
                <textarea 
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {savingEdit ? t('common.saving', 'Enregistrement...') : t('products.modal.saveChanges', 'Enregistrer les Modifications')}
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
                  onClick={() => setAdjustMode('add')}
                  className={`py-1.5 text-center font-bold rounded-lg transition ${
                    adjustMode === 'add'
                      ? 'bg-white text-nasaq-teal shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Arrivage reçu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('set');
                    setAdjustQuantity(stockAdjustProduct.stock_quantity ?? 0);
                  }}
                  className={`py-1.5 text-center font-bold rounded-lg transition ${
                    adjustMode === 'set'
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
                  {adjustMode === 'add'
                    ? 'Quantité de portes reçues (à ajouter au stock) :'
                    : 'Quantité totale exacte en inventaire :'}
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0"
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:border-nasaq-teal focus:outline-none"
                  />
                  <span className="text-slate-500 font-semibold shrink-0">{t('products.units', 'unités')}</span>
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-emerald-800">
                <span className="font-medium">Nouveau stock prévu :</span>
                <span className="font-mono font-black text-base">
                  {adjustMode === 'add'
                    ? (stockAdjustProduct.stock_quantity ?? 0) + Number(adjustQuantity)
                    : Number(adjustQuantity)} {t('products.units', 'unités')}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  disabled={adjusting}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{adjusting ? t('common.saving', 'Enregistrement...') : t('common.confirm', 'Valider')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
