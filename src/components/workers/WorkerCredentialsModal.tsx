import React, { useState } from 'react';
import { Worker, WorkerAppCredentials, WorkerPermissions } from '../../types/database';
import { PERMISSION_PRESETS } from '../../types/auth';
import { AuthService } from '../../services/authService';
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
  // Load existing credentials or defaults
  const existingCreds = AuthService.getWorkerCredentials(worker.email || worker.id);

  const [enabled, setEnabled] = useState<boolean>(
    existingCreds ? existingCreds.app_access_enabled : true
  );

  const [loginEmail, setLoginEmail] = useState<string>(
    existingCreds?.login_email || worker.email || `${worker.name.toLowerCase().replace(/\s+/g, '.')}@nasaq.dz`
  );

  const [password, setPassword] = useState<string>(
    existingCreds?.password || 'worker123'
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Initialize permissions
  const [permissions, setPermissions] = useState<WorkerPermissions>(() => {
    if (existingCreds?.permissions) {
      return existingCreds.permissions;
    }
    // Infer default preset based on position
    const pos = (worker.position || '').toLowerCase();
    if (pos.includes('commercial') || pos.includes('vente')) {
      return PERMISSION_PRESETS.find(p => p.id === 'commercial')!.permissions;
    }
    if (pos.includes('pose') || pos.includes('install')) {
      return PERMISSION_PRESETS.find(p => p.id === 'installer')!.permissions;
    }
    return PERMISSION_PRESETS.find(p => p.id === 'workshop')!.permissions;
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleApplyPreset = (presetId: string) => {
    const preset = PERMISSION_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPermissions({ ...preset.permissions });
      setSelectedPresetId(presetId);
    }
  };

  const handleTogglePermission = (key: keyof WorkerPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSelectedPresetId(null);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      alert('Veuillez renseigner un email ou identifiant valide.');
      return;
    }

    setSaving(true);
    try {
      const updatedCreds: WorkerAppCredentials = {
        login_email: loginEmail.trim().toLowerCase(),
        password: password.trim(),
        app_access_enabled: enabled,
        permissions: permissions,
        last_login: existingCreds?.last_login || null
      };

      AuthService.saveWorkerCredentials(worker, updatedCreds);
      onSaved(updatedCreds);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement des accès.');
    } finally {
      setSaving(false);
    }
  };

  const permissionList: { key: keyof WorkerPermissions; label: string; desc: string; category: string }[] = [
    {
      key: 'canViewDashboard',
      label: 'Tableau de bord exécutif',
      desc: 'Consulter les indicateurs clés et graphiques de performance.',
      category: 'Général'
    },
    {
      key: 'canViewOrders',
      label: 'Suivi des commandes',
      desc: 'Accéder à la liste des commandes et leur détail technique.',
      category: 'Atelier & Vente'
    },
    {
      key: 'canChangeOrderStatus',
      label: 'Mise à jour des statuts atelier',
      desc: 'Faire passer les commandes en Usinage, Prêt, En transit ou Livré.',
      category: 'Atelier & Vente'
    },
    {
      key: 'canAccessAtelierCutSheets',
      label: 'Fiches de débit & plans de coupe',
      desc: 'Consulter et imprimer les cotes d\'usinage (sans prix affichés).',
      category: 'Atelier & Vente'
    },
    {
      key: 'canCreateOrders',
      label: 'Studio 2D & Création de devis',
      desc: 'Créer de nouvelles commandes, portes sur-mesure et imposte.',
      category: 'Showroom'
    },
    {
      key: 'canManageClients',
      label: 'Gestion du répertoire clients',
      desc: 'Consulter, ajouter et mettre à jour les comptes clients.',
      category: 'Showroom'
    },
    {
      key: 'canManageProspects',
      label: 'Pipeline prospects & leads',
      desc: 'Suivre les négociations commerciales et convertir des prospects.',
      category: 'Showroom'
    },
    {
      key: 'canViewFinancials',
      label: 'Données financières & Prix réels',
      desc: 'Voir les montants en DZD et remises. Si désactivé : mode atelier strict à 0 DA.',
      category: 'Finances'
    },
    {
      key: 'canRecordPayments',
      label: 'Encaissement d\'acomptes',
      desc: 'Enregistrer des paiements et versements d\'acomptes en caisse.',
      category: 'Finances'
    },
    {
      key: 'canExportDocuments',
      label: 'Export documents & plans ZIP',
      desc: 'Télécharger les fiches techniques, factures et archives ZIP de production.',
      category: 'Export'
    },
    {
      key: 'canAccessPayroll',
      label: 'Gestion RH & Moteur de Paie',
      desc: 'Consulter les salaires des collègues, avances et primes (sensible).',
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
                <span>Accès Application & Permissions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-nasaq-gold/20 text-nasaq-gold-dark font-mono font-bold">
                  {worker.position}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Configuration des identifiants et des droits pour <strong>{worker.name}</strong>
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

        {/* Modal Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 1. App Access Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-xs">Autoriser la connexion à l'application</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Si activé, l'employé peut se connecter avec son email et mot de passe ci-dessous.
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

          {enabled ? (
            <>
              {/* 2. Login Credentials */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-nasaq-teal" />
                  Identifiants de Connexion
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Email ou Identifiant de connexion
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="employe@nasaq.dz"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-600">
                        Mot de passe / Code PIN
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[10px] text-nasaq-teal hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Générer
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Permission Presets */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-nasaq-gold" />
                    Profils Prédéfinis (1 Clic)
                  </h3>
                  <span className="text-[10.5px] text-slate-400">
                    Cliquez pour appliquer un jeu de droits adapté
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PERMISSION_PRESETS.map((p) => {
                    const isSelected = selectedPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-nasaq-teal bg-nasaq-teal text-white shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-[11px] truncate">{p.label}</div>
                        <div className={`text-[9.5px] mt-0.5 line-clamp-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {p.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Granular Permissions Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-nasaq-teal" />
                  Détail des Droits d'Accès Accordés
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {permissionList.map((item) => {
                    const isGranted = permissions[item.key];
                    const isSensitive = item.key === 'canAccessPayroll' || item.key === 'canViewFinancials';

                    return (
                      <label
                        key={item.key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition select-none ${
                          isGranted
                            ? isSensitive 
                              ? 'border-amber-300 bg-amber-50/60' 
                              : 'border-nasaq-teal/40 bg-nasaq-teal-subtle/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={() => handleTogglePermission(item.key)}
                          className="mt-0.5 rounded text-nasaq-teal focus:ring-nasaq-teal h-4 w-4 shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-[11px] ${isGranted ? 'text-slate-900' : 'text-slate-600'}`}>
                              {item.label}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">Accès Application Désactivé</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cet employé n'a pas accès à la plateforme. Pour lui attribuer un accès sécurisé, activez l'interrupteur ci-dessus.
              </p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-bold"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-nasaq-teal hover:bg-nasaq-teal-dark text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les Accès'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
