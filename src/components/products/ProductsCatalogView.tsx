import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { DoorProduct, DoorCategory } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Layers, 
  Search, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  DoorOpen, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleData';

interface ProductsCatalogViewProps {
  onOpenStudioWithProduct?: (prod: DoorProduct) => void;
}

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  onOpenStudioWithProduct
}) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<DoorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product form
  const [ref, setRef] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DoorCategory>('Bedroom');
  const [height, setHeight] = useState(210);
  const [width, setWidth] = useState(90);
  const [thickness, setThickness] = useState(4);
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('door_products').select('*').order('reference');
      if (search) {
        query = query.or(`reference.ilike.%${search}%,name.ilike.%${search}%`);
      }
      if (categoryFilter !== 'All') {
        query = query.eq('category', categoryFilter);
      }
      const { data, error } = await query;
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
  }, [search, categoryFilter]);

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
          description: desc.trim() || null
        })
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => [...prev, data]);
      setIsAddModalOpen(false);
      setRef('');
      setName('');
      setDesc('');
    } catch (err: any) {
      console.error('Error creating product:', err);
      alert(err.message || t('common.error', 'Erreur lors de la création du modèle.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Seed standard products if empty
  const handleSeedStandardProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('door_products')
        .insert(SAMPLE_PRODUCTS)
        .select();

      if (error) throw error;
      setProducts(data || []);
      alert(t('products.seedSuccess', 'Catalogue initialisé avec les modèles de référence WPC !'));
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
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            {t('products.title', 'Catalogue des Modèles Portes WPC')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('products.subtitle', 'Références certifiées NASAQ (Cuisine, Chambre, Salle de bain) et modèles sur mesure')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {products.length === 0 && (
            <button
              type="button"
              onClick={handleSeedStandardProducts}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-nasaq-gold/20 hover:bg-nasaq-gold/30 text-nasaq-gold-dark border border-nasaq-gold/40 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('products.loadStandard', 'Charger Catalogue Standard')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Actualiser')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('products.newProduct', 'Nouveau Modèle')}</span>
          </button>
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
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
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-nasaq-teal text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            {t('products.loading', 'Chargement des modèles de portes...')}
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
            {t('products.empty', 'Aucun modèle dans le catalogue. Cliquez sur "Charger Catalogue Standard" pour insérer les modèles officiels.')}
          </div>
        ) : (
          products.map(prod => {
            const catLabel = prod.category === 'Bedroom' ? t('products.category.bedroom', 'Chambre')
              : prod.category === 'Kitchen' ? t('products.category.kitchen', 'Cuisine')
              : prod.category === 'Bathroom' ? t('products.category.bathroom', 'SDB')
              : t('products.category.custom', 'Sur-mesure');

            return (
              <div 
                key={prod.id}
                className="bg-white border border-slate-200 hover:border-nasaq-teal-light rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-nasaq-teal-subtle text-nasaq-teal">
                      {prod.reference}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {catLabel}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="font-bold text-slate-900 text-sm">{prod.name}</h3>
                    <div className="text-[11px] font-mono text-slate-500 font-medium mt-1">
                      {t('products.dimensions', 'Cotes Standards :')} {prod.height} × {prod.width} cm • {t('products.thickness', 'Épaisseur :')} {prod.thickness} cm
                    </div>
                    {prod.description && (
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
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
                      className="flex items-center gap-1 text-[11px] font-bold text-nasaq-teal hover:underline"
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

      {/* Add Product Modal */}
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
    </div>
  );
};
