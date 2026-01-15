
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  actions?: React.ReactNode; 
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  titleClassName = "text-xl sm:text-2xl font-bold text-slate-800", 
  actions,
  ...rest 
}) => {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8 transition-all duration-300 hover:shadow-md ${className}`} 
      {...rest}
    >
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b border-slate-100 gap-4 sm:gap-0">
          {title && <h3 className={`${titleClassName} font-display leading-tight`}>{title}</h3>}
          {actions && <div className="flex space-x-3 self-end sm:self-auto">{actions}</div>}
        </div>
      )}
      <div className="fade-in">
        {children}
      </div>
    </div>
  );
};