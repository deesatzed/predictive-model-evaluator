import React, { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  totalPatients: number;
  truePositives: number;
  falsePositives: number;
  cohortSize?: number;
  dailyCapacity?: number;
  workdaysPerWeek?: number;
  slaDays?: number;
  horizonDays?: number;
  onChange?: (v: { cohortSize: number; dailyCapacity: number; workdaysPerWeek: number; slaDays: number; horizonDays?: number }) => void;
  onFit?: () => void;
}

export const CapacityPlanner: React.FC<Props> = ({ totalPatients, truePositives, falsePositives, cohortSize: propCohort, dailyCapacity: propDaily, workdaysPerWeek: propWd, slaDays: propSla, horizonDays: propHzn, onChange, onFit }) => {
  const [cohortSize, setCohortSize] = useState<number>(propCohort ?? ((totalPatients && totalPatients > 0) ? totalPatients : 1000));
  const [dailyCapacity, setDailyCapacity] = useState<number>(propDaily ?? 40);
  const [workdaysPerWeek, setWorkdaysPerWeek] = useState<number>(propWd ?? 5);
  const [slaDays, setSlaDays] = useState<number>(propSla ?? 10);
  const [horizonDays, setHorizonDays] = useState<number>(propHzn ?? 365);

  const emit = (next: { cohortSize?: number; dailyCapacity?: number; workdaysPerWeek?: number; slaDays?: number; horizonDays?: number }) => {
    const payload = {
      cohortSize: next.cohortSize ?? cohortSize,
      dailyCapacity: next.dailyCapacity ?? dailyCapacity,
      workdaysPerWeek: next.workdaysPerWeek ?? workdaysPerWeek,
      slaDays: next.slaDays ?? slaDays,
      horizonDays: next.horizonDays ?? horizonDays,
    };
    onChange?.(payload);
  };

  const stats = useMemo(() => {
    const flagged = truePositives + falsePositives;
    const flaggedRate = totalPatients > 0 ? flagged / totalPatients : 0;
    const tpRate = totalPatients > 0 ? truePositives / totalPatients : 0;
    const fpRate = totalPatients > 0 ? falsePositives / totalPatients : 0;

    const flaggedCohort = Math.round(flaggedRate * cohortSize);
    const tpCohort = Math.round(tpRate * cohortSize);
    const fpCohort = Math.round(fpRate * cohortSize);

    const daysToClear = dailyCapacity > 0 ? Math.ceil(flaggedCohort / dailyCapacity) : Infinity;
    const backlogAtSLA = Math.max(0, flaggedCohort - dailyCapacity * slaDays);

    const ppv = flaggedCohort > 0 ? tpCohort / flaggedCohort : 0;
    const tpPerDay = Math.min(dailyCapacity, flaggedCohort) * ppv;
    const fpPerDay = Math.min(dailyCapacity, flaggedCohort) * (1 - ppv);

    const weeklyThroughput = dailyCapacity * workdaysPerWeek;

    const effDays = Math.max(1, Math.ceil((horizonDays || 365) * (workdaysPerWeek || 5) / 7));
    const flaggedPerDay = effDays > 0 ? (flagged / effDays) : 0;
    const capPerDay = dailyCapacity;
    const deltaPerDay = capPerDay - flaggedPerDay;

    return {
      flaggedCohort,
      tpCohort,
      fpCohort,
      daysToClear,
      backlogAtSLA,
      tpPerDay: Math.round(tpPerDay),
      fpPerDay: Math.round(fpPerDay),
      weeklyThroughput,
      ppv,
      flaggedPerDay,
      capPerDay,
      deltaPerDay,
      effDays
    };
  }, [totalPatients, truePositives, falsePositives, cohortSize, dailyCapacity, workdaysPerWeek, slaDays, horizonDays]);

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Capacity Planner</h4>
          <div className="flex items-center gap-2">
            <div className={`text-[10px] px-2 py-0.5 rounded ${isFinite(stats.daysToClear) && stats.daysToClear <= slaDays ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
              {isFinite(stats.daysToClear) && stats.daysToClear <= slaDays ? 'Within SLA' : `Exceeds SLA by ${Math.max(0, stats.daysToClear - slaDays)} day${Math.max(0, stats.daysToClear - slaDays) === 1 ? '' : 's'}`}
            </div>
            <Button variant="outline" onClick={onFit} className="text-xs px-2 py-1">Fit to capacity</Button>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Flagged/day vs Capacity/day over {stats.effDays} workdays.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500">Flagged per day</div>
            <div className="text-xl font-bold">{Math.round(stats.flaggedPerDay).toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500">Capacity per day</div>
            <div className="text-xl font-bold">{Math.round(stats.capPerDay).toLocaleString()}</div>
          </div>
          <div className={`p-3 rounded-lg border ${stats.deltaPerDay >= -0.5 ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'}`}>
            <div className="text-[11px]">Status</div>
            <div className="text-xl font-bold">{stats.deltaPerDay >= -0.5 ? 'On/Under target' : 'Over target'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Cohort Size</div>
            <input type="number" value={cohortSize} onChange={e=>{ const v=Math.max(0, Number(e.target.value)); setCohortSize(v); emit({ cohortSize: v }); }} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Daily Capacity</div>
            <input type="number" value={dailyCapacity} onChange={e=>{ const v=Math.max(0, Number(e.target.value)); setDailyCapacity(v); emit({ dailyCapacity: v }); }} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Workdays/Week</div>
            <input type="number" value={workdaysPerWeek} onChange={e=>{ const v=Math.max(1, Number(e.target.value)); setWorkdaysPerWeek(v); emit({ workdaysPerWeek: v }); }} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">SLA (days)</div>
            <input type="number" value={slaDays} onChange={e=>{ const v=Math.max(0, Number(e.target.value)); setSlaDays(v); emit({ slaDays: v }); }} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Horizon (days)</div>
            <input type="number" value={horizonDays} onChange={e=>{ const v=Math.max(1, Number(e.target.value)); setHorizonDays(v); emit({ horizonDays: v }); }} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Flagged (Cohort)</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.flaggedCohort.toLocaleString()}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">TP {stats.tpCohort.toLocaleString()} • FP {stats.fpCohort.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Throughput</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.weeklyThroughput.toLocaleString()}/week</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{dailyCapacity}/day, {workdaysPerWeek} days/week</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Clearance & SLA</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{isFinite(stats.daysToClear) ? `${stats.daysToClear} days` : '—'}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Backlog at SLA: {stats.backlogAtSLA.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
            <div className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase">Expected Daily Outcomes</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-50">TP {stats.tpPerDay} / day</div>
            <div className="text-xs text-green-700 dark:text-green-300">PPV {(stats.ppv*100).toFixed(1)}%</div>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <div className="text-xs font-semibold text-red-800 dark:text-red-200 uppercase">Expected Daily Cost</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-50">FP {stats.fpPerDay} / day</div>
            <div className="text-xs text-red-700 dark:text-red-300">Use threshold/FP budget to reduce this</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
