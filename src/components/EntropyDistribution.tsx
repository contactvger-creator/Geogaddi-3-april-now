import React, { useMemo, useCallback, useState } from 'react';
import { RuttEtraScan } from './RuttEtraScan';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Cpu, Activity, Zap, HelpCircle } from 'lucide-react';

interface EntropyDistributionProps {
  entropyData: number[]; // Expecting a long array of bit data
  isLocked?: boolean;
}

const EntropyDistribution: React.FC<EntropyDistributionProps> = ({ entropyData, isLocked = false }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Process the entropy data into distinct, unique datasets for the 9 nodes
  const hasData = entropyData && entropyData.length > 0;

  // Utility to derive a color based on data characteristics
  const deriveColor = useCallback((chunk: number[], seed: number) => {
    if (!hasData) return "#333333";
    
    // Strict palette: red, indigo, royal blue, sky blue, orange, white
    const palette = [
      "#FF0000", // pure red
      "#4B0082", // deep indigo
      "#0055FF", // royal blue (sharper)
      "#00D2FF", // sky blue
      "#FF4500", // OrangeRed (distinct from yellow)
      "#FFFFFF"  // pure white
    ];

    if (isLocked) {
      // Locked state uses Red/Orange exclusively
      return seed % 2 === 0 ? "#FF0000" : "#FF4500";
    }
    
    // Map the 9 nodes across the 6 colors cyclically or by specific logic
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
    <div className="nasa-panel p-[var(--spacing-phi-2)] flex flex-col gap-2 relative overflow-hidden bg-black border-2 border-white/10 h-full">
      <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <div className={`w-1 h-3 shadow-[0_0_8px_currentColor] ${!hasData ? 'bg-white/20' : isLocked ? 'bg-nasa-red' : 'bg-telemetry-green'}`} />
          <span className="text-[11px] font-mono text-white font-bold uppercase tracking-wider">Entropy Distribution [Σ-1024]</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowInfo(!showInfo)} 
            className={`transition-colors p-1 rounded-full ${showInfo ? 'text-pink-500' : 'text-white/20 hover:text-pink-500'}`}
          >
            <HelpCircle size={14} />
          </button>
          <span className="text-[8px] font-mono text-pink-500 animate-pulse">OVERLAY_MODE: PINK_ACCENT</span>
          <span className={`text-[8px] font-mono uppercase ${!hasData ? 'text-white/20' : isLocked ? 'text-nasa-red' : 'text-telemetry-green'}`}>
            {!hasData ? 'Orthographic_Scan: STANDBY' : isLocked ? 'Orthographic_Scan: LOCKED' : 'Orthographic_Scan: DECRYPTED'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 flex-1 w-full min-h-0">
        {[
          { id: 1, label: "[S-BOX DIFFUSION]", math: "SUB_BYTES: GF(2^8)\nσ(x) = inverse(x) ⊕ 0x63" },
          { id: 2, label: "[GALOIS FIELD Σ]", math: `FIELD: POLY_X8\nΣ_HASH: 0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()}` },
          { id: 3, label: "[BIT-PLANE PERM]", math: `TRANSPOSE: INVERSE\nδ_PERM: 0.${Math.floor(Math.random() * 9000 + 1000)}` },
          { id: 4, label: "[KEY SCHED MATRIX]", math: "EXPANSION: 14_ROUNDS\nRCON: [01, 02, 04...]" },
          { id: 5, label: "[AVALANCHE DELTA]", math: `DIST: HAMMING\nΔ_FLIP: ${Math.floor(Math.random() * 128)} bits` },
          { id: 6, label: "[STATE ENTROPY]", math: "SHANNON: H(X)\nΣ_BITS: 1024" },
          { id: 7, label: "[PARITY DRIFT]", math: "DRYSET: VALID\nSEQ_CHECK: ODD" },
          { id: 8, label: "[ROUND CONSTANTS]", math: "ITER: 0x0E\nCONST: AES_S" },
          { id: 9, label: "[SUPERSTRING Σ]", math: `GEOGADDI: MANIFOLD\nψ_COORD: ${Math.random().toFixed(5)}` },
        ].map((node) => {
          const chunk = getTransformedChunk(node.id);
          const activeColor = deriveColor(chunk, node.id);
          
          return (
            <motion.div 
              key={node.id}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 0, 255, 0.08)' }}
              onClick={(e) => {
                e.stopPropagation();
                if (hasData) setExpandedIndex(node.id);
              }}
              className="relative cursor-pointer group border border-white/5 bg-white/2 flex flex-col z-10"
            >
              <div className="flex-1 min-h-0 relative pointer-events-none">
                <RuttEtraScan 
                  data={chunk} 
                  label={node.label} 
                  color={activeColor} 
                  intensity={hasData ? 1 : 0.2} 
                />
                
                {/* Pixel Nodes Representation - Animated bits */}
                {hasData && (
                  <div className="absolute inset-x-1 inset-y-2 grid grid-cols-16 grid-rows-16 gap-px opacity-60">
                    {Array.from({ length: 256 }).map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: Math.random() > 0.9 ? [0, 1, 0] : 0,
                          backgroundColor: '#FF00FF'
                        }}
                        transition={{ 
                          duration: Math.random() * 2 + 1, 
                          repeat: Infinity,
                          delay: Math.random() * 2
                        }}
                        className="w-full h-full rounded-full scale-[0.5]" 
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Maximize2 size={8} className="text-pink-500" />
              </div>

              {hasData && (
                <div className="absolute top-4 right-1 text-[6px] font-mono text-pink-500 text-right pointer-events-none drop-shadow-[0_0_2px_rgba(255,0,255,0.5)] leading-tight whitespace-pre bg-black/40 px-1 py-0.5 rounded">
                  {node.math}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {expandedIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-5xl h-fit max-h-[95vh] md:h-[80vh] bg-black border-2 border-pink-500/50 relative overflow-hidden shadow-[0_0_50px_rgba(255,0,255,0.2)] flex flex-col rounded-sm"
            >
              <div className="h-10 border-b border-pink-500/30 flex items-center justify-between px-4 bg-pink-500/10 flex-shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Activity size={16} className="text-pink-500 flex-shrink-0" />
                  <span className="font-mono text-[10px] md:text-xs text-white uppercase font-bold tracking-widest truncate">
                    Diagnostic: {expandedIndex && [
                      "", "[S-BOX DIFFUSION]", "[GALOIS FIELD Σ]", "[BIT-PLANE PERM]", "[KEY SCHED MATRIX]", 
                      "[AVALANCHE DELTA]", "[STATE ENTROPY]", "[PARITY DRIFT]", "[ROUND CONSTANTS]", "[SUPERSTRING Σ]"
                    ][expandedIndex]}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button 
                    onClick={() => setShowInfo(!showInfo)}
                    className={`transition-colors p-1.5 rounded-full ${showInfo ? 'bg-pink-500 text-white' : 'text-pink-500 hover:bg-pink-500/20'}`}
                    title="Toggle Signal Information"
                  >
                    <HelpCircle size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setExpandedIndex(null);
                      setShowInfo(false);
                    }}
                    className="text-pink-500 hover:text-white transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 md:p-6 min-h-0 overflow-y-auto custom-scrollbar relative">
                {/* Info Overlay Panel */}
                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute top-2 right-2 md:top-6 md:right-6 w-[280px] md:w-80 bg-black/95 border border-pink-500/40 p-3 md:p-4 z-[110] backdrop-blur-xl shadow-[0_0_30px_rgba(255,0,255,0.2)] rounded-sm"
                    >
                      <button 
                        onClick={() => setShowInfo(false)}
                        className="absolute top-2 right-2 text-white/30 hover:text-white transition-colors"
                      >
                        <X size={12} />
                      </button>
                      <h3 className="text-pink-500 font-mono text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={10} /> Signal Interpretation
                      </h3>
                      <div className="space-y-3 text-[9px] font-mono text-white/70 leading-relaxed">
                        <p>
                          Tracing orthographic waveforms through the <span className="text-pink-400">Rutt-Etra</span> projection space reveals the geometric fingerprints of our encryption algorithm.
                        </p>
                        <div className="bg-pink-500/10 p-2 border-l-2 border-pink-500">
                          <p className="text-pink-300 mb-1 font-bold">LEGEND:</p>
                          <ul className="list-none space-y-1">
                            <li>• <span className="text-pink-500 font-bold">Dynamic Nodes:</span> Contrasting vertex telemetry</li>
                            <li>• <span className="text-white">Wave Displacement:</span> Entropy intensity (H)</li>
                            <li>• <span className="text-pink-300">Overlay Math:</span> Live Galois transform metrics</li>
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-pink-500/20">
                          <p className="text-white/60 mb-2 font-bold uppercase text-[8px]">Spectral Mapping:</p>
                          <div className="flex gap-1.5 h-1.5">
                             <div className="flex-1 bg-[#FF0000] rounded-full" title="Red" />
                             <div className="flex-1 bg-[#4B0082] rounded-full" title="Indigo" />
                             <div className="flex-1 bg-[#0055FF] rounded-full" title="Royal Blue" />
                             <div className="flex-1 bg-[#00D2FF] rounded-full" title="Sky Blue" />
                             <div className="flex-1 bg-[#FF4500] rounded-full" title="Orange" />
                             <div className="flex-1 bg-[#FFFFFF] rounded-full" title="White" />
                          </div>
                        </div>
                        <p className="text-[8px] text-white/30 italic">
                          Each color resonance corresponds to a specific manifold depth in the 2^256 keyspace.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-4 h-full gap-4 md:gap-6 min-h-0">
                  <div className="md:col-span-3 border border-pink-500/20 bg-white/5 relative rounded backdrop-blur-md h-[40vh] md:h-full min-h-[300px] overflow-hidden flex flex-col">
                    <div className="flex-1 bg-black/40">
                      <RuttEtraScan 
                        data={getTransformedChunk(expandedIndex!)} 
                        label="EXPANDED_FIELD_DIAGNOSTIC" 
                        color={deriveColor(getTransformedChunk(expandedIndex!), expandedIndex!)} 
                        intensity={1.1} 
                      />
                    </div>
                    
                    {/* Detailed Math Overlay in Popup */}
                    <div className="absolute top-2 right-2 md:top-4 md:right-6 text-[8px] md:text-[10px] font-mono text-pink-300 text-right space-y-1 md:space-y-2 pointer-events-none drop-shadow-md">
                      <div className="bg-black/90 p-2 border border-pink-500/30 rounded backdrop-blur-md">
                        <p className="text-pink-500 mb-1 border-b border-pink-500/20 pb-1">ALGO_PARAMETERS</p>
                        <p>MOD: 0x{Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}</p>
                        <p>XOR: 0x51E{Math.floor(Math.random() * 9)}</p>
                        <p className="hidden md:block">SUB: SBOX_GF256</p>
                      </div>
                      <div className="bg-black/90 p-2 border border-pink-500/30 rounded backdrop-blur-md">
                        <p className="text-pink-500 mb-1 border-b border-pink-500/20 pb-1">ENTROPY_METRICS</p>
                        <p>SHANNON_H: 7.9942</p>
                        <p>MIN_ENT: 0.9882</p>
                        <p>HAM_WT: {440 + Math.floor(Math.random() * 20)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 nasa-panel border-pink-500/30 p-4 bg-pink-500/5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
                      <div className="flex items-center gap-2 text-pink-500 flex-shrink-0">
                        <Cpu size={14} />
                        <span className="text-[11px] font-mono font-bold tracking-tighter">ALGO_SUBSYSTEM_LOGS</span>
                      </div>
                      <div className="text-[9px] md:text-[10px] font-mono text-white/90 space-y-4">
                        <div className="space-y-2">
                          <p className="text-pink-400 font-bold">STATE_LOGS:</p>
                          <ul className="list-none space-y-1 text-white/50 text-[8px] md:text-[9px]">
                            <li className="flex gap-2"><span>{'>'}</span> <span className="break-all">INIT_SYMMETRIC_EXPANSION</span></li>
                            <li className="flex gap-2"><span className="text-telemetry-green">✔</span> <span>GALOIS_HEAP_READY</span></li>
                            <li className="flex gap-2"><span className="text-telemetry-green">✔</span> <span>BIT_SHIFT_LOCKED</span></li>
                            <li className="flex gap-2"><span>{'>'}</span> <span>V_NORM: {Math.random().toFixed(4)}</span></li>
                            <li className="flex gap-2"><span>{'>'}</span> <span>SYNC: ACTIVE</span></li>
                          </ul>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-pink-400 mb-2 font-bold uppercase text-[8px]">Processor Resonance:</p>
                          <div className="grid grid-cols-4 gap-1.5 h-12">
                            {Array.from({length: 12}).map((_, i) => (
                              <motion.div 
                                key={i} 
                                animate={{ 
                                  height: [10, 24, 10],
                                  opacity: [0.4, 1, 0.4]
                                }}
                                transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                                className={`w-full rounded-sm ${Math.random() > 0.4 ? 'bg-pink-500' : 'bg-white/10'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="p-2 border border-pink-500/20 bg-pink-500/5 rounded text-[8px] text-pink-400/80 leading-relaxed italic">
                            System manifesting quantum tunneling artifacts in the lower bit-planes.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
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
