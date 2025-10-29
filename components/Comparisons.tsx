import React, { useMemo } from 'react';
import type { SimulationParams, DerivedMetrics } from '../types';
import { Card } from './ui/Card';

interface Props {
  params: SimulationParams;
  derived: DerivedMetrics;
}

const Row: React.FC<{ title: string; tp: number; fp: number; fn: number; tn: number; total: number; }>
 = ({ title, tp, fp, fn, tn, total }) => {
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;

  const perThousand = 1000;
  const safeTotal = Math.max(total, 1);
  const scale = perThousand / safeTotal;

  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
      <div className="font-semibold text-slate-800 dark:text-slate-100">{title}</div>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
        <div>Per 1000: TP <strong>{Math.round(tp * scale)}</strong>, FP <strong>{Math.round(fp * scale)}</strong>, FN <strong>{Math.round(fn * scale)}</strong></div>
        <div>Precision <strong>{(precision * 100).toFixed(1)}%</strong> • Recall <strong>{(recall * 100).toFixed(1)}%</strong> • Specificity <strong>{(specificity * 100).toFixed(1)}%</strong></div>
      </div>
    </div>
  );
};

export const Comparisons: React.FC<Props> = ({ params, derived }) => {
  const { totalPatients, positiveCases, truePositives, falsePositives } = params;
  const { falseNegatives, trueNegatives } = derived;
  const negativeCases = totalPatients - positiveCases;

  const naive = useMemo(() => ({
    tp: 0,
    fp: 0,
    fn: positiveCases,
    tn: negativeCases,
  }), [positiveCases, negativeCases]);

  const current = { tp: truePositives, fp: falsePositives, fn: falseNegatives, tn: trueNegatives };

  const perfect = useMemo(() => ({
    tp: positiveCases,
    fp: 0,
    fn: 0,
    tn: negativeCases,
  }), [positiveCases, negativeCases]);

  return (
    <Card>
      <div className="p-4">
        <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Compare Scenarios</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Row title="Baseline (All Negative)" {...naive} total={totalPatients} />
          <Row title="Simulated AI (This Scenario)" {...current} total={totalPatients} />
          <Row title="Perfect (Oracle)" {...perfect} total={totalPatients} />
        </div>
      </div>
    </Card>
  );
};
