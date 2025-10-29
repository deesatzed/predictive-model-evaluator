import React, { useMemo } from 'react';
import type { SimulationParams, DerivedMetrics } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ImpactSummaryProps {
  params: SimulationParams;
  derived: DerivedMetrics;
}

export const ImpactSummary: React.FC<ImpactSummaryProps> = ({ params, derived }) => {
  const { totalPatients, positiveCases, truePositives, falsePositives } = params;
  const { falseNegatives, trueNegatives, precision, recall, specificity } = derived;

  const perThousand = 1000;

  const scaled = useMemo(() => {
    const safeTotal = Math.max(totalPatients, 1);
    const tpRate = truePositives / safeTotal;
    const fpRate = falsePositives / safeTotal;
    const fnRate = (positiveCases - truePositives) / safeTotal;
    const tnRate = (trueNegatives) / safeTotal;

    return {
      tp: Math.round(tpRate * perThousand),
      fp: Math.round(fpRate * perThousand),
      fn: Math.round(fnRate * perThousand),
      tn: Math.round(tnRate * perThousand),
    };
  }, [totalPatients, positiveCases, truePositives, falsePositives, trueNegatives]);

  const prevalence = totalPatients > 0 ? (positiveCases / totalPatients) : 0;

  const summaryText = useMemo(() => {
    const lines = [
      `For every ${perThousand} patients scanned:`,
      `- correctly identify about ${scaled.tp} true cases`,
      `- incorrectly flag about ${scaled.fp} healthy patients (false alarms)`,
      `- miss about ${scaled.fn} true cases`,
      `Prevalence: ${(prevalence * 100).toFixed(2)}%`,
      `Operating point: Precision ${(precision * 100).toFixed(1)}%, Recall ${(recall * 100).toFixed(1)}%, Specificity ${(specificity * 100).toFixed(1)}%`
    ];
    return lines.join('\n');
  }, [perThousand, scaled.tp, scaled.fp, scaled.fn, prevalence, precision, recall, specificity]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {}
  };

  return (
    <Card>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-slate-800 dark:text-slate-100">Clinical Use Statements</h5>
          <Button variant="outline" onClick={handleCopy} className="text-xs px-2 py-1">Copy</Button>
        </div>
        <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div>
            For every {perThousand} patients: <strong>{scaled.tp}</strong> TP, <strong>{scaled.fp}</strong> FP, <strong>{scaled.fn}</strong> FN.
          </div>
          <div>
            Prevalence: <strong>{(prevalence * 100).toFixed(2)}%</strong>.
          </div>
          <div>
            Operating point: PPV <strong>{(precision * 100).toFixed(1)}%</strong>, Recall <strong>{(recall * 100).toFixed(1)}%</strong>, Specificity <strong>{(specificity * 100).toFixed(1)}%</strong>.
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Baseline: predicting "no disease" misses all {positiveCases} true cases but creates 0 false alarms.
          </div>
        </div>
      </div>
    </Card>
  );
};
