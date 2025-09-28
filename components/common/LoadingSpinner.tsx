import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. text-sky-600
  // FIX: Add className to props
  className?: string; 
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-sky-600', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5', // Aumentado ligeiramente
    md: 'w-10 h-10', // Aumentado ligeiramente
    lg: 'w-14 h-14', // Aumentado ligeiramente
  };

  return (
    // FIX: Apply className to the outer div
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-4 border-transparent ${sizeClasses[size]} ${color}`}
        style={{
          borderTopColor: 'currentColor',
          borderRightColor: 'currentColor', // Adiciona cor a mais um lado para um efeito visual diferente
          animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', // Suaviza a animação
        }}
        role="status"
        aria-label="Carregando..."
      ></div>
    </div>
  );
};