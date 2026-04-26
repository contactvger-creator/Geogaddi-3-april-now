import React from 'react';

interface DashboardHeaderProps {
  onPanic?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onPanic }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-[var(--spacing-phi-3)] border-b border-white/10 gap-[var(--spacing-phi-3)] bg-space-black/40 backdrop-blur-md">
      <div className="flex items-center gap-[var(--spacing-phi-3)]">
        <div 
          onClick={onPanic}
          className="w-[var(--spacing-phi-1)] h-phi-4 bg-nasa-blue shadow-[0_0_15px_#003399] cursor-pointer hover:bg-nasa-red transition-colors" 
          title="PURGE SYSTEM (PANIC)"
        />
        <div>
          <h1 className="text-[var(--spacing-phi-4)] leading-none font-bold uppercase tracking-tighter drop-shadow-sm flex">
            {"Geogaddi".split('').map((letter, i) => (
              <span key={i} style={{ color: i % 2 === 0 ? '#FC3D21' : '#FF8C00' }}>
                {letter}
              </span>
            ))}
          </h1>
          <p className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            5120-BIT HARDENED STEGANOGRAPHY · NASA NHB 8071.1
            <span className="px-1.5 py-0.5 bg-instrument-blue/20 text-accent-blue border border-accent-blue/30 rounded-sm text-[8px] animate-pulse">HARDENED</span>
          </p>
        </div>
      </div>
      
      <div className="flex gap-[var(--spacing-phi-3)] items-center flex-wrap">
        <button 
          onClick={onPanic}
          className="px-3 py-1 bg-nasa-red/20 border border-nasa-red/40 text-nasa-red text-[10px] font-mono font-bold uppercase hover:bg-nasa-red hover:text-white transition-all shadow-[0_0_10px_rgba(252,61,33,0.2)]"
        >
          Purge (Panic)
        </button>
        <div className="flex items-center group">
          <span className="status-led led-caution animate-pulse shadow-[0_0_12px_#FFB800]" />
          <span className="text-[10px] font-mono text-amber font-bold uppercase tracking-wider group-hover:text-white transition-colors">Interface Heat</span>
        </div>
        <div className="flex items-center group">
          <span className="status-led led-nominal animate-pulse shadow-[0_0_12px_#00FF41]" />
          <span className="text-[10px] font-mono text-telemetry-green font-bold uppercase tracking-wider group-hover:text-white transition-colors">Nominal</span>
        </div>
        <div className="flex items-center group">
          <span className="status-led led-active shadow-[0_0_12px_#0066FF]" />
          <span className="text-[10px] font-mono text-accent-blue font-bold uppercase tracking-wider group-hover:text-white transition-colors">Encrypted</span>
        </div>
        <div className="flex items-center group">
          <span className="status-led led-nominal shadow-[0_0_12px_#00FF41]" />
          <span className="text-[10px] font-mono text-telemetry-green font-bold uppercase tracking-wider group-hover:text-white transition-colors">Channel 5 Secure</span>
        </div>
        <div className="hidden lg:flex items-center bg-white/5 px-[var(--spacing-phi-2)] py-[var(--spacing-phi-1)] border border-white/10 ring-1 ring-inset ring-white/5">
          <span className="text-[10px] font-mono text-white/40 uppercase mr-[var(--spacing-phi-1)]">Timechain:</span>
          <span className="text-[10px] font-mono text-white/90 font-medium leading-relaxed">
            {new Date().toISOString().slice(0, 19).replace('T', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
