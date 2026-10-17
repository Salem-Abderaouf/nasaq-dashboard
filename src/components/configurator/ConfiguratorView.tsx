import React, { useState, useEffect } from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { DEFAULT_21_DOORS } from '../../data/defaultDoors';
import { ConfigSidebar } from './ConfigSidebar';
import { TechnicalDrawingsSheet } from './TechnicalDrawingsSheet';
import { InvoiceStandardSheet } from './InvoiceStandardSheet';
import { InvoicePromoSheet } from './InvoicePromoSheet';
import { InvoiceAtelierSheet } from './InvoiceAtelierSheet';
import { downloadDossierZIP } from '../../utils/exportUtils';
import { supabase } from '../../api/supabase';
import { Client } from '../../types/database';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEY_DOORS = 'nasaq_dashboard_doors_state';
const STORAGE_KEY_INFO = 'nasaq_dashboard_info_state';

interface ConfiguratorViewProps {
  onOrderSaved?: () => void;
}

export const ConfiguratorView: React.FC<ConfiguratorViewProps> = ({ onOrderSaved }) => {
  const [activeTab, setActiveTab] = useState<'drawings' | 'normal' | 'promo' | 'atelier'>('drawings');
  const [doors, setDoors] = useState<DoorConfigItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_21_DOORS;
  });

  const [info, setInfo] = useState<StudioGeneralInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INFO);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clientName: 'Villa Benali — Oran',
      docRef: 'NASAQ-2026-001',
      docDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      paidAmount: 250000,
      isPromoEnabled: true,
      isPoseEnabled: true,
      isTransportEnabled: true,
      scale: 0.60,
      gridGap: 20
    };
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch clients from Supabase
  useEffect(() => {
    async function loadClients() {
      try {
        const { data } = await supabase.from('clients').select('*').order('name');
        if (data) setClients(data);
      } catch (err) {
        console.warn('Could not fetch clients from Supabase:', err);
      }
    }
    loadClients();
  }, []);

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
      // Re-index IDs
      return copy.map((d, i) => ({ ...d, id: `P${i + 1}` }));
    });
  };

  const resetEmpty = () => {
    if (confirm('Voulez-vous vider la liste des portes et réinitialiser le dossier ?')) {
      setDoors([]);
      updateInfo({ clientName: '', paidAmount: 0, docRef: `NASAQ-${Date.now().toString().slice(-4)}` });
      showToast('Configurateur réinitialisé.', 'success');
    }
  };

  const reload21 = () => {
    if (confirm('Recharger le projet type des 21 portes WPC ?')) {
      setDoors(DEFAULT_21_DOORS);
      updateInfo({
        clientName: 'Villa Benali — Oran',
        paidAmount: 250000,
        isPromoEnabled: true
      });
      showToast('Projet 21 portes rechargé !', 'success');
    }
  };

  // Save full order to Supabase
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
        // Try searching for client by name
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', clientName)
          .limit(1);

        if (existing && existing.length > 0) {
          clientId = existing[0].id;
        } else {
          // Create new client
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
        // Create an initial product catalog entry if empty
        const { data: newProd, error: prodErr } = await supabase
          .from('door_products')
          .insert({
            reference: 'C1',
            name: 'Porte d\'intérieur WPC Standard',
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

      // 3. Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          client_id: clientId,
          status: 'confirmed',
          total_amount: grandTotal,
          paid_amount: info.paidAmount,
          is_promo_enabled: info.isPromoEnabled,
          notes: `Généré via Studio Configuration. Réf: ${info.docRef}. Pose: ${info.isPoseEnabled ? 'OUI' : 'NON'}, Transport: ${info.isTransportEnabled ? 'OUI' : 'NON'}`
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 4. Insert items
      if (defaultProductId) {
        const orderItemsPayload = doors.map(d => ({
          order_id: order.id,
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

      // 5. If deposit/paid amount entered, register payment
      if (info.paidAmount > 0) {
        await supabase.from('order_payments').insert({
          order_id: order.id,
          amount: info.paidAmount,
          notes: `Acompte versé à la commande (${info.docRef})`,
          status: 'successful'
        });
      }

      showToast(`Commande ${order.order_number || info.docRef} enregistrée dans Supabase avec succès !`, 'success');
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

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden relative">
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
      <ConfigSidebar
        doors={doors}
        info={info}
        clients={clients}
        onUpdateInfo={updateInfo}
        onUpdateDoor={updateDoor}
        onAddDoor={addDoor}
        onDeleteDoor={deleteDoor}
        onResetEmpty={resetEmpty}
        onReload21={reload21}
        onSaveToSupabase={handleSaveToSupabase}
        onDownloadZip={handleDownloadZip}
        isSaving={isSaving}
      />

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100">
        
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
              <span>📐</span> Dessins 2D ({doors.length})
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
              <span>💰</span> Facture Client
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
                <span>🎁</span> Tarif Promo
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
              <span>🔨</span> Fiche Atelier (Sans Prix)
            </button>
          </div>
        </nav>

        {/* Tab Content Panels */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-16">
          {activeTab === 'drawings' && (
            <TechnicalDrawingsSheet doors={doors} info={info} />
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
