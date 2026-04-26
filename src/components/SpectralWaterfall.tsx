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
        const step = 2; // Balanced for readable wireframe density
        for (let i = 0; i < data.length; i += step) {
          sampled.push(data[i]);
        }
        history.unshift(sampled);
        if (history.length > maxHistory) history.pop();
      }

      const perspectiveX = width * 0.25;
      const perspectiveY = height * 0.12;
      const drawWidth = width * 0.6;
      const drawHeight = height * 0.55;
      
      const offsetX = (width - drawWidth) / 2 + perspectiveX * 0.4;
      const offsetY = (height - drawHeight) / 2 + perspectiveY;

      ctx.save();
      
      // Page D HUD Style Header
      ctx.font = '6px monospace';
      ctx.fillStyle = '#00FF41';
      ctx.globalAlpha = 0.3;
      ctx.fillText('*** PAGE D READY ***', offsetX + drawWidth/2 - 30, offsetY - 20);

      // Draw grid floor
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 6; i++) {
        const hRatio = i / 6;
        const yBase = offsetY + hRatio * drawHeight;
        const xOffset = hRatio * perspectiveX;
        const yOffset = hRatio * perspectiveY;
        
        ctx.beginPath();
        ctx.moveTo(offsetX - xOffset, yBase - yOffset);
        ctx.lineTo(offsetX + drawWidth - xOffset, yBase - yOffset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offsetX - (i/6 * perspectiveX) + (i/6 * drawWidth), offsetY - (i/6 * perspectiveY));
        ctx.lineTo(offsetX - perspectiveX + (i/6 * drawWidth), offsetY + drawHeight - perspectiveY);
        ctx.stroke();
      }

      // Draw spectral lines back to front
      for (let h = history.length - 1; h >= 0; h--) {
        const line = history[h];
        const hRatio = 1 - (h / history.length);
        const zAlpha = 0.5 + 0.5 * Math.pow(hRatio, 1.2); // Base 50% opacity, front at 100%
        
        const lineYBase = offsetY + hRatio * drawHeight;
        const lineXOffset = hRatio * perspectiveX;
        const lineYOffset = hRatio * perspectiveY;
        
        ctx.beginPath();
        ctx.strokeStyle = isLocked ? `rgba(0, 255, 65, ${zAlpha})` : `rgba(255, 51, 0, ${zAlpha})`;
        ctx.lineWidth = 1.4;

        for (let i = 0; i < line.length; i++) {
          const val = line[i] || 0;
          const x = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
          const y = lineYBase - lineYOffset - val * (drawHeight * 0.45);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw "nodes" at specific points on the waveform for algorithmic detail
        if (h % 4 === 0) { // Every few lines to avoid clutter
          for (let i = 0; i < line.length; i++) {
            const val = line[i] || 0;
            // Key areas: peaks and certain fixed indices
            if (val > 0.7 || (i % 8 === 0 && val > 0.4)) {
              const x = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
              const y = lineYBase - lineYOffset - val * (drawHeight * 0.45);
              
              ctx.beginPath();
              const nodeAlpha = (h === 0) ? 1 : zAlpha * 0.5;
              ctx.fillStyle = isLocked ? `rgba(0, 255, 65, ${nodeAlpha})` : `rgba(255, 51, 0, ${nodeAlpha})`;
              ctx.arc(x, y, h === 0 ? 2 : 1, 0, Math.PI * 2);
              ctx.fill();
              
              if (h === 0) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }

        // Optional thin fill for depth
        ctx.lineTo(offsetX - lineXOffset + drawWidth, lineYBase - lineYOffset);
        ctx.lineTo(offsetX - lineXOffset, lineYBase - lineYOffset);
        ctx.fillStyle = isLocked ? `rgba(0, 255, 65, ${zAlpha * 0.05})` : `rgba(255, 51, 0, ${zAlpha * 0.05})`;
        ctx.fill();
      }

      ctx.restore();

      // UI Labels
      ctx.font = '5px monospace';
      ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
      ctx.fillText('F:MANIFOLD', offsetX + drawWidth - 10, offsetY + drawHeight + 5);
      ctx.fillText('Σ:AMP', offsetX - perspectiveX - 5, offsetY - perspectiveY);
      ctx.fillText('T:ms', offsetX - 5, offsetY + drawHeight + 10);

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
