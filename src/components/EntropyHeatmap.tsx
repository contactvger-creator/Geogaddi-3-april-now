import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X } from 'lucide-react';

interface EntropyHeatmapProps {
  input: string;
}

const EntropyHeatmap: React.FC<EntropyHeatmapProps> = ({ input }) => {
  const [showInfo, setShowInfo] = useState(false);
  const grid = useMemo(() => {
    // Generate a 12x12 grid of "complexity cells"
    const cells = [];
    const seed = input.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Character variety factors
    const hasUpper = /[A-Z]/.test(input);
    const hasLower = /[a-z]/.test(input);
    const hasNumber = /[0-9]/.test(input);
    const hasSpecial = /[^A-Za-z0-9]/.test(input);
    const varietyCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    for (let i = 0; i < 144; i++) {
      const noise = Math.sin(i * 0.5 + seed * 0.1) * 0.2 + 0.1;
      const inputInfluence = input.length > 0 ? (input.charCodeAt(i % input.length) % 10) / 10 : 0;
      
      let intensity = noise + (inputInfluence * 0.5);
      if (input.length > 0) {
        intensity *= (input.length / 10); 
        intensity *= (varietyCount / 2);
      }
      
      cells.push(Math.min(1, intensity));
    }
    return cells;
  }, [input]);

  const getHeatColor = (intensity: number) => {
    if (intensity < 0.1) return 'bg-nasa-blue shadow-[0_0_5px_rgba(0,51,153,0.5)]';
    if (intensity < 0.3) return 'bg-accent-blue shadow-[0_0_10px_rgba(0,102,255,0.6)]';
    if (intensity < 0.5) return 'bg-telemetry-green shadow-[0_0_15px_rgba(0,255,65,0.7)]';
    if (intensity < 0.7) return 'bg-amber shadow-[0_0_20px_rgba(255,184,0,0.8)]';
    return 'bg-nasa-red shadow-[0_0_25px_rgba(252,61,33,0.9)] animate-pulse';
  };

  return (
    <div className="nasa-panel flex flex-col relative overflow-hidden aspect-square shrink-0 z-10 border-2 border-accent-blue/30 bg-black max-h-full">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 flex items-center justify-center p-8 opacity-100">
        <div className="grid grid-cols-12 gap-0.5 w-full aspect-square">
          {grid.map((intensity, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ 
                opacity: 0.6 + (intensity * 0.4),
                scale: 0.9 + (intensity * 0.1),
                filter: intensity > 0.5 ? `brightness(${1 + intensity}) saturate(${1 + intensity})` : 'none'
              }}
              transition={{ duration: 0.3 }}
              className={`w-full h-full rounded-[1px] ${getHeatColor(intensity)}`}
            />
          ))}
        </div>
      </div>
      
      {/* HUD UI Layer - Overlay */}
      <div className="relative z-20 flex flex-col h-full p-[var(--spacing-phi-2)] pointer-events-none">
        <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-0.5 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 bg-nasa-red shadow-[0_0_8px_#fc3d21]" />
            <span className="text-[11px] font-mono text-white font-bold uppercase tracking-wider">Entropy Heatmap HUD</span>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-white/20 hover:text-royal-blue transition-colors ml-1"
            >
              <HelpCircle size={10} />
            </button>
          </div>
          <span className="text-[8px] font-mono text-telemetry-green uppercase animate-pulse font-bold">● SCANNING</span>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-10 left-4 right-4 z-50 bg-black/95 border border-royal-blue/30 p-3 shadow-2xl rounded-sm text-[9px] font-mono leading-relaxed pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-royal-blue font-bold uppercase tracking-tighter">Heatmap Diagnostics</span>
                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white"><X size={12}/></button>
              </div>
              <p className="text-white/70">
                Measures the <span className="text-royal-blue">Complexity Matrix</span> of the input stream. 
                <span className="text-nasa-red font-bold"> Red Strobe</span> indicates high password strength / variety, 
                while <span className="text-nasa-blue">Blue Shadowing</span> represents predictable patterns.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1" />
        
        <div className="flex justify-between items-center pt-1 border-t border-white/10 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">Vector Path</span>
            <span className="text-[11px] font-mono text-telemetry-green font-bold">
              [{Math.floor(grid.reduce((a,b) => a+b, 0)).toString(16).toUpperCase().padStart(4, '0')}]
            </span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">Complexity Load</span>
            <span className="text-[11px] font-mono text-amber font-bold">
              {Math.floor(input.length * (grid.reduce((a,b) => a+b, 0) / 144) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Warning strobe if very low entropy */}
      {input.length > 0 && input.length < 6 && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-nasa-red shadow-[0_0_10px_#fc3d21] animate-pulse" />
      )}
    </div>
  );
};

export default EntropyHeatmap;
