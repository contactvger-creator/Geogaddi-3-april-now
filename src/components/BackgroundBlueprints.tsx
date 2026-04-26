import React from 'react';

export default function BackgroundBlueprints() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10 z-0">
      {/* Block Cipher Schematic (Subtle Overlay) */}
      <svg className="absolute top-20 right-[-100px] w-[500px] h-[500px] text-royal-blue/20 rotate-12" viewBox="0 0 200 200">
        <rect x="70" y="70" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
        <text x="100" y="105" textAnchor="middle" className="text-[12px] font-mono fill-current font-bold italic tracking-widest">CIPHER_CORE</text>
        <path d="M 40 100 L 70 100" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrow)" />
        <path d="M 130 100 L 160 100" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrow)" />
        <path d="M 100 40 L 100 70" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrow)" />
        <text x="55" y="90" textAnchor="middle" className="text-[8px] font-mono fill-current uppercase">Plaintext</text>
        <text x="145" y="90" textAnchor="middle" className="text-[8px] font-mono fill-current uppercase">Ciphertext</text>
        <text x="100" y="35" textAnchor="middle" className="text-[8px] font-mono fill-current uppercase">Round_Key</text>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
      </svg>

      {/* Another schematic: Network Flow */}
      <svg className="absolute bottom-20 left-[-50px] w-[400px] h-[400px] text-telemetry-green/10 -rotate-6" viewBox="0 0 200 200">
        <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="150" cy="150" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M 70 50 L 130 150" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 2" />
        <path d="M 50 70 L 150 130" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 2" />
        <text x="50" y="55" textAnchor="middle" className="text-[6px] font-mono fill-current uppercase tracking-tighter">Source_A</text>
        <text x="150" y="155" textAnchor="middle" className="text-[6px] font-mono fill-current uppercase tracking-tighter">Dest_B</text>
      </svg>

      {/* Geometric Pruning */}
      <div className="absolute top-[30%] left-[10%] opacity-20 border-l border-b border-royal-blue/30 w-32 h-32">
        <div className="absolute bottom-0 left-0 text-[8px] font-mono text-royal-blue/60 p-1">RECURSIVE_SLICE_0x2A</div>
      </div>
    </div>
  );
}
