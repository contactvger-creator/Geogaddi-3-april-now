import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Cpu, 
  Zap, 
  Activity, 
  Binary, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  HelpCircle,
  X
} from 'lucide-react';

interface Schematic {
  id: string;
  title: string;
  codename: string;
  description: string;
  component: React.ReactNode;
}

const AESGCMSchematic = () => (
  <div className="relative w-full aspect-video bg-space-black border border-instrument-blue overflow-hidden flex items-center justify-center p-8">
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0066FF_1px,transparent_1px)] bg-[size:20px_20px]" />
    
    <div className="grid grid-cols-5 gap-4 items-center w-full z-10">
      {/* Input */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="w-12 h-12 border border-white/20 bg-white/5 flex items-center justify-center">
          <Binary size={24} className="text-white/60" />
        </div>
        <span className="text-[8px] font-mono uppercase text-white/40">Plaintext</span>
      </motion.div>

      {/* Arrow */}
      <div className="flex flex-col items-center justify-center">
        <motion.div 
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-royal-blue"
        >
          <ChevronRight size={20} />
        </motion.div>
      </div>

      {/* Core */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-2 border-dashed border-royal-blue/30 rounded-full flex items-center justify-center"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-nasa-blue flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.4)]">
              <Shield size={24} className="text-white" />
              <span className="text-[8px] font-mono font-bold mt-1">AES-256</span>
            </div>
          </div>
        </div>
        <span className="text-[8px] font-mono uppercase text-royal-blue font-bold">GCM Channel</span>
      </motion.div>

      {/* Arrow */}
      <div className="flex flex-col items-center justify-center">
        <motion.div 
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="text-royal-blue"
        >
          <ChevronRight size={20} />
        </motion.div>
      </div>

      {/* Output */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="w-12 h-12 border border-telemetry-green/40 bg-telemetry-green/5 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.2)]">
          <Binary size={24} className="text-telemetry-green" />
        </div>
        <span className="text-[8px] font-mono uppercase text-telemetry-green/60">Ciphertext</span>
      </motion.div>
    </div>

    {/* Technical Labels */}
    <div className="absolute bottom-4 left-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-royal-blue" />
        <span className="text-[7px] font-mono text-white/40 uppercase tracking-tighter">AUTH_TAG: GHASH_POLYNOMIAL</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-telemetry-green" />
        <span className="text-[7px] font-mono text-white/40 uppercase tracking-tighter">INTEGRITY_CHECK: PASSED</span>
      </div>
    </div>
  </div>
);

const PrimeFieldSchematic = () => (
  <div className="relative w-full aspect-video bg-space-black border border-instrument-blue overflow-hidden flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
    
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Hexagonal Grid of Primes */}
        {[...Array(23)].map((_, i) => {
          const row = Math.floor(i / 6);
          const col = i % 6;
          const x = 70 + col * 55 + (row % 2 === 0 ? 0 : 27);
          const y = 40 + row * 45;
          const primes = [11, 13, 17, 19, 31, 37, 71, 73, 79, 97, 101, 107, 113, 131, 137, 139, 149, 151, 157, 163, 167, 173, 181];
          
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <path
                d="M30 0 L15 26 L-15 26 L-30 0 L-15 -26 L15 -26 Z"
                transform={`translate(${x}, ${y}) scale(0.6)`}
                fill="none"
                stroke="rgba(0, 102, 255, 0.3)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="text-[10px] font-mono fill-white/60 font-bold"
              >
                {primes[i]}
              </text>
            </motion.g>
          );
        })}

        {/* Highlight Path */}
        <motion.path
          d="M70 40 L125 40 L180 40 L207 85 L262 85 L317 85"
          fill="none"
          stroke="#0066FF"
          strokeWidth="2"
          strokeDasharray="10,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      <div className="absolute top-4 right-4 text-right">
        <h3 className="text-[10px] font-mono text-royal-blue uppercase tracking-widest">McCanney Field GF(23)</h3>
        <p className="text-[8px] font-mono text-white/40 uppercase mt-1">Non-linear Scrambling Matrix</p>
      </div>
    </div>
  </div>
);

