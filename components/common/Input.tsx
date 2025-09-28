import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', leftIcon, ...props }) => {
  const hasError = !!error;
  return (
    <div className={`mb-5 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* FIX: Cast leftIcon to ensure it's a ReactElement that can accept className */}
            {React.cloneElement(leftIcon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 text-slate-400"})}
          </div>
        )}
        <input
          id={id}
          className={`block w-full px-4 py-2.5 border ${hasError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'} 
                     rounded-lg shadow-sm focus:outline-none sm:text-sm transition-colors duration-150 ease-in-out
                     ${leftIcon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
};