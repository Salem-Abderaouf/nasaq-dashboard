import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { formatMoney } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface DoorLeaderboardItem {
  reference: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

interface TopDoorsLeaderboardProps {
  items: DoorLeaderboardItem[];
  onViewCatalog?: () => void;
}

export const TopDoorsLeaderboard: React.FC<TopDoorsLeaderboardProps> = ({
  items,
  onViewCatalog
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-nasaq-teal-subtle text-nasaq-teal flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {t('dashboard.topDoors', 'Modèles WPC les Plus Vendus')}
            </h2>
          </div>
          {onViewCatalog && (
            <button
              type="button"
              onClick={onViewCatalog}
              className="text-xs text-nasaq-teal font-bold hover:underline flex items-center gap-1"
            >
              <span>{t('dashboard.catalogLink', 'Catalogue')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              {t('dashboard.noTopDoors', 'Aucune donnée de vente pour le moment.')}
            </div>
          ) : (
            items.slice(0, 5).map((item, idx) => (
              <div 
                key={item.reference || idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-nasaq-teal text-white font-mono font-bold text-[11px] flex items-center justify-center">
                    {item.reference}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{item.name}</div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">{item.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 font-mono">{item.quantity} {t('dashboard.units', 'unités')}</div>
                  <div className="text-[11px] text-nasaq-teal font-mono font-semibold">{formatMoney(item.revenue)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 bg-nasaq-gold-subtle/80 border border-nasaq-gold/30 rounded-xl text-[11px] text-nasaq-gold-dark font-medium leading-relaxed">
        {t('dashboard.workshopNote', '💡 Note Atelier : Les portes composites WPC assurent 100% d\'étanchéité, aucune déformation et une durabilité supérieure face au bois massif.')}
      </div>
    </div>
  );
};
