import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AvalancheVisualizerProps {
  input: string;
  gridSize?: number;
}

export default function AvalancheVisualizer({ input, gridSize = 12 }: AvalancheVisualizerProps) {
  // We simulate the bits by hashing the input into a seed
  const bits = useMemo(() => {
    const seed = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const result: boolean[] = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      // Simple pseudo-random bit generation based on input index and seed
      const val = Math.sin(seed + i * 1337.42) * 10000;
      result.push((val - Math.floor(val)) > 0.5);
    }
    return result;
  }, [input, gridSize]);

  // Track which bits actually changed since last input
  const [prevBits, setPrevBits] = useState<boolean[]>([]);
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (prevBits.length > 0) {
      const newChanged = new Set<number>();
      bits.forEach((bit, i) => {
        if (bit !== prevBits[i]) {
          newChanged.add(i);
        }
      });
      setChangedIndices(newChanged);
    }
    setPrevBits(bits);
  }, [bits]);

  return (
    <div className="nasa-panel flex flex-col relative overflow-hidden aspect-square shrink-0 z-10 border-2 border-accent-blue/30 bg-black max-h-full">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 flex items-center justify-center p-8 opacity-40">
        <div className="grid grid-cols-12 gap-0.5 w-full aspect-square">
          {bits.map((bit, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ 
                backgroundColor: bit ? (changedIndices.has(i) ? '#00FF41' : '#0066FF') : '#0A0D10',
                scale: changedIndices.has(i) ? [1, 1.4, 1] : 1,
                opacity: bit ? 1 : 0.2,
                boxShadow: bit ? (changedIndices.has(i) ? '0 0 10px rgba(0,255,65,0.6)' : '0 0 5px rgba(0,102,255,0.4)') : 'none'
              }}
              transition={{ 
                duration: changedIndices.has(i) ? 0.4 : 0.2,
                ease: "easeOut"
              }}
              className="w-full h-full rounded-[1px] border-[0.5px] border-white/5"
            />
          ))}
        </div>
      </div>

      {/* HUD UI Layer - Overlay */}
      <div className="relative z-20 flex flex-col h-full p-[var(--spacing-phi-2)] pointer-events-none">
        <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-0.5 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 bg-nasa-red shadow-[0_0_8px_#fc3d21]" />
            <span className="text-[11px] font-mono text-white font-bold uppercase tracking-wider">Avalanche Bit HUD</span>
          </div>
          <span className="text-[8px] font-mono text-telemetry-green uppercase animate-pulse font-bold">● BIT_SCAN_ACTIVE</span>
        </div>

        <div className="flex-1" />

        <div className="flex justify-between items-center pt-1 border-t border-white/10 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">Bit Flux Path</span>
            <span className="text-[11px] font-mono text-telemetry-green font-bold">
              [{changedIndices.size.toString().padStart(3, '0')}] PROPAGATED
            </span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">Diffusion Rate</span>
            <span className="text-[11px] font-mono text-amber font-bold">
              {((changedIndices.size / (gridSize * gridSize)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
