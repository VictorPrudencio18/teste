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
  titleClassName = "text-2xl font-semibold text-slate-800", 
  actions,
  ...rest 
}) => {
  return (
    <div 
      className={`bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl p-6 sm:p-8 ${className}`} 
      {...rest}
    >
      {(title || actions) && (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          {title && <h3 className={`${titleClassName} font-display`}>{title}</h3>}
          {actions && <div className="flex space-x-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};