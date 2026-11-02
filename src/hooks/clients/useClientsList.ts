import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/supabase';
import { Client } from '../../types/database';
import { calculateClientFinancials, ClientFinancialStats } from '../../helpers/clients/clientHelpers';

export interface FullClientStats extends ClientFinancialStats {
  orders: any[];
  recentPayments: any[];
}

export function useClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForStats, setSelectedClientForStats] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<FullClientStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // New client form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit client state
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete client state
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('*, orders (id)')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      showToast(err.message || 'Erreur lors du chargement des clients.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCopyPhone = useCallback((client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.phone) return;
    navigator.clipboard.writeText(client.phone);
    setCopiedClientId(client.id);
    setTimeout(() => setCopiedClientId(null), 2000);
  }, []);

  const openClientStats = useCallback(async (client: Client) => {
    setSelectedClientForStats(client);
    setLoadingStats(true);
    try {
      const { data: clientOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', client.id);

      const ordersList = clientOrders || [];
      const financials = calculateClientFinancials(ordersList);

      let recentPayments: any[] = [];
      if (ordersList.length > 0) {
        const orderIds = ordersList.map(o => o.id);
        const { data: payData } = await supabase
          .from('order_payments')
          .select('*, orders (order_number)')
          .in('order_id', orderIds)
          .order('payment_date', { ascending: false })
          .limit(10);
        recentPayments = payData || [];
      }

      setClientStats({
        ...financials,
        orders: ordersList,
        recentPayments
      });
    } catch (err: any) {
      console.error('Error fetching client stats:', err);
      showToast('Impossible de charger le relevé client.', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  const closeClientStats = useCallback(() => {
    setSelectedClientForStats(null);
    setClientStats(null);
  }, []);

  const resetCreateForm = useCallback(() => {
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewNotes('');
  }, []);

  const handleCreateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      showToast('Veuillez renseigner le nom et le numéro de téléphone.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim() || null,
          notes: newNotes.trim() || null
        })
        .select('*, orders (id)')
        .single();

      if (error) throw error;
      setClients(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      resetCreateForm();
      showToast(`Client "${data.name}" créé avec succès !`, 'success');
    } catch (err: any) {
      console.error('Error creating client:', err);
      showToast(err.message || 'Erreur lors de la création du client.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [newName, newPhone, newAddress, newNotes, resetCreateForm, showToast]);

  const openEditModal = useCallback((client: Client) => {
    setClientToEdit(client);
    setEditName(client.name || '');
    setEditPhone(client.phone || '');
    setEditAddress(client.address || '');
    setEditNotes(client.notes || '');
  }, []);

  const closeEditModal = useCallback(() => {
    setClientToEdit(null);
  }, []);

  const handleUpdateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    if (!editName.trim() || !editPhone.trim()) {
      showToast('Veuillez renseigner le nom et le numéro de téléphone.', 'error');
      return;
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: editName.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim() || null,
          notes: editNotes.trim() || null
        })
        .eq('id', clientToEdit.id)
        .select('*, orders (id)')
        .single();

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === data.id ? data : c));
      if (selectedClientForStats && selectedClientForStats.id === data.id) {
        setSelectedClientForStats(data);
      }
      setClientToEdit(null);
      showToast(`Fiche de "${data.name}" mise à jour avec succès.`, 'success');
    } catch (err: any) {
      console.error('Error updating client:', err);
      showToast(err.message || 'Erreur lors de la mise à jour du client.', 'error');
    } finally {
      setUpdating(false);
    }
  }, [clientToEdit, editName, editPhone, editAddress, editNotes, selectedClientForStats, showToast]);

  const handleDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;

    setDeleting(true);
    try {
      // 1. Verify if client has existing orders in database
      const { count, error: countErr } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientToDelete.id);

      if (countErr) throw countErr;

      if (count && count > 0) {
        showToast(
          `Suppression impossible : "${clientToDelete.name}" est associé à ${count} commande(s) active(s). Veuillez d'abord supprimer ou réaffecter ses commandes.`,
          'error'
        );
        setClientToDelete(null);
        return;
      }

      // 2. Perform deletion
      const { error: delErr } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (delErr) throw delErr;

      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      if (selectedClientForStats?.id === clientToDelete.id) {
        setSelectedClientForStats(null);
      }
      showToast(`Client "${clientToDelete.name}" supprimé avec succès.`, 'success');
      setClientToDelete(null);
    } catch (err: any) {
      console.error('Error deleting client:', err);
      showToast(err.message || 'Erreur lors de la suppression du client.', 'error');
    } finally {
      setDeleting(false);
    }
  }, [clientToDelete, selectedClientForStats, showToast]);

  return {
    clients,
    loading,
    search,
    setSearch,
    fetchClients,
    // Add modal & form
    isAddModalOpen,
    setIsAddModalOpen,
    newName,
    setNewName,
    newPhone,
    setNewPhone,
    newAddress,
    setNewAddress,
    newNotes,
    setNewNotes,
    submitting,
    handleCreateClient,
    resetCreateForm,
    // Edit modal & form
    clientToEdit,
    setClientToEdit,
    openEditModal,
    closeEditModal,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    editAddress,
    setEditAddress,
    editNotes,
    setEditNotes,
    updating,
    handleUpdateClient,
    // Delete
    clientToDelete,
    setClientToDelete,
    deleting,
    handleDeleteClient,
    // Stats ledger
    selectedClientForStats,
    setSelectedClientForStats,
    clientStats,
    loadingStats,
    openClientStats,
    closeClientStats,
    // Feedback
    toastMessage,
    setToastMessage,
    copiedClientId,
    handleCopyPhone,
    showToast
  };
}
