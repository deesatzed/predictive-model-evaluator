import React from 'react';
import { Card } from './ui/Card';

export const Introduction: React.FC = () => {
    return (
        <Card>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-3">The Vendor Evaluation Problem</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                    <strong>Common scenario:</strong> A vendor claims "Our model is 85% sensitive and 85% specific!" But they don't show what happens when you apply it to <strong>your actual patient population</strong> with <strong>your actual disease prevalence</strong>.
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r mb-4">
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                        <strong>The Hidden Truth:</strong> At low prevalence (e.g., 1-3%), even "good" sensitivity and specificity can yield precision (PPV) below 20%. This means 4-5 false alarms for every true case found—often clinically unworkable.
                    </p>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <strong>Simulation only:</strong> Numbers are illustrative to explain concepts, not derived from real patient data.
                </p>
            </div>
        </Card>
    );
};
