import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
  const hasError = !!error;
  return (
    <div className={`mb-5 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea
        id={id}
        rows={props.rows || 6}
        className={`block w-full px-4 py-2.5 border ${hasError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'} 
                   rounded-lg shadow-sm focus:outline-none sm:text-sm transition-colors duration-150 ease-in-out ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
};