import React from 'react';
import { Button } from './ui/Button';

interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  params: {
    totalPatients: number;
    positiveCases: number;
    truePositives: number;
    falsePositives: number;
  };
  context: string;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'ich',
    name: 'Intracranial Hemorrhage',
    description: 'AI detection of ICH in head CT scans',
    params: {
      totalPatients: 1000,
      positiveCases: 4,
      truePositives: 3,
      falsePositives: 12,
    },
    context: `Help explain why the Area Under the Precision-Recall Curve (AUPRC) is vital to understand the real-world clinical impact of models. 

We are currently evaluating an AI vendor's app that reads head CTs for intracranial hemorrhage (ICH). The vendor is focused on AUROC, but I'm concerned about performance given the low prevalence of ICH in our screening population.

For a sample of 1000 scans, we have about 5 positive ICH cases. In a simulation, the model correctly identified 3 of those cases but also incorrectly flagged 12 healthy patients.`
  },
  {
    id: 'lung-cancer',
    name: 'Lung Cancer Screening',
    description: 'AI detection of lung cancer in low-dose CT scans',
    params: {
      totalPatients: 2000,
      positiveCases: 40,
      truePositives: 35,
      falsePositives: 150,
    },
    context: `Our radiology department is evaluating an AI tool for lung cancer screening using low-dose CT scans. The prevalence of lung cancer in our screening population is relatively low at 2%.

In a sample of 2000 scans, there were 40 actual lung cancer cases. The model correctly identified 35 of these cases but also flagged 150 healthy patients as potentially having cancer.`
  },
  {
    id: 'diabetic-retinopathy',
    name: 'Diabetic Retinopathy',
    description: 'AI detection of diabetic retinopathy in eye exams',
    params: {
      totalPatients: 1500,
      positiveCases: 150,
      truePositives: 120,
      falsePositives: 90,
    },
    context: `We're assessing an AI system for detecting diabetic retinopathy from retinal photographs in a primary care setting. The prevalence is moderate at 10% in our diabetic patient population.

From 1500 patient exams, 150 had actual diabetic retinopathy. The model correctly identified 120 cases but also incorrectly flagged 90 healthy patients.`
  },
  {
    id: 'sepsis-prediction',
    name: 'Sepsis Prediction',
    description: 'AI early warning system for sepsis in hospital patients',
    params: {
      totalPatients: 3000,
      positiveCases: 90,
      truePositives: 75,
      falsePositives: 200,
    },
    context: `Our hospital is implementing an AI early warning system for sepsis prediction. The condition has a low prevalence of 3% among our monitored patients.

In a sample of 3000 patients, 90 developed sepsis. The model successfully predicted 75 of these cases but also generated 200 false alarms for patients who did not develop sepsis.`
  }
];

interface ScenarioPresetsProps {
  onSelectPreset: (preset: ScenarioPreset) => void;
}

export const ScenarioPresets: React.FC<ScenarioPresetsProps> = ({ onSelectPreset }) => {
  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-300">Clinical Scenario Presets</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCENARIO_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            className="w-full text-left h-auto py-3 px-4 flex flex-col items-start justify-start gap-1 whitespace-normal"
            onClick={() => onSelectPreset(preset)}
          >
            <div className="font-semibold text-slate-800 dark:text-slate-100">{preset.name}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{preset.description}</div>
          </Button>
        ))}
      </div>
    </div>
  );
};
