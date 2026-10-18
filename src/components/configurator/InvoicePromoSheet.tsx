import React from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { COLOR_CATALOG } from '../../data/colors';
import { PATTERN_CATALOG } from '../../data/patterns';
import { calculateOrderSummary } from '../../utils/pricing';
import { formatMoney, formatDiff } from '../../utils/formatters';
import { downloadElementAsPNG } from '../../utils/exportUtils';
import { Printer, Download } from 'lucide-react';

interface InvoicePromoSheetProps {
  doors: DoorConfigItem[];
  info: StudioGeneralInfo;
}

export const InvoicePromoSheet: React.FC<InvoicePromoSheetProps> = ({
  doors,
  info
}) => {
  const summary = calculateOrderSummary(
    doors,
    true,
    info.isPoseEnabled,
    info.isTransportEnabled,
    info.paidAmount
  );

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-3.5 px-6 rounded-xl flex items-center justify-between text-xs shadow-xs">
        <div className="font-bold flex items-center gap-2">
          <span>🎁</span>
          <span>OFFRE PROMOTIONNELLE SPÉCIALE — Remise commerciale appliquée sur votre commande</span>
        </div>
        <span className="bg-white text-emerald-800 font-extrabold px-3 py-1 rounded-full text-[11px] uppercase tracking-wider">
          Économie Immédiate
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 flex items-center justify-between no-print shadow-xs">
        <span className="text-xs font-semibold text-slate-500">Document Officiel — Devis & Facture Promotionnelle</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadElementAsPNG('invoice-promo-export', `NASAQ - Devis Promo - ${info.clientName || 'Client'}`)}
            className="flex items-center gap-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger Image (PNG)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-nasaq-teal-subtle text-nasaq-teal border border-nasaq-teal px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer le Devis Promo
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div 
        id="invoice-promo-export"
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print-card p-8 md:p-10"
      >
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start border-b-2 border-nasaq-teal-subtle pb-6 mb-8 gap-6">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="mb-2">
              <img src="/nasaq-logo-cropped.png" alt="NASAQ (نسق) WPC" className="h-14 w-auto object-contain" />
            </div>
            <div className="text-nasaq-gold text-xs font-bold uppercase tracking-widest mb-2">
              WPC Door Solutions & Menuiserie Moderne
            </div>
            <div className="text-xs text-slate-500 leading-relaxed space-y-0.5">
              <p><strong className="text-slate-700">Vendeur :</strong> NASAQ Menuiserie WPC</p>
              <p><strong className="text-slate-700">Tél :</strong> +213 660 99 60 97</p>
              <p><strong className="text-slate-700">Email :</strong> nasaq.decore@gmail.com</p>
              <p><strong className="text-slate-700">Garantie :</strong> Résistance totale à l'humidité, 100% WPC</p>
            </div>
          </div>

          {/* Meta & Client */}
          <div className="text-right flex flex-col items-end">
            <h2 className="font-cinzel text-3xl font-extrabold text-nasaq-teal-dark tracking-widest mb-1">
              DEVIS PROMO
            </h2>
            <div className="font-mono text-sm font-semibold text-nasaq-gold-dark mb-1">
              N° {info.docRef}-PROMO
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Date : {info.docDate}
            </div>

            <div className="bg-nasaq-teal-subtle border-l-4 border-nasaq-teal p-3 px-4 rounded-r-lg text-left min-w-[220px]">
              <div className="text-[10px] font-extrabold uppercase text-nasaq-teal tracking-wider">
                Client
              </div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {info.clientName || 'Nouveau Client'}
              </div>
              {info.clientPhone && (
                <div className="text-xs text-slate-700 font-mono mt-0.5">
                  Tél : {info.clientPhone}
                </div>
              )}
              {info.clientAddress ? (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {info.clientAddress}
                </div>
              ) : (
                <div className="text-xs text-slate-500">Projet Résidentiel</div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-nasaq-teal text-white uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 w-14 font-bold">Réf.</th>
                <th className="py-3 px-3 font-bold">Désignation</th>
                <th className="py-3 px-3 text-center w-12 font-bold">Qté</th>
                <th className="py-3 px-3 text-right w-28 font-bold">Prix initial</th>
                <th className="py-3 px-3 text-right w-24 font-bold text-rose-200">Remise</th>
                <th className="py-3 px-3 text-right w-28 font-bold text-amber-200">Prix promo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Aucun article dans cette facture promo.
                  </td>
                </tr>
              ) : (
                doors.map((door, idx) => {
                  const isDouble = door.doorStructure === 'double';
                  const hasRev = Boolean(door.hasRevetment);
                  const revH = Number(door.revetmentHeightCm) || 0;
                  const activeColor = COLOR_CATALOG.find(c => c.id === door.colorId) || COLOR_CATALOG[2];
                  const activePat = PATTERN_CATALOG.find(p => p.id === (door.patternId || 'none')) || PATTERN_CATALOG[0];
                  const pNorm = door.priceNormal || 0;
                  const pProm = door.pricePromo || 0;
                  const discount = pNorm - pProm;

                  let specs = `Dimensions : ${door.heightCm} × ${door.widthCm} cm`;
                  if (hasRev && revH > 0) {
                    specs += ` + Imposte (H: ${revH} cm) [Total: ${door.heightCm + revH} cm]`;
                  }
                  if (activePat.id !== 'none') {
                    specs += ` | Motif : ${activePat.name}${isDouble ? ' (Vantail D)' : ''}`;
                  }
                  if (door.glassPanes && door.glassPanes.length > 0) {
                    specs += ` | Vitrages : ${door.glassPanes.length} découpe(s)`;
                  }
                  specs += ` | Teinte : ${activeColor.name} | Quincaillerie : ${door.hardwareColor === 'chrome' ? 'Chrome' : 'Noir Mat'}`;

                  return (
                    <tr key={door.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-3 px-3 font-mono font-bold text-nasaq-teal">{door.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 text-xs">{door.designation}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{specs}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">1</td>
                      <td className="py-3 px-3 text-right font-mono line-through text-slate-400">{formatMoney(pNorm)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">{formatDiff(discount)}</td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-nasaq-teal">{formatMoney(pProm)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Card */}
        <div className="flex justify-end mb-8">
          <div className="w-80 md:w-96 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Sous-total portes (avant remise) :</span>
              <span className="font-mono line-through">{formatMoney(summary.subtotalDoorsNormal)}</span>
            </div>

            <div className="flex justify-between text-rose-600 font-bold border-y border-dashed border-slate-200 py-1.5">
              <span>Remise commerciale accordée :</span>
              <span className="font-mono">{formatDiff(summary.totalDiscount)}</span>
            </div>

            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Sous-total portes remisées :</span>
              <span className="font-mono font-bold">{formatMoney(summary.subtotalDoorsPromo)}</span>
            </div>

            {info.isPoseEnabled && summary.totalDoorsCount > 0 && (
              <div className="flex justify-between text-nasaq-teal font-medium">
                <span>
                  Pose & Installation ({summary.singleCount} simple{summary.singleCount > 1 ? 's' : ''}
                  {summary.doubleCount > 0 ? ` + ${summary.doubleCount} double${summary.doubleCount > 1 ? 's' : ''}` : ''}) :
                </span>
                <span className="font-mono font-bold">{formatMoney(summary.poseCost)}</span>
              </div>
            )}

            {info.isTransportEnabled && summary.totalDoorsCount > 0 && (
              <div className="flex justify-between text-nasaq-teal font-medium">
                <span>Transport & Livraison :</span>
                <span className="font-mono font-bold">{formatMoney(summary.transportCost)}</span>
              </div>
            )}

            <div className="border-t-2 border-nasaq-teal pt-2 mt-2 flex justify-between items-center text-slate-900">
              <span className="font-bold text-sm text-nasaq-teal-dark">Total Net Promo :</span>
              <span className="font-mono text-2xl font-extrabold text-nasaq-gold-dark">
                {formatMoney(summary.grandTotalPromo)}
              </span>
            </div>

            {info.paidAmount > 0 && (
              <>
                <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between text-nasaq-blue font-semibold">
                  <span>Montant versé (Acompte) :</span>
                  <span className="font-mono font-bold">{formatMoney(info.paidAmount)}</span>
                </div>
                <div className="bg-nasaq-teal-subtle p-2 rounded flex justify-between text-nasaq-teal-dark font-extrabold text-sm">
                  <span>Reste à payer :</span>
                  <span className="font-mono">{formatMoney(summary.remainingBalancePromo)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-6 mt-8 border-t border-slate-200">
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-nasaq-teal-dark">Visa Client</div>
            <div className="text-[11px] text-slate-400 mb-12">Bon pour accord et confirmation de l'offre</div>
            <div className="border-b-2 border-slate-600 w-full mb-1"></div>
            <div className="text-[10px] text-slate-400 italic">Signature Client</div>
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-nasaq-teal-dark">Pour NASAQ WPC</div>
            <div className="text-[11px] text-slate-400 mb-12">Validation commerciale offre promo</div>
            <div className="border-b-2 border-slate-600 w-full mb-1"></div>
            <div className="text-[10px] text-slate-400 italic">Direction Commerciale</div>
          </div>
        </div>

        {/* Footer greeting */}
        <div className="text-center mt-10 py-3 bg-nasaq-teal-subtle rounded-lg text-nasaq-teal-dark font-medium text-xs">
          ✨ Offre promotionnelle NASAQ valide sous réserve de confirmation ✨
        </div>
      </div>
    </div>
  );
};
