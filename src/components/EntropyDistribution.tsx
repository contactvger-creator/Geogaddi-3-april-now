import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RuttEtraScan } from './RuttEtraScan';
import { SpectralWaterfall } from './SpectralWaterfall';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Cpu, Activity, Zap, HelpCircle, TrendingUp, BarChart2, Layers } from 'lucide-react';

interface EntropyDistributionProps {
  entropyData: number[]; // Expecting a long array of bit data
  isLocked?: boolean;
}

type ViewMode = 'GRID' | 'HILLS' | 'WATERFALL';

const NODE_CONFIG = [
  { id: 1, label: "[S-BOX DIFFUSION]", math: "SUB_BYTES: GF(2^8)\nσ(x) = inverse(x) ⊕ 0x63" },
  { id: 2, label: "[GALOIS FIELD Σ]", math: "FIELD: POLY_X8\nΣ_HASH: 0xC710" },
  { id: 3, label: "[BIT-PLANE PERM]", math: "TRANSPOSE: INVERSE\nδ_PERM: 0.4655" },
  { id: 4, label: "[KEY SCHED MATRIX]", math: "EXPANSION: 14_ROUNDS\nRCON: [01, 02, 04...]" },
  { id: 5, label: "[AVALANCHE DELTA]", math: "DIST: HAMMING\nΔ_FLIP: 51 bits" },
  { id: 6, label: "[STATE ENTROPY]", math: "SHANNON: H(X)\nΣ_BITS: 1024" },
  { id: 7, label: "[PARITY DRIFT]", math: "DRYSET: VALID\nSEQ_CHECK: ODD" },
  { id: 8, label: "[ROUND CONSTANTS]", math: "ITER: 0x0E\nCONST: AES_S" },
  { id: 9, label: "[SUPERSTRING Σ]", math: "GEOGADDI: MANIFOLD\nψ_COORD: 0.77182" },
];

