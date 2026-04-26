import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Activity, 
  Database, 
  Cpu, 
  Globe,
  Binary,
  Layers,
  ChevronRight,
  Terminal as TerminalIcon,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Clock,
  Trash2,
  Share2
} from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import HexStage from './components/HexStage';
import TelemetryGauges from './components/TelemetryGauges';
import ProceduralGeoglyph from './components/ProceduralGeoglyph';
import EntropyHeatmap from './components/EntropyHeatmap';
import EntropyDistribution from './components/EntropyDistribution';
import { quantizeMessage, generateGeoglyphSeeds, encryptPayload, decryptPayload } from './lib/crypto';
import { generateGeoglyphSVG } from './lib/geoglyph-io';
import { SuperstringCompressor } from './lib/superstring';
import GeogaddiScanner from './components/GeogaddiScanner';
import TechnicalSchematics from './components/TechnicalSchematics';
import AvalancheVisualizer from './components/AvalancheVisualizer';
import HexStateGrid from './components/HexStateGrid';

import BackgroundBlueprints from './components/BackgroundBlueprints';

type AppState = 'WRITE' | 'ENCRYPTED' | 'DECRYPTED';

interface VaultItem {
  id: string;
  name: string;
  message: string;
  password: string;
  clayTerrain: number[];
  geoglyphSeed: number[];
  ciphertext?: string;
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode' | 'video' | 'vault' | 'diagnostics'>('encode');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAppState, setCurrentAppState] = useState<AppState>('WRITE');
  const [clayTerrain, setClayTerrain] = useState<number[]>([]);
  const [geoglyphSeed, setGeoglyphSeed] = useState<number[]>([]);
  const [entropyData, setEntropyData] = useState<number[]>(Array.from({ length: 20 }, () => Math.random()));
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [artifactFile, setArtifactFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let interval: number;
    if (currentAppState === 'DECRYPTED') {
      interval = window.setInterval(() => {
        setPhase(prev => (prev < 1024 ? prev + 8 : 1024));
      }, 30);
    } else {
      setPhase(0);
    }
    return () => clearInterval(interval);
  }, [currentAppState]);

  const [videoCrystal, setVideoCrystal] = useState<Uint8Array | null>(null);
  const [processingMsg, setProcessingMsg] = useState('');
  const [reconstructedVideoUrl, setReconstructedVideoUrl] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [recoveredMessage, setRecoveredMessage] = useState<string | null>(null);
  const [activeCiphertext, setActiveCiphertext] = useState<string | null>(null); 
  const [encodedPayload, setEncodedPayload] = useState<{ message: string, pass: string } | null>(null);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [bioSalt, setBioSalt] = useState<string>("");

  // Panic Key Logic
  const handlePanic = useCallback(() => {
    setMessage('');
    setPassword('');
    setRecoveredMessage(null);
    setActiveCiphertext(null);
    setEncodedPayload(null);
    setArtifactFile(null);
    setSelectedVideo(null);
    setReconstructedVideoUrl(null);
    setCurrentAppState('WRITE');
    setProcessingMsg("SYSTEM PURGED. ALL LOCAL BUFFERS WIPED.");
    setActiveTab('encode');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Escape') {
        handlePanic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePanic]);

  const calculateFileHash = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    if (artifactFile) {
      calculateFileHash(artifactFile).then(setBioSalt);
    } else {
      setBioSalt("");
    }
  }, [artifactFile]);

  useEffect(() => {
    const saved = localStorage.getItem('phg_vault');
    if (saved) {
      try {
        setVault(JSON.parse(saved));
      } catch (e) {
        console.error("Vault corruption", e);
      }
    }
  }, []);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const saveToVault = () => {
    // If it's a video, we might not have a text message, so we check for videoCrystal too
    const isVideo = activeTab === 'video' && videoCrystal;
    
    const edinburghTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());

    const atomicStamp = `ATOMIC-${edinburghTime}-EDI`;

    if (!isVideo && !message) return;

    const newItem: VaultItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: atomicStamp,
      message: message,
      password: password,
      clayTerrain,
      geoglyphSeed,
      ciphertext: activeCiphertext || undefined,
      timestamp: Date.now()
    };
    const updated = [newItem, ...vault];
    setVault(updated);
    localStorage.setItem('phg_vault', JSON.stringify(updated));
    
    // Feedback
    setSaveStatus('IDENTITY ARCHIVED');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const removeFromVault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = vault.filter(v => v.id !== id);
    setVault(updated);
    localStorage.setItem('phg_vault', JSON.stringify(updated));
  };

  const loadFromVault = (item: VaultItem) => {
    setMessage(item.message);
    setPassword(item.password);
    setClayTerrain(item.clayTerrain);
    setGeoglyphSeed(item.geoglyphSeed);
    setActiveCiphertext(item.ciphertext || null);
    setEncodedPayload({ message: item.message, pass: item.password });
    setCurrentAppState('ENCRYPTED');
    setActiveTab('decode');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const compressor = useMemo(() => new SuperstringCompressor(), []);

  useEffect(() => {
    compressor.init().catch(console.error);
  }, [compressor]);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.name.endsWith('.shg')) {
      setArtifactFile(file);
      setCurrentAppState('ENCRYPTED'); 
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleExecuteEncoding = useCallback(async () => {
    if (!message || !password) return;
    setIsProcessing(true);
    setCurrentAppState('WRITE');

    try {
      // Step 1: Substrate Preparation (Animated delay)
      setProcessingMsg("Quantizing message entropy...");
      await new Promise(r => setTimeout(r, 800));

      // Real Encryption Channel
      const ciphertext = await encryptPayload(message, password, bioSalt);
      setActiveCiphertext(ciphertext);
      setEncodedPayload({ message, pass: password });

      // Phase 2: Message -> Clay Terrain
      const clay = quantizeMessage(`${password}:${message}`);
      setClayTerrain(clay);

      // Phase 3-4: Geometric Projection
      setCurrentAppState('ENCRYPTED');

      // Channel 4: Geoglyph (Visual seed derived from ciphertext for 1:1 mapping)
      const geo = await generateGeoglyphSeeds(ciphertext);
      setGeoglyphSeed(geo.seed);

      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(e);
      setProcessingMsg("Encoding failure in quantum field. Check parameters.");
    } finally {
      setIsProcessing(false);
    }
  }, [message, password]);

  const handleExecuteDecoding = useCallback(async () => {
    if (!password) {
      setProcessingMsg("GEOGADDI-COMMAND-ERROR: Password required for decryption.");
      return;
    }
    setIsProcessing(true);
    try {
      setProcessingMsg("Stabilizing Riemann field...");
      await new Promise(r => setTimeout(r, 1200));

      if (activeCiphertext) {
        try {
          const decrypted = await decryptPayload(activeCiphertext, password, bioSalt);
          setRecoveredMessage(decrypted);
          setCurrentAppState('DECRYPTED');
        } catch (err) {
          setProcessingMsg("GEOGADDI-COMMAND-ERROR: Key mismatch. Entropy collapse.");
          setCurrentAppState('ENCRYPTED');
        }
      } else {
        setProcessingMsg("GEOGADDI-COMMAND-ERROR: No active cipher stream detected.");
      }
    } catch (e) {
      console.error(e);
      setProcessingMsg("Decryption failure. Verification failed.");
    } finally {
      setIsProcessing(false);
    }
  }, [password, activeCiphertext]);

  const handleVideoUpload = async (file: File) => {
    setSelectedVideo(file);
    // Removed auto-trigger to allow manual button trigger
  };

  const executeVideoCompression = async () => {
    if (!selectedVideo || !password) return;
    setIsProcessing(true);
    setProcessingMsg("Initializing WebGPU Backend...");
    setCurrentAppState('ENCRYPTED');
    
    try {
      const crystal = await compressor.compressVideo(selectedVideo, (msg) => setProcessingMsg(msg));
      setVideoCrystal(crystal);
      setProcessingMsg("Compression Complete. Reconstructing preview...");
      
      const videoEl = await compressor.decompressVideo(crystal, 2);
      const stream = (videoEl.srcObject as MediaStream);
      if (stream) {
          setReconstructedVideoUrl("stream_active");
      }
      
      setCurrentAppState('DECRYPTED');
    } catch (e) {
      console.error(e);
      setProcessingMsg("Supergravity failure: Check WebGPU support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-space-black selection:bg-accent-blue/30 overflow-x-hidden relative font-display">
      <BackgroundBlueprints />
      {/* Lo-fi scanline overlay with chromatic aberration feel */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.06] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.1),rgba(0,255,0,0.01),rgba(0,0,255,0.08))] bg-[length:100%_3px,4px_100%]" />
      
      {/* Green Thermal Glow Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-telemetry-green/20 via-telemetry-green/5 to-transparent pointer-events-none z-0" />
      
      <DashboardHeader onPanic={handlePanic} />

      <main className="flex-1 p-[var(--spacing-phi-3)] md:p-[var(--spacing-phi-4)] grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-phi-3)]">
        {/* Left Column: Visual Channels & Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-[var(--spacing-phi-3)]">
          <HexStage 
            state={currentAppState === 'WRITE' ? 0 : currentAppState === 'ENCRYPTED' ? 1 : 2} 
            phase={phase}
            clayTerrain={clayTerrain} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <EntropyHeatmap input={password} />
            <AvalancheVisualizer input={message + password} />
          </div>
          <ProceduralGeoglyph seed={geoglyphSeed} payload={activeCiphertext || undefined} />
          <div className="lg:hidden">
            <TelemetryGauges data={entropyData} />
          </div>
        </div>

        {/* Center Column: Control Terminal */}
        <div className="lg:col-span-5 flex flex-col gap-[var(--spacing-phi-3)]">
          <div className="nasa-panel flex-1 flex flex-col p-0!">
            <div className="flex border-b border-instrument-blue">
              {(['encode', 'decode', 'video', 'vault', 'diagnostics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-[var(--spacing-phi-2)] px-[var(--spacing-phi-3)] text-[10px] font-mono uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-instrument-blue/40 text-white border-b-2 border-nasa-red' 
                      : 'text-white/40 hover:bg-instrument-blue/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-[var(--spacing-phi-3)] flex-1 flex flex-col gap-[var(--spacing-phi-3)]">
              {activeTab === 'encode' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div className="relative group">
                    <label className="text-[10px] font-mono text-white/40 uppercase mb-2 block tracking-widest">
                      Plaintext Payload Input
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="ENTER SECURE TELEMETRY DATA OR MISSION COMMANDS..."
                      className="w-full h-40 bg-space-black border border-instrument-blue p-4 font-mono text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-accent-blue transition-colors resize-none"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button 
                         onClick={() => setShowPlaintext(!showPlaintext)}
                         className="p-1.5 rounded hover:bg-panel-gray text-white/40 transition-colors"
                      >
                        {showPlaintext ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase block tracking-widest">
                      Command Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER CIPHER KEY..."
                      className="w-full bg-space-black border border-instrument-blue p-3 font-mono text-xs text-white focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-[var(--spacing-phi-3)]">
                    <div className="p-[var(--spacing-phi-2)] border border-instrument-blue bg-panel-gray/30">
                      <div className="flex items-center gap-[var(--spacing-phi-1)] mb-[var(--spacing-phi-1)]">
                        <Globe size={13} className="text-royal-blue" />
                        <h4 className="text-[10px] font-mono uppercase text-white/60">K40 Visual Channel</h4>
                      </div>
                      <div className="h-[var(--spacing-phi-3)] flex items-center justify-center font-mono text-[10px] text-telemetry-green bg-telemetry-green/5 border border-telemetry-green/20 relative overflow-hidden">
                        {isProcessing ? (
                          <span className="flex items-center gap-2 animate-pulse">
                            <RefreshCw size={10} className="animate-spin" />
                            CALIBRATING...
                          </span>
                        ) : (
                          <span className="text-telemetry-green font-bold flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-telemetry-green shadow-[0_0_8px_#00FF41]" />
                            READY
                          </span>
                        )}
                        <motion.div 
                          animate={{ x: [-100, 200] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-telemetry-green/10 to-transparent w-20 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div className="p-[var(--spacing-phi-2)] border border-instrument-blue bg-panel-gray/30">
                      <div className="flex items-center gap-[var(--spacing-phi-1)] mb-[var(--spacing-phi-1)]">
                        <Activity size={13} className="text-amber" />
                        <h4 className="text-[10px] font-mono uppercase text-white/60">S-Key Harmonic</h4>
                      </div>
                      <div className="h-[var(--spacing-phi-3)] flex items-center justify-center font-mono text-[10px] text-amber bg-amber/5 border border-amber/20 relative overflow-hidden">
                        {isProcessing ? (
                          <span className="flex items-center gap-2 animate-pulse">
                            <RefreshCw size={10} className="animate-spin" />
                            SCANNING...
                          </span>
                        ) : password ? (
                          <span className="text-amber font-bold flex items-center gap-2">
                            <div className="w-1 h-3 bg-amber/40 animate-pulse" />
                            0x{password.length > 0 ? (password.length * 11).toString(16).toUpperCase().padStart(4, '0') : '0000'}
                          </span>
                        ) : (
                          <span className="opacity-40 italic">WAITING_FOR_SEED</span>
                        )}
                        <motion.div 
                          animate={{ x: [-100, 200] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber/10 to-transparent w-20 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteEncoding}
                    disabled={isProcessing || !message || !password}
                    className={`w-full py-[var(--spacing-phi-3)] font-mono text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-[var(--spacing-phi-2)] transition-all ${
                      isProcessing || !message || !password
                        ? 'bg-instrument-blue/30 text-white/20 cursor-not-allowed'
                        : 'bg-nasa-blue hover:bg-nasa-red text-white font-bold group'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="animate-spin" size={21} />
                        Processing Tunnel...
                      </>
                    ) : (
                      <>
                        <Lock size={21} className="group-hover:scale-110 transition-transform" />
                        Execute Geogaddi Pipeline
                      </>
                    )}
                  </button>

                  {!isProcessing && currentAppState === 'ENCRYPTED' && (
                    <button
                      onClick={saveToVault}
                      className={`w-full py-[var(--spacing-phi-2)] border border-royal-blue/30 font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-[var(--spacing-phi-1)] transition-all ${
                        saveStatus ? 'bg-telemetry-green text-space-black border-telemetry-green' : 'text-royal-blue hover:bg-royal-blue/10'
                      }`}
                    >
                      {saveStatus ? <ShieldCheck size={13} /> : <Save size={13} />}
                      {saveStatus || 'Save Fingerprint to Vault'}
                    </button>
                  )}
                </motion.div>
              )}

              {activeTab === 'decode' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <GeogaddiScanner 
                    onScanSuccess={async (payload, fileName) => {
                      setIsProcessing(true);
                      setProcessingMsg(`CALIBRATING SENSORS...`);
                      await new Promise(r => setTimeout(r, 600));
                      
                      setActiveCiphertext(payload);
                      const geo = await generateGeoglyphSeeds(payload);
                      setGeoglyphSeed(geo.seed);
                      setProcessingMsg(`SOURCE DETECTED: ${fileName}`);
                      setIsProcessing(false);
                    }} 
                  />
                  
                  <div className="nasa-panel p-4 bg-caution-red/5 border-caution-red/20">
                    <div className="flex gap-3">
                      <ShieldCheck className={activeCiphertext ? "text-telemetry-green" : "text-caution-red shrink-0"} size={13} />
                      <p className={`text-[10px] font-mono leading-relaxed uppercase ${activeCiphertext ? "text-telemetry-green" : "text-caution-red/80"}`}>
                        {activeCiphertext 
                          ? "ACTIVE CIPHER STREAM DETECTED. READY FOR COMMAND OVERRIDE RECOVERY."
                          : "DECRYPTION REQUIRES ACTIVE CARTRIDGE BINDING. PLEASE INSERT PHYSICAL CHANNEL 5 MODULE."
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {bioSalt && (
                      <div className="mb-1 flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-xs animate-pulse">
                        <ShieldCheck size={14} />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-tighter">BIOMETRIC SALT ACTIVE: KEY HARDENED</span>
                      </div>
                    )}
                    <label className="text-[10px] font-mono text-white/40 uppercase block tracking-widest">
                      Recovery Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER CIPHER KEY..."
                      className="w-full bg-space-black border border-instrument-blue p-3 font-mono text-xs text-white focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleExecuteDecoding}
                    disabled={isProcessing || (!artifactFile && !encodedPayload && !activeCiphertext) || !password}
                    className={`w-full py-[var(--spacing-phi-3)] font-mono text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-[var(--spacing-phi-2)] transition-all ${
                        isProcessing || (!artifactFile && !encodedPayload && !activeCiphertext) || !password
                          ? 'bg-instrument-blue/30 text-white/20 cursor-not-allowed'
                          : 'bg-nasa-blue hover:bg-nasa-red text-white font-bold shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="animate-spin" size={21} />
                        <span>RECOVERING...</span>
                      </div>
                    ) : (
                      <>
                        <Unlock size={21} />
                        Execute Decrypt Operation
                      </>
                    )}
                  </button>

                  {recoveredMessage && currentAppState === 'DECRYPTED' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="nasa-panel p-6 border-telemetry-green bg-telemetry-green/5 flex flex-col gap-2"
                    >
                      <h4 className="text-[10px] font-mono text-telemetry-green uppercase tracking-[0.2em] flex items-center gap-2">
                        <TerminalIcon size={13} /> Decrypted Payload Recovered
                      </h4>
                      <p className="font-mono text-sm text-white break-all bg-space-black/50 p-3 border border-telemetry-green/30">
                        {recoveredMessage}
                      </p>
                    </motion.div>
                  )}

                  {isProcessing && (
                    <div className="nasa-panel p-4 border-accent-blue/30 bg-accent-blue/5 flex items-center gap-4">
                      <RefreshCw className="animate-spin text-accent-blue" size={13} />
                      <p className="text-[10px] font-mono text-accent-blue uppercase tracking-widest animate-pulse">
                        {processingMsg}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'video' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <input 
                    type="file" 
                    ref={videoInputRef} 
                    onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                    className="hidden" 
                    accept="video/*"
                  />

                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    className={`p-[var(--spacing-phi-4)] border-2 border-dashed flex flex-col items-center justify-center text-center gap-[var(--spacing-phi-2)] group transition-colors cursor-pointer ${
                      selectedVideo ? 'border-royal-blue bg-royal-blue/5' : 'border-instrument-blue/50 hover:border-royal-blue'
                    }`}
                  >
                    <div className={`p-[var(--spacing-phi-2)] rounded-full transition-colors ${
                      selectedVideo ? 'bg-royal-blue text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]' : 'bg-instrument-blue/30 text-white/40 group-hover:text-royal-blue'
                    }`}>
                      <Cpu size={34} />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono uppercase text-white/60 group-hover:text-white transition-colors">
                        {selectedVideo ? `Target: ${selectedVideo.name}` : 'Superstring Video Compression'}
                      </h3>
                      <p className="text-[10px] font-mono text-white/20 mt-1 uppercase">
                        Requires WebGPU for Supergravity Field Equations
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase block tracking-widest">
                      Decryption Key
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER PASSWORD..."
                      className="w-full bg-space-black border border-instrument-blue p-3 font-mono text-xs text-white focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>

                  <button
                    onClick={executeVideoCompression}
                    disabled={isProcessing || !selectedVideo || !password}
                    className={`w-full py-[var(--spacing-phi-3)] font-mono text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-[var(--spacing-phi-2)] transition-all ${
                      isProcessing || !selectedVideo || !password
                        ? 'bg-instrument-blue/30 text-white/20 cursor-not-allowed'
                        : 'bg-nasa-blue hover:bg-nasa-red text-white font-bold'
                    }`}
                  >
                    {isProcessing ? (
                      <RefreshCw className="animate-spin" size={21} />
                    ) : (
                      <>
                        <Unlock size={21} />
                        Decode Video Crystal
                      </>
                    )}
                  </button>

                  {!isProcessing && videoCrystal && (
                    <button
                      onClick={saveToVault}
                      className={`w-full py-[var(--spacing-phi-2)] border border-royal-blue/30 font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-[var(--spacing-phi-1)] transition-all ${
                        saveStatus ? 'bg-telemetry-green text-space-black border-telemetry-green' : 'text-royal-blue hover:bg-royal-blue/10'
                      }`}
                    >
                      {saveStatus ? <ShieldCheck size={13} /> : <Save size={13} />}
                      {saveStatus || 'Save Crystal Fingerprint'}
                    </button>
                  )}

                  {isProcessing && (
                    <div className="nasa-panel p-4 border-accent-blue/30 bg-accent-blue/5 flex items-center gap-4">
                      <RefreshCw className="animate-spin text-accent-blue" size={13} />
                      <p className="text-[10px] font-mono text-accent-blue uppercase tracking-widest animate-pulse">
                        {processingMsg}
                      </p>
                    </div>
                  )}

                  {videoCrystal && (
                    <div className="nasa-panel p-4 border-telemetry-green/30 bg-telemetry-green/5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-telemetry-green" size={13} />
                        <h4 className="text-[10px] font-mono text-white uppercase tracking-widest">
                          Superstring Crystal Extracted
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 border border-instrument-blue bg-panel-gray">
                          <p className="text-[8px] font-mono text-white/40 uppercase mb-1">Payload Size</p>
                          <p className="text-xs font-mono text-telemetry-green tracking-tighter">384 BYTES (3072 BITS)</p>
                        </div>
                        <div className="p-2 border border-instrument-blue bg-panel-gray">
                          <p className="text-[8px] font-mono text-white/40 uppercase mb-1">Chirality</p>
                          <p className="text-xs font-mono text-telemetry-green tracking-tighter">OPPOSITE [MATCH]</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'vault' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2"
                >
                  <div className="flex items-center justify-between border-b border-instrument-blue/30 pb-2">
                    <div>
                      <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Archived Geoglyphs [N={vault.length}]</h4>
                      <p className="text-[8px] font-mono text-white/20 mt-0.5">Merkle_Root: 0x{Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0')}</p>
                    </div>
                    <Database size={13} className="text-accent-blue animate-pulse" />
                  </div>
                  
                  {vault.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-[var(--spacing-phi-5)]">
                      <Clock size={55} className="mb-[var(--spacing-phi-3)] text-white" />
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-white">Vault is Empty</h3>
                      <p className="text-[8px] font-mono uppercase text-white/60 mt-[var(--spacing-phi-1)]">No active fingerprints archived.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-[var(--spacing-phi-2)]">
                      {vault.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => loadFromVault(item)}
                          data-vault-id={item.id}
                          className="nasa-card relative cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-[var(--spacing-phi-3)]">
                              <div className="w-[var(--spacing-phi-4)] h-[var(--spacing-phi-4)] border border-instrument-blue/50 bg-space-black flex items-center justify-center overflow-hidden">
                                <ProceduralGeoglyph seed={item.geoglyphSeed} size={34} />
                              </div>
                              <div>
                                <h3 className="text-[10px] font-mono text-white uppercase group-hover:text-royal-blue transition-colors">
                                  {item.name}
                                </h3>
                                <p className="text-[8px] font-mono text-white/30 uppercase mt-1">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-[var(--spacing-phi-1)]">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.ciphertext) {
                                    const svg = generateGeoglyphSVG(item.geoglyphSeed, item.ciphertext);
                                    const blob = new Blob([svg], { type: 'image/svg+xml' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `fingerprint_${item.name}.svg`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } else {
                                    // Fallback to canvas if no ciphertext (e.g. video)
                                    const canvas = document.querySelector(`[data-vault-id="${item.id}"] canvas`) as HTMLCanvasElement;
                                    if (canvas) {
                                      const link = document.createElement('a');
                                      link.download = `geoglyph_${item.id}.png`;
                                      link.href = canvas.toDataURL();
                                      link.click();
                                    }
                                  }
                                }}
                                className="p-1.5 text-white/20 hover:text-royal-blue transition-colors"
                                title="Download Fingerprint (SVG)"
                              >
                                <Share2 size={13} />
                              </button>
                              <button 
                                onClick={(e) => removeFromVault(item.id, e)}
                                className="p-1.5 text-white/20 hover:text-caution-red transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="mt-[var(--spacing-phi-2)] text-[8px] font-mono text-telemetry-green/50 truncate flex items-center gap-[var(--spacing-phi-1)]">
                            <Binary size={10} /> 0x{item.geoglyphSeed.slice(0, 4).join('')}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'diagnostics' && (
                  <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
                       <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                          <TechnicalSchematics />
                          <div className="flex flex-col gap-3">
                             <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <Layers size={14} className="text-royal-blue" />
                                <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Rutt-Etra Distribution</h4>
                             </div>
                             <div className="nasa-panel p-0 bg-black overflow-hidden border-2 border-white/5 shadow-2xl flex-1 min-h-[350px]">
                                                                 <EntropyDistribution 
                                    entropyData={clayTerrain.length > 0 ? clayTerrain : []} 
                                    isLocked={currentAppState === 'ENCRYPTED'}
                                 />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          <HexStateGrid input={message || "GEOGADDI_SYSTEM_IDLE"} />
                          <AvalancheVisualizer input={message + password} />
                       </div>

                       <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest border-b border-instrument-blue/30 pb-2">Diagnostic Trace [Log-0x2A]</h4>
                       <div className="flex flex-col gap-2">
                           {[
                               { t: '08:24:12', m: 'Core initialized: McCanney Prime Field GF(23)', s: 'NOMINAL' },
                               { t: '08:24:14', m: 'Quantum entropy pool expanded to 1024-bits', s: 'NOMINAL' },
                               { t: '08:25:01', m: 'CRITICAL: Interface thermal threshold reached', s: 'OVERHEAT' },
                               { t: '08:25:22', m: 'Diverting secondary power to cooling arrays', s: 'STABILIZING' },
                               { t: '08:25:33', m: 'Type IIA supergravity chirality verified', s: 'VERIFIED' }
                           ].map((log, i) => (
                               <div key={i} className={`flex gap-4 p-2 bg-space-black/50 border-l-2 ${log.s === 'OVERHEAT' ? 'border-red-600' : 'border-instrument-blue'}`}>
                                   <span className="text-[9px] font-mono text-accent-blue whitespace-nowrap">{log.t}</span>
                                   <span className={`text-[9px] font-mono flex-1 ${log.s === 'OVERHEAT' ? 'text-red-500' : 'text-white/60'}`}>{log.m}</span>
                                   <span className={`text-[9px] font-mono ${log.s === 'OVERHEAT' ? 'text-red-500' : 'text-telemetry-green'}`}>{log.s}</span>
                               </div>
                           ))}
                       </div>

                       <div className="mt-4 nasa-panel p-4 bg-instrument-blue/5 border-instrument-blue/20">
                           <h4 className="text-[10px] font-mono text-accent-blue uppercase tracking-widest mb-3">Signal Interpretation Protocol</h4>
                           <div className="space-y-3">
                               <div>
                                   <p className="text-[9px] font-mono text-white/80 uppercase">Radial Lines (Fingerprint)</p>
                                   <p className="text-[8px] font-mono text-white/40 leading-relaxed capitalize">
                                       Maps quantized message entropy across the spectral field. Length correlates to magnitude.
                                   </p>
                               </div>
                               <div>
                                   <p className="text-[9px] font-mono text-white/80 uppercase">Data Blips (White/Cyan Dots)</p>
                                   <p className="text-[8px] font-mono text-white/40 leading-relaxed capitalize">
                                       Parity check nodes and key-frame synchronization markers derived from dual-key hash.
                                   </p>
                               </div>
                               <div>
                                   <p className="text-[9px] font-mono text-white/80 uppercase">Hex Labels (0xXX)</p>
                                   <p className="text-[8px] font-mono text-white/40 leading-relaxed capitalize">
                                       Live telemetry feed of the underlying byte stream in its current Riemann curvature state.
                                   </p>
                               </div>
                           </div>
                       </div>
                  </div>
              )}
            </div>

            <div className="p-[var(--spacing-phi-3)] bg-instrument-blue/10 border-t border-instrument-blue flex items-center justify-between">
              <div className="flex items-center gap-[var(--spacing-phi-1)]">
                <div className="w-[var(--spacing-phi-1)] h-[var(--spacing-phi-1)] rounded-full bg-telemetry-green shadow-[0_0_4px_#00ff41]" />
                <span className="text-[9px] font-mono text-white/60 uppercase">System Ready · v3.0.4-STABLE</span>
              </div>
              <Activity size={13} className="text-telemetry-green animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Column: Signal Telemetry */}
        <div className="hidden lg:col-span-3 lg:flex flex-col gap-6">
          <TelemetryGauges data={entropyData} />
        </div>
      </main>

      {/* Footer / Telemetry Bar */}
      <footer className="h-phi-4 bg-panel-gray border-t border-instrument-blue flex items-center px-[var(--spacing-phi-3)] overflow-hidden">
        <div className="flex gap-[var(--spacing-phi-4)] items-center w-full">
           <div className="flex items-center gap-[var(--spacing-phi-2)]">
             <span className="text-[9px] font-mono text-white/30 uppercase">CPU LOAD :</span>
             <div className="w-[var(--spacing-phi-5)] h-[var(--spacing-phi-1)] bg-instrument-blue rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: ['20%', '45%', '30%', '40%'] }} 
                  transition={{ duration: 4, repeat: Infinity }}
                  className="h-full bg-royal-blue" 
                />
             </div>
           </div>
           <div className="flex items-center gap-[var(--spacing-phi-2)]">
             <span className="text-[9px] font-mono text-white/30 uppercase">THREAT LEVEL :</span>
             <span className="text-[9px] font-mono text-telemetry-green">0.02% [NOMINAL]</span>
           </div>
           <div className="flex-1" />
           <div className="hidden md:flex gap-[var(--spacing-phi-3)]">
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] italic">NHB 8071.1 / Section 3.2.1 Compliance Active</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
