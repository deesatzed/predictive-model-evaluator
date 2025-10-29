import type { SimulationParams } from '../types';

export const parseScenarioText = (raw: string): Partial<SimulationParams> | null => {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.toLowerCase();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let tp: number | undefined;
  let fp: number | undefined;
  let fn: number | undefined;
  let tn: number | undefined;

  const numFrom = (s: string): number | undefined => {
    const m = s.match(/(-?\d[\d,\.]*)/g);
    if (!m || m.length === 0) return undefined;
    const last = m[m.length - 1].replace(/,/g, '');
    const n = Number(last);
    return Number.isFinite(n) ? Math.round(n) : undefined;
  };

  const pol = (s: string): 'pos' | 'neg' | null => {
    if (/\b(true|positive|pos)\b/.test(s)) return 'pos';
    if (/\b(false|negative|neg)\b/.test(s)) return 'neg';
    return null;
  };

  for (const line of lines) {
    const n = numFrom(line);
    if (n === undefined) continue;

    // Try explicit "test ... actual ..." form
    const testMatch = line.match(/\b(test|pred(?:icted)?)\b[^\n]*?\b(true|false|positive|negative)\b/);
    const actualMatch = line.match(/\b(actual|truth|label|ground\s*truth)\b[^\n]*?\b(true|false|positive|negative)\b/);

    if (testMatch && actualMatch) {
      const pred = pol(testMatch[2]);
      const act = pol(actualMatch[2]);
      if (pred && act) {
        if (pred === 'pos' && act === 'pos') tp = n;
        else if (pred === 'pos' && act === 'neg') fp = n;
        else if (pred === 'neg' && act === 'pos') fn = n;
        else if (pred === 'neg' && act === 'neg') tn = n;
        continue;
      }
    }

    // Heuristics fallback: lines containing both polarity words, choose mapping
    const hasTest = /\b(test|pred(?:icted)?)\b/.test(line);
    const hasActual = /\b(actual|truth|label|ground\s*truth)\b/.test(line);
    const predPol = pol(line);
    const actPol = pol(line.replace(/.*\b(actual|truth|label|ground\s*truth)\b/, '')); // polarity after the word 'actual'

    if (hasTest && hasActual && predPol && actPol) {
      if (predPol === 'pos' && actPol === 'pos') tp = n;
      else if (predPol === 'pos' && actPol === 'neg') fp = n;
      else if (predPol === 'neg' && actPol === 'pos') fn = n;
      else if (predPol === 'neg' && actPol === 'neg') tn = n;
      continue;
    }
  }

  // If we only have some cells, still compute what we can
  const counts: Record<string, number | undefined> = { tp, fp, fn, tn };
  const present = Object.values(counts).filter(v => typeof v === 'number') as number[];
  if (present.length === 0) return null;

  const total = (tp || 0) + (fp || 0) + (fn || 0) + (tn || 0);
  const positiveCases = (tp || 0) + (fn || 0);

  const result: Partial<SimulationParams> = {};
  if (total > 0) result.totalPatients = total;
  if (positiveCases > 0) result.positiveCases = positiveCases;
  if (typeof tp === 'number') result.truePositives = tp;
  if (typeof fp === 'number') result.falsePositives = fp;

  return result;
};
