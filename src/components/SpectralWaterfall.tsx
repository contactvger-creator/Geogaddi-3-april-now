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

      if (data && data.length > 0) {
        history.unshift([...data]);
        if (history.length > maxHistory) history.pop();
      }

      const perspectiveX = width * 0.25;
      const perspectiveY = height * 0.15;
      const drawWidth = width * 0.65;
      const drawHeight = height * 0.6;
      
      const offsetX = (width - drawWidth) / 2 + perspectiveX * 0.5;
      const offsetY = (height - drawHeight) / 2 + perspectiveY;

      ctx.save();
      
      // Draw grid floor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const hRatio = i / 10;
        const yBase = offsetY + hRatio * drawHeight;
        const xOffset = hRatio * perspectiveX;
        const yOffset = hRatio * perspectiveY;
        
        ctx.beginPath();
        ctx.moveTo(offsetX - xOffset, yBase - yOffset);
        ctx.lineTo(offsetX + drawWidth - xOffset, yBase - yOffset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offsetX - (i/10 * perspectiveX) + (i/10 * drawWidth), offsetY - (i/10 * perspectiveY));
        ctx.lineTo(offsetX - perspectiveX + (i/10 * drawWidth), offsetY + drawHeight - perspectiveY);
        ctx.stroke();
      }

      // Heatmap color function (Blue -> Cyan -> Green -> Yellow -> Red)
      const getHeatmapColor = (val: number, alpha: number) => {
        if (isLocked) return `rgba(255, ${Math.floor(51 * (1-val))}, 0, ${alpha})`;
        
        if (val < 0.25) return `rgba(0, ${Math.floor(val * 4 * 255)}, 255, ${alpha})`;
        if (val < 0.5) return `rgba(0, 255, ${Math.floor((1 - (val - 0.25) * 4) * 255)}, ${alpha})`;
        if (val < 0.75) return `rgba(${Math.floor((val - 0.5) * 4 * 255)}, 255, 0, ${alpha})`;
        return `rgba(255, ${Math.floor((1 - (val - 0.75) * 4) * 255)}, 0, ${alpha})`;
      };

      // Draw spectral lines back to front
      for (let h = history.length - 1; h >= 0; h--) {
        const line = history[h];
        const hRatio = 1 - (h / history.length);
        const zAlpha = Math.pow(hRatio, 1.5);
        
        const lineYBase = offsetY + hRatio * drawHeight;
        const lineXOffset = hRatio * perspectiveX;
        const lineYOffset = hRatio * perspectiveY;
        
        // Draw the heatmap line segments
        for (let i = 0; i < line.length - 1; i++) {
          const val1 = line[i] || 0;
          const val2 = line[i+1] || 0;
          const avgVal = (val1 + val2) / 2;

          const x1 = offsetX - lineXOffset + (i / (line.length - 1)) * drawWidth;
          const y1 = lineYBase - lineYOffset - val1 * (drawHeight * 0.5);
          const x2 = offsetX - lineXOffset + ((i + 1) / (line.length - 1)) * drawWidth;
          const y2 = lineYBase - lineYOffset - val2 * (drawHeight * 0.5);

          ctx.beginPath();
          ctx.strokeStyle = getHeatmapColor(avgVal, zAlpha);
          ctx.lineWidth = 1.5;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Fill column connecting to baseline
          if (h % 2 === 0) { // Thinner fill for performance
            ctx.beginPath();
            ctx.fillStyle = getHeatmapColor(avgVal, zAlpha * 0.15);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2, lineYBase - lineYOffset);
            ctx.lineTo(x1, lineYBase - lineYOffset);
            ctx.fill();
          }
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
