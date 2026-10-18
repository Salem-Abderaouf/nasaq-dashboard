import React, { useState } from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { COLOR_CATALOG } from '../../data/colors';
import { PATTERN_CATALOG } from '../../data/patterns';
import { calculateDoorUnitPrice, calculateDefaultPromoPrice } from '../../utils/pricing';
import { Client, Order } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  FileArchive,
  UserCheck,
  FolderOpen
} from 'lucide-react';

interface ConfigSidebarProps {
  doors: DoorConfigItem[];
  info: StudioGeneralInfo;
  clients: Client[];
  orders?: Order[];
  onSelectOrderToEdit?: (orderId: string) => void;
  onUpdateInfo: (updates: Partial<StudioGeneralInfo>) => void;
  onUpdateDoor: (index: number, updates: Partial<DoorConfigItem>) => void;
  onAddDoor: () => void;
  onDeleteDoor: (index: number) => void;
  onResetEmpty: () => void;
  onSaveToSupabase: () => void;
  onDownloadZip: () => void;
  isSaving?: boolean;
}

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  doors,
  info,
  clients,
  orders = [],
  onSelectOrderToEdit,
  onUpdateInfo,
  onUpdateDoor,
  onAddDoor,
  onDeleteDoor,
  onResetEmpty,
  onSaveToSupabase,
  onDownloadZip,
  isSaving = false
}) => {
  const { t, isRtl } = useLanguage();
  const [visualCtrlOpen, setVisualCtrlOpen] = useState(false);

  // Helper to sync door price to official formula
  const handleAutoPrice = (index: number) => {
    const door = doors[index];
    const normal = calculateDoorUnitPrice(door);
    const promo = calculateDefaultPromoPrice(door);
    onUpdateDoor(index, { priceNormal: normal, pricePromo: promo });
  };

  // Add glass pane
  const handleAddGlass = (doorIndex: number) => {
    const door = doors[doorIndex];
    const panes = [...(door.glassPanes || [])];
    const count = panes.length;
    const defLeft = 12 + (count * 14);
    panes.push({
      widthCm: 10,
      heightCm: 140,
      marginTopCm: 30,
      marginLeftCm: defLeft,
      leaf: door.doorStructure === 'double' && count === 0 ? 'left' : 'right'
    });

    const updatedDoor = { ...door, glassPanes: panes };
    const autoNorm = calculateDoorUnitPrice(updatedDoor);
    onUpdateDoor(doorIndex, { 
      glassPanes: panes,
      priceNormal: autoNorm,
      pricePromo: calculateDefaultPromoPrice(updatedDoor)
    });
  };

  // Delete glass pane
  const handleDeleteGlass = (doorIndex: number, glassIdx: number) => {
    const door = doors[doorIndex];
    const panes = [...(door.glassPanes || [])];
    panes.splice(glassIdx, 1);
    const updatedDoor = { ...door, glassPanes: panes };
    onUpdateDoor(doorIndex, { 
      glassPanes: panes,
      priceNormal: calculateDoorUnitPrice(updatedDoor),
      pricePromo: calculateDefaultPromoPrice(updatedDoor)
    });
  };

  // Quick preset for glass
  const applyGlassPreset = (doorIndex: number, preset: 'none' | '3-strips' | 'stepped' | 'single-full') => {
    const door = doors[doorIndex];
    let panes: import('../../types/configurator').GlassPaneConfig[] = [];
    if (preset === 'single-full') {
      panes = [{ widthCm: 12, heightCm: 150, marginTopCm: 25, marginLeftCm: 15, leaf: 'right' as const }];
    } else if (preset === '3-strips') {
      panes = [
        { widthCm: 8, heightCm: 145, marginTopCm: 28, marginLeftCm: 10, leaf: 'right' as const },
        { widthCm: 8, heightCm: 145, marginTopCm: 28, marginLeftCm: 24, leaf: 'right' as const },
        { widthCm: 8, heightCm: 145, marginTopCm: 28, marginLeftCm: 38, leaf: 'right' as const }
      ];
    } else if (preset === 'stepped') {
      panes = [
        { widthCm: 9, heightCm: 140, marginTopCm: 25, marginLeftCm: 10, leaf: 'right' as const },
        { widthCm: 9, heightCm: 125, marginTopCm: 40, marginLeftCm: 24, leaf: 'right' as const },
        { widthCm: 9, heightCm: 110, marginTopCm: 55, marginLeftCm: 38, leaf: 'right' as const }
      ];
    }
    const updatedDoor = { ...door, glassPanes: panes };
    onUpdateDoor(doorIndex, {
      glassPanes: panes,
      priceNormal: calculateDoorUnitPrice(updatedDoor),
      pricePromo: calculateDefaultPromoPrice(updatedDoor)
    });
  };

  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-lg shrink-0">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-nasaq-teal-dark to-nasaq-teal p-3.5 px-4 flex items-center justify-between border-b-2 border-nasaq-gold text-white">
        <div className="flex items-center gap-2.5">
          <div className="bg-white rounded-md p-1 px-1.5 flex items-center justify-center shadow">
            <img src="/nasaq-logo-cropped.png" alt="NASAQ Logo" className="h-7 w-auto object-contain" />
          </div>
          <span className="text-xs text-nasaq-gold-light font-semibold">{t('config.brandTitle', 'Studio Portes')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={onResetEmpty}
            className="text-xs bg-white/10 hover:bg-white/20 text-white font-medium px-2.5 py-1 rounded transition flex items-center gap-1"
            title={t('config.newBlank', 'Démarrer un nouveau projet vierge')}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('config.newBlank', 'Nouveau Vierge')}</span>
          </button>
        </div>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* Section 0: Commande DB & Mode Édition */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
            <span className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-nasaq-teal" />
              <span>{t('config.dbOrderLabel', 'Commande Enregistrée (DB)')}</span>
            </span>
            {info.editingOrderId ? (
              <span className="text-amber-800 bg-amber-100 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                {t('config.modeEdit', 'En Édition')}
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                {t('config.newBlank', 'Nouveau Vierge')}
              </span>
            )}
          </div>

          <div>
            <select
              value={info.editingOrderId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onResetEmpty();
                } else if (onSelectOrderToEdit) {
                  onSelectOrderToEdit(val);
                }
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-nasaq-teal text-slate-800 font-medium"
            >
              <option value="">{t('config.dbOrderSelectBlank', '-- Démarrer un projet vierge --')}</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.order_number} - {o.clients?.name || 'Client'} ({o.total_amount ? Number(o.total_amount).toLocaleString('fr-FR') + ' DA' : '0 DA'})
                </option>
              ))}
            </select>
          </div>

          {info.editingOrderId && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-[10px] text-amber-700 font-semibold truncate">
                Réf: {info.orderNumber || info.docRef}
              </span>
              <button
                type="button"
                onClick={onResetEmpty}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline"
              >
                {t('config.modeEditExit', 'Fermer l\'édition')}
              </button>
            </div>
          )}
        </div>
        
        {/* Section 1: Dossier & Client Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex justify-between items-center font-bold text-nasaq-teal uppercase tracking-wider text-[11px]">
            <span>Informations Dossier & Facture</span>
            <span className="text-slate-400">#Client</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
              Client (Rechercher ou Saisir)
            </label>
            <div className="space-y-1.5">
              <input 
                type="text"
                placeholder="Nom complet du client..."
                value={info.clientName}
                onChange={(e) => onUpdateInfo({ clientName: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal"
              />
              {clients.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-500 shrink-0">Choisir :</span>
                  {clients.slice(0, 4).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onUpdateInfo({ clientName: c.name, clientId: c.id })}
                      className="px-2 py-0.5 rounded bg-white hover:bg-nasaq-teal-subtle text-[10.5px] border border-slate-200 text-slate-700 whitespace-nowrap hover:border-nasaq-teal transition"
                    >
                      {c.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
                N° Facture
              </label>
              <input 
                type="text"
                value={info.docRef}
                onChange={(e) => onUpdateInfo({ docRef: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-nasaq-teal font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
                Date
              </label>
              <input 
                type="text"
                value={info.docDate}
                onChange={(e) => onUpdateInfo({ docDate: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-nasaq-teal font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
              Acompte / Montant Versé (DA)
            </label>
            <input 
              type="number"
              min={0}
              step={500}
              value={info.paidAmount}
              onChange={(e) => onUpdateInfo({ paidAmount: Number(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-nasaq-teal font-mono font-bold text-nasaq-blue"
            />
          </div>

          {/* Toggle Promo */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
            <label htmlFor="chk-promo" className="flex items-center gap-1.5 text-amber-900 font-bold cursor-pointer text-xs">
              <span>🎁 Activer l'Offre Promotionnelle</span>
            </label>
            <input 
              id="chk-promo"
              type="checkbox"
              checked={info.isPromoEnabled}
              onChange={(e) => onUpdateInfo({ isPromoEnabled: e.target.checked })}
              className="w-4 h-4 text-nasaq-gold rounded cursor-pointer accent-nasaq-gold"
            />
          </div>

          {/* Toggle Installation / Pose */}
          <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <label htmlFor="chk-pose" className="flex items-center gap-1.5 text-slate-800 font-bold cursor-pointer text-xs">
                <span>🔨 Inclure la Pose / Installation</span>
              </label>
              <span className="text-[10px] text-slate-500">5 000 DA simple • 6 000 DA 2 vantaux</span>
            </div>
            <input 
              id="chk-pose"
              type="checkbox"
              checked={info.isPoseEnabled}
              onChange={(e) => onUpdateInfo({ isPoseEnabled: e.target.checked })}
              className="w-4 h-4 text-nasaq-teal rounded cursor-pointer accent-nasaq-teal"
            />
          </div>

          {/* Toggle Transport / Delivery */}
          <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <label htmlFor="chk-transport" className="flex items-center gap-1.5 text-slate-800 font-bold cursor-pointer text-xs">
                <span>🚚 Inclure le Transport / Livraison</span>
              </label>
              <span className="text-[10px] text-slate-500">Forfait fixe : 3 000 DA par commande</span>
            </div>
            <input 
              id="chk-transport"
              type="checkbox"
              checked={info.isTransportEnabled}
              onChange={(e) => onUpdateInfo({ isTransportEnabled: e.target.checked })}
              className="w-4 h-4 text-nasaq-teal rounded cursor-pointer accent-nasaq-teal"
            />
          </div>
        </div>

        {/* Section 2: Visual 2D Controls (Collapsible) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <button 
            type="button" 
            onClick={() => setVisualCtrlOpen(!visualCtrlOpen)}
            className="w-full flex items-center justify-between font-bold text-nasaq-teal uppercase tracking-wider text-[11px]"
          >
            <span>📐 Contrôle Visuel 2D & Grille</span>
            {visualCtrlOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {visualCtrlOpen && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-500 mb-1 text-[10px]">Échelle (px/cm)</label>
                <input 
                  type="number"
                  step={0.05}
                  min={0.3}
                  max={1.2}
                  value={info.scale}
                  onChange={(e) => onUpdateInfo({ scale: Number(e.target.value) || 0.60 })}
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1 text-[10px]">Espacement (px)</label>
                <input 
                  type="number"
                  min={10}
                  max={60}
                  value={info.gridGap}
                  onChange={(e) => onUpdateInfo({ gridGap: Number(e.target.value) || 20 })}
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Doors List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-nasaq-teal uppercase tracking-wider text-[11px]">
              Liste des Portes ({doors.length})
            </span>
            <button
              type="button"
              onClick={onAddDoor}
              className="flex items-center gap-1 bg-nasaq-teal text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-nasaq-teal-dark transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          {doors.map((door, index) => {
            const isDouble = door.doorStructure === 'double';
            const hasRev = Boolean(door.hasRevetment);
            const calculatedPrice = calculateDoorUnitPrice(door);

            return (
              <div 
                key={door.id || index}
                className="bg-white border border-slate-200 hover:border-nasaq-teal-light rounded-xl p-3 shadow-sm transition space-y-2.5"
              >
                {/* Header item */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono font-extrabold bg-nasaq-teal-subtle text-nasaq-teal px-2 py-0.5 rounded text-xs">
                    {door.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {hasRev ? door.heightCm + (door.revetmentHeightCm || 0) : door.heightCm} × {door.widthCm} cm
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteDoor(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition"
                      title="Supprimer cette porte"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase">Désignation</label>
                  <input 
                    type="text"
                    value={door.designation}
                    onChange={(e) => onUpdateDoor(index, { designation: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-nasaq-teal focus:outline-none"
                  />
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase">Hauteur (cm)</label>
                    <input 
                      type="number"
                      value={door.heightCm}
                      onChange={(e) => onUpdateDoor(index, { heightCm: Number(e.target.value) || 200 })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase">Largeur (cm)</label>
                    <input 
                      type="number"
                      value={door.widthCm}
                      onChange={(e) => onUpdateDoor(index, { widthCm: Number(e.target.value) || 80 })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                {/* Imposte / Revêtement Supérieur */}
                <div className="bg-[#fdfbf7] border border-nasaq-gold/40 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`rev-chk-${index}`} className="font-bold text-nasaq-gold-dark text-[11px] cursor-pointer flex items-center gap-1.5">
                      <span>🪵 Imposte / Revêtement Supérieur</span>
                    </label>
                    <input 
                      id={`rev-chk-${index}`}
                      type="checkbox"
                      checked={hasRev}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const updated = { ...door, hasRevetment: checked };
                        onUpdateDoor(index, { 
                          hasRevetment: checked,
                          priceNormal: calculateDoorUnitPrice(updated),
                          pricePromo: calculateDefaultPromoPrice(updated)
                        });
                      }}
                      className="w-3.5 h-3.5 accent-nasaq-gold rounded cursor-pointer"
                    />
                  </div>
                  {hasRev && (
                    <div className="mt-2 pt-1 border-t border-nasaq-gold/20 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-600 font-medium">Hauteur Imposte (cm) :</span>
                      <input 
                        type="number"
                        min={10}
                        max={250}
                        value={door.revetmentHeightCm || 110}
                        onChange={(e) => onUpdateDoor(index, { revetmentHeightCm: Number(e.target.value) || 110 })}
                        className="w-20 px-2 py-0.5 text-xs border border-slate-300 rounded bg-white font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Colors Grid */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Couleur Bois WPC ({COLOR_CATALOG.find(c => c.id === door.colorId)?.name})
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_CATALOG.map(col => {
                      const active = door.colorId === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => onUpdateDoor(index, { colorId: col.id })}
                          className={`flex flex-col items-center p-1 rounded-md border text-[9.5px] transition ${
                            active 
                              ? 'border-nasaq-teal bg-nasaq-teal-subtle font-bold shadow-xs' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span 
                            className="w-5 h-5 rounded-xs border border-black/20 shadow-xs mb-0.5" 
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate max-w-full">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patterns Selector */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Motif / Gravure CNC ({PATTERN_CATALOG.find(p => p.id === door.patternId)?.name})
                  </label>
                  <select
                    value={door.patternId || 'none'}
                    onChange={(e) => {
                      const patId = e.target.value;
                      const updated = { ...door, patternId: patId };
                      onUpdateDoor(index, { 
                        patternId: patId,
                        priceNormal: calculateDoorUnitPrice(updated),
                        pricePromo: calculateDefaultPromoPrice(updated)
                      });
                    }}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:border-nasaq-teal"
                  >
                    {PATTERN_CATALOG.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.id !== 'none' ? '(+4 000 DA)' : '(0 DA)'}</option>
                    ))}
                  </select>
                </div>

                {/* Hardware Color */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Quincaillerie</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateDoor(index, { hardwareColor: 'black' })}
                      className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border text-xs font-semibold ${
                        door.hardwareColor !== 'chrome'
                          ? 'border-nasaq-teal bg-nasaq-teal-subtle text-slate-900'
                          : 'border-slate-200 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-black"></span>
                      Noir Mat
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateDoor(index, { hardwareColor: 'chrome' })}
                      className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border text-xs font-semibold ${
                        door.hardwareColor === 'chrome'
                          ? 'border-nasaq-teal bg-nasaq-teal-subtle text-slate-900'
                          : 'border-slate-200 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400"></span>
                      Chrome
                    </button>
                  </div>
                </div>

                {/* Structure: Single vs Double */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase">Ouvrant</label>
                    <select
                      value={door.doorStructure}
                      onChange={(e) => {
                        const struct = e.target.value as 'single' | 'double';
                        const updated = { ...door, doorStructure: struct };
                        onUpdateDoor(index, { 
                          doorStructure: struct,
                          priceNormal: calculateDoorUnitPrice(updated),
                          pricePromo: calculateDefaultPromoPrice(updated)
                        });
                      }}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    >
                      <option value="single">1 Vantail (Simple)</option>
                      <option value="double">2 Vantaux (Double)</option>
                    </select>
                  </div>
                  {isDouble && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase">% Semi-fixe</label>
                      <input 
                        type="number"
                        min={15}
                        max={50}
                        value={door.leftLeafPercent || 28}
                        onChange={(e) => onUpdateDoor(index, { leftLeafPercent: Number(e.target.value) || 28 })}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Prices & Auto recalculation */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Barème & Tarification</span>
                    <button
                      type="button"
                      onClick={() => handleAutoPrice(index)}
                      className="text-[10px] bg-nasaq-teal-subtle hover:bg-nasaq-teal/20 text-nasaq-teal border border-nasaq-teal/40 font-bold px-1.5 py-0.5 rounded transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Barème Auto
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400">Prix Unitaire (DA)</span>
                      <input 
                        type="number"
                        step={500}
                        value={door.priceNormal}
                        onChange={(e) => onUpdateDoor(index, { priceNormal: Number(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono font-bold"
                      />
                    </div>
                    {info.isPromoEnabled && (
                      <div>
                        <span className="text-[9px] text-amber-700 font-semibold">Prix Promo (DA)</span>
                        <input 
                          type="number"
                          step={500}
                          value={door.pricePromo}
                          onChange={(e) => onUpdateDoor(index, { pricePromo: Number(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs border border-amber-300 rounded bg-white font-mono font-bold text-amber-800"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Calcul théorique : <strong className="text-nasaq-teal font-mono">{calculatedPrice.toLocaleString('fr-FR')} DA</strong>
                  </div>
                </div>

                {/* Glass Panes List */}
                <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900 text-[11px] flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-nasaq-blue" /> Vitrages ({door.glassPanes?.length || 0})
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => applyGlassPreset(index, '3-strips')}
                        className="px-1.5 py-0.5 bg-white border border-sky-300 rounded text-[9.5px] font-bold text-sky-700 hover:bg-sky-100"
                      >
                        3 Bandes
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyGlassPreset(index, 'none')}
                        className="px-1.5 py-0.5 bg-white border border-sky-300 rounded text-[9.5px] font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Plein
                      </button>
                    </div>
                  </div>

                  {door.glassPanes && door.glassPanes.map((pane, gIdx) => (
                    <div key={gIdx} className="bg-white border border-slate-200 rounded-md p-2 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-800 text-[10.5px]">Vitre #{gIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGlass(index, gIdx)}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                        >
                          ✕ Retirer
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[9px] text-slate-400">Largeur (cm)</span>
                          <input 
                            type="number"
                            min={3}
                            max={80}
                            value={pane.widthCm}
                            onChange={(e) => {
                              const newPanes = [...door.glassPanes];
                              newPanes[gIdx] = { ...newPanes[gIdx], widthCm: Number(e.target.value) || 10 };
                              onUpdateDoor(index, { glassPanes: newPanes });
                            }}
                            className="w-full px-1.5 py-0.5 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400">Hauteur (cm)</span>
                          <input 
                            type="number"
                            min={5}
                            max={220}
                            value={pane.heightCm}
                            onChange={(e) => {
                              const newPanes = [...door.glassPanes];
                              newPanes[gIdx] = { ...newPanes[gIdx], heightCm: Number(e.target.value) || 140 };
                              onUpdateDoor(index, { glassPanes: newPanes });
                            }}
                            className="w-full px-1.5 py-0.5 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[9px] text-slate-400">Distance Haut (cm)</span>
                          <input 
                            type="number"
                            value={pane.marginTopCm}
                            onChange={(e) => {
                              const newPanes = [...door.glassPanes];
                              newPanes[gIdx] = { ...newPanes[gIdx], marginTopCm: Number(e.target.value) || 30 };
                              onUpdateDoor(index, { glassPanes: newPanes });
                            }}
                            className="w-full px-1.5 py-0.5 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400">Distance Bord (cm)</span>
                          <input 
                            type="number"
                            value={pane.marginLeftCm}
                            onChange={(e) => {
                              const newPanes = [...door.glassPanes];
                              newPanes[gIdx] = { ...newPanes[gIdx], marginLeftCm: Number(e.target.value) || 12 };
                              onUpdateDoor(index, { glassPanes: newPanes });
                            }}
                            className="w-full px-1.5 py-0.5 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddGlass(index)}
                    className="w-full py-1 border border-dashed border-sky-400 text-sky-700 bg-white hover:bg-sky-50 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un Vitrage
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-2">
        <button
          type="button"
          onClick={onSaveToSupabase}
          disabled={isSaving}
          className={`w-full font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 text-white ${
            info.editingOrderId 
              ? 'bg-amber-600 hover:bg-amber-700' 
              : 'bg-nasaq-teal hover:bg-nasaq-teal-dark'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSaving 
            ? (info.editingOrderId ? t('config.updateInSupabase', 'Mise à jour dans Supabase...') : t('config.saveToSupabase', 'Enregistrement dans Supabase...')) 
            : (info.editingOrderId ? t('config.updateInSupabase', 'Mettre à jour la Commande (Supabase)') : t('config.saveToSupabase', 'Enregistrer la Commande dans Supabase'))}
        </button>
        <button
          type="button"
          onClick={onDownloadZip}
          className="w-full bg-nasaq-gold hover:bg-nasaq-gold-dark text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition"
        >
          <FileArchive className="w-4 h-4" />
          {t('config.downloadZip', 'Télécharger les Dossiers (ZIP)')}
        </button>
      </div>
    </aside>
  );
};
