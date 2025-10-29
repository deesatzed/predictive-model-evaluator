import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { Introduction } from './components/Introduction';
import { Simulator } from './components/Simulator';
import { GeminiAnalysis } from './components/GeminiAnalysis';
import { ScenarioInput } from './components/ScenarioInput';
import { analyzeClinicalImpact, analyzeMoreStats, parseScenario, getModelInfo } from './services/llmRouter';
import type { SimulationParams } from './types';
import { Card } from './components/ui/Card';
import { VendorClaimEvaluator } from './components/VendorClaimEvaluator';
import { ImpactSummary } from './components/ImpactSummary';
import { ClinicalTradeoffs } from './components/ClinicalTradeoffs';
import { AUROCTrap } from './components/AUROCTrap';

const App: React.FC = () => {
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    totalPatients: 1000,
    positiveCases: 10,
    truePositives: 8,
    falsePositives: 50,
    cohortSize: 1000,
    dailyCapacity: 40,
    workdaysPerWeek: 5,
    slaDays: 10,
    horizonDays: 365,
  });
  
  const [userContext, setUserContext] = useState<string>('');

  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [moreStatsResult, setMoreStatsResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analysisModelInfo, setAnalysisModelInfo] = useState<{ provider: string; model?: string; at?: string } | undefined>(undefined);

  useEffect(() => {
    try {
      const savedParams = localStorage.getItem('aiprc:simulationParams');
      if (savedParams) {
        const parsed = JSON.parse(savedParams);
        setSimulationParams(prev => ({ ...prev, ...parsed }));
      }
      const savedContext = localStorage.getItem('aiprc:userContext');
      if (savedContext) setUserContext(savedContext);
    } catch {}
    // Fetch global server settings (provider/model) and persist to localStorage for this client
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          if (json?.provider) localStorage.setItem('aiprc:llmProvider', String(json.provider));
          if (json?.model) localStorage.setItem('aiprc:openrouterModel', String(json.model));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('aiprc:simulationParams', JSON.stringify(simulationParams));
    } catch {}
  }, [simulationParams]);

  const handleNewScenario = useCallback(() => {
    try {
      localStorage.removeItem('aiprc:simulationParams');
      localStorage.removeItem('aiprc:userContext');
    } catch {}
    setSimulationParams({
      totalPatients: 1000,
      positiveCases: 10,
      truePositives: 8,
      falsePositives: 50,
      cohortSize: 1000,
      dailyCapacity: 40,
      workdaysPerWeek: 5,
      slaDays: 10,
      horizonDays: 365,
    });
    setUserContext('');
    setAnalysisResult('');
    setMoreStatsResult('');
    setError(null);
    try { window.location.reload(); } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('aiprc:userContext', userContext);
    } catch {}
  }, [userContext]);

  const derivedMetrics = useMemo(() => {
    const { totalPatients, positiveCases, truePositives, falsePositives } = simulationParams;
    const negativeCases = totalPatients - positiveCases;
    const falseNegatives = positiveCases - truePositives;
    const trueNegatives = negativeCases - falsePositives;
    
    const precision = (truePositives + falsePositives > 0) ? (truePositives / (truePositives + falsePositives)) : 0;
    const recall = (positiveCases > 0) ? (truePositives / positiveCases) : 0;
    const specificity = negativeCases > 0 ? (trueNegatives / negativeCases) : 0;

    return { negativeCases, falseNegatives, trueNegatives, precision, recall, specificity };
  }, [simulationParams]);

  const handleParamsChange = (newParams: Partial<SimulationParams>) => {
    setSimulationParams(prev => ({ ...prev, ...newParams }));
  };

  const handleSelectPreset = useCallback((preset: any) => {
    if (preset?.params) {
      setSimulationParams(prev => ({ ...prev, ...preset.params }));
    }
    if (preset?.context) {
      setUserContext(preset.context);
    }
  }, []);

  const handleParseScenario = useCallback(async () => {
    setIsParsing(true);
    setError(null);
    try {
      const parsedParams = await parseScenario(userContext);
      // Ensure we don't get NaN or invalid values
      const validParams: Partial<SimulationParams> = {};
      if (parsedParams.totalPatients && !isNaN(parsedParams.totalPatients)) validParams.totalPatients = parsedParams.totalPatients;
      if (parsedParams.positiveCases && !isNaN(parsedParams.positiveCases)) validParams.positiveCases = parsedParams.positiveCases;
      if (parsedParams.truePositives && !isNaN(parsedParams.truePositives)) validParams.truePositives = parsedParams.truePositives;
      if (parsedParams.falsePositives && !isNaN(parsedParams.falsePositives)) validParams.falsePositives = parsedParams.falsePositives;
      if (parsedParams.cohortSize && !isNaN(parsedParams.cohortSize)) validParams.cohortSize = parsedParams.cohortSize;
      if (parsedParams.dailyCapacity && !isNaN(parsedParams.dailyCapacity)) validParams.dailyCapacity = parsedParams.dailyCapacity;
      if (parsedParams.workdaysPerWeek && !isNaN(parsedParams.workdaysPerWeek)) validParams.workdaysPerWeek = parsedParams.workdaysPerWeek;
      if (parsedParams.slaDays && !isNaN(parsedParams.slaDays)) validParams.slaDays = parsedParams.slaDays;
      if (parsedParams.horizonDays && !isNaN(parsedParams.horizonDays)) validParams.horizonDays = parsedParams.horizonDays;

      setSimulationParams(prev => ({ ...prev, ...validParams }));
    } catch (err) {
      console.error(err);
      setError('Could not parse the scenario. Please ensure all key numbers are included in the text.');
    } finally {
      setIsParsing(false);
    }
  }, [userContext]);

  const handleAnalyzeClick = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisResult('');
    setMoreStatsResult(prev => prev);
    setError(null);
    try {
      const info = getModelInfo();
      setAnalysisModelInfo({ provider: info.provider, model: info.model, at: new Date().toISOString() });
      const result = await analyzeClinicalImpact({ ...simulationParams, userContext });
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please check the console for details.');
      setAnalysisResult('An error occurred. Please check the console for more details.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [simulationParams, userContext]);

  const handleAnalyzeMoreClick = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const info = getModelInfo();
      setAnalysisModelInfo({ provider: info.provider, model: info.model, at: new Date().toISOString() });
      const result = await analyzeMoreStats({ ...simulationParams });
      setMoreStatsResult(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred during more-stats analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [simulationParams]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} onNewScenario={handleNewScenario} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <main className="max-w-screen-2xl mx-auto p-4 md:p-8">
        <Introduction />
        
        <Card className="mt-8">
          <ScenarioInput 
            userContext={userContext}
            setUserContext={setUserContext}
            onParse={handleParseScenario}
            isParsing={isParsing}
            onSelectPreset={handleSelectPreset}
          />
        </Card>
        
        {error && 
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-r-lg">
                <p><strong className="font-bold">Error:</strong> {error}</p>
            </div>
        }

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-3">
            <Simulator
              params={simulationParams}
              derivedMetrics={derivedMetrics}
              onParamsChange={handleParamsChange}
            />
            <div className="mt-4">
              <ImpactSummary params={simulationParams} derived={derivedMetrics} />
            </div>
          </div>
          <div className="lg:col-span-3">
            <VendorClaimEvaluator
              sensitivity={derivedMetrics.recall}
              specificity={derivedMetrics.specificity}
              prevalence={simulationParams.positiveCases / simulationParams.totalPatients}
              totalPatients={simulationParams.totalPatients}
            />
            <div className="mt-4">
              <ClinicalTradeoffs 
                totalPatients={simulationParams.totalPatients}
                positiveCases={simulationParams.positiveCases}
                truePositives={simulationParams.truePositives}
                falsePositives={simulationParams.falsePositives}
                falseNegatives={derivedMetrics.falseNegatives}
              />
            </div>
            <div className="mt-4">
              <AUROCTrap
                truePositives={simulationParams.truePositives}
                falsePositives={simulationParams.falsePositives}
                trueNegatives={derivedMetrics.trueNegatives}
                falseNegatives={derivedMetrics.falseNegatives}
                totalPatients={simulationParams.totalPatients}
                positiveCases={simulationParams.positiveCases}
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <GeminiAnalysis
            onAnalyze={handleAnalyzeClick}
            onAnalyzeMore={handleAnalyzeMoreClick}
            isLoading={isAnalyzing}
            result={analysisResult}
            moreResult={moreStatsResult}
            modelInfo={analysisModelInfo}
            operationalActive={Boolean(simulationParams.dailyCapacity && simulationParams.slaDays)}
          />
        </div>
        <footer className="text-center mt-12 text-sm text-slate-500">
            <p>Built to clarify the clinical impact of predictive models.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;