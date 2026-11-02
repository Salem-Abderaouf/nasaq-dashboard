import React from 'react';
import { Worker, WorkerAppCredentials, WorkerPermissions } from '../../types/database';
import { PERMISSION_PRESETS } from '../../types/auth';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkerCredentials } from '../../hooks/workers/useWorkerCredentials';
import { 
  X, 
  Key, 
  Shield, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Check, 
  Lock, 
  Mail, 
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';

interface WorkerCredentialsModalProps {
  worker: Worker;
  onClose: () => void;
  onSaved: (credentials: WorkerAppCredentials) => void;
}

export const WorkerCredentialsModal: React.FC<WorkerCredentialsModalProps> = ({
  worker,
  onClose,
  onSaved
}) => {
  const { t } = useLanguage();
  
  const {
    enabled,
    setEnabled,
    loginEmail,
    setLoginEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    permissions,
    selectedPresetId,
    saving,
    handleApplyPreset,
    handleTogglePermission,
    handleGeneratePassword,
    handleSubmit
  } = useWorkerCredentials(worker, onClose, onSaved);

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(
      e,
      (msg) => alert(t('common.required', msg)),
      (err) => alert(err || t('common.error', 'Erreur lors de l\'enregistrement des accès.'))
    );
  };

  const permissionList: { key: keyof WorkerPermissions; defaultLabel: string; defaultDesc: string; category: string }[] = [
    {
      key: 'canViewDashboard',
      defaultLabel: 'Tableau de bord exécutif',
      defaultDesc: 'Consulter les indicateurs clés et graphiques de performance.',
      category: 'Général'
    },
    {
      key: 'canViewOrders',
      defaultLabel: 'Suivi des commandes',
      defaultDesc: 'Accéder à la liste des commandes et leur détail technique.',
      category: 'Atelier & Vente'
    },
    {
      key: 'canChangeOrderStatus',
      defaultLabel: 'Mise à jour des statuts atelier',
      defaultDesc: 'Faire passer les commandes en Usinage, Prêt, En transit ou Livré.',
      category: 'Atelier & Vente'
    },
    {
      key: 'canAccessAtelierCutSheets',
      defaultLabel: 'Fiches de débit & plans de coupe',
      defaultDesc: 'Consulter et imprimer les cotes d\'usinage (sans prix affichés).',
      category: 'Atelier & Vente'
    },
    {
      key: 'canCreateOrders',
      defaultLabel: 'Studio 2D & Création de devis',
      defaultDesc: 'Créer de nouvelles commandes, portes sur-mesure et imposte.',
      category: 'Showroom'
    },
    {
      key: 'canManageClients',
      defaultLabel: 'Gestion du répertoire clients',
      defaultDesc: 'Consulter, ajouter et mettre à jour les comptes clients.',
      category: 'Showroom'
    },
    {
      key: 'canManageProspects',
      defaultLabel: 'Pipeline prospects & leads',
      defaultDesc: 'Suivre les négociations commerciales et convertir des prospects.',
      category: 'Showroom'
    },
    {
      key: 'canViewFinancials',
      defaultLabel: 'Données financières & Prix réels',
      defaultDesc: 'Voir les montants en DZD et remises. Si désactivé : mode atelier strict à 0 DA.',
      category: 'Finances'
    },
    {
      key: 'canRecordPayments',
      defaultLabel: 'Encaissement d\'acomptes',
      defaultDesc: 'Enregistrer des paiements et versements d\'acomptes en caisse.',
      category: 'Finances'
    },
    {
      key: 'canExportDocuments',
      defaultLabel: 'Export documents & plans ZIP',
      defaultDesc: 'Télécharger les fiches techniques, factures et archives ZIP de production.',
      category: 'Export'
    },
    {
      key: 'canAccessPayroll',
      defaultLabel: 'Gestion RH & Moteur de Paie',
      defaultDesc: 'Consulter les salaires des collègues, avances et primes (sensible).',
      category: 'Direction / RH'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nasaq-teal text-white flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{t('workers.credsModal.title', 'Accès Application & Permissions')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-nasaq-gold/20 text-nasaq-gold-dark font-mono font-bold">
                  {worker.position}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {t('workers.credsModal.subtitle', 'Configuration des identifiants et des droits pour')} <strong>{worker.name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          
          {/* Section 1: Activation Switch */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {enabled ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {t('workers.credsModal.enableAccess', 'Activer la connexion à l\'application')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {enabled 
                    ? t('workers.credsModal.activeHint', 'Cet artisan peut se connecter avec son email et mot de passe.')
                    : t('workers.credsModal.disabledHint', 'Accès bloqué : impossible de se connecter à la plateforme.')}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nasaq-teal"></div>
            </label>
          </div>

          {/* Section 2: Credentials (Email & Password) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-nasaq-teal" />
              <span>{t('workers.credsModal.sectionCreds', '1. Identifiants de connexion')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('workers.credsModal.loginEmail', 'Email / Identifiant de connexion')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nom.prenom@nasaq.dz"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-nasaq-teal focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('workers.credsModal.password', 'Mot de passe')}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-nasaq-teal hover:text-nasaq-teal-dark flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{t('workers.credsModal.generate', 'Générer (6 car.)')}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe secret"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-800 focus:outline-none focus:border-nasaq-teal focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Permission Presets */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-nasaq-teal" />
              <span>{t('workers.credsModal.sectionPresets', '2. Profils types de permissions')}</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {PERMISSION_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-nasaq-teal/10 border-nasaq-teal text-nasaq-teal shadow-xs' 
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{t(`auth.preset.${preset.id}`, preset.label)}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-nasaq-teal" />}
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2">
                      {t(`auth.presetDesc.${preset.id}`, preset.description)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Granular Permissions Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-nasaq-teal" />
                <span>{t('workers.credsModal.sectionGranular', '3. Droits granulaires détaillés')}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {Object.values(permissions).filter(Boolean).length} / {permissionList.length} {t('workers.credsModal.active', 'actifs')}
              </span>
            </h3>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
              {permissionList.map(item => {
                const isChecked = !!permissions[item.key];
                return (
                  <label
                    key={item.key}
                    className="p-3.5 flex items-start gap-3 hover:bg-slate-50/80 cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePermission(item.key)}
                      className="mt-0.5 rounded border-slate-300 text-nasaq-teal focus:ring-nasaq-teal h-4 w-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {t(`workers.perm.${item.key}`, item.defaultLabel)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {t(`workers.permDesc.${item.key}`, item.defaultDesc)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Warning for sensitive permissions */}
          {permissions.canViewFinancials && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">{t('workers.credsModal.warnFinancials', 'Attention : Données financières autorisées')}</strong>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  {t('workers.credsModal.warnFinancialsDesc', 'Cet utilisateur aura accès aux prix de vente en DZD, factures et remises client accordées.')}
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
          >
            {t('common.cancel', 'Annuler')}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="px-5 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('common.saving', 'Enregistrement...')}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('workers.credsModal.saveBtn', 'Enregistrer les accès')}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
