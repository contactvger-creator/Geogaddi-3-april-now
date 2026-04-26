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
    const maxHistory = 40;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Add new data to history, keeping it constrained
      if (data && data.length > 0) {
        history.unshift([...data]);
        if (history.length > maxHistory) history.pop();
      }

      const perspectiveX = width * 0.2;
      const perspectiveY = height * 0.2;
      const drawWidth = width * 0.7;
      const drawHeight = height * 0.7;
      
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2 + perspectiveY;

      ctx.save();
      
      // Draw grid floor for that orthographic look
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const hRatio = i / 10;
        // Horizontal lines
        ctx.beginPath();
        const yBase = offsetY + hRatio * drawHeight;
        const xModLeft = hRatio * perspectiveX;
        const xModRight = (1 - hRatio) * perspectiveX;
        
        ctx.moveTo(offsetX - xModLeft, yBase - hRatio * perspectiveY);
        ctx.lineTo(offsetX + drawWidth - xModLeft, yBase - hRatio * perspectiveY);
        ctx.stroke();
      }

      // Draw spectral lines from back to front
      for (let h = history.length - 1; h >= 0; h--) {
        const line = history[h];
        const hRatio = 1 - (h / history.length);
        const zAlpha = Math.pow(hRatio, 2);
        
        const lineYBase = offsetY + hRatio * drawHeight;
        const lineXOffset = hRatio * perspectiveX;
        const lineYOffset = hRatio * perspectiveY;
        
        ctx.beginPath();
        ctx.strokeStyle = isLocked ? `rgba(252, 61, 33, ${zAlpha * 0.8})` : `rgba(0, 255, 65, ${zAlpha * 0.8})`;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < line.length; i++) {
          const val = line[i] || 0;
          const x = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
          const y = lineYBase - lineYOffset - val * (drawHeight * 0.4);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill area under the line for solid heat-map effect
        ctx.lineTo(offsetX - lineXOffset + drawWidth, lineYBase - lineYOffset);
        ctx.lineTo(offsetX - lineXOffset, lineYBase - lineYOffset);
        ctx.closePath();
        
        // Gradient fill
        const gradient = ctx.createLinearGradient(0, lineYBase - lineYOffset - drawHeight * 0.4, 0, lineYBase - lineYOffset);
        gradient.addColorStop(0, isLocked ? `rgba(252, 61, 33, ${zAlpha * 0.3})` : `rgba(0, 255, 65, ${zAlpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add "peaks" with warmer colors if they cross a threshold
        ctx.beginPath();
        ctx.lineWidth = 2;
        let hasPeak = false;
        for (let i = 0; i < line.length; i++) {
          const val = line[i] || 0;
          if (val > 0.6) {
            const x = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
            const y = lineYBase - lineYOffset - val * (drawHeight * 0.4);
            if (!hasPeak) {
              ctx.moveTo(x, y);
              hasPeak = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            hasPeak = false;
          }
        }
        if (hasPeak) {
           ctx.strokeStyle = '#FF3300';
           ctx.stroke();
        }
      }

      ctx.restore();

      // UI Labels for axes
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('FREQUENCY (Hz)', offsetX + drawWidth + 5, offsetY + drawHeight);
      ctx.fillText('AMPLITUDE (Σ)', offsetX - perspectiveX - 20, offsetY - perspectiveY);
      ctx.fillText('TIME (ms)', offsetX - 10, offsetY + drawHeight + 15);

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