const SuperstringSchematic = () => (
  <div className="relative w-full aspect-video bg-space-black border border-instrument-blue overflow-hidden flex items-center justify-center p-4">
    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
    
    <div className="relative w-full h-full flex items-center justify-center gap-8">
      {/* 3D Manifold Simulation */}
      <div className="relative w-32 h-32">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border border-royal-blue/20 rounded-full"
            animate={{ 
              rotateX: [0, 360],
              rotateY: [0, 360],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{ 
              duration: 5 + i, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff]" />
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[8px] font-mono uppercase text-white/40">
            <span>Riemann Curvature</span>
            <span className="text-telemetry-green">0.8423_K</span>
          </div>
          <div className="h-1 bg-instrument-blue overflow-hidden">
            <motion.div 
              className="h-full bg-royal-blue"
              animate={{ width: ["10%", "90%", "30%", "70%"] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[8px] font-mono uppercase text-white/40">
            <span>Chirality Balance</span>
            <span className="text-amber">LEFT_HEAVY</span>
          </div>
          <div className="h-1 bg-instrument-blue overflow-hidden">
            <motion.div 
              className="h-full bg-amber"
              animate={{ width: ["40%", "20%", "80%", "50%"] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="p-2 border border-white/5 bg-white/5">
             <span className="text-[7px] font-mono block text-white/30 truncate">CRYSTAL_INDEX</span>
             <span className="text-[9px] font-mono text-royal-blue">SUPER_G_v2</span>
          </div>
          <div className="p-2 border border-white/5 bg-white/5">
             <span className="text-[7px] font-mono block text-white/30 truncate">RECON_RATIO</span>
             <span className="text-[9px] font-mono text-royal-blue">5120:1</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DiffieHellmanSchematic = () => (
  <div className="relative w-full aspect-video bg-space-black border border-instrument-blue overflow-hidden flex flex-col items-center justify-center p-4">
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0066FF_0.5px,transparent_0.5px)] bg-[size:15px_15px]" />
    
    <div className="flex items-end gap-16 z-10 w-full justify-center">
      {/* Node A */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5">
          <span className="text-[10px] font-mono font-bold">NODE_A</span>
        </div>
        <div className="flex flex-col gap-1 w-full translate-y-2">
          <div className="h-4 w-12 bg-amber/40 border border-amber/60 flex items-center justify-center text-[7px] font-bold text-white uppercase italic">Private</div>
          <div className="h-4 w-12 bg-royal-blue/40 border border-royal-blue/60 flex items-center justify-center text-[7px] font-bold text-white uppercase italic">Public</div>
        </div>
      </div>

      {/* Exchange Path */}
      <div className="flex-1 relative h-32 flex flex-col items-center">
        <svg className="w-full h-full">
          <motion.path 
            d="M 50 110 Q 150 130 250 110" 
            fill="none" 
            stroke="rgba(0, 102, 255, 0.3)" 
            strokeWidth="1" 
            strokeDasharray="4 4"
          />
          <motion.path 
            d="M 50 110 Q 150 130 250 110" 
            fill="none" 
            stroke="rgba(0, 102, 255, 0.8)" 
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          {/* Key Particle */}
          <motion.circle 
            r="3" 
            fill="#0066FF"
            animate={{ offsetDistance: ["0%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ offsetPath: "path('M 50 110 Q 150 130 250 110')" }}
          />
        </svg>
        <div className="absolute top-0 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
            <motion.div 
               className="w-10 h-10 bg-telemetry-green/20 border border-telemetry-green flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)]"
               animate={{ rotate: [0, 90, 180, 270, 360] }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={16} className="text-telemetry-green" />
            </motion.div>
          </div>
          <span className="text-[8px] font-mono text-telemetry-green font-bold mt-2 tracking-widest uppercase">Secret Shared</span>
        </div>
      </div>

      {/* Node B */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5">
          <span className="text-[10px] font-mono font-bold">NODE_B</span>
        </div>
        <div className="flex flex-col gap-1 w-full translate-y-2">
          <div className="h-4 w-12 bg-purple/40 border border-purple/60 flex items-center justify-center text-[7px] font-bold text-white uppercase italic">Private</div>
          <div className="h-4 w-12 bg-royal-blue/40 border border-royal-blue/60 flex items-center justify-center text-[7px] font-bold text-white uppercase italic">Public</div>
        </div>
      </div>
    </div>

    <div className="absolute top-4 left-4">
      <h3 className="text-[10px] font-mono text-royal-blue uppercase tracking-widest">Protocol Seed Negotiation</h3>
      <p className="text-[8px] font-mono text-white/40 uppercase mt-1">Asymmetric Key Exchange (DH-2048)</p>
    </div>
  </div>
);

const MerkleTreeSchematic = () => (
  <div className="relative w-full aspect-video bg-space-black border border-instrument-blue overflow-hidden flex items-center justify-center p-4">
    <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
    
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <svg width="100%" height="80%" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid meet">
        {/* Root */}
        <motion.rect x="180" y="10" width="40" height="20" rx="2" fill="rgba(0, 102, 255, 0.4)" stroke="#0066FF" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <text x="200" y="23" textAnchor="middle" className="text-[8px] font-mono fill-white font-bold">ROOT_HASH</text>

        {/* Level 1 Lines */}
        <line x1="200" y1="30" x2="100" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="200" y1="30" x2="300" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Level 1 Nodes */}
        <rect x="80" y="60" width="40" height="20" rx="2" fill="rgba(255, 255, 255, 0.05)" stroke="white/20" />
        <text x="100" y="73" textAnchor="middle" className="text-[8px] font-mono fill-white/40 uppercase">H1-2</text>
        <rect x="280" y="60" width="40" height="20" rx="2" fill="rgba(255, 255, 255, 0.05)" stroke="white/20" />
        <text x="300" y="73" textAnchor="middle" className="text-[8px] font-mono fill-white/40 uppercase">H3-4</text>

        {/* Level 2 Lines */}
        <line x1="100" y1="80" x2="60" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="100" y1="80" x2="140" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="300" y1="80" x2="260" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="300" y1="80" x2="340" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Level 2 Nodes (Leaves / Fragments) */}
        {[60, 140, 260, 340].map((x, i) => (
          <motion.g key={i}>
            <rect x={x - 20} y="110" width="40" height="20" rx="2" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x={x} y="123" textAnchor="middle" className="text-[7px] font-mono fill-white/20 uppercase">FRAG_{i+1}</text>
            <motion.circle 
              cx={x} cy="110" r="2" 
              fill={i === 1 ? "#00FF41" : "#0066FF"} 
              animate={{ opacity: [1, 0, 1] }} 
              transition={{ delay: i * 0.2, duration: 1, repeat: Infinity }} 
            />
          </motion.g>
        ))}
      </svg>

      <div className="absolute top-4 right-4 text-right">
        <h3 className="text-[10px] font-mono text-royal-blue uppercase tracking-widest">Merkle Integrity Tree</h3>
        <p className="text-[8px] font-mono text-white/40 uppercase mt-1">Recursive Vault Verification</p>
      </div>
    </div>
  </div>
);

export default function TechnicalSchematics() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const schematics: Schematic[] = [
    {
      id: 'aes',
      title: 'K40 Encryption Pipeline',
      codename: 'PROJECT GEOGADDI',
      description: '256-bit AES-GCM substrate with 250,000 PBKDF2 iterations. Features Galois Counter Mode for simultaneous encryption and integrity verification.',
      component: <AESGCMSchematic />
    },
    {
      id: 'dh',
      title: 'Biometric Salt Exchange',
      codename: 'ALICE/BOB PROTOCOL',
      description: 'Diffie-Hellman Key Exchange used to negotiate the unique protocol seed from biometric signatures and hardware entropy.',
      component: <DiffieHellmanSchematic />
    },
    {
      id: 'merkle',
      title: 'Identity Verification Tree',
      codename: 'VERIFICATION ROOT',
      description: 'Merkle Tree recursive hashing used to verify the integrity of the local vault and individual identity archives.',
      component: <MerkleTreeSchematic />
    },
    {
      id: 'prime',
      title: 'Prime Field Scrambler',
      codename: 'MCCANNEY MATRIX',
      description: 'Mathematical substrate utilizing GF(23) McCanney Field primes. Ensures non-linear entropy distribution before local quantum entanglement.',
      component: <PrimeFieldSchematic />
    },
    {
      id: 'superstring',
      title: 'Riemann Manifold Proj.',
      codename: 'SUPERGRAVITY v3',
      description: 'Type IIA Supergravity video compression mapping frames to 11-dimensional superstring crystals. Achieves extreme ratio through Riemann topology.',
      component: <SuperstringSchematic />
    }
  ];

  const current = schematics[activeIdx];

  const next = () => setActiveIdx((activeIdx + 1) % schematics.length);
  const prev = () => setActiveIdx((activeIdx - 1 + schematics.length) % schematics.length);

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-[13px] font-bold uppercase text-white/90 flex items-center gap-2">
              <Zap size={14} className="text-royal-blue" />
              Technical Schematics
            </h3>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Internal Reference Database: LOG-0x7F</p>
          </div>
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className={`p-1.5 rounded-full transition-colors ${showExplanation ? 'bg-royal-blue text-white' : 'text-white/20 hover:text-royal-blue'}`}
          >
            <HelpCircle size={14} />
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prev}
            className="p-2 border border-instrument-blue bg-instrument-blue/20 hover:bg-instrument-blue/40 text-white/60 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={next}
            className="p-2 border border-instrument-blue bg-instrument-blue/20 hover:bg-instrument-blue/40 text-white/60 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-16 left-0 right-0 z-[60] bg-black/95 border border-royal-blue/30 p-4 shadow-2xl rounded-sm"
          >
             <div className="flex justify-between items-center mb-3">
                <span className="text-royal-blue font-mono font-bold uppercase text-[10px] tracking-widest">Protocol Documentation</span>
                <button onClick={() => setShowExplanation(false)} className="text-white/40 hover:text-white"><X size={14}/></button>
             </div>
             <p className="text-[10px] font-mono text-white/70 leading-relaxed">
               These schematics provide a real-time visualization of the cryptographic architecture. 
               Each module corresponds to a specific stage in the 
               <span className="text-royal-blue"> Geogaddi Substrate</span>. 
               Use the arrows to cycle through the encryption pipeline, key exchange, and manifold projection logic.
             </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="nasa-panel p-0! rounded-none!"
          >
            {current.component}
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-nasa-red text-white py-1 px-3 text-[9px] font-mono font-bold tracking-widest uppercase mb-1 inline-block">
            {current.codename}
          </div>
        </div>
      </div>

      <div className="nasa-panel p-4 bg-instrument-blue/5 border-instrument-blue/10">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-royal-blue/10 flex items-center justify-center shrink-0">
            <Info size={14} className="text-royal-blue" />
          </div>
          <div>
            <h4 className="text-[10px] font-mono text-white uppercase tracking-widest">{current.title}</h4>
            <p className="text-[11px] font-display text-white/50 leading-relaxed mt-1">
              {current.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {schematics.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 transition-all ${
              activeIdx === i ? 'bg-royal-blue w-full' : 'bg-instrument-blue w-1/2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
