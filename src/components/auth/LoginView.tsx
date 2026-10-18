import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Hammer, 
  Briefcase, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setError(result.error || 'Identifiants incorrects.');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'admin' | 'workshop' | 'commercial') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-100 p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* Top Brand Header */}
        <div className="bg-nasaq-dark p-6 text-center text-white relative">
          <div className="w-16 h-16 bg-white rounded-xl p-1.5 mx-auto shadow-xs flex items-center justify-center mb-3">
            <img 
              src="/nasaq-logo-cropped.png" 
              alt="NASAQ WPC" 
              className="h-11 w-auto object-contain" 
            />
          </div>
          <h1 className="font-cinzel text-xl font-bold tracking-wider">
            NASAQ <span className="text-nasaq-gold">WPC</span>
          </h1>
          <p className="text-[11px] text-nasaq-gold-light uppercase tracking-widest font-semibold mt-0.5">
            Portes & Menuiserie Haute Résistance
          </p>
          <div className="text-xs text-slate-300 mt-1 font-medium">
            Plateforme de Gestion & Atelier
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Identifiant ou Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@nasaq.com ou email employé"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-nasaq-teal focus:ring-2 focus:ring-nasaq-teal/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Mot de passe ou Code PIN
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-nasaq-teal focus:ring-2 focus:ring-nasaq-teal/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-nasaq-teal hover:bg-nasaq-teal-dark active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-nasaq-gold" />
                Accès Rapides Préconfigurés
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('admin')}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl border border-nasaq-gold/40 bg-nasaq-gold/10 hover:bg-nasaq-gold/20 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-nasaq-gold text-slate-900 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Direction Générale (Admin)</div>
                    <div className="text-[10px] text-slate-500">Accès total : finances, RH & salaires, paramètres</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-nasaq-gold-dark group-hover:translate-x-0.5 transition font-mono">
                  Entrer →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('workshop')}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-nasaq-teal text-white flex items-center justify-center shrink-0">
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Rachid (Chef d'Atelier)</div>
                    <div className="text-[10px] text-slate-500">Mode Atelier : fiches de débit, usinage, sans prix</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-nasaq-teal group-hover:translate-x-0.5 transition font-mono">
                  Entrer →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('commercial')}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Sofiane (Commercial Showroom)</div>
                    <div className="text-[10px] text-slate-500">Mode Vente : Studio devis 2D, clients, acomptes</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition font-mono">
                  Entrer →
                </span>
              </button>
            </div>
          </div>

          <div className="text-center text-[10.5px] text-slate-400">
            Contrôle d'accès basé sur les rôles (RBAC) & RLS Supabase
          </div>
        </div>

      </div>
    </div>
  );
};
