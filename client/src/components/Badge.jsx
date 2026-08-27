import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    success: "bg-status-success/10 text-status-success border-status-success/20",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
    danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
    info: "bg-status-info/10 text-status-info border-status-info/20",
    primary: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    neutral: "bg-dark-elevated text-text-secondary border-dark-border"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
