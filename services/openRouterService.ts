import type { SimulationParams } from '../types';
// @ts-ignore
import moreStatsPrompt from '../more_stats_prompt.md?raw';

const getApiKey = (): string | undefined => {
  const viteKey = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_OPENROUTER_API_KEY : undefined;
  const nodeKey = typeof process !== 'undefined' ? ((process as any).env?.OPENROUTER_API_KEY) : undefined;
  return viteKey || nodeKey;
};

export const analyzeMoreStatsWithOpenRouter = async (params: SimulationParams): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY not set.');
  const model = getModel();
  const { totalPatients, positiveCases, truePositives, falsePositives } = params;
  const negativeCases = totalPatients - positiveCases;
  const falseNegatives = Math.max(0, positiveCases - truePositives);
  const trueNegatives = Math.max(0, negativeCases - falsePositives);
  const dataBlock = `N: ${totalPatients}\nP: ${positiveCases}\nTP: ${truePositives}\nFP: ${falsePositives}\nFN: ${falseNegatives}\nTN: ${trueNegatives}`;
  const user = `${moreStatsPrompt}\n\nDATA\n${dataBlock}`;
  const system = 'You write compact, clinical, bullet-first analyses in markdown. 200 words max.';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'AUPRC Clinical Simulator'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2
    })
  });
  if (!res.ok) return 'OpenRouter request failed.';
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  return String(content);
};

const getModel = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const ls = window.localStorage.getItem('aiprc:openrouterModel');
      if (ls && ls.length > 0) return ls;
    }
  } catch {}
  const m = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_OPENROUTER_MODEL : undefined;
  return m || 'openai/gpt-4o-mini';
};

const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

export const parseScenarioWithOpenRouter = async (context: string): Promise<Partial<SimulationParams>> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY not set.');
  const model = getModel();
  const system = 'You extract numbers and return only strict JSON with keys totalPatients, positiveCases, truePositives, falsePositives if present. No prose, no code fences.';
  const user = `From the text, extract numeric values. Return only JSON.\n---\n${context}\n---`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'AUPRC Clinical Simulator'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.0
    })
  });
  if (!res.ok) throw new Error(`OpenRouter parse error: ${res.status}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  const clean = String(content).replace(/^```json\n?|\n?```$/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return {};
  }
};

export const analyzeClinicalImpactWithOpenRouter = async (params: SimulationParams): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY not set.');
  const model = getModel();
  const { totalPatients, positiveCases, truePositives, falsePositives, userContext, cohortSize, dailyCapacity, slaDays } = params;
  const negativeCases = totalPatients - positiveCases;
  const falseNegatives = positiveCases - truePositives;
  const trueNegatives = negativeCases - falsePositives;
  const prevFrac = totalPatients > 0 ? (positiveCases / totalPatients) : 0;
  const precisionFrac = (truePositives + falsePositives > 0) ? (truePositives / (truePositives + falsePositives)) : 0;
  const recallFrac = (positiveCases > 0) ? (truePositives / positiveCases) : 0;
  const prevalence = (prevFrac * 100).toFixed(2);
  const precision = (precisionFrac * 100).toFixed(1);
  const recall = (recallFrac * 100).toFixed(1);

  // Operational fit calculations
  const N = (cohortSize && cohortSize > 0) ? cohortSize : totalPatients;
  const Cday = dailyCapacity ?? 0;
  const L = slaDays ?? 0;
  const allowedFraction = (N > 0 && Cday > 0 && L > 0) ? (Cday * L) / N : 0;
  const flaggedRateCurrent = totalPatients > 0 ? ((truePositives + falsePositives) / totalPatients) : 0;
  const flaggedCohortCurrent = Math.round(flaggedRateCurrent * (N || 0));
  const daysToClearCurrent = (Cday > 0) ? Math.ceil(flaggedCohortCurrent / Cday) : 0;
  const backlogAtSlaCurrent = Math.max(0, flaggedCohortCurrent - Cday * L);
  const tpPerDayCurrent = Math.round(Math.min(Cday, flaggedCohortCurrent) * (precisionFrac || 0));
  const fpPerDayCurrent = Math.round(Math.min(Cday, flaggedCohortCurrent) * (1 - (precisionFrac || 0)));

  let recRecall = recallFrac;
  let recPrecision = precisionFrac;
  if (allowedFraction > 0 && prevFrac > 0) {
    const rCap = Math.min(1, allowedFraction / prevFrac);
    const requiredPAtCurrentR = (recallFrac * prevFrac) / allowedFraction;
    if (precisionFrac + 1e-9 < requiredPAtCurrentR) {
      if (recallFrac > rCap) {
        recRecall = rCap;
        recPrecision = Math.min(1, (recRecall * prevFrac) / allowedFraction);
      } else {
        recRecall = recallFrac;
        recPrecision = Math.min(1, requiredPAtCurrentR);
      }
    }
  }
  const flaggedRateRec = (allowedFraction > 0 && prevFrac > 0) ? Math.min(allowedFraction, (recRecall * prevFrac) / Math.max(recPrecision, 1e-9)) : 0;
  const flaggedCohortRec = Math.round(flaggedRateRec * (N || 0));
  const daysToClearRec = (Cday > 0) ? Math.ceil(flaggedCohortRec / Cday) : 0;
  const backlogAtSlaRec = Math.max(0, flaggedCohortRec - Cday * L);
  const tpPerDayRec = Math.round(Math.min(Cday, flaggedCohortRec) * (recPrecision || 0));
  const fpPerDayRec = Math.round(Math.min(Cday, flaggedCohortRec) * (1 - (recPrecision || 0)));
  const system = 'You write concise, clinical, bullet-first analyses. No letter formatting. 200 words max.';
  const user = `Important: This is a didactic simulation.\n\nCurrent Numbers:\n- Total: ${totalPatients}\n- Positives: ${positiveCases} (${prevalence}%)\n- TP: ${truePositives}\n- FP: ${falsePositives}\n- TN: ${trueNegatives}\n- FN: ${falseNegatives}\n- Precision: ${precision}%\n- Recall: ${recall}%\n\nContext:\n${userContext || ''}\n\nWrite a concise memo with:\n- Executive one-liner\n- Simulation caveat one-liner\n- Delta vs Baseline (per 1000): benefit (+TP), failures (FN), cost (FP)\n- AUROC vs AUPRC trap for imbalanced data\n- Actionable vendor requirements\n- Operational Fit (if capacity provided):\n  - Inputs: Cohort ${N || 0}, Daily capacity ${Cday || 0}, SLA ${L || 0} days\n  - Current: flagged ${flaggedCohortCurrent}, clear ${daysToClearCurrent} days, backlog @SLA ${backlogAtSlaCurrent}, TP/day ${tpPerDayCurrent}, FP/day ${fpPerDayCurrent}\n  - Recommended: ${(recPrecision * 100).toFixed(1)}% PPV @ ${(recRecall * 100).toFixed(1)}% recall, flagged ${flaggedCohortRec}, clear ${daysToClearRec} days, backlog @SLA ${backlogAtSlaRec}, TP/day ${tpPerDayRec}, FP/day ${fpPerDayRec}\n`; 
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'AUPRC Clinical Simulator'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.4
    })
  });
  if (!res.ok) return 'OpenRouter request failed.';
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  return String(content);
};
