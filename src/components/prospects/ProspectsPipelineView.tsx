import React from 'react';
import { Prospect, ProspectStatus } from '../../types/database';
import { getProspectStatusMeta } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { PROSPECT_STAGES } from '../../helpers/prospects/prospectHelpers';
import { useProspectsPipeline } from '../../hooks/prospects/useProspectsPipeline';
import { 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Phone, 
  MapPin, 
  UserCheck, 
  X,
  Search,
  Columns3,
  Table2
} from 'lucide-react';

export const ProspectsPipelineView: React.FC = () => {
  const { t } = useLanguage();
  
  const {
    filteredProspects,
    loading,
    search,
    setSearch,
    viewMode,
    setViewMode,
    isAddModalOpen,
    setIsAddModalOpen,
    convertingId,
    fetchProspects,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    status,
    setStatus,
    submitting,
    handleCreateProspect,
    handleUpdateStatus,
    handleConvert
  } = useProspectsPipeline();

  const onConvert = (prospect: Prospect) => {
    const confirmMsg = t('prospects.confirmConvert', 'Convertir le prospect "{name}" en client formel ?').replace('{name}', prospect.name);
    if (!confirm(confirmMsg)) return;

    handleConvert(
      prospect,
      () => {
        const successMsg = t('prospects.convertSuccess', 'Prospect "{name}" converti avec succès dans le répertoire des clients !').replace('{name}', prospect.name);
        alert(successMsg);
      },
      (err) => alert(err || t('common.error', 'Erreur'))
    );
  };

  const onSubmitNew = (e: React.FormEvent) => {
    handleCreateProspect(
      e,
      undefined,
      (err) => alert(t('prospects.createError', err))
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            {t('prospects.title', 'Pipeline des Prospects & Opportunités')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('prospects.subtitle', 'Suivi des 6 étapes de négociation et conversion directe en clients')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchProspects}
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
            <span>{t('prospects.newProspect', 'Nouveau Prospect')}</span>
          </button>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 px-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder={t('prospects.searchPlaceholder', 'Rechercher par nom, téléphone, ville...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t('prospects.viewLabel', 'Affichage :')}</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'kanban' 
                  ? 'bg-white text-nasaq-teal shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>{t('prospects.viewKanban', 'Kanban')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' 
                  ? 'bg-white text-nasaq-teal shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>{t('prospects.viewTable', 'Liste')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW (Smooth Horizontal Flex Track) */}
      {viewMode === 'kanban' ? (
        <div className="w-full overflow-x-auto pb-6">
          <div className="flex gap-4 items-start w-max min-w-full">
            {PROSPECT_STAGES.map(stage => {
              const stageProspects = filteredProspects.filter(p => p.status === stage.id);
              const stageLabel = t(`prospects.status.${stage.id}`, stage.defaultLabel);

              return (
                <div 
                  key={stage.id}
                  className={`w-[290px] shrink-0 rounded-2xl border ${stage.color} p-3.5 flex flex-col max-h-[75vh]`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/10 shrink-0">
                    <span className="font-bold text-xs text-slate-800">{stageLabel}</span>
                    <span className="w-5 h-5 rounded-full bg-white text-slate-700 font-mono text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                      {stageProspects.length}
                    </span>
                  </div>

                  {/* Cards List with Independent Scroll */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {stageProspects.length === 0 ? (
                      <div className="h-28 flex items-center justify-center text-[11px] text-slate-400 italic bg-white/40 rounded-xl border border-dashed border-slate-300">
                        {t('prospects.noLeads', 'Aucun lead')}
                      </div>
                    ) : (
                      stageProspects.map(p => (
                        <div 
                          key={p.id}
                          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition space-y-2.5 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs leading-snug">{p.name}</div>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 mt-1">
                              <Phone className="w-3 h-3 text-nasaq-teal shrink-0" />
                              <span>{p.phone}</span>
                            </div>
                          </div>

                          {p.address && (
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.address}</span>
                            </div>
                          )}

                          {p.notes && (
                            <p className="text-[10.5px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed line-clamp-3">
                              {p.notes}
                            </p>
                          )}

                          {/* Stage selector dropdown & Convert Button */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <select
                              value={p.status}
                              onChange={(e) => handleUpdateStatus(p.id, e.target.value as ProspectStatus)}
                              className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none"
                            >
                              <option value="new">{t('prospects.status.new', 'Nouveau')}</option>
                              <option value="contacted">{t('prospects.status.contacted', 'Contacté')}</option>
                              <option value="interested">{t('prospects.status.interested', 'Intéressé')}</option>
                              <option value="negotiation">{t('prospects.status.negotiation', 'Négociation')}</option>
                              <option value="converted">{t('prospects.status.converted', 'Converti')}</option>
                              <option value="lost">{t('prospects.status.lost', 'Perdu')}</option>
                            </select>

                            {p.status !== 'converted' ? (
                              <button
                                type="button"
                                onClick={() => onConvert(p)}
                                disabled={convertingId === p.id}
                                className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
                                title={t('prospects.convertToClient', 'Convertir en client formel')}
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>{t('prospects.convertToClient', 'Client')}</span>
                              </button>
                            ) : (
                              <span className="text-[9.5px] text-emerald-600 font-bold px-1.5 py-0.5 rounded bg-emerald-50">
                                {t('prospects.convertedBadge', '✓ Converti')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">{t('prospects.table.contact', 'Nom / Contact')}</th>
                  <th className="py-3 px-4">{t('clients.phone', 'Téléphone')}</th>
                  <th className="py-3 px-4">{t('clients.address', 'Adresse')}</th>
                  <th className="py-3 px-4">{t('prospects.table.stage', 'Étape')}</th>
                  <th className="py-3 px-4">{t('common.notes', 'Notes')}</th>
                  <th className="py-3 px-4 text-center">{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProspects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      {t('prospects.noProspectsFound', 'Aucun prospect trouvé.')}
                    </td>
                  </tr>
                ) : (
                  filteredProspects.map(p => {
                    const meta = getProspectStatusMeta(p.status, t);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.phone}</td>
                        <td className="py-3 px-4 text-slate-500">{p.address || '-'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={p.status}
                            onChange={(e) => handleUpdateStatus(p.id, e.target.value as ProspectStatus)}
                            className={`text-[10.5px] font-bold px-2 py-1 rounded-lg border ${meta.bg}`}
                          >
                            <option value="new">{t('prospects.status.new', 'Nouveau')}</option>
                            <option value="contacted">{t('prospects.status.contacted', 'Contacté')}</option>
                            <option value="interested">{t('prospects.status.interested', 'Intéressé')}</option>
                            <option value="negotiation">{t('prospects.status.negotiation', 'Négociation')}</option>
                            <option value="converted">{t('prospects.status.converted', 'Converti')}</option>
                            <option value="lost">{t('prospects.status.lost', 'Perdu')}</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{p.notes || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          {p.status !== 'converted' ? (
                            <button
                              type="button"
                              onClick={() => onConvert(p)}
                              disabled={convertingId === p.id}
                              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{t('prospects.convert', 'Convertir')}</span>
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">{t('prospects.clientRegistered', 'Client Enregistré')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Prospect Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">{t('prospects.modal.title', 'Nouveau Prospect / Lead')}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmitNew} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('prospects.modal.name', 'Nom / Contact *')}</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: M. Youcef Belkacem"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('prospects.modal.phone', 'Téléphone *')}</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: 0560 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('prospects.modal.address', 'Adresse / Ville')}</label>
                <input 
                  type="text"
                  placeholder="ex: Cheraga, Alger"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('prospects.modal.initialStage', 'Étape Initiale')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProspectStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none bg-white font-medium"
                >
                  <option value="new">1. {t('prospects.status.new', 'Nouveau Lead')}</option>
                  <option value="contacted">2. {t('prospects.status.contacted', 'Contact Établi')}</option>
                  <option value="interested">3. {t('prospects.status.interested', 'Intéressé')}</option>
                  <option value="negotiation">4. {t('prospects.status.negotiation', 'En Négociation de Devis')}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('prospects.modal.notes', 'Besoins / Spécifications')}</label>
                <textarea 
                  rows={2}
                  placeholder={t('prospects.modal.notesPlaceholder', 'Modèles demandés, nombre de portes...')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {submitting ? t('prospects.modal.creating', 'Création...') : t('prospects.modal.submit', 'Créer le Prospect')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
