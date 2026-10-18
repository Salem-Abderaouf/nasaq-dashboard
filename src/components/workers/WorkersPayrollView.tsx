import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Worker, SalaryAdvance, SalaryBonus, SalaryDeduction } from '../../types/database';
import { formatMoney, formatDate } from '../../utils/formatters';
import { 
  BadgeDollarSign, 
  Users, 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  X,
  CheckCircle2,
  Calendar,
  Briefcase,
  Key,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { WorkerCredentialsModal } from './WorkerCredentialsModal';
import { AuthService } from '../../services/authService';
import { PERMISSION_PRESETS } from '../../types/auth';

export const WorkersPayrollView: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Financial adjustments for selected worker
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [bonuses, setBonuses] = useState<SalaryBonus[]>([]);
  const [deductions, setDeductions] = useState<SalaryDeduction[]>([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);

  // Modals for adding advance / bonus / deduction
  const [adjustmentModalType, setAdjustmentModalType] = useState<'advance' | 'bonus' | 'deduction' | null>(null);
  const [adjAmount, setAdjAmount] = useState<number>(5000);
  const [adjReason, setAdjReason] = useState<string>('');
  const [adjDate, setAdjDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submittingAdj, setSubmittingAdj] = useState(false);

  // New worker form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Menuisier Artisan WPC');
  const [baseSalary, setBaseSalary] = useState(65000);
  const [paymentDay, setPaymentDay] = useState(5);
  const [newLoginEmail, setNewLoginEmail] = useState('');
  const [newPassword, setNewPassword] = useState('worker123');
  const [newAppAccess, setNewAppAccess] = useState(true);
  const [newPresetId, setNewPresetId] = useState('workshop');
  const [submittingWorker, setSubmittingWorker] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('workers').select('*').order('name');
      if (error) throw error;
      setWorkers(data || []);
      if (data && data.length > 0 && !selectedWorker) {
        setSelectedWorker(data[0]);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Fetch adjustments when selected worker changes
  useEffect(() => {
    if (!selectedWorker) return;

    async function loadWorkerFinances() {
      setLoadingAdjustments(true);
      try {
        const { data: adv } = await supabase
          .from('salary_advances')
          .select('*')
          .eq('worker_id', selectedWorker!.id)
          .order('date', { ascending: false });

        const { data: bon } = await supabase
          .from('salary_bonuses')
          .select('*')
          .eq('worker_id', selectedWorker!.id)
          .order('date', { ascending: false });

        const { data: ded } = await supabase
          .from('salary_deductions')
          .select('*')
          .eq('worker_id', selectedWorker!.id)
          .order('date', { ascending: false });

        setAdvances(adv || []);
        setBonuses(bon || []);
        setDeductions(ded || []);
      } catch (err) {
        console.error('Error fetching worker adjustments:', err);
      } finally {
        setLoadingAdjustments(false);
      }
    }

    loadWorkerFinances();
  }, [selectedWorker]);

  // Compute Net Payroll according to Section 7.4 of business.md:
  // Final Disbursement = max(Base Salary + Bonuses - Deductions - Unsettled Advances, 0)
  const currentBase = selectedWorker ? Number(selectedWorker.base_salary || 0) : 0;
  const totalBonuses = bonuses.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalDeductions = deductions.reduce((acc, d) => acc + Number(d.amount || 0), 0);
  const totalUnsettledAdvances = advances
    .filter(a => !a.is_settled)
    .reduce((acc, a) => acc + Number(a.amount || 0), 0);

  const netSalary = Math.max(0, currentBase + totalBonuses - totalDeductions - totalUnsettledAdvances);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !adjustmentModalType || adjAmount <= 0) return;

    setSubmittingAdj(true);
    try {
      if (adjustmentModalType === 'advance') {
        const { data, error } = await supabase
          .from('salary_advances')
          .insert({
            worker_id: selectedWorker.id,
            amount: adjAmount,
            date: adjDate,
            reason: adjReason.trim() || null,
            is_settled: false
          })
          .select()
          .single();

        if (error) throw error;
        setAdvances(prev => [data, ...prev]);
      } else if (adjustmentModalType === 'bonus') {
        const { data, error } = await supabase
          .from('salary_bonuses')
          .insert({
            worker_id: selectedWorker.id,
            amount: adjAmount,
            date: adjDate,
            reason: adjReason.trim() || null
          })
          .select()
          .single();

        if (error) throw error;
        setBonuses(prev => [data, ...prev]);
      } else if (adjustmentModalType === 'deduction') {
        const { data, error } = await supabase
          .from('salary_deductions')
          .insert({
            worker_id: selectedWorker.id,
            amount: adjAmount,
            date: adjDate,
            reason: adjReason.trim() || null
          })
          .select()
          .single();

        if (error) throw error;
        setDeductions(prev => [data, ...prev]);
      }

      setAdjustmentModalType(null);
      setAdjAmount(5000);
      setAdjReason('');
    } catch (err: any) {
      console.error('Error saving adjustment:', err);
      alert(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmittingAdj(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || baseSalary <= 0) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    setSubmittingWorker(true);
    try {
      let createdWorker: Worker;
      const calculatedEmail = newLoginEmail.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@nasaq.dz`;

      const { data, error } = await supabase
        .from('workers')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          email: calculatedEmail,
          position: position.trim(),
          base_salary: baseSalary,
          payment_day: paymentDay,
          employment_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single();

      if (error || !data) {
        // Fallback for local state when Supabase RLS is on anon
        createdWorker = {
          id: `worker-${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          email: calculatedEmail,
          position: position.trim(),
          base_salary: baseSalary,
          payment_day: paymentDay,
          employment_date: new Date().toISOString().split('T')[0],
          status: 'active'
        };
      } else {
        createdWorker = data;
      }

      // Configure initial app credentials and preset permissions
      const preset = PERMISSION_PRESETS.find(p => p.id === newPresetId) || PERMISSION_PRESETS[0];
      const initialCreds = {
        login_email: calculatedEmail.toLowerCase(),
        password: newPassword.trim() || 'worker123',
        app_access_enabled: newAppAccess,
        permissions: preset.permissions
      };
      AuthService.saveWorkerCredentials(createdWorker, initialCreds);

      setWorkers(prev => [...prev, createdWorker]);
      setSelectedWorker(createdWorker);
      setIsAddWorkerModalOpen(false);
      setName('');
      setPhone('');
      setNewLoginEmail('');
      setNewPassword('worker123');
    } catch (err: any) {
      console.error('Error creating worker:', err);
      alert(err.message || 'Erreur lors de la création de l\'employé.');
    } finally {
      setSubmittingWorker(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            Ressources Humaines & Moteur de Paie
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Salaires de base, gestion des avances sur salaire, primes et retenues
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchWorkers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddWorkerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Employé</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Workers List on Left, Active Worker Payroll Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workers List Column */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
              Artisans & Employés ({workers.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Chargement des employés...</div>
            ) : workers.length === 0 ? (
              <div className="py-6 text-center text-slate-400 italic text-xs">
                Aucun employé enregistré.
              </div>
            ) : (
              workers.map(w => {
                const isSelected = selectedWorker?.id === w.id;
                const creds = AuthService.getWorkerCredentials(w.email || w.id);
                const hasAppAccess = creds ? creds.app_access_enabled : true;

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorker(w)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'border-nasaq-teal bg-nasaq-teal-subtle/80 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{w.name}</span>
                      <span className="font-mono font-bold text-nasaq-teal text-xs">{formatMoney(w.base_salary)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="truncate max-w-[130px]">{w.position}</span>
                      <div className="flex items-center gap-1.5">
                        {hasAppAccess ? (
                          <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                            <Key className="w-2.5 h-2.5 text-emerald-600" />
                            Accès
                          </span>
                        ) : (
                          <span className="text-[9.5px] bg-slate-100 text-slate-400 px-1 py-0.2 rounded">
                            Sans accès
                          </span>
                        )}
                        <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded font-mono">
                          J:{w.payment_day}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Worker Payroll Card */}
        <div className="lg:col-span-2 space-y-4">
          {selectedWorker ? (
            <>
              {/* Profile Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-base">{selectedWorker.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Actif
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-nasaq-teal" />
                      {selectedWorker.position}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Embauche: {formatDate(selectedWorker.employment_date)}
                    </span>
                    <span className="font-mono text-slate-600">
                      Tél: {selectedWorker.phone}
                    </span>
                  </div>
                </div>

                {/* Quick Adjustment Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentModalType('advance')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    + Avance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentModalType('bonus')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    + Prime
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentModalType('deduction')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    - Retenue
                  </button>
                </div>
              </div>

              {/* App Credentials and Permissions Status Block */}
              {(() => {
                const activeCreds = AuthService.getWorkerCredentials(selectedWorker.email || selectedWorker.id);
                const isEnabled = activeCreds ? activeCreds.app_access_enabled : true;
                const activePermCount = activeCreds 
                  ? Object.values(activeCreds.permissions).filter(Boolean).length 
                  : 4;
                const loginEmail = activeCreds?.login_email || selectedWorker.email || `${selectedWorker.name.toLowerCase().replace(/\s+/g, '.')}@nasaq.dz`;

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">Accès Application & Droits Ouvrier</span>
                          {isEnabled ? (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Actif ({loginEmail})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-200 text-slate-600">
                              Accès Désactivé
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isEnabled 
                            ? `Droits d'accès accordés par l'admin : ${activePermCount} / 11 permissions actives`
                            : "L'employé ne peut pas se connecter. Activez son compte et attribuez-lui des droits."
                          }
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCredentialsModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-nasaq-teal border border-nasaq-teal/40 rounded-xl text-xs font-bold transition shadow-2xs"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Gérer les Identifiants & Droits</span>
                    </button>
                  </div>
                );
              })()}

              {/* Monthly Net Salary Summary Box */}
              <div className="bg-gradient-to-r from-nasaq-teal to-nasaq-teal-dark text-white rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-nasaq-gold-light">
                  Calcul du Salaire Net à Verser (Cycle en cours)
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-white/70 block">Salaire de Base</span>
                    <span className="font-mono font-bold text-sm text-white">{formatMoney(currentBase)}</span>
                  </div>
                  <div>
                    <span className="text-white/70 block">+ Primes</span>
                    <span className="font-mono font-bold text-sm text-emerald-300">+{formatMoney(totalBonuses)}</span>
                  </div>
                  <div>
                    <span className="text-white/70 block">- Retenues</span>
                    <span className="font-mono font-bold text-sm text-rose-300">-{formatMoney(totalDeductions)}</span>
                  </div>
                  <div>
                    <span className="text-white/70 block">- Avances Non Soldées</span>
                    <span className="font-mono font-bold text-sm text-amber-300">-{formatMoney(totalUnsettledAdvances)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="font-cinzel text-sm font-bold text-white tracking-wide">
                    Net Estimé Après Déductions :
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-nasaq-gold">
                    {formatMoney(netSalary)}
                  </span>
                </div>
              </div>

              {/* Adjustments Detail Tables */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Advances */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase flex items-center justify-between">
                    <span>Avances ({advances.length})</span>
                    <span className="text-[10px] font-mono text-amber-700">Total: {formatMoney(totalUnsettledAdvances)}</span>
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {advances.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-2">Aucune avance</p>
                    ) : (
                      advances.map(a => (
                        <div key={a.id} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-[11px]">
                          <div>
                            <div className="font-mono font-bold text-slate-800">{formatMoney(a.amount)}</div>
                            <span className="text-[10px] text-slate-400">{formatDate(a.date)}</span>
                          </div>
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${a.is_settled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {a.is_settled ? 'Soldée' : 'En cours'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Bonuses */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase flex items-center justify-between">
                    <span>Primes ({bonuses.length})</span>
                    <span className="text-[10px] font-mono text-emerald-700">Total: +{formatMoney(totalBonuses)}</span>
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {bonuses.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-2">Aucune prime</p>
                    ) : (
                      bonuses.map(b => (
                        <div key={b.id} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-[11px]">
                          <div>
                            <div className="font-mono font-bold text-emerald-700">+{formatMoney(b.amount)}</div>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{b.reason || 'Bonus performance'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(b.date)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase flex items-center justify-between">
                    <span>Retenues ({deductions.length})</span>
                    <span className="text-[10px] font-mono text-rose-700">Total: -{formatMoney(totalDeductions)}</span>
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {deductions.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-2">Aucune retenue</p>
                    ) : (
                      deductions.map(d => (
                        <div key={d.id} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-[11px]">
                          <div>
                            <div className="font-mono font-bold text-rose-700">-{formatMoney(d.amount)}</div>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{d.reason || 'Pénalité'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(d.date)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic">
              Sélectionnez un employé pour afficher le détail de paie.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Adjustment (Advance / Bonus / Deduction) */}
      {adjustmentModalType && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-3.5 px-5 flex items-center justify-between">
              <span className="font-bold text-xs capitalize">
                Ajouter une {adjustmentModalType === 'advance' ? 'Avance sur Salaire' : adjustmentModalType === 'bonus' ? 'Prime Exceptionnelle' : 'Retenue / Pénalité'}
              </span>
              <button type="button" onClick={() => setAdjustmentModalType(null)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Montant (DA) *</label>
                <input 
                  type="number"
                  min={500}
                  step={500}
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none text-nasaq-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Date d'Application</label>
                <input 
                  type="date"
                  required
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Motif / Justificatif</label>
                <input 
                  type="text"
                  placeholder="ex: Avance fête de l'aïd, prime de rendement..."
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalType(null)}
                  disabled={submittingAdj}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingAdj}
                  className="px-4 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white font-bold rounded-lg"
                >
                  {submittingAdj ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add New Worker */}
      {isAddWorkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">Ajouter un Collaborateur / Artisan</h3>
              </div>
              <button type="button" onClick={() => setIsAddWorkerModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nom Complet *</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: Rachid Mebarki"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Téléphone *</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: 0550 44 33 22"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Poste / Fonction</label>
                <input 
                  type="text"
                  placeholder="ex: Menuisier Poseur, Opérateur CNC..."
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Salaire de Base (DA) *</label>
                  <input 
                    type="number"
                    step={1000}
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-nasaq-teal focus:border-nasaq-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Jour de Paie (1-31)</label>
                  <input 
                    type="number"
                    min={1}
                    max={31}
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(Number(e.target.value) || 5)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:border-nasaq-teal focus:outline-none"
                  />
                </div>
              </div>

              {/* Login Credentials & Permissions Section for New Worker */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-nasaq-teal" />
                    Accès & Connexion Application
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={newAppAccess}
                      onChange={(e) => setNewAppAccess(e.target.checked)}
                      className="rounded text-nasaq-teal focus:ring-nasaq-teal"
                    />
                    <span>Activer la connexion</span>
                  </label>
                </div>

                {newAppAccess && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-slate-500 text-[10.5px] mb-0.5">Identifiant / Email</label>
                        <input
                          type="text"
                          placeholder={name ? `${name.toLowerCase().replace(/\s+/g, '.')}@nasaq.dz` : 'employe@nasaq.dz'}
                          value={newLoginEmail}
                          onChange={(e) => setNewLoginEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-nasaq-teal outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-500 text-[10.5px] mb-0.5">Mot de passe temporaire</label>
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-nasaq-teal outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-500 text-[10.5px] mb-0.5">Profil de droits par défaut</label>
                      <select
                        value={newPresetId}
                        onChange={(e) => setNewPresetId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-nasaq-teal outline-none"
                      >
                        {PERMISSION_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWorkerModalOpen(false)}
                  disabled={submittingWorker}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingWorker}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submittingWorker ? 'Création...' : 'Créer l\'Employé & Enregistrer Accès'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Worker Credentials & Permissions */}
      {isCredentialsModalOpen && selectedWorker && (
        <WorkerCredentialsModal
          worker={selectedWorker}
          onClose={() => setIsCredentialsModalOpen(false)}
          onSaved={() => {
            // Trigger state update
            setWorkers(prev => [...prev]);
          }}
        />
      )}
    </div>
  );
};
