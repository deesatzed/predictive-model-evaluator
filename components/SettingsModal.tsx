import React, { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/Card';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const curatedOpenRouterModels = [
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-haiku',
  'google/gemini-2.0-flash-lite',
  'meta-llama/llama-3.1-8b-instruct',
  'mistralai/mistral-nemo',
  'qwen/qwen-2.5-7b-instruct',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'gemini' | 'openrouter' | 'mlx'>('gemini');
  const [openRouterModel, setOpenRouterModel] = useState<string>('openai/gpt-4o-mini');
  const [models, setModels] = useState<string[]>(curatedOpenRouterModels);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [serverCfg, setServerCfg] = useState<{ provider: string; model?: string } | null>(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const lsProv = window.localStorage.getItem('aiprc:llmProvider');
      const envProv = (import.meta as any).env?.VITE_LLM_PROVIDER || 'gemini';
      const p = (lsProv || envProv).toLowerCase();
      if (p === 'gemini' || p === 'openrouter' || p === 'mlx') setProvider(p);
      const lsModel = window.localStorage.getItem('aiprc:openrouterModel');
      const envModel = (import.meta as any).env?.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      setOpenRouterModel(lsModel || envModel);
    } catch {}
    // Load global server settings if available
    (async () => {
      setServerMsg(null);
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          setServerCfg(json);
        }
      } catch {}
    })();
  }, [isOpen]);

  useEffect(() => {
    const fetchModels = async () => {
      if (!isOpen || provider !== 'openrouter') return;
      setLoadingModels(true);
      setError(null);
      try {
        const key = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || (window as any).process?.env?.OPENROUTER_API_KEY;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (key) headers['Authorization'] = `Bearer ${key}`;
        const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        const names: string[] = (json?.data || []).map((m: any) => m.id).filter(Boolean);
        // Fallback to curated list if API returns empty
        setModels(names.length ? names : curatedOpenRouterModels);
      } catch (e: any) {
        setError('Could not load live model list. Using curated defaults.');
        setModels(curatedOpenRouterModels);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, [isOpen, provider]);

  const save = () => {
    try {
      window.localStorage.setItem('aiprc:llmProvider', provider);
      if (provider === 'openrouter') {
        window.localStorage.setItem('aiprc:openrouterModel', openRouterModel);
      }
    } catch {}
    onClose();
  };

  const applyGlobally = async () => {
    setServerMsg(null);
    setError(null);
    try {
      const body: any = { password: adminPassword, provider };
      if (provider === 'openrouter') body.model = openRouterModel;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const t = await res.text();
        setError('Global apply failed');
        setServerMsg(t || '');
        return;
      }
      const json = await res.json();
      setServerCfg(json);
      setServerMsg('Global settings saved');
      setAdminPassword('');
    } catch (e: any) {
      setError('Global apply failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕</button>
          </div>

          <div className="space-y-6">
            {serverCfg && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Global: provider <span className="font-semibold">{serverCfg.provider}</span>{serverCfg.model ? ` • model ${serverCfg.model}` : ''}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">LLM Provider</div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="llm" checked={provider==='gemini'} onChange={()=>setProvider('gemini')} />
                  Gemini (gemini-2.5-flash)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="llm" checked={provider==='openrouter'} onChange={()=>setProvider('openrouter')} />
                  OpenRouter
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="llm" checked={provider==='mlx'} onChange={()=>setProvider('mlx')} />
                  Local MLX (coming soon)
                </label>
              </div>
            </div>

            {provider === 'openrouter' && (
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">OpenRouter Model</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Live list when possible; falls back to curated defaults.</div>
                <select value={openRouterModel} onChange={(e)=>setOpenRouterModel(e.target.value)} className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {models.map((m)=> (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {loadingModels && <div className="text-xs text-slate-500 mt-2">Loading models…</div>}
                {error && <div className="text-xs text-amber-600 mt-2">{error}</div>}
              </div>
            )}

            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Admin</div>
              <div className="flex items-center gap-2">
                <input type="password" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Admin password" className="flex-1 p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                <button onClick={applyGlobally} className="px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700">Apply globally</button>
              </div>
              {serverMsg && <div className="text-xs mt-2 text-slate-500 dark:text-slate-400">{serverMsg}</div>}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-3 py-2 text-sm rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Cancel</button>
              <button onClick={save} className="px-3 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-700">Save</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
