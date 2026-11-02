import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../api/supabase';
import { Prospect, ProspectStatus } from '../../types/database';
import { filterProspects } from '../../helpers/prospects/prospectHelpers';

export function useProspectsPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // New prospect form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('new');
  const [submitting, setSubmitting] = useState(false);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (err) {
      console.error('Error fetching prospects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: ProspectStatus) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      return true;
    } catch (err) {
      console.error('Error updating prospect status:', err);
      return false;
    }
  }, []);

  const handleConvert = useCallback(async (
    prospect: Prospect,
    onSuccess?: (msg: string) => void,
    onError?: (err: string) => void
  ) => {
    setConvertingId(prospect.id);
    try {
      // 1. Insert into clients table
      const { error: clientErr } = await supabase.from('clients').insert({
        name: prospect.name,
        phone: prospect.phone,
        address: prospect.address || null,
        notes: prospect.notes ? `Converti depuis prospect. Notes: ${prospect.notes}` : 'Converti depuis prospect.'
      });

      if (clientErr) throw clientErr;

      // 2. Update status to converted
      const ok = await handleUpdateStatus(prospect.id, 'converted');
      if (!ok) throw new Error('Échec de la mise à jour du statut.');

      onSuccess?.(`Prospect "${prospect.name}" converti avec succès dans le répertoire des clients !`);
      return true;
    } catch (err: any) {
      console.error('Error converting prospect:', err);
      onError?.(err.message || 'Erreur lors de la conversion');
      return false;
    } finally {
      setConvertingId(null);
    }
  }, [handleUpdateStatus]);

  const resetForm = useCallback(() => {
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setStatus('new');
  }, []);

  const handleCreateProspect = useCallback(async (
    e?: React.FormEvent,
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) => {
    if (e) e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      onError?.('Nom et téléphone requis.');
      return false;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('prospects')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          notes: notes.trim() || null,
          status: status
        })
        .select()
        .single();

      if (error) throw error;
      setProspects(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
      onSuccess?.();
      return true;
    } catch (err: any) {
      console.error('Error creating prospect:', err);
      onError?.(err.message || 'Erreur lors de la création du prospect.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [name, phone, address, notes, status, resetForm]);

  const filteredProspects = useMemo(() => {
    return filterProspects(prospects, search);
  }, [prospects, search]);

  return {
    prospects,
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
    // Form fields
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
    resetForm,
    handleCreateProspect,
    handleUpdateStatus,
    handleConvert
  };
}
