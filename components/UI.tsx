
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info';
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  variant = 'primary', 
  children, 
  icon: Icon, 
  className = '',
  disabled = false
}) => {
  const baseStyles = "touch-target w-full rounded-2xl flex items-center justify-center font-bold text-lg px-6 py-4 shadow-sm active:scale-95 transition-all";
  const variants = {
    primary: "bg-green-700 text-white hover:bg-green-800",
    secondary: "bg-white text-slate-800 border-2 border-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-orange-500 text-white hover:bg-orange-600",
    info: "bg-blue-600 text-white hover:bg-blue-700"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {Icon && <Icon className="mr-3" />}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; borderColor?: string }> = ({ 
  children, 
  className = '', 
  borderColor = 'transparent' 
}) => (
  <div 
    className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${className}`}
    style={{ borderLeftColor: borderColor }}
  >
    {children}
  </div>
);

export const Header: React.FC<{ title: string; subtitle?: string; onBack?: () => void; rightElement?: React.ReactNode }> = ({ 
  title, 
  subtitle, 
  onBack, 
  rightElement 
}) => (
  <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-40">
    <div className="flex items-center">
      {onBack && (
        <button onClick={onBack} className="mr-3 p-2 text-slate-600">
          <span className="text-2xl">←</span>
        </button>
      )}
      <div>
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {rightElement}
  </div>
);
