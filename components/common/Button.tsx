
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = "font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center active:scale-95 disabled:active:scale-100";
  
  const variantStyles = {
    primary: "bg-gradient-to-br from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg focus:ring-sky-500 border border-transparent",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:ring-red-500 hover:border-red-300",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-sky-700 focus:ring-sky-500",
    outline: "bg-white border-2 border-sky-100 text-sky-700 hover:border-sky-500 hover:bg-sky-50 focus:ring-sky-500",
    link: "bg-transparent text-sky-600 hover:text-sky-800 underline-offset-4 hover:underline focus:ring-sky-500 p-0 shadow-none active:scale-100", 
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs sm:text-sm", 
    md: "px-5 py-2.5 text-sm sm:text-base", 
    lg: "px-6 py-3.5 text-base sm:text-lg", 
  };

  const currentSizeStyles = variant === 'link' ? (size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base') : sizeStyles[size];
  const disabledStyles = "opacity-50 cursor-not-allowed shadow-none hover:shadow-none grayscale";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${variant === 'link' ? '' : baseStyles} ${variantStyles[variant]} ${currentSizeStyles} ${isLoading || props.disabled ? disabledStyles : ''} ${widthStyles} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" color={variant === 'primary' ? 'text-white' : 'text-sky-600'} />
      ) : (
        <>
          {leftIcon && <span className={`mr-2 flex-shrink-0 ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}>{leftIcon}</span>}
          <span className={variant === 'link' ? '' : "mx-0.5 truncate"}>{children}</span>
          {rightIcon && <span className={`ml-2 flex-shrink-0 ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};