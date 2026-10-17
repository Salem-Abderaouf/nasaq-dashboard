import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Prospect, ProspectStatus } from '../../types/database';
import { getProspectStatusMeta, formatDate } from '../../utils/formatters';
import { 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Phone, 
  MapPin, 
  UserCheck, 
  X,
  ArrowRight
} from 'lucide-react';

const STAGES: { id: ProspectStatus; label: string; color: string }[] = [
  { id: 'new', label: '1. Nouveau', color: 'border-blue-400 bg-blue-50/50' },
  { id: 'contacted', label: '2. Contacté', color: 'border-purple-400 bg-purple-50/50' },
  { id: 'interested', label: '3. Intéressé', color: 'border-amber-400 bg-amber-50/50' },
  { id: 'negotiation', label: '4. Négociation', color: 'border-indigo-400 bg-indigo-50/50' },
  { id: 'converted', label: '5. Converti Client', color: 'border-emerald-400 bg-emerald-50/50' },
  { id: 'lost', label: '6. Perdu', color: 'border-rose-400 bg-rose-50/50' }
];

export const ProspectsPipelineView: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // New form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('new');
  const [submitting, setSubmitting] = useState(false);

  const fetchProspects = async () => {
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
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: ProspectStatus) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error('Error updating prospect status:', err);
      alert('Erreur lors de la mise à jour du prospect.');
    }
  };

  // Convert Prospect to Client (section 4.3 of business.md)
  const handleConvert = async (prospect: Prospect) => {
    if (!confirm(`Convertir le prospect "${prospect.name}" en client formel ?`)) return;

    setConvertingId(prospect.id);
    try {
      // 1. Insert into clients
      const { error: clientErr } = await supabase.from('clients').insert({
        name: prospect.name,
        phone: prospect.phone,
        address: prospect.address || null,
        notes: prospect.notes ? `Converti depuis prospect. Notes: ${prospect.notes}` : 'Converti depuis prospect.'
      });

      if (clientErr) throw clientErr;

      // 2. Update status to converted
      await handleUpdateStatus(prospect.id, 'converted');
      alert(`Prospect "${prospect.name}" converti avec succès dans le répertoire des clients !`);
    } catch (err: any) {
      console.error('Error converting prospect:', err);
      alert(err.message || 'Erreur lors de la conversion.');
    } finally {
      setConvertingId(null);
    }
  };

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Nom et téléphone requis.');
      return;
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
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      setStatus('new');
    } catch (err: any) {
      console.error('Error creating prospect:', err);
      alert(err.message || 'Erreur lors de la création du prospect.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            Pipeline des Prospects & Opportunités
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des 6 étapes de négociation et conversion directe en clients
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
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Prospect</span>
          </button>
        </div>
      </div>

      {/* Kanban Stages Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageProspects = prospects.filter(p => p.status === stage.id);

          return (
            <div 
              key={stage.id}
              className={`rounded-2xl border ${stage.color} p-3 flex flex-col h-[75vh] min-w-[210px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10">
                <span className="font-bold text-xs text-slate-800">{stage.label}</span>
                <span className="w-5 h-5 rounded-full bg-white text-slate-700 font-mono text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                  {stageProspects.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {stageProspects.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-[11px] text-slate-400 italic">
                    Aucun lead
                  </div>
                ) : (
                  stageProspects.map(p => (
                    <div 
                      key={p.id}
                      className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:shadow-xs transition space-y-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 mt-0.5">
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
                        <p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 line-clamp-2">
                          {p.notes}
                        </p>
                      )}

                      {/* Stage selector dropdown */}
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                        <select
                          value={p.status}
                          onChange={(e) => handleUpdateStatus(p.id, e.target.value as ProspectStatus)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600"
                        >
                          <option value="new">Nouveau</option>
                          <option value="contacted">Contacté</option>
                          <option value="interested">Intéressé</option>
                          <option value="negotiation">Négociation</option>
                          <option value="converted">Converti</option>
                          <option value="lost">Perdu</option>
                        </select>

                        {p.status !== 'converted' && (
                          <button
                            type="button"
                            onClick={() => handleConvert(p)}
                            disabled={convertingId === p.id}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded transition flex items-center gap-0.5"
                            title="Convertir en client formel"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Client</span>
                          </button>
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

      {/* New Prospect Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-nasaq-gold" />
                <h3 className="font-bold text-sm">Nouveau Prospect / Lead</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProspect} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nom / Contact *</label>
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
                <label className="block font-semibold text-slate-600 mb-1">Téléphone *</label>
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
                <label className="block font-semibold text-slate-600 mb-1">Adresse / Ville</label>
                <input 
                  type="text"
                  placeholder="ex: Cheraga, Alger"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Étape Initiale</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProspectStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none bg-white"
                >
                  <option value="new">1. Nouveau Lead</option>
                  <option value="contacted">2. Contact Établi</option>
                  <option value="interested">3. Intéressé par le catalogue</option>
                  <option value="negotiation">4. En Négociation de Devis</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Besoins / Spécifications</label>
                <textarea 
                  rows={2}
                  placeholder="Modèles demandés, nombre de portes..."
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
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Création...' : 'Créer le Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
