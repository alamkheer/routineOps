import React from 'react';

interface NavItemProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  mobile?: boolean;
}

export function NavItem({ active, icon, label, onClick, mobile = false }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-3 transition-all px-4 py-3 group overflow-hidden
        ${active ? 'text-cyan-system bg-surface-lvl3 border-l-2 border-cyan-system' : 'text-gray-500 hover:text-white hover:bg-surface-lvl2 border-l-2 border-transparent'}
        ${mobile ? 'flex-col gap-1 px-2 py-1 flex-1 border-l-0 border-t-2' : ''}
        ${mobile && active ? 'border-cyan-system border-t-2' : ''}
        ${mobile && !active ? 'border-transparent border-t-2' : ''}
      `}
    >
      <div className={`absolute inset-0 bg-cyan-system/5 transition-transform duration-300 translate-x-[-100%] ${active ? 'translate-x-0' : 'group-hover:translate-x-0'}`} />
      <span className="relative z-10">{icon}</span>
      <span className={`relative z-10 font-mono text-[10px] font-bold tracking-widest uppercase ${active ? '' : 'text-gray-600 group-hover:text-gray-300'}`}>
        {label}
      </span>
    </button>
  );
}
