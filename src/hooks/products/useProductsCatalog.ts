import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../api/supabase';
import { DoorProduct, DoorCategory } from '../../types/database';
import { SAMPLE_PRODUCTS } from '../../data/sampleData';
import {
  StockFilterType,
  calculateInventoryStats,
  filterProducts,
  InventoryStats,
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
  const [desc, setDesc] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Stock Adjust form
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // Edit product form
  const [editRef, setEditRef] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<DoorCategory>('Bedroom');
  const [editHeight, setEditHeight] = useState<number>(210);
  const [editWidth, setEditWidth] = useState<number>(90);
  const [editThickness, setEditThickness] = useState<number>(4);
  const [editStock, setEditStock] = useState<number>(0);
  const [editDesc, setEditDesc] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Fetch products from database
  const fetchProducts = useCallback(async () => {
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

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!ref.trim() || !name.trim()) return false;

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
          description: desc.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setProducts((prev) => [...prev, data]);
      setIsAddModalOpen(false);
      setRef('');
      setName('');
      setInitialStock(0);
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
    setEditDesc(prod.description || '');
  };

  // Save Product Edits
  const handleUpdateProduct = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!editingProduct) return false;

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
          description: editDesc.trim() || null,
        })
        .eq('id', editingProduct.id)
        .select()
        .single();

      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data : p)));
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
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, stock_quantity: newQty } : p)));
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

      const { data, error } = await supabase
        .from('door_products')
        .update({ stock_quantity: targetQty })
        .eq('id', stockAdjustProduct.id)
        .select()
        .single();

      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === stockAdjustProduct.id ? data : p)));
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
      alert(err.message || 'Impossible de supprimer ce modèle (peut-être référencé dans des commandes existantes).');
      return false;
    }
  };

  // Seed standard products with upsert
  const handleSeedStandardProducts = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('door_products')
        .upsert(SAMPLE_PRODUCTS, { onConflict: 'reference' })
        .select();

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err: any) {
      console.error('Error seeding products:', err);
      alert(err.message || "Erreur d'initialisation.");
      return false;
    } finally {
      setLoading(false);
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
      desc: editDesc,
      setDesc: setEditDesc,
      saving: savingEdit,
    },

    // Stock Adjust Form
    stockAdjustForm: {
      mode: adjustMode,
      setMode: setAdjustMode,
      quantity: adjustQuantity,
      setQuantity: setAdjustQuantity,
      adjusting,
    },

    // Actions
    fetchProducts,
    handleCreateProduct,
    openEditModal,
    handleUpdateProduct,
    handleQuickAdjustStock,
    openStockModal,
    handleApplyStockAdjustment,
    handleDeleteProduct,
    handleSeedStandardProducts,
  };
}
