import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-primary hover:bg-brand-secondary text-dark-bg shadow-sm hover:shadow-brand-primary/20",
    secondary: "bg-dark-elevated border border-dark-border hover:border-brand-primary/50 text-text-primary",
    danger: "bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-dark-elevated"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
