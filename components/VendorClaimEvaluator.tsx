import React, { useMemo } from 'react';
import { Card } from './ui/Card';

interface Props {
  sensitivity: number;
  specificity: number;
  prevalence: number;
  totalPatients: number;
}

export const VendorClaimEvaluator: React.FC<Props> = ({ sensitivity, specificity, prevalence, totalPatients }) => {
  const reality = useMemo(() => {
    const posCases = Math.round(totalPatients * prevalence);
    const negCases = totalPatients - posCases;
    const tp = Math.round(posCases * sensitivity);
    const fn = posCases - tp;
    const tn = Math.round(negCases * specificity);
    const fp = negCases - tn;
    const ppv = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    
    const scale = 1000 / totalPatients;
    const per1k = {
      tp: Math.round(tp * scale),
      fp: Math.round(fp * scale),
      fn: Math.round(fn * scale),
      pos: Math.round(posCases * scale),
    };
    
    const fpPerTp = tp > 0 ? fp / tp : 0;
    
    return { posCases, tp, fp, fn, tn, ppv, per1k, fpPerTp };
  }, [sensitivity, specificity, prevalence, totalPatients]);

  const warningLevel = reality.ppv < 0.1 ? 'critical' : reality.ppv < 0.3 ? 'warning' : 'ok';

  return (
    <Card>
      <div className="p-5">
        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
          Vendor Claim Reality Check
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          If vendor claims <strong>{(sensitivity * 100).toFixed(0)}% sensitivity</strong> and{' '}
          <strong>{(specificity * 100).toFixed(0)}% specificity</strong>, here's what happens at{' '}
          <strong>{(prevalence * 100).toFixed(1)}% prevalence</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className={`p-4 rounded-lg border-2 ${
            warningLevel === 'critical' ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600' :
            warningLevel === 'warning' ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/20 dark:border-amber-600' :
            'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600'
          }`}>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Precision (PPV)</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{(reality.ppv * 100).toFixed(1)}%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {warningLevel === 'critical' && 'Critical: Very low precision'}
              {warningLevel === 'warning' && 'Warning: Low precision'}
              {warningLevel === 'ok' && 'Acceptable precision'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Workload Ratio</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{reality.fpPerTp.toFixed(1)}:1</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">FP per TP found</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Cases Missed</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{reality.fn}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">False negatives</div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded mb-4 md:sticky md:top-20 md:z-10 shadow-sm">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>Key Insight:</strong> To find {reality.per1k.tp} true cases per 1000 patients, you'll generate{' '}
            {reality.per1k.fp} false alarms. That's {reality.fpPerTp.toFixed(1)} false positives for every true positive.
            {warningLevel === 'critical' && ' This is likely clinically unworkable.'}
          </p>
        </div>

        <div className="bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500 p-4 rounded-r">
          <h5 className="font-bold text-sky-900 dark:text-sky-200 text-sm mb-2">Per 1000 Patients Reality</h5>
          <ul className="text-sm text-sky-800 dark:text-sky-300 space-y-1">
            <li>• <strong>True cases in population:</strong> {reality.per1k.pos}</li>
            <li>• <strong>Cases found:</strong> {reality.per1k.tp} (benefit)</li>
            <li>• <strong>Cases missed:</strong> {reality.per1k.fn} (failure to get benefit)</li>
            <li>• <strong>False alarms:</strong> {reality.per1k.fp} (cost: follow-ups, anxiety, capacity)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
