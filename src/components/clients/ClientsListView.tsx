import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Client } from '../../types/database';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Users, 
  Search, 
  Plus, 
  RefreshCw, 
  Phone, 
  MapPin, 
  ReceiptText, 
  X,
  CreditCard,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShoppingBag
} from 'lucide-react';

interface ClientsListViewProps {
  onStartOrderForClient: (client: Client) => void;
}

export const ClientsListView: React.FC<ClientsListViewProps> = ({
  onStartOrderForClient
}) => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForStats, setSelectedClientForStats] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<any | null>(null);
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

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchClients = async () => {
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
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  // Copy phone number to clipboard
  const handleCopyPhone = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.phone) return;
    navigator.clipboard.writeText(client.phone);
    setCopiedClientId(client.id);
    setTimeout(() => setCopiedClientId(null), 2000);
  };

  // Helper to extract clean initials for avatar badge
  const getInitials = (name: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Load client stats ledger
  const openClientStats = async (client: Client) => {
    setSelectedClientForStats(client);
    setLoadingStats(true);
    try {
      // Fetch orders for this client
      const { data: clientOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', client.id);

      const ordersList = clientOrders || [];
      const totalOrders = ordersList.length;
      let totalValue = 0;
      let totalPaid = 0;
      let outstanding = 0;

      ordersList.forEach(o => {
        const tot = Number(o.total_amount) || 0;
        const paid = Number(o.paid_amount) || 0;
        if (o.status !== 'cancelled') {
          totalValue += tot;
          totalPaid += paid;
          if (tot > paid) {
            outstanding += (tot - paid);
          }
        }
      });

      // Fetch recent payments
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
        totalOrders,
        totalValue,
        totalPaid,
        outstanding,
        orders: ordersList,
        recentPayments
      });
    } catch (err: any) {
      console.error('Error fetching client stats:', err);
      showToast('Impossible de charger le relevé client.', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
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
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewNotes('');
      showToast(`Client "${data.name}" créé avec succès !`, 'success');
    } catch (err: any) {
      console.error('Error creating client:', err);
      showToast(err.message || 'Erreur lors de la création du client.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (client: Client) => {
    setClientToEdit(client);
    setEditName(client.name || '');
    setEditPhone(client.phone || '');
    setEditAddress(client.address || '');
    setEditNotes(client.notes || '');
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
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
  };

  // Delete client handler
  const handleDeleteClient = async () => {
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
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
              : 'bg-rose-900/95 text-rose-100 border-rose-700'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button 
              type="button" 
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
              {t('clients.title', 'Répertoire Clients & Suivi des Comptes')}
            </h1>
            <span className="px-2.5 py-0.5 bg-nasaq-teal/10 text-nasaq-teal border border-nasaq-teal/20 text-xs font-bold rounded-full font-mono">
              {clients.length} {t('clients.ordersCount', 'clients')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('clients.subtitle', 'Comptes clients, coordonnées, encaissements et suivi des créances')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchClients}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Rafraîchir la liste"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('clients.refresh', 'Actualiser')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark active:scale-[0.99] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('clients.newClient', 'Nouveau Client')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text"
            placeholder={t('clients.searchPlaceholder', 'Rechercher par nom ou numéro de téléphone...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal transition"
          />
          {search && (
            <button 
              type="button" 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Affichage : <strong className="text-slate-800">{clients.length}</strong> client(s)
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-nasaq-teal" />
            <p className="text-xs font-semibold">{t('clients.loading', 'Chargement des clients...')}</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200 p-6">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">
              {t('clients.noClients', 'Aucun client trouvé. Créez-en un nouveau ou utilisez l\'initialisation démo.')}
            </p>
          </div>
        ) : (
          clients.map(client => {
            const ordersCount = client.orders ? client.orders.length : 0;
            const initials = getInitials(client.name);
            const isCopied = copiedClientId === client.id;

            return (
              <div 
                key={client.id}
                className="bg-white border border-slate-200/90 hover:border-nasaq-teal/40 rounded-2xl p-4 md:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Avatar, Name, Creation Date, Orders Count Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar initials badge */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nasaq-teal/15 to-nasaq-teal/5 border border-nasaq-teal/20 text-nasaq-teal font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 
                          onClick={() => openClientStats(client)}
                          className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-nasaq-teal transition cursor-pointer"
                          title={client.name}
                        >
                          {client.name}
                        </h3>
                        <span className="text-[10.5px] text-slate-400 font-mono block mt-0.5">
                          Inscrit le {formatDate(client.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Orders count badge */}
                    <div className="shrink-0">
                      {ordersCount > 0 ? (
                        <span 
                          onClick={() => openClientStats(client)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                          title={`${ordersCount} commande(s) liée(s) à ce client`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{ordersCount} {t('clients.ordersCount', 'cde(s)')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-slate-100 text-slate-400">
                          0 {t('clients.ordersCount', 'cde')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info Pill */}
                  <div className="space-y-1.5 pt-1">
                    {/* Phone */}
                    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-700">
                      <a 
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-1.5 hover:text-nasaq-teal font-bold transition truncate"
                        title="Appeler le client"
                      >
                        <Phone className="w-3.5 h-3.5 text-nasaq-teal shrink-0" />
                        <span>{client.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(client, e)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white transition shrink-0"
                        title="Copier le numéro"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Address */}
                    {client.address && (
                      <div className="flex items-start gap-1.5 text-slate-600 text-[11.5px] px-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={client.address}>{client.address}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {client.notes && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-amber-50/60 p-2 rounded-xl border border-amber-100/70 mt-1">
                        "{client.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* 4 Card Actions Toolbar */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {/* Action 1 (Primary): Nouvelle Commande */}
                  <button
                    type="button"
                    onClick={() => onStartOrderForClient(client)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-nasaq-teal hover:bg-nasaq-teal-dark active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow transition-all"
                    title={t('clients.newOrderTooltip', 'Démarrer un nouveau projet / devis pour ce client dans le Studio 2D')}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('clients.newOrder', 'Nouvelle Commande')}</span>
                  </button>

                  {/* Actions 2, 3, 4: Relevé, Modifier, Supprimer */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Action 2: Relevé Financier */}
                    <button
                      type="button"
                      onClick={() => openClientStats(client)}
                      className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-nasaq-teal bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 px-1.5 rounded-lg transition"
                      title={t('clients.statementTooltip', 'Afficher le relevé financier, versements et créances')}
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{t('clients.statement', 'Relevé')}</span>
                    </button>

                    {/* Action 3: Modifier */}
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-amber-700 bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-200 py-1.5 px-1.5 rounded-lg transition"
                      title={t('clients.editTooltip', 'Modifier les coordonnées du client')}
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{t('clients.edit', 'Modifier')}</span>
                    </button>

                    {/* Action 4: Supprimer */}
                    <button
                      type="button"
                      onClick={() => setClientToDelete(client)}
                      className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 py-1.5 px-1.5 rounded-lg transition"
                      title={t('clients.deleteTooltip', 'Supprimer ce client')}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 shrink-0" />
                      <span className="truncate">{t('clients.delete', 'Supprimer')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('clients.deleteConfirmTitle', 'Supprimer le Client')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('clients.deleteConfirmPrompt', 'Êtes-vous sûr de vouloir supprimer définitivement la fiche de')} <strong className="text-slate-800 font-bold">"{clientToDelete.name}"</strong> ?
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setClientToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-relaxed">
                  {t('clients.deleteWarningOrders', 'Ce client ne pourra être supprimé que s\'il ne possède aucune commande enregistrée dans l\'historique comptable.')}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clients.modal.name', 'Nom')} :</span>
                  <span className="font-bold text-slate-800">{clientToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clients.modal.phone', 'Téléphone')} :</span>
                  <span className="text-slate-800">{clientToDelete.phone}</span>
                </div>
                {clientToDelete.orders && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">{t('clients.ordersLinked', 'Commandes liées :')}</span>
                    <span className="font-bold text-slate-800">{clientToDelete.orders.length}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition text-xs"
              >
                {t('clients.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl font-bold transition text-xs shadow-xs disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('clients.deleting', 'Suppression...')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clients.confirmDelete', 'Supprimer définitivement')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">{t('clients.newClient', 'Ajouter un Nouveau Client')}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.name', 'Nom / Entreprise *')}</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: M. Ahmed Benali"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.phone', 'Téléphone *')}</label>
                <input 
                  type="tel"
                  required
                  placeholder="ex: 0550 12 34 56"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.address', 'Adresse de Livraison / Chantier')}</label>
                <input 
                  type="text"
                  placeholder="ex: Résidence Les Pins, Oran"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.notes', 'Notes / Instructions')}</label>
                <textarea 
                  rows={2}
                  placeholder="Notes commerciales, type de projet..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  {t('clients.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark active:scale-[0.99] text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {submitting ? t('clients.modal.creating', 'Création...') : t('clients.modal.create', 'Créer le Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {clientToEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-800 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-nasaq-gold" />
                <h3 className="font-bold text-sm">{t('clients.modal.editTitle', 'Modifier la Fiche Client')}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setClientToEdit(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.name', 'Nom / Entreprise *')}</label>
                <input 
                  type="text"
                  required
                  placeholder="Nom complet du client"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.phone', 'Téléphone *')}</label>
                <input 
                  type="tel"
                  required
                  placeholder="0660 00 00 00"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.address', 'Adresse de Chantier / Livraison')}</label>
                <input 
                  type="text"
                  placeholder="Adresse ou localisation du chantier"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.notes', 'Remarques & Notes Internes')}</label>
                <textarea 
                  rows={2}
                  placeholder="Notes particulières, préférences..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nasaq-teal focus:ring-1 focus:ring-nasaq-teal focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClientToEdit(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  {t('clients.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark active:scale-[0.99] text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating ? t('clients.modal.saving', 'Enregistrement...') : t('clients.modal.save', 'Enregistrer les Modifications')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Financial Ledger Modal */}
      {selectedClientForStats && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-800 text-white p-4 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">{t('clients.ledgerTitle', 'Relevé Financier & Créances')} — {selectedClientForStats.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedClientForStats)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition border border-slate-600"
                  title={t('clients.editDetails', 'Modifier les coordonnées de ce client')}
                >
                  <Pencil className="w-3 h-3 text-nasaq-gold" />
                  <span>{t('clients.edit', 'Modifier')}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedClientForStats(null)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {loadingStats || !clientStats ? (
                <div className="py-8 text-center text-slate-400">{t('clients.calcStatement', 'Calcul du relevé client...')}</div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {t('orders.itemsCount', 'Commandes')}
                      </span>
                      <div className="font-mono text-base font-extrabold text-slate-800">{clientStats.totalOrders}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {t('orderPayments.totalInvoiced', 'Total Facturé')}
                      </span>
                      <div className="font-mono text-sm font-extrabold text-slate-900">{formatMoney(clientStats.totalValue)}</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold">
                        {t('orderPayments.totalPaid', 'Total Réglé')}
                      </span>
                      <div className="font-mono text-sm font-extrabold text-emerald-700">{formatMoney(clientStats.totalPaid)}</div>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] text-rose-700 uppercase font-bold">
                        {t('orderPayments.balanceDue', 'Reste Dû')}
                      </span>
                      <div className="font-mono text-sm font-extrabold text-rose-700">{formatMoney(clientStats.outstanding)}</div>
                    </div>
                  </div>

                  {/* Recent Payments */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-nasaq-teal" />
                      {t('orderPayments.recordedPayments', 'Derniers Règlements Encaissés')}
                    </h4>
                    {clientStats.recentPayments.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
                        {t('orderPayments.noPayments', 'Aucun paiement enregistré pour ce client.')}
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                            <tr>
                              <th className="py-2 px-3">{t('orderPayments.tableDate', 'Date')}</th>
                              <th className="py-2 px-3">{t('orders.number', 'Commande')}</th>
                              <th className="py-2 px-3">{t('orderPayments.tableAmount', 'Montant')}</th>
                              <th className="py-2 px-3">{t('orderPayments.tableNotes', 'Notes')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {clientStats.recentPayments.map((p: any) => (
                              <tr key={p.id}>
                                <td className="py-2 px-3 font-mono text-slate-600">{formatDate(p.payment_date)}</td>
                                <td className="py-2 px-3 font-mono font-bold text-nasaq-teal">{p.orders?.order_number || '-'}</td>
                                <td className="py-2 px-3 font-mono font-bold text-emerald-700">{formatMoney(p.amount)}</td>
                                <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{p.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClientForStats(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
