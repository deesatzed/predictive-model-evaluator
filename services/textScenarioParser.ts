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

  // Capacity parsing (independent of confusion matrix)
  let dailyCapacity: number | undefined;
  let workdaysPerWeek: number | undefined;
  let slaDays: number | undefined;
  let cohortSize: number | undefined;
  let horizonDays: number | undefined;

  // daily capacity e.g., "42 per day", "42/day", "capacity 42 per day"
  {
    const m = text.match(/\b(\d{1,7})\s*(patients|cases)?\s*(?:per\s*day|\/\s*day)\b/);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v)) dailyCapacity = v;
    }
  }
  // explicit capacity label
  if (!dailyCapacity) {
    const m = text.match(/\bcapacity\s*[:=]?\s*(\d{1,7})\b.*?(?:per\s*day|\/\s*day)?/);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v)) dailyCapacity = v;
    }
  }

  // workdays per week: "weekdays only", "business days" => 5; or explicit number
  if (/\b(weekdays?\s*only|business\s*days?)\b/.test(text)) workdaysPerWeek = 5;
  if (!workdaysPerWeek) {
    const m = text.match(/\b(\d)\s*(?:work\s*days?|workdays?|days?)\s*per\s*week\b/);
    if (m) {
      const v = Number(m[1]);
      if (v >= 1 && v <= 7) workdaysPerWeek = v;
    }
  }
  if (!workdaysPerWeek && /\b7\s*days?\s*(a|per)\s*week\b/.test(text)) workdaysPerWeek = 7;

  // SLA days: "SLA 10 days", "within 10 days"
  {
    const m1 = text.match(/\bsla\b[^\d]*(\d{1,4})\s*days?/);
    const m2 = text.match(/\bwithin\s*(\d{1,4})\s*days?/);
    const pick = m1 || m2;
    if (pick) {
      const v = Number(pick[1]);
      if (Number.isFinite(v)) slaDays = v;
    }
  }

  // Cohort size: "cohort size 1000", "cohort 1000", "population 1000"
  {
    const m = text.match(/\b(cohort|population|outreach)\s*(size)?\s*[:=]?\s*(\d{1,12})\b/);
    if (m) {
      const v = Number(m[3]);
      if (Number.isFinite(v)) cohortSize = v;
    }
  }

  // Horizon: detect year/month/week
  if (/\b(1|one)\s*year\b/.test(text) || /\bfor\s*(the\s*)?year\b/.test(text)) horizonDays = 365;
  if (!horizonDays) {
    const mY = text.match(/\b(\d{1,2})\s*years?\b/);
    if (mY) horizonDays = Number(mY[1]) * 365;
  }
  if (!horizonDays) {
    const mM = text.match(/\b(\d{1,2})\s*months?\b/);
    if (mM) horizonDays = Number(mM[1]) * 30;
  }
  if (!horizonDays) {
    const mW = text.match(/\b(\d{1,2})\s*weeks?\b/);
    if (mW) horizonDays = Number(mW[1]) * 7;
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

  if (typeof dailyCapacity === 'number') result.dailyCapacity = dailyCapacity;
  if (typeof workdaysPerWeek === 'number') result.workdaysPerWeek = workdaysPerWeek;
  if (typeof slaDays === 'number') result.slaDays = slaDays;
  if (typeof cohortSize === 'number') result.cohortSize = cohortSize;
  if (typeof horizonDays === 'number') result.horizonDays = horizonDays;

  return result;
};
