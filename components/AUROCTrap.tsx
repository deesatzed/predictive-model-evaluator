import React, { useMemo } from 'react';
import { Card } from './ui/Card';

interface Props {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalPatients: number;
  positiveCases: number;
}

export const AUROCTrap: React.FC<Props> = ({ 
  truePositives, 
  falsePositives, 
  trueNegatives, 
  falseNegatives,
  totalPatients,
  positiveCases
}) => {
  const metrics = useMemo(() => {
    const prevalence = totalPatients > 0 ? (positiveCases / totalPatients) * 100 : 0;
    const negativeCases = totalPatients - positiveCases;
    
    const tpr = positiveCases > 0 ? truePositives / positiveCases : 0;
    const fpr = negativeCases > 0 ? falsePositives / negativeCases : 0;
    const tnr = negativeCases > 0 ? trueNegatives / negativeCases : 0;
    
    const auroc = 0.5 + (tpr - fpr) / 2;
    
    const ppv = (truePositives + falsePositives) > 0 
      ? truePositives / (truePositives + falsePositives) 
      : 0;
    
    const tnPct = totalPatients > 0 ? (trueNegatives / totalPatients) * 100 : 0;
    
    return { 
      auroc, 
      ppv, 
      prevalence, 
      tnPct,
      tpr,
      tnr,
      negativeCases
    };
  }, [truePositives, falsePositives, trueNegatives, falseNegatives, totalPatients, positiveCases]);

  const isHighAUROC = metrics.auroc > 0.8;
  const isLowPPV = metrics.ppv < 0.3;
  const isTrap = isHighAUROC && isLowPPV;

  return (
    <Card>
      <div className="p-5">
        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
          ⚠️ The AUROC Trap with Imbalanced Data
        </h4>
        
        <div className={`p-4 rounded-lg mb-4 ${
          isTrap 
            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500' 
            : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600'
        }`}>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">AUROC</div>
              <div className={`text-3xl font-bold ${
                isHighAUROC 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-slate-900 dark:text-slate-50'
              }`}>
                {(metrics.auroc * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {isHighAUROC ? '✓ Looks great!' : 'Not impressive'}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Precision (PPV)</div>
              <div className={`text-3xl font-bold ${
                isLowPPV 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {(metrics.ppv * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {isLowPPV ? '✗ Actually poor!' : '✓ Acceptable'}
              </div>
            </div>
          </div>

          {isTrap && (
            <div className="bg-red-100 dark:bg-red-900/40 border-l-4 border-red-600 p-3 rounded">
              <p className="text-sm font-bold text-red-900 dark:text-red-200">
                🚨 AUROC TRAP DETECTED
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                This model has a "decent" AUROC ({(metrics.auroc * 100).toFixed(0)}%) but terrible precision ({(metrics.ppv * 100).toFixed(1)}%). 
                This is the classic mistake vendors make with imbalanced data.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-lg border-l-4 border-sky-500">
            <h5 className="font-bold text-sky-900 dark:text-sky-200 mb-2">Why AUROC Looks Good (But Is Misleading)</h5>
            <ul className="text-sky-800 dark:text-sky-300 space-y-1 text-sm">
              <li>• Your data is <strong>{metrics.prevalence.toFixed(1)}% positive</strong>, meaning {(100 - metrics.prevalence).toFixed(1)}% are negative</li>
              <li>• The model correctly identified <strong>{trueNegatives} true negatives</strong> ({metrics.tnPct.toFixed(1)}% of all patients)</li>
              <li>• AUROC gives the model credit for all those easy negative predictions</li>
              <li>• With {(100 - metrics.prevalence).toFixed(0)}% negative cases, it's easy to get high specificity ({(metrics.tnr * 100).toFixed(1)}%)</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-4 border-amber-500">
            <h5 className="font-bold text-amber-900 dark:text-amber-200 mb-2">Why Precision (PPV) Tells the Truth</h5>
            <ul className="text-amber-800 dark:text-amber-300 space-y-1 text-sm">
              <li>• Precision ignores the abundant true negatives</li>
              <li>• It only asks: <strong>"Of the positive predictions, how many are correct?"</strong></li>
              <li>• At {metrics.prevalence.toFixed(1)}% prevalence, even small FP rates destroy precision</li>
              <li>• Current precision: {(metrics.ppv * 100).toFixed(1)}% means <strong>{((1 - metrics.ppv) * 100).toFixed(1)}% of positive predictions are wrong</strong></li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
            <h5 className="font-bold text-purple-900 dark:text-purple-200 mb-2">Why AUPRC Is Better for Imbalanced Data</h5>
            <ul className="text-purple-800 dark:text-purple-300 space-y-1 text-sm">
              <li>• AUPRC (Precision-Recall) doesn't reward easy true negatives</li>
              <li>• It focuses on the hard task: finding positives in a sea of negatives</li>
              <li>• AUPRC will be much lower than AUROC when precision is poor</li>
              <li>• <strong>AUPRC forces vendors to show real clinical utility</strong></li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-400 dark:border-green-600">
            <h5 className="font-bold text-green-900 dark:text-green-200 text-sm mb-2">What to Demand from Vendors</h5>
            <ul className="text-green-800 dark:text-green-300 space-y-1 text-xs">
              <li>✓ Report <strong>AUPRC</strong>, not just AUROC</li>
              <li>✓ Show <strong>precision (PPV)</strong> at your actual prevalence</li>
              <li>✓ Provide <strong>precision-recall curves</strong>, not just ROC</li>
              <li>✓ Report performance <strong>stratified by prevalence ranges</strong></li>
              <li>✓ Show <strong>per-1000 patient impact</strong> (TP, FP, FN)</li>
              <li>✓ Compare to <strong>"predict all negative" baseline</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
