import React from 'react';
import type { SimulationParams, DerivedMetrics } from '../types';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { ConfusionMatrix } from './ConfusionMatrix';
import { PrevalenceImpact } from './PrevalenceImpact';
import { CapacityPlanner } from './CapacityPlanner';
import { OpsKPI } from './OpsKPI';


interface SimulatorProps {
    params: SimulationParams;
    derivedMetrics: DerivedMetrics;
    onParamsChange: (newParams: Partial<SimulationParams>) => void;
}

const MetricDisplay: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg text-center ${className}`}>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</div>
    </div>
);

export const Simulator: React.FC<SimulatorProps> = ({ params, derivedMetrics, onParamsChange }) => {
    const { totalPatients, positiveCases, truePositives, falsePositives } = params;
    const { negativeCases, falseNegatives, precision, recall, specificity } = derivedMetrics;
    const recallPct = Math.round(recall * 100);
    const specificityPct = Math.round(specificity * 100);
    const currentFpPerThousand = totalPatients > 0 ? Math.round((falsePositives / totalPatients) * 1000) : 0;

    
    return (
        <Card>
            <div className="p-4">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Step 2: Visualize & Tweak</h3>

                <div className="space-y-6">
                    <Slider
                        label="Total Patients"
                        value={totalPatients}
                        min={100}
                        max={5000}
                        step={100}
                        onChange={(val) => onParamsChange({ totalPatients: val, positiveCases: Math.min(positiveCases, val) })}
                    />
                    <Slider
                        label="Actual Positive Cases (Prevalence)"
                        value={positiveCases}
                        min={1}
                        max={Math.min(200, totalPatients)}
                        onChange={(val) => onParamsChange({ positiveCases: val, truePositives: Math.min(truePositives, val) })}
                    />
                     <Slider
                        label="True Positives (Correctly Identified)"
                        value={truePositives}
                        min={0}
                        max={positiveCases}
                        onChange={(val) => onParamsChange({ truePositives: val })}
                    />
                    <Slider
                        label="False Positives (Incorrectly Flagged)"
                        value={falsePositives}
                        min={0}
                        max={negativeCases}
                        onChange={(val) => onParamsChange({ falsePositives: val })}
                    />
                </div>

                <div className="mt-8">
                    <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Direct Entry</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Total Patients</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
                                value={totalPatients}
                                onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value || '0', 10));
                                    const newPositive = Math.min(positiveCases, val);
                                    const newNeg = val - newPositive;
                                    const newFP = Math.min(falsePositives, newNeg);
                                    onParamsChange({ totalPatients: val, positiveCases: newPositive, falsePositives: newFP });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Actual Positive Cases</label>
                            <input
                                type="number"
                                min={0}
                                max={totalPatients}
                                className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
                                value={positiveCases}
                                onChange={(e) => {
                                    const raw = parseInt(e.target.value || '0', 10);
                                    const val = Math.max(0, Math.min(totalPatients, raw));
                                    const newTP = Math.min(truePositives, val);
                                    const newNeg = totalPatients - val;
                                    const newFP = Math.min(falsePositives, newNeg);
                                    onParamsChange({ positiveCases: val, truePositives: newTP, falsePositives: newFP });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">True Positives</label>
                            <input
                                type="number"
                                min={0}
                                max={positiveCases}
                                className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
                                value={truePositives}
                                onChange={(e) => {
                                    const raw = parseInt(e.target.value || '0', 10);
                                    const val = Math.max(0, Math.min(positiveCases, raw));
                                    onParamsChange({ truePositives: val });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">False Positives</label>
                            <input
                                type="number"
                                min={0}
                                max={negativeCases}
                                className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
                                value={falsePositives}
                                onChange={(e) => {
                                    const raw = parseInt(e.target.value || '0', 10);
                                    const val = Math.max(0, Math.min(negativeCases, raw));
                                    onParamsChange({ falsePositives: val });
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">Calculated Metrics</h4>
                    <ConfusionMatrix params={params} derivedMetrics={derivedMetrics} />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <MetricDisplay label="Precision" value={`${(precision * 100).toFixed(1)}%`} className="text-blue-500 dark:text-blue-400" />
                        <MetricDisplay label="Recall" value={`${(recall * 100).toFixed(1)}%`} className="text-green-500 dark:text-green-400" />
                    </div>
                </div>

                <div className="mt-8">
                    <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Operating Point Simulator (Optional)</h4>
                    <p className="text-xs text-slate-500 mb-3">Adjust sensitivity and specificity or set an acceptable false-positive budget. Counts update automatically.</p>
                    <div className="space-y-6">
                        <Slider
                            label={`Sensitivity (Recall) %`}
                            value={recallPct}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(val) => {
                                const r = val / 100;
                                const newTP = Math.max(0, Math.min(positiveCases, Math.round(positiveCases * r)));
                                onParamsChange({ truePositives: newTP });
                            }}
                        />
                        <Slider
                            label={`Specificity %`}
                            value={specificityPct}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(val) => {
                                const s = val / 100;
                                const newTN = Math.max(0, Math.min(negativeCases, Math.round(negativeCases * s)));
                                const newFP = Math.max(0, negativeCases - newTN);
                                onParamsChange({ falsePositives: newFP });
                            }}
                        />
                        <Slider
                            label={`Max acceptable False Positives per 1000`}
                            value={currentFpPerThousand}
                            min={0}
                            max={200}
                            step={1}
                            onChange={(val) => {
                                const allowed = Math.round((val / 1000) * totalPatients);
                                const clamped = Math.max(0, Math.min(negativeCases, allowed));
                                onParamsChange({ falsePositives: clamped });
                            }}
                        />
                    </div>
                </div>

                {/* ROC/PR curves removed per request */}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <PrevalenceImpact 
                            recall={recall}
                            specificity={specificity}
                            positiveCases={params.positiveCases}
                            totalPatients={params.totalPatients}
                        />
                    </div>
                    <div>
                        <CapacityPlanner 
                            totalPatients={params.totalPatients}
                            truePositives={params.truePositives}
                            falsePositives={params.falsePositives}
                            cohortSize={params.cohortSize}
                            dailyCapacity={params.dailyCapacity}
                            workdaysPerWeek={params.workdaysPerWeek}
                            slaDays={params.slaDays}
                            onChange={(v)=>{
                                onParamsChange({
                                    cohortSize: v.cohortSize,
                                    dailyCapacity: v.dailyCapacity,
                                    workdaysPerWeek: v.workdaysPerWeek,
                                    slaDays: v.slaDays,
                                });
                            }}
                            onFit={() => {
                                const N = (params.cohortSize && params.cohortSize > 0) ? params.cohortSize : params.totalPatients;
                                const Cday = params.dailyCapacity || 0;
                                const L = params.slaDays || 0;
                                if (!N || !Cday || !L || params.totalPatients <= 0) return;
                                const allowedCohort = Cday * L;
                                const flaggedRate = (params.truePositives + params.falsePositives) / params.totalPatients;
                                const flaggedCohort = Math.round(flaggedRate * N);
                                const tpRate = params.truePositives / params.totalPatients;
                                const tpCohort = Math.round(tpRate * N);
                                const targetCohort = Math.min(flaggedCohort, allowedCohort);
                                if (tpCohort >= targetCohort) {
                                    // Even with FP=0 we exceed capacity: reduce TP to fit
                                    const newTPCohort = Math.max(0, targetCohort);
                                    const newTP = Math.max(0, Math.min(params.positiveCases, Math.round((newTPCohort / N) * params.totalPatients)));
                                    onParamsChange({ truePositives: newTP, falsePositives: 0 });
                                } else {
                                    const newFPCohort = Math.max(0, targetCohort - tpCohort);
                                    const newFP = Math.max(0, Math.min(negativeCases, Math.round((newFPCohort / N) * params.totalPatients)));
                                    onParamsChange({ falsePositives: newFP });
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <OpsKPI params={params} derived={derivedMetrics} />
                </div>

            </div>
        </Card>
    );
};