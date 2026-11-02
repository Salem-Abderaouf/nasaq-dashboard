import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../api/supabase';
import { Worker, SalaryAdvance, SalaryBonus, SalaryDeduction } from '../../types/database';
import { AuthService } from '../../services/authService';
import { PERMISSION_PRESETS } from '../../types/auth';
import {
  calculateNetSalary,
  calculateTotalBonuses,
  calculateTotalDeductions,
  calculateUnsettledAdvances,
  deleteWorkerCascade,
  serializeWorkerNotes
} from '../../helpers/workers/payrollHelpers';

export function useWorkersPayroll() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Worker deletion state & notifications
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

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

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('workers').select('*').order('name');
      if (error) throw error;
      setWorkers(data || []);
      if (data && data.length > 0) {
        setSelectedWorker(prev => prev ? (data.find(w => w.id === prev.id) || data[0]) : data[0]);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Fetch adjustments when selected worker changes
  useEffect(() => {
    if (!selectedWorker) return;

    let isMounted = true;
    async function loadWorkerFinances() {
      setLoadingAdjustments(true);
      try {
        const [advRes, bonRes, dedRes] = await Promise.all([
          supabase
            .from('salary_advances')
            .select('*')
            .eq('worker_id', selectedWorker!.id)
            .order('date', { ascending: false }),
          supabase
            .from('salary_bonuses')
            .select('*')
            .eq('worker_id', selectedWorker!.id)
            .order('date', { ascending: false }),
          supabase
            .from('salary_deductions')
            .select('*')
            .eq('worker_id', selectedWorker!.id)
            .order('date', { ascending: false })
        ]);

        if (isMounted) {
          setAdvances(advRes.data || []);
          setBonuses(bonRes.data || []);
          setDeductions(dedRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching worker adjustments:', err);
      } finally {
        if (isMounted) setLoadingAdjustments(false);
      }
    }

    loadWorkerFinances();
    return () => {
      isMounted = false;
    };
  }, [selectedWorker]);

  // Pure calculated stats
  const currentBase = useMemo(() => {
    return selectedWorker ? Number(selectedWorker.base_salary || 0) : 0;
  }, [selectedWorker]);

  const totalBonuses = useMemo(() => calculateTotalBonuses(bonuses), [bonuses]);
  const totalDeductions = useMemo(() => calculateTotalDeductions(deductions), [deductions]);
  const totalUnsettledAdvances = useMemo(() => calculateUnsettledAdvances(advances), [advances]);
  const netSalary = useMemo(() => {
    return calculateNetSalary(currentBase, bonuses, deductions, advances);
  }, [currentBase, bonuses, deductions, advances]);

  const handleCreateAdjustment = useCallback(async (
    e?: React.FormEvent,
    onError?: (msg: string) => void
  ) => {
    if (e) e.preventDefault();
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
      onError?.(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmittingAdj(false);
    }
  }, [selectedWorker, adjustmentModalType, adjAmount, adjDate, adjReason]);

  const handleCreateWorker = useCallback(async (
    e?: React.FormEvent,
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) => {
    if (e) e.preventDefault();
    if (!name.trim() || !phone.trim() || baseSalary <= 0) {
      onError?.('Veuillez remplir les champs obligatoires.');
      return;
    }

    setSubmittingWorker(true);
    try {
      let createdWorker: Worker;
      const calculatedEmail = newLoginEmail.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@nasaq.dz`;
      const preset = PERMISSION_PRESETS.find(p => p.id === newPresetId) || PERMISSION_PRESETS[0];
      const initialCreds = {
        login_email: calculatedEmail.toLowerCase(),
        password: newPassword.trim() || 'worker123',
        app_access_enabled: newAppAccess,
        permissions: preset.permissions
      };
      const serializedNotes = serializeWorkerNotes(null, initialCreds);

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
          status: 'active',
          notes: serializedNotes
        })
        .select()
        .single();

      if (error || !data) {
        createdWorker = {
          id: `worker-${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          email: calculatedEmail,
          position: position.trim(),
          base_salary: baseSalary,
          payment_day: paymentDay,
          employment_date: new Date().toISOString().split('T')[0],
          status: 'active',
          notes: serializedNotes
        };
      } else {
        createdWorker = data;
      }

      AuthService.saveWorkerCredentials(createdWorker, initialCreds);

      setWorkers(prev => [...prev, createdWorker]);
      setSelectedWorker(createdWorker);
      setIsAddWorkerModalOpen(false);
      setName('');
      setPhone('');
      setNewLoginEmail('');
      setNewPassword('worker123');
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating worker:', err);
      onError?.(err.message || 'Erreur lors de la création de l\'employé.');
    } finally {
      setSubmittingWorker(false);
    }
  }, [name, phone, baseSalary, newLoginEmail, position, paymentDay, newPresetId, newPassword, newAppAccess]);

  const handleDeleteWorker = useCallback(async (
    successMessageTemplate?: string,
    errorMessage?: string
  ) => {
    if (!workerToDelete) return;
    setDeletingWorker(true);
    try {
      await deleteWorkerCascade(supabase, workerToDelete.id);
      AuthService.deleteWorkerCredentials(workerToDelete);

      const deletedId = workerToDelete.id;
      const deletedName = workerToDelete.name;
      setWorkers(prev => {
        const remaining = prev.filter(w => w.id !== deletedId);
        if (selectedWorker?.id === deletedId) {
          setSelectedWorker(remaining.length > 0 ? remaining[0] : null);
        }
        return remaining;
      });

      const msg = successMessageTemplate 
        ? successMessageTemplate.replace('{name}', deletedName)
        : `Employé "${deletedName}" supprimé avec succès.`;
      showToast(msg, 'success');
      setWorkerToDelete(null);
    } catch (err: any) {
      console.error('Error deleting worker:', err);
      showToast(err.message || errorMessage || 'Erreur lors de la suppression de l\'employé.', 'error');
    } finally {
      setDeletingWorker(false);
    }
  }, [workerToDelete, selectedWorker, showToast]);

  return {
    workers,
    loading,
    fetchWorkers,
    selectedWorker,
    setSelectedWorker,
    advances,
    bonuses,
    deductions,
    loadingAdjustments,
    currentBase,
    totalBonuses,
    totalDeductions,
    totalUnsettledAdvances,
    netSalary,
    // Adjustments modal
    adjustmentModalType,
    setAdjustmentModalType,
    adjAmount,
    setAdjAmount,
    adjReason,
    setAdjReason,
    adjDate,
    setAdjDate,
    submittingAdj,
    handleCreateAdjustment,
    // Add worker modal & form
    isAddWorkerModalOpen,
    setIsAddWorkerModalOpen,
    name,
    setName,
    phone,
    setPhone,
    position,
    setPosition,
    baseSalary,
    setBaseSalary,
    paymentDay,
    setPaymentDay,
    newLoginEmail,
    setNewLoginEmail,
    newPassword,
    setNewPassword,
    newAppAccess,
    setNewAppAccess,
    newPresetId,
    setNewPresetId,
    submittingWorker,
    handleCreateWorker,
    // Credentials modal
    isCredentialsModalOpen,
    setIsCredentialsModalOpen,
    // Worker deletion
    workerToDelete,
    setWorkerToDelete,
    deletingWorker,
    handleDeleteWorker,
    // Feedback
    toast,
    setToast,
    showToast
  };
}
