import React, { useMemo } from 'react';

interface PerformanceCurvesProps {
  precision: number;
  recall: number; // Also known as True Positive Rate
  specificity: number;
  positiveCases: number;
  totalPatients: number;
  cohortSize?: number;
  dailyCapacity?: number;
  slaDays?: number;
}

const Chart: React.FC<{
  title: string;
  xLabel: string;
  yLabel: string;
  xValue: number;
  yValue: number;
  curvePath: string;
  baselinePath: string;
  xDisplay: string;
  yDisplay: string;
  overlayPaths?: React.ReactNode;
}> = ({ title, xLabel, yLabel, xValue, yValue, curvePath, baselinePath, xDisplay, yDisplay, overlayPaths }) => (
    <div>
        <h5 className="text-center font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">{title}</h5>
        <div className="relative">
             <svg viewBox="0 0 130 130" className="w-full h-auto overflow-visible" style={{ overflow: 'visible' }}>
                {/* Axes and Grid */}
                <path d="M 10 10 V 100 H 100" fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="0.5"/>
                <line x1="10" y1="10" x2="100" y2="10" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2"/>
                <line x1="10" y1="55" x2="100" y2="55" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2"/>
                <line x1="55" y1="10" x2="55" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="2"/>
                
                {/* Feasible Region Overlay (optional) */}
                {overlayPaths}

                {/* Baseline */}
                <path d={baselinePath} fill="none" stroke="currentColor" className="text-orange-400" strokeWidth="1" strokeDasharray="2"/>
                
                {/* Good Model Curve */}
                <path d={curvePath} fill="none" stroke="currentColor" className="text-green-500" strokeWidth="1.5"/>

                {/* Current Point */}
                <circle cx={10 + xValue * 90} cy={100 - yValue * 90} r="2.5" fill="currentColor" className="text-sky-500" />
                
                {/* Labels */}
                <text x="60" y="126" textAnchor="middle" className="text-slate-500 fill-current" style={{ fontSize: 8 }}>{xLabel}</text>
                <text x="2" y="60" textAnchor="middle" transform="rotate(-90, 2, 60)" className="text-slate-500 fill-current" style={{ fontSize: 8 }}>{yLabel}</text>
                
                {/* Axis Values */}
                <text x="10" y="116" textAnchor="start" className="text-slate-400 fill-current" style={{ fontSize: 7 }}>0.0</text>
                <text x="100" y="116" textAnchor="end" className="text-slate-400 fill-current" style={{ fontSize: 7 }}>1.0</text>
                <text x="6" y="100" textAnchor="end" className="text-slate-400 fill-current" style={{ fontSize: 7 }}>0.0</text>
                <text x="6" y="10" textAnchor="end" className="text-slate-400 fill-current" style={{ fontSize: 7 }}>1.0</text>
            </svg>
            <div className="text-center mt-1 text-xs text-slate-600 dark:text-slate-400">
                Current: ({xDisplay}, {yDisplay})
            </div>
        </div>
    </div>
);

export const PerformanceCurves: React.FC<PerformanceCurvesProps> = ({ precision, recall, specificity, positiveCases, totalPatients, cohortSize, dailyCapacity, slaDays }) => {
  const falsePositiveRate = 1 - specificity;
  const prevalence = totalPatients > 0 ? positiveCases / totalPatients : 0;

  const { rocCurvePath, prCurvePath, prBaselinePath } = useMemo(() => {
    // ROC Curve Simulation: From (0,0) to (1,1) passing through (FPR, TPR)
    const fprSvg = 10 + falsePositiveRate * 90;
    const tprSvg = 100 - recall * 90;
    const rocPath = `M 10,100 Q 10,${tprSvg} ${fprSvg},${tprSvg} T 100,10`;

    // PR Curve Simulation: From (R:0, P:1) to (R:1, P:prevalence) passing through user point
    const recallSvg = 10 + recall * 90;
    const precisionSvg = 100 - precision * 90;
    const prevalenceSvgY = 100 - prevalence * 90;
    const prPath = `M 10,10 Q ${recallSvg},10 ${recallSvg},${precisionSvg} T 100,${prevalenceSvgY}`;

    // PR Baseline is a horizontal line at the prevalence rate
    const prBaseline = `M 10,${prevalenceSvgY} L 100,${prevalenceSvgY}`;

    return { rocCurvePath: rocPath, prCurvePath: prPath, prBaselinePath: prBaseline };
  }, [precision, recall, falsePositiveRate, prevalence]);

  // Feasible region based on capacity: recall*prevalence/precision <= allowedFraction
  const prOverlay = useMemo(() => {
    const N = cohortSize && cohortSize > 0 ? cohortSize : totalPatients;
    const Cday = dailyCapacity ?? 0;
    const L = slaDays ?? 0;
    const allowedFraction = N > 0 ? (Cday * L) / N : 0;
    if (!N || !Cday || !L || allowedFraction <= 0 || prevalence <= 0) return null;

    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= 20; i++) {
      const r = i / 20; // 0..1
      const pMin = Math.min(1, (r * prevalence) / allowedFraction || 0);
      const x = 10 + r * 90;
      const y = 100 - pMin * 90;
      pts.push({ x, y });
    }

    // Build polygon for infeasible (below boundary)
    const polyPts = [
      ...pts.map(p => `${p.x},${p.y}`), // along boundary
      '100,100', // bottom-right
      '10,100'   // bottom-left
    ].join(' ');

    // Recommended within-capacity point
    const rCap = Math.min(1, allowedFraction / (prevalence || 1e-9));
    let recR = recall;
    let recP = precision;
    const requiredPAtCurrentR = (recall * prevalence) / allowedFraction;
    if (precision + 1e-9 < requiredPAtCurrentR) {
      if (recall > rCap) {
        recR = rCap;
        recP = Math.min(1, (recR * prevalence) / allowedFraction);
      } else {
        recR = recall;
        recP = Math.min(1, requiredPAtCurrentR);
      }
    }

    const recX = 10 + recR * 90;
    const recY = 100 - recP * 90;

    return (
      <g>
        <polygon points={polyPts} fill="currentColor" className="text-red-500" opacity="0.12" />
        <path d={`M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="currentColor" className="text-red-500" strokeWidth="0.8" strokeDasharray="3 2" />
        <rect x={recX - 2} y={recY - 2} width="4" height="4" fill="currentColor" className="text-purple-500" />
      </g>
    );
  }, [cohortSize, dailyCapacity, slaDays, totalPatients, prevalence, recall, precision]);


  return (
    <div>
        <h4 className="font-semibold mb-1 text-slate-700 dark:text-slate-300">Performance Curves</h4>
        <p className="text-xs text-slate-500 mb-3">Simulated curves at your current operating point.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
            <Chart
                title="ROC Curve"
                xLabel="1 - Specificity (FPR)"
                yLabel="Recall (TPR)"
                xValue={falsePositiveRate}
                yValue={recall}
                curvePath={rocCurvePath}
                baselinePath="M 10 100 L 100 10"
                xDisplay={falsePositiveRate.toFixed(2)}
                yDisplay={recall.toFixed(2)}
            />
            <Chart
                title="Precision-Recall Curve"
                xLabel="Recall"
                yLabel="Precision"
                xValue={recall}
                yValue={precision}
                curvePath={prCurvePath}
                baselinePath={prBaselinePath}
                xDisplay={recall.toFixed(2)}
                yDisplay={precision.toFixed(2)}
                overlayPaths={prOverlay}
            />
        </div>
    </div>
  );
};