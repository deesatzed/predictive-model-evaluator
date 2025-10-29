import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
    const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed";
    const variants: Record<string, string> = {
        primary: "text-white bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 border border-transparent",
        outline: "bg-transparent text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400",
        ghost: "bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent focus:ring-slate-400",
    };
    return (
        <button
            {...props}
            className={`${base} ${variants[variant]} ${className || ''}`}
        >
            {children}
        </button>
    );
};
