import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SparklesIcon } from './icons/SparklesIcon';

interface GeminiAnalysisProps {
    onAnalyze: () => void;
    onAnalyzeMore?: () => void;
    isLoading: boolean;
    result: string;
    moreResult?: string;
    modelInfo?: { provider: string; model?: string; at?: string };
    operationalActive?: boolean;
}

const LoadingSpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 rounded-full animate-pulse bg-sky-400"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-sky-400" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-sky-400" style={{ animationDelay: '0.4s' }}></div>
    <span className="text-slate-600 dark:text-slate-300">{label || 'Model is thinking...'}</span>
  </div>
);

export const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ onAnalyze, onAnalyzeMore, isLoading, result, moreResult, modelInfo, operationalActive }) => {
    const [view, setView] = React.useState<'memo' | 'more'>('memo');
    const sanitize = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const blocked = ['script','style','iframe','object','embed','link','meta'];
        blocked.forEach(t => doc.querySelectorAll(t).forEach(n => n.remove()));
        doc.querySelectorAll('*').forEach(el => {
            [...el.attributes].forEach(attr => {
                const n = attr.name.toLowerCase();
                const v = attr.value.toLowerCase();
                if (n.startsWith('on') || v.startsWith('javascript:')) el.removeAttribute(attr.name);
            });
        });
        return doc.body.innerHTML;
    };
    
    // Improved markdown to HTML conversion
    const formatResult = (text: string) => {
        let html = text;
        // Process lists first to avoid conflicts with line breaks
        html = html.replace(/^\s*\n/gm, ''); // remove empty lines
        html = html.replace(/^\* (.*$)/gim, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>');
        html = html.replace(/^\d+\. (.*$)/gim, '<ol class="list-decimal list-inside ml-4"><li>$1</li></ol>');
        html = html.replace(/<\/ul>\s?<ul>/g, '');
        html = html.replace(/<\/ol>\s?<ol>/g, '');
        
        // Then other elements
        html = html
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-slate-50">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br />');

        // Clean up <br> inside list items from the previous replace
        html = html.replace(/<li><br \/>/g, '<li>');
        html = html.replace(/<br \/><\/li>/g, '</li>');
        return sanitize(html);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
        } catch {}
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Card className="h-full flex flex-col">
            <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Step 3: Generate In-Depth Report</h3>
                        <p className="text-sm text-slate-500 mt-1">Generate a memo for stakeholders based on the final numbers.</p>
                        {modelInfo && (
                          <div className="text-xs text-slate-500 mt-1">
                            Using: <span className="font-medium">{modelInfo.provider}</span>{modelInfo.model ? ` (${modelInfo.model})` : ''}{modelInfo.at ? ` • ${new Date(modelInfo.at).toLocaleString()}` : ''}
                          </div>
                        )}
                        {typeof operationalActive !== 'undefined' && (
                          <div className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded mt-1 ${operationalActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                            Operational Fit: {operationalActive ? 'On' : 'Off'}
                          </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => { setView('memo'); onAnalyze(); }} disabled={isLoading}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Analyzing...' : 'Generate Report'}
                        </Button>
                        <Button variant="outline" onClick={() => { setView('more'); onAnalyzeMore?.(); }} disabled={isLoading}>More Stats</Button>
                        <Button variant="ghost" onClick={() => setView(v => v === 'memo' ? 'more' : 'memo')}>
                          {view === 'memo' ? 'Show More Stats' : 'Show Memo'}
                        </Button>
                        <Button variant="outline" onClick={handleCopy} disabled={!result || isLoading}>Copy</Button>
                        <Button variant="ghost" onClick={handlePrint} disabled={isLoading}>Print</Button>
                    </div>
                </div>

                <div className="mt-6 flex-grow rounded-lg bg-slate-100 dark:bg-slate-800/50 p-4 min-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                           <LoadingSpinner label={modelInfo ? `${modelInfo.provider} is thinking...` : 'Model is thinking...'} />
                        </div>
                    ) : (
                        view === 'memo' ? (
                            result ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatResult(result) }}></div>
                            ) : (
                                <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                    <SparklesIcon className="w-10 h-10 mb-4 text-slate-400" />
                                    <h4 className="font-semibold">Ready for Analysis</h4>
                                    <p>Click "Generate Report" to create the memo.</p>
                                </div>
                            )
                        ) : (
                            moreResult ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatResult(moreResult) }}></div>
                            ) : (
                                <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                    <SparklesIcon className="w-10 h-10 mb-4 text-slate-400" />
                                    <h4 className="font-semibold">More Stats</h4>
                                    <p>Click "More Stats" to generate the statistical detail.</p>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>
        </Card>
    );
};