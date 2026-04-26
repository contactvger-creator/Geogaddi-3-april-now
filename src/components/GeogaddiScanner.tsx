import React, { useState, useRef } from 'react';
import { Layers, ShieldCheck, RefreshCw, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { parseGeoglyphSVG } from '../lib/geoglyph-io';
import { motion, AnimatePresence } from 'motion/react';

interface GeogaddiScannerProps {
  onScanSuccess: (payload: string, fileName: string) => void;
}

const GeogaddiScanner: React.FC<GeogaddiScannerProps> = ({ onScanSuccess }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setStatus('scanning');
    setErrorMsg('');

    try {
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        const text = await file.text();
        const payload = parseGeoglyphSVG(text);
        
        if (payload) {
          setStatus('success');
          onScanSuccess(payload, file.name);
        } else {
          throw new Error('NO GEOGADDI DATA STREAM FOUND IN SVG METADATA.');
        }
      } else {
        throw new Error('UNSUPPORTED FORMAT. PLEASE PROVIDE A GEOGADDI SVG FINGERPRINT.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'SCAN FAILURE.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex flex-col gap-[var(--spacing-phi-3)] relative">
      <div className="absolute -top-6 right-0">
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="text-white/20 hover:text-royal-blue transition-colors flex items-center gap-1.5"
        >
          <span className="text-[9px] font-mono uppercase tracking-tighter">Scanner Help</span>
          <HelpCircle size={10} />
        </button>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-0 left-0 right-0 z-50 bg-black/95 border border-royal-blue/30 p-4 shadow-2xl rounded-sm"
          >
             <div className="flex justify-between items-center mb-3">
                <span className="text-royal-blue font-mono font-bold uppercase text-[10px] tracking-widest">Spectral Scan Protocol</span>
                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white"><X size={14}/></button>
             </div>
             <p className="text-[10px] font-mono text-white/70 leading-relaxed">
               Drop an SVG fingerprint file previously exported from the vault. 
               The scanner extracts the <span className="text-royal-blue">Hidden Metadata</span> layer embedded within the vector paths to reconstruct the 
               encrypted payload without needing manual password entry.
             </p>
          </motion.div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".svg"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={onDrop}
        className={`p-[var(--spacing-phi-4)] border-2 border-dashed flex flex-col items-center justify-center text-center gap-[var(--spacing-phi-2)] group transition-all cursor-pointer ${
          isHovering 
            ? 'border-telemetry-green bg-telemetry-green/5' 
            : status === 'success' 
              ? 'border-royal-blue bg-royal-blue/5' 
              : status === 'error'
                ? 'border-caution-red bg-caution-red/5'
                : 'border-instrument-blue/50 hover:border-royal-blue'
        }`}
      >
        <div className={`p-[var(--spacing-phi-2)] rounded-full transition-colors ${
          status === 'success' 
            ? 'bg-royal-blue text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]' 
            : status === 'error'
              ? 'bg-caution-red text-white'
              : 'bg-instrument-blue/30 text-white/40 group-hover:text-royal-blue'
        }`}>
          {status === 'scanning' ? <RefreshCw className="animate-spin" size={34} /> : 
           status === 'success' ? <ShieldCheck size={34} /> : 
           status === 'error' ? <AlertTriangle size={34} /> :
           <Layers size={34} />}
        </div>
        <div>
          <h3 className={`text-xs font-mono uppercase transition-colors ${
            status === 'success' ? 'text-white' : 'text-white/60 group-hover:text-white'
          }`}>
            {status === 'scanning' ? 'SPECTRAL SCAN IN PROGRESS...' :
             status === 'success' ? 'DATA STREAM EXTRACTED' :
             status === 'error' ? 'SCAN INTERRUPTED' :
             'Import Vector Fingerprint'}
          </h3>
          <p className="text-[10px] font-mono text-white/20 mt-1 uppercase">
            {status === 'error' ? errorMsg : 'Drop Geogaddi SVG to reconstruct entropy'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeogaddiScanner;
