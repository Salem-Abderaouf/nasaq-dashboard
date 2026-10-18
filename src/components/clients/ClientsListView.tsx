import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Client } from '../../types/database';
import { formatMoney, formatDate } from '../../utils/formatters';
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
  Pencil
} from 'lucide-react';

interface ClientsListViewProps {
  onStartOrderForClient: (client: Client) => void;
}

export const ClientsListView: React.FC<ClientsListViewProps> = ({
  onStartOrderForClient
}) => {
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

  const fetchClients = async () => {
    setLoading(true);
    try {
      let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

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
    } catch (err) {
      console.error('Error fetching client stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Veuillez renseigner le nom et le téléphone.');
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
        .select()
        .single();

      if (error) throw error;
      setClients(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewNotes('');
    } catch (err: any) {
      console.error('Error creating client:', err);
      alert(err.message || 'Erreur lors de la création du client.');
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
      alert('Veuillez renseigner le nom et le téléphone.');
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
        .select()
        .single();

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === data.id ? data : c));
      if (selectedClientForStats && selectedClientForStats.id === data.id) {
        setSelectedClientForStats(data);
      }
      setClientToEdit(null);
    } catch (err: any) {
      console.error('Error updating client:', err);
      alert(err.message || 'Erreur lors de la mise à jour du client.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            Répertoire Clients & Suivi des Comptes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comptes clients, coordonnées, encaissements et suivi des créances
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchClients}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Client</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Rechercher par nom ou numéro de téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal transition"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Chargement des clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
            Aucun client trouvé. Créez-en un nouveau ou utilisez l'initialisation démo.
          </div>
        ) : (
          clients.map(client => (
            <div 
              key={client.id}
              className="bg-white border border-slate-200 hover:border-nasaq-teal-light rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{client.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(client.created_at)}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-nasaq-teal shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                  {client.notes && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      "{client.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(client)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-nasaq-teal hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                    title="Modifier les coordonnées du client"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>Modifier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openClientStats(client)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-nasaq-teal hover:bg-slate-100 px-2 py-1 rounded-lg transition"
                    title="Relevé financier & créances"
                  >
                    <ReceiptText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Relevé</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onStartOrderForClient(client)}
                  className="flex items-center gap-1 text-[11px] font-bold text-nasaq-teal bg-nasaq-teal-subtle hover:bg-nasaq-teal/20 px-2.5 py-1 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouvelle Commande</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">Ajouter un Nouveau Client</h3>
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
                <label className="block font-semibold text-slate-600 mb-1">Nom / Entreprise *</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: M. Ahmed Benali"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Téléphone *</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: 0550 12 34 56"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Adresse de Livraison / Chantier</label>
                <input 
                  type="text"
                  placeholder="ex: Résidence Les Pins, Oran"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Notes / Instructions</label>
                <textarea 
                  rows={2}
                  placeholder="Notes commerciales, type de projet..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
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
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Création...' : 'Créer le Client'}
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
                <h3 className="font-bold text-sm">Modifier la Fiche Client</h3>
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
                <label className="block font-semibold text-slate-600 mb-1">Nom / Entreprise *</label>
                <input 
                  type="text"
                  required
                  placeholder="Nom complet du client"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Téléphone *</label>
                <input 
                  type="tel"
                  required
                  placeholder="0660 00 00 00"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Adresse de Chantier / Livraison</label>
                <input 
                  type="text"
                  placeholder="Adresse ou localisation du chantier"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Remarques & Notes Internes</label>
                <textarea 
                  rows={2}
                  placeholder="Notes particulières, préférences..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClientToEdit(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating ? 'Enregistrement...' : 'Enregistrer les Modifications'}
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
                <h3 className="font-bold text-sm">Relevé Financier & Créances — {selectedClientForStats.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedClientForStats)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition border border-slate-600"
                  title="Modifier les coordonnées de ce client"
                >
                  <Pencil className="w-3 h-3 text-nasaq-gold" />
                  <span>Modifier</span>
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
                <div className="py-8 text-center text-slate-400">Calcul du relevé client...</div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Commandes</span>
                      <div className="font-mono text-base font-extrabold text-slate-800">{clientStats.totalOrders}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Facturé</span>
                      <div className="font-mono text-sm font-extrabold text-slate-900">{formatMoney(clientStats.totalValue)}</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold">Total Réglé</span>
                      <div className="font-mono text-sm font-extrabold text-emerald-700">{formatMoney(clientStats.totalPaid)}</div>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] text-rose-700 uppercase font-bold">Reste Dû</span>
                      <div className="font-mono text-sm font-extrabold text-rose-700">{formatMoney(clientStats.outstanding)}</div>
                    </div>
                  </div>

                  {/* Recent Payments */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-nasaq-teal" />
                      Derniers Règlements Encaissés
                    </h4>
                    {clientStats.recentPayments.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
                        Aucun paiement enregistré pour ce client.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Commande</th>
                              <th className="py-2 px-3">Montant</th>
                              <th className="py-2 px-3">Notes</th>
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
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
