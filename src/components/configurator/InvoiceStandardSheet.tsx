import React from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { COLOR_CATALOG } from '../../data/colors';
import { PATTERN_CATALOG } from '../../data/patterns';
import { calculateOrderSummary } from '../../utils/pricing';
import { formatMoney } from '../../utils/formatters';
import { downloadElementAsPNG } from '../../utils/exportUtils';
import { Printer, Download } from 'lucide-react';

interface InvoiceStandardSheetProps {
  doors: DoorConfigItem[];
  info: StudioGeneralInfo;
}

export const InvoiceStandardSheet: React.FC<InvoiceStandardSheetProps> = ({
  doors,
  info
}) => {
  const summary = calculateOrderSummary(
    doors,
    false,
    info.isPoseEnabled,
    info.isTransportEnabled,
    info.paidAmount
  );

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 flex items-center justify-between no-print shadow-xs">
        <span className="text-xs font-semibold text-slate-500">Document Officiel — Facture Client Standard</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadElementAsPNG('invoice-normal-export', `NASAQ - Facture - ${info.clientName || 'Client'}`)}
            className="flex items-center gap-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger Image (PNG)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-nasaq-teal-subtle text-nasaq-teal border border-nasaq-teal px-3 py-1.5 rounded-lg text-xs font-bold transition"
            title="Imprimer ou Enregistrer en PDF (Ctrl+P / Cmd+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer la Facture (PDF)
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div 
        id="invoice-normal-export"
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
              <p><strong className="text-slate-700">Spécialité :</strong> Portes 100% WPC étanches & anti-termites</p>
            </div>
          </div>

          {/* Meta & Client */}
          <div className="text-right flex flex-col items-end">
            <h2 className="font-cinzel text-3xl font-extrabold text-nasaq-teal-dark tracking-widest mb-1">
              FACTURE
            </h2>
            <div className="font-mono text-sm font-semibold text-nasaq-gold-dark mb-1">
              N° {info.docRef}
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
                <th className="py-3 px-3.5 w-16 font-bold">Réf.</th>
                <th className="py-3 px-3.5 font-bold">Désignation</th>
                <th className="py-3 px-3.5 text-center w-14 font-bold">Qté</th>
                <th className="py-3 px-3.5 text-right w-32 font-bold">Prix unitaire</th>
                <th className="py-3 px-3.5 text-right w-32 font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Aucun article dans cette facture.
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
                  specs += ` | Teinte : ${activeColor.name}`;

                  return (
                    <tr key={door.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-3 px-3.5 font-mono font-bold text-nasaq-teal">{door.id}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800 text-xs">{door.designation}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{specs}</div>
                      </td>
                      <td className="py-3 px-3.5 text-center font-semibold">1</td>
                      <td className="py-3 px-3.5 text-right font-mono font-semibold">{formatMoney(pNorm)}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">{formatMoney(pNorm)}</td>
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
            <div className="flex justify-between text-slate-600">
              <span>Sous-total portes :</span>
              <span className="font-mono font-semibold">{formatMoney(summary.subtotalDoorsNormal)}</span>
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
              <span className="font-bold text-sm text-nasaq-teal-dark">Total Général :</span>
              <span className="font-mono text-xl font-extrabold text-nasaq-teal">
                {formatMoney(summary.grandTotalNormal)}
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
                  <span className="font-mono">{formatMoney(summary.remainingBalanceNormal)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-6 mt-8 border-t border-slate-200">
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-nasaq-teal-dark">Visa Client</div>
            <div className="text-[11px] text-slate-400 mb-12">Bon pour accord et confirmation</div>
            <div className="border-b-2 border-slate-600 w-full mb-1"></div>
            <div className="text-[10px] text-slate-400 italic">Signature Client</div>
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-nasaq-teal-dark">Pour NASAQ WPC</div>
            <div className="text-[11px] text-slate-400 mb-12">Cachet et signature de la direction</div>
            <div className="border-b-2 border-slate-600 w-full mb-1"></div>
            <div className="text-[10px] text-slate-400 italic">Direction Commerciale</div>
          </div>
        </div>

        {/* Footer greeting */}
        <div className="text-center mt-10 py-3 bg-nasaq-teal-subtle rounded-lg text-nasaq-teal-dark font-medium text-xs">
          ✨ Merci pour votre confiance — NASAQ garantit la durabilité et l'élégance de vos portes WPC ✨
        </div>
      </div>
    </div>
  );
};
