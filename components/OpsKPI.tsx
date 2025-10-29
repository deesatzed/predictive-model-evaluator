import React, { useMemo } from 'react';
import type { SimulationParams, DerivedMetrics } from '../types';
import { Card } from './ui/Card';

interface Props {
  params: SimulationParams;
  derived: DerivedMetrics;
}

export const OpsKPI: React.FC<Props> = ({ params, derived }) => {
  const { totalPatients, cohortSize, dailyCapacity, slaDays } = params;
  const { precision } = derived;
  const flaggedRate = totalPatients > 0 ? ((params.truePositives + params.falsePositives) / totalPatients) : 0;
  const N = cohortSize && cohortSize > 0 ? cohortSize : totalPatients;
  const flaggedCohort = Math.round(flaggedRate * (N || 0));
  const Cday = dailyCapacity || 0;
  const L = slaDays || 0;
  const daysToClear = Cday > 0 ? Math.ceil(flaggedCohort / Cday) : 0;
  const backlogAtSLA = Math.max(0, flaggedCohort - Cday * L);
  const tpPerDay = Math.round(Math.min(Cday, flaggedCohort) * (precision || 0));
  const fpPerDay = Math.round(Math.min(Cday, flaggedCohort) * (1 - (precision || 0)));
  const fpPctOfCap = Cday > 0 ? Math.round((fpPerDay / Cday) * 100) : 0;
  const withinSLA = L > 0 && daysToClear > 0 ? (daysToClear <= L) : false;

  return (
    <Card>
      <div className="p-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-2">
            <div className="text-[10px] text-slate-500">TP / day</div>
            <div className="text-base font-semibold">{tpPerDay}</div>
          </div>
          <div className={`rounded p-2 ${fpPctOfCap >= 60 ? 'bg-red-50 dark:bg-red-900/20' : fpPctOfCap >= 30 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
            <div className="text-[10px] text-slate-500">FP / day</div>
            <div className="text-base font-semibold">{fpPerDay} <span className="text-xs text-slate-500">({fpPctOfCap}% cap)</span></div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-2">
            <div className="text-[10px] text-slate-500">Days to clear</div>
            <div className="text-base font-semibold">{daysToClear}</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-2">
            <div className="text-[10px] text-slate-500">Backlog @ SLA</div>
            <div className="text-base font-semibold">{backlogAtSLA}</div>
          </div>
          <div className={`rounded p-2 ${withinSLA ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <div className="text-[10px] text-slate-600">SLA status</div>
            <div className="text-base font-semibold">{withinSLA ? 'Within SLA' : 'Risk'}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
