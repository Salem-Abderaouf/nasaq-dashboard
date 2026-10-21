import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  X,
  Hammer,
  DoorOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { NavView } from '../layout/Sidebar';

interface StoreInfo {
  storeName: string;
  workshopPhone: string;
  salesPhone: string;
  email: string;
  address: string;
  workshopAddress: string;
  openingHoursWeekday: string;
  openingHoursThursday: string;
  openingHoursFriday: string;
  ribAccount: string;
  notes: string;
}

const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: 'NASAQ WPC Doors — Showroom & Atelier de Fabrication',
  workshopPhone: '+213 660 99 60 97',
  salesPhone: '+213 661 55 44 33',
  email: 'direction@nasaq.com',
  address: 'Showroom Principal NASAQ, Alger, Algérie',
  workshopAddress: 'Zone Industrielle & Artisanale, Bordj El Kiffan, Alger',
  openingHoursWeekday: 'Samedi — Mercredi : 08h30 - 17h30',
  openingHoursThursday: 'Jeudi : 08h30 - 16h00',
  openingHoursFriday: 'Vendredi : Fermé (Repos hebdomadaire)',
  ribAccount: '002 00012 1234567890 44 (Banque Nationale)',
  notes: 'Fabrication certifiée 100% étanche à l\'eau et imputrescible. Prise de cotes sur chantier et livraison 58 wilayas.'
};

const STORAGE_KEY = 'nasaq_store_info_data';

interface StoreInfoViewProps {
  onNavigate?: (view: NavView) => void;
}

