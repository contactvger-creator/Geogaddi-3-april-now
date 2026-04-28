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
  { 
    id: 1, 
    label: "[S-BOX DIFFUSION]", 
    math: "SUB_BYTES: GF(2^8)\nσ(x) = inverse(x) ⊕ 0x63",
    description: "Implements high-order non-linearity using Galois Field inversion. The primary mechanism for breaking linear cryptanalysis patterns via spectral scattering.",
    kernel: "KERNEL_0x8F: LINEAR_RECURSION_BLOCK",
    signature: "SPARSE_SPIKE_ARRAY"
  },
  { 
    id: 2, 
    label: "[GALOIS FIELD Σ]", 
    math: "FIELD: POLY_X8\nΣ_HASH: 0xC710",
    description: "Finite field arithmetic module specializing in irreducible polynomial multiplication. Ensures uniform bit-diffusion across the state manifold.",
    kernel: "KERNEL_0x42: POLYNOMIAL_EXP_MAP",
    signature: "GEOMETRIC_LATTICE"
  },
  { 
    id: 3, 
    label: "[BIT-PLANE PERM]", 
    math: "TRANSPOSE: INVERSE\nδ_PERM: 0.4655",
    description: "Performs bit-level transposition of the state matrix. Reorders the sequence to invalidate temporal correlation between adjacent bit-planes.",
    kernel: "KERNEL_0xAB: TRANSPOSE_VAL_INV",
    signature: "PHASE_SHIFT_PULSE"
  },
  { 
    id: 4, 
    label: "[KEY SCHED MATRIX]", 
    math: "EXPANSION: 14_ROUNDS\nRCON: [01, 02, 04...]",
    description: "Generates round keys through recursive expansion. Utilizes rotational logic and round constants to synthesize unique sub-key matrices.",
    kernel: "KERNEL_0xDE: MATRIX_EXPANSION_V4",
    signature: "DENSE_LATTICE_TRACE"
  },
  { 
    id: 5, 
    label: "[AVALANCHE DELTA]", 
    math: "DIST: HAMMING\nΔ_FLIP: 51 bits",
    description: "Analyzes the diffusion property where a single bit change results in approximately 50% bit flip across the entire ciphertext block.",
    kernel: "KERNEL_0xFF: HAMMING_DIST_UNIT",
    signature: "EXPONENTIAL_CLUSTER"
  },
  { 
    id: 6, 
    label: "[STATE ENTROPY]", 
    math: "SHANNON: H(X)\nΣ_BITS: 1024",
    description: "Measures the information density and unpredictability of the internal state. Higher entropy indicates a more robust resistance to pattern analysis.",
    kernel: "KERNEL_0x11: SHANNON_DENSITY_EST",
    signature: "CHAOTIC_PERLIN_MAP"
  },
  { 
    id: 7, 
    label: "[PARITY DRIFT]", 
    math: "DRYSET: VALID\nSEQ_CHECK: ODD",
    description: "Monitors the balance of binary states. Detects systematic bias in the output sequences which could reveal weaknesses in the underlying PRNG.",
    kernel: "KERNEL_0x99: DRIFT_PARITY_SYNC",
    signature: "DRIFTING_SINUSOID"
  },
  { 
    id: 8, 
    label: "[ROUND CONSTANTS]", 
    math: "ITER: 0x0E\nCONST: AES_S",
    description: "Standardized constants injected into the transformation rounds to eliminate symmetry and prevent automated algebraic differential attacks.",
    kernel: "KERNEL_0x66: CONST_ROUND_INJECT",
    signature: "SAWTOOTH_REPETITION"
  },
  { 
    id: 9, 
    label: "[SUPERSTRING Σ]", 
    math: "GEOGADDI: MANIFOLD\nψ_COORD: 0.77182",
    description: "Advanced geometric interpretation of the bit-space. Maps 1024-bit vectors onto a high-dimensional manifold for topological feature extraction.",
    kernel: "KERNEL_0xEE: TOPOLOGICAL_MAPPER",
    signature: "MULTI_HARMONIC_SUM"
  },
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

  const hasData = useMemo(() => entropyData && entropyData.length > 0, [entropyData]);

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
        <button 
          onClick={() => setExpandedIndex(1)}
          className="flex items-center gap-1.5 font-mono group cursor-crosshair outline-none"
        >
          <div className={`w-1 h-3 shadow-[0_0_8px_currentColor] transition-colors ${!hasData ? 'bg-white/20' : isLocked ? 'bg-telemetry-green' : 'bg-nasa-red'}`} />
          <span className="text-[10px] text-white/70 uppercase tracking-widest whitespace-nowrap group-hover:text-telemetry-green transition-colors">
            SIGNALS: SPECTRAL_FIELD_SCAN [Σ-1024]
          </span>
          <Maximize2 size={8} className="text-white/20 group-hover:text-telemetry-green opacity-0 group-hover:opacity-100 transition-all ml-1" />
        </button>
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
          <div className="w-full h-full p-2 bg-black/40 border border-white/5 relative min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={150}>
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
          <button 
            className="w-full h-full border border-white/5 relative cursor-pointer group z-20 outline-none hover:border-telemetry-green/30 active:scale-[0.99] transition-transform"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Waterfall view clicked');
              setExpandedIndex(1); // Open diagnostic starting with first channel
            }}
           >
            <SpectralWaterfall 
              data={getTransformedChunk(5).map(v => (v + 2) / 4)} 
              isLocked={isLocked}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-telemetry-green/5 to-transparent pointer-events-none" />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="text-[8px] font-mono text-telemetry-green/40 uppercase tracking-widest">Orthographic Panorama [Σ-1024]</span>
              <div className="p-1 border border-telemetry-green/30 bg-black/80 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={12} className="text-telemetry-green" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
               <span className="text-[6px] font-mono text-white/30 uppercase">Scan_Vector: 0x01A4</span>
               <span className="text-[10px] font-mono text-white uppercase font-bold tracking-widest">MULTI-PLANE COMPOSITE</span>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full w-full">
            {NODE_CONFIG.map((node) => {
              const chunk = getTransformedChunk(node.id);
              
              return (
                <button 
                  key={node.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Diagnostic request: Node ${node.id}`);
                    setExpandedIndex(node.id);
                  }}
                  className="relative cursor-crosshair group border border-white/10 bg-black/40 flex flex-col overflow-hidden min-h-0 z-[60] transition-all duration-300 outline-none hover:border-telemetry-green/60 hover:bg-telemetry-green/[0.05] active:scale-[0.97]"
                  aria-label={`Open diagnostic for ${node.label}`}
                >
                  {/* Waveform Background - The Dynamic Module */}
                  <div className="absolute inset-0 pointer-events-none opacity-100">
                    <SpectralWaterfall 
                      data={chunk.map(v => (v + 2) / 4)} 
                      isLocked={isLocked}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

                  {/* Locked HUD - Pinned to corners, no vertical stretch in elements */}
                  <div className="absolute inset-0 p-2 pointer-events-none">
                    {/* TOP LEFT: Node Ident */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <div className="relative">
                        <motion.div 
                          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-telemetry-green shadow-[0_0_8px_#00FF41]" 
                        />
                      </div>
                      <div className="flex flex-col leading-none text-left">
                        <span className="text-[6px] font-mono text-white/60 uppercase tracking-tighter">NODE_{node.id.toString().padStart(2, '0')}</span>
                        <span className="text-[5px] font-mono text-telemetry-green/40">CALIBRATED</span>
                      </div>
                    </div>

                    {/* TOP RIGHT: Addr Code */}
                    <div className="absolute top-2 right-2 flex flex-col items-end">
                      <div className="text-[7px] font-mono text-white/10 uppercase tracking-widest bg-black/40 px-1 border border-white/5">
                        0x{node.id.toString(16).toUpperCase()}
                      </div>
                    </div>

                    {/* BOTTOM LEFT: Label */}
                    <div className="absolute bottom-2 left-2 text-left">
                      <div className="p-0.5 border-l border-telemetry-green/40 bg-black/40">
                         <span className="text-[8px] font-mono text-white uppercase font-bold tracking-tighter block truncate max-w-[80px]">{node.label}</span>
                      </div>
                    </div>

                    {/* BOTTOM RIGHT: Ready State */}
                    <div className="absolute bottom-2 right-2 flex flex-col items-end leading-none">
                       <span className="text-[5px] font-mono text-white/20 uppercase">PK-MODE</span>
                       <span className="text-[6px] font-mono text-telemetry-green font-bold">READY</span>
                    </div>
                  </div>
                  
                  {/* Interaction Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-telemetry-green/[0.02] pointer-events-none">
                    <div className="p-1 border border-telemetry-green/30 bg-black/80 rounded-sm">
                      <Maximize2 size={10} className="text-telemetry-green animate-pulse" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {expandedIndex !== null && (
            <motion.div 
              key={`modal-root-${expandedIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl pointer-events-auto"
              onClick={() => setExpandedIndex(null)}
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-6xl h-[85vh] bg-black border-2 border-telemetry-green/40 relative overflow-hidden shadow-[0_0_120px_rgba(0,255,65,0.25)] flex flex-col rounded-lg"
              >
                {/* Scanline Detail Layer */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,4px_100%] z-50" />
                
                {/* Modal Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/[0.03] flex-shrink-0 z-[60]">
                  <div className="flex items-center gap-5 text-left">
                    <div className="relative">
                      <div className="w-3 h-3 bg-telemetry-green rounded-full animate-pulse shadow-[0_0_12px_#00FF41]" />
                      <div className="absolute inset-0 w-3 h-3 bg-telemetry-green rounded-full animate-ping opacity-40" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.3em]">System_Diagnostic_Node</span>
                      <span className="font-mono text-base text-white font-black tracking-[0.2em] uppercase">
                        {NODE_CONFIG[expandedIndex-1]?.label || "SECTOR_UNKNOWN"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4 font-mono">
                      <span className="text-[8px] text-white/20 uppercase">Auth_Level</span>
                      <span className="text-[10px] text-telemetry-green">LEVEL_05_SIGMA</span>
                    </div>
                    <button 
                      onClick={() => setExpandedIndex(null)}
                      className="flex items-center gap-3 px-4 py-2 bg-nasa-red/10 hover:bg-nasa-red/30 text-nasa-red hover:text-white border border-nasa-red/30 transition-all rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest group"
                    >
                      <span>Abort Scan</span>
                      <X size={16} className="group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-8 gap-8 z-[60]">
                  {/* Left: Waveform Visualization */}
                  <div className="flex-[3] bg-black border border-white/10 rounded-sm relative overflow-hidden shadow-inner group flex flex-col">
                    <div className="flex-1 min-h-0 relative">
                      <div className="absolute inset-0 opacity-100">
                        <RuttEtraScan 
                          data={getTransformedChunk(expandedIndex)} 
                          label={NODE_CONFIG[expandedIndex-1]?.label || "NULL_SECTOR"}
                          color={deriveColor(getTransformedChunk(expandedIndex), expandedIndex)}
                          intensity={1.2}
                          lines={16}
                          pointsPerLine={48}
                        />
                      </div>

                      {/* Mini waterfall for context */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-40 pointer-events-none">
                        <SpectralWaterfall 
                          data={getTransformedChunk(expandedIndex).map(v => (v + 2) / 4)} 
                          isLocked={isLocked}
                        />
                      </div>
                    </div>
                    
                    {/* Internal HUD Elements - Locked positions */}
                    <div className="absolute top-5 left-5 flex flex-col gap-1 pointer-events-none text-left z-20">
                      <div className="bg-black/80 border border-telemetry-green/40 p-3 rounded-sm backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={10} className="text-telemetry-green" />
                          <p className="text-[11px] font-mono text-telemetry-green font-black uppercase tracking-[0.2em]">FIELD_STATUS: 0x01_STABLE</p>
                        </div>
                        <p className="text-[9px] font-mono text-white/60 uppercase tracking-tight">SIG_TYPE: {NODE_CONFIG[expandedIndex-1]?.signature || "RAW"}</p>
                        <div className="mt-2 w-full h-[1px] bg-telemetry-green/20" />
                        <p className="text-[8px] font-mono text-white/30 mt-1 uppercase">LOC: {Math.random().toFixed(8).slice(2)}</p>
                      </div>
                    </div>

                    <div className="absolute top-5 right-5 pointer-events-none text-right">
                      <div className="font-mono text-[40px] font-black text-white/[0.03] leading-none select-none">
                        Σ-1024
                      </div>
                      <div className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-widest">{NODE_CONFIG[expandedIndex-1]?.kernel || "TRACING..."}</div>
                    </div>
                  </div>

                  {/* Right: Technical Details */}
                  <div className="flex-1 flex flex-col gap-6 min-w-[340px]">
                    {/* Algorithm Description */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/20 pb-2 text-left">
                        <Layers size={16} className="text-telemetry-green" />
                        <h4 className="text-[11px] font-mono font-black text-white/80 uppercase tracking-[0.2em]">Kernel_Synopsis</h4>
                      </div>
                      <p className="text-[11px] font-mono text-white/60 leading-relaxed text-left bg-white/[0.02] p-4 rounded-sm border border-white/5">
                        {NODE_CONFIG[expandedIndex-1]?.description || "No algorithm documentation found for this sector. System may be running in undocumented shadow mode."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/20 pb-2 text-left">
                        <Cpu size={16} className="text-royal-blue" />
                        <h4 className="text-[11px] font-mono font-black text-white/80 uppercase tracking-[0.2em]">Logic_Lattice</h4>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/10 rounded-sm font-mono text-[11px] text-telemetry-green leading-relaxed shadow-sm text-left">
                        {NODE_CONFIG[expandedIndex-1]?.math.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-3 mb-1">
                            <span className="text-white/20 select-none w-4">{i + 1}</span>
                            <span className="break-all opacity-90">{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 text-left">
                      <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                        <Activity size={16} className="text-nasa-red" />
                        <h4 className="text-[11px] font-mono font-black text-white/80 uppercase tracking-[0.2em]">Temporal_Metrics</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] border border-white/10 p-3 rounded-sm">
                          <p className="text-[8px] text-white/30 uppercase mb-1 tracking-widest font-bold">Bit_Entropy</p>
                          <p className="text-lg font-mono text-white tracking-widest">{(0.98 + Math.random()*0.02).toFixed(4)}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 p-3 rounded-sm">
                          <p className="text-[8px] text-white/30 uppercase mb-1 tracking-widest font-bold">Lattice_Sync</p>
                          <p className="text-lg font-mono text-nasa-red tracking-widest">DRFT</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-1">
                         {['Diffusion_Constant', 'Parity_Integrity', 'Manifold_Depth'].map(label => (
                           <div key={label}>
                             <div className="flex justify-between items-center mb-1 px-0.5">
                               <span className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">{label}</span>
                               <span className="text-[9px] font-mono text-telemetry-green font-bold">{(91 + Math.random()*8).toFixed(2)}%</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${91 + Math.random()*8}%` }}
                                 transition={{ duration: 1.5, ease: "easeOut" }}
                                 className="h-full bg-telemetry-green" 
                               />
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setExpandedIndex(null)}
                      className="w-full py-4 bg-telemetry-green/10 hover:bg-telemetry-green/20 text-telemetry-green border border-telemetry-green/40 text-[11px] font-mono font-black uppercase tracking-[0.5em] transition-all hover:tracking-[0.6em] active:scale-[0.98] rounded-sm shadow-[0_0_20px_rgba(0,255,102,0.1)] mt-auto"
                    >
                      CLOSE_DIAGNOSTIC
                    </button>
                  </div>
                </div>

                {/* Decorative Corner Framing - Locked size */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-telemetry-green/30 rounded-tl-lg pointer-events-none z-50" />
                <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-telemetry-green/30 rounded-tr-lg pointer-events-none z-50" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-telemetry-green/30 rounded-bl-lg pointer-events-none z-50" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-telemetry-green/30 rounded-br-lg pointer-events-none z-50" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}


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
