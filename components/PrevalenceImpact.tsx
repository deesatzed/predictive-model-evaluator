import React, { useMemo } from 'react';

interface Props {
  recall: number;
  specificity: number;
  positiveCases: number;
  totalPatients: number;
}

const ppv = (se: number, sp: number, prev: number) => {
  const tp = se * prev;
  const fp = (1 - sp) * (1 - prev);
  const denom = tp + fp;
  return denom > 0 ? tp / denom : 0;
};

export const PrevalenceImpact: React.FC<Props> = ({ recall, specificity, positiveCases, totalPatients }) => {
  const prevalence = totalPatients > 0 ? positiveCases / totalPatients : 0;
  const domainMax = Math.max(0.2, Math.min(0.5, prevalence * 3 || 0.2));

  const path = useMemo(() => {
    const n = 60;
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * domainMax;
      const y = ppv(recall, specificity, x);
      const svgX = 10 + (x / domainMax) * 90;
      const svgY = 100 - y * 90;
      pts.push(`${i === 0 ? 'M' : 'L'} ${svgX.toFixed(2)},${svgY.toFixed(2)}`);
    }
    return pts.join(' ');
  }, [recall, specificity, domainMax]);

  const currentPPV = ppv(recall, specificity, prevalence);

  return (
    <div>
      <h5 className="text-center font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">Precision vs Prevalence (Fixed Sensitivity & Specificity)</h5>
      <div className="relative">
        <svg viewBox="0 0 130 130" className="w-full h-auto overflow-visible" style={{ overflow: 'visible' }}>
          <path d="M 10 10 V 100 H 100" fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="0.5"/>
          <line x1="10" y1="10" x2="100" y2="10" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2"/>
          <line x1="10" y1="55" x2="100" y2="55" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2"/>
          <line x1="55" y1="10" x2="55" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2"/>

          <path d={path} fill="none" stroke="currentColor" className="text-sky-600" strokeWidth="1.5"/>

          <line x1={10 + (prevalence / domainMax) * 90} y1="10" x2={10 + (prevalence / domainMax) * 90} y2="100" stroke="currentColor" className="text-amber-400" strokeWidth="0.75" strokeDasharray="3 2"/>
          <circle cx={10 + (prevalence / domainMax) * 90} cy={100 - currentPPV * 90} r="2.5" fill="currentColor" className="text-sky-500" />

          <text x="60" y="122" textAnchor="middle" className="text-[8px] leading-tight text-slate-500 fill-current">Prevalence</text>
          <text x="8" y="60" textAnchor="middle" transform="rotate(-90, 8, 60)" className="text-[8px] leading-tight text-slate-500 fill-current">Precision (PPV)</text>
          <text x="10" y="122" textAnchor="start" className="text-[7px] text-slate-400 fill-current">0.0</text>
          <text x="100" y="122" textAnchor="end" className="text-[7px] text-slate-400 fill-current">{domainMax.toFixed(2)}</text>
          <text x="6" y="100" textAnchor="end" className="text-[7px] text-slate-400 fill-current">0.0</text>
          <text x="6" y="10" textAnchor="end" className="text-[7px] text-slate-400 fill-current">1.0</text>
        </svg>
        <div className="text-center mt-1 text-xs text-slate-600 dark:text-slate-400">
          Current prevalence { (prevalence * 100).toFixed(2) }% → Precision { (currentPPV * 100).toFixed(1) }%
        </div>
      </div>
    </div>
  );
};
