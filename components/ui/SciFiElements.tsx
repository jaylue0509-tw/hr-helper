import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-2xl relative overflow-hidden";
  
  const sizeStyles = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-8 py-3.5"
  };

  const variants = {
    // Glassy gradient for primary
    primary: "bg-gradient-to-br from-[#007AFF] to-[#0055B3] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 border border-white/20",
    // Frosted glass for secondary
    secondary: "bg-white/40 backdrop-blur-md text-[#1D1D1F] hover:bg-white/60 border border-white/50 shadow-sm",
    danger: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200",
    ghost: "bg-transparent text-gray-500 hover:text-[#1D1D1F] hover:bg-white/20"
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Glossy reflection effect */}
      {variant === 'primary' && <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; subtitle?: string }> = ({ 
  children, 
  className = '',
  title,
  subtitle
}) => {
  return (
    <div className={`glass-panel rounded-3xl p-6 md:p-8 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:border-white/80 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6 relative z-10">
          {title && <h3 className="text-xl font-bold tracking-wide text-[#1D1D1F] drop-shadow-sm">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>}
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className={`w-full bg-white/40 backdrop-blur-sm border border-white/50 text-[#1D1D1F] px-4 py-3 rounded-2xl focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50 transition-all placeholder:text-gray-400 shadow-inner ${props.className}`}
    />
  );
};
