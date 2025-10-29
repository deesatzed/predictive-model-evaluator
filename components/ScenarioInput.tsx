import React from 'react';
import { Button } from './ui/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { ScenarioPresets } from './ScenarioPresets';

interface ScenarioInputProps {
    userContext: string;
    setUserContext: (context: string) => void;
    onParse: () => void;
    isParsing: boolean;
    onSelectPreset: (preset: any) => void;
}

export const ScenarioInput: React.FC<ScenarioInputProps> = ({ userContext, setUserContext, onParse, isParsing, onSelectPreset }) => {
    return (
        <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Describe Your Scenario</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-tight">
                        Include model predictions, cohort/horizon, key counts (e.g., confusion matrix), and outreach capacity if relevant.
                    </p>
                </div>
                <Button onClick={onParse} disabled={isParsing} className="w-full sm:w-auto shrink-0">
                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                    {isParsing ? 'Parsing...' : 'Parse'}
                </Button>
            </div>

            <div className="mt-3">
                <textarea
                    rows={5}
                    className="block w-full rounded-md bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm p-2"
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    placeholder="E.g., Model: 1-year inpatient/ED use; Counts: TP=1593, FP=739, FN=9426, TN=46191; Capacity: 40 patients/day"
                />
            </div>

            <ScenarioPresets onSelectPreset={onSelectPreset} />
        </div>
    );
};
