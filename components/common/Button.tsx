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
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ease-in-out duration-200 flex items-center justify-center shadow-sm hover:shadow-md";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white focus:ring-sky-500",
    secondary: "bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-sky-100 text-sky-700 focus:ring-sky-500 shadow-none hover:shadow-none",
    outline: "bg-transparent border-2 border-sky-600 text-sky-700 hover:bg-sky-50 focus:ring-sky-500 shadow-none hover:shadow-sm",
    link: "bg-transparent text-sky-600 hover:text-sky-700 hover:underline focus:ring-sky-500 shadow-none hover:shadow-none p-0", // Added link variant
  };

  const sizeStyles = {
    sm: "px-3.5 py-2 text-xs", 
    md: "px-5 py-2.5 text-sm", 
    lg: "px-7 py-3 text-base", 
  };

  // Adjust padding for link variant if needed, or rely on its intrinsic padding (p-0 for now)
  const currentSizeStyles = variant === 'link' ? (size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base') : sizeStyles[size];


  const disabledStyles = "opacity-60 cursor-not-allowed shadow-none hover:shadow-none";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${variant === 'link' ? '' : baseStyles} ${variantStyles[variant]} ${currentSizeStyles} ${isLoading || props.disabled ? disabledStyles : ''} ${widthStyles} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-sky-600'} />
      ) : (
        <>
          {leftIcon && <span className={`mr-2 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}>{leftIcon}</span>}
          <span className={variant === 'link' ? '' : "mx-1"}>{children}</span>
          {rightIcon && <span className={`ml-2 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};