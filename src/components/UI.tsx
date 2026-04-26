import React from 'react';

export const Frame = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`frosted-card p-5 relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 bg-white/5 border-b border-r border-white/10 px-3 py-1 font-mono text-[9px] text-slate-400 uppercase tracking-widest">
      {title}
    </div>
    <div className="pt-4">
      {children}
    </div>
  </div>
);

export const StatusChip = ({ status, type = 'INFO' }: { status: string; type?: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' }) => {
  const colors = {
    INFO: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    WARN: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    ERROR: 'bg-red-500/10 border-red-500/30 text-red-400',
    SUCCESS: 'bg-green-500/10 border-green-500/30 text-green-400'
  };
  
  return (
    <div className={`border px-2.5 py-1 rounded-lg font-mono text-[10px] flex items-center gap-2 uppercase font-bold ${colors[type]}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${type === 'ERROR' ? 'animate-pulse' : ''}`} />
      {status}
    </div>
  );
};

export const Button = ({ children, variant = 'primary', onClick, className = "" }: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'critical' | 'ghost'; 
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) => {
  const styles = {
    primary: 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg glow-orange',
    secondary: 'bg-slate-900/50 backdrop-blur-md border border-slate-700/50 text-blue-400',
    critical: 'bg-red-600 text-white hover:bg-red-500 shadow-lg glow-red',
    ghost: 'text-slate-400 hover:text-white border border-transparent'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-tight transition-all active:scale-95 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const TerminalInput = ({ label, placeholder, value, onChange }: { 
  label: string; 
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-sm text-white focus:ring-1 focus:ring-orange-500/50 focus:outline-none placeholder:text-slate-600"
      />
    </div>
  </div>
);
