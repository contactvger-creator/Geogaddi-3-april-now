import React, { useRef, useEffect } from 'react';

interface SpectralWaterfallProps {
  data: number[];
  color?: string;
  isLocked?: boolean;
}

export const SpectralWaterfall: React.FC<SpectralWaterfallProps> = ({ 
  data, 
  color = '#00FF41',
  isLocked = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame: number;
    let history: number[][] = [];
    const maxHistory = 16; // Further reduced for an even sparser Page D wireframe look

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      if (data && data.length > 0) {
        // Sample down data for lower density
        const sampled = [];
        const step = 2; 
        for (let i = 0; i < data.length; i += step) {
          sampled.push(data[i]);
        }
        history.unshift(sampled);
        if (history.length > maxHistory) history.pop();
      } else {
        // Mock data for standby
        const mock = Array.from({ length: 32 }, (_, i) => 0.05 + Math.sin(i * 0.2 + time * 0.002) * 0.02);
        history.unshift(mock);
        if (history.length > maxHistory) history.pop();
      }

      // Proportional but constrained dimensions
      const perspectiveX = Math.min(width * 0.25, 40);
      const perspectiveY = Math.min(height * 0.12, 20);
      const drawWidth = width * 0.7;
      const drawHeight = height * 0.5;
      
      const offsetX = (width - drawWidth) / 2 + perspectiveX * 0.5;
      const offsetY = (height - drawHeight) / 2 + perspectiveY;

      ctx.save();
      
      // Page D HUD Style Header
      ctx.font = '7px monospace';
      ctx.fillStyle = isLocked ? '#00FF41' : '#FF3300';
      ctx.globalAlpha = 0.9;
      ctx.fillText('*** SPECTRAL ANALYSIS ACTIVE ***', offsetX + drawWidth/2 - 50, offsetY - 15);
      ctx.globalAlpha = 1.0;

      // Draw grid floor (Page D Wireframe Style)
      ctx.strokeStyle = isLocked ? 'rgba(0, 255, 65, 0.15)' : 'rgba(255, 51, 0, 0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 8; i++) {
        const ratio = i / 8;
        const xOffset = ratio * perspectiveX;
        const yOffset = ratio * perspectiveY;
        const lineY = offsetY + ratio * drawHeight;

        // Latitudinal lines
        ctx.beginPath();
        ctx.moveTo(offsetX - xOffset, lineY - yOffset);
        ctx.lineTo(offsetX + drawWidth - xOffset, lineY - yOffset);
        ctx.stroke();

        // Longitudinal lines
        const lx = offsetX - perspectiveX + ratio * drawWidth;
        ctx.beginPath();
        ctx.moveTo(lx + perspectiveX, offsetY);
        ctx.lineTo(lx, offsetY + drawHeight);
        ctx.stroke();
      }

      // Draw spectral lines back to front
      for (let h = history.length - 1; h >= 0; h--) {
        const line = history[h];
        if (!line) continue;
        
        const hRatio = 1 - (h / history.length);
        const zAlpha = (h === 0) ? 1.0 : (0.5 + 0.5 * Math.pow(hRatio, 2)); 
        
        const lineYBase = offsetY + hRatio * drawHeight;
        const lineXOffset = hRatio * perspectiveX;
        const lineYOffset = hRatio * perspectiveY;
        
        ctx.beginPath();
        ctx.strokeStyle = isLocked ? `rgba(0, 255, 65, ${zAlpha})` : `rgba(255, 51, 0, ${zAlpha})`;
        ctx.lineWidth = h === 0 ? 2.5 : 1.2;

        for (let i = 0; i < line.length; i++) {
          const val = line[i] || 0;
          const x = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
          const y = lineYBase - lineYOffset - val * (drawHeight * 0.5);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // High-vis peaks for algorithmic feel
        if (h === 0) {
          for (let i = 0; i < line.length; i++) {
            const val = line[i] || 0;
            if (val > 0.65 || (i % 8 === 0 && val > 0.4)) {
              const x = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
              const y = lineYBase - lineYOffset - val * (drawHeight * 0.5);
              
              ctx.beginPath();
              ctx.fillStyle = isLocked ? '#00FF41' : '#FF3300';
              ctx.arc(x, y, 2.5, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.beginPath();
              ctx.fillStyle = '#FFFFFF';
              ctx.arc(x, y, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();

      // Sharp HUD Metrics
      ctx.font = '5px monospace';
      ctx.fillStyle = isLocked ? 'rgba(0, 255, 65, 0.8)' : 'rgba(255, 51, 0, 0.8)';
      ctx.fillText('FIELD: SPECTRAL', 5, height - 15);
      ctx.fillText('SIG: DECODED', 5, height - 8);
      ctx.fillText(`SEQ: ${Math.floor(time / 100).toString(16).toUpperCase()}`, width - 40, height - 8);

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [data, isLocked]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* HUD overlays */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-nasa-red rounded-full animate-pulse" />
          <span className="text-[7px] font-mono text-white/40 uppercase">Spectral_Manifold: REALTIME</span>
        </div>
      </div>
    </div>
  );
};
