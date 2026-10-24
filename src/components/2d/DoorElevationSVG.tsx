import React from 'react';
import { DoorConfigItem } from '../../types/configurator';
import { COLOR_CATALOG } from '../../data/colors';
import { PATTERN_CATALOG } from '../../data/patterns';

interface DoorElevationSVGProps {
  door: DoorConfigItem;
  scale?: number;
  showDimensions?: boolean;
}

export const DoorElevationSVG: React.FC<DoorElevationSVGProps> = ({
  door,
  scale = 0.60,
  showDimensions = true
}) => {
  const doorW = door.widthCm * scale;
  const doorH = door.heightCm * scale;
  const hasRev = Boolean(door.hasRevetment);
  const revHeightCm = Number(door.revetmentHeightCm) || 0;
  const revH = hasRev ? revHeightCm * scale : 0;
  const totalH = doorH + revH;

  const padLeft = showDimensions ? 46 : 8;
  const padRight = 16;
  const padTop = 16;
  const padBottom = showDimensions ? 32 : 8;

  const svgWidth = Math.ceil(doorW + padLeft + padRight);
  const svgHeight = Math.ceil(totalH + padTop + padBottom);

  const x0 = padLeft;
  const revY0 = padTop;
  const doorY0 = padTop + revH;

  const activeColor = COLOR_CATALOG.find(c => c.id === door.colorId) || COLOR_CATALOG[2];
  const doorFill = activeColor.hex;
  const isDark = activeColor.textColor === '#ffffff';
  const grainStroke = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const grainPatternId = `grain-${door.id}-${door.colorId}`;

  const isDouble = door.doorStructure === 'double';
  const leftRatio = (door.leftLeafPercent || 28) / 100;
  const leftLeafW = isDouble ? doorW * leftRatio : doorW;
  const rightLeafW = isDouble ? doorW * (1 - leftRatio) : 0;
  const splitX = x0 + leftLeafW;

  const isChromeHw = door.hardwareColor === 'chrome';
  const hgFill = isChromeHw ? '#e2e8f0' : '#1e293b';
  const hgStroke = isChromeHw ? '#64748b' : '#0f172a';
  const hndFill = isChromeHw ? '#f1f5f9' : '#0f172a';
  const hndStroke = isChromeHw ? '#475569' : '#000000';
  const hndAccent = isChromeHw ? '#94a3b8' : '#334155';

  // Decorative Pattern SVG Generator
  const renderPattern = (patStartX: number, patWidth: number) => {
    const patternId = door.patternId || 'none';
    if (patternId === 'none') return null;

    const patObj = PATTERN_CATALOG.find(p => p.id === patternId);
    const isGold = patObj && patObj.type === 'gold';
    const stroke = isGold ? '#d4af37' : '#1e293b';
    const strokeWidth = isGold ? 1.6 : 1.3;
    const opacity = isGold ? 0.95 : 0.7;

    switch (patternId) {
      case 'lines_4h':
        return (
          <g stroke={stroke} strokeWidth={strokeWidth} opacity={opacity}>
            <line x1={patStartX} y1={doorY0 + doorH * 0.20} x2={patStartX + patWidth} y2={doorY0 + doorH * 0.20} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.40} x2={patStartX + patWidth} y2={doorY0 + doorH * 0.40} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.60} x2={patStartX + patWidth} y2={doorY0 + doorH * 0.60} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.80} x2={patStartX + patWidth} y2={doorY0 + doorH * 0.80} />
          </g>
        );

      case 'geo_prism': {
        const j1X = patStartX + patWidth * 0.53;
        const j1Y = doorY0 + doorH * 0.23;
        const j2X = patStartX + patWidth * 0.33;
        const j2Y = doorY0 + doorH * 0.533;
        const j3X = patStartX + patWidth * 0.44;
        const j3Y = doorY0 + doorH * 0.817;
        return (
          <g stroke={stroke} strokeWidth={strokeWidth} opacity={opacity}>
            <line x1={patStartX + patWidth * 0.30} y1={doorY0} x2={j1X} y2={j1Y} />
            <line x1={patStartX + patWidth * 0.65} y1={doorY0} x2={j1X} y2={j1Y} />
            <line x1={j1X} y1={j1Y} x2={j2X} y2={j2Y} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.50} x2={patStartX + patWidth} y2={doorY0 + doorH * 0.60} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.69} x2={patStartX + patWidth * 0.70} y2={doorY0 + doorH * 0.57} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.73} x2={j3X} y2={j3Y} />
            <line x1={patStartX} y1={doorY0 + doorH * 0.87} x2={patStartX + patWidth} y2={doorY0 + doorH * 0.75} />
          </g>
        );
      }

      case 'l_corner': {
        const midH = doorY0 + doorH * 0.55;
        const vertX = patStartX + patWidth * 0.28;
        return (
          <g stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} fill="none">
            <line x1={vertX} y1={doorY0} x2={vertX} y2={midH - 12} />
            <polyline points={`${vertX},${midH - 12} ${patStartX + patWidth * 0.16},${midH} ${patStartX},${midH}`} />
            <line x1={vertX} y1={midH - 12} x2={patStartX + patWidth} y2={midH - 12} />
            <line x1={patStartX + patWidth * 0.16} y1={midH} x2={patStartX + patWidth * 0.16} y2={doorY0 + doorH} />
          </g>
        );
      }

      case 'frame_cadre': {
        const margin = 14;
        const handleTop = doorY0 + doorH * 0.47;
        const handleBtm = doorY0 + doorH * 0.60;
        return (
          <g stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} fill="none">
            <polyline
              points={`${patStartX + margin},${doorY0 + margin} ${patStartX + patWidth - margin},${doorY0 + margin} 
                ${patStartX + patWidth - margin},${handleTop} ${patStartX + patWidth - margin - 18},${handleTop} 
                ${patStartX + patWidth - margin - 18},${handleBtm} ${patStartX + patWidth - margin},${handleBtm} 
                ${patStartX + patWidth - margin},${doorY0 + doorH - margin} ${patStartX + margin},${doorY0 + doorH - margin} 
                ${patStartX + margin},${doorY0 + margin}`}
            />
          </g>
        );
      }

      case 'arrow_line': {
        const lineX = patStartX + patWidth * 0.83;
        const hCenter = doorY0 + doorH * 0.53;
        const peakOffset = Math.max(14, patWidth * 0.16);
        const chevronHalfH = Math.max(20, doorH * 0.075);
        return (
          <g stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} fill="none">
            <line x1={lineX} y1={doorY0} x2={lineX} y2={hCenter - chevronHalfH} />
            <polyline points={`${lineX},${hCenter - chevronHalfH} ${lineX - peakOffset},${hCenter} ${lineX},${hCenter + chevronHalfH}`} />
            <line x1={lineX} y1={hCenter + chevronHalfH} x2={lineX} y2={doorY0 + doorH} />
          </g>
        );
      }

      case 'shift_h2': {
        const yTop = doorY0 + doorH * 0.50;
        const yBottom = doorY0 + doorH * 0.60;
        return (
          <g stroke={stroke} strokeWidth={strokeWidth} opacity={opacity}>
            <line x1={patStartX} y1={yTop} x2={patStartX + patWidth} y2={yTop} />
            <line x1={patStartX + patWidth * 0.70} y1={doorY0} x2={patStartX + patWidth * 0.70} y2={yTop} />
            <line x1={patStartX} y1={yBottom} x2={patStartX + patWidth} y2={yBottom} />
            <line x1={patStartX + patWidth * 0.22} y1={yBottom} x2={patStartX + patWidth * 0.22} y2={doorY0 + doorH} />
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg 
      viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
      width={svgWidth} 
      height={svgHeight} 
      className="max-h-full max-w-full drop-shadow-sm select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={grainPatternId} width="16" height="40" patternUnits="userSpaceOnUse">
          <line x1="2" y1="0" x2="2" y2="40" stroke={grainStroke} strokeWidth="0.8" />
          <line x1="6" y1="0" x2="6" y2="40" stroke={grainStroke} strokeWidth="1.2" />
          <line x1="11" y1="0" x2="11" y2="40" stroke={grainStroke} strokeWidth="0.6" />
          <line x1="15" y1="0" x2="15" y2="40" stroke={grainStroke} strokeWidth="1.0" />
        </pattern>
      </defs>

      {/* Revêtement / Imposte Supérieur */}
      {hasRev && revH > 0 && (
        <g>
          <rect x={x0} y={revY0} width={doorW} height={revH} fill={doorFill} stroke="#1c4b46" strokeWidth="1.8" />
          <rect x={x0} y={revY0} width={doorW} height={revH} fill={`url(#${grainPatternId})`} />
          <line x1={x0} y1={doorY0} x2={x0 + doorW} y2={doorY0} stroke="#a3895c" strokeWidth="2.2" />
        </g>
      )}

      {/* Door Leaves */}
      {isDouble ? (
        <g>
          {/* Semi-fixed Left Leaf */}
          <rect x={x0} y={doorY0} width={leftLeafW} height={doorH} fill={doorFill} stroke="#1c4b46" strokeWidth="1.8" />
          <rect x={x0} y={doorY0} width={leftLeafW} height={doorH} fill={`url(#${grainPatternId})`} />
          
          {/* Primary Right Leaf */}
          <rect x={splitX} y={doorY0} width={rightLeafW} height={doorH} fill={doorFill} stroke="#1c4b46" strokeWidth="1.8" />
          <rect x={splitX} y={doorY0} width={rightLeafW} height={doorH} fill={`url(#${grainPatternId})`} />
          
          {/* Meeting Stile Split */}
          <line x1={splitX} y1={doorY0} x2={splitX} y2={doorY0 + doorH} stroke="#123330" strokeWidth="2" />

          {/* Hinges */}
          <rect x={x0 - 2} y={doorY0 + 15} width="3.5" height="9" rx="1" fill={hgFill} stroke={hgStroke} strokeWidth="0.8" />
          <rect x={x0 - 2} y={doorY0 + (doorH / 2) - 4.5} width="3.5" height="9" rx="1" fill={hgFill} stroke={hgStroke} strokeWidth="0.8" />
          <rect x={x0 - 2} y={doorY0 + doorH - 24} width="3.5" height="9" rx="1" fill={hgFill} stroke={hgStroke} strokeWidth="0.8" />
          <circle cx={x0 + (leftLeafW / 2)} cy={doorY0 + 7} r="2" fill={hndFill} />

          {/* Handle */}
          <g>
            <circle cx={splitX + 7} cy={doorY0 + (doorH * 0.53)} r="3.8" fill={hndFill} stroke={hndStroke} strokeWidth="0.8" />
            <circle cx={splitX + 7} cy={doorY0 + (doorH * 0.53)} r="1.5" fill={hndAccent} />
            <rect x={splitX + 7} y={doorY0 + (doorH * 0.53) - 1.2} width="8" height="2.4" rx="1.2" fill={hndFill} stroke={hndStroke} strokeWidth="0.6" />
          </g>
        </g>
      ) : (
        <g>
          <rect x={x0} y={doorY0} width={doorW} height={doorH} fill={doorFill} stroke="#1c4b46" strokeWidth="1.8" />
          <rect x={x0} y={doorY0} width={doorW} height={doorH} fill={`url(#${grainPatternId})`} />

          {/* Hinges */}
          <rect x={x0 - 2} y={doorY0 + 15} width="3.5" height="9" rx="1" fill={hgFill} stroke={hgStroke} strokeWidth="0.8" />
          <rect x={x0 - 2} y={doorY0 + (doorH / 2) - 4.5} width="3.5" height="9" rx="1" fill={hgFill} stroke={hgStroke} strokeWidth="0.8" />
          <rect x={x0 - 2} y={doorY0 + doorH - 24} width="3.5" height="9" rx="1" fill={hgFill} stroke={hgStroke} strokeWidth="0.8" />

          {/* Handle */}
          <g>
            <circle cx={x0 + doorW - 7} cy={doorY0 + (doorH * 0.53)} r="3.8" fill={hndFill} stroke={hndStroke} strokeWidth="0.8" />
            <circle cx={x0 + doorW - 7} cy={doorY0 + (doorH * 0.53)} r="1.5" fill={hndAccent} />
            <rect x={x0 + doorW - 15} y={doorY0 + (doorH * 0.53) - 1.2} width="8" height="2.4" rx="1.2" fill={hndFill} stroke={hndStroke} strokeWidth="0.6" />
          </g>
        </g>
      )}

      {/* Decorative Engraved Pattern */}
      {renderPattern(isDouble ? splitX : x0, isDouble ? rightLeafW : doorW)}

      {/* Individual Glass Pane Openings */}
      {door.glassPanes && door.glassPanes.map((pane, idx) => {
        const gw = Math.max(3, (Number(pane.widthCm) || 10) * scale);
        const gh = Math.max(5, (Number(pane.heightCm) || 140) * scale);
        const gy = doorY0 + (Number(pane.marginTopCm) || 30) * scale;

        let leafStartX = x0;
        let leafWidth = doorW;
        if (isDouble) {
          if (pane.leaf === 'left') {
            leafStartX = x0;
            leafWidth = leftLeafW;
          } else {
            leafStartX = splitX;
            leafWidth = rightLeafW;
          }
        }

        let gx = leafStartX;
        if (pane.marginLeftCm !== undefined && pane.marginLeftCm !== null && !isNaN(pane.marginLeftCm)) {
          gx = leafStartX + Number(pane.marginLeftCm) * scale;
        } else {
          gx = leafStartX + Math.max(3, (leafWidth - gw) / 2);
        }

        return (
          <g key={idx}>
            <rect x={gx} y={gy} width={gw} height={gh} rx="1.5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.2" />
            <line x1={gx + 2} y1={gy + 3} x2={gx + gw - 2} y2={gy + Math.min(14, gh - 2)} stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
            <line x1={gx + 2} y1={gy + 18} x2={gx + gw - 2} y2={gy + Math.min(28, gh - 2)} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          </g>
        );
      })}

      {/* Technical Door ID Plaque on Door (e.g. P1-0101) */}
      {door.id && (
        <g className="select-none pointer-events-none">
          <rect 
            x={(isDouble ? splitX + rightLeafW / 2 : x0 + doorW / 2) - Math.max(24, (door.id.length * 3.6) + 4)} 
            y={doorY0 + 9} 
            width={Math.max(48, (door.id.length * 7.2) + 8)} 
            height="14" 
            rx="3" 
            fill="#1c4b46" 
            stroke="#ffffff"
            strokeWidth="0.9"
          />
          <text 
            x={isDouble ? splitX + rightLeafW / 2 : x0 + doorW / 2} 
            y={doorY0 + 19.5} 
            fontSize="8" 
            fill="#ffffff" 
            fontFamily="'JetBrains Mono', monospace" 
            fontWeight="700" 
            textAnchor="middle"
          >
            {door.id}
          </text>
        </g>
      )}

      {/* Dimension Lines (Height) */}
      {showDimensions && (
        <g>
          {hasRev && revH > 0 ? (
            <>
              {/* Cladding Height Dim */}
              <line x1="23" y1={revY0} x2={x0} y2={revY0} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="23" y1={doorY0} x2={x0} y2={doorY0} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="26" y1={revY0} x2="26" y2={doorY0} stroke="#a3895c" strokeWidth="1" />
              <path d={`M 26 ${revY0} L 24 ${revY0 + 4} L 28 ${revY0 + 4} Z`} fill="#a3895c" />
              <path d={`M 26 ${doorY0} L 24 ${doorY0 - 4} L 28 ${doorY0 - 4} Z`} fill="#a3895c" />
              <text 
                x="22" 
                y={(revY0 + doorY0) / 2} 
                fontSize="8.5" 
                fill="#826c44" 
                fontFamily="'JetBrains Mono', monospace" 
                fontWeight="700" 
                textAnchor="middle" 
                transform={`rotate(-90, 22, ${(revY0 + doorY0) / 2})`}
              >
                {revHeightCm}
              </text>

              {/* Door Leaf Height Dim */}
              <line x1="23" y1={doorY0 + doorH} x2={x0} y2={doorY0 + doorH} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="26" y1={doorY0} x2="26" y2={doorY0 + doorH} stroke="#1c4b46" strokeWidth="1" />
              <path d={`M 26 ${doorY0} L 24 ${doorY0 + 4} L 28 ${doorY0 + 4} Z`} fill="#1c4b46" />
              <path d={`M 26 ${doorY0 + doorH} L 24 ${doorY0 + doorH - 4} L 28 ${doorY0 + doorH - 4} Z`} fill="#1c4b46" />
              <text 
                x="22" 
                y={(doorY0 + doorY0 + doorH) / 2} 
                fontSize="8.5" 
                fill="#1c4b46" 
                fontFamily="'JetBrains Mono', monospace" 
                fontWeight="700" 
                textAnchor="middle" 
                transform={`rotate(-90, 22, ${(doorY0 + doorY0 + doorH) / 2})`}
              >
                {door.heightCm}
              </text>

              {/* Total Height Dim Outer */}
              <line x1="8" y1={revY0} x2="26" y2={revY0} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="8" y1={doorY0 + doorH} x2="26" y2={doorY0 + doorH} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="11" y1={revY0} x2="11" y2={doorY0 + doorH} stroke="#123330" strokeWidth="1.2" />
              <path d={`M 11 ${revY0} L 8.5 ${revY0 + 5} L 13.5 ${revY0 + 5} Z`} fill="#123330" />
              <path d={`M 11 ${doorY0 + doorH} L 8.5 ${doorY0 + doorH - 5} L 13.5 ${doorY0 + doorH - 5} Z`} fill="#123330" />
              <text 
                x="6.5" 
                y={(revY0 + doorY0 + doorH) / 2} 
                fontSize="9" 
                fill="#123330" 
                fontFamily="'JetBrains Mono', monospace" 
                fontWeight="800" 
                textAnchor="middle" 
                transform={`rotate(-90, 6.5, ${(revY0 + doorY0 + doorH) / 2})`}
              >
                {door.heightCm + revHeightCm} cm
              </text>
            </>
          ) : (
            <>
              {/* Single Height Dim */}
              <line x1="11" y1={doorY0} x2={x0} y2={doorY0} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="11" y1={doorY0 + doorH} x2={x0} y2={doorY0 + doorH} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="14" y1={doorY0} x2="14" y2={doorY0 + doorH} stroke="#1c4b46" strokeWidth="1" />
              <path d={`M 14 ${doorY0} L 11.5 ${doorY0 + 5} L 16.5 ${doorY0 + 5} Z`} fill="#1c4b46" />
              <path d={`M 14 ${doorY0 + doorH} L 11.5 ${doorY0 + doorH - 5} L 16.5 ${doorY0 + doorH - 5} Z`} fill="#1c4b46" />
              <text 
                x="9" 
                y={(doorY0 + doorY0 + doorH) / 2} 
                fontSize="9" 
                fill="#1c4b46" 
                fontFamily="'JetBrains Mono', monospace" 
                fontWeight="700" 
                textAnchor="middle" 
                transform={`rotate(-90, 9, ${(doorY0 + doorY0 + doorH) / 2})`}
              >
                {door.heightCm} cm
              </text>
            </>
          )}

          {/* Width Dimension Line Bottom */}
          <line x1={x0} y1={doorY0 + doorH} x2={x0} y2={doorY0 + doorH + 21} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
          <line x1={x0 + doorW} y1={doorY0 + doorH} x2={x0 + doorW} y2={doorY0 + doorH + 21} stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="1,1" />
          <line x1={x0} y1={doorY0 + doorH + 18} x2={x0 + doorW} y2={doorY0 + doorH + 18} stroke="#1c4b46" strokeWidth="1" />
          <path d={`M ${x0} ${doorY0 + doorH + 18} L ${x0 + 5} ${doorY0 + doorH + 15.5} L ${x0 + 5} ${doorY0 + doorH + 20.5} Z`} fill="#1c4b46" />
          <path d={`M ${x0 + doorW} ${doorY0 + doorH + 18} L ${x0 + doorW - 5} ${doorY0 + doorH + 15.5} L ${x0 + doorW - 5} ${doorY0 + doorH + 20.5} Z`} fill="#1c4b46" />
          <text 
            x={x0 + doorW / 2} 
            y={doorY0 + doorH + 29} 
            fontSize="9" 
            fill="#1c4b46" 
            fontFamily="'JetBrains Mono', monospace" 
            fontWeight="700" 
            textAnchor="middle"
          >
            {door.widthCm} cm
          </text>
        </g>
      )}
    </svg>
  );
};
