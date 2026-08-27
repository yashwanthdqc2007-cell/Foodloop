import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, description, highlight = false }) => {
  return (
    <div className={`rounded-2xl p-6 flex flex-col justify-between border ${highlight ? 'bg-dark-elevated border-brand-primary/30 shadow-lg shadow-brand-primary/5' : 'bg-dark-card border-dark-border shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-extrabold mt-2 ${highlight ? 'text-brand-primary' : 'text-text-primary'}`}>{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${highlight ? 'bg-brand-primary/10 text-brand-primary' : 'bg-dark-elevated text-text-secondary border border-dark-border'}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {description && <div className="mt-4 text-sm text-text-secondary">{description}</div>}
    </div>
  );
};
