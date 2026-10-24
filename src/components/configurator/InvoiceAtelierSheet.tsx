import React from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { COLOR_CATALOG } from '../../data/colors';
import { PATTERN_CATALOG } from '../../data/patterns';
import { downloadElementAsPNG } from '../../utils/exportUtils';
import { Printer, Download } from 'lucide-react';

interface InvoiceAtelierSheetProps {
  doors: DoorConfigItem[];
  info: StudioGeneralInfo;
}

export const InvoiceAtelierSheet: React.FC<InvoiceAtelierSheetProps> = ({
  doors,
  info
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-3.5 px-6 rounded-xl flex items-center justify-between text-xs shadow-xs no-print">
        <div className="font-bold flex items-center gap-2">
          <span>🔨</span>
          <span>FICHE DE FABRICATION & DÉBIT ATELIER — Ordre de travail pour menuisiers & poseurs</span>
        </div>
        <span className="bg-sky-400 text-slate-950 font-extrabold px-3 py-1 rounded-full text-[11px] uppercase tracking-wider">
          Production WPC
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 flex items-center justify-between no-print shadow-xs">
        <span className="text-xs font-semibold text-slate-500">Usage Interne — Données Techniques & Dimensions de Fabrication</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadElementAsPNG('invoice-atelier-export', `NASAQ - Fiche Atelier - ${info.clientName || 'Client'}`)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger Image (PNG)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
            title="Imprimer ou Enregistrer en PDF (Ctrl+P / Cmd+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer la Fiche Atelier (PDF)
          </button>
        </div>
      </div>

      {/* Atelier Card */}
      <div 
        id="invoice-atelier-export"
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print-card p-8 md:p-10"
      >
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start border-b-2 border-slate-200 pb-6 mb-8 gap-6">
          <div className="max-w-sm">
            <div className="mb-2">
              <img src="/nasaq-logo-cropped.png" alt="NASAQ (نسق) WPC" className="h-14 w-auto object-contain" />
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
              Atelier de Fabrication & Débit CNC
            </div>
            <div className="text-xs text-slate-500 leading-relaxed space-y-0.5">
              <p><strong className="text-slate-700">Responsable Technique :</strong> Atelier Central NASAQ</p>
              <p><strong className="text-slate-700">Tél Support :</strong> +213 660 99 60 97</p>
              <p><strong className="text-slate-700">Matière première :</strong> Profilés & Panneaux WPC Haute Densité</p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <h2 className="font-cinzel text-3xl font-extrabold text-slate-800 tracking-widest mb-1">
              FICHE ATELIER
            </h2>
            <div className="font-mono text-sm font-semibold text-nasaq-teal mb-1">
              ORDRE : {info.docRef}-FAB
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Émission : {info.docDate}
            </div>

            <div className="bg-slate-100 border-l-4 border-slate-700 p-3 px-4 rounded-r-lg text-left min-w-[220px]">
              <div className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">
                Dossier Client / Chantier
              </div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {info.clientName || 'Nouveau Client'}
              </div>
              {info.clientPhone && (
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  Contact : {info.clientPhone}
                </div>
              )}
              {info.clientAddress && (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Chantier : {info.clientAddress}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-0.5">Nombre d'éléments : {doors.length} porte{doors.length > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        {/* Table - NO PRICES */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse text-xs table-atelier">
            <thead>
              <tr className="bg-slate-800 text-white uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 w-14 font-bold">Réf.</th>
                <th className="py-3 px-3 font-bold">Désignation, Motif & Usinages Vitrages</th>
                <th className="py-3 px-3 text-center w-48 font-bold">Dimensions Totales & Oculi</th>
                <th className="py-3 px-3 text-center w-12 font-bold">Qté</th>
                <th className="py-3 px-3 w-40 font-bold">Finition & Teinte</th>
                <th className="py-3 px-3 text-center w-20 font-bold">Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Aucune porte dans cet ordre de fabrication.
                  </td>
                </tr>
              ) : (
                doors.map((door, idx) => {
                  const isDouble = door.doorStructure === 'double';
                  const hasRev = Boolean(door.hasRevetment);
                  const revH = Number(door.revetmentHeightCm) || 0;
                  const activeColor = COLOR_CATALOG.find(c => c.id === door.colorId) || COLOR_CATALOG[2];
                  const activePat = PATTERN_CATALOG.find(p => p.id === (door.patternId || 'none')) || PATTERN_CATALOG[0];

                  const atelierDims = (hasRev && revH > 0)
                    ? `${door.heightCm} + ${revH} = ${door.heightCm + revH} × ${door.widthCm} cm`
                    : `${door.heightCm} × ${door.widthCm} cm`;

                  return (
                    <tr key={door.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{door.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs">{door.designation}</div>
                        {activePat.id !== 'none' && (
                          <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                            📐 Usinage CNC / Insert : {activePat.name} {isDouble ? '(Vantail Principal D)' : ''}
                          </div>
                        )}
                        {hasRev && revH > 0 && (
                          <div className="text-[10.5px] text-nasaq-gold-dark font-bold">
                            + Panneau Revêtement WPC (H: {revH} cm)
                          </div>
                        )}
                        {door.glassPanes && door.glassPanes.length > 0 && (
                          <div className="text-[10.5px] text-sky-700 font-medium mt-1">
                            🪟 Découpes Vitres ({door.glassPanes.length}) :{' '}
                            {door.glassPanes.map((g, gIdx) => (
                              <span key={gIdx} className="inline-block mr-2 font-mono">
                                [V{gIdx + 1}: {g.widthCm}×{g.heightCm}cm, H:{g.marginTopCm}cm, B:{g.marginLeftCm || 12}cm]
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {atelierDims}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">1</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span 
                            className="w-3 h-3 rounded-xs border border-black/20" 
                            style={{ backgroundColor: activeColor.hex }}
                          />
                          <span>{activeColor.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold mt-1">
                          🔩 {door.hardwareColor === 'chrome' ? 'Chrome' : 'Noir Mat'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="w-5 h-5 mx-auto border-2 border-slate-300 rounded bg-white"></div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-6 mt-8 border-t border-slate-200">
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-slate-800">Chef d'Atelier / Menuisier</div>
            <div className="text-[11px] text-slate-400 mb-12">Contrôle des cotes, gravure CNC et débit matière</div>
            <div className="border-b-2 border-slate-600 w-full mb-1"></div>
            <div className="text-[10px] text-slate-400 italic">Nom & Visa Fabricant</div>
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-slate-800">Responsable Contrôle Qualité</div>
            <div className="text-[11px] text-slate-400 mb-12">Vérification avant emballage & départ chantier</div>
            <div className="border-b-2 border-slate-600 w-full mb-1"></div>
            <div className="text-[10px] text-slate-400 italic">Visa Contrôle NASAQ</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 py-3 bg-slate-100 rounded-lg text-slate-600 font-medium text-xs">
          ⚙️ Document interne de production NASAQ — Aucune valeur financière ⚙️
        </div>
      </div>
    </div>
  );
};
