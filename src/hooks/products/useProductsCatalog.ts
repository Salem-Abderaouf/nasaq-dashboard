import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../api/supabase';
import { DoorProduct, DoorCategory, StockLogEntry } from '../../types/database';
import {
  StockFilterType,
  calculateInventoryStats,
  filterProducts,
  InventoryStats,
  enrichProductWithMetadata,
  serializeProductDescription,
} from '../../helpers/products/productHelpers';

export function useProductsCatalog() {
  const [products, setProducts] = useState<DoorProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<DoorProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<DoorProduct | null>(null);

  // New product form
  const [ref, setRef] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<DoorCategory>('Bedroom');
  const [height, setHeight] = useState<number>(210);
  const [width, setWidth] = useState<number>(90);
  const [thickness, setThickness] = useState<number>(4);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [selectedColors, setSelectedColors] = useState<string[]>(['chene_bois']);
  const [desc, setDesc] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Stock Adjust form
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(20);
  const [adjustDate, setAdjustDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // Edit product form
  const [editRef, setEditRef] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<DoorCategory>('Bedroom');
  const [editHeight, setEditHeight] = useState<number>(210);
  const [editWidth, setEditWidth] = useState<number>(90);
  const [editThickness, setEditThickness] = useState<number>(4);
  const [editStock, setEditStock] = useState<number>(0);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editDesc, setEditDesc] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Fetch products from database and enrich with metadata
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('door_products')
        .select('*')
        .order('reference');

      if (error) throw error;
      const enriched = (data || []).map(enrichProductWithMetadata);
      setProducts(enriched);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derived filtered products list using helper
  const filteredProducts = useMemo(() => {
    return filterProducts(products, { search, category: categoryFilter, stockFilter });
  }, [products, search, categoryFilter, stockFilter]);

  // Derived stats using helper
  const stats: InventoryStats = useMemo(() => {
    return calculateInventoryStats(products);
  }, [products]);

  // Color selection toggles
  const toggleAddColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
    );
  };

  const toggleEditColor = (colorId: string) => {
    setEditColors((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
    );
  };

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!ref.trim() || !name.trim()) return false;

    setSubmitting(true);
    try {
      const stockQty = Math.max(0, initialStock || 0);
      const initialLogs: StockLogEntry[] = [];
      if (stockQty > 0) {
        initialLogs.push({
          id: `log-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'initial',
          quantity: stockQty,
          previousStock: 0,
          newStock: stockQty,
          reason: 'Création du modèle (Stock initial)',
          timestamp: new Date().toISOString(),
        });
      }

      const serializedDescription = serializeProductDescription(desc, selectedColors, initialLogs);

      const { data, error } = await supabase
        .from('door_products')
        .insert({
          reference: ref.trim().toUpperCase(),
          name: name.trim(),
          category: category,
          height: height,
          width: width,
          thickness: thickness,
          stock_quantity: stockQty,
          description: serializedDescription,
        })
        .select()
        .single();

      if (error) throw error;
      const enriched = enrichProductWithMetadata(data);
      setProducts((prev) => [...prev, enriched]);
      setIsAddModalOpen(false);
      setRef('');
      setName('');
      setInitialStock(0);
      setSelectedColors(['chene_bois']);
      setDesc('');
      return true;
    } catch (err: any) {
      console.error('Error creating product:', err);
      alert(err.message || 'Erreur lors de la création du modèle.');
      return false;
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
    setEditColors(prod.color_options || ['chene_bois']);
    setEditDesc(prod.description || '');
  };

  // Save Product Edits
  const handleUpdateProduct = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!editingProduct) return false;

    setSavingEdit(true);
    try {
      const existingLogs = editingProduct.stock_logs || [];
      const newStockVal = Math.max(0, Number(editStock) || 0);

      // If stock was edited manually in edit modal, log the delta
      const currentStock = editingProduct.stock_quantity ?? 0;
      let updatedLogs = existingLogs;
      if (newStockVal !== currentStock) {
        const delta = newStockVal - currentStock;
        updatedLogs = [
          {
            id: `log-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'adjustment',
            quantity: delta,
            previousStock: currentStock,
            newStock: newStockVal,
            reason: 'Ajustement manuel fiche produit',
            timestamp: new Date().toISOString(),
          },
          ...existingLogs,
        ];
      }

      const serializedDescription = serializeProductDescription(editDesc, editColors, updatedLogs);

      const { data, error } = await supabase
        .from('door_products')
        .update({
          reference: editRef.trim().toUpperCase(),
          name: editName.trim(),
          category: editCategory,
          height: editHeight,
          width: editWidth,
          thickness: editThickness,
          stock_quantity: newStockVal,
          description: serializedDescription,
        })
        .eq('id', editingProduct.id)
        .select()
        .single();

      if (error) throw error;
      const enriched = enrichProductWithMetadata(data);
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? enriched : p)));
      setEditingProduct(null);
      return true;
    } catch (err: any) {
      console.error('Error updating product:', err);
      alert(err.message || 'Erreur lors de la mise à jour du modèle.');
      return false;
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Stock Modal
  const openStockModal = (prod: DoorProduct) => {
    setStockAdjustProduct(prod);
    setAdjustMode('add');
    setAdjustQuantity(20);
    setAdjustDate(new Date().toISOString().split('T')[0]);
    setAdjustReason('');
  };

  // Submit Stock Adjustment with detailed date & reason logging
  const handleApplyStockAdjustment = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!stockAdjustProduct) return false;

    setAdjusting(true);
    try {
      const current = stockAdjustProduct.stock_quantity ?? 0;
      const targetQty =
        adjustMode === 'add'
          ? Math.max(0, current + Number(adjustQuantity))
          : Math.max(0, Number(adjustQuantity));

      const delta = adjustMode === 'add' ? Number(adjustQuantity) : Number(adjustQuantity) - current;
      const formattedDate = adjustDate || new Date().toISOString().split('T')[0];
      const defaultReason =
        adjustMode === 'add'
          ? `Arrivage de ${adjustQuantity} unité(s)`
          : `Inventaire ajusté à ${targetQty} unité(s)`;

      const newLogEntry: StockLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: formattedDate,
        type: adjustMode === 'add' ? 'arrival' : 'adjustment',
        quantity: delta,
        previousStock: current,
        newStock: targetQty,
        reason: adjustReason.trim() || defaultReason,
        timestamp: new Date().toISOString(),
      };

      const updatedLogs = [newLogEntry, ...(stockAdjustProduct.stock_logs || [])];
      const serializedDescription = serializeProductDescription(
        stockAdjustProduct.description || '',
        stockAdjustProduct.color_options || [],
        updatedLogs
      );

      const { data, error } = await supabase
        .from('door_products')
        .update({
          stock_quantity: targetQty,
          description: serializedDescription,
        })
        .eq('id', stockAdjustProduct.id)
        .select()
        .single();

      if (error) throw error;
      const enriched = enrichProductWithMetadata(data);
      setProducts((prev) => prev.map((p) => (p.id === stockAdjustProduct.id ? enriched : p)));
      setStockAdjustProduct(null);
      return true;
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      alert(err.message || 'Erreur lors de la mise à jour du stock.');
      return false;
    } finally {
      setAdjusting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod: DoorProduct): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('door_products')
        .delete()
        .eq('id', prod.id);

      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      return true;
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.message || 'Impossible de supprimer ce modèle.');
      return false;
    }
  };

  return {
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

    // Modals
    isAddModalOpen,
    setIsAddModalOpen,
    editingProduct,
    setEditingProduct,
    stockAdjustProduct,
    setStockAdjustProduct,

    // Add Form
    addForm: {
      ref,
      setRef,
      name,
      setName,
      category,
      setCategory,
      height,
      setHeight,
      width,
      setWidth,
      thickness,
      setThickness,
      initialStock,
      setInitialStock,
      selectedColors,
      toggleColor: toggleAddColor,
      desc,
      setDesc,
      submitting,
    },

    // Edit Form
    editForm: {
      ref: editRef,
      setRef: setEditRef,
      name: editName,
      setName: setEditName,
      category: editCategory,
      setCategory: setEditCategory,
      height: editHeight,
      setHeight: setEditHeight,
      width: editWidth,
      setWidth: setEditWidth,
      thickness: editThickness,
      setThickness: setEditThickness,
      stock: editStock,
      setStock: setEditStock,
      colors: editColors,
      toggleColor: toggleEditColor,
      desc: editDesc,
      setDesc: setEditDesc,
      saving: savingEdit,
    },

    // Stock Adjust Form & Log
    stockAdjustForm: {
      mode: adjustMode,
      setMode: setAdjustMode,
      quantity: adjustQuantity,
      setQuantity: setAdjustQuantity,
      date: adjustDate,
      setDate: setAdjustDate,
      reason: adjustReason,
      setReason: setAdjustReason,
      adjusting,
    },

    // Actions
    fetchProducts,
    handleCreateProduct,
    openEditModal,
    handleUpdateProduct,
    openStockModal,
    handleApplyStockAdjustment,
    handleDeleteProduct,
  };
}