export const StoreInfoView: React.FC<StoreInfoViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const isAdmin = user?.role === 'admin';

  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STORE_INFO;
    } catch {
      return DEFAULT_STORE_INFO;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StoreInfo>(storeInfo);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoreInfo(formData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-nasaq-teal text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-nasaq-gold-light text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('store.title', 'Coordonnées Officielles & Ateliers')}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-cinzel tracking-wide text-white">
            {t('store.title', 'Boutique & Atelier NASAQ WPC')}
          </h1>
          <p className="text-xs text-white/80 max-w-xl">
            {t('header.store.subtitle', 'Coordonnées de l\'atelier de menuiserie, contacts showroom et horaires')}
          </p>
        </div>

        <div className="flex items-center gap-2 z-10">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setFormData(storeInfo);
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>{t('store.editBtn', 'Modifier les Coordonnées')}</span>
            </button>
          )}

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('configurator')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-nasaq-gold hover:bg-nasaq-gold-light text-slate-900 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <DoorOpen className="w-4 h-4" />
              <span>{t('store.launchStudio', 'Lancer Studio Devis')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Atelier Principal & Usinage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nasaq-teal-subtle text-nasaq-teal flex items-center justify-center shrink-0">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{t('store.workshopTitle', 'Atelier & Fabrication')}</h2>
              <span className="text-[10.5px] text-slate-500">{t('store.workshopSubtitle', 'Unité de découpe CNC & Usinage')}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 text-[10.5px] font-semibold block mb-0.5">{t('store.workshopPhone', 'Téléphone Direct Atelier')}</span>
              <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-sm">
                <span>{storeInfo.workshopPhone}</span>
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${storeInfo.workshopPhone.replace(/\s+/g, '')}`}
                    className="p-1 rounded-md text-nasaq-teal hover:bg-nasaq-teal-subtle transition"
                    title={t('clients.call', 'Appeler')}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(storeInfo.workshopPhone, 'workshopPhone')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
                    title={t('clients.copyNumber', 'Copier le numéro')}
                  >
                    {copiedKey === 'workshopPhone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10.5px] font-semibold block mb-0.5">{t('store.workshopAddress', "Adresse de l'Usine")}</span>
              <div className="text-slate-700 flex items-start gap-1.5 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{storeInfo.workshopAddress}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
              {t('store.workshopManager', "Chef d'Atelier : M. Rachid Mebarki — Responsable de la mise en fabrication des portes et contrôle qualité.")}
            </div>
          </div>
        </div>

        {/* Card 2: Showroom Commercial & Ventes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nasaq-gold/20 text-nasaq-gold-dark flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{t('store.showroomTitle', 'Showroom & Ventes')}</h2>
              <span className="text-[10.5px] text-slate-500">{t('store.showroomSubtitle', 'Exposition modèles, devis & échantillons')}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 text-[10.5px] font-semibold block mb-0.5">{t('store.salesPhone', 'Ligne Commerciale')}</span>
              <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-sm">
                <span>{storeInfo.salesPhone}</span>
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${storeInfo.salesPhone.replace(/\s+/g, '')}`}
                    className="p-1 rounded-md text-nasaq-teal hover:bg-nasaq-teal-subtle transition"
                    title={t('clients.call', 'Appeler')}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(storeInfo.salesPhone, 'salesPhone')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
                    title={t('clients.copyNumber', 'Copier le numéro')}
                  >
                    {copiedKey === 'salesPhone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10.5px] font-semibold block mb-0.5">{t('store.officialEmail', 'Email Officiel')}</span>
              <div className="flex items-center justify-between font-mono text-slate-800 text-xs">
                <span>{storeInfo.email}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(storeInfo.email, 'email')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
                >
                  {copiedKey === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10.5px] font-semibold block mb-0.5">{t('store.showroomAddress', 'Adresse Showroom')}</span>
              <div className="text-slate-700 flex items-start gap-1.5 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{storeInfo.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Horaires & Accueil */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{t('store.hoursTitle', "Horaires d'Ouverture")}</h2>
              <span className="text-[10.5px] text-slate-500">{t('store.hoursSubtitle', 'Accueil client et réceptions atelier')}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-700">{t('store.weekdayHours', 'Samedi au Mercredi')}</span>
              <span className="font-mono font-bold text-emerald-700 text-[11px]">08:30 — 17:30</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-700">{t('store.thursdayHours', 'Jeudi')}</span>
              <span className="font-mono font-bold text-emerald-700 text-[11px]">08:30 — 16:00</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-200/50">
              <span className="font-semibold text-rose-800">{t('store.hoursFri', 'Vendredi')}</span>
              <span className="font-bold text-rose-600 text-[11px]">{t('store.fridayClosed', 'Fermé (Repos)')}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Engagements & Spécifications WPC */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-nasaq-teal font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-nasaq-gold" />
            <span>{t('store.guaranteeTitle', 'Spécifications & Garantie NASAQ')}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
            <li>{t('store.guarantee1', 'Composite Bois-Polymère (WPC) 100% étanche à l\'eau')}</li>
            <li>{t('store.guarantee2', 'Inattaquable par les termites et l\'humidité')}</li>
            <li>{t('store.guarantee3', 'Isolation acoustique renforcée avec joint d\'étanchéité')}</li>
            <li>{t('store.guarantee4', 'Épaisseur standard usine : 4.0 cm')}</li>
            <li>{t('store.guarantee5', 'Hauteur standard : 210 cm (sur-mesure disponible)')}</li>
          </ul>
        </div>

        {/* Card 5: Livraisons & Chantiers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-nasaq-teal font-bold text-sm">
            <Truck className="w-4 h-4 text-nasaq-teal" />
            <span>{t('store.logisticsTitle', 'Chantiers & Logistique')}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {storeInfo.notes}
          </p>
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-600">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">Alger</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">Blida</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">Tipaza</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">Boumerdès</span>
            <span className="px-2 py-0.5 bg-nasaq-gold/20 text-nasaq-gold-dark rounded-md">+54 Wilayas</span>
          </div>
        </div>

        {/* Card 6: Modalités de Paiement & RIB */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-nasaq-teal font-bold text-sm">
              <CreditCard className="w-4 h-4 text-nasaq-teal" />
              <span>{t('store.paymentTerms', 'Modalités de Paiement')}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-nasaq-gold/20 text-nasaq-gold-dark px-2 py-0.5 rounded">
              DZD (DA)
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <p>{t('store.paymentMethods', "Règlements acceptés : Espèces avec reçu d'atelier officiel, virement bancaire ou chèque certifié.")}</p>
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">{t('store.bankAccount', 'Compte Bancaire / RIB')}</span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-mono text-xs text-slate-900 border border-slate-200">
                <span className="truncate">{storeInfo.ribAccount}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(storeInfo.ribAccount, 'rib')}
                  className="p-1 text-slate-400 hover:text-slate-700 shrink-0"
                >
                  {copiedKey === 'rib' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Admin Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-nasaq-teal text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>{t('store.modalTitle', 'Modifier les Coordonnées de la Boutique')}</span>
              </h3>
              <button type="button" onClick={() => setIsEditing(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('store.workshopPhone', 'Téléphone Atelier Principal')}</label>
                <input
                  type="text"
                  required
                  value={formData.workshopPhone}
                  onChange={(e) => setFormData({ ...formData, workshopPhone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('store.salesPhone', 'Téléphone Service Commercial')}</label>
                <input
                  type="text"
                  required
                  value={formData.salesPhone}
                  onChange={(e) => setFormData({ ...formData, salesPhone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('store.officialEmail', 'Email Officiel')}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('store.workshopAddress', "Adresse de l'Usine / Atelier")}</label>
                <input
                  type="text"
                  value={formData.workshopAddress}
                  onChange={(e) => setFormData({ ...formData, workshopAddress: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('store.showroomAddress', 'Adresse du Showroom')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('store.bankAccount', 'RIB Bancaire')}</label>
                <input
                  type="text"
                  value={formData.ribAccount}
                  onChange={(e) => setFormData({ ...formData, ribAccount: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('clients.modal.notes', 'Notes / Engagements')}</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-nasaq-teal outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  {t('clients.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('common.save', 'Enregistrer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
