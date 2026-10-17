import React, { useState } from 'react';
import { Order } from '../../types/database';
import { supabase } from '../../api/supabase';
import { formatMoney } from '../../utils/formatters';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';

interface RecordPaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  if (!order) return null;

  const remaining = Math.max(0, order.total_amount - order.paid_amount);
  const [amount, setAmount] = useState<number>(remaining || 10000);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Versement acompte / règlement');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Le montant doit être supérieur à 0.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: payErr } = await supabase.from('order_payments').insert({
        order_id: order.id,
        amount: amount,
        payment_date: paymentDate,
        notes: notes,
        status: 'successful'
      });

      if (payErr) throw payErr;
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement du paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-nasaq-teal text-white p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-nasaq-gold" />
            <h3 className="font-bold text-sm">Encaisser un Versement</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Commande :</span>
              <span className="font-mono font-bold text-nasaq-teal">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Client :</span>
              <span className="font-semibold text-slate-800">{order.clients?.name}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Commande :</span>
              <span className="font-mono font-semibold">{formatMoney(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Déjà Versé :</span>
              <span className="font-mono text-emerald-600 font-semibold">{formatMoney(order.paid_amount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
              <span>Reste à Payer :</span>
              <span className="font-mono text-rose-600 text-sm">{formatMoney(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Montant à Encaisser (DA) *</label>
            <input 
              type="number"
              min={1}
              step={500}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-nasaq-teal focus:border-nasaq-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Date d'Encaissement *</label>
            <input 
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Remarques / Référence (Espèces, Chèque, etc.)</label>
            <input 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Espèces reçues au showroom..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-nasaq-teal focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Validation...' : 'Valider l\'Encaissement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
