import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant: 'red' | 'yellow' | 'blue' | 'all';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, variant, onClick }) => {
  return (
    <div className={`stat-card ${variant}`} onClick={onClick}>
      <div className="stat-icon">
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  );
};
