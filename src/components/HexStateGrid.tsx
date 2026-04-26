import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X } from 'lucide-react';

interface HexStateGridProps {
  input: string;
  maxCells?: number;
}

export default function HexStateGrid({ input, maxCells = 48 }: HexStateGridProps) {
  const [showInfo, setShowInfo] = useState(false);
  // Convert input string to hex-like fragments or byte values
  const data = useMemo(() => {
    const bytes = input.split('').map(c => c.charCodeAt(0));
    // Pad or truncate to maxCells
    const result = [...bytes];
    if (result.length < maxCells) {
      // Pad with pseudo-random noise if string is short
      for (let i = result.length; i < maxCells; i++) {
        result.push(Math.floor(Math.random() * 256));
      }
    }
    return result.slice(0, maxCells);
  }, [input, maxCells]);

  const hexPath = "M24 0L41.32 10V30L24 40L6.68 30V10L24 0Z";

  // Hexagon geometry for interlocking (Pointy-topped)
  // width = sqrt(3) * side
  // height = 2 * side
  // horiz_spacing = width
  // vert_spacing = 3/4 * height
  const hexWidth = 34.64;
  const rowHeight = 30;
  const colCount = 8;

  return (
    <div className="nasa-panel flex flex-col relative overflow-hidden aspect-square shrink-0 z-10 border-2 border-amber/30 bg-black">
      {/* Background Hex Grid Layer */}
      <div className="absolute inset-0 flex items-center justify-start p-4 opacity-80">
        <div 
          className="relative origin-left"
          style={{ 
            width: `${colCount * hexWidth + hexWidth / 2}px`,
            height: `${Math.ceil(maxCells / colCount) * rowHeight + 10}px`,
            transform: 'scale(0.95)' 
          }}
        >
          {data.map((byte, i) => {
            const isInputchar = i < input.length;
            const hexValue = byte.toString(16).toUpperCase().padStart(2, '0');
            const row = Math.floor(i / colCount);
            const col = i % colCount;
            const isOffsetRow = row % 2 === 1;

            const left = col * hexWidth + (isOffsetRow ? hexWidth / 2 : 0);
            const top = row * rowHeight;

            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  opacity: isInputchar ? 1 : 0.25,
                  scale: isInputchar ? 1 : 0.9,
                  filter: isInputchar ? 'drop-shadow(0 0 10px rgba(255,149,0,0.6))' : 'none'
                }}
                className="absolute w-[48px] h-[40px] flex items-center justify-center"
                style={{ 
                  left: `${left}px`,
                  top: `${top}px`
                }}
              >
                <svg viewBox="0 0 48 40" className="absolute inset-0 w-full h-full">
                  <motion.path
                    d={hexPath}
                    fill={isInputchar ? "rgba(255, 149, 0, 0.1)" : "transparent"}
                    stroke={isInputchar ? "#FF9500" : "rgba(255,255,255,0.1)"}
                    strokeWidth="1.5"
                    animate={isInputchar ? {
                        strokeWidth: [1.5, 3, 1.5],
                        fill: ["rgba(255, 149, 0, 0.1)", "rgba(255, 149, 0, 0.25)", "rgba(255, 149, 0, 0.1)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </svg>
                <span className={`relative z-10 font-mono text-[11px] font-bold tracking-tighter ${isInputchar ? 'text-white' : 'text-white/20'}`}>
                  {hexValue}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* HUD UI Layer - Overlay */}
      <div className="relative z-20 flex flex-col h-full p-[var(--spacing-phi-2)] pointer-events-none">
        <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-0.5 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 bg-amber shadow-[0_0_8px_#ff9500]" />
            <span className="text-[11px] font-mono text-white font-bold uppercase tracking-wider">McCanney Field Matrix</span>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-white/20 hover:text-amber transition-colors ml-1"
            >
              <HelpCircle size={10} />
            </button>
          </div>
          <span className="text-[8px] font-mono text-white/40 uppercase">Mapping: GF(2^8)</span>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-10 left-4 right-4 z-50 bg-black/95 border border-amber/30 p-3 shadow-2xl rounded-sm text-[9px] font-mono leading-relaxed pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-amber font-bold uppercase tracking-tighter">Matrix Analysis</span>
                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white"><X size={12}/></button>
              </div>
              <p className="text-white/70">
                A Galois Field mapping of the input buffer. 
                Each <span className="text-amber">Amber Hexagon</span> represents a byte-cell transition. 
                The <span className="text-royal-blue font-bold">SHA3-v2</span> engine scrambles these values across the McCanney Prime Field before permutation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        <div className="flex justify-between items-center pt-1 border-t border-white/10 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">Sub-Node Parity</span>
            <span className="text-[10px] font-mono text-amber font-bold tracking-tight">NOMINAL_SYNC</span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">Bit Density</span>
            <span className="text-[10px] font-mono text-telemetry-green font-bold">
              {(input.length / maxCells * 100).toFixed(1)}% LOAD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
