import React from 'react';
import type { SimulationParams, DerivedMetrics } from '../types';

interface ConfusionMatrixProps {
    params: SimulationParams;
    derivedMetrics: DerivedMetrics;
}

const MatrixCell: React.FC<{ value: number; label: string; sublabel: string; color: string }> = ({ value, label, sublabel, color }) => (
    <div className={`p-4 rounded-lg text-white text-center ${color}`}>
        <div className="text-3xl font-bold">{value}</div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs opacity-80">{sublabel}</div>
    </div>
);

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ params, derivedMetrics }) => {
    const { truePositives, falsePositives } = params;
    const { trueNegatives, falseNegatives } = derivedMetrics;

    return (
        <div className="grid grid-cols-[auto_1fr] gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl items-center">
            {/* Corner Cell */}
            <div></div>
            {/* Top Labels */}
            <div className="grid grid-cols-2 gap-2 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                <div>Predicted: Positive</div>
                <div>Predicted: Negative</div>
            </div>

            {/* Side Label for Row 1 */}
            <div className="text-sm font-semibold text-right -rotate-90 text-slate-500 dark:text-slate-400">Actual: Positive</div>
            {/* Data Cells for Row 1 */}
            <div className="grid grid-cols-2 gap-2">
                 <MatrixCell value={truePositives} label="True Positive" sublabel="Correctly Identified" color="bg-green-500" />
                 <MatrixCell value={falseNegatives} label="False Negative" sublabel="Missed Cases" color="bg-orange-500" />
            </div>

            {/* Side Label for Row 2 */}
            <div className="text-sm font-semibold text-right -rotate-90 text-slate-500 dark:text-slate-400">Actual: Negative</div>

             {/* Data Cells for Row 2 */}
             <div className="grid grid-cols-2 gap-2">
                <MatrixCell value={falsePositives} label="False Positive" sublabel="Incorrectly Flagged" color="bg-red-500" />
                <MatrixCell value={trueNegatives} label="True Negative" sublabel="Correctly Rejected" color="bg-blue-500" />
            </div>
        </div>
    );
};
