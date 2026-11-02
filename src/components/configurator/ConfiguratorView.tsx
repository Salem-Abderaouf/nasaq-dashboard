import React, { useState } from 'react';
import { ConfigSidebar } from './ConfigSidebar';
import { TechnicalDrawingsSheet } from './TechnicalDrawingsSheet';
import { InvoiceStandardSheet } from './InvoiceStandardSheet';
import { InvoicePromoSheet } from './InvoicePromoSheet';
import { InvoiceAtelierSheet } from './InvoiceAtelierSheet';
import { downloadDossierZIP } from '../../utils/exportUtils';
import { Order, DoorProduct } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, AlertCircle, Sliders, Eye } from 'lucide-react';
import { useConfiguratorStudio } from '../../hooks/configurator/useConfiguratorStudio';

interface ConfiguratorViewProps {
  onOrderSaved?: () => void;
  orderToEdit?: Order | null;
  initialProduct?: DoorProduct | null;
  onClearOrderToEdit?: () => void;
  onClearInitialProduct?: () => void;
}

export const ConfiguratorView: React.FC<ConfiguratorViewProps> = ({ 
  onOrderSaved, 
  orderToEdit,
  initialProduct,
  onClearOrderToEdit,
  onClearInitialProduct
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'drawings' | 'normal' | 'promo' | 'atelier'>('drawings');
  const [mobilePanel, setMobilePanel] = useState<'config' | 'preview'>('config');

  const {
    doors,
    info,
    updateInfo,
    updateDoor,
    addDoor,
    deleteDoor,
    clients,
    dbOrders,
    productsList,
    isSaving,
    toastMessage,
    loadOrderForEditing,
    resetEmpty,
    handleSaveToSupabase
  } = useConfiguratorStudio({
    orderToEdit,
    initialProduct,
    onClearOrderToEdit,
    onClearInitialProduct,
    onOrderSaved
  });

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
    <div className="flex flex-col lg:flex-row h-full overflow-hidden relative print:!block print:!h-auto print:!overflow-visible print:!bg-white">
      {/* Mobile Top View Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden bg-nasaq-teal-dark border-b border-slate-700/80 p-2 px-3 flex items-center justify-between gap-2 shrink-0 z-30 shadow-md no-print">
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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white transition-all transform animate-bounce no-print ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: Full height independent scroll */}
      <div className={`${mobilePanel === 'config' ? 'block' : 'hidden'} lg:block h-full shrink-0 no-print`}>
        <ConfigSidebar
          doors={doors}
          info={info}
          clients={clients}
          orders={dbOrders}
          products={productsList}
          onSelectOrderToEdit={loadOrderForEditing}
          onRefreshClients={() => {}}
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
      <div className={`${mobilePanel === 'preview' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col h-full overflow-y-auto bg-slate-100 print:!flex print:!h-auto print:!overflow-visible print:!bg-white print:!p-0 print:!m-0`}>
        
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
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-16 print:!max-w-full print:!p-0 print:!m-0 print:!pb-0">
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