const EntropyDistribution: React.FC<EntropyDistributionProps> = ({ entropyData, isLocked = false }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (expandedIndex === null) return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setExpandedIndex(prev => prev === null ? null : (prev % 9) + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setExpandedIndex(prev => prev === null ? null : (prev === 1 ? 9 : prev - 1));
      } else if (e.key === 'Escape') {
        setExpandedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Process the entropy data into distinct, unique datasets for the 9 nodes
  const hasData = entropyData && entropyData.length > 0;

  // Utility to derive a color based on data characteristics
  const deriveColor = useCallback((chunk: number[], seed: number) => {
    if (!hasData) return "#333333";
    
    // Aesthetic Spectrogram palette (Cool to Warm)
    const palette = [
      "#0033FF", // Deep Blue
      "#00CCFF", // Cyan
      "#00FF66", // Green
      "#CCFF00", // Lime
      "#FFCC00", // Yellow
      "#FF3300"  // Red
    ];

    if (isLocked) {
      return seed % 2 === 0 ? "#FF3300" : "#FF6600";
    }
    
    const colorMap = [0, 1, 2, 3, 4, 5, 0, 1, 2];
    return palette[colorMap[(seed - 1) % 9]];
  }, [hasData, isLocked]);

  // Utility to transform data uniquely for each algorithm node
  const getTransformedChunk = useCallback((seed: number) => {
    if (!hasData) {
      // Return a uniform baseline when idle
      return Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.1) * 0.02 + 0.1);
    }
    
    // Ensure we have enough data by repetition if needed (shouldn't happen with full clay)
    const sourceData = entropyData.length < 128 
      ? [...entropyData, ...entropyData, ...entropyData, ...entropyData] 
      : entropyData;

    const size = 64;
    const offset = Math.abs(seed * 73) % (sourceData.length - size);
    let chunk = sourceData.slice(offset, offset + size);

    // Apply specific "algorithmic" transformations based on which node it represents
    return chunk.map((val, i) => {
      // Normalize val (-2 to 2) to (0 to 1) for consistent switch logic
      const n = (val + 2) / 4;
      
      switch(seed) {
        case 1: // S-BOX DIFFUSION: Highly irregular sparse spikes
          return (Math.sin(n * 200 + i) > 0.8) ? (n * 1.5) : 0.1;
        case 2: // GALOIS FIELD Σ: Jagged blocky geometric
          return (Math.floor(n * 4) + (i % 2)) / 5;
        case 3: // BIT-PLANE PERM: Alternating phase-shifted pulses
          return Math.abs(Math.sin(i * 0.5 + n * 10)) * (i % 2 === 0 ? 1 : 0.5);
        case 4: // KEY SCHED MATRIX: Dense matrix-like lattice
          return (Math.sin(i * 10) * Math.cos(n * 10) + 1) / 2;
        case 5: // AVALANCHE DELTA: Exponential "explosion" patterns
          return Math.pow(Math.abs(n - 0.5) * 2, 6) * 1.5;
        case 6: // STATE ENTROPY: Chaos / perlin-like noise
          return n * (0.5 + Math.sin(i * n * 5) * 0.5);
        case 7: // PARITY DRIFT: Smooth but drifting sinusoids
          return Math.sin(i * 0.2 + n * 20) * 0.4 + 0.5;
        case 8: // ROUND CONSTANTS: Strict repetitive sawtooth
          return ((n * 10 + i) % 4) / 4;
        case 9: // SUPERSTRING Σ: Multi-harmonic interference
          return (Math.sin(n * 5) + Math.cos(i * 0.3) + Math.sin(i * 0.1)) / 3 + 0.5;
        default:
          return n;
      }
    });
  }, [entropyData, hasData]);

  return (
    <div className="nasa-panel p-[var(--spacing-phi-2)] flex flex-col gap-2 relative bg-black border-2 border-white/10 h-full w-full max-w-5xl mx-auto overflow-visible shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center border-b border-white/20 pb-1 flex-shrink-0 relative z-[40]">
        <div className="flex items-center gap-1.5 font-mono">
          <div className={`w-1 h-3 shadow-[0_0_8px_currentColor] ${!hasData ? 'bg-white/20' : isLocked ? 'bg-telemetry-green' : 'bg-nasa-red'}`} />
          <span className="text-[10px] text-white/70 uppercase tracking-widest whitespace-nowrap">
            SIGNALS: SPECTRAL_FIELD_SCAN [Σ-1024]
          </span>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="text-white/20 hover:text-telemetry-green transition-colors ml-1"
          >
            <HelpCircle size={10} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setViewMode('GRID')}
            className={`p-1 rounded transition-colors ${viewMode === 'GRID' ? 'bg-telemetry-green text-black' : 'text-white/40 hover:bg-white/5'}`}
            title="Grid Waveforms"
          >
            <Activity size={12} />
          </button>
          <button 
            onClick={() => setViewMode('HILLS')}
            className={`p-1 rounded transition-colors ${viewMode === 'HILLS' ? 'bg-telemetry-green text-black' : 'text-white/40 hover:bg-white/5'}`}
            title="Spectral Density"
          >
            <TrendingUp size={12} />
          </button>
          <button 
            onClick={() => setViewMode('WATERFALL')}
            className={`p-1 rounded transition-colors ${viewMode === 'WATERFALL' ? 'bg-telemetry-green text-black' : 'text-white/40 hover:bg-white/5'}`}
            title="Orthographic Waterfall"
          >
            <Layers size={12} />
          </button>
          <span className="text-[8px] font-mono text-telemetry-green animate-pulse ml-2 px-1 border border-telemetry-green/20">PK_MODE</span>
        </div>
        <span className={`text-[8px] font-mono uppercase ${!hasData ? 'text-white/20' : isLocked ? 'text-telemetry-green' : 'text-nasa-red'}`}>
          {!hasData ? 'Orthographic_Scan: STANDBY' : isLocked ? 'Orthographic_Scan: LOCKED' : 'Orthographic_Scan: DECRYPTED'}
        </span>
      </div>

      <div className="flex-1 min-h-[0] relative">
        <AnimatePresence>
          {showInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-2 right-2 z-[50] bg-black/95 border border-telemetry-green/30 p-3 shadow-2xl rounded-sm text-[9px] font-mono leading-relaxed"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-telemetry-green font-bold uppercase tracking-tighter">Signal Interpretation</span>
                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white"><X size={12}/></button>
              </div>
              <p className="text-white/70 mb-2">
                Visualization of the <span className="text-telemetry-green font-bold">Spectral Entropy</span> across 9 distinct bit-plane channels. 
              </p>
              <div className="bg-white/5 p-2 border-l border-telemetry-green/30 space-y-1">
                <p>• <span className="text-telemetry-green font-bold">Waveforms:</span> Real-time bit-drift via Rutt-Etra scanline projection.</p>
                <p>• <span className="text-royal-blue font-bold">Hills & Valleys:</span> Integrated temporal density showing manifold convergence.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'HILLS' ? (
          <div className="w-full h-full p-2 bg-black/40 border border-white/5 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={entropyData.map((v, i) => ({ i, v }))}>
                <defs>
                  <linearGradient id="distGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isLocked ? '#FF3300' : '#00FF41'} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={isLocked ? '#FF3300' : '#00FF41'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke={isLocked ? '#FF3300' : '#00FF41'} 
                  strokeWidth={1.5}
                  fill="url(#distGradient)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[7px] font-mono text-white/20 uppercase tracking-tighter">
              <span>Entropy Floor</span>
              <span>Vector Peak: {(Math.max(...entropyData) / 255 * 1024).toFixed(0)} Σ</span>
            </div>
          </div>
        ) : viewMode === 'WATERFALL' ? (
          <div 
            className="w-full h-full border border-white/5 relative cursor-pointer group z-20"
            onClick={() => {
              console.log('Waterfall view clicked');
              setExpandedIndex(1); // Open diagnostic starting with first channel
            }}
           >
            <SpectralWaterfall 
              data={entropyData.slice(0, 64).map(v => (v + 2) / 4)} 
              isLocked={isLocked}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={12} className="text-telemetry-green" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full w-full">
            {NODE_CONFIG.map((node) => {
              const chunk = getTransformedChunk(node.id);
              
              return (
                <div 
                  key={node.id}
                  onClick={() => {
                    console.log(`Node ${node.id} clicked`);
                    setExpandedIndex(node.id);
                  }}
                  className="relative cursor-pointer group border border-white/10 bg-black/40 flex flex-col overflow-hidden min-h-0 z-20 transition-all duration-300 pointer-events-auto"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 255, 65, 0.05)', borderColor: 'rgba(0, 255, 65, 0.4)' }}
                    className="w-full h-full flex flex-col"
                  >
                    {/* Waveform Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-100">
                      <SpectralWaterfall 
                        data={chunk.map(v => (v + 2) / 4)} 
                        isLocked={isLocked}
                      />
                    </div>

                    {/* Clean Minimal HUD - Locked in absolute corners, module is dynamic background */}
                    <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none">
                      <div className="flex justify-between items-start flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          {/* Green Node / Activity Light */}
                          <div className="relative flex-shrink-0">
                            <motion.div 
                              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-telemetry-green shadow-[0_0_8px_#00FF41]" 
                            />
                            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-telemetry-green animate-ping opacity-30" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[6px] font-mono text-white/80 uppercase font-bold tracking-tighter">SIG_NODE_{node.id}</span>
                            <span className="text-[5px] font-mono text-telemetry-green/60">ACTIVE::TRACING</span>
                          </div>
                        </div>
                        <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest bg-black/40 px-1 flex-shrink-0">
                          0x{Math.floor(Math.random() * 255).toString(16).toUpperCase()}
                        </div>
                      </div>

                      <div className="flex justify-between items-end flex-shrink-0">
                        <div className="bg-black/60 px-1 border-l border-telemetry-green/40">
                           <span className="text-[8px] font-mono text-white uppercase font-bold tracking-tighter">{node.label}</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[5px] font-mono text-white/40 uppercase">PK-MODE</span>
                           <span className="text-[6px] font-mono text-telemetry-green font-bold">READY</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Decoration */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Maximize2 size={8} className="text-telemetry-green" />
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expandedIndex !== null && createPortal(
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000000] flex items-center justify-center p-2 sm:p-8 bg-black/98 backdrop-blur-2xl pointer-events-auto"
            onClick={(e) => {
               console.log('Modal background clicked - closing');
               e.stopPropagation();
               setExpandedIndex(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl h-fit max-h-[95vh] bg-black border-2 border-telemetry-green/50 relative overflow-hidden shadow-[0_0_100px_rgba(0,255,65,0.2)] flex flex-col rounded-sm"
            >
              {/* Scanline Detail */}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
              <div className="h-10 border-b border-telemetry-green/30 flex items-center justify-between px-4 bg-telemetry-green/10 flex-shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Activity size={16} className="text-telemetry-green flex-shrink-0" />
                  <span className="font-mono text-[10px] md:text-sm text-white uppercase font-bold tracking-[0.2em] truncate">
                    CHANNEL_DIAGNOSTIC: {expandedIndex && NODE_CONFIG[expandedIndex-1].label}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowInfo(!showInfo)}
                    className={`transition-colors p-1 rounded-full ${showInfo ? 'text-telemetry-green bg-telemetry-green/20' : 'text-white/40 hover:text-telemetry-green'}`}
                  >
                    <HelpCircle size={18} />
                  </button>
                  <button 
                    onClick={() => setExpandedIndex(null)}
                    className="text-white/40 hover:text-telemetry-green transition-colors p-1"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6">
                <div className="flex-[3] min-h-[300px] md:min-h-0 bg-white/2 border border-telemetry-green/20 relative rounded overflow-hidden">
                  <div className="absolute inset-0">
                    <SpectralWaterfall 
                      data={getTransformedChunk(expandedIndex).map(v => (v + 2) / 4)} 
                      isLocked={isLocked}
                    />
                  </div>
                  <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none z-10">
                    <span className="text-[8px] font-mono text-telemetry-green/80 bg-black/80 px-2 py-0.5 border border-telemetry-green/20 uppercase">Spectral_Manifold: ACTIVE</span>
                    <span className="text-[10px] font-mono text-white/50 tracking-tighter">DIAGNOSTIC_COORDS: {Math.random().toFixed(4)}, {Math.random().toFixed(4)}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6 min-w-[260px]">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-telemetry-green/30 pb-1">
                      <Cpu size={14} className="text-telemetry-green" />
                      <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Logic Substrate</h4>
                    </div>
                    <pre className="text-[10px] font-mono text-telemetry-green bg-telemetry-green/5 p-3 rounded border border-telemetry-green/10 whitespace-pre-wrap leading-relaxed">
                      {expandedIndex && NODE_CONFIG[expandedIndex-1].math}
                    </pre>
                  </section>

                  <section className="space-y-3 flex-1">
                     <div className="flex items-center gap-2 border-b border-telemetry-green/30 pb-1">
                      <TrendingUp size={14} className="text-telemetry-green" />
                      <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Stability Analysis</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-2 border border-white/10 rounded">
                           <p className="text-[7px] text-white/30 uppercase mb-1">Entropy H</p>
                           <p className="text-[12px] font-mono text-telemetry-green">7.9942</p>
                        </div>
                        <div className="bg-white/5 p-2 border border-white/10 rounded">
                           <p className="text-[7px] text-white/30 uppercase mb-1">Drift Δ</p>
                           <p className="text-[12px] font-mono text-nasa-red">0.021</p>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-[8px] text-white/40 mb-2 uppercase">Spectral Distribution</p>
                        <div className="flex gap-1 h-2">
                           <div className="flex-1 bg-royal-blue rounded-full" />
                           <div className="flex-1 bg-cyan rounded-full" />
                           <div className="flex-1 bg-telemetry-green rounded-full" />
                           <div className="flex-1 bg-amber rounded-full" />
                           <div className="flex-1 bg-nasa-red rounded-full" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <button 
                    onClick={() => setExpandedIndex(null)}
                    className="mt-auto py-3 bg-telemetry-green/10 hover:bg-telemetry-green/20 text-telemetry-green border border-telemetry-green/50 text-[10px] font-mono font-bold uppercase tracking-[0.3em] transition-all"
                  >
                    Close Diagnostic
                  </button>
                </div>
              </div>

              {/* HUD scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </motion.div>
          </motion.div>,
          document.body
        ) }
      </AnimatePresence>


      <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10 bg-white/5 px-1.5 py-0.5">
        <div className="flex flex-col">
          <span className="text-[7px] font-mono text-white/50 uppercase tracking-tighter">Parity Check</span>
          <span className={`text-[9px] font-mono font-bold ${hasData ? 'text-telemetry-green' : 'text-white/20'}`}>
            {hasData ? 'PASS: 0xFFFF' : 'WAITING...'}
          </span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[7px] font-mono text-white/50 uppercase tracking-tighter">Spatial Entropy</span>
          <span className={`text-[9px] font-mono font-bold ${hasData ? 'text-amber' : 'text-white/20'}`}>
            {hasData ? '0.9882 BIT/DIM' : '0.0000'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EntropyDistribution;
