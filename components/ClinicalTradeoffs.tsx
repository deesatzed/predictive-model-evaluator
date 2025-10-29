import React, { useMemo } from 'react';
import { Card } from './ui/Card';

interface Props {
  totalPatients: number;
  positiveCases: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

export const ClinicalTradeoffs: React.FC<Props> = ({ 
  totalPatients, 
  positiveCases, 
  truePositives, 
  falsePositives,
  falseNegatives 
}) => {
  const analysis = useMemo(() => {
    const scale = 1000 / totalPatients;
    const per1k = {
      tp: Math.round(truePositives * scale),
      fp: Math.round(falsePositives * scale),
      fn: Math.round(falseNegatives * scale),
      pos: Math.round(positiveCases * scale),
    };

    const baselineFn = Math.round(positiveCases * scale);
    const benefitGained = per1k.tp;
    const residualRisk = per1k.fn;
    const costPaid = per1k.fp;

    const netBenefit = benefitGained - (costPaid * 0.1);

    return { per1k, baselineFn, benefitGained, residualRisk, costPaid, netBenefit };
  }, [totalPatients, positiveCases, truePositives, falsePositives, falseNegatives]);

  return (
    <Card>
      <div className="p-5">
        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">
          Clinical Trade-offs Analysis
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Per 1000 patients, comparing do‑nothing baseline vs this AI model.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Risk Without Model */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-l-4 border-slate-400">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-700 dark:text-slate-200">Baseline Risk (No AI)</h5>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {analysis.baselineFn}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Cases missed per 1000 with no AI.</p>
          </div>

          {/* Benefit from Model */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-green-800 dark:text-green-200">Benefit: Cases Found</h5>
              <span className="text-2xl font-bold text-green-900 dark:text-green-50">
                +{analysis.benefitGained}
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">Additional true cases detected per 1000.</p>
            <div className="mt-1 text-[11px] text-green-600 dark:text-green-400">✓ Early intervention • Better outcomes • Prevented harm</div>
          </div>

          {/* Residual Risk */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-orange-800 dark:text-orange-200">Residual Risk: Still Missed</h5>
              <span className="text-2xl font-bold text-orange-900 dark:text-orange-50">
                {analysis.residualRisk}
              </span>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">Cases still missed per 1000.</p>
            <div className="mt-1 text-[11px] text-orange-600 dark:text-orange-400">⚠ Delayed diagnosis • Worse prognosis • Liability</div>
          </div>

          {/* Cost of False Positives */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-red-800 dark:text-red-200">Cost: False Alarms</h5>
              <span className="text-2xl font-bold text-red-900 dark:text-red-50">
                {analysis.costPaid}
              </span>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">Healthy patients incorrectly flagged per 1000.</p>
            <div className="mt-1 text-[11px] text-red-600 dark:text-red-400">× Extra tests • Anxiety/exposure • Capacity strain • Cost</div>
          </div>
        </div>

        {/* Net Assessment */}
        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-2 border-sky-500 mt-4">
          <h5 className="font-bold text-sky-900 dark:text-sky-100 mb-2">Net Assessment</h5>
          <div className="text-xs text-sky-800 dark:text-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span>True cases found:</span>
              <span className="font-bold text-green-600 dark:text-green-400">+{analysis.benefitGained}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>False alarms generated:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{analysis.costPaid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Still missed:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{analysis.residualRisk}</span>
            </div>
            <div className="pt-2 border-top border-sky-300 dark:border-sky-700">
              <p className="font-bold">
                Trade-off: For every true case found, you generate{' '}
                <span className="text-red-600 dark:text-red-400">
                  {analysis.benefitGained > 0 ? (analysis.costPaid / analysis.benefitGained).toFixed(1) : '∞'}
                </span>{' '}
                false alarms.
              </p>
            </div>
          </div>
        </div>

        {/* Decision Framework */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-400 dark:border-amber-600 rounded mt-4">
          <h5 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-2">Decision Framework</h5>
          <p className="text-[11px] text-amber-800 dark:text-amber-200">
            Worth deploying? Consider: capacity for {analysis.costPaid} extra scans/1000, value of +{analysis.benefitGained} cases, tolerance for {analysis.residualRisk} still missed, and improvement vs current care.
          </p>
        </div>
      </div>
    </Card>
  );
};
