import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-md overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 ${className}`}>
            {children}
        </div>
    );
};
