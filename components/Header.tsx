import React from 'react';

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v1.71a2.5 2.5 0 0 1-2.05 2.45l-.2.06A2.5 2.5 0 0 1 7.5 11H7a2.5 2.5 0 0 1-2.5-2.5S4.5 2 9.5 2z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v1.71a2.5 2.5 0 0 0 2.05 2.45l.2.06A2.5 2.5 0 0 0 16.5 11H17a2.5 2.5 0 0 0 2.5-2.5S19.5 2 14.5 2z" />
        <path d="M12 12v10" />
        <path d="M9.5 11a2.5 2.5 0 0 0-2.5 2.5v0A2.5 2.5 0 0 0 9.5 16h0" />
        <path d="M14.5 11a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h0" />
    </svg>
);


export const Header: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
    return (
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <BrainIcon />
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Clinical Model Impact Simulator
                        </h1>
                    </div>
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={onOpenSettings}
                            className="px-3 py-1.5 text-sm rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            Settings
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
