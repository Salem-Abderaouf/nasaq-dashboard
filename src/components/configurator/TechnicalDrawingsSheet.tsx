import React from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { DoorElevationSVG } from '../2d/DoorElevationSVG';
import { COLOR_CATALOG } from '../../data/colors';
import { PATTERN_CATALOG } from '../../data/patterns';
import { downloadElementAsPNG } from '../../utils/exportUtils';
import { Download, Printer } from 'lucide-react';

interface TechnicalDrawingsSheetProps {
  doors: DoorConfigItem[];
  info: StudioGeneralInfo;
}

export const TechnicalDrawingsSheet: React.FC<TechnicalDrawingsSheetProps> = ({
  doors,
  info
}) => {
  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs no-print">
        <div className="text-xs font-semibold text-nasaq-teal">
          📦 Plans de fabrication WPC à l'échelle avec finitions, gravures CNC et cotes d'usinage réelles.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadElementAsPNG('drawings-export-sheet', `NASAQ - Dessins 2D - ${info.clientName || 'Client'}`)}
            className="flex items-center gap-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger Image 2D (PNG)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-nasaq-teal-subtle text-nasaq-teal border border-nasaq-teal px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div 
        id="drawings-export-sheet"
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm print-card"
      >
        {/* Header */}
        <div className="border-b-2 border-nasaq-teal-subtle pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-cinzel text-lg md:text-xl font-bold text-nasaq-teal-dark tracking-wide">
              NASAQ WPC — PLANCHE TECHNIQUE D'EXÉCUTION
            </h1>
            <div className="text-xs font-semibold text-nasaq-teal mt-1">
              Dossier : {info.clientName || 'Nouveau Client'} | Réf : {info.docRef}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src="/nasaq-logo-cropped.png" alt="NASAQ WPC" className="h-11 w-auto object-contain" />
            <div className="text-right">
              <div className="text-[11px] font-mono text-slate-500">
                Date : {info.docDate} • {doors.length} Porte{doors.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Doors Grid */}
        {doors.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <p className="text-sm font-semibold">Aucune porte configurée.</p>
            <p className="text-xs mt-1">Ajoutez une porte depuis le panneau latéral pour afficher les plans 2D.</p>
          </div>
        ) : (
          <div 
            className="doors-grid flex flex-wrap justify-center items-end"
            style={{ gap: `${info.gridGap}px` }}
          >
            {doors.map(door => {
              const isDouble = door.doorStructure === 'double';
              const hasRev = Boolean(door.hasRevetment);
              const revH = Number(door.revetmentHeightCm) || 0;
              const activeColor = COLOR_CATALOG.find(c => c.id === door.colorId) || COLOR_CATALOG[2];
              const activePat = PATTERN_CATALOG.find(p => p.id === (door.patternId || 'none')) || PATTERN_CATALOG[0];
              const totalHeight = hasRev ? (door.heightCm + revH) : door.heightCm;

              let specText = 'Finition pleine';
              if (door.patternId && door.patternId !== 'none') {
                specText = `Motif : ${activePat.name}`;
              }
              if (door.glassPanes && door.glassPanes.length > 0) {
                specText += ` • ${door.glassPanes.length} vitrage(s)`;
              }
              if (isDouble) {
                specText += ' • 2 vantaux';
              }
              if (hasRev && revH > 0) {
                specText += ` • Imposte +${revH} cm`;
              }
              specText += ` • Quincaillerie : ${door.hardwareColor === 'chrome' ? 'Chrome' : 'Noir Mat'}`;

              return (
                <div 
                  key={door.id}
                  className={`door-card bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center shadow-xs transition hover:shadow-md hover:border-nasaq-gold-light ${
                    isDouble ? 'w-[300px]' : 'w-[250px]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-dashed border-slate-200">
                    <span className="font-cinzel font-bold text-xs bg-nasaq-teal text-white px-2.5 py-0.5 rounded tracking-wider">
                      {door.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-nasaq-teal-dark">
                      {totalHeight} × {door.widthCm} cm
                    </span>
                  </div>

                  {/* SVG Container */}
                  <div className="w-full min-h-[220px] flex items-center justify-center bg-slate-50/70 border border-slate-100 rounded-lg p-2">
                    <DoorElevationSVG door={door} scale={info.scale} />
                  </div>

                  {/* Color & Pattern badge */}
                  <div className="w-full mt-3 p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded text-[11px] font-bold text-slate-700 flex items-center justify-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-xs border border-black/20" 
                      style={{ backgroundColor: activeColor.hex }}
                    />
                    <span>{activeColor.name} {activePat.id !== 'none' ? `• ${activePat.name}` : ''}</span>
                  </div>

                  {/* Detail Tag */}
                  <div className="w-full mt-1.5 p-1 bg-nasaq-gold-subtle border border-nasaq-gold/25 rounded text-[10.5px] text-nasaq-gold-dark text-center leading-tight">
                    {specText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
