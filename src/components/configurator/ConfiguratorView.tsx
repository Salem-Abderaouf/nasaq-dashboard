import React, { useState, useEffect, useCallback } from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { ConfigSidebar } from './ConfigSidebar';
import { TechnicalDrawingsSheet } from './TechnicalDrawingsSheet';
import { InvoiceStandardSheet } from './InvoiceStandardSheet';
import { InvoicePromoSheet } from './InvoicePromoSheet';
import { InvoiceAtelierSheet } from './InvoiceAtelierSheet';
import { downloadDossierZIP } from '../../utils/exportUtils';
import { supabase } from '../../api/supabase';
import { Client, Order } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, AlertCircle, Sliders, Eye } from 'lucide-react';

const STORAGE_KEY_DOORS = 'nasaq_dashboard_doors_state';
const STORAGE_KEY_INFO = 'nasaq_dashboard_info_state';

interface ConfiguratorViewProps {
  onOrderSaved?: () => void;
  orderToEdit?: Order | null;
  onClearOrderToEdit?: () => void;
}

export const ConfiguratorView: React.FC<ConfiguratorViewProps> = ({ 
  onOrderSaved, 
  orderToEdit,
  onClearOrderToEdit 
}) => {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'drawings' | 'normal' | 'promo' | 'atelier'>('drawings');
  
  // Default to empty fresh canvas unless resuming an active editing order
  const [doors, setDoors] = useState<DoorConfigItem[]>(() => {
    try {
      const savedInfo = localStorage.getItem(STORAGE_KEY_INFO);
      const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;
      if (parsedInfo?.editingOrderId) {
        const saved = localStorage.getItem(STORAGE_KEY_DOORS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [info, setInfo] = useState<StudioGeneralInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.editingOrderId) return parsed;
      }
    } catch {}
    return {
      clientName: '',
      docRef: '',
      docDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      paidAmount: 0,
      isPromoEnabled: false,
      isPoseEnabled: true,
      isTransportEnabled: true,
      scale: 0.60,
      gridGap: 20
    };
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load next DB order sequence number
  const fetchNextOrderNumber = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_next_order_number');
      if (data && !error && typeof data === 'string') {
        return data;
      }
    } catch (e) {
      console.warn('Could not fetch next order number from RPC:', e);
    }
    // Fallback: query last registered order
    try {
      const { data } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data[0]?.order_number) {
        const parts = data[0].order_number.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10) || 1000;
        return `ORD-${new Date().getFullYear()}-${String(lastSeq + 1).padStart(5, '0')}`;
      }
    } catch {}
    return `ORD-${new Date().getFullYear()}-01010`;
  }, []);

  // Fetch clients from Supabase
  const loadClients = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (data && !error) setClients(data);
    } catch (err) {
      console.warn('Could not fetch clients from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Auto-sync next order number from DB if starting a new blank order
  useEffect(() => {
    if (!info.editingOrderId && (!info.docRef || info.docRef.startsWith('DEV-') || !info.docRef.startsWith('ORD-'))) {
      fetchNextOrderNumber().then(num => {
        setInfo(prev => ({ ...prev, docRef: num }));
      });
    }
  }, [info.editingOrderId, info.docRef, fetchNextOrderNumber]);

  // Fetch registered orders from Supabase for selector
  const fetchDbOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          order_items (*)
        `)
        .order('created_at', { ascending: false });
      if (data) setDbOrders(data);
    } catch (err) {
      console.warn('Could not fetch registered orders:', err);
    }
  }, []);

  useEffect(() => {
    fetchDbOrders();
  }, [fetchDbOrders]);

  // Load registered order from Supabase into studio for editing
  const loadOrderForEditing = useCallback(async (orderId: string) => {
    try {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          order_items (*, door_products (*))
        `)
        .eq('id', orderId)
        .single();

      if (error || !orderData) {
        throw (error || new Error('Commande introuvable dans la base de données.'));
      }

      // Reconstruct DoorConfigItem[] from DB order_items
      const loadedDoors: DoorConfigItem[] = (orderData.order_items || []).map((item: any, idx: number) => {
        const cfg = item.configuration || {};
        return {
          id: cfg.id || `P${idx + 1}`,
          heightCm: Number(item.height) || Number(cfg.heightCm) || 210,
          widthCm: Number(item.width) || Number(cfg.widthCm) || 85,
          designation: cfg.designation || item.door_products?.name || "Porte d'intérieur WPC",
          priceNormal: Number(cfg.priceNormal) || Number(item.unit_price) || 39800,
          pricePromo: Number(cfg.pricePromo) || (cfg.priceNormal ? Number(cfg.priceNormal) - 2800 : Number(item.unit_price)) || 37000,
          colorId: item.color || cfg.colorId || "chene_bois",
          patternId: cfg.patternId || "none",
          doorStructure: (cfg.doorStructure === 'double' ? 'double' : 'single'),
          leftLeafPercent: cfg.leftLeafPercent ?? 28,
          hardwareColor: (cfg.hardwareColor === 'chrome' ? 'chrome' : 'black'),
          glassPanes: Array.isArray(cfg.glassPanes) ? cfg.glassPanes : [],
          hasRevetment: Boolean(cfg.hasRevetment),
          revetmentHeightCm: Number(cfg.revetmentHeightCm) || 110,
        };
      });

      setDoors(loadedDoors);
      setInfo({
        editingOrderId: orderData.id,
        orderNumber: orderData.order_number,
        clientName: orderData.clients?.name || '',
        clientId: orderData.client_id,
        clientPhone: orderData.clients?.phone || '',
        clientAddress: orderData.clients?.address || '',
        docRef: orderData.order_number || `ORD-${orderData.id.slice(0, 8)}`,
        docDate: orderData.created_at 
          ? new Date(orderData.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('fr-FR'),
        paidAmount: Number(orderData.paid_amount) || 0,
        isPromoEnabled: orderData.is_promo_enabled ?? true,
        isPoseEnabled: orderData.notes ? !orderData.notes.includes('Pose: NON') : true,
        isTransportEnabled: orderData.notes ? !orderData.notes.includes('Transport: NON') : true,
        scale: 0.60,
        gridGap: 20
      });

      showToast(`Commande ${orderData.order_number} chargée (${loadedDoors.length} portes).`, 'success');
    } catch (err: any) {
      console.error('Error loading order for editing:', err);
      showToast(`Erreur lors du chargement : ${err.message || 'Impossible de charger la commande.'}`, 'error');
    }
  }, []);

  // Sync if orderToEdit prop changed
  useEffect(() => {
    if (orderToEdit && orderToEdit.id) {
      loadOrderForEditing(orderToEdit.id);
    }
  }, [orderToEdit, loadOrderForEditing]);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOORS, JSON.stringify(doors));
      localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(info));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [doors, info]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const updateInfo = (updates: Partial<StudioGeneralInfo>) => {
    setInfo(prev => ({ ...prev, ...updates }));
  };

  const updateDoor = (index: number, updates: Partial<DoorConfigItem>) => {
    setDoors(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const addDoor = () => {
    const nextNum = doors.length + 1;
    const newDoor: DoorConfigItem = {
      id: `P${nextNum}`,
      heightCm: 210,
      widthCm: 85,
      designation: "Porte d'intérieur WPC",
      priceNormal: 39800,
      pricePromo: 37000,
      colorId: "chene_bois",
      patternId: "none",
      doorStructure: "single",
      leftLeafPercent: 28,
      hardwareColor: "black",
      glassPanes: [],
      hasRevetment: false,
      revetmentHeightCm: 110
    };
    setDoors(prev => [...prev, newDoor]);
  };

  const deleteDoor = (index: number) => {
    setDoors(prev => {
      const copy = prev.filter((_, i) => i !== index);
      return copy.map((d, i) => ({ ...d, id: `P${i + 1}` }));
    });
  };

  // Reset to clean fresh canvas
  const resetEmpty = async () => {
    const nextNum = await fetchNextOrderNumber();
    setDoors([]);
    setInfo({
      clientName: '',
      clientId: undefined,
      clientPhone: undefined,
      clientAddress: undefined,
      editingOrderId: undefined,
      orderNumber: undefined,
      docRef: nextNum,
      docDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      paidAmount: 0,
      isPromoEnabled: false,
      isPoseEnabled: true,
      isTransportEnabled: true,
      scale: 0.60,
      gridGap: 20
    });
    try {
      localStorage.removeItem(STORAGE_KEY_DOORS);
      localStorage.removeItem(STORAGE_KEY_INFO);
    } catch {}
    if (onClearOrderToEdit) onClearOrderToEdit();
    showToast(`Nouveau projet vierge initialisé (${nextNum}).`, 'success');
  };

  // Save to Supabase (creates new order or updates existing registered order)
  const handleSaveToSupabase = async () => {
    if (doors.length === 0) {
      alert('Veuillez ajouter au moins une porte avant d\'enregistrer.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Resolve client_id or create client
      let clientId = info.clientId;
      const clientName = (info.clientName || 'Client Showroom').trim();

      if (!clientId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', clientName)
          .limit(1);

        if (existing && existing.length > 0) {
          clientId = existing[0].id;
        } else {
          const { data: newClient, error: clientErr } = await supabase
            .from('clients')
            .insert({
              name: clientName,
              phone: '0550 00 00 00',
              address: 'Adresse client configurateur',
              notes: `Créé depuis le studio de configuration (${info.docRef})`
            })
            .select()
            .single();

          if (clientErr) throw clientErr;
          clientId = newClient.id;
        }
      }

      // 2. Ensure door_products reference exists or use default
      let defaultProductId: string | null = null;
      const { data: products } = await supabase.from('door_products').select('id, reference').limit(1);
      if (products && products.length > 0) {
        defaultProductId = products[0].id;
      } else {
        const { data: newProd, error: prodErr } = await supabase
          .from('door_products')
          .insert({
            reference: 'C1',
            name: "Porte d'intérieur WPC Standard",
            category: 'Bedroom',
            height: 210,
            width: 90,
            thickness: 4,
            description: 'Référence de base WPC'
          })
          .select()
          .single();

        if (!prodErr && newProd) {
          defaultProductId = newProd.id;
        }
      }

      // Calculate totals
      let subtotal = 0;
      doors.forEach(d => {
        subtotal += (info.isPromoEnabled ? d.pricePromo : d.priceNormal);
      });
      const poseCost = info.isPoseEnabled ? doors.reduce((acc, d) => acc + (d.doorStructure === 'double' ? 6000 : 5000), 0) : 0;
      const transportCost = info.isTransportEnabled && doors.length > 0 ? 3000 : 0;
      const grandTotal = subtotal + poseCost + transportCost;

      const orderNotes = `Généré via Studio Configuration. Réf: ${info.docRef}. Pose: ${info.isPoseEnabled ? 'OUI' : 'NON'}, Transport: ${info.isTransportEnabled ? 'OUI' : 'NON'}`;

      let targetOrderId = info.editingOrderId;
      let orderNumber = info.orderNumber;

      if (info.editingOrderId) {
        // UPDATE existing order in Supabase
        const { data: updatedOrder, error: updateErr } = await supabase
          .from('orders')
          .update({
            client_id: clientId,
            total_amount: grandTotal,
            paid_amount: info.paidAmount,
            is_promo_enabled: info.isPromoEnabled,
            notes: orderNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', info.editingOrderId)
          .select()
          .single();

        if (updateErr) throw updateErr;
        orderNumber = updatedOrder.order_number;

        // Delete old order_items and replace with updated doors
        await supabase.from('order_items').delete().eq('order_id', info.editingOrderId);
      } else {
        // INSERT new order in Supabase
        const { data: newOrder, error: orderErr } = await supabase
          .from('orders')
          .insert({
            client_id: clientId,
            status: 'confirmed',
            total_amount: grandTotal,
            paid_amount: info.paidAmount,
            is_promo_enabled: info.isPromoEnabled,
            notes: orderNotes
          })
          .select()
          .single();

        if (orderErr) throw orderErr;
        targetOrderId = newOrder.id;
        orderNumber = newOrder.order_number;

        setInfo(prev => ({
          ...prev,
          editingOrderId: newOrder.id,
          orderNumber: newOrder.order_number,
          docRef: newOrder.order_number
        }));

        // If deposit entered for new order, record payment
        if (info.paidAmount > 0) {
          await supabase.from('order_payments').insert({
            order_id: newOrder.id,
            amount: info.paidAmount,
            notes: `Acompte versé à la commande (${newOrder.order_number || info.docRef})`,
            status: 'successful'
          });
        }
      }

      // Insert updated door items
      if (defaultProductId && targetOrderId) {
        const orderItemsPayload = doors.map(d => ({
          order_id: targetOrderId,
          product_id: defaultProductId,
          quantity: 1,
          unit_price: info.isPromoEnabled ? d.pricePromo : d.priceNormal,
          total_price: info.isPromoEnabled ? d.pricePromo : d.priceNormal,
          height: d.heightCm,
          width: d.widthCm,
          thickness: 4,
          color: d.colorId,
          configuration: d
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsErr) console.warn('Order items insert error:', itemsErr);
      }

      showToast(`Commande ${orderNumber || info.docRef} ${info.editingOrderId ? 'mise à jour' : 'enregistrée'} avec succès dans Supabase !`, 'success');
      fetchDbOrders();
      if (onOrderSaved) onOrderSaved();
    } catch (err: any) {
      console.error('Supabase Save Error:', err);
      showToast(`Erreur lors de l'enregistrement : ${err.message || 'Vérifiez la connexion.'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Download entire dossier as ZIP
  const handleDownloadZip = async () => {
    const tabsToExport = [
      { id: 'drawings-export-sheet', tabLabel: 'Dessins 2D' },
      { id: 'invoice-normal-export', tabLabel: 'Facture Client' },
    ];
    if (info.isPromoEnabled) {
      tabsToExport.push({ id: 'invoice-promo-export', tabLabel: 'Tarif Promotionnel' });
    }
    tabsToExport.push({ id: 'invoice-atelier-export', tabLabel: 'Fiche Atelier' });

    await downloadDossierZIP(
      tabsToExport,
      info.clientName,
      (targetSheetId) => {
        if (targetSheetId === 'drawings-export-sheet') setActiveTab('drawings');
        else if (targetSheetId === 'invoice-normal-export') setActiveTab('normal');
        else if (targetSheetId === 'invoice-promo-export') setActiveTab('promo');
        else if (targetSheetId === 'invoice-atelier-export') setActiveTab('atelier');
      }
    );
  };

  const [mobilePanel, setMobilePanel] = useState<'config' | 'preview'>('config');

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden relative">
      {/* Mobile Top View Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden bg-nasaq-teal-dark border-b border-slate-700/80 p-2 px-3 flex items-center justify-between gap-2 shrink-0 z-30 shadow-md">
        <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobilePanel('config')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
              mobilePanel === 'config'
                ? 'bg-nasaq-gold text-slate-900 shadow-sm'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Options & Portes ({doors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobilePanel('preview')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
              mobilePanel === 'preview'
                ? 'bg-nasaq-gold text-slate-900 shadow-sm'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu Devis & 2D</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white transition-all transform animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: Full height independent scroll */}
      <div className={`${mobilePanel === 'config' ? 'block' : 'hidden'} lg:block h-full shrink-0`}>
        <ConfigSidebar
          doors={doors}
          info={info}
          clients={clients}
          orders={dbOrders}
          onSelectOrderToEdit={loadOrderForEditing}
          onRefreshClients={loadClients}
          onUpdateInfo={updateInfo}
          onUpdateDoor={updateDoor}
          onAddDoor={addDoor}
          onDeleteDoor={deleteDoor}
          onResetEmpty={resetEmpty}
          onSaveToSupabase={handleSaveToSupabase}
          onDownloadZip={handleDownloadZip}
          isSaving={isSaving}
        />
      </div>

      {/* RIGHT MAIN WORKSPACE */}
      <div className={`${mobilePanel === 'preview' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col h-full overflow-y-auto bg-slate-100`}>
        
        {/* Active Edit Mode Alert Banner */}
        {info.editingOrderId && (
          <div className="bg-amber-500 text-slate-900 px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-amber-600 no-print shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-amber-400 font-mono px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                {t('config.modeEdit', 'MODE MODIFICATION COMMANDE')}
              </span>
              <span>
                {t('common.status', 'Commande')} : <strong className="font-mono">{info.orderNumber || info.docRef}</strong> — {t('common.client', 'Client')} : <strong>{info.clientName || 'Inconnu'}</strong> ({doors.length} {t('config.doorsCount', 'porte(s)')})
              </span>
            </div>
            <button
              type="button"
              onClick={resetEmpty}
              className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <span>✕</span> {t('config.modeEditExit', 'Quitter et Nouveau Vierge')}
            </button>
          </div>
        )}

        {/* Sticky Tabs Navigation */}
        <nav className="sticky top-0 z-30 bg-nasaq-teal shadow-md border-b border-white/10 no-print">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 p-2 px-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('drawings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'drawings'
                  ? 'bg-nasaq-gold text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📐</span> {t('config.tabDrawings', 'Dessins 2D')} ({doors.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('normal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'normal'
                  ? 'bg-nasaq-gold text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>💰</span> {t('config.tabInvoiceNormal', 'Facture Client')}
            </button>

            {info.isPromoEnabled && (
              <button
                type="button"
                onClick={() => setActiveTab('promo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'promo'
                    ? 'bg-nasaq-gold text-white shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🎁</span> {t('config.tabInvoicePromo', 'Tarif Promo')}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('atelier')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'atelier'
                  ? 'bg-nasaq-gold text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🔨</span> {t('config.tabInvoiceAtelier', 'Fiche Atelier (Sans Prix)')}
            </button>
          </div>
        </nav>

        {/* Tab Content Panels */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-16">
          {activeTab === 'drawings' && (
            <TechnicalDrawingsSheet 
              doors={doors} 
              info={info} 
              onAddDoor={addDoor}
            />
          )}

          {activeTab === 'normal' && (
            <InvoiceStandardSheet doors={doors} info={info} />
          )}

          {activeTab === 'promo' && info.isPromoEnabled && (
            <InvoicePromoSheet doors={doors} info={info} />
          )}

          {activeTab === 'atelier' && (
            <InvoiceAtelierSheet doors={doors} info={info} />
          )}
        </main>
      </div>
    </div>
  );
};
