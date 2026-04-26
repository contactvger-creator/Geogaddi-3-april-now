import React, { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { generateGeoglyphSVG } from '../lib/geoglyph-io';

interface ProceduralGeoglyphProps {
  seed: number[];
  payload?: string;
  size?: number;
}

const ProceduralGeoglyph: React.FC<ProceduralGeoglyphProps> = ({ seed, payload, size = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadSVG = () => {
    if (!payload) return;
    const svg = generateGeoglyphSVG(seed, payload, size);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geogaddi_fingerprint_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear and Setup
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = seed.length > 0 ? '#40E0D0' : '#121f15';
      ctx.lineWidth = 1.5;
      const center = size / 2;

      if (seed.length === 0) {
        // Draw placeholder
        ctx.beginPath();
        ctx.arc(center, center, size * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      const nSpines = (seed[0] % 11) + 5;
      const nRings = (seed[1] % 3) + 2;
      
      // Draw Central Spines (Turquoise)
      ctx.save();
      ctx.strokeStyle = '#40E0D0';
      ctx.lineWidth = 1.0;
      for (let i = 0; i < nSpines; i++) {
          const sByte = seed[(i + 5) % seed.length] || 0;
          const theta = (i / nSpines) * Math.PI * 2;
          const spineLength = size * 0.08 + (sByte % 15);
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.lineTo(center + spineLength * Math.cos(theta), center + spineLength * Math.sin(theta));
          ctx.stroke();
          
          // Data nodes on spines
          if (sByte > 128) {
              ctx.fillStyle = '#40E0D0';
              ctx.fillRect(center + (spineLength * 0.7) * Math.cos(theta) - 1, center + (spineLength * 0.7) * Math.sin(theta) - 1, 3, 3);
          }
      }
      ctx.restore();

      // Draw Background Purple Radial Spectrogram Overlay
      const nSamples = 180; 
      ctx.save();
      
      // Pixel art style: disable image smoothing for sharp lines/dots
      ctx.imageSmoothingEnabled = false;

      // Draw Background Grids
      ctx.strokeStyle = seed.length > 0 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 65, 0.1)'; 
      ctx.lineWidth = 0.5;
      for(let r = 40; r < size/2; r += 20) {
          ctx.beginPath();
          ctx.arc(center, center, r, 0, Math.PI * 2);
          ctx.stroke();
      }

      // Static background data noise tethered to seed
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#FFFFFF';
      for (let k = 0; k < 60; k++) {
          const sVal = seed[k % seed.length] || 0;
          const rx = (Math.abs(Math.sin(k * 123.4 + sVal)) * size);
          const ry = (Math.abs(Math.cos(k * 567.8 + sVal)) * size);
          ctx.fillRect(Math.floor(rx), Math.floor(ry), 2, 2);
      }

      for (let i = 0; i < nSamples; i++) {
          const theta = (i / nSamples) * Math.PI * 2;
          const dataIndex = i % seed.length;
          const rawValue = seed[dataIndex];
          
          const spectralHeight = 30 + (rawValue % 120);
          const startR = size * 0.14;
          const endR = startR + spectralHeight;
          
          const xEnd = center + endR * Math.cos(theta);
          const yEnd = center + endR * Math.sin(theta);
          
          // Fingerprint lines: Orange radial for highlights, Brighter Purple/Red for density
          ctx.globalAlpha = 0.9;
          if (rawValue > 190) {
              ctx.strokeStyle = '#FF8C00'; // High Detail: Orange
              ctx.lineWidth = 1.8;
          } else if (rawValue > 100) {
              ctx.strokeStyle = '#D400FF'; // Mid Detail: Brighter Purple
              ctx.lineWidth = 0.8;
          } else {
              ctx.strokeStyle = '#FF1E1E'; // Base Detail: Sharp Red
              ctx.lineWidth = 0.6;
          }
          
          ctx.beginPath();
          ctx.moveTo(center + startR * Math.cos(theta), center + startR * Math.sin(theta));
          ctx.lineTo(xEnd, yEnd);
          ctx.stroke();

          // Sharp Pixel-Art "Blips" (Data Nodes)
          if (rawValue > 160 || i % 15 === 0) {
              const blipR = startR + (rawValue % (endR - startR));
              const xBlip = center + blipR * Math.cos(theta);
              const yBlip = center + blipR * Math.sin(theta);
              
              ctx.globalAlpha = 1.0; 
              // Using high-contrast complementary shades
              ctx.fillStyle = rawValue > 220 ? '#FFFFFF' : (rawValue > 140 ? '#FF8C00' : '#FF0000');
              
              // Draw sharp "pixel" blips
              const bSize = rawValue > 240 ? 5 : 3;
              ctx.fillRect(Math.floor(xBlip), Math.floor(yBlip), bSize, bSize);
              
              if (i % 20 === 0) { 
                  ctx.font = '7px "JetBrains Mono"';
                  ctx.fillStyle = '#FFFFFF';
                  const labelOff = 12;
                  ctx.fillText(`+${rawValue}`, xBlip + labelOff, yBlip);
              }
          }

          // Add calibration markers
          if (i % 30 === 0) {
              const labelR = endR + 15;
              const xLabel = center + labelR * Math.cos(theta);
              const yLabel = center + labelR * Math.sin(theta);
              
              ctx.globalAlpha = 1.0;
              ctx.fillStyle = '#FFFFFF';
              ctx.save();
              ctx.translate(xLabel, yLabel);
              ctx.rotate(theta + Math.PI/2);
              ctx.textAlign = 'center';
              ctx.font = 'bold 8px "JetBrains Mono"';
              ctx.fillText(`Φ:${rawValue % 16}`, 0, 0);
              ctx.restore();
              
              ctx.beginPath();
              ctx.rect(Math.floor(xEnd)-1, Math.floor(yEnd)-1, 3, 3);
              ctx.fill();
          }
      }
      ctx.restore();

      // Draw Rings
      for (let j = 0; j < nRings; j++) {
          const ringR = 40 + (j * 20) + (seed[(32+j) % seed.length] % 20);
          ctx.beginPath();
          ctx.arc(center, center, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = '#0066FF'; // Darker blue to match NASA royal-blue
          ctx.lineWidth = 1.6; // Thicker for visibility
          ctx.stroke();
      }
    };

    render();
  }, [seed, size]);

  return (
    <div className="nasa-panel p-[var(--spacing-phi-3)] flex flex-col items-center justify-center min-h-[300px]">
      <div className="absolute top-[var(--spacing-phi-2)] right-[var(--spacing-phi-2)] flex flex-col items-end">
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">
          Channel 4 Fingerprint<br />[SHA3-GEOGLYPH]
        </div>
        {seed.length > 0 && payload && (
          <button 
            onClick={downloadSVG}
            className="mt-2 text-white/40 hover:text-royal-blue transition-colors p-1"
            title="Download Vector Fingerprint"
          >
            <Download size={14} />
          </button>
        )}
      </div>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="max-w-full h-auto opacity-80"
      />
      {seed.length > 0 && (
          <div className="mt-4 flex gap-[var(--spacing-phi-3)] text-[9px] font-mono uppercase">
              <div className="flex flex-col border-r border-white/10 pr-[var(--spacing-phi-2)]">
                <span className="text-white/40">Entropy</span>
                <span className="text-telemetry-green">{(seed.reduce((a, b) => a + b, 0) / (seed.length * 255) * 100).toFixed(2)}%</span>
              </div>
              <div className="flex flex-col border-r border-white/10 pr-[var(--spacing-phi-2)]">
                <span className="text-white/40">Checksum</span>
                <span className="text-amber">{seed.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40">P-Field</span>
                <span className="text-royal-blue">23-McN</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProceduralGeoglyph;
