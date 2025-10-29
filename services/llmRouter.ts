import type { SimulationParams } from '../types';
import { parseScenarioWithGemini, analyzeClinicalImpact as analyzeWithGemini, analyzeMoreStats as analyzeMoreWithGemini } from './geminiService';
import { parseScenarioWithOpenRouter, analyzeClinicalImpactWithOpenRouter, analyzeMoreStatsWithOpenRouter } from './openRouterService';
import { parseScenarioText } from './textScenarioParser';
// MLX provider is optional; provide stubs that prompt configuration.

const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore
    return typeof import.meta !== 'undefined' ? (import.meta as any).env?.[key] : undefined;
  } catch {
    return undefined;
  }
};

export type LLMProviderKey = 'gemini' | 'openrouter' | 'mlx';

export const getCurrentProvider = (): LLMProviderKey => {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage.getItem('aiprc:llmProvider') : null;
    const envProv = (getEnv('VITE_LLM_PROVIDER') || 'gemini').toLowerCase();
    const p = (ls || envProv) as LLMProviderKey;
    if (p === 'gemini' || p === 'openrouter' || p === 'mlx') return p;
    return 'gemini';
  } catch {
    return 'gemini';
  }
};

// Optional: surface selected model names for UI display
export const getModelInfo = (): { provider: LLMProviderKey; model?: string } => {
  const provider = getCurrentProvider();
  if (provider === 'gemini') return { provider, model: 'gemini-2.5-flash' };
  if (provider === 'openrouter') {
    let m: string | undefined;
    try {
      if (typeof window !== 'undefined') {
        const ls = window.localStorage.getItem('aiprc:openrouterModel');
        if (ls && ls.length > 0) m = ls;
      }
    } catch {}
    m = m || getEnv('VITE_OPENROUTER_MODEL') || 'openai/gpt-4o-mini';
    return { provider, model: m };
  }
  if (provider === 'mlx') return { provider, model: getEnv('VITE_MLX_MODEL') };
  return { provider: 'gemini', model: 'gemini-2.5-flash' };
};

export const parseScenario = async (context: string): Promise<Partial<SimulationParams>> => {
  const provider = getCurrentProvider();
  // 1) Deterministic local parse for confusion-matrix style inputs
  try {
    const local = parseScenarioText(context);
    if (local && (local.totalPatients || (typeof local.truePositives === 'number' && typeof local.falsePositives === 'number'))) {
      return local;
    }
  } catch {}
  // 2) Fall back to selected LLM provider
  if (provider === 'openrouter') return parseScenarioWithOpenRouter(context);
  if (provider === 'mlx') throw new Error('MLX provider not configured. Set VITE_MLX_BASE_URL and VITE_MLX_MODEL, then implement MLX server client.');
  return parseScenarioWithGemini(context);
};

export const analyzeClinicalImpact = async (params: SimulationParams): Promise<string> => {
  const provider = getCurrentProvider();
  if (provider === 'openrouter') return analyzeClinicalImpactWithOpenRouter(params);
  if (provider === 'mlx') throw new Error('MLX provider not configured. Set VITE_MLX_BASE_URL and VITE_MLX_MODEL, then implement MLX server client.');
  return analyzeWithGemini(params);
};

export const analyzeMoreStats = async (params: SimulationParams): Promise<string> => {
  const provider = getCurrentProvider();
  if (provider === 'openrouter') return analyzeMoreStatsWithOpenRouter(params);
  if (provider === 'mlx') throw new Error('MLX provider not configured. Set VITE_MLX_BASE_URL and VITE_MLX_MODEL, then implement MLX server client.');
  return analyzeMoreWithGemini(params);
};
