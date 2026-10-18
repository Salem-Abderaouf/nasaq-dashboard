import React from 'react';
import { OrderStatus } from '../../types/database';
import { getOrderStatusMeta } from '../../utils/formatters';

interface PipelineDistributionProps {
  statusCounts: Record<OrderStatus, number>;
  onSelectStatus?: (status: OrderStatus) => void;
}

const STAGES: OrderStatus[] = [
  'draft',
  'confirmed',
  'manufacturing',
  'ready_for_dispatch',
  'in_transit',
  'delivered',
  'installation',
  'completed',
  'cancelled'
];

export const PipelineDistribution: React.FC<PipelineDistributionProps> = ({
  statusCounts,
  onSelectStatus
}) => {
  const totalOrders = Object.values(statusCounts).reduce((acc, c) => acc + c, 0) || 1;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Pipeline des Commandes (9 Étapes)</h2>
          <p className="text-xs text-slate-500">Cycle de vie de la commande : de la conception au montage final</p>
        </div>
        <div className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          Total : {Object.values(statusCounts).reduce((acc, c) => acc + c, 0)} commandes
        </div>
      </div>

      {/* Progress Multi-Bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        {STAGES.map(stage => {
          const count = statusCounts[stage] || 0;
          if (count === 0) return null;
          const percent = (count / totalOrders) * 100;
          const meta = getOrderStatusMeta(stage);

          let barColor = 'bg-slate-400';
          if (stage === 'confirmed') barColor = 'bg-blue-500';
          if (stage === 'manufacturing') barColor = 'bg-amber-500';
          if (stage === 'ready_for_dispatch') barColor = 'bg-teal-500';
          if (stage === 'in_transit') barColor = 'bg-indigo-500';
          if (stage === 'delivered') barColor = 'bg-purple-500';
          if (stage === 'installation') barColor = 'bg-cyan-500';
          if (stage === 'completed') barColor = 'bg-emerald-500';
          if (stage === 'cancelled') barColor = 'bg-rose-500';

          return (
            <div 
              key={stage}
              style={{ width: `${percent}%` }}
              className={`${barColor} h-full transition-all hover:opacity-85 cursor-pointer`}
              title={`${meta.label}: ${count} (${percent.toFixed(1)}%)`}
              onClick={() => onSelectStatus && onSelectStatus(stage)}
            />
          );
        })}
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2.5 pt-1">
        {STAGES.map(stage => {
          const count = statusCounts[stage] || 0;
          const meta = getOrderStatusMeta(stage);

          return (
            <div
              key={stage}
              onClick={() => onSelectStatus && onSelectStatus(stage)}
              className={`p-3 rounded-xl border border-slate-200/80 hover:border-nasaq-teal transition cursor-pointer flex flex-col justify-between min-w-0 ${
                count > 0 ? 'bg-slate-50/70 hover:bg-white shadow-2xs' : 'bg-white opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`}></span>
                <span className="text-[10.5px] font-bold text-slate-700 truncate leading-tight" title={meta.label}>
                  {meta.label}
                </span>
              </div>
              <div className="font-mono text-lg font-extrabold text-slate-900 text-right">
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
