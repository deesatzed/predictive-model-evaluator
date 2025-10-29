import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => {
    const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;
    const backgroundStyle = {
        background: `linear-gradient(to right, #38bdf8 ${percentage}%, #e2e8f0 ${percentage}%)`
    };
    const darkBackgroundStyle = {
        background: `linear-gradient(to right, #38bdf8 ${percentage}%, #475569 ${percentage}%)`
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-semibold rounded-full">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                style={document.documentElement.classList.contains('dark') ? darkBackgroundStyle : backgroundStyle}
            />
             <style>{`
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #0ea5e9;
                    border: 2px solid white;
                    border-radius: 50%;
                    cursor: pointer;
                    margin-top: -7px; /* Centers thumb on track */
                }
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #0ea5e9;
                    border: 2px solid white;
                    border-radius: 50%;
                    cursor: pointer;
                }
             `}</style>
        </div>
    );
};
